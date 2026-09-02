// Shared Playwright fixtures: a Chromium with the repository loaded as an
// unpacked extension, the extension id, and a local http server so the
// content script (http(s)://*/*) actually injects on a real page.
import { test as base, chromium } from '@playwright/test';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(here, '..', '..');

export const test = base.extend({
  context: async ({}, use) => {
    const userDataDir = fs.mkdtempSync(join(os.tmpdir(), 'ordplug-e2e-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${ROOT}`,
        `--load-extension=${ROOT}`,
        '--no-first-run'
      ]
    });
    await use(context);
    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  },
  extensionId: async ({ context }, use) => {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent('serviceworker');
    await use(sw.url().split('/')[2]);
  },
  site: async ({}, use) => {
    // a plain http page: the content script only runs on http(s)
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<!doctype html><title>dapp</title><h1>dapp</h1>');
    });
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const url = `http://127.0.0.1:${server.address().port}/`;
    await use(url);
    await new Promise(r => server.close(r));
  }
});
export const expect = base.expect;
export const MANIFEST = JSON.parse(fs.readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
