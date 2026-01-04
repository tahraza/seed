// Demo 07: Timer et Interruptions
// Demonstration du timer hardware et des interruptions
//
// Concepts: timer MMIO, handler d'interruption, RETI

// ============================================================
// Registres MMIO
// ============================================================

// Timer
int *TIMER_VALUE;
int *TIMER_RELOAD;
int *TIMER_CTRL;
int *TIMER_STATUS;

// Interruptions
int *INT_ENABLE;
int *INT_PENDING;
int *INT_HANDLER;
int *INT_SAVED_PC;

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
// Variables globales pour l'interruption
// ============================================================

int interrupt_count;
int work_done;

// ============================================================
// Handler d'interruption timer
// ============================================================

void timer_handler() {
    // Incremente le compteur d'interruptions
    interrupt_count = interrupt_count + 1;

    // Affiche un message
    print("  [IRQ] Timer interrupt #");
    print_int(interrupt_count);
    println("");

    // Acquitte l'interruption timer (ecrit 1 pour effacer le bit)
    *TIMER_STATUS = 1;
    *INT_PENDING = 1;

    // Retour d'interruption (SVC 0x20)
    // Note: En assembleur ce serait: SVC #0x20
    // Ici on simule avec un appel direct au point de retour
}

// ============================================================
// Initialisation
// ============================================================

void init_mmio_pointers() {
    TIMER_VALUE = (int*)0xFFFF0100;
    TIMER_RELOAD = (int*)0xFFFF0104;
    TIMER_CTRL = (int*)0xFFFF0108;
    TIMER_STATUS = (int*)0xFFFF010C;
    INT_ENABLE = (int*)0xFFFF0200;
    INT_PENDING = (int*)0xFFFF0204;
    INT_HANDLER = (int*)0xFFFF0208;
    INT_SAVED_PC = (int*)0xFFFF020C;
}

void init_timer() {
    // Configure le timer pour declencher toutes les 1000 instructions
    *TIMER_RELOAD = 1000;
    *TIMER_VALUE = 1000;

    // Active le timer avec interruption et auto-reload
    // bit 0 = enable, bit 1 = int_enable, bit 2 = auto_reload
    *TIMER_CTRL = 7;  // 0b111
}

void init_interrupts() {
    // Note: Dans une vraie implementation, INT_HANDLER pointerait
    // vers le code du handler. Ici on simule.
    *INT_ENABLE = 1;  // Active les interruptions globales
}

// ============================================================
// Travail simule (sans interruption)
// ============================================================

void do_work_unit() {
    int i;

    // Simule du travail (boucle)
    i = 0;
    while (i < 100) {
        i = i + 1;
    }

    work_done = work_done + 1;
}

// ============================================================
// Version sans interruption (polling)
// ============================================================

void demo_polling() {
    int i;
    int timer_fired;

    println("Mode POLLING:");
    println("  Verification manuelle du timer...");
    println("");

    // Reset compteurs
    interrupt_count = 0;
    work_done = 0;

    // Configure timer
    *TIMER_VALUE = 500;
    *TIMER_RELOAD = 500;
    *TIMER_CTRL = 5;  // Enable + auto-reload, sans interruption

    i = 0;
    while (i < 5) {
        // Travail
        do_work_unit();

        // Verifie le timer (polling)
        timer_fired = *TIMER_STATUS & 1;
        if (timer_fired) {
            interrupt_count = interrupt_count + 1;
            print("  [POLL] Timer detecte #");
            print_int(interrupt_count);
            println("");
            *TIMER_STATUS = 1;  // Clear status
        }

        i = i + 1;
    }

    print("  Travail effectue: ");
    print_int(work_done);
    println(" unites");
    print("  Timer declenche: ");
    print_int(interrupt_count);
    println(" fois");
}

// ============================================================
// Demonstration des registres timer
// ============================================================

void demo_timer_registers() {
    println("Registres Timer:");
    println("");

    // Configure et lit les registres
    *TIMER_VALUE = 12345;
    *TIMER_RELOAD = 1000;
    *TIMER_CTRL = 0;

    print("  TIMER_VALUE  = ");
    print_int(*TIMER_VALUE);
    println("");

    print("  TIMER_RELOAD = ");
    print_int(*TIMER_RELOAD);
    println("");

    print("  TIMER_CTRL   = ");
    print_int(*TIMER_CTRL);
    println("");

    print("  TIMER_STATUS = ");
    print_int(*TIMER_STATUS);
    println("");
}

// ============================================================
// Demonstration des registres interruption
// ============================================================

void demo_interrupt_registers() {
    println("");
    println("Registres Interruption:");
    println("");

    print("  INT_ENABLE   = ");
    print_int(*INT_ENABLE);
    println("");

    print("  INT_PENDING  = ");
    print_int(*INT_PENDING);
    println("");

    print("  INT_HANDLER  = ");
    print_int(*INT_HANDLER);
    println("");

    print("  INT_SAVED_PC = ");
    print_int(*INT_SAVED_PC);
    println("");
}

// ============================================================
// Programme principal
// ============================================================

int main() {
    println("=== Demo Timer et Interruptions ===");
    println("");

    // Initialise les pointeurs MMIO
    init_mmio_pointers();

    // Affiche les registres
    demo_timer_registers();
    demo_interrupt_registers();

    println("");
    println("--- Test Timer Polling ---");
    println("");

    demo_polling();

    println("");
    println("Timer et interruptions demontres!");

    return 0;
}
