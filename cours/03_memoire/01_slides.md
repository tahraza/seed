---
marp: true
theme: seed-slides
paginate: true
header: "Seed - Chapitre 03"
footer: "Logique Séquentielle et Mémoire"
---

# Chapitre 03 : Logique Séquentielle et Mémoire

> "Le temps est ce qui empêche tout d'arriver en même temps." — John Wheeler

---

# 🎯 Où en sommes-nous ?

```
┌─────────────────────────────────┐
│  8. Applications                │
├─────────────────────────────────┤
│  ...                            │
├─────────────────────────────────┤
│  3. Mémoire (RAM)    ◀── NOUS   │
├─────────────────────────────────┤
│  2. Arithmétique (ALU) ✓        │
├─────────────────────────────────┤
│  1. Portes Logiques ✓           │
└─────────────────────────────────┘
```

Nous apprenons à **mémoriser** !

---

# Le Problème de l'État

```c
x = x + 1;
```

Pour exécuter cette instruction :

1. **Lire** la valeur actuelle de `x`
2. **Calculer** `x + 1` (avec l'ALU)
3. **Écrire** le résultat dans `x`

**Sans mémoire, pas de "valeur actuelle" !**

---

# Combinatoire vs Séquentiel

| Circuits Combinatoires | Circuits Séquentiels |
|:-----------------------|:---------------------|
| Sortie = f(entrées) | Sortie = f(entrées, **état**) |
| Pas de mémoire | A de la mémoire |
| Pas d'horloge | Synchronisé par horloge |
| Ex: AND, OR, ALU | Ex: Registres, RAM, CPU |

---

# L'Horloge (Clock)

Signal qui oscille entre 0 et 1 à fréquence fixe :

```
      ┌───┐   ┌───┐   ┌───┐
clk ──┘   └───┘   └───┘   └───
      ↑       ↑       ↑
   Front   Front   Front
   montant montant montant
```

**Front montant** = passage de 0 à 1 = moment de capture

---

# Pourquoi l'Horloge ?

**Problème :** Les signaux se propagent avec délai

**Solution :** L'horloge synchronise tout

- Pendant clk = 0 : les circuits calculent
- Sur front montant : les résultats sont capturés

**1 GHz = 1 milliard de cycles/seconde**

---

# La Bascule D (DFF)

**DFF** = Data Flip-Flop = atome de mémoire

```
        ┌─────┐
   d ───┤     │
        │ DFF ├─── q
  clk ──┤     │
        └─────┘
```

**Règle fondamentale :** `q(t) = d(t-1)`

La sortie = l'entrée du cycle précédent

---

# Comportement de la DFF

```
clk:   ──┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐
         └─┘ └─┘ └─┘ └─┘ └─

  d:   ──[A]───[B]───[C]───[D]──

  q:   ──[?]───[A]───[B]───[C]──
```

La sortie est "en retard" d'un cycle !

---

# Le Problème : Garder une Valeur

La DFF mémorise UN cycle, puis prend la nouvelle valeur.

**On veut :**
- Si `load = 1` : stocker la nouvelle valeur
- Si `load = 0` : **conserver** l'ancienne

---

# La Solution : Rétroaction

```
           ┌─────┐
  in ──────┤     │
           │ Mux ├────┬───────── out
  ┌────────┤     │    │
  │   sel──┤     │    │
  │  (load)└─────┘    │
  │                   │
  │   ┌─────┐         │
  └───┤ DFF │◄────────┘
      └─────┘
```

Si load=0 : Mux choisit la sortie DFF (conservation)
Si load=1 : Mux choisit `in` (nouvelle valeur)

---

# Registre 1-bit : C'est Magique !

```vhdl
entity BitReg is
  port(
    d    : in bit;
    load : in bit;
    q    : out bit
  );
end entity;
```

Cette boucle transforme un délai en **mémoire permanente** !

> 💡 **En VHDL :** `process(clk)` avec `if rising_edge(clk)`.

---

# Registre 32-bits

**32 registres 1-bit en parallèle :**

```
         d[31:0]        load
            │             │
    ┌───────┼───────┬─────┤
    ▼       ▼       ▼     │
┌──────┬──────┬──────┐    │
│Bit31 │ ...  │ Bit0 │◄───┘
└──┬───┴──────┴──┬───┘
   │             │
   q[31]     q[0]
```

Tous les bits sont capturés **simultanément**.

---

# Registres du CPU nand2c

| Registre | Rôle |
|:--------:|:-----|
| R0-R12 | Registres généraux |
| R13 (SP) | Stack Pointer |
| R14 (LR) | Link Register (retour fonction) |
| R15 (PC) | Program Counter |

> 💡 **En ARM :** Même organisation ! (ABI compatible)

---

# La RAM (Random Access Memory)

**RAM = Tableau de registres adressables**

```
        ┌─────┐
   in ──┤     │
        │     │
address─┤ RAM ├── out
        │     │
  load ─┤     │
        └─────┘
```

- `address` : numéro de la cellule
- `load` : 1 = écrire, 0 = juste lire

---

# Architecture RAM8

```
       load  address[2:0]    in
         │        │          │
    ┌────▼────────▼──────────┤
    │      DMux8Way          │
    └────┬───┬───────┬───────┘
         │   │       │
    ┌────▼─┐ │  ┌────▼─┐
    │Reg 0 │...│Reg 7 │
    └────┬─┘   └────┬─┘
         │         │
    ┌────▼─────────▼────┐
    │    Mux8Way        │
    └─────────┬─────────┘
              │
             out
```

---

# Construction Hiérarchique

**RAM64 = 8 × RAM8**

```
address[5:0] = [5:3] + [2:0]
                 │       │
         Quelle RAM8    Quel mot dans RAM8
```

Pattern **récursif** : RAM512 = 8 × RAM64, etc.

---

# Le Compteur de Programme (PC)

Le PC contient l'adresse de la **prochaine instruction**.

**Modes (par priorité) :**

| Priorité | Mode | Action |
|:--------:|:-----|:-------|
| 1 | reset | PC ← 0 |
| 2 | load | PC ← in |
| 3 | inc | PC ← PC + 1 |
| 4 | hold | PC ← PC |

---

# Cycle d'Exécution du CPU

À chaque cycle d'horloge :

1. **Fetch** : Lire l'instruction à PC
2. **Decode** : Comprendre l'instruction
3. **Execute** : Faire le calcul (ALU)
4. **Update PC** : Incrémenter ou sauter

Le PC est le **cœur battant** de l'ordinateur !

---

# Hiérarchie Mémoire

```
         Registres    ← Plus rapide, plus petit
              │
              ▼
           Cache
              │
              ▼
            RAM
              │
              ▼
           Disque     ← Plus lent, plus grand
```

On implémente : **Registres** et **RAM**

---

# Ce qu'il faut retenir

1. **L'horloge synchronise** : Front montant = capture
2. **DFF = atome** : `q(t) = d(t-1)`
3. **Rétroaction = persistance** : Mux + DFF
4. **RAM = tableau** : DMux + Registres + Mux
5. **PC = guide** : reset > load > inc > hold

---

# Questions ?

📚 **Référence :** Livre Seed, Chapitre 03 - Mémoire

👉 **Exercices :** TD et TP disponibles

**Prochain chapitre :** Architecture Machine (ISA)
