int main() {
  char c = (char)0xFF;
  bool b = 0;
  if (c + b == 0xFF) {
    return 1;
  }
  return 0;
}
