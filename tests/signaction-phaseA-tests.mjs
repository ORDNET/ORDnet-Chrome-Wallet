// signAction Phase A tests — verify + reconstruct, NO signing.
// Loads the real bundled bsv lib + the pure review engine, builds a genuine
// transaction, and checks the security-critical refusals hold.
// Run: node tests/signaction-phaseA-tests.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert';

const dir = new URL('..', import.meta.url).pathname;

// --- load the bundled bsv lib into a sandbox and grab the global it assigns ---
const ctx = { window: {}, self: {}, console };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(dir + 'lib/bsv.min.js', 'utf8') + '\nthis.__bsv=(typeof bsv!=="undefined")?bsv:(window&&window.bsv);', ctx);
const bsv = ctx.__bsv || ctx.bsv || ctx.window.bsv;
assert(bsv && bsv.Transaction, 'bsv lib failed to load');

// --- load the pure Phase A engine into the same sandbox ---
vm.runInContext(fs.readFileSync(dir + 'src/brc100-signaction.js', 'utf8'), ctx);
const SA = ctx.OrdplugSignAction;
assert(SA && SA.reviewSignAction, 'Phase A engine failed to load');

// --- build a real transaction we control -------------------------------------
const priv = bsv.PrivateKey.fromWIF('L1TnU2zbNaAqMoVh65Cyvmcjzbrj41Gs9iTLcWbpJCMynXuap6UN'); // well-known test WIF
const ourAddr = priv.toAddress().toString();
const ourLockHex = bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(ourAddr)).toHex();

// a fake prevout we "own": txid all-a, vout 0, 100000 sats, P2PKH to us
const prevTxid = 'a'.repeat(64);
const tx = new bsv.Transaction()
  .from(new bsv.Transaction.UnspentOutput({ txid: prevTxid, outputIndex: 0, address: ourAddr, script: ourLockHex, satoshis: 100000 }))
  .to(bsv.Address.fromString(ourAddr), 40000)   // change back to us
  .to('1BitcoinEaterAddressDontSendf59kuE', 55000); // to someone else
const txHex = tx.uncheckedSerialize();

function argsWith(overrides) {
  const base = { tx: txHex, inputs: [{ txid: prevTxid, vout: 0, satoshis: 100000, lockingScriptHex: ourLockHex }] };
  return JSON.stringify(Object.assign(base, overrides || {}));
}

let pass = 0, fail = 0;
function t(name, fn){ try { fn(); console.log('  \u2713 ' + name); pass++; } catch(e){ console.log('  \u2717 ' + name + ' \u2014 ' + e.message); fail++; } }

console.log('signAction Phase A — happy path');
t('reviews a valid own-input tx and reconstructs the effect', () => {
  const r = SA.reviewSignAction(argsWith(), { bsv, ourAddress: ourAddr, protectedSet: new Set() });
  assert.strictEqual(r.signed, false, 'must never report signed');
  assert.strictEqual(r.phase, 'A-dry-run');
  assert.strictEqual(r.ownedInputs.length, 1);
  assert.strictEqual(r.effect.spendingFromWallet, 100000);
  assert.strictEqual(r.effect.outputsToWallet, 40000);
  assert.strictEqual(r.effect.outputsElsewhere, 55000);
  assert.strictEqual(r.effect.netToWallet, 40000 - 100000);
});

console.log('signAction Phase A — security refusals');
t('refuses a protected 1-sat ordinal input', () => {
  const prot = new Set([prevTxid + ':0']);
  assert.throws(() => SA.reviewSignAction(argsWith(), { bsv, ourAddress: ourAddr, protectedSet: prot }),
    e => e.name === 'WERR_INVALID_PARAMETER' && /ordinal/i.test(e.message));
});
t('refuses an input not present in the tx', () => {
  const args = JSON.stringify({ tx: txHex, inputs: [{ txid: 'b'.repeat(64), vout: 3, satoshis: 5000, lockingScriptHex: ourLockHex }] });
  assert.throws(() => SA.reviewSignAction(args, { bsv, ourAddress: ourAddr, protectedSet: new Set() }),
    e => e.name === 'WERR_INVALID_PARAMETER' && /not present/i.test(e.message));
});
t('V44 fail-closed: refuses ANY 1-sat input even with an EMPTY protected set', () => {
  // index outage => wallet.js refuses outright; but even if a caller passed an
  // empty set, the pure engine itself must never let a 1-sat input through.
  const args = JSON.stringify({ tx: txHex, inputs: [{ txid: prevTxid, vout: 0, satoshis: 1, lockingScriptHex: ourLockHex }] });
  assert.throws(() => SA.reviewSignAction(args, { bsv, ourAddress: ourAddr, protectedSet: new Set() }),
    e => e.name === 'WERR_INVALID_PARAMETER' && /1-sat/i.test(e.message));
});
t('V44: captures a dApp-requested sighash for the Phase B policy gate', () => {
  const args = JSON.stringify({ tx: txHex, sighashType: 66,
    inputs: [{ txid: prevTxid, vout: 0, satoshis: 100000, lockingScriptHex: ourLockHex }] });
  const r = SA.reviewSignAction(args, { bsv, ourAddress: ourAddr, protectedSet: new Set() });
  assert.strictEqual(r.requestedSighash, 66);
});
t('refuses an input whose prevout script is not our address', () => {
  const foreignLock = bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString('1BitcoinEaterAddressDontSendf59kuE')).toHex();
  const args = JSON.stringify({ tx: txHex, inputs: [{ txid: prevTxid, vout: 0, satoshis: 100000, lockingScriptHex: foreignLock }] });
  assert.throws(() => SA.reviewSignAction(args, { bsv, ourAddress: ourAddr, protectedSet: new Set() }),
    e => e.name === 'WERR_INVALID_PARAMETER' && /own-key P2PKH/i.test(e.message));
});
t('refuses missing prevout locking script (cannot verify what we sign)', () => {
  const args = JSON.stringify({ tx: txHex, inputs: [{ txid: prevTxid, vout: 0, satoshis: 100000 }] });
  assert.throws(() => SA.reviewSignAction(args, { bsv, ourAddress: ourAddr, protectedSet: new Set() }),
    e => e.name === 'WERR_INVALID_PARAMETER' && /lockingScriptHex/i.test(e.message));
});
t('refuses malformed tx hex', () => {
  const args = JSON.stringify({ tx: 'zzzz', inputs: [{ txid: prevTxid, vout: 0, satoshis: 1, lockingScriptHex: ourLockHex }] });
  assert.throws(() => SA.reviewSignAction(args, { bsv, ourAddress: ourAddr, protectedSet: new Set() }),
    e => e.name === 'WERR_INVALID_PARAMETER');
});
t('refuses non-integer satoshis', () => {
  const args = JSON.stringify({ tx: txHex, inputs: [{ txid: prevTxid, vout: 0, satoshis: 1.5, lockingScriptHex: ourLockHex }] });
  assert.throws(() => SA.reviewSignAction(args, { bsv, ourAddress: ourAddr, protectedSet: new Set() }),
    e => e.name === 'WERR_INVALID_PARAMETER');
});
t('refuses empty inputs[]', () => {
  const args = JSON.stringify({ tx: txHex, inputs: [] });
  assert.throws(() => SA.reviewSignAction(args, { bsv, ourAddress: ourAddr, protectedSet: new Set() }),
    e => e.name === 'WERR_INVALID_PARAMETER');
});

console.log('signAction Phase B — ships disabled, refuses until the owner flips it');
vm.runInContext(fs.readFileSync(dir + 'src/brc100-signaction-phaseB.js', 'utf8'), ctx);
const PB = ctx.OrdplugSignActionPhaseB;
t('Phase B ships with ENABLED=false', () => { assert.strictEqual(PB.ENABLED, false); });
t('Phase B refuses to sign while disabled, even with a valid review and full deps', () => {
  const r = SA.reviewSignAction(argsWith(), { bsv, ourAddress: ourAddr, protectedSet: new Set() });
  assert.throws(() => PB.performSignAction(r, { bsv, ourAddress: ourAddr, getWif: () => 'L1TnU2zbNaAqMoVh65Cyvmcjzbrj41Gs9iTLcWbpJCMynXuap6UN', utxoList: [], rawTxByTxid: {}, pendingStore: {} }),
    e => e.name === 'WERR_UNSUPPORTED_ACTION');
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
