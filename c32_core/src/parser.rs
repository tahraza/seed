use crate::ast::{
    bool_type, char_type, int_type, uint_type, void_type, BaseType, BinaryOp, Decl, Expr, Func,
    Global, Item, NumberLit, Param, Program, Stmt, Type, UnaryOp,
};
use crate::error::CError;
use crate::lexer::{Lexer, Token, TokenKind};

pub fn parse_program(input: &str) -> Result<Program, CError> {
    let tokens = Lexer::new(input).tokenize()?;
    let mut parser = Parser::new(tokens);
    parser.parse_program()
}

struct Parser {
    tokens: Vec<Token>,
    pos: usize,
}

impl Parser {
    fn new(tokens: Vec<Token>) -> Self {
        Self { tokens, pos: 0 }
    }

    fn parse_program(&mut self) -> Result<Program, CError> {
        let mut items = Vec::new();
        while !self.is_eof() {
            items.push(self.parse_item()?);
        }
        Ok(Program { items })
    }

    fn parse_item(&mut self) -> Result<Item, CError> {
        let is_extern = self.consume_keyword("extern");
        let base = self.parse_base_type()?;
        let (ty, name) = self.parse_declarator(base)?;
        if self.peek_kind() == TokenKind::LParen {
            let func = self.finish_function(ty, name, is_extern)?;
            Ok(Item::Func(func))
        } else {
            let global = self.finish_global(ty, name, is_extern)?;
            Ok(Item::Global(global))
        }
    }

    fn finish_function(&mut self, ret: Type, name: String, is_extern: bool) -> Result<Func, CError> {
        self.expect(TokenKind::LParen, "expected '('")?;
        let params = self.parse_params()?;
        self.expect(TokenKind::RParen, "expected ')'")?;
        if self.peek_kind() == TokenKind::Semicolon {
            self.next();
            return Ok(Func {
                name,
                ret,
                params,
                body: None,
                is_extern: true,
            });
        }
        let body = self.parse_block()?;
        Ok(Func {
            name,
            ret,
            params,
            body: Some(body),
            is_extern,
        })
    }

    fn finish_global(&mut self, ty: Type, name: String, is_extern: bool) -> Result<Global, CError> {
        let init = if self.peek_kind() == TokenKind::Assign {
            self.next();
            Some(self.parse_expr()?)
        } else {
            None
        };
        self.expect(TokenKind::Semicolon, "expected ';'")?;
        Ok(Global {
            name,
            ty,
            init,
            is_extern,
        })
    }

    fn parse_params(&mut self) -> Result<Vec<Param>, CError> {
        let mut params = Vec::new();
        if self.peek_kind() == TokenKind::RParen {
            return Ok(params);
        }
        loop {
            let base = self.parse_base_type()?;
            let (mut ty, name) = self.parse_declarator(base)?;
            if let Type::Array(elem, _) = ty {
                ty = Type::Pointer(elem);
            }
            params.push(Param { ty, name });
            if self.peek_kind() == TokenKind::Comma {
                self.next();
                continue;
            }
            break;
        }
        Ok(params)
    }

    fn parse_block(&mut self) -> Result<Vec<Stmt>, CError> {
        self.expect(TokenKind::LBrace, "expected '{'")?;
        let mut stmts = Vec::new();
        while self.peek_kind() != TokenKind::RBrace {
            if self.is_eof() {
                return Err(self.error_at(self.peek(), "unexpected end of input"));
            }
            stmts.push(self.parse_stmt()?);
        }
        self.expect(TokenKind::RBrace, "expected '}'")?;
        Ok(stmts)
    }

    fn parse_stmt(&mut self) -> Result<Stmt, CError> {
        if self.peek_kind() == TokenKind::LBrace {
            let block = self.parse_block()?;
            return Ok(Stmt::Block(block));
        }
        if self.peek_keyword("if") {
            self.next();
            self.expect(TokenKind::LParen, "expected '('")?;
            let cond = self.parse_expr()?;
            self.expect(TokenKind::RParen, "expected ')'")?;
            let then_branch = Box::new(self.parse_stmt()?);
            let else_branch = if self.peek_keyword("else") {
                self.next();
                Some(Box::new(self.parse_stmt()?))
            } else {
                None
            };
            return Ok(Stmt::If {
                cond,
                then_branch,
                else_branch,
            });
        }
        if self.peek_keyword("while") {
            self.next();
            self.expect(TokenKind::LParen, "expected '('")?;
            let cond = self.parse_expr()?;
            self.expect(TokenKind::RParen, "expected ')'")?;
            let body = Box::new(self.parse_stmt()?);
            return Ok(Stmt::While { cond, body });
        }
        if self.peek_keyword("for") {
            self.next();
            self.expect(TokenKind::LParen, "expected '('")?;
            let init = if self.peek_kind() == TokenKind::Semicolon {
                self.next();
                None
            } else if self.peek_is_type() || self.peek_keyword("extern") {
                let decl = self.parse_decl_stmt()?;
                Some(Box::new(decl))
            } else {
                let expr = self.parse_expr()?;
                self.expect(TokenKind::Semicolon, "expected ';'")?;
                Some(Box::new(Stmt::Expr(expr)))
            };
            let cond = if self.peek_kind() == TokenKind::Semicolon {
                self.next();
                None
            } else {
                let expr = self.parse_expr()?;
                self.expect(TokenKind::Semicolon, "expected ';'")?;
                Some(expr)
            };
            let post = if self.peek_kind() == TokenKind::RParen {
                None
            } else {
                let expr = self.parse_expr()?;
                Some(expr)
            };
            self.expect(TokenKind::RParen, "expected ')'")?;
            let body = Box::new(self.parse_stmt()?);
            return Ok(Stmt::For {
                init,
                cond,
                post,
                body,
            });
        }
        if self.peek_keyword("break") {
            self.next();
            self.expect(TokenKind::Semicolon, "expected ';'")?;
            return Ok(Stmt::Break);
        }
        if self.peek_keyword("continue") {
            self.next();
            self.expect(TokenKind::Semicolon, "expected ';'")?;
            return Ok(Stmt::Continue);
        }
        if self.peek_keyword("return") {
            self.next();
            if self.peek_kind() == TokenKind::Semicolon {
                self.next();
                return Ok(Stmt::Return(None));
            }
            let expr = self.parse_expr()?;
            self.expect(TokenKind::Semicolon, "expected ';'")?;
            return Ok(Stmt::Return(Some(expr)));
        }
        if self.peek_is_type() || self.peek_keyword("extern") {
            return self.parse_decl_stmt();
        }
        let expr = self.parse_expr()?;
        self.expect(TokenKind::Semicolon, "expected ';'")?;
        Ok(Stmt::Expr(expr))
    }

    fn parse_decl_stmt(&mut self) -> Result<Stmt, CError> {
        let is_extern = self.consume_keyword("extern");
        let base = self.parse_base_type()?;
        let (ty, name) = self.parse_declarator(base)?;
        let init = if self.peek_kind() == TokenKind::Assign {
            self.next();
            Some(self.parse_expr()?)
        } else {
            None
        };
        self.expect(TokenKind::Semicolon, "expected ';'")?;
        if is_extern {
            return Err(self.error_at(self.peek(), "extern local not supported"));
        }
        Ok(Stmt::Decl(Decl { name, ty, init }))
    }

    fn parse_expr(&mut self) -> Result<Expr, CError> {
        self.parse_assign()
    }

    fn parse_assign(&mut self) -> Result<Expr, CError> {
        let mut expr = self.parse_logical_or()?;
        if self.peek_kind() == TokenKind::Assign {
            self.next();
            let rhs = self.parse_assign()?;
            expr = Expr::Assign {
                left: Box::new(expr),
                right: Box::new(rhs),
            };
        }
        Ok(expr)
    }

    fn parse_logical_or(&mut self) -> Result<Expr, CError> {
        let mut expr = self.parse_logical_and()?;
        while self.peek_kind() == TokenKind::PipePipe {
            self.next();
            let rhs = self.parse_logical_and()?;
            expr = Expr::Binary {
                op: BinaryOp::LogOr,
                left: Box::new(expr),
                right: Box::new(rhs),
            };
        }
        Ok(expr)
    }

    fn parse_logical_and(&mut self) -> Result<Expr, CError> {
        let mut expr = self.parse_bit_or()?;
        while self.peek_kind() == TokenKind::AmpAmp {
            self.next();
            let rhs = self.parse_bit_or()?;
            expr = Expr::Binary {
                op: BinaryOp::LogAnd,
                left: Box::new(expr),
                right: Box::new(rhs),
            };
        }
        Ok(expr)
    }

    fn parse_bit_or(&mut self) -> Result<Expr, CError> {
        let mut expr = self.parse_bit_xor()?;
        while self.peek_kind() == TokenKind::Pipe {
            self.next();
            let rhs = self.parse_bit_xor()?;
            expr = Expr::Binary {
                op: BinaryOp::BitOr,
                left: Box::new(expr),
                right: Box::new(rhs),
            };
        }
        Ok(expr)
    }

    fn parse_bit_xor(&mut self) -> Result<Expr, CError> {
        let mut expr = self.parse_bit_and()?;
        while self.peek_kind() == TokenKind::Caret {
            self.next();
            let rhs = self.parse_bit_and()?;
            expr = Expr::Binary {
                op: BinaryOp::BitXor,
                left: Box::new(expr),
                right: Box::new(rhs),
            };
        }
        Ok(expr)
    }

    fn parse_bit_and(&mut self) -> Result<Expr, CError> {
        let mut expr = self.parse_equality()?;
        while self.peek_kind() == TokenKind::Amp {
            self.next();
            let rhs = self.parse_equality()?;
            expr = Expr::Binary {
                op: BinaryOp::BitAnd,
                left: Box::new(expr),
                right: Box::new(rhs),
            };
        }
        Ok(expr)
    }

    fn parse_equality(&mut self) -> Result<Expr, CError> {
        let mut expr = self.parse_relational()?;
        loop {
            let op = match self.peek_kind() {
                TokenKind::EqEq => BinaryOp::Eq,
                TokenKind::NotEq => BinaryOp::Ne,
                _ => break,
            };
            self.next();
            let rhs = self.parse_relational()?;
            expr = Expr::Binary {
                op,
                left: Box::new(expr),
                right: Box::new(rhs),
            };
        }
        Ok(expr)
    }

    fn parse_relational(&mut self) -> Result<Expr, CError> {
        let mut expr = self.parse_shift()?;
        loop {
            let op = match self.peek_kind() {
                TokenKind::Lt => BinaryOp::Lt,
                TokenKind::LtEq => BinaryOp::Le,
                TokenKind::Gt => BinaryOp::Gt,
                TokenKind::GtEq => BinaryOp::Ge,
                _ => break,
            };
            self.next();
            let rhs = self.parse_shift()?;
            expr = Expr::Binary {
                op,
                left: Box::new(expr),
                right: Box::new(rhs),
            };
        }
        Ok(expr)
    }

    fn parse_shift(&mut self) -> Result<Expr, CError> {
        let mut expr = self.parse_additive()?;
        loop {
            let op = match self.peek_kind() {
                TokenKind::Shl => BinaryOp::Shl,
                TokenKind::Shr => BinaryOp::Shr,
                _ => break,
            };
            self.next();
            let rhs = self.parse_additive()?;
            expr = Expr::Binary {
                op,
                left: Box::new(expr),
                right: Box::new(rhs),
            };
        }
        Ok(expr)
    }

    fn parse_additive(&mut self) -> Result<Expr, CError> {
        let mut expr = self.parse_mul()?;
        loop {
            let op = match self.peek_kind() {
                TokenKind::Plus => BinaryOp::Add,
                TokenKind::Minus => BinaryOp::Sub,
                _ => break,
            };
            self.next();
            let rhs = self.parse_mul()?;
            expr = Expr::Binary {
                op,
                left: Box::new(expr),
                right: Box::new(rhs),
            };
        }
        Ok(expr)
    }

    fn parse_mul(&mut self) -> Result<Expr, CError> {
        let mut expr = self.parse_unary()?;
        loop {
            let op = match self.peek_kind() {
                TokenKind::Star => BinaryOp::Mul,
                TokenKind::Slash => BinaryOp::Div,
                TokenKind::Percent => BinaryOp::Mod,
                _ => break,
            };
            self.next();
            let rhs = self.parse_unary()?;
            expr = Expr::Binary {
                op,
                left: Box::new(expr),
                right: Box::new(rhs),
            };
        }
        Ok(expr)
    }

    fn parse_unary(&mut self) -> Result<Expr, CError> {
        if self.peek_keyword("sizeof") {
            self.next();
            if self.peek_kind() == TokenKind::LParen && self.peek_next_is_type() {
                self.next();
                let ty = self.parse_type_no_name()?;
                self.expect(TokenKind::RParen, "expected ')'")?;
                return Ok(Expr::SizeofType(ty));
            }
            let expr = self.parse_unary()?;
            return Ok(Expr::SizeofExpr(Box::new(expr)));
        }
        if self.peek_kind() == TokenKind::LParen && self.peek_next_is_type() {
            self.next();
            let ty = self.parse_type_no_name()?;
            self.expect(TokenKind::RParen, "expected ')'")?;
            let expr = self.parse_unary()?;
            return Ok(Expr::Cast {
                ty,
                expr: Box::new(expr),
            });
        }
        let op = match self.peek_kind() {
            TokenKind::Minus => Some(UnaryOp::Neg),
            TokenKind::Bang => Some(UnaryOp::Not),
            TokenKind::Tilde => Some(UnaryOp::BitNot),
            TokenKind::Amp => Some(UnaryOp::Addr),
            TokenKind::Star => Some(UnaryOp::Deref),
            _ => None,
        };
        if let Some(op) = op {
            self.next();
            let expr = self.parse_unary()?;
            return Ok(Expr::Unary {
                op,
                expr: Box::new(expr),
            });
        }
        self.parse_postfix()
    }

    fn parse_postfix(&mut self) -> Result<Expr, CError> {
        let mut expr = self.parse_primary()?;
        loop {
            if self.peek_kind() == TokenKind::LParen {
                let name = match expr {
                    Expr::Var(ref n) => n.clone(),
                    _ => {
                        return Err(self.error_at(self.peek(), "invalid function call"));
                    }
                };
                self.next();
                let args = self.parse_call_args()?;
                self.expect(TokenKind::RParen, "expected ')'")?;
                expr = Expr::Call { name, args };
                continue;
            }
            if self.peek_kind() == TokenKind::LBracket {
                self.next();
                let index = self.parse_expr()?;
                self.expect(TokenKind::RBracket, "expected ']'")?;
                expr = Expr::Index {
                    base: Box::new(expr),
                    index: Box::new(index),
                };
                continue;
            }
            break;
        }
        Ok(expr)
    }

    fn parse_primary(&mut self) -> Result<Expr, CError> {
        match self.peek().kind.clone() {
            TokenKind::Number(value) => {
                self.next();
                Ok(Expr::Number(value))
            }
            TokenKind::Char(value) => {
                self.next();
                Ok(Expr::Char(value))
            }
            TokenKind::String(value) => {
                self.next();
                Ok(Expr::String(value))
            }
            TokenKind::Ident(name) => {
                self.next();
                Ok(Expr::Var(name))
            }
            TokenKind::LParen => {
                self.next();
                let expr = self.parse_expr()?;
                self.expect(TokenKind::RParen, "expected ')'")?;
                Ok(expr)
            }
            _ => Err(self.error_at(self.peek(), "expected expression")),
        }
    }

    fn parse_call_args(&mut self) -> Result<Vec<Expr>, CError> {
        let mut args = Vec::new();
        if self.peek_kind() == TokenKind::RParen {
            return Ok(args);
        }
        loop {
            args.push(self.parse_expr()?);
            if self.peek_kind() == TokenKind::Comma {
                self.next();
                continue;
            }
            break;
        }
        Ok(args)
    }

    fn parse_type_no_name(&mut self) -> Result<Type, CError> {
        let mut ty = self.parse_base_type()?;
        while self.peek_kind() == TokenKind::Star {
            self.next();
            ty = Type::Pointer(Box::new(ty));
        }
        Ok(ty)
    }

    fn parse_base_type(&mut self) -> Result<Type, CError> {
        let token = self.next();
        let kw = match &token.kind {
            TokenKind::Keyword(text) => text.as_str(),
            _ => return Err(self.error_at_code(&token, "E2001", "expected type")),
        };
        match kw {
            "int" => Ok(int_type()),
            "uint" => Ok(uint_type()),
            "char" => Ok(char_type()),
            "bool" => Ok(bool_type()),
            "void" => Ok(void_type()),
            "unsigned" => {
                if self.peek_keyword("int") {
                    self.next();
                    Ok(uint_type())
                } else if self.peek_keyword("char") {
                    self.next();
                    Ok(char_type())
                } else {
                    Ok(uint_type())
                }
            }
            "struct" => Err(self.error_at_code(&token, "E2008", "unsupported feature")),
            _ => Err(self.error_at_code(&token, "E2001", "unknown type")),
        }
    }

    fn parse_declarator(&mut self, mut ty: Type) -> Result<(Type, String), CError> {
        while self.peek_kind() == TokenKind::Star {
            self.next();
            ty = Type::Pointer(Box::new(ty));
        }
        let name = self.expect_ident("expected identifier")?;
        if self.peek_kind() == TokenKind::LBracket {
            self.next();
            let len = if self.peek_kind() == TokenKind::RBracket {
                0
            } else {
                let expr = self.parse_expr()?;
                eval_const_len(&expr).map_err(|err| {
                    CError::new(err.code, err.message).with_location(self.peek().line, self.peek().col)
                })?
            };
            self.expect(TokenKind::RBracket, "expected ']'")?;
            ty = Type::Array(Box::new(ty), len);
        }
        Ok((ty, name))
    }

    fn expect_ident(&mut self, msg: &str) -> Result<String, CError> {
        let token = self.next();
        match token.kind {
            TokenKind::Ident(name) => Ok(name),
            _ => Err(self.error_at(&token, msg)),
        }
    }

    fn expect(&mut self, kind: TokenKind, msg: &str) -> Result<(), CError> {
        let token = self.next();
        if token.kind == kind {
            Ok(())
        } else {
            Err(self.error_at(&token, msg))
        }
    }

    fn consume_keyword(&mut self, kw: &str) -> bool {
        if self.peek_keyword(kw) {
            self.next();
            true
        } else {
            false
        }
    }

    fn peek_keyword(&self, kw: &str) -> bool {
        matches!(&self.peek().kind, TokenKind::Keyword(k) if k == kw)
    }

    fn peek_is_type(&self) -> bool {
        matches!(
            &self.peek().kind,
            TokenKind::Keyword(k)
                if k == "int"
                    || k == "uint"
                    || k == "unsigned"
                    || k == "char"
                    || k == "bool"
                    || k == "void"
                    || k == "struct"
        )
    }

    fn peek_next_is_type(&self) -> bool {
        if self.pos + 1 >= self.tokens.len() {
            return false;
        }
        matches!(
            &self.tokens[self.pos + 1].kind,
            TokenKind::Keyword(k)
                if k == "int"
                    || k == "uint"
                    || k == "unsigned"
                    || k == "char"
                    || k == "bool"
                    || k == "void"
                    || k == "struct"
        )
    }

    fn peek_kind(&self) -> TokenKind {
        self.peek().kind.clone()
    }

    fn peek(&self) -> &Token {
        &self.tokens[self.pos]
    }

    fn next(&mut self) -> Token {
        let token = self.tokens[self.pos].clone();
        if !self.is_eof() {
            self.pos += 1;
        }
        token
    }

    fn is_eof(&self) -> bool {
        matches!(self.tokens[self.pos].kind, TokenKind::Eof)
    }

    fn error_at(&self, token: &Token, msg: &str) -> CError {
        CError::new("E2008", msg).with_location(token.line, token.col)
    }

    fn error_at_code(&self, token: &Token, code: &str, msg: &str) -> CError {
        CError::new(code, msg).with_location(token.line, token.col)
    }
}

struct ConstErr {
    code: &'static str,
    message: &'static str,
}

fn eval_const_len(expr: &Expr) -> Result<usize, ConstErr> {
    match expr {
        Expr::Number(NumberLit { value, .. }) => Ok(*value as usize),
        Expr::Unary { op: UnaryOp::Neg, expr } => {
            if let Expr::Number(NumberLit { value, .. }) = &**expr {
                let v = (*value as i64).wrapping_neg();
                if v < 0 {
                    return Err(ConstErr {
                        code: "E2006",
                        message: "array size must be positive",
                    });
                }
                Ok(v as usize)
            } else {
                Err(ConstErr {
                    code: "E2006",
                    message: "array size must be constant",
                })
            }
        }
        _ => Err(ConstErr {
            code: "E2006",
            message: "array size must be constant",
        }),
    }
}
