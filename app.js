(function () {
  'use strict';
  // Verdict thresholds: hot >=40; buy >=25 OR >=15 with premium >=10% / daily wants >=100.
  var RULES = { hot: 40, buy: 25, emerging: 15, premium: 0.10, dailyWant: 100 };
  var data = {}, displayedRows = [], active = 'picks', defaults = { ship: 15, kg: 0.3, mult: 2.5 };
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
    return '<article class="panel comparison" data-item="' + i + '"><div class="compare-head">' + photo(p, 'compare-photo') + '<h2>' + esc(title(p)) + '</h2></div><dl class="mini-table">' + cells.join('') + '</dl>' + riskWarning(p) + profitBox(p) + buyLink + '</article>';
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

  var tabs = [
    ['picks', '推荐', '有图的商品先排，再按热度从高到低排。点「看详情」能看到数据来源；利润和授权有风险的会标红/黄提示，别只看绿色标签。'],
    ['profit', '算利润', '把进价和闲鱼、得物卖价放在一起，看看一件大约能赚多少。'],
    ['abroad', '海外机会', '泰国、越南、柬埔寨搜索的涨跌和数据够不够，再看看美国亚马逊在卖什么手机配件；点「看完整海外榜单」看全部。'],
    ['buzz', '全网热议', '小红书、抖音、微博等平台上正在热议的内容，点开看原帖。']
  ];

  function sortedRows() {
    var rows = arr(data.trends).filter(function (p) { return p && typeof p === 'object' && !Array.isArray(p); });
    rows.sort(function (a, b) { return (path(b) ? 1 : 0) - (path(a) ? 1 : 0) || (num(b.sc) ? b.sc : 0) - (num(a.sc) ? a.sc : 0); });
    return rows;
  }

  function renderContent() {
    var rows = sortedRows(), html = '';
    if (active === 'picks') { html = reviewCard(rows); displayedRows = rows; html += rows.map(card).join(''); }
    else if (active === 'profit') {
      var priced = rows.filter(function (p) { return cost(p) !== null || num(obj(p.dw).ask) || num(obj(p.xy).med); });
      displayedRows = priced;
      html = settingsPanel() + priced.map(comparison).join('');
    } else if (active === 'abroad') {
      displayedRows = [];
      html = countrySection(rows, 'TH', '泰国', '🇹🇭') + countrySection(rows, 'VN', '越南', '🇻🇳') + countrySection(rows, 'KH', '柬埔寨', '🇰🇭') +
        '<h3 class="group-title">美国亚马逊热卖手机配件</h3>' + amazonList() + overseasFullSection();
    } else if (active === 'buzz') { displayedRows = []; html = buzzView(); }
    el('list').innerHTML = html || '<p class="panel">暂无数据，稍后刷新看看。</p>';
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
    var tab = tabs.filter(function (t) { return t[0] === active; })[0];
    el('content').innerHTML = freshnessInfo().banner + '<p class="explain">' + tab[2] + '</p><div id="list"></div>';
    renderContent();
    el('footer').innerHTML = '<details class="panel"><summary>这些数据从哪来？</summary><p>热度参考网上讨论、搜索变化、成交和二手市场。价格来自公开商品页；进货前请核实授权、质量和实际报价。</p><p>有照片的商品先展示，再按热度排列。照片不代表货源已获正品授权。</p></details><p class="updated-at">数据更新于 ' + esc(freshnessInfo().age) + '</p>';
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
      if (n.hasAttribute && n.hasAttribute('data-tab')) { active = n.getAttribute('data-tab'); render(); window.scrollTo(0, 0); return; }
      if (n.hasAttribute && n.hasAttribute('data-more')) { setMoreOpen(n, n.getAttribute('aria-expanded') !== 'true'); return; }
      if (n.id === 'refresh') { load(); return; }
      if (n.id === 'reset') { settings = { ship: 15, kg: 0.3, mult: 2.5 }; save('baopin_v5_settings', JSON.stringify(settings)); renderContent(); return; }
      n = n.parentNode;
    }
  });
  document.addEventListener('input', function (e) {
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
        node.outerHTML = active === 'picks' ? card(p, id) : comparison(p, id);
        if (wasOpen) {
          var fresh = el('list').querySelector('[data-item="' + id + '"] [data-more]');
          if (fresh) setMoreOpen(fresh, true);
        }
      });
      var notice = el('list').querySelector('.review-notice');
      if (notice) notice.outerHTML = reviewAssumptionsNotice(obj(data.review), displayedRows);
    }
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
}());
