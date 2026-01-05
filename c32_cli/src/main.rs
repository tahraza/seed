use c32_core::{compile_to_a32, parse_program};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};

fn main() {
    if let Err(err) = run() {
        eprintln!("error: {}", err);
        std::process::exit(1);
    }
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    let mut args = env::args().skip(1);
    let input = match args.next() {
        Some(value) => value,
        None => {
            print_usage();
            std::process::exit(2);
        }
    };

    let mut output: Option<String> = None;
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "-o" | "--out" => {
                let value = args
                    .next()
                    .ok_or_else(|| "missing value for --out".to_string())?;
                output = Some(value);
            }
            "-h" | "--help" => {
                print_usage();
                return Ok(());
            }
            _ => return Err(format!("unknown argument: {}", arg).into()),
        }
    }

    let input_path = PathBuf::from(input);
    let output_path = output
        .map(PathBuf::from)
        .unwrap_or_else(|| default_output_path(&input_path));

    let source = fs::read_to_string(&input_path)?;
    let (program, struct_defs) = parse_program(&source)?;
    let asm = compile_to_a32(&program, &struct_defs)?;
    fs::write(&output_path, asm)?;
    Ok(())
}

fn default_output_path(input: &Path) -> PathBuf {
    if let Some(stem) = input.file_stem() {
        let mut out = input.with_file_name(stem);
        out.set_extension("a32");
        out
    } else {
        PathBuf::from("out.a32")
    }
}

fn print_usage() {
    eprintln!("usage: c32_cli <input.c> [-o output.a32]");
}
