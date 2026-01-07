// Test file for Inv (NOT gate)
// Tests all possible inputs for a 1-bit inverter

load Inv

// Test 0 -> 1
set a 0
eval
expect y 1

// Test 1 -> 0
set a 1
eval
expect y 0
