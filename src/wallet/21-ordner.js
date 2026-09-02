/* =========================================================================
   v4.2 — ORD/ner: on-chain file browser (iOS v2.3.0/v2.6.1 parity)
   Every inscription the address currently holds, from the 1Sat index at
   ordinals.gorillapool.io (paged, max 500). Thumbnails via our OWN path:
   raw tx hex (cached) + envelope parse — never a third-party content
   endpoint. Index down → degrades inline to the app's own inscription log.
   ========================================================================= */
const ORDNER_API='https://ordinals.gorillapool.io/api';
let _onFiles=[];      // [{originTxid,originVout,currentTxid,currentVout,contentType,size,height,held,name}]
let _onView='grid';   // 'grid' | 'list'
let _onHideSent=false;
let _onSel=null;
let _onIdxOk=true;

async function showOrdner(){
  showView('ordner');
  $('onViewToggle').innerHTML=(_onView==='grid')?ICONS.listIcon:ICONS.grid;
  $('onList').innerHTML='<div class="empty-note">Loading…</div>';
  await loadInscriptions();
  await loadOrdnerFiles();
  renderOrdner();
}
async function fetchOrdnerIndex(address){
  const out=[];
  let offset=0;
  for(let page=0; page<5; page++){
    const r=await fetch(`${ORDNER_API}/txos/address/${address}/unspent?limit=100&offset=${offset}`);
    if(!r.ok) throw new Error('the 1Sat index at ordinals.gorillapool.io is unreachable');
    const arr=await r.json();
    if(!Array.isArray(arr)) throw new Error('the 1Sat index at ordinals.gorillapool.io is unreachable');
    for(const item of arr){
      const origin=item && item.origin;
      const insc=origin && origin.data && origin.data.insc;
      if(!insc) continue;   // same filter as ord-app v42: only real inscriptions
      const oOut=String(origin.outpoint||'').split('_');
      const cOut=String(item.outpoint||'').split('_');
      if(!oOut[0]||!cOut[0]) continue;
      const file=insc.file||{};
      out.push({
        originTxid:oOut[0], originVout:parseInt(oOut[1],10)||0,
        currentTxid:cOut[0], currentVout:parseInt(cOut[1],10)||0,
        contentType:String(file.type||'unknown'), size:parseInt(file.size,10)||0,
        height:item.height||null, held:true, name:null
      });
    }
    if(arr.length<100) break;
    offset+=100;
  }
  return out;
}
async function loadOrdnerFiles(){
  let files=[];
  try{
    files=await fetchOrdnerIndex(_address);
    _onIdxOk=true;
  }catch(e){ _onIdxOk=false; }
  // merge the app's own inscription log: names for held items, and items the
  // address no longer holds shown with a "sent" label (v2.3.0)
  const log=_inscriptions[_address]||[];
  const heldByOrigin={};
  files.forEach(f=>{ heldByOrigin[f.originTxid]=f; });
  for(const rec of log){
    const held=heldByOrigin[rec.txid];
    if(held){ held.name=rec.name; }
    else if(_onIdxOk){
      files.push({ originTxid:rec.txid, originVout:0, currentTxid:rec.txid, currentVout:0,
                   contentType:rec.contentType, size:rec.size, height:null, held:false, name:rec.name });
    }
  }
  if(!_onIdxOk){
    // degrade inline to the app's own log
    files=log.map(rec=>({ originTxid:rec.txid, originVout:0, currentTxid:rec.txid, currentVout:0,
                          contentType:rec.contentType, size:rec.size, height:null, held:true, name:rec.name }));
  }
  _onFiles=files;
}
function ordnerTypeIcon(ct){
  if(String(ct).startsWith('image/')) return _svg('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>', 18);
  if(String(ct).startsWith('text/html')) return _svg('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>', 18);
  if(String(ct).startsWith('text/')) return _svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>', 18);
  return _svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>', 18);
}
function ordnerLabel(f){
  if(f.name) return f.name;
  const ext=({'image/jpeg':'jpg','image/png':'png','image/gif':'gif','image/webp':'webp','text/plain':'txt','text/html':'html'})[f.contentType];
  return f.originTxid.slice(0,8)+'…'+(ext?('.'+ext):'');
}
function ordnerVisible(){
  return _onFiles.filter(f=>f.held || !_onHideSent);
}
function renderOrdner(){
  const list=$('onList');
  const files=ordnerVisible();
  const sent=_onFiles.filter(f=>!f.held).length;
  $('onSubtitle').textContent=(_onIdxOk?String(_onFiles.filter(f=>f.held).length)+' on-chain files':'index unavailable — own log only');
  $('onIndexNote').classList.toggle('hidden', _onIdxOk);
  if(!_onIdxOk) $('onIndexNote').textContent='Could not reach the 1Sat index at ordinals.gorillapool.io — showing only the files inscribed with this wallet.';
  $('onSentCount').textContent=sent?(sent+' sent item'+(sent===1?'':'s')):'';
  $('onHideSent').classList.toggle('hidden', !sent);
  $('onHideSent').textContent=_onHideSent?'Show sent items':'Hide sent items';
  if(!files.length){
    list.innerHTML='<div class="empty-note">'+(_onIdxOk?'No on-chain files on this address yet. Inscribe one via the Upload tab!':'Nothing inscribed with this wallet yet.')+'</div>';
    return;
  }
  if(_onView==='grid'){
    list.innerHTML='<div class="ordner-grid">'+files.map((f,i)=>`
      <div class="ordner-cell" data-of="${_onFiles.indexOf(f)}">
        <div class="thumb" data-thumb="${esc(f.originTxid)}_${f.originVout}">${ordnerTypeIcon(f.contentType)}</div>
        <div class="fn">${esc(ordnerLabel(f))}${f.held?'':' ·sent'}</div>
      </div>`).join('')+'</div>';
  } else {
    list.innerHTML=files.map(f=>`
      <div class="ordner-row" data-of="${_onFiles.indexOf(f)}">
        <div class="thumb" data-thumb="${esc(f.originTxid)}_${f.originVout}">${ordnerTypeIcon(f.contentType)}</div>
        <div class="m"><div class="fn">${esc(ordnerLabel(f))}</div><div class="fs">${esc(f.contentType)}${f.size?' · '+upSizeLabel(f.size):''}</div></div>
        ${f.held?'':'<span class="sent-pill">sent</span>'}
      </div>`).join('');
  }
  loadOrdnerThumbs(files);
}
/* thumbnails: images render via raw hex + envelope parse (tx hex is cached
   in fetchTxHexRetry, so a folder of items from one claim costs one fetch) */
async function loadOrdnerThumbs(files){
  const imgs=files.filter(f=>f.contentType.startsWith('image/')).slice(0,30);
  for(const f of imgs){
    const sel='[data-thumb="'+f.originTxid+'_'+f.originVout+'"]';
    try{
      const hex=await fetchTxHexRetry(f.originTxid);
      const ord=extractOrd(hex, f.originVout)||extractFirstOrd(hex);
      if(!ord||!ord.ct.startsWith('image/')) continue;
      document.querySelectorAll(sel).forEach(el=>{ el.innerHTML='<img src="data:'+ord.ct+';base64,'+ord.dataB64+'">'; });
    }catch(_){ /* thumb stays a type icon */ }
  }
}
function showOrdFile(idx){
  const f=_onFiles[idx]; if(!f) return;
  _onSel=f;
  showView('ordfile');
  clr($('ofErr')); const cp=$('ofCopied'); cp.className='alert alert-success'; cp.textContent='';
  $('ofTitle').textContent=ordnerLabel(f);
  $('ofSubtitle').textContent=f.held?'held by this address':'sent — no longer on this address';
  $('ofType').textContent=f.contentType;
  $('ofSize').textContent=f.size?upSizeLabel(f.size):'—';
  $('ofTxid').textContent=f.currentTxid.slice(0,10)+'…'+f.currentTxid.slice(-6);
  $('ofOrigin').textContent=f.originTxid.slice(0,10)+'…'+f.originTxid.slice(-6)+'_'+f.originVout;
  $('ofCurrent').textContent=f.currentTxid.slice(0,10)+'…'+f.currentTxid.slice(-6)+'_'+f.currentVout;
  $('ofSendBtn').classList.toggle('hidden', !f.held);
  const pw=$('ofPreviewWrap'); pw.classList.add('hidden'); pw.innerHTML='';
  (async()=>{
    try{
      const hex=await fetchTxHexRetry(f.originTxid);
      const ord=extractOrd(hex, f.originVout)||extractFirstOrd(hex);
      if(!ord) return;
      if(ord.ct.startsWith('image/')){
        pw.innerHTML='<img src="data:'+ord.ct+';base64,'+ord.dataB64+'" style="max-width:100%;max-height:200px;border-radius:8px">';
        pw.classList.remove('hidden');
      } else if(ord.ct.startsWith('text/')){
        const text=atob(ord.dataB64);
        pw.innerHTML='<pre style="text-align:left;font-size:10.5px;max-height:160px;overflow:auto;white-space:pre-wrap;word-break:break-word">'+esc(text.slice(0,2000))+'</pre>';
        pw.classList.remove('hidden');
      }
    }catch(_){ /* preview unavailable — detail rows still work */ }
  })();
}
/* v2.6.1 — one tap copies the FULL value, with inline "copied ✓" */
async function ofCopy(value, label){
  try{
    await navigator.clipboard.writeText(value);
    const cp=$('ofCopied'); cp.textContent=label+' copied ✓'; cp.className='alert alert-success show';
    setTimeout(()=>{ cp.className='alert alert-success'; cp.textContent=''; }, 1600);
  }catch(_){ err($('ofErr'),'Could not copy — copy it manually.'); }
}
function ofCopyAll(){
  const f=_onSel; if(!f) return;
  let info='Name: '+ordnerLabel(f)
    +'\nContent-Type: '+f.contentType+'\nSize: '+(f.size?upSizeLabel(f.size):'—')
    +'\nTXID: '+f.currentTxid
    +'\nOrigin: '+f.originTxid+'_'+f.originVout
    +'\nCurrent UTXO: '+f.currentTxid+'_'+f.currentVout;
  ofCopy(info, 'All info');
}
function ofSend(){
  const f=_onSel; if(!f||!f.held) return;
  startSendOrdinalItem({ kind:'ordfile', name:ordnerLabel(f), status:'held',
                         currentTxid:f.currentTxid, currentVout:f.currentVout });
}

