# Carte de Référence ISA A32

## Registres

| Registre | Alias | Usage |
|----------|-------|-------|
| R0-R3 | - | Arguments / Retour (caller-saved) |
| R4-R11 | - | Variables (callee-saved) |
| R12 | IP | Scratch |
| R13 | SP | Stack Pointer |
| R14 | LR | Link Register |
| R15 | PC | Program Counter |

## Drapeaux (NZCV)

| Flag | Nom | Signification |
|------|-----|---------------|
| N | Negative | Bit 31 du résultat = 1 |
| Z | Zero | Résultat = 0 |
| C | Carry | Retenue sortante |
| V | oVerflow | Débordement signé |

## Conditions

| Cond | Signification | Flags testés |
|------|---------------|--------------|
| EQ | Equal | Z=1 |
| NE | Not Equal | Z=0 |
| CS/HS | Carry Set / Unsigned ≥ | C=1 |
| CC/LO | Carry Clear / Unsigned < | C=0 |
| MI | Minus (negative) | N=1 |
| PL | Plus (positive or zero) | N=0 |
| VS | Overflow Set | V=1 |
| VC | Overflow Clear | V=0 |
| HI | Unsigned > | C=1 et Z=0 |
| LS | Unsigned ≤ | C=0 ou Z=1 |
| GE | Signed ≥ | N=V |
| LT | Signed < | N≠V |
| GT | Signed > | Z=0 et N=V |
| LE | Signed ≤ | Z=1 ou N≠V |
| AL | Always | (défaut) |

## Instructions ALU

| Instruction | Syntaxe | Description |
|-------------|---------|-------------|
| ADD | ADD Rd, Rn, Rm/imm | Rd = Rn + Op2 |
| SUB | SUB Rd, Rn, Rm/imm | Rd = Rn - Op2 |
| RSB | RSB Rd, Rn, Rm/imm | Rd = Op2 - Rn |
| AND | AND Rd, Rn, Rm/imm | Rd = Rn & Op2 |
| ORR | ORR Rd, Rn, Rm/imm | Rd = Rn \| Op2 |
| EOR | EOR Rd, Rn, Rm/imm | Rd = Rn ^ Op2 |
| BIC | BIC Rd, Rn, Rm/imm | Rd = Rn & ~Op2 |
| MOV | MOV Rd, Rm/imm | Rd = Op2 |
| MVN | MVN Rd, Rm/imm | Rd = ~Op2 |
| CMP | CMP Rn, Rm/imm | Flags = Rn - Op2 |
| CMN | CMN Rn, Rm/imm | Flags = Rn + Op2 |
| TST | TST Rn, Rm/imm | Flags = Rn & Op2 |
| TEQ | TEQ Rn, Rm/imm | Flags = Rn ^ Op2 |
| MUL | MUL Rd, Rn, Rm | Rd = Rn * Rm |

*Ajouter `.S` pour mettre à jour les flags (ex: ADDS)*

## Instructions Load/Store

| Instruction | Syntaxe | Description |
|-------------|---------|-------------|
| LDR | LDR Rd, [Rn, #off] | Rd = Mem[Rn + off] (32 bits) |
| STR | STR Rd, [Rn, #off] | Mem[Rn + off] = Rd (32 bits) |
| LDRB | LDRB Rd, [Rn, #off] | Rd = Mem[Rn + off] (8 bits) |
| STRB | STRB Rd, [Rn, #off] | Mem[Rn + off] = Rd (8 bits) |
| LDR | LDR Rd, =value | Rd = value (via literal pool) |
| PUSH | PUSH {regs} | Empiler registres |
| POP | POP {regs} | Dépiler registres |

## Instructions de Branchement

| Instruction | Syntaxe | Description |
|-------------|---------|-------------|
| B | B label | Saut inconditionnel |
| B.cond | B.EQ label | Saut conditionnel (voir conditions) |
| BL | BL label | LR = PC+4; PC = label |
| BX | BX Rm | PC = Rm |

*Exemples : B.EQ, B.NE, B.LT, B.GE, B.GT, B.LE, B.HI, B.LO*

## Instructions Système

| Instruction | Syntaxe | Description |
|-------------|---------|-------------|
| SVC | SVC #n | Supervisor Call (n=0 pour exit) |
| NOP | NOP | No Operation |

## Directives Assembleur

| Directive | Description |
|-----------|-------------|
| .text | Section code |
| .data | Section données initialisées |
| .bss | Section données non-initialisées |
| .word val | Mot 32 bits |
| .byte val | Octet |
| .asciz "s" | Chaîne avec \0 |
| .align n | Aligner sur 2^n |
| .ltorg | Placer literal pool ici |
| .global sym | Exporter symbole |

## Memory Map

| Adresse | Usage |
|---------|-------|
| 0x00000000 | Début RAM |
| 0x00100000 | Fin RAM (1 MiB) |
| 0x00400000 | Framebuffer |
| 0xFFFF0000 | MMIO Output |
| 0xFFFF0004 | MMIO Input |
| 0xFFFF0010 | MMIO Exit |

## Encodage (32 bits)

```
[31:28] cond
[27:25] class (000=ALU reg, 001=ALU imm, 010=Mem, 011=Branch)
[24:21] opcode
[20]    S (update flags)
[19:16] Rn
[15:12] Rd
[11:0]  Op2/offset
```
