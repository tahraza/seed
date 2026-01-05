# TOOLS

Ce document decrit le mode d'emploi des outils CLI du projet, avec une
explication exhaustive de leur role, leurs entrees/sorties, et les erreurs
possibles. Il est organise en pipeline top-down, puis detaille chaque outil.

## 1. Pipeline d'utilisation (top-down)

### 1.1 Definition des sources
1) HDL (VHDL-like): ecrire les entites/architectures dans des fichiers .hdl.
2) A32 (ASM): ecrire les programmes assembleur dans des fichiers .a32.
3) (Optionnel) Linker script A32LDS: definir le layout sections/entry/stack
   dans un fichier .lds.
4) C-like: ecrire les sources dans des fichiers .c.
5) (Optionnel) Tests A32: ecrire un .ref associe a chaque .a32.
6) (Optionnel) Tests HDL: ecrire un script .tst pour piloter le simulateur HDL.

### 1.2 HDL flow
1) Preparer un .tst qui charge le top entity et les fichiers .hdl.
2) Lancer hdl_cli pour interpreter le script.
3) Le script controle: set/expect, eval, tick/tock/step.

### 1.3 A32 flow (assembleur + binaire)
1) Assembler le .a32 en .a32b via a32_cli.
2) Charger le .a32b dans le simulateur web ou le runner.
3) (Optionnel) Utiliser un .lds pour changer les bases sections et l'entry.

### 1.4 C-like flow (compilateur -> ASM -> binaire)
1) Compiler le .c en .a32 via c32_cli.
2) Assembler le .a32 en .a32b via a32_cli.
3) Executer le .a32b via a32_runner ou le panel web A32.

### 1.5 A32 flow (tests de reference)
1) Placer .a32 et .ref dans le meme dossier (meme nom de base).
2) Executer a32_runner sur un fichier ou un dossier.
3) Le runner assemble, charge, execute, puis compare la sortie aux attentes.

### 1.6 Web flow (interaction)
1) Generer un .a32b avec a32_cli.
2) Charger le .a32b dans la page web (panel A32).
3) Step/Run/Reset et lire la sortie.

### 1.7 CPU Visualizer (visualisation pedagogique)
1) Lancer le serveur web (`npm run dev` dans le dossier `web`).
2) Ouvrir `http://localhost:5173` et cliquer sur "CPU Visualizer".
3) Choisir une demo ou charger un fichier .asm/.a32.
4) Utiliser Step/Play pour voir l'execution en temps reel.

### 1.8 Architectures CPU disponibles

Le projet propose **deux implementations** du CPU A32 :

| Implementation | Type | Utilisation |
|:---------------|:-----|:------------|
| **Mono-cycle (Rust)** | `a32_core/src/sim.rs` | CPU Visualizer, a32_runner, IDE web, tests |
| **Pipeline (HDL)** | `hdl_lib/05_cpu/CPU_Pipeline.hdl` | Exercices HDL, hdl_cli |

**CPU Mono-cycle** (simulateur Rust) :
- Chaque instruction s'execute entierement en un seul "step"
- Pas de hazards, pas de forwarding
- Simple, comportement previsible
- Utilise par tous les outils d'execution (runner, visualizer, web)

**CPU Pipeline 5 etages** (HDL) :
- Vrai pipeline avec registres IF/ID, ID/EX, EX/MEM, MEM/WB
- Detection de hazards (HazardDetect.hdl)
- Forwarding des donnees (ForwardUnit.hdl)
- Realiste, montre les defis du design CPU
- Utilise pour l'apprentissage hardware via hdl_cli

> **Note :** Le CPU Visualizer affiche les etapes (Fetch, Decode, Execute, Memory, Writeback) de maniere pedagogique, mais l'execution sous-jacente est mono-cycle.

### 1.9 Utiliser le CPU Pipeline HDL

Le CPU Pipeline HDL (`hdl_lib/05_cpu/CPU_Pipeline.hdl`) est un vrai CPU 5 etages avec hazard detection et forwarding. Voici comment l'utiliser :

**Etape 1 : Creer un script de test**

Creer un fichier `test_pipeline.tst` :
```
-- Charger le CPU Pipeline et toutes ses dependances
load CPU_Pipeline hdl_lib/05_cpu/CPU_Pipeline.hdl
     hdl_lib/05_cpu/IF_ID_Reg.hdl
     hdl_lib/05_cpu/ID_EX_Reg.hdl
     hdl_lib/05_cpu/EX_MEM_Reg.hdl
     hdl_lib/05_cpu/MEM_WB_Reg.hdl
     hdl_lib/05_cpu/HazardDetect.hdl
     hdl_lib/05_cpu/ForwardUnit.hdl
     hdl_lib/05_cpu/Decoder.hdl
     hdl_lib/05_cpu/Control.hdl
     hdl_lib/05_cpu/CondCheck.hdl
     hdl_lib/04_seq/RegFile16.hdl
     hdl_lib/03_arith/ALU32.hdl
     hdl_lib/03_arith/Shifter32.hdl
     hdl_lib/03_arith/Add32.hdl
     hdl_lib/04_seq/PC.hdl
     hdl_lib/02_multibit/Mux32.hdl;

-- Reset
set reset 1;
step;
set reset 0;

-- Simuler une instruction (fournir via instr_data)
set instr_data 0xE2100005;   -- ADD R1, R0, #5
step;                         -- IF: fetch
step;                         -- ID: decode
step;                         -- EX: execute
step;                         -- MEM: memory
step;                         -- WB: writeback

-- Verifier que le CPU n'est pas arrete
expect halted 0;
```

**Etape 2 : Executer le test**

```bash
cargo run -p hdl_cli -- test_pipeline.tst
```

**Etape 3 : Observer les signaux**

Ajouter des `output` pour voir les signaux internes :
```
output instr_addr;    -- Adresse instruction (PC)
output mem_addr;      -- Adresse memoire
output mem_read;      -- Signal lecture memoire
output mem_write;     -- Signal ecriture memoire
output halted;        -- CPU arrete?
```

**Composants HDL du Pipeline :**

| Fichier | Role |
|:--------|:-----|
| `CPU_Pipeline.hdl` | Top-level : assemble tous les composants |
| `IF_ID_Reg.hdl` | Registre pipeline IF→ID (instruction, PC+4) |
| `ID_EX_Reg.hdl` | Registre pipeline ID→EX (registres, immediats, controle) |
| `EX_MEM_Reg.hdl` | Registre pipeline EX→MEM (resultat ALU, donnees) |
| `MEM_WB_Reg.hdl` | Registre pipeline MEM→WB (resultat final) |
| `HazardDetect.hdl` | Detecte les load-use hazards, genere stall |
| `ForwardUnit.hdl` | Detecte les dependances, selectionne le forwarding |

**Exemple de test avec forwarding :**

```
-- Deux instructions dependantes (R1 produit puis consomme)
-- ADD R1, R0, #5    ; R1 = 5
-- ADD R2, R1, #3    ; R2 = R1 + 3 = 8 (forwarding EX→EX)
set instr_data 0xE2100005; step;  -- ADD R1, R0, #5 entre dans IF
set instr_data 0xE2210003; step;  -- ADD R2, R1, #3 entre dans IF
                                   -- ForwardUnit bypass R1 de EX vers EX
```

**Exemple de test avec stall (load-use hazard) :**

```
-- LDR suivi d'une instruction qui utilise le resultat
-- LDR R1, [R0]      ; R1 = mem[R0]
-- ADD R2, R1, #3    ; R2 = R1 + 3 (stall necessaire)
set instr_data 0xE5100000; step;  -- LDR R1, [R0]
set instr_data 0xE2210003; step;  -- ADD R2, R1, #3
                                   -- HazardDetect insere un stall
step;                              -- Cycle supplementaire (stall)
```

## 2. Outils CLI (mode d'emploi + explication exhaustive)

### 2.1 hdl_cli

**Role**
- Interprete un script .tst pour simuler des designs HDL.
- Utilise hdl_core pour parser, elaborer, puis simuler.

**Usage**
```
hdl_cli <test.tst>
```
Avec Cargo:
```
cargo run -p hdl_cli -- path/to/test.tst
```

**Entrees**
- Fichier .tst (script ligne par ligne).
- Fichiers .hdl referencés par `load`.

**Sorties**
- Aucun fichier genere.
- En cas d'erreur: message "error: ..." sur stderr, exit code 1.
- Si usage invalide: exit code 2.

**Syntaxe du script .tst**
Chaque ligne est un ordre. Les lignes vides et commentaires sont ignores.
Commentaires acceptes: `# ...`, `// ...`, `-- ...`.

Commandes:
- `load <TopEntity> <file1.hdl> [file2.hdl ...]`
  - Parse et assemble tous les fichiers HDL.
  - Elabore le top entity.
  - Oblige d'etre appele avant toute autre commande.

- `clock <signal>`
  - Change le signal d'horloge utilise par tick/tock/step.
  - Par defaut: `clk`.

- `set <signal> <value>`
  - Force la valeur d'un signal.
  - `value` utilise les formats ci-dessous.

- `eval`
  - Evalue la logique combinatoire jusqu'a stabilite.

- `tick`
  - Met l'horloge a 1 puis execute le front montant.

- `tock`
  - Met l'horloge a 0 puis execute le front descendant.

- `step`
  - Raccourci: tick puis tock.

- `expect <signal> <value>`
  - Compare la valeur courante du signal avec la valeur attendue.
  - L'attendu est resize (zero-extend) a la largeur du signal.
  - Erreur si mismatch: "line N: expect <signal> != got".

**Formats de valeurs**
- Bit: `0` ou `1`
- Binaire: `0b1010` ou `b"1010"`
- Hex: `0x2A` ou `x"2A"`
- Decimal: `42` ou `-1`

**Erreurs typiques**
- `load requires ...`: top manquant ou aucun fichier.
- `simulator not loaded`: set/eval/tick/tock/step/expect sans load.
- `unknown command`: mot-cle non reconnu.

**Exemple minimal**
```
load HalfAdder examples/half_adder.hdl
set a 1
set b 0
eval
expect sum 1
```

### 2.2 a32_cli

**Role**
- Assemble un fichier .a32 en binaire A32B (.a32b).
- Utilise a32_asm et les specs A32-Lite.

**Usage**
```
a32_cli <input.a32> [-o output.a32b]
```
Avec Cargo:
```
cargo run -p a32_cli -- path/to/prog.a32
cargo run -p a32_cli -- path/to/prog.a32 -o out/prog.a32b
```

**Entrees**
- Fichier .a32 (ASM). Syntaxe: README.md section 2.8.
- Directives: README.md section 2.9.

**Sorties**
- Fichier .a32b (format A32B, SPECS.md section 3).
- Nom par defaut: meme nom de base que le .a32.
- En cas d'erreur: message "error: ..." + code E1xxx/E3xxx.

**Ce que fait l'assembleur**
- Parse le code, calcule les labels et sections.
- Genere des literal pools (LDR Rd, =imm32) dans .text.
- Encode en A32-Lite (cond, classes ALU/LS/Branch/System).
- Produit un binaire A32B avec segments text/data/bss.

**Erreurs typiques**
- `E1001`: mnemonic inconnu.
- `E1002`: operand invalide, directive invalide, suffix invalid.
- `E1004`: immediate/offset hors plage.
- `E1006`: label duplique.
- `E1008`: literal pool overflow.
- `E1009`: ordre suffix invalide (ex: .cond avant .S).
- `E3002`: entry manquant.
- `E3004`: layout depasse la taille RAM (si config ram_size utilisee).

**Exemple**
```
; prog.a32
.text
.global _start
_start:
  MOV R0, #7
  SVC #0x10
```
```
cargo run -p a32_cli -- prog.a32
```

### 2.3 a32_runner

**Role**
- Lance des tests A32 a partir de paires `.a32` + `.ref`.
- Assemble, charge, execute, puis compare aux attentes.
- Supporte un linker script A32LDS via `LINKER` dans .ref.

**Usage**
```
a32_runner <path>
```
Avec Cargo:
```
cargo run -p a32_runner -- tests
cargo run -p a32_runner -- tests/T01_alu_flags.a32
```

**Entrees**
- Soit un dossier (scanne tous les .a32), soit un fichier .a32.
- Chaque .a32 attend un .ref du meme nom de base.

**Sorties**
- Aucune sortie de fichier.
- Si un test echoue, liste des erreurs et exit code 1.
- Si OK, exit code 0 (pas de sortie).

**Format .ref (resume)**
Voir SPECS.md section 2.1 pour le format complet.
Lignes valides:
- `CONFIG ram_size <value>`
- `CONFIG strict_traps <true|false>`
- `LINKER <path/to/script.lds>`
- `ERROR <E1004>`
- `EXIT <code>`
- `OUT "text\n"`
- `REG R0 <value>`
- `FLAG Z <0|1>`
- `MEM <addr> <value>`
- `TRAP <MISALIGNED|MEM_FAULT|ILLEGAL|DIV_ZERO>`
- `TRAPPC <addr>`, `TRAPADDR <addr>`, `TRAPINSTR <word>`

**Regles cle**
- Si `ERROR` est present, le runner attend un echec d'assemblage et ignore
  les autres lignes.
- Sinon, il execute le binaire et compare EXIT/OUT/REG/FLAG/MEM.
- `OUT` compare une sortie exacte (par defaut sortie vide).
- `TRAP` est exclusif d'un EXIT.
- `CONFIG` s'applique au test courant.

**Linker script A32LDS**
Voir SPECS.md section 26.
Directives supportees:
- `ENTRY <symbol>`
- `SECTION <name> BASE <addr> ALIGN <pow2>`
- `ORDER ...` (valide les noms, ignore l'ordre au runtime)
- `STACK <size>` (SP = ram_size - size)
- `SYMBOL <name> = <expr>`

Le runner:
- Resolue `LINKER` relatif au .ref.
- Applique le layout aux sections text/data/bss.
- Verifie les overlaps/overflow RAM (codes E3001/E3004).

**Execution**
- RAM par defaut: 0x00100000
- strict_traps par defaut: true
- max_steps: 1_000_000
- MMIO: 0xFFFF0000 (putc), 0xFFFF0004 (getc), 0xFFFF0010 (exit)

**Exemple**
```
; tests/MyTest.ref
CONFIG strict_traps false
EXIT 0
REG R0 0x1234
```
```
cargo run -p a32_runner -- tests/MyTest.a32
```

### 2.4 a32_cli + web (workflow rapide)

1) Assembler:
```
cargo run -p a32_cli -- prog.a32
```
2) Charger `prog.a32b` dans la page web (panel A32).
3) Utiliser Step/Run/Reset pour voir la sortie.

### 2.5 c32_cli

**Role**
- Compile un fichier C-like (.c) en assembleur A32-Lite (.a32).
- Cible volontairement le format texte `.a32` pour faciliter le reverse engineering.

**Usage**
```
c32_cli <input.c> [-o output.a32]
```
Avec Cargo:
```
cargo run -p c32_cli -- path/to/prog.c
cargo run -p c32_cli -- path/to/prog.c -o out/prog.a32
```

**Entrees**
- Fichier .c conforme au subset de README.md section 3 (types/ops/ABI).

**Sorties**
- Fichier .a32 (assembleur A32-Lite).
- Nom par defaut: meme nom de base que le .c.
- En cas d'erreur: message "error: ..." + code E2xxx.

**Etat actuel (MVP)**
Le compilateur est volontairement minimal:
- Supporte uniquement des fonctions sans parametres.
- Supporte `return <constante>` et les appels a `putc`, `getc`, `exit` avec
  arguments immediats numeriques.
- Pas de variables, pas de `if/while/for`, pas de types complexes.
- Les fonctions doivent retourner explicitement; sinon `E2008`.

**Exemple**
```
int main() {
  return 7;
}
```
```
cargo run -p c32_cli -- main.c
```
Puis assembler et executer:
```
cargo run -p a32_cli -- main.a32
cargo run -p a32_runner -- main.a32
```

## 3. Outils Web

### 3.1 CPU Visualizer

**Role**
- Interface web interactive pour visualiser l'execution du CPU A32.
- Affiche le pipeline, les registres, les flags, la memoire et le cache.
- Permet d'executer du code assembleur pas-a-pas ou en continu.

**Acces**
```bash
cd web
npm install
npm run dev
# Ouvrir http://localhost:5173 -> CPU Visualizer
```

**Panneaux**

| Panneau | Description |
|:--------|:------------|
| **Architecture CPU** | Affiche les 5 etapes du pipeline (Fetch, Decode, Execute, Memory, Writeback) |
| **Registres** | Affiche R0-R15 avec alias (SP, LR, PC) et flags NZCV |
| **Code Source** | Affiche le code assembleur avec coloration syntaxique et surlignage de la ligne courante |
| **Memoire/Cache** | Vue memoire, statistiques cache, contenu des lignes cache |

**Demos integrees**

| Demo | Fichier | Concept illustre |
|:-----|:--------|:-----------------|
| Addition | 01_addition.asm | Instructions ALU basiques |
| Boucle | 02_boucle.asm | Branchements conditionnels |
| Memoire | 03_memoire.asm | LDR/STR |
| Condition | 04_condition.asm | Predication |
| Tableau | 05_tableau.asm | Boucle + acces memoire |
| Flags | 06_flags.asm | Drapeaux NZCV |
| Cache | 07_cache.asm | Cache hits/misses |

**Controles**

| Bouton | Raccourci | Action |
|:-------|:----------|:-------|
| Reset | Ctrl+R | Reinitialise le CPU |
| Step | N, F10 | Execute une instruction |
| Play/Pause | Espace | Lance/arrete l'execution continue |
| Vitesse | Slider 1-10 | Ajuste la vitesse d'animation |

**Charger du code**
- Cliquer sur "Charger fichier"
- Formats acceptes: `.asm`, `.a32`, `.s`, `.a32b`
- Le code est assemble automatiquement (sauf .a32b deja binaire)

**Affichages en temps reel**
- **Registres modifies** : Flash vert sur le registre qui change
- **Flags modifies** : Animation sur le flag qui change
- **Cache hit/miss** : Indicateur vert (HIT) ou rouge (MISS)
- **Ligne courante** : Surlignage jaune dans le code source

## 4. Statut par outil (resume)

| Outil | Statut | Notes |
| --- | --- | --- |
| hdl_cli | OK | Parser + simulateur + script .tst fonctionnels. |
| a32_cli | OK | Assembleur A32-Lite stable, produit A32B. |
| a32_runner | OK | Tests A32 .a32/.ref + support A32LDS. |
| c32_cli | MVP | C-like -> A32 texte, subset tres reduit. |
| CPU Visualizer | OK | Interface web pour visualisation du CPU. |

## 5. Limitations connues

- c32_cli: pas de variables, pas de controle de flux, pas de types complets.
- c32_cli: arguments de fonctions non supportes.
- c32_cli: pas d'ABI complet (seulement appels built-ins).
- A32 HDL: CPU A32-Lite en HDL pas encore implemente (a venir).
