#!/bin/bash

# Nom du fichier de sortie
OUTPUT="Codex_Guide.pdf"

# Vérification de la présence de pandoc
if ! command -v pandoc &> /dev/null; then
    echo "Erreur: Pandoc n'est pas installé."
    echo "Veuillez l'installer (ex: sudo apt install pandoc texlive-latex-base texlive-fonts-recommended)"
    exit 1
fi

echo "Génération du livre en cours..."

# Commande Pandoc pour PDF
echo "Tentative de génération du PDF..."
pandoc metadata.yaml \
    README.md \
    00_introduction.md \
    01_logique_booleenne.md \
    02_arithmetique.md \
    03_memoire.md \
    04_architecture.md \
    05_cpu.md \
    06_assembleur.md \
    07_compilateur.md \
    08_langage.md \
    09_os.md \
    10_exercices.md \
    11_cache.md \
    -o "$OUTPUT" \
    --toc \
    --toc-depth=2 \
    --number-sections \
    --highlight-style=pygments \
    --pdf-engine=xelatex 2> /dev/null

if [ $? -eq 0 ]; then
    echo "Succès ! Le fichier $OUTPUT a été créé."

    # Génération HTML en plus du PDF
    HTML_OUTPUT="Codex_Guide.html"
    echo "Génération de la version HTML..."
    pandoc metadata.yaml \
        README.md \
        00_introduction.md \
        01_logique_booleenne.md \
        02_arithmetique.md \
        03_memoire.md \
        04_architecture.md \
        05_cpu.md \
        06_assembleur.md \
        07_compilateur.md \
        08_langage.md \
        09_os.md \
        10_exercices.md \
        11_cache.md \
        -s --embed-resources \
        -o "$HTML_OUTPUT" \
        --toc \
        --toc-depth=2 \
        --number-sections \
        --highlight-style=pygments

    if [ $? -eq 0 ]; then
        echo "Succès ! Le fichier $HTML_OUTPUT a été créé."
    fi
else
    echo "Échec de la génération PDF (moteur LaTeX manquant)."
    echo "Génération d'une version HTML5 de haute qualité..."
    HTML_OUTPUT="Codex_Guide.html"
    pandoc metadata.yaml \
        README.md \
        00_introduction.md \
        01_logique_booleenne.md \
        02_arithmetique.md \
        03_memoire.md \
        04_architecture.md \
        05_cpu.md \
        06_assembleur.md \
        07_compilateur.md \
        08_langage.md \
        09_os.md \
        10_exercices.md \
        11_cache.md \
        -s --embed-resources \
        -o "$HTML_OUTPUT" \
        --toc \
        --toc-depth=2 \
        --number-sections \
        --highlight-style=pygments \
        -c https://cdn.jsdelivr.net/npm/water.css@2/out/water.css
    
    if [ $? -eq 0 ]; then
        echo "Succès ! Le fichier $HTML_OUTPUT a été créé."
        echo "Vous pouvez l'ouvrir dans votre navigateur et l'imprimer en PDF."
    else
        echo "Erreur lors de la génération HTML."
    fi
fi
