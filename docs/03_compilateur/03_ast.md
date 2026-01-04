# Chapitre 3 : L'AST et l'Analyse Sémantique

## Objectif

Après le parsing, l'AST doit être **validé** et **enrichi** :
- Vérification des types
- Résolution des symboles
- Détection des erreurs sémantiques

## La Table des Symboles

### Concept

La table des symboles associe chaque nom à sa définition :

```c
int x = 5;        // x → Variable(int, global)
int add(int a) {  // add → Fonction(int → int)
    int y = a;    // y → Variable(int, local, offset=-4)
    return y + x;
}
```

### Implémentation

```c
typedef enum {
    SYM_VARIABLE,
    SYM_FUNCTION,
    SYM_PARAM
} SymbolKind;

typedef struct Symbol {
    char *name;
    SymbolKind kind;
    char *type_name;       // "int", "char", etc.

    // Pour les variables
    int is_global;
    int stack_offset;      // Offset par rapport à FP

    // Pour les fonctions
    int param_count;
    struct Symbol **params;

    struct Symbol *next;   // Liste chaînée
} Symbol;

typedef struct Scope {
    Symbol *symbols;       // Symboles de ce scope
    struct Scope *parent;  // Scope englobant
    int local_offset;      // Prochain offset de variable locale
} Scope;
```

### Gestion des scopes

```c
Scope *current_scope = NULL;

void push_scope() {
    Scope *scope = malloc(sizeof(Scope));
    scope->symbols = NULL;
    scope->parent = current_scope;
    scope->local_offset = current_scope ? current_scope->local_offset : 0;
    current_scope = scope;
}

void pop_scope() {
    current_scope = current_scope->parent;
}

void define(char *name, SymbolKind kind, char *type) {
    // Vérifie si déjà défini dans ce scope
    for (Symbol *s = current_scope->symbols; s; s = s->next) {
        if (strcmp(s->name, name) == 0) {
            error("Symbole '%s' déjà défini", name);
            return;
        }
    }

    Symbol *sym = malloc(sizeof(Symbol));
    sym->name = name;
    sym->kind = kind;
    sym->type_name = type;
    sym->is_global = (current_scope->parent == NULL);

    if (kind == SYM_VARIABLE && !sym->is_global) {
        current_scope->local_offset -= 4;  // 4 bytes par variable
        sym->stack_offset = current_scope->local_offset;
    }

    sym->next = current_scope->symbols;
    current_scope->symbols = sym;
}

Symbol *lookup(char *name) {
    for (Scope *scope = current_scope; scope; scope = scope->parent) {
        for (Symbol *s = scope->symbols; s; s = s->next) {
            if (strcmp(s->name, name) == 0) {
                return s;
            }
        }
    }
    return NULL;  // Non trouvé
}
```

## Vérification de Type

### Le système de types

Pour notre sous-ensemble de C :

```c
typedef enum {
    TYPE_VOID,
    TYPE_INT,
    TYPE_CHAR,
    TYPE_POINTER,
    TYPE_ARRAY,
    TYPE_FUNCTION
} TypeKind;

typedef struct Type {
    TypeKind kind;

    // Pour TYPE_POINTER et TYPE_ARRAY
    struct Type *base;

    // Pour TYPE_ARRAY
    int array_size;

    // Pour TYPE_FUNCTION
    struct Type *return_type;
    struct Type **param_types;
    int param_count;
} Type;

// Types de base (singletons)
Type type_void = { TYPE_VOID };
Type type_int  = { TYPE_INT };
Type type_char = { TYPE_CHAR };

Type *make_pointer(Type *base) {
    Type *t = malloc(sizeof(Type));
    t->kind = TYPE_POINTER;
    t->base = base;
    return t;
}
```

### Vérification des expressions

```c
Type *typecheck_expr(Node *node) {
    switch (node->type) {
        case NODE_NUMBER:
            return &type_int;

        case NODE_STRING:
            return make_pointer(&type_char);

        case NODE_IDENT: {
            Symbol *sym = lookup(node->ident_name);
            if (!sym) {
                error("Variable '%s' non déclarée", node->ident_name);
                return &type_int;
            }
            node->symbol = sym;  // Enrichit l'AST
            return parse_type(sym->type_name);
        }

        case NODE_BINARY: {
            Type *left = typecheck_expr(node->binary.left);
            Type *right = typecheck_expr(node->binary.right);

            switch (node->binary.op) {
                case TOK_PLUS:
                case TOK_MINUS:
                    // int + int → int
                    // ptr + int → ptr
                    if (left->kind == TYPE_POINTER && right->kind == TYPE_INT) {
                        return left;
                    }
                    if (left->kind == TYPE_INT && right->kind == TYPE_INT) {
                        return &type_int;
                    }
                    error("Types incompatibles pour +/-");
                    return &type_int;

                case TOK_STAR:
                case TOK_SLASH:
                    if (left->kind != TYPE_INT || right->kind != TYPE_INT) {
                        error("* et / requièrent des entiers");
                    }
                    return &type_int;

                case TOK_EQ:
                case TOK_NE:
                case TOK_LT:
                case TOK_LE:
                case TOK_GT:
                case TOK_GE:
                    // Comparaison → int (booléen)
                    return &type_int;
            }
            break;
        }

        case NODE_CALL: {
            Symbol *sym = lookup(node->call.callee);
            if (!sym || sym->kind != SYM_FUNCTION) {
                error("'%s' n'est pas une fonction", node->call.callee);
                return &type_int;
            }

            // Vérifie le nombre d'arguments
            if (node->call.arg_count != sym->param_count) {
                error("Nombre d'arguments incorrect pour '%s'", node->call.callee);
            }

            // Vérifie les types des arguments
            for (int i = 0; i < node->call.arg_count && i < sym->param_count; i++) {
                Type *arg_type = typecheck_expr(node->call.args[i]);
                Type *param_type = parse_type(sym->params[i]->type_name);
                if (!types_compatible(arg_type, param_type)) {
                    error("Type d'argument %d incorrect", i + 1);
                }
            }

            node->symbol = sym;
            return parse_type(sym->type_name);
        }

        case NODE_ASSIGN: {
            Symbol *sym = lookup(node->assign.name);
            if (!sym) {
                error("Variable '%s' non déclarée", node->assign.name);
            }
            Type *value_type = typecheck_expr(node->assign.value);
            Type *var_type = parse_type(sym->type_name);
            if (!types_compatible(value_type, var_type)) {
                error("Types incompatibles dans l'affectation");
            }
            node->symbol = sym;
            return var_type;
        }
    }

    return &type_int;
}
```

### Vérification des statements

```c
Type *current_return_type = NULL;

void typecheck_stmt(Node *node) {
    switch (node->type) {
        case NODE_VAR_DECL: {
            typecheck_expr(node->var_decl.init);
            define(node->var_decl.name, SYM_VARIABLE, node->var_decl.type_name);
            break;
        }

        case NODE_IF: {
            Type *cond = typecheck_expr(node->if_stmt.condition);
            // La condition doit être un entier
            typecheck_stmt(node->if_stmt.then_branch);
            if (node->if_stmt.else_branch) {
                typecheck_stmt(node->if_stmt.else_branch);
            }
            break;
        }

        case NODE_WHILE: {
            Type *cond = typecheck_expr(node->while_stmt.condition);
            typecheck_stmt(node->while_stmt.body);
            break;
        }

        case NODE_RETURN: {
            Type *ret = &type_void;
            if (node->return_stmt.value) {
                ret = typecheck_expr(node->return_stmt.value);
            }
            if (!types_compatible(ret, current_return_type)) {
                error("Type de retour incompatible");
            }
            break;
        }

        case NODE_BLOCK: {
            push_scope();
            for (int i = 0; i < node->block.stmt_count; i++) {
                typecheck_stmt(node->block.statements[i]);
            }
            pop_scope();
            break;
        }

        default:
            // Expression statement
            typecheck_expr(node);
    }
}

void typecheck_func(Node *node) {
    push_scope();

    // Déclare les paramètres
    for (int i = 0; i < node->func_decl.param_count; i++) {
        Node *param = node->func_decl.params[i];
        define(param->param.name, SYM_PARAM, param->param.type_name);
    }

    current_return_type = parse_type(node->func_decl.return_type);
    typecheck_stmt(node->func_decl.body);

    pop_scope();
}
```

## Enrichissement de l'AST

Après l'analyse sémantique, l'AST est enrichi avec :

```c
struct Node {
    // ... champs existants ...

    // Ajoutés par l'analyse sémantique :
    Symbol *symbol;        // Pour les identifiants
    Type *expr_type;       // Type de l'expression
    int requires_lvalue;   // Est-ce une l-value ?
};
```

## Exercices

### Exercice 1 : Table des symboles

Implémentez une table des symboles avec scopes imbriqués.
Testez avec :

```c
int x = 1;
int main() {
    int x = 2;
    {
        int x = 3;
        print(x);  // Doit résoudre vers le x local (3)
    }
    print(x);      // Doit résoudre vers x de main (2)
}
```

### Exercice 2 : Vérification de types

Détectez les erreurs dans :

```c
int main() {
    int x;
    char *s = "hello";
    x = s;           // Erreur: int = char*
    x = foo(1, 2);   // Erreur si foo n'existe pas
    return "bye";    // Erreur: return char* au lieu de int
}
```

### Exercice 3 : Variables non initialisées

Ajoutez une analyse pour détecter l'utilisation de variables avant initialisation :

```c
int main() {
    int x;
    int y = x + 1;  // Warning: x non initialisé
    x = 5;
    y = x + 1;      // OK
}
```

### Exercice 4 : Code mort

Détectez le code après un `return` :

```c
int foo() {
    return 1;
    int x = 2;  // Warning: code inaccessible
}
```

## Points clés

1. **Scopes** : Structure imbriquée pour la visibilité
2. **Lookup** : Recherche du scope local vers le global
3. **Types** : Représentation arborescente (pointeur → base)
4. **Enrichissement** : L'AST gagne des informations

## Prochaine étape

[Chapitre 4 : Génération de code →](04_codegen.md)
