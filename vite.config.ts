import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@application": fileURLToPath(new URL("./src/application", import.meta.url)),
      "@features": fileURLToPath(new URL("./src/features", import.meta.url)),
      "@shared": fileURLToPath(new URL("./src/shared", import.meta.url)),
      "@styles": fileURLToPath(new URL("./src/styles", import.meta.url))
    }
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500
  },
  server: {
    port: 5173,
    open: true,
    strictPort: true
  }
});
