# Langage de Haut Niveau (C32)

> "Le logiciel est l'esprit qui anime la machine."

Jusqu'à présent, nous avons construit le matériel et appris à lui parler en assembleur. Mais écrire des applications complexes en assembleur est laborieux. C'est ici qu'intervient le **C32** — un langage de haut niveau qui vous permet de vous concentrer sur la **logique** de votre programme.

---

## Où en sommes-nous ?

```
┌─────────────────────────────────────────────────────────────────┐
│                     COUCHE 7: Applications                       │
├─────────────────────────────────────────────────────────────────┤
│                  COUCHE 6: Système d'Exploitation                │
├─────────────────────────────────────────────────────────────────┤
│  ══════════════► COUCHE 5: Langage de Haut Niveau (C32) ◄══════ │
│                    (Variables, fonctions, boucles)               │
│                    (Vous êtes ici !)                             │
├─────────────────────────────────────────────────────────────────┤
│                      COUCHE 4: Compilateur                       │
├─────────────────────────────────────────────────────────────────┤
│                   COUCHE 3: Assembleur (A32 ASM)                 │
├─────────────────────────────────────────────────────────────────┤
│                 COUCHE 2: Architecture Machine (ISA)             │
└─────────────────────────────────────────────────────────────────┘
```

Le C32 est un sous-ensemble du langage C. Si vous connaissez le C, le Java ou le C++, vous vous sentirez chez vous.

---

## Pourquoi un Langage de Haut Niveau ?

### Le problème de l'assembleur

```
Assembleur                           C32
───────────                          ───
MOV R0, #0                          int sum = 0;
MOV R1, #1                          for (int i = 1; i <= 10; i = i + 1) {
loop:                                   sum = sum + i;
  CMP R1, #10                       }
  BGT done
  ADD R0, R0, R1
  ADD R1, R1, #1
  B loop
done:
```

Le C32 est :
- **Plus lisible** : Variables nommées, structures de contrôle
- **Plus maintenable** : Moins de code, moins de bugs
- **Portable** : Le même code peut cibler différentes architectures

### L'abstraction

```
[ Pensée Humaine ]  →  "Calculer la moyenne"
        ↓
[ Langage C32 ]     →  sum = sum + tab[i];
        ↓
[ Assembleur A32 ]  →  LDR R0, [R1, R2]; ADD R3, R3, R0...
        ↓
[ Code Machine ]    →  0xE0833000...
```

---

## Spécification du Langage C32

### Les Types de Données

| Type | Taille | Description |
|:-----|:-------|:------------|
| `int` | 32 bits | Entier signé (complément à 2) |
| `uint` | 32 bits | Entier non-signé |
| `char` | 8 bits | Caractère ASCII |
| `bool` | 1 bit | `true` ou `false` |
| `void` | — | Pour les fonctions sans retour |
| `type*` | 32 bits | Pointeur (adresse mémoire) |

### Variables

```c
int x = 42;           // Variable globale ou locale
int tab[10];          // Tableau de 10 entiers
int* p = &x;          // Pointeur vers x
```

### Portée des variables

- **Globales** : Déclarées hors des fonctions, accessibles partout
- **Locales** : Déclarées dans une fonction, vivent sur la pile

---

## Opérateurs

### Arithmétiques

| Opérateur | Signification |
|:----------|:--------------|
| `+` | Addition |
| `-` | Soustraction |
| `*` | Multiplication |
| `/` | Division |
| `%` | Modulo (reste) |

### Comparaison

| Opérateur | Signification |
|:----------|:--------------|
| `==` | Égal |
| `!=` | Différent |
| `<` | Inférieur |
| `>` | Supérieur |
| `<=` | Inférieur ou égal |
| `>=` | Supérieur ou égal |

### Logiques

| Opérateur | Signification |
|:----------|:--------------|
| `&&` | ET logique |
| `\|\|` | OU logique |
| `!` | NON logique |

### Binaires

| Opérateur | Signification |
|:----------|:--------------|
| `&` | ET bit à bit |
| `\|` | OU bit à bit |
| `^` | XOR bit à bit |
| `~` | Inversion |
| `<<` | Décalage gauche |
| `>>` | Décalage droite |

---

## Structures de Contrôle

### If / Else

```c
if (score > 100) {
    win();
} else if (score > 50) {
    try_again();
} else {
    game_over();
}
```

### While

```c
while (x < 10) {
    x = x + 1;
}
```

### For

```c
for (int i = 0; i < 10; i = i + 1) {
    sum = sum + i;
}
```

### Do-While

```c
do {
    x = x - 1;
} while (x > 0);
```

---

## Fonctions

### Définition

```c
int add(int a, int b) {
    return a + b;
}

void greet() {
    putchar('H');
    putchar('i');
}
```

### Appel

```c
int result = add(5, 3);
greet();
```

### Récursion

```c
int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
```

---

## Pointeurs et Tableaux

### Pointeurs

Un pointeur contient une **adresse mémoire** :

```c
int x = 42;
int* p = &x;    // p contient l'adresse de x
*p = 100;       // x vaut maintenant 100
```

### Tableaux

Un tableau est une suite de valeurs consécutives en mémoire :

```c
int scores[5];
scores[0] = 10;
scores[4] = 50;
```

### Lien entre pointeurs et tableaux

```c
int tab[10];
int* p = tab;      // Équivalent à &tab[0]
p[3] = 42;         // Équivalent à tab[3] = 42
*(p + 3) = 42;     // Même chose !
```

---

## Accès au Matériel (MMIO)

### L'écran

```c
// L'écran commence à 0x00400000
// 320×240 pixels, 1 bit par pixel

void set_pixel(int x, int y) {
    uint* screen = (uint*)0x00400000;
    int offset = y * 10 + (x / 32);
    uint mask = 1 << (31 - (x % 32));
    screen[offset] = screen[offset] | mask;
}

void clear_screen() {
    uint* screen = (uint*)0x00400000;
    for (int i = 0; i < 2400; i = i + 1) {
        screen[i] = 0;
    }
}
```

### Le clavier

```c
// Le clavier est à 0x00402600

int get_key() {
    int* keyboard = (int*)0x00402600;
    return *keyboard;
}

void wait_key() {
    while (get_key() == 0) {
        // Attendre
    }
}
```

---

## Exemple Complet

```c
// Programme qui dessine un rectangle et attend une touche

extern void putchar(char c);

int main() {
    // Dessiner un rectangle 10×5 à la position (20, 30)
    uint* screen = (uint*)0x00400000;

    for (int y = 30; y < 35; y = y + 1) {
        for (int x = 20; x < 30; x = x + 1) {
            int offset = y * 10 + (x / 32);
            uint mask = 1 << (31 - (x % 32));
            screen[offset] = screen[offset] | mask;
        }
    }

    // Afficher un message
    putchar('D');
    putchar('o');
    putchar('n');
    putchar('e');
    putchar('!');

    // Attendre une touche
    int* kbd = (int*)0x00402600;
    while (*kbd == 0) {}

    return 0;
}
```

---

## Exercices Pratiques

### Exercices sur le Simulateur Web

La section **C32** contient de nombreux exercices progressifs :

| Catégorie | Exercices clés |
|:----------|:---------------|
| **Bases** | Variables, Expressions, Modulo |
| **Contrôle** | Conditions, Else-If, Opérateurs Logiques |
| **Boucles** | For, While, Imbriquées |
| **Fonctions** | Paramètres, Valeur Absolue, Min/Max |
| **Tableaux** | Accès, Maximum, Comptage |
| **Pointeurs** | Adresses, Swap |
| **Récursion** | Factorielle, Fibonacci, PGCD |
| **Algorithmes** | Tri à Bulles, Recherche Binaire |
| **Graphique** | Pixel, Ligne, Rectangle, Damier |

### Défis suggérés

1. **Hello World** : Affichez votre nom à l'écran

2. **Jeu de devinette** : Le programme choisit un nombre, l'utilisateur devine

3. **Calculatrice** : Lisez deux nombres et affichez leur somme

---

## Limitations du C32

Pour rester simple et pédagogique, le C32 a quelques limites :

| Fonctionnalité | État |
|:---------------|:-----|
| `struct` | Non supporté |
| `float`, `double` | Non supporté |
| `malloc`/`free` | Via OS uniquement |
| Chaînes de caractères | Basique |
| Préprocesseur | Minimal |

---

## Ce qu'il faut retenir

1. **C32 simplifie la programmation** : Variables nommées, structures de contrôle

2. **Les types de base** : `int`, `char`, `bool`, `void`, pointeurs

3. **Pointeurs = adresses** : Accès direct à la mémoire

4. **MMIO** : Écran à 0x00400000, clavier à 0x00402600

5. **Fonctions** : Modularité et réutilisation du code

**Prochaine étape** : Au Chapitre 9, nous construirons un **Système d'Exploitation** minimal — gestion mémoire, graphiques, entrées/sorties.

---

**Conseil** : Le C32 est proche du C. Si vous voulez aller plus loin, apprenez le C — c'est le langage de base de Linux, Windows, et de presque tous les systèmes embarqués !
