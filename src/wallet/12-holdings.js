/* ---------- holdings: SNS names + BSVmaps from the ORDnet V30 indexer ---------- */
let _holdings = [];
let _soSel = null;

let _holdTab = 'sns';      // active tab: 'sns' | 'bsvmap' | 'opns' | 'sale'
let _holdPage = 0;         // current page within the active tab
let _holdSearch = '';      // search query
let _idxOk = true;         // bsvmap.io indexer reachable?
let _opnsOk = true;        // v4.1 — OpNS index reachable? (own flag: an OpNS
                           // failure never touches SNS/BSVmaps, and vice versa)
const HOLD_PER_PAGE = 20;

/* BSVmap mark: orange square block, centered on the black tile (no emoji) */
const BSVMAP_MARK='<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#f7931e"/></svg>';
/* SNS mark: ORD/plug segmented-donut "C" logo on the black tile */
const SNS_MARK='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 100 100">'
  +'<circle cx="50" cy="50" r="25" fill="none" stroke="#fcfaf5" stroke-width="18"/>'
  +'<line x1="46" y1="6" x2="46" y2="50" stroke="#0a0a0a" stroke-width="7"/>'
  +'<line x1="50" y1="48" x2="96" y2="48" stroke="#0a0a0a" stroke-width="7"/>'
  +'<line x1="51" y1="51" x2="84" y2="84" stroke="#0a0a0a" stroke-width="7"/>'
  +'</svg>';
/* v4.1 — OpNS mark: @-icon like SNS on search.ordnet.io, and deliberately
   NO ✓ badge (that mark is reserved for ORDnet's own inscriptions) */
const OPNS_MARK='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fcfaf5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'
  +'<circle cx="12" cy="12" r="4"/>'
  +'<path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>'
  +'</svg>';
function holdMark(kind){ return kind==='sns'?SNS_MARK : kind==='opns'?OPNS_MARK : BSVMAP_MARK; }
/* sale price of a listed item in sats — tolerant to indexer field naming */
function listedPriceSats(item){
  const v=item.priceSat ?? item.priceSats ?? item.listPriceSat ?? item.listPrice ?? item.price;
  const n=parseInt(v,10);
  return (n>0) ? n : 0;
}
/* status pill: compact tag icon + price for listed items (no word, no row growth) */
function holdStatusPill(item){
  if(item.status==='listed'){
    const pr=listedPriceSats(item);
    return `<span class="hstatus listed" title="Listed for sale">${ICONS.tagTiny}${pr?esc(bsvFmt(pr))+' BSV':''}</span>`;
  }
  // v4.2 (iOS v2.6.1) — listed on the DOMAIN registry (USD) via the Domains tab
  if(item.domainListedUsd!==undefined && item.domainListedUsd!==null){
    return `<span class="hstatus listed" title="Listed on the domain registry — manage it in the Domains tab">${ICONS.tagTiny}$${esc(String(item.domainListedUsd))}</span>`;
  }
  return `<span class="hstatus ${esc(item.status)}">${esc(item.status)}</span>`;
}
/* v4.1 — row subline: OpNS API responses contain no block height field, the
   row shows just "OpNS" (claimHeight stays 0 internally, same as iOS v2.1) */
function holdSubline(item){
  if(item.kind==='opns') return 'OpNS';
  return (item.kind==='bsvmap'?('district #'+item.district+' · '):'')+'block '+item.claimHeight;
}
function holdRenderItem(item){
  const idx=_holdings.indexOf(item);
  if(_bulkMode){
    const eligible=bulkEligible(item);
    const checked=_bulkSel.has(idx);
    return `
    <div class="holding${eligible?'':' bulk-dim'}"${eligible?` data-bulkrow="${idx}" style="cursor:pointer"`:''}>
      <input type="checkbox" class="bulkchk"${checked?' checked':''}${eligible?` data-bulkchk="${idx}"`:' disabled'}>
      <div class="hic ${item.kind}">${holdMark(item.kind)}</div>
      <div class="hm">
        <div class="hn">${esc(item.name)}</div>
        <div class="hs">${holdSubline(item)}</div>
      </div>
      ${holdStatusPill(item)}
    </div>`;
  }
  // v4.1 — OpNS: display, resolve and send ONLY. No marketplace flows
  // (list/delist deliberately absent — that decision has not been taken).
  // v4.2 (iOS v2.6.1) — a domain listed on the DOMAIN registry gets a link to
  // its Domains detail instead: deliberately NO second (bsvmap) listing.
  const domainListed=(item.kind==='sns' && item.domainListedUsd!==undefined && item.domainListedUsd!==null);
  const listBtn = item.kind==='opns' ? ''
    : domainListed
    ? `<button class="iconbtn" title="Manage domain listing (Domains tab)" data-managedomain="${esc(item.name)}">${ICONS.edit}</button>`
    : item.status==='listed'
    ? `<button class="iconbtn" title="Remove listing (delist)" data-delist="${idx}">${ICONS.x}</button>`
    : `<button class="iconbtn" title="List for sale" data-list="${idx}">${ICONS.tag}</button>`;
  return `
    <div class="holding">
      <div class="hic ${item.kind}">${holdMark(item.kind)}</div>
      <div class="hm" data-open="${(item.kind==='sns'||item.kind==='opns')
        ? 'https://search.ordnet.io/?q='+encodeURIComponent(item.name)
        : 'https://bsvmap.io/#'+item.district}" style="cursor:pointer">
        <div class="hn">${esc(item.name)}</div>
        <div class="hs">${holdSubline(item)}</div>
      </div>
      ${holdStatusPill(item)}
      ${listBtn}
      <button class="iconbtn" title="Send" data-send="${idx}">${ICONS.sendArrow}</button>
    </div>`;
}
function holdFiltered(){
  const q=_holdSearch.trim().toLowerCase();
  const match=x=>!q || (x.name||'').toLowerCase().includes(q) || (x.kind==='bsvmap' && String(x.district).includes(q));
  const isListedAny=x=>x.status==='listed' || (x.domainListedUsd!==undefined && x.domainListedUsd!==null);
  const arr=_holdings.filter(x=>{
    if(_holdTab==='sale'){ if(!isListedAny(x)) return false; } // For sale: bsvmap/SNS ordinal listings + domain-registry listings (v2.6.1)
    else if(x.kind!==_holdTab) return false;
    return match(x);
  });
  // listed items always on top, original order preserved within each group
  return arr.slice().sort((a,b)=>(isListedAny(b)?1:0)-(isListedAny(a)?1:0));
}
function renderHoldings(){
  const list=$('holdList'); if(!list) return;
  const filtered=holdFiltered();
  const total=filtered.length;
  const pages=Math.max(1, Math.ceil(total/HOLD_PER_PAGE));
  if(_holdPage>=pages) _holdPage=pages-1;
  if(_holdPage<0) _holdPage=0;
  const start=_holdPage*HOLD_PER_PAGE;
  const slice=filtered.slice(start, start+HOLD_PER_PAGE);
  if(!total){
    const q=_holdSearch.trim();
    const tabLabel={ sns:'SNS names', bsvmap:'BSVmaps', opns:'OpNS names', sale:'listed items' }[_holdTab];
    let note;
    if(q) note='No '+tabLabel+' match "'+esc(q)+'".';
    else if(_holdTab==='opns') note=_opnsOk ? 'No OpNS names on this address yet.' : 'Could not reach the OpNS index at search.ordnet.io.';
    else if(!_idxOk) note='Could not reach the ORDnet indexer at bsvmap.io.';
    else if(_holdTab==='sale') note='Nothing listed for sale yet. Use the tag button on an SNS name or BSVmap to list it.';
    else note=(_holdTab==='sns'?'No SNS names on this address yet.':'No BSVmaps on this address yet. Claim one on bsvmap.io!');
    list.innerHTML='<div class="empty-note">'+note+'</div>';
  } else {
    list.innerHTML=slice.map(holdRenderItem).join('');
  }
  const pager=$('holdPager');
  if(total>HOLD_PER_PAGE){
    pager.classList.remove('hidden');
    $('holdPrev').disabled=(_holdPage<=0);
    $('holdNext').disabled=(_holdPage>=pages-1);
    $('holdPageInfo').textContent='Page '+(_holdPage+1)+' / '+pages+' · '+total+' total';
  } else pager.classList.add('hidden');
}
function setHoldTab(tab){
  if(tab!==_holdTab) _holdPage=0; // only jump to page 1 on a REAL tab switch
  _holdTab=tab;
  $('tabSns').classList.toggle('on', tab==='sns');
  $('tabMap').classList.toggle('on', tab==='bsvmap');
  $('tabOpns').classList.toggle('on', tab==='opns');
  $('tabSale').classList.toggle('on', tab==='sale');
  $('btnBulkList').textContent = (tab==='sale') ? 'Bulk delist' : 'Bulk list';
  // v4.1 — OpNS names cannot be listed for sale: display, resolve and send
  // only, so bulk mode has nothing to do on this tab
  $('btnBulkList').classList.toggle('hidden', tab==='opns');
  if(tab==='opns' && _bulkMode) exitBulkMode();
  bulkReselectPage();
  renderHoldings();
}
/* Marketplace listings live in a separate store (GET /api/listings), NOT in the
   V30 indexer — the indexer keeps reporting "held" for a listed district. Merge
   the listings of THIS address into the holdings so items show listed + price. */
async function mergeListings(){
  try{
    const r=await fetch(`${HOLDINGS_API}/listings`);
    if(!r.ok) return;
    const j=await r.json();
    const mine=(j.listings||[]).filter(l=>l && l.sellerAddress===_address);
    if(mine.length){
      const byDistrict={};
      mine.forEach(l=>{ byDistrict[String(l.district)]=l; });
      _holdings.forEach(it=>{
        if(it.kind!=='bsvmap') return;
        const l=byDistrict[String(it.district)];
        if(l){ it.status='listed'; it.priceSat=Math.round(Number(l.priceSat)||0); }
      });
    }
  }catch(e){ /* listings store unreachable — fall back to indexer statuses */ }
  // v3.6 — SNS-listings van deze wallet op de ORDnet-marketplace
  try{
    const mineSns=await ordnetMyListings();
    if(mineSns){
      _holdings.forEach(it=>{
        if(it.kind!=='sns') return;
        const l=mineSns[String(it.name||'').toLowerCase()];
        if(l){ it.status='listed'; it.priceSat=l.priceSat; it.ordnetListingId=l.id; }
      });
    }
  }catch(e){ /* ORDnet marketplace unreachable — statuses fall back to indexer */ }
  // v4.2 (iOS v2.6.1) — merge DOMAIN-registry listings (v2 platform, USD)
  // into the SNS rows. This is a SEPARATE marketplace from the bsvmap.io
  // ordinal listings: without this merge a domain listed via the Domains tab
  // kept showing "held" here. Display-only; managing the listing stays in
  // the Domains tab (never the bsvmap list/delist flows).
  try{
    const r=await fetch(`${DOMAINS_API}/api/owner/${_address}`);
    if(r.ok){
      const j=await r.json().catch(()=>null);
      const listed={};
      ((j&&j.domains)||[]).forEach(d=>{
        if(d && d.name && d.listing_status==='active'){
          listed[String(d.name).toLowerCase()]=parseFloat(d.listing_price)||0;
        }
      });
      _holdings.forEach(it=>{
        if(it.kind!=='sns') return;
        const usd=listed[String(it.name||'').toLowerCase()];
        if(usd!==undefined) it.domainListedUsd=usd;
      });
    }
  }catch(e){ /* domain registry unreachable — SNS rows just show held */ }
}

/* v3.6 — actieve ORDnet-listings van deze wallet: { "naam.web3": {id, priceSat} } */
async function ordnetMyListings(){
  const r=await fetch(`${ORDNET_MARKET_API}/marketplace/onchain/listings?limit=100&seller=${encodeURIComponent(_address)}`);
  if(!r.ok) return null;
  const j=await r.json().catch(()=>null);
  if(!j) return null;
  const map={};
  (j.listings||[]).forEach(l=>{ map[String(l.domain_name||'').toLowerCase()]={ id:l.id, priceSat:Math.round(Number(l.price_sat)||0) }; });
  return map;
}
async function loadHoldings(){
  $('snsCount').textContent='…'; $('bsvmapCount').textContent='…'; $('opnsCount').textContent='…'; $('saleCount').textContent='…';
  $('holdList').innerHTML='<div class="empty-note">Loading…</div>';
  $('holdPager').classList.add('hidden');
  _holdings=[]; // NB: _holdPage is preserved — renderHoldings clamps it if out of range
  try{
    const r=await fetch(`${HOLDINGS_API}/address/${_address}/holdings`);
    if(!r.ok) throw new Error('indexer unavailable');
    const h=await r.json();
    (h.sns||[]).forEach(x=>_holdings.push(Object.assign({ kind:'sns' }, x)));
    (h.bsvmaps||[]).forEach(x=>_holdings.push(Object.assign({ kind:'bsvmap' }, x)));
    _idxOk=true;
  }catch(e){ _idxOk=false; }
  // v4.1 — OpNS: third category in its OWN try/catch + own status flag, so a
  // broken OpNS API only affects the OpNS tab (graceful degradation both ways)
  try{
    const r=await fetch(`${OPNS_API}/owner/${_address}`);
    if(!r.ok) throw new Error('opns index unavailable');
    const j=await r.json();
    if(j.ok!==true) throw new Error('opns index unavailable');
    (j.results||[]).forEach(x=>{
      if(!x || !x.name || !x.current_txid) return;
      _holdings.push({ kind:'opns', name:String(x.name), claimHeight:0, status:'held',
                       currentTxid:String(x.current_txid), currentVout:(x.current_vout|0)||0 });
    });
    _opnsOk=true;
  }catch(e){ _opnsOk=false; }
  await mergeListings();
  if(_idxOk){
    $('snsCount').textContent=String(_holdings.filter(x=>x.kind==='sns').length);
    $('bsvmapCount').textContent=String(_holdings.filter(x=>x.kind==='bsvmap').length);
    $('saleCount').textContent=String(_holdings.filter(x=>x.status==='listed' || (x.domainListedUsd!==undefined && x.domainListedUsd!==null)).length);
  }else{
    $('snsCount').textContent='—'; $('bsvmapCount').textContent='—'; $('saleCount').textContent='—';
  }
  $('opnsCount').textContent=_opnsOk ? String(_holdings.filter(x=>x.kind==='opns').length) : '—';
  renderHoldings();
}

/* ---------- send ordinal (SNS name / BSVmap) — true 1Sat transfer ---------- */
function ordinalMinerFee(){ return Math.ceil((300 + 14*34) * FEE_RATE); }

/* Raw tx-hex fetch with in-memory cache + 429 retry/backoff.
   - Cache: tx hex is immutable, and bulk-claimed BSVmaps share ONE claim tx —
     20 listings from the same claim need only 1 fetch instead of 20.
   - Retry: WhatsOnChain free tier allows ~3 req/s; bulk operations trip 429.
     Back off 500ms → 1s → 2s → 4s before giving up. */
const _txHexCache = {};
async function fetchTxHexRetry(txid){
  if(_txHexCache[txid]) return _txHexCache[txid];
  let delay=500;
  for(let attempt=0; attempt<5; attempt++){
    const r=await fetch(`${API_BASE}/tx/${txid}/hex`);
    if(r.ok){ const hex=(await r.text()).trim(); _txHexCache[txid]=hex; return hex; }
    if(r.status!==429) throw new Error('Could not fetch the ordinal transaction. (HTTP '+r.status+')');
    await new Promise(res=>setTimeout(res, delay)); delay*=2;
  }
  throw new Error('Rate-limited by WhatsOnChain (429) — wait a few seconds and try again.');
}
async function fetchOutputScriptHex(txid, vout){
  // BELANGRIJK: gebruik de RAW tx-hex en parse zelf, NIET het verbose /tx/hash/-endpoint.
  // WhatsOnChain's verbose JSON verminkt nonstandard scripts: bij envelope-first ordinals
  // (OP_FALSE OP_IF "ord" ... OP_ENDIF + P2PKH) laat scriptPubKey.hex de leidende 00
  // (OP_FALSE) weg. Ondertekenen/verifiëren tegen dat verminkte script laat OP_IF de
  // pubkey van de stack eten -> SCRIPT_ERR_EQUALVERIFY, en de node zou de sighash
  // sowieso afkeuren. De raw hex is byte-voor-byte authoritatief.
  const rawHex=await fetchTxHexRetry(txid);
  let hex=null;
  try{
    const t=new bsv.Transaction(rawHex);
    const out=t.outputs && t.outputs[vout];
    hex=out && out.script && out.script.toHex();
  }catch(_){ hex=null; }
  if(!hex) throw new Error('Could not read the ordinal output script.');
  return hex;
}

