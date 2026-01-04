use a32_asm::{assemble_a32b_with_config, assemble_with_config, AsmConfig};
use std::fs;
use std::path::{Path, PathBuf};

#[test]
fn assemble_reference_tests() {
    let tests_dir = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("tests");
    let mut failures = Vec::new();

    for entry in fs::read_dir(&tests_dir).expect("read tests dir") {
        let entry = entry.expect("read entry");
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) != Some("a32") {
            continue;
        }
        let name = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
        let ref_path = tests_dir.join(format!("{}.ref", name));
        if !ref_path.exists() {
            failures.push(format!("missing ref for {}", name));
            continue;
        }

        let source = fs::read_to_string(&path).expect("read source");
        let (expected_error, config) = read_expected_error_and_config(&ref_path);
        match expected_error {
            Some(code) => match assemble_with_config(&source, &config) {
                Ok(_) => failures.push(format!("expected {} for {}, got Ok", code, name)),
                Err(err) => {
                    let got = err.code_str().unwrap_or("");
                    if got != code {
                        failures.push(format!("expected {} for {}, got {}", code, name, got));
                    }
                }
            },
            None => {
                if let Err(err) = assemble_a32b_with_config(&source, &config) {
                    failures.push(format!("expected Ok for {}, got {}", name, err));
                }
            }
        }
    }

    if !failures.is_empty() {
        panic!("assembler test failures:\n{}", failures.join("\n"));
    }
}

fn read_expected_error_and_config(path: &PathBuf) -> (Option<String>, AsmConfig) {
    let content = fs::read_to_string(path).expect("read ref");
    let mut config = AsmConfig::default();
    let mut error = None;
    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let mut parts = line.split_whitespace();
        if let Some(keyword) = parts.next() {
            match keyword {
                "ERROR" => {
                    if let Some(code) = parts.next() {
                        error = Some(code.to_string());
                    }
                }
                "CONFIG" => {
                    if let (Some(key), Some(value)) = (parts.next(), parts.next()) {
                        if key == "ram_size" {
                            if let Ok(size) = parse_u32(value) {
                                config.ram_size = size;
                            }
                        }
                    }
                }
                _ => {}
            }
        }
    }
    (error, config)
}

fn parse_u32(text: &str) -> Result<u32, std::num::ParseIntError> {
    let s = text.trim();
    if let Some(hex) = s.strip_prefix("0x").or_else(|| s.strip_prefix("0X")) {
        return u32::from_str_radix(hex, 16);
    }
    if let Some(bin) = s.strip_prefix("0b").or_else(|| s.strip_prefix("0B")) {
        return u32::from_str_radix(bin, 2);
    }
    s.parse::<u32>()
}
