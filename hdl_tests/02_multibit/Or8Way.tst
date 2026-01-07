// Test file for Or8Way (8-input OR)
// Output is 1 if any of the 8 input bits is 1

load Or8Way

// All zeros
set in 0x00
eval
expect out 0

// All ones
set in 0xFF
eval
expect out 1

// Single bit set (each position)
set in 0x01
eval
expect out 1

set in 0x02
eval
expect out 1

set in 0x04
eval
expect out 1

set in 0x08
eval
expect out 1

set in 0x10
eval
expect out 1

set in 0x20
eval
expect out 1

set in 0x40
eval
expect out 1

set in 0x80
eval
expect out 1

// Multiple bits
set in 0xAA
eval
expect out 1

set in 0x55
eval
expect out 1
