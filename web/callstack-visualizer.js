/**
 * Call Stack Visualizer - Visualisation de la pile d'appels
 * Affiche les frames avec animation push/pop
 */

export class CallStackVisualizer {
    constructor(container, options = {}) {
        this.container = container;
        this.frames = [];
        this.maxFrames = options.maxFrames || 50;
        this.symbolTable = options.symbolTable || {}; // addr -> name mapping

        // Animation state
        this.animating = false;

        // Créer la structure HTML
        this.render();
    }

    /**
     * Met à jour la table des symboles (pour afficher les noms de fonctions)
     */
    setSymbolTable(symbols) {
        this.symbolTable = symbols;
        this.renderFrames();
    }

    /**
     * Ajoute une entrée à la table des symboles
     */
    addSymbol(addr, name) {
        this.symbolTable[addr] = name;
    }

    /**
     * Traite un événement d'appel
     */
    onCall(target, returnAddr) {
        const frame = {
            target,
            returnAddr,
            name: this.getFunctionName(target),
            id: Date.now(),
        };

        this.frames.push(frame);

        // Limiter la profondeur
        if (this.frames.length > this.maxFrames) {
            this.frames.shift();
        }

        this.animatePush(frame);
    }

    /**
     * Traite un événement de retour
     */
    onReturn(toAddr) {
        if (this.frames.length === 0) return;

        const frame = this.frames.pop();
        this.animatePop(frame);
    }

    /**
     * Réinitialise la pile
     */
    reset() {
        this.frames = [];
        this.renderFrames();
    }

    /**
     * Obtient le nom de fonction pour une adresse
     */
    getFunctionName(addr) {
        if (this.symbolTable[addr]) {
            return this.symbolTable[addr];
        }
        // Chercher le symbole le plus proche en dessous
        let closest = null;
        let closestDist = Infinity;
        for (const [symAddr, name] of Object.entries(this.symbolTable)) {
            const a = parseInt(symAddr);
            if (a <= addr && addr - a < closestDist) {
                closest = name;
                closestDist = addr - a;
            }
        }
        if (closest && closestDist < 0x1000) {
            return closestDist > 0 ? `${closest}+0x${closestDist.toString(16)}` : closest;
        }
        return `0x${addr.toString(16).padStart(8, '0')}`;
    }

    /**
     * Animation d'empilement
     */
    animatePush(frame) {
        this.renderFrames();
        const frameEl = this.container.querySelector(`[data-frame-id="${frame.id}"]`);
        if (frameEl) {
            frameEl.classList.add('pushing');
            setTimeout(() => frameEl.classList.remove('pushing'), 300);
        }
    }

    /**
     * Animation de dépilement
     */
    animatePop(frame) {
        const frameEl = this.container.querySelector(`[data-frame-id="${frame.id}"]`);
        if (frameEl) {
            frameEl.classList.add('popping');
            setTimeout(() => {
                this.renderFrames();
            }, 200);
        } else {
            this.renderFrames();
        }
    }

    /**
     * Rendu initial
     */
    render() {
        this.container.innerHTML = `
            <div class="callstack-frames"></div>
        `;
        this.framesContainer = this.container.querySelector('.callstack-frames');
        this.renderFrames();
    }

    /**
     * Rendu des frames
     */
    renderFrames() {
        if (!this.framesContainer) return;

        if (this.frames.length === 0) {
            this.framesContainer.innerHTML = `
                <div class="callstack-empty">
                    (pile vide)
                </div>
            `;
            return;
        }

        // Afficher les frames (plus récent en haut)
        const html = this.frames.slice().reverse().map((frame, i) => {
            const isCurrent = i === 0;
            return `
                <div class="callstack-frame ${isCurrent ? 'current' : ''}"
                     data-frame-id="${frame.id}">
                    <span class="callstack-frame-icon">${isCurrent ? '▶' : '│'}</span>
                    <span class="callstack-frame-name">${this.escapeHtml(frame.name)}</span>
                    <span class="callstack-frame-addr">@ 0x${frame.target.toString(16)}</span>
                </div>
            `;
        }).join('');

        this.framesContainer.innerHTML = html;
    }

    /**
     * Escape HTML pour éviter les injections
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Obtient la profondeur actuelle de la pile
     */
    getDepth() {
        return this.frames.length;
    }

    /**
     * Obtient le frame actuel (sommet de pile)
     */
    getCurrentFrame() {
        return this.frames.length > 0 ? this.frames[this.frames.length - 1] : null;
    }
}

/**
 * Crée et attache un visualiseur de pile d'appels
 */
export function createCallStackVisualizer(container, options = {}) {
    return new CallStackVisualizer(container, options);
}

// Styles pour les animations
const style = document.createElement('style');
style.textContent = `
    .callstack-frame.pushing {
        animation: slideIn 0.3s ease-out;
    }

    .callstack-frame.popping {
        animation: slideOut 0.2s ease-in forwards;
    }

    @keyframes slideIn {
        from {
            transform: translateX(-20px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(20px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
