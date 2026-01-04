# Chapitre 4 : Les Drivers

## Objectif

Créer des abstractions pour le matériel : écran, clavier, etc.

## Architecture des drivers

```
┌─────────────────────────────────────────────┐
│            Application                       │
├─────────────────────────────────────────────┤
│             API Driver                       │
│    screen_draw_pixel(), keyboard_read()      │
├─────────────────────────────────────────────┤
│          Driver (bas niveau)                 │
│    Accès direct aux registres MMIO           │
├─────────────────────────────────────────────┤
│             Matériel                         │
│    SCREEN_BASE, KEYBOARD_ADDR                │
└─────────────────────────────────────────────┘
```

## Driver d'écran

### Registres matériels

```c
// Configuration écran A32
#define SCREEN_WIDTH   320
#define SCREEN_HEIGHT  240
#define SCREEN_BPP     1       // 1 bit par pixel
#define SCREEN_BASE    ((volatile unsigned char*)0x00400000)
#define SCREEN_SIZE    9600    // 320 * 240 / 8

// Structure du framebuffer
// - 40 octets par ligne (320 / 8)
// - 240 lignes
// - Bit 7 = pixel 0, Bit 0 = pixel 7 (MSB first)
```

### Interface du driver

```c
// screen.h

// Initialisation
void screen_init(void);

// Opérations de base
void screen_clear(void);
void screen_fill(void);
void screen_set_pixel(int x, int y, int on);
int  screen_get_pixel(int x, int y);

// Formes géométriques
void screen_draw_line(int x0, int y0, int x1, int y1);
void screen_draw_rect(int x, int y, int w, int h);
void screen_fill_rect(int x, int y, int w, int h);
void screen_draw_circle(int cx, int cy, int r);

// Texte
void screen_draw_char(int x, int y, char c);
void screen_draw_string(int x, int y, char *s);

// Double buffering (optionnel)
void screen_flip(void);
```

### Implémentation

```c
// screen.c

static volatile unsigned char *framebuffer = SCREEN_BASE;

void screen_init(void) {
    screen_clear();
}

void screen_clear(void) {
    for (int i = 0; i < SCREEN_SIZE; i++) {
        framebuffer[i] = 0;
    }
}

void screen_set_pixel(int x, int y, int on) {
    if (x < 0 || x >= SCREEN_WIDTH) return;
    if (y < 0 || y >= SCREEN_HEIGHT) return;

    int byte_offset = y * 40 + x / 8;
    int bit = 7 - (x % 8);

    if (on) {
        framebuffer[byte_offset] |= (1 << bit);
    } else {
        framebuffer[byte_offset] &= ~(1 << bit);
    }
}

int screen_get_pixel(int x, int y) {
    if (x < 0 || x >= SCREEN_WIDTH) return 0;
    if (y < 0 || y >= SCREEN_HEIGHT) return 0;

    int byte_offset = y * 40 + x / 8;
    int bit = 7 - (x % 8);

    return (framebuffer[byte_offset] >> bit) & 1;
}

// Ligne optimisée avec Bresenham
void screen_draw_line(int x0, int y0, int x1, int y1) {
    int dx = x1 > x0 ? x1 - x0 : x0 - x1;
    int dy = y1 > y0 ? y1 - y0 : y0 - y1;
    int sx = x0 < x1 ? 1 : -1;
    int sy = y0 < y1 ? 1 : -1;
    int err = dx - dy;

    while (1) {
        screen_set_pixel(x0, y0, 1);

        if (x0 == x1 && y0 == y1) break;

        int e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx)  { err += dx; y0 += sy; }
    }
}

// Rectangle optimisé
void screen_fill_rect(int x, int y, int w, int h) {
    for (int row = y; row < y + h && row < SCREEN_HEIGHT; row++) {
        // Optimisation : remplir des octets entiers quand possible
        int start_x = x;
        int end_x = x + w - 1;

        // Pixels de début (non alignés)
        while (start_x % 8 != 0 && start_x <= end_x) {
            screen_set_pixel(start_x++, row, 1);
        }

        // Octets complets
        while (start_x + 7 <= end_x) {
            int byte_offset = row * 40 + start_x / 8;
            framebuffer[byte_offset] = 0xFF;
            start_x += 8;
        }

        // Pixels de fin (non alignés)
        while (start_x <= end_x) {
            screen_set_pixel(start_x++, row, 1);
        }
    }
}
```

### Police bitmap

```c
// Police 5x7 pour les caractères ASCII 32-127
static const unsigned char font_5x7[96][7] = {
    // ' ' (32)
    { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 },
    // '!' (33)
    { 0x04, 0x04, 0x04, 0x04, 0x00, 0x04, 0x00 },
    // '"' (34)
    { 0x0A, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x00 },
    // ... etc pour chaque caractère

    // 'A' (65)
    { 0x04, 0x0A, 0x11, 0x1F, 0x11, 0x11, 0x00 },
    // 'B' (66)
    { 0x1E, 0x11, 0x1E, 0x11, 0x11, 0x1E, 0x00 },
    // ... etc
};

void screen_draw_char(int x, int y, char c) {
    if (c < 32 || c > 127) return;

    const unsigned char *glyph = font_5x7[c - 32];

    for (int row = 0; row < 7; row++) {
        unsigned char bits = glyph[row];
        for (int col = 0; col < 5; col++) {
            if (bits & (0x10 >> col)) {
                screen_set_pixel(x + col, y + row, 1);
            }
        }
    }
}

void screen_draw_string(int x, int y, char *s) {
    while (*s) {
        screen_draw_char(x, y, *s);
        x += 6;  // 5 pixels + 1 espace
        s++;
    }
}
```

## Driver de clavier

### Registres matériels

```c
#define KEYBOARD_ADDR ((volatile int*)0x00402600)

// Codes des touches spéciales
#define KEY_NONE      0
#define KEY_ENTER     10
#define KEY_BACKSPACE 8
#define KEY_ESCAPE    27
#define KEY_UP        128
#define KEY_DOWN      129
#define KEY_LEFT      130
#define KEY_RIGHT     131
```

### Interface

```c
// keyboard.h

void keyboard_init(void);
int  keyboard_read(void);       // Non-bloquant, retourne 0 si pas de touche
int  keyboard_wait(void);       // Bloquant
int  keyboard_is_pressed(void); // Vérifie si une touche est pressée
```

### Implémentation

```c
// keyboard.c

static volatile int *keyboard = KEYBOARD_ADDR;

void keyboard_init(void) {
    // Rien à faire pour l'instant
}

int keyboard_read(void) {
    return *keyboard;
}

int keyboard_wait(void) {
    int key;
    while ((key = keyboard_read()) == 0) {
        // Attente active
    }
    return key;
}

int keyboard_is_pressed(void) {
    return keyboard_read() != 0;
}

// Buffer de ligne pour readline
#define LINE_BUFFER_SIZE 80
static char line_buffer[LINE_BUFFER_SIZE];

char *keyboard_readline(void) {
    int pos = 0;

    while (1) {
        int key = keyboard_wait();

        if (key == KEY_ENTER) {
            line_buffer[pos] = '\0';
            screen_draw_char(pos * 6, 0, '\n');  // Ou putchar
            return line_buffer;
        }

        if (key == KEY_BACKSPACE && pos > 0) {
            pos--;
            // Efface le caractère à l'écran
            continue;
        }

        if (key >= 32 && key < 127 && pos < LINE_BUFFER_SIZE - 1) {
            line_buffer[pos++] = key;
            screen_draw_char(pos * 6, 0, key);  // Echo
        }
    }
}
```

## Driver de console (combiné)

```c
// console.h - Combine écran et clavier pour un terminal

typedef struct {
    int cursor_x;
    int cursor_y;
    int width;       // En caractères (320/6 = 53)
    int height;      // En caractères (240/8 = 30)
} Console;

void console_init(Console *c);
void console_putchar(Console *c, char ch);
void console_print(Console *c, char *s);
void console_clear(Console *c);
void console_scroll(Console *c);
```

### Implémentation

```c
// console.c

#define CHAR_WIDTH  6
#define CHAR_HEIGHT 8

void console_init(Console *c) {
    c->cursor_x = 0;
    c->cursor_y = 0;
    c->width = SCREEN_WIDTH / CHAR_WIDTH;
    c->height = SCREEN_HEIGHT / CHAR_HEIGHT;
    screen_init();
}

void console_scroll(Console *c) {
    // Copie chaque ligne vers le haut
    for (int y = 0; y < SCREEN_HEIGHT - CHAR_HEIGHT; y++) {
        for (int x = 0; x < 40; x++) {
            framebuffer[y * 40 + x] = framebuffer[(y + CHAR_HEIGHT) * 40 + x];
        }
    }

    // Efface la dernière ligne
    for (int y = SCREEN_HEIGHT - CHAR_HEIGHT; y < SCREEN_HEIGHT; y++) {
        for (int x = 0; x < 40; x++) {
            framebuffer[y * 40 + x] = 0;
        }
    }
}

void console_putchar(Console *c, char ch) {
    if (ch == '\n') {
        c->cursor_x = 0;
        c->cursor_y++;
    } else if (ch == '\r') {
        c->cursor_x = 0;
    } else if (ch == '\t') {
        c->cursor_x = (c->cursor_x + 4) & ~3;
    } else {
        int px = c->cursor_x * CHAR_WIDTH;
        int py = c->cursor_y * CHAR_HEIGHT;
        screen_draw_char(px, py, ch);
        c->cursor_x++;
    }

    // Retour à la ligne automatique
    if (c->cursor_x >= c->width) {
        c->cursor_x = 0;
        c->cursor_y++;
    }

    // Scroll si nécessaire
    if (c->cursor_y >= c->height) {
        console_scroll(c);
        c->cursor_y = c->height - 1;
    }
}

void console_print(Console *c, char *s) {
    while (*s) {
        console_putchar(c, *s++);
    }
}
```

## Abstraction générique

```c
// device.h - Interface générique

typedef struct Device Device;

struct Device {
    char *name;
    int (*init)(Device *dev);
    int (*read)(Device *dev, void *buf, int size);
    int (*write)(Device *dev, void *buf, int size);
    int (*ioctl)(Device *dev, int cmd, void *arg);
    void *private_data;
};

// Commandes ioctl communes
#define IOCTL_GET_SIZE     1
#define IOCTL_SET_BAUD     2
#define IOCTL_CLEAR        3
```

## Exercices

### Exercice 1 : Double buffering

Implémentez le double buffering pour éviter le flickering :

```c
static unsigned char backbuffer[SCREEN_SIZE];

void screen_draw_to_back(int x, int y, int on);
void screen_flip(void);  // Copie backbuffer → framebuffer
```

### Exercice 2 : Sprites

Implémentez les sprites 8x8 :

```c
void screen_draw_sprite(int x, int y, unsigned char sprite[8]);
void screen_draw_sprite_xor(int x, int y, unsigned char sprite[8]);
```

### Exercice 3 : Buffer clavier

Ajoutez un buffer circulaire pour le clavier :

```c
#define KB_BUFFER_SIZE 16
static int kb_buffer[KB_BUFFER_SIZE];
static int kb_head = 0, kb_tail = 0;

void keyboard_buffer_push(int key);
int keyboard_buffer_pop(void);
```

### Exercice 4 : Driver série (virtuel)

Implémentez un driver UART virtuel :

```c
void uart_init(int baud);
void uart_putchar(char c);
char uart_getchar(void);
```

## Points clés

1. **Abstraction** = séparer l'interface de l'implémentation
2. **MMIO** = volatile obligatoire
3. **Optimisation** = traiter les octets entiers quand possible
4. **Buffer** = lisse les différences de vitesse

## Prochaine étape

[Chapitre 5 : Le Shell →](05_shell.md)
