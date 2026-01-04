use crate::cpu::Cpu;
use crate::isa::{Cond, Flags, Reg};
use crate::mem::Memory;
use std::collections::{HashSet, VecDeque};

const MMIO_PUTC: u32 = 0xFFFF_0000;
const MMIO_GETC: u32 = 0xFFFF_0004;
const MMIO_EXIT: u32 = 0xFFFF_0010;

// Screen: 320x240 pixels, 1 bit per pixel (black/white)
// Memory-mapped framebuffer
pub const SCREEN_WIDTH: u32 = 320;
pub const SCREEN_HEIGHT: u32 = 240;
pub const SCREEN_BASE: u32 = 0x0040_0000;
pub const SCREEN_SIZE: u32 = (SCREEN_WIDTH * SCREEN_HEIGHT) / 8; // 9600 bytes

// Keyboard: single register with ASCII code of pressed key (0 if none)
pub const KEYBOARD_ADDR: u32 = 0x0040_2600;

/// Execution trace entry
#[derive(Clone, Debug)]
pub struct TraceEntry {
    pub pc: u32,
    pub instr: u32,
    pub regs: [u32; 16],
    pub flags: Flags,
}

#[derive(Clone, Debug)]
pub struct SimConfig {
    pub ram_size: u32,
    pub strict_traps: bool,
    pub max_steps: u64,
    pub stack_top: Option<u32>,
}

impl Default for SimConfig {
    fn default() -> Self {
        Self {
            ram_size: 0x0010_0000,
            strict_traps: true,
            max_steps: 1_000_000,
            stack_top: None,
        }
    }
}

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum TrapCode {
    Misaligned,
    MemFault,
    Illegal,
    DivZero,
}

impl TrapCode {
    pub fn as_str(self) -> &'static str {
        match self {
            TrapCode::Misaligned => "MISALIGNED",
            TrapCode::MemFault => "MEM_FAULT",
            TrapCode::Illegal => "ILLEGAL",
            TrapCode::DivZero => "DIV_ZERO",
        }
    }
}

#[derive(Clone, Debug)]
pub struct Trap {
    pub code: TrapCode,
    pub pc: u32,
    pub addr: u32,
    pub instr: u32,
}

#[derive(Clone, Debug)]
pub struct Exit {
    pub code: u32,
    pub pc: u32,
}

#[derive(Clone, Debug)]
pub enum StepOutcome {
    Continue,
    Exit(Exit),
    Trap(Trap),
}

#[derive(Clone, Debug)]
pub struct RunOutcome {
    pub exit: Option<Exit>,
    pub trap: Option<Trap>,
    pub breakpoint_hit: Option<u32>,
    pub steps: u64,
}

#[derive(Debug)]
pub struct SimError {
    code: String,
    message: String,
}

impl SimError {
    pub fn new(code: &str, message: impl Into<String>) -> Self {
        Self {
            code: code.to_string(),
            message: message.into(),
        }
    }

    pub fn code_str(&self) -> &str {
        &self.code
    }
}

impl std::fmt::Display for SimError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {}", self.code, self.message)
    }
}

impl std::error::Error for SimError {}

#[derive(Clone, Debug)]
enum StopReason {
    Exit(Exit),
    Trap(Trap),
}

#[derive(Clone, Debug)]
pub struct Machine {
    cpu: Cpu,
    mem: Memory,
    config: SimConfig,
    output: Vec<u8>,
    input: VecDeque<u8>,
    stop: Option<StopReason>,
    steps: u64,
    // Debugger state
    breakpoints: HashSet<u32>,
    trace_enabled: bool,
    trace_buffer: VecDeque<TraceEntry>,
    trace_max_size: usize,
    // Screen and keyboard
    screen: Vec<u8>,
    screen_dirty: bool,
    keyboard: u32,
}

impl Machine {
    pub fn new(config: SimConfig) -> Self {
        let mut cpu = Cpu::new();
        let sp = config
            .stack_top
            .unwrap_or(config.ram_size)
            .min(config.ram_size);
        cpu.set_reg(Reg::SP, sp);
        Self {
            cpu,
            mem: Memory::new(config.ram_size as usize),
            config,
            output: Vec::new(),
            input: VecDeque::new(),
            stop: None,
            steps: 0,
            breakpoints: HashSet::new(),
            trace_enabled: false,
            trace_buffer: VecDeque::new(),
            trace_max_size: 1024,
            screen: vec![0u8; SCREEN_SIZE as usize],
            screen_dirty: false,
            keyboard: 0,
        }
    }

    pub fn from_a32b(bytes: &[u8], config: SimConfig) -> Result<Self, SimError> {
        let mut machine = Machine::new(config);
        machine.load_a32b(bytes)?;
        Ok(machine)
    }

    pub fn load_a32b(&mut self, bytes: &[u8]) -> Result<(), SimError> {
        let image = load_a32b(bytes, self.config.ram_size)?;
        self.mem = Memory::new(self.config.ram_size as usize);
        for seg in image.segments {
            if seg.mem_size == 0 {
                continue;
            }
            match seg.seg_type {
                SegmentType::Load => {
                    let data = &bytes[seg.file_off as usize..(seg.file_off + seg.file_size) as usize];
                    for (i, byte) in data.iter().enumerate() {
                        self.mem
                            .write8(seg.vaddr + i as u32, *byte)
                            .ok_or_else(|| SimError::new("E4002", "segment out of bounds"))?;
                    }
                    let mut addr = seg.vaddr + seg.file_size;
                    let end = seg.vaddr + seg.mem_size;
                    while addr < end {
                        self.mem
                            .write8(addr, 0)
                            .ok_or_else(|| SimError::new("E4002", "segment out of bounds"))?;
                        addr += 1;
                    }
                }
                SegmentType::Bss => {
                    let mut addr = seg.vaddr;
                    let end = seg.vaddr + seg.mem_size;
                    while addr < end {
                        self.mem
                            .write8(addr, 0)
                            .ok_or_else(|| SimError::new("E4002", "segment out of bounds"))?;
                        addr += 1;
                    }
                }
                SegmentType::Other => {}
            }
        }

        let sp = self
            .config
            .stack_top
            .unwrap_or(self.config.ram_size)
            .min(self.config.ram_size);
        self.cpu = Cpu::new();
        self.cpu.set_reg(Reg::SP, sp);
        self.cpu.set_pc(image.entry & !3);
        self.stop = None;
        self.steps = 0;
        self.output.clear();
        self.input.clear();
        // Reset screen and keyboard
        self.screen.fill(0);
        self.screen_dirty = false;
        self.keyboard = 0;
        Ok(())
    }

    pub fn cpu(&self) -> &Cpu {
        &self.cpu
    }

    pub fn mem(&self) -> &Memory {
        &self.mem
    }

    pub fn read_u32(&self, addr: u32) -> Option<u32> {
        self.mem.read32_le(addr)
    }

    pub fn output_string(&self) -> String {
        String::from_utf8_lossy(&self.output).to_string()
    }

    pub fn push_input(&mut self, data: &[u8]) {
        self.input.extend(data.iter().copied());
    }

    // ========== Screen ==========

    /// Get the screen framebuffer (320x240, 1 bit per pixel, row-major)
    /// Each byte contains 8 pixels, MSB is leftmost
    pub fn screen(&self) -> &[u8] {
        &self.screen
    }

    /// Check if screen has been modified since last clear_screen_dirty
    pub fn screen_dirty(&self) -> bool {
        self.screen_dirty
    }

    /// Clear the screen dirty flag
    pub fn clear_screen_dirty(&mut self) {
        self.screen_dirty = false;
    }

    /// Set a pixel on the screen (x: 0-319, y: 0-239)
    pub fn set_pixel(&mut self, x: u32, y: u32, on: bool) {
        if x >= SCREEN_WIDTH || y >= SCREEN_HEIGHT {
            return;
        }
        let bit_index = y * SCREEN_WIDTH + x;
        let byte_index = (bit_index / 8) as usize;
        let bit_offset = 7 - (bit_index % 8); // MSB is leftmost
        if on {
            self.screen[byte_index] |= 1 << bit_offset;
        } else {
            self.screen[byte_index] &= !(1 << bit_offset);
        }
        self.screen_dirty = true;
    }

    /// Get a pixel from the screen
    pub fn get_pixel(&self, x: u32, y: u32) -> bool {
        if x >= SCREEN_WIDTH || y >= SCREEN_HEIGHT {
            return false;
        }
        let bit_index = y * SCREEN_WIDTH + x;
        let byte_index = (bit_index / 8) as usize;
        let bit_offset = 7 - (bit_index % 8);
        (self.screen[byte_index] >> bit_offset) & 1 != 0
    }

    /// Clear the screen
    pub fn clear_screen(&mut self) {
        self.screen.fill(0);
        self.screen_dirty = true;
    }

    // ========== Keyboard ==========

    /// Set the currently pressed key (0 = no key)
    pub fn set_key(&mut self, key: u32) {
        self.keyboard = key;
    }

    /// Get the currently pressed key
    pub fn get_key(&self) -> u32 {
        self.keyboard
    }

    // ========== Debugger: Breakpoints ==========

    /// Add a breakpoint at the given address
    pub fn add_breakpoint(&mut self, addr: u32) {
        self.breakpoints.insert(addr & !3); // Align to 4 bytes
    }

    /// Remove a breakpoint at the given address
    pub fn remove_breakpoint(&mut self, addr: u32) -> bool {
        self.breakpoints.remove(&(addr & !3))
    }

    /// Clear all breakpoints
    pub fn clear_breakpoints(&mut self) {
        self.breakpoints.clear();
    }

    /// Check if there's a breakpoint at the given address
    pub fn has_breakpoint(&self, addr: u32) -> bool {
        self.breakpoints.contains(&(addr & !3))
    }

    /// Get all breakpoints
    pub fn breakpoints(&self) -> impl Iterator<Item = &u32> {
        self.breakpoints.iter()
    }

    // ========== Debugger: Trace ==========

    /// Enable or disable execution tracing
    pub fn set_trace_enabled(&mut self, enabled: bool) {
        self.trace_enabled = enabled;
    }

    /// Check if tracing is enabled
    pub fn trace_enabled(&self) -> bool {
        self.trace_enabled
    }

    /// Set maximum trace buffer size
    pub fn set_trace_max_size(&mut self, size: usize) {
        self.trace_max_size = size;
        while self.trace_buffer.len() > size {
            self.trace_buffer.pop_front();
        }
    }

    /// Get the trace buffer
    pub fn trace(&self) -> &VecDeque<TraceEntry> {
        &self.trace_buffer
    }

    /// Clear the trace buffer
    pub fn clear_trace(&mut self) {
        self.trace_buffer.clear();
    }

    /// Record current state to trace buffer
    fn record_trace(&mut self, pc: u32, instr: u32) {
        if !self.trace_enabled {
            return;
        }
        let entry = TraceEntry {
            pc,
            instr,
            regs: self.cpu.regs_array(),
            flags: self.cpu.flags(),
        };
        if self.trace_buffer.len() >= self.trace_max_size {
            self.trace_buffer.pop_front();
        }
        self.trace_buffer.push_back(entry);
    }

    // ========== Debugger: Memory Inspection ==========

    /// Read a byte from memory (for inspection)
    pub fn peek_u8(&self, addr: u32) -> Option<u8> {
        self.mem.read8(addr)
    }

    /// Read a 32-bit word from memory (for inspection)
    pub fn peek_u32(&self, addr: u32) -> Option<u32> {
        self.mem.read32_le(addr)
    }

    /// Read a range of bytes from memory
    pub fn peek_bytes(&self, addr: u32, len: usize) -> Vec<u8> {
        let mut result = Vec::with_capacity(len);
        for i in 0..len {
            match self.mem.read8(addr.wrapping_add(i as u32)) {
                Some(byte) => result.push(byte),
                None => break,
            }
        }
        result
    }

    /// Write a byte to memory (for debugging)
    pub fn poke_u8(&mut self, addr: u32, value: u8) -> bool {
        self.mem.write8(addr, value).is_some()
    }

    /// Write a 32-bit word to memory (for debugging)
    pub fn poke_u32(&mut self, addr: u32, value: u32) -> bool {
        self.mem.write32_le(addr, value).is_some()
    }

    /// Get register value by index
    pub fn get_reg(&self, reg: Reg) -> u32 {
        self.cpu.reg(reg)
    }

    /// Set register value
    pub fn set_reg(&mut self, reg: Reg, value: u32) {
        if reg == Reg::PC {
            self.cpu.set_pc(value);
        } else {
            self.cpu.set_reg(reg, value);
        }
    }

    /// Get the flags
    pub fn flags(&self) -> Flags {
        self.cpu.flags()
    }

    /// Get current PC
    pub fn pc(&self) -> u32 {
        self.cpu.pc()
    }

    /// Get step count
    pub fn steps(&self) -> u64 {
        self.steps
    }

    // ========== Debugger: Run Control ==========

    /// Run until breakpoint, exit, trap, or max_steps
    pub fn run_debug(&mut self, max_steps: u64) -> Result<RunOutcome, SimError> {
        let limit = max_steps.min(self.config.max_steps);
        for _ in 0..limit {
            // Check for breakpoint before stepping
            let pc = self.cpu.pc();
            if self.breakpoints.contains(&pc) {
                return Ok(RunOutcome {
                    exit: None,
                    trap: None,
                    breakpoint_hit: Some(pc),
                    steps: self.steps,
                });
            }

            match self.step() {
                StepOutcome::Continue => continue,
                StepOutcome::Exit(exit) => {
                    return Ok(RunOutcome {
                        exit: Some(exit),
                        trap: None,
                        breakpoint_hit: None,
                        steps: self.steps,
                    });
                }
                StepOutcome::Trap(trap) => {
                    return Ok(RunOutcome {
                        exit: None,
                        trap: Some(trap),
                        breakpoint_hit: None,
                        steps: self.steps,
                    });
                }
            }
        }
        Err(SimError::new("E4005", "max steps exceeded"))
    }

    /// Step over a function call (run until return)
    pub fn step_over(&mut self) -> Result<RunOutcome, SimError> {
        let pc = self.cpu.pc();
        let instr = self.mem.read32_le(pc).unwrap_or(0);

        // Check if this is a BL instruction (branch with link)
        let class = (instr >> 25) & 0x7;
        let is_bl = class == 0b011 && ((instr >> 24) & 0x1) != 0;

        if is_bl {
            // It's a call - set temporary breakpoint at return address
            let return_addr = pc.wrapping_add(4);
            let had_bp = self.has_breakpoint(return_addr);
            if !had_bp {
                self.add_breakpoint(return_addr);
            }
            let result = self.run_debug(self.config.max_steps);
            if !had_bp {
                self.remove_breakpoint(return_addr);
            }
            result
        } else {
            // Not a call - just step once
            match self.step() {
                StepOutcome::Continue => Ok(RunOutcome {
                    exit: None,
                    trap: None,
                    breakpoint_hit: None,
                    steps: self.steps,
                }),
                StepOutcome::Exit(exit) => Ok(RunOutcome {
                    exit: Some(exit),
                    trap: None,
                    breakpoint_hit: None,
                    steps: self.steps,
                }),
                StepOutcome::Trap(trap) => Ok(RunOutcome {
                    exit: None,
                    trap: Some(trap),
                    breakpoint_hit: None,
                    steps: self.steps,
                }),
            }
        }
    }

    pub fn step(&mut self) -> StepOutcome {
        if let Some(stop) = self.stop.clone() {
            return match stop {
                StopReason::Exit(exit) => StepOutcome::Exit(exit),
                StopReason::Trap(trap) => StepOutcome::Trap(trap),
            };
        }
        let pc = self.cpu.pc();
        let instr = match self.fetch32(pc) {
            Ok(word) => word,
            Err(trap) => return self.halt_with_trap(trap),
        };

        // Record trace before execution
        self.record_trace(pc, instr);
        let cond = match Cond::from_u4((instr >> 28) as u8) {
            Some(c) => c,
            None => {
                return self.handle_illegal(pc, instr);
            }
        };
        if !cond_passed(cond, self.cpu.flags()) {
            self.cpu.set_pc(pc.wrapping_add(4));
            self.steps += 1;
            return StepOutcome::Continue;
        }

        let class = (instr >> 25) & 0x7;
        let outcome = match class {
            0b000 => self.exec_alu_reg(pc, instr),
            0b001 => self.exec_alu_imm(pc, instr),
            0b010 => self.exec_load_store(pc, instr),
            0b011 => self.exec_branch(pc, instr),
            0b100 => self.exec_system(pc, instr),
            _ => self.handle_illegal(pc, instr),
        };

        self.steps += 1;
        outcome
    }

    pub fn run(&mut self, max_steps: u64) -> Result<RunOutcome, SimError> {
        let limit = max_steps.min(self.config.max_steps);
        for _ in 0..limit {
            match self.step() {
                StepOutcome::Continue => continue,
                StepOutcome::Exit(exit) => {
                    return Ok(RunOutcome {
                        exit: Some(exit),
                        trap: None,
                        breakpoint_hit: None,
                        steps: self.steps,
                    });
                }
                StepOutcome::Trap(trap) => {
                    return Ok(RunOutcome {
                        exit: None,
                        trap: Some(trap),
                        breakpoint_hit: None,
                        steps: self.steps,
                    });
                }
            }
        }
        Err(SimError::new("E4005", "max steps exceeded"))
    }

    fn exec_alu_reg(&mut self, pc: u32, instr: u32) -> StepOutcome {
        let op = (instr >> 21) & 0xF;
        let s = ((instr >> 20) & 0x1) != 0;
        let rd = Reg::from_u8(((instr >> 16) & 0xF) as u8).unwrap();
        let rn = Reg::from_u8(((instr >> 12) & 0xF) as u8).unwrap();
        let rm = Reg::from_u8(((instr >> 8) & 0xF) as u8).unwrap();
        let shift = (instr & 0xFF) as u8;
        let (op2, shift_carry) = match shift_reg(self.read_reg(rm), shift) {
            Ok(v) => v,
            Err(_) => return self.handle_illegal(pc, instr),
        };

        let rn_val = self.read_reg(rn);
        self.exec_alu(pc, instr, op, s, rd, rn_val, op2, shift_carry)
    }

    fn exec_alu_imm(&mut self, pc: u32, instr: u32) -> StepOutcome {
        let op = (instr >> 21) & 0xF;
        let s = ((instr >> 20) & 0x1) != 0;
        let rd = Reg::from_u8(((instr >> 16) & 0xF) as u8).unwrap();
        let rn = Reg::from_u8(((instr >> 12) & 0xF) as u8).unwrap();
        let imm12 = (instr & 0xFFF) as u32;
        let op2 = sign_extend(imm12, 12);
        let rn_val = self.read_reg(rn);
        self.exec_alu(pc, instr, op, s, rd, rn_val, op2, None)
    }

    fn exec_alu(
        &mut self,
        pc: u32,
        instr: u32,
        op: u32,
        s: bool,
        rd: Reg,
        rn_val: u32,
        op2: u32,
        shift_carry: Option<bool>,
    ) -> StepOutcome {
        let result;
        let mut write_result = true;
        let mut set_flags = s;

        match op {
            0b0000 => {
                result = rn_val & op2;
            }
            0b0001 => {
                result = rn_val ^ op2;
            }
            0b0010 => {
                result = rn_val.wrapping_sub(op2);
            }
            0b0011 => {
                result = rn_val.wrapping_add(op2);
            }
            0b0100 => {
                result = rn_val | op2;
            }
            0b0101 => {
                result = op2;
            }
            0b0110 => {
                result = !op2;
            }
            0b0111 => {
                result = rn_val.wrapping_sub(op2);
                write_result = false;
                set_flags = true;
            }
            0b1000 => {
                result = rn_val & op2;
                write_result = false;
                set_flags = true;
            }
            _ => return self.handle_illegal(pc, instr),
        }

        if set_flags {
            let mut flags = self.cpu.flags();
            flags.n = (result & 0x8000_0000) != 0;
            flags.z = result == 0;
            match op {
                0b0010 | 0b0111 => {
                    let (res, borrow) = rn_val.overflowing_sub(op2);
                    flags.c = !borrow;
                    flags.v = overflow_sub(rn_val, op2, res);
                }
                0b0011 => {
                    let (res, carry) = rn_val.overflowing_add(op2);
                    flags.c = carry;
                    flags.v = overflow_add(rn_val, op2, res);
                }
                0b0000 | 0b0001 | 0b0100 | 0b0101 | 0b0110 | 0b1000 => {
                    if let Some(carry) = shift_carry {
                        flags.c = carry;
                    }
                }
                _ => {}
            }
            self.cpu.flags_mut().n = flags.n;
            self.cpu.flags_mut().z = flags.z;
            self.cpu.flags_mut().c = flags.c;
            self.cpu.flags_mut().v = flags.v;
        }

        if write_result {
            if rd == Reg::PC {
                self.cpu.set_pc(result & !3);
            } else {
                self.cpu.set_reg(rd, result);
                self.cpu.set_pc(pc.wrapping_add(4));
            }
        } else {
            self.cpu.set_pc(pc.wrapping_add(4));
        }
        StepOutcome::Continue
    }

    fn exec_load_store(&mut self, pc: u32, instr: u32) -> StepOutcome {
        let l = ((instr >> 24) & 0x1) != 0;
        let b = ((instr >> 23) & 0x1) != 0;
        let w = ((instr >> 22) & 0x1) != 0;
        let u = ((instr >> 21) & 0x1) != 0;
        let rd = Reg::from_u8(((instr >> 17) & 0xF) as u8).unwrap();
        let rn = Reg::from_u8(((instr >> 13) & 0xF) as u8).unwrap();
        let off13 = (instr & 0x1FFF) as i32;
        let offset = if u { off13 } else { -off13 };
        let base = self.read_reg(rn);
        let ea = base.wrapping_add(offset as u32);

        if !b && (ea & 0x3) != 0 {
            if self.config.strict_traps {
                return self.halt_with_trap(Trap {
                    code: TrapCode::Misaligned,
                    pc,
                    addr: ea,
                    instr: 0,
                });
            }
        }

        let mut value = 0u32;
        if l {
            if b {
                match self.read8(ea) {
                    Ok(byte) => value = byte as u32,
                    Err(trap) => return self.halt_with_trap(trap.with_pc(pc)),
                }
            } else if (ea & 0x3) == 0 || !self.config.strict_traps {
                match self.read32(ea) {
                    Ok(word) => value = word,
                    Err(trap) => return self.halt_with_trap(trap.with_pc(pc)),
                }
            }
        } else {
            if b {
                if ea == MMIO_EXIT {
                    let code = self.read_reg(rd) & 0xFF;
                    return self.halt_with_exit(Exit { code, pc });
                }
                let byte = (self.read_reg(rd) & 0xFF) as u8;
                if let Err(trap) = self.write8(ea, byte) {
                    return self.halt_with_trap(trap.with_pc(pc));
                }
            } else if (ea & 0x3) == 0 || !self.config.strict_traps {
                if ea == MMIO_EXIT {
                    let code = self.read_reg(rd);
                    return self.halt_with_exit(Exit { code, pc });
                }
                let word = self.read_reg(rd);
                if let Err(trap) = self.write32(ea, word) {
                    return self.halt_with_trap(trap.with_pc(pc));
                }
            }
        }

        if l {
            if rd == Reg::PC {
                self.cpu.set_pc(value & !3);
            } else {
                self.cpu.set_reg(rd, value);
                self.cpu.set_pc(pc.wrapping_add(4));
            }
        } else {
            self.cpu.set_pc(pc.wrapping_add(4));
        }

        if w {
            if rn == Reg::PC {
                self.cpu.set_pc(ea & !3);
            } else {
                self.cpu.set_reg(rn, ea);
            }
        }

        StepOutcome::Continue
    }

    fn exec_branch(&mut self, pc: u32, instr: u32) -> StepOutcome {
        let link = ((instr >> 24) & 0x1) != 0;
        let imm23 = (instr >> 1) & 0x7FFFFF;
        let offset = sign_extend(imm23, 23).wrapping_mul(4);
        let next = pc.wrapping_add(4);
        if link {
            self.cpu.set_reg(Reg::LR, next);
        }
        let target = next.wrapping_add(offset);
        self.cpu.set_pc(target & !3);
        StepOutcome::Continue
    }

    fn exec_system(&mut self, pc: u32, instr: u32) -> StepOutcome {
        let op = (instr >> 21) & 0xF;
        let imm21 = instr & 0x1F_FFFF;
        match op {
            0 => {
                self.cpu.set_pc(pc.wrapping_add(4));
                StepOutcome::Continue
            }
            1 => self.halt_with_exit(Exit { code: 0, pc }),
            2 => self.exec_svc(pc, instr, imm21),
            _ => self.handle_illegal(pc, instr),
        }
    }

    fn exec_svc(&mut self, pc: u32, instr: u32, imm: u32) -> StepOutcome {
        match imm {
            0x1 => self.halt_with_trap(Trap {
                code: TrapCode::DivZero,
                pc,
                addr: 0,
                instr: 0,
            }),
            0x10 => {
                let code = self.read_reg(Reg::R0);
                self.halt_with_exit(Exit { code, pc })
            }
            0x11 => {
                let byte = (self.read_reg(Reg::R0) & 0xFF) as u8;
                self.output.push(byte);
                self.cpu.set_pc(pc.wrapping_add(4));
                StepOutcome::Continue
            }
            0x12 => {
                let value = self.input.pop_front().map(u32::from).unwrap_or(0xFFFF_FFFF);
                self.cpu.set_reg(Reg::R0, value);
                self.cpu.set_pc(pc.wrapping_add(4));
                StepOutcome::Continue
            }
            _ => self.handle_illegal(pc, instr),
        }
    }

    fn read_reg(&self, reg: Reg) -> u32 {
        if reg == Reg::PC {
            self.cpu.pc_read()
        } else {
            self.cpu.reg(reg)
        }
    }

    fn fetch32(&self, addr: u32) -> Result<u32, Trap> {
        if !is_ram_addr(addr, self.config.ram_size) {
            return Err(Trap {
                code: TrapCode::MemFault,
                pc: addr,
                addr,
                instr: 0,
            });
        }
        self.mem
            .read32_le(addr)
            .ok_or(Trap {
                code: TrapCode::MemFault,
                pc: addr,
                addr,
                instr: 0,
            })
    }

    fn read8(&mut self, addr: u32) -> Result<u8, Trap> {
        // MMIO I/O
        if is_mmio_addr(addr) {
            let value = match addr {
                MMIO_GETC => self.input.pop_front().map(u32::from).unwrap_or(0xFFFF_FFFF),
                _ => return Err(Trap::mem_fault(addr)),
            };
            return Ok((value & 0xFF) as u8);
        }
        // Screen memory
        if addr >= SCREEN_BASE && addr < SCREEN_BASE + SCREEN_SIZE {
            let offset = (addr - SCREEN_BASE) as usize;
            return Ok(self.screen[offset]);
        }
        // Keyboard register
        if addr >= KEYBOARD_ADDR && addr < KEYBOARD_ADDR + 4 {
            let byte_offset = (addr - KEYBOARD_ADDR) as usize;
            return Ok(((self.keyboard >> (8 * byte_offset)) & 0xFF) as u8);
        }
        // RAM
        if !is_ram_addr(addr, self.config.ram_size) {
            return Err(Trap::mem_fault(addr));
        }
        self.mem.read8(addr).ok_or_else(|| Trap::mem_fault(addr))
    }

    fn read32(&mut self, addr: u32) -> Result<u32, Trap> {
        // MMIO I/O
        if is_mmio_addr(addr) {
            let value = match addr {
                MMIO_GETC => self.input.pop_front().map(u32::from).unwrap_or(0xFFFF_FFFF),
                _ => return Err(Trap::mem_fault(addr)),
            };
            return Ok(value);
        }
        // Keyboard register (aligned read)
        if addr == KEYBOARD_ADDR {
            return Ok(self.keyboard);
        }
        // Screen memory (aligned read)
        if addr >= SCREEN_BASE && addr + 4 <= SCREEN_BASE + SCREEN_SIZE && (addr & 0x3) == 0 {
            let offset = (addr - SCREEN_BASE) as usize;
            let value = u32::from_le_bytes([
                self.screen[offset],
                self.screen[offset + 1],
                self.screen[offset + 2],
                self.screen[offset + 3],
            ]);
            return Ok(value);
        }
        // Check alignment
        if (addr & 0x3) != 0 && self.config.strict_traps {
            return Err(Trap::misaligned(addr));
        }
        // RAM
        if !is_ram_addr(addr, self.config.ram_size) {
            return Err(Trap::mem_fault(addr));
        }
        if (addr & 0x3) == 0 {
            return self.mem.read32_le(addr).ok_or_else(|| Trap::mem_fault(addr));
        }
        if !self.config.strict_traps {
            let mut value = 0u32;
            for i in 0..4u32 {
                let byte_addr = addr.wrapping_add(i);
                if !is_ram_addr(byte_addr, self.config.ram_size) {
                    return Err(Trap::mem_fault(addr));
                }
                let byte = self.mem.read8(byte_addr).ok_or_else(|| Trap::mem_fault(addr))?;
                value |= (byte as u32) << (8 * i);
            }
            return Ok(value);
        }
        Err(Trap::misaligned(addr))
    }

    fn write8(&mut self, addr: u32, value: u8) -> Result<(), Trap> {
        // MMIO I/O
        if is_mmio_addr(addr) {
            match addr {
                MMIO_PUTC => {
                    self.output.push(value);
                    return Ok(());
                }
                _ => return Err(Trap::mem_fault(addr)),
            }
        }
        // Screen memory
        if addr >= SCREEN_BASE && addr < SCREEN_BASE + SCREEN_SIZE {
            let offset = (addr - SCREEN_BASE) as usize;
            self.screen[offset] = value;
            self.screen_dirty = true;
            return Ok(());
        }
        // Keyboard is read-only from CPU perspective
        if addr >= KEYBOARD_ADDR && addr < KEYBOARD_ADDR + 4 {
            return Ok(()); // Silently ignore writes
        }
        // RAM
        if !is_ram_addr(addr, self.config.ram_size) {
            return Err(Trap::mem_fault(addr));
        }
        self.mem
            .write8(addr, value)
            .ok_or_else(|| Trap::mem_fault(addr))
    }

    fn write32(&mut self, addr: u32, value: u32) -> Result<(), Trap> {
        // MMIO I/O
        if is_mmio_addr(addr) {
            match addr {
                MMIO_PUTC => {
                    self.output.push((value & 0xFF) as u8);
                    return Ok(());
                }
                _ => return Err(Trap::mem_fault(addr)),
            }
        }
        // Screen memory (aligned write)
        if addr >= SCREEN_BASE && addr + 4 <= SCREEN_BASE + SCREEN_SIZE && (addr & 0x3) == 0 {
            let offset = (addr - SCREEN_BASE) as usize;
            let bytes = value.to_le_bytes();
            self.screen[offset..offset + 4].copy_from_slice(&bytes);
            self.screen_dirty = true;
            return Ok(());
        }
        // Keyboard is read-only
        if addr == KEYBOARD_ADDR {
            return Ok(()); // Silently ignore
        }
        // Check alignment
        if (addr & 0x3) != 0 && self.config.strict_traps {
            return Err(Trap::misaligned(addr));
        }
        // RAM
        if !is_ram_addr(addr, self.config.ram_size) {
            return Err(Trap::mem_fault(addr));
        }
        if (addr & 0x3) == 0 {
            return self
                .mem
                .write32_le(addr, value)
                .ok_or_else(|| Trap::mem_fault(addr));
        }
        if !self.config.strict_traps {
            for i in 0..4u32 {
                let byte_addr = addr.wrapping_add(i);
                if !is_ram_addr(byte_addr, self.config.ram_size) {
                    return Err(Trap::mem_fault(addr));
                }
                let byte = ((value >> (8 * i)) & 0xFF) as u8;
                self.mem
                    .write8(byte_addr, byte)
                    .ok_or_else(|| Trap::mem_fault(addr))?;
            }
            return Ok(());
        }
        Err(Trap::misaligned(addr))
    }

    fn halt_with_exit(&mut self, exit: Exit) -> StepOutcome {
        self.stop = Some(StopReason::Exit(exit.clone()));
        StepOutcome::Exit(exit)
    }

    fn halt_with_trap(&mut self, trap: Trap) -> StepOutcome {
        self.stop = Some(StopReason::Trap(trap.clone()));
        StepOutcome::Trap(trap)
    }

    fn handle_illegal(&mut self, pc: u32, instr: u32) -> StepOutcome {
        if self.config.strict_traps {
            self.halt_with_trap(Trap {
                code: TrapCode::Illegal,
                pc,
                addr: 0,
                instr,
            })
        } else {
            self.cpu.set_pc(pc.wrapping_add(4));
            StepOutcome::Continue
        }
    }
}

fn cond_passed(cond: Cond, flags: Flags) -> bool {
    match cond {
        Cond::EQ => flags.z,
        Cond::NE => !flags.z,
        Cond::CS => flags.c,
        Cond::CC => !flags.c,
        Cond::MI => flags.n,
        Cond::PL => !flags.n,
        Cond::VS => flags.v,
        Cond::VC => !flags.v,
        Cond::HI => flags.c && !flags.z,
        Cond::LS => !flags.c || flags.z,
        Cond::GE => flags.n == flags.v,
        Cond::LT => flags.n != flags.v,
        Cond::GT => !flags.z && (flags.n == flags.v),
        Cond::LE => flags.z || (flags.n != flags.v),
        Cond::AL => true,
        Cond::NV => false,
    }
}

fn shift_reg(value: u32, shift: u8) -> Result<(u32, Option<bool>), ()> {
    let kind = (shift >> 6) & 0x3;
    let amount = shift & 0x3F;
    if amount > 31 {
        return Err(());
    }
    if amount == 0 {
        return Ok((value, None));
    }
    let result = match kind {
        0 => value.wrapping_shl(amount as u32),
        1 => value.wrapping_shr(amount as u32),
        2 => ((value as i32) >> amount) as u32,
        3 => value.rotate_right(amount as u32),
        _ => value,
    };
    let carry = match kind {
        0 => ((value >> (32 - amount)) & 1) != 0,
        1 => ((value >> (amount - 1)) & 1) != 0,
        2 => ((value >> (amount - 1)) & 1) != 0,
        3 => ((value >> (amount - 1)) & 1) != 0,
        _ => false,
    };
    Ok((result, Some(carry)))
}

fn overflow_add(a: u32, b: u32, res: u32) -> bool {
    let sa = a as i32;
    let sb = b as i32;
    let sr = res as i32;
    (sa ^ sr) & (sb ^ sr) < 0
}

fn overflow_sub(a: u32, b: u32, res: u32) -> bool {
    let sa = a as i32;
    let sb = b as i32;
    let sr = res as i32;
    (sa ^ sb) & (sa ^ sr) < 0
}

fn sign_extend(value: u32, bits: u8) -> u32 {
    let shift = 32 - bits as u32;
    ((value << shift) as i32 >> shift) as u32
}

fn is_ram_addr(addr: u32, ram_size: u32) -> bool {
    addr < ram_size
}

fn is_mmio_addr(addr: u32) -> bool {
    matches!(addr, MMIO_PUTC | MMIO_GETC | MMIO_EXIT)
}

struct LoadedSegment {
    seg_type: SegmentType,
    vaddr: u32,
    file_off: u32,
    file_size: u32,
    mem_size: u32,
}

struct LoadedImage {
    entry: u32,
    segments: Vec<LoadedSegment>,
}

#[derive(Copy, Clone, Debug)]
enum SegmentType {
    Load,
    Bss,
    Other,
}

fn load_a32b(bytes: &[u8], ram_size: u32) -> Result<LoadedImage, SimError> {
    if bytes.len() < 32 {
        return Err(SimError::new("E4001", "invalid header"));
    }
    if &bytes[0..4] != b"A32B" {
        return Err(SimError::new("E4001", "invalid magic"));
    }
    let version = read_u16(bytes, 4)?;
    if version != 1 {
        return Err(SimError::new("E4004", "unsupported version"));
    }
    let flags = read_u16(bytes, 6)?;
    if flags & 1 == 0 {
        return Err(SimError::new("E4001", "invalid flags"));
    }
    let entry = read_u32(bytes, 8)?;
    let ph_count = read_u16(bytes, 12)? as u32;
    let ph_size = read_u16(bytes, 14)? as u32;
    if ph_size != 24 {
        return Err(SimError::new("E4001", "invalid program header size"));
    }
    let ph_offset = read_u32(bytes, 16)? as usize;
    let file_size = read_u32(bytes, 20)? as usize;
    if file_size != bytes.len() {
        return Err(SimError::new("E4001", "file size mismatch"));
    }
    let table_size = ph_count
        .checked_mul(ph_size)
        .ok_or_else(|| SimError::new("E4001", "invalid program header table"))?;
    if ph_offset + table_size as usize > bytes.len() {
        return Err(SimError::new("E4001", "program header table out of range"));
    }

    let mut segments = Vec::new();
    for idx in 0..ph_count {
        let off = ph_offset + (idx * ph_size) as usize;
        let seg_type = read_u32(bytes, off)?;
        let flags = read_u32(bytes, off + 4)?;
        let vaddr = read_u32(bytes, off + 8)?;
        let file_off = read_u32(bytes, off + 12)?;
        let file_size = read_u32(bytes, off + 16)?;
        let mem_size = read_u32(bytes, off + 20)?;
        if mem_size < file_size {
            return Err(SimError::new("E4001", "invalid segment sizes"));
        }
        if seg_type == 1 && (file_off % 4 != 0) {
            return Err(SimError::new("E4001", "misaligned segment offset"));
        }
        if seg_type == 1 && (flags & 0b100 != 0) && (vaddr % 4 != 0) {
            return Err(SimError::new("E4001", "misaligned executable segment"));
        }
        if seg_type == 2 && file_off != 0 {
            return Err(SimError::new("E4001", "invalid bss segment"));
        }
        if seg_type == 1 && (file_off as usize + file_size as usize) > bytes.len() {
            return Err(SimError::new("E4001", "segment data out of range"));
        }
        if mem_size > 0 {
            let end = vaddr
                .checked_add(mem_size)
                .ok_or_else(|| SimError::new("E4002", "segment out of bounds"))?;
            if end > ram_size {
                return Err(SimError::new("E4002", "segment out of bounds"));
            }
            if overlaps_mmio(vaddr, end) {
                return Err(SimError::new("E4003", "segment overlaps mmio"));
            }
        }
        let seg_kind = match seg_type {
            1 => SegmentType::Load,
            2 => SegmentType::Bss,
            3 | 4 => SegmentType::Other,
            _ => return Err(SimError::new("E4001", "unknown segment type")),
        };
        segments.push(LoadedSegment {
            seg_type: seg_kind,
            vaddr,
            file_off,
            file_size,
            mem_size,
        });
    }

    for i in 0..segments.len() {
        for j in (i + 1)..segments.len() {
            let a = &segments[i];
            let b = &segments[j];
            let a_end = a.vaddr.saturating_add(a.mem_size);
            let b_end = b.vaddr.saturating_add(b.mem_size);
            if a.mem_size > 0
                && b.mem_size > 0
                && a.vaddr < b_end
                && b.vaddr < a_end
            {
                return Err(SimError::new("E4001", "segment overlap"));
            }
        }
    }

    Ok(LoadedImage { entry, segments })
}

fn overlaps_mmio(start: u32, end: u32) -> bool {
    let mmio = [MMIO_PUTC, MMIO_GETC, MMIO_EXIT];
    mmio.iter().any(|&addr| addr >= start && addr < end)
}

fn read_u16(data: &[u8], offset: usize) -> Result<u16, SimError> {
    if offset + 1 >= data.len() {
        return Err(SimError::new("E4001", "unexpected eof"));
    }
    Ok(u16::from_le_bytes([data[offset], data[offset + 1]]))
}

fn read_u32(data: &[u8], offset: usize) -> Result<u32, SimError> {
    if offset + 3 >= data.len() {
        return Err(SimError::new("E4001", "unexpected eof"));
    }
    Ok(u32::from_le_bytes([
        data[offset],
        data[offset + 1],
        data[offset + 2],
        data[offset + 3],
    ]))
}

impl Trap {
    fn mem_fault(addr: u32) -> Self {
        Trap {
            code: TrapCode::MemFault,
            pc: 0,
            addr,
            instr: 0,
        }
    }

    fn misaligned(addr: u32) -> Self {
        Trap {
            code: TrapCode::Misaligned,
            pc: 0,
            addr,
            instr: 0,
        }
    }

    fn with_pc(mut self, pc: u32) -> Self {
        self.pc = pc;
        self
    }
}
