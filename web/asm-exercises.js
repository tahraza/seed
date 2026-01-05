// ASM Exercises for nand2tetris-codex
// Each exercise has a template, solution, and test cases
// Available instructions: ADD, SUB, AND, ORR, EOR, MOV, MVN, CMP, TST, LDR, STR, LDRB, STRB, B, BL, NOP, HALT
// Shift modifiers (on last operand): LSL, LSR, ASR, ROR  e.g. ADD R0, R1, R2, LSL #2
//
// MMIO Addresses:
//   0xFFFF0000 - PUTC (write character to console)
//   0xFFFF0004 - GETC (read from input buffer, 0xFFFFFFFF if empty)
//   0xFFFF0010 - EXIT (write to exit with code)
//   0x00402600 - KEYBOARD (real-time key, 0 if none)
//
// Screen: 320x240 pixels, 1 bit per pixel, base address 0x00400000

export const ASM_EXERCISES = {
    // ==================== BASICS ====================
    'asm-hello': {
        id: 'asm-hello',
        name: 'Hello World',
        description: 'Écrire une valeur dans un registre',
        template: `; ============================================
; Exercice: Hello World
; ============================================
; Objectif: Charger la valeur 42 dans le registre R0
;
; Instructions utiles:
;   MOV Rd, #imm    - Charge une valeur immédiate dans Rd
;   HALT            - Termine le programme
;
; Résultat attendu: R0 = 42
; ============================================

.text
.global _start
_start:
    ; Votre code ici:


    HALT
`,
        solution: `; Hello World - Solution

.text
.global _start
_start:
    MOV R0, #42
    HALT
`,
        test: {
            setup: '',
            expect: { R0: 42 }
        }
    },

    'asm-add': {
        id: 'asm-add',
        name: 'Addition',
        description: 'Additionner deux nombres',
        template: `; ============================================
; Exercice: Addition
; ============================================
; Objectif: Calculer R0 = 15 + 27
;
; Instructions utiles:
;   MOV Rd, #imm     - Charge une valeur immédiate
;   ADD Rd, Rn, Rm   - Rd = Rn + Rm
;   ADD Rd, Rn, #imm - Rd = Rn + imm
;   HALT             - Termine le programme
;
; Résultat attendu: R0 = 42
; ============================================

.text
.global _start
_start:
    ; Votre code ici:


    HALT
`,
        solution: `; Addition - Solution

.text
.global _start
_start:
    MOV R0, #15
    ADD R0, R0, #27
    HALT
`,
        test: {
            setup: '',
            expect: { R0: 42 }
        }
    },

    'asm-sub': {
        id: 'asm-sub',
        name: 'Soustraction',
        description: 'Soustraire deux nombres',
        template: `; ============================================
; Exercice: Soustraction
; ============================================
; Objectif: Calculer R0 = 100 - 58
;
; Instructions utiles:
;   MOV Rd, #imm     - Charge une valeur immédiate
;   SUB Rd, Rn, Rm   - Rd = Rn - Rm
;   SUB Rd, Rn, #imm - Rd = Rn - imm
;   HALT             - Termine le programme
;
; Résultat attendu: R0 = 42
; ============================================

.text
.global _start
_start:
    ; Votre code ici:


    HALT
`,
        solution: `; Soustraction - Solution

.text
.global _start
_start:
    MOV R0, #100
    SUB R0, R0, #58
    HALT
`,
        test: {
            setup: '',
            expect: { R0: 42 }
        }
    },

    'asm-logic': {
        id: 'asm-logic',
        name: 'Logique',
        description: 'Opérations logiques AND, ORR, EOR',
        template: `; ============================================
; Exercice: Logique
; ============================================
; Objectif: Utiliser les opérations logiques
;
; 1. Charger 0xFF dans R1
; 2. Charger 0x0F dans R2
; 3. R0 = R1 AND R2 (devrait donner 0x0F = 15)
;
; Instructions utiles:
;   AND Rd, Rn, Rm   - Rd = Rn AND Rm
;   ORR Rd, Rn, Rm   - Rd = Rn OR Rm
;   EOR Rd, Rn, Rm   - Rd = Rn XOR Rm
;   HALT             - Termine le programme
;
; Résultat attendu: R0 = 15
; ============================================

.text
.global _start
_start:
    ; Votre code ici:


    HALT
`,
        solution: `; Logique - Solution

.text
.global _start
_start:
    MOV R1, #0xFF
    MOV R2, #0x0F
    AND R0, R1, R2
    HALT
`,
        test: {
            setup: '',
            expect: { R0: 15 }
        }
    },

    'asm-double': {
        id: 'asm-double',
        name: 'Doubler',
        description: 'Doubler un nombre (sans multiplication)',
        template: `; ============================================
; Exercice: Doubler
; ============================================
; Objectif: Calculer R0 = 21 * 2 = 42
;
; Astuce: Pour doubler, on peut additionner
; un nombre avec lui-même: x + x = 2x
;
; Instructions utiles:
;   MOV Rd, #imm     - Charge une valeur immédiate
;   ADD Rd, Rn, Rm   - Rd = Rn + Rm
;   HALT             - Termine le programme
;
; Résultat attendu: R0 = 42
; ============================================

.text
.global _start
_start:
    ; Votre code ici:


    HALT
`,
        solution: `; Doubler - Solution

.text
.global _start
_start:
    MOV R0, #21
    ADD R0, R0, R0   ; R0 = R0 + R0 = 2 * R0
    HALT
`,
        test: {
            setup: '',
            expect: { R0: 42 }
        }
    },

    // ==================== CONTROL FLOW ====================
    'asm-cond': {
        id: 'asm-cond',
        name: 'Conditions',
        description: 'Maximum de deux nombres',
        template: `; ============================================
; Exercice: Conditions
; ============================================
; Objectif: Trouver le maximum entre 25 et 17
;
; Charger 25 dans R1 et 17 dans R2
; Mettre le maximum dans R0
;
; Instructions utiles:
;   CMP Rn, Rm      - Compare Rn avec Rm
;   B.GT label      - Branche si Rn > Rm
;   B label         - Branche inconditionnelle
;   HALT            - Termine le programme
;
; Résultat attendu: R0 = 25
; ============================================

.text
.global _start
_start:
    ; Votre code ici:


    HALT
`,
        solution: `; Conditions - Solution

.text
.global _start
_start:
    MOV R1, #25
    MOV R2, #17

    CMP R1, R2
    B.GT .r1_bigger
    MOV R0, R2
    B .done

.r1_bigger:
    MOV R0, R1

.done:
    HALT
`,
        test: {
            setup: '',
            expect: { R0: 25 }
        }
    },

    'asm-abs': {
        id: 'asm-abs',
        name: 'Valeur Absolue',
        description: 'Calculer la valeur absolue',
        template: `; ============================================
; Exercice: Valeur Absolue
; ============================================
; Objectif: Calculer |R1| et stocker dans R0
;
; R1 contient -42 (représenté en complément à 2)
; Pour obtenir -42: 0 - 42
;
; Instructions utiles:
;   CMP Rn, #0      - Compare avec zéro
;   B.GE label      - Branche si >= 0
;   SUB Rd, Rn, Rm  - Rd = Rn - Rm (pour négation: 0 - x)
;   HALT            - Termine le programme
;
; Résultat attendu: R0 = 42
; ============================================

.text
.global _start
_start:
    MOV R1, #0
    SUB R1, R1, #42  ; R1 = -42

    ; Votre code ici: calculer |R1| dans R0


    HALT
`,
        solution: `; Valeur Absolue - Solution

.text
.global _start
_start:
    MOV R1, #0
    SUB R1, R1, #42  ; R1 = -42

    CMP R1, #0
    B.GE .positive
    ; Négatif: R0 = 0 - R1
    MOV R0, #0
    SUB R0, R0, R1
    B .done

.positive:
    MOV R0, R1

.done:
    HALT
`,
        test: {
            setup: '',
            expect: { R0: 42 }
        }
    },

    'asm-loop': {
        id: 'asm-loop',
        name: 'Boucles',
        description: 'Somme des entiers de 1 à 10',
        template: `; ============================================
; Exercice: Boucles
; ============================================
; Objectif: Calculer 1 + 2 + 3 + ... + 10
;
; Résultat: 55
;
; Instructions utiles:
;   MOV, ADD, CMP, B.LE (branch if less or equal)
;   HALT            - Termine le programme
;
; Résultat attendu: R0 = 55
; ============================================

.text
.global _start
_start:
    ; Conseil: R0=somme, R1=compteur
    ; Votre code ici:


    HALT
`,
        solution: `; Boucles - Solution

.text
.global _start
_start:
    MOV R0, #0      ; somme = 0
    MOV R1, #1      ; compteur = 1

.loop:
    ADD R0, R0, R1  ; somme += compteur
    ADD R1, R1, #1  ; compteur++
    CMP R1, #10
    B.LE .loop

    HALT
`,
        test: {
            setup: '',
            expect: { R0: 55 }
        }
    },

    'asm-mult': {
        id: 'asm-mult',
        name: 'Multiplication',
        description: 'Multiplier par additions successives',
        template: `; ============================================
; Exercice: Multiplication
; ============================================
; Objectif: Calculer 6 * 7 = 42 par additions
;
; Sans instruction MUL, on peut multiplier
; en additionnant plusieurs fois:
; 6 * 7 = 6 + 6 + 6 + 6 + 6 + 6 + 6
;
; Instructions utiles:
;   MOV, ADD, SUB, CMP, B.GT
;   HALT            - Termine le programme
;
; Résultat attendu: R0 = 42
; ============================================

.text
.global _start
_start:
    ; R0 = résultat, R1 = multiplicande, R2 = compteur
    ; Votre code ici:


    HALT
`,
        solution: `; Multiplication - Solution

.text
.global _start
_start:
    MOV R0, #0      ; résultat = 0
    MOV R1, #6      ; multiplicande
    MOV R2, #7      ; compteur (multiplicateur)

.loop:
    ADD R0, R0, R1  ; résultat += multiplicande
    SUB R2, R2, #1  ; compteur--
    CMP R2, #0
    B.GT .loop

    HALT
`,
        test: {
            setup: '',
            expect: { R0: 42 }
        }
    },

    'asm-fib': {
        id: 'asm-fib',
        name: 'Fibonacci',
        description: 'Calculer le 10ème nombre de Fibonacci',
        template: `; ============================================
; Exercice: Fibonacci
; ============================================
; Objectif: Calculer F(10) dans R0
;
; Suite: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55...
; F(10) = 55
;
; Instructions utiles:
;   MOV, ADD, SUB, CMP, B.LT (branch if less than)
;   HALT             - Termine le programme
;
; Résultat attendu: R0 = 55
; ============================================

.text
.global _start
_start:
    ; Conseil: R0=F(n-2), R1=F(n-1), R2=compteur
    ; Votre code ici:


    HALT
`,
        solution: `; Fibonacci - Solution

.text
.global _start
_start:
    MOV R0, #1      ; F(1) = 1
    MOV R1, #1      ; F(2) = 1
    MOV R2, #2      ; compteur = 2

.loop:
    ADD R3, R0, R1  ; R3 = F(n-2) + F(n-1)
    MOV R0, R1      ; F(n-2) = ancien F(n-1)
    MOV R1, R3      ; F(n-1) = nouveau F(n)
    ADD R2, R2, #1  ; compteur++
    CMP R2, #10
    B.LT .loop

    MOV R0, R1      ; résultat dans R0
    HALT
`,
        test: {
            setup: '',
            expect: { R0: 55 }
        }
    },

    // ==================== MEMORY ====================
    'asm-array': {
        id: 'asm-array',
        name: 'Tableaux',
        description: 'Somme des éléments d\'un tableau',
        template: `; ============================================
; Exercice: Tableaux
; ============================================
; Objectif: Calculer la somme d'un tableau
;
; Le tableau data contient: 10, 20, 30, 40, 50
;
; Instructions utiles:
;   LDR Rd, [Rn]        - Charge depuis mémoire
;   LDR Rd, =label      - Charge l'adresse du label
;   ADD Rd, Rn, #imm    - Addition
;   HALT                - Termine le programme
;
; Résultat attendu: R0 = 150
; ============================================

.data
data:
    .word 10
    .word 20
    .word 30
    .word 40
    .word 50

.text
.global _start
_start:
    ; Conseil: R0=somme, R1=adresse, R2=compteur
    ; Votre code ici:


    HALT
`,
        solution: `; Tableaux - Solution

.data
data:
    .word 10
    .word 20
    .word 30
    .word 40
    .word 50

.text
.global _start
_start:
    MOV R0, #0          ; somme = 0
    LDR R1, =data       ; adresse du tableau
    MOV R2, #5          ; compteur = 5

.loop:
    LDR R3, [R1]        ; charge élément
    ADD R0, R0, R3      ; somme += élément
    ADD R1, R1, #4      ; adresse suivante
    SUB R2, R2, #1      ; compteur--
    CMP R2, #0
    B.GT .loop

    HALT
`,
        test: {
            setup: '',
            expect: { R0: 150 }
        }
    },

    'asm-max': {
        id: 'asm-max',
        name: 'Maximum Tableau',
        description: 'Trouver le maximum dans un tableau',
        template: `; ============================================
; Exercice: Maximum Tableau
; ============================================
; Objectif: Trouver le maximum dans un tableau
;
; Le tableau contient: 12, 45, 7, 89, 23
; Le maximum est 89
;
; Instructions utiles:
;   LDR Rd, [Rn]    - Charge depuis mémoire
;   CMP Rn, Rm      - Compare deux registres
;   B.GT label      - Branche si plus grand
;   HALT            - Termine le programme
;
; Résultat attendu: R0 = 89
; ============================================

.data
data:
    .word 12
    .word 45
    .word 7
    .word 89
    .word 23

.text
.global _start
_start:
    ; Conseil: R0=max, R1=adresse, R2=compteur
    ; Votre code ici:


    HALT
`,
        solution: `; Maximum Tableau - Solution

.data
data:
    .word 12
    .word 45
    .word 7
    .word 89
    .word 23

.text
.global _start
_start:
    LDR R1, =data       ; adresse du tableau
    LDR R0, [R1]        ; max = premier élément
    ADD R1, R1, #4      ; passer au suivant
    MOV R2, #4          ; compteur = 4 (reste)

.loop:
    LDR R3, [R1]        ; charge élément
    CMP R3, R0          ; compare avec max
    B.LE .skip
    MOV R0, R3          ; nouveau max

.skip:
    ADD R1, R1, #4      ; adresse suivante
    SUB R2, R2, #1      ; compteur--
    CMP R2, #0
    B.GT .loop

    HALT
`,
        test: {
            setup: '',
            expect: { R0: 89 }
        }
    },

    'asm-mem': {
        id: 'asm-mem',
        name: 'Mémoire',
        description: 'Sauvegarder et charger depuis la mémoire',
        template: `; ============================================
; Exercice: Mémoire
; ============================================
; Objectif: Utiliser la mémoire
;
; 1. Mettre 10 dans R1, 20 dans R2
; 2. Sauvegarder R1 et R2 en mémoire (à data)
; 3. Mettre 0 dans R1 et R2
; 4. Recharger depuis la mémoire
; 5. Calculer R0 = R1 + R2
;
; Instructions utiles:
;   LDR Rd, =label  - Charge l'adresse du label
;   STR Rn, [Rd]    - Écrit Rn en mémoire à [Rd]
;   LDR Rn, [Rd]    - Charge depuis [Rd] dans Rn
;   HALT            - Termine le programme
;
; Résultat attendu: R0 = 30
; ============================================

.data
data:
    .word 0
    .word 0

.text
.global _start
_start:
    ; Votre code ici:


    HALT
`,
        solution: `; Mémoire - Solution

.data
data:
    .word 0
    .word 0

.text
.global _start
_start:
    MOV R1, #10
    MOV R2, #20

    ; Sauvegarder
    LDR R4, =data
    STR R1, [R4]        ; data[0] = R1
    ADD R4, R4, #4
    STR R2, [R4]        ; data[1] = R2

    ; Effacer
    MOV R1, #0
    MOV R2, #0

    ; Recharger
    LDR R4, =data
    LDR R1, [R4]        ; R1 = data[0]
    ADD R4, R4, #4
    LDR R2, [R4]        ; R2 = data[1]

    ; Calculer
    ADD R0, R1, R2

    HALT
`,
        test: {
            setup: '',
            expect: { R0: 30 }
        }
    },

    // ==================== FUNCTIONS ====================
    'asm-func': {
        id: 'asm-func',
        name: 'Fonctions',
        description: 'Appel de fonction simple',
        template: `; ============================================
; Exercice: Fonctions
; ============================================
; Objectif: Créer une fonction qui double un nombre
;
; La fonction 'double' doit:
; - Prendre R0 comme argument
; - Retourner R0 * 2 dans R0
; - Utiliser ADD pour doubler (x + x = 2x)
;
; Instructions utiles:
;   BL label        - Appel de fonction (sauve PC dans LR)
;   MOV PC, LR      - Retour de fonction
;   ADD Rd, Rn, Rm  - Addition
;   HALT            - Termine le programme
;
; Résultat attendu: R0 = 42 (après double(21))
; ============================================

.text
.global _start
_start:
    ; 1. Charger 21 dans R0
    ; 2. Appeler la fonction double
    ; Votre code ici:


    HALT

; Fonction double: R0 = R0 * 2
double:
    ; Votre code ici (doubler R0):

    MOV PC, LR      ; retour
`,
        solution: `; Fonctions - Solution

.text
.global _start
_start:
    MOV R0, #21
    BL double
    HALT

double:
    ADD R0, R0, R0  ; R0 = R0 + R0 = 2 * R0
    MOV PC, LR      ; retour
`,
        test: {
            setup: '',
            expect: { R0: 42 }
        }
    },

    'asm-func2': {
        id: 'asm-func2',
        name: 'Fonction Add3',
        description: 'Fonction avec plusieurs appels',
        template: `; ============================================
; Exercice: Fonction Add3
; ============================================
; Objectif: Créer une fonction add3(a,b,c) = a+b+c
;
; Convention d'appel:
; - Arguments: R0, R1, R2
; - Retour: R0
;
; Calculer: add3(10, 15, 17) = 42
;
; Instructions utiles:
;   BL label        - Appel de fonction
;   MOV PC, LR      - Retour
;   ADD Rd, Rn, Rm  - Addition
;   HALT            - Termine le programme
;
; Résultat attendu: R0 = 42
; ============================================

.text
.global _start
_start:
    ; Préparer les arguments et appeler add3
    ; Votre code ici:


    HALT

; Fonction add3: R0 = R0 + R1 + R2
add3:
    ; Votre code ici:

    MOV PC, LR
`,
        solution: `; Fonction Add3 - Solution

.text
.global _start
_start:
    MOV R0, #10
    MOV R1, #15
    MOV R2, #17
    BL add3
    HALT

add3:
    ADD R0, R0, R1
    ADD R0, R0, R2
    MOV PC, LR
`,
        test: {
            setup: '',
            expect: { R0: 42 }
        }
    },

    // ==================== I/O ====================
    'asm-putc': {
        id: 'asm-putc',
        name: 'Écrire Caractère',
        description: 'Écrire un caractère à l\'écran',
        template: `; ============================================
; Exercice: Écrire Caractère
; ============================================
; Objectif: Écrire le caractère 'A' (ASCII 65)
;
; L'adresse PUTC est 0xFFFF0000
; Écrire à cette adresse affiche le caractère
;
; Instructions utiles:
;   MOV Rd, #imm    - Charge une valeur
;   LDR Rd, =addr   - Charge une adresse 32-bit
;   STRB Rn, [Rd]   - Écrit un byte en mémoire
;   HALT            - Termine le programme
;
; Résultat attendu: R0 = 65 (le caractère écrit)
; ============================================

.text
.global _start
_start:
    ; Votre code ici:


    HALT
`,
        solution: `; Écrire Caractère - Solution

.text
.global _start
_start:
    MOV R0, #65         ; 'A' = 65
    LDR R1, =0xFFFF0000 ; adresse PUTC
    STRB R0, [R1]       ; écrire le caractère
    HALT
`,
        test: {
            setup: '',
            expect: { R0: 65 }
        }
    },

    'asm-hello-str': {
        id: 'asm-hello-str',
        name: 'Hello String',
        description: 'Afficher une chaîne de caractères',
        template: `; ============================================
; Exercice: Hello String
; ============================================
; Objectif: Afficher "Hi" (2 caractères)
;
; Les caractères sont:
;   'H' = 72, 'i' = 105
;
; Écrire chaque caractère à PUTC (0xFFFF0000)
;
; Instructions utiles:
;   MOV, LDR, STRB
;   HALT            - Termine le programme
;
; Résultat attendu: R0 = 2 (nombre de caractères)
; ============================================

.text
.global _start
_start:
    LDR R1, =0xFFFF0000 ; adresse PUTC
    MOV R0, #0          ; compteur

    ; Votre code ici: écrire 'H' puis 'i'


    HALT
`,
        solution: `; Hello String - Solution

.text
.global _start
_start:
    LDR R1, =0xFFFF0000 ; adresse PUTC
    MOV R0, #0          ; compteur

    MOV R2, #72         ; 'H'
    STRB R2, [R1]
    ADD R0, R0, #1

    MOV R2, #105        ; 'i'
    STRB R2, [R1]
    ADD R0, R0, #1

    HALT
`,
        test: {
            setup: '',
            expect: { R0: 2 }
        }
    },

    'asm-print-loop': {
        id: 'asm-print-loop',
        name: 'Print Loop',
        description: 'Afficher une chaîne avec une boucle',
        template: `; ============================================
; Exercice: Print Loop
; ============================================
; Objectif: Afficher "ABCD" avec une boucle
;
; 'A'=65, 'B'=66, 'C'=67, 'D'=68
; On peut incrémenter le code ASCII dans une boucle
;
; Instructions utiles:
;   STRB Rn, [Rd]   - Écrit un byte
;   ADD, CMP, B.LE
;   HALT            - Termine le programme
;
; Résultat attendu: R0 = 4 (nombre de caractères)
; ============================================

.text
.global _start
_start:
    LDR R1, =0xFFFF0000 ; adresse PUTC
    MOV R0, #0          ; compteur
    MOV R2, #65         ; caractère courant = 'A'

    ; Votre code ici: boucle pour afficher A, B, C, D


    HALT
`,
        solution: `; Print Loop - Solution

.text
.global _start
_start:
    LDR R1, =0xFFFF0000 ; adresse PUTC
    MOV R0, #0          ; compteur
    MOV R2, #65         ; caractère courant = 'A'

.loop:
    STRB R2, [R1]       ; écrire caractère
    ADD R0, R0, #1      ; compteur++
    ADD R2, R2, #1      ; caractère suivant
    CMP R2, #69         ; 'E' = 69
    B.LT .loop

    HALT
`,
        test: {
            setup: '',
            expect: { R0: 4 }
        }
    },

    // ==================== SCREEN ====================
    'asm-pixel': {
        id: 'asm-pixel',
        name: 'Pixel',
        description: 'Allumer un pixel à l\'écran',
        template: `; ============================================
; Exercice: Pixel
; ============================================
; Objectif: Allumer le pixel (0,0) en haut à gauche
;
; Écran: 320x240 pixels, 1 bit par pixel
; Adresse de base: 0x00400000
; Chaque byte contient 8 pixels (MSB = gauche)
;
; Pour allumer le pixel (0,0):
; - Adresse = 0x00400000
; - Bit = bit 7 (MSB) du premier byte
; - Valeur = 0x80
;
; Instructions utiles:
;   LDR Rd, =addr   - Charge une adresse
;   MOV Rd, #imm    - Charge une valeur
;   STRB Rn, [Rd]   - Écrit un byte
;   HALT            - Termine le programme
;
; Résultat attendu: R0 = 0x80 (valeur écrite)
; ============================================

.text
.global _start
_start:
    ; Votre code ici:


    HALT
`,
        solution: `; Pixel - Solution

.text
.global _start
_start:
    LDR R1, =0x00400000 ; adresse écran
    MOV R0, #0x80       ; bit 7 = pixel 0
    STRB R0, [R1]       ; écrire le byte
    HALT
`,
        test: {
            setup: '',
            expect: { R0: 128 }
        }
    },

    'asm-hline': {
        id: 'asm-hline',
        name: 'Ligne Horizontale',
        description: 'Dessiner une ligne horizontale de 8 pixels',
        template: `; ============================================
; Exercice: Ligne Horizontale
; ============================================
; Objectif: Dessiner 8 pixels horizontaux
;
; Pour dessiner 8 pixels consécutifs:
; - Écrire 0xFF à l'adresse de l'écran
; - 0xFF = tous les 8 bits à 1
;
; Instructions utiles:
;   LDR Rd, =addr   - Charge une adresse
;   MOV Rd, #imm    - Charge une valeur
;   STRB Rn, [Rd]   - Écrit un byte
;   HALT            - Termine le programme
;
; Résultat attendu: R0 = 0xFF (valeur écrite)
; ============================================

.text
.global _start
_start:
    ; Votre code ici:


    HALT
`,
        solution: `; Ligne Horizontale - Solution

.text
.global _start
_start:
    LDR R1, =0x00400000 ; adresse écran
    MOV R0, #0xFF       ; 8 pixels allumés
    STRB R0, [R1]       ; écrire le byte
    HALT
`,
        test: {
            setup: '',
            expect: { R0: 255 }
        }
    },

    'asm-vline': {
        id: 'asm-vline',
        name: 'Ligne Verticale',
        description: 'Dessiner une ligne verticale de 8 pixels',
        template: `; ============================================
; Exercice: Ligne Verticale
; ============================================
; Objectif: Dessiner 8 pixels verticaux
;
; L'écran fait 320 pixels de large = 40 bytes/ligne
; Pour descendre d'une ligne: ajouter 40 à l'adresse
;
; Dessiner le pixel (0,y) pour y de 0 à 7:
; - Chaque pixel est le bit 7 (0x80) du byte
; - Incrémenter l'adresse de 40 à chaque ligne
;
; Instructions utiles:
;   LDR, MOV, STRB, ADD, CMP, B.LT
;   HALT            - Termine le programme
;
; Résultat attendu: R0 = 8 (nombre de pixels)
; ============================================

.text
.global _start
_start:
    LDR R1, =0x00400000 ; adresse écran
    MOV R2, #0x80       ; bit du pixel
    MOV R0, #0          ; compteur

    ; Votre code ici: boucle pour 8 lignes


    HALT
`,
        solution: `; Ligne Verticale - Solution

.text
.global _start
_start:
    LDR R1, =0x00400000 ; adresse écran
    MOV R2, #0x80       ; bit du pixel (colonne 0)
    MOV R0, #0          ; compteur

.loop:
    STRB R2, [R1]       ; dessiner pixel
    ADD R1, R1, #40     ; ligne suivante (320/8 = 40)
    ADD R0, R0, #1      ; compteur++
    CMP R0, #8
    B.LT .loop

    HALT
`,
        test: {
            setup: '',
            expect: { R0: 8 }
        }
    },

    'asm-rect': {
        id: 'asm-rect',
        name: 'Rectangle',
        description: 'Dessiner un rectangle 8x8',
        template: `; ============================================
; Exercice: Rectangle
; ============================================
; Objectif: Dessiner un carré 8x8 pixels
;
; L'écran: 320x240, 40 bytes/ligne
; Pour un carré 8x8 en haut à gauche:
; - 8 lignes de 0xFF (8 pixels chacune)
; - Chaque ligne à +40 bytes de la précédente
;
; Instructions utiles:
;   LDR, MOV, STRB, ADD, CMP, B.LT
;   HALT            - Termine le programme
;
; Résultat attendu: R0 = 8 (nombre de lignes)
; ============================================

.text
.global _start
_start:
    LDR R1, =0x00400000 ; adresse écran
    MOV R2, #0xFF       ; ligne de 8 pixels
    MOV R0, #0          ; compteur de lignes

    ; Votre code ici: boucle pour 8 lignes


    HALT
`,
        solution: `; Rectangle - Solution

.text
.global _start
_start:
    LDR R1, =0x00400000 ; adresse écran
    MOV R2, #0xFF       ; ligne de 8 pixels
    MOV R0, #0          ; compteur de lignes

.loop:
    STRB R2, [R1]       ; dessiner ligne
    ADD R1, R1, #40     ; ligne suivante
    ADD R0, R0, #1      ; compteur++
    CMP R0, #8
    B.LT .loop

    HALT
`,
        test: {
            setup: '',
            expect: { R0: 8 }
        }
    },

    'asm-checkerboard': {
        id: 'asm-checkerboard',
        name: 'Damier',
        description: 'Dessiner un motif en damier',
        template: `; ============================================
; Exercice: Damier
; ============================================
; Objectif: Dessiner un damier 16x8 pixels
;
; Motif damier: alterner 0xAA et 0x55
; - 0xAA = 10101010 (pixels pairs)
; - 0x55 = 01010101 (pixels impairs)
;
; Alterner les motifs à chaque ligne
;
; Instructions utiles:
;   LDR, MOV, STRB, ADD, EOR, CMP, B.LT
;   EOR Rd, Rn, #0xFF - inverse les bits
;   HALT            - Termine le programme
;
; Résultat attendu: R0 = 8 (nombre de lignes)
; ============================================

.text
.global _start
_start:
    LDR R1, =0x00400000 ; adresse écran
    MOV R2, #0xAA       ; motif ligne paire
    MOV R3, #0x55       ; motif ligne impaire
    MOV R0, #0          ; compteur de lignes

    ; Votre code ici


    HALT
`,
        solution: `; Damier - Solution

.text
.global _start
_start:
    LDR R1, =0x00400000 ; adresse écran
    MOV R2, #0xAA       ; motif courant
    MOV R0, #0          ; compteur de lignes

.loop:
    STRB R2, [R1]       ; colonne 0
    ADD R4, R1, #1
    EOR R5, R2, #0xFF   ; inverser pour colonne 1
    STRB R5, [R4]       ; colonne 1

    ADD R1, R1, #40     ; ligne suivante
    EOR R2, R2, #0xFF   ; alterner le motif
    ADD R0, R0, #1
    CMP R0, #8
    B.LT .loop

    HALT
`,
        test: {
            setup: '',
            expect: { R0: 8 }
        }
    },

    // ========================================
    // JEUX - Games
    // ========================================
    'asm-getc': {
        id: 'asm-getc',
        name: 'Lire un Caractère',
        description: 'Lire une touche clavier et convertir en nombre',
        template: `; ============================================
; Exercice: Lire un Caractère (GETC)
; ============================================
; Objectif: Lire un chiffre au clavier et le convertir
;
; L'adresse KEYBOARD est 0x00402600
; Lire à cette adresse retourne le code ASCII
; de la touche actuellement pressée (0 si aucune)
;
; Les chiffres ASCII:
;   '0' = 0x30 (48)
;   '1' = 0x31 (49)
;   ...
;   '9' = 0x39 (57)
;
; Pour convertir ASCII → nombre: soustraire 0x30
; Exemple: '5' (0x35) - 0x30 = 5
;
; Instructions:
; 1. Attendre qu'une touche soit pressée (boucle)
; 2. Lire le caractère avec LDRB
; 3. Soustraire 0x30 pour obtenir le nombre
; 4. Afficher le résultat avec PUTC (0xFFFF0000)
;
; Interactif: Activez "Capture clavier", cliquez sur l'écran
; Tapez un chiffre, vérifiez R0
; ============================================

.text
.global _start
_start:
    LDR R1, =0x00402600 ; adresse KEYBOARD (temps réel)
    LDR R4, =0xFFFF0000 ; adresse PUTC

    ; Attendre une touche
.wait:
    LDR R2, [R1]        ; lire clavier
    CMP R2, #0
    B.EQ .wait          ; boucler si pas de touche

    ; Votre code ici:
    ; Convertir R2 (ASCII) en nombre dans R0
    ; Puis afficher le chiffre avec PUTC


    HALT
`,
        solution: `; Lire un Caractère - Solution

.text
.global _start
_start:
    LDR R1, =0x00402600 ; adresse KEYBOARD (temps réel)
    LDR R4, =0xFFFF0000 ; adresse PUTC

    ; Attendre une touche
.wait:
    LDR R2, [R1]        ; lire clavier
    CMP R2, #0
    B.EQ .wait          ; boucler si pas de touche

    ; Convertir ASCII → nombre
    SUB R0, R2, #0x30   ; R0 = chiffre (0-9)

    ; Afficher le chiffre tapé (écho)
    STR R2, [R4]        ; afficher le caractère

    HALT
`,
        test: {
            setup: '',
            expect: {},
            interactive: true,
            description: 'Activez Capture, tapez un chiffre (0-9), vérifiez R0'
        }
    },

    'asm-getc2': {
        id: 'asm-getc2',
        name: 'Lire un Nombre à 2 Chiffres',
        description: 'Lire deux chiffres et former un nombre',
        template: `; ============================================
; Exercice: Lire un Nombre à 2 Chiffres
; ============================================
; Objectif: Lire deux chiffres et former un nombre
;
; Pour former un nombre à 2 chiffres:
;   nombre = (premier_chiffre × 10) + deuxième_chiffre
;
; Exemple: '4' puis '2' → 4×10 + 2 = 42
;
; Astuce multiplication par 10:
;   x × 10 = ((x × 2) × 2 + x) × 2 = (4x + x) × 2 = 5x × 2
;   Ou simplement: 2x → 4x → 5x → 10x
;
; Interactif: Activez "Capture clavier"
; Tapez 2 chiffres, vérifiez R0
; ============================================

.text
.global _start
_start:
    LDR R5, =0x00402600 ; adresse KEYBOARD (temps réel)
    LDR R6, =0xFFFF0000 ; adresse PUTC

    ; Attendre premier chiffre
.wait1:
    LDR R1, [R5]        ; lire clavier
    CMP R1, #0
    B.EQ .wait1

    ; Écho du premier chiffre
    STR R1, [R6]

    ; Votre code ici:
    ; 1. Convertir R1 en chiffre (- 0x30)
    ; 2. Multiplier par 10
    ; 3. Attendre la relâche de la touche
    ; 4. Attendre et lire le 2ème chiffre
    ; 5. Convertir et ajouter dans R0


    HALT
`,
        solution: `; Lire un Nombre à 2 Chiffres - Solution

.text
.global _start
_start:
    LDR R5, =0x00402600 ; adresse KEYBOARD (temps réel)
    LDR R6, =0xFFFF0000 ; adresse PUTC

    ; Attendre premier chiffre
.wait1:
    LDR R1, [R5]
    CMP R1, #0
    B.EQ .wait1

    ; Écho du premier chiffre
    STR R1, [R6]

    ; Convertir en nombre
    SUB R1, R1, #0x30   ; R1 = premier chiffre

    ; Multiplier par 10: x → 2x → 4x → 5x → 10x
    ADD R2, R1, R1      ; R2 = 2x
    ADD R2, R2, R2      ; R2 = 4x
    ADD R2, R2, R1      ; R2 = 5x
    ADD R1, R2, R2      ; R1 = 10x

    ; Attendre relâche de la touche
.release1:
    LDR R2, [R5]
    CMP R2, #0
    B.NE .release1

    ; Attendre deuxième chiffre
.wait2:
    LDR R2, [R5]
    CMP R2, #0
    B.EQ .wait2

    ; Écho du deuxième chiffre
    STR R2, [R6]

    ; Convertir et ajouter
    SUB R2, R2, #0x30   ; R2 = deuxième chiffre
    ADD R0, R1, R2      ; R0 = nombre complet

    HALT
`,
        test: {
            setup: '',
            expect: {},
            interactive: true,
            description: 'Activez Capture, tapez 2 chiffres (ex: 42), vérifiez R0'
        }
    },

    'asm-guess': {
        id: 'asm-guess',
        name: 'Deviner le Nombre',
        description: 'Jeu interactif: deviner un nombre entre 0 et 9',
        template: `; ============================================
; Exercice: Deviner le Nombre (Interactif)
; ============================================
; Objectif: Créer un jeu où l'utilisateur devine un nombre
;
; Le nombre secret est 7 (entre 0 et 9)
;
; Boucle de jeu:
; 1. Attendre que l'utilisateur tape un chiffre
; 2. Comparer au nombre secret
; 3. Afficher:
;    - '+' si trop petit (il faut plus grand)
;    - '-' si trop grand (il faut plus petit)
;    - '*' si gagné, puis terminer
;
; Adresses:
;   KEYBOARD: 0x00402600
;   PUTC: 0xFFFF0000
;
; Interactif: Run, Capture, cliquez écran, tapez!
; ============================================

.text
.global _start
_start:
    MOV R7, #55         ; nombre secret: '7' en ASCII (0x37)
    LDR R5, =0x00402600 ; KEYBOARD
    LDR R6, =0xFFFF0000 ; PUTC

    ; Votre code ici:
    ; Boucle: lire touche, comparer, afficher indice


    HALT
`,
        solution: `; Deviner le Nombre - Solution

.text
.global _start
_start:
    MOV R7, #55         ; nombre secret: '7' en ASCII (0x37)
    LDR R5, =0x00402600 ; KEYBOARD
    LDR R6, =0xFFFF0000 ; PUTC
    MOV R4, #0          ; dernière touche vue

.game_loop:
    ; Lire clavier
    LDR R0, [R5]

    ; Ignorer si pas de touche ou même touche que avant
    CMP R0, #0
    B.EQ .game_loop
    CMP R0, R4
    B.EQ .game_loop

    ; Nouvelle touche détectée
    MOV R4, R0          ; sauvegarder

    ; Écho de la touche
    STR R0, [R6]

    ; Comparer au secret
    CMP R0, R7
    B.EQ .win
    B.LT .too_small

    ; Trop grand -> afficher '-'
    MOV R1, #45         ; '-'
    STR R1, [R6]
    MOV R1, #10         ; newline
    STR R1, [R6]
    B .wait_release

.too_small:
    ; Trop petit -> afficher '+'
    MOV R1, #43         ; '+'
    STR R1, [R6]
    MOV R1, #10         ; newline
    STR R1, [R6]

.wait_release:
    ; Attendre relâche (R4 != 0, donc on attend que R0 change)
    LDR R0, [R5]
    CMP R0, R4
    B.EQ .wait_release
    MOV R4, #0          ; reset
    B .game_loop

.win:
    ; Gagné! Afficher '*'
    MOV R1, #42         ; '*'
    STR R1, [R6]
    MOV R1, #10
    STR R1, [R6]
    MOV R0, #7          ; résultat dans R0

    HALT
`,
        test: {
            setup: '',
            expect: {},
            interactive: true,
            description: 'Devinez le nombre 7! Indices: + (plus grand) ou - (plus petit)'
        }
    },

    'asm-gradient': {
        id: 'asm-gradient',
        name: 'Dégradé (Dithering)',
        description: 'Simuler un dégradé sur écran monochrome',
        template: `; ============================================
; Exercice: Dégradé (Dithering)
; ============================================
; Objectif: Créer un effet de dégradé horizontal
;
; L'écran est monochrome (1 bit/pixel), mais on peut
; simuler des niveaux de gris avec le tramage:
;
; Motifs de densité croissante (gauche → droite):
;   0x00 = noir      (0% blanc)
;   0x11 = 12.5%     (2 pixels sur 8)
;   0x55 = 50%       (4 pixels sur 8)
;   0xBB = 75%       (6 pixels sur 8)
;   0xFF = blanc     (100% blanc)
;
; Pour chaque ligne, écrire ces 5 motifs
; sur les 5 premiers bytes (40 pixels)
;
; L'écran fait 40 bytes/ligne (320 pixels ÷ 8)
;
; Vérification: visuelle (dégradé horizontal)
; ============================================

.text
.global _start
_start:
    LDR R1, =0x00400000 ; adresse écran

    ; Votre code ici:
    ; Pour chaque ligne, écrire les 5 motifs


    HALT
`,
        solution: `; Dégradé (Dithering) - Solution

.text
.global _start
_start:
    LDR R1, =0x00400000 ; adresse écran
    MOV R0, #0          ; compteur lignes

.line_loop:
    ; Écrire les 5 motifs de dégradé
    MOV R2, #0x00       ; noir
    STRB R2, [R1]

    MOV R2, #0x11       ; 12.5% blanc
    ADD R3, R1, #1
    STRB R2, [R3]

    MOV R2, #0x55       ; 50% blanc
    ADD R3, R1, #2
    STRB R2, [R3]

    MOV R2, #0xBB       ; 75% blanc
    ADD R3, R1, #3
    STRB R2, [R3]

    MOV R2, #0xFF       ; blanc
    ADD R3, R1, #4
    STRB R2, [R3]

    ; Ligne suivante
    ADD R1, R1, #40     ; 40 bytes par ligne
    ADD R0, R0, #1
    CMP R0, #240
    B.LT .line_loop

    HALT
`,
        test: {
            setup: '',
            expect: {},
            visual: true,
            description: 'Vérifiez visuellement le dégradé horizontal sur les 5 premiers bytes de chaque ligne'
        }
    },

    'asm-gradient-full': {
        id: 'asm-gradient-full',
        name: 'Dégradé Plein Écran',
        description: 'Remplir tout l\'écran avec un dégradé',
        template: `; ============================================
; Exercice: Dégradé Plein Écran
; ============================================
; Objectif: Remplir l'écran avec un dégradé vertical
;
; Diviser l'écran en 8 bandes horizontales (30 lignes chacune):
; - Bande 0: 0x00 (noir)
; - Bande 1: 0x11
; - Bande 2: 0x22
; - ... (ajouter 0x11 à chaque bande)
; - Bande 7: 0x77
;
; Chaque bande = 30 lignes × 40 bytes = 1200 bytes
;
; Vérification: visuelle (8 bandes de dégradé)
; ============================================

.text
.global _start
_start:
    LDR R1, =0x00400000 ; adresse écran
    MOV R0, #0          ; compteur bandes

    ; Votre code ici


    HALT
`,
        solution: `; Dégradé Plein Écran - Solution
; 8 bandes avec motifs croissants

.text
.global _start
_start:
    LDR R1, =0x00400000 ; adresse écran
    MOV R0, #0          ; compteur bandes
    MOV R2, #0x00       ; motif initial (noir)

next_band:
    LDR R3, =1200       ; 30 lignes * 40 bytes

fill_band:
    STRB R2, [R1]
    ADD R1, R1, #1
    SUB R3, R3, #1
    CMP R3, #0
    B.GT fill_band

    ; Passer au motif suivant (approximation)
    ; 0x00 -> 0x11 -> 0x22 -> 0x33 -> ...
    ADD R2, R2, #0x11
    ADD R0, R0, #1
    CMP R0, #8
    B.LT next_band

    HALT
`,
        test: {
            setup: '',
            expect: {},
            visual: true,
            description: 'Vérifiez visuellement que l\'écran affiche 8 bandes de dégradé'
        }
    },

    'asm-guess-loop': {
        id: 'asm-guess-loop',
        name: 'Recherche Dichotomique',
        description: 'Trouver le nombre avec la recherche binaire',
        template: `; ============================================
; Exercice: Recherche Dichotomique
; ============================================
; Objectif: Trouver un nombre par dichotomie
;
; Le nombre secret est 42 (entre 0 et 100)
; Utiliser la recherche binaire:
; - low = 0, high = 100
; - mid = (low + high) / 2
; - Si mid < secret: low = mid + 1
; - Si mid > secret: high = mid - 1
; - Si mid == secret: trouvé!
;
; Compter le nombre d'essais dans R0
;
; Résultat attendu: R0 = 7 (essais nécessaires)
; ============================================

.text
.global _start
_start:
    MOV R5, #42         ; nombre secret
    MOV R1, #0          ; low
    MOV R2, #100        ; high
    MOV R0, #0          ; compteur d'essais

    ; Votre code ici:
    ; Implémenter la recherche dichotomique


    HALT
`,
        solution: `; Recherche Dichotomique - Solution

.text
.global _start
_start:
    MOV R5, #42         ; nombre secret
    MOV R1, #0          ; low
    MOV R2, #100        ; high
    MOV R0, #0          ; compteur d'essais

.loop:
    ADD R0, R0, #1      ; compteur++

    ; mid = (low + high) / 2
    ADD R3, R1, R2
    MOV R4, R3
    ; Division par 2 avec shift (simulé par soustraction successive)
    MOV R3, #0
.div2:
    CMP R4, #2
    B.LT .div_done
    SUB R4, R4, #2
    ADD R3, R3, #1
    B .div2
.div_done:
    ; R3 = mid

    CMP R3, R5
    B.EQ .found
    B.LT .too_low

    ; mid > secret: high = mid - 1
    SUB R2, R3, #1
    B .loop

.too_low:
    ; mid < secret: low = mid + 1
    ADD R1, R3, #1
    B .loop

.found:
    HALT
`,
        test: {
            setup: '',
            expect: { R0: 7 }
        }
    }
};

// Get exercise by ID
export function getAsmExercise(id) {
    return ASM_EXERCISES[id];
}

// Get all ASM exercise IDs in order
export function getAsmExerciseIds() {
    return Object.keys(ASM_EXERCISES);
}
