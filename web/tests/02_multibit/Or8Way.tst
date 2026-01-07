// Test file for Or8Way (8-input OR)
// Output is 1 if any of the 8 input bits is 1

load Or8Way

// All zeros
set a 0x00
eval
expect y 0

// All ones
set a 0xFF
eval
expect y 1

// Single bit set (each position)
set a 0x01
eval
expect y 1

set a 0x02
eval
expect y 1

set a 0x04
eval
expect y 1

set a 0x08
eval
expect y 1

set a 0x10
eval
expect y 1

set a 0x20
eval
expect y 1

set a 0x40
eval
expect y 1

set a 0x80
eval
expect y 1

// Multiple bits
set a 0xAA
eval
expect y 1

set a 0x55
eval
expect y 1
