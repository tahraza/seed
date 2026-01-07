// Test file for FullAdder
// Adds three 1-bit numbers (a + b + c), outputs sum and carry

load FullAdder

// 0 + 0 + 0 = 0, carry = 0
set a 0
set b 0
set c 0
eval
expect sum 0
expect carry 0

// 0 + 0 + 1 = 1, carry = 0
set a 0
set b 0
set c 1
eval
expect sum 1
expect carry 0

// 0 + 1 + 0 = 1, carry = 0
set a 0
set b 1
set c 0
eval
expect sum 1
expect carry 0

// 0 + 1 + 1 = 0, carry = 1 (10 in binary)
set a 0
set b 1
set c 1
eval
expect sum 0
expect carry 1

// 1 + 0 + 0 = 1, carry = 0
set a 1
set b 0
set c 0
eval
expect sum 1
expect carry 0

// 1 + 0 + 1 = 0, carry = 1
set a 1
set b 0
set c 1
eval
expect sum 0
expect carry 1

// 1 + 1 + 0 = 0, carry = 1
set a 1
set b 1
set c 0
eval
expect sum 0
expect carry 1

// 1 + 1 + 1 = 1, carry = 1 (11 in binary)
set a 1
set b 1
set c 1
eval
expect sum 1
expect carry 1
