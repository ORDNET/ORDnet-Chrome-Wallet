// V47.1 — request-gate tests (anti popup-spam for the all-sites provider).
// Loads background.js with a stubbed chrome API and exercises the pure gate.
// Run: node tests/v47-gate-tests.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert';

const dir = new URL('..', import.meta.url).pathname;
const noop = () => {};
const chromeStub = {
  runtime: { onMessage: { addListener: noop }, onInstalled: { addListener: noop }, getURL: () => '', getManifest: () => ({ version: '4.9.3' }) },
  storage: { session: { get: noop, set: noop, remove: noop }, local: { get: noop, set: noop } },
  windows: { create: noop }, tabs: { sendMessage: noop }, action: { onClicked: { addListener: noop } }
};
const ctx = { console, chrome: chromeStub, setTimeout, clearTimeout };
ctx.importScripts = (f) => vm.runInContext(fs.readFileSync(dir + 'src/' + f, 'utf8'), ctx);
ctx.globalThis = ctx; ctx.self = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(dir + 'src/background.js', 'utf8'), ctx);
const G = ctx.OrdplugGate;
assert(G && G.decide, 'gate failed to load from background.js');

let pass = 0, fail = 0;
function t(name, fn) { try { fn(); console.log('  \u2713 ' + name); pass++; } catch (e) { console.log('  \u2717 ' + name + ' \u2014 ' + e.message); fail++; } }

const NOW = 1_000_000_000;
const A = 'https://a.example', B = 'https://b.example';

console.log('request gate — single outstanding request');
t('first request from a clean state is allowed', () => {
  assert.strictEqual(G.decide({}, A, NOW).allow, true);
});
t('second request from the SAME origin is refused while one is pending', () => {
  const v = G.decide({ pending: { origin: A, at: NOW } }, A, NOW + 1000);
  assert.strictEqual(v.allow, false);
  assert.ok(/already has a request/i.test(v.error));
});
t('request from ANOTHER origin is refused while one is pending (no hijack)', () => {
  const v = G.decide({ pending: { origin: A, at: NOW } }, B, NOW + 1000);
  assert.strictEqual(v.allow, false);
  assert.ok(/another request/i.test(v.error));
});
t('a stale pending (popup closed, >5 min) no longer blocks anyone', () => {
  const v = G.decide({ pending: { origin: A, at: NOW } }, B, NOW + G.STALE_MS + 1);
  assert.strictEqual(v.allow, true);
});

console.log('request gate — cooldown after rejection');
t('rejection starts a cooldown for that origin only', () => {
  const cd = G.afterResolve({}, A, false, NOW);
  assert.strictEqual(G.decide({ cooldowns: cd }, A, NOW + 1).allow, false);
  assert.strictEqual(G.decide({ cooldowns: cd }, B, NOW + 1).allow, true);
});
t('cooldown expires after COOLDOWN_MS', () => {
  const cd = G.afterResolve({}, A, false, NOW);
  assert.strictEqual(G.decide({ cooldowns: cd }, A, NOW + G.COOLDOWN_MS + 1).allow, true);
});
t('approval clears any cooldown for the origin', () => {
  let cd = G.afterResolve({}, A, false, NOW);
  cd = G.afterResolve(cd, A, true, NOW + 1);
  assert.strictEqual(G.decide({ cooldowns: cd }, A, NOW + 2).allow, true);
});
t('cooldown refusal names the reason readably', () => {
  const cd = G.afterResolve({}, A, false, NOW);
  assert.ok(/declined|paused/i.test(G.decide({ cooldowns: cd }, A, NOW + 1).error));
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
