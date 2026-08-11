// signAction Phase B tests — REAL signing, every gate exercised.
// Builds a genuine funding tx (so the raw hex hash-binds to a real txid),
// spends it, and drives performSignAction through the happy path and through
// every refusal: value lie, unknown UTXO, tampered funding tx, missing raw tx,
// disallowed sighash, effect deviation, 1-sat input, abort registry.
// Run: node tests/signaction-phaseB-tests.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert';

const dir = new URL('..', import.meta.url).pathname;

const ctx = { window: {}, self: {}, console };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(dir + 'lib/bsv.min.js', 'utf8') + '\nthis.__bsv=(typeof bsv!=="undefined")?bsv:(window&&window.bsv);', ctx);
const bsv = ctx.__bsv || ctx.bsv || ctx.window.bsv;
assert(bsv && bsv.Transaction, 'bsv lib failed to load');
vm.runInContext(fs.readFileSync(dir + 'src/spv-verify.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(dir + 'src/brc100-signaction.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(dir + 'src/brc100-signaction-phaseB.js', 'utf8'), ctx);
const SA = ctx.OrdplugSignAction, PB = ctx.OrdplugSignActionPhaseB;
assert(SA && PB && PB.performSignAction, 'engines failed to load');

// --- our key / address --------------------------------------------------------
const priv = bsv.PrivateKey.fromWIF('L1TnU2zbNaAqMoVh65Cyvmcjzbrj41Gs9iTLcWbpJCMynXuap6UN');
const WIF = priv.toWIF();
const ourAddr = priv.toAddress().toString();
const ourLockHex = bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(ourAddr)).toHex();

// --- a REAL funding tx: raw hex whose sha256d equals its txid ----------------
// vout 0: 100000 sats to us (spendable) · vout 1: 1 sat to us (ordinal-like)
const fundingTx = new bsv.Transaction()
  .from(new bsv.Transaction.UnspentOutput({ txid: 'b'.repeat(64), outputIndex: 0, address: ourAddr, script: ourLockHex, satoshis: 200000 }))
  .to(bsv.Address.fromString(ourAddr), 100000)
  .to(bsv.Address.fromString(ourAddr), 1);
const fundingRaw = fundingTx.uncheckedSerialize();
const fundingTxid = fundingTx.id.toLowerCase();

// --- the dApp-built spend the wallet is asked to sign ------------------------
function buildSpend() {
  return new bsv.Transaction()
    .from(new bsv.Transaction.UnspentOutput({ txid: fundingTxid, outputIndex: 0, address: ourAddr, script: ourLockHex, satoshis: 100000 }))
    .to(bsv.Address.fromString(ourAddr), 40000)
    .to('1BitcoinEaterAddressDontSendf59kuE', 55000);
}
function args(overrides) {
  const base = { tx: buildSpend().uncheckedSerialize(), reference: 'ref-123',
    inputs: [{ txid: fundingTxid, vout: 0, satoshis: 100000, lockingScriptHex: ourLockHex }] };
  return JSON.stringify(Object.assign(base, overrides || {}));
}
const utxoList = [
  { tx_hash: fundingTxid, tx_pos: 0, value: 100000 },
  { tx_hash: fundingTxid, tx_pos: 1, value: 1 }
];
const rawTxByTxid = {}; rawTxByTxid[fundingTxid] = fundingRaw;

function freshReview(a) { return SA.reviewSignAction(a || args(), { bsv, ourAddress: ourAddr, protectedSet: new Set() }); }
// single-tx block: merkle root IS the txid, empty path (V45 SPV gate)
const spvByTxid = {}; spvByTxid[fundingTxid] = { index: 0, nodes: [], merkleRootHex: fundingTxid };
function deps(over) {
  return Object.assign({ bsv, ourAddress: ourAddr, utxoList, rawTxByTxid, spvByTxid, getWif: () => WIF, pendingStore: {}, origin: 'https://test.example' }, over || {});
}

let pass = 0, fail = 0;
function t(name, fn) { try { fn(); console.log('  \u2713 ' + name); pass++; } catch (e) { console.log('  \u2717 ' + name + ' \u2014 ' + e.message); fail++; } }

// Enable for the signing tests. ENABLED ships false (asserted in the Phase A
// suite); here we flip the live flag exactly as the owner would.
PB.ENABLED = true;

console.log('signAction Phase B \u2014 happy path');
t('signs an approved own-input tx; signature passes the script interpreter', () => {
  const store = {};
  const r = PB.performSignAction(freshReview(), deps({ pendingStore: store }));
  assert.strictEqual(typeof r.tx, 'string');
  assert.strictEqual(r.sighash, 'SIGHASH_ALL|SIGHASH_FORKID');
  assert.strictEqual(JSON.stringify([...r.signedInputIndexes]), '[0]');
  assert.strictEqual(r.reference, 'ref-123');
  assert.ok(store['ref-123'] && store['ref-123'].txid === r.txid, 'pending action registered');
  // independent re-verification of the returned bytes
  const stx = new bsv.Transaction(r.tx);
  const flags = bsv.Script.Interpreter.SCRIPT_VERIFY_P2SH | bsv.Script.Interpreter.SCRIPT_VERIFY_STRICTENC
    | bsv.Script.Interpreter.SCRIPT_VERIFY_DERSIG | bsv.Script.Interpreter.SCRIPT_VERIFY_LOW_S
    | bsv.Script.Interpreter.SCRIPT_ENABLE_SIGHASH_FORKID;
  const ok = new bsv.Script.Interpreter().verify(stx.inputs[0].script, bsv.Script.fromHex(ourLockHex), stx, 0, flags, bsv.crypto.BN.fromNumber(100000));
  assert.ok(ok, 'signature must verify against the proven locking script');
  // outputs untouched by signing
  assert.strictEqual(stx.outputs.length, 2);
  assert.strictEqual(stx.outputs[0].satoshis, 40000);
  assert.strictEqual(stx.outputs[1].satoshis, 55000);
  // txid is the sha256d of the returned bytes
  assert.strictEqual(PB.sha256dTxid(bsv, r.tx), r.txid);
});
t('explicit SIGHASH_ALL request is accepted (normalised to ALL|FORKID)', () => {
  const r = PB.performSignAction(freshReview(args({ sighashType: bsv.crypto.Signature.SIGHASH_ALL })), deps());
  assert.strictEqual(r.sighash, 'SIGHASH_ALL|SIGHASH_FORKID');
});

console.log('signAction Phase B \u2014 GATE 1: prevout proof refusals');
t('refuses when the app lies about the input value (own-UTXO view wins)', () => {
  const lyingUtxos = [{ tx_hash: fundingTxid, tx_pos: 0, value: 90000 }];
  assert.throws(() => PB.performSignAction(freshReview(), deps({ utxoList: lyingUtxos })),
    e => e.name === 'WERR_INVALID_PARAMETER' && /worth 90000/.test(e.message));
});
t('refuses an input that is not in the wallet\u2019s own unspent view', () => {
  assert.throws(() => PB.performSignAction(freshReview(), deps({ utxoList: [] })),
    e => e.name === 'WERR_INVALID_PARAMETER' && /not an unspent output/i.test(e.message));
});
t('refuses a tampered funding tx (hash-binding to the txid fails)', () => {
  const tampered = {}; // flip one byte in the value field of vout 0
  tampered[fundingTxid] = fundingRaw.slice(0, 200) + (fundingRaw[200] === '0' ? '1' : '0') + fundingRaw.slice(201);
  assert.throws(() => PB.performSignAction(freshReview(), deps({ rawTxByTxid: tampered })),
    e => e.name === 'WERR_INVALID_PARAMETER' && /does not hash to/i.test(e.message));
});
t('refuses when the funding tx could not be fetched (fail-closed)', () => {
  assert.throws(() => PB.performSignAction(freshReview(), deps({ rawTxByTxid: {} })),
    e => e.name === 'WERR_INTERNAL' && /prove the prevout/i.test(e.message));
});
t('refuses a proven prevout whose value contradicts the claim', () => {
  // funding tx proves vout1 = 1 sat; claim it as 100000 at vout 1 (also 1-sat guard upstream:
  // bypass Phase A by editing the review object directly to hit the Phase B check)
  const r = freshReview();
  r.ownedInputs = [{ inputIndex: 0, txid: fundingTxid, vout: 1, satoshis: 100000 }];
  const u = [{ tx_hash: fundingTxid, tx_pos: 1, value: 100000 }]; // colluding index view
  assert.throws(() => PB.performSignAction(r, deps({ utxoList: u })),
    e => e.name === 'WERR_INVALID_PARAMETER' && /proven prevout/i.test(e.message));
});

console.log('signAction Phase B \u2014 GATE 1c: SPV inclusion (V45)');
t('refuses when no merkle proof is available (fail-closed)', () => {
  assert.throws(() => PB.performSignAction(freshReview(), deps({ spvByTxid: {} })),
    e => e.name === 'WERR_INTERNAL' && /inclusion proof/i.test(e.message));
});
t('refuses a merkle proof that does not connect to the root', () => {
  const bad = {}; bad[fundingTxid] = { index: 0, nodes: ['c'.repeat(64)], merkleRootHex: fundingTxid };
  assert.throws(() => PB.performSignAction(freshReview(), deps({ spvByTxid: bad })),
    e => e.name === 'WERR_INVALID_PARAMETER' && /merkle proof/i.test(e.message));
});

console.log('signAction Phase B \u2014 GATE 2: sighash policy');
t('refuses SIGHASH_NONE', () => {
  const a = args({ sighashType: bsv.crypto.Signature.SIGHASH_NONE | bsv.crypto.Signature.SIGHASH_FORKID });
  assert.throws(() => PB.performSignAction(freshReview(a), deps()),
    e => e.name === 'WERR_INVALID_PARAMETER' && /sighash/i.test(e.message));
});
t('refuses ANYONECANPAY', () => {
  const a = args({ sighashType: bsv.crypto.Signature.SIGHASH_ALL | bsv.crypto.Signature.SIGHASH_ANYONECANPAY | bsv.crypto.Signature.SIGHASH_FORKID });
  assert.throws(() => PB.performSignAction(freshReview(a), deps()),
    e => e.name === 'WERR_INVALID_PARAMETER' && /sighash/i.test(e.message));
});

console.log('signAction Phase B \u2014 GATE 3: key discipline');
t('the key is pulled only after gates pass \u2014 getWif is never called on refusal', () => {
  let pulled = false;
  const spyDeps = deps({ utxoList: [], getWif: () => { pulled = true; return WIF; } });
  assert.throws(() => PB.performSignAction(freshReview(), spyDeps));
  assert.strictEqual(pulled, false, 'getWif must not be called when a gate refuses');
});

console.log('signAction Phase B \u2014 GATE 4: signed bytes must match the approval');
t('refuses when the approved effect was tampered with after review', () => {
  const r = freshReview();
  r.effect.outputsElsewhere = 1; // simulate any post-approval drift
  assert.throws(() => PB.performSignAction(r, deps()),
    e => e.name === 'WERR_INTERNAL' && /deviates from the approved effect/i.test(e.message));
});

console.log('signAction Phase B \u2014 GATE 5: abortAction is real');
t('registered action can be aborted exactly once', () => {
  const store = {};
  const r = PB.performSignAction(freshReview(), deps({ pendingStore: store }));
  const a = PB.abortPending(store, r.reference);
  assert.strictEqual(a.aborted, true); assert.strictEqual(a.reference, 'ref-123');
  assert.throws(() => PB.abortPending(store, r.reference),
    e => e.name === 'WERR_INVALID_PARAMETER' && /no abortable action/i.test(e.message));
});
t('aborting an unknown reference refuses', () => {
  assert.throws(() => PB.abortPending({}, 'nope'),
    e => e.name === 'WERR_INVALID_PARAMETER');
});

console.log('signAction Phase B \u2014 disabled contract');
t('with ENABLED=false the same call refuses without touching the key', () => {
  PB.ENABLED = false;
  let pulled = false;
  assert.throws(() => PB.performSignAction(freshReview(), deps({ getWif: () => { pulled = true; return WIF; } })),
    e => e.name === 'WERR_UNSUPPORTED_ACTION');
  assert.strictEqual(pulled, false);
  PB.ENABLED = true;
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
