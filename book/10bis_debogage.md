# L'Art du Débogage

> "Le débogage, c'est comme être détective dans un film policier où vous êtes aussi le meurtrier." — Filipe Fortes

Le débogage est une compétence fondamentale en programmation. Ce chapitre vous apprend à trouver et corriger les erreurs de manière méthodique.

---

## Pourquoi ce Chapitre ?

Vous avez appris à construire des circuits, écrire de l'assembleur, et utiliser un compilateur. Mais que faire quand **ça ne marche pas** ?

Ce chapitre couvre :
1. Comment lire les messages d'erreur
2. Comment utiliser le simulateur pas-à-pas
3. Les erreurs les plus courantes et leurs solutions
4. Une méthodologie systématique de débogage

---

## 1. Comprendre les Messages d'Erreur

### Codes d'Erreur du Projet Codex

Les outils du projet utilisent des codes d'erreur standardisés :

| Préfixe | Source | Description |
|---------|--------|-------------|
| **E1xxx** | Assembleur | Erreurs d'assemblage |
| **E2xxx** | Compilateur C32 | Erreurs de compilation |
| **E3xxx** | Linker | Erreurs de liaison |

### Erreurs d'Assemblage (E1xxx)

| Code | Signification | Solution |
|------|---------------|----------|
| E1001 | Mnémonique inconnu | Vérifiez l'orthographe de l'instruction |
| E1002 | Opérande invalide | Vérifiez le format des registres/immédiats |
| E1003 | Label non défini | Ajoutez le label ou corrigez son nom |
| E1004 | Immédiat hors plage | Utilisez `LDR R0, =value` pour les grandes valeurs |
| E1005 | Registre invalide | Utilisez R0-R15 uniquement |
| E1008 | Literal pool overflow | Placez `.ltorg` plus tôt dans le code |

**Exemple** : Erreur E1004
```asm
; ERREUR : L'immédiat 0x12345678 ne tient pas sur 12 bits
MOV R0, #0x12345678

; SOLUTION : Utiliser le literal pool
LDR R0, =0x12345678
```

### Erreurs de Compilation (E2xxx)

| Code | Signification | Solution |
|------|---------------|----------|
| E2001 | Erreur de syntaxe | Vérifiez les parenthèses, points-virgules |
| E2002 | Type incompatible | Vérifiez les types des opérandes |
| E2003 | Variable non déclarée | Déclarez la variable avant utilisation |
| E2004 | Fonction non définie | Définissez la fonction ou incluez le header |
| E2008 | Return manquant | Ajoutez `return` à la fin de la fonction |

**Exemple** : Erreur E2003
```c
// ERREUR : 'x' non déclaré
int main() {
    x = 5;  // E2003: Variable 'x' non déclarée
    return 0;
}

// SOLUTION : Déclarer la variable
int main() {
    int x;
    x = 5;
    return 0;
}
```

### Erreurs de Liaison (E3xxx)

| Code | Signification | Solution |
|------|---------------|----------|
| E3001 | Symbole non résolu | Définissez le symbole ou liez la bibliothèque |
| E3002 | Point d'entrée manquant | Ajoutez `_start:` ou `main()` |
| E3004 | Débordement mémoire | Réduisez la taille du programme |

---

## 2. Utiliser le Simulateur Pas-à-Pas

### Le Visualiseur CPU

Le visualiseur web (`web/visualizer.html`) est votre meilleur ami pour déboguer.

**Fonctionnalités clés** :
- **Step (N ou F10)** : Exécute une instruction
- **Registres** : Voir R0-R15, SP, LR, PC et les flags
- **Mémoire** : Inspecter la RAM
- **Code** : Ligne courante surlignée

### Méthodologie de Débogage Pas-à-Pas

1. **Chargez votre programme** dans le visualiseur
2. **Identifiez le symptôme** : Qu'est-ce qui ne va pas ?
3. **Formulez une hypothèse** : Où le bug pourrait-il être ?
4. **Placez-vous avant** la zone suspecte
5. **Exécutez pas-à-pas** en vérifiant les registres
6. **Trouvez la divergence** : Où le comportement diffère-t-il de l'attendu ?

### Exemple Pratique

**Programme bugué** :
```asm
; Censé calculer 5 + 3 = 8
    MOV R0, #5
    MOV R1, #3
    SUB R2, R0, R1   ; BUG : devrait être ADD !
    SVC #0
```

**Débogage** :
1. Après `MOV R0, #5` : R0 = 5 ✓
2. Après `MOV R1, #3` : R1 = 3 ✓
3. Après `SUB R2, R0, R1` : R2 = 2 ✗ (attendu : 8)

→ **Bug trouvé** : `SUB` au lieu de `ADD`

---

## 3. Erreurs Courantes et Solutions

### 3.1 Assembleur

#### Oubli de sauvegarder LR

**Symptôme** : Le programme ne retourne pas correctement d'une fonction.

```asm
; BUGUÉ
my_func:
    BL other_func    ; LR est écrasé !
    BX LR            ; Retourne... où ?

; CORRECT
my_func:
    PUSH {LR}        ; Sauvegarder LR
    BL other_func
    POP {LR}         ; Restaurer LR
    BX LR
```

#### Off-by-one dans les boucles

**Symptôme** : La boucle s'exécute une fois de trop ou de moins.

```asm
; BUGUÉ : S'arrête à 9 au lieu de 10
    MOV R0, #0
loop:
    CMP R0, #10
    BEQ done         ; BEQ : si R0 == 10, sauter
    ; ... corps de la boucle ...
    ADD R0, R0, #1
    B loop
done:

; Vérifiez toujours : combien d'itérations attendues ?
; R0 va de 0 à 9 = 10 itérations ✓
```

#### Mauvais alignement mémoire

**Symptôme** : Erreur MISALIGNED ou données corrompues.

```asm
; BUGUÉ : Adresse non alignée sur 4 octets
    LDR R0, [R1, #3]   ; 3 n'est pas multiple de 4 !

; CORRECT
    LDR R0, [R1, #4]   ; OK : 4 est multiple de 4
```

### 3.2 Compilateur C32

#### Oubli du return

**Symptôme** : Valeur de retour incorrecte ou aléatoire.

```c
// BUGUÉ
int add(int a, int b) {
    int c = a + b;
    // Oops, pas de return !
}

// CORRECT
int add(int a, int b) {
    int c = a + b;
    return c;
}
```

#### Confusion pointeur/valeur

**Symptôme** : Crash ou données incorrectes.

```c
// BUGUÉ
void increment(int x) {
    x = x + 1;  // Modifie la COPIE, pas l'original !
}

// CORRECT
void increment(int *x) {
    *x = *x + 1;  // Modifie la valeur POINTÉE
}

// Appel
int n = 5;
increment(&n);  // Passer l'ADRESSE
```

#### Division par zéro

**Symptôme** : Trap DIV_ZERO ou résultat infini.

```c
// BUGUÉ
int divide(int a, int b) {
    return a / b;  // Et si b == 0 ?
}

// CORRECT
int divide(int a, int b) {
    if (b == 0) {
        return 0;  // Ou gérer l'erreur autrement
    }
    return a / b;
}
```

### 3.3 HDL

#### Signal non connecté

**Symptôme** : Sortie toujours à 0 ou X (indéfini).

```vhdl
-- BUGUÉ : 'result' n'est jamais assigné
entity Adder is
  port(a, b : in bit; result : out bit);
end entity;

architecture rtl of Adder is
begin
  -- Oops, rien ici !
end architecture;

-- CORRECT
architecture rtl of Adder is
begin
  result <= a xor b;  -- Connexion explicite
end architecture;
```

#### Boucle combinatoire

**Symptôme** : Le simulateur ne converge pas ou donne des résultats instables.

```vhdl
-- BUGUÉ : 'x' dépend de lui-même instantanément
signal x : bit;
x <= not x;  -- Boucle infinie !

-- CORRECT : Utiliser une DFF pour la rétroaction
-- x(t+1) <= not x(t)  -- Via une DFF
```

---

## 4. Méthodologie Systématique

### La Méthode Scientifique du Débogage

1. **Observer** : Quel est le symptôme exact ?
   - Message d'erreur ?
   - Mauvais résultat ?
   - Crash ?

2. **Hypothétiser** : Quelle pourrait être la cause ?
   - Erreur de logique ?
   - Mauvaise valeur ?
   - Condition incorrecte ?

3. **Tester** : Vérifier l'hypothèse
   - Ajouter des prints/traces
   - Exécuter pas-à-pas
   - Simplifier le code

4. **Conclure** : L'hypothèse était-elle correcte ?
   - Si oui → corriger
   - Si non → nouvelle hypothèse

### La Technique de la Bissection

Quand le bug est difficile à trouver :

1. **Divisez** le code en deux moitiés
2. **Testez** chaque moitié indépendamment
3. **Identifiez** quelle moitié contient le bug
4. **Répétez** jusqu'à isoler le problème

```
Code complet (bug quelque part)
    ├── Première moitié
    │   └── ✓ OK
    └── Deuxième moitié
        └── ✗ Bug ici !
            ├── Premier quart → ✓ OK
            └── Deuxième quart → ✗ Bug trouvé !
```

### Ajouter des Traces

En C32 :
```c
void debug_print(int value) {
    // Afficher la valeur pour debug
    putc('[');
    // ... afficher value ...
    putc(']');
    putc('\n');
}

int main() {
    int x = compute_something();
    debug_print(x);  // Voir la valeur
    // ...
}
```

En assembleur :
```asm
; Afficher R0 pour debug (caractère ASCII)
    ADD R0, R0, #'0'   ; Convertir en ASCII
    LDR R1, =0xFFFF0000
    STR R0, [R1]       ; Afficher
```

---

## 5. Erreurs de Traps et leur Diagnostic

### Types de Traps

| Trap | Cause | Solution |
|------|-------|----------|
| DIV_ZERO | Division par 0 | Vérifier le diviseur avant |
| MEM_FAULT | Accès mémoire invalide | Vérifier les pointeurs |
| MISALIGNED | Adresse non alignée | Aligner sur 4 octets |
| ILLEGAL | Instruction invalide | Vérifier l'encodage |

### Déboguer un MEM_FAULT

1. **Notez l'adresse** du PC quand le trap se produit
2. **Trouvez l'instruction** à cette adresse
3. **Examinez les registres** utilisés pour l'adressage
4. **Questions à se poser** :
   - Le pointeur est-il initialisé ?
   - Est-il dans la plage valide (0 - RAM_SIZE) ?
   - A-t-il été corrompu par une autre partie du code ?

---

## 6. Checklist de Débogage

Avant de chercher un bug complexe, vérifiez ces points simples :

### Assembleur
- [ ] Toutes les instructions sont correctement orthographiées ?
- [ ] Les registres sont dans la plage R0-R15 ?
- [ ] Les immédiats sont dans la plage autorisée ?
- [ ] LR est sauvegardé avant les appels de fonction ?
- [ ] La pile est équilibrée (PUSH = POP) ?
- [ ] Les accès mémoire sont alignés sur 4 octets ?

### C32
- [ ] Toutes les variables sont déclarées ?
- [ ] Toutes les fonctions ont un return ?
- [ ] Les pointeurs sont initialisés avant déréférencement ?
- [ ] Pas de division par zéro possible ?
- [ ] Les indices de tableau sont dans les bornes ?

### HDL
- [ ] Toutes les sorties sont assignées ?
- [ ] Pas de boucles combinatoires ?
- [ ] Les signaux sont de la bonne largeur (bit vs bits) ?
- [ ] Les port maps connectent les bons signaux ?

---

## 7. Exercices de Débogage

### Exercice 1 : Trouvez le bug

```asm
; Programme censé afficher "Hello"
    LDR R0, =message
    LDR R1, =0xFFFF0000
loop:
    LDRB R2, [R0]
    CMP R2, #0
    BEQ done
    STR R2, [R1]
    ADD R0, R0, #1
    B done            ; <-- Bug ici !
done:
    SVC #0

message: .asciz "Hello"
```

<details>
<summary>Voir la solution</summary>

Le bug est `B done` qui devrait être `B loop`. Le programme n'affiche que le premier caractère car il saute directement à `done` au lieu de boucler.

```asm
    B loop    ; CORRECT : retourner au début de la boucle
```
</details>

### Exercice 2 : Trouvez le bug

```c
int factorial(int n) {
    if (n == 0) {
        return 1;
    }
    return n * factorial(n);  // <-- Bug ici !
}
```

<details>
<summary>Voir la solution</summary>

Le bug est `factorial(n)` qui devrait être `factorial(n - 1)`. Sans décrémenter n, la récursion est infinie → stack overflow.

```c
return n * factorial(n - 1);  // CORRECT
```
</details>

### Exercice 3 : Trouvez le bug

```c
void swap(int a, int b) {
    int temp = a;
    a = b;
    b = temp;
}

int main() {
    int x = 5;
    int y = 10;
    swap(x, y);
    // x est toujours 5, y toujours 10 !
    return 0;
}
```

<details>
<summary>Voir la solution</summary>

Le bug est le passage par valeur au lieu de passage par pointeur. Les modifications de `a` et `b` n'affectent pas `x` et `y`.

```c
void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main() {
    int x = 5;
    int y = 10;
    swap(&x, &y);  // Passer les adresses
    return 0;
}
```
</details>

---

## Ce qu'il faut retenir

1. **Lisez les messages d'erreur** : Ils contiennent souvent la solution
2. **Utilisez le pas-à-pas** : Le visualiseur est votre meilleur outil
3. **Formulez des hypothèses** : Approche scientifique
4. **Connaissez les erreurs courantes** : Elles représentent 90% des bugs
5. **Simplifiez** : Réduisez le problème au minimum reproductible

Le débogage est une compétence qui s'améliore avec la pratique. Chaque bug que vous trouvez vous rend meilleur !
