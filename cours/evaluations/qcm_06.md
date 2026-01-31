---
marp: true
theme: seed-td
paginate: true
header: "Seed - QCM Chapitre 06"
---

# QCM Chapitre 06 : L'Assembleur

**15 questions - 15 points**
**Durée : 15 minutes**

---

### Question 1

L'assembleur traduit :

- [ ] A. Binaire vers texte
- [ ] B. Texte assembleur vers binaire
- [ ] C. C vers assembleur
- [ ] D. Assembleur vers C

**Réponse : B**

---

### Question 2

Pourquoi l'assembleur fait-il deux passes ?

- [ ] A. Pour optimiser le code
- [ ] B. Pour résoudre les références vers l'avant
- [ ] C. Pour vérifier la syntaxe
- [ ] D. Pour compresser le binaire

**Réponse : B**

---

### Question 3

La table des symboles contient :

- [ ] A. Les opcodes des instructions
- [ ] B. Les associations label → adresse
- [ ] C. Les valeurs des registres
- [ ] D. Le code binaire

**Réponse : B**

---

### Question 4

La directive .text indique :

- [ ] A. La fin du programme
- [ ] B. Le début de la section code
- [ ] C. Un commentaire
- [ ] D. Une erreur

**Réponse : B**

---

### Question 5

La directive .data indique :

- [ ] A. Le début de la section données
- [ ] B. La fin du programme
- [ ] C. Une instruction
- [ ] D. Un registre

**Réponse : A**

---

### Question 6

La directive .word 42 fait :

- [ ] A. Déclare une variable nommée "word"
- [ ] B. Réserve 4 octets avec la valeur 42
- [ ] C. Exécute 42 fois
- [ ] D. Saute à l'adresse 42

**Réponse : B**

---

### Question 7

Un label suivi de ":" définit :

- [ ] A. Un commentaire
- [ ] B. Une adresse symbolique
- [ ] C. Une erreur de syntaxe
- [ ] D. Un registre

**Réponse : B**

---

### Question 8

L'offset d'un branchement est calculé par :

- [ ] A. cible - PC
- [ ] B. (cible - PC - 8) / 4
- [ ] C. cible × 4
- [ ] D. PC + cible

**Réponse : B**

---

### Question 9

Pourquoi y a-t-il un -8 dans le calcul d'offset ARM ?

- [ ] A. Convention arbitraire
- [ ] B. Pipeline : PC pointe 2 instructions en avance
- [ ] C. Taille des registres
- [ ] D. Limitation matérielle

**Réponse : B**

---

### Question 10

La pseudo-instruction LDR R0, =0xDEADBEEF :

- [ ] A. Est une vraie instruction LDR
- [ ] B. Est transformée en LDR + literal pool
- [ ] C. Génère une erreur
- [ ] D. Charge depuis un registre

**Réponse : B**

---

### Question 11

Le literal pool contient :

- [ ] A. Les labels
- [ ] B. Les grandes constantes qui ne tiennent pas dans un immédiat
- [ ] C. Les opcodes
- [ ] D. Les adresses de retour

**Réponse : B**

---

### Question 12

La directive .asciz "Hello" :

- [ ] A. Crée un label "Hello"
- [ ] B. Stocke la chaîne avec un '\0' final
- [ ] C. Affiche "Hello"
- [ ] D. Compare avec "Hello"

**Réponse : B**

---

### Question 13

Un immédiat de 12 bits peut représenter au maximum :

- [ ] A. 255
- [ ] B. 4095
- [ ] C. 65535
- [ ] D. Illimité

**Réponse : B**

---

### Question 14

Lors de la passe 1, l'assembleur :

- [ ] A. Génère le code binaire
- [ ] B. Construit la table des symboles
- [ ] C. Optimise le code
- [ ] D. Vérifie les permissions

**Réponse : B**

---

### Question 15

Un fichier binaire A32 (.bin) contient :

- [ ] A. Du texte assembleur
- [ ] B. Des instructions encodées en 32 bits
- [ ] C. Des commentaires
- [ ] D. Des labels

**Réponse : B**

---

## Barème

- Chaque bonne réponse : +1 point
- Mauvaise réponse : 0 point
- Total : 15 points

