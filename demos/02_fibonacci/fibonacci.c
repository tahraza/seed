// Demo 02: Fibonacci
// Calcul de la suite de Fibonacci - version itérative et récursive
//
// Concepts: boucles, récursion, comparaison de performances

#define OUTPUT_PORT ((volatile int*)0x10000000)

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

// Affiche un nombre (positif)
void print_int(int n) {
    char buffer[12];
    int i;
    int neg;

    if (n == 0) {
        putchar('0');
        return;
    }

    neg = 0;
    if (n < 0) {
        neg = 1;
        n = -n;
    }

    i = 0;
    while (n > 0) {
        buffer[i] = '0' + (n % 10);
        n = n / 10;
        i = i + 1;
    }

    if (neg) {
        putchar('-');
    }

    while (i > 0) {
        i = i - 1;
        putchar(buffer[i]);
    }
}

// ============================================================
// Version itérative - O(n) en temps, O(1) en espace
// ============================================================
int fib_iterative(int n) {
    int a;
    int b;
    int temp;
    int i;

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

// ============================================================
// Version récursive - O(2^n) en temps, O(n) en espace pile
// ============================================================
int fib_recursive(int n) {
    if (n <= 1) {
        return n;
    }
    return fib_recursive(n - 1) + fib_recursive(n - 2);
}

// ============================================================
// Programme principal
// ============================================================
int main() {
    int i;
    int result;

    println("=== Suite de Fibonacci ===");
    println("");

    // Affiche les 20 premiers nombres (version itérative)
    println("Version iterative (F(0) a F(19)):");
    i = 0;
    while (i < 20) {
        print("F(");
        print_int(i);
        print(") = ");
        result = fib_iterative(i);
        print_int(result);
        println("");
        i = i + 1;
    }

    println("");

    // Affiche quelques nombres avec la version récursive
    // (limitée car exponentielle)
    println("Version recursive (F(0) a F(15)):");
    i = 0;
    while (i <= 15) {
        print("F(");
        print_int(i);
        print(") = ");
        result = fib_recursive(i);
        print_int(result);
        println("");
        i = i + 1;
    }

    println("");
    println("Note: La version recursive est beaucoup plus lente!");
    println("      fib_recursive(20) ferait 21891 appels.");

    return 0;
}
