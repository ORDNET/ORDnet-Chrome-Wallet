# Security Policy

## Reporting a vulnerability

Please report security issues privately first. Do not open a public issue for
anything that could expose a key or move funds.

**Preferred channel:** [GitHub private vulnerability reporting](https://github.com/ORDNET/ORDnet-Chrome-Wallet/security/advisories/new)
— the "Report a vulnerability" button on the Security tab of this repository.
This creates a private advisory only the maintainers can see.

Please include what the issue is, which file and line, how to reproduce it,
and what an attacker gains.

## What to expect

- **Acknowledgement:** within 3 working days.
- **Assessment:** within 10 working days, with a severity.
- **Fix:** anything that can expose a key or move funds is prioritised over
  everything else.
- **Credit:** we will name you in the release notes unless you prefer
  otherwise.

We do not currently operate a bug bounty.

## Threat model

This is a hot wallet in a browser extension. The assumptions that matter:

1. **Every website is hostile.** The provider is injected into all http and
   https pages by design (the MetaMask model). Anything a page can call must be
   safe to call from a page that is actively trying to rob the user.
2. **The approval screen is the security boundary.** A user approves what they
   are shown. Any transaction detail that changes where value goes — outputs,
   change address, fee, script destination — must be on that screen before it
   is signed. A screen that is accurate but incomplete is a vulnerability.
3. **On-chain content is untrusted input.** Inscriptions are written by anyone.
   Rendering one must never give it the extension's origin, storage or APIs.
4. **A signature is an authorization.** Anything the wallet will sign on a
   page's request must not be replayable as an authenticated command to a
   service the wallet itself talks to.

Out of scope: a compromised operating system or browser profile, physical
access to an unlocked device, and phishing that does not involve the extension.

## Known history

Builds before manifest 4.8.1 contained three critical issues: the approval
screen omitted the change address and the fee, on-chain content ran in the
extension origin, and page-requested message signing could produce a registry
authorization. All are fixed in 4.8.1. See
[SECURITY-FIXES-4.8.1.md](SECURITY-FIXES-4.8.1.md).

Note that this repository is **source-available, not open source** — see
[LICENSE](LICENSE). Reading, auditing and reporting are exactly what it is
published for.
