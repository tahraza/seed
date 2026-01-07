// Test file for Decoder (Instruction Decoder)
// Decodes 4-bit opcode into control signals

load Decoder

// Opcode 0x0: ALU ADD
set opcode 0x0
eval
expect alu_op 0b00
expect reg_write 1
expect mem_read 0
expect mem_write 0
expect branch 0

// Opcode 0x1: ALU SUB
set opcode 0x1
eval
expect alu_op 0b01
expect reg_write 1
expect mem_read 0
expect mem_write 0
expect branch 0

// Opcode 0x2: ALU AND
set opcode 0x2
eval
expect alu_op 0b10
expect reg_write 1
expect mem_read 0
expect mem_write 0
expect branch 0

// Opcode 0x3: ALU OR
set opcode 0x3
eval
expect alu_op 0b11
expect reg_write 1
expect mem_read 0
expect mem_write 0
expect branch 0

// Opcode 0x4: LOAD
set opcode 0x4
eval
expect reg_write 1
expect mem_read 1
expect mem_write 0
expect branch 0

// Opcode 0x5: STORE
set opcode 0x5
eval
expect reg_write 0
expect mem_read 0
expect mem_write 1
expect branch 0

// Opcode 0x6: BRANCH
set opcode 0x6
eval
expect reg_write 0
expect mem_read 0
expect mem_write 0
expect branch 1
