# SECURITY-REVIEW-V44/V45 — signAction Phase B + V45 additions

This is the written review SIGNACTION-SCOPE.md requires before the signing
path may be enabled. It answers the four questions each `SECURITY_GATE` in the
V43.5 skeleton posed, documents two Phase A fixes shipped in V44, and ends
with the activation checklist. Reviewer: AI security review (Claude,
Anthropic), working from the full V43.5 source. **An AI review of the source
is thorough but is not a substitute for a human review of the deployed
system** — hence the checklist below keeps the final flip a deliberate act of
the wallet owner after a live small-amount test.

## Phase A fixes shipped in V44 (active immediately)

1. **Ordinal protection is now fail-closed.** V43.5 built the protected
   1-sat set with a silent `catch {}`: an index outage produced an EMPTY set
   and the review continued unprotected (the code comment claimed a fallback
   that did not exist). V44: `fetchUnspentStrict()` distinguishes
   "unreachable" (refuse the whole review, `WERR_INTERNAL`) from "genuinely
   empty" (valid answer), and the pure engine additionally refuses ANY input
   with `satoshis === 1`, index or no index. Tests: Phase A suite.
2. **The informational "OK" is decoupled from signing.** V43.5's dry-run
   screen mutated its OK button and fed the same code path a future Phase B
   would use; flipping one boolean would have turned an informational
   acknowledgement into signing consent. V44 gives Phase B its own screen
   ("Sign transaction", explicit Sign/Reject), shown only when signing is
   enabled, only after the prevouts are proven.

## GATE 1 — How is each signed input's prevout proven?

Two independent checks, both of which must pass, per input:

- **Own-view check.** The outpoint must exist in the wallet's OWN freshly
  fetched unspent list with the EXACT value the dApp claimed, and that value
  must be > 1 sat. The dApp's `satoshis` field is thereby a claim we verify,
  never a fact we trust. Source list is fetched fail-closed (see fix 1).
- **Hash-binding check.** The raw funding transaction is fetched by txid and
  `sha256d(raw)` must equal the txid — the txid the dApp itself committed to
  inside the transaction being signed. Value and locking script are then read
  from those PROVEN bytes and must match the claim and the wallet's own P2PKH
  script. A lying or compromised index cannot forge this without breaking
  SHA-256; this is the same self-authenticating property BEEF relies on for
  prevout content. Chain inclusion/unspentness is anchored by the own-view
  check; a stale answer there can at worst produce a transaction miners
  reject, never a signature over misrepresented bytes.

Full BEEF/merkle-path verification against an independent header source was
considered and deliberately not chosen for V44: the wallet's existing trust
model already uses WhatsOnChain for UTXO discovery and broadcast, and the
hash-binding check removes the index's ability to lie about prevout CONTENT.
If the wallet ever moves to multi-source or header-verified SPV, this gate is
the single place to upgrade (`assertPrevoutsProven`).

### GATE 1c (V45) — SPV inclusion proof

On top of 1a/1b, every funding transaction must carry a merkle inclusion
proof (TSC shape) that connects its txid to a block's merkle root
(`src/spv-verify.js`, pure and tested against synthetic trees including
odd-width duplication and header-embedded roots). Fail-closed: no proof or a
non-connecting proof refuses the signing. The live WoC proof endpoint's exact
field shape/byte order is confirmed in activation-checklist step 2 — a
mismatch there surfaces as a refusal, never as false acceptance.

### V45 — per-app daily budget (policy)

Users can grant an origin a daily USD allowance (default $10, adjustable to
$1000 max, revocable). Auto-approval applies ONLY to wallet-built outgoing
`createAction` payments within the remaining allowance, requires a fresh
exchange rate (no rate = confirm), resets per UTC day, and NEVER applies to
dApp-built `signAction` — a human always reviews those. Engine:
`src/brc100-budget.js`, pure and tested.

## GATE 2 — Which sighash flags are permitted, and why?

`SIGHASH_ALL | SIGHASH_FORKID`, nothing else. A bare `SIGHASH_ALL` request is
accepted and normalised to `ALL|FORKID` (FORKID is mandatory on BSV). Any
request containing `NONE`, `SINGLE` or `ANYONECANPAY` is refused with an
explicit error, because each allows other parties to mutate the transaction
after this wallet signs. Phase A captures a dApp-requested sighash
(top-level or per-input) precisely so this gate can refuse it EXPLICITLY
rather than silently signing with a different flag than requested.

## GATE 3 — How is the reconstructed effect re-checked against what is signed?

Three checks after signing, before anything is returned (`GATE 4` in code):

1. **Structural**: outputs (count, satoshis, script bytes) and input
   outpoints of the signed transaction are compared field-by-field with the
   decode the user approved — signing may add unlocking scripts and nothing
   else.
2. **Semantic**: the human-readable effect is reconstructed AGAIN from the
   signed bytes with the same Phase A engine and fingerprint-compared to the
   approved effect.
3. **Cryptographic**: every produced signature is run through the script
   interpreter against the PROVEN locking script and value
   (`SCRIPT_ENABLE_SIGHASH_FORKID` et al.); an invalid signature aborts.

Key discipline: the WIF is pulled via `deps.getWif()` only after gates 1–2
and user approval; a test asserts `getWif` is never invoked on any refusal
path. The key is used for local ECDSA signing only and is never serialised
into the result, the pending store, or any network request.

## GATE 4 — How is a signed-but-not-broadcast action held and abortable?

This wallet never broadcasts a `signAction` result — the dApp completes and
broadcasts, per BRC-100. "Abortable" therefore means: each signed action is
registered under its `reference` in `chrome.storage.session`
(`ordplug_signaction_pending`; txid, origin, timestamp — never the key, never
the raw tx). `abortAction` in the background worker removes the reference and
returns `{ aborted:true, reference }`; unknown references keep the explicit
refusal. Session storage means the registry dies with the browser session,
which matches the lifetime of a not-yet-broadcast action.

### V46 — certificates & x402 (policy notes)

Certificates: the wallet is a HOLDER only. Storage is local per address and
may contain personal fields — never logged, wiped with wallet reset. Proving
always shows a per-request consent screen listing the exact fields; there are
no standing grants for disclosure. Wallet-side BRC-52 signature verification
against the binary serialization (with reference vectors from
@bsv/wallet-toolbox) is REQUIRED before publicly claiming certificate
conformance; until then all results carry signatureVerifiedByWallet:false.

x402: payX402 flows through the identical budget/confirm pipeline as any
outgoing payment, plus a hard 100,000-sat per-payment cap in the pure engine.
The wallet returns a signed rawTx in the X-PAYMENT header and never
broadcasts it; settlement (broadcast) is the resource server's act via the
facilitator, so an unsettled payment costs nothing.

## Residual risks the owner accepts by enabling

- WhatsOnChain remains the single index for the unspent VIEW (content is
  hash-proven, presence/spentness is not independently proven). Worst case
  is a refusal or a miner-rejected transaction, not value misrepresentation.
- The confirm screen shows net wallet effect; counterparty inputs are
  labelled as app-supplied and are outside what this wallet proves.
- The signed transaction is handed to the dApp, which may broadcast it at any
  later time regardless of `abortAction` (an on-chain reality for every
  wallet; abort only governs this wallet's own bookkeeping).

## Activation checklist (the deliberate flip)

1. Load V44 unpacked; run `node tests/*.mjs` — all suites must pass (70/70).
2. Confirm live API shapes on one known txid: `GET /tx/<txid>/proof/tsc`
   (field names, node byte order) and the Bitails fallback endpoints; then,
   on a throwaway account with a SMALL balance, drive one real
   `signAction` end-to-end from a known dApp; verify the confirm screen's
   amounts against the chain, sign, let the dApp broadcast, check the result.
3. Only then set `ENABLED: true` in `src/brc100-signaction-phaseB.js`
   (one line, marked with an arrow) and reload the extension.
4. Optional but recommended before public distribution: an independent human
   review of `src/brc100-signaction.js`, `src/brc100-signaction-phaseB.js`
   and the `brc100SignActionReview` wiring in `src/wallet.js` (~600 lines).
