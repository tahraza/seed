# Demo 04: Snake

## Objectif
Implémenter un jeu complet avec tous les concepts réunis.

## Concepts abordés
- Boucle de jeu (game loop)
- Gestion des entrées clavier
- Détection de collisions
- Structure de données (tableau pour le serpent)
- Génération de nombres pseudo-aléatoires

## Architecture du jeu

```
┌─────────────────────────────────────┐
│            main()                   │
│  ┌─────────────────────────────┐    │
│  │      Boucle de jeu          │    │
│  │  ┌─────────┐ ┌───────────┐  │    │
│  │  │ Input   │→│ Update    │  │    │
│  │  └─────────┘ └───────────┘  │    │
│  │       ↓           ↓         │    │
│  │  ┌─────────┐ ┌───────────┐  │    │
│  │  │ Render  │ │ Collision │  │    │
│  │  └─────────┘ └───────────┘  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

## Structure de données du serpent

Le serpent est stocké comme un tableau de coordonnées :

```c
int snake_x[MAX_SNAKE];  // Coordonnées X
int snake_y[MAX_SNAKE];  // Coordonnées Y
int snake_length;        // Longueur actuelle

// snake[0] = tête
// snake[length-1] = queue
```

### Mouvement

Pour déplacer le serpent, on décale tous les segments :

```c
// 1. Sauvegarde la queue (pour l'effacer)
tail = snake[length-1];

// 2. Décale le corps vers la tête
for (i = length-1; i > 0; i--) {
    snake[i] = snake[i-1];
}

// 3. Nouvelle position de la tête
snake[0] = new_position;
```

### Croissance

Quand le serpent mange une pomme, on ajoute un segment à la queue :

```c
if (ate_apple) {
    snake[length] = old_tail;
    length++;
}
```

## Génération pseudo-aléatoire

On utilise un LFSR (Linear Feedback Shift Register) simple :

```c
int random_state = 12345;  // Graine

int random() {
    // XOR de certains bits
    int bit = ((random_state >> 0) ^
               (random_state >> 2) ^
               (random_state >> 3) ^
               (random_state >> 5)) & 1;

    // Décale et insère le nouveau bit
    random_state = (random_state >> 1) | (bit << 15);
    return random_state;
}
```

**Propriétés :**
- Période maximale : 2^16 - 1 = 65535
- Pas de vrai hasard, mais suffisant pour un jeu
- Déterministe : même graine = même séquence

## Gestion du clavier

```c
#define KEYBOARD_ADDR ((volatile int*)0x00402600)

int keyboard_read() {
    return *KEYBOARD_ADDR;
}

// Dans la boucle de jeu:
int key = keyboard_read();
if (key == KEY_UP && direction != DOWN) {
    direction = UP;
}
```

**Protection contre le demi-tour :**
On ne peut pas aller dans la direction opposée instantanément
(sinon le serpent se mordrait immédiatement).

## Détection de collisions

```c
int check_collision(int x, int y) {
    // Murs
    if (x <= 0 || x >= GRID_WIDTH - 1) return 1;
    if (y <= 0 || y >= GRID_HEIGHT - 1) return 1;

    // Corps du serpent
    for (int i = 0; i < snake_length; i++) {
        if (snake_x[i] == x && snake_y[i] == y) {
            return 1;
        }
    }

    return 0;
}
```

## Exercices

1. **Niveaux de difficulté** : Ajustez la vitesse selon le score
2. **Obstacles** : Ajoutez des murs internes
3. **Power-ups** : Pommes spéciales (bonus, ralentissement, etc.)
4. **Écran de titre** : Affichez un menu avant de jouer
5. **High score** : Sauvegardez le meilleur score

## Optimisations possibles

1. **Ne redessiner que ce qui change** :
   - Effacer l'ancienne queue
   - Dessiner la nouvelle tête
   - Ne pas redessiner tout le serpent

2. **Utiliser une grille de collision** :
   - Tableau 2D booléen
   - O(1) au lieu de O(n) pour les collisions

```c
int grid[GRID_HEIGHT][GRID_WIDTH];  // 0=vide, 1=serpent, 2=pomme

int check_collision(int x, int y) {
    return grid[y][x] != 0;
}
```
