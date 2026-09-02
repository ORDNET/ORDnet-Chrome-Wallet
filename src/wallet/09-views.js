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

