// string.c - String manipulation library

// String length
int strlen(char *s) {
    int len = 0;
    while (*s != 0) {
        len = len + 1;
        s = s + 1;
    }
    return len;
}

// String copy
void strcpy(char *dst, char *src) {
    while (*src != 0) {
        *dst = *src;
        dst = dst + 1;
        src = src + 1;
    }
    *dst = 0;
}

// String copy with max length
void strncpy(char *dst, char *src, int n) {
    int i = 0;
    while (i < n && *src != 0) {
        *dst = *src;
        dst = dst + 1;
        src = src + 1;
        i = i + 1;
    }
    while (i < n) {
        *dst = 0;
        dst = dst + 1;
        i = i + 1;
    }
}

// String compare
int strcmp(char *s1, char *s2) {
    while (*s1 != 0 && *s2 != 0) {
        if (*s1 != *s2) {
            return (int)*s1 - (int)*s2;
        }
        s1 = s1 + 1;
        s2 = s2 + 1;
    }
    return (int)*s1 - (int)*s2;
}

// String concatenate
void strcat(char *dst, char *src) {
    while (*dst != 0) {
        dst = dst + 1;
    }
    while (*src != 0) {
        *dst = *src;
        dst = dst + 1;
        src = src + 1;
    }
    *dst = 0;
}

// Find character in string
char *strchr(char *s, char c) {
    while (*s != 0) {
        if (*s == c) {
            return s;
        }
        s = s + 1;
    }
    if (c == 0) {
        return s;
    }
    return (char *)0;
}

// Memory set
void memset(char *dst, char val, int n) {
    while (n > 0) {
        *dst = val;
        dst = dst + 1;
        n = n - 1;
    }
}

// Memory copy
void memcpy(char *dst, char *src, int n) {
    while (n > 0) {
        *dst = *src;
        dst = dst + 1;
        src = src + 1;
        n = n - 1;
    }
}

// Memory compare
int memcmp(char *s1, char *s2, int n) {
    while (n > 0) {
        if (*s1 != *s2) {
            return (int)*s1 - (int)*s2;
        }
        s1 = s1 + 1;
        s2 = s2 + 1;
        n = n - 1;
    }
    return 0;
}

// Parse integer from string
int atoi(char *s) {
    int result = 0;
    int sign = 1;

    // Skip whitespace
    while (*s == ' ' || *s == '\t') {
        s = s + 1;
    }

    // Check sign
    if (*s == '-') {
        sign = 0 - 1;
        s = s + 1;
    } else if (*s == '+') {
        s = s + 1;
    }

    // Parse digits
    while (*s >= '0' && *s <= '9') {
        result = result * 10 + ((int)*s - '0');
        s = s + 1;
    }

    return result * sign;
}
