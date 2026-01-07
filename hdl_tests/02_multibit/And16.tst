// Test file for And16 (16-bit AND)
// Bitwise AND of two 16-bit inputs

load And16

// All zeros
set a 0x0000
set b 0x0000
eval
expect y 0x0000

// AND with all ones = identity
set a 0x1234
set b 0xFFFF
eval
expect y 0x1234

// AND with all zeros = zero
set a 0x1234
set b 0x0000
eval
expect y 0x0000

// All ones
set a 0xFFFF
set b 0xFFFF
eval
expect y 0xFFFF

// Alternating patterns
set a 0xAAAA
set b 0x5555
eval
expect y 0x0000

// Same alternating
set a 0xAAAA
set b 0xAAAA
eval
expect y 0xAAAA

// Mask high byte
set a 0x1234
set b 0xFF00
eval
expect y 0x1200

// Mask low byte
set a 0x1234
set b 0x00FF
eval
expect y 0x0034

// Random patterns
set a 0xABCD
set b 0x1357
eval
expect y 0x0345
