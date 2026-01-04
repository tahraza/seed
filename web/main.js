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
  // Screen and keyboard
  screen: document.getElementById("a32-screen"),
  screenKey: document.getElementById("screen-key"),
  screenFps: document.getElementById("screen-fps"),
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
    renderScreen();
  } catch (err) {
    logA32(String(err), "error");
  }
});

// ========== Screen Rendering ==========

const SCREEN_WIDTH = 320;
const SCREEN_HEIGHT = 240;
const SCALE = 2; // 640x480 canvas for 320x240 screen

const screenCtx = els.screen.getContext("2d");
let screenImageData = screenCtx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
let lastFrameTime = 0;
let frameCount = 0;

function renderScreen() {
  if (!a32) {
    // Clear to dark blue when no program
    screenCtx.fillStyle = "#1a1a2e";
    screenCtx.fillRect(0, 0, els.screen.width, els.screen.height);
    return;
  }

  try {
    const framebuffer = a32.screen();
    const pixels = screenImageData.data;

    // Convert 1-bit framebuffer to RGBA
    for (let y = 0; y < SCREEN_HEIGHT; y++) {
      for (let x = 0; x < SCREEN_WIDTH; x++) {
        const bitIndex = y * SCREEN_WIDTH + x;
        const byteIndex = Math.floor(bitIndex / 8);
        const bitOffset = 7 - (bitIndex % 8); // MSB is leftmost
        const pixelOn = (framebuffer[byteIndex] >> bitOffset) & 1;

        const pixelIndex = (y * SCREEN_WIDTH + x) * 4;
        if (pixelOn) {
          // White pixel
          pixels[pixelIndex] = 255;     // R
          pixels[pixelIndex + 1] = 255; // G
          pixels[pixelIndex + 2] = 255; // B
          pixels[pixelIndex + 3] = 255; // A
        } else {
          // Dark blue background
          pixels[pixelIndex] = 26;      // R
          pixels[pixelIndex + 1] = 26;  // G
          pixels[pixelIndex + 2] = 46;  // B
          pixels[pixelIndex + 3] = 255; // A
        }
      }
    }

    // Draw at 1:1, then scale up
    screenCtx.putImageData(screenImageData, 0, 0);

    // If canvas is scaled, we need to redraw scaled
    if (SCALE > 1) {
      // Create temp canvas for scaling
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = SCREEN_WIDTH;
      tempCanvas.height = SCREEN_HEIGHT;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.putImageData(screenImageData, 0, 0);

      // Scale up to main canvas
      screenCtx.imageSmoothingEnabled = false;
      screenCtx.drawImage(tempCanvas, 0, 0, SCREEN_WIDTH * SCALE, SCREEN_HEIGHT * SCALE);
    }

    // Update FPS counter
    frameCount++;
    const now = performance.now();
    if (now - lastFrameTime >= 1000) {
      els.screenFps.textContent = `FPS: ${frameCount}`;
      frameCount = 0;
      lastFrameTime = now;
    }
  } catch (err) {
    console.error("Screen render error:", err);
  }
}

// Initial screen render
renderScreen();

// ========== Keyboard Handling ==========

let currentKey = 0;

// Map special keys to our key codes
function mapKeyCode(event) {
  // Check for special keys first
  switch (event.key) {
    case "Enter": return 10;
    case "Backspace": return 8;
    case "Tab": return 9;
    case "Escape": return 27;
    case "Delete": return 127;
    case "ArrowUp": return 128;
    case "ArrowDown": return 129;
    case "ArrowLeft": return 130;
    case "ArrowRight": return 131;
    case "F1": return 132;
    case "F2": return 133;
    case "F3": return 134;
    case "F4": return 135;
    case "F5": return 136;
    case "F6": return 137;
    case "F7": return 138;
    case "F8": return 139;
    case "F9": return 140;
    case "F10": return 141;
    case "F11": return 142;
    case "F12": return 143;
    case "Home": return 144;
    case "End": return 145;
    case "PageUp": return 146;
    case "PageDown": return 147;
    case "Insert": return 148;
  }

  // For printable characters, use the character code
  if (event.key.length === 1) {
    const code = event.key.charCodeAt(0);
    if (code >= 32 && code <= 126) {
      return code;
    }
  }

  return 0;
}

function updateKeyDisplay(key) {
  if (key === 0) {
    els.screenKey.textContent = "Key: none";
  } else if (key >= 32 && key <= 126) {
    els.screenKey.textContent = `Key: '${String.fromCharCode(key)}' (${key})`;
  } else {
    const names = {
      8: "Backspace", 9: "Tab", 10: "Enter", 27: "Escape", 127: "Delete",
      128: "Up", 129: "Down", 130: "Left", 131: "Right",
      132: "F1", 133: "F2", 134: "F3", 135: "F4", 136: "F5", 137: "F6",
      138: "F7", 139: "F8", 140: "F9", 141: "F10", 142: "F11", 143: "F12",
      144: "Home", 145: "End", 146: "PageUp", 147: "PageDown", 148: "Insert"
    };
    els.screenKey.textContent = `Key: ${names[key] || key} (${key})`;
  }
}

els.screen.addEventListener("keydown", async (event) => {
  if (!a32) return;

  const key = mapKeyCode(event);
  if (key !== 0) {
    event.preventDefault();
    currentKey = key;
    try {
      await a32.set_key(key);
      updateKeyDisplay(key);
    } catch (err) {
      console.error("Keyboard error:", err);
    }
  }
});

els.screen.addEventListener("keyup", async (event) => {
  if (!a32) return;

  const key = mapKeyCode(event);
  if (key === currentKey) {
    event.preventDefault();
    currentKey = 0;
    try {
      await a32.set_key(0);
      updateKeyDisplay(0);
    } catch (err) {
      console.error("Keyboard error:", err);
    }
  }
});

// Focus canvas when clicked
els.screen.addEventListener("click", () => {
  els.screen.focus();
});

// ========== Virtual Keyboard ==========

const virtualKeyboard = document.getElementById("virtual-keyboard");
let pressedVirtualKey = null;

virtualKeyboard.addEventListener("mousedown", async (event) => {
  const keyBtn = event.target.closest(".kb-key");
  if (!keyBtn) return;

  const key = parseInt(keyBtn.dataset.key, 10);
  if (key === 0) return; // Modifier keys (Ctrl, Alt, Shift, Caps) are not functional

  event.preventDefault();
  pressedVirtualKey = keyBtn;
  keyBtn.classList.add("pressed");

  if (a32) {
    try {
      currentKey = key;
      await a32.set_key(key);
      updateKeyDisplay(key);
    } catch (err) {
      console.error("Virtual keyboard error:", err);
    }
  }
});

virtualKeyboard.addEventListener("mouseup", async () => {
  if (pressedVirtualKey) {
    pressedVirtualKey.classList.remove("pressed");
    pressedVirtualKey = null;

    if (a32) {
      try {
        currentKey = 0;
        await a32.set_key(0);
        updateKeyDisplay(0);
      } catch (err) {
        console.error("Virtual keyboard error:", err);
      }
    }
  }
});

virtualKeyboard.addEventListener("mouseleave", async () => {
  if (pressedVirtualKey) {
    pressedVirtualKey.classList.remove("pressed");
    pressedVirtualKey = null;

    if (a32) {
      try {
        currentKey = 0;
        await a32.set_key(0);
        updateKeyDisplay(0);
      } catch (err) {
        console.error("Virtual keyboard error:", err);
      }
    }
  }
});

// Highlight virtual key when physical key is pressed
function highlightVirtualKey(keyCode, pressed) {
  const keyBtn = virtualKeyboard.querySelector(`[data-key="${keyCode}"]`);
  if (keyBtn) {
    if (pressed) {
      keyBtn.classList.add("pressed");
    } else {
      keyBtn.classList.remove("pressed");
    }
  }
}

// Update keyboard handlers to also highlight virtual keys
const originalKeydownHandler = els.screen.onkeydown;
els.screen.addEventListener("keydown", (event) => {
  const key = mapKeyCode(event);
  if (key !== 0) {
    highlightVirtualKey(key, true);
  }
});

els.screen.addEventListener("keyup", (event) => {
  const key = mapKeyCode(event);
  if (key !== 0) {
    highlightVirtualKey(key, false);
  }
});

// ========== Animation Loop ==========

let animationRunning = false;
let animationId = null;

async function animationLoop() {
  if (!a32 || !animationRunning) {
    animationId = null;
    return;
  }

  try {
    // Run some steps
    const status = await a32.run(1000);

    // Render screen
    renderScreen();

    // Check if still running
    if (status === "running") {
      animationId = requestAnimationFrame(animationLoop);
    } else {
      animationRunning = false;
      logA32(status, "ok");
      await refreshA32Output();
    }
  } catch (err) {
    animationRunning = false;
    logA32(String(err), "error");
  }
}

// Override run button to use animation loop
els.a32Run.removeEventListener("click", els.a32Run._handler);
els.a32Run.addEventListener("click", async () => {
  if (!a32) {
    logA32("Load a binary first", "error");
    return;
  }

  if (animationRunning) {
    // Stop the animation
    animationRunning = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    logA32("Stopped", "ok");
    return;
  }

  // Start running
  animationRunning = true;
  logA32("Running...", "info");
  animationLoop();
});

// Update step to also render screen
const originalStepHandler = els.a32Step.onclick;
els.a32Step.addEventListener("click", () => {
  setTimeout(renderScreen, 10);
});
