# Solutions des Quiz d'Auto-évaluation

Ce document contient les réponses aux questions d'auto-évaluation de chaque chapitre. Essayez de répondre par vous-même avant de consulter les solutions !

> **Note** : Pour les solutions des exercices pratiques HDL, assembleur et C32 du simulateur web, consultez le document **Solutions.md**.

---

## Chapitre 1 : Logique Booléenne

### Q1. Pourquoi les ordinateurs utilisent-ils le binaire plutôt que le décimal ?

Trois raisons principales :
1. **Fiabilité** : Distinguer 2 états (haut/bas) est plus robuste que 10 niveaux
2. **Simplicité** : Les transistors fonctionnent naturellement comme des interrupteurs on/off
3. **Universalité** : Toute logique peut s'exprimer avec Vrai/Faux (algèbre de Boole)

### Q2. Pourquoi dit-on que NAND est une porte "universelle" ?

Parce que **toutes les autres portes** (NOT, AND, OR, XOR, MUX, etc.) peuvent être construites uniquement à partir de portes NAND. C'est notre "axiome" de départ — tout le reste en découle.

### Q3. Quelle est la sortie de `XOR(1, 1)` ? Et de `XOR(0, 1)` ?

- `XOR(1, 1) = 0` (les entrées sont identiques)
- `XOR(0, 1) = 1` (les entrées sont différentes)

XOR vaut 1 **si et seulement si** les entrées sont différentes.

### Q4. Un multiplexeur (MUX) a 2 entrées de données `a` et `b`, et un signal de sélection `sel`. Si `sel = 1`, quelle entrée est transmise en sortie ?

Si `sel = 1`, la sortie est `b`.
Si `sel = 0`, la sortie est `a`.

Le MUX "choisit" entre ses entrées selon le signal de sélection.

### Q5. Combien de portes NAND faut-il au minimum pour construire un inverseur (NOT) ?

**Une seule** porte NAND suffit : `NOT(a) = NAND(a, a)`

Quand les deux entrées du NAND sont identiques, on obtient l'inverse.

### Mini-défi : Table de vérité de F(a, b) = AND(OR(a, b), NOT(a))

| a | b | OR(a,b) | NOT(a) | F |
|---|---|---------|--------|---|
| 0 | 0 | 0 | 1 | 0 |
| 0 | 1 | 1 | 1 | 1 |
| 1 | 0 | 1 | 0 | 0 |
| 1 | 1 | 1 | 0 | 0 |

Cette fonction est équivalente à `AND(NOT(a), b)`, soit "b ET NON a".

---

## Chapitre 2 : Arithmétique Binaire

### Q1. En complément à deux sur 8 bits, quelle est la représentation de -1 ?

**0xFF** (ou 11111111 en binaire).

En complément à deux, -1 est représenté par tous les bits à 1, quelle que soit la largeur.

### Q2. Pourquoi le complément à deux est-il préféré au "signe + magnitude" ?

Trois avantages majeurs :
1. **Un seul zéro** (pas de +0 et -0)
2. **L'addition fonctionne identiquement** pour les nombres signés et non-signés
3. **La soustraction devient une addition** : A - B = A + (~B + 1)

### Q3. Quel est le rôle de la retenue entrante (Cin) dans un additionneur complet ?

Elle permet de **propager la retenue** de la colonne précédente. C'est essentiel pour chaîner plusieurs additionneurs et créer un additionneur multi-bits. Sans Cin, on ne pourrait additionner que des bits individuels.

### Q4. Une ALU reçoit les opérandes A=5 et B=3, avec l'opération SUB. Quel est le résultat et quels flags sont activés ?

- **Résultat** : 5 - 3 = 2
- **Flags** : Aucun flag actif
  - Z = 0 (résultat non nul)
  - N = 0 (résultat positif)
  - C = 1 (pas d'emprunt en soustraction non-signée)
  - V = 0 (pas de débordement signé)

### Q5. Quelle opération ALU permet de mettre à zéro les bits 4-7 d'un registre tout en préservant les autres ?

**AND avec un masque** : `R = R AND 0x0F`

Le masque 0x0F (00001111 en binaire) préserve les bits 0-3 et force les bits 4-7 à zéro.

### Mini-défi : 0x7F + 0x01 en 8 bits signés

- 0x7F = 127 (le plus grand positif en 8 bits signés)
- 0x7F + 0x01 = 0x80 = 128 en non-signé, mais **-128 en signé**

C'est un **débordement (overflow)** ! Le flag V serait activé car on passe de positif à négatif.

---

## Chapitre 3 : Mémoire

### Q1. Quelle est la différence fondamentale entre un circuit combinatoire et un circuit séquentiel ?

Un circuit **combinatoire** : la sortie dépend uniquement des entrées actuelles.
Un circuit **séquentiel** : la sortie dépend des entrées ET de l'état précédent (il a une "mémoire").

La bascule D (DFF) est l'élément qui introduit la notion de temps et de mémoire.

### Q2. Pourquoi le signal d'horloge (clk) est-il essentiel dans les circuits séquentiels ?

L'horloge **synchronise** toutes les mises à jour de l'état. Sans elle :
- Les données se propageraient de manière chaotique
- Des "courses" (race conditions) créeraient des résultats imprévisibles
- On ne pourrait pas garantir un comportement déterministe

### Q3. Un registre 32 bits est construit à partir de combien de bascules D ?

**32 bascules D**, une par bit. Chaque DFF mémorise un bit, donc un registre de N bits nécessite N DFF.

### Q4. Quelle est la capacité totale d'une RAM de 1024 mots de 32 bits, en kilooctets ?

- 1024 mots × 32 bits/mot = 32768 bits
- 32768 bits ÷ 8 = 4096 octets
- 4096 octets ÷ 1024 = **4 Ko**

### Q5. Dans une RAM8, combien de bits d'adresse sont nécessaires et pourquoi ?

**3 bits** d'adresse, car 2³ = 8.

Avec 3 bits, on peut adresser 8 emplacements distincts (000 à 111).

### Mini-défi : Registre avec Enable

Pour ajouter un signal `enable` à une DFF :

```vhdl
-- Solution : MUX devant la DFF
signal d_mux : bit;
d_mux <= d when enable = '1' else q;  -- Si enable=0, reboucler la sortie
u_dff: DFF port map (d => d_mux, clk => clk, q => q);
```

Le MUX choisit entre la nouvelle donnée (si enable=1) ou la valeur actuelle (si enable=0).

---

## Chapitre 4 : Architecture

### Q1. Quelle est la différence entre l'architecture von Neumann et Harvard ?

- **Von Neumann** : Une seule mémoire pour les instructions et les données. Plus simple, mais un seul accès mémoire par cycle (goulot d'étranglement).
- **Harvard** : Mémoires séparées pour instructions et données. Permet de charger une instruction pendant qu'on accède aux données (plus rapide).

### Q2. Pourquoi utilise-t-on des registres plutôt que d'accéder directement à la RAM ?

Les registres sont **beaucoup plus rapides** que la RAM :
- Accès en 1 cycle vs plusieurs cycles pour la RAM
- Intégrés dans le CPU, pas de bus externe
- Nombre limité (16-32) mais suffisant pour les calculs immédiats

Les registres sont le "bureau de travail" du CPU, la RAM est "l'armoire de rangement".

### Q3. À quoi sert le registre PC (Program Counter) ?

Le PC contient l'**adresse de la prochaine instruction** à exécuter. Après chaque instruction :
- Il est incrémenté automatiquement (PC = PC + 4 pour des instructions 32 bits)
- Ou modifié par un branchement (saut, appel de fonction)

### Q4. Qu'est-ce que le MMIO (Memory-Mapped I/O) ?

Le MMIO permet d'accéder aux **périphériques** (écran, clavier, etc.) comme s'ils étaient de la mémoire. Chaque périphérique a une adresse réservée :
- Écrire à 0xFFFF0000 → envoie un caractère à la sortie
- Lire à 0xFFFF0004 → récupère un caractère du clavier

Avantage : pas besoin d'instructions spéciales, les mêmes LDR/STR fonctionnent.

### Q5. Dans le cycle fetch-decode-execute, que se passe-t-il pendant la phase "decode" ?

Pendant le **décodage** :
1. L'instruction est analysée pour identifier son type (ALU, mémoire, branchement)
2. Les registres sources sont identifiés et lus
3. L'unité de contrôle génère les signaux appropriés pour l'exécution

### Mini-défi : Pourquoi 16 registres avec 4 bits ?

Avec 4 bits, on peut encoder 2⁴ = **16 valeurs** différentes (0000 à 1111), donc 16 registres (R0 à R15).

Pour 32 registres, il faudrait 5 bits (2⁵ = 32).

---

## Chapitre 5 : CPU

### Q1. Quelles sont les 5 étapes du cycle d'instruction dans un pipeline classique ?

1. **IF** (Instruction Fetch) : Charger l'instruction depuis la mémoire
2. **ID** (Instruction Decode) : Décoder et lire les registres
3. **EX** (Execute) : Effectuer le calcul dans l'ALU
4. **MEM** (Memory Access) : Accéder à la mémoire si nécessaire
5. **WB** (Write Back) : Écrire le résultat dans le registre destination

### Q2. Qu'est-ce qu'un aléa de données (data hazard) et comment le résoudre ?

Un **aléa de données** se produit quand une instruction a besoin du résultat d'une instruction précédente qui n'est pas encore terminée.

Solutions :
- **Forwarding** : Transmettre le résultat directement depuis EX/MEM vers l'instruction suivante
- **Stall** : Insérer des bulles (attendre) si le forwarding n'est pas possible
- **Réordonnancement** : Le compilateur réorganise le code pour éviter les dépendances

### Q3. Pourquoi le Program Counter est-il incrémenté de 4 (et non de 1) sur une architecture 32 bits ?

Parce que chaque instruction occupe **4 octets** (32 bits). La mémoire est adressée par octet, donc passer à l'instruction suivante nécessite d'avancer de 4 adresses.

### Q4. Quel composant décide si un branchement conditionnel doit être pris ?

L'**unité de contrôle** utilise les **flags de l'ALU** (Z, N, C, V) pour décider. Par exemple :
- B.EQ (Branch if Equal) vérifie si Z = 1
- B.NE (Branch if Not Equal) vérifie si Z = 0
- B.GT (Branch if Greater Than) vérifie si Z = 0 ET N = V

### Q5. Quelle est la différence entre les instructions LDR et STR ?

- **LDR** (Load Register) : Lit une valeur **de la mémoire vers un registre**
  - `LDR R0, [R1]` → R0 = Mem[R1]
- **STR** (Store Register) : Écrit une valeur **d'un registre vers la mémoire**
  - `STR R0, [R1]` → Mem[R1] = R0

### Mini-défi : Temps d'exécution avec pipeline

Sans pipeline : 5 × 10 = **50 cycles**

Avec pipeline (après remplissage initial) :
- Remplissage : 4 cycles
- Puis 1 instruction complétée par cycle : 10 cycles
- Total : **14 cycles** (ou 10 + 4 = 14)

Gain : 50/14 ≈ **3.6× plus rapide**

---

## Chapitre 6 : Assembleur

### Q1. Quelle est la différence entre une instruction et une directive en assembleur ?

- **Instruction** : Traduite en code machine, exécutée par le CPU (ex: `ADD R0, R1, R2`)
- **Directive** : Commande pour l'assembleur lui-même, pas de code généré (ex: `.data`, `.word 42`, `.global main`)

Les directives contrôlent l'organisation du programme, pas son exécution.

### Q2. Pourquoi doit-on sauvegarder LR avant d'appeler une sous-fonction avec BL ?

Parce que `BL` (Branch and Link) **écrase LR** avec l'adresse de retour. Si on appelle une autre fonction sans sauvegarder, l'adresse de retour originale est perdue.

```asm
func:
    PUSH {LR}      ; Sauvegarder AVANT le BL
    BL autre_func  ; LR est écrasé ici
    POP {LR}       ; Restaurer
    BX LR          ; Retour correct
```

### Q3. Comment charger une valeur 32 bits arbitraire (ex: 0x12345678) dans un registre ?

Utiliser `LDR Rd, =value` qui utilise le **literal pool** :

```asm
LDR R0, =0x12345678  ; L'assembleur place la constante en mémoire
```

L'instruction `MOV` ne peut charger que des immédiats sur 12 bits (0-4095 ou valeurs rotées).

### Q4. À quoi sert la directive `.ltorg` ?

`.ltorg` force l'assembleur à **placer le literal pool** (les constantes utilisées par `LDR Rd, =value`) à cet endroit.

C'est nécessaire car le PC-relative offset est limité (±4KB). Si les constantes sont trop loin, l'assembleur génère une erreur E1008.

### Q5. Quelle est la convention pour les registres "callee-saved" vs "caller-saved" ?

- **Caller-saved** (R0-R3) : L'appelant doit les sauvegarder s'il veut les préserver. La fonction appelée peut les modifier librement.
- **Callee-saved** (R4-R11) : La fonction appelée doit les restaurer avant de retourner. L'appelant peut compter sur leur préservation.

### Mini-défi : Valeur finale de R0

```asm
    MOV R0, #10
    MOV R1, #3
loop:
    SUBS R0, R0, R1
    B.PL loop
```

Trace :
- R0 = 10, R0 - 3 = 7 (positif, N=0) → boucle
- R0 = 7, R0 - 3 = 4 (positif, N=0) → boucle
- R0 = 4, R0 - 3 = 1 (positif, N=0) → boucle
- R0 = 1, R0 - 3 = -2 (négatif, N=1) → sort

**R0 = -2** (ou 0xFFFFFFFE en non-signé)

---

## Chapitre 7 : Compilateur

### Q1. Quelles sont les principales phases d'un compilateur ?

1. **Analyse lexicale** : Transforme le texte en tokens (mots-clés, identifiants, opérateurs)
2. **Analyse syntaxique** : Construit l'arbre syntaxique (AST) selon la grammaire
3. **Analyse sémantique** : Vérifie les types, la portée des variables
4. **Génération de code** : Produit le code assembleur/machine

### Q2. Qu'est-ce qu'un AST et à quoi sert-il ?

L'**AST** (Abstract Syntax Tree) est une représentation arborescente du programme qui capture sa structure logique sans les détails syntaxiques (parenthèses, points-virgules).

Il sert de représentation intermédiaire entre le code source et le code généré, facilitant l'analyse et les transformations.

### Q3. Comment le compilateur gère-t-il les variables locales d'une fonction ?

Les variables locales sont stockées sur la **pile** (stack) :
- À l'entrée de la fonction, l'espace est réservé (`SUB SP, SP, #n`)
- Chaque variable a un offset par rapport à SP ou FP
- À la sortie, l'espace est libéré (`ADD SP, SP, #n`)

### Q4. Quelle est la différence entre une erreur syntaxique et sémantique ?

- **Erreur syntaxique** : Le code ne respecte pas la grammaire (ex: parenthèse manquante, point-virgule oublié)
- **Erreur sémantique** : Le code est syntaxiquement correct mais n'a pas de sens (ex: `int x = "hello"`, variable non déclarée)

### Q5. Pourquoi le compilateur génère-t-il parfois du code qui semble inefficace ?

Sans optimisation, le compilateur génère du code **direct et prévisible** qui suit fidèlement la structure du source. Par exemple :
- Chaque variable a son emplacement mémoire
- Chaque opération génère ses instructions

Les optimisations (niveau -O2, -O3) réduisent ces inefficacités mais compliquent le débogage.

### Mini-défi : Code assembleur généré

Pour `int x = a + b * c;` :

```asm
; Supposons a, b, c dans R0, R1, R2
MUL R3, R1, R2    ; R3 = b * c (multiplication d'abord)
ADD R4, R0, R3    ; R4 = a + (b * c)
; R4 contient x
```

Le compilateur respecte la **priorité des opérateurs** : multiplication avant addition.

---

## Chapitre 8 : Le Langage C32

### Q1. Quelles sont les principales différences entre C32 et C standard ?

- Pas d'opérateurs `++` et `--` (utiliser `x = x + 1`)
- Pas de `float`/`double` (entiers uniquement)
- Pas d'`enum`
- Préprocesseur minimal
- Pas de bibliothèque standard (juste `putc`, `getc`, `exit`)

### Q2. Comment passer un tableau à une fonction en C32 ?

Les tableaux sont passés par **pointeur** (l'adresse du premier élément) :

```c
void process(int *arr, int len) {
    for (int i = 0; i < len; i = i + 1) {
        arr[i] = arr[i] * 2;  // Modifie le tableau original
    }
}

int main() {
    int data[5];
    process(data, 5);  // 'data' est converti en &data[0]
}
```

### Q3. Quelle est la différence entre `*p` et `&x` ?

- `&x` : L'**adresse** de la variable x (opérateur "adresse de")
- `*p` : La **valeur** pointée par p (opérateur de déréférencement)

```c
int x = 42;
int *p = &x;  // p contient l'adresse de x
int y = *p;   // y = 42 (valeur lue à l'adresse p)
```

### Q4. Comment accéder au framebuffer pour dessiner un pixel ?

Via **MMIO** (Memory-Mapped I/O) :

```c
uint *screen = (uint*)0x00400000;  // Adresse du framebuffer
screen[y * 320 + x] = 0xFFFFFFFF;  // Pixel blanc à (x, y)
```

Chaque mot de 32 bits représente les couleurs de 32 pixels (1 bit par pixel en monochrome).

### Q5. Pourquoi faut-il toujours terminer une chaîne par `'\0'` ?

Le caractère `'\0'` (valeur 0) marque la **fin de la chaîne**. Sans lui, les fonctions de traitement de chaînes (affichage, copie, comparaison) ne sauraient pas où s'arrêter et liraient au-delà de la chaîne.

```c
char *msg = "Hello";  // Le compilateur ajoute '\0' automatiquement
// En mémoire : 'H' 'e' 'l' 'l' 'o' '\0'
```

### Mini-défi : Fonction de longueur de chaîne

```c
int strlen(char *s) {
    int len = 0;
    while (*s != '\0') {
        len = len + 1;
        s = s + 1;
    }
    return len;
}
```

---

## Chapitre 9 : Système d'Exploitation

### Q1. Quels sont les trois rôles principaux d'un système d'exploitation ?

1. **Abstraction du matériel** : Fournir une interface unifiée (fichiers, processus) au-dessus du matériel varié
2. **Gestion des ressources** : Allouer CPU, mémoire, périphériques entre les programmes
3. **Protection et isolation** : Empêcher les programmes de se perturber mutuellement

### Q2. Comment fonctionne un appel système (syscall) ?

1. Le programme place le numéro de syscall et les arguments dans les registres
2. L'instruction `SVC` (Supervisor Call) déclenche une exception
3. Le CPU passe en mode privilégié et saute au gestionnaire de syscall
4. L'OS exécute le service demandé
5. Le contrôle retourne au programme avec le résultat dans R0

### Q3. Qu'est-ce que le memory mapping et pourquoi est-il utile ?

Le **memory mapping** associe des régions de l'espace d'adressage à des ressources :
- **RAM physique** : Pour le code et les données du programme
- **Périphériques (MMIO)** : Pour communiquer avec le matériel
- **Fichiers** : Pour accéder aux fichiers comme de la mémoire

Avantage : Une interface uniforme (load/store) pour tout accès.

### Q4. Pourquoi l'OS a-t-il besoin d'un mode privilégié séparé ?

Pour **protéger le système** :
- Seul l'OS peut accéder au matériel directement
- Seul l'OS peut modifier les tables de pages mémoire
- Les programmes utilisateur ne peuvent pas crasher le système entier

Sans cette séparation, un bug dans un programme pourrait corrompre tout le système.

### Q5. Comment l'OS gère-t-il plusieurs programmes en même temps ?

Par le **multitâche préemptif** :
1. Un timer génère des interruptions régulières
2. À chaque interruption, l'OS peut changer de processus
3. L'état (registres, PC) du processus courant est sauvegardé
4. L'état d'un autre processus est restauré
5. L'exécution reprend dans le nouveau processus

Chaque processus croit avoir le CPU pour lui seul.

### Mini-défi : Allocation mémoire simple

```c
// Allocateur "bump pointer" minimal
int heap_ptr = 0x200000;  // Début du tas

void* malloc(int size) {
    int ptr = heap_ptr;
    heap_ptr = heap_ptr + size;
    // Aligner sur 4 octets
    heap_ptr = (heap_ptr + 3) & ~3;
    return (void*)ptr;
}

// Note : pas de free() dans cette version simple !
```

---

## Chapitre 11 : Mémoire Cache

### Q1. Pourquoi a-t-on besoin d'une mémoire cache ?

Pour combler l'**écart de vitesse** entre le CPU et la RAM :
- CPU : peut traiter une opération par cycle (< 1 ns)
- RAM : temps d'accès de 50-100 ns (50-100 cycles perdus !)

Le cache stocke les données récemment utilisées dans une mémoire très rapide (SRAM) proche du CPU.

### Q2. Qu'est-ce que la localité spatiale et temporelle ?

- **Localité temporelle** : Une donnée accédée récemment sera probablement réaccédée bientôt (ex: variables de boucle)
- **Localité spatiale** : Les données proches en mémoire sont souvent accédées ensemble (ex: éléments consécutifs d'un tableau)

Le cache exploite ces deux principes pour prédire quelles données garder.

### Q3. Quelle est la différence entre un cache direct-mapped et associatif ?

- **Direct-mapped** : Chaque adresse mémoire ne peut aller qu'à **un seul** emplacement du cache. Simple mais conflits fréquents.
- **Associatif (N-way)** : Chaque adresse peut aller dans **N emplacements** différents. Moins de conflits mais plus complexe.
- **Totalement associatif** : N'importe où dans le cache. Optimal mais coûteux.

### Q4. Que se passe-t-il lors d'un "cache miss" ?

1. La donnée demandée n'est pas dans le cache
2. Le CPU est mis en attente (stall)
3. La ligne de cache complète est chargée depuis la mémoire principale
4. Si le cache est plein, une ligne existante est évincée (et écrite en RAM si modifiée)
5. L'accès est réessayé (cache hit cette fois)

### Q5. Quelle est la différence entre write-through et write-back ?

- **Write-through** : Chaque écriture va **immédiatement** en cache ET en RAM. Simple mais lent.
- **Write-back** : Les écritures vont **seulement** au cache. La RAM est mise à jour seulement quand la ligne est évincée. Plus rapide mais plus complexe.

### Mini-défi : Optimisation de parcours de matrice

```c
// Version optimisée (parcours par lignes)
for (int i = 0; i < N; i = i + 1) {
    for (int j = 0; j < N; j = j + 1) {
        sum = sum + matrix[i][j];  // Accès séquentiels en mémoire
    }
}
```

En C, les matrices sont stockées **ligne par ligne** (row-major). Parcourir par lignes (i puis j) accède à des adresses consécutives → excellent pour le cache (localité spatiale).

Parcourir par colonnes (j puis i) saute de N éléments à chaque accès → très mauvais pour le cache.

---

## Chapitre 10bis : Débogage

Les solutions des exercices de débogage sont dans le chapitre lui-même, car ils font partie intégrante de l'apprentissage du débogage. Consultez les balises `<details>` dans le chapitre 10bis.

---

## Chapitre 12 : Interruptions

### Q1. Quelle est la différence entre une interruption matérielle et une exception ?

- **Interruption matérielle (IRQ)** : Déclenchée par un **périphérique externe** (timer, clavier, réseau) de manière asynchrone. Le CPU peut être interrompu à n'importe quel moment.
- **Exception** : Déclenchée par le **programme lui-même** lors d'une erreur ou condition spéciale (division par zéro, adresse invalide, instruction invalide). Synchrone avec l'exécution.

Les deux utilisent un mécanisme similaire (sauvegarde du contexte, saut à un handler), mais leur origine diffère.

### Q2. Pourquoi le polling est-il inefficace comparé aux interruptions ?

Le **polling** (attente active) gaspille des ressources :
1. Le CPU vérifie constamment l'état des périphériques
2. Cycles perdus même quand rien ne se passe
3. Latence variable (dépend de la fréquence de vérification)
4. Ne scale pas avec le nombre de périphériques

Les **interruptions** permettent au CPU de travailler normalement et d'être notifié instantanément quand un événement se produit.

### Q3. Que contient la table des vecteurs d'interruption (IVT) ?

L'IVT contient les **adresses des handlers** pour chaque type d'interruption :
- Chaque entrée est un pointeur vers la routine de service (ISR)
- Indexée par le numéro d'interruption
- Placée à une adresse fixe en mémoire (souvent 0x00000000)
- Permet au CPU de trouver rapidement le code à exécuter

Exemple : IRQ #6 → IVT[6] → adresse 0x00001600 → keyboard_handler

### Q4. Qu'est-ce qu'une race condition et comment l'éviter ?

Une **race condition** se produit quand deux threads/contextes accèdent à une variable partagée sans synchronisation, et le résultat dépend de l'ordre d'exécution.

```c
// Problème : interruption entre lecture et écriture
count = count + 1;  // LOAD, ADD, STORE (non atomique)
```

**Solutions** :
1. Désactiver les interruptions pendant l'accès critique
2. Utiliser des instructions atomiques (LDREX/STREX)
3. Utiliser des mutex/spinlocks

### Q5. Pourquoi est-il important que les handlers d'interruption soient courts ?

Plusieurs raisons :
1. **Latence** : D'autres IRQ sont bloquées pendant qu'un handler s'exécute
2. **Réactivité** : Un long handler dégrade la réponse du système
3. **Temps réel** : Les deadlines peuvent être manquées
4. **Pile IRQ** : Généralement petite, risque de débordement

**Bonne pratique** : Faire le minimum (flag, acquittement) et déférer le travail lourd au thread principal ou à une tâche dédiée.

### Q6. Expliquez le rôle de l'instruction RETI (ou équivalent).

RETI (Return from Interrupt) effectue :
1. **Restaure PC** : Depuis la valeur sauvegardée (LR_irq ou pile)
2. **Restaure les flags** : CPSR depuis SPSR
3. **Réactive les interruptions** : Clear le bit I si nécessaire
4. **Change de mode** : Retourne au mode utilisateur/système

C'est une instruction spéciale car elle modifie atomiquement PC et les flags, ce qu'une séquence normale ne pourrait pas faire.

### Q7. Qu'est-ce que le FIQ et pourquoi est-il plus rapide que l'IRQ ?

Le **FIQ** (Fast Interrupt Request) est une interruption haute priorité avec des optimisations :
1. **Registres banqués** : R8_fiq à R14_fiq sont séparés → pas besoin de PUSH/POP
2. **Vecteur en fin d'IVT** : Le handler peut être placé directement là (pas de saut)
3. **Priorité maximale** : Ne peut pas être interrompu par IRQ

Gain typique : 20+ cycles économisés au début/fin du handler.

### Exercice de réflexion

**Question** : Timer IRQ toutes les 1 ms, handler de 50 µs, latence réseau requise < 100 µs. Possible ?

**Analyse** :
- Période timer : 1000 µs
- Durée handler : 50 µs
- Temps entre handlers : 950 µs libres

Dans le **pire cas**, un événement réseau arrive juste après le début d'un handler timer :
- Attente : 50 µs (fin du handler timer)
- Latence totale : 50 µs < 100 µs ✓

**Conclusion** : Oui, c'est possible, mais de justesse. Si le handler timer prenait 100 µs, ce ne serait plus garanti.

Pour plus de marge, on pourrait :
- Rendre le timer handler interruptible (nested IRQ)
- Donner une priorité plus haute au réseau (FIQ)
- Réduire la durée du handler timer

### Exercice 1 : Timer Handler

```asm
.data
ticks:      .word 0
seconds:    .word 0

.text
timer_handler:
    PUSH {R0-R2, LR}

    ; Incrémenter ticks
    LDR R0, =ticks
    LDR R1, [R0]
    ADD R1, R1, #1

    ; Vérifier si 1000 ticks
    CMP R1, #1000
    B.LT .store_ticks

    ; Reset ticks et incrémenter seconds
    MOV R1, #0
    LDR R2, =seconds
    LDR R0, [R2]
    ADD R0, R0, #1
    STR R0, [R2]

.store_ticks:
    LDR R0, =ticks
    STR R1, [R0]

    ; Acquitter l'interruption
    LDR R0, =PIC_BASE
    MOV R1, #0x20           ; EOI
    STR R1, [R0, #EOI_OFFSET]

    POP {R0-R2, LR}
    SUBS PC, LR, #4         ; RETI
```

### Exercice 4 : Calcul de Latence

- LDM 8 registres : ~10 cycles (2 + 8 accès mémoire)
- Sauvegarde automatique : 3 cycles
- Fetch vecteur : 2 cycles
- PUSH 6 registres : ~8 cycles (2 + 6 accès)

**Latence totale** = 10 + 3 + 2 + 8 = **23 cycles**

À 100 MHz : 23 × 10 ns = **230 ns**

---

## Chapitre 13 : Concepts Avancés

### Q1. Quelle est la différence entre linking statique et dynamique ?

**Linking statique** :
- Tout le code des bibliothèques est copié dans l'exécutable
- Fichier volumineux mais autonome
- Pas de dépendance externe au runtime

**Linking dynamique** :
- L'exécutable contient des références aux bibliothèques (.so/.dll)
- Résolution au chargement ou à la première utilisation (lazy)
- Fichier petit, bibliothèques partagées entre programmes
- Mises à jour possibles sans recompiler

### Q2. Qu'est-ce que la table des symboles dans un fichier objet ?

La table des symboles liste tous les **noms** (fonctions, variables globales) du fichier :
- **Symboles définis** : Implémentés dans ce fichier (avec adresse)
- **Symboles indéfinis** : Référencés mais définis ailleurs (à résoudre par le linker)
- **Attributs** : Global/local, taille, type (fonction, donnée)

Le linker utilise cette table pour résoudre les références entre fichiers.

### Q3. Que fait le préprocesseur avec `#include` et `#define` ?

**`#include`** : Copie textuellement le contenu du fichier inclus à cet endroit.
```c
#include <stdio.h>   // Cherche dans /usr/include/
#include "myfile.h"  // Cherche dans le répertoire courant
```

**`#define`** : Définit une macro de substitution textuelle.
```c
#define MAX 100          // MAX → 100 partout
#define SQUARE(x) ((x)*(x))  // SQUARE(5) → ((5)*(5))
```

Ces opérations sont purement textuelles, avant la compilation.

### Q4. Expliquez le concept de "stack unwinding" lors d'une exception.

Le **stack unwinding** est le processus de recherche d'un handler :

1. Une exception est levée (throw)
2. Le runtime remonte la pile d'appels
3. Pour chaque fonction :
   - Vérifie s'il y a un catch compatible
   - Si non, appelle les destructeurs des objets locaux
   - Continue à remonter
4. Si un catch est trouvé, le contrôle y est transféré
5. Sinon, le programme termine (unhandled exception)

Ce processus garantit que les ressources sont libérées même en cas d'erreur.

### Q5. Quelle est la différence entre un processus et un thread ?

**Processus** :
- Espace mémoire isolé (protection MMU)
- Ressources propres (file descriptors, etc.)
- Communication via IPC (pipes, sockets, shared memory)
- Création coûteuse (fork)

**Thread** :
- Partage l'espace mémoire du processus parent
- Pile et registres propres uniquement
- Communication directe (variables partagées)
- Création légère
- Nécessite synchronisation (mutex)

### Q6. Qu'est-ce qu'une race condition et comment l'éviter ?

Une **race condition** se produit quand le résultat d'un programme dépend de l'ordre d'exécution de threads concurrents accédant à des données partagées.

```c
// Thread A et B exécutent simultanément :
counter++;  // LOAD → ADD → STORE (non atomique)
```

**Solutions** :
1. **Mutex** : Verrouiller l'accès aux données partagées
2. **Opérations atomiques** : Instructions indivisibles
3. **Thread-local storage** : Chaque thread a sa copie
4. **Immutabilité** : Données qui ne changent pas
5. **Message passing** : Pas de mémoire partagée

### Q7. Qu'est-ce qu'un deadlock ? Donnez les quatre conditions nécessaires.

Un **deadlock** est une situation où deux ou plusieurs threads s'attendent mutuellement indéfiniment.

Les **quatre conditions** (Coffman) :
1. **Exclusion mutuelle** : La ressource ne peut être utilisée que par un thread à la fois
2. **Hold and wait** : Un thread garde une ressource tout en attendant une autre
3. **Pas de préemption** : Les ressources ne peuvent pas être retirées de force
4. **Attente circulaire** : A attend B, B attend C, C attend A

Pour éviter les deadlocks, éliminer l'une de ces conditions (souvent l'attente circulaire via un ordre d'acquisition fixe).

### Q8. Pourquoi les opérations atomiques sont-elles nécessaires pour les mutex ?

L'acquisition d'un mutex doit être **atomique** (indivisible) pour éviter que deux threads ne l'acquièrent simultanément :

```c
// MAUVAIS (non atomique) :
if (lock == 0) {    // Thread A lit 0
    lock = 1;       // Thread B lit aussi 0 avant A n'écrive !
}
// Les deux threads croient avoir le lock !

// BON (atomique) :
// Test-and-Set en une seule instruction
if (atomic_exchange(&lock, 1) == 0) {
    // Lock acquis
}
```

Les instructions comme `LDREX/STREX` (ARM) ou `CMPXCHG` (x86) garantissent l'atomicité.

### Exercice 2 : Linking Manuel

1. `gcc -c main.c -c math.c` crée main.o et math.o
2. `nm main.o` montre : `main (T)`, `add (U)` (undefined)
3. `nm math.o` montre : `add (T)` (text/defined)
4. `ld main.o math.o -o prog` échoue car :
   - `_start` manque (point d'entrée standard)
   - Pas de code d'initialisation C (crt0)
   - Pas de libc (exit, etc.)

**Solution** : Utiliser gcc pour le link final qui ajoute automatiquement crt0.o et -lc.

### Exercice 3 : Exceptions en C

```c
#include <setjmp.h>

static jmp_buf __exception_env;
static int __exception_code;

#define TRY if (setjmp(__exception_env) == 0)
#define CATCH(code) else { int code = __exception_code;
#define END_TRY }
#define THROW(code) do { __exception_code = (code); longjmp(__exception_env, 1); } while(0)

// Utilisation :
TRY {
    if (error) THROW(42);
    do_work();
} CATCH(code) {
    printf("Exception %d\n", code);
} END_TRY;
```

**Limitation** : Ne gère qu'un niveau de try/catch. Pour le nesting, utiliser une pile de jmp_buf.

### Exercice 5 : Détection de Deadlock

```
Thread A : lock(m1) → lock(m2)
Thread B : lock(m2) → lock(m3)
Thread C : lock(m3) → lock(m1)
```

**Graphe de dépendance** :
```
m1 ──→ m2 ──→ m3
 ↑            │
 └────────────┘
```

**Oui, deadlock possible** si :
- A acquiert m1, attend m2
- B acquiert m2, attend m3
- C acquiert m3, attend m1 (cycle !)

**Solution** : Ordre fixe d'acquisition. Toujours acquérir dans l'ordre m1 → m2 → m3.

```c
void* thread_c(void* arg) {
    lock(&m1); lock(&m3);  // m1 AVANT m3 maintenant
    work();
    unlock(&m3); unlock(&m1);
}
```
