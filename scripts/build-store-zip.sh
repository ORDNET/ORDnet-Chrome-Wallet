#!/usr/bin/env bash
# V49.3 — reproducible Chrome Web Store package (item 18).
# Packs ONLY what the extension needs at runtime (manifest, sw.js, LICENSE,
# src/, lib/, icons/, fonts/) in sorted order with a fixed timestamp, so the
# same source always yields the same bytes. Prints the sha256 that goes into
# RELEASE-<version>.md.
#   ./scripts/build-store-zip.sh   ->  ordplug-store-4.9.3.zip + sha256
set -euo pipefail
cd "$(dirname "$0")/.."
python3 - <<'PY'
import json, os, zipfile, hashlib
version = json.load(open('manifest.json'))['version']
out = f'ordplug-store-{version}.zip'
roots = ['manifest.json', 'sw.js', 'LICENSE', 'src', 'lib', 'icons', 'fonts']
files = []
for r in roots:
    if os.path.isfile(r): files.append(r)
    else:
        for d, _, fs in os.walk(r):
            files += [os.path.join(d, f) for f in fs]
files = sorted(f for f in files if not f.endswith('.DS_Store'))
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in files:
        zi = zipfile.ZipInfo(f, date_time=(2026, 1, 1, 0, 0, 0))   # fixed: reproducible
        zi.compress_type = zipfile.ZIP_DEFLATED
        zi.external_attr = 0o644 << 16
        z.writestr(zi, open(f, 'rb').read())
h = hashlib.sha256(open(out, 'rb').read()).hexdigest()
print(out); print(len(files), 'files'); print('sha256', h)
PY
