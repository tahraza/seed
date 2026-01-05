# Introduction

Bienvenue dans le projet **Codex**. Si vous lisez ceci, c'est que vous avez l'ambition de comprendre comment fonctionnent les ordinateurs — non pas en lisant des théories abstraites, mais en en construisant un vous-même, de zéro.

## Le Mystère de l'Ordinateur

Prenez un instant pour réfléchir à ce qui se passe quand vous tapez une lettre sur votre clavier :

1. Vos doigts appuient sur une touche physique
2. Un signal électrique est envoyé
3. Ce signal est transformé en code numérique
4. Le processeur le détecte et l'interprète
5. Un programme décide quoi faire de cette information
6. Des pixels s'allument sur votre écran pour afficher la lettre

Entre votre doigt et le pixel, il y a des **dizaines de couches d'abstraction**. Chaque couche fait confiance à celle en dessous et simplifie la vie de celle au-dessus.

Ce livre va vous faire traverser **toutes ces couches**, de la plus basse (les portes logiques) à la plus haute (les applications).

## Pourquoi Construire un Ordinateur ?

### Le problème de la "boîte noire"

Dans notre vie quotidienne, l'ordinateur est une "boîte noire". Nous tapons sur un clavier, touchons un écran, et la magie opère. En tant qu'ingénieurs logiciels, nous travaillons souvent sur des couches d'abstraction très élevées (Python, Java, React).

Cette abstraction est une bénédiction pour la productivité, mais elle crée un **fossé de compréhension**. Combien de développeurs savent vraiment :
- Comment le processeur exécute leur code ?
- Pourquoi certaines opérations sont rapides et d'autres lentes ?
- Ce qui se passe quand on écrit `x = 5` ?
- Comment une image apparaît à l'écran ?

### L'approche "Du NAND au Tetris"

Ce projet a pour but de **briser l'abstraction**. Nous allons descendre au niveau le plus bas — la porte logique — et remonter couche par couche jusqu'à pouvoir jouer à un jeu vidéo écrit dans un langage de haut niveau sur notre propre machine.

À la fin de ce parcours, quand vous verrez du code s'exécuter, vous saurez **exactement** ce qui se passe dans la machine. Ce n'est plus de la magie — c'est de l'ingénierie que vous maîtrisez.

## Ce que Vous Allez Construire

Voici les couches que nous allons traverser, de bas en haut :

```
┌─────────────────────────────────────────────────────────────────┐
│                     COUCHE 7: Applications                       │
│              (Jeux, Shell, Calculatrice, Éditeur)                │
│                                                                  │
│   C'est ce que l'utilisateur voit et utilise. Tout le reste     │
│   n'existe que pour rendre cette couche possible.                │
├─────────────────────────────────────────────────────────────────┤
│                  COUCHE 6: Système d'Exploitation                │
│           (Gestion mémoire, Drivers écran/clavier)               │
│                                                                  │
│   L'OS cache la complexité du matériel. Au lieu de manipuler    │
│   des adresses, on appelle draw_pixel() ou read_key().          │
├─────────────────────────────────────────────────────────────────┤
│                 COUCHE 5: Langage de Haut Niveau (C32)           │
│                    (Variables, fonctions, boucles)               │
│                                                                  │
│   On écrit du code lisible par un humain. Le compilateur        │
│   le transforme en instructions machine.                         │
├─────────────────────────────────────────────────────────────────┤
│                      COUCHE 4: Compilateur                       │
│               (Transforme C32 → Assembleur A32)                  │
│                                                                  │
│   Le compilateur est un traducteur automatique. Il comprend     │
│   votre intention et génère le code équivalent.                  │
├─────────────────────────────────────────────────────────────────┤
│                   COUCHE 3: Assembleur (A32 ASM)                 │
│               (Mnémoniques → Code machine binaire)               │
│                                                                  │
│   L'assembleur traduit les instructions humainement lisibles    │
│   (ADD, MOV) en suites de 0 et de 1 que le CPU comprend.        │
├─────────────────────────────────────────────────────────────────┤
│                 COUCHE 2: Architecture Machine (ISA)             │
│          (Jeu d'instructions, Registres, Mémoire)                │
│                                                                  │
│   C'est le "contrat" entre le matériel et le logiciel.          │
│   Il définit ce que le processeur sait faire.                    │
├─────────────────────────────────────────────────────────────────┤
│                    COUCHE 1: Logique Matérielle                  │
│               (Portes logiques, ALU, RAM, CPU)                   │
│                                                                  │
│   Des circuits électroniques qui ne connaissent que 0 et 1,     │
│   mais qui, combinés intelligemment, peuvent tout calculer.      │
├─────────────────────────────────────────────────────────────────┤
│                     COUCHE 0: La Porte NAND                      │
│                    (Notre axiome de départ)                      │
│                                                                  │
│   Tout commence ici. Une seule porte logique, et à partir       │
│   d'elle, nous construisons tout le reste.                       │
└─────────────────────────────────────────────────────────────────┘
```

### La beauté de l'abstraction

Chaque couche a une propriété remarquable : **elle n'a besoin de connaître que la couche juste en dessous**.

- Le programmeur C32 n'a pas besoin de savoir comment fonctionne l'ALU
- L'ALU n'a pas besoin de savoir qu'elle va être utilisée pour un jeu vidéo
- La porte NAND ne "sait" pas qu'elle fait partie d'un ordinateur

Cette séparation des préoccupations est ce qui rend possible la construction de systèmes complexes.

## Codex vs Hack (Nand2Tetris Original)

Ce cours est fortement inspiré du légendaire "Nand2Tetris" de Noam Nisan et Shimon Schocken. Cependant, l'ordinateur *Hack* original a été conçu pour une simplicité maximale, parfois au détriment du réalisme moderne.

L'ordinateur **Codex** propose une approche différente :

| Caractéristique | Hack (Original) | Codex (Ce projet) |
| :--- | :--- | :--- |
| **Architecture** | 16-bits | **32-bits** |
| **Registres** | 2 (A et D) | **16 (R0-R15)** style ARM |
| **Mémoire** | Séparée (Harvard) | **Unifiée** (Von Neumann) |
| **Instructions** | Simple, propriétaire | **RISC moderne** (Load/Store) |
| **Écran** | Monochrome fixe | **320×240 couleurs** |

### Pourquoi ces changements ?

1. **32 bits** : C'est la taille standard des machines modernes (avant 64 bits). Cela permet d'adresser 4 Go de mémoire et de manipuler des nombres plus grands.

2. **16 registres** : Les processeurs ARM (smartphones, Raspberry Pi) utilisent aussi des registres R0-R15. Comprendre Codex, c'est comprendre ARM.

3. **Architecture RISC** : Les instructions sont simples et régulières. Le CPU fait une chose à la fois, mais le fait vite.

4. **Load/Store** : Le CPU ne calcule jamais directement en mémoire. Il charge d'abord les données dans des registres, calcule, puis stocke le résultat. C'est plus simple à implémenter et à comprendre.

## Ce que Vous Allez Apprendre

À la fin de ce livre, vous saurez :

**Au niveau matériel :**
- Comment construire des portes logiques à partir de NAND
- Comment un additionneur transforme des bits en nombres
- Comment la mémoire "se souvient" des données
- Comment le CPU orchestre tout cela

**Au niveau logiciel :**
- Comment l'assembleur traduit les mnémoniques en binaire
- Comment un compilateur transforme du code lisible en instructions
- Comment un OS simplifie l'accès au matériel
- Comment une application utilise toutes ces couches

**Au niveau conceptuel :**
- Pourquoi les ordinateurs utilisent le binaire
- Comment l'abstraction permet de gérer la complexité
- Pourquoi certaines opérations sont "coûteuses"
- Comment le même matériel peut faire des choses très différentes

## Vos Outils

Le projet est fourni avec une suite d'outils performants :

### Les Outils en Ligne de Commande

| Outil | Rôle | Exemple |
|:------|:-----|:--------|
| `hdl_cli` | Simule vos circuits HDL | `hdl_cli test Not.hdl` |
| `a32_cli` | Assemble le code A32 → binaire | `a32_cli prog.s -o prog.bin` |
| `c32_cli` | Compile le code C32 → assembleur | `c32_cli prog.c -o prog.s` |
| `a32_runner` | Exécute le code binaire | `a32_runner prog.bin` |

### Le Simulateur Web (Recommandé)

Pour une expérience plus visuelle et interactive, utilisez le **Simulateur Web**. Il vous permet de :
- Écrire et tester votre HDL directement dans le navigateur
- Voir l'état des signaux en temps réel avec des chronogrammes
- Compiler et exécuter du code C et Assembleur
- Visualiser l'écran, les registres et la mémoire

Pour le lancer :
```bash
cd web
npm install
npm run dev
```
Ouvrez ensuite votre navigateur à l'adresse indiquée (généralement `http://localhost:5173`).

### Le CPU Visualizer

Le **CPU Visualizer** est un outil pédagogique spécialement conçu pour comprendre le fonctionnement du processeur. Il affiche en temps réel :

- **Le pipeline** : Les 5 étapes d'exécution (Fetch, Decode, Execute, Memory, Writeback) s'illuminent au fur et à mesure
- **Les registres** : R0-R15 avec mise en évidence des modifications
- **Les flags** : N, Z, C, V avec animations lors des changements
- **Le code source** : Coloration syntaxique et surlignage de la ligne en cours d'exécution
- **Le cache** : Statistiques (hits/misses) et contenu des lignes cache

Accédez-y depuis le menu principal du Simulateur Web ou directement via `/visualizer.html`.

**7 démos intégrées** vous permettent d'explorer différents concepts :
1. Addition simple
2. Boucles et branchements
3. Accès mémoire (LDR/STR)
4. Conditions et prédication
5. Tableaux
6. Flags CPU
7. Comportement du cache

## Comment Utiliser ce Livre

### L'approche recommandée

1. **Lisez chaque chapitre en entier** avant de commencer les exercices
2. **Faites les exercices dans l'ordre** — chaque exercice prépare le suivant
3. **Ne regardez pas les solutions** avant d'avoir vraiment essayé
4. **Utilisez le simulateur web** pour visualiser ce qui se passe
5. **Reliez toujours à l'ensemble** — demandez-vous "où cela s'insère-t-il ?"

### Si vous êtes bloqué

- Relisez la section correspondante du chapitre
- Vérifiez que vous avez bien compris les exercices précédents
- Utilisez le débogueur visuel du simulateur web
- Les erreurs les plus fréquentes sont des problèmes de câblage (mauvaises connexions)

## La Grande Aventure Commence

Vous êtes sur le point d'entreprendre un voyage fascinant. Chaque chapitre vous rapprochera un peu plus de la compréhension totale de la machine.

Quand vous aurez terminé, vous regarderez votre ordinateur différemment. Ce ne sera plus une boîte noire mystérieuse, mais une symphonie d'abstractions que vous pouvez comprendre, modifier, et même reconstruire.

Prêt ? Passons à la première brique élémentaire : la logique booléenne.

---

**Rappel important** : Chaque chapitre de ce livre construit sur les précédents. Résistez à la tentation de sauter des étapes — la compréhension profonde vient de la construction progressive.
