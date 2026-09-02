/* ---------- send ---------- */
/* v4.1 — verified name payment targets (two-tap confirm: first Send tap
   resolves + verifies, second tap re-verifies and only then pays) */
let _opnsTarget=null;   // { kind:'opns', name, holderAddress, currentTxid, currentVout }
let _snsTarget=null;    // { kind:'sns', name, mailbox, fallback, holderAddress, currentTxid, currentVout, expires, warning }

function validAddress(s){ try{ bsv.Address.fromString(String(s)); return true; }catch(e){ return false; } }

/* bare OpNS name candidate: a-z, 0-9, hyphen — and NO dot (a dotted name is
   SNS, never OpNS) and no @ (paymail is not a payment target here) */
function opnsNameCandidate(s){
  const t=String(s).trim().toLowerCase();
  if(!t || t.includes('.') || t.includes('@')) return null;
  if(!/^[a-z0-9-]+$/.test(t)) return null;
  if(validAddress(t)) return null;
  return t;
}
/* SNS candidate: `naam.tld` or `mailbox@naam.tld` — a dot in the domain part
   is what separates SNS from OpNS. ASCII lowercase only by construction, so
   homograph/mixed-script inputs never reach the resolver from here. The TLD
   list is NOT hardcoded: the resolver itself answers unknown_tld/retired_tld
   with a readable inline message. */
function snsInputCandidate(s){
  const t=String(s).trim().toLowerCase();
  return /^(?:[a-z0-9][a-z0-9._-]{0,63}@)?(?:[a-z0-9][a-z0-9-]{0,62}\.)+[a-z][a-z0-9-]{1,24}$/.test(t) ? t : null;
}
function clearNameTargets(){ _opnsTarget=null; _snsTarget=null; }

function shortUtxo(txid, vout){ return String(txid).slice(0,10)+'…'+String(txid).slice(-6)+'_'+vout; }

/* confirm block + button label follow the verified target (SNS wins if both
   were ever set — they can't be: the candidates are mutually exclusive) */
function updateSendConfirmUI(){
  const box=$('sendConfirm'), btn=$('sendBtn');
  const t=_snsTarget||_opnsTarget;
  if(!t){
    box.classList.add('hidden'); box.innerHTML='';
    btn.textContent='Send';
    return;
  }
  if(t.kind==='sns'){
    // pay-to address comes from the SIGNED holder_script, never from the
    // unsigned holder_address field
    box.innerHTML='<div class="kv" style="border:none;padding:4px 0;font-weight:600">Confirm SNS payment</div>'
      +'<div class="kv"><span class="k">Name</span><span class="v">'+esc(t.name)+'</span></div>'
      +(t.mailbox?('<div class="kv"><span class="k">Mailbox</span><span class="v">'+esc(t.mailbox+'@'+t.name)+'</span></div>'):'')
      +'<div class="kv"><span class="k">Holder address</span><span class="v" style="font-family:monospace">'+esc(t.holderAddress)+'</span></div>'
      +'<div class="kv"><span class="k">Inscription UTXO</span><span class="v" style="font-family:monospace">'+esc(shortUtxo(t.currentTxid, t.currentVout))+'</span></div>'
      +(t.fallback?('<div class="alert alert-warning show" style="margin-top:8px">Mailbox "'+esc(t.mailbox)+'" is unknown — the payment goes to the holder of '+esc(t.name)+'.</div>'):'')
      +(t.warning?('<div class="alert alert-warning show" style="margin-top:8px">'+esc(t.warning).replace(/\n/g,'<br>')+'</div>'):'')
      +'<div class="hint" style="margin-top:8px">Signed resolver answer verified against the pinned key; the inscription outpoint was checked unspent. Everything is re-verified the moment you confirm.</div>';
    btn.textContent='Confirm & pay "'+(t.mailbox?(t.mailbox+'@'+t.name):t.name)+'"';
  } else {
    // OpNS: ALWAYS the exact name + the verified holder address, inline,
    // before anything is paid (intermediate names like "alexande" vs
    // "alexander" can have different owners)
    box.innerHTML='<div class="kv" style="border:none;padding:4px 0;font-weight:600">Confirm OpNS payment</div>'
      +'<div class="kv"><span class="k">Exact name</span><span class="v">'+esc(t.name)+'</span></div>'
      +'<div class="kv"><span class="k">Verified holder</span><span class="v" style="font-family:monospace">'+esc(t.holderAddress)+'</span></div>'
      +'<div class="kv"><span class="k">Inscription UTXO</span><span class="v" style="font-family:monospace">'+esc(shortUtxo(t.currentTxid, t.currentVout))+'</span></div>'
      +'<div class="hint" style="margin-top:8px">Exact match only; the holder address was recomputed from the on-chain locking script and the outpoint was checked unspent. Everything is re-verified the moment you confirm.</div>';
    btn.textContent='Confirm & pay "'+t.name+'"';
  }
  box.classList.remove('hidden');
}

function showSend(){
  showView('send');
  $('sendFrom').textContent='From: '+(_accounts[_active].name||'Account')+' · '+_address;
  $('sendTo').value=''; $('sendAmt').value=''; clr($('sendErr'));
  $('sendWarn').style.display='none'; $('sendWarn').innerHTML='';
  $('sendFeeInfo').textContent='~'+sendMinerFee().toLocaleString()+' sats network + '+TOTAL_SERVICE_FEES.toLocaleString()+' sats service';
  const ok=$('sendOk'); ok.className='alert alert-success'; ok.textContent='';
  $('sendSaveBtn').classList.add('hidden');
  clearNameTargets(); updateSendConfirmUI();
  fillSendBook();
  _lastKnownBalance=null;
  getBalance().then(b=>{ _lastKnownBalance=(b.confirmed||0); }).catch(()=>{});
}
/* the actual broadcast + aftercare — shared by the address path and the
   verified OpNS/SNS name paths */
async function performSendTo(to, amt){
  const ok=$('sendOk');
  const tx=await buildSend(to, amt, null);
  const txid=await broadcastAndRegister(tx);
  ok.textContent='Sent! TXID: '+txid; ok.className='alert alert-success show';
  _lastSentAddr=to;
  if(!bookLabelFor(to) && !_accounts.some(a=>a.address===to)){
    $('sendSaveBtn').textContent='Save '+to.slice(0,8)+'… to address book';
    $('sendSaveBtn').classList.remove('hidden');
  }
  $('sendTo').value=''; $('sendAmt').value='';
  $('sendWarn').style.display='none';
  clearNameTargets();
}
async function doSend(){
  clr($('sendErr')); const ok=$('sendOk'); ok.className='alert alert-success'; ok.textContent='';
  const to=$('sendTo').value.trim(); const amt=parseInt($('sendAmt').value)||0;
  if(!to){ err($('sendErr'),'Enter a recipient address, SNS or OpNS name.'); return; }
  if(amt<1){ err($('sendErr'),'Enter an amount in sats (1 or more).'); return; }
  const btn=$('sendBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Working...';
  try{
    // plain BSV address — the original path, unchanged
    if(validAddress(to)){
      clearNameTargets();
      await performSendTo(to, amt);
      return;
    }
    // v4.1 — SNS name or mailbox (naam.tld / mailbox@naam.tld): resolve via
    // the SIGNED resolver; two-tap confirm, re-verified at signing. The
    // freshness/expires checks live in resolveSnsPayment.
    const snsInput=snsInputCandidate(to);
    if(snsInput){
      let target;
      try{ target=await resolveSnsPayment(snsInput); }
      catch(e){ clearNameTargets(); throw e; }
      const seen=_snsTarget;
      if(seen && seen.name===target.name && seen.holderAddress===target.holderAddress){
        // same verified holder — either identical, or only the freshness
        // fields moved (expires/outpoint re-issued): safe to pay
        await performSendTo(target.holderAddress, amt);
      } else if(seen){
        _snsTarget=target;
        err($('sendErr'),'The verified details of '+target.name+' changed while you were confirming — review them and press the button again. Nothing was paid.');
      } else {
        _snsTarget=target;
      }
      return;
    }
    // v4.1 — not an address, not SNS: OpNS name or paymail?
    if(to.includes('@')){
      err($('sendErr'),'Paymail (name@host) is not accepted as a payment target: any host can serve any name and bindings expire on transfer. Enter the bare OpNS name, an SNS mailbox (mailbox@naam.tld) or a BSV address.');
      return;
    }
    const name=opnsNameCandidate(to);
    if(!name){ err($('sendErr'),'That is not a valid BSV address.'); return; }
    // two-tap confirm; the resolve (exact match + on-chain recompute +
    // unspent outpoint) runs on EVERY tap, so the confirm tap re-verifies
    // right before broadcasting — never a cached address
    let target;
    try{ target=await resolveOpnsPayment(name); }
    catch(e){ clearNameTargets(); throw e; }
    const seen=_opnsTarget;
    if(seen && seen.name===target.name && seen.holderAddress===target.holderAddress
       && seen.currentTxid===target.currentTxid && seen.currentVout===target.currentVout){
      await performSendTo(target.holderAddress, amt);
    } else if(seen){
      _opnsTarget=target;
      err($('sendErr'),'The verified details of "'+target.name+'" changed while you were confirming — review them and press the button again. Nothing was paid.');
    } else {
      _opnsTarget=target;
    }
  }catch(e){ err($('sendErr'), e.message||'Send failed.'); }
  finally{ btn.disabled=false; updateSendConfirmUI(); }
}
async function showIdle(){
  showView('idle');
  $('idleName').textContent='BitcoinSV';
  $('idleAddress').textContent=_address;
  $('idleBalance').textContent='\u2026';
  $('idleBalanceSub').textContent=(_accounts[_active].name||'Account')+' \u00b7 confirmed + unconfirmed';
  // leave bulk-selection mode when (re)entering home
  _bulkMode=false; _bulkArmed=false; _bulkSel.clear();
  $('bulkPanel').classList.add('hidden'); $('btnBulkList').classList.remove('on');
  // keep tab + page + search: returning from a listing on page 6 lands back on page 6
  setHoldTab(_holdTab);
  loadHoldings();
  try{
    const b=await getBalance();
    const sats=(b.confirmed||0)+(b.unconfirmed||0);
    $('idleBalance').innerHTML=bsvFmt(sats)+' <small>BSV</small>';
    let sub=(_accounts[_active].name||'Account')+' · '+sats.toLocaleString()+' sats';
    try{
      const r=await fetch(`${API_BASE}/exchangerate`);
      if(r.ok){ const j=await r.json(); const rate=parseFloat(j.rate);
        if(rate>0) sub+=' \u00b7 \u2248 $'+((sats/1e8)*rate).toFixed(2); }
    }catch(_){}
    $('idleBalanceSub').textContent=sub;
  }catch(e){
    // outage, rate limit or malformed answer: say so, never print 0
    $('idleBalance').textContent='unavailable';
    $('idleBalanceSub').textContent=(_accounts[_active].name||'Account')+' \u00b7 balance service unreachable \u2014 not zero, just unknown';
  }
}
function bsvFmt(sats){
  const v=sats/1e8;
  let s=v.toFixed(8);
  s=s.replace(/(\.\d*?)0+$/,'$1').replace(/\.$/,'');
  return s;
}
let _copyTimer=null;
async function copyActiveAddress(){
  try{
    await navigator.clipboard.writeText(_address);
    const n=$('copiedNote'); n.classList.remove('hidden');
    if(_copyTimer) clearTimeout(_copyTimer);
    _copyTimer=setTimeout(()=>n.classList.add('hidden'), 1400);
    return true;
  }catch(e){ return false; }
}

/* ---------- receive ---------- */
function showReceive(){
  showView('receive');
  $('rcvName').textContent=(_accounts[_active].name||'Account')+' \u00b7 BSV mainnet';
  $('rcvAddress').textContent=_address;
  const ok=$('rcvOk'); ok.className='alert alert-success'; ok.textContent='';
  try{
    const qr=qrcode(0,'M'); qr.addData(_address); qr.make();
    $('qrBox').innerHTML=qr.createSvgTag({ cellSize:4, margin:0, scalable:true });
  }catch(e){ $('qrBox').innerHTML='<div class="empty-note">QR unavailable</div>'; }
}
async function copyReceiveAddress(){
  const ok=$('rcvOk');
  try{
    await navigator.clipboard.writeText(_address);
    ok.textContent='Address copied to clipboard.'; ok.className='alert alert-success show';
  }catch(e){ ok.textContent='Could not copy \u2014 select and copy the address manually.'; ok.className='alert alert-success show'; }
}

/* ---------- history ---------- */
async function showHistory(){
  showView('history');
  $('histSub').textContent=_address.slice(0,10)+'\u2026'+_address.slice(-6);
  const list=$('histList'); list.innerHTML='<div class="empty-note">Loading\u2026</div>';
  try{
    const r=await fetch(`${API_BASE}/address/${_address}/history`);
    if(!r.ok) throw new Error('history unavailable');
    let txs=await r.json(); if(!Array.isArray(txs)) txs=[];
    txs.sort((a,b)=>{ const ha=(a.height&&a.height>0)?a.height:1e12, hb=(b.height&&b.height>0)?b.height:1e12; return hb-ha; });
    const rows=txs.slice(0,15).map(t=>`
      <div class="txrow" data-tx="${esc(t.tx_hash)}" title="Open on WhatsOnChain">
        <div class="tic">${ICONS.txSmall}</div>
        <div class="tm">
          <div class="th">${esc(t.tx_hash)}</div>
          <div class="ts">${(t.height&&t.height>0)?('block '+t.height):'pending (mempool)'}</div>
        </div>
      </div>`).join('');
    list.innerHTML=rows||'<div class="empty-note">No transactions on this address yet.</div>';
  }catch(e){ list.innerHTML='<div class="empty-note">Could not load history from WhatsOnChain.</div>'; }
}

