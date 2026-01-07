// Test file for Xor2 (XOR gate)
// Tests all 4 possible input combinations

load Xor2

// 0 XOR 0 = 0
set a 0
set b 0
eval
expect y 0

// 0 XOR 1 = 1
set a 0
set b 1
eval
expect y 1

// 1 XOR 0 = 1
set a 1
set b 0
eval
expect y 1

// 1 XOR 1 = 0
set a 1
set b 1
eval
expect y 0
