# Security fixes — ORD/plug V49.2 (manifest 4.9.2)

**Audit:** third round of the external GitHub review, 13 August 2026
**Supersedes:** 4.9.0 (V49)
**Ships as:** Chrome Web Store version 3.6.0

## `relinquishCertificate` was completely ungated

`relinquishOutput` was gated in 4.9.0: destructive, so it confirms on every
call and never persists a grant. The branch **next to it** was missed.
`relinquishCertificate` had no check at all — any site could permanently
delete any certificate, in a loop, with `saveCerts()` persisting each
deletion. One approval nowhere, every certificate gone.

The fix is structural, not another one-off:

```js
/* Destructive BRC-100 calls confirm on EVERY invocation and never persist a
   grant — a loop must not be able to strip the wallet behind one approval. */
const BRC100_DESTRUCTIVE = {
  relinquishOutput:      { title: 'Give up an output', … },
  relinquishCertificate: { title: 'Delete a certificate', … }
};
```

Both methods now route through one `brc100RequireDestructive()`, driven by
that table. And the regression suite **iterates the table itself**: for every
method listed it asserts a `brc100RequireDestructive(p.origin, '<method>'`
call site exists. Add a destructive method to the table without gating it and
the suite fails — the next `relinquishCertificate` cannot quietly stay open.
That is the lesson of this finding: a fix applied to one branch is how the
branch beside it stays broken.

## `listCertificates` passed its arguments in the wrong order

One line:

```js
brc100RequirePermission('listCertificates', args, origin)   // was
brc100RequirePermission(p.origin, 'listCertificates', args) // is
```

against a signature of `(origin, method, args)`. The method name landed in
the origin slot, so the grant key became
`${_address}|listCertificates|…` — **one bucket for every site**. Approve
certificate listing on one dApp and every other dApp inherited the grant.
Same class as H4 (the page choosing its own origin), reintroduced in a single
call site.

Two tests guard it now: every `brc100RequirePermission` call site in the
wallet must pass `p.origin` as its first argument, and the read-consent
helper may not carry a `listCertificates` entry (an entry there would be dead
code pretending to be coverage).

## Tests

192, up from 189, across the ten suites — the three new ones:
`relinquishCertificate` confirms on every call, every method in the
destructive table is actually gated, and every permission call passes the
origin first.
