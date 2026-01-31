# Notes Enseignant - Chapitre 02 : Arithmétique Binaire

> **Ce fichier est réservé aux enseignants.**
> Il n'est pas distribué aux étudiants et n'est pas généré en PDF.

## Vue d'ensemble

**Objectif du chapitre :**
Construire l'ALU (Arithmetic Logic Unit) capable d'effectuer additions, soustractions et opérations logiques, avec génération des drapeaux.

**Place dans la progression :**
- Prérequis : Chapitre 01 (portes logiques : XOR, AND, OR, Mux)
- Prépare : Chapitre 03 (mémoire) et Chapitre 05 (CPU)

---

## Points de vigilance

### Piège 1 : Confusion binaire/décimal

**Symptôme :** "0101 + 0011 = 0134"

**Cause :** L'étudiant additionne comme en décimal, sans reporter les retenues binaires

**Solution pédagogique :**
- Insister sur les règles de base : 0+0=0, 0+1=1, 1+0=1, **1+1=10**
- Faire plusieurs exemples au tableau
- "En binaire, 1+1 ne fait pas 2, ça fait 10 !"

---

### Piège 2 : Complément à 2 mal compris

**Symptôme :** "Pour -5, j'inverse : 0101 → 1010, c'est bon ?"

**Cause :** Oubli du +1 après l'inversion

**Solution pédagogique :**
- Méthode en 2 étapes : **NOT puis +1** (toujours dans cet ordre)
- Vérification systématique : X + (-X) doit donner 0
- Exercice pratique : calculer -5, puis vérifier que 5 + (-5) = 0

---

### Piège 3 : Confusion Half Adder / Full Adder

**Symptôme :** "Pourquoi on ne peut pas tout faire avec des Half Adders ?"

**Cause :** L'étudiant ne comprend pas la propagation des retenues

**Solution pédagogique :**
- Analogie avec l'addition décimale colonne par colonne
- "Le Half Adder ne sait pas recevoir la retenue de la colonne précédente"
- Schéma au tableau : montrer que FA = HA + HA + OR

---

### Piège 4 : Drapeaux mal interprétés

**Symptôme :** Confusion entre C et V, ou entre usage signé/non-signé

**Cause :** Les drapeaux ont des significations différentes selon le contexte

**Solution pédagogique :**
- **C (Carry)** = pour les comparaisons **non-signées**
- **V (Overflow)** = pour les comparaisons **signées**
- Table de référence : signé → N,V,Z / non-signé → C,Z
- Exemple concret : -1 vs 4294967295 (même bits, interprétations différentes)

---

### Piège 5 : Overflow mal détecté

**Symptôme :** "V devrait être 1 mais mon circuit dit 0"

**Cause :** Formule de détection mal implémentée

**Solution pédagogique :**
- Règle simple : overflow si les deux entrées ont le même signe et le résultat a un signe différent
- Formule : `V = (a[31] == b[31]) AND (a[31] != y[31])`
- Attention : pour SUB, il faut considérer le signe de NOT(B), pas de B !

---

## Questions fréquentes

### Q1 : "Pourquoi le complément à 2 et pas juste un bit de signe ?"

**Réponse suggérée :**
"Avec un simple bit de signe, on aurait besoin de circuits différents pour addition et soustraction. De plus, on aurait +0 (0000) et -0 (1000). Le complément à 2 permet d'utiliser le MÊME additionneur pour tout, et il n'y a qu'un seul zéro."

### Q2 : "Pourquoi N ≠ V pour 'moins que' signé ?"

**Réponse suggérée :**
"Sans overflow, le signe du résultat dit directement si a < b. Mais avec overflow, le signe est inversé ! Donc on vérifie si N et V sont différents : soit N=1 sans overflow (vraiment négatif), soit N=0 avec overflow (faussement positif)."

### Q3 : "L'ALU fait vraiment tous les calculs en parallèle ?"

**Réponse suggérée :**
"Oui ! Dans notre implémentation pédagogique, on calcule AND, OR, XOR, ADD, SUB tous en même temps, et le Mux choisit le résultat à afficher. Dans les vrais CPU, c'est plus optimisé, mais le principe reste similaire."

### Q4 : "Pourquoi CMP ne stocke pas le résultat ?"

**Réponse suggérée :**
"CMP fait une soustraction mais on veut juste mettre à jour les flags, pas écraser un registre. C'est comme faire a - b juste pour savoir si a est plus grand que b. Le résultat numérique ne nous intéresse pas, seulement les flags."

---

## Timing suggéré

### Séance type (4h)

| Section | Durée | Notes |
|---------|-------|-------|
| Rappel conversions binaire/décimal | 15 min | Révision rapide |
| Complément à 2 | 30 min | Crucial, prendre le temps |
| Pause | 10 min | |
| Addition binaire + Half Adder | 25 min | Exercices au tableau |
| Full Adder | 20 min | Montrer la cascade |
| TD Exercices 1-4 | 30 min | En autonomie |
| Pause | 10 min | |
| Présentation ALU et drapeaux | 30 min | Slide par slide |
| TD Exercice 5-6 (drapeaux) | 20 min | Important pour la suite |
| TP : HalfAdder et FullAdder | 40 min | Minimum à finir |
| Récap / Questions | 10 min | |

### Adaptation selon le niveau

**Groupe avancé :**
- Accélérer sur les conversions
- Approfondir : Carry Lookahead Adder, multiplicateur
- Défi : implémenter une division

**Groupe débutant :**
- Plus d'exercices de conversions
- Faire le Full Adder ensemble
- Se concentrer sur ADD, SUB, ignorer les opérations logiques de l'ALU

---

## Démonstrations recommandées

### Démo 1 : Complément à 2 = "miroir + 1"

Au tableau :
```
Positifs     Négatifs
0111 = +7    1001 = -7
0110 = +6    1010 = -6
0101 = +5    1011 = -5
0100 = +4    1100 = -4
0011 = +3    1101 = -3
0010 = +2    1110 = -2
0001 = +1    1111 = -1
0000 = 0     (pas de -0)
```

Montrer le "cercle" des nombres : après +7 vient -8, après -1 vient 0.

### Démo 2 : Soustraction = Addition

```
  7 - 3 = 7 + (-3) = 7 + (NOT 3) + 1

  7 =     0111
  NOT 3 = 1100
  +1      0001
  --------
  = 0100 = 4 ✓
```

### Démo 3 : Overflow en direct

Dans le simulateur, montrer :
- 127 + 1 = -128 avec V=1
- -128 - 1 = +127 avec V=1

"Le résultat est mathématiquement faux car il ne tient pas sur 8 bits !"

---

## Ressources supplémentaires

### Pour approfondir

- "Computer Organization and Design" de Patterson & Hennessy
- Vidéos Ben Eater sur l'ALU (YouTube)
- Documentation ARM sur les condition codes

### Exercices supplémentaires

Pour les étudiants rapides :
1. Implémenter un comparateur magnitude (a > b, a < b, a == b)
2. Implémenter un multiplicateur 4x4
3. Calculer manuellement des opérations 32-bits

---

## Évaluation formative

### Mini-quiz de fin de séance (5 min)

1. XOR ou AND pour la somme dans un Half Adder ? → **XOR**
2. -1 sur 8 bits en complément à 2 ? → **0xFF**
3. Que teste B.LT ? → **N ≠ V**
4. Combien de Full Adders pour un Add32 ? → **32**
5. Quelle opération : A + NOT(B) + 1 ? → **A - B**

### Critères de réussite du chapitre

- [ ] L'étudiant peut convertir binaire ↔ décimal
- [ ] L'étudiant peut calculer le complément à 2
- [ ] L'étudiant peut tracer l'addition binaire avec retenues
- [ ] L'étudiant peut expliquer la différence entre C et V
- [ ] L'étudiant a implémenté au moins HalfAdder et FullAdder

---

## Retour d'expérience

### Ce qui fonctionne bien

- La vérification X + (-X) = 0 pour le complément à 2
- Les exemples avec débordement (127 + 1 = -128)
- Le schéma "cascade de Full Adders"

### Points à améliorer

- Certains étudiants veulent plus de temps sur les conversions
- L'ALU est dense, prévoir peut-être une séance dédiée
- Les drapeaux signés vs non-signés méritent plus d'exercices

### Erreurs fréquentes à anticiper

1. Oublier le +1 dans le complément à 2
2. Confondre C (carry) et V (overflow)
3. Mauvais ordre des entrées dans le port map du Full Adder
4. Oublier que SUB a besoin de cin=1

---

*Dernière mise à jour : 2026-02-01*
