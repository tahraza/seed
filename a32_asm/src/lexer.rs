use crate::error::AsmError;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TokenKind {
    Ident(String),
    Number(i64),
    StringLit(String),
    Dot,
    Colon,
    Comma,
    Hash,
    LBracket,
    RBracket,
    LParen,
    RParen,
    Equal,
    Plus,
    Minus,
    Bang,
    Newline,
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

    pub fn tokenize(mut self) -> Result<Vec<Token>, AsmError> {
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

    fn next_token(&mut self) -> Result<Token, AsmError> {
        self.skip_whitespace_and_comments();
        if self.idx >= self.input.len() {
            return Ok(self.token(TokenKind::Eof));
        }
        let ch = self.peek();
        if ch == '\n' {
            self.advance();
            let tok = Token {
                kind: TokenKind::Newline,
                line: self.line - 1,
                col: 1,
            };
            return Ok(tok);
        }
        let token = match ch {
            '.' => {
                self.advance();
                self.token(TokenKind::Dot)
            }
            ':' => {
                self.advance();
                self.token(TokenKind::Colon)
            }
            ',' => {
                self.advance();
                self.token(TokenKind::Comma)
            }
            '#' => {
                self.advance();
                self.token(TokenKind::Hash)
            }
            '[' => {
                self.advance();
                self.token(TokenKind::LBracket)
            }
            ']' => {
                self.advance();
                self.token(TokenKind::RBracket)
            }
            '(' => {
                self.advance();
                self.token(TokenKind::LParen)
            }
            ')' => {
                self.advance();
                self.token(TokenKind::RParen)
            }
            '=' => {
                self.advance();
                self.token(TokenKind::Equal)
            }
            '+' => {
                self.advance();
                self.token(TokenKind::Plus)
            }
            '-' => {
                self.advance();
                self.token(TokenKind::Minus)
            }
            '!' => {
                self.advance();
                self.token(TokenKind::Bang)
            }
            '0'..='9' => {
                let (value, line, col) = self.lex_number()?;
                Token {
                    kind: TokenKind::Number(value),
                    line,
                    col,
                }
            }
            '"' => {
                let (value, line, col) = self.lex_string()?;
                Token {
                    kind: TokenKind::StringLit(value),
                    line,
                    col,
                }
            }
            _ if is_ident_start(ch) => {
                let (text, line, col) = self.lex_ident();
                Token {
                    kind: TokenKind::Ident(text),
                    line,
                    col,
                }
            }
            _ => {
                return Err(
                    AsmError::new("unexpected character")
                        .with_location(self.line, self.col),
                );
            }
        };
        Ok(token)
    }

    fn skip_whitespace_and_comments(&mut self) {
        loop {
            let mut skipped = false;
            while self.idx < self.input.len() {
                let ch = self.peek();
                if ch == ' ' || ch == '\t' || ch == '\r' {
                    self.advance();
                    skipped = true;
                } else {
                    break;
                }
            }
            if self.idx >= self.input.len() {
                return;
            }
            if self.peek() == ';' || self.peek() == '@' {
                self.skip_to_newline();
                continue;
            }
            if self.peek() == '/' && self.peek_next() == Some('/') {
                self.skip_to_newline();
                continue;
            }
            if !skipped {
                break;
            }
        }
    }

    fn skip_to_newline(&mut self) {
        while self.idx < self.input.len() {
            if self.peek() == '\n' {
                return;
            }
            self.advance();
        }
    }

    fn lex_ident(&mut self) -> (String, usize, usize) {
        let line = self.line;
        let col = self.col;
        let mut out = String::new();
        while self.idx < self.input.len() {
            let ch = self.peek();
            if is_ident_part(ch) {
                out.push(ch);
                self.advance();
            } else {
                break;
            }
        }
        (out, line, col)
    }

    fn lex_number(&mut self) -> Result<(i64, usize, usize), AsmError> {
        let line = self.line;
        let col = self.col;
        let mut text = String::new();
        if self.peek() == '0' {
            text.push('0');
            self.advance();
            if let Some(next) = self.peek_opt() {
                if next == 'x' || next == 'X' {
                    text.push(next);
                    self.advance();
                    while let Some(ch) = self.peek_opt() {
                        if ch.is_ascii_hexdigit() {
                            text.push(ch);
                            self.advance();
                        } else {
                            break;
                        }
                    }
                    let value = i64::from_str_radix(text.trim_start_matches("0x").trim_start_matches("0X"), 16)
                        .map_err(|_| AsmError::new("invalid hex literal").with_location(line, col))?;
                    return Ok((value, line, col));
                }
                if next == 'b' || next == 'B' {
                    text.push(next);
                    self.advance();
                    while let Some(ch) = self.peek_opt() {
                        if ch == '0' || ch == '1' {
                            text.push(ch);
                            self.advance();
                        } else {
                            break;
                        }
                    }
                    let value = i64::from_str_radix(text.trim_start_matches("0b").trim_start_matches("0B"), 2)
                        .map_err(|_| AsmError::new("invalid binary literal").with_location(line, col))?;
                    return Ok((value, line, col));
                }
            }
        }
        while self.idx < self.input.len() {
            let ch = self.peek();
            if ch.is_ascii_digit() {
                text.push(ch);
                self.advance();
            } else {
                break;
            }
        }
        let value = text
            .parse::<i64>()
            .map_err(|_| AsmError::new("invalid number").with_location(line, col))?;
        Ok((value, line, col))
    }

    fn lex_string(&mut self) -> Result<(String, usize, usize), AsmError> {
        let line = self.line;
        let col = self.col;
        let mut out = String::new();
        self.advance();
        while self.idx < self.input.len() {
            let ch = self.peek();
            if ch == '"' {
                self.advance();
                return Ok((out, line, col));
            }
            if ch == '\\' {
                self.advance();
                if self.idx >= self.input.len() {
                    break;
                }
                let esc = self.peek();
                let decoded = match esc {
                    'n' => '\n',
                    'r' => '\r',
                    't' => '\t',
                    '0' => '\0',
                    '\\' => '\\',
                    '"' => '"',
                    _ => {
                        return Err(AsmError::new("invalid escape").with_location(line, col));
                    }
                };
                out.push(decoded);
                self.advance();
            } else {
                out.push(ch);
                self.advance();
            }
        }
        Err(AsmError::new("unterminated string").with_location(line, col))
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

    fn peek_opt(&self) -> Option<char> {
        self.input.get(self.idx).copied()
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

fn is_ident_part(ch: char) -> bool {
    ch.is_ascii_alphanumeric() || ch == '_' || ch == '.'
}
