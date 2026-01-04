# Niveau 1 : Exercices Assembleur

## Prérequis
- Avoir lu la documentation sur l'architecture A32
- Comprendre les registres et instructions de base

---

## Exercice 1.1 : Hello World en assembleur

**Objectif** : Afficher "HELLO" via le port de sortie.

**Instructions** :
1. Chargez l'adresse du port de sortie (0x10000000) dans un registre
2. Pour chaque caractère 'H', 'E', 'L', 'L', 'O' :
   - Chargez le code ASCII dans R0
   - Stockez-le à l'adresse du port

**Squelette** :
```asm
.section .text
.global _start

_start:
    LDR R1, =0x10000000   ; Port de sortie

    MOV R0, #72           ; 'H' = 72
    STR R0, [R1]

    ; TODO: Afficher E, L, L, O

.halt:
    B .halt
```

**Validation** : La sortie doit afficher "HELLO"

---

## Exercice 1.2 : Compteur

**Objectif** : Afficher les chiffres de 0 à 9.

**Indices** :
- '0' = 48 en ASCII
- Utilisez une boucle avec CMP et BLT

**Squelette** :
```asm
_start:
    LDR R1, =0x10000000
    MOV R2, #0            ; Compteur

.loop:
    ; TODO: Afficher R2 comme caractère
    ; TODO: Incrémenter R2
    ; TODO: Si R2 < 10, continuer

.halt:
    B .halt
```

**Validation** : Affiche "0123456789"

---

## Exercice 1.3 : Addition de deux nombres

**Objectif** : Calculer 25 + 17 et stocker le résultat en mémoire.

**Instructions** :
1. Chargez 25 dans R0
2. Chargez 17 dans R1
3. Additionnez dans R2
4. Stockez R2 à l'adresse 0x00100000

```asm
_start:
    ; TODO

    ; Vérification
    LDR R3, =0x00100000
    LDR R4, [R3]
    ; R4 devrait contenir 42
```

---

## Exercice 1.4 : Maximum de deux nombres

**Objectif** : Trouver le maximum entre deux valeurs.

**Entrées** :
- R0 = première valeur
- R1 = deuxième valeur

**Sortie** :
- R0 = maximum

```asm
max:
    CMP R0, R1
    ; TODO: Si R0 >= R1, garder R0
    ; TODO: Sinon, copier R1 dans R0
    MOV PC, LR
```

---

## Exercice 1.5 : Factorielle

**Objectif** : Calculer n! itérativement.

**Entrée** : R0 = n (par exemple 5)
**Sortie** : R0 = n!

**Algorithme** :
```
result = 1
while n > 1:
    result = result * n
    n = n - 1
return result
```

```asm
factorial:
    MOV R1, #1            ; result = 1
.loop:
    CMP R0, #1
    BLE .done
    MUL R1, R1, R0        ; result *= n
    SUB R0, R0, #1        ; n--
    B .loop
.done:
    MOV R0, R1
    MOV PC, LR
```

**Test** : factorial(5) = 120

---

## Exercice 1.6 : Fibonacci

**Objectif** : Calculer le n-ième nombre de Fibonacci.

**Entrée** : R0 = n
**Sortie** : R0 = fib(n)

**Rappel** : fib(0)=0, fib(1)=1, fib(n)=fib(n-1)+fib(n-2)

---

## Exercice 1.7 : Copie de chaîne

**Objectif** : Copier une chaîne de src vers dst.

```asm
; R0 = adresse destination
; R1 = adresse source
strcpy:
    ; TODO: Copier octet par octet jusqu'à '\0'
```

---

## Exercice 1.8 : Longueur de chaîne

**Objectif** : Calculer la longueur d'une chaîne.

**Entrée** : R0 = adresse de la chaîne
**Sortie** : R0 = longueur

---

## Exercice 1.9 : Inverser un tableau

**Objectif** : Inverser un tableau d'entiers sur place.

**Entrées** :
- R0 = adresse du tableau
- R1 = nombre d'éléments

**Exemple** : [1, 2, 3, 4] → [4, 3, 2, 1]

---

## Exercice 1.10 : Pixel sur l'écran

**Objectif** : Allumer le pixel (160, 120) au centre de l'écran.

**Indices** :
- SCREEN_BASE = 0x00400000
- byte_offset = y * 40 + x / 8
- bit_index = 7 - (x % 8)

```asm
draw_pixel:
    ; x=160, y=120
    ; byte_offset = 120 * 40 + 160/8 = 4800 + 20 = 4820
    ; bit_index = 7 - (160 % 8) = 7 - 0 = 7

    LDR R0, =0x00400000
    ADD R0, R0, #4820
    LDRB R1, [R0]
    ORR R1, R1, #0x80     ; bit 7
    STRB R1, [R0]
```

---

## Barème

| Exercice | Points | Difficulté |
|----------|--------|------------|
| 1.1 | 5 | ⭐ |
| 1.2 | 10 | ⭐ |
| 1.3 | 5 | ⭐ |
| 1.4 | 10 | ⭐⭐ |
| 1.5 | 15 | ⭐⭐ |
| 1.6 | 15 | ⭐⭐ |
| 1.7 | 10 | ⭐⭐ |
| 1.8 | 10 | ⭐⭐ |
| 1.9 | 15 | ⭐⭐⭐ |
| 1.10 | 5 | ⭐⭐ |
| **Total** | **100** | |

---

## Conseils

1. Testez chaque instruction individuellement
2. Utilisez le debugger pour voir l'état des registres
3. Dessinez la mémoire sur papier avant de coder
4. Commentez votre code !
