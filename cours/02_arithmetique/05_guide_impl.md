---
marp: true
theme: seed-slides
paginate: true
header: "Seed - Guide Implémentation"
footer: "ALU32 — Pas à Pas"
---

<!-- _class: lead -->

# Guide : Implémenter l'ALU32

> Du schéma-bloc au code VHDL, étape par étape

---

# Vue d'ensemble

**L'ALU32** est le cœur calculatoire du processeur. Elle reçoit deux opérandes 32 bits et produit un résultat + 4 flags.

```
         ┌──────────────────────┐
  a[31:0]│                      │y[31:0]
 ───────►│       ALU32          ├────────►
  b[31:0]│                      │
 ───────►│                      │N Z C V
  op[3:0]│                      ├────────►
 ───────►│                      │
         └──────────────────────┘
```

**7 opérations + 2 tests :**

| op   | 0000 | 0001 | 0010 | 0011 | 0100 | 0101 | 0110 | 0111 | 1000 |
|------|------|------|------|------|------|------|------|------|------|
| nom  | AND  | EOR  | SUB  | ADD  | ORR  | MOV  | MVN  | CMP  | TST  |

**Plan d'attaque :** 4 étapes — ops logiques → additionneur → arbre de mux → flags

---

# Étape 1 : Opérations logiques

Les plus simples — une ligne de VHDL chacune !

<div class="callout callout-vhdl">

```vhdl
-- Étape 1 : opérations logiques
r_and <= a and b;       -- AND (0000)
r_eor <= a xor b;       -- EOR (0001)
r_orr <= a or b;        -- ORR (0100)
r_mov <= b;             -- MOV (0101) — passe b directement
r_mvn <= not b;         -- MVN (0110) — inverse b
```

</div>

<div class="key-concept">
<div class="key-concept-title">Une ligne par opération !</div>
Les opérateurs <code>and</code>, <code>or</code>, <code>xor</code>, <code>not</code> de VHDL travaillent bit-à-bit sur 32 bits. Pas besoin de boucle.
</div>

**5 opérations sur 7** sont déjà faites. Il reste SUB et ADD — les deux qui nécessitent un additionneur.

---

# Étape 2 : L'additionneur partagé

**Le problème :** ADD et SUB utilisent tous les deux un Add32. Peut-on n'en avoir qu'un seul ?

<div class="key-concept">
<div class="key-concept-title">L'astuce fondamentale</div>
<code>a - b = a + NOT(b) + 1</code><br>
Le complément à 2 transforme la soustraction en addition !
</div>

**L'idée :** un signal `is_sub` contrôle ce qu'on envoie à l'additionneur.

```
              is_sub=0 (ADD)          is_sub=1 (SUB)
  add_b  ←      b                       NOT(b)
  add_cin ←     '0'                      '1'
```

<div class="callout callout-vhdl">

```vhdl
-- Étape 2 : additionneur partagé ADD/SUB
nb <= not b;
add_b   <= nb when is_sub = '1' else b;
add_cin <= is_sub;

u_add: Add32 port map (
    a => a, b => add_b, cin => add_cin,
    y => add_y, cout => add_cout
);
r_sub <= add_y;
r_add <= add_y;  -- même sortie, entrées différentes
```

</div>

---

# Étape 2b : Calcul de is_sub

**Quand faut-il soustraire ?** Pour SUB (`0010`) et CMP (`0111`).

<div class="columns">
<div>

**Analyse des opcodes :**

| op[3] | op[2] | op[1] | op[0] | Opération |
|:-----:|:-----:|:-----:|:-----:|-----------|
|   0   |   0   |   1   |   0   | **SUB**   |
|   0   |   1   |   1   |   1   | **CMP**   |

</div>
<div>

**Expression booléenne :**

```
is_sub = SUB + CMP
       = (¬3 · ¬2 · 1 · ¬0)
       + (¬3 ·  2 · 1 ·  0)
```

</div>
</div>

<div class="callout callout-vhdl">

```vhdl
-- Étape 2b : détection SUB/CMP
is_sub <= (not op(3) and not op(2) and op(1) and not op(0))  -- 0010
       or (not op(3) and     op(2) and op(1) and     op(0)); -- 0111
```

</div>

<div class="callout callout-tip">
<div class="callout-title">Pourquoi CMP est une soustraction ?</div>
CMP R0, R1 calcule R0 - R1 mais <strong>jette le résultat</strong> — seuls les flags comptent. C'est la même opération que SUB, sans écriture dans le registre destination.
</div>

---

# Étape 3 : L'arbre de Mux

**Le problème :** 8 résultats possibles, sélectionnés par `op[2:0]` (3 bits). Comment choisir ?

**Solution :** un arbre de Mux32 à 3 niveaux !

```
  op[0]          op[1]          op[2]
    │              │              │
 ┌──┴──┐       ┌──┴──┐       ┌──┴──┐
 │Mux32│ m0    │     │       │     │
 │AND  │──────►│Mux32│ m01   │     │
 │EOR  │       │     │──────►│     │
 └─────┘       │     │       │Mux32│──► result
 ┌─────┐       │     │       │     │
 │Mux32│ m1    │     │       │     │
 │SUB  │──────►│     │       │     │
 │ADD  │       └─────┘       │     │
 └─────┘                     │     │
 ┌─────┐       ┌─────┐       │     │
 │Mux32│ m2    │     │       │     │
 │ORR  │──────►│Mux32│ m23   │     │
 │MOV  │       │     │──────►│     │
 └─────┘       │     │       │     │
 ┌─────┐       │     │       │     │
 │Mux32│ m3    │     │       └─────┘
 │MVN  │──────►│     │
 │CMP  │       └─────┘
 └─────┘
```

---

# Étape 3b : Mapping op → résultat

**Principe :** `sel=0` → entrée `a`, `sel=1` → entrée `b` du Mux32.

<div class="columns">
<div>

**Niveau 1** — sélection par `op[0]` :

| Mux | sel=0 (op[0]=0) | sel=1 (op[0]=1) |
|-----|-----------------|-----------------|
| m0  | AND (0000)      | EOR (0001)      |
| m1  | SUB (0010)      | ADD (0011)      |
| m2  | ORR (0100)      | MOV (0101)      |
| m3  | MVN (0110)      | CMP (0111)      |

</div>
<div>

**Niveaux 2 & 3 :**

| Mux  | sel=0 | sel=1 | bit sel |
|------|-------|-------|---------|
| m01  | m0    | m1    | op[1]   |
| m23  | m2    | m3    | op[1]   |
| **result** | m01 | m23 | op[2] |

</div>
</div>

<div class="callout callout-vhdl">

```vhdl
-- Étape 3 : arbre de mux (3 niveaux)
u_m0: Mux32 port map (a => r_and, b => r_eor, sel => op(0), y => m0);
u_m1: Mux32 port map (a => r_sub, b => r_add, sel => op(0), y => m1);
u_m2: Mux32 port map (a => r_orr, b => r_mov, sel => op(0), y => m2);
u_m3: Mux32 port map (a => r_mvn, b => r_sub, sel => op(0), y => m3);
u_m01:    Mux32 port map (a => m0,  b => m1,  sel => op(1), y => m01);
u_m23:    Mux32 port map (a => m2,  b => m3,  sel => op(1), y => m23);
u_result: Mux32 port map (a => m01, b => m23, sel => op(2), y => result);
```

</div>

---

# Étape 4 : Flags N et Z

Les deux flags les plus simples.

<div class="columns">
<div>

**N — Negative**

Le bit de poids fort du résultat.

En complément à 2, `result(31) = 1` signifie négatif.

```vhdl
-- Trivial !
n_flag <= result(31);
```

</div>
<div>

**Z — Zero**

Le résultat est-il nul ?

On teste les 32 bits d'un coup grâce au `when`.

```vhdl
z_flag <= '1' when result = 0
          else '0';
```

</div>
</div>

<div class="callout callout-tip">
<div class="callout-title">Cas spécial : TST (op=1000)</div>
TST effectue un AND mais ne modifie pas le résultat visible — uniquement les flags N et Z. Le CPU utilise <code>op(3)</code> pour savoir s'il faut écrire le résultat ou non.
</div>

---

# Étape 4b : Flags C et V

Ces flags ne sont significatifs que pour ADD, SUB et CMP.

<div class="columns">
<div>

**C — Carry**

C'est le `cout` de l'additionneur.

```vhdl
c_flag <= add_cout
    when (op = b"0011"    -- ADD
       or op = b"0010"    -- SUB
       or op = b"0111")   -- CMP
    else '0';
```

</div>
<div>

**V — Overflow (signé)**

Débordement = le signe du résultat est incohérent avec les signes des opérandes.

**Intuition :** positif + positif → négatif ? Erreur !

</div>
</div>

<div class="callout callout-vhdl">

```vhdl
-- V pour ADD : même signe en entrée, signe différent en sortie
v_add <= (    a(31) and     b(31) and not result(31))   -- (+)+(+)→(−)
      or (not a(31) and not b(31) and     result(31));  -- (−)+(−)→(+)

-- V pour SUB : signes opposés en entrée, signe inattendu en sortie
v_sub <= (    a(31) and not b(31) and not result(31))   -- (−)−(+)→(+)
      or (not a(31) and     b(31) and     result(31));  -- (+)−(−)→(−)

v_flag <= v_add when op = b"0011" else
          v_sub when (op = b"0010" or op = b"0111") else '0';
```

</div>

---

<!-- _class: summary -->

# Récapitulatif — ALU32 en 4 étapes

<div class="process-step">
<div class="step-number">1</div>
<div class="step-content">
<div class="step-title">Opérations logiques</div>
5 lignes : <code>r_and</code>, <code>r_eor</code>, <code>r_orr</code>, <code>r_mov</code>, <code>r_mvn</code> — un opérateur VHDL chacune.
</div>
</div>

<div class="process-step">
<div class="step-number">2</div>
<div class="step-content">
<div class="step-title">Additionneur partagé</div>
Un seul <code>Add32</code>. Le signal <code>is_sub</code> bascule entre <code>a+b</code> et <code>a+NOT(b)+1</code>.
</div>
</div>

<div class="process-step">
<div class="step-number">3</div>
<div class="step-content">
<div class="step-title">Arbre de Mux</div>
7 Mux32 sur 3 niveaux. <code>op[0]</code> → <code>op[1]</code> → <code>op[2]</code> sélectionnent le bon résultat.
</div>
</div>

<div class="process-step">
<div class="step-number">4</div>
<div class="step-content">
<div class="step-title">Flags N, Z, C, V</div>
N et Z : trivial sur <code>result</code>. C et V : issus de l'additionneur, uniquement pour ADD/SUB/CMP.
</div>
</div>
