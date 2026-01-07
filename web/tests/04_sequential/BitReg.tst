// Test file for BitReg (1-bit register with load enable)
// Only loads new value when load=1

load BitReg

// Initial state
set in 0
set load 0
tick
tock
expect out 0

// Try to load 1 without load enable
set in 1
set load 0
tick
tock
expect out 0

// Load 1 with load enable
set in 1
set load 1
tick
tock
expect out 1

// Hold value (load disabled)
set in 0
set load 0
tick
tock
expect out 1

// Still holding
set in 0
set load 0
tick
tock
expect out 1

// Load 0
set in 0
set load 1
tick
tock
expect out 0

// Load sequence
set in 1
set load 1
tick
tock
expect out 1

set in 0
set load 1
tick
tock
expect out 0

set in 1
set load 1
tick
tock
expect out 1
