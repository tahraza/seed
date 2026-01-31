---
marp: true
theme: seed-td
paginate: true
header: "Seed - QCM Chapitre 05"
---

# QCM Chapitre 05 : Le Processeur (CPU)

**15 questions - 15 points**
**Durée : 15 minutes**

---

### Question 1

Quelles sont les 5 phases du cycle d'exécution (dans l'ordre) ?

- [ ] A. Fetch, Execute, Decode, Memory, Writeback
- [ ] B. Fetch, Decode, Execute, Memory, Writeback
- [ ] C. Decode, Fetch, Execute, Writeback, Memory
- [ ] D. Execute, Fetch, Decode, Memory, Writeback

**Réponse : B**

---

### Question 2

La phase Fetch consiste à :

- [ ] A. Décoder l'instruction
- [ ] B. Lire l'instruction depuis la mémoire
- [ ] C. Exécuter le calcul
- [ ] D. Écrire le résultat

**Réponse : B**

---

### Question 3

Le décodeur d'instruction est :

- [ ] A. Un circuit séquentiel
- [ ] B. Un circuit combinatoire (purement câblé)
- [ ] C. Un registre
- [ ] D. Une mémoire

**Réponse : B**

---

### Question 4

L'unité de contrôle génère :

- [ ] A. Les données à traiter
- [ ] B. Les signaux de contrôle (reg_write, mem_read, etc.)
- [ ] C. Le code binaire
- [ ] D. Les adresses mémoire

**Réponse : B**

---

### Question 5

À quelle phase l'ALU effectue-t-elle son calcul ?

- [ ] A. Fetch
- [ ] B. Decode
- [ ] C. Execute
- [ ] D. Writeback

**Réponse : C**

---

### Question 6

Le signal reg_write=1 signifie :

- [ ] A. Lire un registre
- [ ] B. Écrire dans un registre
- [ ] C. Accéder à la mémoire
- [ ] D. Effectuer un branchement

**Réponse : B**

---

### Question 7

Le MUX alu_src choisit entre :

- [ ] A. ALU et mémoire
- [ ] B. Registre et immédiat
- [ ] C. PC+4 et adresse de saut
- [ ] D. Fetch et Decode

**Réponse : B**

---

### Question 8

Le MUX wb_src (writeback source) choisit entre :

- [ ] A. Registre et mémoire
- [ ] B. Résultat ALU et donnée mémoire
- [ ] C. PC et LR
- [ ] D. Instruction et donnée

**Réponse : B**

---

### Question 9

Si CondCheck.ok = 0, que se passe-t-il ?

- [ ] A. Le CPU s'arrête
- [ ] B. L'instruction est annulée (NOP)
- [ ] C. Une erreur est générée
- [ ] D. L'instruction s'exécute normalement

**Réponse : B**

---

### Question 10

La phase Memory est active pour :

- [ ] A. Toutes les instructions
- [ ] B. Uniquement LDR et STR
- [ ] C. Uniquement les branchements
- [ ] D. Uniquement ADD et SUB

**Réponse : B**

---

### Question 11

Dans un CPU pipeline, combien d'instructions peuvent être en cours simultanément (5 étages) ?

- [ ] A. 1
- [ ] B. 3
- [ ] C. 5
- [ ] D. 10

**Réponse : C**

---

### Question 12

Un data hazard se produit quand :

- [ ] A. Le PC est corrompu
- [ ] B. Une instruction lit un registre pas encore écrit
- [ ] C. La mémoire est pleine
- [ ] D. Le clock est trop rapide

**Réponse : B**

---

### Question 13

Le forwarding (bypass) permet de :

- [ ] A. Sauter des instructions
- [ ] B. Transférer un résultat directement sans attendre Writeback
- [ ] C. Accélérer le clock
- [ ] D. Compresser les instructions

**Réponse : B**

---

### Question 14

Le datapath est :

- [ ] A. Le chemin des signaux de contrôle
- [ ] B. Le chemin que suivent les données dans le CPU
- [ ] C. Le bus d'adresse
- [ ] D. La mémoire cache

**Réponse : B**

---

### Question 15

Pour l'instruction ADD R1, R2, R3, le signal mem_read vaut :

- [ ] A. 1
- [ ] B. 0
- [ ] C. Indéterminé
- [ ] D. Dépend des flags

**Réponse : B**

---

## Barème

- Chaque bonne réponse : +1 point
- Mauvaise réponse : 0 point
- Total : 15 points

