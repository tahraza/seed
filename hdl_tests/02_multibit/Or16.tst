// Test file for Or16 (16-bit OR)
// Bitwise OR of two 16-bit inputs

load Or16

// All zeros
set a 0x0000
set b 0x0000
eval
expect y 0x0000

// OR with all zeros = identity
set a 0x1234
set b 0x0000
eval
expect y 0x1234

// OR with all ones = all ones
set a 0x1234
set b 0xFFFF
eval
expect y 0xFFFF

// All ones
set a 0xFFFF
set b 0xFFFF
eval
expect y 0xFFFF

// Alternating patterns combine
set a 0xAAAA
set b 0x5555
eval
expect y 0xFFFF

// Same alternating
set a 0xAAAA
set b 0xAAAA
eval
expect y 0xAAAA

// Combine bytes
set a 0xFF00
set b 0x00FF
eval
expect y 0xFFFF

// Random patterns
set a 0xABCD
set b 0x1357
eval
expect y 0xBBDF
