/**
 * HDL Debugger - Intégration du simulateur HDL avec le visualiseur de waveforms
 * Permet le débogage interactif des circuits HDL avec chronogrammes temps-réel
 */

import { createWaveformVisualizer } from './waveform-visualizer.js';

export class HdlDebugger {
    constructor(hdlSim, container, options = {}) {
        this.hdlSim = hdlSim;
        this.waveform = createWaveformVisualizer(container, {
            maxCycles: options.maxCycles || 500,
            signalHeight: options.signalHeight || 28,
            cycleWidth: options.cycleWidth || 10,
            ...options
        });

        // Signal configuration
        this.signalFilter = options.signalFilter || 'all'; // 'all', 'inputs', 'outputs', 'internal'
        this.signalList = []; // All available signals
        this.signalInfo = new Map(); // Signal metadata

        // Breakpoints
        this.breakpoints = new Map(); // signalName -> { condition: 'change' | 'high' | 'low' | value }
        this.lastValues = new Map(); // signalName -> lastValue
        this.breakpointHit = null;

        // Auto-capture
        this.autoCapture = true;
        this.cycle = 0;

        // Callbacks
        this.onBreakpoint = options.onBreakpoint || null;
        this.onCycleChange = options.onCycleChange || null;
    }

    /**
     * Initialize the debugger by fetching all signals from the HDL simulator
     * Call this after loading a circuit
     */
    async initialize() {
        try {
            // Try to use the new list_signals method
            if (typeof this.hdlSim.list_signals === 'function') {
                const signalsJson = this.hdlSim.list_signals();
                this.signalList = JSON.parse(signalsJson);

                // Get signal info for each
                for (const name of this.signalList) {
                    if (typeof this.hdlSim.get_signal_info === 'function') {
                        const infoJson = this.hdlSim.get_signal_info(name);
                        const info = JSON.parse(infoJson);
                        this.signalInfo.set(name, info);
                        this.waveform.addSignal(name, info.width);
                    } else {
                        this.waveform.addSignal(name, 1);
                    }
                }
            } else {
                // Fallback: manually specified signals
                console.warn('HdlDebugger: list_signals not available, using manual signal list');
            }

            this.updateVisibleSignals();
            this.captureSignals();
            this.waveform.render();

            return true;
        } catch (error) {
            console.error('HdlDebugger.initialize error:', error);
            return false;
        }
    }

    /**
     * Manually add signals when list_signals is not available
     */
    addSignals(signalNames) {
        for (const name of signalNames) {
            if (!this.signalList.includes(name)) {
                this.signalList.push(name);
                this.waveform.addSignal(name, 1);
            }
        }
        this.updateVisibleSignals();
    }

    /**
     * Set signal metadata manually
     */
    setSignalInfo(name, width, isInput, isOutput) {
        this.signalInfo.set(name, { width, is_input: isInput, is_output: isOutput });
        this.waveform.signals.get(name).width = width;
    }

    /**
     * Update which signals are visible based on filter
     */
    updateVisibleSignals() {
        let visible = [];

        for (const name of this.signalList) {
            const info = this.signalInfo.get(name);

            if (this.signalFilter === 'all') {
                visible.push(name);
            } else if (this.signalFilter === 'inputs' && info?.is_input) {
                visible.push(name);
            } else if (this.signalFilter === 'outputs' && info?.is_output) {
                visible.push(name);
            } else if (this.signalFilter === 'internal' && !info?.is_input && !info?.is_output) {
                visible.push(name);
            }
        }

        this.waveform.setVisibleSignals(visible);
    }

    /**
     * Set signal filter
     */
    setFilter(filter) {
        this.signalFilter = filter;
        this.updateVisibleSignals();
        this.waveform.render();
    }

    /**
     * Capture current signal values
     */
    captureSignals() {
        const values = {};

        // Try bulk capture first
        if (typeof this.hdlSim.dump_signals === 'function') {
            try {
                const dumpJson = this.hdlSim.dump_signals();
                const dump = JSON.parse(dumpJson);
                for (const [name, value] of Object.entries(dump)) {
                    values[name] = value;
                    this.checkBreakpoint(name, value);
                }
            } catch (e) {
                console.error('dump_signals error:', e);
            }
        } else {
            // Fallback: individual queries
            for (const name of this.signalList) {
                try {
                    const value = this.hdlSim.get_signal(name);
                    values[name] = value;
                    this.checkBreakpoint(name, value);
                } catch (e) {
                    // Signal may not exist
                }
            }
        }

        this.waveform.capture(values);
    }

    /**
     * Check if a breakpoint condition is met
     */
    checkBreakpoint(name, value) {
        const bp = this.breakpoints.get(name);
        if (!bp) return;

        const lastValue = this.lastValues.get(name);
        let hit = false;

        // Parse value (handle both 0b... strings and numbers)
        let numValue;
        if (typeof value === 'string') {
            numValue = parseInt(value.replace(/^0b/, ''), 2);
        } else {
            numValue = value;
        }

        switch (bp.condition) {
            case 'change':
                if (lastValue !== undefined && lastValue !== numValue) {
                    hit = true;
                }
                break;
            case 'high':
                if (numValue !== 0) hit = true;
                break;
            case 'low':
                if (numValue === 0) hit = true;
                break;
            case 'rising':
                if (lastValue === 0 && numValue !== 0) hit = true;
                break;
            case 'falling':
                if (lastValue !== 0 && numValue === 0) hit = true;
                break;
            default:
                // Specific value
                if (numValue === bp.condition) hit = true;
        }

        this.lastValues.set(name, numValue);

        if (hit) {
            this.breakpointHit = { signal: name, value: numValue, cycle: this.cycle };
            if (this.onBreakpoint) {
                this.onBreakpoint(this.breakpointHit);
            }
        }
    }

    /**
     * Add a breakpoint
     */
    addBreakpoint(signalName, condition = 'change') {
        this.breakpoints.set(signalName, { condition });
    }

    /**
     * Remove a breakpoint
     */
    removeBreakpoint(signalName) {
        this.breakpoints.delete(signalName);
    }

    /**
     * Clear all breakpoints
     */
    clearBreakpoints() {
        this.breakpoints.clear();
        this.breakpointHit = null;
    }

    /**
     * Execute one clock cycle (tick + tock) with auto-capture
     */
    step() {
        this.breakpointHit = null;

        // Tick (rising edge)
        this.hdlSim.tick();
        this.cycle++;
        if (this.autoCapture) {
            this.captureSignals();
        }

        // Check for breakpoint
        if (this.breakpointHit) {
            this.waveform.render();
            return { stopped: true, reason: 'breakpoint', ...this.breakpointHit };
        }

        // Tock (falling edge)
        this.hdlSim.tock();
        if (this.autoCapture) {
            this.captureSignals();
        }

        this.waveform.scrollToCurrent();
        this.waveform.render();

        if (this.onCycleChange) {
            this.onCycleChange(this.cycle);
        }

        if (this.breakpointHit) {
            return { stopped: true, reason: 'breakpoint', ...this.breakpointHit };
        }

        return { stopped: false, cycle: this.cycle };
    }

    /**
     * Run multiple cycles until breakpoint or limit
     */
    run(maxCycles = 1000) {
        for (let i = 0; i < maxCycles; i++) {
            const result = this.step();
            if (result.stopped) {
                return result;
            }
        }
        return { stopped: true, reason: 'limit', cycle: this.cycle };
    }

    /**
     * Reset the debugger state
     */
    reset() {
        this.cycle = 0;
        this.breakpointHit = null;
        this.lastValues.clear();
        this.waveform.reset();
        this.waveform.render();
    }

    /**
     * Export waveform data as VCD (Value Change Dump) format
     * Standard format supported by most waveform viewers
     */
    exportVCD() {
        let vcd = '';
        const date = new Date().toISOString();

        // Header
        vcd += `$date ${date} $end\n`;
        vcd += `$version HDL Debugger 1.0 $end\n`;
        vcd += `$timescale 1ns $end\n`;

        // Signal definitions
        vcd += `$scope module top $end\n`;
        let varId = 33; // ASCII '!'
        const signalIds = new Map();

        for (const name of this.signalList) {
            const info = this.signalInfo.get(name) || { width: 1 };
            const id = String.fromCharCode(varId++);
            signalIds.set(name, id);
            vcd += `$var wire ${info.width} ${id} ${name} $end\n`;
        }

        vcd += `$upscope $end\n`;
        vcd += `$enddefinitions $end\n`;

        // Initial values
        vcd += `#0\n`;
        vcd += `$dumpvars\n`;
        for (const [name, signal] of this.waveform.signals) {
            const id = signalIds.get(name);
            if (id && signal.history.length > 0) {
                const val = signal.history[0].value;
                const info = this.signalInfo.get(name) || { width: 1 };
                if (info.width === 1) {
                    vcd += `${val}${id}\n`;
                } else {
                    vcd += `b${val.toString(2).padStart(info.width, '0')} ${id}\n`;
                }
            }
        }
        vcd += `$end\n`;

        // Value changes
        for (const [name, signal] of this.waveform.signals) {
            const id = signalIds.get(name);
            const info = this.signalInfo.get(name) || { width: 1 };

            for (let i = 1; i < signal.history.length; i++) {
                const entry = signal.history[i];
                const prev = signal.history[i - 1];

                if (entry.value !== prev.value) {
                    vcd += `#${entry.cycle}\n`;
                    if (info.width === 1) {
                        vcd += `${entry.value}${id}\n`;
                    } else {
                        vcd += `b${entry.value.toString(2).padStart(info.width, '0')} ${id}\n`;
                    }
                }
            }
        }

        return vcd;
    }

    /**
     * Get the waveform visualizer for direct access
     */
    getWaveform() {
        return this.waveform;
    }

    /**
     * Render the waveform
     */
    render() {
        this.waveform.render();
    }
}

/**
 * Create a debugger panel UI
 */
export function createDebuggerPanel(container, hdlSim, options = {}) {
    const panel = document.createElement('div');
    panel.className = 'hdl-debugger-panel';
    panel.innerHTML = `
        <div class="debugger-toolbar">
            <button class="btn-step" title="Step (un cycle)">⏭ Step</button>
            <button class="btn-run" title="Run (jusqu'au breakpoint)">▶ Run</button>
            <button class="btn-reset" title="Reset">⏹ Reset</button>
            <span class="cycle-counter">Cycle: 0</span>
            <select class="signal-filter">
                <option value="all">Tous signaux</option>
                <option value="inputs">Entrées</option>
                <option value="outputs">Sorties</option>
                <option value="internal">Internes</option>
            </select>
            <button class="btn-export" title="Exporter VCD">💾 VCD</button>
        </div>
        <div class="debugger-waveform"></div>
        <div class="debugger-status"></div>
    `;
    container.appendChild(panel);

    const waveformContainer = panel.querySelector('.debugger-waveform');
    const cycleCounter = panel.querySelector('.cycle-counter');
    const statusBar = panel.querySelector('.debugger-status');
    const filterSelect = panel.querySelector('.signal-filter');

    // Create debugger
    const debugger_ = new HdlDebugger(hdlSim, waveformContainer, {
        ...options,
        onCycleChange: (cycle) => {
            cycleCounter.textContent = `Cycle: ${cycle}`;
        },
        onBreakpoint: (bp) => {
            statusBar.textContent = `Breakpoint: ${bp.signal} = ${bp.value} @ cycle ${bp.cycle}`;
            statusBar.classList.add('breakpoint');
        }
    });

    // Bind events
    panel.querySelector('.btn-step').onclick = () => {
        statusBar.classList.remove('breakpoint');
        debugger_.step();
    };

    panel.querySelector('.btn-run').onclick = () => {
        statusBar.classList.remove('breakpoint');
        const result = debugger_.run(1000);
        if (result.reason === 'limit') {
            statusBar.textContent = 'Arrêté: limite de cycles atteinte';
        }
    };

    panel.querySelector('.btn-reset').onclick = () => {
        debugger_.reset();
        statusBar.textContent = '';
        statusBar.classList.remove('breakpoint');
    };

    filterSelect.onchange = () => {
        debugger_.setFilter(filterSelect.value);
    };

    panel.querySelector('.btn-export').onclick = () => {
        const vcd = debugger_.exportVCD();
        const blob = new Blob([vcd], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'waveform.vcd';
        a.click();
        URL.revokeObjectURL(url);
    };

    return debugger_;
}
