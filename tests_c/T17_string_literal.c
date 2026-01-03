int putc(int c);

int main() {
  char *s = "Hi";
  putc(s[0]);
  putc(s[1]);
  return 0;
}
