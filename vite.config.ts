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
      "@types": path.resolve(__dirname, "./src/types"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@hooks": path.resolve(__dirname, "./src/lib/hooks"),
      "@utils": path.resolve(__dirname, "./src/lib/utils"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@config": path.resolve(__dirname, "./src/shared/config"),
      "@ui": path.resolve(__dirname, "./src/shared/ui"),
      "@layout": path.resolve(__dirname, "./src/layout"),
      "@components": path.resolve(__dirname, "./src/components"),
    },
  },

  build: {
    outDir: "dist",
    sourcemap: false,
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,

    // ⭐ IMPORTANT: Tell Vite to build BOTH index.html and popup.html
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        popup: path.resolve(__dirname, "popup.html"),
        // (OR: "public/popup.html" if you placed it in /public)
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@mui/x-data-grid', '@emotion/react', '@emotion/styled'],
        },
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
