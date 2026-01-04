# Chapitre 1 : Programmation Bare Metal

## Objectif

Écrire du code qui s'exécute directement sur le matériel, sans OS.

## Qu'est-ce que le Bare Metal ?

```
┌─────────────────────────────────────────────┐
│           Application normale               │
├─────────────────────────────────────────────┤
│           Système d'exploitation            │
├─────────────────────────────────────────────┤
│               Matériel                      │
└─────────────────────────────────────────────┘

                    vs.

┌─────────────────────────────────────────────┐
│           Programme Bare Metal              │
├─────────────────────────────────────────────┤
│               Matériel                      │
└─────────────────────────────────────────────┘
```

En bare metal :
- Pas de malloc/free → vous gérez la mémoire
- Pas de printf → vous parlez directement au matériel
- Pas de fichiers → juste des adresses mémoire
- Pas de multitâche → un seul programme

## La carte mémoire A32

```
0x00000000 ┌────────────────────────┐
           │       Code (ROM)       │
0x00100000 ├────────────────────────┤
           │        RAM             │
           │   (données, pile)      │
0x00400000 ├────────────────────────┤
           │     Framebuffer        │
           │     (écran 320x240)    │
0x00402600 ├────────────────────────┤
           │      Keyboard          │
0x10000000 ├────────────────────────┤
           │    Port de sortie      │
           │      (texte)           │
           └────────────────────────┘
```

## Premier programme : Hello World

### Le code assembleur minimal

```asm
; boot.a32 - Point d'entrée bare metal

.section .text
.global _start

_start:
    ; Initialise la pile
    LDR SP, =0x00200000     ; Pile en haut de la RAM

    ; Appelle main
    BL main

    ; Boucle infinie (halt)
.halt:
    B .halt

; Affiche un caractère
putchar:
    LDR R1, =0x10000000     ; Adresse du port de sortie
    STR R0, [R1]            ; Écrit le caractère
    MOV PC, LR              ; Retourne
```

### Le code C

```c
// main.c - Hello World bare metal

// Port de sortie texte
#define OUTPUT ((volatile int*)0x10000000)

void putchar(int c) {
    *OUTPUT = c;
}

void print(char *s) {
    while (*s) {
        putchar(*s);
        s++;
    }
}

int main() {
    print("Hello, Bare Metal World!\n");

    // Boucle infinie (pas de return possible)
    while (1) {}

    return 0;
}
```

## Accès au matériel

### Volatile

Le mot-clé `volatile` est crucial :

```c
// FAUX - le compilateur peut optimiser
int *port = (int*)0x10000000;
*port = 'A';
*port = 'B';  // Peut être optimisé en un seul write

// CORRECT - chaque accès est effectué
volatile int *port = (volatile int*)0x10000000;
*port = 'A';  // Garanti
*port = 'B';  // Garanti
```

### Memory-Mapped I/O (MMIO)

Le matériel est accessible comme de la mémoire :

```c
// Définition des registres matériels
#define SCREEN_BASE  ((volatile char*)0x00400000)
#define KEYBOARD     ((volatile int*)0x00402600)
#define OUTPUT       ((volatile int*)0x10000000)

// Lecture du clavier
int key = *KEYBOARD;

// Écriture sur l'écran (pixel 0,0)
SCREEN_BASE[0] = 0x80;  // Premier bit = 1

// Écriture texte
*OUTPUT = 'A';
```

## Structure d'un programme bare metal

```
┌─────────────────────────────────────────────┐
│                  _start                      │
│  • Initialise la pile                       │
│  • Initialise les variables globales         │
│  • Appelle main()                           │
│  • Boucle infinie après main               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│                   main()                     │
│  • Initialise le matériel                   │
│  • Boucle principale                        │
└─────────────────────────────────────────────┘
```

### Code de démarrage complet

```asm
.section .text
.global _start

_start:
    ; === Initialisation de la pile ===
    LDR SP, =_stack_top

    ; === Copie .data de ROM vers RAM ===
    LDR R0, =_data_start      ; Destination (RAM)
    LDR R1, =_data_load       ; Source (ROM)
    LDR R2, =_data_size       ; Taille
.copy_data:
    CMP R2, #0
    BEQ .clear_bss
    LDRB R3, [R1], #1
    STRB R3, [R0], #1
    SUB R2, R2, #1
    B .copy_data

    ; === Initialise .bss à zéro ===
.clear_bss:
    LDR R0, =_bss_start
    LDR R1, =_bss_size
    MOV R2, #0
.zero_bss:
    CMP R1, #0
    BEQ .call_main
    STRB R2, [R0], #1
    SUB R1, R1, #1
    B .zero_bss

    ; === Appelle main ===
.call_main:
    BL main

    ; === Halt ===
.halt:
    B .halt
```

## Sections mémoire

Le linker organise le code en sections :

```
.text    → Code exécutable (ROM)
.rodata  → Constantes, chaînes (ROM)
.data    → Variables initialisées (RAM, copie depuis ROM)
.bss     → Variables non initialisées (RAM, zéro)
```

### Script de linker minimal

```ld
/* link.ld */
ENTRY(_start)

MEMORY {
    ROM (rx)  : ORIGIN = 0x00000000, LENGTH = 1M
    RAM (rwx) : ORIGIN = 0x00100000, LENGTH = 1M
}

SECTIONS {
    .text : {
        *(.text)
    } > ROM

    .rodata : {
        *(.rodata)
    } > ROM

    _data_load = .;

    .data : AT(_data_load) {
        _data_start = .;
        *(.data)
        _data_end = .;
    } > RAM

    _data_size = _data_end - _data_start;

    .bss : {
        _bss_start = .;
        *(.bss)
        *(COMMON)
        _bss_end = .;
    } > RAM

    _bss_size = _bss_end - _bss_start;

    _stack_top = ORIGIN(RAM) + LENGTH(RAM);
}
```

## Exercices

### Exercice 1 : LED clignotante (simulée)

Faites clignoter un pixel à l'écran :

```c
void delay(int n) {
    while (n-- > 0) {}
}

int main() {
    volatile char *screen = (volatile char*)0x00400000;

    while (1) {
        screen[0] = 0x80;    // Allume
        delay(100000);
        screen[0] = 0x00;    // Éteint
        delay(100000);
    }
}
```

### Exercice 2 : Echo clavier

Lisez le clavier et affichez les touches :

```c
int main() {
    volatile int *kbd = (volatile int*)0x00402600;
    volatile int *out = (volatile int*)0x10000000;

    while (1) {
        int key = *kbd;
        if (key != 0) {
            *out = key;
        }
    }
}
```

### Exercice 3 : Compteur

Affichez un compteur incrémental :

```c
void print_int(int n);  // À implémenter

int main() {
    int count = 0;

    while (1) {
        print_int(count);
        print("\n");
        count++;
        delay(500000);
    }
}
```

## Points clés

1. **Pas d'OS** = vous gérez tout
2. **volatile** = obligatoire pour le MMIO
3. **_start** = point d'entrée, pas main
4. **Pile** = doit être initialisée avant tout appel

## Prochaine étape

[Chapitre 2 : Bootstrap →](02_bootstrap.md)
