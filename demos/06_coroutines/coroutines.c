// Demo 06: Coroutines
// Multitache cooperatif - les taches cedent volontairement le controle
//
// Concepts: contexte d'execution, yield, scheduler cooperatif

// ============================================================
// I/O
// ============================================================

void putchar(int c) {
    int *port;
    port = (int*)0xFFFF0000;
    *port = c;
}

void print(char *s) {
    while (*s) {
        putchar(*s);
        s = s + 1;
    }
}

void println(char *s) {
    print(s);
    putchar(10);
}

void print_int(int n) {
    char buf[12];
    int i;

    if (n == 0) {
        putchar(48);
        return;
    }
    if (n < 0) {
        putchar(45);
        n = 0 - n;
    }
    i = 0;
    while (n > 0) {
        buf[i] = 48 + (n % 10);
        n = n / 10;
        i = i + 1;
    }
    while (i > 0) {
        i = i - 1;
        putchar(buf[i]);
    }
}

// ============================================================
// Coroutines simplifiees
// ============================================================

// Structure de contexte pour une coroutine
// Dans une implementation reelle, on sauvegarderait tous les registres
// Ici on utilise une approche simplifiee avec des compteurs d'etat

int task_state[4];     // Etat de chaque tache (0 = terminee)
int task_counter[4];   // Compteur interne de chaque tache
int current_task;      // Tache courante
int num_tasks;         // Nombre de taches

// Initialise le scheduler
void scheduler_init() {
    int i;
    current_task = 0;
    num_tasks = 4;
    i = 0;
    while (i < 4) {
        task_state[i] = 1;    // Active
        task_counter[i] = 0;
        i = i + 1;
    }
}

// Trouve la prochaine tache active
int scheduler_next() {
    int start;
    int i;

    start = current_task;
    i = 0;
    while (i < num_tasks) {
        current_task = (current_task + 1) % num_tasks;
        if (task_state[current_task]) {
            return current_task;
        }
        i = i + 1;
    }
    return -1;  // Toutes les taches terminees
}

// Verifie si des taches sont encore actives
int scheduler_has_active() {
    int i;
    i = 0;
    while (i < num_tasks) {
        if (task_state[i]) {
            return 1;
        }
        i = i + 1;
    }
    return 0;
}

// ============================================================
// Taches
// ============================================================

// Tache A: compte de 1 a 5
void task_a_step() {
    if (task_counter[0] >= 5) {
        task_state[0] = 0;  // Termine
        return;
    }
    task_counter[0] = task_counter[0] + 1;
    print("  [A] Compteur: ");
    print_int(task_counter[0]);
    println("");
}

// Tache B: compte de 10 a 13
void task_b_step() {
    if (task_counter[1] >= 4) {
        task_state[1] = 0;  // Termine
        return;
    }
    task_counter[1] = task_counter[1] + 1;
    print("  [B] Valeur: ");
    print_int(task_counter[1] + 9);
    println("");
}

// Tache C: affiche des lettres
void task_c_step() {
    if (task_counter[2] >= 3) {
        task_state[2] = 0;  // Termine
        return;
    }
    task_counter[2] = task_counter[2] + 1;
    print("  [C] Lettre: ");
    putchar(64 + task_counter[2]);  // A, B, C
    println("");
}

// Tache D: compte a rebours
void task_d_step() {
    if (task_counter[3] >= 4) {
        task_state[3] = 0;  // Termine
        return;
    }
    task_counter[3] = task_counter[3] + 1;
    print("  [D] Rebours: ");
    print_int(5 - task_counter[3]);
    println("");
}

// Execute une etape de la tache courante
void run_current_task() {
    if (current_task == 0) {
        task_a_step();
    }
    if (current_task == 1) {
        task_b_step();
    }
    if (current_task == 2) {
        task_c_step();
    }
    if (current_task == 3) {
        task_d_step();
    }
}

// ============================================================
// Programme principal
// ============================================================

int main() {
    int round;
    int next;

    println("=== Demo Coroutines ===");
    println("");
    println("Multitache cooperatif avec 4 taches:");
    println("  [A] Compte de 1 a 5");
    println("  [B] Compte de 10 a 13");
    println("  [C] Affiche A, B, C");
    println("  [D] Compte a rebours de 4 a 1");
    println("");

    scheduler_init();

    round = 0;
    while (scheduler_has_active()) {
        round = round + 1;
        print("--- Round ");
        print_int(round);
        println(" ---");

        // Execute la tache courante
        run_current_task();

        // Passe a la tache suivante (yield cooperatif)
        next = scheduler_next();
        if (next < 0) {
            break;
        }
    }

    println("");
    println("Toutes les taches terminees!");
    print("Total rounds: ");
    print_int(round);
    println("");

    return 0;
}
