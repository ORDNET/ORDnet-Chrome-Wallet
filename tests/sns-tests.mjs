// ORD/plug V41 — SNS resolver verification tests
// Run with: node tests/sns-tests.mjs
// Loads the exact same lib/bsv.min.js + src/sns-verify.js that the extension
// ships and checks BOTH skill.md §6 test vectors, a live captured resolver
// answer, 9 signed-field mutations and the rotation-deed chain — the same
// referee as the iOS app's Tests/engine-tests.mjs (v2.2.0).
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
globalThis.window = globalThis; globalThis.self = globalThis;
(0, eval)(readFileSync(join(here, '../lib/bsv.min.js'), 'utf8'));
(0, eval)(readFileSync(join(here, '../src/sns-verify.js'), 'utf8'));

let passed = 0, failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log('  ✓', name); }
  else { failed++; console.log('  ✗ FAIL:', name); }
}

console.log('— SNS resolver verification (skill.md test vectors are the referee) —');
// test vector 1: resolve answer (skill.md §6)
const tvFields = ['1','ordnet.web3','alexander','76a914e8e5f64b0c7943b93e58b24e3f82d533e70b3db188ac',
  '367a0a1d553002f0f3427168a10f86835e2741c111df43262d35fb475400e3ee','0',
  'dc54c20af97682eebf99dc8392c21b904908398d543aae6fabffe09a9b7780ac','0',
  '959941','true','1785312000'];
check('answer sighash reproduces test vector 28a4252e…ec6b',
  snsSighashHex('ORDNS-RESOLVE', tvFields)
  === '28a4252e92fdcdb70d6fd287cdb602cda504d288963e106b47a6d8d19420ec6b');
// test vector 2: rotation deed (skill.md §6, v1.3)
check('rotation sighash reproduces test vector ddc9eefe…cb31',
  snsSighashHex('ORDNS-KEYROTATE', ['1','1',
    '034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa',
    '02466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f27','1785500000'])
  === 'ddc9eefe6e0097a6312171f0dad76b6822e08f31498bd7f47f51ba163481cb31');

// live answer captured from https://sns.ordnet.io/resolve/ditiseentest.web3 on 03-08-2026
const liveAnswer = {"ok":true,"v":1,"input":"ditiseentest.web3","name":"ditiseentest.web3","mailbox":"","source":"sns","fallback":false,
  "holder_address":"1NdU53DPAv7ftxoWDpM9c5P4nx1hFnJ6Ry","holder_script":"76a914ed403671607a9d077082219581c5328b8fa2d55088ac",
  "origin":{"txid":"5bebe49ade63904afd9ff4afb6b2562897b788c5680fba5f37cbbbe47897948f","vout":0},
  "current":{"txid":"5bebe49ade63904afd9ff4afb6b2562897b788c5680fba5f37cbbbe47897948f","vout":0},
  "as_of_height":960687,"expires":1785764663,
  "sig":"3045022100916f0d3855b83d045383ee1fe2d0b5c0719d3c956e35c00dc695c913677066cd02203d4614479e1d8704c682dc56507b1cee2fec6fd5dacb579679ffb8060b78092d",
  "signer":"03088f1da3bfc998c1bc7bbc1ffcb7d96c47e094624a52d78406f8c3105b0d0b46"};
const PIN = '03088f1da3bfc998c1bc7bbc1ffcb7d96c47e094624a52d78406f8c3105b0d0b46';
const okV = snsVerifyAnswer(JSON.stringify(liveAnswer), PIN, 1785764000);
check('live answer verifies against the pinned key', okV.valid === true);
check('holder address is DERIVED from the signed script',
  okV.holderAddress === '1NdU53DPAv7ftxoWDpM9c5P4nx1hFnJ6Ry' && okV.addressMismatch === false);
check('expired answer is rejected',
  snsVerifyAnswer(JSON.stringify(liveAnswer), PIN, 1785764664).valid === false);
check('unknown signer is flagged for the rotation path',
  snsVerifyAnswer(JSON.stringify({ ...liveAnswer, signer: '02' + 'ab'.repeat(32) }), PIN, 1785764000).reason === 'unknown_signer');
// manipulation test: every SIGNED field flipped individually must fail
const mutations = [
  ['name', 'ordnet.web3'], ['mailbox', 'x'], ['holder_script', '76a914' + '00'.repeat(20) + '88ac'],
  ['fallback', true], ['as_of_height', 960688], ['expires', 1785764664 + 999],
  ['origin', { txid: '11'.repeat(32), vout: 0 }], ['current', { txid: '22'.repeat(32), vout: 1 }], ['v', 2]
];
let allRejected = true;
for (const [k, val] of mutations) {
  const m = { ...liveAnswer, [k]: val };
  const r = snsVerifyAnswer(JSON.stringify(m), PIN, 1785764000);
  if (r.valid !== false) { allRejected = false; console.log('    ! mutation survived:', k); }
}
check('every mutated signed field breaks verification (9 mutations)', allRejected);
// unsigned fields may differ without breaking the signature — mismatch is flagged
const mm = snsVerifyAnswer(JSON.stringify({ ...liveAnswer, holder_address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH' }), PIN, 1785764000);
check('unsigned holder_address mismatch is flagged, signed script wins',
  mm.valid === true && mm.addressMismatch === true && mm.holderAddress === '1NdU53DPAv7ftxoWDpM9c5P4nx1hFnJ6Ry');

// rotation chain: build a real signed deed with fresh keys, prove it, tamper it
const oldPk = bsv.PrivateKey.fromRandom(), newPk = bsv.PrivateKey.fromRandom();
const oldPub = oldPk.toPublicKey().toString().toLowerCase(), newPub = newPk.toPublicKey().toString().toLowerCase();
const rotHash = snsSighashHex('ORDNS-KEYROTATE', ['1', '1', oldPub, newPub, '1785500000']);
const rotSig = bsv.crypto.ECDSA.sign(bsv.deps.Buffer.from(rotHash, 'hex'), oldPk).toString();
const deed = { rv: 1, seq: 1, old_pub: oldPub, new_pub: newPub, valid_from: 1785500000, sig: rotSig };
check('valid succession deed re-pins to the new key',
  snsVerifyRotationChain(oldPub, [deed]) === newPub);
let rotRejected = false;
try { snsVerifyRotationChain(oldPub, [{ ...deed, new_pub: '02' + 'cd'.repeat(32) }]); }
catch (e) { rotRejected = /invalid signature/.test(e.message); }
check('tampered deed is refused, pin untouched', rotRejected);
let chainRejected = false;
try { snsVerifyRotationChain('02' + 'ef'.repeat(32), [deed]); }
catch (e) { chainRejected = /does not connect/.test(e.message); }
check('deed that does not connect to the pin is refused', chainRejected);

// scriptLockAddress — the shared helper both SNS and the OpNS
// trust-but-verify path rely on
check('scriptLockAddress derives the P2PKH address',
  scriptLockAddress('76a914ed403671607a9d077082219581c5328b8fa2d55088ac') === '1NdU53DPAv7ftxoWDpM9c5P4nx1hFnJ6Ry');
check('scriptLockAddress refuses a non-P2PKH script',
  scriptLockAddress('6a0a4f52446e65742e696f') === null);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
