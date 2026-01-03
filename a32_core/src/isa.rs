#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum Cond {
    EQ,
    NE,
    CS,
    CC,
    MI,
    PL,
    VS,
    VC,
    HI,
    LS,
    GE,
    LT,
    GT,
    LE,
    AL,
    NV,
}

impl Cond {
    pub fn from_u4(value: u8) -> Option<Self> {
        Some(match value & 0xF {
            0x0 => Cond::EQ,
            0x1 => Cond::NE,
            0x2 => Cond::CS,
            0x3 => Cond::CC,
            0x4 => Cond::MI,
            0x5 => Cond::PL,
            0x6 => Cond::VS,
            0x7 => Cond::VC,
            0x8 => Cond::HI,
            0x9 => Cond::LS,
            0xA => Cond::GE,
            0xB => Cond::LT,
            0xC => Cond::GT,
            0xD => Cond::LE,
            0xE => Cond::AL,
            0xF => Cond::NV,
            _ => return None,
        })
    }

    pub fn to_u4(self) -> u8 {
        match self {
            Cond::EQ => 0x0,
            Cond::NE => 0x1,
            Cond::CS => 0x2,
            Cond::CC => 0x3,
            Cond::MI => 0x4,
            Cond::PL => 0x5,
            Cond::VS => 0x6,
            Cond::VC => 0x7,
            Cond::HI => 0x8,
            Cond::LS => 0x9,
            Cond::GE => 0xA,
            Cond::LT => 0xB,
            Cond::GT => 0xC,
            Cond::LE => 0xD,
            Cond::AL => 0xE,
            Cond::NV => 0xF,
        }
    }
}

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct Reg(u8);

pub const REG_COUNT: usize = 16;

impl Reg {
    pub const R0: Reg = Reg(0);
    pub const R1: Reg = Reg(1);
    pub const R2: Reg = Reg(2);
    pub const R3: Reg = Reg(3);
    pub const R4: Reg = Reg(4);
    pub const R5: Reg = Reg(5);
    pub const R6: Reg = Reg(6);
    pub const R7: Reg = Reg(7);
    pub const R8: Reg = Reg(8);
    pub const R9: Reg = Reg(9);
    pub const R10: Reg = Reg(10);
    pub const R11: Reg = Reg(11);
    pub const R12: Reg = Reg(12);
    pub const R13: Reg = Reg(13);
    pub const R14: Reg = Reg(14);
    pub const R15: Reg = Reg(15);

    pub const SP: Reg = Reg(13);
    pub const LR: Reg = Reg(14);
    pub const PC: Reg = Reg(15);

    pub fn index(self) -> usize {
        self.0 as usize
    }

    pub fn from_u8(value: u8) -> Option<Self> {
        if value < REG_COUNT as u8 {
            Some(Reg(value))
        } else {
            None
        }
    }

    pub fn to_u8(self) -> u8 {
        self.0
    }
}

#[derive(Copy, Clone, Debug, Default, PartialEq, Eq)]
pub struct Flags {
    pub n: bool,
    pub z: bool,
    pub c: bool,
    pub v: bool,
}
