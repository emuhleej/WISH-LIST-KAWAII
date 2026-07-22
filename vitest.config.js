import { defineConfig } from "vitest/config";

// Keep Vitest to the unit tests under test/. The Playwright E2E specs live in
// e2e/ and are run separately via `npm run e2e`.
export default defineConfig({
  test: {
    include: ["test/**/*.test.js"]
  }
});
