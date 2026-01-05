// Test nested structs
struct Inner { int a; int b; };
struct Outer { struct Inner in; int c; };

int main() {
    struct Outer o;
    o.in.a = 10;
    o.in.b = 20;
    o.c = 12;
    return o.in.a + o.in.b + o.c;
}
