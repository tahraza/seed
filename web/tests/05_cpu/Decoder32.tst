// Test file for Decoder32 (A32-Lite 32-bit instruction decoder)

load Decoder32

// ALU register ADD (class=000, op=0011, S=0) -> 0xE0600000
set instr 0xE0600000
eval
expect alu_op 0b0011
expect alu_src 0
expect reg_write 1
expect mem_read 0
expect mem_write 0
expect branch 0
expect set_flags 0

// ALU register ADDS (class=000, op=0011, S=1) -> 0xE0700000
set instr 0xE0700000
eval
expect set_flags 1
expect reg_write 1

// ALU immediate (class=001, op=0011, S=0) -> 0xE260000A
set instr 0xE260000A
eval
expect alu_op 0b0011
expect alu_src 1
expect reg_write 1
expect set_flags 0

// CMP (class=000, op=0111, S=1) -> 0xE0F00000
set instr 0xE0F00000
eval
expect alu_op 0b0111
expect reg_write 0
expect set_flags 1

// TST (class=000, op=1000, S=1) -> 0xE1100000
set instr 0xE1100000
eval
expect alu_op 0b1000
expect reg_write 0
expect set_flags 1

// LDR (class=010, L=1) -> 0xE5000000
set instr 0xE5000000
eval
expect mem_read 1
expect mem_write 0
expect reg_write 1
expect mem_to_reg 1

// STR (class=010, L=0) -> 0xE4000000
set instr 0xE4000000
eval
expect mem_read 0
expect mem_write 1
expect reg_write 0

// B (class=011) -> 0xE6000000
set instr 0xE6000000
eval
expect branch 1
expect reg_write 0
