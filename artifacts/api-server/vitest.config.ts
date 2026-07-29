import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Run tests sequentially to avoid DB race conditions
    singleThread: true,
    fileParallelism: false,
  },
});
