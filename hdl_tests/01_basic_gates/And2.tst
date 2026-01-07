// Test file for And2 (AND gate)
// Tests all 4 possible input combinations

load And2

// 0 AND 0 = 0
set a 0
set b 0
eval
expect y 0

// 0 AND 1 = 0
set a 0
set b 1
eval
expect y 0

// 1 AND 0 = 0
set a 1
set b 0
eval
expect y 0

// 1 AND 1 = 1
set a 1
set b 1
eval
expect y 1
