# Seed Course - Makefile de génération
# Génère les slides HTML/PDF, TD et TP via Marp CLI

# =============================================================================
# CONFIGURATION
# =============================================================================

# Outil de génération (utilise npx pour éviter installation globale)
MARP = npx @marp-team/marp-cli

# Répertoires
SRC_DIR = .
OUT_DIR = ../web/cours
THEME_DIR = _themes

# Liste des chapitres
CHAPTERS = 00_introduction \
           01_logique_booleenne \
           02_arithmetique \
           03_memoire \
           04_architecture \
           05_cpu \
           06_assembleur \
           07_compilateur

# Options Marp communes
# --html enables HTML tags for Mermaid diagrams and custom divs
MARP_OPTS = --allow-local-files --html

# =============================================================================
# TARGETS PRINCIPALES
# =============================================================================

.PHONY: all clean slides td tp eval help
.PHONY: ch00 ch01 ch02 ch03 ch04 ch05 ch06 ch07

# Target par défaut
all: slides td tp
	@echo "✅ Build complet terminé"

# Aide
help:
	@echo "Seed Course - Makefile"
	@echo ""
	@echo "Targets principales:"
	@echo "  make all      - Génère tout le contenu (slides, TD, TP)"
	@echo "  make slides   - Génère uniquement les slides HTML/PDF"
	@echo "  make td       - Génère uniquement les TD PDF"
	@echo "  make tp       - Génère uniquement les TP PDF"
	@echo "  make clean    - Supprime les fichiers générés"
	@echo ""
	@echo "Targets par chapitre:"
	@echo "  make ch00     - Génère le chapitre 00 (Introduction)"
	@echo "  make ch01     - Génère le chapitre 01 (Logique Booléenne)"
	@echo "  make ch02     - Génère le chapitre 02 (Arithmétique)"
	@echo "  make ch03     - Génère le chapitre 03 (Mémoire)"
	@echo "  make ch04     - Génère le chapitre 04 (Architecture)"
	@echo "  make ch05     - Génère le chapitre 05 (CPU)"
	@echo "  make ch06     - Génère le chapitre 06 (Assembleur)"

# Nettoyage
clean:
	@echo "🧹 Nettoyage des fichiers générés..."
	rm -rf $(OUT_DIR)
	@echo "✅ Nettoyage terminé"

# =============================================================================
# TARGETS PAR TYPE DE CONTENU
# =============================================================================

# Génère tous les slides HTML et PDF
slides: $(foreach ch,$(CHAPTERS),slides-$(ch))
	@echo "✅ Tous les slides générés"

# Génère tous les TD PDF
td: $(foreach ch,$(CHAPTERS),td-$(ch))
	@echo "✅ Tous les TD générés"

# Génère tous les TP PDF
tp: $(foreach ch,$(CHAPTERS),tp-$(ch))
	@echo "✅ Tous les TP générés"

# =============================================================================
# TARGETS PAR CHAPITRE
# =============================================================================

ch00: slides-00_introduction td-00_introduction tp-00_introduction
	@echo "✅ Chapitre 00 généré"

ch01: slides-01_logique_booleenne hdl-01_logique_booleenne td-01_logique_booleenne tp-01_logique_booleenne
	@echo "✅ Chapitre 01 généré"

ch02: slides-02_arithmetique td-02_arithmetique tp-02_arithmetique
	@echo "✅ Chapitre 02 généré"

ch03: slides-03_memoire td-03_memoire tp-03_memoire
	@echo "✅ Chapitre 03 généré"

ch04: slides-04_architecture td-04_architecture tp-04_architecture
	@echo "✅ Chapitre 04 généré"

ch05: slides-05_cpu td-05_cpu tp-05_cpu
	@echo "✅ Chapitre 05 généré"

ch06: slides-06_assembleur asm-06_assembleur td-06_assembleur tp-06_assembleur
	@echo "✅ Chapitre 06 généré"

ch07: c32-07_compilateur
	@echo "✅ Chapitre 07 généré"

# =============================================================================
# RÈGLES DE GÉNÉRATION
# =============================================================================

# Pattern pour les slides d'un chapitre (HTML + PDF)
slides-%:
	@if [ -f "$*/01_slides.md" ]; then \
		echo "📊 Génération slides $*..."; \
		mkdir -p $(OUT_DIR)/$*; \
		$(MARP) $(MARP_OPTS) --theme $(THEME_DIR)/slides.css \
			-o $(OUT_DIR)/$*/slides.html $*/01_slides.md 2>/dev/null || \
		$(MARP) $(MARP_OPTS) -o $(OUT_DIR)/$*/slides.html $*/01_slides.md; \
		$(MARP) $(MARP_OPTS) --theme $(THEME_DIR)/slides.css --pdf \
			-o $(OUT_DIR)/$*/slides.pdf $*/01_slides.md 2>/dev/null || \
		$(MARP) $(MARP_OPTS) --pdf -o $(OUT_DIR)/$*/slides.pdf $*/01_slides.md; \
	else \
		echo "⏭️  Slides $* : fichier source manquant (01_slides.md)"; \
	fi

# Pattern pour les TD d'un chapitre (PDF uniquement)
td-%:
	@if [ -f "$*/02_td.md" ]; then \
		echo "📝 Génération TD $*..."; \
		mkdir -p $(OUT_DIR)/$*; \
		$(MARP) $(MARP_OPTS) --theme $(THEME_DIR)/td.css --pdf \
			-o $(OUT_DIR)/$*/td.pdf $*/02_td.md 2>/dev/null || \
		$(MARP) $(MARP_OPTS) --pdf -o $(OUT_DIR)/$*/td.pdf $*/02_td.md; \
	else \
		echo "⏭️  TD $* : fichier source manquant (02_td.md)"; \
	fi

# Pattern pour les TP d'un chapitre (PDF uniquement)
tp-%:
	@if [ -f "$*/03_tp.md" ]; then \
		echo "🔧 Génération TP $*..."; \
		mkdir -p $(OUT_DIR)/$*; \
		$(MARP) $(MARP_OPTS) --theme $(THEME_DIR)/tp.css --pdf \
			-o $(OUT_DIR)/$*/tp.pdf $*/03_tp.md 2>/dev/null || \
		$(MARP) $(MARP_OPTS) --pdf -o $(OUT_DIR)/$*/tp.pdf $*/03_tp.md; \
	else \
		echo "⏭️  TP $* : fichier source manquant (03_tp.md)"; \
	fi

# Pattern pour les cours HDL (HTML + PDF)
hdl-%:
	@if [ -f "$*/05_hdl_slides.md" ]; then \
		echo "💾 Génération HDL $*..."; \
		mkdir -p $(OUT_DIR)/$*; \
		$(MARP) $(MARP_OPTS) --theme $(THEME_DIR)/slides.css \
			-o $(OUT_DIR)/$*/hdl.html $*/05_hdl_slides.md 2>/dev/null || \
		$(MARP) $(MARP_OPTS) -o $(OUT_DIR)/$*/hdl.html $*/05_hdl_slides.md; \
		$(MARP) $(MARP_OPTS) --theme $(THEME_DIR)/slides.css --pdf \
			-o $(OUT_DIR)/$*/hdl.pdf $*/05_hdl_slides.md 2>/dev/null || \
		$(MARP) $(MARP_OPTS) --pdf -o $(OUT_DIR)/$*/hdl.pdf $*/05_hdl_slides.md; \
	else \
		echo "⏭️  HDL $* : fichier source manquant (05_hdl_slides.md)"; \
	fi

# Pattern pour les cours ASM (HTML + PDF)
asm-%:
	@if [ -f "$*/05_asm_slides.md" ]; then \
		echo "🔧 Génération ASM $*..."; \
		mkdir -p $(OUT_DIR)/$*; \
		$(MARP) $(MARP_OPTS) --theme $(THEME_DIR)/slides.css \
			-o $(OUT_DIR)/$*/asm.html $*/05_asm_slides.md 2>/dev/null || \
		$(MARP) $(MARP_OPTS) -o $(OUT_DIR)/$*/asm.html $*/05_asm_slides.md; \
		$(MARP) $(MARP_OPTS) --theme $(THEME_DIR)/slides.css --pdf \
			-o $(OUT_DIR)/$*/asm.pdf $*/05_asm_slides.md 2>/dev/null || \
		$(MARP) $(MARP_OPTS) --pdf -o $(OUT_DIR)/$*/asm.pdf $*/05_asm_slides.md; \
	else \
		echo "⏭️  ASM $* : fichier source manquant (05_asm_slides.md)"; \
	fi

# Pattern pour les cours C32 (HTML + PDF)
c32-%:
	@if [ -f "$*/05_c32_slides.md" ]; then \
		echo "📝 Génération C32 $*..."; \
		mkdir -p $(OUT_DIR)/$*; \
		$(MARP) $(MARP_OPTS) --theme $(THEME_DIR)/slides.css \
			-o $(OUT_DIR)/$*/c32.html $*/05_c32_slides.md 2>/dev/null || \
		$(MARP) $(MARP_OPTS) -o $(OUT_DIR)/$*/c32.html $*/05_c32_slides.md; \
		$(MARP) $(MARP_OPTS) --theme $(THEME_DIR)/slides.css --pdf \
			-o $(OUT_DIR)/$*/c32.pdf $*/05_c32_slides.md 2>/dev/null || \
		$(MARP) $(MARP_OPTS) --pdf -o $(OUT_DIR)/$*/c32.pdf $*/05_c32_slides.md; \
	else \
		echo "⏭️  C32 $* : fichier source manquant (05_c32_slides.md)"; \
	fi

# =============================================================================
# ÉVALUATIONS (pour Epic 3 et 6)
# =============================================================================

eval:
	@echo "📋 Génération des évaluations..."
	@mkdir -p $(OUT_DIR)/evaluations
	@for f in evaluations/*.md; do \
		if [ -f "$$f" ]; then \
			name=$$(basename "$$f" .md); \
			echo "  → $$name.pdf"; \
			$(MARP) $(MARP_OPTS) --pdf -o $(OUT_DIR)/evaluations/$$name.pdf $$f 2>/dev/null || true; \
		fi; \
	done
	@echo "✅ Évaluations générées"
