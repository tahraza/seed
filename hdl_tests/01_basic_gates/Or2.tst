// Test file for Or2 (OR gate)
// Tests all 4 possible input combinations

load Or2

// 0 OR 0 = 0
set a 0
set b 0
eval
expect y 0

// 0 OR 1 = 1
set a 0
set b 1
eval
expect y 1

// 1 OR 0 = 1
set a 1
set b 0
eval
expect y 1

// 1 OR 1 = 1
set a 1
set b 1
eval
expect y 1
