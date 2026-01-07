// Test file for Register16 (16-bit register with load enable)
// Only loads new value when load=1

load Register16

// Initial state
set d 0x0000
set load 0
tick
tock
expect q 0x0000

// Try to change without load
set d 0x1234
set load 0
tick
tock
expect q 0x0000

// Load a value
set d 0x1234
set load 1
tick
tock
expect q 0x1234

// Hold value
set d 0x5678
set load 0
tick
tock
expect q 0x1234

// Load new value
set d 0x5678
set load 1
tick
tock
expect q 0x5678

// Load all ones
set d 0xFFFF
set load 1
tick
tock
expect q 0xFFFF

// Load all zeros
set d 0x0000
set load 1
tick
tock
expect q 0x0000

// Alternating pattern
set d 0xAAAA
set load 1
tick
tock
expect q 0xAAAA

// Hold
set d 0x5555
set load 0
tick
tock
expect q 0xAAAA

// Finally load the new pattern
set d 0x5555
set load 1
tick
tock
expect q 0x5555
