/* ---------- accounts + security ---------- */
function setAdd(m){ _addMode=m; $('addSegG').classList.toggle('on',m==='gen'); $('addSegI').classList.toggle('on',m==='imp');
  $('addImportWrap').classList.toggle('hidden',m!=='imp'); }
function setAddImp(m){
  _addImpMode=m;
  $('aImpSegB').classList.toggle('on', m==='bip44');
  $('aImpSegO').classList.toggle('on', m==='other');
  $('aImpSegL').classList.toggle('on', m==='legacy');
  $('aImpSegW').classList.toggle('on', m==='wif');
  $('addMnemonic').classList.toggle('hidden', m==='wif');
  $('addWif').classList.toggle('hidden', m!=='wif');
  $('addWalletPicker').classList.toggle('hidden', m!=='other');
  if(m==='other'){ fillAddWalletPicker(); onAddPresetChange(); }
}
function fillAddWalletPicker(){
  const sel=$('addWalletSel'); if(sel.options.length) return;
  sel.innerHTML=WALLET_PRESETS.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
}
function onAddPresetChange(){
  const p=presetById($('addWalletSel').value);
  $('addCustomPath').classList.toggle('hidden', !p.custom);
  if(p.custom && !$('addCustomPath').value) $('addCustomPath').value=p.path;
  $('addPin').classList.toggle('hidden', !p.pin);
  $('addImpHint').textContent=p.note || '';
}
function addOtherWalletResolve(mnemonic){
  const p=presetById($('addWalletSel').value);
  let path=p.path;
  if(p.custom){ path=$('addCustomPath').value.trim(); if(!/^m(\/\d+'?)+$/.test(path)) throw new Error("Enter a valid path like m/44'/236'/0'/0/0."); }
  const pin=p.pin ? $('addPin').value : '';
  return { wif:mnemonicToWifPath(mnemonic, path, pin), origin:'bip44', path, phrase:mnemonic };
}
async function showAccounts(){
  showView('accounts'); _confirmRemove=-1; renderAccounts();
  clr($('addErr')); $('addName').value=''; setAdd('gen'); setAddImp('bip44');
}
async function showSettings(){
  showView('settings');
  $('removeConfirm').classList.add('hidden');
  try{ $('autolockSel').value=String(await getAutolockMin()); }catch(e){}
  renderBrc100Grants();   // v4.2 — BRC-100 grants manager
}
const ORIGIN_LABEL = { bip44:'BIP44', legacy:'legacy', wif:'WIF', random:'generated' };
function renderAccounts(){
  $('acctCount').textContent=_accounts.length+' account'+(_accounts.length!==1?'s':'');
  $('acctList').innerHTML=_accounts.map((a,i)=>`
    <div class="acct ${i===_active?'active':''}" data-i="${i}">
      <div class="ic">${(a.name||'A').charAt(0).toUpperCase()}</div>
      <div class="m">
        <div class="nm">${esc(a.name||'Account')}${i===_active?'<span class="badge">active</span>':''}</div>
        <div class="ad" title="${esc(ORIGIN_LABEL[a.origin]||'')}">${esc(a.address)}</div>
      </div>
      <div class="ax">
        ${i!==_active?`<button class="iconbtn" title="Use" data-act="use" data-i="${i}">${ICONS.arrowRight}</button>`:''}
        <button class="iconbtn" title="Rename" data-act="rename" data-i="${i}">${ICONS.edit}</button>
        <button class="iconbtn" title="Export key / backup" data-act="export" data-i="${i}">${ICONS.key}</button>
        ${_accounts.length>1?(_confirmRemove===i
            ? `<button class="iconbtn" style="color:var(--status-red);border-color:var(--status-red)" title="Confirm" data-act="remove" data-i="${i}">${ICONS.check}</button>`
            : `<button class="iconbtn" title="Remove" data-act="askremove" data-i="${i}">${ICONS.trash}</button>`):''}
      </div>
    </div>`).join('');
}
async function switchAccount(i){ setActive(i); _confirmRemove=-1; renderAccounts(); validateChainTips(); try{ await saveAccounts(); }catch(e){ err($('addErr'),'Switched, but could not save: '+(e.message||e)); } }
function renameAccount(i){
  const cur=_accounts[i].name||'';
  const cards=$('acctList').querySelectorAll('.acct'); const card=cards[i]; if(!card) return;
  const nm=card.querySelector('.nm');
  nm.innerHTML=`<input class="form-input" style="padding:6px 8px;font-size:13px" value="${esc(cur)}" id="renameInput">`;
  const inp=$('renameInput'); inp.focus(); inp.select();
  inp.onkeydown=async(e)=>{ if(e.key==='Enter'){ _accounts[i].name=inp.value.trim()||cur; await saveAccounts(); renderAccounts(); } if(e.key==='Escape') renderAccounts(); };
  inp.onblur=async()=>{ _accounts[i].name=inp.value.trim()||cur; await saveAccounts(); renderAccounts(); };
}
function askRemove(i){ _confirmRemove=i; renderAccounts(); }
async function removeAccount(i){
  if(_accounts.length<=1) return;
  _accounts.splice(i,1);
  if(_active>=_accounts.length) _active=_accounts.length-1;
  if(_active===i) _active=Math.max(0,i-1);
  setActive(Math.min(_active,_accounts.length-1));
  _confirmRemove=-1;
  renderAccounts();                       // reflect the removal in the UI immediately
  try{ await saveAccounts(); }
  catch(e){ err($('addErr'), 'Removed, but could not save: '+(e.message||e)+' — unlock and try again.'); }
}
async function addAccount(){
  clr($('addErr'));
  const btn=$('addBtn'); btn.disabled=true;
  try{
    let wif, origin, path=null, phrase=null;
    if(_addMode==='gen'){ wif=bsv.PrivateKey.fromRandom().toWIF(); origin='random'; }
    else if(_addImpMode==='other'){
      const m=$('addMnemonic').value.trim().toLowerCase();
      if(!validateMnemonic(m)) throw new Error('Invalid recovery phrase.');
      const r=addOtherWalletResolve(m); wif=r.wif; origin=r.origin; path=r.path; phrase=r.phrase;
    } else {
      const r=wifFromImportInputs(_addImpMode, $('addMnemonic'), $('addWif'));
      wif=r.wif; origin=r.origin; path=r.path; phrase=r.phrase;
    }
    const addr=wifToAddress(wif);
    if(_accounts.some(a=>a.address===addr)) throw new Error('That account is already in the wallet.');
    const name=$('addName').value.trim() || ('Account '+(_accounts.length+1));
    _accounts.push({ name, wif, origin, path, address:addr });
    if(phrase) _sessionPhrases[addr]=phrase;
    $('addMnemonic').value=''; $('addWif').value=''; $('addName').value=''; setAdd('gen'); setAddImp('bip44');
    renderAccounts();
    await saveAccounts();
  }catch(e){ err($('addErr'), e.message||'Could not add account.'); }
  finally{ btn.disabled=false; }
}

