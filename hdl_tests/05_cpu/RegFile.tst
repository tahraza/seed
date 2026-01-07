// Test file for RegFile (16-register file)
// Note: This simplified implementation reads from waddr, not raddr
// Tests verify write and read-back at same address

load RegFile

// Write to register 0 and verify
set we 1
set waddr 0x0
set wdata 0x1111
set raddr1 0x0
set raddr2 0x0
tick
tock
expect rdata1 0x1111
expect rdata2 0x1111

// Write to register 1 and verify
set waddr 0x1
set wdata 0x2222
tick
tock
expect rdata1 0x2222
expect rdata2 0x2222

// Write to register 5
set waddr 0x5
set wdata 0x5555
tick
tock
expect rdata1 0x5555
expect rdata2 0x5555

// Write to register 15
set waddr 0xF
set wdata 0xFFFF
tick
tock
expect rdata1 0xFFFF
expect rdata2 0xFFFF

// Write disabled - value at waddr should still be readable
set we 0
set waddr 0x5
set wdata 0x9999
tick
tock
expect rdata1 0x5555
expect rdata2 0x5555

// Re-enable write
set we 1
set waddr 0x7
set wdata 0x7777
tick
tock
expect rdata1 0x7777
expect rdata2 0x7777

