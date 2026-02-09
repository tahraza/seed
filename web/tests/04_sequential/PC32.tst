// Test file for PC32 (32-bit Program Counter, increments by 4)

load PC32

set d 0x00000000
set load 0
set inc 0
set reset 1
tick
tock
expect q 0x00000000

set reset 0
set inc 1
tick
tock
expect q 0x00000004

set inc 1
tick
tock
expect q 0x00000008

set inc 1
tick
tock
expect q 0x0000000C

set inc 0
tick
tock
expect q 0x0000000C

set d 0x00001000
set load 1
set inc 0
tick
tock
expect q 0x00001000

set load 0
set inc 1
tick
tock
expect q 0x00001004

set d 0x00002000
set load 1
set inc 1
tick
tock
expect q 0x00002000

set d 0x00003000
set reset 1
set load 1
set inc 1
tick
tock
expect q 0x00000000

set reset 0
set load 0
set inc 1
tick
tock
expect q 0x00000004
