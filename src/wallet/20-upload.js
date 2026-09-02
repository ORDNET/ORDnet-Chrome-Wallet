/* =========================================================================
   v4.2 — Upload & Inscribe (iOS Upload tab parity, v2.6.2 layout)
   Inscribe images (JPEG/PNG/GIF/WebP), text and HTML as 1Sat Ordinals —
   identical envelope + ORDnet.io OP_RETURN + fees as the existing inscribe
   path. Image compression via canvas (JPEG/PNG sources only; compression
   can never make the file bigger). Per-wallet inscription log.
   ========================================================================= */
const INSCRIPTIONS_KEY='ordnet_inscriptions_v1';
let _inscriptions={};          // { address: [{txid,name,contentType,size,ts}] } newest first
let _upOriginal=null;          // Uint8Array of the ORIGINAL file
let _upData=null;              // Uint8Array actually inscribed (after compression)
let _upCT='', _upOriginalCT='', _upName='';
let _upTextMode='text';

async function loadInscriptions(){ _inscriptions=(await storageGet(INSCRIPTIONS_KEY))||{}; }
function logInscription(rec){
  const list=_inscriptions[_address]||[];
  list.unshift(rec);
  _inscriptions[_address]=list;
  storageSet({ [INSCRIPTIONS_KEY]: _inscriptions });
}
function showUpload(){
  showView('upload');
  clr($('upErr'));
  loadInscriptions();
}
function upSizeLabel(n){
  if(n>=1048576) return (n/1048576).toFixed(2)+' MB';
  if(n>=1024) return (n/1024).toFixed(1)+' KB';
  return n+' B';
}
function upSniffCT(name, mime){
  const m=String(mime||'').toLowerCase();
  if(m && m!=='application/octet-stream') return m;
  const ext=String(name||'').toLowerCase().split('.').pop();
  return { jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', gif:'image/gif', webp:'image/webp',
           txt:'text/plain', html:'text/html', htm:'text/html' }[ext]||'application/octet-stream';
}
function upRefreshSelected(){
  if(!_upData){ $('upSelected').classList.add('hidden'); return; }
  $('upSelected').classList.remove('hidden');
  $('upName').textContent=_upName;
  $('upType').textContent=_upCT;
  const q=parseInt($('upQuality').value,10);
  $('upSize').textContent=(_upData.length===_upOriginal.length)
    ? upSizeLabel(_upData.length)
    : upSizeLabel(_upOriginal.length)+' → '+upSizeLabel(_upData.length);
  $('upQualityLabel').textContent=(q>=100)?'Original':(q+'% · '+upSizeLabel(_upOriginal.length)+' → '+upSizeLabel(_upData.length));
  $('upFees').textContent='~'+inscribeMinerFee(_upData.length).toLocaleString()+' sats network + '+TOTAL_SERVICE_FEES.toLocaleString()+' sats service';
  if(_upCT.startsWith('image/')){
    $('upPreviewWrap').classList.remove('hidden');
    $('upPreview').src='data:'+_upCT+';base64,'+ordU8b64(_upData);
  } else $('upPreviewWrap').classList.add('hidden');
}
async function upOnFile(e){
  clr($('upErr'));
  const f=e.target.files && e.target.files[0];
  if(!f) return;
  if(f.size>100*1048576){ err($('upErr'),'File too large — the limit is 100MB, like the ORDnet HTML tools.'); return; }
  const buf=new Uint8Array(await f.arrayBuffer());
  _upOriginal=buf; _upData=buf;
  _upCT=upSniffCT(f.name, f.type); _upOriginalCT=_upCT; _upName=f.name;
  // compression is offered for JPEG/PNG sources (GIF/WebP stay untouched —
  // recompressing would break animation/alpha)
  const compressible=(_upCT==='image/jpeg'||_upCT==='image/png');
  $('upCompressWrap').classList.toggle('hidden', !compressible);
  $('upQuality').value='100';
  upRefreshSelected();
}
/* re-encode the ORIGINAL image at the chosen quality; never let
   "compression" make the file bigger than the original */
function upApplyCompression(){
  const q=parseInt($('upQuality').value,10);
  if(q>=100 || !_upOriginal || !(_upOriginalCT==='image/jpeg'||_upOriginalCT==='image/png')){
    _upData=_upOriginal; _upCT=_upOriginalCT; upRefreshSelected(); return;
  }
  const img=new Image();
  img.onload=()=>{
    const cv=document.createElement('canvas');
    cv.width=img.naturalWidth; cv.height=img.naturalHeight;
    cv.getContext('2d').drawImage(img, 0, 0);
    cv.toBlob(async b=>{
      if(!b){ _upData=_upOriginal; _upCT=_upOriginalCT; upRefreshSelected(); return; }
      const out=new Uint8Array(await b.arrayBuffer());
      if(out.length>=_upOriginal.length){ _upData=_upOriginal; _upCT=_upOriginalCT; }
      else { _upData=out; _upCT='image/jpeg'; }
      upRefreshSelected();
    }, 'image/jpeg', q/100);
  };
  img.onerror=()=>{ _upData=_upOriginal; _upCT=_upOriginalCT; upRefreshSelected(); };
  img.src='data:'+_upOriginalCT+';base64,'+ordU8b64(_upOriginal);
}
async function upInscribeSelected(){
  clr($('upErr'));
  if(!_upData){ err($('upErr'),'Pick a file first.'); return; }
  await upInscribe(_upCT, _upData, _upName, $('upInscribeBtn'));
}
function upTextInfo(){
  const t=$('upText').value;
  const bytes=new TextEncoder().encode(t);
  const ct=_upTextMode==='html'?'text/html':'text/plain';
  return { bytes, ct };
}
function upUpdateTextHint(){
  const { bytes }=upTextInfo();
  $('upTextHint').innerHTML=bytes.length
    ? (upSizeLabel(bytes.length)+' · ~'+inscribeMinerFee(bytes.length).toLocaleString()+' sats network + '+TOTAL_SERVICE_FEES.toLocaleString()+' sats service')
    : '&nbsp;';
}
async function upInscribeText(){
  clr($('upErr'));
  const { bytes, ct }=upTextInfo();
  if(!bytes.length){ err($('upErr'),'Type or paste something first.'); return; }
  await upInscribe(ct, bytes, (_upTextMode==='html'?'typed.html':'typed.txt'), $('upTextBtn'));
}
async function upInscribe(ct, bytes, name, btn){
  btn.disabled=true; const ol=btn.textContent; btn.innerHTML='<span class="spinner"></span> Inscribing...';
  try{
    const tx=await buildInscribe(ct, bytes);
    const txid=await broadcastAndRegister(tx);
    logInscription({ txid, name, contentType:ct, size:bytes.length, ts:Date.now() });
    // v2.6.1 — persistent success section (survives the file-section reset)
    $('upSuccess').classList.remove('hidden');
    $('upSuccessTxid').textContent=txid;
    // reset the file section
    _upOriginal=null; _upData=null; _upCT=''; _upName='';
    try{ $('upFile').value=''; }catch(_){}
    $('upSelected').classList.add('hidden');
  }catch(e){ err($('upErr'), e.message||'Inscribe failed.'); }
  finally{ btn.disabled=false; btn.textContent=ol; }
}

