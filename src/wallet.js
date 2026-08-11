/* =========================================================================
   ORD/plug Wallet V11 — Chrome extension edition
   Popup-first wallet. Keys live ONLY in this extension on this device and
   are AES-256-GCM encrypted with a password-derived key (PBKDF2-SHA256).
   Import: BIP44 phrase (m/44'/236'/0'/0/0) · legacy V9 phrase · WIF.
   Approval requests arrive from web pages via
   inpage.js -> content.js -> background.js -> this page.
   ========================================================================= */

const BIP39_WORDLIST = ["abandon","ability","able","about","above","absent","absorb","abstract","absurd","abuse","access","accident","account","accuse","achieve","acid","acoustic","acquire","across","act","action","actor","actress","actual","adapt","add","addict","address","adjust","admit","adult","advance","advice","aerobic","affair","afford","afraid","again","age","agent","agree","ahead","aim","air","airport","aisle","alarm","album","alcohol","alert","alien","all","alley","allow","almost","alone","alpha","already","also","alter","always","amateur","amazing","among","amount","amused","analyst","anchor","ancient","anger","angle","angry","animal","ankle","announce","annual","another","answer","antenna","antique","anxiety","any","apart","apology","appear","apple","approve","april","arch","arctic","area","arena","argue","arm","armed","armor","army","around","arrange","arrest","arrive","arrow","art","artefact","artist","artwork","ask","aspect","assault","asset","assist","assume","asthma","athlete","atom","attack","attend","attitude","attract","auction","audit","august","aunt","author","auto","autumn","average","avocado","avoid","awake","aware","away","awesome","awful","awkward","axis","baby","bachelor","bacon","badge","bag","balance","balcony","ball","bamboo","banana","banner","bar","barely","bargain","barrel","base","basic","basket","battle","beach","bean","beauty","because","become","beef","before","begin","behave","behind","believe","below","belt","bench","benefit","best","betray","better","between","beyond","bicycle","bid","bike","bind","biology","bird","birth","bitter","black","blade","blame","blanket","blast","bleak","bless","blind","blood","blossom","blouse","blue","blur","blush","board","boat","body","boil","bomb","bone","bonus","book","boost","border","boring","borrow","boss","bottom","bounce","box","boy","bracket","brain","brand","brass","brave","bread","breeze","brick","bridge","brief","bright","bring","brisk","broccoli","broken","bronze","broom","brother","brown","brush","bubble","buddy","budget","buffalo","build","bulb","bulk","bullet","bundle","bunker","burden","burger","burst","bus","business","busy","butter","buyer","buzz","cabbage","cabin","cable","cactus","cage","cake","call","calm","camera","camp","can","canal","cancel","candy","cannon","canoe","canvas","canyon","capable","capital","captain","car","carbon","card","cargo","carpet","carry","cart","case","cash","casino","castle","casual","cat","catalog","catch","category","cattle","caught","cause","caution","cave","ceiling","celery","cement","census","century","cereal","certain","chair","chalk","champion","change","chaos","chapter","charge","chase","chat","cheap","check","cheese","chef","cherry","chest","chicken","chief","child","chimney","choice","choose","chronic","chuckle","chunk","churn","cigar","cinnamon","circle","citizen","city","civil","claim","clap","clarify","claw","clay","clean","clerk","clever","click","client","cliff","climb","clinic","clip","clock","clog","close","cloth","cloud","clown","club","clump","cluster","clutch","coach","coast","coconut","code","coffee","coil","coin","collect","color","column","combine","come","comfort","comic","common","company","concert","conduct","confirm","congress","connect","consider","control","convince","cook","cool","copper","copy","coral","core","corn","correct","cost","cotton","couch","country","couple","course","cousin","cover","coyote","crack","cradle","craft","cram","crane","crash","crater","crawl","crazy","cream","credit","creek","crew","cricket","crime","crisp","critic","crop","cross","crouch","crowd","crucial","cruel","cruise","crumble","crunch","crush","cry","crystal","cube","culture","cup","cupboard","curious","current","curtain","curve","cushion","custom","cute","cycle","dad","damage","damp","dance","danger","daring","dash","daughter","dawn","day","deal","debate","debris","decade","december","decide","decline","decorate","decrease","deer","defense","define","defy","degree","delay","deliver","demand","demise","denial","dentist","deny","depart","depend","deposit","depth","deputy","derive","describe","desert","design","desk","despair","destroy","detail","detect","develop","device","devote","diagram","dial","diamond","diary","dice","diesel","diet","differ","digital","dignity","dilemma","dinner","dinosaur","direct","dirt","disagree","discover","disease","dish","dismiss","disorder","display","distance","divert","divide","divorce","dizzy","doctor","document","dog","doll","dolphin","domain","donate","donkey","donor","door","dose","double","dove","draft","dragon","drama","drastic","draw","dream","dress","drift","drill","drink","drip","drive","drop","drum","dry","duck","dumb","dune","during","dust","dutch","duty","dwarf","dynamic","eager","eagle","early","earn","earth","easily","east","easy","echo","ecology","economy","edge","edit","educate","effort","egg","eight","either","elbow","elder","electric","elegant","element","elephant","elevator","elite","else","embark","embody","embrace","emerge","emotion","employ","empower","empty","enable","enact","end","endless","endorse","enemy","energy","enforce","engage","engine","enhance","enjoy","enlist","enough","enrich","enroll","ensure","enter","entire","entry","envelope","episode","equal","equip","era","erase","erode","erosion","error","erupt","escape","essay","essence","estate","eternal","ethics","evidence","evil","evoke","evolve","exact","example","excess","exchange","excite","exclude","excuse","execute","exercise","exhaust","exhibit","exile","exist","exit","exotic","expand","expect","expire","explain","expose","express","extend","extra","eye","eyebrow","fabric","face","faculty","fade","faint","faith","fall","false","fame","family","famous","fan","fancy","fantasy","farm","fashion","fat","fatal","father","fatigue","fault","favorite","feature","february","federal","fee","feed","feel","female","fence","festival","fetch","fever","few","fiber","fiction","field","figure","file","film","filter","final","find","fine","finger","finish","fire","firm","first","fiscal","fish","fit","fitness","fix","flag","flame","flash","flat","flavor","flee","flight","flip","float","flock","floor","flower","fluid","flush","fly","foam","focus","fog","foil","fold","follow","food","foot","force","forest","forget","fork","fortune","forum","forward","fossil","foster","found","fox","fragile","frame","frequent","fresh","friend","fringe","frog","front","frost","frown","frozen","fruit","fuel","fun","funny","furnace","fury","future","gadget","gain","galaxy","gallery","game","gap","garage","garbage","garden","garlic","garment","gas","gasp","gate","gather","gauge","gaze","general","genius","genre","gentle","genuine","gesture","ghost","giant","gift","giggle","ginger","giraffe","girl","give","glad","glance","glare","glass","glide","glimpse","globe","gloom","glory","glove","glow","glue","goat","goddess","gold","good","goose","gorilla","gospel","gossip","govern","gown","grab","grace","grain","grant","grape","grass","gravity","great","green","grid","grief","grit","grocery","group","grow","grunt","guard","guess","guide","guilt","guitar","gun","gym","habit","hair","half","hammer","hamster","hand","happy","harbor","hard","harsh","harvest","hat","have","hawk","hazard","head","health","heart","heavy","hedgehog","height","hello","helmet","help","hen","hero","hidden","high","hill","hint","hip","hire","history","hobby","hockey","hold","hole","holiday","hollow","home","honey","hood","hope","horn","horror","horse","hospital","host","hotel","hour","hover","hub","huge","human","humble","humor","hundred","hungry","hunt","hurdle","hurry","hurt","husband","hybrid","ice","icon","idea","identify","idle","ignore","ill","illegal","illness","image","imitate","immense","immune","impact","impose","improve","impulse","inch","include","income","increase","index","indicate","indoor","industry","infant","inflict","inform","inhale","inherit","initial","inject","injury","inmate","inner","innocent","input","inquiry","insane","insect","inside","inspire","install","intact","interest","into","invest","invite","involve","iron","island","isolate","issue","item","ivory","jacket","jaguar","jar","jazz","jealous","jeans","jelly","jewel","job","join","joke","journey","joy","judge","juice","jump","jungle","junior","junk","just","kangaroo","keen","keep","ketchup","key","kick","kid","kidney","kind","kingdom","kiss","kit","kitchen","kite","kitten","kiwi","knee","knife","knock","know","lab","label","labor","ladder","lady","lake","lamp","language","laptop","large","later","latin","laugh","laundry","lava","law","lawn","lawsuit","layer","lazy","leader","leaf","learn","leave","lecture","left","leg","legal","legend","leisure","lemon","lend","length","lens","leopard","lesson","letter","level","liar","liberty","library","license","life","lift","light","like","limb","limit","link","lion","liquid","list","little","live","lizard","load","loan","lobster","local","lock","logic","lonely","long","loop","lottery","loud","lounge","love","loyal","lucky","luggage","lumber","lunar","lunch","luxury","lyrics","machine","mad","magic","magnet","maid","mail","main","major","make","mammal","man","manage","mandate","mango","mansion","manual","maple","marble","march","margin","marine","market","marriage","mask","mass","master","match","material","math","matrix","matter","maximum","maze","meadow","mean","measure","meat","mechanic","medal","media","melody","melt","member","memory","mention","menu","mercy","merge","merit","merry","mesh","message","metal","method","middle","midnight","milk","million","mimic","mind","minimum","minor","minute","miracle","mirror","misery","miss","mistake","mix","mixed","mixture","mobile","model","modify","mom","moment","monitor","monkey","monster","month","moon","moral","more","morning","mosquito","mother","motion","motor","mountain","mouse","move","movie","much","muffin","mule","multiply","muscle","museum","mushroom","music","must","mutual","myself","mystery","myth","naive","name","napkin","narrow","nasty","nation","nature","near","neck","need","negative","neglect","neither","nephew","nerve","nest","net","network","neutral","never","news","next","nice","night","noble","noise","nominee","noodle","normal","north","nose","notable","note","nothing","notice","novel","now","nuclear","number","nurse","nut","oak","obey","object","oblige","obscure","observe","obtain","obvious","occur","ocean","october","odor","off","offer","office","often","oil","okay","old","olive","olympic","omit","once","one","onion","online","only","open","opera","opinion","oppose","option","orange","orbit","orchard","order","ordinary","organ","orient","original","orphan","ostrich","other","outdoor","outer","output","outside","oval","oven","over","own","owner","oxygen","oyster","ozone","pact","paddle","page","pair","palace","palm","panda","panel","panic","panther","paper","parade","parent","park","parrot","party","pass","patch","path","patient","patrol","pattern","pause","pave","payment","peace","peanut","pear","peasant","pelican","pen","penalty","pencil","people","pepper","perfect","permit","person","pet","phone","photo","phrase","physical","piano","picnic","picture","piece","pig","pigeon","pill","pilot","pink","pioneer","pipe","pistol","pitch","pizza","place","planet","plastic","plate","play","please","pledge","pluck","plug","plunge","poem","poet","point","polar","pole","police","pond","pony","pool","popular","portion","position","possible","post","potato","pottery","poverty","powder","power","practice","praise","predict","prefer","prepare","present","pretty","prevent","price","pride","primary","print","priority","prison","private","prize","problem","process","produce","profit","program","project","promote","proof","property","prosper","protect","proud","provide","public","pudding","pull","pulp","pulse","pumpkin","punch","pupil","puppy","purchase","purity","purpose","purse","push","put","puzzle","pyramid","quality","quantum","quarter","question","quick","quit","quiz","quote","rabbit","raccoon","race","rack","radar","radio","rail","rain","raise","rally","ramp","ranch","random","range","rapid","rare","rate","rather","raven","raw","razor","ready","real","reason","rebel","rebuild","recall","receive","recipe","record","recycle","reduce","reflect","reform","refuse","region","regret","regular","reject","relax","release","relief","rely","remain","remember","remind","remove","render","renew","rent","reopen","repair","repeat","replace","report","require","rescue","resemble","resist","resource","response","result","retire","retreat","return","reunion","reveal","review","reward","rhythm","rib","ribbon","rice","rich","ride","ridge","rifle","right","rigid","ring","riot","ripple","risk","ritual","rival","river","road","roast","robot","robust","rocket","romance","roof","rookie","room","rose","rotate","rough","round","route","royal","rubber","rude","rug","rule","run","runway","rural","sad","saddle","sadness","safe","sail","salad","salmon","salon","salt","salute","same","sample","sand","satisfy","satoshi","sauce","sausage","save","say","scale","scan","scare","scatter","scene","scheme","school","science","scissors","scorpion","scout","scrap","screen","script","scrub","sea","search","season","seat","second","secret","section","security","seed","seek","segment","select","sell","seminar","senior","sense","sentence","series","service","session","settle","setup","seven","shadow","shaft","shallow","share","shed","shell","sheriff","shield","shift","shine","ship","shiver","shock","shoe","shoot","shop","short","shoulder","shove","shrimp","shrug","shuffle","shy","sibling","sick","side","siege","sight","sign","silent","silk","silly","silver","similar","simple","since","sing","siren","sister","situate","six","size","skate","sketch","ski","skill","skin","skirt","skull","slab","slam","sleep","slender","slice","slide","slight","slim","slogan","slot","slow","slush","small","smart","smile","smoke","smooth","snack","snake","snap","sniff","snow","soap","soccer","social","sock","soda","soft","solar","soldier","solid","solution","solve","someone","song","soon","sorry","sort","soul","sound","soup","source","south","space","spare","spatial","spawn","speak","special","speed","spell","spend","sphere","spice","spider","spike","spin","spirit","split","spoil","sponsor","spoon","sport","spot","spray","spread","spring","spy","square","squeeze","squirrel","stable","stadium","staff","stage","stairs","stamp","stand","start","state","stay","steak","steel","stem","step","stereo","stick","still","sting","stock","stomach","stone","stool","story","stove","strategy","street","strike","strong","struggle","student","stuff","stumble","style","subject","submit","subway","success","such","sudden","suffer","sugar","suggest","suit","summer","sun","sunny","sunset","super","supply","supreme","sure","surface","surge","surprise","surround","survey","suspect","sustain","swallow","swamp","swap","swarm","swear","sweet","swift","swim","swing","switch","sword","symbol","symptom","syrup","system","table","tackle","tag","tail","talent","talk","tank","tape","target","task","taste","tattoo","taxi","teach","team","tell","ten","tenant","tennis","tent","term","test","text","thank","that","theme","then","theory","there","they","thing","this","thought","three","thrive","throw","thumb","thunder","ticket","tide","tiger","tilt","timber","time","tiny","tip","tired","tissue","title","toast","tobacco","today","toddler","toe","together","toilet","token","tomato","tomorrow","tone","tongue","tonight","tool","tooth","top","topic","topple","torch","tornado","tortoise","toss","total","tourist","toward","tower","town","toy","track","trade","traffic","tragic","train","transfer","trap","trash","travel","tray","treat","tree","trend","trial","tribe","trick","trigger","trim","trip","trophy","trouble","truck","true","truly","trumpet","trust","truth","try","tube","tuition","tumble","tuna","tunnel","turkey","turn","turtle","twelve","twenty","twice","twin","twist","two","type","typical","ugly","umbrella","unable","unaware","uncle","uncover","under","undo","unfair","unfold","unhappy","uniform","unique","unit","universe","unknown","unlock","until","unusual","unveil","update","upgrade","uphold","upon","upper","upset","urban","urge","usage","use","used","useful","useless","usual","utility","vacant","vacuum","vague","valid","valley","valve","van","vanish","vapor","various","vast","vault","vehicle","velvet","vendor","venture","venue","verb","verify","version","very","vessel","veteran","viable","vibrant","vicious","victory","video","view","village","vintage","violin","virtual","virus","visa","visit","visual","vital","vivid","vocal","voice","void","volcano","volume","vote","voyage","wage","wagon","wait","walk","wall","walnut","want","warfare","warm","warrior","wash","wasp","waste","water","wave","way","wealth","weapon","wear","weasel","weather","web","wedding","weekend","weird","welcome","west","wet","whale","what","wheat","wheel","when","where","whip","whisper","wide","width","wife","wild","will","win","window","wine","wing","wink","winner","winter","wire","wisdom","wise","wish","witness","wolf","woman","wonder","wood","wool","word","work","world","worry","worth","wrap","wreck","wrestle","wrist","write","wrong","yard","year","yellow","you","young","youth","zebra","zero","zone","zoo"];

const API_BASE = 'https://api.whatsonchain.com/v1/bsv/main';
const HOLDINGS_API = 'https://bsvmap.io/api';
// v4.0 — ORDnet on-chain marketplace: SNS listings go here (BSVmaps keep
// running via bsvmap.io). Since the cutover this is the main v2 domain.
const ORDNET_MARKET_API = 'https://domains.ordnet.io';
// v4.1 — OpNS index (bare names, tree 0), same endpoints as the iOS app v2.1:
// /names?q= (search, default match=exact, fallback:true = prefix fallback),
// /name/<name>, /owner/<address>.
const OPNS_API = 'https://search.ordnet.io/api/opns';
// v4.1 — SNS resolver (signed answers, resolver v1.3), same endpoints as the
// iOS app v2.2: /resolve/<name|mailbox@name>, /pubkey, /health.
const SNS_API = 'https://sns.ordnet.io';
/* resolver key management: pre-pinned key (resolver v1.3); a proven
   succession-deed chain may move the pin — nothing else. Stored in
   chrome.storage.local (the iOS app uses UserDefaults for the same). */
const SNS_PREPINNED_PUBKEY = '03088f1da3bfc998c1bc7bbc1ffcb7d96c47e094624a52d78406f8c3105b0d0b46';
const SNS_PIN_KEY = 'ordplug_sns_pinned_pubkey';

/* ---------- fees (identical to ORDPLUG v009 / ord-app v39) ---------- */
const SERVICE_FEE_ADDRESSES = {
  ordiBuilderAddress: '1HdbyucjYU2yfDFXzAQt3kCdP3VvM4tjzr',
  onnoBuilderAddress: '1JKcD1kx8XeJFfd32sug1MaXfruurHTCjv',
  algoBuilderAddress: '1AHEUcWuCfdRnfwNsvwZhZSetXjEuAvBot',
  colleagueIAddress:  '1ENW3XBoAv4KQ4FuQ4MtzNkLq82eJd12PV',
  protocolFeeAddress: '15q8YQSqUa9uTh6gh4AVixxq29xkpBBP9z',
  colleagueDAddress:  '1GeifRjPLWTDqL1DZ2vaqorX6pqCi9PyJB',
  monitorFeeAddress:  '1EXupec98g8TDTG5cwJwH3U8V3PezvvLv8',
  indexerFeeAddress:  '18RHRqQhsKKZwMnGevvnRQ8KrryAXvQUWQ',
  partnerFeeAddress:  '19o4rByWRvdq6zziJEfhpe4xdq5z43jYrr',
  founderFeeAddress:  '1EXupec98g8TDTG5cwJwH3U8V3PezvvLv8',
  foundationFeeAddress: '1ATEXPH6FSctbZdAz8MnXCfDpCvDnFrWma'
};
const SERVICE_FEES = {
  ordiBuilderFee:111, onnoBuilderFee:111, algoBuilderFee:111, colleagueIFee:111,
  protocolFee:222, colleagueDFee:222, monitorFee:333, indexerFee:444,
  partnerFee:666, founderFee:777, foundationFee:888
};
const TOTAL_SERVICE_FEES = Object.values(SERVICE_FEES).reduce((a,b)=>a+b,0); // 3996
const FEE_RATE = 0.15; // 150 sats/kb = 0.15 sat/byte
function sendMinerFee(){ return Math.ceil((200 + 13*34) * FEE_RATE); }
function inscribeMinerFee(bytes){ return Math.ceil(((bytes||0) + 700) * FEE_RATE); }

const ACCTS_KEY = 'ordplug_accounts';

/* state (memory) */
let _accounts = [];         // [{ name, wif, address, origin, path }]
let _active = 0;
let _wif = null, _address = null;
let _aesKey = null;         // in-memory AES key while unlocked (never persisted to disk)
let _pending = null;        // active approval { id, method, params, origin, tabId }
let _impMode = 'bip44';     // setup import mode: bip44 | legacy | wif
let _addMode = 'gen';
let _addImpMode = 'bip44';
let _confirmRemove = -1;
let _legacyData = null;
/* recovery phrases entered/created THIS session, keyed by address — kept only in
   memory so Backup can show them; never written to disk (only the WIF is stored). */
let _sessionPhrases = {};

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
function validateMnemonic(m){
  const w=m.trim().toLowerCase().split(/\s+/);
  if(![12,15,18,21,24].includes(w.length)) return false;
  return w.every(x=>BIP39_WORDLIST.includes(x));
}
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


/* ---------- V11 encrypted vault (WebCrypto: PBKDF2-SHA256 -> AES-256-GCM) ----------
   chrome.storage.local : encrypted vault only (salt, iv, ciphertext) — never plaintext keys.
   chrome.storage.session: derived key bits while unlocked (memory-only, wiped when the
   browser closes or on lock/auto-lock). */
const VAULT_KEY    = 'ordplug_vault_v11';
const SESSION_KEY  = 'ordplug_session_v11';
const AUTOLOCK_KEY = 'ordplug_autolock_min';
const ADDRBOOK_KEY = 'ordplug_addressbook';
const KDF_ITERS    = 600000; // OWASP PBKDF2-SHA256 floor (2023). Old vaults keep
                             // their own iters (stored per-vault) so unlock stays
                             // backward-compatible; only new/re-encrypted vaults use this.

function storageGet(key){ return new Promise(res=>chrome.storage.local.get([key], r=>res(r[key]))); }
function storageSet(obj){ return new Promise(res=>chrome.storage.local.set(obj, res)); }
function storageRemove(key){ return new Promise(res=>chrome.storage.local.remove(key, res)); }
function sessionGetKey(){ return new Promise(res=>chrome.storage.session.get([SESSION_KEY], r=>res(r[SESSION_KEY]))); }
function sessionSetKey(v){ return new Promise(res=>chrome.storage.session.set({ [SESSION_KEY]:v }, res)); }
function sessionClearKey(){ return new Promise(res=>chrome.storage.session.remove(SESSION_KEY, res)); }

function b64enc(buf){ let s=''; const b=new Uint8Array(buf); for(let i=0;i<b.length;i++) s+=String.fromCharCode(b[i]); return btoa(s); }
function b64dec(str){ const s=atob(str); const b=new Uint8Array(s.length); for(let i=0;i<s.length;i++) b[i]=s.charCodeAt(i); return b; }

async function kdfBits(password, salt, iters){
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name:'PBKDF2', salt, iterations:iters, hash:'SHA-256' }, km, 256);
}
function aesKeyFromBits(bits){ return crypto.subtle.importKey('raw', bits, 'AES-GCM', false, ['encrypt','decrypt']); }
async function encryptPayload(key, obj){
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  return { iv:b64enc(iv), ct:b64enc(ct) };
}
async function decryptPayload(key, cipher){
  const pt = await crypto.subtle.decrypt({ name:'AES-GCM', iv:b64dec(cipher.iv) }, key, b64dec(cipher.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}
async function getAutolockMin(){ const v=await storageGet(AUTOLOCK_KEY); return (v===undefined||v===null)?15:(v|0); }

async function createVault(password, payload){
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await kdfBits(password, salt, KDF_ITERS);
  const key  = await aesKeyFromBits(bits);
  const cipher = await encryptPayload(key, payload);
  await storageSet({ [VAULT_KEY]: { v:11, kdf:{ salt:b64enc(salt), iters:KDF_ITERS, hash:'SHA-256' }, cipher } });
  _aesKey = key;
  await sessionSetKey({ k:b64enc(bits), t:Date.now() });
}
async function unlockWithPassword(password){
  const vault = await storageGet(VAULT_KEY);
  if(!vault) throw new Error('No wallet on this device yet.');
  const bits = await kdfBits(password, b64dec(vault.kdf.salt), vault.kdf.iters);
  const key  = await aesKeyFromBits(bits);
  let payload;
  try{ payload = await decryptPayload(key, vault.cipher); }
  catch(e){ throw new Error('Wrong password.'); }
  _aesKey = key;
  await sessionSetKey({ k:b64enc(bits), t:Date.now() });
  // v4.3 — silent KDF upgrade: if this vault was created with fewer iterations
  // than the current floor, transparently re-encrypt it with a fresh salt at
  // KDF_ITERS while we hold the plaintext password. Non-fatal on failure —
  // the wallet still unlocks; we simply retry the upgrade next time.
  if ((vault.kdf.iters|0) < KDF_ITERS) {
    try {
      const newSalt = crypto.getRandomValues(new Uint8Array(16));
      const newBits = await kdfBits(password, newSalt, KDF_ITERS);
      const newKey  = await aesKeyFromBits(newBits);
      const cipher  = await encryptPayload(newKey, payload);
      await storageSet({ [VAULT_KEY]: { v:11, kdf:{ salt:b64enc(newSalt), iters:KDF_ITERS, hash:'SHA-256' }, cipher } });
      _aesKey = newKey;
      await sessionSetKey({ k:b64enc(newBits), t:Date.now() });
    } catch(_){ /* keep the working session key; upgrade retried on next unlock */ }
  }
  return payload;
}
async function unlockFromSession(){
  const sess = await sessionGetKey();
  if(!sess || !sess.k) return null;
  const mins = await getAutolockMin();
  if(mins>0 && (Date.now()-(sess.t||0)) > mins*60000){ await sessionClearKey(); return null; }
  try{
    const vault = await storageGet(VAULT_KEY); if(!vault) return null;
    const key = await aesKeyFromBits(b64dec(sess.k));
    const payload = await decryptPayload(key, vault.cipher);
    _aesKey = key;
    await sessionSetKey({ k:sess.k, t:Date.now() });
    return payload;
  }catch(e){ await sessionClearKey(); return null; }
}

function payloadFromState(){
  return { accounts:_accounts.map(a=>({ name:a.name, wif:a.wif, origin:a.origin||'wif', path:a.path||null })), active:_active };
}
function applyPayload(p){
  _accounts = (p.accounts||[]).map(a=>({ name:a.name, wif:a.wif, origin:a.origin||'wif', path:a.path||null, address:wifToAddress(a.wif) }));
  _active = Math.min(p.active||0, Math.max(0, _accounts.length-1));
  if(_accounts.length) setActive(_active);
}
async function saveAccounts(){
  if(!_aesKey) throw new Error('Wallet is locked.');
  const vault = await storageGet(VAULT_KEY);
  if(!vault) throw new Error('Vault missing — remove and restore the wallet.');
  vault.cipher = await encryptPayload(_aesKey, payloadFromState());
  await storageSet({ [VAULT_KEY]: vault });
  sessionGetKey().then(s=>{ if(s&&s.k) sessionSetKey({ k:s.k, t:Date.now() }); });
}
function setActive(i){ _active=i; const a=_accounts[i]; _wif=a.wif; _address=a.address; }
async function lockWallet(){
  _aesKey=null; _accounts=[]; _wif=null; _address=null;
  try{ brc100ResetWallet(); }catch(_){}   // v4.2: wipe BRC-100 key material
  await sessionClearKey();
  showUnlock();
}
async function removeWalletNow(){
  await storageRemove(VAULT_KEY);
  await storageRemove(ACCTS_KEY); // legacy V9 plaintext, if any remains
  await sessionClearKey();
  _aesKey=null; _accounts=[]; _wif=null; _address=null;
  if(_pending) resolvePending(false, null, 'Wallet was removed');
  showSetup();
}

/* ---------- SVG icons (ORDnet design system: no emoji in production UI) ---------- */
function _svg(inner, size){ size=size||15; return '<svg xmlns="http://www.w3.org/2000/svg" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+inner+'</svg>'; }
const ICONS = {
  compass:  _svg('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
  users:    _svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  gear:     _svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  lock:     _svg('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
  wallet:   _svg('<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>'),
  tag:      _svg('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>', 13),
  sendArrow:_svg('<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>', 13),
  edit:     _svg('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>', 13),
  trash:    _svg('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>', 13),
  check:    _svg('<polyline points="20 6 9 17 4 12"/>', 13),
  x:        _svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>', 13),
  tagTiny:  _svg('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>', 10),
  arrowRight:_svg('<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>', 13),
  txSmall:  _svg('<path d="M16 3l4 4-4 4"/><path d="M20 7H4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/>', 13),
  // approval header icons (rendered inside .logo, slightly larger)
  link:     _svg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>', 26),
  sendBig:  _svg('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>', 26),
  pen:      _svg('<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>', 26),
  cart:     _svg('<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>', 26),
  bag:      _svg('<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>', 26),
  copy:     _svg('<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>', 13),
  key:      _svg('<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>', 13),
  // v4.2 — UTXO tools (top bar) + bottom-menu tab icons (iOS layout)
  utxo:     _svg('<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>'),
  navWallet:_svg('<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>', 19),
  navBrowser:_svg('<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>', 19),
  navGlobe: _svg('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>', 19),
  navUpload:_svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>', 19),
  navFolder:_svg('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>', 19),
  grid:     _svg('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>', 14),
  listIcon: _svg('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>', 14)
};

/* ---------- network: UTXOs + broadcast ---------- */
async function fetchUnspent(address){
  const urls = [
    `${API_BASE}/address/${address}/confirmed/unspent`,
    `${API_BASE}/address/${address}/unspent`
  ];
  for(const url of urls){
    try{
      const res = await fetch(url);
      if(!res.ok) continue;
      const data = await res.json();
      let list = Array.isArray(data) ? data : (data && Array.isArray(data.result) ? data.result : []);
      list = list.filter(u => u && u.tx_hash && !u.isSpentInMempoolTx);
      if(list.length) return list;
    }catch(_){}
  }
  return [];
}
async function getUTXOs(address){
  const list = await fetchUnspent(address);
  const script = bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(address)).toHex();
  let shaped = list
    .filter(u => u.tx_hash && u.tx_hash.length === 64)
    .filter(u => u.value > 1) // ordinal protection: 1-sat UTXOs may be SNS names / BSVmaps — never spend as funding
    .slice(0, 200) // enough funding headroom for bulk claims (300 BSVmaps ≈ 1.5 BSV)
    .map(u => ({ txid:u.tx_hash, vout:u.tx_pos, satoshis:u.value, script, scriptPubKey:script }));
  // v4.2 — chain mechanism: minus the spent-guard, plus our own chain tips
  // WoC doesn't list yet — consecutive transactions never starve for funding
  const guarded = new Set(_spentGuard[address]||[]);
  shaped = shaped.filter(u => !guarded.has(u.txid+':'+u.vout));
  // v4.2 — BRC-100 relinquishOutput: outpoints the wallet must no longer
  // manage are excluded from funding (persisted per address)
  const relinquished = _brc100Relinquished[address]||[];
  if(relinquished.length){
    const rel=new Set(relinquished);
    shaped = shaped.filter(u => !rel.has(u.txid+'.'+u.vout));
  }
  const listed = new Set(shaped.map(u => u.txid+':'+u.vout));
  const tips = (_chainTips[address]||[]).filter(t =>
    !listed.has(t.txid+':'+t.vout) && !guarded.has(t.txid+':'+t.vout) && t.satoshis>1);
  return shaped.concat(tips.map(t => ({ txid:t.txid, vout:t.vout, satoshis:t.satoshis, script, scriptPubKey:script })));
}
async function broadcast(tx){
  const res=await fetch(`${API_BASE}/tx/raw`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ txhex:tx.toString() }) });
  if(!res.ok) throw new Error(await res.text());
  return (await res.text()).replace(/"/g,'');
}

/* =========================================================================
   v4.2 — chain mechanism (iOS v2.3.0 parity): consecutive TXs without
   waiting. After every successful broadcast the wallet registers its own
   change/split outputs as immediately-spendable "chain tips" and puts the
   inputs it just spent in a spent-guard. getUTXOs() then serves: WoC list
   minus the guard, plus the tips WoC doesn't know yet. Result: Send,
   Inscribe, ordinal transfers, the UTXO tools and BRC-100 createAction run
   back-to-back without "no spendable UTXOs". 1-sat outputs are NEVER tips
   (ordinal protection holds everywhere). Tips persist per address and are
   validated against the direct spent-endpoint on unlock/account switch.
   ========================================================================= */
const CHAIN_TIPS_KEY  = 'ordplug_chain_tips_v1';
const SPENT_GUARD_KEY = 'ordplug_spent_guard_v1';
let _chainTips = {};    // { address: [{txid, vout, satoshis}] }
let _spentGuard = {};   // { address: ["txid:vout", ...] }

async function loadChainState(){
  _chainTips = (await storageGet(CHAIN_TIPS_KEY)) || {};
  _spentGuard = (await storageGet(SPENT_GUARD_KEY)) || {};
}
async function saveChainState(){
  await storageSet({ [CHAIN_TIPS_KEY]: _chainTips, [SPENT_GUARD_KEY]: _spentGuard });
}
/* parse a signed rawtx and report: the inputs it spends and the outputs that
   pay >1 sat to `address` (spendable change/split outputs — 1-sat outputs are
   ordinals and are NEVER funding). Port of the iOS engine's txSpendInfo. */
function txSpendInfo(rawtx, address){
  const tx=new bsv.Transaction(rawtx);
  const script=bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(address)).toHex();
  const inputs=tx.inputs.map(i=>({ txid:i.prevTxId.toString('hex'), vout:i.outputIndex }));
  const own=[];
  tx.outputs.forEach((o,idx)=>{
    if(o.script.toHex()===script && o.satoshis>1){
      own.push({ txid:tx.id, vout:idx, satoshis:o.satoshis });
    }
  });
  return { txid:tx.id, inputs, ownOutputs:own };
}
/* on unlock / account switch: drop tips that are PROVABLY spent (the direct
   spent-endpoint; unknown keeps the tip — it fails fast on conflict anyway)
   and keep the guard bounded. */
async function validateChainTips(){
  const addr=_address; if(!addr) return;
  const tips=_chainTips[addr]||[];
  if(tips.length){
    const keep=[];
    for(const t of tips){
      if(await outpointSpent(t.txid, t.vout)===true) continue;
      keep.push(t);
    }
    _chainTips[addr]=keep;
  }
  if((_spentGuard[addr]||[]).length>300) _spentGuard[addr]=[];
  await saveChainState();
}
/* bookkeeping after a successful broadcast of OUR OWN tx */
function registerBroadcast(rawtx){
  let info; try{ info=txSpendInfo(rawtx, _address); }catch(_){ return; }
  const g=new Set(_spentGuard[_address]||[]);
  info.inputs.forEach(i=>g.add(i.txid+':'+i.vout));
  _spentGuard[_address]=[...g];
  let tips=(_chainTips[_address]||[]).filter(t=>!g.has(t.txid+':'+t.vout));
  tips=tips.concat(info.ownOutputs);
  _chainTips[_address]=tips;
  saveChainState();
}
/* broadcast + chain bookkeeping. On a mempool-conflict the local picture was
   stale: guard the attempted inputs, drop the tips and ask (inline) for one
   retry on a fresh set. */
async function broadcastAndRegister(tx){
  const rawtx=tx.toString();
  try{
    const txid=await broadcast(tx);
    registerBroadcast(rawtx);
    return txid;
  }catch(e){
    const m=String(e && e.message || e).toLowerCase();
    if(m.includes('conflict')||m.includes('missing inputs')||m.includes('mempool')){
      try{
        const info=txSpendInfo(rawtx, _address);
        const g=new Set(_spentGuard[_address]||[]);
        info.inputs.forEach(i=>g.add(i.txid+':'+i.vout));
        _spentGuard[_address]=[...g];
      }catch(_){}
      _chainTips[_address]=[];
      await saveChainState();
      throw new Error((e.message||e)+' — The wallet dropped its local UTXO chain and will fetch a fresh set. Try again.');
    }
    throw e;
  }
}

/* ---------- v4.2 — BRC-100 persistent state (grants, action log, relinquish) ----------
   Grants follow BRC-43, not "per keer": level 0 = open (no prompt), level 1 =
   ONE persistent grant per app per protocol, level 2 = + counterparty; the
   identity key has its own per-app grant. Money ≠ grant: every createAction /
   internalizeAction shows its own confirmation, never persisted. */
const BRC100_GRANTS_KEY       = 'ordplug_brc100_grants_v1';
const BRC100_ACTIONS_KEY      = 'ordplug_brc100_actions_v1';
const BRC100_RELINQUISHED_KEY = 'ordplug_brc100_relinquished_v1';
let _brc100Grants = [];          // ["address|origin|…"]
let _brc100Actions = {};         // { address: [record] } newest first
let _brc100Relinquished = {};    // { address: ["txid.vout"] }

async function loadBrc100State(){
  _brc100Grants = (await storageGet(BRC100_GRANTS_KEY)) || [];
  _brc100Actions = (await storageGet(BRC100_ACTIONS_KEY)) || {};
  _brc100Relinquished = (await storageGet(BRC100_RELINQUISHED_KEY)) || {};
}
function saveBrc100Grants(){ return storageSet({ [BRC100_GRANTS_KEY]: _brc100Grants }); }
function brc100LogAction(rec){
  const list=_brc100Actions[_address]||[];
  list.unshift(rec);
  _brc100Actions[_address]=list;
  storageSet({ [BRC100_ACTIONS_KEY]: _brc100Actions });
}
function brc100Relinquish(outpoint){
  const list=_brc100Relinquished[_address]||[];
  if(!list.includes(outpoint)) list.push(outpoint);
  _brc100Relinquished[_address]=list;
  storageSet({ [BRC100_RELINQUISHED_KEY]: _brc100Relinquished });
}
function addServiceFees(tx){
  const A=SERVICE_FEE_ADDRESSES, F=SERVICE_FEES;
  tx.to(bsv.Address.fromString(A.ordiBuilderAddress), F.ordiBuilderFee);
  tx.to(bsv.Address.fromString(A.onnoBuilderAddress), F.onnoBuilderFee);
  tx.to(bsv.Address.fromString(A.algoBuilderAddress), F.algoBuilderFee);
  tx.to(bsv.Address.fromString(A.colleagueIAddress),  F.colleagueIFee);
  tx.to(bsv.Address.fromString(A.protocolFeeAddress), F.protocolFee);
  tx.to(bsv.Address.fromString(A.colleagueDAddress),  F.colleagueDFee);
  tx.to(bsv.Address.fromString(A.monitorFeeAddress),  F.monitorFee);
  tx.to(bsv.Address.fromString(A.indexerFeeAddress),  F.indexerFee);
  tx.to(bsv.Address.fromString(A.partnerFeeAddress),  F.partnerFee);
  tx.to(bsv.Address.fromString(A.founderFeeAddress),  F.founderFee);
  tx.to(bsv.Address.fromString(A.foundationFeeAddress), F.foundationFee);
}
async function buildSend(toAddress, amountSat, dataStr, feeSat){
  if(!feeSat) feeSat = sendMinerFee();
  const pk=bsv.PrivateKey.fromWIF(_wif), from=pk.toAddress();
  const utxos=await getUTXOs(_address);
  if(!utxos.length) throw new Error('No spendable UTXOs. Your balance may be locked in pending (unconfirmed) transactions \u2014 wait for them to confirm, then retry.');
  const required=amountSat+feeSat+(dataStr?1:0)+TOTAL_SERVICE_FEES;
  let total=0, sel=[];
  for(const u of utxos){ sel.push(u); total+=u.satoshis; if(total>=required) break; }
  if(total<required) throw new Error('Insufficient balance for amount + fee + service fee.');
  const tx=new bsv.Transaction();
  sel.forEach(u=>tx.from(new bsv.Transaction.UnspentOutput({ txid:u.txid, outputIndex:u.vout, address:from, script:u.scriptPubKey||u.script, satoshis:u.satoshis })));
  tx.to(toAddress, amountSat);
  addServiceFees(tx);
  if(dataStr) tx.addOutput(new bsv.Transaction.Output({ satoshis:1, script:bsv.Script.buildDataOut([dataStr]) }));
  const change=total-(amountSat+(dataStr?1:0)+feeSat+TOTAL_SERVICE_FEES);
  if(change>546) tx.to(from, change);
  tx.fee(feeSat); tx.sign(pk);
  return tx;
}
async function buildInscribe(contentType, dataBytes, feeSat){
  if(!feeSat) feeSat = inscribeMinerFee(dataBytes ? dataBytes.length : 0);
  const pk=bsv.PrivateKey.fromWIF(_wif), from=pk.toAddress();
  const utxos=await getUTXOs(_address);
  if(!utxos.length) throw new Error('No spendable UTXOs. Your balance may be locked in pending (unconfirmed) transactions \u2014 wait for them to confirm, then retry.');
  const required=1+feeSat+1+TOTAL_SERVICE_FEES;
  let total=0, sel=[];
  for(const u of utxos){ sel.push(u); total+=u.satoshis; if(total>=required) break; }
  if(total<required) throw new Error('Insufficient balance for 1-sat ordinal + fee + service fee.');
  const tx=new bsv.Transaction();
  sel.forEach(u=>tx.from(new bsv.Transaction.UnspentOutput({ txid:u.txid, outputIndex:u.vout, address:from, script:u.scriptPubKey||u.script, satoshis:u.satoshis })));
  const ins=new bsv.Script();
  ins.add(bsv.Opcode.OP_FALSE); ins.add(bsv.Opcode.OP_IF);
  ins.add(bsv.deps.Buffer.from('ord','utf8'));
  ins.add(bsv.Opcode.OP_1); ins.add(bsv.deps.Buffer.from(contentType,'utf8'));
  ins.add(bsv.Opcode.OP_0); ins.add(bsv.deps.Buffer.from(dataBytes));
  ins.add(bsv.Opcode.OP_ENDIF);
  const lock=bsv.Script.buildPublicKeyHashOut(from);
  const finalScript=new bsv.Script();
  ins.chunks.forEach(c=>finalScript.chunks.push(c));
  lock.chunks.forEach(c=>finalScript.chunks.push(c));
  tx.addOutput(new bsv.Transaction.Output({ satoshis:1, script:finalScript }));
  tx.addOutput(new bsv.Transaction.Output({ satoshis:1, script:bsv.Script.buildDataOut(['ORDnet.io']) }));
  addServiceFees(tx);
  const change=total-(1+1+feeSat+TOTAL_SERVICE_FEES);
  if(change>546) tx.to(from, change);
  tx.fee(feeSat); tx.sign(pk);
  return tx;
}
/* ---------- sendTx: caller-composed transaction (inscription + payments + OP_RETURN
   in ONE approval). Outputs are appended in the exact order given, then service
   fees, then change — so an inscription-first call keeps the ordinal at vout 0.
   Sized for bulk claims: up to 350 caller outputs (300 BSVmaps + payment +
   OP_RETURN with headroom), byte-accurate fee estimate, iterative UTXO selection. */
const SENDTX_MAX_OUTPUTS = 350;
async function buildTx(params){
  const outs=Array.isArray(params.outputs)?params.outputs:[];
  if(!outs.length) throw new Error('sendTx: outputs[] required');
  if(outs.length>SENDTX_MAX_OUTPUTS) throw new Error('sendTx: too many outputs (max '+SENDTX_MAX_OUTPUTS+')');
  const pk=bsv.PrivateKey.fromWIF(_wif), from=pk.toAddress();
  const changeAddr=params.changeAddress?bsv.Address.fromString(String(params.changeAddress)):from;
  const utxos=await getUTXOs(_address);
  if(!utxos.length) throw new Error('No spendable UTXOs. Your balance may be locked in pending (unconfirmed) transactions — wait, then retry.');

  const tx=new bsv.Transaction();
  let spend=0, outBytes=0; // outBytes: real serialized size of the caller outputs (value+script)
  for(const o of outs){
    if(o.type==='p2pkh'){
      const sats=satNum(o.satoshis); if(sats<1) throw new Error('sendTx: p2pkh satoshis');
      tx.to(bsv.Address.fromString(String(o.address)), sats); spend+=sats; outBytes+=34;
    } else if(o.type==='inscription'){
      const sats=satNum(o.satoshis)||1;
      const bytes=o.dataB64?bsv.deps.Buffer.from(String(o.dataB64),'base64'):bsv.deps.Buffer.from(String(o.data),'utf8');
      const ct=String(o.contentType||'text/plain');
      const ins=new bsv.Script();
      ins.add(bsv.Opcode.OP_FALSE); ins.add(bsv.Opcode.OP_IF);
      ins.add(bsv.deps.Buffer.from('ord','utf8'));
      ins.add(bsv.Opcode.OP_1); ins.add(bsv.deps.Buffer.from(ct,'utf8'));
      ins.add(bsv.Opcode.OP_0); ins.add(bsv.deps.Buffer.from(bytes));
      ins.add(bsv.Opcode.OP_ENDIF);
      const lock=bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(String(o.address)));
      const script=new bsv.Script();
      ins.chunks.forEach(c=>script.chunks.push(c));
      lock.chunks.forEach(c=>script.chunks.push(c));
      tx.addOutput(new bsv.Transaction.Output({ satoshis:sats, script })); spend+=sats;
      outBytes+=12+bytes.length+ct.length+45; // value+varint + envelope opcodes + P2PKH tail
    } else if(o.type==='opreturn'){
      // DUST FIX: buildDataOut is a plain OP_RETURN (no leading OP_FALSE), which
      // post-genesis nodes do NOT treat as provably unspendable — a 0-sat output
      // gets rejected with "64: dust". Carry 1 sat, exactly like buildSend does.
      const parts=(o.data||[]).map(s=>String(s).startsWith('0x')?bsv.deps.Buffer.from(String(s).slice(2),'hex'):String(s));
      tx.addOutput(new bsv.Transaction.Output({ satoshis:1, script:bsv.Script.buildDataOut(parts) })); spend+=1;
      outBytes+=14+parts.reduce((a,p)=>a+(typeof p==='string'?p.length:p.length)+3,0);
    } else if(o.type==='script'){
      const sats=satNum(o.satoshis);
      if(sats<1) throw new Error('sendTx: script outputs need at least 1 satoshi (0-sat outputs are rejected as dust).');
      tx.addOutput(new bsv.Transaction.Output({ satoshis:sats, script:bsv.Script.fromHex(String(o.scriptHex)) })); spend+=sats;
      outBytes+=12+Math.ceil(String(o.scriptHex).length/2);
    } else throw new Error('sendTx: unknown output type '+o.type);
  }

  if(params.includeServiceFees!==false) addServiceFees(tx);
  const svc=(params.includeServiceFees!==false)?TOTAL_SERVICE_FEES:0;
  const svcBytes=(params.includeServiceFees!==false)?11*34:0;

  // Fee & funding selection — iterate: more inputs make the tx bigger, which
  // raises the fee, which may in turn need one more input.
  let feeSat=(params.fee|0), total=0, sel=[];
  for(let nIn=1;;){
    const fee=feeSat||Math.ceil((10 + nIn*148 + outBytes + svcBytes + 34) * FEE_RATE);
    const required=spend+svc+fee;
    total=0; sel=[];
    for(const u of utxos){ sel.push(u); total+=u.satoshis; if(total>=required) break; }
    if(total<required) throw new Error('Insufficient balance for outputs + fees.');
    if(feeSat || sel.length<=nIn){ feeSat=fee; break; }
    nIn=sel.length;
  }
  sel.forEach(u=>tx.from(new bsv.Transaction.UnspentOutput({ txid:u.txid, outputIndex:u.vout, address:from, script:u.scriptPubKey||u.script, satoshis:u.satoshis })));

  const change=total-(spend+svc+feeSat);
  if(change>546) tx.to(changeAddr, change);
  tx.fee(feeSat); tx.sign(pk);
  return tx;
}
async function getBalance(){
  const r=await fetch(`${API_BASE}/address/${_address}/balance`); const j=await r.json();
  return { confirmed:j.confirmed||0, unconfirmed:j.unconfirmed||0 };
}
function signMessage(message){
  const pk=bsv.PrivateKey.fromWIF(_wif);
  if(bsv.Message) return { signature:new bsv.Message(message).sign(pk), pubkey:pk.toPublicKey().toString() };
  const hash=bsv.crypto.Hash.sha256sha256(bsv.deps.Buffer.from(message,'utf8'));
  return { signature:bsv.crypto.ECDSA.sign(hash, pk).toString(), pubkey:pk.toPublicKey().toString() };
}

/* ---------- view helpers ---------- */
function $(id){ return document.getElementById(id); }
const VIEWS=['unlock','migrate','setup','accounts','settings','approve','idle','send','sendord','listord','delist','receive','history','browse','domains','backup','changepw','sites','book','domain','utxo','upload','ordner','ordfile','brc100perm','brc100tx'];
/* v4.2 — the five bottom-menu tabs (iOS layout): Wallet · Browser · Domains ·
   Upload · ORD/ner. The bar only shows on these views; sub-views (send,
   detail, approvals) fill the popup like before. */
const NAV_VIEWS=['idle','browse','domains','upload','ordner'];
function showView(name){
  VIEWS.forEach(v=>$('view-'+v).classList.toggle('hidden', v!==name));
  const nav=$('bottomNav');
  if(nav){
    const on=NAV_VIEWS.includes(name);
    nav.classList.toggle('hidden', !on);
    document.body.classList.toggle('has-nav', on);
    nav.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b.dataset.nav===name));
  }
}
function err(el, t){ el.textContent=t; el.classList.add('show'); }
function clr(el){ el.textContent=''; el.classList.remove('show'); }
function esc(s){ return String(s).replace(/[<>&"'`]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c])); }
function safeDistrict(d){ const s=String(d); if(!/^[0-9]{1,10}$/.test(s)) throw new Error("Invalid district."); return s; } // v4.3 URL-path guard

/* ---------- setup / create / import (V11: password + BIP44/legacy/WIF) ---------- */
function checkPw(p1, p2){
  if(!p1 || p1.length < 8) throw new Error('Password must be at least 8 characters.');
  if(p1 !== p2) throw new Error('Passwords do not match.');
}
function showSetup(){ showView('setup'); setupChoice(); }
function setupChoice(){
  $('setup-choice').classList.remove('hidden');
  $('setup-create').classList.add('hidden');
  $('setup-import').classList.add('hidden');
}
function showCreate(){
  $('setup-choice').classList.add('hidden');
  $('setup-import').classList.add('hidden');
  $('setup-create').classList.remove('hidden');
  clr($('createErr')); $('createPw1').value=''; $('createPw2').value='';
  try{
    const ent=crypto.getRandomValues(new Uint8Array(16));
    const mnemonic=entropyToMnemonic(ent);
    $('newMnemonic').value=mnemonic;
    $('newAddress').textContent=wifToAddress(mnemonicToWifBip44(mnemonic));
    $('createBtn').disabled=false;
  }catch(e){
    $('newMnemonic').value=''; $('newAddress').textContent='—'; $('createBtn').disabled=true;
    err($('createErr'), 'Could not generate a wallet: '+(e.message||e));
  }
}
async function createWalletNow(){
  clr($('createErr'));
  const mnemonic=$('newMnemonic').value.trim();
  if(!validateMnemonic(mnemonic)){ err($('createErr'),'Recovery phrase missing — go Back and try again.'); return; }
  const btn=$('createBtn'); btn.disabled=true; const ol=btn.textContent; btn.innerHTML='<span class="spinner"></span> Encrypting...';
  try{
    checkPw($('createPw1').value, $('createPw2').value);
    const wif=mnemonicToWifBip44(mnemonic);
    const addr=wifToAddress(wif);
    const acctName=$('createName').value.trim()||'Account 1';
    _accounts=[{ name:acctName, wif, origin:'bip44', path:BIP44_PATH, address:addr }];
    _sessionPhrases[addr]=mnemonic;
    _active=0; setActive(0);
    await createVault($('createPw1').value, payloadFromState());
    await afterReady();
  }catch(e){ err($('createErr'), e.message||'Failed.'); }
  finally{ btn.disabled=false; btn.textContent=ol; }
}
function showImport(){
  $('setup-choice').classList.add('hidden');
  $('setup-create').classList.add('hidden');
  $('setup-import').classList.remove('hidden');
  setImport('bip44'); clr($('importErr'));
  $('importPw1').value=''; $('importPw2').value='';
}
const IMP_HINTS = {
  bip44:  "Standard BSV derivation ("+"m/44'/236'/0'/0/0"+") — compatible with most BSV wallets.",
  other:  'Pick the app where this wallet was created; the matching derivation path is applied automatically.',
  legacy: 'ORD/plug V9 derivation — use this to restore a wallet created in an earlier ORD/plug version.',
  wif:    'Paste a single private key in WIF format (starts with K, L or 5).'
};
function fillWalletPicker(){
  const sel=$('importWalletSel');
  if(sel.options.length) return; // once
  sel.innerHTML=WALLET_PRESETS.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
}
function onPresetChange(){
  const p=presetById($('importWalletSel').value);
  $('importCustomPath').classList.toggle('hidden', !p.custom);
  if(p.custom && !$('importCustomPath').value) $('importCustomPath').value=p.path;
  $('importPin').classList.toggle('hidden', !p.pin);
  $('impHint').textContent=p.note || IMP_HINTS.other;
  $('importPreview').classList.add('hidden'); $('importPreview').innerHTML='';
}
function setImport(m){
  _impMode=m;
  $('impSegB').classList.toggle('on', m==='bip44');
  $('impSegO').classList.toggle('on', m==='other');
  $('impSegL').classList.toggle('on', m==='legacy');
  $('impSegW').classList.toggle('on', m==='wif');
  $('importMnemonic').classList.toggle('hidden', m==='wif');
  $('importWif').classList.toggle('hidden', m!=='wif');
  $('importWalletPicker').classList.toggle('hidden', m!=='other');
  if(m==='other'){ fillWalletPicker(); onPresetChange(); }
  else $('impHint').textContent=IMP_HINTS[m];
}
/* Resolve the WIF for the currently-selected "other wallet" preset. */
function otherWalletResolve(mnemonic){
  const p=presetById($('importWalletSel').value);
  let path=p.path;
  if(p.custom){
    path=$('importCustomPath').value.trim();
    if(!/^m(\/\d+'?)+$/.test(path)) throw new Error("Enter a valid path like m/44'/236'/0'/0/0.");
  }
  const pin=p.pin ? $('importPin').value : '';
  return { wif:mnemonicToWifPath(mnemonic, path, pin), origin:'bip44', path, phrase:mnemonic };
}
function wifFromImportInputs(mode, mnemonicEl, wifEl){
  if(mode==='wif'){
    const wif=wifEl.value.trim();
    if(!wif) throw new Error('Enter a private key (WIF).');
    wifToAddress(wif); // validates
    return { wif, origin:'wif', path:null, phrase:null };
  }
  const m=mnemonicEl.value.trim().toLowerCase();
  if(!validateMnemonic(m)) throw new Error('Invalid recovery phrase.');
  if(mode==='other')  return otherWalletResolve(m);
  if(mode==='legacy') return { wif:mnemonicToWif(m), origin:'legacy', path:null, phrase:m };
  return { wif:mnemonicToWifBip44(m), origin:'bip44', path:BIP44_PATH, phrase:m };
}
/* Preview the address(es) a preset would import, so the user can confirm before committing. */
function importPreview(){
  const box=$('importPreview'); box.classList.remove('hidden');
  const m=$('importMnemonic').value.trim().toLowerCase();
  if(!validateMnemonic(m)){ box.innerHTML='<div class="alert alert-danger show">Enter a valid recovery phrase first.</div>'; return; }
  const p=presetById($('importWalletSel').value);
  const pin=p.pin ? $('importPin').value : '';
  const rows=[];
  const tryPath=(label, path)=>{
    try{
      if(p.custom && !/^m(\/\d+'?)+$/.test(path)) throw new Error('bad path');
      const addr=wifToAddress(mnemonicToWifPath(m, path, pin));
      rows.push(`<div class="kv"><span class="k">${esc(label)}</span><span class="v">${esc(addr)}</span></div>`);
    }catch(e){ rows.push(`<div class="kv"><span class="k">${esc(label)}</span><span class="v">invalid path</span></div>`); }
  };
  const mainPath = p.custom ? $('importCustomPath').value.trim() : p.path;
  tryPath(p.name+' (main)', mainPath);
  (p.alt||[]).forEach((ap,i)=>tryPath('alt '+(i+1)+' ('+ap+')', ap));
  box.innerHTML='<div class="card" style="padding:12px">'+rows.join('')+
    '</div><div class="hint">This is the address that will be imported. If your coins are on a different address, try another wallet or a custom path.</div>';
}
async function importWalletNow(){

  clr($('importErr'));
  const btn=$('importBtn'); btn.disabled=true; const ol=btn.textContent; btn.innerHTML='<span class="spinner"></span> Encrypting...';
  try{
    checkPw($('importPw1').value, $('importPw2').value);
    const r=wifFromImportInputs(_impMode, $('importMnemonic'), $('importWif'));
    const addr=wifToAddress(r.wif);
    const acctName=$('importName').value.trim()||'Account 1';
    _accounts=[{ name:acctName, wif:r.wif, origin:r.origin, path:r.path, address:addr }];
    if(r.phrase) _sessionPhrases[addr]=r.phrase;
    _active=0; setActive(0);
    await createVault($('importPw1').value, payloadFromState());
    $('importMnemonic').value=''; $('importWif').value='';
    await afterReady();
  }catch(e){ err($('importErr'), e.message||'Import failed.'); }
  finally{ btn.disabled=false; btn.textContent=ol; }
}

/* ---------- migrate: V9 plaintext -> V11 encrypted vault ---------- */
function showMigrate(legacy){ _legacyData=legacy; showView('migrate'); clr($('migErr')); }
async function doMigrate(){
  clr($('migErr'));
  const btn=$('migBtn'); btn.disabled=true; const ol=btn.textContent; btn.innerHTML='<span class="spinner"></span> Encrypting...';
  try{
    checkPw($('migPw1').value, $('migPw2').value);
    _accounts=(_legacyData && _legacyData.accounts || []).map(a=>({ name:a.name, wif:a.wif, origin:'legacy', path:null, address:wifToAddress(a.wif) }));
    if(!_accounts.length) throw new Error('No accounts found to migrate.');
    _active=Math.min(_legacyData.active||0, _accounts.length-1); setActive(_active);
    await createVault($('migPw1').value, payloadFromState());
    await storageRemove(ACCTS_KEY); // plaintext keys wiped
    _legacyData=null;
    await afterReady();
  }catch(e){ err($('migErr'), e.message||'Migration failed.'); }
  finally{ btn.disabled=false; btn.textContent=ol; }
}

/* ---------- unlock ---------- */
function showUnlock(msg){
  showView('unlock');
  $('unlockPw').value=''; clr($('unlockErr'));
  $('forgotConfirm').classList.add('hidden');
  $('unlockSub').textContent = msg || 'Enter your password to unlock';
  setTimeout(()=>{ try{ $('unlockPw').focus(); }catch(e){} }, 60);
}
async function doUnlock(){
  clr($('unlockErr'));
  const pw=$('unlockPw').value;
  if(!pw){ err($('unlockErr'),'Enter your password.'); return; }
  const btn=$('unlockBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Unlocking...';
  try{
    const payload=await unlockWithPassword(pw);
    applyPayload(payload);
    await afterReady();
  }catch(e){ err($('unlockErr'), e.message||'Unlock failed.'); }
  finally{ btn.disabled=false; btn.textContent='Unlock'; }
}

async function afterReady(){
  // v4.2 — chain mechanism + BRC-100 state: load persisted tips/guard and
  // drop tips that are provably spent (direct spent-endpoint) before serving
  await loadChainState();
  await loadBrc100State();
  validateChainTips();   // runs in the background; unknown keeps the tip
  if(_pending){
    const conn=(await new Promise(r=>chrome.storage.session.get(['ordplug_connected'],x=>r(x.ordplug_connected))))||{};
    const readMethods=['getAddress','getPublicKey','getBalance'];
    if(readMethods.includes(_pending.method) && conn[_pending.origin]){
      try{
        let result;
        if(_pending.method==='getAddress') result={ address:_address };
        else if(_pending.method==='getPublicKey') result={ pubkey:wifToPubKey(_wif), address:_address };
        else result=await getBalance();
        resolvePending(true, result); window.close(); return;
      }catch(e){ resolvePending(false, null, e.message); window.close(); return; }
    }
    presentApproval();
  } else if(_pendingBrc100){
    // v4.2 — BRC-100 request: grants sheet / tx confirm / data answer
    handleBrc100Pending(_pendingBrc100);
  } else {
    showIdle();
  }
}

/* ---------- accounts + security ---------- */
function setAdd(m){ _addMode=m; $('addSegG').classList.toggle('on',m==='gen'); $('addSegI').classList.toggle('on',m==='imp');
  $('addImportWrap').classList.toggle('hidden',m!=='imp'); }
function setAddImp(m){
  _addImpMode=m;
  $('aImpSegB').classList.toggle('on', m==='bip44');
  $('aImpSegO').classList.toggle('on', m==='other');
  $('aImpSegL').classList.toggle('on', m==='legacy');
  $('aImpSegW').classList.toggle('on', m==='wif');
  $('addMnemonic').classList.toggle('hidden', m==='wif');
  $('addWif').classList.toggle('hidden', m!=='wif');
  $('addWalletPicker').classList.toggle('hidden', m!=='other');
  if(m==='other'){ fillAddWalletPicker(); onAddPresetChange(); }
}
function fillAddWalletPicker(){
  const sel=$('addWalletSel'); if(sel.options.length) return;
  sel.innerHTML=WALLET_PRESETS.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
}
function onAddPresetChange(){
  const p=presetById($('addWalletSel').value);
  $('addCustomPath').classList.toggle('hidden', !p.custom);
  if(p.custom && !$('addCustomPath').value) $('addCustomPath').value=p.path;
  $('addPin').classList.toggle('hidden', !p.pin);
  $('addImpHint').textContent=p.note || '';
}
function addOtherWalletResolve(mnemonic){
  const p=presetById($('addWalletSel').value);
  let path=p.path;
  if(p.custom){ path=$('addCustomPath').value.trim(); if(!/^m(\/\d+'?)+$/.test(path)) throw new Error("Enter a valid path like m/44'/236'/0'/0/0."); }
  const pin=p.pin ? $('addPin').value : '';
  return { wif:mnemonicToWifPath(mnemonic, path, pin), origin:'bip44', path, phrase:mnemonic };
}
async function showAccounts(){
  showView('accounts'); _confirmRemove=-1; renderAccounts();
  clr($('addErr')); $('addName').value=''; setAdd('gen'); setAddImp('bip44');
}
async function showSettings(){
  showView('settings');
  $('removeConfirm').classList.add('hidden');
  try{ $('autolockSel').value=String(await getAutolockMin()); }catch(e){}
  renderBrc100Grants();   // v4.2 — BRC-100 grants manager
}
const ORIGIN_LABEL = { bip44:'BIP44', legacy:'legacy', wif:'WIF', random:'generated' };
function renderAccounts(){
  $('acctCount').textContent=_accounts.length+' account'+(_accounts.length!==1?'s':'');
  $('acctList').innerHTML=_accounts.map((a,i)=>`
    <div class="acct ${i===_active?'active':''}" data-i="${i}">
      <div class="ic">${(a.name||'A').charAt(0).toUpperCase()}</div>
      <div class="m">
        <div class="nm">${esc(a.name||'Account')}${i===_active?'<span class="badge">active</span>':''}</div>
        <div class="ad" title="${esc(ORIGIN_LABEL[a.origin]||'')}">${esc(a.address)}</div>
      </div>
      <div class="ax">
        ${i!==_active?`<button class="iconbtn" title="Use" data-act="use" data-i="${i}">${ICONS.arrowRight}</button>`:''}
        <button class="iconbtn" title="Rename" data-act="rename" data-i="${i}">${ICONS.edit}</button>
        <button class="iconbtn" title="Export key / backup" data-act="export" data-i="${i}">${ICONS.key}</button>
        ${_accounts.length>1?(_confirmRemove===i
            ? `<button class="iconbtn" style="color:var(--status-red);border-color:var(--status-red)" title="Confirm" data-act="remove" data-i="${i}">${ICONS.check}</button>`
            : `<button class="iconbtn" title="Remove" data-act="askremove" data-i="${i}">${ICONS.trash}</button>`):''}
      </div>
    </div>`).join('');
}
async function switchAccount(i){ setActive(i); _confirmRemove=-1; renderAccounts(); validateChainTips(); try{ await saveAccounts(); }catch(e){ err($('addErr'),'Switched, but could not save: '+(e.message||e)); } }
function renameAccount(i){
  const cur=_accounts[i].name||'';
  const cards=$('acctList').querySelectorAll('.acct'); const card=cards[i]; if(!card) return;
  const nm=card.querySelector('.nm');
  nm.innerHTML=`<input class="form-input" style="padding:6px 8px;font-size:13px" value="${esc(cur)}" id="renameInput">`;
  const inp=$('renameInput'); inp.focus(); inp.select();
  inp.onkeydown=async(e)=>{ if(e.key==='Enter'){ _accounts[i].name=inp.value.trim()||cur; await saveAccounts(); renderAccounts(); } if(e.key==='Escape') renderAccounts(); };
  inp.onblur=async()=>{ _accounts[i].name=inp.value.trim()||cur; await saveAccounts(); renderAccounts(); };
}
function askRemove(i){ _confirmRemove=i; renderAccounts(); }
async function removeAccount(i){
  if(_accounts.length<=1) return;
  _accounts.splice(i,1);
  if(_active>=_accounts.length) _active=_accounts.length-1;
  if(_active===i) _active=Math.max(0,i-1);
  setActive(Math.min(_active,_accounts.length-1));
  _confirmRemove=-1;
  renderAccounts();                       // reflect the removal in the UI immediately
  try{ await saveAccounts(); }
  catch(e){ err($('addErr'), 'Removed, but could not save: '+(e.message||e)+' — unlock and try again.'); }
}
async function addAccount(){
  clr($('addErr'));
  const btn=$('addBtn'); btn.disabled=true;
  try{
    let wif, origin, path=null, phrase=null;
    if(_addMode==='gen'){ wif=bsv.PrivateKey.fromRandom().toWIF(); origin='random'; }
    else if(_addImpMode==='other'){
      const m=$('addMnemonic').value.trim().toLowerCase();
      if(!validateMnemonic(m)) throw new Error('Invalid recovery phrase.');
      const r=addOtherWalletResolve(m); wif=r.wif; origin=r.origin; path=r.path; phrase=r.phrase;
    } else {
      const r=wifFromImportInputs(_addImpMode, $('addMnemonic'), $('addWif'));
      wif=r.wif; origin=r.origin; path=r.path; phrase=r.phrase;
    }
    const addr=wifToAddress(wif);
    if(_accounts.some(a=>a.address===addr)) throw new Error('That account is already in the wallet.');
    const name=$('addName').value.trim() || ('Account '+(_accounts.length+1));
    _accounts.push({ name, wif, origin, path, address:addr });
    if(phrase) _sessionPhrases[addr]=phrase;
    $('addMnemonic').value=''; $('addWif').value=''; $('addName').value=''; setAdd('gen'); setAddImp('bip44');
    renderAccounts();
    await saveAccounts();
  }catch(e){ err($('addErr'), e.message||'Could not add account.'); }
  finally{ btn.disabled=false; }
}

/* ---------- holdings: SNS names + BSVmaps from the ORDnet V30 indexer ---------- */
let _holdings = [];
let _soSel = null;

let _holdTab = 'sns';      // active tab: 'sns' | 'bsvmap' | 'opns' | 'sale'
let _holdPage = 0;         // current page within the active tab
let _holdSearch = '';      // search query
let _idxOk = true;         // bsvmap.io indexer reachable?
let _opnsOk = true;        // v4.1 — OpNS index reachable? (own flag: an OpNS
                           // failure never touches SNS/BSVmaps, and vice versa)
const HOLD_PER_PAGE = 20;

/* BSVmap mark: orange square block, centered on the black tile (no emoji) */
const BSVMAP_MARK='<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#f7931e"/></svg>';
/* SNS mark: ORD/plug segmented-donut "C" logo on the black tile */
const SNS_MARK='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 100 100">'
  +'<circle cx="50" cy="50" r="25" fill="none" stroke="#fcfaf5" stroke-width="18"/>'
  +'<line x1="46" y1="6" x2="46" y2="50" stroke="#0a0a0a" stroke-width="7"/>'
  +'<line x1="50" y1="48" x2="96" y2="48" stroke="#0a0a0a" stroke-width="7"/>'
  +'<line x1="51" y1="51" x2="84" y2="84" stroke="#0a0a0a" stroke-width="7"/>'
  +'</svg>';
/* v4.1 — OpNS mark: @-icon like SNS on search.ordnet.io, and deliberately
   NO ✓ badge (that mark is reserved for ORDnet's own inscriptions) */
const OPNS_MARK='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fcfaf5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'
  +'<circle cx="12" cy="12" r="4"/>'
  +'<path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>'
  +'</svg>';
function holdMark(kind){ return kind==='sns'?SNS_MARK : kind==='opns'?OPNS_MARK : BSVMAP_MARK; }
/* sale price of a listed item in sats — tolerant to indexer field naming */
function listedPriceSats(item){
  const v=item.priceSat ?? item.priceSats ?? item.listPriceSat ?? item.listPrice ?? item.price;
  const n=parseInt(v,10);
  return (n>0) ? n : 0;
}
/* status pill: compact tag icon + price for listed items (no word, no row growth) */
function holdStatusPill(item){
  if(item.status==='listed'){
    const pr=listedPriceSats(item);
    return `<span class="hstatus listed" title="Listed for sale">${ICONS.tagTiny}${pr?esc(bsvFmt(pr))+' BSV':''}</span>`;
  }
  // v4.2 (iOS v2.6.1) — listed on the DOMAIN registry (USD) via the Domains tab
  if(item.domainListedUsd!==undefined && item.domainListedUsd!==null){
    return `<span class="hstatus listed" title="Listed on the domain registry — manage it in the Domains tab">${ICONS.tagTiny}$${esc(String(item.domainListedUsd))}</span>`;
  }
  return `<span class="hstatus ${esc(item.status)}">${esc(item.status)}</span>`;
}
/* v4.1 — row subline: OpNS API responses contain no block height field, the
   row shows just "OpNS" (claimHeight stays 0 internally, same as iOS v2.1) */
function holdSubline(item){
  if(item.kind==='opns') return 'OpNS';
  return (item.kind==='bsvmap'?('district #'+item.district+' · '):'')+'block '+item.claimHeight;
}
function holdRenderItem(item){
  const idx=_holdings.indexOf(item);
  if(_bulkMode){
    const eligible=bulkEligible(item);
    const checked=_bulkSel.has(idx);
    return `
    <div class="holding${eligible?'':' bulk-dim'}"${eligible?` data-bulkrow="${idx}" style="cursor:pointer"`:''}>
      <input type="checkbox" class="bulkchk"${checked?' checked':''}${eligible?` data-bulkchk="${idx}"`:' disabled'}>
      <div class="hic ${item.kind}">${holdMark(item.kind)}</div>
      <div class="hm">
        <div class="hn">${esc(item.name)}</div>
        <div class="hs">${holdSubline(item)}</div>
      </div>
      ${holdStatusPill(item)}
    </div>`;
  }
  // v4.1 — OpNS: display, resolve and send ONLY. No marketplace flows
  // (list/delist deliberately absent — that decision has not been taken).
  // v4.2 (iOS v2.6.1) — a domain listed on the DOMAIN registry gets a link to
  // its Domains detail instead: deliberately NO second (bsvmap) listing.
  const domainListed=(item.kind==='sns' && item.domainListedUsd!==undefined && item.domainListedUsd!==null);
  const listBtn = item.kind==='opns' ? ''
    : domainListed
    ? `<button class="iconbtn" title="Manage domain listing (Domains tab)" data-managedomain="${esc(item.name)}">${ICONS.edit}</button>`
    : item.status==='listed'
    ? `<button class="iconbtn" title="Remove listing (delist)" data-delist="${idx}">${ICONS.x}</button>`
    : `<button class="iconbtn" title="List for sale" data-list="${idx}">${ICONS.tag}</button>`;
  return `
    <div class="holding">
      <div class="hic ${item.kind}">${holdMark(item.kind)}</div>
      <div class="hm" data-open="${(item.kind==='sns'||item.kind==='opns')
        ? 'https://search.ordnet.io/?q='+encodeURIComponent(item.name)
        : 'https://bsvmap.io/#'+item.district}" style="cursor:pointer">
        <div class="hn">${esc(item.name)}</div>
        <div class="hs">${holdSubline(item)}</div>
      </div>
      ${holdStatusPill(item)}
      ${listBtn}
      <button class="iconbtn" title="Send" data-send="${idx}">${ICONS.sendArrow}</button>
    </div>`;
}
function holdFiltered(){
  const q=_holdSearch.trim().toLowerCase();
  const match=x=>!q || (x.name||'').toLowerCase().includes(q) || (x.kind==='bsvmap' && String(x.district).includes(q));
  const isListedAny=x=>x.status==='listed' || (x.domainListedUsd!==undefined && x.domainListedUsd!==null);
  const arr=_holdings.filter(x=>{
    if(_holdTab==='sale'){ if(!isListedAny(x)) return false; } // For sale: bsvmap/SNS ordinal listings + domain-registry listings (v2.6.1)
    else if(x.kind!==_holdTab) return false;
    return match(x);
  });
  // listed items always on top, original order preserved within each group
  return arr.slice().sort((a,b)=>(isListedAny(b)?1:0)-(isListedAny(a)?1:0));
}
function renderHoldings(){
  const list=$('holdList'); if(!list) return;
  const filtered=holdFiltered();
  const total=filtered.length;
  const pages=Math.max(1, Math.ceil(total/HOLD_PER_PAGE));
  if(_holdPage>=pages) _holdPage=pages-1;
  if(_holdPage<0) _holdPage=0;
  const start=_holdPage*HOLD_PER_PAGE;
  const slice=filtered.slice(start, start+HOLD_PER_PAGE);
  if(!total){
    const q=_holdSearch.trim();
    const tabLabel={ sns:'SNS names', bsvmap:'BSVmaps', opns:'OpNS names', sale:'listed items' }[_holdTab];
    let note;
    if(q) note='No '+tabLabel+' match "'+esc(q)+'".';
    else if(_holdTab==='opns') note=_opnsOk ? 'No OpNS names on this address yet.' : 'Could not reach the OpNS index at search.ordnet.io.';
    else if(!_idxOk) note='Could not reach the ORDnet indexer at bsvmap.io.';
    else if(_holdTab==='sale') note='Nothing listed for sale yet. Use the tag button on an SNS name or BSVmap to list it.';
    else note=(_holdTab==='sns'?'No SNS names on this address yet.':'No BSVmaps on this address yet. Claim one on bsvmap.io!');
    list.innerHTML='<div class="empty-note">'+note+'</div>';
  } else {
    list.innerHTML=slice.map(holdRenderItem).join('');
  }
  const pager=$('holdPager');
  if(total>HOLD_PER_PAGE){
    pager.classList.remove('hidden');
    $('holdPrev').disabled=(_holdPage<=0);
    $('holdNext').disabled=(_holdPage>=pages-1);
    $('holdPageInfo').textContent='Page '+(_holdPage+1)+' / '+pages+' · '+total+' total';
  } else pager.classList.add('hidden');
}
function setHoldTab(tab){
  if(tab!==_holdTab) _holdPage=0; // only jump to page 1 on a REAL tab switch
  _holdTab=tab;
  $('tabSns').classList.toggle('on', tab==='sns');
  $('tabMap').classList.toggle('on', tab==='bsvmap');
  $('tabOpns').classList.toggle('on', tab==='opns');
  $('tabSale').classList.toggle('on', tab==='sale');
  $('btnBulkList').textContent = (tab==='sale') ? 'Bulk delist' : 'Bulk list';
  // v4.1 — OpNS names cannot be listed for sale: display, resolve and send
  // only, so bulk mode has nothing to do on this tab
  $('btnBulkList').classList.toggle('hidden', tab==='opns');
  if(tab==='opns' && _bulkMode) exitBulkMode();
  bulkReselectPage();
  renderHoldings();
}
/* Marketplace listings live in a separate store (GET /api/listings), NOT in the
   V30 indexer — the indexer keeps reporting "held" for a listed district. Merge
   the listings of THIS address into the holdings so items show listed + price. */
async function mergeListings(){
  try{
    const r=await fetch(`${HOLDINGS_API}/listings`);
    if(!r.ok) return;
    const j=await r.json();
    const mine=(j.listings||[]).filter(l=>l && l.sellerAddress===_address);
    if(mine.length){
      const byDistrict={};
      mine.forEach(l=>{ byDistrict[String(l.district)]=l; });
      _holdings.forEach(it=>{
        if(it.kind!=='bsvmap') return;
        const l=byDistrict[String(it.district)];
        if(l){ it.status='listed'; it.priceSat=Math.round(Number(l.priceSat)||0); }
      });
    }
  }catch(e){ /* listings store unreachable — fall back to indexer statuses */ }
  // v3.6 — SNS-listings van deze wallet op de ORDnet-marketplace
  try{
    const mineSns=await ordnetMyListings();
    if(mineSns){
      _holdings.forEach(it=>{
        if(it.kind!=='sns') return;
        const l=mineSns[String(it.name||'').toLowerCase()];
        if(l){ it.status='listed'; it.priceSat=l.priceSat; it.ordnetListingId=l.id; }
      });
    }
  }catch(e){ /* ORDnet marketplace unreachable — statuses fall back to indexer */ }
  // v4.2 (iOS v2.6.1) — merge DOMAIN-registry listings (v2 platform, USD)
  // into the SNS rows. This is a SEPARATE marketplace from the bsvmap.io
  // ordinal listings: without this merge a domain listed via the Domains tab
  // kept showing "held" here. Display-only; managing the listing stays in
  // the Domains tab (never the bsvmap list/delist flows).
  try{
    const r=await fetch(`${DOMAINS_API}/api/owner/${_address}`);
    if(r.ok){
      const j=await r.json().catch(()=>null);
      const listed={};
      ((j&&j.domains)||[]).forEach(d=>{
        if(d && d.name && d.listing_status==='active'){
          listed[String(d.name).toLowerCase()]=parseFloat(d.listing_price)||0;
        }
      });
      _holdings.forEach(it=>{
        if(it.kind!=='sns') return;
        const usd=listed[String(it.name||'').toLowerCase()];
        if(usd!==undefined) it.domainListedUsd=usd;
      });
    }
  }catch(e){ /* domain registry unreachable — SNS rows just show held */ }
}

/* v3.6 — actieve ORDnet-listings van deze wallet: { "naam.web3": {id, priceSat} } */
async function ordnetMyListings(){
  const r=await fetch(`${ORDNET_MARKET_API}/marketplace/onchain/listings?limit=100&seller=${encodeURIComponent(_address)}`);
  if(!r.ok) return null;
  const j=await r.json().catch(()=>null);
  if(!j) return null;
  const map={};
  (j.listings||[]).forEach(l=>{ map[String(l.domain_name||'').toLowerCase()]={ id:l.id, priceSat:Math.round(Number(l.price_sat)||0) }; });
  return map;
}
async function loadHoldings(){
  $('snsCount').textContent='…'; $('bsvmapCount').textContent='…'; $('opnsCount').textContent='…'; $('saleCount').textContent='…';
  $('holdList').innerHTML='<div class="empty-note">Loading…</div>';
  $('holdPager').classList.add('hidden');
  _holdings=[]; // NB: _holdPage is preserved — renderHoldings clamps it if out of range
  try{
    const r=await fetch(`${HOLDINGS_API}/address/${_address}/holdings`);
    if(!r.ok) throw new Error('indexer unavailable');
    const h=await r.json();
    (h.sns||[]).forEach(x=>_holdings.push(Object.assign({ kind:'sns' }, x)));
    (h.bsvmaps||[]).forEach(x=>_holdings.push(Object.assign({ kind:'bsvmap' }, x)));
    _idxOk=true;
  }catch(e){ _idxOk=false; }
  // v4.1 — OpNS: third category in its OWN try/catch + own status flag, so a
  // broken OpNS API only affects the OpNS tab (graceful degradation both ways)
  try{
    const r=await fetch(`${OPNS_API}/owner/${_address}`);
    if(!r.ok) throw new Error('opns index unavailable');
    const j=await r.json();
    if(j.ok!==true) throw new Error('opns index unavailable');
    (j.results||[]).forEach(x=>{
      if(!x || !x.name || !x.current_txid) return;
      _holdings.push({ kind:'opns', name:String(x.name), claimHeight:0, status:'held',
                       currentTxid:String(x.current_txid), currentVout:(x.current_vout|0)||0 });
    });
    _opnsOk=true;
  }catch(e){ _opnsOk=false; }
  await mergeListings();
  if(_idxOk){
    $('snsCount').textContent=String(_holdings.filter(x=>x.kind==='sns').length);
    $('bsvmapCount').textContent=String(_holdings.filter(x=>x.kind==='bsvmap').length);
    $('saleCount').textContent=String(_holdings.filter(x=>x.status==='listed' || (x.domainListedUsd!==undefined && x.domainListedUsd!==null)).length);
  }else{
    $('snsCount').textContent='—'; $('bsvmapCount').textContent='—'; $('saleCount').textContent='—';
  }
  $('opnsCount').textContent=_opnsOk ? String(_holdings.filter(x=>x.kind==='opns').length) : '—';
  renderHoldings();
}

/* ---------- send ordinal (SNS name / BSVmap) — true 1Sat transfer ---------- */
function ordinalMinerFee(){ return Math.ceil((300 + 14*34) * FEE_RATE); }

/* Raw tx-hex fetch with in-memory cache + 429 retry/backoff.
   - Cache: tx hex is immutable, and bulk-claimed BSVmaps share ONE claim tx —
     20 listings from the same claim need only 1 fetch instead of 20.
   - Retry: WhatsOnChain free tier allows ~3 req/s; bulk operations trip 429.
     Back off 500ms → 1s → 2s → 4s before giving up. */
const _txHexCache = {};
async function fetchTxHexRetry(txid){
  if(_txHexCache[txid]) return _txHexCache[txid];
  let delay=500;
  for(let attempt=0; attempt<5; attempt++){
    const r=await fetch(`${API_BASE}/tx/${txid}/hex`);
    if(r.ok){ const hex=(await r.text()).trim(); _txHexCache[txid]=hex; return hex; }
    if(r.status!==429) throw new Error('Could not fetch the ordinal transaction. (HTTP '+r.status+')');
    await new Promise(res=>setTimeout(res, delay)); delay*=2;
  }
  throw new Error('Rate-limited by WhatsOnChain (429) — wait a few seconds and try again.');
}
async function fetchOutputScriptHex(txid, vout){
  // BELANGRIJK: gebruik de RAW tx-hex en parse zelf, NIET het verbose /tx/hash/-endpoint.
  // WhatsOnChain's verbose JSON verminkt nonstandard scripts: bij envelope-first ordinals
  // (OP_FALSE OP_IF "ord" ... OP_ENDIF + P2PKH) laat scriptPubKey.hex de leidende 00
  // (OP_FALSE) weg. Ondertekenen/verifiëren tegen dat verminkte script laat OP_IF de
  // pubkey van de stack eten -> SCRIPT_ERR_EQUALVERIFY, en de node zou de sighash
  // sowieso afkeuren. De raw hex is byte-voor-byte authoritatief.
  const rawHex=await fetchTxHexRetry(txid);
  let hex=null;
  try{
    const t=new bsv.Transaction(rawHex);
    const out=t.outputs && t.outputs[vout];
    hex=out && out.script && out.script.toHex();
  }catch(_){ hex=null; }
  if(!hex) throw new Error('Could not read the ordinal output script.');
  return hex;
}

/* =========================================================================
   v4.1 — name payments (OpNS + SNS), ported 1-to-1 from the iOS app
   v2.1/v2.2. Recognition is strictly separated: dotted names (+ optional
   mailbox@) → SNS resolver; bare names → OpNS; anything else with @ →
   inline paymail refusal. Input is ascii-lowercase by construction, so
   homograph/mixed-script strings never reach a payment path.
   ========================================================================= */

/* v4.1.1 — spent-check via the dedicated outpoint endpoint (iOS v2.2.3 fix).
   GET /tx/<txid>/<vout>/spent:
     200 = outpoint is SPENT (body carries the spending txid)
     404 = outpoint is UNSPENT — this is the SUCCESS outcome, explicitly
           caught here and never allowed to fall into a generic error path
     429 = rate-limit: back off and retry (3 attempts, 400 ms doubling)
     timeout / 5xx / network error = status UNKNOWN (null) — may NEVER be
           reported as "spent"
   The old address-unspent-list check is REMOVED (not kept as fallback):
   WhatsOnChain silently truncates that list on busy addresses (fee
   addresses, custody, marketplaces), so absence in the list proves NOTHING
   — that produced false stale_outpoint refusals (live case 03-08-2026:
   start.web3, holder = busy ORDnet fee address 1EXupec…vLv8). */
async function outpointSpent(txid, vout){
  let delay=400;
  for(let attempt=0; attempt<3; attempt++){
    let r=null;
    try{ r=await fetch(`${API_BASE}/tx/${txid}/${vout}/spent`); }catch(_){ break; }
    if(r.status===200) return true;
    if(r.status===404) return false;   // 404 IS the good answer (unspent)
    if(r.status!==429) break;          // 5xx etc. → unknown
    await new Promise(res=>setTimeout(res, delay)); delay*=2;
  }
  return null;
}

/* ---------- OpNS (bare names, tree 0 — index at search.ordnet.io/api/opns) ---------- */

/* name lookup via /names?q= — the API defaults to match=exact and falls back
   to prefix with `fallback: true`. The fallback flag is passed through
   UNTOUCHED: a fallback answer is a DIFFERENT name than the user typed and
   must never be paid silently. */
async function opnsLookup(name){
  const r=await fetch(`${OPNS_API}/names?q=${encodeURIComponent(name)}`);
  if(!r.ok) throw new Error('The OpNS index at search.ordnet.io is unreachable — check your connection.');
  const j=await r.json().catch(()=>null);
  if(!j || j.ok!==true) throw new Error('The OpNS index at search.ordnet.io is unreachable — check your connection.');
  const fallback=(typeof j.fallback==='boolean') ? j.fallback : (j.match!=='exact');
  const records=(j.results||[]).filter(x=>x && x.name && x.owner_address && x.current_txid);
  return { fallback, records };
}

/* Resolve an OpNS name to a VERIFIED payment target — the four rules:
   1. exact match only — a `fallback: true` answer is a DIFFERENT name and
      surfaces as an inline "did you mean …?" error, never a payment
   2. the current outpoint is checked unspent on WhatsOnChain
   3. the holder address is RECOMPUTED from the outpoint's locking script
      on chain and must equal what the index claims — trust but verify
   4. paymail forms (name@host) are rejected by the caller before this */
async function resolveOpnsPayment(name){
  const n=String(name).trim().toLowerCase();
  const { fallback, records }=await opnsLookup(n);
  const rec=(!fallback) ? records.find(x=>String(x.name).toLowerCase()===n) : null;
  if(!rec){
    const suggestion=records.length ? String(records[0].name) : null;
    if(suggestion && suggestion!==n)
      throw new Error('OpNS name "'+n+'" does not exist. Did you mean "'+suggestion+'"? Nothing was paid.');
    throw new Error('OpNS name "'+n+'" does not exist. Nothing was paid.');
  }
  if(rec.ambiguous===true)
    throw new Error('OpNS name "'+n+'" is marked ambiguous by the index — not safe to pay.');
  const vout=(rec.current_vout|0)||0;
  // recompute the holder address from the chain (raw hex is authoritative)
  let holder=null;
  try{
    const script=await fetchOutputScriptHex(rec.current_txid, vout);
    holder=scriptLockAddress(script);
  }catch(_){ holder=null; }
  if(!holder) throw new Error('Could not derive the holder address from the chain for "'+n+'".');
  if(holder!==rec.owner_address)
    throw new Error('The OpNS index and the chain disagree about the holder of "'+n+'" — refusing to pay. Try again in a moment.');
  // outpoint must be unspent RIGHT NOW — otherwise the name changed hands.
  // v4.1.1 — only a PROVEN spend (HTTP 200) counts as spent; UNKNOWN fails
  // closed (OpNS briefing) but with an honest message, never a false
  // spent/stale claim.
  const spent=await outpointSpent(rec.current_txid, vout);
  if(spent===true)
    throw new Error('The ordinal of "'+n+'" was spent — the name may have just changed hands. Re-resolve and try again.');
  if(spent===null)
    throw new Error('The spent-status of "'+n+'" could not be verified right now — try again in a moment. Nothing was paid.');
  return { kind:'opns', name:n, holderAddress:holder, currentTxid:String(rec.current_txid), currentVout:vout };
}

/* ---------- SNS resolver payments (sns.ordnet.io — signed answers, level "prove") ---------- */

/* raw resolver answer — the BODY STRING goes to snsVerifyAnswer untouched so
   the signature is verified over exactly what the server sent. Error answers
   (not_verified, no_holder, …) also arrive as JSON here. */
async function snsResolveRaw(input){
  let r=null;
  try{ r=await fetch(`${SNS_API}/resolve/${encodeURIComponent(input)}`); }catch(_){ r=null; }
  if(!r) throw new Error('The SNS resolver at sns.ordnet.io is unreachable — check your connection.');
  const body=await r.text().catch(()=>'');
  if(!body) throw new Error('The SNS resolver at sns.ordnet.io is unreachable — check your connection.');
  return { code:r.status, body };
}
/* current key + chain of succession deeds (GET /pubkey) — used ONLY when an
   answer carries an unknown signer; snsVerifyRotationChain proves the chain. */
async function snsPubkeyInfo(){
  const r=await fetch(`${SNS_API}/pubkey`).catch(()=>null);
  if(!r || !r.ok) throw new Error('The SNS resolver at sns.ordnet.io is unreachable — check your connection.');
  const j=await r.json().catch(()=>null);
  if(!j) throw new Error('The SNS resolver at sns.ordnet.io is unreachable — check your connection.');
  return j;
}
async function getSnsPinnedPubkey(){
  const v=await storageGet(SNS_PIN_KEY);
  return (typeof v==='string' && v) ? v : SNS_PREPINNED_PUBKEY;
}

/* Resolve `naam.tld` or `mailbox@naam.tld` to a VERIFIED payment target:
   signed answer → signature against the pinned key (rotation only via a
   proven succession chain) → expires → holder address derived from the
   SIGNED holder_script → outpoint checked unspent (freshness, not script
   equality — custody scripts may differ). Every resolver error carries a
   readable message; it is thrown for INLINE display, never a popup. */
async function resolveSnsPayment(input){
  const q=String(input).trim().toLowerCase();
  const { body }=await snsResolveRaw(q);
  let j=null; try{ j=JSON.parse(body); }catch(_){ j=null; }
  if(!j || typeof j!=='object') throw new Error('The SNS resolver returned an unreadable answer.');
  // error answers: show the resolver's own message inline (not_verified is
  // PERMANENT until the name carries the ✓; no_holder means retry shortly)
  if(j.ok!==true){
    const code=j.error||'resolver_error';
    throw new Error(j.message||('SNS resolver error: '+code));
  }

  const nowTs=Math.floor(Date.now()/1000);
  let pin=await getSnsPinnedPubkey();
  let v=snsVerifyAnswer(body, pin, nowTs);
  let rotationNote='';

  // unknown signer → prove the succession chain from the pin; only a
  // closing chain re-pins. Never "accept anyway".
  if(v.valid!==true && v.reason==='unknown_signer'){
    const info=await snsPubkeyInfo();
    // field verified live 03-08-2026: GET /pubkey -> {ok, signer, seq, rotations:[]}
    const records=Array.isArray(info.rotations)?info.rotations:[];
    let proven=null;
    try{ proven=snsVerifyRotationChain(pin, records); }
    catch(e){
      throw new Error('The resolver signs with a new key, but the succession chain does not prove it — refusing. The pinned key is unchanged. ('+(e.message||e)+')');
    }
    if(String(proven).toLowerCase()!==String(v.signer||''))
      throw new Error('The resolver signs with a new key, but the succession chain does not prove it — refusing. The pinned key is unchanged.');
    await storageSet({ [SNS_PIN_KEY]: proven });
    rotationNote='Resolver key rotated — the succession chain was verified and the new key is now pinned.';
    v=snsVerifyAnswer(body, proven, nowTs);
  }

  if(v.valid!==true){
    const reason=v.reason||'invalid';
    if(reason==='bad_signature') throw new Error('The resolver answer carries an INVALID signature — refusing. Try again; if this persists the resolver may be compromised.');
    if(reason==='expired')       throw new Error('The resolver answer expired — resolve again and retry.');
    if(reason==='unsupported_holder_script') throw new Error('The holder script is not a standard P2PKH script — this wallet cannot derive a pay-to address from it safely.');
    throw new Error('The resolver answer could not be verified ('+reason+').');
  }
  if(!v.holderAddress || !v.currentTxid) throw new Error('The verified answer misses required fields.');

  // freshness: the current outpoint must not be PROVABLY spent. v4.1.1 —
  // checked via GET /tx/<txid>/<vout>/spent; only a real HTTP 200 (spent)
  // may raise stale_outpoint. UNKNOWN lets the payment continue WITH an
  // inline note: the signed resolver answer (expires, 300 s valid) is the
  // authority — checkUnspent semantics true/false/null, null ≠ spent.
  const spent=await outpointSpent(v.currentTxid, v.currentVout);
  if(spent===true)
    throw new Error('stale_outpoint: the inscription of '+(v.name||q)+' was spent — the name may have just changed hands. Resolve again and retry.');

  let warning=rotationNote;
  if(spent===null){
    warning+=(warning?'\n':'')+'The spent-status could not be additionally verified right now — the signed resolver answer (valid for 300 seconds) is the authority for this payment.';
  }
  if(v.addressMismatch===true){
    warning+=(warning?'\n':'')+'Note: the resolver’s display address differs from the signed script — the wallet pays the SIGNED script’s address shown here.';
  }
  return {
    kind:'sns',
    name:v.name||q,
    mailbox:v.mailbox||'',
    fallback:v.fallback===true,
    holderAddress:v.holderAddress,
    currentTxid:v.currentTxid,
    currentVout:v.currentVout,
    expires:v.expires||0,
    warning
  };
}

/* manual per-input signing (SIGHASH_ALL|FORKID) — handles the
   inscription-envelope+P2PKH ordinal input and plain P2PKH inputs alike */
function signAllInputs(tx, pk){
  const SIG = bsv.crypto.Signature;
  const sigtype = SIG.SIGHASH_ALL | SIG.SIGHASH_FORKID;
  for(let i=0;i<tx.inputs.length;i++){
    const input=tx.inputs[i];
    // Sign over the input's ACTUAL locking script (envelope-first ordinals AND plain P2PKH
    // both work when the full previous locking script is the subscript). The amount is part
    // of the FORKID sighash, so input.output.satoshis must be correct.
    const sig=bsv.Transaction.Sighash.sign(tx, pk, sigtype, i, input.output.script, new bsv.crypto.BN(input.output.satoshis));
    input.setScript(bsv.Script.buildPublicKeyHashIn(pk.publicKey, sig, sigtype));
  }
}

/* Verify every input locally BEFORE broadcasting, so a bad subscript/amount surfaces as a
   clear per-input message instead of the node's cryptic "mandatory-script-verify-flag-failed".
   Returns null if all inputs verify, or a human-readable error string for the first failure. */
function verifyTxInputs(tx){
  try{
    const I=bsv.Script.Interpreter;
    const flags=I.SCRIPT_VERIFY_P2SH|I.SCRIPT_VERIFY_STRICTENC|I.SCRIPT_ENABLE_SIGHASH_FORKID|I.SCRIPT_VERIFY_DERSIG|I.SCRIPT_VERIFY_LOW_S|I.SCRIPT_VERIFY_NULLFAIL;
    for(let i=0;i<tx.inputs.length;i++){
      const inp=tx.inputs[i];
      const spk=inp.output && inp.output.script;
      const sats=inp.output && inp.output.satoshis;
      if(!spk) return 'Input '+i+' has no known locking script — the wallet could not read the UTXO it is spending.';
      let ok=false, err='';
      try{
        const it=new I();
        ok=it.verify(inp.script, spk, tx, i, flags, new bsv.crypto.BN(sats));
        err=it.errstr||'';
      }catch(e){ err=(e&&e.message)||String(e); }
      if(!ok){
        return 'Input '+i+' failed local verification ('+(err||'unknown')+'). '
          + 'This usually means the wallet used a wrong locking script or amount for that UTXO. '
          + (i===0 ? 'Input 0 is the ordinal itself.' : 'This is a funding UTXO.');
      }
    }
    return null;
  }catch(e){
    // If the interpreter itself is unavailable, don't block the send — just skip the check.
    return null;
  }
}





async function buildOrdinalTransfer(holding, toAddress){
  const pk=bsv.PrivateKey.fromWIF(_wif), from=pk.toAddress();
  const feeSat=ordinalMinerFee();
  const ordScriptHex=await fetchOutputScriptHex(holding.currentTxid, holding.currentVout);

  // OWNERSHIP CHECK: the 1-sat ordinal is locked to a specific pubkeyhash (the P2PKH tail of
  // the envelope script). To spend it, the wallet's ACTIVE key must hash to that same pkh.
  // If it doesn't, signing produces SCRIPT_ERR_EQUALVERIFY. Surface this clearly instead.
  try{
    const ordScript=bsv.Script.fromHex(ordScriptHex);
    let lockPkh=null;
    for(const c of ordScript.chunks){ if(c.buf && c.buf.length===20) lockPkh=c.buf.toString('hex'); }
    const myPkh=bsv.crypto.Hash.sha256ripemd160(pk.publicKey.toBuffer()).toString('hex');
    if(lockPkh && lockPkh!==myPkh){
      const lockAddr=bsv.Address.fromPublicKeyHash(bsv.deps.Buffer.from(lockPkh,'hex')).toString();
      throw new Error('This ordinal is locked to '+lockAddr+', but your active wallet key controls '+from.toString()
        +'. You can only send it from the wallet that owns it — import the seed/key for '+lockAddr+' and try again.');
    }
  }catch(e){ if(e && /locked to/.test(e.message)) throw e; }

  const all=await getUTXOs(_address);
  const funding=all.filter(u=>!(u.txid===holding.currentTxid && u.vout===holding.currentVout));
  if(!funding.length) throw new Error('No spendable funding UTXOs for the fee. Your balance may be locked in pending transactions.');
  const required=feeSat+TOTAL_SERVICE_FEES;
  let total=0, sel=[];
  for(const u of funding){ sel.push(u); total+=u.satoshis; if(total>=required) break; }
  if(total<required) throw new Error('Insufficient balance for fee + service fee.');

  for(const u of sel){
    try{ const realHex=await fetchOutputScriptHex(u.txid, u.vout); if(realHex) u.realScriptHex=realHex; }catch(_){}
  }

  const tx=new bsv.Transaction();
  tx.addInput(new bsv.Transaction.Input({
    prevTxId: holding.currentTxid, outputIndex: holding.currentVout, script: new bsv.Script(),
    output: new bsv.Transaction.Output({ script: bsv.Script.fromHex(ordScriptHex), satoshis: 1 })
  }));
  sel.forEach(u=>tx.addInput(new bsv.Transaction.Input({
    prevTxId: u.txid, outputIndex: u.vout, script: new bsv.Script(),
    output: new bsv.Transaction.Output({ script: bsv.Script.fromHex(u.realScriptHex||u.scriptPubKey||u.script), satoshis: u.satoshis })
  })));
  tx.to(bsv.Address.fromString(toAddress), 1);
  addServiceFees(tx);
  const change=(1+total)-(1+feeSat+TOTAL_SERVICE_FEES);
  if(change>546) tx.to(from, change);
  signAllInputs(tx, pk);
  const vErr=verifyTxInputs(tx);
  if(vErr) throw new Error(vErr + ' The transaction was NOT broadcast.');
  return tx;
}

/* ---------- Optie-1 atomic swap: list (sell) + buy ---------- */
async function buildListingPartial(ordinalTxid, ordinalVout, priceSat){
  const pk = bsv.PrivateKey.fromWIF(_wif), from = pk.toAddress();
  const ordScriptHex = await fetchOutputScriptHex(ordinalTxid, ordinalVout);
  const tx = new bsv.Transaction();
  tx.addInput(new bsv.Transaction.Input({
    prevTxId: ordinalTxid, outputIndex: ordinalVout, script: new bsv.Script(),
    output: new bsv.Transaction.Output({ script: bsv.Script.fromHex(ordScriptHex), satoshis: 1 })
  }));
  const payScript = bsv.Script.buildPublicKeyHashOut(from);
  tx.addOutput(new bsv.Transaction.Output({ script: payScript, satoshis: priceSat }));
  const SIG = bsv.crypto.Signature;
  const sigtype = SIG.SIGHASH_SINGLE | SIG.SIGHASH_ANYONECANPAY | SIG.SIGHASH_FORKID;
  const sig = bsv.Transaction.Sighash.sign(tx, pk, sigtype, 0, tx.inputs[0].output.script, new bsv.crypto.BN(1));
  tx.inputs[0].setScript(bsv.Script.buildPublicKeyHashIn(pk.publicKey, sig, sigtype));
  return { partialTx: tx.toString(), payScriptHex: payScript.toHex() };
}

async function buildPurchaseFromPartial(partialHex, priceSat, sellerAddress, payScriptHex, extraOutputs){
  const pk = bsv.PrivateKey.fromWIF(_wif), buyer = pk.toAddress();
  const tx = new bsv.Transaction(partialHex);
  const out0 = tx.outputs[0];
  if (!out0 || out0.satoshis !== priceSat || out0.script.toHex() !== payScriptHex)
    throw new Error('Listing payment output does not match the advertised price — refusing.');
  tx.addOutput(new bsv.Transaction.Output({ script: bsv.Script.buildPublicKeyHashOut(buyer), satoshis: 1 }));
  // v3.5 — extraOutputs: bv. de ORDnet-marketplace-fee (0,5%, koper betaalt bovenop).
  // Gecapt op 5% van de prijs zodat een kwaadaardige site geen absurde fee kan meesmokkelen;
  // alles staat sowieso zichtbaar in het approve-scherm.
  let extraSat = 0;
  const extras = Array.isArray(extraOutputs) ? extraOutputs : [];
  for (const eo of extras){
    const sat = satNum(eo.sats || eo.amount);
    if (sat < 1) continue;
    tx.addOutput(new bsv.Transaction.Output({ script: bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(String(eo.to))), satoshis: sat }));
    extraSat += sat;
  }
  if (extraSat > Math.max(546, Math.ceil(priceSat * 0.05)))
    throw new Error('Extra outputs exceed 5% of the price — refusing.');
  const feeSat = ordinalMinerFee();
  const need = priceSat + 1 + extraSat + feeSat + TOTAL_SERVICE_FEES;
  const utxos = await getUTXOs(_address);
  let total = 0, sel = [];
  for (const u of utxos){ sel.push(u); total += u.satoshis; if (total >= need) break; }
  if (total < need) throw new Error('Insufficient balance for price + marketplace fee + network fee + service fee.');
  const firstBuyerInput = tx.inputs.length;
  for(const u of sel){
    try{ const realHex=await fetchOutputScriptHex(u.txid, u.vout); if(realHex) u.realScriptHex=realHex; }catch(_){}
  }
  sel.forEach(u => tx.addInput(new bsv.Transaction.Input({
    prevTxId: u.txid, outputIndex: u.vout, script: new bsv.Script(),
    output: new bsv.Transaction.Output({ script: bsv.Script.fromHex(u.realScriptHex||u.scriptPubKey||u.script), satoshis: u.satoshis })
  })));
  addServiceFees(tx);
  const change = total - (priceSat + 1 + extraSat + feeSat + TOTAL_SERVICE_FEES);
  if (change > 546) tx.to(buyer, change);
  const SIG = bsv.crypto.Signature;
  const sigtype = SIG.SIGHASH_ALL | SIG.SIGHASH_FORKID;
  for (let i = firstBuyerInput; i < tx.inputs.length; i++){
    const inp = tx.inputs[i];
    const sig = bsv.Transaction.Sighash.sign(tx, pk, sigtype, i, inp.output.script, new bsv.crypto.BN(inp.output.satoshis));
    inp.setScript(bsv.Script.buildPublicKeyHashIn(pk.publicKey, sig, sigtype));
  }
  return tx;
}

function startSendOrdinal(idx){
  const it=_holdings[idx]; if(!it) return;
  startSendOrdinalItem(it);
}
/* v4.2 — also reachable from ORD/ner (kind 'ordfile'): same true 1-sat
   transfer, the item just doesn't live in _holdings */
function startSendOrdinalItem(it){
  _soSel=it;
  showView('sendord');
  $('soTitle').textContent='Send '+(it.kind==='sns'?'SNS name':it.kind==='opns'?'OpNS name':it.kind==='ordfile'?'file':'BSVmap');
  $('soName').textContent=it.name;
  $('soType').textContent=it.kind==='sns'?'SNS name (1Sat Ordinal)':it.kind==='opns'?'OpNS name (1Sat Ordinal)':it.kind==='ordfile'?'Inscription (1Sat Ordinal)':'BSVmap district (1Sat Ordinal)';
  // v4.1 — paymail bindings are signed by the CURRENT holder and die on transfer
  const opnsNote=$('soOpnsNote');
  opnsNote.classList.toggle('hidden', it.kind!=='opns');
  if(it.kind==='opns') opnsNote.textContent='If this OpNS name has a paymail binding ('+it.name+'@host), that binding expires when the name is transferred. The new owner must create a new binding.';
  $('soUtxo').textContent=it.currentTxid.slice(0,10)+'…'+it.currentTxid.slice(-6)+'_'+it.currentVout;
  $('soStatus').textContent=it.status;
  $('soActiveAddr').textContent=_address;
  $('soTo').value=''; clr($('soErr'));
  const ok=$('soOk'); ok.className='alert alert-success'; ok.textContent='';
  $('soFeeInfo').textContent='~'+ordinalMinerFee().toLocaleString()+' sats network + '+TOTAL_SERVICE_FEES.toLocaleString()+' sats service';
  // Up-front ownership check: fetch the ordinal's real locking script and compare its pkh to
  // the active wallet key. If they differ, the transfer cannot succeed from this wallet — show
  // it immediately (with the owning address) instead of only after the user hits Send.
  const warn=$('soOwnerWarn'); warn.classList.add('hidden'); warn.textContent='';
  (async()=>{
    try{
      const hex=await fetchOutputScriptHex(it.currentTxid, it.currentVout);
      const s=bsv.Script.fromHex(hex); let lockPkh=null;
      for(const c of s.chunks){ if(c.buf && c.buf.length===20) lockPkh=c.buf.toString('hex'); }
      const pk=bsv.PrivateKey.fromWIF(_wif);
      const myPkh=bsv.crypto.Hash.sha256ripemd160(pk.publicKey.toBuffer()).toString('hex');
      if(lockPkh && lockPkh!==myPkh){
        const lockAddr=bsv.Address.fromPublicKeyHash(bsv.deps.Buffer.from(lockPkh,'hex')).toString();
        warn.innerHTML='This ordinal is owned by <b>'+esc(lockAddr)+'</b>, not your active wallet ('+esc(_address)+'). '
          +'You must import the seed/key that controls '+esc(lockAddr)+' before you can send it.';
        warn.classList.remove('hidden');
      }
    }catch(_){ /* network hiccup — the build-time check still guards the actual send */ }
  })();
}

async function doSendOrdinal(){
  clr($('soErr')); const ok=$('soOk'); ok.className='alert alert-success'; ok.textContent='';
  const it=_soSel;
  if(!it){ err($('soErr'),'Nothing selected — go back and pick a name or BSVmap.'); return; }
  const to=$('soTo').value.trim();
  if(!to){ err($('soErr'),'Enter a recipient address.'); return; }
  try{ bsv.Address.fromString(to); }catch(e){ err($('soErr'),'That is not a valid BSV address.'); return; }
  if(to===_address){ err($('soErr'),'That is your own address — the ordinal is already there.'); return; }
  if(it.status==='contract'){ err($('soErr'),'This ordinal sits in a contract output and cannot be sent from here.'); return; }
  const btn=$('soBtn'); btn.disabled=true; const ol=btn.textContent; btn.innerHTML='<span class="spinner"></span> Sending...';
  try{
    const tx=await buildOrdinalTransfer(it, to);
    const txid=await broadcastAndRegister(tx);
    ok.textContent='Sent! '+it.name+' is on its way. TXID: '+txid;
    ok.className='alert alert-success show';
    setTimeout(loadHoldings, 1500);
  }catch(e){ err($('soErr'), e.message||'Send failed.'); }
  finally{ btn.disabled=false; btn.textContent=ol; }
}

/* ---------- delist (remove listing) — signed instruction to the marketplace ----------
   The wallet proves ownership by signing a delist message with the seller key.
   Server side: POST /map/{district}/delist must verify the signature against
   sellerAddress and drop the listing.
   TRUST BUT VERIFY: some servers answer 200 without actually removing the
   listing (SPA catch-all, stub route). We therefore re-check the listings
   registry afterwards and only report success when the listing is GONE. */
async function delistRequest(it){
  if(it.kind==='sns') return delistRequestSns(it); // v3.6 — SNS -> ORDnet marketplace
  const district=safeDistrict(it.district); // v4.3 — validate before it enters a URL path
  const ts=Date.now();
  const msg='bsvmap delist '+district+' '+it.currentTxid+'_'+it.currentVout+' '+ts;
  const sig=signMessage(msg); // signed ownership proof (seller key)
  const r=await fetch(`${HOLDINGS_API}/map/${district}/delist`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ sellerAddress:_address, district:it.district, ordinalTxid:it.currentTxid, ordinalVout:it.currentVout, timestamp:ts, message:msg, signature:sig.signature, pubkey:sig.pubkey })
  });
  const j=await r.json().catch(()=>null);
  if(!r.ok || j===null) throw new Error((j&&j.error)||('delist endpoint unavailable ('+r.status+')'));
}
/* ---------- server stores: the marketplace keeps a listing in TWO places ----------
   1. the per-district record: GET /map/{district} -> .listing   (what the district
      page shows, and what POST /map/{d}/list writes FIRST)
   2. the global registry:     GET /listings                     (what the map view,
      mergeListings and the "For sale" tab read)
   OBSERVED LIVE (V30, 2026-07-10): these go OUT OF SYNC. Beyond ~500 registry
   entries POST /list still answers HTTP 200 and writes the per-district record,
   but the append to the global registry is silently dropped. The item then looks
   unlisted in the wallet and on the map, while the server considers it listed —
   so every retry is a no-op and the item is STUCK (this is exactly the
   "cannot list past page 26 / bsvmap 581319" symptom). Delist has the mirror
   problem: it can leave a record behind in one of the two stores.
   Everything below therefore checks BOTH stores and self-heals where possible. */
async function districtState(district){
  try{
    const r=await fetch(`${HOLDINGS_API}/map/${district}`);
    if(!r.ok) return null;
    return await r.json();
  }catch(_){ return null; }
}
/* districts of THIS address present in the global registry — null if unreachable */
async function registryDistricts(){
  try{
    const r=await fetch(`${HOLDINGS_API}/listings`);
    if(!r.ok) return null;
    const j=await r.json();
    return new Set((j.listings||[]).filter(l=>l && l.sellerAddress===_address).map(l=>String(l.district)));
  }catch(e){ return null; }
}
/* which of these items are STILL listed — in EITHER store? -> [{it, where}] */
/* v3.6 — SNS-delist: seller-signMessage naar de ORDnet marketplace */
async function delistRequestSns(it){
  let id=it.ordnetListingId;
  if(!id){
    const mine=await ordnetMyListings();
    const l=mine && mine[String(it.name||'').toLowerCase()];
    if(!l) throw new Error('No active ORDnet listing found for '+it.name);
    id=l.id;
  }
  const ts=Date.now();
  const msg=['ordnet-registry','delist-onchain',String(id),String(ts)].join('|');
  const sig=signMessage(msg);
  const r=await fetch(`${ORDNET_MARKET_API}/marketplace/onchain/delist`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ id:id, address:_address, ts:ts, signature:sig.signature, pubkey:sig.pubkey })
  });
  const j=await r.json().catch(()=>null);
  if(!r.ok || j===null) throw new Error((j&&j.error)||('ORDnet delist failed ('+r.status+')'));
}

async function verifyStillListed(items){
  // v3.6 — kind-bewust: SNS tegen ORDnet, BSVmaps tegen beide bsvmap-stores
  const out=[];
  const ss=items.filter(it=>it.kind==='sns');
  if(ss.length){
    const mine=await ordnetMyListings();
    if(mine!==null) ss.forEach(it=>{ if(mine[String(it.name||'').toLowerCase()]) out.push({ it, where:'ORDnet marketplace' }); });
  }
  const bs=items.filter(it=>it.kind==='bsvmap');
  if(!bs.length) return out;
  const reg=await registryDistricts();
  for(let i=0;i<bs.length;i++){
    const it=bs[i];
    if(i) await new Promise(r=>setTimeout(r, 120)); // be gentle on the API
    const st=await districtState(it.district);
    const inDistrict=!!(st && st.listing);
    const inRegistry=!!(reg && reg.has(String(it.district)));
    if(inDistrict || inRegistry) out.push({ it,
      where: inDistrict && inRegistry ? 'global registry + district record'
           : inDistrict ? 'per-district record (district page still shows it for sale)'
           : 'global registry' });
  }
  return out;
}
/* one listing incl. SELF-HEAL for the stuck server state: if a stale per-district
   listing by this seller exists (a previous list call that never reached the
   global registry), sign a delist FIRST to clear it — otherwise the fresh list
   call is treated as a duplicate/no-op — then list. */
async function listRequest(it, priceSat){
  if(it.kind==='sns') return listRequestSns(it, priceSat); // v3.6 — SNS -> ORDnet marketplace
  const st=await districtState(it.district);
  if(st && st.listing){
    try{ await delistRequest(it); }catch(_){ /* best effort — proceed to list */ }
  }
  const district=safeDistrict(it.district); // v4.3 — validate before it enters a URL path
  const signed=await buildListingPartial(it.currentTxid, it.currentVout, priceSat);
  const r=await fetch(`${HOLDINGS_API}/map/${district}/list`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ sellerAddress:_address, priceSat, ordinalTxid:it.currentTxid, ordinalVout:it.currentVout, partialTx:signed.partialTx, payScriptHex:signed.payScriptHex })
  });
  const j=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error((j&&j.error)||'listing failed');
}

/* v3.6 — SNS-listing naar de ORDnet on-chain marketplace (zelfde partial-tx-
   patroon; de server valideert eigendom + outpoint tegen de indexer). */
async function listRequestSns(it, priceSat){
  const signed=await buildListingPartial(it.currentTxid, it.currentVout, priceSat);
  const r=await fetch(`${ORDNET_MARKET_API}/marketplace/onchain/list`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      domain: it.name,
      origin_txid: it.currentTxid,
      origin_vout: it.currentVout,
      price_sat: priceSat,
      seller_address: _address,
      partial_tx: signed.partialTx,
      pay_script_hex: signed.payScriptHex
    })
  });
  const j=await r.json().catch(()=>({}));
  if(!r.ok){
    if(j&&j.error==='already_listed') throw new Error('Already listed on the ORDnet marketplace.');
    if(j&&j.error==='not_owner_onchain') throw new Error('The indexer says this wallet is not the current holder.');
    if(j&&j.error==='origin_mismatch') throw new Error('Outpoint mismatch with the indexer — wait a block and retry.');
    throw new Error((j&&j.error)||'ORDnet marketplace listing failed');
  }
}
/* trust-but-verify for LIST: which freshly-listed items did NOT reach the global
   registry? (HTTP 200 alone proves nothing — see note above.) */
async function verifyListedInRegistry(items){
  // v3.6 — kind-bewust: BSVmaps tegen het bsvmap-register, SNS tegen ORDnet
  const missing=[];
  const bs=items.filter(it=>it.kind==='bsvmap');
  const ss=items.filter(it=>it.kind==='sns');
  if(bs.length){
    const reg=await registryDistricts();
    if(reg!==null) missing.push(...bs.filter(it=>!reg.has(String(it.district))));
  }
  if(ss.length){
    const mine=await ordnetMyListings();
    if(mine!==null) missing.push(...ss.filter(it=>!mine[String(it.name||'').toLowerCase()]));
  }
  return missing;
}
/* delist confirmation view — the user explicitly signs, exactly like listing */
let _dlSel=null;
function startDelist(idx){
  const it=_holdings[idx]; if(!it) return;
  _dlSel=it;
  showView('delist');
  clr($('dlErr')); const ok=$('dlOk'); ok.className='alert alert-success'; ok.textContent='';
  $('dlName').textContent=it.name;
  $('dlType').textContent=it.kind==='sns'?'SNS name (1Sat Ordinal)':'BSVmap district (1Sat Ordinal)';
  const pr=listedPriceSats(it);
  $('dlPrice').textContent=pr?(bsvFmt(pr)+' BSV ('+pr.toLocaleString()+' sats)'):'—';
  $('dlUtxo').textContent=it.currentTxid.slice(0,10)+'…'+it.currentTxid.slice(-6)+'_'+it.currentVout;
  $('dlSeller').textContent=_address;
  $('dlBtn').disabled=false;
}
async function doDelistNow(){
  clr($('dlErr')); const ok=$('dlOk'); ok.className='alert alert-success'; ok.textContent='';
  const it=_dlSel;
  if(!it){ err($('dlErr'),'Nothing selected — go back and pick a listed item.'); return; }
  const btn=$('dlBtn'); btn.disabled=true; const ol=btn.textContent; btn.innerHTML='<span class="spinner"></span> Signing...';
  try{
    await delistRequest(it);
    const still=await verifyStillListed([it]);
    if(still.length) throw new Error('The server answered OK but the listing is still present in the '+still[0].where
      +'. The server-side delist must clear BOTH the global registry and the per-district record.');
    it.status='held'; delete it.priceSat;
    ok.textContent='Listing removed and verified gone from the registry — '+it.name+' is no longer for sale.';
    ok.className='alert alert-success show';
    setTimeout(loadHoldings, 1200);
    setTimeout(showIdle, 3000); // back to the wallet, same tab + page
  }catch(e){
    err($('dlErr'), e.message||'Delist failed.');
    btn.disabled=false;
  }
  finally{ btn.textContent=ol; }
}

/* ---------- list ordinal for sale (standalone) ---------- */
let _loSel=null;
function startListOrdinal(idx){
  const it=_holdings[idx]; if(!it) return;
  if(it.status==='contract') return;
  _loSel=it;
  showView('listord');
  $('loName').textContent=it.name;
  $('loType').textContent=it.kind==='sns'?'SNS name (1Sat Ordinal)':'BSVmap district (1Sat Ordinal)';
  $('loUtxo').textContent=it.currentTxid.slice(0,10)+'…'+it.currentTxid.slice(-6)+'_'+it.currentVout;
  $('loPrice').value=''; $('loPriceHint').innerHTML='&nbsp;'; clr($('loErr'));
  const ok=$('loOk'); ok.className='alert alert-success'; ok.textContent='';
  loShowForm();
}
/* price is entered in BSV (e.g. 0.0001) and converted to sats internally */
function loPriceSats(){
  const v=parseFloat(String($('loPrice').value).replace(',','.'));
  if(!(v>0)) return 0;
  return Math.round(v*1e8);
}
function updateLoPriceHint(){
  const sats=loPriceSats();
  $('loPriceHint').innerHTML = sats>=1 ? ('= '+sats.toLocaleString()+' sats') : '&nbsp;';
}
/* step 1 -> 2: validate and show a summary of exactly what will be signed */
function loShowForm(){
  $('loForm').classList.remove('hidden'); $('loFormBtns').classList.remove('hidden');
  $('loConfirm').classList.add('hidden'); $('loConfirmBtns').classList.add('hidden');
}
function loShowConfirm(){
  clr($('loErr')); const ok=$('loOk'); ok.className='alert alert-success'; ok.textContent='';
  const it=_loSel;
  if(!it){ err($('loErr'),'Nothing selected.'); return; }
  const price=loPriceSats();
  if(!(price>=1)){ err($('loErr'),'Enter a price in BSV (minimum 0.00000001).'); return; }
  // v3.6 — SNS-listings gaan naar de ORDnet on-chain marketplace; BSVmaps naar bsvmap.io
  $('loSummary').innerHTML=
    `<div class="kv"><span class="k">Item</span><span class="v">${esc(it.name)}</span></div>
     <div class="kv"><span class="k">Type</span><span class="v">${it.kind==='sns'?'SNS name':'BSVmap district'}</span></div>
     <div class="kv"><span class="k">Price</span><span class="v">${bsvFmt(price)} BSV (${price.toLocaleString()} sats)</span></div>
     <div class="kv"><span class="k">Paid to</span><span class="v">${esc(_address)}</span></div>
     <div class="kv"><span class="k">Ordinal</span><span class="v">${esc(it.currentTxid.slice(0,10))}…${esc(it.currentTxid.slice(-6))}_${it.currentVout}</span></div>`;
  $('loForm').classList.add('hidden'); $('loFormBtns').classList.add('hidden');
  $('loConfirm').classList.remove('hidden'); $('loConfirmBtns').classList.remove('hidden');
}
/* step 2: the actual signing — only reachable via Confirm & sign */
async function doListOrdinal(){
  clr($('loErr')); const ok=$('loOk'); ok.className='alert alert-success'; ok.textContent='';
  const it=_loSel;
  if(!it){ err($('loErr'),'Nothing selected.'); return; }
  const price=loPriceSats();
  if(!(price>=1)){ err($('loErr'),'Enter a price in BSV (minimum 0.00000001).'); return; }
  const btn=$('loConfirmBtn'); btn.disabled=true; const ol=btn.textContent; btn.innerHTML='<span class="spinner"></span> Signing...';
  try{
    await listRequest(it, price);
    // trust-but-verify: HTTP 200 does not guarantee the global registry got it
    const missing=await verifyListedInRegistry([it]);
    if(missing.length) throw new Error('The server accepted the listing (HTTP 200) and wrote the district record, '
      +'but it never appeared in the global GET /listings registry — the registry is full or out of sync SERVER-side. '
      +'The wallet and the map will keep showing this item as unlisted until the server is fixed.');
    ok.textContent='Listed for '+bsvFmt(price)+' BSV — verified present in the marketplace registry!'
      +(it.kind==='sns'?' Visible on the ORDnet marketplace (domains).':' Turns green on bsvmap.io within a minute.');
    ok.className='alert alert-success show';
    $('loConfirmBtns').classList.add('hidden'); // signed — prevent a double sign
    setTimeout(loadHoldings, 1500);
    setTimeout(showIdle, 3500); // back to the wallet — the item now shows its listed badge
  }catch(e){ err($('loErr'), e.message||'Listing failed.'); }
  finally{ btn.disabled=false; btn.textContent=ol; }
}

/* ---------- bulk list / bulk delist: inline selection mode on the holdings list ----------
   Click "Bulk list" (SNS/BSVmaps tab) or "Bulk delist" (For sale tab) -> every
   eligible item on the current page is CHECKED; the user only unchecks what
   should be skipped. Paging while the mode is on ADDS the new page to the
   selection (up to 300 items), so multiple pages can be handled in one run. */
const BULK_MAX = 300;
let _bulkMode=false;
let _bulkKind='list';     // 'list' | 'delist' (delist on the For sale tab)
let _bulkSel=new Set();   // indexes into _holdings — accumulates ACROSS pages
let _bulkArmed=false;     // first click on Sign arms; second click executes
let _bulkBusy=false;
function bulkKindForTab(){ return _holdTab==='sale' ? 'delist' : 'list'; }
function bulkEligible(item){
  // v3.6 — bulk werkt nu voor BSVmaps én SNS (SNS route naar de ORDnet marketplace)
  // v4.1 — OpNS: no marketplace flows at all (display, resolve and send only)
  if(item.kind==='opns') return false;
  if(_bulkKind==='delist') return item.status==='listed';
  return item.status!=='listed' && item.status!=='contract';
}
function bulkPageEligibleIdx(){
  const filtered=holdFiltered();
  const start=_holdPage*HOLD_PER_PAGE;
  return filtered.slice(start, start+HOLD_PER_PAGE).filter(bulkEligible).map(x=>_holdings.indexOf(x));
}
function bulkMergePage(){ // add this page's eligible items, respecting the cap
  const all=bulkPageEligibleIdx();
  let capped=false;
  for(const i of all){ if(_bulkSel.size>=BULK_MAX){ capped=true; break; } _bulkSel.add(i); }
  if(capped) err($('bulkErr'),'Selection limit reached: max '+BULK_MAX+' items per run.');
}
function bulkPriceSats(){
  const v=parseFloat(String($('bulkPrice').value).replace(',','.'));
  return v>0 ? Math.round(v*1e8) : 0;
}
function updateBulkPanel(){
  const n=_bulkSel.size;
  $('bulkCount').textContent=n+' selected'+(n>=BULK_MAX?' (max)':'');
  const page=bulkPageEligibleIdx();
  const allIn=page.length>0 && page.every(i=>_bulkSel.has(i));
  $('bulkToggleAll').textContent=allIn?'Deselect page':'Select page';
  const go=$('bulkGo');
  if(_bulkKind==='delist'){
    $('bulkPriceWrap').classList.add('hidden');
    go.disabled=_bulkBusy || !n;
    go.textContent=_bulkArmed ? ('Confirm: delist '+n+' item'+(n!==1?'s':'')) : ('Sign '+n+' delisting'+(n!==1?'s':''));
  } else {
    $('bulkPriceWrap').classList.remove('hidden');
    const price=bulkPriceSats();
    $('bulkPriceHint').innerHTML=(price>=1)
      ? ('= '+price.toLocaleString()+' sats per item'+(n?' · '+bsvFmt(price*n)+' BSV total if all sell':''))
      : '&nbsp;';
    go.disabled=_bulkBusy || !n || !(price>=1);
    go.textContent=_bulkArmed
      ? ('Confirm: '+n+' × '+bsvFmt(price)+' BSV')
      : ('Sign '+n+' listing'+(n!==1?'s':''));
  }
}
function bulkDisarm(){ _bulkArmed=false; updateBulkPanel(); }
function enterBulkMode(){
  _bulkMode=true; _bulkArmed=false; _bulkKind=bulkKindForTab();
  _bulkSel=new Set();
  clr($('bulkErr')); const ok=$('bulkOk'); ok.className='alert alert-success'; ok.textContent='';
  bulkMergePage();
  $('bulkPanel').classList.remove('hidden');
  $('btnBulkList').classList.add('on');
  if(!_bulkSel.size) err($('bulkErr'), _bulkKind==='delist'
    ? 'No listed items on this page.'
    : 'No unlisted items on this page.');
  updateBulkPanel(); renderHoldings();
}
function exitBulkMode(){
  _bulkMode=false; _bulkArmed=false; _bulkSel.clear();
  $('bulkPanel').classList.add('hidden');
  $('btnBulkList').classList.remove('on');
  renderHoldings();
}
function bulkReselectPage(){ // page/tab/search changed while in bulk mode
  if(!_bulkMode) return;
  const k=bulkKindForTab();
  if(k!==_bulkKind){ _bulkKind=k; _bulkSel.clear(); clr($('bulkErr')); } // tab type changed: fresh selection
  bulkMergePage(); // ADD the new page — selection accumulates across pages
  bulkDisarm();
}
function bulkToggleAllNow(){
  const page=bulkPageEligibleIdx();
  const allIn=page.length>0 && page.every(i=>_bulkSel.has(i));
  if(allIn) page.forEach(i=>_bulkSel.delete(i));
  else { clr($('bulkErr')); for(const i of page){ if(_bulkSel.size>=BULK_MAX){ err($('bulkErr'),'Selection limit reached: max '+BULK_MAX+' items per run.'); break; } _bulkSel.add(i); } }
  bulkDisarm(); renderHoldings();
}
function bulkToggle(idx){
  if(_bulkBusy) return;
  if(_bulkSel.has(idx)) _bulkSel.delete(idx);
  else if(bulkEligible(_holdings[idx]||{})){
    if(_bulkSel.size>=BULK_MAX){ err($('bulkErr'),'Selection limit reached: max '+BULK_MAX+' items per run.'); return; }
    _bulkSel.add(idx);
  }
  bulkDisarm(); renderHoldings();
}
async function bulkGoNow(){
  clr($('bulkErr')); const ok=$('bulkOk');
  const isDelist=(_bulkKind==='delist');
  const price=isDelist?0:bulkPriceSats();
  if(!isDelist && !(price>=1)){ err($('bulkErr'),'Enter a price in BSV (minimum 0.00000001).'); return; }
  if(!_bulkSel.size){ err($('bulkErr'),'Nothing selected.'); return; }
  if(!_bulkArmed){ _bulkArmed=true; updateBulkPanel(); return; } // first click = review, second = sign
  _bulkBusy=true; updateBulkPanel();
  ok.className='alert alert-success show';
  const items=[..._bulkSel].map(i=>_holdings[i]).filter(Boolean);
  let done=0, failed=[], okItems=[];
  for(let i=0;i<items.length;i++){
    const it=items[i];
    ok.textContent=(isDelist?'Delisting ':'Listing ')+it.name+' ('+(i+1)+'/'+items.length+')…';
    if(i) await new Promise(r=>setTimeout(r, 250)); // stay under API rate limits
    try{
      if(isDelist){
        await delistRequest(it);
      } else {
        await listRequest(it, price); // incl. self-heal for stale/stuck server listings
      }
      done++; okItems.push(it);
    }catch(e){ failed.push(it.name+' ('+(e.message||'error')+')'); }
  }
  // trust-but-verify for delist: check BOTH server stores for ALL processed items
  if(isDelist && okItems.length){
    ok.textContent='Verifying removal on the server…';
    const still=await verifyStillListed(okItems);
    if(still.length){
      done-=still.length;
      still.forEach(x=>failed.push(x.it.name+' (still in the '+x.where+')'));
    }
  }
  // trust-but-verify for list: HTTP 200 alone does not mean the global registry
  // got the listing (observed server bug past ~500 registry entries)
  if(!isDelist && okItems.length){
    ok.textContent='Verifying listings in the marketplace registry…';
    const missing=await verifyListedInRegistry(okItems);
    if(missing.length){
      done-=missing.length;
      missing.forEach(it=>failed.push(it.name+' (accepted by the server but NOT in the global registry — registry full/out of sync server-side)'));
    }
  }
  _bulkBusy=false; _bulkArmed=false; _bulkSel.clear();
  if(failed.length){
    ok.className='alert alert-success'; ok.textContent='';
    err($('bulkErr'), done+(isDelist?' delisted, ':' listed, ')+failed.length+' failed: '+failed.slice(0,4).join(', ')+(failed.length>4?' …':''));
  } else {
    ok.textContent=isDelist
      ? ('All '+done+' listings removed.')
      : ('All '+done+' items listed for '+bsvFmt(price)+' BSV each! Turning green on bsvmap.io within a minute.');
  }
  await loadHoldings(); // refresh statuses in place; panel, page and message stay
  updateBulkPanel();
}

/* ---------- approval ---------- */
/* sats as a safe integer — NEVER use `|0` on sat amounts: it is a 32-bit cast
   and silently corrupts anything above 21.47 BSV (2,147,483,647 sats). */
function satNum(v){ const n=Math.round(Number(v)||0); return n>0?n:0; }
function purchaseSats(pr){ return pr.amountSat ? satNum(pr.amountSat) : Math.round((Number(pr.amount)||0)*1e8); }
function purchaseMessage(pr){
  return 'ORDPAY/v1 | shop:'+(pr.shop||'')+' | item:'+(pr.itemTitle||'')+' | order:'+(pr.orderId||'')+' | amount:'+purchaseSats(pr)+' sats | to:'+(pr.to||'');
}
function presentApproval(){
  const p=_pending; if(!p) return;
  showView('approve'); clr($('apErr'));
  $('apOrigin').textContent='Source: '+(p.origin||'unknown');
  const d=$('apDetails'); const ic=$('apIcon');
  const readMethods=['connect','getAddress','getPublicKey','getBalance'];
  if(readMethods.includes(p.method)){
    ic.innerHTML=ICONS.link; $('apTitle').textContent='Connect wallet';
    d.innerHTML=`<p>This page wants to see your wallet address.</p><div class="kv"><span class="k">Account</span><span class="v">${esc(_accounts[_active].name)}</span></div><div class="kv"><span class="k">Address</span><span class="v">${_address}</span></div>`;
    $('apApprove').textContent='Connect';
  } else if(p.method==='pay'){
    ic.innerHTML=ICONS.sendBig; $('apTitle').textContent='Approve payment';
    const sats=satNum(p.params.amount), fee=(p.params.fee|0)||sendMinerFee();
    d.innerHTML=`<div class="kv"><span class="k">From</span><span class="v">${esc(_accounts[_active].name)}</span></div>
      <div class="kv"><span class="k">To</span><span class="v">${esc(p.params.to)}</span></div>
      <div class="kv"><span class="k">Amount</span><span class="v">${sats.toLocaleString()} sats</span></div>
      ${p.params.data?`<div class="kv"><span class="k">OP_RETURN</span><span class="v">${esc(String(p.params.data)).slice(0,80)}</span></div>`:''}
      <div class="kv"><span class="k">Miner fee</span><span class="v">${fee} sats</span></div>
      <div class="kv"><span class="k">Service fee</span><span class="v">${TOTAL_SERVICE_FEES} sats</span></div>`;
    $('apApprove').textContent='Approve & send';
  } else if(p.method==='inscribe'){
    ic.innerHTML=ICONS.pen; $('apTitle').textContent='Approve inscription';
    const bytes=(p.params.data!=null)?new TextEncoder().encode(String(p.params.data)).length:0;
    d.innerHTML=`<div class="kv"><span class="k">Content type</span><span class="v">${esc(p.params.contentType||'')}</span></div>
      ${p.params.contentType==='text/plain'&&bytes<64?`<div class="kv"><span class="k">Data</span><span class="v">${esc(String(p.params.data))}</span></div>`:''}
      <div class="kv"><span class="k">Size</span><span class="v">${bytes.toLocaleString()} bytes</span></div>
      <div class="kv"><span class="k">Inscribe to</span><span class="v">${_address}</span></div>
      <div class="kv"><span class="k">Miner fee</span><span class="v">${inscribeMinerFee(bytes).toLocaleString()} sats</span></div>
      <div class="kv"><span class="k">Service fee</span><span class="v">${TOTAL_SERVICE_FEES.toLocaleString()} sats</span></div>`;
    $('apApprove').textContent='Approve & inscribe';
  } else if(p.method==='signMessage'){
    ic.innerHTML=ICONS.check; $('apTitle').textContent='Sign message';
    d.innerHTML=`<p>Sign this message with your key. No coins move.</p><div class="kv"><span class="k">Message</span><span class="v">${esc(String(p.params.message)).slice(0,200)}</span></div>`;
    $('apApprove').textContent='Sign';
  } else if(p.method==='purchase'){
    ic.innerHTML=ICONS.cart; $('apTitle').textContent='Approve purchase';
    const sats=purchaseSats(p.params), fee=sendMinerFee();
    d.innerHTML=`<div class="kv"><span class="k">Item</span><span class="v">${esc(p.params.itemTitle||'Order')}</span></div>
      ${p.params.shop?`<div class="kv"><span class="k">Shop</span><span class="v">${esc(p.params.shop)}</span></div>`:''}
      <div class="kv"><span class="k">Seller</span><span class="v">${esc(p.params.to||'')}</span></div>
      <div class="kv"><span class="k">Amount</span><span class="v">${sats.toLocaleString()} sats</span></div>
      <div class="kv"><span class="k">Miner fee</span><span class="v">${fee} sats</span></div>
      <div class="kv"><span class="k">Service fee</span><span class="v">${TOTAL_SERVICE_FEES.toLocaleString()} sats</span></div>
      <p style="margin-top:8px;color:var(--text-secondary);font-size:12px">You sign the order and pay in one step. Your signature and the order reference are written on-chain.</p>`;
    $('apApprove').textContent='Sign & pay';
  } else if(p.method==='listOrdinal'){
    ic.innerHTML=ICONS.tag; $('apTitle').textContent='List for sale';
    d.innerHTML=`<p>Sign a one-sided atomic swap. The ordinal stays in your wallet until a buyer pays your price.</p>
      <div class="kv"><span class="k">Ordinal</span><span class="v">${esc(String(p.params.ordinalTxid||'').slice(0,10))}…_${p.params.ordinalVout}</span></div>
      <div class="kv"><span class="k">Price</span><span class="v">${bsvFmt(satNum(p.params.priceSat))} BSV (${satNum(p.params.priceSat).toLocaleString()} sats)</span></div>
      <div class="kv"><span class="k">Paid to</span><span class="v">${_address}</span></div>`;
    $('apApprove').textContent='Sign listing';
  } else if(p.method==='buyOrdinal'){
    ic.innerHTML=ICONS.bag; $('apTitle').textContent='Buy ordinal';
    const price=satNum(p.params.priceSat), fee=ordinalMinerFee();
    // v3.5 — extraOutputs (bv. 0,5% marketplace-fee) zichtbaar in het approve-scherm
    const extras=Array.isArray(p.params.extraOutputs)?p.params.extraOutputs:[];
    const extraRows=extras.map(eo=>{const s=satNum(eo.sats||eo.amount);return s>0?`<div class="kv"><span class="k">Marketplace fee</span><span class="v">${s.toLocaleString()} sats → ${esc(String(eo.to||'').slice(0,12))}…</span></div>`:'';}).join('');
    d.innerHTML=`<p>Complete the swap: pay the seller and receive the ordinal in one transaction.</p>
      <div class="kv"><span class="k">Price to seller</span><span class="v">${bsvFmt(price)} BSV (${price.toLocaleString()} sats)</span></div>
      <div class="kv"><span class="k">Seller</span><span class="v">${esc(String(p.params.sellerAddress||''))}</span></div>
      ${extraRows}
      <div class="kv"><span class="k">Miner fee</span><span class="v">${fee.toLocaleString()} sats</span></div>
      <div class="kv"><span class="k">Service fee</span><span class="v">${TOTAL_SERVICE_FEES.toLocaleString()} sats</span></div>
      <div class="kv"><span class="k">Received to</span><span class="v">${_address}</span></div>`;
    $('apApprove').textContent='Approve & buy';
  } else if(p.method==='sendTx'){
    ic.innerHTML=ICONS.sendBig;
    $('apTitle').textContent=(p.params.meta&&p.params.meta.title)||'Approve transaction';
    const outs=Array.isArray(p.params.outputs)?p.params.outputs:[];
    const rows=outs.map((o,i)=>{
      if(o.type==='inscription') return `<div class="kv"><span class="k">#${i} Inscription</span><span class="v">${esc(String(o.data||'').slice(0,40))} → ${(satNum(o.satoshis)||1)} sat</span></div>`;
      if(o.type==='p2pkh')       return `<div class="kv"><span class="k">#${i} Payment</span><span class="v">${satNum(o.satoshis).toLocaleString()} sats → ${esc(String(o.address).slice(0,16))}…</span></div>`;
      if(o.type==='opreturn')    return `<div class="kv"><span class="k">#${i} OP_RETURN</span><span class="v">${esc((o.data||[]).join(' ')).slice(0,60)}</span></div>`;
      if(o.type==='script')      return `<div class="kv"><span class="k">#${i} Script</span><span class="v">${satNum(o.satoshis).toLocaleString()} sats</span></div>`;
      return '';
    }).join('');
    const svc=(p.params.includeServiceFees!==false)?TOTAL_SERVICE_FEES:0;
    d.innerHTML=`${(p.params.meta&&p.params.meta.shop)?`<div class="kv"><span class="k">Shop</span><span class="v">${esc(p.params.meta.shop)}</span></div>`:''}
      ${rows}
      <div class="kv"><span class="k">Service fee</span><span class="v">${svc.toLocaleString()} sats</span></div>
      <p style="margin-top:8px;color:var(--text-secondary);font-size:12px">Review every output above — you sign and broadcast in one step.</p>`;
    $('apApprove').textContent='Approve & send';
  }
  $('apApprove').disabled=false; $('apReject').disabled=false;
}
async function approveRequest(){
  const p=_pending; if(!p) return;
  $('apApprove').disabled=true; $('apReject').disabled=true; clr($('apErr'));
  const lbl=$('apApprove').textContent; $('apApprove').innerHTML='<span class="spinner"></span> Working...';
  try{
    let result;
    const readMethods=['connect','getAddress','getPublicKey','getBalance'];
    if(readMethods.includes(p.method)){
      const key='ordplug_connected';
      const cur=(await new Promise(r=>chrome.storage.session.get([key],x=>r(x[key]))))||{};
      cur[p.origin]=true;
      await new Promise(r=>chrome.storage.session.set({ [key]:cur }, r));
      if(p.method==='getPublicKey') result={ pubkey:wifToPubKey(_wif), address:_address };
      else if(p.method==='getBalance') result=await getBalance();
      else result={ address:_address };
    }
    else if(p.method==='pay'){ const tx=await buildSend(p.params.to, satNum(p.params.amount), p.params.data||null, (p.params.fee|0)); result={ txid:await broadcastAndRegister(tx) }; }
    else if(p.method==='inscribe'){ const bytes=new TextEncoder().encode(String(p.params.data)); const tx=await buildInscribe(p.params.contentType||'text/plain', bytes, (p.params.fee|0)); result={ txid:await broadcastAndRegister(tx), address:_address }; }
    else if(p.method==='signMessage'){ result=Object.assign(signMessage(String(p.params.message)), { address:_address }); }
    else if(p.method==='purchase'){
      const sats=purchaseSats(p.params);
      if(sats<1) throw new Error('Invalid amount.');
      bsv.Address.fromString(String(p.params.to));
      const msg=purchaseMessage(p.params);
      const sig=signMessage(msg);
      let opret=String(p.params.reference || p.params.opReturn || msg) + ' | sig:' + sig.signature;
      if(opret.length>900) opret=opret.slice(0,900);
      const opSize=new TextEncoder().encode(opret).length;
      const feeSat=Math.ceil((200 + 13*34 + opSize) * FEE_RATE);
      const tx=await buildSend(String(p.params.to), sats, opret, feeSat);
      result={ txid:await broadcastAndRegister(tx), address:_address, signature:sig.signature, pubkey:sig.pubkey, message:msg };
    }
    else if(p.method==='listOrdinal'){
      const price=satNum(p.params.priceSat);
      if(price<1) throw new Error('Invalid price.');
      const signed=await buildListingPartial(String(p.params.ordinalTxid), p.params.ordinalVout|0, price);
      result={ partialTx:signed.partialTx, payScriptHex:signed.payScriptHex, sellerAddress:_address, priceSat:price };
    }
    else if(p.method==='buyOrdinal'){
      const tx=await buildPurchaseFromPartial(String(p.params.partialTx), satNum(p.params.priceSat), String(p.params.sellerAddress), String(p.params.payScriptHex), p.params.extraOutputs);
      result={ txid:await broadcastAndRegister(tx), address:_address };
    }
    else if(p.method==='sendTx'){
      const tx=await buildTx(p.params);
      const txid=(p.params.broadcast===false)?null:await broadcastAndRegister(tx);
      result={ txid, rawtx:tx.toString(), address:_address };
    }
    else throw new Error('Unknown method: '+p.method);
    resolvePending(true, result);
    window.close();
  }catch(e){
    err($('apErr'), e.message||'Failed.');
    $('apApprove').disabled=false; $('apReject').disabled=false; $('apApprove').textContent=lbl;
  }
}
function rejectRequest(){
  resolvePending(false, null, 'User rejected the request');
  window.close();
}
function resolvePending(ok, result, error){
  const p=_pending; _pending=null; if(!p) return;
  chrome.runtime.sendMessage({ type:'ordplug_resolve', id:p.id, tabId:p.tabId, origin:p.origin, ok, result, error });
  chrome.storage.session.remove('ordplug_pending');
}

/* ---------- send ---------- */
/* v4.1 — verified name payment targets (two-tap confirm: first Send tap
   resolves + verifies, second tap re-verifies and only then pays) */
let _opnsTarget=null;   // { kind:'opns', name, holderAddress, currentTxid, currentVout }
let _snsTarget=null;    // { kind:'sns', name, mailbox, fallback, holderAddress, currentTxid, currentVout, expires, warning }

function validAddress(s){ try{ bsv.Address.fromString(String(s)); return true; }catch(e){ return false; } }

/* bare OpNS name candidate: a-z, 0-9, hyphen — and NO dot (a dotted name is
   SNS, never OpNS) and no @ (paymail is not a payment target here) */
function opnsNameCandidate(s){
  const t=String(s).trim().toLowerCase();
  if(!t || t.includes('.') || t.includes('@')) return null;
  if(!/^[a-z0-9-]+$/.test(t)) return null;
  if(validAddress(t)) return null;
  return t;
}
/* SNS candidate: `naam.tld` or `mailbox@naam.tld` — a dot in the domain part
   is what separates SNS from OpNS. ASCII lowercase only by construction, so
   homograph/mixed-script inputs never reach the resolver from here. The TLD
   list is NOT hardcoded: the resolver itself answers unknown_tld/retired_tld
   with a readable inline message. */
function snsInputCandidate(s){
  const t=String(s).trim().toLowerCase();
  return /^(?:[a-z0-9][a-z0-9._-]{0,63}@)?(?:[a-z0-9][a-z0-9-]{0,62}\.)+[a-z][a-z0-9-]{1,24}$/.test(t) ? t : null;
}
function clearNameTargets(){ _opnsTarget=null; _snsTarget=null; }

function shortUtxo(txid, vout){ return String(txid).slice(0,10)+'…'+String(txid).slice(-6)+'_'+vout; }

/* confirm block + button label follow the verified target (SNS wins if both
   were ever set — they can't be: the candidates are mutually exclusive) */
function updateSendConfirmUI(){
  const box=$('sendConfirm'), btn=$('sendBtn');
  const t=_snsTarget||_opnsTarget;
  if(!t){
    box.classList.add('hidden'); box.innerHTML='';
    btn.textContent='Send';
    return;
  }
  if(t.kind==='sns'){
    // pay-to address comes from the SIGNED holder_script, never from the
    // unsigned holder_address field
    box.innerHTML='<div class="kv" style="border:none;padding:4px 0;font-weight:600">Confirm SNS payment</div>'
      +'<div class="kv"><span class="k">Name</span><span class="v">'+esc(t.name)+'</span></div>'
      +(t.mailbox?('<div class="kv"><span class="k">Mailbox</span><span class="v">'+esc(t.mailbox+'@'+t.name)+'</span></div>'):'')
      +'<div class="kv"><span class="k">Holder address</span><span class="v" style="font-family:monospace">'+esc(t.holderAddress)+'</span></div>'
      +'<div class="kv"><span class="k">Inscription UTXO</span><span class="v" style="font-family:monospace">'+esc(shortUtxo(t.currentTxid, t.currentVout))+'</span></div>'
      +(t.fallback?('<div class="alert alert-warning show" style="margin-top:8px">Mailbox "'+esc(t.mailbox)+'" is unknown — the payment goes to the holder of '+esc(t.name)+'.</div>'):'')
      +(t.warning?('<div class="alert alert-warning show" style="margin-top:8px">'+esc(t.warning).replace(/\n/g,'<br>')+'</div>'):'')
      +'<div class="hint" style="margin-top:8px">Signed resolver answer verified against the pinned key; the inscription outpoint was checked unspent. Everything is re-verified the moment you confirm.</div>';
    btn.textContent='Confirm & pay "'+(t.mailbox?(t.mailbox+'@'+t.name):t.name)+'"';
  } else {
    // OpNS: ALWAYS the exact name + the verified holder address, inline,
    // before anything is paid (intermediate names like "alexande" vs
    // "alexander" can have different owners)
    box.innerHTML='<div class="kv" style="border:none;padding:4px 0;font-weight:600">Confirm OpNS payment</div>'
      +'<div class="kv"><span class="k">Exact name</span><span class="v">'+esc(t.name)+'</span></div>'
      +'<div class="kv"><span class="k">Verified holder</span><span class="v" style="font-family:monospace">'+esc(t.holderAddress)+'</span></div>'
      +'<div class="kv"><span class="k">Inscription UTXO</span><span class="v" style="font-family:monospace">'+esc(shortUtxo(t.currentTxid, t.currentVout))+'</span></div>'
      +'<div class="hint" style="margin-top:8px">Exact match only; the holder address was recomputed from the on-chain locking script and the outpoint was checked unspent. Everything is re-verified the moment you confirm.</div>';
    btn.textContent='Confirm & pay "'+t.name+'"';
  }
  box.classList.remove('hidden');
}

function showSend(){
  showView('send');
  $('sendFrom').textContent='From: '+(_accounts[_active].name||'Account')+' · '+_address;
  $('sendTo').value=''; $('sendAmt').value=''; clr($('sendErr'));
  $('sendWarn').style.display='none'; $('sendWarn').innerHTML='';
  $('sendFeeInfo').textContent='~'+sendMinerFee().toLocaleString()+' sats network + '+TOTAL_SERVICE_FEES.toLocaleString()+' sats service';
  const ok=$('sendOk'); ok.className='alert alert-success'; ok.textContent='';
  $('sendSaveBtn').classList.add('hidden');
  clearNameTargets(); updateSendConfirmUI();
  fillSendBook();
  _lastKnownBalance=null;
  getBalance().then(b=>{ _lastKnownBalance=(b.confirmed||0); }).catch(()=>{});
}
/* the actual broadcast + aftercare — shared by the address path and the
   verified OpNS/SNS name paths */
async function performSendTo(to, amt){
  const ok=$('sendOk');
  const tx=await buildSend(to, amt, null);
  const txid=await broadcastAndRegister(tx);
  ok.textContent='Sent! TXID: '+txid; ok.className='alert alert-success show';
  _lastSentAddr=to;
  if(!bookLabelFor(to) && !_accounts.some(a=>a.address===to)){
    $('sendSaveBtn').textContent='Save '+to.slice(0,8)+'… to address book';
    $('sendSaveBtn').classList.remove('hidden');
  }
  $('sendTo').value=''; $('sendAmt').value='';
  $('sendWarn').style.display='none';
  clearNameTargets();
}
async function doSend(){
  clr($('sendErr')); const ok=$('sendOk'); ok.className='alert alert-success'; ok.textContent='';
  const to=$('sendTo').value.trim(); const amt=parseInt($('sendAmt').value)||0;
  if(!to){ err($('sendErr'),'Enter a recipient address, SNS or OpNS name.'); return; }
  if(amt<1){ err($('sendErr'),'Enter an amount in sats (1 or more).'); return; }
  const btn=$('sendBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Working...';
  try{
    // plain BSV address — the original path, unchanged
    if(validAddress(to)){
      clearNameTargets();
      await performSendTo(to, amt);
      return;
    }
    // v4.1 — SNS name or mailbox (naam.tld / mailbox@naam.tld): resolve via
    // the SIGNED resolver; two-tap confirm, re-verified at signing. The
    // freshness/expires checks live in resolveSnsPayment.
    const snsInput=snsInputCandidate(to);
    if(snsInput){
      let target;
      try{ target=await resolveSnsPayment(snsInput); }
      catch(e){ clearNameTargets(); throw e; }
      const seen=_snsTarget;
      if(seen && seen.name===target.name && seen.holderAddress===target.holderAddress){
        // same verified holder — either identical, or only the freshness
        // fields moved (expires/outpoint re-issued): safe to pay
        await performSendTo(target.holderAddress, amt);
      } else if(seen){
        _snsTarget=target;
        err($('sendErr'),'The verified details of '+target.name+' changed while you were confirming — review them and press the button again. Nothing was paid.');
      } else {
        _snsTarget=target;
      }
      return;
    }
    // v4.1 — not an address, not SNS: OpNS name or paymail?
    if(to.includes('@')){
      err($('sendErr'),'Paymail (name@host) is not accepted as a payment target: any host can serve any name and bindings expire on transfer. Enter the bare OpNS name, an SNS mailbox (mailbox@naam.tld) or a BSV address.');
      return;
    }
    const name=opnsNameCandidate(to);
    if(!name){ err($('sendErr'),'That is not a valid BSV address.'); return; }
    // two-tap confirm; the resolve (exact match + on-chain recompute +
    // unspent outpoint) runs on EVERY tap, so the confirm tap re-verifies
    // right before broadcasting — never a cached address
    let target;
    try{ target=await resolveOpnsPayment(name); }
    catch(e){ clearNameTargets(); throw e; }
    const seen=_opnsTarget;
    if(seen && seen.name===target.name && seen.holderAddress===target.holderAddress
       && seen.currentTxid===target.currentTxid && seen.currentVout===target.currentVout){
      await performSendTo(target.holderAddress, amt);
    } else if(seen){
      _opnsTarget=target;
      err($('sendErr'),'The verified details of "'+target.name+'" changed while you were confirming — review them and press the button again. Nothing was paid.');
    } else {
      _opnsTarget=target;
    }
  }catch(e){ err($('sendErr'), e.message||'Send failed.'); }
  finally{ btn.disabled=false; updateSendConfirmUI(); }
}
async function showIdle(){
  showView('idle');
  $('idleName').textContent='BitcoinSV';
  $('idleAddress').textContent=_address;
  $('idleBalance').textContent='\u2026';
  $('idleBalanceSub').textContent=(_accounts[_active].name||'Account')+' \u00b7 confirmed + unconfirmed';
  // leave bulk-selection mode when (re)entering home
  _bulkMode=false; _bulkArmed=false; _bulkSel.clear();
  $('bulkPanel').classList.add('hidden'); $('btnBulkList').classList.remove('on');
  // keep tab + page + search: returning from a listing on page 6 lands back on page 6
  setHoldTab(_holdTab);
  loadHoldings();
  try{
    const b=await getBalance();
    const sats=(b.confirmed||0)+(b.unconfirmed||0);
    $('idleBalance').innerHTML=bsvFmt(sats)+' <small>BSV</small>';
    let sub=(_accounts[_active].name||'Account')+' · '+sats.toLocaleString()+' sats';
    try{
      const r=await fetch(`${API_BASE}/exchangerate`);
      if(r.ok){ const j=await r.json(); const rate=parseFloat(j.rate);
        if(rate>0) sub+=' \u00b7 \u2248 $'+((sats/1e8)*rate).toFixed(2); }
    }catch(_){}
    $('idleBalanceSub').textContent=sub;
  }catch(_){ $('idleBalance').textContent='unavailable'; }
}
function bsvFmt(sats){
  const v=sats/1e8;
  let s=v.toFixed(8);
  s=s.replace(/(\.\d*?)0+$/,'$1').replace(/\.$/,'');
  return s;
}
let _copyTimer=null;
async function copyActiveAddress(){
  try{
    await navigator.clipboard.writeText(_address);
    const n=$('copiedNote'); n.classList.remove('hidden');
    if(_copyTimer) clearTimeout(_copyTimer);
    _copyTimer=setTimeout(()=>n.classList.add('hidden'), 1400);
    return true;
  }catch(e){ return false; }
}

/* ---------- receive ---------- */
function showReceive(){
  showView('receive');
  $('rcvName').textContent=(_accounts[_active].name||'Account')+' \u00b7 BSV mainnet';
  $('rcvAddress').textContent=_address;
  const ok=$('rcvOk'); ok.className='alert alert-success'; ok.textContent='';
  try{
    const qr=qrcode(0,'M'); qr.addData(_address); qr.make();
    $('qrBox').innerHTML=qr.createSvgTag({ cellSize:4, margin:0, scalable:true });
  }catch(e){ $('qrBox').innerHTML='<div class="empty-note">QR unavailable</div>'; }
}
async function copyReceiveAddress(){
  const ok=$('rcvOk');
  try{
    await navigator.clipboard.writeText(_address);
    ok.textContent='Address copied to clipboard.'; ok.className='alert alert-success show';
  }catch(e){ ok.textContent='Could not copy \u2014 select and copy the address manually.'; ok.className='alert alert-success show'; }
}

/* ---------- history ---------- */
async function showHistory(){
  showView('history');
  $('histSub').textContent=_address.slice(0,10)+'\u2026'+_address.slice(-6);
  const list=$('histList'); list.innerHTML='<div class="empty-note">Loading\u2026</div>';
  try{
    const r=await fetch(`${API_BASE}/address/${_address}/history`);
    if(!r.ok) throw new Error('history unavailable');
    let txs=await r.json(); if(!Array.isArray(txs)) txs=[];
    txs.sort((a,b)=>{ const ha=(a.height&&a.height>0)?a.height:1e12, hb=(b.height&&b.height>0)?b.height:1e12; return hb-ha; });
    const rows=txs.slice(0,15).map(t=>`
      <div class="txrow" data-tx="${esc(t.tx_hash)}" title="Open on WhatsOnChain">
        <div class="tic">${ICONS.txSmall}</div>
        <div class="tm">
          <div class="th">${esc(t.tx_hash)}</div>
          <div class="ts">${(t.height&&t.height>0)?('block '+t.height):'pending (mempool)'}</div>
        </div>
      </div>`).join('');
    list.innerHTML=rows||'<div class="empty-note">No transactions on this address yet.</div>';
  }catch(e){ list.innerHTML='<div class="empty-note">Could not load history from WhatsOnChain.</div>'; }
}

/* ---------- browse (.web3) ---------- */
/* ---------- my .web3 domains (ORDnet registry) ---------- */
// v4.0 — WEB3 domain management on the v2 platform, main domain since the
// cutover (one constant, one switch)
const DOMAINS_API='https://domains.ordnet.io';
const DOMAINS_TTL=10*60*1000; // 10 min cache per address

async function loadMyDomains(force){
  const box=$('myDomainsList'); if(!box) return;
  if(!_address){ box.innerHTML='<div class="empty-note">Unlock your wallet to see your .web3 domains.</div>'; return; }
  const addr=_address, key='web3domains:'+addr;
  if(!force){
    try{
      const st=await chrome.storage.local.get(key);
      const c=st[key];
      if(c && Array.isArray(c.domains) && (Date.now()-c.ts)<DOMAINS_TTL){ renderMyDomains(c.domains); return; }
    }catch(e){}
  }
  box.innerHTML='<div class="empty-note">Loading…</div>';
  try{
    const r=await fetch(DOMAINS_API+'/api/owner/'+encodeURIComponent(addr));
    if(!r.ok) throw new Error('HTTP '+r.status);
    const j=await r.json();
    const domains=Array.isArray(j.domains)?j.domains:[];
    try{ await chrome.storage.local.set({ [key]:{ ts:Date.now(), domains } }); }catch(e){}
    if(addr===_address) renderMyDomains(domains);
  }catch(e){
    box.innerHTML='<div class="empty-note">Could not load your domains right now.</div>';
  }
}

// since v37 \u2014 WEB3 domain list with search + pagination (10 per page, like
// the SNS list at 20). renderMyDomains(domains) sets the source; re-rendering
// on search/paging goes through renderMyDomains() without an argument.
const MYDOM_PER_PAGE=10;
let _myDomAll=[], _myDomPage=0, _myDomSearch='';
function renderMyDomains(domains){
  if(domains) _myDomAll=domains;
  const box=$('myDomainsList'); if(!box) return;
  const pager=$('myDomainsPager');
  const q=_myDomSearch.trim().toLowerCase();
  const filtered=q?_myDomAll.filter(d=>String(d.name||'').toLowerCase().includes(q)):_myDomAll;
  if(!_myDomAll.length){
    box.innerHTML='<div class="empty-note">No .web3 domains on this wallet yet \u2014 claim one via ORD/domains below.</div>';
    if(pager) pager.classList.add('hidden');
    return;
  }
  if(!filtered.length){
    box.innerHTML='<div class="empty-note">No domains match "'+esc(q)+'".</div>';
    if(pager) pager.classList.add('hidden');
    return;
  }
  const pages=Math.max(1, Math.ceil(filtered.length/MYDOM_PER_PAGE));
  if(_myDomPage>=pages)_myDomPage=pages-1;
  if(_myDomPage<0)_myDomPage=0;
  const slice=filtered.slice(_myDomPage*MYDOM_PER_PAGE, _myDomPage*MYDOM_PER_PAGE+MYDOM_PER_PAGE);
  box.innerHTML=slice.map(d=>{
    const sale=d.listing_status==='active';
    const badge=sale
      ? `<span class="domain-badge sale">For sale${(d.listing_price!=null)?' \u00b7 $'+esc(String(d.listing_price)):''}</span>`
      : `<span class="domain-badge">${esc(String(d.status||'claimed'))}</span>`;
    return `<div class="domain-row" data-domain="${esc(String(d.name))}" title="Open ${esc(String(d.name))}"><span class="dn">${esc(String(d.name))}</span>${badge}</div>`;
  }).join('');
  box.querySelectorAll('.domain-row').forEach(row=>{
    row.addEventListener('click', ()=>showDomainDetail(row.getAttribute('data-domain')));
  });
  if(pager){
    if(filtered.length>MYDOM_PER_PAGE){
      pager.classList.remove('hidden');
      $('myDomPrev').disabled=(_myDomPage<=0);
      $('myDomNext').disabled=(_myDomPage>=pages-1);
      $('myDomPageInfo').textContent='Page '+(_myDomPage+1)+' / '+pages+' \u00b7 '+filtered.length+' total';
    } else pager.classList.add('hidden');
  }
}

/* ---------- domain detail + set-target (signed) ---------- */
let _domCurrent=null;
async function showDomainDetail(name){
  _domCurrent=name;
  showView('domain');
  $('domName').textContent=name;
  $('domInfo').innerHTML='<div class="empty-note">Loading…</div>';
  $('domTxid').value=''; $('domVout').value='';
  clr($('domErr')); clr($('domOk'));
  loadDomainRecords(name);
  try{
    const r=await fetch(DOMAINS_API+'/whois/'+encodeURIComponent(name));
    if(!r.ok) throw new Error('HTTP '+r.status);
    const j=await r.json();
    const tgt=j.target ? esc(String(j.target.txid||j.target)) : null;
    $('domInfo').innerHTML=
      `<div class="kv"><span class="k">Status</span><span class="v">${esc(String(j.status||'—'))}</span></div>`+
      `<div class="kv"><span class="k">Owner</span><span class="v">${esc(String(j.owner||'—').slice(0,12))}…${esc(String(j.owner||'').slice(-6))}</span></div>`+
      `<div class="kv"><span class="k">Target</span><span class="v">${tgt ? tgt.slice(0,16)+'…' : 'not set'}</span></div>`+
      `<div class="kv"><span class="k">Registered</span><span class="v">${esc(String(j.registered_at||'—').slice(0,10))}</span></div>`;
    if(j.target && j.target.txid){ $('domTxid').value=String(j.target.txid); if(j.target.vout!=null) $('domVout').value=String(j.target.vout); }
    else if(typeof j.target==='string' && j.target){ $('domTxid').value=j.target; }
  }catch(e){
    $('domInfo').innerHTML='<div class="empty-note">Could not load domain details.</div>';
  }
}

/* ---------- signed wallet actions (key = ownership) ---------- */
function okMsg(t){ const o=$('domOk'); o.textContent=t; o.classList.add('show'); }
function parseTx(v){ const s=String(v||'').trim().toLowerCase(); const m=s.match(/^([0-9a-f]{64})(?::(\d+))?$/); if(!m) return null; return { txid:m[1], vout:m[2]?parseInt(m[2],10):0 }; }
function signAction(action, fields){
  const ts=Date.now();
  const msg=['ordnet-registry',action].concat(fields.map(String)).concat([String(ts)]).join('|');
  const sig=signMessage(msg);
  return { ts, address:_address, signature:sig.signature, pubkey:sig.pubkey };
}
async function walletPost(pathname, action, fields, body){
  if(!_address||!_wif) throw new Error('Unlock your wallet first.');
  const auth=signAction(action, fields);
  const r=await fetch(DOMAINS_API+pathname,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(Object.assign({}, body, auth)) });
  const j=await r.json().catch(()=>({}));
  if(!r.ok||j.error) throw new Error(j.error||('HTTP '+r.status));
  return j;
}

/* ---------- subdomains / routes / marketplace records ---------- */
async function loadDomainRecords(name){
  const subs=$('domSubs'), rts=$('domRoutes'), mkt=$('domMkt');
  try{
    const r=await fetch(DOMAINS_API+'/api/domain/'+encodeURIComponent(name)+'/records');
    if(!r.ok) throw new Error('HTTP '+r.status);
    const j=await r.json();
    if(name!==_domCurrent) return;
    renderRecs(subs, j.subdomains||[], 'sub');
    renderRecs(rts, j.routes||[], 'route');
    renderMkt(j.listing||null);
  }catch(e){
    subs.innerHTML='<div class="empty-note">Could not load records.</div>';
    rts.innerHTML='<div class="empty-note">—</div>';
    mkt.innerHTML='<div class="empty-note">—</div>';
  }
}
function renderRecs(box, items, kind){
  if(!items.length){ box.innerHTML='<div class="empty-note">None yet.</div>'; return; }
  box.innerHTML=items.map(it=>{
    const label = kind==='sub' ? esc(String(it.subdomain)) : (it.subdomain?esc(String(it.subdomain))+' \u00b7 ':'')+'/'+esc(String(it.path));
    const attrs = kind==='sub' ? 'data-sub="'+esc(String(it.subdomain))+'"' : 'data-path="'+esc(String(it.path))+'" data-rsub="'+esc(String(it.subdomain||''))+'"';
    return '<div class="rec-row"><span class="rn">'+label+'</span><span class="rt">'+esc(String(it.txid||'').slice(0,12))+'\u2026</span><button class="iconbtn rec-del" '+attrs+' title="Remove">'+ICONS.trash+'</button></div>';
  }).join('');
  box.querySelectorAll('.rec-del').forEach(b=>b.addEventListener('click', ()=>{
    if(kind==='sub') delSubdomain(b.getAttribute('data-sub'));
    else delRoute(b.getAttribute('data-rsub'), b.getAttribute('data-path'));
  }));
}
function renderMkt(listing){
  const mkt=$('domMkt');
  if(listing){
    mkt.innerHTML='<div class="kv"><span class="k">Listed</span><span class="v">$'+esc(String(listing.price_usd))+'</span></div>'
      +'<div class="rec-add mkt" style="margin-top:6px"><input type="number" class="form-input" id="mktPrice" min="1" step="1" value="'+esc(String(listing.price_usd))+'"><button class="btn btn-secondary" id="btnMktUpd">Update</button><button class="btn btn-secondary" id="btnMktDel">Delist</button></div>';
    $('btnMktUpd').addEventListener('click', updateListing);
    $('btnMktDel').addEventListener('click', delistDomain);
  }else{
    mkt.innerHTML='<div class="rec-add mkt"><input type="number" class="form-input" id="mktPrice" min="1" step="1" placeholder="Price USD"><button class="btn btn-secondary" id="btnMktList" style="grid-column:span 2">List for sale</button></div>';
    $('btnMktList').addEventListener('click', listDomain);
  }
}
async function addSubdomain(){
  clr($('domErr')); clr($('domOk'));
  const sd=$('subNew').value.trim().toLowerCase(); const tx=parseTx($('subTx').value);
  if(!/^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]?$/.test(sd)){ err($('domErr'),'Invalid subdomain name (alphanumeric, hyphens).'); return; }
  if(!tx){ err($('domErr'),'Enter a valid TXID, optionally as TXID:vout.'); return; }
  try{
    await walletPost('/wallet/subdomain','subdomain',[_domCurrent,sd,tx.txid,tx.vout],{domain:_domCurrent,subdomain:sd,txid:tx.txid,vout:tx.vout});
    $('subNew').value=''; $('subTx').value='';
    okMsg('Subdomain saved \u2713'); loadDomainRecords(_domCurrent);
  }catch(e){ err($('domErr'),'Could not save subdomain: '+String(e.message||e)); }
}
async function delSubdomain(sd){
  clr($('domErr')); clr($('domOk'));
  try{
    await walletPost('/wallet/subdomain-delete','subdomain-delete',[_domCurrent,sd],{domain:_domCurrent,subdomain:sd});
    okMsg('Subdomain removed \u2713'); loadDomainRecords(_domCurrent);
  }catch(e){ err($('domErr'),'Could not remove: '+String(e.message||e)); }
}
async function addRoute(){
  clr($('domErr')); clr($('domOk'));
  const p=$('rtPath').value.trim().toLowerCase().replace(/^\/+/,''); const sub=$('rtSub').value.trim().toLowerCase(); const tx=parseTx($('rtTx').value);
  if(!/^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]?$/.test(p)){ err($('domErr'),'Invalid path (alphanumeric, hyphens).'); return; }
  if(!tx){ err($('domErr'),'Enter a valid TXID, optionally as TXID:vout.'); return; }
  try{
    await walletPost('/wallet/route','route',[_domCurrent,sub||'',p,tx.txid,tx.vout],{domain:_domCurrent,subdomain:sub||null,path:p,txid:tx.txid,vout:tx.vout});
    $('rtPath').value=''; $('rtTx').value=''; $('rtSub').value='';
    okMsg('Route saved \u2713'); loadDomainRecords(_domCurrent);
  }catch(e){ err($('domErr'), e.message==='subdomain_not_found' ? 'That subdomain does not exist yet \u2014 create it first.' : 'Could not save route: '+String(e.message||e)); }
}
async function delRoute(sub, p){
  clr($('domErr')); clr($('domOk'));
  try{
    await walletPost('/wallet/route-delete','route-delete',[_domCurrent,sub||'',p],{domain:_domCurrent,subdomain:sub||null,path:p});
    okMsg('Route removed \u2713'); loadDomainRecords(_domCurrent);
  }catch(e){ err($('domErr'),'Could not remove: '+String(e.message||e)); }
}
async function removeTarget(){
  clr($('domErr')); clr($('domOk'));
  try{
    // v4.2 (iOS v2.5.2 fix) — same as set-target: the target handlers need
    // the canonical `name` field; `domain` stays for compatibility
    await walletPost('/wallet/remove-target','remove-target',[_domCurrent],{name:_domCurrent, domain:_domCurrent});
    $('domTxid').value=''; $('domVout').value='';
    okMsg('Target removed \u2713'); showDomainDetail(_domCurrent);
  }catch(e){ err($('domErr'),'Could not remove target: '+String(e.message||e)); }
}
async function listDomain(){
  clr($('domErr')); clr($('domOk'));
  const price=parseFloat($('mktPrice').value);
  if(!Number.isFinite(price)||price<=0){ err($('domErr'),'Enter a valid price in USD.'); return; }
  try{
    await walletPost('/wallet/list','list',[_domCurrent,price],{domain:_domCurrent,price_usd:price});
    okMsg('Listed for sale \u2713');
    try{ await chrome.storage.local.remove('web3domains:'+_address); }catch(e){}
    loadDomainRecords(_domCurrent);
  }catch(e){ err($('domErr'), e.message==='invalid_price' ? 'Price is below the minimum listing price.' : 'Could not list: '+String(e.message||e)); }
}
async function updateListing(){
  clr($('domErr')); clr($('domOk'));
  const price=parseFloat($('mktPrice').value);
  if(!Number.isFinite(price)||price<=0){ err($('domErr'),'Enter a valid price in USD.'); return; }
  try{
    await walletPost('/wallet/listing-update','listing-update',[_domCurrent,price],{domain:_domCurrent,price_usd:price});
    okMsg('Price updated \u2713');
    try{ await chrome.storage.local.remove('web3domains:'+_address); }catch(e){}
    loadDomainRecords(_domCurrent);
  }catch(e){ err($('domErr'), e.message==='has_pending_order' ? 'A purchase is in progress \u2014 listing is locked.' : 'Could not update: '+String(e.message||e)); }
}
async function delistDomain(){
  clr($('domErr')); clr($('domOk'));
  try{
    await walletPost('/wallet/delist','delist',[_domCurrent],{domain:_domCurrent});
    okMsg('Delisted \u2713');
    try{ await chrome.storage.local.remove('web3domains:'+_address); }catch(e){}
    loadDomainRecords(_domCurrent);
  }catch(e){ err($('domErr'), e.message==='has_pending_order' ? 'A purchase is in progress \u2014 listing is locked.' : 'Could not delist: '+String(e.message||e)); }
}
async function transferDomain(){
  clr($('domErr')); clr($('domOk'));
  const to=$('trAddr').value.trim();
  if(!/^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(to)){ err($('domErr'),'Enter a valid BSV address for the new owner.'); return; }
  if($('trConfirm').value.trim().toLowerCase()!==_domCurrent){ err($('domErr'),'Type the domain name exactly to confirm the transfer.'); return; }
  const btn=$('btnTransfer'); btn.disabled=true; btn.textContent='Signing\u2026';
  try{
    await walletPost('/wallet/transfer','transfer',[_domCurrent,to],{domain:_domCurrent,new_owner:to});
    okMsg('Domain transferred \u2713');
    try{ await chrome.storage.local.remove('web3domains:'+_address); }catch(e){}
    $('trAddr').value=''; $('trConfirm').value='';
    setTimeout(showDomains, 1400);
  }catch(e){ err($('domErr'), e.message==='listed_delist_first' ? 'This domain is listed for sale \u2014 delist it first.' : 'Could not transfer: '+String(e.message||e)); }
  finally{ btn.disabled=false; btn.textContent='Sign & transfer domain'; }
}

async function saveDomainTarget(){
  clr($('domErr')); clr($('domOk'));
  const name=_domCurrent;
  const txid=$('domTxid').value.trim().toLowerCase();
  const vout=parseInt($('domVout').value||'0',10);
  if(!name){ err($('domErr'),'No domain selected.'); return; }
  if(!_address||!_wif){ err($('domErr'),'Unlock your wallet first.'); return; }
  if(!/^[0-9a-f]{64}$/.test(txid)){ err($('domErr'),'Enter a valid 64-character transaction ID.'); return; }
  if(!Number.isInteger(vout)||vout<0){ err($('domErr'),'Output index must be 0 or higher.'); return; }
  const btn=$('btnDomainSave'); btn.disabled=true; btn.textContent='Signing…';
  try{
    const ts=Date.now();
    const msg=['ordnet-registry','set-target',name,txid,String(vout),String(ts)].join('|');
    const sig=signMessage(msg);
    btn.textContent='Saving…';
    // v4.2 (iOS v2.5.2 fix) — the v2 /wallet/set-target handler identifies the
    // domain by the platform's canonical `name` field (like /whois and
    // /resolve?name=); with only `domain` a ROOT domain fell through as an
    // empty name → invalid_domain. Send `name` (keep `domain` for compat).
    const r=await fetch(DOMAINS_API+'/wallet/set-target',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ name, domain:name, txid, vout, ts, address:_address, signature:sig.signature, pubkey:sig.pubkey })
    });
    const j=await r.json().catch(()=>({}));
    if(!r.ok||j.error) throw new Error(j.error||('HTTP '+r.status));
    const okEl=$('domOk'); okEl.textContent='Target updated \u2713'; okEl.classList.add('show');
    try{ await chrome.storage.local.remove('web3domains:'+_address); }catch(e){}
  }catch(e){
    err($('domErr'), e.message==='invalid_signature' ? 'Signature rejected \u2014 is this domain owned by the active wallet?' : 'Could not save: '+String(e.message||e));
  }finally{
    btn.disabled=false; btn.textContent='Sign & save target';
  }
}

function showBrowse(){ showView('browse'); setTimeout(()=>{ try{ $('browseInput').focus(); }catch(e){} }, 60); }
/* v4.2 — Domains is its own bottom-menu tab (was part of the browse view) */
function showDomains(){ showView('domains'); loadMyDomains(false); }
function browseNavigate(q){
  chrome.tabs.create({ url: chrome.runtime.getURL('src/viewer.html?q='+encodeURIComponent(q)) });
  window.close();
}

/* ---------- backup / reveal secret (per account, password-gated) ---------- */
let _bkIdx = -1;
function showBackup(i){
  _bkIdx = (typeof i==='number') ? i : _active;
  const a=_accounts[_bkIdx];
  showView('backup');
  $('bkName').textContent=(a.name||'Account')+' \u00b7 '+ (ORIGIN_LABEL[a.origin]||'key');
  $('bkGate').classList.remove('hidden');
  $('bkReveal').classList.add('hidden');
  $('bkPw').value=''; clr($('bkErr'));
  const ok=$('bkOk'); ok.className='alert alert-success'; ok.textContent='';
  setTimeout(()=>{ try{ $('bkPw').focus(); }catch(e){} }, 60);
}
async function doReveal(){
  clr($('bkErr'));
  const a=_accounts[_bkIdx]; if(!a){ err($('bkErr'),'No account selected.'); return; }
  const pw=$('bkPw').value;
  if(!pw){ err($('bkErr'),'Enter your password.'); return; }
  const btn=$('bkRevealBtn'); btn.disabled=true; const ol=btn.textContent; btn.innerHTML='<span class="spinner"></span> Checking...';
  try{
    // verify password by decrypting the vault (never trust the in-memory unlock alone for reveal)
    const vault=await storageGet(VAULT_KEY);
    if(!vault) throw new Error('No wallet on this device.');
    const bits=await kdfBits(pw, b64dec(vault.kdf.salt), vault.kdf.iters);
    const key=await aesKeyFromBits(bits);
    try{ await decryptPayload(key, vault.cipher); }
    catch(e){ throw new Error('Wrong password.'); }
    // WIF is always available
    $('bkWif').value=a.wif;
    // phrase reveal only if the account was created from a phrase in THIS session
    const phrase=_sessionPhrases[a.address];
    if(phrase){
      $('bkPhraseWrap').classList.remove('hidden');
      $('bkOrigin').textContent=(a.origin==='legacy'?'legacy':'BIP44');
      $('bkPhrase').value=phrase;
      $('bkPhraseHint').textContent='';
    }else{
      $('bkPhraseWrap').classList.add('hidden');
      const ok=$('bkOk');
      if(a.origin==='wif' || a.origin==='random'){
        ok.textContent='This account has no recovery phrase (it was added from a private key). Back up the WIF below.';
      }else{
        ok.textContent='The recovery phrase is not held in memory for this account. Back up the WIF below, or re-import the account from its phrase to reveal it.';
      }
      ok.className='alert alert-success show';
    }
    $('bkGate').classList.add('hidden');
    $('bkReveal').classList.remove('hidden');
  }catch(e){ err($('bkErr'), e.message||'Could not reveal secret.'); }
  finally{ btn.disabled=false; btn.textContent=ol; }
}
function hideRevealSecret(){
  $('bkWif').value=''; $('bkPhrase').value='';
  showAccounts();
}
async function copyText(str, okEl, label){
  try{ await navigator.clipboard.writeText(str); okEl.textContent=(label||'Copied')+' to clipboard.'; okEl.className='alert alert-success show'; }
  catch(e){ okEl.textContent='Could not copy \u2014 select the text and copy manually.'; okEl.className='alert alert-success show'; }
}

/* ---------- change password (re-encrypt the vault) ---------- */
function showChangePw(){
  showView('changepw');
  $('cpCur').value=''; $('cpNew1').value=''; $('cpNew2').value='';
  clr($('cpErr')); const ok=$('cpOk'); ok.className='alert alert-success'; ok.textContent='';
}
async function doChangePw(){
  clr($('cpErr')); const ok=$('cpOk'); ok.className='alert alert-success'; ok.textContent='';
  const btn=$('cpBtn'); btn.disabled=true; const ol=btn.textContent; btn.innerHTML='<span class="spinner"></span> Re-encrypting...';
  try{
    const vault=await storageGet(VAULT_KEY);
    if(!vault) throw new Error('No wallet on this device.');
    // verify current password
    const curBits=await kdfBits($('cpCur').value, b64dec(vault.kdf.salt), vault.kdf.iters);
    const curKey=await aesKeyFromBits(curBits);
    let payload;
    try{ payload=await decryptPayload(curKey, vault.cipher); }
    catch(e){ throw new Error('Current password is wrong.'); }
    checkPw($('cpNew1').value, $('cpNew2').value);
    if($('cpNew1').value===$('cpCur').value) throw new Error('New password is the same as the current one.');
    // re-encrypt with a fresh salt+key
    await createVault($('cpNew1').value, payload); // sets _aesKey + refreshes session
    ok.textContent='Password changed. Your vault has been re-encrypted.'; ok.className='alert alert-success show';
    $('cpCur').value=''; $('cpNew1').value=''; $('cpNew2').value='';
  }catch(e){ err($('cpErr'), e.message||'Could not change password.'); }
  finally{ btn.disabled=false; btn.textContent=ol; }
}

/* ---------- connected sites (whitelist of origins allowed to read this wallet) ---------- */
async function getConnected(){
  return (await new Promise(r=>chrome.storage.session.get(['ordplug_connected'],x=>r(x.ordplug_connected))))||{};
}
async function showSites(){
  showView('sites');
  const list=$('sitesList'); list.innerHTML='<div class="empty-note">Loading\u2026</div>';
  const conn=await getConnected();
  const origins=Object.keys(conn).filter(o=>conn[o]);
  if(!origins.length){ list.innerHTML='<div class="empty-note">No sites are connected in this browser session. Sites connect when you approve a wallet request.</div>'; return; }
  list.innerHTML=origins.map(o=>`
    <div class="acct">
      <div class="ic">${ICONS.link}</div>
      <div class="m"><div class="nm" style="font-size:13px">${esc(o.replace(/^https?:\/\//,''))}</div><div class="ad">${esc(o)}</div></div>
      <div class="ax"><button class="iconbtn" title="Disconnect" data-disc="${esc(o)}">${ICONS.trash}</button></div>
    </div>`).join('');
}
async function disconnectSite(origin){
  const conn=await getConnected();
  delete conn[origin];
  await new Promise(r=>chrome.storage.session.set({ ordplug_connected:conn }, r));
  showSites();
}

/* ---------- send max ---------- */
async function sendMax(){
  clr($('sendErr'));
  const btn=$('sendMaxBtn'); const ol=btn.textContent; btn.textContent='calculating...';
  try{
    const b=await getBalance();
    const spendable=(b.confirmed||0); // only confirmed sats are safely spendable
    const reserve=sendMinerFee()+TOTAL_SERVICE_FEES;
    const max=spendable-reserve;
    if(max<1){ err($('sendErr'),'Balance too low to cover the network + service fee.'); $('sendAmt').value=''; }
    else $('sendAmt').value=String(max);
  }catch(e){ err($('sendErr'),'Could not read balance for max.'); }
  finally{ btn.textContent=ol; }
}

/* ---------- activity-based auto-lock: refresh the session timestamp on interaction ---------- */
let _touchThrottle=0;
function touchActivity(){
  if(!_aesKey) return;
  const now=Date.now();
  if(now-_touchThrottle < 20000) return; // at most once per 20s
  _touchThrottle=now;
  sessionGetKey().then(s=>{ if(s&&s.k) sessionSetKey({ k:s.k, t:now }); });
}

/* ---------- address book (labels for trusted recipients) ----------
   Public addresses only — no key material — so it is stored unencrypted in
   chrome.storage.local as [{ name, address, ts }]. */
let _book = [];
async function loadBook(){
  const v = await storageGet(ADDRBOOK_KEY);
  _book = Array.isArray(v) ? v : [];
  return _book;
}
async function saveBook(){ await storageSet({ [ADDRBOOK_KEY]: _book }); }
function bookLabelFor(addr){ const e=_book.find(x=>x.address===addr); return e ? e.name : null; }
async function bookAdd(name, address){
  try{ bsv.Address.fromString(address); }catch(e){ throw new Error('That is not a valid BSV address.'); }
  name=(name||'').trim(); if(!name) name='Saved '+(_book.length+1);
  const existing=_book.find(x=>x.address===address);
  if(existing){ existing.name=name; }
  else _book.push({ name, address, ts:Date.now() });
  await saveBook();
}
async function bookRemove(address){ _book=_book.filter(x=>x.address!==address); await saveBook(); }

async function showAddressBook(){
  showView('book');
  await loadBook();
  renderBook();
  $('bookName').value=''; $('bookAddr').value=''; clr($('bookErr'));
}
function renderBook(){
  const list=$('bookList');
  if(!_book.length){ list.innerHTML='<div class="empty-note">No saved addresses yet. Add trusted recipients here so you can pick them when sending.</div>'; return; }
  list.innerHTML=_book.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(e=>`
    <div class="acct">
      <div class="ic">${esc((e.name||'A').charAt(0).toUpperCase())}</div>
      <div class="m"><div class="nm" style="font-size:13px">${esc(e.name)}</div><div class="ad">${esc(e.address)}</div></div>
      <div class="ax"><button class="iconbtn" title="Remove" data-book-del="${esc(e.address)}">${ICONS.trash}</button></div>
    </div>`).join('');
}
async function doBookAdd(){
  clr($('bookErr'));
  try{ await bookAdd($('bookName').value, $('bookAddr').value.trim()); $('bookName').value=''; $('bookAddr').value=''; renderBook(); }
  catch(e){ err($('bookErr'), e.message||'Could not add address.'); }
}

/* fill the send-view address-book dropdown */
async function fillSendBook(){
  await loadBook();
  const sel=$('sendBookSel');
  if(!_book.length){ sel.classList.add('hidden'); return; }
  sel.classList.remove('hidden');
  sel.innerHTML='<option value="">— pick from address book —</option>'+
    _book.slice().sort((a,b)=>a.name.localeCompare(b.name))
      .map(e=>`<option value="${esc(e.address)}">${esc(e.name)} · ${esc(e.address.slice(0,8))}…${esc(e.address.slice(-4))}</option>`).join('');
}

/* ---------- send safety: warn before signing (BSV-appropriate, no false certainty) ----------
   Not a full EVM-style simulation (BSV can't preview state changes the same way),
   but catches the mistakes that actually lose funds: unknown-first-time address,
   sending (near) the whole balance, self-sends, and malformed input. */
let _lastKnownBalance = null;
let _lastSentAddr = null;
async function saveLastSentAddress(){
  if(!_lastSentAddr) { showAddressBook(); return; }
  showView('book');
  await loadBook();
  $('bookAddr').value=_lastSentAddr;
  $('bookName').value='';
  renderBook();
  clr($('bookErr'));
  setTimeout(()=>{ try{ $('bookName').focus(); }catch(e){} }, 60);
}
async function evaluateSendSafety(){
  const warnEl=$('sendWarn');
  const to=$('sendTo').value.trim();
  const amt=parseInt($('sendAmt').value)||0;
  const notes=[];
  if(to){
    let valid=true; try{ bsv.Address.fromString(to); }catch(e){ valid=false; }
    // v4.1 — name recognition hints (strictly separated: dotted → SNS,
    // bare → OpNS; anything else with @ is refused at Send time)
    if(!valid){
      if(snsInputCandidate(to)){
        notes.push('This looks like an SNS name'+(to.includes('@')?' mailbox':'')+'. Press Send to resolve it via the signed SNS resolver — you confirm the verified holder address before anything is paid.');
      } else if(opnsNameCandidate(to)){
        notes.push('This looks like a bare OpNS name (no dot = not SNS). Press Send to resolve it — exact match only, and you confirm the verified holder address before anything is paid.');
      }
    }
    if(valid){
      if(to===_address) notes.push('This is your own active address — the coins will not leave this wallet.');
      else if(!bookLabelFor(to) && !_accounts.some(a=>a.address===to))
        notes.push('First time sending to this address. Double-check it character by character — BSV transfers cannot be reversed.');
      else { const lbl=bookLabelFor(to); if(lbl) notes.push('Recipient: "'+lbl+'" from your address book.'); }
    }
  }
  if(amt>0 && _lastKnownBalance!=null){
    const spendable=_lastKnownBalance-(sendMinerFee()+TOTAL_SERVICE_FEES);
    if(amt>=spendable && spendable>0) notes.push('This sends essentially your entire spendable balance.');
  }
  if(notes.length){ warnEl.innerHTML=notes.map(esc).join('<br>'); warnEl.style.display='flex'; }
  else { warnEl.style.display='none'; warnEl.innerHTML=''; }
}

/* clipboard paste with verification — defends against clipboard-hijack malware
   that swaps a copied address for the attacker's at paste time */
async function pasteToSend(){
  clr($('sendErr'));
  try{
    const txt=(await navigator.clipboard.readText()||'').trim();
    if(!txt){ err($('sendErr'),'Clipboard is empty.'); return; }
    // v4.1 — an SNS/OpNS name is also a valid paste target now
    if(!validAddress(txt) && !snsInputCandidate(txt) && !opnsNameCandidate(txt)){
      err($('sendErr'),'Clipboard does not contain a valid BSV address, SNS or OpNS name.'); return;
    }
    $('sendTo').value=txt;
    clearNameTargets(); updateSendConfirmUI();
    evaluateSendSafety();
  }catch(e){ err($('sendErr'),'Could not read the clipboard. Paste the address manually.'); }
}

/* =========================================================================
   v4.2 — UTXO tools (split & combine, iOS v2.3.0 parity)
   Both operate on the ordinal-protected UTXO set (1-sat inscriptions can
   never be spent here) and carry the ORDnet service fees like every other
   transaction. Two-tap confirm, errors inline.
   ========================================================================= */
let _utConfirm=null;   // 'split' | 'combine' | null
let _utStats={ count:0, total:0, largest:0 };

async function showUtxoTools(){
  showView('utxo');
  _utConfirm=null; updateUtxoUI();
  clr($('utErr')); const ok=$('utOk'); ok.className='alert alert-success'; ok.textContent='';
  $('utStats').innerHTML='<div class="empty-note">Loading…</div>';
  await refreshUtxoStats();
  updateSplitHint();
}
async function refreshUtxoStats(){
  try{
    const u=await getUTXOs(_address);
    _utStats={ count:u.length, total:u.reduce((a,x)=>a+x.satoshis,0), largest:u.reduce((a,x)=>Math.max(a,x.satoshis),0) };
    $('utStats').innerHTML=
      '<div class="kv"><span class="k">Count</span><span class="v">'+_utStats.count+'</span></div>'
      +'<div class="kv"><span class="k">Total</span><span class="v">'+bsvFmt(_utStats.total)+' BSV ('+_utStats.total.toLocaleString()+' sats)</span></div>'
      +'<div class="kv"><span class="k">Largest</span><span class="v">'+_utStats.largest.toLocaleString()+' sats</span></div>';
  }catch(e){
    _utStats={ count:0, total:0, largest:0 };
    $('utStats').innerHTML='<div class="empty-note">Could not load UTXOs: '+esc(e.message||e)+'</div>';
  }
}
function splitVals(){ return { n:parseInt($('utCount').value)||0, s:parseInt($('utSats').value)||0 }; }
function updateSplitHint(){
  const { n, s }=splitVals();
  $('utSplitHint').innerHTML=(n>=2 && s>=547)
    ? ('= '+(n*s).toLocaleString()+' sats into outputs + ~miner fee + '+bsvFmt(TOTAL_SERVICE_FEES)+' BSV service')
    : '&nbsp;';
}
function updateUtxoUI(){
  const sc=$('utSplitConfirm'), cc=$('utCombineConfirm');
  sc.classList.toggle('hidden', _utConfirm!=='split');
  cc.classList.toggle('hidden', _utConfirm!=='combine');
  if(_utConfirm==='split'){
    const { n, s }=splitVals();
    sc.innerHTML='<div class="kv" style="border:none;padding:0"><span class="k">Confirm</span><span class="v">'+n+' × '+s.toLocaleString()+' sats → your own address</span></div>';
  }
  if(_utConfirm==='combine'){
    cc.innerHTML='<div class="kv" style="border:none;padding:0"><span class="k">Confirm</span><span class="v">'+_utStats.count+' UTXOs → 1 output to your own address</span></div>';
  }
  $('utSplitBtn').textContent=_utConfirm==='split' ? 'Confirm & split' : 'Split…';
  $('utCombineBtn').textContent=_utConfirm==='combine' ? 'Confirm & combine' : 'Combine…';
}
async function doSplitTap(){
  clr($('utErr')); const ok=$('utOk'); ok.className='alert alert-success'; ok.textContent='';
  const { n, s }=splitVals();
  if(_utConfirm!=='split'){
    if(!(n>=2 && n<=200)){ err($('utErr'),'Choose between 2 and 200 UTXOs.'); return; }
    if(!(s>=547)){ err($('utErr'),'Each UTXO needs at least 547 sats (above dust).'); return; }
    const needed=n*s+TOTAL_SERVICE_FEES;
    if(_utStats.total<=needed){ err($('utErr'),'Insufficient spendable balance: this split needs ~'+needed.toLocaleString()+' sats + miner fee, you have '+_utStats.total.toLocaleString()+'.'); return; }
    _utConfirm='split'; updateUtxoUI(); return;
  }
  const btn=$('utSplitBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Splitting...';
  try{
    const outs=Array.from({length:n}, ()=>({ type:'p2pkh', address:_address, satoshis:s }));
    const tx=await buildTx({ outputs:outs });
    const txid=await broadcastAndRegister(tx);
    ok.textContent='Split done! '+n+' × '+s.toLocaleString()+' sats created. TXID: '+txid; ok.className='alert alert-success show';
    _utConfirm=null;
    await refreshUtxoStats();
  }catch(e){ err($('utErr'), e.message||'Split failed.'); }
  finally{ btn.disabled=false; updateUtxoUI(); }
}
/* ALL spendable (ordinal-protected) UTXOs into one output to self — port of
   the iOS engine's buildConsolidate */
async function buildConsolidateTx(){
  const pk=bsv.PrivateKey.fromWIF(_wif), from=pk.toAddress();
  const utxos=await getUTXOs(_address);
  if(!utxos.length) throw new Error('No spendable UTXOs to combine. Your balance may be locked in pending transactions.');
  if(utxos.length<2) throw new Error('Nothing to combine — you have only one spendable UTXO.');
  let total=0; utxos.forEach(u=>{ total+=u.satoshis; });
  const feeSat=Math.ceil((10 + utxos.length*148 + 34 + 11*34) * FEE_RATE);
  const out=total-feeSat-TOTAL_SERVICE_FEES;
  if(out<546) throw new Error('Combined balance too small to cover fee + service fee (needs at least '+(feeSat+TOTAL_SERVICE_FEES+546)+' sats).');
  const tx=new bsv.Transaction();
  utxos.forEach(u=>tx.from(new bsv.Transaction.UnspentOutput({ txid:u.txid, outputIndex:u.vout, address:from, script:u.scriptPubKey||u.script, satoshis:u.satoshis })));
  tx.to(from, out);
  addServiceFees(tx);
  tx.fee(feeSat); tx.sign(pk);
  return { tx, outputSat:out };
}
async function doCombineTap(){
  clr($('utErr')); const ok=$('utOk'); ok.className='alert alert-success'; ok.textContent='';
  if(_utConfirm!=='combine'){
    if(_utStats.count<2){ err($('utErr'),'Nothing to combine — you have '+_utStats.count+' spendable UTXO'+(_utStats.count===1?'':'s')+'.'); return; }
    _utConfirm='combine'; updateUtxoUI(); return;
  }
  const btn=$('utCombineBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Combining...';
  try{
    const { tx, outputSat }=await buildConsolidateTx();
    const txid=await broadcastAndRegister(tx);
    ok.textContent='Combined into one UTXO of '+outputSat.toLocaleString()+' sats. TXID: '+txid; ok.className='alert alert-success show';
    _utConfirm=null;
    await refreshUtxoStats();
  }catch(e){ err($('utErr'), e.message||'Combine failed.'); }
  finally{ btn.disabled=false; updateUtxoUI(); }
}

/* =========================================================================
   v4.2 — Upload & Inscribe (iOS Upload tab parity, v2.6.2 layout)
   Inscribe images (JPEG/PNG/GIF/WebP), text and HTML as 1Sat Ordinals —
   identical envelope + ORDnet.io OP_RETURN + fees as the existing inscribe
   path. Image compression via canvas (JPEG/PNG sources only; compression
   can never make the file bigger). Per-wallet inscription log.
   ========================================================================= */
const INSCRIPTIONS_KEY='ordnet_inscriptions_v1';
let _inscriptions={};          // { address: [{txid,name,contentType,size,ts}] } newest first
let _upOriginal=null;          // Uint8Array of the ORIGINAL file
let _upData=null;              // Uint8Array actually inscribed (after compression)
let _upCT='', _upOriginalCT='', _upName='';
let _upTextMode='text';

async function loadInscriptions(){ _inscriptions=(await storageGet(INSCRIPTIONS_KEY))||{}; }
function logInscription(rec){
  const list=_inscriptions[_address]||[];
  list.unshift(rec);
  _inscriptions[_address]=list;
  storageSet({ [INSCRIPTIONS_KEY]: _inscriptions });
}
function showUpload(){
  showView('upload');
  clr($('upErr'));
  loadInscriptions();
}
function upSizeLabel(n){
  if(n>=1048576) return (n/1048576).toFixed(2)+' MB';
  if(n>=1024) return (n/1024).toFixed(1)+' KB';
  return n+' B';
}
function upSniffCT(name, mime){
  const m=String(mime||'').toLowerCase();
  if(m && m!=='application/octet-stream') return m;
  const ext=String(name||'').toLowerCase().split('.').pop();
  return { jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', gif:'image/gif', webp:'image/webp',
           txt:'text/plain', html:'text/html', htm:'text/html' }[ext]||'application/octet-stream';
}
function upRefreshSelected(){
  if(!_upData){ $('upSelected').classList.add('hidden'); return; }
  $('upSelected').classList.remove('hidden');
  $('upName').textContent=_upName;
  $('upType').textContent=_upCT;
  const q=parseInt($('upQuality').value,10);
  $('upSize').textContent=(_upData.length===_upOriginal.length)
    ? upSizeLabel(_upData.length)
    : upSizeLabel(_upOriginal.length)+' → '+upSizeLabel(_upData.length);
  $('upQualityLabel').textContent=(q>=100)?'Original':(q+'% · '+upSizeLabel(_upOriginal.length)+' → '+upSizeLabel(_upData.length));
  $('upFees').textContent='~'+inscribeMinerFee(_upData.length).toLocaleString()+' sats network + '+TOTAL_SERVICE_FEES.toLocaleString()+' sats service';
  if(_upCT.startsWith('image/')){
    $('upPreviewWrap').classList.remove('hidden');
    $('upPreview').src='data:'+_upCT+';base64,'+ordU8b64(_upData);
  } else $('upPreviewWrap').classList.add('hidden');
}
async function upOnFile(e){
  clr($('upErr'));
  const f=e.target.files && e.target.files[0];
  if(!f) return;
  if(f.size>100*1048576){ err($('upErr'),'File too large — the limit is 100MB, like the ORDnet HTML tools.'); return; }
  const buf=new Uint8Array(await f.arrayBuffer());
  _upOriginal=buf; _upData=buf;
  _upCT=upSniffCT(f.name, f.type); _upOriginalCT=_upCT; _upName=f.name;
  // compression is offered for JPEG/PNG sources (GIF/WebP stay untouched —
  // recompressing would break animation/alpha)
  const compressible=(_upCT==='image/jpeg'||_upCT==='image/png');
  $('upCompressWrap').classList.toggle('hidden', !compressible);
  $('upQuality').value='100';
  upRefreshSelected();
}
/* re-encode the ORIGINAL image at the chosen quality; never let
   "compression" make the file bigger than the original */
function upApplyCompression(){
  const q=parseInt($('upQuality').value,10);
  if(q>=100 || !_upOriginal || !(_upOriginalCT==='image/jpeg'||_upOriginalCT==='image/png')){
    _upData=_upOriginal; _upCT=_upOriginalCT; upRefreshSelected(); return;
  }
  const img=new Image();
  img.onload=()=>{
    const cv=document.createElement('canvas');
    cv.width=img.naturalWidth; cv.height=img.naturalHeight;
    cv.getContext('2d').drawImage(img, 0, 0);
    cv.toBlob(async b=>{
      if(!b){ _upData=_upOriginal; _upCT=_upOriginalCT; upRefreshSelected(); return; }
      const out=new Uint8Array(await b.arrayBuffer());
      if(out.length>=_upOriginal.length){ _upData=_upOriginal; _upCT=_upOriginalCT; }
      else { _upData=out; _upCT='image/jpeg'; }
      upRefreshSelected();
    }, 'image/jpeg', q/100);
  };
  img.onerror=()=>{ _upData=_upOriginal; _upCT=_upOriginalCT; upRefreshSelected(); };
  img.src='data:'+_upOriginalCT+';base64,'+ordU8b64(_upOriginal);
}
async function upInscribeSelected(){
  clr($('upErr'));
  if(!_upData){ err($('upErr'),'Pick a file first.'); return; }
  await upInscribe(_upCT, _upData, _upName, $('upInscribeBtn'));
}
function upTextInfo(){
  const t=$('upText').value;
  const bytes=new TextEncoder().encode(t);
  const ct=_upTextMode==='html'?'text/html':'text/plain';
  return { bytes, ct };
}
function upUpdateTextHint(){
  const { bytes }=upTextInfo();
  $('upTextHint').innerHTML=bytes.length
    ? (upSizeLabel(bytes.length)+' · ~'+inscribeMinerFee(bytes.length).toLocaleString()+' sats network + '+TOTAL_SERVICE_FEES.toLocaleString()+' sats service')
    : '&nbsp;';
}
async function upInscribeText(){
  clr($('upErr'));
  const { bytes, ct }=upTextInfo();
  if(!bytes.length){ err($('upErr'),'Type or paste something first.'); return; }
  await upInscribe(ct, bytes, (_upTextMode==='html'?'typed.html':'typed.txt'), $('upTextBtn'));
}
async function upInscribe(ct, bytes, name, btn){
  btn.disabled=true; const ol=btn.textContent; btn.innerHTML='<span class="spinner"></span> Inscribing...';
  try{
    const tx=await buildInscribe(ct, bytes);
    const txid=await broadcastAndRegister(tx);
    logInscription({ txid, name, contentType:ct, size:bytes.length, ts:Date.now() });
    // v2.6.1 — persistent success section (survives the file-section reset)
    $('upSuccess').classList.remove('hidden');
    $('upSuccessTxid').textContent=txid;
    // reset the file section
    _upOriginal=null; _upData=null; _upCT=''; _upName='';
    try{ $('upFile').value=''; }catch(_){}
    $('upSelected').classList.add('hidden');
  }catch(e){ err($('upErr'), e.message||'Inscribe failed.'); }
  finally{ btn.disabled=false; btn.textContent=ol; }
}

/* =========================================================================
   v4.2 — ORD/ner: on-chain file browser (iOS v2.3.0/v2.6.1 parity)
   Every inscription the address currently holds, from the 1Sat index at
   ordinals.gorillapool.io (paged, max 500). Thumbnails via our OWN path:
   raw tx hex (cached) + envelope parse — never a third-party content
   endpoint. Index down → degrades inline to the app's own inscription log.
   ========================================================================= */
const ORDNER_API='https://ordinals.gorillapool.io/api';
let _onFiles=[];      // [{originTxid,originVout,currentTxid,currentVout,contentType,size,height,held,name}]
let _onView='grid';   // 'grid' | 'list'
let _onHideSent=false;
let _onSel=null;
let _onIdxOk=true;

async function showOrdner(){
  showView('ordner');
  $('onViewToggle').innerHTML=(_onView==='grid')?ICONS.listIcon:ICONS.grid;
  $('onList').innerHTML='<div class="empty-note">Loading…</div>';
  await loadInscriptions();
  await loadOrdnerFiles();
  renderOrdner();
}
async function fetchOrdnerIndex(address){
  const out=[];
  let offset=0;
  for(let page=0; page<5; page++){
    const r=await fetch(`${ORDNER_API}/txos/address/${address}/unspent?limit=100&offset=${offset}`);
    if(!r.ok) throw new Error('the 1Sat index at ordinals.gorillapool.io is unreachable');
    const arr=await r.json();
    if(!Array.isArray(arr)) throw new Error('the 1Sat index at ordinals.gorillapool.io is unreachable');
    for(const item of arr){
      const origin=item && item.origin;
      const insc=origin && origin.data && origin.data.insc;
      if(!insc) continue;   // same filter as ord-app v42: only real inscriptions
      const oOut=String(origin.outpoint||'').split('_');
      const cOut=String(item.outpoint||'').split('_');
      if(!oOut[0]||!cOut[0]) continue;
      const file=insc.file||{};
      out.push({
        originTxid:oOut[0], originVout:parseInt(oOut[1],10)||0,
        currentTxid:cOut[0], currentVout:parseInt(cOut[1],10)||0,
        contentType:String(file.type||'unknown'), size:parseInt(file.size,10)||0,
        height:item.height||null, held:true, name:null
      });
    }
    if(arr.length<100) break;
    offset+=100;
  }
  return out;
}
async function loadOrdnerFiles(){
  let files=[];
  try{
    files=await fetchOrdnerIndex(_address);
    _onIdxOk=true;
  }catch(e){ _onIdxOk=false; }
  // merge the app's own inscription log: names for held items, and items the
  // address no longer holds shown with a "sent" label (v2.3.0)
  const log=_inscriptions[_address]||[];
  const heldByOrigin={};
  files.forEach(f=>{ heldByOrigin[f.originTxid]=f; });
  for(const rec of log){
    const held=heldByOrigin[rec.txid];
    if(held){ held.name=rec.name; }
    else if(_onIdxOk){
      files.push({ originTxid:rec.txid, originVout:0, currentTxid:rec.txid, currentVout:0,
                   contentType:rec.contentType, size:rec.size, height:null, held:false, name:rec.name });
    }
  }
  if(!_onIdxOk){
    // degrade inline to the app's own log
    files=log.map(rec=>({ originTxid:rec.txid, originVout:0, currentTxid:rec.txid, currentVout:0,
                          contentType:rec.contentType, size:rec.size, height:null, held:true, name:rec.name }));
  }
  _onFiles=files;
}
function ordnerTypeIcon(ct){
  if(String(ct).startsWith('image/')) return _svg('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>', 18);
  if(String(ct).startsWith('text/html')) return _svg('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>', 18);
  if(String(ct).startsWith('text/')) return _svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>', 18);
  return _svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>', 18);
}
function ordnerLabel(f){
  if(f.name) return f.name;
  const ext=({'image/jpeg':'jpg','image/png':'png','image/gif':'gif','image/webp':'webp','text/plain':'txt','text/html':'html'})[f.contentType];
  return f.originTxid.slice(0,8)+'…'+(ext?('.'+ext):'');
}
function ordnerVisible(){
  return _onFiles.filter(f=>f.held || !_onHideSent);
}
function renderOrdner(){
  const list=$('onList');
  const files=ordnerVisible();
  const sent=_onFiles.filter(f=>!f.held).length;
  $('onSubtitle').textContent=(_onIdxOk?String(_onFiles.filter(f=>f.held).length)+' on-chain files':'index unavailable — own log only');
  $('onIndexNote').classList.toggle('hidden', _onIdxOk);
  if(!_onIdxOk) $('onIndexNote').textContent='Could not reach the 1Sat index at ordinals.gorillapool.io — showing only the files inscribed with this wallet.';
  $('onSentCount').textContent=sent?(sent+' sent item'+(sent===1?'':'s')):'';
  $('onHideSent').classList.toggle('hidden', !sent);
  $('onHideSent').textContent=_onHideSent?'Show sent items':'Hide sent items';
  if(!files.length){
    list.innerHTML='<div class="empty-note">'+(_onIdxOk?'No on-chain files on this address yet. Inscribe one via the Upload tab!':'Nothing inscribed with this wallet yet.')+'</div>';
    return;
  }
  if(_onView==='grid'){
    list.innerHTML='<div class="ordner-grid">'+files.map((f,i)=>`
      <div class="ordner-cell" data-of="${_onFiles.indexOf(f)}">
        <div class="thumb" data-thumb="${esc(f.originTxid)}_${f.originVout}">${ordnerTypeIcon(f.contentType)}</div>
        <div class="fn">${esc(ordnerLabel(f))}${f.held?'':' ·sent'}</div>
      </div>`).join('')+'</div>';
  } else {
    list.innerHTML=files.map(f=>`
      <div class="ordner-row" data-of="${_onFiles.indexOf(f)}">
        <div class="thumb" data-thumb="${esc(f.originTxid)}_${f.originVout}">${ordnerTypeIcon(f.contentType)}</div>
        <div class="m"><div class="fn">${esc(ordnerLabel(f))}</div><div class="fs">${esc(f.contentType)}${f.size?' · '+upSizeLabel(f.size):''}</div></div>
        ${f.held?'':'<span class="sent-pill">sent</span>'}
      </div>`).join('');
  }
  loadOrdnerThumbs(files);
}
/* thumbnails: images render via raw hex + envelope parse (tx hex is cached
   in fetchTxHexRetry, so a folder of items from one claim costs one fetch) */
async function loadOrdnerThumbs(files){
  const imgs=files.filter(f=>f.contentType.startsWith('image/')).slice(0,30);
  for(const f of imgs){
    const sel='[data-thumb="'+f.originTxid+'_'+f.originVout+'"]';
    try{
      const hex=await fetchTxHexRetry(f.originTxid);
      const ord=extractOrd(hex, f.originVout)||extractFirstOrd(hex);
      if(!ord||!ord.ct.startsWith('image/')) continue;
      document.querySelectorAll(sel).forEach(el=>{ el.innerHTML='<img src="data:'+ord.ct+';base64,'+ord.dataB64+'">'; });
    }catch(_){ /* thumb stays a type icon */ }
  }
}
function showOrdFile(idx){
  const f=_onFiles[idx]; if(!f) return;
  _onSel=f;
  showView('ordfile');
  clr($('ofErr')); const cp=$('ofCopied'); cp.className='alert alert-success'; cp.textContent='';
  $('ofTitle').textContent=ordnerLabel(f);
  $('ofSubtitle').textContent=f.held?'held by this address':'sent — no longer on this address';
  $('ofType').textContent=f.contentType;
  $('ofSize').textContent=f.size?upSizeLabel(f.size):'—';
  $('ofTxid').textContent=f.currentTxid.slice(0,10)+'…'+f.currentTxid.slice(-6);
  $('ofOrigin').textContent=f.originTxid.slice(0,10)+'…'+f.originTxid.slice(-6)+'_'+f.originVout;
  $('ofCurrent').textContent=f.currentTxid.slice(0,10)+'…'+f.currentTxid.slice(-6)+'_'+f.currentVout;
  $('ofSendBtn').classList.toggle('hidden', !f.held);
  const pw=$('ofPreviewWrap'); pw.classList.add('hidden'); pw.innerHTML='';
  (async()=>{
    try{
      const hex=await fetchTxHexRetry(f.originTxid);
      const ord=extractOrd(hex, f.originVout)||extractFirstOrd(hex);
      if(!ord) return;
      if(ord.ct.startsWith('image/')){
        pw.innerHTML='<img src="data:'+ord.ct+';base64,'+ord.dataB64+'" style="max-width:100%;max-height:200px;border-radius:8px">';
        pw.classList.remove('hidden');
      } else if(ord.ct.startsWith('text/')){
        const text=atob(ord.dataB64);
        pw.innerHTML='<pre style="text-align:left;font-size:10.5px;max-height:160px;overflow:auto;white-space:pre-wrap;word-break:break-word">'+esc(text.slice(0,2000))+'</pre>';
        pw.classList.remove('hidden');
      }
    }catch(_){ /* preview unavailable — detail rows still work */ }
  })();
}
/* v2.6.1 — one tap copies the FULL value, with inline "copied ✓" */
async function ofCopy(value, label){
  try{
    await navigator.clipboard.writeText(value);
    const cp=$('ofCopied'); cp.textContent=label+' copied ✓'; cp.className='alert alert-success show';
    setTimeout(()=>{ cp.className='alert alert-success'; cp.textContent=''; }, 1600);
  }catch(_){ err($('ofErr'),'Could not copy — copy it manually.'); }
}
function ofCopyAll(){
  const f=_onSel; if(!f) return;
  let info='Name: '+ordnerLabel(f)
    +'\nContent-Type: '+f.contentType+'\nSize: '+(f.size?upSizeLabel(f.size):'—')
    +'\nTXID: '+f.currentTxid
    +'\nOrigin: '+f.originTxid+'_'+f.originVout
    +'\nCurrent UTXO: '+f.currentTxid+'_'+f.currentVout;
  ofCopy(info, 'All info');
}
function ofSend(){
  const f=_onSel; if(!f||!f.held) return;
  startSendOrdinalItem({ kind:'ordfile', name:ordnerLabel(f), status:'held',
                         currentTxid:f.currentTxid, currentVout:f.currentVout });
}

/* =========================================================================
   v4.2 — BRC-100 provider, popup side (iOS v2.4.0–v2.6.0 parity)
   Fase 1 is answered in the background worker (no keys). Fase 2 (keys &
   crypto via the bundled @bsv/sdk ProtoWallet, behind BRC-43 grants) and
   fase 3 (money: createAction c.s., per-transaction confirm — money ≠
   grant) run here, where the unlocked key lives. Keys never reach the page:
   the page only sees the key-free window.CWI shim.
   ========================================================================= */
const BRC100_PHASE2=['getPublicKey','encrypt','decrypt','createSignature','verifySignature','createHmac','verifyHmac'];
let _pendingBrc100=null;

function brc100Err(name, code, message){ const e=new Error(message); e.name=name; e.code=code; return e; }
function _sdk(){
  const S=(typeof globalThis!=='undefined' && globalThis.BSVSDK)||null;
  if(!S) throw brc100Err('WERR_UNKNOWN', 1, 'BRC-100 engine bundle (BSVSDK) is not loaded.');
  return S;
}
let _brc100Wallet=null, _brc100Wif=null;
function brc100InitWallet(){
  if(_brc100Wallet && _brc100Wif===_wif) return _brc100Wallet;
  const S=_sdk();
  _brc100Wallet=new S.ProtoWallet(S.PrivateKey.fromWif(_wif));
  _brc100Wif=_wif;
  return _brc100Wallet;
}
function brc100ResetWallet(){ _brc100Wallet=null; _brc100Wif=null; }

/* BRC-43 grants: level 0 open; level 1 per app+protocol; level 2 +
   counterparty; the identity key has its own per-app grant. */
async function brc100RequirePermission(origin, method, args){
  const isIdentity=(method==='getPublicKey' && args.identityKey===true);
  let level=0, protocolName='—';
  if(Array.isArray(args.protocolID) && args.protocolID.length===2){
    level=parseInt(args.protocolID[0],10)||0;
    protocolName=String(args.protocolID[1]||'—');
  }
  const counterparty=String(args.counterparty||'self');
  if(!isIdentity && level===0) return;   // level 0: open protocol
  const grantKey=isIdentity
    ? `${_address}|${origin}|identity`
    : `${_address}|${origin}|${level}|${protocolName}${level>=2?('|'+counterparty):''}`;
  if(_brc100Grants.includes(grantKey)) return;
  const titles={ getPublicKey:(isIdentity?'Share identity key':'Share a derived public key'),
    encrypt:'Encrypt data', decrypt:'Decrypt data', createSignature:'Create a signature',
    verifySignature:'Verify a signature', createHmac:'Create an HMAC', verifyHmac:'Verify an HMAC' };
  const title=titles[method]||method;
  let detail=isIdentity
    ? 'The app asks for your identity key (a public key that identifies this wallet to the app).'
    : 'Protocol: '+protocolName+' · security level '+level;
  if(!isIdentity && level>=2) detail+='\nCounterparty: '+counterparty.slice(0,10)+'…'+counterparty.slice(-6);
  const approved=await new Promise(res=>{
    showView('brc100perm');
    $('bpIcon').innerHTML=ICONS.key;
    $('bpTitle').textContent=title;
    $('bpOrigin').textContent=origin||'unknown app';
    $('bpDetail').textContent=detail;
    $('bpAllow').onclick=()=>res(true);
    $('bpDeny').onclick=()=>res(false);
  });
  if(!approved) throw brc100Err('WERR_PERMISSION_DENIED', 1, 'The user denied '+title.toLowerCase()+' for '+origin+'.');
  _brc100Grants.push(grantKey);
  await saveBrc100Grants();
}
/* per-transaction confirm (fase 3): money ≠ grant, nothing persists */
async function brc100RequireTxConfirm(opts){
  // V45 — per-app daily budget: wallet-built OUTGOING payments within the
  // origin's remaining allowance auto-approve; everything else confirms.
  // dApp-built signAction never routes through here with a budget (policy).
  const _rate=await getUsdRate();
  const _budgets=await loadBudgets();
  const BE=globalThis.OrdplugBudget;
  if(BE && !opts.incoming && opts.origin && typeof opts.total==='number'){
    const d=BE.decide(_budgets, opts.origin, opts.total, _rate, Date.now());
    if(d.autoApprove){
      BE.recordSpend(_budgets, opts.origin, d.amountUsd, Date.now());
      await saveBudgets(_budgets);
      return; // within the user-granted daily allowance: no popup friction
    }
  }
  const approved=await new Promise(res=>{
    showView('brc100tx');
    $('btIcon').innerHTML=opts.incoming?ICONS.bag:ICONS.sendBig;
    $('btTitle').textContent=opts.title;
    $('btOrigin').textContent=opts.origin||'unknown app';
    $('btDesc').textContent=opts.description||'';
    $('btLines').innerHTML=opts.lines.map(l=>
      '<div class="kv"><span class="k" style="max-width:55%;overflow:hidden;text-overflow:ellipsis">'+esc(l.dest)+'</span><span class="v">'+l.sats.toLocaleString()+' sats'+(l.note?('<br><small style="color:var(--text-secondary)">'+esc(l.note)+'</small>'):'')+'</span></div>').join('');
    $('btMiner').textContent=opts.incoming?'—':('~'+opts.miner.toLocaleString()+' sats');
    $('btService').textContent=opts.incoming?'—':(opts.service.toLocaleString()+' sats');
    $('btTotal').textContent=opts.total.toLocaleString()+' sats ('+bsvFmt(opts.total)+' BSV)'+usdFmt(globalThis.OrdplugBudget?globalThis.OrdplugBudget.satsToUsd(opts.total,_rate):null);
    // V45 — offer a daily allowance grant on outgoing confirms (default $10,
    // adjustable, revocable by unticking on a later confirm).
    const bEl=document.createElement('div');
    if(!opts.incoming && opts.origin){
      const cur=globalThis.OrdplugBudget?globalThis.OrdplugBudget.getBudget(_budgets,opts.origin):null;
      bEl.style.cssText='font-size:12px;color:var(--text-secondary);margin-top:8px';
      bEl.innerHTML='<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="btBudgetChk"'+(cur?' checked':'')+'> Allow up to $<input id="btBudgetAmt" type="number" min="1" max="1000" value="'+(cur?cur.limitUsd:10)+'" style="width:52px"> per day for this app without asking</label>';
      $('btLines').appendChild(bEl);
    }
    $('btApprove').onclick=()=>res(true);
    $('btReject').onclick=()=>res(false);
  });
  if(!approved) throw brc100Err('WERR_PERMISSION_DENIED', 1, 'The user rejected the transaction for '+opts.origin+'.');
  // Persist the allowance choice made on this confirm (approve only).
  try{
    const chk=document.getElementById('btBudgetChk'), amt=document.getElementById('btBudgetAmt');
    if(chk && globalThis.OrdplugBudget && opts.origin){
      if(chk.checked){
        globalThis.OrdplugBudget.setLimit(_budgets, opts.origin, Math.min(1000,Math.max(1,parseFloat(amt&&amt.value)||10)), Date.now());
        // the payment just approved counts toward today's allowance
        if(typeof opts.total==='number'&&_rate) globalThis.OrdplugBudget.recordSpend(_budgets, opts.origin, globalThis.OrdplugBudget.satsToUsd(opts.total,_rate)||0, Date.now());
      } else { globalThis.OrdplugBudget.setLimit(_budgets, opts.origin, null, Date.now()); }
      await saveBudgets(_budgets);
    }
  }catch(_){ }
}

/* ---- fase 3 engine (port of iOS wallet-core.js, adapted to the plugin's builders) ---- */
function _werr(name, code, message){ return { valid:false, werr:{ name, code, message } }; }
function _validDesc(s){ return typeof s==='string' && s.length>=5 && s.length<=2000; }
function _validLabel(s){ return typeof s==='string' && s.length>=1 && s.length<=300; }
function _validHexScript(h){
  if(typeof h!=='string' || !h.length || h.length%2 || /[^0-9a-fA-F]/.test(h)) return false;
  try{ bsv.Script.fromHex(h); return true; }catch(e){ return false; }
}
/* createAction argument validation + normalisation (pure, deterministic,
   covered in tests). Regel 1: outputs-only — custom inputs refuse explicitly
   until the signableTransaction path really exists. */
function brc100ValidateCreate(argsJson){
  let a; try{ a=typeof argsJson==='string'?JSON.parse(argsJson):(argsJson||{}); }
  catch(e){ return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: args must be valid JSON.'); }

  if(a.inputs && a.inputs.length)
    return _werr('WERR_UNSUPPORTED_ACTION', 2, 'createAction with custom inputs (signableTransaction) is not supported yet by the ORDnet wallet — outputs-only actions are.');
  if(a.inputBEEF && a.inputBEEF.length)
    return _werr('WERR_UNSUPPORTED_ACTION', 2, 'createAction: inputBEEF requires the signableTransaction path, which is not supported yet.');
  if(a.lockTime!==undefined && a.lockTime!==0)
    return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: custom lockTime is not supported.');
  if(a.version!==undefined && a.version!==1)
    return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: custom version is not supported.');
  if(!_validDesc(a.description))
    return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: description must be a string of 5..2000 characters.');

  const o=a.options||{};
  if(o.noSend===true)
    return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: options.noSend is not supported — this wallet broadcasts processed actions directly.');
  if(o.sendWith && o.sendWith.length)
    return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: options.sendWith batching is not supported.');
  if(o.signAndProcess===false)
    return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: options.signAndProcess=false requires the signableTransaction path, which is not supported yet.');
  if(o.trustSelf!==undefined || (o.knownTxids && o.knownTxids.length) || o.noSendChange!==undefined)
    return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: options trustSelf/knownTxids/noSendChange are not supported.');

  if(!Array.isArray(a.outputs) || !a.outputs.length)
    return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: outputs[] is required (at least one output).');
  if(a.outputs.length>SENDTX_MAX_OUTPUTS)
    return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: too many outputs (max '+SENDTX_MAX_OUTPUTS+').');

  const outs=[]; let total=0;
  for(let i=0;i<a.outputs.length;i++){
    const out=a.outputs[i]||{};
    if(out.basket!==undefined)
      return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: output baskets are not tracked by this wallet (output '+i+').');
    if(!_validHexScript(out.lockingScript))
      return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: output '+i+' needs a valid lockingScript (hex).');
    const sats=satNum(out.satoshis);
    if(sats<1)
      return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: output '+i+' needs satoshis >= 1 (0-sat outputs are rejected as dust).');
    if(!_validDesc(out.outputDescription))
      return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: output '+i+' needs an outputDescription of 5..2000 characters.');
    let tags=[];
    if(out.tags!==undefined){
      if(!Array.isArray(out.tags) || !out.tags.every(_validLabel))
        return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: output '+i+' tags must be strings of 1..300 characters.');
      tags=out.tags.map(t=>String(t).toLowerCase());
    }
    const dest=scriptLockAddress(String(out.lockingScript));
    outs.push({ satoshis:sats, lockingScript:String(out.lockingScript).toLowerCase(),
                outputDescription:String(out.outputDescription), tags, dest:dest||null });
    total+=sats;
  }
  let labels=[];
  if(a.labels!==undefined){
    if(!Array.isArray(a.labels) || !a.labels.every(_validLabel))
      return _werr('WERR_INVALID_PARAMETER', 3, 'createAction: labels must be strings of 1..300 characters.');
    labels=a.labels.map(l=>String(l).toLowerCase());
  }
  const outBytes=outs.reduce((s,x)=>s+12+Math.ceil(x.lockingScript.length/2), 0);
  const feeEstimate=Math.ceil((10 + 148 + outBytes + 11*34 + 34) * FEE_RATE);
  return { valid:true, description:String(a.description), labels, outputs:outs, totalSat:total,
           serviceFees:TOTAL_SERVICE_FEES, minerFeeEstimate:feeEstimate,
           returnTXIDOnly:o.returnTXIDOnly===true, randomizeOutputs:o.randomizeOutputs!==false };
}
function brc100RequireValid(r){
  if(r.valid===true) return r;
  const w=r.werr||{};
  throw brc100Err(w.name||'WERR_INVALID_PARAMETER', w.code||3, w.message||'Invalid parameters.');
}
/* internalizeAction: AtomicBEEF from the app → only 'wallet payment' outputs
   that pay the wallet address DIRECTLY (BRC-29 derived payments and 'basket
   insertion' refuse explicitly). */
function brc100ParseInternalize(argsJson, walletAddress){
  let a; try{ a=typeof argsJson==='string'?JSON.parse(argsJson):(argsJson||{}); }
  catch(e){ return _werr('WERR_INVALID_PARAMETER', 3, 'internalizeAction: args must be valid JSON.'); }
  if(!_validDesc(a.description))
    return _werr('WERR_INVALID_PARAMETER', 3, 'internalizeAction: description must be a string of 5..2000 characters.');
  if(!Array.isArray(a.tx) || !a.tx.length)
    return _werr('WERR_INVALID_PARAMETER', 3, 'internalizeAction: tx must be the AtomicBEEF byte array of the transaction.');
  if(!Array.isArray(a.outputs) || !a.outputs.length)
    return _werr('WERR_INVALID_PARAMETER', 3, 'internalizeAction: outputs[] is required.');
  const S=_sdk(); let tx;
  try{ tx=S.Transaction.fromAtomicBEEF(a.tx); }
  catch(e){ return _werr('WERR_INVALID_PARAMETER', 3, 'internalizeAction: tx is not valid AtomicBEEF: '+((e&&e.message)||e)); }
  const rawtx=tx.toHex();
  const txid=new bsv.Transaction(rawtx).id;
  const lockHex=bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(walletAddress)).toHex().toLowerCase();
  const accepted=[]; let total=0;
  for(let i=0;i<a.outputs.length;i++){
    const o=a.outputs[i]||{};
    const vout=Number(o.outputIndex);
    if(!Number.isInteger(vout) || vout<0 || vout>=tx.outputs.length)
      return _werr('WERR_INVALID_PARAMETER', 3, 'internalizeAction: outputIndex '+o.outputIndex+' does not exist in the transaction.');
    if(o.protocol==='basket insertion')
      return _werr('WERR_INVALID_PARAMETER', 3, 'internalizeAction: basket insertion is not supported — this wallet does not track custom baskets.');
    if(o.protocol!=='wallet payment')
      return _werr('WERR_INVALID_PARAMETER', 3, 'internalizeAction: unknown protocol for output '+vout+' (expected "wallet payment").');
    const txo=tx.outputs[vout];
    const scriptHex=txo.lockingScript.toHex().toLowerCase();
    if(scriptHex!==lockHex)
      return _werr('WERR_INVALID_PARAMETER', 3, 'internalizeAction: output '+vout+' does not pay this wallet\'s address directly — BRC-29 derived payments are not supported yet.');
    const sats=satNum(txo.satoshis);
    accepted.push({ vout, satoshis:sats });
    total+=sats;
  }
  return { valid:true, txid, rawtx, outputs:accepted, totalSat:total };
}
/* listOutputs over the live (ordinal-protected) UTXO set — only the
   'default' basket exists; everything else refuses explicitly. */
function brc100ListOutputsCalc(utxos, argsJson){
  let a; try{ a=typeof argsJson==='string'?JSON.parse(argsJson):(argsJson||{}); }
  catch(e){ return _werr('WERR_INVALID_PARAMETER', 3, 'listOutputs: args must be valid JSON.'); }
  const basket=a.basket===undefined?'default':a.basket;
  if(basket!=='default')
    return _werr('WERR_INVALID_PARAMETER', 3, 'listOutputs: basket "'+basket+'" is not tracked by this wallet — only "default" (the spendable funding outputs) exists.');
  if(a.tags && a.tags.length)
    return _werr('WERR_INVALID_PARAMETER', 3, 'listOutputs: output tags are not tracked by this wallet.');
  if(a.include==='entire transactions')
    return _werr('WERR_INVALID_PARAMETER', 3, 'listOutputs: include="entire transactions" (BEEF) is not supported yet — use "locking scripts".');
  const withScripts=a.include==='locking scripts';
  const limit=Number.isInteger(a.limit)&&a.limit>0?Math.min(a.limit,10000):10;
  const offset=Number.isInteger(a.offset)&&a.offset>0?a.offset:0;
  const page=utxos.slice(offset, offset+limit);
  return { valid:true, totalOutputs:utxos.length,
    outputs:page.map(u=>{
      const out={ outpoint:u.txid+'.'+u.vout, satoshis:satNum(u.satoshis), spendable:true };
      if(withScripts) out.lockingScript=String(u.script||u.scriptPubKey||'');
      return out;
    }) };
}

/* ---- fase 3 flows (popup) ---- */
async function brc100CreateAction(argsJson, origin){
  const v=brc100RequireValid(brc100ValidateCreate(argsJson));
  await brc100RequireTxConfirm({
    origin, title:'Approve payment', description:v.description, incoming:false,
    lines:v.outputs.map(o=>({ dest:o.dest||'script output (not an address)', sats:o.satoshis, note:o.outputDescription })),
    miner:v.minerFeeEstimate, service:v.serviceFees, total:v.totalSat
  });
  const outs=v.outputs.slice();
  if(v.randomizeOutputs && outs.length>1){          // BRC-100 privacy rule
    for(let i=outs.length-1;i>0;i--){
      const r=new Uint8Array(1); crypto.getRandomValues(r);
      const j=r[0]%(i+1); const t=outs[i]; outs[i]=outs[j]; outs[j]=t;
    }
  }
  let tx;
  try{
    tx=await buildTx({ outputs:outs.map(o=>({ type:'script', satoshis:o.satoshis, scriptHex:o.lockingScript })) });
  }catch(e){ throw brc100Err('WERR_INSUFFICIENT_FUNDS', 5, e.message||String(e)); }
  let txid;
  try{ txid=await broadcastAndRegister(tx); }
  catch(e){ throw brc100Err('WERR_UNKNOWN', 1, 'Broadcast failed: '+(e.message||e)); }
  brc100LogAction({ txid, description:v.description, labels:v.labels, satoshis:v.totalSat,
                    origin, ts:Date.now(), status:'completed', isOutgoing:true });
  return { txid };   // CreateActionResult: tx (BEEF) follows in a later fase
}
async function brc100InternalizeAction(argsJson, origin){
  const v=brc100RequireValid(brc100ParseInternalize(argsJson, _address));
  const desc=(()=>{ try{ return JSON.parse(argsJson).description||''; }catch(_){ return ''; } })();
  await brc100RequireTxConfirm({
    origin, title:'Accept incoming payment', description:desc, incoming:true,
    lines:v.outputs.map(o=>({ dest:_address.slice(0,8)+'… (this wallet)', sats:o.satoshis, note:'incoming payment output '+o.vout })),
    miner:0, service:0, total:v.totalSat
  });
  try{
    await broadcastAndRegister({ toString:()=>v.rawtx });
  }catch(e){
    // an already-known transaction is NOT an error: the payment exists on-chain
    const m=String(e.message||e).toLowerCase();
    if(!(m.includes('already')||m.includes('txn-mempool-conflict')||m.includes('257')))
      throw brc100Err('WERR_UNKNOWN', 1, 'Broadcast failed: '+(e.message||e));
  }
  brc100LogAction({ txid:v.txid, description:desc, labels:[], satoshis:v.totalSat,
                    origin, ts:Date.now(), status:'completed', isOutgoing:false });
  return { accepted:true };
}
function brc100ListActions(args){
  let actions=(_brc100Actions[_address]||[]).slice();
  if(Array.isArray(args.labels) && args.labels.length){
    const wanted=new Set(args.labels.map(l=>String(l).toLowerCase()));
    const mode=args.labelQueryMode||'any';
    if(mode!=='any' && mode!=='all')
      throw brc100Err('WERR_INVALID_PARAMETER', 3, 'listActions: labelQueryMode must be "any" or "all".');
    actions=actions.filter(rec=>{
      const have=new Set(rec.labels||[]);
      return mode==='all' ? [...wanted].every(w=>have.has(w)) : [...wanted].some(w=>have.has(w));
    });
  }
  const limit=Math.min(Math.max(parseInt(args.limit,10)||10, 1), 10000);
  const offset=Math.max(parseInt(args.offset,10)||0, 0);
  return { totalActions:actions.length,
    actions:actions.slice(offset, offset+limit).map(rec=>({
      txid:rec.txid, satoshis:rec.satoshis, status:rec.status, isOutgoing:rec.isOutgoing,
      description:rec.description, labels:rec.labels||[], version:1, lockTime:0 })) };
}
async function brc100DoRelinquish(args){
  const basket=args.basket||'default';
  if(basket!=='default')
    throw brc100Err('WERR_INVALID_PARAMETER', 3, 'relinquishOutput: basket "'+basket+'" is not tracked by this wallet — only "default" exists.');
  const outpoint=String(args.output||'').toLowerCase();
  if(!/^[0-9a-f]{64}\.\d+$/.test(outpoint))
    throw brc100Err('WERR_INVALID_PARAMETER', 3, 'relinquishOutput: output must be an outpoint like "txid.vout".');
  const utxos=await getUTXOs(_address);
  const known=utxos.some(u=>(u.txid+'.'+u.vout)===outpoint);
  if(!known)
    throw brc100Err('WERR_INVALID_PARAMETER', 3, 'relinquishOutput: outpoint '+outpoint+' is not a spendable output of this wallet.');
  brc100Relinquish(outpoint);
  return { relinquished:true };
}

/* v43.5 — signAction PHASE A: verify + reconstruct, NEVER sign.
   Builds the ordinal-protected outpoint set from the live 1-sat UTXOs (an
   ordinal must never be signable inside a dApp's signAction), runs the pure
   review engine (src/brc100-signaction.js), shows the reconstructed effect to
   the user for transparency, then returns the dry-run review. Signing is
   Phase B and stays disabled behind a security review (see SIGNACTION-SCOPE.md
   and src/brc100-signaction-phaseB.js). */
/* V44 — STRICT unspent fetch for the signAction path: distinguishes "index
   unreachable" (throw) from "genuinely no UTXOs" (empty list). fetchUnspent()
   conflates the two, which made V43.5's protected set fail-OPEN on an index
   outage. signAction must fail CLOSED: no index view, no review, no signing. */
async function fetchUnspentStrict(address){
  const urls=[`${API_BASE}/address/${address}/confirmed/unspent`, `${API_BASE}/address/${address}/unspent`];
  let lastErr=null;
  for(const url of urls){
    try{
      const res=await fetch(url);
      if(!res.ok){ lastErr=new Error('index responded '+res.status); continue; }
      const data=await res.json();
      const list=Array.isArray(data)?data:(data&&Array.isArray(data.result)?data.result:null);
      if(list) return list.filter(u=>u&&u.tx_hash&&!u.isSpentInMempoolTx); // empty is a valid answer
    }catch(e){ lastErr=e; }
  }
  try{ return await bitailsUnspent(address); }catch(e){ lastErr=e; }
  throw brc100Err('WERR_INTERNAL', 1, 'signAction refused: the wallet could not reach any UTXO index to verify inputs and ordinal protection ('+(lastErr&&lastErr.message||'unreachable')+'). Failing closed.');
}
/* V45 — second index provider (best-effort fallback; shape verified during
   the activation live test — a wrong mapping can only yield a refusal, never
   a false positive, because every consumer re-verifies cryptographically). */
const BITAILS_BASE='https://api.bitails.io';
async function bitailsUnspent(address){
  const res=await fetch(`${BITAILS_BASE}/address/${address}/unspent`);
  if(!res.ok) throw new Error('bitails responded '+res.status);
  const j=await res.json();
  const arr=(j&&Array.isArray(j.unspent))?j.unspent:(Array.isArray(j)?j:[]);
  return arr.map(u=>({ tx_hash:(u.txid||u.tx_hash||'').toLowerCase(), tx_pos:(typeof u.vout==='number'?u.vout:u.tx_pos), value:(typeof u.satoshis==='number'?u.satoshis:u.value) })).filter(u=>u.tx_hash);
}
/* V45 — USD exchange rate (WoC), 5-min cache. null on failure: consumers
   treat "no rate" as "show sats only / never auto-approve" (fail-closed). */
let _fx={rate:null,at:0};
async function getUsdRate(){
  if(_fx.rate && (Date.now()-_fx.at)<300000) return _fx.rate;
  try{
    const res=await fetch(`${API_BASE}/exchangerate`);
    if(!res.ok) return _fx.rate;
    const j=await res.json();
    const r=parseFloat(j&&j.rate);
    if(isFinite(r)&&r>0){ _fx={rate:r,at:Date.now()}; }
  }catch(_){}
  return _fx.rate;
}
function usdFmt(u){ return (u==null)?'':(' \u2248 $'+(u<0.01&&u>0?u.toFixed(4):u.toFixed(2))); }
/* V45 — per-app daily budget store (chrome.storage.local), pure engine in
   src/brc100-budget.js. */
async function loadBudgets(){ return new Promise(res=>{ try{ chrome.storage.local.get('ordplug_brc100_budgets', v=>res((v&&v.ordplug_brc100_budgets)||{})); }catch(_){ res({}); } }); }
async function saveBudgets(b){ return new Promise(res=>{ try{ chrome.storage.local.set({ ordplug_brc100_budgets:b }, ()=>res()); }catch(_){ res(); } }); }
async function brc100BuildProtectedSet(){
  // Every 1-sat outpoint the address holds is a candidate ordinal/name/map and
  // must be protected. V44: built from the STRICT fetch — an index outage now
  // refuses the whole review instead of silently emptying the protection. The
  // pure engine additionally refuses ANY 1-sat input, index or no index.
  const raw=await fetchUnspentStrict(_address);
  const set=new Set();
  raw.forEach(u=>{ if(u && u.value===1 && u.tx_hash) set.add(u.tx_hash.toLowerCase()+':'+u.tx_pos); });
  return { set, utxoList: raw };
}
/* V44 — fetch + hash-verify the raw funding tx for every owned input, so the
   prevout is PROVEN (sha256d(raw)==txid) rather than dApp- or index-asserted.
   The hash check itself lives in the pure Phase B engine; this only fetches. */
async function brc100FetchRawTxs(ownedInputs){
  const rawTxByTxid={};
  const txids=[...new Set(ownedInputs.map(m=>m.txid))];
  for(const txid of txids){
    try{
      const res=await fetch(`${API_BASE}/tx/${txid}/hex`);
      if(!res.ok) throw new Error('index responded '+res.status);
      rawTxByTxid[txid]=(await res.text()).trim();
    }catch(e){
      throw brc100Err('WERR_INTERNAL', 1, 'signAction refused: could not fetch funding transaction '+txid+' to prove the prevout ('+(e&&e.message||e)+'). Failing closed.');
    }
  }
  return rawTxByTxid;
}
/* V45 — fetch TSC merkle proofs so Phase B can prove block INCLUSION of every
   funding tx (GATE 1c). Fail-closed: no proof, no signing. The pure verifier
   lives in src/spv-verify.js; live WoC response shape is confirmed during the
   activation test (a shape mismatch surfaces as a refusal, never acceptance). */
async function brc100FetchSpvProofs(ownedInputs){
  const spvByTxid={};
  const txids=[...new Set(ownedInputs.map(m=>m.txid))];
  for(const txid of txids){
    try{
      const res=await fetch(`${API_BASE}/tx/${txid}/proof/tsc`);
      if(!res.ok) throw new Error('proof endpoint responded '+res.status);
      let p=await res.json(); if(Array.isArray(p)) p=p[0];
      if(!p) throw new Error('empty proof');
      const proof={ index:(typeof p.index==='number'?p.index:0), nodes:(p.nodes||[]) };
      const tgt=String(p.target||'');
      if(p.targetType==='header' || tgt.length===160) proof.headerHex=tgt;
      else if(p.targetType==='merkleRoot') proof.merkleRootHex=tgt;
      else { // block hash: fetch the header record for its merkle root
        const hr=await fetch(`${API_BASE}/block/hash/${tgt}`);
        if(!hr.ok) throw new Error('block header fetch responded '+hr.status);
        const hj=await hr.json();
        if(!hj || !hj.merkleroot) throw new Error('block header carries no merkle root');
        proof.merkleRootHex=String(hj.merkleroot);
      }
      spvByTxid[txid]=proof;
    }catch(e){
      throw brc100Err('WERR_INTERNAL', 1, 'signAction refused: could not obtain a merkle inclusion proof for '+txid+' ('+(e&&e.message||e)+'). Failing closed.');
    }
  }
  return spvByTxid;
}
/* V44 — pending-action registry (GATE 5), persisted so the background worker
   can service abortAction after this popup closes. */
async function brc100LoadPendingStore(){
  return new Promise(res=>{ try{ chrome.storage.session.get('ordplug_signaction_pending', v=>res((v&&v.ordplug_signaction_pending)||{})); }catch(_){ res({}); } });
}
async function brc100SavePendingStore(store){
  return new Promise(res=>{ try{ chrome.storage.session.set({ ordplug_signaction_pending: store }, ()=>res()); }catch(_){ res(); } });
}
/* ---- V46: certificate holder storage (per address, chrome.storage.local).
   Certificates can carry personal fields — treat the store as sensitive:
   never log field values, and wipe it on wallet reset with the rest. */
async function loadCerts(){ return new Promise(res=>{ try{ chrome.storage.local.get('ordplug_certs', v=>{ const all=(v&&v.ordplug_certs)||{}; res(Array.isArray(all[_address])?all[_address]:[]); }); }catch(_){ res([]); } }); }
async function saveCerts(list){ return new Promise(res=>{ try{ chrome.storage.local.get('ordplug_certs', v=>{ const all=(v&&v.ordplug_certs)||{}; all[_address]=list; chrome.storage.local.set({ ordplug_certs: all }, ()=>res()); }); }catch(_){ res(); } }); }
function ourIdentityKeyHex(){ try{ return bsv.PrivateKey.fromWIF(_wif).publicKey.toString(); }catch(_){ return null; } }
async function brc100AcquireCertificate(argsJson, origin){
  const CE=globalThis.OrdplugCerts; if(!CE) throw brc100Err('WERR_INTERNAL',1,'certificate engine not loaded.');
  let cert;
  try{ cert=CE.validateForAcquire(JSON.parse(argsJson||'{}'), ourIdentityKeyHex()); }
  catch(e){ throw brc100Err(e.name||'WERR_INVALID_PARAMETER',(typeof e.code==='number')?e.code:3, e.message||String(e)); }
  const ok=await new Promise(res=>{
    showView('brc100perm');
    $('bpIcon').innerHTML=ICONS.key;
    $('bpTitle').textContent='Store a certificate';
    $('bpOrigin').textContent=origin||'unknown app';
    $('bpDetail').textContent='Certifier: '+cert.certifier.slice(0,12)+'\u2026 \u00b7 fields: '+Object.keys(cert.fields).join(', ').slice(0,120)+'. Stored locally; nothing is revealed to anyone until you approve a proof request.';
    $('bpAllow').onclick=()=>res(true); $('bpDeny').onclick=()=>res(false);
  });
  if(!ok) throw brc100Err('WERR_PERMISSION_DENIED',1,'The user declined to store the certificate.');
  const list=await loadCerts();
  const key=CE.keyOf(cert);
  const without=list.filter(c=>CE.keyOf(c)!==key);
  without.push(cert);
  await saveCerts(without);
  return { certificate:{ type:cert.type, serialNumber:cert.serialNumber, subject:cert.subject, certifier:cert.certifier, revocationOutpoint:cert.revocationOutpoint, signature:cert.signature, fields:cert.fields } };
}
async function brc100ProveCertificate(argsJson, origin){
  const CE=globalThis.OrdplugCerts; if(!CE) throw brc100Err('WERR_INTERNAL',1,'certificate engine not loaded.');
  const args=JSON.parse(argsJson||'{}');
  const list=await loadCerts();
  const wanted=Array.isArray(args.fieldsToReveal)?args.fieldsToReveal.map(String):[];
  // Per-request selective-disclosure consent: the user sees EXACTLY which
  // fields leave the wallet, every time. No grants, no memory.
  const ok=await new Promise(res=>{
    showView('brc100perm');
    $('bpIcon').innerHTML=ICONS.key;
    $('bpTitle').textContent='Reveal certificate fields';
    $('bpOrigin').textContent=origin||'unknown app';
    $('bpDetail').textContent='This app asks you to reveal: '+(wanted.join(', ')||'(none)')+'. Only these fields are shared, with this app\u2019s verifier key, once.';
    $('bpAllow').onclick=()=>res(true); $('bpDeny').onclick=()=>res(false);
  });
  if(!ok) throw brc100Err('WERR_PERMISSION_DENIED',1,'The user declined to reveal certificate fields.');
  try{ return CE.proveCertificate(list, args, wanted); }
  catch(e){ throw brc100Err(e.name||'WERR_INVALID_PARAMETER',(typeof e.code==='number')?e.code:3, e.message||String(e)); }
}
/* ---- V46: x402 payment (pay-per-request within the per-app budget). The
   wallet builds and signs, the resource server settles via the facilitator —
   the wallet never broadcasts an x402 payment itself. */
async function walletPayX402(argsJson, origin){
  const XC=globalThis.OrdplugX402; if(!XC) throw brc100Err('WERR_INTERNAL',1,'x402 engine not loaded.');
  const args=JSON.parse(argsJson||'{}');
  let inv;
  try{ inv=XC.parsePaymentRequired(args.paymentRequired!=null?args.paymentRequired:args); }
  catch(e){ throw brc100Err(e.name||'WERR_INVALID_PARAMETER',(typeof e.code==='number')?e.code:3, e.message||String(e)); }
  // Budget/confirm pipeline — identical rules to any outgoing payment:
  // within the origin's daily allowance = frictionless; otherwise confirm.
  await brc100RequireTxConfirm({
    origin, incoming:false, total: inv.satoshis, miner: 0, service: 0,
    title: 'Pay for content (x402)',
    description: (inv.description||inv.resource||'Paid resource')+' \u00b7 invoice '+inv.invoiceId.slice(0,18)+'\u2026 \u00b7 the site broadcasts after settlement.',
    lines: [{ dest: inv.payTo, sats: inv.satoshis, note: inv.resource||'' }]
  });
  const tx=await buildTx({ outputs: [{ type:'p2pkh', address: inv.payTo, satoshis: inv.satoshis }] });
  const rawTx=tx.uncheckedSerialize();
  const pb=globalThis.OrdplugSignActionPhaseB;
  return {
    header: XC.buildXPaymentHeader(inv, rawTx),
    headerName: 'X-PAYMENT',
    invoiceId: inv.invoiceId,
    satoshis: inv.satoshis,
    txid: pb ? pb.sha256dTxid(bsv, rawTx) : null,
    broadcast: false // the resource server settles via the facilitator
  };
}
async function brc100SignActionReview(argsJson, origin){
  if(!root_OrdplugSignAction()) throw brc100Err('WERR_INTERNAL', 1, 'signAction review engine not loaded.');
  const { set: protectedSet, utxoList } = await brc100BuildProtectedSet(); // strict: throws if the index is down
  let review;
  try{
    review=globalThis.OrdplugSignAction.reviewSignAction(argsJson, { bsv, ourAddress:_address, protectedSet });
  }catch(e){
    // Pure engine throws standards-shaped WERR_* — pass them straight through.
    throw brc100Err(e.name||'WERR_INVALID_PARAMETER', (typeof e.code==='number')?e.code:3, e.message||String(e));
  }
  const pb=globalThis.OrdplugSignActionPhaseB;
  const willSign=!!(pb && pb.ENABLED);
  const eff=review.effect;
  const linesHtml=eff.outputs.map(l=>
    '<div class="kv"><span class="k" style="max-width:55%;overflow:hidden;text-overflow:ellipsis">'+esc(l.dest)+(l.toThisWallet?' (this wallet)':'')+(l.ordinalHint?' · 1-sat':'')+'</span><span class="v">'+l.satoshis.toLocaleString()+' sats</span></div>').join('');

  if(!willSign){
    // Informational only: reviewed, not signed. One acknowledge button — and
    // NOTHING is wired behind it (V43.5 mutated this button into an "Approve"
    // that would have fed a future Phase B; that trap is gone).
    await new Promise(res=>{
      showView('brc100tx');
      $('btIcon').innerHTML=ICONS.pen;
      $('btTitle').textContent='Review transaction (no signing)';
      $('btOrigin').textContent=origin||'unknown app';
      $('btDesc').textContent='This app asked the wallet to sign a transaction. The wallet verified it below but signing is not enabled on this installation.';
      $('btLines').innerHTML=linesHtml;
      $('btMiner').textContent=eff.signedInputCount+' of '+eff.totalInputCount+' inputs are yours';
      $('btService').textContent=eff.counterpartyInputCount+' input(s) supplied by the app';
      $('btTotal').textContent=(eff.netToWallet<0?'-':'+')+Math.abs(eff.netToWallet).toLocaleString()+' sats to this wallet';
      const approve=$('btApprove'), reject=$('btReject');
      approve.textContent='OK'; reject.style.display='none';
      approve.onclick=()=>res();
    });
    throw brc100Err('WERR_UNSUPPORTED_ACTION', 2,
      'signAction: the wallet reviewed this transaction (inputs verified, effect reconstructed) but signing is not enabled on this installation. See SECURITY-REVIEW-V44.md.');
  }

  await getUsdRate(); // warm the fiat cache for the signing confirm
  // ---- Phase B path: PROVE the prevouts BEFORE asking the user to approve,
  // so the numbers on the confirm screen are verified facts, not dApp claims.
  const rawTxByTxid=await brc100FetchRawTxs(review.ownedInputs);
  const spvByTxid=await brc100FetchSpvProofs(review.ownedInputs);
  try{
    pb.assertSighashPolicy(bsv, review.requestedSighash);
    pb.assertInputsInOwnUtxoSet(review.ownedInputs, utxoList);
    const ourLockHex=bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(_address)).toHex().toLowerCase();
    pb.assertPrevoutsProven(bsv, review.ownedInputs, rawTxByTxid, ourLockHex);
    pb.assertSpvProven(bsv, review.ownedInputs, spvByTxid);
  }catch(e){
    throw brc100Err(e.name||'WERR_INVALID_PARAMETER', (typeof e.code==='number')?e.code:3, e.message||String(e));
  }

  // Dedicated SIGNING confirmation — its own screen, its own wording, a real
  // Approve/Reject. The user approves the wallet's verified reconstruction.
  const approved=await new Promise(res=>{
    showView('brc100tx');
    $('btIcon').innerHTML=ICONS.pen;
    $('btTitle').textContent='Sign transaction';
    $('btOrigin').textContent=origin||'unknown app';
    $('btDesc').textContent='This app built a transaction and asks the wallet to sign '+eff.signedInputCount+' of its '+eff.totalInputCount+' input(s). Every input and amount below was verified against the chain by the wallet itself. The app — not the wallet — completes and broadcasts it.';
    $('btLines').innerHTML=linesHtml;
    $('btMiner').textContent=eff.signedInputCount+' input(s) verified · '+eff.spendingFromWallet.toLocaleString()+' sats from this wallet';
    $('btService').textContent='Sighash: SIGHASH_ALL | SIGHASH_FORKID';
    const _r=_fx.rate, _usd=(globalThis.OrdplugBudget&&_r)?globalThis.OrdplugBudget.satsToUsd(Math.abs(eff.netToWallet),_r):null;
    $('btTotal').textContent=(eff.netToWallet<0?'-':'+')+Math.abs(eff.netToWallet).toLocaleString()+' sats to this wallet'+usdFmt(_usd);
    const approve=$('btApprove'), reject=$('btReject');
    approve.textContent='Sign'; reject.style.display=''; reject.textContent='Reject';
    approve.onclick=()=>res(true); reject.onclick=()=>res(false);
  });
  if(!approved) throw brc100Err('WERR_PERMISSION_DENIED', 1, 'The user rejected signing for '+(origin||'this app')+'.');

  // All gates + user approval passed — only now is the key pulled (getWif),
  // inside the pure engine, after its own re-checks.
  const pendingStore=await brc100LoadPendingStore();
  let result;
  try{
    result=pb.performSignAction(review, {
      bsv, ourAddress:_address, utxoList, rawTxByTxid, spvByTxid,
      getWif:()=>_wif, pendingStore, origin
    });
  }catch(e){
    throw brc100Err(e.name||'WERR_INTERNAL', (typeof e.code==='number')?e.code:1, e.message||String(e));
  }
  await brc100SavePendingStore(pendingStore);
  return result;
}
function root_OrdplugSignAction(){ return typeof globalThis!=='undefined' && globalThis.OrdplugSignAction; }
/* fase 2: run the method on the bundled ProtoWallet (keys never in the page) */
async function brc100Engine(method, args){
  const w=brc100InitWallet();
  try{ return await w[method](args); }
  catch(e){ throw brc100Err((e&&e.name)||'WERR_UNKNOWN', (e&&e.code)||1, (e&&e.message)||String(e)); }
}
/* entry point: a BRC-100 request forwarded by the background worker */
async function handleBrc100Pending(p){
  _pendingBrc100=p;
  const argsJson=p.args||'{}';
  let args={}; try{ args=JSON.parse(argsJson); }catch(_){ }
  try{
    let result;
    if(BRC100_PHASE2.includes(p.method)){
      await brc100RequirePermission(p.origin, p.method, args);
      result=await brc100Engine(p.method, args);
    } else if(p.method==='createAction'){ result=await brc100CreateAction(argsJson, p.origin); }
    else if(p.method==='internalizeAction'){ result=await brc100InternalizeAction(argsJson, p.origin); }
    else if(p.method==='listActions'){ result=brc100ListActions(args); }
    else if(p.method==='listOutputs'){
      const u=await getUTXOs(_address);
      const v=brc100RequireValid(brc100ListOutputsCalc(u, argsJson));
      result={ totalOutputs:v.totalOutputs, outputs:v.outputs };
    }
    else if(p.method==='relinquishOutput'){ result=await brc100DoRelinquish(args); }
    else if(p.method==='signAction'){ result=await brc100SignActionReview(argsJson, p.origin); }
    else if(p.method==='acquireCertificate'){ result=await brc100AcquireCertificate(argsJson, p.origin); }
    else if(p.method==='listCertificates'){
      const CE=globalThis.OrdplugCerts; if(!CE) throw brc100Err('WERR_INTERNAL',1,'certificate engine not loaded.');
      await brc100RequirePermission('listCertificates', args, p.origin);
      result=CE.listCertificates(await loadCerts(), args);
    }
    else if(p.method==='proveCertificate'){ result=await brc100ProveCertificate(argsJson, p.origin); }
    else if(p.method==='relinquishCertificate'){
      const CE=globalThis.OrdplugCerts; if(!CE) throw brc100Err('WERR_INTERNAL',1,'certificate engine not loaded.');
      const list=await loadCerts();
      try{ result=CE.relinquishCertificate(list, args); }
      catch(e){ throw brc100Err(e.name||'WERR_INVALID_PARAMETER',(typeof e.code==='number')?e.code:3, e.message||String(e)); }
      await saveCerts(list);
    }
    else if(p.method==='payX402'){ result=await walletPayX402(argsJson, p.origin); }
    else throw brc100Err('WERR_UNSUPPORTED_ACTION', 2, p.method+' is not yet supported by the ORDnet wallet.');
    resolveBrc100(true, result, null);
  }catch(e){
    resolveBrc100(false, null, { name:e.name||'WERR_UNKNOWN', code:(typeof e.code==='number')?e.code:1, message:e.message||String(e) });
  }
}
function resolveBrc100(ok, result, error){
  const p=_pendingBrc100; if(!p) return;
  _pendingBrc100=null;
  chrome.storage.session.remove('ordplug_pending_brc100');
  chrome.runtime.sendMessage({ type:'brc100_resolve', id:p.id, tabId:p.tabId, ok, result, error });
  window.close();
}
/* grants manager (Settings → BRC-100 permissions, v2.6) */
function renderBrc100Grants(){
  const box=$('brcGrantsList'); if(!box) return;
  const rows=_brc100Grants.map(key=>{
    const parts=key.split('|');
    if(parts.length<3 || parts[0]!==_address) return null;
    const origin=parts[1];
    let detail;
    if(parts[2]==='identity') detail='Identity key';
    else if(parts.length>=4) detail='Level '+parts[2]+' · protocol “'+parts[3]+'”'+(parts.length>=5?(' · counterparty '+parts[4].slice(0,8)+'…'):'');
    else detail=parts[2];
    return { key, origin, detail };
  }).filter(Boolean).sort((a,b)=>(a.origin+a.detail).localeCompare(b.origin+b.detail));
  if(!rows.length){ box.innerHTML='<div class="empty-note">No BRC-100 permissions granted yet. Apps ask the first time they need your keys; grants appear here and can be revoked per app.</div>'; return; }
  box.innerHTML=rows.map(r=>`
    <div class="acct">
      <div class="ic">${esc(r.origin.replace(/^https?:\/\//,'').charAt(0).toUpperCase())}</div>
      <div class="m"><div class="nm" style="font-size:12px">${esc(r.origin)}</div><div class="ad">${esc(r.detail)}</div></div>
      <div class="ax"><button class="iconbtn" title="Revoke" data-brc-revoke="${esc(r.key)}">${ICONS.trash}</button></div>
    </div>`).join('');
}
async function brc100RevokeGrant(key){
  _brc100Grants=_brc100Grants.filter(k=>k!==key);
  await saveBrc100Grants();
  renderBrc100Grants();
}

/* ---------- events (MV3: no inline handlers) ---------- */
function wireEvents(){
  // unlock
  $('unlockBtn').addEventListener('click', doUnlock);
  $('unlockPw').addEventListener('keydown', e=>{ if(e.key==='Enter') doUnlock(); });
  $('btnForgot').addEventListener('click', ()=>$('forgotConfirm').classList.remove('hidden'));
  $('btnForgotNo').addEventListener('click', ()=>$('forgotConfirm').classList.add('hidden'));
  $('btnForgotYes').addEventListener('click', removeWalletNow);
  // migrate
  $('migBtn').addEventListener('click', doMigrate);
  // setup
  $('btnShowCreate').addEventListener('click', showCreate);
  $('btnShowImport').addEventListener('click', showImport);
  $('btnCreateBack').addEventListener('click', setupChoice);
  $('createBtn').addEventListener('click', createWalletNow);
  $('btnImportBack').addEventListener('click', setupChoice);
  $('importBtn').addEventListener('click', importWalletNow);
  $('impSegB').addEventListener('click', ()=>setImport('bip44'));
  $('impSegO').addEventListener('click', ()=>setImport('other'));
  $('impSegL').addEventListener('click', ()=>setImport('legacy'));
  $('impSegW').addEventListener('click', ()=>setImport('wif'));
  $('importWalletSel').addEventListener('change', onPresetChange);
  $('importPreviewBtn').addEventListener('click', importPreview);
  // home
  $('btnShowSend').addEventListener('click', showSend);
  $('btnShowReceive').addEventListener('click', showReceive);
  $('btnShowUtxo').addEventListener('click', showUtxoTools);
  $('btnShowAccounts').addEventListener('click', showAccounts);
  $('btnShowSettings').addEventListener('click', showSettings);
  // V46 Y4 — open the wallet in a full browser tab (monitor icon)
  $('btnOpenTab').innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>';
  $('btnOpenTab').addEventListener('click', ()=>{ try{ chrome.tabs.create({ url: chrome.runtime.getURL('src/wallet.html') }); window.close(); }catch(_){} });
  $('btnShowHistory').addEventListener('click', showHistory);
  $('tabSns').addEventListener('click', ()=>setHoldTab('sns'));
  $('tabMap').addEventListener('click', ()=>setHoldTab('bsvmap'));
  $('tabOpns').addEventListener('click', ()=>setHoldTab('opns')); // v4.1
  $('tabSale').addEventListener('click', ()=>setHoldTab('sale'));
  $('holdSearch').addEventListener('input', e=>{ _holdSearch=e.target.value; _holdPage=0; bulkReselectPage(); renderHoldings(); });
  $('holdPrev').addEventListener('click', ()=>{ _holdPage--; bulkReselectPage(); renderHoldings(); });
  $('holdNext').addEventListener('click', ()=>{ _holdPage++; bulkReselectPage(); renderHoldings(); });
  $('btnLock').addEventListener('click', lockWallet);
  $('copyAddr').addEventListener('click', copyActiveAddress);
  $('btnShowUtxo').innerHTML=ICONS.utxo;   // v4.2 — user layout: UTXO tools replace the domains button
  $('btnShowAccounts').innerHTML=ICONS.users;
  $('btnShowSettings').innerHTML=ICONS.gear;
  $('btnLock').innerHTML=ICONS.lock;
  // receive / history / browse
  $('btnRcvBack').addEventListener('click', showIdle);
  $('rcvCopyBtn').addEventListener('click', copyReceiveAddress);
  $('btnHistBack').addEventListener('click', showIdle);
  
  $('browseGoBtn').addEventListener('click', ()=>{ const v=$('browseInput').value.trim(); if(v) browseNavigate(v); });
  $('btnDomainsRefresh').addEventListener('click', ()=>loadMyDomains(true));
  // since v37 — search + paging in the WEB3 domain list (10 per page)
  $('myDomainsSearch').addEventListener('input', ()=>{ _myDomSearch=$('myDomainsSearch').value; _myDomPage=0; renderMyDomains(); });
  $('myDomPrev').addEventListener('click', ()=>{ _myDomPage--; renderMyDomains(); });
  $('myDomNext').addEventListener('click', ()=>{ _myDomPage++; renderMyDomains(); });
  $('btnDomainBack').addEventListener('click', showDomains);
  $('btnDomainOpen').addEventListener('click', ()=>{ if(_domCurrent) browseNavigate(_domCurrent); });
  $('btnDomainSave').addEventListener('click', saveDomainTarget);
  $('btnTargetClear').addEventListener('click', removeTarget);
  $('btnSubAdd').addEventListener('click', addSubdomain);
  $('btnRtAdd').addEventListener('click', addRoute);
  $('btnTransfer').addEventListener('click', transferDomain);
  $('browseInput').addEventListener('keydown', e=>{ if(e.key==='Enter'){ const v=e.target.value.trim(); if(v) browseNavigate(v); } });
  document.querySelectorAll('#view-browse .link-item[data-url]').forEach(item=>{
    item.addEventListener('click', ()=>{ chrome.tabs.create({ url:item.dataset.url }); window.close(); });
  });
  // history rows (delegated)
  $('histList').addEventListener('click', e=>{
    const row=e.target.closest('[data-tx]'); if(!row) return;
    chrome.tabs.create({ url:'https://whatsonchain.com/tx/'+row.dataset.tx });
  });
  // accounts + security
  $('addSegG').addEventListener('click', ()=>setAdd('gen'));
  $('addSegI').addEventListener('click', ()=>setAdd('imp'));
  $('aImpSegB').addEventListener('click', ()=>setAddImp('bip44'));
  $('aImpSegO').addEventListener('click', ()=>setAddImp('other'));
  $('aImpSegL').addEventListener('click', ()=>setAddImp('legacy'));
  $('aImpSegW').addEventListener('click', ()=>setAddImp('wif'));
  $('addWalletSel').addEventListener('change', onAddPresetChange);
  $('addBtn').addEventListener('click', addAccount);
  $('btnAcctBack').addEventListener('click', showIdle);
  $('btnSettingsBack').addEventListener('click', showIdle);
  $('btnLockNow').addEventListener('click', lockWallet);
  $('autolockSel').addEventListener('change', e=>{ storageSet({ [AUTOLOCK_KEY]: parseInt(e.target.value,10) }); });
  $('btnBackup').addEventListener('click', ()=>showBackup(_active));
  $('btnChangePw').addEventListener('click', showChangePw);
  $('btnConnectedSites').addEventListener('click', showSites);
  $('btnAddressBook').addEventListener('click', showAddressBook);
  // backup / reveal
  $('btnBkBack').addEventListener('click', showSettings);
  $('bkRevealBtn').addEventListener('click', doReveal);
  $('bkPw').addEventListener('keydown', e=>{ if(e.key==='Enter') doReveal(); });
  $('bkCopyPhrase').addEventListener('click', ()=>copyText($('bkPhrase').value, $('bkOk'), 'Recovery phrase copied'));
  $('bkCopyWif').addEventListener('click', ()=>copyText($('bkWif').value, $('bkOk'), 'WIF copied'));
  $('bkDoneBtn').addEventListener('click', hideRevealSecret);
  // change password
  $('btnCpBack').addEventListener('click', showSettings);
  $('cpBtn').addEventListener('click', doChangePw);
  // connected sites
  $('btnSitesBack').addEventListener('click', showSettings);
  $('sitesList').addEventListener('click', e=>{
    const b=e.target.closest('[data-disc]'); if(!b) return;
    disconnectSite(b.dataset.disc);
  });
  // send max
  $('sendMaxBtn').addEventListener('click', sendMax);
  // activity-based auto-lock: any interaction refreshes the unlock timer
  document.body.addEventListener('click', touchActivity, true);
  document.body.addEventListener('keydown', touchActivity, true);
  $('btnRemoveWallet').addEventListener('click', ()=>$('removeConfirm').classList.remove('hidden'));
  $('btnRemoveNo').addEventListener('click', ()=>$('removeConfirm').classList.add('hidden'));
  $('btnRemoveYes').addEventListener('click', removeWalletNow);
  $('acctList').addEventListener('click', (e)=>{
    const btn=e.target.closest('[data-act]'); if(!btn) return;
    const i=parseInt(btn.dataset.i,10);
    if(btn.dataset.act==='use') switchAccount(i);
    else if(btn.dataset.act==='rename') renameAccount(i);
    else if(btn.dataset.act==='export') showBackup(i);
    else if(btn.dataset.act==='askremove') askRemove(i);
    else if(btn.dataset.act==='remove') removeAccount(i);
  });
  // approval
  $('apApprove').addEventListener('click', approveRequest);
  $('apReject').addEventListener('click', rejectRequest);
  // send BSV / ordinal / list
  $('btnSendBack').addEventListener('click', showIdle);
  $('sendBtn').addEventListener('click', doSend);
  $('sendPasteBtn').addEventListener('click', pasteToSend);
  $('sendSaveBtn').addEventListener('click', saveLastSentAddress);
  $('sendBookSel').addEventListener('change', e=>{ if(e.target.value){ $('sendTo').value=e.target.value; clearNameTargets(); updateSendConfirmUI(); evaluateSendSafety(); } });
  // input changed → stale name confirmations die (v4.1, same as iOS)
  $('sendTo').addEventListener('input', ()=>{ clearNameTargets(); updateSendConfirmUI(); evaluateSendSafety(); });
  $('sendAmt').addEventListener('input', evaluateSendSafety);
  // address book
  $('btnBookBack').addEventListener('click', showSettings);
  $('bookAddBtn').addEventListener('click', doBookAdd);
  $('bookList').addEventListener('click', e=>{
    const b=e.target.closest('[data-book-del]'); if(!b) return;
    bookRemove(b.dataset.bookDel).then(renderBook);
  });
  $('btnSoBack').addEventListener('click', showIdle);
  $('soBtn').addEventListener('click', doSendOrdinal);
  $('btnLoBack').addEventListener('click', showIdle);
  $('loBtn').addEventListener('click', loShowConfirm);
  $('btnLoCancel').addEventListener('click', loShowForm);
  $('loConfirmBtn').addEventListener('click', doListOrdinal);
  $('loPrice').addEventListener('input', updateLoPriceHint);
  // delist
  $('btnDlBack').addEventListener('click', showIdle);
  $('dlBtn').addEventListener('click', doDelistNow);
  // bulk list (inline selection mode)
  $('btnBulkList').addEventListener('click', ()=>{ _bulkMode?exitBulkMode():enterBulkMode(); });
  $('bulkCancel').addEventListener('click', exitBulkMode);
  $('bulkToggleAll').addEventListener('click', bulkToggleAllNow);
  $('bulkGo').addEventListener('click', bulkGoNow);
  $('bulkPrice').addEventListener('input', bulkDisarm);
  // v4.2 — bottom tab bar (iOS layout): Wallet · Browser · Domains · Upload · ORD/ner
  $('navWallet').innerHTML=ICONS.navWallet+'<span>Wallet</span>';
  $('navBrowser').innerHTML=ICONS.navBrowser+'<span>Browser</span>';
  $('navDomains').innerHTML=ICONS.navGlobe+'<span>Domains</span>';
  $('navUpload').innerHTML=ICONS.navUpload+'<span>Upload</span>';
  $('navOrdner').innerHTML=ICONS.navFolder+'<span>ORD/ner</span>';
  $('navWallet').addEventListener('click', showIdle);
  $('navBrowser').addEventListener('click', showBrowse);
  $('navDomains').addEventListener('click', showDomains);
  $('navUpload').addEventListener('click', showUpload);
  $('navOrdner').addEventListener('click', showOrdner);
  // v4.2 — UTXO tools
  $('btnUtxoBack').addEventListener('click', showIdle);
  $('btnUtxoBack').innerHTML=ICONS.wallet;
  $('utSplitBtn').addEventListener('click', doSplitTap);
  $('utCombineBtn').addEventListener('click', doCombineTap);
  $('utCount').addEventListener('input', ()=>{ _utConfirm=null; updateUtxoUI(); updateSplitHint(); });
  $('utSats').addEventListener('input', ()=>{ _utConfirm=null; updateUtxoUI(); updateSplitHint(); });
  // v4.2 — Upload & Inscribe
  $('upFile').addEventListener('change', upOnFile);
  $('upQuality').addEventListener('input', upApplyCompression);
  $('upInscribeBtn').addEventListener('click', upInscribeSelected);
  $('upSegText').addEventListener('click', ()=>{ _upTextMode='text'; $('upSegText').classList.add('on'); $('upSegHtml').classList.remove('on'); upUpdateTextHint(); });
  $('upSegHtml').addEventListener('click', ()=>{ _upTextMode='html'; $('upSegHtml').classList.add('on'); $('upSegText').classList.remove('on'); upUpdateTextHint(); });
  $('upText').addEventListener('input', upUpdateTextHint);
  $('upTextBtn').addEventListener('click', upInscribeText);
  $('upSuccessTxid').addEventListener('click', async ()=>{
    const t=$('upSuccessTxid').textContent;
    if(t && t!=='—'){ try{ await navigator.clipboard.writeText(t); const n=$('upSuccessTxid'); const o=n.textContent; n.textContent='Copied ✓'; setTimeout(()=>{ n.textContent=o; }, 900); }catch(_){} }
  });
  // v4.2 — ORD/ner
  $('onViewToggle').addEventListener('click', ()=>{ _onView=(_onView==='grid')?'list':'grid'; $('onViewToggle').innerHTML=(_onView==='grid')?ICONS.listIcon:ICONS.grid; renderOrdner(); });
  $('onRefresh').addEventListener('click', showOrdner);
  $('onHideSent').addEventListener('click', ()=>{ _onHideSent=!_onHideSent; renderOrdner(); });
  $('btnOfBack').addEventListener('click', showOrdner);
  $('btnOfBack').innerHTML=ICONS.navFolder;
  $('ofTxid').addEventListener('click', ()=>{ if(_onSel) ofCopy(_onSel.currentTxid, 'TXID'); });
  $('ofOrigin').addEventListener('click', ()=>{ if(_onSel) ofCopy(_onSel.originTxid+'_'+_onSel.originVout, 'Origin'); });
  $('ofCurrent').addEventListener('click', ()=>{ if(_onSel) ofCopy(_onSel.currentTxid+'_'+_onSel.currentVout, 'Current UTXO'); });
  $('ofCopyTxidBtn').addEventListener('click', ()=>{ if(_onSel) ofCopy(_onSel.currentTxid, 'TXID'); });
  $('ofCopyAllBtn').addEventListener('click', ofCopyAll);
  $('ofOpenBtn').addEventListener('click', ()=>{ if(_onSel) browseNavigate(_onSel.originTxid); });
  $('ofSendBtn').addEventListener('click', ofSend);
  // holdings: open link, send, list, delist or bulk-toggle (delegated)
  document.body.addEventListener('click', (e)=>{
    const of=e.target.closest('[data-of]');
    if(of){ showOrdFile(parseInt(of.dataset.of,10)); return; }
    const md=e.target.closest('[data-managedomain]');
    if(md){ showDomainDetail(md.dataset.managedomain); return; }
    const brcRev=e.target.closest('[data-brc-revoke]');
    if(brcRev){ brc100RevokeGrant(brcRev.dataset.brcRevoke); return; }
    const cb=e.target.closest('[data-bulkchk]');
    if(cb){ bulkToggle(parseInt(cb.dataset.bulkchk,10)); return; }
    const br=e.target.closest('[data-bulkrow]');
    if(br){ bulkToggle(parseInt(br.dataset.bulkrow,10)); return; }
    const l=e.target.closest('[data-list]');
    if(l){ startListOrdinal(parseInt(l.dataset.list,10)); return; }
    const d1=e.target.closest('[data-delist]');
    if(d1){ startDelist(parseInt(d1.dataset.delist,10)); return; }
    const s=e.target.closest('[data-send]');
    if(s){ startSendOrdinal(parseInt(s.dataset.send,10)); return; }
    const h=e.target.closest('[data-open]'); if(!h) return;
    chrome.tabs.create({ url:h.dataset.open });
  });
}

/* ---------- boot ---------- */
(async function boot(){
  try{ if(matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.setAttribute('data-theme','dark'); }catch(e){}
  wireEvents();
  // pick up a pending page request, if any
  const pend=await new Promise(r=>chrome.storage.session.get(['ordplug_pending'],x=>r(x.ordplug_pending)));
  if(pend) _pending=pend;
  // v4.2 — a pending BRC-100 request (stored by the background worker)
  const pendBrc=await new Promise(r=>chrome.storage.session.get(['ordplug_pending_brc100'],x=>r(x.ordplug_pending_brc100)));
  if(pendBrc) _pendingBrc100=pendBrc;
  const vault=await storageGet(VAULT_KEY);
  const legacy=await storageGet(ACCTS_KEY);
  if(!vault && legacy && legacy.accounts && legacy.accounts.length){ showMigrate(legacy); return; }
  if(!vault){ showSetup(); return; }
  const payload=await unlockFromSession();
  if(payload){ applyPayload(payload); await afterReady(); }
  else showUnlock(_pending ? ('Unlock to review the request from '+(_pending.origin||'a page')) : undefined);
})();
