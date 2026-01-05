use hdl_core::ast::Design;
use hdl_core::elab::elaborate;
use hdl_core::parser::parse_str;
use hdl_core::sim::Simulator;
use hdl_core::value::BitVec;
use a32_core::{Machine, Reg, SimConfig, StepOutcome, SCREEN_WIDTH, SCREEN_HEIGHT};

pub struct HdlSession {
    sim: Option<Simulator>,
    clock_name: String,
}

impl HdlSession {
    pub fn new() -> Self {
        Self {
            sim: None,
            clock_name: "clk".to_string(),
        }
    }

    pub fn load(&mut self, top: &str, sources: &[String]) -> Result<(), String> {
        if sources.is_empty() {
            return Err("load requires at least one source".to_string());
        }
        let mut design = Design {
            entities: Vec::new(),
            architectures: Vec::new(),
        };
        for src in sources {
            let d = parse_str(src).map_err(|e| e.to_string())?;
            design.entities.extend(d.entities);
            design.architectures.extend(d.architectures);
        }
        let netlist = elaborate(&design, top).map_err(|e| e.to_string())?;
        self.sim = Some(Simulator::new(netlist));
        Ok(())
    }

    pub fn set_signal(&mut self, name: &str, value: &str) -> Result<(), String> {
        let sim = self.sim.as_mut().ok_or("simulator not loaded")?;
        let v = parse_value(value)?;
        sim.set_signal(name, v).map_err(|e| e.to_string())
    }

    pub fn set_clock(&mut self, name: &str) {
        let trimmed = name.trim();
        if trimmed.is_empty() {
            return;
        }
        self.clock_name = trimmed.to_string();
    }

    pub fn get_signal(&self, name: &str) -> Result<String, String> {
        let sim = self.sim.as_ref().ok_or("simulator not loaded")?;
        let v = sim.get_signal(name).map_err(|e| e.to_string())?;
        Ok(format_value(&v))
    }

    pub fn eval(&mut self) -> Result<(), String> {
        let sim = self.sim.as_mut().ok_or("simulator not loaded")?;
        sim.eval_comb().map_err(|e| e.to_string())
    }

    pub fn tick(&mut self) -> Result<(), String> {
        let sim = self.sim.as_mut().ok_or("simulator not loaded")?;
        let clock = self.clock_name.clone();
        sim.set_signal(&clock, BitVec::new(1, 1))
            .map_err(|e| e.to_string())?;
        sim.tick().map_err(|e| e.to_string())
    }

    pub fn tock(&mut self) -> Result<(), String> {
        let sim = self.sim.as_mut().ok_or("simulator not loaded")?;
        let clock = self.clock_name.clone();
        sim.set_signal(&clock, BitVec::new(1, 0))
            .map_err(|e| e.to_string())?;
        sim.tock().map_err(|e| e.to_string())
    }
}

pub struct A32Session {
    machine: Option<Machine>,
    pub program: Option<Vec<u8>>,
    config: SimConfig,
}

impl A32Session {
    pub fn new() -> Self {
        Self {
            machine: None,
            program: None,
            config: SimConfig::default(),
        }
    }

    pub fn load_a32b(
        &mut self,
        bytes: &[u8],
        ram_size: u32,
        strict_traps: bool,
    ) -> Result<(), String> {
        let mut config = SimConfig::default();
        if ram_size != 0 {
            config.ram_size = ram_size;
        }
        config.strict_traps = strict_traps;
        let machine = Machine::from_a32b(bytes, config.clone()).map_err(|e| e.to_string())?;
        self.machine = Some(machine);
        self.program = Some(bytes.to_vec());
        self.config = config;
        Ok(())
    }

    pub fn reset(&mut self) -> Result<(), String> {
        let bytes = self.program.as_ref().ok_or("program not loaded")?;
        let machine = Machine::from_a32b(bytes, self.config.clone()).map_err(|e| e.to_string())?;
        self.machine = Some(machine);
        Ok(())
    }

    pub fn step(&mut self) -> Result<String, String> {
        let machine = self.machine.as_mut().ok_or("program not loaded")?;
        let outcome = machine.step();
        Ok(format_outcome(outcome))
    }

    pub fn run(&mut self, max_steps: u32) -> Result<String, String> {
        let machine = self.machine.as_mut().ok_or("program not loaded")?;
        let limit = if max_steps == 0 {
            self.config.max_steps
        } else {
            max_steps as u64
        };
        let outcome = machine.run(limit).map_err(|e| e.to_string())?;
        if let Some(exit) = outcome.exit {
            return Ok(format!("exit {}", exit.code));
        }
        if let Some(trap) = outcome.trap {
            return Ok(format!("trap {}", trap.code.as_str()));
        }
        Ok("running".to_string())
    }

    pub fn output(&self) -> Result<String, String> {
        let machine = self.machine.as_ref().ok_or("program not loaded")?;
        Ok(machine.output_string())
    }

    /// Get screen dimensions
    pub fn screen_size(&self) -> (u32, u32) {
        (SCREEN_WIDTH, SCREEN_HEIGHT)
    }

    /// Get screen framebuffer as bytes
    pub fn screen(&self) -> Result<Vec<u8>, String> {
        let machine = self.machine.as_ref().ok_or("program not loaded")?;
        Ok(machine.screen().to_vec())
    }

    /// Check if screen has been modified
    pub fn screen_dirty(&self) -> Result<bool, String> {
        let machine = self.machine.as_ref().ok_or("program not loaded")?;
        Ok(machine.screen_dirty())
    }

    /// Clear screen dirty flag
    pub fn clear_screen_dirty(&mut self) -> Result<(), String> {
        let machine = self.machine.as_mut().ok_or("program not loaded")?;
        machine.clear_screen_dirty();
        Ok(())
    }

    /// Set keyboard key (0 = no key)
    pub fn set_key(&mut self, key: u32) -> Result<(), String> {
        let machine = self.machine.as_mut().ok_or("program not loaded")?;
        machine.set_key(key);
        Ok(())
    }

    /// Get current keyboard key
    pub fn get_key(&self) -> Result<u32, String> {
        let machine = self.machine.as_ref().ok_or("program not loaded")?;
        Ok(machine.get_key())
    }

    /// Get register value by index (0-15)
    pub fn reg(&self, index: u32) -> Result<u32, String> {
        let machine = self.machine.as_ref().ok_or("program not loaded")?;
        let reg = Reg::from_u8(index as u8)
            .ok_or_else(|| format!("invalid register index: {}", index))?;
        Ok(machine.get_reg(reg))
    }

    /// Read a 32-bit word from memory
    pub fn read_word(&self, addr: u32) -> Result<u32, String> {
        let machine = self.machine.as_ref().ok_or("program not loaded")?;
        machine.read_u32(addr).ok_or_else(|| format!("invalid address: 0x{:08x}", addr))
    }

    /// Get CPU flags as a u8 bitmask: bit0=N, bit1=Z, bit2=C, bit3=V
    pub fn flags(&self) -> Result<u8, String> {
        let machine = self.machine.as_ref().ok_or("program not loaded")?;
        let f = machine.flags();
        let mut result: u8 = 0;
        if f.n { result |= 1; }
        if f.z { result |= 2; }
        if f.c { result |= 4; }
        if f.v { result |= 8; }
        Ok(result)
    }

    /// Get cache statistics as [hits, misses]
    pub fn cache_stats(&self) -> Result<(u64, u64), String> {
        let machine = self.machine.as_ref().ok_or("program not loaded")?;
        let stats = machine.cache_stats();
        Ok((stats.hits, stats.misses))
    }

    /// Get number of cache lines
    pub fn cache_num_lines(&self) -> Result<usize, String> {
        let machine = self.machine.as_ref().ok_or("program not loaded")?;
        Ok(machine.cache().num_lines())
    }

    /// Get cache line state: returns (valid, tag, first 4 bytes as u32) or None
    pub fn cache_line(&self, index: usize) -> Result<Option<(bool, u32, u32)>, String> {
        let machine = self.machine.as_ref().ok_or("program not loaded")?;
        if let Some((valid, tag, data)) = machine.cache().get_line_state(index) {
            // Return first 4 bytes as a word for display
            let word = u32::from_le_bytes([data[0], data[1], data[2], data[3]]);
            Ok(Some((valid, tag, word)))
        } else {
            Ok(None)
        }
    }
}

fn format_outcome(outcome: StepOutcome) -> String {
    match outcome {
        StepOutcome::Continue => "running".to_string(),
        StepOutcome::Exit(exit) => format!("exit {}", exit.code),
        StepOutcome::Trap(trap) => format!("trap {}", trap.code.as_str()),
    }
}

fn parse_value(input: &str) -> Result<BitVec, String> {
    let t = input.trim();
    if t.starts_with("b\"") && t.ends_with('"') {
        let inner = &t[2..t.len() - 1];
        return BitVec::from_bits_msb(inner).map_err(|e| e.to_string());
    }
    if t.starts_with("x\"") && t.ends_with('"') {
        let inner = &t[2..t.len() - 1];
        return BitVec::from_hex_msb(inner).map_err(|e| e.to_string());
    }
    if t.starts_with("0x") || t.starts_with("0X") {
        let inner = &t[2..];
        return BitVec::from_hex_msb(inner).map_err(|e| e.to_string());
    }
    if t.starts_with("0b") || t.starts_with("0B") {
        let inner = &t[2..];
        return BitVec::from_bits_msb(inner).map_err(|e| e.to_string());
    }
    if t == "0" || t == "1" {
        return Ok(BitVec::new(1, if t == "1" { 1 } else { 0 }));
    }
    let val: i64 = t.parse::<i64>().map_err(|e| e.to_string())?;
    Ok(BitVec::from_i64(32, val))
}

fn format_value(bits: &BitVec) -> String {
    let mut out = String::with_capacity(bits.width() + 2);
    out.push_str("0b");
    for i in (0..bits.width()).rev() {
        out.push(if bits.get(i) == 0 { '0' } else { '1' });
    }
    out
}

#[cfg(feature = "wasm")]
mod wasm_api {
    use super::{A32Session, HdlSession};
    use a32_asm::assemble_a32b;
    use c32_core::{compile_to_a32, parse_program};
    use hdl_core::run_test;
    use std::collections::HashMap;
    use wasm_bindgen::prelude::*;
    use js_sys;

    #[wasm_bindgen]
    pub struct WasmHdl {
        inner: HdlSession,
    }

    #[wasm_bindgen]
    impl WasmHdl {
        #[wasm_bindgen(constructor)]
        pub fn new() -> WasmHdl {
            WasmHdl {
                inner: HdlSession::new(),
            }
        }

        pub fn load(&mut self, top: &str, sources: Vec<String>) -> Result<(), JsValue> {
            self.inner.load(top, &sources).map_err(js_err)
        }

        pub fn set_clock(&mut self, name: &str) {
            self.inner.set_clock(name);
        }

        pub fn set_signal(&mut self, name: &str, value: &str) -> Result<(), JsValue> {
            self.inner.set_signal(name, value).map_err(js_err)
        }

        pub fn get_signal(&self, name: &str) -> Result<String, JsValue> {
            self.inner.get_signal(name).map_err(js_err)
        }

        pub fn eval(&mut self) -> Result<(), JsValue> {
            self.inner.eval().map_err(js_err)
        }

        pub fn tick(&mut self) -> Result<(), JsValue> {
            self.inner.tick().map_err(js_err)
        }

        pub fn tock(&mut self) -> Result<(), JsValue> {
            self.inner.tock().map_err(js_err)
        }

        /// Run a test script against HDL source
        /// Returns JSON: { passed: bool, total: number, passed_checks: number, errors: string[] }
        pub fn run_test(
            &self,
            hdl_source: &str,
            test_script: &str,
            library_json: &str,
        ) -> Result<String, JsValue> {
            // Parse library from JSON (map of chip name -> HDL source)
            let library: HashMap<String, String> = if library_json.is_empty() {
                HashMap::new()
            } else {
                serde_json_wasm::from_str(library_json)
                    .map_err(|e| js_err(format!("invalid library JSON: {}", e)))?
            };

            let result = run_test(hdl_source, test_script, &library)
                .map_err(|e| js_err(e.to_string()))?;

            // Return as JSON
            let json = format!(
                r#"{{"passed":{},"total":{},"passed_checks":{},"errors":{}}}"#,
                result.passed,
                result.total_checks,
                result.passed_checks,
                serde_json_wasm::to_string(&result.errors)
                    .unwrap_or_else(|_| "[]".to_string())
            );
            Ok(json)
        }
    }

    #[wasm_bindgen]
    pub struct WasmA32 {
        inner: A32Session,
    }

    #[wasm_bindgen]
    impl WasmA32 {
        #[wasm_bindgen(constructor)]
        pub fn new() -> WasmA32 {
            WasmA32 {
                inner: A32Session::new(),
            }
        }

        pub fn load_a32b(
            &mut self,
            bytes: Vec<u8>,
            ram_size: u32,
            strict_traps: bool,
        ) -> Result<(), JsValue> {
            self.inner
                .load_a32b(&bytes, ram_size, strict_traps)
                .map_err(js_err)
        }

        pub fn reset(&mut self) -> Result<(), JsValue> {
            self.inner.reset().map_err(js_err)
        }

        pub fn step(&mut self) -> Result<String, JsValue> {
            self.inner.step().map_err(js_err)
        }

        pub fn run(&mut self, max_steps: u32) -> Result<String, JsValue> {
            self.inner.run(max_steps).map_err(js_err)
        }

        pub fn output(&self) -> Result<String, JsValue> {
            self.inner.output().map_err(js_err)
        }

        /// Get screen width
        pub fn screen_width(&self) -> u32 {
            self.inner.screen_size().0
        }

        /// Get screen height
        pub fn screen_height(&self) -> u32 {
            self.inner.screen_size().1
        }

        /// Get screen framebuffer as bytes (1 bit per pixel, MSB first)
        pub fn screen(&self) -> Result<Vec<u8>, JsValue> {
            self.inner.screen().map_err(js_err)
        }

        /// Check if screen has been modified since last clear
        pub fn screen_dirty(&self) -> Result<bool, JsValue> {
            self.inner.screen_dirty().map_err(js_err)
        }

        /// Clear the screen dirty flag
        pub fn clear_screen_dirty(&mut self) -> Result<(), JsValue> {
            self.inner.clear_screen_dirty().map_err(js_err)
        }

        /// Set keyboard key (0 = no key pressed)
        pub fn set_key(&mut self, key: u32) -> Result<(), JsValue> {
            self.inner.set_key(key).map_err(js_err)
        }

        /// Get current keyboard key
        pub fn get_key(&self) -> Result<u32, JsValue> {
            self.inner.get_key().map_err(js_err)
        }

        /// Assemble source code and load the resulting binary
        pub fn assemble(&mut self, source: &str) -> Result<(), JsValue> {
            let bytes = assemble_a32b(source).map_err(|e| js_err(e.to_string()))?;
            self.inner.load_a32b(&bytes, 0, false).map_err(js_err)
        }

        /// Compile C source code and load the resulting binary
        pub fn compile(&mut self, source: &str) -> Result<(), JsValue> {
            // Parse C to AST
            let (program, struct_defs) = parse_program(source).map_err(|e| js_err(e.to_string()))?;
            // Compile AST to assembly
            let asm = compile_to_a32(&program, &struct_defs).map_err(|e| js_err(e.to_string()))?;
            // Assemble to binary
            let bytes = assemble_a32b(&asm).map_err(|e| js_err(e.to_string()))?;
            // Load into machine
            self.inner.load_a32b(&bytes, 0, false).map_err(js_err)
        }

        /// Compile C source code and return the generated assembly
        pub fn compile_to_asm(&self, source: &str) -> Result<String, JsValue> {
            let (program, struct_defs) = parse_program(source).map_err(|e| js_err(e.to_string()))?;
            compile_to_a32(&program, &struct_defs).map_err(|e| js_err(e.to_string()))
        }

        /// Get register value by index (0-15)
        pub fn reg(&self, index: u32) -> Result<u32, JsValue> {
            self.inner.reg(index).map_err(js_err)
        }

        /// Read a 32-bit word from memory
        pub fn read_word(&self, addr: u32) -> Result<u32, JsValue> {
            self.inner.read_word(addr).map_err(js_err)
        }

        /// Get CPU flags as bitmask: bit0=N, bit1=Z, bit2=C, bit3=V
        pub fn flags(&self) -> Result<u8, JsValue> {
            self.inner.flags().map_err(js_err)
        }

        /// Get cache hits count
        pub fn cache_hits(&self) -> Result<u32, JsValue> {
            let (hits, _) = self.inner.cache_stats().map_err(js_err)?;
            Ok(hits as u32)
        }

        /// Get cache misses count
        pub fn cache_misses(&self) -> Result<u32, JsValue> {
            let (_, misses) = self.inner.cache_stats().map_err(js_err)?;
            Ok(misses as u32)
        }

        /// Get number of cache lines
        pub fn cache_num_lines(&self) -> Result<u32, JsValue> {
            self.inner.cache_num_lines().map(|n| n as u32).map_err(js_err)
        }

        /// Get cache line info: returns [valid (0/1), tag, first_word] or null
        pub fn cache_line(&self, index: u32) -> Result<JsValue, JsValue> {
            match self.inner.cache_line(index as usize).map_err(js_err)? {
                Some((valid, tag, word)) => {
                    let arr = js_sys::Array::new();
                    arr.push(&JsValue::from(if valid { 1u32 } else { 0u32 }));
                    arr.push(&JsValue::from(tag));
                    arr.push(&JsValue::from(word));
                    Ok(arr.into())
                }
                None => Ok(JsValue::NULL),
            }
        }

        /// Get the loaded binary (for display purposes)
        pub fn get_binary(&self) -> Result<Vec<u8>, JsValue> {
            self.inner
                .program
                .clone()
                .ok_or_else(|| js_err("no program loaded".to_string()))
        }
    }

    fn js_err(message: String) -> JsValue {
        JsValue::from_str(&message)
    }
}
