int main() {
  int a[2];
  int *p = a;
  *(p + 1) = 7;
  return a[1];
}
