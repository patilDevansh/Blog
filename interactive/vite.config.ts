import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@schema": resolve(__dirname, "src/schema"),
      "@runtime": resolve(__dirname, "src/runtime"),
      "@widgets": resolve(__dirname, "src/widgets"),
    },
  },
  publicDir: "public",
});
