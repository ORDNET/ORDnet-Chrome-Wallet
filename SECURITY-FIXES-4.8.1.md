# Security fixes — ORD/plug Chrome extension (manifest 4.8.1)

**Released:** 11 August 2026
**Supersedes:** manifest 4.7.2 (4.8.0 was superseded same-day by 4.8.1, see pattern 3)

An external review of the ORDnet repositories on 11 August 2026 reported three
critical, fund- or key-affecting issues in this extension, plus two recurring
patterns that cut across all three wallets. All five are fixed here, each with
a regression test.

Anyone running a build before 4.8.0 should update.

---

## K5 — The approval screen showed X and signed Y

**Was:** `sendTx` accepted a `changeAddress` from the calling page:

```js
const changeAddr = params.changeAddress ? bsv.Address.fromString(String(params.changeAddress)) : from;
```

The approval screen rendered `outputs[]` and the service fee, and nothing else.
Not the change address. Not the fee.

So this call:

```js
ordplug.sendTx({ outputs:[{ type:'p2pkh', address:'1Legit…', satoshis:1000 }],
                 changeAddress:'1Attacker…' })
```

showed the user **"#0 Payment 1.000 sats → 1Legit…"** while the entire
remainder of the selected UTXOs went to the attacker. Against the mobile
engines the reviewer's proof of concept moved 99.994.914 sats — 99,99% of the
balance — in a single approved transaction.

A second variant did the same through the fee: `fee: <balance - 1000 - 3996>`
sent the balance to the miner, with the screen still reading 1.000 sats.

Two further outputs were disclosed only partially: a `script` output showed its
amount but not its destination, and an `inscription` output showed neither the
destination nor, in the OP_RETURN case, an un-truncated preview.

**Now:**

- **The change address is always a line on the screen.** When it is the user's
  own, it says so. When a site names a different one, the row turns red, is
  labelled *"⚠ Change goes to"*, and a sentence underneath spells out what that
  means: everything above the listed amounts leaves the wallet.
- **The fee is always a line.** When the wallet calculates it, the screen says
  so. When the site sets one, the row is highlighted and attributed: *"⚠ Miner
  fee set by site"*.
- **`script` outputs disclose their destination.** The common P2PKH shape is
  decoded to an address; anything else is labelled as a custom script with its
  byte length, which is itself the warning.
- **`inscription` outputs show the receiving address.**
- **OP_RETURN previews are truncated before escaping, not after** — the old
  order could cut an HTML entity in half.

## K6 — On-chain content ran in the extension origin

**Was**, in `src/viewer.html`:

```html
<iframe id="viewFrame" sandbox="allow-scripts allow-same-origin allow-downloads"></iframe>
```

`allow-scripts` together with `allow-same-origin` cancels the sandbox, and a
`srcdoc` document inherits the parent's origin — here, the extension origin.
`viewer.html` is a `web_accessible_resource` for `http://*/*` and
`https://*/*`, so any page could open it:

```js
window.open('chrome-extension://<id>/src/viewer.html?q=<txid>')
```

with a `txid` pointing at HTML the attacker inscribed themselves. That payload
then ran with extension privileges and could read
`chrome.storage.session['ordplug_session_v11']` — which holds the raw AES key
bits. No password needed. Every WIF of every account.

**Now:** `allow-same-origin` is gone. The inscription still runs its own
scripts, but in an opaque origin: no extension APIs, no access to the parent
document, no shared storage. A `referrerpolicy="no-referrer"` is added.

The regression test asserts the attribute is absent **and** walks every
`<iframe>` in the file to make sure the combination is not reintroduced
elsewhere — this is exactly the kind of fix a later edit undoes by accident.

### Service worker hardening (same attack surface)

`sw.js` served every inscription from the extension origin with a
`Content-Type` chosen by whoever inscribed it, and without `nosniff`. Responses
now go through `safeHeaders()`, which sends `X-Content-Type-Options: nosniff`
and a sandboxing CSP, and replaces any content type outside a render allowlist
with `application/octet-stream`.

> **Please test this one in a browser before you ship it.** Removing
> `allow-same-origin` is the correct security fix, but on-chain pages that
> relied on same-origin features (`localStorage`, same-origin `fetch`) will
> behave differently. Images, styles and scripts render as before. Load a few
> known inscriptions through the viewer and confirm they still display.

## K7 — `signMessage` was registry authentication without domain separation

**Was:** `signAction()` authenticates against `domains.ordnet.io` by signing

```
ordnet-registry|<action>|<fields…>|<timestamp>
```

and the same `signMessage` primitive was exposed, unfiltered, to every website
through `inpage.js`. So a page could ask for:

```js
ordplug.signMessage('ordnet-registry|transfer|victim.web3|1AttackerAddr|1765000000')
```

under an approval screen that read, in full: *"Sign this message with your key.
**No coins move.**"* After approval the site POSTs the signature to
`domains.ordnet.io/wallet/transfer` and the domain has changed hands. The same
worked for `delist`, `list`, `set-target`, `subdomain` and `route`.

**Now:** the registry wire format cannot change without breaking the server, so
the separation is enforced on the way in. `signMessageExternal()` refuses any
message whose first pipe-delimited field is a reserved namespace
(`ordnet-registry`, `ordpay/v1`, `ordnet-wallet`, `odnca`), case-insensitively
and whitespace-tolerantly, with an error that tells the user to use the Domains
tab instead. The page-facing route calls that variant; `signAction()` keeps
calling the raw signer, so the registry keeps working unchanged.

The approval screen also changed. *"No coins move"* was true of the transaction
and misleading about the consequence, so it now reads: **"No coins move — but a
signature can authorise actions on any service that accepts it."** And the
message is shown in full (up to 2.000 characters, with an honest note when
there is more) instead of being silently cut at 200.

---

## Recurring pattern 1 — ordinal protection was `value > 1`

**Was:** `getUTXOs` protected ordinals with a single heuristic — skip 1-sat
outputs. Every ordinal that carries padding, which is the norm for transfers
from marketplaces and from other wallets, passed that filter and was available
as funding. The reviewer burned a 2-sat inscription through `buildConsolidate`
to demonstrate it.

The sharp edge: **the wallet already knows which outpoints are inscriptions.**
`_holdings` carries `currentTxid`/`currentVout` for every SNS name and BSVmap
it has loaded. That knowledge simply was not used in the funding path.

**Now:** `protectedOutpoints()` builds a set from the loaded holdings, and
`getUTXOs` excludes those outpoints whatever their value — for both the fetched
UTXO list and the wallet's own chain tips. The `value > 1` heuristic stays as a
first line of defence for holdings that have not loaded yet.

## Recurring pattern 2 — `|0` on satoshi amounts

**Was:** three lines under the file's own warning —

```js
/* sats as a safe integer — NEVER use `|0` on sat amounts: it is a 32-bit cast
   and silently corrupts anything above 21.47 BSV */
```

— four call sites did exactly that: `(params.fee|0)` in `buildTx`, and
`(p.params.fee|0)` in the approval display and in the `pay` and `inscribe`
paths. The reviewer's proof of concept passed `fee: 3000000000` and got a
reported fee of `-1294967296` on a signed transaction with 1,39 billion
satoshis of output against 100 million of input.

**Now:** `feeNum()` replaces every one of them. It accepts only a real number
or a plain numeric string, rounds to a safe integer, and returns 0 for
anything negative, non-finite, beyond `MAX_SAFE_INTEGER`, or clever (an object
with a `valueOf`). A returned 0 means "no explicit fee", so the wallet
calculates its own — the safe default. A test asserts no `.fee|0` survives
anywhere in the file.

---

## Recurring pattern 3 — a field shown but never checked

**Was**, in `buildPurchaseFromPartial()`:

```js
if (!out0 || out0.satoshis !== priceSat || out0.script.toHex() !== payScriptHex)
  throw new Error('Listing payment output does not match the advertised price — refusing.');
```

The approval screen showed **Seller: 1Alice…**, taken from `params.sellerAddress`.
The check compared the listing's payment output against `params.payScriptHex`.
Both fields arrive in the same object, from the same page, and the partial
transaction comes from there too — so the comparison was one attacker-supplied
value against another. A site could show one seller and pay a different one,
and the field the user actually read never touched the decision.

That is worse than no check. It reads as verification and produces confidence.

**Now:** `buildListingPartial()` always pays to a plain P2PKH of the seller's
own address, so the expected script is **derived** from `sellerAddress` — the
only thing the user consented to — and the output is compared against that.
`payScriptHex` is still cross-checked, but it is no longer the authority: an
advertised script that does not belong to the shown seller is itself a refusal.
An unparseable seller address is refused rather than skipped.

The comparison lives in a pure `checkListingOutput()` so it can be tested
without a transaction.

---

## Tests

```bash
for t in tests/*.mjs; do node "$t"; done
```

**177 tests across ten suites**, up from 123 across nine. The new
`tests/v48-audit-tests.mjs` contributes 54 and mixes two kinds of check:

- **behavioural** — the pure helpers (`feeNum`, `reservedNamespaceOf`,
  `protectedOutpoints`, `safeHeaders`) are lifted out of the source and
  exercised against the reviewer's own payloads, including the exact transfer
  string and the exact 3-billion-satoshi fee
- **structural** — assertions on the source itself, for the fixes that live in
  markup or at a call site: that the iframe carries no `allow-same-origin`,
  that the page-facing route uses the guarded signer while `signAction` does
  not, that the change address and fee rows are rendered, and that the listing
  check derives its expected script from the seller address rather than reading
  it back out of the params

The structural ones earn their place. Nothing stops a later edit from putting
`allow-same-origin` back, and no unit test would notice.

## Not fixed here

Findings that live in other repositories are tracked with those repositories.
Within this one, the audit's remaining items are documentation-level: the
"byte-identical crypto engine across all three" claim (the vendored libraries
are identical; `wallet.js` is a separate implementation from the mobile
`wallet-core.js`, sharing conformance vectors rather than bytes), and the
committed `ORDnet-Chrome-Wallet.zip` build artefact, which the `.gitignore`
now covers but which still needs removing from the tree.
