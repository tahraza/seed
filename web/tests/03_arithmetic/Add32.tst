// Test file for Add32 (32-bit adder)

load Add32

// Basic addition
set a 0x00000001
set b 0x00000002
set cin 0
eval
expect y 0x00000003
expect cout 0

// Zero + Zero
set a 0x00000000
set b 0x00000000
set cin 0
eval
expect y 0x00000000
expect cout 0

// Carry in
set a 0x00000001
set b 0x00000002
set cin 1
eval
expect y 0x00000004
expect cout 0

// 16-bit boundary carry
set a 0x0000FFFF
set b 0x00000001
set cin 0
eval
expect y 0x00010000
expect cout 0

// 32-bit overflow
set a 0xFFFFFFFF
set b 0x00000001
set cin 0
eval
expect y 0x00000000
expect cout 1

// Large values
set a 0x12345678
set b 0x9ABCDEF0
set cin 0
eval
expect y 0xACF13568
expect cout 0

// Both MSB set
set a 0x80000000
set b 0x80000000
set cin 0
eval
expect y 0x00000000
expect cout 1

// Max value + 0
set a 0xFFFFFFFF
set b 0x00000000
set cin 0
eval
expect y 0xFFFFFFFF
expect cout 0
