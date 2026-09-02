/* =========================================================================
   ORDplug BRC-100 provider-shim (V42) — runs INSIDE the web page.
   1-to-1 port of the iOS app's brc100-shim.js (v2.4): deliberately key-free.
   This shim only relays calls over window.postMessage to the extension's
   content script; all key material and all crypto live in the extension
   popup. window.CWI is the FIRST substrate @bsv/sdk's WalletClient('auto')
   probes, so any BRC-100 app detects this wallet by calling getVersion({}).

   Error contract (BRC-100 / @bsv/sdk WindowCWISubstrate): methods RETURN a
   promise that REJECTS with an Error carrying name (WERR_*), message, code
   and isError=true. Never a resolved {status:'error'} object — an app must
   never mistake a refusal for success.
   ========================================================================= */
(function () {
  'use strict';
  if (window.CWI) return;                       // never clobber another wallet

  var pending = {};
  var nextId = 1;

  /* V49.3 — no promise may hang forever: if the extension never answers
     (wallet window closed, worker restarted, bridge gone) the call rejects
     after REQUEST_TIMEOUT_MS with a standards-shaped error, exactly like the
     ordplug provider has done since V11. */
  var REQUEST_TIMEOUT_MS = 5 * 60 * 1000;
  function callWallet(method, args, originator) {
    return new Promise(function (resolve, reject) {
      var id = 'cwi' + (nextId++) + '_' + Date.now();
      var timer = setTimeout(function () {
        if (!pending[id]) return;
        delete pending[id];
        var err = new Error(method + ': the wallet did not answer within 5 minutes.');
        err.name = 'WERR_TIMEOUT'; err.code = 7; err.isError = true;
        reject(err);
      }, REQUEST_TIMEOUT_MS);
      pending[id] = { resolve: resolve, reject: reject, timer: timer };
      try {
        window.postMessage({
          __ordplugCWI: 1, dir: 'page2cs',
          id: id,
          method: method,
          args: JSON.stringify(args === undefined ? {} : args),
          // Kept for API compatibility with callers that pass it, but the
          // extension ignores it: the origin is taken from sender.origin in
          // background.js. Sending it is informational only.
          originator: String(originator || window.location.origin || '')
        }, '*');
      } catch (e) {
        delete pending[id]; clearTimeout(timer);
        var err = new Error('The wallet bridge is unavailable.');
        err.name = 'WERR_UNKNOWN'; err.code = 1; err.isError = true;
        reject(err);
      }
    });
  }

  /* the extension answers via this — ok:true resolves with the result object,
     ok:false REJECTS with a standards-shaped WalletError */
  window.addEventListener('message', function (e) {
    if (e.source !== window) return;
    var d = e.data;
    if (!d || d.__ordplugCWI !== 1 || d.dir !== 'cs2page') return;
    var p = pending[d.id];
    if (!p) return;
    delete pending[d.id];
    clearTimeout(p.timer);
    if (d.ok) {
      p.resolve(d.result);
    } else {
      var info = d.error || {};
      var err = new Error(info.message || 'Unknown wallet error.');
      err.name = info.name || 'WERR_UNKNOWN';
      err.code = typeof info.code === 'number' ? info.code : 1;
      err.isError = true;
      p.reject(err);
    }
  });

  /* the full 28-method BRC-100 surface (source: @bsv/sdk WindowCWISubstrate).
     Every method exists; the extension decides support level and rejects
     unimplemented ones explicitly. */
  var METHODS = [
    'createAction', 'signAction', 'abortAction', 'listActions',
    'internalizeAction', 'listOutputs', 'relinquishOutput',
    'getPublicKey', 'revealCounterpartyKeyLinkage', 'revealSpecificKeyLinkage',
    'encrypt', 'decrypt', 'createHmac', 'verifyHmac',
    'createSignature', 'verifySignature',
    'acquireCertificate', 'listCertificates', 'proveCertificate',
    'relinquishCertificate', 'discoverByIdentityKey', 'discoverByAttributes',
    'isAuthenticated', 'waitForAuthentication',
    'getHeight', 'getHeaderForHeight', 'getNetwork', 'getVersion',
    'payX402' // ORDnet extension: x402 pay-per-request (V46)
  ];

  var CWI = {};
  METHODS.forEach(function (m) {
    CWI[m] = function (args, originator) { return callWallet(m, args, originator); };
  });
  window.CWI = CWI;
})();
