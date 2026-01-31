# Seed - Architecture technique

## Vue d'ensemble

Seed est un monorepo Rust contenant 4 parties principales interconnectées via WebAssembly.

## Diagramme d'architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         NAVIGATEUR                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    web/ (Vite)                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │CPU Visualizer│  │HDL Debugger │  │  Exercises  │     │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │   │
│  │         └────────────────┼────────────────┘             │   │
│  │                          │                              │   │
│  │                   ┌──────▼──────┐                       │   │
│  │                   │  web_sim    │ (WASM)                │   │
│  │                   │ WasmHdl     │                       │   │
│  │                   │ WasmA32     │                       │   │
│  │                   └──────┬──────┘                       │   │
│  └──────────────────────────┼──────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │ wasm-bindgen
┌─────────────────────────────┼───────────────────────────────────┐
│                     RUST WORKSPACE                              │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │                      web_sim                             │   │
│  │                   (cdylib + rlib)                        │   │
│  └───────┬─────────────┬─────────────┬─────────────────────┘   │
│          │             │             │                          │
│  ┌───────▼───────┐ ┌───▼───────┐ ┌───▼───────┐                 │
│  │   hdl_core    │ │  a32_asm  │ │  c32_core │                 │
│  │  (HDL sim)    │ │(assembler)│ │(compiler) │                 │
│  └───────────────┘ └─────┬─────┘ └───────────┘                 │
│                          │                                      │
│                    ┌─────▼─────┐                                │
│                    │  a32_core │                                │
│                    │ (CPU sim) │                                │
│                    └───────────┘                                │
└─────────────────────────────────────────────────────────────────┘
```

## Crates Rust

### Bibliothèques (lib)

| Crate | Rôle | Exports principaux |
|-------|------|-------------------|
| `hdl_core` | Simulateur HDL | `parse_str()`, `elaborate()`, `Simulator` |
| `a32_core` | Simulateur CPU | `Machine`, `Cpu`, `Memory`, `Cache` |
| `a32_asm` | Assembleur A32 | `assemble_a32b()` |
| `c32_core` | Compilateur C | `parse_program()`, `compile_to_a32()` |
| `web_sim` | Bindings WASM | `WasmHdl`, `WasmA32` |

### Binaires (bin)

| Crate | Commande | Usage |
|-------|----------|-------|
| `hdl_cli` | `hdl_cli <file.tst>` | Simuler circuits HDL |
| `a32_cli` | `a32_cli <file.a32>` | Assembler vers .a32b |
| `a32_runner` | `a32_runner <path>` | Tests de référence A32 |
| `c32_cli` | `c32_cli <file.c>` | Compiler C vers A32 |
| `c32_runner` | `c32_runner <path>` | Tests de référence C |

## Flux de compilation

```
┌─────────┐    parse     ┌─────────┐   codegen   ┌─────────┐
│  .c     │─────────────►│   AST   │────────────►│  .a32   │
│ (source)│   c32_core   │  (C)    │   c32_core  │ (asm)   │
└─────────┘              └─────────┘             └────┬────┘
                                                      │
┌─────────┐    parse     ┌─────────┐   encode    ┌────▼────┐
│  .a32   │─────────────►│   AST   │────────────►│ .a32b   │
│ (source)│   a32_asm    │  (ASM)  │   a32_asm   │ (binary)│
└─────────┘              └─────────┘             └────┬────┘
                                                      │
                                                 ┌────▼────┐
                                                 │ Machine │
                                                 │  (CPU)  │
                                                 └────┬────┘
                                                      │ step()
                                                 ┌────▼────┐
                                                 │ Output  │
                                                 └─────────┘
```

## Architecture Decision Records (ADR)

### ADR-001 : Monorepo Cargo workspace
**Décision** : Utiliser un Cargo workspace avec 10 crates
**Raison** : Code partagé CLI↔Web, builds unifiés, versioning simple

### ADR-002 : Séparation core/cli/runner
**Décision** : Pattern `*_core` (lib) + `*_cli` (bin) + `*_runner` (tests)
**Raison** : Réutilisation maximale, tests isolés

### ADR-003 : HDL personnalisé
**Décision** : Créer un HDL simplifié inspiré de VHDL
**Raison** : Réduction de la charge cognitive pour l'apprentissage

### ADR-004 : Rust → WebAssembly
**Décision** : Compiler Rust vers WASM via wasm-pack
**Raison** : Performance native dans le navigateur, même code que CLI

### ADR-005 : Vanilla JS sans framework
**Décision** : JavaScript vanilla + Vite
**Raison** : Zéro dette framework, contrôle total, simplicité

### ADR-006 : Tests de référence (.ref)
**Décision** : Format déclaratif pour les tests
**Raison** : Lisibles, faciles à écrire, documentation vivante

## Intégration des parties

| Source | Destination | Mécanisme |
|--------|-------------|-----------|
| `hdl_core` | `web_sim` | Rust crate import |
| `a32_core` | `web_sim` | Rust crate import |
| `a32_asm` | `web_sim` | Rust crate import |
| `c32_core` | `web_sim` | Rust crate import |
| `web_sim` | `web/` | wasm-bindgen (WASM) |
| `hdl_lib/` | Runtime | Chargement dynamique |

---

*Documentation générée automatiquement par BMAD Document Project Workflow*
