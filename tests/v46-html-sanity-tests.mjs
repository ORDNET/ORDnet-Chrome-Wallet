// V46.1 — HTML render-sanity guard. Catches the class of bug that shipped in
// V45/V46: build tooling writing escaped sequences (a literal backslash-n)
// into wallet.html, which render as visible "\n" text at the bottom of every
// view. Run: node tests/v46-html-sanity-tests.mjs
import fs from 'node:fs';
import assert from 'node:assert';

const dir = new URL('..', import.meta.url).pathname;
const html = fs.readFileSync(dir + 'src/wallet.html', 'utf8');

let pass = 0, fail = 0;
function t(name, fn) { try { fn(); console.log('  \u2713 ' + name); pass++; } catch (e) { console.log('  \u2717 ' + name + ' \u2014 ' + e.message); fail++; } }

console.log('wallet.html render sanity');
t('contains ZERO backslash characters (escaped sequences render as text)', () => {
  const n = (html.match(/\\/g) || []).length;
  assert.strictEqual(n, 0, 'found ' + n + ' backslash(es) — check build tooling for double-escaping');
});
t('no visible text between adjacent <script> tags', () => {
  const gaps = [...html.matchAll(/<\/script>([\s\S]*?)<script/g)].map(m => m[1]);
  gaps.forEach((g, i) => assert.strictEqual(g.trim(), '', 'non-whitespace between script tags (gap ' + i + '): ' + JSON.stringify(g.slice(0, 40))));
});
t('no visible text between the nav and the first script tag', () => {
  const m = html.match(/<\/nav>([\s\S]*?)<script/);
  assert.ok(m, 'nav/script structure present');
  assert.strictEqual(m[1].trim(), '', 'stray body-level text after </nav>');
});
t('no visible text after the last </script>', () => {
  const tail = html.slice(html.lastIndexOf('</script>') + '</script>'.length);
  const stripped = tail.replace(/<\/?(body|html)>/g, '').trim();
  assert.strictEqual(stripped, '', 'stray text at end of body: ' + JSON.stringify(stripped.slice(0, 40)));
});

console.log('layout contract (Y2/Y3)');
t('popup window height is pinned at 600px on <html>', () => {
  assert.ok(/html\{[^}]*height:600px/.test(html));
});
t('nav views scroll in a 548px area — the bar has its own strip', () => {
  assert.ok(/body\.has-nav\{[^}]*height:548px/.test(html));
  assert.ok(!/body\.has-nav\{[^}]*padding-bottom:9\dpx/.test(html), 'old overlay-padding approach must be gone');
});
t('every referenced local script file exists', () => {
  [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].forEach(m => {
    const p = m[1].replace('../', '');
    const full = m[1].startsWith('../') ? dir + p : dir + 'src/' + m[1];
    assert.ok(fs.existsSync(full), 'missing script: ' + m[1]);
  });
});

console.log('manifest consistency (V47.2 guard)');
t('inpage.js web_accessible_resources cover the content.js injection scope', () => {
  const m = JSON.parse(fs.readFileSync(dir + 'manifest.json', 'utf8'));
  const injBlock = m.content_scripts.find(c => c.js.includes('src/content.js'));
  const warBlock = m.web_accessible_resources.find(w => w.resources.includes('src/inpage.js'));
  const covers = (pat) => warBlock.matches.includes('<all_urls>') || warBlock.matches.includes(pat);
  injBlock.matches.forEach(p => assert.ok(covers(p),
    'content.js runs on ' + p + ' but inpage.js is not web-accessible there — window.ordplug would be undefined (the V47.1 bug)'));
});
t('brc100-inpage.js web_accessible_resources cover the brc100-content scope', () => {
  const m = JSON.parse(fs.readFileSync(dir + 'manifest.json', 'utf8'));
  const warBlock = m.web_accessible_resources.find(w => w.resources.includes('src/brc100-inpage.js'));
  assert.ok(warBlock.matches.includes('<all_urls>'));
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
