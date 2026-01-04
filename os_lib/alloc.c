// alloc.c - Simple memory allocator
// Uses a bump allocator with fixed heap

// Heap configuration
// Heap starts after BSS, grows upward
// Stack starts at top of RAM, grows downward

// Heap management (simple bump allocator)
uint heap_start = 0;
uint heap_ptr = 0;
uint heap_end = 0;

// Initialize the allocator
// call this before using malloc
void alloc_init(uint start, uint size) {
    heap_start = start;
    heap_ptr = start;
    heap_end = start + size;
}

// Allocate n bytes, returns pointer or 0 on failure
// Aligns to 4 bytes
char *malloc(uint size) {
    // Align size to 4 bytes
    size = (size + 3) & (~3);

    if (heap_ptr + size > heap_end) {
        return (char *)0;  // Out of memory
    }

    uint result = heap_ptr;
    heap_ptr = heap_ptr + size;
    return (char *)result;
}

// Free memory (no-op in bump allocator)
void free(char *ptr) {
    // Bump allocator doesn't support free
    // Memory is only reclaimed by resetting the heap
}

// Reset the heap (frees all allocations)
void alloc_reset(void) {
    heap_ptr = heap_start;
}

// Get remaining heap space
uint alloc_remaining(void) {
    return heap_end - heap_ptr;
}

// Allocate and zero memory
char *calloc(uint count, uint size) {
    uint total = count * size;
    char *ptr = malloc(total);
    if (ptr != (char *)0) {
        // Zero the memory
        char *p = ptr;
        while (total > 0) {
            *p = 0;
            p = p + 1;
            total = total - 1;
        }
    }
    return ptr;
}

// Simple linked list allocator (alternative, more complex)
// Header for each block: [size:4][next:4][data...]

uint ll_heap_start = 0;
uint ll_free_list = 0;

void ll_alloc_init(uint start, uint size) {
    ll_heap_start = start;
    ll_free_list = start;

    // Initialize single free block
    uint *block = (uint *)start;
    *block = size - 8;         // size (excluding header)
    *(block + 1) = 0;          // next = null
}

char *ll_malloc(uint size) {
    // Align size to 4 bytes
    size = (size + 3) & (~3);

    uint *prev = (uint *)0;
    uint *curr = (uint *)ll_free_list;

    while (curr != (uint *)0) {
        uint block_size = *curr;
        if (block_size >= size) {
            // Found a suitable block
            if (block_size >= size + 16) {
                // Split the block
                uint *new_block = (uint *)((char *)curr + 8 + size);
                *new_block = block_size - size - 8;
                *(new_block + 1) = *(curr + 1);
                *curr = size;

                if (prev == (uint *)0) {
                    ll_free_list = (uint)new_block;
                } else {
                    *(prev + 1) = (uint)new_block;
                }
            } else {
                // Use entire block
                if (prev == (uint *)0) {
                    ll_free_list = *(curr + 1);
                } else {
                    *(prev + 1) = *(curr + 1);
                }
            }
            return (char *)(curr + 2);
        }
        prev = curr;
        curr = (uint *)*(curr + 1);
    }

    return (char *)0;  // Out of memory
}

void ll_free(char *ptr) {
    if (ptr == (char *)0) {
        return;
    }

    uint *block = (uint *)ptr - 2;
    *(block + 1) = ll_free_list;
    ll_free_list = (uint)block;
}
