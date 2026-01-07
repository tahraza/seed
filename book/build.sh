#!/bin/bash

# Répertoire du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Noms des fichiers de sortie
PDF_OUTPUT="Codex_Guide.pdf"
HTML_OUTPUT="Codex_Guide.html"

# Liste des chapitres
CHAPTERS=(
    README.md
    00_introduction.md
    01_logique_booleenne.md
    02_arithmetique.md
    03_memoire.md
    04_architecture.md
    05_cpu.md
    06_assembleur.md
    07_compilateur.md
    08_langage.md
    09_os.md
    10_exercices.md
    10bis_debogage.md
    11_cache.md
)

# Liste des cartes de référence
REFERENCE_CARDS=(
    references/carte_isa_a32.md
    references/carte_hdl.md
    references/carte_c32.md
    references/carte_erreurs.md
)

# Vérification de la présence de pandoc
if ! command -v pandoc &> /dev/null; then
    echo "Erreur: Pandoc n'est pas installé."
    echo "Veuillez l'installer: sudo apt install pandoc"
    exit 1
fi

# Vérification du template eisvogel
EISVOGEL_INSTALLED=false
if pandoc --list-templates 2>/dev/null | grep -q "eisvogel"; then
    EISVOGEL_INSTALLED=true
elif [ -f "$HOME/.pandoc/templates/eisvogel.latex" ]; then
    EISVOGEL_INSTALLED=true
fi

echo "========================================"
echo "  Génération du livre Codex"
echo "========================================"
echo ""

# Génération du PDF
echo "[1/3] Génération du PDF..."

if [ "$EISVOGEL_INSTALLED" = true ]; then
    pandoc metadata-eisvogel.yaml \
        "${CHAPTERS[@]}" \
        -o "$PDF_OUTPUT" \
        --from markdown+yaml_metadata_block+raw_html \
        --template eisvogel \
        --table-of-contents \
        --toc-depth 3 \
        --number-sections \
        --top-level-division=chapter \
        --highlight-style breezedark \
        --pdf-engine=xelatex \
        --resource-path=.:images 2>&1

    if [ $? -eq 0 ]; then
        echo "  ✓ PDF créé: $PDF_OUTPUT ($(du -h "$PDF_OUTPUT" | cut -f1))"
    else
        echo "  ✗ Échec de la génération PDF avec eisvogel"
        echo "    Tentative avec le template par défaut..."

        pandoc metadata.yaml \
            "${CHAPTERS[@]}" \
            -o "$PDF_OUTPUT" \
            --table-of-contents \
            --toc-depth 3 \
            --number-sections \
            --highlight-style breezedark \
            --pdf-engine=xelatex \
            --resource-path=.:images 2>&1

        if [ $? -eq 0 ]; then
            echo "  ✓ PDF créé (template par défaut): $PDF_OUTPUT"
        else
            echo "  ✗ Échec de la génération PDF"
        fi
    fi
else
    echo "  Note: Template eisvogel non installé, utilisation du template par défaut"
    echo "  Pour installer eisvogel: https://github.com/Wandmalfarbe/pandoc-latex-template"

    pandoc metadata.yaml \
        "${CHAPTERS[@]}" \
        -o "$PDF_OUTPUT" \
        --table-of-contents \
        --toc-depth 3 \
        --number-sections \
        --highlight-style breezedark \
        --pdf-engine=xelatex \
        --resource-path=.:images 2>&1

    if [ $? -eq 0 ]; then
        echo "  ✓ PDF créé: $PDF_OUTPUT ($(du -h "$PDF_OUTPUT" | cut -f1))"
    else
        echo "  ✗ Échec de la génération PDF (xelatex manquant?)"
    fi
fi

# Génération du HTML
echo ""
echo "[2/3] Génération du HTML..."

pandoc metadata-eisvogel.yaml \
    "${CHAPTERS[@]}" \
    -o "$HTML_OUTPUT" \
    --from markdown+yaml_metadata_block+raw_html \
    --standalone \
    --table-of-contents \
    --toc-depth 3 \
    --number-sections \
    --highlight-style breezedark \
    --resource-path=.:images \
    --metadata title="L'Architecture Codex" 2>&1

if [ $? -eq 0 ]; then
    echo "  ✓ HTML créé: $HTML_OUTPUT ($(du -h "$HTML_OUTPUT" | cut -f1))"
else
    echo "  ✗ Échec de la génération HTML"
fi

# Génération des cartes de référence (PDF compact)
echo ""
echo "[3/3] Génération des cartes de référence..."

# Créer le dossier de sortie si nécessaire
mkdir -p references

REFCARD_OUTPUT="references/Cartes_Reference.pdf"

pandoc "${REFERENCE_CARDS[@]}" \
    -o "$REFCARD_OUTPUT" \
    --from markdown \
    --pdf-engine=xelatex \
    --variable geometry:margin=1.5cm \
    --variable fontsize=10pt \
    --variable documentclass=article \
    --highlight-style breezedark \
    --table-of-contents \
    --toc-depth 2 2>&1

if [ $? -eq 0 ]; then
    echo "  ✓ Cartes de référence: $REFCARD_OUTPUT ($(du -h "$REFCARD_OUTPUT" | cut -f1))"
else
    echo "  ✗ Échec de la génération des cartes de référence"
fi

echo ""
echo "========================================"
echo "  Génération terminée"
echo "========================================"
