# SPECS

This document extends README with assembler examples, reference tests, and the
binary file format for the web simulator.

## 1. Assembler examples

### 1.1 Print a string (MMIO)
```
.text
.global _start
_start:
  LDR R0, =msg
  LDR R1, =0xFFFF0000

loop:
  LDRB R2, [R0]
  CMP R2, #0
  B.EQ done
  STRB R2, [R1]
  ADD R0, R0, #1
  B loop

done:
  MOV R0, #0
  LDR R1, =0xFFFF0010
  STR R0, [R1]
  HALT

.data
msg: .asciz "Hello, A32-Lite!\n"
```

### 1.2 Function call with stack save/restore
```
.text
.global _start
_start:
  MOV R0, #7
  MOV R1, #5
  BL sum
  MOV R2, R0
  HALT

sum:
  SUB SP, SP, #8
  STR R4, [SP]
  STR LR, [SP, #4]
  ADD R4, R0, R1
  MOV R0, R4
  LDR LR, [SP, #4]
  LDR R4, [SP]
  ADD SP, SP, #8
  MOV PC, LR
```

### 1.3 Predication (branchless select)
```
.text
.global _start
_start:
  MOV R0, #3
  MOV R1, #9
  MOV R2, R0
  CMP R1, R0
  MOV.GT R2, R1
  HALT
```
Result: `R2` holds the max of `R0` and `R1` without a branch.

## 2. Reference tests

### 2.1 Test format
Each test has:
- `tests/<name>.a32`: assembly source.
- `tests/<name>.ref`: expected results, line-based format.

`.ref` format:
```
# comment
CONFIG ram_size 0x00100000
LINKER path/to/script.lds
EXIT 0
OUT "text\n"
REG R0 0x00000000
REG R1 123
FLAG N 0
FLAG Z 1
FLAG C 0
FLAG V 0
MEM 0x00020000 0xDEADBEEF
TRAP MISALIGNED
ERROR E1004
```

Rules:
- `EXIT` is required if the program exits via MMIO or HALT (HALT implies EXIT 0).
- `OUT` compares exact console output.
- `REG` uses either decimal or hex. Unspecified registers are ignored.
- `FLAG` validates a single flag bit.
- `MEM` validates a 32-bit word at the address (little-endian).
- `TRAP` expects a runtime trap and stops execution.
  Valid trap codes are listed in 2.2.
- `TRAPPC` optionally validates the faulting instruction address.
- `TRAPADDR` optionally validates the effective address for memory traps.
- `TRAPINSTR` optionally validates the faulting instruction word.
- `ERROR <code>` expects a build-time error; in that case the test must not
  include `EXIT/OUT/REG/MEM/FLAG/TRAP` lines.
- `CONFIG <key> <value>` overrides session configuration for the test.
- `LINKER <path>` specifies an optional linker script (A32LDS).

Initial state for tests:
- RAM base is `0x00000000`, size is `0x00100000`.
- All registers are zeroed except SP which is set to `0x00100000`.
- Flags N/Z/C/V are cleared.
- RAM is zeroed.
- `.text` and `.data` are loaded at their default bases.

### 2.2 Trap codes
- `MISALIGNED`: unaligned word access (address not divisible by 4).
- `MEM_FAULT`: access outside RAM and not in MMIO.
- `ILLEGAL`: unknown or reserved instruction encoding.
- `DIV_ZERO`: division or modulo by zero.

### 2.3 SVC services
SVC uses `imm21` to select a service. The instruction is predicated like any
other instruction, and uses R0-R3 for arguments with R0 as return.

Service table:
- `#1` `DIV_ZERO`: raises trap `DIV_ZERO` (no side effects).
- `#0x10` `SYS_EXIT`: R0=exit code, halts.
- `#0x11` `SYS_PUTC`: R0=byte, returns R0.
- `#0x12` `SYS_GETC`: returns byte or -1 in R0.
- Other values raise `ILLEGAL`.

Notes:
- `DIV_ZERO` may be raised by division checks or by `SVC #1`.

### 2.4 Trap handling (simulator behavior)
- Traps are precise: the faulting instruction has no architectural side effects.
- PC does not advance on a trap; `trap_pc` is the faulting instruction address.
- `trap_addr` is the effective address for `MEM_FAULT`/`MISALIGNED`, otherwise 0.
- For `ILLEGAL`, `trap_instr` is the 32-bit instruction word, otherwise 0.
- Execution halts immediately and the trap report is exposed to the UI/test harness.
- Trap report fields are not visible to the running program (no architectural regs).

### 2.5 Test cases

T01_alu_flags:
```
.text
.global _start
_start:
  MOV R0, #1
  MOV R1, #2
  ADD.S R2, R0, R1
  SUB.S R3, R2, #3
  HALT
```
Expected (`tests/T01_alu_flags.ref`):
```
EXIT 0
REG R2 3
REG R3 0
FLAG Z 1
FLAG N 0
```

T02_predication:
```
.text
.global _start
_start:
  MOV R0, #0
  MOV R1, #1
  CMP R0, #0
  ADD.EQ R1, R1, #2
  ADD.NE R1, R1, #4
  HALT
```
Expected:
```
EXIT 0
REG R1 3
```

T03_load_store:
```
.text
.global _start
_start:
  LDR R0, =0x00020000
  MOV R1, #0x12
  STRB R1, [R0]
  LDRB R2, [R0]
  MOV R3, #0x1234
  STR R3, [R0, #4]
  LDR R4, [R0, #4]
  HALT
```
Expected:
```
EXIT 0
REG R2 0x12
REG R4 0x1234
MEM 0x00020000 0x00000012
MEM 0x00020004 0x00001234
```

T04_branch_bl:
```
.text
.global _start
_start:
  MOV R0, #7
  MOV R1, #5
  BL sum
  MOV R2, R0
  HALT

sum:
  ADD R0, R0, R1
  MOV PC, LR
```
Expected:
```
EXIT 0
REG R2 12
```

T05_literal_pool:
```
.text
.global _start
_start:
  LDR R0, =0xDEADBEEF
  HALT
```
Expected:
```
EXIT 0
REG R0 0xDEADBEEF
```

T06_misaligned:
```
.text
.global _start
_start:
  LDR R0, =0x00000002
  LDR R1, [R0]
  HALT
```
Expected:
```
TRAP MISALIGNED
```

T07_mmio_output:
```
.text
.global _start
_start:
  LDR R1, =0xFFFF0000
  MOV R0, #65
  STRB R0, [R1]
  HALT
```
Expected:
```
EXIT 0
OUT "A"
```

T08_suffix_order:
```
.text
.global _start
_start:
  MOV R0, #1
  MOV R1, #10
  CMP R0, #1
  ADD.S.EQ R2, R1, #5
  CMP R0, #2
  ADD.S.EQ R2, R2, #1
  HALT
```
Expected:
```
EXIT 0
REG R2 15
FLAG Z 0
FLAG N 1
```

T09_mem_fault:
```
.text
.global _start
_start:
  LDR R0, =0x00200000
  LDR R1, [R0]
  HALT
```
Expected:
```
TRAP MEM_FAULT
```

T10_illegal:
```
.text
.global _start
_start:
  .word 0xEE000000
  HALT
```
Expected:
```
TRAP ILLEGAL
```

T11_div_zero:
```
.text
.global _start
_start:
  MOV R0, #10
  MOV R1, #0
  CMP R1, #0
  SVC.EQ #1
  HALT
```
Expected:
```
TRAP DIV_ZERO
```

T12_svc_putc:
```
.text
.global _start
_start:
  MOV R0, #65
  SVC #0x11
  HALT
```
Expected:
```
EXIT 0
OUT "A"
REG R0 65
```

T13_svc_exit:
```
.text
.global _start
_start:
  MOV R0, #7
  SVC #0x10
  HALT
```
Expected:
```
EXIT 7
```

## 3. Binary file format for the web simulator

Name: A32B (A32-Lite Binary)

### 3.1 Overview
- Little-endian only.
- A header followed by a program header table and segment data.
- Loader maps segments into simulator memory and jumps to `entry`.

### 3.2 Header (32 bytes)
All fields are little-endian.
```
offset size  name        description
0x00   4     magic       ASCII "A32B"
0x04   2     version     0x0001
0x06   2     flags       bit0: little-endian (must be 1), other bits reserved
0x08   4     entry       entry point address
0x0C   2     ph_count    number of program headers
0x0E   2     ph_size     size of each program header (must be 24)
0x10   4     ph_offset   file offset of program header table
0x14   4     file_size   total file size in bytes
0x18   4     reserved    must be 0
0x1C   4     reserved2   must be 0
```

### 3.3 Program header (24 bytes each)
```
offset size  name        description
0x00   4     type        1=LOAD, 2=BSS, 3=SYMTAB, 4=LINE
0x04   4     flags       bit0 R, bit1 W, bit2 X
0x08   4     vaddr       load address in memory
0x0C   4     file_off    file offset to segment data (0 for BSS)
0x10   4     file_size   bytes to copy from file
0x14   4     mem_size    bytes to reserve in memory (>= file_size)
```

Segment rules:
- LOAD: copy `file_size` bytes from `file_off` to `vaddr`, then zero-fill to
  `mem_size`.
- BSS: zero-fill `mem_size` at `vaddr` (must have `file_size=0`).
- SYMTAB/LINE: optional debug data; loader may ignore.
- `vaddr` must be 4-byte aligned for X or word LOAD segments.
- `file_off` must be 4-byte aligned.

### 3.4 SYMTAB segment (optional)
Data layout:
```
u32 count
repeat count:
  u32 name_off
  u32 value
  u32 size
  u32 info   (type: 1=FUNC, 2=OBJ)
u8  strtab[] (null-terminated names)
```

### 3.5 LINE segment (optional)
Data layout:
```
u32 count
repeat count:
  u32 addr
  u32 line
  u32 file_off
u8  filetab[] (null-terminated file paths)
```

### 3.5.1 LINE compact format (optional)
If `type=4` (LINE) and `flags` bit0 is set, the segment uses a compact encoding.

Layout:
```
u32 file_count
repeat file_count:
  u32 name_off
u32 seq_count
repeat seq_count:
  u32 start_addr
  u32 file_index
  u32 line_start
  u32 entry_count
  repeat entry_count:
    u8  addr_delta   ; in instructions (multiplied by 4)
    s8  line_delta
u8  strtab[] (null-terminated file paths)
```

Rules:
- `start_addr` is word-aligned.
- Each entry advances the address by `addr_delta * 4` and the line by `line_delta`.
- `line_delta` may be negative (signed 8-bit).

### 3.6 Loader behavior
- Reject if `magic` or `version` is unknown.
- Reject if any segment range overlaps MMIO.
- Reject if any LOAD extends past simulator RAM size.
- Set PC to `entry` and start execution.

Simulator memory constants:
- RAM base: `0x00000000`
- RAM size: `0x00100000`
- SP initial: `0x00100000`

## 4. Trap report format (JSON)

When a trap occurs, the simulator emits a JSON report. All numeric fields are
unsigned 32-bit values encoded as hex strings.

Schema:
```
{
  "type": "trap",
  "code": "MISALIGNED|MEM_FAULT|ILLEGAL|DIV_ZERO",
  "pc": "0x00000000",
  "addr": "0x00000000",
  "instr": "0x00000000"
}
```

Rules:
- `pc` is the faulting instruction address.
- `addr` is the effective address for `MISALIGNED`/`MEM_FAULT`, else `"0x00000000"`.
- `instr` is the 32-bit instruction word for `ILLEGAL`, else `"0x00000000"`.
- No additional fields are required; the UI may ignore unknown fields.

## 5. Exit report format (JSON)

When the program exits (via MMIO or `SYS_EXIT`), the simulator emits an exit
report. All numeric fields are unsigned 32-bit values encoded as hex strings.

Schema:
```
{
  "type": "exit",
  "code": "0x00000000",
  "pc": "0x00000000"
}
```

Rules:
- `code` is the program exit status (R0 for `SYS_EXIT`, 0 for HALT).
- `pc` is the address of the exit-triggering instruction.

## 6. I/O event format (JSON)

The simulator emits I/O events for console activity. All numeric fields are
unsigned 32-bit values encoded as hex strings.

Output event (PUTC via MMIO or `SYS_PUTC`):
```
{
  "type": "io",
  "op": "putc",
  "value": "0x00000041",
  "pc": "0x00000000"
}
```

Input event (GETC via MMIO or `SYS_GETC`):
```
{
  "type": "io",
  "op": "getc",
  "value": "0xFFFFFFFF",
  "pc": "0x00000000"
}
```

Rules:
- `value` is the byte value for `putc` (0-255).
- `value` is the return value for `getc` (byte or `0xFFFFFFFF` for -1).
- `pc` is the address of the I/O-triggering instruction.

## 7. Execution trace format (JSON)

The simulator can emit a stream of trace events for debugging. All numeric
fields are unsigned 32-bit values encoded as hex strings.

Step event:
```
{
  "type": "step",
  "pc": "0x00000000",
  "instr": "0x00000000",
  "regs": {
    "R0": "0x00000000",
    "R1": "0x00000000",
    "...": "...",
    "R15": "0x00000000"
  },
  "flags": { "N": 0, "Z": 0, "C": 0, "V": 0 },
  "mem": [
    { "addr": "0x00000000", "value": "0x00000000" }
  ]
}
```

Rules:
- Emitted after each instruction retires (including predicated NOPs).
- `pc` is the address of the executed instruction.
- `instr` is the 32-bit instruction word.
- `regs` contains the full register file after the instruction.
- `flags` contains the condition flags after the instruction.
- `mem` is optional and includes any memory writes performed by the instruction.

## 7.1 Coverage report format (JSON)

The simulator can emit a coverage report (based on executed PCs).

Schema:
```
{
  "type": "coverage",
  "pc": ["0x00000000", "0x00000004"],
  "branches": [
    { "pc": "0x00000008", "taken": 10, "not_taken": 3 }
  ]
}
```

Rules:
- `pc` lists executed instruction addresses (unique).
- `branches` is optional and applies to conditional branches only.

## 7.2 Profiling report format (JSON)

The simulator can emit profiling data (instruction counts and time).

Schema:
```
{
  "type": "profile",
  "cycles": 12345,
  "pc": [
    { "addr": "0x00000000", "count": 100 },
    { "addr": "0x00000004", "count": 50 }
  ]
}
```

Rules:
- `cycles` is the number of executed instructions (1 per retired instruction).
- `pc` is a list of per-address execution counts.

## 7.3 Statistics report format (JSON)

The simulator can emit aggregate statistics for a run.

Schema:
```
{
  "type": "stats",
  "instr": 12345,
  "loads": 100,
  "stores": 50,
  "branches": { "total": 20, "taken": 12, "not_taken": 8 },
  "mmio": { "putc": 3, "getc": 1 },
  "traps": { "total": 0 }
}
```

Rules:
- `instr` counts retired instructions (including predicated NOPs).
- `loads`/`stores` count memory ops (LDR/LDRB and STR/STRB).
- `branches` counts conditional and unconditional branches.
- `mmio` counts I/O events.

## 8. Breakpoint and watchpoint events (JSON)

The debugger can emit events when execution stops due to a breakpoint or
watchpoint. All numeric fields are unsigned 32-bit values encoded as hex strings.

Breakpoint event:
```
{
  "type": "break",
  "pc": "0x00000000",
  "reason": "breakpoint"
}
```

Watchpoint event:
```
{
  "type": "break",
  "pc": "0x00000000",
  "reason": "watchpoint",
  "addr": "0x00000000",
  "access": "read|write|execute"
}
```

Rules:
- `pc` is the address of the instruction that triggered the stop.
- `addr` is required for watchpoints.
- `access` indicates the access type that matched the watchpoint.

## 9. Debug control commands (JSON)

The UI sends debugger control commands to the simulator. All numeric fields are
unsigned 32-bit values encoded as hex strings.

Set breakpoint:
```
{ "cmd": "bp_set", "pc": "0x00000000" }
```

Clear breakpoint:
```
{ "cmd": "bp_clear", "pc": "0x00000000" }
```

Set watchpoint:
```
{ "cmd": "wp_set", "addr": "0x00000000", "access": "read|write|execute" }
```

Clear watchpoint:
```
{ "cmd": "wp_clear", "addr": "0x00000000", "access": "read|write|execute" }
```

Single step:
```
{ "cmd": "step" }
```

Continue:
```
{ "cmd": "continue" }
```

Stop (pause):
```
{ "cmd": "stop" }
```

Reset:
```
{ "cmd": "reset" }
```

Rules:
- `bp_set` and `bp_clear` apply to exact instruction addresses.
- `wp_set` and `wp_clear` apply to exact addresses and access types.
- `step` executes one instruction and emits a step event.
- `continue` runs until a break/trap/exit.
- `stop` pauses execution asynchronously and emits a break event with
  `reason: "stop"`.
- `reset` clears state and reloads the program.

## 10. State snapshot format (JSON)

The simulator can export/import a full machine snapshot for save/restore and
rewind. All numeric fields are unsigned 32-bit values encoded as hex strings.

Snapshot schema:
```
{
  "type": "snapshot",
  "pc": "0x00000000",
  "regs": {
    "R0": "0x00000000",
    "R1": "0x00000000",
    "...": "...",
    "R15": "0x00000000"
  },
  "flags": { "N": 0, "Z": 0, "C": 0, "V": 0 },
  "mem": [
    { "addr": "0x00000000", "data": "base64:AAAA" }
  ]
}
```

Rules:
- `pc` mirrors `R15` and is included for convenience; `R15` is authoritative.
- `mem` is a list of memory blocks; each block is raw bytes in base64.
- The simulator may emit only dirty pages or full RAM; the consumer must handle
  partial coverage and treat missing regions as unchanged/zero.

## 11. Session configuration format (JSON)

The UI can supply configuration options at load time or during reset.

Schema:
```
{
  "type": "config",
  "ram_size": "0x00100000",
  "strict_traps": true,
  "trace_level": "off|step|io|full",
  "max_steps": 1000000
}
```

Rules:
- `ram_size` must be a power of two and at least `0x00010000`.
- `strict_traps=true` enforces traps for misaligned access and illegal ops.
- `trace_level` controls emitted events: `off` (none), `step` (steps only),
  `io` (I/O only), `full` (steps + I/O + breaks).
- `max_steps` caps execution between UI interactions to avoid infinite loops.

## 12. Build/assembly error format (JSON)

The assembler and compiler emit structured error diagnostics for the web IDE.

Schema:
```
{
  "type": "diag",
  "severity": "error|warning|info",
  "message": "string",
  "file": "path/or/virtual",
  "line": 1,
  "column": 1,
  "code": "E0001"
}
```

Rules:
- `line` and `column` are 1-based; omit them if unknown.
- `file` is the source path or a virtual buffer id.
- `code` is optional but recommended for stable IDE links.

## 12.1 Source map format (C-like -> IR)

The compiler can emit a source map to link C-like spans to IR addresses.

Format (JSON):
```
{
  "type": "sourcemap",
  "files": ["src/main.c", "src/util.c"],
  "map": [
    { "pc": "0x00000000", "file": 0, "line": 12, "col": 3, "len": 8 },
    { "pc": "0x00000004", "file": 0, "line": 13, "col": 1, "len": 4 }
  ]
}
```

Rules:
- `pc` is the address of the first instruction for a statement/span.
- `file` is an index into `files`.
- `len` is the character length of the span on the source line.

## 13. Diagnostic code conventions

Diagnostic codes are stable identifiers for IDE help and user documentation.
Format: `E` + 4 digits.

Ranges:
- `E1xxx`: Assembler
- `E2xxx`: Compiler (C-like)
- `E3xxx`: Linker/binary writer
- `E4xxx`: Simulator/loader

Suggested codes (non-exhaustive):
Assembler:
- `E1001` Unknown mnemonic
- `E1002` Invalid operand
- `E1003` Invalid register
- `E1004` Immediate out of range
- `E1005` Undefined symbol
- `E1006` Duplicate label
- `E1007` Misaligned `.word`
- `E1008` Literal pool overflow
- `E1009` Suffix order invalid

Compiler:
- `E2001` Unknown type
- `E2002` Type mismatch
- `E2003` Undefined identifier
- `E2004` Duplicate definition
- `E2005` Invalid lvalue
- `E2006` Constant expression required
- `E2007` Division by zero (compile-time)
- `E2008` Unsupported feature

Linker/binary:
- `E3001` Section overlap
- `E3002` Entry symbol missing
- `E3003` Relocation out of range
- `E3004` Output size exceeds RAM

Simulator/loader:
- `E4001` Invalid binary header
- `E4002` Segment out of bounds
- `E4003` Segment overlaps MMIO
- `E4004` Unsupported binary version

## 14. Compiler IR (A32-IR) format

The compiler emits an intermediate representation consumed by the assembler.
The IR is text-based, one instruction per line, with explicit types.

### 14.1 File structure
```
.module "name"
.section text
.section rodata
.section data
.section bss
.globl symbol
.type symbol, func|object
.size symbol, 123
.align 2
label:
  instr ...
```

### 14.2 Types
- `i32` signed 32-bit
- `u32` unsigned 32-bit
- `i8` signed 8-bit
- `u8` unsigned 8-bit
- `ptr` 32-bit pointer

### 14.3 Operands
- Registers: `%r0`..`%r15`
- Virtual registers: `%v0`, `%v1`, ... (compiler allocates, assembler maps)
- Immediates: `$123`, `$-4`, `$0x2A`
- Labels: `@symbol`
- Memory: `[%r1 + $4]`, `[%r1 + %v2]`
- Relocations: `@symbol`, `@symbol+4`, `@symbol-8` (addend on symbol)

### 14.4 Instructions
```
add.i32   %v0, %v1, %v2
sub.i32   %v0, %v1, $4
and.i32   %v0, %v1, %v2
or.i32    %v0, %v1, %v2
xor.i32   %v0, %v1, %v2
mov.i32   %v0, %v1
mov.i32   %v0, $123
cmp.i32   %v0, %v1
cmp.i32   %v0, $0
cmov.eq.i32   %v0, %v1
cmov.ne.i32   %v0, %v1
cmov.lt.i32   %v0, %v1
cmov.le.i32   %v0, %v1
cmov.gt.i32   %v0, %v1
cmov.ge.i32   %v0, %v1
cmov.eq.u32   %v0, %v1
cmov.ne.u32   %v0, %v1
cmov.lt.u32   %v0, %v1
cmov.le.u32   %v0, %v1
cmov.gt.u32   %v0, %v1
cmov.ge.u32   %v0, %v1
cmov.eq.i8    %v0, %v1
cmov.ne.i8    %v0, %v1
cmov.lt.i8    %v0, %v1
cmov.le.i8    %v0, %v1
cmov.gt.i8    %v0, %v1
cmov.ge.i8    %v0, %v1
cmov.eq.u8    %v0, %v1
cmov.ne.u8    %v0, %v1
cmov.lt.u8    %v0, %v1
cmov.le.u8    %v0, %v1
cmov.gt.u8    %v0, %v1
cmov.ge.u8    %v0, %v1
cmov.eq.i32   %v0, %v1, %v2
cmov.ne.i32   %v0, %v1, %v2
cmov.lt.i32   %v0, %v1, %v2
cmov.le.i32   %v0, %v1, %v2
cmov.gt.i32   %v0, %v1, %v2
cmov.ge.i32   %v0, %v1, %v2
cmov.eq.u32   %v0, %v1, %v2
cmov.ne.u32   %v0, %v1, %v2
cmov.lt.u32   %v0, %v1, %v2
cmov.le.u32   %v0, %v1, %v2
cmov.gt.u32   %v0, %v1, %v2
cmov.ge.u32   %v0, %v1, %v2
cmov.eq.i8    %v0, %v1, %v2
cmov.ne.i8    %v0, %v1, %v2
cmov.lt.i8    %v0, %v1, %v2
cmov.le.i8    %v0, %v1, %v2
cmov.gt.i8    %v0, %v1, %v2
cmov.ge.i8    %v0, %v1, %v2
cmov.eq.u8    %v0, %v1, %v2
cmov.ne.u8    %v0, %v1, %v2
cmov.lt.u8    %v0, %v1, %v2
cmov.le.u8    %v0, %v1, %v2
cmov.gt.u8    %v0, %v1, %v2
cmov.ge.u8    %v0, %v1, %v2
ldr.i32   %v0, [%v1 + $0]
str.i32   %v0, [%v1 + $0]
ldr.u8    %v0, [%v1 + $0]
str.u8    %v0, [%v1 + $0]
br        @label
br.eq     @label
br.ne     @label
call      @func
ret
svc       $0x10
```

Rules:
- Suffix `.i32/.u32/.u8` indicates the operand type and size.
- Branch conditions map to condition codes (eq/ne/lt/le/gt/ge).
- `cmov.*.T` with 2 operands consumes the current flags set by the most recent
  `cmp` or any ALU operation that updates flags; the compiler must ensure flags
  are valid.
- `cmov.*.T` with 3 operands performs an implicit compare of operand 2 vs
  operand 3 using type `T`, then moves operand 2 into the destination if the
  condition is true.
- After a 3-operand `cmov.*`, flags are unspecified; do not rely on them.
- `T` must match the destination type. Sources are implicitly converted to `T`
  before comparison/move.
- `call` lowers to `BL` and `ret` lowers to `MOV PC, LR`.
- Virtual registers must be lowered by the assembler or a reg-alloc pass before
  encoding to A32-Lite.

### 14.5 Debug metadata (optional)
```
.file 1 "src/main.c"
.loc  1 12 3
```
These associate subsequent instructions with source locations.

### 14.6 Symbols, labels, and sections
- Symbols use the assembler identifier rules: `[A-Za-z_][A-Za-z0-9_]*`.
- Labels ending with `:` define a symbol at the current location.
- Labels starting with `.L` are local and may be omitted from symbol tables.
- `.section` accepts `text`, `data`, `bss`, `rodata`.
- `rodata` is treated as read-only data by tooling but maps into the same memory
  region as `data` (no hardware enforcement).
- `.globl` marks a symbol as exported; it is equivalent to `.global`.

### 14.7 Register allocation and lowering conventions
- `%r0`..`%r15` are physical registers; `%v*` are virtual registers.
- `R13` (SP), `R14` (LR), and `R15` (PC) are reserved and must not be allocated
  to virtual registers.
- Register allocation may use linear scan or graph coloring, but must honor the
  calling convention: R0-R3/R12/LR are caller-saved, R4-R11 are callee-saved.
- Function arguments must arrive in R0-R3 and return values in R0.
- The allocator must spill live values across `call` if they reside in
  caller-saved registers.
- Spills use stack slots (4-byte aligned) in the function frame.
- Addressing constraints:
  - A32-Lite loads/stores use base+immediate only (no reg offset).
  - If an IR operand is `[%base + %idx]`, lower to `ADD` into a temp, then use
    `[temp, #0]` for the memory access.
  - Load/store immediates must fit in 13 bits; otherwise synthesize the address
    with `ADD/SUB` into a temp register.
- Immediate constraints:
  - ALU immediates are signed 12-bit. Out-of-range immediates must be lowered
    via literal load or via `LDR Rd, =imm`.

### 14.8 Example: IR to ASM lowering with spills

IR (function uses more than 4 live values across a call):
```
.section text
.globl sum6
.type sum6, func
sum6:
  ; args: a,b,c,d,e,f in R0-R3 and stack [SP+0],[SP+4] at entry
  add.i32 %v0, %r0, %r1
  add.i32 %v1, %r2, %r3
  ldr.i32 %v2, [%r13 + $0]
  ldr.i32 %v3, [%r13 + $4]
  add.i32 %v4, %v0, %v1
  add.i32 %v5, %v2, %v3
  add.i32 %v6, %v4, %v5
  call @foo
  add.i32 %v7, %v6, %r0
  ret
```

Lowered ASM (one possible allocation + spill):
```
sum6:
  SUB SP, SP, #8
  STR LR, [SP, #4]
  ADD R12, R0, R1
  ADD R0, R2, R3
  LDR R1, [SP, #8]
  LDR R2, [SP, #12]
  ADD R0, R0, R12
  ADD R1, R1, R2
  ADD R0, R0, R1
  STR R0, [SP, #0]   ; spill across call
  BL foo
  LDR R1, [SP, #0]
  ADD R0, R1, R0
  LDR LR, [SP, #4]
  ADD SP, SP, #8
  MOV PC, LR
```

Notes:
- Stack args are addressed relative to the caller's SP; after local pushes,
  adjust offsets accordingly.
- `LR` is saved because the function calls another function.
- Caller-saved registers are freely reused; values needed after `call` are spilled.

### 14.9 Stack frame and calling convention details

At function entry:
- `SP` points to the caller's stack frame.
- Extra arguments beyond R0-R3 are at `[SP + 0]`, `[SP + 4]`, ...

Prologue/epilogue convention (canonical):
- Allocate a fixed frame: `SUB SP, SP, #frame_size`.
- Save `LR` if the function calls another function.
- Save any used callee-saved registers (R4-R11) at the lowest addresses in the
  frame, then place spill/locals above them.
- Restore callee-saved registers and `LR`, then `ADD SP, SP, #frame_size` and
  `MOV PC, LR`.

Incoming stack args after prologue:
- Arg4 at `[SP + frame_size + 0]`, arg5 at `[SP + frame_size + 4]`, etc.

Outgoing stack args for a call:
- The caller allocates space by `SUB SP, SP, #n` (n is bytes for extra args),
  stores args at `[SP + 0]`, `[SP + 4]`, ... then calls, then restores `SP`.

Alignment:
- `SP` must remain 4-byte aligned at all times.

### 14.10 Example stack frame layout (locals + spills)

Example: function uses R4-R5 (callee-saved), has 8 bytes of locals, and spills
two temporaries. Frame size = 24 bytes.

Prologue:
```
SUB SP, SP, #24
STR R4, [SP, #0]
STR R5, [SP, #4]
STR LR, [SP, #8]
```

Frame layout (low address at top, SP grows down):
```
SP+0   saved R4
SP+4   saved R5
SP+8   saved LR
SP+12  spill0
SP+16  spill1
SP+20  local0 (4 bytes)
SP+24  local1 (4 bytes)  ; same as [SP + frame_size], first incoming arg
```

Notes:
- Incoming arg4 is at `[SP + frame_size + 0]` and is not part of the frame.
- Locals can be placed after spills; alignment is 4 bytes.
- If LR is not needed (leaf function), omit its save/restore and shrink frame.

Epilogue:
```
LDR LR, [SP, #8]
LDR R5, [SP, #4]
LDR R4, [SP, #0]
ADD SP, SP, #24
MOV PC, LR
```

## 15. End-to-end example (C-like -> IR -> ASM)

C-like source:
```
int sum_to(int n) {
  int s = 0;
  int i = 0;
  while (i < n) {
    s = s + i;
    i = i + 1;
  }
  return s;
}

int main() {
  return sum_to(5);
}
```

A32-IR:
```
.section text
.globl sum_to
.type sum_to, func
sum_to:
  mov.i32 %v0, $0
  mov.i32 %v1, $0
.Lloop:
  cmp.i32 %v1, %r0
  br.ge @.Ldone
  add.i32 %v0, %v0, %v1
  add.i32 %v1, %v1, $1
  br @.Lloop
.Ldone:
  mov.i32 %r0, %v0
  ret

.globl main
.type main, func
main:
  mov.i32 %r0, $5
  call @sum_to
  ret
```

A32-Lite ASM:
```
.text
.global sum_to
sum_to:
  MOV R1, #0
  MOV R2, #0
L_loop:
  CMP R2, R0
  B.GE L_done
  ADD R1, R1, R2
  ADD R2, R2, #1
  B L_loop
L_done:
  MOV R0, R1
  MOV PC, LR

.global main
main:
  MOV R0, #5
  BL sum_to
  MOV PC, LR
```

Notes:
- The runtime calls `main` and handles exit.
- For a standalone assembly program, implement `_start` to call `main` then
  `SVC #0x10` (SYS_EXIT).

## 16. Predication example (branchless select)

C-like source:
```
int max2(int a, int b) {
  return (a > b) ? a : b;
}
```

A32-IR:
```
.section text
.globl max2
.type max2, func
max2:
  mov.i32 %v0, %r1
  cmov.gt.i32 %v0, %r0, %r1
  mov.i32 %r0, %v0
  ret
```

A32-Lite ASM (predicated, no branch):
```
.text
.global max2
max2:
  MOV R2, R0
  CMP R1, R0
  MOV.GT R2, R1
  MOV R0, R2
  MOV PC, LR
```

Notes:
- Predication avoids branch mispredicts and simplifies control flow.
- The IR can emit `cmov.*` to express predicated moves directly.

## 17. Assembler expressions, literals, and pools

### 17.1 Expression grammar
Expressions in directives and operands are limited to integer arithmetic:
```
expr  := term { ("+" | "-") term } ;
term  := number | symbol | "(" expr ")" | "-" term ;
```
`number` supports decimal, hex (`0x`), and binary (`0b`).

Rules:
- Symbols in expressions must be resolvable at assembly/link time.
- Symbol +/-, symbol + literal, and literal-only expressions are allowed.
- Subtracting two symbols is allowed only if both are in the same section.
- Any other form yields `E1002` (Invalid operand).

### 17.2 Branch range and relaxation
- Branch immediate range is +/- 16 MiB (signed imm23 << 2).
- If a branch target is out of range, the assembler must relax:
  - Unconditional: `LDR PC, =target`
  - Conditional: `B.<invcond> skip; LDR PC, =target; skip:`
- If relaxation cannot be applied, emit `E1004`.

### 17.3 Literal pools
`LDR Rd, =imm32` emits a literal pool entry and generates a PC-relative `LDR`.

Rules:
- PC-relative literal load range is +/- 8191 bytes from `PC+4`.
- The assembler inserts literal pools at `.pool` (or `.ltorg`) or at end of
  section if needed.
- If a literal cannot be placed within range, emit `E1008`.

### 17.4 Alignment and fill
- `.align n` aligns the location counter to 2^n bytes.
- `.org` may move the counter forward; padding is filled with zero bytes in
  `.data/.bss/.rodata` and with `NOP` in `.text`.

## 18. Linking and entry point

### 18.1 Symbol resolution
- Multiple definitions of a global symbol are an error (`E3001`).
- Unresolved globals are an error (`E1005` or `E3002`).
- Local labels (`.L*`) are not exported.

### 18.2 Section layout
- `.text` is read/execute (R|X).
- `.data/.rodata/.bss` are read/write (R|W).
- `.rodata` shares the `.data` location counter and base address.
- All sections are aligned to 4 bytes by default.

### 18.3 Entry point
- If `_start` exists, it is used as the entry symbol.
- Else if `main` exists, the toolchain emits a stub:
  ```
  _start:
    BL main
    SVC #0x10
  ```
- If neither exists, emit `E3002`.

## 19. C-like semantics (detailed)

### 19.1 Integer behavior
- All integer arithmetic is modulo 2^32 (wrap-around).
- Signed values use two's complement.
- Division truncates toward zero; modulo has the same sign as the dividend.
- Division/modulo by zero triggers `DIV_ZERO`.

### 19.2 Shifts
- Shift count uses the low 5 bits of the count (equivalent to `count % 32`).
- Right shift of signed values is arithmetic; unsigned is logical.

### 19.3 Conversions and promotions
- `bool` and `char` are promoted to `int` for arithmetic.
- If either operand is `uint`, both are converted to `uint`.
- Otherwise both are converted to `int`.
- Assignment converts the RHS to the LHS type by truncation or sign/zero extend.
- Explicit casts `(type)expr` are supported between integer and pointer types.
  - To a smaller width: truncate low bits.
  - To a larger width: sign-extend for signed types, zero-extend for unsigned.
  - To `bool`: result is `0` or `1` (non-zero becomes `1`).
  - Between pointer and integer: reinterpret the 32-bit value.
  - Other casts are errors (`E2008`).

### 19.4 Boolean results and control flow
- Comparisons yield `bool` (`0` or `1`).
- `&&`/`||` are short-circuit and yield `0` or `1`.
- In `if/while/for`, any non-zero value is true.

### 19.5 Declarations and initialization
- Globals with no initializer go to `.bss` and are zeroed.
- Globals with constant initializers go to `.data` or `.rodata`.
- Local variables without initializers have unspecified values.
- Array sizes must be constant expressions.

### 19.6 Additional types
- `void` is allowed for functions that return no value.
- `void` is not a value type and cannot be used in expressions.

### 19.7 Operator precedence and associativity
Highest to lowest:
1) Postfix: function call `f(...)`, array indexing `a[i]` (left-to-right)
2) Unary: `! ~ - * & sizeof (type)` (right-to-left)
3) Multiplicative: `* / %` (left-to-right)
4) Additive: `+ -` (left-to-right)
5) Shift: `<< >>` (left-to-right)
6) Relational: `< <= > >=` (left-to-right)
7) Equality: `== !=` (left-to-right)
8) Bitwise AND: `&` (left-to-right)
9) Bitwise XOR: `^` (left-to-right)
10) Bitwise OR: `|` (left-to-right)
11) Logical AND: `&&` (left-to-right)
12) Logical OR: `||` (left-to-right)
13) Assignment: `=` (right-to-left)

Notes:
- Parentheses override precedence.
- The conditional operator (`?:`) and comma operator are not supported.

### 19.8 `sizeof` operator
- `sizeof(type)` yields the size in bytes of the given type.
- `sizeof(expr)` yields the size of the expression's static type.
- `sizeof` does not evaluate its operand (no side effects).
- For arrays, `sizeof` yields total size (element size * length).
- Sizes: `int/uint/pointer` = 4, `char/bool` = 1.
- Using `sizeof` on `void` or function types is an error (`E2008`).
- Note: Arrays decay to pointers when passed to functions, so `sizeof` inside
  a function parameter of array type yields the pointer size.

### 19.9 Pointers and strings
- Pointer equality/inequality compares addresses only.
- There is no built-in string comparison; compare contents manually.
- String literals are stored in `.rodata` and are null-terminated.
- String literal pooling is disabled: each literal occurrence has a distinct
  address, even if contents are identical.
- String literals are read-only; attempts to modify them are compile-time errors
  (`E2008`).

## 20. Runtime helper routines

The compiler may lower operations to runtime helpers when needed.
All helpers follow the standard ABI: args in R0/R1, return in R0.

Required helpers:
- `__mul_i32`, `__mul_u32`
- `__div_i32`, `__div_u32`
- `__mod_i32`, `__mod_u32`

Rules:
- Division/modulo by zero in helpers must raise `DIV_ZERO` (via `SVC #1`).
- Helpers may clobber R0-R3 and R12, must preserve R4-R11 and LR.

## 21. HDL elaboration and signal rules

### 21.1 Drivers and initialization
- A signal may have only one continuous driver.
- Multiple drivers (including process + concurrent) are an error.
- Uninitialized signals default to 0 for all bits.

### 21.2 Indexing and slices
- `sig(i)` yields a `bit` where `i` is an integer expression.
- `sig(a downto b)` or `sig(a to b)` yields a `bits` slice.
- Out-of-range indices are errors at runtime.

### 21.3 Processes
- Only `process(clk)` is allowed; the sensitivity list must be exactly one
  identifier (the clock).
- Each process must contain `if rising_edge(clk) then ... end if;` as the
  outer guard.
- Assignments inside a process schedule updates at the rising edge; the last
  assignment to a signal in the same process wins.

### 21.4 Port mapping
- All component ports must be mapped exactly once.
- Port widths must match; implicit resizing is not allowed for ports.
- Direction rules: `in` ports cannot be driven internally, `out` ports may be
  read but must be driven exactly once.

## 22. HDL test format (text)

Test files use a simple line-based script.

Commands:
```
load <top_entity> <file1> <file2> ...
clock <signal>              ; default is "clk"
set <signal> <value>
eval
tick                        ; rising edge
tock                        ; falling edge
step                        ; tick + tock
expect <signal> <value>
```

Values accept: `0`, `1`, `0xNN`, `0b0101`, `b"0101"`.

Example:
```
load HalfAdder HalfAdder.hdl
set a 1
set b 1
eval
expect sum 0
expect carry 1
```

Rules:
- `eval` runs combinational settle only.
- `tick` applies rising edge updates, `tock` returns clock low.
- A failed `expect` stops the test with a diagnostic.

## 22.1 C-like compiler test format

Each C-like test includes:
- `tests_c/<name>.c` source
- `tests_c/<name>.ref` expected results
Multi-file tests may use multiple sources that share the same prefix:
`tests_c/<name>_*.c` are all compiled and linked together.

`.ref` format:
```
EXIT 0
OUT "hello\n"
REG R0 0
ERROR E2008
CONFIG ram_size 0x00100000
LINKER path/to/script.lds
```

Rules:
- `EXIT` is required (HALT implies EXIT 0).
- `OUT` compares exact console output.
- `REG R0` validates the return value of `main`.
- `ERROR <code>` expects a compile-time error; in that case the test must not
  include `EXIT/OUT/REG` lines.
- `CONFIG <key> <value>` overrides session configuration for the test.
- `LINKER <path>` specifies an optional linker script (A32LDS).

## 22.2 Unified test runner output (A32-TEST)

The test runner emits a stable, line-based report for CI and IDEs.

Format:
```
TEST <name> START
TEST <name> PASS
TEST <name> FAIL <code> <message>
TEST <name> INFO <message>
SUMMARY <total> <passed> <failed>
```

Rules:
- `<name>` is the test id (e.g. `T01_sum_to`).
- `<code>` is a diagnostic code (see section 13).
- `INFO` lines are optional and may appear between START and PASS/FAIL.
- The report is UTF-8 but messages should be ASCII when possible.

## 23. HDL primitive library

Primitives are provided by the simulator and are resolved by name. Port widths
are taken from the component declaration and must match across ports.

Bitwise primitives (width-polymorphic):
- `not1(a, y)`
- `and2(a, b, y)`
- `or2(a, b, y)`
- `xor2(a, b, y)`
- `mux2(a, b, sel, y)`

Sequential primitives:
- `dff(clk, d, q)` captures `d` on rising edge.

Memory primitive:
- `ram(clk, we, addr, din, dout)`
  - Write: on rising edge, if `we=1`, `mem[addr] <= din`.
  - Read: `dout` reflects `mem[addr]` combinationally.
  - Depth is `2^(addr width)`, data width is `din/dout` width.
  - Memory initializes to zero.

## 24. Simulator execution model

### 24.1 Instruction step
- Fetch instruction at `PC` (word-aligned). If `PC` is outside RAM, trap
  `MEM_FAULT`.
- Decode and evaluate the condition against current flags.
- If condition is false, treat as NOP and advance `PC` by 4.
- If condition is true, execute instruction and apply side effects, then update
  `PC` (branch/PC writes or `PC+4`).

### 24.2 HALT and SVC
- `HALT` is an exit with code 0 (emits exit report).
- `SVC #imm` performs the service if `imm` is valid; otherwise `ILLEGAL`.
- If the condition is false, `HALT`/`SVC` have no effect.

### 24.3 MMIO semantics
- Writes to `0xFFFF0000` output one byte (PUTC event).
- Reads from `0xFFFF0004` return a byte or `0xFFFFFFFF` for -1 (GETC event).
- Writes to `0xFFFF0010` exit with code in the low 32 bits.

### 24.4 Misaligned access policy
- If `strict_traps=true`, misaligned word loads/stores trap `MISALIGNED`.
- If `strict_traps=false`, misaligned word loads/stores are emulated by
  byte accesses (little-endian), unless they cross RAM bounds.

### 24.5 Screen (memory-mapped framebuffer)

The simulator provides a 320x240 pixel monochrome display.

Memory layout:
- Base address: `0x00400000`
- Size: 9600 bytes (320 × 240 / 8)
- Format: 1 bit per pixel, row-major order
- Bit order: MSB is leftmost pixel within each byte

Address calculation:
```
byte_index = (y * 320 + x) / 8
bit_offset = 7 - ((y * 320 + x) % 8)
pixel_on = (screen[byte_index] >> bit_offset) & 1
```

Word access (32-bit aligned):
- Each 32-bit word contains 32 consecutive horizontal pixels
- Word 0 at `0x00400000` contains pixels (0,0) to (31,0)
- Word 1 at `0x00400004` contains pixels (32,0) to (63,0)
- Row 0 spans words 0-9, row 1 spans words 10-19, etc.

Screen constants:
```
SCREEN_WIDTH  = 320
SCREEN_HEIGHT = 240
SCREEN_BASE   = 0x00400000
SCREEN_SIZE   = 9600
```

### 24.6 Keyboard (memory-mapped register)

The simulator provides a keyboard input register.

Memory layout:
- Address: `0x00402600`
- Size: 4 bytes (32-bit register)
- Access: Read-only from CPU perspective (writes are ignored)

Register value:
- Contains the ASCII/scan code of the currently pressed key
- Contains 0 when no key is pressed

Key codes:
```
Printable ASCII:    32-126 (space to ~)
Enter:              10
Backspace:          8
Tab:                9
Escape:             27
Delete:             127
Arrow Up:           128
Arrow Down:         129
Arrow Left:         130
Arrow Right:        131
F1-F12:             132-143
Home:               144
End:                145
PageUp:             146
PageDown:           147
Insert:             148
```

Keyboard constant:
```
KEYBOARD_ADDR = 0x00402600
```

### 24.7 RAM configuration

The simulator RAM is configurable at load time.

Default configuration:
```
ram_size    = 0x00100000  (1 MB)
stack_top   = ram_size    (SP initialized to top of RAM)
strict_traps = true
max_steps   = 1000000
```

Configuration options:
- `ram_size`: Size of RAM in bytes (must be > 0, max 0x00400000 to avoid screen overlap)
- `stack_top`: Initial SP value (defaults to `ram_size` if not specified)
- `strict_traps`: Enable strict trap checking for misaligned access
- `max_steps`: Maximum instructions before timeout

RAM constraints:
- RAM base is always `0x00000000`
- RAM must not overlap with screen (`0x00400000`+)
- Recommended sizes: `0x00010000` (64 KB), `0x00040000` (256 KB), `0x00100000` (1 MB)

Configuration in test files (`.ref`):
```
CONFIG ram_size 0x00100000
CONFIG strict_traps true
CONFIG max_steps 1000000
```

Configuration in web interface:
- RAM size field accepts hex (`0x00100000`) or decimal (`1048576`)
- Strict traps toggle (on/off)

Initial state:
- All RAM is zeroed at load time
- SP is set to `stack_top` (or `ram_size` by default)
- PC is set to the entry point from the binary
- All other registers are zeroed
- Flags N/Z/C/V are cleared

### 24.8 Timer (hardware timer)

The simulator provides a countdown timer with interrupt capability.

MMIO registers:
```
Address      Size  Name          Description
─────────────────────────────────────────────────────────
0xFFFF0100   4 B   TIMER_VALUE   Current value (counts down each step)
0xFFFF0104   4 B   TIMER_RELOAD  Reload value on underflow
0xFFFF0108   4 B   TIMER_CTRL    Control register
0xFFFF010C   4 B   TIMER_STATUS  Status register
```

TIMER_CTRL bits:
- Bit 0: Enable (1 = timer running)
- Bit 1: Interrupt enable (1 = trigger interrupt on underflow)
- Bit 2: Auto-reload (1 = reload TIMER_VALUE from TIMER_RELOAD on underflow)

TIMER_STATUS bits:
- Bit 0: Interrupt pending (write 1 to clear)

Timer behavior:
- When enabled, TIMER_VALUE decrements by 1 each CPU step
- When TIMER_VALUE reaches 0:
  - TIMER_STATUS bit 0 is set
  - If interrupt enabled, INT_PENDING bit 0 is set
  - If auto-reload enabled, TIMER_VALUE is reloaded from TIMER_RELOAD

### 24.9 Interrupts (hardware interrupt system)

The simulator provides a simple interrupt mechanism.

MMIO registers:
```
Address      Size  Name          Description
─────────────────────────────────────────────────────────
0xFFFF0200   4 B   INT_ENABLE    Global interrupt enable (0 = disabled)
0xFFFF0204   4 B   INT_PENDING   Pending interrupts (read-only, write 1 to clear)
0xFFFF0208   4 B   INT_HANDLER   Interrupt handler address
0xFFFF020C   4 B   INT_SAVED_PC  Saved PC when interrupt occurs
```

INT_PENDING bits:
- Bit 0: Timer interrupt pending

Interrupt behavior:
- Before each instruction, if all conditions are met:
  - INT_ENABLE != 0
  - INT_PENDING != 0
  - INT_HANDLER != 0
  - Not already in interrupt handler
- Then:
  - INT_SAVED_PC = current PC
  - PC = INT_HANDLER
  - Enter interrupt handler mode

Return from interrupt:
- `SVC #0x20` (RETI) restores PC from INT_SAVED_PC and exits handler mode

SVC services (updated):
- `#0x20` `RETI`: Return from interrupt handler

### 24.10 Complete memory map

```
Address Range           Size      Description
─────────────────────────────────────────────────────────
0x00000000-0x000FFFFF   1 MB      RAM (configurable, default)
0x00400000-0x004025FF   9600 B    Screen framebuffer
0x00402600-0x00402603   4 B       Keyboard register
0xFFFF0000              4 B       PUTC (write byte)
0xFFFF0004              4 B       GETC (read byte)
0xFFFF0010              4 B       EXIT (write exit code)
0xFFFF0100              4 B       TIMER_VALUE
0xFFFF0104              4 B       TIMER_RELOAD
0xFFFF0108              4 B       TIMER_CTRL
0xFFFF010C              4 B       TIMER_STATUS
0xFFFF0200              4 B       INT_ENABLE
0xFFFF0204              4 B       INT_PENDING
0xFFFF0208              4 B       INT_HANDLER
0xFFFF020C              4 B       INT_SAVED_PC
```

Notes:
- RAM size is configurable (default 1 MB, max 4 MB)
- Screen and keyboard are at fixed addresses (`0x00400000`+)
- MMIO registers are at the top of the 32-bit address space
- Access outside defined regions triggers `MEM_FAULT`
- Screen/keyboard addresses work regardless of RAM size

## 25. Object file format (A32O)

Object files allow multi-file linking. Format is little-endian.

### 25.1 Header (32 bytes)
```
offset size  name        description
0x00   4     magic       ASCII "A32O"
0x04   2     version     0x0001
0x06   2     flags       reserved (0)
0x08   2     sec_count   number of sections
0x0A   2     sym_count   number of symbols
0x0C   4     sec_offset  file offset to section table
0x10   4     sym_offset  file offset to symbol table
0x14   4     rel_offset  file offset to relocation table
0x18   4     rel_count   number of relocations
0x1C   4     str_offset  file offset to string table
```

### 25.2 Section table entry (24 bytes each)
```
offset size  name        description
0x00   4     name_off    offset into string table
0x04   4     type        1=TEXT, 2=DATA, 3=BSS, 4=RODATA
0x08   4     flags       bit0 R, bit1 W, bit2 X
0x0C   4     addr        preferred vaddr (optional, linker may override)
0x10   4     size        size in bytes
0x14   4     data_off    file offset to raw section data (0 for BSS)
```

### 25.3 Symbol table entry (24 bytes each)
```
offset size  name        description
0x00   4     name_off    offset into string table
0x04   4     value       offset within section (or absolute if sec_index=0)
0x08   2     sec_index   0=ABS, 1..N=section index
0x0A   2     info        bit0: global, bit1: weak, bit2: func, bit3: object
0x0C   4     size        size in bytes (optional)
0x10   4     reserved    0
0x14   4     reserved2   0
```

### 25.4 Relocation entry (16 bytes each)
```
offset size  name        description
0x00   4     sec_index   section to patch (1..N)
0x04   4     offset      byte offset within section
0x08   2     type        1=ABS32, 2=REL_PC24, 3=REL_LDR13
0x0A   2     sym_index   symbol table index (1..sym_count)
0x0C   4     addend      signed addend
```

Relocation semantics:
- `ABS32`: write `S + A` into 32-bit word.
- `REL_PC24`: write branch immediate for `B/BL` using `S + A - (P + 4)`.
- `REL_LDR13`: write 13-bit signed immediate for PC-relative `LDR` (magnitude
  up to 8191 using U+imm13 encoding).
- If a relocation overflows its field, emit `E3003`.

### 25.6 Relocation addends
- The assembler encodes addends directly into the relocation entry (`A`).
- Syntax `@sym+imm` or `@sym-imm` produces addend `imm` with the same relocation.
- For `REL_PC24`, the addend is applied before subtracting `P+4`.

### 25.5 String table
- A sequence of null-terminated strings.
- `name_off` is an offset from the start of the string table.

## 26. Linker script format (A32LDS)

The linker accepts an optional script to control layout. The syntax is minimal
and line-based. Unknown directives are errors (`E3001`).

Directives:
```
ENTRY <symbol>
SECTION <name> BASE <addr> ALIGN <pow2>
ORDER <name1> <name2> <name3> ...
STACK <size>
SYMBOL <name> = <expr>
```

Rules:
- `<name>` is one of `text`, `rodata`, `data`, `bss`.
- `BASE` is a hex or decimal address; `ALIGN` is a power of two.
- `ORDER` defines section placement order; omitted sections use defaults.
- `STACK` defines the initial SP as `RAM_base + RAM_size - size`.
- `SYMBOL` defines an absolute symbol at link time.
- Expressions use the same grammar as assembler expressions (see 17.1).
- If the script is absent, defaults from README apply.
- Overlapping sections or overflow past RAM emit `E3001`/`E3004`.

Example:
```
ENTRY _start
SECTION text BASE 0x00000000 ALIGN 4
SECTION rodata BASE 0x00020000 ALIGN 4
SECTION data BASE 0x00022000 ALIGN 4
SECTION bss BASE 0x00030000 ALIGN 4
ORDER text rodata data bss
STACK 0x1000
SYMBOL __heap_base = 0x00040000
```

## 27. Objdump output format (A32-OBJDUMP)

The tool `a32-objdump` provides a stable text output for tooling.

### 27.1 Headers (`--headers`)
```
Sections:
Idx Name     Type    Size     VMA      Flags
1   .text    TEXT    00000040  00000000 R-X
2   .data    DATA    00000010  00020000 RW-
3   .bss     BSS     00000020  00030000 RW-
```

### 27.2 Symbols (`--syms`)
```
Symbols:
Addr     Size Type Bind Name
00000000 0004 FUNC GLOB _start
00020000 0010 OBJ  GLOB msg
```

### 27.3 Disassembly (`--disasm`)
```
Disassembly of section .text:
00000000 <_start>:
  00000000  e3a00001  MOV R0, #1
  00000004  e2800001  ADD R0, R0, #1
  00000008  ef000010  SVC #0x10
```

Rules:
- Hex values are lowercase, zero-padded to 8 digits.
- `Flags` use `R`, `W`, `X` letters, `-` for unset.
- `Type` is `FUNC`, `OBJ`, or `ABS`.

## 28. Linker map file format (A32-MAP)

The linker can emit a human-readable map file for inspection.

Format:
```
Memory Map:
RAM base 0x00000000 size 0x00100000

Sections:
.text   0x00000000  0x00000040
.rodata 0x00020000  0x00000010
.data   0x00020010  0x00000020
.bss    0x00030000  0x00000030

Symbols:
00000000 00000004 FUNC _start
00020000 00000010 OBJ  msg
00030000 00000004 OBJ  global_counter
```

Rules:
- Addresses and sizes are 8-digit hex, lowercase.
- Sections are listed in load order.
- Symbols are grouped by section order and sorted by address.

## 29. Static archive format (A32A)

Static libraries bundle multiple A32O objects. Format is little-endian.

### 29.1 Archive header (16 bytes)
```
offset size  name        description
0x00   4     magic       ASCII "A32A"
0x04   2     version     0x0001
0x06   2     count       number of members
0x08   4     table_off   file offset to member table
0x0C   4     str_off     file offset to archive string table
```

### 29.2 Member table entry (16 bytes each)
```
offset size  name        description
0x00   4     name_off    offset into archive string table
0x04   4     file_off    file offset of member data (A32O blob)
0x08   4     file_size   size of member data
0x0C   4     reserved    0
```

### 29.3 Archive string table
- Null-terminated names for members.
- `name_off` is an offset from the start of this table.

### 29.4 Linker behavior
- The linker scans archives on demand: if a symbol is undefined, it may pull in
  a member that defines it.
- If multiple members define the same global symbol, it is an error (`E3001`).

### 29.5 Optional symbol index
An archive may include a symbol index table for faster linking.

Index header (8 bytes):
```
offset size  name        description
0x00   4     magic       ASCII "A32I"
0x04   4     count       number of index entries
```

Index entry (12 bytes each):
```
offset size  name        description
0x00   4     sym_off     offset into archive string table
0x04   4     member_idx  member table index (0-based)
0x08   4     reserved    0
```

Rules:
- If present, the index starts at `str_off` and is followed by the string table.
- `sym_off` uses the same string table as member names.
- The linker may ignore the index if it is missing or invalid.
