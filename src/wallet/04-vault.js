/* ---------- V11 encrypted vault (WebCrypto: PBKDF2-SHA256 -> AES-256-GCM) ----------
   chrome.storage.local : encrypted vault only (salt, iv, ciphertext) — never plaintext keys.
   chrome.storage.session: derived key bits while unlocked (memory-only, wiped when the
   browser closes or on lock/auto-lock). */
const VAULT_KEY    = 'ordplug_vault_v11';
const SESSION_KEY  = 'ordplug_session_v11';
const AUTOLOCK_KEY = 'ordplug_autolock_min';
const ADDRBOOK_KEY = 'ordplug_addressbook';
const KDF_ITERS    = 600000; // OWASP PBKDF2-SHA256 floor (2023). Old vaults keep
                             // their own iters (stored per-vault) so unlock stays
                             // backward-compatible; only new/re-encrypted vaults use this.

function storageGet(key){ return new Promise(res=>chrome.storage.local.get([key], r=>res(r[key]))); }
function storageSet(obj){ return new Promise(res=>chrome.storage.local.set(obj, res)); }
function storageRemove(key){ return new Promise(res=>chrome.storage.local.remove(key, res)); }
function sessionGetKey(){ return new Promise(res=>chrome.storage.session.get([SESSION_KEY], r=>res(r[SESSION_KEY]))); }
function sessionSetKey(v){ return new Promise(res=>chrome.storage.session.set({ [SESSION_KEY]:v }, res)); }
function sessionClearKey(){ return new Promise(res=>chrome.storage.session.remove(SESSION_KEY, res)); }

function b64enc(buf){ let s=''; const b=new Uint8Array(buf); for(let i=0;i<b.length;i++) s+=String.fromCharCode(b[i]); return btoa(s); }
function b64dec(str){ const s=atob(str); const b=new Uint8Array(s.length); for(let i=0;i<s.length;i++) b[i]=s.charCodeAt(i); return b; }

async function kdfBits(password, salt, iters){
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name:'PBKDF2', salt, iterations:iters, hash:'SHA-256' }, km, 256);
}
function aesKeyFromBits(bits){ return crypto.subtle.importKey('raw', bits, 'AES-GCM', false, ['encrypt','decrypt']); }
async function encryptPayload(key, obj){
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  return { iv:b64enc(iv), ct:b64enc(ct) };
}
async function decryptPayload(key, cipher){
  const pt = await crypto.subtle.decrypt({ name:'AES-GCM', iv:b64dec(cipher.iv) }, key, b64dec(cipher.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}
async function getAutolockMin(){ const v=await storageGet(AUTOLOCK_KEY); return (v===undefined||v===null)?15:(v|0); }

async function createVault(password, payload){
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await kdfBits(password, salt, KDF_ITERS);
  const key  = await aesKeyFromBits(bits);
  const cipher = await encryptPayload(key, payload);
  await storageSet({ [VAULT_KEY]: { v:11, kdf:{ salt:b64enc(salt), iters:KDF_ITERS, hash:'SHA-256' }, cipher } });
  _aesKey = key;
  await sessionSetKey({ k:b64enc(bits), t:Date.now() });
}
async function unlockWithPassword(password){
  const vault = await storageGet(VAULT_KEY);
  if(!vault) throw new Error('No wallet on this device yet.');
  const bits = await kdfBits(password, b64dec(vault.kdf.salt), vault.kdf.iters);
  const key  = await aesKeyFromBits(bits);
  let payload;
  try{ payload = await decryptPayload(key, vault.cipher); }
  catch(e){ throw new Error('Wrong password.'); }
  _aesKey = key;
  await sessionSetKey({ k:b64enc(bits), t:Date.now() });
  // v4.3 — silent KDF upgrade: if this vault was created with fewer iterations
  // than the current floor, transparently re-encrypt it with a fresh salt at
  // KDF_ITERS while we hold the plaintext password. Non-fatal on failure —
  // the wallet still unlocks; we simply retry the upgrade next time.
  if ((vault.kdf.iters|0) < KDF_ITERS) {
    try {
      const newSalt = crypto.getRandomValues(new Uint8Array(16));
      const newBits = await kdfBits(password, newSalt, KDF_ITERS);
      const newKey  = await aesKeyFromBits(newBits);
      const cipher  = await encryptPayload(newKey, payload);
      await storageSet({ [VAULT_KEY]: { v:11, kdf:{ salt:b64enc(newSalt), iters:KDF_ITERS, hash:'SHA-256' }, cipher } });
      _aesKey = newKey;
      await sessionSetKey({ k:b64enc(newBits), t:Date.now() });
    } catch(_){ /* keep the working session key; upgrade retried on next unlock */ }
  }
  return payload;
}
async function unlockFromSession(){
  const sess = await sessionGetKey();
  if(!sess || !sess.k) return null;
  const mins = await getAutolockMin();
  if(mins>0 && (Date.now()-(sess.t||0)) > mins*60000){ await sessionClearKey(); return null; }
  try{
    const vault = await storageGet(VAULT_KEY); if(!vault) return null;
    const key = await aesKeyFromBits(b64dec(sess.k));
    const payload = await decryptPayload(key, vault.cipher);
    _aesKey = key;
    await sessionSetKey({ k:sess.k, t:Date.now() });
    return payload;
  }catch(e){ await sessionClearKey(); return null; }
}

function payloadFromState(){
  return { accounts:_accounts.map(a=>({ name:a.name, wif:a.wif, origin:a.origin||'wif', path:a.path||null })), active:_active };
}
function applyPayload(p){
  _accounts = (p.accounts||[]).map(a=>({ name:a.name, wif:a.wif, origin:a.origin||'wif', path:a.path||null, address:wifToAddress(a.wif) }));
  _active = Math.min(p.active||0, Math.max(0, _accounts.length-1));
  if(_accounts.length) setActive(_active);
}
async function saveAccounts(){
  if(!_aesKey) throw new Error('Wallet is locked.');
  const vault = await storageGet(VAULT_KEY);
  if(!vault) throw new Error('Vault missing — remove and restore the wallet.');
  vault.cipher = await encryptPayload(_aesKey, payloadFromState());
  await storageSet({ [VAULT_KEY]: vault });
  sessionGetKey().then(s=>{ if(s&&s.k) sessionSetKey({ k:s.k, t:Date.now() }); });
}
function setActive(i){ _active=i; const a=_accounts[i]; _wif=a.wif; _address=a.address; }
async function lockWallet(){
  _aesKey=null; _accounts=[]; _wif=null; _address=null;
  try{ brc100ResetWallet(); }catch(_){}   // v4.2: wipe BRC-100 key material
  await sessionClearKey();
  showUnlock();
}
/* V49.3 — "Remove wallet" is a WIPE, not a vault delete.
   Until 4.9.2 it removed three keys (vault, legacy accounts, session key) and
   left everything else behind: BRC-100 grants, budgets and action history,
   relinquished outputs, certificates with their personal fields, the address
   book, inscription history, chain tips / spent guard, per-address domain
   caches, pending requests and cooldowns, and the viewer's Cache Storage.
   Restore the same phrase later and all of it silently re-attached itself.

   ALL_WALLET_STORAGE_KEYS is the canonical list (tests/v49-wipe-tests.mjs
   fails if a storage key literal exists in src/ that is not covered here).
   On top of the list, EVERY key that starts with one of WALLET_KEY_PREFIXES
   in chrome.storage.local is removed, chrome.storage.session is cleared
   entirely, and every Cache Storage bucket is deleted. */
const WALLET_KEY_PREFIXES = ['ordplug_', 'ordnet_', 'web3domains:'];
const ALL_WALLET_STORAGE_KEYS = [
  'ordplug_vault_v11', 'ordplug_accounts', 'ordplug_autolock_min', 'ordplug_addressbook',
  'ordplug_chain_tips_v1', 'ordplug_spent_guard_v1',
  'ordplug_brc100_grants_v1', 'ordplug_brc100_actions_v1', 'ordplug_brc100_relinquished_v1',
  'ordplug_brc100_budgets', 'ordplug_certs', 'ordplug_sns_pinned_pubkey',
  'ordnet_inscriptions_v1',
  // session-scoped (cleared wholesale, listed so the coverage test is honest)
  'ordplug_session_v11', 'ordplug_connected', 'ordplug_pending', 'ordplug_pending_brc100',
  'ordplug_cooldowns', 'ordplug_signaction_pending', 'ordplug_wallet_window'
];
function isWalletStorageKey(k){ return WALLET_KEY_PREFIXES.some(p=>String(k).startsWith(p)); }
async function wipeAllWalletData(){
  // 1) local storage: the list + everything under the prefixes (per-address keys)
  const all = await new Promise(res=>chrome.storage.local.get(null, r=>res(r||{})));
  const keys = new Set(ALL_WALLET_STORAGE_KEYS);
  Object.keys(all).forEach(k=>{ if(isWalletStorageKey(k)) keys.add(k); });
  await new Promise(res=>chrome.storage.local.remove([...keys], res));
  // 2) session storage: everything (unlock key, pending requests, cooldowns, connected sites)
  await new Promise(res=>{ try{ chrome.storage.session.clear(res); }catch(e){ res(); } });
  // 3) Cache Storage: the viewer's resolved-name cache and anything else
  try{ const names=await caches.keys(); await Promise.all(names.map(n=>caches.delete(n))); }catch(e){}
}
async function removeWalletNow(){
  if(_pending) resolvePending(false, null, 'Wallet was removed');
  if(typeof _pendingBrc100!=='undefined' && _pendingBrc100 && typeof resolveBrc100==='function'){
    try{ resolveBrc100(false, null, { name:'WERR_USER_DECLINED', code:4, message:'Wallet was removed' }); }catch(e){}
  }
  await wipeAllWalletData();
  try{ brc100ResetWallet(); }catch(_){}   // BRC-100 key material
  _aesKey=null; _accounts=[]; _wif=null; _address=null; _active=0;
  _sessionPhrases={};
  try{ _chainTips={}; _spentGuard={}; }catch(e){}
  try{ _brc100Grants=[]; _brc100Actions={}; _brc100Relinquished={}; }catch(e){}
  showSetup();
}

