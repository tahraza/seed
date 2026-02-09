// Test file for Mux16Way32 (16-way 32-bit multiplexer)

load Mux16Way32

set r0  0x00000000
set r1  0x11111111
set r2  0x22222222
set r3  0x33333333
set r4  0x44444444
set r5  0x55555555
set r6  0x66666666
set r7  0x77777777
set r8  0x88888888
set r9  0x99999999
set r10 0xAAAAAAAA
set r11 0xBBBBBBBB
set r12 0xCCCCCCCC
set r13 0xDDDDDDDD
set r14 0xEEEEEEEE
set r15 0xFFFFFFFF

set sel 0b0000
eval
expect y 0x00000000

set sel 0b0001
eval
expect y 0x11111111

set sel 0b0111
eval
expect y 0x77777777

set sel 0b1000
eval
expect y 0x88888888

set sel 0b1111
eval
expect y 0xFFFFFFFF

set sel 0b1010
eval
expect y 0xAAAAAAAA
