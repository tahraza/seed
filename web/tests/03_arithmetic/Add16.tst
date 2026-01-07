// Test file for Add16 (16-bit adder)
// Adds two 16-bit numbers with carry in

load Add16

// 0 + 0 + 0 = 0
set a 0x0000
set b 0x0000
set cin 0
eval
expect sum 0x0000

// 0 + 1 = 1
set a 0x0000
set b 0x0001
set cin 0
eval
expect sum 0x0001

// 1 + 1 = 2
set a 0x0001
set b 0x0001
set cin 0
eval
expect sum 0x0002

// Simple addition
set a 0x0005
set b 0x0003
set cin 0
eval
expect sum 0x0008

// Addition with carry propagation
set a 0x00FF
set b 0x0001
set cin 0
eval
expect sum 0x0100

// Larger numbers
set a 0x1234
set b 0x5678
set cin 0
eval
expect sum 0x68AC

// Max value
set a 0xFFFF
set b 0x0000
set cin 0
eval
expect sum 0xFFFF

// Overflow wraps around
set a 0xFFFF
set b 0x0001
set cin 0
eval
expect sum 0x0000

set a 0xFFFF
set b 0x0002
set cin 0
eval
expect sum 0x0001

// Two large numbers
set a 0x8000
set b 0x8000
set cin 0
eval
expect sum 0x0000

// With carry in
set a 0x0000
set b 0x0000
set cin 1
eval
expect sum 0x0001
