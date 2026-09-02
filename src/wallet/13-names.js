/* =========================================================================
   v4.1 — name payments (OpNS + SNS), ported 1-to-1 from the iOS app
   v2.1/v2.2. Recognition is strictly separated: dotted names (+ optional
   mailbox@) → SNS resolver; bare names → OpNS; anything else with @ →
   inline paymail refusal. Input is ascii-lowercase by construction, so
   homograph/mixed-script strings never reach a payment path.
   ========================================================================= */

/* v4.1.1 — spent-check via the dedicated outpoint endpoint (iOS v2.2.3 fix).
   GET /tx/<txid>/<vout>/spent:
     200 = outpoint is SPENT (body carries the spending txid)
     404 = outpoint is UNSPENT — this is the SUCCESS outcome, explicitly
           caught here and never allowed to fall into a generic error path
     429 = rate-limit: back off and retry (3 attempts, 400 ms doubling)
     timeout / 5xx / network error = status UNKNOWN (null) — may NEVER be
           reported as "spent"
   The old address-unspent-list check is REMOVED (not kept as fallback):
   WhatsOnChain silently truncates that list on busy addresses (fee
   addresses, custody, marketplaces), so absence in the list proves NOTHING
   — that produced false stale_outpoint refusals (live case 03-08-2026:
   start.web3, holder = busy ORDnet fee address 1EXupec…vLv8). */
async function outpointSpent(txid, vout){
  let delay=400;
  for(let attempt=0; attempt<3; attempt++){
    let r=null;
    try{ r=await fetch(`${API_BASE}/tx/${txid}/${vout}/spent`); }catch(_){ break; }
    if(r.status===200) return true;
    if(r.status===404) return false;   // 404 IS the good answer (unspent)
    if(r.status!==429) break;          // 5xx etc. → unknown
    await new Promise(res=>setTimeout(res, delay)); delay*=2;
  }
  return null;
}

/* ---------- OpNS (bare names, tree 0 — index at search.ordnet.io/api/opns) ---------- */

/* name lookup via /names?q= — the API defaults to match=exact and falls back
   to prefix with `fallback: true`. The fallback flag is passed through
   UNTOUCHED: a fallback answer is a DIFFERENT name than the user typed and
   must never be paid silently. */
async function opnsLookup(name){
  const r=await fetch(`${OPNS_API}/names?q=${encodeURIComponent(name)}`);
  if(!r.ok) throw new Error('The OpNS index at search.ordnet.io is unreachable — check your connection.');
  const j=await r.json().catch(()=>null);
  if(!j || j.ok!==true) throw new Error('The OpNS index at search.ordnet.io is unreachable — check your connection.');
  const fallback=(typeof j.fallback==='boolean') ? j.fallback : (j.match!=='exact');
  const records=(j.results||[]).filter(x=>x && x.name && x.owner_address && x.current_txid);
  return { fallback, records };
}

/* Resolve an OpNS name to a VERIFIED payment target — the four rules:
   1. exact match only — a `fallback: true` answer is a DIFFERENT name and
      surfaces as an inline "did you mean …?" error, never a payment
   2. the current outpoint is checked unspent on WhatsOnChain
   3. the holder address is RECOMPUTED from the outpoint's locking script
      on chain and must equal what the index claims — trust but verify
   4. paymail forms (name@host) are rejected by the caller before this */
async function resolveOpnsPayment(name){
  const n=String(name).trim().toLowerCase();
  const { fallback, records }=await opnsLookup(n);
  const rec=(!fallback) ? records.find(x=>String(x.name).toLowerCase()===n) : null;
  if(!rec){
    const suggestion=records.length ? String(records[0].name) : null;
    if(suggestion && suggestion!==n)
      throw new Error('OpNS name "'+n+'" does not exist. Did you mean "'+suggestion+'"? Nothing was paid.');
    throw new Error('OpNS name "'+n+'" does not exist. Nothing was paid.');
  }
  if(rec.ambiguous===true)
    throw new Error('OpNS name "'+n+'" is marked ambiguous by the index — not safe to pay.');
  const vout=(rec.current_vout|0)||0;
  // recompute the holder address from the chain (raw hex is authoritative)
  let holder=null;
  try{
    const script=await fetchOutputScriptHex(rec.current_txid, vout);
    holder=scriptLockAddress(script);
  }catch(_){ holder=null; }
  if(!holder) throw new Error('Could not derive the holder address from the chain for "'+n+'".');
  if(holder!==rec.owner_address)
    throw new Error('The OpNS index and the chain disagree about the holder of "'+n+'" — refusing to pay. Try again in a moment.');
  // outpoint must be unspent RIGHT NOW — otherwise the name changed hands.
  // v4.1.1 — only a PROVEN spend (HTTP 200) counts as spent; UNKNOWN fails
  // closed (OpNS briefing) but with an honest message, never a false
  // spent/stale claim.
  const spent=await outpointSpent(rec.current_txid, vout);
  if(spent===true)
    throw new Error('The ordinal of "'+n+'" was spent — the name may have just changed hands. Re-resolve and try again.');
  if(spent===null)
    throw new Error('The spent-status of "'+n+'" could not be verified right now — try again in a moment. Nothing was paid.');
  return { kind:'opns', name:n, holderAddress:holder, currentTxid:String(rec.current_txid), currentVout:vout };
}

/* ---------- SNS resolver payments (sns.ordnet.io — signed answers, level "prove") ---------- */

/* raw resolver answer — the BODY STRING goes to snsVerifyAnswer untouched so
   the signature is verified over exactly what the server sent. Error answers
   (not_verified, no_holder, …) also arrive as JSON here. */
async function snsResolveRaw(input){
  let r=null;
  try{ r=await fetch(`${SNS_API}/resolve/${encodeURIComponent(input)}`); }catch(_){ r=null; }
  if(!r) throw new Error('The SNS resolver at sns.ordnet.io is unreachable — check your connection.');
  const body=await r.text().catch(()=>'');
  if(!body) throw new Error('The SNS resolver at sns.ordnet.io is unreachable — check your connection.');
  return { code:r.status, body };
}
/* current key + chain of succession deeds (GET /pubkey) — used ONLY when an
   answer carries an unknown signer; snsVerifyRotationChain proves the chain. */
async function snsPubkeyInfo(){
  const r=await fetch(`${SNS_API}/pubkey`).catch(()=>null);
  if(!r || !r.ok) throw new Error('The SNS resolver at sns.ordnet.io is unreachable — check your connection.');
  const j=await r.json().catch(()=>null);
  if(!j) throw new Error('The SNS resolver at sns.ordnet.io is unreachable — check your connection.');
  return j;
}
async function getSnsPinnedPubkey(){
  const v=await storageGet(SNS_PIN_KEY);
  return (typeof v==='string' && v) ? v : SNS_PREPINNED_PUBKEY;
}

/* Resolve `naam.tld` or `mailbox@naam.tld` to a VERIFIED payment target:
   signed answer → signature against the pinned key (rotation only via a
   proven succession chain) → expires → holder address derived from the
   SIGNED holder_script → outpoint checked unspent (freshness, not script
   equality — custody scripts may differ). Every resolver error carries a
   readable message; it is thrown for INLINE display, never a popup. */
async function resolveSnsPayment(input){
  const q=String(input).trim().toLowerCase();
  const { body }=await snsResolveRaw(q);
  let j=null; try{ j=JSON.parse(body); }catch(_){ j=null; }
  if(!j || typeof j!=='object') throw new Error('The SNS resolver returned an unreadable answer.');
  // error answers: show the resolver's own message inline (not_verified is
  // PERMANENT until the name carries the ✓; no_holder means retry shortly)
  if(j.ok!==true){
    const code=j.error||'resolver_error';
    throw new Error(j.message||('SNS resolver error: '+code));
  }

  const nowTs=Math.floor(Date.now()/1000);
  let pin=await getSnsPinnedPubkey();
  let v=snsVerifyAnswer(body, pin, nowTs);
  let rotationNote='';

  // unknown signer → prove the succession chain from the pin; only a
  // closing chain re-pins. Never "accept anyway".
  if(v.valid!==true && v.reason==='unknown_signer'){
    const info=await snsPubkeyInfo();
    // field verified live 03-08-2026: GET /pubkey -> {ok, signer, seq, rotations:[]}
    const records=Array.isArray(info.rotations)?info.rotations:[];
    let proven=null;
    try{ proven=snsVerifyRotationChain(pin, records); }
    catch(e){
      throw new Error('The resolver signs with a new key, but the succession chain does not prove it — refusing. The pinned key is unchanged. ('+(e.message||e)+')');
    }
    if(String(proven).toLowerCase()!==String(v.signer||''))
      throw new Error('The resolver signs with a new key, but the succession chain does not prove it — refusing. The pinned key is unchanged.');
    await storageSet({ [SNS_PIN_KEY]: proven });
    rotationNote='Resolver key rotated — the succession chain was verified and the new key is now pinned.';
    v=snsVerifyAnswer(body, proven, nowTs);
  }

  if(v.valid!==true){
    const reason=v.reason||'invalid';
    if(reason==='bad_signature') throw new Error('The resolver answer carries an INVALID signature — refusing. Try again; if this persists the resolver may be compromised.');
    if(reason==='expired')       throw new Error('The resolver answer expired — resolve again and retry.');
    if(reason==='unsupported_holder_script') throw new Error('The holder script is not a standard P2PKH script — this wallet cannot derive a pay-to address from it safely.');
    throw new Error('The resolver answer could not be verified ('+reason+').');
  }
  if(!v.holderAddress || !v.currentTxid) throw new Error('The verified answer misses required fields.');

  // freshness: the current outpoint must not be PROVABLY spent. v4.1.1 —
  // checked via GET /tx/<txid>/<vout>/spent; only a real HTTP 200 (spent)
  // may raise stale_outpoint. UNKNOWN lets the payment continue WITH an
  // inline note: the signed resolver answer (expires, 300 s valid) is the
  // authority — checkUnspent semantics true/false/null, null ≠ spent.
  const spent=await outpointSpent(v.currentTxid, v.currentVout);
  if(spent===true)
    throw new Error('stale_outpoint: the inscription of '+(v.name||q)+' was spent — the name may have just changed hands. Resolve again and retry.');

  let warning=rotationNote;
  if(spent===null){
    warning+=(warning?'\n':'')+'The spent-status could not be additionally verified right now — the signed resolver answer (valid for 300 seconds) is the authority for this payment.';
  }
  if(v.addressMismatch===true){
    warning+=(warning?'\n':'')+'Note: the resolver’s display address differs from the signed script — the wallet pays the SIGNED script’s address shown here.';
  }
  return {
    kind:'sns',
    name:v.name||q,
    mailbox:v.mailbox||'',
    fallback:v.fallback===true,
    holderAddress:v.holderAddress,
    currentTxid:v.currentTxid,
    currentVout:v.currentVout,
    expires:v.expires||0,
    warning
  };
}

/* manual per-input signing (SIGHASH_ALL|FORKID) — handles the
   inscription-envelope+P2PKH ordinal input and plain P2PKH inputs alike */
function signAllInputs(tx, pk){
  const SIG = bsv.crypto.Signature;
  const sigtype = SIG.SIGHASH_ALL | SIG.SIGHASH_FORKID;
  for(let i=0;i<tx.inputs.length;i++){
    const input=tx.inputs[i];
    // Sign over the input's ACTUAL locking script (envelope-first ordinals AND plain P2PKH
    // both work when the full previous locking script is the subscript). The amount is part
    // of the FORKID sighash, so input.output.satoshis must be correct.
    const sig=bsv.Transaction.Sighash.sign(tx, pk, sigtype, i, input.output.script, new bsv.crypto.BN(input.output.satoshis));
    input.setScript(bsv.Script.buildPublicKeyHashIn(pk.publicKey, sig, sigtype));
  }
}

/* Verify every input locally BEFORE broadcasting, so a bad subscript/amount surfaces as a
   clear per-input message instead of the node's cryptic "mandatory-script-verify-flag-failed".
   Returns null if all inputs verify, or a human-readable error string for the first failure. */
function verifyTxInputs(tx){
  try{
    const I=bsv.Script.Interpreter;
    const flags=I.SCRIPT_VERIFY_P2SH|I.SCRIPT_VERIFY_STRICTENC|I.SCRIPT_ENABLE_SIGHASH_FORKID|I.SCRIPT_VERIFY_DERSIG|I.SCRIPT_VERIFY_LOW_S|I.SCRIPT_VERIFY_NULLFAIL;
    for(let i=0;i<tx.inputs.length;i++){
      const inp=tx.inputs[i];
      const spk=inp.output && inp.output.script;
      const sats=inp.output && inp.output.satoshis;
      if(!spk) return 'Input '+i+' has no known locking script — the wallet could not read the UTXO it is spending.';
      let ok=false, err='';
      try{
        const it=new I();
        ok=it.verify(inp.script, spk, tx, i, flags, new bsv.crypto.BN(sats));
        err=it.errstr||'';
      }catch(e){ err=(e&&e.message)||String(e); }
      if(!ok){
        return 'Input '+i+' failed local verification ('+(err||'unknown')+'). '
          + 'This usually means the wallet used a wrong locking script or amount for that UTXO. '
          + (i===0 ? 'Input 0 is the ordinal itself.' : 'This is a funding UTXO.');
      }
    }
    return null;
  }catch(e){
    // If the interpreter itself is unavailable, don't block the send — just skip the check.
    return null;
  }
}





async function buildOrdinalTransfer(holding, toAddress){
  const pk=bsv.PrivateKey.fromWIF(_wif), from=pk.toAddress();
  const feeSat=ordinalMinerFee();
  const ordScriptHex=await fetchOutputScriptHex(holding.currentTxid, holding.currentVout);

  // OWNERSHIP CHECK: the 1-sat ordinal is locked to a specific pubkeyhash (the P2PKH tail of
  // the envelope script). To spend it, the wallet's ACTIVE key must hash to that same pkh.
  // If it doesn't, signing produces SCRIPT_ERR_EQUALVERIFY. Surface this clearly instead.
  try{
    const ordScript=bsv.Script.fromHex(ordScriptHex);
    let lockPkh=null;
    for(const c of ordScript.chunks){ if(c.buf && c.buf.length===20) lockPkh=c.buf.toString('hex'); }
    const myPkh=bsv.crypto.Hash.sha256ripemd160(pk.publicKey.toBuffer()).toString('hex');
    if(lockPkh && lockPkh!==myPkh){
      const lockAddr=bsv.Address.fromPublicKeyHash(bsv.deps.Buffer.from(lockPkh,'hex')).toString();
      throw new Error('This ordinal is locked to '+lockAddr+', but your active wallet key controls '+from.toString()
        +'. You can only send it from the wallet that owns it — import the seed/key for '+lockAddr+' and try again.');
    }
  }catch(e){ if(e && /locked to/.test(e.message)) throw e; }

  const all=await getUTXOs(_address);
  const funding=all.filter(u=>!(u.txid===holding.currentTxid && u.vout===holding.currentVout));
  if(!funding.length) throw new Error('No spendable funding UTXOs for the fee. Your balance may be locked in pending transactions.');
  const required=feeSat+TOTAL_SERVICE_FEES;
  let total=0, sel=[];
  for(const u of funding){ sel.push(u); total+=u.satoshis; if(total>=required) break; }
  if(total<required) throw new Error('Insufficient balance for fee + service fee.');

  for(const u of sel){
    try{ const realHex=await fetchOutputScriptHex(u.txid, u.vout); if(realHex) u.realScriptHex=realHex; }catch(_){}
  }

  const tx=new bsv.Transaction();
  tx.addInput(new bsv.Transaction.Input({
    prevTxId: holding.currentTxid, outputIndex: holding.currentVout, script: new bsv.Script(),
    output: new bsv.Transaction.Output({ script: bsv.Script.fromHex(ordScriptHex), satoshis: 1 })
  }));
  sel.forEach(u=>tx.addInput(new bsv.Transaction.Input({
    prevTxId: u.txid, outputIndex: u.vout, script: new bsv.Script(),
    output: new bsv.Transaction.Output({ script: bsv.Script.fromHex(u.realScriptHex||u.scriptPubKey||u.script), satoshis: u.satoshis })
  })));
  tx.to(bsv.Address.fromString(toAddress), 1);
  addServiceFees(tx);
  const change=(1+total)-(1+feeSat+TOTAL_SERVICE_FEES);
  if(change>546) tx.to(from, change);
  signAllInputs(tx, pk);
  const vErr=verifyTxInputs(tx);
  if(vErr) throw new Error(vErr + ' The transaction was NOT broadcast.');
  return tx;
}

