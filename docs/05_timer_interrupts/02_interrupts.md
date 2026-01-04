# Chapitre 2: Les Interruptions

## Objectifs
- Comprendre le mécanisme des interruptions
- Configurer le système d'interruptions A32
- Écrire un handler d'interruption

## 2.1 Qu'est-ce qu'une Interruption?

Une interruption est un signal qui interrompt l'exécution normale du CPU pour
traiter un événement urgent. Contrairement au polling:

| Polling                     | Interruptions                    |
|-----------------------------|----------------------------------|
| CPU vérifie périodiquement  | CPU notifié automatiquement      |
| Gaspille des cycles         | CPU libre entre les événements   |
| Latence variable            | Latence prévisible               |
| Simple à implémenter        | Plus complexe                    |

## 2.2 Registres d'Interruption

```
Adresse      Nom           Description
────────────────────────────────────────────────────
0xFFFF0200   INT_ENABLE    Activation globale (0 = désactivé)
0xFFFF0204   INT_PENDING   Interruptions en attente
0xFFFF0208   INT_HANDLER   Adresse du handler
0xFFFF020C   INT_SAVED_PC  PC sauvegardé lors de l'interruption
```

### INT_PENDING - Sources d'interruption

| Bit | Source        | Description                    |
|-----|---------------|--------------------------------|
| 0   | Timer         | Timer a atteint zéro           |

## 2.3 Flux d'Exécution d'une Interruption

```
┌─────────────────────────────────────────────────────────┐
│                    Code normal                          │
│                         │                               │
│              ┌──────────▼──────────┐                    │
│              │  Interruption!      │                    │
│              │  (timer = 0)        │                    │
│              └──────────┬──────────┘                    │
│                         │                               │
│    ┌────────────────────▼────────────────────┐          │
│    │  1. Sauvegarde PC → INT_SAVED_PC        │          │
│    │  2. PC → INT_HANDLER                    │          │
│    │  3. Mode handler activé                 │          │
│    └────────────────────┬────────────────────┘          │
│                         │                               │
│              ┌──────────▼──────────┐                    │
│              │  Handler            │                    │
│              │  d'interruption     │                    │
│              └──────────┬──────────┘                    │
│                         │                               │
│    ┌────────────────────▼────────────────────┐          │
│    │  SVC #0x20 (RETI)                       │          │
│    │  1. PC → INT_SAVED_PC                   │          │
│    │  2. Mode handler désactivé              │          │
│    └────────────────────┬────────────────────┘          │
│                         │                               │
│              ┌──────────▼──────────┐                    │
│              │  Reprend le code    │                    │
│              │  normal             │                    │
│              └─────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

## 2.4 Configuration des Interruptions

```c
// Registres MMIO
int *INT_ENABLE   = (int*)0xFFFF0200;
int *INT_PENDING  = (int*)0xFFFF0204;
int *INT_HANDLER  = (int*)0xFFFF0208;
int *INT_SAVED_PC = (int*)0xFFFF020C;

// Variable globale modifiée par le handler
int interrupt_count;

// Handler d'interruption
void timer_interrupt_handler() {
    interrupt_count = interrupt_count + 1;

    // Acquitte l'interruption timer
    *TIMER_STATUS = 1;    // Efface le flag timer
    *INT_PENDING = 1;     // Efface le pending bit

    // Retour d'interruption
    // En assembleur: SVC #0x20
}

void setup_interrupts() {
    // Configure l'adresse du handler
    // Note: En C pur, on ne peut pas obtenir l'adresse d'une fonction
    // directement. Ceci est une simplification conceptuelle.
    // INT_HANDLER = (int)&timer_interrupt_handler;

    // Active les interruptions globales
    *INT_ENABLE = 1;
}
```

## 2.5 Activation des Interruptions Timer

Pour qu'une interruption timer soit déclenchée, il faut:

1. **TIMER_CTRL bit 1** = 1 (INT_ENABLE du timer)
2. **INT_ENABLE** ≠ 0 (interruptions globales activées)
3. **INT_HANDLER** ≠ 0 (handler configuré)

```c
void init_timer_with_interrupt(int interval) {
    *TIMER_RELOAD = interval;
    *TIMER_VALUE = interval;

    // ENABLE | INT_ENABLE | AUTO_RELOAD = 0b111 = 7
    *TIMER_CTRL = 7;
}
```

## 2.6 Règles Importantes

1. **Ne pas réentrer**: Le handler ne peut pas être interrompu
2. **Court et rapide**: Minimiser le temps dans le handler
3. **Acquitter**: Toujours effacer le flag avant de retourner
4. **Variables volatiles**: Les données partagées doivent être marquées

## 2.7 SVC #0x20 - Retour d'Interruption

L'instruction `SVC #0x20` (RETI) effectue:
1. Restaure PC depuis INT_SAVED_PC
2. Quitte le mode handler

En assembleur:
```asm
timer_handler:
    ; Sauvegarde les registres si nécessaire
    PUSH {R0-R3, LR}

    ; Code du handler...

    ; Acquitte l'interruption
    LDR R0, =0xFFFF010C    ; TIMER_STATUS
    MOV R1, #1
    STR R1, [R0]

    LDR R0, =0xFFFF0204    ; INT_PENDING
    STR R1, [R0]

    ; Restaure les registres
    POP {R0-R3, LR}

    ; Retour d'interruption
    SVC #0x20
```

## Exercices

1. **Handler simple**: Écrivez un handler qui incrémente un compteur global
2. **LED clignotante**: Utilisez les interruptions pour faire clignoter un pixel
3. **Temps réel**: Créez un compteur de millisecondes avec les interruptions

## Points clés

- Les interruptions libèrent le CPU du polling
- Un handler doit être rapide et acquitter l'interruption
- SVC #0x20 (RETI) retourne au code interrompu
- Le mode handler empêche les interruptions imbriquées
