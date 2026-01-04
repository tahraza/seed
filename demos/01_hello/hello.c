// Demo 01: Hello World
// Le programme le plus simple - affiche un message

// Fonction pour afficher un caractere
// Port de sortie MMIO a 0xFFFF0000
void putchar(int c) {
    int *port;
    port = (int*)0xFFFF0000;
    *port = c;
}

// Fonction pour afficher une chaine
void print(char *s) {
    while (*s) {
        putchar(*s);
        s = s + 1;
    }
}

// Fonction pour afficher une chaine avec retour a la ligne
void println(char *s) {
    print(s);
    putchar(10);
}

// Point d'entree du programme
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
