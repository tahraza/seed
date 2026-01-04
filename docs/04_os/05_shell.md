# Chapitre 5 : Le Shell

## Objectif

Créer une interface en ligne de commande interactive.

## Architecture du shell

```
┌─────────────────────────────────────────────────────────┐
│                      Shell                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │                 Boucle REPL                      │    │
│  │   prompt → read → parse → execute → output       │    │
│  └─────────────────────────────────────────────────┘    │
│                          ↓                               │
│  ┌──────────────────┐ ┌──────────────────────────┐      │
│  │ Builtins         │ │ Commandes externes       │      │
│  │ • cd, pwd        │ │ • programmes utilisateur │      │
│  │ • echo, set      │ │                          │      │
│  │ • help, exit     │ │                          │      │
│  └──────────────────┘ └──────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## Structure de données

```c
// shell.h

#define MAX_LINE     256
#define MAX_ARGS     16
#define MAX_VARS     32

typedef struct {
    char name[32];
    char value[64];
} Variable;

typedef struct {
    Console *console;
    Variable vars[MAX_VARS];
    int var_count;
    int running;
    int last_status;
    char cwd[64];
} Shell;

// Commande parsée
typedef struct {
    char *argv[MAX_ARGS];
    int argc;
} Command;
```

## Lecture de ligne

```c
// Lit une ligne avec support de l'édition

int shell_readline(Shell *sh, char *buffer, int size) {
    int pos = 0;
    int key;

    console_print(sh->console, "$ ");

    while (1) {
        key = keyboard_wait();

        switch (key) {
            case KEY_ENTER:
                buffer[pos] = '\0';
                console_putchar(sh->console, '\n');
                return pos;

            case KEY_BACKSPACE:
                if (pos > 0) {
                    pos--;
                    // Efface visuellement
                    console_putchar(sh->console, '\b');
                    console_putchar(sh->console, ' ');
                    console_putchar(sh->console, '\b');
                }
                break;

            case KEY_ESCAPE:
                // Efface la ligne
                while (pos > 0) {
                    pos--;
                    console_putchar(sh->console, '\b');
                    console_putchar(sh->console, ' ');
                    console_putchar(sh->console, '\b');
                }
                break;

            default:
                if (key >= 32 && key < 127 && pos < size - 1) {
                    buffer[pos++] = key;
                    console_putchar(sh->console, key);
                }
        }
    }
}
```

## Parsing de commande

```c
// Parse une ligne en commande

int shell_parse(char *line, Command *cmd) {
    cmd->argc = 0;

    char *p = line;

    while (*p && cmd->argc < MAX_ARGS - 1) {
        // Saute les espaces
        while (*p == ' ' || *p == '\t') p++;

        if (*p == '\0') break;

        // Début d'un argument
        char *start = p;

        // Gestion des guillemets
        if (*p == '"') {
            start = ++p;
            while (*p && *p != '"') p++;
            if (*p == '"') *p++ = '\0';
        } else {
            while (*p && *p != ' ' && *p != '\t') p++;
            if (*p) *p++ = '\0';
        }

        cmd->argv[cmd->argc++] = start;
    }

    cmd->argv[cmd->argc] = NULL;
    return cmd->argc;
}
```

## Commandes builtins

```c
// Tableau des builtins
typedef struct {
    char *name;
    int (*func)(Shell *sh, Command *cmd);
    char *help;
} Builtin;

int cmd_help(Shell *sh, Command *cmd);
int cmd_echo(Shell *sh, Command *cmd);
int cmd_set(Shell *sh, Command *cmd);
int cmd_get(Shell *sh, Command *cmd);
int cmd_clear(Shell *sh, Command *cmd);
int cmd_mem(Shell *sh, Command *cmd);
int cmd_exit(Shell *sh, Command *cmd);

Builtin builtins[] = {
    {"help",  cmd_help,  "Affiche l'aide"},
    {"echo",  cmd_echo,  "Affiche du texte"},
    {"set",   cmd_set,   "Definit une variable: set NAME VALUE"},
    {"get",   cmd_get,   "Affiche une variable: get NAME"},
    {"clear", cmd_clear, "Efface l'ecran"},
    {"mem",   cmd_mem,   "Affiche l'etat de la memoire"},
    {"exit",  cmd_exit,  "Quitte le shell"},
    {NULL, NULL, NULL}
};

// Implémentation des builtins

int cmd_help(Shell *sh, Command *cmd) {
    console_print(sh->console, "Commandes disponibles:\n");
    for (int i = 0; builtins[i].name; i++) {
        console_print(sh->console, "  ");
        console_print(sh->console, builtins[i].name);
        console_print(sh->console, " - ");
        console_print(sh->console, builtins[i].help);
        console_print(sh->console, "\n");
    }
    return 0;
}

int cmd_echo(Shell *sh, Command *cmd) {
    for (int i = 1; i < cmd->argc; i++) {
        if (i > 1) console_putchar(sh->console, ' ');
        console_print(sh->console, cmd->argv[i]);
    }
    console_putchar(sh->console, '\n');
    return 0;
}

int cmd_set(Shell *sh, Command *cmd) {
    if (cmd->argc < 3) {
        console_print(sh->console, "Usage: set NAME VALUE\n");
        return 1;
    }

    char *name = cmd->argv[1];
    char *value = cmd->argv[2];

    // Cherche si la variable existe
    for (int i = 0; i < sh->var_count; i++) {
        if (strcmp(sh->vars[i].name, name) == 0) {
            strcpy(sh->vars[i].value, value);
            return 0;
        }
    }

    // Nouvelle variable
    if (sh->var_count < MAX_VARS) {
        strcpy(sh->vars[sh->var_count].name, name);
        strcpy(sh->vars[sh->var_count].value, value);
        sh->var_count++;
    }

    return 0;
}

int cmd_get(Shell *sh, Command *cmd) {
    if (cmd->argc < 2) {
        // Affiche toutes les variables
        for (int i = 0; i < sh->var_count; i++) {
            console_print(sh->console, sh->vars[i].name);
            console_print(sh->console, "=");
            console_print(sh->console, sh->vars[i].value);
            console_print(sh->console, "\n");
        }
    } else {
        char *name = cmd->argv[1];
        for (int i = 0; i < sh->var_count; i++) {
            if (strcmp(sh->vars[i].name, name) == 0) {
                console_print(sh->console, sh->vars[i].value);
                console_print(sh->console, "\n");
                return 0;
            }
        }
        console_print(sh->console, "Variable non trouvee\n");
        return 1;
    }
    return 0;
}

int cmd_clear(Shell *sh, Command *cmd) {
    console_clear(sh->console);
    return 0;
}

int cmd_mem(Shell *sh, Command *cmd) {
    heap_stats();  // Défini dans l'allocateur
    return 0;
}

int cmd_exit(Shell *sh, Command *cmd) {
    sh->running = 0;
    return 0;
}
```

## Exécution de commande

```c
int shell_execute(Shell *sh, Command *cmd) {
    if (cmd->argc == 0) {
        return 0;  // Ligne vide
    }

    char *name = cmd->argv[0];

    // Cherche dans les builtins
    for (int i = 0; builtins[i].name; i++) {
        if (strcmp(builtins[i].name, name) == 0) {
            return builtins[i].func(sh, cmd);
        }
    }

    // Commande non trouvée
    console_print(sh->console, "Commande inconnue: ");
    console_print(sh->console, name);
    console_print(sh->console, "\n");
    console_print(sh->console, "Tapez 'help' pour la liste.\n");

    return 127;
}
```

## Boucle principale

```c
void shell_init(Shell *sh, Console *con) {
    sh->console = con;
    sh->var_count = 0;
    sh->running = 1;
    sh->last_status = 0;
    strcpy(sh->cwd, "/");
}

void shell_run(Shell *sh) {
    char line[MAX_LINE];
    Command cmd;

    console_print(sh->console, "A32 Shell v1.0\n");
    console_print(sh->console, "Tapez 'help' pour l'aide.\n\n");

    while (sh->running) {
        shell_readline(sh, line, MAX_LINE);

        if (shell_parse(line, &cmd) > 0) {
            sh->last_status = shell_execute(sh, &cmd);
        }
    }

    console_print(sh->console, "Au revoir!\n");
}
```

## Fonctionnalités avancées

### Historique des commandes

```c
#define HISTORY_SIZE 10

typedef struct {
    char entries[HISTORY_SIZE][MAX_LINE];
    int count;
    int current;
} History;

void history_add(History *h, char *line) {
    if (h->count < HISTORY_SIZE) {
        strcpy(h->entries[h->count++], line);
    } else {
        // Décale tout
        for (int i = 0; i < HISTORY_SIZE - 1; i++) {
            strcpy(h->entries[i], h->entries[i + 1]);
        }
        strcpy(h->entries[HISTORY_SIZE - 1], line);
    }
    h->current = h->count;
}

char *history_prev(History *h) {
    if (h->current > 0) {
        h->current--;
        return h->entries[h->current];
    }
    return NULL;
}

char *history_next(History *h) {
    if (h->current < h->count - 1) {
        h->current++;
        return h->entries[h->current];
    }
    return NULL;
}
```

### Expansion de variables

```c
// Remplace $VAR par sa valeur

void shell_expand(Shell *sh, char *src, char *dst, int size) {
    int i = 0;

    while (*src && i < size - 1) {
        if (*src == '$') {
            src++;
            char name[32];
            int j = 0;

            while (*src && (isalnum(*src) || *src == '_')) {
                name[j++] = *src++;
            }
            name[j] = '\0';

            // Cherche la variable
            char *value = shell_getvar(sh, name);
            if (value) {
                while (*value && i < size - 1) {
                    dst[i++] = *value++;
                }
            }
        } else {
            dst[i++] = *src++;
        }
    }

    dst[i] = '\0';
}
```

### Calculatrice intégrée

```c
int cmd_calc(Shell *sh, Command *cmd) {
    if (cmd->argc < 4) {
        console_print(sh->console, "Usage: calc NUM OP NUM\n");
        return 1;
    }

    int a = atoi(cmd->argv[1]);
    char op = cmd->argv[2][0];
    int b = atoi(cmd->argv[3]);
    int result;

    switch (op) {
        case '+': result = a + b; break;
        case '-': result = a - b; break;
        case '*': result = a * b; break;
        case '/':
            if (b == 0) {
                console_print(sh->console, "Division par zero\n");
                return 1;
            }
            result = a / b;
            break;
        default:
            console_print(sh->console, "Operateur inconnu\n");
            return 1;
    }

    char buf[32];
    itoa(result, buf);
    console_print(sh->console, buf);
    console_print(sh->console, "\n");

    return 0;
}
```

## Exercices

### Exercice 1 : Complétion automatique

Implémentez la complétion avec Tab :

```c
char *complete_command(char *prefix) {
    for (int i = 0; builtins[i].name; i++) {
        if (strncmp(builtins[i].name, prefix, strlen(prefix)) == 0) {
            return builtins[i].name;
        }
    }
    return NULL;
}
```

### Exercice 2 : Redirection

Ajoutez la redirection de sortie :

```
echo hello > output.txt
```

### Exercice 3 : Alias

Implémentez les alias :

```
alias ll="ls -l"
```

### Exercice 4 : Scripts

Exécutez une liste de commandes :

```c
void shell_run_script(Shell *sh, char *script);
```

## Points clés

1. **REPL** = Read-Eval-Print Loop
2. **Builtins** = commandes intégrées, pas de fork
3. **Parsing** = tokenization simple
4. **État** = variables, historique, répertoire courant

## Récapitulatif OS

Vous avez maintenant les bases pour un mini-OS :

```
┌────────────────────────────────────────────────────┐
│                    Shell                            │  Chapitre 5
├────────────────────────────────────────────────────┤
│              Drivers (écran, clavier)               │  Chapitre 4
├────────────────────────────────────────────────────┤
│                Allocateur mémoire                   │  Chapitre 3
├────────────────────────────────────────────────────┤
│                   Bootstrap                         │  Chapitre 2
├────────────────────────────────────────────────────┤
│                  Bare Metal                         │  Chapitre 1
└────────────────────────────────────────────────────┘
```

Félicitations ! Vous avez les connaissances pour construire votre propre OS.
