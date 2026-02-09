// Test file for Not32 (32-bit inverter)

load Not32

set a 0x00000000
eval
expect y 0xFFFFFFFF

set a 0xFFFFFFFF
eval
expect y 0x00000000

set a 0x0000FFFF
eval
expect y 0xFFFF0000

set a 0x12345678
eval
expect y 0xEDCBA987

set a 0xAAAAAAAA
eval
expect y 0x55555555
