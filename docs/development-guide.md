# Seed - Guide de développement

## Prérequis

| Outil | Version | Installation |
|-------|---------|--------------|
| **Rust** | Edition 2021 | https://rustup.rs |
| **wasm-pack** | Latest | `cargo install wasm-pack` |
| **Node.js** | 18+ | https://nodejs.org |
| **Pandoc** | Latest | `apt install pandoc` (optionnel, pour le livre) |
| **XeLaTeX** | Latest | `apt install texlive-full` (optionnel, pour le livre) |

## Installation rapide

```bash
# Cloner le projet
git clone <repo-url>
cd seed

# Compiler tous les crates Rust
cargo build

# Installer les dépendances web
cd web && npm install && cd ..

# Lancer le dev server
cd web && npm run dev
# Ouvrir http://localhost:5173
```

## Commandes principales

### Rust

| Commande | Description |
|----------|-------------|
| `cargo build` | Compiler tous les crates |
| `cargo build --release` | Build optimisé |
| `cargo test --all` | Lancer tous les tests unitaires |
| `cargo clippy` | Linter Rust |
| `cargo doc --open` | Générer la documentation |

### CLI Tools

| Commande | Description |
|----------|-------------|
| `cargo run -p hdl_cli -- <file.tst>` | Simuler un circuit HDL |
| `cargo run -p a32_cli -- <file.a32>` | Assembler vers .a32b |
| `cargo run -p a32_cli -- <file.a32> -o out.a32b` | Avec fichier de sortie |
| `cargo run -p a32_runner -- tests/` | Tests de référence A32 |
| `cargo run -p c32_cli -- <file.c>` | Compiler C vers .a32 |
| `cargo run -p c32_runner -- tests_c/` | Tests de référence C |

### Web

| Commande | Description |
|----------|-------------|
| `cd web && npm run dev` | Dev server (localhost:5173) |
| `cd web && npm run build:wasm` | Recompiler WASM |
| `cd web && npm run build` | Build production |
| `cd web && npm run preview` | Preview du build |

### Livre

| Commande | Description |
|----------|-------------|
| `cd book && ./build.sh` | Générer PDF + HTML |
| `cd book && ./build-solutions.sh` | Générer les solutions |

## Workflows de développement

### Modifier le simulateur CPU

```bash
# 1. Éditer le code
vi a32_core/src/sim.rs

# 2. Tester
cargo test -p a32_core
cargo run -p a32_runner -- tests/

# 3. Recompiler WASM pour le web
cd web && npm run build:wasm
```

### Modifier l'assembleur

```bash
# 1. Éditer
vi a32_asm/src/parser.rs  # ou assemble.rs

# 2. Tester
cargo test -p a32_asm
cargo run -p a32_runner -- tests/

# 3. Recompiler WASM
cd web && npm run build:wasm
```

### Modifier le compilateur C

```bash
# 1. Éditer
vi c32_core/src/codegen.rs

# 2. Tester
cargo test -p c32_core
cargo run -p c32_runner -- tests_c/

# 3. Recompiler WASM
cd web && npm run build:wasm
```

### Modifier l'interface web

```bash
# 1. Lancer le dev server
cd web && npm run dev

# 2. Éditer (HMR automatique)
vi web/visualizer.js

# 3. Le navigateur recharge automatiquement
```

### Ajouter une nouvelle instruction CPU

1. **Définir l'encodage** : `a32_core/src/isa.rs`
2. **Implémenter l'exécution** : `a32_core/src/sim.rs`
3. **Parser dans l'assembleur** : `a32_asm/src/parser.rs`
4. **Encoder** : `a32_asm/src/assemble.rs`
5. **Ajouter un test** : `tests/Txx_new_instr.a32` + `.ref`
6. **Recompiler WASM** : `cd web && npm run build:wasm`

## Structure des tests

### Tests A32 (.a32 + .ref)

```
tests/
├── T01_alu_flags.a32    # Code assembleur
├── T01_alu_flags.ref    # Résultat attendu
└── ...
```

Format `.ref` :
```
EXIT 0           # Code de sortie attendu
REG R0 42        # Valeur registre attendue
FLAG Z 1         # Flag attendu
OUT "Hello\n"    # Sortie console attendue
MEM 0x20000 0xFF # Valeur mémoire attendue
```

### Tests C (.c + .ref)

```
tests_c/
├── T01_sum_to.c     # Code C
├── T01_sum_to.ref   # Résultat attendu
└── ...
```

### Tests HDL (.tst + .cmp)

```
hdl_tests/
├── 01_basic_gates/
│   ├── And2.tst     # Script de test
│   └── And2.cmp     # Valeurs attendues
└── ...
```

## FAQ Développeur

### J'ai modifié du Rust mais le web ne change pas ?

Tu as oublié de recompiler le WASM :
```bash
cd web && npm run build:wasm
```

### Quel crate modifier pour... ?

| Objectif | Crate |
|----------|-------|
| Changer le comportement CPU | `a32_core/src/sim.rs` |
| Ajouter une instruction | `a32_core/src/isa.rs` + `a32_asm/src/` |
| Modifier le compilateur C | `c32_core/src/codegen.rs` |
| Changer le simulateur HDL | `hdl_core/src/sim.rs` |
| Modifier l'interface web | `web/*.js` |

### Pourquoi `web/pkg/` est versionné ?

Pour permettre de cloner et lancer `npm run dev` sans avoir Rust installé.

### Comment ajouter un test de référence ?

1. Créer `tests/Txx_name.a32` avec le code
2. Créer `tests/Txx_name.ref` avec les assertions
3. Lancer `cargo run -p a32_runner -- tests/`

## État technique et améliorations futures

### CI/CD recommandé

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo test --all
      - run: cargo clippy -- -D warnings

  wasm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo install wasm-pack
      - run: cd web_sim && wasm-pack build --target web
```

### Roadmap c32_core

| Phase | Features | Statut |
|-------|----------|--------|
| MVP | `return`, appels built-ins | ✅ |
| Phase 1 | Variables locales, `if/else` | 🔲 |
| Phase 2 | `while`, `for` | 🔲 |
| Phase 3 | Paramètres de fonctions | 🔲 |
| Phase 4 | Pointeurs, tableaux | 🔲 |

---

*Documentation générée automatiquement par BMAD Document Project Workflow*
