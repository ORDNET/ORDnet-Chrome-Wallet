/* =========================================================================
   ORD/plug Wallet V11 — Chrome extension edition
   Popup-first wallet. Keys live ONLY in this extension on this device and
   are AES-256-GCM encrypted with a password-derived key (PBKDF2-SHA256).
   Import: BIP44 phrase (m/44'/236'/0'/0/0) · legacy V9 phrase · WIF.
   Approval requests arrive from web pages via
   inpage.js -> content.js -> background.js -> this page.
   ========================================================================= */

