# nand2tetris-codex

Current specs and decisions captured so far for a web interactive nand2tetris-like
platform with a VHDL-like HDL, an ARM-inspired 32-bit CPU, and a C-like language.

## 1. HDL (VHDL-like, sync-only)

Status: validated.

### 1.1 Scope and constraints
- Syntax style: similar to VHDL.
- Sequential logic only via `process(clk)` and `if rising_edge(clk) then ... end if;`
- Combinational logic via concurrent signal assignments and component wiring.
- No `wait`, `after`, or `generate`.
- No local variables; only `signal`.
- Types: `bit`, `bits(N-1 downto 0)`.
- Operators: `and`, `or`, `xor`, `not`, `+`, `-`, `<<`, `>>`, `&` (concat).

### 1.2 Lexical rules
- Comments: `--` to end of line.
- Identifiers: `[A-Za-z_][A-Za-z0-9_]*`
- Integer literals: decimal (`42`), hex (`0x2A`), binary (`0b101010`), optional sign.
- Bit literal: `'0'` or `'1'`.
- Bit-vector literal: `b"0101"` or `x"2A"` (width from digits).

Keywords are case-insensitive. Identifiers are case-sensitive.

### 1.3 Grammar (EBNF)
```
design          := { entity_decl architecture_decl } ;

entity_decl     := "entity" ident "is" port_clause "end" "entity" [ident] ";" ;
port_clause     := "port" "(" port_item { ";" port_item } ")" ";" ;
port_item       := ident_list ":" direction type ;
direction       := "in" | "out" ;
ident_list      := ident { "," ident } ;

architecture_decl := "architecture" ident "of" ident "is"
                    { signal_decl | component_decl }
                    "begin"
                    { concurrent_stmt }
                    "end" "architecture" [ident] ";" ;

signal_decl     := "signal" ident_list ":" type [ ":=" expr ] ";" ;
component_decl  := "component" ident port_clause "end" "component" ";" ;

concurrent_stmt := assign_stmt | instance_stmt | process_stmt ;
assign_stmt     := target "<=" expr ";" ;
target          := ident [ "(" range_or_index ")" ] ;

instance_stmt   := ident ":" ident "port" "map" "(" assoc_list ")" ";" ;
assoc_list      := assoc { "," assoc } ;
assoc           := ident "=>" expr ;

process_stmt    := "process" "(" ident ")" "begin"
                   { seq_stmt }
                   "end" "process" ";" ;

seq_stmt        := assign_stmt | if_stmt | case_stmt ;
if_stmt         := "if" expr "then" { seq_stmt }
                   { "elsif" expr "then" { seq_stmt } }
                   [ "else" { seq_stmt } ]
                   "end" "if" ";" ;

case_stmt       := "case" expr "is"
                   { "when" case_choice "=>" { seq_stmt } }
                   "end" "case" ";" ;

case_choice     := literal | ident | "others" ;

range_or_index  := range | int_lit ;
range           := int_lit "downto" int_lit | int_lit "to" int_lit ;

expr            := rel_expr ;
rel_expr        := add_expr [ rel_op add_expr ] ;
rel_op          := "=" | "/=" | "<" | "<=" | ">" | ">=" ;
add_expr        := concat_expr { ("+" | "-") concat_expr } ;
concat_expr     := shift_expr { "&" shift_expr } ;
shift_expr      := logic_expr { ("<<" | ">>") logic_expr } ;
logic_expr      := xor_expr { ("or" | "and") xor_expr } ;
xor_expr        := unary_expr { "xor" unary_expr } ;
unary_expr      := [ "not" | "-" ] primary ;
primary         := literal | ident | target | "(" expr ")" | func_call ;

func_call       := ident "(" [ expr { "," expr } ] ")" ;
literal         := bit_lit | bitvec_lit | int_lit ;
```

### 1.4 Types, width, and expressions
- `bit` is a single 0/1 value. `bits(M downto N)` is an unsigned vector of
  width `abs(M-N)+1` with index direction preserved.
- Arithmetic on vectors uses two's complement. Shorter operands are sign-extended
  to the longer width before the operation. Results are the max operand width.
- For assignments, the RHS is resized to the LHS width:
  - Truncate if wider.
  - Sign-extend if narrower and RHS is the result of arithmetic.
  - Zero-extend if narrower and RHS is a literal or bitwise result.
- Comparisons return a `bit` (`'1'` true, `'0'` false).
- Built-ins:
  - `rising_edge(clk)` for sync logic.
  - `resize(x, N)` zero-extends or truncates to width N.
  - `sresize(x, N)` sign-extends or truncates to width N.

### 1.5 Simulation semantics
- Each cycle:
  1) Evaluate all combinational logic (concurrent assigns + component outputs)
     until stable.
  2) Apply `rising_edge(clk)` and update all sequential assignments together.
- If combinational logic does not converge (cycle), the simulator reports error.
- A `process(clk)` must contain `if rising_edge(clk)` as the outer guard.

### 1.6 Examples
Half adder:
```
entity HalfAdder is
  port(
    a : in bit;
    b : in bit;
    sum : out bit;
    carry : out bit
  );
end entity;

architecture rtl of HalfAdder is
begin
  sum <= a xor b;
  carry <= a and b;
end architecture;
```

Register:
```
entity Reg32 is
  port(
    clk : in bit;
    d : in bits(31 downto 0);
    q : out bits(31 downto 0)
  );
end entity;

architecture rtl of Reg32 is
begin
  process(clk)
  begin
    if rising_edge(clk) then
      q <= d;
    end if;
  end process;
end architecture;
```

## 2. ISA (A32-Lite, ARM-inspired)

Status: locked (opcodes, encodings, and core semantics are stable).

### 2.1 Core properties
- 32-bit fixed-width instructions, little-endian.
- PC aligned to 4; fetch at PC, then PC advances by +4.
- 16 registers: R0-R15 with aliases SP=R13, LR=R14, PC=R15.
- Reading PC returns PC+4.
- Flags: N, Z, C, V.
- Predication applies to all instructions via `cond[31:28]`. If `cond` is false,
  the instruction is treated as NOP (no writes, no flags).
- `cond=1110` is AL (always). `cond=1111` reserved (NOP).

### 2.2 Condition codes
| cond | name | meaning |
| ---- | ---- | ------- |
| 0000 | EQ | Z==1 |
| 0001 | NE | Z==0 |
| 0010 | CS | C==1 |
| 0011 | CC | C==0 |
| 0100 | MI | N==1 |
| 0101 | PL | N==0 |
| 0110 | VS | V==1 |
| 0111 | VC | V==0 |
| 1000 | HI | C==1 && Z==0 |
| 1001 | LS | C==0 || Z==1 |
| 1010 | GE | N==V |
| 1011 | LT | N!=V |
| 1100 | GT | Z==0 && N==V |
| 1101 | LE | Z==1 || N!=V |
| 1110 | AL | always |
| 1111 | NV | reserved (NOP) |

### 2.3 Instruction encoding (32-bit)
Common header:
- `cond[31:28]`
- `class[27:25]`

Classes:
- `000` ALU reg
- `001` ALU imm
- `010` Load/Store
- `011` Branch
- `100` System

ALU reg (`class=000`):
```
31        28 27    25 24   21 20 19   16 15   12 11    8 7      0
|  cond     | class |  op   | S |  Rd  |  Rn  |  Rm  |  shift   |
```

ALU imm (`class=001`):
```
31        28 27    25 24   21 20 19   16 15   12 11           0
|  cond     | class |  op   | S |  Rd  |  Rn  |   imm12        |
```

Load/Store (`class=010`):
```
31        28 27    25 24 23 22 21 20   17 16   13 12          0
|  cond     | class | L| B| W| U|  Rd  |  Rn  |    off13       |
```

Branch (`class=011`):
```
31        28 27    25 24 23                      1 0
|  cond     | class | L|        imm23             |0|
```

System (`class=100`):
```
31        28 27    25 24   21 20                   0
|  cond     | class |  op   |        imm21          |
```

### 2.4 ALU op encoding
`op[24:21]`:
- `0000` AND
- `0001` EOR
- `0010` SUB
- `0011` ADD
- `0100` ORR
- `0101` MOV (Rn ignored)
- `0110` MVN (Rn ignored)
- `0111` CMP (Rd ignored, flags only)
- `1000` TST (Rd ignored, flags only)
- `1001-1111` reserved

### 2.5 Shift encoding (ALU reg)
`shift[7:6]` = type, `shift[5:0]` = amount (0-31):
- `00` LSL
- `01` LSR
- `10` ASR
- `11` ROR

Shift amount must be 0-31; assembler rejects 32+.
If amount is 0, carry out is unchanged.

### 2.6 Execution semantics (selected)
- Predication: if condition fails, no register/memory writes and no flags update.
- MOV/MVN ignore Rn. CMP/TST ignore Rd and always update flags.
- ALU imm uses sign-extended `imm12`.
- LDR/STR effective address: `EA = Rn + (U? +off13 : -off13)`.
- If `W=1`, Rn is written back with EA.
- `B=0` word access, `B=1` byte access.
- LDRB zero-extends into Rd. STRB stores low 8 bits of Rd.
- Word access requires 4-byte alignment; misaligned word access traps.
- Writing to PC (R15) updates the next fetch address (aligned to 4).

Flags update when `S=1` (or for CMP/TST):
- N = result[31]
- Z = (result == 0)
- C = carry out (ADD), or NOT borrow (SUB/CMP)
- V = signed overflow (ADD/SUB/CMP)
- For logical ops, C is carry out from shift (if shift amount > 0), V unchanged.

### 2.7 System ops
`class=100`, `op` encoding:
- `0000` NOP
- `0001` HALT
- `0010` SVC (imm21 selects a service)
- others reserved

SVC services (imm21):
- `#1` `DIV_ZERO` trap (no side effects).
- `#0x10` `SYS_EXIT`: R0=exit code, halts.
- `#0x11` `SYS_PUTC`: R0=byte, returns R0.
- `#0x12` `SYS_GETC`: returns byte or -1 in R0.
- Other values raise `ILLEGAL`.

### 2.8 Assembler syntax
General:
- One instruction or directive per line.
- Comments: `;` or `//` to end of line.
- Labels: `name:` at line start.
- Registers: `R0`-`R15`, aliases `SP`, `LR`, `PC`.
- Immediates: `#123`, `#-4`, `#0x2A`, `#0b1010`.
- Condition suffix: `.EQ`, `.NE`, ... `.AL` (default is `.AL` if omitted).
- Optional `.S` suffix for ALU ops to update flags.
- Suffix order when both are present: `.S` then `.cond` (e.g., `ADD.S.EQ`).
- Condition suffix applies to all instructions, including system ops and loads/stores.

ALU reg:
```
ADD{.S}{.cond} Rd, Rn, Rm{, LSL #n}
SUB{.S}{.cond} Rd, Rn, Rm{, LSR #n}
AND{.S}{.cond} Rd, Rn, Rm{, ASR #n}
ORR{.S}{.cond} Rd, Rn, Rm{, ROR #n}
MOV{.S}{.cond} Rd, Rm{, LSL #n}
MVN{.S}{.cond} Rd, Rm{, LSL #n}
CMP{.cond} Rn, Rm{, LSL #n}
TST{.cond} Rn, Rm{, LSL #n}
```

ALU imm:
```
ADD{.S}{.cond} Rd, Rn, #imm
SUB{.S}{.cond} Rd, Rn, #imm
MOV{.S}{.cond} Rd, #imm
MVN{.S}{.cond} Rd, #imm
CMP{.cond} Rn, #imm
TST{.cond} Rn, #imm
```

Load/Store:
```
LDR{.cond}{.B} Rd, [Rn{, #off}]{!}
STR{.cond}{.B} Rd, [Rn{, #off}]{!}
```
- `{!}` sets `W=1`. `#-off` sets `U=0`.

Branch:
```
B{.cond} label
BL{.cond} label
```

System:
```
NOP{.cond}
HALT{.cond}
SVC{.cond} #imm
```

Pseudo:
```
LDR{.cond} Rd, =imm32
```
Assembler emits a literal pool and uses a PC-relative LDR.

### 2.9 Directives and object layout
- `.text`, `.data`, `.bss` select sections with independent location counters.
- `.rodata` is an alias of `.data` (read-only by convention) and shares the
  same location counter and base address.
- Section base addresses (default):
  - `.text` at `0x00000000`
  - `.data` at `0x00020000`
  - `.bss` at `0x00030000`
- `.org addr` sets the current location counter in the active section.
- `.align n` aligns to 2^n bytes.
- `.word expr` emits 4 bytes (little-endian).
- `.byte expr` emits 1 byte.
- `.space n` emits n zero bytes.
- `.ascii "..."` emits raw bytes (no null).
- `.asciz "..."` emits bytes and a trailing 0.
- `.global name` exports a symbol. `.globl` is accepted as an alias.
- `.pool` / `.ltorg` emits a literal pool at the current location.

### 2.10 Memory map and MMIO
- RAM base: `0x00000000`
- RAM size: `0x00100000` (1 MiB)
- Default stack pointer (SP) at reset: `0x00100000` (top of RAM)
- MMIO:
  - `0xFFFF0000`: write byte to console
  - `0xFFFF0004`: read byte (or -1 if none)
  - `0xFFFF0010`: write to exit/stop
- Access outside RAM and not in MMIO traps.

## 3. C-like language (and ABI)

Status: for/extern/bool confirmed.

### 3.1 Types
- `int` is 32-bit signed.
- `uint` is 32-bit unsigned.
- `char` is 8-bit unsigned.
- `bool` is 1 byte (`0` or `1`).
- `void` is allowed for functions returning no value.
- Pointers are 32-bit.
- Arrays have fixed size known at compile time.
- No `float`, `double`, `struct`, `union`, `enum`, or bitfields.

### 3.2 Expressions and operators
Supported operators:
- Arithmetic: `+ - * / %`
- Bitwise: `& | ^ ~`
- Shifts: `<< >>`
- Comparisons: `== != < <= > >=`
- Logical: `&& || !`
- Assignment: `=`
- Address/deref: `&` and `*`
- Array indexing: `a[i]` (same as `*(a + i)`)
- Unary: `sizeof`, casts `(type)expr`
- Integer arithmetic wraps modulo 2^32; signed right shift is arithmetic.
- Shift counts use the low 5 bits of the count.
- Division or modulo by zero triggers trap `DIV_ZERO`.

### 3.3 Statements
- Blocks: `{ ... }`
- `if` / `else`
- `while`
- `for (init; cond; post)` (all parts optional)
- `break`, `continue`
- `return` (with or without expression)

### 3.4 Declarations and functions
- Global and local variable declarations with optional constant initializer.
- Function declarations and definitions.
- `extern` allowed for functions and globals (extern globals are declarations only).
- No preprocessor (`#include`, `#define`) in MVP.

### 3.5 Memory model
- 32-bit byte-addressed memory, little-endian.
- `sizeof(int)=4`, `sizeof(char)=1`, `sizeof(void*)=4`.
- Alignment: `int` and pointers are 4-byte aligned; `char` is 1-byte aligned.
- Pointer arithmetic scales by element size.
- String literals are stored in `.rodata` and are null-terminated.
- RAM is 1 MiB at `0x00000000`.

### 3.6 Runtime and minimal standard library
Runtime:
- Program entry calls `main()` then calls `exit(main_result)`.
- SP is initialized to `0x00100000` (top of RAM) and 4-byte aligned.

Built-ins provided by the runtime:
- `int putc(int c)` writes one byte to `0xFFFF0000`, returns c.
- `int getc(void)` reads from `0xFFFF0004`, returns byte or -1.
- `void exit(int code)` writes to `0xFFFF0010` and halts.

Runtime may implement these via MMIO or via SVC services (`SYS_PUTC`,
`SYS_GETC`, `SYS_EXIT`). Both paths are valid for the simulator.

### 3.7 ABI (minimal)
- Args in R0-R3, return in R0.
- Extra args passed on stack at caller SP: arg4 at [SP+0], arg5 at [SP+4], ...
- Callee-saved: R4-R11. Caller-saved: R0-R3, R12, LR.
- SP 4-byte aligned, descending stack.
- LR holds the return address. If the callee uses LR, it must save/restore it.
