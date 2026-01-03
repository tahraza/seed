int main() {
  int a[3];
  if (sizeof(int) == 4 && sizeof(char) == 1 && sizeof(bool) == 1 && sizeof(a) == 12) {
    return 1;
  }
  return 0;
}
