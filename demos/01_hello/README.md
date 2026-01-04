# Demo 01: Hello World

## Objectif
Comprendre les bases de la programmation sur A32-Lite.

## Concepts abordés
- Point d'entrée `main()`
- Sortie texte via MMIO (Memory-Mapped I/O)
- Chaînes de caractères
- Fonctions simples

## Comment ça marche

### Memory-Mapped I/O
Le port de sortie texte est mappé à l'adresse `0x10000000`.
Écrire un caractère à cette adresse l'affiche à l'écran.

```c
#define OUTPUT_PORT ((volatile int*)0x10000000)
*OUTPUT_PORT = 'A';  // Affiche 'A'
```

### Compilation et exécution

```bash
# Compiler
c32 hello.c -o hello.a32

# Assembler
a32 hello.a32 -o hello.a32b

# Exécuter
a32-run hello.a32b
```

## Exercices

1. **Modifier le message** : Changez le texte affiché
2. **Ajouter une fonction** : Créez `print_int(int n)` pour afficher un nombre
3. **Afficher un cadre** : Utilisez des caractères ASCII pour dessiner un cadre

## Code assembleur généré

Le compilateur génère quelque chose comme :

```asm
main:
    PUSH LR
    LEA R0, str_hello    ; Charge l'adresse de la chaîne
    BL println           ; Appelle println
    MOV R0, #0           ; Valeur de retour
    POP PC

println:
    PUSH {LR, R4}
    MOV R4, R0           ; Sauvegarde le pointeur
.loop:
    LDRB R0, [R4]        ; Charge un caractère
    CMP R0, #0           ; Fin de chaîne ?
    BEQ .done
    BL putchar           ; Affiche le caractère
    ADD R4, R4, #1       ; Caractère suivant
    B .loop
.done:
    MOV R0, #10          ; Newline
    BL putchar
    POP {LR, R4}
    MOV PC, LR
```
