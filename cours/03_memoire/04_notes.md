# Notes Enseignant - Chapitre 03 : Mémoire

> **Ce fichier est réservé aux enseignants.**
> Il n'est pas distribué aux étudiants et n'est pas généré en PDF.

## Vue d'ensemble

**Objectif du chapitre :**
Introduire la logique séquentielle et construire les composants mémoire (registres, RAM, PC) à partir de la DFF.

**Place dans la progression :**
- Prérequis : Chapitre 01 (Mux, DMux)
- Prépare : Chapitre 04 (Architecture) et Chapitre 05 (CPU)

---

## Points de vigilance

### Piège 1 : Confusion combinatoire/séquentiel

**Symptôme :** "L'ALU est séquentielle car elle est dans le CPU"

**Cause :** Confusion entre composant et contexte d'utilisation

**Solution pédagogique :**
- Règle simple : "Contient une DFF (ou équivalent) = séquentiel"
- L'ALU seule est combinatoire
- L'ALU + registres = système séquentiel
- Faire la liste : AND, Mux, Adder = combinatoire ; DFF, Reg, RAM = séquentiel

---

### Piège 2 : Timing de la DFF mal compris

**Symptôme :** "Pourquoi q n'est pas égal à d ?"

**Cause :** L'étudiant oublie le délai d'un cycle

**Solution pédagogique :**
- Insister sur `q(t) = d(t-1)`
- Chronogramme au tableau avec plusieurs cycles
- Analogie : "C'est comme une photo prise au cycle précédent"

---

### Piège 3 : Rétroaction incomprise

**Symptôme :** "Pourquoi la sortie revient vers l'entrée ? C'est une boucle infinie !"

**Cause :** L'étudiant pense en termes de code séquentiel

**Solution pédagogique :**
- Expliquer que la DFF "coupe" la boucle temporellement
- Sans DFF : boucle infinie
- Avec DFF : la valeur de l'ancien cycle alimente le nouveau
- Dessin : le Mux choisit entre "ce que j'avais" et "ce qu'on me donne"

---

### Piège 4 : Priorités du PC mal comprises

**Symptôme :** "Quand reset=1 et load=1, que se passe-t-il ?"

**Cause :** Les priorités ne sont pas explicites dans la conception

**Solution pédagogique :**
- Ordre strict : reset > load > inc > hold
- Implémenter avec des Mux en cascade (du moins prioritaire au plus prioritaire)
- Le dernier Mux (reset) a le "dernier mot"

---

### Piège 5 : Adressage hiérarchique confus

**Symptôme :** "Pourquoi address[5:3] et pas address[2:0] pour choisir la RAM8 ?"

**Cause :** La décomposition d'adresse n'est pas intuitive

**Solution pédagogique :**
- Analogie : adresse postale = pays + ville + rue + numéro
- Les bits de poids fort = "gros grain" (quelle sous-mémoire)
- Les bits de poids faible = "fin grain" (quel mot dans la sous-mémoire)
- Exercice : adresse 0x2A = 101010 → RAM8 n°5, mot n°2

---

## Questions fréquentes

### Q1 : "Pourquoi la DFF est-elle fournie comme primitive ?"

**Réponse suggérée :**
"La DFF peut être construite à partir de portes NAND (avec des verrous), mais c'est un circuit subtil qui nécessite une analyse de timing précise. Dans un vrai simulateur HDL, la DFF est aussi souvent une primitive. Notre focus est sur COMMENT UTILISER la DFF, pas comment la construire."

### Q2 : "Pourquoi le registre a besoin d'un signal load ?"

**Réponse suggérée :**
"Sans load, le registre capturerait une nouvelle valeur à CHAQUE cycle. Avec load, on contrôle QUAND écrire. C'est crucial : dans un CPU, on ne veut pas écraser R0 à chaque cycle, seulement quand une instruction le demande."

### Q3 : "Pourquoi construire RAM64 à partir de RAM8 ?"

**Réponse suggérée :**
"C'est le pattern de conception hiérarchique. Une RAM64 avec 64 registres et un Mux64Way serait énorme. En décomposant, chaque niveau est simple : DMux8Way + 8 composants + Mux8Way. C'est aussi comme ça que les vraies mémoires sont construites."

### Q4 : "Le PC incrémente toujours de 1 ?"

**Réponse suggérée :**
"Oui, car les instructions sont stockées consécutivement en mémoire. PC=0 → instruction 0, PC=1 → instruction 1, etc. Les sauts (branches) utilisent le mode load pour charger une nouvelle adresse. Reset remet à 0 pour redémarrer le programme."

---

## Timing suggéré

### Séance type (3h)

| Section | Durée | Notes |
|---------|-------|-------|
| Combinatoire vs séquentiel | 15 min | Tableau comparatif |
| Horloge et front montant | 15 min | Chronogramme au tableau |
| DFF : comportement | 20 min | Exercices chronogramme |
| Pause | 10 min | |
| Registre 1-bit : rétroaction | 25 min | Point clé du chapitre |
| TD Exercices 1-3 | 25 min | |
| PC et ses modes | 20 min | |
| RAM8 et adressage | 20 min | |
| TP : BitReg et Register | 30 min | Minimum à finir |

### Adaptation selon le niveau

**Groupe avancé :**
- Approfondir : comment construire une DFF avec des NAND
- Défi : RAM avec deux ports de lecture
- Discussion sur les caches et la hiérarchie mémoire

**Groupe débutant :**
- Plus de temps sur les chronogrammes
- Faire le BitReg ensemble pas à pas
- Simplifier le PC (ignorer hold, juste reset/load/inc)

---

## Démonstrations recommandées

### Démo 1 : Le problème de la boucle

Au tableau, montrer ce qui se passe SANS DFF :

```
     ┌─────┐
 a ──┤     │
     │ Mux ├──┬─── out
┌────┤     │  │
│    └─────┘  │
│             │
└─────────────┘  ← Boucle directe = oscillation !
```

Puis avec DFF :

```
     ┌─────┐     ┌─────┐
 a ──┤     │     │     │
     │ Mux ├─────┤ DFF ├──┬─── out
┌────┤     │     │     │  │
│    └─────┘     └─────┘  │
│                         │
└─────────────────────────┘  ← DFF coupe le temps
```

### Démo 2 : Simulateur - registre en action

Dans le simulateur :
1. Mettre `in = 1, load = 0` → la sortie ne change pas
2. Mettre `load = 1` → la sortie change au prochain cycle
3. Remettre `load = 0` → la valeur est conservée

### Démo 3 : Adressage RAM

Écrire à différentes adresses et montrer que les valeurs sont isolées :
- Écrire 42 à adresse 0
- Écrire 99 à adresse 3
- Lire adresse 0 → 42 (toujours)
- Lire adresse 3 → 99

---

## Ressources supplémentaires

### Pour approfondir

- Livre "Digital Design" de M. Morris Mano (chapitres sur les circuits séquentiels)
- Vidéos Ben Eater : construction d'un registre à partir de flip-flops
- Documentation sur les mémoires SRAM vs DRAM

### Exercices supplémentaires

1. Construire un compteur qui compte de 0 à 7 puis recommence
2. Construire un registre à décalage (shift register)
3. Construire une FIFO (First In First Out)

---

## Évaluation formative

### Mini-quiz de fin de séance (5 min)

1. Un circuit avec DFF est _______ (combinatoire/séquentiel) → **séquentiel**
2. q(t) = d(t-1) décrit quelle composante ? → **DFF**
3. Combien de bits d'adresse pour une RAM de 64 mots ? → **6 bits**
4. Quel mode du PC a la priorité la plus haute ? → **reset**
5. Un registre 32-bits contient combien de BitReg ? → **32**

### Critères de réussite du chapitre

- [ ] L'étudiant distingue combinatoire et séquentiel
- [ ] L'étudiant peut tracer un chronogramme DFF
- [ ] L'étudiant comprend la rétroaction Mux+DFF
- [ ] L'étudiant peut décomposer une adresse RAM hiérarchique
- [ ] L'étudiant a implémenté BitReg et Register

---

## Retour d'expérience

### Ce qui fonctionne bien

- La comparaison combinatoire/séquentiel avec exemples concrets
- Les chronogrammes pour comprendre le timing
- L'analogie "photo du cycle précédent" pour la DFF

### Points à améliorer

- La rétroaction est difficile à visualiser sans animation
- Certains étudiants voudraient voir l'intérieur d'une DFF
- Le PC avec 4 modes est dense, prévoir plus de temps

### Erreurs fréquentes à anticiper

1. Confondre l'entrée et la sortie du Mux dans le registre
2. Oublier que la DFF introduit un délai
3. Mauvais ordre des bits d'adresse dans RAM64
4. Oublier de connecter le signal load au DMux dans la RAM

---

*Dernière mise à jour : 2026-02-01*
