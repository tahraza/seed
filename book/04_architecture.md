# Architecture Machine (ISA A32)

> "Le langage est la limite de mon monde." — Wittgenstein

Nous avons maintenant des portes logiques, des additionneurs, et de la mémoire. Mais comment **commander** tout cela ? C'est le rôle de l'**Architecture de Jeu d'Instructions** (ISA - Instruction Set Architecture).

L'ISA est le **contrat** entre le matériel et le logiciel. C'est la liste de toutes les instructions que le CPU sait exécuter.

---

## Où en sommes-nous ?

```
┌─────────────────────────────────────────────────────────────────┐
│                     COUCHE 7: Applications                       │
├─────────────────────────────────────────────────────────────────┤
│                  COUCHE 6: Système d'Exploitation                │
├─────────────────────────────────────────────────────────────────┤
│                 COUCHE 5: Langage de Haut Niveau (C32)           │
├─────────────────────────────────────────────────────────────────┤
│                      COUCHE 4: Compilateur                       │
├─────────────────────────────────────────────────────────────────┤
│                   COUCHE 3: Assembleur (A32 ASM)                 │
├─────────────────────────────────────────────────────────────────┤
│  ══════════════► COUCHE 2: Architecture Machine (ISA) ◄════════ │
│          (Jeu d'instructions, Registres, Mémoire)                │
│                    (Vous êtes ici !)                             │
├─────────────────────────────────────────────────────────────────┤
│                    COUCHE 1: Logique Matérielle                  │
├─────────────────────────────────────────────────────────────────┤
│                     COUCHE 0: La Porte NAND                      │
└─────────────────────────────────────────────────────────────────┘
```

Ce chapitre marque une transition importante. Nous quittons temporairement le monde du matériel pour définir **l'interface** entre matériel et logiciel. L'ISA que nous définissons ici sera :
- **Implémentée** par le CPU au Chapitre 5
- **Utilisée** par l'assembleur au Chapitre 6
- **Ciblée** par le compilateur au Chapitre 7

---

## Qu'est-ce qu'une Architecture ?

### Le contrat fondamental

L'architecture d'un processeur définit :
1. **Les registres** : Combien ? Quelle taille ? Quel rôle ?
2. **Les instructions** : Quelles opérations le CPU peut-il faire ?
3. **L'encodage** : Comment les instructions sont-elles représentées en binaire ?
4. **Le modèle mémoire** : Comment le CPU voit-il la mémoire ?

C'est un **contrat** :
- Le matériel **promet** d'exécuter les instructions comme spécifié
- Le logiciel **s'engage** à n'utiliser que les instructions définies

### Codex A32 : Une architecture RISC moderne

L'architecture **Codex A32** est inspirée de ARM, l'architecture qui équipe la plupart des smartphones et le Raspberry Pi. Elle est :
- **RISC** (Reduced Instruction Set Computer) : Instructions simples et rapides
- **32 bits** : Registres et adresses sur 32 bits
- **Load/Store** : Le CPU ne calcule jamais directement en mémoire

---

## Pourquoi RISC ? L'architecture Load/Store

### CISC vs RISC

| CISC (x86, Intel) | RISC (ARM, Codex) |
|:------------------|:------------------|
| Instructions complexes | Instructions simples |
| `ADD [mem], reg` possible | Calcul uniquement entre registres |
| Vitesse variable par instruction | 1 instruction ≈ 1 cycle |
| Plus facile à programmer directement | Plus facile à implémenter en matériel |

### La règle d'or Load/Store

En architecture RISC, le CPU ne peut **jamais** calculer directement sur la mémoire. Toute opération suit le schéma :

```
1. LOAD  : Charger les données de la mémoire vers les registres
2. COMPUTE : Effectuer le calcul dans les registres
3. STORE : Stocker le résultat de retour en mémoire
```

**Exemple** : Incrémenter une variable en mémoire

```asm
LDR R0, [R1]      ; 1. Charger la valeur depuis l'adresse R1
ADD R0, R0, #1    ; 2. Ajouter 1
STR R0, [R1]      ; 3. Stocker le résultat
```

En x86 (CISC), on pourrait écrire `ADD [mem], 1` en une seule instruction. Mais le CPU RISC est plus simple à construire et peut aller plus vite.

---

## Le Cycle de Vie d'une Instruction

Chaque instruction traverse trois phases :

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│   ┌─────────┐      ┌─────────┐      ┌─────────┐                  │
│   │  FETCH  │ ──── │ DECODE  │ ──── │ EXECUTE │ ←────────────┐   │
│   │         │      │         │      │         │              │   │
│   │ Lire    │      │ Décoder │      │ Exécuter│              │   │
│   │ l'inst. │      │ les bits│      │ l'opér. │              │   │
│   │ à PC    │      │         │      │         │              │   │
│   └─────────┘      └─────────┘      └─────────┘              │   │
│                                           │                   │   │
│                                           └───────────────────┘   │
│                                             (cycle suivant)       │
└──────────────────────────────────────────────────────────────────┘
```

1. **Fetch** (Récupération)
   - Le CPU lit l'instruction à l'adresse contenue dans PC
   - PC est incrémenté pour pointer vers l'instruction suivante

2. **Decode** (Décodage)
   - Les 32 bits de l'instruction sont analysés
   - Le CPU identifie : quel opération ? quels registres ? quelle valeur immédiate ?

3. **Execute** (Exécution)
   - L'ALU effectue le calcul
   - Le résultat est stocké dans le registre de destination
   - Si c'est un branchement, PC peut être modifié

---

## Les Registres : Le Plan de Travail

Le CPU dispose de **16 registres** de 32 bits, nommés R0 à R15.

### Vue d'ensemble

```
┌────────────────────────────────────────────────────────────────┐
│                    Banc de Registres (32 bits × 16)            │
├────────┬────────┬────────┬────────┬────────┬────────┬────────┤
│   R0   │   R1   │   R2   │   R3   │   R4   │   R5   │   R6   │
│  Arg0  │  Arg1  │  Arg2  │  Arg3  │  Var   │  Var   │  Var   │
├────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│   R7   │   R8   │   R9   │  R10   │  R11   │  R12   │  R13   │
│  Var   │  Var   │  Var   │  Var   │  Var   │  Temp  │   SP   │
├────────┼────────┴────────┴────────┴────────┴────────┴────────┤
│  R14   │  R15                                                 │
│   LR   │   PC (Program Counter)                               │
└────────┴─────────────────────────────────────────────────────┘
```

### Rôles des registres

| Registre | Alias | Rôle conventionnel |
|:---------|:------|:-------------------|
| **R0-R3** | — | Arguments des fonctions et valeurs de retour |
| **R4-R11** | — | Variables locales (préservées par les fonctions) |
| **R12** | IP | Registre temporaire (Intra-Procedure call) |
| **R13** | **SP** | Stack Pointer — Pointe vers le sommet de la pile |
| **R14** | **LR** | Link Register — Adresse de retour après `BL` |
| **R15** | **PC** | Program Counter — Adresse de l'instruction courante |

### Le cas spécial de R15 (PC)

Le PC est accessible comme n'importe quel registre. Si vous écrivez dedans, vous forcez un saut !

```asm
MOV PC, R14    ; Équivalent à "return" : saute à l'adresse dans LR
ADD PC, PC, #8 ; Saute de 8 octets plus loin
```

C'est puissant mais dangereux — une erreur de calcul et le CPU saute n'importe où !

---

## La Carte Mémoire (Memory Map)

La mémoire est un espace linéaire de 4 Go (2³² octets), mais toutes les adresses ne sont pas utilisables.

### Organisation de la mémoire Codex

```
0xFFFFFFFF ┌────────────────────────────────┐
           │     MMIO (Entrées/Sorties)    │ ← Adresses spéciales (HALT, etc.)
0xFFFF0000 ├────────────────────────────────┤
           │                                │
           │          (Non utilisé)         │
           │                                │
0x00402600 ├────────────────────────────────┤
           │     Clavier (4 octets)        │ ← Lecture de la touche pressée
0x00402600 ├────────────────────────────────┤
           │                                │
           │     Écran (9600 octets)       │ ← 320×240 pixels, 1 bit par pixel
           │     (320×240/8 × 1 bit)       │   Écrire ici allume des pixels !
           │                                │
0x00400000 ├────────────────────────────────┤
           │                                │
           │       RAM Système             │ ← Code + Données + Pile
           │       (4 Mo)                  │
           │                                │
0x00000000 └────────────────────────────────┘
```

### Le Memory-Mapped I/O (MMIO)

En Codex (comme en ARM), les périphériques sont accessibles **comme de la mémoire**. Il n'y a pas d'instructions spéciales `IN`/`OUT`.

**L'écran** :
- Adresse : `0x00400000` à `0x00402580`
- Format : 1 bit par pixel, 40 octets par ligne
- Écrire un `1` à un bit = pixel blanc

**Le clavier** :
- Adresse : `0x00402600`
- Lire cette adresse donne le code ASCII de la touche pressée (ou 0)

**Exemple** : Allumer le premier pixel

```asm
LDR R0, =0x00400000   ; Adresse de l'écran
MOV R1, #0x80         ; Bit 7 = premier pixel de la ligne
STRB R1, [R0]         ; Écrire un octet
```

---

## Le Format des Instructions

Chaque instruction est encodée sur **32 bits**. La structure générale :

```
31   28 27   25 24                                             0
┌──────┬───────┬───────────────────────────────────────────────┐
│ Cond │ Class │              Données de l'instruction         │
└──────┴───────┴───────────────────────────────────────────────┘
```

### Les bits de condition (31-28)

**Fonctionnalité unique de ARM/Codex** : Toute instruction peut être conditionnelle !

Au lieu de :
```asm
CMP R0, #0
BNE skip
MOV R1, #1
skip:
```

On peut écrire :
```asm
CMP R0, #0
MOV.EQ R1, #1   ; Exécuté SEULEMENT si Z=1 (égal)
```

| Code | Suffixe | Condition | Signification |
|:----:|:--------|:----------|:--------------|
| 0000 | EQ | Z = 1 | Égal (Equal) |
| 0001 | NE | Z = 0 | Différent (Not Equal) |
| 0010 | CS/HS | C = 1 | Retenue (Carry Set) |
| 0011 | CC/LO | C = 0 | Pas de retenue (Carry Clear) |
| 1010 | GE | N = V | Plus grand ou égal (signé) |
| 1011 | LT | N ≠ V | Plus petit (signé) |
| 1100 | GT | Z=0 et N=V | Plus grand (signé) |
| 1101 | LE | Z=1 ou N≠V | Plus petit ou égal (signé) |
| 1110 | AL | (toujours) | Toujours exécuter (défaut) |

### Les classes d'instructions (27-25)

| Bits 27-25 | Classe | Description |
|:-----------|:-------|:------------|
| 000 | Data Processing (reg) | Opérations ALU avec registre |
| 001 | Data Processing (imm) | Opérations ALU avec immédiat |
| 010 | Load/Store | Accès mémoire (LDR, STR) |
| 011 | Branch | Branchements (B, BL) |
| 100 | Block Transfer | Push/Pop multiple (LDM, STM) |
| 111 | System | Instructions système (SVC, HALT) |

---

## Les Instructions en Détail

### A. Opérations Arithmétiques et Logiques

**Format général** : `OP{cond}{S} Rd, Rn, Operand2`

| Instruction | Opération | Exemple |
|:------------|:----------|:--------|
| `ADD` | Addition | `ADD R1, R2, R3` → R1 = R2 + R3 |
| `SUB` | Soustraction | `SUB R1, R2, #5` → R1 = R2 - 5 |
| `AND` | ET logique | `AND R1, R2, R3` → R1 = R2 & R3 |
| `ORR` | OU logique | `ORR R1, R2, R3` → R1 = R2 \| R3 |
| `EOR` | XOR | `EOR R1, R2, R3` → R1 = R2 ^ R3 |
| `MOV` | Copie | `MOV R1, R2` → R1 = R2 |
| `MVN` | Copie inversée | `MVN R1, R2` → R1 = ~R2 |
| `CMP` | Comparaison | `CMP R1, R2` → met à jour les flags |
| `TST` | Test bits | `TST R1, R2` → AND sans stocker |

**Le suffixe `S`** : Ajouter `S` met à jour les drapeaux NZCV.
```asm
ADDS R1, R2, R3   ; Met à jour les flags
ADD R1, R2, R3    ; Ne touche pas aux flags
```

### B. Accès Mémoire (Load/Store)

**Format général** : `LDR/STR{B} Rd, [Rn, #offset]`

| Instruction | Action | Exemple |
|:------------|:-------|:--------|
| `LDR` | Charger 32 bits | `LDR R0, [R1]` → R0 = MEM[R1] |
| `STR` | Stocker 32 bits | `STR R0, [R1]` → MEM[R1] = R0 |
| `LDRB` | Charger 8 bits | `LDRB R0, [R1]` → R0 = MEM[R1] (1 octet) |
| `STRB` | Stocker 8 bits | `STRB R0, [R1]` → MEM[R1] = R0 (1 octet) |

**Modes d'adressage** :
```asm
LDR R0, [R1]        ; Simple : adresse = R1
LDR R0, [R1, #4]    ; Offset : adresse = R1 + 4
LDR R0, [R1, R2]    ; Registre : adresse = R1 + R2
```

### C. Branchements

**Format** : `B{cond} label` ou `BL{cond} label`

| Instruction | Action |
|:------------|:-------|
| `B label` | Saut inconditionnel |
| `BL label` | Branch with Link (appel de fonction) |
| `BEQ label` | Saut si égal (Z=1) |
| `BNE label` | Saut si différent (Z=0) |
| `BLT label` | Saut si plus petit (signé) |
| `BGT label` | Saut si plus grand (signé) |

**Le mystère de `BL`** :
```asm
main:
    BL ma_fonction    ; 1. Sauvegarde PC+4 dans LR
                      ; 2. Saute à ma_fonction
    ; ... (on revient ici après le retour)

ma_fonction:
    ; ... faire quelque chose ...
    MOV PC, LR        ; Retour : saute à l'adresse dans LR
```

---

## La Pile (Stack)

La pile est une zone de mémoire utilisée pour :
- Sauvegarder les registres
- Stocker les variables locales
- Passer des arguments aux fonctions

### Fonctionnement

La pile **grandit vers le bas** (des adresses hautes vers les basses) :

```
       Adresses hautes
           │
           ▼
┌──────────────────┐
│  (données)       │
├──────────────────┤
│  (données)       │
├──────────────────┤ ← SP (Stack Pointer)
│                  │
│   (espace libre) │
│                  │
└──────────────────┘
       Adresses basses
```

### Push et Pop (manuel)

Codex n'a pas d'instructions `PUSH`/`POP` natives. On les simule :

```asm
; PUSH R0 (empiler R0)
SUB SP, SP, #4     ; Faire de la place (pile descend)
STR R0, [SP]       ; Stocker R0 au sommet

; POP R0 (dépiler dans R0)
LDR R0, [SP]       ; Lire depuis le sommet
ADD SP, SP, #4     ; Libérer l'espace
```

---

## Exemples de Programmes

### Exemple 1 : Somme de 1 à N

```asm
; Calcule 1 + 2 + ... + 10
.text
.global _start

_start:
    MOV R0, #0       ; sum = 0
    MOV R1, #1       ; i = 1

loop:
    CMP R1, #10
    BGT done         ; si i > 10, sortir
    ADD R0, R0, R1   ; sum += i
    ADD R1, R1, #1   ; i++
    B loop

done:
    ; R0 contient 55
    HALT
```

### Exemple 2 : Maximum de deux nombres (avec prédication)

```asm
; R2 = max(R0, R1) sans branchement
CMP R0, R1
MOV.GE R2, R0     ; Si R0 >= R1, R2 = R0
MOV.LT R2, R1     ; Si R0 < R1, R2 = R1
```

### Exemple 3 : Dessiner un pixel

```asm
; Allumer le pixel (10, 20)
; Adresse = 0x00400000 + (y * 40) + (x / 8)
; Bit = 7 - (x % 8)

LDR R0, =0x00400000  ; Base de l'écran
MOV R1, #20          ; y = 20
MOV R2, #40          ; octets par ligne
MUL R1, R1, R2       ; offset_y = y * 40
ADD R0, R0, R1       ; adresse_ligne

MOV R1, #10          ; x = 10
MOV R2, R1, LSR #3   ; x / 8
ADD R0, R0, R2       ; adresse finale

AND R1, R1, #7       ; x % 8
RSB R1, R1, #7       ; 7 - (x % 8)
MOV R2, #1
LSL R2, R2, R1       ; masque = 1 << bit_pos

LDRB R3, [R0]        ; Lire l'octet actuel
ORR R3, R3, R2       ; Allumer le bit
STRB R3, [R0]        ; Écrire l'octet
```

---

## Gestion des Erreurs (Traps)

Si le CPU rencontre une situation invalide, il déclenche une **trap** :

| Trap | Cause |
|:-----|:------|
| `ILLEGAL` | Instruction invalide (opcode inconnu) |
| `MEM_FAULT` | Accès à une adresse non mappée |
| `MISALIGNED` | Accès 32-bits à une adresse non alignée (ex: 0x3) |
| `DIV_ZERO` | Division par zéro |

---

## Exercices Pratiques

### Exercices sur le Simulateur Web

Lancez le **Simulateur Web** et allez dans **A32 Assembly**.

| Exercice | Description | Difficulté |
|----------|-------------|:----------:|
| `Hello World` | Afficher du texte | ⭐ |
| `Addition` | Additionner deux registres | ⭐ |
| `Soustraction` | Soustraire avec le drapeau | ⭐ |
| `Logique` | Opérations AND, OR, XOR | ⭐ |
| `Conditions` | Utiliser les branches conditionnelles | ⭐⭐ |
| `Boucles` | Implémenter une boucle while | ⭐⭐ |
| `Multiplication` | Multiplier par additions successives | ⭐⭐ |
| `Fibonacci` | Calculer la suite de Fibonacci | ⭐⭐ |
| `Tableaux` | Parcourir un tableau en mémoire | ⭐⭐ |
| `Maximum Tableau` | Trouver le max dans un tableau | ⭐⭐⭐ |
| `Fonctions` | Appeler des fonctions avec BL | ⭐⭐⭐ |
| `Pixel` | Allumer un pixel à l'écran | ⭐⭐ |
| `Ligne` | Dessiner une ligne | ⭐⭐⭐ |
| `Rectangle` | Dessiner un rectangle | ⭐⭐⭐ |
| `Lire un Caractère` | Lire le clavier | ⭐⭐ |

### Tests en ligne de commande

```bash
# Assembler un fichier
cargo run -p a32_cli -- assemble mon_prog.s -o mon_prog.bin

# Exécuter un binaire
cargo run -p a32_runner -- mon_prog.bin
```

---

## Ce qu'il faut retenir

1. **L'ISA est un contrat** : Entre le matériel et le logiciel

2. **RISC = Simple** : Load, Compute, Store — jamais de calcul direct en mémoire

3. **16 registres** : R0-R12 généraux, R13=SP, R14=LR, R15=PC

4. **Tout est conditionnel** : `ADD.EQ`, `MOV.GT` évitent les branchements

5. **Memory-Mapped I/O** : L'écran et le clavier sont des adresses mémoire

6. **Le cycle Fetch-Decode-Execute** : Le cœur battant du CPU

**Prochaine étape** : Au Chapitre 5, nous construirons le CPU qui **implémente** cette architecture. Vous verrez comment les circuits du Chapitre 1-3 sont combinés pour exécuter ces instructions.

---

**Conseil** : Passez du temps sur le simulateur web à écrire des programmes en assembleur. Comprendre l'assembleur vous aidera énormément à comprendre le compilateur plus tard !
