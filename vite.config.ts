import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean,
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Important for Electron: set base to relative paths
  base: "./",
  build: {
    // Electron needs relative paths, not absolute
    outDir: "dist",
    // Make sure assets are properly referenced
    assetsDir: "assets",
  },
}));
