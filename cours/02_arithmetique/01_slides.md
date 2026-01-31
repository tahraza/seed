---
marp: true
theme: seed-slides
paginate: true
header: "Seed - Chapitre 02"
footer: "Arithmétique Binaire"
---

# Chapitre 02 : Arithmétique Binaire

> "Les mathématiques sont le langage avec lequel Dieu a écrit l'univers." — Galilée

---

# 🎯 Où en sommes-nous ?

```
┌─────────────────────────────────┐
│  8. Applications                │
├─────────────────────────────────┤
│  ...                            │
├─────────────────────────────────┤
│  2. Arithmétique (ALU) ◀── NOUS │
├─────────────────────────────────┤
│  1. Portes Logiques ✓           │
└─────────────────────────────────┘
```

Nous combinons les portes pour construire l'**ALU** !

---

# Pourquoi l'Arithmétique ?

**Tout est calcul :**

- **Afficher une image** : Calculer la couleur de chaque pixel
- **Jouer un son** : Mélanger des formes d'onde
- **Exécuter un programme** : Calculer l'adresse de la prochaine instruction

L'**ALU** (Arithmetic Logic Unit) est le **cœur calculatoire** du CPU.

---

# Le Système Binaire

**Base 10 (décimal) :**
```
  4   2   7
  ↓   ↓   ↓
10² 10¹ 10⁰  →  4×100 + 2×10 + 7×1 = 427
```

**Base 2 (binaire) :**
```
Position :   3    2    1    0
Poids    :  2³   2²   2¹   2⁰
Valeur   :   8    4    2    1

Exemple : 1011₂ = 1×8 + 0×4 + 1×2 + 1×1 = 11₁₀
```

---

# Nombres dans nand2c (32 bits)

| Type | Plage | Exemples |
|------|-------|----------|
| **Non-signé** | 0 à 4 294 967 295 | Adresses mémoire, compteurs |
| **Signé** | -2 147 483 648 à +2 147 483 647 | Coordonnées, températures |

> 💡 **En ARM :** Les registres R0-R15 sont aussi sur 32 bits.

---

# Le Problème des Nombres Négatifs

**Question :** Comment représenter -5 avec seulement des 0 et 1 ?

**Solution naïve :** Bit de signe (0 = positif, 1 = négatif)
- Problème : Deux zéros (+0 et -0)
- Problème : Circuits différents pour addition et soustraction

**Solution brillante :** Le **Complément à 2**

---

# Complément à 2

**Pour obtenir -X à partir de X :**

1. **Inverser** tous les bits
2. **Ajouter 1**

**Exemple (4 bits) : Calculer -5**
```
  5 en binaire :   0101
  Inversion    :   1010
  Ajouter 1    : + 0001
                 ──────
  -5           :   1011
```

---

# Vérification : 5 + (-5) = 0

```
    0101   (5)
  + 1011   (-5)
  ──────
   10000   → Les 4 bits = 0000 ✓
```

La retenue est ignorée (on travaille sur 4 bits).

**Magie :** L'addition fonctionne identiquement pour les positifs et négatifs !

---

# Avantages du Complément à 2

1. **Un seul zéro** : `0000` uniquement
2. **Addition universelle** : Même circuit pour +/-
3. **Soustraction = Addition** : A - B = A + NOT(B) + 1

> 💡 **En VHDL :** Le type `signed` utilise automatiquement le complément à 2.

---

# L'Addition Binaire

**Règles de base (1 bit) :**
```
0 + 0 = 0  (pas de retenue)
0 + 1 = 1  (pas de retenue)
1 + 0 = 1  (pas de retenue)
1 + 1 = 10 (0 avec retenue 1)
```

Comme l'addition décimale, mais en base 2 !

---

# Exemple : 5 + 3 = 8

```
  Retenues :   1 1 1
              ─────
     5     :   0 1 0 1
  +  3     : + 0 0 1 1
            ─────────
     8     :   1 0 0 0
```

Colonne par colonne, de droite à gauche.

---

# Le Demi-Additionneur (Half Adder)

**Entrées :** a, b (1 bit chacun)
**Sorties :** sum (somme), carry (retenue)

| a | b | sum | carry |
|---|---|:---:|:-----:|
| 0 | 0 |  0  |   0   |
| 0 | 1 |  1  |   0   |
| 1 | 0 |  1  |   0   |
| 1 | 1 |  0  |   1   |

---

# Half Adder = XOR + AND

**Observation clé :**

- **sum** = XOR(a, b) — différent = 1
- **carry** = AND(a, b) — les deux à 1

```
       ┌─────┐
  a ───┤ XOR ├── sum
       │     │
  b ───┤     │
       └─────┘   ┌─────┐
                 │     │
  a ─────────────┤ AND ├── carry
  b ─────────────┤     │
                 └─────┘
```

---

# L'Additionneur Complet (Full Adder)

**Problème :** Half Adder ne peut pas recevoir de retenue !

**Full Adder :** 3 entrées (a, b, cin), 2 sorties (sum, cout)

| a | b | cin | sum | cout |
|---|---|:---:|:---:|:----:|
| 0 | 0 |  0  |  0  |  0   |
| 0 | 0 |  1  |  1  |  0   |
| 0 | 1 |  0  |  1  |  0   |
| ... | ... | ... | ... | ... |
| 1 | 1 |  1  |  1  |  1   |

---

# Construction du Full Adder

**2 Half Adders + 1 OR**

```
       ┌──────┐
  a ───┤      ├── s1 ──┬──┐
       │ HA1  │        │  │    ┌──────┐
  b ───┤      ├── c1 ──┼──┼────┤      │
       └──────┘        │  │    │ OR   ├── cout
                       │  │    │      │
       ┌──────┐        │  └────┤      │
 cin ──┤      ├── c2 ──┼───────┘      │
       │ HA2  │        │       └──────┘
  s1 ──┤      ├────────┴────────────── sum
       └──────┘
```

---

# Additionneur 32 bits (Ripple Carry)

**32 Full Adders en cascade :**

```
    a[0]  b[0]    a[1]  b[1]         a[31] b[31]
      │    │        │    │             │    │
    ┌─▼────▼─┐    ┌─▼────▼─┐         ┌─▼────▼─┐
0──►│  FA0   │───►│  FA1   │───►...──►│  FA31  │───► cout
    └───┬────┘    └───┬────┘         └───┬────┘
        │             │                  │
      y[0]          y[1]               y[31]
```

La retenue "ondule" (ripple) à travers tous les additionneurs.

---

# L'ALU : Le Cœur du CPU

L'**ALU** effectue TOUTES les opérations arithmétiques et logiques.

**Interface :**
- Entrées : a[31:0], b[31:0], op[3:0]
- Sorties : y[31:0], N, Z, C, V

**Principe :** Calculer TOUS les résultats, puis Mux pour choisir.

---

# Opérations de l'ALU

| op | Nom | Opération |
|:--:|:---:|:----------|
| 0000 | AND | a & b |
| 0001 | EOR | a ^ b |
| 0010 | SUB | a - b |
| 0011 | ADD | a + b |
| 0100 | ORR | a \| b |
| 0101 | MOV | b |
| 0110 | MVN | ~b |

---

# La Soustraction via Complément à 2

```
A - B = A + (-B) = A + NOT(B) + 1
```

**Implémentation :**
1. Inverser les bits de B
2. Additionner avec cin = 1

Même additionneur pour ADD et SUB !

---

# Les Drapeaux (Flags)

| Flag | Nom | Signification |
|:----:|:----|:--------------|
| **N** | Negative | Résultat négatif (bit 31 = 1) |
| **Z** | Zero | Résultat = 0 |
| **C** | Carry | Dépassement non-signé |
| **V** | Overflow | Dépassement signé |

> 💡 **En ARM :** Ces flags sont dans le registre CPSR.

---

# Calcul des Drapeaux

- **N** = bit 31 du résultat (facile !)
- **Z** = NOR de tous les bits (tous à 0 ?)
- **C** = retenue de sortie de l'additionneur
- **V** = overflow signé :
  - Deux positifs → négatif
  - Deux négatifs → positif

---

# Drapeaux et Branchements

| Instruction | Test | Usage |
|:------------|:-----|:------|
| B.EQ | Z = 1 | Égalité |
| B.NE | Z = 0 | Différence |
| B.LT | N ≠ V | Moins que (signé) |
| B.GE | N = V | Plus ou égal (signé) |
| B.LO | C = 0 | Moins que (non-signé) |
| B.HS | C = 1 | Plus ou égal (non-signé) |

---

# Exemple : CMP et Branchement

```asm
    CMP R0, R1      ; Calcule R0 - R1, met à jour flags
    B.EQ egaux      ; Si Z=1, sauter à 'egaux'
    B.LT plus_petit ; Si N≠V, sauter à 'plus_petit'
```

L'ALU fait la soustraction, les flags permettent la décision !

---

# Architecture de l'ALU

```
         a          b
         │          │
    ┌────┴────┐ ┌───┴───┐
    │         │ │ INV?  │ ← si SUB
    │         │ └───┬───┘
    │         │     │
┌───▼───┐ ┌───▼───┐ │
│  AND  │ │  ADD  │◄┘ cin=1 si SUB
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         │
    ┌────▼────┐
    │   MUX   │◄─── op
    └────┬────┘
         │
         y
```

---

# Du Half Adder à l'ALU

```
CHAPITRE 1          CHAPITRE 2
    ↓                    ↓
  NAND              Half Adder
    ↓                    ↓
XOR, AND, OR  →    Full Adder  →  Add32  →  ALU
Mux, DMux               ↓
                     Flags (N,Z,C,V)
```

---

# Ce qu'il faut retenir

1. **XOR + AND = Half Adder**
2. **2 Half Adders + OR = Full Adder**
3. **32 Full Adders = Additionneur 32-bits**
4. **Complément à 2 = Soustraction avec le même additionneur**
5. **Les Flags permettent les décisions (if, while)**

---

# Questions ?

📚 **Référence :** Livre Seed, Chapitre 02 - Arithmétique

👉 **Exercices :** TD et TP disponibles

**Prochain chapitre :** Mémoire (DFF, Registres, RAM)
