/**
 * Memory Visualizer - Carte mémoire colorée avec régions
 * Affiche code/data/stack/heap avec highlighting des accès
 */

export class MemoryVisualizer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ramSize = options.ramSize || 0x100000; // 1MB default

        // Régions mémoire (configurables)
        this.regions = {
            code:   { start: 0x00000000, end: 0x00010000, color: '#4a90d9', name: 'Code' },
            data:   { start: 0x00010000, end: 0x00020000, color: '#5cb85c', name: 'Data' },
            heap:   { start: 0x00020000, end: 0x00080000, color: '#f0ad4e', name: 'Heap' },
            stack:  { start: 0x00080000, end: 0x00100000, color: '#d9534f', name: 'Stack' },
            screen: { start: 0x00400000, end: 0x00402580, color: '#9b59b6', name: 'Screen' },
        };

        // Accès récents (pour animation)
        this.recentAccesses = [];
        this.maxRecentAccesses = 50;

        // PC et SP actuels
        this.pc = 0;
        this.sp = this.ramSize;

        // Configuration d'affichage
        this.showLegend = options.showLegend !== false;
        this.showAddresses = options.showAddresses !== false;
        this.compactMode = options.compactMode || false;

        // Initialiser le canvas
        this.resize();
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

    setRamSize(size) {
        this.ramSize = size;
        // Ajuster les régions stack/heap
        this.regions.stack.end = size;
        this.regions.stack.start = Math.max(size - 0x80000, this.regions.heap.end);
    }

    updatePC(pc) {
        this.pc = pc;
    }

    updateSP(sp) {
        this.sp = sp;
    }

    addAccess(addr, size, isWrite) {
        this.recentAccesses.push({
            addr,
            size,
            isWrite,
            time: Date.now()
        });

        // Limiter le nombre d'accès stockés
        if (this.recentAccesses.length > this.maxRecentAccesses) {
            this.recentAccesses.shift();
        }
    }

    clearAccesses() {
        this.recentAccesses = [];
    }

    getRegionForAddr(addr) {
        for (const [name, region] of Object.entries(this.regions)) {
            if (addr >= region.start && addr < region.end) {
                return { name, ...region };
            }
        }
        return null;
    }

    render() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // Clear
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);

        const legendHeight = this.showLegend ? 30 : 0;
        const mapHeight = h - legendHeight - 10;
        const mapY = 5;
        const mapX = this.showAddresses ? 60 : 10;
        const mapWidth = w - mapX - 10;

        // Dessiner la carte mémoire
        this.renderMemoryMap(ctx, mapX, mapY, mapWidth, mapHeight);

        // Dessiner la légende
        if (this.showLegend) {
            this.renderLegend(ctx, 10, h - legendHeight + 5, w - 20, legendHeight - 10);
        }

        // Dessiner les adresses
        if (this.showAddresses) {
            this.renderAddresses(ctx, 5, mapY, 50, mapHeight);
        }
    }

    renderMemoryMap(ctx, x, y, w, h) {
        // Calculer les proportions
        const totalMem = this.ramSize;

        // Dessiner les régions
        for (const [name, region] of Object.entries(this.regions)) {
            if (region.end > totalMem) continue;

            const startY = y + (region.start / totalMem) * h;
            const endY = y + (region.end / totalMem) * h;
            const regionH = endY - startY;

            if (regionH < 1) continue;

            // Fond de la région
            ctx.fillStyle = region.color + '40'; // Semi-transparent
            ctx.fillRect(x, startY, w, regionH);

            // Bordure
            ctx.strokeStyle = region.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(x, startY, w, regionH);

            // Nom de la région (si assez grand)
            if (regionH > 15) {
                ctx.fillStyle = region.color;
                ctx.font = '11px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(region.name, x + w / 2, startY + regionH / 2 + 4);
            }
        }

        // Dessiner les accès récents
        const now = Date.now();
        for (const access of this.recentAccesses) {
            const age = now - access.time;
            if (age > 2000) continue; // Fade après 2s

            const alpha = Math.max(0, 1 - age / 2000);
            const accessY = y + (access.addr / totalMem) * h;

            // Couleur selon type d'accès
            const color = access.isWrite ? `rgba(255, 100, 100, ${alpha})` : `rgba(100, 255, 100, ${alpha})`;

            ctx.fillStyle = color;
            ctx.fillRect(x, accessY - 1, w, 3);

            // Indicateur de taille
            if (access.size > 1) {
                const accessH = (access.size / totalMem) * h;
                ctx.fillStyle = color;
                ctx.fillRect(x + w - 5, accessY, 5, Math.max(2, accessH));
            }
        }

        // Dessiner le PC (indicateur bleu)
        if (this.pc < totalMem) {
            const pcY = y + (this.pc / totalMem) * h;
            ctx.fillStyle = '#00bfff';
            ctx.beginPath();
            ctx.moveTo(x - 8, pcY);
            ctx.lineTo(x, pcY - 4);
            ctx.lineTo(x, pcY + 4);
            ctx.closePath();
            ctx.fill();

            // Label PC
            ctx.fillStyle = '#00bfff';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'right';
            ctx.fillText('PC', x - 10, pcY + 3);
        }

        // Dessiner le SP (indicateur rouge)
        if (this.sp < totalMem) {
            const spY = y + (this.sp / totalMem) * h;
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.moveTo(x + w + 8, spY);
            ctx.lineTo(x + w, spY - 4);
            ctx.lineTo(x + w, spY + 4);
            ctx.closePath();
            ctx.fill();

            // Label SP
            ctx.fillStyle = '#ff6b6b';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('SP', x + w + 10, spY + 3);
        }
    }

    renderLegend(ctx, x, y, w, h) {
        const items = [
            { color: '#4a90d9', label: 'Code' },
            { color: '#5cb85c', label: 'Data' },
            { color: '#f0ad4e', label: 'Heap' },
            { color: '#d9534f', label: 'Stack' },
            { color: '#00ff00', label: 'Read' },
            { color: '#ff6464', label: 'Write' },
        ];

        const itemWidth = w / items.length;

        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';

        items.forEach((item, i) => {
            const ix = x + i * itemWidth;

            // Carré de couleur
            ctx.fillStyle = item.color;
            ctx.fillRect(ix, y + 2, 12, 12);

            // Label
            ctx.fillStyle = '#ccc';
            ctx.fillText(item.label, ix + 16, y + 12);
        });
    }

    renderAddresses(ctx, x, y, w, h) {
        ctx.fillStyle = '#666';
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';

        // Afficher quelques adresses clés
        const addresses = [
            0,
            this.ramSize / 4,
            this.ramSize / 2,
            (this.ramSize * 3) / 4,
            this.ramSize
        ];

        addresses.forEach(addr => {
            const addrY = y + (addr / this.ramSize) * h;
            ctx.fillText(this.formatAddr(addr), x + w - 5, addrY + 3);
        });
    }

    formatAddr(addr) {
        if (addr >= 0x100000) {
            return (addr / 0x100000).toFixed(1) + 'M';
        } else if (addr >= 0x400) {
            return (addr / 0x400).toFixed(0) + 'K';
        }
        return '0x' + addr.toString(16);
    }
}

/**
 * Crée et attache un visualiseur mémoire à un conteneur
 */
export function createMemoryVisualizer(container, options = {}) {
    // Créer le canvas
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const visualizer = new MemoryVisualizer(canvas, options);

    // Gérer le redimensionnement
    const resizeObserver = new ResizeObserver(() => {
        visualizer.resize();
        visualizer.render();
    });
    resizeObserver.observe(container);

    return visualizer;
}
