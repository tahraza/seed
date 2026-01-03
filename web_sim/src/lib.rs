use hdl_core::ast::Design;
use hdl_core::elab::elaborate;
use hdl_core::parser::parse_str;
use hdl_core::sim::Simulator;
use hdl_core::value::BitVec;

pub struct HdlSession {
    sim: Option<Simulator>,
}

impl HdlSession {
    pub fn new() -> Self {
        Self { sim: None }
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

    pub fn get_signal(&self, name: &str) -> Result<String, String> {
        let sim = self.sim.as_ref().ok_or("simulator not loaded")?;
        let v = sim.get_signal(name).map_err(|e| e.to_string())?;
        Ok(format_value(&v))
    }

    pub fn eval(&mut self) -> Result<(), String> {
        let sim = self.sim.as_mut().ok_or("simulator not loaded")?;
        sim.eval_comb().map_err(|e| e.to_string())
    }

    pub fn tick(&mut self, clock: &str) -> Result<(), String> {
        let sim = self.sim.as_mut().ok_or("simulator not loaded")?;
        sim.set_signal(clock, BitVec::new(1, 1))
            .map_err(|e| e.to_string())?;
        sim.tick().map_err(|e| e.to_string())
    }

    pub fn tock(&mut self, clock: &str) -> Result<(), String> {
        let sim = self.sim.as_mut().ok_or("simulator not loaded")?;
        sim.set_signal(clock, BitVec::new(1, 0))
            .map_err(|e| e.to_string())?;
        sim.tock().map_err(|e| e.to_string())
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
    let val: i64 = t.parse().map_err(|e| e.to_string())?;
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
    use super::HdlSession;
    use wasm_bindgen::prelude::*;

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

        pub fn set_signal(&mut self, name: &str, value: &str) -> Result<(), JsValue> {
            self.inner.set_signal(name, value).map_err(js_err)
        }

        pub fn get_signal(&self, name: &str) -> Result<String, JsValue> {
            self.inner.get_signal(name).map_err(js_err)
        }

        pub fn eval(&mut self) -> Result<(), JsValue> {
            self.inner.eval().map_err(js_err)
        }

        pub fn tick(&mut self, clock: &str) -> Result<(), JsValue> {
            self.inner.tick(clock).map_err(js_err)
        }

        pub fn tock(&mut self, clock: &str) -> Result<(), JsValue> {
            self.inner.tock(clock).map_err(js_err)
        }
    }

    fn js_err(message: String) -> JsValue {
        JsValue::from_str(&message)
    }
}
