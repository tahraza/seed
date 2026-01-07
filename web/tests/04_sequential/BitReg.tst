// Test file for BitReg (1-bit register with load enable)
// Only loads new value when load=1

load BitReg

// Initial state
set d 0
set load 0
tick
tock
expect q 0

// Try to load 1 without load enable
set d 1
set load 0
tick
tock
expect q 0

// Load 1 with load enable
set d 1
set load 1
tick
tock
expect q 1

// Hold value (load disabled)
set d 0
set load 0
tick
tock
expect q 1

// Still holding
set d 0
set load 0
tick
tock
expect q 1

// Load 0
set d 0
set load 1
tick
tock
expect q 0

// Load sequence
set d 1
set load 1
tick
tock
expect q 1

set d 0
set load 1
tick
tock
expect q 0

set d 1
set load 1
tick
tock
expect q 1
