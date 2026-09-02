/* ---------- setup / create / import (V11: password + BIP44/legacy/WIF) ---------- */
function checkPw(p1, p2){
  if(!p1 || p1.length < 8) throw new Error('Password must be at least 8 characters.');
  if(p1 !== p2) throw new Error('Passwords do not match.');
}
function showSetup(){ showView('setup'); setupChoice(); }
function setupChoice(){
  $('setup-choice').classList.remove('hidden');
  $('setup-create').classList.add('hidden');
  $('setup-import').classList.add('hidden');
  $('setup-verify').classList.add('hidden');
}
function showCreate(){
  $('setup-choice').classList.add('hidden');
  $('setup-import').classList.add('hidden');
  $('setup-create').classList.remove('hidden');
  clr($('createErr')); $('createPw1').value=''; $('createPw2').value='';
  try{
    const ent=crypto.getRandomValues(new Uint8Array(16));
    const mnemonic=entropyToMnemonic(ent);
    $('newMnemonic').value=mnemonic;
    $('newAddress').textContent=wifToAddress(mnemonicToWifBip44(mnemonic));
    $('createBtn').disabled=false;
  }catch(e){
    $('newMnemonic').value=''; $('newAddress').textContent='—'; $('createBtn').disabled=true;
    err($('createErr'), 'Could not generate a wallet: '+(e.message||e));
  }
}
/* V49.3 — recovery challenge (item 10). "I wrote it down" validates the
   password fields, then asks for three random words before anything is
   encrypted. The wallet is only created from the verify screen. */
let _verifyIdx=[];
function pickVerifyIndexes(n){
  const idx=new Set();
  while(idx.size<3){ idx.add(crypto.getRandomValues(new Uint32Array(1))[0]%n); }
  return [...idx].sort((a,b)=>a-b);
}
function showCreateChallenge(){
  clr($('createErr'));
  const mnemonic=$('newMnemonic').value.trim();
  if(!validateMnemonic(mnemonic)){ err($('createErr'),'Recovery phrase missing — go Back and try again.'); return; }
  try{ checkPw($('createPw1').value, $('createPw2').value); }catch(e){ err($('createErr'), e.message||'Check the password.'); return; }
  const words=mnemonic.split(/\s+/);
  _verifyIdx=pickVerifyIndexes(words.length);
  [1,2,3].forEach(k=>{ $('vfLabel'+k).textContent='Word #'+(_verifyIdx[k-1]+1); $('vfWord'+k).value=''; });
  clr($('verifyErr'));
  $('setup-create').classList.add('hidden'); $('setup-verify').classList.remove('hidden');
  setTimeout(()=>{ try{ $('vfWord1').focus(); }catch(e){} }, 60);
}
function backToCreatePhrase(){ $('setup-verify').classList.add('hidden'); $('setup-create').classList.remove('hidden'); }
async function createWalletNow(){
  clr($('verifyErr'));
  const mnemonic=$('newMnemonic').value.trim();
  if(!validateMnemonic(mnemonic)){ err($('verifyErr'),'Recovery phrase missing — go back and try again.'); return; }
  const words=mnemonic.split(/\s+/);
  const wrong=[1,2,3].filter(k=>$('vfWord'+k).value.trim().toLowerCase()!==words[_verifyIdx[k-1]]);
  if(_verifyIdx.length!==3 || wrong.length){ err($('verifyErr'),'Word'+(wrong.length>1?'s':'')+' #'+wrong.map(k=>_verifyIdx[k-1]+1).join(', #')+' do'+(wrong.length>1?'':'es')+' not match your phrase. Check your backup — the wallet is not created yet.'); return; }
  const btn=$('verifyBtn'); btn.disabled=true; const ol=btn.textContent; btn.innerHTML='<span class="spinner"></span> Encrypting...';
  try{
    checkPw($('createPw1').value, $('createPw2').value);
    const wif=mnemonicToWifBip44(mnemonic);
    const addr=wifToAddress(wif);
    const acctName=$('createName').value.trim()||'Account 1';
    _accounts=[{ name:acctName, wif, origin:'bip44', path:BIP44_PATH, address:addr }];
    _sessionPhrases[addr]=mnemonic;
    _active=0; setActive(0);
    await createVault($('createPw1').value, payloadFromState());
    await afterReady();
  }catch(e){ err($('verifyErr'), e.message||'Failed.'); }
  finally{ btn.disabled=false; btn.textContent=ol; }
}
/* V49.3 — live import preview (item 11): every keystroke re-derives the
   address the current input would open. The Import button is disabled until
   the phrase/WIF is valid and that address is visible. */
function updateImportLive(){
  const st=$('importLiveStatus'), ad=$('importLiveAddress'), btn=$('importBtn');
  if(!st||!ad||!btn) return;
  const mode=_impMode;
  try{
    if(mode==='wif'){
      const wif=$('importWif').value.trim();
      if(!wif){ st.textContent='—'; ad.textContent='—'; btn.disabled=true; return; }
      ad.textContent=wifToAddress(wif); st.textContent='valid WIF'; btn.disabled=false; return;
    }
    const m=$('importMnemonic').value.trim().toLowerCase();
    const problem=mnemonicProblem(m);
    if(problem){ st.textContent=m?problem:'—'; st.style.color=m?'#dc2626':''; ad.textContent='—'; btn.disabled=true; return; }
    st.style.color=''; st.textContent=m.split(/\s+/).length+' words, checksum OK';
    if(mode==='other'){
      const p=presetById($('importWalletSel').value);
      const path=p.custom?$('importCustomPath').value.trim():p.path;
      const pin=p.pin?$('importPin').value:'';
      ad.textContent=wifToAddress(mnemonicToWifPath(m, path, pin));
    } else if(mode==='legacy') ad.textContent=wifToAddress(mnemonicToWif(m));
    else ad.textContent=wifToAddress(mnemonicToWifBip44(m));
    btn.disabled=false;
  }catch(e){ st.textContent=(e.message||'invalid'); st.style.color='#dc2626'; ad.textContent='—'; btn.disabled=true; }
}
function showImport(){
  $('setup-choice').classList.add('hidden');
  $('setup-create').classList.add('hidden');
  $('setup-verify').classList.add('hidden');
  $('setup-import').classList.remove('hidden');
  setImport('bip44'); clr($('importErr'));
  $('importPw1').value=''; $('importPw2').value='';
}
const IMP_HINTS = {
  bip44:  "Standard BSV derivation ("+"m/44'/236'/0'/0/0"+") — compatible with most BSV wallets.",
  other:  'Pick the app where this wallet was created; the matching derivation path is applied automatically.',
  legacy: 'ORD/plug V9 derivation — use this to restore a wallet created in an earlier ORD/plug version.',
  wif:    'Paste a single private key in WIF format (starts with K, L or 5).'
};
function fillWalletPicker(){
  const sel=$('importWalletSel');
  if(sel.options.length) return; // once
  sel.innerHTML=WALLET_PRESETS.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
}
function onPresetChange(){
  const p=presetById($('importWalletSel').value);
  $('importCustomPath').classList.toggle('hidden', !p.custom);
  if(p.custom && !$('importCustomPath').value) $('importCustomPath').value=p.path;
  $('importPin').classList.toggle('hidden', !p.pin);
  $('impHint').textContent=p.note || IMP_HINTS.other;
  $('importPreview').classList.add('hidden'); $('importPreview').innerHTML='';
}
function setImport(m){
  _impMode=m;
  $('impSegB').classList.toggle('on', m==='bip44');
  $('impSegO').classList.toggle('on', m==='other');
  $('impSegL').classList.toggle('on', m==='legacy');
  $('impSegW').classList.toggle('on', m==='wif');
  $('importMnemonic').classList.toggle('hidden', m==='wif');
  setTimeout(updateImportLive, 0);
  $('importWif').classList.toggle('hidden', m!=='wif');
  $('importWalletPicker').classList.toggle('hidden', m!=='other');
  if(m==='other'){ fillWalletPicker(); onPresetChange(); }
  else $('impHint').textContent=IMP_HINTS[m];
}
/* Resolve the WIF for the currently-selected "other wallet" preset. */
function otherWalletResolve(mnemonic){
  const p=presetById($('importWalletSel').value);
  let path=p.path;
  if(p.custom){
    path=$('importCustomPath').value.trim();
    if(!/^m(\/\d+'?)+$/.test(path)) throw new Error("Enter a valid path like m/44'/236'/0'/0/0.");
  }
  const pin=p.pin ? $('importPin').value : '';
  return { wif:mnemonicToWifPath(mnemonic, path, pin), origin:'bip44', path, phrase:mnemonic };
}
function wifFromImportInputs(mode, mnemonicEl, wifEl){
  if(mode==='wif'){
    const wif=wifEl.value.trim();
    if(!wif) throw new Error('Enter a private key (WIF).');
    wifToAddress(wif); // validates
    return { wif, origin:'wif', path:null, phrase:null };
  }
  const m=mnemonicEl.value.trim().toLowerCase();
  if(!validateMnemonic(m)) throw new Error('Invalid recovery phrase.');
  if(mode==='other')  return otherWalletResolve(m);
  if(mode==='legacy') return { wif:mnemonicToWif(m), origin:'legacy', path:null, phrase:m };
  return { wif:mnemonicToWifBip44(m), origin:'bip44', path:BIP44_PATH, phrase:m };
}
/* Preview the address(es) a preset would import, so the user can confirm before committing. */
function importPreview(){
  const box=$('importPreview'); box.classList.remove('hidden');
  const m=$('importMnemonic').value.trim().toLowerCase();
  if(!validateMnemonic(m)){ box.innerHTML='<div class="alert alert-danger show">Enter a valid recovery phrase first.</div>'; return; }
  const p=presetById($('importWalletSel').value);
  const pin=p.pin ? $('importPin').value : '';
  const rows=[];
  const tryPath=(label, path)=>{
    try{
      if(p.custom && !/^m(\/\d+'?)+$/.test(path)) throw new Error('bad path');
      const addr=wifToAddress(mnemonicToWifPath(m, path, pin));
      rows.push(`<div class="kv"><span class="k">${esc(label)}</span><span class="v">${esc(addr)}</span></div>`);
    }catch(e){ rows.push(`<div class="kv"><span class="k">${esc(label)}</span><span class="v">invalid path</span></div>`); }
  };
  const mainPath = p.custom ? $('importCustomPath').value.trim() : p.path;
  tryPath(p.name+' (main)', mainPath);
  (p.alt||[]).forEach((ap,i)=>tryPath('alt '+(i+1)+' ('+ap+')', ap));
  box.innerHTML='<div class="card" style="padding:12px">'+rows.join('')+
    '</div><div class="hint">This is the address that will be imported. If your coins are on a different address, try another wallet or a custom path.</div>';
}
async function importWalletNow(){

  clr($('importErr'));
  const btn=$('importBtn'); btn.disabled=true; const ol=btn.textContent; btn.innerHTML='<span class="spinner"></span> Encrypting...';
  try{
    checkPw($('importPw1').value, $('importPw2').value);
    const r=wifFromImportInputs(_impMode, $('importMnemonic'), $('importWif'));
    const addr=wifToAddress(r.wif);
    const acctName=$('importName').value.trim()||'Account 1';
    _accounts=[{ name:acctName, wif:r.wif, origin:r.origin, path:r.path, address:addr }];
    if(r.phrase) _sessionPhrases[addr]=r.phrase;
    _active=0; setActive(0);
    await createVault($('importPw1').value, payloadFromState());
    $('importMnemonic').value=''; $('importWif').value='';
    await afterReady();
  }catch(e){ err($('importErr'), e.message||'Import failed.'); }
  finally{ btn.disabled=false; btn.textContent=ol; }
}

/* ---------- migrate: V9 plaintext -> V11 encrypted vault ---------- */
function showMigrate(legacy){ _legacyData=legacy; showView('migrate'); clr($('migErr')); }
async function doMigrate(){
  clr($('migErr'));
  const btn=$('migBtn'); btn.disabled=true; const ol=btn.textContent; btn.innerHTML='<span class="spinner"></span> Encrypting...';
  try{
    checkPw($('migPw1').value, $('migPw2').value);
    _accounts=(_legacyData && _legacyData.accounts || []).map(a=>({ name:a.name, wif:a.wif, origin:'legacy', path:null, address:wifToAddress(a.wif) }));
    if(!_accounts.length) throw new Error('No accounts found to migrate.');
    _active=Math.min(_legacyData.active||0, _accounts.length-1); setActive(_active);
    await createVault($('migPw1').value, payloadFromState());
    await storageRemove(ACCTS_KEY); // plaintext keys wiped
    _legacyData=null;
    await afterReady();
  }catch(e){ err($('migErr'), e.message||'Migration failed.'); }
  finally{ btn.disabled=false; btn.textContent=ol; }
}

/* ---------- unlock ---------- */
function showUnlock(msg){
  showView('unlock');
  $('unlockPw').value=''; clr($('unlockErr'));
  $('forgotConfirm').classList.add('hidden');
  $('unlockSub').textContent = msg || 'Enter your password to unlock';
  setTimeout(()=>{ try{ $('unlockPw').focus(); }catch(e){} }, 60);
}
async function doUnlock(){
  clr($('unlockErr'));
  const pw=$('unlockPw').value;
  if(!pw){ err($('unlockErr'),'Enter your password.'); return; }
  const btn=$('unlockBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Unlocking...';
  try{
    const payload=await unlockWithPassword(pw);
    applyPayload(payload);
    await afterReady();
  }catch(e){ err($('unlockErr'), e.message||'Unlock failed.'); }
  finally{ btn.disabled=false; btn.textContent='Unlock'; }
}

async function afterReady(){
  // v4.2 — chain mechanism + BRC-100 state: load persisted tips/guard and
  // drop tips that are provably spent (direct spent-endpoint) before serving
  await loadChainState();
  await loadBrc100State();
  validateChainTips();   // runs in the background; unknown keeps the tip
  startAutolockWatch();  // V49.3 — active auto-lock while this window stays open
  if(_pending){
    const conn=(await new Promise(r=>chrome.storage.session.get(['ordplug_connected'],x=>r(x.ordplug_connected))))||{};
    const readMethods=['getAddress','getPublicKey','getBalance'];
    if(readMethods.includes(_pending.method) && conn[_pending.origin]){
      try{
        let result;
        if(_pending.method==='getAddress') result={ address:_address };
        else if(_pending.method==='getPublicKey') result={ pubkey:wifToPubKey(_wif), address:_address };
        else result=await getBalance();
        resolvePending(true, result); window.close(); return;
      }catch(e){ resolvePending(false, null, e.message); window.close(); return; }
    }
    presentApproval();
  } else if(_pendingBrc100){
    // v4.2 — BRC-100 request: grants sheet / tx confirm / data answer
    handleBrc100Pending(_pendingBrc100);
  } else {
    showIdle();
  }
}

