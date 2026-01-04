# Chapitre 1: Le Timer Hardware

## Objectifs
- Comprendre le fonctionnement d'un timer matériel
- Manipuler les registres MMIO du timer
- Utiliser le polling pour détecter les événements timer

## 1.1 Qu'est-ce qu'un Timer?

Un timer est un compteur matériel qui décrémente automatiquement à chaque cycle
CPU. Quand il atteint zéro, il peut:
- Lever un drapeau (flag)
- Déclencher une interruption
- Se recharger automatiquement

## 1.2 Registres MMIO du Timer

```
Adresse      Nom           Description
────────────────────────────────────────────────────
0xFFFF0100   TIMER_VALUE   Valeur courante (décompte)
0xFFFF0104   TIMER_RELOAD  Valeur de rechargement
0xFFFF0108   TIMER_CTRL    Registre de contrôle
0xFFFF010C   TIMER_STATUS  Registre de statut
```

### TIMER_CTRL - Bits de contrôle

| Bit | Nom         | Description                              |
|-----|-------------|------------------------------------------|
| 0   | ENABLE      | 1 = Timer actif                          |
| 1   | INT_ENABLE  | 1 = Interruption activée                 |
| 2   | AUTO_RELOAD | 1 = Rechargement automatique à zéro      |

### TIMER_STATUS - Bits de statut

| Bit | Nom     | Description                                  |
|-----|---------|----------------------------------------------|
| 0   | PENDING | 1 = Timer a atteint zéro (écrire 1 pour RAZ) |

## 1.3 Exemple: Configuration du Timer

```c
// Pointeurs vers les registres MMIO
int *TIMER_VALUE  = (int*)0xFFFF0100;
int *TIMER_RELOAD = (int*)0xFFFF0104;
int *TIMER_CTRL   = (int*)0xFFFF0108;
int *TIMER_STATUS = (int*)0xFFFF010C;

void init_timer(int interval) {
    // Configure l'intervalle
    *TIMER_RELOAD = interval;
    *TIMER_VALUE = interval;

    // Active le timer avec auto-reload
    // Bits: ENABLE | AUTO_RELOAD = 0b101 = 5
    *TIMER_CTRL = 5;
}
```

## 1.4 Polling du Timer

Le polling consiste à vérifier périodiquement un registre:

```c
void wait_timer() {
    // Attend que le timer atteigne zéro
    while ((*TIMER_STATUS & 1) == 0) {
        // Attente active
    }

    // Efface le flag en écrivant 1
    *TIMER_STATUS = 1;
}

int main() {
    init_timer(1000);

    while (1) {
        wait_timer();
        println("Tick!");
    }

    return 0;
}
```

## 1.5 Inconvénients du Polling

1. **Gaspillage CPU**: Le processeur est occupé à vérifier le registre
2. **Latence variable**: Le temps de réponse dépend de la boucle
3. **Pas de multitâche**: Le CPU ne peut rien faire d'autre

Solution: Les **interruptions** (chapitre suivant)

## Exercices

1. **Timer simple**: Configurez un timer qui se déclenche toutes les 500 instructions
2. **Chronomètre**: Utilisez le timer pour mesurer le temps d'exécution d'une fonction
3. **Clignotement**: Faites clignoter un pixel sur l'écran avec le timer

## Points clés

- Un timer est un compteur matériel qui décrémente automatiquement
- Les registres MMIO permettent de configurer et lire l'état du timer
- Le polling est simple mais gaspille des cycles CPU
- L'auto-reload permet de créer des événements périodiques
