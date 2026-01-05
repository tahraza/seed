#[derive(Debug, Clone)]
pub struct Program {
    pub items: Vec<Item>,
}

#[derive(Debug, Clone)]
pub enum Item {
    Func(Func),
    Global(Global),
    StructDef(StructDef),
}

// ============================================================================
// Struct definitions
// ============================================================================

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StructField {
    pub name: String,
    pub ty: Type,
    pub offset: usize,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StructDef {
    pub name: String,
    pub fields: Vec<StructField>,
    pub size: usize,
    pub align: usize,
}

#[derive(Debug, Clone)]
pub struct Func {
    pub name: String,
    pub ret: Type,
    pub params: Vec<Param>,
    pub body: Option<Vec<Stmt>>,
    pub is_extern: bool,
}

#[derive(Debug, Clone)]
pub struct Global {
    pub name: String,
    pub ty: Type,
    pub init: Option<Expr>,
    pub is_extern: bool,
}

#[derive(Debug, Clone)]
pub struct Param {
    pub name: String,
    pub ty: Type,
}

#[derive(Debug, Clone)]
pub enum Stmt {
    Block(Vec<Stmt>),
    Decl(Decl),
    Expr(Expr),
    Return(Option<Expr>),
    If {
        cond: Expr,
        then_branch: Box<Stmt>,
        else_branch: Option<Box<Stmt>>,
    },
    While {
        cond: Expr,
        body: Box<Stmt>,
    },
    For {
        init: Option<Box<Stmt>>,
        cond: Option<Expr>,
        post: Option<Expr>,
        body: Box<Stmt>,
    },
    Break,
    Continue,
}

#[derive(Debug, Clone)]
pub struct Decl {
    pub name: String,
    pub ty: Type,
    pub init: Option<Expr>,
}

#[derive(Debug, Clone)]
pub enum Expr {
    Number(NumberLit),
    Char(u8),
    String(String),
    Var(String),
    Unary {
        op: UnaryOp,
        expr: Box<Expr>,
    },
    Binary {
        op: BinaryOp,
        left: Box<Expr>,
        right: Box<Expr>,
    },
    Assign {
        left: Box<Expr>,
        right: Box<Expr>,
    },
    Call {
        name: String,
        args: Vec<Expr>,
    },
    Index {
        base: Box<Expr>,
        index: Box<Expr>,
    },
    Cast {
        ty: Type,
        expr: Box<Expr>,
    },
    SizeofType(Type),
    SizeofExpr(Box<Expr>),
    /// Member access: s.field
    Member {
        base: Box<Expr>,
        field: String,
    },
    /// Arrow member access: p->field
    Arrow {
        base: Box<Expr>,
        field: String,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct NumberLit {
    pub value: u64,
    pub unsigned: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UnaryOp {
    Neg,
    Not,
    BitNot,
    Addr,
    Deref,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BinaryOp {
    Add,
    Sub,
    Mul,
    Div,
    Mod,
    Shl,
    Shr,
    Lt,
    Le,
    Gt,
    Ge,
    Eq,
    Ne,
    BitAnd,
    BitOr,
    BitXor,
    LogAnd,
    LogOr,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BaseType {
    Int,
    UInt,
    Char,
    Bool,
    Void,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Type {
    Base(BaseType),
    Pointer(Box<Type>),
    Array(Box<Type>, usize),
    /// Struct type, stores (name, size, align) for self-contained size/align info
    Struct(String, usize, usize),
}

impl Type {
    pub fn is_void(&self) -> bool {
        matches!(self, Type::Base(BaseType::Void))
    }

    pub fn is_pointer(&self) -> bool {
        matches!(self, Type::Pointer(_))
    }

    pub fn is_array(&self) -> bool {
        matches!(self, Type::Array(_, _))
    }

    pub fn is_struct(&self) -> bool {
        matches!(self, Type::Struct(_, _, _))
    }

    pub fn struct_name(&self) -> Option<&str> {
        match self {
            Type::Struct(name, _, _) => Some(name),
            _ => None,
        }
    }

    pub fn base(&self) -> Option<BaseType> {
        match self {
            Type::Base(base) => Some(*base),
            _ => None,
        }
    }

    pub fn elem(&self) -> Option<&Type> {
        match self {
            Type::Pointer(inner) | Type::Array(inner, _) => Some(inner.as_ref()),
            _ => None,
        }
    }

    pub fn size(&self) -> Option<usize> {
        match self {
            Type::Base(BaseType::Int) | Type::Base(BaseType::UInt) => Some(4),
            Type::Base(BaseType::Char) | Type::Base(BaseType::Bool) => Some(1),
            Type::Base(BaseType::Void) => None,
            Type::Pointer(_) => Some(4),
            Type::Array(elem, len) => elem.size().map(|s| s * len),
            Type::Struct(_, size, _) => Some(*size),
        }
    }

    pub fn align(&self) -> Option<usize> {
        match self {
            Type::Base(BaseType::Int)
            | Type::Base(BaseType::UInt)
            | Type::Pointer(_) => Some(4),
            Type::Base(BaseType::Char) | Type::Base(BaseType::Bool) => Some(1),
            Type::Base(BaseType::Void) => None,
            Type::Array(elem, _) => elem.align(),
            Type::Struct(_, _, align) => Some(*align),
        }
    }

    pub fn decay(&self) -> Type {
        match self {
            Type::Array(elem, _) => Type::Pointer(elem.clone()),
            _ => self.clone(),
        }
    }

    pub fn is_integer(&self) -> bool {
        matches!(self, Type::Base(BaseType::Int | BaseType::UInt | BaseType::Char | BaseType::Bool))
    }

    pub fn is_signed(&self) -> bool {
        matches!(self, Type::Base(BaseType::Int))
    }

    pub fn is_unsigned(&self) -> bool {
        matches!(self, Type::Base(BaseType::UInt | BaseType::Char | BaseType::Bool))
    }
}

pub fn int_type() -> Type {
    Type::Base(BaseType::Int)
}

pub fn uint_type() -> Type {
    Type::Base(BaseType::UInt)
}

pub fn char_type() -> Type {
    Type::Base(BaseType::Char)
}

pub fn bool_type() -> Type {
    Type::Base(BaseType::Bool)
}

pub fn void_type() -> Type {
    Type::Base(BaseType::Void)
}
