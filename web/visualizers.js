/**
 * Visualizers Module - Point d'entrée pour tous les visualiseurs
 * Intègre les visualiseurs avec le simulateur
 */

import { MemoryVisualizer, createMemoryVisualizer } from './memory-visualizer.js';
import { CallStackVisualizer, createCallStackVisualizer } from './callstack-visualizer.js';
import { WaveformVisualizer, createWaveformVisualizer } from './waveform-visualizer.js';
import { ALUVisualizer, createALUVisualizer } from './alu-visualizer.js';

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
        const viz = createMemoryVisualizer(container, options);
        this.visualizers.memory = viz;

        // Configurer la taille RAM si le simulateur est attaché
        if (this.simulator) {
            viz.setRamSize(this.simulator.ram_size());
        }

        return viz;
    }

    /**
     * Initialise le visualiseur de pile d'appels
     */
    initCallStack(container, options = {}) {
        const viz = createCallStackVisualizer(container, options);
        this.visualizers.callStack = viz;
        return viz;
    }

    /**
     * Initialise le visualiseur de chronogramme
     */
    initWaveform(container, options = {}) {
        const viz = createWaveformVisualizer(container, options);
        this.visualizers.waveform = viz;
        return viz;
    }

    /**
     * Initialise le visualiseur d'ALU
     */
    initALU(container, options = {}) {
        const viz = createALUVisualizer(container, options);
        this.visualizers.alu = viz;
        return viz;
    }

    /**
     * Met à jour tous les visualiseurs après un step du simulateur
     */
    update() {
        if (!this.enabled || !this.simulator) return;

        try {
            // Mise à jour mémoire
            if (this.visualizers.memory) {
                const mem = this.visualizers.memory;
                mem.updatePC(this.simulator.reg(15)); // R15 = PC
                mem.updateSP(this.simulator.reg(13)); // R13 = SP

                const access = this.simulator.last_mem_access();
                if (access) {
                    mem.addAccess(access[0], access[1], access[2]);
                }
                mem.render();
            }

            // Mise à jour pile d'appels
            if (this.visualizers.callStack) {
                const cs = this.visualizers.callStack;
                const event = this.simulator.last_call_event();
                if (event) {
                    if (event[0] === 'call') {
                        cs.onCall(event[1], event[2]);
                    } else if (event[0] === 'return') {
                        cs.onReturn(event[1]);
                    }
                }
            }
        } catch (e) {
            console.warn('Visualizer update error:', e);
        }
    }

    /**
     * Met à jour le visualiseur HDL après un tick/tock
     */
    updateHdl(signals) {
        if (!this.enabled) return;

        // Mise à jour waveform
        if (this.visualizers.waveform && signals) {
            this.visualizers.waveform.capture(signals);
            this.visualizers.waveform.render();
        }
    }

    /**
     * Anime une opération ALU
     */
    async animateALU(a, b, op, result, flags) {
        if (!this.enabled || !this.visualizers.alu) return;
        await this.visualizers.alu.animate(a, b, op, result, flags);
    }

    /**
     * Reset tous les visualiseurs
     */
    reset() {
        if (this.visualizers.memory) {
            this.visualizers.memory.clearAccesses();
            this.visualizers.memory.render();
        }
        if (this.visualizers.callStack) {
            this.visualizers.callStack.reset();
        }
        if (this.visualizers.waveform) {
            this.visualizers.waveform.reset();
            this.visualizers.waveform.render();
        }
        if (this.visualizers.alu) {
            this.visualizers.alu.setInputs(0, 0);
            this.visualizers.alu.setResult(0, { n: false, z: false, c: false, v: false });
        }
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
        if (this.visualizers.memory) this.visualizers.memory.render();
        if (this.visualizers.waveform) this.visualizers.waveform.render();
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
