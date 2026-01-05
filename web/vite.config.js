import { defineConfig } from "vite";

// Detecter le flag --solutions dans les arguments
const showSolutions = process.argv.includes('--solutions');

if (showSolutions) {
  console.log('\n🔓 Mode SOLUTIONS active - Les boutons de solution seront visibles\n');
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
});
