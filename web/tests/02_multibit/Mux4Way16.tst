// Test file for Mux4Way16 (4-way 16-bit multiplexer)
// sel=00: y=a, sel=01: y=b, sel=10: y=c, sel=11: y=d

load Mux4Way16

// Set up distinct values for each input
set a 0x1111
set b 0x2222
set c 0x3333
set d 0x4444

// Select a (sel=00)
set sel 0b00
eval
expect y 0x1111

// Select b (sel=01)
set sel 0b01
eval
expect y 0x2222

// Select c (sel=10)
set sel 0b10
eval
expect y 0x3333

// Select d (sel=11)
set sel 0b11
eval
expect y 0x4444

// Test with different values
set a 0x0000
set b 0xFFFF
set c 0xAAAA
set d 0x5555

set sel 0b00
eval
expect y 0x0000

set sel 0b01
eval
expect y 0xFFFF

set sel 0b10
eval
expect y 0xAAAA

set sel 0b11
eval
expect y 0x5555
