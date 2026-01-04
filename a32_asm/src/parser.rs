use crate::ast::{Directive, Expr, Instruction, Item, Label, Operand, Program, ShiftKind};
use crate::error::AsmError;
use crate::lexer::{Lexer, Token, TokenKind};
use a32_core::isa::Reg;

pub fn parse_program(input: &str) -> Result<Program, AsmError> {
    let tokens = Lexer::new(input).tokenize()?;
    let mut parser = Parser::new(tokens);
    parser.parse_program()
}

pub fn parse_expr_str(input: &str) -> Result<Expr, AsmError> {
    let tokens = Lexer::new(input).tokenize()?;
    let mut parser = Parser::new(tokens);
    let expr = parser.parse_expr()?;
    parser.consume_newlines();
    if !parser.is_eof() {
        let token = parser.peek();
        return Err(parser.error_at(token, "unexpected token"));
    }
    Ok(expr)
}

struct Parser {
    tokens: Vec<Token>,
    pos: usize,
}

impl Parser {
    fn new(tokens: Vec<Token>) -> Self {
        Self { tokens, pos: 0 }
    }

    fn parse_program(&mut self) -> Result<Program, AsmError> {
        let mut items = Vec::new();
        while !self.is_eof() {
            self.consume_newlines();
            if self.is_eof() {
                break;
            }
            let mut line_items = self.parse_line_items()?;
            items.append(&mut line_items);
            self.consume_newlines();
        }
        Ok(Program { items })
    }

    fn parse_line_items(&mut self) -> Result<Vec<Item>, AsmError> {
        let mut items = Vec::new();
        if self.is_eof() || self.peek_is_newline() {
            return Ok(items);
        }
        if self.peek_is_ident() && self.peek_next_is_colon() {
            let label = self.parse_label()?;
            items.push(Item::Label(label));
            if self.peek_is_newline() || self.is_eof() {
                return Ok(items);
            }
        }
        if self.peek_is_dot() {
            let directive = self.parse_directive()?;
            items.push(Item::Directive(directive));
        } else if self.peek_is_ident() {
            let inst = self.parse_instruction()?;
            items.push(Item::Instruction(inst));
        } else {
            let token = self.peek();
            return Err(self.error_at(token, "unexpected token"));
        }
        Ok(items)
    }

    fn parse_label(&mut self) -> Result<Label, AsmError> {
        let name = match self.next().kind.clone() {
            TokenKind::Ident(name) => name,
            _ => return Err(self.error_at(self.peek(), "expected label")),
        };
        self.expect_punct(TokenKind::Colon, "expected ':' after label")?;
        Ok(Label { name })
    }

    fn parse_directive(&mut self) -> Result<Directive, AsmError> {
        self.expect_punct(TokenKind::Dot, "expected '.' for directive")?;
        let name = match self.next().kind.clone() {
            TokenKind::Ident(name) => name.to_ascii_lowercase(),
            _ => return Err(self.error_at(self.peek(), "expected directive name")),
        };
        let directive = match name.as_str() {
            "text" => Directive::Text,
            "data" => Directive::Data,
            "bss" => Directive::Bss,
            "rodata" => Directive::RoData,
            "global" | "globl" => {
                let ident = self.expect_ident("expected symbol after .global")?;
                Directive::Global(ident)
            }
            "word" => {
                let expr = self.parse_expr()?;
                Directive::Word(expr)
            }
            "byte" => {
                let expr = self.parse_expr()?;
                Directive::Byte(expr)
            }
            "space" => {
                let expr = self.parse_expr()?;
                Directive::Space(expr)
            }
            "align" => {
                let expr = self.parse_expr()?;
                Directive::Align(expr)
            }
            "org" => {
                let expr = self.parse_expr()?;
                Directive::Org(expr)
            }
            "ascii" => {
                let value = self.expect_string("expected string after .ascii")?;
                Directive::Ascii(value)
            }
            "asciz" => {
                let value = self.expect_string("expected string after .asciz")?;
                Directive::Asciz(value)
            }
            "pool" => Directive::Pool,
            "ltorg" => Directive::LtOrg,
            _ => return Err(self.error_at(self.peek(), "unknown directive")),
        };
        Ok(directive)
    }

    fn parse_instruction(&mut self) -> Result<Instruction, AsmError> {
        let name = match self.next().kind.clone() {
            TokenKind::Ident(name) => name,
            _ => return Err(self.error_at(self.peek(), "expected instruction")),
        };
        let mut parts = name.split('.');
        let mnemonic = parts.next().unwrap_or("").to_ascii_uppercase();
        let suffixes = parts.map(|p| p.to_ascii_uppercase()).collect::<Vec<_>>();
        let operands = self.parse_operands()?;
        Ok(Instruction {
            mnemonic,
            suffixes,
            operands,
        })
    }

    fn parse_operands(&mut self) -> Result<Vec<Operand>, AsmError> {
        let mut operands = Vec::new();
        if self.is_eof() || self.peek_is_newline() {
            return Ok(operands);
        }
        loop {
            operands.push(self.parse_operand()?);
            if self.peek_is_newline() || self.is_eof() {
                break;
            }
            if self.peek_is_comma() {
                self.next();
            } else {
                break;
            }
        }
        Ok(operands)
    }

    fn parse_operand(&mut self) -> Result<Operand, AsmError> {
        if self.peek_is_lbracket() {
            return self.parse_mem_operand();
        }
        if self.peek_is_hash() {
            self.next();
            let expr = self.parse_expr()?;
            return Ok(Operand::Imm(expr));
        }
        if self.peek_is_equal() {
            self.next();
            let expr = self.parse_expr()?;
            return Ok(Operand::Literal(expr));
        }
        if let TokenKind::Ident(name) = self.peek().kind.clone() {
            let upper = name.to_ascii_uppercase();
            if let Some(kind) = shift_kind_from_str(&upper) {
                self.next();
                if !self.peek_is_hash() {
                    return Err(self.error_at(self.peek(), "expected '#' for shift amount"));
                }
                self.next();
                let expr = self.parse_expr()?;
                return Ok(Operand::Shift { kind, amount: expr });
            }
            if let Some(reg) = parse_reg_name(&name) {
                self.next();
                return Ok(Operand::Reg(reg));
            }
        }
        let expr = self.parse_expr()?;
        Ok(Operand::Expr(expr))
    }

    fn parse_mem_operand(&mut self) -> Result<Operand, AsmError> {
        self.expect_punct(TokenKind::LBracket, "expected '['")?;
        let base_name = self.expect_ident("expected base register")?;
        let base = parse_reg_name(&base_name)
            .ok_or_else(|| self.error_at(self.peek(), "invalid base register"))?;
        let mut offset = None;
        if self.peek_is_comma() {
            self.next();
            if self.peek_is_hash() {
                self.next();
                let expr = self.parse_expr()?;
                offset = Some(expr);
            } else {
                return Err(self.error_at(self.peek(), "expected '#' for offset"));
            }
        }
        self.expect_punct(TokenKind::RBracket, "expected ']' after memory operand")?;
        let mut writeback = false;
        if self.peek_is_bang() {
            self.next();
            writeback = true;
        }
        Ok(Operand::Mem {
            base,
            offset,
            writeback,
        })
    }

    fn expect_ident(&mut self, msg: &str) -> Result<String, AsmError> {
        match self.next().kind.clone() {
            TokenKind::Ident(name) => Ok(name),
            _ => Err(self.error_at(self.peek(), msg)),
        }
    }

    fn expect_string(&mut self, msg: &str) -> Result<String, AsmError> {
        match self.next().kind.clone() {
            TokenKind::StringLit(value) => Ok(value),
            _ => Err(self.error_at(self.peek(), msg)),
        }
    }

    fn expect_punct(&mut self, kind: TokenKind, msg: &str) -> Result<(), AsmError> {
        if self.peek().kind == kind {
            self.next();
            Ok(())
        } else {
            Err(self.error_at(self.peek(), msg))
        }
    }

    fn consume_newlines(&mut self) {
        while self.peek_is_newline() {
            self.next();
        }
    }

    fn peek(&self) -> &Token {
        self.tokens.get(self.pos).unwrap_or_else(|| self.tokens.last().unwrap())
    }

    fn next(&mut self) -> Token {
        let token = self.peek().clone();
        if !self.is_eof() {
            self.pos += 1;
        }
        token
    }

    fn is_eof(&self) -> bool {
        matches!(self.peek().kind, TokenKind::Eof)
    }

    fn peek_is_newline(&self) -> bool {
        matches!(self.peek().kind, TokenKind::Newline)
    }

    fn peek_is_ident(&self) -> bool {
        matches!(self.peek().kind, TokenKind::Ident(_))
    }

    fn peek_is_dot(&self) -> bool {
        matches!(self.peek().kind, TokenKind::Dot)
    }

    fn peek_next_is_colon(&self) -> bool {
        if self.pos + 1 >= self.tokens.len() {
            return false;
        }
        matches!(self.tokens[self.pos + 1].kind, TokenKind::Colon)
    }

    fn peek_is_comma(&self) -> bool {
        matches!(self.peek().kind, TokenKind::Comma)
    }

    fn peek_is_hash(&self) -> bool {
        matches!(self.peek().kind, TokenKind::Hash)
    }

    fn peek_is_lbracket(&self) -> bool {
        matches!(self.peek().kind, TokenKind::LBracket)
    }

    fn peek_is_equal(&self) -> bool {
        matches!(self.peek().kind, TokenKind::Equal)
    }

    fn peek_is_bang(&self) -> bool {
        matches!(self.peek().kind, TokenKind::Bang)
    }

    fn error_at(&self, token: &Token, msg: &str) -> AsmError {
        AsmError::new(msg.to_string()).with_location(token.line, token.col)
    }

    fn parse_expr(&mut self) -> Result<Expr, AsmError> {
        self.parse_add_sub()
    }

    fn parse_add_sub(&mut self) -> Result<Expr, AsmError> {
        let mut expr = self.parse_term()?;
        loop {
            if matches!(self.peek().kind, TokenKind::Plus) {
                self.next();
                let rhs = self.parse_term()?;
                expr = Expr::Add(Box::new(expr), Box::new(rhs));
                continue;
            }
            if matches!(self.peek().kind, TokenKind::Minus) {
                self.next();
                let rhs = self.parse_term()?;
                expr = Expr::Sub(Box::new(expr), Box::new(rhs));
                continue;
            }
            break;
        }
        Ok(expr)
    }

    fn parse_term(&mut self) -> Result<Expr, AsmError> {
        match self.peek().kind.clone() {
            TokenKind::Minus => {
                self.next();
                let inner = self.parse_term()?;
                Ok(Expr::UnaryMinus(Box::new(inner)))
            }
            TokenKind::Number(value) => {
                self.next();
                Ok(Expr::Number(value))
            }
            TokenKind::Ident(name) => {
                self.next();
                Ok(Expr::Symbol(name))
            }
            TokenKind::LParen => {
                self.next();
                let expr = self.parse_expr()?;
                self.expect_punct(TokenKind::RParen, "expected ')'")?;
                Ok(expr)
            }
            _ => Err(self.error_at(self.peek(), "expected expression")),
        }
    }
}

fn parse_reg_name(name: &str) -> Option<Reg> {
    let upper = name.to_ascii_uppercase();
    match upper.as_str() {
        "SP" => return Some(Reg::SP),
        "LR" => return Some(Reg::LR),
        "PC" => return Some(Reg::PC),
        _ => {}
    }
    if upper.len() < 2 || !upper.starts_with('R') {
        return None;
    }
    let num_str = &upper[1..];
    let num = num_str.parse::<u8>().ok()?;
    Reg::from_u8(num)
}

fn shift_kind_from_str(s: &str) -> Option<ShiftKind> {
    match s {
        "LSL" => Some(ShiftKind::Lsl),
        "LSR" => Some(ShiftKind::Lsr),
        "ASR" => Some(ShiftKind::Asr),
        "ROR" => Some(ShiftKind::Ror),
        _ => None,
    }
}
