# Demo 03: Graphics

## Objectif
Comprendre le framebuffer et les algorithmes de dessin.

## Concepts abordés
- Memory-mapped framebuffer
- Manipulation de bits (set, clear, test)
- Algorithme de Bresenham pour les lignes
- Algorithme du cercle de Bresenham
- Optimisation (lignes horizontales/verticales)

## Le framebuffer

L'écran A32 est un framebuffer monochrome :
- **Résolution** : 320 × 240 pixels
- **Format** : 1 bit par pixel, MSB first
- **Adresse** : 0x00400000
- **Taille** : 9600 octets (320 × 240 / 8)

### Organisation mémoire

```
Adresse 0x00400000:
  Octet 0: pixels 0-7   de la ligne 0 (bit 7 = pixel 0)
  Octet 1: pixels 8-15  de la ligne 0
  ...
  Octet 39: pixels 312-319 de la ligne 0
  Octet 40: pixels 0-7   de la ligne 1
  ...
```

### Calcul de l'adresse d'un pixel

```c
void draw_pixel(int x, int y, int on) {
    int byte_offset = y * 40 + x / 8;  // 40 = 320/8
    int bit_index = 7 - (x % 8);       // MSB first

    char *addr = SCREEN_BASE + byte_offset;

    if (on)
        *addr |= (1 << bit_index);   // Set
    else
        *addr &= ~(1 << bit_index);  // Clear
}
```

## Algorithme de Bresenham (lignes)

L'algorithme trace une ligne en n'utilisant que des additions et des comparaisons (pas de division ni de flottants).

### Principe
- On avance pixel par pixel sur l'axe principal
- On accumule une erreur pour l'axe secondaire
- Quand l'erreur dépasse un seuil, on avance sur l'axe secondaire

```
Pour tracer de (0,0) à (5,2):

    . . . . . X    Pente = 2/5 = 0.4
    . . . X X .
    X X X . . .

Erreur accumulée: 0.4, 0.8, 0.2, 0.6, 1.0
                       ↑        ↑    ↑
                   monte      monte monte
```

## Algorithme du cercle

Utilise la symétrie à 8 points pour ne calculer qu'un octant :

```c
// Pour chaque point (x, y) calculé, on dessine 8 points:
draw_pixel(cx + x, cy + y);  // Octant 1
draw_pixel(cx - x, cy + y);  // Octant 2
draw_pixel(cx + x, cy - y);  // Octant 3
draw_pixel(cx - x, cy - y);  // Octant 4
draw_pixel(cx + y, cy + x);  // Octant 5
draw_pixel(cx - y, cy + x);  // Octant 6
draw_pixel(cx + y, cy - x);  // Octant 7
draw_pixel(cx - y, cy - x);  // Octant 8
```

## Exercices

1. **fill_circle** : Implémentez le remplissage de cercle
2. **draw_triangle** : Dessinez un triangle (3 lignes)
3. **fill_triangle** : Remplissez un triangle (scanline)
4. **Sprites** : Affichez un sprite 8x8 depuis un tableau
5. **Texte** : Implémentez une police bitmap 5x7

## Optimisation

Pour les lignes horizontales, on peut remplir des octets entiers :

```c
void draw_hline_fast(int x1, int x2, int y) {
    // Aligner x1 sur un octet
    while (x1 % 8 != 0 && x1 <= x2) {
        draw_pixel(x1++, y, 1);
    }

    // Remplir des octets complets
    while (x1 + 8 <= x2) {
        SCREEN_BASE[y * 40 + x1/8] = 0xFF;
        x1 += 8;
    }

    // Finir les pixels restants
    while (x1 <= x2) {
        draw_pixel(x1++, y, 1);
    }
}
```
