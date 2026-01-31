---
marp: true
theme: seed-slides
paginate: true
header: "Seed - Chapitre 04"
footer: "Architecture Machine (ISA A32)"
---

# Chapitre 04 : Architecture Machine

> "Le langage est la limite de mon monde." — Wittgenstein

---

# 🎯 Où en sommes-nous ?

```
┌─────────────────────────────────┐
│  8. Applications                │
├─────────────────────────────────┤
│  ...                            │
├─────────────────────────────────┤
│  4. Architecture (ISA) ◀── NOUS │
├─────────────────────────────────┤
│  3. Mémoire (RAM) ✓             │
├─────────────────────────────────┤
│  2. Arithmétique (ALU) ✓        │
└─────────────────────────────────┘
```

L'**ISA** = le contrat matériel/logiciel !

---

# Qu'est-ce qu'une Architecture ?

L'architecture définit :

1. **Les registres** : Combien ? Quelle taille ?
2. **Les instructions** : Quelles opérations possibles ?
3. **L'encodage** : Représentation binaire
4. **Le modèle mémoire** : Comment accéder aux données ?

C'est un **contrat** entre matériel et logiciel.

---

# nand2c A32 : Architecture RISC

Inspirée de ARM (smartphones, Raspberry Pi) :

- **RISC** : Reduced Instruction Set Computer
- **32 bits** : Registres et adresses
- **Load/Store** : Calcul uniquement entre registres

> 💡 **En ARM :** Mêmes concepts, syntaxe très proche.

---

# CISC vs RISC

| CISC (x86) | RISC (ARM, A32) |
|:-----------|:----------------|
| Instructions complexes | Instructions simples |
| `ADD [mem], reg` OK | Calcul entre registres seulement |
| Vitesse variable | ~1 instruction/cycle |
| Plus facile à programmer | Plus facile à construire |

---

# La Règle Load/Store

En RISC, **jamais de calcul direct en mémoire** :

```
1. LOAD   : Mémoire → Registre
2. COMPUTE: Calcul dans registres
3. STORE  : Registre → Mémoire
```

**Exemple :** Incrémenter une variable
```asm
LDR R0, [R1]      ; Charger depuis mémoire
ADD R0, R0, #1    ; Ajouter 1
STR R0, [R1]      ; Stocker en mémoire
```

---

# Le Cycle Fetch-Decode-Execute

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│  FETCH  │───►│ DECODE  │───►│ EXECUTE │
│ Lire PC │    │ Analyser│    │  ALU    │
└─────────┘    └─────────┘    └─────────┘
     ▲                              │
     └──────────────────────────────┘
              PC++
```

Ce cycle se répète **à chaque instruction**.

---

# Les 16 Registres

| Registre | Alias | Rôle |
|:---------|:------|:-----|
| R0-R3 | — | Arguments, retours |
| R4-R11 | — | Variables locales |
| R12 | IP | Temporaire |
| **R13** | **SP** | Stack Pointer |
| **R14** | **LR** | Link Register |
| **R15** | **PC** | Program Counter |

---

# Registres Spéciaux

**R13 (SP)** : Pointe vers le sommet de la pile

**R14 (LR)** : Adresse de retour après `BL`

**R15 (PC)** : Adresse de l'instruction courante

```asm
MOV PC, LR    ; Équivalent à "return"
```

> 💡 **En ARM :** Organisation identique (ABI standard).

---

# La Carte Mémoire

```
0x00000000 ┌──────────────┐
           │   Code       │ Instructions
0x00200000 ├──────────────┤
           │   Données    │ Variables globales
0x00400000 ├──────────────┤
           │   Écran      │ MMIO
0x00402600 ├──────────────┤
           │   Clavier    │ MMIO
0xFFFFFFFF └──────────────┘
```

---

# Memory-Mapped I/O (MMIO)

Les périphériques sont des **adresses mémoire** :

**Écran :** `0x00400000` - 1 bit par pixel

**Clavier :** `0x00402600` - Code ASCII

```asm
; Allumer premier pixel
LDR R0, =0x00400000
MOV R1, #0x80
STRB R1, [R0]
```

---

# Format des Instructions (32 bits)

```
31   28 27   25 24                             0
┌──────┬───────┬─────────────────────────────────┐
│ Cond │ Class │     Données de l'instruction    │
└──────┴───────┴─────────────────────────────────┘
```

- **Cond (4 bits)** : Condition d'exécution
- **Class (3 bits)** : Type d'instruction

---

# Exécution Conditionnelle

Toute instruction peut être conditionnelle !

```asm
; Au lieu de :
CMP R0, #0
B.NE skip
MOV R1, #1
skip:

; On écrit :
CMP R0, #0
MOV.EQ R1, #1   ; Exécuté SI Z=1
```

---

# Codes de Condition

| Code | Suffixe | Condition |
|:----:|:--------|:----------|
| 0000 | EQ | Z = 1 (Égal) |
| 0001 | NE | Z = 0 (Différent) |
| 1010 | GE | N = V (≥ signé) |
| 1011 | LT | N ≠ V (< signé) |
| 1100 | GT | Z=0, N=V (> signé) |
| 1110 | AL | Toujours (défaut) |

---

# Classes d'Instructions

| Bits | Classe | Exemples |
|:-----|:-------|:---------|
| 000 | Data (reg) | ADD, SUB, AND, ORR |
| 001 | Data (imm) | ADD R0, R1, #42 |
| 010 | Load/Store | LDR, STR |
| 011 | Branch | B, BL |
| 111 | System | HALT |

---

# Instructions Arithmétiques

```asm
ADD Rd, Rn, Rm     ; Rd = Rn + Rm
ADD Rd, Rn, #imm   ; Rd = Rn + imm
SUB Rd, Rn, Rm     ; Rd = Rn - Rm
MUL Rd, Rn, Rm     ; Rd = Rn * Rm
```

**Suffixe S** : Met à jour les flags
```asm
ADDS R1, R2, R3   ; Modifie N, Z, C, V
ADD R1, R2, R3    ; Ne modifie PAS les flags
```

---

# Instructions Logiques

```asm
AND Rd, Rn, Rm     ; Rd = Rn & Rm
ORR Rd, Rn, Rm     ; Rd = Rn | Rm
EOR Rd, Rn, Rm     ; Rd = Rn ^ Rm
MVN Rd, Rm         ; Rd = ~Rm
MOV Rd, Rm         ; Rd = Rm
```

---

# Instructions de Comparaison

```asm
CMP Rn, Rm         ; Calcule Rn - Rm, modifie flags
CMP Rn, #imm       ; Compare avec immédiat
TST Rn, Rm         ; Calcule Rn & Rm, modifie flags
```

**CMP ne stocke pas le résultat**, seulement les flags !

---

# Accès Mémoire

```asm
LDR Rd, [Rn]       ; Rd = MEM[Rn]
LDR Rd, [Rn, #off] ; Rd = MEM[Rn + off]
STR Rd, [Rn]       ; MEM[Rn] = Rd
LDRB Rd, [Rn]      ; Charger 1 octet
STRB Rd, [Rn]      ; Stocker 1 octet
```

---

# Branchements

```asm
B label            ; Saut inconditionnel
BL label           ; Branch with Link (appel)
B.EQ label         ; Saut si égal
B.NE label         ; Saut si différent
B.GT label         ; Saut si > (signé)
B.LT label         ; Saut si < (signé)
```

---

# Appel de Fonction (BL)

```asm
main:
    BL ma_fonction  ; LR = PC+4, puis saute
    ; ... on revient ici

ma_fonction:
    ; ... code
    MOV PC, LR      ; Retour (saute à LR)
```

**BL** sauvegarde l'adresse de retour dans LR.

---

# La Pile (Stack)

```
    Adresses hautes
          │
          ▼
┌─────────────────┐
│    données      │
├─────────────────┤ ← SP
│   (libre)       │
└─────────────────┘
    Adresses basses
```

La pile **grandit vers le bas**.

---

# Push et Pop

```asm
; PUSH R0
SUB SP, SP, #4    ; Réserver place
STR R0, [SP]      ; Stocker

; POP R0
LDR R0, [SP]      ; Lire
ADD SP, SP, #4    ; Libérer place
```

---

# Exemple : Somme de 1 à 10

```asm
    MOV R0, #0       ; sum = 0
    MOV R1, #1       ; i = 1

loop:
    CMP R1, #10
    B.GT done        ; si i > 10, sortir
    ADD R0, R0, R1   ; sum += i
    ADD R1, R1, #1   ; i++
    B loop

done:
    HALT             ; R0 = 55
```

---

# Exemple : Max sans branchement

```asm
; R2 = max(R0, R1)
CMP R0, R1
MOV.GE R2, R0     ; Si R0 >= R1
MOV.LT R2, R1     ; Si R0 < R1
```

La prédication évite les branchements coûteux !

---

# Ce qu'il faut retenir

1. **ISA = contrat** matériel/logiciel
2. **RISC** : Load, Compute, Store
3. **16 registres** : R13=SP, R14=LR, R15=PC
4. **Tout est conditionnel** : ADD.EQ, MOV.GT
5. **MMIO** : Périphériques = adresses
6. **Fetch-Decode-Execute** : Le cycle CPU

---

# Questions ?

📚 **Référence :** Livre Seed, Chapitre 04 - Architecture

👉 **Exercices :** TD et TP sur le simulateur

**Prochain chapitre :** CPU (implémentation de l'ISA)
