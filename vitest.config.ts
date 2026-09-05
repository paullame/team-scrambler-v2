import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import deno from "@deno/vite-plugin";

export default defineConfig({
  plugins: [react(), deno()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/components/**/*.test.tsx", "src/**/*.vitest.tsx"],
  },
});
