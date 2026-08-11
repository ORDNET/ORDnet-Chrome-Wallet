// ORD/plug V42 — chain mechanism + BRC-100 + inscription-parser tests
// Run with: node tests/v42-tests.mjs
// Loads the exact same lib/bsv.min.js + lib/bsv-sdk-bundle.js the extension
// ships, plus src/sns-verify.js and src/ord-parse.js, and extracts the pure
// engine functions from src/wallet.js (txSpendInfo, brc100ValidateCreate,
// brc100ParseInternalize, brc100ListOutputsCalc) so node tests the SAME code
// the popup runs — the same referee as the iOS app's engine-tests (v2.6.2).
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
globalThis.window = globalThis; globalThis.self = globalThis;
(0, eval)(readFileSync(join(here, '../lib/bsv.min.js'), 'utf8'));
(0, eval)(readFileSync(join(here, '../lib/bsv-sdk-bundle.js'), 'utf8'));
(0, eval)(readFileSync(join(here, '../src/sns-verify.js'), 'utf8'));
(0, eval)(readFileSync(join(here, '../src/ord-parse.js'), 'utf8'));

// --- extract the pure functions from wallet.js (brace matching) ---
const walletSrc = readFileSync(join(here, '../src/wallet.js'), 'utf8');
function extractFn(name){
  const idx = walletSrc.search(new RegExp('(?:async )?function ' + name + '\\('));
  if (idx < 0) throw new Error('function not found: ' + name);
  let depth = 0, started = false, end = idx;
  for (let i = idx; i < walletSrc.length; i++){
    const c = walletSrc[i];
    if (c === '{'){ depth++; started = true; }
    if (c === '}'){ depth--; if (started && depth === 0){ end = i + 1; break; } }
  }
  return walletSrc.slice(idx, end);
}
// stubs the extracted functions rely on (values verbatim from wallet.js) —
// assigned to globalThis so the indirectly-eval'd functions can see them
globalThis.SENDTX_MAX_OUTPUTS = 350;
globalThis.FEE_RATE = 0.15;
globalThis.TOTAL_SERVICE_FEES = 3996;
globalThis.satNum = v => { const n = Math.round(Number(v) || 0); return n > 0 ? n : 0; };
globalThis.brc100Err = (name, code, message) => { const e = new Error(message); e.name = name; e.code = code; return e; };
for (const fn of ['txSpendInfo','_werr','_validDesc','_validLabel','_validHexScript','_sdk',
                  'brc100ValidateCreate','brc100ParseInternalize','brc100ListOutputsCalc']){
  (0, eval)(extractFn(fn));
}

let passed = 0, failed = 0;
function check(name, cond){
  if (cond) { passed++; console.log('  ✓', name); }
  else { failed++; console.log('  ✗ FAIL:', name); }
}

const wif = 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn';
const pk = bsv.PrivateKey.fromWIF(wif);
const addr = pk.toAddress().toString();
const p2pkhHex = bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(addr)).toHex();

console.log('— chain mechanism (v2.3 parity): txSpendInfo —');
{
  // split-like tx: 3 × 5000 to self + change to self
  const fund = new bsv.Transaction.UnspentOutput({
    txid: '11'.repeat(32), outputIndex: 0, address: addr, script: p2pkhHex, satoshis: 60000 });
  const tx = new bsv.Transaction().from(fund)
    .to(addr, 5000).to(addr, 5000).to(addr, 5000)
    .change(addr).fee(200).sign(pk);
  const info = txSpendInfo(tx.toString(), addr);
  check('txSpendInfo: reports spent inputs + own >1-sat outputs (split + change)',
    info.txid === tx.id && info.inputs.length === 1
    && info.inputs[0].txid === '11'.repeat(32) && info.inputs[0].vout === 0
    && info.ownOutputs.filter(o => o.satoshis === 5000).length === 3
    && info.ownOutputs.length === 4 && info.ownOutputs.every(o => o.satoshis > 1));

  // inscribe-like tx: 1-sat envelope output to self must NOT become a tip
  const ins = new bsv.Script();
  ins.add(bsv.Opcode.OP_FALSE); ins.add(bsv.Opcode.OP_IF);
  ins.add(bsv.deps.Buffer.from('ord','utf8'));
  ins.add(bsv.Opcode.OP_1); ins.add(bsv.deps.Buffer.from('text/plain','utf8'));
  ins.add(bsv.Opcode.OP_0); ins.add(bsv.deps.Buffer.from('hello ordner','utf8'));
  ins.add(bsv.Opcode.OP_ENDIF);
  const lock = bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(addr));
  const finalScript = new bsv.Script();
  ins.chunks.forEach(c => finalScript.chunks.push(c));
  lock.chunks.forEach(c => finalScript.chunks.push(c));
  const insTx = new bsv.Transaction().from(fund);
  insTx.addOutput(new bsv.Transaction.Output({ satoshis: 1, script: finalScript }));
  insTx.change(addr).fee(200).sign(pk);
  const insInfo = txSpendInfo(insTx.toString(), addr);
  check('txSpendInfo on an inscribe: the 1-sat ordinal output is NOT a spendable tip',
    insInfo.ownOutputs.every(o => o.satoshis > 1));

  console.log('— inscription parser (ORD/ner previews) —');
  const ord = extractFirstOrd(insTx.toString());
  check('extractFirstOrd finds the envelope (content type + data round-trip)',
    ord !== null && ord.ct === 'text/plain'
    && Buffer.from(ord.dataB64, 'base64').toString('utf8') === 'hello ordner');
  const ordAt = extractOrd(insTx.toString(), 0);
  check('extractOrd finds the envelope at the exact vout', ordAt !== null && ordAt.ct === 'text/plain');
}

console.log('— BRC-100 fase 3: validatie, internalize, listOutputs (iOS 69-test parity) —');
{
  const S = globalThis.BSVSDK;
  const vErr = (args) => brc100ValidateCreate(JSON.stringify(args));
  const goodOut = { satoshis: 1500, lockingScript: p2pkhHex, outputDescription: 'test output one' };

  let r = vErr({ description: 'kort', outputs: [goodOut] });
  check('createAction: te korte description -> WERR_INVALID_PARAMETER',
    r.valid === false && r.werr.name === 'WERR_INVALID_PARAMETER');
  r = vErr({ description: 'geldige omschrijving', inputs: [{}], outputs: [goodOut] });
  check('createAction: custom inputs -> WERR_UNSUPPORTED_ACTION (regel 1)',
    r.valid === false && r.werr.name === 'WERR_UNSUPPORTED_ACTION');
  r = vErr({ description: 'geldige omschrijving', outputs: [{ ...goodOut, lockingScript: 'zz' }] });
  check('createAction: ongeldige scripthex -> WERR_INVALID_PARAMETER',
    r.valid === false && /lockingScript/.test(r.werr.message));
  r = vErr({ description: 'geldige omschrijving', outputs: [{ ...goodOut, satoshis: 0 }] });
  check('createAction: 0-sat output -> geweigerd als dust',
    r.valid === false && /satoshis/.test(r.werr.message));
  r = vErr({ description: 'geldige omschrijving', outputs: [{ ...goodOut, basket: 'todo tokens' }] });
  check('createAction: output-basket -> expliciet geweigerd (geen basket-boekhouding)',
    r.valid === false && /basket/.test(r.werr.message));
  r = vErr({ description: 'geldige omschrijving', outputs: [goodOut], options: { noSend: true } });
  check('createAction: options.noSend -> expliciet geweigerd',
    r.valid === false && /noSend/.test(r.werr.message));
  r = vErr({ description: 'betaling aan testadres', outputs: [goodOut, { ...goodOut, satoshis: 500 }], labels: ['Fase3', 'test'] });
  check('createAction: geldige args -> genormaliseerd (totaal, dest, labels lowercase)',
    r.valid === true && r.totalSat === 2000 && r.outputs[0].dest === addr &&
    JSON.stringify(r.labels) === JSON.stringify(['fase3', 'test']) &&
    r.serviceFees === 3996 && r.randomizeOutputs === true);

  // internalizeAction: AtomicBEEF round-trip via the extended SDK bundle
  const lockM = new S.P2PKH().lock(addr);
  const rootS = new S.Transaction(); rootS.addOutput({ lockingScript: lockM, satoshis: 9000 });
  const payS = new S.Transaction();
  payS.addInput({ sourceTransaction: rootS, sourceOutputIndex: 0,
    unlockingScriptTemplate: new S.P2PKH().unlock(S.PrivateKey.fromWif(wif)) });
  payS.addOutput({ lockingScript: lockM, satoshis: 5000 });
  await payS.sign();
  const beefBytes = Array.from(payS.toAtomicBEEF());
  let ir = brc100ParseInternalize(JSON.stringify({
    description: 'inkomende testbetaling', tx: beefBytes,
    outputs: [{ outputIndex: 0, protocol: 'wallet payment' }] }), addr);
  check('internalizeAction: AtomicBEEF geparsed, output aan wallet-adres geaccepteerd',
    ir.valid === true && ir.totalSat === 5000 && ir.txid === payS.id('hex'));
  ir = brc100ParseInternalize(JSON.stringify({
    description: 'inkomende testbetaling', tx: beefBytes,
    outputs: [{ outputIndex: 0, protocol: 'basket insertion' }] }), addr);
  check('internalizeAction: basket insertion -> expliciet geweigerd',
    ir.valid === false && /basket/.test(ir.werr.message));
  const addrX = bsv.PrivateKey.fromRandom().toAddress().toString();
  ir = brc100ParseInternalize(JSON.stringify({
    description: 'inkomende testbetaling', tx: beefBytes,
    outputs: [{ outputIndex: 0, protocol: 'wallet payment' }] }), addrX);
  check('internalizeAction: output aan vreemd adres -> expliciet geweigerd (geen BRC-29 stil)',
    ir.valid === false && /derived|address/.test(ir.werr.message));
  ir = brc100ParseInternalize(JSON.stringify({
    description: 'inkomende testbetaling', tx: [1,2,3],
    outputs: [{ outputIndex: 0, protocol: 'wallet payment' }] }), addr);
  check('internalizeAction: kapotte BEEF -> WERR_INVALID_PARAMETER',
    ir.valid === false && ir.werr.name === 'WERR_INVALID_PARAMETER');

  // listOutputs over a simulated live UTXO set
  const many = Array.from({ length: 15 }, (_, i) => ({ txid: 'aa'.repeat(32), vout: i, satoshis: 1000 + i, script: p2pkhHex }));
  let lo = brc100ListOutputsCalc(many, JSON.stringify({}));
  check('listOutputs: default basket, paginering default 10',
    lo.valid === true && lo.totalOutputs === 15 && lo.outputs.length === 10 &&
    lo.outputs[0].outpoint === 'aa'.repeat(32) + '.0' && lo.outputs[0].spendable === true);
  lo = brc100ListOutputsCalc(many, JSON.stringify({ limit: 5, offset: 12, include: 'locking scripts' }));
  check('listOutputs: limit/offset + locking scripts',
    lo.valid === true && lo.outputs.length === 3 && lo.outputs[0].lockingScript === p2pkhHex);
  lo = brc100ListOutputsCalc(many, JSON.stringify({ basket: 'todo tokens' }));
  check('listOutputs: vreemde basket -> expliciet geweigerd (geen stille lege lijst)',
    lo.valid === false && lo.werr.name === 'WERR_INVALID_PARAMETER');
}

console.log('— BRC-100 fase 2: ProtoWallet uit de gebundelde @bsv/sdk —');
{
  const S = globalThis.BSVSDK;
  const w = new S.ProtoWallet(S.PrivateKey.fromWif(wif));
  const idk = await w.getPublicKey({ identityKey: true });
  check('getPublicKey(identityKey): deterministisch = de wallet-pubkey',
    idk.publicKey === pk.toPublicKey().toString());
  const enc = await w.encrypt({ plaintext: Array.from(Buffer.from('geheim bericht', 'utf8')),
    protocolID: [1, 'ordnet test'], keyID: '1' });
  const dec = await w.decrypt({ ciphertext: enc.ciphertext,
    protocolID: [1, 'ordnet test'], keyID: '1' });
  check('encrypt → decrypt round-trip (BRC-42/43, self)',
    Buffer.from(dec.plaintext).toString('utf8') === 'geheim bericht');
  const sig = await w.createSignature({ data: Array.from(Buffer.from('sign dit', 'utf8')),
    protocolID: [1, 'ordnet test'], keyID: '1', counterparty: 'self' });
  const ver = await w.verifySignature({ data: Array.from(Buffer.from('sign dit', 'utf8')),
    signature: sig.signature, protocolID: [1, 'ordnet test'], keyID: '1', counterparty: 'self' });
  check('createSignature → verifySignature round-trip', ver.valid === true);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
