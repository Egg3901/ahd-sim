import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { execSync } from "node:child_process";

// Release = current commit SHA, so GlitchTip events map to a commit.
let release = "unknown";
try { release = execSync("git rev-parse --short HEAD").toString().trim(); } catch { /* not a git checkout */ }

// Static SPA build. Output is plain static assets so it wraps directly in Tauri
// later with no rewrite. No SSR, no server framework.
export default defineConfig({
  plugins: [react()],
  define: {
    "import.meta.env.VITE_RELEASE": JSON.stringify(release),
  },
  resolve: {
    alias: {
      "@engine": fileURLToPath(new URL("./src/engine", import.meta.url)),
      "@content": fileURLToPath(new URL("./src/content", import.meta.url)),
      "@ui": fileURLToPath(new URL("./src/ui", import.meta.url)),
      "@persistence": fileURLToPath(new URL("./src/persistence", import.meta.url)),
      "@store": fileURLToPath(new URL("./src/store", import.meta.url)),
      "@lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Long-cache vendor chunk; app code churns, React doesn't.
        manualChunks: (id) => (id.includes("node_modules") ? "vendor" : undefined),
      },
    },
  },
  server: {
    // Dev-mode API passthrough to the campaign backend (npm run server).
    proxy: {
      "/api": `http://localhost:${process.env.CAMPAIGN_API_PORT ?? 3401}`,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "server/**/*.test.{ts,tsx}"],
  },
});
