// Demo 04: Snake
// Jeu complet avec clavier et graphiques
//
// Concepts: boucle de jeu, gestion du clavier, logique de jeu, collision

// ============================================================
// Configuration matérielle
// ============================================================

#define SCREEN_WIDTH  320
#define SCREEN_HEIGHT 240
#define SCREEN_BASE   ((volatile char*)0x00400000)
#define KEYBOARD_ADDR ((volatile int*)0x00402600)
#define OUTPUT_PORT   ((volatile int*)0x10000000)

// Touches
#define KEY_UP    128
#define KEY_DOWN  129
#define KEY_LEFT  130
#define KEY_RIGHT 131
#define KEY_ESC   27

// Configuration du jeu
#define GRID_SIZE    8      // Taille d'une case en pixels
#define GRID_WIDTH   (SCREEN_WIDTH / GRID_SIZE)   // 40
#define GRID_HEIGHT  (SCREEN_HEIGHT / GRID_SIZE)  // 30
#define MAX_SNAKE    200    // Longueur max du serpent

// ============================================================
// Variables globales
// ============================================================

// Position du serpent (tableau de coordonnées)
int snake_x[MAX_SNAKE];
int snake_y[MAX_SNAKE];
int snake_length;

// Direction: 0=haut, 1=droite, 2=bas, 3=gauche
int direction;

// Position de la pomme
int apple_x;
int apple_y;

// Score et état
int score;
int game_over;

// Générateur pseudo-aléatoire (LFSR)
int random_state;

// ============================================================
// Fonctions utilitaires
// ============================================================

void putchar(int c) { *OUTPUT_PORT = c; }
void print(char *s) { while (*s) putchar(*s++); }
void println(char *s) { print(s); putchar(10); }

void print_int(int n) {
    char buf[12];
    int i = 0;
    if (n == 0) { putchar('0'); return; }
    if (n < 0) { putchar('-'); n = -n; }
    while (n > 0) { buf[i++] = '0' + n % 10; n = n / 10; }
    while (i > 0) putchar(buf[--i]);
}

int keyboard_read() {
    return *KEYBOARD_ADDR;
}

// Générateur pseudo-aléatoire simple (LFSR 16-bit)
int random() {
    int bit;
    bit = ((random_state >> 0) ^ (random_state >> 2) ^
           (random_state >> 3) ^ (random_state >> 5)) & 1;
    random_state = (random_state >> 1) | (bit << 15);
    return random_state;
}

// ============================================================
// Fonctions graphiques
// ============================================================

void screen_clear() {
    int i;
    volatile char *p = SCREEN_BASE;
    for (i = 0; i < 9600; i++) {
        *p = 0;
        p = p + 1;
    }
}

void draw_pixel(int x, int y, int on) {
    int byte_offset, bit_index, byte_val;
    volatile char *addr;

    if (x < 0 || x >= SCREEN_WIDTH || y < 0 || y >= SCREEN_HEIGHT) return;

    byte_offset = y * 40 + x / 8;
    bit_index = 7 - (x % 8);
    addr = SCREEN_BASE + byte_offset;
    byte_val = *addr;

    if (on) byte_val = byte_val | (1 << bit_index);
    else byte_val = byte_val & ~(1 << bit_index);

    *addr = byte_val;
}

// Remplit une case de la grille
void fill_cell(int gx, int gy, int on) {
    int px, py, x, y;
    px = gx * GRID_SIZE;
    py = gy * GRID_SIZE;

    for (y = 0; y < GRID_SIZE; y++) {
        for (x = 0; x < GRID_SIZE; x++) {
            draw_pixel(px + x, py + y, on);
        }
    }
}

// Dessine une case avec bordure (pour le serpent)
void draw_snake_cell(int gx, int gy) {
    int px, py, x, y;
    px = gx * GRID_SIZE;
    py = gy * GRID_SIZE;

    // Remplir le centre
    for (y = 1; y < GRID_SIZE - 1; y++) {
        for (x = 1; x < GRID_SIZE - 1; x++) {
            draw_pixel(px + x, py + y, 1);
        }
    }
}

// Dessine la pomme (petit motif)
void draw_apple(int gx, int gy) {
    int px, py;
    px = gx * GRID_SIZE;
    py = gy * GRID_SIZE;

    // Dessine un petit carré avec une "tige"
    draw_pixel(px + 4, py + 1, 1);  // Tige
    draw_pixel(px + 3, py + 2, 1);
    draw_pixel(px + 4, py + 2, 1);
    draw_pixel(px + 5, py + 2, 1);
    draw_pixel(px + 2, py + 3, 1);
    draw_pixel(px + 3, py + 3, 1);
    draw_pixel(px + 4, py + 3, 1);
    draw_pixel(px + 5, py + 3, 1);
    draw_pixel(px + 6, py + 3, 1);
    draw_pixel(px + 2, py + 4, 1);
    draw_pixel(px + 3, py + 4, 1);
    draw_pixel(px + 4, py + 4, 1);
    draw_pixel(px + 5, py + 4, 1);
    draw_pixel(px + 6, py + 4, 1);
    draw_pixel(px + 3, py + 5, 1);
    draw_pixel(px + 4, py + 5, 1);
    draw_pixel(px + 5, py + 5, 1);
}

// Dessine le cadre de jeu
void draw_border() {
    int i;
    // Ligne du haut et du bas
    for (i = 0; i < SCREEN_WIDTH; i++) {
        draw_pixel(i, 0, 1);
        draw_pixel(i, SCREEN_HEIGHT - 1, 1);
    }
    // Ligne gauche et droite
    for (i = 0; i < SCREEN_HEIGHT; i++) {
        draw_pixel(0, i, 1);
        draw_pixel(SCREEN_WIDTH - 1, i, 1);
    }
}

// ============================================================
// Logique du jeu
// ============================================================

// Place une nouvelle pomme
void place_apple() {
    int valid;
    int i;

    valid = 0;
    while (!valid) {
        apple_x = 1 + (random() % (GRID_WIDTH - 2));
        apple_y = 1 + (random() % (GRID_HEIGHT - 2));

        // Vérifie que la pomme n'est pas sur le serpent
        valid = 1;
        for (i = 0; i < snake_length; i++) {
            if (snake_x[i] == apple_x && snake_y[i] == apple_y) {
                valid = 0;
                break;
            }
        }
    }
}

// Initialise le jeu
void init_game() {
    int i;

    // Serpent initial au centre
    snake_length = 3;
    for (i = 0; i < snake_length; i++) {
        snake_x[i] = GRID_WIDTH / 2 - i;
        snake_y[i] = GRID_HEIGHT / 2;
    }

    direction = 1;  // Vers la droite
    score = 0;
    game_over = 0;
    random_state = 12345;  // Graine

    // Place la première pomme
    place_apple();

    // Dessine l'écran initial
    screen_clear();
    draw_border();

    for (i = 0; i < snake_length; i++) {
        draw_snake_cell(snake_x[i], snake_y[i]);
    }

    draw_apple(apple_x, apple_y);
}

// Vérifie les collisions
int check_collision(int x, int y) {
    int i;

    // Collision avec les murs
    if (x <= 0 || x >= GRID_WIDTH - 1) return 1;
    if (y <= 0 || y >= GRID_HEIGHT - 1) return 1;

    // Collision avec soi-même
    for (i = 0; i < snake_length; i++) {
        if (snake_x[i] == x && snake_y[i] == y) {
            return 1;
        }
    }

    return 0;
}

// Met à jour le jeu
void update_game() {
    int new_x, new_y;
    int i;
    int tail_x, tail_y;

    // Calcule la nouvelle position de la tête
    new_x = snake_x[0];
    new_y = snake_y[0];

    if (direction == 0) new_y = new_y - 1;       // Haut
    else if (direction == 1) new_x = new_x + 1;  // Droite
    else if (direction == 2) new_y = new_y + 1;  // Bas
    else if (direction == 3) new_x = new_x - 1;  // Gauche

    // Vérifie les collisions
    if (check_collision(new_x, new_y)) {
        game_over = 1;
        return;
    }

    // Sauvegarde la queue
    tail_x = snake_x[snake_length - 1];
    tail_y = snake_y[snake_length - 1];

    // Déplace le corps
    for (i = snake_length - 1; i > 0; i--) {
        snake_x[i] = snake_x[i - 1];
        snake_y[i] = snake_y[i - 1];
    }

    // Nouvelle position de la tête
    snake_x[0] = new_x;
    snake_y[0] = new_y;

    // Vérifie si on mange la pomme
    if (new_x == apple_x && new_y == apple_y) {
        // Grandit
        if (snake_length < MAX_SNAKE) {
            snake_x[snake_length] = tail_x;
            snake_y[snake_length] = tail_y;
            snake_length = snake_length + 1;
        }
        score = score + 10;
        place_apple();
        draw_apple(apple_x, apple_y);
    } else {
        // Efface l'ancienne queue
        fill_cell(tail_x, tail_y, 0);
    }

    // Dessine la nouvelle tête
    draw_snake_cell(new_x, new_y);
}

// Gère les entrées clavier
void handle_input() {
    int key;

    key = keyboard_read();
    if (key == 0) return;

    if (key == KEY_UP && direction != 2) {
        direction = 0;
    } else if (key == KEY_RIGHT && direction != 3) {
        direction = 1;
    } else if (key == KEY_DOWN && direction != 0) {
        direction = 2;
    } else if (key == KEY_LEFT && direction != 1) {
        direction = 3;
    } else if (key == KEY_ESC) {
        game_over = 1;
    }
}

// Délai simple
void delay(int count) {
    int i;
    for (i = 0; i < count; i++) {
        // Boucle vide
    }
}

// ============================================================
// Programme principal
// ============================================================

int main() {
    println("=== SNAKE ===");
    println("Utilisez les fleches pour diriger le serpent.");
    println("Mangez les pommes pour grandir!");
    println("Appuyez sur ESC pour quitter.");
    println("");

    init_game();

    // Boucle de jeu principale
    while (!game_over) {
        handle_input();
        update_game();
        delay(50000);  // Ajuster pour la vitesse
    }

    // Fin du jeu
    println("");
    println("=== GAME OVER ===");
    print("Score final: ");
    print_int(score);
    println("");

    return 0;
}
