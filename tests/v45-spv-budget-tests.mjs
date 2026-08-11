// V45 tests — SPV merkle verification + per-app daily budget engine.
// Run: node tests/v45-spv-budget-tests.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert';

const dir = new URL('..', import.meta.url).pathname;
const ctx = { window: {}, self: {}, console };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(dir + 'lib/bsv.min.js', 'utf8') + '\nthis.__bsv=(typeof bsv!=="undefined")?bsv:(window&&window.bsv);', ctx);
const bsv = ctx.__bsv || ctx.bsv || ctx.window.bsv;
vm.runInContext(fs.readFileSync(dir + 'src/spv-verify.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(dir + 'src/brc100-budget.js', 'utf8'), ctx);
const SPV = ctx.OrdplugSpv, BE = ctx.OrdplugBudget;
assert(SPV && BE, 'engines failed to load');

const B = bsv.deps.Buffer;
const d = (b) => B.from(bsv.crypto.Hash.sha256sha256(b));
const rev = (hex) => B.from(hex, 'hex').reverse();
// leaves in display order
const txA = 'a'.repeat(64), txB = 'b'.repeat(64), txC = 'c'.repeat(64);

let pass = 0, fail = 0;
function t(name, fn) { try { fn(); console.log('  \u2713 ' + name); pass++; } catch (e) { console.log('  \u2717 ' + name + ' \u2014 ' + e.message); fail++; } }

console.log('SPV merkle verification');
t('single-tx block: root == txid, empty path', () => {
  assert.ok(SPV.verifyInclusion(bsv, txA, { index: 0, nodes: [], merkleRootHex: txA }));
});
t('two-leaf tree: both positions verify against the computed root', () => {
  const root = d(B.concat([rev(txA), rev(txB)]));
  const rootHex = B.from(root).reverse().toString('hex');
  assert.ok(SPV.verifyInclusion(bsv, txA, { index: 0, nodes: [txB], merkleRootHex: rootHex }));
  assert.ok(SPV.verifyInclusion(bsv, txB, { index: 1, nodes: [txA], merkleRootHex: rootHex }));
});
t('three-leaf tree with "*" duplication verifies', () => {
  const h01 = d(B.concat([rev(txA), rev(txB)]));
  const h22 = d(B.concat([rev(txC), rev(txC)]));
  const root = d(B.concat([h01, h22]));
  const rootHex = B.from(root).reverse().toString('hex');
  const h01hex = B.from(h01).reverse().toString('hex');
  assert.ok(SPV.verifyInclusion(bsv, txC, { index: 2, nodes: ['*', h01hex], merkleRootHex: rootHex }));
});
t('80-byte header target: root read at offset 36', () => {
  const root = d(B.concat([rev(txA), rev(txB)]));
  const header = B.concat([B.alloc(36, 1), root, B.alloc(12, 2)]); // 80 bytes
  assert.ok(SPV.verifyInclusion(bsv, txA, { index: 0, nodes: [txB], headerHex: header.toString('hex') }));
});
t('tampered sibling node is refused', () => {
  const root = d(B.concat([rev(txA), rev(txB)]));
  const rootHex = B.from(root).reverse().toString('hex');
  assert.throws(() => SPV.verifyInclusion(bsv, txA, { index: 0, nodes: [txC], merkleRootHex: rootHex }),
    e => /does not connect/i.test(e.message));
});
t('wrong index (left/right swap) is refused', () => {
  const root = d(B.concat([rev(txA), rev(txB)]));
  const rootHex = B.from(root).reverse().toString('hex');
  assert.throws(() => SPV.verifyInclusion(bsv, txA, { index: 1, nodes: [txB], merkleRootHex: rootHex }));
});
t('index beyond the tree is refused', () => {
  assert.throws(() => SPV.verifyInclusion(bsv, txA, { index: 5, nodes: [txB], merkleRootHex: txA }),
    e => /exceeds/i.test(e.message));
});
t('missing proof is refused (fail-closed)', () => {
  assert.throws(() => SPV.verifyInclusion(bsv, txA, null), e => /fail-closed/i.test(e.message));
});
t('malformed header length is refused', () => {
  assert.throws(() => SPV.verifyInclusion(bsv, txA, { index: 0, nodes: [], headerHex: 'ab'.repeat(10) }),
    e => /80 bytes/i.test(e.message));
});

console.log('Per-app daily budget');
const NOW = Date.UTC(2026, 7, 8, 12, 0, 0);
t('no budget granted -> never auto-approve', () => {
  const dcn = BE.decide({}, 'https://app.example', 1000, 50, NOW);
  assert.strictEqual(dcn.autoApprove, false);
});
t('default $10 grant: within remaining auto-approves, beyond confirms', () => {
  const store = {};
  BE.setLimit(store, 'https://app.example', 10, NOW);
  // 10_000_000 sats @ $50/BSV = $5 -> within
  assert.strictEqual(BE.decide(store, 'https://app.example', 10_000_000, 50, NOW).autoApprove, true);
  BE.recordSpend(store, 'https://app.example', 5, NOW);
  // another $5 exactly consumes the rest
  assert.strictEqual(BE.decide(store, 'https://app.example', 10_000_000, 50, NOW).autoApprove, true);
  BE.recordSpend(store, 'https://app.example', 5, NOW);
  // now anything confirms
  assert.strictEqual(BE.decide(store, 'https://app.example', 1_000_000, 50, NOW).autoApprove, false);
});
t('no exchange rate -> fail-closed to confirm even with budget', () => {
  const store = {}; BE.setLimit(store, 'https://app.example', 10, NOW);
  assert.strictEqual(BE.decide(store, 'https://app.example', 1000, null, NOW).autoApprove, false);
});
t('UTC day rollover resets spend, keeps limit', () => {
  const store = {}; BE.setLimit(store, 'https://app.example', 10, NOW);
  BE.recordSpend(store, 'https://app.example', 10, NOW);
  assert.strictEqual(BE.decide(store, 'https://app.example', 1_000_000, 50, NOW).autoApprove, false);
  const tomorrow = NOW + 24 * 3600 * 1000;
  const dcn = BE.decide(store, 'https://app.example', 1_000_000, 50, tomorrow);
  assert.strictEqual(dcn.autoApprove, true);
  assert.strictEqual(dcn.remainingUsd, 10);
});
t('limit is adjustable and revocable', () => {
  const store = {}; BE.setLimit(store, 'https://app.example', 10, NOW);
  BE.setLimit(store, 'https://app.example', 25, NOW);
  assert.strictEqual(BE.getBudget(store, 'https://app.example').limitUsd, 25);
  BE.setLimit(store, 'https://app.example', null, NOW);
  assert.strictEqual(BE.getBudget(store, 'https://app.example'), null);
});
t('insane limits are refused', () => {
  assert.throws(() => BE.setLimit({}, 'https://app.example', 1e9, NOW));
  assert.throws(() => BE.setLimit({}, 'https://app.example', -5, NOW));
});
t('budgets are per-origin', () => {
  const store = {}; BE.setLimit(store, 'https://a.example', 10, NOW);
  assert.strictEqual(BE.decide(store, 'https://b.example', 1000, 50, NOW).autoApprove, false);
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
