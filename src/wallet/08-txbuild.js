function addServiceFees(tx){
  const A=SERVICE_FEE_ADDRESSES, F=SERVICE_FEES;
  tx.to(bsv.Address.fromString(A.ordiBuilderAddress), F.ordiBuilderFee);
  tx.to(bsv.Address.fromString(A.onnoBuilderAddress), F.onnoBuilderFee);
  tx.to(bsv.Address.fromString(A.algoBuilderAddress), F.algoBuilderFee);
  tx.to(bsv.Address.fromString(A.colleagueIAddress),  F.colleagueIFee);
  tx.to(bsv.Address.fromString(A.protocolFeeAddress), F.protocolFee);
  tx.to(bsv.Address.fromString(A.colleagueDAddress),  F.colleagueDFee);
  tx.to(bsv.Address.fromString(A.monitorFeeAddress),  F.monitorFee);
  tx.to(bsv.Address.fromString(A.indexerFeeAddress),  F.indexerFee);
  tx.to(bsv.Address.fromString(A.partnerFeeAddress),  F.partnerFee);
  tx.to(bsv.Address.fromString(A.founderFeeAddress),  F.founderFee);
  tx.to(bsv.Address.fromString(A.foundationFeeAddress), F.foundationFee);
}
/* V49.3 — every builder takes `opts`:
     opts.sign   (default true) — false returns the UNSIGNED transaction; the
                 approval screen builds first, shows the effect of THOSE bytes,
                 and signs the same object after consent (see 15-approval.js).
     The miner fee a page may pass in is no longer trusted as-is: it is clamped
     by clampSiteFee() to [wallet estimate, 2× wallet estimate] and the outcome
     is attached as tx._ordplugFee so the screen can say what happened. */
async function buildSend(toAddress, amountSat, dataStr, feeSat, opts){
  opts=opts||{};
  const feeInfo=clampSiteFee(sendMinerFee(), feeSat); feeSat=feeInfo.fee;
  const pk=bsv.PrivateKey.fromWIF(_wif), from=pk.toAddress();
  const utxos=await getUTXOs(_address);
  if(!utxos.length) throw new Error('No spendable UTXOs. Your balance may be locked in pending (unconfirmed) transactions \u2014 wait for them to confirm, then retry.');
  const required=amountSat+feeSat+(dataStr?1:0)+TOTAL_SERVICE_FEES;
  let total=0, sel=[];
  for(const u of utxos){ sel.push(u); total+=u.satoshis; if(total>=required) break; }
  if(total<required) throw new Error('Insufficient balance for amount + fee + service fee.');
  const tx=new bsv.Transaction();
  sel.forEach(u=>tx.from(new bsv.Transaction.UnspentOutput({ txid:u.txid, outputIndex:u.vout, address:from, script:u.scriptPubKey||u.script, satoshis:u.satoshis })));
  tx.to(toAddress, amountSat);
  addServiceFees(tx);
  if(dataStr) tx.addOutput(new bsv.Transaction.Output({ satoshis:1, script:bsv.Script.buildDataOut([dataStr]) }));
  const change=total-(amountSat+(dataStr?1:0)+feeSat+TOTAL_SERVICE_FEES);
  if(change>546) tx.to(from, change);
  tx.fee(feeSat); tx._ordplugFee=feeInfo;
  if(opts.sign!==false) tx.sign(pk);
  return tx;
}
async function buildInscribe(contentType, dataBytes, feeSat, opts){
  opts=opts||{};
  const feeInfo=clampSiteFee(inscribeMinerFee(dataBytes ? dataBytes.length : 0), feeSat); feeSat=feeInfo.fee;
  const pk=bsv.PrivateKey.fromWIF(_wif), from=pk.toAddress();
  const utxos=await getUTXOs(_address);
  if(!utxos.length) throw new Error('No spendable UTXOs. Your balance may be locked in pending (unconfirmed) transactions \u2014 wait for them to confirm, then retry.');
  const required=1+feeSat+1+TOTAL_SERVICE_FEES;
  let total=0, sel=[];
  for(const u of utxos){ sel.push(u); total+=u.satoshis; if(total>=required) break; }
  if(total<required) throw new Error('Insufficient balance for 1-sat ordinal + fee + service fee.');
  const tx=new bsv.Transaction();
  sel.forEach(u=>tx.from(new bsv.Transaction.UnspentOutput({ txid:u.txid, outputIndex:u.vout, address:from, script:u.scriptPubKey||u.script, satoshis:u.satoshis })));
  const ins=new bsv.Script();
  ins.add(bsv.Opcode.OP_FALSE); ins.add(bsv.Opcode.OP_IF);
  ins.add(bsv.deps.Buffer.from('ord','utf8'));
  ins.add(bsv.Opcode.OP_1); ins.add(bsv.deps.Buffer.from(contentType,'utf8'));
  ins.add(bsv.Opcode.OP_0); ins.add(bsv.deps.Buffer.from(dataBytes));
  ins.add(bsv.Opcode.OP_ENDIF);
  const lock=bsv.Script.buildPublicKeyHashOut(from);
  const finalScript=new bsv.Script();
  ins.chunks.forEach(c=>finalScript.chunks.push(c));
  lock.chunks.forEach(c=>finalScript.chunks.push(c));
  tx.addOutput(new bsv.Transaction.Output({ satoshis:1, script:finalScript }));
  tx.addOutput(new bsv.Transaction.Output({ satoshis:1, script:bsv.Script.buildDataOut(['ORDnet.io']) }));
  addServiceFees(tx);
  const change=total-(1+1+feeSat+TOTAL_SERVICE_FEES);
  if(change>546) tx.to(from, change);
  tx.fee(feeSat); tx._ordplugFee=feeInfo;
  if(opts.sign!==false) tx.sign(pk);
  return tx;
}
/* ---------- sendTx: caller-composed transaction (inscription + payments + OP_RETURN
   in ONE approval). Outputs are appended in the exact order given, then service
   fees, then change — so an inscription-first call keeps the ordinal at vout 0.
   Sized for bulk claims: up to 350 caller outputs (300 BSVmaps + payment +
   OP_RETURN with headroom), byte-accurate fee estimate, iterative UTXO selection. */
const SENDTX_MAX_OUTPUTS = 350;
async function buildTx(params, opts){
  opts=opts||{};
  const outs=Array.isArray(params.outputs)?params.outputs:[];
  if(!outs.length) throw new Error('sendTx: outputs[] required');
  if(outs.length>SENDTX_MAX_OUTPUTS) throw new Error('sendTx: too many outputs (max '+SENDTX_MAX_OUTPUTS+')');
  const pk=bsv.PrivateKey.fromWIF(_wif), from=pk.toAddress();
  const changeAddr=params.changeAddress?bsv.Address.fromString(String(params.changeAddress)):from;
  const utxos=await getUTXOs(_address);
  if(!utxos.length) throw new Error('No spendable UTXOs. Your balance may be locked in pending (unconfirmed) transactions — wait, then retry.');

  const tx=new bsv.Transaction();
  let spend=0, outBytes=0; // outBytes: real serialized size of the caller outputs (value+script)
  for(const o of outs){
    if(o.type==='p2pkh'){
      const sats=satNum(o.satoshis); if(sats<1) throw new Error('sendTx: p2pkh satoshis');
      tx.to(bsv.Address.fromString(String(o.address)), sats); spend+=sats; outBytes+=34;
    } else if(o.type==='inscription'){
      const sats=satNum(o.satoshis)||1;
      const bytes=o.dataB64?bsv.deps.Buffer.from(String(o.dataB64),'base64'):bsv.deps.Buffer.from(String(o.data),'utf8');
      const ct=String(o.contentType||'text/plain');
      const ins=new bsv.Script();
      ins.add(bsv.Opcode.OP_FALSE); ins.add(bsv.Opcode.OP_IF);
      ins.add(bsv.deps.Buffer.from('ord','utf8'));
      ins.add(bsv.Opcode.OP_1); ins.add(bsv.deps.Buffer.from(ct,'utf8'));
      ins.add(bsv.Opcode.OP_0); ins.add(bsv.deps.Buffer.from(bytes));
      ins.add(bsv.Opcode.OP_ENDIF);
      const lock=bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(String(o.address)));
      const script=new bsv.Script();
      ins.chunks.forEach(c=>script.chunks.push(c));
      lock.chunks.forEach(c=>script.chunks.push(c));
      tx.addOutput(new bsv.Transaction.Output({ satoshis:sats, script })); spend+=sats;
      outBytes+=12+bytes.length+ct.length+45; // value+varint + envelope opcodes + P2PKH tail
    } else if(o.type==='opreturn'){
      // DUST FIX: buildDataOut is a plain OP_RETURN (no leading OP_FALSE), which
      // post-genesis nodes do NOT treat as provably unspendable — a 0-sat output
      // gets rejected with "64: dust". Carry 1 sat, exactly like buildSend does.
      const parts=(o.data||[]).map(s=>String(s).startsWith('0x')?bsv.deps.Buffer.from(String(s).slice(2),'hex'):String(s));
      tx.addOutput(new bsv.Transaction.Output({ satoshis:1, script:bsv.Script.buildDataOut(parts) })); spend+=1;
      outBytes+=14+parts.reduce((a,p)=>a+(typeof p==='string'?p.length:p.length)+3,0);
    } else if(o.type==='script'){
      const sats=satNum(o.satoshis);
      if(sats<1) throw new Error('sendTx: script outputs need at least 1 satoshi (0-sat outputs are rejected as dust).');
      tx.addOutput(new bsv.Transaction.Output({ satoshis:sats, script:bsv.Script.fromHex(String(o.scriptHex)) })); spend+=sats;
      outBytes+=12+Math.ceil(String(o.scriptHex).length/2);
    } else throw new Error('sendTx: unknown output type '+o.type);
  }

  if(params.includeServiceFees!==false) addServiceFees(tx);
  const svc=(params.includeServiceFees!==false)?TOTAL_SERVICE_FEES:0;
  const svcBytes=(params.includeServiceFees!==false)?11*34:0;

  // Fee & funding selection — iterate: more inputs make the tx bigger, which
  // raises the fee, which may in turn need one more input.
  // V49.3 — the wallet ALWAYS computes its own byte-accurate fee first; a
  // fee the page passed in is then clamped against it (never below, never
  // more than 2×). Before, a non-zero page fee short-circuited this loop and
  // was used verbatim.
  const siteFee=feeNum(params.fee);
  let feeSat=0, total=0, sel=[];
  for(let nIn=1;;){
    const fee=Math.ceil((10 + nIn*148 + outBytes + svcBytes + 34) * FEE_RATE);
    const required=spend+svc+fee;
    total=0; sel=[];
    for(const u of utxos){ sel.push(u); total+=u.satoshis; if(total>=required) break; }
    if(total<required) throw new Error('Insufficient balance for outputs + fees.');
    if(sel.length<=nIn){ feeSat=fee; break; }
    nIn=sel.length;
  }
  const feeInfo=clampSiteFee(feeSat, siteFee);
  if(feeInfo.fee!==feeSat){
    // a (clamped) higher fee may need one more input — reselect once against it
    feeSat=feeInfo.fee; const required=spend+svc+feeSat; total=0; sel=[];
    for(const u of utxos){ sel.push(u); total+=u.satoshis; if(total>=required) break; }
    if(total<required) throw new Error('Insufficient balance for outputs + fees.');
  }
  sel.forEach(u=>tx.from(new bsv.Transaction.UnspentOutput({ txid:u.txid, outputIndex:u.vout, address:from, script:u.scriptPubKey||u.script, satoshis:u.satoshis })));

  const change=total-(spend+svc+feeSat);
  if(change>546) tx.to(changeAddr, change);
  tx.fee(feeSat); tx._ordplugFee=feeInfo;
  if(opts.sign!==false) tx.sign(pk);
  return tx;
}
/* V49.3 — an outage is not a zero balance. Until 4.9.2 a 429/5xx (or any
   body without numeric fields) came back as { confirmed:0 } and the home
   screen printed "0 sats"; a page calling getBalance got 0 too. Now anything
   that is not a 2xx with numeric confirmed/unconfirmed THROWS, and every
   caller already renders that as "unavailable" / an error, never as 0. */
async function getBalance(){
  const r=await fetch(`${API_BASE}/address/${_address}/balance`);
  if(!r.ok) throw new Error('Balance service answered '+r.status+' — balance unknown (not zero).');
  const j=await r.json();
  if(!j || typeof j.confirmed!=='number' || typeof j.unconfirmed!=='number') throw new Error('Balance service returned an unexpected answer — balance unknown (not zero).');
  return { confirmed:j.confirmed, unconfirmed:j.unconfirmed };
}
/* K7 — domain separation for signatures.
   `signAction()` below authenticates against domains.ordnet.io by signing
   'ordnet-registry|<action>|<fields…>|<ts>'. That exact string used to be
   producible through the dApp-facing ordplug.signMessage(), under an approval
   screen that read "No coins move" — so a page could have a domain transfer
   signed by telling the user it was signing a harmless string.

   The registry's wire format cannot change without breaking the server, so the
   separation is enforced on the way in instead: a message whose first
   pipe-delimited field is a reserved namespace is refused when it comes from a
   page. Internal callers pass {internal:true} and are unaffected. */
const RESERVED_SIGN_NAMESPACES = ['ordnet-registry','ordpay/v1','ordnet-wallet','odnca'];
function reservedNamespaceOf(message){
  const first=String(message||'').split('|')[0].trim().toLowerCase();
  return RESERVED_SIGN_NAMESPACES.find(ns => first===ns || first.startsWith(ns+' ')) || null;
}
function signMessageExternal(message){
  const ns=reservedNamespaceOf(message);
  if(ns) throw new Error('Refused: this message is an authorization command for "'+ns+'". A website cannot have the wallet sign it. If you meant to manage a name, use the Domains tab.');
  if(String(message||'').length>10000) throw new Error('Refused: message too long to review.');
  return signMessage(message);
}
function signMessage(message){
  const pk=bsv.PrivateKey.fromWIF(_wif);
  if(bsv.Message) return { signature:new bsv.Message(message).sign(pk), pubkey:pk.toPublicKey().toString() };
  const hash=bsv.crypto.Hash.sha256sha256(bsv.deps.Buffer.from(message,'utf8'));
  return { signature:bsv.crypto.ECDSA.sign(hash, pk).toString(), pubkey:pk.toPublicKey().toString() };
}

