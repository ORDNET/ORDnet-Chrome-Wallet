# Release 4.9.3 (V49.3) — 2026-09-01

One identity, everywhere:

| Where | Value |
|---|---|
| `manifest.json` version | `4.9.3` |
| git tag | `v4.9.3` |
| Chrome Web Store version | `4.9.3` (submit after 4.9.2 is approved) |
| `window.CWI.getVersion()` | `{ version: "ordplug-4.9.3" }` |
| `window.ordplug.version` | `4.9.3` |
| store package | `ordplug-store-4.9.3.zip` — built by `scripts/build-store-zip.sh` (runtime files only, sorted, fixed timestamps, byte-reproducible) |
| store package sha256 | `546b974afed1e678df7f18a22821a4960c98a1948f87f91f6918c4a5431c1238` |

Rebuild and compare: `./scripts/build-store-zip.sh` prints the hash; it must
equal the value above for the same source tree.

What changed: [CHANGELOG.md](CHANGELOG.md) → 4.9.3, and
[SECURITY-FIXES-4.9.3.md](SECURITY-FIXES-4.9.3.md) for the file:line detail.

Tests: 243 across 11 bare-Node suites (`for t in tests/*.mjs; do node "$t"; done`)
plus the Playwright loaded-extension suite in `tests/e2e/`.

## Store submission notes

- Upload `ordplug-store-4.9.3.zip` (not the repository zip).
- The "broad host permissions" notice at upload is expected: the single
  content script runs on `http(s)://*/*` to offer the provider (README →
  "What this extension may touch"). Submit for review as usual.
- Store listing changelog text (paste as-is):

```
4.9.3 — Security & recovery update
• Approval screens now show exactly what will be signed: amount leaving your wallet, every output, service fee, miner fee — read from the transaction itself. A website can no longer set a hidden miner fee.
• BRC-100 requests share the one-at-a-time request gate; one wallet window; closing it answers the site.
• "Remove wallet" now erases everything the extension stored.
• Recovery phrase: full BIP39 checksum check, backup verification for new wallets, live address preview on import.
• isAuthenticated / waitForAuthentication now reflect the real unlock state.
• Certificates and x402 calls reachable for BRC-100 apps; outage is no longer shown as a zero balance; active auto-lock.
```
