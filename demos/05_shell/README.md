# Demo 05: Shell

## Objectif
Construire un interpréteur de commandes interactif.

## Concepts abordés
- Lecture de ligne avec édition (backspace)
- Parsing de commandes
- Dispatch (table de commandes)
- Gestion d'état (variables)
- REPL (Read-Eval-Print Loop)

## Architecture

```
┌─────────────────────────────────────────────────┐
│                    main()                        │
│  ┌───────────────────────────────────────────┐  │
│  │              Boucle REPL                   │  │
│  │                                            │  │
│  │   print("$ ")                              │  │
│  │       ↓                                    │  │
│  │   read_line()  ───→ "set a 42"            │  │
│  │       ↓                                    │  │
│  │   process_command()                        │  │
│  │       ↓                                    │  │
│  │   ┌─────────────────────────────────┐     │  │
│  │   │ skip_spaces → find_space        │     │  │
│  │   │         ↓                       │     │  │
│  │   │   "set" | "a 42"                │     │  │
│  │   │     cmd    args                 │     │  │
│  │   └─────────────────────────────────┘     │  │
│  │       ↓                                    │  │
│  │   dispatch → cmd_set(args)                │  │
│  │                                            │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Lecture de ligne

```c
void read_line() {
    int pos = 0;
    int key;

    while (1) {
        key = keyboard_read();
        if (key == 0) continue;  // Pas de touche

        if (key == ENTER) {
            buffer[pos] = '\0';  // Termine la chaîne
            return;
        }

        if (key == BACKSPACE && pos > 0) {
            pos--;
            // Efface visuellement
            putchar('\b'); putchar(' '); putchar('\b');
            continue;
        }

        if (is_printable(key)) {
            buffer[pos++] = key;
            putchar(key);  // Echo
        }
    }
}
```

## Parsing simple

Le parsing se fait en deux étapes :

1. **Extraction de la commande** :
```c
cmd = skip_spaces(line);     // Saute les espaces initiaux
end = find_space(cmd);       // Trouve la fin du mot
args = end;                  // Le reste = arguments
```

2. **Dispatch** :
```c
if (strcmp(cmd, "help") == 0) {
    cmd_help();
} else if (strcmp(cmd, "echo") == 0) {
    cmd_echo(args);
} else ...
```

## Table de dispatch (alternative)

Pour un shell plus extensible, on peut utiliser une table :

```c
typedef struct {
    char *name;
    void (*handler)(char *args);
} Command;

Command commands[] = {
    {"help",  cmd_help},
    {"echo",  cmd_echo},
    {"set",   cmd_set},
    {"exit",  cmd_exit},
    {NULL,    NULL}
};

void dispatch(char *cmd, char *args) {
    for (int i = 0; commands[i].name; i++) {
        if (strcmp(cmd, commands[i].name) == 0) {
            commands[i].handler(args);
            return;
        }
    }
    println("Commande inconnue");
}
```

## Variables

Le shell maintient un état minimal :

```c
int var_a, var_b, var_c;   // Variables utilisateur
int var_result;            // Résultat des opérations

// Commandes :
// set a 42   → var_a = 42
// get a      → affiche 42
// add        → result = a + b
```

## Exercices

1. **Historique** : Implémentez les flèches haut/bas pour l'historique
2. **Variables dynamiques** : Supportez des noms de variables arbitraires
3. **Expressions** : Parsez des expressions comme `2 + 3 * 4`
4. **Redirection** : Implémentez `>` pour écrire dans la mémoire
5. **Scripts** : Exécutez une séquence de commandes prédéfinie

## Exemple de session

```
╔═══════════════════════════════════════╗
║       A32-Lite Mini Shell v1.0        ║
╚═══════════════════════════════════════╝

Tapez 'help' pour la liste des commandes.

$ set a 10
a = 10
$ set b 3
b = 3
$ mul
result = 10 * 3 = 30
$ fib 20
fib(20) = 6765
$ get result
result = 6765
$ echo Hello World!
Hello World!
$ exit
Au revoir!
```

## Vers un vrai shell

Un shell complet ajouterait :
- Pipes (`cmd1 | cmd2`)
- Variables d'environnement (`$HOME`)
- Wildcards (`*.c`)
- Contrôle de jobs (Ctrl+C, `&`)
- Scripting (if/while/for)
