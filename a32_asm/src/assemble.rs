use crate::ast::{Directive, Expr, Instruction, Item, Operand, Program, ShiftKind};
use crate::error::AsmError;
use crate::parser::parse_program;
use a32_core::isa::{Cond, Reg};
use std::collections::{HashMap, HashSet};

const TEXT_BASE: u32 = 0x0000_0000;
const DATA_BASE: u32 = 0x0002_0000;
const BSS_BASE: u32 = 0x0003_0000;
const DEFAULT_RAM_SIZE: u32 = 0x0010_0000;

#[derive(Debug, Clone)]
pub struct AsmConfig {
    pub text_base: u32,
    pub data_base: u32,
    pub bss_base: u32,
    pub entry: Option<String>,
    pub ram_size: u32,
    pub extra_symbols: Vec<(String, Expr)>,
}

impl Default for AsmConfig {
    fn default() -> Self {
        Self {
            text_base: TEXT_BASE,
            data_base: DATA_BASE,
            bss_base: BSS_BASE,
            entry: None,
            ram_size: DEFAULT_RAM_SIZE,
            extra_symbols: Vec::new(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct AssembledImage {
    pub text: Vec<u8>,
    pub data: Vec<u8>,
    pub bss_size: u32,
    pub entry: u32,
    pub symbols: HashMap<String, u32>,
    pub text_base: u32,
    pub data_base: u32,
    pub bss_base: u32,
}

impl AssembledImage {
    pub fn to_a32b(&self) -> Vec<u8> {
        let mut segments = Vec::new();
        if !self.text.is_empty() {
            segments.push(SegmentDesc {
                seg_type: 1,
                flags: 0b101,
                vaddr: self.text_base,
                data: self.text.clone(),
                mem_size: self.text.len() as u32,
            });
        }
        if !self.data.is_empty() {
            segments.push(SegmentDesc {
                seg_type: 1,
                flags: 0b011,
                vaddr: self.data_base,
                data: self.data.clone(),
                mem_size: self.data.len() as u32,
            });
        }
        if self.bss_size > 0 {
            segments.push(SegmentDesc {
                seg_type: 2,
                flags: 0b011,
                vaddr: self.bss_base,
                data: Vec::new(),
                mem_size: self.bss_size,
            });
        }
        build_a32b(&segments, self.entry)
    }
}

pub fn assemble(source: &str) -> Result<AssembledImage, AsmError> {
    assemble_with_config(source, &AsmConfig::default())
}

pub fn assemble_with_config(
    source: &str,
    config: &AsmConfig,
) -> Result<AssembledImage, AsmError> {
    let program = parse_program(source)?;
    assemble_program(&program, config)
}

pub fn assemble_a32b(source: &str) -> Result<Vec<u8>, AsmError> {
    Ok(assemble(source)?.to_a32b())
}

pub fn assemble_a32b_with_config(
    source: &str,
    config: &AsmConfig,
) -> Result<Vec<u8>, AsmError> {
    Ok(assemble_with_config(source, config)?.to_a32b())
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum SectionKind {
    Text,
    Data,
    Bss,
}

#[derive(Clone, Debug)]
enum SectionItem {
    Label(String),
    Instr(Instruction),
    Directive(Directive),
}

struct AsmState {
    text_items: Vec<SectionItem>,
    data_items: Vec<SectionItem>,
    bss_items: Vec<SectionItem>,
    globals: HashSet<String>,
    labels: HashSet<String>,
}

fn assemble_program(program: &Program, config: &AsmConfig) -> Result<AssembledImage, AsmError> {
    let mut state = AsmState {
        text_items: Vec::new(),
        data_items: Vec::new(),
        bss_items: Vec::new(),
        globals: HashSet::new(),
        labels: HashSet::new(),
    };
    let mut current = SectionKind::Text;

    for item in &program.items {
        match item {
            Item::Label(label) => {
                if !state.labels.insert(label.name.clone()) {
                    return Err(AsmError::code("E1006", "duplicate label"));
                }
                match current {
                    SectionKind::Text => state
                        .text_items
                        .push(SectionItem::Label(label.name.clone())),
                    SectionKind::Data => state
                        .data_items
                        .push(SectionItem::Label(label.name.clone())),
                    SectionKind::Bss => state
                        .bss_items
                        .push(SectionItem::Label(label.name.clone())),
                }
            }
            Item::Instruction(inst) => {
                if current != SectionKind::Text {
                    return Err(AsmError::code("E1002", "instruction outside .text"));
                }
                state.text_items.push(SectionItem::Instr(inst.clone()));
            }
            Item::Directive(dir) => match dir {
                Directive::Text => current = SectionKind::Text,
                Directive::Data | Directive::RoData => current = SectionKind::Data,
                Directive::Bss => current = SectionKind::Bss,
                Directive::Global(name) => {
                    state.globals.insert(name.clone());
                }
                Directive::Pool | Directive::LtOrg => {
                    if current != SectionKind::Text {
                        return Err(AsmError::code("E1002", "pool only valid in .text"));
                    }
                    state.text_items.push(SectionItem::Directive(dir.clone()));
                }
                Directive::Word(_)
                | Directive::Byte(_)
                | Directive::Space(_)
                | Directive::Align(_)
                | Directive::Org(_)
                | Directive::Ascii(_)
                | Directive::Asciz(_) => match current {
                    SectionKind::Text => state.text_items.push(SectionItem::Directive(dir.clone())),
                    SectionKind::Data => state.data_items.push(SectionItem::Directive(dir.clone())),
                    SectionKind::Bss => {
                        if matches!(dir, Directive::Space(_) | Directive::Align(_) | Directive::Org(_)) {
                            state.bss_items.push(SectionItem::Directive(dir.clone()));
                        } else {
                            return Err(AsmError::code("E1002", "invalid directive in .bss"));
                        }
                    }
                },
            },
        }
    }

    let entry_symbol = config.entry.as_deref().unwrap_or("_start");
    let has_main = state.labels.contains("main");
    if config.entry.is_none() {
        if !state.labels.contains("_start") {
            if has_main {
                state.labels.insert("_start".to_string());
                let mut stub = Vec::new();
                stub.push(SectionItem::Label("_start".to_string()));
                stub.push(SectionItem::Instr(Instruction {
                    mnemonic: "BL".to_string(),
                    suffixes: Vec::new(),
                    operands: vec![Operand::Expr(Expr::Symbol("main".to_string()))],
                }));
                stub.push(SectionItem::Instr(Instruction {
                    mnemonic: "SVC".to_string(),
                    suffixes: Vec::new(),
                    operands: vec![Operand::Imm(Expr::Number(0x10))],
                }));
                stub.extend(state.text_items.into_iter());
                state.text_items = stub;
            } else {
                return Err(AsmError::code("E3002", "entry symbol missing"));
            }
        }
    } else if !state.labels.contains(entry_symbol) {
        return Err(AsmError::code("E3002", "entry symbol missing"));
    }

    let relax_set = compute_branch_relaxation(&state.text_items, config.text_base)?;
    let text_layout = plan_text_layout(&state.text_items, &relax_set, config.text_base)?;
    let data_layout = plan_data_layout(&state.data_items, config.data_base)?;
    let bss_layout = plan_bss_layout(&state.bss_items, config.bss_base)?;

    let mut symbols = HashMap::new();
    for (name, addr) in text_layout.labels {
        symbols.insert(name, addr);
    }
    for (name, addr) in data_layout.labels {
        symbols.insert(name, addr);
    }
    for (name, addr) in bss_layout.labels {
        symbols.insert(name, addr);
    }

    for (name, expr) in &config.extra_symbols {
        if symbols.contains_key(name) {
            return Err(AsmError::code("E1006", "duplicate label"));
        }
        let value = eval_expr(expr, &symbols)?;
        symbols.insert(name.clone(), value_to_u32(value)?);
    }

    let entry = symbols
        .get(entry_symbol)
        .copied()
        .ok_or_else(|| AsmError::code("E3002", "entry symbol missing"))?;

    let text = emit_text(&state.text_items, &relax_set, &symbols, config.text_base)?;
    let data = emit_data(&state.data_items, &symbols, config.data_base)?;

    let text_end = config.text_base + text.len() as u32;
    let data_end = config.data_base + data.len() as u32;
    let bss_end = config.bss_base + bss_layout.size;
    let ranges = [
        (config.text_base, text_end),
        (config.data_base, data_end),
        (config.bss_base, bss_end),
    ];
    for i in 0..ranges.len() {
        let (start_a, end_a) = ranges[i];
        if end_a <= start_a {
            continue;
        }
        for j in (i + 1)..ranges.len() {
            let (start_b, end_b) = ranges[j];
            if end_b <= start_b {
                continue;
            }
            if start_a < end_b && start_b < end_a {
                return Err(AsmError::code("E3001", "section overlap"));
            }
        }
    }
    if config.ram_size > 0
        && (text_end > config.ram_size
            || data_end > config.ram_size
            || bss_end > config.ram_size)
    {
        return Err(AsmError::code("E3004", "output exceeds RAM"));
    }

    Ok(AssembledImage {
        text,
        data,
        bss_size: bss_layout.size,
        entry,
        symbols,
        text_base: config.text_base,
        data_base: config.data_base,
        bss_base: config.bss_base,
    })
}

struct TextLayout {
    labels: HashMap<String, u32>,
    branches: Vec<BranchInfo>,
}

struct BranchInfo {
    instr_index: usize,
    addr: u32,
    target: Expr,
    is_link: bool,
}

fn compute_branch_relaxation(
    items: &[SectionItem],
    text_base: u32,
) -> Result<HashSet<usize>, AsmError> {
    let mut relaxed = HashSet::new();
    let mut pass = 0;
    loop {
        pass += 1;
        if pass > 8 {
            return Err(AsmError::code("E1004", "branch relaxation failed"));
        }
        let layout = plan_text_layout(items, &relaxed, text_base)?;
        let mut changed = false;
        for branch in &layout.branches {
            if branch.is_link {
                continue;
            }
            let target = eval_expr(&branch.target, &layout.labels)?;
            let offset = target - (branch.addr as i64 + 4);
            if offset % 4 != 0 {
                return Err(AsmError::code("E1002", "branch target misaligned"));
            }
            if !fits_branch_offset(offset) {
                if relaxed.insert(branch.instr_index) {
                    changed = true;
                }
            }
        }
        if !changed {
            return Ok(relaxed);
        }
    }
}

fn plan_text_layout(
    items: &[SectionItem],
    relaxed: &HashSet<usize>,
    text_base: u32,
) -> Result<TextLayout, AsmError> {
    let mut labels = HashMap::new();
    let mut addr = text_base;
    let mut pending_literals = 0u32;
    let mut branches = Vec::new();
    let mut instr_index = 0usize;

    for item in items {
        match item {
            SectionItem::Label(name) => {
                labels.insert(name.clone(), addr);
            }
            SectionItem::Instr(inst) => {
                if is_branch(inst) {
                    let suffix = parse_suffixes(&inst.suffixes, false, false)?;
                    let target = branch_target_expr(inst)?;
                    let info = BranchInfo {
                        instr_index,
                        addr,
                        target,
                        is_link: inst.mnemonic.eq_ignore_ascii_case("BL"),
                    };
                    branches.push(info);
                    if relaxed.contains(&instr_index) {
                        if suffix.cond == Cond::AL {
                            pending_literals += 1;
                            addr += 4;
                        } else {
                            pending_literals += 1;
                            addr += 8;
                        }
                    } else {
                        addr += 4;
                    }
                } else if is_ldr_literal(inst)? {
                    pending_literals += 1;
                    addr += 4;
                } else if is_mov_literal(inst)? {
                    pending_literals += 1;
                    addr += 4;
                } else {
                    addr += 4;
                }
                instr_index += 1;
            }
            SectionItem::Directive(dir) => match dir {
                Directive::Pool | Directive::LtOrg => {
                    addr = align_to(addr, 4);
                    addr += pending_literals * 4;
                    pending_literals = 0;
                }
                Directive::Word(_) => {
                    if addr % 4 != 0 {
                        return Err(AsmError::code("E1007", "misaligned .word"));
                    }
                    addr += 4;
                }
                Directive::Byte(_) => {
                    addr += 1;
                }
                Directive::Space(expr) => {
                    let count = eval_const_expr(expr)? as i64;
                    if count < 0 {
                        return Err(AsmError::code("E1002", "negative .space"));
                    }
                    addr = addr.wrapping_add(count as u32);
                }
                Directive::Align(expr) => {
                    let value = eval_const_expr(expr)? as i64;
                    if value < 0 || value > 30 {
                        return Err(AsmError::code("E1002", "invalid .align"));
                    }
                    let align = 1u32 << (value as u32);
                    addr = align_to(addr, align);
                }
                Directive::Org(expr) => {
                    let value = eval_const_expr(expr)? as i64;
                    if value < text_base as i64 {
                        return Err(AsmError::code("E1002", "invalid .org"));
                    }
                    let target = value as u32;
                    if target < addr {
                        return Err(AsmError::code("E1002", "backward .org"));
                    }
                    addr = target;
                }
                Directive::Ascii(s) => {
                    addr = addr.wrapping_add(s.len() as u32);
                }
                Directive::Asciz(s) => {
                    addr = addr.wrapping_add(s.len() as u32 + 1);
                }
                _ => {}
            },
        }
    }
    Ok(TextLayout { labels, branches })
}

struct DataLayout {
    labels: HashMap<String, u32>,
}

fn plan_data_layout(items: &[SectionItem], base: u32) -> Result<DataLayout, AsmError> {
    let mut labels = HashMap::new();
    let mut addr = base;
    for item in items {
        match item {
            SectionItem::Label(name) => {
                labels.insert(name.clone(), addr);
            }
            SectionItem::Directive(dir) => match dir {
                Directive::Word(_) => {
                    if addr % 4 != 0 {
                        return Err(AsmError::code("E1007", "misaligned .word"));
                    }
                    addr += 4;
                }
                Directive::Byte(_) => {
                    addr += 1;
                }
                Directive::Space(expr) => {
                    let count = eval_const_expr(expr)? as i64;
                    if count < 0 {
                        return Err(AsmError::code("E1002", "negative .space"));
                    }
                    addr = addr.wrapping_add(count as u32);
                }
                Directive::Align(expr) => {
                    let value = eval_const_expr(expr)? as i64;
                    if value < 0 || value > 30 {
                        return Err(AsmError::code("E1002", "invalid .align"));
                    }
                    let align = 1u32 << (value as u32);
                    addr = align_to(addr, align);
                }
                Directive::Org(expr) => {
                    let value = eval_const_expr(expr)? as i64;
                    if value < base as i64 {
                        return Err(AsmError::code("E1002", "invalid .org"));
                    }
                    let target = value as u32;
                    if target < addr {
                        return Err(AsmError::code("E1002", "backward .org"));
                    }
                    addr = target;
                }
                Directive::Ascii(s) => {
                    addr = addr.wrapping_add(s.len() as u32);
                }
                Directive::Asciz(s) => {
                    addr = addr.wrapping_add(s.len() as u32 + 1);
                }
                _ => {}
            },
            _ => {}
        }
    }
    Ok(DataLayout { labels })
}

struct BssLayout {
    labels: HashMap<String, u32>,
    size: u32,
}

fn plan_bss_layout(items: &[SectionItem], base: u32) -> Result<BssLayout, AsmError> {
    let mut labels = HashMap::new();
    let mut addr = base;
    for item in items {
        match item {
            SectionItem::Label(name) => {
                labels.insert(name.clone(), addr);
            }
            SectionItem::Directive(dir) => match dir {
                Directive::Space(expr) => {
                    let count = eval_const_expr(expr)? as i64;
                    if count < 0 {
                        return Err(AsmError::code("E1002", "negative .space"));
                    }
                    addr = addr.wrapping_add(count as u32);
                }
                Directive::Align(expr) => {
                    let value = eval_const_expr(expr)? as i64;
                    if value < 0 || value > 30 {
                        return Err(AsmError::code("E1002", "invalid .align"));
                    }
                    let align = 1u32 << (value as u32);
                    addr = align_to(addr, align);
                }
                Directive::Org(expr) => {
                    let value = eval_const_expr(expr)? as i64;
                    if value < base as i64 {
                        return Err(AsmError::code("E1002", "invalid .org"));
                    }
                    let target = value as u32;
                    if target < addr {
                        return Err(AsmError::code("E1002", "backward .org"));
                    }
                    addr = target;
                }
                _ => {}
            },
            _ => {}
        }
    }
    Ok(BssLayout {
        labels,
        size: addr - base,
    })
}

struct LiteralRequest {
    instr_offset: usize,
    cond: Cond,
    rd: Reg,
    expr: Expr,
}

fn emit_text(
    items: &[SectionItem],
    relaxed: &HashSet<usize>,
    symbols: &HashMap<String, u32>,
    text_base: u32,
) -> Result<Vec<u8>, AsmError> {
    let mut text = Vec::new();
    let mut addr = text_base;
    let mut instr_index = 0usize;
    let mut pending = Vec::new();

    for item in items {
        match item {
            SectionItem::Label(_) => {}
            SectionItem::Instr(inst) => {
                if is_branch(inst) {
                    let suffix = parse_suffixes(&inst.suffixes, false, false)?;
                    let cond = suffix.cond;
                    let target = branch_target_expr(inst)?;
                    let target_addr = eval_expr(&target, symbols)? as i64;
                    if relaxed.contains(&instr_index) {
                        if cond == Cond::AL {
                            let offset = text.len();
                            emit_word(&mut text, 0);
                            pending.push(LiteralRequest {
                                instr_offset: offset,
                                cond,
                                rd: Reg::PC,
                                expr: target,
                            });
                            addr += 4;
                        } else {
                            let inv = invert_cond(cond).ok_or_else(|| {
                                AsmError::code("E1002", "invalid condition")
                            })?;
                            let branch_word = encode_branch(inv, false, 4)?;
                            emit_word(&mut text, branch_word);
                            let offset = text.len();
                            emit_word(&mut text, 0);
                            pending.push(LiteralRequest {
                                instr_offset: offset,
                                cond: Cond::AL,
                                rd: Reg::PC,
                                expr: target,
                            });
                            addr += 8;
                        }
                    } else {
                        let offset = target_addr - (addr as i64 + 4);
                        let word = encode_branch(cond, inst.mnemonic.eq_ignore_ascii_case("BL"), offset)?;
                        emit_word(&mut text, word);
                        addr += 4;
                    }
                    instr_index += 1;
                } else if is_ldr_literal(inst)? {
                    let suffix = parse_suffixes(&inst.suffixes, false, false)?;
                    let (rd, expr) = ldr_literal_parts(inst)?;
                    let offset = text.len();
                    emit_word(&mut text, 0);
                    pending.push(LiteralRequest {
                        instr_offset: offset,
                        cond: suffix.cond,
                        rd,
                        expr,
                    });
                    addr += 4;
                    instr_index += 1;
                } else if let Some(req) = mov_literal_request(inst)? {
                    let offset = text.len();
                    emit_word(&mut text, 0);
                    pending.push(LiteralRequest {
                        instr_offset: offset,
                        cond: req.cond,
                        rd: req.rd,
                        expr: req.expr,
                    });
                    addr += 4;
                    instr_index += 1;
                } else {
                    let word = encode_instruction(inst, symbols, addr as i64)?;
                    emit_word(&mut text, word);
                    addr += 4;
                    instr_index += 1;
                }
            }
            SectionItem::Directive(dir) => match dir {
                Directive::Pool | Directive::LtOrg => {
                    addr = pad_to_alignment(&mut text, addr, 4, true);
                    flush_literals(&mut text, &mut pending, &mut addr, symbols, text_base)?;
                }
                Directive::Word(expr) => {
                    if addr % 4 != 0 {
                        return Err(AsmError::code("E1007", "misaligned .word"));
                    }
                    let value = eval_expr(expr, symbols)?;
                    emit_word(&mut text, value_to_u32(value)?);
                    addr += 4;
                }
                Directive::Byte(expr) => {
                    let value = eval_expr(expr, symbols)?;
                    text.push((value & 0xFF) as u8);
                    addr += 1;
                }
                Directive::Space(expr) => {
                    let count = eval_expr(expr, symbols)? as i64;
                    if count < 0 {
                        return Err(AsmError::code("E1002", "negative .space"));
                    }
                    text.extend(std::iter::repeat(0).take(count as usize));
                    addr = addr.wrapping_add(count as u32);
                }
                Directive::Align(expr) => {
                    let value = eval_expr(expr, symbols)? as i64;
                    if value < 0 || value > 30 {
                        return Err(AsmError::code("E1002", "invalid .align"));
                    }
                    let align = 1u32 << (value as u32);
                    addr = pad_to_alignment(&mut text, addr, align, true);
                }
                Directive::Org(expr) => {
                    let value = eval_expr(expr, symbols)? as i64;
                    if value < text_base as i64 {
                        return Err(AsmError::code("E1002", "invalid .org"));
                    }
                    let target = value as u32;
                    if target < addr {
                        return Err(AsmError::code("E1002", "backward .org"));
                    }
                    addr = pad_to_address(&mut text, addr, target, true);
                }
                Directive::Ascii(s) => {
                    text.extend_from_slice(s.as_bytes());
                    addr = addr.wrapping_add(s.len() as u32);
                }
                Directive::Asciz(s) => {
                    text.extend_from_slice(s.as_bytes());
                    text.push(0);
                    addr = addr.wrapping_add(s.len() as u32 + 1);
                }
                _ => {}
            },
        }
    }
    addr = pad_to_alignment(&mut text, addr, 4, false);
    flush_literals(&mut text, &mut pending, &mut addr, symbols, text_base)?;
    Ok(text)
}

fn emit_data(
    items: &[SectionItem],
    symbols: &HashMap<String, u32>,
    base: u32,
) -> Result<Vec<u8>, AsmError> {
    let mut data = Vec::new();
    let mut addr = base;
    for item in items {
        match item {
            SectionItem::Label(_) => {}
            SectionItem::Directive(dir) => match dir {
                Directive::Word(expr) => {
                    if addr % 4 != 0 {
                        return Err(AsmError::code("E1007", "misaligned .word"));
                    }
                    let value = eval_expr(expr, symbols)?;
                    emit_word(&mut data, value_to_u32(value)?);
                    addr += 4;
                }
                Directive::Byte(expr) => {
                    let value = eval_expr(expr, symbols)?;
                    data.push((value & 0xFF) as u8);
                    addr += 1;
                }
                Directive::Space(expr) => {
                    let count = eval_expr(expr, symbols)? as i64;
                    if count < 0 {
                        return Err(AsmError::code("E1002", "negative .space"));
                    }
                    data.extend(std::iter::repeat(0).take(count as usize));
                    addr = addr.wrapping_add(count as u32);
                }
                Directive::Align(expr) => {
                    let value = eval_expr(expr, symbols)? as i64;
                    if value < 0 || value > 30 {
                        return Err(AsmError::code("E1002", "invalid .align"));
                    }
                    let align = 1u32 << (value as u32);
                    addr = pad_to_alignment(&mut data, addr, align, false);
                }
                Directive::Org(expr) => {
                    let value = eval_expr(expr, symbols)? as i64;
                    if value < base as i64 {
                        return Err(AsmError::code("E1002", "invalid .org"));
                    }
                    let target = value as u32;
                    if target < addr {
                        return Err(AsmError::code("E1002", "backward .org"));
                    }
                    addr = pad_to_address(&mut data, addr, target, false);
                }
                Directive::Ascii(s) => {
                    data.extend_from_slice(s.as_bytes());
                    addr = addr.wrapping_add(s.len() as u32);
                }
                Directive::Asciz(s) => {
                    data.extend_from_slice(s.as_bytes());
                    data.push(0);
                    addr = addr.wrapping_add(s.len() as u32 + 1);
                }
                _ => {}
            },
            _ => {}
        }
    }
    Ok(data)
}

fn pad_to_alignment(buf: &mut Vec<u8>, addr: u32, align: u32, nop: bool) -> u32 {
    if align == 0 {
        return addr;
    }
    let aligned = align_to(addr, align);
    pad_to_address(buf, addr, aligned, nop)
}

fn pad_to_address(buf: &mut Vec<u8>, addr: u32, target: u32, nop: bool) -> u32 {
    if target <= addr {
        return addr;
    }
    let mut remaining = (target - addr) as usize;
    if nop {
        while remaining >= 4 {
            emit_word(buf, nop_word());
            remaining -= 4;
        }
    }
    if remaining > 0 {
        buf.extend(std::iter::repeat(0).take(remaining));
    }
    target
}

fn flush_literals(
    buf: &mut Vec<u8>,
    pending: &mut Vec<LiteralRequest>,
    addr: &mut u32,
    symbols: &HashMap<String, u32>,
    text_base: u32,
) -> Result<(), AsmError> {
    if pending.is_empty() {
        return Ok(());
    }
    *addr = pad_to_alignment(buf, *addr, 4, false);
    let mut literal_addrs = Vec::new();
    for req in pending.iter() {
        literal_addrs.push((*addr, req));
        let value = eval_expr(&req.expr, symbols)?;
        emit_word(buf, value_to_u32(value)?);
        *addr += 4;
    }
    for (lit_addr, req) in literal_addrs {
        let instr_addr = text_base + req.instr_offset as u32;
        let offset = lit_addr as i64 - (instr_addr as i64 + 4);
        if !fits_ldr_literal_offset(offset) {
            return Err(AsmError::code("E1008", "literal pool overflow"));
        }
        let (u, off13) = encode_off13(offset)?;
        let word = encode_ldr(req.cond, req.rd, Reg::PC, u, off13, false, false, true);
        patch_word(buf, req.instr_offset, word);
    }
    pending.clear();
    Ok(())
}

fn encode_instruction(inst: &Instruction, symbols: &HashMap<String, u32>, addr: i64) -> Result<u32, AsmError> {
    let mnemonic = inst.mnemonic.to_ascii_uppercase();
    match mnemonic.as_str() {
        "ADD" | "SUB" | "AND" | "ORR" | "EOR" => encode_alu(inst, symbols, addr),
        "MOV" | "MVN" => encode_mov(inst, symbols, addr),
        "CMP" | "TST" => encode_cmp(inst, symbols, addr),
        "LDR" | "STR" | "LDRB" | "STRB" => encode_load_store(inst, symbols, addr),
        "B" | "BL" => Err(AsmError::code("E1002", "branch handled separately")),
        "NOP" => {
            let suffix = parse_suffixes(&inst.suffixes, false, false)?;
            Ok(encode_system(suffix.cond, 0, 0))
        }
        "HALT" => {
            let suffix = parse_suffixes(&inst.suffixes, false, false)?;
            Ok(encode_system(suffix.cond, 1, 0))
        }
        "SVC" => encode_svc(inst, symbols),
        _ => Err(AsmError::code("E1001", "unknown mnemonic")),
    }
}

fn encode_alu(inst: &Instruction, symbols: &HashMap<String, u32>, _addr: i64) -> Result<u32, AsmError> {
    let suffix = parse_suffixes(&inst.suffixes, true, false)?;
    if inst.operands.len() < 3 || inst.operands.len() > 4 {
        return Err(AsmError::code("E1002", "invalid operand count"));
    }
    let rd = expect_reg(&inst.operands[0])?;
    let rn = expect_reg(&inst.operands[1])?;
    match &inst.operands[2] {
        Operand::Reg(_) => {
            let (rm, shift) = parse_shifted_reg(&inst.operands, 2)?;
            let op = alu_op_code(&inst.mnemonic)?;
            Ok(encode_alu_reg(
                suffix.cond,
                op,
                suffix.set_flags,
                rd,
                rn,
                rm,
                shift,
            ))
        }
        Operand::Imm(expr) => {
            if inst.operands.len() != 3 {
                return Err(AsmError::code("E1002", "invalid operand count"));
            }
            let imm = eval_expr(expr, symbols)?;
            let imm12 = encode_imm12(imm)?;
            let op = alu_op_code(&inst.mnemonic)?;
            Ok(encode_alu_imm(suffix.cond, op, suffix.set_flags, rd, rn, imm12))
        }
        _ => Err(AsmError::code("E1002", "invalid operand")),
    }
}

fn encode_mov(inst: &Instruction, symbols: &HashMap<String, u32>, _addr: i64) -> Result<u32, AsmError> {
    let suffix = parse_suffixes(&inst.suffixes, true, false)?;
    if inst.operands.len() < 2 || inst.operands.len() > 3 {
        return Err(AsmError::code("E1002", "invalid operand count"));
    }
    let rd = expect_reg(&inst.operands[0])?;
    match &inst.operands[1] {
        Operand::Reg(_) => {
            let (rm, shift) = parse_shifted_reg(&inst.operands, 1)?;
            let op = alu_op_code(&inst.mnemonic)?;
            Ok(encode_alu_reg(
                suffix.cond,
                op,
                suffix.set_flags,
                rd,
                Reg::R0,
                rm,
                shift,
            ))
        }
        Operand::Imm(expr) => {
            if inst.operands.len() != 2 {
                return Err(AsmError::code("E1002", "invalid operand count"));
            }
            let imm = eval_expr(expr, symbols)?;
            let imm12 = encode_imm12(imm)?;
            let op = alu_op_code(&inst.mnemonic)?;
            Ok(encode_alu_imm(suffix.cond, op, suffix.set_flags, rd, Reg::R0, imm12))
        }
        _ => Err(AsmError::code("E1002", "invalid operand")),
    }
}

fn encode_cmp(inst: &Instruction, symbols: &HashMap<String, u32>, _addr: i64) -> Result<u32, AsmError> {
    let suffix = parse_suffixes(&inst.suffixes, false, false)?;
    if inst.operands.len() < 2 || inst.operands.len() > 3 {
        return Err(AsmError::code("E1002", "invalid operand count"));
    }
    let rn = expect_reg(&inst.operands[0])?;
    match &inst.operands[1] {
        Operand::Reg(_) => {
            let (rm, shift) = parse_shifted_reg(&inst.operands, 1)?;
            let op = alu_op_code(&inst.mnemonic)?;
            Ok(encode_alu_reg(
                suffix.cond,
                op,
                true,
                Reg::R0,
                rn,
                rm,
                shift,
            ))
        }
        Operand::Imm(expr) => {
            if inst.operands.len() != 2 {
                return Err(AsmError::code("E1002", "invalid operand count"));
            }
            let imm = eval_expr(expr, symbols)?;
            let imm12 = encode_imm12(imm)?;
            let op = alu_op_code(&inst.mnemonic)?;
            Ok(encode_alu_imm(suffix.cond, op, true, Reg::R0, rn, imm12))
        }
        _ => Err(AsmError::code("E1002", "invalid operand")),
    }
}

fn encode_load_store(inst: &Instruction, symbols: &HashMap<String, u32>, _addr: i64) -> Result<u32, AsmError> {
    let mut mnemonic = inst.mnemonic.to_ascii_uppercase();
    let mut byte = false;
    if mnemonic.ends_with('B') {
        byte = true;
        mnemonic = mnemonic.trim_end_matches('B').to_string();
    }
    let suffix = parse_suffixes(&inst.suffixes, false, true)?;
    byte |= suffix.byte;
    if inst.operands.len() != 2 {
        return Err(AsmError::code("E1002", "invalid operand count"));
    }
    let rd = expect_reg(&inst.operands[0])?;
    match &inst.operands[1] {
        Operand::Mem {
            base,
            offset,
            writeback,
        } => {
            let off_val = match offset {
                Some(expr) => eval_expr(expr, symbols)?,
                None => 0,
            };
            let (u, off13) = encode_off13(off_val)?;
            let l = mnemonic == "LDR";
            Ok(encode_ldr(
                suffix.cond,
                rd,
                *base,
                u,
                off13,
                *writeback,
                byte,
                l,
            ))
        }
        Operand::Literal(_) => Err(AsmError::code("E1002", "literal handled separately")),
        _ => Err(AsmError::code("E1002", "invalid operand")),
    }
}

fn encode_svc(inst: &Instruction, symbols: &HashMap<String, u32>) -> Result<u32, AsmError> {
    let suffix = parse_suffixes(&inst.suffixes, false, false)?;
    if inst.operands.len() != 1 {
        return Err(AsmError::code("E1002", "invalid operand count"));
    }
    let imm = match &inst.operands[0] {
        Operand::Imm(expr) | Operand::Expr(expr) => eval_expr(expr, symbols)?,
        _ => return Err(AsmError::code("E1002", "invalid operand")),
    };
    if imm < 0 || imm >= (1 << 21) {
        return Err(AsmError::code("E1004", "immediate out of range"));
    }
    Ok(encode_system(suffix.cond, 2, imm as u32))
}

fn encode_alu_reg(cond: Cond, op: u32, s: bool, rd: Reg, rn: Reg, rm: Reg, shift: u32) -> u32 {
    (cond.to_u4() as u32) << 28
        | 0b000 << 25
        | (op & 0xF) << 21
        | ((s as u32) << 20)
        | ((rd.to_u8() as u32) << 16)
        | ((rn.to_u8() as u32) << 12)
        | ((rm.to_u8() as u32) << 8)
        | (shift & 0xFF)
}

fn encode_alu_imm(cond: Cond, op: u32, s: bool, rd: Reg, rn: Reg, imm12: u32) -> u32 {
    (cond.to_u4() as u32) << 28
        | 0b001 << 25
        | (op & 0xF) << 21
        | ((s as u32) << 20)
        | ((rd.to_u8() as u32) << 16)
        | ((rn.to_u8() as u32) << 12)
        | (imm12 & 0xFFF)
}

fn encode_ldr(
    cond: Cond,
    rd: Reg,
    rn: Reg,
    u: bool,
    off13: u32,
    w: bool,
    b: bool,
    l: bool,
) -> u32 {
    (cond.to_u4() as u32) << 28
        | 0b010 << 25
        | ((l as u32) << 24)
        | ((b as u32) << 23)
        | ((w as u32) << 22)
        | ((u as u32) << 21)
        | ((rd.to_u8() as u32) << 17)
        | ((rn.to_u8() as u32) << 13)
        | (off13 & 0x1FFF)
}

fn encode_branch(cond: Cond, link: bool, offset: i64) -> Result<u32, AsmError> {
    if offset % 4 != 0 {
        return Err(AsmError::code("E1002", "branch target misaligned"));
    }
    if !fits_branch_offset(offset) {
        return Err(AsmError::code("E1004", "immediate out of range"));
    }
    let imm = (offset / 4) as i32;
    let imm23 = (imm as u32) & 0x7FFFFF;
    Ok((cond.to_u4() as u32) << 28 | 0b011 << 25 | ((link as u32) << 24) | (imm23 << 1))
}

fn encode_system(cond: Cond, op: u32, imm21: u32) -> u32 {
    (cond.to_u4() as u32) << 28 | 0b100 << 25 | ((op & 0xF) << 21) | (imm21 & 0x1F_FFFF)
}

fn alu_op_code(name: &str) -> Result<u32, AsmError> {
    match name.to_ascii_uppercase().as_str() {
        "AND" => Ok(0b0000),
        "EOR" => Ok(0b0001),
        "SUB" => Ok(0b0010),
        "ADD" => Ok(0b0011),
        "ORR" => Ok(0b0100),
        "MOV" => Ok(0b0101),
        "MVN" => Ok(0b0110),
        "CMP" => Ok(0b0111),
        "TST" => Ok(0b1000),
        _ => Err(AsmError::code("E1001", "unknown mnemonic")),
    }
}

fn parse_suffixes(
    suffixes: &[String],
    allow_s: bool,
    allow_b: bool,
) -> Result<SuffixInfo, AsmError> {
    let mut cond = Cond::AL;
    let mut set_flags = false;
    let mut byte = false;
    let mut cond_idx = None;
    let mut s_idx = None;

    for (idx, suffix) in suffixes.iter().enumerate() {
        let s = suffix.to_ascii_uppercase();
        if s == "S" {
            if !allow_s {
                return Err(AsmError::code("E1002", "invalid suffix"));
            }
            if s_idx.is_some() {
                return Err(AsmError::code("E1009", "duplicate .S"));
            }
            s_idx = Some(idx);
            set_flags = true;
            continue;
        }
        if s == "B" {
            if !allow_b {
                return Err(AsmError::code("E1002", "invalid suffix"));
            }
            if byte {
                return Err(AsmError::code("E1002", "duplicate .B"));
            }
            byte = true;
            continue;
        }
        if let Some(c) = cond_from_str(&s) {
            if cond_idx.is_some() {
                return Err(AsmError::code("E1009", "duplicate condition"));
            }
            cond_idx = Some(idx);
            cond = c;
            continue;
        }
        return Err(AsmError::code("E1002", "invalid suffix"));
    }
    if let (Some(s), Some(c)) = (s_idx, cond_idx) {
        if s > c {
            return Err(AsmError::code("E1009", "suffix order invalid"));
        }
    }
    Ok(SuffixInfo {
        cond,
        set_flags,
        byte,
    })
}

struct SuffixInfo {
    cond: Cond,
    set_flags: bool,
    byte: bool,
}

fn cond_from_str(s: &str) -> Option<Cond> {
    match s {
        "EQ" => Some(Cond::EQ),
        "NE" => Some(Cond::NE),
        "CS" => Some(Cond::CS),
        "CC" => Some(Cond::CC),
        "MI" => Some(Cond::MI),
        "PL" => Some(Cond::PL),
        "VS" => Some(Cond::VS),
        "VC" => Some(Cond::VC),
        "HI" => Some(Cond::HI),
        "LS" => Some(Cond::LS),
        "GE" => Some(Cond::GE),
        "LT" => Some(Cond::LT),
        "GT" => Some(Cond::GT),
        "LE" => Some(Cond::LE),
        "AL" => Some(Cond::AL),
        "NV" => Some(Cond::NV),
        _ => None,
    }
}

fn invert_cond(cond: Cond) -> Option<Cond> {
    Some(match cond {
        Cond::EQ => Cond::NE,
        Cond::NE => Cond::EQ,
        Cond::CS => Cond::CC,
        Cond::CC => Cond::CS,
        Cond::MI => Cond::PL,
        Cond::PL => Cond::MI,
        Cond::VS => Cond::VC,
        Cond::VC => Cond::VS,
        Cond::HI => Cond::LS,
        Cond::LS => Cond::HI,
        Cond::GE => Cond::LT,
        Cond::LT => Cond::GE,
        Cond::GT => Cond::LE,
        Cond::LE => Cond::GT,
        Cond::AL => Cond::NV,
        Cond::NV => Cond::AL,
    })
}

fn is_branch(inst: &Instruction) -> bool {
    inst.mnemonic.eq_ignore_ascii_case("B") || inst.mnemonic.eq_ignore_ascii_case("BL")
}

fn branch_target_expr(inst: &Instruction) -> Result<Expr, AsmError> {
    if inst.operands.len() != 1 {
        return Err(AsmError::code("E1002", "invalid operand count"));
    }
    match &inst.operands[0] {
        Operand::Expr(expr) | Operand::Imm(expr) => Ok(expr.clone()),
        _ => Err(AsmError::code("E1002", "invalid branch target")),
    }
}

fn is_ldr_literal(inst: &Instruction) -> Result<bool, AsmError> {
    if !inst.mnemonic.eq_ignore_ascii_case("LDR") {
        return Ok(false);
    }
    if inst.operands.len() != 2 {
        return Err(AsmError::code("E1002", "invalid operand count"));
    }
    Ok(matches!(inst.operands[1], Operand::Literal(_)))
}

fn ldr_literal_parts(inst: &Instruction) -> Result<(Reg, Expr), AsmError> {
    if inst.operands.len() != 2 {
        return Err(AsmError::code("E1002", "invalid operand count"));
    }
    let rd = expect_reg(&inst.operands[0])?;
    match &inst.operands[1] {
        Operand::Literal(expr) => Ok((rd, expr.clone())),
        _ => Err(AsmError::code("E1002", "invalid literal operand")),
    }
}

struct MovLiteralInfo {
    cond: Cond,
    rd: Reg,
    expr: Expr,
}

fn is_mov_literal(inst: &Instruction) -> Result<bool, AsmError> {
    if !inst.mnemonic.eq_ignore_ascii_case("MOV") {
        return Ok(false);
    }
    let suffix = parse_suffixes(&inst.suffixes, true, false)?;
    if suffix.set_flags {
        return Ok(false);
    }
    if inst.operands.len() != 2 {
        return Ok(false);
    }
    match &inst.operands[1] {
        Operand::Imm(expr) => Ok(mov_needs_literal(expr)),
        _ => Ok(false),
    }
}

fn mov_literal_request(inst: &Instruction) -> Result<Option<MovLiteralInfo>, AsmError> {
    if !inst.mnemonic.eq_ignore_ascii_case("MOV") {
        return Ok(None);
    }
    let suffix = parse_suffixes(&inst.suffixes, true, false)?;
    if suffix.set_flags {
        return Ok(None);
    }
    if inst.operands.len() != 2 {
        return Ok(None);
    }
    let rd = expect_reg(&inst.operands[0])?;
    match &inst.operands[1] {
        Operand::Imm(expr) => {
            if mov_needs_literal(expr) {
                return Ok(Some(MovLiteralInfo {
                    cond: suffix.cond,
                    rd,
                    expr: expr.clone(),
                }));
            }
            Ok(None)
        }
        _ => Ok(None),
    }
}

fn expect_reg(op: &Operand) -> Result<Reg, AsmError> {
    match op {
        Operand::Reg(r) => Ok(*r),
        _ => Err(AsmError::code("E1003", "invalid register")),
    }
}

fn parse_shifted_reg(operands: &[Operand], idx: usize) -> Result<(Reg, u32), AsmError> {
    let reg = match operands.get(idx) {
        Some(Operand::Reg(r)) => *r,
        _ => return Err(AsmError::code("E1003", "invalid register")),
    };
    if operands.len() == idx + 1 {
        return Ok((reg, 0));
    }
    if operands.len() == idx + 2 {
        match &operands[idx + 1] {
            Operand::Shift { kind, amount } => {
                let shift = encode_shift(*kind, amount)?;
                return Ok((reg, shift));
            }
            _ => return Err(AsmError::code("E1002", "invalid operand")),
        }
    }
    Err(AsmError::code("E1002", "invalid operand count"))
}

fn eval_expr(expr: &Expr, symbols: &HashMap<String, u32>) -> Result<i64, AsmError> {
    match expr {
        Expr::Number(v) => Ok(*v),
        Expr::Symbol(name) => symbols
            .get(name)
            .map(|v| *v as i64)
            .ok_or_else(|| AsmError::code("E1005", "undefined symbol")),
        Expr::UnaryMinus(inner) => Ok(-eval_expr(inner, symbols)?),
        Expr::Add(a, b) => Ok(eval_expr(a, symbols)? + eval_expr(b, symbols)?),
        Expr::Sub(a, b) => Ok(eval_expr(a, symbols)? - eval_expr(b, symbols)?),
    }
}

fn eval_const_expr(expr: &Expr) -> Result<i64, AsmError> {
    match expr {
        Expr::Number(v) => Ok(*v),
        Expr::UnaryMinus(inner) => Ok(-eval_const_expr(inner)?),
        Expr::Add(a, b) => Ok(eval_const_expr(a)? + eval_const_expr(b)?),
        Expr::Sub(a, b) => Ok(eval_const_expr(a)? - eval_const_expr(b)?),
        Expr::Symbol(_) => Err(AsmError::code("E1002", "invalid operand")),
    }
}

fn encode_shift(kind: ShiftKind, amount: &Expr) -> Result<u32, AsmError> {
    let value = eval_const_expr(amount)?;
    if value < 0 || value > 31 {
        return Err(AsmError::code("E1004", "shift amount out of range"));
    }
    let kind_bits = match kind {
        ShiftKind::Lsl => 0u32,
        ShiftKind::Lsr => 1u32,
        ShiftKind::Asr => 2u32,
        ShiftKind::Ror => 3u32,
    };
    Ok((kind_bits << 6) | (value as u32 & 0x3F))
}

fn mov_needs_literal(expr: &Expr) -> bool {
    match eval_const_expr(expr) {
        Ok(value) => !fits_imm12(value),
        Err(_) => true,
    }
}

fn encode_imm12(value: i64) -> Result<u32, AsmError> {
    if !fits_imm12(value) {
        return Err(AsmError::code("E1004", "immediate out of range"));
    }
    Ok((value as i32 as u32) & 0xFFF)
}

fn fits_imm12(value: i64) -> bool {
    value >= -2048 && value <= 2047
}

fn encode_off13(value: i64) -> Result<(bool, u32), AsmError> {
    if value < -8191 || value > 8191 {
        return Err(AsmError::code("E1004", "immediate out of range"));
    }
    let u = value >= 0;
    let off = value.abs() as u32;
    Ok((u, off))
}

fn fits_branch_offset(offset: i64) -> bool {
    let imm = offset / 4;
    imm >= -(1 << 22) && imm <= (1 << 22) - 1
}

fn fits_ldr_literal_offset(offset: i64) -> bool {
    offset >= -8191 && offset <= 8191
}

fn value_to_u32(value: i64) -> Result<u32, AsmError> {
    if value < i32::MIN as i64 || value > u32::MAX as i64 {
        return Err(AsmError::code("E1004", "immediate out of range"));
    }
    Ok(value as i32 as u32)
}

fn align_to(value: u32, align: u32) -> u32 {
    if align == 0 {
        return value;
    }
    let mask = align - 1;
    (value + mask) & !mask
}

fn emit_word(buf: &mut Vec<u8>, word: u32) {
    buf.push((word & 0xFF) as u8);
    buf.push(((word >> 8) & 0xFF) as u8);
    buf.push(((word >> 16) & 0xFF) as u8);
    buf.push(((word >> 24) & 0xFF) as u8);
}

fn patch_word(buf: &mut Vec<u8>, offset: usize, word: u32) {
    if offset + 3 >= buf.len() {
        return;
    }
    buf[offset] = (word & 0xFF) as u8;
    buf[offset + 1] = ((word >> 8) & 0xFF) as u8;
    buf[offset + 2] = ((word >> 16) & 0xFF) as u8;
    buf[offset + 3] = ((word >> 24) & 0xFF) as u8;
}

fn nop_word() -> u32 {
    encode_system(Cond::AL, 0, 0)
}

struct SegmentDesc {
    seg_type: u32,
    flags: u32,
    vaddr: u32,
    data: Vec<u8>,
    mem_size: u32,
}

fn build_a32b(segments: &[SegmentDesc], entry: u32) -> Vec<u8> {
    let ph_count = segments.len() as u16;
    let ph_size = 24u16;
    let header_size = 32u32;
    let ph_offset = header_size;
    let mut file_offset = header_size + ph_size as u32 * ph_count as u32;
    file_offset = align_to(file_offset, 4);

    let mut headers = Vec::new();
    let mut data_blobs = Vec::new();
    let mut current_off = file_offset;

    for seg in segments {
        let file_size = seg.data.len() as u32;
        let file_off = if seg.seg_type == 2 {
            0
        } else {
            let off = current_off;
            current_off = align_to(current_off + file_size, 4);
            off
        };
        headers.push((seg, file_off, file_size));
        data_blobs.push(seg.data.clone());
    }

    let file_size = current_off;
    let mut out = vec![0u8; file_size as usize];

    out[0..4].copy_from_slice(b"A32B");
    out[4..6].copy_from_slice(&1u16.to_le_bytes());
    out[6..8].copy_from_slice(&1u16.to_le_bytes());
    out[8..12].copy_from_slice(&entry.to_le_bytes());
    out[12..14].copy_from_slice(&ph_count.to_le_bytes());
    out[14..16].copy_from_slice(&ph_size.to_le_bytes());
    out[16..20].copy_from_slice(&ph_offset.to_le_bytes());
    out[20..24].copy_from_slice(&file_size.to_le_bytes());

    let mut ph_cursor = ph_offset as usize;
    for (idx, (seg, file_off, file_size)) in headers.iter().enumerate() {
        let mem_size = seg.mem_size;
        out[ph_cursor..ph_cursor + 4].copy_from_slice(&seg.seg_type.to_le_bytes());
        out[ph_cursor + 4..ph_cursor + 8].copy_from_slice(&seg.flags.to_le_bytes());
        out[ph_cursor + 8..ph_cursor + 12].copy_from_slice(&seg.vaddr.to_le_bytes());
        out[ph_cursor + 12..ph_cursor + 16].copy_from_slice(&file_off.to_le_bytes());
        out[ph_cursor + 16..ph_cursor + 20].copy_from_slice(&file_size.to_le_bytes());
        out[ph_cursor + 20..ph_cursor + 24].copy_from_slice(&mem_size.to_le_bytes());
        ph_cursor += ph_size as usize;

        if *file_size > 0 {
            let data = &data_blobs[idx];
            let start = *file_off as usize;
            out[start..start + data.len()].copy_from_slice(data);
        }
    }

    out
}
