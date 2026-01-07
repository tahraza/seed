# Les Interruptions : Quand le Monde Extérieur Frappe à la Porte

Imaginez que vous êtes concentré sur un travail important quand soudain :
- Votre téléphone sonne
- Quelqu'un frappe à la porte
- L'alarme incendie se déclenche

Dans chaque cas, vous devez **interrompre** votre travail actuel, **gérer** l'événement, puis **reprendre** où vous en étiez.

Les **interruptions** en informatique fonctionnent exactement de la même façon : elles permettent au CPU de réagir à des événements externes sans avoir à constamment vérifier leur état.

---

## Pourquoi les Interruptions ?

### Le Problème : Le Polling

Sans interruptions, le CPU doit constamment vérifier si quelque chose s'est passé :

```c
// MAUVAIS : Polling (attente active)
while (1) {
    if (keyboard_has_key()) {
        handle_key();
    }
    if (timer_expired()) {
        handle_timer();
    }
    if (network_has_data()) {
        handle_network();
    }
    // Le CPU ne peut rien faire d'autre !
}
```

**Problèmes du polling** :
- Gaspille des cycles CPU
- Latence variable (peut rater des événements)
- Plus il y a de périphériques, pire c'est

### La Solution : Les Interruptions

```
┌──────────────────────────────────────────────────────────────┐
│                        CPU                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Programme principal                                  │   │
│  │                                                       │   │
│  │  instruction 1                                        │   │
│  │  instruction 2      ←── INTERRUPTION !               │   │
│  │  instruction 3           │                            │   │
│  │  ...                     ↓                            │   │
│  │                   ┌─────────────────┐                 │   │
│  │                   │  Sauvegarde PC  │                 │   │
│  │                   │  Sauvegarde CPSR│                 │   │
│  │                   │  Jump to ISR    │                 │   │
│  │                   └────────┬────────┘                 │   │
│  │                            ↓                          │   │
│  │                   ┌─────────────────┐                 │   │
│  │                   │  Handler (ISR)  │                 │   │
│  │                   │  Traite l'IRQ   │                 │   │
│  │                   └────────┬────────┘                 │   │
│  │                            ↓                          │   │
│  │                   ┌─────────────────┐                 │   │
│  │                   │ Restore PC/CPSR │                 │   │
│  │                   │     RETI        │                 │   │
│  │  instruction 3  ←─┴─────────────────┘                 │   │
│  │  instruction 4                                        │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Avantages** :
- Le CPU travaille normalement jusqu'à l'événement
- Réponse immédiate (latence minimale)
- Scale bien avec le nombre de périphériques

---

## Types d'Interruptions

### Interruptions Matérielles (IRQ)

Déclenchées par des périphériques externes :

| Source | Exemple | Priorité Typique |
|:-------|:--------|:-----------------|
| Timer | Tick système (100 Hz - 1 kHz) | Haute |
| Clavier | Touche pressée | Moyenne |
| Souris | Mouvement, clic | Moyenne |
| Disque | Transfert DMA terminé | Haute |
| Réseau | Paquet reçu | Haute |
| USB | Périphérique connecté | Basse |

### Interruptions Logicielles (Traps/SWI)

Déclenchées intentionnellement par le programme :

```asm
; Appel système (syscall)
MOV R0, #1      ; Code syscall = write
MOV R1, #buffer ; Adresse buffer
MOV R2, #10     ; Longueur
SWI #0          ; Software Interrupt → appelle l'OS
```

### Exceptions

Erreurs pendant l'exécution :

| Exception | Cause | Récupérable ? |
|:----------|:------|:--------------|
| Division par zéro | `DIV R0, R1, #0` | Oui |
| Adresse invalide | Accès hors mémoire | Parfois |
| Instruction invalide | Opcode inconnu | Non |
| Page fault | Page non en RAM | Oui (MMU) |
| Breakpoint | Débogage | Oui |

---

## Architecture d'un Système d'Interruptions

### Le Contrôleur d'Interruptions (PIC/APIC)

```
┌──────────────────────────────────────────────────────────────┐
│              Peripheral Interrupt Controller                  │
│                                                               │
│   IRQ0 (Timer)    ──┐                                        │
│   IRQ1 (Keyboard) ──┼──→ ┌──────────────┐                    │
│   IRQ2 (Cascade)  ──┤    │   Priorité   │                    │
│   IRQ3 (COM2)     ──┤    │   Encoder    │ ──→ INT (CPU)      │
│   IRQ4 (COM1)     ──┤    │              │                    │
│   IRQ5 (LPT2)     ──┤    │  Mask Reg    │                    │
│   IRQ6 (Floppy)   ──┤    │              │                    │
│   IRQ7 (LPT1)     ──┘    └──────────────┘                    │
│                                                               │
│   Registres :                                                 │
│   - IMR (Interrupt Mask Register) : Active/désactive IRQs     │
│   - IRR (Interrupt Request Register) : IRQs en attente        │
│   - ISR (In-Service Register) : IRQ en cours de traitement    │
└──────────────────────────────────────────────────────────────┘
```

### La Table des Vecteurs d'Interruption (IVT)

Chaque interruption a un **numéro** qui indexe une table de pointeurs vers les handlers :

```
┌─────────────────────────────────────────────────┐
│     Interrupt Vector Table (IVT)                │
│     Adresse : 0x00000000 - 0x000003FF           │
├────────┬───────────────────────────────────────┤
│ Vect # │ Adresse du Handler                    │
├────────┼───────────────────────────────────────┤
│ 0      │ 0x00001000  → Reset Handler          │
│ 1      │ 0x00001100  → Undefined Instruction  │
│ 2      │ 0x00001200  → Software Interrupt     │
│ 3      │ 0x00001300  → Prefetch Abort         │
│ 4      │ 0x00001400  → Data Abort             │
│ 5      │ 0x00001500  → Reserved               │
│ 6      │ 0x00001600  → IRQ Handler            │
│ 7      │ 0x00001700  → FIQ Handler            │
│ ...    │ ...                                   │
└────────┴───────────────────────────────────────┘
```

---

## Le Cycle de Vie d'une Interruption

### 1. Détection

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Périphérique│      │     PIC     │      │     CPU     │
│   (Timer)   │      │             │      │             │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │
       │ IRQ0 = 1           │                    │
       │───────────────────>│                    │
       │                    │                    │
       │                    │ INT = 1            │
       │                    │───────────────────>│
       │                    │                    │
```

### 2. Reconnaissance

```
       │                    │                    │
       │                    │                    │ Fin instruction
       │                    │                    │ courante
       │                    │                    │
       │                    │  INTA (Interrupt   │
       │                    │<───────────────────│
       │                    │    Acknowledge)    │
       │                    │                    │
       │                    │  Vector # = 0x20   │
       │                    │───────────────────>│
```

### 3. Sauvegarde du Contexte

Le CPU sauvegarde automatiquement :

```asm
; Ce que le CPU fait automatiquement :
; 1. Désactive les interruptions (I flag = 1)
; 2. Sauvegarde PC dans LR_irq
; 3. Sauvegarde CPSR dans SPSR_irq
; 4. Passe en mode IRQ
; 5. PC = adresse du handler (depuis IVT)
```

### 4. Exécution du Handler (ISR)

```asm
irq_handler:
    ; Sauvegarder les registres utilisés
    PUSH {R0-R3, R12, LR}

    ; Identifier la source de l'IRQ
    LDR R0, =PIC_BASE
    LDR R1, [R0, #IRR_OFFSET]    ; Lire les IRQ en attente

    ; Dispatcher vers le bon handler
    TST R1, #0x01                 ; IRQ0 (Timer) ?
    B.NE timer_handler
    TST R1, #0x02                 ; IRQ1 (Keyboard) ?
    B.NE keyboard_handler
    ; ...

    B irq_done

timer_handler:
    ; Traiter le timer
    BL handle_timer_tick
    ; Acquitter l'IRQ au PIC
    LDR R0, =PIC_BASE
    MOV R1, #0x20                 ; EOI (End Of Interrupt)
    STR R1, [R0, #EOI_OFFSET]
    B irq_done

keyboard_handler:
    ; Lire la touche
    LDR R0, =KEYBOARD_BASE
    LDR R1, [R0]                  ; Scancode
    BL handle_keypress
    ; Acquitter
    LDR R0, =PIC_BASE
    MOV R1, #0x20
    STR R1, [R0, #EOI_OFFSET]
    B irq_done

irq_done:
    ; Restaurer les registres
    POP {R0-R3, R12, LR}
    ; Retour d'interruption
    SUBS PC, LR, #4               ; RETI : restore PC et CPSR
```

### 5. Retour (RETI)

```
SUBS PC, LR, #4
; Cette instruction spéciale :
; 1. Restaure PC depuis LR (moins 4 pour pipeline)
; 2. Restaure CPSR depuis SPSR
; 3. Réactive les interruptions
; 4. Reprend le programme interrompu
```

---

## Gestion des Priorités

### Priorité Fixe vs Programmable

```
┌────────────────────────────────────────────────────────────┐
│               Système de Priorités                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Priorité 0 (Haute) : Reset, NMI                           │
│  Priorité 1         : Data Abort                           │
│  Priorité 2         : FIQ (Fast Interrupt)                 │
│  Priorité 3         : IRQ                                  │
│  Priorité 4 (Basse) : Software Interrupt                   │
│                                                             │
│  Règle : Une IRQ de priorité N peut interrompre            │
│          un handler de priorité < N                         │
└─────────────────────────────────────────────────────────────┘
```

### Interruptions Imbriquées (Nested)

```
Programme principal
       │
       ▼ IRQ1 (basse priorité)
   ┌───────────────────────┐
   │ Handler IRQ1          │
   │    │                  │
   │    ▼ IRQ2 (haute)     │
   │ ┌─────────────────┐   │
   │ │ Handler IRQ2    │   │
   │ │                 │   │
   │ │ RETI            │   │
   │ └────────┬────────┘   │
   │          │            │
   │    ◄─────┘            │
   │ (continue IRQ1)       │
   │                       │
   │ RETI                  │
   └───────────┬───────────┘
               │
       ◄───────┘
(continue programme)
```

Pour autoriser les interruptions imbriquées :

```asm
nested_irq_handler:
    ; Sauver le contexte
    SUB LR, LR, #4
    PUSH {LR}
    MRS LR, SPSR
    PUSH {LR}
    PUSH {R0-R12}

    ; IMPORTANT : Réactiver les interruptions
    ; pour permettre le nesting
    MRS R0, CPSR
    BIC R0, R0, #0x80    ; Clear I bit
    MSR CPSR_c, R0

    ; Traiter l'IRQ...
    BL do_irq_work

    ; Désactiver avant de restaurer
    MRS R0, CPSR
    ORR R0, R0, #0x80
    MSR CPSR_c, R0

    ; Restaurer
    POP {R0-R12}
    POP {LR}
    MSR SPSR_cxsf, LR
    POP {PC}^            ; Restore avec SPSR
```

---

## Latence d'Interruption

### Composants de la Latence

```
┌─────────────────────────────────────────────────────────────┐
│              Temps de Réponse Total                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ T_total = T_recognition + T_save + T_vector + T_handler     │
│                                                              │
│ T_recognition : Temps pour terminer l'instruction courante  │
│                 (1-N cycles selon l'instruction)            │
│                                                              │
│ T_save : Sauvegarde automatique PC/CPSR                     │
│          (~3-5 cycles)                                       │
│                                                              │
│ T_vector : Lecture de l'IVT + jump                          │
│            (~2-4 cycles)                                     │
│                                                              │
│ T_handler : Première instruction utile du handler           │
│                                                              │
│ Total typique : 10-50 cycles (quelques µs)                  │
└─────────────────────────────────────────────────────────────┘
```

### Optimiser la Latence

1. **FIQ (Fast Interrupt Request)** : Registres banqués dédiés
   ```
   Mode FIQ : R8_fiq à R14_fiq sont séparés
   → Pas besoin de PUSH/POP = gain de 20+ cycles
   ```

2. **Handlers courts** : Faire le minimum, déférer le reste
   ```c
   // MAUVAIS : tout dans l'ISR
   void timer_isr() {
       update_all_timers();     // Long !
       recalculate_scheduling(); // Très long !
       ack_interrupt();
   }

   // BON : flag + traitement différé
   volatile int timer_pending = 0;
   void timer_isr() {
       timer_pending = 1;
       ack_interrupt();
   }
   // Dans la boucle principale ou thread dédié :
   if (timer_pending) {
       timer_pending = 0;
       do_heavy_work();
   }
   ```

3. **Interrupt coalescing** : Regrouper plusieurs événements
   ```
   Au lieu de : 1 IRQ par paquet réseau
   Faire      : 1 IRQ pour N paquets ou après T ms
   ```

---

## Interruptions et Systèmes d'Exploitation

### Le Timer : Le Coeur Battant de l'OS

```c
// Tick système (ex: 1000 Hz = toutes les 1 ms)
void timer_handler() {
    // 1. Incrémenter le compteur système
    system_ticks++;

    // 2. Vérifier les timeouts
    check_sleeping_threads();

    // 3. Time-slice scheduling
    current_thread->time_remaining--;
    if (current_thread->time_remaining == 0) {
        schedule();  // Préemption !
    }

    // 4. Mise à jour des statistiques
    if (in_user_mode) user_time++;
    else kernel_time++;
}
```

### Changement de Contexte (Context Switch)

Quand le scheduler décide de changer de thread :

```asm
context_switch:
    ; Sauver le contexte du thread courant
    LDR R0, =current_thread
    LDR R0, [R0]

    ; Sauver tous les registres dans la structure thread
    STMIA R0, {R0-R14}^    ; Registres user mode
    MRS R1, CPSR
    STR R1, [R0, #60]      ; Sauver CPSR

    ; Charger le nouveau thread
    LDR R0, =next_thread
    LDR R0, [R0]

    ; Restaurer son contexte
    LDR R1, [R0, #60]
    MSR CPSR_cxsf, R1
    LDMIA R0, {R0-R14}^

    ; Mettre à jour current_thread
    ; ...

    ; Retour (au nouveau thread)
    MOVS PC, LR
```

---

## Problèmes de Concurrence

### Race Conditions

```c
// PROBLÈME : variable partagée sans protection
volatile int counter = 0;

void main_program() {
    // Peut être interrompu entre ces opérations !
    int temp = counter;    // ← IRQ ICI ?
    temp = temp + 1;       // ← OU ICI ?
    counter = temp;        // ← OU ICI ?
}

void irq_handler() {
    counter++;  // Modification pendant que main lit ?
}

// Résultat possible :
// main lit counter = 5
// IRQ: counter = 6
// main écrit counter = 6  ← Incrémentation perdue !
```

### Sections Critiques

```c
// SOLUTION : désactiver les interruptions
void safe_increment() {
    disable_interrupts();   // CLI
    counter++;
    enable_interrupts();    // STI
}

// En assembleur A32 :
safe_increment:
    MRS R1, CPSR
    ORR R2, R1, #0x80      ; Set I bit
    MSR CPSR_c, R2         ; Disable IRQ

    LDR R0, =counter
    LDR R3, [R0]
    ADD R3, R3, #1
    STR R3, [R0]

    MSR CPSR_c, R1         ; Restore (enable if was)
    BX LR
```

### Attention : Ne Pas Rester Trop Longtemps !

```c
// MAUVAIS : interruptions désactivées trop longtemps
void bad_function() {
    disable_interrupts();
    do_long_operation();    // 10 ms !
    enable_interrupts();
}
// Risque : perte d'IRQ, latence horrible

// BON : minimiser la section critique
void good_function() {
    // Préparation hors section critique
    prepare_data();

    disable_interrupts();
    quick_update();         // < 10 µs
    enable_interrupts();

    // Traitement hors section critique
    process_result();
}
```

---

## Exercices Pratiques

### Exercice 1 : Gestionnaire de Timer Simple

Implémentez un handler de timer qui compte les secondes :

```asm
; Variables globales
.data
ticks:      .word 0
seconds:    .word 0

.text
; TODO: Implémenter timer_handler
; - Incrémenter ticks
; - Si ticks == 1000, incrémenter seconds et reset ticks
; - Acquitter l'interruption
timer_handler:
    ; Votre code ici
```

### Exercice 2 : Buffer Circulaire pour Clavier

```c
// Implémenter un buffer circulaire pour stocker les touches
#define BUFFER_SIZE 16

typedef struct {
    char data[BUFFER_SIZE];
    int head;  // Prochain emplacement d'écriture (ISR)
    int tail;  // Prochain emplacement de lecture (main)
} RingBuffer;

// TODO: Implémenter
void keyboard_isr();        // Ajoute une touche au buffer
int get_key();              // Lit une touche (bloquant ou non)
int buffer_empty();         // Test si vide
```

### Exercice 3 : Ordonnanceur Simple

```c
// Implémenter un scheduler round-robin basé sur timer
#define MAX_THREADS 4
#define TIME_SLICE 10  // ms

typedef struct {
    int id;
    int state;          // READY, RUNNING, BLOCKED
    void* stack_ptr;
    int time_remaining;
} Thread;

// TODO: Implémenter
void scheduler_init();
void timer_isr();           // Décrémente time_remaining, schedule si 0
void schedule();            // Choisit le prochain thread
void context_switch();      // Change de thread
```

### Exercice 4 : Analyse de Latence

Calculez la latence d'interruption pour :
- Instruction en cours : LDM (chargement de 8 registres)
- Sauvegarde automatique : 3 cycles
- Fetch du vecteur : 2 cycles
- Handler : PUSH de 6 registres

---

## Auto-évaluation

### Quiz

**Q1.** Quelle est la différence entre une interruption matérielle et une exception ?

**Q2.** Pourquoi le polling est-il inefficace comparé aux interruptions ?

**Q3.** Que contient la table des vecteurs d'interruption (IVT) ?

**Q4.** Qu'est-ce qu'une race condition et comment l'éviter ?

**Q5.** Pourquoi est-il important que les handlers d'interruption soient courts ?

**Q6.** Expliquez le rôle de l'instruction RETI (ou équivalent).

**Q7.** Qu'est-ce que le FIQ et pourquoi est-il plus rapide que l'IRQ ?

### Exercice de Réflexion

Un système a les caractéristiques suivantes :
- Timer IRQ toutes les 1 ms
- Chaque IRQ timer prend 50 µs à traiter
- Un thread doit répondre à des événements réseau en moins de 100 µs

Ce système peut-il garantir la latence réseau demandée ? Justifiez.

---

## Résumé

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERRUPTIONS                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  TYPES :                                                     │
│  • IRQ  - Matériel externe (timer, clavier, réseau)         │
│  • Trap - Logiciel intentionnel (syscall)                   │
│  • Exception - Erreur (div/0, page fault)                   │
│                                                              │
│  CYCLE :                                                     │
│  1. Événement déclenche l'IRQ                               │
│  2. CPU termine l'instruction courante                      │
│  3. Sauvegarde PC, CPSR                                     │
│  4. Consulte IVT, jump au handler                           │
│  5. Handler traite l'événement                              │
│  6. RETI restaure et reprend                                │
│                                                              │
│  BONNES PRATIQUES :                                          │
│  • Handlers courts (defer le travail lourd)                 │
│  • Protéger les sections critiques                          │
│  • Acquitter les IRQ                                        │
│  • Minimiser le temps interruptions désactivées             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

Les interruptions sont fondamentales pour tout système réactif. Elles permettent au matériel de communiquer efficacement avec le logiciel, et sont la base de concepts avancés comme le multitâche préemptif et les systèmes temps réel.
