// Demo 04: Snake
// Jeu simplifie pour demonstration
//
// Note: c32 ne supporte pas les boucles infinies dans les tests,
// donc on execute un nombre limite d'iterations

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

// Variables du jeu
int snake_x[50];
int snake_y[50];
int snake_length;
int direction;
int apple_x;
int apple_y;
int score;
int random_state;

// Generateur pseudo-aleatoire simple
int random() {
    int bit;
    bit = ((random_state >> 0) ^ (random_state >> 2) ^
           (random_state >> 3) ^ (random_state >> 5)) & 1;
    random_state = (random_state >> 1) | (bit << 15);
    return random_state;
}

// Dessine un pixel (simplifie pour test)
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

// Dessine une case du serpent
void draw_cell(int gx, int gy, int on) {
    int px;
    int py;
    int x;
    int y;

    px = gx * 8;
    py = gy * 8;

    y = 1;
    while (y < 7) {
        x = 1;
        while (x < 7) {
            draw_pixel(px + x, py + y, on);
            x = x + 1;
        }
        y = y + 1;
    }
}

// Initialise le jeu
void init_game() {
    int i;

    snake_length = 3;
    i = 0;
    while (i < snake_length) {
        snake_x[i] = 20 - i;
        snake_y[i] = 15;
        i = i + 1;
    }

    direction = 1;
    score = 0;
    random_state = 12345;

    apple_x = 25;
    apple_y = 15;
}

// Verifie collision avec le serpent
int check_self_collision(int x, int y) {
    int i;
    i = 0;
    while (i < snake_length) {
        if (snake_x[i] == x) {
            if (snake_y[i] == y) {
                return 1;
            }
        }
        i = i + 1;
    }
    return 0;
}

// Deplace le serpent
int move_snake() {
    int new_x;
    int new_y;
    int tail_x;
    int tail_y;
    int i;
    int ate_apple;

    new_x = snake_x[0];
    new_y = snake_y[0];

    if (direction == 0) {
        new_y = new_y - 1;
    }
    if (direction == 1) {
        new_x = new_x + 1;
    }
    if (direction == 2) {
        new_y = new_y + 1;
    }
    if (direction == 3) {
        new_x = new_x - 1;
    }

    // Collision murs
    if (new_x <= 0) return 0;
    if (new_x >= 39) return 0;
    if (new_y <= 0) return 0;
    if (new_y >= 29) return 0;

    // Collision serpent
    if (check_self_collision(new_x, new_y)) {
        return 0;
    }

    // Sauve queue
    tail_x = snake_x[snake_length - 1];
    tail_y = snake_y[snake_length - 1];

    // Deplace corps
    i = snake_length - 1;
    while (i > 0) {
        snake_x[i] = snake_x[i - 1];
        snake_y[i] = snake_y[i - 1];
        i = i - 1;
    }

    snake_x[0] = new_x;
    snake_y[0] = new_y;

    // Mange pomme?
    ate_apple = 0;
    if (new_x == apple_x) {
        if (new_y == apple_y) {
            ate_apple = 1;
        }
    }

    if (ate_apple) {
        if (snake_length < 50) {
            snake_x[snake_length] = tail_x;
            snake_y[snake_length] = tail_y;
            snake_length = snake_length + 1;
        }
        score = score + 10;
        // Nouvelle pomme
        apple_x = 1 + (random() % 37);
        apple_y = 1 + (random() % 27);
    } else {
        draw_cell(tail_x, tail_y, 0);
    }

    draw_cell(new_x, new_y, 1);

    return 1;
}

int main() {
    int steps;
    int alive;
    int i;

    println("=== SNAKE Demo ===");
    println("Demonstration du jeu Snake");
    println("");

    init_game();

    // Dessine serpent initial
    i = 0;
    while (i < snake_length) {
        draw_cell(snake_x[i], snake_y[i], 1);
        i = i + 1;
    }

    // Dessine pomme
    draw_cell(apple_x, apple_y, 1);

    // Simulation: 10 mouvements vers la droite
    steps = 0;
    alive = 1;
    while (steps < 10) {
        if (alive) {
            alive = move_snake();
        }
        steps = steps + 1;
    }

    println("Simulation terminee!");
    print("Mouvements effectues: ");
    print_int(steps);
    println("");
    print("Score: ");
    print_int(score);
    println("");
    print("Longueur serpent: ");
    print_int(snake_length);
    println("");

    return 0;
}
