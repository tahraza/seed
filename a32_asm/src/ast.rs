use a32_core::isa::Reg;

#[derive(Debug, Clone)]
pub struct Program {
    pub items: Vec<Item>,
}

#[derive(Debug, Clone)]
pub enum Item {
    Label(Label),
    Directive(Directive),
    Instruction(Instruction),
}

#[derive(Debug, Clone)]
pub struct Label {
    pub name: String,
}

#[derive(Debug, Clone)]
pub enum Directive {
    Text,
    Data,
    Bss,
    RoData,
    Global(String),
    Word(Expr),
    Byte(Expr),
    Space(Expr),
    Align(Expr),
    Org(Expr),
    Ascii(String),
    Asciz(String),
    Pool,
    LtOrg,
}

#[derive(Debug, Clone)]
pub struct Instruction {
    pub mnemonic: String,
    pub suffixes: Vec<String>,
    pub operands: Vec<Operand>,
}

#[derive(Debug, Clone)]
pub enum Operand {
    Reg(Reg),
    Shift { kind: ShiftKind, amount: Expr },
    Imm(Expr),
    Expr(Expr),
    Mem {
        base: Reg,
        offset: Option<Expr>,
        writeback: bool,
    },
    Literal(Expr),
}

#[derive(Debug, Clone)]
pub enum Expr {
    Number(i64),
    Symbol(String),
    UnaryMinus(Box<Expr>),
    Add(Box<Expr>, Box<Expr>),
    Sub(Box<Expr>, Box<Expr>),
}

#[derive(Debug, Clone, Copy)]
pub enum ShiftKind {
    Lsl,
    Lsr,
    Asr,
    Ror,
}
