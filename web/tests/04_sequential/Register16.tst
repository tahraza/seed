// Test file for Register16 (16-bit register with load enable)
// Only loads new value when load=1

load Register16

// Initial state
set in 0x0000
set load 0
tick
tock
expect out 0x0000

// Try to change without load
set in 0x1234
set load 0
tick
tock
expect out 0x0000

// Load a value
set in 0x1234
set load 1
tick
tock
expect out 0x1234

// Hold value
set in 0x5678
set load 0
tick
tock
expect out 0x1234

// Load new value
set in 0x5678
set load 1
tick
tock
expect out 0x5678

// Load all ones
set in 0xFFFF
set load 1
tick
tock
expect out 0xFFFF

// Load all zeros
set in 0x0000
set load 1
tick
tock
expect out 0x0000

// Alternating pattern
set in 0xAAAA
set load 1
tick
tock
expect out 0xAAAA

// Hold
set in 0x5555
set load 0
tick
tock
expect out 0xAAAA

// Finally load the new pattern
set in 0x5555
set load 1
tick
tock
expect out 0x5555
