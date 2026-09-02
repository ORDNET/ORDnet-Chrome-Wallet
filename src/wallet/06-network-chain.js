/* ---------- network: UTXOs + broadcast ---------- */
async function fetchUnspent(address){
  const urls = [
    `${API_BASE}/address/${address}/confirmed/unspent`,
    `${API_BASE}/address/${address}/unspent`
  ];
  for(const url of urls){
    try{
      const res = await fetch(url);
      if(!res.ok) continue;
      const data = await res.json();
      let list = Array.isArray(data) ? data : (data && Array.isArray(data.result) ? data.result : []);
      list = list.filter(u => u && u.tx_hash && !u.isSpentInMempoolTx);
      if(list.length) return list;
    }catch(_){}
  }
  return [];
}
/* Outpoints the wallet KNOWS carry an inscription, from the holdings it has
   already loaded. The `value > 1` heuristic alone is not enough: an ordinal
   that arrives from a marketplace or another wallet usually carries padding
   (2 sats and up), passes that filter, and gets burned as funding. We have the
   outpoints — so we use them. */
function protectedOutpoints(){
  const set=new Set();
  for(const it of (_holdings||[])){
    if(it && it.currentTxid) set.add(String(it.currentTxid)+':'+((it.currentVout|0)||0));
    if(it && it.txid)        set.add(String(it.txid)+':'+((it.vout|0)||0));
  }
  return set;
}
async function getUTXOs(address){
  const list = await fetchUnspent(address);
  const prot = protectedOutpoints();
  const script = bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(address)).toHex();
  let shaped = list
    .filter(u => u.tx_hash && u.tx_hash.length === 64)
    .filter(u => u.value > 1) // first line of defence: bare 1-sat UTXOs are never funding
    .filter(u => !prot.has(u.tx_hash + ':' + u.tx_pos)) // second: known inscriptions, whatever their padding
    .slice(0, 200) // enough funding headroom for bulk claims (300 BSVmaps ≈ 1.5 BSV)
    .map(u => ({ txid:u.tx_hash, vout:u.tx_pos, satoshis:u.value, script, scriptPubKey:script }));
  // v4.2 — chain mechanism: minus the spent-guard, plus our own chain tips
  // WoC doesn't list yet — consecutive transactions never starve for funding
  const guarded = new Set(_spentGuard[address]||[]);
  shaped = shaped.filter(u => !guarded.has(u.txid+':'+u.vout));
  // v4.2 — BRC-100 relinquishOutput: outpoints the wallet must no longer
  // manage are excluded from funding (persisted per address)
  const relinquished = _brc100Relinquished[address]||[];
  if(relinquished.length){
    const rel=new Set(relinquished);
    shaped = shaped.filter(u => !rel.has(u.txid+'.'+u.vout));
  }
  const listed = new Set(shaped.map(u => u.txid+':'+u.vout));
  const tips = (_chainTips[address]||[]).filter(t =>
    !listed.has(t.txid+':'+t.vout) && !guarded.has(t.txid+':'+t.vout) &&
    !prot.has(t.txid+':'+t.vout) && t.satoshis>1);
  return shaped.concat(tips.map(t => ({ txid:t.txid, vout:t.vout, satoshis:t.satoshis, script, scriptPubKey:script })));
}
async function broadcast(tx){
  const res=await fetch(`${API_BASE}/tx/raw`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ txhex:tx.toString() }) });
  if(!res.ok) throw new Error(await res.text());
  return (await res.text()).replace(/"/g,'');
}

/* =========================================================================
   v4.2 — chain mechanism (iOS v2.3.0 parity): consecutive TXs without
   waiting. After every successful broadcast the wallet registers its own
   change/split outputs as immediately-spendable "chain tips" and puts the
   inputs it just spent in a spent-guard. getUTXOs() then serves: WoC list
   minus the guard, plus the tips WoC doesn't know yet. Result: Send,
   Inscribe, ordinal transfers, the UTXO tools and BRC-100 createAction run
   back-to-back without "no spendable UTXOs". 1-sat outputs are NEVER tips
   (ordinal protection holds everywhere). Tips persist per address and are
   validated against the direct spent-endpoint on unlock/account switch.
   ========================================================================= */
const CHAIN_TIPS_KEY  = 'ordplug_chain_tips_v1';
const SPENT_GUARD_KEY = 'ordplug_spent_guard_v1';
let _chainTips = {};    // { address: [{txid, vout, satoshis}] }
let _spentGuard = {};   // { address: ["txid:vout", ...] }

async function loadChainState(){
  _chainTips = (await storageGet(CHAIN_TIPS_KEY)) || {};
  _spentGuard = (await storageGet(SPENT_GUARD_KEY)) || {};
}
async function saveChainState(){
  await storageSet({ [CHAIN_TIPS_KEY]: _chainTips, [SPENT_GUARD_KEY]: _spentGuard });
}
/* parse a signed rawtx and report: the inputs it spends and the outputs that
   pay >1 sat to `address` (spendable change/split outputs — 1-sat outputs are
   ordinals and are NEVER funding). Port of the iOS engine's txSpendInfo. */
function txSpendInfo(rawtx, address){
  const tx=new bsv.Transaction(rawtx);
  const script=bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(address)).toHex();
  const inputs=tx.inputs.map(i=>({ txid:i.prevTxId.toString('hex'), vout:i.outputIndex }));
  const own=[];
  tx.outputs.forEach((o,idx)=>{
    if(o.script.toHex()===script && o.satoshis>1){
      own.push({ txid:tx.id, vout:idx, satoshis:o.satoshis });
    }
  });
  return { txid:tx.id, inputs, ownOutputs:own };
}
/* on unlock / account switch: drop tips that are PROVABLY spent (the direct
   spent-endpoint; unknown keeps the tip — it fails fast on conflict anyway)
   and keep the guard bounded. */
async function validateChainTips(){
  const addr=_address; if(!addr) return;
  const tips=_chainTips[addr]||[];
  if(tips.length){
    const keep=[];
    for(const t of tips){
      if(await outpointSpent(t.txid, t.vout)===true) continue;
      keep.push(t);
    }
    _chainTips[addr]=keep;
  }
  if((_spentGuard[addr]||[]).length>300) _spentGuard[addr]=[];
  await saveChainState();
}
/* bookkeeping after a successful broadcast of OUR OWN tx */
function registerBroadcast(rawtx){
  let info; try{ info=txSpendInfo(rawtx, _address); }catch(_){ return; }
  const g=new Set(_spentGuard[_address]||[]);
  info.inputs.forEach(i=>g.add(i.txid+':'+i.vout));
  _spentGuard[_address]=[...g];
  let tips=(_chainTips[_address]||[]).filter(t=>!g.has(t.txid+':'+t.vout));
  tips=tips.concat(info.ownOutputs);
  _chainTips[_address]=tips;
  saveChainState();
}
/* broadcast + chain bookkeeping. On a mempool-conflict the local picture was
   stale: guard the attempted inputs, drop the tips and ask (inline) for one
   retry on a fresh set. */
async function broadcastAndRegister(tx){
  const rawtx=tx.toString();
  try{
    const txid=await broadcast(tx);
    registerBroadcast(rawtx);
    return txid;
  }catch(e){
    const m=String(e && e.message || e).toLowerCase();
    if(m.includes('conflict')||m.includes('missing inputs')||m.includes('mempool')){
      try{
        const info=txSpendInfo(rawtx, _address);
        const g=new Set(_spentGuard[_address]||[]);
        info.inputs.forEach(i=>g.add(i.txid+':'+i.vout));
        _spentGuard[_address]=[...g];
      }catch(_){}
      _chainTips[_address]=[];
      await saveChainState();
      throw new Error((e.message||e)+' — The wallet dropped its local UTXO chain and will fetch a fresh set. Try again.');
    }
    throw e;
  }
}

