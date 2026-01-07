# Carte de Référence - Codes d'Erreur

## Erreurs d'Assemblage (E1xxx)

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| E1001 | Unknown mnemonic | Instruction non reconnue | Vérifier l'orthographe |
| E1002 | Invalid operand | Format d'opérande incorrect | Vérifier la syntaxe |
| E1003 | Undefined label | Label non défini | Ajouter le label ou corriger le nom |
| E1004 | Immediate out of range | Valeur trop grande | Utiliser `LDR Rd, =value` |
| E1005 | Invalid register | Registre inexistant | Utiliser R0-R15 |
| E1006 | Syntax error | Erreur de syntaxe | Vérifier la ligne |
| E1007 | Duplicate label | Label déjà défini | Renommer le label |
| E1008 | Literal pool overflow | Trop de constantes | Ajouter `.ltorg` |
| E1009 | Offset out of range | Offset trop grand | Utiliser registre intermédiaire |
| E1010 | Invalid condition | Condition inconnue | Vérifier EQ, NE, GT, etc. |

### Exemples de Résolution

**E1004 - Immediate out of range**
```asm
; ERREUR
MOV R0, #0x12345678

; SOLUTION
LDR R0, =0x12345678
```

**E1008 - Literal pool overflow**
```asm
; ERREUR : trop de LDR Rd, =value sans .ltorg
LDR R0, =0x1000
; ... beaucoup de code ...
LDR R1, =0x2000  ; E1008!

; SOLUTION : placer .ltorg régulièrement
LDR R0, =0x1000
.ltorg
; ... code ...
LDR R1, =0x2000
.ltorg
```

---

## Erreurs de Compilation C32 (E2xxx)

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| E2001 | Parse error | Erreur de syntaxe | Vérifier parenthèses, ; |
| E2002 | Type mismatch | Types incompatibles | Vérifier les types |
| E2003 | Undeclared variable | Variable non déclarée | Déclarer avant usage |
| E2004 | Undefined function | Fonction non définie | Définir la fonction |
| E2005 | Redefinition | Double définition | Supprimer le doublon |
| E2006 | Invalid lvalue | Assignation invalide | Vérifier le côté gauche |
| E2007 | Argument count | Mauvais nombre d'args | Vérifier les paramètres |
| E2008 | Missing return | Return manquant | Ajouter return |
| E2009 | Break outside loop | Break hors boucle | Déplacer dans une boucle |
| E2010 | Invalid cast | Cast impossible | Vérifier les types |

### Exemples de Résolution

**E2003 - Undeclared variable**
```c
// ERREUR
int main() {
    x = 5;  // E2003
}

// SOLUTION
int main() {
    int x;
    x = 5;
}
```

**E2008 - Missing return**
```c
// ERREUR
int add(int a, int b) {
    int c = a + b;
}  // E2008

// SOLUTION
int add(int a, int b) {
    int c = a + b;
    return c;
}
```

---

## Erreurs de Liaison (E3xxx)

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| E3001 | Unresolved symbol | Symbole non trouvé | Définir ou lier |
| E3002 | Missing entry point | Pas de _start/main | Ajouter point d'entrée |
| E3003 | Duplicate symbol | Symbole en double | Renommer |
| E3004 | Memory overflow | Trop de données | Réduire la taille |
| E3005 | Invalid section | Section inconnue | Vérifier .text/.data |

---

## Erreurs d'Exécution (Traps)

| Trap | Cause | Diagnostic |
|------|-------|------------|
| DIV_ZERO | Division par zéro | Vérifier le diviseur |
| MEM_FAULT | Accès mémoire invalide | Vérifier le pointeur |
| MISALIGNED | Adresse non alignée | Aligner sur 4 octets |
| ILLEGAL | Instruction invalide | Vérifier l'encodage |

### Déboguer les Traps

**DIV_ZERO**
```c
// ERREUR
int result = a / b;  // Si b == 0 → TRAP

// SOLUTION
int result = 0;
if (b != 0) {
    result = a / b;
}
```

**MISALIGNED**
```asm
; ERREUR
LDR R0, [R1, #3]  ; 3 n'est pas multiple de 4

; SOLUTION
LDR R0, [R1, #4]  ; ou #0, #8, #12...
```

**MEM_FAULT**
```c
// ERREUR
int *p;           // Non initialisé
int x = *p;       // MEM_FAULT

// SOLUTION
int value = 42;
int *p = &value;
int x = *p;       // OK
```

---

## Erreurs HDL

| Erreur | Cause | Solution |
|--------|-------|----------|
| Component not found | Composant inconnu | Vérifier le nom |
| Port not connected | Port non connecté | Ajouter port map |
| Width mismatch | Largeur incorrecte | Vérifier bit vs bits |
| Circular dependency | Dépendance circulaire | Utiliser DFF |
| Undefined signal | Signal non déclaré | Déclarer le signal |

---

## Conseils de Débogage

### Par Type d'Erreur

| Symptôme | Vérifier |
|----------|----------|
| Compilation échoue | Messages d'erreur, syntaxe |
| Résultat incorrect | Logique, conditions |
| Boucle infinie | Condition de sortie |
| Crash (trap) | Pointeurs, division |
| Valeur aléatoire | Initialisation |

### Checklist Rapide

- [ ] Variables initialisées ?
- [ ] Pointeurs valides ?
- [ ] Pas de division par zéro ?
- [ ] Return dans toutes les fonctions ?
- [ ] Labels correctement orthographiés ?
- [ ] Accès mémoire alignés ?
- [ ] LR sauvegardé avant BL ?
