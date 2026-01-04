use std::fmt;

#[derive(Debug, Clone)]
pub struct CError {
    code: String,
    message: String,
    line: Option<usize>,
    column: Option<usize>,
}

impl CError {
    pub fn new(code: &str, message: impl Into<String>) -> Self {
        Self {
            code: code.to_string(),
            message: message.into(),
            line: None,
            column: None,
        }
    }

    pub fn with_location(mut self, line: usize, column: usize) -> Self {
        self.line = Some(line);
        self.column = Some(column);
        self
    }

    pub fn code_str(&self) -> &str {
        &self.code
    }
}

impl fmt::Display for CError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let prefix = format!("{} ", self.code);
        match (self.line, self.column) {
            (Some(line), Some(column)) => {
                write!(f, "{}{}:{}: {}", prefix, line, column, self.message)
            }
            _ => write!(f, "{}{}", prefix, self.message),
        }
    }
}

impl std::error::Error for CError {}
