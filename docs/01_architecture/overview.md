# Vue d'ensemble de l'architecture A32-Lite

## Introduction

A32-Lite est une architecture 32-bit simplifiée inspirée d'ARM, conçue pour l'enseignement. Elle permet de comprendre les concepts fondamentaux des processeurs modernes sans la complexité d'une architecture réelle.

## Caractéristiques principales

| Caractéristique | Valeur |
|-----------------|--------|
| Largeur des données | 32 bits |
| Largeur des adresses | 32 bits |
| Registres généraux | 16 (R0-R15) |
| Espace d'adressage | 4 Go théorique |
| Endianness | Little-endian |
| Architecture | Load/Store |

## Les registres

### Registres généraux

| Registre | Alias | Usage |
|----------|-------|-------|
| R0-R3 | - | Arguments / Retour |
| R4-R10 | - | Variables (callee-saved) |
| R11 | FP | Frame Pointer |
| R12 | - | Scratch |
| R13 | SP | Stack Pointer |
| R14 | LR | Link Register |
| R15 | PC | Program Counter |

### Registre d'état (Flags)

| Flag | Signification |
|------|---------------|
| N | Negative - résultat négatif |
| Z | Zero - résultat nul |
| C | Carry - retenue |
| V | Overflow - dépassement |

## Modèle mémoire

```
0x00000000 ┌────────────────────────┐
           │      Code (ROM)        │  Instructions
           │                        │  Constantes
0x00100000 ├────────────────────────┤
           │        RAM             │  Données
           │      (1 Mo)            │  Pile
           │                        │  Heap
0x00400000 ├────────────────────────┤
           │    Framebuffer         │  Écran 320x240
           │    (9600 octets)       │  1 bit/pixel
0x00402600 ├────────────────────────┤
           │    Keyboard            │  1 registre 32-bit
0x10000000 ├────────────────────────┤
           │   Port de sortie       │  Debug/texte
           └────────────────────────┘
```

## Pipeline d'exécution

A32-Lite utilise un pipeline simplifié conceptuel :

```
Fetch → Decode → Execute → Memory → Writeback
```

Dans le simulateur, chaque instruction est exécutée atomiquement.

## Types d'instructions

### 1. Transfert de données
```asm
MOV Rd, Rm          ; Rd = Rm
MOV Rd, #imm        ; Rd = imm
LDR Rd, [Rn]        ; Rd = mem[Rn]
STR Rd, [Rn]        ; mem[Rn] = Rd
LDRB Rd, [Rn]       ; Load byte
STRB Rd, [Rn]       ; Store byte
```

### 2. Arithmétique
```asm
ADD Rd, Rn, Rm      ; Rd = Rn + Rm
SUB Rd, Rn, Rm      ; Rd = Rn - Rm
MUL Rd, Rn, Rm      ; Rd = Rn * Rm
SDIV Rd, Rn, Rm     ; Rd = Rn / Rm (signé)
```

### 3. Logique
```asm
AND Rd, Rn, Rm      ; Rd = Rn & Rm
ORR Rd, Rn, Rm      ; Rd = Rn | Rm
EOR Rd, Rn, Rm      ; Rd = Rn ^ Rm
MVN Rd, Rm          ; Rd = ~Rm
```

### 4. Décalages
```asm
LSL Rd, Rn, #imm    ; Rd = Rn << imm
LSR Rd, Rn, #imm    ; Rd = Rn >> imm (logique)
ASR Rd, Rn, #imm    ; Rd = Rn >> imm (arithmétique)
```

### 5. Comparaison
```asm
CMP Rn, Rm          ; Flags = Rn - Rm
CMP Rn, #imm        ; Flags = Rn - imm
TST Rn, Rm          ; Flags = Rn & Rm
```

### 6. Branchement
```asm
B label             ; PC = label
BL label            ; LR = PC+4, PC = label
BEQ label           ; Branch if Z=1
BNE label           ; Branch if Z=0
BLT label           ; Branch if N≠V
BGT label           ; Branch if Z=0 and N=V
```

### 7. Pile
```asm
PUSH {regs}         ; Empile les registres
POP {regs}          ; Dépile les registres
```

## Convention d'appel

### Appelant (Caller)
1. Place les arguments dans R0-R3 (puis pile si plus)
2. Appelle avec `BL fonction`
3. Récupère le résultat dans R0

### Appelé (Callee)
1. Sauvegarde LR et les registres R4-R11 utilisés
2. Établit le frame pointer
3. Exécute le code
4. Restaure les registres
5. Retourne avec `MOV PC, LR`

### Exemple
```asm
; int add(int a, int b) { return a + b; }
add:
    ADD R0, R0, R1      ; R0 = a + b
    MOV PC, LR          ; return

; Appel
    MOV R0, #5          ; a = 5
    MOV R1, #3          ; b = 3
    BL add              ; R0 = add(5, 3)
```

## Comparaison avec ARM

| Aspect | A32-Lite | ARM |
|--------|----------|-----|
| Modes CPU | 1 | 7+ |
| Exceptions | Trap/Exit | IRQ, FIQ, SVC, etc. |
| Coprocesseurs | Non | Oui |
| SIMD | Non | NEON |
| Cache | Non | Oui |
| MMU | Non | Oui |

A32-Lite est volontairement simplifié pour l'apprentissage.

## Outils

- **a32** : Assembleur
- **a32-run** : Simulateur
- **c32** : Compilateur C
- **hdl-sim** : Simulateur HDL (CPU en portes logiques)

## Ressources

- [Jeu d'instructions complet](instruction_set.md)
- [Carte mémoire](memory_map.md)
- [Tutoriel assembleur](../02_assembleur/)
