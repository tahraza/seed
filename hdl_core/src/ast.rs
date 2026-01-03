use crate::error::Span;

#[derive(Clone, Debug)]
pub struct Design {
    pub entities: Vec<Entity>,
    pub architectures: Vec<Architecture>,
}

#[derive(Clone, Debug)]
pub struct Entity {
    pub name: String,
    pub ports: Vec<Port>,
    pub span: Option<Span>,
}

#[derive(Clone, Debug)]
pub struct Port {
    pub name: String,
    pub dir: Direction,
    pub ty: Type,
    pub span: Option<Span>,
}

#[derive(Clone, Debug)]
pub enum Direction {
    In,
    Out,
}

#[derive(Clone, Debug)]
pub enum Type {
    Bit,
    Bits {
        msb: i64,
        lsb: i64,
        dir: RangeDir,
    },
}

#[derive(Clone, Debug)]
pub enum RangeDir {
    Downto,
    To,
}

#[derive(Clone, Debug)]
pub struct Architecture {
    pub name: String,
    pub entity: String,
    pub signals: Vec<SignalDecl>,
    pub components: Vec<ComponentDecl>,
    pub stmts: Vec<ConcurrentStmt>,
    pub span: Option<Span>,
}

#[derive(Clone, Debug)]
pub struct SignalDecl {
    pub names: Vec<String>,
    pub ty: Type,
    pub init: Option<Expr>,
    pub span: Option<Span>,
}

#[derive(Clone, Debug)]
pub struct ComponentDecl {
    pub name: String,
    pub ports: Vec<Port>,
    pub span: Option<Span>,
}

#[derive(Clone, Debug)]
pub enum ConcurrentStmt {
    Assign(AssignStmt),
    Process(ProcessStmt),
    Instance(InstanceStmt),
}

#[derive(Clone, Debug)]
pub struct AssignStmt {
    pub target: Target,
    pub expr: Expr,
    pub span: Option<Span>,
}

#[derive(Clone, Debug)]
pub struct ProcessStmt {
    pub clk: String,
    pub stmts: Vec<SeqStmt>,
    pub span: Option<Span>,
}

#[derive(Clone, Debug)]
pub struct InstanceStmt {
    pub name: String,
    pub entity: String,
    pub port_map: Vec<Assoc>,
    pub span: Option<Span>,
}

#[derive(Clone, Debug)]
pub struct Assoc {
    pub port: String,
    pub expr: Expr,
    pub span: Option<Span>,
}

#[derive(Clone, Debug)]
pub enum SeqStmt {
    Assign(AssignStmt),
    If(IfStmt),
    Case(CaseStmt),
}

#[derive(Clone, Debug)]
pub struct IfStmt {
    pub cond: Expr,
    pub then_stmts: Vec<SeqStmt>,
    pub elsif: Vec<(Expr, Vec<SeqStmt>)>,
    pub else_stmts: Vec<SeqStmt>,
    pub span: Option<Span>,
}

#[derive(Clone, Debug)]
pub struct CaseStmt {
    pub expr: Expr,
    pub arms: Vec<(CaseChoice, Vec<SeqStmt>)>,
    pub span: Option<Span>,
}

#[derive(Clone, Debug)]
pub enum CaseChoice {
    Literal(Literal),
    Ident(String),
    Others,
}

#[derive(Clone, Debug)]
pub struct Target {
    pub name: String,
    pub sel: Option<Selector>,
    pub span: Option<Span>,
}

#[derive(Clone, Debug)]
pub enum Selector {
    Index(i64),
    Range { msb: i64, lsb: i64, dir: RangeDir },
}

#[derive(Clone, Debug)]
pub enum Expr {
    Literal(Literal),
    Target(Target),
    Unary { op: UnaryOp, expr: Box<Expr> },
    Binary { op: BinaryOp, left: Box<Expr>, right: Box<Expr> },
    Call { name: String, args: Vec<Expr> },
}

#[derive(Clone, Debug)]
pub enum Literal {
    Bit(bool),
    Bits(String, LiteralBase),
    Int(i64),
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum LiteralBase {
    Bin,
    Hex,
}

#[derive(Clone, Copy, Debug)]
pub enum UnaryOp {
    Not,
    Neg,
}

#[derive(Clone, Copy, Debug)]
pub enum BinaryOp {
    Add,
    Sub,
    And,
    Or,
    Xor,
    Concat,
    Shl,
    Shr,
    Eq,
    Ne,
    Lt,
    Le,
    Gt,
    Ge,
}
