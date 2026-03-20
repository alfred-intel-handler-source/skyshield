import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  cacheDir: "/tmp/vite-cache",
  resolve: {
    alias: {
      "@skyshield/game": path.resolve(__dirname, "../src/game"),
    },
  },
  server: {
    port: 5173,
  },
});
