// Demo 03: Graphics
// Dessins graphiques sur l'ecran 320x240

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

// Efface l'ecran
void screen_clear() {
    int i;
    char *p;
    p = (char*)0x00400000;
    i = 0;
    while (i < 9600) {
        *p = 0;
        p = p + 1;
        i = i + 1;
    }
}

// Dessine un pixel
void draw_pixel(int x, int y, int on) {
    int byte_offset;
    int bit_index;
    int byte_val;
    char *addr;

    if (x < 0) return;
    if (x >= 320) return;
    if (y < 0) return;
    if (y >= 240) return;

    byte_offset = y * 40 + (x / 8);
    bit_index = 7 - (x % 8);

    addr = (char*)0x00400000 + byte_offset;
    byte_val = *addr;

    if (on) {
        byte_val = byte_val | (1 << bit_index);
    } else {
        byte_val = byte_val & ~(1 << bit_index);
    }

    *addr = byte_val;
}

// Dessine une ligne horizontale
void draw_hline(int x1, int x2, int y) {
    int x;
    int temp;
    if (y < 0) return;
    if (y >= 240) return;
    if (x1 > x2) {
        temp = x1;
        x1 = x2;
        x2 = temp;
    }
    x = x1;
    while (x <= x2) {
        draw_pixel(x, y, 1);
        x = x + 1;
    }
}

// Dessine une ligne verticale
void draw_vline(int x, int y1, int y2) {
    int y;
    int temp;
    if (x < 0) return;
    if (x >= 320) return;
    if (y1 > y2) {
        temp = y1;
        y1 = y2;
        y2 = temp;
    }
    y = y1;
    while (y <= y2) {
        draw_pixel(x, y, 1);
        y = y + 1;
    }
}

// Dessine un rectangle (contour)
void draw_rect(int x, int y, int w, int h) {
    draw_hline(x, x + w - 1, y);
    draw_hline(x, x + w - 1, y + h - 1);
    draw_vline(x, y, y + h - 1);
    draw_vline(x + w - 1, y, y + h - 1);
}

// Remplit un rectangle
void fill_rect(int x, int y, int w, int h) {
    int i;
    i = 0;
    while (i < h) {
        draw_hline(x, x + w - 1, y + i);
        i = i + 1;
    }
}

int main() {
    int i;

    println("=== Demo Graphique ===");
    println("Dessin sur ecran 320x240...");

    screen_clear();

    // Dessine un cadre
    draw_rect(10, 10, 300, 220);

    // Dessine des lignes
    draw_hline(20, 150, 50);
    draw_vline(160, 20, 100);

    // Dessine des rectangles
    fill_rect(170, 20, 60, 40);
    draw_rect(170, 70, 60, 40);

    // Dessine des carres concentriques
    i = 0;
    while (i < 5) {
        draw_rect(50 + i * 10, 130 + i * 10, 80 - i * 20, 80 - i * 20);
        i = i + 1;
    }

    println("Termine!");

    return 0;
}
