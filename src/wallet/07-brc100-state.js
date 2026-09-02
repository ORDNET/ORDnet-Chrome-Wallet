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
