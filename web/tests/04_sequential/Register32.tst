// Test file for Register32 (32-bit register with load enable)

load Register32

set d 0x00000000
set load 0
tick
tock
expect q 0x00000000

set d 0x12345678
set load 0
tick
tock
expect q 0x00000000

set d 0x12345678
set load 1
tick
tock
expect q 0x12345678

set d 0xABCDEF01
set load 0
tick
tock
expect q 0x12345678

set d 0xABCDEF01
set load 1
tick
tock
expect q 0xABCDEF01

set d 0xFFFFFFFF
set load 1
tick
tock
expect q 0xFFFFFFFF

set d 0x00000000
set load 1
tick
tock
expect q 0x00000000
