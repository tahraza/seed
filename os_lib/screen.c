// screen.c - Screen graphics library
// 320x240 pixel display, 1 bit per pixel (black/white)

// Screen memory-mapped address
#define SCREEN_BASE  0x00400000
#define SCREEN_WIDTH  320
#define SCREEN_HEIGHT 240
#define SCREEN_BYTES  9600  // (320 * 240) / 8

// Color constants
#define COLOR_BLACK 1
#define COLOR_WHITE 0

// Current drawing color (1 = black, 0 = white)
int screen_color = 1;

// Initialize the screen (clear to white)
void screen_init(void) {
    uint *screen = (uint *)SCREEN_BASE;
    int i;
    for (i = 0; i < SCREEN_BYTES / 4; i = i + 1) {
        screen[i] = 0;
    }
}

// Clear the screen to current color
void screen_clear(void) {
    uint *screen = (uint *)SCREEN_BASE;
    uint fill = screen_color ? 0xFFFFFFFF : 0;
    int i;
    for (i = 0; i < SCREEN_BYTES / 4; i = i + 1) {
        screen[i] = fill;
    }
}

// Set drawing color (0 = white, 1 = black)
void screen_set_color(int color) {
    screen_color = color != 0 ? 1 : 0;
}

// Draw a single pixel at (x, y)
void screen_draw_pixel(int x, int y) {
    char *screen;
    int byte_index;
    int bit_offset;
    char mask;

    if (x < 0 || x >= SCREEN_WIDTH || y < 0 || y >= SCREEN_HEIGHT) {
        return;
    }

    screen = (char *)SCREEN_BASE;
    byte_index = (y * SCREEN_WIDTH + x) / 8;
    bit_offset = 7 - ((y * SCREEN_WIDTH + x) % 8);  // MSB is leftmost
    mask = (char)(1 << bit_offset);

    if (screen_color) {
        screen[byte_index] = screen[byte_index] | mask;
    } else {
        screen[byte_index] = screen[byte_index] & (~mask);
    }
}

// Get pixel value at (x, y)
int screen_get_pixel(int x, int y) {
    char *screen;
    int byte_index;
    int bit_offset;

    if (x < 0 || x >= SCREEN_WIDTH || y < 0 || y >= SCREEN_HEIGHT) {
        return 0;
    }

    screen = (char *)SCREEN_BASE;
    byte_index = (y * SCREEN_WIDTH + x) / 8;
    bit_offset = 7 - ((y * SCREEN_WIDTH + x) % 8);

    return (screen[byte_index] >> bit_offset) & 1;
}

// Draw a horizontal line from (x1, y) to (x2, y)
void screen_draw_hline(int x1, int x2, int y) {
    int temp;
    int x;

    if (y < 0 || y >= SCREEN_HEIGHT) {
        return;
    }

    // Ensure x1 <= x2
    if (x1 > x2) {
        temp = x1;
        x1 = x2;
        x2 = temp;
    }

    // Clamp to screen bounds
    if (x1 < 0) x1 = 0;
    if (x2 >= SCREEN_WIDTH) x2 = SCREEN_WIDTH - 1;

    // Draw pixels
    for (x = x1; x <= x2; x = x + 1) {
        screen_draw_pixel(x, y);
    }
}

// Draw a vertical line from (x, y1) to (x, y2)
void screen_draw_vline(int x, int y1, int y2) {
    int temp;
    int y;

    if (x < 0 || x >= SCREEN_WIDTH) {
        return;
    }

    if (y1 > y2) {
        temp = y1;
        y1 = y2;
        y2 = temp;
    }

    if (y1 < 0) y1 = 0;
    if (y2 >= SCREEN_HEIGHT) y2 = SCREEN_HEIGHT - 1;

    for (y = y1; y <= y2; y = y + 1) {
        screen_draw_pixel(x, y);
    }
}

// Draw a line from (x1, y1) to (x2, y2) using Bresenham's algorithm
void screen_draw_line(int x1, int y1, int x2, int y2) {
    int dx;
    int dy;
    int sx;
    int sy;
    int err;
    int e2;

    dx = x2 - x1;
    if (dx < 0) dx = 0 - dx;
    dy = y2 - y1;
    if (dy < 0) dy = 0 - dy;
    dy = 0 - dy;

    sx = x1 < x2 ? 1 : (0 - 1);
    sy = y1 < y2 ? 1 : (0 - 1);
    err = dx + dy;

    while (1) {
        screen_draw_pixel(x1, y1);

        if (x1 == x2 && y1 == y2) {
            break;
        }

        e2 = 2 * err;
        if (e2 >= dy) {
            err = err + dy;
            x1 = x1 + sx;
        }
        if (e2 <= dx) {
            err = err + dx;
            y1 = y1 + sy;
        }
    }
}

// Draw a rectangle outline
void screen_draw_rect(int x1, int y1, int x2, int y2) {
    screen_draw_hline(x1, x2, y1);
    screen_draw_hline(x1, x2, y2);
    screen_draw_vline(x1, y1, y2);
    screen_draw_vline(x2, y1, y2);
}

// Draw a filled rectangle
void screen_fill_rect(int x1, int y1, int x2, int y2) {
    int temp;
    int y;

    if (y1 > y2) {
        temp = y1;
        y1 = y2;
        y2 = temp;
    }

    for (y = y1; y <= y2; y = y + 1) {
        screen_draw_hline(x1, x2, y);
    }
}

// Draw a circle outline using midpoint algorithm
void screen_draw_circle(int cx, int cy, int r) {
    int x;
    int y;
    int d;

    if (r <= 0) {
        screen_draw_pixel(cx, cy);
        return;
    }

    x = r;
    y = 0;
    d = 1 - r;

    while (x >= y) {
        // Draw 8 symmetric points
        screen_draw_pixel(cx + x, cy + y);
        screen_draw_pixel(cx - x, cy + y);
        screen_draw_pixel(cx + x, cy - y);
        screen_draw_pixel(cx - x, cy - y);
        screen_draw_pixel(cx + y, cy + x);
        screen_draw_pixel(cx - y, cy + x);
        screen_draw_pixel(cx + y, cy - x);
        screen_draw_pixel(cx - y, cy - x);

        y = y + 1;
        if (d < 0) {
            d = d + 2 * y + 1;
        } else {
            x = x - 1;
            d = d + 2 * (y - x) + 1;
        }
    }
}

// Draw a filled circle
void screen_fill_circle(int cx, int cy, int r) {
    int x;
    int y;
    int d;

    if (r <= 0) {
        screen_draw_pixel(cx, cy);
        return;
    }

    x = r;
    y = 0;
    d = 1 - r;

    while (x >= y) {
        // Draw horizontal lines to fill
        screen_draw_hline(cx - x, cx + x, cy + y);
        screen_draw_hline(cx - x, cx + x, cy - y);
        screen_draw_hline(cx - y, cx + y, cy + x);
        screen_draw_hline(cx - y, cx + y, cy - x);

        y = y + 1;
        if (d < 0) {
            d = d + 2 * y + 1;
        } else {
            x = x - 1;
            d = d + 2 * (y - x) + 1;
        }
    }
}

// Simple 8x8 font bitmap (first 32 chars are space)
// Each char is 8 bytes (8x8 pixels)
// For simplicity, this is a minimal font

// Draw a character at (x, y) - top-left corner
// Returns width of character drawn
int screen_draw_char(int x, int y, char c) {
    // Simple placeholder - draws a 6x8 box for each char
    // A real implementation would have a bitmap font

    int i;
    int j;

    if (c < 32 || c > 126) {
        return 0;
    }

    // Draw character as a simple pattern
    for (j = 0; j < 7; j = j + 1) {
        for (i = 0; i < 5; i = i + 1) {
            // Simple pattern based on char value
            if ((c + i + j) % 3 != 0) {
                screen_draw_pixel(x + i, y + j);
            }
        }
    }

    return 6;  // Character width + spacing
}

// Draw a string at (x, y)
void screen_draw_string(int x, int y, char *s) {
    while (*s != 0) {
        x = x + screen_draw_char(x, y, *s);
        s = s + 1;
    }
}
