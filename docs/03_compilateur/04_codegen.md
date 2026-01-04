# Chapitre 4 : Génération de Code

## Objectif

Transformer l'AST en code assembleur A32.

```c
int x = 2 + 3;
```

```asm
    MOV R0, #2
    MOV R1, #3
    ADD R0, R0, R1
    STR R0, [FP, #-4]   ; x est à FP-4
```

## Rappel : Architecture A32

### Registres
- `R0-R12` : Usage général
- `R13 (SP)` : Stack Pointer
- `R14 (LR)` : Link Register (adresse de retour)
- `R15 (PC)` : Program Counter
- `FP` (alias R11) : Frame Pointer

### Convention d'appel
- Arguments : R0-R3, puis sur la pile
- Retour : R0
- Registres sauvegardés : R4-R11
- La pile grandit vers le bas

## Stack Frame

```
    ┌──────────────────┐ Adresses hautes
    │   Argument N     │  FP + 8 + 4*(N-5)
    │       ...        │
    │   Argument 5     │  FP + 8
    ├──────────────────┤
    │   Ancien LR      │  FP + 4
    │   Ancien FP      │  FP
    ├──────────────────┤
    │   Variable 1     │  FP - 4
    │   Variable 2     │  FP - 8
    │       ...        │
    │   Temporaires    │
    ├──────────────────┤
    │                  │  SP
    └──────────────────┘ Adresses basses
```

## Générateur de code

### Structure

```c
typedef struct {
    FILE *out;           // Fichier de sortie
    int label_count;     // Compteur pour labels uniques
    int stack_offset;    // Offset courant sur la pile
    Symbol *current_func;
} CodeGen;

void emit(CodeGen *g, char *fmt, ...) {
    va_list args;
    va_start(args, fmt);
    vfprintf(g->out, fmt, args);
    fprintf(g->out, "\n");
    va_end(args);
}

int new_label(CodeGen *g) {
    return g->label_count++;
}
```

### Génération des expressions

```c
// Génère le code pour une expression, résultat dans R0
void gen_expr(CodeGen *g, Node *node) {
    switch (node->type) {
        case NODE_NUMBER:
            emit(g, "    MOV R0, #%d", node->number_value);
            break;

        case NODE_IDENT: {
            Symbol *sym = node->symbol;
            if (sym->is_global) {
                emit(g, "    LDR R0, =%s", sym->name);
                emit(g, "    LDR R0, [R0]");
            } else {
                emit(g, "    LDR R0, [FP, #%d]", sym->stack_offset);
            }
            break;
        }

        case NODE_BINARY:
            gen_binary(g, node);
            break;

        case NODE_UNARY:
            gen_unary(g, node);
            break;

        case NODE_CALL:
            gen_call(g, node);
            break;

        case NODE_ASSIGN:
            gen_assign(g, node);
            break;
    }
}

void gen_binary(CodeGen *g, Node *node) {
    // Évalue le côté gauche
    gen_expr(g, node->binary.left);
    emit(g, "    PUSH {R0}");

    // Évalue le côté droit
    gen_expr(g, node->binary.right);
    emit(g, "    MOV R1, R0");

    // Récupère le côté gauche
    emit(g, "    POP {R0}");

    // Opération
    switch (node->binary.op) {
        case TOK_PLUS:
            emit(g, "    ADD R0, R0, R1");
            break;
        case TOK_MINUS:
            emit(g, "    SUB R0, R0, R1");
            break;
        case TOK_STAR:
            emit(g, "    MUL R0, R0, R1");
            break;
        case TOK_SLASH:
            emit(g, "    SDIV R0, R0, R1");
            break;
        case TOK_EQ:
            emit(g, "    CMP R0, R1");
            emit(g, "    MOV R0, #0");
            emit(g, "    MOVEQ R0, #1");
            break;
        case TOK_NE:
            emit(g, "    CMP R0, R1");
            emit(g, "    MOV R0, #0");
            emit(g, "    MOVNE R0, #1");
            break;
        case TOK_LT:
            emit(g, "    CMP R0, R1");
            emit(g, "    MOV R0, #0");
            emit(g, "    MOVLT R0, #1");
            break;
        // ... etc.
    }
}

void gen_unary(CodeGen *g, Node *node) {
    gen_expr(g, node->unary.operand);

    switch (node->unary.op) {
        case TOK_MINUS:
            emit(g, "    RSB R0, R0, #0");  // R0 = 0 - R0
            break;
        case TOK_NOT:
            emit(g, "    CMP R0, #0");
            emit(g, "    MOV R0, #0");
            emit(g, "    MOVEQ R0, #1");
            break;
    }
}
```

### Génération des appels de fonction

```c
void gen_call(CodeGen *g, Node *node) {
    int arg_count = node->call.arg_count;

    // Empile les arguments en ordre inverse
    for (int i = arg_count - 1; i >= 0; i--) {
        gen_expr(g, node->call.args[i]);

        if (i < 4) {
            // Arguments 0-3 dans R0-R3
            emit(g, "    MOV R%d, R0", i);
        } else {
            // Arguments 4+ sur la pile
            emit(g, "    PUSH {R0}");
        }
    }

    // Appel
    emit(g, "    BL %s", node->call.callee);

    // Nettoie la pile si nécessaire
    if (arg_count > 4) {
        emit(g, "    ADD SP, SP, #%d", (arg_count - 4) * 4);
    }

    // Le résultat est dans R0
}
```

### Génération des statements

```c
void gen_stmt(CodeGen *g, Node *node) {
    switch (node->type) {
        case NODE_VAR_DECL:
            gen_var_decl(g, node);
            break;

        case NODE_IF:
            gen_if(g, node);
            break;

        case NODE_WHILE:
            gen_while(g, node);
            break;

        case NODE_RETURN:
            gen_return(g, node);
            break;

        case NODE_BLOCK:
            for (int i = 0; i < node->block.stmt_count; i++) {
                gen_stmt(g, node->block.statements[i]);
            }
            break;

        default:
            // Expression statement
            gen_expr(g, node);
            break;
    }
}

void gen_var_decl(CodeGen *g, Node *node) {
    Symbol *sym = node->symbol;

    if (node->var_decl.init) {
        gen_expr(g, node->var_decl.init);
        emit(g, "    STR R0, [FP, #%d]", sym->stack_offset);
    }
}

void gen_if(CodeGen *g, Node *node) {
    int else_label = new_label(g);
    int end_label = new_label(g);

    // Condition
    gen_expr(g, node->if_stmt.condition);
    emit(g, "    CMP R0, #0");
    emit(g, "    BEQ .L%d", else_label);

    // Then
    gen_stmt(g, node->if_stmt.then_branch);

    if (node->if_stmt.else_branch) {
        emit(g, "    B .L%d", end_label);
    }

    // Else
    emit(g, ".L%d:", else_label);
    if (node->if_stmt.else_branch) {
        gen_stmt(g, node->if_stmt.else_branch);
        emit(g, ".L%d:", end_label);
    }
}

void gen_while(CodeGen *g, Node *node) {
    int loop_label = new_label(g);
    int end_label = new_label(g);

    // Début de boucle
    emit(g, ".L%d:", loop_label);

    // Condition
    gen_expr(g, node->while_stmt.condition);
    emit(g, "    CMP R0, #0");
    emit(g, "    BEQ .L%d", end_label);

    // Corps
    gen_stmt(g, node->while_stmt.body);
    emit(g, "    B .L%d", loop_label);

    // Fin
    emit(g, ".L%d:", end_label);
}

void gen_return(CodeGen *g, Node *node) {
    if (node->return_stmt.value) {
        gen_expr(g, node->return_stmt.value);
    }

    // Épilogue
    emit(g, "    MOV SP, FP");
    emit(g, "    POP {FP, PC}");
}
```

### Génération des fonctions

```c
void gen_function(CodeGen *g, Node *node) {
    Symbol *sym = node->symbol;
    g->current_func = sym;

    // Label
    emit(g, "%s:", node->func_decl.name);

    // Prologue
    emit(g, "    PUSH {FP, LR}");
    emit(g, "    MOV FP, SP");

    // Alloue l'espace pour les variables locales
    int local_size = calculate_local_size(node);
    if (local_size > 0) {
        emit(g, "    SUB SP, SP, #%d", local_size);
    }

    // Sauvegarde les paramètres
    for (int i = 0; i < node->func_decl.param_count && i < 4; i++) {
        Symbol *param = node->func_decl.params[i]->symbol;
        emit(g, "    STR R%d, [FP, #%d]", i, param->stack_offset);
    }

    // Corps
    gen_stmt(g, node->func_decl.body);

    // Épilogue (si pas de return explicite)
    emit(g, "    MOV SP, FP");
    emit(g, "    POP {FP, PC}");
}
```

### Génération des données

```c
void gen_globals(CodeGen *g, Node *program) {
    emit(g, ".data");

    for (int i = 0; i < program->program.decl_count; i++) {
        Node *decl = program->program.decls[i];

        if (decl->type == NODE_VAR_DECL && decl->symbol->is_global) {
            if (decl->var_decl.init) {
                // Variable initialisée
                emit(g, "%s: .word %d",
                     decl->var_decl.name,
                     decl->var_decl.init->number_value);
            } else {
                // Variable non initialisée
                emit(g, "%s: .word 0", decl->var_decl.name);
            }
        }
    }

    // Chaînes littérales
    for (int i = 0; i < g->string_count; i++) {
        emit(g, ".str%d: .asciz \"%s\"", i, g->strings[i]);
    }
}
```

## Exemple complet

### Code C

```c
int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}
```

### Code assembleur généré

```asm
factorial:
    PUSH {FP, LR}
    MOV FP, SP
    SUB SP, SP, #4          ; 1 variable locale implicite

    STR R0, [FP, #-4]       ; n = R0

    ; if (n <= 1)
    LDR R0, [FP, #-4]       ; R0 = n
    CMP R0, #1
    BGT .L0

    ; return 1
    MOV R0, #1
    MOV SP, FP
    POP {FP, PC}

.L0:
    ; n * factorial(n - 1)
    LDR R0, [FP, #-4]       ; R0 = n
    PUSH {R0}

    LDR R0, [FP, #-4]       ; R0 = n
    SUB R0, R0, #1          ; R0 = n - 1
    BL factorial            ; R0 = factorial(n-1)

    POP {R1}                ; R1 = n
    MUL R0, R1, R0          ; R0 = n * factorial(n-1)

    MOV SP, FP
    POP {FP, PC}
```

## Exercices

### Exercice 1 : Expressions simples

Générez le code pour :
```c
int x = 2 + 3 * 4;
```

### Exercice 2 : Boucle for

Implémentez la génération de `for` :
```c
for (int i = 0; i < 10; i = i + 1) {
    // corps
}
```

### Exercice 3 : Tableaux

Ajoutez le support des tableaux :
```c
int arr[10];
arr[5] = 42;
int x = arr[5];
```

### Exercice 4 : Optimisation des constantes

Si les deux opérandes sont des constantes, calculez à la compilation :
```c
int x = 2 + 3;  // → MOV R0, #5 (pas ADD)
```

## Points clés

1. **Stack frame** : Organisé autour de FP
2. **Convention d'appel** : Arguments R0-R3, retour R0
3. **Labels** : Numérotation unique pour éviter les conflits
4. **Ordre d'évaluation** : Gauche → pile → droite → opération

## Prochaine étape

[Chapitre 5 : Optimisations →](05_optimisations.md)
