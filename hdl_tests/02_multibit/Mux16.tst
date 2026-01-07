// Test file for Mux16 (16-bit 2-way multiplexer)
// if sel=0 then y=a else y=b

load Mux16

// sel=0: output a
set a 0x0000
set b 0xFFFF
set sel 0
eval
expect y 0x0000

set a 0x1234
set b 0x5678
set sel 0
eval
expect y 0x1234

set a 0xAAAA
set b 0x5555
set sel 0
eval
expect y 0xAAAA

// sel=1: output b
set a 0x0000
set b 0xFFFF
set sel 1
eval
expect y 0xFFFF

set a 0x1234
set b 0x5678
set sel 1
eval
expect y 0x5678

set a 0xAAAA
set b 0x5555
set sel 1
eval
expect y 0x5555

// Edge cases
set a 0xFFFF
set b 0xFFFF
set sel 0
eval
expect y 0xFFFF

set a 0x0000
set b 0x0000
set sel 1
eval
expect y 0x0000
