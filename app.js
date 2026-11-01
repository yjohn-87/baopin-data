(function () {
  'use strict';
  // #shop / #hot / #buzz / #cart / #jh = 旧的完整版（v5 原样），其它 = 简单版。
  function boot() {
  var m = /^#(jh|shop|hot|buzz|cart)$/.exec(location.hash);
  window.addEventListener('hashchange', function () { location.reload(); });
  if (m) {
    var link = document.querySelector('link[rel=stylesheet]'); if (link) link.parentNode.removeChild(link);
    var st = document.createElement('style'); st.textContent = V5_CSS + '\n.back-simple{display:inline-flex;align-items:center;padding:0 12px;height:44px;border-radius:12px;border:1px solid #e0d6c2;background:#fff;color:#2b795f;font-weight:600;text-decoration:none;white-space:nowrap}';
    document.head.appendChild(st);
    document.title = '更多 · 进货';
    document.body.className = ''; document.body.innerHTML = V5_BODY;
    runV5(m[1]);
  } else {
    runShop();
  }
  }
  // ===== v7「按我的店铺进货」：每个图案 / 每个机型×壳型都配 1688 货源 =====
  function runShop() {
    var data = {}, view = 'd', q = '', model = '', type = '', limit = 40;
    function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
    function arr(v) { return Array.isArray(v) ? v : []; }
    function num(v) { return typeof v === 'number' && isFinite(v); }
    function str(v) { return typeof v === 'string' || num(v) ? String(v) : ''; }
    function esc(v) { return str(v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function parse(v) { try { return JSON.parse(v); } catch (e) { return null; } }
    function el(k) { return document.getElementById(k); }
    function yuan(v) { return num(v) ? '¥' + Math.round(v * 100) / 100 : ''; }
    function dollars(pr) { pr = arr(pr); return pr.length ? '$' + pr[0] + (pr[1] !== pr[0] ? '–' + pr[1] : '') : ''; }
    function city(l) { return str(l).replace(/(市|县|区)$/, ''); }
    function thumb(p) { return typeof p === 'string' && /^thumbs\/[a-zA-Z0-9_-]+\.webp$/.test(p) ? p : ''; }
    function offer(o) { return /^\d+$/.test(str(o)) ? 'https://detail.1688.com/offer/' + o + '.html' : ''; }
    function search(k) { return 'https://m.1688.com/offer_search/-6D7033.html?keywords=' + encodeURIComponent(k); }
    function okUrl(u) { return typeof u === 'string' && /^https:\/\/[^\s"]+$/.test(u) ? u : ''; }
    function short(m) { return str(m).replace(/\s*pro max/i, 'PM').replace(/\s*pro$/i, 'P').replace(/\s*plus/i, 'Plus').replace(/\s*air/i, 'Air').replace(/\s+/g, ''); }
    function a(u, t, cls) { return okUrl(u) ? '<a class="' + cls + '" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + t + '</a>' : ''; }
    function D() { return obj(obj(data.jh).designs); }
    function models() { return arr(D().models); }
    var LV = { 1: ['same', '1688 名字对上的款（对比一下图）'], 2: ['like', '1688 相似款，点进去看图确认'], 3: ['style', '没搜到同名款，这是最接近的一家，看图挑'] };

    function dCard(d) {
      var b = obj(d.b), ms = arr(d.md).map(function (i) { return short(models()[i]); }), lv = LV[b.lv] || null, u = offer(b.o);
      var img = thumb(d.th) ? '<img src="./' + esc(d.th) + '" alt="' + esc(d.n) + '" loading="lazy">' : '<span class="ph">📱</span>';
      var im = b.im ? '<img class="s-1688img" src="https://cbu01.alicdn.com/' + esc(b.im) + '_120x120.jpg" alt="1688 图" loading="lazy" referrerpolicy="no-referrer">' : '';
      return '<article class="s-card">' +
        '<div class="s-img">' + img + (d.c === 'acc' ? '<span class="s-badge">配件</span>' : '') + '</div><div class="s-body">' +
        '<h2>' + esc(d.n) + '</h2>' +
        '<p class="s-mine">店里 ' + d.k + ' 个 · 卖 ' + esc(dollars(d.pr)) + '</p>' +
        (ms.length ? '<p class="s-models">' + esc(ms.slice(0, 6).join(' · ')) + (ms.length > 6 ? ' 等 ' + ms.length + ' 个机型' : '') + '</p>' : '') +
        (u && b.lv !== 3 ? '<div class="s-sup ' + lv[0] + '">' + im + '<div><p class="s-lv">' + esc(lv[1]) + '</p>' +
          '<p class="s-cost">进价 <b>' + yuan(b.p) + '</b> / 个' + (num(b.q) ? '<span>' + b.q + ' 件起批</span>' : '') + '</p>' +
          '<p class="s-shop">🏭 ' + esc(b.s || '1688 商家') + (b.l ? ' · ' + esc(city(b.l)) : '') + '</p></div></div>' +
          a(u, '去 1688 下单', 's-buy') +
          (arr(d.o).length ? '<details class="s-other"><summary>看其他货源</summary><ul>' + arr(d.o).map(oLine).join('') + '</ul></details>' : '')
          : '<p class="s-todo">待找货源 · 1688 没搜到同名款</p>' + a(search((d.q || d.n) + (d.c === 'acc' ? ' 气囊支架' : ' 手机壳')), '去 1688 搜「' + esc(d.q || d.n) + '」', 's-buy') +
          (u ? '<details class="s-other"><summary>看搜到的最接近几家</summary><ul>' + [[b.s, b.o, b.p, b.l]].concat(arr(d.o)).map(oLine).join('') + '</ul></details>' : '')) +
        '</div></article>';
    }
    function oLine(o) { return '<li>' + a(offer(o[1]), esc(o[0] || '1688 商家'), '') + '<span>' + yuan(o[2]) + (o[3] ? ' · ' + esc(city(o[3])) : '') + '</span></li>'; }
    function gCard(g) {
      var offers = arr(g.offers).map(obj).filter(function (o) { return okUrl(o.u); });
      return '<article class="s-card s-group"><div class="s-body">' +
        '<h2>' + esc(g.model) + ' · ' + esc(g.type ? g.type + '壳' : '壳型没标') + '</h2>' +
        '<p class="s-mine">店里 ' + g.n + ' 个 · ' + g.nd + ' 个图案 · 卖 ' + esc(dollars([g.pmin, g.pmax])) + '</p>' +
        '<p class="s-models">' + esc(arr(g.designs).slice(0, 5).join('、')) + (g.nd > 5 ? '…' : '') + '</p>' +
        (offers.length ? '<ul class="s-blank">' + offers.map(function (o) {
          return '<li><div><b>' + esc(o.type) + '空壳 ' + yuan(o.cost) + '</b><small>' + (num(o.moq) ? o.moq + ' 件起 · ' : '') + esc(city(o.loc)) + (o.fit ? '' : ' · 标题没写这个机型，下单时选规格确认') + '</small></div>' + a(o.u, '去 1688 下单', 's-buy small') + '</li>';
        }).join('') + '</ul>' : '<p class="s-todo">待找货源</p>') +
        '</div></article>';
    }
    function passD(d) {
      if (q && (d.n + ' ' + (d.q || '')).toLowerCase().indexOf(q.toLowerCase()) < 0) return false;
      if (model !== '' && arr(d.md).indexOf(Number(model)) < 0) return false;
      if (type && (type === '其他' ? d.ty : d.ty !== type)) return false;
      return true;
    }
    function passG(g) {
      if (q && (str(g.model) + ' ' + arr(g.designs).join(' ')).toLowerCase().indexOf(q.toLowerCase()) < 0) return false;
      if (model !== '' && str(g.model).trim().toLowerCase() !== models()[Number(model)]) return false;
      if (type && (type === '其他' ? g.type : (type === '镜面' ? g.type !== '硬壳' : g.type !== type))) return false;
      return true;
    }
    function render() {
      var ds = arr(D().items).map(obj), gs = arr(obj(obj(data.jh).shop).groups).map(obj);
      var found = ds.filter(function (d) { return d.b && d.b.lv !== 3; }).length;
      el('sum').textContent = '店里 ' + ds.reduce(function (s, d) { return s + (d.k || 0); }, 0) + ' 个商品、' + ds.length + ' 个图案：' + found + ' 个在 1688 找到货，' + (ds.length - found) + ' 个待找';
      el('views').innerHTML = [['d', '按图案（成品）'], ['g', '按机型（空壳）']].map(function (v) { return '<button data-view="' + v[0] + '" class="' + (view === v[0] ? 'on' : '') + '">' + v[1] + '</button>'; }).join('');
      var sel = el('model'); if (!sel.options.length) sel.innerHTML = '<option value="">全部机型</option>' + models().map(function (m, i) { return '<option value="' + i + '">' + esc(m) + '</option>'; }).join('');
      el('chips').innerHTML = ['全部', '透明', '镜面', '其他'].map(function (c) { var v = c === '全部' ? '' : c; return '<button data-type="' + v + '" class="' + (type === v ? 'on' : '') + '">' + c + '</button>'; }).join('');
      var list = view === 'd' ? ds.filter(passD) : gs.filter(passG);
      el('count').textContent = list.length ? '共 ' + list.length + (view === 'd' ? ' 个图案，店里上架多的排前面' : ' 组机型×壳型') : '';
      el('list').innerHTML = list.slice(0, limit).map(view === 'd' ? dCard : gCard).join('') || '<p class="s-empty">没有符合的，换个机型或关键词试试。</p>';
      el('moreBtn').hidden = list.length <= limit;
      el('moreBtn').textContent = '再看 ' + Math.min(40, list.length - limit) + ' 个（还有 ' + (list.length - limit) + ' 个）';
      var stamp = Date.parse(data.collected_at || data.generated_at), h = isNaN(stamp) ? null : Math.max(0, Math.floor((Date.now() - stamp) / 3600000));
      el('updated').textContent = (h === null ? '' : '数据更新于 ' + (h >= 48 ? Math.floor(h / 24) + ' 天前' : h < 1 ? '刚刚' : h + ' 小时前') + ' · ') + '进价以 1688 页面为准，只帮你找货，不代付';
    }
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-view],[data-type],#moreBtn');
      if (!t) return;
      if (t.id === 'moreBtn') { limit += 40; render(); return; }
      if (t.hasAttribute('data-view')) { view = t.getAttribute('data-view'); limit = 40; }
      else type = t.getAttribute('data-type');
      render();
    });
    var timer = null;
    document.addEventListener('input', function (e) { if (e.target.id === 'q') { clearTimeout(timer); timer = setTimeout(function () { q = e.target.value.trim(); limit = 40; render(); }, 250); } });
    document.addEventListener('change', function (e) { if (e.target.id === 'model') { model = e.target.value; limit = 40; render(); } });
    var xhr = new XMLHttpRequest();
    xhr.open('GET', './data.json?t=' + Date.now(), true); xhr.timeout = 15000;
    function fail() { var c = null; try { c = parse(localStorage.getItem('baopin_v5_data')); } catch (e2) {} if (c && typeof c === 'object') { data = c; render(); el('notice').textContent = '网络不通，显示上次的数据。'; } else el('notice').textContent = '加载失败，刷新再试。'; }
    xhr.onload = function () { var d = parse(xhr.responseText); if (xhr.status >= 200 && xhr.status < 300 && d && typeof d === 'object') { data = d; try { localStorage.setItem('baopin_v5_data', xhr.responseText); } catch (e3) {} el('notice').textContent = ''; render(); } else fail(); };
    xhr.onerror = fail; xhr.ontimeout = fail; xhr.send();
  }
  var V5_CSS = ":root {\n  font-family: -apple-system, BlinkMacSystemFont, \"PingFang SC\", \"Microsoft YaHei\", sans-serif;\n  color: #262b26;\n  background: #fbf7ef;\n  font-size: 16px;\n  line-height: 1.65;\n}\n* { box-sizing: border-box; }\nbody { margin: 0; padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px)); }\nmain, header, footer { max-width: 480px; margin: 0 auto; padding: 0 16px; }\n\n/* header */\nheader {\n  display: flex; align-items: center; justify-content: space-between; gap: 10px;\n  padding: 16px 16px 12px; position: sticky; top: 0; z-index: 6;\n  background: #fbf7efed; backdrop-filter: blur(6px);\n  border-bottom: 1px solid #eadfca;\n}\n.eyebrow { font-size: 13px; color: #a06c38; margin: 0; font-weight: 600; }\nh1 { font-size: 22px; line-height: 1.3; margin: 2px 0 0; }\n#refresh {\n  flex-shrink: 0; width: 44px; height: 44px; border-radius: 50%; font-size: 19px;\n  display: flex; align-items: center; justify-content: center; padding: 0;\n}\n#notice { max-width: 480px; margin: 0 auto; padding: 8px 16px 0; color: #8a6a35; font-size: 13px; min-height: 1px; }\n\n/* generic */\nbutton {\n  border-radius: 12px; background: linear-gradient(#fff, #f2eee5); border: 1px solid #e0d6c2;\n  box-shadow: inset 0 1px 0 rgba(255,255,255,.6), 0 2px 0 #d9cdb3, 0 3px 8px rgba(0,0,0,.06);\n  color: #2e332c; font: inherit; font-weight: 600; cursor: pointer; transition: transform 100ms, box-shadow 100ms;\n}\nbutton:active { transform: translateY(1px); box-shadow: inset 0 2px 4px #0002; }\nbutton:focus-visible, a:focus-visible, input:focus-visible, summary:focus-visible { outline: 3px solid #2b795f; outline-offset: 2px; }\na { color: #27694f; text-decoration: underline; text-underline-offset: 3px; font-weight: 600; }\na:active { opacity: .7; }\n[hidden] { display: none !important; }\n.muted { color: #726c5e; font-size: 14px; }\n\n/* explain banner */\n.explain { background: #efe9da; color: #5c5547; border-radius: 12px; padding: 12px 14px; margin: 14px 0; font-size: 13.5px; }\n.staleness-warning { background: #fff2cf; color: #704a0a; border: 1px solid #dfb44e; border-radius: 12px; padding: 12px 14px; margin: 14px 0 0; box-shadow: 0 2px 0 #e4c77f; font-size: 13.5px; }\n.staleness-warning small { display: block; margin-top: 6px; }\n.stale-sources { color: #704a0a; font-size: 13px; }\n\n/* review card */\n.review-card { overflow-wrap: anywhere; background: #fff8ec; border-left: 4px solid #e2a04f; border-radius: 14px; padding: 16px; margin-bottom: 16px; box-shadow: 0 3px 14px rgba(70,45,20,.08); }\n.review-card h2 { font-size: 16px; margin: 0 0 10px; display: flex; align-items: center; gap: 8px; }\n.review-card small { font-size: 12px; font-weight: normal; background: #fff1df; border-radius: 20px; padding: 3px 8px; white-space: nowrap; }\n.review-card ul { padding-left: 18px; margin: 0 0 8px; }\n.review-card li { margin: 6px 0; font-size: 14.5px; }\n.review-card p { font-size: 12px; color: #8a8375; margin: 0; }\n.review-notice { font-size: 14px; color: #8a8375; margin: 8px 0 0; }\n.review-notice.warn { color: #8a5a06; background: #fff2cf; border-radius: 10px; padding: 8px 10px; font-weight: 600; }\n\n/* card (picks tab) */\n.card, .panel { background: #fff; border: 1px solid #ece6d9; border-radius: 16px; box-shadow: 0 4px 16px #52462d0d; margin-bottom: 14px; padding: 14px; overflow: hidden; }\n.card-top { display: flex; gap: 12px; }\n.photo { object-fit: cover; display: block; background: #efe8db; border-radius: 12px; flex-shrink: 0; }\n.card-photo { width: 64px; height: 64px; }\n.placeholder { display: flex; align-items: center; justify-content: center; background: radial-gradient(at 20% 10%, #faf0d8, transparent 60%), linear-gradient(140deg, #e2eee4, #e9dece); font-weight: 700; letter-spacing: 1px; color: #737b68; font-size: 20px; }\n.card-head { flex: 1; min-width: 0; }\n.card-head h2 { font-size: 17px; line-height: 1.35; margin: 0 0 6px; overflow-wrap: anywhere; }\n.tags { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }\n.tag { font-size: 12px; background: #f1ece0; color: #716a56; border-radius: 999px; padding: 3px 9px; font-weight: 600; }\n.pill { display: inline-block; border-radius: 999px; padding: 4px 10px; font-size: 13px; white-space: nowrap; font-weight: 700; border: 1px solid transparent; }\n.pill.tiny { font-size: 11.5px; padding: 3px 8px; }\n.hot { background: #ffe9d8; color: #a13914; border-color: #f0c5a3; }\n.buy { background: #dcf3e1; color: #246342; border-color: #bad6bf; }\n.wait { background: #ececea; color: #5e625d; }\n.risk { background: #fff2cf; color: #8a5a06; border-color: #dfb44e; }\n.match { background: #dfeafd; color: #1e5aa8; }\n.candidate { background: #fde8d8; color: #a15b1a; }\n\n.why { font-size: 13.5px; color: #6c6657; margin: 10px 0 0; }\n.risk-warning { font-size: 13.5px; font-weight: 700; color: #9a3b19; background: #fdece3; border-radius: 10px; padding: 8px 12px; margin: 10px 0 0; }\n\n.heat { display: flex; align-items: center; gap: 10px; margin: 10px 0; }\n.heat-label { font-size: 13px; font-weight: 700; color: #4a4d44; white-space: nowrap; }\n.heat-track { flex: 1; height: 8px; border-radius: 5px; background: #efe9de; overflow: hidden; }\n.heat-fill { display: block; height: 100%; background: linear-gradient(90deg, #e4a66c, #c0652f); border-radius: 5px; }\n\n.facts { padding-left: 18px; margin: 10px 0; font-size: 14.5px; }\n.facts li { margin: 5px 0; }\n\n.profit-box { border-radius: 10px; padding: 10px 12px; margin: 10px 0; font-size: 14.5px; font-weight: 600; }\n.profit-box.good { background: #e8f6ec; color: #1f6e46; }\n.profit-box.bad { background: #fdece3; color: #9a3b19; }\n.profit-box.warn { background: #fff2cf; color: #8a5a06; }\n.profit-box.unknown { background: #f1ece0; color: #726c5e; font-weight: 500; }\n\n.more-toggle { width: 100%; margin-top: 4px; min-height: 42px; }\n.more { border-top: 1px solid #ece6d9; margin-top: 12px; padding-top: 4px; font-size: 14px; overflow-wrap: anywhere; }\n.more section + section { border-top: 1px solid #f1ece0; margin-top: 6px; padding-top: 2px; }\n.more h3 { font-size: 13px; color: #a06c38; margin: 10px 0 4px; }\n.detail-list { list-style: none; padding: 0; margin: 0; }\n.detail-list li { padding: 5px 0; border-bottom: 1px dashed #f1ece0; font-size: 14px; }\n.detail-list li:last-child { border-bottom: none; }\n.detail-list a { display: inline-block; margin-left: 4px; font-size: 14px; }\n\n/* profit comparison tab */\n.settings p { color: #6c6657; font-size: 13.5px; }\n.settings h2 { font-size: 16px; margin: 0 0 8px; }\nlabel { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 14px 0; font-size: 14px; }\ninput { font: inherit; width: 90px; border: 1px solid #cfc8bb; border-radius: 9px; padding: 7px; background: #fffdf9; box-shadow: inset 0 2px 4px #00000008; }\n\n.comparison .compare-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }\n.compare-photo { width: 52px; height: 52px; }\n.compare-head h2 { font-size: 16px; margin: 0; overflow-wrap: anywhere; }\n.mini-table { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 0 0 8px; }\n.mini-table dt { color: #837c6c; font-size: 12.5px; }\n.mini-table dd { margin: 2px 0 0; font-weight: 700; overflow-wrap: anywhere; font-size: 14px; }\n.buy-link { display: inline-block; margin-top: 4px; }\n\n/* 货源 (1688 suppliers) */\n.sourcing-toggle { margin-top: 10px; }\n.more.sourcing { padding-top: 8px; }\n.sup-pick { background: #e8f6ec; color: #1f6e46; border-radius: 10px; padding: 8px 12px; margin: 4px 0 10px; font-size: 14px; font-weight: 700; }\n.sup-pick.warn { background: #fff2cf; color: #8a5a06; }\n.supplier-list { list-style: none; padding: 0; margin: 0; }\n.supplier { border: 1px solid #ece6d9; border-radius: 12px; padding: 10px 12px; margin-bottom: 10px; background: #fffdf9; }\n.supplier.picked { border-color: #bad6bf; background: #f6fbf7; box-shadow: 0 2px 0 #dcefe1; }\n.sup-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 14.5px; overflow-wrap: anywhere; }\n.sup-title { margin: 4px 0 8px; font-size: 13px; color: #6c6657; overflow-wrap: anywhere; }\n.sup-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px 10px; margin: 0; }\n.sup-grid dt { color: #837c6c; font-size: 12px; }\n.sup-grid dd { margin: 1px 0 0; font-weight: 700; font-size: 13.5px; overflow-wrap: anywhere; }\n.sup-grid dd.na { color: #a39c8c; font-weight: 500; }\n.sup-tiers { margin: 8px 0 0; font-size: 12.5px; color: #4a4d44; }\n.sup-flag { margin: 6px 0 0; font-size: 12.5px; font-weight: 700; color: #8a5a06; }\n.sup-link { display: inline-block; margin-top: 6px; font-size: 14px; }\n.sup-meta { font-size: 12px; color: #8a8375; margin: 2px 0 6px; }\n.sourcing-extra h2 small { font-size: 11.5px; vertical-align: middle; margin-left: 4px; }\n\n/* abroad tab */\n.group-title { font-size: 14px; color: #a06c38; margin: 18px 4px 10px; font-weight: 700; }\n.group-title:first-child { margin-top: 2px; }\n.abroad-row, .amazon-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }\n.abroad-photo { width: 52px; height: 52px; }\n.abroad-body h3 { font-size: 15px; margin: 0 0 3px; }\n.abroad-body p { margin: 0 0 4px; font-size: 13.5px; color: #4a4d44; }\n.abroad-body p.decline { color: #9a3b19; }\n.small-link { font-size: 13px; padding: 0; }\n.country-status { font-size: 13px; color: #4a4d44; margin: 0 4px 10px; }\n.country-status.warn { color: #8a5a06; }\n.amazon-body { flex: 1; min-width: 0; }\n.amazon-title { font-size: 14px; margin: 0 0 4px; overflow-wrap: anywhere; }\n.amazon-price { margin: 0; font-size: 13.5px; font-weight: 700; color: #246342; }\n\n/* buzz tab */\n.signal { padding: 12px 14px; }\n.signal-top { display: flex; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }\n.signal-title { margin: 0 0 4px; font-size: 14.5px; overflow-wrap: anywhere; }\n.signal-heat { margin: 0 0 4px; font-size: 13px; color: #726c5e; }\n\n/* footer */\nfooter { color: #726c5e; font-size: 13px; padding: 4px 16px 16px; }\nfooter .panel { box-shadow: none; background: #f3eee4; margin-bottom: 10px; }\nfooter summary { cursor: pointer; font-weight: 600; font-size: 14px; }\nfooter p { overflow-wrap: anywhere; }\n.updated-at { padding-left: 2px; }\n\n/* bottom tab bar */\n#tabs {\n  position: fixed; left: 0; right: 0; bottom: 0; z-index: 7;\n  display: grid; grid-template-columns: repeat(4, 1fr);\n  background: #fffdf8f5; backdrop-filter: blur(8px);\n  border-top: 1px solid #eadfca;\n  padding: 6px 8px calc(6px + env(safe-area-inset-bottom, 0px));\n  max-width: 480px; margin: 0 auto;\n  box-shadow: 0 -4px 14px rgba(0,0,0,.05);\n}\n#tabs button {\n  background: none; border: none; box-shadow: none; border-radius: 12px;\n  padding: 8px 2px; font-size: 13px; font-weight: 600; color: #726c5e;\n  min-height: 48px; display: flex; align-items: center; justify-content: center;\n}\n#tabs button.active { background: #e9f2ea; color: #1f6e46; }\n#tabs button:active { transform: none; box-shadow: none; }\n\n@media (min-width: 540px) {\n  main, header, footer, #tabs { max-width: 560px; }\n}\n@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }\n\n/* ===== v5「1688 值得进货」 ===== */\n.hbtns { display: flex; gap: 8px; align-items: center; }\n#cartBtn { height: 44px; padding: 0 12px; font-size: 14px; white-space: nowrap; display: flex; align-items: center; gap: 6px; }\n#cartBtn b { background: #c0652f; color: #fff; border-radius: 999px; padding: 0 7px; font-size: 12px; line-height: 20px; }\n.toolbar { padding: 8px 0; margin: 0; }\n.toolbar input[type=search] { width: 100%; padding: 10px 12px; border-radius: 12px; font-size: 15px; }\n.frow { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }\n.frow::-webkit-scrollbar { display: none; }\n.frow select { font: inherit; font-size: 13.5px; border: 1px solid #e0d6c2; border-radius: 999px; padding: 6px 10px; background: #fff; flex-shrink: 0; }\n.fchip { flex-shrink: 0; border-radius: 999px; padding: 6px 12px; font-size: 13.5px; box-shadow: none; }\n.fchip.on { background: #2b795f; color: #fff; border-color: #2b795f; }\n.count { font-size: 13px; color: #6c6657; margin: 4px 0 10px; }\n.small { font-size: 12.5px; }\n.card.jh .fold { all: unset; display: block; width: 100%; cursor: pointer; }\n.card.jh .fold:focus-visible { outline: 3px solid #2b795f; border-radius: 10px; }\n.caret { color: #a06c38; font-size: 18px; padding-left: 4px; align-self: center; }\n.pill.score { background: #eef0fb; color: #3b4a8a; border-color: #d3d8f0; }\n.jh-sum { margin: 12px 0 4px; grid-template-columns: repeat(4, minmax(0, 1fr)); }\n.chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }\n.chip { font-size: 12.5px; border-radius: 999px; padding: 3px 9px; background: #f1ece0; color: #5c5547; font-weight: 600; }\n.chip.lv-hi { background: #fdece3; color: #9a3b19; }\n.chip.lv-mid { background: #fff2cf; color: #8a5a06; }\n.chip.lv-lo { background: #e8f6ec; color: #1f6e46; }\n.sup-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 8px; }\n.addbox { display: inline-flex; gap: 6px; align-items: center; }\n.addbox input { width: 76px; padding: 7px; }\nbutton.add { padding: 7px 12px; font-size: 14px; background: linear-gradient(#3a8f71, #2b795f); color: #fff; border-color: #2b795f; box-shadow: 0 2px 0 #1f5c47; }\n.shop-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }\n.shop-head h2, .shop-sum h2, .cgroup h2, .csum h2 { font-size: 16px; margin: 0 0 6px; }\n.cgroup h2 small, .csum h2 small { display: block; font-size: 12.5px; color: #726c5e; font-weight: 500; }\n.otable { width: 100%; border-collapse: collapse; font-size: 13.5px; margin-top: 6px; }\n.otable th { text-align: left; color: #837c6c; font-weight: 600; font-size: 12px; padding: 4px 4px; border-bottom: 1px solid #ece6d9; }\n.otable td { padding: 7px 4px; border-bottom: 1px dashed #f1ece0; vertical-align: middle; }\n.otable td.act { text-align: right; }\n.otable td.act .addbox input { width: 58px; }\n.otable td.act .addbox button.add { padding: 6px 8px; font-size: 12.5px; }\n.otable td.act a { font-size: 13px; margin-left: 6px; white-space: nowrap; }\n.clist { list-style: none; padding: 0; margin: 0; }\n.cline { border-top: 1px dashed #ece6d9; padding: 10px 0; }\n.cl-main b { display: block; font-size: 14px; overflow-wrap: anywhere; }\n.cl-main small { color: #837c6c; font-size: 12px; }\n.cl-num { display: flex; align-items: center; gap: 8px; margin-top: 6px; font-size: 14px; }\n.cl-num input { width: 84px; }\n.cl-act { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }\n.link-btn { all: unset; color: #9a3b19; font-size: 13.5px; cursor: pointer; text-decoration: underline; }\n.cbtns { display: flex; gap: 8px; flex-wrap: wrap; }\n.cbtns button { padding: 9px 14px; }\n.cbtns .danger { color: #9a3b19; }\n@media (max-width: 420px) {\n  .jh-sum { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .otable th:nth-child(4), .otable td:nth-child(4) { display: none; }\n}\n\n/* ===== v5b 布局：手机单列；≥768 顶部导航 + 铺满；≥1024 左侧筛选栏 + 3 列；≥1440 4 列 ===== */\nhtml, body { overflow-x: hidden; max-width: 100%; }\n#layout { max-width: 480px; margin: 0 auto; padding: 0 16px; }\n#layout > main { padding: 0; max-width: none; }\n#side { position: sticky; top: 77px; z-index: 5; background: #fbf7efee; backdrop-filter: blur(6px); margin: 0 -16px; padding: 0 16px; }\n.grid > *, .card, .panel { min-width: 0; }\n.otable { table-layout: auto; }\n.otable td.act .addbox { flex-wrap: wrap; justify-content: flex-end; }\nimg, table { max-width: 100%; }\n#drawer { position: fixed; inset: 0; z-index: 20; }\n.dw-mask { position: absolute; inset: 0; background: rgba(30,30,20,.35); }\n.dw-panel { position: absolute; top: 0; right: 0; bottom: 0; width: min(460px, 92vw); background: #fbf7ef; box-shadow: -8px 0 30px rgba(0,0,0,.18); display: flex; flex-direction: column; }\n.dw-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid #eadfca; }\n.dw-head h2 { margin: 0; font-size: 17px; }\n#dwClose { width: 40px; height: 40px; padding: 0; border-radius: 50%; }\n#drawerBody { overflow-y: auto; overflow-x: hidden; padding: 14px 18px 24px; flex: 1; }\n#drawerBody .grid { display: block; }\n#drawerBody .grid > * { margin-bottom: 12px; }\nbody.drawer-open { overflow: hidden; }\n@media (min-width: 540px) and (max-width: 767px) { #layout { max-width: 560px; } }\n@media (min-width: 768px) {\n  body { padding-bottom: 24px; }\n  header, #notice, #layout, footer { max-width: 1600px; padding-left: 24px; padding-right: 24px; }\n  header { position: static; border-bottom: none; padding-top: 14px; padding-bottom: 8px; backdrop-filter: none; background: transparent; }\n  #tabs { position: sticky; top: 0; bottom: auto; max-width: none; margin: 0; display: flex; justify-content: center; gap: 4px;\n    padding: 6px max(24px, calc((100vw - 1600px) / 2 + 24px)); border-top: none; border-bottom: 1px solid #eadfca; box-shadow: 0 4px 12px rgba(0,0,0,.04); }\n  #tabs button { min-height: 40px; padding: 6px 22px; font-size: 15px; flex: 0 0 auto; }\n  #tabs button.active { box-shadow: inset 0 -3px 0 #2b795f; }\n  #side { top: 53px; margin: 0; padding: 0; }\n  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: start; }\n  .grid > * { margin-bottom: 0; }\n  .grid + *, .more.grid { margin-top: 14px; }\n  .card, .panel { padding: 12px; border-radius: 14px; }\n  .card-head h2, .compare-head h2 { font-size: 15.5px; }\n  .card-photo { width: 52px; height: 52px; }\n  .supplier { padding: 8px 10px; }\n  .sup-title { font-size: 12.5px; margin: 2px 0 6px; }\n  .explain { margin: 8px 0 12px; padding: 10px 12px; font-size: 13px; }\n}\n@media (min-width: 1024px) {\n  body.has-side #layout { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 20px; align-items: start; }\n  #side { top: 64px; background: #fff; border: 1px solid #ece6d9; border-radius: 14px; padding: 12px 14px; box-shadow: 0 4px 16px #52462d0d; max-height: calc(100vh - 80px); overflow-y: auto; }\n  #side .toolbar { padding: 0; }\n  #side .frow { flex-direction: column; align-items: stretch; gap: 8px; margin-top: 10px; }\n  #side .frow select, #side .fchip { width: 100%; text-align: left; border-radius: 10px; padding: 8px 12px; }\n  .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }\n  .jh-sum { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 10px; }\n  .sup-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .otable th:nth-child(4), .otable td:nth-child(4) { display: none; }\n  .otable td.act .addbox input { width: 52px; }\n}\n@media (min-width: 1440px) {\n  .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }\n}\n";
  var V5_BODY = "<header>\n  <div class=\"header-text\">\n    <p class=\"eyebrow\">飞总的进货参考 · moomin.vip</p>\n    <h1>1688 值得进货</h1>\n  </div>\n  <div class=\"hbtns\"><a class=\"back-simple\" href=\"./\">← 简单版</a><button id=\"cartBtn\" aria-label=\"进货单\">🧾 进货单</button><button id=\"refresh\" aria-label=\"刷新数据\">↻</button></div>\n</header>\n<nav id=\"tabs\" aria-label=\"页面分类\"></nav>\n<p id=\"notice\" role=\"status\">正在加载…</p>\n<div id=\"layout\"><aside id=\"side\" aria-label=\"搜索和筛选\" hidden></aside><main id=\"content\"></main></div>\n<footer id=\"footer\"></footer>\n<div id=\"drawer\" hidden><div class=\"dw-mask\" data-close></div><section class=\"dw-panel\" role=\"dialog\" aria-label=\"进货单\"><div class=\"dw-head\"><h2>🧾 进货单</h2><button id=\"dwClose\" aria-label=\"关闭\">✕</button></div><div id=\"drawerBody\"></div></section></div>";
function runV5(START) {
  'use strict';
  // Verdict thresholds: hot >=40; buy >=25 OR >=15 with premium >=10% / daily wants >=100.
  var RULES = { hot: 40, buy: 25, emerging: 15, premium: 0.10, dailyWant: 100 };
  var data = {}, displayedRows = [], active = START || 'jh', defaults = { ship: 15, kg: 0.3, mult: 2.5 };
  var settings = obj(parse(read('baopin_v5_settings')));
  // Migrate v4's saved settings once: v5 key is empty but the old key has usable numbers.
  if (!read('baopin_v5_settings')) {
    var legacy = obj(parse(read('baopin_h5_settings'))), migrated = {}, migratedAny = false;
    Object.keys(defaults).forEach(function (k) {
      var n = Number(legacy[k]);
      if (legacy[k] !== undefined && legacy[k] !== null && legacy[k] !== '' && isFinite(n) && n >= 0) { migrated[k] = n; migratedAny = true; }
    });
    if (migratedAny) { settings = migrated; save('baopin_v5_settings', JSON.stringify(settings)); }
  }

  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function num(v) { return typeof v === 'number' && isFinite(v); }
  function str(v) { return typeof v === 'string' || num(v) ? String(v) : '暂无'; }
  function esc(v) { return str(v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function parse(v) { try { return JSON.parse(v); } catch (e) { return null; } }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function el(k) { return document.getElementById(k); }

  // Only ever link to human-readable pages — never RSS/JSON/API endpoints.
  function url(v) {
    if (typeof v !== 'string' || !/^https:\/\//.test(v) || /\s/.test(v)) return '';
    try {
      var p = new URL(v), ep = /^(rss|atom|feed|feeds|api|graphql)$/, file = /\.(xml|json|rss|atom)$/;
      var labels = p.hostname.toLowerCase().split('.'), ok = !!p.hostname, i, segs;
      for (i = 0; i < labels.length; i++) if ((i < labels.length - 2 && ep.test(labels[i])) || /-api$/.test(labels[i])) ok = false;
      segs = decodeURIComponent(p.pathname).toLowerCase().replace(/\\/g, '/').split('/');
      for (i = 0; i < segs.length; i++) if (ep.test(segs[i]) || file.test(segs[i])) ok = false;
      p.searchParams.forEach(function (v, k) { if (/^(format|output|alt)$/i.test(k) && /^(json|xml|rss|atom)$/i.test(v)) ok = false; });
      return ok ? v : '';
    } catch (e) { return ''; }
  }
  function link(u, t, cls) { return url(u) ? '<a class="' + (cls || '') + '" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(t || '去看看 ›') + '</a>' : ''; }
  function yuan(v) { return num(v) ? '¥' + String(Math.round(v * 100) / 100) : '暂无'; }
  // Collapses float arithmetic noise to 6 decimals before any display rounding — mirrors review.py's
  // clean(). Without this, the exact same formula (e.g. cost 13.05, sell 32.05, ship 15, kg 0.3 ->
  // 32.05-13.05-4.5) can land on 14.499999999999996 and round differently from the identical, already-
  // clean 14.5 the other side of the page/pipeline is holding (Codex round-4/5: card showed ¥14, review
  // bullet showed ¥15, for data that never actually changed). Sign-aware (Math.sign * Math.round(abs*1e6))
  // so it's symmetric for negative values too, matching Python's Decimal-based clean().
  function cleanNum(v) { return Math.sign(v) * Math.round(Math.abs(v) * 1e6) / 1e6; }
  // Round half away from zero: ties (…X.5) round away from zero for both positive and negative numbers —
  // the same tie-break as Python's Decimal ROUND_HALF_UP, so a tie can never resolve differently between
  // languages. (Native Math.round alone is NOT this: Math.round(-14.5) === -14, not -15.)
  function roundHalfAway(v, decimals) { var f = Math.pow(10, decimals || 0); return Math.sign(v) * Math.round(Math.abs(v) * f) / f; }
  // Mirrors review.py's rounded(v, price): <10 yuan prices get one decimal, everything else (including
  // all profits) is a plain integer — always computed from a cleanNum()-ed raw value, never from a value
  // someone else already pre-rounded to 2 decimals (that double-rounding is exactly what let the card and
  // the review bullet disagree on the same real number).
  function reviewRounded(v, price) { var c = cleanNum(v); return price && Math.abs(c) < 10 ? roundHalfAway(c, 1) : roundHalfAway(c, 0); }
  // The exact string rendered to the reader. Fixes the decimal digit count (toFixed(1) in the <10 price
  // branch) so this and Python's format_amount() can never disagree over a trailing zero — e.g. a price
  // that cleanly rounds to 10 after the <10 branch must print "10.0" on both sides, never "10" vs "10.0".
  // This is the only reliable way to know whether two amounts would actually show the same thing to the
  // reader — raw numeric diffs/tolerances can't tell (see reviewAssumptionsNotice()'s use of this).
  function reviewDisplay(v, price) {
    var c = cleanNum(v), usePrice = price && Math.abs(c) < 10;
    return usePrice ? roundHalfAway(c, 1).toFixed(1) : String(roundHalfAway(c, 0));
  }
  function usd(v) { return num(v) ? '$' + String(Math.round(v * 100) / 100) : '暂无'; }
  function integer(v) { return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function count(v) { return !num(v) ? '暂无' : v >= 1e8 ? (v / 1e8).toFixed(1) + '亿' : v >= 1e4 ? (v / 1e4).toFixed(1) + '万' : integer(v); }
  function pct(v) { return Math.round(v) + '%'; }
  function title(p) { return typeof p.t === 'string' && p.t ? p.t : '暂无商品名'; }
  function path(p) { return typeof p.th === 'string' && /^thumbs\/[a-zA-Z0-9_-]+\.webp$/.test(p.th) ? p.th : ''; }
  function initials(p) { var t = title(p), words = t.split(/\s+/); return /^[a-z]/i.test(t) && words.length > 1 ? words[0].charAt(0) + words[1].charAt(0) : t.slice(0, 2); }
  function photo(p, cls) { return path(p) ? '<img class="photo ' + (cls || '') + '" src="./' + esc(path(p)) + '" alt="' + esc(title(p)) + '" loading="lazy">' : '<div class="photo placeholder ' + (cls || '') + '" aria-label="' + esc(title(p)) + '">' + esc(initials(p)) + '</div>'; }
  function cost(p) { var c = obj(p.cost); return num(c.p) ? c.p : num(p.sp) ? p.sp : null; }
  function basis(p) { var b = str(obj(p.cost).b); return /速卖通|ali/i.test(b) ? '速卖通' : '1688'; }
  // Sell price: real 闲鱼/得物 price when comparable (cost >= 10% of it, guards unit/set mismatch); else cost x multiplier.
  // Third element flags why: 'market' = real sell price used, 'mult' = no market price at all, 'mismatch' = market price exists but units aren't comparable.
  function marketPrice(p) { var x = obj(p.xy), d = obj(p.dw); return num(x.med) && x.med > 0 ? [x.med, '闲鱼'] : num(d.ask) && d.ask > 0 ? [d.ask, '得物'] : null; }
  function sellPrice(p) {
    var c = cost(p), m = marketPrice(p);
    if (c === null) return null;
    if (!m) return [c * settings.mult, '按进价×' + settings.mult, 'mult'];
    if (c >= m[0] * 0.1) return [m[0], '按' + m[1] + '卖价', 'market'];
    return [c * settings.mult, '按进价×' + settings.mult, 'mismatch'];
  }
  // Cleaned (cleanNum()) immediately, at the single source of truth for every caller — mirrors
  // review.py's pricing(), which does `profit=clean(profit)` before risk_flags() ever looks at the sign.
  // Without this, a mathematically-zero profit (e.g. 8.04 - 3.54 - 15*0.3 = -8.881784197001252e-16, pure
  // float noise) reads as a real loss here (`n < 0` true on the raw float) while review.py's already-clean
  // 0 reads as no loss — same data, same formula, opposite loss/tag/stance verdict on the two sides. Every
  // loss/risk/verdict decision in this file reads profit() (never the raw subtraction again), so cleaning
  // once here keeps all of them — including the -0 case, where cleanNum() can produce -0 but `-0 < 0` is
  // false in JS, matching Python's clean(-8.88e-16) rounding to 0.0, also not a loss — in lockstep with
  // review.py's clean(profit) semantics.
  function profit(p) { var c = cost(p), s = sellPrice(p); return c === null || !s ? null : cleanNum(s[0] - c - settings.ship * settings.kg); }
  // Mirrors review.py's pricing() comparable semantics: true = market price used, false = unit mismatch
  // (market price exists but cost <10% of it — a real risk), null/undefined = no market price at all
  // (plain multiplier estimate, NOT a risk). Used to detect when the review's frozen comparable flag
  // has flipped relative to the current card.
  function comparableFlag(p) { var c = cost(p), sp = sellPrice(p); if (c === null || !sp) return undefined; return sp[2] === 'market' ? true : sp[2] === 'mismatch' ? false : null; }
  // 正品授权未核实：s88.flag、s88.rows[].flag 或 cost.b 任一提示未核实。
  function authUnverified(p) {
    var s = obj(p.s88), c = obj(p.cost);
    return s.flag === '正品授权未核实' || arr(s.rows).some(function (r) { return obj(r).flag === '正品授权未核实'; }) || /未核实/.test(str(c.b));
  }
  // Collects every reason a positive buy-signal would be misleading for this product.
  function riskFlags(p) {
    var n = profit(p), sp = sellPrice(p), out = [];
    if (authUnverified(p)) out.push('auth');
    if (sp && sp[2] === 'mismatch') out.push('mismatch');
    if (n !== null && n < 0) out.push('loss');
    return out;
  }
  function riskWarning(p) {
    var risks = riskFlags(p), msgs = [];
    if (risks.indexOf('auth') >= 0) msgs.push('⚠️ 正品授权未核实，进货前先核实');
    if (risks.indexOf('mismatch') >= 0) msgs.push('⚠️ 单位不可比，利润仅按倍数估');
    if (risks.indexOf('loss') >= 0) msgs.push('⚠️ 按现价可能亏');
    return msgs.length ? '<p class="risk-warning">' + msgs.map(esc).join('；') + '</p>' : '';
  }
  function profitBox(p) {
    var n = profit(p), sp = sellPrice(p);
    if (n === null) return '<p class="profit-box unknown">进价和卖价数据不全，先看详情再判断</p>';
    if (sp && sp[2] === 'mismatch') return '<p class="profit-box warn">⚠️ 单位不可比，利润仅按倍数估（约¥' + reviewDisplay(n, false) + '，不可靠）</p>';
    if (n < 0) return '<p class="profit-box bad">⚠️ 按现在的价格可能不赚钱（估算）</p>';
    // Authorization risk alone still gets a positive number — never paint that green, or it reads as a buy signal.
    if (authUnverified(p)) return '<p class="profit-box warn">估算赚 ¥' + reviewDisplay(n, false) + '，但正品授权未核实，先核实再进</p>';
    return '<p class="profit-box good">一件大约能赚 <b>¥' + reviewDisplay(n, false) + '</b>（估算，' + sp[1] + '）</p>';
  }
  function verdict(p) {
    var s = num(p.sc) ? p.sc : 0, d = obj(p.dw), x = obj(p.xy);
    var base = s >= RULES.hot ? ['hot', '🔥 正在爆'] :
      s >= RULES.buy || (s >= RULES.emerging && (num(d.prem) && d.prem >= RULES.premium || num(x.wd) && x.wd >= RULES.dailyWant)) ? ['buy', '✅ 值得进货'] :
      ['wait', '👀 再观望'];
    // Never show a green/buy signal when the numbers can't support it — downgrade to an amber neutral tag instead.
    if (riskFlags(p).length) {
      if (base[0] === 'hot') return ['risk', '🔥 很火，但要小心'];
      if (base[0] === 'buy') return ['risk', '⚠️ 先别急着进'];
    }
    return base;
  }
  function reason(p) {
    var parts = obj(p.pt), words = { discuss: '多个平台在热议', search: '最近搜索的人变多了', sales: '已经有人在买', resale: '二手市场有人关注', newrel: '刚上市新品' }, best = '', score = 0;
    Object.keys(words).forEach(function (k) { if (num(parts[k]) && parts[k] > score) { best = words[k]; score = parts[k]; } });
    return best;
  }
  function sold(a) { return num(a.n) ? a.n.toLocaleString() + (typeof a.s === 'string' && a.s.indexOf('+') >= 0 ? '+' : '') : typeof a.s === 'string' ? a.s.replace(/sold/gi, '').trim() : ''; }
  function facts(p) {
    var out = [], c = cost(p), x = obj(p.xy), d = obj(p.dw), a = obj(p.ali), pm = obj(p.pm);
    if (c !== null) out.push('进价约 ' + yuan(c) + '（' + basis(p) + '）' + (/未核实/.test(str(obj(p.cost).b)) ? '·未核实' : ''));
    if (num(x.med)) out.push('闲鱼卖 ' + yuan(x.med) + (num(x.want) ? '，' + integer(x.want) + ' 人想要' : ''));
    if (num(d.prem)) out.push('得物比发售价' + (d.prem >= 0 ? '高 ' : '低 ') + pct(Math.abs(d.prem) * 100));
    if (sold(a)) out.push('速卖通已卖 ' + sold(a) + ' 件');
    if (url(pm.u)) out.push('泡泡玛特官网新品' + (num(pm.p) ? ' · $' + pm.p : ''));
    if (arr(p.pl).length) out.push('上了 ' + arr(p.pl).length + ' 个热榜');
    return out.slice(0, 3).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
  }
  function tier(v) { var out = arr(v).filter(function (r) { return Array.isArray(r) && r.length > 1; }).map(function (r) { return str(r[0]) + ' ' + yuan(r[1]); }); return out.length ? ' · ' + out.join(' / ') : ''; }
  function plain(t) { var names = { 'AliExpress': '速卖通', 'Google Trends TH': '泰国搜索', 'Google Trends VN': '越南搜索', 'Google Trends KH': '柬埔寨搜索', 'Amazon US 手机配件': '美国亚马逊热卖' }; return names[t] || t; }

  function detail(p) {
    var groups = [[], [], [], []], seenU = Object.create(null), seenT = Object.create(null), d = obj(p.dw), x = obj(p.xy), s = obj(p.s88), a = obj(p.ali), pm = obj(p.pm), c = cost(p);
    // De-dup by text only; if the link was already shown elsewhere, keep the row but omit the repeated link (never drop the row itself).
    function line(g, t, u) {
      if (!t || seenT[t]) return;
      seenT[t] = true;
      var showLink = url(u) && !seenU[u];
      if (showLink) seenU[u] = true;
      groups[g].push('<li>' + esc(t) + (showLink ? ' ' + link(u) : '') + '</li>');
    }
    var countries = { TH: '泰国', VN: '越南', KH: '柬埔寨', US: '美国' }, gt = obj(p.gt);
    Object.keys(countries).forEach(function (k) {
      if (num(gt[k])) {
        var badge = arr(p.b).map(obj).filter(function (b) { return typeof b.label === 'string' && (b.label.indexOf(k) >= 0 || b.label.indexOf(countries[k]) >= 0); })[0] || {};
        line(3, countries[k] + '搜索量 ' + (gt[k] >= 0 ? '+' : '') + pct(gt[k]) + (/量太小/.test(str(badge.label)) ? '（搜索人数还不多）' : ''), badge.u);
      }
    });
    if (num(p.x)) line(0, '海外社交平台讨论 ' + (p.x >= 0 ? '+' : '') + pct(p.x), (arr(p.b).map(obj).filter(function (b) { return /讨论/.test(str(b.type) + ' ' + str(b.label)); })[0] || {}).u);
    if (arr(p.pl).length) line(0, '上榜平台：' + arr(p.pl).filter(function (v) { return typeof v === 'string'; }).map(plain).join('、'));
    arr(p.m).slice(0, 3).map(obj).forEach(function (m) { line(0, plain(str(m.pl)) + '：' + str(m.t) + (num(m.h) ? ' · 热度 ' + count(m.h) : ''), m.u); });
    if (sold(a)) line(2, '速卖通已卖 ' + sold(a) + ' 件', a.u);
    if (num(a.pc) || num(a.p)) line(1, '速卖通进价 ' + (num(a.pc) ? yuan(a.pc) : '$' + a.p), a.u);
    if (num(s.p) || num(s.pa)) line(1, '1688 进价 ' + yuan(num(s.p) ? s.p : s.pa) + (num(s.rep) ? '，回头客 ' + pct(s.rep) : '') + tier(s.tiers), s.u);
    if (num(p.sp)) line(1, '1688 进价 ' + yuan(p.sp), p.su);
    arr(s.rows).slice(0, 3).map(obj).forEach(function (r) { line(1, '1688：' + str(r.t) + ' · ' + yuan(r.p) + tier(r.tiers) + (num(r.rep) ? '，回头客 ' + pct(r.rep) : ''), r.u); });
    if (s.flag || arr(s.rows).some(function (r) { return obj(r).flag; }) || /未核实/.test(str(obj(p.cost).b))) line(1, '⚠️ 这个货源可能不是正品授权，进货前请核实');
    if (url(p.s1688)) line(1, '去1688找同款货源', p.s1688);
    if (num(x.med) || num(x.want)) line(2, '闲鱼 ' + yuan(x.med) + (num(x.want) ? '，' + integer(x.want) + ' 人想要' : '') + (num(x.wd) ? '，今天新增 ' + integer(x.wd) + ' 人想要' : ''));
    arr(x.rows).slice(0, 3).map(obj).forEach(function (r) { line(2, '闲鱼：' + str(r.t) + ' · ' + yuan(r.p) + (num(r.w) ? '，' + integer(r.w) + ' 人想要' : ''), r.u); });
    if (num(x.min)) line(2, '闲鱼最低挂价 ' + yuan(x.min) + (num(x.off) ? '，参考发售价 ' + yuan(x.off) : ''));
    if (num(d.sold)) line(2, '得物已卖 ' + count(d.sold) + ' 件');
    if (Object.keys(d).length) line(2, '得物最低 ' + yuan(d.ask) + '，发售价 ' + yuan(d.off) + (num(d.prem) ? '（' + (d.prem >= 0 ? '高 ' : '低 ') + pct(Math.abs(d.prem) * 100) + '）' : ''));
    arr(d.rows).slice(0, 3).map(obj).forEach(function (r) { line(2, '得物：' + str(r.t) + ' · ' + yuan(r.ask) + '，发售价 ' + yuan(r.off) + (r.mm ? ' · 整盒价，不能直接比' : '') + (typeof r.d === 'string' ? ' · 发售 ' + r.d : '') + (num(r.sold) ? ' · 已卖 ' + count(r.sold) + ' 件' : ''), r.u); });
    if (url(pm.u)) line(0, '泡泡玛特官网新品' + (typeof pm.t === 'string' ? '：' + pm.t : '') + (num(pm.p) ? ' · $' + pm.p : '') + (typeof pm.d === 'string' ? '，发售 ' + pm.d : ''), pm.u);
    // The final "=" amount uses the same integer profit display as the card/bullet (reviewDisplay), not
    // yuan()'s generic 2-decimal format — otherwise this line, the profit box and the review bullet could
    // each show a different number for the exact same underlying profit.
    if (c !== null && sellPrice(p)) line(2, '一件大约赚：卖价 ' + yuan(sellPrice(p)[0]) + '（' + sellPrice(p)[1] + '）− 进价 ' + yuan(c) + ' − 运费 ' + yuan(settings.ship * settings.kg) + ' = ¥' + reviewDisplay(profit(p), false) + '（估算）' + (sellPrice(p)[2] === 'mismatch' ? '，进价和卖价单位不可比，此估算不可靠' : ''));
    var heads = ['为什么火', '去哪进货', '能卖多少钱', '海外情况'];
    return heads.map(function (h, i) { return '<section><h3>' + h + '</h3><ul class="detail-list">' + (groups[i].join('') || '<li>暂无</li>') + '</ul></section>'; }).join('');
  }

  function heatBar(sc) {
    var n = num(sc) ? Math.max(0, Math.min(100, sc)) : 0;
    return '<div class="heat"><span class="heat-label">热度 ' + (num(sc) ? Math.round(sc) : '暂无') + '</span><span class="heat-track"><span class="heat-fill" style="width:' + n + '%"></span></span></div>';
  }

  function card(p, i) {
    var v = verdict(p), rs = reason(p);
    return '<article class="card" data-item="' + i + '">' +
      '<div class="card-top">' + photo(p, 'card-photo') +
      '<div class="card-head"><h2>' + esc(title(p)) + '</h2>' +
      '<div class="tags"><span class="tag">' + esc(str(p.c)) + '</span><span class="pill ' + v[0] + '">' + v[1] + '</span></div></div></div>' +
      (rs ? '<p class="why">' + esc(rs) + '</p>' : '') +
      riskWarning(p) +
      heatBar(p.sc) +
      '<ul class="facts">' + facts(p) + '</ul>' +
      profitBox(p) +
      '<button class="more-toggle" data-more aria-expanded="false">看详情 ▾</button>' +
      '<div class="more" hidden>' + detail(p) + '</div></article>';
  }

  function comparison(p, i) {
    var c = cost(p), x = obj(p.xy), d = obj(p.dw), a = obj(p.ali), s = obj(p.s88), cells = [];
    function cell(label, value) { cells.push('<div><dt>' + label + '</dt><dd>' + esc(value) + '</dd></div>'); }
    if (c !== null) cell('进价约', yuan(c) + '（' + basis(p) + '）' + (/未核实/.test(str(obj(p.cost).b)) ? ' · 未核实' : ''));
    if (num(x.med)) cell('闲鱼卖', yuan(x.med));
    if (num(d.ask)) cell('得物最低', yuan(d.ask));
    var buyLink = link(url(obj(p.cost).u) || (basis(p) === '速卖通' ? url(a.u) : (url(s.u) || url(p.su) || url(p.s1688))), '去进货 ›', 'buy-link');
    return '<article class="panel comparison" data-item="' + i + '"><div class="compare-head">' + photo(p, 'compare-photo') + '<h2>' + esc(title(p)) + '</h2></div><dl class="mini-table">' + cells.join('') + '</dl>' + riskWarning(p) + profitBox(p) + buyLink + sourcingToggle(p) + '</article>';
  }

  // 货源：1688 前几家供应商（只展示抓到的真实字段，缺的写「未取到」）。
  function na(v) { return v === null || v === undefined || v === '' ? '未取到' : v; }
  function supplierRow(r, i, picked) {
    var tiers = arr(r.tiers).filter(function (t) { return Array.isArray(t) && t.length > 1 && num(t[1]); }).map(function (t) { return str(t[0]) + ' ' + yuan(t[1]); });
    var tags = arr(r.tags).filter(function (t) { return typeof t === 'string' && t; });
    function f(label, value) { return '<div><dt>' + label + '</dt><dd' + (value === '未取到' ? ' class="na"' : '') + '>' + esc(value) + '</dd></div>'; }
    return '<li class="supplier' + (picked ? ' picked' : '') + '">' +
      '<div class="sup-head"><b>' + (i + 1) + '. ' + esc(typeof r.shop === 'string' && r.shop ? r.shop : '店铺名未取到') + '</b>' + (picked ? '<span class="pill tiny buy">推荐</span>' : '') + '</div>' +
      '<p class="sup-title">' + esc(str(r.t)) + '</p>' +
      '<dl class="sup-grid">' +
      f('单价', num(r.p) ? yuan(r.p) : '未取到') +
      f('起批量', na(typeof r.moq === 'string' ? r.moq : '')) +
      f('发货地', na(typeof r.loc === 'string' ? r.loc : '')) +
      f('回头率', num(r.rep) ? pct(r.rep) : '未取到') +
      f('商家', tags.length ? tags.join(' · ') : '未取到') +
      f('销量', na(typeof r.sales === 'string' ? r.sales : '')) +
      '</dl>' +
      (tiers.length ? '<p class="sup-tiers">阶梯价：' + esc(tiers.join(' / ')) + '</p>' : '') +
      (typeof r.flag === 'string' && r.flag ? '<p class="sup-flag">⚠️ ' + esc(r.flag) + '</p>' : '') +
      link(r.u, '去 1688 看这家 ›', 'sup-link') + '</li>';
  }
  function sourcingBody(hy) {
    var rows = arr(hy.rows).map(obj), pk = obj(hy.pick), pi = num(pk.i) ? pk.i : -1;
    var d = typeof hy.at === 'string' && /^(\d{4})-(\d{2})-(\d{2})/.exec(hy.at);
    return (typeof pk.why === 'string' && pk.why ? '<p class="sup-pick' + (hy.ip ? ' warn' : '') + '">' + esc(pk.why) + '</p>' : '') +
      '<ol class="supplier-list">' + rows.map(function (r, i) { return supplierRow(r, i, i === pi); }).join('') + '</ol>' +
      '<p class="sup-meta">来源：' + esc(str(hy.src)) + (d ? ' · 抓取于 ' + Number(d[2]) + '月' + Number(d[3]) + '日' : '') + ' · 价格以 1688 页面为准' + (url(hy.more) ? ' ' + link(hy.more, '看更多货源 ›') : '') + '</p>';
  }
  function sourcingToggle(p) {
    var hy = obj(p.hy), n = arr(hy.rows).length;
    return n ? '<button class="more-toggle sourcing-toggle" data-more aria-expanded="false">看货源（' + n + ' 家） ▾</button><div class="more sourcing" hidden>' + sourcingBody(hy) + '</div>' : '';
  }
  function extraSourcing() {
    return arr(data.hy_extra).map(obj).filter(function (h) { return arr(h.rows).length; }).map(function (h) {
      return '<article class="panel comparison sourcing-extra"><div class="compare-head"><div class="photo placeholder compare-photo">📱</div><h2>' + esc(str(h.name)) + ' 货源' + (typeof h.note === 'string' ? ' <small class="tag">' + esc(h.note) + '</small>' : '') + '</h2></div>' +
        '<button class="more-toggle sourcing-toggle" data-more aria-expanded="true">收起货源（' + arr(h.rows).length + ' 家） ▴</button><div class="more sourcing">' + sourcingBody(h) + '</div></article>';
    }).join('');
  }

  function settingsPanel() {
    return '<section class="panel settings"><h2>利润怎么算</h2><p>一件大约赚 = 卖价 − 进价 − 运费。有闲鱼/得物卖价就用它，没有就按「进价 × 倍数」估。下面三个数可以改，改了马上重算。</p>' +
      [['ship', '运费（元/公斤）'], ['kg', '每件重量（公斤）'], ['mult', '卖价是进价的几倍']].map(function (x) { return '<label>' + x[1] + '<input type="number" min="0" step="any" data-setting="' + x[0] + '" value="' + settings[x[0]] + '"></label>'; }).join('') +
      '<button id="reset">恢复默认</button></section>';
  }

  function timeLabel(s) { var m = typeof s === 'string' && /T(\d{2}:\d{2})/.exec(s); return m ? m[1] : null; }
  // Every risk reason a frozen basis item carries, re-derived from its own saved fields — directly
  // comparable to riskFlags(p) on the live card (same three codes, same meaning).
  function frozenRiskFlags(it) {
    var out = [];
    if (it.auth_unverified) out.push('auth');
    if (it.comparable === false) out.push('mismatch');
    if (num(it.profit) && it.profit < 0) out.push('loss');
    return out;
  }
  // Shared stance-ceiling table — kept in exact lockstep with review.py's stance_ceiling(tag, flags). Any
  // edit here must be mirrored there (same tag domain hot/buy/risk/wait, same risk-flag codes
  // auth/mismatch/loss, same precedence): a loss (profit < 0) always caps at "avoid", regardless of tag —
  // even a "wait"-tag item (score never cleared the buy bar) that also happens to be a loss is capped at
  // "avoid", not "watch" (this is what the Codex false-positive repro got wrong: the generator only
  // downgraded a model "buy" when risky, never a model "watch" that still exceeded the loss ceiling).
  // Otherwise "risk" (another risk flag, no loss) and "wait" both cap at "watch"; "hot"/"buy" with no risk
  // at all caps at "buy". A stored stance ABOVE this ceiling is a real contradiction — e.g. the original
  // Codex repro where the model said "buy" but the card's own rule never got past 👀 再观望.
  var STANCE_ORDER = { avoid: 0, watch: 1, buy: 2 };
  function stanceCeiling(tag, riskFlags) {
    if (riskFlags.indexOf('loss') >= 0) return 'avoid';
    if (tag === 'risk' || tag === 'wait') return 'watch';
    return 'buy';
  }
  // Which displayed product names the review's rendered bullets actually mention — render_bullet() in
  // review.py always writes "<name>：", so this is a reliable (if defensive) way to tell which cards the
  // review text is really about, independent of what basis.items happens to still contain.
  function reviewedNamesFromBullets(bullets, rows) {
    return rows.map(title).filter(function (name) {
      return bullets.some(function (b) { return typeof b === 'string' && b.indexOf(name + '：') >= 0; });
    });
  }
  // Tells the reader what assumptions/snapshot the review used, and flags it clearly when today's settings or data no longer match —
  // the review is a frozen morning snapshot, so cards (not the review text) must be treated as authoritative.
  // Never claims "一致" unless the full frozen snapshot (profit, cost/sell price to the yuan-cent shown on
  // cards, comparable flag, auth flag, risk tags and product presence) was actually checked for every
  // product the review text mentions — a missing, truncated, or incomplete basis can only ever say
  // "无法完整核对", never "一致".
  function reviewAssumptionsNotice(r, rows) {
    var b = obj(r.basis), hasBasis = !!b.at;
    var ship = num(b.ship) ? b.ship : defaults.ship, kg = num(b.kg) ? b.kg : defaults.kg, mult = num(b.mult) ? b.mult : defaults.mult;
    var assumedTag = hasBasis ? '' : '（默认假设）';
    var timeTxt = hasBasis ? (timeLabel(b.at) || (typeof r.date === 'string' ? r.date : '今天早上')) : '点评数据时间未知';
    var basisTxt = '点评假设：运费' + ship + '元/kg' + assumedTag + '、每件' + kg + 'kg' + assumedTag + '、卖价是进价的' + mult + '倍' + assumedTag + '；' + timeTxt;
    var items = obj(b.items), names = Object.keys(items);
    var reviewedNames = reviewedNamesFromBullets(arr(r.bullets), rows);
    var uncheckable = !hasBasis || b.truncated || !names.length || reviewedNames.some(function (name) { return !items[name]; });
    if (uncheckable) {
      return '<p class="review-notice warn">⚠️ ' + esc(basisTxt) + '；无法完整核对点评和卡片，以卡片为准。</p>';
    }
    var missing = [], changed = [], mismatched = [];
    names.forEach(function (name) {
      var it = obj(items[name]), match = rows.filter(function (p) { return title(p) === name; })[0];
      if (!match) { missing.push(name); return; }
      // Compare what the bullet actually displayed (reviewDisplay = review.py's rounded()/format_yuan()),
      // never a raw numeric tolerance — two amounts that round to the same displayed text are the only
      // case allowed to count as unchanged (see Codex round-4: frozen ¥14.50 vs current ¥14.10 both sit
      // under the old 0.5 tolerance but display as ¥15 vs ¥14 and must be flagged as changed).
      var frozenCost = num(it.cost) ? it.cost : null, nowCost = cost(match);
      if ((frozenCost === null) !== (nowCost === null) || (frozenCost !== null && reviewDisplay(nowCost, true) !== reviewDisplay(frozenCost, true))) { changed.push(name); return; }
      var sp = sellPrice(match), frozenSell = num(it.sell) ? it.sell : null, nowSell = sp ? sp[0] : null;
      if ((frozenSell === null) !== (nowSell === null) || (frozenSell !== null && reviewDisplay(nowSell, true) !== reviewDisplay(frozenSell, true))) { changed.push(name); return; }
      var frozenProfit = num(it.profit) ? it.profit : null, nowProfit = profit(match);
      if ((frozenProfit === null) !== (nowProfit === null) || (frozenProfit !== null && reviewDisplay(nowProfit, false) !== reviewDisplay(frozenProfit, false))) { changed.push(name); return; }
      var nowCmp = comparableFlag(match);
      if (it.comparable !== undefined && nowCmp !== it.comparable) { changed.push(name); return; }
      var nowAuth = authUnverified(match);
      if (typeof it.auth_unverified === 'boolean' && nowAuth !== it.auth_unverified) { changed.push(name); return; }
      var frozenRisk = frozenRiskFlags(it).sort().join(','), nowRisk = riskFlags(match).sort().join(',');
      if (frozenRisk !== nowRisk) { changed.push(name); return; }
      // The review bullet's stance (值得进/先观望/先别进) is rendered from this frozen verdict tag — if the
      // card's current verdict pill moved to a different tag (e.g. buy -> risk, or hot -> risk), the
      // bullet's stance claim no longer matches what the card shows now.
      if (typeof it.tag === 'string' && verdict(match)[0] !== it.tag) { changed.push(name); return; }
      // The actual stance the bullet rendered (buy/watch/avoid, review.py's force_stance() result, frozen
      // into basis.items[name].stance) must never exceed what this item's own tag+risk flags allow — if it
      // does, the review text claimed more than the card's rule supports, regardless of whether anything
      // else drifted (this is what catches review.py bugs like Codex's repro, not just stale data).
      if (typeof it.stance === 'string' && STANCE_ORDER.hasOwnProperty(it.stance)) {
        var ceiling = stanceCeiling(it.tag, frozenRiskFlags(it));
        if (STANCE_ORDER[it.stance] > STANCE_ORDER[ceiling]) { mismatched.push(name); return; }
      }
    });
    var settingsChanged = settings.ship !== ship || settings.kg !== kg || settings.mult !== mult;
    var dataChanged = missing.length > 0 || changed.length > 0 || mismatched.length > 0;
    if (settingsChanged || dataChanged) {
      var reasons = [];
      if (settingsChanged) reasons.push('你改了运费/重量/倍数参数');
      if (changed.length > 0 || missing.length > 0) {
        var touched = changed.concat(missing), n = touched.length;
        reasons.push('数据已更新（' + touched.slice(0, 3).join('、') + (n > 3 ? ' 等' + n + '个' : '') + '商品变了）');
      }
      if (mismatched.length > 0) {
        reasons.push('点评结论和卡片规则有冲突（' + mismatched.slice(0, 3).join('、') + (mismatched.length > 3 ? ' 等' + mismatched.length + '个' : '') + '商品，以卡片为准）');
      }
      return '<p class="review-notice warn">⚠️ ' + esc(basisTxt) + '；' + esc(reasons.join('，')) + '，请以下面卡片为准。</p>';
    }
    return '<p class="review-notice">' + esc(basisTxt + '，目前和卡片一致。') + '</p>';
  }
  // basis.demo_note marks hand-made preview content (not a real review.daily() run) — the caption must
  // never claim "AI 根据今天数据写的" for that, since it isn't. Real pipeline output has no demo_note and
  // keeps the real note untouched.
  function reviewNoteText(r) {
    var b = obj(r.basis);
    if (typeof b.demo_note === 'string' && b.demo_note) return '⚠️ 以下是演示/示例内容，不是今天的真实点评';
    return typeof r.note === 'string' ? r.note : 'AI 根据今天数据写的，仅供参考';
  }
  // `review` defaults to data.review; a test harness can pass one explicitly without touching module state.
  function reviewCard(rows, review) {
    // Up to 5 per-item bullets plus review.py's program-generated trailing summary line (validate()'s
    // "共N个点评商品：..." row) — slice(0, 5) used to cut that summary off whenever all 5 item slots were
    // used, silently dropping the one line that's guaranteed never to contradict the bullets above it.
    var r = obj(review !== undefined ? review : data.review), bs = arr(r.bullets).filter(function (b) { return typeof b === 'string' && b.trim().length > 0 && b.length <= 80; }).slice(0, 6), date = typeof r.date === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(r.date) : null;
    if (!bs.length) return '';
    if (date) { var parsed = new Date(Number(date[1]), Number(date[2]) - 1, Number(date[3])); if (parsed.getFullYear() !== Number(date[1]) || parsed.getMonth() + 1 !== Number(date[2]) || parsed.getDate() !== Number(date[3])) date = null; }
    return '<section class="review-card"><h2>今日选品点评 ' + (date ? '<small>' + Number(date[2]) + '月' + Number(date[3]) + '日</small>' : '') + '</h2><ul>' + bs.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul><p>' + esc(reviewNoteText(r)) + '</p>' + reviewAssumptionsNotice(r, arr(rows)) + '</section>';
  }

  var COUNTRY_NAME = { TH: '泰国', VN: '越南', KH: '柬埔寨', US: '美国' };
  var COUNTRY_FLAG = { TH: '🇹🇭', VN: '🇻🇳', KH: '🇰🇭', US: '🇺🇸' };
  function sourceStatus(key) { return arr(data.sources).map(obj).filter(function (s) { return s.key === key; })[0] || null; }
  // Per-country status line: surfaces missing/thin data (e.g. Cambodia) instead of silently dropping it.
  function countryStatusLine(key, label, flag) {
    var sourceKey = 'google_' + key.toLowerCase(), s = sourceStatus(sourceKey), stale = arr(data.stale_sources).indexOf(sourceKey) >= 0;
    if (!s) return '<p class="country-status warn">' + flag + ' ' + label + '：暂无数据</p>';
    var cnt = num(s.count) ? s.count : 0;
    if (cnt === 0 || s.status !== 'OK' || stale) {
      return '<p class="country-status warn">' + flag + ' ' + label + '今天只有 ' + cnt + ' 条' + (s.reason ? '（' + esc(s.reason) + '）' : stale ? '（数据可能没更新）' : '') + '</p>';
    }
    return '<p class="country-status">' + flag + ' ' + label + '：今天采到 ' + cnt + ' 条搜索数据</p>';
  }
  function countryMoveRow(p, key, v) {
    var badge = arr(p.b).map(obj).filter(function (b) { return typeof b.label === 'string' && (b.label.indexOf(key) >= 0 || b.label.indexOf(COUNTRY_NAME[key]) >= 0); })[0] || {};
    var small = /量太小/.test(str(badge.label));
    return '<article class="panel abroad-row">' + photo(p, 'abroad-photo') +
      '<div class="abroad-body"><h3>' + esc(title(p)) + '</h3>' +
      '<p class="' + (v < 0 ? 'decline' : '') + '">' + (v >= 0 ? '+' : '') + pct(v) + (small ? '（搜索人数还不多）' : '') + '</p>' +
      link(badge.u, '看谷歌趋势 ›', 'small-link') + '</div></article>';
  }
  // Shows both gainers and decliners per country — restoring Cambodia's own section instead of only ever surfacing top positive growth.
  function countrySection(rows, key, label, flag) {
    var withVal = rows.map(function (p) { return { p: p, v: obj(p.gt)[key] }; }).filter(function (r) { return num(r.v); });
    var up = withVal.filter(function (r) { return r.v > 0; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 3);
    var down = withVal.filter(function (r) { return r.v < 0; }).sort(function (a, b) { return a.v - b.v; }).slice(0, 3);
    var body = up.map(function (r) { return countryMoveRow(r.p, key, r.v); }).join('');
    if (down.length) body += '<p class="muted">搜索在下降：</p>' + down.map(function (r) { return countryMoveRow(r.p, key, r.v); }).join('');
    if (!up.length && !down.length) body = '<p class="muted">这批商品里暂时看不出' + label + '搜索的明显变化。</p>';
    return '<h3 class="group-title">' + flag + ' ' + label + '</h3>' + countryStatusLine(key, label, flag) + body;
  }
  function amazonList() {
    var rows = arr(obj(data.overseas).amazon_us);
    if (!rows.length) return '<p class="muted">暂无数据。</p>';
    return rows.map(obj).map(function (r) {
      return '<article class="panel amazon-row"><div class="amazon-body"><p class="amazon-title">' + esc(str(r.t)) + '</p>' +
        '<p class="amazon-price">' + (num(r.p) ? usd(r.p) : '暂无价格') + ' ' + link(r.u, '在亚马逊看 ›', 'small-link') + '</p></div></article>';
    }).join('');
  }
  // Full raw lists for every overseas source, plus the Google Trends full-ranking links — not just the curated top movers above.
  function overseasFullSection() {
    var keys = [['google_th', '泰国谷歌热搜'], ['google_vn', '越南谷歌热搜'], ['google_kh', '柬埔寨谷歌热搜'], ['amazon_us', '美国亚马逊热卖']];
    var html = keys.map(function (x) {
      var rows2 = arr(obj(data.overseas)[x[0]]).map(obj);
      var body = rows2.length ? rows2.map(function (r) { return '<li>' + esc(str(r.t)) + (num(r.h) ? ' · 热度 ' + esc(count(r.h)) : '') + (num(r.p) ? ' · ' + usd(r.p) : '') + ' ' + link(r.u) + '</li>'; }).join('') : '<li>暂无数据</li>';
      var more = x[0].indexOf('google_') === 0 ? '<p>' + link(obj(data.overseas_more)[x[0]], '在 Google Trends 看完整榜单 ›') + '</p>' : '';
      return '<section><h3>' + x[1] + '</h3><ul class="detail-list">' + body + '</ul>' + more + '</section>';
    }).join('');
    return '<section class="panel"><button class="more-toggle" data-more aria-expanded="false">看完整海外榜单 ▾</button><div class="more" hidden>' + html + '</div></section>';
  }

  function signalCard(s, labelCls, labelText) {
    return '<article class="panel signal"><div class="signal-top"><span class="pill tiny">' + esc(plain(str(s.pl))) + '</span>' + (labelText ? '<span class="pill tiny ' + labelCls + '">' + esc(labelText) + '</span>' : '') + '</div><p class="signal-title">' + esc(str(s.t)) + '</p>' + (num(s.h) ? '<p class="signal-heat">热度 ' + esc(count(s.h)) + '</p>' : '') + link(s.u, '看原帖 ›', 'small-link') + '</article>';
  }
  function buzzView() {
    var signals = arr(data.signals).map(obj);
    var matched = signals.filter(function (s) { return s.m === true; });
    var candidates = signals.filter(function (s) { return s.m !== true && s.tag === '潮流话题候选'; });
    var rest = signals.filter(function (s) { return s.m !== true && s.tag !== '潮流话题候选'; });
    var html = '';
    if (matched.length) html += '<h3 class="group-title">和追踪商品有关</h3>' + matched.map(function (s) { return signalCard(s, 'match', '关联：' + s.tm); }).join('');
    if (candidates.length) html += '<h3 class="group-title">可能是新苗头</h3>' + candidates.map(function (s) { return signalCard(s, 'candidate', '新话题'); }).join('');
    if (rest.length) {
      html += '<button class="more-toggle" data-more aria-expanded="false">看更多热搜（' + rest.length + '条） ▾</button><div class="more" hidden>' + rest.map(function (s) { return signalCard(s); }).join('') + '</div>';
    }
    return html || '<p class="muted">暂无数据。</p>';
  }

  // ===== v5「1688 值得进货」: 进货 / 我的店铺 / 进货单（只存本机浏览器，不代付、不碰 1688 登录） =====
  var CART_KEY = 'baopin_jh_cart', cart = arr(parse(read(CART_KEY))).filter(function (x) { return x && typeof x === 'object' && url(x.u); });
  var filters = { q: '', cat: '', has: false, m3: false, moq10: false }, sortBy = 'mult', folded = {};
  function jh() { return obj(data.jh); }
  function jhItems() { return arr(jh().items).map(obj); }
  function jhById(id) { return jhItems().filter(function (it) { return it.key === id; })[0] || null; }
  function times(v) { return num(v) ? '×' + (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10) : '暂无'; }
  function day(s) { var d = typeof s === 'string' && /^(\d{4})-(\d{2})-(\d{2})/.exec(s); return d ? Number(d[2]) + '月' + Number(d[3]) + '日' : '时间未知'; }
  function tierPrice(tn, q) {
    tn = arr(tn).filter(function (t) { return Array.isArray(t) && num(t[0]) && num(t[1]); });
    if (!tn.length) return null;
    var p = tn[0][1]; tn.forEach(function (t) { if (q >= t[0]) p = t[1]; });
    return p;
  }
  function saveCart() { save(CART_KEY, JSON.stringify(cart)); var b = el('cartBtn'); if (b) b.innerHTML = '🧾 进货单' + (cart.length ? '<b>' + cart.length + '</b>' : ''); }
  function riskChip(label, r) { r = arr(r); var lv = str(r[0]); return '<span class="chip lv-' + (lv === '高' ? 'hi' : lv === '中' ? 'mid' : 'lo') + '" title="' + esc(str(r[1])) + '">' + label + ' ' + esc(lv) + '</span>'; }
  function matchText(parts) { var q = filters.q.trim().toLowerCase(); return !q || parts.join(' ').toLowerCase().indexOf(q) >= 0; }
  function passJh(it) {
    if (filters.cat && it.cat !== filters.cat) return false;
    if (filters.has && !arr(it.rows).length) return false;
    if (filters.m3 && !(num(it.mult) && it.mult >= 3 && !it.odd)) return false;
    if (filters.moq10 && !(num(it.moq) && it.moq <= 10)) return false;
    return matchText([str(it.name), str(it.cat)].concat(arr(it.rows).map(function (r) { return str(obj(r).shop) + ' ' + str(obj(r).t); })));
  }
  var sideHtml = '', drawerOpen = false;
  function wide() { return window.matchMedia && window.matchMedia('(min-width: 1024px)').matches; }
  function toolbar(cats, showSort, searchOnly) { sideHtml = toolbarHtml(cats, showSort, searchOnly); return ''; }
  function toolbarHtml(cats, showSort, searchOnly) {
    var opts = ['<option value="">全部品类</option>'].concat(cats.map(function (c) { return '<option' + (filters.cat === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }));
    function chip(k, t) { return '<button class="fchip' + (filters[k] ? ' on' : '') + '" data-filter="' + k + '" aria-pressed="' + filters[k] + '">' + t + '</button>'; }
    return '<div class="toolbar"><input id="q" type="search" placeholder="' + (searchOnly ? '搜机型、图案名…' : '搜商品、店铺…') + '" value="' + esc(filters.q) + '" aria-label="搜索">' + (searchOnly ? '</div>' :
      '<div class="frow"><select id="fcat" aria-label="品类">' + opts.join('') + '</select>' + chip('has', '有货源') + chip('m3', '利润>3倍') + chip('moq10', '起订≤10') +
      (showSort ? '<select id="sort" aria-label="排序">' + [['mult', '按利润倍数'], ['score', '按进货分'], ['heat', '按热度'], ['total', '起订总价低']].map(function (o) { return '<option value="' + o[0] + '"' + (sortBy === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' : '') + '</div></div>');
  }
  function qtyBox(key, moq) { return '<span class="addbox"><input type="number" min="1" step="1" inputmode="numeric" value="' + (num(moq) && moq > 0 ? moq : 1) + '" data-qty="' + esc(key) + '" aria-label="数量"><button class="add" data-add="' + esc(key) + '">＋进货单</button></span>'; }
  var addable = {};
  function regAdd(r, srcName, at) {
    var k = 'a' + Object.keys(addable).length;
    addable[k] = { u: r.u, shop: typeof r.shop === 'string' && r.shop ? r.shop : '店铺名未取到', t: str(r.t).slice(0, 60), tn: arr(r.tn), moq: num(r.mq) ? r.mq : num(r.moq) ? r.moq : null, src: srcName, at: at || null, loc: typeof r.loc === 'string' ? r.loc : null };
    return k;
  }
  function jhSupplier(r, i, picked, it) {
    var k = url(r.u) ? regAdd(r, str(it.name), it.at) : null;
    var tn = arr(r.tn).map(function (t) { return '≥' + t[0] + ' ' + yuan(t[1]); });
    return '<li class="supplier' + (picked ? ' picked' : '') + '">' +
      '<div class="sup-head"><b>' + (i + 1) + '. ' + esc(typeof r.shop === 'string' && r.shop ? r.shop : '店铺名未取到') + '</b>' + (picked ? '<span class="pill tiny buy">推荐</span>' : '') + (num(r.rs) ? '<span class="tag" title="综合分：100件价×0.5 + 可靠度×0.3 + 起订量×0.1 + 发货地×0.1">综合分 ' + Math.round(r.rs) + '</span>' : num(r.ss) ? '<span class="tag">供应商分 ' + r.ss + '</span>' : '') + '</div>' +
      '<p class="sup-title">' + esc(str(r.t)) + '</p>' +
      '<dl class="sup-grid"><div><dt>' + (num(r.p100) ? '100件价' : '单价') + '</dt><dd>' + (num(r.p100) ? yuan(r.p100) : num(r.p) ? yuan(r.p) : '未取到') + '</dd></div><div><dt>起订量</dt><dd>' + (num(r.mq) ? r.mq + ' 件' : '未取到') + '</dd></div><div><dt>发货地</dt><dd>' + esc(typeof r.loc === 'string' && r.loc ? r.loc : '未取到') + '</dd></div><div><dt>回头率</dt><dd>' + (num(r.rep) ? pct(r.rep) : '未取到') + '</dd></div></dl>' +
      (tn.length ? '<p class="sup-tiers">阶梯价：' + esc(tn.join(' / ')) + '</p>' : '') +
      (arr(r.tags).length ? '<p class="sup-tiers">' + esc(arr(r.tags).join(' · ')) + '</p>' : '') +
      (it.ip ? '<p class="sup-flag">⚠️ 未核实正品授权，仅供比价</p>' : '') +
      '<div class="sup-actions">' + (k ? qtyBox(k, r.mq) : '') + link(r.u, '去 1688 看 ›', 'sup-link') + '</div></li>';
  }
  function jhCard(it) {
    var rows = arr(it.rows).map(obj), pk = obj(it.pick), pi = num(pk.i) && pk.i < rows.length ? pk.i : 0, best = rows[pi] || {}, others = rows.filter(function (_, i) { return i !== pi; });
    var fold = folded[it.key] === true, pt = obj(it.parts);
    var ph = it.kind === 'case' ? '<div class="photo placeholder card-photo">📱</div>' : photo({ t: it.name, th: it.th }, 'card-photo');
    var multPill = it.odd ? '<span class="pill risk">⚠️ 价差异常 ' + times(it.mult) + '</span>' : num(it.mult) ? '<span class="pill ' + (it.mult >= 3 ? 'buy' : 'wait') + '">利润 ' + times(it.mult) + '</span>' : '<span class="pill wait">卖价未知</span>';
    return '<article class="card jh' + (fold ? ' folded' : '') + '" data-key="' + esc(it.key) + '">' +
      '<button class="fold" data-fold="' + esc(it.key) + '" aria-expanded="' + !fold + '"><div class="card-top">' + ph + '<div class="card-head"><h2>' + esc(str(it.name)) + '</h2><div class="tags"><span class="tag">' + esc(str(it.cat)) + '</span>' + multPill + (it.ip ? '<span class="pill risk">仅供比价</span>' : '') + '<span class="pill score">进货分 ' + Math.round(it.score) + '</span></div></div><span class="caret">' + (fold ? '▾' : '▴') + '</span></div></button>' +
      '<dl class="mini-table jh-sum"><div><dt>进价（推荐家）</dt><dd>' + yuan(it.cost) + '</dd></div><div><dt>参考卖价</dt><dd>' + yuan(it.sell) + '</dd></div><div><dt>起订量</dt><dd>' + (num(it.moq) ? it.moq + ' 件' : '未取到') + '</dd></div><div><dt>起订最低总价</dt><dd>' + yuan(it.moq_total) + '</dd></div></dl>' +
      '<div class="body"' + (fold ? ' hidden' : '') + '>' +
      '<p class="chips">' + riskChip('物流风险', it.logi) + riskChip('授权风险', it.auth) + '<span class="chip">货源抓取 ' + esc(day(it.at)) + '</span></p>' +
      (it.odd ? '<p class="risk-warning">1688 搜到的多是配件/仿款或价差离谱，倍数不可信，别按这个进。</p>' : '') +
      '<p class="muted small">卖价来源：' + esc(str(it.sell_src)) + (it.kind === 'case' ? '；倍数只算空壳，未含印图、包装、国际运费' : '') + '。分项：利润 ' + pt.mult + ' · 热度 ' + (num(pt.heat) ? pt.heat : '无') + ' · 供应商 ' + pt.sup + ' · 起订 ' + pt.moq + '</p>' +
      (typeof pk.why === 'string' ? '<p class="sup-pick' + (it.ip ? ' warn' : '') + '">' + esc(pk.why) + '</p>' : '') +
      (num(pk.raw) && num(pk.n) ? '<p class="muted small">从 ' + pk.raw + ' 条 1688 结果里过滤出 ' + pk.n + ' 家合格候选（' + esc(Object.keys(obj(pk.drop)).map(function (k) { return k + ' ' + pk.drop[k]; }).join('、')) + '），按综合分排序；备选见「看其他」。</p>' : '') +
      '<ol class="supplier-list">' + (rows.length ? jhSupplier(best, pi, true, it) : '') + '</ol>' +
      (others.length ? '<button class="more-toggle" data-more aria-expanded="false">看其他 ' + others.length + ' 家 ▾</button><div class="more" hidden><ol class="supplier-list">' + others.map(function (r) { return jhSupplier(r, rows.indexOf(r), false, it); }).join('') + '</ol></div>' : '') +
      '<p class="sup-meta">来源：' + esc(str(it.src)) + ' · 价格以 1688 页面为准' + (url(it.more) ? ' ' + link(it.more, '看更多货源 ›') : '') + '</p></div></article>';
  }
  function jhView() {
    addable = {};
    var items = jhItems(), cats = [];
    items.forEach(function (it) { if (it.cat && cats.indexOf(it.cat) < 0) cats.push(it.cat); });
    var list = items.filter(function (it) { return arr(it.rows).length && passJh(it); });
    var key = { mult: function (it) { return it.odd ? -1 : num(it.mult) ? it.mult : 0; }, score: function (it) { return it.score || 0; }, heat: function (it) { return num(it.heat) ? it.heat : -1; }, total: function (it) { return num(it.moq_total) ? -it.moq_total : -1e9; } }[sortBy];
    list.sort(function (a, b) { return key(b) - key(a) || (b.score || 0) - (a.score || 0); });
    var w = typeof jh().weights === 'string' ? jh().weights : '';
    return toolbar(cats, true) + '<p class="count span2">' + list.length + ' 个可进货（共 ' + items.length + '）' + (w ? ' · <span class="muted">' + esc(w) + '</span>' : '') + '</p>' +
      '<div class="grid">' + (list.map(jhCard).join('') || '<p class="panel">没有符合筛选的商品。</p>') + '</div>';
  }
  function shopView() {
    addable = {};
    var s = obj(jh().shop), fx = obj(jh().fx), groups = arr(s.groups).map(obj);
    var q = filters.q.trim().toLowerCase();
    var shown = groups.filter(function (g) { return !q || (str(g.model) + ' ' + str(g.type) + ' ' + arr(g.designs).join(' ')).toLowerCase().indexOf(q) >= 0; });
    var types = obj(s.types), tlist = Object.keys(types).map(function (k) { return k + ' ' + types[k]; }).join(' · ');
    var head = '<section class="panel span2 shop-sum"><h2>moomin.vip 在售：' + (num(s.total) ? s.total : '暂无') + ' 件</h2>' +
      '<p>手机壳 ' + str(s.cases) + ' 件 · 配件 ' + str(s.acc) + ' 件 · 壳型：' + esc(tlist) + '</p>' +
      '<p class="muted small">在售清单：' + esc(str(s.src)) + '（只读，抓取于 ' + esc(day(s.at)) + '）· 汇率：1 美元 = ¥' + (num(fx.rate) ? Math.round(fx.rate * 1000) / 1000 : '暂无') + '（' + esc(str(fx.src)) + '，' + esc(day(fx.at)) + '；' + esc(str(fx.note)) + '）</p>' +
      '<p class="muted small">' + esc(str(s.note)) + '</p>' +
      '<p class="muted small">图案级绑定（bindings.json）：' + (s.bindings ? s.bindings + ' 款' : '暂空，飞总填好后按绑定的 1688 链接配货') + '</p></section>';
    function groupCard(g) {
      var offers = arr(g.offers).map(obj);
      var rows = offers.map(function (o) {
        var k = url(o.u) ? regAdd({ u: o.u, shop: o.shop, t: o.t, tn: o.tn, mq: o.moq, loc: o.loc }, str(g.model) + ' ' + str(o.type) + '壳', s.at) : null;
        return '<tr><td>' + esc(str(o.type)) + (o.fit ? '' : '<small title="1688 标题没写这个机型，下单时确认">*</small>') + '</td><td>' + yuan(o.cost) + '</td><td>' + yuan(o.margin) + '</td><td>' + times(o.mult) + '</td><td class="act">' + (k ? qtyBox(k, o.moq) : '') + link(o.u, '去 1688 ›') + '</td></tr>';
      }).join('');
      return '<article class="card shop-g"><div class="shop-head"><h2>' + esc(str(g.model)) + ' · ' + esc(g.type ? g.type + '壳' : '未标壳型') + '</h2><span class="pill tiny ' + (g.how === '绑定' ? 'buy' : 'wait') + '">' + esc(str(g.how)) + '</span></div>' +
        '<p class="muted small">' + g.n + ' 件 · ' + g.nd + ' 个图案（' + esc(arr(g.designs).slice(0, 4).join('、')) + (g.nd > 4 ? '…' : '') + '）· 售价 ' + usd(g.pmin) + (g.pmax !== g.pmin ? '–' + usd(g.pmax) : '') + '，中位 ' + usd(g.pmed) + '</p>' +
        '<table class="otable"><thead><tr><th>1688 壳型</th><th>空壳价</th><th>单件毛利</th><th>倍数</th><th></th></tr></thead><tbody>' + (rows || '<tr><td colspan="5">暂无 1688 货源</td></tr>') + '</tbody></table></article>';
    }
    var top = shown.slice(0, 12), rest = shown.slice(12);
    return toolbar([], false, true) + head + '<div class="grid">' + top.map(groupCard).join('') + '</div>' +
      (rest.length ? '<button class="more-toggle span2" data-more aria-expanded="false">看其余 ' + rest.length + ' 组 ▾</button><div class="more grid" hidden>' + rest.map(groupCard).join('') + '</div>' : '') +
      '<p class="muted small span2">* = 1688 标题没写这个机型，下单时在 1688 选规格确认。毛利 = 售价中位 × 汇率 − 空壳单价，未含印图、包装、国际运费。</p>';
  }
  function cartLine(c, i) {
    var q = num(c.qty) ? c.qty : 1, p = tierPrice(c.tn, q), low = num(c.moq) && q < c.moq;
    return '<li class="cline"><div class="cl-main"><b>' + esc(c.t) + '</b><small>' + esc(c.src) + (c.loc ? ' · ' + esc(c.loc) + '发货' : '') + ' · 抓取 ' + esc(day(c.at)) + '</small></div>' +
      '<div class="cl-num"><input type="number" min="1" step="1" inputmode="numeric" value="' + q + '" data-cartqty="' + i + '" aria-label="数量"><span>× ' + (p === null ? '单价未取到' : yuan(p)) + ' = <b>' + (p === null ? '—' : yuan(p * q)) + '</b></span></div>' +
      (low ? '<p class="sup-flag">⚠️ 低于起订量 ' + c.moq + ' 件，1688 可能下不了单</p>' : '') +
      '<div class="cl-act">' + link(c.u, '去 1688 下单 ›', 'buy-link') + '<button class="link-btn" data-del="' + i + '">删除</button></div></li>';
  }
  function cartGroups() { var g = {}, order = []; cart.forEach(function (c, i) { if (!g[c.shop]) { g[c.shop] = []; order.push(c.shop); } g[c.shop].push(i); }); return order.map(function (s) { return [s, g[s]]; }); }
  function lineTotal(c) { var q = num(c.qty) ? c.qty : 1, p = tierPrice(c.tn, q); return p === null ? 0 : p * q; }
  function cartView() {
    if (!cart.length) return '<section class="panel"><h2>进货单是空的</h2><p class="muted">在「进货」或「我的店铺」里点「＋进货单」把供应商加进来，数量可以随时改。进货单只存在这台手机/电脑的浏览器里。</p></section>';
    var total = 0;
    var html = cartGroups().map(function (g) {
      var sub = 0; g[1].forEach(function (i) { sub += lineTotal(cart[i]); }); total += sub;
      return '<section class="panel cgroup"><h2>' + esc(g[0]) + '<small>' + g[1].length + ' 款 · 小计 ' + yuan(sub) + '</small></h2><ul class="clist">' + g[1].map(function (i) { return cartLine(cart[i], i); }).join('') + '</ul></section>';
    }).join('');
    return '<section class="panel span2 csum"><h2>合计约 ' + yuan(total) + '<small>' + cart.length + ' 款 · ' + cartGroups().length + ' 家供应商</small></h2>' +
      '<p class="muted small">按抓取时的阶梯价估算，以 1688 页面为准。不代付：点「去 1688 下单」在 1688 自己选规格、数量、付款。</p>' +
      '<div class="cbtns"><button id="copyCart">复制清单</button><button id="csvCart">导出 CSV</button><button id="clearCart" class="danger">清空</button></div></section><div class="grid">' + html + '</div>';
  }
  function cartText() {
    var out = [], total = 0;
    cartGroups().forEach(function (g) {
      out.push('【' + g[0] + '】');
      g[1].forEach(function (i) { var c = cart[i], q = c.qty || 1, p = tierPrice(c.tn, q); total += p === null ? 0 : p * q; out.push('- ' + c.t + ' × ' + q + (p === null ? '' : ' @ ¥' + p + ' = ¥' + Math.round(p * q * 100) / 100) + (num(c.moq) && q < c.moq ? '（低于起订量 ' + c.moq + '）' : '') + '\n  ' + c.u); });
    });
    out.push('合计约 ¥' + Math.round(total * 100) / 100 + '（以 1688 页面为准）');
    return out.join('\n');
  }
  function csvCell(v) { v = String(v === null || v === undefined ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function cartCsv() {
    var rows = [['供应商', '商品', '来自', '数量', '单价(元)', '小计(元)', '起订量', '低于起订量', '发货地', '1688链接', '抓取时间']];
    cart.forEach(function (c) { var q = c.qty || 1, p = tierPrice(c.tn, q); rows.push([c.shop, c.t, c.src, q, p === null ? '' : p, p === null ? '' : Math.round(p * q * 100) / 100, c.moq || '', num(c.moq) && q < c.moq ? '是' : '', c.loc || '', c.u, c.at || '']); });
    return '\ufeff' + rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
  }
  function flash(t) { el('notice').textContent = t; setTimeout(function () { if (el('notice').textContent === t) el('notice').textContent = ''; }, 2500); }
  function copyText(t) {
    function fallback() { var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); flash('已复制进货单'); } catch (e) { flash('复制失败，请手动选择'); } document.body.removeChild(ta); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { flash('已复制进货单'); }, fallback); else fallback();
  }
  function hotPass(p) {
    var it = jhById(p.id) || {};
    if (filters.cat && p.c !== filters.cat) return false;
    if (filters.has && !arr(obj(p.hy).rows).length) return false;
    if (filters.m3 && !(num(it.mult) && it.mult >= 3 && !it.odd)) return false;
    if (filters.moq10 && !(num(it.moq) && it.moq <= 10)) return false;
    return matchText([str(p.t), str(p.c)]);
  }

  var tabs = [
    ['jh', '进货', '只列有 1688 货源的，默认按利润倍数从高到低；推荐供应商已展开，填数量点「＋进货单」，再到进货单统一去 1688 下单。IP 款未核实授权，仅供比价。'],
    ['shop', '我的店铺', 'moomin.vip 正在卖的手机壳按机型×壳型汇总，配上 1688 空壳货源，按汇率算单件毛利（未含印图和运费）。'],
    ['hot', '爆品热度', '全网热度排行（有图先排，再按热度）。底部「海外机会」看泰国、越南、柬埔寨和美国亚马逊。'],
    ['buzz', '热议', '小红书、抖音、微博等平台上正在热议的内容，点开看原帖。']
  ];
  var views = { cart: ['cart', '进货单', '按供应商分组；数量改了马上按阶梯价重算。只存在本机浏览器，不代付。'] };

  function sortedRows() {
    var rows = arr(data.trends).filter(function (p) { return p && typeof p === 'object' && !Array.isArray(p); });
    rows.sort(function (a, b) { return (path(b) ? 1 : 0) - (path(a) ? 1 : 0) || (num(b.sc) ? b.sc : 0) - (num(a.sc) ? a.sc : 0); });
    return rows;
  }

  function renderDrawer() { var d = el('drawer'); if (!d) return; d.hidden = !drawerOpen; document.body.classList.toggle('drawer-open', drawerOpen); if (drawerOpen) el('drawerBody').innerHTML = cartView(); }
  function refreshCart() { if (drawerOpen) renderDrawer(); if (active === 'cart') renderContent(); }
  function renderContent() {
    var rows = sortedRows(), html = ''; sideHtml = '';
    if (active === 'jh') { displayedRows = []; html = jhView(); }
    else if (active === 'shop') { displayedRows = []; html = shopView(); }
    else if (active === 'cart') { displayedRows = []; html = cartView(); }
    else if (active === 'hot') {
      var cats = []; rows.forEach(function (p) { if (p.c && cats.indexOf(p.c) < 0) cats.push(p.c); });
      var list = rows.filter(hotPass); displayedRows = list;
      html = toolbar(cats, false) + reviewCard(rows) + '<div class="grid">' + (list.map(card).join('') || '<p class="panel">没有符合筛选的商品。</p>') + '</div>' +
        '<button class="more-toggle span2" data-more aria-expanded="false">看海外机会 ▾</button><div class="more" hidden>' +
        countrySection(rows, 'TH', '泰国', '🇹🇭') + countrySection(rows, 'VN', '越南', '🇻🇳') + countrySection(rows, 'KH', '柬埔寨', '🇰🇭') +
        '<h3 class="group-title">美国亚马逊热卖手机配件</h3>' + amazonList() + overseasFullSection() + '</div>';
    } else if (active === 'buzz') { displayedRows = []; html = buzzView(); }
    el('list').innerHTML = html || '<p class="panel">暂无数据，稍后刷新看看。</p>';
    var side = el('side'); if (side) { side.innerHTML = sideHtml; side.hidden = !sideHtml; }
    document.body.classList.toggle('has-side', !!sideHtml);
  }

  function freshnessInfo() {
    var stamp = Date.parse(data.collected_at || data.generated_at), hours = isNaN(stamp) ? null : Math.max(0, Math.floor((Date.now() - stamp) / 3600000));
    var age = hours === null ? '时间未知' : hours >= 48 ? Math.floor(hours / 24) + ' 天前' : hours + ' 小时前';
    var names = { douyin_hot: '抖音', douyin_video: '抖音', weibo_hot: '微博', xhs_hot: '小红书', baidu_hot: '百度', kuaishou_hot: '快手' }, seen = {}, sources = [];
    arr(data.stale_sources).forEach(function (key) { var name = names[key]; if (name && !seen[name]) { seen[name] = true; sources.push(name); } });
    var extra = sources.length ? '<small>部分来源暂时没更新：' + esc(sources.join('、')) + '</small>' : '';
    return { age: age, banner: hours !== null && hours >= 6 ? '<aside class="staleness-warning" role="status">⚠️ 数据更新于 ' + esc(age) + '，可能不是最新' + extra + '</aside>' : extra ? '<p class="stale-sources">' + extra + '</p>' : '' };
  }

  function render() {
    el('tabs').innerHTML = tabs.map(function (t) { return '<button data-tab="' + t[0] + '" aria-pressed="' + (active === t[0]) + '" class="' + (active === t[0] ? 'active' : '') + '"><span>' + t[1] + '</span></button>'; }).join('');
    var tab = tabs.filter(function (t) { return t[0] === active; })[0] || views[active] || tabs[0];
    saveCart();
    el('content').innerHTML = freshnessInfo().banner + '<p class="explain">' + tab[2] + '</p><div id="list"></div>';
    renderContent();
    el('footer').innerHTML = '<details class="panel"><summary>这些数据从哪来？</summary><p>热度参考网上讨论、搜索变化、成交和二手市场。价格来自公开商品页；进货前请核实授权、质量和实际报价。</p><p>进货页的利润倍数 = 参考卖价 ÷ 推荐供应商单价；卖价用闲鱼成交中位价/得物最低价，手机壳用 moomin.vip 售价 × 汇率。都是估算，照片和 1688 链接不代表正品授权。</p></details><p class="updated-at">数据更新于 ' + esc(freshnessInfo().age) + '</p>';
  }

  Object.keys(defaults).forEach(function (k) { var n = Number(settings[k]); settings[k] = settings[k] !== null && settings[k] !== '' && isFinite(n) && n >= 0 ? n : defaults[k]; });

  // Shared by the click toggle and the settings-recompute re-render, so both agree on the open/label state.
  function setMoreOpen(toggle, open) {
    toggle.setAttribute('aria-expanded', String(open));
    var base = toggle.textContent.replace(/^(看|收起)/, '').replace(/[▾▴]\s*$/, '').trim();
    toggle.textContent = (open ? '收起' : '看') + base + (open ? ' ▴' : ' ▾');
    toggle.nextElementSibling.hidden = !open;
  }
  document.addEventListener('click', function (e) {
    var n = e.target;
    while (n && n !== document) {
      if (n.tagName === 'A') return;
      if (n.hasAttribute && n.hasAttribute('data-tab')) { drawerOpen = false; renderDrawer(); active = n.getAttribute('data-tab'); render(); window.scrollTo(0, 0); return; }
      if (n.hasAttribute && n.hasAttribute('data-more')) { setMoreOpen(n, n.getAttribute('aria-expanded') !== 'true'); return; }
      if (n.id === 'refresh') { load(); return; }
      if (n.id === 'cartBtn') { if (wide()) { drawerOpen = true; renderDrawer(); var dc = el('dwClose'); if (dc) dc.focus(); } else { active = 'cart'; render(); window.scrollTo(0, 0); } return; }
      if (n.id === 'dwClose' || (n.hasAttribute && n.hasAttribute('data-close'))) { drawerOpen = false; renderDrawer(); return; }
      if (n.hasAttribute && n.hasAttribute('data-fold')) { var fk = n.getAttribute('data-fold'); folded[fk] = !folded[fk]; var art = n.parentNode, body = art.querySelector('.body'); if (body) body.hidden = folded[fk]; art.classList.toggle('folded', folded[fk]); n.setAttribute('aria-expanded', String(!folded[fk])); var ca = n.querySelector('.caret'); if (ca) ca.textContent = folded[fk] ? '▾' : '▴'; return; }
      if (n.hasAttribute && n.hasAttribute('data-filter')) { var fkey = n.getAttribute('data-filter'); filters[fkey] = !filters[fkey]; renderContent(); return; }
      if (n.hasAttribute && n.hasAttribute('data-add')) {
        var ak = n.getAttribute('data-add'), item = addable[ak], qi = el('list').querySelector('[data-qty="' + ak + '"]'), qv = Math.max(1, Math.round(Number(qi && qi.value) || 1));
        if (item) {
          var ex = cart.filter(function (c) { return c.u === item.u; })[0];
          if (ex) ex.qty = (ex.qty || 0) + qv; else cart.push({ u: item.u, shop: item.shop, t: item.t, tn: item.tn, moq: item.moq, src: item.src, at: item.at, loc: item.loc, qty: qv });
          saveCart(); flash('已加入进货单：' + item.shop + ' × ' + qv + (item.moq && qv < item.moq ? '（低于起订量 ' + item.moq + '）' : ''));
          n.textContent = '✓ 已加入'; setTimeout(function () { n.textContent = '＋进货单'; }, 1500);
        }
        return;
      }
      if (n.hasAttribute && n.hasAttribute('data-del')) { cart.splice(Number(n.getAttribute('data-del')), 1); saveCart(); refreshCart(); return; }
      if (n.id === 'clearCart') { if (window.confirm('清空进货单？')) { cart = []; saveCart(); refreshCart(); } return; }
      if (n.id === 'copyCart') { copyText(cartText()); return; }
      if (n.id === 'csvCart') { var blob = new Blob([cartCsv()], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '进货单-' + new Date().toISOString().slice(0, 10) + '.csv'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 500); return; }
      if (n.id === 'reset') { settings = { ship: 15, kg: 0.3, mult: 2.5 }; save('baopin_v5_settings', JSON.stringify(settings)); renderContent(); return; }
      n = n.parentNode;
    }
  });
  var qTimer = null;
  document.addEventListener('input', function (e) {
    if (e.target.id === 'q') { filters.q = e.target.value; clearTimeout(qTimer); qTimer = setTimeout(function () { renderContent(); var qi = el('q'); if (qi) { qi.focus(); qi.setSelectionRange(qi.value.length, qi.value.length); } }, 250); return; }
    if (e.target.hasAttribute('data-cartqty')) { var ci = Number(e.target.getAttribute('data-cartqty')), cq = Math.round(Number(e.target.value)); if (cart[ci] && cq >= 1) { cart[ci].qty = cq; saveCart(); clearTimeout(qTimer); qTimer = setTimeout(function () { refreshCart(); var f = document.querySelector('[data-cartqty="' + ci + '"]'); if (f) { f.focus(); } }, 400); } return; }
    var k = e.target.getAttribute('data-setting'), v = Number(e.target.value);
    if (!Object.prototype.hasOwnProperty.call(defaults, k)) return;
    if (e.target.value !== '' && isFinite(v) && v >= 0) {
      settings[k] = v; save('baopin_v5_settings', JSON.stringify(settings));
      // Profit changes can flip the verdict pill and the warning text, not just the profit number —
      // re-render the whole card/comparison node so the pill, warning and detail stay in sync.
      var nodes = el('list').querySelectorAll('[data-item]');
      Array.prototype.forEach.call(nodes, function (node) {
        var id = Number(node.getAttribute('data-item')), p = displayedRows[id];
        if (!p) return;
        var moreToggle = node.querySelector('[data-more]'), wasOpen = !!moreToggle && moreToggle.getAttribute('aria-expanded') === 'true';
        node.outerHTML = card(p, id);
        if (wasOpen) {
          var fresh = el('list').querySelector('[data-item="' + id + '"] [data-more]');
          if (fresh) setMoreOpen(fresh, true);
        }
      });
      var notice = el('list').querySelector('.review-notice');
      if (notice) notice.outerHTML = reviewAssumptionsNotice(obj(data.review), displayedRows);
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawerOpen) { drawerOpen = false; renderDrawer(); } });
  window.addEventListener('resize', function () { if (drawerOpen && !wide()) { drawerOpen = false; renderDrawer(); active = 'cart'; render(); } });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'fcat') { filters.cat = e.target.value; renderContent(); }
    if (e.target.id === 'sort') { sortBy = e.target.value; renderContent(); }
  });
  document.addEventListener('error', function (e) {
    if (e.target.tagName === 'IMG') { var tile = document.createElement('div'); tile.className = 'photo placeholder ' + e.target.className.replace('photo', '').trim(); tile.textContent = (e.target.alt || '').slice(0, 2); e.target.parentNode.replaceChild(tile, e.target); }
  }, true);

  function load() {
    el('notice').textContent = '正在刷新…';
    el('refresh').disabled = true;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', './data.json?t=' + Date.now(), true);
    xhr.timeout = 15000;
    function fail() {
      el('refresh').disabled = false;
      // Fall back to v4's offline cache too, so a user migrating from the old page still gets last-known data.
      var cached = parse(read('baopin_v5_data'));
      if (!(cached && typeof cached === 'object' && !Array.isArray(cached))) cached = parse(read('baopin_h5_data'));
      if (cached && typeof cached === 'object' && !Array.isArray(cached)) { data = cached; render(); el('notice').textContent = '网络暂时不通，显示上次的数据。'; }
      else el('notice').textContent = '加载失败，请点击刷新重试。';
    }
    xhr.onload = function () {
      var d = parse(xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300 && d && typeof d === 'object' && !Array.isArray(d)) { data = d; save('baopin_v5_data', JSON.stringify(d)); render(); el('notice').textContent = ''; el('refresh').disabled = false; }
      else fail();
    };
    xhr.onerror = fail;
    xhr.ontimeout = fail;
    xhr.send();
  }
  // Test-only hook: exposes the real functions (never a reimplementation) to a Node test harness.
  // No-op in the browser since `module` is never defined there.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      cleanNum: cleanNum, roundHalfAway: roundHalfAway,
      reviewRounded: reviewRounded, reviewDisplay: reviewDisplay, verdict: verdict, cost: cost,
      sellPrice: sellPrice, profit: profit, comparableFlag: comparableFlag, authUnverified: authUnverified,
      riskFlags: riskFlags, frozenRiskFlags: frozenRiskFlags, reviewAssumptionsNotice: reviewAssumptionsNotice,
      reviewNoteText: reviewNoteText, reviewCard: reviewCard, stanceCeiling: stanceCeiling
    };
  }

  load();
}
  boot();
}());
