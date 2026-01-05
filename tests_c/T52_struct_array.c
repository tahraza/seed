// Test array of structs
struct Item { int value; };

int main() {
    struct Item arr[3];
    arr[0].value = 10;
    arr[1].value = 14;
    arr[2].value = 18;
    return arr[0].value + arr[1].value + arr[2].value;
}
