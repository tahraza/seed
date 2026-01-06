// nand2tetris-codex - Web IDE
// Main Application JavaScript

import { HDL_CHIPS, PROJECTS, getChip, canAttempt, getDependencyLibrary } from './hdl-progression.js';
import { ASM_EXERCISES, getAsmExercise, getAsmExerciseIds } from './asm-exercises.js';
import { C_EXERCISES, getCExercise, getCExerciseIds } from './c-exercises.js';
import { OS_EXERCISES, getOsExercise, getOsExerciseIds } from './os-exercises.js';
import { COMPILER_EXERCISES, getCompilerExercise, getCompilerExerciseIds } from './compiler-exercises.js';
import { VisualizerManager } from './visualizers.js';

// ============================================================================
// Hide solution buttons unless --solutions flag was used
// ============================================================================
if (!__SHOW_SOLUTIONS__) {
    const style = document.createElement('style');
    style.textContent = '.solution { display: none !important; }';
    document.head.appendChild(style);
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
    SCREEN_WIDTH: 320,
    SCREEN_HEIGHT: 240,
    SCREEN_BASE: 0x00400000,
    KEYBOARD_ADDR: 0x00402600,  // Real-time keyboard
    PUTC_ADDR: 0xFFFF0000,      // Console output
    GETC_ADDR: 0xFFFF0004,      // Input buffer
    NUM_REGISTERS: 16,
    DEFAULT_SPEED: 50,
    STORAGE_KEY: 'nand2tetris-codex-progress',
    HDL_LIBRARY_KEY: 'nand2tetris-codex-hdl-library'
};

// ============================================================================
// State
// ============================================================================

const state = {
    mode: 'hdl',           // 'hdl', 'asm', 'c' - start with HDL for learning
    editor: null,          // Monaco editor instance
    asmOutputEditor: null, // Secondary Monaco editor for C->ASM output
    wasmModule: null,      // WASM module
    hdlSim: null,          // WasmHdl instance
    asmSim: null,          // WasmA32 instance
    running: false,
    paused: false,
    programFinished: false, // True when program has exited or trapped
    speed: CONFIG.DEFAULT_SPEED,
    lastAssembledBytes: null,  // Last assembled binary for download
    files: {
        hdl: { 'main': '' },  // Will be set from progression
        asm: { 'main': '// Assembly Program\n\n.text\n_start:\n    MOV R0, #0          ; counter\n    MOV R1, #10         ; limit\n\nloop:\n    ADD R0, R0, #1      ; increment\n    CMP R0, R1\n    B.LT loop            ; branch if less than\n\n    ; Output result\n    LDR R2, =0xFFFF0000\n    STR R0, [R2]\n\n    ; Halt\nhalt:\n    B halt\n' },
        c: { 'main': '// C Program\n\nint *OUTPUT = (int*)0xFFFF0000;\n\nint factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n\nint main() {\n    int result = factorial(5);\n    *OUTPUT = result;\n    return 0;\n}\n' }
    },
    currentFile: 'main',
    currentChip: 'Inv',    // Current HDL chip being worked on
    currentAsmExercise: 'asm-hello',  // Current ASM exercise
    currentCExercise: 'c-var',        // Current C exercise
    currentOsExercise: 'os-boot',     // Current OS exercise
    currentCompilerExercise: 'cc-lexer-digit',  // Current compiler exercise
    progress: {},          // General progress
    hdlLibrary: {},        // Unlocked chip sources: { chipName: hdlSource }
    animationFrame: null,
    visualizers: null,     // VisualizerManager instance
    sourceMap: null,       // PC address → source line mapping
    currentLineDecoration: []  // Monaco decoration for current line
};

// ============================================================================
// Monaco Editor Setup
// ============================================================================

async function initMonaco() {
    return new Promise((resolve) => {
        require.config({
            paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }
        });

        require(['vs/editor/editor.main'], function() {
            // Register HDL language
            monaco.languages.register({ id: 'hdl' });
            monaco.languages.setMonarchTokensProvider('hdl', {
                keywords: ['CHIP', 'IN', 'OUT', 'PARTS', 'BUILTIN', 'CLOCKED'],
                builtins: ['Nand', 'Not', 'And', 'Or', 'Xor', 'Mux', 'DMux', 'Not16', 'And16', 'Or16', 'Mux16', 'Or8Way', 'Mux4Way16', 'Mux8Way16', 'DMux4Way', 'DMux8Way', 'HalfAdder', 'FullAdder', 'Add16', 'Inc16', 'ALU', 'DFF', 'Bit', 'Register', 'RAM8', 'RAM64', 'RAM512', 'RAM4K', 'RAM16K', 'PC', 'ROM32K', 'Screen', 'Keyboard', 'Memory', 'CPU', 'Computer'],
                tokenizer: {
                    root: [
                        [/\/\/.*$/, 'comment'],
                        [/\/\*/, 'comment', '@comment'],
                        [/[a-zA-Z_]\w*/, {
                            cases: {
                                '@keywords': 'keyword',
                                '@builtins': 'type',
                                '@default': 'identifier'
                            }
                        }],
                        [/[{}()\[\];,=]/, 'delimiter'],
                        [/\d+/, 'number'],
                        [/true|false/, 'keyword'],
                    ],
                    comment: [
                        [/[^/*]+/, 'comment'],
                        [/\*\//, 'comment', '@pop'],
                        [/[/*]/, 'comment']
                    ]
                }
            });

            // Register A32 Assembly language
            monaco.languages.register({ id: 'a32asm' });
            monaco.languages.setMonarchTokensProvider('a32asm', {
                instructions: ['MOV', 'MVN', 'ADD', 'ADC', 'SUB', 'SBC', 'RSB', 'RSC', 'AND', 'ORR', 'EOR', 'BIC', 'MUL', 'MLA', 'SDIV', 'UDIV', 'CMP', 'CMN', 'TST', 'TEQ', 'LDR', 'LDRB', 'LDRH', 'STR', 'STRB', 'STRH', 'LDM', 'STM', 'PUSH', 'POP', 'B', 'BL', 'BX', 'BEQ', 'BNE', 'BCS', 'BCC', 'BMI', 'BPL', 'BVS', 'BVC', 'BHI', 'BLS', 'BGE', 'BLT', 'BGT', 'BLE', 'SWI', 'NOP', 'LSL', 'LSR', 'ASR', 'ROR', 'RRX'],
                registers: ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15', 'SP', 'LR', 'PC', 'CPSR'],
                directives: ['.text', '.data', '.bss', '.word', '.byte', '.ascii', '.asciz', '.space', '.align', '.global', '.extern', '.equ', '.set'],
                tokenizer: {
                    root: [
                        [/;.*$/, 'comment'],
                        [/@.*$/, 'comment'],
                        [/\/\/.*$/, 'comment'],
                        [/^\s*\.[a-zA-Z_]\w*/, 'keyword.directive'],
                        [/^\s*[a-zA-Z_]\w*:/, 'type.identifier'],
                        [/\b(R\d+|SP|LR|PC|CPSR)\b/i, 'variable.predefined'],
                        [/\b[A-Z]{2,5}\b/, {
                            cases: {
                                '@instructions': 'keyword',
                                '@default': 'identifier'
                            }
                        }],
                        [/#-?\d+/, 'number'],
                        [/#0x[0-9a-fA-F]+/, 'number.hex'],
                        [/=\w+/, 'string'],
                        [/0x[0-9a-fA-F]+/, 'number.hex'],
                        [/\d+/, 'number'],
                        [/"[^"]*"/, 'string'],
                        [/'[^']*'/, 'string'],
                        [/[{}()\[\],!]/, 'delimiter'],
                    ]
                }
            });

            // Register C32 language (subset of C)
            monaco.languages.register({ id: 'c32' });
            monaco.languages.setMonarchTokensProvider('c32', {
                keywords: ['auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while'],
                operators: ['=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=', '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%', '<<', '>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=', '%=', '<<=', '>>='],
                tokenizer: {
                    root: [
                        [/\/\/.*$/, 'comment'],
                        [/\/\*/, 'comment', '@comment'],
                        [/#\s*\w+/, 'keyword.directive'],
                        [/[a-zA-Z_]\w*/, {
                            cases: {
                                '@keywords': 'keyword',
                                '@default': 'identifier'
                            }
                        }],
                        [/0x[0-9a-fA-F]+/, 'number.hex'],
                        [/\d+/, 'number'],
                        [/"[^"]*"/, 'string'],
                        [/'[^']*'/, 'string.char'],
                        [/[{}()\[\];,.]/, 'delimiter'],
                        [/[+\-*/%&|^~<>=!?:]/, 'operator'],
                    ],
                    comment: [
                        [/[^/*]+/, 'comment'],
                        [/\*\//, 'comment', '@pop'],
                        [/[/*]/, 'comment']
                    ]
                }
            });

            // Create editor
            const container = document.getElementById('editor-container');
            state.editor = monaco.editor.create(container, {
                value: state.files[state.mode][state.currentFile],
                language: getLanguageId(state.mode),
                theme: document.documentElement.dataset.theme === 'light' ? 'vs' : 'vs-dark',
                fontSize: 14,
                fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                tabSize: 4,
                insertSpaces: true,
                wordWrap: 'off',
                folding: true,
                bracketPairColorization: { enabled: true }
            });

            // Save content on change
            state.editor.onDidChangeModelContent(() => {
                state.files[state.mode][state.currentFile] = state.editor.getValue();
            });

            resolve();
        });
    });
}

function getLanguageId(mode) {
    switch (mode) {
        case 'hdl': return 'hdl';
        case 'asm': return 'a32asm';
        case 'c': return 'c32';
        default: return 'plaintext';
    }
}

function getFileExtension(mode) {
    switch (mode) {
        case 'hdl': return '.hdl';
        case 'asm': return '.a32';
        case 'c': return '.c';
        default: return '.txt';
    }
}

// ============================================================================
// Mode Switching
// ============================================================================

function switchMode(newMode) {
    if (newMode === state.mode) return;

    // Save current content
    state.files[state.mode][state.currentFile] = state.editor.getValue();

    // Switch mode
    state.mode = newMode;

    // Update UI
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === newMode);
    });

    // Update tab name
    updateFileTabs();

    // Load new content
    const content = state.files[newMode][state.currentFile] || '';
    monaco.editor.setModelLanguage(state.editor.getModel(), getLanguageId(newMode));
    state.editor.setValue(content);

    // Update panel title based on mode
    updateModeSpecificUI();

    log(`Mode switched to ${newMode.toUpperCase()}`, 'info');
}

function updateFileTabs() {
    const tabs = document.getElementById('file-tabs');
    const ext = getFileExtension(state.mode);
    tabs.querySelector('.tab').textContent = state.currentFile + ext;
}

function updateModeSpecificUI() {
    // Show/hide mode-specific controls
    const screenWrapper = document.querySelector('.screen-wrapper');
    const registersSection = document.querySelector('.registers-section');
    const memorySection = document.querySelector('.memory-section');
    const visualizersSection = document.querySelector('.visualizers-section');

    const hdlSignalsSection = document.getElementById('hdl-signals');

    if (state.mode === 'hdl') {
        screenWrapper.style.display = 'none';
        registersSection.style.display = 'none';
        if (hdlSignalsSection) hdlSignalsSection.style.display = 'block';
        // Show waveform for HDL
        if (visualizersSection) {
            visualizersSection.style.display = 'block';
            // Switch to waveform tab for HDL mode
            document.querySelectorAll('.viz-tab').forEach(t => t.classList.remove('active'));
            document.querySelector('.viz-tab[data-viz="waveform"]')?.classList.add('active');
            document.querySelectorAll('.viz-panel').forEach(p => p.classList.remove('active'));
            document.getElementById('waveform-visualizer')?.classList.add('active');
        }
    } else {
        screenWrapper.style.display = 'block';
        registersSection.style.display = 'block';
        if (hdlSignalsSection) hdlSignalsSection.style.display = 'none';
        // Show memory visualizer for ASM/C
        if (visualizersSection) {
            visualizersSection.style.display = 'block';
            // Switch to memory tab for ASM/C mode
            document.querySelectorAll('.viz-tab').forEach(t => t.classList.remove('active'));
            document.querySelector('.viz-tab[data-viz="memory"]')?.classList.add('active');
            document.querySelectorAll('.viz-panel').forEach(p => p.classList.remove('active'));
            document.getElementById('memory-visualizer')?.classList.add('active');
        }
    }

    // Switch output panel based on mode
    const outputHdl = document.getElementById('output-hdl');
    const outputAsm = document.getElementById('output-asm');
    const outputC = document.getElementById('output-c');

    outputHdl.style.display = state.mode === 'hdl' ? 'flex' : 'none';
    outputAsm.style.display = state.mode === 'asm' ? 'flex' : 'none';
    outputC.style.display = state.mode === 'c' ? 'flex' : 'none';

    // Initialize ASM output editor for C mode if needed
    if (state.mode === 'c' && !state.asmOutputEditor) {
        initAsmOutputEditor();
    }

    // Layout editor after mode switch
    if (state.editor) {
        setTimeout(() => state.editor.layout(), 0);
    }
    if (state.asmOutputEditor) {
        setTimeout(() => state.asmOutputEditor.layout(), 0);
    }
}

function initAsmOutputEditor() {
    const container = document.getElementById('asm-output-container');
    if (!container || state.asmOutputEditor) return;

    state.asmOutputEditor = monaco.editor.create(container, {
        value: '; Appuyez sur Run pour compiler...',
        language: 'a32asm',
        theme: document.documentElement.dataset.theme === 'light' ? 'vs' : 'vs-dark',
        fontSize: 12,
        fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
        minimap: { enabled: false },
        automaticLayout: true,
        readOnly: true,
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        folding: false,
        wordWrap: 'off'
    });
}

// ============================================================================
// Simulator Integration
// ============================================================================

async function initSimulator() {
    // Initialize display first
    initRegistersDisplay();
    initMemoryDisplay();
    initScreen();

    // Try to load the WASM module dynamically
    const wasmPath = './pkg/web_sim.js';

    try {
        const response = await fetch(wasmPath, { method: 'HEAD' }).catch(() => null);

        if (response && response.ok) {
            const module = await import(/* @vite-ignore */ wasmPath);
            await module.default();
            state.wasmModule = module;

            // Create simulator instances
            state.hdlSim = new module.WasmHdl();
            state.asmSim = new module.WasmA32();

            // Initialize visualizers
            initVisualizers();

            log('Simulator ready', 'success');
        } else {
            log('WASM not built - run: npm run build:wasm', 'warn');
        }
    } catch (e) {
        log(`Simulator: ${e.message}`, 'warn');
        console.warn('WASM simulator not loaded:', e);
    }
}

function initRegistersDisplay() {
    const container = document.getElementById('registers');
    container.innerHTML = '';
    for (let i = 0; i < CONFIG.NUM_REGISTERS; i++) {
        const reg = document.createElement('div');
        reg.className = 'register';
        reg.innerHTML = `
            <span class="reg-name">R${i}</span>
            <span class="reg-value" id="reg-${i}">0x00000000</span>
        `;
        container.appendChild(reg);
    }
}

function initMemoryDisplay() {
    const container = document.getElementById('memory-view');
    container.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const row = document.createElement('div');
        row.className = 'mem-row';
        row.innerHTML = `
            <span class="mem-addr">${formatHex(i * 4, 8)}</span>
            <span class="mem-value" id="mem-${i}">00000000</span>
        `;
        container.appendChild(row);
    }
}

function initScreen() {
    const canvas = document.getElementById('screen');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CONFIG.SCREEN_WIDTH, CONFIG.SCREEN_HEIGHT);
}

function initVisualizers() {
    try {
        // Create visualizer manager
        state.visualizers = new VisualizerManager();

        // Attach simulator
        if (state.asmSim) {
            state.visualizers.attachSimulator(state.asmSim);
        }

        // Initialize memory visualizer if container exists
        const memContainer = document.getElementById('memory-visualizer');
        if (memContainer) {
            state.visualizers.initMemory(memContainer);
        }

        // Initialize call stack visualizer if container exists
        const callstackContainer = document.getElementById('callstack-visualizer');
        if (callstackContainer) {
            state.visualizers.initCallStack(callstackContainer);
        }

        // Initialize waveform visualizer if container exists
        const waveformContainer = document.getElementById('waveform-visualizer');
        if (waveformContainer) {
            state.visualizers.initWaveform(waveformContainer);
        }

        // Initialize ALU visualizer if container exists
        const aluContainer = document.getElementById('alu-visualizer');
        if (aluContainer) {
            state.visualizers.initALU(aluContainer);
        }

        log('Visualizers initialized', 'info');
    } catch (e) {
        console.warn('Failed to initialize visualizers:', e);
        state.visualizers = null;
    }
}

function updateVisualizers() {
    if (state.visualizers) {
        try {
            state.visualizers.update();
        } catch (e) {
            console.warn('Visualizer update error:', e);
        }
    }
}

/**
 * Build a map from PC addresses to source line numbers
 * For ASM: parse source to find instruction lines
 * For C: map to generated ASM lines
 */
function buildSourceMap(source) {
    const map = new Map();
    const lines = source.split('\n');
    let addr = 0;
    let inTextSection = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('//')) {
            continue;
        }

        // Track sections
        if (trimmed === '.text' || trimmed.startsWith('.text')) {
            inTextSection = true;
            continue;
        }
        if (trimmed === '.data' || trimmed.startsWith('.data')) {
            inTextSection = false;
            continue;
        }

        // Skip directives (except in data section)
        if (trimmed.startsWith('.')) {
            continue;
        }

        // Skip labels (lines ending with : without instruction)
        if (trimmed.endsWith(':') && !trimmed.includes(' ')) {
            continue;
        }

        // This looks like an instruction
        if (inTextSection || !lines.some(l => l.trim() === '.data')) {
            // Remove label prefix if present (e.g., "loop: ADD R0, R1")
            let instruction = trimmed;
            if (instruction.includes(':')) {
                instruction = instruction.split(':').pop().trim();
            }

            if (instruction && !instruction.startsWith('.') && !instruction.startsWith(';')) {
                map.set(addr, i + 1);  // Line numbers are 1-based
                addr += 4;  // Each instruction is 4 bytes
            }
        }
    }

    return map;
}

/**
 * Highlight the current line in the editor based on PC
 */
function highlightCurrentLine(editor, lineNumber) {
    if (!editor || !lineNumber) return;

    // Clear previous decoration
    state.currentLineDecoration = editor.deltaDecorations(
        state.currentLineDecoration,
        [{
            range: new monaco.Range(lineNumber, 1, lineNumber, 1),
            options: {
                isWholeLine: true,
                className: 'current-line-highlight',
                glyphMarginClassName: 'current-line-glyph'
            }
        }]
    );

    // Scroll to make the line visible
    editor.revealLineInCenter(lineNumber);
}

/**
 * Clear line highlighting
 */
function clearLineHighlight() {
    if (state.editor && state.currentLineDecoration.length > 0) {
        state.currentLineDecoration = state.editor.deltaDecorations(
            state.currentLineDecoration,
            []
        );
    }
    // Also clear ASM output editor if in C mode
    if (state.asmOutputEditor) {
        state.asmOutputEditor.deltaDecorations(
            state.asmOutputEditor.getModel()?.getAllDecorations()?.map(d => d.id) || [],
            []
        );
    }
}

/**
 * Update line highlighting based on current PC
 */
function updateLineHighlight() {
    if (!state.asmSim || !state.sourceMap) return;

    try {
        const pc = state.asmSim.reg(15);
        // PC points to next instruction, so subtract 4 to get current
        const currentAddr = pc > 0 ? pc - 4 : 0;
        const lineNumber = state.sourceMap.get(currentAddr);

        if (lineNumber) {
            // For C mode, highlight in the ASM output editor
            // For ASM mode, highlight in the main editor
            const editor = (state.mode === 'c' && state.asmOutputEditor)
                ? state.asmOutputEditor
                : state.editor;
            highlightCurrentLine(editor, lineNumber);
        }
    } catch (e) {
        // Program not loaded or other error
    }
}

/**
 * Parse VHDL entity to extract inputs and outputs
 */
function parseVhdlPorts(vhdlCode) {
    const inputs = [];
    const outputs = [];

    // Find port section
    const portMatch = vhdlCode.match(/port\s*\(([\s\S]*?)\)\s*;/i);
    if (!portMatch) return { inputs, outputs };

    const portSection = portMatch[1];

    // Parse each port line
    const lines = portSection.split(/[;\n]/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Match: name : in/out type
        const match = trimmed.match(/(\w+)\s*:\s*(in|out)\s+(\w+)(?:\s*\(\s*(\d+)\s+downto\s+(\d+)\s*\))?/i);
        if (match) {
            const name = match[1];
            const direction = match[2].toLowerCase();
            const type = match[3];
            const high = match[4] ? parseInt(match[4]) : null;
            const low = match[5] ? parseInt(match[5]) : null;

            const width = (high !== null && low !== null) ? (high - low + 1) : 1;

            if (direction === 'in') {
                inputs.push({ name, width });
            } else {
                outputs.push({ name, width });
            }
        }
    }

    return { inputs, outputs };
}

/**
 * Initialize HDL signals panel based on chip definition
 */
function initHdlSignals(chipDef) {
    const inputsList = document.getElementById('hdl-inputs-list');
    const outputsList = document.getElementById('hdl-outputs-list');

    if (!inputsList || !outputsList) return;

    inputsList.innerHTML = '';
    outputsList.innerHTML = '';

    // Parse inputs and outputs from VHDL template
    const vhdlCode = chipDef?.template || chipDef?.solution || '';
    const { inputs, outputs } = parseVhdlPorts(vhdlCode);

    // Create input controls
    inputs.forEach(input => {
        const row = document.createElement('div');
        row.className = 'signal-row';

        const name = input.name || input;
        const width = input.width || 1;

        if (width === 1) {
            // Single bit - use toggle button
            row.innerHTML = `
                <span class="signal-name">${name}</span>
                <button class="signal-toggle" data-signal="${name}" data-value="0"></button>
            `;
            const toggle = row.querySelector('.signal-toggle');
            toggle.addEventListener('click', () => {
                const newValue = toggle.dataset.value === '0' ? '1' : '0';
                toggle.dataset.value = newValue;
                toggle.classList.toggle('active', newValue === '1');
                setHdlInput(name, newValue);
            });
        } else {
            // Multi-bit - use text input
            row.innerHTML = `
                <span class="signal-name">${name}[${width}]</span>
                <input type="text" class="signal-input" data-signal="${name}" value="0" placeholder="0">
            `;
            const input = row.querySelector('.signal-input');
            input.addEventListener('change', () => {
                setHdlInput(name, input.value);
            });
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    setHdlInput(name, input.value);
                }
            });
        }

        inputsList.appendChild(row);
    });

    // Create output displays
    outputs.forEach(output => {
        const row = document.createElement('div');
        row.className = 'signal-row';

        const name = output.name || output;
        const width = output.width || 1;

        row.innerHTML = `
            <span class="signal-name">${name}${width > 1 ? '[' + width + ']' : ''}</span>
            <span class="signal-value" data-signal="${name}">?</span>
        `;

        outputsList.appendChild(row);
    });
}

/**
 * Set an HDL input signal value
 */
function setHdlInput(name, value) {
    if (!state.hdlSim) return;

    try {
        state.hdlSim.set_signal(name, value);
        log(`Set ${name} = ${value}`, 'info');
    } catch (e) {
        log(`Error setting ${name}: ${e}`, 'error');
    }
}

/**
 * Update HDL output displays
 */
function updateHdlOutputs() {
    if (!state.hdlSim) return;

    const outputsList = document.getElementById('hdl-outputs-list');
    if (!outputsList) return;

    outputsList.querySelectorAll('.signal-value').forEach(el => {
        const name = el.dataset.signal;
        try {
            const value = state.hdlSim.get_signal(name);
            el.textContent = value;
            el.classList.remove('error');
        } catch (e) {
            el.textContent = '?';
            el.classList.add('error');
        }
    });

    // Also update inputs display (in case they changed)
    const inputsList = document.getElementById('hdl-inputs-list');
    if (inputsList) {
        inputsList.querySelectorAll('.signal-input').forEach(el => {
            const name = el.dataset.signal;
            try {
                const value = state.hdlSim.get_signal(name);
                // Don't overwrite if user is editing
                if (document.activeElement !== el) {
                    el.value = value;
                }
            } catch (e) {}
        });
    }
}

function updateRegisters() {
    // Note: The current WASM API doesn't expose individual register values
    // Registers display shows placeholder values
    // TODO: Add get_registers() to WasmA32 API
}

function updateMemory(baseAddr) {
    // Note: The current WASM API doesn't expose memory read
    // Memory display shows placeholder values
    // TODO: Add read_memory() to WasmA32 API
}

function updateScreen(force = false) {
    if (!state.asmSim) return;

    const canvas = document.getElementById('screen');
    const ctx = canvas.getContext('2d');

    try {
        // Check if screen was modified (skip check if force=true)
        if (!force && !state.asmSim.screen_dirty()) return;

        const screenBytes = state.asmSim.screen();
        const imageData = ctx.createImageData(CONFIG.SCREEN_WIDTH, CONFIG.SCREEN_HEIGHT);
        const data = imageData.data;

        // Screen is 1-bit per pixel, MSB first
        for (let y = 0; y < CONFIG.SCREEN_HEIGHT; y++) {
            for (let x = 0; x < CONFIG.SCREEN_WIDTH; x++) {
                const bitIndex = y * CONFIG.SCREEN_WIDTH + x;
                const byteIndex = Math.floor(bitIndex / 8);
                const bitOffset = 7 - (bitIndex % 8);

                const pixel = (screenBytes[byteIndex] >> bitOffset) & 1;
                const idx = (y * CONFIG.SCREEN_WIDTH + x) * 4;

                // White on black
                const color = pixel ? 255 : 0;
                data[idx] = color;
                data[idx + 1] = color;
                data[idx + 2] = color;
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        state.asmSim.clear_screen_dirty();
    } catch (e) {
        // Screen not available
    }
}

// ============================================================================
// Run Controls
// ============================================================================

async function run() {
    if (state.running && !state.paused) return;

    try {
        if (state.mode === 'hdl') {
            await assemble();  // Load HDL
            // Don't set running=true for HDL, so Step button stays enabled
            state.running = false;
            state.paused = false;
            updateControlButtons();
            log('HDL loaded - use Step to simulate', 'info');
        } else {
            // For ASM/C, assemble/compile first
            if (!state.asmSim) {
                log('Simulator not initialized - run npm run build:wasm', 'warn');
                return;
            }
            await assemble();  // Compile/assemble the code
            state.programFinished = false;
            state.running = true;
            state.paused = false;
            state.lastOutputLen = 0;  // Reset output tracking
            updateControlButtons();
            log('Running...', 'info');
            runLoop();
        }
    } catch (e) {
        log(`Error: ${e.message}`, 'error');
    }
}

function runLoop() {
    if (!state.running || state.paused) return;
    if (!state.asmSim) return;

    // Much faster: use run() with many steps instead of step() loop
    // Speed 1-100 maps to 10000-1000000 steps per frame
    const stepsPerFrame = Math.ceil(state.speed / 10) * 100000;

    try {
        const result = state.asmSim.run(stepsPerFrame);
        if (result !== 'running') {
            state.programFinished = true;
            stop();
            // Update display after program ends
            updateRegisters();
            updateScreen(true);
            // Get output and display it
            try {
                const output = state.asmSim.output();
                if (output) {
                    log(`Output: ${output}`, 'info');
                }
            } catch (e) {}
            log(`Program ${result}`, 'info');
            return;
        }

        updateRegisters();
        updateScreen();

        // Show new output during execution (for interactive programs)
        try {
            const output = state.asmSim.output();
            if (output && output.length > (state.lastOutputLen || 0)) {
                const newOutput = output.slice(state.lastOutputLen || 0);
                state.lastOutputLen = output.length;
                if (newOutput.trim()) {
                    log(`${newOutput}`, 'output');
                }
            }
        } catch (e) {}

        state.animationFrame = requestAnimationFrame(runLoop);
    } catch (e) {
        stop();
        log(`Runtime error: ${e}`, 'error');
    }
}

function pause() {
    state.paused = !state.paused;
    updateControlButtons();

    if (state.paused) {
        log('Paused', 'info');
        if (state.animationFrame) {
            cancelAnimationFrame(state.animationFrame);
        }
    } else {
        log('Resumed', 'info');
        runLoop();
    }
}

function stop() {
    state.running = false;
    state.paused = false;
    if (state.animationFrame) {
        cancelAnimationFrame(state.animationFrame);
        state.animationFrame = null;
    }
    updateControlButtons();
    log('Stopped', 'info');
}

async function step() {
    try {
        if (state.mode === 'hdl') {
            if (!state.hdlSim) {
                log('HDL simulator not initialized', 'warn');
                return;
            }

            // Helper to save current input values before assemble() resets them
            function saveInputValues() {
                const saved = {};
                document.querySelectorAll('#hdl-inputs-list .signal-toggle').forEach(toggle => {
                    saved[toggle.dataset.signal] = toggle.dataset.value;
                });
                document.querySelectorAll('#hdl-inputs-list .signal-input').forEach(input => {
                    saved[input.dataset.signal] = input.value;
                });
                return saved;
            }

            // Helper to restore input values after assemble()
            function restoreInputValues(saved) {
                for (const [signal, value] of Object.entries(saved)) {
                    // Find toggle button
                    const toggle = document.querySelector(`#hdl-inputs-list .signal-toggle[data-signal="${signal}"]`);
                    if (toggle) {
                        toggle.dataset.value = value;
                        toggle.classList.toggle('active', value === '1');
                        setHdlInput(signal, value);
                    }
                    // Find text input
                    const input = document.querySelector(`#hdl-inputs-list .signal-input[data-signal="${signal}"]`);
                    if (input) {
                        input.value = value;
                        setHdlInput(signal, value);
                    }
                }
            }

            // Try tick/tock for sequential chips, fall back to eval for combinational
            try {
                state.hdlSim.tick();
                state.hdlSim.tock();
                log('HDL: tick-tock', 'info');
            } catch (e) {
                const errStr = e.toString();
                // Combinational chip (no clock) - just evaluate
                if (errStr.includes('unknown signal')) {
                    try {
                        state.hdlSim.eval();
                        log('HDL: eval', 'info');
                    } catch (evalErr) {
                        // If eval fails because not loaded, load first
                        if (evalErr.toString().includes('not loaded')) {
                            const savedInputs = saveInputValues();
                            await assemble();
                            restoreInputValues(savedInputs);
                            state.hdlSim.eval();
                            log('HDL: eval', 'info');
                        } else {
                            log(`HDL eval error: ${evalErr}`, 'error');
                            return;
                        }
                    }
                } else if (errStr.includes('not loaded')) {
                    // HDL not loaded yet, load it first
                    const savedInputs = saveInputValues();
                    await assemble();
                    restoreInputValues(savedInputs);
                    // Try again
                    try {
                        state.hdlSim.eval();
                        log('HDL: eval', 'info');
                    } catch (e2) {
                        log(`HDL error: ${e2}`, 'error');
                        return;
                    }
                } else {
                    log(`HDL step error: ${e}`, 'error');
                    return;
                }
            }
            // Update outputs display
            updateHdlOutputs();
        } else {
            if (!state.asmSim) {
                log('Simulator not initialized - run npm run build:wasm', 'warn');
                return;
            }
            // Check if we need to assemble first
            let needsAssemble = state.programFinished;
            if (!needsAssemble) {
                try {
                    // Try to get PC - if this fails, program not loaded
                    state.asmSim.reg(15);
                } catch (e) {
                    needsAssemble = true;
                }
            }

            if (needsAssemble) {
                await assemble();
                state.programFinished = false;
            }

            const result = state.asmSim.step();
            if (result !== 'running') {
                state.programFinished = true;
                try {
                    const output = state.asmSim.output();
                    if (output) log(`Output: ${output}`, 'info');
                } catch (e) {}
                log(`Program ${result}`, 'info');
            } else {
                // Show current PC for debugging
                try {
                    const pc = state.asmSim.reg(15);
                    log(`Step: PC = 0x${pc.toString(16).padStart(8, '0')}`, 'info');
                } catch (e) {}
            }
            updateRegisters();
            updateMemory(0);
            updateScreen();
            updateVisualizers();
            updateLineHighlight();
        }
    } catch (e) {
        log(`Step error: ${e}`, 'error');
    }
}

function reset() {
    stop();
    state.programFinished = false;
    if (state.asmSim) {
        try {
            state.asmSim.reset();
            log('Reset', 'info');
        } catch (e) {
            log('No program loaded to reset', 'warn');
        }
    }
    updateRegisters();
    initScreen();
    clearLineHighlight();
    if (state.visualizers) {
        state.visualizers.reset();
    }
}

async function assemble() {
    const code = state.editor.getValue();

    if (state.mode === 'hdl') {
        if (!state.hdlSim) {
            throw new Error('HDL simulator not initialized');
        }
        // Load HDL design
        try {
            // Extract entity name from VHDL syntax (entity Name is) or nand2tetris (CHIP Name {)
            let chipName = 'Main';
            const vhdlMatch = code.match(/entity\s+(\w+)\s+is/i);
            const n2tMatch = code.match(/CHIP\s+(\w+)/);
            if (vhdlMatch) {
                chipName = vhdlMatch[1];
            } else if (n2tMatch) {
                chipName = n2tMatch[1];
            }

            // Get dependency library (nand2, Inv, And2, etc.)
            const library = getDependencyLibrary(state.currentChip, state.hdlLibrary);
            const sources = [code];

            // Add library sources
            for (const [name, src] of Object.entries(library)) {
                if (src && typeof src === 'string') {
                    sources.push(src);
                }
            }

            state.hdlSim.load(chipName, sources);

            // Initialize HDL signals panel with chip definition
            const chipDef = getChip(state.currentChip);
            initHdlSignals(chipDef);

            log(`HDL loaded: ${chipName}`, 'success');
        } catch (e) {
            throw new Error(`HDL error: ${e}`);
        }
    } else if (state.mode === 'asm') {
        if (!state.asmSim) {
            throw new Error('Simulator not initialized');
        }
        // Assemble and load directly using WASM
        try {
            state.asmSim.assemble(code);
            // Build source map for line highlighting
            state.sourceMap = buildSourceMap(code);
            clearLineHighlight();
            log('Assembly successful', 'success');
            updateAsmBinaryOutput();
        } catch (e) {
            throw new Error(`Assembly error: ${e}`);
        }
    } else if (state.mode === 'c') {
        if (!state.asmSim) {
            throw new Error('Simulator not initialized');
        }
        // Compile C to ASM first, then assemble
        try {
            // Try to get generated ASM for display
            let generatedAsm = null;
            try {
                generatedAsm = state.asmSim.compile_to_asm(code);
                updateCOutputPanel(generatedAsm);
            } catch (e) {
                // compile_to_asm might fail, that's okay
            }
            // Always compile to load the binary
            state.asmSim.compile(code);
            // Build source map from generated ASM for line highlighting
            if (generatedAsm) {
                state.sourceMap = buildSourceMap(generatedAsm);
            }
            clearLineHighlight();
            log('C compilation successful', 'success');
        } catch (e) {
            throw new Error(`C compilation error: ${e}`);
        }
    }
}

function updateAsmBinaryOutput() {
    const outputEl = document.getElementById('asm-binary-output');
    if (!outputEl || !state.asmSim) return;

    try {
        // Try to get binary if available
        let bytes = null;
        try {
            if (state.asmSim.get_binary) {
                bytes = state.asmSim.get_binary();
            }
        } catch (e) {
            // get_binary might not exist yet
        }

        const sourceCode = state.editor.getValue();

        // Parse source to find instruction lines
        const lines = sourceCode.split('\n');
        const instructions = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Skip empty, comments, directives, labels
            if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('//')) continue;
            if (trimmed.startsWith('.')) continue;
            if (trimmed.endsWith(':') && !trimmed.includes(' ')) continue;

            // This looks like an instruction
            const cleanLine = trimmed.split(';')[0].split('//')[0].trim();
            if (cleanLine) {
                instructions.push({ lineNum: i + 1, text: cleanLine });
            }
        }

        // Build HTML listing
        let html = '<div class="asm-listing">';

        if (bytes && bytes.length > 0) {
            state.lastAssembledBytes = bytes;
            const maxInstr = Math.min(instructions.length, Math.floor(bytes.length / 4));

            for (let i = 0; i < maxInstr; i++) {
                const addr = (i * 4).toString(16).toUpperCase().padStart(4, '0');
                const word = ((bytes[i*4] || 0) << 24) |
                             ((bytes[i*4+1] || 0) << 16) |
                             ((bytes[i*4+2] || 0) << 8) |
                             (bytes[i*4+3] || 0);
                const hex = (word >>> 0).toString(16).toUpperCase().padStart(8, '0');
                const bits = (word >>> 0).toString(2).padStart(32, '0');
                // Format bits with spaces every 8 bits for readability
                const bitsFormatted = bits.match(/.{8}/g).join(' ');
                const instr = instructions[i] || { lineNum: '?', text: '' };

                // Line 1: addr, hex, source
                html += `<div class="listing-line listing-main">`;
                html += `<span class="listing-addr">${addr}</span>`;
                html += `<span class="listing-hex">${hex}</span>`;
                html += `<span class="listing-src">${escapeHtml(instr.text)}</span>`;
                html += `</div>`;
                // Line 2: bits (indented)
                html += `<div class="listing-line listing-bits-line">`;
                html += `<span class="listing-addr"></span>`;
                html += `<span class="listing-bits">${bitsFormatted}</span>`;
                html += `</div>`;
            }

            // Show remaining bytes if any
            const remainingBytes = bytes.length - maxInstr * 4;
            if (remainingBytes > 0) {
                html += `<div class="listing-line listing-data">`;
                html += `<span class="listing-addr">DATA</span>`;
                html += `<span class="listing-hex">${remainingBytes} bytes</span>`;
                html += `<span class="listing-src">(données)</span>`;
                html += `</div>`;
            }
        } else {
            // Show source-only listing without binary (WASM needs rebuild for get_binary)
            for (let i = 0; i < instructions.length; i++) {
                const addr = (i * 4).toString(16).toUpperCase().padStart(4, '0');
                const instr = instructions[i];

                // Line 1: addr, hex placeholder, source
                html += `<div class="listing-line listing-main">`;
                html += `<span class="listing-addr">${addr}</span>`;
                html += `<span class="listing-hex">--------</span>`;
                html += `<span class="listing-src">${escapeHtml(instr.text)}</span>`;
                html += `</div>`;
                // Line 2: bits placeholder (indented)
                html += `<div class="listing-line listing-bits-line">`;
                html += `<span class="listing-addr"></span>`;
                html += `<span class="listing-bits">-------- -------- -------- --------</span>`;
                html += `</div>`;
            }
        }

        html += '</div>';
        outputEl.innerHTML = html;
    } catch (e) {
        outputEl.textContent = `Assemblage réussi\n(${e.message || e})`;
    }
}

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function updateCOutputPanel(asmCode) {
    // Try Monaco editor first
    if (state.asmOutputEditor) {
        state.asmOutputEditor.setValue(asmCode);
    }
    // Also update the pre element if it exists (in exercise mode)
    const preEl = document.getElementById('c-asm-output');
    if (preEl) {
        preEl.textContent = asmCode;
    }
}

function downloadBinary() {
    if (!state.lastAssembledBytes || state.lastAssembledBytes.length === 0) {
        log('No binary to download - assemble first', 'warn');
        return;
    }

    const blob = new Blob([new Uint8Array(state.lastAssembledBytes)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.currentFile + '.a32b';
    a.click();
    URL.revokeObjectURL(url);
    log(`Downloaded: ${state.currentFile}.a32b`, 'success');
}

function copyGeneratedAsm() {
    let asmCode = '';

    // Try Monaco editor first
    if (state.asmOutputEditor) {
        asmCode = state.asmOutputEditor.getValue();
    }
    // Also check the pre element (in exercise mode)
    if (!asmCode || asmCode === '; Appuyez sur Run pour compiler...') {
        const preEl = document.getElementById('c-asm-output');
        if (preEl) {
            asmCode = preEl.textContent;
        }
    }

    if (!asmCode || asmCode === 'Appuyez sur Run pour compiler...') {
        log('No ASM generated - compile first', 'warn');
        return;
    }

    navigator.clipboard.writeText(asmCode).then(() => {
        log('ASM copied to clipboard', 'success');
    }).catch(err => {
        log(`Failed to copy: ${err}`, 'error');
    });
}

function updateControlButtons() {
    document.getElementById('btn-run').disabled = state.running && !state.paused;
    document.getElementById('btn-pause').disabled = !state.running;
    document.getElementById('btn-stop').disabled = !state.running;
    document.getElementById('btn-step').disabled = state.running && !state.paused;

    const pauseBtn = document.getElementById('btn-pause');
    pauseBtn.textContent = state.paused ? '▶' : '⏸';
}

// ============================================================================
// File Operations
// ============================================================================

function openFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = getFileExtension(state.mode) + ',.txt,.a32b';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check if it's a binary file
        if (file.name.endsWith('.a32b')) {
            await loadBinaryFile(file);
            return;
        }

        const content = await file.text();
        state.editor.setValue(content);
        state.files[state.mode][state.currentFile] = content;

        log(`Opened: ${file.name}`, 'info');
    };

    input.click();
}

async function loadBinaryFile(file) {
    if (!state.asmSim) {
        log('Simulator not initialized', 'error');
        return;
    }

    try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        // Load into simulator (ram_size=0 for default, strict_traps=false)
        state.asmSim.load_a32b(Array.from(bytes), 0, false);

        log(`Loaded binary: ${file.name} (${bytes.length} bytes)`, 'success');
        log('Press Run to execute', 'info');

        // Switch to ASM mode
        if (state.mode !== 'asm') {
            switchMode('asm');
        }

        state.running = false;
        state.paused = false;
        updateControlButtons();
        updateRegisters();
    } catch (e) {
        log(`Error loading binary: ${e}`, 'error');
    }
}

function saveFile() {
    const content = state.editor.getValue();
    const filename = state.currentFile + getFileExtension(state.mode);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
    log(`Saved: ${filename}`, 'success');
}

// ============================================================================
// Demos
// ============================================================================

const DEMOS = {
    hello: {
        mode: 'asm',
        code: `// Hello World - Output to console
.text
_start:
    LDR R0, =message
    LDR R1, =0xFFFF0000    ; OUTPUT port

print_loop:
    LDRB R2, [R0]
    CMP R2, #0
    B.EQ done
    STR R2, [R1]
    ADD R0, R0, #1
    B print_loop

done:
    B done

.data
message:
    .asciz "Hello, World!\\n"
`
    },
    fibonacci: {
        mode: 'c',
        code: `// Fibonacci sequence
int *OUTPUT = (int*)0xFFFF0000;

void print_int(int n) {
    if (n >= 10) {
        print_int(n / 10);
    }
    *OUTPUT = '0' + (n % 10);
}

int main() {
    int a = 0;
    int b = 1;
    int i;

    for (i = 0; i < 20; i = i + 1) {
        print_int(a);
        *OUTPUT = ' ';

        int temp = a + b;
        a = b;
        b = temp;
    }

    *OUTPUT = '\\n';
    return 0;
}
`
    },
    graphics: {
        mode: 'c',
        code: `// Graphics demo - 8x8 Checkerboard (monochrome 320x240)
char *SCREEN = (char*)0x00400000;
int *OUTPUT = (int*)0xFFFF0000;

int main() {
    int row;
    char *p = SCREEN;

    // 8x8 checkerboard: each 8 pixels = 1 byte
    // Pattern alternates every 8 rows
    for (row = 0; row < 240; row = row + 1) {
        int block_row = row / 8;
        int col;
        for (col = 0; col < 40; col = col + 1) {
            // Each byte = 8 horizontal pixels = 1 block
            if (((block_row + col) & 1) == 0) {
                *p = 0xFF;  // White block
            } else {
                *p = 0x00;  // Black block
            }
            p = p + 1;
        }
    }

    *OUTPUT = 'D'; *OUTPUT = 'o'; *OUTPUT = 'n'; *OUTPUT = 'e'; *OUTPUT = 10;
    return 0;
}
`
    },
    snake: {
        mode: 'c',
        code: `// Snake - ZQSD to move, eat food to grow!
// Enable "Keyboard Capture" checkbox and click the screen!
char *SCREEN = (char*)0x00400000;
int *KEYBOARD = (int*)0x00402600;  // Real-time keyboard
int *OUTPUT = (int*)0xFFFF0000;

int snake_x[100];
int snake_y[100];
int snake_len;
int dir;  // 0=right, 1=down, 2=left, 3=up
int food_x;
int food_y;
int game_over;
int score;
int random_seed;

void draw_block(int gx, int gy) {
    int py = gy * 8;
    int row;
    for (row = 0; row < 8; row = row + 1) {
        SCREEN[(py + row) * 40 + gx] = 0xFF;
    }
}

void clear_block(int gx, int gy) {
    int py = gy * 8;
    int row;
    for (row = 0; row < 8; row = row + 1) {
        SCREEN[(py + row) * 40 + gx] = 0x00;
    }
}

int random() {
    random_seed = random_seed * 1103515245 + 12345;
    if (random_seed < 0) random_seed = -random_seed;
    return random_seed;
}

void spawn_food() {
    food_x = (random() % 38) + 1;
    food_y = (random() % 28) + 1;
    draw_block(food_x, food_y);
}

void print_score() {
    *OUTPUT = 'S'; *OUTPUT = 'c'; *OUTPUT = 'o'; *OUTPUT = 'r'; *OUTPUT = 'e';
    *OUTPUT = ':'; *OUTPUT = ' ';
    if (score >= 10) *OUTPUT = '0' + (score / 10);
    *OUTPUT = '0' + (score % 10);
    *OUTPUT = 10;
}

int main() {
    int i;

    *OUTPUT = 'S'; *OUTPUT = 'N'; *OUTPUT = 'A'; *OUTPUT = 'K'; *OUTPUT = 'E';
    *OUTPUT = ' '; *OUTPUT = 'Z'; *OUTPUT = 'Q'; *OUTPUT = 'S'; *OUTPUT = 'D';
    *OUTPUT = 10;

    // Clear screen
    for (i = 0; i < 9600; i = i + 1) SCREEN[i] = 0;

    // Init snake (length 5, center of screen)
    snake_len = 5;
    for (i = 0; i < snake_len; i = i + 1) {
        snake_x[i] = 20 - i;
        snake_y[i] = 15;
        draw_block(snake_x[i], snake_y[i]);
    }

    dir = 0;
    game_over = 0;
    score = 0;
    random_seed = 12345;
    spawn_food();

    // Game loop - runs until wall/self collision
    int delay;
    while (!game_over) {
        // Read keyboard (WASD or ZQSD for AZERTY)
        int key = *KEYBOARD;
        if ((key == 'w' || key == 'z') && dir != 1) dir = 3;
        if (key == 's' && dir != 3) dir = 1;
        if ((key == 'a' || key == 'q') && dir != 0) dir = 2;
        if (key == 'd' && dir != 2) dir = 0;

        // Delay loop (adjust speed)
        for (delay = 0; delay < 50000; delay = delay + 1) { }

        // Calculate new head position
        int new_x = snake_x[0];
        int new_y = snake_y[0];
        if (dir == 0) new_x = new_x + 1;
        if (dir == 1) new_y = new_y + 1;
        if (dir == 2) new_x = new_x - 1;
        if (dir == 3) new_y = new_y - 1;

        // Wall collision
        if (new_x < 0 || new_x >= 40 || new_y < 0 || new_y >= 30) {
            game_over = 1;
        }

        // Self collision
        if (!game_over) {
            for (i = 0; i < snake_len; i = i + 1) {
                if (snake_x[i] == new_x && snake_y[i] == new_y) {
                    game_over = 1;
                }
            }
        }

        if (!game_over) {
            // Check food
            int ate = (new_x == food_x && new_y == food_y);

            // Clear tail (unless eating)
            if (!ate) {
                clear_block(snake_x[snake_len - 1], snake_y[snake_len - 1]);
            } else {
                snake_len = snake_len + 1;
                score = score + 1;
                spawn_food();
            }

            // Move body
            for (i = snake_len - 1; i > 0; i = i - 1) {
                snake_x[i] = snake_x[i - 1];
                snake_y[i] = snake_y[i - 1];
            }
            snake_x[0] = new_x;
            snake_y[0] = new_y;
            draw_block(new_x, new_y);
        }
    }

    *OUTPUT = 'G'; *OUTPUT = 'A'; *OUTPUT = 'M'; *OUTPUT = 'E';
    *OUTPUT = ' '; *OUTPUT = 'O'; *OUTPUT = 'V'; *OUTPUT = 'E'; *OUTPUT = 'R';
    *OUTPUT = 10;
    print_score();
    return 0;
}
`
    },
    shell: {
        mode: 'c',
        code: `// Mini Shell - Enable Keyboard Capture and click screen!
int *OUTPUT = (int*)0xFFFF0000;
int *KEYBOARD = (int*)0x00402600;  // Real-time keyboard

char buffer[80];
int buf_pos;
int last_key;

void print(char *s) {
    while (*s) {
        *OUTPUT = *s;
        s = s + 1;
    }
}

void println(char *s) {
    print(s);
    *OUTPUT = 10;
}

int strcmp(char *a, char *b) {
    while (*a && *b && *a == *b) {
        a = a + 1;
        b = b + 1;
    }
    return *a - *b;
}

int read_key() {
    // Wait for new key press (not held)
    int key;
    // Wait for key release first
    while (*KEYBOARD != 0) { }
    // Wait for new key press
    while ((key = *KEYBOARD) == 0) { }
    return key;
}

void read_line() {
    buf_pos = 0;
    while (1) {
        int c = read_key();

        if (c == 13 || c == 10) {  // Enter
            buffer[buf_pos] = 0;
            *OUTPUT = 10;
            return;
        }

        if (c == 8 && buf_pos > 0) {  // Backspace
            buf_pos = buf_pos - 1;
            *OUTPUT = 8; *OUTPUT = ' '; *OUTPUT = 8;
        } else if (c >= 32 && buf_pos < 79) {
            buffer[buf_pos] = c;
            buf_pos = buf_pos + 1;
            *OUTPUT = c;
        }
    }
}

void cmd_help() {
    println("Commands:");
    println("  help  - Show this help");
    println("  echo  - Echo text");
    println("  exit  - Exit shell");
}

void cmd_echo() {
    int i = 5;
    while (buffer[i]) {
        *OUTPUT = buffer[i];
        i = i + 1;
    }
    *OUTPUT = 10;
}

int main() {
    println("Mini Shell v1.0");
    println("Enable Keyboard Capture, click screen!");
    println("Type help for commands");
    *OUTPUT = 10;

    while (1) {
        print("> ");
        read_line();

        if (strcmp(buffer, "help") == 0) {
            cmd_help();
        } else if (strcmp(buffer, "exit") == 0) {
            println("Goodbye!");
            return 0;
        } else if (buffer[0] == 'e' && buffer[1] == 'c' &&
                   buffer[2] == 'h' && buffer[3] == 'o' &&
                   buffer[4] == ' ') {
            cmd_echo();
        } else if (buffer[0] != 0) {
            print("Unknown command: ");
            println(buffer);
        }
    }
}
`
    },
    coroutines: {
        mode: 'c',
        code: `// Cooperative Coroutines Demo
int *OUTPUT = (int*)0xFFFF0000;

struct Task {
    int state;
    int counter;
};

struct Task tasks[4];
int current_task;
int num_tasks;

void print(char *s) {
    while (*s) {
        *OUTPUT = *s;
        s = s + 1;
    }
}

void print_int(int n) {
    if (n >= 10) print_int(n / 10);
    *OUTPUT = '0' + (n % 10);
}

void yield() {
    // Save state (simplified)
    tasks[current_task].state = 1;

    // Find next runnable task
    int next = (current_task + 1) % num_tasks;
    while (tasks[next].state == 0 && next != current_task) {
        next = (next + 1) % num_tasks;
    }
    current_task = next;
}

void task_a() {
    int i;
    for (i = 0; i < 5; i = i + 1) {
        print("Task A: ");
        print_int(i);
        print("\\n");
        yield();
    }
    tasks[0].state = 0;  // Terminate
}

void task_b() {
    int i;
    for (i = 0; i < 5; i = i + 1) {
        print("  Task B: ");
        print_int(i * 10);
        print("\\n");
        yield();
    }
    tasks[1].state = 0;  // Terminate
}

void task_c() {
    int i;
    for (i = 0; i < 5; i = i + 1) {
        print("    Task C: ");
        print_int(i * 100);
        print("\\n");
        yield();
    }
    tasks[2].state = 0;  // Terminate
}

int main() {
    print("=== Coroutines Demo ===\\n\\n");

    // Initialize tasks
    num_tasks = 3;
    tasks[0].state = 1;
    tasks[1].state = 1;
    tasks[2].state = 1;

    current_task = 0;

    // Simple round-robin scheduler
    int iterations = 0;
    while (iterations < 20) {
        if (tasks[current_task].state == 1) {
            if (current_task == 0) {
                task_a();
            } else if (current_task == 1) {
                task_b();
            } else {
                task_c();
            }
        }
        iterations = iterations + 1;
        yield();
    }

    print("\\n=== All tasks completed ===\\n");
    return 0;
}
`
    }
};

function loadDemo(name) {
    const demo = DEMOS[name];
    if (!demo) {
        log(`Demo not found: ${name}`, 'error');
        return;
    }

    switchMode(demo.mode);
    state.editor.setValue(demo.code);
    state.files[demo.mode][state.currentFile] = demo.code;
    log(`Loaded demo: ${name}`, 'success');
}

// ============================================================================
// Progression System
// ============================================================================

function loadProgress() {
    try {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            state.progress = JSON.parse(saved);
        }
    } catch (e) {
        console.warn('Failed to load progress:', e);
    }
    updateProgressUI();
}

function saveProgress() {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.progress));
    } catch (e) {
        console.warn('Failed to save progress:', e);
    }
}

function exportProgress() {
    try {
        const data = {
            version: 1,
            exportDate: new Date().toISOString(),
            progress: state.progress,
            hdlLibrary: state.hdlLibrary,
            theme: localStorage.getItem('theme') || 'dark'
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nand2tetris-progress-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        log('Progression sauvegardée !', 'success');
    } catch (e) {
        log('Erreur lors de la sauvegarde: ' + e.message, 'error');
    }
}

function importProgress(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // Validate data structure
            if (!data.progress && !data.hdlLibrary) {
                throw new Error('Format de fichier invalide');
            }

            // Import progress
            if (data.progress) {
                state.progress = data.progress;
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.progress));
            }

            // Import HDL library
            if (data.hdlLibrary) {
                state.hdlLibrary = data.hdlLibrary;
                localStorage.setItem(CONFIG.HDL_LIBRARY_KEY, JSON.stringify(state.hdlLibrary));
            }

            // Import theme
            if (data.theme) {
                localStorage.setItem('theme', data.theme);
                document.documentElement.dataset.theme = data.theme;
                document.getElementById('btn-theme').textContent = data.theme === 'dark' ? '🌙' : '☀️';
            }

            // Update UI
            updateProgressUI();
            updateHdlProgressUI();

            // Navigate to next progression point
            navigateToNextProgressionPoint();

            log('Progression restaurée !', 'success');
        } catch (e) {
            log('Erreur lors de la restauration: ' + e.message, 'error');
        }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
}

function resetAllProgress() {
    if (!confirm('Voulez-vous vraiment réinitialiser toute la progression ? Cette action est irréversible.')) {
        return;
    }

    // Clear all progress
    state.progress = {};
    state.hdlLibrary = {};
    state.currentChip = 'Inv';

    // Clear localStorage
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    localStorage.removeItem(CONFIG.HDL_LIBRARY_KEY);

    // Update UI
    updateProgressUI();
    updateHdlProgressUI();

    // Go back to HDL mode with first chip
    switchMode('hdl');
    loadChip('Inv');

    log('Progression réinitialisée !', 'success');
}

function navigateToNextProgressionPoint() {
    const next = determineNextProgressionPoint();

    if (next.mode !== state.mode) {
        switchMode(next.mode);
    }

    if (next.mode === 'hdl' && next.target) {
        state.currentChip = next.target;
        loadChip(next.target);
    } else if (next.mode === 'asm' && next.target) {
        loadAsmExercise(next.target);
    } else if (next.mode === 'c' && next.target) {
        loadCExercise(next.target);
    }
}

function markLessonComplete(lessonId) {
    state.progress[lessonId] = true;
    saveProgress();
    updateProgressUI();
    log(`Lesson completed: ${lessonId}`, 'success');
}

function updateProgressUI() {
    // Update lesson status icons
    document.querySelectorAll('.lesson-item').forEach(item => {
        const lessonId = item.dataset.lesson;
        const status = item.querySelector('.status');
        if (state.progress[lessonId]) {
            status.textContent = '●';
            status.classList.add('completed');
            item.classList.add('completed');
        } else {
            status.textContent = '○';
            status.classList.remove('completed');
            item.classList.remove('completed');
        }
    });

    // Update week progress
    document.querySelectorAll('.curriculum-week').forEach(week => {
        const weekId = week.querySelector('.week-header').dataset.week;
        const lessons = week.querySelectorAll('.lesson-item');
        let completed = 0;
        lessons.forEach(l => {
            if (state.progress[l.dataset.lesson]) completed++;
        });

        const progressSpan = week.querySelector('.week-progress');
        progressSpan.textContent = `${completed}/${lessons.length}`;
    });

    // Update overall progress
    const allLessons = document.querySelectorAll('.lesson-item');
    const completedLessons = Object.keys(state.progress).filter(k => state.progress[k]).length;
    const percentage = allLessons.length > 0 ? Math.round((completedLessons / allLessons.length) * 100) : 0;

    document.getElementById('progress-fill').style.width = `${percentage}%`;
    document.getElementById('progress-text').textContent = `${percentage}%`;
}

// ============================================================================
// HDL Chip Progression System
// ============================================================================

function loadHdlLibrary() {
    try {
        const saved = localStorage.getItem(CONFIG.HDL_LIBRARY_KEY);
        if (saved) {
            state.hdlLibrary = JSON.parse(saved);
        }
    } catch (e) {
        console.warn('Failed to load HDL library:', e);
    }

    // Find the next incomplete chip to work on
    const nextChip = findNextChip();
    if (nextChip) {
        state.currentChip = nextChip;
    }

    // Load the chip
    loadChip(state.currentChip);
    updateHdlProgressUI();

    // Ensure chip info panel is updated on initial load
    const chip = getChip(state.currentChip);
    if (chip) {
        updateChipInfoPanel(chip);
    }
}

// Lesson IDs for each category
const ASM_LESSONS = [
    // Basics
    'asm-hello', 'asm-add', 'asm-sub', 'asm-logic', 'asm-double',
    // Control flow
    'asm-cond', 'asm-abs', 'asm-loop', 'asm-mult', 'asm-fib',
    // Memory
    'asm-array', 'asm-max', 'asm-mem',
    // Functions
    'asm-func', 'asm-func2',
    // I/O
    'asm-putc', 'asm-hello-str', 'asm-print-loop',
    // Screen
    'asm-pixel', 'asm-hline', 'asm-vline', 'asm-rect', 'asm-checkerboard',
    'asm-gradient', 'asm-gradient-full',
    // Games
    'asm-getc', 'asm-getc2', 'asm-guess', 'asm-guess-loop'
];
const C_LESSONS = [
    // Bases
    'c-var', 'c-expr', 'c-mod', 'c-incr',
    // Conditions
    'c-cond', 'c-cond2', 'c-logic', 'c-max3',
    // Boucles
    'c-loop', 'c-while', 'c-nested', 'c-mult',
    // Fonctions
    'c-func', 'c-func2', 'c-abs', 'c-minmax',
    // Tableaux
    'c-array', 'c-array-max', 'c-array-count',
    // Pointeurs
    'c-ptr', 'c-swap', 'c-ptr-arr',
    // Bits
    'c-bitwise', 'c-ispow2',
    // Récursion
    'c-recur', 'c-fib', 'c-sum-recur',
    // Algorithmes
    'c-gcd', 'c-power', 'c-prime', 'c-sort', 'c-search', 'c-reverse', 'c-digits', 'c-palindrome',
    // Entrées/Sorties
    'c-putchar', 'c-print', 'c-print-num', 'c-screen-pixel', 'c-screen-line', 'c-screen-rect',
    // Projets
    'c-sieve', 'c-collatz', 'c-project'
];

function areAllHdlChipsComplete() {
    for (const project of PROJECTS) {
        for (const chipName of project.chips) {
            if (!state.hdlLibrary[chipName]) {
                return false;
            }
        }
    }
    return true;
}

function areAllLessonsComplete(lessonIds) {
    return lessonIds.every(id => state.progress[id]);
}

function findNextLesson(lessonIds) {
    return lessonIds.find(id => !state.progress[id]) || null;
}

function determineNextProgressionPoint() {
    // 1. Check HDL chips
    const nextChip = findNextChip();
    if (nextChip) {
        return { mode: 'hdl', target: nextChip };
    }

    // 2. All HDL complete - check ASM
    const nextAsm = findNextLesson(ASM_LESSONS);
    if (nextAsm) {
        return { mode: 'asm', target: nextAsm };
    }

    // 3. All ASM complete - check C
    const nextC = findNextLesson(C_LESSONS);
    if (nextC) {
        return { mode: 'c', target: nextC };
    }

    // 4. All complete - default to ASM
    return { mode: 'asm', target: null };
}

// ============================================================================
// ASM Exercise System
// ============================================================================

function loadAsmExercise(exerciseId) {
    const exercise = getAsmExercise(exerciseId);
    if (!exercise) {
        log(`Unknown ASM exercise: ${exerciseId}`, 'error');
        return;
    }

    state.currentAsmExercise = exerciseId;
    state.files.asm.main = exercise.template;

    if (state.mode === 'asm' && state.editor) {
        state.editor.setValue(exercise.template);
    }

    updateAsmExercisePanel(exercise);
    log(`Exercice chargé: ${exercise.name}`, 'info');
}

function updateAsmExercisePanel(exercise) {
    const panel = document.getElementById('output-asm');
    if (!panel) return;

    // Format expected results
    let expectedHtml = '';
    if (exercise.test && exercise.test.expect) {
        const expects = Object.entries(exercise.test.expect)
            .map(([reg, val]) => `${reg} = ${val}`)
            .join(', ');
        expectedHtml = `
            <div class="exercise-expected">
                <div class="label">Résultat attendu:</div>
                <div>${expects}</div>
            </div>
        `;
    }

    // Update the panel content
    panel.innerHTML = `
        <div class="output-header">
            <span class="output-title">Exercice: ${exercise.name}</span>
            <div class="exercise-actions">
                <button class="action-btn small" id="btn-test-asm" title="Tester">✓ Test</button>
                <button class="action-btn small solution" id="btn-solution-asm" title="Solution">💡</button>
                <button class="action-btn small" id="btn-download-a32b" title="Télécharger .a32b">⬇ .a32b</button>
            </div>
        </div>
        <div class="output-content">
            <div class="exercise-description">
                <p>${exercise.description}</p>
                ${expectedHtml}
            </div>
            <div class="asm-listing-section">
                <div class="listing-header">Listing ASM → Binaire</div>
                <pre id="asm-binary-output" class="binary-output asm-listing">Appuyez sur Run pour assembler...</pre>
            </div>
            <div class="test-results" id="asm-test-results" style="display: none;">
                <div class="test-results-header">
                    <span class="test-results-title">Résultat</span>
                </div>
                <div id="asm-test-output"></div>
            </div>
        </div>
    `;

    // Add event listeners
    document.getElementById('btn-test-asm')?.addEventListener('click', testAsmExercise);
    document.getElementById('btn-solution-asm')?.addEventListener('click', showAsmSolution);
    document.getElementById('btn-download-a32b')?.addEventListener('click', downloadBinary);
}

function showAsmSolution() {
    const exercise = getAsmExercise(state.currentAsmExercise);
    if (!exercise || !exercise.solution) {
        log('Pas de solution disponible', 'warn');
        return;
    }

    if (confirm('Voulez-vous voir la solution ? Cela remplacera votre code actuel.')) {
        state.editor.setValue(exercise.solution);
        log('Solution chargée', 'info');
    }
}

function testAsmExercise() {
    const exercise = getAsmExercise(state.currentAsmExercise);
    if (!exercise) return;

    const code = state.editor.getValue();
    const resultsDiv = document.getElementById('asm-test-results');
    const outputDiv = document.getElementById('asm-test-output');

    if (!resultsDiv || !outputDiv) return;

    resultsDiv.style.display = 'block';

    try {
        // Assemble and run the code
        if (!state.asmSim) {
            outputDiv.innerHTML = '<div class="test-fail">Simulateur non disponible</div>';
            return;
        }

        state.asmSim.assemble(code);

        // Run for a limited number of cycles
        let halted = false;
        for (let i = 0; i < 10000 && !halted; i++) {
            const result = state.asmSim.step();
            if (result !== 'running') {
                halted = true;
            }
        }

        // Update display after execution
        updateRegisters();
        updateScreen(true);  // Force screen update

        // Check expected results
        const expected = exercise.test.expect;
        let passed = true;
        let details = '';

        for (const [reg, expectedVal] of Object.entries(expected)) {
            const regNum = parseInt(reg.replace('R', ''));
            const actualVal = state.asmSim.reg(regNum);
            if (actualVal === expectedVal) {
                details += `<div class="test-pass">✓ ${reg} = ${actualVal}</div>`;
            } else {
                details += `<div class="test-fail">✗ ${reg}: attendu ${expectedVal}, obtenu ${actualVal}</div>`;
                passed = false;
            }
        }

        outputDiv.innerHTML = details;

        if (passed) {
            markLessonComplete(state.currentAsmExercise);
            log('Exercice réussi !', 'success');
        }
    } catch (e) {
        outputDiv.innerHTML = `<div class="test-fail">Erreur: ${e.message || e}</div>`;
        log(`Erreur: ${e.message || e}`, 'error');
    }
}

// ============================================================================
// C Exercise System
// ============================================================================

function loadCExercise(exerciseId) {
    const exercise = getCExercise(exerciseId);
    if (!exercise) {
        log(`Unknown C exercise: ${exerciseId}`, 'error');
        return;
    }

    state.currentCExercise = exerciseId;
    state.files.c.main = exercise.template;

    if (state.mode === 'c' && state.editor) {
        state.editor.setValue(exercise.template);
    }

    updateCExercisePanel(exercise);
    log(`Exercice chargé: ${exercise.name}`, 'info');
}

function updateCExercisePanel(exercise) {
    const panel = document.getElementById('output-c');
    if (!panel) return;

    // Format expected result
    let expectedHtml = '';
    if (exercise.visualTest) {
        expectedHtml = `
        <div class="exercise-expected">
            <div class="label">Test visuel:</div>
            <div>${exercise.visualDescription || 'Vérifiez visuellement le résultat'}</div>
        </div>
    `;
    } else if (exercise.expectedReturn !== undefined) {
        expectedHtml = `
        <div class="exercise-expected">
            <div class="label">Valeur de retour attendue:</div>
            <div>${exercise.expectedReturn}</div>
        </div>
    `;
    }

    // Update the panel content
    panel.innerHTML = `
        <div class="output-header">
            <span class="output-title">Exercice: ${exercise.name}</span>
            <div class="exercise-actions">
                <button class="action-btn small" id="btn-test-c" title="Compiler et tester">✓ Test</button>
                <button class="action-btn small solution" id="btn-solution-c" title="Solution">💡</button>
                <button class="action-btn small" id="btn-copy-asm" title="Copier ASM">📋 Copier</button>
            </div>
        </div>
        <div class="output-content">
            <div class="exercise-description">
                <p>${exercise.description}</p>
                ${expectedHtml}
            </div>
            <div class="asm-listing-section">
                <div class="listing-header">Code ASM Généré</div>
                <pre id="c-asm-output" class="binary-output">Appuyez sur Run pour compiler...</pre>
            </div>
            <div class="test-results" id="c-test-results" style="display: none;">
                <div class="test-results-header">
                    <span class="test-results-title">Résultat</span>
                </div>
                <div id="c-test-output"></div>
            </div>
        </div>
    `;

    // Add event listeners
    document.getElementById('btn-test-c')?.addEventListener('click', testCExercise);
    document.getElementById('btn-solution-c')?.addEventListener('click', showCSolution);
    document.getElementById('btn-copy-asm')?.addEventListener('click', copyGeneratedAsm);
}

function showCSolution() {
    const exercise = getCExercise(state.currentCExercise);
    if (!exercise || !exercise.solution) {
        log('Pas de solution disponible', 'warn');
        return;
    }

    if (confirm('Voulez-vous voir la solution ? Cela remplacera votre code actuel.')) {
        state.editor.setValue(exercise.solution);
        log('Solution chargée', 'info');
    }
}

function testCExercise() {
    const exercise = getCExercise(state.currentCExercise);
    if (!exercise) return;

    const code = state.editor.getValue();
    const resultsDiv = document.getElementById('c-test-results');
    const outputDiv = document.getElementById('c-test-output');

    if (!resultsDiv || !outputDiv) return;

    resultsDiv.style.display = 'block';

    try {
        if (!state.wasmModule) {
            outputDiv.innerHTML = '<div class="test-fail">Compilateur non disponible</div>';
            return;
        }

        // Compile C and run
        state.asmSim.compile(code);

        // Run for a limited number of cycles
        let halted = false;
        for (let i = 0; i < 500000 && !halted; i++) {
            const result = state.asmSim.step();
            if (result !== 'running') {
                halted = true;
            }
        }

        // Update display after execution
        updateRegisters();
        updateScreen(true);

        // Check if visual test (no automatic validation)
        if (exercise.visualTest) {
            const desc = exercise.visualDescription || 'Vérifiez visuellement le résultat';
            outputDiv.innerHTML = `<div class="test-pass">✓ Exécution terminée<br><small>${desc}</small></div>`;
            markLessonComplete(state.currentCExercise);
            log('Exercice réussi (test visuel)', 'success');
            return;
        }

        // Check return value (R0)
        const returnVal = state.asmSim.reg(0);
        const expected = exercise.expectedReturn;

        if (returnVal === expected) {
            outputDiv.innerHTML = `<div class="test-pass">✓ Retour: ${returnVal} (attendu: ${expected})</div>`;
            markLessonComplete(state.currentCExercise);
            log('Exercice réussi !', 'success');
        } else {
            outputDiv.innerHTML = `<div class="test-fail">✗ Retour: ${returnVal} (attendu: ${expected})</div>`;
        }
    } catch (e) {
        outputDiv.innerHTML = `<div class="test-fail">Erreur: ${e.message || e}</div>`;
        log(`Erreur: ${e.message || e}`, 'error');
    }
}

// ============================================================================
// OS Exercise System
// ============================================================================

function loadOsExercise(exerciseId) {
    const exercise = getOsExercise(exerciseId);
    if (!exercise) {
        log(`Unknown OS exercise: ${exerciseId}`, 'error');
        return;
    }

    state.currentOsExercise = exerciseId;
    state.files.c.main = exercise.template;

    // Switch to C mode for OS exercises
    if (state.mode !== 'c') {
        switchMode('c');
    }

    if (state.editor) {
        state.editor.setValue(exercise.template);
    }

    updateOsExercisePanel(exercise);
    log(`Exercice OS chargé: ${exercise.name}`, 'info');
}

function updateOsExercisePanel(exercise) {
    const panel = document.getElementById('output-c');
    if (!panel) return;

    // Format expected result
    let expectedHtml = '';
    if (exercise.visualTest) {
        expectedHtml = `
        <div class="exercise-expected">
            <div class="label">Test visuel:</div>
            <div>${exercise.visualDescription || 'Vérifiez visuellement le résultat'}</div>
        </div>
    `;
    } else if (exercise.expectedReturn !== undefined) {
        expectedHtml = `
        <div class="exercise-expected">
            <div class="label">Valeur de retour attendue:</div>
            <div>${exercise.expectedReturn}</div>
        </div>
    `;
    }

    // Update the panel content
    panel.innerHTML = `
        <div class="output-header">
            <span class="output-title">OS: ${exercise.name}</span>
            <div class="exercise-actions">
                <button class="action-btn small" id="btn-test-os" title="Compiler et tester">✓ Test</button>
                <button class="action-btn small solution" id="btn-solution-os" title="Solution">💡</button>
                <button class="action-btn small" id="btn-copy-asm-os" title="Copier ASM">📋 Copier</button>
            </div>
        </div>
        <div class="output-content">
            <div class="exercise-description">
                <p>${exercise.description}</p>
                ${expectedHtml}
            </div>
            <div class="asm-listing-section">
                <div class="listing-header">Code ASM Généré</div>
                <pre id="c-asm-output" class="binary-output">Appuyez sur Run pour compiler...</pre>
            </div>
            <div class="test-results" id="os-test-results" style="display: none;">
                <div class="test-results-header">
                    <span class="test-results-title">Résultat</span>
                </div>
                <div id="os-test-output"></div>
            </div>
        </div>
    `;

    // Add event listeners
    document.getElementById('btn-test-os')?.addEventListener('click', testOsExercise);
    document.getElementById('btn-solution-os')?.addEventListener('click', showOsSolution);
    document.getElementById('btn-copy-asm-os')?.addEventListener('click', copyGeneratedAsm);
}

function showOsSolution() {
    const exercise = getOsExercise(state.currentOsExercise);
    if (!exercise || !exercise.solution) {
        log('Pas de solution disponible', 'warn');
        return;
    }

    if (confirm('Voulez-vous voir la solution ? Cela remplacera votre code actuel.')) {
        state.editor.setValue(exercise.solution);
        log('Solution chargée', 'info');
    }
}

function testOsExercise() {
    const exercise = getOsExercise(state.currentOsExercise);
    if (!exercise) return;

    const code = state.editor.getValue();
    const resultsDiv = document.getElementById('os-test-results');
    const outputDiv = document.getElementById('os-test-output');

    if (!resultsDiv || !outputDiv) return;

    resultsDiv.style.display = 'block';

    try {
        if (!state.wasmModule) {
            outputDiv.innerHTML = '<div class="test-fail">Compilateur non disponible</div>';
            return;
        }

        // Compile C and run
        state.asmSim.compile(code);

        // Run for a limited number of cycles (OS exercises may need more)
        let halted = false;
        for (let i = 0; i < 1000000 && !halted; i++) {
            const result = state.asmSim.step();
            if (result !== 'running') {
                halted = true;
            }
        }

        // Update display after execution
        updateRegisters();
        updateScreen(true);

        // Check if visual test (no automatic validation)
        if (exercise.visualTest) {
            const desc = exercise.visualDescription || 'Vérifiez visuellement le résultat';
            outputDiv.innerHTML = `<div class="test-pass">✓ Exécution terminée<br><small>${desc}</small></div>`;
            markLessonComplete(state.currentOsExercise);
            log('Exercice OS réussi (test visuel)', 'success');
            return;
        }

        // Check return value (R0)
        const returnVal = state.asmSim.reg(0);
        const expected = exercise.expectedReturn;

        if (returnVal === expected) {
            outputDiv.innerHTML = `<div class="test-pass">✓ Retour: ${returnVal} (attendu: ${expected})</div>`;
            markLessonComplete(state.currentOsExercise);
            log('Exercice OS réussi !', 'success');
        } else {
            outputDiv.innerHTML = `<div class="test-fail">✗ Retour: ${returnVal} (attendu: ${expected})</div>`;
        }
    } catch (e) {
        outputDiv.innerHTML = `<div class="test-fail">Erreur: ${e.message || e}</div>`;
        log(`Erreur: ${e.message || e}`, 'error');
    }
}

// ============================================================================
// Compiler Exercise System
// ============================================================================

function loadCompilerExercise(exerciseId) {
    const exercise = getCompilerExercise(exerciseId);
    if (!exercise) {
        log(`Unknown compiler exercise: ${exerciseId}`, 'error');
        return;
    }

    state.currentCompilerExercise = exerciseId;
    state.files.c.main = exercise.template;

    // Switch to C mode for compiler exercises
    if (state.mode !== 'c') {
        switchMode('c');
    }

    if (state.editor) {
        state.editor.setValue(exercise.template);
    }

    updateCompilerExercisePanel(exercise);
    log(`Exercice Compilateur chargé: ${exercise.name}`, 'info');
}

function updateCompilerExercisePanel(exercise) {
    const panel = document.getElementById('output-c');
    if (!panel) return;

    // Format expected result
    let expectedHtml = '';
    if (exercise.test && exercise.test.expectedReturn !== undefined) {
        expectedHtml = `
        <div class="exercise-expected">
            <div class="label">Score attendu:</div>
            <div>${exercise.test.expectedReturn}</div>
        </div>
    `;
    }

    // Update the panel content
    panel.innerHTML = `
        <div class="output-header">
            <span class="output-title">Compilateur: ${exercise.name}</span>
            <div class="exercise-actions">
                <button class="action-btn small" id="btn-test-compiler" title="Compiler et tester">✓ Test</button>
                <button class="action-btn small solution" id="btn-solution-compiler" title="Solution">💡</button>
                <button class="action-btn small" id="btn-copy-asm-compiler" title="Copier ASM">📋 Copier</button>
            </div>
        </div>
        <div class="output-content">
            <div class="exercise-description">
                <p>${exercise.description.replace(/\n/g, '<br>')}</p>
                ${expectedHtml}
            </div>
            <div class="asm-listing-section">
                <div class="listing-header">Code ASM Généré</div>
                <pre id="c-asm-output" class="binary-output">Appuyez sur Test pour compiler...</pre>
            </div>
            <div class="test-results" id="compiler-test-results" style="display: none;">
                <div class="test-results-header">
                    <span class="test-results-title">Résultat</span>
                </div>
                <div id="compiler-test-output"></div>
            </div>
        </div>
    `;

    // Add event listeners
    document.getElementById('btn-test-compiler')?.addEventListener('click', testCompilerExercise);
    document.getElementById('btn-solution-compiler')?.addEventListener('click', showCompilerSolution);
    document.getElementById('btn-copy-asm-compiler')?.addEventListener('click', copyGeneratedAsm);
}

function showCompilerSolution() {
    const exercise = getCompilerExercise(state.currentCompilerExercise);
    if (!exercise || !exercise.solution) {
        log('Pas de solution disponible', 'warn');
        return;
    }

    if (confirm('Voulez-vous voir la solution ? Cela remplacera votre code actuel.')) {
        state.editor.setValue(exercise.solution);
        log('Solution chargée', 'info');
    }
}

function testCompilerExercise() {
    const exercise = getCompilerExercise(state.currentCompilerExercise);
    if (!exercise) return;

    const code = state.editor.getValue();
    const resultsDiv = document.getElementById('compiler-test-results');
    const outputDiv = document.getElementById('compiler-test-output');

    if (!resultsDiv || !outputDiv) return;

    resultsDiv.style.display = 'block';

    try {
        if (!state.wasmModule) {
            outputDiv.innerHTML = '<div class="test-fail">Compilateur non disponible</div>';
            return;
        }

        // Compile C and run
        state.asmSim.compile(code);

        // Show generated ASM
        const asmOutput = document.getElementById('c-asm-output');
        if (asmOutput) {
            try {
                const asm = state.asmSim.get_asm();
                asmOutput.textContent = asm || '// Pas de code généré';
            } catch (e) {
                asmOutput.textContent = '// Erreur lors de la récupération du code';
            }
        }

        // Run for a limited number of cycles
        let halted = false;
        for (let i = 0; i < 500000 && !halted; i++) {
            const result = state.asmSim.step();
            if (result !== 'running') {
                halted = true;
            }
        }

        // Update display after execution
        updateRegisters();

        // Check return value (R0)
        const returnVal = state.asmSim.reg(0);
        const expected = exercise.test.expectedReturn;

        if (returnVal === expected) {
            outputDiv.innerHTML = `<div class="test-pass">✓ Score: ${returnVal}/${expected} - Tous les tests passent!</div>`;
            markLessonComplete(state.currentCompilerExercise);
            log('Exercice Compilateur réussi !', 'success');
        } else {
            outputDiv.innerHTML = `<div class="test-fail">✗ Score: ${returnVal}/${expected} - Certains tests échouent</div>`;
        }
    } catch (e) {
        outputDiv.innerHTML = `<div class="test-fail">Erreur: ${e.message || e}</div>`;
        log(`Erreur: ${e.message || e}`, 'error');
    }
}

function saveHdlLibrary() {
    try {
        localStorage.setItem(CONFIG.HDL_LIBRARY_KEY, JSON.stringify(state.hdlLibrary));
    } catch (e) {
        console.warn('Failed to save HDL library:', e);
    }
}

function loadChip(chipName) {
    const chip = getChip(chipName);
    if (!chip) {
        log(`Unknown chip: ${chipName}`, 'error');
        return;
    }

    // Check if dependencies are unlocked
    const unlockedChips = Object.keys(state.hdlLibrary);
    if (!canAttempt(chipName, unlockedChips)) {
        const missing = chip.dependencies.filter(d => !unlockedChips.includes(d));
        log(`Chip ${chipName} requires: ${missing.join(', ')}`, 'warn');
        return;
    }

    state.currentChip = chipName;

    // If chip is already unlocked, load the saved source; otherwise load template
    if (state.hdlLibrary[chipName]) {
        state.files.hdl.main = state.hdlLibrary[chipName];
    } else {
        state.files.hdl.main = chip.template;
    }

    // Update editor if in HDL mode
    if (state.mode === 'hdl' && state.editor) {
        state.editor.setValue(state.files.hdl.main);
    }

    // Update the chip info panel
    updateChipInfoPanel(chip);

    // Initialize HDL signals panel so user can set inputs before running
    initHdlSignals(chip);

    updateHdlProgressUI();
    log(`Loaded chip: ${chipName}`, 'info');
}

function updateChipInfoPanel(chip) {
    // Update chip name
    const chipNameEl = document.getElementById('current-chip-name');
    if (chipNameEl) {
        chipNameEl.textContent = chip.name;
    }

    // Update description
    const descEl = document.getElementById('chip-desc');
    if (descEl) {
        descEl.textContent = chip.description || chip.name;
    }

    // Parse inputs/outputs from template
    const { inputs, outputs } = parseChipInterface(chip.template);

    // Update interface
    const interfaceEl = document.getElementById('chip-interface');
    if (interfaceEl) {
        let html = '';
        for (const inp of inputs) {
            html += `<div class="port"><span class="port-dir in">IN</span><span class="port-name">${inp}</span></div>`;
        }
        for (const out of outputs) {
            html += `<div class="port"><span class="port-dir out">OUT</span><span class="port-name">${out}</span></div>`;
        }
        interfaceEl.innerHTML = html;
    }

    // Update dependencies
    const depsEl = document.getElementById('chip-deps');
    if (depsEl) {
        if (chip.dependencies && chip.dependencies.length > 0) {
            depsEl.textContent = `Utilise: ${chip.dependencies.join(', ')}`;
        } else {
            depsEl.textContent = '';
        }
    }

    // Update truth table from test script
    const truthTableEl = document.getElementById('truth-table');
    if (truthTableEl && chip.test) {
        const truthTable = parseTestToTruthTable(chip.test, inputs, outputs);
        truthTableEl.innerHTML = renderTruthTable(truthTable, inputs, outputs);
    }

    // Hide test results when switching chips
    const testResultsEl = document.getElementById('hdl-test-results');
    if (testResultsEl) {
        testResultsEl.style.display = 'none';
    }
}

function parseTestToTruthTable(testScript, inputs, outputs) {
    const rows = [];
    let currentRow = {};

    const lines = testScript.split('\n');
    for (const line of lines) {
        const trimmed = line.trim().toLowerCase();

        // Parse set commands
        const setMatch = line.match(/set\s+(\w+)\s+(\S+)/i);
        if (setMatch) {
            const signal = setMatch[1];
            const value = setMatch[2];
            currentRow[signal] = value;
        }

        // Parse expect commands - this means end of a test case
        const expectMatch = line.match(/expect\s+(\w+)\s+(\S+)/i);
        if (expectMatch) {
            const signal = expectMatch[1];
            const value = expectMatch[2];
            currentRow[signal] = value;

            // Clone and save the row
            rows.push({ ...currentRow });
        }
    }

    return rows;
}

function renderTruthTable(rows, inputs, outputs) {
    if (rows.length === 0) {
        return '<div style="padding: 8px; color: var(--text-muted);">Pas de tests définis</div>';
    }

    let html = '';

    // Header
    html += '<div class="truth-table-header">';
    for (const inp of inputs) {
        html += `<div class="truth-table-cell">${inp}</div>`;
    }
    if (inputs.length > 0 && outputs.length > 0) {
        html += '<div class="truth-table-cell separator"></div>';
    }
    for (const out of outputs) {
        html += `<div class="truth-table-cell">${out}</div>`;
    }
    html += '</div>';

    // Rows
    for (const row of rows) {
        html += '<div class="truth-table-row">';
        for (const inp of inputs) {
            const val = row[inp] !== undefined ? row[inp] : '-';
            html += `<div class="truth-table-cell input">${val}</div>`;
        }
        if (inputs.length > 0 && outputs.length > 0) {
            html += '<div class="truth-table-cell separator"></div>';
        }
        for (const out of outputs) {
            const val = row[out] !== undefined ? row[out] : '-';
            html += `<div class="truth-table-cell output">${val}</div>`;
        }
        html += '</div>';
    }

    return html;
}

function parseChipInterface(template) {
    const inputs = [];
    const outputs = [];

    // Match port declarations like "a : in bit" or "y : out bit"
    const portRegex = /(\w+)\s*:\s*(in|out)\s+(bit(?:\s*\(\s*\d+\s+downto\s+\d+\s*\))?)/gi;
    let match;

    while ((match = portRegex.exec(template)) !== null) {
        const name = match[1];
        const direction = match[2].toLowerCase();
        const type = match[3];

        if (direction === 'in') {
            inputs.push(name);
        } else {
            outputs.push(name);
        }
    }

    return { inputs, outputs };
}

async function runHdlTest() {
    if (state.mode !== 'hdl') {
        log('Switch to HDL mode first', 'warn');
        return;
    }

    if (!state.hdlSim) {
        log('HDL simulator not initialized', 'error');
        return;
    }

    const chip = getChip(state.currentChip);
    if (!chip) {
        log('No chip selected', 'error');
        return;
    }

    const hdlSource = state.editor.getValue();
    const testScript = chip.test;

    // Get dependency library
    const library = getDependencyLibrary(state.currentChip, state.hdlLibrary);
    const libraryJson = JSON.stringify(library);

    log(`Testing ${state.currentChip}...`, 'info');

    try {
        const resultJson = state.hdlSim.run_test(hdlSource, testScript, libraryJson);
        const result = JSON.parse(resultJson);

        // Update test results panel
        updateTestResultsPanel(result);

        if (result.passed) {
            log(`All tests passed! (${result.passed_checks}/${result.total})`, 'success');

            // Unlock the chip
            state.hdlLibrary[state.currentChip] = hdlSource;
            saveHdlLibrary();
            updateHdlProgressUI();

            // Find next chip to attempt
            const nextChip = findNextChip();
            if (nextChip) {
                log(`Next challenge: ${nextChip}`, 'info');
            } else {
                log('All chips completed!', 'success');
            }
        } else {
            log(`Tests failed: ${result.passed_checks}/${result.total} passed`, 'error');
            for (const err of result.errors) {
                log(`  ${err}`, 'error');
            }
        }
    } catch (e) {
        log(`Test error: ${e}`, 'error');
        // Show error in results panel
        updateTestResultsPanel({
            passed: false,
            passed_checks: 0,
            total: 0,
            errors: [e.toString()]
        });
    }
}

function updateTestResultsPanel(result) {
    const container = document.getElementById('hdl-test-results');
    const summary = document.getElementById('test-summary');
    const list = document.getElementById('test-results-list');

    if (!container || !summary || !list) return;

    // Show the results panel
    container.style.display = 'block';

    // Update summary
    const total = result.total || 0;
    const passed = result.passed_checks || 0;
    summary.textContent = `${passed}/${total}`;
    summary.className = 'test-results-summary ' + (result.passed ? 'passed' : 'failed');

    // Build test results list
    let html = '';

    // Show passed tests
    for (let i = 0; i < passed; i++) {
        html += `<div class="test-item passed">
            <span class="status-icon">✓</span>
            <span class="test-detail">Test ${i + 1} passed</span>
        </div>`;
    }

    // Show failed tests / errors
    if (result.errors && result.errors.length > 0) {
        for (const err of result.errors) {
            html += `<div class="test-item failed">
                <span class="status-icon">✗</span>
                <span class="test-detail">${escapeHtml(err)}</span>
            </div>`;
        }
    }

    list.innerHTML = html;
}

function findNextChip() {
    const unlocked = Object.keys(state.hdlLibrary);
    for (const project of PROJECTS) {
        for (const chipName of project.chips) {
            if (!unlocked.includes(chipName) && canAttempt(chipName, unlocked)) {
                return chipName;
            }
        }
    }
    return null;
}

function showSolution() {
    if (state.mode !== 'hdl') {
        log('Switch to HDL mode first', 'warn');
        return;
    }

    const chip = getChip(state.currentChip);
    if (!chip) {
        log('No chip selected', 'error');
        return;
    }

    if (!chip.solution) {
        log(`No solution available for ${state.currentChip}`, 'warn');
        return;
    }

    // Replace editor content with solution
    state.editor.setValue(chip.solution);
    state.files.hdl.main = chip.solution;
    log(`Solution loaded for ${state.currentChip}`, 'info');
}

function updateHdlProgressUI() {
    const container = document.getElementById('hdl-chips');
    if (!container) return;

    container.innerHTML = '';
    const unlocked = Object.keys(state.hdlLibrary);

    for (const project of PROJECTS) {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'hdl-project';
        projectDiv.innerHTML = `<div class="hdl-project-title">P${project.id}: ${project.name}</div>`;

        const chipList = document.createElement('div');
        chipList.className = 'hdl-chip-list';

        for (const chipName of project.chips) {
            const chip = getChip(chipName);
            const isUnlocked = unlocked.includes(chipName);
            const canTry = canAttempt(chipName, unlocked);
            const isCurrent = chipName === state.currentChip;

            const chipEl = document.createElement('div');
            chipEl.className = `hdl-chip ${isUnlocked ? 'unlocked' : ''} ${canTry ? 'available' : 'locked'} ${isCurrent ? 'current' : ''}`;
            chipEl.innerHTML = `
                <span class="chip-status">${isUnlocked ? '✓' : canTry ? '○' : '🔒'}</span>
                <span class="chip-name">${chipName}</span>
            `;

            if (canTry) {
                chipEl.addEventListener('click', () => {
                    if (state.mode !== 'hdl') {
                        switchMode('hdl');
                    }
                    loadChip(chipName);
                });
            }

            chipList.appendChild(chipEl);
        }

        projectDiv.appendChild(chipList);
        container.appendChild(projectDiv);
    }

    // Collapse HDL section if all chips are complete
    if (areAllHdlChipsComplete()) {
        const hdlToggle = document.getElementById('hdl-section-toggle');
        const hdlContent = document.getElementById('hdl-section-content');
        if (hdlToggle && hdlContent) {
            hdlContent.classList.add('collapsed');
            hdlToggle.classList.remove('expanded');
            const arrow = hdlToggle.querySelector('.arrow');
            if (arrow) arrow.textContent = '▶';
        }
    }
}

// ============================================================================
// Console
// ============================================================================

function log(message, type = 'info') {
    const output = document.getElementById('console-output');
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.textContent = message;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

function clearConsole() {
    const output = document.getElementById('console-output');
    output.innerHTML = '';
}

// ============================================================================
// Theme
// ============================================================================

function toggleTheme() {
    const html = document.documentElement;
    const current = html.dataset.theme || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next;

    // Update Monaco theme (all editors)
    const monacoTheme = next === 'dark' ? 'vs-dark' : 'vs';
    if (state.editor) {
        monaco.editor.setTheme(monacoTheme);
    }
    if (state.asmOutputEditor) {
        // Already handled by setTheme above since it's global
    }

    // Update button
    document.getElementById('btn-theme').textContent = next === 'dark' ? '🌙' : '☀️';

    // Save preference
    localStorage.setItem('theme', next);
}

function loadTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.dataset.theme = saved;
    document.getElementById('btn-theme').textContent = saved === 'dark' ? '🌙' : '☀️';
}

// ============================================================================
// Modals
// ============================================================================

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function openLesson(lessonId) {
    // Load the appropriate exercise based on lessonId prefix
    if (lessonId.startsWith('asm-')) {
        loadAsmExercise(lessonId);
    } else if (lessonId.startsWith('os-')) {
        loadOsExercise(lessonId);
    } else if (lessonId.startsWith('cc-')) {
        loadCompilerExercise(lessonId);
    } else if (lessonId.startsWith('c-')) {
        loadCExercise(lessonId);
    } else {
        // Fallback to modal for unknown lessons
        const title = document.querySelector(`[data-lesson="${lessonId}"]`)?.textContent || lessonId;
        document.getElementById('lesson-title').textContent = title;
        document.getElementById('lesson-content').innerHTML = `
            <p>Contenu de la leçon: <strong>${lessonId}</strong></p>
            <p>Cette fonctionnalité chargera le contenu depuis les fichiers de documentation.</p>
        `;
        openModal('modal-lesson');
    }
}

// ============================================================================
// Utility
// ============================================================================

function formatHex(value, digits = 8) {
    if (value < 0) value = value >>> 0;
    return '0x' + value.toString(16).toUpperCase().padStart(digits, '0');
}

// ============================================================================
// Event Handlers
// ============================================================================

// ============================================================================
// Keyboard Handling
// ============================================================================

let keyboardCapturing = false;
let lastKeyCode = 0;

function setupKeyboardCapture() {
    const captureCheckbox = document.getElementById('keyboard-capture');
    const keyboardSection = document.querySelector('.keyboard-section');
    const screen = document.getElementById('screen');

    captureCheckbox.addEventListener('change', (e) => {
        keyboardCapturing = e.target.checked;
        keyboardSection.classList.toggle('capturing', keyboardCapturing);

        if (keyboardCapturing) {
            screen.focus();
            log('Keyboard capture enabled - click screen to send keys', 'info');
        } else {
            log('Keyboard capture disabled', 'info');
        }
    });

    // Make screen focusable
    screen.tabIndex = 0;

    // Handle keyboard events on screen
    screen.addEventListener('keydown', (e) => {
        if (!keyboardCapturing) return;

        e.preventDefault();
        e.stopPropagation();

        const keyCode = getKeyCode(e);
        lastKeyCode = keyCode;

        // Update display
        updateKeyboardDisplay(e.key, keyCode);

        // Send to simulator
        if (state.asmSim) {
            try {
                state.asmSim.set_key(keyCode);
            } catch (err) {
                // Simulator might not support keyboard
            }
        }
    });

    screen.addEventListener('keyup', (e) => {
        if (!keyboardCapturing) return;

        e.preventDefault();
        e.stopPropagation();

        // Clear keyboard on key release
        lastKeyCode = 0;
        updateKeyboardDisplay('-', 0);

        if (state.asmSim) {
            try {
                state.asmSim.set_key(0);
            } catch (err) {
                // Simulator might not support keyboard
            }
        }
    });

    // Focus screen when clicked
    screen.addEventListener('click', () => {
        if (keyboardCapturing) {
            screen.focus();
        }
    });
}

function getKeyCode(e) {
    // Map key events to ASCII or special codes
    const key = e.key;

    // Special keys
    if (key === 'Enter') return 13;
    if (key === 'Backspace') return 8;
    if (key === 'Tab') return 9;
    if (key === 'Escape') return 27;
    if (key === 'ArrowLeft') return 130;
    if (key === 'ArrowUp') return 131;
    if (key === 'ArrowRight') return 132;
    if (key === 'ArrowDown') return 133;
    if (key === 'Home') return 134;
    if (key === 'End') return 135;
    if (key === 'PageUp') return 136;
    if (key === 'PageDown') return 137;
    if (key === 'Insert') return 138;
    if (key === 'Delete') return 139;
    if (key === ' ') return 32;

    // Function keys
    if (key.match(/^F(\d+)$/)) {
        const num = parseInt(key.slice(1));
        return 140 + num;
    }

    // Regular ASCII characters
    if (key.length === 1) {
        return key.charCodeAt(0);
    }

    return 0;
}

function updateKeyboardDisplay(keyChar, keyCode) {
    const charEl = document.getElementById('key-char');
    const codeEl = document.getElementById('key-code');

    // Display the key character
    if (keyChar === ' ') {
        charEl.textContent = 'Space';
    } else if (keyChar === '-' || keyChar.length > 1) {
        charEl.textContent = keyChar;
    } else {
        charEl.textContent = keyChar;
    }

    // Display the key code
    codeEl.textContent = `0x${keyCode.toString(16).toUpperCase().padStart(4, '0')}`;
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });

    // Controls
    document.getElementById('btn-run').addEventListener('click', run);
    document.getElementById('btn-pause').addEventListener('click', pause);
    document.getElementById('btn-stop').addEventListener('click', stop);
    document.getElementById('btn-step').addEventListener('click', step);
    document.getElementById('btn-reset').addEventListener('click', reset);

    // HDL Test button (in output panel)
    const testBtnHdl = document.getElementById('btn-test-hdl');
    if (testBtnHdl) {
        testBtnHdl.addEventListener('click', runHdlTest);
    }

    // HDL Solution button (in output panel)
    const solutionBtnHdl = document.getElementById('btn-solution-hdl');
    if (solutionBtnHdl) {
        solutionBtnHdl.addEventListener('click', showSolution);
    }

    // ASM Download binary button
    const downloadBtn = document.getElementById('btn-download-a32b');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadBinary);
    }

    // C Copy ASM button
    const copyAsmBtn = document.getElementById('btn-copy-asm');
    if (copyAsmBtn) {
        copyAsmBtn.addEventListener('click', copyGeneratedAsm);
    }

    // HDL Section toggle
    const hdlToggle = document.getElementById('hdl-section-toggle');
    if (hdlToggle) {
        hdlToggle.addEventListener('click', () => {
            const content = document.getElementById('hdl-section-content');
            const isExpanded = hdlToggle.classList.contains('expanded');

            if (isExpanded) {
                content.classList.add('collapsed');
                hdlToggle.classList.remove('expanded');
                hdlToggle.querySelector('.arrow').textContent = '▶';
            } else {
                content.classList.remove('collapsed');
                hdlToggle.classList.add('expanded');
                hdlToggle.querySelector('.arrow').textContent = '▼';
            }
        });
    }

    // File operations
    document.getElementById('btn-open').addEventListener('click', openFile);
    document.getElementById('btn-save').addEventListener('click', saveFile);

    // Speed control
    document.getElementById('speed-slider').addEventListener('input', (e) => {
        state.speed = parseInt(e.target.value);
    });

    // Theme
    document.getElementById('btn-theme').addEventListener('click', toggleTheme);

    // Help
    document.getElementById('btn-help').addEventListener('click', () => openModal('modal-help'));

    // Save/Load/Reset Progress
    document.getElementById('btn-save-progress').addEventListener('click', exportProgress);
    document.getElementById('btn-load-progress').addEventListener('click', () => {
        document.getElementById('progress-file-input').click();
    });
    document.getElementById('progress-file-input').addEventListener('change', importProgress);
    document.getElementById('btn-reset-progress').addEventListener('click', resetAllProgress);

    // Console
    document.getElementById('btn-clear-console').addEventListener('click', clearConsole);

    // Console input
    document.getElementById('console-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const input = e.target.value;
            e.target.value = '';
            log(`> ${input}`, 'input');
            // Send to simulator keyboard buffer
            if (state.asmSim && input) {
                for (let i = 0; i < input.length; i++) {
                    try {
                        state.asmSim.set_key(input.charCodeAt(i));
                    } catch (err) {}
                }
                // Send Enter
                try {
                    state.asmSim.set_key(13);
                } catch (err) {}
            }
        }
    });

    // Modal close buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });

    // Modal backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.classList.remove('active');
            }
        });
    });

    // Curriculum
    document.querySelectorAll('.week-header').forEach(header => {
        header.addEventListener('click', () => {
            const weekId = header.dataset.week;
            const content = document.getElementById(weekId);
            const isExpanded = !content.classList.contains('collapsed');

            if (isExpanded) {
                content.classList.add('collapsed');
                header.classList.remove('expanded');
                header.querySelector('.arrow').textContent = '▶';
            } else {
                content.classList.remove('collapsed');
                header.classList.add('expanded');
                header.querySelector('.arrow').textContent = '▼';
            }
        });
    });

    // Lessons/Exercises - with mode switching
    document.querySelectorAll('.lesson-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const lessonMode = item.dataset.mode;
            if (lessonMode && lessonMode !== state.mode) {
                switchMode(lessonMode);
            }
            openLesson(item.dataset.lesson);
        });
    });

    // Lesson modal buttons
    document.getElementById('btn-lesson-done').addEventListener('click', () => {
        const title = document.getElementById('lesson-title').textContent;
        // Find the lesson ID from the title
        const item = Array.from(document.querySelectorAll('.lesson-item'))
            .find(i => i.textContent.includes(title.split(':').pop()?.trim() || title));
        if (item) {
            markLessonComplete(item.dataset.lesson);
        }
        closeModal('modal-lesson');
    });

    // Demos
    document.querySelectorAll('.demo-btn').forEach(btn => {
        btn.addEventListener('click', () => loadDemo(btn.dataset.demo));
    });

    // Memory address go
    document.getElementById('btn-mem-go').addEventListener('click', () => {
        const addr = parseInt(document.getElementById('mem-addr').value, 16) || 0;
        updateMemory(addr);
    });

    // Visualizer tabs
    document.querySelectorAll('.viz-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const vizType = tab.dataset.viz;

            // Update tab states
            document.querySelectorAll('.viz-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update panel states
            document.querySelectorAll('.viz-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`${vizType}-visualizer`)?.classList.add('active');

            // Trigger render for the newly visible panel
            if (state.visualizers) {
                state.visualizers.renderAll();
            }
        });
    });

    // Keyboard capture
    setupKeyboardCapture();

    // Keyboard shortcuts (when not capturing)
    document.addEventListener('keydown', (e) => {
        // Skip if keyboard capture is active and focus is on screen
        if (keyboardCapturing && document.activeElement === document.getElementById('screen')) {
            return;
        }

        if (e.key === 'F5') {
            e.preventDefault();
            if (e.shiftKey) {
                stop();
            } else {
                run();
            }
        } else if (e.key === 'F10') {
            e.preventDefault();
            step();
        } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            saveFile();
        }
    });

    // Window resize
    window.addEventListener('resize', () => {
        if (state.editor) {
            state.editor.layout();
        }
    });
}

// ============================================================================
// Initialization
// ============================================================================

async function init() {
    loadTheme();
    loadProgress();
    loadHdlLibrary();

    log('Initializing Monaco Editor...', 'info');
    await initMonaco();
    log('Monaco Editor ready', 'success');

    log('Initializing simulator...', 'info');
    await initSimulator();

    setupEventListeners();

    // Navigate to next progression point
    navigateToNextProgressionPoint();
    updateModeSpecificUI();

    log('Ready!', 'success');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
