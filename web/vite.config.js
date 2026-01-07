import { defineConfig } from "vite";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync, readdirSync } from "fs";

// Detecter le flag --solutions dans les arguments
const showSolutions = process.argv.includes('--solutions');

if (showSolutions) {
  console.log('\n🔓 Mode SOLUTIONS active - Les boutons de solution seront visibles\n');
}

// Plugin to copy WASM files to dist
function copyWasmPlugin() {
  return {
    name: 'copy-wasm',
    closeBundle() {
      const srcDir = resolve(__dirname, 'pkg');
      const destDir = resolve(__dirname, 'dist/pkg');

      if (!existsSync(srcDir)) {
        console.warn('Warning: pkg/ directory not found. Run npm run build:wasm first.');
        return;
      }

      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }

      const files = readdirSync(srcDir);
      for (const file of files) {
        copyFileSync(resolve(srcDir, file), resolve(destDir, file));
        console.log(`Copied: pkg/${file} -> dist/pkg/${file}`);
      }
    }
  };
}

export default defineConfig({
  root: ".",
  server: {
    fs: {
      allow: [".."],
    },
  },
  build: {
    target: "es2020",
  },
  define: {
    // Injecter la variable globale dans le code
    '__SHOW_SOLUTIONS__': JSON.stringify(showSolutions),
  },
  plugins: [copyWasmPlugin()],
});
