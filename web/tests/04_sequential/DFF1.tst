// Test file for DFF1 (D Flip-Flop)
// Output follows input on clock edge

load DFF1

// Initial state (after reset)
set d 0
tick
tock
expect q 0

// Set to 1
set d 1
tick
tock
expect q 1

// Hold 1
set d 1
tick
tock
expect q 1

// Set back to 0
set d 0
tick
tock
expect q 0

// Verify data only changes on clock edge
set d 1
// Before clock, output should still be 0
tick
// Rising edge captures d=1
tock
expect q 1

// Change input but don't clock
set d 0
// Output should still be 1 (no clock yet)
expect q 1
tick
tock
expect q 0
