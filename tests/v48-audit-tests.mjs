// V48 — regression tests for the 2026-08-11 external audit findings.
//
// Every test here corresponds to a finding that was reproduced against the
// shipped code. Two kinds of check:
//   - behavioural: the pure helpers are lifted out of wallet.js and exercised
//   - structural: assertions on the source itself, for the fixes that live in
//     markup or in a call site rather than in a testable function
//
// The structural ones matter as much as the behavioural ones: nothing stops a
// future edit from putting `allow-same-origin` back, and no unit test would
// notice. These do.
//
// Run: node tests/v48-audit-tests.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert';

const dir = new URL('..', import.meta.url).pathname;
import { walletSource } from './lib/wallet-src.mjs';
const walletSrc = walletSource();
const viewerHtml = fs.readFileSync(dir + 'src/viewer.html', 'utf8');
const swSrc = fs.readFileSync(dir + 'sw.js', 'utf8');
const backgroundSrc = fs.readFileSync(dir + 'src/background.js', 'utf8');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  \u2713 ' + name); pass++; }
  catch (e) { console.log('  \u2717 ' + name + ' \u2014 ' + e.message); fail++; }
}

/* Lift a top-level `function name(...)   { ... }` out of the source by brace
   counting, so the helpers can be tested without booting the whole popup. */
function lift(name) {
  const start = walletSrc.indexOf('function ' + name + '(');
  assert.ok(start !== -1, 'function ' + name + ' not found in wallet.js');
  // Skip the parameter list first: a destructured parameter contains braces of
  // its own, and starting the count there closes the body far too early.
  let p = walletSrc.indexOf('(', start), pd = 0;
  for (; p < walletSrc.length; p++) {
    if (walletSrc[p] === '(') pd++;
    else if (walletSrc[p] === ')') { pd--; if (pd === 0) { p++; break; } }
  }
  let i = walletSrc.indexOf('{', p), depth = 0;
  for (; i < walletSrc.length; i++) {
    if (walletSrc[i] === '{') depth++;
    else if (walletSrc[i] === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  return walletSrc.slice(start, i);
}

const ctx = { console, Number, Math, String, Set, Array };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(lift('satNum'), ctx);
vm.runInContext(lift('feeNum'), ctx);
vm.runInContext(
  walletSrc.slice(
    walletSrc.indexOf('const RESERVED_SIGN_NAMESPACES'),
    walletSrc.indexOf('function signMessageExternal')
  ), ctx);
const { feeNum, satNum, reservedNamespaceOf } = ctx;

/* ============================================================== *
 * Pattern 2 — `|0` on satoshi amounts is a 32-bit cast
 * ============================================================== */
console.log('\npattern: satoshi amounts are not 32-bit truncated');

t('the PoC value from the audit no longer wraps negative (V49.3: refused, never honoured)', () => {
  // (3_000_000_000 | 0) === -1_294_967_296. Since V49.3 a fee above the
  // MAX_FEE_SAT sanity ceiling (1,000,000 sats) is refused => 0 => the
  // wallet's own estimate is used. It is never negative and never paid.
  assert.strictEqual(feeNum(3_000_000_000), 0);
});
t('a fee above 2^31 does not wrap — it is refused', () => {
  assert.strictEqual(feeNum(2_147_483_648), 0);
});
t('a whole-supply fee is refused, not wrapped', () => {
  assert.strictEqual(feeNum(2_100_000_000_000_000), 0);
});
t('V49.3 sanity ceiling: 1,000,000 sats passes, 1,000,001 is refused', () => {
  assert.strictEqual(feeNum(1_000_000), 1_000_000);
  assert.strictEqual(feeNum(1_000_001), 0);
  assert.strictEqual(feeNum('999999'), 999999);
});
t('absent fee is 0, so the wallet calculates its own', () => {
  assert.strictEqual(feeNum(undefined), 0);
  assert.strictEqual(feeNum(null), 0);
  assert.strictEqual(feeNum(''), 0);
});
t('a negative fee is refused', () => assert.strictEqual(feeNum(-5000), 0));
t('a non-numeric fee is refused', () => assert.strictEqual(feeNum('drain'), 0));
t('an object fee is refused', () => assert.strictEqual(feeNum({ valueOf: () => 1e9 }), 0));
t('Infinity is refused', () => assert.strictEqual(feeNum(Infinity), 0));
t('a value beyond MAX_SAFE_INTEGER is refused rather than silently rounded', () => {
  assert.strictEqual(feeNum(Number.MAX_SAFE_INTEGER + 1000), 0);
});

t('no `.fee|0` remains anywhere in wallet.js', () => {
  const hits = walletSrc.match(/\.fee\s*\|\s*0/g) || [];
  assert.deepStrictEqual(hits, [], 'found ' + hits.length + ' surviving 32-bit fee cast(s)');
});
t('every fee call site goes through feeNum', () => {
  assert.ok(/feeNum\(params\.fee\)/.test(walletSrc), 'buildTx');
  // V49.3: pay / inscribe are planned in planForPending; sendTx inside buildTx
  assert.ok((walletSrc.match(/feeNum\(p\.params\.fee\)/g) || []).length >= 2, 'plan paths');
  assert.ok(!/buildSend\([^)]*p\.params\.fee\s*\)/.test(walletSrc), 'no raw page fee reaches buildSend');
});

/* ============================================================== *
 * K7 — signMessage had no domain separation
 * ============================================================== */
console.log('\nK7: a page cannot have registry authorizations signed');

t('the exact transfer payload from the audit is refused', () => {
  assert.strictEqual(
    reservedNamespaceOf('ordnet-registry|transfer|victim.web3|1AttackerAddr|1765000000'),
    'ordnet-registry');
});
for (const action of ['transfer', 'delist', 'list', 'set-target', 'subdomain', 'route']) {
  t(`registry action "${action}" is refused`, () => {
    assert.ok(reservedNamespaceOf(`ordnet-registry|${action}|x.web3|1Addr|1`));
  });
}
t('case and padding do not evade the guard', () => {
  assert.ok(reservedNamespaceOf('  ORDNET-Registry |transfer|x.web3|1|1'));
});
t('the ORDPAY purchase namespace is reserved too', () => {
  assert.strictEqual(reservedNamespaceOf('ORDPAY/v1 | shop:x | item:y'), 'ordpay/v1');
});
t('an ordinary message is still signable', () => {
  assert.strictEqual(reservedNamespaceOf('Login to example.com at 12:00'), null);
});
t('a message that merely mentions the namespace later is still signable', () => {
  assert.strictEqual(reservedNamespaceOf('I agree|ordnet-registry is a service'), null);
});
t('an empty message is not treated as reserved', () => {
  assert.strictEqual(reservedNamespaceOf(''), null);
});

t('the page-facing route calls the guarded variant, not the raw signer', () => {
  assert.ok(/p\.method==='signMessage'\)\{\s*result=Object\.assign\(signMessageExternal\(/.test(walletSrc),
    'the dApp signMessage path must use signMessageExternal');
});
t('internal signAction still uses the unguarded signer (registry keeps working)', () => {
  const fn = lift('signAction');
  assert.ok(/signMessage\(msg\)/.test(fn) && !/signMessageExternal/.test(fn));
});
t('the approval screen no longer promises a bare "No coins move."', () => {
  assert.ok(!/Sign this message with your key\. No coins move\.<\/p>/.test(walletSrc));
  assert.ok(/can authorise actions on any service that accepts it/.test(walletSrc));
});
t('the message is no longer sliced after escaping', () => {
  assert.ok(!/esc\(String\(p\.params\.message\)\)\.slice\(0,200\)/.test(walletSrc));
});

/* ============================================================== *
 * K5 — the approval screen showed X and signed Y
 * ============================================================== */
console.log('\nK5: the approval screen shows what is actually signed');

t('changeAddress is rendered', () => {
  assert.ok(/Change goes to|Change back to/.test(walletSrc));
});
t('a foreign change address is flagged, not just listed', () => {
  assert.ok(/chgForeign/.test(walletSrc));
  assert.ok(/This site is sending your change to an address that is not yours/.test(walletSrc));
});
t('an explicit fee is rendered and attributed to the site (V49.3: from the plan, with the clamp note)', () => {
  assert.ok(/Miner fee\$\{fi\.source==='site'\?' \(page\)'/.test(walletSrc));
  assert.ok(/set by the page/.test(walletSrc));
  assert.ok(/capped at 2× your wallet/.test(walletSrc));
});
t('script outputs disclose their destination, not only their amount', () => {
  // V49.3: every output is classified by txEffect() from the built bytes;
  // an unknown script is labelled as such by scriptDest()
  assert.ok(/const d=scriptDest\(hex\)/.test(walletSrc));
  assert.ok(/custom script \(/.test(walletSrc));
});
t('inscription outputs disclose their destination address', () => {
  assert.ok(/#\$\{o\.i\} Inscription[\s\S]{0,120}o\.dest/.test(walletSrc));
});
t('OP_RETURN text from the page is sliced before escaping, not after', () => {
  assert.ok(/esc\(String\(p\.params\.data\)\)\.slice\(0,80\)/.test(walletSrc));
});

/* ============================================================== *
 * K6 — the viewer sandbox was effectively disabled
 * ============================================================== */
console.log('\nK6: on-chain content cannot run in the extension origin');

t('the viewer iframe does NOT carry allow-same-origin', () => {
  const m = viewerHtml.match(/<iframe[^>]*id="viewFrame"[^>]*>/);
  assert.ok(m, 'viewFrame iframe not found');
  assert.ok(!/allow-same-origin/.test(m[0]),
    'allow-same-origin is back — combined with allow-scripts it cancels the sandbox');
});
t('the iframe is still sandboxed at all', () => {
  const m = viewerHtml.match(/<iframe[^>]*id="viewFrame"[^>]*>/);
  assert.ok(/sandbox="/.test(m[0]));
  assert.ok(/allow-scripts/.test(m[0]), 'on-chain apps still need their own scripts');
});
t('no other iframe in the viewer reintroduces the combination', () => {
  for (const tag of viewerHtml.match(/<iframe[^>]*>/g) || []) {
    assert.ok(!(/allow-scripts/.test(tag) && /allow-same-origin/.test(tag)), 'unsafe combo in ' + tag);
  }
});

console.log('\nservice worker: inscriber-chosen content types');
t('every inscription response goes through safeHeaders', () => {
  assert.ok(!/'Content-Type': ord\.ct/.test(swSrc), 'raw inscriber content type still served');
  assert.ok((swSrc.match(/safeHeaders\(ord\.ct\)/g) || []).length === 2);
});
t('nosniff is sent', () => assert.ok(/X-Content-Type-Options.*nosniff/.test(swSrc)));
t('content types outside the allowlist fall back to octet-stream', () => {
  const swCtx = { console };
  vm.createContext(swCtx);
  vm.runInContext(
    swSrc.slice(swSrc.indexOf('var SAFE_TYPES'), swSrc.indexOf("self.addEventListener('install'")),
    swCtx);
  assert.strictEqual(swCtx.safeHeaders('text/html')['Content-Type'], 'text/html');
  assert.strictEqual(swCtx.safeHeaders('image/png')['Content-Type'], 'image/png');
  assert.strictEqual(swCtx.safeHeaders('application/x-msdownload')['Content-Type'], 'application/octet-stream');
  assert.strictEqual(swCtx.safeHeaders('')['Content-Type'], 'application/octet-stream');
  assert.strictEqual(swCtx.safeHeaders(undefined)['Content-Type'], 'application/octet-stream');
});

/* ============================================================== *
 * Pattern 1 — ordinal protection was `value > 1` only
 * ============================================================== */
console.log('\npattern: padded ordinals are no longer spent as funding');

t('getUTXOs filters against known inscription outpoints', () => {
  const fn = lift('getUTXOs');
  assert.ok(/prot\.has\(/.test(fn), 'protected-outpoint filter missing from getUTXOs');
  assert.ok(/const prot\s*=\s*protectedOutpoints\(\)/.test(fn));
});
t('the value>1 heuristic is kept as a first line of defence', () => {
  assert.ok(/u\.value > 1/.test(lift('getUTXOs')));
});
t('the wallet chain tips are filtered too', () => {
  assert.ok(/!prot\.has\(t\.txid\+':'\+t\.vout\)/.test(lift('getUTXOs')));
});
t('protectedOutpoints reads the holdings the wallet already loaded', () => {
  const fn = lift('protectedOutpoints');
  assert.ok(/_holdings/.test(fn));
  assert.ok(/currentTxid/.test(fn), 'SNS/BSVmap holdings expose currentTxid/currentVout');
});
t('a padded ordinal outpoint is recognised regardless of its value', () => {
  const c = { Set, String, _holdings: [{ currentTxid: 'aa', currentVout: 3 }, { txid: 'bb', vout: 0 }] };
  c.globalThis = c; vm.createContext(c);
  vm.runInContext(lift('protectedOutpoints'), c);
  const set = c.protectedOutpoints();
  assert.ok(set.has('aa:3'), 'holdings outpoint not protected');
  assert.ok(set.has('bb:0'), 'alternate shape not protected');
  assert.ok(!set.has('cc:0'));
});

/* ============================================================== *
 * Pattern 3 — cosmetic security: a field shown but never checked
 * ============================================================== */
console.log('\npattern: the seller shown is the seller paid');

vm.runInContext(lift('checkListingOutput'), ctx);
const { checkListingOutput } = ctx;

const SELLER = '76a914' + '11'.repeat(20) + '88ac';
const ATTACKER = '76a914' + '22'.repeat(20) + '88ac';
const base = { outScriptHex: SELLER, outSats: 5000, priceSat: 5000, sellerScriptHex: SELLER, advertisedScriptHex: SELLER };

t('a genuine listing passes', () => {
  assert.strictEqual(checkListingOutput(base), null);
});
t('a payment output to anyone but the seller shown is refused', () => {
  const v = checkListingOutput({ ...base, outScriptHex: ATTACKER });
  assert.ok(v && /other than the seller shown/.test(v));
});
t('the attack the old check missed: attacker script advertised AND paid', () => {
  // Both fields came from the same page, so the old comparison succeeded.
  const v = checkListingOutput({ ...base, outScriptHex: ATTACKER, advertisedScriptHex: ATTACKER });
  assert.ok(v, 'a self-consistent pair of attacker-supplied values must still fail');
});
t('an advertised script that is not the seller is refused even when the output is right', () => {
  const v = checkListingOutput({ ...base, advertisedScriptHex: ATTACKER });
  assert.ok(v && /does not belong to the seller shown/.test(v));
});
t('a price mismatch is still caught', () => {
  assert.ok(checkListingOutput({ ...base, outSats: 1 }));
});
t('a missing payment output is caught', () => {
  assert.ok(checkListingOutput({ ...base, outScriptHex: null }));
});
t('hex case differences do not cause a false refusal', () => {
  assert.strictEqual(checkListingOutput({ ...base, outScriptHex: SELLER.toUpperCase() }), null);
});
t('the advertised script is optional and absence is not a pass-through', () => {
  assert.strictEqual(checkListingOutput({ ...base, advertisedScriptHex: undefined }), null);
  assert.ok(checkListingOutput({ ...base, outScriptHex: ATTACKER, advertisedScriptHex: undefined }));
});

t('the expected script is DERIVED from sellerAddress, not taken from params', () => {
  const fn = lift('buildPurchaseFromPartial');
  assert.ok(/buildPublicKeyHashOut\(bsv\.Address\.fromString\(String\(sellerAddress\)\)\)/.test(fn),
    'sellerScriptHex must be derived from the address the user was shown');
  assert.ok(!/out0\.script\.toHex\(\) !== payScriptHex/.test(fn),
    'the old params-against-params comparison is still there');
});
t('an unusable seller address is refused rather than skipped', () => {
  assert.ok(/not a valid address — refusing/.test(lift('buildPurchaseFromPartial')));
});

/* ============================================================== *
 * H4 / H7 — ported from the mobile wallets (2026-08-13 review)
 * ============================================================== */
console.log('\nH4: the origin comes from the browser, not the page');

t('background.js no longer prefers a page-supplied originator', () => {
  assert.ok(!/origin:\s*msg\.originator/.test(backgroundSrc),
    'msg.originator is still used as the origin');
});
t('the origin is taken from sender via a helper', () => {
  assert.ok(/origin:\s*senderOrigin\(sender\)/.test(backgroundSrc));
});
t('senderOrigin prefers sender.origin, which page script cannot set', () => {
  const i = backgroundSrc.indexOf('function senderOrigin');
  assert.ok(i !== -1, 'senderOrigin helper missing');
  const fn = backgroundSrc.slice(i, i + 400);
  assert.ok(/sender\.origin/.test(fn));
  assert.ok(fn.indexOf('sender.origin') < fn.indexOf('sender.tab'), 'sender.origin must win');
});
t('an unknown origin is refused rather than collapsed into one bucket', () => {
  assert.ok(/if \(!senderOrigin\(sender\)\)/.test(backgroundSrc));
});

console.log('\nH7: the BRC-100 read surface is gated');

t('listActions requires consent before it answers', () => {
  assert.ok(/'listActions'\)\{[\s\S]{0,120}brc100RequireReadConsent\(p\.origin, 'listActions'\)/.test(walletSrc));
});
t('listOutputs requires consent before it reads the UTXO set', () => {
  const i = walletSrc.indexOf("p.method==='listOutputs'");
  const seg = walletSrc.slice(i, i + 300);
  assert.ok(seg.indexOf('brc100RequireReadConsent') !== -1);
  assert.ok(seg.indexOf('brc100RequireReadConsent') < seg.indexOf('getUTXOs'),
    'consent must come before the wallet is read');
});
t('relinquishOutput confirms on every call', () => {
  assert.ok(/brc100RequireDestructive\(p\.origin, 'relinquishOutput'/.test(walletSrc));
});
t('relinquishCertificate confirms on every call too', () => {
  // Fixed for outputs in 4.9.0 and missed for certificates: any site could
  // delete any certificate, in a loop, with saveCerts persisting each one.
  assert.ok(/brc100RequireDestructive\(p\.origin, 'relinquishCertificate'/.test(walletSrc));
});
t('the confirmation happens BEFORE the certificate list is touched', () => {
  const i = walletSrc.indexOf("p.method==='relinquishCertificate'");
  // Strip comments first: the block documents the old bug and mentions
  // saveCerts() in prose, which an index search would read as code.
  const seg = walletSrc.slice(i, i + 1200).replace(/\/\/[^\n]*/g, '');
  const gate = seg.indexOf('brc100RequireDestructive');
  assert.ok(gate !== -1, 'no destructive gate on this branch');
  assert.ok(gate < seg.indexOf('loadCerts()'), 'consent must precede reading the list');
  assert.ok(gate < seg.indexOf('saveCerts('), 'consent must precede persisting the deletion');
});
t('destructive consent is deliberately NOT persisted as a grant', () => {
  const fn = lift('brc100RequireDestructive');
  assert.ok(!/_brc100Grants\.push/.test(fn),
    'a persisted grant would let a loop strip the wallet behind one approval');
});
t('every method in the destructive table is actually gated', () => {
  const i = walletSrc.indexOf('const BRC100_DESTRUCTIVE');
  const table = walletSrc.slice(i, walletSrc.indexOf('};', i));
  const methods = [...table.matchAll(/^\s*(\w+)\s*:\s*\{/gm)].map((m) => m[1]);
  assert.ok(methods.length >= 2, 'expected relinquishOutput and relinquishCertificate');
  for (const m of methods) {
    assert.ok(walletSrc.includes(`brc100RequireDestructive(p.origin, '${m}'`),
      `${m} is listed as destructive but never gated`);
  }
});
t('read grants are keyed per origin AND per method', () => {
  const fn = lift('brc100RequireReadConsent');
  assert.ok(/\$\{_address\}\|\$\{origin\}\|read\|\$\{method\}/.test(fn));
});
t('a denied read throws WERR_PERMISSION_DENIED rather than returning empty', () => {
  assert.ok(/WERR_PERMISSION_DENIED[\s\S]{0,80}denied read access/.test(lift('brc100RequireReadConsent')));
});

console.log('\nevery permission call passes origin first');

t('brc100RequirePermission is always called as (origin, method, args)', () => {
  // One call site had ('listCertificates', args, origin), so the grant key
  // became `${_address}|listCertificates|…` and every site shared one bucket:
  // approve on one dApp, inherited by all. Same class as H4, one line.
  const calls = [...walletSrc.matchAll(/brc100RequirePermission\(([^)]*)\)/g)]
    .map((m) => m[1].trim())
    .filter((a) => !a.startsWith('origin, method'));   // skip the definition
  assert.ok(calls.length >= 2, 'expected at least two call sites');
  for (const args of calls) {
    assert.ok(/^p\.origin\b/.test(args),
      `first argument must be the origin, got: ${args}`);
  }
});

t('no consent helper offers a title for a method it never handles', () => {
  // Comments may mention it; the titles/details tables may not, because an
  // entry there is dead code pretending to be coverage.
  const fn = lift('brc100RequireReadConsent').replace(/\/\/[^\n]*/g, '');
  assert.ok(!/listCertificates\s*:/.test(fn),
    'listCertificates routes through brc100RequirePermission, not through read consent');
});

console.log('\n' + '='.repeat(46));
console.log(`  ${pass} passed, ${fail} failed`);
console.log('='.repeat(46));
process.exit(fail ? 1 : 0);
