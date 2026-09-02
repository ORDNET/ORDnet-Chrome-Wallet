/* ---------- browse (.web3) ---------- */
/* ---------- my .web3 domains (ORDnet registry) ---------- */
// v4.0 — WEB3 domain management on the v2 platform, main domain since the
// cutover (one constant, one switch)
const DOMAINS_API='https://domains.ordnet.io';
const DOMAINS_TTL=10*60*1000; // 10 min cache per address

async function loadMyDomains(force){
  const box=$('myDomainsList'); if(!box) return;
  if(!_address){ box.innerHTML='<div class="empty-note">Unlock your wallet to see your .web3 domains.</div>'; return; }
  const addr=_address, key='web3domains:'+addr;
  if(!force){
    try{
      const st=await chrome.storage.local.get(key);
      const c=st[key];
      if(c && Array.isArray(c.domains) && (Date.now()-c.ts)<DOMAINS_TTL){ renderMyDomains(c.domains); return; }
    }catch(e){}
  }
  box.innerHTML='<div class="empty-note">Loading…</div>';
  try{
    const r=await fetch(DOMAINS_API+'/api/owner/'+encodeURIComponent(addr));
    if(!r.ok) throw new Error('HTTP '+r.status);
    const j=await r.json();
    const domains=Array.isArray(j.domains)?j.domains:[];
    try{ await chrome.storage.local.set({ [key]:{ ts:Date.now(), domains } }); }catch(e){}
    if(addr===_address) renderMyDomains(domains);
  }catch(e){
    box.innerHTML='<div class="empty-note">Could not load your domains right now.</div>';
  }
}

// since v37 \u2014 WEB3 domain list with search + pagination (10 per page, like
// the SNS list at 20). renderMyDomains(domains) sets the source; re-rendering
// on search/paging goes through renderMyDomains() without an argument.
const MYDOM_PER_PAGE=10;
let _myDomAll=[], _myDomPage=0, _myDomSearch='';
function renderMyDomains(domains){
  if(domains) _myDomAll=domains;
  const box=$('myDomainsList'); if(!box) return;
  const pager=$('myDomainsPager');
  const q=_myDomSearch.trim().toLowerCase();
  const filtered=q?_myDomAll.filter(d=>String(d.name||'').toLowerCase().includes(q)):_myDomAll;
  if(!_myDomAll.length){
    box.innerHTML='<div class="empty-note">No .web3 domains on this wallet yet \u2014 claim one via ORD/domains below.</div>';
    if(pager) pager.classList.add('hidden');
    return;
  }
  if(!filtered.length){
    box.innerHTML='<div class="empty-note">No domains match "'+esc(q)+'".</div>';
    if(pager) pager.classList.add('hidden');
    return;
  }
  const pages=Math.max(1, Math.ceil(filtered.length/MYDOM_PER_PAGE));
  if(_myDomPage>=pages)_myDomPage=pages-1;
  if(_myDomPage<0)_myDomPage=0;
  const slice=filtered.slice(_myDomPage*MYDOM_PER_PAGE, _myDomPage*MYDOM_PER_PAGE+MYDOM_PER_PAGE);
  box.innerHTML=slice.map(d=>{
    const sale=d.listing_status==='active';
    const badge=sale
      ? `<span class="domain-badge sale">For sale${(d.listing_price!=null)?' \u00b7 $'+esc(String(d.listing_price)):''}</span>`
      : `<span class="domain-badge">${esc(String(d.status||'claimed'))}</span>`;
    return `<div class="domain-row" data-domain="${esc(String(d.name))}" title="Open ${esc(String(d.name))}"><span class="dn">${esc(String(d.name))}</span>${badge}</div>`;
  }).join('');
  box.querySelectorAll('.domain-row').forEach(row=>{
    row.addEventListener('click', ()=>showDomainDetail(row.getAttribute('data-domain')));
  });
  if(pager){
    if(filtered.length>MYDOM_PER_PAGE){
      pager.classList.remove('hidden');
      $('myDomPrev').disabled=(_myDomPage<=0);
      $('myDomNext').disabled=(_myDomPage>=pages-1);
      $('myDomPageInfo').textContent='Page '+(_myDomPage+1)+' / '+pages+' \u00b7 '+filtered.length+' total';
    } else pager.classList.add('hidden');
  }
}

/* ---------- domain detail + set-target (signed) ---------- */
let _domCurrent=null;
async function showDomainDetail(name){
  _domCurrent=name;
  showView('domain');
  $('domName').textContent=name;
  $('domInfo').innerHTML='<div class="empty-note">Loading…</div>';
  $('domTxid').value=''; $('domVout').value='';
  clr($('domErr')); clr($('domOk'));
  loadDomainRecords(name);
  try{
    const r=await fetch(DOMAINS_API+'/whois/'+encodeURIComponent(name));
    if(!r.ok) throw new Error('HTTP '+r.status);
    const j=await r.json();
    const tgt=j.target ? esc(String(j.target.txid||j.target)) : null;
    $('domInfo').innerHTML=
      `<div class="kv"><span class="k">Status</span><span class="v">${esc(String(j.status||'—'))}</span></div>`+
      `<div class="kv"><span class="k">Owner</span><span class="v">${esc(String(j.owner||'—').slice(0,12))}…${esc(String(j.owner||'').slice(-6))}</span></div>`+
      `<div class="kv"><span class="k">Target</span><span class="v">${tgt ? tgt.slice(0,16)+'…' : 'not set'}</span></div>`+
      `<div class="kv"><span class="k">Registered</span><span class="v">${esc(String(j.registered_at||'—').slice(0,10))}</span></div>`;
    if(j.target && j.target.txid){ $('domTxid').value=String(j.target.txid); if(j.target.vout!=null) $('domVout').value=String(j.target.vout); }
    else if(typeof j.target==='string' && j.target){ $('domTxid').value=j.target; }
  }catch(e){
    $('domInfo').innerHTML='<div class="empty-note">Could not load domain details.</div>';
  }
}

/* ---------- signed wallet actions (key = ownership) ---------- */
function okMsg(t){ const o=$('domOk'); o.textContent=t; o.classList.add('show'); }
function parseTx(v){ const s=String(v||'').trim().toLowerCase(); const m=s.match(/^([0-9a-f]{64})(?::(\d+))?$/); if(!m) return null; return { txid:m[1], vout:m[2]?parseInt(m[2],10):0 }; }
function signAction(action, fields){
  const ts=Date.now();
  const msg=['ordnet-registry',action].concat(fields.map(String)).concat([String(ts)]).join('|');
  const sig=signMessage(msg);
  return { ts, address:_address, signature:sig.signature, pubkey:sig.pubkey };
}
async function walletPost(pathname, action, fields, body){
  if(!_address||!_wif) throw new Error('Unlock your wallet first.');
  const auth=signAction(action, fields);
  const r=await fetch(DOMAINS_API+pathname,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(Object.assign({}, body, auth)) });
  const j=await r.json().catch(()=>({}));
  if(!r.ok||j.error) throw new Error(j.error||('HTTP '+r.status));
  return j;
}

/* ---------- subdomains / routes / marketplace records ---------- */
async function loadDomainRecords(name){
  const subs=$('domSubs'), rts=$('domRoutes'), mkt=$('domMkt');
  try{
    const r=await fetch(DOMAINS_API+'/api/domain/'+encodeURIComponent(name)+'/records');
    if(!r.ok) throw new Error('HTTP '+r.status);
    const j=await r.json();
    if(name!==_domCurrent) return;
    renderRecs(subs, j.subdomains||[], 'sub');
    renderRecs(rts, j.routes||[], 'route');
    renderMkt(j.listing||null);
  }catch(e){
    subs.innerHTML='<div class="empty-note">Could not load records.</div>';
    rts.innerHTML='<div class="empty-note">—</div>';
    mkt.innerHTML='<div class="empty-note">—</div>';
  }
}
function renderRecs(box, items, kind){
  if(!items.length){ box.innerHTML='<div class="empty-note">None yet.</div>'; return; }
  box.innerHTML=items.map(it=>{
    const label = kind==='sub' ? esc(String(it.subdomain)) : (it.subdomain?esc(String(it.subdomain))+' \u00b7 ':'')+'/'+esc(String(it.path));
    const attrs = kind==='sub' ? 'data-sub="'+esc(String(it.subdomain))+'"' : 'data-path="'+esc(String(it.path))+'" data-rsub="'+esc(String(it.subdomain||''))+'"';
    return '<div class="rec-row"><span class="rn">'+label+'</span><span class="rt">'+esc(String(it.txid||'').slice(0,12))+'\u2026</span><button class="iconbtn rec-del" '+attrs+' title="Remove">'+ICONS.trash+'</button></div>';
  }).join('');
  box.querySelectorAll('.rec-del').forEach(b=>b.addEventListener('click', ()=>{
    if(kind==='sub') delSubdomain(b.getAttribute('data-sub'));
    else delRoute(b.getAttribute('data-rsub'), b.getAttribute('data-path'));
  }));
}
function renderMkt(listing){
  const mkt=$('domMkt');
  if(listing){
    mkt.innerHTML='<div class="kv"><span class="k">Listed</span><span class="v">$'+esc(String(listing.price_usd))+'</span></div>'
      +'<div class="rec-add mkt" style="margin-top:6px"><input type="number" class="form-input" id="mktPrice" min="1" step="1" value="'+esc(String(listing.price_usd))+'"><button class="btn btn-secondary" id="btnMktUpd">Update</button><button class="btn btn-secondary" id="btnMktDel">Delist</button></div>';
    $('btnMktUpd').addEventListener('click', updateListing);
    $('btnMktDel').addEventListener('click', delistDomain);
  }else{
    mkt.innerHTML='<div class="rec-add mkt"><input type="number" class="form-input" id="mktPrice" min="1" step="1" placeholder="Price USD"><button class="btn btn-secondary" id="btnMktList" style="grid-column:span 2">List for sale</button></div>';
    $('btnMktList').addEventListener('click', listDomain);
  }
}
async function addSubdomain(){
  clr($('domErr')); clr($('domOk'));
  const sd=$('subNew').value.trim().toLowerCase(); const tx=parseTx($('subTx').value);
  if(!/^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]?$/.test(sd)){ err($('domErr'),'Invalid subdomain name (alphanumeric, hyphens).'); return; }
  if(!tx){ err($('domErr'),'Enter a valid TXID, optionally as TXID:vout.'); return; }
  try{
    await walletPost('/wallet/subdomain','subdomain',[_domCurrent,sd,tx.txid,tx.vout],{domain:_domCurrent,subdomain:sd,txid:tx.txid,vout:tx.vout});
    $('subNew').value=''; $('subTx').value='';
    okMsg('Subdomain saved \u2713'); loadDomainRecords(_domCurrent);
  }catch(e){ err($('domErr'),'Could not save subdomain: '+String(e.message||e)); }
}
async function delSubdomain(sd){
  clr($('domErr')); clr($('domOk'));
  try{
    await walletPost('/wallet/subdomain-delete','subdomain-delete',[_domCurrent,sd],{domain:_domCurrent,subdomain:sd});
    okMsg('Subdomain removed \u2713'); loadDomainRecords(_domCurrent);
  }catch(e){ err($('domErr'),'Could not remove: '+String(e.message||e)); }
}
async function addRoute(){
  clr($('domErr')); clr($('domOk'));
  const p=$('rtPath').value.trim().toLowerCase().replace(/^\/+/,''); const sub=$('rtSub').value.trim().toLowerCase(); const tx=parseTx($('rtTx').value);
  if(!/^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]?$/.test(p)){ err($('domErr'),'Invalid path (alphanumeric, hyphens).'); return; }
  if(!tx){ err($('domErr'),'Enter a valid TXID, optionally as TXID:vout.'); return; }
  try{
    await walletPost('/wallet/route','route',[_domCurrent,sub||'',p,tx.txid,tx.vout],{domain:_domCurrent,subdomain:sub||null,path:p,txid:tx.txid,vout:tx.vout});
    $('rtPath').value=''; $('rtTx').value=''; $('rtSub').value='';
    okMsg('Route saved \u2713'); loadDomainRecords(_domCurrent);
  }catch(e){ err($('domErr'), e.message==='subdomain_not_found' ? 'That subdomain does not exist yet \u2014 create it first.' : 'Could not save route: '+String(e.message||e)); }
}
async function delRoute(sub, p){
  clr($('domErr')); clr($('domOk'));
  try{
    await walletPost('/wallet/route-delete','route-delete',[_domCurrent,sub||'',p],{domain:_domCurrent,subdomain:sub||null,path:p});
    okMsg('Route removed \u2713'); loadDomainRecords(_domCurrent);
  }catch(e){ err($('domErr'),'Could not remove: '+String(e.message||e)); }
}
async function removeTarget(){
  clr($('domErr')); clr($('domOk'));
  try{
    // v4.2 (iOS v2.5.2 fix) — same as set-target: the target handlers need
    // the canonical `name` field; `domain` stays for compatibility
    await walletPost('/wallet/remove-target','remove-target',[_domCurrent],{name:_domCurrent, domain:_domCurrent});
    $('domTxid').value=''; $('domVout').value='';
    okMsg('Target removed \u2713'); showDomainDetail(_domCurrent);
  }catch(e){ err($('domErr'),'Could not remove target: '+String(e.message||e)); }
}
async function listDomain(){
  clr($('domErr')); clr($('domOk'));
  const price=parseFloat($('mktPrice').value);
  if(!Number.isFinite(price)||price<=0){ err($('domErr'),'Enter a valid price in USD.'); return; }
  try{
    await walletPost('/wallet/list','list',[_domCurrent,price],{domain:_domCurrent,price_usd:price});
    okMsg('Listed for sale \u2713');
    try{ await chrome.storage.local.remove('web3domains:'+_address); }catch(e){}
    loadDomainRecords(_domCurrent);
  }catch(e){ err($('domErr'), e.message==='invalid_price' ? 'Price is below the minimum listing price.' : 'Could not list: '+String(e.message||e)); }
}
async function updateListing(){
  clr($('domErr')); clr($('domOk'));
  const price=parseFloat($('mktPrice').value);
  if(!Number.isFinite(price)||price<=0){ err($('domErr'),'Enter a valid price in USD.'); return; }
  try{
    await walletPost('/wallet/listing-update','listing-update',[_domCurrent,price],{domain:_domCurrent,price_usd:price});
    okMsg('Price updated \u2713');
    try{ await chrome.storage.local.remove('web3domains:'+_address); }catch(e){}
    loadDomainRecords(_domCurrent);
  }catch(e){ err($('domErr'), e.message==='has_pending_order' ? 'A purchase is in progress \u2014 listing is locked.' : 'Could not update: '+String(e.message||e)); }
}
async function delistDomain(){
  clr($('domErr')); clr($('domOk'));
  try{
    await walletPost('/wallet/delist','delist',[_domCurrent],{domain:_domCurrent});
    okMsg('Delisted \u2713');
    try{ await chrome.storage.local.remove('web3domains:'+_address); }catch(e){}
    loadDomainRecords(_domCurrent);
  }catch(e){ err($('domErr'), e.message==='has_pending_order' ? 'A purchase is in progress \u2014 listing is locked.' : 'Could not delist: '+String(e.message||e)); }
}
async function transferDomain(){
  clr($('domErr')); clr($('domOk'));
  const to=$('trAddr').value.trim();
  if(!/^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(to)){ err($('domErr'),'Enter a valid BSV address for the new owner.'); return; }
  if($('trConfirm').value.trim().toLowerCase()!==_domCurrent){ err($('domErr'),'Type the domain name exactly to confirm the transfer.'); return; }
  const btn=$('btnTransfer'); btn.disabled=true; btn.textContent='Signing\u2026';
  try{
    await walletPost('/wallet/transfer','transfer',[_domCurrent,to],{domain:_domCurrent,new_owner:to});
    okMsg('Domain transferred \u2713');
    try{ await chrome.storage.local.remove('web3domains:'+_address); }catch(e){}
    $('trAddr').value=''; $('trConfirm').value='';
    setTimeout(showDomains, 1400);
  }catch(e){ err($('domErr'), e.message==='listed_delist_first' ? 'This domain is listed for sale \u2014 delist it first.' : 'Could not transfer: '+String(e.message||e)); }
  finally{ btn.disabled=false; btn.textContent='Sign & transfer domain'; }
}

async function saveDomainTarget(){
  clr($('domErr')); clr($('domOk'));
  const name=_domCurrent;
  const txid=$('domTxid').value.trim().toLowerCase();
  const vout=parseInt($('domVout').value||'0',10);
  if(!name){ err($('domErr'),'No domain selected.'); return; }
  if(!_address||!_wif){ err($('domErr'),'Unlock your wallet first.'); return; }
  if(!/^[0-9a-f]{64}$/.test(txid)){ err($('domErr'),'Enter a valid 64-character transaction ID.'); return; }
  if(!Number.isInteger(vout)||vout<0){ err($('domErr'),'Output index must be 0 or higher.'); return; }
  const btn=$('btnDomainSave'); btn.disabled=true; btn.textContent='Signing…';
  try{
    const ts=Date.now();
    const msg=['ordnet-registry','set-target',name,txid,String(vout),String(ts)].join('|');
    const sig=signMessage(msg);
    btn.textContent='Saving…';
    // v4.2 (iOS v2.5.2 fix) — the v2 /wallet/set-target handler identifies the
    // domain by the platform's canonical `name` field (like /whois and
    // /resolve?name=); with only `domain` a ROOT domain fell through as an
    // empty name → invalid_domain. Send `name` (keep `domain` for compat).
    const r=await fetch(DOMAINS_API+'/wallet/set-target',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ name, domain:name, txid, vout, ts, address:_address, signature:sig.signature, pubkey:sig.pubkey })
    });
    const j=await r.json().catch(()=>({}));
    if(!r.ok||j.error) throw new Error(j.error||('HTTP '+r.status));
    const okEl=$('domOk'); okEl.textContent='Target updated \u2713'; okEl.classList.add('show');
    try{ await chrome.storage.local.remove('web3domains:'+_address); }catch(e){}
  }catch(e){
    err($('domErr'), e.message==='invalid_signature' ? 'Signature rejected \u2014 is this domain owned by the active wallet?' : 'Could not save: '+String(e.message||e));
  }finally{
    btn.disabled=false; btn.textContent='Sign & save target';
  }
}

function showBrowse(){ showView('browse'); setTimeout(()=>{ try{ $('browseInput').focus(); }catch(e){} }, 60); }
/* v4.2 — Domains is its own bottom-menu tab (was part of the browse view) */
function showDomains(){ showView('domains'); loadMyDomains(false); }
function browseNavigate(q){
  chrome.tabs.create({ url: chrome.runtime.getURL('src/viewer.html?q='+encodeURIComponent(q)) });
  window.close();
}

