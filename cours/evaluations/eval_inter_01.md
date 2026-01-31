---
marp: true
theme: seed-td
paginate: true
header: "Seed - Évaluation Intermédiaire 1"
---

# Évaluation Intermédiaire 1

## Logique Booléenne & Arithmétique Binaire

**Chapitres couverts :** 00, 01, 02

**Durée :** 1h00
**Documents autorisés :** Aucun
**Barème :** 20 points

---

## Partie A : QCM (5 points)

**Consignes :** Une seule réponse correcte par question. +1 point par bonne réponse, 0 si faux.

---

### Question 1

Quelle porte logique donne 1 uniquement si **toutes** ses entrées sont à 1 ?

- [ ] A. OR
- [ ] B. AND
- [ ] C. XOR
- [ ] D. NOT

---

### Question 2

La porte NAND est qualifiée de "porte universelle" car :

- [ ] A. Elle est la plus rapide à fabriquer
- [ ] B. On peut construire toutes les autres portes avec elle
- [ ] C. Elle consomme moins d'énergie
- [ ] D. Elle a plus d'entrées que les autres

---

### Question 3

Quel est le résultat de `NOT(A AND B)` quand A=1 et B=0 ?

- [ ] A. 0
- [ ] B. 1
- [ ] C. Indéterminé
- [ ] D. Dépend du circuit

---

### Question 4

En binaire non signé sur 4 bits, quelle est la valeur maximale représentable ?

- [ ] A. 8
- [ ] B. 15
- [ ] C. 16
- [ ] D. 255

---

### Question 5

Que signifie le flag Z (Zero) dans une ALU ?

- [ ] A. Le résultat est zéro
- [ ] B. Un overflow s'est produit
- [ ] C. Le résultat est négatif
- [ ] D. Une retenue a été générée

---

## Partie B : Logique Booléenne (7 points)

---

### Exercice 1 : Table de vérité (2 points)

Complétez la table de vérité pour l'expression : `Y = (A AND B) OR (NOT A)`

| A | B | A AND B | NOT A | Y |
|:-:|:-:|:-------:|:-----:|:-:|
| 0 | 0 | | | |
| 0 | 1 | | | |
| 1 | 0 | | | |
| 1 | 1 | | | |

---

### Exercice 2 : Construction avec NAND (3 points)

Montrez comment construire une porte **OR** en utilisant uniquement des portes NAND.

1. Dessinez le circuit (schéma ou description textuelle)
2. Justifiez avec une table de vérité

*Rappel : NAND(A,B) = NOT(A AND B)*

---

### Exercice 3 : Simplification (2 points)

Simplifiez l'expression booléenne suivante :

```
F = (A AND B) OR (A AND NOT B)
```

Montrez les étapes de simplification.

---

## Partie C : Arithmétique Binaire (8 points)

---

### Exercice 4 : Conversions (2 points)

Effectuez les conversions suivantes :

a) Décimal → Binaire (8 bits) : **42**

b) Binaire → Décimal : **10110011**

c) Binaire → Hexadécimal : **11011010**

d) Hexadécimal → Binaire : **0x5A**

---

### Exercice 5 : Addition binaire (2 points)

Calculez en binaire sur 8 bits :

```
  01011010
+ 00110101
----------
```

Indiquez s'il y a une retenue finale (Carry out).

---

### Exercice 6 : Half Adder et Full Adder (2 points)

a) Quelle est la différence entre un Half Adder et un Full Adder ?

b) Combien de Full Adders faut-il pour additionner deux nombres de 8 bits ?

---

### Exercice 7 : ALU (2 points)

Une ALU effectue l'opération `SUB R1, R2, R3` (R1 = R2 - R3) avec :
- R2 = 5 (décimal)
- R3 = 8 (décimal)

a) Quel est le résultat en décimal signé (complément à deux sur 8 bits) ?

b) Quels flags (N, Z, C, V) seront activés ?

---

## Barème Détaillé

| Partie | Points |
|:-------|:------:|
| A. QCM (5 questions × 1pt) | 5 |
| B. Ex1 Table de vérité | 2 |
| B. Ex2 OR avec NAND | 3 |
| B. Ex3 Simplification | 2 |
| C. Ex4 Conversions | 2 |
| C. Ex5 Addition | 2 |
| C. Ex6 Adders | 2 |
| C. Ex7 ALU | 2 |
| **Total** | **20** |

---

## Notes pour la Correction

### Partie A - Réponses QCM

1. **B** (AND)
2. **B** (universalité)
3. **B** (NOT(0) = 1)
4. **B** (15 = 2⁴ - 1)
5. **A** (résultat zéro)

---

### Partie B - Solutions

**Ex1 :**
| A | B | A AND B | NOT A | Y |
|:-:|:-:|:-------:|:-----:|:-:|
| 0 | 0 | 0 | 1 | 1 |
| 0 | 1 | 0 | 1 | 1 |
| 1 | 0 | 0 | 0 | 0 |
| 1 | 1 | 1 | 0 | 1 |

---

**Ex2 :** OR avec NAND
```
OR(A,B) = NAND(NAND(A,A), NAND(B,B))
        = NAND(NOT A, NOT B)
```

**Ex3 :**
```
F = A AND (B OR NOT B) = A AND 1 = A
```

---

### Partie C - Solutions

**Ex4 :**
- a) 42 = 00101010
- b) 10110011 = 179
- c) 11011010 = 0xDA
- d) 0x5A = 01011010

**Ex5 :**
```
  01011010 (90)
+ 00110101 (53)
= 10001111 (143)
```
Pas de retenue finale.

---

**Ex6 :**
- a) Half Adder : 2 entrées (A, B), pas de Carry In
      Full Adder : 3 entrées (A, B, Cin)
- b) 8 Full Adders (un par bit)

**Ex7 :**
- a) 5 - 8 = -3 (en complément à deux : 11111101)
- b) N=1 (négatif), Z=0, C=0 (pas de retenue), V=0 (pas d'overflow)

---

*Fin de l'évaluation*

