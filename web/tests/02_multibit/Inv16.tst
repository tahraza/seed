// Test file for Inv16 (16-bit NOT)
// Inverts all 16 bits

load Inv16

// All zeros -> all ones
set a 0x0000
eval
expect y 0xFFFF

// All ones -> all zeros
set a 0xFFFF
eval
expect y 0x0000

// Alternating pattern 1010...
set a 0xAAAA
eval
expect y 0x5555

// Alternating pattern 0101...
set a 0x5555
eval
expect y 0xAAAA

// High byte only
set a 0xFF00
eval
expect y 0x00FF

// Low byte only
set a 0x00FF
eval
expect y 0xFF00

// Single bit patterns
set a 0x0001
eval
expect y 0xFFFE

set a 0x8000
eval
expect y 0x7FFF

// Random pattern
set a 0x1234
eval
expect y 0xEDCB
