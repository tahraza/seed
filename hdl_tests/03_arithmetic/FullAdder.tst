// Test file for FullAdder
// Adds three 1-bit numbers (a + b + cin), outputs sum and cout

load FullAdder

// 0 + 0 + 0 = 0, cout = 0
set a 0
set b 0
set cin 0
eval
expect sum 0
expect cout 0

// 0 + 0 + 1 = 1, cout = 0
set a 0
set b 0
set cin 1
eval
expect sum 1
expect cout 0

// 0 + 1 + 0 = 1, cout = 0
set a 0
set b 1
set cin 0
eval
expect sum 1
expect cout 0

// 0 + 1 + 1 = 0, cout = 1 (10 in binary)
set a 0
set b 1
set cin 1
eval
expect sum 0
expect cout 1

// 1 + 0 + 0 = 1, cout = 0
set a 1
set b 0
set cin 0
eval
expect sum 1
expect cout 0

// 1 + 0 + 1 = 0, cout = 1
set a 1
set b 0
set cin 1
eval
expect sum 0
expect cout 1

// 1 + 1 + 0 = 0, cout = 1
set a 1
set b 1
set cin 0
eval
expect sum 0
expect cout 1

// 1 + 1 + 1 = 1, cout = 1 (11 in binary)
set a 1
set b 1
set cin 1
eval
expect sum 1
expect cout 1
