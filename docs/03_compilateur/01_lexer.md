# Chapitre 1 : Le Lexer (Analyse Lexicale)

## Objectif

Transformer une chaîne de caractères en une séquence de **tokens** (jetons).

```
"int x = 42 + y;"
         ↓
[INT, IDENT("x"), EQUALS, NUMBER(42), PLUS, IDENT("y"), SEMICOLON]
```

## Concepts clés

### Qu'est-ce qu'un token ?

Un token est l'unité atomique du langage :

| Type | Exemples | Regex |
|------|----------|-------|
| Mot-clé | `int`, `if`, `while`, `return` | Mots réservés |
| Identifiant | `x`, `foo`, `myVar` | `[a-zA-Z_][a-zA-Z0-9_]*` |
| Nombre | `42`, `0x1F`, `0b101` | `[0-9]+` |
| Opérateur | `+`, `-`, `*`, `==`, `<=` | Symboles |
| Ponctuation | `(`, `)`, `{`, `}`, `;` | Caractères spéciaux |
| Chaîne | `"hello"` | `"[^"]*"` |

### Structure d'un token

```c
typedef enum {
    TOK_INT, TOK_IF, TOK_WHILE, TOK_RETURN,  // Mots-clés
    TOK_IDENT, TOK_NUMBER, TOK_STRING,        // Littéraux
    TOK_PLUS, TOK_MINUS, TOK_STAR, TOK_SLASH, // Opérateurs
    TOK_EQ, TOK_NE, TOK_LT, TOK_LE, TOK_GT, TOK_GE,
    TOK_ASSIGN,                                // =
    TOK_LPAREN, TOK_RPAREN,                   // ( )
    TOK_LBRACE, TOK_RBRACE,                   // { }
    TOK_SEMICOLON, TOK_COMMA,                 // ; ,
    TOK_EOF                                    // Fin de fichier
} TokenType;

typedef struct {
    TokenType type;
    char *text;      // Texte original
    int value;       // Pour les nombres
    int line;        // Numéro de ligne (pour les erreurs)
    int column;      // Colonne
} Token;
```

## Implémentation

### Le Lexer

```c
typedef struct {
    char *source;    // Code source
    int pos;         // Position courante
    int line;        // Ligne courante
    int column;      // Colonne courante
    Token current;   // Token courant
} Lexer;

void lexer_init(Lexer *l, char *source) {
    l->source = source;
    l->pos = 0;
    l->line = 1;
    l->column = 1;
}
```

### Avancer dans le source

```c
char peek(Lexer *l) {
    return l->source[l->pos];
}

char peek_next(Lexer *l) {
    if (l->source[l->pos] == '\0') return '\0';
    return l->source[l->pos + 1];
}

char advance(Lexer *l) {
    char c = l->source[l->pos++];
    if (c == '\n') {
        l->line++;
        l->column = 1;
    } else {
        l->column++;
    }
    return c;
}
```

### Sauter les espaces et commentaires

```c
void skip_whitespace(Lexer *l) {
    while (1) {
        char c = peek(l);

        // Espaces
        if (c == ' ' || c == '\t' || c == '\n' || c == '\r') {
            advance(l);
            continue;
        }

        // Commentaire ligne //
        if (c == '/' && peek_next(l) == '/') {
            while (peek(l) != '\n' && peek(l) != '\0') {
                advance(l);
            }
            continue;
        }

        // Commentaire bloc /* */
        if (c == '/' && peek_next(l) == '*') {
            advance(l); advance(l);  // Consomme /*
            while (!(peek(l) == '*' && peek_next(l) == '/')) {
                if (peek(l) == '\0') {
                    error("Commentaire non fermé");
                }
                advance(l);
            }
            advance(l); advance(l);  // Consomme */
            continue;
        }

        break;
    }
}
```

### Lire un nombre

```c
Token scan_number(Lexer *l) {
    Token tok;
    tok.type = TOK_NUMBER;
    tok.line = l->line;
    tok.column = l->column;

    int value = 0;
    int start = l->pos;

    // Hexadécimal
    if (peek(l) == '0' && (peek_next(l) == 'x' || peek_next(l) == 'X')) {
        advance(l); advance(l);  // Consomme 0x
        while (is_hex_digit(peek(l))) {
            value = value * 16 + hex_value(advance(l));
        }
    }
    // Binaire
    else if (peek(l) == '0' && (peek_next(l) == 'b' || peek_next(l) == 'B')) {
        advance(l); advance(l);  // Consomme 0b
        while (peek(l) == '0' || peek(l) == '1') {
            value = value * 2 + (advance(l) - '0');
        }
    }
    // Décimal
    else {
        while (is_digit(peek(l))) {
            value = value * 10 + (advance(l) - '0');
        }
    }

    tok.value = value;
    return tok;
}
```

### Lire un identifiant ou mot-clé

```c
Token scan_identifier(Lexer *l) {
    Token tok;
    tok.line = l->line;
    tok.column = l->column;

    int start = l->pos;
    while (is_alpha(peek(l)) || is_digit(peek(l)) || peek(l) == '_') {
        advance(l);
    }

    int len = l->pos - start;
    tok.text = substring(l->source, start, len);

    // Vérifie si c'est un mot-clé
    tok.type = check_keyword(tok.text);

    return tok;
}

TokenType check_keyword(char *text) {
    if (strcmp(text, "int") == 0)    return TOK_INT;
    if (strcmp(text, "char") == 0)   return TOK_CHAR;
    if (strcmp(text, "void") == 0)   return TOK_VOID;
    if (strcmp(text, "if") == 0)     return TOK_IF;
    if (strcmp(text, "else") == 0)   return TOK_ELSE;
    if (strcmp(text, "while") == 0)  return TOK_WHILE;
    if (strcmp(text, "for") == 0)    return TOK_FOR;
    if (strcmp(text, "return") == 0) return TOK_RETURN;
    return TOK_IDENT;
}
```

### La fonction principale : next_token

```c
Token next_token(Lexer *l) {
    skip_whitespace(l);

    Token tok;
    tok.line = l->line;
    tok.column = l->column;

    char c = peek(l);

    // Fin de fichier
    if (c == '\0') {
        tok.type = TOK_EOF;
        return tok;
    }

    // Nombre
    if (is_digit(c)) {
        return scan_number(l);
    }

    // Identifiant ou mot-clé
    if (is_alpha(c) || c == '_') {
        return scan_identifier(l);
    }

    // Chaîne
    if (c == '"') {
        return scan_string(l);
    }

    // Opérateurs et ponctuation
    advance(l);
    switch (c) {
        case '+': tok.type = TOK_PLUS; break;
        case '-': tok.type = TOK_MINUS; break;
        case '*': tok.type = TOK_STAR; break;
        case '/': tok.type = TOK_SLASH; break;

        case '=':
            if (peek(l) == '=') { advance(l); tok.type = TOK_EQ; }
            else { tok.type = TOK_ASSIGN; }
            break;

        case '!':
            if (peek(l) == '=') { advance(l); tok.type = TOK_NE; }
            else { tok.type = TOK_NOT; }
            break;

        case '<':
            if (peek(l) == '=') { advance(l); tok.type = TOK_LE; }
            else { tok.type = TOK_LT; }
            break;

        case '>':
            if (peek(l) == '=') { advance(l); tok.type = TOK_GE; }
            else { tok.type = TOK_GT; }
            break;

        case '(': tok.type = TOK_LPAREN; break;
        case ')': tok.type = TOK_RPAREN; break;
        case '{': tok.type = TOK_LBRACE; break;
        case '}': tok.type = TOK_RBRACE; break;
        case ';': tok.type = TOK_SEMICOLON; break;
        case ',': tok.type = TOK_COMMA; break;

        default:
            error("Caractère invalide: '%c'", c);
    }

    return tok;
}
```

## Exercices

### Exercice 1 : Lexer minimal

Implémentez un lexer qui reconnaît uniquement :
- Les nombres décimaux
- Les opérateurs `+`, `-`, `*`, `/`
- Les parenthèses `(`, `)`

```c
// Entrée: "3 + 4 * (2 - 1)"
// Sortie: [NUM(3), PLUS, NUM(4), STAR, LPAREN, NUM(2), MINUS, NUM(1), RPAREN]
```

### Exercice 2 : Gestion des erreurs

Ajoutez des messages d'erreur avec ligne et colonne :

```
Erreur ligne 5, colonne 12: Caractère invalide '@'
```

### Exercice 3 : Nombres hexadécimaux et binaires

Ajoutez le support de :
- `0xFF` (hexadécimal)
- `0b1010` (binaire)

### Exercice 4 : Chaînes avec échappement

Supportez les séquences d'échappement dans les chaînes :
- `\n` → newline
- `\t` → tab
- `\\` → backslash
- `\"` → guillemet

## Points clés

1. **Lookahead** : Parfois il faut regarder le prochain caractère (`==` vs `=`)
2. **Position** : Garder ligne/colonne pour les messages d'erreur
3. **Mots-clés vs identifiants** : Même regex, distinction par table
4. **Commentaires** : Traités comme des espaces (ignorés)

## Prochaine étape

[Chapitre 2 : Le Parser →](02_parser.md)
