# Seed - Documentation du projet

## Vue d'ensemble

| Attribut | Valeur |
|----------|--------|
| **Type** | Monorepo éducatif (4 parties) |
| **Langage principal** | Rust (Edition 2021) |
| **Architecture** | ARM-inspired 32-bit (A32-Lite) |
| **Interface** | Web (Vite + WASM) |

## Référence rapide

### Stack technique

| Partie | Technologies |
|--------|--------------|
| **Rust Toolchain** | Rust 2021, Cargo workspace, 10 crates |
| **Web Visualizer** | Vite 5.2, Vanilla JS, WebAssembly |
| **HDL Library** | HDL personnalisé VHDL-like, 56 composants |
| **Book** | Markdown, Pandoc, XeLaTeX |

### Points d'entrée

| Outil | Commande |
|-------|----------|
| IDE Web | `cd web && npm run dev` → http://localhost:5173 |
| Simulateur HDL | `cargo run -p hdl_cli -- <file.tst>` |
| Assembleur | `cargo run -p a32_cli -- <file.a32>` |
| Compilateur C | `cargo run -p c32_cli -- <file.c>` |

## Documentation générée

### Architecture et structure

- [Vue d'ensemble du projet](./project-overview.md)
- [Architecture technique](./architecture.md)
- [Arborescence source](./source-tree.md)

### Développement

- [Guide de développement](./development-guide.md)

## Documentation existante

### Spécifications (racine)

- [README.md](../README.md) - Spécifications HDL, ISA A32-Lite, C-like
- [SPECS.md](../SPECS.md) - Exemples assembleur, tests de référence, format binaire
- [TOOLS.md](../TOOLS.md) - Mode d'emploi des outils CLI

### Book (livre éducatif)

| Chapitre | Sujet |
|----------|-------|
| [00_introduction](../book/00_introduction.md) | Introduction |
| [01_logique_booleenne](../book/01_logique_booleenne.md) | Portes logiques |
| [02_arithmetique](../book/02_arithmetique.md) | Additionneurs, ALU |
| [03_memoire](../book/03_memoire.md) | Registres, RAM |
| [04_architecture](../book/04_architecture.md) | Architecture CPU |
| [05_cpu](../book/05_cpu.md) | Conception CPU |
| [06_assembleur](../book/06_assembleur.md) | Langage assembleur |
| [07_compilateur](../book/07_compilateur.md) | Compilateur |
| [08_langage](../book/08_langage.md) | Langage C-like |
| [09_os](../book/09_os.md) | Système d'exploitation |
| [10_exercices](../book/10_exercices.md) | Exercices |
| [11_cache](../book/11_cache.md) | Mémoire cache |
| [12_interruptions](../book/12_interruptions.md) | Interruptions |
| [13_concepts_avances](../book/13_concepts_avances.md) | Concepts avancés |

### Documentation technique (docs/)

| Dossier | Contenu |
|---------|---------|
| [00_hdl/](./00_hdl/) | Progression HDL |
| [01_architecture/](./01_architecture/) | Vue d'ensemble architecture |
| [03_compilateur/](./03_compilateur/) | Lexer, parser, AST, codegen |
| [04_os/](./04_os/) | Bare metal, bootstrap, drivers |
| [05_timer_interrupts/](./05_timer_interrupts/) | Timer, interruptions |
| [exercices/](./exercices/) | Exercices par niveau |

### Références

- [HDL Library Progression](../hdl_lib/PROGRESSION.md)
- [Web README](../web/README.md)

## Démarrage rapide

### Utilisateur (sans Rust)

```bash
cd web
npm install
npm run dev
# Ouvrir http://localhost:5173
```

### Développeur

```bash
# Compiler tout
cargo build

# Tests
cargo test --all
cargo run -p a32_runner -- tests/
cargo run -p c32_runner -- tests_c/

# Web avec rebuild WASM
cd web
npm run build:wasm
npm run dev
```

## Statistiques du projet

| Catégorie | Nombre |
|-----------|--------|
| Crates Rust | 10 |
| Fichiers HDL | 56 |
| Tests A32 | 18 |
| Tests C | 53 |
| Tests HDL | 35 |
| Chapitres Book | 13 |
| Démos | 7 |

---

*Documentation générée le 2026-01-31 par BMAD Document Project Workflow*
*Scan level: exhaustive*
