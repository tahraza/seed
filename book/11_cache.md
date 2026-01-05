# Le Cache : Pourquoi Votre Ordinateur Semble Rapide

Imaginez que vous travaillez dans un bureau et que vous avez besoin de consulter des documents. Vous avez deux options :
- **Votre bureau** : les documents sont juste devant vous, vous pouvez les lire instantanément
- **Les archives au sous-sol** : il faut descendre 5 étages, chercher le bon dossier, remonter... cela prend plusieurs minutes

Le **cache** est exactement comme votre bureau : une petite zone de stockage très rapide où l'on garde les documents (données) les plus utilisés, pour éviter d'aller constamment aux archives (la mémoire RAM).

---

## Le Problème : La RAM est Lente !

### La Hiérarchie Mémoire

Voici comment est organisée la mémoire dans un ordinateur, du plus rapide au plus lent :

```
                    ┌─────────────┐
                    │  Registres  │  ◄── Très rapide, très petit
                    │   (32 x 32) │      ~0.3 ns, 128 octets
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Cache L1   │  ◄── Rapide, petit
                    │   (32 KB)   │      ~1 ns, 32 Ko
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Cache L2   │  ◄── Moyen
                    │   (256 KB)  │      ~4 ns, 256 Ko
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │     RAM     │  ◄── Lent, grand
                    │   (8 GB)    │      ~100 ns, 8 Go
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Disque SSD │  ◄── Très lent, très grand
                    │   (512 GB)  │      ~100,000 ns, 512 Go
                    └─────────────┘
```

### L'écart de vitesse visualisé

Si on convertissait ces temps en échelle humaine :

```
┌────────────────────────────────────────────────────────────────────┐
│                    ÉCHELLE HUMAINE DES TEMPS D'ACCÈS               │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Registres (0.3 ns)  →  Cligner des yeux (0.3 seconde)            │
│                              │                                     │
│  Cache L1 (1 ns)     →  │    Une seconde                          │
│                              │                                     │
│  Cache L2 (4 ns)     →  │    4 secondes                           │
│                              │                                     │
│  RAM (100 ns)        →  ████████████████████  1 minute 40 sec     │
│                              │                                     │
│  SSD (100,000 ns)    →  ████████████████████████  27 heures !     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

Sans cache, le processeur passerait **99% de son temps à attendre** !

---

## La Solution : Le Principe de Localité

Les programmes ne lisent pas la mémoire au hasard. Ils suivent des **patterns** prévisibles.

### Localité Temporelle

**"Si j'utilise une donnée maintenant, je vais probablement la réutiliser bientôt"**

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOCALITÉ TEMPORELLE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Code:   for (i = 0; i < 1000; i++)                           │
│               somme = somme + arr[i];                          │
│                 ▲                                               │
│                 │                                               │
│                 └── 'somme' est accédée 1000 fois !            │
│                                                                 │
│   Temps ──────────────────────────────────────────────────►    │
│                                                                 │
│   somme:  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ...   │
│           │  │  │  │  │  │  │  │  │  │  │  │  │  │  │         │
│           └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴─────►   │
│                     Accès répétés à la même variable           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Localité Spatiale

**"Si j'utilise une donnée, je vais probablement utiliser ses voisines"**

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOCALITÉ SPATIALE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Code:   for (i = 0; i < 100; i++)                            │
│               traiter(arr[i]);                                  │
│                                                                 │
│   Mémoire:                                                      │
│   ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐     │
│   │arr[0]│arr[1]│arr[2]│arr[3]│arr[4]│arr[5]│arr[6]│arr[7]│...│     │
│   └──┬──┴──┬──┴──┬──┴──┬──┴──┬──┴──┬──┴──┬──┴──┬──┴─────┘     │
│      │     │     │     │     │     │     │                      │
│      1er   2ème  3ème  4ème  5ème  6ème  7ème                   │
│      ▼     ▼     ▼     ▼     ▼     ▼     ▼                      │
│                                                                 │
│   Les éléments consécutifs sont côte à côte en mémoire         │
│   → On peut les charger ensemble dans le cache !               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Comment Fonctionne le Cache ?

### Les Lignes de Cache

Le cache stocke des **blocs** de données appelés **lignes de cache**, pas des octets individuels.

```
┌─────────────────────────────────────────────────────────────────┐
│                    LIGNE DE CACHE (16 octets)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Quand vous demandez l'adresse 100, le cache charge :         │
│                                                                 │
│   Adresses:  100  101  102  103  104  105  ... 115             │
│              ┌────┬────┬────┬────┬────┬────┬───┬────┐          │
│   Données:   │ AA │ BB │ CC │ DD │ EE │ FF │...│ ZZ │          │
│              └────┴────┴────┴────┴────┴────┴───┴────┘          │
│              │◄──────── 16 octets ensemble ────────►│          │
│                                                                 │
│   Ensuite, si vous demandez 101, 102, 103... c'est gratuit !   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Structure d'une Ligne de Cache

```
┌───────────────────────────────────────────────────────────────────────┐
│                         STRUCTURE D'UNE LIGNE                          │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌───────┬─────────────────┬──────────────────────────────────────┐  │
│  │ Valid │       Tag       │              Données                  │  │
│  │ (1b)  │    (20 bits)    │           (128 bits = 16 octets)     │  │
│  └───────┴─────────────────┴──────────────────────────────────────┘  │
│                                                                        │
│  Valid = 1 : Cette ligne contient des données valides                 │
│  Valid = 0 : Cette ligne est vide ou invalide                         │
│                                                                        │
│  Tag : "D'où viennent ces données ?"                                  │
│        Identifie la zone mémoire stockée dans cette ligne             │
│                                                                        │
│  Données : Les 16 octets de données eux-mêmes                         │
│            Contient 4 mots de 32 bits (4 × 4 = 16 octets)            │
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘
```

### Découpage d'une Adresse

Quand le CPU demande l'adresse `0x00001234`, comment le cache la trouve-t-il ?

```
┌───────────────────────────────────────────────────────────────────────┐
│                    DÉCOMPOSITION D'UNE ADRESSE                        │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   Adresse 32 bits: 0x00001234                                         │
│                                                                        │
│   En binaire:                                                          │
│   0000 0000 0000 0000 0001 0010 0011 0100                             │
│   │◄────────── Tag ──────────►│◄─Index─►│◄Off►│                       │
│              22 bits            6 bits   4 bits                        │
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │                                                               │   │
│   │  Tag (22 bits) : Identifie quelle zone de la RAM             │   │
│   │                                                               │   │
│   │  Index (6 bits) : Quelle ligne du cache ?                    │   │
│   │                   6 bits = 64 lignes possibles (0 à 63)      │   │
│   │                                                               │   │
│   │  Offset (4 bits) : Quel octet dans la ligne ?                │   │
│   │                    4 bits = 16 positions (0 à 15)            │   │
│   │                                                               │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘
```

### Structure Complète du Cache

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CACHE DIRECT-MAPPED (64 lignes)                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Index    Valid    Tag           Données (128 bits)                     │
│  ────────────────────────────────────────────────────────────────────   │
│    0    │  1   │ 0x00012  │ [Mot0][Mot1][Mot2][Mot3]                    │
│    1    │  0   │ ------   │ -------------------------                    │
│    2    │  1   │ 0x00045  │ [Mot0][Mot1][Mot2][Mot3]                    │
│    3    │  1   │ 0x00123  │ [Mot0][Mot1][Mot2][Mot3]  ◄── Ligne active  │
│    4    │  0   │ ------   │ -------------------------                    │
│    5    │  1   │ 0x00067  │ [Mot0][Mot1][Mot2][Mot3]                    │
│   ...   │ ...  │  ...     │           ...                                │
│   63    │  1   │ 0x00ABC  │ [Mot0][Mot1][Mot2][Mot3]                    │
│                                                                          │
│  Chaque ligne = 1 bit Valid + 20 bits Tag + 128 bits Data              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Hit ou Miss : Que se passe-t-il ?

### Scénario 1 : Cache HIT (Succès)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CACHE HIT                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   CPU demande: "Je veux lire l'adresse 0x00001234"                      │
│                                                                          │
│   Étape 1: Extraire les champs                                          │
│   ┌────────────────────────────────────────────────────┐                │
│   │ Tag = 0x00001  │  Index = 0x23  │  Offset = 0x4   │                │
│   └────────────────────────────────────────────────────┘                │
│                            │                                             │
│   Étape 2: Aller à la      │                                             │
│            ligne 0x23      ▼                                             │
│                    ┌───────────────────────────────────┐                │
│   Cache ligne 35:  │ Valid=1 │ Tag=0x00001 │ Données   │                │
│                    └───────────────────────────────────┘                │
│                         │          │                                     │
│   Étape 3: Vérifier     │          │                                     │
│            Valid = 1? ──┘          │                                     │
│            Tag match? ─────────────┘                                     │
│                                                                          │
│   Étape 4: OUI ! C'est un HIT !                                         │
│            ┌──────────────────────────────────────┐                     │
│            │  Retourner Données[Offset=4]         │                     │
│            │  Temps: ~1 ns                        │                     │
│            └──────────────────────────────────────┘                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Scénario 2 : Cache MISS (Échec)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CACHE MISS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   CPU demande: "Je veux lire l'adresse 0x00005678"                      │
│                                                                          │
│   Étape 1: Extraire les champs                                          │
│   ┌────────────────────────────────────────────────────┐                │
│   │ Tag = 0x00005  │  Index = 0x67  │  Offset = 0x8   │                │
│   └────────────────────────────────────────────────────┘                │
│                            │                                             │
│   Étape 2: Aller à la      │                                             │
│            ligne 0x67      ▼                                             │
│                    ┌───────────────────────────────────┐                │
│   Cache ligne 103: │ Valid=1 │ Tag=0x00099 │ Données   │                │
│                    └───────────────────────────────────┘                │
│                         │          │                                     │
│   Étape 3: Vérifier     │          │                                     │
│            Valid = 1? ──┘          │                                     │
│            Tag match? ─────────────┘  → 0x00005 ≠ 0x00099               │
│                                                                          │
│   Étape 4: NON ! C'est un MISS !                                        │
│            ┌──────────────────────────────────────────────┐             │
│            │  1. Aller chercher en RAM (lent: ~100 ns)    │             │
│            │  2. Charger la nouvelle ligne dans le cache  │             │
│            │  3. Retourner la donnée au CPU               │             │
│            └──────────────────────────────────────────────┘             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Diagramme de Flux Complet

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ALGORITHME DE LECTURE CACHE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                         ┌─────────────┐                                 │
│                         │ CPU demande │                                 │
│                         │  adresse A  │                                 │
│                         └──────┬──────┘                                 │
│                                │                                         │
│                                ▼                                         │
│                     ┌──────────────────────┐                            │
│                     │ Extraire Tag, Index, │                            │
│                     │      Offset de A     │                            │
│                     └──────────┬───────────┘                            │
│                                │                                         │
│                                ▼                                         │
│                     ┌──────────────────────┐                            │
│                     │ Lire ligne[Index]    │                            │
│                     └──────────┬───────────┘                            │
│                                │                                         │
│                                ▼                                         │
│                     ┌──────────────────────┐                            │
│              NON    │   Valid = 1 ?        │    OUI                     │
│           ┌─────────│                      │──────────┐                 │
│           │         └──────────────────────┘          │                 │
│           │                                           ▼                 │
│           │                              ┌──────────────────────┐       │
│           │                       NON    │   Tag correspond ?   │ OUI   │
│           │                    ┌─────────│                      │───┐   │
│           │                    │         └──────────────────────┘   │   │
│           ▼                    ▼                                    ▼   │
│    ┌─────────────┐      ┌─────────────┐                    ┌───────────┐│
│    │    MISS     │      │    MISS     │                    │    HIT    ││
│    │ Ligne vide  │      │ Mauvais tag │                    │  Succès ! ││
│    └──────┬──────┘      └──────┬──────┘                    └─────┬─────┘│
│           │                    │                                 │      │
│           └────────┬───────────┘                                 │      │
│                    │                                             │      │
│                    ▼                                             ▼      │
│         ┌────────────────────┐                    ┌────────────────────┐│
│         │ Charger depuis RAM │                    │ Retourner donnée   ││
│         │ Stocker dans cache │                    │ depuis le cache    ││
│         │ (~100 ns)          │                    │ (~1 ns)            ││
│         └────────────────────┘                    └────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Politiques d'Écriture

### Write-Through (Écriture Directe)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WRITE-THROUGH                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   CPU veut écrire la valeur 42 à l'adresse 0x1000                       │
│                                                                          │
│        ┌─────┐                                                          │
│        │ CPU │                                                          │
│        │     │── write(42, 0x1000) ──┬──────────────────────┐          │
│        └─────┘                       │                      │          │
│                                      ▼                      ▼          │
│                              ┌───────────┐          ┌───────────┐      │
│                              │   Cache   │          │    RAM    │      │
│                              │  (rapide) │          │  (lent)   │      │
│                              │   42 ✓    │          │   42 ✓    │      │
│                              └───────────┘          └───────────┘      │
│                                                                          │
│   ✓ Cache et RAM sont TOUJOURS synchronisés                             │
│   ✗ Chaque écriture attend la RAM (lent)                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Write-Back (Écriture Différée)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          WRITE-BACK                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Étape 1: CPU écrit 42                                                 │
│        ┌─────┐                                                          │
│        │ CPU │── write(42, 0x1000) ──►┌───────────┐                    │
│        └─────┘                        │   Cache   │                    │
│                                       │   42 ✓    │                    │
│                                       │  dirty=1  │  ← Marqué "modifié"│
│                                       └───────────┘                    │
│                                                                          │
│   Étape 2: Plus tard, quand la ligne doit être remplacée               │
│                                                                          │
│                              ┌───────────┐          ┌───────────┐      │
│                              │   Cache   │──────────│    RAM    │      │
│                              │  dirty=1  │  ────►   │   42 ✓    │      │
│                              │  → dirty=0│ écriture │           │      │
│                              └───────────┘          └───────────┘      │
│                                                                          │
│   ✓ Écritures rapides (seulement dans le cache)                         │
│   ✗ Plus complexe (bit dirty nécessaire)                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Impact sur vos Programmes

### Parcours de Tableaux 2D : L'Ordre Compte !

Une matrice 4x4 est stockée **ligne par ligne** en mémoire (row-major) :

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STOCKAGE MÉMOIRE D'UNE MATRICE 4x4                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Matrice logique:              Stockage en mémoire (linéaire):         │
│                                                                          │
│   ┌────┬────┬────┬────┐        Adresse: 0   4   8  12  16  20  24 ...  │
│   │ 0  │ 1  │ 2  │ 3  │ ─────►         ┌───┬───┬───┬───┬───┬───┬───┐   │
│   ├────┼────┼────┼────┤                │ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │...│
│   │ 4  │ 5  │ 6  │ 7  │ ─────►         └───┴───┴───┴───┴───┴───┴───┘   │
│   ├────┼────┼────┼────┤                │←─ Ligne 0 ─→│←─ Ligne 1 ─→│   │
│   │ 8  │ 9  │ 10 │ 11 │ ─────►                                          │
│   ├────┼────┼────┼────┤                                                  │
│   │ 12 │ 13 │ 14 │ 15 │ ─────►         Une ligne de cache (16 octets)   │
│   └────┴────┴────┴────┘                peut contenir 4 éléments         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Parcours Row-Major (En Ligne) - EFFICACE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PARCOURS ROW-MAJOR (EFFICACE)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Code:  for (i = 0..3)                                                 │
│            for (j = 0..3)                                               │
│              accès arr[i][j]                                            │
│                                                                          │
│   Ordre d'accès:                                                        │
│   ┌────┬────┬────┬────┐                                                 │
│   │ 1  │ 2  │ 3  │ 4  │  ← D'abord toute la ligne 0                    │
│   ├────┼────┼────┼────┤                                                 │
│   │ 5  │ 6  │ 7  │ 8  │  ← Puis toute la ligne 1                       │
│   ├────┼────┼────┼────┤                                                 │
│   │ 9  │ 10 │ 11 │ 12 │  ← Puis toute la ligne 2                       │
│   ├────┼────┼────┼────┤                                                 │
│   │ 13 │ 14 │ 15 │ 16 │  ← Puis toute la ligne 3                       │
│   └────┴────┴────┴────┘                                                 │
│                                                                          │
│   Mémoire:  [0][1][2][3][4][5][6][7][8][9][10][11][12][13][14][15]     │
│   Accès:     1  2  3  4  5  6  7  8  9  10  11  12  13  14  15  16     │
│              ─────────────────────────────────────────────────────►     │
│              Accès SÉQUENTIEL = Excellent pour le cache !              │
│                                                                          │
│   Hit Rate: ~95%                                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Parcours Column-Major (En Colonne) - INEFFICACE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   PARCOURS COLUMN-MAJOR (INEFFICACE)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Code:  for (j = 0..3)                                                 │
│            for (i = 0..3)                                               │
│              accès arr[i][j]                                            │
│                                                                          │
│   Ordre d'accès:                                                        │
│   ┌────┬────┬────┬────┐                                                 │
│   │ 1  │ 5  │ 9  │ 13 │                                                 │
│   ├────┼────┼────┼────┤     Ordre: 1→5→9→13 puis 2→6→10→14 ...         │
│   │ 2  │ 6  │ 10 │ 14 │            │  │  │  │                           │
│   ├────┼────┼────┼────┤            ▼  ▼  ▼  ▼                           │
│   │ 3  │ 7  │ 11 │ 15 │     On descend d'abord les colonnes            │
│   ├────┼────┼────┼────┤                                                 │
│   │ 4  │ 8  │ 12 │ 16 │                                                 │
│   └────┴────┴────┴────┘                                                 │
│                                                                          │
│   Mémoire:  [0][1][2][3][4][5][6][7][8][9][10][11][12][13][14][15]     │
│   Accès:     1        5        9        13   2        6       10 ...   │
│              ────┘    │        │         │   │        │        │       │
│                  └────┘    └───┘     └───┘   └────────┘    └───┘       │
│              SAUTS de 4 positions = Mauvais pour le cache !            │
│                                                                          │
│   Hit Rate: ~25%                                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Comparaison Visuelle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPARAISON ROW-MAJOR vs COLUMN-MAJOR                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ROW-MAJOR (bon):                   COLUMN-MAJOR (mauvais):            │
│                                                                          │
│   Cache Line 1: [0][1][2][3]         Cache Line 1: [0][1][2][3]         │
│                  ▲  ▲  ▲  ▲                         ▲        ▲          │
│                  │  │  │  │                         │        │          │
│                  1  2  3  4                         1 ─ ─ ─ ─5          │
│                  Tout utilisé!                      Gaspillé!           │
│                                                                          │
│   Cache Line 2: [4][5][6][7]         Cache Line 2: [4][5][6][7]         │
│                  ▲  ▲  ▲  ▲                         ▲        ▲          │
│                  │  │  │  │                         │        │          │
│                  5  6  7  8                         2 ─ ─ ─ ─6          │
│                  Tout utilisé!                      Gaspillé!           │
│                                                                          │
│   Résultat:                          Résultat:                          │
│   4 accès mémoire pour               16 accès mémoire pour              │
│   16 éléments                        16 éléments                        │
│                                                                          │
│   ████████████████ 95% hits          ████░░░░░░░░░░░░ 25% hits          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technique du Blocking

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       TECHNIQUE DE BLOCKING                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Au lieu de parcourir toute la matrice, on traite par BLOCS           │
│   qui tiennent dans le cache.                                           │
│                                                                          │
│   Matrice 4x4 divisée en blocs 2x2:                                     │
│                                                                          │
│   ┌─────────┬─────────┐                                                 │
│   │ ┌───┬───┐│ ┌───┬───┐│      Bloc 0 (indices 0,1,4,5)                 │
│   │ │ 0 │ 1 ││ │ 2 │ 3 ││      traité entièrement,                      │
│   │ ├───┼───┤│ ├───┼───┤│      puis Bloc 1, puis Bloc 2, puis Bloc 3   │
│   │ │ 4 │ 5 ││ │ 6 │ 7 ││                                               │
│   │ └───┴───┘│ └───┴───┘│                                               │
│   ├─────────┼─────────┤                                                 │
│   │ ┌───┬───┐│ ┌───┬───┐│                                               │
│   │ │ 8 │ 9 ││ │10 │11 ││                                               │
│   │ ├───┼───┤│ ├───┼───┤│                                               │
│   │ │12 │13 ││ │14 │15 ││                                               │
│   │ └───┴───┘│ └───┴───┘│                                               │
│   └─────────┴─────────┘                                                 │
│                                                                          │
│   Ordre de traitement:                                                   │
│   ┌───┐     ┌───┐     ┌───┐     ┌───┐                                   │
│   │ 1 │ ──► │ 2 │ ──► │ 3 │ ──► │ 4 │                                   │
│   └───┘     └───┘     └───┘     └───┘                                   │
│   Bloc 0    Bloc 1    Bloc 2    Bloc 3                                  │
│                                                                          │
│   Chaque bloc tient dans le cache → Excellente localité !               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implémentation HDL du Cache

### Architecture Globale

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ARCHITECTURE DU CACHE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                         CACHE MODULE                              │  │
│   │                                                                   │  │
│   │  Adresse ──┬──► ┌────────────┐                                   │  │
│   │            │    │  Décodeur  │──► Index (6 bits)                 │  │
│   │            │    │  d'adresse │──► Tag (22 bits)                  │  │
│   │            │    │            │──► Offset (4 bits)                │  │
│   │            │    └────────────┘                                   │  │
│   │            │           │                                          │  │
│   │            │           ▼                                          │  │
│   │            │    ┌────────────────────────────────────┐           │  │
│   │            │    │         Cache Lines (x64)          │           │  │
│   │            │    │  ┌──────┬──────┬────────────────┐  │           │  │
│   │            │    │  │Valid │ Tag  │     Data       │  │           │  │
│   │            │    │  │ (1)  │ (22) │    (128)       │  │           │  │
│   │            │    │  └──────┴──────┴────────────────┘  │           │  │
│   │            │    └────────────────────────────────────┘           │  │
│   │            │           │          │                               │  │
│   │            ▼           ▼          ▼                               │  │
│   │    ┌────────────┐ ┌────────────┐ ┌────────────┐                  │  │
│   │    │ TagCompare │ │ WordSelect │ │  Mux Data  │                  │  │
│   │    │            │ │            │ │            │                  │  │
│   │    │ hit/miss   │ │  4:1 mux   │ │  out data  │                  │  │
│   │    └──────┬─────┘ └──────┬─────┘ └──────┬─────┘                  │  │
│   │           │              │              │                         │  │
│   │           └──────┬───────┴──────────────┘                         │  │
│   │                  │                                                │  │
│   │                  ▼                                                │  │
│   │    ┌─────────────────────────────────────────┐                   │  │
│   │    │          CacheController                 │                   │  │
│   │    │                                          │                   │  │
│   │    │  ┌──────┐    ┌───────┐    ┌──────────┐ │                   │  │
│   │    │  │ IDLE │───►│ FETCH │───►│WRITEBACK │ │                   │  │
│   │    │  └──────┘    └───────┘    └──────────┘ │                   │  │
│   │    │                                          │                   │  │
│   │    └─────────────────────────────────────────┘                   │  │
│   │                                                                   │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Machine à États du Contrôleur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MACHINE À ÉTATS - CacheController                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                           ┌─────────────────┐                           │
│                 reset ───►│                 │                           │
│                           │      IDLE       │◄─────────────┐            │
│                           │      (00)       │              │            │
│                           │                 │              │            │
│              ┌────────────┤  Attente de     │──────────────┤            │
│              │            │   requête       │  hit=1       │            │
│              │            └────────┬────────┘  (réponse    │            │
│              │                     │           immédiate)  │            │
│              │        req=1 AND    │                       │            │
│              │        miss=1       │                       │            │
│              │                     ▼                       │            │
│              │            ┌─────────────────┐              │            │
│              │            │                 │              │            │
│              │            │     FETCH       │              │            │
│              │            │      (01)       │              │            │
│              │            │                 │              │            │
│              │            │  Charger ligne  │              │            │
│              │            │  depuis RAM     │              │            │
│              │            └────────┬────────┘              │            │
│              │                     │                       │            │
│              │            mem_ready=1                      │            │
│              │                     │                       │            │
│              │                     ▼                       │            │
│              │            ┌─────────────────┐              │            │
│              │            │                 │              │            │
│              │            │   WRITEBACK     │──────────────┘            │
│              │            │      (10)       │  mem_ready=1              │
│              │            │                 │                           │
│              │            │  Écrire dans    │                           │
│              │            │  le cache       │                           │
│              │            └─────────────────┘                           │
│              │                                                          │
│              └──────────────────────────────────────────────────────────┘
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### WordSelect : Sélection du Mot

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          WORDSELECT (Mux 4:1)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Ligne de cache (128 bits):                                            │
│   ┌─────────────┬─────────────┬─────────────┬─────────────┐            │
│   │   Mot 3     │   Mot 2     │   Mot 1     │   Mot 0     │            │
│   │ bits 127-96 │ bits 95-64  │ bits 63-32  │ bits 31-0   │            │
│   └──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┘            │
│          │             │             │             │                    │
│          └─────────────┴──────┬──────┴─────────────┘                    │
│                               │                                         │
│                               ▼                                         │
│                    ┌────────────────────┐                               │
│   word_sel ──────► │     Mux 4:1        │                               │
│   (2 bits)         │                    │                               │
│                    └──────────┬─────────┘                               │
│                               │                                         │
│                               ▼                                         │
│                    ┌────────────────────┐                               │
│                    │    word_out        │                               │
│                    │    (32 bits)       │                               │
│                    └────────────────────┘                               │
│                                                                          │
│   word_sel = 00 → Mot 0 (bits 31-0)                                     │
│   word_sel = 01 → Mot 1 (bits 63-32)                                    │
│   word_sel = 10 → Mot 2 (bits 95-64)                                    │
│   word_sel = 11 → Mot 3 (bits 127-96)                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Statistiques et Performance

### Calcul du Hit Rate

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CALCUL DU HIT RATE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                        Nombre de Hits                                   │
│   Hit Rate = ───────────────────────────────── × 100%                   │
│               Nombre de Hits + Nombre de Misses                         │
│                                                                          │
│   ═══════════════════════════════════════════════════════════════════   │
│                                                                          │
│   Exemple: 1 million d'accès mémoire                                    │
│   ─────────────────────────────────                                     │
│   • 950,000 hits  (trouvés dans le cache)                               │
│   •  50,000 misses (chargés depuis la RAM)                              │
│                                                                          │
│              950,000                                                     │
│   Hit Rate = ─────────── × 100% = 95%                                   │
│              1,000,000                                                   │
│                                                                          │
│   ═══════════════════════════════════════════════════════════════════   │
│                                                                          │
│   Temps moyen par accès:                                                │
│                                                                          │
│   = (950,000 × 1ns) + (50,000 × 100ns)                                  │
│     ────────────────────────────────────                                │
│              1,000,000                                                   │
│                                                                          │
│   = 950,000 + 5,000,000  = 5,950,000 ns                                 │
│     ─────────────────────  ───────────── = 5.95 ns/accès                │
│        1,000,000            1,000,000                                    │
│                                                                          │
│   Sans cache: 100 ns/accès                                              │
│   Avec cache: 5.95 ns/accès                                             │
│                                                                          │
│   Gain: 100 / 5.95 ≈ 17× plus rapide !                                  │
│                                                                          │
│   ████████████████████████████████████████████████████████ 95%         │
│   ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  5%          │
│   │                                                         │           │
│   └─────── Hits (rapides) ──────────────────────────────────┘           │
│                                               └── Misses (lents)        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Exercices

### Exercices HDL

| Exercice | Description |
|:---------|:------------|
| **CacheLine** | Implémenter une ligne de cache avec valid, tag, data |
| **TagCompare** | Comparateur de tags pour détecter hit/miss |
| **WordSelect** | Sélecteur de mot (4:1) dans une ligne 128 bits |
| **CacheController** | Machine à états (IDLE, FETCH, WRITEBACK) |

### Exercices Assembleur A32

| Exercice | Description | Résultat |
|:---------|:------------|:---------|
| **Accès Séquentiel** | Parcours cache-friendly d'un tableau | R0 = 100 |
| **Accès avec Stride** | Parcours avec sauts (moins efficace) | R0 = 28 |
| **Réutilisation Registre** | Garder les données en registre | R0 = 91 |

### Exercices C32

| Exercice | Description | Résultat |
|:---------|:------------|:---------|
| **Parcours en Ligne** | Accès row-major (cache-friendly) | 120 |
| **Parcours en Colonne** | Accès column-major (moins efficace) | 120 |
| **Traitement par Blocs** | Technique de blocking | 120 |
| **Localité Temporelle** | Réutiliser les données | 30 |

---

## Résumé Visuel

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RÉSUMÉ DU CACHE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   POURQUOI ?                                                            │
│   ──────────                                                            │
│   RAM (~100ns) est 100× plus lente que le CPU (~1ns)                   │
│   → Le cache comble cet écart                                           │
│                                                                          │
│   COMMENT ?                                                             │
│   ─────────                                                             │
│   Exploite la LOCALITÉ:                                                 │
│   • Temporelle: réutilisation des données récentes                      │
│   • Spatiale: données voisines accédées ensemble                        │
│                                                                          │
│   STRUCTURE:                                                            │
│   ──────────                                                            │
│   Adresse → [Tag | Index | Offset]                                      │
│   Ligne de cache → [Valid | Tag | Données (16 octets)]                 │
│                                                                          │
│   OPTIMISATION:                                                         │
│   ─────────────                                                         │
│   ✓ Parcours row-major (accès séquentiels)                             │
│   ✓ Blocking (traitement par blocs)                                     │
│   ✓ Réutilisation des registres                                         │
│   ✗ Parcours column-major (sauts en mémoire)                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Points Clés à Retenir

1. **La RAM est lente** : ~100x plus lente que le cache
2. **Le cache exploite la localité** : temporelle et spatiale
3. **L'ordre d'accès compte** : row-major >> column-major
4. **Réutilisez les données** : gardez-les en registre ou en cache
5. **Pensez en blocs** : traitez des données qui tiennent dans le cache

Ces principes s'appliquent à tous les niveaux de programmation, du code assembleur aux applications modernes !
