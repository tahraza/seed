// Test file for Control (Control Unit)
// Combines Decoder and CondCheck to generate control signals

load Control

// ALU ADD instruction (opcode=0x0)
set opcode 0x0
set cond 0x0
set zero 0
set neg 0
tick
tock
expect alu_op 0b00
expect reg_write 1
expect mem_read 0
expect mem_write 0
expect pc_src 0

// ALU SUB instruction (opcode=0x1)
set opcode 0x1
tick
tock
expect alu_op 0b01
expect reg_write 1
expect mem_read 0
expect mem_write 0
expect pc_src 0

// ALU AND instruction (opcode=0x2)
set opcode 0x2
tick
tock
expect alu_op 0b10
expect reg_write 1

// ALU OR instruction (opcode=0x3)
set opcode 0x3
tick
tock
expect alu_op 0b11
expect reg_write 1

// LOAD instruction (opcode=0x4)
set opcode 0x4
tick
tock
expect mem_read 1
expect mem_write 0

// STORE instruction (opcode=0x5)
set opcode 0x5
tick
tock
expect mem_write 1

// BRANCH instruction with condition EQ, zero=1 (take branch)
set opcode 0x8
set cond 0x0
set zero 1
tick
tock
expect pc_src 1
expect reg_write 0

// BRANCH instruction with condition EQ, zero=0 (don't take)
set zero 0
tick
tock
expect pc_src 0

// BRANCH instruction with condition NE, zero=0 (take branch)
set cond 0x1
set zero 0
tick
tock
expect pc_src 1

// BRANCH instruction with condition LT, neg=1 (take branch)
set cond 0x2
set neg 1
tick
tock
expect pc_src 1
