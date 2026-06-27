import { defineConfig } from "vitest/config";
//pnpm --filter @siambox/api test
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    clearMocks: true,
  },
});