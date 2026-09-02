/* ---------- backup / reveal secret (per account, password-gated) ---------- */
let _bkIdx = -1;
function showBackup(i){
  _bkIdx = (typeof i==='number') ? i : _active;
  const a=_accounts[_bkIdx];
  showView('backup');
  $('bkName').textContent=(a.name||'Account')+' \u00b7 '+ (ORIGIN_LABEL[a.origin]||'key');
  $('bkGate').classList.remove('hidden');
  $('bkReveal').classList.add('hidden');
  $('bkPw').value=''; clr($('bkErr'));
  const ok=$('bkOk'); ok.className='alert alert-success'; ok.textContent='';
  setTimeout(()=>{ try{ $('bkPw').focus(); }catch(e){} }, 60);
}
async function doReveal(){
  clr($('bkErr'));
  const a=_accounts[_bkIdx]; if(!a){ err($('bkErr'),'No account selected.'); return; }
  const pw=$('bkPw').value;
  if(!pw){ err($('bkErr'),'Enter your password.'); return; }
  const btn=$('bkRevealBtn'); btn.disabled=true; const ol=btn.textContent; btn.innerHTML='<span class="spinner"></span> Checking...';
  try{
    // verify password by decrypting the vault (never trust the in-memory unlock alone for reveal)
    const vault=await storageGet(VAULT_KEY);
    if(!vault) throw new Error('No wallet on this device.');
    const bits=await kdfBits(pw, b64dec(vault.kdf.salt), vault.kdf.iters);
    const key=await aesKeyFromBits(bits);
    try{ await decryptPayload(key, vault.cipher); }
    catch(e){ throw new Error('Wrong password.'); }
    // WIF is always available
    $('bkWif').value=a.wif;
    // phrase reveal only if the account was created from a phrase in THIS session
    const phrase=_sessionPhrases[a.address];
    if(phrase){
      $('bkPhraseWrap').classList.remove('hidden');
      $('bkOrigin').textContent=(a.origin==='legacy'?'legacy':'BIP44');
      $('bkPhrase').value=phrase;
      $('bkPhraseHint').textContent='';
    }else{
      $('bkPhraseWrap').classList.add('hidden');
      const ok=$('bkOk');
      if(a.origin==='wif' || a.origin==='random'){
        ok.textContent='This account has no recovery phrase (it was added from a private key). Back up the WIF below.';
      }else{
        ok.textContent='The recovery phrase is not held in memory for this account. Back up the WIF below, or re-import the account from its phrase to reveal it.';
      }
      ok.className='alert alert-success show';
    }
    $('bkGate').classList.add('hidden');
    $('bkReveal').classList.remove('hidden');
  }catch(e){ err($('bkErr'), e.message||'Could not reveal secret.'); }
  finally{ btn.disabled=false; btn.textContent=ol; }
}
function hideRevealSecret(){
  $('bkWif').value=''; $('bkPhrase').value='';
  showAccounts();
}
async function copyText(str, okEl, label){
  try{ await navigator.clipboard.writeText(str); okEl.textContent=(label||'Copied')+' to clipboard.'; okEl.className='alert alert-success show'; }
  catch(e){ okEl.textContent='Could not copy \u2014 select the text and copy manually.'; okEl.className='alert alert-success show'; }
}

/* ---------- change password (re-encrypt the vault) ---------- */
function showChangePw(){
  showView('changepw');
  $('cpCur').value=''; $('cpNew1').value=''; $('cpNew2').value='';
  clr($('cpErr')); const ok=$('cpOk'); ok.className='alert alert-success'; ok.textContent='';
}
async function doChangePw(){
  clr($('cpErr')); const ok=$('cpOk'); ok.className='alert alert-success'; ok.textContent='';
  const btn=$('cpBtn'); btn.disabled=true; const ol=btn.textContent; btn.innerHTML='<span class="spinner"></span> Re-encrypting...';
  try{
    const vault=await storageGet(VAULT_KEY);
    if(!vault) throw new Error('No wallet on this device.');
    // verify current password
    const curBits=await kdfBits($('cpCur').value, b64dec(vault.kdf.salt), vault.kdf.iters);
    const curKey=await aesKeyFromBits(curBits);
    let payload;
    try{ payload=await decryptPayload(curKey, vault.cipher); }
    catch(e){ throw new Error('Current password is wrong.'); }
    checkPw($('cpNew1').value, $('cpNew2').value);
    if($('cpNew1').value===$('cpCur').value) throw new Error('New password is the same as the current one.');
    // re-encrypt with a fresh salt+key
    await createVault($('cpNew1').value, payload); // sets _aesKey + refreshes session
    ok.textContent='Password changed. Your vault has been re-encrypted.'; ok.className='alert alert-success show';
    $('cpCur').value=''; $('cpNew1').value=''; $('cpNew2').value='';
  }catch(e){ err($('cpErr'), e.message||'Could not change password.'); }
  finally{ btn.disabled=false; btn.textContent=ol; }
}

/* ---------- connected sites (whitelist of origins allowed to read this wallet) ---------- */
async function getConnected(){
  return (await new Promise(r=>chrome.storage.session.get(['ordplug_connected'],x=>r(x.ordplug_connected))))||{};
}
async function showSites(){
  showView('sites');
  const list=$('sitesList'); list.innerHTML='<div class="empty-note">Loading\u2026</div>';
  const conn=await getConnected();
  const origins=Object.keys(conn).filter(o=>conn[o]);
  if(!origins.length){ list.innerHTML='<div class="empty-note">No sites are connected in this browser session. Sites connect when you approve a wallet request.</div>'; return; }
  list.innerHTML=origins.map(o=>`
    <div class="acct">
      <div class="ic">${ICONS.link}</div>
      <div class="m"><div class="nm" style="font-size:13px">${esc(o.replace(/^https?:\/\//,''))}</div><div class="ad">${esc(o)}</div></div>
      <div class="ax"><button class="iconbtn" title="Disconnect" data-disc="${esc(o)}">${ICONS.trash}</button></div>
    </div>`).join('');
}
async function disconnectSite(origin){
  const conn=await getConnected();
  delete conn[origin];
  await new Promise(r=>chrome.storage.session.set({ ordplug_connected:conn }, r));
  showSites();
}

/* ---------- send max ---------- */
async function sendMax(){
  clr($('sendErr'));
  const btn=$('sendMaxBtn'); const ol=btn.textContent; btn.textContent='calculating...';
  try{
    const b=await getBalance();
    const spendable=(b.confirmed||0); // only confirmed sats are safely spendable
    const reserve=sendMinerFee()+TOTAL_SERVICE_FEES;
    const max=spendable-reserve;
    if(max<1){ err($('sendErr'),'Balance too low to cover the network + service fee.'); $('sendAmt').value=''; }
    else $('sendAmt').value=String(max);
  }catch(e){ err($('sendErr'),'Could not read balance for max.'); }
  finally{ btn.textContent=ol; }
}

/* ---------- activity-based auto-lock: refresh the session timestamp on interaction ---------- */
let _touchThrottle=0;
function touchActivity(){
  if(!_aesKey) return;
  const now=Date.now();
  if(now-_touchThrottle < 20000) return; // at most once per 20s
  _touchThrottle=now;
  sessionGetKey().then(s=>{ if(s&&s.k) sessionSetKey({ k:s.k, t:now }); });
}

/* V49.3 — ACTIVE auto-lock (item 15). Until 4.9.2 the auto-lock window was
   only checked when the popup was (re)opened, so a wallet window left open
   (an unanswered approval, the ORD/ner tab) never locked. Now a watchdog in
   the window itself checks the session timestamp every 30 s and locks the
   moment the window passes. Interaction still refreshes the timestamp via
   touchActivity(). */
let _autolockTimer=null;
function startAutolockWatch(){
  if(_autolockTimer) clearInterval(_autolockTimer);
  _autolockTimer=setInterval(async ()=>{
    try{
      if(!_aesKey) return;
      const mins=await getAutolockMin(); if(!(mins>0)) return;
      const s=await sessionGetKey();
      if(!s || !s.k){ await lockWallet(); return; }           // locked elsewhere (another window)
      if((Date.now()-(s.t||0)) > mins*60000) await lockWallet();
    }catch(e){}
  }, 30000);
}

/* ---------- address book (labels for trusted recipients) ----------
   Public addresses only — no key material — so it is stored unencrypted in
   chrome.storage.local as [{ name, address, ts }]. */
let _book = [];
async function loadBook(){
  const v = await storageGet(ADDRBOOK_KEY);
  _book = Array.isArray(v) ? v : [];
  return _book;
}
async function saveBook(){ await storageSet({ [ADDRBOOK_KEY]: _book }); }
function bookLabelFor(addr){ const e=_book.find(x=>x.address===addr); return e ? e.name : null; }
async function bookAdd(name, address){
  try{ bsv.Address.fromString(address); }catch(e){ throw new Error('That is not a valid BSV address.'); }
  name=(name||'').trim(); if(!name) name='Saved '+(_book.length+1);
  const existing=_book.find(x=>x.address===address);
  if(existing){ existing.name=name; }
  else _book.push({ name, address, ts:Date.now() });
  await saveBook();
}
async function bookRemove(address){ _book=_book.filter(x=>x.address!==address); await saveBook(); }

async function showAddressBook(){
  showView('book');
  await loadBook();
  renderBook();
  $('bookName').value=''; $('bookAddr').value=''; clr($('bookErr'));
}
function renderBook(){
  const list=$('bookList');
  if(!_book.length){ list.innerHTML='<div class="empty-note">No saved addresses yet. Add trusted recipients here so you can pick them when sending.</div>'; return; }
  list.innerHTML=_book.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(e=>`
    <div class="acct">
      <div class="ic">${esc((e.name||'A').charAt(0).toUpperCase())}</div>
      <div class="m"><div class="nm" style="font-size:13px">${esc(e.name)}</div><div class="ad">${esc(e.address)}</div></div>
      <div class="ax"><button class="iconbtn" title="Remove" data-book-del="${esc(e.address)}">${ICONS.trash}</button></div>
    </div>`).join('');
}
async function doBookAdd(){
  clr($('bookErr'));
  try{ await bookAdd($('bookName').value, $('bookAddr').value.trim()); $('bookName').value=''; $('bookAddr').value=''; renderBook(); }
  catch(e){ err($('bookErr'), e.message||'Could not add address.'); }
}

/* fill the send-view address-book dropdown */
async function fillSendBook(){
  await loadBook();
  const sel=$('sendBookSel');
  if(!_book.length){ sel.classList.add('hidden'); return; }
  sel.classList.remove('hidden');
  sel.innerHTML='<option value="">— pick from address book —</option>'+
    _book.slice().sort((a,b)=>a.name.localeCompare(b.name))
      .map(e=>`<option value="${esc(e.address)}">${esc(e.name)} · ${esc(e.address.slice(0,8))}…${esc(e.address.slice(-4))}</option>`).join('');
}

/* ---------- send safety: warn before signing (BSV-appropriate, no false certainty) ----------
   Not a full EVM-style simulation (BSV can't preview state changes the same way),
   but catches the mistakes that actually lose funds: unknown-first-time address,
   sending (near) the whole balance, self-sends, and malformed input. */
let _lastKnownBalance = null;
let _lastSentAddr = null;
async function saveLastSentAddress(){
  if(!_lastSentAddr) { showAddressBook(); return; }
  showView('book');
  await loadBook();
  $('bookAddr').value=_lastSentAddr;
  $('bookName').value='';
  renderBook();
  clr($('bookErr'));
  setTimeout(()=>{ try{ $('bookName').focus(); }catch(e){} }, 60);
}
async function evaluateSendSafety(){
  const warnEl=$('sendWarn');
  const to=$('sendTo').value.trim();
  const amt=parseInt($('sendAmt').value)||0;
  const notes=[];
  if(to){
    let valid=true; try{ bsv.Address.fromString(to); }catch(e){ valid=false; }
    // v4.1 — name recognition hints (strictly separated: dotted → SNS,
    // bare → OpNS; anything else with @ is refused at Send time)
    if(!valid){
      if(snsInputCandidate(to)){
        notes.push('This looks like an SNS name'+(to.includes('@')?' mailbox':'')+'. Press Send to resolve it via the signed SNS resolver — you confirm the verified holder address before anything is paid.');
      } else if(opnsNameCandidate(to)){
        notes.push('This looks like a bare OpNS name (no dot = not SNS). Press Send to resolve it — exact match only, and you confirm the verified holder address before anything is paid.');
      }
    }
    if(valid){
      if(to===_address) notes.push('This is your own active address — the coins will not leave this wallet.');
      else if(!bookLabelFor(to) && !_accounts.some(a=>a.address===to))
        notes.push('First time sending to this address. Double-check it character by character — BSV transfers cannot be reversed.');
      else { const lbl=bookLabelFor(to); if(lbl) notes.push('Recipient: "'+lbl+'" from your address book.'); }
    }
  }
  if(amt>0 && _lastKnownBalance!=null){
    const spendable=_lastKnownBalance-(sendMinerFee()+TOTAL_SERVICE_FEES);
    if(amt>=spendable && spendable>0) notes.push('This sends essentially your entire spendable balance.');
  }
  if(notes.length){ warnEl.innerHTML=notes.map(esc).join('<br>'); warnEl.style.display='flex'; }
  else { warnEl.style.display='none'; warnEl.innerHTML=''; }
}

/* clipboard paste with verification — defends against clipboard-hijack malware
   that swaps a copied address for the attacker's at paste time */
async function pasteToSend(){
  clr($('sendErr'));
  try{
    const txt=(await navigator.clipboard.readText()||'').trim();
    if(!txt){ err($('sendErr'),'Clipboard is empty.'); return; }
    // v4.1 — an SNS/OpNS name is also a valid paste target now
    if(!validAddress(txt) && !snsInputCandidate(txt) && !opnsNameCandidate(txt)){
      err($('sendErr'),'Clipboard does not contain a valid BSV address, SNS or OpNS name.'); return;
    }
    $('sendTo').value=txt;
    clearNameTargets(); updateSendConfirmUI();
    evaluateSendSafety();
  }catch(e){ err($('sendErr'),'Could not read the clipboard. Paste the address manually.'); }
}

