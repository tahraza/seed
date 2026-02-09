---
marp: true
theme: seed-slides
paginate: true
header: "Seed - Guide Implémentation"
footer: "PC & RegFile16 — Pas à Pas"
---

<!-- _class: lead -->

# Guide : Implémenter le PC et le RegFile

> Deux composants séquentiels clés du processeur, pas à pas

---

# PC — Le défi

Le **Program Counter** pointe vers la prochaine instruction à exécuter. Il doit supporter 4 modes :

```
  d[31:0]     inc   load   reset
 ────┬─────   ─┬─   ─┬─    ─┬──
     │         │     │      │
     ▼         ▼     ▼      ▼
   ┌──────────────────────────┐
   │            PC            │
   │                          │──── clk
   └────────────┬─────────────┘
                │
                ▼
            q[31:0]
```

| Mode    | Comportement         | Priorité |
|---------|----------------------|----------|
| reset   | q ← 0x00000000       | **1** (max) |
| load    | q ← d                | 2        |
| inc     | q ← q + 4            | 3        |
| hold    | q ← q (inchangé)     | 4 (min)  |

<div class="key-concept">
<div class="key-concept-title">Le problème central</div>
Comment encoder la priorité <code>reset > load > inc > hold</code> avec uniquement des Mux ?
</div>

---

# PC — Étape 1 : L'incrément

Première brique : calculer `PC + 4` (les instructions ARM font 4 octets).

<div class="callout callout-vhdl">

```vhdl
-- Étape 1 : PC + 4
u_add: Add32 port map (
    a   => pc_out,       -- valeur actuelle du PC
    b   => x"00000004",  -- constante 4
    cin => '0',
    y   => pc_plus4,     -- résultat : PC + 4
    cout => pc_cout      -- ignoré (pas de débordement utile)
);
```

</div>

On a maintenant 4 valeurs candidates pour le prochain PC :

| Signal     | Valeur        | Mode    |
|------------|---------------|---------|
| `pc_out`   | PC actuel     | hold    |
| `pc_plus4` | PC + 4        | inc     |
| `d`        | valeur externe| load    |
| `x"0..0"`  | zéro          | reset   |

---

# PC — Étape 2 : Cascade de Mux

<div class="key-concept">
<div class="key-concept-title">Idée clé</div>
Dans une cascade de Mux, le <strong>dernier</strong> Mux a la priorité la plus haute !<br>
On construit donc de la priorité basse vers la haute.
</div>

```
                     Priorité croissante ──────────────►

  pc_out ──►┌─────┐     ┌─────┐        ┌─────┐
            │Mux32│ m1  │Mux32│ m2     │Mux32│ m3
  pc_plus4─►│sel= │────►│sel= │───────►│sel= │────► vers Register
            │ inc │     │load │        │reset│
            └─────┘  d─►└─────┘ 0x0───►└─────┘
```

<div class="process-step">
<div class="step-number">1</div>
<div class="step-content">
<div class="step-title">Mux inc (priorité basse)</div>
Si <code>inc=1</code> : choisir <code>pc_plus4</code>, sinon garder <code>pc_out</code>.
</div>
</div>

<div class="process-step">
<div class="step-number">2</div>
<div class="step-content">
<div class="step-title">Mux load (priorité moyenne)</div>
Si <code>load=1</code> : choisir <code>d</code>, <strong>écrase</strong> le choix précédent.
</div>
</div>

<div class="process-step">
<div class="step-number">3</div>
<div class="step-content">
<div class="step-title">Mux reset (priorité haute)</div>
Si <code>reset=1</code> : choisir <code>0x00000000</code>, <strong>écrase tout</strong>.
</div>
</div>

---

# PC — Étape 3 : Le registre

**Dernière brique :** le Register qui mémorise la valeur.

**Problème :** si `inc=0`, `load=0`, `reset=0` → on veut **hold** (garder la valeur). Mais si `load='0'` sur le Register, il ne charge rien — parfait ! Sauf qu'il faut quand même charger quand un mode est actif.

<div class="callout callout-vhdl">

```vhdl
-- Étape 3 : charger le registre si un mode est actif
do_load <= inc or load or reset;

u_reg: Register port map (
    clk  => clk,
    d    => m3,        -- sortie de la cascade de Mux
    load => do_load,   -- charger seulement si un mode est actif
    q    => pc_out
);

q <= pc_out;  -- sortie vers l'extérieur
```

</div>

<div class="key-concept">
<div class="key-concept-title">Pourquoi do_load ?</div>
Sans <code>do_load</code>, le Register ne chargerait jamais (load='0' permanent). <code>do_load</code> active le chargement dès qu'un mode est demandé.
</div>

---

# PC — Code complet

<div class="callout callout-vhdl">

```vhdl
architecture rtl of PC is
  signal pc_out, pc_plus4, m1, m2, m3 : bits(31 downto 0);
  signal pc_cout, do_load : bit;
begin
  -- Étape 1 : incrément
  u_add: Add32 port map (
      a => pc_out, b => x"00000004", cin => '0',
      y => pc_plus4, cout => pc_cout);

  -- Étape 2 : cascade de Mux (priorité croissante)
  u_m1: Mux32 port map (a => pc_out,  b => pc_plus4,    sel => inc,   y => m1);
  u_m2: Mux32 port map (a => m1,      b => d,           sel => load,  y => m2);
  u_m3: Mux32 port map (a => m2,      b => x"00000000", sel => reset, y => m3);

  -- Étape 3 : registre
  do_load <= inc or load or reset;
  u_reg: Register port map (clk => clk, d => m3, load => do_load, q => pc_out);

  q <= pc_out;
end architecture;
```

</div>

<div class="key-concept">
<div class="key-concept-title">Pattern : Cascade de Mux = Priorité</div>
Le dernier Mux de la chaîne écrase les précédents → il a la priorité maximale. Ce pattern s'applique partout où il faut encoder une priorité en logique combinatoire.
</div>

---

# RegFile16 — Le défi

Le **Register File** est la mémoire ultra-rapide du processeur : 16 registres de 32 bits.

```
         ┌────────────────────────────────┐
  wd[31:0]│                                │
 ────────►│          RegFile16             │
  wa[3:0] │    16 × Register (32 bits)    │
 ────────►│                                │
  we      │                                │qa[31:0]
 ────────►│   ┌──┬──┬──┬──┬───┬───┬───┐   ├────────►
          │   │R0│R1│R2│..│R13│R14│R15│   │
  ra[3:0] │   │  │  │  │  │ SP│ LR│ PC│   │qb[31:0]
 ────────►│   └──┴──┴──┴──┴───┴───┴───┘   ├────────►
  rb[3:0] │                                │
 ────────►│                                │
          └────────────────────────────────┘
                        ▲
                        │ clk
```

**Contrainte clé :** 2 lectures simultanées + 1 écriture, en un seul cycle.

---

# RegFile16 — Étape 1 : Décodage écriture

**Le problème :** on a `we` (write enable global) + `wa[3:0]` (adresse). Il faut produire 16 signaux `we0..we15` — un seul actif à la fois.

<div class="callout callout-vhdl">

```vhdl
-- Étape 1 : décodage de l'adresse d'écriture
we0  <= we when wa = b"0000" else '0';
we1  <= we when wa = b"0001" else '0';
we2  <= we when wa = b"0010" else '0';
we3  <= we when wa = b"0011" else '0';
-- ...
we14 <= we when wa = b"1110" else '0';
we15 <= we when wa = b"1111" else '0';
```

</div>

**Comment ça marche :**

```
  we=1, wa=0101 (registre 5)
  ───────────────────────────
  we0='0', we1='0', ..., we5='1', ..., we15='0'
                          ▲
                    seul R5 écrira !
```

<div class="callout callout-tip">
<div class="callout-title">C'est un décodeur !</div>
Ce pattern <code>when/else</code> est équivalent à un décodeur 4-vers-16 combiné avec un enable.
</div>

---

# RegFile16 — Étape 2 : Les 16 registres

Chaque registre reçoit la **même donnée** `wd`, mais **seul celui** dont le `weN='1'` écrit.

```
         wd ──────────┬──────────┬──── ··· ───┬──────────┐
                      │          │             │          │
                      ▼          ▼             ▼          ▼
  we0 ──► ┌────────┐  we1 ──► ┌────────┐    ┌────────┐  we15
          │Register│          │Register│    │Register│◄──
          │   R0   │          │   R1   │    │  R15   │
          └───┬────┘          └───┬────┘    └───┬────┘
              │ r0                │ r1          │ r15
              ▼                   ▼              ▼
```

<div class="callout callout-vhdl">

```vhdl
-- Étape 2 : instancier les 16 registres
u_r0:  Register port map (clk => clk, d => wd, load => we0,  q => r0);
u_r1:  Register port map (clk => clk, d => wd, load => we1,  q => r1);
u_r2:  Register port map (clk => clk, d => wd, load => we2,  q => r2);
-- ...
u_r14: Register port map (clk => clk, d => wd, load => we14, q => r14);
u_r15: Register port map (clk => clk, d => wd, load => we15, q => r15);
```

</div>

---

# RegFile16 — Étape 3 : Lecture avec Mux16Way32

**Deux Mux16Way32** indépendants — un par port de lecture.

```
  r0 r1 r2 ... r15        r0 r1 r2 ... r15
   │  │  │      │           │  │  │      │
   ▼  ▼  ▼      ▼           ▼  ▼  ▼      ▼
  ┌──────────────┐          ┌──────────────┐
  │ Mux16Way32   │          │ Mux16Way32   │
  │  sel = ra    │          │  sel = rb    │
  └──────┬───────┘          └──────┬───────┘
         │                         │
         ▼                         ▼
     qa[31:0]                  qb[31:0]
```

<div class="callout callout-vhdl">

```vhdl
-- Étape 3 : lecture combinatoire (instantanée !)
u_muxa: Mux16Way32 port map (
    r0 => r0, r1 => r1, r2 => r2, r3 => r3,
    r4 => r4, r5 => r5, r6 => r6, r7 => r7,
    r8 => r8, r9 => r9, r10 => r10, r11 => r11,
    r12 => r12, r13 => r13, r14 => r14, r15 => r15,
    sel => ra, y => qa);

u_muxb: Mux16Way32 port map (
    -- mêmes entrées, sel différent
    r0 => r0, r1 => r1, ..., r15 => r15,
    sel => rb, y => qb);
```

</div>

<div class="key-concept">
<div class="key-concept-title">Lecture combinatoire</div>
Pas de clock nécessaire pour lire ! Le Mux sélectionne instantanément le bon registre. L'écriture, elle, attend le front montant de <code>clk</code>.
</div>

---

# RegFile16 — Code complet

<div class="callout callout-vhdl">

```vhdl
architecture rtl of RegFile16 is
  signal we0, we1, ..., we15 : bit;
  signal r0, r1, ..., r15 : bits(31 downto 0);
begin
  -- Étape 1 : décodage écriture
  we0 <= we when wa = b"0000" else '0';
  we1 <= we when wa = b"0001" else '0';
  -- ... (16 lignes identiques)
  we15 <= we when wa = b"1111" else '0';

  -- Étape 2 : 16 registres
  u_r0:  Register port map (clk=>clk, d=>wd, load=>we0,  q=>r0);
  u_r1:  Register port map (clk=>clk, d=>wd, load=>we1,  q=>r1);
  -- ... (16 instances)
  u_r15: Register port map (clk=>clk, d=>wd, load=>we15, q=>r15);

  -- Étape 3 : lecture combinatoire
  u_muxa: Mux16Way32 port map (r0=>r0, ..., r15=>r15, sel=>ra, y=>qa);
  u_muxb: Mux16Way32 port map (r0=>r0, ..., r15=>r15, sel=>rb, y=>qb);
end architecture;
```

</div>

---

# RegFile16 — Pourquoi 2 ports de lecture ?

Considérons l'instruction : **`ADD R2, R0, R1`** (R2 ← R0 + R1)

<div class="columns">
<div>

**En un seul cycle :**

<div class="process-step">
<div class="step-number">1</div>
<div class="step-content">
<div class="step-title">Lire R0 et R1</div>
Port A : <code>ra=0000</code> → <code>qa = R0</code><br>
Port B : <code>rb=0001</code> → <code>qb = R1</code>
</div>
</div>

<div class="process-step">
<div class="step-number">2</div>
<div class="step-content">
<div class="step-title">Calculer R0 + R1</div>
L'ALU reçoit <code>qa</code> et <code>qb</code>
</div>
</div>

<div class="process-step">
<div class="step-number">3</div>
<div class="step-content">
<div class="step-title">Écrire dans R2</div>
<code>wa=0010</code>, <code>wd=résultat</code>, <code>we=1</code>
</div>
</div>

</div>
<div>

**Avec 1 seul port ?**

Il faudrait **2 cycles** pour lire les opérandes — le processeur serait 2× plus lent !

```
Cycle 1 : lire R0
Cycle 2 : lire R1
Cycle 3 : calculer + écrire R2
```

vs.

```
Cycle 1 : lire R0 ET R1
           calculer + écrire R2
```

</div>
</div>

<div class="callout callout-arm">
Les processeurs ARM ont même <strong>3 ports de lecture</strong> pour les instructions complexes (ex : STR avec offset).
</div>

---

<!-- _class: summary -->

# Récapitulatif — Patterns clés

<div class="key-concept">
<div class="key-concept-title">1. Cascade de Mux = Priorité</div>
Le dernier Mux de la chaîne a la priorité la plus haute. Utilisé dans le PC pour <code>reset > load > inc > hold</code>.
</div>

<div class="key-concept">
<div class="key-concept-title">2. Décodage when/else = Démultiplexeur</div>
<code>weN <= we when wa = N else '0'</code> — active un seul registre parmi 16. C'est un décodeur d'adresse.
</div>

<div class="key-concept">
<div class="key-concept-title">3. Lecture combinatoire multi-port</div>
Un Mux par port de lecture. Pas besoin de clock pour lire — les Mux sont combinatoires. C'est ce qui permet 2 lectures + 1 écriture en un cycle.
</div>
