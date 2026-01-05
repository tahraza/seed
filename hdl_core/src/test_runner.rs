//! HDL Test Runner
//! Parses and executes .tst test files for HDL chips

use crate::elab::elaborate;
use crate::error::Error;
use crate::parser::parse_str;
use crate::sim::Simulator;
use crate::value::BitVec;
use std::collections::HashMap;

/// Result of running a test
#[derive(Debug, Clone)]
pub struct TestResult {
    pub passed: bool,
    pub total_checks: usize,
    pub passed_checks: usize,
    pub errors: Vec<String>,
}

/// A single test command
#[derive(Debug, Clone)]
enum TestCmd {
    Set { signal: String, value: String },
    Eval,
    Tick,
    Tock,
    Expect { signal: String, value: String },
}

/// Parse a test script
fn parse_test_script(script: &str) -> Result<(String, Vec<TestCmd>), Error> {
    let mut commands = Vec::new();
    let mut chip_name = String::new();

    for line in script.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with("//") || line.starts_with('#') {
            continue;
        }

        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.is_empty() {
            continue;
        }

        match parts[0].to_lowercase().as_str() {
            "load" => {
                if parts.len() >= 2 {
                    chip_name = parts[1].to_string();
                }
            }
            "set" => {
                if parts.len() >= 3 {
                    commands.push(TestCmd::Set {
                        signal: parts[1].to_string(),
                        value: parts[2].to_string(),
                    });
                }
            }
            "eval" => {
                commands.push(TestCmd::Eval);
            }
            "tick" => {
                commands.push(TestCmd::Tick);
            }
            "tock" => {
                commands.push(TestCmd::Tock);
            }
            "expect" => {
                if parts.len() >= 3 {
                    commands.push(TestCmd::Expect {
                        signal: parts[1].to_string(),
                        value: parts[2].to_string(),
                    });
                }
            }
            _ => {
                // Ignore unknown commands
            }
        }
    }

    Ok((chip_name, commands))
}

/// Parse a value string to BitVec
fn parse_value(input: &str) -> Result<BitVec, Error> {
    let t = input.trim();
    if t.starts_with("0b") || t.starts_with("0B") {
        let inner = &t[2..];
        return BitVec::from_bits_msb(inner).map_err(|e| Error::new(e.to_string()));
    }
    if t.starts_with("0x") || t.starts_with("0X") {
        let inner = &t[2..];
        return BitVec::from_hex_msb(inner).map_err(|e| Error::new(e.to_string()));
    }
    if t == "0" || t == "1" {
        return Ok(BitVec::new(1, if t == "1" { 1 } else { 0 }));
    }
    let val: i64 = t.parse::<i64>().map_err(|e| Error::new(e.to_string()))?;
    Ok(BitVec::from_i64(32, val))
}

/// Format BitVec for comparison
fn format_bits(bits: &BitVec) -> String {
    let mut out = String::with_capacity(bits.width() + 2);
    out.push_str("0b");
    for i in (0..bits.width()).rev() {
        out.push(if bits.get(i) == 0 { '0' } else { '1' });
    }
    out
}

/// Run a test script against an HDL source
///
/// # Arguments
/// * `hdl_source` - The HDL source code of the chip under test
/// * `test_script` - The test script (.tst content)
/// * `library` - Map of chip name -> HDL source for dependencies
pub fn run_test(
    hdl_source: &str,
    test_script: &str,
    library: &HashMap<String, String>,
) -> Result<TestResult, Error> {
    let (chip_name, commands) = parse_test_script(test_script)?;

    // Parse the main HDL source
    let mut design = parse_str(hdl_source)?;

    // Parse and add library dependencies
    for (_name, lib_source) in library {
        let lib_design = parse_str(lib_source)?;
        design.entities.extend(lib_design.entities);
        design.architectures.extend(lib_design.architectures);
    }

    // Determine the top entity name
    let top_name = if !chip_name.is_empty() {
        chip_name
    } else {
        // Use first entity in the design
        design.entities.first()
            .map(|e| e.name.clone())
            .ok_or_else(|| Error::new("no entity found"))?
    };

    // Elaborate the design
    let netlist = elaborate(&design, &top_name)?;
    let mut sim = Simulator::new(netlist);

    // Run test commands
    let mut result = TestResult {
        passed: true,
        total_checks: 0,
        passed_checks: 0,
        errors: Vec::new(),
    };

    for cmd in commands {
        match cmd {
            TestCmd::Set { signal, value } => {
                let v = parse_value(&value)?;
                if let Err(e) = sim.set_signal(&signal, v) {
                    result.errors.push(format!("set {}: {}", signal, e));
                    result.passed = false;
                }
            }
            TestCmd::Eval => {
                if let Err(e) = sim.eval_comb() {
                    result.errors.push(format!("eval: {}", e));
                    result.passed = false;
                }
            }
            TestCmd::Tick => {
                if let Err(e) = sim.tick() {
                    result.errors.push(format!("tick: {}", e));
                    result.passed = false;
                }
            }
            TestCmd::Tock => {
                if let Err(e) = sim.tock() {
                    result.errors.push(format!("tock: {}", e));
                    result.passed = false;
                }
            }
            TestCmd::Expect { signal, value } => {
                result.total_checks += 1;
                let expected = parse_value(&value)?;
                match sim.get_signal(&signal) {
                    Ok(actual) => {
                        if actual == expected {
                            result.passed_checks += 1;
                        } else {
                            result.passed = false;
                            result.errors.push(format!(
                                "expect {}: got {}, expected {}",
                                signal,
                                format_bits(&actual),
                                format_bits(&expected)
                            ));
                        }
                    }
                    Err(e) => {
                        result.passed = false;
                        result.errors.push(format!("expect {}: {}", signal, e));
                    }
                }
            }
        }
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_not_gate() {
        let hdl = r#"
entity NotGate is
  port(
    a : in bit;
    y : out bit
  );
end entity;

architecture rtl of NotGate is
  component nand2
    port(a : in bit; b : in bit; y : out bit);
  end component;
begin
  u_nand: nand2 port map (a => a, b => a, y => y);
end architecture;
"#;

        let test_script = r#"
load NotGate
set a 0
eval
expect y 1
set a 1
eval
expect y 0
"#;

        let library = HashMap::new();
        let result = run_test(hdl, test_script, &library).unwrap();
        assert!(result.passed, "Test failed: {:?}", result.errors);
        assert_eq!(result.passed_checks, 2);
    }

    #[test]
    fn test_inv16() {
        let inv_hdl = r#"
entity Inv is
  port(a : in bit; y : out bit);
end entity;

architecture rtl of Inv is
  component nand2
    port(a : in bit; b : in bit; y : out bit);
  end component;
begin
  u0: nand2 port map (a => a, b => a, y => y);
end architecture;
"#;

        let inv16_hdl = r#"
entity Inv16 is
  port(
    a : in bits(15 downto 0);
    y : out bits(15 downto 0)
  );
end entity;

architecture rtl of Inv16 is
  component Inv
    port(a : in bit; y : out bit);
  end component;
begin
  u0: Inv port map (a => a(0), y => y(0));
  u1: Inv port map (a => a(1), y => y(1));
  u2: Inv port map (a => a(2), y => y(2));
  u3: Inv port map (a => a(3), y => y(3));
  u4: Inv port map (a => a(4), y => y(4));
  u5: Inv port map (a => a(5), y => y(5));
  u6: Inv port map (a => a(6), y => y(6));
  u7: Inv port map (a => a(7), y => y(7));
  u8: Inv port map (a => a(8), y => y(8));
  u9: Inv port map (a => a(9), y => y(9));
  u10: Inv port map (a => a(10), y => y(10));
  u11: Inv port map (a => a(11), y => y(11));
  u12: Inv port map (a => a(12), y => y(12));
  u13: Inv port map (a => a(13), y => y(13));
  u14: Inv port map (a => a(14), y => y(14));
  u15: Inv port map (a => a(15), y => y(15));
end architecture;
"#;

        let test_script = r#"
load Inv16
set a 0x0000
eval
expect y 0xFFFF
set a 0xFFFF
eval
expect y 0x0000
set a 0xAAAA
eval
expect y 0x5555
"#;

        let mut library = HashMap::new();
        library.insert("Inv".to_string(), inv_hdl.to_string());

        let result = run_test(inv16_hdl, test_script, &library).unwrap();
        assert!(result.passed, "Test failed: {:?}", result.errors);
        assert_eq!(result.passed_checks, 3);
    }
}
