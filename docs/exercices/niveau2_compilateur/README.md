# Niveau 2 : Exercices Compilateur

## Prérequis
- Avoir complété le niveau 1 (assembleur)
- Avoir lu les chapitres 1-4 du tutoriel compilateur

---

## Exercice 2.1 : Lexer de base

**Objectif** : Implémenter un lexer pour expressions arithmétiques.

**Tokens à reconnaître** :
- Nombres entiers (décimaux)
- Opérateurs : `+`, `-`, `*`, `/`, `(`, `)`
- Fin de fichier : EOF

**Fichiers à créer** :
```
lexer.h
lexer.c
test_lexer.c
```

**Interface** :
```c
typedef enum {
    TOK_NUMBER, TOK_PLUS, TOK_MINUS,
    TOK_STAR, TOK_SLASH,
    TOK_LPAREN, TOK_RPAREN, TOK_EOF
} TokenType;

typedef struct {
    TokenType type;
    int value;  // Pour TOK_NUMBER
} Token;

void lexer_init(char *source);
Token lexer_next();
```

**Test** :
```
Entrée: "3 + 4 * 2"
Sortie: NUMBER(3) PLUS NUMBER(4) STAR NUMBER(2) EOF
```

---

## Exercice 2.2 : Parser d'expressions

**Objectif** : Parser des expressions avec précédence correcte.

**Grammaire** :
```
expr   → term (('+' | '-') term)*
term   → factor (('*' | '/') factor)*
factor → NUMBER | '(' expr ')'
```

**Sortie** : AST (arbre syntaxique)

```c
typedef enum {
    NODE_NUMBER, NODE_BINARY
} NodeType;

typedef struct Node {
    NodeType type;
    union {
        int number;
        struct {
            char op;
            struct Node *left;
            struct Node *right;
        } binary;
    };
} Node;
```

**Test** :
```
Entrée: "3 + 4 * 2"
AST:
    +
   / \
  3   *
     / \
    4   2
```

---

## Exercice 2.3 : Évaluateur d'AST

**Objectif** : Évaluer un AST pour obtenir le résultat.

```c
int eval(Node *node) {
    if (node->type == NODE_NUMBER) {
        return node->number;
    }

    int left = eval(node->binary.left);
    int right = eval(node->binary.right);

    switch (node->binary.op) {
        case '+': return left + right;
        case '-': return left - right;
        // ...
    }
}
```

**Test** :
```
eval(parse("3 + 4 * 2")) == 11
eval(parse("(3 + 4) * 2")) == 14
```

---

## Exercice 2.4 : Générateur de code

**Objectif** : Générer du code assembleur A32 depuis l'AST.

```c
void codegen(Node *node) {
    if (node->type == NODE_NUMBER) {
        printf("    MOV R0, #%d\n", node->number);
        return;
    }

    codegen(node->binary.left);
    printf("    PUSH {R0}\n");
    codegen(node->binary.right);
    printf("    POP {R1}\n");

    switch (node->binary.op) {
        case '+':
            printf("    ADD R0, R1, R0\n");
            break;
        // ...
    }
}
```

**Test** :
```
Entrée: "3 + 4"
Sortie:
    MOV R0, #3
    PUSH {R0}
    MOV R0, #4
    POP {R1}
    ADD R0, R1, R0
```

---

## Exercice 2.5 : Variables

**Objectif** : Ajouter le support des variables.

**Syntaxe** :
```
let x = 5
x + 3
```

**Nouveaux tokens** : `LET`, `IDENT`, `ASSIGN`

**Table des symboles** :
```c
typedef struct {
    char name[32];
    int offset;  // Position sur la pile
} Symbol;

Symbol symbols[MAX_SYMBOLS];
int symbol_count;
```

---

## Exercice 2.6 : Conditions (if)

**Objectif** : Ajouter les conditions.

**Syntaxe** :
```
if x > 0 then
    x
else
    -x
end
```

**Génération** :
```asm
    ; condition
    CMP R0, #0
    BLE .else
    ; then
    ...
    B .endif
.else:
    ; else
    ...
.endif:
```

---

## Exercice 2.7 : Boucles (while)

**Objectif** : Ajouter les boucles.

**Syntaxe** :
```
while x > 0 do
    x = x - 1
end
```

---

## Exercice 2.8 : Fonctions

**Objectif** : Ajouter les définitions et appels de fonctions.

**Syntaxe** :
```
fn double(x) = x * 2
double(5)
```

---

## Exercice 2.9 : Optimisation des constantes

**Objectif** : Évaluer les expressions constantes à la compilation.

```
3 + 4 * 2  →  11  (une seule instruction MOV)
```

---

## Exercice 2.10 : Messages d'erreur

**Objectif** : Afficher des erreurs avec ligne et colonne.

```
Erreur ligne 3, colonne 15: ';' attendu
    x = 5 + y
              ^
```

---

## Projet final : Mini-C

**Objectif** : Compiler un sous-ensemble de C.

**Fonctionnalités** :
- Variables locales et globales
- Fonctions avec paramètres
- if/else, while
- Expressions arithmétiques et comparaisons

**Exemple** :
```c
int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

int main() {
    return factorial(5);
}
```

---

## Barème

| Exercice | Points | Difficulté |
|----------|--------|------------|
| 2.1 | 10 | ⭐ |
| 2.2 | 15 | ⭐⭐ |
| 2.3 | 10 | ⭐ |
| 2.4 | 15 | ⭐⭐ |
| 2.5 | 15 | ⭐⭐ |
| 2.6 | 15 | ⭐⭐⭐ |
| 2.7 | 10 | ⭐⭐ |
| 2.8 | 20 | ⭐⭐⭐ |
| 2.9 | 10 | ⭐⭐ |
| 2.10 | 10 | ⭐⭐ |
| Mini-C | 50 (bonus) | ⭐⭐⭐⭐ |

---

## Conseils

1. Développez par étapes : lexer → parser → codegen
2. Testez chaque étape indépendamment
3. Utilisez des assert() pour vérifier vos invariants
4. Imprimez l'AST pour débugger le parser
5. Exécutez le code généré dans le simulateur A32
