load Alu32 hdl_lib/arith/Alu32.hdl hdl_lib/gates/Mux2.hdl hdl_lib/gates/And2.hdl hdl_lib/gates/Or2.hdl hdl_lib/gates/Not1.hdl hdl_lib/gates/Nand2.hdl
set a 0x00000001
set b 0x00000002
set op 0b0011
eval
expect y 0x00000003
expect z 0
expect n 0

set a 0x00000005
set b 0x00000001
set op 0b0010
eval
expect y 0x00000004
expect z 0
expect n 0

set a 0xF0F0F0F0
set b 0x0FF00FF0
set op 0b0000
eval
expect y 0x00F000F0
