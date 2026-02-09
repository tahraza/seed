// Test file for And32 (32-bit AND gate)

load And32

set a 0xFFFFFFFF
set b 0xFFFFFFFF
eval
expect y 0xFFFFFFFF

set a 0xFFFFFFFF
set b 0x00000000
eval
expect y 0x00000000

set a 0x0000FFFF
set b 0x00FF00FF
eval
expect y 0x000000FF

set a 0xAAAAAAAA
set b 0x55555555
eval
expect y 0x00000000

set a 0x12345678
set b 0xFF00FF00
eval
expect y 0x12005600
