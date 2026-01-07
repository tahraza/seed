// Test file for PC (Program Counter)
// Supports: reset, load, increment
// Priority: reset > load > inc

load PC

// Initial state (reset)
set in 0x0000
set load 0
set inc 0
set reset 1
tick
tock
expect out 0x0000

// Increment
set reset 0
set load 0
set inc 1
tick
tock
expect out 0x0001

// Keep incrementing
set inc 1
tick
tock
expect out 0x0002

set inc 1
tick
tock
expect out 0x0003

// Hold (no operation)
set inc 0
tick
tock
expect out 0x0003

// Load a value
set in 0x1000
set load 1
set inc 0
tick
tock
expect out 0x1000

// Increment from loaded value
set load 0
set inc 1
tick
tock
expect out 0x1001

// Load has priority over inc
set in 0x2000
set load 1
set inc 1
tick
tock
expect out 0x2000

// Reset has priority over all
set in 0x3000
set reset 1
set load 1
set inc 1
tick
tock
expect out 0x0000

// Back to normal increment
set reset 0
set load 0
set inc 1
tick
tock
expect out 0x0001

// Test overflow (wrap around)
set in 0xFFFF
set load 1
set inc 0
tick
tock
expect out 0xFFFF

set load 0
set inc 1
tick
tock
expect out 0x0000
