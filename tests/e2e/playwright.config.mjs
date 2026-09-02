// V49.3 — loaded-extension E2E. Run from tests/e2e:
//   npm install && npx playwright install chromium && npm test
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.mjs/,
  timeout: 60_000,
  workers: 1,               // one persistent browser profile == one wallet
  retries: 0,
  reporter: [['list']],
  use: { headless: false }  // MV3 extensions need a headed Chromium (or the new headless: see fixtures)
});
