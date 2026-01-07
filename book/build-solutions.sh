#!/bin/bash

# Répertoire du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Noms des fichiers de sortie
PDF_OUTPUT="Seed_Solutions.pdf"
HTML_OUTPUT="Seed_Solutions.html"

# Fichiers de solutions
SOLUTIONS=(
    Seed_Solutions.md
    Solutions.md
)

# Vérification de la présence de pandoc
if ! command -v pandoc &> /dev/null; then
    echo "Erreur: Pandoc n'est pas installé."
    exit 1
fi

echo "========================================"
echo "  Génération du livre des solutions"
echo "========================================"
echo ""

# Génération du PDF
echo "[1/2] Génération du PDF..."

pandoc "${SOLUTIONS[@]}" \
    -o "$PDF_OUTPUT" \
    --toc \
    --toc-depth=2 \
    --number-sections \
    --highlight-style=breezedark \
    --pdf-engine=xelatex \
    -V geometry:margin=2cm \
    -V fontsize=10pt \
    -V mainfont="DejaVu Sans" \
    -V monofont="DejaVu Sans Mono" \
    -V title="Seed - Livre des Solutions" \
    -V subtitle="Solutions des quiz et exercices" 2>&1

if [ $? -eq 0 ]; then
    echo "  ✓ PDF créé: $PDF_OUTPUT ($(du -h "$PDF_OUTPUT" | cut -f1))"
else
    echo "  ✗ Échec de la génération PDF"
fi

# Génération HTML
echo ""
echo "[2/2] Génération du HTML..."

pandoc "${SOLUTIONS[@]}" \
    -s --embed-resources \
    -o "$HTML_OUTPUT" \
    --toc \
    --toc-depth=2 \
    --number-sections \
    --highlight-style=breezedark \
    --metadata title="Seed - Livre des Solutions" 2>&1

if [ $? -eq 0 ]; then
    echo "  ✓ HTML créé: $HTML_OUTPUT ($(du -h "$HTML_OUTPUT" | cut -f1))"
else
    echo "  ✗ Échec de la génération HTML"
fi

echo ""
echo "========================================"
echo "  Génération terminée"
echo "========================================"
