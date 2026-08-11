/* ORDnet Service Worker — blockchain router.
   Static file (registered from src/viewer.js with root scope): intercepts
   /<domain>.<tld> and /<txid>_<vout> requests inside the viewer and resolves
   them on-chain via the names registry + WhatsOnChain. */

var API_BASE = 'https://api.whatsonchain.com/v1/bsv/main';
var NAMES_API = 'https://domains.ordnet.io'; // v40 — resolver on the v2 platform main domain
var CACHE_NAME = 'ordnet-cache-v4'; // fresh cache so every name re-resolves via the main domain
var TLDS = ['web3','bitcoin','bsv','ordinal','sat','crypto','nft','x','sats','ord'];

self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(clients.claim()); });

self.addEventListener('fetch', function(event){
  var url = new URL(event.request.url);
  var path = url.pathname;
  var txM = path.match(/\/([a-f0-9]{64})_(\d+)$/i);
  if (txM) { event.respondWith(handleTxid(txM[1], parseInt(txM[2]))); return; }
  var tP = TLDS.join('|');
  var dR = new RegExp('^\\/([a-z0-9][a-z0-9.-]*\\.(' + tP + '))(\\/[^?]*)?', 'i');
  var dM = path.match(dR);
  if (dM) { event.respondWith(handleDomain(dM[1], dM[3] || '')); return; }
});

async function handleDomain(domain, subpath){
  try{
    var cache = await caches.open(CACHE_NAME);
    var key = 'd_' + domain + subpath;
    var cached = await cache.match(key);
    if (cached) return cached;
    var r = await fetch(NAMES_API + '/resolve?name=' + encodeURIComponent(domain + subpath));
    if (!r.ok) throw new Error('not found');
    var d = await r.json();
    if (!d.txid) throw new Error('no txid');
    var tx = await fetch(API_BASE + '/tx/' + d.txid + '/hex');
    if (!tx.ok) throw new Error('tx not found');
    var hex = await tx.text();
    var ord = extractOrd(hex, 0);
    if (!ord) throw new Error('no inscription');
    var resp = new Response(ord.data, { headers: { 'Content-Type': ord.ct, 'Cache-Control': 'public,max-age=31536000' } });
    await cache.put(key, resp.clone());
    return resp;
  }catch(e){ return new Response('Error: ' + e.message, { status: 404 }); }
}

async function handleTxid(txid, vout){
  try{
    var cache = await caches.open(CACHE_NAME);
    var key = txid + '_' + vout;
    var cached = await cache.match(key);
    if (cached) return cached;
    var tx = await fetch(API_BASE + '/tx/' + txid + '/hex');
    if (!tx.ok) throw new Error('tx not found');
    var hex = await tx.text();
    var ord = extractOrd(hex, vout);
    if (!ord) throw new Error('no inscription');
    var resp = new Response(ord.data, { headers: { 'Content-Type': ord.ct, 'Cache-Control': 'public,max-age=31536000' } });
    await cache.put(key, resp.clone());
    return resp;
  }catch(e){ return new Response('Error: ' + e.message, { status: 404 }); }
}

function extractOrd(hex, vout){
  var b = h2b(hex); var pos = 4;
  var ic = rv(b, pos); pos += ic[1];
  for (var i = 0; i < ic[0]; i++){ pos += 36; var sl = rv(b, pos); pos += sl[1] + sl[0] + 4; }
  var oc = rv(b, pos); pos += oc[1];
  for (var o = 0; o < oc[0]; o++){
    pos += 8; var sl = rv(b, pos); pos += sl[1];
    if (o === vout){ var sb = b.slice(pos, pos + sl[0]); var r = parseEnv(sb); if (r) return r; }
    pos += sl[0];
  }
  return null;
}

function parseEnv(sb){
  for (var i = 0; i < sb.length - 5; i++){
    if (sb[i] !== 0x00 || sb[i+1] !== 0x63) continue;
    var pos = i + 2;
    var p = rpd(sb, pos); if (!p[0]) continue; pos = p[1];
    if (new TextDecoder().decode(new Uint8Array(p[0])) !== 'ord') continue;
    if (sb[pos] !== 0x51) continue; pos++;
    var c = rpd(sb, pos); if (!c[0]) continue; pos = c[1];
    var ct = new TextDecoder().decode(new Uint8Array(c[0]));
    if (sb[pos] !== 0x00) continue; pos++;
    var chunks = [], ts = 0;
    while (pos < sb.length){
      if (sb[pos] === 0x68) break;
      var d = rpd(sb, pos);
      if (!d[0] || d[0].length === 0) break;
      chunks.push(d[0]); ts += d[0].length; pos = d[1];
    }
    var combined = new Uint8Array(ts); var off = 0;
    for (var j = 0; j < chunks.length; j++){ combined.set(new Uint8Array(chunks[j]), off); off += chunks[j].length; }
    return { ct: ct, data: combined };
  }
  return null;
}

function rpd(b, p){
  if (p >= b.length) return [null, p];
  var o = b[p];
  if (o === 0) return [[], p+1];
  if (o >= 1 && o <= 0x4b){ p++; return [b.slice(p, p+o), p+o]; }
  if (o === 0x4c){ p++; var l = b[p]; p++; return [b.slice(p, p+l), p+l]; }
  if (o === 0x4d){ p++; var l = b[p] | (b[p+1] << 8); p += 2; return [b.slice(p, p+l), p+l]; }
  if (o === 0x4e){ p++; var l = b[p] | (b[p+1] << 8) | (b[p+2] << 16) | (b[p+3] << 24); p += 4; return [b.slice(p, p+l), p+l]; }
  return [null, p];
}

function rv(b, p){
  var f = b[p];
  if (f < 0xfd) return [f, 1];
  if (f === 0xfd) return [b[p+1] | (b[p+2] << 8), 3];
  if (f === 0xfe) return [b[p+1] | (b[p+2] << 8) | (b[p+3] << 16) | (b[p+4] << 24), 5];
  return [0, 9];
}

function h2b(h){
  var b = new Uint8Array(h.length / 2);
  for (var i = 0; i < b.length; i++) b[i] = parseInt(h.substr(i * 2, 2), 16);
  return b;
}
