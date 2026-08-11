// V46 tests — certificate holder subset + x402 client engine.
// Run: node tests/v46-certs-x402-tests.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert';

const dir = new URL('..', import.meta.url).pathname;
const ctx = { window: {}, self: {}, console, Buffer, TextEncoder, TextDecoder };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(dir + 'src/brc100-certs.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(dir + 'src/x402-client.js', 'utf8'), ctx);
const CE = ctx.OrdplugCerts, XC = ctx.OrdplugX402;
assert(CE && XC, 'engines failed to load');

const OUR = '02' + 'a'.repeat(64);
const CERTIFIER = '03' + 'b'.repeat(64);
function goodCert(over) {
  return Object.assign({ type: 'YWdlLXZlcmlmaWNhdGlvbg==', serialNumber: 'sn-001',
    subject: OUR, certifier: CERTIFIER, revocationOutpoint: 'c'.repeat(64) + ':0',
    signature: '3045deadbeef', fields: { over18: 'true', country: 'NL' },
    acquisitionProtocol: 'direct' }, over || {});
}

let pass = 0, fail = 0;
function t(name, fn) { try { fn(); console.log('  \u2713 ' + name); pass++; } catch (e) { console.log('  \u2717 ' + name + ' \u2014 ' + e.message); fail++; } }

console.log('Certificates — holder subset');
t('valid direct certificate is accepted', () => {
  const c = CE.validateForAcquire(goodCert(), OUR);
  assert.strictEqual(c.serialNumber, 'sn-001');
});
t('interactive issuance protocol is refused, not faked', () => {
  assert.throws(() => CE.validateForAcquire(goodCert({ acquisitionProtocol: 'issuance' }), OUR),
    e => e.name === 'WERR_UNSUPPORTED_ACTION');
});
t('encrypted-field keyrings are refused', () => {
  assert.throws(() => CE.validateForAcquire(goodCert({ keyringForSubject: { over18: 'enc' } }), OUR),
    e => e.name === 'WERR_UNSUPPORTED_ACTION');
});
t('a certificate for someone else\u2019s identity key is refused', () => {
  assert.throws(() => CE.validateForAcquire(goodCert({ subject: '02' + 'f'.repeat(64) }), OUR),
    e => /not this wallet/i.test(e.message));
});
t('list filters by certifier and type, paginates', () => {
  const store = [CE.validateForAcquire(goodCert(), OUR), CE.validateForAcquire(goodCert({ serialNumber: 'sn-002', certifier: '03' + 'c'.repeat(64) }), OUR)];
  const r = CE.listCertificates(store, { certifiers: [CERTIFIER] });
  assert.strictEqual(r.totalCertificates, 1);
  assert.strictEqual(r.certificates[0].serialNumber, 'sn-001');
  assert.strictEqual(r.certificates[0].signatureVerifiedByWallet, false);
});
t('prove reveals ONLY user-approved fields', () => {
  const store = [CE.validateForAcquire(goodCert(), OUR)];
  const r = CE.proveCertificate(store, { certificate: { serialNumber: 'sn-001' }, fieldsToReveal: ['over18'], verifier: '02' + 'd'.repeat(64) }, ['over18']);
  assert.deepStrictEqual(Object.keys(r.certificate.fields), ['over18']);
  assert.strictEqual(r.signatureVerifiedByWallet, false);
});
t('prove refuses a field the user did not approve', () => {
  const store = [CE.validateForAcquire(goodCert(), OUR)];
  assert.throws(() => CE.proveCertificate(store, { certificate: { serialNumber: 'sn-001' }, fieldsToReveal: ['over18', 'country'], verifier: '02' + 'd'.repeat(64) }, ['over18']),
    e => e.name === 'WERR_PERMISSION_DENIED');
});
t('prove refuses a field the certificate lacks', () => {
  const store = [CE.validateForAcquire(goodCert(), OUR)];
  assert.throws(() => CE.proveCertificate(store, { certificate: { serialNumber: 'sn-001' }, fieldsToReveal: ['ssn'], verifier: '02' + 'd'.repeat(64) }, ['ssn']),
    e => /no field/i.test(e.message));
});
t('relinquish removes exactly one matching certificate', () => {
  const store = [CE.validateForAcquire(goodCert(), OUR)];
  const r = CE.relinquishCertificate(store, { serialNumber: 'sn-001', certifier: CERTIFIER });
  assert.strictEqual(r.relinquished, true);
  assert.strictEqual(store.length, 0);
  assert.throws(() => CE.relinquishCertificate(store, { serialNumber: 'sn-001' }));
});

console.log('x402 client');
function req(over) {
  return { x402Version: 2, accepts: [Object.assign({ scheme: 'exact', network: 'bsv',
    maxAmountRequired: '25', payTo: '1BitcoinEaterAddressDontSendf59kuE',
    resource: 'GET /paid/chaininfo', description: 'live chain info',
    extra: { invoiceId: 'inv-123' } }, over || {})] };
}
t('valid 402 body parses to a normalized invoice', () => {
  const inv = XC.parsePaymentRequired(req());
  assert.strictEqual(inv.satoshis, 25);
  assert.strictEqual(inv.invoiceId, 'inv-123');
});
t('accepts the same body as a JSON string and as Base64 header', () => {
  const j = JSON.stringify(req());
  assert.strictEqual(XC.parsePaymentRequired(j).satoshis, 25);
  const b64 = Buffer.from(j, 'utf8').toString('base64');
  assert.strictEqual(XC.parsePaymentRequired(b64).satoshis, 25);
});
t('refuses a wrong x402 version', () => {
  assert.throws(() => XC.parsePaymentRequired({ x402Version: 1, accepts: [] }), e => /version/i.test(e.message));
});
t('refuses non-bsv schemes wholesale', () => {
  assert.throws(() => XC.parsePaymentRequired({ x402Version: 2, accepts: [{ scheme: 'exact', network: 'base-sepolia', maxAmountRequired: '10', payTo: 'x', extra: { invoiceId: 'i' } }] }),
    e => e.name === 'WERR_UNSUPPORTED_ACTION');
});
t('refuses a missing invoiceId (uncorrelatable payment)', () => {
  assert.throws(() => XC.parsePaymentRequired(req({ extra: {} })), e => /invoiceId/i.test(e.message));
});
t('refuses amounts over the hard cap', () => {
  assert.throws(() => XC.parsePaymentRequired(req({ maxAmountRequired: String(XC.MAX_SATS + 1) })), e => /cap/i.test(e.message));
});
t('refuses non-integer amounts', () => {
  assert.throws(() => XC.parsePaymentRequired(req({ maxAmountRequired: '10.5' })));
  assert.throws(() => XC.parsePaymentRequired(req({ maxAmountRequired: '-3' })));
});
t('X-PAYMENT header round-trips through the facilitator shape', () => {
  const inv = XC.parsePaymentRequired(req());
  const hdr = XC.buildXPaymentHeader(inv, 'deadbeef'.repeat(10));
  const back = XC._b64ToJson(hdr);
  assert.strictEqual(back.x402Version, 2);
  assert.strictEqual(back.scheme, 'exact');
  assert.strictEqual(back.network, 'bsv');
  assert.strictEqual(back.payload.invoiceId, 'inv-123');
  assert.strictEqual(back.payload.rawTx, 'deadbeef'.repeat(10));
});
t('header builder refuses junk rawTx', () => {
  const inv = XC.parsePaymentRequired(req());
  assert.throws(() => XC.buildXPaymentHeader(inv, 'not-hex!'));
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
