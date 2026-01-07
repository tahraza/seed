// Test file for Decoder (Instruction Decoder)
// Decodes 4-bit opcode into control signals
// Opcodes: 00xx=ALU, 0100=LOAD, 0101=STORE, 1xxx=BRANCH

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

// Opcode 0x4: LOAD (mem_read=1, but reg_write controlled by is_alu)
set opcode 0x4
eval
expect reg_write 0
expect mem_read 1
expect mem_write 0
expect branch 0

// Opcode 0x5: STORE (is_load also true due to op2=1)
set opcode 0x5
eval
expect reg_write 0
expect mem_read 1
expect mem_write 1
expect branch 0

// Opcode 0x8: BRANCH (op3=1)
set opcode 0x8
eval
expect reg_write 0
expect mem_read 0
expect mem_write 0
expect branch 1

// Opcode 0x9: BRANCH variant
set opcode 0x9
eval
expect reg_write 0
expect mem_read 0
expect mem_write 0
expect branch 1

