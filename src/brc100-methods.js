/* =========================================================================
   V49.3 — the ONE list of BRC-100 methods and where each one is answered.

   Loaded by the background service worker (importScripts) and by the popup
   (wallet.html). The page-world shim (brc100-inpage.js) cannot import this
   file, so it carries its own copy of `all` — tests/v49-registry-tests.mjs
   fails the build if the two ever drift apart, and the README's support
   table is checked against it too.

   direct  — answered in background.js, no keys, no popup
   popup   — needs the unlocked key: routed to the approval popup
   refused — deliberately unsupported; rejected with WERR_UNSUPPORTED_ACTION
   ========================================================================= */
var BRC100_METHODS = {
  direct: [
    'getVersion', 'getNetwork', 'getHeight', 'getHeaderForHeight',
    'isAuthenticated', 'waitForAuthentication',
    'abortAction'
  ],
  popup: [
    'getPublicKey', 'encrypt', 'decrypt', 'createSignature', 'verifySignature',
    'createHmac', 'verifyHmac',                                    // fase 2
    'createAction', 'internalizeAction', 'listActions', 'listOutputs',
    'relinquishOutput',                                           // fase 3
    'signAction',                                                 // Phase A review (no signing)
    'acquireCertificate', 'listCertificates', 'proveCertificate',
    'relinquishCertificate',                                      // certificates (V46)
    'payX402'                                                     // ORDnet extension (V46)
  ],
  refused: [
    'revealCounterpartyKeyLinkage', 'revealSpecificKeyLinkage',   // privacy-sensitive
    'discoverByIdentityKey', 'discoverByAttributes'               // no overlay discovery
  ]
};
BRC100_METHODS.all = BRC100_METHODS.direct.concat(BRC100_METHODS.popup, BRC100_METHODS.refused);
BRC100_METHODS.supportedText = 'Supported today: fase 1 (' + BRC100_METHODS.direct.join(', ') + '), popup-routed (' + BRC100_METHODS.popup.join(', ') + ').';
if (typeof globalThis !== 'undefined') globalThis.BRC100_METHODS = BRC100_METHODS;
