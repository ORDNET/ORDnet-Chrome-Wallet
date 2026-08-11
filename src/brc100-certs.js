/* =========================================================================
   ORD/plug — BRC-100 certificate HOLDER engine (V46). Pure, injected deps.

   Scope (honest, per the ORDnet no-faked-capabilities rule):
   - The wallet is a certificate HOLDER, never a certifier: it stores
     certificates issued to this wallet's identity key, lists them, reveals
     user-approved fields to a verifier, and relinquishes them. Verifying a
     person (age/KYC) is the CERTIFIER's job, done once, elsewhere.
   - Supported: acquisitionProtocol 'direct' with PLAINTEXT fields — the
     certifier (or the app carrying its certificate) hands the wallet the
     complete signed certificate.
   - Explicitly refused (WERR_UNSUPPORTED_ACTION, never faked): the
     interactive 'issuance' protocol, encrypted-field certificates /
     masterKeyring flows (BRC-53 keyrings), and key-linkage revelation.
   - Certifier signature: stored verbatim and echoed to verifiers, who are
     the party that MUST verify it (they trust the certifier, not us).
     Wallet-side re-verification against the BRC-52 binary serialization is
     tracked in SECURITY-REVIEW as a pre-"certified conformance" item; until
     then list/prove results carry signatureVerifiedByWallet:false so no
     verification is implied.
   ========================================================================= */
(function (root) {
  'use strict';
  function werr(name, code, message) { var e = new Error(message); e.name = name; e.code = code; e.isError = true; return e; }
  var HEX33 = /^[0-9a-fA-F]{66}$/, B64ISH = /^[A-Za-z0-9+/=_-]{1,120}$/;

  function validateForAcquire(args, ourIdentityKeyHex) {
    if (!args || typeof args !== 'object') throw werr('WERR_INVALID_PARAMETER', 3, 'acquireCertificate: arguments required.');
    var proto = args.acquisitionProtocol || 'direct';
    if (proto !== 'direct') throw werr('WERR_UNSUPPORTED_ACTION', 2, 'acquireCertificate: this wallet only supports acquisitionProtocol "direct" (the interactive issuance protocol is not implemented, and is reported as such rather than faked).');
    if (args.keyringForSubject && Object.keys(args.keyringForSubject).length) {
      throw werr('WERR_UNSUPPORTED_ACTION', 2, 'acquireCertificate: encrypted-field certificates (keyrings) are not supported — provide plaintext fields.');
    }
    var c = {
      type: String(args.type || ''), serialNumber: String(args.serialNumber || ''),
      subject: String(args.subject || ourIdentityKeyHex || ''),
      certifier: String(args.certifier || ''),
      revocationOutpoint: String(args.revocationOutpoint || ''),
      signature: String(args.signature || ''),
      fields: (args.fields && typeof args.fields === 'object') ? args.fields : {}
    };
    if (!B64ISH.test(c.type)) throw werr('WERR_INVALID_PARAMETER', 3, 'acquireCertificate: invalid certificate type.');
    if (!c.serialNumber || c.serialNumber.length > 120) throw werr('WERR_INVALID_PARAMETER', 3, 'acquireCertificate: invalid serialNumber.');
    if (!HEX33.test(c.certifier)) throw werr('WERR_INVALID_PARAMETER', 3, 'acquireCertificate: certifier must be a 33-byte compressed public key (hex).');
    if (!HEX33.test(c.subject)) throw werr('WERR_INVALID_PARAMETER', 3, 'acquireCertificate: subject must be a 33-byte compressed public key (hex).');
    if (ourIdentityKeyHex && c.subject.toLowerCase() !== ourIdentityKeyHex.toLowerCase()) {
      throw werr('WERR_INVALID_PARAMETER', 3, 'acquireCertificate: this certificate\u2019s subject is not this wallet\u2019s identity key — a wallet only holds its own certificates.');
    }
    var names = Object.keys(c.fields);
    if (!names.length || names.length > 50) throw werr('WERR_INVALID_PARAMETER', 3, 'acquireCertificate: 1\u201350 plaintext fields required.');
    names.forEach(function (k) {
      if (k.length > 60 || typeof c.fields[k] !== 'string' || c.fields[k].length > 1000) {
        throw werr('WERR_INVALID_PARAMETER', 3, 'acquireCertificate: field "' + k + '" must be a string \u22641000 chars.');
      }
    });
    if (!c.signature || c.signature.length > 200) throw werr('WERR_INVALID_PARAMETER', 3, 'acquireCertificate: certifier signature required.');
    return c;
  }

  function keyOf(c) { return c.type + '|' + c.serialNumber + '|' + c.certifier.toLowerCase(); }

  function listCertificates(store, args) {
    var certs = Array.isArray(store) ? store : [];
    var a = args || {};
    var certifiers = Array.isArray(a.certifiers) ? a.certifiers.map(function (x) { return String(x).toLowerCase(); }) : null;
    var types = Array.isArray(a.types) ? a.types.map(String) : null;
    var out = certs.filter(function (c) {
      if (certifiers && certifiers.length && certifiers.indexOf(c.certifier.toLowerCase()) === -1) return false;
      if (types && types.length && types.indexOf(c.type) === -1) return false;
      return true;
    }).map(function (c) {
      return { type: c.type, serialNumber: c.serialNumber, subject: c.subject, certifier: c.certifier,
               revocationOutpoint: c.revocationOutpoint, signature: c.signature, fields: c.fields,
               signatureVerifiedByWallet: false };
    });
    var limit = Math.min(Math.max(1, a.limit || 10), 100), offset = Math.max(0, a.offset || 0);
    return { totalCertificates: out.length, certificates: out.slice(offset, offset + limit) };
  }

  /* Selective disclosure: return ONLY the fields the user approved, which
     must be a subset of what the verifier asked for. */
  function proveCertificate(store, args, approvedFieldNames) {
    var a = args || {};
    var certs = Array.isArray(store) ? store : [];
    var match = certs.filter(function (c) {
      if (a.certificate && a.certificate.serialNumber) return c.serialNumber === String(a.certificate.serialNumber) && (!a.certificate.type || c.type === String(a.certificate.type));
      if (a.type) return c.type === String(a.type);
      return false;
    });
    if (!match.length) throw werr('WERR_INVALID_PARAMETER', 3, 'proveCertificate: no matching certificate is held by this wallet.');
    var c = match[0];
    var wanted = Array.isArray(a.fieldsToReveal) ? a.fieldsToReveal.map(String) : [];
    if (!wanted.length) throw werr('WERR_INVALID_PARAMETER', 3, 'proveCertificate: fieldsToReveal[] required.');
    if (!HEX33.test(String(a.verifier || ''))) throw werr('WERR_INVALID_PARAMETER', 3, 'proveCertificate: verifier identity key (33-byte hex) required.');
    var approved = Array.isArray(approvedFieldNames) ? approvedFieldNames : [];
    var revealed = {};
    wanted.forEach(function (k) {
      if (!(k in c.fields)) throw werr('WERR_INVALID_PARAMETER', 3, 'proveCertificate: certificate has no field "' + k + '".');
      if (approved.indexOf(k) === -1) throw werr('WERR_PERMISSION_DENIED', 1, 'proveCertificate: the user did not approve revealing "' + k + '".');
      revealed[k] = c.fields[k];
    });
    return {
      certificate: { type: c.type, serialNumber: c.serialNumber, subject: c.subject, certifier: c.certifier,
                     revocationOutpoint: c.revocationOutpoint, signature: c.signature, fields: revealed },
      verifier: String(a.verifier),
      keyring: {}, // plaintext-field certificates: nothing to decrypt
      signatureVerifiedByWallet: false
    };
  }

  function relinquishCertificate(store, args) {
    var a = args || {};
    var t = String(a.type || ''), sn = String(a.serialNumber || ''), cf = String(a.certifier || '').toLowerCase();
    var i = (Array.isArray(store) ? store : []).findIndex(function (c) {
      return c.serialNumber === sn && (!t || c.type === t) && (!cf || c.certifier.toLowerCase() === cf);
    });
    if (i === -1) throw werr('WERR_INVALID_PARAMETER', 3, 'relinquishCertificate: no matching certificate is held by this wallet.');
    store.splice(i, 1);
    return { relinquished: true };
  }

  root.OrdplugCerts = { validateForAcquire: validateForAcquire, keyOf: keyOf,
    listCertificates: listCertificates, proveCertificate: proveCertificate,
    relinquishCertificate: relinquishCertificate };
})(typeof globalThis !== 'undefined' ? globalThis : this);
