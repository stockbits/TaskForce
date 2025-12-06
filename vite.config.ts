import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

/* =====================================================
   ESM-safe __dirname Replacement
===================================================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =====================================================
   Vite Multi-Page App Support (Main + Popup)
===================================================== */
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@config": path.resolve(__dirname, "./src/config"),
      "@containers": path.resolve(__dirname, "./src/A-Navigation_Container"),
      "@components": path.resolve(__dirname, "./src/components"),
    },
  },

  build: {
    outDir: "dist",
    sourcemap: false,
    emptyOutDir: true,

    // ⭐ IMPORTANT: Tell Vite to build BOTH index.html and popup.html
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        popup: path.resolve(__dirname, "popup.html"),
        // (OR: "public/popup.html" if you placed it in /public)
      },
    },
  },

  server: {
    port: 5173,
    open: true,
    strictPort: true,
  },

  optimizeDeps: {
    include: ["react", "react-dom"],
  },
});
