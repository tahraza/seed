mod error;

pub use error::AsmError;

pub fn assemble(_source: &str) -> Result<Vec<u32>, AsmError> {
    Err(AsmError::new("assembler not implemented"))
}
