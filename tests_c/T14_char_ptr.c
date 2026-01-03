int main() {
  char buf[4];
  char *p = buf;
  p[0] = 1;
  p[1] = 2;
  p[2] = 3;
  p[3] = 4;
  return p[2];
}
