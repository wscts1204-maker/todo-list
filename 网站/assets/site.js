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

  document.addEventListener('DOMContentLoaded', function () {
    markCurrentLink();
    fillMeta();
    fillCounts();
    syncButtons();
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) btns[i].addEventListener('click', toggle);
    var p = document.querySelector('[data-print]');
    if (p) p.addEventListener('click', function () { window.print(); });
  });
})();
