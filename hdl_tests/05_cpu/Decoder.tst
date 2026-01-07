// Test file for Decoder (Instruction Decoder)
// Decodes instruction fields for CPU control

load Decoder

// Test R-type instruction (ADD R1, R2, R3)
// Format: [cond:4][op:4][rd:4][rn:4][rm:4][shift:12]
set instr 0xE0812003
eval
expect rd 0x1
expect rn 0x2
expect rm 0x3
expect imm_flag 0

// Test I-type instruction (MOV R0, #0xFF)
set instr 0xE3A000FF
eval
expect rd 0x0
expect imm_flag 1

// Test Load instruction (LDR R4, [R5])
set instr 0xE5954000
eval
expect rd 0x4
expect rn 0x5
expect mem_read 1
expect mem_write 0

// Test Store instruction (STR R6, [R7])
set instr 0xE5876000
eval
expect rd 0x6
expect rn 0x7
expect mem_read 0
expect mem_write 1

// Test Branch instruction (B label)
set instr 0xEA000010
eval
expect branch 1

// Test conditional instruction (BNE)
set instr 0x1A000005
eval
expect cond 0x1
expect branch 1
