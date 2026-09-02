/* ORD/plug content script — runs in the isolated world on every http(s)
   page (the wallet must be detectable everywhere, like the iOS in-app
   browser injects its shims into every page).

   V49.3 — ONE injector for BOTH providers. Until 4.9.2 there were two
   content scripts (content.js for window.ordplug, brc100-content.js for
   window.CWI) with slightly different match patterns; two injectors on the
   same page are how origin confusion creeps back in (H4). Now:
   1) injects inpage.js (window.ordplug) and brc100-inpage.js (window.CWI)
      into the page world;
   2) relays page -> background for both message families
      (__ordplug / __ordplugCWI) and background -> page answers.
   The origin sent to the background is location.origin of THIS isolated
   world — never a page-supplied value — and background.js additionally
   prefers sender.origin from Chrome itself. */

(function inject(){
  ['src/inpage.js', 'src/brc100-inpage.js'].forEach(function(path){
    try{
      var s = document.createElement('script');
      s.src = chrome.runtime.getURL(path);
      s.onload = function(){ this.remove(); };
      (document.head || document.documentElement).appendChild(s);
    }catch(e){ /* page refused injection; that provider is unavailable */ }
  });
})();

// page -> background
window.addEventListener('message', function(e){
  if (e.source !== window) return;
  var d = e.data;
  if (!d || d.dir !== 'page2cs') return;

  if (d.__ordplug === 1) {
    chrome.runtime.sendMessage({
      type: 'ordplug_request',
      id: d.id,
      method: d.method,
      params: d.params,
      origin: location.origin
    });
    return;
  }

  if (d.__ordplugCWI === 1) {
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
  }
});

// background -> page
chrome.runtime.onMessage.addListener(function(msg){
  if (!msg) return;
  if (msg.type === 'ordplug_response') {
    window.postMessage({ __ordplug: 1, dir: 'cs2page', id: msg.id,
      ok: msg.ok, result: msg.result, error: msg.error }, '*');
  } else if (msg.type === 'brc100_response') {
    window.postMessage({ __ordplugCWI: 1, dir: 'cs2page', id: msg.id,
      ok: msg.ok, result: msg.result, error: msg.error }, '*');
  }
});
