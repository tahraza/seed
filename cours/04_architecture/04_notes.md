# Notes Enseignant - Chapitre 04 : Architecture Machine

> **Ce fichier est réservé aux enseignants.**
> Il n'est pas distribué aux étudiants et n'est pas généré en PDF.

## Vue d'ensemble

**Objectif du chapitre :**
Définir l'ISA (Instruction Set Architecture) A32 et apprendre à programmer en assembleur.

**Place dans la progression :**
- Prérequis : Chapitres 01-03 (compréhension du matériel)
- Prépare : Chapitre 05 (implémentation CPU) et Chapitre 06 (assembleur)

**Nature du chapitre :**
C'est un chapitre de **transition** entre matériel et logiciel. Plus théorique avec beaucoup de pratique assembleur.

---

## Points de vigilance

### Piège 1 : Confusion RISC/CISC

**Symptôme :** "Pourquoi on ne peut pas faire ADD directement en mémoire ?"

**Cause :** Habitude du x86 ou de langages haut niveau

**Solution pédagogique :**
- Expliquer les avantages RISC : simplicité du matériel, pipeline efficace
- Montrer que Load/Store = seulement 2 types d'accès mémoire à gérer
- "Le CPU est plus simple donc plus rapide"

---

### Piège 2 : Registres spéciaux mal utilisés

**Symptôme :** Utiliser SP ou LR comme registre général

**Cause :** Les conventions ne sont pas comprises

**Solution pédagogique :**
- Insister sur les rôles de SP, LR, PC dès le début
- Exercice : "Que se passe-t-il si on écrase LR ?"
- Montrer le chaos : perte de l'adresse de retour

---

### Piège 3 : Signé vs Non-signé

**Symptôme :** Utiliser B.LT pour des comparaisons non-signées

**Cause :** La différence n'est pas intuitive

**Solution pédagogique :**
- Exemple : 0xFFFFFFFF est -1 en signé, 4294967295 en non-signé
- Après CMP, les mêmes flags mais interprétation différente
- Tableau de référence : signé → LT/GT/GE/LE, non-signé → LO/HI/HS/LS

---

### Piège 4 : Oubli du suffixe S

**Symptôme :** "Pourquoi mon branchement ne marche pas après ADD ?"

**Cause :** ADD sans S ne modifie pas les flags

**Solution pédagogique :**
- Règle : CMP/TST modifient toujours les flags
- ADD/SUB/etc. nécessitent le S explicite (ADDS, SUBS)
- "Sans S, les flags ne bougent pas !"

---

### Piège 5 : Prédication mal comprise

**Symptôme :** "ADD.EQ ça fait quoi si Z=0 ?"

**Cause :** Le concept d'instruction "annulée" n'est pas clair

**Solution pédagogique :**
- Instruction conditionnelle = exécutée OU ignorée selon les flags
- Si la condition est fausse, c'est comme un NOP (pas d'effet)
- Avantage : évite les branchements = pipeline plus efficace

---

## Questions fréquentes

### Q1 : "Pourquoi 16 registres et pas 8 ou 32 ?"

**Réponse suggérée :**
"C'est un compromis. 8 registres = trop peu, beaucoup de spill vers la mémoire. 32 registres = plus de bits pour encoder le numéro de registre dans l'instruction. 16 registres = bon équilibre, comme ARM. Chaque registre coûte 4 bits dans l'encodage."

### Q2 : "C'est quoi le link register exactement ?"

**Réponse suggérée :**
"Quand vous appelez une fonction avec BL, le CPU doit savoir où revenir après. Il sauvegarde l'adresse de retour (PC+4) dans LR. À la fin de la fonction, MOV PC, LR fait un saut vers cette adresse. Si la fonction appelle une autre fonction, il faut sauvegarder LR sur la pile."

### Q3 : "Pourquoi la pile grandit vers le bas ?"

**Réponse suggérée :**
"Convention historique. Le code est en bas de la mémoire (adresses basses), les données au-dessus, et la pile commence en haut et descend. Ainsi pile et tas peuvent grandir l'un vers l'autre sans se chevaucher immédiatement. C'est la convention ARM/x86."

### Q4 : "Le MMIO c'est vraiment comme de la mémoire ?"

**Réponse suggérée :**
"Oui et non. L'interface est identique : LDR/STR. Mais les effets sont différents. Écrire en RAM stocke une valeur. Écrire à l'adresse de l'écran allume des pixels. Lire le clavier ne 'consomme' pas la valeur. Le matériel décide ce qui se passe à chaque adresse."

---

## Timing suggéré

### Séance type (4h)

| Section | Durée | Notes |
|---------|-------|-------|
| Introduction ISA | 15 min | Contrat matériel/logiciel |
| RISC vs CISC | 15 min | Avantages Load/Store |
| Registres et leurs rôles | 20 min | Focus sur SP, LR, PC |
| Pause | 10 min | |
| Format des instructions | 20 min | Bits de condition, classes |
| Codes de condition | 15 min | EQ, NE, LT, GT, etc. |
| TD Exercices 1-4 | 30 min | |
| Pause | 10 min | |
| Accès mémoire LDR/STR | 15 min | |
| Branchements et BL | 20 min | Appels de fonction |
| TP sur simulateur | 50 min | Exercices 1-6 minimum |

### Adaptation selon le niveau

**Groupe avancé :**
- Plus de temps sur la prédication et les optimisations
- Défis : dessiner des formes, animations
- Discussion sur les pipelines et pourquoi RISC est efficace

**Groupe débutant :**
- Plus de temps sur les concepts de base (registres, flags)
- Faire les premiers programmes ensemble
- Se limiter aux exercices 1-4 du TP

---

## Démonstrations recommandées

### Démo 1 : Exécution pas-à-pas

Dans le simulateur :
1. Charger un programme simple (somme de 1 à 10)
2. Exécuter en mode Step
3. Montrer les registres qui changent
4. Montrer le PC qui avance
5. Montrer les flags après CMP

### Démo 2 : Le désastre sans sauvegarde de LR

```asm
main:
    BL func_a
    HALT

func_a:
    BL func_b     ; Écrase LR !
    MOV PC, LR    ; Retourne... où ?

func_b:
    MOV PC, LR
```

Montrer que le programme ne termine jamais car LR est perdu.

### Démo 3 : Pixel par pixel

Dessiner un caractère en allumant les pixels un par un :
1. Montrer la formule : adresse = base + y*40 + x/8
2. Montrer le masque de bit : 1 << (7 - x%8)
3. Exécuter et voir le pixel s'allumer

---

## Ressources supplémentaires

### Pour approfondir

- Documentation ARM Architecture Reference Manual
- "Computer Organization and Design" de Patterson & Hennessy
- Tutoriels assembleur ARM sur YouTube

### Exercices supplémentaires

1. Implémenter une multiplication par additions successives (sans MUL)
2. Dessiner un rectangle rempli
3. Implémenter une boucle d'attente du clavier
4. Créer un mini-jeu "attrape le pixel"

---

## Évaluation formative

### Mini-quiz de fin de séance (5 min)

1. Que signifie RISC ? → **Reduced Instruction Set Computer**
2. Quel registre contient l'adresse de retour ? → **R14 (LR)**
3. Pour comparer en signé, quel code utiliser : LT ou LO ? → **LT**
4. Que fait BL par rapport à B ? → **Sauvegarde PC+4 dans LR**
5. Où est le clavier en MMIO ? → **0x00402600**

### Critères de réussite du chapitre

- [ ] L'étudiant peut expliquer la différence RISC/CISC
- [ ] L'étudiant connaît les registres spéciaux
- [ ] L'étudiant peut écrire une boucle en assembleur
- [ ] L'étudiant peut utiliser les conditions correctement
- [ ] L'étudiant a exécuté au moins 5 programmes sur le simulateur

---

## Retour d'expérience

### Ce qui fonctionne bien

- Le simulateur rend l'assembleur concret et motivant
- Les exercices de dessin (pixels) sont populaires
- La prédication impressionne ("c'est élégant !")

### Points à améliorer

- Certains étudiants trouvent l'assembleur rébarbatif
- Le MMIO nécessite des calculs d'adresse complexes
- Plus d'exercices interactifs seraient bienvenus

### Erreurs fréquentes à anticiper

1. Confondre B.LT (signé) et B.LO (non-signé)
2. Oublier le S dans ADDS pour modifier les flags
3. Utiliser [R0, R1] au lieu de [R0, #4] pour l'offset
4. Oublier que STRB écrit 1 octet, pas 4

---

*Dernière mise à jour : 2026-02-01*
