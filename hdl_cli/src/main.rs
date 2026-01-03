use hdl_core::elab::elaborate;
use hdl_core::parser::parse_str;
use hdl_core::sim::Simulator;
use hdl_core::value::BitVec;
use std::env;
use std::fs;

fn main() {
    if let Err(err) = run() {
        eprintln!("error: {}", err);
        std::process::exit(1);
    }
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("usage: hdl_cli <test.tst>");
        std::process::exit(2);
    }
    let test_path = &args[1];
    let script = fs::read_to_string(test_path)?;
    let mut sim: Option<Simulator> = None;
    let mut clock_name: String = "clk".to_string();

    for (line_no, raw) in script.lines().enumerate() {
        let line = raw.trim();
        if line.is_empty() || line.starts_with("#") || line.starts_with("//") || line.starts_with("--") {
            continue;
        }
        let mut parts = line.split_whitespace();
        let cmd = match parts.next() {
            Some(c) => c,
            None => continue,
        };
        match cmd {
            "load" => {
                let top = parts.next().ok_or("load requires top entity")?;
                let files: Vec<String> = parts.map(|s| s.to_string()).collect();
                if files.is_empty() {
                    return Err("load requires at least one file".into());
                }
                let mut design = hdl_core::ast::Design { entities: Vec::new(), architectures: Vec::new() };
                for file in files {
                    let src = fs::read_to_string(&file)?;
                    let d = parse_str(&src)?;
                    design.entities.extend(d.entities);
                    design.architectures.extend(d.architectures);
                }
                let netlist = elaborate(&design, top)?;
                sim = Some(Simulator::new(netlist));
            }
            "clock" => {
                clock_name = parts.next().ok_or("clock requires signal name")?.to_string();
            }
            "set" => {
                let name = parts.next().ok_or("set requires signal")?;
                let value_str = parts.collect::<Vec<&str>>().join(" ");
                let value = parse_value(&value_str)?;
                sim.as_mut().ok_or("simulator not loaded")?.set_signal(name, value)?;
            }
            "eval" => {
                sim.as_mut().ok_or("simulator not loaded")?.eval_comb()?;
            }
            "tick" => {
                if let Some(ref mut s) = sim {
                    s.set_signal(&clock_name, BitVec::new(1, 1))?;
                    s.tick()?;
                } else {
                    return Err("simulator not loaded".into());
                }
            }
            "tock" => {
                if let Some(ref mut s) = sim {
                    s.set_signal(&clock_name, BitVec::new(1, 0))?;
                    s.tock()?;
                } else {
                    return Err("simulator not loaded".into());
                }
            }
            "step" => {
                if let Some(ref mut s) = sim {
                    s.set_signal(&clock_name, BitVec::new(1, 1))?;
                    s.tick()?;
                    s.set_signal(&clock_name, BitVec::new(1, 0))?;
                    s.tock()?;
                } else {
                    return Err("simulator not loaded".into());
                }
            }
            "expect" => {
                let name = parts.next().ok_or("expect requires signal")?;
                let value_str = parts.collect::<Vec<&str>>().join(" ");
                let expected = parse_value(&value_str)?;
                let got = sim.as_ref().ok_or("simulator not loaded")?.get_signal(name)?;
                let resized = expected.resize_zero(got.width());
                if resized != got {
                    return Err(format!("line {}: expect {} != got", line_no + 1, name).into());
                }
            }
            _ => return Err(format!("unknown command: {}", cmd).into()),
        }
    }

    Ok(())
}

fn parse_value(s: &str) -> Result<BitVec, Box<dyn std::error::Error>> {
    let t = s.trim();
    if t.starts_with("b\"") && t.ends_with('"') {
        let inner = &t[2..t.len() - 1];
        return Ok(BitVec::from_bits_msb(inner)?);
    }
    if t.starts_with("x\"") && t.ends_with('"') {
        let inner = &t[2..t.len() - 1];
        return Ok(BitVec::from_hex_msb(inner)?);
    }
    if t.starts_with("0x") || t.starts_with("0X") {
        let inner = &t[2..];
        return Ok(BitVec::from_hex_msb(inner)?);
    }
    if t.starts_with("0b") || t.starts_with("0B") {
        let inner = &t[2..];
        return Ok(BitVec::from_bits_msb(inner)?);
    }
    if t == "0" || t == "1" {
        return Ok(BitVec::new(1, if t == "1" { 1 } else { 0 }));
    }
    let val: i64 = t.parse()?;
    Ok(BitVec::from_i64(32, val))
}
