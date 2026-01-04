# Chapitre 5 : Optimisations

## Objectif

Améliorer le code généré en termes de :
- **Taille** : moins d'instructions
- **Vitesse** : moins de cycles
- **Registres** : moins d'accès mémoire

## Niveaux d'optimisation

```
┌─────────────────────────────────────────────────────────┐
│                    Code source                          │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Optimisations sur l'AST                    │
│  • Constant folding                                     │
│  • Dead code elimination                                │
│  • Strength reduction                                   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│         Optimisations sur la génération                 │
│  • Allocation de registres                              │
│  • Peephole optimization                                │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  Code assembleur                        │
└─────────────────────────────────────────────────────────┘
```

## 1. Constant Folding

Évalue les expressions constantes à la compilation.

### Avant

```c
int x = 2 + 3 * 4;
```

```asm
MOV R0, #2
MOV R1, #3
MOV R2, #4
MUL R1, R1, R2
ADD R0, R0, R1
```

### Après

```c
int x = 14;  // Calculé à la compilation
```

```asm
MOV R0, #14
```

### Implémentation

```c
Node *fold_constants(Node *node) {
    if (node->type != NODE_BINARY) {
        return node;
    }

    // Récursion d'abord
    node->binary.left = fold_constants(node->binary.left);
    node->binary.right = fold_constants(node->binary.right);

    // Les deux côtés sont des constantes ?
    if (node->binary.left->type == NODE_NUMBER &&
        node->binary.right->type == NODE_NUMBER) {

        int left = node->binary.left->number_value;
        int right = node->binary.right->number_value;
        int result;

        switch (node->binary.op) {
            case TOK_PLUS:  result = left + right; break;
            case TOK_MINUS: result = left - right; break;
            case TOK_STAR:  result = left * right; break;
            case TOK_SLASH: result = left / right; break;
            case TOK_EQ:    result = left == right; break;
            case TOK_LT:    result = left < right; break;
            // ...
            default: return node;
        }

        return make_number(result);
    }

    return node;
}
```

## 2. Dead Code Elimination

Supprime le code qui n'a pas d'effet.

### Cas 1 : Code après return

```c
int foo() {
    return 1;
    int x = 2;  // Jamais exécuté
    return x;   // Jamais exécuté
}
```

### Cas 2 : Conditions constantes

```c
if (0) {
    // Jamais exécuté
}

while (0) {
    // Jamais exécuté
}
```

### Cas 3 : Variables non utilisées

```c
int foo() {
    int x = expensive_call();  // x jamais lu
    return 42;
}
```

### Implémentation

```c
int always_returns(Node *stmt) {
    switch (stmt->type) {
        case NODE_RETURN:
            return 1;

        case NODE_BLOCK:
            for (int i = 0; i < stmt->block.stmt_count; i++) {
                if (always_returns(stmt->block.statements[i])) {
                    // Tout ce qui suit est mort
                    stmt->block.stmt_count = i + 1;
                    return 1;
                }
            }
            return 0;

        case NODE_IF:
            return always_returns(stmt->if_stmt.then_branch) &&
                   stmt->if_stmt.else_branch &&
                   always_returns(stmt->if_stmt.else_branch);

        default:
            return 0;
    }
}

Node *eliminate_dead_code(Node *node) {
    if (node->type == NODE_IF) {
        // Condition constante ?
        if (node->if_stmt.condition->type == NODE_NUMBER) {
            if (node->if_stmt.condition->number_value) {
                return node->if_stmt.then_branch;  // Toujours vrai
            } else {
                if (node->if_stmt.else_branch) {
                    return node->if_stmt.else_branch;  // Toujours faux
                }
                return NULL;  // Supprime le if
            }
        }
    }

    // ... etc.
    return node;
}
```

## 3. Strength Reduction

Remplace les opérations coûteuses par des équivalents moins chers.

| Opération | Remplacement |
|-----------|--------------|
| `x * 2` | `x + x` ou `x << 1` |
| `x * 4` | `x << 2` |
| `x * 2^n` | `x << n` |
| `x / 2` | `x >> 1` (si non signé) |
| `x % 2^n` | `x & (2^n - 1)` |

### Implémentation

```c
Node *strength_reduce(Node *node) {
    if (node->type != NODE_BINARY) {
        return node;
    }

    Node *left = node->binary.left;
    Node *right = node->binary.right;

    // x * constante
    if (node->binary.op == TOK_STAR && right->type == NODE_NUMBER) {
        int n = right->number_value;

        // Puissance de 2 ?
        if (n > 0 && (n & (n - 1)) == 0) {
            int shift = 0;
            while ((1 << shift) < n) shift++;

            return make_binary(TOK_SHL, left, make_number(shift));
        }

        // x * 2 → x + x
        if (n == 2) {
            return make_binary(TOK_PLUS, left, copy_node(left));
        }
    }

    // x / puissance de 2 (non signé)
    if (node->binary.op == TOK_SLASH && right->type == NODE_NUMBER) {
        int n = right->number_value;
        if (n > 0 && (n & (n - 1)) == 0) {
            int shift = 0;
            while ((1 << shift) < n) shift++;
            return make_binary(TOK_SHR, left, make_number(shift));
        }
    }

    // x % puissance de 2
    if (node->binary.op == TOK_MOD && right->type == NODE_NUMBER) {
        int n = right->number_value;
        if (n > 0 && (n & (n - 1)) == 0) {
            return make_binary(TOK_AND, left, make_number(n - 1));
        }
    }

    return node;
}
```

## 4. Allocation de Registres

Réduit les accès mémoire en gardant les valeurs dans les registres.

### Avant (naïf)

```c
int a = 1;
int b = 2;
int c = a + b;
```

```asm
MOV R0, #1
STR R0, [FP, #-4]   ; store a
MOV R0, #2
STR R0, [FP, #-8]   ; store b
LDR R0, [FP, #-4]   ; load a
LDR R1, [FP, #-8]   ; load b
ADD R0, R0, R1
STR R0, [FP, #-12]  ; store c
```

### Après (optimisé)

```asm
MOV R4, #1          ; a dans R4
MOV R5, #2          ; b dans R5
ADD R6, R4, R5      ; c dans R6
```

### Algorithme simple : Linear Scan

```c
typedef struct {
    Symbol *var;
    int start;       // Première utilisation
    int end;         // Dernière utilisation
    int reg;         // Registre alloué (-1 si mémoire)
} LiveInterval;

void allocate_registers(Function *func) {
    LiveInterval *intervals = compute_live_intervals(func);
    int num_intervals = count_intervals(func);

    // Trie par début d'intervalle
    sort_by_start(intervals, num_intervals);

    int available_regs = 0xFF;  // R4-R11 disponibles

    for (int i = 0; i < num_intervals; i++) {
        // Libère les registres des intervalles terminés
        for (int j = 0; j < i; j++) {
            if (intervals[j].end < intervals[i].start) {
                if (intervals[j].reg >= 0) {
                    available_regs |= (1 << intervals[j].reg);
                }
            }
        }

        // Alloue un registre
        if (available_regs) {
            int reg = find_first_set(available_regs);
            intervals[i].reg = reg;
            available_regs &= ~(1 << reg);
        } else {
            intervals[i].reg = -1;  // Spill to memory
        }
    }
}
```

## 5. Peephole Optimization

Optimise des séquences d'instructions locales.

### Patterns courants

| Avant | Après |
|-------|-------|
| `MOV R0, R0` | (supprimé) |
| `MOV R0, R1; MOV R1, R0` | `MOV R0, R1` |
| `ADD R0, R0, #0` | (supprimé) |
| `MUL R0, R0, #1` | (supprimé) |
| `PUSH R0; POP R0` | (supprimé) |
| `B .L1; .L1:` | (B supprimé) |

### Implémentation

```c
void peephole_optimize(Instruction *instrs, int count) {
    for (int i = 0; i < count - 1; i++) {
        // MOV Rx, Rx → supprimé
        if (instrs[i].op == OP_MOV &&
            instrs[i].rd == instrs[i].rs) {
            remove_instruction(instrs, i, count);
            count--;
            i--;
            continue;
        }

        // PUSH Rx; POP Rx → supprimé
        if (instrs[i].op == OP_PUSH &&
            instrs[i+1].op == OP_POP &&
            instrs[i].rd == instrs[i+1].rd) {
            remove_instruction(instrs, i, count);
            remove_instruction(instrs, i, count - 1);
            count -= 2;
            i--;
            continue;
        }

        // ADD Rx, Rx, #0 → supprimé
        if (instrs[i].op == OP_ADD &&
            instrs[i].rd == instrs[i].rs &&
            instrs[i].imm == 0) {
            remove_instruction(instrs, i, count);
            count--;
            i--;
            continue;
        }
    }
}
```

## 6. Inlining

Remplace l'appel de fonction par son corps.

### Avant

```c
int square(int x) { return x * x; }
int main() { return square(5); }
```

### Après

```c
int main() { return 5 * 5; }  // puis constant folding → 25
```

### Critères d'inlining

- Fonction petite (< 10 instructions)
- Appelée peu de fois ou dans une boucle chaude
- Pas récursive
- Pas d'effets de bord complexes

## Exercices

### Exercice 1 : Constant Folding complet

Étendez le constant folding pour :
- Les opérations unaires (`-5`, `!0`)
- Les comparaisons (`3 < 5` → `1`)
- Les expressions booléennes (`1 && 0` → `0`)

### Exercice 2 : Common Subexpression Elimination

Éliminez les calculs redondants :

```c
int a = x + y;
int b = x + y;  // Réutilise le calcul de a
```

### Exercice 3 : Loop-Invariant Code Motion

Sortez les calculs constants des boucles :

```c
while (i < n) {
    x = y * z;  // y et z constants → sortir de la boucle
    arr[i] = x;
    i++;
}
```

### Exercice 4 : Tail Call Optimization

Optimisez les appels en queue :

```c
int factorial(int n, int acc) {
    if (n <= 1) return acc;
    return factorial(n - 1, n * acc);  // Tail call
}
```

## Mesurer les optimisations

```c
// Compteurs
int instructions_before;
int instructions_after;
int memory_accesses_before;
int memory_accesses_after;

// Ratio
float reduction = 1.0 - (float)instructions_after / instructions_before;
printf("Réduction: %.1f%%\n", reduction * 100);
```

## Points clés

1. **Correctness first** : Ne jamais changer la sémantique
2. **Mesurer** : Valider les gains réels
3. **Trade-offs** : Taille vs vitesse, compilation vs exécution
4. **Limites** : Certaines optimisations sont indécidables

## Récapitulatif du compilateur

```
┌──────────────────────────────────────────┐
│  Source → Lexer → Tokens                 │  Chapitre 1
├──────────────────────────────────────────┤
│  Tokens → Parser → AST                   │  Chapitre 2
├──────────────────────────────────────────┤
│  AST → Sémantique → AST enrichi          │  Chapitre 3
├──────────────────────────────────────────┤
│  AST → Codegen → Assembleur              │  Chapitre 4
├──────────────────────────────────────────┤
│  Optimisations (tous niveaux)            │  Chapitre 5
└──────────────────────────────────────────┘
```

Félicitations ! Vous avez les bases pour construire votre propre compilateur.
