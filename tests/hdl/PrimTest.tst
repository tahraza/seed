load PrimTest tests/hdl/PrimTest.hdl
set a 0b0011
set b 0b0101
set sel 0
set we 0
set addr 0b00
eval
expect y_and 0b0001
expect y_not 0b1100
expect y_mux 0b0011
tick
expect q 0b0011
set a 0b1010
set b 0b0110
set sel 1
set we 1
set addr 0b01
eval
expect y_and 0b0010
expect y_not 0b0101
expect y_mux 0b0110
tick
expect q 0b1010
expect ram_out 0b1010
set we 0
set addr 0b01
set a 0b0000
eval
expect ram_out 0b1010
