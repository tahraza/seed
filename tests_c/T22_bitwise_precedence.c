int main() {
  int a = 6;  /* 110 */
  int b = 3;  /* 011 */
int x = a & b == 2; /* == has higher precedence than &, so this is a & (b == 2) */
  int y = (a & b) == 2; /* true */
  int z = a ^ b; /* 101 = 5 */
  if (x == 0 && y == 1 && z == 5) {
    return 1;
  }
  return 0;
}
