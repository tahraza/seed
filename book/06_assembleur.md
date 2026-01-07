# L'Assembleur

> "Traduire, c'est trahir ?" — Pas ici.

Dans les chapitres précédents, nous avons conçu le matériel capable d'exécuter des instructions 32 bits. Mais écrire un programme en hexadécimal (comme `0xE2801001`) est extrêmement pénible et source d'erreurs.

L'**Assembleur** est l'outil logiciel qui fait le pont entre le programmeur et la machine. Il traduit un fichier texte contenant des mnémoniques lisibles (ex: `ADD R1, R1, #1`) en un fichier binaire exécutable par le CPU.

---

## Où en sommes-nous ?

![Position dans l'architecture](images/architecture-stack.svg)

*Nous sommes à la Couche 3 : Assembleur - Du texte au binaire*

Nous entrons maintenant dans le monde du **logiciel** ! L'assembleur est le premier programme que nous construisons pour notre machine.

---

## Le Rôle de l'Assembleur

### Du texte au binaire

```
                    Assembleur
   Code source  ──────────────►  Code machine
   (texte)                       (binaire)

   ADD R1, R2, #10     →     0xE2821010
   B loop              →     0xEAFFFFFE
```

### Les trois tâches de l'assembleur

1. **Analyse (Parsing)** : Lire le code source et comprendre les instructions, les opérandes, les labels.

2. **Résolution des Symboles** : Transformer les étiquettes (labels) comme `loop:` en adresses numériques.

3. **Encodage** : Transformer chaque instruction en son équivalent binaire de 32 bits selon la spécification de l'ISA.

---

## La Stratégie des Deux Passes

### Pourquoi deux passes ?

Regardez ce code :
```asm
    B suite    ; Où est 'suite' ? On ne le sait pas encore !
    MOV R0, #1
suite:
    ADD R0, R0, #1
```

À la ligne 1, l'assembleur ne sait pas encore où est `suite`. C'est le problème des **références vers l'avant**.

### Passe 1 : Construction de la Table des Symboles

L'assembleur parcourt le fichier et note l'adresse de chaque label :

```
Adresse 0x0000 : B suite           (4 octets)
Adresse 0x0004 : MOV R0, #1        (4 octets)
Adresse 0x0008 : suite:            ← On note : suite = 0x0008
Adresse 0x0008 : ADD R0, R0, #1
```

**Table des symboles** : `{ "suite": 0x00000008 }`

### Passe 2 : Génération du Code

L'assembleur reparcourt le fichier. Quand il voit `B suite`, il regarde dans sa table et génère l'offset correct.

```
B suite → offset = (0x0008 - 0x0000 - 8) / 4 = -2 → 0xEAFFFFFE
```

---

## Sections et Directives

### Les Sections

Un programme n'est pas fait que d'instructions. Il contient aussi des données.

| Section | Contenu |
|:--------|:--------|
| `.text` | Le code (les instructions) — généralement en lecture seule |
| `.data` | Les variables globales initialisées |
| `.bss` | Les variables globales non initialisées (mises à zéro) |

### Les Directives

Les directives (commençant par `.`) guident l'assembleur :

| Directive | Signification |
|:----------|:--------------|
| `.text` | Début de la section code |
| `.data` | Début de la section données |
| `.global _start` | Exporte le symbole `_start` |
| `.word 123` | Réserve 4 octets avec la valeur 123 |
| `.asciz "Hello"` | Chaîne terminée par un zéro |
| `.align 2` | Aligne sur un multiple de 4 octets |
| `.ltorg` | Force l'émission du literal pool |

---

## Exemple d'Encodage

Comment l'assembleur encode-t-il `ADD R1, R2, #10` ?

### Étape 1 : Identifier l'instruction

- **Mnémonique** : `ADD` → opcode = 0011
- **Registres** : Rd = R1, Rn = R2
- **Immédiat** : #10

### Étape 2 : Déterminer la classe

- Classe `001` car on utilise un immédiat

### Étape 3 : Assembler les bits

```
 31-28  27-25  24-21  20   19-16  15-12  11-0
 Cond   Class   Op    S     Rn     Rd    Imm12
 1110   001    0011   0    0010   0001   000000001010

 = 0xE2821010
```

---

## La Gestion des Grandes Constantes

### Le problème

Une instruction fait 32 bits. Un immédiat fait 12 bits maximum. Comment charger `0xDEADBEEF` (32 bits) dans un registre ?

### La solution : Le Literal Pool

L'assembleur offre une syntaxe magique : `LDR R0, =0xDEADBEEF`

Ce n'est **pas** une vraie instruction LDR — c'est une **pseudo-instruction** que l'assembleur transforme :

1. La valeur `0xDEADBEEF` est stockée dans le **literal pool** (une zone de données après le code)
2. L'instruction est remplacée par `LDR R0, [PC, #offset]` qui va chercher la valeur

```asm
; Code source
    LDR R0, =0xDEADBEEF

; Ce que l'assembleur génère
    LDR R0, [PC, #8]    ; Va chercher la valeur 8 octets plus loin
    ...
literal_pool:
    .word 0xDEADBEEF    ; La valeur est stockée ici
```

---

## Exercices Pratiques

### Exercices sur le Simulateur Web

Tous les exercices de la section **A32 Assembly** du simulateur web vous font pratiquer l'écriture d'assembleur. L'assembleur intégré traduit votre code en binaire automatiquement.

| Catégorie | Exercices |
|:----------|:----------|
| Basique | Hello World, Addition, Soustraction, Logique |
| Contrôle | Conditions, Boucles, Multiplication, Fibonacci |
| Mémoire | Tableaux, Maximum Tableau, Fonctions |
| Graphique | Pixel, Ligne, Rectangle, Damier |
| Avancé | Recherche Dichotomique, Dégradé |

### Exercice manuel : Encodage

Traduisez ces instructions en binaire (32 bits) :

1. `MOV R0, #5`
2. `SUB R1, R1, #1`
3. `B -2` (saut de 2 instructions en arrière)

### Exercice : Table des symboles

Calculez l'adresse de chaque label :
```asm
.text
start:
    MOV R0, #0
loop:
    CMP R0, #10
    B.EQ end
    ADD R0, R0, #1
    B loop
end:
    HALT
```

### Utilisation de l'outil CLI

```bash
# Assembler un fichier
cargo run -p a32_cli -- assemble mon_prog.s -o mon_prog.bin

# Examiner le binaire généré
hexdump -C mon_prog.bin
```

---

## Ce qu'il faut retenir

1. **L'assembleur traduit** : Texte lisible → Binaire exécutable

2. **Deux passes** : D'abord collecter les symboles, puis générer le code

3. **Les directives organisent** : `.text`, `.data`, `.word`, `.asciz`

4. **Le literal pool résout** : Les constantes 32 bits via `LDR R0, =value`

5. **Un symbole = une adresse** : Les labels deviennent des nombres

**Prochaine étape** : Au Chapitre 7, nous construirons un **Compilateur** qui traduit du code C32 en assembleur. C'est l'étape suivante vers l'abstraction !

---

**Conseil** : Faites beaucoup d'exercices en assembleur. Plus vous serez à l'aise avec l'assembleur, mieux vous comprendrez ce que fait le compilateur.

---

## Auto-évaluation

Testez votre compréhension avant de passer au chapitre suivant.

### Questions de compréhension

**Q1.** Pourquoi l'assembleur fait-il deux passes sur le code source ?

**Q2.** Quelle est la différence entre `.text` et `.data` ?

**Q3.** Comment l'assembleur gère-t-il `LDR R0, =0xDEADBEEF` ?

**Q4.** Que se passe-t-il si un branchement est trop loin (offset > 24 bits) ?

**Q5.** Qu'est-ce qu'un fichier binaire A32B contient exactement ?

### Mini-défi pratique

Encodez manuellement cette instruction en binaire 32 bits :
```asm
ADD R1, R2, R3
```

Indice : Format ALU registre = `[cond:4][000][opcode:4][S][Rn:4][Rd:4][00000000][Rm:4]`

*Les solutions se trouvent dans le document **Seed_Solutions**.*

### Checklist de validation

Avant de passer au chapitre 7, assurez-vous de pouvoir :

- [ ] Expliquer le rôle des deux passes de l'assembleur
- [ ] Utiliser les directives `.text`, `.data`, `.word`, `.asciz`
- [ ] Comprendre le fonctionnement du literal pool
- [ ] Encoder une instruction simple à la main (format binaire)
- [ ] Lire et interpréter un hexdump de fichier binaire
