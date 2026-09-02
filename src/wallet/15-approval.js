/* ---------- approval ---------- */
/* sats as a safe integer — NEVER use `|0` on sat amounts: it is a 32-bit cast
   and silently corrupts anything above 21.47 BSV (2,147,483,647 sats). */
function satNum(v){ const n=Math.round(Number(v)||0); return n>0?n:0; }
/* A caller-supplied miner fee. NEVER use `|0` here: that is a 32-bit cast and
   silently turns 3_000_000_000 into -1_294_967_296, which then sails through
   every downstream check. Returns a safe non-negative integer, 0 when absent. */
function feeNum(v){
  if(v===undefined||v===null||v==='') return 0;
  // Only a real number or a plain numeric string. An object that coerces
  // through valueOf() is not a fee, it is someone being clever.
  if(typeof v!=='number' && typeof v!=='string') return 0;
  if(typeof v==='string' && !/^\d+(\.\d+)?$/.test(v.trim())) return 0;
  const n=Math.round(Number(v));
  if(!Number.isFinite(n)||n<0||n>Number.MAX_SAFE_INTEGER) return 0;
  // V49.3 — absolute sanity ceiling. At 0.15 sat/byte this is a 6.6 MB
  // transaction; anything above it is not a fee, it is a drain. Ignored
  // (falls back to the wallet's own estimate), never honoured.
  if(n>1000000) return 0;        // === MAX_FEE_SAT (literal: feeNum is lifted standalone by the tests)
  return n;
}
const MAX_FEE_SAT = 1000000;      // 0.01 BSV
const SITE_FEE_MAX_MULT = 2;      // a page may ask for at most 2× the wallet's own estimate
/* V49.3 — the ONE place a page-supplied miner fee is interpreted. Returns the
   fee the wallet will really pay plus what happened to the request, so the
   approval screen can print it. Used by buildSend/buildInscribe/buildTx, so
   screen and bytes can never disagree. */
function clampSiteFee(walletFee, siteFee){
  const w=Math.max(1, Math.ceil(Number(walletFee)||0));
  const site=feeNum(siteFee);
  if(!site) return { fee:w, site:0, wallet:w, source:'wallet' };
  if(site<w) return { fee:w, site, wallet:w, source:'wallet', note:'the page asked for '+site.toLocaleString()+' sats, below the network minimum — your wallet\'s rate is used' };
  const max=w*SITE_FEE_MAX_MULT;
  if(site>max) return { fee:max, site, wallet:w, source:'capped', note:'the page asked for '+site.toLocaleString()+' sats — capped at 2× your wallet\'s rate' };
  return { fee:site, site, wallet:w, source:'site', note:'set by the page ('+w.toLocaleString()+' sats would be your wallet\'s rate)' };
}
/* V49.3 — transaction plan: the effect of the exact bytes that will be
   broadcast, read back from the built transaction rather than recomputed for
   the screen. Every output is classified against the wallet's own address
   and the service-fee addresses; the fee is inputs − outputs. */
function txEffect(tx, ownAddress){
  const svcSet=new Set(Object.values(SERVICE_FEE_ADDRESSES));
  const own=ownAddress?bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(ownAddress)).toHex():'';
  const outputs=tx.outputs.map((o,i)=>{
    const hex=o.script.toHex(); const sats=o.satoshis;
    const chunks=o.script.chunks||[];
    const isDataOut=chunks.length && (chunks[0].opcodenum===106 || (chunks[0].opcodenum===0 && chunks[1] && chunks[1].opcodenum===106));
    const isInscription=/^0063036f7264/.test(hex); // OP_FALSE OP_IF "ord"
    let kind, dest='';
    if(isInscription){ kind='inscription'; dest=(own && hex.endsWith(own))?ownAddress:scriptDest(hex.slice(hex.length-50)); }
    else if(isDataOut){ kind='opreturn'; }
    else if(own && hex===own){ kind='change'; dest=ownAddress; }
    else { const d=scriptDest(hex); if(svcSet.has(d)){ kind='service'; dest=d; } else { kind='payment'; dest=d; } }
    return { i, sats, kind, dest, scriptHex:hex };
  });
  const inputs=tx.inputs.map(inp=>inp.prevTxId.toString('hex')+':'+inp.outputIndex);
  const inSum=tx.inputs.reduce((a,inp)=>a+((inp.output&&inp.output.satoshis)||0),0);
  const outSum=tx.outputs.reduce((a,o)=>a+o.satoshis,0);
  const fee=inSum-outSum;
  const paid=outputs.filter(o=>o.kind==='payment').reduce((a,o)=>a+o.sats,0);
  const service=outputs.filter(o=>o.kind==='service').reduce((a,o)=>a+o.sats,0);
  const change=outputs.filter(o=>o.kind==='change').reduce((a,o)=>a+o.sats,0);
  const carried=outputs.filter(o=>o.kind==='opreturn'||o.kind==='inscription').reduce((a,o)=>a+o.sats,0);
  return { outputs, inputs, fee, paid, service, change, carried, leaves: inSum-change, inSum, outSum };
}
/* signature-independent identity of a transaction's economics: which coins
   go in, what comes out, in what order. Signing changes none of it. */
function txFingerprint(tx){
  return JSON.stringify({
    i: tx.inputs.map(inp=>inp.prevTxId.toString('hex')+':'+inp.outputIndex),
    o: tx.outputs.map(o=>[o.satoshis, o.script.toHex()])
  });
}
/* Build the plan for a page request: the UNSIGNED transaction, its effect and
   fingerprint. Kept in memory on _pending only — never in storage. */
async function planForPending(p){
  let tx;
  if(p.method==='pay')          tx=await buildSend(String(p.params.to), satNum(p.params.amount), p.params.data||null, feeNum(p.params.fee), { sign:false });
  else if(p.method==='inscribe'){ const bytes=new TextEncoder().encode(String(p.params.data)); tx=await buildInscribe(p.params.contentType||'text/plain', bytes, feeNum(p.params.fee), { sign:false }); }
  else if(p.method==='sendTx')   tx=await buildTx(p.params, { sign:false });
  else return null;
  const effect=txEffect(tx, _address);
  return { tx, effect, feeInfo:tx._ordplugFee||{ fee:effect.fee, source:'wallet' }, fingerprint:txFingerprint(tx), builtAt:Date.now() };
}
const PLAN_MAX_AGE_MS = 5*60000;  // a plan older than this is rebuilt before it is signed
/* Sign the planned transaction and prove it is still the one that was shown. */
function signPlanned(plan){
  const pk=bsv.PrivateKey.fromWIF(_wif);
  plan.tx.sign(pk);
  const fp=txFingerprint(plan.tx);
  if(fp!==plan.fingerprint) throw new Error('Safety stop: the transaction changed between review and signing. Nothing was sent.');
  const eff=txEffect(plan.tx, _address);
  if(eff.fee!==plan.effect.fee || eff.leaves!==plan.effect.leaves) throw new Error('Safety stop: the fee or amount differs from what was shown. Nothing was sent.');
  return plan.tx;
}
/* V49.3 — approval rendering from a plan (item 21): the number that matters
   first and big, then every output as its own row. */
function planRows(plan, opts){
  opts=opts||{};
  const e=plan.effect, fi=plan.feeInfo;
  const rowsOut=e.outputs.map(o=>{
    if(o.kind==='service')     return '';
    if(o.kind==='change')      return `<div class="kv"><span class="k">Change back to you</span><span class="v">${o.sats.toLocaleString()} sats</span></div>`;
    if(o.kind==='opreturn')    return `<div class="kv"><span class="k">#${o.i} OP_RETURN</span><span class="v">${o.sats} sat (data)</span></div>`;
    if(o.kind==='inscription') return `<div class="kv"><span class="k">#${o.i} Inscription</span><span class="v">${o.sats} sat → ${o.dest===_address?'you':esc(o.dest)}</span></div>`;
    return `<div class="kv"><span class="k">#${o.i} Payment</span><span class="v">${o.sats.toLocaleString()} sats → ${esc(o.dest)}</span></div>`;
  }).join('');
  const feeNote=fi.note?`<div class="plan-note">Miner fee: ${esc(fi.note)}.</div>`:'';
  const svcRow=e.service?`<div class="kv"><span class="k">ORDnet service fee <span class="plan-sub">(${Object.keys(SERVICE_FEES).length} outputs)</span></span><span class="v">${e.service.toLocaleString()} sats</span></div>`:'';
  return `<div class="plan-total"><div class="plan-total-n">−${e.leaves.toLocaleString()} <span>sats</span></div><div class="plan-total-l">leaves your wallet</div></div>
    ${opts.before||''}
    ${rowsOut}
    ${svcRow}
    <div class="kv"><span class="k">Miner fee${fi.source==='site'?' (page)':fi.source==='capped'?' (capped)':''}</span><span class="v">${e.fee.toLocaleString()} sats</span></div>
    ${feeNote}
    <div class="kv"><span class="k">Inputs</span><span class="v">${e.inputs.length} coin${e.inputs.length===1?'':'s'}, ${e.inSum.toLocaleString()} sats</span></div>`;
}
/* K5 — a raw `script` output used to show only its amount. Decode the common
   P2PKH shape so the destination is visible; anything else is labelled as an
   opaque script, which is itself the warning. */
function scriptDest(hex){
  const h=String(hex||'').toLowerCase();
  const m=h.match(/^76a914([0-9a-f]{40})88ac$/);
  if(m){
    try{ return bsv.Address.fromPublicKeyHash(bsv.deps.Buffer.from(m[1],'hex')).toString(); }
    catch(e){ return 'P2PKH ' + m[1]; }
  }
  return 'custom script (' + Math.ceil(h.length/2) + ' bytes)';
}
function purchaseSats(pr){ return pr.amountSat ? satNum(pr.amountSat) : Math.round((Number(pr.amount)||0)*1e8); }
/* V49.3 — one fee function for the purchase screen AND its execution (they
   used to differ by the OP_RETURN size). */
function purchaseOpReturn(pr, sig){
  const msg=purchaseMessage(pr);
  let opret=String(pr.reference || pr.opReturn || msg) + ' | sig:' + sig;
  if(opret.length>900) opret=opret.slice(0,900);
  return opret;
}
function purchaseMinerFee(pr){
  // the DER signature is 140–144 hex chars; size with the maximum so the
  // screen and the execution call the SAME function and get the SAME number
  const opSize=new TextEncoder().encode(purchaseOpReturn(pr, 'x'.repeat(144))).length;
  return Math.ceil((200 + 13*34 + opSize) * FEE_RATE);
}
function purchaseMessage(pr){
  return 'ORDPAY/v1 | shop:'+(pr.shop||'')+' | item:'+(pr.itemTitle||'')+' | order:'+(pr.orderId||'')+' | amount:'+purchaseSats(pr)+' sats | to:'+(pr.to||'');
}
async function presentApproval(){
  const p=_pending; if(!p) return;
  showView('approve'); clr($('apErr'));
  $('apOrigin').textContent='Source: '+(p.origin||'unknown');
  const d=$('apDetails'); const ic=$('apIcon');
  $('apApprove').disabled=true; $('apReject').disabled=false;
  const readMethods=['connect','getAddress','getPublicKey','getBalance'];
  // V49.3 — pay / inscribe / sendTx: build the transaction FIRST, show the
  // effect of those exact bytes, keep the unsigned object on _pending.plan.
  // What the screen prints is read from the transaction, not recomputed.
  if(p.method==='pay'||p.method==='inscribe'||p.method==='sendTx'){
    ic.innerHTML=p.method==='inscribe'?ICONS.pen:ICONS.sendBig;
    $('apTitle').textContent=p.method==='inscribe'?'Approve inscription':((p.params.meta&&p.params.meta.title)||(p.method==='pay'?'Approve payment':'Approve transaction'));
    d.innerHTML='<p class="plan-loading"><span class="spinner"></span> Preparing the exact transaction…</p>';
    try{ p.plan=await planForPending(p); }
    catch(e){
      p.plan=null;
      d.innerHTML=`<p>The transaction could not be prepared, so there is nothing to approve.</p><div class="alert alert-danger" style="display:block">${esc(e.message||String(e))}</div><p style="font-size:12px;color:var(--text-secondary)">Reject, or <a href="#" id="apRetry">try again</a>.</p>`;
      const r=$('apRetry'); if(r) r.addEventListener('click', ev=>{ ev.preventDefault(); presentApproval(); });
      return;
    }
    if(_pending!==p) return; // resolved/replaced while building
    if(p.method==='pay'){
      d.innerHTML=planRows(p.plan, { before:`<div class="kv"><span class="k">From</span><span class="v">${esc(_accounts[_active].name)}</span></div>${p.params.data?`<div class="kv"><span class="k">OP_RETURN text</span><span class="v">${esc(String(p.params.data)).slice(0,80)}</span></div>`:''}` });
      $('apApprove').textContent='Approve & send';
    } else if(p.method==='inscribe'){
      const bytes=(p.params.data!=null)?new TextEncoder().encode(String(p.params.data)).length:0;
      d.innerHTML=planRows(p.plan, { before:`<div class="kv"><span class="k">Content type</span><span class="v">${esc(p.params.contentType||'')}</span></div>
        ${p.params.contentType==='text/plain'&&bytes<64?`<div class="kv"><span class="k">Data</span><span class="v">${esc(String(p.params.data))}</span></div>`:''}
        <div class="kv"><span class="k">Size</span><span class="v">${bytes.toLocaleString()} bytes</span></div>` });
      $('apApprove').textContent='Approve & inscribe';
    } else {
      const chg=p.params.changeAddress?String(p.params.changeAddress):'';
      const chgForeign=chg && chg!==_address;
      /* K5 — change to a foreign address is the whole remainder leaving; it
         stays at the top in red. The plan rows below show it as a payment
         (it is one), the warning names it. */
      const warn = chgForeign
        ? `<div class="kv" style="background:rgba(220,38,38,.10);border-radius:6px;padding:4px 6px"><span class="k">⚠ Change goes to</span><span class="v">${esc(chg.slice(0,20))}…</span></div>
           <p style="margin-top:8px;color:#dc2626;font-size:12px"><strong>This site is sending your change to an address that is not yours.</strong> Everything above the listed amounts leaves your wallet. Only approve if you know exactly why.</p>`
        : '';
      d.innerHTML=planRows(p.plan, { before:`${(p.params.meta&&p.params.meta.shop)?`<div class="kv"><span class="k">Shop</span><span class="v">${esc(p.params.meta.shop)}</span></div>`:''}${warn}` })
        + (p.params.broadcast===false?'<p class="plan-note">The page asked for the signed transaction back without broadcasting it. It can broadcast these bytes itself.</p>':'')
        + '<p style="margin-top:8px;color:var(--text-secondary);font-size:12px">Every line above is read from the transaction you are about to sign.</p>';
      $('apApprove').textContent=p.params.broadcast===false?'Approve & sign':'Approve & send';
    }
    $('apApprove').disabled=false; $('apReject').disabled=false;
    return;
  }
  if(readMethods.includes(p.method)){
    ic.innerHTML=ICONS.link; $('apTitle').textContent='Connect wallet';
    d.innerHTML=`<p>This page wants to see your wallet address.</p><div class="kv"><span class="k">Account</span><span class="v">${esc(_accounts[_active].name)}</span></div><div class="kv"><span class="k">Address</span><span class="v">${_address}</span></div>`;
    $('apApprove').textContent='Connect';
  } else if(p.method==='signMessage'){
    ic.innerHTML=ICONS.check; $('apTitle').textContent='Sign message';
    /* K7 — the old copy promised "No coins move", which is true of the
       transaction and misleading about the consequence: a signature is an
       authorization that a service can act on. The message is also shown in
       full now — it used to be cut at 200 characters WITHOUT saying so, and
       cut after escaping, which could slice an HTML entity in half. */
    const _m=String(p.params.message||'');
    const _shown=_m.length>2000?_m.slice(0,2000):_m;
    d.innerHTML=`<p>Sign this message with your key. <strong>No coins move — but a signature can authorise actions on any service that accepts it.</strong> Read it in full before you sign.</p>
      <div class="kv" style="align-items:flex-start"><span class="k">Message</span><span class="v" style="white-space:pre-wrap;word-break:break-word;max-height:180px;overflow:auto;text-align:left">${esc(_shown)}</span></div>
      ${_m.length>_shown.length?`<p style="color:var(--text-secondary);font-size:12px">Showing the first 2.000 of ${_m.length.toLocaleString()} characters.</p>`:''}`;
    $('apApprove').textContent='Sign';
  } else if(p.method==='purchase'){
    ic.innerHTML=ICONS.cart; $('apTitle').textContent='Approve purchase';
    const sats=purchaseSats(p.params), fee=purchaseMinerFee(p.params);
    d.innerHTML=`<div class="kv"><span class="k">Item</span><span class="v">${esc(p.params.itemTitle||'Order')}</span></div>
      ${p.params.shop?`<div class="kv"><span class="k">Shop</span><span class="v">${esc(p.params.shop)}</span></div>`:''}
      <div class="kv"><span class="k">Seller</span><span class="v">${esc(p.params.to||'')}</span></div>
      <div class="kv"><span class="k">Amount</span><span class="v">${sats.toLocaleString()} sats</span></div>
      <div class="kv"><span class="k">Miner fee</span><span class="v">${fee} sats</span></div>
      <div class="kv"><span class="k">Service fee</span><span class="v">${TOTAL_SERVICE_FEES.toLocaleString()} sats</span></div>
      <p style="margin-top:8px;color:var(--text-secondary);font-size:12px">You sign the order and pay in one step. Your signature and the order reference are written on-chain.</p>`;
    $('apApprove').textContent='Sign & pay';
  } else if(p.method==='listOrdinal'){
    ic.innerHTML=ICONS.tag; $('apTitle').textContent='List for sale';
    d.innerHTML=`<p>Sign a one-sided atomic swap. The ordinal stays in your wallet until a buyer pays your price.</p>
      <div class="kv"><span class="k">Ordinal</span><span class="v">${esc(String(p.params.ordinalTxid||'').slice(0,10))}…_${p.params.ordinalVout}</span></div>
      <div class="kv"><span class="k">Price</span><span class="v">${bsvFmt(satNum(p.params.priceSat))} BSV (${satNum(p.params.priceSat).toLocaleString()} sats)</span></div>
      <div class="kv"><span class="k">Paid to</span><span class="v">${_address}</span></div>`;
    $('apApprove').textContent='Sign listing';
  } else if(p.method==='buyOrdinal'){
    ic.innerHTML=ICONS.bag; $('apTitle').textContent='Buy ordinal';
    const price=satNum(p.params.priceSat), fee=ordinalMinerFee();
    // v3.5 — extraOutputs (bv. 0,5% marketplace-fee) zichtbaar in het approve-scherm
    const extras=Array.isArray(p.params.extraOutputs)?p.params.extraOutputs:[];
    const extraRows=extras.map(eo=>{const s=satNum(eo.sats||eo.amount);return s>0?`<div class="kv"><span class="k">Marketplace fee</span><span class="v">${s.toLocaleString()} sats → ${esc(String(eo.to||'').slice(0,12))}…</span></div>`:'';}).join('');
    d.innerHTML=`<p>Complete the swap: pay the seller and receive the ordinal in one transaction.</p>
      <div class="kv"><span class="k">Price to seller</span><span class="v">${bsvFmt(price)} BSV (${price.toLocaleString()} sats)</span></div>
      <div class="kv"><span class="k">Seller</span><span class="v">${esc(String(p.params.sellerAddress||''))}</span></div>
      ${extraRows}
      <div class="kv"><span class="k">Miner fee</span><span class="v">${fee.toLocaleString()} sats</span></div>
      <div class="kv"><span class="k">Service fee</span><span class="v">${TOTAL_SERVICE_FEES.toLocaleString()} sats</span></div>
      <div class="kv"><span class="k">Received to</span><span class="v">${_address}</span></div>`;
    $('apApprove').textContent='Approve & buy';
  }
  $('apApprove').disabled=false; $('apReject').disabled=false;
}
async function approveRequest(){
  const p=_pending; if(!p) return;
  $('apApprove').disabled=true; $('apReject').disabled=true; clr($('apErr'));
  const lbl=$('apApprove').textContent; $('apApprove').innerHTML='<span class="spinner"></span> Working...';
  try{
    let result;
    const readMethods=['connect','getAddress','getPublicKey','getBalance'];
    if(readMethods.includes(p.method)){
      const key='ordplug_connected';
      const cur=(await new Promise(r=>chrome.storage.session.get([key],x=>r(x[key]))))||{};
      cur[p.origin]=true;
      await new Promise(r=>chrome.storage.session.set({ [key]:cur }, r));
      if(p.method==='getPublicKey') result={ pubkey:wifToPubKey(_wif), address:_address };
      else if(p.method==='getBalance') result=await getBalance();
      else result={ address:_address };
    }
    else if(p.method==='pay'||p.method==='inscribe'||p.method==='sendTx'){
      // V49.3 — sign the planned object, prove it still matches the screen,
      // then broadcast. No plan (popup reloaded, plan stale) => re-present,
      // never build-and-send blind.
      if(!p.plan || (Date.now()-p.plan.builtAt)>PLAN_MAX_AGE_MS){
        $('apApprove').textContent=lbl; await presentApproval();
        err($('apErr'), p.plan?'The transaction was rebuilt because the review was older than 5 minutes — check it again and approve.':'Could not prepare the transaction.');
        return;
      }
      const tx=signPlanned(p.plan);
      if(p.method==='pay') result={ txid:await broadcastAndRegister(tx) };
      else if(p.method==='inscribe') result={ txid:await broadcastAndRegister(tx), address:_address };
      else { const txid=(p.params.broadcast===false)?null:await broadcastAndRegister(tx); result={ txid, rawtx:tx.toString(), address:_address }; }
    }
    else if(p.method==='signMessage'){ result=Object.assign(signMessageExternal(String(p.params.message)), { address:_address }); }
    else if(p.method==='purchase'){
      const sats=purchaseSats(p.params);
      if(sats<1) throw new Error('Invalid amount.');
      bsv.Address.fromString(String(p.params.to));
      const msg=purchaseMessage(p.params);
      const sig=signMessage(msg);
      const opret=purchaseOpReturn(p.params, sig.signature);
      const feeSat=purchaseMinerFee(p.params);
      const tx=await buildSend(String(p.params.to), sats, opret, feeSat);
      const eff=txEffect(tx, _address);
      if(eff.fee!==feeSat) throw new Error('Safety stop: the fee differs from what was shown. Nothing was sent.');
      result={ txid:await broadcastAndRegister(tx), address:_address, signature:sig.signature, pubkey:sig.pubkey, message:msg };
    }
    else if(p.method==='listOrdinal'){
      const price=satNum(p.params.priceSat);
      if(price<1) throw new Error('Invalid price.');
      const signed=await buildListingPartial(String(p.params.ordinalTxid), p.params.ordinalVout|0, price);
      result={ partialTx:signed.partialTx, payScriptHex:signed.payScriptHex, sellerAddress:_address, priceSat:price };
    }
    else if(p.method==='buyOrdinal'){
      const tx=await buildPurchaseFromPartial(String(p.params.partialTx), satNum(p.params.priceSat), String(p.params.sellerAddress), String(p.params.payScriptHex), p.params.extraOutputs);
      result={ txid:await broadcastAndRegister(tx), address:_address };
    }
    else throw new Error('Unknown method: '+p.method);
    resolvePending(true, result);
    window.close();
  }catch(e){
    err($('apErr'), e.message||'Failed.');
    $('apApprove').disabled=false; $('apReject').disabled=false; $('apApprove').textContent=lbl;
  }
}
function rejectRequest(){
  resolvePending(false, null, 'User rejected the request');
  window.close();
}
function resolvePending(ok, result, error){
  const p=_pending; _pending=null; if(!p) return;
  chrome.runtime.sendMessage({ type:'ordplug_resolve', id:p.id, tabId:p.tabId, origin:p.origin, ok, result, error });
  chrome.storage.session.remove('ordplug_pending');
}

