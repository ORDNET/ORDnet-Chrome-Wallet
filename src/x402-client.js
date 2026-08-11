/* =========================================================================
   ORD/plug — x402 CLIENT engine (V46). Pure, testable. Speaks exactly the
   protocol of the ORDnet x402 facilitator (x402 V2, scheme "exact",
   network "bsv"): a resource server answers HTTP 402 with a PaymentRequired
   JSON ({ x402Version:2, accepts:[requirements] }); the client pays the
   invoice's payTo address with a SIGNED-BUT-NOT-BROADCAST rawTx and retries
   with an X-PAYMENT header; the server settles (broadcasts) via the
   facilitator and answers with X-PAYMENT-RESPONSE.

   Safety rails (deliberate):
   - hard per-payment cap (MAX_SATS) independent of any budget;
   - integer satoshis only, address sanity-checked, invoiceId required;
   - the engine never touches keys or broadcasts — it parses, validates and
     shapes; wallet.js builds the tx with the normal wallet builder and the
     normal budget/confirm pipeline.
   ========================================================================= */
(function (root) {
  'use strict';
  var X402_VERSION = 2, SCHEME = 'exact', NETWORK = 'bsv';
  var MAX_SATS = 100000; // hard cap per x402 payment in V46 (~$0.70 at $70/BSV)

  function werr(name, code, message) { var e = new Error(message); e.name = name; e.code = code; e.isError = true; return e; }
  function b64ToJson(b64) {
    try {
      var bin = (typeof atob === 'function') ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
      var bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (e) { return null; }
  }
  function jsonToB64(obj) {
    var s = JSON.stringify(obj);
    if (typeof btoa === 'function') {
      var bytes = new TextEncoder().encode(s), bin = '';
      for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return btoa(bin);
    }
    return Buffer.from(s, 'utf8').toString('base64');
  }

  /* Accepts the 402 JSON body (object or JSON string) or the Base64
     PAYMENT-REQUIRED header value. Returns a validated, normalized invoice. */
  function parsePaymentRequired(input) {
    var body = input;
    if (typeof input === 'string') { body = null; try { body = JSON.parse(input); } catch (e) { body = b64ToJson(input); } }
    if (!body || typeof body !== 'object') throw werr('WERR_INVALID_PARAMETER', 3, 'x402: PaymentRequired payload is not valid JSON.');
    if (body.x402Version !== X402_VERSION) throw werr('WERR_INVALID_PARAMETER', 3, 'x402: unsupported version ' + body.x402Version + ' (this wallet speaks v' + X402_VERSION + ').');
    var reqs = Array.isArray(body.accepts) ? body.accepts : [];
    var r = null;
    for (var i = 0; i < reqs.length; i++) {
      if (reqs[i] && reqs[i].scheme === SCHEME && reqs[i].network === NETWORK) { r = reqs[i]; break; }
    }
    if (!r) throw werr('WERR_UNSUPPORTED_ACTION', 2, 'x402: no accepted payment option uses scheme "' + SCHEME + '" on network "' + NETWORK + '" — this wallet pays native BSV satoshis only.');
    var satsStr = String(r.maxAmountRequired == null ? '' : r.maxAmountRequired);
    if (!/^[0-9]{1,15}$/.test(satsStr)) throw werr('WERR_INVALID_PARAMETER', 3, 'x402: maxAmountRequired must be an integer satoshi string.');
    var sats = parseInt(satsStr, 10);
    if (!(sats >= 1)) throw werr('WERR_INVALID_PARAMETER', 3, 'x402: amount must be \u22651 satoshi.');
    if (sats > MAX_SATS) throw werr('WERR_INVALID_PARAMETER', 3, 'x402: amount ' + sats + ' sats exceeds this wallet\u2019s per-payment x402 cap of ' + MAX_SATS + ' sats.');
    var payTo = String(r.payTo || '');
    if (!/^[13mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(payTo)) throw werr('WERR_INVALID_PARAMETER', 3, 'x402: payTo is not a plausible BSV address.');
    var invoiceId = r.extra && r.extra.invoiceId ? String(r.extra.invoiceId) : '';
    if (!invoiceId || invoiceId.length > 120) throw werr('WERR_INVALID_PARAMETER', 3, 'x402: invoiceId missing from payment requirements — refusing an uncorrelatable payment.');
    return {
      satoshis: sats, payTo: payTo, invoiceId: invoiceId,
      resource: String(r.resource || ''), description: String(r.description || '').slice(0, 300),
      scheme: SCHEME, network: NETWORK
    };
  }

  /* The X-PAYMENT header the resource server forwards to the facilitator. */
  function buildXPaymentHeader(invoice, rawTxHex) {
    if (!invoice || !invoice.invoiceId) throw werr('WERR_INTERNAL', 1, 'x402: invoice required.');
    if (typeof rawTxHex !== 'string' || rawTxHex.length < 20 || /[^0-9a-fA-F]/.test(rawTxHex)) throw werr('WERR_INTERNAL', 1, 'x402: signed rawTx hex required.');
    return jsonToB64({ x402Version: X402_VERSION, scheme: SCHEME, network: NETWORK,
                       payload: { invoiceId: invoice.invoiceId, rawTx: rawTxHex } });
  }

  function parsePaymentResponseHeader(b64) { return b64 ? b64ToJson(b64) : null; }

  root.OrdplugX402 = { X402_VERSION: X402_VERSION, SCHEME: SCHEME, NETWORK: NETWORK, MAX_SATS: MAX_SATS,
    parsePaymentRequired: parsePaymentRequired, buildXPaymentHeader: buildXPaymentHeader,
    parsePaymentResponseHeader: parsePaymentResponseHeader, _b64ToJson: b64ToJson };
})(typeof globalThis !== 'undefined' ? globalThis : this);
