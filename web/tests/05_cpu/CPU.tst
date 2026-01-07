// Test file for CPU (A32-Lite CPU)
// Simple 16-bit RISC processor
// Instruction format: [15:12]=opcode, [11:8]=rd, [7:4]=rs1, [3:0]=rs2

load CPU

// Reset the CPU
set reset 1
set instr 0x0000
set mem_in 0x0000
tick
tock
expect pc_out 0x0000

// Release reset - PC should start incrementing
set reset 0
tick
tock

// Execute ADD r1, r0, r0 (0x0100: opcode=0, rd=1, rs1=0, rs2=0)
// This should write r0+r0=0 into r1
set instr 0x0100
tick
tock

// Execute ADD r2, r1, r1 (0x0211: opcode=0, rd=2, rs1=1, rs2=1)
set instr 0x0211
tick
tock

// Test LOAD instruction - opcode 0x4
// LOAD r3, [r0] (0x4300: load from address in r0 to r3)
set instr 0x4300
set mem_in 0x1234
tick
tock

// Test STORE instruction - opcode 0x5
// STORE r3, [r0] (0x5030: store r3 to address in r0)
set instr 0x5030
tick
tock
expect mem_we 1

// Test that mem_we is cleared after non-store instruction
set instr 0x0000
tick
tock
expect mem_we 0

// Test SUB instruction
// SUB r4, r2, r1 (0x1421: opcode=1, rd=4, rs1=2, rs2=1)
set instr 0x1421
tick
tock

// Test AND instruction
// AND r5, r3, r2 (0x2532: opcode=2, rd=5, rs1=3, rs2=2)
set instr 0x2532
tick
tock

// Test OR instruction
// OR r6, r4, r3 (0x3643: opcode=3, rd=6, rs1=4, rs2=3)
set instr 0x3643
tick
tock
