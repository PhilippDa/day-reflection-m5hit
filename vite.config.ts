import preact from "@preact/preset-vite";
import { defineConfig } from "vitest/config";
import { serviceWorkerPlugin } from "./tools/service-worker";

export default defineConfig({
  base: "./",
  plugins: [preact(), serviceWorkerPlugin()],
  test: {
    environment: "happy-dom",
    setupFiles: ["src/test-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tools/**/*.test.ts"],
  },
});
