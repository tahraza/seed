// Demo 02: Fibonacci
// Calcul de la suite de Fibonacci - version iterative et recursive

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

// Affiche un nombre (positif)
void print_int(int n) {
    char buffer[12];
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
        buffer[i] = 48 + (n % 10);
        n = n / 10;
        i = i + 1;
    }

    if (neg) {
        putchar(45);
    }

    while (i > 0) {
        i = i - 1;
        putchar(buffer[i]);
    }
}

// Version iterative - O(n)
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

// Version recursive - O(2^n)
int fib_recursive(int n) {
    if (n <= 1) {
        return n;
    }
    return fib_recursive(n - 1) + fib_recursive(n - 2);
}

int main() {
    int i;
    int result;

    println("=== Suite de Fibonacci ===");
    println("");

    println("Version iterative (F(0) a F(15)):");
    i = 0;
    while (i <= 15) {
        print("F(");
        print_int(i);
        print(") = ");
        result = fib_iterative(i);
        print_int(result);
        println("");
        i = i + 1;
    }

    println("");
    println("Version recursive (F(0) a F(10)):");
    i = 0;
    while (i <= 10) {
        print("F(");
        print_int(i);
        print(") = ");
        result = fib_recursive(i);
        print_int(result);
        println("");
        i = i + 1;
    }

    return 0;
}
