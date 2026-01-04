# Documentation Pédagogique nand2tetris-codex

Bienvenue dans la documentation pédagogique du projet nand2tetris-codex !

## 🎯 Objectif

Ce projet permet aux étudiants de comprendre l'informatique de bas en haut :
- Des portes logiques au processeur
- De l'assembleur au compilateur
- Du bare metal au système d'exploitation

## 📚 Structure

```
docs/
├── 01_architecture/     # Comprendre le CPU A32-Lite
├── 02_assembleur/       # Programmer en assembleur
├── 03_compilateur/      # Construire un compilateur
├── 04_os/               # Créer un mini-OS
└── exercices/           # Travaux pratiques
    ├── niveau1_asm/
    ├── niveau2_compilateur/
    └── niveau3_os/
```

## 🗺️ Parcours recommandé

### Semaine 1-2 : Architecture
1. [Vue d'ensemble](01_architecture/overview.md)
2. Jeu d'instructions
3. Carte mémoire

### Semaine 3-4 : Assembleur
1. Premier programme
2. Structures de contrôle
3. Fonctions

### Semaine 5-8 : Compilateur
1. [Lexer](03_compilateur/01_lexer.md)
2. [Parser](03_compilateur/02_parser.md)
3. [AST](03_compilateur/03_ast.md)
4. [Génération de code](03_compilateur/04_codegen.md)
5. [Optimisations](03_compilateur/05_optimisations.md)

### Semaine 9-12 : Système d'exploitation
1. [Bare Metal](04_os/01_bare_metal.md)
2. [Bootstrap](04_os/02_bootstrap.md)
3. [Allocateur](04_os/03_allocateur.md)
4. [Drivers](04_os/04_drivers.md)
5. [Shell](04_os/05_shell.md)

## 🎮 Démos

Des programmes d'exemple sont disponibles dans `demos/` :

| Démo | Description | Concepts |
|------|-------------|----------|
| [hello](../demos/01_hello/) | Hello World | I/O, chaînes |
| [fibonacci](../demos/02_fibonacci/) | Suite de Fibonacci | Récursion, boucles |
| [graphics](../demos/03_graphics/) | Dessins graphiques | Framebuffer, algorithmes |
| [snake](../demos/04_snake/) | Jeu Snake | Game loop, clavier |
| [shell](../demos/05_shell/) | Mini shell | Parsing, REPL |

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
