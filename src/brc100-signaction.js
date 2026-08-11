/* =========================================================================
   ORD/plug — BRC-100 signAction, PHASE A (verify + reconstruct, NO signing).
   V43.5 scaffolding toward the signableTransaction path (see SIGNACTION-SCOPE.md).

   This module is deliberately SIDE-EFFECT-FREE and KEY-FREE. It never signs,
   never broadcasts, never touches _wif. Its whole job is to take what a dApp
   hands to signAction and turn it into a verified, human-readable picture the
   user can approve — OR a precise WERR_* refusal. Signing (Phase B) is a
   separate step gated on a human security review.

   Exposed on globalThis so both wallet.js and the test harness can call it
   without a bundler. Pure functions take their dependencies as arguments so
   they can be unit-tested in Node against the bundled `bsv` lib.
   ========================================================================= */
(function (root) {
  'use strict';

  // ---- error shape: identical contract to the rest of the BRC-100 surface ----
  function werr(name, code, message) { var e = new Error(message); e.name = name; e.code = code; e.isError = true; return e; }

  // ---- small guards -------------------------------------------------------
  function isHex(s) { return typeof s === 'string' && s.length > 0 && s.length % 2 === 0 && !/[^0-9a-fA-F]/.test(s); }
  function isTxid(s) { return typeof s === 'string' && /^[0-9a-fA-F]{64}$/.test(s); }
  function isVout(n) { return typeof n === 'number' && isFinite(n) && n >= 0 && Math.floor(n) === n; }
  function asSats(n) { if (typeof n !== 'number' || !isFinite(n) || n < 0 || Math.floor(n) !== n) throw werr('WERR_INVALID_PARAMETER', 3, 'satoshis must be a non-negative integer'); return n; }

  /* Parse the reference/args the shim forwards for signAction. We accept the
     BRC-100 shape used by @bsv/sdk: { reference, spends, ... } where the
     signable transaction and its input source have already been produced by an
     earlier createAction(signAndProcess:false) — OR a caller-supplied
     { tx (hex), inputs:[{ txid, vout, satoshis, lockingScriptHex }] }. Phase A
     only READS these; it validates structure strictly and refuses anything
     ambiguous rather than guessing. */
  function parseSignableArgs(argsJson) {
    var a;
    try { a = JSON.parse(argsJson || '{}'); } catch (e) { throw werr('WERR_INVALID_PARAMETER', 3, 'signAction: args must be valid JSON.'); }
    if (!a || typeof a !== 'object') throw werr('WERR_INVALID_PARAMETER', 3, 'signAction: args object required.');

    // The transaction being signed, as raw hex. Required for Phase A analysis.
    var txHex = a.tx || a.txHex || (a.transaction && a.transaction.hex);
    if (!isHex(txHex)) throw werr('WERR_INVALID_PARAMETER', 3, 'signAction: a raw transaction hex (tx) is required for review.');

    // The inputs THIS wallet is being asked to sign. Each must carry enough to
    // verify the prevout independently (value + locking script). We refuse if a
    // dApp asks us to sign an input without telling us what we are spending.
    var inputs = a.inputs || a.spends || [];
    if (!Array.isArray(inputs) || inputs.length === 0) throw werr('WERR_INVALID_PARAMETER', 3, 'signAction: inputs[] to sign is required.');

    var norm = inputs.map(function (i, k) {
      if (!i || typeof i !== 'object') throw werr('WERR_INVALID_PARAMETER', 3, 'signAction: inputs[' + k + '] must be an object.');
      if (!isTxid(i.txid)) throw werr('WERR_INVALID_PARAMETER', 3, 'signAction: inputs[' + k + '].txid must be a 64-hex txid.');
      if (!isVout(i.vout)) throw werr('WERR_INVALID_PARAMETER', 3, 'signAction: inputs[' + k + '].vout must be a non-negative integer.');
      var lock = i.lockingScriptHex || i.scriptHex || i.script;
      if (!isHex(lock)) throw werr('WERR_INVALID_PARAMETER', 3, 'signAction: inputs[' + k + '] must include the prevout lockingScriptHex so it can be verified.');
      return { txid: i.txid.toLowerCase(), vout: i.vout, satoshis: asSats(i.satoshis), lockingScriptHex: lock.toLowerCase() };
    });

    // V44: capture any sighash the dApp requests (top-level or per-input) so
    // the Phase B policy gate can refuse non-standard flags EXPLICITLY instead
    // of silently ignoring the request. Absent = null = wallet default.
    var reqSighash = (a.sighashType != null ? a.sighashType : (a.sighash != null ? a.sighash : null));
    inputs.forEach(function (i) {
      if (i && (i.sighash != null || i.sigtype != null) && reqSighash == null) reqSighash = (i.sighash != null ? i.sighash : i.sigtype);
    });

    return { txHex: txHex.toLowerCase(), inputs: norm, reference: (typeof a.reference === 'string' ? a.reference : null), requestedSighash: reqSighash };
  }

  /* Decode the raw tx with the bundled bsv lib and pull out a structural view:
     inputs (outpoints) and outputs (value + script +, when P2PKH, address).
     Pure: `bsv` is injected so the test harness controls the lib instance. */
  function decodeTx(bsv, txHex) {
    var tx;
    try { tx = new bsv.Transaction(txHex); } catch (e) { throw werr('WERR_INVALID_PARAMETER', 3, 'signAction: tx hex did not parse as a Bitcoin transaction.'); }
    var ins = (tx.inputs || []).map(function (inp) {
      var po = inp.prevTxId ? inp.prevTxId.toString('hex') : (inp.prevoutHash || '');
      return { txid: String(po).toLowerCase(), vout: (typeof inp.outputIndex === 'number' ? inp.outputIndex : inp.prevoutIndex) };
    });
    var outs = (tx.outputs || []).map(function (o) {
      var scriptHex = o.script ? o.script.toHex() : '';
      var address = null;
      try { if (o.script && o.script.isPublicKeyHashOut()) address = o.script.toAddress().toString(); } catch (_) {}
      return { satoshis: o.satoshis, scriptHex: scriptHex, address: address, isOrdinalHint: (o.satoshis === 1) };
    });
    return { ins: ins, outs: outs, tx: tx };
  }

  /* Ordinal protection: the wallet must NEVER be tricked into signing away a
     1-sat ordinal outpoint as if it were payment. `protectedSet` is a Set of
     "txid:vout" strings the caller builds from the live ordinal-protected
     holdings. Any signable input that hits it is refused in Phase A — the user
     would have to move an ordinal through the explicit ordinal-transfer flow,
     never silently inside a dApp's signAction. */
  function assertNoProtectedInputs(inputs, protectedSet) {
    for (var i = 0; i < inputs.length; i++) {
      var key = inputs[i].txid + ':' + inputs[i].vout;
      if (protectedSet && protectedSet.has && protectedSet.has(key)) {
        throw werr('WERR_INVALID_PARAMETER', 3, 'signAction refused: input ' + key + ' is a protected 1-sat ordinal. Move ordinals through the wallet\u2019s own transfer flow, never inside a dApp signAction.');
      }
      // V44 belt-and-braces (fail-closed): every 1-sat outpoint is a candidate
      // ordinal/name/map. Refuse ANY 1-sat input here, independent of whether
      // the live protected-set could be built \u2014 so an index outage can never
      // silently disable ordinal protection.
      if (inputs[i].satoshis === 1) {
        throw werr('WERR_INVALID_PARAMETER', 3, 'signAction refused: input ' + key + ' is a 1-sat outpoint (candidate ordinal). 1-sat inputs are never signable inside a dApp signAction.');
      }
    }
  }

  /* Verify that every input the wallet is asked to sign is actually present in
     the transaction, that the prevout locking script we were given is P2PKH to
     THIS wallet's address (we only sign our own keys), and that nothing is
     asking us to sign an input we don't own. Returns the subset of decoded
     inputs matched to our signable set. */
  function matchOwnedInputs(bsv, decoded, signable, ourAddress) {
    var ourLockHex;
    try { ourLockHex = bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(ourAddress)).toHex().toLowerCase(); }
    catch (e) { throw werr('WERR_INTERNAL', 1, 'signAction: could not derive this wallet\u2019s locking script.'); }

    var byOutpoint = {};
    decoded.ins.forEach(function (di, idx) { byOutpoint[di.txid + ':' + di.vout] = idx; });

    return signable.map(function (s, k) {
      var op = s.txid + ':' + s.vout;
      if (!(op in byOutpoint)) throw werr('WERR_INVALID_PARAMETER', 3, 'signAction: input[' + k + '] ' + op + ' is not present in the transaction to sign.');
      // We only ever sign inputs that pay to OUR P2PKH. Anything else (custom
      // scripts, someone else's key) is refused — Phase A does not attempt it.
      if (s.lockingScriptHex !== ourLockHex) {
        throw werr('WERR_INVALID_PARAMETER', 3, 'signAction: input[' + k + '] does not pay this wallet\u2019s standard address; only own-key P2PKH inputs are signable.');
      }
      return { inputIndex: byOutpoint[op], txid: s.txid, vout: s.vout, satoshis: s.satoshis };
    });
  }

  /* Build the human-readable effect the user approves. This is the reality the
     wallet reconstructed itself — NOT the dApp's description of it.
       - spendingFromWallet: sats leaving via our signed inputs
       - outputsToWallet:    sats returning to our address
       - outputsElsewhere:   sats going to other addresses / scripts
       - net:                effect on this wallet (negative = we pay out)
     Miner fee is inferred as (sum our-signed-inputs additional context is not
     fully known without ALL inputs' values, so we report what we can verify and
     flag the rest as "not attributable to this wallet"). */
  function reconstructEffect(decoded, ownedMatched, ourAddress) {
    var spendingFromWallet = ownedMatched.reduce(function (a, m) { return a + m.satoshis; }, 0);
    var outputsToWallet = 0, outputsElsewhere = 0;
    var lines = decoded.outs.map(function (o) {
      var mine = (o.address && o.address === ourAddress);
      if (mine) outputsToWallet += o.satoshis; else outputsElsewhere += o.satoshis;
      return {
        satoshis: o.satoshis,
        dest: o.address || ('script:' + o.scriptHex.slice(0, 20) + '\u2026'),
        toThisWallet: !!mine,
        ordinalHint: o.isOrdinalHint
      };
    });
    return {
      spendingFromWallet: spendingFromWallet,
      outputsToWallet: outputsToWallet,
      outputsElsewhere: outputsElsewhere,
      // Net is only fully known if all non-wallet inputs' values are known.
      // Phase A verifies OUR inputs; it reports the wallet-side movement exactly
      // and marks the counterparty side as dApp-supplied (to be shown as such).
      netToWallet: outputsToWallet - spendingFromWallet,
      outputs: lines,
      signedInputCount: ownedMatched.length,
      totalInputCount: decoded.ins.length,
      counterpartyInputCount: decoded.ins.length - ownedMatched.length
    };
  }

  /* The Phase A entry point: everything above, composed. Returns a DRY-RUN
     review object. THROWS a WERR_* on any refusal. Never signs. `deps` = {
     bsv, ourAddress, protectedSet }. */
  function reviewSignAction(argsJson, deps) {
    if (!deps || !deps.bsv || !deps.ourAddress) throw werr('WERR_INTERNAL', 1, 'signAction review: missing deps (bsv, ourAddress).');
    var parsed = parseSignableArgs(argsJson);
    var decoded = decodeTx(deps.bsv, parsed.txHex);
    assertNoProtectedInputs(parsed.inputs, deps.protectedSet);
    var owned = matchOwnedInputs(deps.bsv, decoded, parsed.inputs, deps.ourAddress);
    var effect = reconstructEffect(decoded, owned, deps.ourAddress);
    return {
      ok: true,
      phase: 'A-dry-run',
      reference: parsed.reference,
      requestedSighash: parsed.requestedSighash, // V44: Phase B policy gate input
      ownedInputs: owned,          // exactly which inputs Phase B would sign
      effect: effect,              // human-readable reconstruction for the UI
      // Phase B fills this in after a security review. Until then, signing is
      // explicitly not performed and the wallet returns this review only.
      signed: false,
      _decoded: decoded            // handed to Phase B; not for display
    };
  }

  root.OrdplugSignAction = {
    werr: werr,
    parseSignableArgs: parseSignableArgs,
    decodeTx: decodeTx,
    assertNoProtectedInputs: assertNoProtectedInputs,
    matchOwnedInputs: matchOwnedInputs,
    reconstructEffect: reconstructEffect,
    reviewSignAction: reviewSignAction
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
