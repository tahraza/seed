# Notes Enseignant - Chapitre 05 : Le CPU

> **Ce fichier est réservé aux enseignants.**
> Il n'est pas distribué aux étudiants et n'est pas généré en PDF.

## Vue d'ensemble

**Objectif du chapitre :**
Assembler tous les composants (ALU, registres, mémoire) en un CPU fonctionnel et comprendre le cycle d'exécution.

**Place dans la progression :**
- Prérequis : Chapitres 01-04 (tous les composants matériels + ISA)
- **Point culminant** du matériel
- Prépare : Chapitre 06 (assembleur)

**Nature du chapitre :**
C'est le chapitre le plus dense mais aussi le plus gratifiant. Les étudiants voient enfin tout s'assembler.

---

## Points de vigilance

### Piège 1 : Confusion entre phases et composants

**Symptôme :** "L'ALU est dans la phase Decode"

**Cause :** Confusion entre les 5 phases et les composants physiques

**Solution pédagogique :**
- Phase = moment dans le temps
- Composant = circuit physique
- L'ALU est un composant, elle est **utilisée** pendant la phase Execute
- Schéma au tableau : composants à gauche, timeline en haut

---

### Piège 2 : Le décodeur fait des calculs

**Symptôme :** "Le décodeur calcule l'opération"

**Cause :** Confusion entre découper les bits et effectuer une opération

**Solution pédagogique :**
- Le décodeur = **câblage pur**
- Il route les bits 31-28 vers "cond", bits 19-16 vers "Rn", etc.
- Pas de calcul, pas de logique, juste de la sélection de fils
- C'est l'unité de contrôle qui décide, pas le décodeur

---

### Piège 3 : Writeback avant Memory

**Symptôme :** "Le résultat est écrit avant d'accéder à la mémoire"

**Cause :** L'ordre des phases n'est pas clair

**Solution pédagogique :**
- Ordre strict : Fetch → Decode → Execute → **Memory** → **Writeback**
- Pour LDR : on doit d'abord lire la mémoire, puis écrire dans le registre
- Le MUX wb_src choisit entre ALU et mémoire

---

### Piège 4 : CondCheck mal compris

**Symptôme :** "Pourquoi l'instruction s'exécute alors que ok=0 ?"

**Cause :** Confusion entre "exécuter" et "avoir un effet"

**Solution pédagogique :**
- L'instruction **traverse** toujours le pipeline
- Mais si ok=0, reg_write est forcé à 0 → pas d'écriture
- L'instruction devient un "NOP" (No Operation)
- Les ressources sont utilisées mais aucun effet visible

---

### Piège 5 : Pipeline = complexité

**Symptôme :** "Je ne comprends pas les hazards"

**Cause :** Le pipeline est un concept avancé

**Solution pédagogique :**
- **Option 1 :** Se concentrer sur le mono-cycle, mentionner le pipeline rapidement
- **Option 2 :** Utiliser l'analogie de la laverie (slides)
- Le CPU Visualizer montre les étapes de façon pédagogique (pas un vrai pipeline)

---

## Questions fréquentes

### Q1 : "Pourquoi 5 phases et pas 3 ou 7 ?"

**Réponse suggérée :**
"5 est un bon équilibre. Moins de phases = cycle plus long. Plus de phases = plus de hazards à gérer. Les vrais processeurs modernes ont 10-20 étages de pipeline, mais 5 est le minimum classique (MIPS, ARM basique)."

### Q2 : "Le CPU fait vraiment tout ça en un cycle ?"

**Réponse suggérée :**
"Dans notre modèle mono-cycle, oui. Le cycle doit être assez long pour que le signal traverse tout. Dans un vrai CPU pipeliné, chaque phase prend un cycle, et on peut avoir 5 instructions en cours simultanément."

### Q3 : "Comment le CPU sait quelle instruction exécuter ?"

**Réponse suggérée :**
"Le PC (Program Counter) contient l'adresse de l'instruction. Le CPU lit cette adresse en mémoire, décode l'instruction, l'exécute, puis incrémente le PC (ou saute ailleurs si c'est un branchement)."

### Q4 : "Pourquoi les MUX sont-ils si importants ?"

**Réponse suggérée :**
"Le CPU doit choisir entre plusieurs sources de données à chaque instant. alu_src choisit entre registre et immédiat. wb_src choisit entre ALU et mémoire. pc_src choisit entre PC+4 et adresse de saut. Sans MUX, pas de choix possible."

---

## Timing suggéré

### Séance type (4h)

| Section | Durée | Notes |
|---------|-------|-------|
| Introduction : qu'est-ce qu'un CPU ? | 15 min | Rappel des composants |
| Le cycle Fetch-Decode-Execute | 25 min | Schéma au tableau |
| Pause | 10 min | |
| Décodeur et Unité de Contrôle | 30 min | Table de signaux |
| TD Exercices 1-4 | 30 min | |
| Pause | 10 min | |
| Démonstration CPU Visualizer | 20 min | En direct ! |
| TP : Explorer le Visualizer | 45 min | Démos 1-4 minimum |
| Pipeline (si temps) | 20 min | Juste les concepts |
| Questions / Récap | 15 min | |

### Adaptation selon le niveau

**Groupe avancé :**
- Approfondir le pipeline avec hazards
- Exercice : implémenter Decoder et CondCheck en HDL
- Discussion sur les optimisations (superscalaire, out-of-order)

**Groupe débutant :**
- Se concentrer sur le cycle basique (mono-cycle)
- Plus de temps sur le CPU Visualizer
- Ignorer le pipeline, mentionner juste que ça existe

---

## Démonstrations recommandées

### Démo 1 : CPU Visualizer en direct

1. Ouvrir le Visualizer
2. Charger Demo 1 (Addition)
3. Exécuter pas-à-pas en expliquant chaque étape
4. Montrer les registres qui changent

### Démo 2 : Tracer une instruction au tableau

Pour `ADD R1, R2, R3` :
1. Dessiner le datapath simplifié
2. Montrer le chemin des données
3. Indiquer les signaux de contrôle actifs

### Démo 3 : Branchement conditionnel

Avec Demo 2 (Boucles) :
1. Montrer CMP qui met à jour les flags
2. Montrer B.LE qui teste les flags
3. Observer le PC qui revient en arrière

---

## Ressources supplémentaires

### Pour approfondir

- "Computer Organization and Design" de Patterson & Hennessy (le classique)
- Vidéos Ben Eater sur YouTube (construction d'un CPU 8-bit)
- Documentation ARM sur le pipeline Cortex-M

### Exercices supplémentaires

1. Dessiner le chemin des données pour chaque classe d'instruction
2. Créer un programme assembleur qui utilise toutes les instructions
3. (Avancé) Implémenter le CPU complet en HDL

---

## Évaluation formative

### Mini-quiz de fin de séance (5 min)

1. Quelles sont les 5 phases d'exécution ? → **Fetch, Decode, Execute, Memory, Writeback**
2. Que fait le décodeur ? → **Extrait les champs de l'instruction**
3. À quelle phase l'ALU est-elle utilisée ? → **Execute**
4. Que se passe-t-il si CondCheck.ok = 0 ? → **L'instruction est annulée (NOP)**
5. Quel MUX choisit entre ALU et mémoire ? → **wb_src**

### Critères de réussite du chapitre

- [ ] L'étudiant peut décrire les 5 phases d'exécution
- [ ] L'étudiant peut tracer le chemin des données pour ADD et LDR
- [ ] L'étudiant comprend le rôle du décodeur et de l'unité de contrôle
- [ ] L'étudiant a utilisé le CPU Visualizer
- [ ] L'étudiant comprend pourquoi les MUX sont nécessaires

---

## Retour d'expérience

### Ce qui fonctionne bien

- Le CPU Visualizer est très apprécié et rend les concepts concrets
- Le schéma du datapath aide à comprendre les flux
- L'analogie de la laverie pour le pipeline fonctionne bien

### Points à améliorer

- Le chapitre est dense, prévoir peut-être 2 séances
- Certains étudiants voudraient implémenter plus de composants en HDL
- Le pipeline mériterait un mini-chapitre dédié

### Erreurs fréquentes à anticiper

1. Confondre phases et composants
2. Croire que le décodeur fait des calculs
3. Oublier le MUX alu_src (registre vs immédiat)
4. Ne pas comprendre pourquoi CMP n'écrit pas dans un registre

---

## Moment de célébration

**C'est le moment !** Les étudiants ont construit un ordinateur complet.

Suggestions :
- Faire une pause pour féliciter le groupe
- Montrer un programme "impressionnant" sur le Visualizer
- Rappeler le chemin parcouru : NAND → CPU

À partir de maintenant, on passe au **logiciel** !

---

*Dernière mise à jour : 2026-02-01*
