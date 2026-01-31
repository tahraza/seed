---
marp: true
theme: seed-slides
paginate: true
header: "Seed - Chapitre 00"
footer: "Introduction au projet nand2c"
---

# Chapitre 00 : Introduction

**Du NAND au Tetris — Construire un ordinateur de zéro**

---

# 🎯 Accroche : Le Mystère de l'Ordinateur

Que se passe-t-il quand vous tapez une lettre sur votre clavier ?

1. Vos doigts appuient sur une touche physique
2. Un signal électrique est envoyé
3. Ce signal est transformé en code numérique
4. Le processeur le détecte et l'interprète
5. Un programme décide quoi faire
6. Des pixels s'allument sur votre écran

**Entre votre doigt et le pixel : des dizaines de couches d'abstraction**

---

# Le Problème de la "Boîte Noire"

L'ordinateur est une boîte noire. Nous tapons, et la magie opère.

**Combien de développeurs savent vraiment :**
- Comment le processeur exécute leur code ?
- Pourquoi certaines opérations sont rapides et d'autres lentes ?
- Ce qui se passe quand on écrit `x = 5` ?
- Comment une image apparaît à l'écran ?

---

# Notre Mission : Briser l'Abstraction

Nous allons descendre au niveau le plus bas — **la porte logique** — et remonter couche par couche.

À la fin, quand vous verrez du code s'exécuter, vous saurez **exactement** ce qui se passe.

> Ce n'est plus de la magie — c'est de l'ingénierie que vous maîtrisez.

---

# Les 8 Couches d'Abstraction

```
┌─────────────────────────────────┐
│  8. Applications (Tetris)       │  ← Ce que vous utilisez
├─────────────────────────────────┤
│  7. Système d'exploitation      │
├─────────────────────────────────┤
│  6. Compilateur (C32 → ASM)     │
├─────────────────────────────────┤
│  5. Assembleur (ASM → Binaire)  │
├─────────────────────────────────┤
│  4. CPU (Processeur)            │
├─────────────────────────────────┤
│  3. Mémoire (RAM, Registres)    │
├─────────────────────────────────┤
│  2. Arithmétique (ALU)          │
├─────────────────────────────────┤
│  1. Portes Logiques (NAND)      │  ← Où nous commençons
└─────────────────────────────────┘
```

---

# La Beauté de l'Abstraction

Chaque couche a une propriété remarquable :

**Elle n'a besoin de connaître que la couche juste en dessous.**

- Le programmeur C32 n'a pas besoin de savoir comment fonctionne l'ALU
- L'ALU n'a pas besoin de savoir qu'elle sera utilisée pour un jeu
- La porte NAND ne "sait" pas qu'elle fait partie d'un ordinateur

---

# L'Architecture nand2c A32

Notre ordinateur s'inspire des architectures **ARM modernes** :

| Caractéristique | Hack (Original) | nand2c (Ce projet) |
|:----------------|:----------------|:-------------------|
| Architecture    | 16-bits         | **32-bits**        |
| Registres       | 2 (A et D)      | **16 (R0-R15)**    |
| Mémoire         | Séparée         | **Unifiée**        |
| Instructions    | Propriétaire    | **RISC moderne**   |

---

# Pont avec ARM

> 💡 **En ARM Cortex :** Les processeurs de vos smartphones utilisent aussi 16 registres (R0-R15) et une architecture RISC.

**Comprendre nand2c, c'est comprendre ARM.**

Les mêmes concepts s'appliquent :
- Load/Store architecture
- Registres généraux
- Flags (N, Z, C, V)

---

# Ce que Vous Allez Apprendre

**Au niveau matériel :**
- Construire des portes logiques à partir de NAND
- Comment un additionneur transforme des bits en nombres
- Comment la mémoire "se souvient" des données
- Comment le CPU orchestre tout cela

**Au niveau logiciel :**
- Comment l'assembleur traduit en binaire
- Comment un compilateur transforme du code
- Comment un OS simplifie l'accès au matériel

---

# Vos Outils

| Outil | Rôle |
|:------|:-----|
| `hdl_cli` | Simule vos circuits HDL |
| `a32_cli` | Assemble le code A32 → binaire |
| `c32_cli` | Compile le code C32 → assembleur |
| **Simulateur Web** | Interface visuelle pour tout |
| **CPU Visualizer** | Voir le CPU en action |

---

# Le Simulateur Web

Pour une expérience **visuelle et interactive** :

- Écrire et tester votre HDL dans le navigateur
- Voir l'état des signaux en temps réel
- Compiler et exécuter du code C et Assembleur
- Visualiser l'écran, les registres et la mémoire

```bash
cd web && npm run dev
# → http://localhost:5173
```

---

# Le CPU Visualizer

Outil pédagogique pour comprendre le processeur :

- **Pipeline** : Les 5 étapes d'exécution s'illuminent
- **Registres** : R0-R15 avec mise en évidence
- **Flags** : N, Z, C, V animés
- **Cache** : Statistiques hits/misses

👉 Accessible via `/visualizer.html`

---

# Plan du Cours

| Chapitre | Sujet | Couche |
|:---------|:------|:-------|
| 01 | Logique Booléenne | Portes |
| 02 | Arithmétique | ALU |
| 03 | Mémoire | RAM, Registres |
| 04 | Architecture | Structure CPU |
| 05 | CPU | Implémentation |
| 06 | Assembleur | Programmation |

---

# Comment Réussir

1. **Lisez chaque chapitre en entier** avant les exercices
2. **Faites les exercices dans l'ordre** — chaque exercice prépare le suivant
3. **Ne regardez pas les solutions** avant d'avoir vraiment essayé
4. **Utilisez le simulateur web** pour visualiser
5. **Reliez toujours à l'ensemble** — "où cela s'insère-t-il ?"

---

# La Grande Aventure Commence

Vous êtes sur le point d'entreprendre un voyage fascinant.

Quand vous aurez terminé, vous regarderez votre ordinateur différemment.

> Ce ne sera plus une boîte noire mystérieuse, mais une symphonie d'abstractions que vous pouvez comprendre, modifier, et reconstruire.

**Prêt ? Passons à la première brique : la logique booléenne.**

---

# Questions ?

📚 **Références :**
- Livre Seed, Chapitre 00 - Introduction
- Simulateur Web : `npm run dev`

👉 **Prochain chapitre :** Logique Booléenne
