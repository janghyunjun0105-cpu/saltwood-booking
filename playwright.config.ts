import { defineConfig } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "en-US",
    // Deliberately far from Austin: the app must show restaurant (Central) time wherever the viewer is.
    timezoneId: "Asia/Seoul",
    // Screenshots and assertions shouldn't catch a transition halfway through.
    reducedMotion: "reduce",
  },
  // Runs against a production build, like Vercel would serve it.
  webServer: {
    command: `npm run build && npx next start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: "ignore",
    stderr: "pipe",
  },
  projects: [
    { name: "e2e", testMatch: /(flow|layout)\.spec\.ts/ },
    { name: "screenshots", testMatch: /screenshots\.spec\.ts/ },
  ],
});
