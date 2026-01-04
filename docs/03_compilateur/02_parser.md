# Chapitre 2 : Le Parser (Analyse Syntaxique)

## Objectif

Transformer une séquence de tokens en un **arbre syntaxique** (AST).

```
[INT, IDENT("x"), ASSIGN, NUM(2), PLUS, NUM(3), SEMI]
                           ↓
              VarDecl
             /   |   \
          "int" "x"  BinaryOp(+)
                      /       \
                   Num(2)    Num(3)
```

## Grammaire

Une grammaire définit la structure du langage. Pour un sous-ensemble de C :

```
program     → declaration*
declaration → var_decl | func_decl
var_decl    → type IDENT ('=' expr)? ';'
func_decl   → type IDENT '(' params? ')' block
block       → '{' statement* '}'
statement   → var_decl | expr_stmt | if_stmt | while_stmt | return_stmt | block
if_stmt     → 'if' '(' expr ')' statement ('else' statement)?
while_stmt  → 'while' '(' expr ')' statement
return_stmt → 'return' expr? ';'
expr_stmt   → expr ';'
expr        → assignment
assignment  → IDENT '=' assignment | logic_or
logic_or    → logic_and ('||' logic_and)*
logic_and   → equality ('&&' equality)*
equality    → comparison (('==' | '!=') comparison)*
comparison  → addition (('<' | '<=' | '>' | '>=') addition)*
addition    → multiplication (('+' | '-') multiplication)*
multiplication → unary (('*' | '/') unary)*
unary       → ('!' | '-') unary | call
call        → primary ('(' arguments? ')')?
primary     → NUMBER | STRING | IDENT | '(' expr ')'
```

## L'AST (Abstract Syntax Tree)

### Définition des nœuds

```c
typedef enum {
    NODE_PROGRAM,
    NODE_VAR_DECL,
    NODE_FUNC_DECL,
    NODE_BLOCK,
    NODE_IF,
    NODE_WHILE,
    NODE_RETURN,
    NODE_BINARY,
    NODE_UNARY,
    NODE_CALL,
    NODE_IDENT,
    NODE_NUMBER,
    NODE_STRING,
    NODE_ASSIGN
} NodeType;

typedef struct Node {
    NodeType type;
    Token token;           // Token associé (pour ligne/colonne)

    // Selon le type :
    union {
        // NODE_NUMBER
        int number_value;

        // NODE_STRING
        char *string_value;

        // NODE_IDENT
        char *ident_name;

        // NODE_BINARY
        struct {
            struct Node *left;
            struct Node *right;
            TokenType op;
        } binary;

        // NODE_UNARY
        struct {
            struct Node *operand;
            TokenType op;
        } unary;

        // NODE_VAR_DECL
        struct {
            char *name;
            char *type_name;
            struct Node *init;  // Peut être NULL
        } var_decl;

        // NODE_FUNC_DECL
        struct {
            char *name;
            char *return_type;
            struct Node **params;
            int param_count;
            struct Node *body;
        } func_decl;

        // NODE_IF
        struct {
            struct Node *condition;
            struct Node *then_branch;
            struct Node *else_branch;  // Peut être NULL
        } if_stmt;

        // NODE_WHILE
        struct {
            struct Node *condition;
            struct Node *body;
        } while_stmt;

        // NODE_CALL
        struct {
            char *callee;
            struct Node **args;
            int arg_count;
        } call;

        // NODE_BLOCK, NODE_PROGRAM
        struct {
            struct Node **statements;
            int stmt_count;
        } block;
    };
} Node;
```

## Recursive Descent Parser

### Structure du parser

```c
typedef struct {
    Lexer *lexer;
    Token current;
    Token previous;
    int had_error;
} Parser;

void parser_init(Parser *p, Lexer *l) {
    p->lexer = l;
    p->had_error = 0;
    advance(p);  // Charge le premier token
}

void advance(Parser *p) {
    p->previous = p->current;
    p->current = next_token(p->lexer);
}

int check(Parser *p, TokenType type) {
    return p->current.type == type;
}

int match(Parser *p, TokenType type) {
    if (check(p, type)) {
        advance(p);
        return 1;
    }
    return 0;
}

void expect(Parser *p, TokenType type, char *message) {
    if (!match(p, type)) {
        error(p, message);
    }
}
```

### Parser d'expressions (Pratt Parser)

La précédence des opérateurs est gérée par des fonctions séparées :

```c
// Précédence croissante : = < || < && < == != < < <= > >= < + - < * /

Node *parse_expression(Parser *p) {
    return parse_assignment(p);
}

Node *parse_assignment(Parser *p) {
    Node *expr = parse_or(p);

    if (match(p, TOK_ASSIGN)) {
        if (expr->type != NODE_IDENT) {
            error(p, "Cible d'affectation invalide");
        }
        Node *value = parse_assignment(p);  // Associatif à droite
        return make_assign(expr->ident_name, value);
    }

    return expr;
}

Node *parse_or(Parser *p) {
    Node *left = parse_and(p);

    while (match(p, TOK_OR)) {
        Node *right = parse_and(p);
        left = make_binary(TOK_OR, left, right);
    }

    return left;
}

Node *parse_and(Parser *p) {
    Node *left = parse_equality(p);

    while (match(p, TOK_AND)) {
        Node *right = parse_equality(p);
        left = make_binary(TOK_AND, left, right);
    }

    return left;
}

Node *parse_equality(Parser *p) {
    Node *left = parse_comparison(p);

    while (match(p, TOK_EQ) || match(p, TOK_NE)) {
        TokenType op = p->previous.type;
        Node *right = parse_comparison(p);
        left = make_binary(op, left, right);
    }

    return left;
}

// ... Même pattern pour comparison, addition, multiplication

Node *parse_unary(Parser *p) {
    if (match(p, TOK_MINUS) || match(p, TOK_NOT)) {
        TokenType op = p->previous.type;
        Node *right = parse_unary(p);  // Récursif
        return make_unary(op, right);
    }

    return parse_call(p);
}

Node *parse_call(Parser *p) {
    Node *expr = parse_primary(p);

    if (match(p, TOK_LPAREN)) {
        // Appel de fonction
        Node **args = NULL;
        int arg_count = 0;

        if (!check(p, TOK_RPAREN)) {
            do {
                args = realloc(args, sizeof(Node*) * (arg_count + 1));
                args[arg_count++] = parse_expression(p);
            } while (match(p, TOK_COMMA));
        }

        expect(p, TOK_RPAREN, "')' attendue après les arguments");
        return make_call(expr->ident_name, args, arg_count);
    }

    return expr;
}

Node *parse_primary(Parser *p) {
    if (match(p, TOK_NUMBER)) {
        return make_number(p->previous.value);
    }

    if (match(p, TOK_STRING)) {
        return make_string(p->previous.text);
    }

    if (match(p, TOK_IDENT)) {
        return make_ident(p->previous.text);
    }

    if (match(p, TOK_LPAREN)) {
        Node *expr = parse_expression(p);
        expect(p, TOK_RPAREN, "')' attendue");
        return expr;
    }

    error(p, "Expression attendue");
    return NULL;
}
```

### Parser de déclarations

```c
Node *parse_declaration(Parser *p) {
    if (check(p, TOK_INT) || check(p, TOK_CHAR) || check(p, TOK_VOID)) {
        return parse_var_or_func_decl(p);
    }

    return parse_statement(p);
}

Node *parse_var_or_func_decl(Parser *p) {
    char *type_name = p->current.text;
    advance(p);

    expect(p, TOK_IDENT, "Identifiant attendu");
    char *name = p->previous.text;

    // Fonction ?
    if (match(p, TOK_LPAREN)) {
        return parse_func_decl_rest(p, type_name, name);
    }

    // Variable
    Node *init = NULL;
    if (match(p, TOK_ASSIGN)) {
        init = parse_expression(p);
    }
    expect(p, TOK_SEMICOLON, "';' attendu");

    return make_var_decl(type_name, name, init);
}

Node *parse_func_decl_rest(Parser *p, char *ret_type, char *name) {
    // Parse les paramètres
    Node **params = NULL;
    int param_count = 0;

    if (!check(p, TOK_RPAREN)) {
        do {
            char *param_type = p->current.text;
            advance(p);
            expect(p, TOK_IDENT, "Nom de paramètre attendu");
            char *param_name = p->previous.text;

            params = realloc(params, sizeof(Node*) * (param_count + 1));
            params[param_count++] = make_param(param_type, param_name);
        } while (match(p, TOK_COMMA));
    }

    expect(p, TOK_RPAREN, "')' attendue");

    // Parse le corps
    Node *body = parse_block(p);

    return make_func_decl(ret_type, name, params, param_count, body);
}
```

### Parser de statements

```c
Node *parse_statement(Parser *p) {
    if (match(p, TOK_IF)) {
        return parse_if(p);
    }

    if (match(p, TOK_WHILE)) {
        return parse_while(p);
    }

    if (match(p, TOK_RETURN)) {
        return parse_return(p);
    }

    if (match(p, TOK_LBRACE)) {
        return parse_block(p);
    }

    // Expression statement
    Node *expr = parse_expression(p);
    expect(p, TOK_SEMICOLON, "';' attendu");
    return expr;
}

Node *parse_if(Parser *p) {
    expect(p, TOK_LPAREN, "'(' attendue après 'if'");
    Node *condition = parse_expression(p);
    expect(p, TOK_RPAREN, "')' attendue");

    Node *then_branch = parse_statement(p);
    Node *else_branch = NULL;

    if (match(p, TOK_ELSE)) {
        else_branch = parse_statement(p);
    }

    return make_if(condition, then_branch, else_branch);
}

Node *parse_while(Parser *p) {
    expect(p, TOK_LPAREN, "'(' attendue après 'while'");
    Node *condition = parse_expression(p);
    expect(p, TOK_RPAREN, "')' attendue");

    Node *body = parse_statement(p);

    return make_while(condition, body);
}

Node *parse_block(Parser *p) {
    expect(p, TOK_LBRACE, "'{' attendue");

    Node **statements = NULL;
    int count = 0;

    while (!check(p, TOK_RBRACE) && !check(p, TOK_EOF)) {
        statements = realloc(statements, sizeof(Node*) * (count + 1));
        statements[count++] = parse_declaration(p);
    }

    expect(p, TOK_RBRACE, "'}' attendue");

    return make_block(statements, count);
}
```

## Exercices

### Exercice 1 : Calculatrice

Implémentez un parser pour des expressions arithmétiques :
```
expr → term (('+' | '-') term)*
term → factor (('*' | '/') factor)*
factor → NUMBER | '(' expr ')'
```

### Exercice 2 : AST Printer

Implémentez une fonction qui affiche l'AST :

```
// Pour: 2 + 3 * 4
BinaryOp(+)
├── Number(2)
└── BinaryOp(*)
    ├── Number(3)
    └── Number(4)
```

### Exercice 3 : Gestion des erreurs

Ajoutez la synchronisation des erreurs pour continuer après une erreur :

```c
void synchronize(Parser *p) {
    advance(p);

    while (!check(p, TOK_EOF)) {
        if (p->previous.type == TOK_SEMICOLON) return;

        switch (p->current.type) {
            case TOK_INT:
            case TOK_IF:
            case TOK_WHILE:
            case TOK_RETURN:
                return;
        }

        advance(p);
    }
}
```

### Exercice 4 : Opérateur ternaire

Ajoutez le support de `a ? b : c` :

```
conditional → logic_or ('?' expression ':' conditional)?
```

## Points clés

1. **Précédence** : Chaque niveau de précédence = une fonction
2. **Associativité** : Gauche = boucle while, Droite = récursion
3. **Lookahead** : `check()` pour regarder sans consommer
4. **Récursion** : La grammaire dicte la structure du code

## Prochaine étape

[Chapitre 3 : L'AST →](03_ast.md)
