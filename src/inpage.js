/* ORD/plug provider — injected into the page world by content.js.
   Exposes window.ordplug with the same method set as the ORDnet web3
   ORD/plug wallet: connect, getAddress, getPublicKey, getBalance,
   pay, inscribe, signMessage, purchase.
   Every call returns a Promise; approvals happen in the extension popup. */
(function(){
  if (window.ordplug) return; // don't double-inject

  var _id = 0;
  var _pending = {};

  function request(method, params){
    return new Promise(function(resolve, reject){
      var id = 'op_' + (++_id) + '_' + Date.now();
      _pending[id] = { resolve: resolve, reject: reject };
      window.postMessage({ __ordplug: 1, dir: 'page2cs', id: id, method: method, params: params || {} }, '*');
      // safety timeout: 5 minutes
      setTimeout(function(){
        if(_pending[id]){ _pending[id].reject(new Error('ORD/plug request timed out')); delete _pending[id]; }
      }, 5 * 60 * 1000);
    });
  }

  window.addEventListener('message', function(e){
    var d = e.data;
    if (!d || d.__ordplug !== 1 || d.dir !== 'cs2page') return;
    var p = _pending[d.id];
    if (!p) return;
    delete _pending[d.id];
    if (d.ok) p.resolve(d.result);
    else p.reject(new Error(d.error || 'Request failed'));
  });

  window.ordplug = {
    isOrdPlug: true,
    version: '4.9.7',            // V49.3 — kept equal to manifest.json (tests/v49-release-tests.mjs checks)
    connect:      function(){ return request('connect'); },
    getAddress:   function(){ return request('getAddress'); },
    getPublicKey: function(){ return request('getPublicKey'); },
    getBalance:   function(){ return request('getBalance'); },
    pay:          function(params){ return request('pay', params); },
    inscribe:     function(params){ return request('inscribe', params); },
    signMessage:  function(params){ return request('signMessage', typeof params === 'string' ? { message: params } : params); },
    purchase:     function(params){ return request('purchase', params); },
    listOrdinal:  function(params){ return request('listOrdinal', params); },
    buyOrdinal:   function(params){ return request('buyOrdinal', params); },
    sendTx:       function(params){ return request('sendTx', params); },
    request:      request
  };

  window.dispatchEvent(new Event('ordplug#initialized'));
})();
