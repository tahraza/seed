// Test file for ALU (16-bit Arithmetic Logic Unit)
// Operations: op=00: AND, op=01: OR, op=10: ADD, op=11: SUB
// Flags: zero (result is 0), neg (result is negative/MSB set)

load ALU

// ========== AND (op=00) ==========
set a 0x00FF
set b 0x0F0F
set op 0b00
eval
expect y 0x000F
expect zero 0
expect neg 0

set a 0xFFFF
set b 0xFFFF
set op 0b00
eval
expect y 0xFFFF
expect zero 0
expect neg 1

set a 0xAAAA
set b 0x5555
set op 0b00
eval
expect y 0x0000
expect zero 1
expect neg 0

// ========== OR (op=01) ==========
set a 0x00FF
set b 0x0F0F
set op 0b01
eval
expect y 0x0FFF
expect zero 0
expect neg 0

set a 0xAAAA
set b 0x5555
set op 0b01
eval
expect y 0xFFFF
expect zero 0
expect neg 1

set a 0x0000
set b 0x0000
set op 0b01
eval
expect y 0x0000
expect zero 1
expect neg 0

// ========== ADD (op=10) ==========
set a 0x0001
set b 0x0002
set op 0b10
eval
expect y 0x0003
expect zero 0
expect neg 0

set a 0x0000
set b 0x0000
set op 0b10
eval
expect y 0x0000
expect zero 1
expect neg 0

set a 0xFFFF
set b 0x0001
set op 0b10
eval
expect y 0x0000
expect zero 1
expect neg 0

set a 0x7FFF
set b 0x0001
set op 0b10
eval
expect y 0x8000
expect zero 0
expect neg 1

set a 0x1234
set b 0x5678
set op 0b10
eval
expect y 0x68AC
expect zero 0
expect neg 0

// ========== SUB (op=11) ==========
set a 0x0003
set b 0x0001
set op 0b11
eval
expect y 0x0002
expect zero 0
expect neg 0

set a 0x0001
set b 0x0001
set op 0b11
eval
expect y 0x0000
expect zero 1
expect neg 0

set a 0x0001
set b 0x0002
set op 0b11
eval
expect y 0xFFFF
expect zero 0
expect neg 1

set a 0x0000
set b 0x0001
set op 0b11
eval
expect y 0xFFFF
expect zero 0
expect neg 1

set a 0x5678
set b 0x1234
set op 0b11
eval
expect y 0x4444
expect zero 0
expect neg 0

// ========== Edge cases ==========
// Large positive - large positive
set a 0x8000
set b 0x8000
set op 0b11
eval
expect y 0x0000
expect zero 1
expect neg 0

// Test all operations with same inputs
set a 0x1234
set b 0x00FF

set op 0b00
eval
expect y 0x0034

set op 0b01
eval
expect y 0x12FF

set op 0b10
eval
expect y 0x1333

set op 0b11
eval
expect y 0x1135
