use crate::ast::*;
use crate::error::{Error, Span};
use crate::lexer::{Lexer, Token, TokenKind};

pub fn parse_str(src: &str) -> Result<Design, Error> {
    let mut lexer = Lexer::new(src);
    let tokens = lexer.lex()?;
    let mut parser = Parser::new(tokens);
    parser.parse_design()
}

struct Parser {
    tokens: Vec<Token>,
    idx: usize,
}

impl Parser {
    fn new(tokens: Vec<Token>) -> Self {
        Self { tokens, idx: 0 }
    }

    fn parse_design(&mut self) -> Result<Design, Error> {
        let mut entities = Vec::new();
        let mut architectures = Vec::new();
        while !self.check(TokenKind::Eof) {
            if self.check(TokenKind::KwEntity) {
                entities.push(self.parse_entity()?);
            } else if self.check(TokenKind::KwArchitecture) {
                architectures.push(self.parse_architecture()?);
            } else {
                return Err(self.err_here("expected entity or architecture"));
            }
        }
        Ok(Design {
            entities,
            architectures,
        })
    }

    fn parse_entity(&mut self) -> Result<Entity, Error> {
        let span = self.current_span();
        self.expect(TokenKind::KwEntity)?;
        let name = self.expect_ident()?;
        self.expect(TokenKind::KwIs)?;
        let ports = self.parse_port_clause()?;
        self.expect(TokenKind::KwEnd)?;
        self.expect(TokenKind::KwEntity)?;
        if self.peek_ident() {
            self.bump();
        }
        self.expect(TokenKind::Semicolon)?;
        Ok(Entity {
            name,
            ports,
            span: Some(span),
        })
    }

    fn parse_port_clause(&mut self) -> Result<Vec<Port>, Error> {
        self.expect(TokenKind::KwPort)?;
        self.expect(TokenKind::LParen)?;
        let mut ports = Vec::new();
        loop {
            let mut items = self.parse_port_item()?;
            ports.append(&mut items);
            if self.check(TokenKind::Semicolon) {
                self.bump();
                if self.check(TokenKind::RParen) {
                    break;
                }
            } else {
                break;
            }
        }
        self.expect(TokenKind::RParen)?;
        self.expect(TokenKind::Semicolon)?;
        Ok(ports)
    }

    fn parse_port_item(&mut self) -> Result<Vec<Port>, Error> {
        let span = self.current_span();
        let names = self.parse_ident_list()?;
        self.expect(TokenKind::Colon)?;
        let dir = match self.bump().kind {
            TokenKind::KwIn => Direction::In,
            TokenKind::KwOut => Direction::Out,
            _ => return Err(self.err_here("expected port direction")),
        };
        let ty = self.parse_type()?;
        let ports = names
            .into_iter()
            .map(|name| Port {
                name,
                dir: dir.clone(),
                ty: ty.clone(),
                span: Some(span),
            })
            .collect();
        Ok(ports)
    }

    fn parse_type(&mut self) -> Result<Type, Error> {
        if self.check(TokenKind::KwBit) {
            self.bump();
            return Ok(Type::Bit);
        }
        if self.check(TokenKind::KwBits) {
            self.bump();
            self.expect(TokenKind::LParen)?;
            let (msb, lsb, dir) = self.parse_range()?;
            self.expect(TokenKind::RParen)?;
            return Ok(Type::Bits { msb, lsb, dir });
        }
        Err(self.err_here("expected type"))
    }

    fn parse_range(&mut self) -> Result<(i64, i64, RangeDir), Error> {
        let left = self.parse_int_lit()?;
        let dir = if self.check(TokenKind::KwDownto) {
            self.bump();
            RangeDir::Downto
        } else if self.check(TokenKind::KwTo) {
            self.bump();
            RangeDir::To
        } else {
            return Err(self.err_here("expected range direction"));
        };
        let right = self.parse_int_lit()?;
        Ok((left, right, dir))
    }

    fn parse_architecture(&mut self) -> Result<Architecture, Error> {
        let span = self.current_span();
        self.expect(TokenKind::KwArchitecture)?;
        let name = self.expect_ident()?;
        self.expect(TokenKind::KwOf)?;
        let entity = self.expect_ident()?;
        self.expect(TokenKind::KwIs)?;
        let mut signals = Vec::new();
        let mut components = Vec::new();
        while !self.check(TokenKind::KwBegin) {
            if self.check(TokenKind::KwSignal) {
                signals.push(self.parse_signal_decl()?);
            } else if self.check(TokenKind::KwComponent) {
                components.push(self.parse_component_decl()?);
            } else {
                return Err(self.err_here("expected signal or component declaration"));
            }
        }
        self.expect(TokenKind::KwBegin)?;
        let mut stmts = Vec::new();
        while !self.check(TokenKind::KwEnd) {
            stmts.push(self.parse_concurrent_stmt()?);
        }
        self.expect(TokenKind::KwEnd)?;
        self.expect(TokenKind::KwArchitecture)?;
        if self.peek_ident() {
            self.bump();
        }
        self.expect(TokenKind::Semicolon)?;
        Ok(Architecture {
            name,
            entity,
            signals,
            components,
            stmts,
            span: Some(span),
        })
    }

    fn parse_signal_decl(&mut self) -> Result<SignalDecl, Error> {
        let span = self.current_span();
        self.expect(TokenKind::KwSignal)?;
        let names = self.parse_ident_list()?;
        self.expect(TokenKind::Colon)?;
        let ty = self.parse_type()?;
        let init = if self.check(TokenKind::ColonEq) {
            self.bump();
            Some(self.parse_expr()?)
        } else {
            None
        };
        self.expect(TokenKind::Semicolon)?;
        Ok(SignalDecl {
            names,
            ty,
            init,
            span: Some(span),
        })
    }

    fn parse_component_decl(&mut self) -> Result<ComponentDecl, Error> {
        let span = self.current_span();
        self.expect(TokenKind::KwComponent)?;
        let name = self.expect_ident()?;
        let ports = self.parse_port_clause()?;
        self.expect(TokenKind::KwEnd)?;
        self.expect(TokenKind::KwComponent)?;
        self.expect(TokenKind::Semicolon)?;
        Ok(ComponentDecl {
            name,
            ports,
            span: Some(span),
        })
    }

    fn parse_concurrent_stmt(&mut self) -> Result<ConcurrentStmt, Error> {
        if self.check(TokenKind::KwProcess) {
            return Ok(ConcurrentStmt::Process(self.parse_process_stmt()?));
        }
        if self.peek_ident() && self.peek_next_is(TokenKind::Colon) {
            return Ok(ConcurrentStmt::Instance(self.parse_instance_stmt()?));
        }
        Ok(ConcurrentStmt::Assign(self.parse_assign_stmt()?))
    }

    fn parse_instance_stmt(&mut self) -> Result<InstanceStmt, Error> {
        let span = self.current_span();
        let name = self.expect_ident()?;
        self.expect(TokenKind::Colon)?;
        let entity = self.expect_ident()?;
        self.expect(TokenKind::KwPort)?;
        self.expect(TokenKind::KwMap)?;
        self.expect(TokenKind::LParen)?;
        let mut port_map = Vec::new();
        loop {
            let assoc = self.parse_assoc()?;
            port_map.push(assoc);
            if self.check(TokenKind::Comma) {
                self.bump();
                if self.check(TokenKind::RParen) {
                    break;
                }
            } else {
                break;
            }
        }
        self.expect(TokenKind::RParen)?;
        self.expect(TokenKind::Semicolon)?;
        Ok(InstanceStmt {
            name,
            entity,
            port_map,
            span: Some(span),
        })
    }

    fn parse_assoc(&mut self) -> Result<Assoc, Error> {
        let span = self.current_span();
        let port = self.expect_ident()?;
        self.expect(TokenKind::Arrow)?;
        let expr = self.parse_expr()?;
        Ok(Assoc {
            port,
            expr,
            span: Some(span),
        })
    }

    fn parse_process_stmt(&mut self) -> Result<ProcessStmt, Error> {
        let span = self.current_span();
        self.expect(TokenKind::KwProcess)?;
        self.expect(TokenKind::LParen)?;
        let clk = self.expect_ident()?;
        self.expect(TokenKind::RParen)?;
        self.expect(TokenKind::KwBegin)?;
        let mut stmts = Vec::new();
        while !self.check(TokenKind::KwEnd) {
            stmts.push(self.parse_seq_stmt()?);
        }
        self.expect(TokenKind::KwEnd)?;
        self.expect(TokenKind::KwProcess)?;
        self.expect(TokenKind::Semicolon)?;
        Ok(ProcessStmt {
            clk,
            stmts,
            span: Some(span),
        })
    }

    fn parse_seq_stmt(&mut self) -> Result<SeqStmt, Error> {
        if self.check(TokenKind::KwIf) {
            return Ok(SeqStmt::If(self.parse_if_stmt()?));
        }
        if self.check(TokenKind::KwCase) {
            return Ok(SeqStmt::Case(self.parse_case_stmt()?));
        }
        Ok(SeqStmt::Assign(self.parse_assign_stmt()?))
    }

    fn parse_if_stmt(&mut self) -> Result<IfStmt, Error> {
        let span = self.current_span();
        self.expect(TokenKind::KwIf)?;
        let cond = self.parse_expr()?;
        self.expect(TokenKind::KwThen)?;
        let then_stmts = self.parse_seq_block_until(&[TokenKind::KwElsif, TokenKind::KwElse, TokenKind::KwEnd])?;
        let mut elsif = Vec::new();
        while self.check(TokenKind::KwElsif) {
            self.bump();
            let c = self.parse_expr()?;
            self.expect(TokenKind::KwThen)?;
            let stmts = self.parse_seq_block_until(&[TokenKind::KwElsif, TokenKind::KwElse, TokenKind::KwEnd])?;
            elsif.push((c, stmts));
        }
        let else_stmts = if self.check(TokenKind::KwElse) {
            self.bump();
            self.parse_seq_block_until(&[TokenKind::KwEnd])?
        } else {
            Vec::new()
        };
        self.expect(TokenKind::KwEnd)?;
        self.expect(TokenKind::KwIf)?;
        self.expect(TokenKind::Semicolon)?;
        Ok(IfStmt {
            cond,
            then_stmts,
            elsif,
            else_stmts,
            span: Some(span),
        })
    }

    fn parse_case_stmt(&mut self) -> Result<CaseStmt, Error> {
        let span = self.current_span();
        self.expect(TokenKind::KwCase)?;
        let expr = self.parse_expr()?;
        self.expect(TokenKind::KwIs)?;
        let mut arms = Vec::new();
        while self.check(TokenKind::KwWhen) {
            self.bump();
            let choice = self.parse_case_choice()?;
            self.expect(TokenKind::Arrow)?;
            let stmts = self.parse_seq_block_until(&[TokenKind::KwWhen, TokenKind::KwEnd])?;
            arms.push((choice, stmts));
        }
        self.expect(TokenKind::KwEnd)?;
        self.expect(TokenKind::KwCase)?;
        self.expect(TokenKind::Semicolon)?;
        Ok(CaseStmt {
            expr,
            arms,
            span: Some(span),
        })
    }

    fn parse_case_choice(&mut self) -> Result<CaseChoice, Error> {
        if self.check(TokenKind::KwOthers) {
            self.bump();
            return Ok(CaseChoice::Others);
        }
        if self.peek_ident() {
            let ident = self.expect_ident()?;
            return Ok(CaseChoice::Ident(ident));
        }
        let lit = self.parse_literal()?;
        Ok(CaseChoice::Literal(lit))
    }

    fn parse_assign_stmt(&mut self) -> Result<AssignStmt, Error> {
        let span = self.current_span();
        let target = self.parse_target()?;
        self.expect(TokenKind::Le)?; // <=
        let expr = self.parse_expr()?;
        self.expect(TokenKind::Semicolon)?;
        Ok(AssignStmt {
            target,
            expr,
            span: Some(span),
        })
    }

    fn parse_target(&mut self) -> Result<Target, Error> {
        let span = self.current_span();
        let name = self.expect_ident()?;
        let sel = if self.check(TokenKind::LParen) {
            self.bump();
            let first = self.parse_int_lit()?;
            if self.check(TokenKind::KwDownto) || self.check(TokenKind::KwTo) {
                let dir = if self.check(TokenKind::KwDownto) {
                    self.bump();
                    RangeDir::Downto
                } else {
                    self.bump();
                    RangeDir::To
                };
                let second = self.parse_int_lit()?;
                self.expect(TokenKind::RParen)?;
                Some(Selector::Range {
                    msb: first,
                    lsb: second,
                    dir,
                })
            } else {
                self.expect(TokenKind::RParen)?;
                Some(Selector::Index(first))
            }
        } else {
            None
        };
        Ok(Target {
            name,
            sel,
            span: Some(span),
        })
    }

    fn parse_expr(&mut self) -> Result<Expr, Error> {
        self.parse_rel_expr()
    }

    fn parse_rel_expr(&mut self) -> Result<Expr, Error> {
        let mut expr = self.parse_add_expr()?;
        if self.is_rel_op() {
            let op = match self.bump().kind {
                TokenKind::Eq => BinaryOp::Eq,
                TokenKind::Ne => BinaryOp::Ne,
                TokenKind::Lt => BinaryOp::Lt,
                TokenKind::Le => BinaryOp::Le,
                TokenKind::Gt => BinaryOp::Gt,
                TokenKind::Ge => BinaryOp::Ge,
                _ => return Err(self.err_here("expected rel op")),
            };
            let right = self.parse_add_expr()?;
            expr = Expr::Binary {
                op,
                left: Box::new(expr),
                right: Box::new(right),
            };
        }
        Ok(expr)
    }

    fn parse_add_expr(&mut self) -> Result<Expr, Error> {
        let mut expr = self.parse_concat_expr()?;
        loop {
            let op = if self.check(TokenKind::Plus) {
                BinaryOp::Add
            } else if self.check(TokenKind::Minus) {
                BinaryOp::Sub
            } else {
                break;
            };
            self.bump();
            let rhs = self.parse_concat_expr()?;
            expr = Expr::Binary {
                op,
                left: Box::new(expr),
                right: Box::new(rhs),
            };
        }
        Ok(expr)
    }

    fn parse_concat_expr(&mut self) -> Result<Expr, Error> {
        let mut expr = self.parse_shift_expr()?;
        while self.check(TokenKind::Amp) {
            self.bump();
            let rhs = self.parse_shift_expr()?;
            expr = Expr::Binary {
                op: BinaryOp::Concat,
                left: Box::new(expr),
                right: Box::new(rhs),
            };
        }
        Ok(expr)
    }

    fn parse_shift_expr(&mut self) -> Result<Expr, Error> {
        let mut expr = self.parse_logic_expr()?;
        loop {
            let op = if self.check(TokenKind::Shl) {
                BinaryOp::Shl
            } else if self.check(TokenKind::Shr) {
                BinaryOp::Shr
            } else {
                break;
            };
            self.bump();
            let rhs = self.parse_logic_expr()?;
            expr = Expr::Binary {
                op,
                left: Box::new(expr),
                right: Box::new(rhs),
            };
        }
        Ok(expr)
    }

    fn parse_logic_expr(&mut self) -> Result<Expr, Error> {
        let mut expr = self.parse_xor_expr()?;
        loop {
            let op = if self.check(TokenKind::KwAnd) {
                BinaryOp::And
            } else if self.check(TokenKind::KwOr) {
                BinaryOp::Or
            } else {
                break;
            };
            self.bump();
            let rhs = self.parse_xor_expr()?;
            expr = Expr::Binary {
                op,
                left: Box::new(expr),
                right: Box::new(rhs),
            };
        }
        Ok(expr)
    }

    fn parse_xor_expr(&mut self) -> Result<Expr, Error> {
        let mut expr = self.parse_unary_expr()?;
        while self.check(TokenKind::KwXor) {
            self.bump();
            let rhs = self.parse_unary_expr()?;
            expr = Expr::Binary {
                op: BinaryOp::Xor,
                left: Box::new(expr),
                right: Box::new(rhs),
            };
        }
        Ok(expr)
    }

    fn parse_unary_expr(&mut self) -> Result<Expr, Error> {
        if self.check(TokenKind::KwNot) {
            self.bump();
            let expr = self.parse_unary_expr()?;
            return Ok(Expr::Unary {
                op: UnaryOp::Not,
                expr: Box::new(expr),
            });
        }
        if self.check(TokenKind::Minus) {
            self.bump();
            let expr = self.parse_unary_expr()?;
            return Ok(Expr::Unary {
                op: UnaryOp::Neg,
                expr: Box::new(expr),
            });
        }
        self.parse_primary()
    }

    fn parse_primary(&mut self) -> Result<Expr, Error> {
        if self.check(TokenKind::LParen) {
            self.bump();
            let expr = self.parse_expr()?;
            self.expect(TokenKind::RParen)?;
            return Ok(expr);
        }
        if self.is_literal_start() {
            let lit = self.parse_literal()?;
            return Ok(Expr::Literal(lit));
        }
        if self.check(TokenKind::KwRisingEdge) {
            return self.parse_call("rising_edge");
        }
        if self.peek_ident() {
            let ident = self.expect_ident()?;
            if self.check(TokenKind::LParen) {
                if ident.eq_ignore_ascii_case("resize") || ident.eq_ignore_ascii_case("sresize") {
                    return self.parse_call(&ident);
                }
                let sel = self.parse_selector()?;
                return Ok(Expr::Target(Target {
                    name: ident,
                    sel,
                    span: None,
                }));
            }
            return Ok(Expr::Target(Target {
                name: ident,
                sel: None,
                span: None,
            }));
        }
        Err(self.err_here("unexpected token in expression"))
    }

    fn parse_call(&mut self, name: &str) -> Result<Expr, Error> {
        if name.eq_ignore_ascii_case("rising_edge") {
            self.expect(TokenKind::KwRisingEdge)?;
        }
        self.expect(TokenKind::LParen)?;
        let mut args = Vec::new();
        if !self.check(TokenKind::RParen) {
            loop {
                args.push(self.parse_expr()?);
                if self.check(TokenKind::Comma) {
                    self.bump();
                    continue;
                }
                break;
            }
        }
        self.expect(TokenKind::RParen)?;
        Ok(Expr::Call {
            name: name.to_string(),
            args,
        })
    }

    fn parse_selector(&mut self) -> Result<Option<Selector>, Error> {
        self.expect(TokenKind::LParen)?;
        let first = self.parse_int_lit()?;
        let sel = if self.check(TokenKind::KwDownto) || self.check(TokenKind::KwTo) {
            let dir = if self.check(TokenKind::KwDownto) {
                self.bump();
                RangeDir::Downto
            } else {
                self.bump();
                RangeDir::To
            };
            let second = self.parse_int_lit()?;
            self.expect(TokenKind::RParen)?;
            Some(Selector::Range {
                msb: first,
                lsb: second,
                dir,
            })
        } else {
            self.expect(TokenKind::RParen)?;
            Some(Selector::Index(first))
        };
        Ok(sel)
    }

    fn parse_literal(&mut self) -> Result<Literal, Error> {
        let span = self.current_span();
        let tok = self.bump();
        match tok.kind {
            TokenKind::BitLit(b) => Ok(Literal::Bit(b)),
            TokenKind::BitVecLit { base, digits } => Ok(Literal::Bits(digits, base)),
            TokenKind::Int(v) => Ok(Literal::Int(v)),
            _ => Err(Error::with_span("expected literal", span)),
        }
    }

    fn parse_int_lit(&mut self) -> Result<i64, Error> {
        let span = self.current_span();
        let tok = self.bump();
        match tok.kind {
            TokenKind::Int(v) => Ok(v),
            TokenKind::Minus => {
                let val = self.parse_int_lit()?;
                Ok(-val)
            }
            _ => Err(Error::with_span("expected integer", span)),
        }
    }

    fn parse_ident_list(&mut self) -> Result<Vec<String>, Error> {
        let mut names = Vec::new();
        names.push(self.expect_ident()?);
        while self.check(TokenKind::Comma) {
            self.bump();
            names.push(self.expect_ident()?);
        }
        Ok(names)
    }

    fn parse_seq_block_until(&mut self, end_tokens: &[TokenKind]) -> Result<Vec<SeqStmt>, Error> {
        let mut stmts = Vec::new();
        while !end_tokens.iter().any(|k| self.check((*k).clone())) {
            stmts.push(self.parse_seq_stmt()?);
        }
        Ok(stmts)
    }

    fn is_literal_start(&self) -> bool {
        matches!(
            self.peek().kind,
            TokenKind::BitLit(_) | TokenKind::BitVecLit { .. } | TokenKind::Int(_)
        )
    }

    fn is_rel_op(&self) -> bool {
        matches!(
            self.peek().kind,
            TokenKind::Eq
                | TokenKind::Ne
                | TokenKind::Lt
                | TokenKind::Le
                | TokenKind::Gt
                | TokenKind::Ge
        )
    }

    fn expect(&mut self, kind: TokenKind) -> Result<(), Error> {
        if self.check(kind.clone()) {
            self.bump();
            Ok(())
        } else {
            Err(self.err_here("unexpected token"))
        }
    }

    fn expect_ident(&mut self) -> Result<String, Error> {
        let span = self.current_span();
        let tok = self.bump();
        match tok.kind {
            TokenKind::Ident(s) => Ok(s),
            _ => Err(Error::with_span("expected identifier", span)),
        }
    }

    fn peek_ident(&self) -> bool {
        matches!(self.peek().kind, TokenKind::Ident(_))
    }

    fn peek_next_is(&self, kind: TokenKind) -> bool {
        if self.idx + 1 >= self.tokens.len() {
            return false;
        }
        self.tokens[self.idx + 1].kind == kind
    }

    fn check(&self, kind: TokenKind) -> bool {
        self.peek().kind == kind
    }

    fn peek(&self) -> &Token {
        &self.tokens[self.idx]
    }

    fn bump(&mut self) -> Token {
        let tok = self.tokens[self.idx].clone();
        self.idx += 1;
        tok
    }

    fn current_span(&self) -> Span {
        self.peek().span
    }

    fn err_here(&self, msg: &str) -> Error {
        Error::with_span(msg, self.current_span())
    }
}
