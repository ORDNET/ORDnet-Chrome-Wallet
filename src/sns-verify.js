/* =========================================================================
   ORD/plug — SNS resolver verification (sns.ordnet.io, resolver v1.3)
   V41: 1-to-1 port of the iOS app's engine code (wallet-core.js v2.2.0).
   Canonical sighash per skill.md §6: prefix + 0x1f + fields joined with 0x1f,
   double-SHA256; ECDSA(secp256k1) DER over that digest. Verify-only: no key
   material, no network — wallet.js fetches, this code proves. NO own crypto:
   sha256d and ECDSA come from the battle-tested bsv.min.js.
   Acceptance (both skill.md test vectors) is enforced in tests/sns-tests.mjs:
     answer sighash   28a4252e92fdcdb70d6fd287cdb602cda504d288963e106b47a6d8d19420ec6b
     rotation sighash ddc9eefe6e0097a6312171f0dad76b6822e08f31498bd7f47f51ba163481cb31
   Loaded as a plain script BEFORE wallet.js (browser) and via eval in the
   node test harness — no module syntax on purpose.
   ========================================================================= */

var SNS_SEP = '\x1f';

/* P2PKH lock script hex -> address string (null if not derivable) — used by
   both the SNS answer verification and the OpNS trust-but-verify path. */
function scriptLockAddress(scriptHex){
  try{
    var s=bsv.Script.fromHex(scriptHex); var lockPkh=null;
    s.chunks.forEach(function(c){ if(c.buf && c.buf.length===20) lockPkh=c.buf; });
    if(!lockPkh) return null;
    return bsv.Address.fromPublicKeyHash(lockPkh).toString();
  }catch(e){ return null; }
}

function snsSighashHex(prefix, fields){
  var pre = prefix + SNS_SEP + fields.map(String).join(SNS_SEP);
  return bsv.crypto.Hash.sha256sha256(bsv.deps.Buffer.from(pre, 'utf8')).toString('hex');
}

/* signed fields of a resolve answer, in canonical order (skill.md §6).
   NOT signed (and therefore never trusted): input, source, holder_address,
   signer — the display address is derived from the SIGNED holder_script. */
function snsAnswerFields(a){
  return [ a.v, a.name, (a.mailbox == null ? '' : a.mailbox), a.holder_script,
           a.origin.txid, a.origin.vout, a.current.txid, a.current.vout,
           a.as_of_height, (a.fallback ? 'true' : 'false'), a.expires ];
}

function snsEcdsaVerify(digestHex, sigDerHex, pubkeyHex){
  var digest = bsv.deps.Buffer.from(digestHex, 'hex');
  var sig = bsv.crypto.Signature.fromDER(bsv.deps.Buffer.from(sigDerHex, 'hex'));
  var pub = bsv.PublicKey.fromString(pubkeyHex);
  return bsv.crypto.ECDSA.verify(digest, sig, pub) === true;
}

/* verify one ok-answer against the pinned resolver key.
   Returns { valid, reason?, ... } — reason 'unknown_signer' is the caller's
   cue to run the rotation-chain path; everything else is terminal. */
function snsVerifyAnswer(answerJson, expectedSigner, nowTs){
  var a = typeof answerJson === 'string' ? JSON.parse(answerJson) : answerJson;
  if (!a || a.ok !== true || !a.sig || !a.signer || !a.holder_script || !a.current)
    return { valid:false, reason:'malformed' };
  var signer = String(a.signer).toLowerCase();
  if (signer !== String(expectedSigner || '').toLowerCase())
    return { valid:false, reason:'unknown_signer', signer:signer };
  var digestHex = snsSighashHex('ORDNS-RESOLVE', snsAnswerFields(a));
  if (!snsEcdsaVerify(digestHex, String(a.sig), signer))
    return { valid:false, reason:'bad_signature' };
  if (Number(a.expires) <= Number(nowTs))
    return { valid:false, reason:'expired' };
  var derived = scriptLockAddress(String(a.holder_script));
  if (!derived)
    return { valid:false, reason:'unsupported_holder_script' };
  return {
    valid: true,
    name: String(a.name),
    mailbox: String(a.mailbox == null ? '' : a.mailbox),
    fallback: a.fallback === true,
    holderAddress: derived,               // derived from the SIGNED script
    addressMismatch: !!(a.holder_address && a.holder_address !== derived),
    currentTxid: String(a.current.txid),
    currentVout: Number(a.current.vout) || 0,
    asOfHeight: Number(a.as_of_height) || 0,
    expires: Number(a.expires)
  };
}

/* key rotation (v1.3): succession deeds signed by the OLD key. Walk the chain
   from the pinned key; only a closing chain moves the pin. Returns the final
   pubkey; throws with a clear message otherwise. */
function snsRotationFields(r){
  return [ r.rv, r.seq, String(r.old_pub).toLowerCase(), String(r.new_pub).toLowerCase(), r.valid_from ];
}
function snsVerifyRotationChain(pinnedPub, records){
  if (typeof records === 'string') records = JSON.parse(records);
  if (!Array.isArray(records) || !records.length)
    throw new Error('No rotation records to verify.');
  var cur = String(pinnedPub).toLowerCase();
  for (var i = 0; i < records.length; i++){
    var r = records[i];
    if (String(r.old_pub).toLowerCase() !== cur)
      throw new Error('Rotation record ' + i + ' does not connect to the pinned key — chain broken.');
    var digestHex = snsSighashHex('ORDNS-KEYROTATE', snsRotationFields(r));
    if (!snsEcdsaVerify(digestHex, String(r.sig), cur))
      throw new Error('Rotation record ' + i + ' carries an invalid signature — refusing to re-pin.');
    cur = String(r.new_pub).toLowerCase();
  }
  return cur;
}
