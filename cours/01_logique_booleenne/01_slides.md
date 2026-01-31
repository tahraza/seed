---
marp: true
theme: seed-slides
paginate: true
header: "Seed - Chapitre 01"
footer: "Logique Booléenne"
---

# Chapitre 01 : Logique Booléenne

> "Au commencement était le NAND."

---

# 🎯 Où en sommes-nous ?

```
┌─────────────────────────────────┐
│  8. Applications                │
├─────────────────────────────────┤
│  7. Système d'exploitation      │
├─────────────────────────────────┤
│  ...                            │
├─────────────────────────────────┤
│  2. Arithmétique (ALU)          │
├─────────────────────────────────┤
│  1. Portes Logiques ◀── NOUS    │
└─────────────────────────────────┘
```

Nous posons les **fondations** de tout l'édifice !

---

# Pourquoi le Binaire ?

**Question :** Pourquoi 0 et 1, pas 0-9 ?

**Réponses :**

1. **Fiabilité** : Distinguer 2 états est plus fiable que 10
2. **Simplicité** : Un transistor = un interrupteur (on/off)
3. **Universalité** : George Boole (19ᵉ) : toute logique = Vrai/Faux

---

# Du Voltage au Bit

| Tension | Signification |
|---------|---------------|
| 0V - 0.8V | `0` (Faux) |
| 2.4V - 3.3V | `1` (Vrai) |

La zone 0.8V-2.4V est **interdite** — c'est cette séparation nette qui rend le binaire robuste.

> 💡 **En VHDL :** On retrouve `'0'` et `'1'` comme valeurs de type `std_logic`.

---

# La Porte NAND : Notre Axiome

**Pourquoi partir du NAND ?**

1. **Complétude** : TOUTES les portes peuvent être construites à partir de NAND
2. **Réalité** : En CMOS, NAND = seulement 4 transistors
3. **Pédagogie** : Une brique → comprendre l'abstraction

---

# Table de Vérité NAND

| A | B | NAND(A, B) |
|---|---|:----------:|
| 0 | 0 | **1** |
| 0 | 1 | **1** |
| 1 | 0 | **1** |
| 1 | 1 | **0** |

**Règle :** Le résultat est `0` *seulement si* A **et** B sont à `1`.

NAND = "Not-AND" = inverse d'un AND

---

# Construction : NOT (Inverseur)

**Astuce :** Connecter le même signal aux deux entrées !

```
       ┌─────┐
  in ──┤     │
       │NAND ├── out
  in ──┤     │
       └─────┘
```

- Si `in = 0` : NAND(0, 0) = **1** ✓
- Si `in = 1` : NAND(1, 1) = **0** ✓

---

# Construction : AND

**Insight :** NOT(NAND(A, B)) = AND(A, B)

```
       ┌─────┐     ┌─────┐
  A ───┤     │     │     │
       │NAND ├─────┤ NOT ├── out
  B ───┤     │     │     │
       └─────┘     └─────┘
```

| A | B | AND |
|---|---|:---:|
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | **1** |

---

# Construction : OR

**Théorème de De Morgan :**
```
A OR B = NOT( (NOT A) AND (NOT B) )
       = (NOT A) NAND (NOT B)
```

```
       ┌─────┐
  A ───┤ NOT ├───┐
       └─────┘   │  ┌─────┐
                 ├──┤     │
       ┌─────┐   │  │NAND ├── out
  B ───┤ NOT ├───┘  │     │
       └─────┘      └─────┘
```

---

# Construction : XOR (Ou Exclusif)

**Rôle crucial :**
- Addition binaire (somme sans retenue)
- Comparaison (bits différents ?)
- Cryptage

| A | B | XOR |
|---|---|:---:|
| 0 | 0 | 0 |
| 0 | 1 | **1** |
| 1 | 0 | **1** |
| 1 | 1 | 0 |

**Sortie = 1 si les entrées sont différentes**

---

# Le Multiplexeur (Mux) — L'Aiguilleur

**Le composant le plus important !**

- Si `sel == 0` → `out = a`
- Si `sel == 1` → `out = b`

```
  a ──┐
      ├──[Mux]── out
  b ──┘    │
           │
         sel
```

**Formule :** `out = (a AND NOT sel) OR (b AND sel)`

---

# Pourquoi le Mux est Crucial ?

Dans un CPU, à chaque cycle il faut choisir :

- **D'où vient l'opérande ?** Mémoire ou registre ?
- **Où va le résultat ?** Mémoire ou registre ?
- **Quelle instruction ?** ADD, SUB, AND... ?

**Chaque choix = un Mux !**

> 💡 **En ARM :** Le CPU utilise des Mux pour sélectionner parmi R0-R15.

---

# Le Démultiplexeur (DMux)

**L'inverse du Mux** : 1 entrée → N sorties

- Si `sel == 0` → `a = in, b = 0`
- Si `sel == 1` → `a = 0, b = in`

**Usage :** Adressage mémoire, routage des signaux

---

# HDL : Description Matérielle

```vhdl
entity And2 is
  port(
    a : in bit;
    b : in bit;
    y : out bit
  );
end entity;

architecture rtl of And2 is
  component Nand port(a,b: in bit; y: out bit); end component;
  component Inv port(a: in bit; y: out bit); end component;
  signal w : bit;
begin
  u1: Nand port map (a => a, b => b, y => w);
  u2: Inv port map (a => w, y => y);
end architecture;
```

---

# Pont avec VHDL Professionnel

> 💡 **En VHDL industriel :**

| nand2c HDL | VHDL standard |
|------------|---------------|
| `bit` | `std_logic` |
| `bits(31 downto 0)` | `std_logic_vector(31 downto 0)` |
| `port map` | Identique ! |
| `for generate` | Identique ! |

**Vous apprenez la vraie syntaxe VHDL !**

---

# Portes Multi-Entrées

**Or8Way :** Teste si au moins 1 bit parmi 8 est à 1

```
Or8Way(a[0..7]) = a[0] OR a[1] OR ... OR a[7]
```

**Construction en arbre** (3 niveaux au lieu de 7) :

```
Niveau 1:  Or2(a[0],a[1])→t0  Or2(a[2],a[3])→t1 ...
Niveau 2:  Or2(t0, t1) → t4   Or2(t2, t3) → t5
Niveau 3:  Or2(t4, t5) → sortie
```

---

# Portes Multi-Bits (Bus)

Pour traiter 32 bits en parallèle :

```vhdl
entity And32 is
  port(
    a : in bits(31 downto 0);
    b : in bits(31 downto 0);
    y : out bits(31 downto 0)
  );
end entity;

architecture rtl of And32 is
begin
  gen: for i in 0 to 31 generate
    u: And2 port map (a => a(i), b => b(i), y => y(i));
  end generate;
end architecture;
```

---

# Du NAND au CPU : La Feuille de Route

```
CHAPITRE 1        CHAPITRE 2        CHAPITRE 3        CHAPITRE 5
    ↓                  ↓                 ↓                 ↓
  NAND           Half Adder          DFF              CPU
    ↓                  ↓                 ↓                 ↓
NOT, AND, OR  →  Full Adder  →    Registres    →   Ordinateur
XOR, Mux, DMux       ↓                 ↓           complet !
                   ALU              RAM
```

---

# Rôle de Chaque Porte

| Porte | Rôle dans le CPU |
|-------|------------------|
| **NOT** | Soustraction (complément à 2) |
| **AND** | Masquage de bits, conditions ET |
| **OR** | Combinaison de signaux |
| **XOR** | Addition bit à bit |
| **Mux** | Tous les choix du CPU |
| **DMux** | Adressage mémoire |

---

# Ce qu'il faut retenir

1. **Le binaire simplifie** : 2 états plus fiables que 10
2. **NAND est universel** : Toutes les portes en découlent
3. **L'abstraction est puissante** : Couches les unes sur les autres
4. **Mux = choix, DMux = routage**

---

# Questions ?

📚 **Référence :** Livre Seed, Chapitre 01 - Logique Booléenne

👉 **Exercices :** TD et TP disponibles

**Prochain chapitre :** Arithmétique (ALU)
