# Release 4.9.6 (V49.6) — 2026-09-01

Cosmetic release on top of 4.9.3: home simplification and the names flow
(category screen → name detail → list / bulk / delist), after mockup and
screenshot review. Header icons and the five bottom tabs stay as they were.
No colours, fonts, engines, signing paths or storage keys changed.
4.9.4 and 4.9.5 were internal iterations (menu/More variant; @-tile for OpNS) and were not published.

| Where | Value |
|---|---|
| `manifest.json` version | `4.9.6` |
| git tag | `v4.9.6` |
| Chrome Web Store version | `4.9.6` (contains everything from 4.9.3 — submit this) |
| `window.CWI.getVersion()` | `{ version: "ordplug-4.9.6" }` |
| `window.ordplug.version` | `4.9.6` |
| store package | `ordplug-store-4.9.6.zip` — built by `scripts/build-store-zip.sh` (byte-reproducible) |
| store package sha256 | `61785a620f6f15f16d6660bb19e798bc304289d4e2fcdc649050fcac4fb25a40` |

Tests: 251 across 11 bare-Node suites plus the Playwright loaded-extension
suite in `tests/e2e/`. The full navigation flow (boot → home → category →
detail → list / send / delist → back, header actions, all five tabs, bulk
mode) was exercised in a jsdom harness before packaging.

## Store listing changelog text (paste as-is)

```
4.9.6 — Simpler home screen
• Home shows your balance, address and Send / Receive first, then your SNS domains, OpNS domains, BSVmaps and For sale — each opens its own list.
• Tap a name for its detail screen: list for sale, remove listing, send, manage target and routes, open in ORDnet search.
• All tools stay one tap away in the header and the bottom bar.
• Includes all 4.9.3 security and recovery fixes.
```
