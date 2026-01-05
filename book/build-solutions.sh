#!/bin/bash

# Nom du fichier de sortie
OUTPUT="Codex_Solutions.pdf"
HTML_OUTPUT="Codex_Solutions.html"

# Vérification de la présence de pandoc
if ! command -v pandoc &> /dev/null; then
    echo "Erreur: Pandoc n'est pas installé."
    exit 1
fi

echo "Génération du livre des solutions..."

# Commande Pandoc pour PDF
pandoc Solutions.md \
    -o "$OUTPUT" \
    --toc \
    --toc-depth=2 \
    --number-sections \
    --highlight-style=pygments \
    --pdf-engine=xelatex \
    -V geometry:margin=2cm \
    -V fontsize=10pt \
    -V mainfont="DejaVu Sans" \
    -V monofont="DejaVu Sans Mono" 2> /dev/null

if [ $? -eq 0 ]; then
    echo "Succès ! Le fichier $OUTPUT a été créé."
else
    echo "Échec PDF, génération HTML..."
fi

# Génération HTML
pandoc Solutions.md \
    -s --embed-resources \
    -o "$HTML_OUTPUT" \
    --toc \
    --toc-depth=2 \
    --number-sections \
    --highlight-style=pygments

if [ $? -eq 0 ]; then
    echo "Succès ! Le fichier $HTML_OUTPUT a été créé."
fi
