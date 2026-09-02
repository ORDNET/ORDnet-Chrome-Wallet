# ORD/plug — ORDnet Web3 Browser & Wallet

[![tests](https://github.com/ORDNET/ORDnet-Chrome-Wallet/actions/workflows/test.yml/badge.svg)](https://github.com/ORDNET/ORDnet-Chrome-Wallet/actions/workflows/test.yml)
[![test count](https://img.shields.io/badge/tests-251_across_11_suites_%2B_e2e-2b8a3e?style=flat-square)](#tests)
[![platform](https://img.shields.io/badge/platform-Chrome_Manifest_V3-364fc7?style=flat-square)](#what-this-extension-may-touch)
[![store](https://img.shields.io/badge/Chrome_Web_Store-ORDnet_Web3_Browser-5f3dc4?style=flat-square)](#versioning)
[![license](https://img.shields.io/badge/license-source--available-6a737d?style=flat-square)](LICENSE)

Chrome extension for the on-chain web: browse `.web3` domains, hold and send
BSV, manage SNS/OpNS names and BSVmaps on 1Sat Ordinals, inscribe files,
read your on-chain mail and files, and connect BRC-100 apps — with your keys
encrypted locally and never leaving your machine.

Live in the Chrome Web Store as **ORDnet Web3 Browser**. This repository is
version **4.9.6**; the store version, the git tag, the manifest,
`getVersion()` and `window.ordplug.version` carry the same number (see
[Versioning](#versioning)). It contains the complete, unminified source of the
shipping extension, published source-available: a wallet you can read and audit before you trust — while the code itself remains ORDnet's.

## Features

- **Web3 browsing** — resolve and open `name.web3` (and the other recognised
  TLDs) straight from the extension; content is on-chain 1Sat Ordinals
  inscriptions.
- **Home = your balance** (4.9.6) — amount, address, Send / Receive, and four
  category rows (SNS domains, OpNS domains, BSVmaps, For sale) that open one
  list at a time; tap a name for its detail screen with every action.
- **Wallet** — create with a 12-word BIP39 phrase (BIP44,
  `m/44'/236'/0'/0/0`) or import via phrase / WIF; multiple accounts;
  encrypted local storage; password-gated backup.
- **Names & assets** — SNS and OpNS name management, BSVmap support,
  send/receive of 1Sat ordinals with inscription-aware coin selection (your
  on-chain mail and files are never spent as money).
- **Inscribe** — write files and data on-chain from the extension.
- **BRC-100 provider** — `window.ordplug` plus the BRC-100 interface on all
  http/https sites (the MetaMask model): before you approve a connection, a
  page learns only that the provider exists — no address, no state. Requests
  are gated one-at-a-time with per-origin cooldowns against popup spam.
- **SPV & verification** — transaction verification and SNS signed-answer
  checking built in (`src/spv-verify.js`, `src/sns-verify.js`).
- **x402 client** — pay-per-call API access over HTTP 402.

## Security model

The non-negotiables, enforced in code and covered by tests:

1. **Keys stay local.** The WIF is stored encrypted, decrypted only to sign,
   used for local ECDSA only, and never serialised into any message,
   storage payload, or network call.
2. **Consent before knowledge.** No site learns an address or any wallet
   state before the user approves the connection for that origin.
3. **One request at a time.** A pure decision core in the background worker
   gates page requests; rejected origins cool down for 15 seconds; stale
   popups can never wedge the wallet.
4. **Honest coin selection.** 1-sat inscription outputs are excluded from
   spendable funds — mail and files cannot be accidentally destroyed by a
   payment.
5. **The screen is the bytes.** (4.9.3) For every page-requested payment,
   inscription or `sendTx` the wallet builds the unsigned transaction first,
   renders the approval from that exact object, and after consent signs the
   same object and re-checks its fingerprint. A page can suggest a miner
   fee; it is clamped to at most 2× the wallet's own estimate and the screen
   says so.
6. **One gate for both providers.** (4.9.3) `window.ordplug` and the BRC-100
   `window.CWI` share the request gate, one wallet window, the cooldown, and
   an explicit answer when that window is closed unanswered.
7. **Remove means remove.** (4.9.3) "Remove wallet" wipes every storage
   key, the session, and the on-chain content cache — a test fails if a new
   storage key is ever added without being covered.

Deeper reading: [SECURITY-REVIEW-V44.md](SECURITY-REVIEW-V44.md) (the
signAction security review) and [SIGNACTION-SCOPE.md](SIGNACTION-SCOPE.md).

## What this extension may touch

Chrome shows permission warnings at install; here is what each one is and
why it exists — verifiable against [`manifest.json`](manifest.json):

| Permission | Why |
|---|---|
| `storage` | The encrypted wallet, settings and per-origin grants live in extension storage. The only Chrome API permission requested. |
| `names.ordnet.io`, `*.ordnet.io` | Name resolution, on-chain content and the ORDnet services the wallet talks to. |
| `api.whatsonchain.com`, `ordinals.gorillapool.io`, `api.bitails.io` | Public chain data: balances, UTXOs, inscriptions, broadcast. |
| `bsvmap.io` | BSVmap tile data. |
| Content script on `http(s)://*` | One script (`src/content.js`) injects the `window.ordplug` / BRC-100 provider so any site *can ask* to connect. Before you approve an origin, a page learns only that the provider exists — no address, no state (security model, point 2). Chrome labels this "read data on all sites"; the wallet reads nothing, it only offers the provider. |

Notable absences: no `tabs`, no `history`, no `webRequest`, no
`clipboardRead`, no `<all_urls>` API permission — the broad-sounding
content-script match exists solely to offer the provider, and the request
gate decides everything after that.

## Install from source

1. Clone or download this repository.
2. Open `chrome://extensions`, enable **Developer mode**.
3. **Load unpacked** → select the repository folder.

The extension is self-contained — no build step, no `npm install`.

## Source layout

```
manifest.json            MV3 manifest — version 4.9.6
src/background.js        service worker: routing, request gate, auth state, one wallet window
src/brc100-methods.js    THE list of BRC-100 methods (direct / popup / refused) — shared
src/content.js           the one content script: injects both providers, relays both families
src/inpage.js            window.ordplug (page world)
src/brc100-inpage.js     window.CWI, BRC-100 (page world)
src/wallet.html          the popup
src/wallet/00-…24-*.js   the popup engine, 25 ordered modules (was one 4,619-line wallet.js
                         until 4.9.2): config, keys, vault, network/chain, tx build,
                         setup/unlock, accounts, holdings, names, marketplace, approval,
                         send/receive, domains, security, utxo tools, upload, ORD/ner,
                         BRC-100 popup side, events, boot
src/viewer.html/.js      sandboxed on-chain content viewer
src/*.js                 engines: sns-verify, ord-parse, spv-verify, brc100-certs,
                         x402-client, brc100-budget, brc100-signaction(+phaseB)
tests/*.mjs              bare-Node suites;  tests/e2e/  Playwright loaded-extension tests
```

## Tests

```bash
for t in tests/*.mjs; do node "$t"; done
# -> eleven summaries, 251 passed in total, 0 failed
```

Eleven suites, 251 tests, on bare Node ≥ 18: signAction phases A/B, SNS
verification, security gates, SPV & budget, certificates & x402, HTML
sanity, the V47 request gate, the V48 audit-regression suite, and the V49.3
release suite (fee clamp and plan/fingerprint against the real `bsv`
library, BRC-100 gate, method registry, full wipe coverage, BIP39 checksum,
auth state, release identity). The manifest-consistency test guards the
single content script against the web-accessible-resource matches.

**Loaded-extension tests** (`tests/e2e/`, Playwright): the real route page →
content script → background → popup, in Chromium with the extension
installed — providers on an http page, `getVersion` / `isAuthenticated`,
refusal errors, create-with-recovery-challenge, live import preview, and the
gate refusing a second request while one is pending. They need a headed
Chromium, so they are not part of the bare-Node loop:

```bash
cd tests/e2e && npm install && npx playwright install chromium && npm test
# CI: .github/workflows/e2e.yml (xvfb)
```

## Versioning

From 4.9.2 (submitted 1 September 2026) the Chrome Web Store version equals
the manifest version, the git tag, `getVersion()` (`ordplug-4.9.6`) and
`window.ordplug.version`. Before that the store was on 3.4.0 (build V34)
while development continued to 4.9.2 — the corrected mapping table and the
full history are in [CHANGELOG.md](CHANGELOG.md); the release zip hash is in
[RELEASE-4.9.6.md](RELEASE-4.9.6.md).

## Related

- [ODNCA-standards](https://github.com/ORDNET/ODNCA-standards) — the naming standards this wallet implements
- [ORDnet-SNS-client](https://github.com/ORDNET/ORDnet-SNS-client) — the standalone resolution/verification library
- [ODNCA-verify](https://github.com/ORDNET/ODNCA-verify) — offline ownership-certificate verification

## License

**Source-available, not open source.** The complete code is published here
for transparency and security audit — read it, verify it, report findings —
but copying, modification, redistribution, and use in other products
require written permission from ORDnet. See [LICENSE](LICENSE).
