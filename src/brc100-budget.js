/* =========================================================================
   ORD/plug — per-app daily spending budget (V45). Pure engine, injected
   store, testable in Node. HandCash-style: the USER can grant an origin a
   daily USD allowance (default $10, adjustable, revocable); wallet-built
   createAction payments within the remaining allowance auto-approve, all
   else falls back to the per-transaction confirm.

   Policy (deliberate, documented):
   - No budget granted  -> every transaction confirms. Nothing is implicit.
   - No fresh USD rate  -> never auto-approve (fail-closed to the confirm).
   - dApp-built signAction NEVER auto-approves, budget or not: the wallet
     did not construct that transaction, so a human always looks at it.
   - Day buckets are UTC; a new day resets spend, never the limit.
   ========================================================================= */
(function (root) {
  'use strict';
  var MAX_LIMIT_USD = 1000; // sanity ceiling; raise only deliberately

  function dayKey(now) { var d = new Date(now || Date.now()); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); }
  function satsToUsd(sats, rateUsdPerBsv) {
    if (typeof rateUsdPerBsv !== 'number' || !isFinite(rateUsdPerBsv) || rateUsdPerBsv <= 0) return null;
    if (typeof sats !== 'number' || !isFinite(sats) || sats < 0) return null;
    return (sats / 1e8) * rateUsdPerBsv;
  }
  function getBudget(store, origin) {
    if (!store || typeof store !== 'object' || typeof origin !== 'string' || !origin) return null;
    var b = store[origin];
    return (b && typeof b.limitUsd === 'number' && b.limitUsd > 0) ? b : null;
  }
  function setLimit(store, origin, limitUsd, now) {
    if (!store || typeof origin !== 'string' || !origin) throw new Error('budget: origin required');
    if (limitUsd == null) { delete store[origin]; return null; } // revoke
    if (typeof limitUsd !== 'number' || !isFinite(limitUsd) || limitUsd <= 0 || limitUsd > MAX_LIMIT_USD) throw new Error('budget: limit must be 0 < USD <= ' + MAX_LIMIT_USD);
    var prev = store[origin] || {};
    store[origin] = { limitUsd: limitUsd, spentUsd: (prev.day === dayKey(now) ? (prev.spentUsd || 0) : 0), day: dayKey(now) };
    return store[origin];
  }
  /* Decision for an OUTGOING wallet-built payment. Auto-approve iff a budget
     exists, the rate is fresh/known, and spend-so-far + amount <= limit. */
  function decide(store, origin, amountSats, rateUsdPerBsv, now) {
    var out = { autoApprove: false, amountUsd: satsToUsd(amountSats, rateUsdPerBsv), remainingUsd: null };
    var b = getBudget(store, origin);
    if (!b) return out;
    var spent = (b.day === dayKey(now)) ? (b.spentUsd || 0) : 0;
    out.remainingUsd = Math.max(0, b.limitUsd - spent);
    if (out.amountUsd == null) return out;             // no rate -> confirm
    if (out.amountUsd <= out.remainingUsd) out.autoApprove = true;
    return out;
  }
  function recordSpend(store, origin, amountUsd, now) {
    var b = getBudget(store, origin);
    if (!b || typeof amountUsd !== 'number' || !isFinite(amountUsd) || amountUsd < 0) return;
    var k = dayKey(now);
    if (b.day !== k) { b.day = k; b.spentUsd = 0; }
    b.spentUsd = (b.spentUsd || 0) + amountUsd;
  }
  root.OrdplugBudget = { dayKey: dayKey, satsToUsd: satsToUsd, getBudget: getBudget, setLimit: setLimit, decide: decide, recordSpend: recordSpend, MAX_LIMIT_USD: MAX_LIMIT_USD };
})(typeof globalThis !== 'undefined' ? globalThis : this);
