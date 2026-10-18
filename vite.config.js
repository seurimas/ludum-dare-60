import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { printSnapshots } from "./printSnapshots.js";

export default defineConfig({
  plugins: [printSnapshots(fileURLToPath(new URL(".", import.meta.url)))],
});
