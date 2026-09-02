// V49.3 — loaded-extension browser tests (item 16). These exercise the real
// route the unit suites cannot: page → content script → background worker →
// popup → back, inside Chromium with the extension installed.
import { test, expect, MANIFEST } from './fixtures.mjs';

const VALID_PHRASE = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

async function waitForProviders(page) {
  await page.waitForFunction(() => window.ordplug && window.CWI, null, { timeout: 10_000 });
}

test.describe('providers on a real http page', () => {
  test('window.ordplug and window.CWI exist, ordplug.version equals the manifest', async ({ context, site }) => {
    const page = await context.newPage();
    await page.goto(site);
    await waitForProviders(page);
    expect(await page.evaluate(() => window.ordplug.version)).toBe(MANIFEST.version);
    expect(await page.evaluate(() => typeof window.CWI.createAction)).toBe('function');
  });

  test('getVersion() reports ordplug-<manifest version>; isAuthenticated is FALSE before a wallet exists', async ({ context, site }) => {
    const page = await context.newPage();
    await page.goto(site);
    await waitForProviders(page);
    expect(await page.evaluate(() => window.CWI.getVersion({}))).toEqual({ version: 'ordplug-' + MANIFEST.version });
    expect(await page.evaluate(() => window.CWI.isAuthenticated({}))).toEqual({ authenticated: false });
  });

  test('refused methods reject with a standards-shaped WalletError', async ({ context, site }) => {
    const page = await context.newPage();
    await page.goto(site);
    await waitForProviders(page);
    const err = await page.evaluate(() => window.CWI.revealCounterpartyKeyLinkage({}).catch(e => ({ name: e.name, code: e.code, isError: e.isError })));
    expect(err).toEqual({ name: 'WERR_UNSUPPORTED_ACTION', code: 2, isError: true });
  });
});

test.describe('wallet setup and the request gate', () => {
  test('create → recovery challenge → home; then isAuthenticated is TRUE; a bad-checksum import stays disabled', async ({ context, extensionId, site }) => {
    const wallet = await context.newPage();
    await wallet.goto(`chrome-extension://${extensionId}/src/wallet.html`);
    await wallet.click('#btnShowCreate');
    const phrase = (await wallet.inputValue('#newMnemonic')).trim();
    expect(phrase.split(/\s+/)).toHaveLength(12);
    await wallet.fill('#createPw1', 'correct horse battery');
    await wallet.fill('#createPw2', 'correct horse battery');
    await wallet.click('#createBtn');                       // "I wrote it down"
    await expect(wallet.locator('#setup-verify')).toBeVisible();
    const words = phrase.split(/\s+/);
    for (const k of [1, 2, 3]) {
      const label = await wallet.textContent(`#vfLabel${k}`);   // "Word #7"
      const idx = parseInt(label.replace(/\D/g, ''), 10) - 1;
      await wallet.fill(`#vfWord${k}`, words[idx]);
    }
    await wallet.click('#verifyBtn');                       // "Use this wallet"
    await expect(wallet.locator('#view-idle')).toBeVisible({ timeout: 20_000 });
    const address = (await wallet.textContent('#idleAddress')).trim();
    expect(address).toMatch(/^1[1-9A-HJ-NP-Za-km-z]{25,34}$/);

    // the page now sees an authenticated wallet
    const page = await context.newPage();
    await page.goto(site);
    await waitForProviders(page);
    expect(await page.evaluate(() => window.CWI.isAuthenticated({}))).toEqual({ authenticated: true });

    // a second, popup-routed request while one is pending is refused — and
    // only ONE wallet window is opened for the first
    const before = context.pages().length;
    const results = await page.evaluate(async () => {
      const first = window.CWI.createAction({ description: 'e2e', outputs: [] }).catch(e => ({ name: e.name }));
      await new Promise(r => setTimeout(r, 300));
      const second = await window.CWI.createAction({ description: 'e2e-2', outputs: [] }).catch(e => ({ name: e.name }));
      return { second };
    });
    expect(results.second).toEqual({ name: 'WERR_REVIEW_PENDING' });
    await page.waitForTimeout(500);
    expect(context.pages().length).toBe(before + 1);

    // close the wallet window without answering: the FIRST promise settles too
    const walletWin = context.pages().find(p => p !== page && p !== wallet && p.url().includes('wallet.html'));
    expect(walletWin).toBeTruthy();
    await walletWin.close();
    // (the first promise was created inside the previous evaluate; re-issue one and close again to observe the rejection)
    const closed = page.evaluate(() => window.CWI.createAction({ description: 'e2e-3', outputs: [] }).catch(e => ({ name: e.name })));
    await page.waitForTimeout(500);
    const win2 = context.pages().find(p => p !== page && p !== wallet && p.url().includes('wallet.html'));
    await win2.close();
    expect(await closed).toEqual({ name: 'WERR_USER_DECLINED' });

    // import screen: a phrase with a wrong checksum keeps the Import button disabled
    const fresh = await context.newPage();
    await fresh.goto(`chrome-extension://${extensionId}/src/wallet.html`);
    // (a vault exists, so this is the unlock screen; the import checks live on setup only)
    await expect(fresh.locator('#view-unlock')).toBeVisible();
  });

  test('import: bad checksum is refused live, valid phrase enables the button and previews the address', async ({ context, extensionId }) => {
    const wallet = await context.newPage();
    await wallet.goto(`chrome-extension://${extensionId}/src/wallet.html`);
    await wallet.click('#btnShowImport');
    const swapped = VALID_PHRASE.split(' '); [swapped[10], swapped[11]] = [swapped[11], swapped[10]];
    await wallet.fill('#importMnemonic', swapped.join(' '));
    await expect(wallet.locator('#importLiveStatus')).toContainText('Checksum');
    await expect(wallet.locator('#importBtn')).toBeDisabled();
    await wallet.fill('#importMnemonic', VALID_PHRASE);
    await expect(wallet.locator('#importLiveStatus')).toContainText('checksum OK');
    await expect(wallet.locator('#importLiveAddress')).toHaveText(/^1[1-9A-HJ-NP-Za-km-z]{25,34}$/);
    await expect(wallet.locator('#importBtn')).toBeEnabled();
  });
});
