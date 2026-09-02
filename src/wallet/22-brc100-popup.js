/* =========================================================================
   v4.2 — BRC-100 provider, popup side (iOS v2.4.0–v2.6.0 parity)
   Fase 1 is answered in the background worker (no keys). Fase 2 (keys &
   crypto via the bundled @bsv/sdk ProtoWallet, behind BRC-43 grants) and
   fase 3 (money: createAction c.s., per-transaction confirm — money ≠
   grant) run here, where the unlocked key lives. Keys never reach the page:
   the page only sees the key-free window.CWI shim.
   ========================================================================= */
const BRC100_PHASE2=['getPublicKey','encrypt','decrypt','createSignature','verifySignature','createHmac','verifyHmac'];
let _pendingBrc100=null;

function brc100Err(name, code, message){ const e=new Error(message); e.name=name; e.code=code; return e; }
function _sdk(){
  const S=(typeof globalThis!=='undefined' && globalThis.BSVSDK)||null;
  if(!S) throw brc100Err('WERR_UNKNOWN', 1, 'BRC-100 engine bundle (BSVSDK) is not loaded.');
  return S;
}
let _brc100Wallet=null, _brc100Wif=null;
function brc100InitWallet(){
  if(_brc100Wallet && _brc100Wif===_wif) return _brc100Wallet;
  const S=_sdk();
  _brc100Wallet=new S.ProtoWallet(S.PrivateKey.fromWif(_wif));
  _brc100Wif=_wif;
  return _brc100Wallet;
}
function brc100ResetWallet(){ _brc100Wallet=null; _brc100Wif=null; }

/* BRC-43 grants: level 0 open; level 1 per app+protocol; level 2 +
   counterparty; the identity key has its own per-app grant. */
async function brc100RequirePermission(origin, method, args){
  const isIdentity=(method==='getPublicKey' && args.identityKey===true);
  let level=0, protocolName='—';
  if(Array.isArray(args.protocolID) && args.protocolID.length===2){
    level=parseInt(args.protocolID[0],10)||0;
    protocolName=String(args.protocolID[1]||'—');
  }
  const counterparty=String(args.counterparty||'self');
  if(!isIdentity && level===0) return;   // level 0: open protocol
  const grantKey=isIdentity
    ? `${_address}|${origin}|identity`
    : `${_address}|${origin}|${level}|${protocolName}${level>=2?('|'+counterparty):''}`;
  if(_brc100Grants.includes(grantKey)) return;
  const titles={ getPublicKey:(isIdentity?'Share identity key':'Share a derived public key'),
    encrypt:'Encrypt data', decrypt:'Decrypt data', createSignature:'Create a signature',
    verifySignature:'Verify a signature', createHmac:'Create an HMAC', verifyHmac:'Verify an HMAC' };
  const title=titles[method]||method;
  let detail=isIdentity
    ? 'The app asks for your identity key (a public key that identifies this wallet to the app).'
    : 'Protocol: '+protocolName+' · security level '+level;
  if(!isIdentity && level>=2) detail+='\nCounterparty: '+counterparty.slice(0,10)+'…'+counterparty.slice(-6);
  const approved=await new Promise(res=>{
    showView('brc100perm');
    $('bpIcon').innerHTML=ICONS.key;
    $('bpTitle').textContent=title;
    $('bpOrigin').textContent=origin||'unknown app';
    $('bpDetail').textContent=detail;
    $('bpAllow').onclick=()=>res(true);
    $('bpDeny').onclick=()=>res(false);
  });
  if(!approved) throw brc100Err('WERR_PERMISSION_DENIED', 1, 'The user denied '+title.toLowerCase()+' for '+origin+'.');
  _brc100Grants.push(grantKey);
  await saveBrc100Grants();
}
/* H7 — per-origin consent for the BRC-100 read surface.
   listActions and listOutputs used to be callable by any site with no check at
   all: the full transaction history and every UTXO, to anyone who asked. Both
   Android and iOS gated these in August; the extension did not. The grant is
   per origin and persists like the other BRC-100 grants, so a dApp asks once. */
async function brc100RequireReadConsent(origin, method){
  const grantKey=`${_address}|${origin}|read|${method}`;
  if(_brc100Grants.includes(grantKey)) return;
  // listCertificates is NOT here: it routes through brc100RequirePermission
  // instead. Listing it would have been dead code pretending to be coverage.
  const titles={
    listActions:'See your transaction history',
    listOutputs:'See your coins'
  };
  const details={
    listActions:'The app asks to read the transactions of this wallet: amounts, labels and counterparties. No coins move.',
    listOutputs:'The app asks to read every unspent output this wallet holds, including its ordinals. No coins move.'
  };
  const approved=await new Promise(res=>{
    showView('brc100perm');
    $('bpIcon').innerHTML=ICONS.key;
    $('bpTitle').textContent=titles[method]||method;
    $('bpOrigin').textContent=origin||'unknown app';
    $('bpDetail').textContent=details[method]||'The app asks to read wallet data.';
    $('bpAllow').onclick=()=>res(true);
    $('bpDeny').onclick=()=>res(false);
  });
  if(!approved) throw brc100Err('WERR_PERMISSION_DENIED', 1, 'The user denied read access for '+origin+'.');
  _brc100Grants.push(grantKey);
  await saveBrc100Grants();
}

/* Destructive BRC-100 calls confirm on EVERY invocation and never persist a
   grant — a loop must not be able to strip the wallet behind one approval.
   Covers relinquishOutput and relinquishCertificate: both discard something
   permanently, and a fix applied to only one of them is how the second one
   stays open. Anything destructive added later routes through here too. */
const BRC100_DESTRUCTIVE={
  relinquishOutput:{ title:'Give up an output',
    what:'stop tracking', subject:'an output' },
  relinquishCertificate:{ title:'Delete a certificate',
    what:'permanently delete', subject:'a certificate' }
};
async function brc100RequireDestructive(origin, method, subject){
  const spec=BRC100_DESTRUCTIVE[method]||{ title:'Destructive action', what:'carry out', subject:'this action' };
  const approved=await new Promise(res=>{
    showView('brc100perm');
    $('bpIcon').innerHTML=ICONS.key;
    $('bpTitle').textContent=spec.title;
    $('bpOrigin').textContent=origin||'unknown app';
    $('bpDetail').textContent='The app asks this wallet to '+spec.what+' '+
      String(subject||spec.subject).slice(0,72)+
      '.\n\nThis cannot be undone from here, and it is asked again every time.';
    $('bpAllow').onclick=()=>res(true);
    $('bpDeny').onclick=()=>res(false);
  });
  if(!approved) throw brc100Err('WERR_PERMISSION_DENIED', 1, 'The user denied '+method+' for '+origin+'.');
}

/* per-transaction confirm (fase 3): money ≠ grant, nothing persists */
async function brc100RequireTxConfirm(opts){
  // V45 — per-app daily budget: wallet-built OUTGOING payments within the
  // origin's remaining allowance auto-approve; everything else confirms.
  // dApp-built signAction never routes through here with a budget (policy).
  const _rate=await getUsdRate();
  const _budgets=await loadBudgets();
  const BE=globalThis.OrdplugBudget;
  if(BE && !opts.incoming && opts.origin && typeof opts.total==='number'){
    const d=BE.decide(_budgets, opts.origin, opts.total, _rate, Date.now());
    if(d.autoApprove){
      BE.recordSpend(_budgets, opts.origin, d.amountUsd, Date.now());
      await saveBudgets(_budgets);
      return; // within the user-granted daily allowance: no popup friction
    }
  }
  const approved=await new Promise(res=>{
    showView('brc100tx');
    $('btIcon').innerHTML=opts.incoming?ICONS.bag:ICONS.sendBig;
    $('btTitle').textContent=opts.title;
    $('btOrigin').textContent=opts.origin||'unknown app';
    $('btDesc').textContent=opts.description||'';
    $('btLines').innerHTML=opts.lines.map(l=>
      '<div class="kv"><span class="k" style="max-width:55%;overflow:hidden;text-overflow:ellipsis">'+esc(l.dest)+'</span><span class="v">'+l.sats.toLocaleString()+' sats'+(l.note?('<br><small style="color:var(--text-secondary)">'+esc(l.note)+'</small>'):'')+'</span></div>').join('');
    $('btMiner').textContent=opts.incoming?'—':('~'+opts.miner.toLocaleString()+' sats');
    $('btService').textContent=opts.incoming?'—':(opts.service.toLocaleString()+' sats');
    $('btTotal').textContent=opts.total.toLocaleString()+' sats ('+bsvFmt(opts.total)+' BSV)'+usdFmt(globalThis.OrdplugBudget?globalThis.OrdplugBudget.satsToUsd(opts.total,_rate):null);
    // V45 — offer a daily allowance grant on outgoing confirms (default $10,
    // adjustable, revocable by unticking on a later confirm).
    const bEl=document.createElement('div');
    if(!opts.incoming && opts.origin){
      const cur=globalThis.OrdplugBudget?globalThis.OrdplugBudget.getBudget(_budgets,opts.origin):null;
      bEl.style.cssText='font-size:12px;color:var(--text-secondary);margin-top:8px';
      bEl.innerHTML='<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="btBudgetChk"'+(cur?' checked':'')+'> Allow up to $<input id="btBudgetAmt" type="number" min="1" max="1000" value="'+(cur?cur.limitUsd:10)+'" style="width:52px"> per day for this app without asking</label>';
      $('btLines').appendChild(bEl);
    }
    $('btApprove').onclick=()=>res(true);
    $('btReject').onclick=()=>res(false);
  });
  if(!approved) throw brc100Err('WERR_PERMISSION_DENIED', 1, 'The user rejected the transaction for '+opts.origin+'.');
  // Persist the allowance choice made on this confirm (approve only).
  try{
    const chk=document.getElementById('btBudgetChk'), amt=document.getElementById('btBudgetAmt');
    if(chk && globalThis.OrdplugBudget && opts.origin){
      if(chk.checked){
        globalThis.OrdplugBudget.setLimit(_budgets, opts.origin, Math.min(1000,Math.max(1,parseFloat(amt&&amt.value)||10)), Date.now());
        // the payment just approved counts toward today's allowance
        if(typeof opts.total==='number'&&_rate) globalThis.OrdplugBudget.recordSpend(_budgets, opts.origin, globalThis.OrdplugBudget.satsToUsd(opts.total,_rate)||0, Date.now());
      } else { globalThis.OrdplugBudget.setLimit(_budgets, opts.origin, null, Date.now()); }
      await saveBudgets(_budgets);
    }
  }catch(_){ }
}

/* ---- fase 3 engine (port of iOS wallet-core.js, adapted to the plugin's builders) ---- */
function _werr(name, code, message){ return { valid:false, werr:{ name, code, message } }; }
function _validDesc(s){ return typeof s==='string' && s.length>=5 && s.length<=2000; }
function _validLabel(s){ return typeof s==='string' && s.length>=1 && s.length<=300; }
function _validHexScript(h){
  if(typeof h!=='string' || !h.length || h.length%2 || /[^0-9a-fA-F]/.test(h)) return false;
  try{ bsv.Script.fromHex(h); return true; }catch(e){ return false; }
}
/* createAction argument validation + normalisation (pure, deterministic,
   covered in tests). Regel 1: outputs-only — custom inputs refuse explicitly
   until the signableTransaction path really exists. */
function brc100ValidateCreate(argsJson){
  let a; try{ a=typeof argsJson==='string'?JSON.parse(argsJson):(argsJson||{}); }
  catch(e){ return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: args must be valid JSON.'); }

  if(a.inputs && a.inputs.length)
    return _werr('WERR_UNSUPPORTED_ACTION', 2, 'createAction with custom inputs (signableTransaction) is not supported yet by the ORDnet wallet — outputs-only actions are.');
  if(a.inputBEEF && a.inputBEEF.length)
    return _werr('WERR_UNSUPPORTED_ACTION', 2, 'createAction: inputBEEF requires the signableTransaction path, which is not supported yet.');
  if(a.lockTime!==undefined && a.lockTime!==0)
    return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: custom lockTime is not supported.');
  if(a.version!==undefined && a.version!==1)
    return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: custom version is not supported.');
  if(!_validDesc(a.description))
    return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: description must be a string of 5..2000 characters.');

  const o=a.options||{};
  if(o.noSend===true)
    return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: options.noSend is not supported — this wallet broadcasts processed actions directly.');
  if(o.sendWith && o.sendWith.length)
    return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: options.sendWith batching is not supported.');
  if(o.signAndProcess===false)
    return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: options.signAndProcess=false requires the signableTransaction path, which is not supported yet.');
  if(o.trustSelf!==undefined || (o.knownTxids && o.knownTxids.length) || o.noSendChange!==undefined)
    return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: options trustSelf/knownTxids/noSendChange are not supported.');

  if(!Array.isArray(a.outputs) || !a.outputs.length)
    return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: outputs[] is required (at least one output).');
  if(a.outputs.length>SENDTX_MAX_OUTPUTS)
    return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: too many outputs (max '+SENDTX_MAX_OUTPUTS+').');

  const outs=[]; let total=0;
  for(let i=0;i<a.outputs.length;i++){
    const out=a.outputs[i]||{};
    if(out.basket!==undefined)
      return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: output baskets are not tracked by this wallet (output '+i+').');
    if(!_validHexScript(out.lockingScript))
      return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: output '+i+' needs a valid lockingScript (hex).');
    const sats=satNum(out.satoshis);
    if(sats<1)
      return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: output '+i+' needs satoshis >= 1 (0-sat outputs are rejected as dust).');
    if(!_validDesc(out.outputDescription))
      return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: output '+i+' needs an outputDescription of 5..2000 characters.');
    let tags=[];
    if(out.tags!==undefined){
      if(!Array.isArray(out.tags) || !out.tags.every(_validLabel))
        return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: output '+i+' tags must be strings of 1..300 characters.');
      tags=out.tags.map(t=>String(t).toLowerCase());
    }
    const dest=scriptLockAddress(String(out.lockingScript));
    outs.push({ satoshis:sats, lockingScript:String(out.lockingScript).toLowerCase(),
                outputDescription:String(out.outputDescription), tags, dest:dest||null });
    total+=sats;
  }
  let labels=[];
  if(a.labels!==undefined){
    if(!Array.isArray(a.labels) || !a.labels.every(_validLabel))
      return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: labels must be strings of 1..300 characters.');
    labels=a.labels.map(l=>String(l).toLowerCase());
  }
  const outBytes=outs.reduce((s,x)=>s+12+Math.ceil(x.lockingScript.length/2), 0);
  const feeEstimate=Math.ceil((10 + 148 + outBytes + 11*34 + 34) * FEE_RATE);
  return { valid:true, description:String(a.description), labels, outputs:outs, totalSat:total,
           serviceFees:TOTAL_SERVICE_FEES, minerFeeEstimate:feeEstimate,
           returnTXIDOnly:o.returnTXIDOnly===true, randomizeOutputs:o.randomizeOutputs!==false };
}
function brc100RequireValid(r){
  if(r.valid===true) return r;
  const w=r.werr||{};
  throw brc100Err(w.name||'WERR_INVALID_PARAMETER', w.code||3, w.message||'Invalid parameters.');
}
/* internalizeAction: AtomicBEEF from the app → only 'wallet payment' outputs
   that pay the wallet address DIRECTLY (BRC-29 derived payments and 'basket
   insertion' refuse explicitly). */
function brc100ParseInternalize(argsJson, walletAddress){
  let a; try{ a=typeof argsJson==='string'?JSON.parse(argsJson):(argsJson||{}); }
  catch(e){ return _werr('WERR_INVALID_PARAMETER', 3, 'internalizeAction: args must be valid JSON.'); }
  if(!_validDesc(a.description))
    return _werr('WERR_INVALID_PARAMETER', 3, 'internalizeAction: description must be a string of 5..2000 characters.');
  if(!Array.isArray(a.tx) || !a.tx.length)
    return _werr('WERR_INVALID_PARAMETER', 3, 'internalizeAction: tx must be the AtomicBEEF byte array of the transaction.');
  if(!Array.isArray(a.outputs) || !a.outputs.length)
    return _werr('WERR_INVALID_PARAMETER', 3, 'internalizeAction: outputs[] is required.');
  const S=_sdk(); let tx;
  try{ tx=S.Transaction.fromAtomicBEEF(a.tx); }
  catch(e){ return _werr('WERR_INVALID_PARAMETER', 3, 'internalizeAction: tx is not valid AtomicBEEF: '+((e&&e.message)||e)); }
  const rawtx=tx.toHex();
  const txid=new bsv.Transaction(rawtx).id;
  const lockHex=bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(walletAddress)).toHex().toLowerCase();
  const accepted=[]; let total=0;
  for(let i=0;i<a.outputs.length;i++){
    const o=a.outputs[i]||{};
    const vout=Number(o.outputIndex);
    if(!Number.isInteger(vout) || vout<0 || vout>=tx.outputs.length)
      return _werr('WERR_INVALID_PARAMETER', 3, 'internalizeAction: outputIndex '+o.outputIndex+' does not exist in the transaction.');
    if(o.protocol==='basket insertion')
      return _werr('WERR_INVALID_PARAMETER', 3, 'internalizeAction: basket insertion is not supported — this wallet does not track custom baskets.');
    if(o.protocol!=='wallet payment')
      return _werr('WERR_INVALID_PARAMETER', 3, 'internalizeAction: unknown protocol for output '+vout+' (expected "wallet payment").');
    const txo=tx.outputs[vout];
    const scriptHex=txo.lockingScript.toHex().toLowerCase();
    if(scriptHex!==lockHex)
      return _werr('WERR_INVALID_PARAMETER', 3, 'internalizeAction: output '+vout+' does not pay this wallet\'s address directly — BRC-29 derived payments are not supported yet.');
    const sats=satNum(txo.satoshis);
    accepted.push({ vout, satoshis:sats });
    total+=sats;
  }
  return { valid:true, txid, rawtx, outputs:accepted, totalSat:total };
}
/* listOutputs over the live (ordinal-protected) UTXO set — only the
   'default' basket exists; everything else refuses explicitly. */
function brc100ListOutputsCalc(utxos, argsJson){
  let a; try{ a=typeof argsJson==='string'?JSON.parse(argsJson):(argsJson||{}); }
  catch(e){ return _werr('WERR_INVALID_PARAMETER', 3, 'listOutputs: args must be valid JSON.'); }
  const basket=a.basket===undefined?'default':a.basket;
  if(basket!=='default')
    return _werr('WERR_INVALID_PARAMETER', 3, 'listOutputs: basket "'+basket+'" is not tracked by this wallet — only "default" (the spendable funding outputs) exists.');
  if(a.tags && a.tags.length)
    return _werr('WERR_INVALID_PARAMETER', 3, 'listOutputs: output tags are not tracked by this wallet.');
  if(a.include==='entire transactions')
    return _werr('WERR_INVALID_PARAMETER', 3, 'listOutputs: include="entire transactions" (BEEF) is not supported yet — use "locking scripts".');
  const withScripts=a.include==='locking scripts';
  const limit=Number.isInteger(a.limit)&&a.limit>0?Math.min(a.limit,10000):10;
  const offset=Number.isInteger(a.offset)&&a.offset>0?a.offset:0;
  const page=utxos.slice(offset, offset+limit);
  return { valid:true, totalOutputs:utxos.length,
    outputs:page.map(u=>{
      const out={ outpoint:u.txid+'.'+u.vout, satoshis:satNum(u.satoshis), spendable:true };
      if(withScripts) out.lockingScript=String(u.script||u.scriptPubKey||'');
      return out;
    }) };
}

/* ---- fase 3 flows (popup) ---- */
async function brc100CreateAction(argsJson, origin){
  const v=brc100RequireValid(brc100ValidateCreate(argsJson));
  await brc100RequireTxConfirm({
    origin, title:'Approve payment', description:v.description, incoming:false,
    lines:v.outputs.map(o=>({ dest:o.dest||'script output (not an address)', sats:o.satoshis, note:o.outputDescription })),
    miner:v.minerFeeEstimate, service:v.serviceFees, total:v.totalSat
  });
  const outs=v.outputs.slice();
  if(v.randomizeOutputs && outs.length>1){          // BRC-100 privacy rule
    for(let i=outs.length-1;i>0;i--){
      const r=new Uint8Array(1); crypto.getRandomValues(r);
      const j=r[0]%(i+1); const t=outs[i]; outs[i]=outs[j]; outs[j]=t;
    }
  }
  let tx;
  try{
    tx=await buildTx({ outputs:outs.map(o=>({ type:'script', satoshis:o.satoshis, scriptHex:o.lockingScript })) });
  }catch(e){ throw brc100Err('WERR_INSUFFICIENT_FUNDS', 5, e.message||String(e)); }
  let txid;
  try{ txid=await broadcastAndRegister(tx); }
  catch(e){ throw brc100Err('WERR_UNKNOWN', 1, 'Broadcast failed: '+(e.message||e)); }
  brc100LogAction({ txid, description:v.description, labels:v.labels, satoshis:v.totalSat,
                    origin, ts:Date.now(), status:'completed', isOutgoing:true });
  return { txid };   // CreateActionResult: tx (BEEF) follows in a later fase
}
async function brc100InternalizeAction(argsJson, origin){
  const v=brc100RequireValid(brc100ParseInternalize(argsJson, _address));
  const desc=(()=>{ try{ return JSON.parse(argsJson).description||''; }catch(_){ return ''; } })();
  await brc100RequireTxConfirm({
    origin, title:'Accept incoming payment', description:desc, incoming:true,
    lines:v.outputs.map(o=>({ dest:_address.slice(0,8)+'… (this wallet)', sats:o.satoshis, note:'incoming payment output '+o.vout })),
    miner:0, service:0, total:v.totalSat
  });
  try{
    await broadcastAndRegister({ toString:()=>v.rawtx });
  }catch(e){
    // an already-known transaction is NOT an error: the payment exists on-chain
    const m=String(e.message||e).toLowerCase();
    if(!(m.includes('already')||m.includes('txn-mempool-conflict')||m.includes('257')))
      throw brc100Err('WERR_UNKNOWN', 1, 'Broadcast failed: '+(e.message||e));
  }
  brc100LogAction({ txid:v.txid, description:desc, labels:[], satoshis:v.totalSat,
                    origin, ts:Date.now(), status:'completed', isOutgoing:false });
  return { accepted:true };
}
function brc100ListActions(args){
  let actions=(_brc100Actions[_address]||[]).slice();
  if(Array.isArray(args.labels) && args.labels.length){
    const wanted=new Set(args.labels.map(l=>String(l).toLowerCase()));
    const mode=args.labelQueryMode||'any';
    if(mode!=='any' && mode!=='all')
      throw brc100Err('WERR_INVALID_PARAMETER', 3, 'listActions: labelQueryMode must be "any" or "all".');
    actions=actions.filter(rec=>{
      const have=new Set(rec.labels||[]);
      return mode==='all' ? [...wanted].every(w=>have.has(w)) : [...wanted].some(w=>have.has(w));
    });
  }
  const limit=Math.min(Math.max(parseInt(args.limit,10)||10, 1), 10000);
  const offset=Math.max(parseInt(args.offset,10)||0, 0);
  return { totalActions:actions.length,
    actions:actions.slice(offset, offset+limit).map(rec=>({
      txid:rec.txid, satoshis:rec.satoshis, status:rec.status, isOutgoing:rec.isOutgoing,
      description:rec.description, labels:rec.labels||[], version:1, lockTime:0 })) };
}
async function brc100DoRelinquish(args){
  const basket=args.basket||'default';
  if(basket!=='default')
    throw brc100Err('WERR_INVALID_PARAMETER', 3, 'relinquishOutput: basket "'+basket+'" is not tracked by this wallet — only "default" exists.');
  const outpoint=String(args.output||'').toLowerCase();
  if(!/^[0-9a-f]{64}\.\d+$/.test(outpoint))
    throw brc100Err('WERR_INVALID_PARAMETER', 3, 'relinquishOutput: output must be an outpoint like "txid.vout".');
  const utxos=await getUTXOs(_address);
  const known=utxos.some(u=>(u.txid+'.'+u.vout)===outpoint);
  if(!known)
    throw brc100Err('WERR_INVALID_PARAMETER', 3, 'relinquishOutput: outpoint '+outpoint+' is not a spendable output of this wallet.');
  brc100Relinquish(outpoint);
  return { relinquished:true };
}

/* v43.5 — signAction PHASE A: verify + reconstruct, NEVER sign.
   Builds the ordinal-protected outpoint set from the live 1-sat UTXOs (an
   ordinal must never be signable inside a dApp's signAction), runs the pure
   review engine (src/brc100-signaction.js), shows the reconstructed effect to
   the user for transparency, then returns the dry-run review. Signing is
   Phase B and stays disabled behind a security review (see SIGNACTION-SCOPE.md
   and src/brc100-signaction-phaseB.js). */
/* V44 — STRICT unspent fetch for the signAction path: distinguishes "index
   unreachable" (throw) from "genuinely no UTXOs" (empty list). fetchUnspent()
   conflates the two, which made V43.5's protected set fail-OPEN on an index
   outage. signAction must fail CLOSED: no index view, no review, no signing. */
async function fetchUnspentStrict(address){
  const urls=[`${API_BASE}/address/${address}/confirmed/unspent`, `${API_BASE}/address/${address}/unspent`];
  let lastErr=null;
  for(const url of urls){
    try{
      const res=await fetch(url);
      if(!res.ok){ lastErr=new Error('index responded '+res.status); continue; }
      const data=await res.json();
      const list=Array.isArray(data)?data:(data&&Array.isArray(data.result)?data.result:null);
      if(list) return list.filter(u=>u&&u.tx_hash&&!u.isSpentInMempoolTx); // empty is a valid answer
    }catch(e){ lastErr=e; }
  }
  try{ return await bitailsUnspent(address); }catch(e){ lastErr=e; }
  throw brc100Err('WERR_INTERNAL', 1, 'signAction refused: the wallet could not reach any UTXO index to verify inputs and ordinal protection ('+(lastErr&&lastErr.message||'unreachable')+'). Failing closed.');
}
/* V45 — second index provider (best-effort fallback; shape verified during
   the activation live test — a wrong mapping can only yield a refusal, never
   a false positive, because every consumer re-verifies cryptographically). */
const BITAILS_BASE='https://api.bitails.io';
async function bitailsUnspent(address){
  const res=await fetch(`${BITAILS_BASE}/address/${address}/unspent`);
  if(!res.ok) throw new Error('bitails responded '+res.status);
  const j=await res.json();
  const arr=(j&&Array.isArray(j.unspent))?j.unspent:(Array.isArray(j)?j:[]);
  return arr.map(u=>({ tx_hash:(u.txid||u.tx_hash||'').toLowerCase(), tx_pos:(typeof u.vout==='number'?u.vout:u.tx_pos), value:(typeof u.satoshis==='number'?u.satoshis:u.value) })).filter(u=>u.tx_hash);
}
/* V45 — USD exchange rate (WoC), 5-min cache. null on failure: consumers
   treat "no rate" as "show sats only / never auto-approve" (fail-closed). */
let _fx={rate:null,at:0};
async function getUsdRate(){
  if(_fx.rate && (Date.now()-_fx.at)<300000) return _fx.rate;
  try{
    const res=await fetch(`${API_BASE}/exchangerate`);
    if(!res.ok) return _fx.rate;
    const j=await res.json();
    const r=parseFloat(j&&j.rate);
    if(isFinite(r)&&r>0){ _fx={rate:r,at:Date.now()}; }
  }catch(_){}
  return _fx.rate;
}
function usdFmt(u){ return (u==null)?'':(' \u2248 $'+(u<0.01&&u>0?u.toFixed(4):u.toFixed(2))); }
/* V45 — per-app daily budget store (chrome.storage.local), pure engine in
   src/brc100-budget.js. */
async function loadBudgets(){ return new Promise(res=>{ try{ chrome.storage.local.get('ordplug_brc100_budgets', v=>res((v&&v.ordplug_brc100_budgets)||{})); }catch(_){ res({}); } }); }
async function saveBudgets(b){ return new Promise(res=>{ try{ chrome.storage.local.set({ ordplug_brc100_budgets:b }, ()=>res()); }catch(_){ res(); } }); }
async function brc100BuildProtectedSet(){
  // Every 1-sat outpoint the address holds is a candidate ordinal/name/map and
  // must be protected. V44: built from the STRICT fetch — an index outage now
  // refuses the whole review instead of silently emptying the protection. The
  // pure engine additionally refuses ANY 1-sat input, index or no index.
  const raw=await fetchUnspentStrict(_address);
  const set=new Set();
  raw.forEach(u=>{ if(u && u.value===1 && u.tx_hash) set.add(u.tx_hash.toLowerCase()+':'+u.tx_pos); });
  return { set, utxoList: raw };
}
/* V44 — fetch + hash-verify the raw funding tx for every owned input, so the
   prevout is PROVEN (sha256d(raw)==txid) rather than dApp- or index-asserted.
   The hash check itself lives in the pure Phase B engine; this only fetches. */
async function brc100FetchRawTxs(ownedInputs){
  const rawTxByTxid={};
  const txids=[...new Set(ownedInputs.map(m=>m.txid))];
  for(const txid of txids){
    try{
      const res=await fetch(`${API_BASE}/tx/${txid}/hex`);
      if(!res.ok) throw new Error('index responded '+res.status);
      rawTxByTxid[txid]=(await res.text()).trim();
    }catch(e){
      throw brc100Err('WERR_INTERNAL', 1, 'signAction refused: could not fetch funding transaction '+txid+' to prove the prevout ('+(e&&e.message||e)+'). Failing closed.');
    }
  }
  return rawTxByTxid;
}
/* V45 — fetch TSC merkle proofs so Phase B can prove block INCLUSION of every
   funding tx (GATE 1c). Fail-closed: no proof, no signing. The pure verifier
   lives in src/spv-verify.js; live WoC response shape is confirmed during the
   activation test (a shape mismatch surfaces as a refusal, never acceptance). */
async function brc100FetchSpvProofs(ownedInputs){
  const spvByTxid={};
  const txids=[...new Set(ownedInputs.map(m=>m.txid))];
  for(const txid of txids){
    try{
      const res=await fetch(`${API_BASE}/tx/${txid}/proof/tsc`);
      if(!res.ok) throw new Error('proof endpoint responded '+res.status);
      let p=await res.json(); if(Array.isArray(p)) p=p[0];
      if(!p) throw new Error('empty proof');
      const proof={ index:(typeof p.index==='number'?p.index:0), nodes:(p.nodes||[]) };
      const tgt=String(p.target||'');
      if(p.targetType==='header' || tgt.length===160) proof.headerHex=tgt;
      else if(p.targetType==='merkleRoot') proof.merkleRootHex=tgt;
      else { // block hash: fetch the header record for its merkle root
        const hr=await fetch(`${API_BASE}/block/hash/${tgt}`);
        if(!hr.ok) throw new Error('block header fetch responded '+hr.status);
        const hj=await hr.json();
        if(!hj || !hj.merkleroot) throw new Error('block header carries no merkle root');
        proof.merkleRootHex=String(hj.merkleroot);
      }
      spvByTxid[txid]=proof;
    }catch(e){
      throw brc100Err('WERR_INTERNAL', 1, 'signAction refused: could not obtain a merkle inclusion proof for '+txid+' ('+(e&&e.message||e)+'). Failing closed.');
    }
  }
  return spvByTxid;
}
/* V44 — pending-action registry (GATE 5), persisted so the background worker
   can service abortAction after this popup closes. */
async function brc100LoadPendingStore(){
  return new Promise(res=>{ try{ chrome.storage.session.get('ordplug_signaction_pending', v=>res((v&&v.ordplug_signaction_pending)||{})); }catch(_){ res({}); } });
}
async function brc100SavePendingStore(store){
  return new Promise(res=>{ try{ chrome.storage.session.set({ ordplug_signaction_pending: store }, ()=>res()); }catch(_){ res(); } });
}
/* ---- V46: certificate holder storage (per address, chrome.storage.local).
   Certificates can carry personal fields — treat the store as sensitive:
   never log field values, and wipe it on wallet reset with the rest. */
async function loadCerts(){ return new Promise(res=>{ try{ chrome.storage.local.get('ordplug_certs', v=>{ const all=(v&&v.ordplug_certs)||{}; res(Array.isArray(all[_address])?all[_address]:[]); }); }catch(_){ res([]); } }); }
async function saveCerts(list){ return new Promise(res=>{ try{ chrome.storage.local.get('ordplug_certs', v=>{ const all=(v&&v.ordplug_certs)||{}; all[_address]=list; chrome.storage.local.set({ ordplug_certs: all }, ()=>res()); }); }catch(_){ res(); } }); }
function ourIdentityKeyHex(){ try{ return bsv.PrivateKey.fromWIF(_wif).publicKey.toString(); }catch(_){ return null; } }
async function brc100AcquireCertificate(argsJson, origin){
  const CE=globalThis.OrdplugCerts; if(!CE) throw brc100Err('WERR_INTERNAL',1,'certificate engine not loaded.');
  let cert;
  try{ cert=CE.validateForAcquire(JSON.parse(argsJson||'{}'), ourIdentityKeyHex()); }
  catch(e){ throw brc100Err(e.name||'WERR_INVALID_PARAMETER',(typeof e.code==='number')?e.code:3, e.message||String(e)); }
  const ok=await new Promise(res=>{
    showView('brc100perm');
    $('bpIcon').innerHTML=ICONS.key;
    $('bpTitle').textContent='Store a certificate';
    $('bpOrigin').textContent=origin||'unknown app';
    $('bpDetail').textContent='Certifier: '+cert.certifier.slice(0,12)+'\u2026 \u00b7 fields: '+Object.keys(cert.fields).join(', ').slice(0,120)+'. Stored locally; nothing is revealed to anyone until you approve a proof request.';
    $('bpAllow').onclick=()=>res(true); $('bpDeny').onclick=()=>res(false);
  });
  if(!ok) throw brc100Err('WERR_PERMISSION_DENIED',1,'The user declined to store the certificate.');
  const list=await loadCerts();
  const key=CE.keyOf(cert);
  const without=list.filter(c=>CE.keyOf(c)!==key);
  without.push(cert);
  await saveCerts(without);
  return { certificate:{ type:cert.type, serialNumber:cert.serialNumber, subject:cert.subject, certifier:cert.certifier, revocationOutpoint:cert.revocationOutpoint, signature:cert.signature, fields:cert.fields } };
}
async function brc100ProveCertificate(argsJson, origin){
  const CE=globalThis.OrdplugCerts; if(!CE) throw brc100Err('WERR_INTERNAL',1,'certificate engine not loaded.');
  const args=JSON.parse(argsJson||'{}');
  const list=await loadCerts();
  const wanted=Array.isArray(args.fieldsToReveal)?args.fieldsToReveal.map(String):[];
  // Per-request selective-disclosure consent: the user sees EXACTLY which
  // fields leave the wallet, every time. No grants, no memory.
  const ok=await new Promise(res=>{
    showView('brc100perm');
    $('bpIcon').innerHTML=ICONS.key;
    $('bpTitle').textContent='Reveal certificate fields';
    $('bpOrigin').textContent=origin||'unknown app';
    $('bpDetail').textContent='This app asks you to reveal: '+(wanted.join(', ')||'(none)')+'. Only these fields are shared, with this app\u2019s verifier key, once.';
    $('bpAllow').onclick=()=>res(true); $('bpDeny').onclick=()=>res(false);
  });
  if(!ok) throw brc100Err('WERR_PERMISSION_DENIED',1,'The user declined to reveal certificate fields.');
  try{ return CE.proveCertificate(list, args, wanted); }
  catch(e){ throw brc100Err(e.name||'WERR_INVALID_PARAMETER',(typeof e.code==='number')?e.code:3, e.message||String(e)); }
}
/* ---- V46: x402 payment (pay-per-request within the per-app budget). The
   wallet builds and signs, the resource server settles via the facilitator —
   the wallet never broadcasts an x402 payment itself. */
async function walletPayX402(argsJson, origin){
  const XC=globalThis.OrdplugX402; if(!XC) throw brc100Err('WERR_INTERNAL',1,'x402 engine not loaded.');
  const args=JSON.parse(argsJson||'{}');
  let inv;
  try{ inv=XC.parsePaymentRequired(args.paymentRequired!=null?args.paymentRequired:args); }
  catch(e){ throw brc100Err(e.name||'WERR_INVALID_PARAMETER',(typeof e.code==='number')?e.code:3, e.message||String(e)); }
  // Budget/confirm pipeline — identical rules to any outgoing payment:
  // within the origin's daily allowance = frictionless; otherwise confirm.
  await brc100RequireTxConfirm({
    origin, incoming:false, total: inv.satoshis, miner: 0, service: 0,
    title: 'Pay for content (x402)',
    description: (inv.description||inv.resource||'Paid resource')+' \u00b7 invoice '+inv.invoiceId.slice(0,18)+'\u2026 \u00b7 the site broadcasts after settlement.',
    lines: [{ dest: inv.payTo, sats: inv.satoshis, note: inv.resource||'' }]
  });
  const tx=await buildTx({ outputs: [{ type:'p2pkh', address: inv.payTo, satoshis: inv.satoshis }] });
  const rawTx=tx.uncheckedSerialize();
  const pb=globalThis.OrdplugSignActionPhaseB;
  return {
    header: XC.buildXPaymentHeader(inv, rawTx),
    headerName: 'X-PAYMENT',
    invoiceId: inv.invoiceId,
    satoshis: inv.satoshis,
    txid: pb ? pb.sha256dTxid(bsv, rawTx) : null,
    broadcast: false // the resource server settles via the facilitator
  };
}
async function brc100SignActionReview(argsJson, origin){
  if(!root_OrdplugSignAction()) throw brc100Err('WERR_INTERNAL', 1, 'signAction review engine not loaded.');
  const { set: protectedSet, utxoList } = await brc100BuildProtectedSet(); // strict: throws if the index is down
  let review;
  try{
    review=globalThis.OrdplugSignAction.reviewSignAction(argsJson, { bsv, ourAddress:_address, protectedSet });
  }catch(e){
    // Pure engine throws standards-shaped WERR_* — pass them straight through.
    throw brc100Err(e.name||'WERR_INVALID_PARAMETER', (typeof e.code==='number')?e.code:3, e.message||String(e));
  }
  const pb=globalThis.OrdplugSignActionPhaseB;
  const willSign=!!(pb && pb.ENABLED);
  const eff=review.effect;
  const linesHtml=eff.outputs.map(l=>
    '<div class="kv"><span class="k" style="max-width:55%;overflow:hidden;text-overflow:ellipsis">'+esc(l.dest)+(l.toThisWallet?' (this wallet)':'')+(l.ordinalHint?' · 1-sat':'')+'</span><span class="v">'+l.satoshis.toLocaleString()+' sats</span></div>').join('');

  if(!willSign){
    // Informational only: reviewed, not signed. One acknowledge button — and
    // NOTHING is wired behind it (V43.5 mutated this button into an "Approve"
    // that would have fed a future Phase B; that trap is gone).
    await new Promise(res=>{
      showView('brc100tx');
      $('btIcon').innerHTML=ICONS.pen;
      $('btTitle').textContent='Review transaction (no signing)';
      $('btOrigin').textContent=origin||'unknown app';
      $('btDesc').textContent='This app asked the wallet to sign a transaction. The wallet verified it below but signing is not enabled on this installation.';
      $('btLines').innerHTML=linesHtml;
      $('btMiner').textContent=eff.signedInputCount+' of '+eff.totalInputCount+' inputs are yours';
      $('btService').textContent=eff.counterpartyInputCount+' input(s) supplied by the app';
      $('btTotal').textContent=(eff.netToWallet<0?'-':'+')+Math.abs(eff.netToWallet).toLocaleString()+' sats to this wallet';
      const approve=$('btApprove'), reject=$('btReject');
      approve.textContent='OK'; reject.style.display='none';
      approve.onclick=()=>res();
    });
    throw brc100Err('WERR_UNSUPPORTED_ACTION', 2,
      'signAction: the wallet reviewed this transaction (inputs verified, effect reconstructed) but signing is not enabled on this installation. See SECURITY-REVIEW-V44.md.');
  }

  await getUsdRate(); // warm the fiat cache for the signing confirm
  // ---- Phase B path: PROVE the prevouts BEFORE asking the user to approve,
  // so the numbers on the confirm screen are verified facts, not dApp claims.
  const rawTxByTxid=await brc100FetchRawTxs(review.ownedInputs);
  const spvByTxid=await brc100FetchSpvProofs(review.ownedInputs);
  try{
    pb.assertSighashPolicy(bsv, review.requestedSighash);
    pb.assertInputsInOwnUtxoSet(review.ownedInputs, utxoList);
    const ourLockHex=bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(_address)).toHex().toLowerCase();
    pb.assertPrevoutsProven(bsv, review.ownedInputs, rawTxByTxid, ourLockHex);
    pb.assertSpvProven(bsv, review.ownedInputs, spvByTxid);
  }catch(e){
    throw brc100Err(e.name||'WERR_INVALID_PARAMETER', (typeof e.code==='number')?e.code:3, e.message||String(e));
  }

  // Dedicated SIGNING confirmation — its own screen, its own wording, a real
  // Approve/Reject. The user approves the wallet's verified reconstruction.
  const approved=await new Promise(res=>{
    showView('brc100tx');
    $('btIcon').innerHTML=ICONS.pen;
    $('btTitle').textContent='Sign transaction';
    $('btOrigin').textContent=origin||'unknown app';
    $('btDesc').textContent='This app built a transaction and asks the wallet to sign '+eff.signedInputCount+' of its '+eff.totalInputCount+' input(s). Every input and amount below was verified against the chain by the wallet itself. The app — not the wallet — completes and broadcasts it.';
    $('btLines').innerHTML=linesHtml;
    $('btMiner').textContent=eff.signedInputCount+' input(s) verified · '+eff.spendingFromWallet.toLocaleString()+' sats from this wallet';
    $('btService').textContent='Sighash: SIGHASH_ALL | SIGHASH_FORKID';
    const _r=_fx.rate, _usd=(globalThis.OrdplugBudget&&_r)?globalThis.OrdplugBudget.satsToUsd(Math.abs(eff.netToWallet),_r):null;
    $('btTotal').textContent=(eff.netToWallet<0?'-':'+')+Math.abs(eff.netToWallet).toLocaleString()+' sats to this wallet'+usdFmt(_usd);
    const approve=$('btApprove'), reject=$('btReject');
    approve.textContent='Sign'; reject.style.display=''; reject.textContent='Reject';
    approve.onclick=()=>res(true); reject.onclick=()=>res(false);
  });
  if(!approved) throw brc100Err('WERR_PERMISSION_DENIED', 1, 'The user rejected signing for '+(origin||'this app')+'.');

  // All gates + user approval passed — only now is the key pulled (getWif),
  // inside the pure engine, after its own re-checks.
  const pendingStore=await brc100LoadPendingStore();
  let result;
  try{
    result=pb.performSignAction(review, {
      bsv, ourAddress:_address, utxoList, rawTxByTxid, spvByTxid,
      getWif:()=>_wif, pendingStore, origin
    });
  }catch(e){
    throw brc100Err(e.name||'WERR_INTERNAL', (typeof e.code==='number')?e.code:1, e.message||String(e));
  }
  await brc100SavePendingStore(pendingStore);
  return result;
}
function root_OrdplugSignAction(){ return typeof globalThis!=='undefined' && globalThis.OrdplugSignAction; }
/* fase 2: run the method on the bundled ProtoWallet (keys never in the page) */
async function brc100Engine(method, args){
  const w=brc100InitWallet();
  try{ return await w[method](args); }
  catch(e){ throw brc100Err((e&&e.name)||'WERR_UNKNOWN', (e&&e.code)||1, (e&&e.message)||String(e)); }
}
/* entry point: a BRC-100 request forwarded by the background worker */
async function handleBrc100Pending(p){
  _pendingBrc100=p;
  const argsJson=p.args||'{}';
  let args={}; try{ args=JSON.parse(argsJson); }catch(_){ }
  try{
    let result;
    if(BRC100_PHASE2.includes(p.method)){
      await brc100RequirePermission(p.origin, p.method, args);
      result=await brc100Engine(p.method, args);
    } else if(p.method==='createAction'){ result=await brc100CreateAction(argsJson, p.origin); }
    else if(p.method==='internalizeAction'){ result=await brc100InternalizeAction(argsJson, p.origin); }
    else if(p.method==='listActions'){
      await brc100RequireReadConsent(p.origin, 'listActions');
      result=brc100ListActions(args);
    }
    else if(p.method==='listOutputs'){
      await brc100RequireReadConsent(p.origin, 'listOutputs');
      const u=await getUTXOs(_address);
      const v=brc100RequireValid(brc100ListOutputsCalc(u, argsJson));
      result={ totalOutputs:v.totalOutputs, outputs:v.outputs };
    }
    else if(p.method==='relinquishOutput'){
      await brc100RequireDestructive(p.origin, 'relinquishOutput', args && (args.output || args.outpoint));
      result=await brc100DoRelinquish(args);
    }
    else if(p.method==='signAction'){ result=await brc100SignActionReview(argsJson, p.origin); }
    else if(p.method==='acquireCertificate'){ result=await brc100AcquireCertificate(argsJson, p.origin); }
    else if(p.method==='listCertificates'){
      const CE=globalThis.OrdplugCerts; if(!CE) throw brc100Err('WERR_INTERNAL',1,'certificate engine not loaded.');
      // The arguments were in the wrong order: the signature is
      // (origin, method, args), and this passed ('listCertificates', args, origin).
      // The grant key became `${_address}|listCertificates|…`, so EVERY site
      // shared one bucket — approve it on one dApp and every other dApp
      // inherited it. Same class as H4, in a single line.
      await brc100RequirePermission(p.origin, 'listCertificates', args);
      result=CE.listCertificates(await loadCerts(), args);
    }
    else if(p.method==='proveCertificate'){ result=await brc100ProveCertificate(argsJson, p.origin); }
    else if(p.method==='relinquishCertificate'){
      const CE=globalThis.OrdplugCerts; if(!CE) throw brc100Err('WERR_INTERNAL',1,'certificate engine not loaded.');
      // Was completely ungated: any site could delete any certificate, in a
      // loop, permanently, with saveCerts() persisting each one. Same class as
      // relinquishOutput — fixed there in 4.9.0 and missed here.
      await brc100RequireDestructive(p.origin, 'relinquishCertificate',
        args && (args.type || args.serialNumber || args.certifier));
      const list=await loadCerts();
      try{ result=CE.relinquishCertificate(list, args); }
      catch(e){ throw brc100Err(e.name||'WERR_INVALID_PARAMETER',(typeof e.code==='number')?e.code:3, e.message||String(e)); }
      await saveCerts(list);
    }
    else if(p.method==='payX402'){ result=await walletPayX402(argsJson, p.origin); }
    else throw brc100Err('WERR_UNSUPPORTED_ACTION', 2, p.method+' is not yet supported by the ORDnet wallet.');
    resolveBrc100(true, result, null);
  }catch(e){
    resolveBrc100(false, null, { name:e.name||'WERR_UNKNOWN', code:(typeof e.code==='number')?e.code:1, message:e.message||String(e) });
  }
}
function resolveBrc100(ok, result, error){
  const p=_pendingBrc100; if(!p) return;
  _pendingBrc100=null;
  chrome.storage.session.remove('ordplug_pending_brc100');
  chrome.runtime.sendMessage({ type:'brc100_resolve', id:p.id, tabId:p.tabId, origin:p.origin, ok, result, error });
  window.close();
}
/* grants manager (Settings → BRC-100 permissions, v2.6) */
function renderBrc100Grants(){
  const box=$('brcGrantsList'); if(!box) return;
  const rows=_brc100Grants.map(key=>{
    const parts=key.split('|');
    if(parts.length<3 || parts[0]!==_address) return null;
    const origin=parts[1];
    let detail;
    if(parts[2]==='identity') detail='Identity key';
    else if(parts.length>=4) detail='Level '+parts[2]+' · protocol “'+parts[3]+'”'+(parts.length>=5?(' · counterparty '+parts[4].slice(0,8)+'…'):'');
    else detail=parts[2];
    return { key, origin, detail };
  }).filter(Boolean).sort((a,b)=>(a.origin+a.detail).localeCompare(b.origin+b.detail));
  if(!rows.length){ box.innerHTML='<div class="empty-note">No BRC-100 permissions granted yet. Apps ask the first time they need your keys; grants appear here and can be revoked per app.</div>'; return; }
  box.innerHTML=rows.map(r=>`
    <div class="acct">
      <div class="ic">${esc(r.origin.replace(/^https?:\/\//,'').charAt(0).toUpperCase())}</div>
      <div class="m"><div class="nm" style="font-size:12px">${esc(r.origin)}</div><div class="ad">${esc(r.detail)}</div></div>
      <div class="ax"><button class="iconbtn" title="Revoke" data-brc-revoke="${esc(r.key)}">${ICONS.trash}</button></div>
    </div>`).join('');
}
async function brc100RevokeGrant(key){
  _brc100Grants=_brc100Grants.filter(k=>k!==key);
  await saveBrc100Grants();
  renderBrc100Grants();
}

