use crate::ast::LiteralBase;
use crate::error::{Error, Span};

#[derive(Clone, Debug, PartialEq)]
pub enum TokenKind {
    Ident(String),
    Int(i64),
    BitLit(bool),
    BitVecLit { base: LiteralBase, digits: String },

    KwEntity,
    KwArchitecture,
    KwIs,
    KwBegin,
    KwEnd,
    KwPort,
    KwSignal,
    KwComponent,
    KwProcess,
    KwMap,
    KwIf,
    KwThen,
    KwElsif,
    KwElse,
    KwCase,
    KwWhen,
    KwOthers,
    KwOf,
    KwIn,
    KwOut,
    KwDownto,
    KwTo,

    KwBit,
    KwBits,
    KwRisingEdge,
    KwAnd,
    KwOr,
    KwXor,
    KwNot,

    LParen,
    RParen,
    Semicolon,
    Colon,
    Comma,
    Dot,

    ColonEq,
    Arrow,

    Plus,
    Minus,
    Amp,
    Shl,
    Shr,

    Eq,
    Ne,
    Lt,
    Le,
    Gt,
    Ge,

    Eof,
}

#[derive(Clone, Debug)]
pub struct Token {
    pub kind: TokenKind,
    pub span: Span,
}

pub struct Lexer<'a> {
    src: &'a str,
    idx: usize,
    line: usize,
    col: usize,
}

impl<'a> Lexer<'a> {
    pub fn new(src: &'a str) -> Self {
        Self {
            src,
            idx: 0,
            line: 1,
            col: 1,
        }
    }

    pub fn lex(&mut self) -> Result<Vec<Token>, Error> {
        let mut tokens = Vec::new();
        loop {
            let tok = self.next_token()?;
            let is_eof = tok.kind == TokenKind::Eof;
            tokens.push(tok);
            if is_eof {
                break;
            }
        }
        Ok(tokens)
    }

    fn next_token(&mut self) -> Result<Token, Error> {
        self.skip_ws_and_comments();
        let span = Span {
            line: self.line,
            col: self.col,
        };
        let ch = match self.peek() {
            Some(c) => c,
            None => {
                return Ok(Token {
                    kind: TokenKind::Eof,
                    span,
                })
            }
        };

        if ch.is_ascii_alphabetic() || ch == '_' {
            let ident = self.consume_while(|c| c.is_ascii_alphanumeric() || c == '_');
            let lower = ident.to_ascii_lowercase();
            if let Some(tok) = self.keyword(&lower) {
                return Ok(Token { kind: tok, span });
            }

            if lower == "b" && self.peek() == Some('"') {
                let bits = self.read_quoted()?;
                return Ok(Token {
                    kind: TokenKind::BitVecLit {
                        base: LiteralBase::Bin,
                        digits: bits,
                    },
                    span,
                });
            }
            if lower == "x" && self.peek() == Some('"') {
                let bits = self.read_quoted()?;
                return Ok(Token {
                    kind: TokenKind::BitVecLit {
                        base: LiteralBase::Hex,
                        digits: bits,
                    },
                    span,
                });
            }

            return Ok(Token {
                kind: TokenKind::Ident(ident),
                span,
            });
        }

        if ch.is_ascii_digit() {
            let lit = self.consume_number();
            let value = self.parse_int(&lit, span)?;
            return Ok(Token {
                kind: TokenKind::Int(value),
                span,
            });
        }

        match ch {
            '\'' => {
                self.bump();
                let bit = match self.bump() {
                    Some('0') => false,
                    Some('1') => true,
                    _ => return Err(Error::with_span("invalid bit literal", span)),
                };
                if self.bump() != Some('\'') {
                    return Err(Error::with_span("invalid bit literal", span));
                }
                Ok(Token {
                    kind: TokenKind::BitLit(bit),
                    span,
                })
            }
            '(' => {
                self.bump();
                Ok(Token { kind: TokenKind::LParen, span })
            }
            ')' => {
                self.bump();
                Ok(Token { kind: TokenKind::RParen, span })
            }
            ';' => {
                self.bump();
                Ok(Token { kind: TokenKind::Semicolon, span })
            }
            ':' => {
                self.bump();
                if self.peek() == Some('=') {
                    self.bump();
                    Ok(Token { kind: TokenKind::ColonEq, span })
                } else {
                    Ok(Token { kind: TokenKind::Colon, span })
                }
            }
            ',' => {
                self.bump();
                Ok(Token { kind: TokenKind::Comma, span })
            }
            '.' => {
                self.bump();
                Ok(Token { kind: TokenKind::Dot, span })
            }
            '<' => {
                self.bump();
                match self.peek() {
                    Some('=') => {
                        self.bump();
                        Ok(Token { kind: TokenKind::Le, span })
                    }
                    Some('<') => {
                        self.bump();
                        Ok(Token { kind: TokenKind::Shl, span })
                    }
                    Some('>') => {
                        self.bump();
                        Ok(Token { kind: TokenKind::Ne, span })
                    }
                    _ => Ok(Token { kind: TokenKind::Lt, span }),
                }
            }
            '>' => {
                self.bump();
                match self.peek() {
                    Some('=') => {
                        self.bump();
                        Ok(Token { kind: TokenKind::Ge, span })
                    }
                    Some('>') => {
                        self.bump();
                        Ok(Token { kind: TokenKind::Shr, span })
                    }
                    _ => Ok(Token { kind: TokenKind::Gt, span }),
                }
            }
            '=' => {
                self.bump();
                if self.peek() == Some('>') {
                    self.bump();
                    Ok(Token { kind: TokenKind::Arrow, span })
                } else {
                    Ok(Token { kind: TokenKind::Eq, span })
                }
            }
            '/' => {
                self.bump();
                if self.peek() == Some('=') {
                    self.bump();
                    Ok(Token { kind: TokenKind::Ne, span })
                } else {
                    Err(Error::with_span("unexpected '/'", span))
                }
            }
            '+' => {
                self.bump();
                Ok(Token { kind: TokenKind::Plus, span })
            }
            '-' => {
                self.bump();
                Ok(Token { kind: TokenKind::Minus, span })
            }
            '&' => {
                self.bump();
                Ok(Token { kind: TokenKind::Amp, span })
            }
            _ => Err(Error::with_span("unexpected character", span)),
        }
    }

    fn keyword(&self, lower: &str) -> Option<TokenKind> {
        Some(match lower {
            "entity" => TokenKind::KwEntity,
            "architecture" => TokenKind::KwArchitecture,
            "is" => TokenKind::KwIs,
            "begin" => TokenKind::KwBegin,
            "end" => TokenKind::KwEnd,
            "port" => TokenKind::KwPort,
            "map" => TokenKind::KwMap,
            "signal" => TokenKind::KwSignal,
            "component" => TokenKind::KwComponent,
            "process" => TokenKind::KwProcess,
            "if" => TokenKind::KwIf,
            "then" => TokenKind::KwThen,
            "elsif" => TokenKind::KwElsif,
            "else" => TokenKind::KwElse,
            "case" => TokenKind::KwCase,
            "when" => TokenKind::KwWhen,
            "others" => TokenKind::KwOthers,
            "of" => TokenKind::KwOf,
            "in" => TokenKind::KwIn,
            "out" => TokenKind::KwOut,
            "downto" => TokenKind::KwDownto,
            "to" => TokenKind::KwTo,
            "bit" => TokenKind::KwBit,
            "bits" => TokenKind::KwBits,
            "rising_edge" => TokenKind::KwRisingEdge,
            "and" => TokenKind::KwAnd,
            "or" => TokenKind::KwOr,
            "xor" => TokenKind::KwXor,
            "not" => TokenKind::KwNot,
            _ => return None,
        })
    }

    fn skip_ws_and_comments(&mut self) {
        loop {
            self.consume_while(|c| c.is_whitespace());
            if self.peek() == Some('-') && self.peek_next() == Some('-') {
                self.bump();
                self.bump();
                self.consume_while(|c| c != '\n');
                continue;
            }
            break;
        }
    }

    fn consume_number(&mut self) -> String {
        if self.peek() == Some('0') && matches!(self.peek_next(), Some('x') | Some('X') | Some('b') | Some('B')) {
            let mut s = String::new();
            s.push(self.bump().unwrap());
            s.push(self.bump().unwrap());
            s.push_str(&self.consume_while(|c| c.is_ascii_hexdigit() || c == '_'));
            return s;
        }
        self.consume_while(|c| c.is_ascii_digit() || c == '_')
    }

    fn parse_int(&self, s: &str, span: Span) -> Result<i64, Error> {
        let cleaned = s.replace('_', "");
        if cleaned.starts_with("0x") || cleaned.starts_with("0X") {
            return i64::from_str_radix(&cleaned[2..], 16)
                .map_err(|_| Error::with_span("invalid hex literal", span));
        }
        if cleaned.starts_with("0b") || cleaned.starts_with("0B") {
            return i64::from_str_radix(&cleaned[2..], 2)
                .map_err(|_| Error::with_span("invalid binary literal", span));
        }
        cleaned
            .parse::<i64>()
            .map_err(|_| Error::with_span("invalid int literal", span))
    }

    fn read_quoted(&mut self) -> Result<String, Error> {
        if self.bump() != Some('"') {
            return Err(Error::new("expected quote"));
        }
        let mut s = String::new();
        while let Some(c) = self.bump() {
            if c == '"' {
                return Ok(s);
            }
            s.push(c);
        }
        Err(Error::new("unterminated string"))
    }

    fn consume_while<F: Fn(char) -> bool>(&mut self, f: F) -> String {
        let mut s = String::new();
        while let Some(c) = self.peek() {
            if !f(c) {
                break;
            }
            self.bump();
            s.push(c);
        }
        s
    }

    fn peek(&self) -> Option<char> {
        self.src[self.idx..].chars().next()
    }

    fn peek_next(&self) -> Option<char> {
        let mut it = self.src[self.idx..].chars();
        it.next();
        it.next()
    }

    fn bump(&mut self) -> Option<char> {
        let ch = self.peek()?;
        let len = ch.len_utf8();
        self.idx += len;
        if ch == '\n' {
            self.line += 1;
            self.col = 1;
        } else {
            self.col += 1;
        }
        Some(ch)
    }
}
