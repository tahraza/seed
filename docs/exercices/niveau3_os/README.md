# Niveau 3 : Exercices Système d'Exploitation

## Prérequis
- Avoir complété les niveaux 1 et 2
- Avoir lu les chapitres 1-5 du tutoriel OS

---

## Exercice 3.1 : Bootstrap minimal

**Objectif** : Créer un bootstrap qui :
1. Initialise la pile
2. Affiche "BOOT" sur le port de sortie
3. Appelle main()
4. Boucle infini après main

**Fichiers** :
```
boot.a32
main.c
```

**Validation** : Le système affiche "BOOT" puis exécute main.

---

## Exercice 3.2 : Bump allocator

**Objectif** : Implémenter un allocateur simple.

```c
void *bump_alloc(int size);  // Alloue size octets
void bump_reset(void);       // Remet le pointeur au début
```

**Test** :
```c
void *a = bump_alloc(10);
void *b = bump_alloc(20);
// b devrait être 16 octets après a (alignement)
```

---

## Exercice 3.3 : Free list allocator

**Objectif** : malloc/free avec liste chaînée.

```c
void heap_init(void *start, int size);
void *malloc(int size);
void free(void *ptr);
```

**Bonus** : Fusionner les blocs adjacents lors du free.

---

## Exercice 3.4 : Driver d'écran

**Objectif** : API graphique complète.

```c
void screen_init(void);
void screen_clear(void);
void screen_set_pixel(int x, int y, int color);
void screen_draw_line(int x0, int y0, int x1, int y1);
void screen_draw_rect(int x, int y, int w, int h);
void screen_fill_rect(int x, int y, int w, int h);
```

**Test** : Dessiner un cadre et des diagonales.

---

## Exercice 3.5 : Police bitmap

**Objectif** : Afficher du texte à l'écran.

```c
void screen_draw_char(int x, int y, char c);
void screen_draw_string(int x, int y, char *s);
```

**Indice** : Créer une police 5x7 pour ASCII 32-127.

---

## Exercice 3.6 : Console

**Objectif** : Terminal texte avec défilement.

```c
void console_init(void);
void console_putchar(char c);
void console_print(char *s);
void console_scroll(void);
```

**Fonctionnalités** :
- Retour à la ligne automatique
- Défilement quand on atteint le bas
- Support de \n, \t, \r

---

## Exercice 3.7 : Driver clavier

**Objectif** : Lecture du clavier avec buffer.

```c
void keyboard_init(void);
int keyboard_read(void);        // Non-bloquant
int keyboard_wait(void);        // Bloquant
char *keyboard_readline(void);  // Lit une ligne complète
```

**Bonus** : Support du backspace.

---

## Exercice 3.8 : Shell minimal

**Objectif** : Interpréteur de commandes.

**Commandes** :
- `echo <texte>` : Affiche le texte
- `help` : Liste des commandes
- `clear` : Efface l'écran
- `mem` : Affiche l'état de la mémoire
- `exit` : Quitte le shell

---

## Exercice 3.9 : Calculatrice shell

**Objectif** : Ajouter une commande `calc`.

```
$ calc 5 + 3
8
$ calc 10 * 4
40
$ calc 100 / 7
14
```

---

## Exercice 3.10 : Variables shell

**Objectif** : Gestion des variables.

```
$ set x 42
$ echo $x
42
$ set y 8
$ calc $x + $y
50
```

---

## Projet final : Mini-OS

**Objectif** : Créer un OS complet avec :

1. **Bootstrap** (boot.a32)
   - Initialisation CPU
   - Initialisation mémoire
   - Appel du kernel

2. **Kernel** (kernel.c)
   - Initialisation des drivers
   - Lancement du shell

3. **Drivers** (drivers/)
   - screen.c : Écran graphique
   - keyboard.c : Clavier
   - console.c : Terminal

4. **Allocateur** (memory.c)
   - malloc/free
   - Statistiques mémoire

5. **Shell** (shell.c)
   - Commandes builtin
   - Variables
   - Historique

6. **Applications** (apps/)
   - calc : Calculatrice
   - paint : Dessin simple
   - snake : Le jeu !

**Structure** :
```
myos/
├── boot.a32
├── kernel.c
├── include/
│   ├── screen.h
│   ├── keyboard.h
│   ├── console.h
│   ├── memory.h
│   └── shell.h
├── drivers/
│   ├── screen.c
│   ├── keyboard.c
│   └── console.c
├── memory.c
├── shell.c
└── apps/
    ├── calc.c
    ├── paint.c
    └── snake.c
```

---

## Barème

| Exercice | Points | Difficulté |
|----------|--------|------------|
| 3.1 | 10 | ⭐ |
| 3.2 | 10 | ⭐ |
| 3.3 | 20 | ⭐⭐⭐ |
| 3.4 | 15 | ⭐⭐ |
| 3.5 | 10 | ⭐⭐ |
| 3.6 | 15 | ⭐⭐ |
| 3.7 | 10 | ⭐⭐ |
| 3.8 | 15 | ⭐⭐ |
| 3.9 | 10 | ⭐ |
| 3.10 | 15 | ⭐⭐ |
| Mini-OS | 100 (bonus) | ⭐⭐⭐⭐⭐ |

---

## Livrables

Pour chaque exercice, fournir :
1. Code source commenté
2. Instructions de compilation
3. Capture d'écran ou log de test
4. Bref rapport expliquant les choix techniques

---

## Critères d'évaluation

1. **Fonctionnalité** (40%) : Le code fait ce qui est demandé
2. **Qualité du code** (25%) : Lisibilité, structure, commentaires
3. **Robustesse** (20%) : Gestion des erreurs, cas limites
4. **Originalité** (15%) : Extensions, optimisations, créativité

---

## Conseils

1. Commencez simple, ajoutez des fonctionnalités progressivement
2. Testez chaque composant isolément avant de les intégrer
3. Utilisez le debugger pour comprendre les bugs
4. Documentez vos décisions de conception
5. N'hésitez pas à regarder le code des exemples (demos/)
