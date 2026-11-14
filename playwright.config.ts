import { defineConfig, devices } from "@playwright/test";

const remote = process.env.E2E_BASE_URL;
const local = "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: remote || local,
    trace: "retain-on-failure",
  },
  webServer: remote ? undefined : {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
    url: local,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
