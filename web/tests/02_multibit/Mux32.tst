// Test file for Mux32 (32-bit 2-way multiplexer)

load Mux32

// sel=0 selects a
set a 0x12345678
set b 0xDEADBEEF
set sel 0
eval
expect y 0x12345678

// sel=1 selects b
set sel 1
eval
expect y 0xDEADBEEF

// All zeros
set a 0x00000000
set b 0xFFFFFFFF
set sel 0
eval
expect y 0x00000000

set sel 1
eval
expect y 0xFFFFFFFF

// Verify upper/lower halves route independently
set a 0xAAAA5555
set b 0x5555AAAA
set sel 0
eval
expect y 0xAAAA5555

set sel 1
eval
expect y 0x5555AAAA
