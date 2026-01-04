// keyboard.c - Keyboard input library
// Memory-mapped keyboard register at 0x00402600

// Keyboard register address
#define KEYBOARD_ADDR  0x00402600

// Special key codes
#define KEY_NONE       0
#define KEY_ENTER      10
#define KEY_BACKSPACE  8
#define KEY_TAB        9
#define KEY_ESCAPE     27
#define KEY_SPACE      32
#define KEY_DELETE     127

// Arrow keys (extended codes)
#define KEY_UP         128
#define KEY_DOWN       129
#define KEY_LEFT       130
#define KEY_RIGHT      131

// Function keys
#define KEY_F1         132
#define KEY_F2         133
#define KEY_F3         134
#define KEY_F4         135
#define KEY_F5         136
#define KEY_F6         137
#define KEY_F7         138
#define KEY_F8         139
#define KEY_F9         140
#define KEY_F10        141
#define KEY_F11        142
#define KEY_F12        143

// Home/End/PageUp/PageDown
#define KEY_HOME       144
#define KEY_END        145
#define KEY_PAGEUP     146
#define KEY_PAGEDOWN   147
#define KEY_INSERT     148

// Read the current key (0 if no key pressed)
int keyboard_read(void) {
    uint *kbd = (uint *)KEYBOARD_ADDR;
    return (int)*kbd;
}

// Check if a key is currently pressed
int keyboard_pressed(void) {
    return keyboard_read() != 0;
}

// Wait for a key press and return it
int keyboard_wait(void) {
    int key;

    // Wait for key to be pressed
    while (1) {
        key = keyboard_read();
        if (key != 0) {
            break;
        }
    }

    // Wait for key to be released (debounce)
    while (keyboard_read() == key) {
        // spin
    }

    return key;
}

// Wait for a key press without waiting for release
int keyboard_get(void) {
    int key;

    while (1) {
        key = keyboard_read();
        if (key != 0) {
            return key;
        }
    }
}

// Check if key is a printable ASCII character
int keyboard_is_printable(int key) {
    return key >= 32 && key <= 126;
}

// Check if key is a letter
int keyboard_is_letter(int key) {
    return (key >= 'A' && key <= 'Z') || (key >= 'a' && key <= 'z');
}

// Check if key is a digit
int keyboard_is_digit(int key) {
    return key >= '0' && key <= '9';
}

// Convert key to uppercase if it's a lowercase letter
int keyboard_to_upper(int key) {
    if (key >= 'a' && key <= 'z') {
        return key - 32;
    }
    return key;
}

// Convert key to lowercase if it's an uppercase letter
int keyboard_to_lower(int key) {
    if (key >= 'A' && key <= 'Z') {
        return key + 32;
    }
    return key;
}

// Read a line of input into buffer (with echo and editing)
// Returns number of characters read (not including null terminator)
int keyboard_readline(char *buf, int max_len) {
    int len;
    int key;

    len = 0;

    while (len < max_len - 1) {
        key = keyboard_wait();

        if (key == KEY_ENTER) {
            // End of input
            putc('\n');
            break;
        } else if (key == KEY_BACKSPACE) {
            // Delete last character
            if (len > 0) {
                len = len - 1;
                putc('\b');
                putc(' ');
                putc('\b');
            }
        } else if (keyboard_is_printable(key)) {
            // Add character to buffer
            buf[len] = (char)key;
            len = len + 1;
            putc(key);
        }
        // Ignore other keys
    }

    buf[len] = 0;
    return len;
}
