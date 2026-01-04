import init, { WasmA32, WasmHdl } from "../web_sim/pkg/web_sim.js";

const els = {
  top: document.getElementById("top-entity"),
  clock: document.getElementById("clock-name"),
  source1: document.getElementById("source-1"),
  source2: document.getElementById("source-2"),
  load: document.getElementById("btn-load"),
  eval: document.getElementById("btn-eval"),
  tick: document.getElementById("btn-tick"),
  tock: document.getElementById("btn-tock"),
  setName: document.getElementById("set-name"),
  setValue: document.getElementById("set-value"),
  setBtn: document.getElementById("btn-set"),
  getName: document.getElementById("get-name"),
  getBtn: document.getElementById("btn-get"),
  log: document.getElementById("log"),
  a32File: document.getElementById("a32-file"),
  a32Ram: document.getElementById("a32-ram"),
  a32Strict: document.getElementById("a32-strict"),
  a32Load: document.getElementById("a32-load"),
  a32Step: document.getElementById("a32-step"),
  a32Run: document.getElementById("a32-run"),
  a32Reset: document.getElementById("a32-reset"),
  a32Log: document.getElementById("a32-log"),
};

const sample = `entity HalfAdder is
  port(
    a : in bit;
    b : in bit;
    sum : out bit;
    carry : out bit
  );
end entity;

architecture rtl of HalfAdder is
begin
  sum <= a xor b;
  carry <= a and b;
end architecture;`;

els.source1.value = sample;
els.source2.value = "";

let hdl = null;
let a32 = null;
let wasmReady = false;

function logLineTo(target, message, kind = "info") {
  const line = document.createElement("div");
  line.className = `log-line ${kind}`;
  line.textContent = message;
  target.prepend(line);
}

function logLine(message, kind = "info") {
  logLineTo(els.log, message, kind);
}

function logA32(message, kind = "info") {
  logLineTo(els.a32Log, message, kind);
}

function clearLog(target) {
  target.innerHTML = "";
}

async function ensureWasm() {
  if (wasmReady) {
    return;
  }
  await init();
  wasmReady = true;
}

function collectSources() {
  const sources = [];
  for (const textarea of [els.source1, els.source2]) {
    const text = textarea.value.trim();
    if (text) {
      sources.push(text);
    }
  }
  return sources;
}

els.load.addEventListener("click", async () => {
  try {
    await ensureWasm();
    hdl = new WasmHdl();
    if (els.clock.value.trim()) {
      hdl.set_clock(els.clock.value.trim());
    }
    const sources = collectSources();
    await hdl.load(els.top.value.trim(), sources);
    logLine("Loaded design", "ok");
  } catch (err) {
    logLine(String(err), "error");
  }
});

els.eval.addEventListener("click", async () => {
  if (!hdl) {
    logLine("Load a design first", "error");
    return;
  }
  try {
    await hdl.eval();
    logLine("Combinational eval complete", "ok");
  } catch (err) {
    logLine(String(err), "error");
  }
});

els.tick.addEventListener("click", async () => {
  if (!hdl) {
    logLine("Load a design first", "error");
    return;
  }
  try {
    await hdl.tick();
    logLine("Tick", "ok");
  } catch (err) {
    logLine(String(err), "error");
  }
});

els.tock.addEventListener("click", async () => {
  if (!hdl) {
    logLine("Load a design first", "error");
    return;
  }
  try {
    await hdl.tock();
    logLine("Tock", "ok");
  } catch (err) {
    logLine(String(err), "error");
  }
});

els.setBtn.addEventListener("click", async () => {
  if (!hdl) {
    logLine("Load a design first", "error");
    return;
  }
  try {
    await hdl.set_signal(els.setName.value.trim(), els.setValue.value.trim());
    logLine(`set ${els.setName.value.trim()} = ${els.setValue.value.trim()}`, "ok");
  } catch (err) {
    logLine(String(err), "error");
  }
});

els.getBtn.addEventListener("click", async () => {
  if (!hdl) {
    logLine("Load a design first", "error");
    return;
  }
  try {
    const value = await hdl.get_signal(els.getName.value.trim());
    logLine(`${els.getName.value.trim()} = ${value}`, "ok");
  } catch (err) {
    logLine(String(err), "error");
  }
});

function parseNumber(text, fallback = 0) {
  const trimmed = text.trim();
  if (!trimmed) {
    return fallback;
  }
  if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) {
    const value = Number.parseInt(trimmed.slice(2), 16);
    return Number.isFinite(value) ? value : fallback;
  }
  if (trimmed.startsWith("0b") || trimmed.startsWith("0B")) {
    const value = Number.parseInt(trimmed.slice(2), 2);
    return Number.isFinite(value) ? value : fallback;
  }
  const value = Number.parseInt(trimmed, 10);
  return Number.isFinite(value) ? value : fallback;
}

async function refreshA32Output() {
  if (!a32) {
    return;
  }
  const output = await a32.output();
  logA32(`OUT ${JSON.stringify(output)}`, "info");
}

els.a32Load.addEventListener("click", async () => {
  const file = els.a32File.files?.[0];
  if (!file) {
    logA32("Select a .a32b file first", "error");
    return;
  }
  try {
    await ensureWasm();
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const ramSize = parseNumber(els.a32Ram.value, 0);
    const strictTraps = els.a32Strict.value === "true";
    a32 = new WasmA32();
    await a32.load_a32b(bytes, ramSize, strictTraps);
    clearLog(els.a32Log);
    logA32(`Loaded ${file.name}`, "ok");
    await refreshA32Output();
  } catch (err) {
    logA32(String(err), "error");
  }
});

els.a32Step.addEventListener("click", async () => {
  if (!a32) {
    logA32("Load a binary first", "error");
    return;
  }
  try {
    const status = await a32.step();
    logA32(status, "ok");
    await refreshA32Output();
  } catch (err) {
    logA32(String(err), "error");
  }
});

els.a32Run.addEventListener("click", async () => {
  if (!a32) {
    logA32("Load a binary first", "error");
    return;
  }
  try {
    const status = await a32.run(0);
    logA32(status, "ok");
    await refreshA32Output();
  } catch (err) {
    logA32(String(err), "error");
  }
});

els.a32Reset.addEventListener("click", async () => {
  if (!a32) {
    logA32("Load a binary first", "error");
    return;
  }
  try {
    await a32.reset();
    clearLog(els.a32Log);
    logA32("Reset", "ok");
    await refreshA32Output();
  } catch (err) {
    logA32(String(err), "error");
  }
});
