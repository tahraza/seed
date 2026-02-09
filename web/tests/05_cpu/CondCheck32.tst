// Test file for CondCheck32 (Full ARM 16-condition checker)

load CondCheck32

// EQ (0000): Z=1
set cond 0b0000
set zero 1
set neg 0
set carry 0
set ovf 0
eval
expect take 1

set zero 0
eval
expect take 0

// NE (0001): Z=0
set cond 0b0001
set zero 0
eval
expect take 1

set zero 1
eval
expect take 0

// CS (0010): C=1
set cond 0b0010
set zero 0
set carry 1
eval
expect take 1

set carry 0
eval
expect take 0

// MI (0100): N=1
set cond 0b0100
set neg 1
set carry 0
eval
expect take 1

set neg 0
eval
expect take 0

// GE (1010): N=V
set cond 0b1010
set neg 0
set ovf 0
eval
expect take 1

set neg 1
set ovf 1
eval
expect take 1

set neg 1
set ovf 0
eval
expect take 0

// LT (1011): N!=V
set cond 0b1011
set neg 1
set ovf 0
eval
expect take 1

set neg 0
set ovf 0
eval
expect take 0

// AL (1110): always
set cond 0b1110
set zero 0
set neg 0
set carry 0
set ovf 0
eval
expect take 1
