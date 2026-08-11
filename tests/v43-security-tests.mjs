// V43 security regression tests — esc() hardening + district URL guard.
// Pure-function tests, no extension APIs. Run: node tests/v43-security-tests.mjs
import assert from 'node:assert';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../src/wallet.js', import.meta.url), 'utf8');

// Extract the two helpers by name from the source so the test tracks the shipped code.
function extract(name){
  const i = src.indexOf('function ' + name + '(');
  assert(i !== -1, name + ' not found in wallet.js');
  // read to the end of that single-line function (both helpers are one-liners)
  const line = src.slice(i, src.indexOf('\n', i));
  return line;
}
// eslint-disable-next-line no-eval
const esc = (0, eval)('(' + extract('esc').replace(/^function esc/, 'function') + ')');
const safeDistrict = (0, eval)('(' + extract('safeDistrict').replace(/^function safeDistrict/, 'function').replace(/\/\/.*$/, '') + ')');

let pass = 0, fail = 0;
function t(name, fn){ try { fn(); console.log('  \u2713 ' + name); pass++; } catch(e){ console.log('  \u2717 ' + name + ' \u2014 ' + e.message); fail++; } }

console.log('esc() hardening');
t('escapes angle brackets and ampersand', () => {
  assert.strictEqual(esc('<b>&</b>'), '&lt;b&gt;&amp;&lt;/b&gt;');
});
t('escapes double quotes', () => {
  assert.strictEqual(esc('a"b'), 'a&quot;b');
});
t('escapes single quotes (attribute-injection defence)', () => {
  assert.strictEqual(esc("x' onmouseover='alert(1)"), 'x&#39; onmouseover=&#39;alert(1)');
});
t('escapes backticks', () => {
  assert.strictEqual(esc('a`b'), 'a&#96;b');
});
t('leaves a plain ordinal name untouched', () => {
  assert.strictEqual(esc('cool-name.sat'), 'cool-name.sat');
});
t('a hostile inscription name cannot open a tag', () => {
  const out = esc('<img src=x onerror=alert(document.cookie)>');
  assert.ok(!out.includes('<'), 'no raw < survives');
  assert.ok(!out.includes('>'), 'no raw > survives');
});

console.log('safeDistrict() URL-path guard');
t('accepts a normal numeric district', () => {
  assert.strictEqual(safeDistrict(1234), '1234');
  assert.strictEqual(safeDistrict('42'), '42');
});
t('rejects path traversal', () => {
  assert.throws(() => safeDistrict('1/../list'));
});
t('rejects injection characters', () => {
  assert.throws(() => safeDistrict("1;drop"));
  assert.throws(() => safeDistrict('1 2'));
  assert.throws(() => safeDistrict('abc'));
});
t('rejects empty / oversized', () => {
  assert.throws(() => safeDistrict(''));
  assert.throws(() => safeDistrict('12345678901')); // 11 digits > cap
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
