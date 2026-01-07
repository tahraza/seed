# Carte de Référence C32

## Types de Données

| Type | Taille | Plage | Description |
|------|--------|-------|-------------|
| int | 32 bits | -2³¹ à 2³¹-1 | Entier signé |
| uint | 32 bits | 0 à 2³²-1 | Entier non-signé |
| char | 8 bits | 0 à 255 | Caractère ASCII |
| bool | 8 bits | true/false | Booléen |
| void | - | - | Absence de type |
| T* | 32 bits | - | Pointeur vers T |

## Déclaration de Variables

```c
int x;              // Non initialisé
int y = 42;         // Initialisé
int a, b, c;        // Multiples

int *ptr;           // Pointeur
int arr[10];        // Tableau de 10 éléments
```

## Opérateurs

### Arithmétiques
| Op | Description | Exemple |
|----|-------------|---------|
| + | Addition | `a + b` |
| - | Soustraction | `a - b` |
| * | Multiplication | `a * b` |
| / | Division | `a / b` |
| % | Modulo | `a % b` |

### Comparaison
| Op | Description | Exemple |
|----|-------------|---------|
| == | Égal | `a == b` |
| != | Différent | `a != b` |
| < | Inférieur | `a < b` |
| > | Supérieur | `a > b` |
| <= | Inférieur ou égal | `a <= b` |
| >= | Supérieur ou égal | `a >= b` |

### Logiques
| Op | Description | Exemple |
|----|-------------|---------|
| && | ET logique | `a && b` |
| \|\| | OU logique | `a \|\| b` |
| ! | NON logique | `!a` |

### Bit à Bit
| Op | Description | Exemple |
|----|-------------|---------|
| & | ET | `a & b` |
| \| | OU | `a \| b` |
| ^ | XOR | `a ^ b` |
| ~ | NON | `~a` |
| << | Décalage gauche | `a << n` |
| >> | Décalage droite | `a >> n` |

### Pointeurs
| Op | Description | Exemple |
|----|-------------|---------|
| & | Adresse de | `&x` |
| * | Déréférencement | `*ptr` |

## Structures de Contrôle

### Conditionnelle
```c
if (condition) {
    // si vrai
} else {
    // si faux
}
```

### Boucle while
```c
while (condition) {
    // corps
}
```

### Boucle for
```c
for (init; condition; increment) {
    // corps
}

// Exemple
for (int i = 0; i < 10; i = i + 1) {
    // répéter 10 fois
}
```

### Boucle do-while
```c
do {
    // corps (au moins 1 fois)
} while (condition);
```

## Fonctions

```c
// Déclaration
int add(int a, int b);

// Définition
int add(int a, int b) {
    return a + b;
}

// Appel
int result = add(5, 3);
```

### Convention d'appel
- Arguments : R0, R1, R2, R3 (puis pile)
- Retour : R0
- Callee-saved : R4-R11

## Pointeurs et Tableaux

```c
int arr[5];           // Tableau
int *p = arr;         // Pointeur vers premier élément

arr[0] = 10;          // Accès par indice
*(arr + 1) = 20;      // Équivalent à arr[1]

p = p + 1;            // Avancer d'un élément
int val = *p;         // Lire la valeur pointée
```

## Chaînes de Caractères

```c
char *msg = "Hello";  // Chaîne constante

// Parcourir
while (*msg != '\0') {
    putc(*msg);
    msg = msg + 1;
}
```

## Entrées/Sorties

### Fonctions Intégrées
| Fonction | Description |
|----------|-------------|
| `putc(c)` | Afficher un caractère |
| `getc()` | Lire un caractère |
| `exit(n)` | Terminer avec code n |

### MMIO Direct
```c
// Écran (framebuffer)
uint *screen = (uint*)0x00400000;
screen[0] = 0xFFFFFFFF;  // Ligne blanche

// Sortie caractère
char *output = (char*)0xFFFF0000;
*output = 'A';

// Entrée caractère
char *input = (char*)0xFFFF0004;
char c = *input;
```

## Structures (si supporté)

```c
struct Point {
    int x;
    int y;
};

struct Point p;
p.x = 10;
p.y = 20;

struct Point *ptr = &p;
ptr->x = 30;  // Équivalent à (*ptr).x
```

## Bonnes Pratiques

1. **Toujours initialiser** les variables
2. **Vérifier les pointeurs** avant déréférencement
3. **Éviter la division par zéro**
4. **Utiliser des noms descriptifs**
5. **Commenter le code complexe**

## Différences avec C Standard

| Fonctionnalité | C32 | C Standard |
|----------------|-----|------------|
| `i++` | Non | Oui |
| `float/double` | Non | Oui |
| `enum` | Non | Oui |
| `typedef` | Limité | Oui |
| Préprocesseur | Minimal | Complet |
| `malloc/free` | Via OS | stdlib |
