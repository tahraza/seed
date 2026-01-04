// Demo 05: Shell
// Mini shell - demonstration non-interactive
//
// Concepts: parsing, dispatch, gestion de chaines

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
    int neg;

    if (n == 0) {
        putchar(48);
        return;
    }

    neg = 0;
    if (n < 0) {
        neg = 1;
        n = 0 - n;
    }

    i = 0;
    while (n > 0) {
        buf[i] = 48 + (n % 10);
        n = n / 10;
        i = i + 1;
    }

    if (neg) {
        putchar(45);
    }
    while (i > 0) {
        i = i - 1;
        putchar(buf[i]);
    }
}

// Variables du shell
int var_a;
int var_b;
int var_result;

// Fonctions de manipulation de chaines

int strlen(char *s) {
    int len;
    len = 0;
    while (*s) {
        len = len + 1;
        s = s + 1;
    }
    return len;
}

int streq(char *a, char *b) {
    while (*a) {
        if (*a != *b) {
            return 0;
        }
        a = a + 1;
        b = b + 1;
    }
    if (*b) {
        return 0;
    }
    return 1;
}

// Parse un entier depuis une chaine
int parse_int(char *s) {
    int result;
    int neg;

    result = 0;
    neg = 0;

    // Saute espaces
    while (*s == 32) {
        s = s + 1;
    }

    if (*s == 45) {
        neg = 1;
        s = s + 1;
    }

    while (*s >= 48) {
        if (*s > 57) {
            break;
        }
        result = result * 10 + (*s - 48);
        s = s + 1;
    }

    if (neg) {
        result = 0 - result;
    }
    return result;
}

// Commandes

void cmd_help() {
    println("Commandes disponibles:");
    println("  help       - Affiche cette aide");
    println("  echo <txt> - Affiche le texte");
    println("  set a <n>  - Definit a");
    println("  set b <n>  - Definit b");
    println("  add        - result = a + b");
    println("  sub        - result = a - b");
    println("  mul        - result = a * b");
    println("  fib <n>    - Calcule Fibonacci");
}

void cmd_echo(char *text) {
    println(text);
}

void cmd_set_a(int val) {
    var_a = val;
    print("a = ");
    print_int(var_a);
    println("");
}

void cmd_set_b(int val) {
    var_b = val;
    print("b = ");
    print_int(var_b);
    println("");
}

void cmd_add() {
    var_result = var_a + var_b;
    print_int(var_a);
    print(" + ");
    print_int(var_b);
    print(" = ");
    print_int(var_result);
    println("");
}

void cmd_sub() {
    var_result = var_a - var_b;
    print_int(var_a);
    print(" - ");
    print_int(var_b);
    print(" = ");
    print_int(var_result);
    println("");
}

void cmd_mul() {
    var_result = var_a * var_b;
    print_int(var_a);
    print(" * ");
    print_int(var_b);
    print(" = ");
    print_int(var_result);
    println("");
}

int fib(int n) {
    int a;
    int b;
    int i;
    int temp;

    if (n <= 1) {
        return n;
    }

    a = 0;
    b = 1;
    i = 2;
    while (i <= n) {
        temp = a + b;
        a = b;
        b = temp;
        i = i + 1;
    }
    return b;
}

void cmd_fib(int n) {
    int result;
    result = fib(n);
    print("fib(");
    print_int(n);
    print(") = ");
    print_int(result);
    println("");
    var_result = result;
}

void prompt() {
    print("$ ");
}

int main() {
    println("=== A32-Lite Mini Shell Demo ===");
    println("");
    println("Demonstration du parsing de commandes");
    println("");

    var_a = 0;
    var_b = 0;
    var_result = 0;

    // Simule une session interactive

    prompt();
    println("help");
    cmd_help();
    println("");

    prompt();
    println("echo Hello from shell!");
    cmd_echo("Hello from shell!");
    println("");

    prompt();
    println("set a 42");
    cmd_set_a(42);

    prompt();
    println("set b 13");
    cmd_set_b(13);

    prompt();
    println("add");
    cmd_add();

    prompt();
    println("sub");
    cmd_sub();

    prompt();
    println("mul");
    cmd_mul();
    println("");

    prompt();
    println("fib 10");
    cmd_fib(10);

    prompt();
    println("fib 15");
    cmd_fib(15);
    println("");

    println("Session terminee.");

    return 0;
}
