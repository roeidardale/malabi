import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
import { E2E_PORT, MAINTENANCE_DATABASE_URL, e2eDatabaseUrl } from "./e2e/env";

// Use a system Chromium when there is one (skips `playwright install`).
const SYSTEM_CHROMIUM = "/usr/bin/chromium";
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ?? (existsSync(SYSTEM_CHROMIUM) ? SYSTEM_CHROMIUM : undefined);

export default defineConfig({
  testDir: "./e2e",
  // One shared database; the admin spec mutates content the storefront spec reads.
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    trace: "retain-on-failure",
    launchOptions: { executablePath },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "npm run e2e:server",
    url: `http://localhost:${E2E_PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DATABASE_URL: e2eDatabaseUrl(),
      E2E_MAINTENANCE_URL: MAINTENANCE_DATABASE_URL,
      SESSION_SECRET: "e2e-session-secret-at-least-32-characters-long",
      PAYMENT_PROVIDER: "mock",
    },
  },
});
