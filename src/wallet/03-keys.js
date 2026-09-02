/* ---------- BIP39 (pure bsv — no Web Crypto dependency) ---------- */
function entropyToMnemonic(ent){
  const hash = bsv.crypto.Hash.sha256(bsv.deps.Buffer.from(ent));
  let bits=''; for(const b of ent) bits += b.toString(2).padStart(8,'0');
  bits += hash[0].toString(2).padStart(8,'0').slice(0, (ent.length*8)/32);
  const words=[];
  for(let i=0;i<bits.length/11;i++) words.push(BIP39_WORDLIST[parseInt(bits.slice(i*11,(i+1)*11),2)]);
  return words.join(' ');
}
function mnemonicToSeed(mnemonic, passphrase=''){
  const Buf=bsv.deps.Buffer, Hash=bsv.crypto.Hash;
  const pw=Buf.from(mnemonic.normalize('NFKD'),'utf8');
  const salt=Buf.from(('mnemonic'+passphrase).normalize('NFKD'),'utf8');
  let U=Hash.sha512hmac(Buf.concat([salt, Buf.from([0,0,0,1])]), pw);
  const T=Buf.from(U);
  for(let i=1;i<2048;i++){ U=Hash.sha512hmac(U, pw); for(let j=0;j<T.length;j++) T[j]^=U[j]; }
  return T;
}
function mnemonicToWif(mnemonic){
  const seed=mnemonicToSeed(mnemonic);
  return bsv.PrivateKey.fromBuffer(seed.slice(0,32)).toWIF();
}
/* V49.3 — full BIP39 validation. Until 4.9.2 this only checked the word
   count and that every word is in the list, so a typo that happens to be
   another valid word (or two words swapped) was accepted and silently
   derived a different, empty wallet. The checksum catches that: the last
   ENT/32 bits of the phrase must equal the first bits of sha256(entropy). */
function mnemonicChecksumValid(words){
  if(![12,15,18,21,24].includes(words.length)) return false;
  let bits='';
  for(const w of words){ const i=BIP39_WORDLIST.indexOf(w); if(i<0) return false; bits+=i.toString(2).padStart(11,'0'); }
  const csLen=words.length/3;                 // 12 words -> 4 bits, 24 -> 8
  const entBits=bits.slice(0, bits.length-csLen);
  const ent=new Uint8Array(entBits.length/8);
  for(let i=0;i<ent.length;i++) ent[i]=parseInt(entBits.slice(i*8,(i+1)*8),2);
  const hash=bsv.crypto.Hash.sha256(bsv.deps.Buffer.from(ent));
  const expect=hash[0].toString(2).padStart(8,'0').slice(0,csLen);
  return bits.slice(bits.length-csLen)===expect;
}
function mnemonicProblem(m){
  const w=String(m||'').trim().toLowerCase().split(/\s+/).filter(Boolean);
  if(!w.length) return 'Enter your recovery phrase.';
  if(![12,15,18,21,24].includes(w.length)) return w.length+' words — a recovery phrase has 12, 15, 18, 21 or 24.';
  const bad=w.filter(x=>!BIP39_WORDLIST.includes(x));
  if(bad.length) return 'Not in the word list: '+bad.slice(0,3).join(', ')+(bad.length>3?'…':'')+'.';
  if(!mnemonicChecksumValid(w)) return 'Checksum does not match — a word is wrong or two words are swapped. This phrase would open a different, empty wallet.';
  return '';
}
function validateMnemonic(m){ return mnemonicProblem(m)===''; }
function wifToAddress(wif){ return bsv.PrivateKey.fromWIF(wif).toAddress().toString(); }
function wifToPubKey(wif){ return bsv.PrivateKey.fromWIF(wif).toPublicKey().toString(); }

/* ---------- BIP44 derivation (standard, portable) ---------- */
const BIP44_PATH = "m/44'/236'/0'/0/0"; // SLIP-44 coin type 236 = BSV
function mnemonicToWifBip44(mnemonic, passphrase=''){
  const seed = mnemonicToSeed(mnemonic, passphrase);
  const hd = bsv.HDPrivateKey.fromSeed(bsv.deps.Buffer.from(seed));
  return hd.deriveChild(BIP44_PATH).privateKey.toWIF();
}
/* Derive a WIF from a mnemonic at ANY derivation path (handles the different
   defaults used by other BSV wallets). Passphrase optional (e.g. Centbee PIN). */
function mnemonicToWifPath(mnemonic, path, passphrase=''){
  const seed = mnemonicToSeed(mnemonic, passphrase);
  const hd = bsv.HDPrivateKey.fromSeed(bsv.deps.Buffer.from(seed));
  return hd.deriveChild(path).privateKey.toWIF();
}

/* ---------- known BSV wallet import presets ----------
   Sourced from each wallet's documented default derivation path. Where a wallet
   documents only the account level (m/44'/coin'/0'), the full receive path
   (.../0/0) is used since that derives the first spendable address.
   `alt` paths are tried as a fallback and surfaced so the user can pick the
   address that actually holds their coins. */
const WALLET_PRESETS = [
  { id:'ordplug', name:'ORD/plug (BIP44)', path:"m/44'/236'/0'/0/0", note:'Standard BSV path (coin type 236).' },
  { id:'relayx',  name:'RelayX',           path:"m/44'/236'/0'/0/0", alt:["m/44'/236'/0'/2/0"], note:'Payment m/44\u2019/236\u2019/0\u2019/0/0. Ordinals were on \u2026/2/0.' },
  { id:'yours',   name:'Yours / Panda',    path:"m/44'/236'/0'/0/0", alt:["m/44'/236'/1'/0/0"], note:'Payment \u20260\u2019/0/0; ordinals key on \u20261\u2019/0/0.' },
  { id:'twetch',  name:'Twetch',           path:"m/0/0",             note:'Twetch uses the non-hardened path m/0/0.' },
  { id:'moneybutton', name:'Money Button', path:"m/44'/0'/0'/0/0",   note:'Money Button used coin type 0 (m/44\u2019/0\u2019/0\u2019).' },
  { id:'simplycash',  name:'Simply Cash',  path:"m/44'/145'/0'/0/0", note:'Simply Cash used coin type 145 (BCH numbering).' },
  { id:'electrumsv',  name:'ElectrumSV',   path:"m/44'/0'/0'/0/0",   alt:["m/44'/236'/0'/0/0","m/44'/145'/0'/0/0"], note:'Default coin type 0; also supports 236 and 145.' },
  { id:'handcash1',   name:'HandCash 1.x', path:"m/0'",              note:'Older HandCash (1.x) and Unit wallet used m/0\u2019. HandCash 2.0 cannot be exported.' },
  { id:'centbee',     name:'Centbee',      path:"m/44'/0'/0'/0/0",   note:'Centbee reportedly uses m/44\u2019/0 with your 4-digit PIN as passphrase \u2014 enter the PIN below if set.', pin:true },
  { id:'edge',        name:'Edge',         path:"m/44'/236'/0'/0/0", alt:["m/44'/145'/0'/0/0"], note:'Typically coin type 236; 145 if the wallet came from a BCH split.' },
  { id:'custom',      name:'Custom path\u2026', path:"m/44'/236'/0'/0/0", custom:true, note:'Enter any BIP32 path yourself.' }
];
function presetById(id){ return WALLET_PRESETS.find(p=>p.id===id) || WALLET_PRESETS[0]; }


