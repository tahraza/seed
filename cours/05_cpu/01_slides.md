---
marp: true
theme: seed-slides
paginate: true
header: "Seed - Chapitre 05"
footer: "Le Processeur (CPU)"
---

# Chapitre 05 : Le Processeur (CPU)

> "Si vous ne pouvez pas le construire, vous ne le comprenez pas." — Feynman

---

# 🎯 Où en sommes-nous ?

```
┌─────────────────────────────────┐
│  8. Applications                │
├─────────────────────────────────┤
│  ...                            │
├─────────────────────────────────┤
│  5. CPU              ◀── NOUS   │
├─────────────────────────────────┤
│  4. Architecture (ISA) ✓        │
├─────────────────────────────────┤
│  3. Mémoire ✓  │  2. ALU ✓      │
└─────────────────────────────────┘
```

Le **point culminant** du matériel !

---

# Qu'est-ce qu'un CPU ?

Le CPU (Central Processing Unit) :

1. **Lit** les instructions depuis la mémoire
2. **Décode** pour comprendre quoi faire
3. **Exécute** les opérations
4. **Répète** à l'infini (jusqu'à HALT)

C'est une **machine à états** infatigable.

---

# Ce qu'on a construit

| Chapitre | Composant | Rôle |
|:---------|:----------|:-----|
| 1 | Portes | Briques de base |
| 2 | ALU | Calculs |
| 3 | Registres | R0-R15 |
| 3 | PC | Adresse courante |
| 3 | RAM | Programme + données |
| 4 | ISA | Instructions |

---

# Ce qu'il reste à construire

- **Décodeur** : Analyse les bits
- **Unité de contrôle** : Décide quoi activer
- **Multiplexeurs** : Routent les données
- **Le CPU** : L'assemblage final !

---

# Le Cycle Fetch-Decode-Execute

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│  FETCH  │───►│ DECODE  │───►│ EXECUTE │
│ PC→Mem  │    │ Analyser│    │  ALU    │
└─────────┘    └─────────┘    └─────────┘
     ▲                              │
     └──────────────────────────────┘
            Cycle infini
```

---

# Architecture du CPU (Datapath)

```
     PC ──► Mém Instr ──► Décodeur
                              │
                   ┌──────────┼──────────┐
                   ▼          ▼          ▼
              Contrôle    RegFile     Extend
                   │          │          │
                   ▼          ▼          ▼
                   └────► ALU ◄────────┘
                           │
                   ┌───────┴───────┐
                   ▼               ▼
              Mém Data        Writeback
```

---

# Phase 1 : Fetch

```
PC ──► Mémoire Instructions ──► instruction (32 bits)
```

Le PC envoie l'adresse, la mémoire renvoie l'instruction.

---

# Phase 2 : Decode

```
instruction ──► Décodeur ──► cond, class, op, Rn, Rd, Rm, imm
                   │
                   └──► Contrôle ──► signaux
```

Le décodeur **découpe** les 32 bits.
L'unité de contrôle **décide** quoi activer.

---

# Le Décodeur

Découpe les bits de l'instruction :

| Signal | Bits | Description |
|:-------|:-----|:------------|
| cond | 31-28 | Condition (EQ, NE...) |
| class | 27-25 | Type (ALU, MEM, BRANCH) |
| op | 24-21 | Opération ALU |
| S | 20 | Mettre à jour flags ? |
| Rn | 19-16 | Source 1 |
| Rd | 15-12 | Destination |

---

# L'Unité de Contrôle

Génère les **signaux de contrôle** :

| Instruction | reg_write | mem_read | mem_write |
|:------------|:---------:|:--------:|:---------:|
| ADD | 1 | 0 | 0 |
| LDR | 1 | 1 | 0 |
| STR | 0 | 0 | 1 |
| B | 0 | 0 | 0 |
| CMP | 0 | 0 | 0 |

---

# Phase 3 : Register Read

```
Rn, Rm ──► Banc de Registres ──► Data_A, Data_B
```

On lit les valeurs des registres sources.

---

# Phase 4 : Execute

```
Data_A ──────────┐
                 ├──► ALU ──► Résultat, Flags
Data_B ou Imm ───┘
```

L'ALU effectue l'opération.
Les flags (N, Z, C, V) sont mis à jour si S=1.

---

# Phase 5 : Memory

```
Si LDR : MEM[adresse] → valeur
Si STR : valeur → MEM[adresse]
Sinon  : (rien)
```

Accès mémoire pour LDR/STR uniquement.

---

# Phase 6 : Writeback

```
Résultat ──► MUX ──► Banc de Registres ──► Rd
```

Si `reg_write = 1` ET `cond_ok = 1`, on écrit dans Rd.

---

# Le CondCheck

Vérifie si la condition est satisfaite :

```
cond = 0000 (EQ) et Z = 1  →  ok = 1
cond = 0000 (EQ) et Z = 0  →  ok = 0
cond = 1110 (AL)           →  ok = 1 (toujours)
```

Si `ok = 0`, l'instruction est **annulée**.

---

# Les Multiplexeurs

| Mux | Choix | Signification |
|:----|:------|:--------------|
| ALU_src | 0: Rm, 1: Imm | 2ème opérande |
| Writeback | 0: ALU, 1: MEM | Source du résultat |
| PC_src | 0: PC+4, 1: Branch | Prochaine adresse |

---

# Exemple : ADD R1, R2, R3

```
1110 000 0100 0 0010 0001 00000000 0011
│    │   │    │ │    │              │
│    │   │    │ │    │              └── Rm = R3
│    │   │    │ │    └── Rd = R1
│    │   │    │ └── Rn = R2
│    │   │    └── S = 0
│    │   └── op = ADD
│    └── class = ALU
└── cond = AL (toujours)
```

---

# Parcours de ADD R1, R2, R3

1. **Fetch** : Lire l'instruction à PC
2. **Decode** : class=ALU, reg_write=1
3. **RegRead** : Lire R2 et R3
4. **Execute** : ALU calcule R2 + R3
5. **Memory** : (rien)
6. **Writeback** : Écrire dans R1

---

# Exemple : LDR R0, [R1, #8]

1. **Decode** : class=MEM, mem_read=1
2. **RegRead** : Lire R1
3. **Execute** : ALU calcule R1 + 8
4. **Memory** : Lire MEM[R1+8]
5. **Writeback** : Écrire dans R0

---

# Exemple : B.EQ label

1. **Decode** : class=BRANCH
2. **CondCheck** : Vérifier Z = 1 ?
3. Si oui : PC ← adresse cible
4. Si non : PC ← PC + 4

---

# CPU Mono-cycle vs Pipeline

| Mono-cycle | Pipeline |
|:-----------|:---------|
| 1 instruction à la fois | 5 en parallèle |
| Cycle long | Cycles courts |
| Simple | Plus complexe |
| Notre implémentation | Vrais CPU |

---

# Pipeline 5 Étages

```
         IF    ID    EX   MEM   WB
Instr 1  [====][====][====][====][====]
Instr 2       [====][====][====][====][====]
Instr 3            [====][====][====][====][====]
```

Jusqu'à 5× plus rapide !

---

# Hazards (Problèmes Pipeline)

**Data Hazard :**
```asm
ADD R1, R2, R3    ; Écrit R1
SUB R4, R1, R5    ; Lit R1 → Problème !
```

**Solutions :**
- **Forwarding** : Bypass direct
- **Stall** : Attendre si nécessaire

---

# CPU Visualizer

👉 [Ouvrir le CPU Visualizer](https://seed.music-music.fr/visualizer.html)

**Fonctionnalités :**
- Vue pipeline (5 étapes)
- Registres R0-R15
- Flags NZCV
- Code source avec surlignage
- 7 démos interactives

---

# Ce qu'il faut retenir

1. **Fetch → Decode → Execute → Mem → WB**
2. **Décodeur** analyse les bits
3. **Contrôle** décide quoi activer
4. **MUX** routent les données
5. **CondCheck** permet la prédication
6. **Pipeline** = performances

---

# Questions ?

📚 **Référence :** Livre Seed, Chapitre 05 - CPU

👉 **Exercices :** TD et TP + CPU Visualizer

**Prochain chapitre :** Assembleur
