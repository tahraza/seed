// C Exercises for nand2tetris-seed
// Each exercise has a template, solution, and test cases
// Organized by category with progressive difficulty

export const C_EXERCISES = {
    // ========================================
    // BASES - Fundamentals
    // ========================================
    'c-var': {
        id: 'c-var',
        name: 'Variables',
        description: 'Déclarer et initialiser des variables',
        template: `// ============================================
// Exercice: Variables
// ============================================
// Objectif: Déclarer des variables et les initialiser
//
// 1. Déclarer une variable 'x' de type int avec la valeur 10
// 2. Déclarer une variable 'y' de type int avec la valeur 32
// 3. Calculer x + y et stocker dans 'result'
// 4. Retourner result
//
// Résultat attendu: 42
// ============================================

int main() {
    // Votre code ici:

    return 0;
}
`,
        solution: `// Variables - Solution

int main() {
    int x = 10;
    int y = 32;
    int result = x + y;
    return result;
}
`,
        expectedReturn: 42
    },

    'c-expr': {
        id: 'c-expr',
        name: 'Expressions',
        description: 'Utiliser les opérateurs arithmétiques',
        template: `// ============================================
// Exercice: Expressions
// ============================================
// Objectif: Calculer une expression arithmétique
//
// Calculer: (5 + 3) * (10 - 4) / 2
// Résultat: 8 * 6 / 2 = 48 / 2 = 24
//
// Résultat attendu: 24
// ============================================

int main() {
    // Votre code ici:

    return 0;
}
`,
        solution: `// Expressions - Solution

int main() {
    int result = (5 + 3) * (10 - 4) / 2;
    return result;
}
`,
        expectedReturn: 24
    },

    'c-mod': {
        id: 'c-mod',
        name: 'Modulo',
        description: 'Utiliser l\'opérateur modulo',
        template: `// ============================================
// Exercice: Modulo
// ============================================
// Objectif: Comprendre l'opérateur modulo (%)
//
// L'opérateur % donne le reste de la division
// Exemple: 17 % 5 = 2 (car 17 = 3*5 + 2)
//
// Calculer: (100 % 7) + (45 % 8)
// - 100 % 7 = 2 (100 = 14*7 + 2)
// - 45 % 8 = 5 (45 = 5*8 + 5)
// - 2 + 5 = 7
//
// Résultat attendu: 7
// ============================================

int main() {
    // Votre code ici:

    return 0;
}
`,
        solution: `// Modulo - Solution

int main() {
    int result = (100 % 7) + (45 % 8);
    return result;
}
`,
        expectedReturn: 7
    },

    'c-incr': {
        id: 'c-incr',
        name: 'Incrémentation',
        description: 'Comprendre les opérations d\'incrémentation',
        template: `// ============================================
// Exercice: Incrémentation
// ============================================
// Objectif: Utiliser les affectations composées
//
// En C, on peut écrire:
// x = x + 1  ou  x += 1
// x = x * 2  ou  x *= 2
//
// Partir de x = 5, puis:
// 1. Ajouter 3 à x (x = x + 3)
// 2. Multiplier x par 2 (x = x * 2)
// 3. Soustraire 1 (x = x - 1)
//
// Résultat: 5 -> 8 -> 16 -> 15
// Résultat attendu: 15
// ============================================

int main() {
    int x = 5;

    // Votre code ici:

    return x;
}
`,
        solution: `// Incrémentation - Solution

int main() {
    int x = 5;

    x = x + 3;   // x = 8
    x = x * 2;   // x = 16
    x = x - 1;   // x = 15

    return x;
}
`,
        expectedReturn: 15
    },

    // ========================================
    // CONDITIONS - Control flow
    // ========================================
    'c-cond': {
        id: 'c-cond',
        name: 'Conditions',
        description: 'Utiliser if/else',
        template: `// ============================================
// Exercice: Conditions
// ============================================
// Objectif: Trouver le maximum de deux nombres
//
// Comparer a=25 et b=17
// Retourner le plus grand
//
// Résultat attendu: 25
// ============================================

int main() {
    int a = 25;
    int b = 17;
    int max;

    // Votre code ici:
    // Utiliser if/else pour trouver le maximum

    return max;
}
`,
        solution: `// Conditions - Solution

int main() {
    int a = 25;
    int b = 17;
    int max;

    if (a > b) {
        max = a;
    } else {
        max = b;
    }

    return max;
}
`,
        expectedReturn: 25
    },

    'c-cond2': {
        id: 'c-cond2',
        name: 'Else-If',
        description: 'Chaînes de conditions',
        template: `// ============================================
// Exercice: Else-If
// ============================================
// Objectif: Utiliser else if pour plusieurs conditions
//
// Classifier une note (score = 75):
// - score >= 90: retourner 5 (Excellent)
// - score >= 80: retourner 4 (Très bien)
// - score >= 70: retourner 3 (Bien)
// - score >= 60: retourner 2 (Passable)
// - sinon: retourner 1 (Insuffisant)
//
// Résultat attendu: 3 (car 75 >= 70)
// ============================================

int main() {
    int score = 75;
    int grade;

    // Votre code ici:

    return grade;
}
`,
        solution: `// Else-If - Solution

int main() {
    int score = 75;
    int grade;

    if (score >= 90) {
        grade = 5;
    } else if (score >= 80) {
        grade = 4;
    } else if (score >= 70) {
        grade = 3;
    } else if (score >= 60) {
        grade = 2;
    } else {
        grade = 1;
    }

    return grade;
}
`,
        expectedReturn: 3
    },

    'c-logic': {
        id: 'c-logic',
        name: 'Opérateurs Logiques',
        description: 'Utiliser && et ||',
        template: `// ============================================
// Exercice: Opérateurs Logiques
// ============================================
// Objectif: Combiner des conditions avec && et ||
//
// && = ET logique (les deux doivent être vraies)
// || = OU logique (au moins une doit être vraie)
//
// Vérifier si x=15 est dans l'intervalle [10, 20]
// (x >= 10 ET x <= 20)
// Retourner 1 si vrai, 0 si faux
//
// Résultat attendu: 1
// ============================================

int main() {
    int x = 15;
    int result;

    // Votre code ici:
    // Vérifier si x est entre 10 et 20 (inclus)

    return result;
}
`,
        solution: `// Opérateurs Logiques - Solution

int main() {
    int x = 15;
    int result;

    if (x >= 10 && x <= 20) {
        result = 1;
    } else {
        result = 0;
    }

    return result;
}
`,
        expectedReturn: 1
    },

    'c-max3': {
        id: 'c-max3',
        name: 'Maximum de 3',
        description: 'Trouver le maximum de trois nombres',
        template: `// ============================================
// Exercice: Maximum de 3
// ============================================
// Objectif: Trouver le maximum de trois nombres
//
// Trouver le maximum entre a=15, b=42, c=27
// Utiliser des if/else imbriqués ou des &&
//
// Résultat attendu: 42
// ============================================

int main() {
    int a = 15;
    int b = 42;
    int c = 27;
    int max;

    // Votre code ici:

    return max;
}
`,
        solution: `// Maximum de 3 - Solution

int main() {
    int a = 15;
    int b = 42;
    int c = 27;
    int max;

    if (a >= b && a >= c) {
        max = a;
    } else if (b >= c) {
        max = b;
    } else {
        max = c;
    }

    return max;
}
`,
        expectedReturn: 42
    },

    // ========================================
    // BOUCLES - Loops
    // ========================================
    'c-loop': {
        id: 'c-loop',
        name: 'Boucle For',
        description: 'Utiliser la boucle for',
        template: `// ============================================
// Exercice: Boucle For
// ============================================
// Objectif: Calculer la somme des entiers de 1 à 10
//
// Utiliser une boucle for
// sum = 1 + 2 + 3 + ... + 10 = 55
//
// Résultat attendu: 55
// ============================================

int main() {
    int sum = 0;

    // Votre code ici:

    return sum;
}
`,
        solution: `// Boucle For - Solution

int main() {
    int sum = 0;

    for (int i = 1; i <= 10; i = i + 1) {
        sum = sum + i;
    }

    return sum;
}
`,
        expectedReturn: 55
    },

    'c-while': {
        id: 'c-while',
        name: 'Boucle While',
        description: 'Utiliser la boucle while',
        template: `// ============================================
// Exercice: Boucle While
// ============================================
// Objectif: Compter les chiffres d'un nombre
//
// Compter combien de chiffres dans n = 12345
// Diviser par 10 jusqu'à obtenir 0
// 12345 -> 1234 -> 123 -> 12 -> 1 -> 0
//
// Résultat attendu: 5
// ============================================

int main() {
    int n = 12345;
    int count = 0;

    // Votre code ici:
    // Utiliser while pour compter les chiffres

    return count;
}
`,
        solution: `// Boucle While - Solution

int main() {
    int n = 12345;
    int count = 0;

    while (n > 0) {
        count = count + 1;
        n = n / 10;
    }

    return count;
}
`,
        expectedReturn: 5
    },

    'c-nested': {
        id: 'c-nested',
        name: 'Boucles Imbriquées',
        description: 'Boucles dans des boucles',
        template: `// ============================================
// Exercice: Boucles Imbriquées
// ============================================
// Objectif: Calculer avec des boucles imbriquées
//
// Pour chaque i de 1 à 3, pour chaque j de 1 à 4:
// Ajouter i * j à sum
//
// i=1: 1*1 + 1*2 + 1*3 + 1*4 = 10
// i=2: 2*1 + 2*2 + 2*3 + 2*4 = 20
// i=3: 3*1 + 3*2 + 3*3 + 3*4 = 30
// Total = 60
//
// Résultat attendu: 60
// ============================================

int main() {
    int sum = 0;

    // Votre code ici:

    return sum;
}
`,
        solution: `// Boucles Imbriquées - Solution

int main() {
    int sum = 0;

    for (int i = 1; i <= 3; i = i + 1) {
        for (int j = 1; j <= 4; j = j + 1) {
            sum = sum + i * j;
        }
    }

    return sum;
}
`,
        expectedReturn: 60
    },

    'c-mult': {
        id: 'c-mult',
        name: 'Multiplication',
        description: 'Multiplier par additions successives',
        template: `// ============================================
// Exercice: Multiplication
// ============================================
// Objectif: Implémenter la multiplication
//           sans utiliser l'opérateur *
//
// Calculer 7 * 8 = 56 en utilisant seulement +
// Indice: 7 * 8 = 7 + 7 + 7 + 7 + 7 + 7 + 7 + 7
//
// Résultat attendu: 56
// ============================================

int main() {
    int a = 7;
    int b = 8;
    int result = 0;

    // Votre code ici:
    // Utiliser une boucle et l'addition

    return result;
}
`,
        solution: `// Multiplication - Solution

int main() {
    int a = 7;
    int b = 8;
    int result = 0;

    for (int i = 0; i < b; i = i + 1) {
        result = result + a;
    }

    return result;
}
`,
        expectedReturn: 56
    },

    // ========================================
    // FONCTIONS - Functions
    // ========================================
    'c-func': {
        id: 'c-func',
        name: 'Fonctions',
        description: 'Définir et appeler des fonctions',
        template: `// ============================================
// Exercice: Fonctions
// ============================================
// Objectif: Créer une fonction qui calcule le carré
//
// 1. Définir une fonction 'square' qui prend un int
//    et retourne son carré
// 2. Appeler square(7) et retourner le résultat
//
// Résultat attendu: 49
// ============================================

// Définir la fonction square ici:


int main() {
    // Appeler square(7) et retourner le résultat

    return 0;
}
`,
        solution: `// Fonctions - Solution

int square(int n) {
    return n * n;
}

int main() {
    return square(7);
}
`,
        expectedReturn: 49
    },

    'c-func2': {
        id: 'c-func2',
        name: 'Paramètres Multiples',
        description: 'Fonctions avec plusieurs paramètres',
        template: `// ============================================
// Exercice: Paramètres Multiples
// ============================================
// Objectif: Créer une fonction avec plusieurs paramètres
//
// 1. Créer une fonction 'add3' qui prend trois int
//    et retourne leur somme
// 2. Appeler add3(10, 20, 12)
//
// Résultat attendu: 42
// ============================================

// Définir la fonction add3 ici:


int main() {
    return add3(10, 20, 12);
}
`,
        solution: `// Paramètres Multiples - Solution

int add3(int a, int b, int c) {
    return a + b + c;
}

int main() {
    return add3(10, 20, 12);
}
`,
        expectedReturn: 42
    },

    'c-abs': {
        id: 'c-abs',
        name: 'Valeur Absolue',
        description: 'Fonction valeur absolue',
        template: `// ============================================
// Exercice: Valeur Absolue
// ============================================
// Objectif: Créer une fonction valeur absolue
//
// abs(x) retourne x si x >= 0, sinon -x
// abs(-15) = 15
// abs(10) = 10
//
// Calculer: abs(-15) + abs(10)
// Résultat attendu: 25
// ============================================

// Définir la fonction abs ici:


int main() {
    return abs(-15) + abs(10);
}
`,
        solution: `// Valeur Absolue - Solution

int abs(int x) {
    if (x < 0) {
        return -x;
    }
    return x;
}

int main() {
    return abs(-15) + abs(10);
}
`,
        expectedReturn: 25
    },

    'c-minmax': {
        id: 'c-minmax',
        name: 'Min et Max',
        description: 'Fonctions min et max',
        template: `// ============================================
// Exercice: Min et Max
// ============================================
// Objectif: Créer les fonctions min et max
//
// min(a, b) retourne le plus petit
// max(a, b) retourne le plus grand
//
// Calculer: max(10, 25) - min(10, 25)
// = 25 - 10 = 15
//
// Résultat attendu: 15
// ============================================

// Définir min et max ici:


int main() {
    return max(10, 25) - min(10, 25);
}
`,
        solution: `// Min et Max - Solution

int min(int a, int b) {
    if (a < b) {
        return a;
    }
    return b;
}

int max(int a, int b) {
    if (a > b) {
        return a;
    }
    return b;
}

int main() {
    return max(10, 25) - min(10, 25);
}
`,
        expectedReturn: 15
    },

    // ========================================
    // TABLEAUX - Arrays
    // ========================================
    'c-array': {
        id: 'c-array',
        name: 'Tableaux',
        description: 'Introduction aux tableaux',
        template: `// ============================================
// Exercice: Tableaux
// ============================================
// Objectif: Manipuler un tableau
//
// Créer un tableau de 5 éléments: {3, 7, 2, 9, 5}
// Calculer la somme de tous les éléments
//
// Résultat attendu: 26
// ============================================

int main() {
    int arr[5];
    arr[0] = 3;
    arr[1] = 7;
    arr[2] = 2;
    arr[3] = 9;
    arr[4] = 5;

    int sum = 0;

    // Votre code ici:
    // Parcourir le tableau et calculer la somme

    return sum;
}
`,
        solution: `// Tableaux - Solution

int main() {
    int arr[5];
    arr[0] = 3;
    arr[1] = 7;
    arr[2] = 2;
    arr[3] = 9;
    arr[4] = 5;

    int sum = 0;

    for (int i = 0; i < 5; i = i + 1) {
        sum = sum + arr[i];
    }

    return sum;
}
`,
        expectedReturn: 26
    },

    'c-array-max': {
        id: 'c-array-max',
        name: 'Maximum Tableau',
        description: 'Trouver le maximum dans un tableau',
        template: `// ============================================
// Exercice: Maximum Tableau
// ============================================
// Objectif: Trouver l'élément maximum
//
// Tableau: {12, 45, 7, 23, 56, 34}
// Trouver le plus grand élément
//
// Résultat attendu: 56
// ============================================

int main() {
    int arr[6];
    arr[0] = 12;
    arr[1] = 45;
    arr[2] = 7;
    arr[3] = 23;
    arr[4] = 56;
    arr[5] = 34;

    int max = arr[0];

    // Votre code ici:

    return max;
}
`,
        solution: `// Maximum Tableau - Solution

int main() {
    int arr[6];
    arr[0] = 12;
    arr[1] = 45;
    arr[2] = 7;
    arr[3] = 23;
    arr[4] = 56;
    arr[5] = 34;

    int max = arr[0];

    for (int i = 1; i < 6; i = i + 1) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }

    return max;
}
`,
        expectedReturn: 56
    },

    'c-array-count': {
        id: 'c-array-count',
        name: 'Compter Éléments',
        description: 'Compter les éléments pairs',
        template: `// ============================================
// Exercice: Compter Éléments
// ============================================
// Objectif: Compter les nombres pairs dans un tableau
//
// Tableau: {3, 8, 2, 7, 4, 9, 6, 1}
// Nombres pairs: 8, 2, 4, 6 -> 4 éléments
//
// Indice: Un nombre est pair si n % 2 == 0
//
// Résultat attendu: 4
// ============================================

int main() {
    int arr[8];
    arr[0] = 3;
    arr[1] = 8;
    arr[2] = 2;
    arr[3] = 7;
    arr[4] = 4;
    arr[5] = 9;
    arr[6] = 6;
    arr[7] = 1;

    int count = 0;

    // Votre code ici:

    return count;
}
`,
        solution: `// Compter Éléments - Solution

int main() {
    int arr[8];
    arr[0] = 3;
    arr[1] = 8;
    arr[2] = 2;
    arr[3] = 7;
    arr[4] = 4;
    arr[5] = 9;
    arr[6] = 6;
    arr[7] = 1;

    int count = 0;

    for (int i = 0; i < 8; i = i + 1) {
        if (arr[i] % 2 == 0) {
            count = count + 1;
        }
    }

    return count;
}
`,
        expectedReturn: 4
    },

    // ========================================
    // POINTEURS - Pointers
    // ========================================
    'c-ptr': {
        id: 'c-ptr',
        name: 'Pointeurs',
        description: 'Introduction aux pointeurs',
        template: `// ============================================
// Exercice: Pointeurs
// ============================================
// Objectif: Comprendre les pointeurs
//
// Un pointeur stocke l'adresse d'une variable
// &x = adresse de x
// *p = valeur pointée par p
//
// 1. Créer une variable x = 10
// 2. Créer un pointeur p vers x
// 3. Modifier *p pour mettre 42
// 4. Retourner x (qui vaut maintenant 42)
//
// Résultat attendu: 42
// ============================================

int main() {
    int x = 10;

    // Votre code ici:
    // Créer un pointeur vers x et modifier la valeur

    return x;
}
`,
        solution: `// Pointeurs - Solution

int main() {
    int x = 10;
    int *p = &x;
    *p = 42;
    return x;
}
`,
        expectedReturn: 42
    },

    'c-swap': {
        id: 'c-swap',
        name: 'Swap',
        description: 'Échanger avec des pointeurs',
        template: `// ============================================
// Exercice: Swap
// ============================================
// Objectif: Échanger deux variables via pointeurs
//
// 1. Créer une fonction swap(int *a, int *b)
//    qui échange les valeurs pointées
// 2. Appeler swap sur x=10 et y=20
// 3. Retourner x (qui devrait être 20)
//
// Résultat attendu: 20
// ============================================

// Définir la fonction swap ici:


int main() {
    int x = 10;
    int y = 20;

    // Appeler swap

    return x;
}
`,
        solution: `// Swap - Solution

void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main() {
    int x = 10;
    int y = 20;

    swap(&x, &y);

    return x;
}
`,
        expectedReturn: 20
    },

    'c-ptr-arr': {
        id: 'c-ptr-arr',
        name: 'Pointeurs et Tableaux',
        description: 'Parcourir un tableau avec pointeurs',
        template: `// ============================================
// Exercice: Pointeurs et Tableaux
// ============================================
// Objectif: Utiliser les pointeurs avec les tableaux
//
// Un tableau est un pointeur vers le premier élément
// arr[i] équivaut à *(arr + i)
//
// Calculer la somme du tableau {5, 10, 15, 20}
// en utilisant l'arithmétique de pointeurs
//
// Résultat attendu: 50
// ============================================

int main() {
    int arr[4];
    arr[0] = 5;
    arr[1] = 10;
    arr[2] = 15;
    arr[3] = 20;

    int sum = 0;
    int *p = arr;

    // Votre code ici:
    // Utiliser le pointeur p pour parcourir le tableau

    return sum;
}
`,
        solution: `// Pointeurs et Tableaux - Solution

int main() {
    int arr[4];
    arr[0] = 5;
    arr[1] = 10;
    arr[2] = 15;
    arr[3] = 20;

    int sum = 0;
    int *p = arr;

    for (int i = 0; i < 4; i = i + 1) {
        sum = sum + *(p + i);
    }

    return sum;
}
`,
        expectedReturn: 50
    },

    // ========================================
    // BITS - Bitwise operations
    // ========================================
    'c-bitwise': {
        id: 'c-bitwise',
        name: 'Opérations Binaires',
        description: 'Opérateurs bit à bit',
        template: `// ============================================
// Exercice: Opérations Binaires
// ============================================
// Objectif: Comprendre les opérateurs bit à bit
//
// & = ET bit à bit
// | = OU bit à bit
// ^ = XOR bit à bit
//
// x = 10 (0b1010), y = 12 (0b1100)
// Calculer: (x & y) | (x ^ y)
// - x & y = 0b1000 (8)
// - x ^ y = 0b0110 (6)
// - 8 | 6 = 0b1110 (14)
//
// Résultat attendu: 14
// ============================================

int main() {
    int x = 10;
    int y = 12;

    // Votre code ici:

    return 0;
}
`,
        solution: `// Opérations Binaires - Solution

int main() {
    int x = 10;
    int y = 12;

    int result = (x & y) | (x ^ y);
    return result;
}
`,
        expectedReturn: 14
    },

    'c-ispow2': {
        id: 'c-ispow2',
        name: 'Puissance de 2',
        description: 'Vérifier si un nombre est une puissance de 2',
        template: `// ============================================
// Exercice: Puissance de 2
// ============================================
// Objectif: Vérifier si n est une puissance de 2
//
// Astuce: n est une puissance de 2 si n > 0 et
// n & (n-1) == 0
//
// Exemple: 8 = 0b1000, 7 = 0b0111
// 8 & 7 = 0 -> 8 est une puissance de 2
//
// Créer is_pow2(n) qui retourne 1 si oui, 0 sinon
// Tester: is_pow2(16) + is_pow2(15) + is_pow2(32)
// = 1 + 0 + 1 = 2
//
// Résultat attendu: 2
// ============================================

// Définir is_pow2 ici:


int main() {
    return is_pow2(16) + is_pow2(15) + is_pow2(32);
}
`,
        solution: `// Puissance de 2 - Solution

int is_pow2(int n) {
    if (n <= 0) {
        return 0;
    }
    return (n & (n - 1)) == 0;
}

int main() {
    return is_pow2(16) + is_pow2(15) + is_pow2(32);
}
`,
        expectedReturn: 2
    },

    // ========================================
    // RÉCURSION - Recursion
    // ========================================
    'c-recur': {
        id: 'c-recur',
        name: 'Factorielle',
        description: 'Fonction récursive factorielle',
        template: `// ============================================
// Exercice: Factorielle
// ============================================
// Objectif: Calculer la factorielle récursivement
//
// fact(n) = n * fact(n-1)
// fact(0) = 1
//
// fact(5) = 5 * 4 * 3 * 2 * 1 = 120
//
// Résultat attendu: 120
// ============================================

// Définir la fonction fact ici:


int main() {
    return fact(5);
}
`,
        solution: `// Factorielle - Solution

int fact(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * fact(n - 1);
}

int main() {
    return fact(5);
}
`,
        expectedReturn: 120
    },

    'c-fib': {
        id: 'c-fib',
        name: 'Fibonacci',
        description: 'Suite de Fibonacci récursive',
        template: `// ============================================
// Exercice: Fibonacci
// ============================================
// Objectif: Calculer le n-ième Fibonacci
//
// fib(0) = 0
// fib(1) = 1
// fib(n) = fib(n-1) + fib(n-2)
//
// Suite: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34...
// fib(10) = 55
//
// Résultat attendu: 55
// ============================================

// Définir la fonction fib ici:


int main() {
    return fib(10);
}
`,
        solution: `// Fibonacci - Solution

int fib(int n) {
    if (n <= 0) {
        return 0;
    }
    if (n == 1) {
        return 1;
    }
    return fib(n - 1) + fib(n - 2);
}

int main() {
    return fib(10);
}
`,
        expectedReturn: 55
    },

    'c-sum-recur': {
        id: 'c-sum-recur',
        name: 'Somme Récursive',
        description: 'Somme de 1 à n récursive',
        template: `// ============================================
// Exercice: Somme Récursive
// ============================================
// Objectif: Calculer sum(n) = 1 + 2 + ... + n
//
// sum(n) = n + sum(n-1)
// sum(0) = 0
//
// sum(10) = 55
//
// Résultat attendu: 55
// ============================================

// Définir la fonction sum ici:


int main() {
    return sum(10);
}
`,
        solution: `// Somme Récursive - Solution

int sum(int n) {
    if (n <= 0) {
        return 0;
    }
    return n + sum(n - 1);
}

int main() {
    return sum(10);
}
`,
        expectedReturn: 55
    },

    // ========================================
    // ALGORITHMES AVANCÉS
    // ========================================
    'c-gcd': {
        id: 'c-gcd',
        name: 'PGCD (Euclide)',
        description: 'Algorithme d\'Euclide',
        template: `// ============================================
// Exercice: PGCD (Euclide)
// ============================================
// Objectif: Calculer le PGCD avec l'algorithme d'Euclide
//
// PGCD(a, b):
// - Si b == 0, retourner a
// - Sinon retourner PGCD(b, a % b)
//
// PGCD(48, 18):
// PGCD(48, 18) -> PGCD(18, 12) -> PGCD(12, 6) -> PGCD(6, 0) = 6
//
// Résultat attendu: 6
// ============================================

// Définir la fonction gcd ici:


int main() {
    return gcd(48, 18);
}
`,
        solution: `// PGCD (Euclide) - Solution

int gcd(int a, int b) {
    if (b == 0) {
        return a;
    }
    return gcd(b, a % b);
}

int main() {
    return gcd(48, 18);
}
`,
        expectedReturn: 6
    },

    'c-power': {
        id: 'c-power',
        name: 'Puissance',
        description: 'Calculer x^n efficacement',
        template: `// ============================================
// Exercice: Puissance
// ============================================
// Objectif: Calculer x^n (exponentiation rapide)
//
// power(x, n):
// - Si n == 0, retourner 1
// - Si n est pair: power(x*x, n/2)
// - Sinon: x * power(x, n-1)
//
// Calculer 2^10 = 1024
//
// Résultat attendu: 1024
// ============================================

// Définir la fonction power ici:


int main() {
    return power(2, 10);
}
`,
        solution: `// Puissance - Solution

int power(int x, int n) {
    if (n == 0) {
        return 1;
    }
    if (n % 2 == 0) {
        return power(x * x, n / 2);
    }
    return x * power(x, n - 1);
}

int main() {
    return power(2, 10);
}
`,
        expectedReturn: 1024
    },

    'c-prime': {
        id: 'c-prime',
        name: 'Test Primalité',
        description: 'Vérifier si un nombre est premier',
        template: `// ============================================
// Exercice: Test Primalité
// ============================================
// Objectif: Créer une fonction is_prime
//
// Un nombre premier n'est divisible que par 1 et lui-même
// Optimisation: tester seulement jusqu'à sqrt(n)
// (utiliser i*i <= n au lieu de i <= sqrt(n))
//
// Compter les premiers entre 1 et 20:
// 2, 3, 5, 7, 11, 13, 17, 19 -> 8 nombres
//
// Résultat attendu: 8
// ============================================

// Définir is_prime ici:


int main() {
    int count = 0;
    for (int n = 2; n <= 20; n = n + 1) {
        if (is_prime(n)) {
            count = count + 1;
        }
    }
    return count;
}
`,
        solution: `// Test Primalité - Solution

int is_prime(int n) {
    if (n < 2) {
        return 0;
    }
    for (int i = 2; i * i <= n; i = i + 1) {
        if (n % i == 0) {
            return 0;
        }
    }
    return 1;
}

int main() {
    int count = 0;
    for (int n = 2; n <= 20; n = n + 1) {
        if (is_prime(n)) {
            count = count + 1;
        }
    }
    return count;
}
`,
        expectedReturn: 8
    },

    'c-sort': {
        id: 'c-sort',
        name: 'Tri à Bulles',
        description: 'Algorithme de tri à bulles',
        template: `// ============================================
// Exercice: Tri à Bulles
// ============================================
// Objectif: Trier un tableau avec le tri à bulles
//
// Algorithme:
// - Parcourir le tableau plusieurs fois
// - À chaque passage, comparer les éléments adjacents
// - Si arr[i] > arr[i+1], les échanger
//
// Tableau: {64, 34, 25, 12, 22}
// Après tri, retourner arr[0] (le minimum)
//
// Résultat attendu: 12
// ============================================

int main() {
    int arr[5];
    arr[0] = 64;
    arr[1] = 34;
    arr[2] = 25;
    arr[3] = 12;
    arr[4] = 22;

    // Votre code ici:
    // Implémenter le tri à bulles

    return arr[0];
}
`,
        solution: `// Tri à Bulles - Solution

int main() {
    int arr[5];
    arr[0] = 64;
    arr[1] = 34;
    arr[2] = 25;
    arr[3] = 12;
    arr[4] = 22;

    for (int i = 0; i < 5; i = i + 1) {
        for (int j = 0; j < 4 - i; j = j + 1) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }

    return arr[0];
}
`,
        expectedReturn: 12
    },

    'c-search': {
        id: 'c-search',
        name: 'Recherche Binaire',
        description: 'Algorithme de recherche binaire',
        template: `// ============================================
// Exercice: Recherche Binaire
// ============================================
// Objectif: Trouver un élément dans un tableau trié
//
// Algorithme:
// - Comparer avec l'élément du milieu
// - Si égal, trouvé!
// - Si plus petit, chercher dans la moitié gauche
// - Si plus grand, chercher dans la moitié droite
//
// Tableau trié: {2, 5, 8, 12, 16, 23, 38, 56, 72, 91}
// Chercher 23, retourner son index (5)
//
// Résultat attendu: 5
// ============================================

int binary_search(int *arr, int size, int target) {
    int left = 0;
    int right = size - 1;

    // Votre code ici:

    return -1; // Non trouvé
}

int main() {
    int arr[10];
    arr[0] = 2;
    arr[1] = 5;
    arr[2] = 8;
    arr[3] = 12;
    arr[4] = 16;
    arr[5] = 23;
    arr[6] = 38;
    arr[7] = 56;
    arr[8] = 72;
    arr[9] = 91;

    return binary_search(arr, 10, 23);
}
`,
        solution: `// Recherche Binaire - Solution

int binary_search(int *arr, int size, int target) {
    int left = 0;
    int right = size - 1;

    while (left <= right) {
        int mid = (left + right) / 2;
        if (arr[mid] == target) {
            return mid;
        }
        if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return -1;
}

int main() {
    int arr[10];
    arr[0] = 2;
    arr[1] = 5;
    arr[2] = 8;
    arr[3] = 12;
    arr[4] = 16;
    arr[5] = 23;
    arr[6] = 38;
    arr[7] = 56;
    arr[8] = 72;
    arr[9] = 91;

    return binary_search(arr, 10, 23);
}
`,
        expectedReturn: 5
    },

    'c-reverse': {
        id: 'c-reverse',
        name: 'Inverser Tableau',
        description: 'Inverser un tableau en place',
        template: `// ============================================
// Exercice: Inverser Tableau
// ============================================
// Objectif: Inverser un tableau en place
//
// Tableau: {1, 2, 3, 4, 5}
// Après inversion: {5, 4, 3, 2, 1}
//
// Algorithme:
// - Échanger arr[0] avec arr[n-1]
// - Échanger arr[1] avec arr[n-2]
// - etc.
//
// Retourner la somme: arr[0]*1 + arr[1]*2 + arr[2]*3 + arr[3]*4 + arr[4]*5
// = 5*1 + 4*2 + 3*3 + 2*4 + 1*5 = 5 + 8 + 9 + 8 + 5 = 35
//
// Résultat attendu: 35
// ============================================

int main() {
    int arr[5];
    arr[0] = 1;
    arr[1] = 2;
    arr[2] = 3;
    arr[3] = 4;
    arr[4] = 5;

    // Votre code ici:
    // Inverser le tableau

    int sum = 0;
    for (int i = 0; i < 5; i = i + 1) {
        sum = sum + arr[i] * (i + 1);
    }
    return sum;
}
`,
        solution: `// Inverser Tableau - Solution

int main() {
    int arr[5];
    arr[0] = 1;
    arr[1] = 2;
    arr[2] = 3;
    arr[3] = 4;
    arr[4] = 5;

    int left = 0;
    int right = 4;
    while (left < right) {
        int temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;
        left = left + 1;
        right = right - 1;
    }

    int sum = 0;
    for (int i = 0; i < 5; i = i + 1) {
        sum = sum + arr[i] * (i + 1);
    }
    return sum;
}
`,
        expectedReturn: 35
    },

    'c-digits': {
        id: 'c-digits',
        name: 'Somme des Chiffres',
        description: 'Calculer la somme des chiffres',
        template: `// ============================================
// Exercice: Somme des Chiffres
// ============================================
// Objectif: Calculer la somme des chiffres d'un nombre
//
// digit_sum(12345) = 1 + 2 + 3 + 4 + 5 = 15
//
// Algorithme:
// - Extraire le dernier chiffre: n % 10
// - Supprimer le dernier chiffre: n / 10
// - Répéter jusqu'à n == 0
//
// Résultat attendu: 15
// ============================================

// Définir digit_sum ici:


int main() {
    return digit_sum(12345);
}
`,
        solution: `// Somme des Chiffres - Solution

int digit_sum(int n) {
    int sum = 0;
    while (n > 0) {
        sum = sum + (n % 10);
        n = n / 10;
    }
    return sum;
}

int main() {
    return digit_sum(12345);
}
`,
        expectedReturn: 15
    },

    'c-palindrome': {
        id: 'c-palindrome',
        name: 'Nombre Palindrome',
        description: 'Vérifier si un nombre est palindrome',
        template: `// ============================================
// Exercice: Nombre Palindrome
// ============================================
// Objectif: Vérifier si un nombre est un palindrome
//
// Un palindrome se lit pareil dans les deux sens
// 12321 -> palindrome (retourner 1)
// 12345 -> pas palindrome (retourner 0)
//
// Indice: Inverser le nombre et comparer
//
// Tester: is_palindrome(12321) + is_palindrome(1221) + is_palindrome(123)
// = 1 + 1 + 0 = 2
//
// Résultat attendu: 2
// ============================================

// Définir is_palindrome ici:


int main() {
    return is_palindrome(12321) + is_palindrome(1221) + is_palindrome(123);
}
`,
        solution: `// Nombre Palindrome - Solution

int is_palindrome(int n) {
    int original = n;
    int reversed = 0;

    while (n > 0) {
        reversed = reversed * 10 + (n % 10);
        n = n / 10;
    }

    if (reversed == original) {
        return 1;
    }
    return 0;
}

int main() {
    return is_palindrome(12321) + is_palindrome(1221) + is_palindrome(123);
}
`,
        expectedReturn: 2
    },

    // ========================================
    // ENTRÉES/SORTIES - I/O
    // ========================================
    'c-putchar': {
        id: 'c-putchar',
        name: 'Écrire un Caractère',
        description: 'Utiliser putchar pour afficher',
        template: `// ============================================
// Exercice: Écrire un Caractère
// ============================================
// Objectif: Afficher le caractère 'A' dans la console
//
// Pour écrire un caractère sur la console:
// 1. Créer un pointeur vers l'adresse 0xFFFF0000
// 2. Écrire le code ASCII du caractère
//
// Code ASCII de 'A' = 65
//
// Créer une fonction putchar(int c) puis l'utiliser
//
// Résultat attendu: 65 (le caractère envoyé)
// ============================================

// Définir putchar ici:


int main() {
    putchar(65);  // Affiche 'A'
    return 65;
}
`,
        solution: `// Écrire un Caractère - Solution

void putchar(int c) {
    int *port = (int*)0xFFFF0000;
    *port = c;
}

int main() {
    putchar(65);  // Affiche 'A'
    return 65;
}
`,
        expectedReturn: 65
    },

    'c-print': {
        id: 'c-print',
        name: 'Afficher une Chaîne',
        description: 'Afficher "HI" caractère par caractère',
        template: `// ============================================
// Exercice: Afficher une Chaîne
// ============================================
// Objectif: Afficher "HI" dans la console
//
// 'H' = 72, 'I' = 73
//
// Créer putchar et une fonction print qui affiche
// une chaîne caractère par caractère.
//
// Résultat attendu: 2 (nombre de caractères)
// ============================================

void putchar(int c) {
    int *port = (int*)0xFFFF0000;
    *port = c;
}

// Définir print ici qui retourne le nombre de caractères:


int main() {
    return print("HI");
}
`,
        solution: `// Afficher une Chaîne - Solution

void putchar(int c) {
    int *port = (int*)0xFFFF0000;
    *port = c;
}

int print(char *s) {
    int count = 0;
    while (*s) {
        putchar(*s);
        s = s + 1;
        count = count + 1;
    }
    return count;
}

int main() {
    return print("HI");
}
`,
        expectedReturn: 2
    },

    'c-print-num': {
        id: 'c-print-num',
        name: 'Afficher un Nombre',
        description: 'Afficher un entier en décimal',
        template: `// ============================================
// Exercice: Afficher un Nombre
// ============================================
// Objectif: Afficher le nombre 42 dans la console
//
// Algorithme:
// 1. Extraire les chiffres (42 % 10 = 2, 42 / 10 = 4)
// 2. Les stocker dans un buffer
// 3. Les afficher dans l'ordre inverse
//
// Le code ASCII de '0' est 48
// Pour convertir un chiffre: '0' + chiffre
//
// Résultat attendu: 42 (le nombre affiché)
// ============================================

void putchar(int c) {
    int *port = (int*)0xFFFF0000;
    *port = c;
}

// Définir print_int ici:


int main() {
    print_int(42);
    return 42;
}
`,
        solution: `// Afficher un Nombre - Solution

void putchar(int c) {
    int *port = (int*)0xFFFF0000;
    *port = c;
}

void print_int(int n) {
    char buf[12];
    int i = 0;

    if (n == 0) {
        putchar(48);
        return;
    }

    while (n > 0) {
        buf[i] = 48 + (n % 10);
        n = n / 10;
        i = i + 1;
    }

    while (i > 0) {
        i = i - 1;
        putchar(buf[i]);
    }
}

int main() {
    print_int(42);
    return 42;
}
`,
        expectedReturn: 42
    },

    'c-screen-pixel': {
        id: 'c-screen-pixel',
        name: 'Dessiner un Pixel',
        description: 'Allumer un pixel à l\'écran',
        template: `// ============================================
// Exercice: Dessiner un Pixel
// ============================================
// Objectif: Allumer le pixel (0,0) en haut à gauche
//
// L'écran est en mémoire à l'adresse 0x00400000
// 320x240 pixels, 1 bit par pixel
// Chaque byte contient 8 pixels (MSB = gauche)
//
// Pour allumer le pixel (0,0):
// - Adresse = 0x00400000
// - Écrire 0x80 (bit 7 = 1)
//
// Résultat attendu: 128 (0x80)
// ============================================

int main() {
    // Votre code ici:
    // Écrire 0x80 à l'adresse de l'écran

    return 0;
}
`,
        solution: `// Dessiner un Pixel - Solution

int main() {
    char *screen = (char*)0x00400000;
    *screen = 0x80;  // 0b10000000 - allume le pixel 0
    return 128;
}
`,
        expectedReturn: 128
    },

    'c-screen-line': {
        id: 'c-screen-line',
        name: 'Ligne Horizontale',
        description: 'Dessiner une ligne de 16 pixels',
        template: `// ============================================
// Exercice: Ligne Horizontale
// ============================================
// Objectif: Dessiner une ligne de 16 pixels
//
// L'écran commence à 0x00400000
// Pour dessiner 16 pixels:
// - Écrire 0xFF au premier byte (8 pixels)
// - Écrire 0xFF au deuxième byte (8 pixels)
//
// Résultat attendu: 16 (nombre de pixels allumés)
// ============================================

int main() {
    char *screen = (char*)0x00400000;

    // Votre code ici:
    // Dessiner 16 pixels horizontaux

    return 0;
}
`,
        solution: `// Ligne Horizontale - Solution

int main() {
    char *screen = (char*)0x00400000;

    screen[0] = 0xFF;  // 8 premiers pixels
    screen[1] = 0xFF;  // 8 pixels suivants

    return 16;
}
`,
        expectedReturn: 16
    },

    'c-screen-rect': {
        id: 'c-screen-rect',
        name: 'Dessiner un Rectangle',
        description: 'Dessiner un rectangle 8x8',
        template: `// ============================================
// Exercice: Dessiner un Rectangle
// ============================================
// Objectif: Dessiner un carré de 8x8 pixels
//
// L'écran fait 320 pixels de large = 40 bytes par ligne
// Pour dessiner 8 lignes de 8 pixels:
// - Écrire 0xFF à screen[0], screen[40], screen[80]...
//
// Résultat attendu: 64 (8x8 pixels)
// ============================================

int main() {
    char *screen = (char*)0x00400000;

    // Votre code ici:
    // Dessiner un carré 8x8

    return 0;
}
`,
        solution: `// Dessiner un Rectangle - Solution

int main() {
    char *screen = (char*)0x00400000;

    for (int y = 0; y < 8; y = y + 1) {
        screen[y * 40] = 0xFF;  // 40 bytes par ligne
    }

    return 64;
}
`,
        expectedReturn: 64
    },

    // ========================================
    // PROJETS AVANCÉS
    // ========================================
    'c-sieve': {
        id: 'c-sieve',
        name: 'Crible d\'Ératosthène',
        description: 'Trouver tous les premiers jusqu\'à N',
        template: `// ============================================
// Exercice: Crible d'Ératosthène
// ============================================
// Objectif: Compter les premiers jusqu'à 50
//
// Algorithme du crible:
// 1. Créer un tableau is_prime[51], tous à 1
// 2. is_prime[0] = is_prime[1] = 0
// 3. Pour chaque i de 2 à sqrt(50):
//    Si is_prime[i], marquer tous ses multiples à 0
// 4. Compter les 1 restants
//
// Premiers <= 50: 2,3,5,7,11,13,17,19,23,29,31,37,41,43,47
// = 15 nombres
//
// Résultat attendu: 15
// ============================================

int main() {
    int is_prime[51];
    int i;
    int j;
    int count;

    // Initialiser tous à 1
    for (i = 0; i <= 50; i = i + 1) {
        is_prime[i] = 1;
    }
    is_prime[0] = 0;
    is_prime[1] = 0;

    // Votre code ici:
    // Implémenter le crible (utiliser i et j)

    // Compter les premiers
    count = 0;
    for (i = 2; i <= 50; i = i + 1) {
        if (is_prime[i]) {
            count = count + 1;
        }
    }
    return count;
}
`,
        solution: `// Crible d'Ératosthène - Solution

int main() {
    int is_prime[51];
    int i;
    int j;
    int count;

    for (i = 0; i <= 50; i = i + 1) {
        is_prime[i] = 1;
    }
    is_prime[0] = 0;
    is_prime[1] = 0;

    for (i = 2; i * i <= 50; i = i + 1) {
        if (is_prime[i]) {
            for (j = i * i; j <= 50; j = j + i) {
                is_prime[j] = 0;
            }
        }
    }

    count = 0;
    for (i = 2; i <= 50; i = i + 1) {
        if (is_prime[i]) {
            count = count + 1;
        }
    }
    return count;
}
`,
        expectedReturn: 15
    },

    'c-collatz': {
        id: 'c-collatz',
        name: 'Suite de Collatz',
        description: 'Longueur de la suite de Collatz',
        template: `// ============================================
// Exercice: Suite de Collatz
// ============================================
// Objectif: Calculer la longueur de la suite de Collatz
//
// Règles:
// - Si n est pair: n = n / 2
// - Si n est impair: n = 3*n + 1
// - Répéter jusqu'à n == 1
//
// Exemple pour n=6: 6->3->10->5->16->8->4->2->1
// Longueur = 9 (nombre d'étapes incluant le départ)
//
// Calculer la longueur pour n=27
// (La suite de 27 est célèbre car longue!)
//
// Résultat attendu: 112
// ============================================

// Définir collatz_length ici:


int main() {
    return collatz_length(27);
}
`,
        solution: `// Suite de Collatz - Solution

int collatz_length(int n) {
    int count;
    count = 1;
    while (n != 1) {
        if (n % 2 == 0) {
            n = n / 2;
        } else {
            n = 3 * n + 1;
        }
        count = count + 1;
    }
    return count;
}

int main() {
    return collatz_length(27);  // attendu: 112
}
`,
        expectedReturn: 112
    },

    'c-project': {
        id: 'c-project',
        name: 'Projet Final',
        description: 'Somme des diviseurs propres',
        template: `// ============================================
// Exercice: Projet Final
// ============================================
// Objectif: Calculer la somme des diviseurs propres
//
// Un diviseur propre de n est un diviseur < n
// Diviseurs propres de 12: 1, 2, 3, 4, 6
// Somme = 16
//
// Calculer la somme des diviseurs propres de 28
// (28 est un nombre parfait: ses diviseurs propres
// sont 1, 2, 4, 7, 14 et leur somme = 28)
//
// Résultat attendu: 28
// ============================================

int sum_divisors(int n) {
    // Votre code ici:

    return 0;
}

int main() {
    return sum_divisors(28);
}
`,
        solution: `// Projet Final - Solution

int sum_divisors(int n) {
    int sum = 0;
    for (int i = 1; i < n; i = i + 1) {
        if (n % i == 0) {
            sum = sum + i;
        }
    }
    return sum;
}

int main() {
    return sum_divisors(28);
}
`,
        expectedReturn: 28
    },

    // ========================================
    // STRUCTURES (Structs)
    // ========================================
    'c-struct-def': {
        id: 'c-struct-def',
        name: 'Définition Struct',
        description: 'Définir et utiliser une structure',
        template: `// ============================================
// Exercice: Définition Struct
// ============================================
// Objectif: Créer une structure Point avec x et y
//
// 1. Définir une struct Point avec deux champs int: x et y
// 2. Créer une variable p de type struct Point
// 3. Assigner p.x = 17 et p.y = 25
// 4. Retourner p.x + p.y
//
// Résultat attendu: 42
// ============================================

// Définir la structure Point ici:


int main() {
    // Créer une variable de type struct Point
    // Assigner les valeurs et retourner la somme

    return 0;
}
`,
        solution: `// Définition Struct - Solution

struct Point { int x; int y; };

int main() {
    struct Point p;
    p.x = 17;
    p.y = 25;
    return p.x + p.y;
}
`,
        expectedReturn: 42
    },

    'c-struct-ptr': {
        id: 'c-struct-ptr',
        name: 'Pointeur Struct',
        description: 'Utiliser l\'opérateur flèche ->',
        template: `// ============================================
// Exercice: Pointeur Struct
// ============================================
// Objectif: Utiliser un pointeur vers une structure
//
// L'opérateur -> permet d'accéder aux champs
// via un pointeur: ptr->x équivaut à (*ptr).x
//
// 1. Créer une struct Point avec x=10, y=32
// 2. Créer un pointeur vers cette struct
// 3. Utiliser le pointeur pour retourner ptr->x + ptr->y
//
// Résultat attendu: 42
// ============================================

struct Point { int x; int y; };

int main() {
    struct Point p;
    p.x = 10;
    p.y = 32;

    // Créer un pointeur vers p et utiliser ->

    return 0;
}
`,
        solution: `// Pointeur Struct - Solution

struct Point { int x; int y; };

int main() {
    struct Point p;
    p.x = 10;
    p.y = 32;

    struct Point *ptr = &p;
    return ptr->x + ptr->y;
}
`,
        expectedReturn: 42
    },

    'c-struct-func': {
        id: 'c-struct-func',
        name: 'Struct et Fonctions',
        description: 'Passer une struct à une fonction',
        template: `// ============================================
// Exercice: Struct et Fonctions
// ============================================
// Objectif: Passer un pointeur de struct à une fonction
//
// Créer une fonction distance_sq qui calcule
// le carré de la distance à l'origine:
// distance_sq(p) = p->x * p->x + p->y * p->y
//
// Tester avec Point(3, 4): 3² + 4² = 9 + 16 = 25
//
// Résultat attendu: 25
// ============================================

struct Point { int x; int y; };

// Définir la fonction distance_sq ici:


int main() {
    struct Point p;
    p.x = 3;
    p.y = 4;
    return distance_sq(&p);
}
`,
        solution: `// Struct et Fonctions - Solution

struct Point { int x; int y; };

int distance_sq(struct Point *p) {
    return p->x * p->x + p->y * p->y;
}

int main() {
    struct Point p;
    p.x = 3;
    p.y = 4;
    return distance_sq(&p);
}
`,
        expectedReturn: 25
    },

    'c-struct-nested': {
        id: 'c-struct-nested',
        name: 'Structs Imbriquées',
        description: 'Struct contenant une autre struct',
        template: `// ============================================
// Exercice: Structs Imbriquées
// ============================================
// Objectif: Créer une struct contenant une autre struct
//
// 1. Struct Point avec x, y
// 2. Struct Rectangle avec un Point (coin) et largeur/hauteur
// 3. Calculer l'aire: width * height
//
// Rectangle avec coin=(0,0), width=6, height=7
// Aire = 6 * 7 = 42
//
// Résultat attendu: 42
// ============================================

struct Point { int x; int y; };

// Définir Rectangle ici (contient un Point):


int main() {
    struct Rectangle r;
    r.corner.x = 0;
    r.corner.y = 0;
    r.width = 6;
    r.height = 7;

    return r.width * r.height;
}
`,
        solution: `// Structs Imbriquées - Solution

struct Point { int x; int y; };
struct Rectangle { struct Point corner; int width; int height; };

int main() {
    struct Rectangle r;
    r.corner.x = 0;
    r.corner.y = 0;
    r.width = 6;
    r.height = 7;

    return r.width * r.height;
}
`,
        expectedReturn: 42
    },

    'c-struct-array': {
        id: 'c-struct-array',
        name: 'Tableau de Structs',
        description: 'Créer et parcourir un tableau de structs',
        template: `// ============================================
// Exercice: Tableau de Structs
// ============================================
// Objectif: Manipuler un tableau de structures
//
// Créer un tableau de 3 Points:
// - points[0] = (10, 2)
// - points[1] = (15, 5)
// - points[2] = (8, 2)
//
// Calculer la somme de tous les x:
// 10 + 15 + 8 = 33
//
// Résultat attendu: 33
// ============================================

struct Point { int x; int y; };

int main() {
    struct Point points[3];

    // Initialiser les 3 points

    // Calculer la somme des x

    return 0;
}
`,
        solution: `// Tableau de Structs - Solution

struct Point { int x; int y; };

int main() {
    struct Point points[3];

    points[0].x = 10;
    points[0].y = 2;
    points[1].x = 15;
    points[1].y = 5;
    points[2].x = 8;
    points[2].y = 2;

    int sum = 0;
    for (int i = 0; i < 3; i = i + 1) {
        sum = sum + points[i].x;
    }
    return sum;
}
`,
        expectedReturn: 33
    },

    'c-struct-sizeof': {
        id: 'c-struct-sizeof',
        name: 'Sizeof Struct',
        description: 'Comprendre la taille des structures',
        template: `// ============================================
// Exercice: Sizeof Struct
// ============================================
// Objectif: Comprendre sizeof avec les structures
//
// Les structures ont une taille qui dépend de:
// - La taille de chaque champ
// - L'alignement en mémoire
//
// struct S1 { int a; } -> 4 bytes
// struct S2 { int x; int y; char c; } -> 12 bytes
//   (char est aligné sur 4 bytes)
//
// Calculer: sizeof(struct S1) + sizeof(struct S2)
// = 4 + 12 = 16
//
// Résultat attendu: 16
// ============================================

struct S1 { int a; };
struct S2 { int x; int y; char c; };

int main() {
    return sizeof(struct S1) + sizeof(struct S2);
}
`,
        solution: `// Sizeof Struct - Solution

struct S1 { int a; };
struct S2 { int x; int y; char c; };

int main() {
    return sizeof(struct S1) + sizeof(struct S2);
}
`,
        expectedReturn: 16
    },

    // ========================================
    // CACHE - Memory Access Patterns
    // ========================================
    'c-cache-row': {
        id: 'c-cache-row',
        name: 'Parcours en Ligne',
        description: 'Parcours cache-friendly d\'un tableau 2D',
        template: `// ============================================
// Exercice: Parcours en Ligne (Row-Major)
// ============================================
// Objectif: Comprendre l'importance de la localité spatiale
//
// En mémoire, une matrice 4x4 stockée en row-major:
//   Index 0-3:   ligne 0 (arr[0*4+0], arr[0*4+1], ...)
//   Index 4-7:   ligne 1 (arr[1*4+0], arr[1*4+1], ...)
//   Index 8-11:  ligne 2
//   Index 12-15: ligne 3
//
// Un parcours "en ligne" (row-major) est cache-friendly car
// les éléments consécutifs sont proches en mémoire.
//
// Simuler arr[i][j] avec arr[i * 4 + j]
//
// 1. Initialiser arr[i*4+j] = i * 4 + j
// 2. Calculer la somme de tous les éléments
//
// Résultat attendu: 0+1+2+...+15 = 120
// ============================================

int arr[16];

int main() {
    int i;
    int j;
    int sum;

    // 1. Initialiser (parcours en ligne: i puis j)
    for (i = 0; i < 4; i = i + 1) {
        for (j = 0; j < 4; j = j + 1) {
            // Votre code ici:
            // arr[i * 4 + j] = ...

        }
    }

    // 2. Calculer la somme (parcours en ligne)
    sum = 0;
    for (i = 0; i < 4; i = i + 1) {
        for (j = 0; j < 4; j = j + 1) {
            // Votre code ici:
            // sum = sum + arr[...]

        }
    }

    return sum;
}
`,
        solution: `// Parcours en Ligne - Solution

int arr[16];

int main() {
    int i;
    int j;
    int sum;

    // Initialiser (parcours en ligne: cache-friendly)
    for (i = 0; i < 4; i = i + 1) {
        for (j = 0; j < 4; j = j + 1) {
            arr[i * 4 + j] = i * 4 + j;
        }
    }

    // Calculer la somme (accès séquentiel 0,1,2,3,4,5...)
    sum = 0;
    for (i = 0; i < 4; i = i + 1) {
        for (j = 0; j < 4; j = j + 1) {
            sum = sum + arr[i * 4 + j];
        }
    }

    return sum;
}
`,
        expectedReturn: 120
    },

    'c-cache-col': {
        id: 'c-cache-col',
        name: 'Parcours en Colonne',
        description: 'Comparer avec un parcours cache-unfriendly',
        template: `// ============================================
// Exercice: Parcours en Colonne (Column-Major)
// ============================================
// Objectif: Comprendre pourquoi le parcours en colonne
// est moins efficace pour le cache
//
// Un parcours "en colonne" accède avec des sauts:
//   Index 0, 4, 8, 12 (colonne 0)
//   Index 1, 5, 9, 13 (colonne 1)
//   ...
//
// Cela cause plus de cache misses car chaque accès
// saute plusieurs éléments en mémoire.
//
// Malgré cela, le résultat final est le même!
// Calculez la somme avec un parcours en colonne.
//
// Résultat attendu: 120 (même résultat, mais moins efficace)
// ============================================

int arr[16];

int main() {
    int i;
    int j;
    int sum;

    // Initialiser (row-major comme d'habitude)
    for (i = 0; i < 4; i = i + 1) {
        for (j = 0; j < 4; j = j + 1) {
            arr[i * 4 + j] = i * 4 + j;
        }
    }

    // Somme en colonne (j en premier, puis i)
    // Accès: 0,4,8,12, 1,5,9,13, 2,6,10,14, 3,7,11,15
    sum = 0;
    for (j = 0; j < 4; j = j + 1) {
        for (i = 0; i < 4; i = i + 1) {
            // Votre code ici:
            // sum = sum + arr[...]

        }
    }

    return sum;
}
`,
        solution: `// Parcours en Colonne - Solution

int arr[16];

int main() {
    int i;
    int j;
    int sum;

    // Initialiser
    for (i = 0; i < 4; i = i + 1) {
        for (j = 0; j < 4; j = j + 1) {
            arr[i * 4 + j] = i * 4 + j;
        }
    }

    // Somme en colonne (cache-unfriendly mais correct)
    // Accès: 0,4,8,12, 1,5,9,13, 2,6,10,14, 3,7,11,15
    sum = 0;
    for (j = 0; j < 4; j = j + 1) {
        for (i = 0; i < 4; i = i + 1) {
            sum = sum + arr[i * 4 + j];
        }
    }

    return sum;
}
`,
        expectedReturn: 120
    },

    'c-cache-block': {
        id: 'c-cache-block',
        name: 'Traitement par Blocs',
        description: 'Technique de blocking pour optimiser le cache',
        template: `// ============================================
// Exercice: Traitement par Blocs (Blocking)
// ============================================
// Objectif: Comprendre la technique de blocking
//
// Pour de grands tableaux, on peut diviser le travail
// en "blocs" qui tiennent dans le cache.
//
// Au lieu de parcourir tout le tableau d'un coup,
// on traite des blocs de 2x2 éléments.
//
// Matrice 4x4 (16 éléments), blocs de 2x2:
// +----+----+
// | B0 | B1 |   B0: indices 0,1,4,5
// +----+----+   B1: indices 2,3,6,7
// | B2 | B3 |   B2: indices 8,9,12,13
// +----+----+   B3: indices 10,11,14,15
//
// Calculez la somme en utilisant des blocs 2x2.
//
// Résultat attendu: 120
// ============================================

int arr[16];

int main() {
    int i;
    int j;
    int bi;
    int bj;
    int sum;

    // Initialiser
    for (i = 0; i < 4; i = i + 1) {
        for (j = 0; j < 4; j = j + 1) {
            arr[i * 4 + j] = i * 4 + j;
        }
    }

    sum = 0;

    // Parcours par blocs 2x2
    for (bi = 0; bi < 4; bi = bi + 2) {
        for (bj = 0; bj < 4; bj = bj + 2) {
            // Traiter le bloc 2x2 commençant à (bi, bj)
            for (i = bi; i < bi + 2; i = i + 1) {
                for (j = bj; j < bj + 2; j = j + 1) {
                    // Votre code ici:
                    // sum = sum + arr[...]

                }
            }
        }
    }

    return sum;
}
`,
        solution: `// Traitement par Blocs - Solution

int arr[16];

int main() {
    int i;
    int j;
    int bi;
    int bj;
    int sum;

    // Initialiser
    for (i = 0; i < 4; i = i + 1) {
        for (j = 0; j < 4; j = j + 1) {
            arr[i * 4 + j] = i * 4 + j;
        }
    }

    sum = 0;

    // Parcours par blocs 2x2 (cache-friendly)
    for (bi = 0; bi < 4; bi = bi + 2) {
        for (bj = 0; bj < 4; bj = bj + 2) {
            for (i = bi; i < bi + 2; i = i + 1) {
                for (j = bj; j < bj + 2; j = j + 1) {
                    sum = sum + arr[i * 4 + j];
                }
            }
        }
    }

    return sum;
}
`,
        expectedReturn: 120
    },

    'c-cache-temporal': {
        id: 'c-cache-temporal',
        name: 'Localité Temporelle',
        description: 'Réutiliser les données en cache',
        template: `// ============================================
// Exercice: Localité Temporelle
// ============================================
// Objectif: Comprendre la localité temporelle
//
// La localité temporelle signifie réutiliser rapidement
// les données récemment accédées (encore dans le cache).
//
// Mauvais: Parcourir le tableau N fois
//   for k: for i: sum += arr[i]  (arr rechargé N fois!)
//
// Bon: Accumuler tout en un seul parcours
//   for i: sum += arr[i] * N     (arr chargé 1 fois)
//
// Calculer: sum = arr[0]*3 + arr[1]*3 + arr[2]*3 + arr[3]*3
// où arr = {1, 2, 3, 4}
//
// Résultat attendu: (1+2+3+4) * 3 = 30
// ============================================

int arr[4];

int main() {
    arr[0] = 1;
    arr[1] = 2;
    arr[2] = 3;
    arr[3] = 4;

    int sum = 0;
    int factor = 3;

    // Méthode cache-friendly: un seul parcours
    for (int i = 0; i < 4; i = i + 1) {
        // Votre code ici:

    }

    return sum;
}
`,
        solution: `// Localité Temporelle - Solution

int arr[4];

int main() {
    arr[0] = 1;
    arr[1] = 2;
    arr[2] = 3;
    arr[3] = 4;

    int sum = 0;
    int factor = 3;

    // Un seul parcours: bonne localité temporelle
    for (int i = 0; i < 4; i = i + 1) {
        sum = sum + arr[i] * factor;
    }

    return sum;
}
`,
        expectedReturn: 30
    }
};

// Get exercise by ID
export function getCExercise(id) {
    return C_EXERCISES[id];
}

// Get all C exercise IDs in order
export function getCExerciseIds() {
    return Object.keys(C_EXERCISES);
}
