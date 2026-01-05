// ============================================================================
// COMPILER CONSTRUCTION EXERCISES
// Construction progressive d'un compilateur C → A32 Assembly
// ============================================================================

export const COMPILER_EXERCISES = {

    // ========================================================================
    // PHASE 1: LEXER (Analyse Lexicale)
    // Le lexer transforme le texte en tokens
    // ========================================================================

    'cc-lexer-digit': {
        id: 'cc-lexer-digit',
        name: '1.1 Reconnaître un Chiffre',
        description: `Le **lexer** (analyseur lexical) est la première étape du compilateur.
Il transforme une chaîne de caractères en **tokens** (jetons).

Implémentez \`is_digit(c)\` qui retourne 1 si le caractère est un chiffre ('0'-'9'), 0 sinon.

**Exemple:**
- \`is_digit('5')\` → 1
- \`is_digit('a')\` → 0`,
        template: `// Retourne 1 si c est un chiffre, 0 sinon
int is_digit(char c) {
    // TODO: Vérifier si c est entre '0' et '9'
    return 0;
}

int main() {
    int score = 0;
    if (is_digit('0') == 1) score = score + 1;
    if (is_digit('5') == 1) score = score + 1;
    if (is_digit('9') == 1) score = score + 1;
    if (is_digit('a') == 0) score = score + 1;
    if (is_digit(' ') == 0) score = score + 1;
    return score;  // Doit retourner 5
}`,
        solution: `int is_digit(char c) {
    return c >= '0' && c <= '9';
}

int main() {
    int score = 0;
    if (is_digit('0') == 1) score = score + 1;
    if (is_digit('5') == 1) score = score + 1;
    if (is_digit('9') == 1) score = score + 1;
    if (is_digit('a') == 0) score = score + 1;
    if (is_digit(' ') == 0) score = score + 1;
    return score;
}`,
        test: { expectedReturn: 5 }
    },

    'cc-lexer-number': {
        id: 'cc-lexer-number',
        name: '1.2 Lire un Nombre',
        description: `Implémentez \`parse_number(s, pos)\` qui lit un nombre entier depuis la position \`pos\` et met à jour \`pos\`.

**Algorithme:**
\`\`\`
result = 0
tant que s[pos] est un chiffre:
    result = result * 10 + (s[pos] - '0')
    pos++
retourner result
\`\`\`

**Exemple:** \`parse_number("123+45", &pos)\` avec pos=0 → retourne 123, pos devient 3`,
        template: `int is_digit(char c) { return c >= '0' && c <= '9'; }

int parse_number(char* s, int* pos) {
    int result = 0;
    // TODO: Lire les chiffres et construire le nombre
    // Mettre à jour *pos pour pointer après le nombre
    return result;
}

int main() {
    int score = 0;
    int p;

    p = 0;
    if (parse_number("42", &p) == 42 && p == 2) score = score + 1;

    p = 0;
    if (parse_number("123+45", &p) == 123 && p == 3) score = score + 1;

    p = 4;
    if (parse_number("123+45", &p) == 45 && p == 6) score = score + 1;

    p = 0;
    if (parse_number("7", &p) == 7 && p == 1) score = score + 1;

    return score;  // Doit retourner 4
}`,
        solution: `int is_digit(char c) { return c >= '0' && c <= '9'; }

int parse_number(char* s, int* pos) {
    int result = 0;
    while (is_digit(s[*pos])) {
        result = result * 10 + (s[*pos] - '0');
        *pos = *pos + 1;
    }
    return result;
}

int main() {
    int score = 0;
    int p;

    p = 0;
    if (parse_number("42", &p) == 42 && p == 2) score = score + 1;

    p = 0;
    if (parse_number("123+45", &p) == 123 && p == 3) score = score + 1;

    p = 4;
    if (parse_number("123+45", &p) == 45 && p == 6) score = score + 1;

    p = 0;
    if (parse_number("7", &p) == 7 && p == 1) score = score + 1;

    return score;
}`,
        test: { expectedReturn: 4 }
    },

    'cc-lexer-token': {
        id: 'cc-lexer-token',
        name: '1.3 Identifier les Tokens',
        description: `Implémentez \`next_token(s, pos)\` qui retourne le type du prochain token et avance \`pos\`.

Types de tokens (retournés comme entiers):
- 0 = Fin de chaîne
- 1 = Nombre
- 2 = Opérateur +
- 3 = Opérateur -
- 4 = Opérateur *
- 5 = Opérateur /
- 6 = Parenthèse (
- 7 = Parenthèse )

Le lexer doit sauter les espaces automatiquement.`,
        template: `int is_digit(char c) { return c >= '0' && c <= '9'; }

int next_token(char* s, int* pos) {
    // Sauter les espaces
    while (s[*pos] == ' ') *pos = *pos + 1;

    char c = s[*pos];
    if (c == 0) return 0;  // Fin

    // TODO: Identifier le type de token
    // Si c'est un chiffre, avancer jusqu'à la fin du nombre
    // Sinon, avancer d'un caractère

    return 0;
}

int main() {
    int score = 0;
    int p;

    // Test "42"
    p = 0;
    if (next_token("42", &p) == 1) score = score + 1;  // Nombre

    // Test "+"
    p = 0;
    if (next_token("+", &p) == 2) score = score + 1;   // Plus

    // Test "3 + 5"
    p = 0;
    if (next_token("3 + 5", &p) == 1) score = score + 1;  // 3
    if (next_token("3 + 5", &p) == 2) score = score + 1;  // +
    if (next_token("3 + 5", &p) == 1) score = score + 1;  // 5
    if (next_token("3 + 5", &p) == 0) score = score + 1;  // Fin

    return score;  // Doit retourner 6
}`,
        solution: `int is_digit(char c) { return c >= '0' && c <= '9'; }

int next_token(char* s, int* pos) {
    while (s[*pos] == ' ') *pos = *pos + 1;

    char c = s[*pos];
    if (c == 0) return 0;

    if (is_digit(c)) {
        while (is_digit(s[*pos])) *pos = *pos + 1;
        return 1;
    }

    *pos = *pos + 1;
    if (c == '+') return 2;
    if (c == '-') return 3;
    if (c == '*') return 4;
    if (c == '/') return 5;
    if (c == '(') return 6;
    if (c == ')') return 7;

    return 0;
}

int main() {
    int score = 0;
    int p;

    p = 0;
    if (next_token("42", &p) == 1) score = score + 1;

    p = 0;
    if (next_token("+", &p) == 2) score = score + 1;

    p = 0;
    if (next_token("3 + 5", &p) == 1) score = score + 1;
    if (next_token("3 + 5", &p) == 2) score = score + 1;
    if (next_token("3 + 5", &p) == 1) score = score + 1;
    if (next_token("3 + 5", &p) == 0) score = score + 1;

    return score;
}`,
        test: { expectedReturn: 6 }
    },

    // ========================================================================
    // PHASE 2: PARSER (Analyse Syntaxique)
    // Le parser construit une représentation structurée
    // ========================================================================

    'cc-parser-simple': {
        id: 'cc-parser-simple',
        name: '2.1 Évaluer a + b',
        description: `Implémentez un évaluateur simple qui calcule \`nombre op nombre\`.

Pour l'instant, on ne gère qu'une seule opération (pas de précédence).

**Structure:**
1. Lire le premier nombre
2. Lire l'opérateur
3. Lire le deuxième nombre
4. Calculer et retourner le résultat`,
        template: `int is_digit(char c) { return c >= '0' && c <= '9'; }

int parse_num(char* s, int* p) {
    while (s[*p] == ' ') *p = *p + 1;
    int v = 0;
    while (is_digit(s[*p])) {
        v = v * 10 + (s[*p] - '0');
        *p = *p + 1;
    }
    return v;
}

int eval_simple(char* s) {
    int pos = 0;

    // Lire le premier nombre
    int a = parse_num(s, &pos);

    // Sauter les espaces et lire l'opérateur
    while (s[pos] == ' ') pos = pos + 1;
    char op = s[pos];
    pos = pos + 1;

    // TODO: Lire le deuxième nombre et calculer

    return a;  // À modifier
}

int main() {
    int score = 0;
    if (eval_simple("3 + 5") == 8) score = score + 1;
    if (eval_simple("10 - 4") == 6) score = score + 1;
    if (eval_simple("6 * 7") == 42) score = score + 1;
    if (eval_simple("20 / 4") == 5) score = score + 1;
    return score;  // Doit retourner 4
}`,
        solution: `int is_digit(char c) { return c >= '0' && c <= '9'; }

int parse_num(char* s, int* p) {
    while (s[*p] == ' ') *p = *p + 1;
    int v = 0;
    while (is_digit(s[*p])) {
        v = v * 10 + (s[*p] - '0');
        *p = *p + 1;
    }
    return v;
}

int eval_simple(char* s) {
    int pos = 0;
    int a = parse_num(s, &pos);

    while (s[pos] == ' ') pos = pos + 1;
    char op = s[pos];
    pos = pos + 1;

    int b = parse_num(s, &pos);

    if (op == '+') return a + b;
    if (op == '-') return a - b;
    if (op == '*') return a * b;
    if (op == '/') return a / b;
    return 0;
}

int main() {
    int score = 0;
    if (eval_simple("3 + 5") == 8) score = score + 1;
    if (eval_simple("10 - 4") == 6) score = score + 1;
    if (eval_simple("6 * 7") == 42) score = score + 1;
    if (eval_simple("20 / 4") == 5) score = score + 1;
    return score;
}`,
        test: { expectedReturn: 4 }
    },

    'cc-parser-chain': {
        id: 'cc-parser-chain',
        name: '2.2 Évaluer a + b + c',
        description: `Étendez l'évaluateur pour gérer plusieurs opérations en chaîne.

\`1 + 2 + 3\` se calcule de gauche à droite : \`(1 + 2) + 3 = 6\`

**Algorithme:**
1. Lire le premier nombre → result
2. Tant qu'il y a un opérateur:
   - Lire l'opérateur
   - Lire le nombre suivant
   - Calculer result = result op nombre`,
        template: `int is_digit(char c) { return c >= '0' && c <= '9'; }

int parse_num(char* s, int* p) {
    while (s[*p] == ' ') *p = *p + 1;
    int v = 0;
    while (is_digit(s[*p])) { v = v * 10 + (s[*p] - '0'); *p = *p + 1; }
    return v;
}

int is_op(char c) {
    return c == '+' || c == '-' || c == '*' || c == '/';
}

int eval_chain(char* s) {
    int pos = 0;
    int result = parse_num(s, &pos);

    // TODO: Boucle pour traiter les opérations suivantes
    // Tant qu'il y a un opérateur, continuer

    return result;
}

int main() {
    int score = 0;
    if (eval_chain("5") == 5) score = score + 1;
    if (eval_chain("3 + 5") == 8) score = score + 1;
    if (eval_chain("1 + 2 + 3") == 6) score = score + 1;
    if (eval_chain("10 - 2 - 3") == 5) score = score + 1;
    if (eval_chain("2 * 3 * 4") == 24) score = score + 1;
    return score;  // Doit retourner 5
}`,
        solution: `int is_digit(char c) { return c >= '0' && c <= '9'; }

int parse_num(char* s, int* p) {
    while (s[*p] == ' ') *p = *p + 1;
    int v = 0;
    while (is_digit(s[*p])) { v = v * 10 + (s[*p] - '0'); *p = *p + 1; }
    return v;
}

int is_op(char c) {
    return c == '+' || c == '-' || c == '*' || c == '/';
}

int eval_chain(char* s) {
    int pos = 0;
    int result = parse_num(s, &pos);

    while (1) {
        while (s[pos] == ' ') pos = pos + 1;
        char op = s[pos];
        if (!is_op(op)) break;
        pos = pos + 1;
        int b = parse_num(s, &pos);

        if (op == '+') result = result + b;
        else if (op == '-') result = result - b;
        else if (op == '*') result = result * b;
        else if (op == '/') result = result / b;
    }

    return result;
}

int main() {
    int score = 0;
    if (eval_chain("5") == 5) score = score + 1;
    if (eval_chain("3 + 5") == 8) score = score + 1;
    if (eval_chain("1 + 2 + 3") == 6) score = score + 1;
    if (eval_chain("10 - 2 - 3") == 5) score = score + 1;
    if (eval_chain("2 * 3 * 4") == 24) score = score + 1;
    return score;
}`,
        test: { expectedReturn: 5 }
    },

    'cc-parser-precedence': {
        id: 'cc-parser-precedence',
        name: '2.3 Respecter la Précédence',
        description: `\`2 + 3 * 4\` doit donner 14, pas 20 !

La technique de **descente récursive** utilise plusieurs fonctions:
- \`parse_expr()\` gère \`+\` et \`-\` (priorité basse)
- \`parse_term()\` gère \`*\` et \`/\` (priorité haute)
- \`parse_factor()\` gère les nombres

**Idée clé:** \`parse_expr\` appelle \`parse_term\` qui appelle \`parse_factor\`.
Ainsi \`*\` est évalué avant \`+\`.`,
        template: `int is_digit(char c) { return c >= '0' && c <= '9'; }
char* input;
int pos;

void skip() { while (input[pos] == ' ') pos = pos + 1; }

int parse_num() {
    skip();
    int v = 0;
    while (is_digit(input[pos])) { v = v * 10 + (input[pos] - '0'); pos = pos + 1; }
    return v;
}

int parse_factor() {
    return parse_num();
}

int parse_term() {
    int left = parse_factor();
    // TODO: Gérer * et / en boucle
    return left;
}

int parse_expr() {
    int left = parse_term();
    // TODO: Gérer + et - en boucle
    return left;
}

int eval(char* s) {
    input = s;
    pos = 0;
    return parse_expr();
}

int main() {
    int score = 0;
    if (eval("42") == 42) score = score + 1;
    if (eval("3 + 5") == 8) score = score + 1;
    if (eval("3 * 4") == 12) score = score + 1;
    if (eval("2 + 3 * 4") == 14) score = score + 1;     // Précédence!
    if (eval("2 * 3 + 4") == 10) score = score + 1;     // Précédence!
    if (eval("10 - 2 * 3") == 4) score = score + 1;     // Précédence!
    return score;  // Doit retourner 6
}`,
        solution: `int is_digit(char c) { return c >= '0' && c <= '9'; }
char* input;
int pos;

void skip() { while (input[pos] == ' ') pos = pos + 1; }

int parse_num() {
    skip();
    int v = 0;
    while (is_digit(input[pos])) { v = v * 10 + (input[pos] - '0'); pos = pos + 1; }
    return v;
}

int parse_factor() {
    return parse_num();
}

int parse_term() {
    int left = parse_factor();
    while (1) {
        skip();
        char op = input[pos];
        if (op != '*' && op != '/') break;
        pos = pos + 1;
        int right = parse_factor();
        if (op == '*') left = left * right;
        else left = left / right;
    }
    return left;
}

int parse_expr() {
    int left = parse_term();
    while (1) {
        skip();
        char op = input[pos];
        if (op != '+' && op != '-') break;
        pos = pos + 1;
        int right = parse_term();
        if (op == '+') left = left + right;
        else left = left - right;
    }
    return left;
}

int eval(char* s) {
    input = s;
    pos = 0;
    return parse_expr();
}

int main() {
    int score = 0;
    if (eval("42") == 42) score = score + 1;
    if (eval("3 + 5") == 8) score = score + 1;
    if (eval("3 * 4") == 12) score = score + 1;
    if (eval("2 + 3 * 4") == 14) score = score + 1;
    if (eval("2 * 3 + 4") == 10) score = score + 1;
    if (eval("10 - 2 * 3") == 4) score = score + 1;
    return score;
}`,
        test: { expectedReturn: 6 }
    },

    'cc-parser-parens': {
        id: 'cc-parser-parens',
        name: '2.4 Gérer les Parenthèses',
        description: `Les parenthèses changent l'ordre d'évaluation:
- \`(2 + 3) * 4\` = 20

**Modification de parse_factor:**
\`\`\`
si caractère == '(':
    consommer '('
    result = parse_expr()  // Récursion!
    consommer ')'
    retourner result
sinon:
    retourner parse_num()
\`\`\``,
        template: `int is_digit(char c) { return c >= '0' && c <= '9'; }
char* input;
int pos;

void skip() { while (input[pos] == ' ') pos = pos + 1; }

int parse_expr();  // Déclaration anticipée

int parse_num() {
    skip();
    int v = 0;
    while (is_digit(input[pos])) { v = v * 10 + (input[pos] - '0'); pos = pos + 1; }
    return v;
}

int parse_factor() {
    skip();
    // TODO: Si '(', lire sous-expression et ')'
    // Sinon, lire nombre
    return parse_num();
}

int parse_term() {
    int left = parse_factor();
    while (1) {
        skip();
        char op = input[pos];
        if (op != '*' && op != '/') break;
        pos = pos + 1;
        int right = parse_factor();
        if (op == '*') left = left * right;
        else left = left / right;
    }
    return left;
}

int parse_expr() {
    int left = parse_term();
    while (1) {
        skip();
        char op = input[pos];
        if (op != '+' && op != '-') break;
        pos = pos + 1;
        int right = parse_term();
        if (op == '+') left = left + right;
        else left = left - right;
    }
    return left;
}

int eval(char* s) { input = s; pos = 0; return parse_expr(); }

int main() {
    int score = 0;
    if (eval("(5)") == 5) score = score + 1;
    if (eval("(2 + 3)") == 5) score = score + 1;
    if (eval("(2 + 3) * 4") == 20) score = score + 1;
    if (eval("2 * (3 + 4)") == 14) score = score + 1;
    if (eval("(1 + 2) * (3 + 4)") == 21) score = score + 1;
    if (eval("((2))") == 2) score = score + 1;
    return score;  // Doit retourner 6
}`,
        solution: `int is_digit(char c) { return c >= '0' && c <= '9'; }
char* input;
int pos;

void skip() { while (input[pos] == ' ') pos = pos + 1; }

int parse_expr();

int parse_num() {
    skip();
    int v = 0;
    while (is_digit(input[pos])) { v = v * 10 + (input[pos] - '0'); pos = pos + 1; }
    return v;
}

int parse_factor() {
    skip();
    if (input[pos] == '(') {
        pos = pos + 1;
        int v = parse_expr();
        skip();
        pos = pos + 1;  // ')'
        return v;
    }
    return parse_num();
}

int parse_term() {
    int left = parse_factor();
    while (1) {
        skip();
        char op = input[pos];
        if (op != '*' && op != '/') break;
        pos = pos + 1;
        int right = parse_factor();
        if (op == '*') left = left * right;
        else left = left / right;
    }
    return left;
}

int parse_expr() {
    int left = parse_term();
    while (1) {
        skip();
        char op = input[pos];
        if (op != '+' && op != '-') break;
        pos = pos + 1;
        int right = parse_term();
        if (op == '+') left = left + right;
        else left = left - right;
    }
    return left;
}

int eval(char* s) { input = s; pos = 0; return parse_expr(); }

int main() {
    int score = 0;
    if (eval("(5)") == 5) score = score + 1;
    if (eval("(2 + 3)") == 5) score = score + 1;
    if (eval("(2 + 3) * 4") == 20) score = score + 1;
    if (eval("2 * (3 + 4)") == 14) score = score + 1;
    if (eval("(1 + 2) * (3 + 4)") == 21) score = score + 1;
    if (eval("((2))") == 2) score = score + 1;
    return score;
}`,
        test: { expectedReturn: 6 }
    },

    // ========================================================================
    // PHASE 3: GÉNÉRATION DE CODE - Bases
    // Émettre des instructions A32 Assembly
    // ========================================================================

    'cc-emit-mov': {
        id: 'cc-emit-mov',
        name: '3.1 Émettre MOV',
        description: `Maintenant, au lieu d'évaluer, nous allons **générer du code assembleur**.

Implémentez \`emit_mov(buf, reg, val)\` qui écrit l'instruction \`MOV Rn, #val\` dans le buffer.

**Exemple:** \`emit_mov(buf, 0, 42)\` écrit \`"MOV R0, #42\\n"\`

Le buffer est une chaîne où on accumule le code généré.`,
        template: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }

void append(char* buf, char* s) {
    int i = strlen(buf);
    int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; }
    buf[i] = 0;
}

void append_num(char* buf, int n) {
    char tmp[12];
    int i = 0;
    if (n == 0) { tmp[i] = '0'; i = i + 1; }
    else {
        int rev[12]; int r = 0;
        while (n > 0) { rev[r] = n % 10; r = r + 1; n = n / 10; }
        while (r > 0) { r = r - 1; tmp[i] = '0' + rev[r]; i = i + 1; }
    }
    tmp[i] = 0;
    append(buf, tmp);
}

void emit_mov(char* buf, int reg, int val) {
    // TODO: Écrire "MOV R{reg}, #{val}\\n" dans buf
    // Utiliser append() et append_num()
}

int check(char* a, char* b) {
    int i = 0;
    while (a[i] && b[i]) { if (a[i] != b[i]) return 0; i = i + 1; }
    return a[i] == b[i];
}

int main() {
    char buf[100];
    int score = 0;

    buf[0] = 0;
    emit_mov(buf, 0, 42);
    if (check(buf, "MOV R0, #42\\n")) score = score + 1;

    buf[0] = 0;
    emit_mov(buf, 1, 5);
    if (check(buf, "MOV R1, #5\\n")) score = score + 1;

    buf[0] = 0;
    emit_mov(buf, 0, 0);
    if (check(buf, "MOV R0, #0\\n")) score = score + 1;

    return score;  // Doit retourner 3
}`,
        solution: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }

void append(char* buf, char* s) {
    int i = strlen(buf);
    int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; }
    buf[i] = 0;
}

void append_num(char* buf, int n) {
    char tmp[12];
    int i = 0;
    if (n == 0) { tmp[i] = '0'; i = i + 1; }
    else {
        int rev[12]; int r = 0;
        while (n > 0) { rev[r] = n % 10; r = r + 1; n = n / 10; }
        while (r > 0) { r = r - 1; tmp[i] = '0' + rev[r]; i = i + 1; }
    }
    tmp[i] = 0;
    append(buf, tmp);
}

void emit_mov(char* buf, int reg, int val) {
    append(buf, "MOV R");
    append_num(buf, reg);
    append(buf, ", #");
    append_num(buf, val);
    append(buf, "\\n");
}

int check(char* a, char* b) {
    int i = 0;
    while (a[i] && b[i]) { if (a[i] != b[i]) return 0; i = i + 1; }
    return a[i] == b[i];
}

int main() {
    char buf[100];
    int score = 0;

    buf[0] = 0;
    emit_mov(buf, 0, 42);
    if (check(buf, "MOV R0, #42\\n")) score = score + 1;

    buf[0] = 0;
    emit_mov(buf, 1, 5);
    if (check(buf, "MOV R1, #5\\n")) score = score + 1;

    buf[0] = 0;
    emit_mov(buf, 0, 0);
    if (check(buf, "MOV R0, #0\\n")) score = score + 1;

    return score;
}`,
        test: { expectedReturn: 3 }
    },

    'cc-emit-binop': {
        id: 'cc-emit-binop',
        name: '3.2 Émettre ADD/SUB/MUL',
        description: `Implémentez \`emit_op(buf, op, rd, rn, rm)\` qui génère une instruction arithmétique.

**Format:** \`{OP} R{rd}, R{rn}, R{rm}\`

| Caractère | Instruction |
|-----------|-------------|
| '+' | ADD |
| '-' | SUB |
| '*' | MUL |`,
        template: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; }
    buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}

void emit_op(char* buf, char op, int rd, int rn, int rm) {
    // TODO: Écrire "{OP} R{rd}, R{rn}, R{rm}\\n"
    // op '+' -> "ADD", '-' -> "SUB", '*' -> "MUL"
}

int check(char* a, char* b) {
    int i = 0;
    while (a[i] && b[i]) { if (a[i] != b[i]) return 0; i = i + 1; }
    return a[i] == b[i];
}

int main() {
    char buf[100];
    int score = 0;

    buf[0] = 0;
    emit_op(buf, '+', 0, 1, 2);
    if (check(buf, "ADD R0, R1, R2\\n")) score = score + 1;

    buf[0] = 0;
    emit_op(buf, '-', 0, 0, 1);
    if (check(buf, "SUB R0, R0, R1\\n")) score = score + 1;

    buf[0] = 0;
    emit_op(buf, '*', 2, 3, 4);
    if (check(buf, "MUL R2, R3, R4\\n")) score = score + 1;

    return score;  // Doit retourner 3
}`,
        solution: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; }
    buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}

void emit_op(char* buf, char op, int rd, int rn, int rm) {
    if (op == '+') append(buf, "ADD R");
    else if (op == '-') append(buf, "SUB R");
    else if (op == '*') append(buf, "MUL R");
    append_num(buf, rd);
    append(buf, ", R");
    append_num(buf, rn);
    append(buf, ", R");
    append_num(buf, rm);
    append(buf, "\\n");
}

int check(char* a, char* b) {
    int i = 0;
    while (a[i] && b[i]) { if (a[i] != b[i]) return 0; i = i + 1; }
    return a[i] == b[i];
}

int main() {
    char buf[100];
    int score = 0;

    buf[0] = 0;
    emit_op(buf, '+', 0, 1, 2);
    if (check(buf, "ADD R0, R1, R2\\n")) score = score + 1;

    buf[0] = 0;
    emit_op(buf, '-', 0, 0, 1);
    if (check(buf, "SUB R0, R0, R1\\n")) score = score + 1;

    buf[0] = 0;
    emit_op(buf, '*', 2, 3, 4);
    if (check(buf, "MUL R2, R3, R4\\n")) score = score + 1;

    return score;
}`,
        test: { expectedReturn: 3 }
    },

    'cc-emit-stack': {
        id: 'cc-emit-stack',
        name: '3.3 Émettre PUSH/POP',
        description: `Pour évaluer \`a + b\`, on a besoin de sauvegarder temporairement des valeurs.

Implémentez:
- \`emit_push(buf, reg)\` → \`STR R{reg}, [SP, #-4]!\`
- \`emit_pop(buf, reg)\` → \`LDR R{reg}, [SP], #4\`

Ces instructions utilisent la pile (SP = Stack Pointer).`,
        template: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; }
    buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}

void emit_push(char* buf, int reg) {
    // TODO: "STR R{reg}, [SP, #-4]!\\n"
}

void emit_pop(char* buf, int reg) {
    // TODO: "LDR R{reg}, [SP], #4\\n"
}

int check(char* a, char* b) {
    int i = 0;
    while (a[i] && b[i]) { if (a[i] != b[i]) return 0; i = i + 1; }
    return a[i] == b[i];
}

int main() {
    char buf[100];
    int score = 0;

    buf[0] = 0;
    emit_push(buf, 0);
    if (check(buf, "STR R0, [SP, #-4]!\\n")) score = score + 1;

    buf[0] = 0;
    emit_pop(buf, 1);
    if (check(buf, "LDR R1, [SP], #4\\n")) score = score + 1;

    buf[0] = 0;
    emit_push(buf, 0);
    emit_pop(buf, 1);
    if (check(buf, "STR R0, [SP, #-4]!\\nLDR R1, [SP], #4\\n")) score = score + 1;

    return score;  // Doit retourner 3
}`,
        solution: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; }
    buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}

void emit_push(char* buf, int reg) {
    append(buf, "STR R");
    append_num(buf, reg);
    append(buf, ", [SP, #-4]!\\n");
}

void emit_pop(char* buf, int reg) {
    append(buf, "LDR R");
    append_num(buf, reg);
    append(buf, ", [SP], #4\\n");
}

int check(char* a, char* b) {
    int i = 0;
    while (a[i] && b[i]) { if (a[i] != b[i]) return 0; i = i + 1; }
    return a[i] == b[i];
}

int main() {
    char buf[100];
    int score = 0;

    buf[0] = 0;
    emit_push(buf, 0);
    if (check(buf, "STR R0, [SP, #-4]!\\n")) score = score + 1;

    buf[0] = 0;
    emit_pop(buf, 1);
    if (check(buf, "LDR R1, [SP], #4\\n")) score = score + 1;

    buf[0] = 0;
    emit_push(buf, 0);
    emit_pop(buf, 1);
    if (check(buf, "STR R0, [SP, #-4]!\\nLDR R1, [SP], #4\\n")) score = score + 1;

    return score;
}`,
        test: { expectedReturn: 3 }
    },

    // ========================================================================
    // PHASE 4: GÉNÉRATION DE CODE - Expressions
    // Générer le code pour des expressions complètes
    // ========================================================================

    'cc-codegen-const': {
        id: 'cc-codegen-const',
        name: '4.1 Compiler une Constante',
        description: `Premier pas de la compilation: générer le code pour une constante.

\`42\` compile en \`MOV R0, #42\`

Le résultat est toujours dans R0 (convention).`,
        template: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; }
    buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}
void emit_mov(char* buf, int reg, int val) {
    append(buf, "MOV R"); append_num(buf, reg);
    append(buf, ", #"); append_num(buf, val); append(buf, "\\n");
}

int is_digit(char c) { return c >= '0' && c <= '9'; }
char* input;
int pos;

int parse_num() {
    int v = 0;
    while (is_digit(input[pos])) { v = v * 10 + (input[pos] - '0'); pos = pos + 1; }
    return v;
}

void codegen_const(char* buf) {
    // TODO: Lire le nombre et émettre MOV R0, #nombre
}

int check(char* a, char* b) {
    int i = 0;
    while (a[i] && b[i]) { if (a[i] != b[i]) return 0; i = i + 1; }
    return a[i] == b[i];
}

int main() {
    char buf[100];
    int score = 0;

    buf[0] = 0; input = "42"; pos = 0;
    codegen_const(buf);
    if (check(buf, "MOV R0, #42\\n")) score = score + 1;

    buf[0] = 0; input = "5"; pos = 0;
    codegen_const(buf);
    if (check(buf, "MOV R0, #5\\n")) score = score + 1;

    buf[0] = 0; input = "123"; pos = 0;
    codegen_const(buf);
    if (check(buf, "MOV R0, #123\\n")) score = score + 1;

    return score;  // Doit retourner 3
}`,
        solution: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; }
    buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}
void emit_mov(char* buf, int reg, int val) {
    append(buf, "MOV R"); append_num(buf, reg);
    append(buf, ", #"); append_num(buf, val); append(buf, "\\n");
}

int is_digit(char c) { return c >= '0' && c <= '9'; }
char* input;
int pos;

int parse_num() {
    int v = 0;
    while (is_digit(input[pos])) { v = v * 10 + (input[pos] - '0'); pos = pos + 1; }
    return v;
}

void codegen_const(char* buf) {
    int n = parse_num();
    emit_mov(buf, 0, n);
}

int check(char* a, char* b) {
    int i = 0;
    while (a[i] && b[i]) { if (a[i] != b[i]) return 0; i = i + 1; }
    return a[i] == b[i];
}

int main() {
    char buf[100];
    int score = 0;

    buf[0] = 0; input = "42"; pos = 0;
    codegen_const(buf);
    if (check(buf, "MOV R0, #42\\n")) score = score + 1;

    buf[0] = 0; input = "5"; pos = 0;
    codegen_const(buf);
    if (check(buf, "MOV R0, #5\\n")) score = score + 1;

    buf[0] = 0; input = "123"; pos = 0;
    codegen_const(buf);
    if (check(buf, "MOV R0, #123\\n")) score = score + 1;

    return score;
}`,
        test: { expectedReturn: 3 }
    },

    'cc-codegen-binop': {
        id: 'cc-codegen-binop',
        name: '4.2 Compiler a + b',
        description: `Pour compiler \`3 + 5\`:

\`\`\`asm
MOV R0, #3      ; Charger 3
STR R0, [SP, #-4]!  ; Sauver sur pile
MOV R0, #5      ; Charger 5
LDR R1, [SP], #4    ; Récupérer 3 dans R1
ADD R0, R1, R0  ; R0 = R1 + R0 = 3 + 5
\`\`\`

**Pattern:**
1. Compiler l'opérande gauche → R0
2. Push R0
3. Compiler l'opérande droit → R0
4. Pop → R1
5. Op R0, R1, R0`,
        template: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; } buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}
void emit_mov(char* buf, int reg, int val) {
    append(buf, "MOV R"); append_num(buf, reg);
    append(buf, ", #"); append_num(buf, val); append(buf, "\\n");
}
void emit_push(char* buf, int reg) {
    append(buf, "STR R"); append_num(buf, reg); append(buf, ", [SP, #-4]!\\n");
}
void emit_pop(char* buf, int reg) {
    append(buf, "LDR R"); append_num(buf, reg); append(buf, ", [SP], #4\\n");
}
void emit_op(char* buf, char op, int rd, int rn, int rm) {
    if (op == '+') append(buf, "ADD R");
    else if (op == '-') append(buf, "SUB R");
    else if (op == '*') append(buf, "MUL R");
    append_num(buf, rd); append(buf, ", R"); append_num(buf, rn);
    append(buf, ", R"); append_num(buf, rm); append(buf, "\\n");
}

int is_digit(char c) { return c >= '0' && c <= '9'; }
char* input;
int pos;
void skip() { while (input[pos] == ' ') pos = pos + 1; }
int parse_num() {
    skip();
    int v = 0;
    while (is_digit(input[pos])) { v = v * 10 + (input[pos] - '0'); pos = pos + 1; }
    return v;
}

void codegen_binop(char* buf) {
    // TODO: Générer le code pour "a op b"
    // 1. Lire a, emit_mov
    // 2. emit_push(R0)
    // 3. Lire op
    // 4. Lire b, emit_mov
    // 5. emit_pop(R1)
    // 6. emit_op
}

int contains(char* buf, char* sub) {
    int i = 0;
    while (buf[i]) {
        int j = 0;
        while (sub[j] && buf[i+j] == sub[j]) j = j + 1;
        if (sub[j] == 0) return 1;
        i = i + 1;
    }
    return 0;
}

int main() {
    char buf[200];
    int score = 0;

    buf[0] = 0; input = "3 + 5"; pos = 0;
    codegen_binop(buf);
    if (contains(buf, "MOV R0, #3") && contains(buf, "MOV R0, #5") &&
        contains(buf, "ADD R0")) score = score + 1;

    buf[0] = 0; input = "10 - 4"; pos = 0;
    codegen_binop(buf);
    if (contains(buf, "MOV R0, #10") && contains(buf, "SUB R0")) score = score + 1;

    buf[0] = 0; input = "6 * 7"; pos = 0;
    codegen_binop(buf);
    if (contains(buf, "MUL R0")) score = score + 1;

    return score;  // Doit retourner 3
}`,
        solution: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; } buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}
void emit_mov(char* buf, int reg, int val) {
    append(buf, "MOV R"); append_num(buf, reg);
    append(buf, ", #"); append_num(buf, val); append(buf, "\\n");
}
void emit_push(char* buf, int reg) {
    append(buf, "STR R"); append_num(buf, reg); append(buf, ", [SP, #-4]!\\n");
}
void emit_pop(char* buf, int reg) {
    append(buf, "LDR R"); append_num(buf, reg); append(buf, ", [SP], #4\\n");
}
void emit_op(char* buf, char op, int rd, int rn, int rm) {
    if (op == '+') append(buf, "ADD R");
    else if (op == '-') append(buf, "SUB R");
    else if (op == '*') append(buf, "MUL R");
    append_num(buf, rd); append(buf, ", R"); append_num(buf, rn);
    append(buf, ", R"); append_num(buf, rm); append(buf, "\\n");
}

int is_digit(char c) { return c >= '0' && c <= '9'; }
char* input;
int pos;
void skip() { while (input[pos] == ' ') pos = pos + 1; }
int parse_num() {
    skip();
    int v = 0;
    while (is_digit(input[pos])) { v = v * 10 + (input[pos] - '0'); pos = pos + 1; }
    return v;
}

void codegen_binop(char* buf) {
    int a = parse_num();
    emit_mov(buf, 0, a);
    emit_push(buf, 0);

    skip();
    char op = input[pos];
    pos = pos + 1;

    int b = parse_num();
    emit_mov(buf, 0, b);
    emit_pop(buf, 1);
    emit_op(buf, op, 0, 1, 0);
}

int contains(char* buf, char* sub) {
    int i = 0;
    while (buf[i]) {
        int j = 0;
        while (sub[j] && buf[i+j] == sub[j]) j = j + 1;
        if (sub[j] == 0) return 1;
        i = i + 1;
    }
    return 0;
}

int main() {
    char buf[200];
    int score = 0;

    buf[0] = 0; input = "3 + 5"; pos = 0;
    codegen_binop(buf);
    if (contains(buf, "MOV R0, #3") && contains(buf, "MOV R0, #5") &&
        contains(buf, "ADD R0")) score = score + 1;

    buf[0] = 0; input = "10 - 4"; pos = 0;
    codegen_binop(buf);
    if (contains(buf, "MOV R0, #10") && contains(buf, "SUB R0")) score = score + 1;

    buf[0] = 0; input = "6 * 7"; pos = 0;
    codegen_binop(buf);
    if (contains(buf, "MUL R0")) score = score + 1;

    return score;
}`,
        test: { expectedReturn: 3 }
    },

    'cc-codegen-expr': {
        id: 'cc-codegen-expr',
        name: '4.3 Compiler Expressions Complètes',
        description: `Combinez le parser avec précédence et la génération de code pour compiler des expressions complètes.

\`2 + 3 * 4\` doit générer du code qui calcule 14, pas 20!

**Stratégie:** Modifiez le parser récursif pour appeler des fonctions \`emit_*\` au lieu d'évaluer.`,
        template: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; } buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}
void emit_mov(char* buf, int reg, int val) {
    append(buf, "MOV R"); append_num(buf, reg);
    append(buf, ", #"); append_num(buf, val); append(buf, "\\n");
}
void emit_push(char* buf, int reg) {
    append(buf, "STR R"); append_num(buf, reg); append(buf, ", [SP, #-4]!\\n");
}
void emit_pop(char* buf, int reg) {
    append(buf, "LDR R"); append_num(buf, reg); append(buf, ", [SP], #4\\n");
}
void emit_op(char* buf, char op, int rd, int rn, int rm) {
    if (op == '+') append(buf, "ADD R");
    else if (op == '-') append(buf, "SUB R");
    else if (op == '*') append(buf, "MUL R");
    else if (op == '/') append(buf, "SDIV R");
    append_num(buf, rd); append(buf, ", R"); append_num(buf, rn);
    append(buf, ", R"); append_num(buf, rm); append(buf, "\\n");
}

int is_digit(char c) { return c >= '0' && c <= '9'; }
char* input;
int pos;
char* out;

void skip() { while (input[pos] == ' ') pos = pos + 1; }

void codegen_expr();

void codegen_factor() {
    skip();
    int v = 0;
    while (is_digit(input[pos])) { v = v * 10 + (input[pos] - '0'); pos = pos + 1; }
    emit_mov(out, 0, v);
}

void codegen_term() {
    codegen_factor();
    // TODO: Gérer * et / en boucle
    // Pour chaque opérateur: push, codegen_factor, pop, emit_op
}

void codegen_expr() {
    codegen_term();
    // TODO: Gérer + et - en boucle
}

void compile(char* buf, char* src) {
    out = buf;
    input = src;
    pos = 0;
    buf[0] = 0;
    codegen_expr();
}

int contains(char* buf, char* sub) {
    int i = 0;
    while (buf[i]) {
        int j = 0; while (sub[j] && buf[i+j] == sub[j]) j = j + 1;
        if (sub[j] == 0) return 1;
        i = i + 1;
    }
    return 0;
}

int count(char* buf, char* sub) {
    int c = 0, i = 0;
    while (buf[i]) {
        int j = 0; while (sub[j] && buf[i+j] == sub[j]) j = j + 1;
        if (sub[j] == 0) c = c + 1;
        i = i + 1;
    }
    return c;
}

int main() {
    char buf[500];
    int score = 0;

    // Test simple
    compile(buf, "42");
    if (contains(buf, "MOV R0, #42")) score = score + 1;

    // Test addition
    compile(buf, "3 + 5");
    if (contains(buf, "ADD R0")) score = score + 1;

    // Test précédence: 2 + 3 * 4
    // Doit faire MUL avant ADD
    compile(buf, "2 + 3 * 4");
    if (contains(buf, "MUL R0") && contains(buf, "ADD R0")) score = score + 1;

    // Test chaîne: 1 + 2 + 3
    compile(buf, "1 + 2 + 3");
    if (count(buf, "ADD R0") == 2) score = score + 1;

    return score;  // Doit retourner 4
}`,
        solution: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; } buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}
void emit_mov(char* buf, int reg, int val) {
    append(buf, "MOV R"); append_num(buf, reg);
    append(buf, ", #"); append_num(buf, val); append(buf, "\\n");
}
void emit_push(char* buf, int reg) {
    append(buf, "STR R"); append_num(buf, reg); append(buf, ", [SP, #-4]!\\n");
}
void emit_pop(char* buf, int reg) {
    append(buf, "LDR R"); append_num(buf, reg); append(buf, ", [SP], #4\\n");
}
void emit_op(char* buf, char op, int rd, int rn, int rm) {
    if (op == '+') append(buf, "ADD R");
    else if (op == '-') append(buf, "SUB R");
    else if (op == '*') append(buf, "MUL R");
    else if (op == '/') append(buf, "SDIV R");
    append_num(buf, rd); append(buf, ", R"); append_num(buf, rn);
    append(buf, ", R"); append_num(buf, rm); append(buf, "\\n");
}

int is_digit(char c) { return c >= '0' && c <= '9'; }
char* input;
int pos;
char* out;

void skip() { while (input[pos] == ' ') pos = pos + 1; }

void codegen_expr();

void codegen_factor() {
    skip();
    int v = 0;
    while (is_digit(input[pos])) { v = v * 10 + (input[pos] - '0'); pos = pos + 1; }
    emit_mov(out, 0, v);
}

void codegen_term() {
    codegen_factor();
    while (1) {
        skip();
        char op = input[pos];
        if (op != '*' && op != '/') break;
        pos = pos + 1;
        emit_push(out, 0);
        codegen_factor();
        emit_pop(out, 1);
        emit_op(out, op, 0, 1, 0);
    }
}

void codegen_expr() {
    codegen_term();
    while (1) {
        skip();
        char op = input[pos];
        if (op != '+' && op != '-') break;
        pos = pos + 1;
        emit_push(out, 0);
        codegen_term();
        emit_pop(out, 1);
        emit_op(out, op, 0, 1, 0);
    }
}

void compile(char* buf, char* src) {
    out = buf;
    input = src;
    pos = 0;
    buf[0] = 0;
    codegen_expr();
}

int contains(char* buf, char* sub) {
    int i = 0;
    while (buf[i]) {
        int j = 0; while (sub[j] && buf[i+j] == sub[j]) j = j + 1;
        if (sub[j] == 0) return 1;
        i = i + 1;
    }
    return 0;
}

int count(char* buf, char* sub) {
    int c = 0, i = 0;
    while (buf[i]) {
        int j = 0; while (sub[j] && buf[i+j] == sub[j]) j = j + 1;
        if (sub[j] == 0) c = c + 1;
        i = i + 1;
    }
    return c;
}

int main() {
    char buf[500];
    int score = 0;

    compile(buf, "42");
    if (contains(buf, "MOV R0, #42")) score = score + 1;

    compile(buf, "3 + 5");
    if (contains(buf, "ADD R0")) score = score + 1;

    compile(buf, "2 + 3 * 4");
    if (contains(buf, "MUL R0") && contains(buf, "ADD R0")) score = score + 1;

    compile(buf, "1 + 2 + 3");
    if (count(buf, "ADD R0") == 2) score = score + 1;

    return score;
}`,
        test: { expectedReturn: 4 }
    },

    // ========================================================================
    // PHASE 5: LABELS ET CONTRÔLE
    // Générer des labels et des branchements
    // ========================================================================

    'cc-codegen-labels': {
        id: 'cc-codegen-labels',
        name: '5.1 Générer des Labels',
        description: `Pour les structures de contrôle (if, while), on a besoin de **labels** uniques.

Implémentez \`emit_label(buf, prefix, num)\` qui génère un label comme \`.Lif_3:\`

Et \`emit_branch(buf, cond, prefix, num)\` pour les branchements:
- cond = 0 → \`B\` (inconditionnel)
- cond = 1 → \`BEQ\`
- cond = 2 → \`BNE\`
- cond = 3 → \`BLT\`
- cond = 4 → \`BGE\``,
        template: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; } buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}

void emit_label(char* buf, char* prefix, int num) {
    // TODO: ".L{prefix}_{num}:\\n"
}

void emit_branch(char* buf, int cond, char* prefix, int num) {
    // TODO: "{Bcond} .L{prefix}_{num}\\n"
    // cond: 0=B, 1=BEQ, 2=BNE, 3=BLT, 4=BGE
}

int check(char* a, char* b) {
    int i = 0;
    while (a[i] && b[i]) { if (a[i] != b[i]) return 0; i = i + 1; }
    return a[i] == b[i];
}

int main() {
    char buf[100];
    int score = 0;

    buf[0] = 0;
    emit_label(buf, "if", 1);
    if (check(buf, ".Lif_1:\\n")) score = score + 1;

    buf[0] = 0;
    emit_branch(buf, 0, "end", 2);
    if (check(buf, "B .Lend_2\\n")) score = score + 1;

    buf[0] = 0;
    emit_branch(buf, 1, "else", 3);
    if (check(buf, "BEQ .Lelse_3\\n")) score = score + 1;

    buf[0] = 0;
    emit_branch(buf, 3, "loop", 0);
    if (check(buf, "BLT .Lloop_0\\n")) score = score + 1;

    return score;  // Doit retourner 4
}`,
        solution: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; } buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}

void emit_label(char* buf, char* prefix, int num) {
    append(buf, ".L");
    append(buf, prefix);
    append(buf, "_");
    append_num(buf, num);
    append(buf, ":\\n");
}

void emit_branch(char* buf, int cond, char* prefix, int num) {
    if (cond == 0) append(buf, "B .L");
    else if (cond == 1) append(buf, "BEQ .L");
    else if (cond == 2) append(buf, "BNE .L");
    else if (cond == 3) append(buf, "BLT .L");
    else if (cond == 4) append(buf, "BGE .L");
    append(buf, prefix);
    append(buf, "_");
    append_num(buf, num);
    append(buf, "\\n");
}

int check(char* a, char* b) {
    int i = 0;
    while (a[i] && b[i]) { if (a[i] != b[i]) return 0; i = i + 1; }
    return a[i] == b[i];
}

int main() {
    char buf[100];
    int score = 0;

    buf[0] = 0;
    emit_label(buf, "if", 1);
    if (check(buf, ".Lif_1:\\n")) score = score + 1;

    buf[0] = 0;
    emit_branch(buf, 0, "end", 2);
    if (check(buf, "B .Lend_2\\n")) score = score + 1;

    buf[0] = 0;
    emit_branch(buf, 1, "else", 3);
    if (check(buf, "BEQ .Lelse_3\\n")) score = score + 1;

    buf[0] = 0;
    emit_branch(buf, 3, "loop", 0);
    if (check(buf, "BLT .Lloop_0\\n")) score = score + 1;

    return score;
}`,
        test: { expectedReturn: 4 }
    },

    'cc-codegen-cmp': {
        id: 'cc-codegen-cmp',
        name: '5.2 Générer Comparaisons',
        description: `Implémentez \`emit_cmp(buf, rn, rm)\` qui génère \`CMP R{rn}, R{rm}\`

Et \`get_branch_cond(op)\` qui retourne le code de branchement inverse:
- \`<\` → 4 (BGE pour sauter si faux)
- \`>=\` → 3 (BLT)
- \`==\` → 2 (BNE)
- \`!=\` → 1 (BEQ)`,
        template: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; } buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}

void emit_cmp(char* buf, int rn, int rm) {
    // TODO: "CMP R{rn}, R{rm}\\n"
}

// Retourne la condition de branchement INVERSE
// Pour "if (x < y)" on veut sauter si x >= y
int get_branch_cond(char op) {
    // < -> 4 (BGE), >= -> 3 (BLT), == -> 2 (BNE), != -> 1 (BEQ)
    // TODO
    return 0;
}

int check(char* a, char* b) {
    int i = 0;
    while (a[i] && b[i]) { if (a[i] != b[i]) return 0; i = i + 1; }
    return a[i] == b[i];
}

int main() {
    char buf[100];
    int score = 0;

    buf[0] = 0;
    emit_cmp(buf, 0, 1);
    if (check(buf, "CMP R0, R1\\n")) score = score + 1;

    if (get_branch_cond('<') == 4) score = score + 1;  // BGE
    if (get_branch_cond('=') == 2) score = score + 1;  // BNE (pour ==)
    if (get_branch_cond('!') == 1) score = score + 1;  // BEQ (pour !=)
    if (get_branch_cond('>') == 3) score = score + 1;  // BLT (simplifié)

    return score;  // Doit retourner 5
}`,
        solution: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; } buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}

void emit_cmp(char* buf, int rn, int rm) {
    append(buf, "CMP R");
    append_num(buf, rn);
    append(buf, ", R");
    append_num(buf, rm);
    append(buf, "\\n");
}

int get_branch_cond(char op) {
    if (op == '<') return 4;  // BGE
    if (op == '>') return 3;  // BLT (simplifié, >= aussi)
    if (op == '=') return 2;  // BNE
    if (op == '!') return 1;  // BEQ
    return 0;
}

int check(char* a, char* b) {
    int i = 0;
    while (a[i] && b[i]) { if (a[i] != b[i]) return 0; i = i + 1; }
    return a[i] == b[i];
}

int main() {
    char buf[100];
    int score = 0;

    buf[0] = 0;
    emit_cmp(buf, 0, 1);
    if (check(buf, "CMP R0, R1\\n")) score = score + 1;

    if (get_branch_cond('<') == 4) score = score + 1;
    if (get_branch_cond('=') == 2) score = score + 1;
    if (get_branch_cond('!') == 1) score = score + 1;
    if (get_branch_cond('>') == 3) score = score + 1;

    return score;
}`,
        test: { expectedReturn: 5 }
    },

    'cc-codegen-if': {
        id: 'cc-codegen-if',
        name: '5.3 Compiler if/else',
        description: `Générez le code pour \`if (R0 < R1) { ... } else { ... }\`

**Pattern:**
\`\`\`asm
    CMP R0, R1
    BGE .Lelse_N     ; Saut si condition fausse
    ; code then
    B .Lend_N
.Lelse_N:
    ; code else
.Lend_N:
\`\`\`

Implémentez \`codegen_if(buf, label_num)\` qui génère cette structure.`,
        template: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; } buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}
void emit_cmp(char* buf, int rn, int rm) {
    append(buf, "CMP R"); append_num(buf, rn);
    append(buf, ", R"); append_num(buf, rm); append(buf, "\\n");
}
void emit_label(char* buf, char* prefix, int num) {
    append(buf, ".L"); append(buf, prefix); append(buf, "_");
    append_num(buf, num); append(buf, ":\\n");
}
void emit_branch(char* buf, int cond, char* prefix, int num) {
    if (cond == 0) append(buf, "B .L");
    else if (cond == 4) append(buf, "BGE .L");
    append(buf, prefix); append(buf, "_");
    append_num(buf, num); append(buf, "\\n");
}
void emit_mov(char* buf, int reg, int val) {
    append(buf, "MOV R"); append_num(buf, reg);
    append(buf, ", #"); append_num(buf, val); append(buf, "\\n");
}

void codegen_if(char* buf, int n) {
    // TODO: Générer if (R0 < R1) { R2 = 1 } else { R2 = 0 }
    // 1. CMP R0, R1
    // 2. BGE .Lelse_n
    // 3. MOV R2, #1 (then)
    // 4. B .Lend_n
    // 5. .Lelse_n:
    // 6. MOV R2, #0 (else)
    // 7. .Lend_n:
}

int contains(char* buf, char* sub) {
    int i = 0;
    while (buf[i]) {
        int j = 0; while (sub[j] && buf[i+j] == sub[j]) j = j + 1;
        if (sub[j] == 0) return 1;
        i = i + 1;
    }
    return 0;
}

int main() {
    char buf[300];
    int score = 0;

    buf[0] = 0;
    codegen_if(buf, 1);

    if (contains(buf, "CMP R0, R1")) score = score + 1;
    if (contains(buf, "BGE .Lelse_1")) score = score + 1;
    if (contains(buf, "B .Lend_1")) score = score + 1;
    if (contains(buf, ".Lelse_1:")) score = score + 1;
    if (contains(buf, ".Lend_1:")) score = score + 1;

    return score;  // Doit retourner 5
}`,
        solution: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; } buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}
void emit_cmp(char* buf, int rn, int rm) {
    append(buf, "CMP R"); append_num(buf, rn);
    append(buf, ", R"); append_num(buf, rm); append(buf, "\\n");
}
void emit_label(char* buf, char* prefix, int num) {
    append(buf, ".L"); append(buf, prefix); append(buf, "_");
    append_num(buf, num); append(buf, ":\\n");
}
void emit_branch(char* buf, int cond, char* prefix, int num) {
    if (cond == 0) append(buf, "B .L");
    else if (cond == 4) append(buf, "BGE .L");
    append(buf, prefix); append(buf, "_");
    append_num(buf, num); append(buf, "\\n");
}
void emit_mov(char* buf, int reg, int val) {
    append(buf, "MOV R"); append_num(buf, reg);
    append(buf, ", #"); append_num(buf, val); append(buf, "\\n");
}

void codegen_if(char* buf, int n) {
    emit_cmp(buf, 0, 1);
    emit_branch(buf, 4, "else", n);
    emit_mov(buf, 2, 1);
    emit_branch(buf, 0, "end", n);
    emit_label(buf, "else", n);
    emit_mov(buf, 2, 0);
    emit_label(buf, "end", n);
}

int contains(char* buf, char* sub) {
    int i = 0;
    while (buf[i]) {
        int j = 0; while (sub[j] && buf[i+j] == sub[j]) j = j + 1;
        if (sub[j] == 0) return 1;
        i = i + 1;
    }
    return 0;
}

int main() {
    char buf[300];
    int score = 0;

    buf[0] = 0;
    codegen_if(buf, 1);

    if (contains(buf, "CMP R0, R1")) score = score + 1;
    if (contains(buf, "BGE .Lelse_1")) score = score + 1;
    if (contains(buf, "B .Lend_1")) score = score + 1;
    if (contains(buf, ".Lelse_1:")) score = score + 1;
    if (contains(buf, ".Lend_1:")) score = score + 1;

    return score;
}`,
        test: { expectedReturn: 5 }
    },

    'cc-codegen-while': {
        id: 'cc-codegen-while',
        name: '5.4 Compiler while',
        description: `Générez le code pour \`while (R0 < R1) { R0++ }\`

**Pattern:**
\`\`\`asm
.Lwhile_N:
    CMP R0, R1
    BGE .Lend_N      ; Sortir si condition fausse
    ; corps
    ADD R0, R0, #1
    B .Lwhile_N      ; Retour au début
.Lend_N:
\`\`\``,
        template: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; } buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}
void emit_cmp(char* buf, int rn, int rm) {
    append(buf, "CMP R"); append_num(buf, rn);
    append(buf, ", R"); append_num(buf, rm); append(buf, "\\n");
}
void emit_label(char* buf, char* prefix, int num) {
    append(buf, ".L"); append(buf, prefix); append(buf, "_");
    append_num(buf, num); append(buf, ":\\n");
}
void emit_branch(char* buf, int cond, char* prefix, int num) {
    if (cond == 0) append(buf, "B .L");
    else if (cond == 4) append(buf, "BGE .L");
    append(buf, prefix); append(buf, "_");
    append_num(buf, num); append(buf, "\\n");
}
void emit_add_imm(char* buf, int rd, int rn, int imm) {
    append(buf, "ADD R"); append_num(buf, rd);
    append(buf, ", R"); append_num(buf, rn);
    append(buf, ", #"); append_num(buf, imm); append(buf, "\\n");
}

void codegen_while(char* buf, int n) {
    // TODO: while (R0 < R1) { R0 = R0 + 1 }
    // 1. .Lwhile_n:
    // 2. CMP R0, R1
    // 3. BGE .Lend_n
    // 4. ADD R0, R0, #1 (corps)
    // 5. B .Lwhile_n
    // 6. .Lend_n:
}

int contains(char* buf, char* sub) {
    int i = 0;
    while (buf[i]) {
        int j = 0; while (sub[j] && buf[i+j] == sub[j]) j = j + 1;
        if (sub[j] == 0) return 1;
        i = i + 1;
    }
    return 0;
}

int main() {
    char buf[300];
    int score = 0;

    buf[0] = 0;
    codegen_while(buf, 2);

    if (contains(buf, ".Lwhile_2:")) score = score + 1;
    if (contains(buf, "CMP R0, R1")) score = score + 1;
    if (contains(buf, "BGE .Lend_2")) score = score + 1;
    if (contains(buf, "B .Lwhile_2")) score = score + 1;
    if (contains(buf, ".Lend_2:")) score = score + 1;

    return score;  // Doit retourner 5
}`,
        solution: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; } buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}
void emit_cmp(char* buf, int rn, int rm) {
    append(buf, "CMP R"); append_num(buf, rn);
    append(buf, ", R"); append_num(buf, rm); append(buf, "\\n");
}
void emit_label(char* buf, char* prefix, int num) {
    append(buf, ".L"); append(buf, prefix); append(buf, "_");
    append_num(buf, num); append(buf, ":\\n");
}
void emit_branch(char* buf, int cond, char* prefix, int num) {
    if (cond == 0) append(buf, "B .L");
    else if (cond == 4) append(buf, "BGE .L");
    append(buf, prefix); append(buf, "_");
    append_num(buf, num); append(buf, "\\n");
}
void emit_add_imm(char* buf, int rd, int rn, int imm) {
    append(buf, "ADD R"); append_num(buf, rd);
    append(buf, ", R"); append_num(buf, rn);
    append(buf, ", #"); append_num(buf, imm); append(buf, "\\n");
}

void codegen_while(char* buf, int n) {
    emit_label(buf, "while", n);
    emit_cmp(buf, 0, 1);
    emit_branch(buf, 4, "end", n);
    emit_add_imm(buf, 0, 0, 1);
    emit_branch(buf, 0, "while", n);
    emit_label(buf, "end", n);
}

int contains(char* buf, char* sub) {
    int i = 0;
    while (buf[i]) {
        int j = 0; while (sub[j] && buf[i+j] == sub[j]) j = j + 1;
        if (sub[j] == 0) return 1;
        i = i + 1;
    }
    return 0;
}

int main() {
    char buf[300];
    int score = 0;

    buf[0] = 0;
    codegen_while(buf, 2);

    if (contains(buf, ".Lwhile_2:")) score = score + 1;
    if (contains(buf, "CMP R0, R1")) score = score + 1;
    if (contains(buf, "BGE .Lend_2")) score = score + 1;
    if (contains(buf, "B .Lwhile_2")) score = score + 1;
    if (contains(buf, ".Lend_2:")) score = score + 1;

    return score;
}`,
        test: { expectedReturn: 5 }
    },

    // ========================================================================
    // PHASE 6: FONCTIONS
    // Prologue, épilogue et appels
    // ========================================================================

    'cc-codegen-func': {
        id: 'cc-codegen-func',
        name: '6.1 Prologue et Épilogue',
        description: `Une fonction A32 a besoin d'un **prologue** et d'un **épilogue**.

**Prologue:**
\`\`\`asm
func_name:
    STR LR, [SP, #-4]!   ; Sauver adresse de retour
\`\`\`

**Épilogue:**
\`\`\`asm
    LDR LR, [SP], #4     ; Restaurer LR
    BX LR                ; Retourner
\`\`\``,
        template: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; } buf[i] = 0;
}

void emit_prologue(char* buf, char* name) {
    // TODO: "name:\\n    STR LR, [SP, #-4]!\\n"
}

void emit_epilogue(char* buf) {
    // TODO: "    LDR LR, [SP], #4\\n    BX LR\\n"
}

int contains(char* buf, char* sub) {
    int i = 0;
    while (buf[i]) {
        int j = 0; while (sub[j] && buf[i+j] == sub[j]) j = j + 1;
        if (sub[j] == 0) return 1;
        i = i + 1;
    }
    return 0;
}

int main() {
    char buf[200];
    int score = 0;

    buf[0] = 0;
    emit_prologue(buf, "add");
    if (contains(buf, "add:") && contains(buf, "STR LR")) score = score + 1;

    buf[0] = 0;
    emit_epilogue(buf);
    if (contains(buf, "LDR LR") && contains(buf, "BX LR")) score = score + 1;

    buf[0] = 0;
    emit_prologue(buf, "main");
    emit_epilogue(buf);
    if (contains(buf, "main:") && contains(buf, "BX LR")) score = score + 1;

    return score;  // Doit retourner 3
}`,
        solution: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; } buf[i] = 0;
}

void emit_prologue(char* buf, char* name) {
    append(buf, name);
    append(buf, ":\\n    STR LR, [SP, #-4]!\\n");
}

void emit_epilogue(char* buf) {
    append(buf, "    LDR LR, [SP], #4\\n    BX LR\\n");
}

int contains(char* buf, char* sub) {
    int i = 0;
    while (buf[i]) {
        int j = 0; while (sub[j] && buf[i+j] == sub[j]) j = j + 1;
        if (sub[j] == 0) return 1;
        i = i + 1;
    }
    return 0;
}

int main() {
    char buf[200];
    int score = 0;

    buf[0] = 0;
    emit_prologue(buf, "add");
    if (contains(buf, "add:") && contains(buf, "STR LR")) score = score + 1;

    buf[0] = 0;
    emit_epilogue(buf);
    if (contains(buf, "LDR LR") && contains(buf, "BX LR")) score = score + 1;

    buf[0] = 0;
    emit_prologue(buf, "main");
    emit_epilogue(buf);
    if (contains(buf, "main:") && contains(buf, "BX LR")) score = score + 1;

    return score;
}`,
        test: { expectedReturn: 3 }
    },

    'cc-codegen-call': {
        id: 'cc-codegen-call',
        name: '6.2 Appels de Fonction',
        description: `Pour appeler une fonction:
1. Placer les arguments dans R0, R1, R2, R3
2. \`BL nom_fonction\`
3. Le résultat est dans R0

Implémentez \`emit_call(buf, name)\` qui génère \`BL name\``,
        template: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; } buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}
void emit_mov(char* buf, int reg, int val) {
    append(buf, "MOV R"); append_num(buf, reg);
    append(buf, ", #"); append_num(buf, val); append(buf, "\\n");
}

void emit_call(char* buf, char* name) {
    // TODO: "BL {name}\\n"
}

int contains(char* buf, char* sub) {
    int i = 0;
    while (buf[i]) {
        int j = 0; while (sub[j] && buf[i+j] == sub[j]) j = j + 1;
        if (sub[j] == 0) return 1;
        i = i + 1;
    }
    return 0;
}

int main() {
    char buf[200];
    int score = 0;

    // Appel simple
    buf[0] = 0;
    emit_call(buf, "putchar");
    if (contains(buf, "BL putchar")) score = score + 1;

    // Appel avec argument
    buf[0] = 0;
    emit_mov(buf, 0, 65);  // 'A'
    emit_call(buf, "putchar");
    if (contains(buf, "MOV R0, #65") && contains(buf, "BL putchar")) score = score + 1;

    // Appel add(3, 5)
    buf[0] = 0;
    emit_mov(buf, 0, 3);
    emit_mov(buf, 1, 5);
    emit_call(buf, "add");
    if (contains(buf, "MOV R0, #3") && contains(buf, "MOV R1, #5") &&
        contains(buf, "BL add")) score = score + 1;

    return score;  // Doit retourner 3
}`,
        solution: `int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; } buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}
void emit_mov(char* buf, int reg, int val) {
    append(buf, "MOV R"); append_num(buf, reg);
    append(buf, ", #"); append_num(buf, val); append(buf, "\\n");
}

void emit_call(char* buf, char* name) {
    append(buf, "BL ");
    append(buf, name);
    append(buf, "\\n");
}

int contains(char* buf, char* sub) {
    int i = 0;
    while (buf[i]) {
        int j = 0; while (sub[j] && buf[i+j] == sub[j]) j = j + 1;
        if (sub[j] == 0) return 1;
        i = i + 1;
    }
    return 0;
}

int main() {
    char buf[200];
    int score = 0;

    buf[0] = 0;
    emit_call(buf, "putchar");
    if (contains(buf, "BL putchar")) score = score + 1;

    buf[0] = 0;
    emit_mov(buf, 0, 65);
    emit_call(buf, "putchar");
    if (contains(buf, "MOV R0, #65") && contains(buf, "BL putchar")) score = score + 1;

    buf[0] = 0;
    emit_mov(buf, 0, 3);
    emit_mov(buf, 1, 5);
    emit_call(buf, "add");
    if (contains(buf, "MOV R0, #3") && contains(buf, "MOV R1, #5") &&
        contains(buf, "BL add")) score = score + 1;

    return score;
}`,
        test: { expectedReturn: 3 }
    },

    // ========================================================================
    // PHASE 7: MINI-COMPILATEUR COMPLET
    // Tout assembler!
    // ========================================================================

    'cc-mini-complete': {
        id: 'cc-mini-complete',
        name: '7.1 Mini-Compilateur Complet',
        description: `**Projet final:** Assemblez tous les composants pour créer un mini-compilateur qui génère du code A32 valide!

Compilez l'expression \`(2 + 3) * 4\` en assembleur A32 avec:
- Support des parenthèses
- Précédence des opérateurs
- Utilisation de la pile pour les temporaires

Le code généré sera exécutable par notre CPU!`,
        template: `// === UTILITAIRES ===
int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; } buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}

// === ÉMETTEURS ===
void emit_mov(char* buf, int reg, int val) {
    append(buf, "MOV R"); append_num(buf, reg);
    append(buf, ", #"); append_num(buf, val); append(buf, "\\n");
}
void emit_push(char* buf, int reg) {
    append(buf, "STR R"); append_num(buf, reg); append(buf, ", [SP, #-4]!\\n");
}
void emit_pop(char* buf, int reg) {
    append(buf, "LDR R"); append_num(buf, reg); append(buf, ", [SP], #4\\n");
}
void emit_op(char* buf, char op, int rd, int rn, int rm) {
    if (op == '+') append(buf, "ADD R");
    else if (op == '-') append(buf, "SUB R");
    else if (op == '*') append(buf, "MUL R");
    append_num(buf, rd); append(buf, ", R"); append_num(buf, rn);
    append(buf, ", R"); append_num(buf, rm); append(buf, "\\n");
}

// === PARSER + CODEGEN ===
int is_digit(char c) { return c >= '0' && c <= '9'; }
char* input;
int pos;
char* out;

void skip() { while (input[pos] == ' ') pos = pos + 1; }

void codegen_expr();

void codegen_factor() {
    skip();
    if (input[pos] == '(') {
        // TODO: Gérer les parenthèses
        // 1. Consommer '('
        // 2. codegen_expr()
        // 3. Consommer ')'
        pos = pos + 1;
    } else {
        int v = 0;
        while (is_digit(input[pos])) {
            v = v * 10 + (input[pos] - '0');
            pos = pos + 1;
        }
        emit_mov(out, 0, v);
    }
}

void codegen_term() {
    codegen_factor();
    while (1) {
        skip();
        char op = input[pos];
        if (op != '*' && op != '/') break;
        pos = pos + 1;
        emit_push(out, 0);
        codegen_factor();
        emit_pop(out, 1);
        emit_op(out, op, 0, 1, 0);
    }
}

void codegen_expr() {
    codegen_term();
    while (1) {
        skip();
        char op = input[pos];
        if (op != '+' && op != '-') break;
        pos = pos + 1;
        emit_push(out, 0);
        codegen_term();
        emit_pop(out, 1);
        emit_op(out, op, 0, 1, 0);
    }
}

void compile(char* buf, char* src) {
    out = buf; input = src; pos = 0; buf[0] = 0;
    codegen_expr();
}

int contains(char* buf, char* sub) {
    int i = 0;
    while (buf[i]) {
        int j = 0; while (sub[j] && buf[i+j] == sub[j]) j = j + 1;
        if (sub[j] == 0) return 1;
        i = i + 1;
    }
    return 0;
}

int count(char* buf, char* sub) {
    int c = 0, i = 0;
    while (buf[i]) {
        int j = 0; while (sub[j] && buf[i+j] == sub[j]) j = j + 1;
        if (sub[j] == 0) c = c + 1;
        i = i + 1;
    }
    return c;
}

int main() {
    char buf[500];
    int score = 0;

    // Test simple
    compile(buf, "42");
    if (contains(buf, "MOV R0, #42")) score = score + 1;

    // Test avec parenthèses
    compile(buf, "(5)");
    if (contains(buf, "MOV R0, #5")) score = score + 1;

    // Test précédence
    compile(buf, "2 + 3 * 4");
    if (contains(buf, "MUL") && contains(buf, "ADD")) score = score + 1;

    // Test parenthèses changeant précédence
    compile(buf, "(2 + 3) * 4");
    // Doit d'abord faire ADD, puis MUL
    if (count(buf, "ADD") == 1 && count(buf, "MUL") == 1) score = score + 1;

    // Test complexe
    compile(buf, "(1 + 2) * (3 + 4)");
    if (count(buf, "ADD") == 2 && count(buf, "MUL") == 1) score = score + 1;

    return score;  // Doit retourner 5
}`,
        solution: `// === UTILITAIRES ===
int strlen(char* s) { int i = 0; while (s[i]) i = i + 1; return i; }
void append(char* buf, char* s) {
    int i = strlen(buf); int j = 0;
    while (s[j]) { buf[i] = s[j]; i = i + 1; j = j + 1; } buf[i] = 0;
}
void append_num(char* buf, int n) {
    if (n == 0) { append(buf, "0"); return; }
    char tmp[12]; int i = 11; tmp[11] = 0;
    while (n > 0) { i = i - 1; tmp[i] = '0' + (n % 10); n = n / 10; }
    append(buf, tmp + i);
}

// === ÉMETTEURS ===
void emit_mov(char* buf, int reg, int val) {
    append(buf, "MOV R"); append_num(buf, reg);
    append(buf, ", #"); append_num(buf, val); append(buf, "\\n");
}
void emit_push(char* buf, int reg) {
    append(buf, "STR R"); append_num(buf, reg); append(buf, ", [SP, #-4]!\\n");
}
void emit_pop(char* buf, int reg) {
    append(buf, "LDR R"); append_num(buf, reg); append(buf, ", [SP], #4\\n");
}
void emit_op(char* buf, char op, int rd, int rn, int rm) {
    if (op == '+') append(buf, "ADD R");
    else if (op == '-') append(buf, "SUB R");
    else if (op == '*') append(buf, "MUL R");
    append_num(buf, rd); append(buf, ", R"); append_num(buf, rn);
    append(buf, ", R"); append_num(buf, rm); append(buf, "\\n");
}

// === PARSER + CODEGEN ===
int is_digit(char c) { return c >= '0' && c <= '9'; }
char* input;
int pos;
char* out;

void skip() { while (input[pos] == ' ') pos = pos + 1; }

void codegen_expr();

void codegen_factor() {
    skip();
    if (input[pos] == '(') {
        pos = pos + 1;
        codegen_expr();
        skip();
        pos = pos + 1;  // ')'
    } else {
        int v = 0;
        while (is_digit(input[pos])) {
            v = v * 10 + (input[pos] - '0');
            pos = pos + 1;
        }
        emit_mov(out, 0, v);
    }
}

void codegen_term() {
    codegen_factor();
    while (1) {
        skip();
        char op = input[pos];
        if (op != '*' && op != '/') break;
        pos = pos + 1;
        emit_push(out, 0);
        codegen_factor();
        emit_pop(out, 1);
        emit_op(out, op, 0, 1, 0);
    }
}

void codegen_expr() {
    codegen_term();
    while (1) {
        skip();
        char op = input[pos];
        if (op != '+' && op != '-') break;
        pos = pos + 1;
        emit_push(out, 0);
        codegen_term();
        emit_pop(out, 1);
        emit_op(out, op, 0, 1, 0);
    }
}

void compile(char* buf, char* src) {
    out = buf; input = src; pos = 0; buf[0] = 0;
    codegen_expr();
}

int contains(char* buf, char* sub) {
    int i = 0;
    while (buf[i]) {
        int j = 0; while (sub[j] && buf[i+j] == sub[j]) j = j + 1;
        if (sub[j] == 0) return 1;
        i = i + 1;
    }
    return 0;
}

int count(char* buf, char* sub) {
    int c = 0, i = 0;
    while (buf[i]) {
        int j = 0; while (sub[j] && buf[i+j] == sub[j]) j = j + 1;
        if (sub[j] == 0) c = c + 1;
        i = i + 1;
    }
    return c;
}

int main() {
    char buf[500];
    int score = 0;

    compile(buf, "42");
    if (contains(buf, "MOV R0, #42")) score = score + 1;

    compile(buf, "(5)");
    if (contains(buf, "MOV R0, #5")) score = score + 1;

    compile(buf, "2 + 3 * 4");
    if (contains(buf, "MUL") && contains(buf, "ADD")) score = score + 1;

    compile(buf, "(2 + 3) * 4");
    if (count(buf, "ADD") == 1 && count(buf, "MUL") == 1) score = score + 1;

    compile(buf, "(1 + 2) * (3 + 4)");
    if (count(buf, "ADD") == 2 && count(buf, "MUL") == 1) score = score + 1;

    return score;
}`,
        test: { expectedReturn: 5 }
    }
};

// ============================================================================
// FONCTIONS D'ACCÈS
// ============================================================================

export function getCompilerExercise(id) {
    return COMPILER_EXERCISES[id];
}

export function getCompilerExerciseIds() {
    return Object.keys(COMPILER_EXERCISES);
}

export function getCompilerExercisesByCategory() {
    return {
        'Phase 1: Lexer': [
            'cc-lexer-digit',
            'cc-lexer-number',
            'cc-lexer-token'
        ],
        'Phase 2: Parser': [
            'cc-parser-simple',
            'cc-parser-chain',
            'cc-parser-precedence',
            'cc-parser-parens'
        ],
        'Phase 3: Émission': [
            'cc-emit-mov',
            'cc-emit-binop',
            'cc-emit-stack'
        ],
        'Phase 4: CodeGen Expressions': [
            'cc-codegen-const',
            'cc-codegen-binop',
            'cc-codegen-expr'
        ],
        'Phase 5: Contrôle': [
            'cc-codegen-labels',
            'cc-codegen-cmp',
            'cc-codegen-if',
            'cc-codegen-while'
        ],
        'Phase 6: Fonctions': [
            'cc-codegen-func',
            'cc-codegen-call'
        ],
        'Phase 7: Projet Final': [
            'cc-mini-complete'
        ]
    };
}
