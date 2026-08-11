/* =========================================================================
   ORD/plug — BRC-100 signAction, PHASE B (SIGNING). V44.
   Read SIGNACTION-SCOPE.md and SECURITY-REVIEW-V44.md before touching this.

   Every SECURITY_GATE from the V43.5 skeleton is now a real, tested
   implementation. The written answers to the four reviewer questions live in
   SECURITY-REVIEW-V44.md; the code below is that review made executable:

     GATE 1  Prevout proof.   Each input this wallet signs must (a) exist in
             the wallet's OWN live UTXO view with the exact claimed value, and
             (b) be proven by the raw funding transaction whose double-SHA256
             equals the input txid — so no index and no dApp can lie about
             what is being spent without breaking a hash.
     GATE 2  Sighash policy.  SIGHASH_ALL | SIGHASH_FORKID, nothing else.
             A dApp that requests any other flag is refused explicitly.
     GATE 3  Signing.         Own-key P2PKH only, per approved input index.
             The private key is PULLED via deps.getWif() only after gates
             1–2 pass and the user approved — never handed in beforehand.
     GATE 4  Re-verification. After signing, the outputs and outpoints of the
             signed bytes are compared field-by-field against what the user
             approved, the effect is reconstructed again and deep-compared,
             and every produced signature is script-interpreter-verified
             against the PROVEN locking script. Any deviation = throw, no
             result leaves this function.
     GATE 5  Abortability.    The signed action is registered in an injected
             pending store keyed by reference; abortPending() makes
             abortAction real. The wallet never broadcasts here — the dApp
             does — so "abort" = the wallet forgets/declines the reference.

   ENABLED is read LIVE at call time. It ships as false: flipping it to true
   is the wallet owner's deliberate act after the activation checklist in
   SECURITY-REVIEW-V44.md (load unpacked → small-amount live test → flip).
   Until then wallet.js keeps returning the Phase A dry-run + refusal.
   ========================================================================= */
(function (root) {
  'use strict';

  function werr(name, code, message) { var e = new Error(message); e.name = name; e.code = code; e.isError = true; return e; }

  /* ---- GATE 2: the locked sighash policy ---------------------------------
     SIGHASH_ALL | SIGHASH_FORKID and nothing else. ANYONECANPAY / NONE /
     SINGLE each let other parties mutate the transaction after we sign and
     are refused wholesale — a dApp that needs them needs a different wallet,
     not a silent downgrade of this one. */
  function allowedSighash(bsv) {
    return bsv.crypto.Signature.SIGHASH_ALL | bsv.crypto.Signature.SIGHASH_FORKID;
  }
  function assertSighashPolicy(bsv, requestedSighash) {
    var allowed = allowedSighash(bsv);
    if (requestedSighash == null) return allowed;               // absent = wallet default
    if (requestedSighash === allowed) return allowed;           // explicit ALL|FORKID ok
    if (requestedSighash === bsv.crypto.Signature.SIGHASH_ALL) return allowed; // ALL implies ALL|FORKID on BSV
    throw werr('WERR_INVALID_PARAMETER', 3,
      'signAction refused: this wallet only signs SIGHASH_ALL | SIGHASH_FORKID. The requested sighash (' + requestedSighash + ') would let other parties mutate the transaction after signing.');
  }

  /* ---- GATE 1a: our own UTXO view is the source of truth for values ------
     utxoList is the wallet's OWN freshly-fetched unspent list (raw WoC shape:
     { tx_hash, tx_pos, value }). Every input we are asked to sign must be in
     it with the EXACT claimed value. The dApp's satoshis field is thereby
     reduced to a claim we check, never a fact we trust. Fail-closed: caller
     must refuse earlier if the index could not be reached at all. */
  function assertInputsInOwnUtxoSet(ownedInputs, utxoList) {
    if (!Array.isArray(utxoList)) throw werr('WERR_INTERNAL', 1, 'signAction: own UTXO view unavailable — refusing to sign.');
    var byOutpoint = {};
    utxoList.forEach(function (u) {
      if (u && u.tx_hash && typeof u.tx_pos === 'number') byOutpoint[String(u.tx_hash).toLowerCase() + ':' + u.tx_pos] = u.value;
    });
    ownedInputs.forEach(function (m, k) {
      var key = m.txid + ':' + m.vout;
      if (!(key in byOutpoint)) {
        throw werr('WERR_INVALID_PARAMETER', 3, 'signAction refused: input ' + key + ' is not an unspent output of this wallet (per the wallet\u2019s own index view).');
      }
      if (byOutpoint[key] !== m.satoshis) {
        throw werr('WERR_INVALID_PARAMETER', 3, 'signAction refused: input ' + key + ' is worth ' + byOutpoint[key] + ' sats on-chain, not the ' + m.satoshis + ' sats the app claimed.');
      }
      if (byOutpoint[key] === 1) {
        throw werr('WERR_INVALID_PARAMETER', 3, 'signAction refused: input ' + key + ' is a 1-sat outpoint (candidate ordinal).');
      }
    });
  }

  /* ---- GATE 1b: cryptographic prevout proof ------------------------------
     For each signed input the caller supplies the raw funding transaction
     hex. We verify sha256d(raw) == txid — the txid the dApp itself committed
     to inside the transaction being signed — then read value + locking
     script straight out of those proven bytes. An index (or MITM) serving a
     tampered funding tx breaks the hash and is refused. This is the same
     self-authenticating property BEEF relies on for prevout content; chain
     inclusion is additionally anchored by GATE 1a (our own unspent view). */
  function sha256dTxid(bsv, rawHex) {
    var B = (bsv.deps && bsv.deps.Buffer) || (typeof Buffer !== 'undefined' ? Buffer : null);
    if (!B) throw werr('WERR_INTERNAL', 1, 'signAction: no Buffer implementation available for hashing.');
    var h = bsv.crypto.Hash.sha256sha256(B.from(rawHex, 'hex'));
    return B.from(h).reverse().toString('hex');
  }
  function assertPrevoutsProven(bsv, ownedInputs, rawTxByTxid, ourLockHex) {
    ownedInputs.forEach(function (m) {
      var raw = rawTxByTxid && rawTxByTxid[m.txid];
      if (typeof raw !== 'string' || !raw.length) {
        throw werr('WERR_INTERNAL', 1, 'signAction refused: could not fetch the funding transaction ' + m.txid + ' to prove the prevout — refusing to sign unproven inputs.');
      }
      raw = raw.trim().toLowerCase();
      var gotTxid = sha256dTxid(bsv, raw);
      if (gotTxid !== m.txid) {
        throw werr('WERR_INVALID_PARAMETER', 3, 'signAction refused: the fetched funding transaction does not hash to ' + m.txid + ' — prevout proof failed.');
      }
      var ftx;
      try { ftx = new bsv.Transaction(raw); } catch (e) { throw werr('WERR_INVALID_PARAMETER', 3, 'signAction refused: funding transaction ' + m.txid + ' did not parse.'); }
      var out = ftx.outputs && ftx.outputs[m.vout];
      if (!out) throw werr('WERR_INVALID_PARAMETER', 3, 'signAction refused: funding transaction ' + m.txid + ' has no output ' + m.vout + '.');
      if (out.satoshis !== m.satoshis) {
        throw werr('WERR_INVALID_PARAMETER', 3, 'signAction refused: proven prevout ' + m.txid + ':' + m.vout + ' is worth ' + out.satoshis + ' sats, not the claimed ' + m.satoshis + '.');
      }
      var lockHex = out.script ? out.script.toHex().toLowerCase() : '';
      if (lockHex !== ourLockHex) {
        throw werr('WERR_INVALID_PARAMETER', 3, 'signAction refused: proven prevout ' + m.txid + ':' + m.vout + ' does not pay this wallet\u2019s standard address.');
      }
    });
  }

  /* ---- GATE 1c: SPV inclusion proof (V45) --------------------------------
     The raw funding tx (1b) proves CONTENT; this proves the funding tx is
     INCLUDED in a block via its merkle path (src/spv-verify.js). Fail-closed:
     a missing or non-connecting proof refuses the signing. */
  function assertSpvProven(bsv, ownedInputs, spvByTxid) {
    var SPV = root.OrdplugSpv;
    if (!SPV) throw werr('WERR_INTERNAL', 1, 'signAction: SPV verifier not loaded — refusing.');
    ownedInputs.forEach(function (m) {
      var proof = spvByTxid && spvByTxid[m.txid];
      if (!proof) throw werr('WERR_INTERNAL', 1, 'signAction refused: no merkle inclusion proof for ' + m.txid + ' — refusing to sign unproven inputs.');
      SPV.verifyInclusion(bsv, m.txid, proof); // throws WERR_* on mismatch
    });
  }

  /* ---- GATE 3: signature production (own-key P2PKH only) ----------------- */
  function signOwnedInputs(bsv, tx, ownedInputs, wif, ourLockHex, sigtype) {
    var priv = bsv.PrivateKey.fromWIF(wif);
    var lockScript = bsv.Script.fromHex(ourLockHex);
    var interpFlags = bsv.Script.Interpreter.SCRIPT_VERIFY_P2SH
      | bsv.Script.Interpreter.SCRIPT_VERIFY_STRICTENC
      | bsv.Script.Interpreter.SCRIPT_VERIFY_DERSIG
      | bsv.Script.Interpreter.SCRIPT_VERIFY_LOW_S
      | bsv.Script.Interpreter.SCRIPT_ENABLE_SIGHASH_FORKID;
    var signedIndexes = [];
    ownedInputs.forEach(function (m) {
      var satsBN = bsv.crypto.BN.fromNumber(m.satoshis);
      var sig = bsv.Transaction.Sighash.sign(tx, priv, sigtype, m.inputIndex, lockScript, satsBN, interpFlags);
      var unlocking = bsv.Script.buildPublicKeyHashIn(priv.publicKey, sig.toDER(), sigtype);
      tx.inputs[m.inputIndex].setScript(unlocking);
      signedIndexes.push(m.inputIndex);
    });
    return { signedIndexes: signedIndexes, interpFlags: interpFlags, pubKey: priv.publicKey };
  }

  /* ---- GATE 4: re-verify the signed bytes against the approved effect ----
     Three independent checks, all against the review the USER approved:
       1) structural: outputs (count, value, script) and input outpoints of
          the signed tx are identical to the reviewed tx — signing may add
          unlocking scripts and nothing else;
       2) semantic: the effect is reconstructed AGAIN from the signed bytes
          with the Phase A engine and deep-compared to the approved effect;
       3) cryptographic: every produced signature is verified by the script
          interpreter against the PROVEN locking script and value. */
  function effectFingerprint(e) {
    return JSON.stringify({
      s: e.spendingFromWallet, tw: e.outputsToWallet, ew: e.outputsElsewhere,
      n: e.netToWallet, si: e.signedInputCount, ti: e.totalInputCount,
      o: (e.outputs || []).map(function (l) { return [l.satoshis, l.dest, !!l.toThisWallet]; })
    });
  }
  function assertSignedMatchesApproved(bsv, phaseA, signedTx, review, deps) {
    var approved = review._decoded;
    if (!approved || !approved.outs) throw werr('WERR_INTERNAL', 1, 'signAction: approved decode missing — refusing.');
    // (1) structural equality
    if ((signedTx.outputs || []).length !== approved.outs.length) throw werr('WERR_INTERNAL', 1, 'signAction aborted: output count changed after approval.');
    signedTx.outputs.forEach(function (o, i) {
      var a = approved.outs[i];
      if (o.satoshis !== a.satoshis || (o.script ? o.script.toHex().toLowerCase() : '') !== a.scriptHex.toLowerCase()) {
        throw werr('WERR_INTERNAL', 1, 'signAction aborted: output ' + i + ' deviates from what was approved.');
      }
    });
    if ((signedTx.inputs || []).length !== approved.ins.length) throw werr('WERR_INTERNAL', 1, 'signAction aborted: input count changed after approval.');
    signedTx.inputs.forEach(function (inp, i) {
      var po = inp.prevTxId ? inp.prevTxId.toString('hex').toLowerCase() : '';
      var a = approved.ins[i];
      if (po !== a.txid || (typeof inp.outputIndex === 'number' ? inp.outputIndex : inp.prevoutIndex) !== a.vout) {
        throw werr('WERR_INTERNAL', 1, 'signAction aborted: input outpoint ' + i + ' deviates from what was approved.');
      }
    });
    // (2) semantic equality — reconstruct from the SIGNED bytes and compare
    var redecoded = phaseA.decodeTx(bsv, signedTx.uncheckedSerialize());
    var reEffect = phaseA.reconstructEffect(redecoded, review.ownedInputs, deps.ourAddress);
    if (effectFingerprint(reEffect) !== effectFingerprint(review.effect)) {
      throw werr('WERR_INTERNAL', 1, 'signAction aborted: the reconstructed effect of the signed bytes deviates from the approved effect.');
    }
    // (3) cryptographic validity of every signature we produced
    var lockScript = bsv.Script.fromHex(deps.ourLockHex);
    review.ownedInputs.forEach(function (m) {
      var interp = new bsv.Script.Interpreter();
      var ok = interp.verify(signedTx.inputs[m.inputIndex].script, lockScript, signedTx, m.inputIndex,
        deps.interpFlags, bsv.crypto.BN.fromNumber(m.satoshis));
      if (!ok) throw werr('WERR_INTERNAL', 1, 'signAction aborted: produced signature for input ' + m.inputIndex + ' failed script verification (' + (interp.errstr || 'unknown') + ').');
    });
  }

  /* ---- GATE 5: abortable pending-action registry -------------------------
     Pure over an injected plain-object store so wallet.js can persist it to
     chrome.storage.session and the background worker can service
     abortAction. The wallet never broadcasts a signAction result itself. */
  function registerPending(store, reference, entry) {
    if (!store || typeof store !== 'object') throw werr('WERR_INTERNAL', 1, 'signAction: pending store unavailable.');
    var ref = (typeof reference === 'string' && reference.length) ? reference : ('ordplug-' + entry.txid);
    store[ref] = { txid: entry.txid, createdAt: entry.createdAt || Date.now(), origin: entry.origin || null };
    return ref;
  }
  function abortPending(store, reference) {
    if (!store || typeof reference !== 'string' || !(reference in store)) {
      throw werr('WERR_INVALID_PARAMETER', 3, 'abortAction: no abortable action exists for this reference.');
    }
    delete store[reference];
    return { aborted: true, reference: reference };
  }

  /* ---- PHASE B entry point ------------------------------------------------
     deps = { bsv, ourAddress, utxoList, rawTxByTxid, getWif, pendingStore,
              origin }. Requires a fresh, user-APPROVED Phase A review.
     Throws WERR_* on every refusal; returns the BRC-100 result shape only
     when every gate passed. */
  function performSignAction(review, deps) {
    if (!root.OrdplugSignActionPhaseB.ENABLED) {
      throw werr('WERR_UNSUPPORTED_ACTION', 2,
        'signAction: the wallet reviewed this transaction (Phase A) but signing is not enabled on this installation. See SECURITY-REVIEW-V44.md for the activation checklist.');
    }
    if (!deps || !deps.bsv || !deps.ourAddress || typeof deps.getWif !== 'function') {
      throw werr('WERR_INTERNAL', 1, 'signAction Phase B: missing deps (bsv, ourAddress, getWif).');
    }
    if (!review || review.phase !== 'A-dry-run' || review.signed || !review._decoded || !Array.isArray(review.ownedInputs) || !review.ownedInputs.length) {
      throw werr('WERR_INTERNAL', 1, 'signAction Phase B: a valid Phase A review is required.');
    }
    var bsv = deps.bsv;
    var phaseA = root.OrdplugSignAction;
    if (!phaseA) throw werr('WERR_INTERNAL', 1, 'signAction Phase B: Phase A engine not loaded.');

    var ourLockHex;
    try { ourLockHex = bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(deps.ourAddress)).toHex().toLowerCase(); }
    catch (e) { throw werr('WERR_INTERNAL', 1, 'signAction: could not derive this wallet\u2019s locking script.'); }

    // GATE 2 — sighash policy locked before anything else touches bytes.
    var sigtype = assertSighashPolicy(bsv, review.requestedSighash);

    // GATE 1 — prove every input, twice-over (own view + hash-bound raw tx).
    assertInputsInOwnUtxoSet(review.ownedInputs, deps.utxoList);
    assertPrevoutsProven(bsv, review.ownedInputs, deps.rawTxByTxid, ourLockHex);
    assertSpvProven(bsv, review.ownedInputs, deps.spvByTxid);

    // GATE 3 — only now pull the key and sign the approved inputs.
    var tx = review._decoded.tx;
    var signed = signOwnedInputs(bsv, tx, review.ownedInputs, deps.getWif(), ourLockHex, sigtype);

    // GATE 4 — nothing leaves unless the signed bytes match the approval.
    assertSignedMatchesApproved(bsv, phaseA, tx, review, {
      ourAddress: deps.ourAddress, ourLockHex: ourLockHex, interpFlags: signed.interpFlags
    });

    // GATE 5 — register as abortable; the dApp completes/broadcasts.
    var signedHex = tx.uncheckedSerialize();
    var txid = sha256dTxid(bsv, signedHex);
    var reference = registerPending(deps.pendingStore || (deps.pendingStore = {}), review.reference, {
      txid: txid, origin: deps.origin || null
    });

    return {
      txid: txid,
      tx: signedHex,                 // BRC-100 signAction result: the signed transaction
      signedInputIndexes: signed.signedIndexes,
      sighash: 'SIGHASH_ALL|SIGHASH_FORKID',
      reference: reference,
      abortable: true,
      sendWithResults: []            // this wallet does not broadcast dApp-built txs
    };
  }

  root.OrdplugSignActionPhaseB = {
    ENABLED: false, // <-- the owner's deliberate flip, after SECURITY-REVIEW-V44.md's checklist.
    performSignAction: performSignAction,
    // exported for tests and for wallet.js / background.js:
    assertSighashPolicy: assertSighashPolicy,
    assertInputsInOwnUtxoSet: assertInputsInOwnUtxoSet,
    assertPrevoutsProven: assertPrevoutsProven,
    assertSpvProven: assertSpvProven,
    assertSignedMatchesApproved: assertSignedMatchesApproved,
    sha256dTxid: sha256dTxid,
    registerPending: registerPending,
    abortPending: abortPending
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
