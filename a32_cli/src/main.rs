use a32_asm::assemble_a32b;
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
    let bytes = assemble_a32b(&source)?;
    fs::write(&output_path, bytes)?;
    Ok(())
}

fn default_output_path(input: &Path) -> PathBuf {
    if let Some(stem) = input.file_stem() {
        let mut out = input.with_file_name(stem);
        out.set_extension("a32b");
        out
    } else {
        PathBuf::from("out.a32b")
    }
}

fn print_usage() {
    eprintln!("usage: a32_cli <input.a32> [-o output.a32b]");
}
