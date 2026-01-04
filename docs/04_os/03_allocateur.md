# Chapitre 3 : L'Allocateur Mémoire

## Objectif

Implémenter malloc() et free() pour gérer la mémoire dynamique.

## Le problème

Sans OS, pas de malloc. Vous devez le créer :

```c
// Ce qu'on veut pouvoir faire :
int *arr = malloc(100 * sizeof(int));
// ... utilisation ...
free(arr);
```

## Stratégies d'allocation

### 1. Bump Allocator (le plus simple)

```
┌────────────────────────────────────────────┐
│  Alloué  │  Alloué  │  Alloué  │   Libre   │
└────────────────────────────────────────────┘
                                  ↑
                              heap_ptr
```

```c
char *heap_start = (char*)0x00150000;
char *heap_end   = (char*)0x00200000;
char *heap_ptr   = (char*)0x00150000;

void *malloc(int size) {
    // Aligne sur 4 octets
    size = (size + 3) & ~3;

    if (heap_ptr + size > heap_end) {
        return 0;  // Plus de mémoire
    }

    void *ptr = heap_ptr;
    heap_ptr += size;
    return ptr;
}

void free(void *ptr) {
    // Ne fait rien !
    // La mémoire n'est jamais réutilisée
}
```

**Avantages** : Simple, rapide, pas de fragmentation
**Inconvénients** : La mémoire n'est jamais libérée

### 2. Free List (liste chaînée)

```
┌──────────┬──────────┬──────────┬──────────┐
│  Alloué  │  Libre   │  Alloué  │  Libre   │
└──────────┴──────────┴──────────┴──────────┘
               ↓                      ↓
           ┌───────┐              ┌───────┐
           │ size  │──────────────│ size  │
           │ next ─┼──────────────│ next  │→ NULL
           └───────┘              └───────┘
```

```c
typedef struct Block {
    int size;               // Taille du bloc (sans l'en-tête)
    struct Block *next;     // Bloc libre suivant (si libre)
    int free;               // 1 = libre, 0 = alloué
} Block;

#define HEADER_SIZE sizeof(Block)

Block *free_list = NULL;
char *heap_start;
char *heap_end;

void heap_init(void *start, int size) {
    heap_start = (char*)start;
    heap_end = heap_start + size;

    // Crée un bloc libre initial
    free_list = (Block*)heap_start;
    free_list->size = size - HEADER_SIZE;
    free_list->next = NULL;
    free_list->free = 1;
}

void *malloc(int size) {
    // Aligne
    size = (size + 3) & ~3;

    // Cherche un bloc libre assez grand (first-fit)
    Block *current = free_list;
    Block *prev = NULL;

    while (current) {
        if (current->free && current->size >= size) {
            // Trouvé !

            // Split si le bloc est beaucoup plus grand
            if (current->size > size + HEADER_SIZE + 16) {
                Block *new_block = (Block*)((char*)current + HEADER_SIZE + size);
                new_block->size = current->size - size - HEADER_SIZE;
                new_block->next = current->next;
                new_block->free = 1;

                current->size = size;
                current->next = new_block;
            }

            current->free = 0;
            return (char*)current + HEADER_SIZE;
        }

        prev = current;
        current = current->next;
    }

    return NULL;  // Pas de bloc assez grand
}

void free(void *ptr) {
    if (!ptr) return;

    Block *block = (Block*)((char*)ptr - HEADER_SIZE);
    block->free = 1;

    // Fusionne avec le bloc suivant si libre
    if (block->next && block->next->free) {
        block->size += HEADER_SIZE + block->next->size;
        block->next = block->next->next;
    }

    // Note: ne fusionne pas avec le précédent (complexe)
}
```

### 3. Buddy Allocator

Divise la mémoire en puissances de 2 :

```
Initial: [──────────── 1024 ────────────]

Alloc 100:
          [── 128 ──][── 128 ──][── 256 ──][── 512 ──]
           (alloué)    (libre)    (libre)    (libre)

Alloc 200:
          [── 128 ──][── 128 ──][── 256 ──][── 512 ──]
           (alloué)    (libre)   (alloué)    (libre)

Free premier:
          [── 128 ──][── 128 ──][── 256 ──][── 512 ──]
            (libre)    (libre)   (alloué)    (libre)
              ↓          ↓
          [────── 256 ──────][── 256 ──][── 512 ──]
               (libre)        (alloué)    (libre)
```

```c
#define MAX_ORDER 10  // 2^10 = 1024 bytes max

typedef struct {
    int order;      // Puissance de 2
    int free;       // 1 = libre
} BuddyBlock;

BuddyBlock *free_lists[MAX_ORDER + 1];

int size_to_order(int size) {
    int order = 0;
    size += sizeof(BuddyBlock);
    while ((1 << order) < size) {
        order++;
    }
    return order;
}

void *buddy_alloc(int size) {
    int order = size_to_order(size);

    // Cherche un bloc libre de cet ordre ou plus grand
    int current_order = order;
    while (current_order <= MAX_ORDER && !free_lists[current_order]) {
        current_order++;
    }

    if (current_order > MAX_ORDER) {
        return NULL;  // Pas de mémoire
    }

    // Split jusqu'à l'ordre demandé
    while (current_order > order) {
        BuddyBlock *block = free_lists[current_order];
        free_lists[current_order] = NULL;  // Simplifié

        current_order--;

        // Crée deux buddies
        BuddyBlock *buddy1 = block;
        BuddyBlock *buddy2 = (BuddyBlock*)((char*)block + (1 << current_order));

        buddy1->order = current_order;
        buddy1->free = 1;
        buddy2->order = current_order;
        buddy2->free = 1;

        free_lists[current_order] = buddy1;
        // Ajoute buddy2 aussi...
    }

    BuddyBlock *result = free_lists[order];
    free_lists[order] = NULL;  // Simplifié
    result->free = 0;

    return (char*)result + sizeof(BuddyBlock);
}
```

## Debugging de l'allocateur

### Détection des fuites

```c
int alloc_count = 0;
int free_count = 0;

void *malloc_debug(int size) {
    void *ptr = malloc(size);
    if (ptr) {
        alloc_count++;
        print("malloc: ");
        print_hex((int)ptr);
        print(" size=");
        print_int(size);
        print("\n");
    }
    return ptr;
}

void free_debug(void *ptr) {
    if (ptr) {
        free_count++;
        print("free: ");
        print_hex((int)ptr);
        print("\n");
    }
    free(ptr);
}

void check_leaks() {
    if (alloc_count != free_count) {
        print("LEAK: ");
        print_int(alloc_count - free_count);
        print(" blocks not freed\n");
    }
}
```

### Détection des double-free

```c
void free_safe(void *ptr) {
    if (!ptr) return;

    Block *block = (Block*)((char*)ptr - HEADER_SIZE);

    if (block->free) {
        panic("Double free detected!");
    }

    block->free = 1;
}
```

### Canary pour détecter les overflows

```c
#define CANARY 0xDEADC0DE

void *malloc_canary(int size) {
    // Alloue size + 2 canaries
    char *ptr = malloc(size + 8);
    if (!ptr) return NULL;

    // Canary avant
    *(int*)ptr = CANARY;

    // Canary après
    *(int*)(ptr + 4 + size) = CANARY;

    return ptr + 4;
}

void free_canary(void *ptr) {
    char *real_ptr = (char*)ptr - 4;
    Block *block = (Block*)(real_ptr - HEADER_SIZE);
    int size = block->size - 8;

    // Vérifie les canaries
    if (*(int*)real_ptr != CANARY) {
        panic("Heap underflow!");
    }
    if (*(int*)(real_ptr + 4 + size) != CANARY) {
        panic("Heap overflow!");
    }

    free(real_ptr);
}
```

## Statistiques heap

```c
void heap_stats() {
    Block *current = (Block*)heap_start;
    int total_free = 0;
    int total_used = 0;
    int num_blocks = 0;
    int num_free = 0;

    while ((char*)current < heap_end) {
        num_blocks++;
        if (current->free) {
            num_free++;
            total_free += current->size;
        } else {
            total_used += current->size;
        }
        current = (Block*)((char*)current + HEADER_SIZE + current->size);
    }

    print("Heap stats:\n");
    print("  Blocks: "); print_int(num_blocks); print("\n");
    print("  Free: "); print_int(num_free); print("\n");
    print("  Used: "); print_int(total_used); print(" bytes\n");
    print("  Free: "); print_int(total_free); print(" bytes\n");
}
```

## Exercices

### Exercice 1 : Implémenter realloc

```c
void *realloc(void *ptr, int new_size) {
    if (!ptr) return malloc(new_size);
    if (new_size == 0) { free(ptr); return NULL; }

    // Votre code ici
}
```

### Exercice 2 : calloc

```c
void *calloc(int count, int size) {
    // Alloue et initialise à zéro
}
```

### Exercice 3 : Fusion avec le bloc précédent

Améliorez free() pour fusionner avec le bloc précédent aussi.

### Exercice 4 : Best-fit vs First-fit

Implémentez best-fit (cherche le plus petit bloc suffisant) et comparez les performances.

## Points clés

1. **Header** = métadonnées avant chaque bloc
2. **Fragmentation** = trous inutilisables
3. **Coalescing** = fusion des blocs libres adjacents
4. **Alignement** = crucial pour les performances

## Prochaine étape

[Chapitre 4 : Drivers →](04_drivers.md)
