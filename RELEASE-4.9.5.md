# Release 4.9.5 (V49.5) — 2026-09-01

Cosmetic release on top of 4.9.3: home simplification and the names flow
(category screen → name detail → list / bulk / delist), after mockup and
screenshot review. Header icons and the five bottom tabs stay as they were.
No colours, fonts, engines, signing paths or storage keys changed.
4.9.4 was an internal iteration (⋯ menu + More tab) and was not published.

| Where | Value |
|---|---|
| `manifest.json` version | `4.9.5` |
| git tag | `v4.9.5` |
| Chrome Web Store version | `4.9.5` (contains everything from 4.9.3 — submit this) |
| `window.CWI.getVersion()` | `{ version: "ordplug-4.9.5" }` |
| `window.ordplug.version` | `4.9.5` |
| store package | `ordplug-store-4.9.5.zip` — built by `scripts/build-store-zip.sh` (byte-reproducible) |
| store package sha256 | `4bab82ada22d6e0db9d55c8f99f5901de5838b8ab116802778c143e760f91918` |

Tests: 251 across 11 bare-Node suites plus the Playwright loaded-extension
suite in `tests/e2e/`. The full navigation flow (boot → home → category →
detail → list / send / delist → back, header actions, all five tabs, bulk
mode) was exercised in a jsdom harness before packaging.

## Store listing changelog text (paste as-is)

```
4.9.5 — Simpler home screen
• Home shows your balance, address and Send / Receive first, then your SNS domains, OpNS domains, BSVmaps and For sale — each opens its own list.
• Tap a name for its detail screen: list for sale, remove listing, send, manage target and routes, open in ORDnet search.
• All tools stay one tap away in the header and the bottom bar.
• Includes all 4.9.3 security and recovery fixes.
```
