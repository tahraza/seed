// Test file for ALU32 (32-bit ALU)
// ops: 0000=AND, 0001=EOR, 0010=SUB, 0011=ADD
//      0100=ORR, 0101=MOV, 0110=MVN, 0111=CMP, 1000=TST
// Flags: N (negative), Z (zero), C (carry), V (overflow)

load ALU32

// ========== AND (op=0000) ==========
set a 0x0000FFFF
set b 0x00FF00FF
set op 0b0000
eval
expect y 0x000000FF
expect n_flag 0
expect z_flag 0
expect c_flag 0
expect v_flag 0

set a 0xFFFFFFFF
set b 0xFFFFFFFF
set op 0b0000
eval
expect y 0xFFFFFFFF
expect n_flag 1
expect z_flag 0
expect c_flag 0
expect v_flag 0

set a 0xAAAAAAAA
set b 0x55555555
set op 0b0000
eval
expect y 0x00000000
expect n_flag 0
expect z_flag 1
expect c_flag 0
expect v_flag 0

// ========== EOR (op=0001) ==========
set a 0xFF00FF00
set b 0x0F0F0F0F
set op 0b0001
eval
expect y 0xF00FF00F
expect n_flag 1
expect z_flag 0
expect c_flag 0
expect v_flag 0

set a 0x12345678
set b 0x12345678
set op 0b0001
eval
expect y 0x00000000
expect n_flag 0
expect z_flag 1
expect c_flag 0
expect v_flag 0

// ========== SUB (op=0010) ==========
set a 0x00000005
set b 0x00000003
set op 0b0010
eval
expect y 0x00000002
expect n_flag 0
expect z_flag 0
expect c_flag 1
expect v_flag 0

set a 0x00000001
set b 0x00000002
set op 0b0010
eval
expect y 0xFFFFFFFF
expect n_flag 1
expect z_flag 0
expect c_flag 0
expect v_flag 0

// SUB overflow: 0x80000000 - 1 = 0x7FFFFFFF (overflow!)
set a 0x80000000
set b 0x00000001
set op 0b0010
eval
expect y 0x7FFFFFFF
expect n_flag 0
expect z_flag 0
expect c_flag 1
expect v_flag 1

// ========== ADD (op=0011) ==========
set a 0x00000001
set b 0x00000002
set op 0b0011
eval
expect y 0x00000003
expect n_flag 0
expect z_flag 0
expect c_flag 0
expect v_flag 0

set a 0xFFFFFFFF
set b 0x00000001
set op 0b0011
eval
expect y 0x00000000
expect n_flag 0
expect z_flag 1
expect c_flag 1
expect v_flag 0

// ADD overflow: 0x7FFFFFFF + 1 = 0x80000000 (overflow!)
set a 0x7FFFFFFF
set b 0x00000001
set op 0b0011
eval
expect y 0x80000000
expect n_flag 1
expect z_flag 0
expect c_flag 0
expect v_flag 1

// ========== ORR (op=0100) ==========
set a 0x00FF0000
set b 0x000000FF
set op 0b0100
eval
expect y 0x00FF00FF
expect n_flag 0
expect z_flag 0
expect c_flag 0
expect v_flag 0

set a 0x00000000
set b 0x00000000
set op 0b0100
eval
expect y 0x00000000
expect n_flag 0
expect z_flag 1
expect c_flag 0
expect v_flag 0

// ========== MOV (op=0101) ==========
set a 0xDEADBEEF
set b 0x12345678
set op 0b0101
eval
expect y 0x12345678
expect n_flag 0
expect z_flag 0
expect c_flag 0
expect v_flag 0

set a 0x00000000
set b 0x80000000
set op 0b0101
eval
expect y 0x80000000
expect n_flag 1
expect z_flag 0
expect c_flag 0
expect v_flag 0

// ========== MVN (op=0110) ==========
set a 0x00000000
set b 0x00000000
set op 0b0110
eval
expect y 0xFFFFFFFF
expect n_flag 1
expect z_flag 0
expect c_flag 0
expect v_flag 0

set a 0x00000000
set b 0xFFFFFFFF
set op 0b0110
eval
expect y 0x00000000
expect n_flag 0
expect z_flag 1
expect c_flag 0
expect v_flag 0

// ========== CMP (op=0111) ==========
set a 0x00000005
set b 0x00000005
set op 0b0111
eval
expect y 0x00000000
expect n_flag 0
expect z_flag 1
expect c_flag 1
expect v_flag 0

set a 0x00000001
set b 0x00000005
set op 0b0111
eval
expect y 0xFFFFFFFC
expect n_flag 1
expect z_flag 0
expect c_flag 0
expect v_flag 0

// ========== TST (op=1000) ==========
set a 0xFF00FF00
set b 0x00FF00FF
set op 0b1000
eval
expect y 0x00000000
expect n_flag 0
expect z_flag 1
expect c_flag 0
expect v_flag 0

set a 0xFF00FF00
set b 0xFF000000
set op 0b1000
eval
expect y 0xFF000000
expect n_flag 1
expect z_flag 0
expect c_flag 0
expect v_flag 0
