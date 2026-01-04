use a32_asm::ast::Expr as AsmExpr;
use a32_asm::parser::parse_expr_str;
use a32_asm::{assemble_a32b_with_config, AsmConfig, AsmError};
use a32_core::{Machine, Reg, SimConfig, TrapCode};
use c32_core::{compile_to_a32, parse_program, CError, Program};
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
    let target = args.next().unwrap_or_else(|| "tests_c".to_string());
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
    sources: Vec<PathBuf>,
    ref_path: PathBuf,
}

fn collect_cases(path: &Path) -> Result<Vec<TestCase>, Box<dyn std::error::Error>> {
    let mut cases = Vec::new();
    if path.is_file() {
        let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("");
        if ext == "c" {
            let name = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("test")
                .to_string();
            let ref_path = path.with_extension("ref");
            cases.push(TestCase {
                name,
                sources: vec![path.to_path_buf()],
                ref_path,
            });
            return Ok(cases);
        }
        if ext == "ref" {
            let name = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("test")
                .to_string();
            let sources = gather_sources(path.parent().unwrap_or_else(|| Path::new(".")), &name)?;
            cases.push(TestCase {
                name,
                sources,
                ref_path: path.to_path_buf(),
            });
            return Ok(cases);
        }
    }

    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let ref_path = entry.path();
        if ref_path.extension().and_then(|s| s.to_str()) != Some("ref") {
            continue;
        }
        let name = ref_path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("test")
            .to_string();
        let sources = gather_sources(path, &name)?;
        cases.push(TestCase {
            name,
            sources,
            ref_path,
        });
    }
    cases.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(cases)
}

fn gather_sources(dir: &Path, name: &str) -> Result<Vec<PathBuf>, Box<dyn std::error::Error>> {
    let mut sources = Vec::new();
    let prefix = format!("{}", name);
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) != Some("c") {
            continue;
        }
        let stem = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("");
        if stem == prefix || stem.starts_with(&(prefix.clone() + "_")) {
            sources.push(path);
        }
    }
    sources.sort();
    Ok(sources)
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

#[derive(Debug)]
enum BuildError {
    Compile(CError),
    Assemble(AsmError),
}

impl BuildError {
    fn code_str(&self) -> Option<&str> {
        match self {
            BuildError::Compile(err) => Some(err.code_str()),
            BuildError::Assemble(err) => err.code_str(),
        }
    }
}

impl std::fmt::Display for BuildError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            BuildError::Compile(err) => write!(f, "{}", err),
            BuildError::Assemble(err) => write!(f, "{}", err),
        }
    }
}

impl std::error::Error for BuildError {}

fn run_case(case: &TestCase) -> Result<(), String> {
    if !case.ref_path.exists() {
        return Err(format!("{}: missing ref file", case.name));
    }
    let spec = parse_ref(&case.ref_path)?;

    let build = build_program(case, &spec);
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
                "{}: expected {:?} = {:#x}, got {:#x}",
                case.name, reg, value, got
            ));
        }
    }

    for (flag, value) in &spec.expected_flags {
        let flags = machine.cpu().flags();
        let got = match flag {
            'N' => flags.n,
            'Z' => flags.z,
            'C' => flags.c,
            'V' => flags.v,
            _ => false,
        };
        if got != *value {
            return Err(format!(
                "{}: expected flag {} = {}, got {}",
                case.name, flag, value, got
            ));
        }
    }

    for (addr, value) in &spec.expected_mem {
        let got = machine.read_u32(*addr).unwrap_or(0);
        if got != *value {
            return Err(format!(
                "{}: expected mem {:#x} = {:#x}, got {:#x}",
                case.name, addr, value, got
            ));
        }
    }
    Ok(())
}

fn build_program(case: &TestCase, spec: &TestSpec) -> Result<BuildOutput, BuildError> {
    let mut items = Vec::new();
    for path in &case.sources {
        let source = fs::read_to_string(path).map_err(|e| BuildError::Compile(CError::new("E2008", e.to_string())))?;
        let program = parse_program(&source).map_err(BuildError::Compile)?;
        items.extend(program.items);
    }
    let program = Program { items };
    let asm = compile_to_a32(&program).map_err(BuildError::Compile)?;

    let mut asm_config = AsmConfig::default();
    asm_config.ram_size = spec.config.ram_size;
    let mut stack_size = None;
    if let Some(linker) = &spec.linker {
        let script_path = resolve_linker_path(&case.ref_path, linker);
        let link = parse_linker_script(&script_path, &asm_config).map_err(BuildError::Assemble)?;
        asm_config = link.config;
        asm_config.ram_size = spec.config.ram_size;
        stack_size = link.stack_size;
    }
    let bytes = assemble_a32b_with_config(&asm, &asm_config).map_err(BuildError::Assemble)?;
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
                config.section_order = Some(
                    line.split_whitespace()
                        .skip(1)
                        .map(|s| s.to_ascii_lowercase())
                        .collect(),
                );
            }
            "SYMBOL" => {
                let name = line.split_whitespace().nth(1).ok_or_else(|| {
                    script_err(line_no, "SYMBOL requires name")
                })?;
                let expr = line.split_whitespace().skip(2).collect::<Vec<_>>().join(" ");
                let value = eval_expr_u32(&expr, &symbol_values)
                    .map_err(|e| script_err(line_no, &e.to_string()))?;
                if symbol_names.contains(name) {
                    return Err(script_err(line_no, "duplicate symbol"));
                }
                symbol_names.insert(name.to_string());
                symbol_values.insert(name.to_string(), value as i64);
                config.extra_symbols.insert(name.to_string(), value);
            }
            "STACK" => {
                let expr = line.split_whitespace().nth(1).ok_or_else(|| {
                    script_err(line_no, "STACK requires size")
                })?;
                let value = eval_expr_u32(expr, &symbol_values)
                    .map_err(|e| script_err(line_no, &e.to_string()))?;
                stack_size = Some(value);
            }
            _ => return Err(script_err(line_no, "unknown directive")),
        }
    }
    Ok(LinkerResult { config, stack_size })
}

fn eval_expr_u32(expr: &str, symbols: &HashMap<String, i64>) -> Result<u32, AsmError> {
    let parsed = parse_expr_str(expr)?;
    eval_expr(&parsed, symbols)
}

fn eval_expr(expr: &AsmExpr, symbols: &HashMap<String, i64>) -> Result<u32, AsmError> {
    let value = match expr {
        AsmExpr::Number(v) => *v,
        AsmExpr::Symbol(name) => *symbols.get(name).ok_or_else(|| {
            AsmError::code("E3001", "unknown linker symbol")
        })?,
        AsmExpr::UnaryMinus(inner) => -eval_expr_i64(inner, symbols)?,
        AsmExpr::Add(a, b) => eval_expr_i64(a, symbols)? + eval_expr_i64(b, symbols)?,
        AsmExpr::Sub(a, b) => eval_expr_i64(a, symbols)? - eval_expr_i64(b, symbols)?,
    };
    if value < 0 || value > u32::MAX as i64 {
        return Err(AsmError::code("E3003", "relocation out of range"));
    }
    Ok(value as u32)
}

fn eval_expr_i64(expr: &AsmExpr, symbols: &HashMap<String, i64>) -> Result<i64, AsmError> {
    Ok(match expr {
        AsmExpr::Number(v) => *v,
        AsmExpr::Symbol(name) => *symbols.get(name).ok_or_else(|| {
            AsmError::code("E3001", "unknown linker symbol")
        })?,
        AsmExpr::UnaryMinus(inner) => -eval_expr_i64(inner, symbols)?,
        AsmExpr::Add(a, b) => eval_expr_i64(a, symbols)? + eval_expr_i64(b, symbols)?,
        AsmExpr::Sub(a, b) => eval_expr_i64(a, symbols)? - eval_expr_i64(b, symbols)?,
    })
}

fn align_up(value: u32, align: u32) -> u32 {
    if align == 0 {
        return value;
    }
    (value + align - 1) & !(align - 1)
}

fn parse_trap_code(name: &str) -> Result<TrapCode, String> {
    match name {
        "MISALIGNED" => Ok(TrapCode::Misaligned),
        "MEM_FAULT" => Ok(TrapCode::MemFault),
        "ILLEGAL" => Ok(TrapCode::Illegal),
        "DIV_ZERO" => Ok(TrapCode::DivZero),
        _ => Err("unknown trap".to_string()),
    }
}

fn parse_reg(name: &str) -> Option<Reg> {
    match name.to_ascii_uppercase().as_str() {
        "R0" => Some(Reg::R0),
        "R1" => Some(Reg::R1),
        "R2" => Some(Reg::R2),
        "R3" => Some(Reg::R3),
        "R4" => Some(Reg::R4),
        "R5" => Some(Reg::R5),
        "R6" => Some(Reg::R6),
        "R7" => Some(Reg::R7),
        "R8" => Some(Reg::R8),
        "R9" => Some(Reg::R9),
        "R10" => Some(Reg::R10),
        "R11" => Some(Reg::R11),
        "R12" => Some(Reg::R12),
        "R13" | "SP" => Some(Reg::SP),
        "R14" | "LR" => Some(Reg::LR),
        "R15" | "PC" => Some(Reg::PC),
        _ => None,
    }
}

fn parse_u32(text: &str) -> Result<u32, String> {
    let trimmed = text.trim();
    if let Some(hex) = trimmed.strip_prefix("0x").or_else(|| trimmed.strip_prefix("0X")) {
        return u32::from_str_radix(hex, 16).map_err(|_| "invalid hex".to_string());
    }
    if let Some(bin) = trimmed.strip_prefix("0b").or_else(|| trimmed.strip_prefix("0B")) {
        return u32::from_str_radix(bin, 2).map_err(|_| "invalid bin".to_string());
    }
    trimmed
        .parse::<u32>()
        .map_err(|_| "invalid number".to_string())
}

fn parse_bool(text: &str) -> Result<bool, String> {
    match text {
        "1" | "true" | "TRUE" => Ok(true),
        "0" | "false" | "FALSE" => Ok(false),
        _ => Err("invalid bool".to_string()),
    }
}

fn parse_quoted(text: &str) -> Result<String, String> {
    let trimmed = text.trim();
    if !trimmed.starts_with('"') || !trimmed.ends_with('"') {
        return Err("expected quoted string".to_string());
    }
    let inner = &trimmed[1..trimmed.len() - 1];
    let mut out = String::new();
    let mut chars = inner.chars();
    while let Some(ch) = chars.next() {
        if ch == '\\' {
            let esc = chars.next().ok_or_else(|| "bad escape".to_string())?;
            match esc {
                'n' => out.push('\n'),
                'r' => out.push('\r'),
                't' => out.push('\t'),
                '\\' => out.push('\\'),
                '"' => out.push('"'),
                '0' => out.push('\0'),
                _ => return Err("bad escape".to_string()),
            }
        } else {
            out.push(ch);
        }
    }
    Ok(out)
}

fn line_err(line_no: usize, msg: &str) -> String {
    format!("line {}: {}", line_no + 1, msg)
}

fn script_err(line_no: usize, msg: &str) -> AsmError {
    AsmError::code("E3001", format!("line {}: {}", line_no + 1, msg))
}
