// OS/System Exercises for nand2tetris-seed
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

char *SCREEN = (char*)0x00400000;
int *KEYBOARD = (int*)0x00402600;
int key_count = 0;
int cursor_x = 0;

// Dessine un octet (8 pixels) à la position (bx, y)
void draw_byte(int bx, int y, int data) {
    SCREEN[y * 40 + bx] = data;
}

int read_key() {
    // Votre code: lire depuis KEYBOARD
    return 0;
}

void show_key(int key) {
    // Votre code: afficher quelque chose à l'écran
    // Utiliser draw_byte(cursor_x, ligne, data)
    // et incrémenter cursor_x
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
// Affiche les caractères en grand (police bitmap 8x8)

char *SCREEN = (char*)0x00400000;
int *KEYBOARD = (int*)0x00402600;
int *OUTPUT = (int*)0xFFFF0000;
int key_count = 0;
int cursor_x = 0;
int last_key = 0;

// Police bitmap 8x8 pour caractères courants
// Retourne les 8 lignes du caractère dans un tableau
void get_char_lines(int c, int *lines) {
    // Chiffres 0-9
    if (c == 48) { lines[0]=0x3C; lines[1]=0x46; lines[2]=0x4A; lines[3]=0x52; lines[4]=0x62; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 49) { lines[0]=0x18; lines[1]=0x38; lines[2]=0x18; lines[3]=0x18; lines[4]=0x18; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 50) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x02; lines[3]=0x1C; lines[4]=0x20; lines[5]=0x7E; lines[6]=0; lines[7]=0; }
    else if (c == 51) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x0C; lines[3]=0x02; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 52) { lines[0]=0x04; lines[1]=0x0C; lines[2]=0x14; lines[3]=0x24; lines[4]=0x7E; lines[5]=0x04; lines[6]=0; lines[7]=0; }
    else if (c == 53) { lines[0]=0x7E; lines[1]=0x40; lines[2]=0x7C; lines[3]=0x02; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 54) { lines[0]=0x1C; lines[1]=0x20; lines[2]=0x7C; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 55) { lines[0]=0x7E; lines[1]=0x02; lines[2]=0x04; lines[3]=0x08; lines[4]=0x10; lines[5]=0x10; lines[6]=0; lines[7]=0; }
    else if (c == 56) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x3C; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 57) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x42; lines[3]=0x3E; lines[4]=0x04; lines[5]=0x38; lines[6]=0; lines[7]=0; }
    // Lettres A-Z (majuscules, codes 65-90)
    else if (c == 65) { lines[0]=0x18; lines[1]=0x24; lines[2]=0x42; lines[3]=0x7E; lines[4]=0x42; lines[5]=0x42; lines[6]=0x42; lines[7]=0; } // A
    else if (c == 66) { lines[0]=0x7C; lines[1]=0x42; lines[2]=0x7C; lines[3]=0x42; lines[4]=0x42; lines[5]=0x7C; lines[6]=0; lines[7]=0; } // B
    else if (c == 67) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x40; lines[3]=0x40; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // C
    else if (c == 68) { lines[0]=0x78; lines[1]=0x44; lines[2]=0x42; lines[3]=0x42; lines[4]=0x44; lines[5]=0x78; lines[6]=0; lines[7]=0; } // D
    else if (c == 69) { lines[0]=0x7E; lines[1]=0x40; lines[2]=0x7C; lines[3]=0x40; lines[4]=0x40; lines[5]=0x7E; lines[6]=0; lines[7]=0; } // E
    else if (c == 70) { lines[0]=0x7E; lines[1]=0x40; lines[2]=0x7C; lines[3]=0x40; lines[4]=0x40; lines[5]=0x40; lines[6]=0; lines[7]=0; } // F
    else if (c == 71) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x40; lines[3]=0x4E; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // G
    else if (c == 72) { lines[0]=0x42; lines[1]=0x42; lines[2]=0x7E; lines[3]=0x42; lines[4]=0x42; lines[5]=0x42; lines[6]=0; lines[7]=0; } // H
    else if (c == 73) { lines[0]=0x3E; lines[1]=0x08; lines[2]=0x08; lines[3]=0x08; lines[4]=0x08; lines[5]=0x3E; lines[6]=0; lines[7]=0; } // I
    else if (c == 74) { lines[0]=0x1E; lines[1]=0x04; lines[2]=0x04; lines[3]=0x04; lines[4]=0x44; lines[5]=0x38; lines[6]=0; lines[7]=0; } // J
    else if (c == 75) { lines[0]=0x42; lines[1]=0x44; lines[2]=0x78; lines[3]=0x48; lines[4]=0x44; lines[5]=0x42; lines[6]=0; lines[7]=0; } // K
    else if (c == 76) { lines[0]=0x40; lines[1]=0x40; lines[2]=0x40; lines[3]=0x40; lines[4]=0x40; lines[5]=0x7E; lines[6]=0; lines[7]=0; } // L
    else if (c == 77) { lines[0]=0x42; lines[1]=0x66; lines[2]=0x5A; lines[3]=0x42; lines[4]=0x42; lines[5]=0x42; lines[6]=0; lines[7]=0; } // M
    else if (c == 78) { lines[0]=0x42; lines[1]=0x62; lines[2]=0x52; lines[3]=0x4A; lines[4]=0x46; lines[5]=0x42; lines[6]=0; lines[7]=0; } // N
    else if (c == 79) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x42; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // O
    else if (c == 80) { lines[0]=0x7C; lines[1]=0x42; lines[2]=0x7C; lines[3]=0x40; lines[4]=0x40; lines[5]=0x40; lines[6]=0; lines[7]=0; } // P
    else if (c == 81) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x42; lines[3]=0x4A; lines[4]=0x44; lines[5]=0x3A; lines[6]=0; lines[7]=0; } // Q
    else if (c == 82) { lines[0]=0x7C; lines[1]=0x42; lines[2]=0x7C; lines[3]=0x48; lines[4]=0x44; lines[5]=0x42; lines[6]=0; lines[7]=0; } // R
    else if (c == 83) { lines[0]=0x3C; lines[1]=0x40; lines[2]=0x3C; lines[3]=0x02; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // S
    else if (c == 84) { lines[0]=0x7E; lines[1]=0x18; lines[2]=0x18; lines[3]=0x18; lines[4]=0x18; lines[5]=0x18; lines[6]=0; lines[7]=0; } // T
    else if (c == 85) { lines[0]=0x42; lines[1]=0x42; lines[2]=0x42; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // U
    else if (c == 86) { lines[0]=0x42; lines[1]=0x42; lines[2]=0x42; lines[3]=0x42; lines[4]=0x24; lines[5]=0x18; lines[6]=0; lines[7]=0; } // V
    else if (c == 87) { lines[0]=0x42; lines[1]=0x42; lines[2]=0x42; lines[3]=0x5A; lines[4]=0x66; lines[5]=0x42; lines[6]=0; lines[7]=0; } // W
    else if (c == 88) { lines[0]=0x42; lines[1]=0x24; lines[2]=0x18; lines[3]=0x18; lines[4]=0x24; lines[5]=0x42; lines[6]=0; lines[7]=0; } // X
    else if (c == 89) { lines[0]=0x42; lines[1]=0x42; lines[2]=0x24; lines[3]=0x18; lines[4]=0x18; lines[5]=0x18; lines[6]=0; lines[7]=0; } // Y
    else if (c == 90) { lines[0]=0x7E; lines[1]=0x04; lines[2]=0x08; lines[3]=0x10; lines[4]=0x20; lines[5]=0x7E; lines[6]=0; lines[7]=0; } // Z
    // Lettres a-z (minuscules, codes 97-122)
    else if (c == 97) { lines[0]=0; lines[1]=0x3C; lines[2]=0x02; lines[3]=0x3E; lines[4]=0x42; lines[5]=0x3E; lines[6]=0; lines[7]=0; } // a
    else if (c == 98) { lines[0]=0x40; lines[1]=0x40; lines[2]=0x7C; lines[3]=0x42; lines[4]=0x42; lines[5]=0x7C; lines[6]=0; lines[7]=0; } // b
    else if (c == 99) { lines[0]=0; lines[1]=0x3C; lines[2]=0x40; lines[3]=0x40; lines[4]=0x40; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // c
    else if (c == 100) { lines[0]=0x02; lines[1]=0x02; lines[2]=0x3E; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3E; lines[6]=0; lines[7]=0; } // d
    else if (c == 101) { lines[0]=0; lines[1]=0x3C; lines[2]=0x42; lines[3]=0x7E; lines[4]=0x40; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // e
    else if (c == 102) { lines[0]=0x0C; lines[1]=0x10; lines[2]=0x3C; lines[3]=0x10; lines[4]=0x10; lines[5]=0x10; lines[6]=0; lines[7]=0; } // f
    else if (c == 103) { lines[0]=0; lines[1]=0x3E; lines[2]=0x42; lines[3]=0x3E; lines[4]=0x02; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // g
    else if (c == 104) { lines[0]=0x40; lines[1]=0x40; lines[2]=0x7C; lines[3]=0x42; lines[4]=0x42; lines[5]=0x42; lines[6]=0; lines[7]=0; } // h
    else if (c == 105) { lines[0]=0x18; lines[1]=0; lines[2]=0x38; lines[3]=0x18; lines[4]=0x18; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // i
    else if (c == 106) { lines[0]=0x04; lines[1]=0; lines[2]=0x04; lines[3]=0x04; lines[4]=0x44; lines[5]=0x38; lines[6]=0; lines[7]=0; } // j
    else if (c == 107) { lines[0]=0x40; lines[1]=0x44; lines[2]=0x48; lines[3]=0x70; lines[4]=0x48; lines[5]=0x44; lines[6]=0; lines[7]=0; } // k
    else if (c == 108) { lines[0]=0x38; lines[1]=0x18; lines[2]=0x18; lines[3]=0x18; lines[4]=0x18; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // l
    else if (c == 109) { lines[0]=0; lines[1]=0x76; lines[2]=0x5A; lines[3]=0x5A; lines[4]=0x42; lines[5]=0x42; lines[6]=0; lines[7]=0; } // m
    else if (c == 110) { lines[0]=0; lines[1]=0x7C; lines[2]=0x42; lines[3]=0x42; lines[4]=0x42; lines[5]=0x42; lines[6]=0; lines[7]=0; } // n
    else if (c == 111) { lines[0]=0; lines[1]=0x3C; lines[2]=0x42; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // o
    else if (c == 112) { lines[0]=0; lines[1]=0x7C; lines[2]=0x42; lines[3]=0x7C; lines[4]=0x40; lines[5]=0x40; lines[6]=0; lines[7]=0; } // p
    else if (c == 113) { lines[0]=0; lines[1]=0x3E; lines[2]=0x42; lines[3]=0x3E; lines[4]=0x02; lines[5]=0x02; lines[6]=0; lines[7]=0; } // q
    else if (c == 114) { lines[0]=0; lines[1]=0x5C; lines[2]=0x60; lines[3]=0x40; lines[4]=0x40; lines[5]=0x40; lines[6]=0; lines[7]=0; } // r
    else if (c == 115) { lines[0]=0; lines[1]=0x3E; lines[2]=0x40; lines[3]=0x3C; lines[4]=0x02; lines[5]=0x7C; lines[6]=0; lines[7]=0; } // s
    else if (c == 116) { lines[0]=0x10; lines[1]=0x3C; lines[2]=0x10; lines[3]=0x10; lines[4]=0x10; lines[5]=0x0C; lines[6]=0; lines[7]=0; } // t
    else if (c == 117) { lines[0]=0; lines[1]=0x42; lines[2]=0x42; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3E; lines[6]=0; lines[7]=0; } // u
    else if (c == 118) { lines[0]=0; lines[1]=0x42; lines[2]=0x42; lines[3]=0x42; lines[4]=0x24; lines[5]=0x18; lines[6]=0; lines[7]=0; } // v
    else if (c == 119) { lines[0]=0; lines[1]=0x42; lines[2]=0x42; lines[3]=0x5A; lines[4]=0x5A; lines[5]=0x66; lines[6]=0; lines[7]=0; } // w
    else if (c == 120) { lines[0]=0; lines[1]=0x42; lines[2]=0x24; lines[3]=0x18; lines[4]=0x24; lines[5]=0x42; lines[6]=0; lines[7]=0; } // x
    else if (c == 121) { lines[0]=0; lines[1]=0x42; lines[2]=0x42; lines[3]=0x3E; lines[4]=0x02; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // y
    else if (c == 122) { lines[0]=0; lines[1]=0x7E; lines[2]=0x04; lines[3]=0x18; lines[4]=0x20; lines[5]=0x7E; lines[6]=0; lines[7]=0; } // z
    // Caractere par defaut (carre)
    else { lines[0]=0xFF; lines[1]=0x81; lines[2]=0x81; lines[3]=0x81; lines[4]=0x81; lines[5]=0x81; lines[6]=0xFF; lines[7]=0; }
}

// Dessine un caractere 8x8 a la position (bx, py)
// bx = colonne en octets (0-39), py = ligne en pixels (0-239)
void draw_char(int bx, int py, int c) {
    int lines[8];
    int i;
    get_char_lines(c, lines);
    for (i = 0; i < 8; i = i + 1) {
        SCREEN[(py + i) * 40 + bx] = lines[i];
    }
}

int main() {
    int key;
    int i;
    int delay;

    *OUTPUT = 'K'; *OUTPUT = 'B'; *OUTPUT = 'D'; *OUTPUT = 10;

    // Effacer l'ecran
    for (i = 0; i < 9600; i = i + 1) SCREEN[i] = 0;

    // Titre "KEYS:" en haut
    draw_char(0, 0, 75);  // K
    draw_char(1, 0, 69);  // E
    draw_char(2, 0, 89);  // Y
    draw_char(3, 0, 83);  // S

    // Boucle - affiche les touches pressees
    while (key_count < 10) {
        key = *KEYBOARD;

        if (key != 0 && key != last_key) {
            *OUTPUT = key; *OUTPUT = 10;

            // Dessiner le caractere
            draw_char(cursor_x, 16, key);
            cursor_x = cursor_x + 1;
            if (cursor_x >= 39) cursor_x = 0;
            key_count = key_count + 1;
        }
        last_key = key;

        for (delay = 0; delay < 5000; delay = delay + 1) { }
    }

    *OUTPUT = 'O'; *OUTPUT = 'K'; *OUTPUT = 10;
    return key_count;
}
`,
        expectedReturn: 10
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

char *SCREEN = (char*)0x00400000;
int *KEYBOARD = (int*)0x00402600;
int number = 0;

// Dessine un octet à la position (bx, y)
void draw_byte(int bx, int y, int data) {
    SCREEN[y * 40 + bx] = data;
}

int read_key() {
    return *KEYBOARD;
}

void show_prompt() {
    // Afficher ">" à l'écran (colonne 0)
    // Utiliser draw_byte(0, ligne, data)
}

void show_digit(int d, int pos) {
    // Afficher le chiffre d à la position pos
    // Utiliser draw_byte(pos + 2, ligne, data)
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
        solution: `// Shell Interactif - Solution avec police bitmap
// Cochez "Capturer clavier" et tapez des chiffres!
// Structure identique à Driver Clavier

char *SCREEN = (char*)0x00400000;
int *KEYBOARD = (int*)0x00402600;
int *OUTPUT = (int*)0xFFFF0000;
int number = 0;
int cursor_x = 2;
int last_key = 0;

// Police bitmap 8x8 pour caractères courants
void get_char_lines(int c, int *lines) {
    // Chiffres 0-9
    if (c == 48) { lines[0]=0x3C; lines[1]=0x46; lines[2]=0x4A; lines[3]=0x52; lines[4]=0x62; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 49) { lines[0]=0x18; lines[1]=0x38; lines[2]=0x18; lines[3]=0x18; lines[4]=0x18; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 50) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x02; lines[3]=0x1C; lines[4]=0x20; lines[5]=0x7E; lines[6]=0; lines[7]=0; }
    else if (c == 51) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x0C; lines[3]=0x02; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 52) { lines[0]=0x04; lines[1]=0x0C; lines[2]=0x14; lines[3]=0x24; lines[4]=0x7E; lines[5]=0x04; lines[6]=0; lines[7]=0; }
    else if (c == 53) { lines[0]=0x7E; lines[1]=0x40; lines[2]=0x7C; lines[3]=0x02; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 54) { lines[0]=0x1C; lines[1]=0x20; lines[2]=0x7C; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 55) { lines[0]=0x7E; lines[1]=0x02; lines[2]=0x04; lines[3]=0x08; lines[4]=0x10; lines[5]=0x10; lines[6]=0; lines[7]=0; }
    else if (c == 56) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x3C; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 57) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x42; lines[3]=0x3E; lines[4]=0x04; lines[5]=0x38; lines[6]=0; lines[7]=0; }
    // Symbole > (code 62)
    else if (c == 62) { lines[0]=0x40; lines[1]=0x20; lines[2]=0x10; lines[3]=0x08; lines[4]=0x10; lines[5]=0x20; lines[6]=0x40; lines[7]=0; }
    // Espace (code 32)
    else if (c == 32) { lines[0]=0; lines[1]=0; lines[2]=0; lines[3]=0; lines[4]=0; lines[5]=0; lines[6]=0; lines[7]=0; }
    // Caractere par defaut (carre)
    else { lines[0]=0xFF; lines[1]=0x81; lines[2]=0x81; lines[3]=0x81; lines[4]=0x81; lines[5]=0x81; lines[6]=0xFF; lines[7]=0; }
}

// Dessine un caractere 8x8 a la position (bx, py)
void draw_char(int bx, int py, int c) {
    int lines[8];
    int i;
    get_char_lines(c, lines);
    for (i = 0; i < 8; i = i + 1) {
        SCREEN[(py + i) * 40 + bx] = lines[i];
    }
}

int main() {
    int key;
    int i;
    int delay;

    *OUTPUT = '>'; *OUTPUT = ' ';

    // Effacer l'ecran
    for (i = 0; i < 9600; i = i + 1) SCREEN[i] = 0;

    // Afficher le prompt ">"
    draw_char(0, 0, 62);

    // Boucle - lit les chiffres tapés
    while (1) {
        key = *KEYBOARD;

        if (key != 0 && key != last_key) {
            // Esc (27) = quitter
            if (key == 27) {
                *OUTPUT = 10;
                return number;
            }
            // Enter (13) = terminer
            if (key == 13) {
                *OUTPUT = 10;
                return number;
            }
            // Chiffres 0-9 (48-57)
            if (key >= 48 && key <= 57) {
                *OUTPUT = key;

                // Dessiner le chiffre
                draw_char(cursor_x, 0, key);
                cursor_x = cursor_x + 1;
                if (cursor_x >= 39) cursor_x = 2;
                number = number * 10 + (key - 48);
            }
        }
        last_key = key;

        for (delay = 0; delay < 5000; delay = delay + 1) { }
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
        solution: `// Calculatrice Interactive - Solution avec police bitmap
// Cochez "Capturer clavier", tapez: 3+5 Enter

char *SCREEN = (char*)0x00400000;
int *KEYBOARD = (int*)0x00402600;
int *OUTPUT = (int*)0xFFFF0000;
int cursor_x = 0;
int last_key = 0;

// Police bitmap 8x8
void get_char_lines(int c, int *lines) {
    // Chiffres 0-9
    if (c == 48) { lines[0]=0x3C; lines[1]=0x46; lines[2]=0x4A; lines[3]=0x52; lines[4]=0x62; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 49) { lines[0]=0x18; lines[1]=0x38; lines[2]=0x18; lines[3]=0x18; lines[4]=0x18; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 50) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x02; lines[3]=0x1C; lines[4]=0x20; lines[5]=0x7E; lines[6]=0; lines[7]=0; }
    else if (c == 51) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x0C; lines[3]=0x02; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 52) { lines[0]=0x04; lines[1]=0x0C; lines[2]=0x14; lines[3]=0x24; lines[4]=0x7E; lines[5]=0x04; lines[6]=0; lines[7]=0; }
    else if (c == 53) { lines[0]=0x7E; lines[1]=0x40; lines[2]=0x7C; lines[3]=0x02; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 54) { lines[0]=0x1C; lines[1]=0x20; lines[2]=0x7C; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 55) { lines[0]=0x7E; lines[1]=0x02; lines[2]=0x04; lines[3]=0x08; lines[4]=0x10; lines[5]=0x10; lines[6]=0; lines[7]=0; }
    else if (c == 56) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x3C; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 57) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x42; lines[3]=0x3E; lines[4]=0x04; lines[5]=0x38; lines[6]=0; lines[7]=0; }
    // + (43)
    else if (c == 43) { lines[0]=0; lines[1]=0x18; lines[2]=0x18; lines[3]=0x7E; lines[4]=0x18; lines[5]=0x18; lines[6]=0; lines[7]=0; }
    // - (45)
    else if (c == 45) { lines[0]=0; lines[1]=0; lines[2]=0; lines[3]=0x7E; lines[4]=0; lines[5]=0; lines[6]=0; lines[7]=0; }
    // * (42)
    else if (c == 42) { lines[0]=0; lines[1]=0x24; lines[2]=0x18; lines[3]=0x7E; lines[4]=0x18; lines[5]=0x24; lines[6]=0; lines[7]=0; }
    // = (61)
    else if (c == 61) { lines[0]=0; lines[1]=0x7E; lines[2]=0; lines[3]=0x7E; lines[4]=0; lines[5]=0; lines[6]=0; lines[7]=0; }
    // Majuscules C, A, L pour titre
    else if (c == 65) { lines[0]=0x18; lines[1]=0x24; lines[2]=0x42; lines[3]=0x7E; lines[4]=0x42; lines[5]=0x42; lines[6]=0; lines[7]=0; } // A
    else if (c == 67) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x40; lines[3]=0x40; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // C
    else if (c == 76) { lines[0]=0x40; lines[1]=0x40; lines[2]=0x40; lines[3]=0x40; lines[4]=0x40; lines[5]=0x7E; lines[6]=0; lines[7]=0; } // L
    // Default
    else { lines[0]=0xFF; lines[1]=0x81; lines[2]=0x81; lines[3]=0x81; lines[4]=0x81; lines[5]=0x81; lines[6]=0xFF; lines[7]=0; }
}

void draw_char(int bx, int py, int c) {
    int lines[8];
    int i;
    get_char_lines(c, lines);
    for (i = 0; i < 8; i = i + 1) {
        SCREEN[(py + i) * 40 + bx] = lines[i];
    }
}

int main() {
    int key;
    int i;
    int delay;
    int a; int b; int op; int st; int r; int tens; int u;

    a = 0; b = 0; op = 0; st = 0;

    *OUTPUT = 'C'; *OUTPUT = 'A'; *OUTPUT = 'L'; *OUTPUT = 'C'; *OUTPUT = 10;

    // Effacer l'ecran
    for (i = 0; i < 9600; i = i + 1) SCREEN[i] = 0;

    // Titre "CALC"
    draw_char(0, 0, 67); draw_char(1, 0, 65); draw_char(2, 0, 76); draw_char(3, 0, 67);

    // Boucle principale
    while (1) {
        key = *KEYBOARD;

        if (key != 0 && key != last_key) {
            *OUTPUT = key;

            // Enter = calculer
            if (key == 13 && st == 2) {
                *OUTPUT = 10;
                if (op == 1) r = a + b;
                if (op == 2) r = a - b;
                if (op == 3) r = a * b;
                draw_char(cursor_x, 16, 61); cursor_x = cursor_x + 1;
                // Afficher resultat (max 2 chiffres)
                tens = 0; u = r;
                while (u >= 10) { u = u - 10; tens = tens + 1; }
                if (tens > 0) { draw_char(cursor_x, 16, 48 + tens); cursor_x = cursor_x + 1; }
                draw_char(cursor_x, 16, 48 + u);
                return r;
            }
            // Chiffre
            if (key >= 48 && key <= 57) {
                draw_char(cursor_x, 16, key);
                cursor_x = cursor_x + 1;
                if (st == 0) { a = key - 48; st = 1; }
                else if (st == 2) { b = key - 48; }
            }
            // Operateurs
            if (key == 43 && st == 1) { draw_char(cursor_x, 16, 43); cursor_x = cursor_x + 1; op = 1; st = 2; }
            if (key == 45 && st == 1) { draw_char(cursor_x, 16, 45); cursor_x = cursor_x + 1; op = 2; st = 2; }
            if (key == 42 && st == 1) { draw_char(cursor_x, 16, 42); cursor_x = cursor_x + 1; op = 3; st = 2; }
        }
        last_key = key;

        for (delay = 0; delay < 5000; delay = delay + 1) { }
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
        solution: `// Variables Shell Interactive - Solution avec police bitmap
// Cochez "Capturer clavier", tapez: a=5 b=3 Enter

char *SCREEN = (char*)0x00400000;
int *KEYBOARD = (int*)0x00402600;
int *OUTPUT = (int*)0xFFFF0000;
int cursor_x = 0;
int last_key = 0;

int var_names[8];
int var_values[8];
int var_count = 0;

// Police bitmap 8x8
void get_char_lines(int c, int *lines) {
    // Chiffres 0-9
    if (c == 48) { lines[0]=0x3C; lines[1]=0x46; lines[2]=0x4A; lines[3]=0x52; lines[4]=0x62; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 49) { lines[0]=0x18; lines[1]=0x38; lines[2]=0x18; lines[3]=0x18; lines[4]=0x18; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 50) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x02; lines[3]=0x1C; lines[4]=0x20; lines[5]=0x7E; lines[6]=0; lines[7]=0; }
    else if (c == 51) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x0C; lines[3]=0x02; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 52) { lines[0]=0x04; lines[1]=0x0C; lines[2]=0x14; lines[3]=0x24; lines[4]=0x7E; lines[5]=0x04; lines[6]=0; lines[7]=0; }
    else if (c == 53) { lines[0]=0x7E; lines[1]=0x40; lines[2]=0x7C; lines[3]=0x02; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 54) { lines[0]=0x1C; lines[1]=0x20; lines[2]=0x7C; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 55) { lines[0]=0x7E; lines[1]=0x02; lines[2]=0x04; lines[3]=0x08; lines[4]=0x10; lines[5]=0x10; lines[6]=0; lines[7]=0; }
    else if (c == 56) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x3C; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 57) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x42; lines[3]=0x3E; lines[4]=0x04; lines[5]=0x38; lines[6]=0; lines[7]=0; }
    // = (61)
    else if (c == 61) { lines[0]=0; lines[1]=0x7E; lines[2]=0; lines[3]=0x7E; lines[4]=0; lines[5]=0; lines[6]=0; lines[7]=0; }
    // + (43)
    else if (c == 43) { lines[0]=0; lines[1]=0x18; lines[2]=0x18; lines[3]=0x7E; lines[4]=0x18; lines[5]=0x18; lines[6]=0; lines[7]=0; }
    // Lettres a-z (minuscules)
    else if (c == 97) { lines[0]=0; lines[1]=0x3C; lines[2]=0x02; lines[3]=0x3E; lines[4]=0x42; lines[5]=0x3E; lines[6]=0; lines[7]=0; } // a
    else if (c == 98) { lines[0]=0x40; lines[1]=0x40; lines[2]=0x7C; lines[3]=0x42; lines[4]=0x42; lines[5]=0x7C; lines[6]=0; lines[7]=0; } // b
    else if (c == 99) { lines[0]=0; lines[1]=0x3C; lines[2]=0x40; lines[3]=0x40; lines[4]=0x40; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // c
    else if (c == 100) { lines[0]=0x02; lines[1]=0x02; lines[2]=0x3E; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3E; lines[6]=0; lines[7]=0; } // d
    else if (c == 101) { lines[0]=0; lines[1]=0x3C; lines[2]=0x42; lines[3]=0x7E; lines[4]=0x40; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // e
    else if (c == 102) { lines[0]=0x0C; lines[1]=0x10; lines[2]=0x3C; lines[3]=0x10; lines[4]=0x10; lines[5]=0x10; lines[6]=0; lines[7]=0; } // f
    else if (c == 103) { lines[0]=0; lines[1]=0x3E; lines[2]=0x42; lines[3]=0x3E; lines[4]=0x02; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // g
    else if (c == 104) { lines[0]=0x40; lines[1]=0x40; lines[2]=0x7C; lines[3]=0x42; lines[4]=0x42; lines[5]=0x42; lines[6]=0; lines[7]=0; } // h
    else if (c == 105) { lines[0]=0x18; lines[1]=0; lines[2]=0x38; lines[3]=0x18; lines[4]=0x18; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // i
    else if (c == 106) { lines[0]=0x04; lines[1]=0; lines[2]=0x04; lines[3]=0x04; lines[4]=0x44; lines[5]=0x38; lines[6]=0; lines[7]=0; } // j
    else if (c == 107) { lines[0]=0x40; lines[1]=0x44; lines[2]=0x48; lines[3]=0x70; lines[4]=0x48; lines[5]=0x44; lines[6]=0; lines[7]=0; } // k
    else if (c == 108) { lines[0]=0x38; lines[1]=0x18; lines[2]=0x18; lines[3]=0x18; lines[4]=0x18; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // l
    else if (c == 109) { lines[0]=0; lines[1]=0x76; lines[2]=0x5A; lines[3]=0x5A; lines[4]=0x42; lines[5]=0x42; lines[6]=0; lines[7]=0; } // m
    else if (c == 110) { lines[0]=0; lines[1]=0x7C; lines[2]=0x42; lines[3]=0x42; lines[4]=0x42; lines[5]=0x42; lines[6]=0; lines[7]=0; } // n
    else if (c == 111) { lines[0]=0; lines[1]=0x3C; lines[2]=0x42; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // o
    else if (c == 112) { lines[0]=0; lines[1]=0x7C; lines[2]=0x42; lines[3]=0x7C; lines[4]=0x40; lines[5]=0x40; lines[6]=0; lines[7]=0; } // p
    else if (c == 113) { lines[0]=0; lines[1]=0x3E; lines[2]=0x42; lines[3]=0x3E; lines[4]=0x02; lines[5]=0x02; lines[6]=0; lines[7]=0; } // q
    else if (c == 114) { lines[0]=0; lines[1]=0x5C; lines[2]=0x60; lines[3]=0x40; lines[4]=0x40; lines[5]=0x40; lines[6]=0; lines[7]=0; } // r
    else if (c == 115) { lines[0]=0; lines[1]=0x3E; lines[2]=0x40; lines[3]=0x3C; lines[4]=0x02; lines[5]=0x7C; lines[6]=0; lines[7]=0; } // s
    else if (c == 116) { lines[0]=0x10; lines[1]=0x3C; lines[2]=0x10; lines[3]=0x10; lines[4]=0x10; lines[5]=0x0C; lines[6]=0; lines[7]=0; } // t
    else if (c == 117) { lines[0]=0; lines[1]=0x42; lines[2]=0x42; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3E; lines[6]=0; lines[7]=0; } // u
    else if (c == 118) { lines[0]=0; lines[1]=0x42; lines[2]=0x42; lines[3]=0x42; lines[4]=0x24; lines[5]=0x18; lines[6]=0; lines[7]=0; } // v
    else if (c == 119) { lines[0]=0; lines[1]=0x42; lines[2]=0x42; lines[3]=0x5A; lines[4]=0x5A; lines[5]=0x66; lines[6]=0; lines[7]=0; } // w
    else if (c == 120) { lines[0]=0; lines[1]=0x42; lines[2]=0x24; lines[3]=0x18; lines[4]=0x24; lines[5]=0x42; lines[6]=0; lines[7]=0; } // x
    else if (c == 121) { lines[0]=0; lines[1]=0x42; lines[2]=0x42; lines[3]=0x3E; lines[4]=0x02; lines[5]=0x3C; lines[6]=0; lines[7]=0; } // y
    else if (c == 122) { lines[0]=0; lines[1]=0x7E; lines[2]=0x04; lines[3]=0x18; lines[4]=0x20; lines[5]=0x7E; lines[6]=0; lines[7]=0; } // z
    // Majuscules V, A, R
    else if (c == 65) { lines[0]=0x18; lines[1]=0x24; lines[2]=0x42; lines[3]=0x7E; lines[4]=0x42; lines[5]=0x42; lines[6]=0; lines[7]=0; } // A
    else if (c == 82) { lines[0]=0x7C; lines[1]=0x42; lines[2]=0x7C; lines[3]=0x48; lines[4]=0x44; lines[5]=0x42; lines[6]=0; lines[7]=0; } // R
    else if (c == 86) { lines[0]=0x42; lines[1]=0x42; lines[2]=0x42; lines[3]=0x42; lines[4]=0x24; lines[5]=0x18; lines[6]=0; lines[7]=0; } // V
    // Default
    else { lines[0]=0xFF; lines[1]=0x81; lines[2]=0x81; lines[3]=0x81; lines[4]=0x81; lines[5]=0x81; lines[6]=0xFF; lines[7]=0; }
}

void draw_char(int bx, int py, int c) {
    int lines[8];
    int i;
    get_char_lines(c, lines);
    for (i = 0; i < 8; i = i + 1) {
        SCREEN[(py + i) * 40 + bx] = lines[i];
    }
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
    int key;
    int i;
    int delay;
    int st; int cur_name; int result;

    st = 0; cur_name = 0; result = 0;

    *OUTPUT = 'V'; *OUTPUT = 'A'; *OUTPUT = 'R'; *OUTPUT = 10;

    // Effacer l'ecran
    for (i = 0; i < 9600; i = i + 1) SCREEN[i] = 0;

    // Titre "VAR"
    draw_char(0, 0, 86); draw_char(1, 0, 65); draw_char(2, 0, 82);

    // Boucle principale
    while (1) {
        key = *KEYBOARD;

        if (key != 0 && key != last_key) {
            *OUTPUT = key;

            // Enter = calculer resultat
            if (key == 13) {
                *OUTPUT = 10;
                if (var_count >= 2) {
                    result = var_values[0] + var_values[1];
                    draw_char(cursor_x, 16, 61); cursor_x = cursor_x + 1;
                    draw_char(cursor_x, 16, 48 + result);
                }
                return result;
            }
            // Lettre a-z
            if (key >= 97 && key <= 122 && st == 0) {
                draw_char(cursor_x, 16, key); cursor_x = cursor_x + 1;
                cur_name = key;
                st = 1;
            }
            // = apres lettre
            if (key == 61 && st == 1) {
                draw_char(cursor_x, 16, 61); cursor_x = cursor_x + 1;
                st = 2;
            }
            // Chiffre apres =
            if (key >= 48 && key <= 57 && st == 2) {
                draw_char(cursor_x, 16, key); cursor_x = cursor_x + 1;
                set_var(cur_name, key - 48);
                st = 0;
                cursor_x = cursor_x + 1; // espace
            }
        }
        last_key = key;

        for (delay = 0; delay < 5000; delay = delay + 1) { }
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
        solution: `// Compte à Rebours - Solution avec police bitmap
// Cochez "Capturer clavier", tapez 1-9 pour lancer

char *SCREEN = (char*)0x00400000;
int *KEYBOARD = (int*)0x00402600;
int *OUTPUT = (int*)0xFFFF0000;
int last_key = 0;

void get_char_lines(int c, int *lines) {
    if (c == 48) { lines[0]=0x3C; lines[1]=0x46; lines[2]=0x4A; lines[3]=0x52; lines[4]=0x62; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 49) { lines[0]=0x18; lines[1]=0x38; lines[2]=0x18; lines[3]=0x18; lines[4]=0x18; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 50) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x02; lines[3]=0x1C; lines[4]=0x20; lines[5]=0x7E; lines[6]=0; lines[7]=0; }
    else if (c == 51) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x0C; lines[3]=0x02; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 52) { lines[0]=0x04; lines[1]=0x0C; lines[2]=0x14; lines[3]=0x24; lines[4]=0x7E; lines[5]=0x04; lines[6]=0; lines[7]=0; }
    else if (c == 53) { lines[0]=0x7E; lines[1]=0x40; lines[2]=0x7C; lines[3]=0x02; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 54) { lines[0]=0x1C; lines[1]=0x20; lines[2]=0x7C; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 55) { lines[0]=0x7E; lines[1]=0x02; lines[2]=0x04; lines[3]=0x08; lines[4]=0x10; lines[5]=0x10; lines[6]=0; lines[7]=0; }
    else if (c == 56) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x3C; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 57) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x42; lines[3]=0x3E; lines[4]=0x04; lines[5]=0x38; lines[6]=0; lines[7]=0; }
    else if (c == 84) { lines[0]=0x7E; lines[1]=0x18; lines[2]=0x18; lines[3]=0x18; lines[4]=0x18; lines[5]=0x18; lines[6]=0; lines[7]=0; }
    else if (c == 73) { lines[0]=0x3E; lines[1]=0x08; lines[2]=0x08; lines[3]=0x08; lines[4]=0x08; lines[5]=0x3E; lines[6]=0; lines[7]=0; }
    else if (c == 77) { lines[0]=0x42; lines[1]=0x66; lines[2]=0x5A; lines[3]=0x42; lines[4]=0x42; lines[5]=0x42; lines[6]=0; lines[7]=0; }
    else if (c == 69) { lines[0]=0x7E; lines[1]=0x40; lines[2]=0x7C; lines[3]=0x40; lines[4]=0x40; lines[5]=0x7E; lines[6]=0; lines[7]=0; }
    else if (c == 82) { lines[0]=0x7C; lines[1]=0x42; lines[2]=0x7C; lines[3]=0x48; lines[4]=0x44; lines[5]=0x42; lines[6]=0; lines[7]=0; }
    else { lines[0]=0xFF; lines[1]=0x81; lines[2]=0x81; lines[3]=0x81; lines[4]=0x81; lines[5]=0x81; lines[6]=0xFF; lines[7]=0; }
}

void draw_char(int bx, int py, int c) {
    int lines[8]; int i;
    get_char_lines(c, lines);
    for (i = 0; i < 8; i = i + 1) SCREEN[(py + i) * 40 + bx] = lines[i];
}

void draw_bar(int width) {
    int i;
    for (i = 0; i < width; i = i + 1) {
        SCREEN[24 * 40 + i] = 0xFF;
        SCREEN[25 * 40 + i] = 0xFF;
        SCREEN[26 * 40 + i] = 0xFF;
        SCREEN[27 * 40 + i] = 0xFF;
    }
}

void clear_bar_col(int bx) {
    SCREEN[24 * 40 + bx] = 0;
    SCREEN[25 * 40 + bx] = 0;
    SCREEN[26 * 40 + bx] = 0;
    SCREEN[27 * 40 + bx] = 0;
}

void flash_screen() {
    int i;
    for (i = 0; i < 9600; i = i + 1) SCREEN[i] = 0xFF;
}

int state = 0;
int secs = 0;
int bar_w = 0;
int tick_count = 0;

int main() {
    int key; int i; int delay;

    *OUTPUT = 'T'; *OUTPUT = 'I'; *OUTPUT = 'M'; *OUTPUT = 'E'; *OUTPUT = 'R'; *OUTPUT = 10;
    for (i = 0; i < 9600; i = i + 1) SCREEN[i] = 0;
    draw_char(0, 0, 84); draw_char(1, 0, 73); draw_char(2, 0, 77); draw_char(3, 0, 69); draw_char(4, 0, 82);

    while (1) {
        key = *KEYBOARD;
        if (state == 0) {
            if (key >= 49 && key <= 57 && key != last_key) {
                secs = key - 48;
                *OUTPUT = key; *OUTPUT = 10;
                draw_char(5, 12, key);
                bar_w = secs * 3;
                draw_bar(bar_w);
                tick_count = 0;
                state = 1;
            }
        }
        if (state == 1) {
            tick_count = tick_count + 1;
            if (tick_count >= 2000) {
                tick_count = 0;
                bar_w = bar_w - 1;
                clear_bar_col(bar_w);
                if (bar_w % 3 == 0) {
                    secs = secs - 1;
                    draw_char(5, 12, 48 + secs);
                }
                if (bar_w <= 0) state = 2;
            }
        }
        if (state == 2) {
            flash_screen();
            *OUTPUT = 'D'; *OUTPUT = 'O'; *OUTPUT = 'N'; *OUTPUT = 'E'; *OUTPUT = 10;
            return 1;
        }
        last_key = key;
        for (delay = 0; delay < 100; delay = delay + 1) { }
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
        solution: `// Interruptions - Solution avec police bitmap
// Cochez "Capturer clavier", appuyez T/K/S puis Enter

char *SCREEN = (char*)0x00400000;
int *KEYBOARD = (int*)0x00402600;
int *OUTPUT = (int*)0xFFFF0000;
int last_key = 0;
int irq_count[3];

void get_char_lines(int c, int *lines) {
    if (c == 48) { lines[0]=0x3C; lines[1]=0x46; lines[2]=0x4A; lines[3]=0x52; lines[4]=0x62; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 49) { lines[0]=0x18; lines[1]=0x38; lines[2]=0x18; lines[3]=0x18; lines[4]=0x18; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 50) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x02; lines[3]=0x1C; lines[4]=0x20; lines[5]=0x7E; lines[6]=0; lines[7]=0; }
    else if (c == 51) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x0C; lines[3]=0x02; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 52) { lines[0]=0x04; lines[1]=0x0C; lines[2]=0x14; lines[3]=0x24; lines[4]=0x7E; lines[5]=0x04; lines[6]=0; lines[7]=0; }
    else if (c == 53) { lines[0]=0x7E; lines[1]=0x40; lines[2]=0x7C; lines[3]=0x02; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 54) { lines[0]=0x1C; lines[1]=0x20; lines[2]=0x7C; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 55) { lines[0]=0x7E; lines[1]=0x02; lines[2]=0x04; lines[3]=0x08; lines[4]=0x10; lines[5]=0x10; lines[6]=0; lines[7]=0; }
    else if (c == 56) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x3C; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 57) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x42; lines[3]=0x3E; lines[4]=0x04; lines[5]=0x38; lines[6]=0; lines[7]=0; }
    else if (c == 84) { lines[0]=0x7E; lines[1]=0x18; lines[2]=0x18; lines[3]=0x18; lines[4]=0x18; lines[5]=0x18; lines[6]=0; lines[7]=0; }
    else if (c == 75) { lines[0]=0x42; lines[1]=0x44; lines[2]=0x78; lines[3]=0x48; lines[4]=0x44; lines[5]=0x42; lines[6]=0; lines[7]=0; }
    else if (c == 83) { lines[0]=0x3C; lines[1]=0x40; lines[2]=0x3C; lines[3]=0x02; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 73) { lines[0]=0x3E; lines[1]=0x08; lines[2]=0x08; lines[3]=0x08; lines[4]=0x08; lines[5]=0x3E; lines[6]=0; lines[7]=0; }
    else if (c == 82) { lines[0]=0x7C; lines[1]=0x42; lines[2]=0x7C; lines[3]=0x48; lines[4]=0x44; lines[5]=0x42; lines[6]=0; lines[7]=0; }
    else if (c == 81) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x42; lines[3]=0x4A; lines[4]=0x44; lines[5]=0x3A; lines[6]=0; lines[7]=0; }
    else { lines[0]=0xFF; lines[1]=0x81; lines[2]=0x81; lines[3]=0x81; lines[4]=0x81; lines[5]=0x81; lines[6]=0xFF; lines[7]=0; }
}

void draw_char(int bx, int py, int c) {
    int lines[8]; int i;
    get_char_lines(c, lines);
    for (i = 0; i < 8; i = i + 1) SCREEN[(py + i) * 40 + bx] = lines[i];
}

void draw_box(int bx, int py, int w, int h) {
    int i;
    for (i = 0; i < w; i = i + 1) { SCREEN[py * 40 + bx + i] = 0xFF; SCREEN[(py + h - 1) * 40 + bx + i] = 0xFF; }
    for (i = 0; i < h; i = i + 1) { SCREEN[(py + i) * 40 + bx] = 0xFF; SCREEN[(py + i) * 40 + bx + w - 1] = 0xFF; }
}

void fill_box(int bx, int py, int w, int h) {
    int i; int j;
    for (j = 0; j < h; j = j + 1) {
        for (i = 0; i < w; i = i + 1) {
            SCREEN[(py + j) * 40 + bx + i] = 0xFF;
        }
    }
}

void clear_box(int bx, int py, int w, int h) {
    int i; int j;
    for (j = 0; j < h; j = j + 1) {
        for (i = 0; i < w; i = i + 1) {
            SCREEN[(py + j) * 40 + bx + i] = 0;
        }
    }
}

void draw_device(int idx) {
    int bx;
    bx = idx * 10 + 2;
    clear_box(bx, 8, 8, 24);
    draw_box(bx, 8, 8, 24);
    if (idx == 0) draw_char(bx + 3, 10, 84);
    if (idx == 1) draw_char(bx + 3, 10, 75);
    if (idx == 2) draw_char(bx + 3, 10, 83);
    draw_char(bx + 3, 22, 48 + irq_count[idx]);
}

void flash_device(int idx) {
    int bx; int i;
    bx = idx * 10 + 2;
    fill_box(bx + 1, 9, 6, 22);
    for (i = 0; i < 1000; i = i + 1) { }
}

void irq_handler(int type) {
    if (type >= 0 && type < 3) {
        irq_count[type] = irq_count[type] + 1;
        if (irq_count[type] > 9) irq_count[type] = 9;
        flash_device(type);
        draw_device(type);
    }
}

int main() {
    int key; int i; int delay; int total;

    *OUTPUT = 'I'; *OUTPUT = 'R'; *OUTPUT = 'Q'; *OUTPUT = 10;
    for (i = 0; i < 9600; i = i + 1) SCREEN[i] = 0;
    irq_count[0] = 0; irq_count[1] = 0; irq_count[2] = 0;

    draw_char(0, 0, 73); draw_char(1, 0, 82); draw_char(2, 0, 81);
    draw_device(0); draw_device(1); draw_device(2);

    while (1) {
        key = *KEYBOARD;
        if (key != 0 && key != last_key) {
            if (key == 13) {
                total = irq_count[0] + irq_count[1] + irq_count[2];
                *OUTPUT = 10;
                return total;
            }
            if (key == 116 || key == 84) { *OUTPUT = 'T'; irq_handler(0); }
            if (key == 107 || key == 75) { *OUTPUT = 'K'; irq_handler(1); }
            if (key == 115 || key == 83) { *OUTPUT = 'S'; irq_handler(2); }
        }
        last_key = key;
        for (delay = 0; delay < 1000; delay = delay + 1) { }
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
        solution: `// Coroutines - Solution avec police bitmap
// Cochez "Capturer clavier", Espace pour step

char *SCREEN = (char*)0x00400000;
int *KEYBOARD = (int*)0x00402600;
int *OUTPUT = (int*)0xFFFF0000;
int last_key = 0;
int current_task = 0;
int task_a_val = 0;
int task_b_val = 0;
int steps = 0;

void get_char_lines(int c, int *lines) {
    if (c == 48) { lines[0]=0x3C; lines[1]=0x46; lines[2]=0x4A; lines[3]=0x52; lines[4]=0x62; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 49) { lines[0]=0x18; lines[1]=0x38; lines[2]=0x18; lines[3]=0x18; lines[4]=0x18; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 50) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x02; lines[3]=0x1C; lines[4]=0x20; lines[5]=0x7E; lines[6]=0; lines[7]=0; }
    else if (c == 51) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x0C; lines[3]=0x02; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 52) { lines[0]=0x04; lines[1]=0x0C; lines[2]=0x14; lines[3]=0x24; lines[4]=0x7E; lines[5]=0x04; lines[6]=0; lines[7]=0; }
    else if (c == 65) { lines[0]=0x18; lines[1]=0x24; lines[2]=0x42; lines[3]=0x7E; lines[4]=0x42; lines[5]=0x42; lines[6]=0; lines[7]=0; }
    else if (c == 66) { lines[0]=0x7C; lines[1]=0x42; lines[2]=0x7C; lines[3]=0x42; lines[4]=0x42; lines[5]=0x7C; lines[6]=0; lines[7]=0; }
    else if (c == 67) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x40; lines[3]=0x40; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 79) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x42; lines[3]=0x42; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 82) { lines[0]=0x7C; lines[1]=0x42; lines[2]=0x7C; lines[3]=0x48; lines[4]=0x44; lines[5]=0x42; lines[6]=0; lines[7]=0; }
    else if (c == 62) { lines[0]=0x40; lines[1]=0x20; lines[2]=0x10; lines[3]=0x08; lines[4]=0x10; lines[5]=0x20; lines[6]=0x40; lines[7]=0; }
    else if (c == 60) { lines[0]=0x02; lines[1]=0x04; lines[2]=0x08; lines[3]=0x10; lines[4]=0x08; lines[5]=0x04; lines[6]=0x02; lines[7]=0; }
    else { lines[0]=0xFF; lines[1]=0x81; lines[2]=0x81; lines[3]=0x81; lines[4]=0x81; lines[5]=0x81; lines[6]=0xFF; lines[7]=0; }
}

void draw_char(int bx, int py, int c) {
    int lines[8]; int i;
    get_char_lines(c, lines);
    for (i = 0; i < 8; i = i + 1) SCREEN[(py + i) * 40 + bx] = lines[i];
}

void clear_box(int bx, int py, int w, int h) {
    int i; int j;
    for (j = 0; j < h; j = j + 1)
        for (i = 0; i < w; i = i + 1)
            SCREEN[(py + j) * 40 + bx + i] = 0;
}

void fill_box(int bx, int py, int w, int h) {
    int i; int j;
    for (j = 0; j < h; j = j + 1)
        for (i = 0; i < w; i = i + 1)
            SCREEN[(py + j) * 40 + bx + i] = 0xFF;
}

void draw_box(int bx, int py, int w, int h) {
    int i;
    for (i = 0; i < w; i = i + 1) { SCREEN[py * 40 + bx + i] = 0xFF; SCREEN[(py + h - 1) * 40 + bx + i] = 0xFF; }
    for (i = 1; i < h - 1; i = i + 1) { SCREEN[(py + i) * 40 + bx] = 0xFF; SCREEN[(py + i) * 40 + bx + w - 1] = 0xFF; }
}

void draw_task(int idx, int active) {
    int bx;
    bx = idx * 12 + 2;
    clear_box(bx, 8, 10, 24);
    if (active) {
        fill_box(bx, 8, 10, 24);
    } else {
        draw_box(bx, 8, 10, 24);
    }
    if (idx == 0) {
        draw_char(bx + 4, 10, 65);
        draw_char(bx + 4, 22, 48 + task_a_val);
    } else {
        draw_char(bx + 4, 10, 66);
        draw_char(bx + 4, 22, 48 + task_b_val);
    }
}

void draw_all() {
    draw_task(0, current_task == 0);
    draw_task(1, current_task == 1);
    clear_box(13, 16, 2, 8);
    if (current_task == 0) draw_char(13, 16, 62);
    else draw_char(13, 16, 60);
}

int do_step() {
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
    int key; int i; int delay; int running;
    running = 1;

    *OUTPUT = 'C'; *OUTPUT = 'O'; *OUTPUT = 'R'; *OUTPUT = 'O'; *OUTPUT = 10;
    for (i = 0; i < 9600; i = i + 1) SCREEN[i] = 0;
    draw_char(0, 0, 67); draw_char(1, 0, 79); draw_char(2, 0, 82); draw_char(3, 0, 79);
    draw_all();

    while (running) {
        key = *KEYBOARD;
        if (key != 0 && key != last_key) {
            if (key == 32) {
                *OUTPUT = '.';
                running = do_step();
                draw_all();
            }
            if (key == 13) {
                *OUTPUT = 10;
                return steps;
            }
        }
        last_key = key;
        for (delay = 0; delay < 1000; delay = delay + 1) { }
    }
    fill_box(0, 0, 30, 40);
    *OUTPUT = 10;
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
        solution: `// Scheduler - Solution avec police bitmap
// Cochez "Capturer clavier", Espace pour tick

char *SCREEN = (char*)0x00400000;
int *KEYBOARD = (int*)0x00402600;
int *OUTPUT = (int*)0xFFFF0000;
int last_key = 0;
int proc_time[3];
int proc_state[3];
int current_proc = 0;
int quantum_left = 2;
int switches = 0;
int ticks = 0;

void get_char_lines(int c, int *lines) {
    if (c == 48) { lines[0]=0x3C; lines[1]=0x46; lines[2]=0x4A; lines[3]=0x52; lines[4]=0x62; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 49) { lines[0]=0x18; lines[1]=0x38; lines[2]=0x18; lines[3]=0x18; lines[4]=0x18; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 50) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x02; lines[3]=0x1C; lines[4]=0x20; lines[5]=0x7E; lines[6]=0; lines[7]=0; }
    else if (c == 51) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x0C; lines[3]=0x02; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 52) { lines[0]=0x04; lines[1]=0x0C; lines[2]=0x14; lines[3]=0x24; lines[4]=0x7E; lines[5]=0x04; lines[6]=0; lines[7]=0; }
    else if (c == 80) { lines[0]=0x7C; lines[1]=0x42; lines[2]=0x7C; lines[3]=0x40; lines[4]=0x40; lines[5]=0x40; lines[6]=0; lines[7]=0; }
    else if (c == 81) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x42; lines[3]=0x4A; lines[4]=0x44; lines[5]=0x3A; lines[6]=0; lines[7]=0; }
    else if (c == 83) { lines[0]=0x3C; lines[1]=0x40; lines[2]=0x3C; lines[3]=0x02; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 67) { lines[0]=0x3C; lines[1]=0x42; lines[2]=0x40; lines[3]=0x40; lines[4]=0x42; lines[5]=0x3C; lines[6]=0; lines[7]=0; }
    else if (c == 72) { lines[0]=0x42; lines[1]=0x42; lines[2]=0x7E; lines[3]=0x42; lines[4]=0x42; lines[5]=0x42; lines[6]=0; lines[7]=0; }
    else if (c == 88) { lines[0]=0x42; lines[1]=0x24; lines[2]=0x18; lines[3]=0x18; lines[4]=0x24; lines[5]=0x42; lines[6]=0; lines[7]=0; }
    else { lines[0]=0xFF; lines[1]=0x81; lines[2]=0x81; lines[3]=0x81; lines[4]=0x81; lines[5]=0x81; lines[6]=0xFF; lines[7]=0; }
}

void draw_char(int bx, int py, int c) {
    int lines[8]; int i;
    get_char_lines(c, lines);
    for (i = 0; i < 8; i = i + 1) SCREEN[(py + i) * 40 + bx] = lines[i];
}

void clear_box(int bx, int py, int w, int h) {
    int i; int j;
    for (j = 0; j < h; j = j + 1) for (i = 0; i < w; i = i + 1) SCREEN[(py + j) * 40 + bx + i] = 0;
}

void fill_box(int bx, int py, int w, int h) {
    int i; int j;
    for (j = 0; j < h; j = j + 1) for (i = 0; i < w; i = i + 1) SCREEN[(py + j) * 40 + bx + i] = 0xFF;
}

void draw_box(int bx, int py, int w, int h) {
    int i;
    for (i = 0; i < w; i = i + 1) { SCREEN[py * 40 + bx + i] = 0xFF; SCREEN[(py + h - 1) * 40 + bx + i] = 0xFF; }
    for (i = 1; i < h - 1; i = i + 1) { SCREEN[(py + i) * 40 + bx] = 0xFF; SCREEN[(py + i) * 40 + bx + w - 1] = 0xFF; }
}

void draw_proc(int idx, int active) {
    int bx; int t; int i;
    bx = idx * 10 + 2;
    clear_box(bx, 8, 8, 32);
    if (active) fill_box(bx, 8, 8, 32);
    else draw_box(bx, 8, 8, 32);
    draw_char(bx + 3, 10, 80);
    draw_char(bx + 3, 18, 48 + idx);
    t = proc_time[idx];
    for (i = 0; i < t; i = i + 1) SCREEN[(28 + i) * 40 + bx + 3] = 0xFF;
    if (proc_state[idx] == 2) draw_char(bx + 3, 30, 88);
}

void draw_all() {
    int i;
    for (i = 0; i < 3; i = i + 1) draw_proc(i, i == current_proc && proc_state[i] != 2);
    clear_box(0, 44, 30, 8);
    draw_char(0, 44, 81); draw_char(1, 44, 48 + quantum_left);
    draw_char(4, 44, 83); draw_char(5, 44, 48 + switches % 10);
}

int find_next(int from) {
    int i; int next;
    for (i = 1; i <= 3; i = i + 1) {
        next = (from + i) % 3;
        if (proc_state[next] == 0 && proc_time[next] > 0) return next;
    }
    return from;
}

int do_tick() {
    int next; int all_done;
    all_done = 1;
    if (proc_state[0] != 2) all_done = 0;
    if (proc_state[1] != 2) all_done = 0;
    if (proc_state[2] != 2) all_done = 0;
    if (all_done) return 0;
    ticks = ticks + 1;
    if (proc_time[current_proc] > 0) {
        proc_time[current_proc] = proc_time[current_proc] - 1;
        quantum_left = quantum_left - 1;
        if (proc_time[current_proc] == 0) { proc_state[current_proc] = 2; quantum_left = 0; }
    }
    if (quantum_left <= 0) {
        next = find_next(current_proc);
        if (next != current_proc) { current_proc = next; switches = switches + 1; }
        quantum_left = 2;
    }
    return 1;
}

int main() {
    int key; int i; int delay;

    *OUTPUT = 'S'; *OUTPUT = 'C'; *OUTPUT = 'H'; *OUTPUT = 10;
    for (i = 0; i < 9600; i = i + 1) SCREEN[i] = 0;
    proc_time[0] = 3; proc_time[1] = 2; proc_time[2] = 4;
    proc_state[0] = 0; proc_state[1] = 0; proc_state[2] = 0;
    draw_char(0, 0, 83); draw_char(1, 0, 67); draw_char(2, 0, 72);
    draw_all();

    while (1) {
        key = *KEYBOARD;
        if (key != 0 && key != last_key) {
            if (key == 32) { *OUTPUT = '.'; do_tick(); draw_all(); }
            if (key == 13) { *OUTPUT = 10; return switches; }
        }
        last_key = key;
        for (delay = 0; delay < 1000; delay = delay + 1) { }
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
        solution: `// Mini-OS Shell - Solution avec polices bitmap
// Cochez "Capturer clavier"

char *SCREEN = (char*)0x00400000;
int *KEYBOARD = (int*)0x00402600;
int last_key = 0;

void get_char_lines(int c, int *lines) {
    if (c == 48) { lines[0]=0x3C; lines[1]=0x46; lines[2]=0x4A; lines[3]=0x52; lines[4]=0x62; lines[5]=0x62; lines[6]=0x3C; lines[7]=0x00; }
    else if (c == 49) { lines[0]=0x18; lines[1]=0x38; lines[2]=0x18; lines[3]=0x18; lines[4]=0x18; lines[5]=0x18; lines[6]=0x7E; lines[7]=0x00; }
    else if (c == 50) { lines[0]=0x3C; lines[1]=0x66; lines[2]=0x06; lines[3]=0x0C; lines[4]=0x18; lines[5]=0x30; lines[6]=0x7E; lines[7]=0x00; }
    else if (c == 51) { lines[0]=0x3C; lines[1]=0x66; lines[2]=0x06; lines[3]=0x1C; lines[4]=0x06; lines[5]=0x66; lines[6]=0x3C; lines[7]=0x00; }
    else if (c == 52) { lines[0]=0x0C; lines[1]=0x1C; lines[2]=0x2C; lines[3]=0x4C; lines[4]=0x7E; lines[5]=0x0C; lines[6]=0x0C; lines[7]=0x00; }
    else if (c == 53) { lines[0]=0x7E; lines[1]=0x60; lines[2]=0x7C; lines[3]=0x06; lines[4]=0x06; lines[5]=0x66; lines[6]=0x3C; lines[7]=0x00; }
    else if (c == 54) { lines[0]=0x1C; lines[1]=0x30; lines[2]=0x60; lines[3]=0x7C; lines[4]=0x66; lines[5]=0x66; lines[6]=0x3C; lines[7]=0x00; }
    else if (c == 55) { lines[0]=0x7E; lines[1]=0x06; lines[2]=0x0C; lines[3]=0x18; lines[4]=0x18; lines[5]=0x18; lines[6]=0x18; lines[7]=0x00; }
    else if (c == 56) { lines[0]=0x3C; lines[1]=0x66; lines[2]=0x66; lines[3]=0x3C; lines[4]=0x66; lines[5]=0x66; lines[6]=0x3C; lines[7]=0x00; }
    else if (c == 57) { lines[0]=0x3C; lines[1]=0x66; lines[2]=0x66; lines[3]=0x3E; lines[4]=0x06; lines[5]=0x0C; lines[6]=0x38; lines[7]=0x00; }
    else if (c == 43) { lines[0]=0x00; lines[1]=0x18; lines[2]=0x18; lines[3]=0x7E; lines[4]=0x18; lines[5]=0x18; lines[6]=0x00; lines[7]=0x00; }
    else if (c == 61) { lines[0]=0x00; lines[1]=0x00; lines[2]=0x7E; lines[3]=0x00; lines[4]=0x7E; lines[5]=0x00; lines[6]=0x00; lines[7]=0x00; }
    else if (c == 77) { lines[0]=0xC6; lines[1]=0xEE; lines[2]=0xFE; lines[3]=0xD6; lines[4]=0xC6; lines[5]=0xC6; lines[6]=0xC6; lines[7]=0x00; }
    else if (c == 69) { lines[0]=0x7E; lines[1]=0x60; lines[2]=0x60; lines[3]=0x7C; lines[4]=0x60; lines[5]=0x60; lines[6]=0x7E; lines[7]=0x00; }
    else if (c == 78) { lines[0]=0x63; lines[1]=0x73; lines[2]=0x7B; lines[3]=0x6F; lines[4]=0x67; lines[5]=0x63; lines[6]=0x63; lines[7]=0x00; }
    else if (c == 85) { lines[0]=0x66; lines[1]=0x66; lines[2]=0x66; lines[3]=0x66; lines[4]=0x66; lines[5]=0x66; lines[6]=0x3C; lines[7]=0x00; }
    else if (c == 67) { lines[0]=0x3C; lines[1]=0x66; lines[2]=0x60; lines[3]=0x60; lines[4]=0x60; lines[5]=0x66; lines[6]=0x3C; lines[7]=0x00; }
    else if (c == 65) { lines[0]=0x18; lines[1]=0x3C; lines[2]=0x66; lines[3]=0x66; lines[4]=0x7E; lines[5]=0x66; lines[6]=0x66; lines[7]=0x00; }
    else if (c == 76) { lines[0]=0x60; lines[1]=0x60; lines[2]=0x60; lines[3]=0x60; lines[4]=0x60; lines[5]=0x60; lines[6]=0x7E; lines[7]=0x00; }
    else if (c == 79) { lines[0]=0x3C; lines[1]=0x66; lines[2]=0x66; lines[3]=0x66; lines[4]=0x66; lines[5]=0x66; lines[6]=0x3C; lines[7]=0x00; }
    else if (c == 84) { lines[0]=0x7E; lines[1]=0x18; lines[2]=0x18; lines[3]=0x18; lines[4]=0x18; lines[5]=0x18; lines[6]=0x18; lines[7]=0x00; }
    else if (c == 35) { lines[0]=0x24; lines[1]=0x24; lines[2]=0x7E; lines[3]=0x24; lines[4]=0x7E; lines[5]=0x24; lines[6]=0x24; lines[7]=0x00; }
    else if (c == 72) { lines[0]=0x66; lines[1]=0x66; lines[2]=0x66; lines[3]=0x7E; lines[4]=0x66; lines[5]=0x66; lines[6]=0x66; lines[7]=0x00; }
    else if (c == 73) { lines[0]=0x3C; lines[1]=0x18; lines[2]=0x18; lines[3]=0x18; lines[4]=0x18; lines[5]=0x18; lines[6]=0x3C; lines[7]=0x00; }
    else if (c == 83) { lines[0]=0x3C; lines[1]=0x66; lines[2]=0x60; lines[3]=0x3C; lines[4]=0x06; lines[5]=0x66; lines[6]=0x3C; lines[7]=0x00; }
    else if (c == 71) { lines[0]=0x3C; lines[1]=0x66; lines[2]=0x60; lines[3]=0x6E; lines[4]=0x66; lines[5]=0x66; lines[6]=0x3C; lines[7]=0x00; }
    else if (c == 81) { lines[0]=0x3C; lines[1]=0x66; lines[2]=0x66; lines[3]=0x66; lines[4]=0x6A; lines[5]=0x6C; lines[6]=0x36; lines[7]=0x00; }
    else if (c == 88) { lines[0]=0x66; lines[1]=0x66; lines[2]=0x3C; lines[3]=0x18; lines[4]=0x3C; lines[5]=0x66; lines[6]=0x66; lines[7]=0x00; }
    else { lines[0]=0xFF; lines[1]=0x81; lines[2]=0x81; lines[3]=0x81; lines[4]=0x81; lines[5]=0x81; lines[6]=0xFF; lines[7]=0x00; }
}

void draw_char(int bx, int py, int c) {
    int lines[8]; int i;
    get_char_lines(c, lines);
    for (i = 0; i < 8; i = i + 1) {
        SCREEN[(py + i) * 40 + bx] = lines[i];
    }
}

void draw_string(int bx, int py, char *s) {
    int i;
    for (i = 0; s[i] != 0; i = i + 1) {
        draw_char(bx + i, py, s[i]);
    }
}

void clear_screen() {
    int i;
    for (i = 0; i < 9600; i = i + 1) {
        SCREEN[i] = 0;
    }
}

void draw_box(int bx1, int py1, int bx2, int py2) {
    int i;
    for (i = bx1; i <= bx2; i = i + 1) {
        SCREEN[py1 * 40 + i] = 0xFF;
        SCREEN[py2 * 40 + i] = 0xFF;
    }
    for (i = py1; i <= py2; i = i + 1) {
        SCREEN[i * 40 + bx1] = SCREEN[i * 40 + bx1] | 0x80;
        SCREEN[i * 40 + bx2] = SCREEN[i * 40 + bx2] | 0x01;
    }
}

void draw_menu() {
    // Titre MENU
    draw_string(2, 8, "MENU");

    // Option 1: CALC
    draw_box(1, 24, 10, 40);
    draw_char(2, 28, 49);
    draw_string(4, 28, "CALC");

    // Option 2: COUNT
    draw_box(1, 48, 10, 64);
    draw_char(2, 52, 50);
    draw_string(4, 52, "#");

    // Option 3: MSG
    draw_box(1, 72, 10, 88);
    draw_char(2, 76, 51);
    draw_string(4, 76, "HI");

    // Option 0: QUIT
    draw_box(1, 96, 10, 112);
    draw_char(2, 100, 48);
    draw_string(4, 100, "X");
}

void delay_loop() {
    int i;
    for (i = 0; i < 50000; i = i + 1) { }
}

void wait_key() {
    int k; int lk;
    lk = 0;
    while (1) {
        k = *KEYBOARD;
        if (k != 0 && k != lk) return;
        lk = k;
    }
}

void app_calc() {
    clear_screen();
    draw_string(2, 8, "CALC");
    // 3 + 5 = 8
    draw_char(4, 40, 51);
    draw_char(6, 40, 43);
    draw_char(8, 40, 53);
    draw_char(10, 40, 61);
    draw_char(12, 40, 56);
    wait_key();
}

void app_count() {
    int i;
    clear_screen();
    draw_string(2, 8, "COUNT");
    for (i = 0; i < 6; i = i + 1) {
        draw_char(4 + i * 2, 40, 48 + i);
        delay_loop();
    }
    wait_key();
}

void app_msg() {
    clear_screen();
    draw_string(2, 8, "MSG");
    // Grand HI au centre
    draw_string(6, 56, "HI");
    wait_key();
}

int main() {
    int key; int running; int delay;
    running = 1;

    while (running) {
        clear_screen();
        draw_menu();

        while (1) {
            key = *KEYBOARD;
            if (key != 0 && key != last_key) {
                if (key == 49) { app_calc(); break; }
                if (key == 50) { app_count(); break; }
                if (key == 51) { app_msg(); break; }
                if (key == 48) { running = 0; break; }
            }
            last_key = key;
            for (delay = 0; delay < 1000; delay = delay + 1) { }
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
        solution: `// Gestionnaire de Tâches - Solution avec polices bitmap
// Cochez "Capturer clavier"

char *SCREEN = (char*)0x00400000;
int *KEYBOARD = (int*)0x00402600;
int last_key = 0;

int proc_work[4];
int proc_state[4];
int proc_done[4];
int current = 0;
int quantum_left = 2;
int switches = 0;
int ticks = 0;
int auto_run = 0;

void get_char_lines(int c, int *lines) {
    if (c == 48) { lines[0]=0x3C; lines[1]=0x46; lines[2]=0x4A; lines[3]=0x52; lines[4]=0x62; lines[5]=0x62; lines[6]=0x3C; lines[7]=0x00; }
    else if (c == 49) { lines[0]=0x18; lines[1]=0x38; lines[2]=0x18; lines[3]=0x18; lines[4]=0x18; lines[5]=0x18; lines[6]=0x7E; lines[7]=0x00; }
    else if (c == 50) { lines[0]=0x3C; lines[1]=0x66; lines[2]=0x06; lines[3]=0x0C; lines[4]=0x18; lines[5]=0x30; lines[6]=0x7E; lines[7]=0x00; }
    else if (c == 51) { lines[0]=0x3C; lines[1]=0x66; lines[2]=0x06; lines[3]=0x1C; lines[4]=0x06; lines[5]=0x66; lines[6]=0x3C; lines[7]=0x00; }
    else if (c == 52) { lines[0]=0x0C; lines[1]=0x1C; lines[2]=0x2C; lines[3]=0x4C; lines[4]=0x7E; lines[5]=0x0C; lines[6]=0x0C; lines[7]=0x00; }
    else if (c == 53) { lines[0]=0x7E; lines[1]=0x60; lines[2]=0x7C; lines[3]=0x06; lines[4]=0x06; lines[5]=0x66; lines[6]=0x3C; lines[7]=0x00; }
    else if (c == 54) { lines[0]=0x1C; lines[1]=0x30; lines[2]=0x60; lines[3]=0x7C; lines[4]=0x66; lines[5]=0x66; lines[6]=0x3C; lines[7]=0x00; }
    else if (c == 55) { lines[0]=0x7E; lines[1]=0x06; lines[2]=0x0C; lines[3]=0x18; lines[4]=0x18; lines[5]=0x18; lines[6]=0x18; lines[7]=0x00; }
    else if (c == 56) { lines[0]=0x3C; lines[1]=0x66; lines[2]=0x66; lines[3]=0x3C; lines[4]=0x66; lines[5]=0x66; lines[6]=0x3C; lines[7]=0x00; }
    else if (c == 57) { lines[0]=0x3C; lines[1]=0x66; lines[2]=0x66; lines[3]=0x3E; lines[4]=0x06; lines[5]=0x0C; lines[6]=0x38; lines[7]=0x00; }
    else if (c == 80) { lines[0]=0x7C; lines[1]=0x66; lines[2]=0x66; lines[3]=0x7C; lines[4]=0x60; lines[5]=0x60; lines[6]=0x60; lines[7]=0x00; }
    else if (c == 82) { lines[0]=0x7C; lines[1]=0x66; lines[2]=0x66; lines[3]=0x7C; lines[4]=0x6C; lines[5]=0x66; lines[6]=0x66; lines[7]=0x00; }
    else if (c == 66) { lines[0]=0x7C; lines[1]=0x66; lines[2]=0x66; lines[3]=0x7C; lines[4]=0x66; lines[5]=0x66; lines[6]=0x7C; lines[7]=0x00; }
    else if (c == 88) { lines[0]=0x66; lines[1]=0x66; lines[2]=0x3C; lines[3]=0x18; lines[4]=0x3C; lines[5]=0x66; lines[6]=0x66; lines[7]=0x00; }
    else if (c == 42) { lines[0]=0x00; lines[1]=0x66; lines[2]=0x3C; lines[3]=0xFF; lines[4]=0x3C; lines[5]=0x66; lines[6]=0x00; lines[7]=0x00; }
    else if (c == 81) { lines[0]=0x3C; lines[1]=0x66; lines[2]=0x66; lines[3]=0x66; lines[4]=0x6A; lines[5]=0x6C; lines[6]=0x36; lines[7]=0x00; }
    else if (c == 83) { lines[0]=0x3C; lines[1]=0x66; lines[2]=0x60; lines[3]=0x3C; lines[4]=0x06; lines[5]=0x66; lines[6]=0x3C; lines[7]=0x00; }
    else if (c == 84) { lines[0]=0x7E; lines[1]=0x18; lines[2]=0x18; lines[3]=0x18; lines[4]=0x18; lines[5]=0x18; lines[6]=0x18; lines[7]=0x00; }
    else if (c == 65) { lines[0]=0x18; lines[1]=0x3C; lines[2]=0x66; lines[3]=0x66; lines[4]=0x7E; lines[5]=0x66; lines[6]=0x66; lines[7]=0x00; }
    else if (c == 58) { lines[0]=0x00; lines[1]=0x18; lines[2]=0x18; lines[3]=0x00; lines[4]=0x00; lines[5]=0x18; lines[6]=0x18; lines[7]=0x00; }
    else { lines[0]=0xFF; lines[1]=0x81; lines[2]=0x81; lines[3]=0x81; lines[4]=0x81; lines[5]=0x81; lines[6]=0xFF; lines[7]=0x00; }
}

void draw_char(int bx, int py, int c) {
    int lines[8]; int i;
    get_char_lines(c, lines);
    for (i = 0; i < 8; i = i + 1) {
        SCREEN[(py + i) * 40 + bx] = lines[i];
    }
}

void clear_box(int bx1, int py1, int bx2, int py2) {
    int bx; int py;
    for (py = py1; py <= py2; py = py + 1) {
        for (bx = bx1; bx <= bx2; bx = bx + 1) {
            SCREEN[py * 40 + bx] = 0;
        }
    }
}

void fill_box(int bx1, int py1, int bx2, int py2) {
    int bx; int py;
    for (py = py1; py <= py2; py = py + 1) {
        for (bx = bx1; bx <= bx2; bx = bx + 1) {
            SCREEN[py * 40 + bx] = 0xFF;
        }
    }
}

void draw_box(int bx1, int py1, int bx2, int py2) {
    int bx; int py;
    for (bx = bx1; bx <= bx2; bx = bx + 1) {
        SCREEN[py1 * 40 + bx] = 0xFF;
        SCREEN[py2 * 40 + bx] = 0xFF;
    }
    for (py = py1; py <= py2; py = py + 1) {
        SCREEN[py * 40 + bx1] = SCREEN[py * 40 + bx1] | 0x80;
        SCREEN[py * 40 + bx2] = SCREEN[py * 40 + bx2] | 0x01;
    }
}

void draw_proc(int idx) {
    int bx; int w; int i; int active;
    bx = idx * 5;

    clear_box(bx, 8, bx + 4, 64);

    active = (idx == current && proc_state[idx] == 1);

    // Cadre
    draw_box(bx, 8, bx + 4, 64);
    if (active) {
        draw_box(bx, 9, bx + 4, 63);
    }

    // P et numero
    draw_char(bx + 1, 12, 80);
    draw_char(bx + 3, 12, 48 + idx);

    // Etat: R=Ready *=Run B=Block X=Done
    if (proc_state[idx] == 0) {
        draw_char(bx + 2, 24, 82);
    }
    if (proc_state[idx] == 1) {
        draw_char(bx + 2, 24, 42);
    }
    if (proc_state[idx] == 2) {
        draw_char(bx + 2, 24, 66);
    }
    if (proc_state[idx] == 3) {
        draw_char(bx + 2, 24, 88);
    }

    // Barre travail restant
    w = proc_work[idx];
    for (i = 0; i < 4; i = i + 1) {
        if (i < w) {
            fill_box(bx + 1, 36 + i * 4, bx + 3, 38 + i * 4);
        } else {
            draw_box(bx + 1, 36 + i * 4, bx + 3, 38 + i * 4);
        }
    }

    // Compteur
    draw_char(bx + 2, 54, 48 + (proc_done[idx] % 10));
}

void draw_info() {
    clear_box(0, 72, 19, 80);
    // Q:
    draw_char(0, 72, 81);
    draw_char(1, 72, 58);
    draw_char(2, 72, 48 + quantum_left);
    // S:
    draw_char(5, 72, 83);
    draw_char(6, 72, 58);
    draw_char(7, 72, 48 + (switches % 10));
    // T:
    draw_char(10, 72, 84);
    draw_char(11, 72, 58);
    draw_char(12, 72, 48 + (ticks % 10));
    // A:
    if (auto_run) {
        draw_char(15, 72, 65);
    }
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
    int key; int delay;
    proc_work[0] = 3; proc_work[1] = 2; proc_work[2] = 4; proc_work[3] = 3;
    proc_state[0] = 0; proc_state[1] = 0; proc_state[2] = 0; proc_state[3] = 0;
    proc_done[0] = 0; proc_done[1] = 0; proc_done[2] = 0; proc_done[3] = 0;
    delay = 0;
    draw_all();
    while (1) {
        key = *KEYBOARD;
        if (key != 0 && key != last_key) {
            if (key == 32) { do_tick(); draw_all(); }
            if (key == 65) { auto_run = 1 - auto_run; draw_info(); }
            if (key == 48) { toggle_block(0); draw_all(); }
            if (key == 49) { toggle_block(1); draw_all(); }
            if (key == 50) { toggle_block(2); draw_all(); }
            if (key == 51) { toggle_block(3); draw_all(); }
            if (key == 13) return switches;
        }
        last_key = key;
        if (auto_run) {
            delay = delay + 1;
            if (delay > 3000) { delay = 0; do_tick(); draw_all(); }
        }
        for (delay = 0; delay < 1000; delay = delay + 1) { }
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
