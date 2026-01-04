# Demo 02: Fibonacci

## Objectif
Comprendre les boucles et la récursion à travers le calcul de Fibonacci.

## Concepts abordés
- Boucles `while`
- Récursion
- Pile d'appels
- Complexité algorithmique
- Affichage de nombres

## Les deux versions

### Version itérative
```c
int fib_iterative(int n) {
    int a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        int temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}
```
- **Complexité temps** : O(n)
- **Complexité espace** : O(1)

### Version récursive
```c
int fib_recursive(int n) {
    if (n <= 1) return n;
    return fib_recursive(n-1) + fib_recursive(n-2);
}
```
- **Complexité temps** : O(2^n) - exponentielle !
- **Complexité espace** : O(n) - profondeur de pile

## Visualisation de la pile d'appels

Pour `fib_recursive(4)` :

```
fib(4)
├── fib(3)
│   ├── fib(2)
│   │   ├── fib(1) → 1
│   │   └── fib(0) → 0
│   └── fib(1) → 1
└── fib(2)
    ├── fib(1) → 1
    └── fib(0) → 0
```

Résultat : 1 + 0 + 1 + 1 + 0 = 3

## Ce qui se passe en assembleur

Chaque appel récursif :
1. Sauvegarde les registres sur la pile (PUSH)
2. Appelle la fonction (BL)
3. Restaure les registres (POP)

```asm
fib_recursive:
    CMP R0, #1
    BLE .base_case      ; Si n <= 1, retourne n

    PUSH {R4, LR}       ; Sauvegarde R4 et adresse retour
    MOV R4, R0          ; R4 = n

    SUB R0, R4, #1      ; R0 = n - 1
    BL fib_recursive    ; Appel récursif
    MOV R5, R0          ; Sauvegarde résultat

    SUB R0, R4, #2      ; R0 = n - 2
    BL fib_recursive    ; Appel récursif

    ADD R0, R0, R5      ; R0 = fib(n-1) + fib(n-2)
    POP {R4, PC}        ; Retour

.base_case:
    MOV PC, LR          ; Retourne n (déjà dans R0)
```

## Exercices

1. **Mémoïsation** : Ajoutez un cache pour éviter les calculs redondants
2. **Compteur d'appels** : Comptez combien de fois `fib_recursive` est appelée
3. **Fibonacci généralisé** : Implémentez une suite où F(n) = F(n-1) + F(n-2) + F(n-3)
4. **Détection d'overflow** : Détectez quand le résultat dépasse 32 bits
