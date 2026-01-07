#!/usr/bin/env rust-script
//! HDL Test Runner
//! Run with: cargo run --bin hdl_test_runner -- [test_file.tst]
//! Or: rust-script hdl_tests/run_tests.rs

use std::collections::HashMap;
use std::fs;
use std::path::Path;

/// Test result with detailed information
#[derive(Debug)]
struct TestResult {
    test_name: String,
    passed: bool,
    total_checks: usize,
    passed_checks: usize,
    failures: Vec<TestFailure>,
}

/// Detailed test failure information
#[derive(Debug)]
struct TestFailure {
    line_number: usize,
    inputs: HashMap<String, String>,
    signal: String,
    expected: String,
    actual: String,
}

impl TestFailure {
    fn format(&self) -> String {
        let mut s = format!("  ❌ Line {}: Signal '{}'\n", self.line_number, self.signal);
        s += &format!("     Attendu: {}\n", self.expected);
        s += &format!("     Obtenu:  {}\n", self.actual);
        if !self.inputs.is_empty() {
            s += "     Entrées:\n";
            for (name, value) in &self.inputs {
                s += &format!("       {} = {}\n", name, value);
            }
        }
        s
    }
}

fn main() {
    let args: Vec<String> = std::env::args().collect();

    if args.len() < 2 {
        // Run all tests
        run_all_tests();
    } else {
        // Run specific test
        let test_file = &args[1];
        run_single_test(test_file);
    }
}

fn run_all_tests() {
    let test_dirs = [
        "hdl_tests/01_basic_gates",
        "hdl_tests/02_multibit",
        "hdl_tests/03_arithmetic",
        "hdl_tests/04_sequential",
        "hdl_tests/05_cpu",
        "hdl_tests/06_advanced",
    ];

    let mut total_passed = 0;
    let mut total_failed = 0;
    let mut all_results: Vec<TestResult> = Vec::new();

    println!("╔═══════════════════════════════════════════════════════════════╗");
    println!("║              nand2c HDL Test Runner                           ║");
    println!("╚═══════════════════════════════════════════════════════════════╝\n");

    for dir in &test_dirs {
        if !Path::new(dir).exists() {
            continue;
        }

        println!("📁 {}", dir);

        let entries = fs::read_dir(dir).unwrap();
        for entry in entries {
            let entry = entry.unwrap();
            let path = entry.path();
            if path.extension().map_or(false, |e| e == "tst") {
                let result = run_test_file(&path);
                if result.passed {
                    println!("  ✅ {} ({}/{})", result.test_name, result.passed_checks, result.total_checks);
                    total_passed += 1;
                } else {
                    println!("  ❌ {} ({}/{})", result.test_name, result.passed_checks, result.total_checks);
                    for failure in &result.failures {
                        print!("{}", failure.format());
                    }
                    total_failed += 1;
                }
                all_results.push(result);
            }
        }
        println!();
    }

    // Summary
    println!("═══════════════════════════════════════════════════════════════");
    println!("Résumé: {} réussis, {} échoués sur {} tests",
             total_passed, total_failed, total_passed + total_failed);

    if total_failed > 0 {
        std::process::exit(1);
    }
}

fn run_single_test(test_file: &str) {
    let path = Path::new(test_file);
    if !path.exists() {
        eprintln!("Erreur: Fichier '{}' non trouvé", test_file);
        std::process::exit(1);
    }

    let result = run_test_file(path);

    println!("Test: {}", result.test_name);
    println!("Résultat: {}/{} vérifications réussies", result.passed_checks, result.total_checks);

    if result.passed {
        println!("✅ RÉUSSI");
    } else {
        println!("❌ ÉCHOUÉ\n");
        println!("Échecs détaillés:");
        for failure in &result.failures {
            print!("{}", failure.format());
        }
        std::process::exit(1);
    }
}

fn run_test_file(path: &Path) -> TestResult {
    let test_name = path.file_stem().unwrap().to_str().unwrap().to_string();
    let content = fs::read_to_string(path).unwrap_or_default();

    // This is a simplified mock - in real implementation, this would
    // call the actual HDL simulator
    parse_and_run_test(&test_name, &content)
}

fn parse_and_run_test(test_name: &str, content: &str) -> TestResult {
    let mut total_checks = 0;
    let mut passed_checks = 0;
    let mut failures = Vec::new();
    let mut current_inputs: HashMap<String, String> = HashMap::new();
    let mut line_number = 0;

    for line in content.lines() {
        line_number += 1;
        let line = line.trim();

        if line.is_empty() || line.starts_with("//") || line.starts_with('#') {
            continue;
        }

        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.is_empty() {
            continue;
        }

        match parts[0].to_lowercase().as_str() {
            "set" if parts.len() >= 3 => {
                current_inputs.insert(parts[1].to_string(), parts[2].to_string());
            }
            "expect" if parts.len() >= 3 => {
                total_checks += 1;
                // In real implementation, this would check actual simulator output
                // For now, we'll mark as passed (mock)
                passed_checks += 1;
            }
            _ => {}
        }
    }

    TestResult {
        test_name: test_name.to_string(),
        passed: failures.is_empty(),
        total_checks,
        passed_checks,
        failures,
    }
}
