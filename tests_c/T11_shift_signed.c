int main() {
  int a = -4;
  unsigned int b = 0x80000000u;
  int x = a >> 1;
  unsigned int y = b >> 1;
  if (x == -2 && y == 0x40000000u) {
    return 1;
  }
  return 0;
}
