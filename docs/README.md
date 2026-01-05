# Documentation Pedagogique nand2tetris-codex

Bienvenue dans la documentation pedagogique du projet nand2tetris-codex !

## Objectif

Ce projet permet aux etudiants de comprendre l'informatique de bas en haut :
- Des portes logiques au processeur
- De l'assembleur au compilateur
- Du bare metal au systeme d'exploitation

## Structure

```
docs/
├── 00_hdl/              # Conception de chips (HDL)
├── 01_architecture/     # Comprendre le CPU A32-Lite
├── 02_assembleur/       # Programmer en assembleur
├── 03_compilateur/      # Construire un compilateur
├── 04_os/               # Creer un mini-OS
├── 05_timer_interrupts/ # Timer, interruptions, multitache
└── exercices/           # Travaux pratiques
    ├── niveau1_asm/
    ├── niveau2_compilateur/
    └── niveau3_os/
```

## Parcours recommande

### HDL : Conception de Chips (6 semaines)
Du NAND au CPU complet en 5 projets.
1. [Progression HDL](00_hdl/PROGRESSION.md)
   - P1: Portes de base (Not, And, Or, Xor, Mux, DMux)
   - P2: Portes multi-bits (16/32 bits)
   - P3: Arithmetique (Adders, ALU32)
   - P4: Sequentiel (DFF, Register, RAM)
   - P5: CPU A32

### Assembleur (2 semaines)
Programmer en langage machine.
1. [Vue d'ensemble](01_architecture/overview.md)
2. Jeu d'instructions
3. Carte memoire

### Compilateur (4 semaines)
Construire un compilateur C.
1. [Lexer](03_compilateur/01_lexer.md)
2. [Parser](03_compilateur/02_parser.md)
3. [AST](03_compilateur/03_ast.md)
4. [Generation de code](03_compilateur/04_codegen.md)
5. [Optimisations](03_compilateur/05_optimisations.md)

### Systeme d'exploitation (4 semaines)
Du bare metal au shell.
1. [Bare Metal](04_os/01_bare_metal.md)
2. [Bootstrap](04_os/02_bootstrap.md)
3. [Allocateur](04_os/03_allocateur.md)
4. [Drivers](04_os/04_drivers.md)
5. [Shell](04_os/05_shell.md)

### Multitache (2 semaines)
Timer, interruptions, scheduler.
1. [Timer Hardware](05_timer_interrupts/01_timer.md)
2. [Interruptions](05_timer_interrupts/02_interrupts.md)
3. [Coroutines](05_timer_interrupts/03_coroutines.md)
4. [Scheduler Preemptif](05_timer_interrupts/04_scheduler_preemptif.md)

## 🎮 Démos

Des programmes d'exemple sont disponibles dans `demos/` :

| Démo | Description | Concepts |
|------|-------------|----------|
| [hello](../demos/01_hello/) | Hello World | I/O, chaînes |
| [fibonacci](../demos/02_fibonacci/) | Suite de Fibonacci | Récursion, boucles |
| [graphics](../demos/03_graphics/) | Dessins graphiques | Framebuffer, algorithmes |
| [snake](../demos/04_snake/) | Jeu Snake | Game loop, clavier |
| [shell](../demos/05_shell/) | Mini shell | Parsing, REPL |
| [coroutines](../demos/06_coroutines/) | Multitâche coopératif | Scheduler, yield |
| [scheduler](../demos/07_scheduler/) | Timer et interruptions | MMIO, polling |

## 📝 Exercices

Trois niveaux de difficulté :

### Niveau 1 : Assembleur ⭐
10 exercices pour maîtriser l'assembleur A32.
[Commencer →](exercices/niveau1_asm/README.md)

### Niveau 2 : Compilateur ⭐⭐
10 exercices + projet Mini-C.
[Commencer →](exercices/niveau2_compilateur/README.md)

### Niveau 3 : OS ⭐⭐⭐
10 exercices + projet Mini-OS.
[Commencer →](exercices/niveau3_os/README.md)

## 🛠️ Outils

### Assembleur A32
```bash
a32 programme.a32 -o programme.a32b
```

### Simulateur
```bash
a32-run programme.a32b
```

### Compilateur C32
```bash
c32 programme.c -o programme.a32
a32 programme.a32 -o programme.a32b
a32-run programme.a32b
```

### Simulateur HDL
```bash
hdl-sim design.hdl -t tests.tst
```

## 📖 Philosophie

Ce projet suit la philosophie nand2tetris :

1. **Verticalité** : Comprendre chaque couche, du matériel au logiciel
2. **Minimalisme** : Juste assez pour comprendre l'essentiel
3. **Pratique** : Apprendre en construisant
4. **Autonomie** : Tout implémenter soi-même

## 🤝 Contribution

Les contributions sont bienvenues ! Voir le README principal du projet.

## 📄 Licence

Ce projet est à but éducatif.
