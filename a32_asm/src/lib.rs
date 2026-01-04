pub mod ast;
mod assemble;
mod error;
pub mod lexer;
pub mod parser;

pub use error::AsmError;
pub use assemble::{
    assemble, assemble_a32b, assemble_a32b_with_config, assemble_with_config, AsmConfig,
    AssembledImage,
};
pub use parser::parse_program;
