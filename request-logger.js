(function () {
  if (window.__requestLoggerActive) return;
  window.__requestLoggerActive = true;

  var requests = [];

  // --- UI ---
  var panel = document.createElement('div');
  panel.id = 'req-logger-panel';
  panel.innerHTML =
    '<div id="req-logger-header">' +
      '<span>Request Logger</span>' +
      '<button id="req-logger-clear" title="Clear">&#x1f5d1;</button>' +
      '<button id="req-logger-toggle" title="Collapse">&#x2796;</button>' +
    '</div>' +
    '<div id="req-logger-body">' +
      '<table id="req-logger-table">' +
        '<thead><tr>' +
          '<th>#</th><th>Method</th><th>URL</th><th>Status</th><th>Time</th>' +
        '</tr></thead>' +
        '<tbody></tbody>' +
      '</table>' +
    '</div>';

  var style = document.createElement('style');
  style.textContent =
    '#req-logger-panel{position:fixed;bottom:0;left:0;width:100%;max-height:45vh;' +
      'background:#1e1e2e;color:#cdd6f4;font-family:monospace;font-size:12px;' +
      'z-index:2147483647;display:flex;flex-direction:column;border-top:2px solid #89b4fa;box-sizing:border-box}' +
    '#req-logger-header{display:flex;align-items:center;justify-content:space-between;' +
      'padding:4px 10px;background:#181825;border-bottom:1px solid #313244;flex-shrink:0}' +
    '#req-logger-header span{font-weight:bold;color:#89b4fa}' +
    '#req-logger-header button{background:none;border:none;color:#cdd6f4;cursor:pointer;font-size:14px;margin-left:8px}' +
    '#req-logger-body{overflow-y:auto;flex:1}' +
    '#req-logger-table{width:100%;border-collapse:collapse}' +
    '#req-logger-table th{text-align:left;padding:3px 8px;background:#313244;position:sticky;top:0}' +
    '#req-logger-table td{padding:3px 8px;border-bottom:1px solid #313244;word-break:break-all;max-width:60vw}' +
    '.req-ok{color:#a6e3a1}.req-err{color:#f38ba8}.req-pending{color:#f9e2af}';

  document.head.appendChild(style);
  document.body.appendChild(panel);

  var tbody = panel.querySelector('tbody');
  var body = document.getElementById('req-logger-body');
  var collapsed = false;

  document.getElementById('req-logger-toggle').addEventListener('click', function () {
    collapsed = !collapsed;
    body.style.display = collapsed ? 'none' : '';
    this.innerHTML = collapsed ? '&#x2795;' : '&#x2796;';
  });

  document.getElementById('req-logger-clear').addEventListener('click', function () {
    requests = [];
    tbody.innerHTML = '';
  });

  function addRow(entry) {
    requests.push(entry);
    var tr = document.createElement('tr');
    entry._tr = tr;
    updateRow(entry);
    tbody.appendChild(tr);
    body.scrollTop = body.scrollHeight;
  }

  function statusClass(s) {
    if (!s) return 'req-pending';
    return s >= 200 && s < 400 ? 'req-ok' : 'req-err';
  }

  function updateRow(entry) {
    var elapsed = entry.end ? (entry.end - entry.start) + 'ms' : '...';
    var statusText = entry.status || '...';
    entry._tr.innerHTML =
      '<td>' + entry.id + '</td>' +
      '<td>' + entry.method + '</td>' +
      '<td>' + entry.url + '</td>' +
      '<td class="' + statusClass(entry.status) + '">' + statusText + '</td>' +
      '<td>' + elapsed + '</td>';
  }

  var counter = 0;

  // --- Intercept fetch ---
  var origFetch = window.fetch;
  window.fetch = function (input, init) {
    var method = (init && init.method) ? init.method.toUpperCase() : 'GET';
    var url = (typeof input === 'string') ? input : (input && input.url ? input.url : String(input));
    var entry = { id: ++counter, method: method, url: url, status: null, start: Date.now(), end: null };
    addRow(entry);
    return origFetch.apply(this, arguments).then(function (resp) {
      entry.status = resp.status;
      entry.end = Date.now();
      updateRow(entry);
      return resp;
    }).catch(function (err) {
      entry.status = 'ERR';
      entry.end = Date.now();
      updateRow(entry);
      throw err;
    });
  };

  // --- Intercept XMLHttpRequest ---
  var origOpen = XMLHttpRequest.prototype.open;
  var origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._rl = { method: (method || 'GET').toUpperCase(), url: url };
    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    if (this._rl) {
      var entry = { id: ++counter, method: this._rl.method, url: this._rl.url, status: null, start: Date.now(), end: null };
      addRow(entry);
      var self = this;
      this.addEventListener('loadend', function () {
        entry.status = self.status || 'ERR';
        entry.end = Date.now();
        updateRow(entry);
      });
    }
    return origSend.apply(this, arguments);
  };

  // --- Intercept sendBeacon ---
  if (navigator.sendBeacon) {
    var origBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url, data) {
      var entry = { id: ++counter, method: 'BEACON', url: url, status: '—', start: Date.now(), end: Date.now() };
      addRow(entry);
      return origBeacon(url, data);
    };
  }

  console.log('[Request Logger] Active — tracking fetch, XHR & sendBeacon');
})();
