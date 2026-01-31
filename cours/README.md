# Seed Course - Quick Start Enseignant

> Guide de prise en main rapide pour les enseignants

## Vue d'ensemble

Ce dossier contient tout le matériel pédagogique du cours Seed : slides, TD, TP et évaluations. Le contenu est écrit en Markdown et généré en HTML/PDF via [Marp](https://marp.app/).

```
cours/
├── _templates/          # Templates réutilisables
├── _themes/             # Thèmes CSS Marp
├── 00_introduction/     # Chapitre 00
├── 01_logique_booleenne/
├── 02_arithmetique/
├── 03_memoire/
├── 04_architecture/
├── 05_cpu/
├── 06_assembleur/
├── evaluations/         # Évaluations intermédiaires et finale
├── Makefile             # Commandes de build
└── README.md            # Ce fichier
```

## Prérequis

| Outil | Version | Installation |
|-------|---------|--------------|
| Node.js | 18+ | https://nodejs.org/ |
| npm | 8+ | Inclus avec Node.js |
| Marp CLI | 3+ | `npm install -g @marp-team/marp-cli` |
| Chrome/Chromium | 90+ | Pour génération PDF |

### Vérification

```bash
node --version      # v18.x.x ou plus
npm --version       # 8.x.x ou plus
npx @marp-team/marp-cli --version  # 3.x.x ou plus
```

## Commandes Essentielles

### Générer tout le cours

```bash
make all
```

Génère slides HTML/PDF, TD et TP pour tous les chapitres dans `../web/cours/`.

### Générer un chapitre spécifique

```bash
make ch00    # Introduction
make ch01    # Logique Booléenne
make ch02    # Arithmétique
make ch03    # Mémoire
make ch04    # Architecture
make ch05    # CPU
make ch06    # Assembleur
```

### Générer par type de contenu

```bash
make slides  # Tous les slides (HTML + PDF)
make td      # Tous les TD (PDF)
make tp      # Tous les TP (PDF)
make eval    # Toutes les évaluations (PDF)
```

### Nettoyer les fichiers générés

```bash
make clean
```

## Structure d'un Chapitre

Chaque chapitre contient 4 fichiers :

| Fichier | Description | Généré en |
|---------|-------------|-----------|
| `01_slides.md` | Slides de cours | HTML + PDF |
| `02_td.md` | Exercices dirigés | PDF |
| `03_tp.md` | Travaux pratiques | PDF |
| `04_notes.md` | Notes enseignant | Non généré |

### Notes enseignant (04_notes.md)

Ce fichier contient :
- Points de vigilance et pièges courants
- Questions fréquentes avec réponses suggérées
- Timing suggéré pour la séance
- Démonstrations recommandées

**Important :** Ce fichier n'est PAS distribué aux étudiants.

## Modifier le Contenu

### 1. Éditer un fichier Markdown

Les fichiers utilisent la syntaxe [Marp](https://marp.app/). Chaque slide est séparée par `---`.

```markdown
---
marp: true
theme: seed-slides
---

# Titre du Slide

Contenu...

---

# Slide Suivant

Contenu...
```

### 2. Régénérer

```bash
make ch01    # Régénère le chapitre modifié
```

### 3. Vérifier

Ouvrez le fichier HTML généré dans `../web/cours/01_logique_booleenne/slides.html`.

## Thèmes Marp

Trois thèmes CSS sont disponibles :

| Thème | Usage | Fichier |
|-------|-------|---------|
| `seed-slides` | Slides de cours | `_themes/slides.css` |
| `seed-td` | TD et évaluations | `_themes/td.css` |
| `seed-tp` | TP | `_themes/tp.css` |

Pour modifier l'apparence, éditez les fichiers CSS dans `_themes/`.

## Liens vers le Visualiseur

Les TP contiennent des liens vers le visualiseur web Seed :

```markdown
👉 [Ouvrir le Simulateur HDL](https://seed.music-music.fr/)
👉 [Ouvrir le CPU Visualizer](https://seed.music-music.fr/visualizer.html)
```

## Évaluations

Les évaluations sont dans le dossier `evaluations/` :

| Fichier | Chapitres couverts |
|---------|-------------------|
| `eval_inter_01.md` | 00-02 (Logique, Arithmétique) |
| `eval_inter_02.md` | 03-04 (Mémoire, Architecture) |

Chaque évaluation inclut :
- QCM (5 points)
- Exercices (15 points)
- Corrigé détaillé (dans le même fichier, section finale)

## Workflow de Modification

1. **Cloner le repo** (si pas déjà fait)
   ```bash
   git clone <url-du-repo>
   cd seed/cours
   ```

2. **Créer une branche** (optionnel mais recommandé)
   ```bash
   git checkout -b modification-chapitre-01
   ```

3. **Modifier les fichiers Markdown**

4. **Tester la génération**
   ```bash
   make ch01
   ```

5. **Vérifier le résultat**
   - Ouvrir les fichiers dans `../web/cours/`

6. **Committer et pousser**
   ```bash
   git add .
   git commit -m "Mise à jour chapitre 01"
   git push
   ```

## Dépannage

### "marp: command not found"

```bash
npm install -g @marp-team/marp-cli
```

Ou utilisez npx (déjà configuré dans le Makefile) :
```bash
npx @marp-team/marp-cli --version
```

### PDF vide ou mal formaté

Assurez-vous que Chrome/Chromium est installé. Marp l'utilise pour générer les PDF.

### Thème non appliqué

Vérifiez le frontmatter du fichier Markdown :
```yaml
---
marp: true
theme: seed-slides  # ou seed-td, seed-tp
---
```

## Contact et Support

- **Repo Git :** [URL du repo]
- **Visualiseur Web :** https://seed.music-music.fr/
- **Documentation Marp :** https://marp.app/

---

*Dernière mise à jour : 2026-02-01*
