// Test file for RegFile32 (16x32-bit register file)

load RegFile32

set we 1
set waddr 0x0
set wdata 0x11111111
set raddr1 0x0
set raddr2 0x0
tick
tock
expect rdata1 0x11111111
expect rdata2 0x11111111

set waddr 0x1
set wdata 0x22222222
set raddr1 0x0
set raddr2 0x1
tick
tock
expect rdata1 0x11111111
expect rdata2 0x22222222

set we 0
set raddr1 0x1
set raddr2 0x0
tick
tock
expect rdata1 0x22222222
expect rdata2 0x11111111

set we 1
set waddr 0xF
set wdata 0xFFFFFFFF
tick
tock

set we 0
set raddr1 0x0
set raddr2 0xF
tick
tock
expect rdata1 0x11111111
expect rdata2 0xFFFFFFFF

set we 1
set waddr 0x8
set wdata 0x88888888
tick
tock

set we 0
set raddr1 0x1
set raddr2 0x8
tick
tock
expect rdata1 0x22222222
expect rdata2 0x88888888

set we 0
set waddr 0x0
set wdata 0x99999999
tick
tock
set raddr1 0x0
tick
tock
expect rdata1 0x11111111
