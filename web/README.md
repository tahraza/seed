Web Harness (HDL + A32)

Prereqs:
- wasm-pack (https://rustwasm.github.io/wasm-pack/)
- Node.js + npm

Build WASM:
- npm run build:wasm

Install deps and run dev server:
- npm install
- npm run dev

Show solutions:
By default, the solution buttons (💡) are hidden to encourage students to solve
exercises on their own. To show the solution buttons, run:
- npm run dev:solutions

This is useful for instructors or for self-checking after attempting exercises.

Notes:
- The WASM build uses `--features wasm` to enable wasm-bindgen.
- The default clock is `clk`. You can override it in the UI.
- The A32 panel expects a `.a32b` binary produced by `a32_cli`.
