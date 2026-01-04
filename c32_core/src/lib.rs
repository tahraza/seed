pub mod ast;
mod codegen;
mod error;
mod lexer;
mod parser;

pub use codegen::compile_to_a32;
pub use error::CError;
pub use parser::parse_program;
