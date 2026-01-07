# Le Cache : Pourquoi Votre Ordinateur Semble Rapide

Imaginez que vous travaillez dans un bureau et que vous avez besoin de consulter des documents. Vous avez deux options :
- **Votre bureau** : les documents sont juste devant vous, vous pouvez les lire instantanément
- **Les archives au sous-sol** : il faut descendre 5 étages, chercher le bon dossier, remonter... cela prend plusieurs minutes

Le **cache** est exactement comme votre bureau : une petite zone de stockage très rapide où l'on garde les documents (données) les plus utilisés, pour éviter d'aller constamment aux archives (la mémoire RAM).

---

## Le Problème : La RAM est Lente !

### La Hiérarchie Mémoire

Voici comment est organisée la mémoire dans un ordinateur, du plus rapide au plus lent :

![Hiérarchie mémoire](images/memory-hierarchy.svg)

### L'écart de vitesse visualisé

Si on convertissait ces temps en échelle humaine, les registres seraient comme cligner des yeux (0.3 seconde), le cache L1 comme une seconde, le cache L2 comme 4 secondes, la RAM comme 1 minute 40 secondes, et accéder au SSD prendrait... **27 heures** !

Sans cache, le processeur passerait **99% de son temps à attendre** !

---

## La Solution : Le Principe de Localité

Les programmes ne lisent pas la mémoire au hasard. Ils suivent des **patterns** prévisibles.

### Localité Temporelle

**"Si j'utilise une donnée maintenant, je vais probablement la réutiliser bientôt"**

![Localité temporelle](images/temporal-locality.svg)

### Localité Spatiale

**"Si j'utilise une donnée, je vais probablement utiliser ses voisines"**

![Localité spatiale](images/spatial-locality.svg)

---

## Comment Fonctionne le Cache ?

### Les Lignes de Cache

Le cache stocke des **blocs** de données appelés **lignes de cache**, pas des octets individuels.

Quand vous demandez l'adresse 100, le cache charge **16 octets ensemble** (adresses 100 à 115). Ensuite, si vous demandez 101, 102, 103... c'est gratuit car déjà en cache !

### Structure d'une Ligne de Cache

![Structure d'une ligne de cache](images/cache-line-structure.svg)

### Découpage d'une Adresse

Quand le CPU demande l'adresse `0x00001234`, comment le cache la trouve-t-il ?

![Décomposition d'une adresse](images/address-decomposition.svg)

### Structure Complète du Cache

![Cache direct-mapped](images/cache-direct-mapped.svg)

---

## Hit ou Miss : Que se passe-t-il ?

### Scénario 1 : Cache HIT (Succès)

![Scénario Cache HIT](images/cache-hit-scenario.svg)

### Scénario 2 : Cache MISS (Échec)

![Scénario Cache MISS](images/cache-miss-scenario.svg)

### Diagramme de Flux Complet

![Algorithme de lecture cache](images/cache-flowchart.svg)

---

## Politiques d'Écriture

### Write-Through (Écriture Directe)

![Write-Through](images/write-through.svg)

### Write-Back (Écriture Différée)

![Write-Back](images/write-back.svg)

---

## Impact sur vos Programmes

### Parcours de Tableaux 2D : L'Ordre Compte !

Une matrice 4x4 est stockée **ligne par ligne** en mémoire (row-major) :

![Stockage mémoire d'une matrice](images/matrix-storage.svg)

### Parcours Row-Major (En Ligne) - EFFICACE

![Parcours Row-Major](images/row-major-traversal.svg)

### Parcours Column-Major (En Colonne) - INEFFICACE

![Parcours Column-Major](images/column-major-traversal.svg)

### Comparaison Visuelle

![Comparaison Row-Major vs Column-Major](images/cache-comparison.svg)

### Technique du Blocking

![Technique de Blocking](images/blocking-technique.svg)

---

## Implémentation HDL du Cache

### Architecture Globale

![Architecture du cache HDL](images/cache-architecture-hdl.svg)

### Machine à États du Contrôleur

![Machine à états du CacheController](images/cache-controller-fsm.svg)

### WordSelect : Sélection du Mot

![WordSelect](images/word-select.svg)

---

## Statistiques et Performance

### Calcul du Hit Rate

![Calcul du Hit Rate](images/hit-rate-calculation.svg)

---

## Visualiser le Cache avec le CPU Visualizer

Le **CPU Visualizer** vous permet d'observer le comportement du cache en temps réel pendant l'exécution d'un programme.

### Accéder au Visualizer

```bash
cd web
npm run dev
# Ouvrir http://localhost:5173 -> CPU Visualizer
```

### La Démo "Cache"

Chargez la démo **"7. Cache"** dans le menu déroulant. Ce programme :
1. Parcourt un tableau de 16 éléments une première fois (cache misses)
2. Parcourt le même tableau une seconde fois (cache hits)

### Ce que vous verrez

**Panneau "Cache L1"** :
- **Hits** : Nombre d'accès trouvés dans le cache
- **Misses** : Nombre d'accès qui ont dû aller en RAM
- **Taux** : Pourcentage de hits (ex: "94.2%")
- **Indicateur HIT/MISS** : Flash vert pour hit, rouge pour miss

**Contenu du cache** :
- **Ligne** : Numéro de la ligne (0-63)
- **Valid** : 1 si la ligne contient des données valides
- **Tag** : Identifie quelle zone mémoire est stockée
- **Données** : Le mot stocké dans la ligne

### Exercice Pratique

1. Lancez la démo "Cache" et observez :
   - Au premier parcours : beaucoup de **MISS** (flash rouge)
   - Au second parcours : beaucoup de **HIT** (flash vert)

2. Regardez le taux de hits évoluer :
   - Début : ~0% (cache vide)
   - Après premier parcours : ~50%
   - Fin : ~85-95%

3. Observez les lignes de cache se remplir :
   - Les bits Valid passent de 0 à 1
   - Les Tags s'affichent
   - Les données apparaissent

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

![Résumé du cache](images/cache-summary.svg)

---

## Points Clés à Retenir

1. **La RAM est lente** : ~100x plus lente que le cache
2. **Le cache exploite la localité** : temporelle et spatiale
3. **L'ordre d'accès compte** : row-major >> column-major
4. **Réutilisez les données** : gardez-les en registre ou en cache
5. **Pensez en blocs** : traitez des données qui tiennent dans le cache

Ces principes s'appliquent à tous les niveaux de programmation, du code assembleur aux applications modernes !
