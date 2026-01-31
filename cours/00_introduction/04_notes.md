# Notes Enseignant - Chapitre 00 : Introduction

> **Ce fichier est réservé aux enseignants.**
> Il n'est pas distribué aux étudiants et n'est pas généré en PDF.

## Vue d'ensemble

**Objectif du chapitre :**
Donner aux étudiants une vision globale du projet, les motiver et les familiariser avec les outils.

**Place dans la progression :**
- Premier chapitre, aucun prérequis
- Prépare tous les chapitres suivants (vision d'ensemble)

---

## Points de vigilance

### Piège 1 : Étudiants démotivés par la complexité apparente

**Symptôme :** "C'est trop compliqué, on ne va jamais y arriver"

**Cause :** Les 8 couches semblent intimidantes vues d'un coup

**Solution pédagogique :**
- Insister sur le fait qu'on avance **une couche à la fois**
- Montrer que chaque couche est simple individuellement
- Faire la démo "Addition simple" pour montrer que ça marche déjà

---

### Piège 2 : Confusion entre les outils

**Symptôme :** "C'est quoi la différence entre hdl_cli et a32_cli ?"

**Cause :** Trop d'outils présentés d'un coup

**Solution pédagogique :**
- Pour ce chapitre, se concentrer uniquement sur le **simulateur web**
- Les outils CLI seront introduits progressivement dans les chapitres suivants
- Tableau simplifié : "Pour l'instant, utilisez le simulateur web"

---

### Piège 3 : Étudiants qui veulent aller trop vite

**Symptôme :** "Je veux déjà faire le CPU !"

**Cause :** Impatience, sous-estimation des fondations

**Solution pédagogique :**
- Expliquer que chaque chapitre construit sur le précédent
- Montrer qu'un CPU sans comprendre les portes logiques est impossible
- Promettre qu'on ira vite une fois les bases acquises

---

### Piège 4 : Problèmes techniques avec le simulateur

**Symptôme :** "Ça ne marche pas sur mon ordinateur"

**Cause :** Navigateur incompatible, JavaScript désactivé, cache

**Solution pédagogique :**
- Avoir un plan B : captures d'écran, démo en direct
- Vérifier que Chrome/Firefox récent est utilisé
- Ctrl+Shift+R pour vider le cache si nécessaire

---

## Questions fréquentes

### Q1 : "Pourquoi ne pas utiliser un vrai processeur ARM ?"

**Réponse suggérée :**
"Un vrai ARM a des millions de transistors et des centaines d'instructions. nand2c est une version simplifiée qui capture l'essence de ARM (registres, RISC, flags) tout en étant constructible et compréhensible. Une fois que vous maîtrisez nand2c, passer à ARM réel est beaucoup plus facile."

### Q2 : "Est-ce qu'on va vraiment construire un ordinateur physique ?"

**Réponse suggérée :**
"Non, on travaille en simulation. Mais les principes sont exactement les mêmes ! Avec les bons outils (FPGA), vous pourriez transformer votre design en circuit réel. Certains étudiants l'ont fait."

### Q3 : "C'est quoi NAND exactement ?"

**Réponse suggérée :**
"On le verra en détail au chapitre 1 ! Pour l'instant, sachez que c'est la porte logique la plus simple et la plus puissante — on peut tout construire à partir d'elle."

---

## Timing suggéré

### Séance type (3h)

| Section | Durée | Notes |
|---------|-------|-------|
| Accroche (doigt → pixel) | 10 min | Captiver l'attention, poser le mystère |
| Les 8 couches | 20 min | Schéma au tableau, exemples concrets |
| Architecture nand2c vs Hack | 15 min | Insister sur les avantages |
| Pont avec ARM | 10 min | Rassurer sur l'utilité professionnelle |
| Pause | 10 min | |
| Présentation des outils | 15 min | Démo du simulateur web en direct |
| TD - Exercices 1-3 | 30 min | En autonomie, circuler pour aider |
| TP - Découverte visualiseur | 45 min | Accompagner les problèmes techniques |
| Récap / Questions | 15 min | Répondre aux doutes, motiver |

### Adaptation selon le niveau

**Groupe avancé (info/électronique) :**
- Aller plus vite sur les concepts de base
- Approfondir les comparaisons avec ARM réel
- Encourager l'exploration libre des démos

**Groupe débutant (non-informaticiens) :**
- Prendre plus de temps sur l'accroche et les analogies
- Faire le TP ensemble en mode guidé
- Rassurer sur le fait qu'on apprend pas à pas

---

## Ressources supplémentaires

### Pour approfondir

- Livre original "Nand to Tetris" de Nisan & Schocken
- Documentation ARM Architecture Reference Manual (pour les curieux)
- Vidéos Ben Eater sur YouTube (construction CPU réel)

### Matériel de secours

En cas de panne du visualiseur web :
- Utiliser la version locale (`npm run dev`)
- Montrer des captures d'écran préparées
- Expliquer les concepts au tableau

---

## Retour d'expérience

### Ce qui fonctionne bien

- L'accroche "doigt → pixel" capte l'attention
- La démo "Addition simple" impressionne et motive
- Les analogies avec la voiture pour expliquer l'abstraction

### Points à améliorer

- Certains étudiants voudraient plus de contexte historique
- Le lien avec ARM pourrait être renforcé avec des exemples de code ARM réel

---

*Dernière mise à jour : 2026-02-01*
