# Chapitre 3: Les Coroutines

## Objectifs
- Comprendre le multitâche coopératif
- Implémenter un scheduler simple
- Gérer le contexte d'exécution

## 3.1 Multitâche Coopératif vs Préemptif

| Coopératif (Coroutines)     | Préemptif (Threads)           |
|-----------------------------|-------------------------------|
| Tâches cèdent volontairement| CPU interrompt les tâches     |
| Simple, déterministe        | Complexe, non-déterministe    |
| Pas de race conditions      | Risque de race conditions     |
| Une tâche peut bloquer tout | Équité garantie               |

## 3.2 Concept de Coroutine

Une coroutine est une fonction qui peut:
1. **Suspendre** son exécution (yield)
2. **Reprendre** là où elle s'était arrêtée
3. **Conserver** son état entre les appels

```
Tâche A          Tâche B          Tâche C
   │                │                │
   ▼                │                │
  [A1]              │                │
   │ yield()        │                │
   └───────────────►▼                │
                  [B1]               │
                   │ yield()         │
                   └────────────────►▼
                                   [C1]
                                    │ yield()
   ◄────────────────────────────────┘
   ▼
  [A2]
   ...
```

## 3.3 Structure d'une Coroutine Simple

Sans vrai contexte CPU, on utilise des machines à états:

```c
// État de chaque tâche
int task_state[4];     // 0 = terminée, 1 = active
int task_counter[4];   // Compteur interne
int current_task;      // Tâche courante

// Initialisation
void scheduler_init() {
    int i;
    current_task = 0;
    i = 0;
    while (i < 4) {
        task_state[i] = 1;
        task_counter[i] = 0;
        i = i + 1;
    }
}
```

## 3.4 Le Scheduler Round-Robin

```c
// Trouve la prochaine tâche active
int scheduler_next() {
    int i;
    i = 0;
    while (i < 4) {
        current_task = (current_task + 1) % 4;
        if (task_state[current_task]) {
            return current_task;
        }
        i = i + 1;
    }
    return -1;  // Toutes terminées
}

// Vérifie s'il reste des tâches
int scheduler_has_active() {
    int i;
    i = 0;
    while (i < 4) {
        if (task_state[i]) {
            return 1;
        }
        i = i + 1;
    }
    return 0;
}
```

## 3.5 Exemple de Tâches

```c
// Tâche A: compte de 1 à 5
void task_a_step() {
    if (task_counter[0] >= 5) {
        task_state[0] = 0;  // Terminée
        return;
    }
    task_counter[0] = task_counter[0] + 1;
    print("  [A] Compteur: ");
    print_int(task_counter[0]);
    println("");
}

// Tâche B: compte de 10 à 13
void task_b_step() {
    if (task_counter[1] >= 4) {
        task_state[1] = 0;
        return;
    }
    task_counter[1] = task_counter[1] + 1;
    print("  [B] Valeur: ");
    print_int(task_counter[1] + 9);
    println("");
}
```

## 3.6 Boucle Principale

```c
int main() {
    int round;

    println("=== Demo Coroutines ===");
    scheduler_init();

    round = 0;
    while (scheduler_has_active()) {
        round = round + 1;
        print("--- Round ");
        print_int(round);
        println(" ---");

        // Exécute la tâche courante
        run_current_task();

        // Yield: passe à la suivante
        scheduler_next();
    }

    println("Toutes les taches terminees!");
    return 0;
}
```

## 3.7 Sortie Attendue

```
=== Demo Coroutines ===
--- Round 1 ---
  [A] Compteur: 1
--- Round 2 ---
  [B] Valeur: 10
--- Round 3 ---
  [C] Lettre: A
--- Round 4 ---
  [D] Rebours: 4
...
```

## 3.8 Vers le Préemptif

Pour passer au préemptif, il faut:
1. **Timer**: Déclenche périodiquement
2. **Interruption**: Interrompt la tâche courante
3. **Context switch**: Sauvegarde/restaure les registres

→ Voir Chapitre 4: Scheduler Préemptif

## Exercices

1. **Priorités**: Ajoutez des niveaux de priorité aux tâches
2. **Yield explicite**: Implémentez une fonction yield() appelable
3. **Communication**: Faites communiquer deux tâches via une variable partagée

## Points clés

- Les coroutines permettent le multitâche sans interruptions
- Chaque tâche cède volontairement le contrôle (yield)
- Un scheduler round-robin donne du temps à chaque tâche
- Simple mais une tâche bloquante bloque tout le système

## Demo

Voir `demos/06_coroutines/coroutines.c` pour une implémentation complète.
