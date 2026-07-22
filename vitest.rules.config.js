import { defineConfig } from "vitest/config";

// Firestore rules tests talk to a single shared emulator, so they must not run
// in parallel across files. Kept separate from the main Vitest project because
// they require the emulator (launched by `npm run test:rules`).
export default defineConfig({
  test: {
    include: ["test-rules/**/*.test.js"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    fileParallelism: false
  }
});
