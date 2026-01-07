// HDL Chip Progression System
// Defines the learning path from NAND to CPU
// Note: We avoid reserved keywords (not, and, or, xor) by using Inv, And2, Or2, Xor2

export const HDL_CHIPS = {
    // =========================================================================
    // Project 1: Basic Logic Gates
    // =========================================================================

    'Inv': {
        project: 1,
        name: 'Inv',
        description: 'Inverter gate (NOT)',
        dependencies: [],
        template: `-- Inverter (NOT gate)
-- Inv(a) = Nand(a, a)

entity Inv is
  port(
    a : in bit;
    y : out bit
  );
end entity;

architecture rtl of Inv is
  component nand2
    port(a : in bit; b : in bit; y : out bit);
  end component;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- Inverter (NOT gate)
-- Inv(a) = Nand(a, a)

entity Inv is
  port(
    a : in bit;
    y : out bit
  );
end entity;

architecture rtl of Inv is
  component nand2
    port(a : in bit; b : in bit; y : out bit);
  end component;
begin
  u0: nand2 port map (a => a, b => a, y => y);
end architecture;
`,
        test: `// Test file for Inv (NOT gate)
// Tests all possible inputs for a 1-bit inverter

load Inv

// Test 0 -> 1
set a 0
eval
expect y 1

// Test 1 -> 0
set a 1
eval
expect y 0`,
    },

    'And2': {
        project: 1,
        name: 'And2',
        description: 'AND gate',
        dependencies: ['Inv'],
        template: `-- AND gate
-- And2(a,b) = Inv(Nand(a,b))

entity And2 is
  port(
    a : in bit;
    b : in bit;
    y : out bit
  );
end entity;

architecture rtl of And2 is
  component nand2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  component Inv
    port(a : in bit; y : out bit);
  end component;
  signal t : bit;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- AND gate
-- And2(a,b) = Inv(Nand(a,b))

entity And2 is
  port(
    a : in bit;
    b : in bit;
    y : out bit
  );
end entity;

architecture rtl of And2 is
  component nand2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  component Inv
    port(a : in bit; y : out bit);
  end component;
  signal t : bit;
begin
  u0: nand2 port map (a => a, b => b, y => t);
  u1: Inv port map (a => t, y => y);
end architecture;
`,
        test: `// Test file for And2 (AND gate)
// Tests all 4 possible input combinations

load And2

// 0 AND 0 = 0
set a 0
set b 0
eval
expect y 0

// 0 AND 1 = 0
set a 0
set b 1
eval
expect y 0

// 1 AND 0 = 0
set a 1
set b 0
eval
expect y 0

// 1 AND 1 = 1
set a 1
set b 1
eval
expect y 1`,
    },

    'Or2': {
        project: 1,
        name: 'Or2',
        description: 'OR gate',
        dependencies: ['Inv'],
        template: `-- OR gate
-- Or2(a,b) = Nand(Inv(a), Inv(b))

entity Or2 is
  port(
    a : in bit;
    b : in bit;
    y : out bit
  );
end entity;

architecture rtl of Or2 is
  component nand2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  component Inv
    port(a : in bit; y : out bit);
  end component;
  signal na, nb : bit;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- OR gate
-- Or2(a,b) = Nand(Inv(a), Inv(b))

entity Or2 is
  port(
    a : in bit;
    b : in bit;
    y : out bit
  );
end entity;

architecture rtl of Or2 is
  component nand2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  component Inv
    port(a : in bit; y : out bit);
  end component;
  signal na, nb : bit;
begin
  u0: Inv port map (a => a, y => na);
  u1: Inv port map (a => b, y => nb);
  u2: nand2 port map (a => na, b => nb, y => y);
end architecture;
`,
        test: `// Test file for Or2 (OR gate)
// Tests all 4 possible input combinations

load Or2

// 0 OR 0 = 0
set a 0
set b 0
eval
expect y 0

// 0 OR 1 = 1
set a 0
set b 1
eval
expect y 1

// 1 OR 0 = 1
set a 1
set b 0
eval
expect y 1

// 1 OR 1 = 1
set a 1
set b 1
eval
expect y 1`,
    },

    'Xor2': {
        project: 1,
        name: 'Xor2',
        description: 'XOR gate',
        dependencies: ['Inv', 'And2', 'Or2'],
        template: `-- XOR gate
-- Xor2(a,b) = Or2(And2(a, Inv(b)), And2(Inv(a), b))

entity Xor2 is
  port(
    a : in bit;
    b : in bit;
    y : out bit
  );
end entity;

architecture rtl of Xor2 is
  component Inv
    port(a : in bit; y : out bit);
  end component;
  component And2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  component Or2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  signal na, nb, t1, t2 : bit;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- XOR gate
-- Xor2(a,b) = Or2(And2(a, Inv(b)), And2(Inv(a), b))

entity Xor2 is
  port(
    a : in bit;
    b : in bit;
    y : out bit
  );
end entity;

architecture rtl of Xor2 is
  component Inv
    port(a : in bit; y : out bit);
  end component;
  component And2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  component Or2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  signal na, nb, t1, t2 : bit;
begin
  u0: Inv port map (a => a, y => na);
  u1: Inv port map (a => b, y => nb);
  u2: And2 port map (a => a, b => nb, y => t1);
  u3: And2 port map (a => na, b => b, y => t2);
  u4: Or2 port map (a => t1, b => t2, y => y);
end architecture;
`,
        test: `// Test file for Xor2 (XOR gate)
// Tests all 4 possible input combinations

load Xor2

// 0 XOR 0 = 0
set a 0
set b 0
eval
expect y 0

// 0 XOR 1 = 1
set a 0
set b 1
eval
expect y 1

// 1 XOR 0 = 1
set a 1
set b 0
eval
expect y 1

// 1 XOR 1 = 0
set a 1
set b 1
eval
expect y 0`,
    },

    'Mux': {
        project: 1,
        name: 'Mux',
        description: '2-way multiplexer',
        dependencies: ['Inv', 'And2', 'Or2'],
        template: `-- 2-way Multiplexer
-- if sel=0 then y=a else y=b

entity Mux is
  port(
    a   : in bit;
    b   : in bit;
    sel : in bit;
    y   : out bit
  );
end entity;

architecture rtl of Mux is
  component Inv
    port(a : in bit; y : out bit);
  end component;
  component And2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  component Or2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  signal nsel, t1, t2 : bit;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- 2-way Multiplexer
-- if sel=0 then y=a else y=b

entity Mux is
  port(
    a   : in bit;
    b   : in bit;
    sel : in bit;
    y   : out bit
  );
end entity;

architecture rtl of Mux is
  component Inv
    port(a : in bit; y : out bit);
  end component;
  component And2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  component Or2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  signal nsel, t1, t2 : bit;
begin
  u0: Inv port map (a => sel, y => nsel);
  u1: And2 port map (a => a, b => nsel, y => t1);
  u2: And2 port map (a => b, b => sel, y => t2);
  u3: Or2 port map (a => t1, b => t2, y => y);
end architecture;
`,
        test: `// Test file for Mux (2-way 1-bit multiplexer)
// if sel=0 then y=a else y=b
// Tests all 8 possible input combinations

load Mux

// sel=0: output should be a
set a 0
set b 0
set sel 0
eval
expect y 0

set a 0
set b 1
set sel 0
eval
expect y 0

set a 1
set b 0
set sel 0
eval
expect y 1

set a 1
set b 1
set sel 0
eval
expect y 1

// sel=1: output should be b
set a 0
set b 0
set sel 1
eval
expect y 0

set a 0
set b 1
set sel 1
eval
expect y 1

set a 1
set b 0
set sel 1
eval
expect y 0

set a 1
set b 1
set sel 1
eval
expect y 1`,
    },

    'DMux': {
        project: 1,
        name: 'DMux',
        description: 'Demultiplexer',
        dependencies: ['Inv', 'And2'],
        template: `-- Demultiplexer
-- if sel=0 then {a,b}={x,0} else {a,b}={0,x}

entity DMux is
  port(
    x   : in bit;
    sel : in bit;
    a   : out bit;
    b   : out bit
  );
end entity;

architecture rtl of DMux is
  component Inv
    port(a : in bit; y : out bit);
  end component;
  component And2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  signal nsel : bit;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- Demultiplexer
-- if sel=0 then {a,b}={x,0} else {a,b}={0,x}

entity DMux is
  port(
    x   : in bit;
    sel : in bit;
    a   : out bit;
    b   : out bit
  );
end entity;

architecture rtl of DMux is
  component Inv
    port(a : in bit; y : out bit);
  end component;
  component And2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  signal nsel : bit;
begin
  u0: Inv port map (a => sel, y => nsel);
  u1: And2 port map (a => x, b => nsel, y => a);
  u2: And2 port map (a => x, b => sel, y => b);
end architecture;
`,
        test: `// Test file for DMux (1-to-2 demultiplexer)
// if sel=0 then {a=x, b=0} else {a=0, b=x}
// Tests all 4 possible input combinations

load DMux

// sel=0: input goes to a, b=0
set x 0
set sel 0
eval
expect a 0
expect b 0

set x 1
set sel 0
eval
expect a 1
expect b 0

// sel=1: input goes to b, a=0
set x 0
set sel 1
eval
expect a 0
expect b 0

set x 1
set sel 1
eval
expect a 0
expect b 1`,
    },

    // =========================================================================
    // Project 2: Multi-bit Gates
    // =========================================================================

    'Inv16': {
        project: 2,
        name: 'Inv16',
        description: '16-bit inverter',
        dependencies: ['Inv'],
        template: `-- 16-bit Inverter
-- Applies Inv to each bit

entity Inv16 is
  port(
    a : in bits(15 downto 0);
    y : out bits(15 downto 0)
  );
end entity;

architecture rtl of Inv16 is
  component Inv
    port(a : in bit; y : out bit);
  end component;
begin
  -- Use a generate loop or instantiate 16 Inv gates
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- 16-bit Inverter
entity Inv16 is
  port(
    a : in bits(15 downto 0);
    y : out bits(15 downto 0)
  );
end entity;

architecture rtl of Inv16 is
  component Inv
    port(a : in bit; y : out bit);
  end component;
begin
  u0: Inv port map (a => a(0), y => y(0));
  u1: Inv port map (a => a(1), y => y(1));
  u2: Inv port map (a => a(2), y => y(2));
  u3: Inv port map (a => a(3), y => y(3));
  u4: Inv port map (a => a(4), y => y(4));
  u5: Inv port map (a => a(5), y => y(5));
  u6: Inv port map (a => a(6), y => y(6));
  u7: Inv port map (a => a(7), y => y(7));
  u8: Inv port map (a => a(8), y => y(8));
  u9: Inv port map (a => a(9), y => y(9));
  u10: Inv port map (a => a(10), y => y(10));
  u11: Inv port map (a => a(11), y => y(11));
  u12: Inv port map (a => a(12), y => y(12));
  u13: Inv port map (a => a(13), y => y(13));
  u14: Inv port map (a => a(14), y => y(14));
  u15: Inv port map (a => a(15), y => y(15));
end architecture;
`,
        test: `// Test file for Inv16 (16-bit NOT)
// Inverts all 16 bits

load Inv16

// All zeros -> all ones
set a 0x0000
eval
expect y 0xFFFF

// All ones -> all zeros
set a 0xFFFF
eval
expect y 0x0000

// Alternating pattern 1010...
set a 0xAAAA
eval
expect y 0x5555

// Alternating pattern 0101...
set a 0x5555
eval
expect y 0xAAAA

// High byte only
set a 0xFF00
eval
expect y 0x00FF

// Low byte only
set a 0x00FF
eval
expect y 0xFF00

// Single bit patterns
set a 0x0001
eval
expect y 0xFFFE

set a 0x8000
eval
expect y 0x7FFF

// Random pattern
set a 0x1234
eval
expect y 0xEDCB`,
    },

    'And16': {
        project: 2,
        name: 'And16',
        description: '16-bit AND',
        dependencies: ['And2'],
        template: `-- 16-bit AND
-- Applies And2 to each bit pair

entity And16 is
  port(
    a : in bits(15 downto 0);
    b : in bits(15 downto 0);
    y : out bits(15 downto 0)
  );
end entity;

architecture rtl of And16 is
  component And2
    port(a : in bit; b : in bit; y : out bit);
  end component;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- 16-bit AND
entity And16 is
  port(
    a : in bits(15 downto 0);
    b : in bits(15 downto 0);
    y : out bits(15 downto 0)
  );
end entity;

architecture rtl of And16 is
  component And2
    port(a : in bit; b : in bit; y : out bit);
  end component;
begin
  u0: And2 port map (a => a(0), b => b(0), y => y(0));
  u1: And2 port map (a => a(1), b => b(1), y => y(1));
  u2: And2 port map (a => a(2), b => b(2), y => y(2));
  u3: And2 port map (a => a(3), b => b(3), y => y(3));
  u4: And2 port map (a => a(4), b => b(4), y => y(4));
  u5: And2 port map (a => a(5), b => b(5), y => y(5));
  u6: And2 port map (a => a(6), b => b(6), y => y(6));
  u7: And2 port map (a => a(7), b => b(7), y => y(7));
  u8: And2 port map (a => a(8), b => b(8), y => y(8));
  u9: And2 port map (a => a(9), b => b(9), y => y(9));
  u10: And2 port map (a => a(10), b => b(10), y => y(10));
  u11: And2 port map (a => a(11), b => b(11), y => y(11));
  u12: And2 port map (a => a(12), b => b(12), y => y(12));
  u13: And2 port map (a => a(13), b => b(13), y => y(13));
  u14: And2 port map (a => a(14), b => b(14), y => y(14));
  u15: And2 port map (a => a(15), b => b(15), y => y(15));
end architecture;
`,
        test: `// Test file for And16 (16-bit AND)
// Bitwise AND of two 16-bit inputs

load And16

// All zeros
set a 0x0000
set b 0x0000
eval
expect y 0x0000

// AND with all ones = identity
set a 0x1234
set b 0xFFFF
eval
expect y 0x1234

// AND with all zeros = zero
set a 0x1234
set b 0x0000
eval
expect y 0x0000

// All ones
set a 0xFFFF
set b 0xFFFF
eval
expect y 0xFFFF

// Alternating patterns
set a 0xAAAA
set b 0x5555
eval
expect y 0x0000

// Same alternating
set a 0xAAAA
set b 0xAAAA
eval
expect y 0xAAAA

// Mask high byte
set a 0x1234
set b 0xFF00
eval
expect y 0x1200

// Mask low byte
set a 0x1234
set b 0x00FF
eval
expect y 0x0034

// Random patterns
set a 0xABCD
set b 0x1357
eval
expect y 0x0345`,
    },

    'Or16': {
        project: 2,
        name: 'Or16',
        description: '16-bit OR',
        dependencies: ['Or2'],
        template: `-- 16-bit OR
-- Applies Or2 to each bit pair

entity Or16 is
  port(
    a : in bits(15 downto 0);
    b : in bits(15 downto 0);
    y : out bits(15 downto 0)
  );
end entity;

architecture rtl of Or16 is
  component Or2
    port(a : in bit; b : in bit; y : out bit);
  end component;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- 16-bit OR
entity Or16 is
  port(
    a : in bits(15 downto 0);
    b : in bits(15 downto 0);
    y : out bits(15 downto 0)
  );
end entity;

architecture rtl of Or16 is
  component Or2
    port(a : in bit; b : in bit; y : out bit);
  end component;
begin
  u0: Or2 port map (a => a(0), b => b(0), y => y(0));
  u1: Or2 port map (a => a(1), b => b(1), y => y(1));
  u2: Or2 port map (a => a(2), b => b(2), y => y(2));
  u3: Or2 port map (a => a(3), b => b(3), y => y(3));
  u4: Or2 port map (a => a(4), b => b(4), y => y(4));
  u5: Or2 port map (a => a(5), b => b(5), y => y(5));
  u6: Or2 port map (a => a(6), b => b(6), y => y(6));
  u7: Or2 port map (a => a(7), b => b(7), y => y(7));
  u8: Or2 port map (a => a(8), b => b(8), y => y(8));
  u9: Or2 port map (a => a(9), b => b(9), y => y(9));
  u10: Or2 port map (a => a(10), b => b(10), y => y(10));
  u11: Or2 port map (a => a(11), b => b(11), y => y(11));
  u12: Or2 port map (a => a(12), b => b(12), y => y(12));
  u13: Or2 port map (a => a(13), b => b(13), y => y(13));
  u14: Or2 port map (a => a(14), b => b(14), y => y(14));
  u15: Or2 port map (a => a(15), b => b(15), y => y(15));
end architecture;
`,
        test: `// Test file for Or16 (16-bit OR)
// Bitwise OR of two 16-bit inputs

load Or16

// All zeros
set a 0x0000
set b 0x0000
eval
expect y 0x0000

// OR with all zeros = identity
set a 0x1234
set b 0x0000
eval
expect y 0x1234

// OR with all ones = all ones
set a 0x1234
set b 0xFFFF
eval
expect y 0xFFFF

// All ones
set a 0xFFFF
set b 0xFFFF
eval
expect y 0xFFFF

// Alternating patterns combine
set a 0xAAAA
set b 0x5555
eval
expect y 0xFFFF

// Same alternating
set a 0xAAAA
set b 0xAAAA
eval
expect y 0xAAAA

// Combine bytes
set a 0xFF00
set b 0x00FF
eval
expect y 0xFFFF

// Random patterns
set a 0xABCD
set b 0x1357
eval
expect y 0xBBDF`,
    },

    'Mux16': {
        project: 2,
        name: 'Mux16',
        description: '16-bit 2-way mux',
        dependencies: ['Mux'],
        template: `-- 16-bit 2-way Multiplexer
-- if sel=0 then y=a else y=b

entity Mux16 is
  port(
    a   : in bits(15 downto 0);
    b   : in bits(15 downto 0);
    sel : in bit;
    y   : out bits(15 downto 0)
  );
end entity;

architecture rtl of Mux16 is
  component Mux
    port(a : in bit; b : in bit; sel : in bit; y : out bit);
  end component;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- 16-bit 2-way Multiplexer
entity Mux16 is
  port(
    a   : in bits(15 downto 0);
    b   : in bits(15 downto 0);
    sel : in bit;
    y   : out bits(15 downto 0)
  );
end entity;

architecture rtl of Mux16 is
  component Mux
    port(a : in bit; b : in bit; sel : in bit; y : out bit);
  end component;
begin
  u0: Mux port map (a => a(0), b => b(0), sel => sel, y => y(0));
  u1: Mux port map (a => a(1), b => b(1), sel => sel, y => y(1));
  u2: Mux port map (a => a(2), b => b(2), sel => sel, y => y(2));
  u3: Mux port map (a => a(3), b => b(3), sel => sel, y => y(3));
  u4: Mux port map (a => a(4), b => b(4), sel => sel, y => y(4));
  u5: Mux port map (a => a(5), b => b(5), sel => sel, y => y(5));
  u6: Mux port map (a => a(6), b => b(6), sel => sel, y => y(6));
  u7: Mux port map (a => a(7), b => b(7), sel => sel, y => y(7));
  u8: Mux port map (a => a(8), b => b(8), sel => sel, y => y(8));
  u9: Mux port map (a => a(9), b => b(9), sel => sel, y => y(9));
  u10: Mux port map (a => a(10), b => b(10), sel => sel, y => y(10));
  u11: Mux port map (a => a(11), b => b(11), sel => sel, y => y(11));
  u12: Mux port map (a => a(12), b => b(12), sel => sel, y => y(12));
  u13: Mux port map (a => a(13), b => b(13), sel => sel, y => y(13));
  u14: Mux port map (a => a(14), b => b(14), sel => sel, y => y(14));
  u15: Mux port map (a => a(15), b => b(15), sel => sel, y => y(15));
end architecture;
`,
        test: `// Test file for Mux16 (16-bit 2-way multiplexer)
// if sel=0 then y=a else y=b

load Mux16

// sel=0: output a
set a 0x0000
set b 0xFFFF
set sel 0
eval
expect y 0x0000

set a 0x1234
set b 0x5678
set sel 0
eval
expect y 0x1234

set a 0xAAAA
set b 0x5555
set sel 0
eval
expect y 0xAAAA

// sel=1: output b
set a 0x0000
set b 0xFFFF
set sel 1
eval
expect y 0xFFFF

set a 0x1234
set b 0x5678
set sel 1
eval
expect y 0x5678

set a 0xAAAA
set b 0x5555
set sel 1
eval
expect y 0x5555

// Edge cases
set a 0xFFFF
set b 0xFFFF
set sel 0
eval
expect y 0xFFFF

set a 0x0000
set b 0x0000
set sel 1
eval
expect y 0x0000`,
    },

    'Or8Way': {
        project: 2,
        name: 'Or8Way',
        description: '8-way OR',
        dependencies: ['Or2'],
        template: `-- 8-way OR
-- y = a(0) OR a(1) OR ... OR a(7)

entity Or8Way is
  port(
    a : in bits(7 downto 0);
    y : out bit
  );
end entity;

architecture rtl of Or8Way is
  component Or2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  signal t1, t2, t3, t4, t5, t6 : bit;
begin
  -- Build a tree of Or2 gates
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- 8-way OR
entity Or8Way is
  port(
    a : in bits(7 downto 0);
    y : out bit
  );
end entity;

architecture rtl of Or8Way is
  component Or2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  signal t1, t2, t3, t4, t5, t6 : bit;
begin
  u0: Or2 port map (a => a(0), b => a(1), y => t1);
  u1: Or2 port map (a => a(2), b => a(3), y => t2);
  u2: Or2 port map (a => a(4), b => a(5), y => t3);
  u3: Or2 port map (a => a(6), b => a(7), y => t4);
  u4: Or2 port map (a => t1, b => t2, y => t5);
  u5: Or2 port map (a => t3, b => t4, y => t6);
  u6: Or2 port map (a => t5, b => t6, y => y);
end architecture;
`,
        test: `// Test file for Or8Way (8-input OR)
// Output is 1 if any of the 8 input bits is 1

load Or8Way

// All zeros
set a 0x00
eval
expect y 0

// All ones
set a 0xFF
eval
expect y 1

// Single bit set (each position)
set a 0x01
eval
expect y 1

set a 0x02
eval
expect y 1

set a 0x04
eval
expect y 1

set a 0x08
eval
expect y 1

set a 0x10
eval
expect y 1

set a 0x20
eval
expect y 1

set a 0x40
eval
expect y 1

set a 0x80
eval
expect y 1

// Multiple bits
set a 0xAA
eval
expect y 1

set a 0x55
eval
expect y 1`,
    },

    'Mux4Way16': {
        project: 2,
        name: 'Mux4Way16',
        description: '4-way 16-bit mux',
        dependencies: ['Mux16'],
        template: `-- 4-way 16-bit Multiplexer
-- sel: 00=a, 01=b, 10=c, 11=d

entity Mux4Way16 is
  port(
    a   : in bits(15 downto 0);
    b   : in bits(15 downto 0);
    c   : in bits(15 downto 0);
    d   : in bits(15 downto 0);
    sel : in bits(1 downto 0);
    y   : out bits(15 downto 0)
  );
end entity;

architecture rtl of Mux4Way16 is
  component Mux16
    port(a : in bits(15 downto 0); b : in bits(15 downto 0); sel : in bit; y : out bits(15 downto 0));
  end component;
  signal ab, cd : bits(15 downto 0);
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- 4-way 16-bit Multiplexer
entity Mux4Way16 is
  port(
    a   : in bits(15 downto 0);
    b   : in bits(15 downto 0);
    c   : in bits(15 downto 0);
    d   : in bits(15 downto 0);
    sel : in bits(1 downto 0);
    y   : out bits(15 downto 0)
  );
end entity;

architecture rtl of Mux4Way16 is
  component Mux16
    port(a : in bits(15 downto 0); b : in bits(15 downto 0); sel : in bit; y : out bits(15 downto 0));
  end component;
  signal ab, cd : bits(15 downto 0);
begin
  u0: Mux16 port map (a => a, b => b, sel => sel(0), y => ab);
  u1: Mux16 port map (a => c, b => d, sel => sel(0), y => cd);
  u2: Mux16 port map (a => ab, b => cd, sel => sel(1), y => y);
end architecture;
`,
        test: `// Test file for Mux4Way16 (4-way 16-bit multiplexer)
// sel=00: y=a, sel=01: y=b, sel=10: y=c, sel=11: y=d

load Mux4Way16

// Set up distinct values for each input
set a 0x1111
set b 0x2222
set c 0x3333
set d 0x4444

// Select a (sel=00)
set sel 0b00
eval
expect y 0x1111

// Select b (sel=01)
set sel 0b01
eval
expect y 0x2222

// Select c (sel=10)
set sel 0b10
eval
expect y 0x3333

// Select d (sel=11)
set sel 0b11
eval
expect y 0x4444

// Test with different values
set a 0x0000
set b 0xFFFF
set c 0xAAAA
set d 0x5555

set sel 0b00
eval
expect y 0x0000

set sel 0b01
eval
expect y 0xFFFF

set sel 0b10
eval
expect y 0xAAAA

set sel 0b11
eval
expect y 0x5555`,
    },

    'Mux8Way16': {
        project: 2,
        name: 'Mux8Way16',
        description: '8-way 16-bit mux',
        dependencies: ['Mux4Way16', 'Mux16'],
        template: `-- 8-way 16-bit Multiplexer

entity Mux8Way16 is
  port(
    a   : in bits(15 downto 0);
    b   : in bits(15 downto 0);
    c   : in bits(15 downto 0);
    d   : in bits(15 downto 0);
    e   : in bits(15 downto 0);
    f   : in bits(15 downto 0);
    g   : in bits(15 downto 0);
    h   : in bits(15 downto 0);
    sel : in bits(2 downto 0);
    y   : out bits(15 downto 0)
  );
end entity;

architecture rtl of Mux8Way16 is
  component Mux4Way16
    port(a,b,c,d : in bits(15 downto 0); sel : in bits(1 downto 0); y : out bits(15 downto 0));
  end component;
  component Mux16
    port(a : in bits(15 downto 0); b : in bits(15 downto 0); sel : in bit; y : out bits(15 downto 0));
  end component;
  signal lo, hi : bits(15 downto 0);
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- 8-way 16-bit Multiplexer
entity Mux8Way16 is
  port(
    a   : in bits(15 downto 0);
    b   : in bits(15 downto 0);
    c   : in bits(15 downto 0);
    d   : in bits(15 downto 0);
    e   : in bits(15 downto 0);
    f   : in bits(15 downto 0);
    g   : in bits(15 downto 0);
    h   : in bits(15 downto 0);
    sel : in bits(2 downto 0);
    y   : out bits(15 downto 0)
  );
end entity;

architecture rtl of Mux8Way16 is
  component Mux4Way16
    port(a,b,c,d : in bits(15 downto 0); sel : in bits(1 downto 0); y : out bits(15 downto 0));
  end component;
  component Mux16
    port(a : in bits(15 downto 0); b : in bits(15 downto 0); sel : in bit; y : out bits(15 downto 0));
  end component;
  signal lo, hi : bits(15 downto 0);
begin
  u0: Mux4Way16 port map (a => a, b => b, c => c, d => d, sel => sel(1 downto 0), y => lo);
  u1: Mux4Way16 port map (a => e, b => f, c => g, d => h, sel => sel(1 downto 0), y => hi);
  u2: Mux16 port map (a => lo, b => hi, sel => sel(2), y => y);
end architecture;
`,
        test: `load Mux8Way16
set a 0x0001
set b 0x0002
set c 0x0003
set d 0x0004
set e 0x0005
set f 0x0006
set g 0x0007
set h 0x0008
set sel 0b000
eval
expect y 0x0001
set sel 0b100
eval
expect y 0x0005
set sel 0b111
eval
expect y 0x0008
`,
    },

    'DMux4Way': {
        project: 2,
        name: 'DMux4Way',
        description: '4-way demux',
        dependencies: ['DMux'],
        template: `-- 4-way Demultiplexer
-- sel: 00->a, 01->b, 10->c, 11->d

entity DMux4Way is
  port(
    x   : in bit;
    sel : in bits(1 downto 0);
    a   : out bit;
    b   : out bit;
    c   : out bit;
    d   : out bit
  );
end entity;

architecture rtl of DMux4Way is
  component DMux
    port(x : in bit; sel : in bit; a : out bit; b : out bit);
  end component;
  signal lo, hi : bit;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- 4-way Demultiplexer
entity DMux4Way is
  port(
    x   : in bit;
    sel : in bits(1 downto 0);
    a   : out bit;
    b   : out bit;
    c   : out bit;
    d   : out bit
  );
end entity;

architecture rtl of DMux4Way is
  component DMux
    port(x : in bit; sel : in bit; a : out bit; b : out bit);
  end component;
  signal lo, hi : bit;
begin
  u0: DMux port map (x => x, sel => sel(1), a => lo, b => hi);
  u1: DMux port map (x => lo, sel => sel(0), a => a, b => b);
  u2: DMux port map (x => hi, sel => sel(0), a => c, b => d);
end architecture;
`,
        test: `// Test file for DMux4Way (1-to-4 demultiplexer)
// Routes input to one of 4 outputs based on 2-bit selector

load DMux4Way

// x=0: all outputs should be 0
set x 0
set sel 0b00
eval
expect a 0
expect b 0
expect c 0
expect d 0

set sel 0b01
eval
expect a 0
expect b 0
expect c 0
expect d 0

set sel 0b10
eval
expect a 0
expect b 0
expect c 0
expect d 0

set sel 0b11
eval
expect a 0
expect b 0
expect c 0
expect d 0

// x=1: only selected output should be 1
set x 1
set sel 0b00
eval
expect a 1
expect b 0
expect c 0
expect d 0

set sel 0b01
eval
expect a 0
expect b 1
expect c 0
expect d 0

set sel 0b10
eval
expect a 0
expect b 0
expect c 1
expect d 0

set sel 0b11
eval
expect a 0
expect b 0
expect c 0
expect d 1`,
    },

    'DMux8Way': {
        project: 2,
        name: 'DMux8Way',
        description: '8-way demux',
        dependencies: ['DMux4Way', 'DMux'],
        template: `-- 8-way Demultiplexer

entity DMux8Way is
  port(
    x   : in bit;
    sel : in bits(2 downto 0);
    a, b, c, d, e, f, g, h : out bit
  );
end entity;

architecture rtl of DMux8Way is
  component DMux
    port(x : in bit; sel : in bit; a : out bit; b : out bit);
  end component;
  component DMux4Way
    port(x : in bit; sel : in bits(1 downto 0); a,b,c,d : out bit);
  end component;
  signal lo, hi : bit;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- 8-way Demultiplexer
entity DMux8Way is
  port(
    x   : in bit;
    sel : in bits(2 downto 0);
    a, b, c, d, e, f, g, h : out bit
  );
end entity;

architecture rtl of DMux8Way is
  component DMux
    port(x : in bit; sel : in bit; a : out bit; b : out bit);
  end component;
  component DMux4Way
    port(x : in bit; sel : in bits(1 downto 0); a,b,c,d : out bit);
  end component;
  signal lo, hi : bit;
begin
  u0: DMux port map (x => x, sel => sel(2), a => lo, b => hi);
  u1: DMux4Way port map (x => lo, sel => sel(1 downto 0), a => a, b => b, c => c, d => d);
  u2: DMux4Way port map (x => hi, sel => sel(1 downto 0), a => e, b => f, c => g, d => h);
end architecture;
`,
        test: `load DMux8Way
set x 1
set sel 0b000
eval
expect a 1
expect b 0
expect h 0
set sel 0b111
eval
expect a 0
expect h 1
`,
    },

    // =========================================================================
    // Project 3: Arithmetic
    // =========================================================================

    'HalfAdder': {
        project: 3,
        name: 'HalfAdder',
        description: 'Half adder',
        dependencies: ['Xor2', 'And2'],
        template: `-- Half Adder
-- sum = a XOR b
-- carry = a AND b

entity HalfAdder is
  port(
    a     : in bit;
    b     : in bit;
    sum   : out bit;
    carry : out bit
  );
end entity;

architecture rtl of HalfAdder is
  component Xor2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  component And2
    port(a : in bit; b : in bit; y : out bit);
  end component;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- Half Adder
entity HalfAdder is
  port(
    a     : in bit;
    b     : in bit;
    sum   : out bit;
    carry : out bit
  );
end entity;

architecture rtl of HalfAdder is
  component Xor2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  component And2
    port(a : in bit; b : in bit; y : out bit);
  end component;
begin
  u0: Xor2 port map (a => a, b => b, y => sum);
  u1: And2 port map (a => a, b => b, y => carry);
end architecture;
`,
        test: `// Test file for HalfAdder
// Adds two 1-bit numbers, outputs sum and carry

load HalfAdder

// 0 + 0 = 0, carry = 0
set a 0
set b 0
eval
expect sum 0
expect carry 0

// 0 + 1 = 1, carry = 0
set a 0
set b 1
eval
expect sum 1
expect carry 0

// 1 + 0 = 1, carry = 0
set a 1
set b 0
eval
expect sum 1
expect carry 0

// 1 + 1 = 0, carry = 1 (10 in binary)
set a 1
set b 1
eval
expect sum 0
expect carry 1`,
    },

    'FullAdder': {
        project: 3,
        name: 'FullAdder',
        description: 'Full adder',
        dependencies: ['HalfAdder', 'Or2'],
        template: `-- Full Adder
-- Adds three bits: a, b, cin

entity FullAdder is
  port(
    a     : in bit;
    b     : in bit;
    cin   : in bit;
    sum   : out bit;
    cout  : out bit
  );
end entity;

architecture rtl of FullAdder is
  component HalfAdder
    port(a : in bit; b : in bit; sum : out bit; carry : out bit);
  end component;
  component Or2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  signal s1, c1, c2 : bit;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- Full Adder
entity FullAdder is
  port(
    a     : in bit;
    b     : in bit;
    cin   : in bit;
    sum   : out bit;
    cout  : out bit
  );
end entity;

architecture rtl of FullAdder is
  component HalfAdder
    port(a : in bit; b : in bit; sum : out bit; carry : out bit);
  end component;
  component Or2
    port(a : in bit; b : in bit; y : out bit);
  end component;
  signal s1, c1, c2 : bit;
begin
  u0: HalfAdder port map (a => a, b => b, sum => s1, carry => c1);
  u1: HalfAdder port map (a => s1, b => cin, sum => sum, carry => c2);
  u2: Or2 port map (a => c1, b => c2, y => cout);
end architecture;
`,
        test: `// Test file for FullAdder
// Adds three 1-bit numbers (a + b + cin), outputs sum and cout

load FullAdder

// 0 + 0 + 0 = 0, cout = 0
set a 0
set b 0
set cin 0
eval
expect sum 0
expect cout 0

// 0 + 0 + 1 = 1, cout = 0
set a 0
set b 0
set cin 1
eval
expect sum 1
expect cout 0

// 0 + 1 + 0 = 1, cout = 0
set a 0
set b 1
set cin 0
eval
expect sum 1
expect cout 0

// 0 + 1 + 1 = 0, cout = 1 (10 in binary)
set a 0
set b 1
set cin 1
eval
expect sum 0
expect cout 1

// 1 + 0 + 0 = 1, cout = 0
set a 1
set b 0
set cin 0
eval
expect sum 1
expect cout 0

// 1 + 0 + 1 = 0, cout = 1
set a 1
set b 0
set cin 1
eval
expect sum 0
expect cout 1

// 1 + 1 + 0 = 0, cout = 1
set a 1
set b 1
set cin 0
eval
expect sum 0
expect cout 1

// 1 + 1 + 1 = 1, cout = 1 (11 in binary)
set a 1
set b 1
set cin 1
eval
expect sum 1
expect cout 1`,
    },

    'Add16': {
        project: 3,
        name: 'Add16',
        description: '16-bit adder',
        dependencies: ['FullAdder'],
        template: `-- 16-bit Adder
-- Ripple-carry adder

entity Add16 is
  port(
    a    : in bits(15 downto 0);
    b    : in bits(15 downto 0);
    cin  : in bit;
    sum  : out bits(15 downto 0);
    cout : out bit
  );
end entity;

architecture rtl of Add16 is
  component FullAdder
    port(a,b,cin : in bit; sum,cout : out bit);
  end component;
  signal c : bits(15 downto 0);
begin
  -- Chain 16 FullAdders
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- 16-bit Adder
entity Add16 is
  port(
    a    : in bits(15 downto 0);
    b    : in bits(15 downto 0);
    cin  : in bit;
    sum  : out bits(15 downto 0);
    cout : out bit
  );
end entity;

architecture rtl of Add16 is
  component FullAdder
    port(a,b,cin : in bit; sum,cout : out bit);
  end component;
  signal c : bits(16 downto 0);
begin
  u0: FullAdder port map (a => a(0), b => b(0), cin => cin, sum => sum(0), cout => c(1));
  u1: FullAdder port map (a => a(1), b => b(1), cin => c(1), sum => sum(1), cout => c(2));
  u2: FullAdder port map (a => a(2), b => b(2), cin => c(2), sum => sum(2), cout => c(3));
  u3: FullAdder port map (a => a(3), b => b(3), cin => c(3), sum => sum(3), cout => c(4));
  u4: FullAdder port map (a => a(4), b => b(4), cin => c(4), sum => sum(4), cout => c(5));
  u5: FullAdder port map (a => a(5), b => b(5), cin => c(5), sum => sum(5), cout => c(6));
  u6: FullAdder port map (a => a(6), b => b(6), cin => c(6), sum => sum(6), cout => c(7));
  u7: FullAdder port map (a => a(7), b => b(7), cin => c(7), sum => sum(7), cout => c(8));
  u8: FullAdder port map (a => a(8), b => b(8), cin => c(8), sum => sum(8), cout => c(9));
  u9: FullAdder port map (a => a(9), b => b(9), cin => c(9), sum => sum(9), cout => c(10));
  u10: FullAdder port map (a => a(10), b => b(10), cin => c(10), sum => sum(10), cout => c(11));
  u11: FullAdder port map (a => a(11), b => b(11), cin => c(11), sum => sum(11), cout => c(12));
  u12: FullAdder port map (a => a(12), b => b(12), cin => c(12), sum => sum(12), cout => c(13));
  u13: FullAdder port map (a => a(13), b => b(13), cin => c(13), sum => sum(13), cout => c(14));
  u14: FullAdder port map (a => a(14), b => b(14), cin => c(14), sum => sum(14), cout => c(15));
  u15: FullAdder port map (a => a(15), b => b(15), cin => c(15), sum => sum(15), cout => cout);
end architecture;
`,
        test: `// Test file for Add16 (16-bit adder)
// Adds two 16-bit numbers with carry in

load Add16

// 0 + 0 + 0 = 0
set a 0x0000
set b 0x0000
set cin 0
eval
expect sum 0x0000

// 0 + 1 = 1
set a 0x0000
set b 0x0001
set cin 0
eval
expect sum 0x0001

// 1 + 1 = 2
set a 0x0001
set b 0x0001
set cin 0
eval
expect sum 0x0002

// Simple addition
set a 0x0005
set b 0x0003
set cin 0
eval
expect sum 0x0008

// Addition with carry propagation
set a 0x00FF
set b 0x0001
set cin 0
eval
expect sum 0x0100

// Larger numbers
set a 0x1234
set b 0x5678
set cin 0
eval
expect sum 0x68AC

// Max value
set a 0xFFFF
set b 0x0000
set cin 0
eval
expect sum 0xFFFF

// Overflow wraps around
set a 0xFFFF
set b 0x0001
set cin 0
eval
expect sum 0x0000

set a 0xFFFF
set b 0x0002
set cin 0
eval
expect sum 0x0001

// Two large numbers
set a 0x8000
set b 0x8000
set cin 0
eval
expect sum 0x0000

// With carry in
set a 0x0000
set b 0x0000
set cin 1
eval
expect sum 0x0001`,
    },

    'Inc16': {
        project: 3,
        name: 'Inc16',
        description: '16-bit incrementer',
        dependencies: ['Add16'],
        template: `-- 16-bit Incrementer
-- y = a + 1

entity Inc16 is
  port(
    a : in bits(15 downto 0);
    y : out bits(15 downto 0)
  );
end entity;

architecture rtl of Inc16 is
  component Add16
    port(a,b : in bits(15 downto 0); cin : in bit; sum : out bits(15 downto 0); cout : out bit);
  end component;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- 16-bit Incrementer
entity Inc16 is
  port(
    a : in bits(15 downto 0);
    y : out bits(15 downto 0)
  );
end entity;

architecture rtl of Inc16 is
  component Add16
    port(a,b : in bits(15 downto 0); cin : in bit; sum : out bits(15 downto 0); cout : out bit);
  end component;
  signal zero16 : bits(15 downto 0);
  signal unused_cout : bit;
begin
  zero16 <= X"0000";
  u0: Add16 port map (a => a, b => zero16, cin => '1', sum => y, cout => unused_cout);
end architecture;
`,
        test: `// Test file for Inc16 (16-bit incrementer)
// Adds 1 to a 16-bit number

load Inc16

// 0 + 1 = 1
set a 0x0000
eval
expect y 0x0001

// 1 + 1 = 2
set a 0x0001
eval
expect y 0x0002

// Carry propagation
set a 0x00FF
eval
expect y 0x0100

set a 0x0FFF
eval
expect y 0x1000

// Large number
set a 0x1234
eval
expect y 0x1235

// Max value wraps to 0
set a 0xFFFF
eval
expect y 0x0000

// Near max
set a 0xFFFE
eval
expect y 0xFFFF

// Negative number in two's complement
// -1 + 1 = 0
set a 0xFFFF
eval
expect y 0x0000

// -2 + 1 = -1
set a 0xFFFE
eval
expect y 0xFFFF`,
    },

    'Sub16': {
        project: 3,
        name: 'Sub16',
        description: '16-bit subtractor',
        dependencies: ['Add16', 'Inv16'],
        template: `-- 16-bit Subtractor
-- diff = a - b (using 2's complement: a + (~b) + 1)

entity Sub16 is
  port(
    a    : in bits(15 downto 0);
    b    : in bits(15 downto 0);
    diff : out bits(15 downto 0)
  );
end entity;

architecture rtl of Sub16 is
  component Add16
    port(a,b : in bits(15 downto 0); cin : in bit; sum : out bits(15 downto 0); cout : out bit);
  end component;
  component Inv16
    port(a : in bits(15 downto 0); y : out bits(15 downto 0));
  end component;
  signal nb : bits(15 downto 0);
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- 16-bit Subtractor
entity Sub16 is
  port(
    a    : in bits(15 downto 0);
    b    : in bits(15 downto 0);
    diff : out bits(15 downto 0)
  );
end entity;

architecture rtl of Sub16 is
  component Add16
    port(a,b : in bits(15 downto 0); cin : in bit; sum : out bits(15 downto 0); cout : out bit);
  end component;
  component Inv16
    port(a : in bits(15 downto 0); y : out bits(15 downto 0));
  end component;
  signal nb : bits(15 downto 0);
  signal unused_cout : bit;
begin
  u0: Inv16 port map (a => b, y => nb);
  u1: Add16 port map (a => a, b => nb, cin => '1', sum => diff, cout => unused_cout);
end architecture;
`,
        test: `load Sub16
set a 0x0005
set b 0x0003
eval
expect diff 0x0002
set a 0x0000
set b 0x0001
eval
expect diff 0xFFFF
`,
    },

    'ALU': {
        project: 3,
        name: 'ALU',
        description: '16-bit ALU',
        dependencies: ['Add16', 'And16', 'Or16', 'Inv16', 'Mux4Way16', 'Or8Way'],
        template: `-- 16-bit ALU
-- op: 0=AND, 1=OR, 2=ADD, 3=SUB
-- flags: zero, negative

entity ALU is
  port(
    a    : in bits(15 downto 0);
    b    : in bits(15 downto 0);
    op   : in bits(1 downto 0);
    y    : out bits(15 downto 0);
    zero : out bit;
    neg  : out bit
  );
end entity;

architecture rtl of ALU is
  component Add16
    port(a,b : in bits(15 downto 0); cin : in bit; sum : out bits(15 downto 0); cout : out bit);
  end component;
  component And16
    port(a,b : in bits(15 downto 0); y : out bits(15 downto 0));
  end component;
  component Or16
    port(a,b : in bits(15 downto 0); y : out bits(15 downto 0));
  end component;
  component Inv16
    port(a : in bits(15 downto 0); y : out bits(15 downto 0));
  end component;
  component Mux4Way16
    port(a,b,c,d : in bits(15 downto 0); sel : in bits(1 downto 0); y : out bits(15 downto 0));
  end component;
  component Or8Way
    port(a : in bits(7 downto 0); y : out bit);
  end component;
  signal r_and, r_or, r_add, r_sub, nb, result : bits(15 downto 0);
begin
  -- YOUR CODE HERE
end architecture;
`,
        test: `// Test file for ALU (16-bit Arithmetic Logic Unit)
// Operations: op=00: AND, op=01: OR, op=10: ADD, op=11: SUB
// Flags: zero (result is 0), neg (result is negative/MSB set)

load ALU

// ========== AND (op=00) ==========
set a 0x00FF
set b 0x0F0F
set op 0b00
eval
expect y 0x000F
expect zero 0
expect neg 0

set a 0xFFFF
set b 0xFFFF
set op 0b00
eval
expect y 0xFFFF
expect zero 0
expect neg 1

set a 0xAAAA
set b 0x5555
set op 0b00
eval
expect y 0x0000
expect zero 1
expect neg 0

// ========== OR (op=01) ==========
set a 0x00FF
set b 0x0F0F
set op 0b01
eval
expect y 0x0FFF
expect zero 0
expect neg 0

set a 0xAAAA
set b 0x5555
set op 0b01
eval
expect y 0xFFFF
expect zero 0
expect neg 1

set a 0x0000
set b 0x0000
set op 0b01
eval
expect y 0x0000
expect zero 1
expect neg 0

// ========== ADD (op=10) ==========
set a 0x0001
set b 0x0002
set op 0b10
eval
expect y 0x0003
expect zero 0
expect neg 0

set a 0x0000
set b 0x0000
set op 0b10
eval
expect y 0x0000
expect zero 1
expect neg 0

set a 0xFFFF
set b 0x0001
set op 0b10
eval
expect y 0x0000
expect zero 1
expect neg 0

set a 0x7FFF
set b 0x0001
set op 0b10
eval
expect y 0x8000
expect zero 0
expect neg 1

set a 0x1234
set b 0x5678
set op 0b10
eval
expect y 0x68AC
expect zero 0
expect neg 0

// ========== SUB (op=11) ==========
set a 0x0003
set b 0x0001
set op 0b11
eval
expect y 0x0002
expect zero 0
expect neg 0

set a 0x0001
set b 0x0001
set op 0b11
eval
expect y 0x0000
expect zero 1
expect neg 0

set a 0x0001
set b 0x0002
set op 0b11
eval
expect y 0xFFFF
expect zero 0
expect neg 1

set a 0x0000
set b 0x0001
set op 0b11
eval
expect y 0xFFFF
expect zero 0
expect neg 1

set a 0x5678
set b 0x1234
set op 0b11
eval
expect y 0x4444
expect zero 0
expect neg 0

// ========== Edge cases ==========
// Large positive - large positive
set a 0x8000
set b 0x8000
set op 0b11
eval
expect y 0x0000
expect zero 1
expect neg 0

// Test all operations with same inputs
set a 0x1234
set b 0x00FF

set op 0b00
eval
expect y 0x0034

set op 0b01
eval
expect y 0x12FF

set op 0b10
eval
expect y 0x1333

set op 0b11
eval
expect y 0x1135`,
        solution: `-- 16-bit ALU
-- op: 0=AND, 1=OR, 2=ADD, 3=SUB

entity ALU is
  port(
    a    : in bits(15 downto 0);
    b    : in bits(15 downto 0);
    op   : in bits(1 downto 0);
    y    : out bits(15 downto 0);
    zero : out bit;
    neg  : out bit
  );
end entity;

architecture rtl of ALU is
  component Add16
    port(a,b : in bits(15 downto 0); cin : in bit; sum : out bits(15 downto 0); cout : out bit);
  end component;
  component And16
    port(a,b : in bits(15 downto 0); y : out bits(15 downto 0));
  end component;
  component Or16
    port(a,b : in bits(15 downto 0); y : out bits(15 downto 0));
  end component;
  component Inv16
    port(a : in bits(15 downto 0); y : out bits(15 downto 0));
  end component;
  component Mux4Way16
    port(a,b,c,d : in bits(15 downto 0); sel : in bits(1 downto 0); y : out bits(15 downto 0));
  end component;
  component Or8Way
    port(a : in bits(7 downto 0); y : out bit);
  end component;
  signal r_and, r_or, r_add, r_sub, nb, result : bits(15 downto 0);
  signal unused_cout1, unused_cout2 : bit;
  signal or_lo, or_hi : bit;
begin
  -- Compute all operations
  u_and: And16 port map (a => a, b => b, y => r_and);
  u_or: Or16 port map (a => a, b => b, y => r_or);
  u_add: Add16 port map (a => a, b => b, cin => '0', sum => r_add, cout => unused_cout1);

  -- SUB: a - b = a + (~b) + 1
  u_inv: Inv16 port map (a => b, y => nb);
  u_sub: Add16 port map (a => a, b => nb, cin => '1', sum => r_sub, cout => unused_cout2);

  -- Select result based on op
  u_mux: Mux4Way16 port map (a => r_and, b => r_or, c => r_add, d => r_sub, sel => op, y => result);

  -- Output result
  y <= result;

  -- Zero flag: result == 0
  u_or_lo: Or8Way port map (a => result(7 downto 0), y => or_lo);
  u_or_hi: Or8Way port map (a => result(15 downto 8), y => or_hi);
  zero <= not (or_lo or or_hi);

  -- Negative flag: MSB of result
  neg <= result(15);
end architecture;
`,
    },

    'And8': {
        project: 3,
        name: 'And8',
        description: 'AND 8-bit avec masque (pour produits partiels)',
        dependencies: ['And2'],
        template: `-- AND 8-bit avec masque
-- Chaque bit de a est ANDé avec le même bit b
-- Utile pour générer des produits partiels dans un multiplicateur

entity And8 is
  port(
    a : in bits(7 downto 0);
    b : in bit;
    y : out bits(7 downto 0)
  );
end entity;

architecture rtl of And8 is
  component And2
    port(a : in bit; b : in bit; y : out bit);
  end component;
begin
  -- YOUR CODE HERE
  -- Instancier 8 portes And2, une pour chaque bit
end architecture;
`,
        solution: `-- AND 8-bit avec masque
entity And8 is
  port(
    a : in bits(7 downto 0);
    b : in bit;
    y : out bits(7 downto 0)
  );
end entity;

architecture rtl of And8 is
  component And2
    port(a : in bit; b : in bit; y : out bit);
  end component;
begin
  u0: And2 port map (a => a(0), b => b, y => y(0));
  u1: And2 port map (a => a(1), b => b, y => y(1));
  u2: And2 port map (a => a(2), b => b, y => y(2));
  u3: And2 port map (a => a(3), b => b, y => y(3));
  u4: And2 port map (a => a(4), b => b, y => y(4));
  u5: And2 port map (a => a(5), b => b, y => y(5));
  u6: And2 port map (a => a(6), b => b, y => y(6));
  u7: And2 port map (a => a(7), b => b, y => y(7));
end architecture;
`,
        test: `load And8
set a 0x00
set b 0
eval
expect y 0x00
set a 0xFF
set b 0
eval
expect y 0x00
set a 0xFF
set b 1
eval
expect y 0xFF
set a 0xA5
set b 1
eval
expect y 0xA5
set a 0x3C
set b 1
eval
expect y 0x3C
`,
    },

    'Mul8': {
        project: 3,
        name: 'Mul8',
        description: 'Multiplicateur 8-bit (produit 16-bit)',
        dependencies: ['And8', 'Add16'],
        template: `-- Multiplicateur 8-bit non signé
-- y = a * b (8-bit × 8-bit = 16-bit)
--
-- Algorithme par produits partiels:
-- Pour chaque bit b[i], on génère pp_i = a AND b[i]
-- Puis on décale pp_i de i positions vers la gauche
-- Enfin on additionne tous les produits partiels

entity Mul8 is
  port(
    a : in bits(7 downto 0);
    b : in bits(7 downto 0);
    y : out bits(15 downto 0)
  );
end entity;

architecture rtl of Mul8 is
  component And8
    port(a : in bits(7 downto 0); b : in bit; y : out bits(7 downto 0));
  end component;

  component Add16
    port(a : in bits(15 downto 0); b : in bits(15 downto 0); cin : in bit;
         sum : out bits(15 downto 0); cout : out bit);
  end component;

  -- Produits partiels (8 bits chacun)
  signal pp0, pp1, pp2, pp3, pp4, pp5, pp6, pp7 : bits(7 downto 0);

  -- Produits partiels étendus et décalés (16 bits)
  signal ext0, ext1, ext2, ext3, ext4, ext5, ext6, ext7 : bits(15 downto 0);

  -- Sommes intermédiaires
  signal sum01, sum23, sum45, sum67 : bits(15 downto 0);
  signal sum0123, sum4567 : bits(15 downto 0);

begin
  -- YOUR CODE HERE
  -- 1. Générer les 8 produits partiels avec And8
  -- 2. Étendre chaque pp à 16 bits avec décalage approprié
  -- 3. Additionner en arbre avec Add16
end architecture;
`,
        solution: `-- Multiplicateur 8-bit non signé
entity Mul8 is
  port(
    a : in bits(7 downto 0);
    b : in bits(7 downto 0);
    y : out bits(15 downto 0)
  );
end entity;

architecture rtl of Mul8 is
  component And8
    port(a : in bits(7 downto 0); b : in bit; y : out bits(7 downto 0));
  end component;

  component Add16
    port(a : in bits(15 downto 0); b : in bits(15 downto 0); cin : in bit;
         sum : out bits(15 downto 0); cout : out bit);
  end component;

  signal pp0, pp1, pp2, pp3, pp4, pp5, pp6, pp7 : bits(7 downto 0);
  signal ext0, ext1, ext2, ext3, ext4, ext5, ext6, ext7 : bits(15 downto 0);
  signal s01, s23, s45, s67 : bits(15 downto 0);
  signal s0123, s4567 : bits(15 downto 0);
  signal c1, c2, c3, c4, c5, c6, c7 : bit;

begin
  -- Generate partial products
  and0: And8 port map (a => a, b => b(0), y => pp0);
  and1: And8 port map (a => a, b => b(1), y => pp1);
  and2: And8 port map (a => a, b => b(2), y => pp2);
  and3: And8 port map (a => a, b => b(3), y => pp3);
  and4: And8 port map (a => a, b => b(4), y => pp4);
  and5: And8 port map (a => a, b => b(5), y => pp5);
  and6: And8 port map (a => a, b => b(6), y => pp6);
  and7: And8 port map (a => a, b => b(7), y => pp7);

  -- Extend and shift partial products using concatenation
  ext0 <= x"00" & pp0;
  ext1 <= b"0000000" & pp1 & '0';
  ext2 <= b"000000" & pp2 & b"00";
  ext3 <= b"00000" & pp3 & b"000";
  ext4 <= x"0" & pp4 & x"0";
  ext5 <= b"000" & pp5 & b"00000";
  ext6 <= b"00" & pp6 & b"000000";
  ext7 <= '0' & pp7 & b"0000000";

  -- Addition en arbre (3 niveaux)
  add01: Add16 port map (a => ext0, b => ext1, cin => '0', sum => s01, cout => c1);
  add23: Add16 port map (a => ext2, b => ext3, cin => '0', sum => s23, cout => c2);
  add45: Add16 port map (a => ext4, b => ext5, cin => '0', sum => s45, cout => c3);
  add67: Add16 port map (a => ext6, b => ext7, cin => '0', sum => s67, cout => c4);

  add0123: Add16 port map (a => s01, b => s23, cin => '0', sum => s0123, cout => c5);
  add4567: Add16 port map (a => s45, b => s67, cin => '0', sum => s4567, cout => c6);

  add_final: Add16 port map (a => s0123, b => s4567, cin => '0', sum => y, cout => c7);
end architecture;
`,
        test: `load Mul8
set a 0x00
set b 0x00
eval
expect y 0x0000
set a 0x01
set b 0x01
eval
expect y 0x0001
set a 0x02
set b 0x03
eval
expect y 0x0006
set a 0x05
set b 0x07
eval
expect y 0x0023
set a 0x0F
set b 0x0F
eval
expect y 0x00E1
set a 0x10
set b 0x10
eval
expect y 0x0100
set a 0xFF
set b 0x02
eval
expect y 0x01FE
set a 0xFF
set b 0xFF
eval
expect y 0xFE01
`,
    },

    // =========================================================================
    // Project 4: Sequential Logic
    // =========================================================================

    'DFF1': {
        project: 4,
        name: 'DFF1',
        description: 'D flip-flop (primitive)',
        dependencies: [],
        template: `-- D Flip-Flop
-- Uses the built-in dff primitive

entity DFF1 is
  port(
    clk : in bit;
    d   : in bit;
    q   : out bit
  );
end entity;

architecture rtl of DFF1 is
  component dff
    port(clk : in bit; d : in bit; q : out bit);
  end component;
begin
  u0: dff port map (clk => clk, d => d, q => q);
end architecture;
`,
        solution: `-- D Flip-Flop
-- Uses the built-in dff primitive

entity DFF1 is
  port(
    clk : in bit;
    d   : in bit;
    q   : out bit
  );
end entity;

architecture rtl of DFF1 is
  component dff
    port(clk : in bit; d : in bit; q : out bit);
  end component;
begin
  u0: dff port map (clk => clk, d => d, q => q);
end architecture;
`,
        test: `// Test file for DFF1 (D Flip-Flop)
// Output follows input on clock edge

load DFF1

// Initial state (after reset)
set d 0
tick
tock
expect q 0

// Set to 1
set d 1
tick
tock
expect q 1

// Hold 1
set d 1
tick
tock
expect q 1

// Set back to 0
set d 0
tick
tock
expect q 0

// Verify data only changes on clock edge
set d 1
// Before clock, output should still be 0
tick
// Rising edge captures d=1
tock
expect q 1

// Change input but don't clock
set d 0
// Output should still be 1 (no clock yet)
expect q 1
tick
tock
expect q 0`,
    },

    'BitReg': {
        project: 4,
        name: 'BitReg',
        description: '1-bit register',
        dependencies: ['DFF1', 'Mux'],
        template: `-- 1-bit Register
-- if load=1 then q=d else q=previous

entity BitReg is
  port(
    clk  : in bit;
    d    : in bit;
    load : in bit;
    q    : out bit
  );
end entity;

architecture rtl of BitReg is
  component dff
    port(clk : in bit; d : in bit; q : out bit);
  end component;
  component Mux
    port(a,b : in bit; sel : in bit; y : out bit);
  end component;
  signal mux_out, q_int : bit;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- 1-bit Register
entity BitReg is
  port(
    clk  : in bit;
    d    : in bit;
    load : in bit;
    q    : out bit
  );
end entity;

architecture rtl of BitReg is
  component dff
    port(clk : in bit; d : in bit; q : out bit);
  end component;
  component Mux
    port(a,b : in bit; sel : in bit; y : out bit);
  end component;
  signal mux_out, q_int : bit;
begin
  u_mux: Mux port map (a => q_int, b => d, sel => load, y => mux_out);
  u_dff: dff port map (clk => clk, d => mux_out, q => q_int);
  q <= q_int;
end architecture;
`,
        test: `// Test file for BitReg (1-bit register with load enable)
// Only loads new value when load=1

load BitReg

// Initial state
set d 0
set load 0
tick
tock
expect q 0

// Try to load 1 without load enable
set d 1
set load 0
tick
tock
expect q 0

// Load 1 with load enable
set d 1
set load 1
tick
tock
expect q 1

// Hold value (load disabled)
set d 0
set load 0
tick
tock
expect q 1

// Still holding
set d 0
set load 0
tick
tock
expect q 1

// Load 0
set d 0
set load 1
tick
tock
expect q 0

// Load sequence
set d 1
set load 1
tick
tock
expect q 1

set d 0
set load 1
tick
tock
expect q 0

set d 1
set load 1
tick
tock
expect q 1`,
    },

    'Register16': {
        project: 4,
        name: 'Register16',
        description: '16-bit register',
        dependencies: ['BitReg'],
        template: `-- 16-bit Register

entity Register16 is
  port(
    clk  : in bit;
    d    : in bits(15 downto 0);
    load : in bit;
    q    : out bits(15 downto 0)
  );
end entity;

architecture rtl of Register16 is
  component BitReg
    port(clk : in bit; d : in bit; load : in bit; q : out bit);
  end component;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- 16-bit Register
entity Register16 is
  port(
    clk  : in bit;
    d    : in bits(15 downto 0);
    load : in bit;
    q    : out bits(15 downto 0)
  );
end entity;

architecture rtl of Register16 is
  component BitReg
    port(clk : in bit; d : in bit; load : in bit; q : out bit);
  end component;
begin
  u0: BitReg port map (clk => clk, d => d(0), load => load, q => q(0));
  u1: BitReg port map (clk => clk, d => d(1), load => load, q => q(1));
  u2: BitReg port map (clk => clk, d => d(2), load => load, q => q(2));
  u3: BitReg port map (clk => clk, d => d(3), load => load, q => q(3));
  u4: BitReg port map (clk => clk, d => d(4), load => load, q => q(4));
  u5: BitReg port map (clk => clk, d => d(5), load => load, q => q(5));
  u6: BitReg port map (clk => clk, d => d(6), load => load, q => q(6));
  u7: BitReg port map (clk => clk, d => d(7), load => load, q => q(7));
  u8: BitReg port map (clk => clk, d => d(8), load => load, q => q(8));
  u9: BitReg port map (clk => clk, d => d(9), load => load, q => q(9));
  u10: BitReg port map (clk => clk, d => d(10), load => load, q => q(10));
  u11: BitReg port map (clk => clk, d => d(11), load => load, q => q(11));
  u12: BitReg port map (clk => clk, d => d(12), load => load, q => q(12));
  u13: BitReg port map (clk => clk, d => d(13), load => load, q => q(13));
  u14: BitReg port map (clk => clk, d => d(14), load => load, q => q(14));
  u15: BitReg port map (clk => clk, d => d(15), load => load, q => q(15));
end architecture;
`,
        test: `// Test file for Register16 (16-bit register with load enable)
// Only loads new value when load=1

load Register16

// Initial state
set d 0x0000
set load 0
tick
tock
expect q 0x0000

// Try to change without load
set d 0x1234
set load 0
tick
tock
expect q 0x0000

// Load a value
set d 0x1234
set load 1
tick
tock
expect q 0x1234

// Hold value
set d 0x5678
set load 0
tick
tock
expect q 0x1234

// Load new value
set d 0x5678
set load 1
tick
tock
expect q 0x5678

// Load all ones
set d 0xFFFF
set load 1
tick
tock
expect q 0xFFFF

// Load all zeros
set d 0x0000
set load 1
tick
tock
expect q 0x0000

// Alternating pattern
set d 0xAAAA
set load 1
tick
tock
expect q 0xAAAA

// Hold
set d 0x5555
set load 0
tick
tock
expect q 0xAAAA

// Finally load the new pattern
set d 0x5555
set load 1
tick
tock
expect q 0x5555`,
    },

    'PC': {
        project: 4,
        name: 'PC',
        description: 'Program Counter',
        dependencies: ['Register16', 'Inc16', 'Mux16'],
        template: `-- Program Counter
-- inc: increment, load: load d, reset: set to 0
-- Priority: reset > load > inc

entity PC is
  port(
    clk   : in bit;
    d     : in bits(15 downto 0);
    inc   : in bit;
    load  : in bit;
    reset : in bit;
    q     : out bits(15 downto 0)
  );
end entity;

architecture rtl of PC is
  component Register16
    port(clk : in bit; d : in bits(15 downto 0); load : in bit; q : out bits(15 downto 0));
  end component;
  component Inc16
    port(a : in bits(15 downto 0); y : out bits(15 downto 0));
  end component;
  component Mux16
    port(a,b : in bits(15 downto 0); sel : in bit; y : out bits(15 downto 0));
  end component;
  signal q_int, inc_out, next_val : bits(15 downto 0);
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- Program Counter
entity PC is
  port(
    clk   : in bit;
    d     : in bits(15 downto 0);
    inc   : in bit;
    load  : in bit;
    reset : in bit;
    q     : out bits(15 downto 0)
  );
end entity;

architecture rtl of PC is
  component Register16
    port(clk : in bit; d : in bits(15 downto 0); load : in bit; q : out bits(15 downto 0));
  end component;
  component Inc16
    port(a : in bits(15 downto 0); y : out bits(15 downto 0));
  end component;
  component Mux16
    port(a,b : in bits(15 downto 0); sel : in bit; y : out bits(15 downto 0));
  end component;
  signal q_int, inc_out, mux1_out, mux2_out, mux3_out : bits(15 downto 0);
  signal zero16 : bits(15 downto 0);
  signal do_load : bit;
begin
  zero16 <= X"0000";

  -- Increment current value
  u_inc: Inc16 port map (a => q_int, y => inc_out);

  -- Priority: reset > load > inc
  -- First mux: inc or hold
  u_mux1: Mux16 port map (a => q_int, b => inc_out, sel => inc, y => mux1_out);
  -- Second mux: load overrides
  u_mux2: Mux16 port map (a => mux1_out, b => d, sel => load, y => mux2_out);
  -- Third mux: reset overrides all
  u_mux3: Mux16 port map (a => mux2_out, b => zero16, sel => reset, y => mux3_out);

  -- Always load the register
  do_load <= inc or load or reset;
  u_reg: Register16 port map (clk => clk, d => mux3_out, load => do_load, q => q_int);

  q <= q_int;
end architecture;
`,
        test: `// Test file for PC (Program Counter)
// Supports: reset, load, increment
// Priority: reset > load > inc

load PC

// Initial state (reset)
set d 0x0000
set load 0
set inc 0
set reset 1
tick
tock
expect q 0x0000

// Increment
set reset 0
set load 0
set inc 1
tick
tock
expect q 0x0001

// Keep incrementing
set inc 1
tick
tock
expect q 0x0002

set inc 1
tick
tock
expect q 0x0003

// Hold (no operation)
set inc 0
tick
tock
expect q 0x0003

// Load a value
set d 0x1000
set load 1
set inc 0
tick
tock
expect q 0x1000

// Increment from loaded value
set load 0
set inc 1
tick
tock
expect q 0x1001

// Load has priority over inc
set d 0x2000
set load 1
set inc 1
tick
tock
expect q 0x2000

// Reset has priority over all
set d 0x3000
set reset 1
set load 1
set inc 1
tick
tock
expect q 0x0000

// Back to normal increment
set reset 0
set load 0
set inc 1
tick
tock
expect q 0x0001

// Test overflow (wrap around)
set d 0xFFFF
set load 1
set inc 0
tick
tock
expect q 0xFFFF

set load 0
set inc 1
tick
tock
expect q 0x0000`,
    },

    'RAM8': {
        project: 4,
        name: 'RAM8',
        description: '8-word RAM',
        dependencies: ['Register16', 'DMux8Way', 'Mux8Way16'],
        template: `-- 8-word RAM (16-bit words)

entity RAM8 is
  port(
    clk  : in bit;
    din  : in bits(15 downto 0);
    addr : in bits(2 downto 0);
    we   : in bit;
    dout : out bits(15 downto 0)
  );
end entity;

architecture rtl of RAM8 is
  component Register16
    port(clk : in bit; d : in bits(15 downto 0); load : in bit; q : out bits(15 downto 0));
  end component;
  component DMux8Way
    port(x : in bit; sel : in bits(2 downto 0); a,b,c,d,e,f,g,h : out bit);
  end component;
  component Mux8Way16
    port(a,b,c,d,e,f,g,h : in bits(15 downto 0); sel : in bits(2 downto 0); y : out bits(15 downto 0));
  end component;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- 8-word RAM
entity RAM8 is
  port(
    clk  : in bit;
    din  : in bits(15 downto 0);
    addr : in bits(2 downto 0);
    we   : in bit;
    dout : out bits(15 downto 0)
  );
end entity;

architecture rtl of RAM8 is
  component Register16
    port(clk : in bit; d : in bits(15 downto 0); load : in bit; q : out bits(15 downto 0));
  end component;
  component DMux8Way
    port(x : in bit; sel : in bits(2 downto 0); a,b,c,d,e,f,g,h : out bit);
  end component;
  component Mux8Way16
    port(a,b,c,d,e,f,g,h : in bits(15 downto 0); sel : in bits(2 downto 0); y : out bits(15 downto 0));
  end component;
  signal load0,load1,load2,load3,load4,load5,load6,load7 : bit;
  signal r0,r1,r2,r3,r4,r5,r6,r7 : bits(15 downto 0);
begin
  u_dmux: DMux8Way port map (x => we, sel => addr, a => load0, b => load1, c => load2, d => load3, e => load4, f => load5, g => load6, h => load7);

  u_r0: Register16 port map (clk => clk, d => din, load => load0, q => r0);
  u_r1: Register16 port map (clk => clk, d => din, load => load1, q => r1);
  u_r2: Register16 port map (clk => clk, d => din, load => load2, q => r2);
  u_r3: Register16 port map (clk => clk, d => din, load => load3, q => r3);
  u_r4: Register16 port map (clk => clk, d => din, load => load4, q => r4);
  u_r5: Register16 port map (clk => clk, d => din, load => load5, q => r5);
  u_r6: Register16 port map (clk => clk, d => din, load => load6, q => r6);
  u_r7: Register16 port map (clk => clk, d => din, load => load7, q => r7);

  u_mux: Mux8Way16 port map (a => r0, b => r1, c => r2, d => r3, e => r4, f => r5, g => r6, h => r7, sel => addr, y => dout);
end architecture;
`,
        test: `// Test file for RAM8 (8-word RAM)
// 8 16-bit registers addressable by 3-bit address

load RAM8

// Write to address 0
set din 0x1111
set addr 0b000
set we 1
tick
tock
expect dout 0x1111

// Write to address 1
set din 0x2222
set addr 0b001
set we 1
tick
tock
expect dout 0x2222

// Write to address 7
set din 0x7777
set addr 0b111
set we 1
tick
tock
expect dout 0x7777

// Read back address 0 (no write)
set we 0
set addr 0b000
tick
tock
expect dout 0x1111

// Read back address 1
set addr 0b001
tick
tock
expect dout 0x2222

// Read back address 7
set addr 0b111
tick
tock
expect dout 0x7777

// Write to all addresses
set we 1
set din 0xAAAA
set addr 0b010
tick
tock
expect dout 0xAAAA

set din 0xBBBB
set addr 0b011
tick
tock
expect dout 0xBBBB

set din 0xCCCC
set addr 0b100
tick
tock
expect dout 0xCCCC

set din 0xDDDD
set addr 0b101
tick
tock
expect dout 0xDDDD

set din 0xEEEE
set addr 0b110
tick
tock
expect dout 0xEEEE

// Verify all values preserved
set we 0
set addr 0b000
tick
tock
expect dout 0x1111

set addr 0b001
tick
tock
expect dout 0x2222

set addr 0b010
tick
tock
expect dout 0xAAAA

set addr 0b011
tick
tock
expect dout 0xBBBB

set addr 0b100
tick
tock
expect dout 0xCCCC

set addr 0b101
tick
tock
expect dout 0xDDDD

set addr 0b110
tick
tock
expect dout 0xEEEE

set addr 0b111
tick
tock
expect dout 0x7777`,
    },

    'RAM64': {
        project: 4,
        name: 'RAM64',
        description: '64-word RAM',
        dependencies: ['RAM8', 'DMux8Way', 'Mux8Way16'],
        template: `-- 64-word RAM (16-bit words)

entity RAM64 is
  port(
    clk  : in bit;
    din  : in bits(15 downto 0);
    addr : in bits(5 downto 0);
    we   : in bit;
    dout : out bits(15 downto 0)
  );
end entity;

architecture rtl of RAM64 is
  component RAM8
    port(clk : in bit; din : in bits(15 downto 0); addr : in bits(2 downto 0); we : in bit; dout : out bits(15 downto 0));
  end component;
  component DMux8Way
    port(x : in bit; sel : in bits(2 downto 0); a,b,c,d,e,f,g,h : out bit);
  end component;
  component Mux8Way16
    port(a,b,c,d,e,f,g,h : in bits(15 downto 0); sel : in bits(2 downto 0); y : out bits(15 downto 0));
  end component;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- 64-word RAM
entity RAM64 is
  port(
    clk  : in bit;
    din  : in bits(15 downto 0);
    addr : in bits(5 downto 0);
    we   : in bit;
    dout : out bits(15 downto 0)
  );
end entity;

architecture rtl of RAM64 is
  component RAM8
    port(clk : in bit; din : in bits(15 downto 0); addr : in bits(2 downto 0); we : in bit; dout : out bits(15 downto 0));
  end component;
  component DMux8Way
    port(x : in bit; sel : in bits(2 downto 0); a,b,c,d,e,f,g,h : out bit);
  end component;
  component Mux8Way16
    port(a,b,c,d,e,f,g,h : in bits(15 downto 0); sel : in bits(2 downto 0); y : out bits(15 downto 0));
  end component;
  signal we0,we1,we2,we3,we4,we5,we6,we7 : bit;
  signal r0,r1,r2,r3,r4,r5,r6,r7 : bits(15 downto 0);
begin
  u_dmux: DMux8Way port map (x => we, sel => addr(5 downto 3), a => we0, b => we1, c => we2, d => we3, e => we4, f => we5, g => we6, h => we7);

  u_ram0: RAM8 port map (clk => clk, din => din, addr => addr(2 downto 0), we => we0, dout => r0);
  u_ram1: RAM8 port map (clk => clk, din => din, addr => addr(2 downto 0), we => we1, dout => r1);
  u_ram2: RAM8 port map (clk => clk, din => din, addr => addr(2 downto 0), we => we2, dout => r2);
  u_ram3: RAM8 port map (clk => clk, din => din, addr => addr(2 downto 0), we => we3, dout => r3);
  u_ram4: RAM8 port map (clk => clk, din => din, addr => addr(2 downto 0), we => we4, dout => r4);
  u_ram5: RAM8 port map (clk => clk, din => din, addr => addr(2 downto 0), we => we5, dout => r5);
  u_ram6: RAM8 port map (clk => clk, din => din, addr => addr(2 downto 0), we => we6, dout => r6);
  u_ram7: RAM8 port map (clk => clk, din => din, addr => addr(2 downto 0), we => we7, dout => r7);

  u_mux: Mux8Way16 port map (a => r0, b => r1, c => r2, d => r3, e => r4, f => r5, g => r6, h => r7, sel => addr(5 downto 3), y => dout);
end architecture;
`,
        test: `// Test file for RAM64 (64-word RAM)
// 64 16-bit words addressable by 6-bit address

load RAM64

// Write to address 0
set din 0x1111
set addr 0b000000
set we 1
tick
tock
expect dout 0x1111

// Write to address 1
set din 0x2222
set addr 0b000001
tick
tock
expect dout 0x2222

// Write to address 8 (second RAM8 block)
set din 0x8888
set addr 0b001000
tick
tock
expect dout 0x8888

// Write to address 63
set din 0xFFFF
set addr 0b111111
tick
tock
expect dout 0xFFFF

// Read back address 0 (no write)
set we 0
set addr 0b000000
tick
tock
expect dout 0x1111

// Read back address 1
set addr 0b000001
tick
tock
expect dout 0x2222

// Read back address 8
set addr 0b001000
tick
tock
expect dout 0x8888

// Read back address 63
set addr 0b111111
tick
tock
expect dout 0xFFFF

// Write to different blocks
set we 1
set din 0xAAAA
set addr 0b010000
tick
tock
expect dout 0xAAAA

set din 0xBBBB
set addr 0b011000
tick
tock
expect dout 0xBBBB

set din 0xCCCC
set addr 0b100000
tick
tock
expect dout 0xCCCC

// Verify previous writes preserved
set we 0
set addr 0b000000
tick
tock
expect dout 0x1111

set addr 0b010000
tick
tock
expect dout 0xAAAA

set addr 0b100000
tick
tock
expect dout 0xCCCC`,
    },

    'RegFile': {
        project: 4,
        name: 'RegFile',
        description: '16-register file with 2 read ports',
        dependencies: ['Register16', 'Mux16', 'Mux8Way16', 'DMux8Way'],
        template: `-- 16-Register File
-- 2 independent read ports, 1 write port
-- Uses 16 Register16 instances with mux/demux for addressing

entity RegFile is
  port(
    clk   : in bit;
    we    : in bit;
    waddr : in bits(3 downto 0);
    wdata : in bits(15 downto 0);
    raddr1: in bits(3 downto 0);
    raddr2: in bits(3 downto 0);
    rdata1: out bits(15 downto 0);
    rdata2: out bits(15 downto 0)
  );
end entity;

architecture rtl of RegFile is
  component Register16
    port(clk : in bit; d : in bits(15 downto 0); load : in bit; q : out bits(15 downto 0));
  end component;
  component DMux8Way
    port(x : in bit; sel : in bits(2 downto 0); a,b,c,d,e,f,g,h : out bit);
  end component;
  component Mux8Way16
    port(a,b,c,d,e,f,g,h : in bits(15 downto 0); sel : in bits(2 downto 0); y : out bits(15 downto 0));
  end component;
  component Mux16
    port(a,b : in bits(15 downto 0); sel : in bit; y : out bits(15 downto 0));
  end component;
begin
  -- YOUR CODE HERE
  -- Hint: Use DMux8Way twice (for lower and upper 8 registers)
  -- Use Mux8Way16 + Mux16 to build 16:1 read muxes
end architecture;
`,
        solution: `-- 16-Register File with 2 independent read ports
entity RegFile is
  port(
    clk   : in bit;
    we    : in bit;
    waddr : in bits(3 downto 0);
    wdata : in bits(15 downto 0);
    raddr1: in bits(3 downto 0);
    raddr2: in bits(3 downto 0);
    rdata1: out bits(15 downto 0);
    rdata2: out bits(15 downto 0)
  );
end entity;

architecture rtl of RegFile is
  component Register16
    port(clk : in bit; d : in bits(15 downto 0); load : in bit; q : out bits(15 downto 0));
  end component;
  component DMux8Way
    port(x : in bit; sel : in bits(2 downto 0); a,b,c,d,e,f,g,h : out bit);
  end component;
  component Mux8Way16
    port(a,b,c,d,e,f,g,h : in bits(15 downto 0); sel : in bits(2 downto 0); y : out bits(15 downto 0));
  end component;
  component Mux16
    port(a,b : in bits(15 downto 0); sel : in bit; y : out bits(15 downto 0));
  end component;
  component DMux
    port(x : in bit; sel : in bit; a,b : out bit);
  end component;

  -- Write enable signals for each register
  signal we_lo, we_hi : bit;
  signal we0,we1,we2,we3,we4,we5,we6,we7 : bit;
  signal we8,we9,we10,we11,we12,we13,we14,we15 : bit;

  -- Register outputs
  signal r0,r1,r2,r3,r4,r5,r6,r7 : bits(15 downto 0);
  signal r8,r9,r10,r11,r12,r13,r14,r15 : bits(15 downto 0);

  -- Intermediate mux outputs for read ports
  signal rd1_lo, rd1_hi, rd2_lo, rd2_hi : bits(15 downto 0);
begin
  -- Demux write enable: split by waddr(3), then by waddr(2:0)
  u_we_split: DMux port map (x => we, sel => waddr(3), a => we_lo, b => we_hi);
  u_we_lo: DMux8Way port map (x => we_lo, sel => waddr(2 downto 0),
    a => we0, b => we1, c => we2, d => we3, e => we4, f => we5, g => we6, h => we7);
  u_we_hi: DMux8Way port map (x => we_hi, sel => waddr(2 downto 0),
    a => we8, b => we9, c => we10, d => we11, e => we12, f => we13, g => we14, h => we15);

  -- 16 registers
  reg0:  Register16 port map (clk => clk, d => wdata, load => we0, q => r0);
  reg1:  Register16 port map (clk => clk, d => wdata, load => we1, q => r1);
  reg2:  Register16 port map (clk => clk, d => wdata, load => we2, q => r2);
  reg3:  Register16 port map (clk => clk, d => wdata, load => we3, q => r3);
  reg4:  Register16 port map (clk => clk, d => wdata, load => we4, q => r4);
  reg5:  Register16 port map (clk => clk, d => wdata, load => we5, q => r5);
  reg6:  Register16 port map (clk => clk, d => wdata, load => we6, q => r6);
  reg7:  Register16 port map (clk => clk, d => wdata, load => we7, q => r7);
  reg8:  Register16 port map (clk => clk, d => wdata, load => we8, q => r8);
  reg9:  Register16 port map (clk => clk, d => wdata, load => we9, q => r9);
  reg10: Register16 port map (clk => clk, d => wdata, load => we10, q => r10);
  reg11: Register16 port map (clk => clk, d => wdata, load => we11, q => r11);
  reg12: Register16 port map (clk => clk, d => wdata, load => we12, q => r12);
  reg13: Register16 port map (clk => clk, d => wdata, load => we13, q => r13);
  reg14: Register16 port map (clk => clk, d => wdata, load => we14, q => r14);
  reg15: Register16 port map (clk => clk, d => wdata, load => we15, q => r15);

  -- Read port 1: 16:1 mux using two 8:1 muxes + 2:1 mux
  u_rd1_lo: Mux8Way16 port map (a=>r0,b=>r1,c=>r2,d=>r3,e=>r4,f=>r5,g=>r6,h=>r7,
    sel => raddr1(2 downto 0), y => rd1_lo);
  u_rd1_hi: Mux8Way16 port map (a=>r8,b=>r9,c=>r10,d=>r11,e=>r12,f=>r13,g=>r14,h=>r15,
    sel => raddr1(2 downto 0), y => rd1_hi);
  u_rd1: Mux16 port map (a => rd1_lo, b => rd1_hi, sel => raddr1(3), y => rdata1);

  -- Read port 2: same structure
  u_rd2_lo: Mux8Way16 port map (a=>r0,b=>r1,c=>r2,d=>r3,e=>r4,f=>r5,g=>r6,h=>r7,
    sel => raddr2(2 downto 0), y => rd2_lo);
  u_rd2_hi: Mux8Way16 port map (a=>r8,b=>r9,c=>r10,d=>r11,e=>r12,f=>r13,g=>r14,h=>r15,
    sel => raddr2(2 downto 0), y => rd2_hi);
  u_rd2: Mux16 port map (a => rd2_lo, b => rd2_hi, sel => raddr2(3), y => rdata2);
end architecture;
`,
        test: `// Test file for RegFile (16-register file)
// Tests 2 independent read ports and 1 write port

load RegFile

// Write to register 0
set we 1
set waddr 0x0
set wdata 0x1111
set raddr1 0x0
set raddr2 0x0
tick
tock
expect rdata1 0x1111
expect rdata2 0x1111

// Write to register 1, verify reg 0 unchanged via raddr1
set waddr 0x1
set wdata 0x2222
set raddr1 0x0
set raddr2 0x1
tick
tock
expect rdata1 0x1111
expect rdata2 0x2222

// Read both registers simultaneously
set we 0
set raddr1 0x1
set raddr2 0x0
tick
tock
expect rdata1 0x2222
expect rdata2 0x1111

// Write to register 15
set we 1
set waddr 0xF
set wdata 0xFFFF
tick
tock

// Read registers 0 and 15 simultaneously
set we 0
set raddr1 0x0
set raddr2 0xF
tick
tock
expect rdata1 0x1111
expect rdata2 0xFFFF

// Write to register 8 (tests upper bank)
set we 1
set waddr 0x8
set wdata 0x8888
tick
tock

// Read from different banks simultaneously
set we 0
set raddr1 0x1
set raddr2 0x8
tick
tock
expect rdata1 0x2222
expect rdata2 0x8888

// Write disabled - value should not change
set we 0
set waddr 0x0
set wdata 0x9999
tick
tock
set raddr1 0x0
tick
tock
expect rdata1 0x1111

// Verify all written values are preserved
set raddr1 0x0
set raddr2 0x1
tick
tock
expect rdata1 0x1111
expect rdata2 0x2222

set raddr1 0x8
set raddr2 0xF
tick
tock
expect rdata1 0x8888
expect rdata2 0xFFFF`,
    },

    // =========================================================================
    // Project 5: CPU
    // =========================================================================

    'Decoder': {
        project: 5,
        name: 'Decoder',
        description: 'Instruction decoder',
        dependencies: ['And2', 'Or2', 'Inv'],
        template: `-- Instruction Decoder
-- Decodes opcode into control signals

entity Decoder is
  port(
    opcode    : in bits(3 downto 0);
    alu_op    : out bits(1 downto 0);
    reg_write : out bit;
    mem_read  : out bit;
    mem_write : out bit;
    branch    : out bit
  );
end entity;

architecture rtl of Decoder is
begin
  -- Decode based on opcode bits
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- Instruction Decoder
-- Decodes opcode into control signals
-- Opcodes: 0000=ALU, 0100=LOAD, 0101=STORE, 1000=BRANCH

entity Decoder is
  port(
    opcode    : in bits(3 downto 0);
    alu_op    : out bits(1 downto 0);
    reg_write : out bit;
    mem_read  : out bit;
    mem_write : out bit;
    branch    : out bit
  );
end entity;

architecture rtl of Decoder is
  component Inv
    port(a : in bit; y : out bit);
  end component;
  component And2
    port(a, b : in bit; y : out bit);
  end component;
  signal not_op3, not_op2, not_op1, not_op0 : bit;
  signal is_alu, is_load, is_store, is_branch : bit;
begin
  -- Invert opcode bits
  inv3: Inv port map (a => opcode(3), y => not_op3);
  inv2: Inv port map (a => opcode(2), y => not_op2);
  inv1: Inv port map (a => opcode(1), y => not_op1);
  inv0: Inv port map (a => opcode(0), y => not_op0);

  -- Decode: ALU = 0000
  alu_a: And2 port map (a => not_op3, b => not_op2, y => is_alu);

  -- Decode: LOAD = 0100
  ld_a: And2 port map (a => not_op3, b => opcode(2), y => is_load);

  -- Decode: STORE = 0101
  st_a: And2 port map (a => is_load, b => opcode(0), y => is_store);

  -- Decode: BRANCH = 1xxx
  br_a: Inv port map (a => not_op3, y => is_branch);

  -- Control signals - pass through lower opcode bits for ALU operation
  alu_op <= opcode(1 downto 0);
  reg_write <= is_alu;
  mem_read <= is_load;
  mem_write <= is_store;
  branch <= is_branch;
end architecture;
`,
        test: `// Test file for Decoder (Instruction Decoder)
// Decodes 4-bit opcode into control signals
// Opcodes: 00xx=ALU, 0100=LOAD, 0101=STORE, 1xxx=BRANCH

load Decoder

// Opcode 0x0: ALU ADD
set opcode 0x0
eval
expect alu_op 0b00
expect reg_write 1
expect mem_read 0
expect mem_write 0
expect branch 0

// Opcode 0x1: ALU SUB
set opcode 0x1
eval
expect alu_op 0b01
expect reg_write 1
expect mem_read 0
expect mem_write 0
expect branch 0

// Opcode 0x2: ALU AND
set opcode 0x2
eval
expect alu_op 0b10
expect reg_write 1
expect mem_read 0
expect mem_write 0
expect branch 0

// Opcode 0x3: ALU OR
set opcode 0x3
eval
expect alu_op 0b11
expect reg_write 1
expect mem_read 0
expect mem_write 0
expect branch 0

// Opcode 0x4: LOAD (mem_read=1, but reg_write controlled by is_alu)
set opcode 0x4
eval
expect reg_write 0
expect mem_read 1
expect mem_write 0
expect branch 0

// Opcode 0x5: STORE (is_load also true due to op2=1)
set opcode 0x5
eval
expect reg_write 0
expect mem_read 1
expect mem_write 1
expect branch 0

// Opcode 0x8: BRANCH (op3=1)
set opcode 0x8
eval
expect reg_write 0
expect mem_read 0
expect mem_write 0
expect branch 1

// Opcode 0x9: BRANCH variant
set opcode 0x9
eval
expect reg_write 0
expect mem_read 0
expect mem_write 0
expect branch 1`,
    },

    'CondCheck': {
        project: 5,
        name: 'CondCheck',
        description: 'Condition checker',
        dependencies: ['And2', 'Or2', 'Inv', 'Mux'],
        template: `-- Condition Checker
-- Checks ALU flags against condition code

entity CondCheck is
  port(
    cond : in bits(3 downto 0);
    zero : in bit;
    neg  : in bit;
    carry: in bit;
    ovf  : in bit;
    take : out bit
  );
end entity;

architecture rtl of CondCheck is
begin
  -- Check condition codes: EQ, NE, LT, GE, etc.
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- Condition Checker
-- Checks ALU flags against condition code
-- cond: 0000=EQ (zero), 0001=NE (!zero), 0010=LT (neg), 0011=GE (!neg)

entity CondCheck is
  port(
    cond : in bits(3 downto 0);
    zero : in bit;
    neg  : in bit;
    carry: in bit;
    ovf  : in bit;
    take : out bit
  );
end entity;

architecture rtl of CondCheck is
  component Inv
    port(a : in bit; y : out bit);
  end component;
  component Mux
    port(a, b : in bit; sel : in bit; y : out bit);
  end component;
  signal not_zero, not_neg : bit;
  signal eq_result, ne_result, lt_result, ge_result : bit;
  signal sel0, sel1 : bit;
begin
  -- Invert flags for NE and GE conditions
  inv_z: Inv port map (a => zero, y => not_zero);
  inv_n: Inv port map (a => neg, y => not_neg);

  -- Condition results
  eq_result <= zero;       -- EQ: zero=1
  ne_result <= not_zero;   -- NE: zero=0
  lt_result <= neg;        -- LT: neg=1
  ge_result <= not_neg;    -- GE: neg=0

  -- 4-way mux using cond(1:0)
  mux0: Mux port map (a => eq_result, b => ne_result, sel => cond(0), y => sel0);
  mux1: Mux port map (a => lt_result, b => ge_result, sel => cond(0), y => sel1);
  mux2: Mux port map (a => sel0, b => sel1, sel => cond(1), y => take);
end architecture;
`,
        test: `// Test file for CondCheck (Condition Checker)
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
expect take 1`,
    },

    'Control': {
        project: 5,
        name: 'Control',
        description: 'Control unit',
        dependencies: ['Decoder', 'CondCheck'],
        template: `-- Control Unit
-- Generates all control signals

entity Control is
  port(
    clk       : in bit;
    opcode    : in bits(3 downto 0);
    cond      : in bits(3 downto 0);
    zero      : in bit;
    neg       : in bit;
    alu_op    : out bits(1 downto 0);
    reg_write : out bit;
    mem_read  : out bit;
    mem_write : out bit;
    pc_src    : out bit
  );
end entity;

architecture rtl of Control is
  component Decoder
    port(opcode : in bits(3 downto 0); alu_op : out bits(1 downto 0);
         reg_write, mem_read, mem_write, branch : out bit);
  end component;
  component CondCheck
    port(cond : in bits(3 downto 0); zero,neg,carry,ovf : in bit; take : out bit);
  end component;
begin
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- Control Unit
-- Generates all control signals

entity Control is
  port(
    clk       : in bit;
    opcode    : in bits(3 downto 0);
    cond      : in bits(3 downto 0);
    zero      : in bit;
    neg       : in bit;
    alu_op    : out bits(1 downto 0);
    reg_write : out bit;
    mem_read  : out bit;
    mem_write : out bit;
    pc_src    : out bit
  );
end entity;

architecture rtl of Control is
  component Decoder
    port(opcode : in bits(3 downto 0); alu_op : out bits(1 downto 0);
         reg_write, mem_read, mem_write, branch : out bit);
  end component;
  component CondCheck
    port(cond : in bits(3 downto 0); zero,neg,carry,ovf : in bit; take : out bit);
  end component;
  component And2
    port(a, b : in bit; y : out bit);
  end component;
  signal branch_sig, cond_take : bit;
begin
  -- Decoder generates base control signals
  u_dec: Decoder port map (
    opcode => opcode,
    alu_op => alu_op,
    reg_write => reg_write,
    mem_read => mem_read,
    mem_write => mem_write,
    branch => branch_sig
  );

  -- CondCheck evaluates branch condition
  u_cond: CondCheck port map (
    cond => cond,
    zero => zero,
    neg => neg,
    carry => '0',
    ovf => '0',
    take => cond_take
  );

  -- pc_src = branch AND condition_met
  u_and: And2 port map (a => branch_sig, b => cond_take, y => pc_src);
end architecture;
`,
        test: `// Test file for Control (Control Unit)
// Combines Decoder and CondCheck to generate control signals

load Control

// ALU ADD instruction (opcode=0x0)
set opcode 0x0
set cond 0x0
set zero 0
set neg 0
tick
tock
expect alu_op 0b00
expect reg_write 1
expect mem_read 0
expect mem_write 0
expect pc_src 0

// ALU SUB instruction (opcode=0x1)
set opcode 0x1
tick
tock
expect alu_op 0b01
expect reg_write 1
expect mem_read 0
expect mem_write 0
expect pc_src 0

// ALU AND instruction (opcode=0x2)
set opcode 0x2
tick
tock
expect alu_op 0b10
expect reg_write 1

// ALU OR instruction (opcode=0x3)
set opcode 0x3
tick
tock
expect alu_op 0b11
expect reg_write 1

// LOAD instruction (opcode=0x4)
set opcode 0x4
tick
tock
expect mem_read 1
expect mem_write 0

// STORE instruction (opcode=0x5)
set opcode 0x5
tick
tock
expect mem_write 1

// BRANCH instruction with condition EQ, zero=1 (take branch)
set opcode 0x8
set cond 0x0
set zero 1
tick
tock
expect pc_src 1
expect reg_write 0

// BRANCH instruction with condition EQ, zero=0 (don't take)
set zero 0
tick
tock
expect pc_src 0

// BRANCH instruction with condition NE, zero=0 (take branch)
set cond 0x1
set zero 0
tick
tock
expect pc_src 1

// BRANCH instruction with condition LT, neg=1 (take branch)
set cond 0x2
set neg 1
tick
tock
expect pc_src 1`,
    },

    'CPU': {
        project: 5,
        name: 'CPU',
        description: 'Complete CPU',
        dependencies: ['RegFile', 'ALU', 'PC', 'Control', 'RAM64'],
        template: `-- A32-Lite CPU
-- Simple 16-bit RISC processor

entity CPU is
  port(
    clk     : in bit;
    reset   : in bit;
    instr   : in bits(15 downto 0);
    mem_in  : in bits(15 downto 0);
    mem_out : out bits(15 downto 0);
    mem_addr: out bits(15 downto 0);
    mem_we  : out bit;
    pc_out  : out bits(15 downto 0)
  );
end entity;

architecture rtl of CPU is
  -- Instantiate all components
  component RegFile
    port(clk,we : in bit; waddr,raddr1,raddr2 : in bits(3 downto 0);
         wdata : in bits(15 downto 0); rdata1,rdata2 : out bits(15 downto 0));
  end component;
  component ALU
    port(a,b : in bits(15 downto 0); op : in bits(1 downto 0);
         y : out bits(15 downto 0); zero,neg : out bit);
  end component;
  component PC
    port(clk : in bit; d : in bits(15 downto 0); inc,load,reset : in bit; q : out bits(15 downto 0));
  end component;
  component Control
    port(clk : in bit; opcode,cond : in bits(3 downto 0); zero,neg : in bit;
         alu_op : out bits(1 downto 0); reg_write,mem_read,mem_write,pc_src : out bit);
  end component;
begin
  -- Connect the datapath
  -- YOUR CODE HERE
end architecture;
`,
        solution: `-- A32-Lite CPU
-- Simple 16-bit RISC processor
-- Instruction format: [15:12]=opcode, [11:8]=rd, [7:4]=rs1, [3:0]=rs2/imm
--
-- Opcodes:
--   0x0 = ADD rd, rs1, rs2    (rd = rs1 + rs2)
--   0x1 = SUB rd, rs1, rs2    (rd = rs1 - rs2)
--   0x2 = AND rd, rs1, rs2    (rd = rs1 & rs2)
--   0x3 = OR  rd, rs1, rs2    (rd = rs1 | rs2)
--   0x4 = LOAD rd, [rs1]      (rd = MEM[rs1])
--   0x5 = STORE [rs1], rs2    (MEM[rs1] = rs2)
--   0x6 = MOVI rd, #imm8      (rd = imm8)  ** NEW **
--   0x8+ = BRANCH             (conditional)

entity CPU is
  port(
    clk     : in bit;
    reset   : in bit;
    instr   : in bits(15 downto 0);
    mem_in  : in bits(15 downto 0);
    mem_out : out bits(15 downto 0);
    mem_addr: out bits(15 downto 0);
    mem_we  : out bit;
    pc_out  : out bits(15 downto 0)
  );
end entity;

architecture rtl of CPU is
  component RegFile
    port(clk,we : in bit; waddr,raddr1,raddr2 : in bits(3 downto 0);
         wdata : in bits(15 downto 0); rdata1,rdata2 : out bits(15 downto 0));
  end component;
  component ALU
    port(a,b : in bits(15 downto 0); op : in bits(1 downto 0);
         y : out bits(15 downto 0); zero,neg : out bit);
  end component;
  component PC
    port(clk : in bit; d : in bits(15 downto 0); inc,load,reset : in bit; q : out bits(15 downto 0));
  end component;
  component Control
    port(clk : in bit; opcode,cond : in bits(3 downto 0); zero,neg : in bit;
         alu_op : out bits(1 downto 0); reg_write,mem_read,mem_write,pc_src : out bit);
  end component;
  component Mux16
    port(a,b : in bits(15 downto 0); sel : in bit; y : out bits(15 downto 0));
  end component;
  component Inv
    port(a : in bit; y : out bit);
  end component;
  component And2
    port(a, b : in bit; y : out bit);
  end component;
  component Or2
    port(a, b : in bit; y : out bit);
  end component;

  -- Instruction decode
  signal opcode, rd, rs1, rs2 : bits(3 downto 0);
  -- Control signals
  signal alu_op : bits(1 downto 0);
  signal reg_write_ctrl, mem_rd, mem_wr, pc_src : bit;
  signal reg_write_final : bit;
  -- Datapath signals
  signal pc_val, branch_target : bits(15 downto 0);
  signal reg_data1, reg_data2, alu_result : bits(15 downto 0);
  signal write_data, write_data_alu_mem : bits(15 downto 0);
  signal immediate : bits(15 downto 0);
  signal zero_flag, neg_flag : bit;
  signal not_reset : bit;
  -- MOVI detection: opcode = 0110
  signal is_movi, not_op3, not_op0, movi_t1, movi_t2 : bit;
begin
  -- Instruction decode using slices
  opcode <= instr(15 downto 12);
  rd <= instr(11 downto 8);
  rs1 <= instr(7 downto 4);
  rs2 <= instr(3 downto 0);

  -- Immediate value for MOVI (zero-extended 8-bit)
  immediate <= x"00" & instr(7 downto 0);

  -- Detect MOVI: opcode = 0110 (0x6)
  inv_op3: Inv port map (a => opcode(3), y => not_op3);
  inv_op0: Inv port map (a => opcode(0), y => not_op0);
  movi_a1: And2 port map (a => not_op3, b => opcode(2), y => movi_t1);
  movi_a2: And2 port map (a => opcode(1), b => not_op0, y => movi_t2);
  movi_a3: And2 port map (a => movi_t1, b => movi_t2, y => is_movi);

  -- Control unit
  u_ctrl: Control port map (
    clk => clk, opcode => opcode, cond => rs2,
    zero => zero_flag, neg => neg_flag,
    alu_op => alu_op, reg_write => reg_write_ctrl,
    mem_read => mem_rd, mem_write => mem_wr, pc_src => pc_src
  );

  -- reg_write = reg_write_ctrl OR is_movi
  u_reg_or: Or2 port map (a => reg_write_ctrl, b => is_movi, y => reg_write_final);

  -- Register file
  u_regs: RegFile port map (
    clk => clk, we => reg_write_final,
    waddr => rd, raddr1 => rs1, raddr2 => rs2,
    wdata => write_data, rdata1 => reg_data1, rdata2 => reg_data2
  );

  -- ALU
  u_alu: ALU port map (
    a => reg_data1, b => reg_data2, op => alu_op,
    y => alu_result, zero => zero_flag, neg => neg_flag
  );

  -- Write back mux 1 (ALU result or memory)
  u_wb_mux1: Mux16 port map (
    a => alu_result, b => mem_in, sel => mem_rd, y => write_data_alu_mem
  );

  -- Write back mux 2 (ALU/MEM or immediate for MOVI)
  u_wb_mux2: Mux16 port map (
    a => write_data_alu_mem, b => immediate, sel => is_movi, y => write_data
  );

  -- Program counter
  inv_reset: Inv port map (a => reset, y => not_reset);
  branch_target <= reg_data1;
  u_pc: PC port map (
    clk => clk, d => branch_target,
    inc => not_reset, load => pc_src, reset => reset, q => pc_val
  );

  -- Outputs
  pc_out <= pc_val;
  mem_addr <= alu_result;
  mem_out <= reg_data2;
  mem_we <= mem_wr;
end architecture;
`,
        test: `// Test file for CPU (A32-Lite CPU)
// Simple 16-bit RISC processor
// Instruction format: [15:12]=opcode, [11:8]=rd, [7:4]=rs1, [3:0]=rs2

load CPU

// Reset the CPU
set reset 1
set instr 0x0000
set mem_in 0x0000
tick
tock
expect pc_out 0x0000

// Release reset - PC should start incrementing
set reset 0
tick
tock

// Execute ADD r1, r0, r0 (0x0100: opcode=0, rd=1, rs1=0, rs2=0)
// This should write r0+r0=0 into r1
set instr 0x0100
tick
tock

// Execute ADD r2, r1, r1 (0x0211: opcode=0, rd=2, rs1=1, rs2=1)
set instr 0x0211
tick
tock

// Test LOAD instruction - opcode 0x4
// LOAD r3, [r0] (0x4300: load from address in r0 to r3)
set instr 0x4300
set mem_in 0x1234
tick
tock

// Test STORE instruction - opcode 0x5
// STORE r3, [r0] (0x5030: store r3 to address in r0)
set instr 0x5030
tick
tock
expect mem_we 1

// Test that mem_we is cleared after non-store instruction
set instr 0x0000
tick
tock
expect mem_we 0

// Test SUB instruction
// SUB r4, r2, r1 (0x1421: opcode=1, rd=4, rs1=2, rs2=1)
set instr 0x1421
tick
tock

// Test AND instruction
// AND r5, r3, r2 (0x2532: opcode=2, rd=5, rs1=3, rs2=2)
set instr 0x2532
tick
tock

// Test OR instruction
// OR r6, r4, r3 (0x3643: opcode=3, rd=6, rs1=4, rs2=3)
set instr 0x3643
tick
tock

// Test MOVI instruction - opcode 0x6
// MOVI r7, #42 (0x672A: opcode=6, rd=7, imm8=42)
set instr 0x672A
tick
tock

// MOVI r8, #255 (0x68FF: opcode=6, rd=8, imm8=255)
set instr 0x68FF
tick
tock

// ADD r9, r7, r8 (0x0978: should be 42+255=297=0x129)
set instr 0x0978
tick
tock`,
    },

    // =========================================================================
    // Project 6: Pipelined CPU
    // =========================================================================

    'IF_ID_Reg': {
        project: 6,
        name: 'IF_ID_Reg',
        description: 'IF/ID Pipeline Register',
        dependencies: ['CPU'],
        template: `-- ============================================
-- Exercice: IF/ID Pipeline Register
-- ============================================
-- Objectif: Implémenter un registre de pipeline entre IF et ID
--
-- Ce registre fait partie d'un CPU pipeliné 5 étapes.
-- Il capture l'instruction et PC+4 de l'étape Fetch
-- pour les transmettre à l'étape Decode.
--
-- Comportement attendu:
-- 1. Sur reset='1' OU flush='1': mettre instr_reg à NOP (0xE0000000)
--    et pc_plus4_reg à 0
-- 2. Sur stall='1': garder les valeurs actuelles (ne rien faire)
-- 3. Sinon: capturer if_instr et if_pc_plus4
--
-- Note: Utilisez (reset = '1') or (flush = '1') avec parenthèses
-- ============================================

entity IF_ID_Reg is
  port(
    clk : in bit;
    reset : in bit;
    stall : in bit;        -- Hold current values
    flush : in bit;        -- Clear to NOP
    -- Inputs from IF stage
    if_instr : in bits(31 downto 0);
    if_pc_plus4 : in bits(31 downto 0);
    -- Outputs to ID stage
    id_instr : out bits(31 downto 0);
    id_pc_plus4 : out bits(31 downto 0)
  );
end entity;

architecture rtl of IF_ID_Reg is
  signal instr_reg : bits(31 downto 0);
  signal pc_plus4_reg : bits(31 downto 0);
begin
  process(clk)
  begin
    if rising_edge(clk) then
      -- YOUR CODE HERE
      -- Gérer reset/flush, stall, et opération normale
    end if;
  end process;

  id_instr <= instr_reg;
  id_pc_plus4 <= pc_plus4_reg;
end architecture;
`,
        solution: `-- IF/ID Pipeline Register

entity IF_ID_Reg is
  port(
    clk : in bit;
    reset : in bit;
    stall : in bit;
    flush : in bit;
    if_instr : in bits(31 downto 0);
    if_pc_plus4 : in bits(31 downto 0);
    id_instr : out bits(31 downto 0);
    id_pc_plus4 : out bits(31 downto 0)
  );
end entity;

architecture rtl of IF_ID_Reg is
  signal instr_reg : bits(31 downto 0);
  signal pc_plus4_reg : bits(31 downto 0);
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if (reset = '1') or (flush = '1') then
        instr_reg <= x"E0000000";  -- NOP
        pc_plus4_reg <= x"00000000";
      elsif stall = '0' then
        instr_reg <= if_instr;
        pc_plus4_reg <= if_pc_plus4;
      end if;
    end if;
  end process;

  id_instr <= instr_reg;
  id_pc_plus4 <= pc_plus4_reg;
end architecture;
`,
        test: `load IF_ID_Reg
set reset 1
tick
expect id_instr 0xE0000000
set reset 0
set stall 0
set flush 0
set if_instr 0x12345678
set if_pc_plus4 0x00000004
tick
expect id_instr 0x12345678
expect id_pc_plus4 0x00000004
set stall 1
set if_instr 0xAAAAAAAA
tick
expect id_instr 0x12345678
set stall 0
set flush 1
tick
expect id_instr 0xE0000000
`,
    },

    'HazardDetect': {
        project: 6,
        name: 'HazardDetect',
        description: 'Hazard Detection Unit',
        dependencies: ['IF_ID_Reg'],
        template: `-- ============================================
-- Exercice: Hazard Detection Unit
-- ============================================
-- Objectif: Détecter les aléas load-use et générer un stall
--
-- Un aléa load-use se produit quand:
-- - L'instruction en EX est un load (ex_mem_read = '1')
-- - L'instruction en ID utilise le registre chargé
--
-- Étapes:
-- 1. Créer un signal rn_hazard pour détecter si Rn est en conflit:
--    rn_hazard <= ex_mem_read and id_rn_used and (id_rn = ex_rd);
-- 2. Créer un signal rm_hazard similaire pour Rm
-- 3. stall <= rn_hazard or rm_hazard;
--
-- Note: La comparaison (a = b) retourne un bit directement
-- ============================================

entity HazardDetect is
  port(
    -- From ID stage
    id_rn : in bits(3 downto 0);     -- Source register 1
    id_rm : in bits(3 downto 0);     -- Source register 2
    id_rn_used : in bit;             -- Rn is used
    id_rm_used : in bit;             -- Rm is used
    -- From EX stage
    ex_rd : in bits(3 downto 0);     -- Destination register
    ex_mem_read : in bit;            -- Is it a load?
    -- Output
    stall : out bit                  -- Stall IF and ID stages
  );
end entity;

architecture rtl of HazardDetect is
  -- Déclarez vos signaux intermédiaires ici
begin
  -- YOUR CODE HERE
  -- Détecter si l'instruction en ID dépend du load en EX
  stall <= '0';
end architecture;
`,
        solution: `-- Hazard Detection Unit

entity HazardDetect is
  port(
    id_rn : in bits(3 downto 0);
    id_rm : in bits(3 downto 0);
    id_rn_used : in bit;
    id_rm_used : in bit;
    ex_rd : in bits(3 downto 0);
    ex_mem_read : in bit;
    stall : out bit
  );
end entity;

architecture rtl of HazardDetect is
  signal rn_hazard : bit;
  signal rm_hazard : bit;
begin
  -- Hazard if: load in EX AND register used in ID AND same register
  rn_hazard <= ex_mem_read and id_rn_used and (id_rn = ex_rd);
  rm_hazard <= ex_mem_read and id_rm_used and (id_rm = ex_rd);
  stall <= rn_hazard or rm_hazard;
end architecture;
`,
        test: `load HazardDetect
set id_rn 0x5
set id_rm 0x6
set id_rn_used 1
set id_rm_used 1
set ex_rd 0x5
set ex_mem_read 1
eval
expect stall 1
set ex_mem_read 0
eval
expect stall 0
set ex_mem_read 1
set ex_rd 0x7
eval
expect stall 0
`,
    },

    'ForwardUnit': {
        project: 6,
        name: 'ForwardUnit',
        description: 'Data Forwarding Unit',
        dependencies: ['HazardDetect'],
        template: `-- ============================================
-- Exercice: Forwarding Unit
-- ============================================
-- Objectif: Implémenter le bypass de données
--
-- Le forwarding évite les stalls en acheminant les résultats
-- directement des étages MEM et WB vers EX.
--
-- Encodage des signaux forward_a et forward_b:
--   b"00" = Pas de forwarding (utiliser valeur du banc de registres)
--   b"01" = Forward depuis MEM (résultat ALU)
--   b"10" = Forward depuis WB (résultat final)
--
-- Logique:
-- 1. Créer mem_fwd_a = mem_reg_write and (mem_rd = ex_rn)
-- 2. Créer wb_fwd_a = wb_reg_write and (wb_rd = ex_rn) and (not mem_fwd_a)
-- 3. Encoder: forward_a <= wb_fwd_a & mem_fwd_a (concaténation)
-- (Même logique pour forward_b avec ex_rm)
--
-- Note: & concatène deux bits en un vecteur de 2 bits
-- ============================================

entity ForwardUnit is
  port(
    -- Source registers from EX stage
    ex_rn : in bits(3 downto 0);
    ex_rm : in bits(3 downto 0);
    -- From MEM stage
    mem_rd : in bits(3 downto 0);
    mem_reg_write : in bit;
    -- From WB stage
    wb_rd : in bits(3 downto 0);
    wb_reg_write : in bit;
    -- Forwarding control
    forward_a : out bits(1 downto 0);
    forward_b : out bits(1 downto 0)
  );
end entity;

architecture rtl of ForwardUnit is
begin
  -- YOUR CODE HERE
  -- Priority: MEM stage has precedence over WB stage
  forward_a <= 0b00;
  forward_b <= 0b00;
end architecture;
`,
        solution: `-- Forwarding Unit

entity ForwardUnit is
  port(
    ex_rn : in bits(3 downto 0);
    ex_rm : in bits(3 downto 0);
    mem_rd : in bits(3 downto 0);
    mem_reg_write : in bit;
    wb_rd : in bits(3 downto 0);
    wb_reg_write : in bit;
    forward_a : out bits(1 downto 0);
    forward_b : out bits(1 downto 0)
  );
end entity;

architecture rtl of ForwardUnit is
  signal mem_fwd_a : bit;
  signal wb_fwd_a : bit;
  signal mem_fwd_b : bit;
  signal wb_fwd_b : bit;
begin
  -- Detect forwarding conditions
  mem_fwd_a <= mem_reg_write and (mem_rd = ex_rn);
  wb_fwd_a <= wb_reg_write and (wb_rd = ex_rn) and (not mem_fwd_a);
  mem_fwd_b <= mem_reg_write and (mem_rd = ex_rm);
  wb_fwd_b <= wb_reg_write and (wb_rd = ex_rm) and (not mem_fwd_b);

  -- Encode output: 00=none, 01=MEM, 10=WB
  forward_a <= wb_fwd_a & mem_fwd_a;
  forward_b <= wb_fwd_b & mem_fwd_b;
end architecture;
`,
        test: `load ForwardUnit
set ex_rn 0x3
set ex_rm 0x4
set mem_rd 0x3
set mem_reg_write 1
set wb_rd 0x4
set wb_reg_write 1
eval
expect forward_a 0b01
expect forward_b 0b10
set mem_reg_write 0
eval
expect forward_a 0b00
`,
    },

    'CPU_Pipeline': {
        project: 6,
        name: 'CPU_Pipeline',
        description: '5-Stage Pipelined CPU',
        dependencies: ['ForwardUnit'],
        template: `-- ============================================
-- Exercice: CPU Pipeline 5 étages (Projet Final)
-- ============================================
-- Objectif: Construire un CPU pipeliné complet
--
-- C'est un exercice avancé qui combine tous les composants!
--
-- Les 5 étages du pipeline:
-- 1. IF  - Fetch instruction depuis la mémoire
-- 2. ID  - Decode, lecture des registres, détection hazards
-- 3. EX  - ALU, calcul d'adresses, forwarding
-- 4. MEM - Accès mémoire données (load/store)
-- 5. WB  - Écriture résultat dans le banc de registres
--
-- Composants à utiliser:
-- - IF_ID_Reg: Registre pipeline IF→ID
-- - HazardDetect: Détection aléas load-use
-- - ForwardUnit: Bypass de données
-- - Registres EX_MEM et MEM_WB (similaires à IF_ID_Reg)
--
-- Référez-vous à hdl_lib/05_cpu/CPU_Pipeline.hdl pour
-- l'implémentation complète de référence.
-- ============================================

entity CPU_Pipeline is
  port(
    clk : in bit;
    reset : in bit;
    instr_addr : out bits(31 downto 0);
    instr_data : in bits(31 downto 0);
    mem_addr : out bits(31 downto 0);
    mem_wdata : out bits(31 downto 0);
    mem_rdata : in bits(31 downto 0);
    mem_read : out bit;
    mem_write : out bit;
    halted : out bit
  );
end entity;

architecture rtl of CPU_Pipeline is
  -- Déclarez les signaux pour chaque étage
  -- Utilisez les composants IF_ID_Reg, HazardDetect, ForwardUnit
begin
  -- YOUR CODE HERE
  -- Projet final: construire le pipeline complet!
  -- Commencez par l'étage IF, puis ajoutez ID, EX, MEM, WB
  halted <= '0';
end architecture;
`,
        solution: `-- 5-Stage Pipelined CPU
-- See hdl_lib/05_cpu/CPU_Pipeline.hdl for full implementation
-- This exercise is a capstone project

entity CPU_Pipeline is
  port(
    clk : in bit;
    reset : in bit;
    instr_addr : out bits(31 downto 0);
    instr_data : in bits(31 downto 0);
    mem_addr : out bits(31 downto 0);
    mem_wdata : out bits(31 downto 0);
    mem_rdata : in bits(31 downto 0);
    mem_read : out bit;
    mem_write : out bit;
    halted : out bit
  );
end entity;

architecture rtl of CPU_Pipeline is
begin
  -- Simplified: just show the interface works
  instr_addr <= x"00000000";
  mem_addr <= x"00000000";
  mem_wdata <= x"00000000";
  mem_read <= '0';
  mem_write <= '0';
  halted <= '0';
end architecture;
`,
        test: `load CPU_Pipeline
set reset 1
tick
set reset 0
tick
`,
    },

    // =========================================================================
    // Project 7: Cache Memory
    // =========================================================================

    'CacheLine': {
        project: 7,
        name: 'CacheLine',
        description: 'Cache Line Register (valid, dirty, tag, data)',
        dependencies: ['Register16'],
        template: `-- ============================================
-- Exercice: Cache Line (Ligne de Cache)
-- ============================================
-- Objectif: Implémenter un registre de ligne de cache
--
-- Une ligne de cache contient:
-- - valid: 1 bit indiquant si la ligne contient des données valides
-- - dirty: 1 bit indiquant si les données ont été modifiées
-- - tag: identifiant de l'adresse mémoire (20 bits)
-- - data: 16 octets de données (4 mots de 32 bits = 128 bits)
--
-- Étapes à implémenter dans le process:
-- 1. Si invalidate='1': mettre valid_reg et dirty_reg à '0'
-- 2. Sinon si write_enable='1': charger une ligne complète
--    - valid_reg <= '1'
--    - tag_reg <= write_tag
--    - data_reg <= write_data
--    - dirty_reg <= '0'
-- 3. Sinon si write_word_en='1': écrire un seul mot (32 bits)
--    - Utiliser write_word_sel pour choisir le mot (0-3)
--    - 0b00: data_reg(31 downto 0)
--    - 0b01: data_reg(63 downto 32)
--    - 0b10: data_reg(95 downto 64)
--    - 0b11: data_reg(127 downto 96)
-- 4. Gérer set_dirty et clear_dirty séparément
--
-- Note: Utilisez if/elsif pour les priorités
-- ============================================

entity CacheLine is
  port(
    clk : in bit;
    -- Contrôle
    write_enable : in bit;          -- Écrire la ligne complète
    write_tag : in bits(19 downto 0);  -- Tag à écrire
    write_data : in bits(127 downto 0); -- 16 bytes de données
    write_word : in bits(31 downto 0);  -- Mot à écrire (écriture partielle)
    write_word_sel : in bits(1 downto 0); -- Sélection du mot (0-3)
    write_word_en : in bit;         -- Écrire un seul mot
    set_dirty : in bit;             -- Marquer comme dirty
    clear_dirty : in bit;           -- Effacer dirty (après write-back)
    invalidate : in bit;            -- Invalider la ligne
    -- Sorties
    valid : out bit;
    dirty : out bit;
    tag : out bits(19 downto 0);
    data : out bits(127 downto 0)
  );
end entity;

architecture rtl of CacheLine is
  signal valid_reg : bit;
  signal dirty_reg : bit;
  signal tag_reg : bits(19 downto 0);
  signal data_reg : bits(127 downto 0);
begin
  process(clk)
  begin
    if rising_edge(clk) then
      -- YOUR CODE HERE
      -- Étape 1: Gérer invalidate
      -- Étape 2: Sinon gérer write_enable (ligne complète)
      -- Étape 3: Sinon gérer write_word_en (mot partiel)
      -- Étape 4: Gérer set_dirty / clear_dirty
    end if;
  end process;

  valid <= valid_reg;
  dirty <= dirty_reg;
  tag <= tag_reg;
  data <= data_reg;
end architecture;
`,
        solution: `-- Cache Line
-- Une ligne de cache contient:
-- - valid: 1 bit indiquant si la ligne contient des données valides
-- - dirty: 1 bit indiquant si les données ont été modifiées (write-back)
-- - tag: identifiant de l'adresse mémoire (20 bits)
-- - data: 16 octets de données (4 mots de 32 bits = 128 bits)

entity CacheLine is
  port(
    clk : in bit;
    write_enable : in bit;
    write_tag : in bits(19 downto 0);
    write_data : in bits(127 downto 0);
    write_word : in bits(31 downto 0);
    write_word_sel : in bits(1 downto 0);
    write_word_en : in bit;
    set_dirty : in bit;
    clear_dirty : in bit;
    invalidate : in bit;
    valid : out bit;
    dirty : out bit;
    tag : out bits(19 downto 0);
    data : out bits(127 downto 0)
  );
end entity;

architecture rtl of CacheLine is
  signal valid_reg : bit;
  signal dirty_reg : bit;
  signal tag_reg : bits(19 downto 0);
  signal data_reg : bits(127 downto 0);
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if invalidate = '1' then
        valid_reg <= '0';
        dirty_reg <= '0';
      elsif write_enable = '1' then
        valid_reg <= '1';
        tag_reg <= write_tag;
        data_reg <= write_data;
        dirty_reg <= '0';
      elsif write_word_en = '1' then
        if write_word_sel = 0b00 then
          data_reg(31 downto 0) <= write_word;
        elsif write_word_sel = 0b01 then
          data_reg(63 downto 32) <= write_word;
        elsif write_word_sel = 0b10 then
          data_reg(95 downto 64) <= write_word;
        else
          data_reg(127 downto 96) <= write_word;
        end if;
      end if;

      if set_dirty = '1' then
        dirty_reg <= '1';
      elsif clear_dirty = '1' then
        dirty_reg <= '0';
      end if;
    end if;
  end process;

  valid <= valid_reg;
  dirty <= dirty_reg;
  tag <= tag_reg;
  data <= data_reg;
end architecture;
`,
        test: `load CacheLine
-- Test invalidation
set invalidate 1
tick
expect valid 0
expect dirty 0

-- Test write full line
set invalidate 0
set write_enable 1
set write_tag 0xABCDE
set write_data 0x11111111222222223333333344444444
tick
expect valid 1
expect dirty 0

-- Test set dirty
set write_enable 0
set set_dirty 1
tick
expect dirty 1

-- Test clear dirty
set set_dirty 0
set clear_dirty 1
tick
expect dirty 0
`,
    },

    'TagCompare': {
        project: 7,
        name: 'TagCompare',
        description: 'Tag Comparator for cache lookup',
        dependencies: ['And2'],
        template: `-- ============================================
-- Exercice: Tag Comparator (Comparateur de Tag)
-- ============================================
-- Objectif: Détecter si une adresse est présente dans le cache
--
-- Le cache utilise un tag pour identifier quelle région mémoire
-- est stockée dans chaque ligne. Pour un cache hit:
-- 1. La ligne doit être valide (valid = '1')
-- 2. Le tag stocké doit correspondre au tag de l'adresse
--
-- Implémentation:
-- - Comparer addr_tag avec stored_tag (20 bits chacun)
-- - La comparaison (a = b) retourne '1' si égaux, '0' sinon
-- - hit = valid AND (tags sont égaux)
--
-- Syntaxe: hit <= valid and (addr_tag = stored_tag);
--
-- Cas de test:
-- - valid=0, tags égaux -> hit=0 (ligne invalide)
-- - valid=1, tags égaux -> hit=1 (cache hit!)
-- - valid=1, tags différents -> hit=0 (cache miss)
-- ============================================

entity TagCompare is
  port(
    valid : in bit;
    addr_tag : in bits(19 downto 0);
    stored_tag : in bits(19 downto 0);
    hit : out bit
  );
end entity;

architecture rtl of TagCompare is
begin
  -- YOUR CODE HERE
  -- Une seule ligne suffit!
  -- hit <= valid and (condition de comparaison);
  hit <= '0';
end architecture;
`,
        solution: `-- Tag Comparator
-- Compare the address tag with the stored tag

entity TagCompare is
  port(
    valid : in bit;
    addr_tag : in bits(19 downto 0);
    stored_tag : in bits(19 downto 0);
    hit : out bit
  );
end entity;

architecture rtl of TagCompare is
begin
  -- Hit when valid AND all 20 tag bits match
  -- Comparison (=) on multi-bit signals returns bit
  hit <= valid and (addr_tag = stored_tag);
end architecture;
`,
        test: `load TagCompare
-- No hit when invalid
set valid 0
set addr_tag 0x12345
set stored_tag 0x12345
eval
expect hit 0

-- Hit when valid and tags match
set valid 1
set addr_tag 0x12345
set stored_tag 0x12345
eval
expect hit 1

-- No hit when tags differ
set valid 1
set addr_tag 0x12345
set stored_tag 0xABCDE
eval
expect hit 0
`,
    },

    'WordSelect': {
        project: 7,
        name: 'WordSelect',
        description: 'Word Selector (4-way mux for 32-bit words)',
        dependencies: ['Mux4Way16'],
        template: `-- ============================================
-- Exercice: Word Selector (Sélecteur de Mot)
-- ============================================
-- Objectif: Sélectionner un mot de 32 bits dans une ligne de cache
--
-- Une ligne de cache contient 128 bits = 4 mots de 32 bits.
-- word_sel (2 bits) indique quel mot extraire:
-- - 0b00: bits 31..0   (premier mot)
-- - 0b01: bits 63..32  (deuxième mot)
-- - 0b10: bits 95..64  (troisième mot)
-- - 0b11: bits 127..96 (quatrième mot)
--
-- Implémentation avec Mux4Way16:
-- Comme Mux4Way16 gère 16 bits, utilisez DEUX instances:
-- 1. lo: pour les bits bas (15..0) de chaque mot
-- 2. hi: pour les bits hauts (31..16) de chaque mot
--
-- Exemple pour 'lo':
--   lo: Mux4Way16 port map(
--     a => line_data(15 downto 0),    -- mot 0, bits bas
--     b => line_data(47 downto 32),   -- mot 1, bits bas
--     c => line_data(79 downto 64),   -- mot 2, bits bas
--     d => line_data(111 downto 96),  -- mot 3, bits bas
--     sel => word_sel,
--     y => word_out(15 downto 0)
--   );
--
-- Faites la même chose pour 'hi' avec les bits hauts.
-- ============================================

entity WordSelect is
  port(
    line_data : in bits(127 downto 0);  -- 4 words (128 bits)
    word_sel : in bits(1 downto 0);     -- Which word (0-3)
    word_out : out bits(31 downto 0)    -- Selected word
  );
end entity;

architecture rtl of WordSelect is
  component Mux4Way16
    port(a,b,c,d : in bits(15 downto 0); sel : in bits(1 downto 0); y : out bits(15 downto 0));
  end component;
begin
  -- YOUR CODE HERE
  -- Instanciez lo: Mux4Way16 pour les bits bas
  -- Instanciez hi: Mux4Way16 pour les bits hauts
  word_out <= x"00000000";
end architecture;
`,
        solution: `-- Word Selector
-- Select one 32-bit word from a 128-bit cache line

entity WordSelect is
  port(
    line_data : in bits(127 downto 0);
    word_sel : in bits(1 downto 0);
    word_out : out bits(31 downto 0)
  );
end entity;

architecture rtl of WordSelect is
  component Mux4Way16
    port(a,b,c,d : in bits(15 downto 0); sel : in bits(1 downto 0); y : out bits(15 downto 0));
  end component;
begin
  -- Use two 16-bit 4-way muxes for lower and upper halves
  lo: Mux4Way16 port map(
    a => line_data(15 downto 0),
    b => line_data(47 downto 32),
    c => line_data(79 downto 64),
    d => line_data(111 downto 96),
    sel => word_sel,
    y => word_out(15 downto 0)
  );
  hi: Mux4Way16 port map(
    a => line_data(31 downto 16),
    b => line_data(63 downto 48),
    c => line_data(95 downto 80),
    d => line_data(127 downto 112),
    sel => word_sel,
    y => word_out(31 downto 16)
  );
end architecture;
`,
        test: `load WordSelect
set line_data 0xDDDDDDDDCCCCCCCCBBBBBBBBAAAAAAAA
-- Word 0
set word_sel 0b00
eval
expect word_out 0xAAAAAAAA
-- Word 1
set word_sel 0b01
eval
expect word_out 0xBBBBBBBB
-- Word 2
set word_sel 0b10
eval
expect word_out 0xCCCCCCCC
-- Word 3
set word_sel 0b11
eval
expect word_out 0xDDDDDDDD
`,
    },

    'CacheController': {
        project: 7,
        name: 'CacheController',
        description: 'Cache Controller FSM (IDLE, FETCH, WRITE_BACK)',
        dependencies: ['CacheLine', 'TagCompare', 'WordSelect'],
        template: `-- ============================================
-- Exercice: Cache Controller (Contrôleur de Cache)
-- ============================================
-- Objectif: Implémenter une machine à états pour le cache
--
-- États (encodés sur 2 bits):
-- - IDLE (0b00): Attente de requête CPU
-- - FETCH (0b01): Chargement d'une ligne depuis la mémoire
-- - WRITEBACK (0b10): Écriture vers la mémoire
--
-- Transitions:
-- IDLE + requête + miss -> FETCH (charger la ligne)
-- IDLE + write + hit -> WRITEBACK (écrire en mémoire)
-- FETCH + mem_ready -> IDLE (ou WRITEBACK si écriture en attente)
-- WRITEBACK + mem_ready -> IDLE
--
-- Signaux de sortie:
-- - cpu_ready: '1' quand le CPU peut continuer
-- - mem_read: '1' en état FETCH
-- - mem_write: '1' en état WRITEBACK
-- - fill_line: '1' quand mem_ready en FETCH
--
-- Conseil: Utilisez des signaux auxiliaires pour simplifier:
--   is_idle <= (state_reg = 0b00);
--   is_fetch <= (state_reg = 0b01);
--   is_wb <= (state_reg = 0b10);
--   miss <= not cache_hit;
--   req <= cpu_read or cpu_write;
--
-- IMPORTANT: Mettez chaque comparaison entre parenthèses!
--   elsif (is_idle = '1') and (req = '1') then
-- ============================================

entity CacheController is
  port(
    clk : in bit;
    reset : in bit;
    -- CPU interface
    cpu_read : in bit;
    cpu_write : in bit;
    cache_hit : in bit;
    -- Memory interface
    mem_ready : in bit;
    -- Control outputs
    state : out bits(1 downto 0);     -- 00=IDLE, 01=FETCH, 10=WRITEBACK
    cpu_ready : out bit;               -- Operation complete
    mem_read : out bit;
    mem_write : out bit;
    fill_line : out bit               -- Fill cache line from memory
  );
end entity;

architecture rtl of CacheController is
  signal state_reg : bits(1 downto 0);
  signal pending_write : bit;
  -- Ajoutez vos signaux auxiliaires ici
begin
  -- Précalculez les conditions ici (combinatoire)

  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        state_reg <= 0b00;
        pending_write <= '0';
      -- YOUR CODE HERE
      -- Utilisez elsif pour chaque transition
      end if;
    end if;
  end process;

  state <= state_reg;
  -- YOUR CODE HERE: Générez les signaux de sortie
  cpu_ready <= '0';
  mem_read <= '0';
  mem_write <= '0';
  fill_line <= '0';
end architecture;
`,
        solution: `-- Cache Controller
-- State machine: IDLE, FETCH, WRITE_BACK

entity CacheController is
  port(
    clk : in bit;
    reset : in bit;
    cpu_read : in bit;
    cpu_write : in bit;
    cache_hit : in bit;
    mem_ready : in bit;
    state : out bits(1 downto 0);
    cpu_ready : out bit;
    mem_read : out bit;
    mem_write : out bit;
    fill_line : out bit
  );
end entity;

architecture rtl of CacheController is
  signal state_reg : bits(1 downto 0);
  signal pending_write : bit;
  signal fill_line_reg : bit;
  signal is_idle, is_fetch, is_wb : bit;
  signal miss, req : bit;
begin
  -- Precompute conditions
  is_idle <= (state_reg = 0b00);
  is_fetch <= (state_reg = 0b01);
  is_wb <= (state_reg = 0b10);
  miss <= not cache_hit;
  req <= cpu_read or cpu_write;

  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        state_reg <= 0b00;
        pending_write <= '0';
        fill_line_reg <= '0';
      elsif (is_idle = '1') and (req = '1') and (miss = '1') then
        state_reg <= 0b01;
        pending_write <= cpu_write;
        fill_line_reg <= '0';
      elsif (is_idle = '1') and (cpu_write = '1') and (cache_hit = '1') then
        state_reg <= 0b10;
        fill_line_reg <= '0';
      elsif (is_fetch = '1') and (mem_ready = '1') and (pending_write = '1') then
        state_reg <= 0b10;
        fill_line_reg <= '1';
      elsif (is_fetch = '1') and (mem_ready = '1') and (pending_write = '0') then
        state_reg <= 0b00;
        fill_line_reg <= '1';
      elsif (is_wb = '1') and (mem_ready = '1') then
        state_reg <= 0b00;
        pending_write <= '0';
        fill_line_reg <= '0';
      else
        fill_line_reg <= '0';
      end if;
    end if;
  end process;

  state <= state_reg;
  cpu_ready <= (is_idle and cache_hit) or (is_fetch and mem_ready and (not pending_write)) or (is_wb and mem_ready);
  mem_read <= is_fetch;
  mem_write <= is_wb;
  fill_line <= fill_line_reg;
end architecture;
`,
        test: `load CacheController
-- Reset
set reset 1
tick
expect state 0b00
set reset 0

-- Read hit: stays in IDLE, cpu_ready
set cpu_read 1
set cpu_write 0
set cache_hit 1
tick
expect state 0b00
expect cpu_ready 1

-- Read miss: goes to FETCH
set cache_hit 0
tick
expect state 0b01
expect mem_read 1

-- Memory ready: back to IDLE
set mem_ready 1
tick
expect state 0b00
expect fill_line 1
`,
    },

    // =========================================================================
    // Project 8: Capstone - Complete Computer
    // =========================================================================
    // 🎮 The culmination: from NAND gates to a working computer!
    // ROM is like a Game Boy cartridge - plug in your program and play!

    'ROM32K': {
        project: 8,
        name: 'ROM32K',
        description: 'Read-Only Memory (32K x 16-bit)',
        dependencies: [],
        template: `-- ============================================
-- ROM32K: Mémoire Programme (32K x 16 bits)
-- ============================================
-- La ROM (Read-Only Memory) est la mémoire qui contient
-- votre programme. C'est l'équivalent de la cartouche
-- de jeu qu'on insère dans une Game Boy !
--
-- 🎮 Analogie avec la Game Boy:
-- - La cartouche contient le jeu (le programme)
-- - On l'insère dans la console (l'ordinateur)
-- - La console lit les instructions de la cartouche
-- - Elle exécute le jeu !
--
-- Interface:
-- - addr (15 bits): adresse de l'instruction à lire
-- - dout (16 bits): l'instruction à cette adresse
--
-- La ROM est purement combinatoire: dès qu'on change
-- l'adresse, la donnée correspondante apparaît en sortie.
-- Pas besoin de clock !
--
-- C'est une primitive du simulateur (comme NAND).
-- Vous n'avez rien à implémenter ici, mais vous devez
-- comprendre comment l'utiliser dans le chip Computer.
-- ============================================

entity ROM32K is
  port(
    addr : in bits(14 downto 0);   -- 15 bits = 32K addresses
    dout : out bits(15 downto 0)   -- 16-bit instruction output
  );
end entity;

architecture rtl of ROM32K is
  -- rom is a simulator primitive (like nand2, dff, ram)
  component rom
    port(addr : in bits(14 downto 0); dout : out bits(15 downto 0));
  end component;
begin
  -- Instantiate the ROM primitive
  u_rom: rom port map (addr => addr, dout => dout);
end architecture;
`,
        solution: `-- ROM32K: Program Memory (32K x 16-bit)
-- 🎮 Think of it like a Game Boy cartridge:
-- - The cartridge contains your game (program)
-- - You insert it into the console (computer)
-- - The console reads instructions from the cartridge
-- - The game runs!

entity ROM32K is
  port(
    addr : in bits(14 downto 0);   -- 15 bits = 32K addresses
    dout : out bits(15 downto 0)   -- 16-bit instruction output
  );
end entity;

architecture rtl of ROM32K is
  -- rom is a simulator primitive (like nand2, dff, ram)
  component rom
    port(addr : in bits(14 downto 0); dout : out bits(15 downto 0));
  end component;
begin
  -- Instantiate the ROM primitive
  u_rom: rom port map (addr => addr, dout => dout);
end architecture;
`,
        test: `// Test ROM32K with pre-loaded program data
// ROM content is loaded via romload command

load ROM32K

// Load a simple test program into ROM
// Format: hex values, one per word
romload 0x1234 0x5678 0xABCD 0x0001 0xFFFF

// Read address 0
set addr 0b000000000000000
eval
expect dout 0x1234

// Read address 1
set addr 0b000000000000001
eval
expect dout 0x5678

// Read address 2
set addr 0b000000000000010
eval
expect dout 0xABCD

// Read address 3
set addr 0b000000000000011
eval
expect dout 0x0001

// Read address 4
set addr 0b000000000000100
eval
expect dout 0xFFFF
`,
    },

    'Computer': {
        project: 8,
        name: 'Computer',
        description: 'Complete Computer (ROM + CPU + RAM)',
        dependencies: ['ROM32K', 'CPU', 'RAM64'],
        template: `-- ============================================
-- Computer: L'Ordinateur Complet 🖥️
-- ============================================
-- C'est l'aboutissement du projet Nand2Tetris !
-- Vous allez assembler les pièces que vous avez construites:
--
--   ┌─────────────────────────────────────────┐
--   │              COMPUTER                    │
--   │  ┌────────┐   ┌─────┐   ┌────────┐     │
--   │  │ ROM32K │──▶│ CPU │◀─▶│ RAM64  │     │
--   │  │(program)│  └─────┘   │(data)  │     │
--   │  └────────┘      │      └────────┘     │
--   │       ▲          │                      │
--   │       │          ▼                      │
--   │    🎮         outputs                   │
--   │  Cartouche                              │
--   └─────────────────────────────────────────┘
--
-- Architecture Harvard:
-- - ROM32K: contient le programme (lecture seule)
-- - RAM64: contient les données (lecture/écriture)
-- - CPU: exécute les instructions, lit/écrit la RAM
--
-- Connexions:
-- 1. ROM.addr ← CPU.pc_out (PC dit quelle instruction lire)
-- 2. CPU.instr ← ROM.dout (ROM fournit l'instruction)
-- 3. RAM.addr ← CPU.mem_addr (CPU dit où accéder)
-- 4. RAM.din ← CPU.mem_out (CPU envoie données à écrire)
-- 5. CPU.mem_in ← RAM.dout (RAM renvoie données lues)
-- 6. RAM.we ← CPU.mem_we (CPU contrôle écriture)
--
-- C'est le cycle fetch-execute en action !
-- ============================================

entity Computer is
  port(
    clk   : in bit;
    reset : in bit
  );
end entity;

architecture rtl of Computer is
  -- Components
  component ROM32K
    port(addr : in bits(14 downto 0); dout : out bits(15 downto 0));
  end component;

  component CPU
    port(clk, reset : in bit;
         instr, mem_in : in bits(15 downto 0);
         mem_out, mem_addr, pc_out : out bits(15 downto 0);
         mem_we : out bit);
  end component;

  component RAM64
    port(clk : in bit; din : in bits(15 downto 0);
         addr : in bits(5 downto 0); we : in bit;
         dout : out bits(15 downto 0));
  end component;

  -- Internal signals
  signal instruction : bits(15 downto 0);
  signal pc : bits(15 downto 0);
  signal mem_addr : bits(15 downto 0);
  signal mem_out : bits(15 downto 0);
  signal mem_in : bits(15 downto 0);
  signal mem_we : bit;
begin
  -- YOUR CODE HERE
  -- Instantiate and connect: rom, cpu, ram
end architecture;
`,
        solution: `-- Computer: The Complete Computer 🖥️
-- The culmination of Nand2Tetris!
--
-- 🎮 Like a Game Boy with its cartridge inserted:
-- - ROM32K = The game cartridge (your program)
-- - CPU = The processor (executes instructions)
-- - RAM64 = Working memory (game state, variables)

entity Computer is
  port(
    clk   : in bit;
    reset : in bit
  );
end entity;

architecture rtl of Computer is
  component ROM32K
    port(addr : in bits(14 downto 0); dout : out bits(15 downto 0));
  end component;

  component CPU
    port(clk, reset : in bit;
         instr, mem_in : in bits(15 downto 0);
         mem_out, mem_addr, pc_out : out bits(15 downto 0);
         mem_we : out bit);
  end component;

  component RAM64
    port(clk : in bit; din : in bits(15 downto 0);
         addr : in bits(5 downto 0); we : in bit;
         dout : out bits(15 downto 0));
  end component;

  signal instruction : bits(15 downto 0);
  signal pc : bits(15 downto 0);
  signal mem_addr : bits(15 downto 0);
  signal mem_out : bits(15 downto 0);
  signal mem_in : bits(15 downto 0);
  signal mem_we : bit;
begin
  -- Program Memory (The Cartridge!)
  rom: ROM32K port map(
    addr => pc(14 downto 0),
    dout => instruction
  );

  -- Central Processing Unit
  cpu: CPU port map(
    clk => clk,
    reset => reset,
    instr => instruction,
    mem_in => mem_in,
    mem_out => mem_out,
    mem_addr => mem_addr,
    mem_we => mem_we,
    pc_out => pc
  );

  -- Data Memory
  ram: RAM64 port map(
    clk => clk,
    din => mem_out,
    addr => mem_addr(5 downto 0),
    we => mem_we,
    dout => mem_in
  );
end architecture;
`,
        test: `// =====================================================
// 🎮 CAPSTONE: L'Ordinateur Complet en Action !
// =====================================================
//
// Ce test démontre le cycle FETCH-EXECUTE complet.
// C'est EXACTEMENT comme une Game Boy avec sa cartouche !
//
//   ┌──────────────────────────────────────────────────┐
//   │  🎮 CARTOUCHE (ROM) → CONSOLE (CPU) → MEMOIRE   │
//   │                                                  │
//   │   Programme en C:        Code Machine (ROM):    │
//   │                                                  │
//   │   int main() {           0x610A  // MOVI R1,10  │
//   │     int a = 10;          0x6220  // MOVI R2,32  │
//   │     int b = 32;          0x0312  // ADD R3,R1,R2│
//   │     int c = a + b;       0x5030  // STORE [0],R3│
//   │     RAM[0] = c;                                 │
//   │     return c; // 42 !    Résultat: RAM[0] = 42  │
//   │   }                                             │
//   └──────────────────────────────────────────────────┘
//
// Format d'instruction A32-Lite (16 bits):
//   [15:12] = opcode
//   [11:8]  = rd (registre destination)
//   [7:0]   = rs1/rs2 ou imm8 (pour MOVI)
//
// Opcodes:
//   0x0 = ADD   rd = rs1 + rs2
//   0x1 = SUB   rd = rs1 - rs2
//   0x4 = LOAD  rd = RAM[rs1]
//   0x5 = STORE RAM[rs1] = rs2
//   0x6 = MOVI  rd = imm8  (charge constante!)
// =====================================================

load Computer

// =====================================================
// Charger le programme dans la ROM (la "cartouche")
// =====================================================
// Addr | Hex    | Assembleur      | C équivalent
// -----|--------|-----------------|---------------
// 0x00 | 0x610A | MOVI R1, #10    | int a = 10;
// 0x01 | 0x6220 | MOVI R2, #32    | int b = 32;
// 0x02 | 0x0312 | ADD  R3, R1, R2 | int c = a + b;
// 0x03 | 0x5030 | STORE [R0], R3  | RAM[0] = c;
// =====================================================
romload 0x610A 0x6220 0x0312 0x5030

// Reset du Computer (comme appuyer sur Power)
set reset 1
tick
tock
set reset 0

// =====================================================
// Exécution du programme - cycle par cycle
// =====================================================

// Cycle 1: MOVI R1, #10
// CPU lit ROM[0]=0x610A, décode MOVI, R1 <- 10
tick
tock

// Cycle 2: MOVI R2, #32
// CPU lit ROM[1]=0x6220, décode MOVI, R2 <- 32
tick
tock

// Cycle 3: ADD R3, R1, R2
// CPU lit ROM[2]=0x0312, décode ADD, R3 <- R1 + R2 = 42
tick
tock

// Cycle 4: STORE [R0], R3
// CPU lit ROM[3]=0x5030, écrit R3 (42) dans RAM[0]
tick
tock

// =====================================================
// 🎉 Le programme a calculé 10 + 32 = 42 !
// Le résultat est maintenant stocké en RAM[0]
//
// C'est exactement ce qui se passe quand vous:
// 1. Insérez une cartouche Game Boy (= romload)
// 2. Appuyez sur Power (= reset)
// 3. Le jeu s'exécute ! (= cycles tick/tock)
// =====================================================
`,
    },
};

// Project order for display
export const PROJECTS = [
    { id: 1, name: 'Portes Logiques', chips: ['Inv', 'And2', 'Or2', 'Xor2', 'Mux', 'DMux'] },
    { id: 2, name: 'Multi-bits', chips: ['Inv16', 'And16', 'Or16', 'Mux16', 'Or8Way', 'Mux4Way16', 'Mux8Way16', 'DMux4Way', 'DMux8Way'] },
    { id: 3, name: 'Arithmetique', chips: ['HalfAdder', 'FullAdder', 'Add16', 'Inc16', 'Sub16', 'ALU', 'And8', 'Mul8'] },
    { id: 4, name: 'Sequentiel', chips: ['DFF1', 'BitReg', 'Register16', 'PC', 'RAM8', 'RAM64', 'RegFile'] },
    { id: 5, name: 'CPU', chips: ['Decoder', 'CondCheck', 'Control', 'CPU'] },
    { id: 6, name: 'CPU Pipeline', chips: ['IF_ID_Reg', 'HazardDetect', 'ForwardUnit', 'CPU_Pipeline'] },
    { id: 7, name: 'Cache L1', chips: ['CacheLine', 'TagCompare', 'WordSelect', 'CacheController'] },
    { id: 8, name: 'Capstone: Ordinateur Complet', chips: ['ROM32K', 'Computer'] },
];

// Get chip info
export function getChip(name) {
    return HDL_CHIPS[name];
}

// Check if all dependencies are unlocked
export function canAttempt(chipName, unlockedChips) {
    const chip = HDL_CHIPS[chipName];
    if (!chip) return false;
    return chip.dependencies.every(dep => unlockedChips.includes(dep));
}

// Get the library sources for a chip's dependencies
export function getDependencyLibrary(chipName, chipSources) {
    const chip = HDL_CHIPS[chipName];
    if (!chip) return {};

    const library = {};
    const visited = new Set();

    function collectDeps(name) {
        if (visited.has(name)) return;
        visited.add(name);

        const c = HDL_CHIPS[name];
        if (!c) return;

        for (const dep of c.dependencies) {
            if (chipSources[dep]) {
                library[dep] = chipSources[dep];
            }
            collectDeps(dep);
        }
    }

    collectDeps(chipName);
    return library;
}
