int main() {
  int a[2];
  char b[2];
  int *p = a;
  char *q = b;
  return (int)((p + 1) - p) * 10 + (int)((q + 1) - q);
}
