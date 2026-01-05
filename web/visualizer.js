/**
 * CPU Visualizer - Interactive CPU execution visualization
 * Loads .a32b files and animates the execution step by step
 */

import init, { WasmA32 } from "../web_sim/pkg/web_sim.js";

// ============================================================================
// Demo Programs (pre-assembled bytecode)
// ============================================================================

const DEMOS = {
    // Simple addition: R0 = 5 + 3 = 8
    addition: {
        name: "Addition Simple",
        description: "Additionne 5 + 3 et stocke le résultat dans R0",
        // MOV R0, #5; MOV R1, #3; ADD R0, R0, R1; HLT
        bytes: new Uint8Array([
            // Header: magic, version, text_size, data_size, entry
            0x41, 0x33, 0x32, 0x42, // magic "A32B"
            0x01, 0x00, 0x00, 0x00, // version 1
            0x10, 0x00, 0x00, 0x00, // text_size = 16 bytes (4 instructions)
            0x00, 0x00, 0x00, 0x00, // data_size = 0
            0x00, 0x00, 0x00, 0x00, // entry = 0
            // Instructions:
            0x05, 0x00, 0x00, 0xE3, // MOV R0, #5
            0x03, 0x10, 0x00, 0xE3, // MOV R1, #3
            0x01, 0x00, 0x80, 0xE0, // ADD R0, R0, R1
            0x00, 0x00, 0x00, 0xEF, // HLT (SVC #0)
        ])
    },

    // Loop: sum 1 to 5
    loop: {
        name: "Boucle Somme",
        description: "Calcule la somme de 1 à 5 (résultat = 15)",
        bytes: new Uint8Array([
            0x41, 0x33, 0x32, 0x42,
            0x01, 0x00, 0x00, 0x00,
            0x1C, 0x00, 0x00, 0x00, // 7 instructions
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            // R0 = sum, R1 = i, R2 = 5
            0x00, 0x00, 0x00, 0xE3, // MOV R0, #0 (sum = 0)
            0x01, 0x10, 0x00, 0xE3, // MOV R1, #1 (i = 1)
            0x05, 0x20, 0x00, 0xE3, // MOV R2, #5 (limit = 5)
            // loop:
            0x01, 0x00, 0x80, 0xE0, // ADD R0, R0, R1 (sum += i)
            0x01, 0x10, 0x81, 0xE2, // ADD R1, R1, #1 (i++)
            0x02, 0x00, 0x51, 0xE1, // CMP R1, R2
            0xFB, 0xFF, 0xFF, 0xDA, // BLE loop (-5 * 4 = -20)
            0x00, 0x00, 0x00, 0xEF, // HLT
        ])
    },

    // Memory access: load and store
    memory: {
        name: "Accès Mémoire",
        description: "Charge une valeur de la mémoire, la double, et la sauvegarde",
        bytes: new Uint8Array([
            0x41, 0x33, 0x32, 0x42,
            0x01, 0x00, 0x00, 0x00,
            0x18, 0x00, 0x00, 0x00, // 6 instructions
            0x04, 0x00, 0x00, 0x00, // 4 bytes data
            0x00, 0x00, 0x00, 0x00,
            // Code:
            0x18, 0x00, 0x9F, 0xE5, // LDR R0, =data (PC-relative)
            0x00, 0x10, 0x90, 0xE5, // LDR R1, [R0]
            0x01, 0x10, 0x81, 0xE0, // ADD R1, R1, R1 (double)
            0x00, 0x10, 0x80, 0xE5, // STR R1, [R0]
            0x00, 0x00, 0x00, 0xEF, // HLT
            0x00, 0x00, 0x00, 0x00, // padding
            // Data:
            0x2A, 0x00, 0x00, 0x00, // value = 42
        ])
    },

    // Conditional: absolute value
    conditional: {
        name: "Valeur Absolue",
        description: "Calcule |−7| = 7 en utilisant des conditions",
        bytes: new Uint8Array([
            0x41, 0x33, 0x32, 0x42,
            0x01, 0x00, 0x00, 0x00,
            0x14, 0x00, 0x00, 0x00, // 5 instructions
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            // R0 = -7, puis abs
            0x07, 0x00, 0x40, 0xE2, // MOV R0, #-7 (RSB R0, R0, #0 style - actually SUB)
            0x00, 0x00, 0x50, 0xE3, // CMP R0, #0
            0x00, 0x00, 0x60, 0x42, // RSBMI R0, R0, #0 (negate if negative)
            0x00, 0x00, 0x00, 0xEF, // HLT
            0x00, 0x00, 0x00, 0x00, // padding
        ])
    },
};

// ============================================================================
// State
// ============================================================================

let wasmReady = false;
let cpu = null;
let isRunning = false;
let animationId = null;
let speed = 5;
let animateStages = true;

// Statistics
let stats = {
    cycles: 0,
    instructions: 0,
    cacheHits: 0,
    cacheMisses: 0,
};

// Previous register values for highlighting changes
let prevRegisters = new Array(16).fill(0);

// ============================================================================
// DOM Elements
// ============================================================================

const els = {
    // Header
    fileInput: document.getElementById('file-input'),
    btnLoad: document.getElementById('btn-load'),

    // CPU Stages
    stageFetch: document.getElementById('stage-fetch'),
    stageDecode: document.getElementById('stage-decode'),
    stageExecute: document.getElementById('stage-execute'),
    stageMemory: document.getElementById('stage-memory'),
    stageWriteback: document.getElementById('stage-writeback'),

    // Component values
    pcValue: document.getElementById('pc-value'),
    instrHex: document.getElementById('instr-hex'),
    instrDecoded: document.getElementById('instr-decoded'),
    fieldOp: document.getElementById('field-op'),
    fieldRd: document.getElementById('field-rd'),
    fieldRn: document.getElementById('field-rn'),
    fieldRm: document.getElementById('field-rm'),
    aluA: document.getElementById('alu-a'),
    aluB: document.getElementById('alu-b'),
    aluOp: document.getElementById('alu-op'),
    aluResult: document.getElementById('alu-result'),
    cacheStatus: document.getElementById('cache-status'),
    cacheIndicator: document.getElementById('cache-indicator'),
    memAddr: document.getElementById('mem-addr'),
    wbInfo: document.getElementById('wb-info'),

    // Registers
    registersGrid: document.getElementById('registers-grid'),
    flagN: document.getElementById('flag-n'),
    flagZ: document.getElementById('flag-z'),
    flagC: document.getElementById('flag-c'),
    flagV: document.getElementById('flag-v'),

    // Stats
    statCycles: document.getElementById('stat-cycles'),
    statInstrs: document.getElementById('stat-instrs'),
    statHits: document.getElementById('stat-hits'),
    statMisses: document.getElementById('stat-misses'),
    statHitrate: document.getElementById('stat-hitrate'),

    // Memory
    memGoto: document.getElementById('mem-goto'),
    btnMemGoto: document.getElementById('btn-mem-goto'),
    memFollowPc: document.getElementById('mem-follow-pc'),
    memoryView: document.getElementById('memory-view'),
    cacheLines: document.getElementById('cache-lines'),

    // Controls
    btnReset: document.getElementById('btn-reset'),
    btnStep: document.getElementById('btn-step'),
    btnPlay: document.getElementById('btn-play'),
    playIcon: document.getElementById('play-icon'),
    playLabel: document.getElementById('play-label'),
    speedSlider: document.getElementById('speed-slider'),
    speedLabel: document.getElementById('speed-label'),
    animateStages: document.getElementById('animate-stages'),
    statusValue: document.getElementById('status-value'),
};

// ============================================================================
// Initialization
// ============================================================================

async function initWasm() {
    if (wasmReady) return;
    await init();
    wasmReady = true;
}

function initRegistersGrid() {
    els.registersGrid.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const name = i === 13 ? 'SP' : i === 14 ? 'LR' : i === 15 ? 'PC' : `R${i}`;
        const div = document.createElement('div');
        div.className = 'register-item';
        div.id = `reg-${i}`;
        div.innerHTML = `
            <span class="reg-name">${name}</span>
            <span class="reg-value" id="reg-val-${i}">0x00000000</span>
        `;
        els.registersGrid.appendChild(div);
    }
}

function initMemoryView() {
    els.memoryView.innerHTML = '';
    for (let addr = 0; addr < 256; addr += 16) {
        const row = document.createElement('div');
        row.className = 'memory-row';
        row.dataset.addr = addr;
        row.innerHTML = `
            <span class="mem-addr">0x${addr.toString(16).padStart(8, '0')}</span>
            <span class="mem-bytes">00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00</span>
            <span class="mem-ascii">................</span>
        `;
        els.memoryView.appendChild(row);
    }
}

function initCacheView() {
    els.cacheLines.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        const line = document.createElement('div');
        line.className = 'cache-line';
        line.id = `cache-line-${i}`;
        line.innerHTML = `
            <span>${i}</span>
            <span class="invalid">0</span>
            <span class="tag">-</span>
            <span class="data">-</span>
        `;
        els.cacheLines.appendChild(line);
    }
}

// ============================================================================
// CPU State Updates
// ============================================================================

function updateRegisters() {
    if (!cpu) return;

    try {
        const output = cpu.output();
        const regs = output.registers || [];

        for (let i = 0; i < 16; i++) {
            const val = regs[i] || 0;
            const valEl = document.getElementById(`reg-val-${i}`);
            const regEl = document.getElementById(`reg-${i}`);

            if (valEl) {
                valEl.textContent = `0x${(val >>> 0).toString(16).padStart(8, '0')}`;
            }

            // Highlight changed registers
            if (regEl) {
                if (val !== prevRegisters[i]) {
                    regEl.classList.add('changed');
                    setTimeout(() => regEl.classList.remove('changed'), 500);
                }
            }

            prevRegisters[i] = val;
        }

        // Update flags
        const flags = output.flags || { n: false, z: false, c: false, v: false };
        els.flagN.classList.toggle('active', flags.n);
        els.flagZ.classList.toggle('active', flags.z);
        els.flagC.classList.toggle('active', flags.c);
        els.flagV.classList.toggle('active', flags.v);

        // Update PC display
        const pc = regs[15] || 0;
        els.pcValue.textContent = `0x${(pc >>> 0).toString(16).padStart(8, '0')}`;

    } catch (err) {
        console.error('Failed to update registers:', err);
    }
}

function updateMemoryView(highlightAddr = null) {
    if (!cpu) return;

    try {
        const output = cpu.output();
        const pc = output.registers?.[15] || 0;

        // Calculate base address
        let baseAddr = 0;
        if (els.memFollowPc.checked) {
            baseAddr = Math.floor(pc / 16) * 16;
        }

        // Update rows
        const rows = els.memoryView.querySelectorAll('.memory-row');
        rows.forEach((row, idx) => {
            const addr = baseAddr + idx * 16;
            row.dataset.addr = addr;

            // Read memory bytes
            let bytes = [];
            let ascii = '';
            for (let i = 0; i < 16; i++) {
                // Note: In real implementation, we'd read from cpu.read_memory(addr + i)
                // For now, show placeholder
                const byte = 0;
                bytes.push(byte.toString(16).padStart(2, '0'));
                ascii += (byte >= 32 && byte < 127) ? String.fromCharCode(byte) : '.';
            }

            row.querySelector('.mem-addr').textContent = `0x${addr.toString(16).padStart(8, '0')}`;
            row.querySelector('.mem-bytes').textContent = bytes.join(' ');
            row.querySelector('.mem-ascii').textContent = ascii;

            // Highlight current PC
            row.classList.toggle('highlight-pc', addr <= pc && pc < addr + 16);

            // Highlight accessed address
            if (highlightAddr !== null) {
                row.classList.toggle('highlight', addr <= highlightAddr && highlightAddr < addr + 16);
            } else {
                row.classList.remove('highlight');
            }
        });

    } catch (err) {
        console.error('Failed to update memory view:', err);
    }
}

function updateStats() {
    els.statCycles.textContent = stats.cycles.toLocaleString();
    els.statInstrs.textContent = stats.instructions.toLocaleString();
    els.statHits.textContent = stats.cacheHits.toLocaleString();
    els.statMisses.textContent = stats.cacheMisses.toLocaleString();

    const total = stats.cacheHits + stats.cacheMisses;
    if (total > 0) {
        const rate = (stats.cacheHits / total * 100).toFixed(1);
        els.statHitrate.textContent = `${rate}%`;
    } else {
        els.statHitrate.textContent = '-';
    }
}

function updateStatus(status) {
    els.statusValue.textContent = status;
    els.statusValue.className = 'status-value';

    if (status.includes('Running') || status.includes('running')) {
        els.statusValue.classList.add('running');
    } else if (status.includes('Halted') || status.includes('halted')) {
        els.statusValue.classList.add('halted');
    }
}

// ============================================================================
// Animation
// ============================================================================

async function animateStep() {
    if (!cpu || !animateStages) {
        return executeStep();
    }

    // Animate each stage
    const stages = [
        els.stageFetch,
        els.stageDecode,
        els.stageExecute,
        els.stageMemory,
        els.stageWriteback
    ];

    for (const stage of stages) {
        stage.classList.add('active');
        await sleep(100 / speed);
        stage.classList.remove('active');
    }

    return executeStep();
}

async function executeStep() {
    if (!cpu) return 'no_program';

    try {
        const result = await cpu.step();
        stats.cycles++;
        stats.instructions++;

        updateRegisters();
        updateMemoryView();
        updateStats();

        // Update instruction display (simplified)
        els.instrDecoded.textContent = result || 'OK';

        return result;
    } catch (err) {
        console.error('Step error:', err);
        return 'error';
    }
}

async function runLoop() {
    if (!isRunning || !cpu) return;

    const result = await animateStep();

    if (result === 'running' || result === 'ok' || !result.includes('halt')) {
        // Continue running
        const delay = Math.max(10, 500 / speed);
        animationId = setTimeout(runLoop, delay);
    } else {
        // Stopped
        stopExecution();
        updateStatus('Halted');
    }
}

function startExecution() {
    if (!cpu) {
        updateStatus('Aucun programme');
        return;
    }

    isRunning = true;
    els.playIcon.textContent = '⏸';
    els.playLabel.textContent = 'Pause';
    updateStatus('Running...');

    runLoop();
}

function stopExecution() {
    isRunning = false;
    if (animationId) {
        clearTimeout(animationId);
        animationId = null;
    }
    els.playIcon.textContent = '▶';
    els.playLabel.textContent = 'Play';
}

function resetCpu() {
    if (cpu) {
        cpu.reset();
    }
    stats = { cycles: 0, instructions: 0, cacheHits: 0, cacheMisses: 0 };
    prevRegisters = new Array(16).fill(0);

    updateRegisters();
    updateMemoryView();
    updateStats();
    updateStatus('Ready');

    // Clear stage highlights
    document.querySelectorAll('.cpu-stage').forEach(s => s.classList.remove('active'));
}

// ============================================================================
// File Loading
// ============================================================================

async function loadProgram(bytes) {
    await initWasm();

    cpu = new WasmA32();
    await cpu.load_a32b(bytes, 0, false);

    resetCpu();
    updateStatus('Programme chargé');
}

async function loadFile(file) {
    try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        await loadProgram(bytes);
    } catch (err) {
        console.error('Failed to load file:', err);
        updateStatus('Erreur: ' + err.message);
    }
}

// ============================================================================
// Demo Menu
// ============================================================================

function createDemoMenu() {
    const header = document.querySelector('.viz-header');
    const demoContainer = document.createElement('div');
    demoContainer.className = 'demo-menu';
    demoContainer.innerHTML = `
        <span class="demo-label">Demos:</span>
        ${Object.entries(DEMOS).map(([id, demo]) => `
            <button class="btn small demo-btn" data-demo="${id}" title="${demo.description}">
                ${demo.name}
            </button>
        `).join('')}
    `;

    // Insert after the h1
    header.insertBefore(demoContainer, header.querySelector('.header-controls'));

    // Add click handlers
    demoContainer.querySelectorAll('.demo-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const demoId = btn.dataset.demo;
            const demo = DEMOS[demoId];
            if (demo) {
                stopExecution();
                await loadProgram(demo.bytes);
                updateStatus(`Demo: ${demo.name}`);
            }
        });
    });

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .demo-menu {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .demo-label {
            color: var(--text-secondary);
            font-size: 0.875rem;
        }
        .demo-btn {
            background: var(--accent-purple) !important;
            border-color: var(--accent-purple) !important;
        }
        .demo-btn:hover {
            background: #9333ea !important;
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// Event Handlers
// ============================================================================

function setupEventHandlers() {
    // Load file
    els.btnLoad.addEventListener('click', () => els.fileInput.click());
    els.fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
            stopExecution();
            loadFile(file);
        }
    });

    // Playback controls
    els.btnReset.addEventListener('click', () => {
        stopExecution();
        resetCpu();
    });

    els.btnStep.addEventListener('click', async () => {
        stopExecution();
        if (cpu) {
            const result = await animateStep();
            if (result.includes('halt')) {
                updateStatus('Halted');
            }
        }
    });

    els.btnPlay.addEventListener('click', () => {
        if (isRunning) {
            stopExecution();
            updateStatus('Paused');
        } else {
            startExecution();
        }
    });

    // Speed control
    els.speedSlider.addEventListener('input', (e) => {
        speed = parseInt(e.target.value, 10);
        els.speedLabel.textContent = speed;
    });

    // Animation toggle
    els.animateStages.addEventListener('change', (e) => {
        animateStages = e.target.checked;
    });

    // Memory navigation
    els.btnMemGoto.addEventListener('click', () => {
        const addr = parseAddress(els.memGoto.value);
        if (!isNaN(addr)) {
            els.memFollowPc.checked = false;
            // Update memory view to show this address
            updateMemoryView(addr);
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;

        switch (e.key) {
            case ' ':
                e.preventDefault();
                els.btnPlay.click();
                break;
            case 'n':
            case 'F10':
                e.preventDefault();
                els.btnStep.click();
                break;
            case 'r':
                if (e.ctrlKey) {
                    e.preventDefault();
                    els.btnReset.click();
                }
                break;
        }
    });
}

// ============================================================================
// Utilities
// ============================================================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function parseAddress(text) {
    const trimmed = text.trim();
    if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
        return parseInt(trimmed.slice(2), 16);
    }
    return parseInt(trimmed, 10);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
    initRegistersGrid();
    initMemoryView();
    initCacheView();
    createDemoMenu();
    setupEventHandlers();

    await initWasm();
    updateStatus('Chargez un fichier .a32b ou choisissez une démo');
}

main().catch(console.error);
