/**
 * CPU Visualizer - Interactive CPU execution visualization
 * Loads .asm files, assembles them dynamically, and animates execution
 */

// ============================================================================
// State
// ============================================================================

let wasmModule = null;
let wasmReady = false;
let cpu = null;
let isRunning = false;
let animationId = null;
let speed = 5;
let animateStages = true;
let currentDemo = null;
let demoManifest = null;

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

    // Cache display (in memory panel)
    cacheHitsDisplay: document.getElementById('cache-hits-display'),
    cacheMissesDisplay: document.getElementById('cache-misses-display'),
    cacheRateDisplay: document.getElementById('cache-rate-display'),
    cacheIndicatorDisplay: document.getElementById('cache-indicator'),

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

    // Source code panel
    sourcePanel: document.getElementById('source-panel'),
    sourceCode: document.getElementById('source-code'),
};

// ============================================================================
// Initialization
// ============================================================================

async function initWasm() {
    if (wasmReady) return;

    // Use absolute path from site root to work in both dev and production
    const wasmPath = new URL('/pkg/web_sim.js', window.location.origin).href;

    try {
        const response = await fetch(wasmPath, { method: 'HEAD' }).catch(() => null);

        if (response && response.ok) {
            wasmModule = await import(/* @vite-ignore */ wasmPath);
            await wasmModule.default();
            wasmReady = true;
            console.log('WASM module loaded');
        } else {
            throw new Error('WASM module not found - run: npm run build:wasm');
        }
    } catch (e) {
        console.error('Failed to load WASM:', e);
        updateStatus('Erreur: WASM non chargé');
        throw e;
    }
}

function initRegistersGrid() {
    if (!els.registersGrid) return;
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
    if (!els.memoryView) return;
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
    if (!els.cacheLines) return;
    els.cacheLines.innerHTML = '';
    // Create 64 cache lines (default, will be updated if CPU provides different count)
    const numLines = 64;
    for (let i = 0; i < numLines; i++) {
        const line = document.createElement('div');
        line.className = 'cache-line';
        line.id = `cache-line-${i}`;
        line.innerHTML = `
            <span class="line-idx">${i}</span>
            <span class="valid-bit invalid">0</span>
            <span class="tag">-</span>
            <span class="data">-</span>
        `;
        els.cacheLines.appendChild(line);
    }
}

function updateCacheView() {
    if (!cpu || !els.cacheLines) return;

    try {
        const numLines = cpu.cache_num_lines ? cpu.cache_num_lines() : 64;

        for (let i = 0; i < numLines; i++) {
            const lineEl = document.getElementById(`cache-line-${i}`);
            if (!lineEl) continue;

            const lineData = cpu.cache_line ? cpu.cache_line(i) : null;

            if (lineData && Array.isArray(lineData)) {
                const [valid, tag, word] = lineData;
                const validBit = lineEl.querySelector('.valid-bit');
                const tagEl = lineEl.querySelector('.tag');
                const dataEl = lineEl.querySelector('.data');

                if (validBit) {
                    validBit.textContent = valid ? '1' : '0';
                    validBit.className = valid ? 'valid-bit valid' : 'valid-bit invalid';
                }
                if (tagEl) {
                    tagEl.textContent = valid ? `0x${tag.toString(16).padStart(6, '0')}` : '-';
                }
                if (dataEl) {
                    dataEl.textContent = valid ? `0x${(word >>> 0).toString(16).padStart(8, '0')}` : '-';
                }

                // Highlight recently accessed lines
                if (valid) {
                    lineEl.classList.add('filled');
                } else {
                    lineEl.classList.remove('filled');
                }
            }
        }
    } catch (e) {
        // cache_line may not be available
    }
}

// ============================================================================
// Demo Loading
// ============================================================================

// Fallback demos if manifest fails to load
const FALLBACK_DEMOS = {
    demos: [
        { id: "addition", name: "1. Addition", description: "5 + 3 = 8", file: "01_addition.asm", expected: "R0 = 8" },
        { id: "boucle", name: "2. Boucle", description: "Somme 1-5", file: "02_boucle.asm", expected: "R0 = 15" },
        { id: "memoire", name: "3. Mémoire", description: "LDR/STR", file: "03_memoire.asm", expected: "42 → 84" },
        { id: "condition", name: "4. Condition", description: "Valeur absolue", file: "04_condition.asm", expected: "R0 = 7" },
        { id: "tableau", name: "5. Tableau", description: "Somme tableau", file: "05_tableau.asm", expected: "R0 = 100" },
        { id: "flags", name: "6. Flags", description: "N, Z, C, V", file: "06_flags.asm", expected: "Flags demo" },
        { id: "cache", name: "7. Cache", description: "Parcours mémoire", file: "07_cache.asm", expected: "Cache hits/misses" },
    ]
};

async function loadDemoManifest() {
    try {
        const response = await fetch('demos/manifest.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        demoManifest = await response.json();
        console.log('Loaded demo manifest:', demoManifest);
        return demoManifest;
    } catch (err) {
        console.warn('Failed to load demo manifest, using fallback:', err);
        demoManifest = FALLBACK_DEMOS;
        return demoManifest;
    }
}

// Inline demo sources as fallback
const INLINE_DEMOS = {
    "01_addition.asm": `; Demo: Addition Simple (5 + 3 = 8)
.text
.global _start
_start:
    MOV R0, #5          ; R0 = 5
    MOV R1, #3          ; R1 = 3
    ADD R0, R0, R1      ; R0 = R0 + R1 = 8
    HALT
`,
    "02_boucle.asm": `; Demo: Boucle Somme (1+2+3+4+5 = 15)
.text
.global _start
_start:
    MOV R0, #0          ; somme = 0
    MOV R1, #1          ; i = 1
    MOV R2, #5          ; limite = 5
boucle:
    ADD R0, R0, R1      ; somme += i
    ADD R1, R1, #1      ; i++
    CMP R1, R2
    B.LE boucle         ; si i <= 5, continuer
    HALT
`,
    "03_memoire.asm": `; Demo: Acces Memoire
.data
valeur:
    .word 42
.text
.global _start
_start:
    LDR R0, =valeur     ; adresse
    LDR R1, [R0]        ; lire 42
    ADD R1, R1, R1      ; doubler = 84
    STR R1, [R0]        ; sauvegarder
    HALT
`,
    "04_condition.asm": `; Demo: Valeur Absolue (|-7| = 7)
.text
.global _start
_start:
    MOV R0, #0
    SUB R0, R0, #7      ; R0 = -7
    CMP R0, #0
    B.GE positif
    MOV R1, #0
    SUB R0, R1, R0      ; R0 = 0 - R0 = 7
positif:
    HALT
`,
    "05_tableau.asm": `; Demo: Somme Tableau (10+20+30+40 = 100)
.data
tableau:
    .word 10
    .word 20
    .word 30
    .word 40
.text
.global _start
_start:
    LDR R0, =tableau    ; adresse du tableau
    MOV R2, #0          ; somme = 0
    MOV R3, #4          ; compteur = 4 elements
boucle:
    LDR R4, [R0]        ; charger element
    ADD R2, R2, R4      ; somme += element
    ADD R0, R0, #4      ; adresse += 4 (prochain mot)
    SUB R3, R3, #1      ; compteur--
    CMP R3, #0
    B.GT boucle         ; si compteur > 0, continuer
    MOV R0, R2          ; resultat dans R0
    HALT
`,
    "06_flags.asm": `; ============================================
; Demo 6: Flags du Processeur (N, Z, C, V)
; ============================================
; Objectif: Illustrer les flags CPU
;   N = Negative (bit 31 = 1)
;   Z = Zero (resultat = 0)
;   C = Carry (depassement non-signe)
;   V = oVerflow (depassement signe)
; ============================================

.text
.global _start

_start:
    ; --- Test du flag Z (Zero) ---
    MOV R0, #5
    SUB R0, R0, #5      ; R0 = 0, Z=1
    ; Apres: Z=1 (resultat nul)

    ; --- Test du flag N (Negative) ---
    MOV R1, #0
    SUB R1, R1, #1      ; R1 = -1 = 0xFFFFFFFF, N=1
    ; Apres: N=1 (bit 31 = 1)

    ; --- Test du flag C (Carry) ---
    MOV R2, #0
    SUB R2, R2, #1      ; Carry set (borrow)
    ; Apres: C=0 (borrow = not carry)

    ; --- Test comparaisons ---
    MOV R3, #10
    MOV R4, #20
    CMP R3, R4          ; 10 - 20 = negatif
    ; Apres: N=1, Z=0

    CMP R4, R3          ; 20 - 10 = positif
    ; Apres: N=0, Z=0

    CMP R3, R3          ; 10 - 10 = 0
    ; Apres: Z=1

    ; --- Branchements conditionnels ---
    MOV R5, #0          ; compteur de tests

    CMP R3, R4
    B.LT skip1          ; 10 < 20 ? oui, sauter
    ADD R5, R5, #1      ; ne pas executer
skip1:

    CMP R4, R3
    B.GT skip2          ; 20 > 10 ? oui, sauter
    ADD R5, R5, #1      ; ne pas executer
skip2:

    MOV R0, R5          ; R0 = 0 si tous les tests OK
    HALT
`,
    "07_cache.asm": `; ============================================
; Demo 7: Cache Memoire
; ============================================
; Objectif: Illustrer le fonctionnement du cache
; - Premier acces: cache miss (lent)
; - Acces repete: cache hit (rapide)
; ============================================

.data
tableau:
    .word 1
    .word 2
    .word 3
    .word 4
    .word 5
    .word 6
    .word 7
    .word 8
    .word 9
    .word 10
    .word 11
    .word 12
    .word 13
    .word 14
    .word 15
    .word 16

.text
.global _start

_start:
    LDR R0, =tableau    ; R0 = adresse du tableau

    ; --- Premier parcours (cache misses) ---
    MOV R1, #0          ; somme = 0
    MOV R2, #0          ; index = 0

premier_parcours:
    LDR R3, [R0]        ; Charger element (cache miss probable)
    ADD R1, R1, R3      ; somme += element
    ADD R0, R0, #4      ; adresse++
    ADD R2, R2, #1      ; index++
    CMP R2, #16
    B.LT premier_parcours

    ; R1 = 1+2+...+16 = 136
    MOV R4, R1          ; Sauvegarder resultat

    ; --- Deuxieme parcours (cache hits) ---
    LDR R0, =tableau    ; Reset adresse
    MOV R1, #0          ; somme = 0
    MOV R2, #0          ; index = 0

deuxieme_parcours:
    LDR R3, [R0]        ; Charger element (cache hit probable)
    ADD R1, R1, R3      ; somme += element
    ADD R0, R0, #4      ; adresse++
    ADD R2, R2, #1      ; index++
    CMP R2, #16
    B.LT deuxieme_parcours

    ; R1 devrait aussi = 136
    ; Verifier: R4 == R1 ?
    CMP R4, R1
    B.NE erreur

    MOV R0, R4          ; R0 = 136 (somme correcte)
    HALT

erreur:
    MOV R0, #0          ; Erreur!
    HALT
`,
};

async function loadDemoSource(filename) {
    try {
        const response = await fetch(`demos/${filename}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.text();
    } catch (err) {
        console.warn(`Failed to fetch ${filename}, using inline fallback:`, err);
        // Use inline fallback
        if (INLINE_DEMOS[filename]) {
            return INLINE_DEMOS[filename];
        }
        return null;
    }
}

async function loadDemo(demo) {
    console.log('loadDemo called:', demo);
    updateStatus(`Chargement: ${demo.name}...`);

    const source = await loadDemoSource(demo.file);
    console.log('Source loaded:', source ? source.substring(0, 100) + '...' : 'NULL');

    if (!source) {
        updateStatus(`Erreur: impossible de charger ${demo.file}`);
        return;
    }

    currentDemo = { ...demo, source };
    displaySourceCode(source);

    try {
        console.log('Initializing WASM...');
        await initWasm();
        console.log('WASM ready, wasmModule:', wasmModule);
        console.log('Creating WasmA32...');
        cpu = new wasmModule.WasmA32();
        console.log('CPU created, assembling...');
        cpu.assemble(source);
        console.log('Assembly done, resetting...');
        resetCpu();
        updateStatus(`Demo: ${demo.name} - Prêt`);
    } catch (err) {
        console.error('Assembly error:', err);
        updateStatus(`Erreur: ${err.message || err}`);
    }
}

// Map instruction index to source line number
let instructionToLine = [];
let currentHighlightedLine = null;

function displaySourceCode(source) {
    if (!els.sourceCode) return;

    // Build instruction-to-line mapping
    instructionToLine = [];
    let inTextSection = false;

    const lines = source.split('\n');
    const highlighted = lines.map((line, idx) => {
        const lineNum = (idx + 1).toString().padStart(3, ' ');
        const escapedLine = escapeHtml(line);
        const coloredLine = highlightAsm(escapedLine);

        const trimmed = line.trim();

        // Track sections
        if (trimmed === '.text') {
            inTextSection = true;
        } else if (trimmed === '.data') {
            inTextSection = false;
        }

        // Check if this line is an instruction (in .text section, not empty, not comment, not directive, not just a label)
        if (inTextSection && trimmed && !trimmed.startsWith(';') && !trimmed.startsWith('.')) {
            // Check if it's not just a label (has more than just "label:")
            const isJustLabel = /^\w+:\s*$/.test(trimmed);
            const hasInstruction = /\b(MOV|ADD|SUB|MUL|AND|ORR|EOR|LSL|LSR|ASR|CMP|TST|LDR|STR|B|BL|BEQ|BNE|BGT|BLT|BGE|BLE|PUSH|POP|HALT|RET)\b/i.test(trimmed);

            if (hasInstruction && !isJustLabel) {
                instructionToLine.push(idx);
            }
        }

        return `<div class="source-line" id="source-line-${idx}" data-line="${idx}"><span class="line-num">${lineNum}</span> ${coloredLine}</div>`;
    }).join('');

    els.sourceCode.innerHTML = highlighted;
}

function highlightCurrentLine(pc) {
    if (!els.sourceCode) return;

    // Remove previous highlight
    if (currentHighlightedLine !== null) {
        const prevLine = document.getElementById(`source-line-${currentHighlightedLine}`);
        if (prevLine) {
            prevLine.classList.remove('current-line');
        }
    }

    // Calculate instruction index from PC
    // PC is typically the address, each instruction is 4 bytes
    // But we need to account for the entry point offset
    const instrIndex = Math.floor(pc / 4);

    // Find corresponding source line
    if (instrIndex >= 0 && instrIndex < instructionToLine.length) {
        const lineIdx = instructionToLine[instrIndex];
        const lineEl = document.getElementById(`source-line-${lineIdx}`);
        if (lineEl) {
            lineEl.classList.add('current-line');
            currentHighlightedLine = lineIdx;

            // Scroll into view if needed
            lineEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function highlightAsm(line) {
    // Comments
    line = line.replace(/(;.*)$/, '<span class="asm-comment">$1</span>');

    // Labels
    line = line.replace(/^(\s*)(\w+:)/, '$1<span class="asm-label">$2</span>');

    // Directives
    line = line.replace(/(\.\w+)/g, '<span class="asm-directive">$1</span>');

    // Instructions (common ARM instructions)
    const instrs = /\b(MOV|ADD|SUB|MUL|AND|ORR|EOR|LSL|LSR|ASR|CMP|TST|LDR|STR|B|BL|BEQ|BNE|BGT|BLT|BGE|BLE|PUSH|POP|HLT|RSB|RET)\b/gi;
    line = line.replace(instrs, '<span class="asm-instr">$1</span>');

    // Registers
    line = line.replace(/\b(R\d{1,2}|SP|LR|PC)\b/gi, '<span class="asm-reg">$1</span>');

    // Numbers
    line = line.replace(/#(-?\d+|0x[0-9a-fA-F]+)/g, '<span class="asm-num">#$1</span>');

    return line;
}

function createDemoMenu() {
    if (!demoManifest) return;

    const header = document.querySelector('.viz-header');
    if (!header) return;

    const demoContainer = document.createElement('div');
    demoContainer.className = 'demo-menu';
    demoContainer.innerHTML = `
        <label class="demo-label" for="demo-select">Demo:</label>
        <select id="demo-select" class="demo-select">
            <option value="">-- Choisir une demo --</option>
            ${demoManifest.demos.map(demo => `
                <option value="${demo.id}" title="${demo.expected}">${demo.name} - ${demo.description}</option>
            `).join('')}
        </select>
    `;

    // Insert after the h1
    const headerControls = header.querySelector('.header-controls');
    if (headerControls) {
        header.insertBefore(demoContainer, headerControls);
    }

    // Add change handler for select
    const select = demoContainer.querySelector('#demo-select');
    select.addEventListener('change', async (e) => {
        const demoId = e.target.value;
        if (!demoId) return;

        const demo = demoManifest.demos.find(d => d.id === demoId);
        if (demo) {
            stopExecution();
            await loadDemo(demo);
        }
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
            color: var(--text-secondary, #a0a0a0);
            font-size: 0.875rem;
            font-weight: 500;
        }
        .demo-select {
            background: linear-gradient(135deg, #1e1e2e, #2d2d3d);
            border: 1px solid #a855f7;
            border-radius: 6px;
            color: white;
            padding: 0.5rem 2rem 0.5rem 0.75rem;
            font-size: 0.875rem;
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a855f7' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 0.5rem center;
            min-width: 220px;
        }
        .demo-select:hover {
            border-color: #c084fc;
            background-color: #2d2d3d;
        }
        .demo-select:focus {
            outline: none;
            border-color: #c084fc;
            box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.3);
        }
        .demo-select option {
            background: #1e1e2e;
            color: white;
            padding: 0.5rem;
        }

        /* Source code syntax highlighting */
        .source-code {
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.8rem;
            line-height: 1.5;
            white-space: pre;
            overflow-x: auto;
        }
        .line-num {
            color: var(--text-muted, #666);
            user-select: none;
            margin-right: 1em;
        }
        .asm-comment { color: #6a9955; }
        .asm-label { color: #dcdcaa; font-weight: bold; }
        .asm-directive { color: #c586c0; }
        .asm-instr { color: #569cd6; font-weight: bold; }
        .asm-reg { color: #9cdcfe; }
        .asm-num { color: #b5cea8; }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// CPU State Updates
// ============================================================================

// Previous flags for change detection
let prevFlags = 0;

function updateRegisters() {
    if (!cpu) return;

    try {
        for (let i = 0; i < 16; i++) {
            const val = cpu.reg(i) || 0;
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

        // Update PC display
        const pc = cpu.reg(15) || 0;
        if (els.pcValue) {
            els.pcValue.textContent = `0x${(pc >>> 0).toString(16).padStart(8, '0')}`;
        }

        // Update flags
        updateFlags();

    } catch (err) {
        console.error('Failed to update registers:', err);
    }
}

function updateFlags() {
    if (!cpu) return;

    try {
        const flagsBits = cpu.flags() || 0;
        const n = (flagsBits & 1) !== 0;
        const z = (flagsBits & 2) !== 0;
        const c = (flagsBits & 4) !== 0;
        const v = (flagsBits & 8) !== 0;

        // Update flag elements
        if (els.flagN) {
            els.flagN.classList.toggle('active', n);
            if ((prevFlags & 1) !== (flagsBits & 1)) {
                els.flagN.classList.add('changed');
                setTimeout(() => els.flagN.classList.remove('changed'), 500);
            }
        }
        if (els.flagZ) {
            els.flagZ.classList.toggle('active', z);
            if ((prevFlags & 2) !== (flagsBits & 2)) {
                els.flagZ.classList.add('changed');
                setTimeout(() => els.flagZ.classList.remove('changed'), 500);
            }
        }
        if (els.flagC) {
            els.flagC.classList.toggle('active', c);
            if ((prevFlags & 4) !== (flagsBits & 4)) {
                els.flagC.classList.add('changed');
                setTimeout(() => els.flagC.classList.remove('changed'), 500);
            }
        }
        if (els.flagV) {
            els.flagV.classList.toggle('active', v);
            if ((prevFlags & 8) !== (flagsBits & 8)) {
                els.flagV.classList.add('changed');
                setTimeout(() => els.flagV.classList.remove('changed'), 500);
            }
        }

        prevFlags = flagsBits;
    } catch (err) {
        // flags() may not be available yet
    }
}

function updateMemoryView(highlightAddr = null) {
    if (!cpu || !els.memoryView) return;

    try {
        const pc = cpu.reg(15) || 0;

        // Calculate base address
        let baseAddr = 0;
        if (els.memFollowPc && els.memFollowPc.checked) {
            baseAddr = Math.floor(pc / 16) * 16;
        }

        // Update rows
        const rows = els.memoryView.querySelectorAll('.memory-row');
        rows.forEach((row, idx) => {
            const addr = baseAddr + idx * 16;
            row.dataset.addr = addr;

            row.querySelector('.mem-addr').textContent = `0x${addr.toString(16).padStart(8, '0')}`;

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

// Previous cache stats for detecting changes
let prevCacheHits = 0;
let prevCacheMisses = 0;

function updateStats() {
    if (els.statCycles) els.statCycles.textContent = stats.cycles.toLocaleString();
    if (els.statInstrs) els.statInstrs.textContent = stats.instructions.toLocaleString();

    // Get real cache stats from CPU if available
    let cacheHits = stats.cacheHits;
    let cacheMisses = stats.cacheMisses;

    if (cpu) {
        try {
            const h = cpu.cache_hits();
            const m = cpu.cache_misses();
            cacheHits = h || 0;
            cacheMisses = m || 0;
            stats.cacheHits = cacheHits;
            stats.cacheMisses = cacheMisses;
        } catch (e) {
            // cache_hits/misses may not be available
        }
    }

    // Update stats panel
    if (els.statHits) els.statHits.textContent = cacheHits.toLocaleString();
    if (els.statMisses) els.statMisses.textContent = cacheMisses.toLocaleString();

    // Update Cache L1 panel display
    if (els.cacheHitsDisplay) els.cacheHitsDisplay.textContent = cacheHits.toLocaleString();
    if (els.cacheMissesDisplay) els.cacheMissesDisplay.textContent = cacheMisses.toLocaleString();

    const total = cacheHits + cacheMisses;
    const rate = total > 0 ? (cacheHits / total * 100).toFixed(1) + '%' : '-';

    if (els.statHitrate) els.statHitrate.textContent = rate;
    if (els.cacheRateDisplay) els.cacheRateDisplay.textContent = rate;

    // Show HIT/MISS indicator
    if (els.cacheIndicatorDisplay) {
        if (cacheHits > prevCacheHits) {
            els.cacheIndicatorDisplay.textContent = 'HIT';
            els.cacheIndicatorDisplay.className = 'cache-indicator hit';
        } else if (cacheMisses > prevCacheMisses) {
            els.cacheIndicatorDisplay.textContent = 'MISS';
            els.cacheIndicatorDisplay.className = 'cache-indicator miss';
        }
    }

    // Also update cache status in CPU architecture
    if (els.cacheStatus) {
        if (cacheHits > prevCacheHits) {
            els.cacheStatus.textContent = 'HIT';
            els.cacheStatus.style.color = 'var(--accent-green)';
        } else if (cacheMisses > prevCacheMisses) {
            els.cacheStatus.textContent = 'MISS';
            els.cacheStatus.style.color = 'var(--accent-red)';
        }
    }

    prevCacheHits = cacheHits;
    prevCacheMisses = cacheMisses;
}

function updateStatus(status) {
    if (!els.statusValue) return;
    els.statusValue.textContent = status;
    els.statusValue.className = 'status-value';

    if (status.includes('Running') || status.includes('running')) {
        els.statusValue.classList.add('running');
    } else if (status.includes('Halted') || status.includes('halted') || status.includes('exit')) {
        els.statusValue.classList.add('halted');
    }
}

// ============================================================================
// Animation
// ============================================================================

async function animateStep() {
    if (!cpu) return 'no_program';

    if (animateStages) {
        // Animate each stage
        const stages = [
            els.stageFetch,
            els.stageDecode,
            els.stageExecute,
            els.stageMemory,
            els.stageWriteback
        ].filter(s => s);

        for (const stage of stages) {
            stage.classList.add('active');
            await sleep(80 / speed);
            stage.classList.remove('active');
        }
    }

    return executeStep();
}

function executeStep() {
    if (!cpu) return 'no_program';

    try {
        // Get PC before step for instruction fetch display
        const pcBefore = cpu.reg(15) || 0;

        const result = cpu.step();
        stats.cycles++;
        stats.instructions++;

        // Update pipeline display with instruction details
        updatePipelineDisplay(pcBefore);

        // Highlight current source line
        highlightCurrentLine(pcBefore);

        updateRegisters();
        updateMemoryView();
        updateStats();
        updateCacheView();

        // Update instruction display
        if (els.instrDecoded) {
            els.instrDecoded.textContent = result || 'OK';
        }

        return result;
    } catch (err) {
        console.error('Step error:', err);
        return 'error: ' + err.message;
    }
}

// Decode instruction and update pipeline display
function updatePipelineDisplay(pc) {
    if (!cpu) return;

    try {
        // Fetch: Read instruction from memory at PC
        const instr = cpu.read_word(pc) || 0;

        if (els.instrHex) {
            els.instrHex.textContent = `0x${(instr >>> 0).toString(16).padStart(8, '0')}`;
        }

        // Decode: Extract instruction fields (A32 format)
        const cond = (instr >>> 28) & 0xF;
        const op = (instr >>> 21) & 0xF;
        const rd = (instr >>> 12) & 0xF;
        const rn = (instr >>> 16) & 0xF;
        const rm = instr & 0xF;
        const imm = instr & 0xFFF;

        // Determine instruction type
        const isImmediate = ((instr >>> 25) & 1) === 1;
        const opcode = (instr >>> 21) & 0xF;

        // Opcode names
        const opcodeNames = ['AND', 'EOR', 'SUB', 'RSB', 'ADD', 'ADC', 'SBC', 'RSC',
                            'TST', 'TEQ', 'CMP', 'CMN', 'ORR', 'MOV', 'BIC', 'MVN'];

        if (els.fieldOp) {
            els.fieldOp.textContent = opcodeNames[opcode] || `OP${opcode}`;
        }
        if (els.fieldRd) {
            els.fieldRd.textContent = `R${rd}`;
        }
        if (els.fieldRn) {
            els.fieldRn.textContent = `R${rn}`;
        }
        if (els.fieldRm) {
            els.fieldRm.textContent = isImmediate ? `#${imm}` : `R${rm}`;
        }

        // Execute: Show ALU inputs and operation
        const valRn = cpu.reg(rn) || 0;
        const valRm = isImmediate ? imm : (cpu.reg(rm) || 0);

        if (els.aluA) {
            els.aluA.textContent = `0x${(valRn >>> 0).toString(16).padStart(8, '0')}`;
        }
        if (els.aluB) {
            els.aluB.textContent = `0x${(valRm >>> 0).toString(16).padStart(8, '0')}`;
        }
        if (els.aluOp) {
            els.aluOp.textContent = opcodeNames[opcode] || '?';
        }

        // ALU result (simplified - actual result depends on operation)
        const valRd = cpu.reg(rd) || 0;
        if (els.aluResult) {
            els.aluResult.textContent = `0x${(valRd >>> 0).toString(16).padStart(8, '0')}`;
        }

        // Memory stage: Show address if load/store
        const isLoadStore = ((instr >>> 26) & 0x3) === 1;
        if (els.memAddr) {
            if (isLoadStore) {
                const addr = valRn + (isImmediate ? imm : valRm);
                els.memAddr.textContent = `0x${(addr >>> 0).toString(16).padStart(8, '0')}`;
            } else {
                els.memAddr.textContent = '-';
            }
        }

        // Writeback info
        if (els.wbInfo) {
            els.wbInfo.textContent = `R${rd} <- 0x${(valRd >>> 0).toString(16).padStart(8, '0')}`;
        }

    } catch (err) {
        // read_word may not be available
        console.debug('Pipeline display update failed:', err);
    }
}

async function runLoop() {
    if (!isRunning || !cpu) return;

    const result = await animateStep();

    if (result === 'running') {
        // Continue running
        const delay = Math.max(10, 300 / speed);
        animationId = setTimeout(runLoop, delay);
    } else {
        // Stopped
        stopExecution();
        updateStatus(`Terminé: ${result}`);
    }
}

function startExecution() {
    if (!cpu) {
        updateStatus('Aucun programme');
        return;
    }

    isRunning = true;
    if (els.playIcon) els.playIcon.textContent = '⏸';
    if (els.playLabel) els.playLabel.textContent = 'Pause';
    updateStatus('Running...');

    runLoop();
}

function stopExecution() {
    isRunning = false;
    if (animationId) {
        clearTimeout(animationId);
        animationId = null;
    }
    if (els.playIcon) els.playIcon.textContent = '▶';
    if (els.playLabel) els.playLabel.textContent = 'Play';
}

function resetCpu() {
    if (cpu) {
        cpu.reset();
    }
    stats = { cycles: 0, instructions: 0, cacheHits: 0, cacheMisses: 0 };
    prevRegisters = new Array(16).fill(0);
    prevFlags = 0;
    prevCacheHits = 0;
    prevCacheMisses = 0;

    updateRegisters();
    updateMemoryView();
    updateStats();
    updateCacheView();
    updateStatus('Ready');

    // Clear stage highlights
    document.querySelectorAll('.cpu-stage').forEach(s => s.classList.remove('active'));

    // Clear flags
    [els.flagN, els.flagZ, els.flagC, els.flagV].forEach(el => {
        if (el) el.classList.remove('active', 'changed');
    });

    // Reset cache indicator
    if (els.cacheIndicatorDisplay) {
        els.cacheIndicatorDisplay.textContent = '-';
        els.cacheIndicatorDisplay.className = 'cache-indicator';
    }
    if (els.cacheStatus) {
        els.cacheStatus.textContent = '-';
        els.cacheStatus.style.color = '';
    }

    // Clear source line highlight
    if (currentHighlightedLine !== null) {
        const prevLine = document.getElementById(`source-line-${currentHighlightedLine}`);
        if (prevLine) {
            prevLine.classList.remove('current-line');
        }
        currentHighlightedLine = null;
    }
}

// ============================================================================
// File Loading
// ============================================================================

async function loadAsmFile(file) {
    try {
        console.log('loadAsmFile called for:', file.name);
        const source = await file.text();
        console.log('Source loaded, length:', source.length);

        await initWasm();
        console.log('WASM ready, creating CPU...');
        cpu = new wasmModule.WasmA32();
        console.log('Assembling...');
        cpu.assemble(source);
        console.log('Assembly successful');

        currentDemo = { name: file.name, source };
        displaySourceCode(source);
        resetCpu();
        updateStatus(`Chargé: ${file.name}`);
    } catch (err) {
        console.error('Failed to load file:', err);
        updateStatus('Erreur: ' + (err.message || err));
    }
}

async function loadBinaryFile(file) {
    try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        await initWasm();
        cpu = new wasmModule.WasmA32();
        cpu.load_a32b(Array.from(bytes), 0, false);

        currentDemo = { name: file.name, source: '// Binaire chargé' };
        displaySourceCode('// Fichier binaire .a32b\n// Pas de code source disponible');
        resetCpu();
        updateStatus(`Chargé: ${file.name}`);
    } catch (err) {
        console.error('Failed to load binary:', err);
        updateStatus('Erreur: ' + (err.message || err));
    }
}

// ============================================================================
// Event Handlers
// ============================================================================

function setupEventHandlers() {
    console.log('Setting up event handlers...');
    console.log('btnLoad:', els.btnLoad);
    console.log('fileInput:', els.fileInput);

    // Load file
    if (els.btnLoad) {
        els.btnLoad.addEventListener('click', () => {
            console.log('Load button clicked');
            if (els.fileInput) {
                els.fileInput.click();
            } else {
                console.error('File input not found!');
            }
        });
    } else {
        console.error('Load button not found!');
    }

    if (els.fileInput) {
        els.fileInput.addEventListener('change', (e) => {
            console.log('File input changed:', e.target.files);
            const file = e.target.files?.[0];
            if (file) {
                console.log('Loading file:', file.name);
                stopExecution();
                if (file.name.endsWith('.asm') || file.name.endsWith('.a32') || file.name.endsWith('.s')) {
                    loadAsmFile(file);
                } else if (file.name.endsWith('.a32b')) {
                    loadBinaryFile(file);
                } else {
                    updateStatus('Format non supporté (utilisez .asm, .a32 ou .a32b)');
                }
            }
        });
    }

    // Update file input to accept all assembly formats
    if (els.fileInput) {
        els.fileInput.accept = '.asm,.a32,.s,.a32b';
    }

    // Playback controls
    if (els.btnReset) {
        els.btnReset.addEventListener('click', () => {
            stopExecution();
            resetCpu();
        });
    }

    if (els.btnStep) {
        els.btnStep.addEventListener('click', async () => {
            stopExecution();
            if (cpu) {
                const result = await animateStep();
                if (result !== 'running') {
                    updateStatus(`Terminé: ${result}`);
                }
            }
        });
    }

    if (els.btnPlay) {
        els.btnPlay.addEventListener('click', () => {
            if (isRunning) {
                stopExecution();
                updateStatus('Pause');
            } else {
                startExecution();
            }
        });
    }

    // Speed control
    if (els.speedSlider) {
        els.speedSlider.addEventListener('input', (e) => {
            speed = parseInt(e.target.value, 10);
            if (els.speedLabel) els.speedLabel.textContent = speed;
        });
    }

    // Animation toggle
    if (els.animateStages) {
        els.animateStages.addEventListener('change', (e) => {
            animateStages = e.target.checked;
        });
    }

    // Memory navigation
    if (els.btnMemGoto) {
        els.btnMemGoto.addEventListener('click', () => {
            const addr = parseAddress(els.memGoto?.value || '');
            if (!isNaN(addr)) {
                if (els.memFollowPc) els.memFollowPc.checked = false;
                updateMemoryView(addr);
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;

        switch (e.key) {
            case ' ':
                e.preventDefault();
                els.btnPlay?.click();
                break;
            case 'n':
            case 'F10':
                e.preventDefault();
                els.btnStep?.click();
                break;
            case 'r':
                if (e.ctrlKey) {
                    e.preventDefault();
                    els.btnReset?.click();
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
    const trimmed = (text || '').trim();
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

    // Load demos from manifest
    await loadDemoManifest();
    createDemoMenu();

    setupEventHandlers();

    await initWasm();
    updateStatus('Choisissez une demo ou chargez un fichier .asm');
}

main().catch(console.error);
