// Test struct pointer and arrow operator
struct Point { int x; int y; };

int sum_point(struct Point *p) {
    return p->x + p->y;
}

int main() {
    struct Point p;
    p.x = 15;
    p.y = 27;
    return sum_point(&p);
}
