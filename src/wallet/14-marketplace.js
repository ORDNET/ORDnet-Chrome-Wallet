/* ---------- Optie-1 atomic swap: list (sell) + buy ---------- */
async function buildListingPartial(ordinalTxid, ordinalVout, priceSat){
  const pk = bsv.PrivateKey.fromWIF(_wif), from = pk.toAddress();
  const ordScriptHex = await fetchOutputScriptHex(ordinalTxid, ordinalVout);
  const tx = new bsv.Transaction();
  tx.addInput(new bsv.Transaction.Input({
    prevTxId: ordinalTxid, outputIndex: ordinalVout, script: new bsv.Script(),
    output: new bsv.Transaction.Output({ script: bsv.Script.fromHex(ordScriptHex), satoshis: 1 })
  }));
  const payScript = bsv.Script.buildPublicKeyHashOut(from);
  tx.addOutput(new bsv.Transaction.Output({ script: payScript, satoshis: priceSat }));
  const SIG = bsv.crypto.Signature;
  const sigtype = SIG.SIGHASH_SINGLE | SIG.SIGHASH_ANYONECANPAY | SIG.SIGHASH_FORKID;
  const sig = bsv.Transaction.Sighash.sign(tx, pk, sigtype, 0, tx.inputs[0].output.script, new bsv.crypto.BN(1));
  tx.inputs[0].setScript(bsv.Script.buildPublicKeyHashIn(pk.publicKey, sig, sigtype));
  return { partialTx: tx.toString(), payScriptHex: payScript.toHex() };
}

/* Audit pattern 3 — cosmetic security is worse than none.
   The approval screen shows `sellerAddress`, and the check below used to
   compare the listing's payment output against `payScriptHex`. Both of those
   arrive in the SAME params object from the SAME untrusted page, so the
   comparison was `x === x`: the user read "Seller: 1Alice…" while the output
   paid whoever the site put in payScriptHex. The shown field never touched
   the check.
   buildListingPartial() always pays to a plain P2PKH of the seller's own
   address (see above), so the expected script can be DERIVED from the
   address the user was shown, which is the only thing they consented to. */
function checkListingOutput({ outScriptHex, outSats, priceSat, sellerScriptHex, advertisedScriptHex }){
  if (!outScriptHex) return 'The listing has no payment output — refusing.';
  if (outSats !== priceSat) return 'Listing payment output does not match the advertised price — refusing.';
  if (String(outScriptHex).toLowerCase() !== String(sellerScriptHex).toLowerCase())
    return 'The listing pays someone other than the seller shown on this screen — refusing.';
  if (advertisedScriptHex && String(advertisedScriptHex).toLowerCase() !== String(sellerScriptHex).toLowerCase())
    return 'The listing script does not belong to the seller shown on this screen — refusing.';
  return null;
}
async function buildPurchaseFromPartial(partialHex, priceSat, sellerAddress, payScriptHex, extraOutputs){
  const pk = bsv.PrivateKey.fromWIF(_wif), buyer = pk.toAddress();
  const tx = new bsv.Transaction(partialHex);
  const out0 = tx.outputs[0];
  let sellerScriptHex;
  try {
    sellerScriptHex = bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(String(sellerAddress))).toHex();
  } catch (e) {
    throw new Error('The seller address on this listing is not a valid address — refusing.');
  }
  const problem = checkListingOutput({
    outScriptHex: out0 ? out0.script.toHex() : null,
    outSats: out0 ? out0.satoshis : null,
    priceSat,
    sellerScriptHex,
    advertisedScriptHex: payScriptHex
  });
  if (problem) throw new Error(problem);
  tx.addOutput(new bsv.Transaction.Output({ script: bsv.Script.buildPublicKeyHashOut(buyer), satoshis: 1 }));
  // v3.5 — extraOutputs: bv. de ORDnet-marketplace-fee (0,5%, koper betaalt bovenop).
  // Gecapt op 5% van de prijs zodat een kwaadaardige site geen absurde fee kan meesmokkelen;
  // alles staat sowieso zichtbaar in het approve-scherm.
  let extraSat = 0;
  const extras = Array.isArray(extraOutputs) ? extraOutputs : [];
  for (const eo of extras){
    const sat = satNum(eo.sats || eo.amount);
    if (sat < 1) continue;
    tx.addOutput(new bsv.Transaction.Output({ script: bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(String(eo.to))), satoshis: sat }));
    extraSat += sat;
  }
  if (extraSat > Math.max(546, Math.ceil(priceSat * 0.05)))
    throw new Error('Extra outputs exceed 5% of the price — refusing.');
  const feeSat = ordinalMinerFee();
  const need = priceSat + 1 + extraSat + feeSat + TOTAL_SERVICE_FEES;
  const utxos = await getUTXOs(_address);
  let total = 0, sel = [];
  for (const u of utxos){ sel.push(u); total += u.satoshis; if (total >= need) break; }
  if (total < need) throw new Error('Insufficient balance for price + marketplace fee + network fee + service fee.');
  const firstBuyerInput = tx.inputs.length;
  for(const u of sel){
    try{ const realHex=await fetchOutputScriptHex(u.txid, u.vout); if(realHex) u.realScriptHex=realHex; }catch(_){}
  }
  sel.forEach(u => tx.addInput(new bsv.Transaction.Input({
    prevTxId: u.txid, outputIndex: u.vout, script: new bsv.Script(),
    output: new bsv.Transaction.Output({ script: bsv.Script.fromHex(u.realScriptHex||u.scriptPubKey||u.script), satoshis: u.satoshis })
  })));
  addServiceFees(tx);
  const change = total - (priceSat + 1 + extraSat + feeSat + TOTAL_SERVICE_FEES);
  if (change > 546) tx.to(buyer, change);
  const SIG = bsv.crypto.Signature;
  const sigtype = SIG.SIGHASH_ALL | SIG.SIGHASH_FORKID;
  for (let i = firstBuyerInput; i < tx.inputs.length; i++){
    const inp = tx.inputs[i];
    const sig = bsv.Transaction.Sighash.sign(tx, pk, sigtype, i, inp.output.script, new bsv.crypto.BN(inp.output.satoshis));
    inp.setScript(bsv.Script.buildPublicKeyHashIn(pk.publicKey, sig, sigtype));
  }
  return tx;
}

function startSendOrdinal(idx){
  const it=_holdings[idx]; if(!it) return;
  startSendOrdinalItem(it);
}
/* v4.2 — also reachable from ORD/ner (kind 'ordfile'): same true 1-sat
   transfer, the item just doesn't live in _holdings */
function startSendOrdinalItem(it){
  _soSel=it;
  showView('sendord');
  $('soTitle').textContent='Send '+(it.kind==='sns'?'SNS name':it.kind==='opns'?'OpNS name':it.kind==='ordfile'?'file':'BSVmap');
  $('soName').textContent=it.name;
  $('soType').textContent=it.kind==='sns'?'SNS name (1Sat Ordinal)':it.kind==='opns'?'OpNS name (1Sat Ordinal)':it.kind==='ordfile'?'Inscription (1Sat Ordinal)':'BSVmap district (1Sat Ordinal)';
  // v4.1 — paymail bindings are signed by the CURRENT holder and die on transfer
  const opnsNote=$('soOpnsNote');
  opnsNote.classList.toggle('hidden', it.kind!=='opns');
  if(it.kind==='opns') opnsNote.textContent='If this OpNS name has a paymail binding ('+it.name+'@host), that binding expires when the name is transferred. The new owner must create a new binding.';
  $('soUtxo').textContent=it.currentTxid.slice(0,10)+'…'+it.currentTxid.slice(-6)+'_'+it.currentVout;
  $('soStatus').textContent=it.status;
  $('soActiveAddr').textContent=_address;
  $('soTo').value=''; clr($('soErr'));
  const ok=$('soOk'); ok.className='alert alert-success'; ok.textContent='';
  $('soFeeInfo').textContent='~'+ordinalMinerFee().toLocaleString()+' sats network + '+TOTAL_SERVICE_FEES.toLocaleString()+' sats service';
  // Up-front ownership check: fetch the ordinal's real locking script and compare its pkh to
  // the active wallet key. If they differ, the transfer cannot succeed from this wallet — show
  // it immediately (with the owning address) instead of only after the user hits Send.
  const warn=$('soOwnerWarn'); warn.classList.add('hidden'); warn.textContent='';
  (async()=>{
    try{
      const hex=await fetchOutputScriptHex(it.currentTxid, it.currentVout);
      const s=bsv.Script.fromHex(hex); let lockPkh=null;
      for(const c of s.chunks){ if(c.buf && c.buf.length===20) lockPkh=c.buf.toString('hex'); }
      const pk=bsv.PrivateKey.fromWIF(_wif);
      const myPkh=bsv.crypto.Hash.sha256ripemd160(pk.publicKey.toBuffer()).toString('hex');
      if(lockPkh && lockPkh!==myPkh){
        const lockAddr=bsv.Address.fromPublicKeyHash(bsv.deps.Buffer.from(lockPkh,'hex')).toString();
        warn.innerHTML='This ordinal is owned by <b>'+esc(lockAddr)+'</b>, not your active wallet ('+esc(_address)+'). '
          +'You must import the seed/key that controls '+esc(lockAddr)+' before you can send it.';
        warn.classList.remove('hidden');
      }
    }catch(_){ /* network hiccup — the build-time check still guards the actual send */ }
  })();
}

async function doSendOrdinal(){
  clr($('soErr')); const ok=$('soOk'); ok.className='alert alert-success'; ok.textContent='';
  const it=_soSel;
  if(!it){ err($('soErr'),'Nothing selected — go back and pick a name or BSVmap.'); return; }
  const to=$('soTo').value.trim();
  if(!to){ err($('soErr'),'Enter a recipient address.'); return; }
  try{ bsv.Address.fromString(to); }catch(e){ err($('soErr'),'That is not a valid BSV address.'); return; }
  if(to===_address){ err($('soErr'),'That is your own address — the ordinal is already there.'); return; }
  if(it.status==='contract'){ err($('soErr'),'This ordinal sits in a contract output and cannot be sent from here.'); return; }
  const btn=$('soBtn'); btn.disabled=true; const ol=btn.textContent; btn.innerHTML='<span class="spinner"></span> Sending...';
  try{
    const tx=await buildOrdinalTransfer(it, to);
    const txid=await broadcastAndRegister(tx);
    ok.textContent='Sent! '+it.name+' is on its way. TXID: '+txid;
    ok.className='alert alert-success show';
    setTimeout(loadHoldings, 1500);
  }catch(e){ err($('soErr'), e.message||'Send failed.'); }
  finally{ btn.disabled=false; btn.textContent=ol; }
}

/* ---------- delist (remove listing) — signed instruction to the marketplace ----------
   The wallet proves ownership by signing a delist message with the seller key.
   Server side: POST /map/{district}/delist must verify the signature against
   sellerAddress and drop the listing.
   TRUST BUT VERIFY: some servers answer 200 without actually removing the
   listing (SPA catch-all, stub route). We therefore re-check the listings
   registry afterwards and only report success when the listing is GONE. */
async function delistRequest(it){
  if(it.kind==='sns') return delistRequestSns(it); // v3.6 — SNS -> ORDnet marketplace
  const district=safeDistrict(it.district); // v4.3 — validate before it enters a URL path
  const ts=Date.now();
  const msg='bsvmap delist '+district+' '+it.currentTxid+'_'+it.currentVout+' '+ts;
  const sig=signMessage(msg); // signed ownership proof (seller key)
  const r=await fetch(`${HOLDINGS_API}/map/${district}/delist`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ sellerAddress:_address, district:it.district, ordinalTxid:it.currentTxid, ordinalVout:it.currentVout, timestamp:ts, message:msg, signature:sig.signature, pubkey:sig.pubkey })
  });
  const j=await r.json().catch(()=>null);
  if(!r.ok || j===null) throw new Error((j&&j.error)||('delist endpoint unavailable ('+r.status+')'));
}
/* ---------- server stores: the marketplace keeps a listing in TWO places ----------
   1. the per-district record: GET /map/{district} -> .listing   (what the district
      page shows, and what POST /map/{d}/list writes FIRST)
   2. the global registry:     GET /listings                     (what the map view,
      mergeListings and the "For sale" tab read)
   OBSERVED LIVE (V30, 2026-07-10): these go OUT OF SYNC. Beyond ~500 registry
   entries POST /list still answers HTTP 200 and writes the per-district record,
   but the append to the global registry is silently dropped. The item then looks
   unlisted in the wallet and on the map, while the server considers it listed —
   so every retry is a no-op and the item is STUCK (this is exactly the
   "cannot list past page 26 / bsvmap 581319" symptom). Delist has the mirror
   problem: it can leave a record behind in one of the two stores.
   Everything below therefore checks BOTH stores and self-heals where possible. */
async function districtState(district){
  try{
    const r=await fetch(`${HOLDINGS_API}/map/${district}`);
    if(!r.ok) return null;
    return await r.json();
  }catch(_){ return null; }
}
/* districts of THIS address present in the global registry — null if unreachable */
async function registryDistricts(){
  try{
    const r=await fetch(`${HOLDINGS_API}/listings`);
    if(!r.ok) return null;
    const j=await r.json();
    return new Set((j.listings||[]).filter(l=>l && l.sellerAddress===_address).map(l=>String(l.district)));
  }catch(e){ return null; }
}
/* which of these items are STILL listed — in EITHER store? -> [{it, where}] */
/* v3.6 — SNS-delist: seller-signMessage naar de ORDnet marketplace */
async function delistRequestSns(it){
  let id=it.ordnetListingId;
  if(!id){
    const mine=await ordnetMyListings();
    const l=mine && mine[String(it.name||'').toLowerCase()];
    if(!l) throw new Error('No active ORDnet listing found for '+it.name);
    id=l.id;
  }
  const ts=Date.now();
  const msg=['ordnet-registry','delist-onchain',String(id),String(ts)].join('|');
  const sig=signMessage(msg);
  const r=await fetch(`${ORDNET_MARKET_API}/marketplace/onchain/delist`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ id:id, address:_address, ts:ts, signature:sig.signature, pubkey:sig.pubkey })
  });
  const j=await r.json().catch(()=>null);
  if(!r.ok || j===null) throw new Error((j&&j.error)||('ORDnet delist failed ('+r.status+')'));
}

async function verifyStillListed(items){
  // v3.6 — kind-bewust: SNS tegen ORDnet, BSVmaps tegen beide bsvmap-stores
  const out=[];
  const ss=items.filter(it=>it.kind==='sns');
  if(ss.length){
    const mine=await ordnetMyListings();
    if(mine!==null) ss.forEach(it=>{ if(mine[String(it.name||'').toLowerCase()]) out.push({ it, where:'ORDnet marketplace' }); });
  }
  const bs=items.filter(it=>it.kind==='bsvmap');
  if(!bs.length) return out;
  const reg=await registryDistricts();
  for(let i=0;i<bs.length;i++){
    const it=bs[i];
    if(i) await new Promise(r=>setTimeout(r, 120)); // be gentle on the API
    const st=await districtState(it.district);
    const inDistrict=!!(st && st.listing);
    const inRegistry=!!(reg && reg.has(String(it.district)));
    if(inDistrict || inRegistry) out.push({ it,
      where: inDistrict && inRegistry ? 'global registry + district record'
           : inDistrict ? 'per-district record (district page still shows it for sale)'
           : 'global registry' });
  }
  return out;
}
/* one listing incl. SELF-HEAL for the stuck server state: if a stale per-district
   listing by this seller exists (a previous list call that never reached the
   global registry), sign a delist FIRST to clear it — otherwise the fresh list
   call is treated as a duplicate/no-op — then list. */
async function listRequest(it, priceSat){
  if(it.kind==='sns') return listRequestSns(it, priceSat); // v3.6 — SNS -> ORDnet marketplace
  const st=await districtState(it.district);
  if(st && st.listing){
    try{ await delistRequest(it); }catch(_){ /* best effort — proceed to list */ }
  }
  const district=safeDistrict(it.district); // v4.3 — validate before it enters a URL path
  const signed=await buildListingPartial(it.currentTxid, it.currentVout, priceSat);
  const r=await fetch(`${HOLDINGS_API}/map/${district}/list`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ sellerAddress:_address, priceSat, ordinalTxid:it.currentTxid, ordinalVout:it.currentVout, partialTx:signed.partialTx, payScriptHex:signed.payScriptHex })
  });
  const j=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error((j&&j.error)||'listing failed');
}

/* v3.6 — SNS-listing naar de ORDnet on-chain marketplace (zelfde partial-tx-
   patroon; de server valideert eigendom + outpoint tegen de indexer). */
async function listRequestSns(it, priceSat){
  const signed=await buildListingPartial(it.currentTxid, it.currentVout, priceSat);
  const r=await fetch(`${ORDNET_MARKET_API}/marketplace/onchain/list`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      domain: it.name,
      origin_txid: it.currentTxid,
      origin_vout: it.currentVout,
      price_sat: priceSat,
      seller_address: _address,
      partial_tx: signed.partialTx,
      pay_script_hex: signed.payScriptHex
    })
  });
  const j=await r.json().catch(()=>({}));
  if(!r.ok){
    if(j&&j.error==='already_listed') throw new Error('Already listed on the ORDnet marketplace.');
    if(j&&j.error==='not_owner_onchain') throw new Error('The indexer says this wallet is not the current holder.');
    if(j&&j.error==='origin_mismatch') throw new Error('Outpoint mismatch with the indexer — wait a block and retry.');
    throw new Error((j&&j.error)||'ORDnet marketplace listing failed');
  }
}
/* trust-but-verify for LIST: which freshly-listed items did NOT reach the global
   registry? (HTTP 200 alone proves nothing — see note above.) */
async function verifyListedInRegistry(items){
  // v3.6 — kind-bewust: BSVmaps tegen het bsvmap-register, SNS tegen ORDnet
  const missing=[];
  const bs=items.filter(it=>it.kind==='bsvmap');
  const ss=items.filter(it=>it.kind==='sns');
  if(bs.length){
    const reg=await registryDistricts();
    if(reg!==null) missing.push(...bs.filter(it=>!reg.has(String(it.district))));
  }
  if(ss.length){
    const mine=await ordnetMyListings();
    if(mine!==null) missing.push(...ss.filter(it=>!mine[String(it.name||'').toLowerCase()]));
  }
  return missing;
}
/* delist confirmation view — the user explicitly signs, exactly like listing */
let _dlSel=null;
function startDelist(idx){
  const it=_holdings[idx]; if(!it) return;
  _dlSel=it;
  showView('delist');
  clr($('dlErr')); const ok=$('dlOk'); ok.className='alert alert-success'; ok.textContent='';
  $('dlName').textContent=it.name;
  $('dlType').textContent=it.kind==='sns'?'SNS name (1Sat Ordinal)':'BSVmap district (1Sat Ordinal)';
  const pr=listedPriceSats(it);
  $('dlPrice').textContent=pr?(bsvFmt(pr)+' BSV ('+pr.toLocaleString()+' sats)'):'—';
  $('dlUtxo').textContent=it.currentTxid.slice(0,10)+'…'+it.currentTxid.slice(-6)+'_'+it.currentVout;
  $('dlSeller').textContent=_address;
  $('dlBtn').disabled=false;
}
async function doDelistNow(){
  clr($('dlErr')); const ok=$('dlOk'); ok.className='alert alert-success'; ok.textContent='';
  const it=_dlSel;
  if(!it){ err($('dlErr'),'Nothing selected — go back and pick a listed item.'); return; }
  const btn=$('dlBtn'); btn.disabled=true; const ol=btn.textContent; btn.innerHTML='<span class="spinner"></span> Signing...';
  try{
    await delistRequest(it);
    const still=await verifyStillListed([it]);
    if(still.length) throw new Error('The server answered OK but the listing is still present in the '+still[0].where
      +'. The server-side delist must clear BOTH the global registry and the per-district record.');
    it.status='held'; delete it.priceSat;
    ok.textContent='Listing removed and verified gone from the registry — '+it.name+' is no longer for sale.';
    ok.className='alert alert-success show';
    setTimeout(loadHoldings, 1200);
    setTimeout(showIdle, 3000); // back to the wallet, same tab + page
  }catch(e){
    err($('dlErr'), e.message||'Delist failed.');
    btn.disabled=false;
  }
  finally{ btn.textContent=ol; }
}

/* ---------- list ordinal for sale (standalone) ---------- */
let _loSel=null;
function startListOrdinal(idx){
  const it=_holdings[idx]; if(!it) return;
  if(it.status==='contract') return;
  _loSel=it;
  showView('listord');
  $('loName').textContent=it.name;
  $('loType').textContent=it.kind==='sns'?'SNS name (1Sat Ordinal)':'BSVmap district (1Sat Ordinal)';
  $('loUtxo').textContent=it.currentTxid.slice(0,10)+'…'+it.currentTxid.slice(-6)+'_'+it.currentVout;
  $('loPrice').value=''; $('loPriceHint').innerHTML='&nbsp;'; clr($('loErr'));
  const ok=$('loOk'); ok.className='alert alert-success'; ok.textContent='';
  loShowForm();
}
/* price is entered in BSV (e.g. 0.0001) and converted to sats internally */
function loPriceSats(){
  const v=parseFloat(String($('loPrice').value).replace(',','.'));
  if(!(v>0)) return 0;
  return Math.round(v*1e8);
}
function updateLoPriceHint(){
  const sats=loPriceSats();
  $('loPriceHint').innerHTML = sats>=1 ? ('= '+sats.toLocaleString()+' sats') : '&nbsp;';
}
/* step 1 -> 2: validate and show a summary of exactly what will be signed */
function loShowForm(){
  $('loForm').classList.remove('hidden'); $('loFormBtns').classList.remove('hidden');
  $('loConfirm').classList.add('hidden'); $('loConfirmBtns').classList.add('hidden');
}
function loShowConfirm(){
  clr($('loErr')); const ok=$('loOk'); ok.className='alert alert-success'; ok.textContent='';
  const it=_loSel;
  if(!it){ err($('loErr'),'Nothing selected.'); return; }
  const price=loPriceSats();
  if(!(price>=1)){ err($('loErr'),'Enter a price in BSV (minimum 0.00000001).'); return; }
  // v3.6 — SNS-listings gaan naar de ORDnet on-chain marketplace; BSVmaps naar bsvmap.io
  $('loSummary').innerHTML=
    `<div class="kv"><span class="k">Item</span><span class="v">${esc(it.name)}</span></div>
     <div class="kv"><span class="k">Type</span><span class="v">${it.kind==='sns'?'SNS name':'BSVmap district'}</span></div>
     <div class="kv"><span class="k">Price</span><span class="v">${bsvFmt(price)} BSV (${price.toLocaleString()} sats)</span></div>
     <div class="kv"><span class="k">Paid to</span><span class="v">${esc(_address)}</span></div>
     <div class="kv"><span class="k">Ordinal</span><span class="v">${esc(it.currentTxid.slice(0,10))}…${esc(it.currentTxid.slice(-6))}_${it.currentVout}</span></div>`;
  $('loForm').classList.add('hidden'); $('loFormBtns').classList.add('hidden');
  $('loConfirm').classList.remove('hidden'); $('loConfirmBtns').classList.remove('hidden');
}
/* step 2: the actual signing — only reachable via Confirm & sign */
async function doListOrdinal(){
  clr($('loErr')); const ok=$('loOk'); ok.className='alert alert-success'; ok.textContent='';
  const it=_loSel;
  if(!it){ err($('loErr'),'Nothing selected.'); return; }
  const price=loPriceSats();
  if(!(price>=1)){ err($('loErr'),'Enter a price in BSV (minimum 0.00000001).'); return; }
  const btn=$('loConfirmBtn'); btn.disabled=true; const ol=btn.textContent; btn.innerHTML='<span class="spinner"></span> Signing...';
  try{
    await listRequest(it, price);
    // trust-but-verify: HTTP 200 does not guarantee the global registry got it
    const missing=await verifyListedInRegistry([it]);
    if(missing.length) throw new Error('The server accepted the listing (HTTP 200) and wrote the district record, '
      +'but it never appeared in the global GET /listings registry — the registry is full or out of sync SERVER-side. '
      +'The wallet and the map will keep showing this item as unlisted until the server is fixed.');
    ok.textContent='Listed for '+bsvFmt(price)+' BSV — verified present in the marketplace registry!'
      +(it.kind==='sns'?' Visible on the ORDnet marketplace (domains).':' Turns green on bsvmap.io within a minute.');
    ok.className='alert alert-success show';
    $('loConfirmBtns').classList.add('hidden'); // signed — prevent a double sign
    setTimeout(loadHoldings, 1500);
    setTimeout(showIdle, 3500); // back to the wallet — the item now shows its listed badge
  }catch(e){ err($('loErr'), e.message||'Listing failed.'); }
  finally{ btn.disabled=false; btn.textContent=ol; }
}

/* ---------- bulk list / bulk delist: inline selection mode on the holdings list ----------
   Click "Bulk list" (SNS/BSVmaps tab) or "Bulk delist" (For sale tab) -> every
   eligible item on the current page is CHECKED; the user only unchecks what
   should be skipped. Paging while the mode is on ADDS the new page to the
   selection (up to 300 items), so multiple pages can be handled in one run. */
const BULK_MAX = 300;
let _bulkMode=false;
let _bulkKind='list';     // 'list' | 'delist' (delist on the For sale tab)
let _bulkSel=new Set();   // indexes into _holdings — accumulates ACROSS pages
let _bulkArmed=false;     // first click on Sign arms; second click executes
let _bulkBusy=false;
function bulkKindForTab(){ return _holdTab==='sale' ? 'delist' : 'list'; }
function bulkEligible(item){
  // v3.6 — bulk werkt nu voor BSVmaps én SNS (SNS route naar de ORDnet marketplace)
  // v4.1 — OpNS: no marketplace flows at all (display, resolve and send only)
  if(item.kind==='opns') return false;
  if(_bulkKind==='delist') return item.status==='listed';
  return item.status!=='listed' && item.status!=='contract';
}
function bulkPageEligibleIdx(){
  const filtered=holdFiltered();
  const start=_holdPage*HOLD_PER_PAGE;
  return filtered.slice(start, start+HOLD_PER_PAGE).filter(bulkEligible).map(x=>_holdings.indexOf(x));
}
function bulkMergePage(){ // add this page's eligible items, respecting the cap
  const all=bulkPageEligibleIdx();
  let capped=false;
  for(const i of all){ if(_bulkSel.size>=BULK_MAX){ capped=true; break; } _bulkSel.add(i); }
  if(capped) err($('bulkErr'),'Selection limit reached: max '+BULK_MAX+' items per run.');
}
function bulkPriceSats(){
  const v=parseFloat(String($('bulkPrice').value).replace(',','.'));
  return v>0 ? Math.round(v*1e8) : 0;
}
function updateBulkPanel(){
  const n=_bulkSel.size;
  $('bulkCount').textContent=n+' selected'+(n>=BULK_MAX?' (max)':'');
  const page=bulkPageEligibleIdx();
  const allIn=page.length>0 && page.every(i=>_bulkSel.has(i));
  $('bulkToggleAll').textContent=allIn?'Deselect page':'Select page';
  const go=$('bulkGo');
  if(_bulkKind==='delist'){
    $('bulkPriceWrap').classList.add('hidden');
    go.disabled=_bulkBusy || !n;
    go.textContent=_bulkArmed ? ('Confirm: delist '+n+' item'+(n!==1?'s':'')) : ('Sign '+n+' delisting'+(n!==1?'s':''));
  } else {
    $('bulkPriceWrap').classList.remove('hidden');
    const price=bulkPriceSats();
    $('bulkPriceHint').innerHTML=(price>=1)
      ? ('= '+price.toLocaleString()+' sats per item'+(n?' · '+bsvFmt(price*n)+' BSV total if all sell':''))
      : '&nbsp;';
    go.disabled=_bulkBusy || !n || !(price>=1);
    go.textContent=_bulkArmed
      ? ('Confirm: '+n+' × '+bsvFmt(price)+' BSV')
      : ('Sign '+n+' listing'+(n!==1?'s':''));
  }
}
function bulkDisarm(){ _bulkArmed=false; updateBulkPanel(); }
function enterBulkMode(){
  _bulkMode=true; _bulkArmed=false; _bulkKind=bulkKindForTab();
  _bulkSel=new Set();
  clr($('bulkErr')); const ok=$('bulkOk'); ok.className='alert alert-success'; ok.textContent='';
  bulkMergePage();
  $('bulkPanel').classList.remove('hidden');
  $('btnBulkList').classList.add('on');
  if(!_bulkSel.size) err($('bulkErr'), _bulkKind==='delist'
    ? 'No listed items on this page.'
    : 'No unlisted items on this page.');
  updateBulkPanel(); renderHoldings();
}
function exitBulkMode(){
  _bulkMode=false; _bulkArmed=false; _bulkSel.clear();
  $('bulkPanel').classList.add('hidden');
  $('btnBulkList').classList.remove('on');
  renderHoldings();
}
function bulkReselectPage(){ // page/tab/search changed while in bulk mode
  if(!_bulkMode) return;
  const k=bulkKindForTab();
  if(k!==_bulkKind){ _bulkKind=k; _bulkSel.clear(); clr($('bulkErr')); } // tab type changed: fresh selection
  bulkMergePage(); // ADD the new page — selection accumulates across pages
  bulkDisarm();
}
function bulkToggleAllNow(){
  const page=bulkPageEligibleIdx();
  const allIn=page.length>0 && page.every(i=>_bulkSel.has(i));
  if(allIn) page.forEach(i=>_bulkSel.delete(i));
  else { clr($('bulkErr')); for(const i of page){ if(_bulkSel.size>=BULK_MAX){ err($('bulkErr'),'Selection limit reached: max '+BULK_MAX+' items per run.'); break; } _bulkSel.add(i); } }
  bulkDisarm(); renderHoldings();
}
function bulkToggle(idx){
  if(_bulkBusy) return;
  if(_bulkSel.has(idx)) _bulkSel.delete(idx);
  else if(bulkEligible(_holdings[idx]||{})){
    if(_bulkSel.size>=BULK_MAX){ err($('bulkErr'),'Selection limit reached: max '+BULK_MAX+' items per run.'); return; }
    _bulkSel.add(idx);
  }
  bulkDisarm(); renderHoldings();
}
async function bulkGoNow(){
  clr($('bulkErr')); const ok=$('bulkOk');
  const isDelist=(_bulkKind==='delist');
  const price=isDelist?0:bulkPriceSats();
  if(!isDelist && !(price>=1)){ err($('bulkErr'),'Enter a price in BSV (minimum 0.00000001).'); return; }
  if(!_bulkSel.size){ err($('bulkErr'),'Nothing selected.'); return; }
  if(!_bulkArmed){ _bulkArmed=true; updateBulkPanel(); return; } // first click = review, second = sign
  _bulkBusy=true; updateBulkPanel();
  ok.className='alert alert-success show';
  const items=[..._bulkSel].map(i=>_holdings[i]).filter(Boolean);
  let done=0, failed=[], okItems=[];
  for(let i=0;i<items.length;i++){
    const it=items[i];
    ok.textContent=(isDelist?'Delisting ':'Listing ')+it.name+' ('+(i+1)+'/'+items.length+')…';
    if(i) await new Promise(r=>setTimeout(r, 250)); // stay under API rate limits
    try{
      if(isDelist){
        await delistRequest(it);
      } else {
        await listRequest(it, price); // incl. self-heal for stale/stuck server listings
      }
      done++; okItems.push(it);
    }catch(e){ failed.push(it.name+' ('+(e.message||'error')+')'); }
  }
  // trust-but-verify for delist: check BOTH server stores for ALL processed items
  if(isDelist && okItems.length){
    ok.textContent='Verifying removal on the server…';
    const still=await verifyStillListed(okItems);
    if(still.length){
      done-=still.length;
      still.forEach(x=>failed.push(x.it.name+' (still in the '+x.where+')'));
    }
  }
  // trust-but-verify for list: HTTP 200 alone does not mean the global registry
  // got the listing (observed server bug past ~500 registry entries)
  if(!isDelist && okItems.length){
    ok.textContent='Verifying listings in the marketplace registry…';
    const missing=await verifyListedInRegistry(okItems);
    if(missing.length){
      done-=missing.length;
      missing.forEach(it=>failed.push(it.name+' (accepted by the server but NOT in the global registry — registry full/out of sync server-side)'));
    }
  }
  _bulkBusy=false; _bulkArmed=false; _bulkSel.clear();
  if(failed.length){
    ok.className='alert alert-success'; ok.textContent='';
    err($('bulkErr'), done+(isDelist?' delisted, ':' listed, ')+failed.length+' failed: '+failed.slice(0,4).join(', ')+(failed.length>4?' …':''));
  } else {
    ok.textContent=isDelist
      ? ('All '+done+' listings removed.')
      : ('All '+done+' items listed for '+bsvFmt(price)+' BSV each! Turning green on bsvmap.io within a minute.');
  }
  await loadHoldings(); // refresh statuses in place; panel, page and message stay
  updateBulkPanel();
}

