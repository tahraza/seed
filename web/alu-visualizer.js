/**
 * ALU Visualizer - Animation des opérations ALU
 * Montre le flux de données à travers l'ALU avec les valeurs
 */

export class ALUVisualizer {
    constructor(container, options = {}) {
        this.container = container;

        // État actuel
        this.inputA = 0;
        this.inputB = 0;
        this.operation = 'ADD';
        this.result = 0;
        this.flags = { n: false, z: false, c: false, v: false };

        // Animation
        this.animating = false;
        this.animationDuration = options.animationDuration || 500;

        // Opérations disponibles
        this.operations = {
            'AND': { symbol: '&', color: '#4a90d9' },
            'EOR': { symbol: '^', color: '#9b59b6' },
            'SUB': { symbol: '-', color: '#e74c3c' },
            'ADD': { symbol: '+', color: '#2ecc71' },
            'ORR': { symbol: '|', color: '#f39c12' },
            'MOV': { symbol: '→', color: '#3498db' },
            'MVN': { symbol: '~', color: '#95a5a6' },
            'CMP': { symbol: '?', color: '#e67e22' },
        };

        this.render();
    }

    /**
     * Met à jour les entrées de l'ALU
     */
    setInputs(a, b) {
        this.inputA = a;
        this.inputB = b;
        this.updateDisplay();
    }

    /**
     * Met à jour l'opération
     */
    setOperation(op) {
        this.operation = op.toUpperCase();
        this.updateDisplay();
    }

    /**
     * Met à jour le résultat et les flags
     */
    setResult(result, flags) {
        this.result = result;
        this.flags = flags || { n: false, z: false, c: false, v: false };
        this.updateDisplay();
    }

    /**
     * Anime une opération complète
     */
    animate(a, b, op, result, flags) {
        if (this.animating) return Promise.resolve();

        return new Promise((resolve) => {
            this.animating = true;
            this.inputA = a;
            this.inputB = b;
            this.operation = op.toUpperCase();

            // Phase 1: Afficher les entrées
            this.updateDisplay();
            this.highlightInputs();

            setTimeout(() => {
                // Phase 2: Afficher l'opération
                this.highlightOperation();

                setTimeout(() => {
                    // Phase 3: Afficher le résultat
                    this.result = result;
                    this.flags = flags || { n: false, z: false, c: false, v: false };
                    this.highlightResult();
                    this.updateDisplay();

                    setTimeout(() => {
                        this.clearHighlights();
                        this.animating = false;
                        resolve();
                    }, this.animationDuration / 3);

                }, this.animationDuration / 3);

            }, this.animationDuration / 3);
        });
    }

    /**
     * Rendu principal
     */
    render() {
        const opColor = this.operations[this.operation]?.color || '#888';

        this.container.innerHTML = `
            <svg class="alu-svg" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7"
                            refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#666"/>
                    </marker>
                    <linearGradient id="aluGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#2a2a4e"/>
                        <stop offset="100%" style="stop-color:#1a1a2e"/>
                    </linearGradient>
                </defs>

                <!-- Fils d'entrée A -->
                <g class="wire wire-a">
                    <path d="M 50 40 L 100 40 L 100 70" stroke="#666" stroke-width="2" fill="none"/>
                    <text x="30" y="45" class="label">A</text>
                </g>

                <!-- Fils d'entrée B -->
                <g class="wire wire-b">
                    <path d="M 250 40 L 200 40 L 200 70" stroke="#666" stroke-width="2" fill="none"/>
                    <text x="260" y="45" class="label">B</text>
                </g>

                <!-- Valeur A -->
                <g class="value value-a">
                    <rect x="10" y="25" width="60" height="25" rx="3" fill="#0f3460"/>
                    <text x="40" y="43" class="value-text" text-anchor="middle">0x00000000</text>
                </g>

                <!-- Valeur B -->
                <g class="value value-b">
                    <rect x="230" y="25" width="60" height="25" rx="3" fill="#0f3460"/>
                    <text x="260" y="43" class="value-text" text-anchor="middle">0x00000000</text>
                </g>

                <!-- Corps de l'ALU (trapèze) -->
                <g class="alu-body">
                    <path d="M 80 70 L 220 70 L 200 140 L 100 140 Z"
                          fill="url(#aluGrad)" stroke="#4a90d9" stroke-width="2"/>

                    <!-- Symbole de l'opération -->
                    <text x="150" y="95" class="op-symbol" text-anchor="middle"
                          font-size="24" fill="${opColor}">+</text>
                    <text x="150" y="115" class="op-name" text-anchor="middle"
                          font-size="10" fill="#888">ADD</text>
                </g>

                <!-- Fil de sortie -->
                <g class="wire wire-out">
                    <path d="M 150 140 L 150 170" stroke="#666" stroke-width="2" fill="none"
                          marker-end="url(#arrowhead)"/>
                    <text x="135" y="165" class="label">Out</text>
                </g>

                <!-- Valeur de sortie -->
                <g class="value value-out">
                    <rect x="100" y="172" width="100" height="25" rx="3" fill="#0f3460"/>
                    <text x="150" y="190" class="value-text" text-anchor="middle">0x00000000</text>
                </g>

                <!-- Flags -->
                <g class="flags" transform="translate(230, 105)">
                    <text x="0" y="0" class="flag-label" font-size="9" fill="#666">Flags:</text>
                    <g class="flag flag-n" transform="translate(0, 12)">
                        <rect x="0" y="0" width="14" height="14" rx="2" fill="#1a1a2e" stroke="#444"/>
                        <text x="7" y="11" text-anchor="middle" font-size="10" fill="#888">N</text>
                    </g>
                    <g class="flag flag-z" transform="translate(18, 12)">
                        <rect x="0" y="0" width="14" height="14" rx="2" fill="#1a1a2e" stroke="#444"/>
                        <text x="7" y="11" text-anchor="middle" font-size="10" fill="#888">Z</text>
                    </g>
                    <g class="flag flag-c" transform="translate(36, 12)">
                        <rect x="0" y="0" width="14" height="14" rx="2" fill="#1a1a2e" stroke="#444"/>
                        <text x="7" y="11" text-anchor="middle" font-size="10" fill="#888">C</text>
                    </g>
                    <g class="flag flag-v" transform="translate(54, 12)">
                        <rect x="0" y="0" width="14" height="14" rx="2" fill="#1a1a2e" stroke="#444"/>
                        <text x="7" y="11" text-anchor="middle" font-size="10" fill="#888">V</text>
                    </g>
                </g>
            </svg>
        `;

        this.updateDisplay();
    }

    /**
     * Met à jour l'affichage des valeurs
     */
    updateDisplay() {
        const svg = this.container.querySelector('.alu-svg');
        if (!svg) return;

        // Valeurs d'entrée
        const valueA = svg.querySelector('.value-a text');
        const valueB = svg.querySelector('.value-b text');
        if (valueA) valueA.textContent = this.formatValue(this.inputA);
        if (valueB) valueB.textContent = this.formatValue(this.inputB);

        // Valeur de sortie
        const valueOut = svg.querySelector('.value-out text');
        if (valueOut) valueOut.textContent = this.formatValue(this.result);

        // Opération
        const opInfo = this.operations[this.operation] || { symbol: '?', color: '#888' };
        const opSymbol = svg.querySelector('.op-symbol');
        const opName = svg.querySelector('.op-name');
        if (opSymbol) {
            opSymbol.textContent = opInfo.symbol;
            opSymbol.setAttribute('fill', opInfo.color);
        }
        if (opName) opName.textContent = this.operation;

        // Flags
        this.updateFlag(svg, 'n', this.flags.n);
        this.updateFlag(svg, 'z', this.flags.z);
        this.updateFlag(svg, 'c', this.flags.c);
        this.updateFlag(svg, 'v', this.flags.v);
    }

    updateFlag(svg, flag, value) {
        const flagEl = svg.querySelector(`.flag-${flag} rect`);
        const flagText = svg.querySelector(`.flag-${flag} text`);
        if (flagEl) {
            flagEl.setAttribute('fill', value ? '#2ecc71' : '#1a1a2e');
            flagEl.setAttribute('stroke', value ? '#2ecc71' : '#444');
        }
        if (flagText) {
            flagText.setAttribute('fill', value ? '#fff' : '#888');
        }
    }

    formatValue(value) {
        if (value === undefined || value === null) return '0x--------';
        const hex = (value >>> 0).toString(16).toUpperCase().padStart(8, '0');
        return '0x' + hex;
    }

    highlightInputs() {
        const svg = this.container.querySelector('.alu-svg');
        if (!svg) return;

        svg.querySelectorAll('.wire-a, .wire-b').forEach(el => {
            el.classList.add('flowing');
        });
        svg.querySelectorAll('.value-a rect, .value-b rect').forEach(el => {
            el.setAttribute('fill', '#1a4a7a');
        });
    }

    highlightOperation() {
        const svg = this.container.querySelector('.alu-svg');
        if (!svg) return;

        svg.querySelector('.alu-body path')?.setAttribute('stroke', '#f0ad4e');
        svg.querySelector('.op-symbol')?.classList.add('pulsing');
    }

    highlightResult() {
        const svg = this.container.querySelector('.alu-svg');
        if (!svg) return;

        svg.querySelector('.wire-out')?.classList.add('flowing');
        svg.querySelector('.value-out rect')?.setAttribute('fill', '#1a5a3a');
    }

    clearHighlights() {
        const svg = this.container.querySelector('.alu-svg');
        if (!svg) return;

        svg.querySelectorAll('.flowing').forEach(el => el.classList.remove('flowing'));
        svg.querySelectorAll('.pulsing').forEach(el => el.classList.remove('pulsing'));
        svg.querySelectorAll('.value rect').forEach(el => el.setAttribute('fill', '#0f3460'));
        svg.querySelector('.alu-body path')?.setAttribute('stroke', '#4a90d9');
    }
}

/**
 * Crée et attache un visualiseur d'ALU
 */
export function createALUVisualizer(container, options = {}) {
    return new ALUVisualizer(container, options);
}

// Styles additionnels
const style = document.createElement('style');
style.textContent = `
    .alu-svg {
        width: 100%;
        height: 100%;
    }

    .alu-svg .label {
        fill: #888;
        font-family: monospace;
        font-size: 12px;
    }

    .alu-svg .value-text {
        fill: #e0e0e0;
        font-family: monospace;
        font-size: 10px;
    }

    .alu-svg .flowing path {
        stroke: #4a90d9;
        stroke-dasharray: 5, 5;
        animation: flowAnimation 0.5s linear infinite;
    }

    .alu-svg .pulsing {
        animation: pulseAnimation 0.3s ease-in-out infinite alternate;
    }

    @keyframes flowAnimation {
        0% { stroke-dashoffset: 20; }
        100% { stroke-dashoffset: 0; }
    }

    @keyframes pulseAnimation {
        0% { transform: scale(1); }
        100% { transform: scale(1.2); }
    }
`;
document.head.appendChild(style);
