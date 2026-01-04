// Demo 01: Hello World
// Le programme le plus simple - affiche un message
//
// Concepts: sortie texte, chaînes de caractères, point d'entrée

// Adresse du port de sortie texte (memory-mapped I/O)
#define OUTPUT_PORT ((volatile int*)0x10000000)

// Fonction pour afficher un caractère
void putchar(int c) {
    *OUTPUT_PORT = c;
}

// Fonction pour afficher une chaîne
void print(char *s) {
    while (*s) {
        putchar(*s);
        s = s + 1;
    }
}

// Fonction pour afficher une chaîne avec retour à la ligne
void println(char *s) {
    print(s);
    putchar(10);  // 10 = '\n'
}

// Point d'entrée du programme
int main() {
    println("Hello, World!");
    println("Bienvenue dans A32-Lite!");
    println("");
    println("Ce programme demontre:");
    println("  - L'affichage de texte");
    println("  - Les chaines de caracteres");
    println("  - Les fonctions");

    return 0;
}
