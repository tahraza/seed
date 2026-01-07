// Test file for CondCheck (Condition Checker)
// Checks ALU flags against condition codes
// cond: 0000=EQ (zero), 0001=NE (!zero), 0010=LT (neg), 0011=GE (!neg)

load CondCheck

// Test EQ condition (cond=0000): take if zero=1
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

// Test NE condition (cond=0001): take if zero=0
set cond 0b0001
set zero 0
eval
expect take 1

set zero 1
eval
expect take 0

// Test LT condition (cond=0010): take if neg=1
set cond 0b0010
set zero 0
set neg 1
eval
expect take 1

set neg 0
eval
expect take 0

// Test GE condition (cond=0011): take if neg=0
set cond 0b0011
set neg 0
eval
expect take 1

set neg 1
eval
expect take 0

// Test with different flag combinations
set cond 0b0000
set zero 1
set neg 1
eval
expect take 1

set cond 0b0010
set zero 1
set neg 1
eval
expect take 1
