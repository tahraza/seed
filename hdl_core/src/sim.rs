use crate::elab::{CaseChoiceRef, ExprRef, Netlist, PrimitiveNet, SeqStmtRef, TargetRef};
use crate::error::Error;
use crate::value::{BitVec, Value, ValueKind};
use crate::ast::{BinaryOp, Selector, UnaryOp};
use std::collections::HashMap;

struct RamState {
    mem: Vec<BitVec>,
    data_width: usize,
}

pub struct Simulator {
    netlist: Netlist,
    max_comb_iters: usize,
    ram_state: Vec<RamState>,
}

impl Simulator {
    pub fn new(netlist: Netlist) -> Self {
        let mut ram_state = Vec::new();
        for prim in &netlist.primitives {
            if let PrimitiveNet::Ram {
                addr_width,
                data_width,
                ..
            } = prim
            {
                let depth = 1usize << (*addr_width as u32);
                let mut mem = Vec::with_capacity(depth);
                for _ in 0..depth {
                    mem.push(BitVec::new(*data_width, 0));
                }
                ram_state.push(RamState {
                    mem,
                    data_width: *data_width,
                });
            }
        }
        Self {
            netlist,
            max_comb_iters: 100,
            ram_state,
        }
    }

    pub fn set_max_comb_iters(&mut self, max: usize) {
        self.max_comb_iters = max;
    }

    pub fn set_signal(&mut self, name: &str, value: BitVec) -> Result<(), Error> {
        let id = self
            .netlist
            .name_to_id
            .get(name)
            .copied()
            .ok_or_else(|| Error::new(format!("unknown signal {}", name)))?;
        let width = self.netlist.signals[id].width;
        let resized = value.resize_zero(width);
        self.netlist.signals[id].value = resized;
        Ok(())
    }

    pub fn get_signal(&self, name: &str) -> Result<BitVec, Error> {
        let id = self
            .netlist
            .name_to_id
            .get(name)
            .copied()
            .ok_or_else(|| Error::new(format!("unknown signal {}", name)))?;
        Ok(self.netlist.signals[id].value.clone())
    }

    pub fn eval_comb(&mut self) -> Result<(), Error> {
        for _ in 0..self.max_comb_iters {
            let mut changed = false;
            let assigns = self.netlist.assigns.clone();
            for assign in assigns {
                let value = self.eval_expr(&assign.expr)?;
                let was_changed = self.apply_target(&assign.target, value)?;
                if was_changed {
                    changed = true;
                }
            }
            let primitives = self.netlist.primitives.clone();
            let mut ram_idx = 0usize;
            for prim in primitives {
                match prim {
                    PrimitiveNet::Nand2 { a, b, y } => {
                        let av = self.eval_expr(&a)?;
                        let bv = self.eval_expr(&b)?;
                        let value = Value {
                            bits: BitVec::and(&av.bits, &bv.bits).not(),
                            kind: ValueKind::Bitwise,
                        };
                        if self.apply_target(&y, value)? {
                            changed = true;
                        }
                    }
                    PrimitiveNet::Not1 { a, y } => {
                        let v = self.eval_expr(&a)?;
                        let value = Value {
                            bits: v.bits.not(),
                            kind: ValueKind::Bitwise,
                        };
                        if self.apply_target(&y, value)? {
                            changed = true;
                        }
                    }
                    PrimitiveNet::And2 { a, b, y } => {
                        let av = self.eval_expr(&a)?;
                        let bv = self.eval_expr(&b)?;
                        let value = Value {
                            bits: BitVec::and(&av.bits, &bv.bits),
                            kind: ValueKind::Bitwise,
                        };
                        if self.apply_target(&y, value)? {
                            changed = true;
                        }
                    }
                    PrimitiveNet::Or2 { a, b, y } => {
                        let av = self.eval_expr(&a)?;
                        let bv = self.eval_expr(&b)?;
                        let value = Value {
                            bits: BitVec::or(&av.bits, &bv.bits),
                            kind: ValueKind::Bitwise,
                        };
                        if self.apply_target(&y, value)? {
                            changed = true;
                        }
                    }
                    PrimitiveNet::Xor2 { a, b, y } => {
                        let av = self.eval_expr(&a)?;
                        let bv = self.eval_expr(&b)?;
                        let value = Value {
                            bits: BitVec::xor(&av.bits, &bv.bits),
                            kind: ValueKind::Bitwise,
                        };
                        if self.apply_target(&y, value)? {
                            changed = true;
                        }
                    }
                    PrimitiveNet::Mux2 { a, b, sel, y } => {
                        let sel_v = self.eval_expr(&sel)?;
                        let pick_b = self.value_is_true(&sel_v);
                        let chosen = if pick_b {
                            self.eval_expr(&b)?
                        } else {
                            self.eval_expr(&a)?
                        };
                        let value = Value {
                            bits: chosen.bits,
                            kind: ValueKind::Bitwise,
                        };
                        if self.apply_target(&y, value)? {
                            changed = true;
                        }
                    }
                    PrimitiveNet::Ram {
                        addr,
                        dout,
                        addr_width,
                        ..
                    } => {
                        let addr_v = self.eval_expr(&addr)?;
                        let addr_bits = addr_v.bits.resize_zero(addr_width);
                        let idx = addr_bits.to_u64_trunc() as usize;
                        let data = {
                            let state = self
                                .ram_state
                                .get(ram_idx)
                                .ok_or_else(|| Error::new("ram state missing"))?;
                            if idx >= state.mem.len() {
                                return Err(Error::new("ram address out of range"));
                            }
                            state.mem[idx].clone()
                        };
                        let value = Value {
                            bits: data,
                            kind: ValueKind::Bitwise,
                        };
                        if self.apply_target(&dout, value)? {
                            changed = true;
                        }
                        ram_idx += 1;
                    }
                    PrimitiveNet::Dff { .. } => {}
                }
            }
            if !changed {
                return Ok(());
            }
        }
        Err(Error::new("combinational logic did not converge"))
    }

    pub fn tick(&mut self) -> Result<(), Error> {
        // First evaluate combinational logic to get stable inputs
        self.eval_comb()?;

        let mut updates: HashMap<usize, BitVec> = HashMap::new();
        for proc in &self.netlist.processes {
            let mut local: HashMap<usize, BitVec> = HashMap::new();
            self.eval_seq_block(&proc.stmts, &mut local)?;
            for (sig, val) in local {
                updates.insert(sig, val);
            }
        }
        let mut ram_idx = 0usize;
        for prim in &self.netlist.primitives {
            match prim {
                PrimitiveNet::Dff { d, q, .. } => {
                    // tick() represents the rising clock edge - always latch
                    let val = self.eval_expr(d)?;
                    self.apply_to_updates(q, val, &mut updates)?;
                }
                PrimitiveNet::Ram {
                    we,
                    addr,
                    din,
                    addr_width,
                    ..
                } => {
                    // tick() represents the rising clock edge - check write enable only
                    let we_v = self.eval_expr(we)?;
                    if self.value_is_true(&we_v) {
                        let addr_v = self.eval_expr(addr)?;
                        let addr_bits = addr_v.bits.resize_zero(*addr_width);
                        let idx = addr_bits.to_u64_trunc() as usize;
                        let din_v = self.eval_expr(din)?;
                        let data_width = self
                            .ram_state
                            .get(ram_idx)
                            .ok_or_else(|| Error::new("ram state missing"))?
                            .data_width;
                        let data = Self::value_to_width(&din_v, data_width);
                        let state = self
                            .ram_state
                            .get_mut(ram_idx)
                            .ok_or_else(|| Error::new("ram state missing"))?;
                        if idx >= state.mem.len() {
                            return Err(Error::new("ram address out of range"));
                        }
                        state.mem[idx] = data;
                    }
                    ram_idx += 1;
                }
                _ => {}
            }
        }
        for (sig, val) in updates {
            self.netlist.signals[sig].value = val;
        }
        self.eval_comb()?;
        Ok(())
    }

    pub fn tock(&mut self) -> Result<(), Error> {
        self.eval_comb()
    }

    fn eval_seq_block(
        &self,
        stmts: &[SeqStmtRef],
        updates: &mut HashMap<usize, BitVec>,
    ) -> Result<(), Error> {
        for stmt in stmts {
            match stmt {
                SeqStmtRef::Assign(target, expr) => {
                    let value = self.eval_expr(expr)?;
                    self.apply_to_updates(target, value, updates)?;
                }
                SeqStmtRef::If(ifstmt) => {
                    if self.value_is_true(&self.eval_expr(&ifstmt.cond)?) {
                        self.eval_seq_block(&ifstmt.then_stmts, updates)?;
                    } else {
                        let mut matched = false;
                        for (cond, block) in &ifstmt.elsif {
                            if self.value_is_true(&self.eval_expr(cond)?) {
                                self.eval_seq_block(block, updates)?;
                                matched = true;
                                break;
                            }
                        }
                        if !matched {
                            self.eval_seq_block(&ifstmt.else_stmts, updates)?;
                        }
                    }
                }
                SeqStmtRef::Case(case) => {
                    let val = self.eval_expr(&case.expr)?;
                    let mut matched = false;
                    for (choice, block) in &case.arms {
                        if self.case_matches(choice, &val)? {
                            self.eval_seq_block(block, updates)?;
                            matched = true;
                            break;
                        }
                    }
                    if !matched {
                        for (choice, block) in &case.arms {
                            if matches!(choice, CaseChoiceRef::Others) {
                                self.eval_seq_block(block, updates)?;
                                break;
                            }
                        }
                    }
                }
            }
        }
        Ok(())
    }

    fn case_matches(&self, choice: &CaseChoiceRef, val: &Value) -> Result<bool, Error> {
        match choice {
            CaseChoiceRef::Others => Ok(false),
            CaseChoiceRef::Literal(lit) => Ok(self.value_eq(val, lit)),
            CaseChoiceRef::Target(t) => {
                let v = self.eval_expr(&ExprRef::Target(t.clone()))?;
                Ok(self.value_eq(val, &v))
            }
        }
    }

    fn value_eq(&self, a: &Value, b: &Value) -> bool {
        let w = a.bits.width().max(b.bits.width());
        let aa = a.bits.resize_sign(w);
        let bb = b.bits.resize_sign(w);
        aa == bb
    }

    fn value_is_true(&self, val: &Value) -> bool {
        val.bits.to_u64_trunc() != 0
    }

    fn value_to_width(value: &Value, width: usize) -> BitVec {
        match value.kind {
            ValueKind::Arithmetic => value.bits.resize_sign(width),
            _ => value.bits.resize_zero(width),
        }
    }

    fn eval_expr(&self, expr: &ExprRef) -> Result<Value, Error> {
        match expr {
            ExprRef::Literal(v) => Ok(v.clone()),
            ExprRef::Target(t) => {
                let bits = self.read_target(t)?;
                Ok(Value {
                    bits,
                    kind: ValueKind::Bitwise,
                })
            }
            ExprRef::Unary { op, expr } => {
                let v = self.eval_expr(expr)?;
                match op {
                    UnaryOp::Not => Ok(Value {
                        bits: v.bits.not(),
                        kind: ValueKind::Bitwise,
                    }),
                    UnaryOp::Neg => Ok(Value {
                        bits: BitVec::sub(&BitVec::new(v.bits.width(), 0), &v.bits),
                        kind: ValueKind::Arithmetic,
                    }),
                }
            }
            ExprRef::Binary { op, left, right } => {
                let l = self.eval_expr(left)?;
                let r = self.eval_expr(right)?;
                Ok(match op {
                    BinaryOp::Add => Value {
                        bits: BitVec::add(&l.bits, &r.bits),
                        kind: ValueKind::Arithmetic,
                    },
                    BinaryOp::Sub => Value {
                        bits: BitVec::sub(&l.bits, &r.bits),
                        kind: ValueKind::Arithmetic,
                    },
                    BinaryOp::And => Value {
                        bits: BitVec::and(&l.bits, &r.bits),
                        kind: ValueKind::Bitwise,
                    },
                    BinaryOp::Or => Value {
                        bits: BitVec::or(&l.bits, &r.bits),
                        kind: ValueKind::Bitwise,
                    },
                    BinaryOp::Xor => Value {
                        bits: BitVec::xor(&l.bits, &r.bits),
                        kind: ValueKind::Bitwise,
                    },
                    BinaryOp::Concat => Value {
                        bits: BitVec::concat(&l.bits, &r.bits),
                        kind: ValueKind::Bitwise,
                    },
                    BinaryOp::Shl => {
                        let count = r.bits.to_u64_trunc() as usize;
                        Value {
                            bits: BitVec::shl(&l.bits, count),
                            kind: ValueKind::Bitwise,
                        }
                    }
                    BinaryOp::Shr => {
                        let count = r.bits.to_u64_trunc() as usize;
                        Value {
                            bits: BitVec::shr(&l.bits, count),
                            kind: ValueKind::Bitwise,
                        }
                    }
                    BinaryOp::Eq => Value::bit(self.value_eq(&l, &r)),
                    BinaryOp::Ne => Value::bit(!self.value_eq(&l, &r)),
                    BinaryOp::Lt => Value::bit(BitVec::cmp_signed(&l.bits, &r.bits).is_lt()),
                    BinaryOp::Le => {
                        let ord = BitVec::cmp_signed(&l.bits, &r.bits);
                        Value::bit(ord.is_lt() || ord.is_eq())
                    }
                    BinaryOp::Gt => Value::bit(BitVec::cmp_signed(&l.bits, &r.bits).is_gt()),
                    BinaryOp::Ge => {
                        let ord = BitVec::cmp_signed(&l.bits, &r.bits);
                        Value::bit(ord.is_gt() || ord.is_eq())
                    }
                })
            }
            ExprRef::Call { name, args } => {
                let lower = name.to_ascii_lowercase();
                if lower == "resize" || lower == "sresize" {
                    if args.len() != 2 {
                        return Err(Error::new("resize expects 2 args"));
                    }
                    let val = self.eval_expr(&args[0])?;
                    let size_val = self.eval_expr(&args[1])?;
                    let width = size_val.bits.to_u64_trunc() as usize;
                    let bits = if lower == "sresize" {
                        val.bits.resize_sign(width)
                    } else {
                        val.bits.resize_zero(width)
                    };
                    return Ok(Value {
                        bits,
                        kind: if lower == "sresize" {
                            ValueKind::Arithmetic
                        } else {
                            ValueKind::Bitwise
                        },
                    });
                }
                Err(Error::new("unsupported function call"))
            }
        }
    }

    fn apply_target(&mut self, target: &TargetRef, value: Value) -> Result<bool, Error> {
        let sig = self.netlist.signals[target.signal].clone();
        let new_bits = Self::value_to_width(&value, sig.width);
        let mut changed = false;
        if let Some(sel) = &target.sel {
            let mut base = sig.value.clone();
            self.write_slice(&sig, &mut base, sel, &new_bits)?;
            if base != sig.value {
                changed = true;
                self.netlist.signals[target.signal].value = base;
            }
        } else {
            if new_bits != sig.value {
                changed = true;
                self.netlist.signals[target.signal].value = new_bits.clone();
            }
        }
        Ok(changed)
    }

    fn apply_to_updates(
        &self,
        target: &TargetRef,
        value: Value,
        updates: &mut HashMap<usize, BitVec>,
    ) -> Result<(), Error> {
        let sig = self.netlist.signals[target.signal].clone();
        let new_bits = Self::value_to_width(&value, sig.width);
        let base = updates
            .get(&target.signal)
            .cloned()
            .unwrap_or_else(|| sig.value.clone());
        let mut out = base;
        if let Some(sel) = &target.sel {
            self.write_slice(&sig, &mut out, sel, &new_bits)?;
        } else {
            out = new_bits;
        }
        updates.insert(target.signal, out);
        Ok(())
    }

    fn read_target(&self, target: &TargetRef) -> Result<BitVec, Error> {
        let sig = &self.netlist.signals[target.signal];
        if let Some(sel) = &target.sel {
            return self.read_slice(sig, sel);
        }
        Ok(sig.value.clone())
    }

    fn read_slice(&self, sig: &crate::elab::Signal, sel: &Selector) -> Result<BitVec, Error> {
        match sel {
            Selector::Index(i) => {
                let pos = self.index_to_pos(sig, *i)?;
                Ok(BitVec::new(1, sig.value.get(pos)))
            }
            Selector::Range { msb, lsb, .. } => {
                let lo = (*msb).min(*lsb);
                let hi = (*msb).max(*lsb);
                let mut bits = Vec::new();
                for idx in lo..=hi {
                    let pos = self.index_to_pos(sig, idx)?;
                    bits.push(sig.value.get(pos));
                }
                Ok(BitVec::from_bits_lsb(bits))
            }
        }
    }

    fn write_slice(
        &self,
        sig: &crate::elab::Signal,
        sig_bits: &mut BitVec,
        sel: &Selector,
        value: &BitVec,
    ) -> Result<(), Error> {
        match sel {
            Selector::Index(i) => {
                let pos = self.index_to_pos(sig, *i)?;
                sig_bits.set(pos, value.get(0));
            }
            Selector::Range { msb, lsb, .. } => {
                let lo = (*msb).min(*lsb);
                let hi = (*msb).max(*lsb);
                let width = (hi - lo + 1) as usize;
                let v = value.resize_zero(width);
                for (offset, idx) in (lo..=hi).enumerate() {
                    let pos = self.index_to_pos(sig, idx)?;
                    sig_bits.set(pos, v.get(offset));
                }
            }
        }
        Ok(())
    }

    fn index_to_pos(&self, sig: &crate::elab::Signal, idx: i64) -> Result<usize, Error> {
        let min = sig.lsb.min(sig.msb);
        let max = sig.lsb.max(sig.msb);
        if idx < min || idx > max {
            return Err(Error::new("index out of range"));
        }
        Ok((idx - min) as usize)
    }
}
