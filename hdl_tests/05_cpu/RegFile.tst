// Test file for RegFile (16-register file)
// 2 read ports, 1 write port

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

// Write to register 1, read from both
set waddr 0x1
set wdata 0x2222
tick
tock
expect rdata1 0x1111
expect rdata2 0x1111

// Read register 1
set raddr1 0x1
tick
tock
expect rdata1 0x2222

// Write to register 15
set waddr 0xF
set wdata 0xFFFF
tick
tock

// Read both ports from different registers
set raddr1 0x0
set raddr2 0xF
tick
tock
expect rdata1 0x1111
expect rdata2 0xFFFF

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

// Re-enable write
set we 1
set waddr 0x5
set wdata 0x5555
tick
tock
set raddr1 0x5
tick
tock
expect rdata1 0x5555

// Simultaneous different reads
set raddr1 0x0
set raddr2 0x5
tick
tock
expect rdata1 0x1111
expect rdata2 0x5555
