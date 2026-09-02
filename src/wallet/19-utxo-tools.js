/* =========================================================================
   v4.2 — UTXO tools (split & combine, iOS v2.3.0 parity)
   Both operate on the ordinal-protected UTXO set (1-sat inscriptions can
   never be spent here) and carry the ORDnet service fees like every other
   transaction. Two-tap confirm, errors inline.
   ========================================================================= */
let _utConfirm=null;   // 'split' | 'combine' | null
let _utStats={ count:0, total:0, largest:0 };

async function showUtxoTools(){
  showView('utxo');
  _utConfirm=null; updateUtxoUI();
  clr($('utErr')); const ok=$('utOk'); ok.className='alert alert-success'; ok.textContent='';
  $('utStats').innerHTML='<div class="empty-note">Loading…</div>';
  await refreshUtxoStats();
  updateSplitHint();
}
async function refreshUtxoStats(){
  try{
    const u=await getUTXOs(_address);
    _utStats={ count:u.length, total:u.reduce((a,x)=>a+x.satoshis,0), largest:u.reduce((a,x)=>Math.max(a,x.satoshis),0) };
    $('utStats').innerHTML=
      '<div class="kv"><span class="k">Count</span><span class="v">'+_utStats.count+'</span></div>'
      +'<div class="kv"><span class="k">Total</span><span class="v">'+bsvFmt(_utStats.total)+' BSV ('+_utStats.total.toLocaleString()+' sats)</span></div>'
      +'<div class="kv"><span class="k">Largest</span><span class="v">'+_utStats.largest.toLocaleString()+' sats</span></div>';
  }catch(e){
    _utStats={ count:0, total:0, largest:0 };
    $('utStats').innerHTML='<div class="empty-note">Could not load UTXOs: '+esc(e.message||e)+'</div>';
  }
}
function splitVals(){ return { n:parseInt($('utCount').value)||0, s:parseInt($('utSats').value)||0 }; }
function updateSplitHint(){
  const { n, s }=splitVals();
  $('utSplitHint').innerHTML=(n>=2 && s>=547)
    ? ('= '+(n*s).toLocaleString()+' sats into outputs + ~miner fee + '+bsvFmt(TOTAL_SERVICE_FEES)+' BSV service')
    : '&nbsp;';
}
function updateUtxoUI(){
  const sc=$('utSplitConfirm'), cc=$('utCombineConfirm');
  sc.classList.toggle('hidden', _utConfirm!=='split');
  cc.classList.toggle('hidden', _utConfirm!=='combine');
  if(_utConfirm==='split'){
    const { n, s }=splitVals();
    sc.innerHTML='<div class="kv" style="border:none;padding:0"><span class="k">Confirm</span><span class="v">'+n+' × '+s.toLocaleString()+' sats → your own address</span></div>';
  }
  if(_utConfirm==='combine'){
    cc.innerHTML='<div class="kv" style="border:none;padding:0"><span class="k">Confirm</span><span class="v">'+_utStats.count+' UTXOs → 1 output to your own address</span></div>';
  }
  $('utSplitBtn').textContent=_utConfirm==='split' ? 'Confirm & split' : 'Split…';
  $('utCombineBtn').textContent=_utConfirm==='combine' ? 'Confirm & combine' : 'Combine…';
}
async function doSplitTap(){
  clr($('utErr')); const ok=$('utOk'); ok.className='alert alert-success'; ok.textContent='';
  const { n, s }=splitVals();
  if(_utConfirm!=='split'){
    if(!(n>=2 && n<=200)){ err($('utErr'),'Choose between 2 and 200 UTXOs.'); return; }
    if(!(s>=547)){ err($('utErr'),'Each UTXO needs at least 547 sats (above dust).'); return; }
    const needed=n*s+TOTAL_SERVICE_FEES;
    if(_utStats.total<=needed){ err($('utErr'),'Insufficient spendable balance: this split needs ~'+needed.toLocaleString()+' sats + miner fee, you have '+_utStats.total.toLocaleString()+'.'); return; }
    _utConfirm='split'; updateUtxoUI(); return;
  }
  const btn=$('utSplitBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Splitting...';
  try{
    const outs=Array.from({length:n}, ()=>({ type:'p2pkh', address:_address, satoshis:s }));
    const tx=await buildTx({ outputs:outs });
    const txid=await broadcastAndRegister(tx);
    ok.textContent='Split done! '+n+' × '+s.toLocaleString()+' sats created. TXID: '+txid; ok.className='alert alert-success show';
    _utConfirm=null;
    await refreshUtxoStats();
  }catch(e){ err($('utErr'), e.message||'Split failed.'); }
  finally{ btn.disabled=false; updateUtxoUI(); }
}
/* ALL spendable (ordinal-protected) UTXOs into one output to self — port of
   the iOS engine's buildConsolidate */
async function buildConsolidateTx(){
  const pk=bsv.PrivateKey.fromWIF(_wif), from=pk.toAddress();
  const utxos=await getUTXOs(_address);
  if(!utxos.length) throw new Error('No spendable UTXOs to combine. Your balance may be locked in pending transactions.');
  if(utxos.length<2) throw new Error('Nothing to combine — you have only one spendable UTXO.');
  let total=0; utxos.forEach(u=>{ total+=u.satoshis; });
  const feeSat=Math.ceil((10 + utxos.length*148 + 34 + 11*34) * FEE_RATE);
  const out=total-feeSat-TOTAL_SERVICE_FEES;
  if(out<546) throw new Error('Combined balance too small to cover fee + service fee (needs at least '+(feeSat+TOTAL_SERVICE_FEES+546)+' sats).');
  const tx=new bsv.Transaction();
  utxos.forEach(u=>tx.from(new bsv.Transaction.UnspentOutput({ txid:u.txid, outputIndex:u.vout, address:from, script:u.scriptPubKey||u.script, satoshis:u.satoshis })));
  tx.to(from, out);
  addServiceFees(tx);
  tx.fee(feeSat); tx.sign(pk);
  return { tx, outputSat:out };
}
async function doCombineTap(){
  clr($('utErr')); const ok=$('utOk'); ok.className='alert alert-success'; ok.textContent='';
  if(_utConfirm!=='combine'){
    if(_utStats.count<2){ err($('utErr'),'Nothing to combine — you have '+_utStats.count+' spendable UTXO'+(_utStats.count===1?'':'s')+'.'); return; }
    _utConfirm='combine'; updateUtxoUI(); return;
  }
  const btn=$('utCombineBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Combining...';
  try{
    const { tx, outputSat }=await buildConsolidateTx();
    const txid=await broadcastAndRegister(tx);
    ok.textContent='Combined into one UTXO of '+outputSat.toLocaleString()+' sats. TXID: '+txid; ok.className='alert alert-success show';
    _utConfirm=null;
    await refreshUtxoStats();
  }catch(e){ err($('utErr'), e.message||'Combine failed.'); }
  finally{ btn.disabled=false; updateUtxoUI(); }
}

