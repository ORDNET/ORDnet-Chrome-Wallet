// V49.3 — release regression suite. One block per shipped item:
//   1/2   one plan for screen and bytes, page fee clamped, post-sign check
//   3     BRC-100 goes through the request gate (one slot for both families)
//   4     single method registry: background, popup, page shim, README agree
//   5     "Remove wallet" wipes every storage key the extension writes
//   6     BIP39 checksum
//   7     isAuthenticated reflects vault + session + auto-lock
//   8     BRC-100 page shim times out instead of hanging
//   14    an outage is not a zero balance
//   15    active auto-lock watchdog exists and is started
//   17    one content script injects both providers
//   18    release identity: manifest == changelog head == README
// Run: node tests/v49-release-tests.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert';
import nodeCrypto from 'node:crypto';
import { walletSource, walletModuleFiles, root } from './lib/wallet-src.mjs';

const read = (p) => fs.readFileSync(root + p, 'utf8');
const walletSrc = walletSource();
let pass = 0, fail = 0;
function t(name, fn) { try { fn(); console.log('  \u2713 ' + name); pass++; } catch (e) { console.log('  \u2717 ' + name + ' \u2014 ' + e.message); fail++; } }
async function ta(name, fn) { try { await fn(); console.log('  \u2713 ' + name); pass++; } catch (e) { console.log('  \u2717 ' + name + ' \u2014 ' + e.message); fail++; } }

/* ---------- a popup-like context with the real bsv library ---------- */
function popupContext() {
  const ctx = { console, setTimeout, clearTimeout, Buffer, crypto: nodeCrypto.webcrypto, TextEncoder, TextDecoder, JSON, Math, Number, String, Set, Map, Array, Object, Promise, Date, Error, RegExp, parseInt, parseFloat, isFinite, atob, btoa };
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
  ctx.document = { getElementById: () => null, documentElement: { setAttribute() {} } };
  ctx.chrome = { storage: { local: { get: (k, cb) => cb({}), set: (o, cb) => cb && cb(), remove: (k, cb) => cb && cb() }, session: { get: (k, cb) => cb({}), set: (o, cb) => cb && cb(), remove: (k, cb) => cb && cb(), clear: (cb) => cb && cb() } }, runtime: { sendMessage() {} } };
  vm.createContext(ctx);
  vm.runInContext(read('lib/bsv.min.js'), ctx);
  const mods = ['00-header.js', '01-bip39-wordlist.js', '02-config.js', '03-keys.js', '04-vault.js', '05-icons.js', '06-network-chain.js', '07-brc100-state.js', '08-txbuild.js', '09-views.js'];
  mods.forEach(m => vm.runInContext(read('src/wallet/' + m), ctx, { filename: m }));
  // approval module (feeNum, clampSiteFee, txEffect, txFingerprint, planForPending, signPlanned)
  vm.runInContext(read('src/wallet/15-approval.js'), ctx, { filename: '15-approval.js' });
  return ctx;
}
const C = popupContext();
const g = (expr) => vm.runInContext(expr, C);   // consts are not properties of the vm global
const bsv = C.bsv;
const pk = bsv.PrivateKey.fromRandom();
const ADDR = pk.toAddress().toString();
vm.runInContext(`_wif=${JSON.stringify(pk.toWIF())}; _address=${JSON.stringify(ADDR)};`, C);
function stubUtxos(list) {
  vm.runInContext(`getUTXOs=async function(){ return ${JSON.stringify(list)}; };`, C);
}
const P2PKH = bsv.Script.buildPublicKeyHashOut(pk.toAddress()).toHex();
const utxo = (sats, i) => ({ txid: (i + 1).toString(16).padStart(64, '1'), vout: 0, satoshis: sats, scriptPubKey: P2PKH });
const OTHER = bsv.PrivateKey.fromRandom().toAddress().toString();

/* ============================================================== */
console.log('items 1/2: page fee is clamped, screen == bytes');
t('feeNum refuses anything above the 1,000,000-sat sanity ceiling', () => {
  assert.strictEqual(C.feeNum(1_000_001), 0);
  assert.strictEqual(C.feeNum(1_000_000), 1_000_000);
});
t('clampSiteFee: absent -> wallet rate', () => {
  const r = C.clampSiteFee(100, undefined);
  assert.strictEqual(r.fee, 100); assert.strictEqual(r.source, 'wallet');
});
t('clampSiteFee: below the wallet rate -> wallet rate, with a note', () => {
  const r = C.clampSiteFee(100, 10);
  assert.strictEqual(r.fee, 100); assert.ok(/below/.test(r.note));
});
t('clampSiteFee: within 2x -> honoured, attributed to the page', () => {
  const r = C.clampSiteFee(100, 150);
  assert.strictEqual(r.fee, 150); assert.strictEqual(r.source, 'site');
});
t('clampSiteFee: above 2x -> capped at exactly 2x (the audit PoC: small inscription, huge fee)', () => {
  const r = C.clampSiteFee(100, 50_000);
  assert.strictEqual(r.fee, 200); assert.strictEqual(r.source, 'capped'); assert.ok(/capped/.test(r.note));
});
await ta('buildInscribe with a page fee of 50,000 sats pays at most 2x the wallet estimate', async () => {
  stubUtxos([utxo(1_000_000, 1)]);
  const bytes = new TextEncoder().encode('hello');
  const tx = await C.buildInscribe('text/plain', bytes, 50_000, { sign: false });
  const eff = C.txEffect(tx, ADDR);
  const wallet = C.inscribeMinerFee(bytes.length);
  assert.strictEqual(eff.fee, wallet * 2, 'fee is 2x wallet estimate, not 50,000');
  assert.strictEqual(tx._ordplugFee.source, 'capped');
});
await ta('buildSend with no page fee pays exactly the wallet estimate', async () => {
  stubUtxos([utxo(100_000, 2)]);
  const tx = await C.buildSend(OTHER, 10_000, null, 0, { sign: false });
  const eff = C.txEffect(tx, ADDR);
  assert.strictEqual(eff.fee, C.sendMinerFee());
  assert.strictEqual(eff.paid, 10_000);
  assert.strictEqual(eff.service, g('TOTAL_SERVICE_FEES'));
  assert.strictEqual(eff.change, 100_000 - 10_000 - g('TOTAL_SERVICE_FEES') - C.sendMinerFee());
  assert.strictEqual(eff.leaves, 10_000 + g('TOTAL_SERVICE_FEES') + C.sendMinerFee());
});
await ta('buildTx (sendTx) ignores a page fee that short-circuited the fee loop before', async () => {
  stubUtxos([utxo(1_000_000, 3)]);
  const params = { outputs: [{ type: 'p2pkh', address: OTHER, satoshis: 1000 }], fee: 999_999 };
  const tx = await C.buildTx(params, { sign: false });
  const eff = C.txEffect(tx, ADDR);
  assert.ok(eff.fee < 2000, 'fee ' + eff.fee + ' is a byte-accurate estimate (x2 at most), not 999,999');
  assert.strictEqual(tx._ordplugFee.source, 'capped');
});
await ta('txEffect classifies every output: payment / service / change / inscription / opreturn', async () => {
  stubUtxos([utxo(1_000_000, 4)]);
  const tx = await C.buildTx({ outputs: [
    { type: 'p2pkh', address: OTHER, satoshis: 1000 },
    { type: 'opreturn', data: ['hi'] },
    { type: 'inscription', contentType: 'text/plain', data: 'x', address: ADDR }
  ] }, { sign: false });
  const kinds = C.txEffect(tx, ADDR).outputs.map(o => o.kind);
  assert.strictEqual(JSON.stringify(kinds.slice(0, 3)), JSON.stringify(['payment', 'opreturn', 'inscription']));
  assert.strictEqual(kinds.filter(k => k === 'service').length, Object.keys(g('SERVICE_FEES')).length);
  assert.strictEqual(kinds[kinds.length - 1], 'change');
});
await ta('signPlanned signs the SAME object and its fingerprint survives signing', async () => {
  stubUtxos([utxo(100_000, 5)]);
  const p = { method: 'pay', params: { to: OTHER, amount: 5000 } };
  const plan = await C.planForPending(p);
  assert.ok(!plan.tx.inputs[0].script.toHex().length, 'plan is unsigned');
  const signed = C.signPlanned(plan);
  assert.strictEqual(signed, plan.tx, 'same object');
  assert.ok(signed.inputs[0].script.toHex().length > 0, 'now signed');
  assert.strictEqual(C.txFingerprint(signed), plan.fingerprint);
});
await ta('signPlanned refuses a transaction whose outputs changed after review', async () => {
  stubUtxos([utxo(100_000, 6)]);
  const plan = await C.planForPending({ method: 'pay', params: { to: OTHER, amount: 5000 } });
  plan.tx.outputs[0].satoshis = 90_000;              // tamper between review and consent
  assert.throws(() => C.signPlanned(plan), /Safety stop/);
});
t('approveRequest never builds pay/inscribe/sendTx blind: it re-presents when there is no plan', () => {
  assert.ok(/if\(!p\.plan \|\| \(Date\.now\(\)-p\.plan\.builtAt\)>PLAN_MAX_AGE_MS\)\{[\s\S]{0,200}await presentApproval\(\)/.test(walletSrc));
  assert.ok(!/buildSend\(p\.params\.to/.test(walletSrc), 'no direct buildSend from the approval executor');
});
t('the purchase screen and its execution use one fee function', () => {
  assert.strictEqual((walletSrc.match(/purchaseMinerFee\(p\.params\)/g) || []).length, 2);
});

/* ============================================================== */
console.log('\nitem 3: BRC-100 requests go through the request gate');
const noop = () => {};
function backgroundContext(local, session) {
  const listeners = [];
  const chromeStub = {
    runtime: { onMessage: { addListener: (f) => listeners.push(f) }, onInstalled: { addListener: noop }, getURL: () => '', getManifest: () => ({ version: '4.9.3' }) },
    storage: {
      session: { get: (k, cb) => cb(session), set: (o, cb) => { Object.assign(session, o); cb && cb(); }, remove: (k, cb) => { [].concat(k).forEach(x => delete session[x]); cb && cb(); }, clear: noop },
      local: { get: (k, cb) => cb(local), set: noop },
      onChanged: { addListener: noop, removeListener: noop }
    },
    windows: { create: (o, cb) => cb && cb({ id: 7 }), update: (id, o, cb) => cb && cb(), onRemoved: { addListener: noop } },
    tabs: { sendMessage: noop }, action: { onClicked: { addListener: noop } }
  };
  const ctx = { console, chrome: chromeStub, setTimeout, clearTimeout, fetch: () => Promise.reject(new Error('offline')), JSON, Date, Object, Math, Error, String };
  ctx.globalThis = ctx; ctx.self = ctx;
  ctx.importScripts = (f) => vm.runInContext(read('src/' + f), ctx);
  vm.createContext(ctx);
  vm.runInContext(read('src/background.js'), ctx);
  return { ctx, listeners, session };
}
t('the gate treats a pending BRC-100 request exactly like a pending ordplug request', () => {
  const { ctx } = backgroundContext({}, {});
  const G = ctx.OrdplugGate, NOW = 1e9;
  assert.strictEqual(G.decide({ pendingBrc100: { origin: 'https://a', at: NOW } }, 'https://a', NOW + 1).allow, false);
  assert.strictEqual(G.decide({ pendingBrc100: { origin: 'https://a', at: NOW } }, 'https://b', NOW + 1).allow, false);
  assert.strictEqual(G.decide({ pendingBrc100: { origin: 'https://a', at: NOW - G.STALE_MS - 1 } }, 'https://b', NOW).allow, true, 'stale pending no longer wedges');
});
await ta('a second popup-routed BRC-100 request is refused (WERR_REVIEW_PENDING) while one is pending — no popup spam', async () => {
  const { listeners, session } = backgroundContext({}, {});
  const sender = { origin: 'https://dapp.example', tab: { id: 1 } };
  const send1 = []; listeners[0]({ type: 'brc100_request', id: 'r1', method: 'createAction', args: '{}' }, sender, (r) => send1.push(r));
  await new Promise(r => setTimeout(r, 5));
  assert.ok(session.ordplug_pending_brc100 && session.ordplug_pending_brc100.at, 'pending stored with a timestamp');
  const send2 = []; listeners[0]({ type: 'brc100_request', id: 'r2', method: 'createAction', args: '{}' }, sender, (r) => send2.push(r));
  await new Promise(r => setTimeout(r, 5));
  assert.strictEqual(send2[0].ok, false);
  assert.strictEqual(send2[0].error.name, 'WERR_REVIEW_PENDING');
  assert.strictEqual(session.ordplug_pending_brc100.id, 'r1', 'the first request was NOT overwritten');
});
t('both request families open the wallet through ONE window function', () => {
  const bg = read('src/background.js');
  assert.strictEqual((bg.match(/chrome\.windows\.create\(/g) || []).length, 1, 'exactly one windows.create, inside createWalletWindow');
  assert.ok(/chrome\.windows\.onRemoved\.addListener/.test(bg), 'closing the window answers a pending request');
  assert.ok(/WERR_USER_DECLINED/.test(bg));
});

/* ============================================================== */
console.log('\nitem 4: one method registry');
const regCtx = { globalThis: null }; regCtx.globalThis = regCtx; vm.createContext(regCtx);
vm.runInContext(read('src/brc100-methods.js'), regCtx);
const REG = regCtx.BRC100_METHODS;
t('registry has direct / popup / refused with no overlap', () => {
  const all = REG.direct.concat(REG.popup, REG.refused);
  assert.strictEqual(new Set(all).size, all.length);
});
t('the page shim (brc100-inpage.js) exposes exactly the registry surface', () => {
  const src = read('src/brc100-inpage.js');
  const m = src.match(/var METHODS = \[([\s\S]*?)\];/);
  const shim = [...m[1].matchAll(/'([A-Za-z0-9]+)'/g)].map(x => x[1]);
  assert.strictEqual(JSON.stringify([...shim].sort()), JSON.stringify([...REG.all].sort()));
});
t('background.js takes its popup list from the registry (no private copy)', () => {
  const { ctx } = backgroundContext({}, {});
  assert.strictEqual(JSON.stringify(ctx.BRC100_POPUP_METHODS), JSON.stringify(REG.popup));
  assert.ok(!/var BRC100_POPUP_METHODS = \[\s*'getPublicKey'/.test(read('src/background.js')));
});
t('every popup-routed method has a handler in the popup — certificates and payX402 included', () => {
  const popup = read('src/wallet/22-brc100-popup.js');
  const phase2 = [...popup.match(/const BRC100_PHASE2=\[([^\]]*)\]/)[1].matchAll(/'([A-Za-z0-9]+)'/g)].map(x => x[1]);
  REG.popup.forEach(m => {
    const handled = phase2.includes(m) || new RegExp("p\\.method==='" + m + "'").test(popup);
    assert.ok(handled, m + ' has no popup handler');
  });
});
t('every direct method is answered in background.js', () => {
  const bg = read('src/background.js');
  REG.direct.forEach(m => assert.ok(new RegExp("method === '" + m + "'").test(bg), m + ' not answered directly'));
});
t('the popup loads the registry file', () => {
  assert.ok(/<script src="brc100-methods\.js"><\/script>/.test(read('src/wallet.html')));
});

/* ============================================================== */
console.log('\nitem 5: Remove wallet wipes everything');
const KEYS = vm.runInContext('ALL_WALLET_STORAGE_KEYS', C);
const PREFIXES = vm.runInContext('WALLET_KEY_PREFIXES', C);
t('every storage-key literal written anywhere in src/ is covered by the wipe list or a wipe prefix', () => {
  const MESSAGE_TYPES = new Set(['ordplug_request', 'ordplug_response', 'ordplug_resolve']);
  const files = fs.readdirSync(root + 'src').filter(f => f.endsWith('.js')).map(f => 'src/' + f)
    .concat(walletModuleFiles().map(f => 'src/' + f));
  const seen = new Set();
  files.forEach(f => [...read(f).matchAll(/'((?:ordplug|ordnet)_[a-z0-9_]+)'/g)].forEach(m => seen.add(m[1])));
  assert.ok(seen.size >= 20, 'inventory sanity: ' + seen.size);
  [...seen].filter(k => !MESSAGE_TYPES.has(k)).forEach(k => {
    assert.ok(KEYS.includes(k) || PREFIXES.some(p => k.startsWith(p)), k + ' would survive "Remove wallet"');
  });
});
t('per-address domain caches are covered by the web3domains: prefix', () => {
  assert.ok(PREFIXES.includes('web3domains:'));
});
t('the wipe clears session storage and every Cache Storage bucket', () => {
  const v = read('src/wallet/04-vault.js');
  assert.ok(/chrome\.storage\.session\.clear\(/.test(v));
  assert.ok(/caches\.keys\(\)[\s\S]{0,80}caches\.delete\(/.test(v));
  assert.ok(/chrome\.storage\.local\.get\(null/.test(v), 'enumerates local storage for prefixed keys');
});
await ta('wipeAllWalletData removes list + prefixed keys, clears session, deletes caches', async () => {
  const local = { ordplug_vault_v11: 1, ordplug_certs: 1, 'web3domains:1abc': 1, ordnet_inscriptions_v1: 1, unrelated_setting: 1 };
  const session = { ordplug_session_v11: 1, ordplug_cooldowns: 1 };
  const removed = [];
  let sessionCleared = false; const deletedCaches = [];
  C.chrome.storage.local.get = (k, cb) => cb(local);
  C.chrome.storage.local.remove = (keys, cb) => { removed.push(...keys); cb(); };
  C.chrome.storage.session.clear = (cb) => { sessionCleared = true; cb(); };
  C.caches = { keys: async () => ['ordnet-cache-v4', 'other'], delete: async (n) => { deletedCaches.push(n); return true; } };
  await C.wipeAllWalletData();
  ['ordplug_vault_v11', 'ordplug_certs', 'web3domains:1abc', 'ordnet_inscriptions_v1', 'ordplug_brc100_grants_v1'].forEach(k => assert.ok(removed.includes(k), k));
  assert.ok(!removed.includes('unrelated_setting'));
  assert.ok(sessionCleared);
  assert.strictEqual(JSON.stringify(deletedCaches), JSON.stringify(['ordnet-cache-v4', 'other']));
});

/* ============================================================== */
console.log('\nitem 6: BIP39 checksum');
const VALID = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
t('a canonical BIP39 vector validates', () => { assert.strictEqual(C.validateMnemonic(VALID), true); });
t('twelve dictionary words with a bad checksum are refused, and the message says why', () => {
  const swapped = VALID.split(' '); [swapped[10], swapped[11]] = [swapped[11], swapped[10]];
  assert.strictEqual(C.validateMnemonic(swapped.join(' ')), false);
  assert.ok(/Checksum/.test(C.mnemonicProblem(swapped.join(' '))));
});
t('a word outside the list is named', () => {
  assert.ok(/Not in the word list: abandoned/.test(C.mnemonicProblem(VALID.replace('about', 'abandoned'))));
});
t('a wrong word count is refused', () => { assert.ok(/11 words/.test(C.mnemonicProblem(VALID.split(' ').slice(0, 11).join(' ')))); });
t('phrases generated by the wallet itself always validate', () => {
  for (let i = 0; i < 20; i++) {
    const ent = nodeCrypto.randomBytes(16);
    assert.strictEqual(C.validateMnemonic(C.entropyToMnemonic(ent)), true);
  }
});
t('the create flow demands a recovery challenge before the vault exists', () => {
  const setup = read('src/wallet/10-setup-unlock.js'), ev = read('src/wallet/23-events.js'), html = read('src/wallet.html');
  assert.ok(/\$\('createBtn'\)\.addEventListener\('click', showCreateChallenge\)/.test(ev));
  assert.ok(/\$\('verifyBtn'\)\.addEventListener\('click', createWalletNow\)/.test(ev));
  assert.ok(/id="setup-verify"/.test(html));
  assert.ok(/wrong\.length\)\{ err\(\$\('verifyErr'\)/.test(setup), 'wrong words block creation');
});
t('the import button is disabled until the live preview shows an address', () => {
  assert.ok(/id="importBtn" disabled/.test(read('src/wallet.html')));
  assert.ok(/function updateImportLive/.test(walletSrc));
});
t('the create screen says the phrase cannot be shown after a restart', () => {
  assert.ok(/after the browser restarts the wallet can no longer display them/.test(read('src/wallet.html')));
});

/* ============================================================== */
console.log('\nitem 7: isAuthenticated is real');
{
  const { ctx } = backgroundContext({}, {});
  const A = ctx.OrdplugAuth, NOW = 10_000_000;
  t('no vault -> not authenticated', () => assert.strictEqual(A.isAuthenticated({}, { ordplug_session_v11: { k: 'x', t: NOW } }, NOW), false));
  t('vault but no session key (locked) -> not authenticated', () => assert.strictEqual(A.isAuthenticated({ ordplug_vault_v11: {} }, {}, NOW), false));
  t('vault + fresh session -> authenticated', () => assert.strictEqual(A.isAuthenticated({ ordplug_vault_v11: {} }, { ordplug_session_v11: { k: 'x', t: NOW } }, NOW), true));
  t('session older than the auto-lock window -> not authenticated', () => assert.strictEqual(A.isAuthenticated({ ordplug_vault_v11: {}, ordplug_autolock_min: 5 }, { ordplug_session_v11: { k: 'x', t: NOW - 6 * 60000 } }, NOW), false));
  t('auto-lock 0 (never) keeps an old session authenticated', () => assert.strictEqual(A.isAuthenticated({ ordplug_vault_v11: {}, ordplug_autolock_min: 0 }, { ordplug_session_v11: { k: 'x', t: 0 } }, NOW), true));
  t('the unconditional `authenticated: true` is gone from background.js', () => {
    assert.ok(!/method === 'isAuthenticated' \|\| method === 'waitForAuthentication'/.test(read('src/background.js')));
  });
}

/* ============================================================== */
console.log('\nitem 8: the page shim cannot hang');
t('brc100-inpage.js rejects with WERR_TIMEOUT after 5 minutes and clears the timer on answer', () => {
  const s = read('src/brc100-inpage.js');
  assert.ok(/REQUEST_TIMEOUT_MS = 5 \* 60 \* 1000/.test(s));
  assert.ok(/WERR_TIMEOUT/.test(s));
  assert.ok(/clearTimeout\(p\.timer\)/.test(s));
});

/* ============================================================== */
console.log('\nitem 14: an outage is not a zero balance');
await ta('getBalance throws on a non-2xx answer instead of returning 0', async () => {
  C.fetch = async () => ({ ok: false, status: 429, json: async () => ({ error: 'rate limited' }) });
  await assert.rejects(C.getBalance(), /429/);
});
await ta('getBalance throws on a body without numeric fields', async () => {
  C.fetch = async () => ({ ok: true, status: 200, json: async () => ({ message: 'maintenance' }) });
  await assert.rejects(C.getBalance(), /unexpected/);
});
await ta('a real answer still comes through', async () => {
  C.fetch = async () => ({ ok: true, status: 200, json: async () => ({ confirmed: 12, unconfirmed: 3 }) });
  assert.strictEqual(JSON.stringify(await C.getBalance()), JSON.stringify({ confirmed: 12, unconfirmed: 3 }));
});

/* ============================================================== */
console.log('\nitem 15: active auto-lock');
t('a watchdog checks the session window while a wallet window is open, and is started after unlock', () => {
  assert.ok(/function startAutolockWatch\(\)[\s\S]{0,400}setInterval/.test(walletSrc));
  assert.ok(/startAutolockWatch\(\);/.test(read('src/wallet/10-setup-unlock.js')));
});

/* ============================================================== */
console.log('\nitem 17: one injector');
t('content.js relays BOTH message families and injects BOTH providers', () => {
  const c = read('src/content.js');
  assert.ok(/__ordplug === 1/.test(c) && /__ordplugCWI === 1/.test(c));
  assert.ok(/ordplug_request/.test(c) && /brc100_request/.test(c));
  assert.ok(/'src\/inpage\.js', 'src\/brc100-inpage\.js'/.test(c));
});

/* ============================================================== */
console.log('\nitem 18: one release identity');
t('manifest, CHANGELOG head and README agree on 4.9.3', () => {
  const m = JSON.parse(read('manifest.json'));
  assert.strictEqual(m.version, '4.9.3');
  assert.ok(/^## \[4\.9\.3 \(V49\.3\)\]/m.test(read('CHANGELOG.md')), 'CHANGELOG head');
  assert.ok(/4\.9\.3/.test(read('README.md')), 'README mentions 4.9.3');
});
t('getVersion() reports the manifest version; window.ordplug.version equals it too', () => {
  assert.ok(/chrome\.runtime\.getManifest\(\)\.version/.test(read('src/background.js')));
  const m = JSON.parse(read('manifest.json'));
  assert.ok(new RegExp("version: '" + m.version.replace(/\./g, '\\.') + "'").test(read('src/inpage.js')));
});
t('the changelog no longer claims 3.5.1 is live', () => {
  assert.ok(!/3\.5\.1\*\* — currently live/.test(read('CHANGELOG.md')));
});
t('the popup has no single wallet.js any more; the module list in wallet.html is ordered', () => {
  assert.ok(!fs.existsSync(root + 'src/wallet.js'));
  const files = walletModuleFiles();
  assert.ok(files.length >= 20);
  assert.deepStrictEqual(files, [...files].sort(), 'load order == numeric prefix order');
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
