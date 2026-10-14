/* 站点行为：主题、导航、元信息。所有页面共用。 */
(function () {
  var KEY = 'flowdoc.theme';
  var root = document.documentElement;

  function isDark() { return root.dataset.theme === 'dark'; }

  function persist(dark) {
    try { localStorage.setItem(KEY, dark ? 'dark' : 'light'); } catch (e) {}
  }

  function syncButtons() {
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].textContent = isDark() ? '切换为浅色' : '切换为深色';
      btns[i].setAttribute('aria-pressed', isDark() ? 'true' : 'false');
    }
  }

  function toggle() {
    root.dataset.theme = isDark() ? 'light' : 'dark';
    persist(isDark());
    syncButtons();
    window.dispatchEvent(new CustomEvent('site:theme'));
  }

  function markCurrentLink() {
    var here = (location.pathname.split('/').pop() || 'index.html');
    try { here = decodeURIComponent(here); } catch (e) {}
    var links = document.querySelectorAll('.nav-links a');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (href === here) links[i].setAttribute('aria-current', 'page');
    }
  }

  function fillMeta() {
    var slots = document.querySelectorAll('[data-meta]');
    for (var i = 0; i < slots.length; i++) {
      var kind = slots[i].getAttribute('data-meta');
      if (kind === 'verified' || kind === 'extracted') slots[i].textContent = SITE_META[kind];
      if (kind === 'source') { slots[i].href = SITE_META.source; slots[i].textContent = '打开在线页面'; }
      if (kind === 'repo') { slots[i].href = SITE_META.repo; slots[i].textContent = '源码仓库'; }
    }
  }

  function fillCounts() {
    var els = document.querySelectorAll('[data-count]');
    var total = 0;
    for (var m = 0; m < MODULES.length; m++) total += MODULES[m].items.length;
    var lab = {
      modules: MODULES.length,
      features: total,
      numbers: NUMBERS.length,
      stores: STORES.length,
      lanes: LANES.length,
      nodes: NODES.length,
      edges: EDGES.length
    };
    for (var i = 0; i < els.length; i++) {
      var k = els[i].getAttribute('data-count');
      if (lab[k] != null) els[i].textContent = lab[k];
    }
  }

  /* 滚动揭示：进视野播一次，之后不回退。参数与线上应用逐字一致。
     各页板块容器不统一（说明卡是 section、功能清单是 .split、流程图是 .stage），
     所以由脚本给 .shell 的直属子块补 .reveal，不在四个 HTML 里各写一遍。 */
  function initReveal() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;   // 不加 reveal-on，CSS 基础态就是可见
    var kids = document.querySelectorAll('.shell > *');
    try {
      var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (!entries[i].isIntersecting) continue;
          entries[i].target.classList.add('visible');
          io.unobserve(entries[i].target);
        }
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      for (var i = 1; i < kids.length; i++) {        // 第 0 块是首屏 hero，交给 fade-up 进场
        var el = kids[i];
        if (el.classList.contains('pager') || el.tagName === 'FOOTER') continue;
        el.classList.add('reveal');
        var r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) el.classList.add('visible');
        else io.observe(el);
      }
      root.classList.add('reveal-on');
    } catch (e) { root.classList.remove('reveal-on'); }
  }

  document.addEventListener('DOMContentLoaded', function () {
    markCurrentLink();
    fillMeta();
    fillCounts();
    syncButtons();
    initReveal();
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) btns[i].addEventListener('click', toggle);
    var p = document.querySelector('[data-print]');
    if (p) p.addEventListener('click', function () { window.print(); });
  });
})();
