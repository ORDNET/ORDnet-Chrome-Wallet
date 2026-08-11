// ═══════════════════════════════════════════════════════════════
// ORDnet Web3 Browser Extension — Viewer Engine
// Service Worker blockchain router + 1SatOrdinals parser
// ═══════════════════════════════════════════════════════════════

var API_BASE = 'https://api.whatsonchain.com/v1/bsv/main';
var NAMES_API = 'https://domains.ordnet.io'; // v40 — resolver on the v2 platform main domain
var SUPPORTED_TLDS = ['web3','bitcoin','bsv','ordinal','sat','crypto','nft','x','sats','ord'];

var addressInput = document.getElementById('addressInput');
var viewFrame = document.getElementById('viewFrame');
var startScreen = document.getElementById('startScreen');
var loadingBar = document.getElementById('loadingBar');
var errorBar = document.getElementById('errorBar');
var secIndicator = document.getElementById('secIndicator');
var devInfo = document.getElementById('devInfo');

var navigationHistory = [];
var historyIndex = -1;

// ─── SERVICE WORKER BLOCKCHAIN ROUTER ─────────────────────────
// Core: intercepts ALL fetch requests matching /domain.web3 and
// /txid_N patterns, resolves them on-chain via WhatsOnChain.
// Without this, internal links between .web3 pages don't work.

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // Static SW file at the extension root (scope '/'), so /domain.web3 and
  // /txid_N requests are intercepted. No runtime-generated code (MV3 policy).
  navigator.serviceWorker.register('/sw.js').then(function() {
    return navigator.serviceWorker.ready;
  }).then(function() {
    console.log('ORDnet Service Worker router ready');
  }).catch(function(err) {
    console.error('SW registration failed:', err);
  });
}

// ─── HTML PREPROCESSOR ────────────────────────────────────────
function preprocessHtml(html) {
  var tldsPattern = SUPPORTED_TLDS.join('|');
  var pattern = new RegExp('(href|src)=(["\'])//(([a-z0-9][a-z0-9-]*\\.)+(' + tldsPattern + ')([\\/\\?][^"\']*)?)', 'gi');
  var processed = html.replace(pattern, '$1=$2/$3');

  var TLDS_STR = SUPPORTED_TLDS.join('|');
  var script = '<script>' +
    '(function(){' +
    'var TLDS="' + TLDS_STR + '";' +
    'var tldPattern=new RegExp("^/?(([a-z0-9][a-z0-9-]*\\\\.)+(" + TLDS + "))(/[^?#]*)?(\\\\?[^#]*)?(#.*)?$","i");' +
    'var txidPattern=/^\\/?([a-f0-9]{64})(?:_(\\d+))?(#.*)?$/i;' +
    'var fragmentPattern=/^\\/?(#.+)$/;' +
    'function scrollToFragment(frag){' +
    'try{' +
    'var id=decodeURIComponent(frag.substring(1));' +
    'var el=document.getElementById(id)||document.querySelector("[name=\\""+id+"\\"]");' +
    'if(el){el.scrollIntoView({behavior:"smooth",block:"start"});}' +
    '}catch(err){}' +
    '}' +
    'document.addEventListener("click",function(e){' +
    'var link=e.target.closest("a[href]");' +
    'if(!link)return;' +
    'var href=link.getAttribute("href");' +
    'if(!href)return;' +
    'var fragOnly=href.match(fragmentPattern);' +
    'if(fragOnly){' +
    'e.preventDefault();' +
    'e.stopPropagation();' +
    'scrollToFragment(fragOnly[1]);' +
    'return;' +
    '}' +
    'var domainMatch=href.match(tldPattern);' +
    'var txidMatch=href.match(txidPattern);' +
    'if(domainMatch||txidMatch){' +
    'e.preventDefault();' +
    'e.stopPropagation();' +
    'var target,frag;' +
    'if(domainMatch){' +
    'target=domainMatch[1]+(domainMatch[4]||"");' +
    'frag=domainMatch[6]||"";' +
    '}else{' +
    'target=txidMatch[1];' +
    'frag=txidMatch[3]||"";' +
    '}' +
    'window.parent.postMessage({type:"navigate",target:target,fragment:frag},"*");' +
    '}' +
    '},true);' +
    '})();' +
    '</' + 'script>';

  if (processed.indexOf('</body>') !== -1) {
    processed = processed.replace('</body>', script + '</body>');
  } else {
    processed += script;
  }
  return processed;
}

// ─── SECURITY SCANNER ─────────────────────────────────────────
var SEC_PATTERNS = [
  { name: 'Crypto Miner', level: 4, re: /coinhive|cryptonight|webminer|coin-?hive|cryptoloot/gi },
  { name: 'Keylogger', level: 4, re: /addEventListener\s*\(\s*['"]key(down|up|press)['"][\s\S]{0,200}(fetch|XMLHttpRequest)/gi },
  { name: 'Cookie Theft', level: 3, re: /document\.cookie[\s\S]{0,150}(location|window\.open)/gi },
  { name: 'Phishing', level: 3, re: /<form[^>]*action\s*=\s*['"][^'"]*(?:login|signin|account)/gi },
  { name: 'Eval/Decode', level: 2, re: /eval\s*\(\s*(atob|decodeURIComponent|unescape)/gi },
  { name: 'Script Inject', level: 2, re: /document\.createElement\s*\(\s*['"]script['"]/gi }
];

function scanSecurity(html) {
  var maxLevel = 0;
  for (var i = 0; i < SEC_PATTERNS.length; i++) {
    var m = html.match(SEC_PATTERNS[i].re);
    if (m && SEC_PATTERNS[i].level > maxLevel) maxLevel = SEC_PATTERNS[i].level;
  }
  return maxLevel;
}

// ─── INSCRIPTION PARSER (main page) ──────────────────────────
function parseInscription(rawHex) {
  var bytes = hexToBytes(rawHex);
  var pos = 4;
  var ic = readVarInt(bytes, pos); pos += ic[1];
  for (var i = 0; i < ic[0]; i++) { pos += 36; var sl = readVarInt(bytes, pos); pos += sl[1] + sl[0] + 4; }
  var oc = readVarInt(bytes, pos); pos += oc[1];

  for (var o = 0; o < oc[0]; o++) {
    pos += 8; var sl = readVarInt(bytes, pos); pos += sl[1];
    var sb = bytes.slice(pos, pos + sl[0]); pos += sl[0];
    var result = parseOrdinalEnvelope(sb);
    if (result) return result;
  }
  return null;
}

function parseOrdinalEnvelope(sb) {
  for (var i = 0; i < sb.length - 1; i++) {
    if (sb[i] !== 0x00 || sb[i + 1] !== 0x63) continue;
    var pos = i + 2;
    var p = readPushData(sb, pos); if (!p[0]) continue; pos = p[1];
    if (bytesToString(p[0]) !== 'ord') continue;
    if (sb[pos] !== 0x51) continue; pos++;
    var c = readPushData(sb, pos); if (!c[0]) continue; pos = c[1];
    var ct = bytesToString(c[0]);
    if (sb[pos] !== 0x00) continue; pos++;

    var allData = [];
    while (pos < sb.length) {
      var d = readPushData(sb, pos);
      if (!d[0] || d[0].length === 0) break;
      for (var j = 0; j < d[0].length; j++) allData.push(d[0][j]);
      pos = d[1];
      if (pos < sb.length && sb[pos] === 0x68) break;
    }

    var isBin = ct.startsWith('image/') || ct.startsWith('video/') || ct.startsWith('audio/') || ct.startsWith('application/');
    var data = isBin ? new Uint8Array(allData) : bytesToString(allData);
    return { contentType: ct, data: data, isBinary: isBin };
  }
  return null;
}

function hexToBytes(h) { var b = new Uint8Array(h.length / 2); for (var i = 0; i < b.length; i++) b[i] = parseInt(h.substr(i * 2, 2), 16); return b; }
function readVarInt(b, p) { var f = b[p]; if (f < 0xfd) return [f, 1]; if (f === 0xfd) return [b[p+1]|(b[p+2]<<8), 3]; if (f === 0xfe) return [b[p+1]|(b[p+2]<<8)|(b[p+3]<<16)|(b[p+4]<<24), 5]; return [0, 9]; }
function readPushData(b, p) { if (p >= b.length) return [null, p]; var o = b[p]; if (o === 0) return [[], p+1]; if (o >= 1 && o <= 0x4b) { p++; return [b.slice(p, p+o), p+o]; } if (o === 0x4c) { p++; var l = b[p]; p++; return [b.slice(p, p+l), p+l]; } if (o === 0x4d) { p++; var l = b[p]|(b[p+1]<<8); p+=2; return [b.slice(p, p+l), p+l]; } if (o === 0x4e) { p++; var l = b[p]|(b[p+1]<<8)|(b[p+2]<<16)|(b[p+3]<<24); p+=4; return [b.slice(p, p+l), p+l]; } return [null, p]; }
function bytesToString(b) { return new TextDecoder().decode(b instanceof Uint8Array ? b : new Uint8Array(b)); }
function uint8ToBase64(u) { var s = ''; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }
function isValidTxid(s) { return /^[a-fA-F0-9]{64}$/.test(s.trim()); }
function hasWeb3TLD(s) { var l = s.toLowerCase(); for (var i = 0; i < SUPPORTED_TLDS.length; i++) { if (l.indexOf('.' + SUPPORTED_TLDS[i]) !== -1) return true; } return false; }

// ─── NAVIGATION ───────────────────────────────────────────────
async function loadContent(input, addToHistory) {
  if (addToHistory === undefined) addToHistory = true;
  if (!input) return;
  input = input.trim();
  showLoading(); hideError();

  var txid = input;
  var displayName = input;

  if (!isValidTxid(input)) {
    if (hasWeb3TLD(input)) {
      try {
        var name = input.toLowerCase();
        var res = await fetch(NAMES_API + '/resolve?name=' + encodeURIComponent(name));
        if (!res.ok) throw new Error('not found');
        var data = await res.json();
        if (!data.txid) throw new Error('no txid');
        txid = data.txid.toLowerCase();
        displayName = input;
      } catch (e) {
        showError('Domain not found: ' + input + ' (' + e.message + ')');
        return;
      }
    } else {
      showError('Enter a valid .web3 domain or 64-character TXID');
      return;
    }
  }

  if (addToHistory) {
    navigationHistory = navigationHistory.slice(0, historyIndex + 1);
    navigationHistory.push(displayName);
    historyIndex = navigationHistory.length - 1;
  }

  try {
    var hexResponse = await fetch(API_BASE + '/tx/' + txid + '/hex');
    if (!hexResponse.ok) throw new Error('Transaction not found');
    var rawHex = await hexResponse.text();
    var inscription = parseInscription(rawHex);
    if (!inscription) throw new Error('No 1SatOrdinals inscription found');

    var contentStr = typeof inscription.data === 'string' ? inscription.data : '';
    var secLevel = scanSecurity(contentStr);
    updateSecurityIndicator(secLevel);

    document.getElementById('devType').textContent = 'Type: ' + inscription.contentType;
    document.getElementById('devSize').textContent = 'Size: ' + (inscription.data.length || inscription.data.byteLength || 0).toLocaleString() + ' bytes';
    document.getElementById('devTxid').textContent = 'TXID: ' + txid.substring(0, 16) + '...';

    displayInscription(inscription);
    addressInput.value = displayName;
    document.title = 'ORDnet — ' + displayName;
  } catch (e) {
    showError(e.message);
  }

  hideLoading();
  updateNavButtons();
}

function displayInscription(ins) {
  startScreen.style.display = 'none';
  viewFrame.style.display = 'block';

  if (ins.contentType.startsWith('text/html')) {
    viewFrame.srcdoc = preprocessHtml(ins.data);
  } else if (ins.contentType.startsWith('image/')) {
    var b64 = uint8ToBase64(ins.data);
    viewFrame.srcdoc = '<html><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#111"><img src="data:' + ins.contentType + ';base64,' + b64 + '" style="max-width:100%;max-height:100vh;object-fit:contain"/></body></html>';
  } else if (ins.contentType.startsWith('video/')) {
    var b64 = uint8ToBase64(ins.data);
    viewFrame.srcdoc = '<html><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#111"><video controls autoplay style="max-width:100%;max-height:100vh"><source src="data:' + ins.contentType + ';base64,' + b64 + '" type="' + ins.contentType + '"></video></body></html>';
  } else if (ins.contentType.startsWith('audio/')) {
    var b64 = uint8ToBase64(ins.data);
    viewFrame.srcdoc = '<html><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh"><audio controls autoplay style="width:90%"><source src="data:' + ins.contentType + ';base64,' + b64 + '" type="' + ins.contentType + '"></audio></body></html>';
  } else if (typeof ins.data === 'string') {
    var esc = ins.data.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    viewFrame.srcdoc = '<html><body><pre style="white-space:pre-wrap;word-wrap:break-word;padding:16px;font-family:monospace">' + esc + '</pre></body></html>';
  }
}

// ─── UI HELPERS ───────────────────────────────────────────────
function showLoading() { loadingBar.classList.add('active'); }
function hideLoading() { loadingBar.classList.remove('active'); }
function showError(msg) { errorBar.textContent = msg; errorBar.classList.add('visible'); hideLoading(); }
function hideError() { errorBar.classList.remove('visible'); }

function updateSecurityIndicator(level) {
  secIndicator.classList.add('visible');
  var icons = ['🔒', '🔓', '⚠️', '🚨', '☠️'];
  secIndicator.textContent = icons[level] || '🔒';
}

function updateNavButtons() {
  document.getElementById('btnBack').classList.toggle('active', historyIndex > 0);
  document.getElementById('btnForward').classList.toggle('active', historyIndex < navigationHistory.length - 1);
}

function goHome() {
  startScreen.style.display = 'block';
  viewFrame.style.display = 'none';
  viewFrame.srcdoc = '';
  addressInput.value = '';
  secIndicator.classList.remove('visible');
  document.title = 'ORDnet';
}

// ─── EVENTS ───────────────────────────────────────────────────
document.getElementById('goBtn').addEventListener('click', function() {
  var input = addressInput.value.trim();
  if (input) loadContent(input);
});

addressInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.target.blur();
    var input = addressInput.value.trim();
    if (input) loadContent(input);
  }
});

document.getElementById('btnHome').addEventListener('click', goHome);

document.getElementById('btnWallet').addEventListener('click', function() {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/wallet.html') });
});

document.getElementById('btnBack').addEventListener('click', function() {
  if (historyIndex > 0) { historyIndex--; loadContent(navigationHistory[historyIndex], false); }
});

document.getElementById('btnForward').addEventListener('click', function() {
  if (historyIndex < navigationHistory.length - 1) { historyIndex++; loadContent(navigationHistory[historyIndex], false); }
});

document.getElementById('lightBtn').addEventListener('click', function() {
  document.documentElement.dataset.theme = 'light';
  document.getElementById('lightBtn').classList.add('active');
  document.getElementById('darkBtn').classList.remove('active');
});

document.getElementById('darkBtn').addEventListener('click', function() {
  document.documentElement.dataset.theme = 'dark';
  document.getElementById('darkBtn').classList.add('active');
  document.getElementById('lightBtn').classList.remove('active');
});

// Listen for nav requests from iframe content
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'navigate' && e.data.target) {
    addressInput.value = e.data.target;
    window.__pendingFragment = e.data.fragment || '';
    loadContent(e.data.target);
  }
});

// Scroll to fragment inside iframe after content loads
viewFrame.addEventListener('load', function() {
  var frag = window.__pendingFragment;
  window.__pendingFragment = '';
  if (!frag || frag.length < 2) return;
  try {
    var id = decodeURIComponent(frag.substring(1));
    var doc = viewFrame.contentDocument;
    if (!doc) return;
    var el = doc.getElementById(id) || doc.querySelector('[name="' + id + '"]');
    if (el) {
      setTimeout(function() {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  } catch (err) {}
});

// Ctrl+Shift+D for dev info
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') devInfo.classList.toggle('visible');
});

// ─── APP CATALOG ──────────────────────────────────────────────
var SVG_DOMAINS = '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';
var SVG_MAIL    = '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>';
var SVG_APP     = '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>';
var SVG_SWAP    = '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3l4 4-4 4"/><path d="M20 7H4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/></svg>';
var SVG_CLAWD   = '<span style="font-size:24px;line-height:1;">🦞</span>';

var APPS = {
  'ORDnet': [
    { name: 'ORD/domains', svg: SVG_DOMAINS, q: 'domains.ordnet.web3' },
    { name: 'ORD/mail',    svg: SVG_MAIL,    q: 'mail.ordnet.web3' },
    { name: 'ORD/app',     svg: SVG_APP,     q: 'app.ordnet.web3' },
    { name: 'ORD/swap',    svg: SVG_SWAP,    q: 'swap.ordnet.web3' },
    { name: 'ORD/clawd',   svg: SVG_CLAWD,   q: 'clawdbot.ordnet.web3', cardClass: 'app-card-clawd' }
  ]
};

function buildAppCatalog() {
  var container = document.getElementById('appCatalog');
  var sections = Object.keys(APPS);
  for (var s = 0; s < sections.length; s++) {
    var label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = sections[s];
    container.appendChild(label);

    var grid = document.createElement('div');
    grid.className = 'app-grid';
    var apps = APPS[sections[s]];
    for (var a = 0; a < apps.length; a++) {
      (function(app) {
        var card = document.createElement('div');
        card.className = 'app-card' + (app.cardClass ? ' ' + app.cardClass : '');
        card.innerHTML = '<div class="icon">' + (app.svg || app.icon || '') + '</div><div class="name">' + app.name + '</div>';
        card.addEventListener('click', function() {
          addressInput.value = app.q;
          loadContent(app.q);
        });
        grid.appendChild(card);
      })(apps[a]);
    }
    container.appendChild(grid);
  }
}

// ─── INIT ─────────────────────────────────────────────────────
registerServiceWorker();
buildAppCatalog();

var params = new URLSearchParams(window.location.search);
var q = params.get('q');
if (q) {
  addressInput.value = q;
  loadContent(q);
}
