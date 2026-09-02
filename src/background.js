// ORDnet background service worker
// - Opens the viewer for .web3 navigation
// - Routes ORD/plug wallet requests: content script -> approval popup -> back

// v4.2 — BRC-100 provider routing (iOS v2.4.0–v2.6.0 parity).
// Fase 1 (informative, no keys, no money) is answered HERE; fase 2/3 need
// the unlocked key and route to the approval popup. Everything else fails
// EXPLICITLY with a standards-shaped WalletError (name WERR_*, code,
// message) that the shim turns into a promise REJECTION.
// V49.3 — one release identity: the version a dApp sees through getVersion()
// is the manifest version (== git tag == store version), not a frozen string.
var BRC100_VERSION = 'ordplug-' + (function(){ try { return chrome.runtime.getManifest().version; } catch (e) { return '0.0.0'; } })();
// V49.3 — the method registry is shared with the popup (single source).
try { importScripts('brc100-methods.js'); } catch (e) { /* tests load it themselves */ }
var BRC100_POPUP_METHODS = (typeof BRC100_METHODS !== 'undefined') ? BRC100_METHODS.popup : [];
function brcErr(name, code, message){ return { name: name, code: code, message: message }; }

/* V49.3 — real authentication state (isAuthenticated used to answer true
   unconditionally, even with no vault or a locked one). The wallet is
   authenticated when a vault exists AND an unlock session key is present AND
   that session has not passed the user's auto-lock window. Pure function,
   exported for tests. */
var ORDPLUG_AUTH = {
  isAuthenticated: function (local, session, now) {
    local = local || {}; session = session || {};
    if (!local.ordplug_vault_v11) return false;
    var s = session.ordplug_session_v11;
    if (!s || !s.k) return false;
    var mins = (local.ordplug_autolock_min === undefined || local.ordplug_autolock_min === null) ? 15 : (local.ordplug_autolock_min | 0);
    if (mins > 0 && (now - (s.t || 0)) > mins * 60000) return false;
    return true;
  },
  WAIT_MS: 5 * 60 * 1000
};
if (typeof globalThis !== 'undefined') globalThis.OrdplugAuth = ORDPLUG_AUTH;
function readAuthState(cb){
  chrome.storage.local.get(['ordplug_vault_v11','ordplug_autolock_min'], function(local){
    chrome.storage.session.get(['ordplug_session_v11'], function(session){
      cb(ORDPLUG_AUTH.isAuthenticated(local, session, Date.now()));
    });
  });
}

function handleBrc100Direct(method, argsJson, sendResponse){
  if (method === 'getVersion') { sendResponse({ handled:true, ok:true, result:{ version: BRC100_VERSION } }); return true; }
  if (method === 'getNetwork') { sendResponse({ handled:true, ok:true, result:{ network: 'mainnet' } }); return true; }
  if (method === 'isAuthenticated') {
    readAuthState(function(a){ sendResponse({ handled:true, ok:true, result:{ authenticated: a } }); });
    return true; // async sendResponse
  }
  if (method === 'waitForAuthentication') {
    // Already unlocked: answer now. Otherwise open the wallet (its unlock
    // screen) once and resolve as soon as the session key appears; give up
    // with an explicit error after WAIT_MS so no promise hangs forever.
    readAuthState(function(a){
      if (a) { sendResponse({ handled:true, ok:true, result:{ authenticated: true } }); return; }
      var done = false;
      function finish(ok){
        if (done) return; done = true;
        try { chrome.storage.onChanged.removeListener(onChange); } catch (_) {}
        clearTimeout(timer);
        if (ok) sendResponse({ handled:true, ok:true, result:{ authenticated: true } });
        else sendResponse({ handled:true, ok:false, error: brcErr('WERR_NOT_AUTHENTICATED', 5, 'The wallet was not unlocked within 5 minutes.') });
      }
      function onChange(changes, area){
        if (area !== 'session' || !changes.ordplug_session_v11) return;
        readAuthState(function(now){ if (now) finish(true); });
      }
      var timer = setTimeout(function(){ finish(false); }, ORDPLUG_AUTH.WAIT_MS);
      chrome.storage.onChanged.addListener(onChange);
      openWalletWindow();
    });
    return true; // async sendResponse
  }
  if (method === 'getHeight') {
    fetch('https://api.whatsonchain.com/v1/bsv/main/chain/info')
      .then(function(r){ return r.json(); })
      .then(function(j){
        if (j && typeof j.blocks === 'number') sendResponse({ handled:true, ok:true, result:{ height: j.blocks } });
        else sendResponse({ handled:true, ok:false, error: brcErr('WERR_UNKNOWN', 1, 'Could not read the chain height right now.') });
      })
      .catch(function(e){ sendResponse({ handled:true, ok:false, error: brcErr('WERR_UNKNOWN', 1, 'Could not read the chain height right now: ' + (e && e.message || e)) }); });
    return true; // async sendResponse
  }
  if (method === 'getHeaderForHeight') {
    // v4.3 — keyless SPV read: fetch the 80-byte block header for a height.
    // Some SPV/BRC-100 apps probe this; answering it directly (no popup, no
    // keys) improves compatibility. Height is validated before it hits the URL.
    var h = null;
    try { var a = JSON.parse(argsJson || '{}'); h = a && a.height; } catch (_) {}
    if (typeof h !== 'number' || !isFinite(h) || h < 0 || Math.floor(h) !== h) {
      sendResponse({ handled:true, ok:false, error: brcErr('WERR_INVALID_PARAMETER', 3,
        'getHeaderForHeight: height must be a non-negative integer.') });
      return true;
    }
    fetch('https://api.whatsonchain.com/v1/bsv/main/block/height/' + h)
      .then(function(r){ if(!r.ok) throw new Error('height not found ('+r.status+')'); return r.json(); })
      .then(function(j){
        // WhatsOnChain returns the parsed header fields; expose the raw header when present.
        var header = (j && (j.header || j.rawHeader)) || null;
        sendResponse({ handled:true, ok:true, result:{ header: header, height: h, hash: (j && j.hash) || null } });
      })
      .catch(function(e){ sendResponse({ handled:true, ok:false, error: brcErr('WERR_UNKNOWN', 1,
        'Could not read the block header right now: ' + (e && e.message || e)) }); });
    return true; // async sendResponse
  }
  // signAction is popup-routed (v43.5): the popup runs a keyless Phase A
  // review (verify + reconstruct) and returns that. Actual signing (Phase B)
  // stays disabled behind a security review — see SIGNACTION-SCOPE.md.
  if (method === 'abortAction') {
    // V44 — abortAction is real: signAction (Phase B) registers each signed,
    // not-broadcast action in session storage under its reference; aborting
    // removes it. Unknown references still get the explicit refusal.
    var ref = null;
    try { var aa = JSON.parse(argsJson || '{}'); ref = aa && aa.reference; } catch (_) {}
    chrome.storage.session.get('ordplug_signaction_pending', function (v) {
      var store = (v && v.ordplug_signaction_pending) || {};
      if (typeof ref === 'string' && ref && Object.prototype.hasOwnProperty.call(store, ref)) {
        delete store[ref];
        chrome.storage.session.set({ ordplug_signaction_pending: store }, function () {
          sendResponse({ handled:true, ok:true, result:{ aborted:true, reference: ref } });
        });
      } else {
        sendResponse({ handled:true, ok:false, error: brcErr('WERR_INVALID_PARAMETER', 3,
          'abortAction: no abortable action exists for this reference.') });
      }
    });
    return true; // async sendResponse
  }
  if (method === 'revealCounterpartyKeyLinkage' || method === 'revealSpecificKeyLinkage') {
    sendResponse({ handled:true, ok:false, error: brcErr('WERR_UNSUPPORTED_ACTION', 2,
      method + ' is privacy-sensitive and not supported by the ORDnet wallet.') });
    return true;
  }
  if (BRC100_POPUP_METHODS.indexOf(method) === -1) {
    sendResponse({ handled:true, ok:false, error: brcErr('WERR_UNSUPPORTED_ACTION', 2,
      method + ' is not supported by the ORDnet wallet. ' + ((typeof BRC100_METHODS !== 'undefined') ? BRC100_METHODS.supportedText : '')) });
    return true;
  }
  return false; // popup-routed
}

/* V49.3 — ONE wallet window at a time. Both request families (ordplug_request
   and brc100_request) go through this: if the wallet window is already open
   it is focused, never duplicated. When the window closes with a request
   still pending (the user closed it without answering), the request is
   answered with an explicit rejection so the page's promise settles. */
var WALLET_WINDOW_KEY = 'ordplug_wallet_window';
function openWalletWindow(){
  chrome.storage.session.get([WALLET_WINDOW_KEY], function(st){
    var id = st && st[WALLET_WINDOW_KEY];
    if (typeof id === 'number') {
      chrome.windows.update(id, { focused: true }, function(){
        if (chrome.runtime.lastError) createWalletWindow(); // gone — open a fresh one
      });
      return;
    }
    createWalletWindow();
  });
}
function createWalletWindow(){
  chrome.windows.create({
    url: chrome.runtime.getURL('src/wallet.html'),
    type: 'popup', width: 400, height: 640, focused: true
  }, function(w){
    if (w && typeof w.id === 'number') { var o = {}; o[WALLET_WINDOW_KEY] = w.id; chrome.storage.session.set(o); }
  });
}
if (chrome.windows && chrome.windows.onRemoved) {
  chrome.windows.onRemoved.addListener(function(windowId){
    chrome.storage.session.get([WALLET_WINDOW_KEY, 'ordplug_pending', 'ordplug_pending_brc100', 'ordplug_cooldowns'], function(st){
      if (st[WALLET_WINDOW_KEY] !== windowId) return;
      var clear = {};
      var p = st.ordplug_pending;
      if (p && p.tabId != null) chrome.tabs.sendMessage(p.tabId, { type:'ordplug_response', id:p.id, ok:false, error:'The wallet window was closed before the request was answered.' });
      var b = st.ordplug_pending_brc100;
      if (b && b.tabId != null) chrome.tabs.sendMessage(b.tabId, { type:'brc100_response', id:b.id, ok:false, error: brcErr('WERR_USER_DECLINED', 4, 'The wallet window was closed before the request was answered.') });
      var cd = st.ordplug_cooldowns || {};
      if (p) cd = ORDPLUG_GATE.afterResolve(cd, p.origin, false, Date.now());
      if (b) cd = ORDPLUG_GATE.afterResolve(cd, b.origin, false, Date.now());
      chrome.storage.session.remove([WALLET_WINDOW_KEY, 'ordplug_pending', 'ordplug_pending_brc100'], function(){
        chrome.storage.session.set({ ordplug_cooldowns: cd });
      });
    });
  });
}

/* V47.1 — request gate for the all-sites provider (anti popup-spam):
   one outstanding request globally (stale after 5 min, so a closed-without-
   answer popup never wedges the wallet), and a short per-origin cooldown
   after a rejection. Pure decision function, exported for tests. */
var ORDPLUG_GATE = {
  COOLDOWN_MS: 15000,
  STALE_MS: 5 * 60 * 1000,
  decide: function (state, origin, now) {
    state = state || {};
    var cooldowns = state.cooldowns || {};
    var until = cooldowns[origin] || 0;
    if (now < until) {
      return { allow: false, error: 'ORD/plug: this site was just declined — new requests are paused for a few seconds.' };
    }
    // V49.3 — one slot for BOTH request families (ordplug + BRC-100)
    var p = state.pending || state.pendingBrc100;
    if (p && (now - (p.at || 0)) < ORDPLUG_GATE.STALE_MS) {
      if (p.origin === origin) return { allow: false, error: 'ORD/plug: this site already has a request awaiting review in the wallet.' };
      return { allow: false, error: 'ORD/plug: another request is being reviewed in the wallet. Try again shortly.' };
    }
    return { allow: true };
  },
  afterResolve: function (cooldowns, origin, ok, now) {
    cooldowns = cooldowns || {};
    if (!ok && origin) cooldowns[origin] = now + ORDPLUG_GATE.COOLDOWN_MS;
    else if (origin) delete cooldowns[origin];
    return cooldowns;
  }
};
if (typeof globalThis !== 'undefined') globalThis.OrdplugGate = ORDPLUG_GATE;

/* The requesting origin, as the browser sees it. Never trust a page-supplied
   value: sender.origin is populated by Chrome from the real frame. Falls back
   to the tab URL for older runtimes, and to '' when neither is available —
   callers must treat '' as "unknown" and refuse. */
function senderOrigin(sender){
  try {
    if (sender && sender.origin) return sender.origin;
    if (sender && sender.url) return new URL(sender.url).origin;
    if (sender && sender.tab && sender.tab.url) return new URL(sender.tab.url).origin;
  } catch (e) {}
  return '';
}

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){
  if (msg && msg.type === 'brc100_request') {
    // Refuse outright when the browser cannot tell us who is asking: an empty
    // origin would collapse every site into one grant bucket.
    if (!senderOrigin(sender)) {
      sendResponse({ ok: false, error: 'Could not determine the requesting origin' });
      return false;
    }
    if (handleBrc100Direct(msg.method, msg.args, sendResponse)) return true;
    // fase 2/3: the unlocked key lives in the popup — store & open it
    var pending = {
      id: msg.id,
      method: msg.method,
      args: msg.args || '{}',
      at: Date.now(),
      // H4 — the origin comes from the BROWSER, never from the page.
      //
      // This used to prefer msg.originator, which the page supplies. A site
      // could pass originator:"https://trusted.dapp" and (a) have the approval
      // screen show that name while evil.com was asking, (b) inherit grants
      // keyed on `${_address}|${origin}|…`, and (c) inherit that dApp's budget —
      // and brc100-budget.decide() auto-approves within an existing budget, so
      // that was payments up to the daily ceiling with no confirmation at all.
      //
      // sender.origin is set by Chrome from the actual frame and cannot be
      // spoofed by page script. Android and iOS fixed this in August; the
      // extension is now aligned with them.
      origin: senderOrigin(sender),
      tabId: sender.tab ? sender.tab.id : null
    };
    // V49.3 — the BRC-100 path used to skip the request gate entirely: every
    // call overwrote the single pending slot and opened a new window. Now it
    // goes through the same gate as ordplug_request, with the same cooldown.
    chrome.storage.session.get(['ordplug_pending','ordplug_pending_brc100','ordplug_cooldowns'], function(st){
      var verdict = ORDPLUG_GATE.decide({ pending: st.ordplug_pending, pendingBrc100: st.ordplug_pending_brc100, cooldowns: st.ordplug_cooldowns }, pending.origin, Date.now());
      if (!verdict.allow) {
        sendResponse({ handled:true, ok:false, error: brcErr('WERR_REVIEW_PENDING', 6, verdict.error) });
        return;
      }
      chrome.storage.session.set({ ordplug_pending_brc100: pending }, function(){
        openWalletWindow();
        sendResponse({ handled: false });
      });
    });
    return true;
  }

  if (msg && msg.type === 'brc100_resolve') {
    // V49.3 — same cooldown bookkeeping as ordplug_resolve
    chrome.storage.session.get(['ordplug_cooldowns'], function(st){
      var cd = ORDPLUG_GATE.afterResolve(st.ordplug_cooldowns, msg.origin, !!msg.ok, Date.now());
      chrome.storage.session.set({ ordplug_cooldowns: cd });
    });
    if (msg.tabId != null) {
      chrome.tabs.sendMessage(msg.tabId, {
        type: 'brc100_response',
        id: msg.id, ok: msg.ok, result: msg.result, error: msg.error
      });
    }
    return;
  }

  if (msg && msg.type === 'open_viewer') {
    var viewerUrl = chrome.runtime.getURL('src/viewer.html?q=' + encodeURIComponent(msg.input));
    chrome.tabs.create({ url: viewerUrl });
    return;
  }

  // A web page (via content.js) asks the wallet something.
  if (msg && msg.type === 'ordplug_request') {
    var pending = {
      id: msg.id,
      method: msg.method,
      params: msg.params || {},
      origin: msg.origin,
      at: Date.now(),
      tabId: sender.tab ? sender.tab.id : null
    };
    chrome.storage.session.get(['ordplug_pending','ordplug_pending_brc100','ordplug_cooldowns'], function(st){
      var verdict = ORDPLUG_GATE.decide({ pending: st.ordplug_pending, pendingBrc100: st.ordplug_pending_brc100, cooldowns: st.ordplug_cooldowns }, msg.origin, Date.now());
      if (!verdict.allow) {
        if (sender.tab) chrome.tabs.sendMessage(sender.tab.id, { type:'ordplug_response', id: msg.id, ok:false, error: verdict.error });
        return;
      }
      chrome.storage.session.set({ ordplug_pending: pending }, function(){ openWalletWindow(); });
    });
    return true;
  }

  // The wallet popup resolved (approve/reject) — relay to the requesting tab.
  if (msg && msg.type === 'ordplug_resolve') {
    // V47.1 — rejection starts the origin cooldown; approval clears it.
    chrome.storage.session.get(['ordplug_cooldowns'], function(st){
      var cd = ORDPLUG_GATE.afterResolve(st.ordplug_cooldowns, msg.origin, !!msg.ok, Date.now());
      chrome.storage.session.set({ ordplug_cooldowns: cd });
    });
    if (msg.tabId != null) {
      chrome.tabs.sendMessage(msg.tabId, {
        type: 'ordplug_response',
        id: msg.id,
        ok: msg.ok,
        result: msg.result,
        error: msg.error
      });
    }
    return;
  }
});
