// Test file for RegFile (16-register file)
// Tests 2 independent read ports and 1 write port

load RegFile

// Write to register 0
set we 1
set waddr 0x0
set wdata 0x1111
set raddr1 0x0
set raddr2 0x0
tick
tock
expect rdata1 0x1111
expect rdata2 0x1111

// Write to register 1, verify reg 0 unchanged via raddr1
set waddr 0x1
set wdata 0x2222
set raddr1 0x0
set raddr2 0x1
tick
tock
expect rdata1 0x1111
expect rdata2 0x2222

// Read both registers simultaneously
set we 0
set raddr1 0x1
set raddr2 0x0
tick
tock
expect rdata1 0x2222
expect rdata2 0x1111

// Write to register 15
set we 1
set waddr 0xF
set wdata 0xFFFF
tick
tock

// Read registers 0 and 15 simultaneously
set we 0
set raddr1 0x0
set raddr2 0xF
tick
tock
expect rdata1 0x1111
expect rdata2 0xFFFF

// Write to register 8 (tests upper bank)
set we 1
set waddr 0x8
set wdata 0x8888
tick
tock

// Read from different banks simultaneously
set we 0
set raddr1 0x1
set raddr2 0x8
tick
tock
expect rdata1 0x2222
expect rdata2 0x8888

// Write disabled - value should not change
set we 0
set waddr 0x0
set wdata 0x9999
tick
tock
set raddr1 0x0
tick
tock
expect rdata1 0x1111

// Verify all written values are preserved
set raddr1 0x0
set raddr2 0x1
tick
tock
expect rdata1 0x1111
expect rdata2 0x2222

set raddr1 0x8
set raddr2 0xF
tick
tock
expect rdata1 0x8888
expect rdata2 0xFFFF
