# Security fixes — ORD/plug V49.3 (manifest 4.9.3)

**Audit:** fourth round — the Grok and ChatGPT reviews of 4.9.2, 1 September 2026
**Supersedes:** 4.9.2 (V49.2)
**Ships as:** Chrome Web Store version 4.9.3 (store and internal numbering are one from 4.9.2 on)

Every finding below is verified against the 4.9.2 source (file:line), fixed,
and covered by `tests/v49-release-tests.mjs` unless stated otherwise.

## P0 — a page could set the miner fee behind the approval screen

**Where.** `presentApproval()` printed `inscribeMinerFee(bytes)` for a
page-requested inscription (wallet.js 2221); `approveRequest()` executed
`buildInscribe(…, feeNum(p.params.fee))` (2332); `buildInscribe()` used that
page fee whenever it was non-zero (515). `feeNum()` accepted anything up to
`Number.MAX_SAFE_INTEGER`. A small inscription with `fee: 5_000_000` showed
"Miner fee 105 sats" and paid 5,000,000 — fund loss, no consent.

**Fix — one plan, read from the bytes.**
- `buildSend` / `buildInscribe` / `buildTx` take `{ sign:false }` and return
  the UNSIGNED transaction. `presentApproval()` calls `planForPending()`
  first; everything on the screen — fee, each output, change, service fee,
  inputs — is `txEffect(tx)` of that object (`15-approval.js`).
- The unsigned object stays in memory on `_pending.plan` (never in
  storage). `approveRequest()` calls `signPlanned()`: sign the SAME object,
  recompute `txFingerprint()` (inputs + outputs, signature-independent) and
  `txEffect()`, throw "Safety stop" if either differs from what was shown.
  No plan (popup reloaded) or a plan older than 5 minutes → re-present,
  never build-and-send blind.
- A page-supplied fee is interpreted in ONE place, `clampSiteFee(walletFee,
  siteFee)`: below the wallet estimate → wallet estimate; above 2× → 2×;
  otherwise honoured and attributed to the page. `feeNum()` refuses anything
  above 1,000,000 sats outright. The screen prints the outcome ("the page
  asked for 50,000 sats — capped at 2× your wallet's rate").
- `buildTx()` (sendTx) no longer lets a non-zero page fee short-circuit the
  byte-accurate fee loop; the clamp is applied after the loop.
- The purchase screen and its execution used two different fee formulas
  (one ignored the OP_RETURN size); both now call `purchaseMinerFee()`.

## P0 — BRC-100 requests bypassed the request gate

**Where.** `background.js` 137–174: every `brc100_request` overwrote
`ordplug_pending_brc100` and called `chrome.windows.create()`. No
`ORDPLUG_GATE.decide()`, no cooldown, no `at` timestamp — popup spam, races,
responses for the wrong promise, promises that never settled.

**Fix.** `ORDPLUG_GATE.decide()` now takes `pending || pendingBrc100` — one
slot for both families. A refused BRC-100 request answers
`WERR_REVIEW_PENDING` immediately. `brc100_resolve` runs the same
`afterResolve()` cooldown bookkeeping as `ordplug_resolve`. Both families
open the wallet through `openWalletWindow()`: one window id in session
storage, an existing window is focused, never duplicated.
`chrome.windows.onRemoved` answers any request still pending in that window
with `WERR_USER_DECLINED` (BRC-100) or a plain rejection (ordplug) and starts
the origin cooldown. On the page side `brc100-inpage.js` rejects with
`WERR_TIMEOUT` after 5 minutes.

## P0 — certificates and x402 were unreachable

**Where.** The popup implemented `acquireCertificate`, `listCertificates`,
`proveCertificate`, `relinquishCertificate`, `payX402` (wallet.js
4287–4337) but `BRC100_POPUP_METHODS` in background.js (11–17) did not list
them, so `handleBrc100Direct()` rejected them as unsupported before the popup
was ever reached. The 4.9.2 fix for `relinquishCertificate` protected code no
dApp could call.

**Fix.** `src/brc100-methods.js` is the single registry (`direct` / `popup`
/ `refused`), loaded by the background worker (`importScripts`) and the popup.
Tests assert: the page shim's method list equals the registry, every popup
method has a handler, every direct method is answered, background has no
private copy.

## P0 — "Remove wallet" did not remove the wallet

**Where.** `removeWalletNow()` (wallet.js 250–256) removed the vault, the
legacy accounts key and the session key. 26 storage keys were in use.

**Fix.** `wipeAllWalletData()` in `04-vault.js`: `ALL_WALLET_STORAGE_KEYS`
plus every `chrome.storage.local` key under `ordplug_` / `ordnet_` /
`web3domains:`, `chrome.storage.session.clear()`, every Cache Storage
bucket; in-memory state and BRC-100 key material reset. A test inventories
every `'ordplug_…'` / `'ordnet_…'` literal in `src/` and fails if one is not
covered.

## P0 — recovery phrases were not validated as BIP39

**Where.** `validateMnemonic()` (wallet.js 93–97): count + word list only.

**Fix.** `mnemonicChecksumValid()` implements the checksum; `mnemonicProblem()`
returns the reason (count / word not in list / checksum). New wallets require
a three-word recovery challenge before encryption; imports show a live
address preview and the Import button is disabled until the phrase validates.

## `isAuthenticated` / `waitForAuthentication` always answered true

**Fix.** `ORDPLUG_AUTH.isAuthenticated(local, session, now)`: vault present,
session key present, inside the auto-lock window. `waitForAuthentication`
opens the unlock screen and resolves on `chrome.storage.onChanged` for the
session key, or rejects `WERR_NOT_AUTHENTICATED` after 5 minutes.

## Smaller items

- `getBalance()` throws on non-2xx / non-numeric bodies — an outage is never
  rendered as 0 sats.
- Active auto-lock watchdog (`startAutolockWatch`, every 30 s) inside any
  open wallet window.
- One content script for both providers; manifest content-script and
  web-accessible-resources blocks match exactly (tested).
- `getVersion()` and `window.ordplug.version` follow the manifest version.

## Not changed, by decision

- Service-fee model (11 outputs, 3,996 sats).
- `http(s)://*/*` content-script scope (all-sites provider model).
- Source-available licence.
