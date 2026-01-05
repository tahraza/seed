# L'Architecture Codex : Guide de l'Étudiant

Ce livre accompagne le projet **Nand2Tetris-Codex**. Il a pour but de vous guider pas à pas dans la construction d'un ordinateur complet, moderne et 32-bits, à partir de rien.

## Table des Matières

1.  **[Introduction](00_introduction.md)**
    *   La philosophie du projet.
    *   Différences avec le Hack (Nand2Tetris original).
    *   Présentation des outils.

2.  **[Chapitre 1 : Logique Booléenne](01_logique_booleenne.md)**
    *   L'abstraction binaire.
    *   Les portes logiques fondamentales (Nand, And, Or, Xor).
    *   *Exercices :* Implémentation dans `hdl_lib/01_gates`.

3.  **[Chapitre 2 : Arithmétique Binaire](02_arithmetique.md)** *(À venir)*
    *   Représentation des nombres (Complément à 2).
    *   Additionneurs et ALU (Arithmetic Logic Unit).
    *   *Exercices :* `hdl_lib/03_arith`.

4.  **[Chapitre 3 : Logique Séquentielle et Mémoire](03_memoire.md)** *(À venir)*
    *   Le temps et l'horloge.
    *   Flip-Flops, Registres et RAM.
    *   *Exercices :* `hdl_lib/04_seq` & `02_multibit`.

5.  **[Chapitre 4 : Architecture Machine (ISA A32)](04_architecture.md)** *(À venir)*
    *   Le jeu d'instructions A32-Lite.
    *   Registres, adressage et structure.
    *   *Référence :* `SPECS.md`.

6.  **[Chapitre 5 : Le Processeur (CPU)](05_cpu.md)** *(À venir)*
    *   Implémentation du chemin de données (Data Path).
    *   Logique de contrôle.
    *   *Exercices :* `hdl_lib/05_cpu`.

7.  **[Chapitre 6 : L'Assembleur](06_assembleur.md)** *(À venir)*
    *   Traduction symbolique vers binaire.
    *   Gestion des symboles et des labels.
    *   *Outils :* `a32_asm`.

8.  **[Chapitre 7 : Construction du Compilateur](07_compilateur.md)** *(À venir)*
    *   Analyse lexicale et syntaxique (Parsing).
    *   Génération de code pour pile.
    *   *Outils :* `c32_cli`.

9.  **[Chapitre 8 : Langage de Haut Niveau (C32)](08_langage.md)** *(À venir)*
    *   Syntaxe du langage C32.
    *   Structures de contrôle et types.

10. **[Chapitre 9 : Système d'Exploitation](09_os.md)** *(À venir)*
    *   Gestion de la mémoire (Heap).
    *   Entrées/Sorties (Clavier, Écran).
    *   *Exercices :* `os_lib`.

## Comment utiliser ce guide

Chaque chapitre commence par une **Théorie**, expliquant les concepts fondamentaux. Ensuite, la section **Implémentation** détaille ce que vous devez construire, en faisant référence aux dossiers du projet.

> **Note :** Ce projet utilise Rust pour l'outillage, mais votre travail consistera principalement à écrire du HDL (Hardware Description Language), de l'assembleur A32 et du C32.
