/* ---------- events (MV3: no inline handlers) ---------- */
function wireEvents(){
  // unlock
  $('unlockBtn').addEventListener('click', doUnlock);
  $('unlockPw').addEventListener('keydown', e=>{ if(e.key==='Enter') doUnlock(); });
  $('btnForgot').addEventListener('click', ()=>$('forgotConfirm').classList.remove('hidden'));
  $('btnForgotNo').addEventListener('click', ()=>$('forgotConfirm').classList.add('hidden'));
  $('btnForgotYes').addEventListener('click', removeWalletNow);
  // migrate
  $('migBtn').addEventListener('click', doMigrate);
  // setup
  $('btnShowCreate').addEventListener('click', showCreate);
  $('btnShowImport').addEventListener('click', showImport);
  $('btnCreateBack').addEventListener('click', setupChoice);
  $('createBtn').addEventListener('click', showCreateChallenge);   // V49.3 — challenge first
  $('verifyBtn').addEventListener('click', createWalletNow);
  $('btnVerifyBack').addEventListener('click', backToCreatePhrase);
  ['vfWord1','vfWord2','vfWord3'].forEach(id=>$(id).addEventListener('keydown', e=>{ if(e.key==='Enter') createWalletNow(); }));
  // V49.3 — live import preview
  ['importMnemonic','importWif','importCustomPath','importPin'].forEach(id=>$(id).addEventListener('input', updateImportLive));
  $('importWalletSel').addEventListener('change', updateImportLive);
  $('btnImportBack').addEventListener('click', setupChoice);
  $('importBtn').addEventListener('click', importWalletNow);
  $('impSegB').addEventListener('click', ()=>setImport('bip44'));
  $('impSegO').addEventListener('click', ()=>setImport('other'));
  $('impSegL').addEventListener('click', ()=>setImport('legacy'));
  $('impSegW').addEventListener('click', ()=>setImport('wif'));
  $('importWalletSel').addEventListener('change', onPresetChange);
  $('importPreviewBtn').addEventListener('click', importPreview);
  // home
  $('btnShowSend').addEventListener('click', showSend);
  $('btnShowReceive').addEventListener('click', showReceive);
  // V49.4 — ⋯ menu on home
  $('btnMenu').innerHTML=ICONS.dots;
  const _menu=$('homeMenu');
  function closeMenu(){ _menu.classList.add('hidden'); $('btnMenu').setAttribute('aria-expanded','false'); }
  $('btnMenu').addEventListener('click', e=>{ e.stopPropagation(); const open=_menu.classList.toggle('hidden'); $('btnMenu').setAttribute('aria-expanded', open?'false':'true'); });
  document.addEventListener('click', e=>{ if(!e.target.closest('.menu-wrap')) closeMenu(); });
  _menu.querySelectorAll('.menu-item').forEach(b=>b.addEventListener('click', closeMenu));
  $('btnShowUtxo').querySelector('.mi').innerHTML=ICONS.utxo;
  $('btnShowHistory').querySelector('.mi').innerHTML=ICONS.history;
  $('btnShowSettings').querySelector('.mi').innerHTML=ICONS.gear;
  $('btnOpenTab').querySelector('.mi').innerHTML=ICONS.externalTab;
  $('btnLock').querySelector('.mi').innerHTML=ICONS.lock;
  // category rows → holdings screen; back; name detail back
  document.querySelectorAll('.cat-row[data-cat]').forEach(b=>b.addEventListener('click', ()=>showHoldingsCategory(b.dataset.cat)));
  $('catMarkSns').innerHTML=SNS_MARK; $('catMarkOpns').innerHTML=OPNS_MARK; $('catMarkMap').innerHTML=BSVMAP_MARK; $('catMarkSale').innerHTML=ICONS.tag;
  $('btnHoldBack').innerHTML=ICONS.back; $('btnHoldBack').addEventListener('click', showIdle);
  $('btnNdBack').innerHTML=ICONS.back; $('btnNdBack').addEventListener('click', ()=>showHoldingsCategory(_holdTab));
  // More tab
  $('moreMarkOrdner').innerHTML=ICONS.navFolder; $('moreMarkUtxo').innerHTML=ICONS.utxo; $('moreMarkSale').innerHTML=ICONS.tag; $('moreMarkHistory').innerHTML=ICONS.history; $('moreMarkSettings').innerHTML=ICONS.gear;
  $('moreOrdner').addEventListener('click', showOrdner);
  $('moreUtxo').addEventListener('click', showUtxoTools);
  $('moreSale').addEventListener('click', ()=>showHoldingsCategory('sale'));
  $('moreHistory').addEventListener('click', showHistory);
  $('moreSettings').addEventListener('click', showSettings);
  $('btnShowUtxo').addEventListener('click', showUtxoTools);
  $('btnShowAccounts').addEventListener('click', showAccounts);
  $('btnShowSettings').addEventListener('click', showSettings);
  // V46 Y4 — open the wallet in a full browser tab (monitor icon)
  $('btnOpenTab').addEventListener('click', ()=>{ try{ chrome.tabs.create({ url: chrome.runtime.getURL('src/wallet.html') }); window.close(); }catch(_){} });
  $('btnShowHistory').addEventListener('click', showHistory);
  $('tabSns').addEventListener('click', ()=>setHoldTab('sns'));
  $('tabMap').addEventListener('click', ()=>setHoldTab('bsvmap'));
  $('tabOpns').addEventListener('click', ()=>setHoldTab('opns')); // v4.1
  $('tabSale').addEventListener('click', ()=>setHoldTab('sale'));
  $('holdSearch').addEventListener('input', e=>{ _holdSearch=e.target.value; _holdPage=0; bulkReselectPage(); renderHoldings(); });
  $('holdPrev').addEventListener('click', ()=>{ _holdPage--; bulkReselectPage(); renderHoldings(); });
  $('holdNext').addEventListener('click', ()=>{ _holdPage++; bulkReselectPage(); renderHoldings(); });
  $('btnLock').addEventListener('click', lockWallet);
  $('copyAddr').addEventListener('click', copyActiveAddress);
  // (V49.4: btnShowUtxo/btnShowSettings/btnLock are menu items now — icons set above)
  $('btnShowAccounts').innerHTML=ICONS.users;
  // receive / history / browse
  $('btnRcvBack').addEventListener('click', showIdle);
  $('rcvCopyBtn').addEventListener('click', copyReceiveAddress);
  $('btnHistBack').addEventListener('click', showIdle);
  
  $('browseGoBtn').addEventListener('click', ()=>{ const v=$('browseInput').value.trim(); if(v) browseNavigate(v); });
  $('btnDomainsRefresh').addEventListener('click', ()=>loadMyDomains(true));
  // since v37 — search + paging in the WEB3 domain list (10 per page)
  $('myDomainsSearch').addEventListener('input', ()=>{ _myDomSearch=$('myDomainsSearch').value; _myDomPage=0; renderMyDomains(); });
  $('myDomPrev').addEventListener('click', ()=>{ _myDomPage--; renderMyDomains(); });
  $('myDomNext').addEventListener('click', ()=>{ _myDomPage++; renderMyDomains(); });
  $('btnDomainBack').addEventListener('click', showDomains);
  $('btnDomainOpen').addEventListener('click', ()=>{ if(_domCurrent) browseNavigate(_domCurrent); });
  $('btnDomainSave').addEventListener('click', saveDomainTarget);
  $('btnTargetClear').addEventListener('click', removeTarget);
  $('btnSubAdd').addEventListener('click', addSubdomain);
  $('btnRtAdd').addEventListener('click', addRoute);
  $('btnTransfer').addEventListener('click', transferDomain);
  $('browseInput').addEventListener('keydown', e=>{ if(e.key==='Enter'){ const v=e.target.value.trim(); if(v) browseNavigate(v); } });
  document.querySelectorAll('#view-browse .link-item[data-url]').forEach(item=>{
    item.addEventListener('click', ()=>{ chrome.tabs.create({ url:item.dataset.url }); window.close(); });
  });
  // history rows (delegated)
  $('histList').addEventListener('click', e=>{
    const row=e.target.closest('[data-tx]'); if(!row) return;
    chrome.tabs.create({ url:'https://whatsonchain.com/tx/'+row.dataset.tx });
  });
  // accounts + security
  $('addSegG').addEventListener('click', ()=>setAdd('gen'));
  $('addSegI').addEventListener('click', ()=>setAdd('imp'));
  $('aImpSegB').addEventListener('click', ()=>setAddImp('bip44'));
  $('aImpSegO').addEventListener('click', ()=>setAddImp('other'));
  $('aImpSegL').addEventListener('click', ()=>setAddImp('legacy'));
  $('aImpSegW').addEventListener('click', ()=>setAddImp('wif'));
  $('addWalletSel').addEventListener('change', onAddPresetChange);
  $('addBtn').addEventListener('click', addAccount);
  $('btnAcctBack').addEventListener('click', showIdle);
  $('btnSettingsBack').addEventListener('click', showIdle);
  $('btnLockNow').addEventListener('click', lockWallet);
  $('autolockSel').addEventListener('change', e=>{ storageSet({ [AUTOLOCK_KEY]: parseInt(e.target.value,10) }); });
  $('btnBackup').addEventListener('click', ()=>showBackup(_active));
  $('btnChangePw').addEventListener('click', showChangePw);
  $('btnConnectedSites').addEventListener('click', showSites);
  $('btnAddressBook').addEventListener('click', showAddressBook);
  // backup / reveal
  $('btnBkBack').addEventListener('click', showSettings);
  $('bkRevealBtn').addEventListener('click', doReveal);
  $('bkPw').addEventListener('keydown', e=>{ if(e.key==='Enter') doReveal(); });
  $('bkCopyPhrase').addEventListener('click', ()=>copyText($('bkPhrase').value, $('bkOk'), 'Recovery phrase copied'));
  $('bkCopyWif').addEventListener('click', ()=>copyText($('bkWif').value, $('bkOk'), 'WIF copied'));
  $('bkDoneBtn').addEventListener('click', hideRevealSecret);
  // change password
  $('btnCpBack').addEventListener('click', showSettings);
  $('cpBtn').addEventListener('click', doChangePw);
  // connected sites
  $('btnSitesBack').addEventListener('click', showSettings);
  $('sitesList').addEventListener('click', e=>{
    const b=e.target.closest('[data-disc]'); if(!b) return;
    disconnectSite(b.dataset.disc);
  });
  // send max
  $('sendMaxBtn').addEventListener('click', sendMax);
  // activity-based auto-lock: any interaction refreshes the unlock timer
  document.body.addEventListener('click', touchActivity, true);
  document.body.addEventListener('keydown', touchActivity, true);
  $('btnRemoveWallet').addEventListener('click', ()=>$('removeConfirm').classList.remove('hidden'));
  $('btnRemoveNo').addEventListener('click', ()=>$('removeConfirm').classList.add('hidden'));
  $('btnRemoveYes').addEventListener('click', removeWalletNow);
  $('acctList').addEventListener('click', (e)=>{
    const btn=e.target.closest('[data-act]'); if(!btn) return;
    const i=parseInt(btn.dataset.i,10);
    if(btn.dataset.act==='use') switchAccount(i);
    else if(btn.dataset.act==='rename') renameAccount(i);
    else if(btn.dataset.act==='export') showBackup(i);
    else if(btn.dataset.act==='askremove') askRemove(i);
    else if(btn.dataset.act==='remove') removeAccount(i);
  });
  // approval
  $('apApprove').addEventListener('click', approveRequest);
  $('apReject').addEventListener('click', rejectRequest);
  // send BSV / ordinal / list
  $('btnSendBack').addEventListener('click', showIdle);
  $('sendBtn').addEventListener('click', doSend);
  $('sendPasteBtn').addEventListener('click', pasteToSend);
  $('sendSaveBtn').addEventListener('click', saveLastSentAddress);
  $('sendBookSel').addEventListener('change', e=>{ if(e.target.value){ $('sendTo').value=e.target.value; clearNameTargets(); updateSendConfirmUI(); evaluateSendSafety(); } });
  // input changed → stale name confirmations die (v4.1, same as iOS)
  $('sendTo').addEventListener('input', ()=>{ clearNameTargets(); updateSendConfirmUI(); evaluateSendSafety(); });
  $('sendAmt').addEventListener('input', evaluateSendSafety);
  // address book
  $('btnBookBack').addEventListener('click', showSettings);
  $('bookAddBtn').addEventListener('click', doBookAdd);
  $('bookList').addEventListener('click', e=>{
    const b=e.target.closest('[data-book-del]'); if(!b) return;
    bookRemove(b.dataset.bookDel).then(renderBook);
  });
  $('btnSoBack').addEventListener('click', ()=>showHoldingsCategory(_holdTab));
  $('soBtn').addEventListener('click', doSendOrdinal);
  $('btnLoBack').addEventListener('click', ()=>showHoldingsCategory(_holdTab));
  $('loBtn').addEventListener('click', loShowConfirm);
  $('btnLoCancel').addEventListener('click', loShowForm);
  $('loConfirmBtn').addEventListener('click', doListOrdinal);
  $('loPrice').addEventListener('input', updateLoPriceHint);
  // delist
  $('btnDlBack').addEventListener('click', ()=>showHoldingsCategory(_holdTab));
  $('dlBtn').addEventListener('click', doDelistNow);
  // bulk list (inline selection mode)
  $('btnBulkList').addEventListener('click', ()=>{ _bulkMode?exitBulkMode():enterBulkMode(); });
  $('bulkCancel').addEventListener('click', exitBulkMode);
  $('bulkToggleAll').addEventListener('click', bulkToggleAllNow);
  $('bulkGo').addEventListener('click', bulkGoNow);
  $('bulkPrice').addEventListener('input', bulkDisarm);
  // v4.2 — bottom tab bar (iOS layout): Wallet · Browser · Domains · Upload · ORD/ner
  $('navWallet').innerHTML=ICONS.navWallet+'<span>Wallet</span>';
  $('navBrowser').innerHTML=ICONS.navBrowser+'<span>Browser</span>';
  $('navDomains').innerHTML=ICONS.navGlobe+'<span>Names</span>';
  $('navUpload').innerHTML=ICONS.navUpload+'<span>Upload</span>';
  $('navOrdner').innerHTML=ICONS.grid+'<span>More</span>';
  $('navWallet').addEventListener('click', showIdle);
  $('navBrowser').addEventListener('click', showBrowse);
  $('navDomains').addEventListener('click', showDomains);
  $('navUpload').addEventListener('click', showUpload);
  $('navOrdner').addEventListener('click', ()=>showView('more'));
  // v4.2 — UTXO tools
  $('btnUtxoBack').addEventListener('click', showIdle);
  $('btnUtxoBack').innerHTML=ICONS.wallet;
  $('utSplitBtn').addEventListener('click', doSplitTap);
  $('utCombineBtn').addEventListener('click', doCombineTap);
  $('utCount').addEventListener('input', ()=>{ _utConfirm=null; updateUtxoUI(); updateSplitHint(); });
  $('utSats').addEventListener('input', ()=>{ _utConfirm=null; updateUtxoUI(); updateSplitHint(); });
  // v4.2 — Upload & Inscribe
  $('upFile').addEventListener('change', upOnFile);
  $('upQuality').addEventListener('input', upApplyCompression);
  $('upInscribeBtn').addEventListener('click', upInscribeSelected);
  $('upSegText').addEventListener('click', ()=>{ _upTextMode='text'; $('upSegText').classList.add('on'); $('upSegHtml').classList.remove('on'); upUpdateTextHint(); });
  $('upSegHtml').addEventListener('click', ()=>{ _upTextMode='html'; $('upSegHtml').classList.add('on'); $('upSegText').classList.remove('on'); upUpdateTextHint(); });
  $('upText').addEventListener('input', upUpdateTextHint);
  $('upTextBtn').addEventListener('click', upInscribeText);
  $('upSuccessTxid').addEventListener('click', async ()=>{
    const t=$('upSuccessTxid').textContent;
    if(t && t!=='—'){ try{ await navigator.clipboard.writeText(t); const n=$('upSuccessTxid'); const o=n.textContent; n.textContent='Copied ✓'; setTimeout(()=>{ n.textContent=o; }, 900); }catch(_){} }
  });
  // v4.2 — ORD/ner
  $('onViewToggle').addEventListener('click', ()=>{ _onView=(_onView==='grid')?'list':'grid'; $('onViewToggle').innerHTML=(_onView==='grid')?ICONS.listIcon:ICONS.grid; renderOrdner(); });
  $('onRefresh').addEventListener('click', showOrdner);
  $('onHideSent').addEventListener('click', ()=>{ _onHideSent=!_onHideSent; renderOrdner(); });
  $('btnOfBack').addEventListener('click', showOrdner);
  $('btnOfBack').innerHTML=ICONS.navFolder;
  $('ofTxid').addEventListener('click', ()=>{ if(_onSel) ofCopy(_onSel.currentTxid, 'TXID'); });
  $('ofOrigin').addEventListener('click', ()=>{ if(_onSel) ofCopy(_onSel.originTxid+'_'+_onSel.originVout, 'Origin'); });
  $('ofCurrent').addEventListener('click', ()=>{ if(_onSel) ofCopy(_onSel.currentTxid+'_'+_onSel.currentVout, 'Current UTXO'); });
  $('ofCopyTxidBtn').addEventListener('click', ()=>{ if(_onSel) ofCopy(_onSel.currentTxid, 'TXID'); });
  $('ofCopyAllBtn').addEventListener('click', ofCopyAll);
  $('ofOpenBtn').addEventListener('click', ()=>{ if(_onSel) browseNavigate(_onSel.originTxid); });
  $('ofSendBtn').addEventListener('click', ofSend);
  // holdings: open link, send, list, delist or bulk-toggle (delegated)
  document.body.addEventListener('click', (e)=>{
    const of=e.target.closest('[data-of]');
    if(of){ showOrdFile(parseInt(of.dataset.of,10)); return; }
    const md=e.target.closest('[data-managedomain]');
    if(md){ showDomainDetail(md.dataset.managedomain); return; }
    const brcRev=e.target.closest('[data-brc-revoke]');
    if(brcRev){ brc100RevokeGrant(brcRev.dataset.brcRevoke); return; }
    const cb=e.target.closest('[data-bulkchk]');
    if(cb){ bulkToggle(parseInt(cb.dataset.bulkchk,10)); return; }
    const br=e.target.closest('[data-bulkrow]');
    if(br){ bulkToggle(parseInt(br.dataset.bulkrow,10)); return; }
    const dt=e.target.closest('[data-detail]');
    if(dt){ showNameDetail(parseInt(dt.dataset.detail,10)); return; }
    const l=e.target.closest('[data-list]');
    if(l){ startListOrdinal(parseInt(l.dataset.list,10)); return; }
    const d1=e.target.closest('[data-delist]');
    if(d1){ startDelist(parseInt(d1.dataset.delist,10)); return; }
    const s=e.target.closest('[data-send]');
    if(s){ startSendOrdinal(parseInt(s.dataset.send,10)); return; }
    const h=e.target.closest('[data-open]'); if(!h) return;
    chrome.tabs.create({ url:h.dataset.open });
  });
}

