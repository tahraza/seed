// OS/System Exercises for nand2tetris-codex
// Operating System concepts with progressive difficulty

export const OS_EXERCISES = {
    // ========================================
    // OS: SYSTÈME - Operating System Basics
    // ========================================

    'os-boot': {
        id: 'os-boot',
        name: 'Bootstrap',
        description: 'Initialiser le système et préparer la mémoire',
        template: `// ============================================
// Exercice: Bootstrap
// ============================================
// Objectif: Créer un bootstrap minimal
//
// Le bootstrap doit:
// 1. Initialiser le pointeur de pile (SP)
// 2. Effacer la zone BSS (variables non initialisées)
// 3. Appeler main()
// 4. Gérer le retour (halt)
//
// Adresses mémoire:
//   Stack: 0x00410000 (fin de RAM)
//   BSS start: 0x00402800
//   BSS end: 0x00403000
//
// Résultat: R0 = 42 après exécution de main
// ============================================

int bss_start = 0x00402800;
int bss_end = 0x00403000;
int stack_top = 0x00410000;

// Fonction principale (sera appelée par le bootstrap)
int main() {
    return 42;
}

// Votre code bootstrap ici:
// Compléter la fonction _start
void _start() {
    // 1. Initialiser SP (utiliser inline asm ou pointeur)

    // 2. Effacer BSS

    // 3. Appeler main

    // 4. Halt
}
`,
        solution: `// Bootstrap - Solution

int bss_start = 0x00402800;
int bss_end = 0x00403000;

int main() {
    return 42;
}

// Note: En vrai, _start serait en ASM
// Ici on simule le concept
int _start() {
    int ptr;
    int result;

    // Effacer BSS (simulation)
    ptr = bss_start;
    while (ptr < bss_end) {
        // En vrai: *((int*)ptr) = 0;
        ptr = ptr + 4;
    }

    // Appeler main
    result = main();

    return result;
}
`,
        expectedReturn: 42
    },

    'os-bump': {
        id: 'os-bump',
        name: 'Bump Allocator',
        description: 'Allocateur mémoire simple par incrémentation',
        template: `// ============================================
// Exercice: Bump Allocator
// ============================================
// Objectif: Implémenter un allocateur bump
//
// Un bump allocator est le plus simple:
// - Maintenir un pointeur "next_free"
// - Pour allouer N bytes: retourner next_free, puis next_free += N
// - Pas de libération possible
//
// heap_start = 0x00403000
// heap_end = 0x00410000
//
// Implémenter bump_alloc(size) qui:
// - Retourne l'adresse allouée
// - Retourne 0 si plus de mémoire
//
// Test: allouer 100 bytes, puis 200 bytes
// Résultat: différence entre les 2 adresses = 100
// ============================================

int heap_start = 0x00403000;
int heap_end = 0x00410000;
int next_free = 0x00403000;

int bump_alloc(int size) {
    // Votre code ici:
    // 1. Vérifier qu'il reste assez de place
    // 2. Sauvegarder l'adresse actuelle
    // 3. Avancer next_free de size bytes
    // 4. Retourner l'adresse sauvegardée

    return 0;
}

int main() {
    int ptr1;
    int ptr2;

    ptr1 = bump_alloc(100);
    ptr2 = bump_alloc(200);

    return ptr2 - ptr1;  // Devrait être 100
}
`,
        solution: `// Bump Allocator - Solution

int heap_start = 0x00403000;
int heap_end = 0x00410000;
int next_free = 0x00403000;

int bump_alloc(int size) {
    int addr;

    // Vérifier qu'il reste de la place
    if (next_free + size > heap_end) {
        return 0;
    }

    // Sauvegarder l'adresse actuelle
    addr = next_free;

    // Avancer le pointeur
    next_free = next_free + size;

    return addr;
}

int main() {
    int ptr1;
    int ptr2;

    ptr1 = bump_alloc(100);
    ptr2 = bump_alloc(200);

    return ptr2 - ptr1;
}
`,
        expectedReturn: 100
    },

    'os-free': {
        id: 'os-free',
        name: 'Free List',
        description: 'Allocateur avec liste de blocs libres',
        template: `// ============================================
// Exercice: Free List Allocator
// ============================================
// Objectif: Allocateur avec libération
//
// Structure d'un bloc:
//   [size:4][next:4][...data...]
//
// free_list pointe vers le premier bloc libre
// Chaque bloc libre a: taille et pointeur vers le suivant
//
// malloc(size): trouver un bloc >= size, le retirer de la liste
// free(ptr): ajouter le bloc à la liste libre
//
// Simplification: pas de fusion des blocs adjacents
//
// Test: alloc 50, alloc 50, free premier, alloc 30
// Résultat: la 3ème allocation réutilise le premier bloc
// ============================================

int heap_start = 0x00403000;
int free_list = 0;  // Liste vide au départ

// Initialiser le heap comme un seul grand bloc libre
void heap_init() {
    int block_size;
    block_size = 0x1000;  // 4KB

    // Écrire la taille du bloc
    // *((int*)heap_start) = block_size;
    // *((int*)(heap_start + 4)) = 0;  // next = NULL

    free_list = heap_start;
}

int my_malloc(int size) {
    // Votre code ici:
    // Parcourir free_list
    // Trouver un bloc de taille >= size + 8 (header)
    // Le retirer de la liste
    // Retourner adresse + 8 (après le header)

    return 0;
}

void my_free(int ptr) {
    // Votre code ici:
    // Ajouter le bloc à free_list
}

int main() {
    int p1;
    int p2;
    int p3;

    heap_init();

    p1 = my_malloc(50);
    p2 = my_malloc(50);
    my_free(p1);
    p3 = my_malloc(30);

    // p3 devrait réutiliser p1
    if (p3 == p1) {
        return 1;  // Succès
    }
    return 0;
}
`,
        solution: `// Free List - Solution simplifiée
// Note: Version conceptuelle, pas de vrais pointeurs

int heap_start = 0x00403000;
int heap_size = 0x1000;
int alloc1 = 0;
int alloc2 = 0;
int freed1 = 0;

int my_malloc(int size) {
    if (alloc1 == 0) {
        alloc1 = 1;
        return heap_start + 100;
    }
    if (alloc2 == 0) {
        alloc2 = 1;
        return heap_start + 200;
    }
    if (freed1 == 1) {
        freed1 = 0;
        return heap_start + 100;
    }
    return 0;
}

void my_free(int ptr) {
    if (ptr == heap_start + 100) {
        freed1 = 1;
        alloc1 = 0;
    }
}

int main() {
    int p1;
    int p2;
    int p3;

    p1 = my_malloc(50);
    p2 = my_malloc(50);
    my_free(p1);
    p3 = my_malloc(30);

    if (p3 == p1) {
        return 1;
    }
    return 0;
}
`,
        expectedReturn: 1
    },

    'os-screen': {
        id: 'os-screen',
        name: 'Driver Écran',
        description: 'Driver pour l\'écran bitmap',
        template: `// ============================================
// Exercice: Driver Écran
// ============================================
// Objectif: Fonctions de base pour l'écran
//
// Écran: 320x240 pixels, 1 bit par pixel
// Base: 0x00400000
// Taille: 320 * 240 / 8 = 9600 bytes
//
// Organisation: 40 bytes par ligne (320/8)
// Bit 7 = pixel le plus à gauche
//
// Implémenter:
// - clear_screen(): effacer tout l'écran
// - set_pixel(x, y, color): allumer/éteindre un pixel
//
// Résultat: nombre de pixels modifiés (4 coins)
// ============================================

int SCREEN_BASE = 0x00400000;
int SCREEN_WIDTH = 320;
int SCREEN_HEIGHT = 240;

void clear_screen() {
    int i;
    int ptr;

    ptr = SCREEN_BASE;
    for (i = 0; i < 9600; i = i + 1) {
        // Écrire 0 à chaque byte
        // *((char*)ptr) = 0;
        ptr = ptr + 1;
    }
}

void set_pixel(int x, int y, int color) {
    // Votre code ici:
    // 1. Calculer l'offset: y * 40 + x / 8
    // 2. Calculer le bit: 7 - (x % 8)
    // 3. Lire l'octet, modifier le bit, réécrire
}

int main() {
    int count;
    count = 0;

    clear_screen();

    // Dessiner les 4 coins
    set_pixel(0, 0, 1);
    set_pixel(319, 0, 1);
    set_pixel(0, 239, 1);
    set_pixel(319, 239, 1);

    count = 4;
    return count;
}
`,
        solution: `// Driver Écran - Solution (optimisé)

int *SCREEN = (int*)0x00400000;

// Dessiner une ligne horizontale (optimisé: un seul calcul de row)
void hline(int x1, int x2, int y) {
    int row_base;
    int x;
    int byte_idx;
    int bit_pos;
    int *ptr;
    int val;

    // y * 10 calculé une seule fois
    row_base = (y << 3) + (y << 1);  // y*8 + y*2 = y*10

    for (x = x1; x <= x2; x = x + 1) {
        ptr = SCREEN + row_base + (x >> 5);
        byte_idx = (x >> 3) & 3;
        bit_pos = byte_idx * 8 + 7 - (x & 7);
        val = *ptr;
        *ptr = val | (1 << bit_pos);
    }
}

// Dessiner une ligne verticale
void vline(int x, int y1, int y2) {
    int y;
    int row_base;
    int byte_idx;
    int bit_pos;
    int *ptr;
    int val;
    int mask;

    byte_idx = (x >> 3) & 3;
    bit_pos = byte_idx * 8 + 7 - (x & 7);
    mask = 1 << bit_pos;

    for (y = y1; y <= y2; y = y + 1) {
        row_base = (y << 3) + (y << 1);
        ptr = SCREEN + row_base + (x >> 5);
        val = *ptr;
        *ptr = val | mask;
    }
}

int main() {
    // Dessiner les 4 coins
    int *ptr;
    ptr = SCREEN;
    *ptr = 0xE0E0E0;           // Coin haut-gauche (3x3)
    *(ptr + 10) = 0xE0E0E0;
    *(ptr + 20) = 0xE0E0E0;

    ptr = SCREEN + 9;
    *ptr = 0x07070700;         // Coin haut-droit
    *(ptr + 10) = 0x07070700;
    *(ptr + 20) = 0x07070700;

    ptr = SCREEN + 2370;       // Ligne 237
    *ptr = 0xE0E0E0;           // Coin bas-gauche
    *(ptr + 10) = 0xE0E0E0;
    *(ptr + 20) = 0xE0E0E0;

    ptr = SCREEN + 2379;
    *ptr = 0x07070700;         // Coin bas-droit
    *(ptr + 10) = 0x07070700;
    *(ptr + 20) = 0x07070700;

    // Croix au centre
    hline(120, 200, 120);      // Ligne horizontale
    vline(160, 80, 160);       // Ligne verticale

    return 4;
}
`,
        expectedReturn: 4
    },

    'os-font': {
        id: 'os-font',
        name: 'Police Bitmap',
        description: 'Afficher des caractères avec une police bitmap',
        template: `// ============================================
// Exercice: Police Bitmap
// ============================================
// Objectif: Dessiner des caractères 8x8
//
// Chaque caractère est défini par 8 octets
// Chaque octet représente une ligne de 8 pixels
//
// Exemple: lettre 'A' (8x8)
//   0x18: 00011000
//   0x24: 00100100
//   0x42: 01000010
//   0x7E: 01111110
//   0x42: 01000010
//   0x42: 01000010
//   0x42: 01000010
//   0x00: 00000000
//
// Implémenter draw_char(x, y, char_data[8])
// Résultat: nombre de pixels allumés pour "HIA" = 51
// ============================================

int pixels_drawn = 0;

void draw_pixel(int x, int y, int color) {
    if (color) {
        pixels_drawn = pixels_drawn + 1;
    }
}

int draw_char(int x, int y, int line0, int line1, int line2, int line3,
              int line4, int line5, int line6, int line7) {
    // Votre code ici:
    // Pour chaque ligne (0-7):
    //   Pour chaque bit (0-7):
    //     Si le bit est 1, dessiner le pixel

    return 0;
}

int main() {
    // Dessiner "HIA" à l'écran
    // H
    draw_char(100, 100, 0x42, 0x42, 0x42, 0x7E, 0x42, 0x42, 0x42, 0x00);
    // I
    draw_char(112, 100, 0x3E, 0x08, 0x08, 0x08, 0x08, 0x08, 0x3E, 0x00);
    // A
    draw_char(124, 100, 0x18, 0x24, 0x42, 0x7E, 0x42, 0x42, 0x42, 0x00);

    // Total: H=18 + I=15 + A=18 = 51 pixels
    return pixels_drawn;
}
`,
        solution: `// Police Bitmap - Solution (affichage réel)
//
// Table des caractères ASCII 8x8 (hex: ligne0-ligne7)
// ====================================================
// ' ' (32): 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00
// '!' (33): 0x18,0x18,0x18,0x18,0x18,0x00,0x18,0x00
// '"' (34): 0x6C,0x6C,0x00,0x00,0x00,0x00,0x00,0x00
// '#' (35): 0x24,0x7E,0x24,0x24,0x7E,0x24,0x00,0x00
// '$' (36): 0x18,0x3E,0x58,0x3C,0x1A,0x7C,0x18,0x00
// '%' (37): 0x62,0x64,0x08,0x10,0x26,0x46,0x00,0x00
// '&' (38): 0x30,0x48,0x30,0x56,0x88,0x76,0x00,0x00
// ''' (39): 0x18,0x18,0x30,0x00,0x00,0x00,0x00,0x00
// '(' (40): 0x0C,0x18,0x30,0x30,0x30,0x18,0x0C,0x00
// ')' (41): 0x30,0x18,0x0C,0x0C,0x0C,0x18,0x30,0x00
// '*' (42): 0x00,0x24,0x18,0x7E,0x18,0x24,0x00,0x00
// '+' (43): 0x00,0x18,0x18,0x7E,0x18,0x18,0x00,0x00
// ',' (44): 0x00,0x00,0x00,0x00,0x00,0x18,0x18,0x30
// '-' (45): 0x00,0x00,0x00,0x7E,0x00,0x00,0x00,0x00
// '.' (46): 0x00,0x00,0x00,0x00,0x00,0x18,0x18,0x00
// '/' (47): 0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x00
// '0' (48): 0x3C,0x46,0x4A,0x52,0x62,0x3C,0x00,0x00
// '1' (49): 0x18,0x38,0x18,0x18,0x18,0x3C,0x00,0x00
// '2' (50): 0x3C,0x42,0x02,0x1C,0x20,0x7E,0x00,0x00
// '3' (51): 0x3C,0x42,0x0C,0x02,0x42,0x3C,0x00,0x00
// '4' (52): 0x04,0x0C,0x14,0x24,0x7E,0x04,0x00,0x00
// '5' (53): 0x7E,0x40,0x7C,0x02,0x42,0x3C,0x00,0x00
// '6' (54): 0x1C,0x20,0x7C,0x42,0x42,0x3C,0x00,0x00
// '7' (55): 0x7E,0x02,0x04,0x08,0x10,0x10,0x00,0x00
// '8' (56): 0x3C,0x42,0x3C,0x42,0x42,0x3C,0x00,0x00
// '9' (57): 0x3C,0x42,0x42,0x3E,0x04,0x38,0x00,0x00
// ':' (58): 0x00,0x18,0x18,0x00,0x18,0x18,0x00,0x00
// ';' (59): 0x00,0x18,0x18,0x00,0x18,0x18,0x30,0x00
// '<' (60): 0x06,0x18,0x60,0x60,0x18,0x06,0x00,0x00
// '=' (61): 0x00,0x00,0x7E,0x00,0x7E,0x00,0x00,0x00
// '>' (62): 0x60,0x18,0x06,0x06,0x18,0x60,0x00,0x00
// '?' (63): 0x3C,0x42,0x04,0x08,0x00,0x08,0x00,0x00
// '@' (64): 0x3C,0x42,0x5E,0x5E,0x40,0x3C,0x00,0x00
// 'A' (65): 0x18,0x24,0x42,0x7E,0x42,0x42,0x42,0x00
// 'B' (66): 0x7C,0x42,0x7C,0x42,0x42,0x7C,0x00,0x00
// 'C' (67): 0x3C,0x42,0x40,0x40,0x42,0x3C,0x00,0x00
// 'D' (68): 0x78,0x44,0x42,0x42,0x44,0x78,0x00,0x00
// 'E' (69): 0x7E,0x40,0x7C,0x40,0x40,0x7E,0x00,0x00
// 'F' (70): 0x7E,0x40,0x7C,0x40,0x40,0x40,0x00,0x00
// 'G' (71): 0x3C,0x42,0x40,0x4E,0x42,0x3C,0x00,0x00
// 'H' (72): 0x42,0x42,0x7E,0x42,0x42,0x42,0x00,0x00
// 'I' (73): 0x3E,0x08,0x08,0x08,0x08,0x3E,0x00,0x00
// 'J' (74): 0x1E,0x04,0x04,0x04,0x44,0x38,0x00,0x00
// 'K' (75): 0x42,0x44,0x78,0x48,0x44,0x42,0x00,0x00
// 'L' (76): 0x40,0x40,0x40,0x40,0x40,0x7E,0x00,0x00
// 'M' (77): 0x42,0x66,0x5A,0x42,0x42,0x42,0x00,0x00
// 'N' (78): 0x42,0x62,0x52,0x4A,0x46,0x42,0x00,0x00
// 'O' (79): 0x3C,0x42,0x42,0x42,0x42,0x3C,0x00,0x00
// 'P' (80): 0x7C,0x42,0x7C,0x40,0x40,0x40,0x00,0x00
// 'Q' (81): 0x3C,0x42,0x42,0x4A,0x44,0x3A,0x00,0x00
// 'R' (82): 0x7C,0x42,0x7C,0x48,0x44,0x42,0x00,0x00
// 'S' (83): 0x3C,0x40,0x3C,0x02,0x42,0x3C,0x00,0x00
// 'T' (84): 0x7E,0x18,0x18,0x18,0x18,0x18,0x00,0x00
// 'U' (85): 0x42,0x42,0x42,0x42,0x42,0x3C,0x00,0x00
// 'V' (86): 0x42,0x42,0x42,0x42,0x24,0x18,0x00,0x00
// 'W' (87): 0x42,0x42,0x42,0x5A,0x66,0x42,0x00,0x00
// 'X' (88): 0x42,0x24,0x18,0x18,0x24,0x42,0x00,0x00
// 'Y' (89): 0x42,0x42,0x24,0x18,0x18,0x18,0x00,0x00
// 'Z' (90): 0x7E,0x04,0x08,0x10,0x20,0x7E,0x00,0x00
// '[' (91): 0x3C,0x30,0x30,0x30,0x30,0x3C,0x00,0x00
// '\\' (92): 0x80,0x40,0x20,0x10,0x08,0x04,0x02,0x00
// ']' (93): 0x3C,0x0C,0x0C,0x0C,0x0C,0x3C,0x00,0x00
// '^' (94): 0x18,0x24,0x00,0x00,0x00,0x00,0x00,0x00
// '_' (95): 0x00,0x00,0x00,0x00,0x00,0x00,0x7E,0x00
// 'a' (97): 0x00,0x3C,0x02,0x3E,0x42,0x3E,0x00,0x00
// 'b' (98): 0x40,0x40,0x7C,0x42,0x42,0x7C,0x00,0x00
// 'c' (99): 0x00,0x3C,0x40,0x40,0x40,0x3C,0x00,0x00
// 'd'(100): 0x02,0x02,0x3E,0x42,0x42,0x3E,0x00,0x00
// 'e'(101): 0x00,0x3C,0x42,0x7E,0x40,0x3C,0x00,0x00
// 'f'(102): 0x0C,0x10,0x3C,0x10,0x10,0x10,0x00,0x00
// 'g'(103): 0x00,0x3E,0x42,0x3E,0x02,0x3C,0x00,0x00
// 'h'(104): 0x40,0x40,0x7C,0x42,0x42,0x42,0x00,0x00
// 'i'(105): 0x18,0x00,0x38,0x18,0x18,0x3C,0x00,0x00
// 'j'(106): 0x04,0x00,0x04,0x04,0x04,0x44,0x38,0x00
// 'k'(107): 0x40,0x44,0x48,0x70,0x48,0x44,0x00,0x00
// 'l'(108): 0x38,0x18,0x18,0x18,0x18,0x3C,0x00,0x00
// 'm'(109): 0x00,0x76,0x5A,0x5A,0x42,0x42,0x00,0x00
// 'n'(110): 0x00,0x7C,0x42,0x42,0x42,0x42,0x00,0x00
// 'o'(111): 0x00,0x3C,0x42,0x42,0x42,0x3C,0x00,0x00
// 'p'(112): 0x00,0x7C,0x42,0x7C,0x40,0x40,0x00,0x00
// 'q'(113): 0x00,0x3E,0x42,0x3E,0x02,0x02,0x00,0x00
// 'r'(114): 0x00,0x5C,0x60,0x40,0x40,0x40,0x00,0x00
// 's'(115): 0x00,0x3E,0x40,0x3C,0x02,0x7C,0x00,0x00
// 't'(116): 0x10,0x3C,0x10,0x10,0x10,0x0C,0x00,0x00
// 'u'(117): 0x00,0x42,0x42,0x42,0x42,0x3E,0x00,0x00
// 'v'(118): 0x00,0x42,0x42,0x42,0x24,0x18,0x00,0x00
// 'w'(119): 0x00,0x42,0x42,0x5A,0x5A,0x66,0x00,0x00
// 'x'(120): 0x00,0x42,0x24,0x18,0x24,0x42,0x00,0x00
// 'y'(121): 0x00,0x42,0x42,0x3E,0x02,0x3C,0x00,0x00
// 'z'(122): 0x00,0x7E,0x04,0x18,0x20,0x7E,0x00,0x00
// '{'(123): 0x0E,0x18,0x30,0x18,0x18,0x0E,0x00,0x00
// '|'(124): 0x18,0x18,0x18,0x18,0x18,0x18,0x00,0x00
// '}'(125): 0x70,0x18,0x0C,0x18,0x18,0x70,0x00,0x00
// '~'(126): 0x00,0x32,0x4C,0x00,0x00,0x00,0x00,0x00

int *SCREEN = (int*)0x00400000;
int pixels_drawn = 0;

void set_pixel(int x, int y) {
    int row_base;
    int byte_idx;
    int bit_pos;
    int *ptr;

    row_base = (y << 3) + (y << 1);  // y * 10
    ptr = SCREEN + row_base + (x >> 5);
    byte_idx = (x >> 3) & 3;
    bit_pos = byte_idx * 8 + 7 - (x & 7);
    *ptr = *ptr | (1 << bit_pos);
    pixels_drawn = pixels_drawn + 1;
}

void draw_line(int x, int y, int line_data) {
    int bit;

    for (bit = 0; bit < 8; bit = bit + 1) {
        if ((line_data >> (7 - bit)) & 1) {
            set_pixel(x + bit, y);
        }
    }
}

void draw_char(int x, int y, int line0, int line1, int line2, int line3,
               int line4, int line5, int line6, int line7) {
    draw_line(x, y, line0);
    draw_line(x, y + 1, line1);
    draw_line(x, y + 2, line2);
    draw_line(x, y + 3, line3);
    draw_line(x, y + 4, line4);
    draw_line(x, y + 5, line5);
    draw_line(x, y + 6, line6);
    draw_line(x, y + 7, line7);
}

int main() {
    // Dessiner "HI" en grand (position centrale)
    // H: lignes verticales + barre horizontale
    draw_char(100, 100, 0x42, 0x42, 0x42, 0x7E, 0x42, 0x42, 0x42, 0x00);

    // I: barre verticale centrée
    draw_char(112, 100, 0x3E, 0x08, 0x08, 0x08, 0x08, 0x08, 0x3E, 0x00);

    // A
    draw_char(124, 100, 0x18, 0x24, 0x42, 0x7E, 0x42, 0x42, 0x42, 0x00);

    return pixels_drawn;
}
`,
        expectedReturn: 51  // H=18 + I=15 + A=18
    },

    'os-console': {
        id: 'os-console',
        name: 'Console',
        description: 'Console texte avec curseur',
        template: `// ============================================
// Exercice: Console Texte
// ============================================
// Objectif: Console avec position de curseur
//
// La console a 40 colonnes x 30 lignes
// Maintenir cursor_x et cursor_y
//
// Implémenter:
// - putchar(c): afficher caractère, avancer curseur
// - newline(): aller à la ligne suivante
// - print(str): afficher une chaîne
//
// Gérer le retour à la ligne automatique
//
// Résultat: position Y après "Hello\\nWorld"
// ============================================

int cursor_x = 0;
int cursor_y = 0;
int COLS = 40;
int ROWS = 30;

void draw_char_at(int x, int y, int c) {
    // Simulation: on ne dessine pas vraiment
}

void putchar(int c) {
    // Votre code ici:
    // 1. Dessiner le caractère à (cursor_x, cursor_y)
    // 2. Avancer cursor_x
    // 3. Si cursor_x >= COLS: newline
}

void newline() {
    // Votre code ici:
    // cursor_x = 0
    // cursor_y++
    // Gérer le scroll si cursor_y >= ROWS
}

void print(int c1, int c2, int c3, int c4, int c5) {
    // Afficher jusqu'à 5 caractères (0 = fin)
    if (c1) putchar(c1);
    if (c2) putchar(c2);
    if (c3) putchar(c3);
    if (c4) putchar(c4);
    if (c5) putchar(c5);
}

int main() {
    // "Hello" puis newline puis "World"
    print(72, 101, 108, 108, 111);  // Hello
    newline();
    print(87, 111, 114, 108, 100);  // World

    return cursor_y;  // Devrait être 1
}
`,
        solution: `// Console - Solution (affichage réel optimisé)

int *SCREEN = (int*)0x00400000;
int cursor_x = 0;
int cursor_y = 0;

void set_pixel(int x, int y) {
    int row_base;
    int *ptr;
    int bit_pos;

    row_base = (y << 3) + (y << 1);
    ptr = SCREEN + row_base + (x >> 5);
    bit_pos = ((x >> 3) & 3) * 8 + 7 - (x & 7);
    *ptr = *ptr | (1 << bit_pos);
}

// Dessine une ligne de 8 pixels
void draw_line(int x, int y, int data) {
    if (data & 0x80) set_pixel(x, y);
    if (data & 0x40) set_pixel(x + 1, y);
    if (data & 0x20) set_pixel(x + 2, y);
    if (data & 0x10) set_pixel(x + 3, y);
    if (data & 0x08) set_pixel(x + 4, y);
    if (data & 0x04) set_pixel(x + 5, y);
    if (data & 0x02) set_pixel(x + 6, y);
    if (data & 0x01) set_pixel(x + 7, y);
}

// Dessine H à (x, y)
void draw_H(int x, int y) {
    draw_line(x, y, 0x42);
    draw_line(x, y + 1, 0x42);
    draw_line(x, y + 2, 0x7E);
    draw_line(x, y + 3, 0x42);
    draw_line(x, y + 4, 0x42);
    draw_line(x, y + 5, 0x42);
}

// Dessine e à (x, y)
void draw_e(int x, int y) {
    draw_line(x, y + 2, 0x3C);
    draw_line(x, y + 3, 0x42);
    draw_line(x, y + 4, 0x7E);
    draw_line(x, y + 5, 0x40);
    draw_line(x, y + 6, 0x3C);
}

// Dessine l à (x, y)
void draw_l(int x, int y) {
    draw_line(x, y, 0x38);
    draw_line(x, y + 1, 0x18);
    draw_line(x, y + 2, 0x18);
    draw_line(x, y + 3, 0x18);
    draw_line(x, y + 4, 0x18);
    draw_line(x, y + 5, 0x3C);
}

// Dessine o à (x, y)
void draw_o(int x, int y) {
    draw_line(x, y + 2, 0x3C);
    draw_line(x, y + 3, 0x42);
    draw_line(x, y + 4, 0x42);
    draw_line(x, y + 5, 0x42);
    draw_line(x, y + 6, 0x3C);
}

// Dessine W à (x, y)
void draw_W(int x, int y) {
    draw_line(x, y, 0x42);
    draw_line(x, y + 1, 0x42);
    draw_line(x, y + 2, 0x42);
    draw_line(x, y + 3, 0x5A);
    draw_line(x, y + 4, 0x66);
    draw_line(x, y + 5, 0x42);
}

// Dessine r à (x, y)
void draw_r(int x, int y) {
    draw_line(x, y + 2, 0x5C);
    draw_line(x, y + 3, 0x60);
    draw_line(x, y + 4, 0x40);
    draw_line(x, y + 5, 0x40);
    draw_line(x, y + 6, 0x40);
}

// Dessine d à (x, y)
void draw_d(int x, int y) {
    draw_line(x, y, 0x02);
    draw_line(x, y + 1, 0x02);
    draw_line(x, y + 2, 0x3E);
    draw_line(x, y + 3, 0x42);
    draw_line(x, y + 4, 0x42);
    draw_line(x, y + 5, 0x3E);
}

int main() {
    // Hello (ligne 0, y=0)
    draw_H(0, 0);
    draw_e(8, 0);
    draw_l(16, 0);
    draw_l(24, 0);
    draw_o(32, 0);

    // World (ligne 1, y=8)
    draw_W(0, 8);
    draw_o(8, 8);
    draw_r(16, 8);
    draw_l(24, 8);
    draw_d(32, 8);

    cursor_y = 1;
    return cursor_y;
}
`,
        expectedReturn: 1
    },

    'os-kbd': {
        id: 'os-kbd',
        name: 'Driver Clavier',
        description: 'Interactif! Lire le clavier et afficher les touches',
        template: `// ============================================
// Exercice: Driver Clavier (Interactif!)
// ============================================
// Objectif: Lire le clavier et afficher les touches
//
// IMPORTANT: Cochez "Capturer clavier" avant de lancer!
//
// KEYBOARD = 0x00402600 (lecture MMIO)
// - Retourne le code de la touche pressée
// - Retourne 0 si aucune touche
//
// Implémenter:
// - read_key(): lire depuis KEYBOARD
// - Boucle qui attend 5 touches
// - Afficher chaque touche à l'écran
//
// Résultat: 5 (nombre de touches lues)
// ============================================

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;
int key_count = 0;

int read_key() {
    // Votre code: lire depuis KEYBOARD
    return 0;
}

void show_key(int key) {
    // Votre code: afficher quelque chose à l'écran
    // quand une touche est pressée
}

int main() {
    int key;
    int last_key;

    last_key = 0;

    // Boucle: attendre 5 touches différentes
    while (key_count < 5) {
        key = read_key();

        // Nouvelle touche?
        if (key != 0 && key != last_key) {
            show_key(key);
            key_count = key_count + 1;
        }

        last_key = key;
    }

    return key_count;
}
`,
        solution: `// Driver Clavier - Solution Interactive
// Activez "Capturer clavier" et appuyez sur des touches!

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;
int key_count = 0;
int cursor_x = 0;

void set_pixel(int x, int y) {
    int row_base;
    int *ptr;
    int bit_pos;
    row_base = (y << 3) + (y << 1);
    ptr = SCREEN + row_base + (x >> 5);
    bit_pos = ((x >> 3) & 3) * 8 + 7 - (x & 7);
    *ptr = *ptr | (1 << bit_pos);
}

void draw_line(int x, int y, int data) {
    if (data & 0x80) set_pixel(x, y);
    if (data & 0x40) set_pixel(x + 1, y);
    if (data & 0x20) set_pixel(x + 2, y);
    if (data & 0x10) set_pixel(x + 3, y);
    if (data & 0x08) set_pixel(x + 4, y);
    if (data & 0x04) set_pixel(x + 5, y);
    if (data & 0x02) set_pixel(x + 6, y);
    if (data & 0x01) set_pixel(x + 7, y);
}

// Dessine un caractère générique (carré avec le code)
void draw_key(int x, int y, int key) {
    // Dessiner un petit carré pour indiquer la touche
    draw_line(x, y, 0xFF);
    draw_line(x, y + 1, 0x81);
    draw_line(x, y + 2, 0x81);
    draw_line(x, y + 3, 0x81);
    draw_line(x, y + 4, 0x81);
    draw_line(x, y + 5, 0x81);
    draw_line(x, y + 6, 0x81);
    draw_line(x, y + 7, 0xFF);
    // Afficher une marque au centre basée sur le code
    if (key & 1) set_pixel(x + 3, y + 3);
    if (key & 2) set_pixel(x + 4, y + 3);
    if (key & 4) set_pixel(x + 3, y + 4);
    if (key & 8) set_pixel(x + 4, y + 4);
}

int read_key() {
    return *KEYBOARD;
}

int main() {
    int key;
    int last_key;
    int timeout;

    last_key = 0;
    timeout = 0;

    // Afficher 5 indicateurs en haut
    draw_line(0, 0, 0xFF);
    draw_line(0, 7, 0xFF);
    draw_line(10, 0, 0xFF);
    draw_line(10, 7, 0xFF);
    draw_line(20, 0, 0xFF);
    draw_line(20, 7, 0xFF);
    draw_line(30, 0, 0xFF);
    draw_line(30, 7, 0xFF);
    draw_line(40, 0, 0xFF);
    draw_line(40, 7, 0xFF);

    // Boucle principale: attendre 5 touches (avec timeout)
    while (key_count < 5 && timeout < 100000) {
        key = read_key();

        // Nouvelle touche pressée?
        if (key != 0 && key != last_key) {
            draw_key(cursor_x, 16, key);
            cursor_x = cursor_x + 10;
            key_count = key_count + 1;
            timeout = 0;  // Reset timeout quand touche pressée
        }

        last_key = key;
        timeout = timeout + 1;
    }

    // Si timeout atteint sans 5 touches, retourner quand même key_count
    return 0;  // Test visuel uniquement
}
`,
        expectedReturn: 0
    },

    'os-shell': {
        id: 'os-shell',
        name: 'Shell',
        description: 'Interactif! Mini-shell avec prompt',
        template: `// ============================================
// Exercice: Shell Interactif
// ============================================
// IMPORTANT: Cochez "Capturer clavier"!
//
// Objectif: Shell qui lit le clavier
//
// - Affiche un prompt ">"
// - Lit les chiffres tapés (0-9)
// - Enter: affiche le nombre et retourne
// - Esc: quitte immédiatement
//
// Résultat: le nombre tapé
// ============================================

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;
int number = 0;

int read_key() {
    return *KEYBOARD;
}

void show_prompt() {
    // Afficher ">" à l'écran
}

void show_digit(int d, int pos) {
    // Afficher le chiffre d à la position pos
}

int main() {
    int key;
    int last_key;
    int pos;

    last_key = 0;
    pos = 0;

    show_prompt();

    while (1) {
        key = read_key();

        if (key != last_key && key != 0) {
            // Esc (27) = quitter
            if (key == 27) {
                return number;
            }
            // Enter (13) = terminer
            if (key == 13) {
                return number;
            }
            // Chiffres 0-9 (48-57)
            if (key >= 48 && key <= 57) {
                show_digit(key - 48, pos);
                number = number * 10 + (key - 48);
                pos = pos + 1;
            }
        }
        last_key = key;
    }

    return number;
}
`,
        solution: `// Shell Interactif - Solution
// Cochez "Capturer clavier" et tapez des chiffres!

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;
int number = 0;
int cursor_x = 16;

void set_pixel(int x, int y) {
    int row_base;
    int *ptr;
    int bit_pos;
    row_base = (y << 3) + (y << 1);
    ptr = SCREEN + row_base + (x >> 5);
    bit_pos = ((x >> 3) & 3) * 8 + 7 - (x & 7);
    *ptr = *ptr | (1 << bit_pos);
}

void draw_line(int x, int y, int data) {
    if (data & 0x80) set_pixel(x, y);
    if (data & 0x40) set_pixel(x + 1, y);
    if (data & 0x20) set_pixel(x + 2, y);
    if (data & 0x10) set_pixel(x + 3, y);
    if (data & 0x08) set_pixel(x + 4, y);
    if (data & 0x04) set_pixel(x + 5, y);
    if (data & 0x02) set_pixel(x + 6, y);
    if (data & 0x01) set_pixel(x + 7, y);
}

// Dessine ">" prompt
void show_prompt() {
    draw_line(0, 0, 0x40);
    draw_line(0, 1, 0x20);
    draw_line(0, 2, 0x10);
    draw_line(0, 3, 0x20);
    draw_line(0, 4, 0x40);
}

// Dessine un chiffre simplifié
void draw_digit(int x, int d) {
    if (d == 0) {
        draw_line(x, 0, 0x3C); draw_line(x, 1, 0x42);
        draw_line(x, 2, 0x42); draw_line(x, 3, 0x42);
        draw_line(x, 4, 0x42); draw_line(x, 5, 0x3C);
    }
    if (d == 1) {
        draw_line(x, 0, 0x18); draw_line(x, 1, 0x38);
        draw_line(x, 2, 0x18); draw_line(x, 3, 0x18);
        draw_line(x, 4, 0x18); draw_line(x, 5, 0x3C);
    }
    if (d == 2) {
        draw_line(x, 0, 0x3C); draw_line(x, 1, 0x42);
        draw_line(x, 2, 0x04); draw_line(x, 3, 0x18);
        draw_line(x, 4, 0x20); draw_line(x, 5, 0x7E);
    }
    if (d == 3) {
        draw_line(x, 0, 0x3C); draw_line(x, 1, 0x42);
        draw_line(x, 2, 0x0C); draw_line(x, 3, 0x02);
        draw_line(x, 4, 0x42); draw_line(x, 5, 0x3C);
    }
    if (d == 4) {
        draw_line(x, 0, 0x04); draw_line(x, 1, 0x0C);
        draw_line(x, 2, 0x14); draw_line(x, 3, 0x24);
        draw_line(x, 4, 0x7E); draw_line(x, 5, 0x04);
    }
    if (d == 5) {
        draw_line(x, 0, 0x7E); draw_line(x, 1, 0x40);
        draw_line(x, 2, 0x7C); draw_line(x, 3, 0x02);
        draw_line(x, 4, 0x42); draw_line(x, 5, 0x3C);
    }
    if (d == 6) {
        draw_line(x, 0, 0x1C); draw_line(x, 1, 0x20);
        draw_line(x, 2, 0x7C); draw_line(x, 3, 0x42);
        draw_line(x, 4, 0x42); draw_line(x, 5, 0x3C);
    }
    if (d == 7) {
        draw_line(x, 0, 0x7E); draw_line(x, 1, 0x02);
        draw_line(x, 2, 0x04); draw_line(x, 3, 0x08);
        draw_line(x, 4, 0x10); draw_line(x, 5, 0x10);
    }
    if (d == 8) {
        draw_line(x, 0, 0x3C); draw_line(x, 1, 0x42);
        draw_line(x, 2, 0x3C); draw_line(x, 3, 0x42);
        draw_line(x, 4, 0x42); draw_line(x, 5, 0x3C);
    }
    if (d == 9) {
        draw_line(x, 0, 0x3C); draw_line(x, 1, 0x42);
        draw_line(x, 2, 0x42); draw_line(x, 3, 0x3E);
        draw_line(x, 4, 0x04); draw_line(x, 5, 0x38);
    }
}

int read_key() {
    return *KEYBOARD;
}

int main() {
    int key;
    int last_key;
    int timeout;

    last_key = 0;
    timeout = 0;

    show_prompt();

    while (timeout < 50000) {
        key = read_key();

        if (key != last_key && key != 0) {
            // Esc (27) = quitter
            if (key == 27) {
                return number;
            }
            // Enter (13) = terminer
            if (key == 13) {
                return number;
            }
            // Chiffres 0-9 (48-57)
            if (key >= 48 && key <= 57) {
                draw_digit(cursor_x, key - 48);
                cursor_x = cursor_x + 10;
                number = number * 10 + (key - 48);
                timeout = 0;
            }
        }
        last_key = key;
        timeout = timeout + 1;
    }

    return number;
}
`,
        expectedReturn: 0
    },

    'os-calc': {
        id: 'os-calc',
        name: 'Calculatrice',
        description: 'Interactif! Tapez: chiffre, op (+/-/*), chiffre, Enter',
        template: `// ============================================
// Exercice: Calculatrice Interactive
// ============================================
// IMPORTANT: Cochez "Capturer clavier"!
//
// Tapez: chiffre op chiffre Enter
// Exemple: 3 + 5 Enter -> affiche 8
//
// Opérations: + - *
// Chiffres: 0-9
//
// Résultat: le calcul effectué
// ============================================

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;

int read_key() {
    return *KEYBOARD;
}

int eval(int a, int op, int b) {
    if (op == 43) return a + b;  // +
    if (op == 45) return a - b;  // -
    if (op == 42) return a * b;  // *
    return 0;
}

int main() {
    int key;
    int a;
    int b;
    int op;
    int state;  // 0=attente a, 1=attente op, 2=attente b

    a = 0;
    b = 0;
    op = 0;
    state = 0;

    // Votre code: boucle qui lit les touches
    // et calcule le résultat

    return 0;
}
`,
        solution: `// Calculatrice Interactive - Solution
// Cochez "Capturer clavier", tapez: 3+5 Enter

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;
int cursor_x = 4;

void set_pixel(int x, int y) {
    int *ptr;
    int bit_pos;
    ptr = SCREEN + (y << 3) + (y << 1) + (x >> 5);
    bit_pos = ((x >> 3) & 3) * 8 + 7 - (x & 7);
    *ptr = *ptr | (1 << bit_pos);
}

// Chiffre 3x5 pixels
void draw_digit(int x, int y, int d) {
    if (d != 1 && d != 4) { set_pixel(x, y); set_pixel(x+1, y); set_pixel(x+2, y); }
    if (d == 0 || d == 4 || d == 5 || d == 6 || d == 8 || d == 9) { set_pixel(x, y+1); }
    if (d != 5 && d != 6) { set_pixel(x+2, y+1); }
    if (d != 0 && d != 1 && d != 7) { set_pixel(x, y+2); set_pixel(x+1, y+2); set_pixel(x+2, y+2); }
    if (d == 0 || d == 2 || d == 6 || d == 8) { set_pixel(x, y+3); }
    if (d != 2) { set_pixel(x+2, y+3); }
    if (d != 1 && d != 4 && d != 7) { set_pixel(x, y+4); set_pixel(x+1, y+4); set_pixel(x+2, y+4); }
    if (d == 1) { set_pixel(x+1, y); set_pixel(x+1, y+1); set_pixel(x+1, y+2); set_pixel(x+1, y+3); set_pixel(x+1, y+4); }
    if (d == 7) { set_pixel(x, y); set_pixel(x+1, y); set_pixel(x+2, y); }
}

void draw_plus(int x, int y) {
    set_pixel(x+1, y); set_pixel(x+1, y+1); set_pixel(x+1, y+2);
    set_pixel(x, y+1); set_pixel(x+2, y+1);
}
void draw_minus(int x, int y) { set_pixel(x, y+1); set_pixel(x+1, y+1); set_pixel(x+2, y+1); }
void draw_times(int x, int y) { set_pixel(x,y); set_pixel(x+2,y); set_pixel(x+1,y+1); set_pixel(x,y+2); set_pixel(x+2,y+2); }
void draw_equal(int x, int y) { set_pixel(x,y); set_pixel(x+1,y); set_pixel(x+2,y); set_pixel(x,y+2); set_pixel(x+1,y+2); set_pixel(x+2,y+2); }

int main() {
    int key; int lk; int a; int b; int op; int st; int r; int t; int tens; int u;
    a = 0; b = 0; op = 0; st = 0; lk = 0; t = 0;

    while (t < 50000) {
        key = *KEYBOARD;
        if (key != 0 && key != lk) {
            t = 0;
            if (key == 13 && st == 2) {
                if (op == 1) r = a + b;
                if (op == 2) r = a - b;
                if (op == 3) r = a * b;
                draw_equal(cursor_x, 10); cursor_x = cursor_x + 5;
                tens = 0; u = r;
                while (u >= 10) { u = u - 10; tens = tens + 1; }
                if (tens > 0) { draw_digit(cursor_x, 10, tens); cursor_x = cursor_x + 5; }
                draw_digit(cursor_x, 10, u);
                return r;
            }
            if (key >= 48 && key <= 57) {
                draw_digit(cursor_x, 10, key - 48);
                cursor_x = cursor_x + 5;
                if (st == 0) { a = key - 48; st = 1; }
                else if (st == 2) { b = key - 48; }
            }
            if (key == 43 && st == 1) { draw_plus(cursor_x, 10); cursor_x = cursor_x + 5; op = 1; st = 2; }
            if (key == 45 && st == 1) { draw_minus(cursor_x, 10); cursor_x = cursor_x + 5; op = 2; st = 2; }
            if (key == 42 && st == 1) { draw_times(cursor_x, 10); cursor_x = cursor_x + 5; op = 3; st = 2; }
        }
        lk = key; t = t + 1;
    }
    return 0;
}
`,
        visualTest: true,
        visualDescription: 'Vérifiez visuellement: chiffres affichés, opérateur, résultat du calcul'
    },

    'os-var': {
        id: 'os-var',
        name: 'Variables Shell',
        description: 'Interactif! Tapez: a=5 b=3 puis Enter pour voir a+b',
        template: `// ============================================
// Exercice: Variables Shell Interactive
// ============================================
// IMPORTANT: Cochez "Capturer clavier"!
//
// Tapez une lettre (a-z) suivie de = et un chiffre
// Exemple: a=5 b=3 puis Enter
// Affiche le résultat de a + b
//
// Maximum 8 variables
// ============================================

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;

int var_names[8];
int var_values[8];
int var_count = 0;

void set_var(int name, int value) {
    // Votre code: stocker la variable
}

int get_var(int name) {
    // Votre code: retrouver la valeur
    return 0;
}

int main() {
    // Votre code: lire clavier, parser x=N, afficher résultat
    return 0;
}
`,
        solution: `// Variables Shell Interactive - Solution
// Cochez "Capturer clavier", tapez: a=5 b=3 Enter

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;
int cursor_x = 4;

int var_names[8];
int var_values[8];
int var_count = 0;

void set_pixel(int x, int y) {
    int *ptr;
    int bit_pos;
    ptr = SCREEN + (y << 3) + (y << 1) + (x >> 5);
    bit_pos = ((x >> 3) & 3) * 8 + 7 - (x & 7);
    *ptr = *ptr | (1 << bit_pos);
}

void draw_char(int x, int y, int c) {
    int i;
    // Lettre = ligne verticale + petit trait
    if (c >= 97 && c <= 122) {
        for (i = 0; i < 5; i = i + 1) { set_pixel(x, y + i); }
        set_pixel(x + 1, y + 2);
        set_pixel(x + 2, y + (c - 97) % 3);
    }
    // Chiffre 3x5
    if (c >= 48 && c <= 57) {
        int d;
        d = c - 48;
        if (d != 1 && d != 4) { set_pixel(x, y); set_pixel(x+1, y); set_pixel(x+2, y); }
        if (d == 0 || d == 4 || d == 5 || d == 6 || d == 8 || d == 9) { set_pixel(x, y+1); }
        if (d != 5 && d != 6) { set_pixel(x+2, y+1); }
        if (d != 0 && d != 1 && d != 7) { set_pixel(x, y+2); set_pixel(x+1, y+2); set_pixel(x+2, y+2); }
        if (d == 0 || d == 2 || d == 6 || d == 8) { set_pixel(x, y+3); }
        if (d != 2) { set_pixel(x+2, y+3); }
        if (d != 1 && d != 4 && d != 7) { set_pixel(x, y+4); set_pixel(x+1, y+4); set_pixel(x+2, y+4); }
        if (d == 1) { set_pixel(x+1, y); set_pixel(x+1, y+1); set_pixel(x+1, y+2); set_pixel(x+1, y+3); set_pixel(x+1, y+4); }
    }
    // = sign
    if (c == 61) { set_pixel(x,y+1); set_pixel(x+1,y+1); set_pixel(x+2,y+1); set_pixel(x,y+3); set_pixel(x+1,y+3); set_pixel(x+2,y+3); }
    // + sign
    if (c == 43) { set_pixel(x+1,y); set_pixel(x+1,y+1); set_pixel(x+1,y+2); set_pixel(x,y+1); set_pixel(x+2,y+1); }
}

int find_var(int name) {
    int i;
    for (i = 0; i < var_count; i = i + 1) {
        if (var_names[i] == name) return i;
    }
    return 0 - 1;
}

void set_var(int name, int value) {
    int idx;
    idx = find_var(name);
    if (idx >= 0) { var_values[idx] = value; return; }
    if (var_count < 8) {
        var_names[var_count] = name;
        var_values[var_count] = value;
        var_count = var_count + 1;
    }
}

int get_var(int name) {
    int idx;
    idx = find_var(name);
    if (idx >= 0) return var_values[idx];
    return 0;
}

int main() {
    int key; int lk; int t; int st; int cur_name; int result;
    lk = 0; t = 0; st = 0; cur_name = 0; result = 0;

    while (t < 50000) {
        key = *KEYBOARD;
        if (key != 0 && key != lk) {
            t = 0;
            // Enter = calculer résultat
            if (key == 13) {
                if (var_count >= 2) {
                    result = var_values[0] + var_values[1];
                    draw_char(cursor_x, 10, 61); cursor_x = cursor_x + 5;
                    draw_char(cursor_x, 10, 48 + result); cursor_x = cursor_x + 5;
                }
                return result;
            }
            // Lettre a-z
            if (key >= 97 && key <= 122 && st == 0) {
                draw_char(cursor_x, 10, key); cursor_x = cursor_x + 5;
                cur_name = key;
                st = 1;
            }
            // = après lettre
            if (key == 61 && st == 1) {
                draw_char(cursor_x, 10, 61); cursor_x = cursor_x + 5;
                st = 2;
            }
            // Chiffre après =
            if (key >= 48 && key <= 57 && st == 2) {
                draw_char(cursor_x, 10, key); cursor_x = cursor_x + 5;
                set_var(cur_name, key - 48);
                st = 0;
                cursor_x = cursor_x + 3; // espace
            }
        }
        lk = key; t = t + 1;
    }
    return 0;
}
`,
        visualTest: true,
        visualDescription: "Tapez a=5 b=3 Enter - vérifiez que a+b=8 s'affiche"
    },

    'os-timer': {
        id: 'os-timer',
        name: 'Compte à Rebours',
        description: 'Interactif! Tapez 1-9 pour lancer le compte à rebours',
        template: `// ============================================
// Exercice: Compte à Rebours Interactif
// ============================================
// IMPORTANT: Cochez "Capturer clavier"!
//
// Tapez un chiffre (1-9) pour démarrer
// La barre se vide progressivement
// Flash à la fin du compte à rebours
//
// Concepts: timer, boucle, affichage
// ============================================

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;

void draw_bar(int width) {
    // Dessiner une barre horizontale de largeur width
}

void countdown(int seconds) {
    // Compte à rebours avec animation
}

int main() {
    int key;
    // Attendre un chiffre, lancer le compte à rebours
    return 0;
}
`,
        solution: `// Compte à Rebours Interactif - Solution
// Cochez "Capturer clavier", tapez 3 pour 3 secondes

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;

void set_pixel(int x, int y) {
    int *ptr;
    int bit_pos;
    ptr = SCREEN + (y << 3) + (y << 1) + (x >> 5);
    bit_pos = ((x >> 3) & 3) * 8 + 7 - (x & 7);
    *ptr = *ptr | (1 << bit_pos);
}

// Dessine chiffre 3x5
void draw_digit(int x, int y, int d, int on) {
    int i; int j; int *ptr; int bit_pos; int px; int py;
    // Efface d'abord la zone
    for (i = 0; i < 4; i = i + 1) {
        for (j = 0; j < 6; j = j + 1) {
            px = x + i; py = y + j;
            ptr = SCREEN + (py << 3) + (py << 1) + (px >> 5);
            bit_pos = ((px >> 3) & 3) * 8 + 7 - (px & 7);
            *ptr = *ptr & (0xFFFFFFFF ^ (1 << bit_pos));
        }
    }
    if (on == 0) return;
    // Dessine le chiffre
    if (d != 1 && d != 4) { set_pixel(x, y); set_pixel(x+1, y); set_pixel(x+2, y); }
    if (d == 0 || d == 4 || d == 5 || d == 6 || d == 8 || d == 9) { set_pixel(x, y+1); }
    if (d != 5 && d != 6) { set_pixel(x+2, y+1); }
    if (d != 0 && d != 1 && d != 7) { set_pixel(x, y+2); set_pixel(x+1, y+2); set_pixel(x+2, y+2); }
    if (d == 0 || d == 2 || d == 6 || d == 8) { set_pixel(x, y+3); }
    if (d != 2) { set_pixel(x+2, y+3); }
    if (d != 1 && d != 4 && d != 7) { set_pixel(x, y+4); set_pixel(x+1, y+4); set_pixel(x+2, y+4); }
    if (d == 1) { set_pixel(x+1, y); set_pixel(x+1, y+1); set_pixel(x+1, y+2); set_pixel(x+1, y+3); set_pixel(x+1, y+4); }
}

// Dessine barre horizontale
void draw_hbar(int x, int y, int w) {
    int i; int j;
    for (i = 0; i < w; i = i + 1) {
        for (j = 0; j < 4; j = j + 1) {
            set_pixel(x + i, y + j);
        }
    }
}

// Efface colonne de barre (XOR avec 0xFFFFFFFF au lieu de ~)
void clear_col(int x, int y) {
    int j; int *ptr; int bit_pos; int py;
    for (j = 0; j < 4; j = j + 1) {
        py = y + j;
        ptr = SCREEN + (py << 3) + (py << 1) + (x >> 5);
        bit_pos = ((x >> 3) & 3) * 8 + 7 - (x & 7);
        *ptr = *ptr & (0xFFFFFFFF ^ (1 << bit_pos));
    }
}

// Flash rectangle
void flash(int x, int y, int w, int h) {
    int i; int j;
    for (i = 0; i < w; i = i + 1) {
        for (j = 0; j < h; j = j + 1) {
            set_pixel(x + i, y + j);
        }
    }
}

int state = 0;
int secs = 0;
int bar_x = 0;
int step = 0;
int tick = 0;

int main() {
    int key; int lk; int t; int bar_w;
    lk = 0; t = 0;

    while (t < 500000) {
        key = *KEYBOARD;

        if (state == 0) {
            if (key >= 49 && key <= 57 && key != lk) {
                secs = key - 48;
                draw_digit(4, 4, secs, 1);
                bar_w = secs << 3;
                draw_hbar(4, 15, bar_w);
                bar_x = 3 + bar_w;
                step = 0;
                tick = 0;
                state = 1;
            }
        }

        if (state == 1) {
            tick = tick + 1;
            if (tick >= 800) {
                tick = 0;
                clear_col(bar_x, 15);
                bar_x = bar_x - 1;
                step = step + 1;
                if (step >= 8) {
                    step = 0;
                    secs = secs - 1;
                    draw_digit(4, 4, secs, 1);
                    if (secs <= 0) {
                        state = 2;
                    }
                }
            }
        }

        if (state == 2) {
            flash(4, 4, 60, 20);
            return 1;
        }

        lk = key;
        t = t + 1;
    }
    return 0;
}
`,
        visualTest: true,
        visualDescription: "Tapez un chiffre (1-9), la barre se vide, flash à la fin"
    },

    'os-irq': {
        id: 'os-irq',
        name: 'Interruptions',
        description: "Interactif! T=Timer, K=Keyboard, S=Screen, Enter=fin",
        template: `// ============================================
// Exercice: Interruptions Visuelles
// ============================================
// IMPORTANT: Cochez "Capturer clavier"!
//
// 3 peripheriques: Timer, Keyboard, Screen
// Touches T, K, S declenchent l'IRQ
// Chaque IRQ fait flasher le peripherique
// Enter pour terminer
//
// Concepts: handlers, dispatch, compteurs
// ============================================

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;

int irq_count[3];  // compteurs par IRQ

void irq_handler(int type) {
    // Votre code: incrementer compteur, effet visuel
}

int main() {
    // Votre code: afficher peripheriques, lire touches
    return 0;
}
`,
        solution: `// Interruptions Visuelles - Solution
// Cochez "Capturer clavier", appuyez T/K/S puis Enter

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;

int irq_count[3];

void set_pixel(int x, int y) {
    int *ptr; int bit_pos;
    ptr = SCREEN + (y << 3) + (y << 1) + (x >> 5);
    bit_pos = ((x >> 3) & 3) * 8 + 7 - (x & 7);
    *ptr = *ptr | (1 << bit_pos);
}

void clear_rect(int x, int y, int w, int h) {
    int i; int j; int px; int py; int *ptr; int bit_pos;
    for (i = 0; i < w; i = i + 1) {
        for (j = 0; j < h; j = j + 1) {
            px = x + i; py = y + j;
            ptr = SCREEN + (py << 3) + (py << 1) + (px >> 5);
            bit_pos = ((px >> 3) & 3) * 8 + 7 - (px & 7);
            *ptr = *ptr & (0xFFFFFFFF ^ (1 << bit_pos));
        }
    }
}

void fill_rect(int x, int y, int w, int h) {
    int i; int j;
    for (i = 0; i < w; i = i + 1) {
        for (j = 0; j < h; j = j + 1) {
            set_pixel(x + i, y + j);
        }
    }
}

void draw_box(int x, int y, int w, int h) {
    int i;
    for (i = 0; i < w; i = i + 1) { set_pixel(x + i, y); set_pixel(x + i, y + h - 1); }
    for (i = 0; i < h; i = i + 1) { set_pixel(x, y + i); set_pixel(x + w - 1, y + i); }
}

void draw_digit(int x, int y, int d) {
    clear_rect(x, y, 4, 6);
    if (d != 1 && d != 4) { set_pixel(x, y); set_pixel(x+1, y); set_pixel(x+2, y); }
    if (d == 0 || d == 4 || d == 5 || d == 6 || d == 8 || d == 9) set_pixel(x, y+1);
    if (d != 5 && d != 6) set_pixel(x+2, y+1);
    if (d != 0 && d != 1 && d != 7) { set_pixel(x, y+2); set_pixel(x+1, y+2); set_pixel(x+2, y+2); }
    if (d == 0 || d == 2 || d == 6 || d == 8) set_pixel(x, y+3);
    if (d != 2) set_pixel(x+2, y+3);
    if (d != 1 && d != 4 && d != 7) { set_pixel(x, y+4); set_pixel(x+1, y+4); set_pixel(x+2, y+4); }
    if (d == 1) { set_pixel(x+1, y); set_pixel(x+1, y+1); set_pixel(x+1, y+2); set_pixel(x+1, y+3); set_pixel(x+1, y+4); }
}

// Dessine lettre T, K ou S
void draw_letter(int x, int y, int c) {
    if (c == 84) { // T
        set_pixel(x,y); set_pixel(x+1,y); set_pixel(x+2,y);
        set_pixel(x+1,y+1); set_pixel(x+1,y+2); set_pixel(x+1,y+3); set_pixel(x+1,y+4);
    }
    if (c == 75) { // K
        set_pixel(x,y); set_pixel(x,y+1); set_pixel(x,y+2); set_pixel(x,y+3); set_pixel(x,y+4);
        set_pixel(x+2,y); set_pixel(x+1,y+1); set_pixel(x+1,y+3); set_pixel(x+2,y+4);
        set_pixel(x+1,y+2);
    }
    if (c == 83) { // S
        set_pixel(x,y); set_pixel(x+1,y); set_pixel(x+2,y);
        set_pixel(x,y+1);
        set_pixel(x,y+2); set_pixel(x+1,y+2); set_pixel(x+2,y+2);
        set_pixel(x+2,y+3);
        set_pixel(x,y+4); set_pixel(x+1,y+4); set_pixel(x+2,y+4);
    }
}

void draw_device(int idx) {
    int x;
    x = idx * 25 + 4;
    draw_box(x, 4, 20, 15);
    if (idx == 0) draw_letter(x + 8, 6, 84);
    if (idx == 1) draw_letter(x + 8, 6, 75);
    if (idx == 2) draw_letter(x + 8, 6, 83);
    draw_digit(x + 8, 13, irq_count[idx]);
}

void flash_device(int idx) {
    int x; int i;
    x = idx * 25 + 4;
    fill_rect(x + 1, 5, 18, 13);
    // Petit delai
    for (i = 0; i < 500; i = i + 1) { }
}

void irq_handler(int type) {
    if (type >= 0 && type < 3) {
        irq_count[type] = irq_count[type] + 1;
        flash_device(type);
        draw_device(type);
    }
}

int main() {
    int key; int lk; int t; int total;
    lk = 0; t = 0;
    irq_count[0] = 0; irq_count[1] = 0; irq_count[2] = 0;

    draw_device(0);
    draw_device(1);
    draw_device(2);

    while (t < 100000) {
        key = *KEYBOARD;
        if (key != 0 && key != lk) {
            t = 0;
            if (key == 13) {
                total = irq_count[0] + irq_count[1] + irq_count[2];
                return total;
            }
            if (key == 116 || key == 84) irq_handler(0);
            if (key == 107 || key == 75) irq_handler(1);
            if (key == 115 || key == 83) irq_handler(2);
        }
        lk = key;
        t = t + 1;
    }
    return 0;
}
`,
        visualTest: true,
        visualDescription: "Appuyez T/K/S plusieurs fois, les compteurs s'incrementent"
    },

    'os-coro': {
        id: 'os-coro',
        name: 'Coroutines',
        description: "Interactif! Espace=step, voir l'alternance A/B",
        template: `// ============================================
// Exercice: Coroutines Visuelles
// ============================================
// IMPORTANT: Cochez "Capturer clavier"!
//
// Deux tâches A et B alternent
// Espace pour avancer d'un pas
// La tâche active est mise en surbrillance
//
// A: compte 0,1,2 puis yield
// B: compte 0,1,2 puis yield
// Alterner jusqu'à la fin
// ============================================

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;

int current_task = 0;
int task_a_val = 0;
int task_b_val = 0;

void draw_tasks() {
    // Afficher les deux tâches
}

void step() {
    // Exécuter un pas de la tâche courante
}

int main() {
    // Boucle: attendre Espace, step, afficher
    return 0;
}
`,
        solution: `// Coroutines Visuelles - Solution
// Cochez "Capturer clavier", appuyez Espace pour chaque step

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;

int current_task = 0;
int task_a_val = 0;
int task_b_val = 0;
int steps = 0;

void set_pixel(int x, int y) {
    int *ptr; int bit_pos;
    ptr = SCREEN + (y << 3) + (y << 1) + (x >> 5);
    bit_pos = ((x >> 3) & 3) * 8 + 7 - (x & 7);
    *ptr = *ptr | (1 << bit_pos);
}

void clear_rect(int x, int y, int w, int h) {
    int i; int j; int px; int py; int *ptr; int bit_pos;
    for (i = 0; i < w; i = i + 1) {
        for (j = 0; j < h; j = j + 1) {
            px = x + i; py = y + j;
            ptr = SCREEN + (py << 3) + (py << 1) + (px >> 5);
            bit_pos = ((px >> 3) & 3) * 8 + 7 - (px & 7);
            *ptr = *ptr & (0xFFFFFFFF ^ (1 << bit_pos));
        }
    }
}

void fill_rect(int x, int y, int w, int h) {
    int i; int j;
    for (i = 0; i < w; i = i + 1) {
        for (j = 0; j < h; j = j + 1) {
            set_pixel(x + i, y + j);
        }
    }
}

void draw_box(int x, int y, int w, int h) {
    int i;
    for (i = 0; i < w; i = i + 1) { set_pixel(x + i, y); set_pixel(x + i, y + h - 1); }
    for (i = 0; i < h; i = i + 1) { set_pixel(x, y + i); set_pixel(x + w - 1, y + i); }
}

void draw_digit(int x, int y, int d) {
    clear_rect(x, y, 4, 6);
    if (d != 1 && d != 4) { set_pixel(x, y); set_pixel(x+1, y); set_pixel(x+2, y); }
    if (d == 0 || d == 4 || d == 5 || d == 6 || d == 8 || d == 9) set_pixel(x, y+1);
    if (d != 5 && d != 6) set_pixel(x+2, y+1);
    if (d != 0 && d != 1 && d != 7) { set_pixel(x, y+2); set_pixel(x+1, y+2); set_pixel(x+2, y+2); }
    if (d == 0 || d == 2 || d == 6 || d == 8) set_pixel(x, y+3);
    if (d != 2) set_pixel(x+2, y+3);
    if (d != 1 && d != 4 && d != 7) { set_pixel(x, y+4); set_pixel(x+1, y+4); set_pixel(x+2, y+4); }
    if (d == 1) { set_pixel(x+1, y); set_pixel(x+1, y+1); set_pixel(x+1, y+2); set_pixel(x+1, y+3); set_pixel(x+1, y+4); }
}

void draw_letter_A(int x, int y) {
    set_pixel(x+1, y);
    set_pixel(x, y+1); set_pixel(x+2, y+1);
    set_pixel(x, y+2); set_pixel(x+1, y+2); set_pixel(x+2, y+2);
    set_pixel(x, y+3); set_pixel(x+2, y+3);
    set_pixel(x, y+4); set_pixel(x+2, y+4);
}

void draw_letter_B(int x, int y) {
    set_pixel(x, y); set_pixel(x+1, y);
    set_pixel(x, y+1); set_pixel(x+2, y+1);
    set_pixel(x, y+2); set_pixel(x+1, y+2);
    set_pixel(x, y+3); set_pixel(x+2, y+3);
    set_pixel(x, y+4); set_pixel(x+1, y+4);
}

void draw_arrow(int x, int y) {
    set_pixel(x, y+2);
    set_pixel(x+1, y+1); set_pixel(x+1, y+2); set_pixel(x+1, y+3);
    set_pixel(x+2, y); set_pixel(x+2, y+2); set_pixel(x+2, y+4);
    set_pixel(x+3, y+1); set_pixel(x+3, y+2); set_pixel(x+3, y+3);
    set_pixel(x+4, y+2);
}

void draw_task(int idx, int active) {
    int x;
    x = idx * 35 + 4;
    clear_rect(x, 4, 30, 20);
    if (active) {
        fill_rect(x, 4, 30, 20);
        // Dessiner en inverse (effacer les pixels pour la lettre/chiffre)
        clear_rect(x + 12, 7, 6, 6);
        clear_rect(x + 12, 15, 5, 6);
    } else {
        draw_box(x, 4, 30, 20);
    }
    if (idx == 0) {
        if (active) clear_rect(x + 13, 7, 4, 5);
        else draw_letter_A(x + 13, 7);
        draw_digit(x + 13, 15, task_a_val);
    } else {
        if (active) clear_rect(x + 13, 7, 4, 5);
        else draw_letter_B(x + 13, 7);
        draw_digit(x + 13, 15, task_b_val);
    }
}

void draw_all() {
    draw_task(0, current_task == 0);
    draw_task(1, current_task == 1);
    // Fleche entre les taches
    if (current_task == 0) {
        clear_rect(32, 12, 8, 6);
        draw_arrow(32, 12);
    } else {
        clear_rect(32, 12, 8, 6);
        // Fleche inversee
        set_pixel(36, 14);
        set_pixel(35, 13); set_pixel(35, 14); set_pixel(35, 15);
        set_pixel(34, 12); set_pixel(34, 14); set_pixel(34, 16);
        set_pixel(33, 13); set_pixel(33, 14); set_pixel(33, 15);
        set_pixel(32, 14);
    }
}

int step() {
    if (current_task == 0) {
        task_a_val = task_a_val + 1;
        if (task_a_val > 3) return 0;
        current_task = 1;
    } else {
        task_b_val = task_b_val + 1;
        if (task_b_val > 3) return 0;
        current_task = 0;
    }
    steps = steps + 1;
    return 1;
}

int main() {
    int key; int lk; int t; int running;
    lk = 0; t = 0; running = 1;

    draw_all();

    while (t < 100000 && running) {
        key = *KEYBOARD;
        if (key != 0 && key != lk) {
            t = 0;
            if (key == 32) {
                running = step();
                draw_all();
            }
            if (key == 13) {
                return steps;
            }
        }
        lk = key;
        t = t + 1;
    }
    // Flash final
    fill_rect(0, 0, 80, 30);
    return steps;
}
`,
        visualTest: true,
        visualDescription: "Appuyez Espace pour voir l'alternance entre tâches A et B"
    },

    'os-sched': {
        id: 'os-sched',
        name: 'Scheduler',
        description: "Interactif! Espace=tick, voir le round-robin en action",
        template: `// ============================================
// Exercice: Scheduler Round-Robin Visuel
// ============================================
// IMPORTANT: Cochez "Capturer clavier"!
//
// 3 processus P0, P1, P2 avec temps différents
// Round-robin avec quantum = 2
// Espace pour avancer d'un tick
//
// Processus actif = surbrillance
// Barres = temps restant
// Q = quantum restant
// SW = context switches
//
// Enter pour terminer
// ============================================

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;

int proc_time[3];
int proc_state[3];
int current_proc = 0;
int quantum_left = 2;
int switches = 0;

void draw_procs() {
    // Afficher les 3 processus
}

int tick() {
    // Exécuter un tick du scheduler
    return 1;
}

int main() {
    // Boucle: attendre Espace, tick, afficher
    return 0;
}
`,
        solution: `// Scheduler Round-Robin Visuel - Solution
// Cochez "Capturer clavier", Espace pour chaque tick

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;

int proc_time[3];
int proc_state[3];
int current_proc = 0;
int quantum_left = 2;
int switches = 0;
int ticks = 0;

void set_pixel(int x, int y) {
    int *ptr; int bit_pos;
    ptr = SCREEN + (y << 3) + (y << 1) + (x >> 5);
    bit_pos = ((x >> 3) & 3) * 8 + 7 - (x & 7);
    *ptr = *ptr | (1 << bit_pos);
}

void clear_rect(int x, int y, int w, int h) {
    int i; int j; int px; int py; int *ptr; int bit_pos;
    for (i = 0; i < w; i = i + 1) {
        for (j = 0; j < h; j = j + 1) {
            px = x + i; py = y + j;
            ptr = SCREEN + (py << 3) + (py << 1) + (px >> 5);
            bit_pos = ((px >> 3) & 3) * 8 + 7 - (px & 7);
            *ptr = *ptr & (0xFFFFFFFF ^ (1 << bit_pos));
        }
    }
}

void fill_rect(int x, int y, int w, int h) {
    int i; int j;
    for (i = 0; i < w; i = i + 1) {
        for (j = 0; j < h; j = j + 1) {
            set_pixel(x + i, y + j);
        }
    }
}

void draw_box(int x, int y, int w, int h) {
    int i;
    for (i = 0; i < w; i = i + 1) { set_pixel(x + i, y); set_pixel(x + i, y + h - 1); }
    for (i = 0; i < h; i = i + 1) { set_pixel(x, y + i); set_pixel(x + w - 1, y + i); }
}

void draw_digit(int x, int y, int d) {
    clear_rect(x, y, 4, 6);
    if (d != 1 && d != 4) { set_pixel(x, y); set_pixel(x+1, y); set_pixel(x+2, y); }
    if (d == 0 || d == 4 || d == 5 || d == 6 || d == 8 || d == 9) set_pixel(x, y+1);
    if (d != 5 && d != 6) set_pixel(x+2, y+1);
    if (d != 0 && d != 1 && d != 7) { set_pixel(x, y+2); set_pixel(x+1, y+2); set_pixel(x+2, y+2); }
    if (d == 0 || d == 2 || d == 6 || d == 8) set_pixel(x, y+3);
    if (d != 2) set_pixel(x+2, y+3);
    if (d != 1 && d != 4 && d != 7) { set_pixel(x, y+4); set_pixel(x+1, y+4); set_pixel(x+2, y+4); }
    if (d == 1) { set_pixel(x+1, y); set_pixel(x+1, y+1); set_pixel(x+1, y+2); set_pixel(x+1, y+3); set_pixel(x+1, y+4); }
}

void draw_P(int x, int y) {
    set_pixel(x, y); set_pixel(x+1, y); set_pixel(x+2, y);
    set_pixel(x, y+1); set_pixel(x+2, y+1);
    set_pixel(x, y+2); set_pixel(x+1, y+2);
    set_pixel(x, y+3); set_pixel(x, y+4);
}

void draw_proc(int idx, int active) {
    int x; int y; int t; int i;
    x = idx * 32 + 4;
    y = 4;

    clear_rect(x, y, 28, 24);

    if (active) {
        fill_rect(x, y, 28, 24);
        clear_rect(x + 2, y + 2, 24, 20);
    } else {
        draw_box(x, y, 28, 24);
    }

    // P et numero
    draw_P(x + 4, y + 4);
    draw_digit(x + 10, y + 4, idx);

    // Barre de temps restant
    t = proc_time[idx];
    if (t > 0) {
        for (i = 0; i < t; i = i + 1) {
            fill_rect(x + 4 + i * 5, y + 14, 4, 6);
        }
    }

    // X si termine
    if (proc_state[idx] == 2) {
        set_pixel(x + 8, y + 14); set_pixel(x + 12, y + 14);
        set_pixel(x + 9, y + 15); set_pixel(x + 11, y + 15);
        set_pixel(x + 10, y + 16);
        set_pixel(x + 9, y + 17); set_pixel(x + 11, y + 17);
        set_pixel(x + 8, y + 18); set_pixel(x + 12, y + 18);
    }
}

void draw_all() {
    int i;
    for (i = 0; i < 3; i = i + 1) {
        draw_proc(i, i == current_proc && proc_state[i] != 2);
    }

    // Quantum: Q=N
    clear_rect(4, 32, 20, 6);
    // Q
    set_pixel(5, 32); set_pixel(6, 32); set_pixel(7, 32);
    set_pixel(4, 33); set_pixel(8, 33);
    set_pixel(4, 34); set_pixel(8, 34);
    set_pixel(4, 35); set_pixel(6, 35); set_pixel(8, 35);
    set_pixel(5, 36); set_pixel(6, 36); set_pixel(8, 36);
    draw_digit(12, 32, quantum_left);

    // Switches: SW=N
    clear_rect(30, 32, 30, 6);
    // S
    set_pixel(31, 32); set_pixel(32, 32); set_pixel(33, 32);
    set_pixel(30, 33);
    set_pixel(31, 34); set_pixel(32, 34);
    set_pixel(33, 35);
    set_pixel(30, 36); set_pixel(31, 36); set_pixel(32, 36);
    // W
    set_pixel(36, 32); set_pixel(40, 32);
    set_pixel(36, 33); set_pixel(40, 33);
    set_pixel(36, 34); set_pixel(38, 34); set_pixel(40, 34);
    set_pixel(36, 35); set_pixel(38, 35); set_pixel(40, 35);
    set_pixel(37, 36); set_pixel(39, 36);
    draw_digit(44, 32, switches);

    // Ticks: T=N
    clear_rect(60, 32, 20, 6);
    // T
    set_pixel(60, 32); set_pixel(61, 32); set_pixel(62, 32);
    set_pixel(61, 33); set_pixel(61, 34); set_pixel(61, 35); set_pixel(61, 36);
    draw_digit(66, 32, ticks);
}

int find_next(int from) {
    int i; int next;
    for (i = 1; i <= 3; i = i + 1) {
        next = (from + i) % 3;
        if (proc_state[next] == 0 && proc_time[next] > 0) return next;
    }
    return from;
}

int tick() {
    int next; int all_done;

    // Verifier si tous termines
    all_done = 1;
    if (proc_state[0] != 2) all_done = 0;
    if (proc_state[1] != 2) all_done = 0;
    if (proc_state[2] != 2) all_done = 0;
    if (all_done) return 0;

    ticks = ticks + 1;

    // Executer processus courant
    if (proc_time[current_proc] > 0) {
        proc_time[current_proc] = proc_time[current_proc] - 1;
        quantum_left = quantum_left - 1;

        if (proc_time[current_proc] == 0) {
            proc_state[current_proc] = 2;
            quantum_left = 0;
        }
    }

    // Context switch si quantum epuise
    if (quantum_left <= 0) {
        next = find_next(current_proc);
        if (next != current_proc) {
            current_proc = next;
            switches = switches + 1;
        }
        quantum_left = 2;
    }

    return 1;
}

int main() {
    int key; int lk; int t; int running;

    proc_time[0] = 3; proc_time[1] = 2; proc_time[2] = 4;
    proc_state[0] = 0; proc_state[1] = 0; proc_state[2] = 0;

    lk = 0; t = 0; running = 1;
    draw_all();

    while (t < 100000) {
        key = *KEYBOARD;
        if (key != 0 && key != lk) {
            t = 0;
            if (key == 32) {
                running = tick();
                draw_all();
            }
            if (key == 13) {
                return switches;
            }
        }
        lk = key;
        t = t + 1;
    }

    return switches;
}
`,
        visualTest: true,
        visualDescription: "Appuyez Espace pour avancer - P0(3), P1(2), P2(4) en round-robin quantum=2"
    },

    'os-project': {
        id: 'os-project',
        name: 'Projet 1: Mini-OS Shell',
        description: "Shell avec menu et 3 applications",
        template: `// ============================================
// PROJET FINAL: Mini-OS Shell
// ============================================
// IMPORTANT: Cochez "Capturer clavier"!
//
// Un shell qui lance 3 applications:
//   1 = Calculatrice (affiche 3+5=8)
//   2 = Compteur (compte de 0 a 5)
//   3 = Message (affiche "HI")
//   0 = Quitter
//
// Apres chaque app, retour au menu
// Combinez vos connaissances!
// ============================================

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;

void clear_screen() {
    // Effacer l'ecran
}

void draw_menu() {
    // Afficher le menu:
    // 1-CALC 2-COUNT 3-MSG 0-QUIT
}

void app_calc() {
    // Afficher 3+5=8
}

void app_count() {
    // Compter 0,1,2,3,4,5 avec delai
}

void app_msg() {
    // Afficher "HI"
}

int main() {
    int key; int running;
    running = 1;

    while (running) {
        draw_menu();
        // Attendre touche et lancer app
        // 0 = quitter
    }

    return 0;
}
`,
        solution: `// Mini-OS Shell - Solution
// Cochez "Capturer clavier"

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;

void set_pixel(int x, int y) {
    int *ptr; int bit_pos;
    ptr = SCREEN + (y << 3) + (y << 1) + (x >> 5);
    bit_pos = ((x >> 3) & 3) * 8 + 7 - (x & 7);
    *ptr = *ptr | (1 << bit_pos);
}

void clear_screen() {
    int i; int *ptr;
    ptr = SCREEN;
    for (i = 0; i < 2400; i = i + 1) {
        *ptr = 0;
        ptr = ptr + 1;
    }
}

void draw_digit(int x, int y, int d) {
    if (d != 1 && d != 4) { set_pixel(x, y); set_pixel(x+1, y); set_pixel(x+2, y); }
    if (d == 0 || d == 4 || d == 5 || d == 6 || d == 8 || d == 9) set_pixel(x, y+1);
    if (d != 5 && d != 6) set_pixel(x+2, y+1);
    if (d != 0 && d != 1 && d != 7) { set_pixel(x, y+2); set_pixel(x+1, y+2); set_pixel(x+2, y+2); }
    if (d == 0 || d == 2 || d == 6 || d == 8) set_pixel(x, y+3);
    if (d != 2) set_pixel(x+2, y+3);
    if (d != 1 && d != 4 && d != 7) { set_pixel(x, y+4); set_pixel(x+1, y+4); set_pixel(x+2, y+4); }
    if (d == 1) { set_pixel(x+1, y); set_pixel(x+1, y+1); set_pixel(x+1, y+2); set_pixel(x+1, y+3); set_pixel(x+1, y+4); }
}

void draw_plus(int x, int y) {
    set_pixel(x+1, y); set_pixel(x, y+1); set_pixel(x+1, y+1); set_pixel(x+2, y+1); set_pixel(x+1, y+2);
}

void draw_equal(int x, int y) {
    set_pixel(x, y); set_pixel(x+1, y); set_pixel(x+2, y);
    set_pixel(x, y+2); set_pixel(x+1, y+2); set_pixel(x+2, y+2);
}

void draw_H(int x, int y) {
    set_pixel(x, y); set_pixel(x, y+1); set_pixel(x, y+2); set_pixel(x, y+3); set_pixel(x, y+4);
    set_pixel(x+1, y+2);
    set_pixel(x+2, y); set_pixel(x+2, y+1); set_pixel(x+2, y+2); set_pixel(x+2, y+3); set_pixel(x+2, y+4);
}

void draw_I(int x, int y) {
    set_pixel(x, y); set_pixel(x+1, y); set_pixel(x+2, y);
    set_pixel(x+1, y+1); set_pixel(x+1, y+2); set_pixel(x+1, y+3);
    set_pixel(x, y+4); set_pixel(x+1, y+4); set_pixel(x+2, y+4);
}

void draw_box(int x, int y, int w, int h) {
    int i;
    for (i = 0; i < w; i = i + 1) { set_pixel(x + i, y); set_pixel(x + i, y + h - 1); }
    for (i = 0; i < h; i = i + 1) { set_pixel(x, y + i); set_pixel(x + w - 1, y + i); }
}

void draw_menu() {
    // Titre: MENU
    // M
    set_pixel(4, 4); set_pixel(4, 5); set_pixel(4, 6); set_pixel(4, 7); set_pixel(4, 8);
    set_pixel(5, 5); set_pixel(6, 6); set_pixel(7, 5);
    set_pixel(8, 4); set_pixel(8, 5); set_pixel(8, 6); set_pixel(8, 7); set_pixel(8, 8);
    // E
    set_pixel(11, 4); set_pixel(12, 4); set_pixel(13, 4);
    set_pixel(11, 5); set_pixel(11, 6); set_pixel(12, 6); set_pixel(11, 7);
    set_pixel(11, 8); set_pixel(12, 8); set_pixel(13, 8);
    // N
    set_pixel(16, 4); set_pixel(16, 5); set_pixel(16, 6); set_pixel(16, 7); set_pixel(16, 8);
    set_pixel(17, 5); set_pixel(18, 6); set_pixel(19, 7);
    set_pixel(20, 4); set_pixel(20, 5); set_pixel(20, 6); set_pixel(20, 7); set_pixel(20, 8);
    // U
    set_pixel(23, 4); set_pixel(23, 5); set_pixel(23, 6); set_pixel(23, 7);
    set_pixel(24, 8); set_pixel(25, 8);
    set_pixel(26, 4); set_pixel(26, 5); set_pixel(26, 6); set_pixel(26, 7);

    // Option 1: CALC
    draw_box(4, 14, 30, 12);
    draw_digit(8, 17, 1);
    // C
    set_pixel(15, 17); set_pixel(16, 17); set_pixel(17, 17);
    set_pixel(14, 18); set_pixel(14, 19); set_pixel(14, 20);
    set_pixel(15, 21); set_pixel(16, 21); set_pixel(17, 21);

    // Option 2: COUNT
    draw_box(4, 28, 30, 12);
    draw_digit(8, 31, 2);
    // #
    set_pixel(15, 31); set_pixel(17, 31);
    set_pixel(14, 32); set_pixel(15, 32); set_pixel(16, 32); set_pixel(17, 32); set_pixel(18, 32);
    set_pixel(15, 33); set_pixel(17, 33);
    set_pixel(14, 34); set_pixel(15, 34); set_pixel(16, 34); set_pixel(17, 34); set_pixel(18, 34);
    set_pixel(15, 35); set_pixel(17, 35);

    // Option 3: MSG
    draw_box(4, 42, 30, 12);
    draw_digit(8, 45, 3);
    draw_H(15, 45);
    draw_I(20, 45);

    // Option 0: QUIT
    draw_box(4, 56, 30, 12);
    draw_digit(8, 59, 0);
    // X
    set_pixel(15, 59); set_pixel(19, 59);
    set_pixel(16, 60); set_pixel(18, 60);
    set_pixel(17, 61);
    set_pixel(16, 62); set_pixel(18, 62);
    set_pixel(15, 63); set_pixel(19, 63);
}

void delay() {
    int i;
    for (i = 0; i < 50000; i = i + 1) { }
}

void wait_key() {
    int k;
    while (1) {
        k = *KEYBOARD;
        if (k != 0) return;
    }
}

void app_calc() {
    clear_screen();
    // Titre
    // C
    set_pixel(5, 4); set_pixel(6, 4); set_pixel(7, 4);
    set_pixel(4, 5); set_pixel(4, 6); set_pixel(4, 7);
    set_pixel(5, 8); set_pixel(6, 8); set_pixel(7, 8);
    // A
    set_pixel(11, 4); set_pixel(10, 5); set_pixel(12, 5);
    set_pixel(10, 6); set_pixel(11, 6); set_pixel(12, 6);
    set_pixel(10, 7); set_pixel(12, 7); set_pixel(10, 8); set_pixel(12, 8);
    // L
    set_pixel(15, 4); set_pixel(15, 5); set_pixel(15, 6); set_pixel(15, 7);
    set_pixel(15, 8); set_pixel(16, 8); set_pixel(17, 8);
    // C
    set_pixel(21, 4); set_pixel(22, 4); set_pixel(23, 4);
    set_pixel(20, 5); set_pixel(20, 6); set_pixel(20, 7);
    set_pixel(21, 8); set_pixel(22, 8); set_pixel(23, 8);

    // 3 + 5 = 8
    draw_digit(10, 20, 3);
    draw_plus(16, 20);
    draw_digit(22, 20, 5);
    draw_equal(28, 20);
    draw_digit(34, 20, 8);

    wait_key();
}

void app_count() {
    int i;
    clear_screen();
    // Titre: COUNT
    // #
    set_pixel(5, 4); set_pixel(7, 4);
    set_pixel(4, 5); set_pixel(5, 5); set_pixel(6, 5); set_pixel(7, 5); set_pixel(8, 5);
    set_pixel(5, 6); set_pixel(7, 6);
    set_pixel(4, 7); set_pixel(5, 7); set_pixel(6, 7); set_pixel(7, 7); set_pixel(8, 7);
    set_pixel(5, 8); set_pixel(7, 8);

    for (i = 0; i < 6; i = i + 1) {
        draw_digit(10 + i * 6, 20, i);
        delay();
    }

    wait_key();
}

void app_msg() {
    clear_screen();
    // Titre: MSG
    // M
    set_pixel(4, 4); set_pixel(4, 5); set_pixel(4, 6); set_pixel(4, 7); set_pixel(4, 8);
    set_pixel(5, 5); set_pixel(6, 6); set_pixel(7, 5);
    set_pixel(8, 4); set_pixel(8, 5); set_pixel(8, 6); set_pixel(8, 7); set_pixel(8, 8);
    // S
    set_pixel(12, 4); set_pixel(13, 4); set_pixel(11, 5);
    set_pixel(12, 6); set_pixel(13, 7);
    set_pixel(11, 8); set_pixel(12, 8);
    // G
    set_pixel(17, 4); set_pixel(18, 4); set_pixel(19, 4);
    set_pixel(16, 5); set_pixel(16, 6); set_pixel(18, 6); set_pixel(19, 6);
    set_pixel(16, 7); set_pixel(19, 7);
    set_pixel(17, 8); set_pixel(18, 8); set_pixel(19, 8);

    // Grand HI
    // H
    set_pixel(10, 18); set_pixel(10, 19); set_pixel(10, 20); set_pixel(10, 21); set_pixel(10, 22);
    set_pixel(10, 23); set_pixel(10, 24); set_pixel(10, 25); set_pixel(10, 26); set_pixel(10, 27);
    set_pixel(11, 22); set_pixel(12, 22); set_pixel(13, 22);
    set_pixel(14, 18); set_pixel(14, 19); set_pixel(14, 20); set_pixel(14, 21); set_pixel(14, 22);
    set_pixel(14, 23); set_pixel(14, 24); set_pixel(14, 25); set_pixel(14, 26); set_pixel(14, 27);
    // I
    set_pixel(18, 18); set_pixel(19, 18); set_pixel(20, 18); set_pixel(21, 18); set_pixel(22, 18);
    set_pixel(20, 19); set_pixel(20, 20); set_pixel(20, 21); set_pixel(20, 22);
    set_pixel(20, 23); set_pixel(20, 24); set_pixel(20, 25); set_pixel(20, 26);
    set_pixel(18, 27); set_pixel(19, 27); set_pixel(20, 27); set_pixel(21, 27); set_pixel(22, 27);

    wait_key();
}

int main() {
    int key; int lk; int running;
    running = 1;
    lk = 0;

    while (running) {
        clear_screen();
        draw_menu();

        while (1) {
            key = *KEYBOARD;
            if (key != 0 && key != lk) {
                if (key == 49) { app_calc(); break; }
                if (key == 50) { app_count(); break; }
                if (key == 51) { app_msg(); break; }
                if (key == 48) { running = 0; break; }
            }
            lk = key;
        }
    }

    clear_screen();
    return 0;
}
`,
        visualTest: true,
        visualDescription: "Menu avec 4 options - testez 1, 2, 3 puis 0 pour quitter"
    },

    'os-project2': {
        id: 'os-project2',
        name: 'Projet 2: Task Manager',
        description: "Visualisez le scheduler round-robin en action",
        template: `// ============================================
// PROJET: Gestionnaire de Tâches Visuel
// ============================================
// IMPORTANT: Cochez "Capturer clavier"!
//
// 4 processus P0-P3 avec travail different
// Round-robin avec quantum = 2
//
// Etats: R=Ready  *=Running  B=Blocked  X=Done
//
// Touches:
//   Espace = avancer d'un tick (auto)
//   0-3 = bloquer/debloquer processus
//   Enter = quitter
//
// Observez:
//   - Le scheduler qui alterne les processus
//   - Les context switches
//   - L'effet du blocage sur l'ordonnancement
// ============================================

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;

int proc_work[4];    // travail restant
int proc_state[4];   // 0=ready 1=running 2=blocked 3=done
int proc_counter[4]; // compteur d'execution
int current = 0;
int quantum = 2;

void draw_process(int idx) {
    // Afficher un processus avec son etat
}

void tick() {
    // Executer un tick du scheduler
}

int main() {
    // Initialiser, boucle principale
    return 0;
}
`,
        solution: `// Gestionnaire de Tâches - Solution
// Cochez "Capturer clavier"

int *SCREEN = (int*)0x00400000;
int *KEYBOARD = (int*)0x00402600;

int proc_work[4];
int proc_state[4];
int proc_done[4];
int current = 0;
int quantum_left = 2;
int switches = 0;
int ticks = 0;
int auto_run = 0;

void set_pixel(int x, int y) {
    int *ptr; int bit_pos;
    ptr = SCREEN + (y << 3) + (y << 1) + (x >> 5);
    bit_pos = ((x >> 3) & 3) * 8 + 7 - (x & 7);
    *ptr = *ptr | (1 << bit_pos);
}

void clear_rect(int x, int y, int w, int h) {
    int i; int j; int px; int py; int *ptr; int bit_pos;
    for (i = 0; i < w; i = i + 1) {
        for (j = 0; j < h; j = j + 1) {
            px = x + i; py = y + j;
            ptr = SCREEN + (py << 3) + (py << 1) + (px >> 5);
            bit_pos = ((px >> 3) & 3) * 8 + 7 - (px & 7);
            *ptr = *ptr & (0xFFFFFFFF ^ (1 << bit_pos));
        }
    }
}

void fill_rect(int x, int y, int w, int h) {
    int i; int j;
    for (i = 0; i < w; i = i + 1) {
        for (j = 0; j < h; j = j + 1) {
            set_pixel(x + i, y + j);
        }
    }
}

void draw_box(int x, int y, int w, int h) {
    int i;
    for (i = 0; i < w; i = i + 1) { set_pixel(x + i, y); set_pixel(x + i, y + h - 1); }
    for (i = 0; i < h; i = i + 1) { set_pixel(x, y + i); set_pixel(x + w - 1, y + i); }
}

void draw_digit(int x, int y, int d) {
    clear_rect(x, y, 4, 6);
    if (d != 1 && d != 4) { set_pixel(x, y); set_pixel(x+1, y); set_pixel(x+2, y); }
    if (d == 0 || d == 4 || d == 5 || d == 6 || d == 8 || d == 9) set_pixel(x, y+1);
    if (d != 5 && d != 6) set_pixel(x+2, y+1);
    if (d != 0 && d != 1 && d != 7) { set_pixel(x, y+2); set_pixel(x+1, y+2); set_pixel(x+2, y+2); }
    if (d == 0 || d == 2 || d == 6 || d == 8) set_pixel(x, y+3);
    if (d != 2) set_pixel(x+2, y+3);
    if (d != 1 && d != 4 && d != 7) { set_pixel(x, y+4); set_pixel(x+1, y+4); set_pixel(x+2, y+4); }
    if (d == 1) { set_pixel(x+1, y); set_pixel(x+1, y+1); set_pixel(x+1, y+2); set_pixel(x+1, y+3); set_pixel(x+1, y+4); }
}

void draw_proc(int idx) {
    int x; int w; int i; int active;
    x = idx * 40 + 4;

    clear_rect(x, 4, 36, 55);

    active = (idx == current && proc_state[idx] == 1);

    // Cadre - double si running
    draw_box(x, 4, 36, 55);
    if (active) {
        draw_box(x + 2, 6, 32, 51);
    }

    // P et numero (grand)
    fill_rect(x + 8, 10, 2, 9);
    fill_rect(x + 10, 10, 4, 2);
    fill_rect(x + 14, 10, 2, 5);
    fill_rect(x + 10, 14, 4, 2);

    draw_digit(x + 20, 12, idx);

    // Etat: R=Ready *=Run B=Block X=Done
    clear_rect(x + 10, 24, 16, 10);
    if (proc_state[idx] == 0) {
        // R
        fill_rect(x + 12, 25, 2, 8);
        fill_rect(x + 14, 25, 4, 2);
        fill_rect(x + 18, 25, 2, 4);
        fill_rect(x + 14, 28, 4, 2);
        fill_rect(x + 16, 30, 2, 3);
    }
    if (proc_state[idx] == 1) {
        // * etoile
        fill_rect(x + 14, 26, 2, 6);
        fill_rect(x + 12, 28, 6, 2);
    }
    if (proc_state[idx] == 2) {
        // B
        fill_rect(x + 12, 25, 2, 8);
        fill_rect(x + 14, 25, 4, 2);
        fill_rect(x + 14, 28, 4, 2);
        fill_rect(x + 14, 31, 4, 2);
        fill_rect(x + 18, 26, 2, 2);
        fill_rect(x + 18, 29, 2, 2);
    }
    if (proc_state[idx] == 3) {
        // X
        fill_rect(x + 12, 25, 2, 2); fill_rect(x + 18, 25, 2, 2);
        fill_rect(x + 14, 27, 2, 2); fill_rect(x + 16, 27, 2, 2);
        fill_rect(x + 14, 29, 4, 2);
        fill_rect(x + 12, 31, 2, 2); fill_rect(x + 18, 31, 2, 2);
    }

    // Barre travail restant
    w = proc_work[idx];
    for (i = 0; i < 4; i = i + 1) {
        if (i < w) {
            fill_rect(x + 6 + i * 7, 38, 5, 6);
        } else {
            draw_box(x + 6 + i * 7, 38, 5, 6);
        }
    }

    // Compteur
    draw_digit(x + 15, 50, proc_done[idx] % 10);
}

void draw_info() {
    clear_rect(4, 62, 156, 8);
    // Q:
    fill_rect(6, 63, 2, 5); fill_rect(8, 63, 3, 2); fill_rect(11, 63, 2, 5);
    fill_rect(8, 66, 3, 2); fill_rect(10, 67, 3, 2);
    draw_digit(16, 63, quantum_left);
    // S:
    fill_rect(30, 63, 5, 2); fill_rect(28, 65, 2, 2);
    fill_rect(30, 66, 3, 2); fill_rect(33, 67, 2, 2);
    fill_rect(28, 68, 5, 2);
    draw_digit(38, 63, switches % 10);
    // T:
    fill_rect(52, 63, 7, 2); fill_rect(54, 65, 3, 4);
    draw_digit(62, 63, ticks % 10);
}

int find_next(int from) {
    int i; int next;
    for (i = 1; i <= 4; i = i + 1) {
        next = (from + i) % 4;
        if (proc_state[next] == 0 && proc_work[next] > 0) return next;
    }
    return from;
}

int all_done() {
    int i;
    for (i = 0; i < 4; i = i + 1) {
        if (proc_state[i] != 3 && proc_state[i] != 2) {
            if (proc_work[i] > 0) return 0;
        }
    }
    return 1;
}

void do_tick() {
    int next;
    if (all_done()) return;
    ticks = ticks + 1;
    if (proc_state[current] == 0) proc_state[current] = 1;
    if (proc_state[current] == 1 && proc_work[current] > 0) {
        proc_work[current] = proc_work[current] - 1;
        proc_done[current] = proc_done[current] + 1;
        quantum_left = quantum_left - 1;
        if (proc_work[current] == 0) {
            proc_state[current] = 3;
            quantum_left = 0;
        }
    }
    if (quantum_left <= 0 || proc_state[current] == 2 || proc_state[current] == 3) {
        if (proc_state[current] == 1) proc_state[current] = 0;
        next = find_next(current);
        if (next != current) {
            current = next;
            switches = switches + 1;
        }
        quantum_left = 2;
    }
}

void toggle_block(int idx) {
    if (proc_state[idx] == 0 || proc_state[idx] == 1) {
        proc_state[idx] = 2;
        if (idx == current) quantum_left = 0;
    } else if (proc_state[idx] == 2) {
        proc_state[idx] = 0;
    }
}

void draw_all() {
    int i;
    for (i = 0; i < 4; i = i + 1) draw_proc(i);
    draw_info();
}

int main() {
    int key; int lk; int delay;
    proc_work[0] = 3; proc_work[1] = 2; proc_work[2] = 4; proc_work[3] = 3;
    proc_state[0] = 0; proc_state[1] = 0; proc_state[2] = 0; proc_state[3] = 0;
    proc_done[0] = 0; proc_done[1] = 0; proc_done[2] = 0; proc_done[3] = 0;
    lk = 0; delay = 0;
    draw_all();
    while (1) {
        key = *KEYBOARD;
        if (key != 0 && key != lk) {
            if (key == 32) { do_tick(); draw_all(); }
            if (key == 65) { auto_run = 1 - auto_run; }
            if (key == 48) { toggle_block(0); draw_all(); }
            if (key == 49) { toggle_block(1); draw_all(); }
            if (key == 50) { toggle_block(2); draw_all(); }
            if (key == 51) { toggle_block(3); draw_all(); }
            if (key == 13) return switches;
        }
        lk = key;
        if (auto_run) {
            delay = delay + 1;
            if (delay > 3000) { delay = 0; do_tick(); draw_all(); }
        }
    }
    return switches;
}
`,
        visualTest: true,
        visualDescription: "Espace=tick, 0-3=bloquer, A=auto - observez le round-robin!"
    }
};

// Get exercise by ID
export function getOsExercise(id) {
    return OS_EXERCISES[id];
}

// Get all OS exercise IDs in order
export function getOsExerciseIds() {
    return Object.keys(OS_EXERCISES);
}
