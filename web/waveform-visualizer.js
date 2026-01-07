/**
 * Waveform Visualizer - Chronogramme temps-réel des signaux HDL
 * Affiche les signaux digitaux avec transitions et valeurs
 */

export class WaveformVisualizer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Configuration
        this.maxCycles = options.maxCycles || 200;
        this.signalHeight = options.signalHeight || 30;
        this.labelWidth = options.labelWidth || 80;
        this.cycleWidth = options.cycleWidth || 8;

        // Données des signaux
        this.signals = new Map(); // name -> { width, history: [{cycle, value}] }
        this.currentCycle = 0;

        // Signaux à afficher (configurables)
        this.visibleSignals = [];

        // Scroll
        this.scrollX = 0;
        this.scrollY = 0;

        // Couleurs
        this.colors = {
            background: '#1a1a2e',
            grid: '#2a2a4e',
            signal0: '#4a90d9',
            signal1: '#f0ad4e',
            signalX: '#888',
            signalMulti: '#5cb85c',
            text: '#ccc',
            highlight: '#ff6b6b',
        };

        // Événements
        this.setupEvents();
        this.resize();
    }

    setupEvents() {
        // Scroll horizontal
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.shiftKey) {
                this.scrollX = Math.max(0, this.scrollX + e.deltaY);
            } else {
                this.scrollY = Math.max(0, this.scrollY + e.deltaY);
            }
            this.render();
        });
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;
    }

    /**
     * Ajoute ou met à jour un signal
     */
    addSignal(name, width = 1) {
        if (!this.signals.has(name)) {
            this.signals.set(name, {
                width,
                history: [],
            });
            if (!this.visibleSignals.includes(name)) {
                this.visibleSignals.push(name);
            }
        }
    }

    /**
     * Définit les signaux visibles
     */
    setVisibleSignals(names) {
        this.visibleSignals = names;
    }

    /**
     * Capture les valeurs actuelles des signaux
     * @param {Object} values - { signalName: value (as number or string) }
     */
    capture(values) {
        this.currentCycle++;

        for (const [name, value] of Object.entries(values)) {
            let signal = this.signals.get(name);
            if (!signal) {
                // Déterminer la largeur du signal
                let width = 1;
                if (typeof value === 'string') {
                    width = value.length;
                } else if (typeof value === 'number') {
                    width = value > 1 ? 32 : 1; // Approximation
                }
                this.addSignal(name, width);
                signal = this.signals.get(name);
            }

            // Convertir la valeur
            let numValue;
            if (typeof value === 'string') {
                numValue = parseInt(value.replace(/^0b/, ''), 2);
            } else {
                numValue = value;
            }

            // Ajouter à l'historique
            signal.history.push({
                cycle: this.currentCycle,
                value: numValue,
            });

            // Limiter l'historique
            if (signal.history.length > this.maxCycles) {
                signal.history.shift();
            }
        }
    }

    /**
     * Avance d'un cycle (tick/tock)
     */
    tick() {
        this.currentCycle++;
    }

    /**
     * Réinitialise le visualiseur (garde les signaux mais efface l'historique)
     */
    reset() {
        this.currentCycle = 0;
        for (const signal of this.signals.values()) {
            signal.history = [];
        }
        this.scrollX = 0;
    }

    /**
     * Efface complètement tous les signaux
     */
    clear() {
        this.currentCycle = 0;
        this.signals.clear();
        this.visibleSignals = [];
        this.scrollX = 0;
        this.scrollY = 0;
    }

    /**
     * Rendu du chronogramme
     */
    render() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // Clear
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, w, h);

        const signals = this.visibleSignals
            .map(name => ({ name, data: this.signals.get(name) }))
            .filter(s => s.data);

        if (signals.length === 0) {
            ctx.fillStyle = this.colors.text;
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Aucun signal à afficher', w / 2, h / 2);
            return;
        }

        // Zone de dessin
        const waveX = this.labelWidth;
        const waveW = w - this.labelWidth;
        const totalHeight = signals.length * this.signalHeight;

        // Grille verticale (cycles)
        this.renderGrid(ctx, waveX, 0, waveW, Math.min(totalHeight, h));

        // Signaux
        signals.forEach((signal, i) => {
            const y = i * this.signalHeight - this.scrollY;
            if (y + this.signalHeight > 0 && y < h) {
                this.renderSignal(ctx, signal.name, signal.data, 0, y, waveX, waveW);
            }
        });

        // Indicateur de cycle actuel
        this.renderCurrentCycle(ctx, waveX, 0, waveW, Math.min(totalHeight, h));
    }

    renderGrid(ctx, x, y, w, h) {
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 0.5;

        const startCycle = Math.floor(this.scrollX / this.cycleWidth);
        const endCycle = startCycle + Math.ceil(w / this.cycleWidth) + 1;

        for (let cycle = startCycle; cycle <= endCycle; cycle++) {
            const cx = x + (cycle * this.cycleWidth) - this.scrollX;
            if (cx < x || cx > x + w) continue;

            ctx.beginPath();
            ctx.moveTo(cx, y);
            ctx.lineTo(cx, y + h);
            ctx.stroke();

            // Numéro de cycle (tous les 10)
            if (cycle % 10 === 0) {
                ctx.fillStyle = this.colors.text;
                ctx.font = '9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(cycle.toString(), cx, y + h + 12);
            }
        }
    }

    renderSignal(ctx, name, data, x, y, labelW, waveW) {
        const h = this.signalHeight;
        const padding = 4;

        // Fond de la zone de label
        ctx.fillStyle = '#16213e';
        ctx.fillRect(0, y, labelW, h);

        // Label du signal
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(name, 5, y + h / 2 + 4);

        // Fond du signal
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(labelW, y, Math.max(0, waveW), h);

        // Bordure
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;
        ctx.strokeRect(labelW, y, Math.max(0, waveW), h);

        // Ligne séparatrice entre label et waveform
        ctx.beginPath();
        ctx.moveTo(labelW, y);
        ctx.lineTo(labelW, y + h);
        ctx.stroke();

        if (data.history.length === 0) return;

        const isMultiBit = data.width > 1;

        if (isMultiBit) {
            this.renderMultiBitSignal(ctx, data, labelW, y + padding, waveW, h - 2 * padding);
        } else {
            this.renderSingleBitSignal(ctx, data, labelW, y + padding, waveW, h - 2 * padding);
        }
    }

    renderSingleBitSignal(ctx, data, x, y, w, h) {
        ctx.beginPath();
        ctx.strokeStyle = this.colors.signal1;
        ctx.lineWidth = 2;

        let lastX = x;
        let lastY = y + h; // Default low

        for (let i = 0; i < data.history.length; i++) {
            const entry = data.history[i];
            const cx = x + (entry.cycle * this.cycleWidth) - this.scrollX;
            if (cx < x - this.cycleWidth || cx > x + w + this.cycleWidth) continue;

            const newY = entry.value ? y : y + h;

            if (i === 0) {
                ctx.moveTo(cx, newY);
            } else {
                // Transition verticale
                if (newY !== lastY) {
                    ctx.lineTo(cx, lastY);
                    ctx.lineTo(cx, newY);
                }
                ctx.lineTo(cx + this.cycleWidth, newY);
            }

            lastX = cx + this.cycleWidth;
            lastY = newY;
        }

        ctx.stroke();
    }

    renderMultiBitSignal(ctx, data, x, y, w, h) {
        const midY = y + h / 2;

        for (let i = 0; i < data.history.length; i++) {
            const entry = data.history[i];
            const cx = x + (entry.cycle * this.cycleWidth) - this.scrollX;
            if (cx < x - this.cycleWidth * 2 || cx > x + w + this.cycleWidth) continue;

            const nextEntry = data.history[i + 1];
            const endX = nextEntry
                ? x + (nextEntry.cycle * this.cycleWidth) - this.scrollX
                : cx + this.cycleWidth;

            // Rectangle pour la valeur
            ctx.fillStyle = this.colors.signalMulti + '40';
            ctx.beginPath();
            ctx.moveTo(cx + 3, y);
            ctx.lineTo(endX - 3, y);
            ctx.lineTo(endX, midY);
            ctx.lineTo(endX - 3, y + h);
            ctx.lineTo(cx + 3, y + h);
            ctx.lineTo(cx, midY);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = this.colors.signalMulti;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Valeur hex au centre
            const valueStr = '0x' + entry.value.toString(16).toUpperCase();
            const boxW = endX - cx;
            if (boxW > 30) {
                ctx.fillStyle = this.colors.text;
                ctx.font = '9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(valueStr, (cx + endX) / 2, midY + 3);
            }
        }
    }

    renderCurrentCycle(ctx, x, y, w, h) {
        const cx = x + (this.currentCycle * this.cycleWidth) - this.scrollX;
        if (cx < x || cx > x + w) return;

        ctx.strokeStyle = this.colors.highlight;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, y);
        ctx.lineTo(cx, y + h);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * Scroll vers le cycle actuel
     */
    scrollToCurrent() {
        const targetX = this.currentCycle * this.cycleWidth - this.width / 2;
        this.scrollX = Math.max(0, targetX);
    }
}

/**
 * Crée et attache un visualiseur de chronogramme
 */
export function createWaveformVisualizer(container, options = {}) {
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const visualizer = new WaveformVisualizer(canvas, options);

    const resizeObserver = new ResizeObserver(() => {
        visualizer.resize();
        visualizer.render();
    });
    resizeObserver.observe(container);

    return visualizer;
}
