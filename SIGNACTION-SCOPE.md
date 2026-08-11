# signAction / signableTransaction — build scope (deferred from V43)

This document scopes the one BRC-100 method the ORDnet wallet still refuses.
It is written so the work can be done carefully, test-first, rather than
squeezed into a quick edit. `signAction` touches fund-signing, so treat it
with the same seriousness as the vault crypto.

## Why it is not in V43

Everything shipped in V43 is either keyless (reads) or fully wallet-built
(outputs-only `createAction`, where *we* construct and validate the whole
transaction before signing). `signAction` is different in kind: the dApp
supplies a partially-built transaction — potentially including **its own
inputs** via `inputBEEF` — and asks the wallet to sign the inputs that belong
to it, then hand the transaction back for the dApp to complete and broadcast.

A subtle bug here does not throw. It signs. The failure mode is signing away
BSV or an ordinal under a script the wallet did not properly understand. That
is why it is scoped separately and must end in a human security review.

## What "supporting it correctly" requires

1. **BEEF / SPV input verification.** Every input the dApp references must be
   verified against its supplied BEEF (merkle-path-backed) — the wallet must
   confirm each prevout script and value independently, never trusting the
   dApp's assertion of what an input is worth or locks.

2. **Ordinal protection must hold.** The existing 1-sat ordinal-protection set
   must be enforced here too: the signable path must refuse to sign any input
   that spends a protected 1-sat ordinal outpoint unless that is explicitly the
   user-approved intent. This is the highest-risk interaction — a malicious
   dApp's first target is tricking the wallet into signing an ordinal into a
   payment.

3. **Sighash-flag discipline.** Decide and enforce exactly which sighash flags
   are allowed. `SIGHASH_ALL | FORKID` for normal signing; anything permitting
   `ANYONECANPAY` or `NONE`/`SINGLE` must be understood output-by-output and
   surfaced to the user, because those flags let other parties mutate the
   transaction after signing.

4. **A real confirmation UI.** Unlike outputs-only actions where the wallet
   knows every line, here the wallet must reconstruct and show the user: what
   is being spent (each of *your* inputs), what leaves the wallet, what the
   dApp's own inputs/outputs are, and the net effect. The user approves the
   reconstructed reality, not the dApp's description of it.

5. **`abortAction` becomes real.** Once a signable action can be created and
   held pending, `abortAction` must actually release it (today it correctly
   refuses because nothing is ever left pending).

6. **Its own test suite.** Table-driven tests covering: valid single-input
   sign; multi-input; refusal on unverifiable BEEF; refusal on protected
   ordinal input; refusal on disallowed sighash; correct error shapes
   (`WERR_*`) for every refusal path. Model it on `tests/v42-tests.mjs`.

7. **Human security review** of the signing path before it ships to users.
   Non-negotiable for a fund-signing feature.

## Suggested sequencing

- Phase A: read + verify only. Accept a `signableTransaction`, verify all
  inputs against BEEF, reconstruct the human-readable effect, and return a
  *dry-run* summary — without signing. Fully testable, zero fund risk.
- Phase B: add signing behind the reconstructed-confirmation UI and the
  ordinal-protection guard, with the sighash policy locked down.
- Phase C: wire `abortAction`, finalise error shapes, security review, ship.

## Status V44

Phases A and B are implemented and tested (see SECURITY-REVIEW-V44.md for
the written gate answers). `ENABLED` ships as `false`; the activation
checklist in that document governs the flip. abortAction is real (Phase C
wiring done). The section below describes pre-V43.5 behaviour and is kept
for history.

## Historical behaviour (pre-V43.5)

Until the above exists, `signAction` returns a standards-shaped rejection
(`WERR_UNSUPPORTED_ACTION`, code 2) explaining that only outputs-only
`createAction` is processed. dApps that respect the BRC-100 error contract
degrade cleanly rather than failing in an undefined way.
