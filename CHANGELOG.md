# Changelog — ORD/plug (ORDnet Web3 Browser & Wallet)

All notable changes to the ORD/plug Chrome extension, reconstructed from the 47
archived build ZIPs (`ord-plugin-chrome-V4` … `ordplug-chrome-V47_2`).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions below use the **internal manifest version**, with the internal build
number in parentheses. Dates are build dates taken from the archive files.

## Internal builds → public store versions

| Internal build | Manifest version | Public Chrome Web Store version |
|---|---|---|
| V49.7 | 4.9.7 | **4.9.7** — this release: home simplification (layout only) + repository housekeeping |
| V49.6 | 4.9.6 | first GitHub upload of the home simplification; the web upload left three stale files from older versions in the tree (see 4.9.7), not submitted to the store |
| V49.4 … V49.5 | 4.9.4 … 4.9.5 | internal iterations (⋯ menu + More tab; @-tile for OpNS), reviewed on screenshots, not published |
| V49.3 | 4.9.3 | **4.9.3** — security and recovery round (submitted after 4.9.2 is approved) |
| V49.2 | 4.9.2 | **4.9.2** — submitted 2026-09-01; store and internal numbering are one and the same from here on |
| V35 … V49.1 | 3.5.0 … 4.9.1 | internal development and security-fix builds, never published individually |
| V34 | 3.4.0 | 3.4.0 — live in the store from 2026-07-19 until 4.9.2 is approved |
| V4 … V33 | 1.0.0 … 3.3.0 | internal development builds, pre-store |

> Correction (V49.3): earlier revisions of this table said that 3.5.1 was
> "currently live" and that 4.9.2 would ship as 3.6.0. Neither happened —
> the store stayed on 3.4.0 (build V34) the whole time, so store users had
> none of V35 … V49.2, including all three security rounds. 4.9.2 was
> submitted under its own number on 2026-09-01 to close that gap; from now on
> the manifest version, the git tag, the store version, `getVersion()` and
> `window.ordplug.version` are one identity (see RELEASE-4.9.3.md).

---

## [4.9.7 (V49.7)] — 2026-09-02

Same wallet as 4.9.6 plus repository housekeeping. GitHub's web upload adds
and overwrites but never deletes, so the 4.9.6 upload left three files from
older versions in the tree — two of which the release suite rightly rejects:

- removed `src/wallet.js` (the pre-split 4.7.2 monolith; the popup engine
  lives in `src/wallet/00-…24-*.js` since 4.9.3)
- removed `src/brc100-content.js` (one injector, `src/content.js`, since 4.9.3)
- removed `RELEASE-4.9.5.md` (4.9.5 was an internal iteration, never published)
- restored `.github/workflows/test.yml` (unit suites on every push) and added
  `.github/workflows/e2e.yml` (loaded-extension suite, manual trigger only
  until proven green — it needs a headed Chromium that CI must provide)

No wallet code changed between 4.9.6 and 4.9.7 apart from the version number.

---

## [4.9.6 (V49.6)] — 2026-09-01

Cosmetic release: the popup's home screen and the names flow are re-laid
out after a mockup review. No colours, fonts, tokens, engines, signing paths
or storage keys changed; every button keeps its id and its handler.

### Changed (layout / navigation only)
- **Home** is the balance: amount large and centred, sats and dollar value
  under it, the address as a pill, Send / Receive, then four category rows —
  Your SNS domains, Your OpNS domains, Your BSVmaps, For sale — each with its
  count on the right. The holdings list, tab strip, search, pager and bulk
  panel moved off the home screen.
- **Header** keeps all five actions visible (UTXO tools, Accounts, Settings,
  Open in a full tab, Lock) — the 4.9.4 iteration folded them into a ⋯ menu;
  reviewed and reverted: a web3 wallet shows its tools directly.
- **Category rows** carry the same dark tile icons as the list rows (ORDnet
  mark for SNS and OpNS, orange block for BSVmaps, tag for For sale).
- **Category screen** (`view-holdings`): one category at a time with a title
  and count, search, pager and bulk mode — the existing holdings engine
  rendering into the same element ids; the tab strip is kept hidden for it.
  "Bulk list" / "Bulk delist" sits top-right.
- **Name detail** (`view-namedetail`): tapping a row opens a screen with the
  item's facts (type, status, listed price, district, location) and its
  actions under each other — List for sale / Remove listing, Send to address,
  Target, routes and registry (SNS), Open in ORDnet search / on bsvmap.io.
  The per-row icon buttons are gone; the actions carry the same `data-*`
  attributes, so the delegated handlers are untouched.
- **Bottom nav** unchanged: Wallet · Browser · Domains · Upload · ORD/ner
  (the 4.9.4 "Names / More" variant was reverted for the same reason).
  The Transaction history link stays on the home screen.
- After signing a listing or a delist the wallet returns to the category
  screen (same tab and page) instead of home; Back from List / Send / Delist
  does the same.

### Not in this release (by decision)
- "Change price" on a listing (delist + relist in one step) and greying-out
  of already-listed names inside bulk mode are logic changes and stay out of
  a cosmetic release.
- Watch-only accounts: agreed for a later release, mockup first.

### Tests
- 243 → 251: a V49.7 block in `tests/v49-release-tests.mjs` checks the
  layout is present, the engine ids survive, rows open the detail screen,
  the five header icons and the five tabs are back, the category tiles
  reuse the list tile classes, and the new CSS uses only `var(--…)` tokens
  (no new colours or fonts).

---

## [4.9.3 (V49.3)] — 2026-09-01

Fourth round: the Grok and ChatGPT product/security reviews of 4.9.2, worked
point by point. Full detail in [SECURITY-FIXES-4.9.3.md](SECURITY-FIXES-4.9.3.md).

### Security
- **A page could set the miner fee behind the approval screen.** For a
  page-requested inscription the screen printed `inscribeMinerFee(bytes)`
  while execution used `feeNum(p.params.fee)` from the page verbatim — a small
  inscription with a huge fee burned the difference to the miner. Now
  `pay` / `inscribe` / `sendTx` build the UNSIGNED transaction first, the
  screen is rendered from those exact bytes (`txEffect`), and approval signs
  the same object and re-checks its fingerprint ("Safety stop" otherwise).
  A page-supplied fee is clamped to [wallet estimate, 2× wallet estimate]
  (`clampSiteFee`) and capped absolutely at 1,000,000 sats in `feeNum`; the
  screen says what happened to the request. The purchase screen and its
  execution now use one fee function too.
- **BRC-100 skipped the request gate.** `brc100_request` overwrote the single
  pending slot and opened a new window per call: popup spam, races, promises
  that never settled. Both request families now go through `ORDPLUG_GATE`
  with the same cooldown, there is one wallet window at a time (an open one
  is focused, never duplicated), and closing it with a request pending
  answers that request with an explicit `WERR_USER_DECLINED`.
- **`isAuthenticated` / `waitForAuthentication` always said true.** They now
  reflect vault present + unlock session present + inside the auto-lock
  window (`ORDPLUG_AUTH`, tested); `waitForAuthentication` opens the unlock
  screen and resolves when the session appears, or rejects after 5 minutes.
- **"Remove wallet" left 20+ keys behind.** Certificates, BRC-100 grants,
  budgets and history, address book, inscription history, chain tips, spent
  guard, per-address domain caches, cooldowns and the viewer's Cache Storage
  all survived and re-attached on a later restore. `removeWalletNow()` now
  runs `wipeAllWalletData()`: `ALL_WALLET_STORAGE_KEYS` + every key under the
  `ordplug_` / `ordnet_` / `web3domains:` prefixes, `session.clear()`, every
  cache bucket — and a test fails if a storage-key literal appears in `src/`
  that the wipe does not cover.
- **BIP39 checksum.** `validateMnemonic()` only checked count + word list; a
  typo that is itself a valid word opened a different, empty wallet. Full
  checksum validation with a readable reason (`mnemonicProblem`).

### Changed
- **Recovery flow.** New wallets: "I wrote it down" → three random words must
  be typed back before anything is encrypted. Imports: a live, mandatory
  address preview under the phrase/WIF; the Import button is disabled until
  the checksum passes and the address it opens is on screen. The create
  screen states that the phrase is shown in this session only.
- **Approval screen** (item 21): the amount that leaves the wallet first and
  big, then one row per output (payment / inscription / OP_RETURN / change),
  the ORDnet service fee as its own row with its output count, the miner fee
  with its provenance (wallet / page / capped), and the inputs used.
- **Certificates and x402 are reachable.** `acquireCertificate`,
  `listCertificates`, `proveCertificate`, `relinquishCertificate` and
  `payX402` were implemented in the popup but missing from the background
  worker's allow-list, so no dApp could call them. One registry
  (`src/brc100-methods.js`) now feeds the background worker and the popup;
  a test checks the page shim and the handlers against it.
- **BRC-100 page shim times out** after 5 minutes with `WERR_TIMEOUT`
  instead of hanging forever (the ordplug provider already did this).
- **A balance outage is not zero.** `getBalance()` throws on non-2xx or a
  body without numeric fields; the home screen says "unavailable — not zero,
  just unknown", a page gets an error instead of `0`.
- **Active auto-lock.** A watchdog inside the wallet window checks the
  session window every 30 s, so a window left open locks on time.
- **One content script.** `content.js` injects both `window.ordplug` and
  `window.CWI` and relays both message families; `brc100-content.js` is gone
  and the manifest has one content-script block and one matching
  web-accessible-resources block (`http(s)://*/*`).
- **Release identity.** `getVersion()` returns `ordplug-<manifest version>`
  and `window.ordplug.version` equals the manifest; the mapping table above
  is corrected; RELEASE-4.9.3.md carries the zip hash.

### Architecture
- `src/wallet.js` (4,619 lines) is split into 25 ordered modules under
  `src/wallet/` (`00-header` … `24-boot`), loaded by `wallet.html` in that
  order as classic scripts sharing one global scope — the concatenation is
  byte-identical to the former file, so behaviour is unchanged and every
  fix above landed in its own module. Tests read the module list from
  `wallet.html` (`tests/lib/wallet-src.mjs`) so they can never disagree
  with the popup.

### Tests
- 192 → 243. New `tests/v49-release-tests.mjs` (one block per item above,
  executed against the real `bsv` library in a Node vm) and
  `tests/e2e/` (Playwright, loaded-extension browser tests — see README).

### Kept as decided
- Service-fee model (11 outputs, 3,996 sats) unchanged; the approval screen
  now shows it as one labelled row with its output count.
- Host permissions stay `http(s)://*/*` (all-sites provider model).
- Licence stays source-available.

---

## [4.9.2 (V49.2)] — 2026-08-13 → submitted to the store as 4.9.2 on 2026-09-01

Third round of the external review. Full detail in
[SECURITY-FIXES-4.9.2.md](SECURITY-FIXES-4.9.2.md).

### Security
- **`relinquishCertificate` was completely ungated.** Any site could
  permanently delete any certificate, in a loop, with `saveCerts()` persisting
  each one. `relinquishOutput` was gated in 4.9.0 and the branch next to it was
  missed. Both now go through one `brc100RequireDestructive()` driven by a
  `BRC100_DESTRUCTIVE` table, and a test iterates that table and fails if any
  method in it is not gated — so the next destructive method cannot quietly
  stay open.
- **`listCertificates` passed its arguments in the wrong order.**
  `brc100RequirePermission('listCertificates', args, origin)` against a
  signature of `(origin, method, args)`, so the grant key became
  `${_address}|listCertificates|…` and every site shared one bucket: approve it
  on one dApp and every other dApp inherited it. Same class as H4, in one line.

### Tests
- 189 → 192.

---

## [4.9.0 (V49)] — 2026-08-13

Second round of the external review: two findings that were fixed on Android
and iOS in August and never ported here. Full detail in
[SECURITY-FIXES-4.9.0.md](SECURITY-FIXES-4.9.0.md).

### Security
- **H4 — the page chose its own origin.** `msg.originator` comes from the page,
  so a site could pass `originator: "https://trusted.dapp"` and get three
  things at once: the approval screen showed that name while the real site was
  asking; grants keyed on `${_address}|${origin}|…` were inherited wholesale;
  and `brc100-budget.decide()` is keyed on origin too and auto-approves inside
  an existing budget — payments up to the daily ceiling with no confirmation.
  The origin now comes from `sender.origin`, which page script cannot set.
- **H7 — the BRC-100 read surface was ungated.** `listActions`, `listOutputs`
  and `relinquishOutput` had no permission check at all. Reads now require
  per-origin consent; `relinquishOutput` confirms on every call and stores no
  grant, so a loop cannot strip the wallet behind one approval.

### Tests
- 177 → 189.

---

## [4.8.1 (V48.1)] — 2026-08-11

### Security
- **A field shown but never checked.** The purchase screen displayed
  `sellerAddress` while the listing's payment output was compared against
  `payScriptHex` — both from the same untrusted page, so the comparison was one
  attacker-supplied value against another. The expected script is now derived
  from the address the user was actually shown.

---

## [4.8.0 (V48)] — 2026-08-11

First round of the external audit: three critical findings. Full detail in
[SECURITY-FIXES-4.8.1.md](SECURITY-FIXES-4.8.1.md).

### Security
- **K5 — the approval screen showed X and signed Y.** `changeAddress` and the
  miner fee were not on the screen, so a site could name its own change address
  and take the entire remainder of the selected UTXOs behind a screen reading
  "1.000 sats". Both are now always shown, a foreign change address is flagged
  in red, and script and inscription outputs disclose their destinations.
- **K6 — on-chain content ran in the extension origin.** The viewer iframe
  carried `allow-scripts` together with `allow-same-origin`, which cancels the
  sandbox; `viewer.html` is web-accessible from every site, so any page could
  open it against an inscription of its choosing and read the session key.
- **K7 — `signMessage` was registry authentication without domain separation.**
  A site could have a domain transfer signed under a screen that read "No coins
  move." Page-originated signing now refuses reserved namespaces.
- Ordinals with padding are no longer spendable as funding, and satoshi amounts
  are no longer 32-bit truncated by `|0`.

### Tests
- 123 → 177.

---

## [4.7.2 (V47.2)] — 2026-08-11 → shipped as store version 3.5.1

### Fixed
- Provider resources are now reachable on all sites: V47/V47.1 widened where
  the legacy content script *runs* but not where the inpage provider script
  may be *loaded* (`web_accessible_resources`), so `window.ordplug` stayed
  undefined outside the old site whitelist. Access is widened to all
  http/https pages (deliberately not `file://`).
### Added
- A manifest-consistency test that guards content-script matches against
  web-accessible-resource matches, so this class of bug fails the build.

## [4.7.1 (V47.1)] — 2026-08-09

### Added
- Request gate against popup spam: only one outstanding page request at a
  time. While a request awaits review, new calls from the same origin are
  answered "already awaiting review" and other origins get "another request is
  being reviewed" — no more approval window per call, and no request can
  hijack another's pending slot. A popup closed without answering goes stale
  after 5 minutes and never wedges the wallet.
- 15-second per-origin cooldown after a rejection (cleared by an approval), so
  a hostile page can no longer hammer the user with focused approval windows.
- The gate is a pure decision core in the background worker with its own test
  suite.

## [4.7.0 (V47)] — 2026-08-09

### Changed
- The legacy `window.ordplug` injector now runs on **all** http/https sites
  (the MetaMask model), like the BRC-100 provider already did. Security stays
  at the second layer: the per-site connect approval. Audited invariant:
  before connect, a page learns only that `window.ordplug` exists — no
  address, no state; read methods auto-answer only for origins the user has
  connected. Chrome shows the standard all-sites permission warning on update.
### Fixed
- (V46.1 hotfix, merged into this build) Two literal `\n` characters written
  by the V45 build step between script tags in the wallet page rendered as
  visible text under every view — removed, and a render-sanity test suite now
  fails the build on any stray body-level text.
- (V46.1) Navigation layout redone: on nav views the scroll area and the tab
  bar sit in separate strips, so content can never slide beneath the bar.

## [4.6.0 (V46)] — 2026-08-08

### Added
- Certificate holder subset (BRC-100): acquire (direct, plaintext fields),
  list (filtered), prove (per-request selective disclosure with an explicit
  field-by-field consent screen) and relinquish. Interactive issuance and
  encrypted-field keyrings are refused explicitly — never faked. Results carry
  `signatureVerifiedByWallet:false` until binary certificate verification
  lands.
- x402 client (`payX402` provider method): pays HTTP 402 paywalls in the
  ORDnet facilitator protocol (v2, exact/bsv) through the same budget +
  confirm pipeline as every other payment, with a 100k-sat hard cap per
  payment; the wallet signs but never broadcasts — the site settles.
- "Open in full tab" button in the top bar.
### Fixed
- Fixed 600px popup height (no per-view resizing) and full clearance under
  the bottom tab bar.
### Tests
- 106/106 across seven suites.

## [4.5.0 (V45)] — 2026-08-08

### Added
- SPV gate: signAction Phase B now also requires a merkle inclusion proof per
  funding transaction, fail-closed. Prevouts are proven three ways: own UTXO
  view, sha256d hash-binding, and block inclusion.
- Per-app daily allowance: HandCash-style budget per origin (default $10,
  adjustable, revocable) for wallet-built payments; dApp-built signAction
  always confirms.
- Fiat display: USD equivalent on confirm screens (exchange rate with 5-minute
  cache; no rate available = sats only and never auto-approve).
- Index fallback: a second index provider as best-effort backup for the strict
  UTXO fetch (the fail-closed path can only get *more* available, never less
  safe).
### Tests
- 88/88 across six suites.

## [4.4.0 (V44)] — 2026-08-08

### Security
- signAction Phase A hardening (active): ordinal protection is fail-closed —
  an unreachable index refuses the review instead of silently emptying the
  protected set, and any 1-sat input is refused unconditionally. The
  informational review screen is decoupled from any signing path.
### Added
- signAction Phase B implemented but **ships disabled** (`ENABLED:false`):
  every V43.5 security gate is now real code — double prevout proof (own UTXO
  view + sha256d hash-binding of the raw funding tx), sighash locked to
  `SIGHASH_ALL|FORKID`, a dedicated Sign/Reject confirm, the key pulled only
  after all gates pass, signed bytes re-verified structurally, semantically
  and cryptographically against the approval, and a real, abortable pending
  registry (`abortAction` works).
- A security-review document with an explicit activation checklist; enabling
  is one marked line, gated on human review.
### Tests
- 70/70 across five suites, including a Phase B suite that
  interpreter-verifies produced signatures.

## [4.3.5 (V43.5)] — 2026-08-08

### Added
- signAction **Phase A** — verify + reconstruct, deliberately without signing:
  the wallet parses the signable transaction, verifies every input it is asked
  to sign (present in the tx, P2PKH to this wallet's own address, valid
  value), refuses protected ordinals (a live 1-sat outpoint can never be
  signed away inside a dApp's signAction), reconstructs the effect itself
  (what leaves, what returns) and shows it to the user, then returns an honest
  standards-shaped refusal for the signing step. Pure, unit-tested engine.
- signAction Phase B signing skeleton, disabled by design: every
  fund-affecting step is a security gate that throws until a reviewer replaces
  it with a decided implementation; tests assert it refuses to sign.
### Tests
- 54/54 across four suites.

## [4.3.0 (V43)] — 2026-08-08

### Security
- Strict Content-Security-Policy on extension pages (`script-src 'self'`,
  `object-src 'self'`, `base-uri 'none'`, `frame-ancestors 'none'`) —
  defence-in-depth for a key-holding popup.
- HTML escaping hardened to also escape single quotes and backticks, closing
  attribute-context injection via single-quoted `data-*` attributes: a hostile
  inscription name can no longer break out of an attribute.
- PBKDF2 raised to 600,000 iterations (OWASP-2023 floor), up from 310,000.
  Existing vaults still unlock and are transparently re-encrypted with a fresh
  salt at the new strength on next unlock; new wallets use 600k directly.
- District-id URL-path guard: a district id is validated as a plain 1–10 digit
  integer before it is interpolated into any API path, preventing
  path-injection into the extension's own endpoints.
### Added
- BRC-100 read-completeness: `getHeaderForHeight` answered directly by the
  background worker (keyless SPV read via the block explorer API), improving
  compatibility with SPV/BRC-100 apps without touching keys.
### Tests
- 44/44 across three suites.

## [4.2.0 (V42)] — 2026-08-06

Full feature parity with the ORD/net iOS app v2.6.2.

### Added
- Chain mechanism — unlimited back-to-back transactions: after every broadcast
  the wallet registers its own change/split outputs as immediately-spendable
  "chain tips" and guards the inputs it just spent, so Send, Inscribe, ordinal
  transfers, the UTXO tools and BRC-100 createAction run back-to-back without
  "no spendable UTXOs". Tips persist per address, are validated on
  unlock/account switch, and a mempool conflict drops the local chain with an
  inline retry message. 1-sat outputs are never chain tips.
- UTXO tools in the top bar: Split (N × X sats to your own address, 2–200,
  min 547 sats each, live validation) and Combine (all spendable UTXOs → one
  output), both on the ordinal-protected set, with two-tap confirm.
- New popup layout: the iOS five-tab bottom menu — Wallet · Browser · Domains
  · Upload · ORD/ner. Browser and Domains are now separate tabs; the UTXO
  tools button replaced the domains button in the top bar.
- Upload & Inscribe tab: inscribe images (JPEG/PNG/GIF/WebP), text and HTML as
  1Sat Ordinals, with a JPEG/PNG compression slider (compression can never
  make the file bigger) and a persistent "Inscribed successfully" section with
  one-tap TXID copy.
- ORD/ner — on-chain file browser: every inscription the address holds, with
  grid and list view. Thumbnails and previews are built via the wallet's own
  path (raw tx hex + envelope parse) — never a third-party content endpoint.
  File detail offers copy of TXID/origin/outpoint, open-in-browser and Send.
- BRC-100 provider: a key-free `window.CWI` shim injected into every page — so
  any BRC-100 app detects this wallet. All 28 methods exist; refusals are
  standards-shaped rejections. Phase 1 (keyless reads), Phase 2 (keys &
  crypto via the bundled BSV SDK inside the popup — key material never reaches
  the page, wiped on lock; BRC-43 permission grants with approval popups) and
  Phase 3 (money — every transaction confirms: outputs-only createAction via
  the existing build path with ordinal-protected UTXOs and change,
  internalizeAction, listOutputs, listActions, relinquishOutput).
- Grants manager in Settings: inspect and revoke BRC-100 grants per app.
### Fixed
- Setting/removing a content target on a root domain no longer fails with
  `invalid_domain` (registry writes now send the platform's canonical field).
- A domain listed via the Domains tab now shows a "For sale" pill in the SNS
  holdings instead of plain "held"; deliberately no duplicate second listing.
### Changed
- Permissions: 1Sat index host added (ORD/ner) and a content script on all
  URLs for the key-free BRC-100 shim (relays messages only).

## [4.1.1 (V41.1)] — 2026-08-03

### Fixed
- Spent-check fix (same bug as proven and fixed in the iOS app v2.2.3): the
  outpoint spent-check of the OpNS and SNS payment flows used the address
  unspent list, which the block explorer silently truncates on busy addresses,
  producing false `stale_outpoint` refusals. The check now queries the
  outpoint's spent-status directly: spent → refusal, unspent → continue,
  unknown (timeout/5xx) → never reported as "spent" (SNS continues with an
  inline note, since the signed resolver answer is the authority; OpNS
  fail-closed with an honest "try again in a moment"). The old address-list
  check is removed entirely.

## [4.1.0 (V41)] — 2026-08-03

Feature parity with the ORD/net iOS app v2.2.0.

### Added
- OpNS names as third holdings category: new "OpNS" tab next to SNS/BSVmaps/
  For sale — bare names (no TLD) from the OpNS index, display/resolve/send
  only. Its own status flag and error handling: a broken OpNS API only affects
  the OpNS tab. Sending an OpNS name is the existing 1-sat ordinal transfer,
  with an inline warning that a paymail binding expires on transfer.
- Paying **to** an OpNS name from Send, under four hard rules: exact match
  only (a fallback answer becomes a "did you mean …?" error, never a payment);
  the current outpoint is checked unspent right before broadcast; the holder
  address is recomputed from the outpoint's on-chain locking script and must
  equal the index's claim; paymail forms are rejected as payment target.
- Paying to SNS names via the signed resolver: type `name.tld` or
  `mailbox@name.tld` in Send — the resolver's ECDSA signature is verified
  against a pre-pinned key (both specification test vectors enforced in the
  test suite), the pay-to address is derived from the *signed* holder script
  (the unsigned address field is never trusted), a 300-second expiry is
  enforced, the outpoint is checked unspent right before broadcast, and
  two-tap confirm re-resolves at signing so a name sold in between is refused.
  Resolver errors surface inline with readable messages; the TLD list is never
  hardcoded.
- Key rotation: an unknown resolver signer triggers a cryptographic
  verification of the succession-deed chain from the pinned key; only a
  closing chain re-pins (with an inline notice) — a broken or tampered chain
  is refused and the pin stays.
### Security
- Recognition strictly separated: dotted names → SNS resolver, bare names →
  OpNS, anything else with @ → inline paymail refusal. ASCII-lowercase input
  by construction, so homograph/mixed-script strings never reach a payment
  path.
- All errors and notices stay inline in the popup — never browser alerts.

## [4.0.0 (V40)] — 2026-07-22

### Changed
- The extension now talks to the ORDnet v2 platform on its main production
  domain (previously the staging alias) in the wallet, the built-in browser
  resolver and the service worker (with a fresh cache name so every domain
  re-resolves). No functional changes beyond the endpoint switch.
- Documentation switched from the Dutch LEESMIJ to an English README.

## [3.7.2 (V37.2)] — 2026-07-21

Covers the internal 3.7.0 → 3.7.2 iterations.

### Changed
- (3.7.0) WEB3 domain management (the "MY .WEB3 DOMAINS" panel: owner list,
  whois, records, and the ten signed actions — set-target, subdomains, routes,
  remove-target, list, delist, listing-update, transfer) and the built-in
  browser resolver moved from the old registry to the new v2 platform; all 14
  calls verified 1-on-1 against the v2 server.
### Added
- (3.7.1) Search field + pagination in the WEB3 domain list: live filtering by
  name, 10 domains per page with Prev/Next and "Page x/y · N total" — the same
  pattern as the SNS list.

## [3.6.1 (V36.1)] — 2026-07-21

### Changed
- Same platform migration as 3.7.x in its minimal form: the WEB3 domain panel
  and browser resolver constants switched to the v2 platform (three constants
  across wallet, viewer and service worker, plus a fresh cache name). Nothing
  else touched.

## [3.6.0 (V36)] — 2026-07-20

### Added
- SNS names can now be listed from the wallet: the "SNS listings coming soon"
  block is gone. SNS listings go to the ORDnet on-chain marketplace; BSVmaps
  keep trading via the existing map marketplace.
- Bulk list and bulk delist now also work for SNS (max 300 per run, same
  trust-but-verify as BSVmaps).
- Delisting an SNS name sends a seller signature to the marketplace API — the
  same security pattern as BSVmaps.
- The "For sale" tab also shows active ORDnet marketplace listings with price.
### Changed
- Host permission extended to cover the marketplace endpoints.

## [3.5.0 (V35)] — 2026-07-20

*(Internal manifest version — unrelated to the public store release 3.5.0.)*

### Added
- `buyOrdinal` supports `extraOutputs`: the 0.5% marketplace fee rides along
  as an extra output in the same atomic-swap transaction (buyer pays on top).
- The approval screen shows that fee explicitly as its own line, next to
  price, miner fee and service fee.
### Security
- Safety cap: extra outputs together may never exceed 5% of the price (or 546
  sats for mini-prices) — a malicious site cannot smuggle in an absurd fee,
  and everything is always visible in the approval screen before signing.

## [3.4.0 (V34)] — 2026-07-12 — store version from 2026-07-19 until 4.9.2 is approved

### Added
- Full .web3 domain management on the domain detail screen:
  - Subdomains: add/remove, each pointing to a TXID (optionally TXID:vout).
  - Subpages (routes): add/remove path routes, optionally scoped to a
    subdomain, so a domain can serve multiple pages.
  - Marketplace: list a domain for sale at a USD price, update the price, or
    delist, directly from the wallet; blocked while a purchase is pending.
  - Transfer ownership to another BSV address, requiring the user to type the
    domain name to confirm; refused while the domain is listed for sale.
  - "Remove target" button to clear a domain's target.
### Security
- Every registry action is authorized by a timestamped message signed with the
  wallet key — key ownership is the credential; no passwords or sessions.

## [3.3.0 (V33)] — 2026-07-12

### Added
- .web3 domain detail screen: clicking a domain in "My .web3 domains" opens a
  management view (whois: status, owner, current target, registration date)
  instead of just browsing to it.
- Domain target editing: point your .web3 domain at any on-chain transaction
  (TXID + output index); saving signs a set-target message with the wallet key
  and the registry verifies ownership by signature.
- "Open in browser" button on the domain detail screen.
### Changed
- Version renumbering: jumped from 2.8.2 to 3.3.0 to align with the 3.x
  domain-platform line.

## [2.8.2 (V31–V32)] — 2026-07-10/12

### Fixed
- (V31) Workaround for a marketplace server bug where listings past ~500
  registry entries were accepted with HTTP 200 but never appeared in the
  global registry: the wallet now verifies every listing actually reached the
  registry and reports failure otherwise.
- (V31) Self-healing listing flow: a stale listing by the same seller is
  automatically delisted first before re-listing, so stuck items are no longer
  un-listable.
- (V31) Delist verification checks both server stores and tells the user
  exactly where a leftover record remains.
### Added
- (V32) "My .web3 domains" section on the Browse screen: all domains owned by
  the active wallet address, clickable to open in the built-in browser, with
  status badges (including "For sale · $price" for domains listed on the
  domain marketplace), a refresh button and a 10-minute per-address cache.

## [2.8.1 (V30)] — 2026-07-10

### Changed
- Delisting got a dedicated confirmation screen (item, type, listed price,
  UTXO location, seller address) with an explicit "Confirm & sign delist"
  button, replacing the small inline two-click confirm; success reports
  "removed and verified gone from the registry" and returns to the same tab
  and page.

## [2.8.0 (V29)] — 2026-07-10

### Added
- Optional account-name field on wallet creation and import.
- Bulk delist: on the "For sale" tab the bulk button switches to delist mode.
- Bulk selection accumulates across pages (up to 300 items per run); the
  toggle-all link became per-page "Select/Deselect page".
- Trust-but-verify for delist: after the server answers OK the wallet
  re-checks the listings registry and only reports success when the listing is
  actually gone.
### Fixed
- Pagination state preserved when returning to the home screen or refreshing
  holdings (after listing an item on page 6 you land back on page 6).

## [2.7.0 (V28)] — 2026-07-10

### Changed
- Bulk list redesigned from a separate screen into an inline selection mode on
  the holdings list: checkboxes per row, eligible items pre-selected,
  select/deselect-all, price panel above the list, and a two-click arm/confirm
  button ("Sign N listings" → "Confirm: N × price"). After a run the list
  refreshes in place.

## [2.6.1 (V27)] — 2026-07-10

### Fixed
- Raw transaction fetches now use an in-memory cache plus retry with
  exponential backoff on HTTP 429, so bulk operations no longer fail on the
  block explorer's rate limit; bulk-claimed BSVmaps sharing one claim tx need
  only one fetch. Bulk listing also inserts a 250 ms pause between items.

## [2.6.0 (V26)] — 2026-07-10

### Added
- Bulk list: list every unlisted BSVmap on the current page at one price per
  item, with review/confirm, per-item signing progress and a result summary.
- Delist for listed items, signed with the seller key and verified by the
  marketplace API.
### Changed
- Listed items show a compact price pill; "For sale" tab moved to its own row
  next to the new Bulk list button; home screen rebranded ("BitcoinSV Wallet —
  Powered by ORDnet.io").

## [2.5.1 (V25)] — 2026-07-10

### Security
- The injected wallet provider is no longer web-accessible to all URLs — it is
  restricted to the project's own sites and the map-marketplace site.
- Content-script injection on localhost removed and a legacy third-party host
  permission dropped: the extension now only requests the domain registry API,
  the block explorer API and the map/marketplace site.
### Changed
- The viewer's blockchain router is now a static packaged service worker
  (MV3-policy-compliant) instead of runtime-generated blob code — same
  behavior: resolves names via the registry, fetches raw transactions,
  extracts inscription content and serves it with long-lived caching.
- The UI font is now bundled locally; the remote font stylesheet was removed
  (privacy/offline improvement).

## [2.5.0 (V24)] — 2026-07-10

### Changed
- `sendTx` scaled up for bulk operations: output limit raised from 100 to 350
  (sized for bulk claims of ~300 map districts in one transaction) and funding
  selection now considers up to 200 UTXOs.
### Fixed
- Byte-accurate fee estimation per output with iterative UTXO selection —
  prevents underpaying fees on large or data-heavy transactions.

## [2.4.1 (V23)] — 2026-07-10

### Fixed
- `sendTx` OP_RETURN outputs were built with 0 satoshis, which nodes reject as
  dust; they now carry 1 sat, so data transactions broadcast successfully.
  Raw-script outputs with 0 sats are rejected up front with a clear error.

## [2.4.0 (V22)] — 2026-07-10

### Added
- `sendTx` provider method: a site can compose one transaction with multiple
  output types (P2PKH payments, ordinal inscriptions, OP_RETURN data, raw
  scripts — up to 100 outputs), optional custom change address, service-fee
  opt-out and no-broadcast mode — all approved in a single approval screen
  that itemizes every output and shows the service fee.

## [2.3.0 (V21)] — 2026-07-10

### Fixed
- Listed BSVmaps now actually show as "listed" with their price: the wallet
  merges the marketplace listings feed into the holdings (the base indexer
  kept reporting listed districts as "held").
- Satoshi amounts are no longer cast with a 32-bit `|0`: amounts above ~21.47
  BSV are no longer silently corrupted in approval displays and transaction
  building.

## [2.2.0 (V20)] — 2026-07-10

### Added
- "For sale" tab showing all currently listed items (replaces the short-lived
  ".web3" holdings tab), with price badges on listed items and listed items
  sorted to the top.
- Two-step listing flow: a "Review listing" summary (item, type, price in BSV
  and sats, payout address, outpoint) before a separate "Confirm & sign" step.
### Fixed
- After a successful listing the confirm buttons hide, preventing signing the
  same listing twice.

## [2.1.0 (V19)] — 2026-07-10

### Added
- ".web3" holdings tab listing domains registered to the wallet address
  (view-only, opens in the built-in viewer).
### Changed
- Listing prices are now entered and displayed in BSV instead of sats (with a
  live sats hint); holdings loading fails soft per tab with its own error note
  instead of replacing the whole list.

## [2.0.0 (V17–V18)] — 2026-07-09

### Added
- Ownership check when sending an ordinal: the wallet compares the ordinal's
  on-chain owner with the active wallet key and refuses to build the
  transaction if they differ, telling the user which address actually owns the
  ordinal — shown as an immediate warning banner when the screen opens, plus
  an "Active wallet" row showing which address will sign.
### Fixed
- (V18) Ordinal sends could still fail with a script verification error: the
  wallet now fetches the raw transaction hex and parses the output script
  itself, instead of trusting the explorer's verbose JSON, which mangles
  nonstandard envelope-first ordinal scripts.

## [1.9.1 (V16-2)] — 2026-07-09

### Fixed
- Ordinal transfers and marketplace purchases now fetch the real locking
  script of each funding UTXO instead of assuming plain P2PKH — fixes
  broadcast failures when a funding UTXO carried a different script.
- Every input of an ordinal transfer is verified locally with the script
  interpreter before broadcast; failures surface as a clear per-input message
  and the transaction is not broadcast.

## [1.9.0 (V16-1)] — 2026-07-09

### Added
- Separate Settings screen (gear icon): auto-lock, backup, address book,
  connected sites, change password, lock now and remove wallet moved out of
  the Accounts screen.
- "Other wallet" preset import is now also available when adding an extra
  account, not just at initial import.
### Fixed
- Switching or removing an account updates the UI immediately and shows an
  explicit error if the vault save fails; long error text no longer overflows
  alert boxes.

## [1.8.0 (V15)] — 2026-07-09

### Changed
- Holdings redesigned into a tabbed view (SNS names / BSVmaps with count
  pills) with a search box and pagination (20 per page).
- Browse screen "Quick Access" renamed to "ORD/net Apps" and expanded from 5
  to 11 app shortcuts, now opening the apps' regular websites in a new tab.

## [1.7.0 (V14)] — 2026-07-09

### Added
- Address book: save/label/remove trusted recipient addresses, a recipient
  dropdown on the Send screen, and a post-send "save this address" shortcut.
- Live send-safety warnings before signing: first-time recipient, sending to
  your own address, sending (nearly) the entire balance, and the address-book
  label for known recipients.
### Security
- "Paste" button on the Send field that validates the clipboard content is a
  real BSV address — a defense against clipboard-hijack malware.

## [1.6.0 (V13)] — 2026-07-09

### Added
- "Other wallet" import mode with ~10 known BSV wallet presets (RelayX,
  Yours/Panda, Twetch, Money Button, Simply Cash, ElectrumSV, HandCash 1.x,
  Centbee, Edge, plus custom), each applying that wallet's documented
  derivation path automatically, with alternate paths and an optional
  PIN/passphrase field where relevant.
- Custom BIP32 derivation-path input (validated) for advanced imports, and a
  "Preview address" button showing which address(es) a preset would import
  before committing.

## [1.5.0 (V12)] — 2026-07-09

### Added
- Password-gated backup screen: reveal the account's private key (WIF) and,
  when available in the session, its recovery phrase — the reveal always
  re-verifies the password by decrypting the vault.
- Change password (re-encrypts the vault with a fresh salt).
- Connected sites screen with per-site disconnect.
- "Send max" button (full spendable balance minus fees).
### Changed
- Activity-based auto-lock: any click or keypress refreshes the unlock timer,
  so the wallet no longer locks mid-use.

## [1.4.0 (V11)] — 2026-07-09

### Security
- The wallet is now encrypted at rest: keys stored only as an AES-256-GCM
  vault with a PBKDF2-SHA256 password-derived key. Password setup on
  create/import, an Unlock screen, "Lock wallet now" and configurable
  auto-lock (5 min – 4 h), with the unlocked key held only in session memory.
- One-time migration screen upgrading existing plaintext wallets into the
  encrypted vault; legacy plaintext storage is wiped afterwards.
### Added
- Standard BIP44 key derivation for new wallets, with three import modes:
  BIP44 phrase, Legacy (earlier ORD/plug versions) or WIF.
- "Receive BSV" screen with QR code and copy-to-clipboard.
- Transaction history screen with click-through to the block explorer.
### Changed
- The separate toolbar popup was removed — the extension icon now opens the
  wallet directly; the old launcher lives on as the "Browse" view inside the
  wallet. UI refresh with a consistent SVG icon set.

## [1.2.0 (V9)] — 2026-07-07

### Added
- "Send ordinal" screen: true 1Sat Ordinal transfer of an SNS name or BSVmap
  district, with an explicit irreversibility warning and fee breakdown.
- "List for sale": list a BSVmap via a one-sided atomic swap (partial
  transaction, `SIGHASH_SINGLE|ANYONECANPAY`) — non-custodial, the ordinal
  stays in the wallet until a buyer pays the exact price.
- Provider methods `listOrdinal` and `buyOrdinal` with dedicated approval
  screens; the buy path verifies the listing's payment output matches the
  advertised price before signing.
### Security
- Ordinal protection: coin selection skips 1-sat UTXOs when funding payments,
  so SNS names and BSVmaps can't be accidentally spent as fees.

## [1.1.0 (V8)] — 2026-07-07

### Added
- **ORD/plug wallet** — a full BSV wallet built into the extension: create a
  wallet with a 12-word recovery phrase or import via phrase/WIF, multiple
  accounts (add, import, rename, switch, remove), balance display, Send BSV,
  and on-chain holdings ("My SNS names" and "My BSVmaps") from the project's
  indexer. (Keys stored in plaintext at this stage; encryption followed in
  1.4.0.)
- dApp provider: `window.ordplug` injected on the project's own sites,
  exposing connect, getAddress, getPublicKey, getBalance, pay, inscribe,
  signMessage and purchase — every request opens an extension approval popup
  routed through the background worker.
- New wallet and BSVmap tiles in the toolbar popup.

## [1.0.0 (V4–V7)] — 2026-05-04 … 2026-07-07

Initial archived line of the extension: a web3 browser with a toolbar popup
("Quick Access" app tiles) and a viewer that resolves ORDnet TLD domains
(.web3 and friends) straight from the blockchain.

### Changed
- (V5) Visual polish: new extension icons, SVG tile icons on gradient badges,
  updated app descriptions and viewer navigation glyphs.
- (V6) App shortcuts now navigate via human-readable .web3 domain names
  instead of hardcoded inscription TXIDs, so shortcut targets can be updated
  on-chain without shipping a new extension.
- (V7) No user-visible changes (packaging only).
