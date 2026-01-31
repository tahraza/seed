---
marp: true
theme: seed-slides
paginate: true
header: "Seed - Chapitre 06"
footer: "L'Assembleur"
---

# Chapitre 06 : L'Assembleur

> "Traduire, c'est trahir ?" — Pas ici.

---

# Où en sommes-nous ?

```
┌─────────────────────────────────┐
│  8. Applications                │
├─────────────────────────────────┤
│  ...                            │
├─────────────────────────────────┤
│  6. Assembleur        ◀── NOUS  │
├─────────────────────────────────┤
│  5. CPU ✓                       │
├─────────────────────────────────┤
│  1-4. Matériel ✓                │
└─────────────────────────────────┘
```

Première étape dans le monde du **logiciel** !

---

# Le Problème

Écrire un programme en hexadécimal :

```
0xE2801001
0xE2822003
0xE0813002
0xEAFFFFFE
```

C'est **illisible** et source d'erreurs !

---

# La Solution : L'Assembleur

Un **programme** qui traduit :

```asm
    ADD R1, R1, #1
    ADD R2, R2, #3
    ADD R3, R1, R2
    B loop
```

en :

```
0xE2811001
0xE2822003
0xE0813002
0xEAFFFFFE
```

---

# Du Texte au Binaire

```
                    Assembleur
   Code source  ──────────────►  Code machine
   (texte)                       (binaire)

   ADD R1, R2, #10     →     0xE2821010
   B loop              →     0xEAFFFFFE
```

L'assembleur est un **traducteur**.

---

# Les Trois Tâches

1. **Analyse (Parsing)**
   Lire et comprendre les instructions

2. **Résolution des Symboles**
   Transformer les labels en adresses

3. **Encodage**
   Générer le binaire 32 bits

---

# Le Problème des Références

```asm
    B suite    ; Où est 'suite' ? On ne sait pas encore !
    MOV R0, #1
suite:
    ADD R0, R0, #1
```

À la ligne 1, l'assembleur ne connaît pas l'adresse de `suite`.

C'est une **référence vers l'avant**.

---

# La Solution : Deux Passes

## Passe 1 : Table des Symboles

Parcourir le fichier et noter chaque label :

```
Adresse 0x0000 : B suite         (4 octets)
Adresse 0x0004 : MOV R0, #1      (4 octets)
Adresse 0x0008 : suite:          ← Note : suite = 0x0008
```

**Table** : `{ "suite": 0x0008 }`

---

# Passe 2 : Génération

Reparcourir le fichier avec la table :

```
B suite → cherche "suite" dans la table → 0x0008

offset = (0x0008 - 0x0000 - 8) / 4 = -2

→ 0xEAFFFFFE
```

Maintenant toutes les références sont résolues !

---

# Les Sections

| Section | Contenu |
|:--------|:--------|
| `.text` | Le code (instructions) |
| `.data` | Variables initialisées |
| `.bss` | Variables non initialisées |

```asm
.text
    MOV R0, #1
    LDR R1, [R2]
.data
    .word 42
```

---

# Les Directives

| Directive | Effet |
|:----------|:------|
| `.text` | Section code |
| `.data` | Section données |
| `.global sym` | Exporte un symbole |
| `.word 123` | Réserve 4 octets |
| `.asciz "Hello"` | Chaîne + '\0' |
| `.align 2` | Aligne sur 4 octets |

---

# Exemple : Encoder ADD R1, R2, #10

## Étape 1 : Identifier

- Mnémonique : `ADD` → opcode = 0100
- Rd = R1, Rn = R2
- Immédiat : #10

## Étape 2 : Classe

- Classe `001` (immédiat)

---

# Étape 3 : Assembler les Bits

```
31-28  27-25  24-21  20   19-16  15-12  11-0
Cond   Class   Op    S     Rn     Rd    Imm12
1110   001    0100   0    0010   0001   000000001010
```

**Résultat** : `0xE2821010`

---

# Le Problème des Grandes Constantes

12 bits d'immédiat maximum !

Comment charger `0xDEADBEEF` (32 bits) ?

```asm
MOV R0, #0xDEADBEEF   ; ERREUR ! Trop grand
```

---

# La Solution : Pseudo-instruction

La syntaxe spéciale `LDR Rd, =valeur` :

```asm
LDR R0, =0xDEADBEEF
```

L'assembleur la transforme en :

```asm
LDR R0, [PC, #offset]   ; Va chercher en mémoire
...
literal_pool:
    .word 0xDEADBEEF    ; La valeur est stockée ici
```

---

# Le Literal Pool

```
Adresse   Contenu
0x0000    LDR R0, [PC, #8]    ; PC+8 = 0x000C
0x0004    ...
0x0008    ...
0x000C    0xDEADBEEF          ; ← Literal pool
```

La valeur est **stockée après le code**.

---

# Résumé du Pipeline

```
   Code source (.s)
        │
        ▼
   ┌──────────┐
   │ Passe 1  │───► Table des symboles
   └──────────┘
        │
        ▼
   ┌──────────┐
   │ Passe 2  │───► Code binaire (.bin)
   └──────────┘
```

---

# Utilisation Pratique

```bash
# Assembler un fichier
cargo run -p a32_cli -- assemble prog.s -o prog.bin

# Examiner le binaire
hexdump -C prog.bin

# Simuler l'exécution
cargo run -p a32_cli -- run prog.bin
```

---

# Ce qu'il faut retenir

1. **Assembleur = Traducteur** : Texte → Binaire
2. **Deux passes** : Symboles puis code
3. **Directives** : `.text`, `.data`, `.word`
4. **Literal pool** : Pour les grandes constantes
5. **Label = Adresse** : Un nom devient un nombre

---

# Questions ?

Référence : Livre Seed, Chapitre 06 - Assembleur

Exercices : TD et TP + Simulateur Web

**Prochain chapitre** : Compilateur (C32 → Assembleur)

