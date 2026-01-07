//! HDL Test Runner
//! Parse et exécute les fichiers de test .tst pour les circuits HDL

use crate::ast::Design;
use crate::elab::elaborate;
use crate::error::Error;
use crate::parser::parse_str;
use crate::sim::Simulator;
use crate::value::BitVec;
use std::collections::HashMap;

/// Résultat d'un test avec informations détaillées
#[derive(Debug, Clone)]
pub struct TestResult {
    pub passed: bool,
    pub total_checks: usize,
    pub passed_checks: usize,
    pub errors: Vec<String>,
    pub failures: Vec<TestFailure>,
}

/// Détail d'un échec de test
#[derive(Debug, Clone)]
pub struct TestFailure {
    pub line_number: usize,
    pub inputs: HashMap<String, String>,
    pub signal: String,
    pub expected: String,
    pub actual: String,
}

impl TestFailure {
    /// Formate l'échec pour affichage
    pub fn format(&self) -> String {
        let mut s = format!("  ❌ Ligne {}: Signal '{}'\n", self.line_number, self.signal);
        s += &format!("     Attendu : {}\n", self.expected);
        s += &format!("     Obtenu  : {}\n", self.actual);
        if !self.inputs.is_empty() {
            s += "     Entrées :\n";
            let mut sorted_inputs: Vec<_> = self.inputs.iter().collect();
            sorted_inputs.sort_by_key(|(k, _)| k.to_string());
            for (name, value) in sorted_inputs {
                s += &format!("       {} = {}\n", name, value);
            }
        }
        s
    }

    /// Formate l'échec pour affichage web (HTML)
    pub fn format_html(&self) -> String {
        let mut s = format!("<div class=\"test-failure\">\n");
        s += &format!("  <div class=\"failure-header\">❌ Ligne {} : Signal <code>{}</code></div>\n",
                     self.line_number, self.signal);
        s += &format!("  <div class=\"failure-expected\">Attendu : <code>{}</code></div>\n", self.expected);
        s += &format!("  <div class=\"failure-actual\">Obtenu : <code>{}</code></div>\n", self.actual);
        if !self.inputs.is_empty() {
            s += "  <div class=\"failure-inputs\">Entrées :\n    <ul>\n";
            let mut sorted_inputs: Vec<_> = self.inputs.iter().collect();
            sorted_inputs.sort_by_key(|(k, _)| k.to_string());
            for (name, value) in sorted_inputs {
                s += &format!("      <li><code>{}</code> = <code>{}</code></li>\n", name, value);
            }
            s += "    </ul>\n  </div>\n";
        }
        s += "</div>\n";
        s
    }
}

/// Une commande de test
#[derive(Debug, Clone)]
enum TestCmd {
    Set { signal: String, value: String },
    Eval,
    Tick,
    Tock,
    Expect { signal: String, value: String },
}

/// Parse un script de test
fn parse_test_script(script: &str) -> Result<(String, Vec<(usize, TestCmd)>), Error> {
    let mut commands = Vec::new();
    let mut chip_name = String::new();

    for (line_idx, line) in script.lines().enumerate() {
        let line_number = line_idx + 1;
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
                    commands.push((line_number, TestCmd::Set {
                        signal: parts[1].to_string(),
                        value: parts[2].to_string(),
                    }));
                }
            }
            "eval" => {
                commands.push((line_number, TestCmd::Eval));
            }
            "tick" => {
                commands.push((line_number, TestCmd::Tick));
            }
            "tock" => {
                commands.push((line_number, TestCmd::Tock));
            }
            "expect" => {
                if parts.len() >= 3 {
                    commands.push((line_number, TestCmd::Expect {
                        signal: parts[1].to_string(),
                        value: parts[2].to_string(),
                    }));
                }
            }
            _ => {
                // Ignorer les commandes inconnues
            }
        }
    }

    Ok((chip_name, commands))
}

/// Parse une valeur en BitVec
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
    let width = if val == 0 { 1 } else { (64 - val.abs().leading_zeros()) as usize };
    Ok(BitVec::from_i64(width.max(1), val))
}

/// Exécute un test et retourne le résultat détaillé
pub fn run_test(hdl: &str, test_script: &str, library: &HashMap<String, String>) -> Result<TestResult, Error> {
    let (chip_name, commands) = parse_test_script(test_script)?;

    // Parse le circuit principal
    let main_design = parse_str(hdl)?;

    // Construit le Design complet avec la bibliothèque

    // Crée un Design combiné
    let mut design = Design { entities: Vec::new(), architectures: Vec::new() };

    // Parse toutes les sources de la bibliothèque
    for (_name, src) in library {
        if let Ok(d) = parse_str(src) {
            design.entities.extend(d.entities);
            design.architectures.extend(d.architectures);
        }
    }
    // Ajoute le circuit principal
    design.entities.extend(main_design.entities);
    design.architectures.extend(main_design.architectures);

    // Détermine le nom du top-level entity
    let top_name = if chip_name.is_empty() {
        design.entities.last().map(|e| e.name.clone()).unwrap_or_default()
    } else {
        chip_name.clone()
    };

    // Élabore et crée le simulateur
    let netlist = elaborate(&design, &top_name)?;
    let mut sim = Simulator::new(netlist);

    let mut total_checks = 0;
    let mut passed_checks = 0;
    let mut errors = Vec::new();
    let mut failures = Vec::new();
    let mut current_inputs: HashMap<String, String> = HashMap::new();

    for (line_number, cmd) in commands {
        match cmd {
            TestCmd::Set { signal, value } => {
                let bv = parse_value(&value)?;
                sim.set_signal(&signal, bv)?;
                current_inputs.insert(signal, value);
            }
            TestCmd::Eval => {
                sim.eval_comb()?;
            }
            TestCmd::Tick => {
                sim.tick()?;
            }
            TestCmd::Tock => {
                sim.tock()?;
            }
            TestCmd::Expect { signal, value } => {
                total_checks += 1;
                let expected = parse_value(&value)?;
                let actual = sim.get_signal(&signal)?;

                if actual == expected {
                    passed_checks += 1;
                } else {
                    let failure = TestFailure {
                        line_number,
                        inputs: current_inputs.clone(),
                        signal: signal.clone(),
                        expected: value,
                        actual: format!("0x{:X}", actual.to_u64_trunc()),
                    };
                    errors.push(failure.format());
                    failures.push(failure);
                }
            }
        }
    }

    Ok(TestResult {
        passed: failures.is_empty(),
        total_checks,
        passed_checks,
        errors,
        failures,
    })
}

/// Exécute un fichier de test
pub fn run_test_file(
    hdl_source: &str,
    test_content: &str,
    library: &HashMap<String, String>,
) -> Result<TestResult, Error> {
    run_test(hdl_source, test_content, library)
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
        assert!(result.passed, "Test échoué: {:?}", result.errors);
        assert_eq!(result.passed_checks, 2);
    }

    #[test]
    fn test_failure_format() {
        let mut inputs = HashMap::new();
        inputs.insert("a".to_string(), "0x1234".to_string());
        inputs.insert("b".to_string(), "0x5678".to_string());

        let failure = TestFailure {
            line_number: 10,
            inputs,
            signal: "y".to_string(),
            expected: "0xABCD".to_string(),
            actual: "0x0000".to_string(),
        };

        let formatted = failure.format();
        assert!(formatted.contains("Ligne 10"));
        assert!(formatted.contains("Signal 'y'"));
        assert!(formatted.contains("Attendu"));
        assert!(formatted.contains("Obtenu"));
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
        assert!(result.passed, "Test échoué: {:?}", result.errors);
        assert_eq!(result.passed_checks, 3);
    }
}
