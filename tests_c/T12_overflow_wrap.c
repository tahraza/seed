int main() {
  unsigned int u = 0xFFFFFFFFu;
  u = u + 1;
  int s = 0x7FFFFFFF;
  s = s + 1;
  if (u == 0 && s == (int)0x80000000u) {
    return 1;
  }
  return 0;
}
