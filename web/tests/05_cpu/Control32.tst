// Test file for Control32 (A32-Lite 32-bit control unit)

load Control32

// ADD always (cond=AL=1110)
set instr 0xE0600000
set zero 0
set neg 0
set carry 0
set ovf 0
eval
expect alu_op 0b0011
expect reg_write 1
expect mem_read 0
expect mem_write 0
expect branch 0

// ADD with cond=EQ, zero=0 (don't execute)
set instr 0x00600000
set zero 0
eval
expect reg_write 0

// ADD with cond=EQ, zero=1 (execute)
set instr 0x00600000
set zero 1
eval
expect reg_write 1

// LDR always
set instr 0xE5000000
set zero 0
eval
expect mem_read 1
expect reg_write 1

// Branch always
set instr 0xE6000000
eval
expect branch 1
