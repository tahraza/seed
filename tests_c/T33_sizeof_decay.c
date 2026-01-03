int sizeof_param(int a[]) {
  return sizeof(a);
}

int main() {
  int a[3];
  int x = sizeof(a);
  int y = sizeof_param(a);
  if (x == 12 && y == 4) {
    return 1;
  }
  return 0;
}
