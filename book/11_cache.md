# Cache L1 : Memoire Rapide

Le cache est une memoire ultra-rapide placee entre le processeur et la memoire principale. Son role est d'exploiter la *localite* des acces memoire pour reduire la latence.

---

## Pourquoi le Cache ?

La memoire RAM est lente comparee au processeur :
- Un cycle CPU : ~0.3 ns (3 GHz)
- Un acces RAM : ~100 ns

Sans cache, le processeur passerait 99% de son temps a attendre la memoire !

### Localite des Acces Memoire

Les programmes exhibent deux types de localite :

**Localite temporelle** : Une donnee recemment accedee sera probablement reutilisee bientot.
```c
for (int i = 0; i < 1000; i++) {
    sum += arr[i];  // 'sum' est accedee 1000 fois
}
```

**Localite spatiale** : Les donnees proches en memoire sont souvent accedees ensemble.
```c
for (int i = 0; i < 100; i++) {
    process(arr[i]);  // arr[0], arr[1], arr[2]... sont contigus
}
```

---

## Structure du Cache

### Ligne de Cache

Le cache ne stocke pas des octets individuels, mais des **lignes de cache** (typiquement 16-64 octets).

```
+-------+-------+------------------------+
| Valid | Tag   | Data (16 bytes)        |
+-------+-------+------------------------+
|   1   | 0x123 | 0x11 0x22 0x33 ... 0xFF|
+-------+-------+------------------------+
```

- **Valid** : La ligne contient-elle des donnees valides ?
- **Tag** : Identifiant de l'adresse memoire
- **Data** : Les donnees elles-memes (plusieurs mots)

### Decomposition d'Adresse

Une adresse 32 bits est decomposee en trois parties :

```
|<------ Tag ------>|<-- Index -->|<- Offset ->|
|    22 bits        |   6 bits    |   4 bits   |
```

- **Tag** (22 bits) : Identifie la region memoire
- **Index** (6 bits) : Selectionne une ligne parmi 64
- **Offset** (4 bits) : Position dans la ligne (16 octets)

### Cache Direct-Mapped

Notre implementation utilise un cache **direct-mapped** : chaque adresse ne peut aller que dans une seule ligne.

```
Adresse 0x1234 -> Index = (0x1234 >> 4) & 0x3F = ligne 3
Adresse 0x5678 -> Index = (0x5678 >> 4) & 0x3F = ligne 7
```

Avantages :
- Simple a implementer
- Lookup rapide (une seule comparaison)

Inconvenients :
- Conflits : deux adresses peuvent "se battre" pour la meme ligne

---

## Fonctionnement

### Lecture (Read)

1. Calculer l'index et le tag de l'adresse
2. Verifier si la ligne est valide et si le tag correspond
3. **Hit** : Retourner la donnee depuis le cache
4. **Miss** : Charger la ligne depuis la RAM, puis retourner la donnee

```
   CPU                    Cache                    RAM
    |                       |                        |
    |-- read(0x1234) ------>|                        |
    |                       |-- lookup index 3 ----->|
    |                       |   tag match? valid?    |
    |                       |                        |
    |<-- data (if hit) -----|                        |
    |                       |                        |
    |         (if miss)     |<-- load line ---------|
    |<-- data --------------|                        |
```

### Ecriture (Write)

Notre cache utilise une politique **write-through** :
- Les ecritures vont directement en memoire ET dans le cache
- Simple mais plus de trafic memoire

Alternative : **write-back**
- Ecriture seulement dans le cache
- Ecriture en memoire seulement quand la ligne est evincee
- Plus complexe (bit "dirty" necessaire)

---

## Implementation HDL

### CacheLine

Une ligne de cache avec tous ses champs :

```vhdl
entity CacheLine is
  port(
    clk : in bit;
    write_enable : in bit;
    write_tag : in bits(19 downto 0);
    write_data : in bits(127 downto 0);
    invalidate : in bit;
    valid : out bit;
    tag : out bits(19 downto 0);
    data : out bits(127 downto 0)
  );
end entity;
```

### TagCompare

Comparateur pour detecter un hit :

```vhdl
entity TagCompare is
  port(
    valid : in bit;
    addr_tag : in bits(19 downto 0);
    stored_tag : in bits(19 downto 0);
    hit : out bit
  );
end entity;
```

### CacheController

Machine a etats pour gerer les acces :

```
        +-------+
  reset |       |
        v       |
     +------+   |
     | IDLE |---+ read/write hit
     +------+
        |
        | read/write miss
        v
     +-------+
     | FETCH |-----> load line from RAM
     +-------+
        |
        | mem_ready (and write pending)
        v
     +----------+
     | WRITEBACK |----> write to RAM
     +----------+
        |
        | mem_ready
        v
     (back to IDLE)
```

---

## Optimisation des Programmes

### Parcours Row-Major vs Column-Major

Un tableau 2D `arr[4][4]` est stocke ligne par ligne :

```
Memoire: [0,0] [0,1] [0,2] [0,3] [1,0] [1,1] ...
```

**Parcours row-major** (cache-friendly) :
```c
for (i = 0; i < 4; i++)
    for (j = 0; j < 4; j++)
        sum += arr[i][j];  // Acces sequentiel
```

**Parcours column-major** (cache-unfriendly) :
```c
for (j = 0; j < 4; j++)
    for (i = 0; i < 4; i++)
        sum += arr[i][j];  // Sauts en memoire!
```

### Blocking (Loop Tiling)

Pour de grands tableaux, traiter par blocs qui tiennent dans le cache :

```c
for (bi = 0; bi < N; bi += BLOCK) {
    for (bj = 0; bj < N; bj += BLOCK) {
        // Traiter le bloc [bi..bi+BLOCK][bj..bj+BLOCK]
        for (i = bi; i < bi+BLOCK; i++) {
            for (j = bj; j < bj+BLOCK; j++) {
                // Bloc en cache!
            }
        }
    }
}
```

---

## Statistiques du Cache

Notre simulateur collecte des statistiques :

- **Hits** : Nombre d'acces trouves dans le cache
- **Misses** : Nombre d'acces necessitant un chargement RAM
- **Hit Rate** : `hits / (hits + misses) * 100%`

Un programme bien optimise atteint typiquement 90-99% de hit rate.

---

## Exercices

### HDL
1. **CacheLine** : Implementer une ligne de cache
2. **TagCompare** : Comparateur de tags
3. **WordSelect** : Selecteur de mot dans une ligne
4. **CacheController** : Machine a etats

### C (Patterns d'acces)
1. **Parcours en Ligne** : Acces sequentiel (cache-friendly)
2. **Parcours en Colonne** : Acces avec sauts (cache-unfriendly)
3. **Blocking** : Traitement par blocs
4. **Localite Temporelle** : Reutilisation des donnees

---

## Resume

| Concept | Description |
|:--------|:------------|
| Ligne de cache | Unite de stockage (16 bytes) |
| Tag | Identifiant d'adresse |
| Index | Selection de ligne |
| Offset | Position dans la ligne |
| Hit | Donnee trouvee dans le cache |
| Miss | Donnee absente, chargement requis |
| Write-through | Ecriture immediate en RAM |
| Localite spatiale | Donnees proches accedees ensemble |
| Localite temporelle | Donnees reutilisees rapidement |
