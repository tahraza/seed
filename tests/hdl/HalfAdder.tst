load HalfAdder tests/hdl/HalfAdder.hdl
set a 0
set b 0
eval
expect sum 0
expect carry 0
set a 1
set b 0
eval
expect sum 1
expect carry 0
set a 0
set b 1
eval
expect sum 1
expect carry 0
set a 1
set b 1
eval
expect sum 0
expect carry 1
