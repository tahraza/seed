# Annexe : Tous les Exercices

Cette annexe contient les enonces de tous les exercices disponibles sur le simulateur web.

---

## A. Exercices HDL (Portes Logiques)

Ces exercices construisent progressivement un ordinateur a partir de la porte NAND.

### Projet 1 : Portes de Base

| Exercice | Description |
|:---------|:------------|
| Inv | Inverseur (NOT) : `Inv(a) = Nand(a, a)` |
| And2 | Porte AND : `And2(a,b) = Inv(Nand(a,b))` |
| Or2 | Porte OR : `Or2(a,b) = Nand(Inv(a), Inv(b))` |
| Xor2 | Porte XOR : `Xor2(a,b) = Or2(And2(a, Inv(b)), And2(Inv(a), b))` |
| Mux | Multiplexeur : si sel=0 alors y=a sinon y=b |
| DMux | Demultiplexeur : distribue x vers a ou b selon sel |

### Projet 2 : Arithmetique

| Exercice | Description |
|:---------|:------------|
| HalfAdder | Demi-additionneur : sum = a XOR b, carry = a AND b |
| FullAdder | Additionneur complet avec retenue entrante |
| Add32 | Additionneur 32 bits (ripple carry) |
| Inc32 | Incrementeur : ajoute 1 a l'entree |
| Alu32 | ALU 32 bits avec 6 operations |

### Projet 3 : Memoire

| Exercice | Description |
|:---------|:------------|
| DFF | D Flip-Flop (fourni) |
| Bit | Registre 1 bit avec load |
| Register | Registre 32 bits |
| RAM8 | 8 registres avec adressage 3 bits |
| RAM64 | 64 registres avec adressage 6 bits |
| PC | Compteur de programme avec inc/load/reset |

### Projet 5 : CPU

| Exercice | Description |
|:---------|:------------|
| CPU | Processeur complet A32 |

### Projet 6 : CPU Pipeline (Avance)

Ces exercices construisent un CPU pipeline 5 etages avec gestion des aleas.

| Exercice | Description |
|:---------|:------------|
| IF_ID_Reg | Registre pipeline IF/ID avec stall et flush |
| HazardDetect | Detection des aleas load-use |
| ForwardUnit | Bypass des donnees (forwarding) |
| CPU_Pipeline | CPU pipeline 5 etages complet |

### Projet 7 : Cache L1

Ces exercices implementent un cache memoire direct-mapped.

| Exercice | Description |
|:---------|:------------|
| CacheLine | Ligne de cache (valid, dirty, tag, data) |
| TagCompare | Comparateur de tags pour detecter hit/miss |
| WordSelect | Selecteur de mot dans une ligne de 128 bits |
| CacheController | Machine a etats (IDLE, FETCH, WRITEBACK) |

### Projet 8 : Capstone - L'Ordinateur Complet 🎮

C'est l'aboutissement du projet Nand2Tetris ! Assemblez toutes les pieces construites depuis le debut.

| Exercice | Description |
|:---------|:------------|
| ROM32K | Memoire programme (comme une cartouche Game Boy !) |
| Computer | L'ordinateur complet : ROM + CPU + RAM connectes |

**🎮 L'analogie de la Game Boy :**

La ROM32K est comme une cartouche de jeu qu'on insere dans une console :
- La **cartouche** (ROM) contient votre programme compile
- La **console** (CPU) lit et execute les instructions
- La **memoire de travail** (RAM) stocke les donnees du jeu

**Le flux de compilation complet :**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Code C             Assembleur           Binaire           │
│   snake.c    ───►    snake.a32    ───►   snake.bin         │
│                                              │              │
│   int main() {       MOV R0, #42          01001010         │
│     return 42;       MOV PC, LR           11100001         │
│   }                                          │              │
│                                              ▼              │
│                                     ┌──────────────┐        │
│                                     │   Computer   │        │
│                                     │              │        │
│                                     │ ROM ──► CPU  │        │
│                                     │         │    │        │
│                                     │         ▼    │        │
│                                     │        RAM   │        │
│                                     └──────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Outils de compilation :**

```bash
# 1. Compiler C vers Assembleur
./c32_cli snake.c -o snake.a32

# 2. Assembler vers Binaire
./a32_cli snake.a32 -o snake.bin

# 3. Executer sur le simulateur
./c32_runner snake.c
```

**Dans l'interface web HDL :**

```
load Computer
romload 0x0100 0x0211 0x0322   // Charge les instructions
set reset 1
tick
tock
set reset 0
// ... le CPU execute automatiquement !
```

**Exemple concret : le jeu Snake**

Le fichier `demos/04_snake/snake.c` contient un vrai jeu Snake en C.
Quand vous le compilez :
1. `c32_cli` transforme le C en ~2000 lignes d'assembleur
2. `a32_cli` assemble en ~8000 octets de code machine
3. Ce binaire est charge dans la ROM
4. Le CPU lit et execute chaque instruction

C'est exactement ce qui se passe quand vous inserez une cartouche
dans une Game Boy et appuyez sur Power !

---

## B. Exercices Assembleur A32

Ces exercices enseignent la programmation en assembleur A32.

### Bases

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Hello World | Charger 42 dans R0 | R0 = 42 |
| Addition | Calculer 15 + 27 | R0 = 42 |
| Soustraction | Calculer 100 - 58 | R0 = 42 |
| Logique | 0xFF AND 0x0F | R0 = 15 |
| Doubler | 21 * 2 sans MUL | R0 = 42 |

### Controle de Flux

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Conditions | Maximum de 25 et 17 | R0 = 25 |
| Valeur Absolue | Calculer |-42| | R0 = 42 |
| Boucles | Somme 1 + 2 + ... + 10 | R0 = 55 |
| Multiplication | 6 * 7 par additions | R0 = 42 |
| Fibonacci | Calculer F(10) | R0 = 55 |

### Memoire

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Tableaux | Somme de {10, 20, 30, 40, 50} | R0 = 150 |
| Maximum Tableau | Max de {12, 45, 7, 89, 23} | R0 = 89 |
| Memoire | Store puis Load | R0 = 30 |

### Structures

Ces exercices preparent aux structs en C en montrant comment les donnees structurees sont organisees en memoire.

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Structure Simple | Lire champs d'un Point (x+y) | R0 = 42 |
| Initialiser Structure | Ecrire dans les champs d'un Point | R0 = 42 |
| Structure Rectangle | Structure avec 4 champs, calcul aire | R0 = 42 |
| Tableau de Structures | Parcourir tableau de Points, somme des x | R0 = 33 |
| Somme x+y Structures | Acceder aux deux champs de chaque Point | R0 = 42 |

### Fonctions

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Fonctions | Fonction double(21) | R0 = 42 |
| Fonction Add3 | add3(10, 15, 17) | R0 = 42 |

### Entrees/Sorties

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Ecrire Caractere | Ecrire 'A' a PUTC | R0 = 65 |
| Hello String | Afficher "Hi" | R0 = 2 |
| Print Loop | Afficher "ABCD" avec boucle | R0 = 4 |

### Ecran (320x240, 1 bit/pixel)

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Pixel | Allumer pixel (0,0) | R0 = 0x80 |
| Ligne Horizontale | 8 pixels horizontaux | R0 = 0xFF |
| Ligne Verticale | 8 pixels verticaux | R0 = 8 |
| Rectangle | Carre 8x8 | R0 = 8 |
| Damier | Motif en damier | R0 = 8 |

### Jeux Interactifs

| Exercice | Objectif |
|:---------|:---------|
| Lire Caractere | Lire clavier et convertir ASCII |
| Lire 2 Chiffres | Former un nombre a 2 chiffres |
| Deviner Nombre | Jeu de devinette (secret = 7) |
| Degrade | Effet dithering sur ecran |
| Recherche Dichotomique | Trouver 42 en 7 essais |

### Cache (Patterns d'Acces Memoire)

Ces exercices illustrent l'impact des patterns d'acces memoire sur les performances cache.

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Acces Sequentiel | Parcours cache-friendly (adresses consecutives) | R0 = 100 |
| Acces avec Stride | Parcours avec sauts de 16 bytes (moins efficace) | R0 = 28 |
| Reutilisation Registre | Charger une fois, reutiliser plusieurs fois | R0 = 91 |

---

## C. Exercices C32

Ces exercices enseignent la programmation en C32.

### Bases

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Variables | x=10, y=32, retourner x+y | 42 |
| Expressions | (5+3)*(10-4)/2 | 24 |
| Modulo | (100%7) + (45%8) | 7 |
| Incrementation | 5 -> +3 -> *2 -> -1 | 15 |

### Conditions

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Conditions | Maximum de 25 et 17 | 25 |
| Else-If | Classifier note 75 | 3 |
| Operateurs Logiques | 15 dans [10,20] ? | 1 |
| Maximum de 3 | Max de 15, 42, 27 | 42 |

### Boucles

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Boucle For | Somme 1 a 10 | 55 |
| Boucle While | Compter chiffres de 12345 | 5 |
| Boucles Imbriquees | Double boucle i*j | 60 |
| Multiplication | 7*8 sans operateur * | 56 |

### Fonctions

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Fonctions | square(7) | 49 |
| Parametres Multiples | add3(10, 20, 12) | 42 |
| Valeur Absolue | abs(-15) + abs(10) | 25 |
| Min et Max | max(10,25) - min(10,25) | 15 |

### Tableaux

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Tableaux | Somme de {3,7,2,9,5} | 26 |
| Maximum Tableau | Max de 6 elements | 56 |
| Compter Elements | Nombres pairs | 4 |

### Pointeurs

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Pointeurs | Modifier via *p | 42 |
| Swap | Echanger x et y | 20 |
| Pointeurs et Tableaux | Somme avec *(p+i) | 50 |

### Operations Binaires

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Operations Binaires | (10&12) | (10^12) | 14 |
| Puissance de 2 | is_pow2(16)+is_pow2(15)+is_pow2(32) | 2 |

### Recursion

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Factorielle | fact(5) | 120 |
| Fibonacci | fib(10) | 55 |
| Somme Recursive | sum(10) | 55 |

### Algorithmes Avances

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| PGCD (Euclide) | gcd(48, 18) | 6 |
| Puissance | power(2, 10) | 1024 |
| Test Primalite | Premiers <= 20 | 8 |
| Tri a Bulles | Trier et retourner min | 12 |
| Recherche Binaire | Trouver 23 dans tableau | 5 |
| Inverser Tableau | Inverser {1,2,3,4,5} | 35 |
| Somme Chiffres | digit_sum(12345) | 15 |
| Palindrome | 12321 + 1221 + 123 | 2 |

### Structures

Les structures permettent de regrouper plusieurs variables liees.

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Definition Struct | struct Point, p.x + p.y | 42 |
| Pointeur Struct | Utiliser l'operateur -> | 42 |
| Struct et Fonctions | distance_sq(Point*) | 25 |
| Structs Imbriquees | Rectangle avec Point | 42 |
| Tableau de Structs | Point[3], somme des x | 33 |
| Sizeof Struct | Taille des structures | 16 |

### Cache (Patterns d'Acces Memoire)

Ces exercices illustrent l'impact de la localite sur les performances cache.

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Parcours en Ligne | Parcours row-major (cache-friendly) | 120 |
| Parcours en Colonne | Parcours column-major (moins efficace) | 120 |
| Traitement par Blocs | Technique de blocking | 120 |
| Localite Temporelle | Reutiliser les donnees en cache | 30 |

### Entrees/Sorties

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Ecrire Caractere | putchar(65) | 65 |
| Afficher Chaine | print("HI") | 2 |
| Afficher Nombre | print_int(42) | 42 |
| Dessiner Pixel | Pixel (0,0) | 128 |
| Ligne Horizontale | 16 pixels | 16 |
| Dessiner Rectangle | Carre 8x8 | 64 |

### Projets Avances

| Exercice | Objectif | Resultat |
|:---------|:---------|:---------|
| Crible Eratosthene | Premiers <= 50 | 15 |
| Suite Collatz | Longueur pour n=27 | 112 |
| Projet Final | Diviseurs de 28 | 28 |

---

## D. Construction du Compilateur

Ces exercices construisent progressivement un compilateur C -> A32.

### Phase 1 : Lexer

| Exercice | Description |
|:---------|:------------|
| 1.1 Reconnaitre Chiffre | `is_digit(c)` : retourne 1 si '0'-'9' |
| 1.2 Lire Nombre | `parse_number(s, pos)` : extrait un entier |
| 1.3 Identifier Tokens | `next_token()` : retourne type du token |

### Phase 2 : Parser

| Exercice | Description |
|:---------|:------------|
| 2.1 Evaluer a + b | Parser et calculer une operation |
| 2.2 Evaluer a + b + c | Chaine d'operations gauche a droite |
| 2.3 Precedence | Descente recursive : `*` avant `+` |
| 2.4 Parentheses | Supporter `(2 + 3) * 4` |

### Phase 3 : Emission ASM

| Exercice | Description |
|:---------|:------------|
| 3.1 Generer MOV | Produire `"MOV R0, #42"` |
| 3.2 Operation Binaire | Mapper `+` -> `ADD`, `*` -> `MUL` |
| 3.3 Comparaison | Generer `CMP` et conditions |

### Phase 4 : CodeGen Expressions

| Exercice | Description |
|:---------|:------------|
| 4.1 Constante -> A32 | Code pour charger une constante |
| 4.2 Addition -> A32 | `a + b` -> `MOV/MOV/ADD` |
| 4.3 Expression -> A32 | Expression complete avec precedence |

### Phase 5 : Structures de Controle

| Exercice | Description |
|:---------|:------------|
| 5.1 If/Else -> A32 | Sauts conditionnels et labels |
| 5.2 While -> A32 | Boucles avec labels |

### Phase 6 : Fonctions

| Exercice | Description |
|:---------|:------------|
| 6.1 Prologue/Epilogue | Sauvegarder LR, reserver pile |
| 6.2 Appel de Fonction | Arguments et BL |

### Phase 7 : Projet Final

| Exercice | Description |
|:---------|:------------|
| 7.1 Mini-Compilateur | Compiler expression en A32 executable |

---

## E. Systeme d'Exploitation

Ces exercices introduisent les concepts OS.

### Initialisation

| Exercice | Description | Resultat |
|:---------|:------------|:---------|
| Bootstrap | Initialiser SP, effacer BSS, appeler main | 42 |

### Gestion Memoire

| Exercice | Description | Resultat |
|:---------|:------------|:---------|
| Bump Allocator | Allocation simple par incrementation | 100 |
| Free List | Allocateur avec liberation | 1 |

### Drivers

| Exercice | Description | Resultat |
|:---------|:------------|:---------|
| Driver Ecran | Fonctions set_pixel, clear_screen | 4 |
| Police Bitmap | Dessiner caracteres 8x8 | 51 |

### Console et Clavier

| Exercice | Description | Resultat |
|:---------|:------------|:---------|
| Console | Console texte avec curseur (40x30) | 1 |
| Driver Clavier | Lire les touches, buffer clavier | 3 |

### Shell et Applications

| Exercice | Description | Resultat |
|:---------|:------------|:---------|
| Shell | Interpreteur de commandes basique | 1 |
| Calculatrice | Evaluer expressions arithmetiques | 42 |
| Variables Shell | Variables dans le shell ($x, $y) | 15 |
| Compte a Rebours | Timer avec affichage | 0 |

### Multitache

| Exercice | Description | Resultat |
|:---------|:------------|:---------|
| Interruptions | Gestion des interruptions timer | 10 |
| Coroutines | Changement de contexte manuel | 2 |
| Scheduler | Ordonnanceur round-robin | 6 |

### Projets OS

| Exercice | Description |
|:---------|:------------|
| Projet 1: Mini-OS Shell | Shell complet avec commandes |
| Projet 2: Task Manager | Gestionnaire de taches multiples |

---

## Conseils pour les Exercices

1. **Commencez simple** : Les premiers exercices de chaque section sont accessibles
2. **Lisez l'enonce** : Chaque exercice contient des indices
3. **Testez souvent** : Le simulateur execute votre code instantanement
4. **Consultez les solutions** : Apres avoir essaye, comparez avec la solution
5. **Progressez** : Chaque exercice prepare le suivant

---

**Bon courage !**
