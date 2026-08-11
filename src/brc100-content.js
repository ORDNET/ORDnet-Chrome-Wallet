/* ORD/plug BRC-100 content script (V42) — runs in the isolated world on ALL
   pages (the BRC-100 provider must be detectable everywhere, like the iOS
   in-app browser injects its shim into every page).
   1) Injects brc100-inpage.js into the page world so window.CWI exists.
   2) Relays requests: page -> background (chrome.runtime), and
      responses: background -> page (window.postMessage). */

(function inject(){
  try{
    var s = document.createElement('script');
    s.src = chrome.runtime.getURL('src/brc100-inpage.js');
    s.onload = function(){ this.remove(); };
    (document.head || document.documentElement).appendChild(s);
  }catch(e){ /* page refused injection; provider unavailable */ }
})();

// page -> background
window.addEventListener('message', function(e){
  if (e.source !== window) return;
  var d = e.data;
  if (!d || d.__ordplugCWI !== 1 || d.dir !== 'page2cs') return;
  chrome.runtime.sendMessage({
    type: 'brc100_request',
    id: d.id,
    method: d.method,
    args: d.args,
    originator: d.originator || location.origin
  }, function(direct){
    // fase-1 / explicit-refusal answers come back synchronously from the
    // background worker; popup-routed methods answer later via onMessage
    if (chrome.runtime.lastError) return;
    if (direct && direct.handled) {
      window.postMessage({ __ordplugCWI: 1, dir: 'cs2page', id: d.id,
        ok: direct.ok, result: direct.result, error: direct.error }, '*');
    }
  });
});

// background -> page (popup-routed answers)
chrome.runtime.onMessage.addListener(function(msg){
  if (!msg || msg.type !== 'brc100_response') return;
  window.postMessage({ __ordplugCWI: 1, dir: 'cs2page', id: msg.id,
    ok: msg.ok, result: msg.result, error: msg.error }, '*');
});
