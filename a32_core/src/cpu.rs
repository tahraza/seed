use crate::isa::{Flags, Reg, REG_COUNT};

#[derive(Clone, Debug)]
pub struct Cpu {
    regs: [u32; REG_COUNT],
    flags: Flags,
}

impl Cpu {
    pub fn new() -> Self {
        Self {
            regs: [0; REG_COUNT],
            flags: Flags::default(),
        }
    }

    pub fn reg(&self, reg: Reg) -> u32 {
        self.regs[reg.index()]
    }

    pub fn set_reg(&mut self, reg: Reg, value: u32) {
        self.regs[reg.index()] = value;
    }

    pub fn pc(&self) -> u32 {
        self.reg(Reg::PC)
    }

    pub fn pc_read(&self) -> u32 {
        self.pc().wrapping_add(4)
    }

    pub fn set_pc(&mut self, value: u32) {
        self.set_reg(Reg::PC, value);
    }

    pub fn flags(&self) -> Flags {
        self.flags
    }

    pub fn flags_mut(&mut self) -> &mut Flags {
        &mut self.flags
    }
}
