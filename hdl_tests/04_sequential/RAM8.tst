// Test file for RAM8 (8-word RAM)
// 8 16-bit registers addressable by 3-bit address

load RAM8

// Write to address 0
set din 0x1111
set addr 0b000
set we 1
tick
tock
expect dout 0x1111

// Write to address 1
set din 0x2222
set addr 0b001
set we 1
tick
tock
expect dout 0x2222

// Write to address 7
set din 0x7777
set addr 0b111
set we 1
tick
tock
expect dout 0x7777

// Read back address 0 (no write)
set we 0
set addr 0b000
tick
tock
expect dout 0x1111

// Read back address 1
set addr 0b001
tick
tock
expect dout 0x2222

// Read back address 7
set addr 0b111
tick
tock
expect dout 0x7777

// Write to all addresses
set we 1
set din 0xAAAA
set addr 0b010
tick
tock
expect dout 0xAAAA

set din 0xBBBB
set addr 0b011
tick
tock
expect dout 0xBBBB

set din 0xCCCC
set addr 0b100
tick
tock
expect dout 0xCCCC

set din 0xDDDD
set addr 0b101
tick
tock
expect dout 0xDDDD

set din 0xEEEE
set addr 0b110
tick
tock
expect dout 0xEEEE

// Verify all values preserved
set we 0
set addr 0b000
tick
tock
expect dout 0x1111

set addr 0b001
tick
tock
expect dout 0x2222

set addr 0b010
tick
tock
expect dout 0xAAAA

set addr 0b011
tick
tock
expect dout 0xBBBB

set addr 0b100
tick
tock
expect dout 0xCCCC

set addr 0b101
tick
tock
expect dout 0xDDDD

set addr 0b110
tick
tock
expect dout 0xEEEE

set addr 0b111
tick
tock
expect dout 0x7777
