
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

