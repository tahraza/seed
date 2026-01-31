# Seed - Vue d'ensemble du projet

## Le projet en une phrase

**Seed est une plateforme éducative de type nand2tetris permettant de construire un ordinateur complet, depuis les portes logiques jusqu'au système d'exploitation 32-bits.**

## Informations clés

| Attribut | Valeur |
|----------|--------|
| **Type** | Monorepo éducatif |
| **Langage principal** | Rust (Edition 2021) |
| **Architecture** | ARM-inspired 32-bit (A32-Lite) |
| **Interface** | Web (Vite + WASM) |
| **Licence** | - |

## Structure du projet

```
seed/
├── Rust Toolchain     # 10 crates (hdl_core, a32_core, c32_core, etc.)
├── Web Visualizer     # Interface web interactive (web/)
├── HDL Library        # 56 composants hardware (hdl_lib/)
└── Book               # 13 chapitres éducatifs (book/)
```

## Philosophie des choix techniques

| Principe | Application |
|----------|-------------|
| **Simplicité intentionnelle** | Chaque outil est volontairement minimal |
| **Transparence totale** | Pas de "magie" - tout comportement est explicable |
| **Progression naturelle** | Du NAND au OS, chaque couche construit sur la précédente |
| **Accessibilité universelle** | Fonctionne dans un navigateur sans installation |

## Stack technique

### Rust Toolchain
- **Langage** : Rust Edition 2021
- **Build** : Cargo Workspace
- **WebAssembly** : wasm-bindgen 0.2

### Web Visualizer
- **Runtime** : JavaScript ES2020
- **Build** : Vite 5.2.0
- **Style** : CSS vanilla (pas de framework)

### Book
- **Format** : Markdown
- **Build** : Pandoc + XeLaTeX

## Liens rapides

- [Guide de développement](./development-guide.md)
- [Architecture technique](./architecture.md)
- [Arborescence source](./source-tree.md)
- [FAQ Développeur](./development-guide.md#faq)

---

*Documentation générée automatiquement par BMAD Document Project Workflow*
