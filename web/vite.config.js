import { defineConfig } from "vite";

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
});
