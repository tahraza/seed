/**
 * Visualizers Module - Point d'entrée pour tous les visualiseurs
 * Intègre les visualiseurs avec le simulateur
 */

import { MemoryVisualizer, createMemoryVisualizer } from './memory-visualizer.js';
import { CallStackVisualizer, createCallStackVisualizer } from './callstack-visualizer.js';
import { WaveformVisualizer, createWaveformVisualizer } from './waveform-visualizer.js';
import { ALUVisualizer, createALUVisualizer } from './alu-visualizer.js';
import { HdlDebugger, createDebuggerPanel } from './hdl-debugger.js';

// Export individuel
export {
    MemoryVisualizer,
    createMemoryVisualizer,
    CallStackVisualizer,
    createCallStackVisualizer,
    WaveformVisualizer,
    createWaveformVisualizer,
    ALUVisualizer,
    createALUVisualizer,
    HdlDebugger,
    createDebuggerPanel,
};

/**
 * Gestionnaire de visualiseurs intégré au simulateur
 */
export class VisualizerManager {
    constructor(options = {}) {
        this.visualizers = {};
        this.simulator = null;
        this.hdlSim = null;
        this.enabled = true;
    }

    /**
     * Attache un simulateur A32
     */
    attachSimulator(sim) {
        this.simulator = sim;
    }

    /**
     * Attache un simulateur HDL
     */
    attachHdlSimulator(hdlSim) {
        this.hdlSim = hdlSim;
    }

    /**
     * Initialise le visualiseur mémoire
     */
    initMemory(container, options = {}) {
        if (!container) return null;

        try {
            const viz = createMemoryVisualizer(container, options);
            this.visualizers.memory = viz;

            // Configurer la taille RAM si le simulateur est attaché
            if (this.simulator) {
                try {
                    viz.setRamSize(this.simulator.ram_size());
                } catch (e) {
                    console.warn('Could not get RAM size:', e);
                }
            }

            return viz;
        } catch (e) {
            console.warn('Failed to initialize memory visualizer:', e);
            return null;
        }
    }

    /**
     * Initialise le visualiseur de pile d'appels
     */
    initCallStack(container, options = {}) {
        if (!container) return null;
        try {
            const viz = createCallStackVisualizer(container, options);
            this.visualizers.callStack = viz;
            return viz;
        } catch (e) {
            console.warn('Failed to initialize callstack visualizer:', e);
            return null;
        }
    }

    /**
     * Initialise le visualiseur de chronogramme
     */
    initWaveform(container, options = {}) {
        if (!container) return null;
        try {
            const viz = createWaveformVisualizer(container, options);
            this.visualizers.waveform = viz;
            return viz;
        } catch (e) {
            console.warn('Failed to initialize waveform visualizer:', e);
            return null;
        }
    }

    /**
     * Initialise le visualiseur d'ALU
     */
    initALU(container, options = {}) {
        if (!container) return null;
        try {
            const viz = createALUVisualizer(container, options);
            this.visualizers.alu = viz;
            return viz;
        } catch (e) {
            console.warn('Failed to initialize ALU visualizer:', e);
            return null;
        }
    }

    /**
     * Initialise le debugger HDL avec waveforms
     * @param {HTMLElement} container - Conteneur pour le debugger
     * @param {Object} options - Options de configuration
     * @returns {HdlDebugger|null} Instance du debugger ou null si erreur
     */
    initHdlDebugger(container, options = {}) {
        if (!container || !this.hdlSim) {
            console.warn('Cannot init HDL debugger: missing container or HDL simulator');
            return null;
        }
        try {
            const debugger_ = createDebuggerPanel(container, this.hdlSim, {
                maxCycles: 500,
                signalHeight: 28,
                cycleWidth: 10,
                onCycleChange: (cycle) => {
                    // Mise à jour de l'interface si nécessaire
                    if (options.onCycleChange) options.onCycleChange(cycle);
                },
                onBreakpoint: (bp) => {
                    console.log('HDL Debugger breakpoint:', bp);
                    if (options.onBreakpoint) options.onBreakpoint(bp);
                },
                ...options
            });
            this.visualizers.hdlDebugger = debugger_;
            return debugger_;
        } catch (e) {
            console.warn('Failed to initialize HDL debugger:', e);
            return null;
        }
    }

    /**
     * Retourne le debugger HDL s'il est initialisé
     */
    getHdlDebugger() {
        return this.visualizers.hdlDebugger || null;
    }

    /**
     * Met à jour tous les visualiseurs après un step du simulateur
     */
    update() {
        if (!this.enabled || !this.simulator) return;

        // Mise à jour mémoire
        if (this.visualizers.memory) {
            try {
                const mem = this.visualizers.memory;
                // Get PC and SP safely
                try {
                    const pc = this.simulator.reg(15);
                    if (typeof pc === 'number') mem.updatePC(pc);
                } catch (e) { /* Program not loaded yet */ }

                try {
                    const sp = this.simulator.reg(13);
                    if (typeof sp === 'number') mem.updateSP(sp);
                } catch (e) { /* Program not loaded yet */ }

                // Get memory access safely
                try {
                    const access = this.simulator.last_mem_access();
                    if (access && Array.isArray(access)) {
                        mem.addAccess(access[0], access[1], access[2]);
                    }
                } catch (e) { /* last_mem_access might fail */ }

                mem.render();
            } catch (e) {
                console.warn('Memory visualizer update error:', e);
            }
        }

        // Mise à jour pile d'appels
        if (this.visualizers.callStack) {
            try {
                const cs = this.visualizers.callStack;
                const event = this.simulator.last_call_event();
                if (event && Array.isArray(event)) {
                    if (event[0] === 'call') {
                        cs.onCall(event[1], event[2]);
                    } else if (event[0] === 'return') {
                        cs.onReturn(event[1]);
                    }
                }
            } catch (e) {
                console.warn('CallStack visualizer update error:', e);
            }
        }
    }

    /**
     * Met à jour le visualiseur HDL après un tick/tock
     */
    updateHdl(signals) {
        if (!this.enabled) return;

        // Mise à jour waveform
        if (this.visualizers.waveform && signals) {
            try {
                this.visualizers.waveform.capture(signals);
                this.visualizers.waveform.scrollToCurrent();
                this.visualizers.waveform.render();
            } catch (e) {
                console.warn('Waveform visualizer update error:', e);
            }
        }
    }

    /**
     * Anime une opération ALU
     */
    async animateALU(a, b, op, result, flags) {
        if (!this.enabled || !this.visualizers.alu) return;
        try {
            await this.visualizers.alu.animate(a, b, op, result, flags);
        } catch (e) {
            console.warn('ALU animation error:', e);
        }
    }

    /**
     * Reset tous les visualiseurs
     */
    reset() {
        try {
            if (this.visualizers.memory) {
                this.visualizers.memory.clearAccesses();
                this.visualizers.memory.render();
            }
        } catch (e) { console.warn('Memory visualizer reset error:', e); }

        try {
            if (this.visualizers.callStack) {
                this.visualizers.callStack.reset();
            }
        } catch (e) { console.warn('CallStack visualizer reset error:', e); }

        try {
            if (this.visualizers.waveform) {
                this.visualizers.waveform.reset();
                this.visualizers.waveform.render();
            }
        } catch (e) { console.warn('Waveform visualizer reset error:', e); }

        try {
            if (this.visualizers.alu) {
                this.visualizers.alu.setInputs(0, 0);
                this.visualizers.alu.setResult(0, { n: false, z: false, c: false, v: false });
            }
        } catch (e) { console.warn('ALU visualizer reset error:', e); }
    }

    /**
     * Active/désactive les visualiseurs
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Rendu de tous les visualiseurs
     */
    renderAll() {
        try {
            if (this.visualizers.memory) this.visualizers.memory.render();
        } catch (e) { console.warn('Memory visualizer render error:', e); }
        try {
            if (this.visualizers.waveform) this.visualizers.waveform.render();
        } catch (e) { console.warn('Waveform visualizer render error:', e); }
        try {
            if (this.visualizers.callStack) this.visualizers.callStack.render();
        } catch (e) { console.warn('CallStack visualizer render error:', e); }
        try {
            if (this.visualizers.alu) this.visualizers.alu.render();
        } catch (e) { console.warn('ALU visualizer render error:', e); }
    }
}

/**
 * Crée un panneau de visualiseurs complet
 */
export function createVisualizersPanel(container, options = {}) {
    const panel = document.createElement('div');
    panel.className = 'visualizers-panel';

    // Créer les conteneurs pour chaque visualiseur
    const sections = [
        { id: 'memory', title: 'Mémoire', height: '180px' },
        { id: 'callstack', title: 'Pile d\'appels', height: '150px' },
        { id: 'waveform', title: 'Chronogramme', height: '200px' },
        { id: 'alu', title: 'ALU', height: '220px' },
    ];

    const containers = {};

    sections.forEach(section => {
        if (options.exclude && options.exclude.includes(section.id)) return;

        const wrapper = document.createElement('div');
        wrapper.className = `visualizer-container ${section.id}-visualizer`;

        wrapper.innerHTML = `
            <div class="visualizer-header">
                <span class="visualizer-title">${section.title}</span>
                <button class="visualizer-toggle" data-target="${section.id}">−</button>
            </div>
            <div class="visualizer-content" id="viz-${section.id}" style="height: ${section.height}"></div>
        `;

        panel.appendChild(wrapper);
        containers[section.id] = wrapper.querySelector('.visualizer-content');

        // Toggle collapse
        const toggleBtn = wrapper.querySelector('.visualizer-toggle');
        toggleBtn.addEventListener('click', () => {
            const content = wrapper.querySelector('.visualizer-content');
            content.classList.toggle('collapsed');
            toggleBtn.textContent = content.classList.contains('collapsed') ? '+' : '−';
        });
    });

    container.appendChild(panel);

    // Créer le gestionnaire
    const manager = new VisualizerManager();

    // Initialiser les visualiseurs
    if (containers.memory) manager.initMemory(containers.memory);
    if (containers.callstack) manager.initCallStack(containers.callstack);
    if (containers.waveform) manager.initWaveform(containers.waveform);
    if (containers.alu) manager.initALU(containers.alu);

    return manager;
}
