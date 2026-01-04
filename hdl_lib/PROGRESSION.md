# Progression Pédagogique : Du NAND au CPU

Ce guide présente le parcours d'apprentissage de la construction d'un CPU 32-bit
à partir de la porte NAND, suivant la philosophie de nand2tetris.

## Vue d'ensemble

```
Semaine 1-2: Portes logiques de base
    NAND → NOT → AND → OR → XOR → MUX → DMUX

Semaine 3: Portes multi-bits et multi-voies
    Not16 → And16 → Or16 → Mux16 → Mux4Way → Mux8Way → DMux4Way → DMux8Way
    Not32 → And32 → Or32 → Xor32 → Mux32 → Mux16Way32

Semaine 4: Arithmétique
    HalfAdder → FullAdder → Add32 → Sub32 → Shifter32 → ALU32

Semaine 5: Logique séquentielle
    DFF → Bit → Register → PC → RAM8 → RAM64 → RegFile16

Semaine 6: Architecture CPU
    Decoder → CondCheck → Control → CPU
```

---

## Projet 1 : Portes Logiques de Base

### Objectif
Construire toutes les portes logiques de base à partir du NAND.

### Fichiers
```
hdl_lib/00_primitive/Nand.hdl     -- Primitif (fourni)
hdl_lib/01_gates/Not.hdl          -- À implémenter
hdl_lib/01_gates/And.hdl          -- À implémenter
hdl_lib/01_gates/Or.hdl           -- À implémenter
hdl_lib/01_gates/Xor.hdl          -- À implémenter
hdl_lib/01_gates/Mux.hdl          -- À implémenter
hdl_lib/01_gates/DMux.hdl         -- À implémenter
```

### Exercices

**1.1 NOT** - Inverser un bit
```
a | y
--|--
0 | 1
1 | 0
```
Indice: `NOT(a) = NAND(a, a)`

**1.2 AND** - ET logique
```
a | b | y
--|---|--
0 | 0 | 0
0 | 1 | 0
1 | 0 | 0
1 | 1 | 1
```
Indice: `AND = NOT(NAND(a, b))`

**1.3 OR** - OU logique
```
a | b | y
--|---|--
0 | 0 | 0
0 | 1 | 1
1 | 0 | 1
1 | 1 | 1
```
Indice: Loi de De Morgan: `OR(a,b) = NOT(AND(NOT(a), NOT(b)))`

**1.4 XOR** - OU exclusif
```
a | b | y
--|---|--
0 | 0 | 0
0 | 1 | 1
1 | 0 | 1
1 | 1 | 0
```

**1.5 MUX** - Multiplexeur 2-vers-1
```
sel=0 → y=a
sel=1 → y=b
```

**1.6 DMUX** - Démultiplexeur 1-vers-2
```
sel=0 → a=in, b=0
sel=1 → a=0, b=in
```

---

## Projet 2 : Portes Multi-bits

### Objectif
Étendre les portes à 16 et 32 bits, et créer des multiplexeurs multi-voies.

### Fichiers
```
hdl_lib/02_multibit/Not16.hdl
hdl_lib/02_multibit/And16.hdl
hdl_lib/02_multibit/Or16.hdl
hdl_lib/02_multibit/Mux16.hdl
hdl_lib/02_multibit/Or8Way.hdl
hdl_lib/02_multibit/Mux4Way32.hdl
hdl_lib/02_multibit/Mux8Way32.hdl
hdl_lib/02_multibit/Mux16Way32.hdl
hdl_lib/02_multibit/DMux4Way.hdl
hdl_lib/02_multibit/DMux8Way.hdl
```

### Concept clé
Les opérations bit à bit s'appliquent indépendamment à chaque bit.
```
Not16(a) = [Not(a[0]), Not(a[1]), ..., Not(a[15])]
```

---

## Projet 3 : Arithmétique

### Objectif
Construire l'unité arithmétique et logique (ALU).

### Fichiers
```
hdl_lib/03_arith/HalfAdder.hdl    -- sum, carry
hdl_lib/03_arith/FullAdder.hdl   -- sum, cout avec cin
hdl_lib/03_arith/Add32.hdl       -- Additionneur 32-bit
hdl_lib/03_arith/Sub32.hdl       -- Soustracteur 32-bit
hdl_lib/03_arith/Shifter32.hdl   -- Barrel shifter
hdl_lib/03_arith/ALU32.hdl       -- ALU complète
```

### Half Adder
```
sum = a XOR b
carry = a AND b
```

### Full Adder
```
sum = a XOR b XOR cin
cout = (a AND b) OR (cin AND (a XOR b))
```

### Soustraction
La soustraction utilise le complément à deux:
```
a - b = a + NOT(b) + 1
```

### ALU32 - Opérations supportées
| op   | Opération |
|------|-----------|
| 0000 | AND       |
| 0001 | EOR (XOR) |
| 0010 | SUB       |
| 0011 | ADD       |
| 0100 | ORR       |
| 0101 | MOV       |
| 0110 | MVN       |
| 0111 | CMP       |
| 1000 | TST       |

---

## Projet 4 : Logique Séquentielle

### Objectif
Construire la mémoire : registres et RAM.

### Fichiers
```
hdl_lib/04_seq/DFF.hdl           -- D Flip-Flop (primitif)
hdl_lib/04_seq/Bit.hdl           -- 1-bit register avec load
hdl_lib/04_seq/Register.hdl      -- 32-bit register
hdl_lib/04_seq/PC.hdl            -- Program Counter
hdl_lib/04_seq/RAM8.hdl          -- 8 mots de 32 bits
hdl_lib/04_seq/RAM64.hdl         -- 64 mots
hdl_lib/04_seq/RegFile16.hdl     -- Banc de 16 registres
```

### D Flip-Flop
Le DFF est le bloc de base de la mémoire:
- Capture l'entrée `d` sur le front montant de `clk`
- Maintient la valeur entre les fronts d'horloge

### Bit Register avec Load
```
if load=1: q ← d (au prochain front)
if load=0: q ← q (maintient)
```

### RAM hiérarchique
```
RAM8 = 8 × Register (3-bit address)
RAM64 = 8 × RAM8 (6-bit address)
RAM4K = 64 × RAM64 (12-bit address)
```

---

## Projet 5 : Architecture CPU

### Objectif
Assembler le CPU A32-Lite complet.

### Fichiers
```
hdl_lib/05_cpu/CondCheck.hdl     -- Évaluation des conditions
hdl_lib/05_cpu/Decoder.hdl       -- Décodage d'instruction
hdl_lib/05_cpu/Control.hdl       -- Unité de contrôle
hdl_lib/05_cpu/CPU.hdl           -- CPU complet
```

### Architecture A32-Lite

**Registres**: R0-R15 (R13=SP, R14=LR, R15=PC)

**Flags**: N (négatif), Z (zéro), C (carry), V (overflow)

**Format d'instruction** (32 bits):
```
[31:28] cond    - Condition d'exécution
[27:25] class   - Classe d'instruction
[24:21] op      - Opération
[20]    S       - Update flags
[19:16] Rd      - Destination
[15:12] Rn      - Source 1
[11:0]  varies  - Selon la classe
```

**Classes d'instruction**:
- `000` : ALU registre
- `001` : ALU immédiat
- `010` : Load/Store
- `011` : Branch
- `100` : System

### Condition Codes
| cond | Nom | Condition        |
|------|-----|------------------|
| 0000 | EQ  | Z=1              |
| 0001 | NE  | Z=0              |
| 0010 | CS  | C=1              |
| 0011 | CC  | C=0              |
| 1010 | GE  | N=V              |
| 1011 | LT  | N≠V              |
| 1100 | GT  | Z=0 ∧ N=V        |
| 1101 | LE  | Z=1 ∨ N≠V        |
| 1110 | AL  | Toujours         |

---

## Tests et Validation

Chaque projet inclut des tests:

```bash
# Tester un composant HDL
cargo run -p hdl_cli -- hdl_lib/tests/And.tst

# Tester l'assembleur
cargo run -p a32_runner -- tests

# Tester le compilateur C
cargo run -p c32_runner -- tests_c
```

---

## Ressources

- `README.md` - Spécifications complètes
- `SPECS.md` - Format binaire et détails
- `TOOLS.md` - Guide des outils CLI
- `hdl_lib/` - Bibliothèque de composants HDL
