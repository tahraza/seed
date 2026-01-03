int main() {
  int a[1];
  int *p = a;
  unsigned int v = (unsigned int)p;
  int *q = (int *)v;
  if (q == p) {
    return 1;
  }
  return 0;
}
