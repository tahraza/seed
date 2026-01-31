# Notes Enseignant - Chapitre 01 : Logique Booléenne

> **Ce fichier est réservé aux enseignants.**
> Il n'est pas distribué aux étudiants et n'est pas généré en PDF.

## Vue d'ensemble

**Objectif du chapitre :**
Construire les portes logiques élémentaires (NOT, AND, OR, XOR, Mux, DMux) à partir de la porte NAND, en comprenant pourquoi NAND est universel.

**Place dans la progression :**
- Premier chapitre technique après l'introduction
- Fondation pour TOUS les chapitres suivants
- Prérequis : Chapitre 00 (familiarisation avec les outils)

---

## Points de vigilance

### Piège 1 : Confusion entre bits et signaux HDL

**Symptôme :** "Pourquoi `a` et pas `a[0]` ?"

**Cause :** Les étudiants confondent `bit` (un seul signal) et `bits(n downto 0)` (un bus)

**Solution pédagogique :**
- Insister sur la différence dès le début
- `bit` = un fil = une valeur 0 ou 1
- `bits(7 downto 0)` = 8 fils = un bus
- Analogie : un fil électrique vs un câble multi-brins

---

### Piège 2 : Ordre des connexions dans port map

**Symptôme :** "Mon circuit ne marche pas mais le code semble correct"

**Cause :** Inversion entre le nom de la broche (à gauche) et le signal (à droite)

**Erreur typique :**
```vhdl
-- FAUX : l'étudiant met le signal à gauche
u1: Nand port map (my_signal => a, another => b, result => y);

-- CORRECT : broche du composant à gauche, signal à droite
u1: Nand port map (a => my_signal, b => another, y => result);
```

**Solution pédagogique :**
- Règle mnémotechnique : "broche => signal" = "où ça va => d'où ça vient"
- Toujours vérifier la déclaration du component

---

### Piège 3 : Oublier de déclarer les signaux internes

**Symptôme :** Erreur de compilation "signal not declared"

**Cause :** Les étudiants oublient la section `signal` avant le `begin`

**Solution pédagogique :**
- Template systématique : entity → architecture → component → signal → begin → instances
- Faire écrire le squelette AVANT de remplir

---

### Piège 4 : Ne pas comprendre pourquoi NAND est universel

**Symptôme :** "Pourquoi on part du NAND et pas du AND ?"

**Cause :** Le concept de complétude fonctionnelle n'est pas intuitif

**Solution pédagogique :**
- Démonstration pratique : montrer qu'on peut faire NOT avec NAND
- Donc on peut faire AND = NOT(NAND)
- Donc on peut faire OR via De Morgan
- Avec AND, OR, NOT on peut tout faire (théorème)

---

### Piège 5 : XOR trop complexe

**Symptôme :** "Je ne comprends pas la formule du XOR"

**Cause :** La formule `(a AND NOT b) OR (NOT a AND b)` semble arbitraire

**Solution pédagogique :**
- Partir de la table de vérité, pas de la formule
- "Quand XOR vaut 1 ?" → "Quand les entrées sont différentes"
- "Différent = (a=1 et b=0) OU (a=0 et b=1)"
- La formule découle naturellement

---

### Piège 6 : Confusion Mux/DMux

**Symptôme :** "C'est quoi la différence ?"

**Cause :** Les deux ont des noms similaires et utilisent un sélecteur

**Solution pédagogique :**
- **Mux** = "Choisir" : 2 entrées → 1 sortie (comme choisir une chaîne TV)
- **DMux** = "Router" : 1 entrée → 2 sorties (comme un aiguillage de train)
- Dessin au tableau : flèches dans des directions opposées

---

## Questions fréquentes

### Q1 : "Pourquoi on n'utilise pas directement AND, OR, NOT ?"

**Réponse suggérée :**
"En électronique réelle, fabriquer une porte NAND en CMOS ne nécessite que 4 transistors. C'est la porte la plus simple et la plus économique. Partir du NAND nous montre comment on construit réellement les circuits. De plus, ça démontre le pouvoir de l'abstraction : avec UNE brique, on construit tout."

### Q2 : "Est-ce que De Morgan c'est important ?"

**Réponse suggérée :**
"Absolument ! De Morgan est utilisé partout en électronique pour simplifier les circuits. Par exemple, transformer `NOT(A AND B)` en `NOT(A) OR NOT(B)` peut parfois réduire le nombre de portes nécessaires. Vous le reverrez en cours d'électronique numérique."

### Q3 : "Pourquoi le Mux est si important ?"

**Réponse suggérée :**
"Le Mux implémente le 'if-then-else' en matériel. Dans un CPU, chaque fois qu'il faut choisir entre deux valeurs (quel registre lire ? quelle opération faire ?), c'est un Mux qui fait le travail. Un CPU moderne contient des milliers de Mux."

### Q4 : "C'est quoi le rapport avec le VHDL professionnel ?"

**Réponse suggérée :**
"Notre HDL est une version simplifiée de VHDL. La syntaxe `entity`, `architecture`, `port map`, `signal` est identique. En VHDL industriel, on utilise `std_logic` au lieu de `bit`, et il y a plus de types et de fonctionnalités, mais les concepts fondamentaux sont les mêmes."

---

## Timing suggéré

### Séance type (3h)

| Section | Durée | Notes |
|---------|-------|-------|
| Rappel : pourquoi le binaire | 10 min | Révision rapide du chapitre 00 |
| NAND et son universalité | 20 min | Démonstration avec table de vérité |
| Construction NOT, AND, OR | 25 min | Au tableau, puis les étudiants font le TD |
| Pause | 10 min | |
| TD Exercices 1-4 | 30 min | En autonomie, circuler pour aider |
| XOR et son importance | 15 min | Lien avec l'addition (teaser chapitre 2) |
| Mux et DMux | 20 min | Insister sur l'importance du Mux |
| TP : premières portes | 40 min | Inv, And2, Or2 minimum |
| Questions / Récap | 10 min | |

### Adaptation selon le niveau

**Groupe avancé (électronique/info) :**
- Moins de temps sur les concepts, plus sur le HDL
- Défis : XOR en 4 NAND, Mux4Way
- Discussion sur l'optimisation des circuits

**Groupe débutant :**
- Plus de temps sur les tables de vérité
- Faire les premiers exercices HDL ensemble
- Ne pas forcément finir tous les exercices

---

## Démonstrations recommandées

### Démo 1 : NAND est universel (tableau)

1. Dessiner la table NAND
2. Montrer que NAND(A,A) = NOT(A)
3. Montrer que NOT(NAND(A,B)) = AND(A,B)
4. Appliquer De Morgan pour OR
5. "Avec AND, OR, NOT, on peut tout faire" → donc avec NAND aussi

### Démo 2 : Le Mux comme if-else

```
Si sel = 0 :  out = a
Si sel = 1 :  out = b

En pseudo-code : out = sel ? b : a
```

Montrer que c'est exactement l'opérateur ternaire en programmation.

### Démo 3 : Simulateur HDL en direct

- Ouvrir le simulateur
- Montrer un exemple qui marche
- Introduire volontairement une erreur (mauvais port map)
- Montrer le message d'erreur et comment le corriger

---

## Ressources supplémentaires

### Pour approfondir

- Livre "Digital Design" de M. Morris Mano (référence classique)
- Vidéos Ben Eater sur YouTube (construction physique)
- Nand2Tetris original (approche similaire)

### Matériel de secours

En cas de problème avec le simulateur web :
- Utiliser des captures d'écran préparées
- Faire les exercices sur papier (tables de vérité)
- Version locale du simulateur

---

## Évaluation formative

### Mini-quiz de fin de séance (5 min)

1. Quelle est la sortie de NAND(1, 1) ? → **0**
2. Comment faire NOT avec un NAND ? → **NAND(A, A)**
3. XOR(0, 1) = ? → **1**
4. Un Mux avec sel=1 renvoie quelle entrée ? → **b**
5. Combien de sorties a un DMux ? → **2**

### Critères de réussite du chapitre

- [ ] L'étudiant peut remplir une table de vérité pour n'importe quelle porte
- [ ] L'étudiant peut expliquer pourquoi NAND est universel
- [ ] L'étudiant peut écrire du code HDL simple avec port map
- [ ] L'étudiant a implémenté au moins Inv, And2, Or2 dans le simulateur

---

## Retour d'expérience

### Ce qui fonctionne bien

- La démonstration "NAND construit tout" est convaincante
- Les exercices progressifs (NOT → AND → OR → XOR) fonctionnent bien
- Le simulateur rend le HDL concret

### Points à améliorer

- Certains étudiants voudraient plus d'exercices papier avant le HDL
- Le lien avec l'électronique réelle (transistors) pourrait être renforcé
- Prévoir plus de temps pour le Mux qui est crucial pour la suite

### Erreurs fréquentes à anticiper

1. `port map` avec les signaux dans le mauvais sens
2. Oubli du `signal` dans la déclaration
3. Confusion `bit` vs `bits`
4. Copier-coller sans adapter les noms d'instance (`u1` partout)

---

*Dernière mise à jour : 2026-02-01*
