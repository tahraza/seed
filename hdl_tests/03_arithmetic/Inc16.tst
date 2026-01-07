// Test file for Inc16 (16-bit incrementer)
// Adds 1 to a 16-bit number

load Inc16

// 0 + 1 = 1
set a 0x0000
eval
expect y 0x0001

// 1 + 1 = 2
set a 0x0001
eval
expect y 0x0002

// Carry propagation
set a 0x00FF
eval
expect y 0x0100

set a 0x0FFF
eval
expect y 0x1000

// Large number
set a 0x1234
eval
expect y 0x1235

// Max value wraps to 0
set a 0xFFFF
eval
expect y 0x0000

// Near max
set a 0xFFFE
eval
expect y 0xFFFF

// Negative number in two's complement
// -1 + 1 = 0
set a 0xFFFF
eval
expect y 0x0000

// -2 + 1 = -1
set a 0xFFFE
eval
expect y 0xFFFF
