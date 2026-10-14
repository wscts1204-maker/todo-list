/* 业务流程图渲染：几何全部由实测高度推出，不写死行高。 */
(function () {
  var doc = document;
  var canvas = doc.getElementById('canvas');
  if (!canvas) return;
  var wires = doc.getElementById('wires');
  var labelLayer = doc.getElementById('labels');
  var SVGNS = 'http://www.w3.org/2000/svg';

  function box(cls) {
    var n = doc.createElement('div');
    if (cls) n.className = cls;
    return n;
  }

  var LANES2 = LANES.map(function (L) { return { y:L.y, h:L.h, name:L.name, el:null }; });

  LANES2.forEach(function (L) {
    var lane = box('lane');
    var b = doc.createElement('b');
    b.textContent = L.name;
    lane.append(b);
    L.el = lane;
    canvas.append(lane);
  });

  var byId = {};
  NODES.forEach(function (n) {
    var el = box('node ' + n.k);
    el.id = 'n-' + n.id;
    el.style.left = n.x + 'px';
    el.style.top = n.y + 'px';
    el.style.width = n.w + 'px';
    var h = doc.createElement('h4'); h.textContent = n.t;
    var p = doc.createElement('p'); p.textContent = n.b;
    el.append(h, p);
    if (n.key) { var s = doc.createElement('span'); s.className = 'key'; s.textContent = n.key; el.append(s); }
    canvas.append(el);
    byId[n.id] = el;
  });

  var BAND_GAP = 26, LANE_TOP = 40, LANE_BOT = 30;
  var Y0 = {};
  NODES.forEach(function (n) { Y0[n.id] = n.y; });
  var LANE0 = LANES.map(function (L) { return { y:L.y, h:L.h }; });
  function laneIndexOf(y) {
    for (var i = 0; i < LANE0.length; i++) if (y >= LANE0[i].y && y < LANE0[i].y + LANE0[i].h) return i;
    return LANE0.length - 1;
  }
  var bottom = 0;
  function autoLayout() {
    var H = {};
    NODES.forEach(function (n) { H[n.id] = byId[n.id].offsetHeight; });
    var cursor = 0;
    LANES2.forEach(function (L, li) {
      L.y = cursor;
      var mine = NODES.filter(function (n) { return laneIndexOf(Y0[n.id]) === li; });
      var rows = mine.map(function (n) { return Y0[n.id]; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
      var row = cursor + LANE_TOP;
      rows.forEach(function (y0) {
        var band = mine.filter(function (n) { return Y0[n.id] === y0; });
        var hMax = Math.max.apply(null, band.map(function (n) { return H[n.id]; }));
        band.forEach(function (n) { byId[n.id].style.top = row + 'px'; n.y = row; });
        row += hMax + BAND_GAP;
      });
      L.h = row - BAND_GAP + LANE_BOT - L.y;
      L.el.style.top = L.y + 'px';
      L.el.style.height = L.h + 'px';
      cursor = L.y + L.h;
    });
    bottom = LANES2[LANES2.length - 1].y + LANES2[LANES2.length - 1].h;
    canvas.style.height = (bottom + 30) + 'px';
  }

  function boxOf(id) {
    var n = byId[id];
    var l = n.offsetLeft, t = n.offsetTop, w = n.offsetWidth, h = n.offsetHeight;
    return { l:l, t:t, r:l + w, b:t + h, w:w, h:h };
  }
  function anchor(b, side) {
    var s = typeof side === 'string' ? side : side.s;
    var f = typeof side === 'string' ? 0.5 : (side.f == null ? 0.5 : side.f);
    if (s === 'left') return { x:b.l, y:b.t + b.h * f };
    if (s === 'right') return { x:b.r, y:b.t + b.h * f };
    if (s === 'top') return { x:b.l + b.w * f, y:b.t };
    return { x:b.l + b.w * f, y:b.b };
  }

  function route(a, z, fs, ts) {
    if (typeof fs !== 'string') fs = fs.s;
    if (typeof ts !== 'string') ts = ts.s;
    var pts = [a];
    if (fs === 'bottom' && ts === 'top') {
      if (Math.abs(a.x - z.x) < 2) pts.push(z);
      else { var my = Math.round((a.y + z.y) / 2); pts.push({ x:a.x, y:my }, { x:z.x, y:my }, z); }
    } else if ((fs === 'left' && ts === 'right') || (fs === 'right' && ts === 'left')) {
      var mx = Math.round((a.x + z.x) / 2);
      pts.push({ x:mx, y:a.y }, { x:mx, y:z.y }, z);
    } else if (fs === 'bottom' && (ts === 'left' || ts === 'right')) {
      pts.push({ x:a.x, y:z.y }, z);
    } else if ((fs === 'left' || fs === 'right') && ts === 'top') {
      pts.push({ x:z.x, y:a.y }, z);
    } else if (fs === 'bottom' && ts === 'bottom') {
      pts.push({ x:a.x, y:Math.max(a.y, z.y) + 16 }, { x:z.x, y:Math.max(a.y, z.y) + 16 }, { x:z.x, y:z.y });
    } else {
      var my2 = Math.round((a.y + z.y) / 2);
      pts.push({ x:a.x, y:my2 }, { x:z.x, y:my2 }, z);
    }
    return pts;
  }

  function marker(id, fill) {
    var mk = doc.createElementNS(SVGNS, 'marker');
    mk.setAttribute('id', id);
    mk.setAttribute('viewBox', '0 0 10 10');
    mk.setAttribute('refX', '9'); mk.setAttribute('refY', '5');
    mk.setAttribute('markerWidth', '7'); mk.setAttribute('markerHeight', '7');
    mk.setAttribute('orient', 'auto-start-reverse');
    var p = doc.createElementNS(SVGNS, 'path');
    p.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    p.setAttribute('fill', fill);
    mk.append(p);
    return mk;
  }

  function drawWires() {
    autoLayout();
    wires.setAttribute('height', bottom + 30);
    wires.textContent = '';
    labelLayer.setAttribute('height', bottom + 30);
    labelLayer.textContent = '';
    var defs = doc.createElementNS(SVGNS, 'defs');
    defs.append(marker('arr', 'var(--primary-strong)'), marker('arr-thin', 'var(--primary)'), marker('arr-gray', 'var(--neutral-line)'));
    wires.append(defs);

    EDGES.forEach(function (edge) {
      var fid = edge[0], tid = edge[1], o = edge[2] || {};
      var from = boxOf(fid), to = boxOf(tid);
      var fs = o.fs || 'bottom', ts = o.ts || 'top';
      var pts = route(anchor(from, fs), anchor(to, ts), fs, ts);
      var d = 'M ' + pts[0].x + ' ' + pts[0].y;
      for (var i = 1; i < pts.length; i++) d += ' L ' + pts[i].x + ' ' + pts[i].y;

      var p = doc.createElementNS(SVGNS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('fill', 'none');
      var w = o.dash ? '1.6' : (o.thin ? '1.7' : '2.2');
      p.setAttribute('stroke', o.dash ? 'var(--neutral-line)' : (o.thin ? 'var(--primary)' : 'var(--primary-strong)'));
      p.setAttribute('stroke-width', w);
      p.dataset.base = w;
      if (o.dash) { p.setAttribute('stroke-dasharray', '5 4'); p.classList.add('dash'); }
      p.setAttribute('marker-end', o.dash ? 'url(#arr-gray)' : (o.thin ? 'url(#arr-thin)' : 'url(#arr)'));
      p.dataset.from = fid; p.dataset.to = tid;
      wires.append(p);

      if (o.label) {
        var mid = pts.length > 2 ? pts[Math.floor(pts.length / 2)] : { x:(pts[0].x + pts[1].x) / 2, y:(pts[0].y + pts[1].y) / 2 };
        var g = doc.createElementNS(SVGNS, 'g');
        g.dataset.from = fid; g.dataset.to = tid;
        var txt = doc.createElementNS(SVGNS, 'text');
        txt.textContent = o.label;
        txt.setAttribute('x', mid.x); txt.setAttribute('y', mid.y + 4);
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('font-size', '12');
        txt.setAttribute('fill', 'var(--state-warn-ink)');
        var wpx = o.label.length * 12 + 14;
        var rect = doc.createElementNS(SVGNS, 'rect');
        rect.setAttribute('x', Math.round(mid.x - wpx / 2)); rect.setAttribute('y', mid.y - 10);
        rect.setAttribute('width', wpx); rect.setAttribute('height', 20);
        rect.setAttribute('rx', 10);
        rect.setAttribute('fill', 'var(--state-warn-bg)');
        rect.setAttribute('stroke', 'var(--state-warn-line)');
        rect.setAttribute('stroke-width', '1');
        g.append(rect, txt);
        labelLayer.append(g);
      }
    });
  }

  var sel = null;
  function applySel() {
    NODES.forEach(function (n) { byId[n.id].classList.toggle('sel', sel === n.id); });
    var all = Array.prototype.slice.call(wires.children).concat(Array.prototype.slice.call(labelLayer.children));
    all.forEach(function (node) {
      if (!node.dataset || !node.dataset.from) return;
      var hit = sel === null || node.dataset.from === sel || node.dataset.to === sel;
      node.style.opacity = hit ? '1' : '0.12';
      if (node.tagName === 'path') {
        node.setAttribute('stroke-width', hit && sel !== null ? '3' : (node.dataset.base || '2'));
      }
    });
  }
  canvas.addEventListener('click', function (e) {
    var b = e.target;
    while (b && b !== canvas && !(b.classList && b.classList.contains('node'))) b = b.parentElement;
    if (!b || b === canvas) return;
    var id = b.id.slice(2);
    sel = (sel === id) ? null : id;
    applySel();
  });

  var stage = doc.getElementById('stage');
  var scaler = doc.getElementById('scaler');
  var zlabel = doc.getElementById('zoom-label');
  var fitBtn = doc.getElementById('zoom-fit');
  var zoom = 1, isFit = true;
  function setZoom(z, fitMode) {
    zoom = Math.min(1.3, Math.max(0.3, z));
    isFit = !!fitMode;
    scaler.style.transform = 'scale(' + zoom + ')';
    stage.style.height = Math.ceil((bottom + 30) * zoom + 16) + 'px';
    zlabel.textContent = Math.round(zoom * 100) + '%';
    fitBtn.classList.toggle('on', isFit);
  }
  function doFit() { setZoom(Math.min(1, (stage.clientWidth - 18) / 1520), true); }
  doc.getElementById('zoom-in').addEventListener('click', function () { setZoom(zoom + 0.1, false); });
  doc.getElementById('zoom-out').addEventListener('click', function () { setZoom(zoom - 0.1, false); });
  fitBtn.addEventListener('click', doFit);

  function relayout() { drawWires(); applySel(); if (isFit) doFit(); }
  window.addEventListener('site:theme', relayout);
  relayout();
  doc.addEventListener('DOMContentLoaded', relayout);
  window.addEventListener('load', relayout);
  var rt = null;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(relayout, 120); });
})();
