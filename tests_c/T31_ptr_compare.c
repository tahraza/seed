int main() {
  int a[2];
  int *p = a;
  int *q = a + 1;
  if (p != q && p == a) {
    return 1;
  }
  return 0;
}
