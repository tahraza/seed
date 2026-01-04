// io.c - Input/Output library

extern int putc(int c);
extern int getc(void);

// Print a null-terminated string
void puts(char *s) {
    while (*s != 0) {
        putc(*s);
        s = s + 1;
    }
}

// Print an unsigned integer in decimal
void print_uint(uint n) {
    char buf[12];
    int i = 0;

    if (n == 0) {
        putc('0');
        return;
    }

    while (n > 0) {
        buf[i] = (char)(n % 10) + '0';
        n = n / 10;
        i = i + 1;
    }

    // Print in reverse order
    while (i > 0) {
        i = i - 1;
        putc(buf[i]);
    }
}

// Print a signed integer in decimal
void print_int(int n) {
    if (n < 0) {
        putc('-');
        // Handle MIN_INT case
        if (n == (int)0x80000000) {
            puts("2147483648");
            return;
        }
        n = 0 - n;
    }
    print_uint((uint)n);
}

// Print an unsigned integer in hexadecimal
void print_hex(uint n) {
    char hex[9];
    int i = 0;

    if (n == 0) {
        puts("0x0");
        return;
    }

    puts("0x");

    while (n > 0) {
        uint digit = n % 16;
        if (digit < 10) {
            hex[i] = (char)digit + '0';
        } else {
            hex[i] = (char)(digit - 10) + 'A';
        }
        n = n / 16;
        i = i + 1;
    }

    while (i > 0) {
        i = i - 1;
        putc(hex[i]);
    }
}

// Print a newline
void println(void) {
    putc('\n');
}

// Read a line into buffer, returns length
int getline(char *buf, int max_len) {
    int i = 0;
    int c;

    while (i < max_len - 1) {
        c = getc();
        if (c < 0) {
            break;
        }
        if (c == '\n' || c == '\r') {
            break;
        }
        buf[i] = (char)c;
        i = i + 1;
    }

    buf[i] = 0;
    return i;
}
