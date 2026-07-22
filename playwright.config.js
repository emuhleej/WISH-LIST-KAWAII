import { defineConfig } from "@playwright/test";
import { readdirSync, existsSync } from "node:fs";

// Resolve a Chromium binary. In CI we let Playwright manage its own download
// (executablePath stays undefined). In the pre-provisioned dev container a
// Chromium build already lives under /opt/pw-browsers, so we point at it
// instead of downloading again (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 is set there).
function findLocalChromium(){
  const root = "/opt/pw-browsers";
  if(!existsSync(root)) return undefined;
  const dir = readdirSync(root)
    .filter(name => /^chromium-\d+$/.test(name))
    .sort()
    .pop();
  if(!dir) return undefined;
  const bin = `${root}/${dir}/chrome-linux/chrome`;
  return existsSync(bin) ? bin : undefined;
}

const executablePath = process.env.PW_CHROMIUM_PATH || findLocalChromium();
const PORT = 8123;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    headless: true,
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      args: ["--no-sandbox"]
    }
  },
  webServer: {
    command: `python3 -m http.server ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: true,
    timeout: 30_000
  }
});
