int main() {
  int i = 0;
  int s = 0;
  while (1) {
    i = i + 1;
    if (i == 3) {
      continue;
    }
    if (i == 6) {
      break;
    }
    s = s + i;
  }
  return s;
}
