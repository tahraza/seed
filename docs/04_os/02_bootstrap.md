# Chapitre 2 : Le Bootstrap

## Objectif

Créer un chargeur de démarrage qui initialise le système.

## Séquence de boot

```
┌─────────────────────────────────────────────┐
│ 1. Reset du CPU                             │
│    PC = 0x00000000                          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. Bootstrap (boot.a32)                     │
│    • Initialise les registres               │
│    • Configure la pile                      │
│    • Initialise la mémoire                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. Runtime C (crt0.a32)                     │
│    • Copie .data                            │
│    • Efface .bss                            │
│    • Appelle les constructeurs              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. main()                                   │
│    • Votre code                             │
└─────────────────────────────────────────────┘
```

## Bootstrap minimal

```asm
; boot.a32 - Bootstrap A32

.section .text.boot
.global _start

_start:
    ; ============================================
    ; Phase 1 : Initialisation CPU
    ; ============================================

    ; Désactive les interruptions (si supporté)
    ; Sur A32, pas d'interruptions matérielles

    ; Initialise tous les registres à 0
    MOV R0, #0
    MOV R1, #0
    MOV R2, #0
    MOV R3, #0
    MOV R4, #0
    MOV R5, #0
    MOV R6, #0
    MOV R7, #0
    MOV R8, #0
    MOV R9, #0
    MOV R10, #0
    MOV R11, #0     ; FP
    MOV R12, #0

    ; ============================================
    ; Phase 2 : Initialisation pile
    ; ============================================

    LDR SP, =_stack_top

    ; ============================================
    ; Phase 3 : Initialisation mémoire
    ; ============================================

    BL _init_memory

    ; ============================================
    ; Phase 4 : Appel de main
    ; ============================================

    BL main

    ; ============================================
    ; Phase 5 : Sortie / Halt
    ; ============================================

    ; Si main retourne, on boucle
_halt:
    B _halt


; ============================================
; Initialisation de la mémoire
; ============================================

_init_memory:
    PUSH {R4-R7, LR}

    ; --- Copie .data de ROM vers RAM ---
    LDR R4, =_data_lma      ; Load Memory Address (ROM)
    LDR R5, =_data_vma      ; Virtual Memory Address (RAM)
    LDR R6, =_data_size

.copy_loop:
    CMP R6, #0
    BEQ .copy_done
    LDRB R7, [R4], #1
    STRB R7, [R5], #1
    SUB R6, R6, #1
    B .copy_loop

.copy_done:

    ; --- Efface .bss ---
    LDR R4, =_bss_start
    LDR R5, =_bss_size
    MOV R6, #0

.bss_loop:
    CMP R5, #0
    BEQ .bss_done
    STRB R6, [R4], #1
    SUB R5, R5, #1
    B .bss_loop

.bss_done:
    POP {R4-R7, PC}
```

## Le Runtime C (CRT0)

Le CRT0 (C Runtime Zero) prépare l'environnement pour le C :

```asm
; crt0.a32 - C Runtime

.section .text
.global _crt0_init

_crt0_init:
    PUSH {LR}

    ; Appelle les constructeurs globaux (si utilisés)
    ; LDR R0, =__init_array_start
    ; LDR R1, =__init_array_end
    ; BL _call_init_array

    ; Appelle main avec argc=0, argv=NULL
    MOV R0, #0          ; argc
    MOV R1, #0          ; argv
    BL main

    ; Appelle les destructeurs (si utilisés)
    ; BL _call_fini_array

    ; Retourne le code de sortie de main
    POP {PC}
```

## Variables d'environnement du linker

Le script de linker définit des symboles utilisés par le bootstrap :

```ld
/* Symboles exportés */
_data_lma = LOADADDR(.data);    /* Adresse en ROM */
_data_vma = ADDR(.data);        /* Adresse en RAM */
_data_size = SIZEOF(.data);     /* Taille */

_bss_start = ADDR(.bss);
_bss_size = SIZEOF(.bss);

_stack_top = ORIGIN(RAM) + LENGTH(RAM);
```

Ces symboles sont accessibles en assembleur :

```asm
LDR R0, =_stack_top    ; Charge l'adresse du sommet de pile
```

## Initialisation de la pile

### Structure de la pile

```
    _stack_top →  ┌────────────────────┐
                  │                    │  ← SP après init
                  │     Pile           │
                  │   (grandit vers    │
                  │    le bas)         │
                  │        ↓           │
                  │                    │
                  ├────────────────────┤
                  │     Heap           │
                  │   (grandit vers    │
                  │    le haut)        │
                  │        ↑           │
                  ├────────────────────┤
                  │      .bss          │
                  ├────────────────────┤
                  │      .data         │
    RAM start →   └────────────────────┘
```

### Protection contre le débordement

```c
// Canary de pile (optionnel)
#define STACK_CANARY 0xDEADBEEF

void init_stack_canary() {
    volatile int *bottom = (volatile int*)(_stack_bottom);
    *bottom = STACK_CANARY;
}

void check_stack() {
    volatile int *bottom = (volatile int*)(_stack_bottom);
    if (*bottom != STACK_CANARY) {
        panic("Stack overflow!");
    }
}
```

## Debug du bootstrap

### Indicateur de progression

```asm
_start:
    ; LED/Output pour debug
    LDR R0, =0x10000000
    MOV R1, #'1'
    STR R1, [R0]        ; Affiche '1' = CPU OK

    LDR SP, =_stack_top
    MOV R1, #'2'
    STR R1, [R0]        ; Affiche '2' = Stack OK

    BL _init_memory
    MOV R1, #'3'
    STR R1, [R0]        ; Affiche '3' = Memory OK

    MOV R1, #'\n'
    STR R1, [R0]

    BL main
```

### Vérification de la mémoire

```c
int memory_test() {
    volatile int *ram = (volatile int*)0x00100000;
    int patterns[] = {0x00000000, 0xFFFFFFFF, 0xAAAAAAAA, 0x55555555};

    for (int i = 0; i < 4; i++) {
        *ram = patterns[i];
        if (*ram != patterns[i]) {
            return 0;  // Erreur
        }
    }
    return 1;  // OK
}
```

## Mini-bootloader avec menu

```c
void bootloader() {
    print("A32 Bootloader v1.0\n");
    print("==================\n\n");

    print("1. Boot normal\n");
    print("2. Test memoire\n");
    print("3. Info systeme\n");
    print("\nChoix: ");

    int choice = getchar() - '0';
    print("\n\n");

    switch (choice) {
        case 1:
            print("Demarrage...\n");
            main();
            break;

        case 2:
            print("Test memoire...\n");
            if (memory_test()) {
                print("OK\n");
            } else {
                print("ERREUR\n");
            }
            break;

        case 3:
            print("A32-Lite CPU\n");
            print("RAM: 1 MB\n");
            print("Screen: 320x240\n");
            break;

        default:
            print("Choix invalide\n");
    }

    bootloader();  // Retour au menu
}
```

## Exercices

### Exercice 1 : Compteur de boot

Incrémentez un compteur en RAM à chaque démarrage :

```c
// Le compteur survit aux resets si la RAM n'est pas effacée
volatile int *boot_count = (volatile int*)0x001FFFFC;

void boot() {
    (*boot_count)++;
    print("Boot #");
    print_int(*boot_count);
    print("\n");
}
```

### Exercice 2 : Checksum du code

Vérifiez l'intégrité du code au boot :

```c
int compute_checksum(void *start, int size) {
    unsigned char *p = (unsigned char*)start;
    int sum = 0;
    for (int i = 0; i < size; i++) {
        sum += p[i];
    }
    return sum;
}
```

### Exercice 3 : Splash screen

Affichez un logo au démarrage :

```c
void show_splash() {
    // Dessine un pattern sur l'écran
    volatile char *screen = (volatile char*)0x00400000;

    for (int y = 100; y < 140; y++) {
        for (int x = 120; x < 200; x++) {
            int byte = y * 40 + x / 8;
            int bit = 7 - (x % 8);
            screen[byte] |= (1 << bit);
        }
    }

    delay(1000000);
    clear_screen();
}
```

## Points clés

1. **_start** = premier code exécuté
2. **Ordre** = pile → mémoire → main
3. **Symboles linker** = interface entre asm et C
4. **Debug** = sortie texte à chaque étape

## Prochaine étape

[Chapitre 3 : Allocateur mémoire →](03_allocateur.md)
