#!/usr/bin/env node
/**
 * Script to update hdl-progression.js with external test files from hdl_tests/
 */

const fs = require('fs');
const path = require('path');

const HDL_TESTS_DIR = path.join(__dirname, '..', 'web', 'tests');
const PROGRESSION_FILE = path.join(__dirname, '..', 'web', 'hdl-progression.js');

// Map of chip names to their test file paths
const testFiles = {};

// Scan hdl_tests directory
function scanTestFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            scanTestFiles(fullPath);
        } else if (entry.name.endsWith('.tst')) {
            const chipName = entry.name.replace('.tst', '');
            testFiles[chipName] = fullPath;
        }
    }
}

// Read and format test content for JS
function readTestContent(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Remove trailing whitespace from each line, preserve structure
    return content
        .split('\n')
        .map(line => line.trimEnd())
        .join('\n')
        .trim();
}

// Update hdl-progression.js
function updateProgression() {
    let content = fs.readFileSync(PROGRESSION_FILE, 'utf8');
    let updatedCount = 0;

    for (const [chipName, testPath] of Object.entries(testFiles)) {
        const testContent = readTestContent(testPath);

        // Find and replace the test field for this chip
        // Use a simpler approach: find test: ` after the chip name and replace until closing `
        const chipStart = content.indexOf(`'${chipName}':`);
        if (chipStart === -1) {
            console.log(`  Chip ${chipName} not found in progression file`);
            continue;
        }

        // Find the test: ` within this chip definition
        const searchStart = chipStart;
        const testFieldStart = content.indexOf('test: `', searchStart);
        if (testFieldStart === -1 || testFieldStart > chipStart + 5000) {
            console.log(`  No test field found for ${chipName}`);
            continue;
        }

        // Find the closing backtick
        const testContentStart = testFieldStart + 7; // length of "test: `"
        const testContentEnd = content.indexOf('`', testContentStart);
        if (testContentEnd === -1) {
            console.log(`  No closing backtick found for ${chipName}`);
            continue;
        }

        // Replace the test content
        content = content.slice(0, testContentStart) + testContent + content.slice(testContentEnd);
        updatedCount++;
        console.log(`Updated test for ${chipName}`);
    }

    fs.writeFileSync(PROGRESSION_FILE, content);
    console.log(`\nUpdated ${updatedCount} test(s) in hdl-progression.js`);
}

// Main
console.log('Scanning hdl_tests directory...');
scanTestFiles(HDL_TESTS_DIR);
console.log(`Found ${Object.keys(testFiles).length} test files:\n`);
for (const [name, path] of Object.entries(testFiles).sort()) {
    console.log(`  ${name}: ${path.replace(HDL_TESTS_DIR, 'hdl_tests')}`);
}
console.log('\nUpdating hdl-progression.js...\n');
updateProgression();
