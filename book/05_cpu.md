# Le Processeur (CPU)

> "Si vous ne pouvez pas le construire, vous ne le comprenez pas." — Richard Feynman

C'est le grand moment. Nous allons assembler toutes les pièces du puzzle — portes logiques, ALU, registres, mémoire — pour construire le **cœur de l'ordinateur** : le CPU A32.

---

## Où en sommes-nous ?

```
┌─────────────────────────────────────────────────────────────────┐
│                     COUCHE 7: Applications                       │
├─────────────────────────────────────────────────────────────────┤
│                  COUCHE 6: Système d'Exploitation                │
├─────────────────────────────────────────────────────────────────┤
│                 COUCHE 5: Langage de Haut Niveau (C32)           │
├─────────────────────────────────────────────────────────────────┤
│                      COUCHE 4: Compilateur                       │
├─────────────────────────────────────────────────────────────────┤
│                   COUCHE 3: Assembleur (A32 ASM)                 │
├─────────────────────────────────────────────────────────────────┤
│                 COUCHE 2: Architecture Machine (ISA)             │
├─────────────────────────────────────────────────────────────────┤
│  ══════════════► COUCHE 1: CPU - L'Aboutissement ◄══════════════│
│          (Nous assemblons tout : ALU + RAM + Registres)          │
│                    (Vous êtes ici !)                             │
├─────────────────────────────────────────────────────────────────┤
│                     COUCHE 0: La Porte NAND                      │
└─────────────────────────────────────────────────────────────────┘
```

Ce chapitre est le **point culminant** de tout le travail matériel. Après ce chapitre, vous aurez construit un ordinateur complet capable d'exécuter du vrai code !

---

## Qu'est-ce qu'un CPU ?

### Le chef d'orchestre

Le CPU (Central Processing Unit) est le composant qui :
1. **Lit** les instructions depuis la mémoire
2. **Décode** ces instructions pour comprendre quoi faire
3. **Exécute** les opérations (calculs, accès mémoire, branchements)
4. **Répète** à l'infini (jusqu'à HALT)

C'est une machine à états qui exécute une instruction après l'autre, inlassablement.

### Ce que nous avons construit jusqu'ici

| Chapitre | Composant | Rôle dans le CPU |
|:---------|:----------|:-----------------|
| 1 | Portes logiques | Briques de base de tout circuit |
| 2 | ALU | Effectue les calculs (ADD, SUB, AND...) |
| 3 | Registres | Stockent les données du CPU (R0-R15) |
| 3 | PC | Pointe vers l'instruction courante |
| 3 | RAM | Stocke le programme et les données |
| 4 | ISA | Définit les instructions à supporter |

### Ce qu'il reste à construire

- **Décodeur** : Analyse les bits de l'instruction
- **Unité de contrôle** : Décide quoi activer
- **Multiplexeurs de données** : Routent les données entre composants
- **Le CPU lui-même** : L'assemblage final

---

## Architecture du CPU (Data Path)

Voici le schéma complet du CPU. Chaque flèche est un fil (ou un bus de 32 fils). Chaque boîte est un composant que vous avez construit ou que vous allez construire.

```
                            ┌──────────────────────────────────────────┐
                            │           UNITÉ DE CONTRÔLE              │
                            │  (génère tous les signaux de contrôle)   │
                            └──────────────────┬───────────────────────┘
                                               │
          Signaux de contrôle : reg_write, mem_read, mem_write, alu_op, etc.
                                               │
    ┌──────────────────────────────────────────┼──────────────────────────────┐
    │                                          │                              │
    │   ┌───────┐     ┌──────────────┐        │        ┌──────────────┐      │
    │   │       │     │   MÉMOIRE    │        │        │   DÉCODEUR   │      │
    │   │  PC   ├────►│ INSTRUCTIONS ├───────────────►│  (analyse    │      │
    │   │       │     │              │        │        │  les bits)   │      │
    │   └───┬───┘     └──────────────┘        │        └──────┬───────┘      │
    │       │              │                  │               │              │
    │       │              │ instruction      │               │              │
    │       ▼              ▼                  │               ▼              │
    │   ┌───────┐                             │         Rd, Rn, Rm, Imm      │
    │   │ ADD 4 │                             │               │              │
    │   └───┬───┘                             │               ▼              │
    │       │                                 │        ┌─────────────┐       │
    │       │ PC+4                            │        │  REGISTRES  │       │
    │       │                                 │        │   (R0-R15)  │       │
    │       ▼                                 │        └──────┬──────┘       │
    │   ┌───────┐                             │               │              │
    │   │  MUX  │ ← (Branch ou PC+4?)         │         Rn    │    Rm        │
    │   └───┬───┘                             │          │    │    │         │
    │       │                                 │          ▼    │    ▼         │
    │       │ Nouvelle valeur de PC           │        ┌──────┴────────┐     │
    │       │                                 │        │      MUX      │     │
    │       └─────────────────────────────────┼───────►│  (Rm ou Imm?) │     │
    │                                         │        └───────┬───────┘     │
    │                                         │                │             │
    │                                         │                ▼             │
    │                                         │        ┌───────────────┐     │
    │                                         │        │      ALU      │     │
    │                                         │        │  (ADD, SUB...)│     │
    │                                         │        └───────┬───────┘     │
    │                                         │                │             │
    │                                         │          Résultat + Flags    │
    │                                         │                │             │
    │                                         │                ▼             │
    │                                         │        ┌───────────────┐     │
    │                                         │        │   MÉMOIRE     │     │
    │                                         │        │   DONNÉES     │     │
    │                                         │        │ (LDR/STR)     │     │
    │                                         │        └───────┬───────┘     │
    │                                         │                │             │
    │                                         │                ▼             │
    │                                         │        ┌───────────────┐     │
    │                                         │        │      MUX      │     │
    │                                         └───────►│ (ALU ou MEM?) │     │
    │                                                  └───────┬───────┘     │
    │                                                          │             │
    │                                                          ▼             │
    │                                                  Valeur à écrire       │
    │                                                  dans le registre Rd   │
    │                                                                        │
    └────────────────────────────────────────────────────────────────────────┘
```

### Les flux de données

1. **Fetch** : PC → Mémoire Instructions → Instruction (32 bits)
2. **Decode** : Instruction → Décodeur → (Rd, Rn, Rm, Imm, opcode)
3. **Register Read** : Rn, Rm → Banc de Registres → Valeurs
4. **Execute** : Valeurs → ALU → Résultat
5. **Memory** : Résultat → Mémoire Données (si LDR/STR)
6. **Writeback** : Résultat → Registre Rd

---

## Les Composants du CPU

### 1. Le Compteur de Programme (PC)

Vous l'avez déjà construit au Chapitre 3 ! Le PC contient l'adresse de l'instruction courante.

**Modes de fonctionnement** :
- `inc = 1` : PC ← PC + 4 (instruction suivante)
- `load = 1` : PC ← adresse de branchement
- `reset = 1` : PC ← 0 (redémarrage)

### 2. Le Décodeur (Decoder)

Le décodeur est un circuit **purement combinatoire** qui "découpe" les 32 bits de l'instruction.

```
                    Instruction (32 bits)
                           │
              ┌────────────┴────────────┐
              │                         │
              │        DÉCODEUR         │
              │                         │
              └─┬──┬──┬──┬──┬──┬──┬──┬──┘
                │  │  │  │  │  │  │  │
               cond class op S Rn Rd Rm imm12 imm24
```

**Sorties du décodeur** :
| Signal | Bits | Description |
|:-------|:-----|:------------|
| `cond` | 31-28 | Code de condition (EQ, NE, LT...) |
| `class` | 27-25 | Classe d'instruction (ALU, MEM, BRANCH) |
| `op` | 24-21 | Opération ALU (ADD, SUB, AND...) |
| `S` | 20 | Mettre à jour les drapeaux ? |
| `Rn` | 19-16 | Registre source 1 |
| `Rd` | 15-12 | Registre destination |
| `Rm` | 3-0 | Registre source 2 |
| `imm12` | 11-0 | Valeur immédiate (12 bits) |
| `imm24` | 23-0 | Offset de branchement (24 bits) |

Le décodeur ne fait que du **câblage** — il ne calcule rien, il ne fait que router les bits vers les bonnes sorties.

### 3. L'Unité de Contrôle (Control)

L'unité de contrôle est le **chef d'orchestre**. Elle regarde la classe et l'opcode, et décide quels signaux activer.

```
                  ┌────────────────────────────────┐
                  │       UNITÉ DE CONTRÔLE        │
      class ─────►│                                │
      opcode ────►│   (Grande table de vérité)     │
      cond ──────►│                                │
      flags ─────►│                                │
                  └─┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┘
                    │  │  │  │  │  │  │  │  │  │
              reg_write  │  │  │  │  │  │  │  │
                 mem_read│  │  │  │  │  │  │  │
                 mem_write  │  │  │  │  │  │  │
                   alu_src  │  │  │  │  │  │  │
                     branch │  │  │  │  │  │  │
                       ...   ...
```

**Exemples de signaux de contrôle** :

| Instruction | reg_write | mem_read | mem_write | alu_src | branch |
|:------------|:---------:|:--------:|:---------:|:-------:|:------:|
| ADD | 1 | 0 | 0 | 0 (reg) | 0 |
| ADD #imm | 1 | 0 | 0 | 1 (imm) | 0 |
| LDR | 1 | 1 | 0 | 1 (imm) | 0 |
| STR | 0 | 0 | 1 | 1 (imm) | 0 |
| B | 0 | 0 | 0 | X | 1 |
| CMP | 0 | 0 | 0 | 0 | 0 |

### 4. Le Vérificateur de Condition (CondCheck)

Ce petit circuit vérifie si la condition est satisfaite.

**Entrées** :
- `cond` : Le code de condition (4 bits, ex: 0000 = EQ)
- `flags` : Les drapeaux NZCV

**Sortie** :
- `ok` : 1 si la condition est vraie, 0 sinon

```
  cond = 0000 (EQ) et Z = 1  →  ok = 1
  cond = 0000 (EQ) et Z = 0  →  ok = 0
  cond = 1110 (AL)           →  ok = 1 (toujours)
```

**Pourquoi est-ce important ?**

Si `ok = 0`, l'instruction est "annulée" — on n'écrit pas dans le registre, on ne fait pas le branchement. C'est la **prédication** en action !

### 5. Le Banc de Registres (RegFile)

Vous l'avez construit au Chapitre 3 (RAM8, RAM16...). Le banc de registres est une RAM spéciale avec :
- **2 ports de lecture** : Lire Rn ET Rm simultanément
- **1 port d'écriture** : Écrire dans Rd

```
               ┌─────────────────────────────┐
    Rn (4b) ──►│                             ├───► Data_A (32b)
    Rm (4b) ──►│       BANC DE REGISTRES     ├───► Data_B (32b)
               │          (16 × 32 bits)     │
    Rd (4b) ──►│                             │
   Data_W ────►│                             │
    we ───────►│                             │
               └─────────────────────────────┘
```

### 6. Les Multiplexeurs

Les multiplexeurs routent les données entre les composants :

| Mux | Choix | Signification |
|:----|:------|:--------------|
| **ALU_src** | 0: Rm, 1: Imm | Deuxième opérande de l'ALU |
| **Writeback** | 0: ALU, 1: MEM | Source de la valeur à écrire |
| **PC_src** | 0: PC+4, 1: Branch | Prochaine valeur du PC |

---

## Le Cycle d'Exécution en Détail

Notre CPU est **single-cycle** : chaque instruction s'exécute en un seul cycle d'horloge.

### Phase 1 : Fetch (Récupération)

```
PC ──► Mémoire Instructions ──► instruction (32 bits)
```

Le PC envoie son adresse à la mémoire d'instructions. La mémoire renvoie les 32 bits de l'instruction.

### Phase 2 : Decode (Décodage)

```
instruction ──► Décodeur ──► cond, class, op, Rn, Rd, Rm, imm
                   │
                   └──► Unité de Contrôle ──► signaux
```

Le décodeur découpe l'instruction. L'unité de contrôle décide quoi activer.

### Phase 3 : Register Read (Lecture des registres)

```
Rn, Rm ──► Banc de Registres ──► Data_A, Data_B
```

Les valeurs des registres sources sont lues.

### Phase 4 : Execute (Exécution)

```
Data_A ──────────────────┐
                         ├──► ALU ──► Résultat, Flags
Data_B ou Imm ──► MUX ───┘
```

L'ALU effectue l'opération. Les drapeaux sont mis à jour (si S=1).

### Phase 5 : Memory (Accès mémoire)

```
                    ┌─── Si LDR : MEM[addr] → valeur
Résultat (adresse) ─┤
                    └─── Si STR : valeur → MEM[addr]
```

Pour les instructions LDR/STR, on accède à la mémoire de données.

### Phase 6 : Writeback (Écriture)

```
Résultat (ALU ou MEM) ──► MUX ──► Banc de Registres ──► Rd
```

Si `reg_write = 1` ET `cond_ok = 1`, on écrit dans le registre destination.

### Phase 7 : PC Update

```
        ┌─── Si branch : PC + (offset × 4)
PC+4 ───┤
        └─── Sinon : PC + 4
```

Le PC est mis à jour pour le prochain cycle.

---

## Implémentation du CPU en HDL

Voici un squelette de l'architecture du CPU :

```vhdl
entity CPU is
  port(
    clk      : in bit;
    reset    : in bit;
    -- Interface mémoire
    instr    : in bits(31 downto 0);
    mem_in   : in bits(31 downto 0);
    pc_out   : out bits(31 downto 0);
    mem_addr : out bits(31 downto 0);
    mem_out  : out bits(31 downto 0);
    mem_we   : out bit
  );
end entity;

architecture rtl of CPU is
  -- Signaux internes
  signal pc, pc_next : bits(31 downto 0);
  signal cond, op : bits(3 downto 0);
  signal rd, rn, rm : bits(3 downto 0);
  signal imm12 : bits(11 downto 0);
  signal data_a, data_b, alu_result : bits(31 downto 0);
  signal reg_write, mem_read, mem_write, alu_src, branch : bit;
  signal n_flag, z_flag, c_flag, v_flag, cond_ok : bit;

begin
  -- Instanciation des composants
  u_decoder: Decoder port map (...);
  u_control: Control port map (...);
  u_condcheck: CondCheck port map (...);
  u_regfile: RegFile port map (...);
  u_alu: ALU port map (...);
  u_pc: PC port map (...);

  -- Multiplexeurs
  alu_b <= imm12 when alu_src = '1' else data_b;
  writeback <= mem_in when mem_read = '1' else alu_result;
  pc_next <= branch_addr when (branch and cond_ok) = '1' else pc_plus_4;

end architecture;
```

---

## Exercices Pratiques

### Exercices sur le Simulateur Web

Lancez le **Simulateur Web** et allez dans **HDL Progression** → **Projet 5 : CPU**.

| Exercice | Description | Difficulté |
|----------|-------------|:----------:|
| `Decoder` | Découper l'instruction en champs | ⭐⭐ |
| `CondCheck` | Vérifier les conditions (EQ, NE, LT...) | ⭐⭐ |
| `Control` | Générer les signaux de contrôle | ⭐⭐⭐ |
| `CPU` | L'assemblage final ! | ⭐⭐⭐⭐ |

### Ordre de progression

1. **Decoder** : Commencez par là. C'est du pur câblage.
   - Utilisez la syntaxe `instr(31 downto 28)` pour extraire les bits

2. **CondCheck** : Table de vérité des conditions
   - EQ : Z = 1
   - NE : Z = 0
   - LT : N ≠ V
   - etc.

3. **Control** : La logique de commande
   - Pour chaque classe d'instruction, décidez les signaux
   - Attention aux cas spéciaux (CMP ne fait pas reg_write)

4. **CPU** : L'assemblage final
   - Suivez le schéma du data path
   - N'oubliez pas les multiplexeurs !

### Tests en ligne de commande

```bash
# Tester le décodeur
cargo run -p hdl_cli -- test hdl_lib/05_cpu/Decoder.hdl

# Tester le CPU complet
cargo run -p hdl_cli -- test hdl_lib/05_cpu/CPU.hdl
```

---

## Conseils de Débogage

### Le PC reste à 0 ?
- Vérifiez que `inc = 1` par défaut
- Vérifiez que le reset n'est pas bloqué

### Les branchements ne marchent pas ?
- L'offset dans l'instruction est en mots (× 4 pour avoir des octets)
- Vérifiez que `cond_ok` est correct
- Vérifiez le calcul de l'adresse de branchement

### Rien ne s'écrit dans les registres ?
- `reg_write` doit être à 1
- `cond_ok` doit être à 1
- Le registre destination ne doit pas être R15 (géré à part)

### LDR/STR ne fonctionne pas ?
- Vérifiez le calcul de l'adresse (base + offset)
- Vérifiez les signaux `mem_read` et `mem_write`
- Attention à l'alignement (adresses multiples de 4)

---

## Le Lien avec la Suite

**Félicitations !** Vous venez de construire un ordinateur complet.

Ce CPU que vous avez construit peut maintenant :
- Exécuter des programmes écrits en assembleur (Chapitre 6)
- Exécuter des programmes compilés depuis C32 (Chapitre 7-8)
- Faire tourner un système d'exploitation minimal (Chapitre 9)

### Le parcours complet

```
Chapitre 1-5 : MATÉRIEL
    NAND → Portes → ALU → Mémoire → CPU
                              ↓
Chapitre 6-9 : LOGICIEL
    Assembleur → Compilateur → Langage C32 → OS
```

À partir de maintenant, nous passons du côté **logiciel**. Le matériel est terminé !

---

## Ce qu'il faut retenir

1. **Le CPU orchestre tout** : Fetch → Decode → Execute → Memory → Writeback

2. **Le décodeur analyse** : 32 bits → signaux individuels

3. **L'unité de contrôle décide** : Quels composants activer

4. **Les multiplexeurs routent** : Les données entre composants

5. **Les drapeaux permettent les conditions** : NZCV → CondCheck → ok/pas ok

6. **Single-cycle = simple** : Tout en un cycle (mais lent en vrai)

**Prochaine étape** : Au Chapitre 6, nous construirons l'**Assembleur** — le programme qui traduit le code assembleur en binaire exécutable par votre CPU.

---

**Conseil** : Si vous avez réussi le CPU, vous avez accompli quelque chose de remarquable. Prenez le temps de savourer : vous avez construit un ordinateur complet, de la porte NAND au processeur fonctionnel !
