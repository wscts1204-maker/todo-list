/* 各页面的内容渲染：功能清单（带侧栏目录与搜索）、关键数字表、存储卡片。 */
(function () {
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function idOf(name) { return 'm-' + name; }
  function itemText(pair) { return pair[0] + '：' + pair[1]; }

  /* —— 功能清单页 —— */
  function renderFeatures() {
    var host = document.getElementById('mod-list');
    if (!host) return;
    var toc = document.getElementById('side-toc');
    var total = 0;

    MODULES.forEach(function (m, mi) {
      total += m.items.length;
      var block = el('section', 'mod-block');
      block.id = idOf(m.name);
      var head = el('div', 'mod-head');
      head.append(
        el('span', 'no', (mi + 1 < 10 ? '0' : '') + (mi + 1)),
        el('h3', null, m.name),
        el('span', 'count', m.items.length + ' 项')
      );
      var grid = el('div', 'feat-grid');
      m.items.forEach(function (pair) {
        var card = el('div', 'feat');
        card.dataset.hay = itemText(pair).toLowerCase();
        card.append(el('b', 'feat-term', pair[0]), el('p', 'feat-desc', pair[1]));
        grid.append(card);
      });
      block.append(head, grid);
      host.append(block);

      var a = el('a', null);
      a.href = '#' + block.id;
      a.append(el('span', null, m.name), el('s', null, String(m.items.length)));
      var li = el('li');
      li.append(a);
      toc && toc.append(li);
    });

    var counter = document.getElementById('feat-total');
    if (counter) counter.textContent = '共 ' + MODULES.length + ' 个模块 ' + total + ' 项';

    var input = document.getElementById('feat-search');
    var clear = document.getElementById('feat-clear');
    var boxes = host.querySelectorAll('.mod-block');
    var tip = el('p', 'empty-tip', '没有匹配的能力条目，换个关键词试试。');
    host.append(tip);
    tip.hidden = true;

    function apply() {
      var q = (input.value || '').trim().toLowerCase();
      var shown = 0;
      for (var b = 0; b < boxes.length; b++) {
        var cards = boxes[b].querySelectorAll('.feat');
        var vis = 0;
        for (var c = 0; c < cards.length; c++) {
          var hit = !q || cards[c].dataset.hay.indexOf(q) > -1;
          cards[c].hidden = !hit;
          if (hit) vis++;
        }
        boxes[b].hidden = vis === 0;
        boxes[b].querySelector('.count').textContent = q ? vis + ' 项匹配' : cards.length + ' 项';
        shown += vis;
      }
      tip.hidden = shown !== 0;
      var s = document.getElementById('side-toc');
      if (s) for (var i = 0; i < s.children.length; i++) s.children[i].hidden = boxes[i].hidden;
    }

    if (input) {
      input.addEventListener('input', apply);
      clear.addEventListener('click', function () { input.value = ''; apply(); input.focus(); });
    }

    /* 侧栏当前章节高亮 */
    var links = toc ? toc.querySelectorAll('a') : [];
    function spy() {
      var best = 0, bestTop = -1e9;
      for (var i = 0; i < boxes.length; i++) {
        if (boxes[i].hidden) continue;
        var top = boxes[i].getBoundingClientRect().top - 120;
        if (top <= 0 && top > bestTop) { bestTop = top; best = i; }
      }
      for (var j = 0; j < links.length; j++) links[j].classList.toggle('cur', j === best);
    }
    window.addEventListener('scroll', spy, { passive:true });
    window.addEventListener('resize', spy);
    spy();
  }

  /* —— 关键数字表 —— */
  function renderNumbers() {
    var nt = document.getElementById('num-table');
    if (!nt) return;
    var thead = el('thead');
    var htr = el('tr');
    ['项目', '上限 / 取值', '源码依据'].forEach(function (s) { htr.append(el('th', null, s)); });
    thead.append(htr);
    var tbody = el('tbody');
    NUMBERS.forEach(function (row) {
      var tr = el('tr');
      tr.append(el('td', null, row[0]), el('td', null, row[1]), el('td', null));
      tr.children[2].append(el('code', null, row[2]));
      tbody.append(tr);
    });
    nt.append(thead, tbody);
    var c = document.getElementById('num-count');
    if (c) c.textContent = NUMBERS.length + ' 项';
  }

  /* —— 存储卡片 —— */
  function renderStores() {
    var host = document.getElementById('store-grid');
    if (!host) return;
    STORES.forEach(function (pair) {
      var box = el('div', 'store');
      box.append(el('h3', null, pair[0]), el('p', null, pair[1]));
      host.append(box);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderFeatures();
    renderNumbers();
    renderStores();
  });
})();
