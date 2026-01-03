use std::fmt;

#[derive(Debug, Clone)]
pub struct AsmError {
    message: String,
    line: Option<usize>,
    column: Option<usize>,
}

impl AsmError {
    pub fn new(message: impl Into<String>) -> Self {
        Self {
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
}

impl fmt::Display for AsmError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match (self.line, self.column) {
            (Some(line), Some(column)) => {
                write!(f, "{}:{}: {}", line, column, self.message)
            }
            _ => write!(f, "{}", self.message),
        }
    }
}

impl std::error::Error for AsmError {}
