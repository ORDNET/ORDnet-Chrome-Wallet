/* ORD/plug content script — runs in the isolated world on ordnet.io pages.
   1) Injects inpage.js into the page world so window.ordplug exists.
   2) Relays requests: page -> background (chrome.runtime), and
      responses: background -> page (window.postMessage). */

// inject provider into the page world
(function inject(){
  try{
    var s = document.createElement('script');
    s.src = chrome.runtime.getURL('src/inpage.js');
    s.onload = function(){ this.remove(); };
    (document.head || document.documentElement).appendChild(s);
  }catch(e){ /* page refused injection; provider unavailable */ }
})();

// page -> background
window.addEventListener('message', function(e){
  if (e.source !== window) return;
  var d = e.data;
  if (!d || d.__ordplug !== 1 || d.dir !== 'page2cs') return;
  chrome.runtime.sendMessage({
    type: 'ordplug_request',
    id: d.id,
    method: d.method,
    params: d.params,
    origin: location.origin
  });
});

// background -> page
chrome.runtime.onMessage.addListener(function(msg){
  if (!msg || msg.type !== 'ordplug_response') return;
  window.postMessage({
    __ordplug: 1,
    dir: 'cs2page',
    id: msg.id,
    ok: msg.ok,
    result: msg.result,
    error: msg.error
  }, '*');
});
