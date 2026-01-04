# Chapitre 4: Scheduler Préemptif

## Objectifs
- Comprendre la préemption basée sur timer
- Combiner timer, interruptions et context switch
- Implémenter un mini-scheduler préemptif

## 4.1 Préemption: Le CPU Reprend le Contrôle

```
┌─────────────────────────────────────────────────────────┐
│  Coopératif: La tâche décide quand céder               │
│                                                         │
│  Tâche A ──────────────► yield() ──► Tâche B           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Préemptif: Le timer décide quand interrompre          │
│                                                         │
│  Tâche A ────────⚡────────► IRQ ──► Tâche B           │
│                 timer                                   │
└─────────────────────────────────────────────────────────┘
```

## 4.2 Les Trois Ingrédients

1. **Timer**: Déclenche à intervalle régulier
2. **Interruption**: Interrompt la tâche en cours
3. **Context Switch**: Sauvegarde/restaure l'état

## 4.3 Configuration du Timer avec Interruption

```c
int *TIMER_VALUE  = (int*)0xFFFF0100;
int *TIMER_RELOAD = (int*)0xFFFF0104;
int *TIMER_CTRL   = (int*)0xFFFF0108;
int *TIMER_STATUS = (int*)0xFFFF010C;

void setup_preemptive_timer(int quantum) {
    *TIMER_RELOAD = quantum;
    *TIMER_VALUE = quantum;

    // ENABLE | INT_ENABLE | AUTO_RELOAD
    *TIMER_CTRL = 7;  // 0b111
}
```

## 4.4 Structure de Contexte

Pour un vrai scheduler, il faut sauvegarder:

```c
// Contexte simplifié (en réalité: tous les registres)
struct TaskContext {
    int pc;           // Program Counter
    int sp;           // Stack Pointer
    int regs[12];     // R0-R11
};

struct Task {
    int state;        // 0=libre, 1=prêt, 2=running
    struct TaskContext ctx;
    int stack[256];   // Stack privée
};

struct Task tasks[4];
int current;
```

## 4.5 Le Handler d'Interruption Timer

```c
// Appelé par l'interruption timer
void timer_irq_handler() {
    // 1. Sauvegarde le contexte de la tâche courante
    save_context(&tasks[current].ctx);

    // 2. Passe la tâche en état "prêt"
    tasks[current].state = 1;

    // 3. Choisit la prochaine tâche
    current = (current + 1) % NUM_TASKS;
    while (tasks[current].state == 0) {
        current = (current + 1) % NUM_TASKS;
    }

    // 4. Restaure le contexte
    tasks[current].state = 2;  // running
    restore_context(&tasks[current].ctx);

    // 5. Acquitte l'interruption
    *TIMER_STATUS = 1;
    *INT_PENDING = 1;

    // 6. RETI (retourne à la nouvelle tâche)
}
```

## 4.6 Démonstration Simplifiée

Sans vrai context switch en C, on simule:

```c
int interrupt_count;
int work_done;

void demo_polling() {
    int i;

    // Configure timer sans interruption (polling)
    *TIMER_VALUE = 500;
    *TIMER_CTRL = 5;  // Enable + auto-reload

    i = 0;
    while (i < 5) {
        do_work_unit();

        // Vérifie le timer (polling)
        if (*TIMER_STATUS & 1) {
            interrupt_count = interrupt_count + 1;
            print("  [POLL] Timer #");
            print_int(interrupt_count);
            println("");
            *TIMER_STATUS = 1;
        }
        i = i + 1;
    }
}
```

## 4.7 Quantum et Équité

Le **quantum** est le temps alloué à chaque tâche:

| Quantum | Avantages           | Inconvénients           |
|---------|---------------------|-------------------------|
| Court   | Meilleure réactivité| Plus d'overhead         |
| Long    | Moins d'overhead    | Latence plus élevée     |

Typiquement: 1-10ms (soit 1000-10000 instructions)

## 4.8 États des Tâches

```
          ┌─────────┐
          │  LIBRE  │  (slot non utilisé)
          └────┬────┘
               │ create()
               ▼
          ┌─────────┐
    ┌────►│  PRÊT   │◄────┐
    │     └────┬────┘     │
    │          │ schedule │ preempt
    │          ▼          │
    │     ┌─────────┐     │
    │     │ RUNNING │─────┘
    │     └────┬────┘
    │          │ exit()
    │          ▼
    │     ┌─────────┐
    └─────│ TERMINÉ │
          └─────────┘
```

## 4.9 Problèmes de Concurrence

Avec la préemption, attention aux **race conditions**:

```c
// DANGER: Pas atomique!
int counter;

void task_a() {
    int tmp = counter;    // Lecture
    // <<< Interruption possible ici!
    counter = tmp + 1;    // Écriture
}

void task_b() {
    counter = counter + 1;  // Même problème
}
```

Solutions:
- **Sections critiques**: Désactiver les interruptions
- **Variables atomiques**: Opérations indivisibles
- **Mutex/Semaphores**: Verrous logiciels

## 4.10 Section Critique

```c
void critical_section() {
    int old_int = *INT_ENABLE;
    *INT_ENABLE = 0;  // Désactive interruptions

    // Code critique ici
    counter = counter + 1;

    *INT_ENABLE = old_int;  // Restaure
}
```

## Exercices

1. **Quantum variable**: Modifiez le quantum selon la priorité de la tâche
2. **Statistiques**: Comptez le temps CPU de chaque tâche
3. **Sleep**: Implémentez une fonction sleep(ms) qui bloque la tâche

## Points clés

- Le scheduler préemptif utilise le timer pour interrompre les tâches
- Le context switch sauvegarde/restaure l'état complet du CPU
- Le quantum contrôle la granularité du multitâche
- Les sections critiques protègent les données partagées

## Demo

Voir `demos/07_scheduler/scheduler.c` pour une démonstration du timer avec polling.
