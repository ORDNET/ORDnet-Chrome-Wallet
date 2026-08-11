/* =========================================================================
   ORD/plug — SPV merkle-proof verification (V45). Pure, key-free, injected
   deps, testable in Node. Third proof layer for signAction Phase B (GATE 1c):
   proves the funding transaction is INCLUDED in a block, on top of the
   own-UTXO-view check (1a) and the sha256d hash-binding of its bytes (1b).

   Consumes TSC-style proofs: { index, nodes[], merkleRootHex } where nodes
   are sibling hashes (hex, display order) bottom-up and '*' means "duplicate
   self" (odd-width levels). A single-tx block proves with nodes=[] and
   merkleRoot == txid. Byte-order note: computed in Bitcoin-internal LE order;
   inputs/outputs accepted in display order and reversed here. The live WoC
   proof shape is verified during the activation test — a mismatch fails
   CLOSED (refusal), never open.
   ========================================================================= */
(function (root) {
  'use strict';
  function werr(name, code, message) { var e = new Error(message); e.name = name; e.code = code; e.isError = true; return e; }
  function buf(bsv) { var B = (bsv.deps && bsv.deps.Buffer) || (typeof Buffer !== 'undefined' ? Buffer : null); if (!B) throw werr('WERR_INTERNAL', 1, 'SPV: no Buffer implementation.'); return B; }
  function revHex(bsv, hex) { return buf(bsv).from(hex, 'hex').reverse(); }
  function sha256d(bsv, b) { return buf(bsv).from(bsv.crypto.Hash.sha256sha256(b)); }

  /* Recompute the merkle root (internal LE bytes) from a leaf txid (display
     hex), its index in the block, and the sibling path. */
  function computeMerkleRoot(bsv, txidHex, index, nodes) {
    if (typeof txidHex !== 'string' || !/^[0-9a-fA-F]{64}$/.test(txidHex)) throw werr('WERR_INVALID_PARAMETER', 3, 'SPV: leaf txid must be 64 hex chars.');
    if (typeof index !== 'number' || index < 0 || Math.floor(index) !== index) throw werr('WERR_INVALID_PARAMETER', 3, 'SPV: proof index must be a non-negative integer.');
    if (!Array.isArray(nodes)) throw werr('WERR_INVALID_PARAMETER', 3, 'SPV: proof nodes must be an array.');
    var B = buf(bsv);
    var h = revHex(bsv, txidHex); // internal order
    var idx = index;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i], sib;
      if (n === '*') sib = h; // odd level: pair with self
      else if (typeof n === 'string' && /^[0-9a-fA-F]{64}$/.test(n)) sib = revHex(bsv, n);
      else throw werr('WERR_INVALID_PARAMETER', 3, 'SPV: proof node ' + i + ' is not a 64-hex hash or "*".');
      h = (idx % 2 === 0) ? sha256d(bsv, B.concat([h, sib])) : sha256d(bsv, B.concat([sib, h]));
      idx = Math.floor(idx / 2);
    }
    if (idx !== 0) throw werr('WERR_INVALID_PARAMETER', 3, 'SPV: proof index exceeds the tree the nodes describe.');
    return h; // internal LE bytes
  }

  /* Root of an 80-byte block header (internal LE bytes at offset 36..68). */
  function merkleRootFromHeader(bsv, headerHex) {
    if (typeof headerHex !== 'string' || headerHex.length !== 160 || /[^0-9a-fA-F]/.test(headerHex)) {
      throw werr('WERR_INVALID_PARAMETER', 3, 'SPV: block header must be exactly 80 bytes of hex.');
    }
    return buf(bsv).from(headerHex, 'hex').slice(36, 68);
  }

  /* The check: does this txid at this index, via these nodes, land on this
     merkle root? Root accepted as display-order hex (merkleRootHex) or as an
     80-byte header (headerHex). Throws WERR_* on any mismatch. */
  function verifyInclusion(bsv, txidHex, proof) {
    if (!proof || typeof proof !== 'object') throw werr('WERR_INTERNAL', 1, 'SPV: no proof supplied for ' + txidHex + ' — refusing (fail-closed).');
    var expected;
    if (typeof proof.headerHex === 'string') expected = merkleRootFromHeader(bsv, proof.headerHex);
    else if (typeof proof.merkleRootHex === 'string' && /^[0-9a-fA-F]{64}$/.test(proof.merkleRootHex)) expected = revHex(bsv, proof.merkleRootHex);
    else throw werr('WERR_INVALID_PARAMETER', 3, 'SPV: proof for ' + txidHex + ' carries no merkle root or header.');
    var got = computeMerkleRoot(bsv, txidHex, proof.index || 0, proof.nodes || []);
    if (got.toString('hex') !== expected.toString('hex')) {
      throw werr('WERR_INVALID_PARAMETER', 3, 'SPV: merkle proof for ' + txidHex + ' does not connect to the block\u2019s merkle root — inclusion not proven.');
    }
    return true;
  }

  root.OrdplugSpv = { computeMerkleRoot: computeMerkleRoot, merkleRootFromHeader: merkleRootFromHeader, verifyInclusion: verifyInclusion };
})(typeof globalThis !== 'undefined' ? globalThis : this);
