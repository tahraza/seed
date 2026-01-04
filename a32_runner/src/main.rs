use a32_asm::ast::Expr;
use a32_asm::parser::parse_expr_str;
use a32_asm::{assemble_a32b_with_config, AsmConfig, AsmError};
use a32_core::{Machine, Reg, SimConfig, TrapCode};
use std::collections::{HashMap, HashSet};
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
    let target = args.next().unwrap_or_else(|| "tests".to_string());
    let path = PathBuf::from(target);
    let cases = collect_cases(&path)?;
    if cases.is_empty() {
        return Err("no tests found".into());
    }
    let mut failures = Vec::new();
    for case in cases {
        if let Err(err) = run_case(&case) {
            failures.push(err);
        }
    }
    if !failures.is_empty() {
        eprintln!("test failures:");
        for failure in failures {
            eprintln!("  {}", failure);
        }
        return Err("some tests failed".into());
    }
    Ok(())
}

#[derive(Clone, Debug)]
struct TestCase {
    name: String,
    asm_path: PathBuf,
    ref_path: PathBuf,
}

fn collect_cases(path: &Path) -> Result<Vec<TestCase>, Box<dyn std::error::Error>> {
    let mut cases = Vec::new();
    if path.is_file() {
        let asm_path = path.to_path_buf();
        let ref_path = asm_path.with_extension("ref");
        let name = asm_path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("test")
            .to_string();
        cases.push(TestCase {
            name,
            asm_path,
            ref_path,
        });
        return Ok(cases);
    }
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let asm_path = entry.path();
        if asm_path.extension().and_then(|s| s.to_str()) != Some("a32") {
            continue;
        }
        let name = asm_path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("test")
            .to_string();
        let ref_path = asm_path.with_extension("ref");
        cases.push(TestCase {
            name,
            asm_path,
            ref_path,
        });
    }
    cases.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(cases)
}

#[derive(Clone, Debug)]
struct TestConfig {
    ram_size: u32,
    strict_traps: bool,
}

impl Default for TestConfig {
    fn default() -> Self {
        Self {
            ram_size: 0x0010_0000,
            strict_traps: true,
        }
    }
}

#[derive(Clone, Debug)]
struct TrapSpec {
    code: TrapCode,
    pc: Option<u32>,
    addr: Option<u32>,
    instr: Option<u32>,
}

#[derive(Clone, Debug)]
struct TestSpec {
    config: TestConfig,
    expected_error: Option<String>,
    expected_exit: Option<u32>,
    expected_trap: Option<TrapSpec>,
    expected_output: String,
    expected_regs: Vec<(Reg, u32)>,
    expected_flags: Vec<(char, bool)>,
    expected_mem: Vec<(u32, u32)>,
    linker: Option<PathBuf>,
}

impl Default for TestSpec {
    fn default() -> Self {
        Self {
            config: TestConfig::default(),
            expected_error: None,
            expected_exit: None,
            expected_trap: None,
            expected_output: String::new(),
            expected_regs: Vec::new(),
            expected_flags: Vec::new(),
            expected_mem: Vec::new(),
            linker: None,
        }
    }
}

#[derive(Clone, Debug)]
struct BuildOutput {
    bytes: Vec<u8>,
    stack_size: Option<u32>,
}

fn run_case(case: &TestCase) -> Result<(), String> {
    if !case.ref_path.exists() {
        return Err(format!("{}: missing ref file", case.name));
    }
    let spec = parse_ref(&case.ref_path)?;
    let source = fs::read_to_string(&case.asm_path)
        .map_err(|e| format!("{}: {}", case.name, e))?;

    let build = build_program(&source, case, &spec);
    if let Some(code) = &spec.expected_error {
        return match build {
            Ok(_) => Err(format!(
                "{}: expected error {}, got Ok",
                case.name, code
            )),
            Err(err) => {
                let got = err.code_str().unwrap_or("");
                if got == code {
                    Ok(())
                } else {
                    Err(format!(
                        "{}: expected error {}, got {}",
                        case.name, code, got
                    ))
                }
            }
        };
    }

    let build = build.map_err(|err| format!("{}: {}", case.name, err))?;
    let bytes = build.bytes;
    let stack_top = build
        .stack_size
        .map(|size| spec.config.ram_size.saturating_sub(size))
        .filter(|top| *top <= spec.config.ram_size);
    let sim_config = SimConfig {
        ram_size: spec.config.ram_size,
        strict_traps: spec.config.strict_traps,
        max_steps: 1_000_000,
        stack_top,
    };
    let max_steps = sim_config.max_steps;
    let mut machine = Machine::from_a32b(&bytes, sim_config.clone())
        .map_err(|err| format!("{}: {}", case.name, err))?;
    let outcome = machine
        .run(max_steps)
        .map_err(|err| format!("{}: {}", case.name, err))?;

    if let Some(expected) = &spec.expected_trap {
        if let Some(trap) = outcome.trap {
            if trap.code != expected.code {
                return Err(format!(
                    "{}: expected trap {}, got {}",
                    case.name,
                    expected.code.as_str(),
                    trap.code.as_str()
                ));
            }
            if let Some(pc) = expected.pc {
                if trap.pc != pc {
                    return Err(format!(
                        "{}: expected trap pc {:#x}, got {:#x}",
                        case.name, pc, trap.pc
                    ));
                }
            }
            if let Some(addr) = expected.addr {
                if trap.addr != addr {
                    return Err(format!(
                        "{}: expected trap addr {:#x}, got {:#x}",
                        case.name, addr, trap.addr
                    ));
                }
            }
            if let Some(instr) = expected.instr {
                if trap.instr != instr {
                    return Err(format!(
                        "{}: expected trap instr {:#x}, got {:#x}",
                        case.name, instr, trap.instr
                    ));
                }
            }
        } else {
            return Err(format!("{}: expected trap, got exit", case.name));
        }
    } else if let Some(expected) = spec.expected_exit {
        if let Some(exit) = outcome.exit {
            if exit.code != expected {
                return Err(format!(
                    "{}: expected exit {}, got {}",
                    case.name, expected, exit.code
                ));
            }
        } else if let Some(trap) = outcome.trap {
            return Err(format!(
                "{}: expected exit, got trap {}",
                case.name,
                trap.code.as_str()
            ));
        } else {
            return Err(format!("{}: expected exit, got no result", case.name));
        }
    }

    let output = machine.output_string();
    if output != spec.expected_output {
        return Err(format!(
            "{}: expected output {:?}, got {:?}",
            case.name, spec.expected_output, output
        ));
    }

    for (reg, value) in &spec.expected_regs {
        let got = machine.cpu().reg(*reg);
        if got != *value {
            return Err(format!(
                "{}: expected {:?} {:#x}, got {:#x}",
                case.name, reg, value, got
            ));
        }
    }

    for (flag, value) in &spec.expected_flags {
        let flags = machine.cpu().flags();
        let got = match *flag {
            'N' => flags.n,
            'Z' => flags.z,
            'C' => flags.c,
            'V' => flags.v,
            _ => false,
        };
        if got != *value {
            return Err(format!(
                "{}: expected flag {} {}, got {}",
                case.name,
                flag,
                bool_to_int(*value),
                bool_to_int(got)
            ));
        }
    }

    for (addr, value) in &spec.expected_mem {
        let got = machine
            .read_u32(*addr)
            .ok_or_else(|| format!("{}: mem read failed at {:#x}", case.name, addr))?;
        if got != *value {
            return Err(format!(
                "{}: expected mem {:#x} = {:#x}, got {:#x}",
                case.name, addr, value, got
            ));
        }
    }

    Ok(())
}

fn build_program(
    source: &str,
    case: &TestCase,
    spec: &TestSpec,
) -> Result<BuildOutput, AsmError> {
    let mut asm_config = AsmConfig::default();
    asm_config.ram_size = spec.config.ram_size;
    let mut stack_size = None;
    if let Some(linker) = &spec.linker {
        let script_path = resolve_linker_path(&case.ref_path, linker);
        let link = parse_linker_script(&script_path, &asm_config)?;
        asm_config = link.config;
        asm_config.ram_size = spec.config.ram_size;
        stack_size = link.stack_size;
    }
    let bytes = assemble_a32b_with_config(source, &asm_config)?;
    Ok(BuildOutput { bytes, stack_size })
}

fn parse_ref(path: &Path) -> Result<TestSpec, String> {
    let mut spec = TestSpec::default();
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    for (line_no, raw) in content.lines().enumerate() {
        let line = raw.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let mut parts = line.split_whitespace();
        let keyword = parts.next().unwrap_or("");
        match keyword {
            "CONFIG" => {
                let key = parts.next().ok_or_else(|| line_err(line_no, "missing key"))?;
                let value = parts.next().ok_or_else(|| line_err(line_no, "missing value"))?;
                match key {
                    "ram_size" => {
                        spec.config.ram_size = parse_u32(value).map_err(|e| line_err(line_no, &e))?;
                    }
                    "strict_traps" => {
                        spec.config.strict_traps =
                            parse_bool(value).map_err(|e| line_err(line_no, &e))?;
                    }
                    _ => {}
                }
            }
            "LINKER" => {
                let path = parts.next().ok_or_else(|| line_err(line_no, "missing path"))?;
                spec.linker = Some(PathBuf::from(path));
            }
            "ERROR" => {
                let code = parts.next().ok_or_else(|| line_err(line_no, "missing code"))?;
                spec.expected_error = Some(code.to_string());
            }
            "EXIT" => {
                let value = parts.next().ok_or_else(|| line_err(line_no, "missing exit code"))?;
                spec.expected_exit =
                    Some(parse_u32(value).map_err(|e| line_err(line_no, &e))?);
            }
            "OUT" => {
                let rest = line.strip_prefix("OUT").unwrap_or("").trim();
                let text = parse_quoted(rest).map_err(|e| line_err(line_no, &e))?;
                spec.expected_output.push_str(&text);
            }
            "REG" => {
                let name = parts.next().ok_or_else(|| line_err(line_no, "missing reg"))?;
                let value = parts.next().ok_or_else(|| line_err(line_no, "missing value"))?;
                let reg = parse_reg(name).ok_or_else(|| line_err(line_no, "invalid reg"))?;
                let val = parse_u32(value).map_err(|e| line_err(line_no, &e))?;
                spec.expected_regs.push((reg, val));
            }
            "FLAG" => {
                let name = parts.next().ok_or_else(|| line_err(line_no, "missing flag"))?;
                let value = parts.next().ok_or_else(|| line_err(line_no, "missing value"))?;
                let flag = name.chars().next().unwrap_or(' ');
                let val = parse_u32(value).map_err(|e| line_err(line_no, &e))?;
                spec.expected_flags.push((flag.to_ascii_uppercase(), val != 0));
            }
            "MEM" => {
                let addr = parts.next().ok_or_else(|| line_err(line_no, "missing addr"))?;
                let value = parts.next().ok_or_else(|| line_err(line_no, "missing value"))?;
                let addr = parse_u32(addr).map_err(|e| line_err(line_no, &e))?;
                let val = parse_u32(value).map_err(|e| line_err(line_no, &e))?;
                spec.expected_mem.push((addr, val));
            }
            "TRAP" => {
                let name = parts.next().ok_or_else(|| line_err(line_no, "missing trap"))?;
                let code = parse_trap_code(name).map_err(|e| line_err(line_no, &e))?;
                spec.expected_trap = Some(TrapSpec {
                    code,
                    pc: None,
                    addr: None,
                    instr: None,
                });
            }
            "TRAPPC" => {
                let value = parts.next().ok_or_else(|| line_err(line_no, "missing value"))?;
                if let Some(spec_trap) = spec.expected_trap.as_mut() {
                    spec_trap.pc = Some(parse_u32(value).map_err(|e| line_err(line_no, &e))?);
                } else {
                    return Err(line_err(line_no, "TRAPPC without TRAP"));
                }
            }
            "TRAPADDR" => {
                let value = parts.next().ok_or_else(|| line_err(line_no, "missing value"))?;
                if let Some(spec_trap) = spec.expected_trap.as_mut() {
                    spec_trap.addr = Some(parse_u32(value).map_err(|e| line_err(line_no, &e))?);
                } else {
                    return Err(line_err(line_no, "TRAPADDR without TRAP"));
                }
            }
            "TRAPINSTR" => {
                let value = parts.next().ok_or_else(|| line_err(line_no, "missing value"))?;
                if let Some(spec_trap) = spec.expected_trap.as_mut() {
                    spec_trap.instr = Some(parse_u32(value).map_err(|e| line_err(line_no, &e))?);
                } else {
                    return Err(line_err(line_no, "TRAPINSTR without TRAP"));
                }
            }
            _ => return Err(line_err(line_no, "unknown directive")),
        }
    }
    Ok(spec)
}

fn resolve_linker_path(ref_path: &Path, linker: &PathBuf) -> PathBuf {
    if linker.is_absolute() {
        return linker.clone();
    }
    let ref_dir = ref_path.parent().unwrap_or_else(|| Path::new("."));
    let candidate = ref_dir.join(linker);
    if candidate.exists() {
        candidate
    } else {
        linker.clone()
    }
}

#[derive(Clone, Debug)]
struct LinkerResult {
    config: AsmConfig,
    stack_size: Option<u32>,
}

fn parse_linker_script(path: &Path, base: &AsmConfig) -> Result<LinkerResult, AsmError> {
    let content = fs::read_to_string(path)
        .map_err(|e| AsmError::code("E3001", format!("linker read error: {}", e)))?;
    let mut config = base.clone();
    config.extra_symbols.clear();
    let mut stack_size = None;
    let mut symbol_values: HashMap<String, i64> = HashMap::new();
    let mut symbol_names = HashSet::new();
    let mut data_base_set = false;
    for (line_no, raw) in content.lines().enumerate() {
        let line = raw.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let keyword = line
            .split_whitespace()
            .next()
            .unwrap_or("")
            .to_ascii_uppercase();
        match keyword.as_str() {
            "ENTRY" => {
                let name = line.split_whitespace().nth(1).ok_or_else(|| {
                    script_err(line_no, "ENTRY requires a symbol name")
                })?;
                config.entry = Some(name.to_string());
            }
            "SECTION" => {
                let tokens: Vec<&str> = line.split_whitespace().collect();
                if tokens.len() < 6 {
                    return Err(script_err(line_no, "SECTION requires BASE and ALIGN"));
                }
                let section = tokens[1].to_ascii_lowercase();
                let base_pos = tokens
                    .iter()
                    .position(|t| t.eq_ignore_ascii_case("BASE"))
                    .ok_or_else(|| script_err(line_no, "SECTION missing BASE"))?;
                let align_pos = tokens
                    .iter()
                    .position(|t| t.eq_ignore_ascii_case("ALIGN"))
                    .ok_or_else(|| script_err(line_no, "SECTION missing ALIGN"))?;
                if base_pos + 1 >= align_pos {
                    return Err(script_err(line_no, "SECTION missing base expression"));
                }
                if align_pos + 1 >= tokens.len() {
                    return Err(script_err(line_no, "SECTION missing align expression"));
                }
                let base_expr = tokens[base_pos + 1..align_pos].join(" ");
                let align_expr = tokens[align_pos + 1..].join(" ");
                let base = eval_expr_u32(&base_expr, &symbol_values)
                    .map_err(|e| script_err(line_no, &e.to_string()))?;
                let align = eval_expr_u32(&align_expr, &symbol_values)
                    .map_err(|e| script_err(line_no, &e.to_string()))?;
                if align == 0 || !align.is_power_of_two() {
                    return Err(script_err(line_no, "ALIGN must be a power of two"));
                }
                let base = align_up(base, align);
                match section.as_str() {
                    "text" => config.text_base = base,
                    "data" => {
                        config.data_base = base;
                        data_base_set = true;
                    }
                    "bss" => config.bss_base = base,
                    "rodata" => {
                        if !data_base_set {
                            config.data_base = base;
                        }
                    }
                    _ => return Err(script_err(line_no, "unknown section name")),
                }
            }
            "ORDER" => {
                for name in line.split_whitespace().skip(1) {
                    match name.to_ascii_lowercase().as_str() {
                        "text" | "rodata" | "data" | "bss" => {}
                        _ => return Err(script_err(line_no, "unknown section in ORDER")),
                    }
                }
            }
            "STACK" => {
                let expr = line
                    .strip_prefix("STACK")
                    .unwrap_or("")
                    .trim();
                if expr.is_empty() {
                    return Err(script_err(line_no, "STACK requires a size"));
                }
                let size = eval_expr_u32(expr, &symbol_values)
                    .map_err(|e| script_err(line_no, &e.to_string()))?;
                stack_size = Some(size);
            }
            "SYMBOL" => {
                let rest = line
                    .strip_prefix("SYMBOL")
                    .unwrap_or("")
                    .trim();
                let mut parts = rest.splitn(2, '=');
                let name_part = parts.next().unwrap_or("").trim();
                let expr_part = parts.next().unwrap_or("").trim();
                if name_part.is_empty() || expr_part.is_empty() {
                    return Err(script_err(line_no, "SYMBOL requires name and expression"));
                }
                if symbol_names.contains(name_part) {
                    return Err(script_err(line_no, "duplicate SYMBOL name"));
                }
                let expr = parse_expr_script(expr_part)
                    .map_err(|e| script_err(line_no, &e.to_string()))?;
                symbol_names.insert(name_part.to_string());
                if let Ok(value) = eval_expr(&expr, &symbol_values) {
                    symbol_values.insert(name_part.to_string(), value);
                }
                config
                    .extra_symbols
                    .push((name_part.to_string(), expr));
            }
            _ => return Err(script_err(line_no, "unknown directive")),
        }
    }
    Ok(LinkerResult {
        config,
        stack_size,
    })
}

fn parse_expr_script(expr: &str) -> Result<Expr, AsmError> {
    parse_expr_str(expr).map_err(|e| AsmError::code("E3001", e.to_string()))
}

fn eval_expr_u32(expr: &str, symbols: &HashMap<String, i64>) -> Result<u32, AsmError> {
    let expr = parse_expr_script(expr)?;
    let value = eval_expr(&expr, symbols)?;
    if value < 0 {
        return Err(AsmError::code("E3001", "negative value"));
    }
    value_to_u32(value)
}

fn eval_expr(expr: &Expr, symbols: &HashMap<String, i64>) -> Result<i64, AsmError> {
    match expr {
        Expr::Number(v) => Ok(*v),
        Expr::Symbol(name) => symbols
            .get(name)
            .copied()
            .ok_or_else(|| AsmError::code("E3001", "undefined symbol")),
        Expr::UnaryMinus(inner) => Ok(-eval_expr(inner, symbols)?),
        Expr::Add(a, b) => Ok(eval_expr(a, symbols)? + eval_expr(b, symbols)?),
        Expr::Sub(a, b) => Ok(eval_expr(a, symbols)? - eval_expr(b, symbols)?),
    }
}

fn value_to_u32(value: i64) -> Result<u32, AsmError> {
    if value < i32::MIN as i64 || value > u32::MAX as i64 {
        return Err(AsmError::code("E3001", "value out of range"));
    }
    Ok(value as i32 as u32)
}

fn script_err(line: usize, message: &str) -> AsmError {
    AsmError::code("E3001", message).with_location(line + 1, 1)
}

fn align_up(value: u32, align: u32) -> u32 {
    if align == 0 {
        return value;
    }
    let mask = align - 1;
    (value + mask) & !mask
}

fn parse_trap_code(text: &str) -> Result<TrapCode, String> {
    match text {
        "MISALIGNED" => Ok(TrapCode::Misaligned),
        "MEM_FAULT" => Ok(TrapCode::MemFault),
        "ILLEGAL" => Ok(TrapCode::Illegal),
        "DIV_ZERO" => Ok(TrapCode::DivZero),
        _ => Err("unknown trap code".to_string()),
    }
}

fn parse_reg(text: &str) -> Option<Reg> {
    let upper = text.to_ascii_uppercase();
    match upper.as_str() {
        "SP" => return Some(Reg::SP),
        "LR" => return Some(Reg::LR),
        "PC" => return Some(Reg::PC),
        _ => {}
    }
    if !upper.starts_with('R') {
        return None;
    }
    let num = upper[1..].parse::<u8>().ok()?;
    Reg::from_u8(num)
}

fn parse_bool(text: &str) -> Result<bool, String> {
    match text.to_ascii_lowercase().as_str() {
        "true" | "1" => Ok(true),
        "false" | "0" => Ok(false),
        _ => Err("invalid boolean".to_string()),
    }
}

fn parse_u32(text: &str) -> Result<u32, String> {
    let value = parse_number(text)?;
    if value < 0 {
        if value < i32::MIN as i64 {
            return Err("value out of range".to_string());
        }
        return Ok(value as i32 as u32);
    }
    if value > u32::MAX as i64 {
        return Err("value out of range".to_string());
    }
    Ok(value as u32)
}

fn parse_number(text: &str) -> Result<i64, String> {
    let trimmed = text.trim();
    let negative = trimmed.starts_with('-');
    let digits = if negative { &trimmed[1..] } else { trimmed };
    let (radix, body) = if digits.starts_with("0x") || digits.starts_with("0X") {
        (16, &digits[2..])
    } else if digits.starts_with("0b") || digits.starts_with("0B") {
        (2, &digits[2..])
    } else {
        (10, digits)
    };
    let value = i64::from_str_radix(body, radix).map_err(|_| "invalid number".to_string())?;
    Ok(if negative { -value } else { value })
}

fn parse_quoted(input: &str) -> Result<String, String> {
    let trimmed = input.trim();
    if !trimmed.starts_with('"') || !trimmed.ends_with('"') {
        return Err("expected quoted string".to_string());
    }
    let mut out = String::new();
    let mut chars = trimmed[1..trimmed.len() - 1].chars();
    while let Some(ch) = chars.next() {
        if ch != '\\' {
            out.push(ch);
            continue;
        }
        let esc = chars.next().ok_or_else(|| "incomplete escape".to_string())?;
        match esc {
            'n' => out.push('\n'),
            'r' => out.push('\r'),
            't' => out.push('\t'),
            '0' => out.push('\0'),
            '\\' => out.push('\\'),
            '"' => out.push('"'),
            'x' => {
                let hi = chars.next().ok_or_else(|| "incomplete hex escape".to_string())?;
                let lo = chars.next().ok_or_else(|| "incomplete hex escape".to_string())?;
                let hex = format!("{}{}", hi, lo);
                let byte = u8::from_str_radix(&hex, 16)
                    .map_err(|_| "invalid hex escape".to_string())?;
                out.push(byte as char);
            }
            other => out.push(other),
        }
    }
    Ok(out)
}

fn line_err(line: usize, message: &str) -> String {
    format!("line {}: {}", line + 1, message)
}

fn bool_to_int(value: bool) -> u8 {
    if value { 1 } else { 0 }
}
