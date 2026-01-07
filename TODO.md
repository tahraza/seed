 1. Visualisations Interactives Web

  Simulateurs visuels animés :
  - Animation du flux de données dans le CPU (fetch → decode → execute)
  - Visualisation du cache avec accès mémoire en temps réel (hits en vert, miss en rouge)
  - Pipeline avec bulles de stall visibles
  - Propagation des signaux dans les portes logiques

  2. Progression Plus Granulaire

  Micro-exercices entre les chapitres :
  - Quiz de compréhension avant chaque nouveau concept
  - Exercices "trouver l'erreur" dans du code HDL/ASM
  - Challenges de débogage progressifs

  3. Analogies du Monde Réel

  Dans chaque chapitre, ajouter :
  - Chapitre ALU → Calculatrice avec historique
  - Chapitre Mémoire → Casiers numérotés dans un vestiaire
  - Chapitre CPU → Cuisinier suivant une recette
  - Chapitre Assembleur → Traduction français → anglais

  4. Mode "Exploration Guidée"

  Parcours narratif :
  - Scénario fil rouge : "Construisons un jeu Pong ensemble"
  - Chaque chapitre résout un problème concret du jeu
  - Motivation immédiate pour chaque concept

  5. Feedback Enrichi

  Messages d'erreur pédagogiques :
  - Expliquer pourquoi l'erreur s'est produite
  - Suggérer la correction
  - Lien vers la section du livre concernée




# Seed - TODO & Roadmap

## État actuel du projet

### Ce qu'on a ✓

- HDL VHDL-like avec parser + simulateur (CLI `hdl_cli` et UI web)
- ISA A32-Lite inspirée ARM (predication, ALU/LS/branch/system)
- Assembleur A32 + format binaire A32B
- Émulateur A32 avec MMIO/traps + runner de tests
- CPU single-cycle en HDL
- **CPU pipeline 5 étages en HDL** (IF/ID/EX/MEM/WB + hazards + forwarding)
- Compilateur C32 fonctionnel (types, variables, if/while/for, pointeurs, arrays, **structs**, sizeof)
- UI web avec exercices progressifs (HDL, ASM, C)
- Documentation complète (livre PDF + solutions)

### Ce qui reste à faire (core)

- [ ] Linker/objdump réellement implémentés
- [ ] Debugger avec breakpoints

---

## Extensions recommandées

*Objectif: mieux comprendre le fonctionnement des ordinateurs*

### Tier 1: Haute valeur pédagogique (prioritaire)

#### 1. Cache mémoire
**Pourquoi:** Explique 90% des problèmes de performance modernes.

```
CPU ←→ [Cache L1] ←→ [RAM]
         ↓
    Hit/Miss, LRU eviction
```

- **Concepts:** Localité spatiale/temporelle, lignes de cache, associativité
- **Exercices:** Écrire du code "cache-friendly" vs "cache-hostile", mesurer les miss
- **Implémentation:** Cache direct-mapped simple en HDL + simulation
- **Effort:** ~1-2 semaines

#### 2. Debugger (comment ça marche)
**Pourquoi:** Démystifie un outil utilisé quotidiennement.

```
Breakpoint = remplacer instruction par BKPT
Single-step = flag trap dans CPU
Watchpoint = comparateur sur bus mémoire
```

- **Concepts:** Instructions trap, registres debug, single-stepping hardware
- **Exercices:** Implémenter un mini-debugger en ASM
- **Implémentation:** Instruction BKPT + handler dans émulateur
- **Effort:** ~1 semaine

#### 3. Bootloader complet
**Pourquoi:** Complète le parcours "power-on to printf".

```
Power On → ROM → Init hardware → Copie code → Jump to main
```

- **Concepts:** Reset vector, initialisation BSS/stack, relocation
- **Exercices:** Écrire un bootloader qui charge un programme depuis "flash"
- **Effort:** ~3-4 jours (partiellement fait)

### Tier 2: Valeur moyenne (recommandé)

#### 4. Mémoire virtuelle (MMU simplifié)
**Pourquoi:** Fondation de tout OS moderne.

```
Adresse virtuelle → [MMU/TLB] → Adresse physique
                      ↓
                 Page fault → OS handler
```

- **Concepts:** Pages, tables de pages, TLB, protection mémoire
- **Exercices:** Implémenter pagination simple, gérer page faults
- **Implémentation:** MMU basique avec 2 niveaux de tables
- **Effort:** ~2-3 semaines

#### 5. Floating Point (IEEE 754)
**Pourquoi:** Explique pourquoi 0.1 + 0.2 ≠ 0.3.

```
Sign | Exponent | Mantissa
  1  |    8     |    23    (float32)
```

- **Concepts:** Représentation, arrondis, NaN/Inf, dénormalisés
- **Exercices:** Implémenter addition flottante en software
- **Optionnel:** FPU simple en HDL
- **Effort:** ~1-2 semaines

#### 6. DMA (Direct Memory Access)
**Pourquoi:** Explique l'efficacité des transferts disque/réseau.

```
CPU: "Copie 1KB de 0x1000 vers 0x2000"
DMA controller: [fait le transfert]
DMA → IRQ → "Terminé!"
```

- **Concepts:** Bus mastering, canaux DMA, interruptions
- **Exercices:** Copier un buffer pendant que le CPU fait autre chose
- **Effort:** ~1 semaine

### Tier 3: Avancé (optionnel)

#### 7. Système de fichiers minimal
**Pourquoi:** Comment les fichiers sont organisés sur disque.

```
Superblock | Bitmap | Inodes | Data blocks
```

- **Concepts:** Blocs, inodes, allocation, journaling
- **Exercices:** Implémenter FAT12 ou ext2 très simplifié
- **Effort:** ~3-4 semaines

#### 8. Branch Predictor
**Pourquoi:** Extension naturelle du CPU pipeline.

```
if (x > 0) → Prédit TAKEN ou NOT_TAKEN?
             Pipeline flush si mauvaise prédiction
```

- **Concepts:** Prédiction statique/dynamique, BHT, BTB
- **Exercices:** Mesurer l'impact des mispredictions
- **Effort:** ~1-2 semaines

#### 9. Multi-cœur simplifié
**Pourquoi:** Comprendre pourquoi le parallélisme est difficile.

```
CPU0 ←→ [Bus partagé] ←→ CPU1
           ↓
    Cohérence cache, spinlocks
```

- **Concepts:** Cache coherence (MESI), atomicité, memory barriers
- **Exercices:** Race conditions, implémenter mutex
- **Effort:** ~3-4 semaines (complexe)

---

## Extension MCU (optionnel, embarqué)

*Note: Cette section est optionnelle et s'éloigne de l'objectif principal "comprendre les ordinateurs". À considérer comme un projet séparé.*

### Version minimaliste recommandée

```
┌─────────────────────────────────┐
│           A32 CPU               │
└───────────┬─────────────────────┘
            │
  ┌─────────┼─────────┬───────────┐
  │         │         │           │
GPIO      Timer     UART       NVIC
(8 pins)  (1, IRQ)  (TX/RX)   (4 sources)
```

### 1. GPIO (General Purpose I/O)
- **Adresse Base:** `0x40020000`
- **Registres:**
  - `GPIO_MODER` (+0x00): Mode (Input/Output)
  - `GPIO_IDR` (+0x10): Input Data Register
  - `GPIO_ODR` (+0x14): Output Data Register
- **Effort:** ~3-4 jours

### 2. Timer avec interruption
- **Adresse Base:** `0x40000000`
- **Registres:** CNT, ARR, CR (enable, interrupt enable)
- **Génère IRQ quand CNT == ARR**
- **Effort:** ~2-3 jours

### 3. UART simple
- **Adresse Base:** `0x40004400`
- **Registres:** SR (status), DR (data), CR (control)
- **Remplace/complète PUTC actuel**
- **Effort:** ~2-3 jours

### 4. NVIC (Contrôleur d'interruptions)
- **Table des vecteurs à 0x00000000**
- **4 sources:** Reset, Timer, UART, GPIO
- **Registres:** ISER, ICER, ISPR
- **Effort:** ~1 semaine

---

## Non recommandé (hors scope)

Les éléments suivants sont intéressants mais constituent des projets séparés:

| Élément | Raison |
|---------|--------|
| Side-Channel Analysis | Cours de cryptanalyse, pas d'architecture |
| Simulation Low Power/Batterie | Trop spécialisé embarqué |
| Breadboard visuelle | Effort UI énorme, valeur limitée |
| GPU/Shaders | Domaine complètement différent |
| Réseau/TCP-IP | Autre cours |

---

## Priorités suggérées

| Priorité | Extension | Impact pédagogique |
|----------|-----------|-------------------|
| 1 | Cache mémoire | ★★★★★ |
| 2 | Debugger internals | ★★★★☆ |
| 3 | MMU/Mémoire virtuelle | ★★★★☆ |
| 4 | Bootloader complet | ★★★☆☆ |
| 5 | Floating point | ★★★☆☆ |
| 6 | DMA | ★★★☆☆ |
| 7 | Branch predictor | ★★★☆☆ |
