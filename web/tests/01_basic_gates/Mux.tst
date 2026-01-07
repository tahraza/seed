// Test file for Mux (2-way 1-bit multiplexer)
// if sel=0 then y=a else y=b
// Tests all 8 possible input combinations

load Mux

// sel=0: output should be a
set a 0
set b 0
set sel 0
eval
expect y 0

set a 0
set b 1
set sel 0
eval
expect y 0

set a 1
set b 0
set sel 0
eval
expect y 1

set a 1
set b 1
set sel 0
eval
expect y 1

// sel=1: output should be b
set a 0
set b 0
set sel 1
eval
expect y 0

set a 0
set b 1
set sel 1
eval
expect y 1

set a 1
set b 0
set sel 1
eval
expect y 0

set a 1
set b 1
set sel 1
eval
expect y 1
