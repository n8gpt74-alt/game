import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          three: ["three", "three/addons/loaders/GLTFLoader.js"]
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173
  }
});
