// Test file for DMux (1-to-2 demultiplexer)
// if sel=0 then {a=in, b=0} else {a=0, b=in}
// Tests all 4 possible input combinations

load DMux

// sel=0: input goes to a, b=0
set in 0
set sel 0
eval
expect a 0
expect b 0

set in 1
set sel 0
eval
expect a 1
expect b 0

// sel=1: input goes to b, a=0
set in 0
set sel 1
eval
expect a 0
expect b 0

set in 1
set sel 1
eval
expect a 0
expect b 1
