# Guide de Contribution

> Comment contribuer au contenu du cours Seed

## Prérequis

Avant de contribuer, assurez-vous d'avoir :
- Git installé
- Node.js 18+ et npm
- Marp CLI (`npm install -g @marp-team/marp-cli`)

## Workflow Git

### 1. Cloner le repository

```bash
git clone <url-du-repo>
cd seed
```

### 2. Créer une branche

Pour chaque modification, créez une branche dédiée :

```bash
git checkout -b <type>/<description>
```

**Types de branches :**
- `fix/` - Corrections (typos, bugs)
- `content/` - Nouveau contenu ou modifications majeures
- `style/` - Modifications CSS/thèmes
- `docs/` - Documentation

**Exemples :**
```bash
git checkout -b fix/typo-chapitre-01
git checkout -b content/exercices-bonus-ch03
git checkout -b style/nouveau-theme-slides
```

### 3. Faire les modifications

Éditez les fichiers Markdown dans `cours/`.

### 4. Tester localement

```bash
cd cours
make ch01    # ou le chapitre modifié
```

Vérifiez le résultat dans `web/cours/`.

### 5. Committer

```bash
git add cours/<fichiers-modifiés>
git commit -m "Description courte et claire"
```

**Conventions de commit :**
- Utilisez l'impératif : "Ajoute exercice" pas "Ajouté exercice"
- Soyez concis mais descriptif
- Référencez les chapitres : "ch01: Corrige table de vérité"

### 6. Pousser

```bash
git push origin <nom-de-branche>
```

### 7. Pull Request (optionnel)

Si le repo utilise des PR :
1. Créez une PR sur GitHub/GitLab
2. Décrivez les changements
3. Attendez la review

## Conventions

### Structure des fichiers

```
cours/XX_nom/
├── 01_slides.md    # Slides de cours
├── 02_td.md        # Exercices dirigés
├── 03_tp.md        # Travaux pratiques
├── 04_notes.md     # Notes enseignant (non distribué)
└── assets/         # Images et ressources
    └── figNN_description.ext
```

### Nommage des fichiers

- Chapitres : `XX_nom_en_minuscules/`
- Slides : `01_slides.md`
- Assets : `fig01_nom_descriptif.png`

### Frontmatter Marp

Chaque fichier Markdown doit commencer par :

```yaml
---
marp: true
theme: seed-slides  # ou seed-td, seed-tp
paginate: true
header: "Seed - Chapitre XX"
footer: "Titre du chapitre"  # slides uniquement
---
```

### Liens vers le visualiseur

Utilisez toujours les URLs absolues avec l'icône :

```markdown
👉 [Ouvrir le Simulateur HDL](https://seed.music-music.fr/)
```

### Solutions et indices

Utilisez les balises `<details>` :

```markdown
<details>
<summary>Solution</summary>

Contenu de la solution...

</details>
```

## Modifications Courantes

### Ajouter un exercice au TD

1. Ouvrir `cours/XX_nom/02_td.md`
2. Ajouter un nouveau slide avec `---`
3. Suivre le format des exercices existants
4. Ajouter la solution dans `<details>`

### Corriger une erreur dans les slides

1. Ouvrir `cours/XX_nom/01_slides.md`
2. Localiser et corriger l'erreur
3. Régénérer : `make chXX`

### Modifier un thème CSS

1. Ouvrir `cours/_themes/slides.css` (ou td.css, tp.css)
2. Modifier les styles
3. Régénérer tout : `make all`

### Ajouter une image

1. Placer l'image dans `cours/XX_nom/assets/`
2. Nommer : `fig01_description.png`
3. Référencer : `![Description](assets/fig01_description.png)`

## Checklist avant commit

- [ ] Le contenu est correct et vérifié
- [ ] `make chXX` génère sans erreur
- [ ] Les fichiers HTML/PDF sont corrects visuellement
- [ ] Les liens vers le visualiseur fonctionnent
- [ ] Les solutions sont dans des balises `<details>`
- [ ] Le frontmatter Marp est présent et correct

## Questions ?

Contactez le mainteneur du repo ou ouvrez une issue.

---

*Dernière mise à jour : 2026-02-01*
