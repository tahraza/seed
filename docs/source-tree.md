# Seed - Arborescence source

## Structure complète

```
seed/
├── 📄 Cargo.toml              # Workspace Rust (10 crates)
├── 📄 README.md               # Spécifications HDL, ISA, C-like
├── 📄 SPECS.md                # Exemples, tests, format binaire
├── 📄 TOOLS.md                # Guide CLI complet
├── 📄 TODO.md                 # Roadmap et tâches
│
├── 🦀 RUST TOOLCHAIN ─────────────────────────────────────────
│   │
│   ├── hdl_core/              # 📦 Bibliothèque HDL
│   │   └── src/
│   │       ├── lib.rs         # Exports publics
│   │       ├── lexer.rs       # Tokenizer HDL
│   │       ├── parser.rs      # Parser → AST
│   │       ├── ast.rs         # Structures AST
│   │       ├── elab.rs        # Élaboration netlist
│   │       ├── sim.rs         # Simulateur cycle
│   │       ├── value.rs       # BitVec et valeurs
│   │       ├── error.rs       # Gestion erreurs
│   │       └── test_runner.rs # Runner tests .tst
│   │
│   ├── hdl_cli/               # 🔧 CLI simulateur HDL
│   │   └── src/main.rs        # Point d'entrée
│   │
│   ├── a32_core/              # 📦 Simulateur CPU A32-Lite
│   │   └── src/
│   │       ├── lib.rs         # Exports: Machine, Cpu, Memory
│   │       ├── cpu.rs         # État CPU (registres, flags)
│   │       ├── isa.rs         # Définitions ISA
│   │       ├── mem.rs         # Gestion mémoire
│   │       ├── cache.rs       # Cache simulé
│   │       └── sim.rs         # Simulateur principal
│   │
│   ├── a32_asm/               # 📦 Assembleur A32
│   │   ├── src/
│   │   │   ├── lib.rs         # Export: assemble_a32b()
│   │   │   ├── lexer.rs       # Tokenizer ASM
│   │   │   ├── parser.rs      # Parser ASM
│   │   │   ├── ast.rs         # Instructions AST
│   │   │   ├── assemble.rs    # Génération binaire
│   │   │   └── error.rs       # Codes erreur E1xxx
│   │   └── tests/
│   │       └── asm_tests.rs   # Tests unitaires
│   │
│   ├── a32_cli/               # 🔧 CLI assembleur
│   │   └── src/main.rs        # a32_cli <input.a32>
│   │
│   ├── a32_runner/            # 🔧 Runner tests A32
│   │   └── src/main.rs        # Exécute .a32 + .ref
│   │
│   ├── c32_core/              # 📦 Compilateur C-like
│   │   └── src/
│   │       ├── lib.rs         # Export: compile_to_a32()
│   │       ├── lexer.rs       # Tokenizer C
│   │       ├── parser.rs      # Parser C
│   │       ├── ast.rs         # AST C
│   │       ├── codegen.rs     # Génération A32
│   │       └── error.rs       # Codes erreur E2xxx
│   │
│   ├── c32_cli/               # 🔧 CLI compilateur
│   │   └── src/main.rs        # c32_cli <input.c>
│   │
│   ├── c32_runner/            # 🔧 Runner tests C
│   │   └── src/main.rs        # Exécute .c + .ref
│   │
│   └── web_sim/               # 📦 Bindings WebAssembly
│       └── src/lib.rs         # WasmHdl, WasmA32 (wasm-bindgen)
│
├── 🌐 WEB VISUALIZER ─────────────────────────────────────────
│   │
│   └── web/
│       ├── index.html         # 🏠 Page principale IDE
│       ├── visualizer.html    # 🎯 CPU Visualizer
│       ├── guide.html         # 📖 Guide interactif
│       ├── app.js             # Application principale
│       ├── visualizer.js      # Logique CPU Visualizer
│       ├── *.js               # Autres modules JS
│       ├── *.css              # Styles
│       ├── vite.config.js     # Configuration Vite
│       ├── package.json       # Dépendances npm
│       ├── pkg/               # 📦 WASM compilé
│       ├── demos/             # Programmes démo
│       └── tests/             # Tests HDL navigateur
│
├── 🔌 HDL LIBRARY ────────────────────────────────────────────
│   │
│   └── hdl_lib/
│       ├── 00_primitive/      # Nand (base)
│       ├── 01_gates/          # Not, And, Or, Xor, Mux, DMux
│       ├── 02_multibit/       # Versions 16/32 bits
│       ├── 03_arith/          # Adders, ALU32, Shifter32
│       ├── 04_seq/            # DFF, Registres, RAM, PC
│       ├── 05_cpu/            # CPU complet + Pipeline
│       ├── 06_io/             # Screen, Keyboard
│       └── 07_cache/          # CacheLine, CacheDirectMapped
│
├── 📚 BOOK ───────────────────────────────────────────────────
│   │
│   └── book/
│       ├── 00_introduction.md → 13_concepts_avances.md
│       ├── metadata.yaml      # Config Pandoc
│       ├── build.sh           # Script génération
│       ├── images/            # Diagrammes SVG
│       └── references/        # Cartes de référence
│
├── 🧪 TESTS ──────────────────────────────────────────────────
│   │
│   ├── tests/                 # Tests A32 (18 tests)
│   ├── tests_c/               # Tests C (53 tests)
│   └── hdl_tests/             # Tests HDL (35 tests)
│
├── 🎮 DEMOS ──────────────────────────────────────────────────
│   │
│   └── demos/
│       ├── 01_hello/          # Hello World
│       ├── 02_fibonacci/      # Calcul Fibonacci
│       ├── 03_graphics/       # Rendu écran
│       ├── 04_snake/          # Jeu Snake
│       ├── 05_shell/          # Mini shell
│       ├── 06_coroutines/     # Coroutines
│       └── 07_scheduler/      # Scheduler préemptif
│
└── 📖 DOCS ───────────────────────────────────────────────────
    │
    └── docs/
        ├── 00_hdl/            # Progression HDL
        ├── 01_architecture/   # Vue d'ensemble
        ├── 03_compilateur/    # Lexer, parser, codegen
        ├── 04_os/             # Bare metal, drivers, shell
        ├── 05_timer_interrupts/ # Timer, interruptions
        └── exercices/         # Exercices par niveau
```

## Statistiques

| Partie | Fichiers | Lignes (approx.) |
|--------|----------|------------------|
| Rust Toolchain | 35 .rs | ~8000 |
| Web Visualizer | 15 .js | ~4000 |
| HDL Library | 56 .hdl | ~2000 |
| Book | 16 .md | ~5000 |
| Tests | 106 fichiers | ~2000 |

## Points d'entrée

| Partie | Point d'entrée | Description |
|--------|----------------|-------------|
| HDL CLI | `hdl_cli/src/main.rs` | Simulateur HDL |
| A32 CLI | `a32_cli/src/main.rs` | Assembleur |
| C32 CLI | `c32_cli/src/main.rs` | Compilateur |
| Web | `web/index.html` | IDE web |
| Book | `book/00_introduction.md` | Premier chapitre |

---

*Documentation générée automatiquement par BMAD Document Project Workflow*
