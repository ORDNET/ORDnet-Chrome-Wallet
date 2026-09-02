// Shared helper: the popup engine lives in src/wallet/*.js (V49.3 split of the
// former single wallet.js). The modules are classic scripts loaded in the order
// wallet.html lists them and share one global lexical scope, so for the tests
// the equivalent of the old file is their concatenation in that same order —
// read from wallet.html itself so the test can never disagree with the popup.
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const here = dirname(fileURLToPath(import.meta.url));
export const root = join(here, '..', '..') + '/';
export function walletModuleFiles() {
  const html = fs.readFileSync(join(root, 'src/wallet.html'), 'utf8');
  return [...html.matchAll(/<script src="(wallet\/[^"]+)"><\/script>/g)].map(m => m[1]);
}
export function walletSource() {
  return walletModuleFiles().map(f => fs.readFileSync(join(root, 'src', f), 'utf8')).join('\n');
}
