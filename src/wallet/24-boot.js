/* ---------- boot ---------- */
(async function boot(){
  try{ if(matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.setAttribute('data-theme','dark'); }catch(e){}
  wireEvents();
  // pick up a pending page request, if any
  const pend=await new Promise(r=>chrome.storage.session.get(['ordplug_pending'],x=>r(x.ordplug_pending)));
  if(pend) _pending=pend;
  // v4.2 — a pending BRC-100 request (stored by the background worker)
  const pendBrc=await new Promise(r=>chrome.storage.session.get(['ordplug_pending_brc100'],x=>r(x.ordplug_pending_brc100)));
  if(pendBrc) _pendingBrc100=pendBrc;
  const vault=await storageGet(VAULT_KEY);
  const legacy=await storageGet(ACCTS_KEY);
  if(!vault && legacy && legacy.accounts && legacy.accounts.length){ showMigrate(legacy); return; }
  if(!vault){ showSetup(); return; }
  const payload=await unlockFromSession();
  if(payload){ applyPayload(payload); await afterReady(); }
  else showUnlock(_pending ? ('Unlock to review the request from '+(_pending.origin||'a page')) : undefined);
})();
