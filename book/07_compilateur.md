# Construction du Compilateur

> "Pour comprendre la récursivité, il faut d'abord comprendre la récursivité."

Dans ce chapitre, nous allons construire le **pont** entre le langage de haut niveau (C32) et l'assembleur (A32). Le compilateur est l'outil qui permet aux humains d'écrire du code lisible tout en profitant de la vitesse du code machine.

---

## Où en sommes-nous ?

![Position dans l'architecture](images/architecture-stack.svg)

*Nous sommes à la Couche 4 : Compilateur - Transforme C32 en Assembleur A32*

Le compilateur est le **traducteur automatique** qui transforme du code lisible par les humains en code exécutable par la machine.

---

## Le Rôle du Compilateur

### Pourquoi un compilateur ?

| Assembleur | C32 (haut niveau) |
|:-----------|:------------------|
| `ADD R0, R0, #1` | `x = x + 1;` |
| Gestion manuelle des registres | Variables nommées |
| Sauts et labels | `if`, `while`, `for` |
| Appels manuels avec conventions | `return fonction();` |

Le compilateur traduit le second en premier, automatiquement.

### Les étapes de compilation

```
Code C32          Analyse           Génération
  (texte)    →    (AST)      →     Assembleur
                                       │
                                       ▼
                                    Binaire
```

1. **Analyse lexicale** : Découpe le texte en tokens (`int`, `x`, `=`, `5`, `;`)
2. **Analyse syntaxique** : Construit un arbre (AST) représentant la structure
3. **Analyse sémantique** : Vérifie les types, les portées, etc.
4. **Génération de code** : Produit l'assembleur équivalent

---

## Les Phases du Compilateur

### Phase 1 : Lexer (Analyse Lexicale)

Le lexer transforme le flux de caractères en tokens :

```c
int x = 5;
```

Devient :
```
[INT] [ID:"x"] [EQUAL] [NUMBER:5] [SEMICOLON]
```

### Phase 2 : Parser (Analyse Syntaxique)

Le parser construit un **AST** (Abstract Syntax Tree) :

```
           Declaration
              /    \
           Type    Assignment
            |        /    \
          "int"  "x"    Number
                         |
                         5
```

### Phase 3 : Génération de Code

Le générateur parcourt l'AST et produit l'assembleur :

```asm
; int x = 5;
MOV R0, #5
STR R0, [SP, #-4]!   ; Push x sur la pile
```

---

## Compilation des Structures de Contrôle

### Variables locales

Les variables locales vivent sur la **pile** :

```c
int a = 10;
int b = 20;
```

```asm
; Prologue
SUB SP, SP, #8       ; Réserve 8 octets pour a et b

; a = 10
MOV R0, #10
STR R0, [SP, #4]     ; a est à SP+4

; b = 20
MOV R0, #20
STR R0, [SP, #0]     ; b est à SP+0
```

### Expressions

Pour `a + b * 2` :

```asm
; Évaluation de b * 2
LDR R0, [SP, #0]     ; R0 = b
MOV R1, #2
MUL R0, R0, R1       ; R0 = b * 2

; Évaluation de a + (b * 2)
LDR R1, [SP, #4]     ; R1 = a
ADD R0, R1, R0       ; R0 = a + b*2
```

### If / Else

```c
if (x > 0) {
    y = 1;
} else {
    y = 0;
}
```

```asm
    LDR R0, [SP, #x_offset]
    CMP R0, #0
    BLE else_label

    ; Then branch
    MOV R0, #1
    STR R0, [SP, #y_offset]
    B endif_label

else_label:
    ; Else branch
    MOV R0, #0
    STR R0, [SP, #y_offset]

endif_label:
```

### Boucle While

```c
while (i < 10) {
    i = i + 1;
}
```

```asm
while_start:
    LDR R0, [SP, #i_offset]
    CMP R0, #10
    BGE while_end

    ; Corps de la boucle
    ADD R0, R0, #1
    STR R0, [SP, #i_offset]

    B while_start

while_end:
```

### Boucle For

`for (init; cond; incr) { body }` est équivalent à :

```c
init;
while (cond) {
    body;
    incr;
}
```

---

## Compilation des Fonctions

### Convention d'appel

Comment passe-t-on les arguments ? Comment retourne-t-on une valeur ?

| Registre | Rôle |
|:---------|:-----|
| R0-R3 | Arguments 1-4, valeur de retour en R0 |
| R4-R11 | Sauvegardés par l'appelé (callee-saved) |
| R13 (SP) | Pointeur de pile |
| R14 (LR) | Adresse de retour |

### Prologue et Épilogue

```c
int add(int a, int b) {
    return a + b;
}
```

```asm
add:
    ; Prologue
    SUB SP, SP, #4       ; Place pour LR
    STR LR, [SP]         ; Sauvegarde LR

    ; Corps : a est dans R0, b dans R1
    ADD R0, R0, R1       ; Résultat dans R0

    ; Épilogue
    LDR LR, [SP]         ; Restaure LR
    ADD SP, SP, #4
    MOV PC, LR           ; Retour
```

### Appel de fonction

```c
result = add(5, 3);
```

```asm
    MOV R0, #5           ; Premier argument
    MOV R1, #3           ; Deuxième argument
    BL add               ; Appel (sauve PC+4 dans LR)
    STR R0, [SP, #result_offset]  ; Sauve le résultat
```

---

## Le Compilateur C32

Le compilateur C32 du projet Codex (`c32_cli`) implémente toutes ces transformations.

### Utilisation

```bash
# Compiler un fichier C32 en assembleur
cargo run -p c32_cli -- mon_fichier.c -o mon_fichier.s

# Compiler directement en binaire
cargo run -p c32_cli -- mon_fichier.c -o mon_fichier.bin
```

### Exemple complet

```c
// fibonacci.c
int fib(int n) {
    if (n <= 1) return n;
    return fib(n-1) + fib(n-2);
}

int main() {
    return fib(10);
}
```

Produit de l'assembleur avec :
- Gestion automatique de la pile
- Appels récursifs
- Sauvegarde/restauration des registres

---

## Du Code C32 à l'Exécution : Trace Complète

Suivons pas à pas le voyage d'un programme simple à travers toutes les couches.

### Le Programme C32

```c
// simple.c
int square(int x) {
    return x * x;
}

int main() {
    int n = 5;
    return square(n);
}
```

### Étape 1 : Analyse Lexicale (Lexer)

Le lexer découpe le texte en tokens :

```
int      → [KEYWORD: int]
square   → [IDENTIFIER: "square"]
(        → [LPAREN]
int      → [KEYWORD: int]
x        → [IDENTIFIER: "x"]
)        → [RPAREN]
{        → [LBRACE]
return   → [KEYWORD: return]
x        → [IDENTIFIER: "x"]
*        → [STAR]
x        → [IDENTIFIER: "x"]
;        → [SEMICOLON]
}        → [RBRACE]
...
```

### Étape 2 : Analyse Syntaxique (Parser)

Le parser construit un AST (Abstract Syntax Tree) :

```
Program
├── Function: square(x: int) -> int
│   └── Return
│       └── BinaryOp: *
│           ├── Var: x
│           └── Var: x
│
└── Function: main() -> int
    └── Block
        ├── VarDecl: n = 5
        └── Return
            └── Call: square
                └── Var: n
```

### Étape 3 : Génération de Code (Assembleur A32)

Le générateur parcourt l'AST et produit :

```asm
; ==========================================
; Fonction: square(x)
; Paramètre x dans R0
; ==========================================
square:
    ; Prologue (sauvegarde du contexte)
    PUSH {LR}               ; Sauver adresse de retour

    ; Corps: return x * x
    ; x est déjà dans R0
    MUL R0, R0, R0          ; R0 = x * x

    ; Épilogue (restauration et retour)
    POP {LR}                ; Restaurer LR
    BX LR                   ; Retour (résultat dans R0)

; ==========================================
; Fonction: main()
; ==========================================
main:
    ; Prologue
    PUSH {R4, LR}           ; Sauver R4 et LR
    SUB SP, SP, #4          ; Réserver 4 octets pour n

    ; int n = 5
    MOV R4, #5              ; R4 = 5 (utilise R4 car callee-saved)
    STR R4, [SP, #0]        ; n = 5 (sur la pile)

    ; return square(n)
    MOV R0, R4              ; Argument: R0 = n
    BL square               ; Appel de square

    ; Épilogue
    ADD SP, SP, #4          ; Libérer la pile
    POP {R4, LR}            ; Restaurer R4 et LR
    BX LR                   ; Retour (R0 contient 25)
```

### Étape 4 : Assemblage (Binaire)

L'assembleur traduit chaque instruction en code machine 32 bits :

```
Adresse   Binaire (hex)  Instruction           Encodage
--------  -------------  --------------------  --------------------------
0x0000    E92D4000       PUSH {LR}             Cond=E, opcode=92D, Rn=D(SP)
0x0004    E0000090       MUL R0, R0, R0        Cond=E, Rm=R0, Rs=R0, Rd=R0
0x0008    E8BD4000       POP {LR}              Cond=E, opcode=8BD, Rn=D
0x000C    E12FFF1E       BX LR                 Cond=E, opcode=12FFF1, Rm=E

0x0010    E92D4010       PUSH {R4, LR}         Reglist = R4 + LR
0x0014    E24DD004       SUB SP, SP, #4        Imm = 4
0x0018    E3A04005       MOV R4, #5            Imm = 5
0x001C    E58D4000       STR R4, [SP, #0]      Offset = 0
0x0020    E1A00004       MOV R0, R4            Rm = R4
0x0024    EBFFFFF5       BL square             Offset = -11 (vers 0x0000)
0x0028    E28DD004       ADD SP, SP, #4        Imm = 4
0x002C    E8BD4010       POP {R4, LR}          Reglist = R4 + LR
0x0030    E12FFF1E       BX LR                 Retour
```

### Étape 5 : Exécution (Cycle par Cycle)

Trace d'exécution sur le CPU (simplifié) :

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXÉCUTION PAS À PAS                          │
├─────────┬──────────────────────┬────────────────────────────────┤
│ Cycle   │ PC / Instruction     │ État après exécution           │
├─────────┼──────────────────────┼────────────────────────────────┤
│    1    │ 0x0010 PUSH {R4,LR}  │ SP=0xFFF8, Mem[SP]=LR, R4     │
│    2    │ 0x0014 SUB SP,SP,#4  │ SP=0xFFF4                      │
│    3    │ 0x0018 MOV R4,#5     │ R4=5                           │
│    4    │ 0x001C STR R4,[SP]   │ Mem[0xFFF4]=5 (n=5)           │
│    5    │ 0x0020 MOV R0,R4     │ R0=5 (argument pour square)    │
│    6    │ 0x0024 BL square     │ LR=0x0028, PC=0x0000           │
│         │                      │ ─── Entrée dans square ───     │
│    7    │ 0x0000 PUSH {LR}     │ SP=0xFFF0, Mem[SP]=0x0028     │
│    8    │ 0x0004 MUL R0,R0,R0  │ R0=5*5=25                      │
│    9    │ 0x0008 POP {LR}      │ LR=0x0028, SP=0xFFF4          │
│   10    │ 0x000C BX LR         │ PC=0x0028                      │
│         │                      │ ─── Retour dans main ───       │
│   11    │ 0x0028 ADD SP,SP,#4  │ SP=0xFFF8                      │
│   12    │ 0x002C POP {R4,LR}   │ R4 et LR restaurés, SP=0x10000│
│   13    │ 0x0030 BX LR         │ Retour au système avec R0=25  │
└─────────┴──────────────────────┴────────────────────────────────┘

Résultat final : R0 = 25 (square(5) = 5 * 5 = 25)
```

### Visualisation de la Pile

```
Adresse    Avant main    Après PUSH    Après SUB     Pendant square
           (SP=0x10000)  (SP=0xFFF8)   (SP=0xFFF4)   (SP=0xFFF0)
────────── ────────────  ────────────  ────────────  ────────────
0x10000    [libre]       [libre]       [libre]       [libre]
0x0FFFC                  LR (retour)   LR (retour)   LR (retour)
0x0FFF8                  R4 (sauvé)    R4 (sauvé)    R4 (sauvé)
0x0FFF4                                n = 5         n = 5
0x0FFF0                                              LR = 0x0028
           ↑ SP          ↑ SP          ↑ SP          ↑ SP
```

### Ce qui se passe dans le Hardware

À chaque cycle, le CPU effectue le cycle Fetch-Decode-Execute :

```
Cycle 8 : MUL R0, R0, R0
──────────────────────────────────────────────────────────────

1. FETCH : PC=0x0004 → Instruction Register = 0xE0000090
           PC = PC + 4 (préparation instruction suivante)

2. DECODE : Opcode = MUL
            Rd = R0 (destination)
            Rm = R0 (premier opérande)
            Rs = R0 (second opérande)
            → Activer le multiplicateur de l'ALU

3. EXECUTE :
   ┌────────────────────────────────────────────┐
   │                   ALU                       │
   │                                             │
   │   R0 (5) ───────┐                          │
   │                 │   ┌──────────┐           │
   │                 ├──→│    ×     │──→ 25     │
   │                 │   └──────────┘           │
   │   R0 (5) ───────┘                          │
   │                                             │
   └────────────────────────────────────────────┘

4. WRITE BACK : R0 = 25
```

### Résumé du Voyage

```
┌─────────────────────────────────────────────────────────────────┐
│                 DU SOURCE À L'EXÉCUTION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  C32           "return x * x;"                                  │
│    │                                                             │
│    │ Lexer                                                       │
│    ▼                                                             │
│  Tokens       [RETURN] [ID:x] [STAR] [ID:x] [SEMICOLON]         │
│    │                                                             │
│    │ Parser                                                      │
│    ▼                                                             │
│  AST          Return(BinaryOp(*, Var(x), Var(x)))               │
│    │                                                             │
│    │ CodeGen                                                     │
│    ▼                                                             │
│  Assembleur   MUL R0, R0, R0                                    │
│    │                                                             │
│    │ Assembleur                                                  │
│    ▼                                                             │
│  Binaire      0xE0000090                                        │
│    │                                                             │
│    │ CPU (fetch-decode-execute)                                  │
│    ▼                                                             │
│  Exécution    R0 = 25                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

Cette trace montre comment chaque couche d'abstraction transforme le code :
- Le **lexer** voit des caractères → produit des tokens
- Le **parser** voit des tokens → produit une structure (AST)
- Le **codegen** voit un AST → produit de l'assembleur
- L'**assembleur** voit des mnémoniques → produit du binaire
- Le **CPU** voit du binaire → exécute des opérations

---

## Construisez Votre Propre Compilateur !

Le simulateur web contient une section **Compilateur: Construction** avec **18 exercices progressifs** organisés en 7 phases. Vous construirez un mini-compilateur qui génère du vrai code assembleur A32.

### Phase 1 : Lexer (Analyse Lexicale)

Le lexer transforme le texte en tokens.

| Exercice | Description |
|:---------|:------------|
| 1.1 Reconnaître un Chiffre | Implémenter `is_digit(c)` pour détecter '0'-'9' |
| 1.2 Lire un Nombre | Parser un entier depuis une chaîne |
| 1.3 Compter les Tokens | Compter les tokens dans `"12 + 34 * 5"` |

### Phase 2 : Parser (Analyse Syntaxique)

Le parser construit une représentation structurée et évalue les expressions.

| Exercice | Description |
|:---------|:------------|
| 2.1 Précédence des Opérateurs | Déterminer la priorité (`*` > `+`) |
| 2.2 Évaluer une Opération | Évaluer `3 + 4` ou `6 * 7` |
| 2.3 Parser avec Précédence | Descente récursive pour `2 + 3 * 4` |
| 2.4 Parenthèses | Supporter `(2 + 3) * 4` |

### Phase 3 : Émission ASM (Génération de Code)

Générer des instructions A32 sous forme de chaînes.

| Exercice | Description |
|:---------|:------------|
| 3.1 Générer MOV | Produire `"MOV R0, #42"` |
| 3.2 Opération Binaire | Mapper `+` → `ADD`, `*` → `MUL` |
| 3.3 Comparaison | Générer `CMP` et codes de condition |

### Phase 4 : CodeGen Expressions

Générer du code A32 complet pour des expressions.

| Exercice | Description |
|:---------|:------------|
| 4.1 Constante → A32 | Générer code pour charger une constante |
| 4.2 Addition → A32 | `a + b` → `MOV R0, #a / MOV R1, #b / ADD R0, R0, R1` |
| 4.3 Expression → A32 | Expression complète avec précédence |

### Phase 5 : Structures de Contrôle

Générer du code pour `if/else` et `while`.

| Exercice | Description |
|:---------|:------------|
| 5.1 If/Else → A32 | Générer les sauts conditionnels et labels |
| 5.2 While → A32 | Générer les boucles avec labels |

### Phase 6 : Fonctions

Gérer les appels de fonction et la pile.

| Exercice | Description |
|:---------|:------------|
| 6.1 Prologue/Épilogue | Sauvegarder LR, réserver la pile |
| 6.2 Appel de Fonction | Passer les arguments, appeler avec BL |

### Phase 7 : Projet Final

| Exercice | Description |
|:---------|:------------|
| 7.1 Mini-Compilateur Complet | Compiler une expression en A32 exécutable |

Le projet final combine toutes les phases : lexer → parser → codegen pour produire du code assembleur A32 fonctionnel.

### Techniques Clés

Ces exercices utilisent la technique de **descente récursive** :

- `parse_expr()` gère `+` et `-` (basse priorité)
- `parse_term()` gère `*` et `/` (haute priorité)
- `parse_factor()` gère les nombres et les parenthèses

---

## Exercices Pratiques

### Exercices sur le Simulateur Web

La section **C32** du simulateur web vous permet de compiler et exécuter du C32.

| Catégorie | Exercices |
|:----------|:----------|
| Bases | Variables, Expressions, Modulo, Incrémentation |
| Contrôle | Conditions, Else-If, Maximum de 3 |
| Boucles | For, While, Imbriquées, Multiplication |
| Fonctions | Appels, Paramètres, Valeur Absolue, Min/Max |
| Tableaux | Accès, Maximum, Comptage |
| Pointeurs | Adresses, Swap, Tableaux via pointeurs |
| Récursion | Factorielle, Fibonacci, PGCD |
| Algorithmes | Tri à Bulles, Recherche Binaire |

### Exercice : Traduire manuellement

Traduisez ce code C32 en assembleur à la main :

```c
int sum = 0;
for (int i = 1; i <= 10; i = i + 1) {
    sum = sum + i;
}
```

Comparez avec la sortie du compilateur !

---

## Ce qu'il faut retenir

1. **Le compilateur traduit** : C32 (lisible) → Assembleur (exécutable)

2. **Trois phases** : Lexer → Parser → Générateur de code

3. **Les variables locales vivent sur la pile** : Accès via `[SP, #offset]`

4. **Les structures de contrôle deviennent des sauts** : `if` → `CMP` + `B`

5. **Les fonctions suivent une convention** : Arguments en R0-R3, retour en R0

**Prochaine étape** : Au Chapitre 8, nous explorerons le langage C32 en détail — sa syntaxe, ses types, et ses possibilités.

---

**Conseil** : Pour vraiment comprendre le compilateur, écrivez du C32 et regardez l'assembleur généré. Cherchez à prédire ce que le compilateur va produire !

---

## Auto-évaluation

Testez votre compréhension avant de passer au chapitre suivant.

### Questions de compréhension

**Q1.** Quelles sont les trois phases principales d'un compilateur ?

**Q2.** Comment le compilateur gère-t-il les variables locales ?

**Q3.** Comment un `if-else` est-il traduit en assembleur ?

**Q4.** Quelle est la convention d'appel pour les arguments de fonction ?

**Q5.** Pourquoi le compilateur génère-t-il un prologue et un épilogue pour chaque fonction ?

### Mini-défi pratique

Prédisez l'assembleur généré pour ce code C32 :

```c
int double_it(int x) {
    return x + x;
}
```

*Les solutions se trouvent dans le document **Codex_Solutions**.*

### Checklist de validation

Avant de passer au chapitre 8, assurez-vous de pouvoir :

- [ ] Décrire le rôle du lexer, parser, et codegen
- [ ] Expliquer comment les variables locales sont stockées
- [ ] Traduire un `if-else` simple en assembleur
- [ ] Connaître la convention d'appel (R0-R3, pile, LR)
- [ ] Comprendre le prologue/épilogue d'une fonction
