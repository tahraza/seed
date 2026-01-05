// Test sizeof on structs
struct S1 { int a; };
struct S2 { int x; int y; char c; };

int main() {
    // S1 = 4 bytes, S2 = 12 bytes (alignment)
    return sizeof(struct S1) + sizeof(struct S2);
}
