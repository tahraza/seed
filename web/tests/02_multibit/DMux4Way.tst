// Test file for DMux4Way (1-to-4 demultiplexer)
// Routes input to one of 4 outputs based on 2-bit selector

load DMux4Way

// x=0: all outputs should be 0
set x 0
set sel 0b00
eval
expect a 0
expect b 0
expect c 0
expect d 0

set sel 0b01
eval
expect a 0
expect b 0
expect c 0
expect d 0

set sel 0b10
eval
expect a 0
expect b 0
expect c 0
expect d 0

set sel 0b11
eval
expect a 0
expect b 0
expect c 0
expect d 0

// x=1: only selected output should be 1
set x 1
set sel 0b00
eval
expect a 1
expect b 0
expect c 0
expect d 0

set sel 0b01
eval
expect a 0
expect b 1
expect c 0
expect d 0

set sel 0b10
eval
expect a 0
expect b 0
expect c 1
expect d 0

set sel 0b11
eval
expect a 0
expect b 0
expect c 0
expect d 1
