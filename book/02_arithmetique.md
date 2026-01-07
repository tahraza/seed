# Arithmétique Binaire

> "Les mathématiques sont le langage avec lequel Dieu a écrit l'univers." — Galilée

Dans le chapitre précédent, nous avons appris à manipuler des bits individuels avec des portes logiques. Mais un ordinateur doit savoir compter ! Comment passer de simples portes logiques à une calculatrice capable d'additionner des nombres à 32 bits ?

---

## Où en sommes-nous ?

![Position dans l'architecture](images/architecture-stack.svg)

*Nous sommes à la Couche 1 : Logique Matérielle (Portes logiques - ALU, RAM, CPU)*

Nous sommes toujours dans la couche matérielle, mais nous montons d'un niveau. Nous allons combiner les portes logiques du Chapitre 1 pour construire des circuits arithmétiques, culminant avec l'**ALU** (Arithmetic Logic Unit) — le composant qui effectue TOUS les calculs du processeur.

---

## Pourquoi l'Arithmétique est-elle si Importante ?

### Au cœur de tout calcul

Regardez ce que fait un ordinateur :

- **Afficher une image** : Calculer la couleur de chaque pixel (additions, multiplications)
- **Jouer un son** : Mélanger des formes d'onde (additions)
- **Naviguer sur le web** : Calculer des checksums, décompresser des données
- **Exécuter un programme** : Calculer l'adresse de la prochaine instruction (addition)

Même les opérations les plus "abstraites" se réduisent finalement à des opérations arithmétiques sur des nombres binaires. L'ALU que vous allez construire est le moteur qui fait tourner TOUT.

### Ce que nous allons construire

![Feuille de route : des portes à l'ALU](images/build-roadmap.svg)

À la fin de ce chapitre, vous aurez construit une ALU capable d'effectuer :
- Addition et soustraction
- ET, OU, XOR logiques
- Comparaisons (via les drapeaux)

---

## Représentation des Nombres

### Le Système Binaire (Base 2)

Avant de construire des additionneurs, comprenons comment les nombres sont représentés.

En décimal (base 10), chaque position représente une puissance de 10 :
```
  4   2   7
  ↓   ↓   ↓
10² 10¹ 10⁰  →  4×100 + 2×10 + 7×1 = 427
```

En binaire (base 2), chaque position représente une puissance de 2 :
```
Position :   3    2    1    0
Poids    :  2³   2²   2¹   2⁰
Valeur   :   8    4    2    1

Exemple : 1011₂ = 1×8 + 0×4 + 1×2 + 1×1 = 11₁₀
```

### Taille des nombres dans Codex

Notre ordinateur Codex travaille sur **32 bits**. Cela signifie :
- **Plage non-signée** : 0 à 2³² - 1 = 4 294 967 295 (≈ 4 milliards)
- **Plage signée** : -2 147 483 648 à 2 147 483 647 (≈ ±2 milliards)

C'est suffisant pour :
- Adresser 4 Go de mémoire (chaque octet a une adresse unique)
- Représenter des coordonnées d'écran, des scores de jeux, des compteurs

### Les Nombres Négatifs : Le Complément à 2

Comment représenter des nombres négatifs avec seulement des 0 et des 1 ?

**Le problème** : On pourrait utiliser un bit de signe (0 = positif, 1 = négatif), mais alors on aurait besoin de circuits différents pour l'addition et la soustraction, et on aurait deux représentations du zéro (+0 et -0).

**La solution brillante** : Le **Complément à 2**.

Le bit le plus à gauche (bit 31, le MSB) est le "bit de signe" :
- `0` → le nombre est positif ou nul
- `1` → le nombre est négatif

Mais attention, ce n'est pas un simple bit de signe ! Le système est conçu pour que **l'addition fonctionne de la même manière** que le nombre soit positif ou négatif.

### Comment obtenir le complément à 2 (la valeur négative) ?

Pour obtenir -X à partir de X :
1. **Inverser** tous les bits de X (0→1, 1→0)
2. **Ajouter 1** au résultat

**Exemple sur 4 bits** : Calculons -5

```
  5 en binaire :   0101
  Inversion    :   1010
  Ajouter 1    : + 0001
                 ──────
  -5           :   1011
```

**Vérification** : 5 + (-5) devrait donner 0
```
    0101   (5)
  + 1011   (-5)
  ──────
   10000   → Les 4 bits de poids faible sont 0000 OK
            (La retenue "1" est ignorée car on travaille sur 4 bits)
```

### Pourquoi le complément à 2 est-il génial ?

1. **Un seul zéro** : 0000 est le seul zéro (pas de +0 et -0)
2. **L'addition fonctionne universellement** : Le même circuit additionne les positifs et les négatifs
3. **La soustraction devient une addition** : A - B = A + (-B) = A + NOT(B) + 1

C'est grâce au complément à 2 que notre ALU peut être relativement simple !

---

## L'Addition Binaire

L'addition binaire suit les mêmes règles que l'addition décimale qu'on apprend à l'école : on additionne colonne par colonne, de droite à gauche, en propageant les retenues.

### Les règles de base (sur 1 bit)

```
0 + 0 = 0  (pas de retenue)
0 + 1 = 1  (pas de retenue)
1 + 0 = 1  (pas de retenue)
1 + 1 = 10 (c'est-à-dire 0 avec une retenue de 1)
```

### Exemple d'addition sur 4 bits

Calculons 5 + 3 = 8 :

```
  Retenues :   1 1 1
              ─────
     5     :   0 1 0 1
  +  3     : + 0 0 1 1
            ─────────
     8     :   1 0 0 0
```

Détail colonne par colonne (de droite à gauche) :

- Colonne 0 : 1 + 1 = 0, retenue 1
- Colonne 1 : 0 + 1 + 1(retenue) = 0, retenue 1
- Colonne 2 : 1 + 0 + 1(retenue) = 0, retenue 1
- Colonne 3 : 0 + 0 + 1(retenue) = 1

Résultat : 1000₂ = 8₁₀ OK

---

## Le Demi-Additionneur (Half Adder)

Le demi-additionneur est le circuit le plus simple pour additionner deux bits. Il produit :
- **sum** : La somme (bit de poids faible)
- **carry** : La retenue (bit de poids fort)

### Table de vérité

| a | b | sum | carry |
|---|---|:---:|:-----:|
| 0 | 0 |  0  |   0   |
| 0 | 1 |  1  |   0   |
| 1 | 0 |  1  |   0   |
| 1 | 1 |  0  |   1   |

### L'insight clé

Regardez attentivement les colonnes :
- **sum** correspond exactement à **XOR(a, b)** — différent = 1, identique = 0
- **carry** correspond exactement à **AND(a, b)** — les deux à 1 = retenue

C'est pour cela que nous avons construit XOR et AND au Chapitre 1 !

### Schéma du circuit

![Demi-additionneur](images/half-adder.svg)

### Limitation

Le demi-additionneur ne peut pas recevoir de retenue d'une colonne précédente. Il ne fonctionne donc que pour le bit de poids faible (la première colonne).

---

## L'Additionneur Complet (Full Adder)

Pour additionner des nombres de plusieurs bits, chaque colonne (sauf la première) doit pouvoir accepter une retenue venant de la colonne précédente.

### Interface

![Additionneur complet](images/full-adder.svg)

### Table de vérité

| a | b | cin | sum | cout |
|---|---|:---:|:---:|:----:|
| 0 | 0 |  0  |  0  |  0   |
| 0 | 0 |  1  |  1  |  0   |
| 0 | 1 |  0  |  1  |  0   |
| 0 | 1 |  1  |  0  |  1   |
| 1 | 0 |  0  |  1  |  0   |
| 1 | 0 |  1  |  0  |  1   |
| 1 | 1 |  0  |  0  |  1   |
| 1 | 1 |  1  |  1  |  1   |

### Comment le construire ?

Un Full Adder peut être construit avec **deux Half Adders et une porte OR** :

1. Le premier Half Adder additionne `a` et `b`
2. Le second Half Adder additionne le résultat avec `cin`
3. Si l'un des deux Half Adders produit une retenue, on a une retenue finale

![Construction du Full Adder](images/full-adder-construction.svg)

Formules :

- `s1 = XOR(a, b)`
- `sum = XOR(s1, cin)`
- `c1 = AND(a, b)`
- `c2 = AND(s1, cin)`
- `cout = OR(c1, c2)`

---

## L'Additionneur 32-bits (Ripple Carry Adder)

Pour additionner des nombres de 32 bits, nous connectons 32 Full Adders en cascade. La retenue de sortie de chaque additionneur devient la retenue d'entrée du suivant.

### Schéma simplifié

![Additionneur 32 bits à propagation de retenue](images/ripple-carry-adder.svg)

**Note** : Le premier Full Adder (position 0) a une retenue d'entrée de 0 pour une addition normale. Mais on peut y injecter un 1 pour implémenter la soustraction (A + NOT(B) + 1).

### Le compromis du Ripple Carry

**Avantage** : Très simple à comprendre et à implémenter.

**Inconvénient** : Les retenues se propagent d'un bout à l'autre. Pour 32 bits, la retenue doit traverser 32 étages. C'est lent !

Dans les vrais processeurs, on utilise des techniques comme le "Carry Lookahead Adder" pour accélérer la propagation. Mais pour notre projet pédagogique, le Ripple Carry est parfait.

---

## L'ALU (Arithmetic Logic Unit)

L'ALU est le **cœur calculatoire** du processeur. C'est elle qui effectue TOUTES les opérations arithmétiques et logiques.

### Pourquoi combiner arithmétique et logique ?

Plutôt que d'avoir des circuits séparés pour l'addition, la soustraction, le AND, le OR, etc., l'ALU combine tout en un seul composant. Un signal de contrôle (`op`) lui dit quelle opération effectuer.

### Interface de l'ALU Codex

![Interface de l'ALU](images/alu-interface.svg)

### Les Opérations de l'ALU

Le signal `op` (4 bits) définit l'opération à effectuer :

| op (binaire) | Nom | Opération | Description |
|:------------:|:---:|:---------:|:------------|
| 0000 | AND | `a & b` | ET logique bit à bit |
| 0001 | EOR | `a ^ b` | OU exclusif bit à bit |
| 0010 | SUB | `a - b` | Soustraction |
| 0011 | ADD | `a + b` | Addition |
| 0100 | ORR | `a \| b` | OU logique bit à bit |
| 0101 | MOV | `b` | Copie de b (ignore a) |
| 0110 | MVN | `~b` | Inversion de b (NOT) |

### Comment implémenter la soustraction ?

Grâce au complément à 2, la soustraction devient une addition :

```
A - B = A + (-B) = A + (NOT B) + 1
```

En pratique :

1. Inverser tous les bits de B (avec des portes NOT)
2. Additionner A et NOT(B) avec une retenue d'entrée de 1

C'est pour cela que notre additionneur a une entrée `cin` !

### Les Drapeaux (Flags)

Les drapeaux sont des informations supplémentaires sur le résultat :

| Drapeau | Nom | Signification |
|:-------:|:----|:--------------|
| **N** | Negative | 1 si le résultat est négatif (bit 31 = 1) |
| **Z** | Zero | 1 si le résultat est exactement 0 |
| **C** | Carry | 1 s'il y a eu une retenue (dépassement non-signé) |
| **V** | Overflow | 1 s'il y a eu un dépassement signé |

**À quoi servent ces drapeaux ?**

Ils permettent au CPU de prendre des décisions :

- `BEQ` (Branch if Equal) teste si Z = 1
- `BLT` (Branch if Less Than) teste une combinaison de N et V
- `BCS` (Branch if Carry Set) teste si C = 1

Sans les drapeaux, il serait impossible d'implémenter les conditions `if`, les boucles `while`, etc. !

### Comment calculer les drapeaux ?

- **N (Negative)** : C'est simplement le bit 31 du résultat
- **Z (Zero)** : NOR de tous les bits du résultat (tous à 0 ?)
- **C (Carry)** : La retenue de sortie de l'additionneur
- **V (Overflow)** : Se produit quand :
  - Deux positifs donnent un négatif
  - Deux négatifs donnent un positif
  - Formule : `V = (a[31] == b[31]) AND (a[31] != y[31])` (pour l'addition)

### Quand Utiliser Chaque Drapeau ?

C'est la question cruciale ! Les drapeaux ont des significations différentes selon qu'on travaille en **signé** ou **non-signé**.

#### Arithmétique Non-Signée (unsigned)

Pour des nombres non-signés (0 à 2³²-1), utilisez **C** et **Z** :

| Condition | Test | Explication |
|-----------|------|-------------|
| a == b | Z = 1 | Résultat de a - b est zéro |
| a != b | Z = 0 | Résultat non nul |
| a < b | C = 0 | Pas de retenue → emprunt |
| a >= b | C = 1 | Retenue présente → pas d'emprunt |
| a > b | C = 1 ET Z = 0 | Pas d'emprunt et non égal |
| a <= b | C = 0 OU Z = 1 | Emprunt ou égal |

**Pourquoi C ?** En soustraction non-signée, si a < b, le résultat "wrappe" (passe par 0) et il n'y a pas de retenue. Si a >= b, la soustraction ne wrappe pas et produit une retenue.

#### Arithmétique Signée (signed)

Pour des nombres signés (-2³¹ à 2³¹-1), utilisez **N**, **V**, et **Z** :

| Condition | Test | Explication |
|-----------|------|-------------|
| a == b | Z = 1 | Résultat de a - b est zéro |
| a != b | Z = 0 | Résultat non nul |
| a < b | N ≠ V | Voir explication ci-dessous |
| a >= b | N = V | L'inverse |
| a > b | Z = 0 ET N = V | Non égal et pas moins que |
| a <= b | Z = 1 OU N ≠ V | Égal ou moins que |

**Pourquoi N ≠ V pour "moins que" ?**

C'est subtil mais élégant. Après `a - b` :

1. **Sans overflow (V = 0)** : Le signe du résultat est fiable
   - Si N = 1 (négatif) → a < b ✓
   - Si N = 0 (positif) → a >= b ✓

2. **Avec overflow (V = 1)** : Le signe est **inversé** !
   - Si N = 1 mais V = 1 → En réalité a >= b (l'overflow a inversé le signe)
   - Si N = 0 mais V = 1 → En réalité a < b

Donc : `a < b` ⟺ (N = 1 et V = 0) OU (N = 0 et V = 1) ⟺ **N ≠ V**

#### Table de Référence des Branchements

| Instruction | Signification | Flags testés | Signé/Non-signé |
|-------------|---------------|--------------|-----------------|
| BEQ | Equal | Z = 1 | Les deux |
| BNE | Not Equal | Z = 0 | Les deux |
| BCS/BHS | Carry Set / Higher or Same | C = 1 | Non-signé |
| BCC/BLO | Carry Clear / Lower | C = 0 | Non-signé |
| BHI | Higher | C = 1 et Z = 0 | Non-signé |
| BLS | Lower or Same | C = 0 ou Z = 1 | Non-signé |
| BGE | Greater or Equal | N = V | Signé |
| BLT | Less Than | N ≠ V | Signé |
| BGT | Greater Than | Z = 0 et N = V | Signé |
| BLE | Less or Equal | Z = 1 ou N ≠ V | Signé |
| BMI | Minus (negative) | N = 1 | — |
| BPL | Plus (positive/zero) | N = 0 | — |
| BVS | Overflow Set | V = 1 | — |
| BVC | Overflow Clear | V = 0 | — |

#### Exemple Pratique : Comparaison

```asm
; Comparer deux nombres signés
    CMP R0, R1      ; Calcule R0 - R1, met à jour les flags
    BLT moins       ; Si R0 < R1 (signé), sauter

; Comparer deux nombres non-signés
    CMP R2, R3      ; Calcule R2 - R3, met à jour les flags
    BLO moins_u     ; Si R2 < R3 (non-signé), sauter
```

**Attention** : Utiliser BLT pour du non-signé ou BLO pour du signé donne des résultats incorrects !

```
Exemple : R0 = 0xFFFFFFFF, R1 = 0x00000001
- En non-signé : 4294967295 > 1 → BHI pris, BLO non pris ✓
- En signé : -1 < 1 → BLT pris, BGE non pris ✓
```

---

## Architecture de l'ALU

Voici comment l'ALU est structurée en interne :

![Architecture de l'ALU](images/alu-architecture.svg)

L'idée clé : calculer TOUS les résultats possibles en parallèle, puis utiliser un multiplexeur pour sélectionner le bon selon `op`.

---

## Exercices Pratiques

### Exercices sur le Simulateur Web

Lancez le **Simulateur Web** et allez dans **HDL Progression** → **Projet 3 : Arithmétique**.

| Exercice | Description | Difficulté |
|----------|-------------|:----------:|
| `HalfAdder` | Demi-additionneur (XOR + AND) | [*] |
| `FullAdder` | Additionneur complet (2 Half Adders + OR) | [**] |
| `Add16` | Additionneur 16 bits en cascade | [**] |
| `Inc16` | Incrémenteur (+1) — cas spécial utile | [*] |
| `Sub16` | Soustracteur (via complément à 2) | [**] |
| `ALU` | L'ALU complète avec drapeaux | [***] |

### Conseils pour l'ALU

1. **Commencez par les opérations simples** : AND, OR, XOR sont juste des portes appliquées bit à bit

2. **Pour la soustraction** :
   ```
   sub = a + (NOT b) + 1
   ```
   Utilisez un inverseur sur b et une retenue d'entrée de 1

3. **Utilisez les Mux** : Un Mux4Way ou Mux8Way sélectionne parmi plusieurs résultats

4. **Les drapeaux** :
   - N : bit 31 du résultat
   - Z : tous les bits sont à 0 ? (utilisez un grand OR puis NOT)
   - C : retenue de sortie de l'additionneur
   - V : comparez les signes des entrées et du résultat

### Tests en ligne de commande

```bash
# Tester le Half Adder
cargo run -p hdl_cli -- test hdl_lib/03_arith/HalfAdder.hdl

# Tester l'ALU complète
cargo run -p hdl_cli -- test hdl_lib/03_arith/ALU.hdl
```

---

## Défis Supplémentaires

### Défi 1 : Carry Lookahead

Le Ripple Carry est lent car les retenues se propagent séquentiellement. Implémentez un "Carry Lookahead Adder" sur 4 bits qui calcule les retenues en parallèle.

### Défi 2 : Multiplicateur

Construisez un circuit qui multiplie deux nombres de 4 bits. Indice : la multiplication est une série d'additions décalées.

### Défi 3 : Comparateur

Construisez un circuit qui compare deux nombres 32 bits et produit trois sorties :

/bin/bash: ligne 1: q : commande introuvable
- `eq` : a == b
- `gt` : a > b

Indice : Vous pouvez utiliser la soustraction et regarder les drapeaux !

---

## Le Lien avec le CPU

L'ALU que vous venez de construire sera utilisée à CHAQUE cycle d'horloge du CPU :

| Instruction | Utilisation de l'ALU |
|:------------|:--------------------|
| `ADD R1, R2, R3` | Additionne R2 et R3, stocke dans R1 |
| `SUB R1, R2, R3` | Soustrait R3 de R2 |
| `CMP R1, R2` | Soustrait et met à jour les drapeaux (sans stocker) |
| `AND R1, R2, R3` | ET logique |
| `LDR R1, [R2]` | Calcule l'adresse mémoire (R2 + offset) |
| `B label` | Calcule la nouvelle adresse (PC + offset) |

Même les sauts conditionnels (`BEQ`, `BNE`, etc.) dépendent des drapeaux produits par l'ALU !

---

## Ce qu'il faut retenir

1. **Le binaire est naturel pour les circuits** : Addition = XOR pour le bit, AND pour la retenue

2. **Le complément à 2 est magique** : Un seul additionneur pour addition ET soustraction

3. **L'ALU est le cœur du calcul** : Toutes les opérations passent par elle

4. **Les drapeaux permettent les décisions** : Sans eux, pas de `if`, pas de boucles

5. **La hiérarchie continue** :
   - Portes → Half Adder → Full Adder → Additionneur 32-bits → ALU

**Prochaine étape** : Au Chapitre 3, nous aborderons la **mémoire**. Comment l'ordinateur peut-il "se souvenir" de données ? Nous construirons des flip-flops, des registres, et de la RAM.

---

**Conseil** : L'ALU est l'un des composants les plus complexes du projet. Prenez le temps de bien comprendre chaque étape. Si vous avez réussi l'ALU, le reste du projet sera beaucoup plus accessible !

---

## Auto-évaluation

Testez votre compréhension avant de passer au chapitre suivant.

### Questions de compréhension

**Q1.** Dans un Half Adder, quelle porte logique calcule le bit de somme ? Et la retenue ?

**Q2.** Quelle est la représentation en complément à 2 de -1 sur 8 bits ?

**Q3.** Comment l'ALU effectue-t-elle une soustraction A - B ?

**Q4.** Que signifient les drapeaux N, Z, C, V ?

**Q5.** Pourquoi `CMP R1, R2` n'a pas besoin de registre destination ?

### Mini-défi pratique

Calculez mentalement le résultat de ces opérations sur 8 bits :

| Opération | A (hex) | B (hex) | Résultat | Drapeaux |
|-----------|---------|---------|----------|----------|
| ADD | 0x7F | 0x01 | ? | N=? Z=? V=? |
| ADD | 0xFF | 0x01 | ? | N=? Z=? C=? |
| SUB | 0x05 | 0x05 | ? | Z=? |

*Les solutions se trouvent dans le document **Codex_Solutions**.*

### Checklist de validation

Avant de passer au chapitre 3, assurez-vous de pouvoir :

- [ ] Expliquer la différence entre Half Adder et Full Adder
- [ ] Convertir un nombre négatif en complément à 2
- [ ] Expliquer comment la soustraction utilise l'addition
- [ ] Décrire le rôle de chaque drapeau (N, Z, C, V)
- [ ] Implémenter un additionneur 32 bits en chaînant des Full Adders
