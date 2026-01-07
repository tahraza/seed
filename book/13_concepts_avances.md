# Concepts Avancés : Du Code Source à l'Exécution

Ce chapitre explore des concepts essentiels qui relient le code que vous écrivez à son exécution réelle : comment les programmes sont assemblés et liés, comment gérer les erreurs proprement, et comment faire tourner plusieurs tâches "en parallèle".

---

## Partie 1 : Compilation et Linking

### Le Voyage du Code Source

```
┌──────────────────────────────────────────────────────────────────┐
│                    Pipeline de Compilation                        │
└──────────────────────────────────────────────────────────────────┘

  main.c          math.c          stdio.h
    │               │                │
    ▼               ▼                │
┌────────┐     ┌────────┐           │
│Préproc.│     │Préproc.│ ◄─────────┘
└───┬────┘     └───┬────┘
    │               │
    ▼               ▼
┌────────┐     ┌────────┐
│Compil. │     │Compil. │
└───┬────┘     └───┬────┘
    │               │
    ▼               ▼
  main.s          math.s
    │               │
    ▼               ▼
┌────────┐     ┌────────┐
│Assemb. │     │Assemb. │
└───┬────┘     └───┬────┘
    │               │
    ▼               ▼
  main.o          math.o       libc.a
    │               │             │
    └───────┬───────┴─────────────┘
            │
            ▼
       ┌────────┐
       │ Linker │
       └───┬────┘
            │
            ▼
       programme.exe
```

### Le Préprocesseur

Le préprocesseur traite le code **avant** la compilation :

```c
// Inclusion de fichiers
#include <stdio.h>      // Fichiers système : /usr/include/
#include "myheader.h"   // Fichiers locaux : ./

// Macros de substitution
#define MAX_SIZE 100
#define SQUARE(x) ((x) * (x))

int arr[MAX_SIZE];          // → int arr[100];
int y = SQUARE(5);          // → int y = ((5) * (5));
int z = SQUARE(a + b);      // → int z = ((a + b) * (a + b));

// ATTENTION aux pièges des macros !
#define BAD_SQUARE(x) x * x
int bad = BAD_SQUARE(a + b);  // → int bad = a + b * a + b; FAUX !

// Compilation conditionnelle
#ifdef DEBUG
    printf("Variable x = %d\n", x);
#endif

#if PLATFORM == WINDOWS
    #include "win32.h"
#elif PLATFORM == LINUX
    #include "linux.h"
#else
    #error "Platform non supportée"
#endif

// Protection contre les inclusions multiples
#ifndef MYHEADER_H
#define MYHEADER_H
// ... contenu du header ...
#endif
```

Voir le résultat du préprocesseur :
```bash
gcc -E main.c -o main.i    # Sortie préprocessée
```

### Les Fichiers Objets (.o)

Un fichier objet contient :

```
┌─────────────────────────────────────────────────────────────┐
│                    Structure d'un .o                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Header                                                      │
│  ├── Magic number (identifie le format)                     │
│  ├── Architecture cible (ARM, x86, etc.)                    │
│  └── Taille des sections                                    │
│                                                              │
│  Section .text (code)                                        │
│  │  0x0000: PUSH {R4, LR}                                   │
│  │  0x0004: MOV R4, R0                                      │
│  │  0x0008: BL ????         ← Adresse de printf inconnue   │
│  │  ...                                                      │
│                                                              │
│  Section .data (variables initialisées)                      │
│  │  0x0000: message: .asciz "Hello"                         │
│  │  0x0008: count:   .word 42                               │
│                                                              │
│  Section .bss (variables non-initialisées)                   │
│  │  0x0000: buffer: .space 1024                             │
│                                                              │
│  Section .rodata (constantes)                                │
│  │  0x0000: pi: .float 3.14159                              │
│                                                              │
│  Table des Symboles                                          │
│  │  main        : .text + 0x0000  (GLOBAL, DEFINED)         │
│  │  helper      : .text + 0x0040  (LOCAL, DEFINED)          │
│  │  printf      : ???             (GLOBAL, UNDEFINED)  ←    │
│  │  malloc      : ???             (GLOBAL, UNDEFINED)  ←    │
│                                                              │
│  Table de Relocation                                         │
│  │  .text+0x0008 : référence à 'printf'                     │
│  │  .text+0x0020 : référence à 'message' (.data)            │
│  │  ...                                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Le Linker (Éditeur de Liens)

Le linker combine les fichiers objets :

```
┌─────────────────────────────────────────────────────────────┐
│                   Travail du Linker                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. COLLECTE : Rassembler toutes les sections                │
│                                                              │
│     main.o            math.o            libc.a              │
│     ┌────────┐        ┌────────┐        ┌────────┐          │
│     │ .text  │        │ .text  │        │ printf │          │
│     │ .data  │   +    │ .data  │   +    │ malloc │          │
│     │ .bss   │        │ .bss   │        │ ...    │          │
│     └────────┘        └────────┘        └────────┘          │
│                                                              │
│  2. FUSION : Combiner les sections de même type              │
│                                                              │
│     Exécutable final :                                       │
│     ┌──────────────────────────────────┐                    │
│     │ .text : main.o.text              │ 0x00001000         │
│     │         math.o.text              │ 0x00001200         │
│     │         libc.text (printf, etc.) │ 0x00001400         │
│     ├──────────────────────────────────┤                    │
│     │ .data : main.o.data              │ 0x00002000         │
│     │         math.o.data              │ 0x00002100         │
│     ├──────────────────────────────────┤                    │
│     │ .bss  : (alloué mais pas stocké) │ 0x00003000         │
│     └──────────────────────────────────┘                    │
│                                                              │
│  3. RELOCATION : Résoudre les adresses                       │
│                                                              │
│     Avant : BL ????        (printf non résolu)              │
│     Après : BL 0x00001480  (adresse finale de printf)       │
│                                                              │
│  4. RÉSOLUTION : Vérifier que tout est défini                │
│                                                              │
│     Si un symbole reste UNDEFINED → Erreur de link !        │
│     "undefined reference to 'foo'"                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Linking Statique vs Dynamique

```
┌─────────────────────────────────────────────────────────────┐
│              LINKING STATIQUE                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  gcc main.o -static -o programme                            │
│                                                              │
│  Exécutable contient TOUT :                                  │
│  ┌─────────────────────────────┐                            │
│  │  Code de main()             │                            │
│  │  Code de printf()    ← copié de libc.a                   │
│  │  Code de malloc()    ← copié de libc.a                   │
│  │  ...toute la libc... ← GROS fichier !                    │
│  └─────────────────────────────┘                            │
│                                                              │
│  + Autonome, pas de dépendances                              │
│  + Légèrement plus rapide (pas de résolution runtime)        │
│  - Gros exécutable (plusieurs MB)                            │
│  - Pas de mise à jour de libc sans recompiler                │
│  - Duplication si plusieurs programmes utilisent libc        │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              LINKING DYNAMIQUE                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  gcc main.o -o programme                                    │
│                                                              │
│  Exécutable minimal + références :                           │
│  ┌─────────────────────────────┐                            │
│  │  Code de main()             │                            │
│  │  REF: printf → libc.so      │                            │
│  │  REF: malloc → libc.so      │                            │
│  └─────────────────────────────┘                            │
│                                                              │
│  Au chargement (runtime) :                                   │
│  ┌─────────────────────────────┐     ┌──────────────┐       │
│  │     programme               │     │   libc.so    │       │
│  │  ┌───────────────────────┐  │     │  printf()    │       │
│  │  │ printf ─────────────────────────→            │       │
│  │  │ malloc ─────────────────────────→ malloc()   │       │
│  │  └───────────────────────┘  │     └──────────────┘       │
│  └─────────────────────────────┘                            │
│                                                              │
│  + Petit exécutable                                          │
│  + Libc partagée entre tous les programmes                   │
│  + Mises à jour de libc automatiques                         │
│  - Dépendance externe (DLL hell)                             │
│  - Légère overhead au démarrage                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### PLT et GOT : Comment ça Marche

Pour le linking dynamique, le loader utilise deux tables :

```
┌─────────────────────────────────────────────────────────────┐
│         PLT (Procedure Linkage Table)                        │
│         GOT (Global Offset Table)                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Programme                      Mémoire partagée            │
│  ┌────────────────────┐        ┌─────────────────┐          │
│  │ main:              │        │    libc.so      │          │
│  │   ...              │        │                 │          │
│  │   BL printf@plt ───────┐    │  printf:        │          │
│  │   ...              │   │    │    PUSH ...     │          │
│  └────────────────────┘   │    │    ...          │          │
│                           │    └─────────────────┘          │
│  ┌────────────────────┐   │           ↑                     │
│  │ PLT:               │   │           │                     │
│  │  printf@plt:       │←──┘           │                     │
│  │    LDR PC, [GOT+8]─────────────────┼──┐                  │
│  └────────────────────┘               │  │                  │
│                                       │  │                  │
│  ┌────────────────────┐               │  │                  │
│  │ GOT:               │               │  │                  │
│  │  [0]: &_DYNAMIC    │               │  │                  │
│  │  [4]: link_map     │               │  │                  │
│  │  [8]: 0x7f4a2000 ──────────────────┘  │ (adresse réelle) │
│  │       ↑                               │                  │
│  │       │ Rempli par le loader          │                  │
│  │       │ au premier appel              │                  │
│  └────────────────────┘                  │                  │
│                                          │                  │
└──────────────────────────────────────────│──────────────────┘
                                           │
        Lazy binding : résolution au       │
        premier appel, pas au chargement   │
```

---

## Partie 2 : Gestion des Exceptions

### Qu'est-ce qu'une Exception ?

Une **exception** signale qu'une situation anormale s'est produite. Contrairement au retour d'erreur classique, les exceptions **déroulent la pile** jusqu'à trouver un gestionnaire approprié.

```c
// SANS exceptions (style C)
int result;
FILE* f = fopen("data.txt", "r");
if (f == NULL) {
    return ERROR_FILE_NOT_FOUND;  // Propagation manuelle
}
result = parse_data(f);
if (result < 0) {
    fclose(f);
    return ERROR_PARSE_FAILED;   // Oubli facile du cleanup !
}
// ...

// AVEC exceptions (style C++/Java/Python)
try {
    File f = open("data.txt");     // Peut lever FileNotFound
    Data d = parse(f);             // Peut lever ParseError
    process(d);                    // Peut lever ProcessError
} catch (FileNotFound e) {
    log("Fichier non trouvé: " + e.path);
} catch (ParseError e) {
    log("Erreur de parsing ligne " + e.line);
} finally {
    // Toujours exécuté, même si exception
    cleanup();
}
```

### Anatomie d'une Exception

```
┌─────────────────────────────────────────────────────────────┐
│                 Lancement d'Exception                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  throw new RuntimeException("Division par zéro");           │
│         │                                                    │
│         ▼                                                    │
│  1. Créer l'objet exception                                 │
│     - Type de l'exception                                   │
│     - Message d'erreur                                      │
│     - Stack trace (où ça s'est passé)                       │
│                                                              │
│  2. Rechercher un handler (stack unwinding)                  │
│                                                              │
│     ┌─────────────────────────┐                             │
│     │ main()                  │                             │
│     │  try { foo(); }         │ ← pas de catch matching     │
│     │  catch (IOError) {...}  │                             │
│     └──────────┬──────────────┘                             │
│                │                                             │
│     ┌──────────▼──────────────┐                             │
│     │ foo()                   │                             │
│     │  bar();                 │ ← pas de try/catch          │
│     └──────────┬──────────────┘                             │
│                │                                             │
│     ┌──────────▼──────────────┐                             │
│     │ bar()                   │                             │
│     │  try { baz(); }         │ ← catch (RuntimeException)  │
│     │  catch (Runtime...) { } │   TROUVÉ !                  │
│     └─────────────────────────┘                             │
│                │                                             │
│                ▼                                             │
│  3. Dérouler la pile jusqu'au handler                       │
│     - Appeler les destructeurs                              │
│     - Libérer les ressources                                │
│     - Exécuter les blocs finally                            │
│                                                              │
│  4. Exécuter le handler                                      │
│     - catch block reçoit l'objet exception                  │
│     - Peut re-throw si nécessaire                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Implémentation Bas Niveau (SJLJ)

La méthode **setjmp/longjmp** est une façon simple d'implémenter les exceptions en C :

```c
#include <setjmp.h>

jmp_buf exception_env;
int exception_code;

// Équivalent de "try"
if (setjmp(exception_env) == 0) {
    // Code normal
    risky_operation();
} else {
    // Handler (équivalent de "catch")
    printf("Exception %d attrapée!\n", exception_code);
}

void risky_operation() {
    if (error_condition) {
        exception_code = 42;
        longjmp(exception_env, 1);  // "throw"
    }
}
```

Comment ça marche au niveau assembleur :

```asm
; setjmp : sauvegarde le contexte
setjmp:
    ; Sauver tous les registres callee-saved
    STR SP, [R0, #0]      ; Stack pointer
    STR LR, [R0, #4]      ; Return address
    STR R4, [R0, #8]
    STR R5, [R0, #12]
    ; ... R6-R11 ...
    MOV R0, #0            ; Retourne 0 (première fois)
    BX LR

; longjmp : restaure le contexte
longjmp:
    ; R0 = jmp_buf, R1 = valeur de retour
    LDR SP, [R0, #0]      ; Restaurer stack pointer
    LDR LR, [R0, #4]      ; Restaurer return address
    LDR R4, [R0, #8]
    LDR R5, [R0, #12]
    ; ... R6-R11 ...
    MOV R0, R1            ; Retourne la valeur passée
    CMP R0, #0
    MOVEQ R0, #1          ; Ne jamais retourner 0
    BX LR                 ; "Retourne" à setjmp !
```

### Table-Driven Exception Handling (Moderne)

Les compilateurs modernes utilisent des tables plutôt que du code :

```
┌─────────────────────────────────────────────────────────────┐
│              Exception Tables (.eh_frame)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Pour chaque fonction :                                      │
│  ┌─────────────────────────────────────┐                    │
│  │ FDE (Frame Description Entry)       │                    │
│  │                                     │                    │
│  │ PC_begin: 0x00001000               │ Début fonction     │
│  │ PC_end:   0x00001080               │ Fin fonction       │
│  │                                     │                    │
│  │ Unwind info:                        │                    │
│  │   0x1000-0x1010: CFA = SP + 0       │                    │
│  │   0x1010-0x1020: CFA = SP + 16      │ Après PUSH        │
│  │   0x1020-0x1070: CFA = SP + 32      │ Après alloca      │
│  │                                     │                    │
│  │ LSDA (Language-Specific Data):      │                    │
│  │   Try range: 0x1030-0x1050          │                    │
│  │   Catch type: std::exception        │                    │
│  │   Handler: 0x1060                   │                    │
│  └─────────────────────────────────────┘                    │
│                                                              │
│  Avantages :                                                 │
│  • Pas d'overhead en cas normal (zero-cost exceptions)       │
│  • Tables générées à la compilation                          │
│  • Coût uniquement quand une exception est levée             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Partie 3 : Threads et Concurrence

### Processus vs Threads

```
┌─────────────────────────────────────────────────────────────┐
│                     PROCESSUS                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐         │
│  │   Processus A       │    │   Processus B       │         │
│  │                     │    │                     │         │
│  │  ┌───────────────┐  │    │  ┌───────────────┐  │         │
│  │  │ Espace virtuel│  │    │  │ Espace virtuel│  │         │
│  │  │ 0x0000-0xFFFF │  │    │  │ 0x0000-0xFFFF │  │         │
│  │  │  (isolé)      │  │    │  │  (isolé)      │  │         │
│  │  └───────────────┘  │    │  └───────────────┘  │         │
│  │                     │    │                     │         │
│  │  Code, Data, Heap   │    │  Code, Data, Heap   │         │
│  │  Stack              │    │  Stack              │         │
│  │  File descriptors   │    │  File descriptors   │         │
│  └─────────────────────┘    └─────────────────────┘         │
│                                                              │
│  • Isolation complète (mémoire protégée)                    │
│  • Communication via IPC (pipes, sockets, shared memory)     │
│  • Création coûteuse (fork = copie de tout)                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      THREADS                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Processus                         │    │
│  │                                                      │    │
│  │  ┌────────────────────────────────────────────────┐ │    │
│  │  │     Mémoire partagée                           │ │    │
│  │  │     Code, Data, Heap, File descriptors         │ │    │
│  │  └────────────────────────────────────────────────┘ │    │
│  │                                                      │    │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────┐        │    │
│  │  │ Thread 1 │   │ Thread 2 │   │ Thread 3 │        │    │
│  │  │          │   │          │   │          │        │    │
│  │  │ Stack    │   │ Stack    │   │ Stack    │        │    │
│  │  │ Registres│   │ Registres│   │ Registres│        │    │
│  │  │ PC       │   │ PC       │   │ PC       │        │    │
│  │  └──────────┘   └──────────┘   └──────────┘        │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  • Partagent le même espace mémoire                          │
│  • Communication directe (variables partagées)               │
│  • Création légère (juste une nouvelle stack)                │
│  • ATTENTION : Synchronisation nécessaire !                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Création de Threads

```c
// POSIX Threads (pthreads)
#include <pthread.h>

void* thread_function(void* arg) {
    int id = *(int*)arg;
    printf("Thread %d démarre\n", id);
    // Travail...
    return NULL;
}

int main() {
    pthread_t threads[4];
    int ids[4] = {0, 1, 2, 3};

    // Créer 4 threads
    for (int i = 0; i < 4; i++) {
        pthread_create(&threads[i], NULL, thread_function, &ids[i]);
    }

    // Attendre qu'ils terminent
    for (int i = 0; i < 4; i++) {
        pthread_join(threads[i], NULL);
    }

    return 0;
}
```

### Le Problème : Race Conditions

```c
// DANGER : Accès concurrent non protégé
int counter = 0;

void* increment(void* arg) {
    for (int i = 0; i < 1000000; i++) {
        counter++;  // NON ATOMIQUE !
    }
    return NULL;
}

// Avec 2 threads : résultat attendu = 2,000,000
// Résultat réel : souvent ~1,500,000 !

// Pourquoi ? counter++ se décompose en :
// 1. LOAD  R0, [counter]   ← Thread A lit 42
// 2. ADD   R0, R0, #1      ← Thread A calcule 43
//    --- CONTEXT SWITCH ---
// 1. LOAD  R0, [counter]   ← Thread B lit AUSSI 42
// 2. ADD   R0, R0, #1      ← Thread B calcule 43
// 3. STORE R0, [counter]   ← Thread B écrit 43
//    --- CONTEXT SWITCH ---
// 3. STORE R0, [counter]   ← Thread A écrit 43
// Résultat : counter = 43 au lieu de 44 !
```

### Synchronisation : Mutex

```c
#include <pthread.h>

pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
int counter = 0;

void* safe_increment(void* arg) {
    for (int i = 0; i < 1000000; i++) {
        pthread_mutex_lock(&lock);    // Acquérir le verrou
        counter++;                     // Section critique
        pthread_mutex_unlock(&lock);   // Libérer le verrou
    }
    return NULL;
}
```

Implémentation bas niveau d'un mutex (spinlock) :

```asm
; Test-and-Set atomique
; R0 = adresse du lock, R1 = valeur à écrire
acquire_lock:
    MOV R1, #1
spin:
    LDREX R2, [R0]        ; Load Exclusive
    CMP R2, #0            ; Lock libre ?
    B.NE spin              ; Non, réessayer
    STREX R3, R1, [R0]    ; Store Exclusive
    CMP R3, #0            ; Succès ?
    B.NE spin              ; Non, quelqu'un d'autre a gagné
    DMB                   ; Memory barrier
    BX LR

release_lock:
    DMB                   ; Memory barrier
    MOV R1, #0
    STR R1, [R0]          ; Libérer le lock
    BX LR
```

### Autres Primitives de Synchronisation

```c
// SÉMAPHORE : Compteur de ressources
sem_t slots;
sem_init(&slots, 0, 5);      // 5 slots disponibles

sem_wait(&slots);            // Décrémenter (bloque si 0)
use_resource();
sem_post(&slots);            // Incrémenter

// CONDITION VARIABLE : Attendre un événement
pthread_mutex_t mutex;
pthread_cond_t cond;
int data_ready = 0;

// Thread producteur
pthread_mutex_lock(&mutex);
produce_data();
data_ready = 1;
pthread_cond_signal(&cond);  // Réveiller un consommateur
pthread_mutex_unlock(&mutex);

// Thread consommateur
pthread_mutex_lock(&mutex);
while (!data_ready) {        // Boucle pour éviter spurious wakeups
    pthread_cond_wait(&cond, &mutex);  // Attend + libère/réacquiert mutex
}
consume_data();
pthread_mutex_unlock(&mutex);

// READ-WRITE LOCK : Plusieurs lecteurs OU un écrivain
pthread_rwlock_t rwlock;

// Lecteurs (peuvent être multiples)
pthread_rwlock_rdlock(&rwlock);
read_data();
pthread_rwlock_unlock(&rwlock);

// Écrivain (exclusif)
pthread_rwlock_wrlock(&rwlock);
write_data();
pthread_rwlock_unlock(&rwlock);
```

### Deadlocks

```c
// DEADLOCK : Deux threads qui s'attendent mutuellement

pthread_mutex_t lockA, lockB;

// Thread 1                     // Thread 2
lock(&lockA);                   lock(&lockB);
lock(&lockB);  // BLOQUÉ !      lock(&lockA);  // BLOQUÉ !
//             ↑                               ↑
//             └──── Attend lockB ─────────────┘
//                   qui attend lockA

// SOLUTION 1 : Ordre fixe d'acquisition
// Toujours acquérir lockA avant lockB

// SOLUTION 2 : trylock avec timeout
if (pthread_mutex_trylock(&lockB) != 0) {
    pthread_mutex_unlock(&lockA);  // Libérer et réessayer
    goto retry;
}

// SOLUTION 3 : Lock hierarchies
// Chaque lock a un niveau, on ne peut acquérir que des niveaux croissants
```

### Modèles de Concurrence

```
┌─────────────────────────────────────────────────────────────┐
│              MODÈLES DE CONCURRENCE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. SHARED MEMORY (ce qu'on a vu)                           │
│     • Threads partagent la mémoire                          │
│     • Synchronisation par mutex, sémaphores                 │
│     • Difficile à raisonner, bugs subtils                   │
│                                                              │
│  2. MESSAGE PASSING                                          │
│     • Pas de mémoire partagée                               │
│     • Processus communiquent par messages                    │
│     • Plus sûr mais overhead de copie                       │
│                                                              │
│     Thread A                    Thread B                    │
│     ┌──────────┐               ┌──────────┐                │
│     │ send(B,  │──────────────→│ recv()   │                │
│     │   data)  │               │ → data   │                │
│     └──────────┘               └──────────┘                │
│                                                              │
│  3. ACTEURS (Erlang, Akka)                                  │
│     • Chaque acteur a sa mailbox                            │
│     • Messages asynchrones                                  │
│     • Pas de lock, pas de deadlock                          │
│                                                              │
│  4. COROUTINES / ASYNC-AWAIT                                │
│     • Concurrence coopérative (pas préemptive)              │
│     • Un seul thread, mais plusieurs tâches                 │
│     • Pas de race condition sur les données                 │
│                                                              │
│     async function fetch() {                                │
│         let a = await fetchA();  // Suspend, pas de block   │
│         let b = await fetchB();                             │
│         return a + b;                                        │
│     }                                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Exercices Pratiques

### Exercices sur le Simulateur Web

Lancez le **Simulateur Web** et allez dans **Exercices OS** pour pratiquer les concepts de ce chapitre :

| Exercice | Description | Concepts |
|----------|-------------|----------|
| `os-coro` | Coroutines visuelles (alternance A/B) | Changement de contexte, yield |
| `os-sched` | Scheduler avec préemption | Ordonnancement, time slices |
| `os-project2` | Projet: Task Manager | Threads, scheduler complet |

Ces exercices montrent visuellement comment les threads/coroutines alternent l'exécution.

### Exercice 1 : Analyse d'un Fichier Objet

Utilisez `objdump` ou `readelf` pour analyser un fichier `.o` :

```bash
# Compiler sans linker
gcc -c hello.c -o hello.o

# Examiner les sections
objdump -h hello.o

# Voir les symboles
nm hello.o

# Désassembler
objdump -d hello.o
```

Questions :
1. Quels symboles sont définis ? Lesquels sont indéfinis ?
2. Quelle taille fait la section `.text` ?
3. Où est stockée la chaîne "Hello World" ?

### Exercice 2 : Linking Manuel

Créez deux fichiers :

```c
// main.c
extern int add(int a, int b);
int main() {
    return add(3, 4);
}

// math.c
int add(int a, int b) {
    return a + b;
}
```

1. Compilez séparément : `gcc -c main.c` et `gcc -c math.c`
2. Examinez les symboles de chaque `.o`
3. Linkez manuellement : `ld main.o math.o -o programme`
4. Que se passe-t-il ? Pourquoi ? (Indice : `_start`, libc)

### Exercice 3 : Exception Handling en C

Implémentez un système d'exceptions simple avec setjmp/longjmp :

```c
// TODO: Implémenter TRY, CATCH, THROW
// Utilisation souhaitée :
TRY {
    if (error) THROW(42);
    do_work();
} CATCH(code) {
    printf("Exception %d\n", code);
} END_TRY;
```

### Exercice 4 : Producteur-Consommateur

Implémentez le problème classique producteur-consommateur :

```c
#define BUFFER_SIZE 10
int buffer[BUFFER_SIZE];
int count = 0;

// TODO: Implémenter avec mutex et condition variables
void* producer(void* arg);   // Produit des items
void* consumer(void* arg);   // Consomme des items
```

### Exercice 5 : Détection de Deadlock

Analysez ce code et identifiez le deadlock potentiel :

```c
pthread_mutex_t m1, m2, m3;

void* thread_a(void* arg) {
    lock(&m1); lock(&m2);
    work();
    unlock(&m2); unlock(&m1);
}

void* thread_b(void* arg) {
    lock(&m2); lock(&m3);
    work();
    unlock(&m3); unlock(&m2);
}

void* thread_c(void* arg) {
    lock(&m3); lock(&m1);
    work();
    unlock(&m1); unlock(&m3);
}
```

1. Y a-t-il un deadlock possible ?
2. Dessinez le graphe de dépendance
3. Proposez une solution

---

## Auto-évaluation

### Quiz

**Q1.** Quelle est la différence entre linking statique et dynamique ?

**Q2.** Qu'est-ce que la table des symboles dans un fichier objet ?

**Q3.** Que fait le préprocesseur avec `#include` et `#define` ?

**Q4.** Expliquez le concept de "stack unwinding" lors d'une exception.

**Q5.** Quelle est la différence entre un processus et un thread ?

**Q6.** Qu'est-ce qu'une race condition et comment l'éviter ?

**Q7.** Qu'est-ce qu'un deadlock ? Donnez les quatre conditions nécessaires.

**Q8.** Pourquoi les opérations atomiques sont-elles nécessaires pour les mutex ?

### Défi

Implémentez un pool de threads simple :

```c
typedef struct {
    // TODO: votre structure
} ThreadPool;

ThreadPool* pool_create(int num_threads);
void pool_submit(ThreadPool* pool, void (*task)(void*), void* arg);
void pool_destroy(ThreadPool* pool);
```

---

## Résumé

```
┌─────────────────────────────────────────────────────────────┐
│                  CONCEPTS AVANCÉS                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  COMPILATION :                                               │
│  Source → Préprocesseur → Compilateur → Assembleur → Linker │
│                                                              │
│  FICHIERS OBJETS :                                           │
│  • Sections : .text, .data, .bss, .rodata                   │
│  • Symboles : définis ou indéfinis (externes)               │
│  • Relocations : références à résoudre                       │
│                                                              │
│  LINKING :                                                   │
│  • Statique : tout dans l'exécutable                        │
│  • Dynamique : résolution au runtime (PLT/GOT)              │
│                                                              │
│  EXCEPTIONS :                                                │
│  • try/catch/finally pour gérer les erreurs                 │
│  • Stack unwinding pour trouver le handler                  │
│  • Zero-cost (tables) vs SJLJ (runtime)                     │
│                                                              │
│  THREADS :                                                   │
│  • Partagent la mémoire (contrairement aux processus)       │
│  • Race conditions : accès concurrent non protégé           │
│  • Synchronisation : mutex, sémaphores, conditions          │
│  • Deadlocks : attention à l'ordre d'acquisition !          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

Ces concepts sont fondamentaux pour comprendre comment les programmes réels fonctionnent, du code source jusqu'à l'exécution multi-threadée. La maîtrise de la compilation/linking aide au débogage, tandis que la compréhension de la concurrence est essentielle pour écrire des programmes corrects et performants.
