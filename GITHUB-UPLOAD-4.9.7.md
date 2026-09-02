# Uploading 4.9.7 to GitHub — exact steps

GitHub's web upload ADDS and OVERWRITES but never DELETES, and drag-and-drop
skips dot-folders like `.github`. So a clean sync needs three parts:

## 1. Upload the tree
Repo page → **Add file → Upload files** → drag the CONTENTS of the
`ORDnet-Chrome-Wallet-4.9.7` folder (not the folder itself) into the drop
area. Commit title: `V49.7 — home simplification + repository housekeeping`.
(The `.github` folder will be skipped by the browser — that is expected;
part 3 handles it.)

## 2. Delete the three stale files (once)
For each file: open it on GitHub → click the trash icon (⋯ → Delete file)
→ commit. Files:
- `src/wallet.js`
- `src/brc100-content.js`
- `RELEASE-4.9.5.md`
(One commit per file is fine; or do all three in one commit via
github.dev — press `.` on the repo page — if you prefer.)

## 3. Fix the two workflow files (web editor)
- Open `.github/workflows/test.yml` → pencil icon → replace the WHOLE
  content with the block below → commit `ci: restore unit-test workflow`.
- **Add file → Create new file** → name: `.github/workflows/e2e.yml` →
  paste the second block → commit `ci: e2e workflow, manual trigger only`.

### test.yml
```yaml
name: tests

on:
  push:
    branches: [main, master]
  pull_request:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Run all suites
        run: for t in tests/*.mjs; do echo "== $t"; node "$t" || exit 1; done
```

### e2e.yml
```yaml
name: e2e (loaded extension)

on:
  workflow_dispatch:

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install Playwright
        working-directory: tests/e2e
        run: npm install && npx playwright install --with-deps chromium
      - name: Run loaded-extension tests (headed, under xvfb)
        working-directory: tests/e2e
        run: xvfb-run --auto-servernum -- npx playwright test
```

## 4. Check
Actions tab → the newest run is called **tests** and turns green.
Then tag the release: Releases → Draft a new release → tag `v4.9.7`.
