// Test file for RAM8 (8-word RAM)
// 8 16-bit registers addressable by 3-bit address

load RAM8

// Write to address 0
set in 0x1111
set address 0b000
set load 1
tick
tock
expect out 0x1111

// Write to address 1
set in 0x2222
set address 0b001
set load 1
tick
tock
expect out 0x2222

// Write to address 7
set in 0x7777
set address 0b111
set load 1
tick
tock
expect out 0x7777

// Read back address 0 (no write)
set load 0
set address 0b000
tick
tock
expect out 0x1111

// Read back address 1
set address 0b001
tick
tock
expect out 0x2222

// Read back address 7
set address 0b111
tick
tock
expect out 0x7777

// Write to all addresses
set load 1
set in 0xAAAA
set address 0b010
tick
tock
expect out 0xAAAA

set in 0xBBBB
set address 0b011
tick
tock
expect out 0xBBBB

set in 0xCCCC
set address 0b100
tick
tock
expect out 0xCCCC

set in 0xDDDD
set address 0b101
tick
tock
expect out 0xDDDD

set in 0xEEEE
set address 0b110
tick
tock
expect out 0xEEEE

// Verify all values preserved
set load 0
set address 0b000
tick
tock
expect out 0x1111

set address 0b001
tick
tock
expect out 0x2222

set address 0b010
tick
tock
expect out 0xAAAA

set address 0b011
tick
tock
expect out 0xBBBB

set address 0b100
tick
tock
expect out 0xCCCC

set address 0b101
tick
tock
expect out 0xDDDD

set address 0b110
tick
tock
expect out 0xEEEE

set address 0b111
tick
tock
expect out 0x7777
