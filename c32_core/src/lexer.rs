use crate::ast::NumberLit;
use crate::error::CError;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TokenKind {
    Ident(String),
    Number(NumberLit),
    Char(u8),
    String(String),
    Keyword(String),
    LParen,
    RParen,
    LBrace,
    RBrace,
    LBracket,
    RBracket,
    Comma,
    Semicolon,
    Plus,
    Minus,
    Star,
    Slash,
    Percent,
    Amp,
    Pipe,
    Caret,
    Tilde,
    Bang,
    Assign,
    EqEq,
    NotEq,
    Lt,
    LtEq,
    Gt,
    GtEq,
    AmpAmp,
    PipePipe,
    Shl,
    Shr,
    Dot,
    Arrow,
    Eof,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Token {
    pub kind: TokenKind,
    pub line: usize,
    pub col: usize,
}

pub struct Lexer {
    input: Vec<char>,
    idx: usize,
    line: usize,
    col: usize,
}

impl Lexer {
    pub fn new(input: &str) -> Self {
        Self {
            input: input.chars().collect(),
            idx: 0,
            line: 1,
            col: 1,
        }
    }

    pub fn tokenize(mut self) -> Result<Vec<Token>, CError> {
        let mut out = Vec::new();
        loop {
            let token = self.next_token()?;
            let is_eof = matches!(token.kind, TokenKind::Eof);
            out.push(token);
            if is_eof {
                break;
            }
        }
        Ok(out)
    }

    fn next_token(&mut self) -> Result<Token, CError> {
        self.skip_whitespace_and_comments()?;
        if self.idx >= self.input.len() {
            return Ok(self.token(TokenKind::Eof));
        }
        let ch = self.peek();
        let token = match ch {
            '(' => {
                self.advance();
                self.token(TokenKind::LParen)
            }
            ')' => {
                self.advance();
                self.token(TokenKind::RParen)
            }
            '{' => {
                self.advance();
                self.token(TokenKind::LBrace)
            }
            '}' => {
                self.advance();
                self.token(TokenKind::RBrace)
            }
            '[' => {
                self.advance();
                self.token(TokenKind::LBracket)
            }
            ']' => {
                self.advance();
                self.token(TokenKind::RBracket)
            }
            ',' => {
                self.advance();
                self.token(TokenKind::Comma)
            }
            ';' => {
                self.advance();
                self.token(TokenKind::Semicolon)
            }
            '+' => {
                self.advance();
                self.token(TokenKind::Plus)
            }
            '-' => {
                if self.peek_next() == Some('>') {
                    self.advance();
                    self.advance();
                    self.token(TokenKind::Arrow)
                } else {
                    self.advance();
                    self.token(TokenKind::Minus)
                }
            }
            '.' => {
                self.advance();
                self.token(TokenKind::Dot)
            }
            '*' => {
                self.advance();
                self.token(TokenKind::Star)
            }
            '/' => {
                self.advance();
                self.token(TokenKind::Slash)
            }
            '%' => {
                self.advance();
                self.token(TokenKind::Percent)
            }
            '~' => {
                self.advance();
                self.token(TokenKind::Tilde)
            }
            '^' => {
                self.advance();
                self.token(TokenKind::Caret)
            }
            '&' => {
                if self.peek_next() == Some('&') {
                    self.advance();
                    self.advance();
                    self.token(TokenKind::AmpAmp)
                } else {
                    self.advance();
                    self.token(TokenKind::Amp)
                }
            }
            '|' => {
                if self.peek_next() == Some('|') {
                    self.advance();
                    self.advance();
                    self.token(TokenKind::PipePipe)
                } else {
                    self.advance();
                    self.token(TokenKind::Pipe)
                }
            }
            '!' => {
                if self.peek_next() == Some('=') {
                    self.advance();
                    self.advance();
                    self.token(TokenKind::NotEq)
                } else {
                    self.advance();
                    self.token(TokenKind::Bang)
                }
            }
            '=' => {
                if self.peek_next() == Some('=') {
                    self.advance();
                    self.advance();
                    self.token(TokenKind::EqEq)
                } else {
                    self.advance();
                    self.token(TokenKind::Assign)
                }
            }
            '<' => {
                if self.peek_next() == Some('=') {
                    self.advance();
                    self.advance();
                    self.token(TokenKind::LtEq)
                } else if self.peek_next() == Some('<') {
                    self.advance();
                    self.advance();
                    self.token(TokenKind::Shl)
                } else {
                    self.advance();
                    self.token(TokenKind::Lt)
                }
            }
            '>' => {
                if self.peek_next() == Some('=') {
                    self.advance();
                    self.advance();
                    self.token(TokenKind::GtEq)
                } else if self.peek_next() == Some('>') {
                    self.advance();
                    self.advance();
                    self.token(TokenKind::Shr)
                } else {
                    self.advance();
                    self.token(TokenKind::Gt)
                }
            }
            '\'' => {
                let (value, line, col) = self.lex_char()?;
                Token {
                    kind: TokenKind::Char(value),
                    line,
                    col,
                }
            }
            '"' => {
                let (value, line, col) = self.lex_string()?;
                Token {
                    kind: TokenKind::String(value),
                    line,
                    col,
                }
            }
            '0'..='9' => {
                let (value, line, col) = self.lex_number()?;
                Token {
                    kind: TokenKind::Number(value),
                    line,
                    col,
                }
            }
            _ if is_ident_start(ch) => {
                let (text, line, col) = self.lex_ident();
                let kind = if is_keyword(&text) {
                    TokenKind::Keyword(text)
                } else {
                    TokenKind::Ident(text)
                };
                Token { kind, line, col }
            }
            _ => {
                return Err(
                    CError::new("E2008", "unexpected character")
                        .with_location(self.line, self.col),
                );
            }
        };
        Ok(token)
    }

    fn skip_whitespace_and_comments(&mut self) -> Result<(), CError> {
        loop {
            let mut advanced = false;
            while self.idx < self.input.len() {
                let ch = self.peek();
                if ch == ' ' || ch == '\t' || ch == '\r' || ch == '\n' {
                    self.advance();
                    advanced = true;
                } else {
                    break;
                }
            }
            if self.idx + 1 < self.input.len() && self.peek() == '/' && self.peek_next() == Some('/') {
                self.skip_to_newline();
                continue;
            }
            if self.idx + 1 < self.input.len() && self.peek() == '/' && self.peek_next() == Some('*') {
                self.skip_block_comment()?;
                continue;
            }
            if !advanced {
                break;
            }
        }
        Ok(())
    }

    fn skip_to_newline(&mut self) {
        while self.idx < self.input.len() {
            if self.peek() == '\n' {
                return;
            }
            self.advance();
        }
    }

    fn skip_block_comment(&mut self) -> Result<(), CError> {
        let start_line = self.line;
        let start_col = self.col;
        self.advance();
        self.advance();
        while self.idx + 1 < self.input.len() {
            if self.peek() == '*' && self.peek_next() == Some('/') {
                self.advance();
                self.advance();
                return Ok(());
            }
            self.advance();
        }
        Err(CError::new("E2008", "unterminated comment").with_location(start_line, start_col))
    }

    fn lex_ident(&mut self) -> (String, usize, usize) {
        let line = self.line;
        let col = self.col;
        let mut out = String::new();
        while self.idx < self.input.len() {
            let ch = self.peek();
            if is_ident_continue(ch) {
                out.push(ch);
                self.advance();
            } else {
                break;
            }
        }
        (out, line, col)
    }

    fn lex_number(&mut self) -> Result<(NumberLit, usize, usize), CError> {
        let line = self.line;
        let col = self.col;
        let mut text = String::new();
        if self.peek() == '0' {
            text.push('0');
            self.advance();
            if matches!(self.peek(), 'x' | 'X' | 'b' | 'B') {
                text.push(self.peek());
                self.advance();
            }
        }
        while self.idx < self.input.len() {
            let ch = self.peek();
            if ch.is_ascii_hexdigit() {
                text.push(ch);
                self.advance();
            } else {
                break;
            }
        }
        let mut unsigned = false;
        if matches!(self.peek(), 'u' | 'U') {
            unsigned = true;
            self.advance();
        }
        let value = parse_number(&text)
            .map_err(|msg| CError::new("E2008", msg).with_location(line, col))?;
        Ok((NumberLit { value, unsigned }, line, col))
    }

    fn lex_char(&mut self) -> Result<(u8, usize, usize), CError> {
        let line = self.line;
        let col = self.col;
        self.advance();
        let value = match self.peek() {
            '\\' => {
                self.advance();
                let escaped = self.read_escape()?;
                escaped
            }
            '\'' => {
                return Err(CError::new("E2008", "empty char literal").with_location(line, col));
            }
            ch => {
                self.advance();
                ch as u8
            }
        };
        if self.peek() != '\'' {
            return Err(CError::new("E2008", "unterminated char literal").with_location(line, col));
        }
        self.advance();
        Ok((value, line, col))
    }

    fn lex_string(&mut self) -> Result<(String, usize, usize), CError> {
        let line = self.line;
        let col = self.col;
        self.advance();
        let mut out = String::new();
        while self.idx < self.input.len() {
            let ch = self.peek();
            if ch == '"' {
                self.advance();
                return Ok((out, line, col));
            }
            if ch == '\\' {
                self.advance();
                let escaped = self.read_escape()?;
                out.push(escaped as char);
            } else {
                out.push(ch);
                self.advance();
            }
        }
        Err(CError::new("E2008", "unterminated string literal").with_location(line, col))
    }

    fn read_escape(&mut self) -> Result<u8, CError> {
        if self.idx >= self.input.len() {
            return Err(CError::new("E2008", "unterminated escape"));
        }
        let ch = self.peek();
        self.advance();
        let value = match ch {
            'n' => b'\n',
            'r' => b'\r',
            't' => b'\t',
            '\\' => b'\\',
            '\'' => b'\'',
            '"' => b'"',
            '0' => 0,
            _ => return Err(CError::new("E2008", "invalid escape")),
        };
        Ok(value)
    }

    fn token(&self, kind: TokenKind) -> Token {
        Token {
            kind,
            line: self.line,
            col: self.col,
        }
    }

    fn peek(&self) -> char {
        self.input[self.idx]
    }

    fn peek_next(&self) -> Option<char> {
        self.input.get(self.idx + 1).copied()
    }

    fn advance(&mut self) {
        if self.idx >= self.input.len() {
            return;
        }
        let ch = self.input[self.idx];
        self.idx += 1;
        if ch == '\n' {
            self.line += 1;
            self.col = 1;
        } else {
            self.col += 1;
        }
    }
}

fn is_ident_start(ch: char) -> bool {
    ch.is_ascii_alphabetic() || ch == '_'
}

fn is_ident_continue(ch: char) -> bool {
    ch.is_ascii_alphanumeric() || ch == '_'
}

fn is_keyword(text: &str) -> bool {
    matches!(
        text,
        "int"
            | "uint"
            | "unsigned"
            | "char"
            | "bool"
            | "void"
            | "return"
            | "if"
            | "else"
            | "while"
            | "for"
            | "break"
            | "continue"
            | "extern"
            | "sizeof"
            | "struct"
    )
}

fn parse_number(text: &str) -> Result<u64, String> {
    let trimmed = text.trim();
    if let Some(hex) = trimmed.strip_prefix("0x").or_else(|| trimmed.strip_prefix("0X")) {
        return u64::from_str_radix(hex, 16).map_err(|_| "invalid hex literal".to_string());
    }
    if let Some(bin) = trimmed.strip_prefix("0b").or_else(|| trimmed.strip_prefix("0B")) {
        return u64::from_str_radix(bin, 2).map_err(|_| "invalid bin literal".to_string());
    }
    trimmed
        .parse::<u64>()
        .map_err(|_| "invalid number literal".to_string())
}
