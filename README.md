# ORD/plug — ORDnet Web3 Browser & Wallet

Chrome extension for the on-chain web: browse `.web3` domains, hold and send
BSV, manage SNS/OpNS names and BSVmaps on 1Sat Ordinals, inscribe files,
read your on-chain mail and files, and connect BRC-100 apps — with your keys
encrypted locally and never leaving your machine.

Live in the Chrome Web Store as **ORDnet Web3 Browser** (public version
3.x). This repository contains the complete, unminified source of the
shipping extension, published source-available: a wallet you can read and audit before you trust — while the code itself remains ORDnet's.

## Features

- **Web3 browsing** — resolve and open `name.web3` (and the other recognised
  TLDs) straight from the extension; content is on-chain 1Sat Ordinals
  inscriptions.
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

Deeper reading: [SECURITY-REVIEW-V44.md](SECURITY-REVIEW-V44.md) (the
signAction security review) and [SIGNACTION-SCOPE.md](SIGNACTION-SCOPE.md).

## Install from source

1. Clone or download this repository.
2. Open `chrome://extensions`, enable **Developer mode**.
3. **Load unpacked** → select the repository folder.

The extension is self-contained — no build step, no `npm install`.

## Tests

```bash
for t in tests/*.mjs; do node "$t"; done
```

Nine suites, 123 tests, on bare Node ≥ 18: signAction phases A/B, SNS
verification, security gates, SPV & budget, certificates & x402, HTML
sanity, and the V47 request gate — including the manifest-consistency test
that guards content-script matches against web-accessible-resource matches.

## Versioning

Public Chrome Web Store versions (3.x) and internal build numbers diverge;
the mapping table and the full history of all 47 internal builds are in
[CHANGELOG.md](CHANGELOG.md).

## Related

- [ODNCA-standards](https://github.com/ORDNET/ODNCA-standards) — the naming standards this wallet implements
- [ORDnet-SNS-client](https://github.com/ORDNET/ORDnet-SNS-client) — the standalone resolution/verification library
- [ODNCA-verify](https://github.com/ORDNET/ODNCA-verify) — offline ownership-certificate verification

## License

**Source-available, not open source.** The complete code is published here
for transparency and security audit — read it, verify it, report findings —
but copying, modification, redistribution, and use in other products
require written permission from ORDnet. See [LICENSE](LICENSE).
