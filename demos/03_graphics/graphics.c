// Demo 03: Graphics
// Dessins graphiques sur l'écran 320x240
//
// Concepts: framebuffer, manipulation de bits, algorithmes graphiques

// Configuration de l'écran
#define SCREEN_WIDTH  320
#define SCREEN_HEIGHT 240
#define SCREEN_BASE   ((volatile char*)0x00400000)

// Port de sortie texte
#define OUTPUT_PORT ((volatile int*)0x10000000)

void putchar(int c) { *OUTPUT_PORT = c; }
void print(char *s) { while (*s) putchar(*s++); }
void println(char *s) { print(s); putchar(10); }

// ============================================================
// Fonctions graphiques de base
// ============================================================

// Efface l'écran (tout noir)
void screen_clear() {
    int i;
    volatile char *p;
    p = SCREEN_BASE;
    i = 0;
    while (i < 9600) {  // 320 * 240 / 8 = 9600 octets
        *p = 0;
        p = p + 1;
        i = i + 1;
    }
}

// Remplit l'écran (tout blanc)
void screen_fill() {
    int i;
    volatile char *p;
    p = SCREEN_BASE;
    i = 0;
    while (i < 9600) {
        *p = 255;  // 0xFF = tous les bits à 1
        p = p + 1;
        i = i + 1;
    }
}

// Dessine un pixel
void draw_pixel(int x, int y, int on) {
    int byte_offset;
    int bit_index;
    int byte_val;
    volatile char *addr;

    if (x < 0) return;
    if (x >= SCREEN_WIDTH) return;
    if (y < 0) return;
    if (y >= SCREEN_HEIGHT) return;

    // Calcul de l'offset: y * (320/8) + x/8
    byte_offset = y * 40 + (x / 8);
    bit_index = 7 - (x % 8);  // MSB first

    addr = SCREEN_BASE + byte_offset;
    byte_val = *addr;

    if (on) {
        byte_val = byte_val | (1 << bit_index);   // Set bit
    } else {
        byte_val = byte_val & ~(1 << bit_index);  // Clear bit
    }

    *addr = byte_val;
}

// Dessine une ligne horizontale (optimisée)
void draw_hline(int x1, int x2, int y) {
    int x;
    if (y < 0) return;
    if (y >= SCREEN_HEIGHT) return;
    if (x1 > x2) { x = x1; x1 = x2; x2 = x; }  // Swap
    x = x1;
    while (x <= x2) {
        draw_pixel(x, y, 1);
        x = x + 1;
    }
}

// Dessine une ligne verticale (optimisée)
void draw_vline(int x, int y1, int y2) {
    int y;
    if (x < 0) return;
    if (x >= SCREEN_WIDTH) return;
    if (y1 > y2) { y = y1; y1 = y2; y2 = y; }  // Swap
    y = y1;
    while (y <= y2) {
        draw_pixel(x, y, 1);
        y = y + 1;
    }
}

// Dessine une ligne (algorithme de Bresenham)
void draw_line(int x0, int y0, int x1, int y1) {
    int dx, dy;
    int sx, sy;
    int err, e2;

    if (x0 < x1) { dx = x1 - x0; sx = 1; }
    else { dx = x0 - x1; sx = -1; }

    if (y0 < y1) { dy = y1 - y0; sy = 1; }
    else { dy = y0 - y1; sy = -1; }

    if (dx > dy) { err = dx / 2; }
    else { err = -dy / 2; }

    while (1) {
        draw_pixel(x0, y0, 1);

        if (x0 == x1 && y0 == y1) break;

        e2 = err;
        if (e2 > -dx) { err = err - dy; x0 = x0 + sx; }
        if (e2 < dy) { err = err + dx; y0 = y0 + sy; }
    }
}

// Dessine un rectangle (contour)
void draw_rect(int x, int y, int w, int h) {
    draw_hline(x, x + w - 1, y);          // Haut
    draw_hline(x, x + w - 1, y + h - 1);  // Bas
    draw_vline(x, y, y + h - 1);          // Gauche
    draw_vline(x + w - 1, y, y + h - 1);  // Droite
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

// Dessine un cercle (algorithme de Bresenham)
void draw_circle(int cx, int cy, int r) {
    int x, y, d;

    x = 0;
    y = r;
    d = 3 - 2 * r;

    while (x <= y) {
        // 8 points symétriques
        draw_pixel(cx + x, cy + y, 1);
        draw_pixel(cx - x, cy + y, 1);
        draw_pixel(cx + x, cy - y, 1);
        draw_pixel(cx - x, cy - y, 1);
        draw_pixel(cx + y, cy + x, 1);
        draw_pixel(cx - y, cy + x, 1);
        draw_pixel(cx + y, cy - x, 1);
        draw_pixel(cx - y, cy - x, 1);

        if (d < 0) {
            d = d + 4 * x + 6;
        } else {
            d = d + 4 * (x - y) + 10;
            y = y - 1;
        }
        x = x + 1;
    }
}

// ============================================================
// Programme principal - Démonstration
// ============================================================

int main() {
    int i;

    println("=== Demo Graphique ===");
    println("Dessin sur ecran 320x240...");

    // Efface l'écran
    screen_clear();

    // Dessine un cadre
    draw_rect(10, 10, 300, 220);

    // Dessine des lignes diagonales
    draw_line(20, 20, 150, 100);
    draw_line(20, 100, 150, 20);

    // Dessine des rectangles
    fill_rect(170, 20, 60, 40);
    draw_rect(170, 70, 60, 40);

    // Dessine des cercles
    draw_circle(260, 60, 30);
    draw_circle(260, 60, 20);
    draw_circle(260, 60, 10);

    // Dessine un motif
    i = 0;
    while (i < 10) {
        draw_line(20, 130 + i * 8, 140, 130 + i * 8);
        i = i + 1;
    }

    // Dessine des carrés concentriques
    i = 0;
    while (i < 5) {
        draw_rect(170 + i * 8, 130 + i * 8, 80 - i * 16, 80 - i * 16);
        i = i + 1;
    }

    println("Termine!");
    println("Regardez l'ecran pour voir le resultat.");

    return 0;
}
