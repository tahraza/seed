# Notes Enseignant - Chapitre 06 : L'Assembleur

> **Ce fichier est réservé aux enseignants.**
> Il n'est pas distribué aux étudiants et n'est pas généré en PDF.

## Vue d'ensemble

**Objectif du chapitre :**
Comprendre comment le code assembleur est traduit en binaire exécutable par le CPU.

**Place dans la progression :**
- Prérequis : Chapitres 01-05 (matériel complet + CPU)
- **Transition clé** : Du matériel vers le logiciel
- Prépare : Chapitre 07 (compilateur)

**Nature du chapitre :**
Premier chapitre "logiciel". Les étudiants passent de la construction du matériel à la programmation de celui-ci.

---

## Points de vigilance

### Piège 1 : Confusion entre assembleur et CPU

**Symptôme :** "L'assembleur exécute les instructions"

**Cause :** Confusion entre traduction et exécution

**Solution pédagogique :**
- L'assembleur est un **programme** qui tourne sur une autre machine
- Il **traduit** le code source en binaire
- Le **CPU** exécute le binaire
- Analogie : traducteur humain vs. lecteur du texte traduit

---

### Piège 2 : Les deux passes sont mystérieuses

**Symptôme :** "Pourquoi pas une seule passe ?"

**Cause :** Le problème des références vers l'avant n'est pas clair

**Solution pédagogique :**
- Dessiner l'exemple au tableau :
  ```
  B end      ← Comment connaître l'adresse de end ?
  MOV R0, #1
  end:       ← Ah, end est là !
  ```
- Faire l'exercice manuellement avec les étudiants
- Montrer qu'une seule passe nécessiterait du backpatching

---

### Piège 3 : Confusion offset vs adresse

**Symptôme :** "B loop saute à l'adresse loop"

**Cause :** Ne pas comprendre le calcul d'offset

**Solution pédagogique :**
- offset = (cible - PC - 8) / 4
- Le -8 est dû au pipeline (PC+8 pendant Fetch)
- Faire plusieurs exemples numériques
- Insister : l'instruction ne contient PAS l'adresse absolue

---

### Piège 4 : Le literal pool est magique

**Symptôme :** "Comment ça marche LDR R0, =0xDEADBEEF ?"

**Cause :** La pseudo-instruction cache la complexité

**Solution pédagogique :**
- Montrer la transformation explicite :
  ```
  LDR R0, =0xDEADBEEF   →   LDR R0, [PC, #offset]
                            ...
                            .word 0xDEADBEEF
  ```
- Expliquer que l'assembleur place la constante après le code
- Le PC-relative permet d'atteindre cette zone

---

### Piège 5 : Directives vs Instructions

**Symptôme :** "`.word` est une instruction ?"

**Cause :** Confusion entre code et données

**Solution pédagogique :**
- Directives = ordres pour l'assembleur (commence par `.`)
- Instructions = ordres pour le CPU (MOV, ADD, etc.)
- Les directives **ne génèrent pas d'instructions** (sauf .word qui génère des données)

---

## Questions fréquentes

### Q1 : "Pourquoi pas assembler en une seule passe ?"

**Réponse suggérée :**
"On pourrait, mais ce serait plus compliqué. Il faudrait laisser des 'trous' pour les références non résolues, puis revenir les remplir (backpatching). Deux passes séparées rendent le code plus simple à comprendre et à maintenir."

### Q2 : "Le fichier .bin contient quoi exactement ?"

**Réponse suggérée :**
"Uniquement les octets des instructions et des données, dans l'ordre. Pas de métadonnées, pas de table des symboles. Le format A32B est minimaliste. Les vrais formats (ELF, PE) sont beaucoup plus complexes avec des headers, sections, symboles, relocations..."

### Q3 : "Pourquoi le pipeline affecte-t-il les offsets ?"

**Réponse suggérée :**
"Quand le CPU lit (Fetch) une instruction, le PC pointe déjà 8 octets plus loin (2 instructions × 4 octets). C'est une spécificité ARM classique. L'assembleur compense automatiquement, mais il faut le savoir pour comprendre les offsets."

### Q4 : "Peut-on avoir plusieurs literal pools ?"

**Réponse suggérée :**
"Oui ! Si le code est long, un seul pool à la fin serait trop loin (offset > 4KB). La directive `.ltorg` force l'émission d'un pool intermédiaire. L'assembleur peut aussi le faire automatiquement."

---

## Timing suggéré

### Séance type (3h)

| Section | Durée | Notes |
|---------|-------|-------|
| Introduction : Texte → Binaire | 15 min | Rappel du problème |
| Les deux passes | 30 min | Exemple au tableau |
| Pause | 10 min | |
| Encodage d'instructions | 30 min | Exercices manuels |
| TD Exercices 1-3 | 30 min | |
| Pause | 10 min | |
| Directives et sections | 20 min | .text, .data, .word |
| Literal pool | 15 min | Pseudo-instruction |
| TP : Simulateur | 30 min | Exercices pratiques |
| Questions / Récap | 10 min | |

### Adaptation selon le niveau

**Groupe avancé :**
- Implémenter un mini-assembleur en Python
- Étudier le format ELF
- Comparer avec x86, RISC-V

**Groupe débutant :**
- Se concentrer sur l'encodage manuel
- Plus de temps sur le simulateur
- Ignorer les détails du literal pool

---

## Démonstrations recommandées

### Démo 1 : Encodage en direct

Au tableau, encoder ensemble :
1. `MOV R0, #42` → binaire → hex
2. `ADD R1, R2, R3` → binaire → hex
3. Vérifier avec le simulateur

### Démo 2 : Table des symboles

Construire la table pour un programme de 5 lignes :
1. Parcourir le code, noter les adresses
2. Reparcourir, résoudre les références
3. Montrer le binaire final

### Démo 3 : Hexdump

```bash
cargo run -p a32_cli -- assemble test.s -o test.bin
hexdump -C test.bin
```

Identifier chaque instruction dans le dump.

---

## Ressources supplémentaires

### Pour approfondir

- Documentation GNU as (assembleur ARM)
- "ARM Assembly Language" de William Hohl
- Format ELF : `man elf`

### Exercices supplémentaires

1. Encoder 10 instructions à la main
2. Écrire un désassembleur simple (binaire → texte)
3. Analyser un vrai fichier ELF avec `readelf`

---

## Évaluation formative

### Mini-quiz de fin de séance (5 min)

1. Pourquoi deux passes ? → **Références vers l'avant**
2. Que fait `.word 42` ? → **Réserve 4 octets avec valeur 42**
3. Différence entre section et directive ? → **Section = zone, Directive = commande**
4. Comment charger une constante 32 bits ? → **LDR Rd, =valeur (literal pool)**
5. Formule de l'offset de branchement ? → **(cible - PC - 8) / 4**

### Critères de réussite du chapitre

- [ ] L'étudiant peut encoder une instruction simple
- [ ] L'étudiant peut construire une table des symboles
- [ ] L'étudiant comprend les deux passes
- [ ] L'étudiant utilise les directives de base
- [ ] L'étudiant a écrit un programme sur le simulateur

---

## Retour d'expérience

### Ce qui fonctionne bien

- L'encodage manuel est très formateur
- Le simulateur rend les concepts concrets
- Les exercices progressifs maintiennent l'engagement

### Points à améliorer

- Le literal pool reste abstrait pour certains
- Le calcul d'offset nécessite de la pratique
- Prévoir un aide-mémoire des opcodes

### Erreurs fréquentes à anticiper

1. Oublier le -8 dans le calcul d'offset
2. Confondre immédiat 12 bits et valeur maximale
3. Ne pas aligner les données sur 4 octets
4. Oublier HALT à la fin du programme

---

## Transition vers le chapitre suivant

Ce chapitre marque la fin de la "partie basse" du cours. Les étudiants ont maintenant :
- Construit le matériel (chapitres 1-5)
- Compris comment le programmer (chapitre 6)

Le chapitre 7 (Compilateur) monte encore d'un niveau d'abstraction : au lieu d'écrire de l'assembleur, on écrira du C32 qui sera **traduit** en assembleur.

Faire le parallèle :
- Assembleur : Texte assembleur → Binaire
- Compilateur : Code C32 → Texte assembleur → Binaire

---

*Dernière mise à jour : 2026-02-01*

