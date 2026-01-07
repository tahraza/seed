// Test file for RAM64 (64-word RAM)
// 64 16-bit words addressable by 6-bit address

load RAM64

// Write to address 0
set din 0x1111
set addr 0b000000
set we 1
tick
tock
expect dout 0x1111

// Write to address 1
set din 0x2222
set addr 0b000001
tick
tock
expect dout 0x2222

// Write to address 8 (second RAM8 block)
set din 0x8888
set addr 0b001000
tick
tock
expect dout 0x8888

// Write to address 63
set din 0xFFFF
set addr 0b111111
tick
tock
expect dout 0xFFFF

// Read back address 0 (no write)
set we 0
set addr 0b000000
tick
tock
expect dout 0x1111

// Read back address 1
set addr 0b000001
tick
tock
expect dout 0x2222

// Read back address 8
set addr 0b001000
tick
tock
expect dout 0x8888

// Read back address 63
set addr 0b111111
tick
tock
expect dout 0xFFFF

// Write to different blocks
set we 1
set din 0xAAAA
set addr 0b010000
tick
tock
expect dout 0xAAAA

set din 0xBBBB
set addr 0b011000
tick
tock
expect dout 0xBBBB

set din 0xCCCC
set addr 0b100000
tick
tock
expect dout 0xCCCC

// Verify previous writes preserved
set we 0
set addr 0b000000
tick
tock
expect dout 0x1111

set addr 0b010000
tick
tock
expect dout 0xAAAA

set addr 0b100000
tick
tock
expect dout 0xCCCC
