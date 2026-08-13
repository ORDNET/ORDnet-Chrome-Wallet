# Security fixes — ORD/plug Chrome extension, manifest 4.9.0

**Audit:** external GitHub review of 13 August 2026
**Supersedes:** manifest 4.8.1

Two findings from the August 11 audit were fixed on Android and on iOS and
never ported here, and the 4.8.1 fix document did not mention them. Both are
closed in this release.

## H4 — the page chose its own origin

```js
src/brc100-inpage.js:31   originator: String(originator || window.location.origin || '')
src/background.js:132     origin: msg.originator || (sender.tab && …)
```

`msg.originator` comes from the page. A site could pass
`originator: "https://trusted.dapp"` and get three things at once:

- the approval screen displayed that name while `evil.com` was asking
- grants are keyed on `${_address}|${origin}|…`, so the attacker inherited
  every grant the real dApp had been given
- `brc100-budget.decide()` is keyed on origin too, and auto-approves inside an
  existing budget — **payments up to the daily ceiling with no confirmation at
  all**

**Now:** `senderOrigin(sender)` prefers `sender.origin`, which Chrome populates
from the real frame and page script cannot set. A request whose origin cannot
be determined is refused outright rather than collapsing every site into one
grant bucket. `originator` is still accepted on the wire for API compatibility
and is ignored.

## H7 — the BRC-100 read surface was ungated

`listActions`, `listOutputs` and `relinquishOutput` had no permission check of
any kind. Any site could read the full transaction history and every UTXO, and
could loop `relinquishOutput` until the wallet tracked nothing.

**Now:** `listActions` and `listOutputs` require per-origin consent, granted
once and keyed per method, in the same style as the existing BRC-100 grants.
`relinquishOutput` is destructive with no undo, so it confirms on **every**
call and deliberately stores no grant — a loop cannot drain the wallet behind a
single approval.

Android and iOS have behaved this way since August 11; the three wallets now
agree.

## Tests

187, up from 177. Ten new assertions, including that `senderOrigin` prefers
`sender.origin` over the tab URL, that consent is checked *before* the UTXO set
is read, and that the relinquish path does not persist a grant.

