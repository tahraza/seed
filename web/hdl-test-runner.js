/**
 * HDL Test Runner - Exécute les fichiers de test .tst
 * Affiche les résultats avec erreurs détaillées en français
 */

/**
 * Résultat d'un test
 */
export class TestResult {
    constructor() {
        this.passed = true;
        this.totalChecks = 0;
        this.passedChecks = 0;
        this.failures = [];
        this.error = null;
    }

    addFailure(failure) {
        this.passed = false;
        this.failures.push(failure);
    }

    get summary() {
        if (this.error) {
            return `❌ Erreur: ${this.error}`;
        }
        if (this.passed) {
            return `✅ ${this.passedChecks}/${this.totalChecks} vérifications réussies`;
        }
        return `❌ ${this.passedChecks}/${this.totalChecks} vérifications réussies (${this.failures.length} échec(s))`;
    }
}

/**
 * Détail d'un échec de test
 */
export class TestFailure {
    constructor(lineNumber, signal, expected, actual, inputs) {
        this.lineNumber = lineNumber;
        this.signal = signal;
        this.expected = expected;
        this.actual = actual;
        this.inputs = inputs || {};
    }

    /**
     * Formate l'échec pour affichage texte
     */
    format() {
        let s = `  ❌ Ligne ${this.lineNumber}: Signal '${this.signal}'\n`;
        s += `     Attendu : ${this.expected}\n`;
        s += `     Obtenu  : ${this.actual}\n`;
        if (Object.keys(this.inputs).length > 0) {
            s += `     Entrées :\n`;
            const sortedKeys = Object.keys(this.inputs).sort();
            for (const name of sortedKeys) {
                s += `       ${name} = ${this.inputs[name]}\n`;
            }
        }
        return s;
    }

    /**
     * Formate l'échec pour affichage HTML
     */
    formatHtml() {
        let html = `<div class="test-failure">`;
        html += `<div class="failure-header">❌ Ligne ${this.lineNumber} : Signal <code>${this.signal}</code></div>`;
        html += `<div class="failure-row"><span class="failure-label">Attendu :</span> <code class="expected">${this.expected}</code></div>`;
        html += `<div class="failure-row"><span class="failure-label">Obtenu :</span> <code class="actual">${this.actual}</code></div>`;

        if (Object.keys(this.inputs).length > 0) {
            html += `<div class="failure-inputs"><span class="failure-label">Entrées :</span><ul>`;
            const sortedKeys = Object.keys(this.inputs).sort();
            for (const name of sortedKeys) {
                html += `<li><code>${name}</code> = <code>${this.inputs[name]}</code></li>`;
            }
            html += `</ul></div>`;
        }
        html += `</div>`;
        return html;
    }
}

/**
 * Parse un script de test .tst
 * @param {string} script - Contenu du fichier .tst
 * @returns {Object} { chipName, commands: [{lineNumber, type, ...}] }
 */
export function parseTestScript(script) {
    const commands = [];
    let chipName = '';

    const lines = script.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const lineNumber = i + 1;
        const line = lines[i].trim();

        // Ignorer les lignes vides et commentaires
        if (!line || line.startsWith('//') || line.startsWith('#')) {
            continue;
        }

        const parts = line.split(/\s+/);
        if (parts.length === 0) continue;

        const cmd = parts[0].toLowerCase();

        switch (cmd) {
            case 'load':
                if (parts.length >= 2) {
                    chipName = parts[1];
                }
                break;

            case 'set':
                if (parts.length >= 3) {
                    commands.push({
                        lineNumber,
                        type: 'set',
                        signal: parts[1],
                        value: parts[2]
                    });
                }
                break;

            case 'eval':
                commands.push({ lineNumber, type: 'eval' });
                break;

            case 'tick':
                commands.push({ lineNumber, type: 'tick' });
                break;

            case 'tock':
                commands.push({ lineNumber, type: 'tock' });
                break;

            case 'expect':
                if (parts.length >= 3) {
                    commands.push({
                        lineNumber,
                        type: 'expect',
                        signal: parts[1],
                        value: parts[2]
                    });
                }
                break;
        }
    }

    return { chipName, commands };
}

/**
 * Parse une valeur (binaire, hex, décimal)
 * @param {string} input - Valeur à parser
 * @returns {string} Valeur normalisée en binaire "0b..."
 */
export function parseValue(input) {
    const t = input.trim();

    // Binaire
    if (t.startsWith('0b') || t.startsWith('0B')) {
        return t;
    }

    // Hexadécimal -> binaire
    if (t.startsWith('0x') || t.startsWith('0X')) {
        const hex = t.substring(2);
        const num = parseInt(hex, 16);
        const bits = num.toString(2);
        return '0b' + bits.padStart(hex.length * 4, '0');
    }

    // Décimal simple (0 ou 1)
    if (t === '0' || t === '1') {
        return t;
    }

    // Décimal général
    const num = parseInt(t, 10);
    if (!isNaN(num)) {
        return '0b' + (num >>> 0).toString(2);
    }

    return t;
}

/**
 * Compare deux valeurs (normalisées)
 */
function valuesEqual(expected, actual) {
    // Normaliser les deux valeurs
    const exp = normalizeValue(expected);
    const act = normalizeValue(actual);
    return exp === act;
}

/**
 * Normalise une valeur pour comparaison
 */
function normalizeValue(val) {
    if (typeof val !== 'string') {
        val = String(val);
    }

    // Enlever le préfixe 0b
    if (val.startsWith('0b') || val.startsWith('0B')) {
        val = val.substring(2);
    }
    // Convertir hex en décimal
    if (val.startsWith('0x') || val.startsWith('0X')) {
        return parseInt(val, 16);
    }

    // Convertir binaire en décimal
    if (/^[01]+$/.test(val)) {
        return parseInt(val, 2);
    }

    return parseInt(val, 10);
}

/**
 * Exécute un test sur un simulateur HDL
 * @param {Object} hdlSim - Instance du simulateur HDL WASM
 * @param {string} testScript - Contenu du fichier .tst
 * @returns {TestResult}
 */
export function runTest(hdlSim, testScript) {
    const result = new TestResult();

    try {
        const { chipName, commands } = parseTestScript(testScript);
        const currentInputs = {};

        for (const cmd of commands) {
            switch (cmd.type) {
                case 'set':
                    try {
                        hdlSim.set_signal(cmd.signal, parseValue(cmd.value));
                        currentInputs[cmd.signal] = cmd.value;
                    } catch (e) {
                        result.error = `Ligne ${cmd.lineNumber}: Impossible de définir '${cmd.signal}': ${e}`;
                        return result;
                    }
                    break;

                case 'eval':
                    try {
                        hdlSim.eval();
                    } catch (e) {
                        // Ignorer si eval n'est pas supporté (circuit combinatoire)
                    }
                    break;

                case 'tick':
                    try {
                        hdlSim.tick();
                    } catch (e) {
                        result.error = `Ligne ${cmd.lineNumber}: Erreur tick: ${e}`;
                        return result;
                    }
                    break;

                case 'tock':
                    try {
                        hdlSim.tock();
                    } catch (e) {
                        result.error = `Ligne ${cmd.lineNumber}: Erreur tock: ${e}`;
                        return result;
                    }
                    break;

                case 'expect':
                    result.totalChecks++;
                    try {
                        const actual = hdlSim.get_signal(cmd.signal);
                        const expected = cmd.value;

                        if (valuesEqual(expected, actual)) {
                            result.passedChecks++;
                        } else {
                            result.addFailure(new TestFailure(
                                cmd.lineNumber,
                                cmd.signal,
                                expected,
                                actual,
                                { ...currentInputs }
                            ));
                        }
                    } catch (e) {
                        result.addFailure(new TestFailure(
                            cmd.lineNumber,
                            cmd.signal,
                            cmd.value,
                            `Erreur: ${e}`,
                            { ...currentInputs }
                        ));
                    }
                    break;
            }
        }
    } catch (e) {
        result.error = `Erreur de parsing: ${e}`;
    }

    return result;
}

/**
 * Génère le HTML pour afficher les résultats de test
 */
export function renderTestResults(result, chipName = '') {
    let html = `<div class="test-results">`;

    // En-tête
    html += `<div class="test-header">`;
    if (chipName) {
        html += `<span class="test-chip-name">Test: ${chipName}</span>`;
    }
    html += `<span class="test-summary ${result.passed ? 'passed' : 'failed'}">${result.summary}</span>`;
    html += `</div>`;

    // Erreur globale
    if (result.error) {
        html += `<div class="test-error">${result.error}</div>`;
    }

    // Détails des échecs
    if (result.failures.length > 0) {
        html += `<div class="test-failures">`;
        html += `<div class="failures-header">Échecs détaillés :</div>`;
        for (const failure of result.failures) {
            html += failure.formatHtml();
        }
        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

/**
 * Tests prédéfinis pour chaque chip
 */
export const CHIP_TESTS = {
    'Inv': `load Inv
set a 0
eval
expect y 1
set a 1
eval
expect y 0`,

    'And2': `load And2
set a 0
set b 0
eval
expect y 0
set a 0
set b 1
eval
expect y 0
set a 1
set b 0
eval
expect y 0
set a 1
set b 1
eval
expect y 1`,

    'Or2': `load Or2
set a 0
set b 0
eval
expect y 0
set a 0
set b 1
eval
expect y 1
set a 1
set b 0
eval
expect y 1
set a 1
set b 1
eval
expect y 1`,

    'Xor2': `load Xor2
set a 0
set b 0
eval
expect y 0
set a 0
set b 1
eval
expect y 1
set a 1
set b 0
eval
expect y 1
set a 1
set b 1
eval
expect y 0`,

    'Mux': `load Mux
set a 0
set b 1
set sel 0
eval
expect y 0
set sel 1
eval
expect y 1
set a 1
set b 0
set sel 0
eval
expect y 1
set sel 1
eval
expect y 0`,

    'DMux': `load DMux
set in 0
set sel 0
eval
expect a 0
expect b 0
set in 1
set sel 0
eval
expect a 1
expect b 0
set sel 1
eval
expect a 0
expect b 1`,

    'HalfAdder': `load HalfAdder
set a 0
set b 0
eval
expect sum 0
expect carry 0
set a 0
set b 1
eval
expect sum 1
expect carry 0
set a 1
set b 0
eval
expect sum 1
expect carry 0
set a 1
set b 1
eval
expect sum 0
expect carry 1`,

    'FullAdder': `load FullAdder
set a 0
set b 0
set c 0
eval
expect sum 0
expect carry 0
set a 1
set b 1
set c 0
eval
expect sum 0
expect carry 1
set a 1
set b 1
set c 1
eval
expect sum 1
expect carry 1`,
};

// Alias pour compatibilité
export { runTest as executeTest };
