// Demo 05: Shell
// Mini shell interactif - interface en ligne de commande
//
// Concepts: parsing, dispatch, état, lecture ligne

// ============================================================
// Configuration matérielle
// ============================================================

#define OUTPUT_PORT   ((volatile int*)0x10000000)
#define KEYBOARD_ADDR ((volatile int*)0x00402600)

#define KEY_ENTER     10
#define KEY_BACKSPACE 8

// ============================================================
// Fonctions I/O de base
// ============================================================

void putchar(int c) {
    *OUTPUT_PORT = c;
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
    int i = 0;
    int neg = 0;

    if (n == 0) {
        putchar('0');
        return;
    }

    if (n < 0) {
        neg = 1;
        n = -n;
    }

    while (n > 0) {
        buf[i] = '0' + n % 10;
        n = n / 10;
        i = i + 1;
    }

    if (neg) putchar('-');
    while (i > 0) {
        i = i - 1;
        putchar(buf[i]);
    }
}

int keyboard_read() {
    return *KEYBOARD_ADDR;
}

// ============================================================
// Fonctions string
// ============================================================

int strlen(char *s) {
    int len = 0;
    while (*s) {
        len = len + 1;
        s = s + 1;
    }
    return len;
}

int strcmp(char *a, char *b) {
    while (*a && *b && *a == *b) {
        a = a + 1;
        b = b + 1;
    }
    return *a - *b;
}

int strncmp(char *a, char *b, int n) {
    int i = 0;
    while (i < n && a[i] && b[i]) {
        if (a[i] != b[i]) return a[i] - b[i];
        i = i + 1;
    }
    if (i == n) return 0;
    return a[i] - b[i];
}

// Copie une sous-chaîne
void strcpy(char *dst, char *src) {
    while (*src) {
        *dst = *src;
        dst = dst + 1;
        src = src + 1;
    }
    *dst = 0;
}

// Saute les espaces
char *skip_spaces(char *s) {
    while (*s == ' ' || *s == '\t') {
        s = s + 1;
    }
    return s;
}

// Trouve le prochain espace
char *find_space(char *s) {
    while (*s && *s != ' ' && *s != '\t') {
        s = s + 1;
    }
    return s;
}

// Parse un entier
int parse_int(char *s) {
    int result = 0;
    int neg = 0;

    s = skip_spaces(s);

    if (*s == '-') {
        neg = 1;
        s = s + 1;
    }

    while (*s >= '0' && *s <= '9') {
        result = result * 10 + (*s - '0');
        s = s + 1;
    }

    if (neg) result = -result;
    return result;
}

// ============================================================
// Lecture de ligne
// ============================================================

#define LINE_MAX 80
char line_buffer[LINE_MAX];

void read_line() {
    int pos = 0;
    int key;

    while (1) {
        key = keyboard_read();

        if (key == 0) continue;

        if (key == KEY_ENTER) {
            line_buffer[pos] = 0;
            println("");
            return;
        }

        if (key == KEY_BACKSPACE) {
            if (pos > 0) {
                pos = pos - 1;
                // Efface visuellement
                putchar(8);   // Backspace
                putchar(' '); // Espace
                putchar(8);   // Backspace
            }
            continue;
        }

        // Caractère imprimable
        if (key >= 32 && key < 127 && pos < LINE_MAX - 1) {
            line_buffer[pos] = key;
            pos = pos + 1;
            putchar(key);  // Echo
        }
    }
}

// ============================================================
// Variables du shell
// ============================================================

int var_a;
int var_b;
int var_c;
int var_result;

// ============================================================
// Commandes
// ============================================================

void cmd_help() {
    println("Commandes disponibles:");
    println("  help          - Affiche cette aide");
    println("  echo <text>   - Affiche le texte");
    println("  set <var> <n> - Definit une variable (a, b, c)");
    println("  get <var>     - Affiche une variable");
    println("  add           - result = a + b");
    println("  sub           - result = a - b");
    println("  mul           - result = a * b");
    println("  div           - result = a / b");
    println("  fib <n>       - Calcule Fibonacci(n)");
    println("  clear         - Efface les variables");
    println("  exit          - Quitte le shell");
}

void cmd_echo(char *args) {
    args = skip_spaces(args);
    println(args);
}

void cmd_set(char *args) {
    char var;
    int value;
    char *p;

    args = skip_spaces(args);
    var = *args;
    args = skip_spaces(args + 1);
    value = parse_int(args);

    if (var == 'a') {
        var_a = value;
        print("a = ");
    } else if (var == 'b') {
        var_b = value;
        print("b = ");
    } else if (var == 'c') {
        var_c = value;
        print("c = ");
    } else {
        println("Variable inconnue (utilisez a, b, c)");
        return;
    }

    print_int(value);
    println("");
}

void cmd_get(char *args) {
    char var;

    args = skip_spaces(args);
    var = *args;

    if (var == 'a') {
        print("a = ");
        print_int(var_a);
    } else if (var == 'b') {
        print("b = ");
        print_int(var_b);
    } else if (var == 'c') {
        print("c = ");
        print_int(var_c);
    } else if (var == 'r') {
        print("result = ");
        print_int(var_result);
    } else {
        print("Variable inconnue");
    }
    println("");
}

void cmd_add() {
    var_result = var_a + var_b;
    print("result = ");
    print_int(var_a);
    print(" + ");
    print_int(var_b);
    print(" = ");
    print_int(var_result);
    println("");
}

void cmd_sub() {
    var_result = var_a - var_b;
    print("result = ");
    print_int(var_a);
    print(" - ");
    print_int(var_b);
    print(" = ");
    print_int(var_result);
    println("");
}

void cmd_mul() {
    var_result = var_a * var_b;
    print("result = ");
    print_int(var_a);
    print(" * ");
    print_int(var_b);
    print(" = ");
    print_int(var_result);
    println("");
}

void cmd_div() {
    if (var_b == 0) {
        println("Erreur: division par zero");
        return;
    }
    var_result = var_a / var_b;
    print("result = ");
    print_int(var_a);
    print(" / ");
    print_int(var_b);
    print(" = ");
    print_int(var_result);
    println("");
}

int fib(int n) {
    int a, b, i, temp;
    if (n <= 1) return n;
    a = 0;
    b = 1;
    for (i = 2; i <= n; i = i + 1) {
        temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}

void cmd_fib(char *args) {
    int n, result;
    args = skip_spaces(args);
    n = parse_int(args);

    print("fib(");
    print_int(n);
    print(") = ");
    result = fib(n);
    print_int(result);
    println("");

    var_result = result;
}

void cmd_clear() {
    var_a = 0;
    var_b = 0;
    var_c = 0;
    var_result = 0;
    println("Variables effacees.");
}

// ============================================================
// Dispatch des commandes
// ============================================================

int process_command() {
    char *cmd;
    char *args;
    char *end;
    int cmd_len;

    cmd = skip_spaces(line_buffer);

    // Ligne vide
    if (*cmd == 0) return 1;

    // Trouve la fin de la commande
    end = find_space(cmd);
    cmd_len = end - cmd;
    args = end;

    // Dispatch
    if (strncmp(cmd, "help", cmd_len) == 0 && cmd_len == 4) {
        cmd_help();
    } else if (strncmp(cmd, "echo", cmd_len) == 0 && cmd_len == 4) {
        cmd_echo(args);
    } else if (strncmp(cmd, "set", cmd_len) == 0 && cmd_len == 3) {
        cmd_set(args);
    } else if (strncmp(cmd, "get", cmd_len) == 0 && cmd_len == 3) {
        cmd_get(args);
    } else if (strncmp(cmd, "add", cmd_len) == 0 && cmd_len == 3) {
        cmd_add();
    } else if (strncmp(cmd, "sub", cmd_len) == 0 && cmd_len == 3) {
        cmd_sub();
    } else if (strncmp(cmd, "mul", cmd_len) == 0 && cmd_len == 3) {
        cmd_mul();
    } else if (strncmp(cmd, "div", cmd_len) == 0 && cmd_len == 3) {
        cmd_div();
    } else if (strncmp(cmd, "fib", cmd_len) == 0 && cmd_len == 3) {
        cmd_fib(args);
    } else if (strncmp(cmd, "clear", cmd_len) == 0 && cmd_len == 5) {
        cmd_clear();
    } else if (strncmp(cmd, "exit", cmd_len) == 0 && cmd_len == 4) {
        println("Au revoir!");
        return 0;
    } else {
        print("Commande inconnue: ");
        // Affiche juste la commande
        while (cmd < end) {
            putchar(*cmd);
            cmd = cmd + 1;
        }
        println("");
        println("Tapez 'help' pour la liste des commandes.");
    }

    return 1;
}

// ============================================================
// Programme principal
// ============================================================

int main() {
    int running;

    println("╔═══════════════════════════════════════╗");
    println("║       A32-Lite Mini Shell v1.0        ║");
    println("╚═══════════════════════════════════════╝");
    println("");
    println("Tapez 'help' pour la liste des commandes.");
    println("");

    var_a = 0;
    var_b = 0;
    var_c = 0;
    var_result = 0;

    running = 1;
    while (running) {
        print("$ ");
        read_line();
        running = process_command();
    }

    return 0;
}
