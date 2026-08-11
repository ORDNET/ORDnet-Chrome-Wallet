/* =========================================================================
   ORD/plug — 1SatOrdinals inscription parser (V42)
   1-to-1 port of the iOS engine (wallet-core.js v2.6.2): extract the
   inscription envelope (OP_FALSE OP_IF "ord" …) from a raw transaction.
   Used by the ORD/ner tab for previews — content is fetched via our OWN
   path (raw tx hex, cached) and parsed here, never via a third-party
   content endpoint. Plain script: loaded before wallet.js, and eval-able
   in the node test harness.
   ========================================================================= */

function opHexToU8(h){ var b=new Uint8Array(h.length/2); for(var i=0;i<b.length;i++) b[i]=parseInt(h.substr(i*2,2),16); return b; }

function extractOrd(hex, vout){
  var b = opHexToU8(hex); var pos = 4;
  var ic = ordRv(b, pos); pos += ic[1];
  for (var i = 0; i < ic[0]; i++){ pos += 36; var sl = ordRv(b, pos); pos += sl[1] + sl[0] + 4; }
  var oc = ordRv(b, pos); pos += oc[1];
  for (var o = 0; o < oc[0]; o++){
    pos += 8; var sl2 = ordRv(b, pos); pos += sl2[1];
    if (o === vout){ var sb = b.slice(pos, pos + sl2[0]); var r = ordParseEnv(sb); if (r) return r; }
    pos += sl2[0];
  }
  return null;
}
/* first inscription in ANY output */
function extractFirstOrd(hex){
  var b = opHexToU8(hex); var pos = 4;
  var ic = ordRv(b, pos); pos += ic[1];
  for (var i = 0; i < ic[0]; i++){ pos += 36; var sl = ordRv(b, pos); pos += sl[1] + sl[0] + 4; }
  var oc = ordRv(b, pos); pos += oc[1];
  for (var o = 0; o < oc[0]; o++){
    pos += 8; var sl2 = ordRv(b, pos); pos += sl2[1];
    var sb = b.slice(pos, pos + sl2[0]); pos += sl2[0];
    var r = ordParseEnv(sb); if (r) return r;
  }
  return null;
}
function ordParseEnv(sb){
  for (var i = 0; i < sb.length - 5; i++){
    if (sb[i] !== 0x00 || sb[i+1] !== 0x63) continue;
    var pos = i + 2;
    var p = ordRpd(sb, pos); if (!p[0]) continue; pos = p[1];
    if (ordU8str(p[0]) !== 'ord') continue;
    if (sb[pos] !== 0x51) continue; pos++;
    var c = ordRpd(sb, pos); if (!c[0]) continue; pos = c[1];
    var ct = ordU8str(c[0]);
    if (sb[pos] !== 0x00) continue; pos++;
    var chunks = [], ts = 0;
    while (pos < sb.length){
      if (sb[pos] === 0x68) break;
      var d = ordRpd(sb, pos);
      if (!d[0] || d[0].length === 0) break;
      chunks.push(d[0]); ts += d[0].length; pos = d[1];
    }
    var combined = new Uint8Array(ts); var off = 0;
    for (var j = 0; j < chunks.length; j++){ var cj=(chunks[j] instanceof Uint8Array)?chunks[j]:new Uint8Array(chunks[j]); combined.set(cj, off); off += cj.length; }
    return { ct: ct, dataB64: ordU8b64(combined) };
  }
  return null;
}
function ordRpd(b, p){
  if (p >= b.length) return [null, p];
  var o = b[p];
  if (o === 0) return [[], p+1];
  if (o >= 1 && o <= 0x4b){ p++; return [b.slice(p, p+o), p+o]; }
  if (o === 0x4c){ p++; var l = b[p]; p++; return [b.slice(p, p+l), p+l]; }
  if (o === 0x4d){ p++; var l2 = b[p] | (b[p+1] << 8); p += 2; return [b.slice(p, p+l2), p+l2]; }
  if (o === 0x4e){ p++; var l3 = b[p] | (b[p+1] << 8) | (b[p+2] << 16) | (b[p+3] << 24); p += 4; return [b.slice(p, p+l3), p+l3]; }
  return [null, p];
}
function ordRv(b, p){
  var f = b[p];
  if (f < 0xfd) return [f, 1];
  if (f === 0xfd) return [b[p+1] | (b[p+2] << 8), 3];
  if (f === 0xfe) return [b[p+1] | (b[p+2] << 8) | (b[p+3] << 16) | (b[p+4] << 24), 5];
  return [0, 9];
}
function ordU8str(b){ var u=(b instanceof Uint8Array)?b:new Uint8Array(b); var s=''; for(var i=0;i<u.length;i++) s+=String.fromCharCode(u[i]); try{ return decodeURIComponent(escape(s)); }catch(e){ return s; } }
function ordU8b64(u){
  var CH='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var out=''; var i;
  for(i=0;i+2<u.length;i+=3){
    var n=(u[i]<<16)|(u[i+1]<<8)|u[i+2];
    out+=CH[(n>>18)&63]+CH[(n>>12)&63]+CH[(n>>6)&63]+CH[n&63];
  }
  if(i<u.length){
    var rem=u.length-i;
    var n2=(u[i]<<16)|((rem>1?u[i+1]:0)<<8);
    out+=CH[(n2>>18)&63]+CH[(n2>>12)&63]+(rem>1?CH[(n2>>6)&63]:'=')+'=';
  }
  return out;
}
