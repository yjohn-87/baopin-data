(function () {
  'use strict';
  // Verdict thresholds: hot >=40; buy >=25 OR >=15 with premium >=10% / daily wants >=100.
  var RULES = {hot:40, buy:25, emerging:15, premium:0.10, dailyWant:100};
  var data = {}, displayedRows = [], active = 'trends', defaults = {ship:15, kg:0.3, mult:2.5};
  var settings = obj(parse(read('baopin_h5_settings')));
  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function num(v) { return typeof v === 'number' && isFinite(v); }
  function str(v) { return typeof v === 'string' || num(v) ? String(v) : '暂无'; }
  function esc(v) { return str(v).replace(/[&<>"']/g,function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function parse(v) { try { return JSON.parse(v); } catch (e) { return null; } }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function save(k,v) { try { localStorage.setItem(k,v); } catch (e) {} }
  function el(k) { return document.getElementById(k); }
  function url(v) { return typeof v === 'string' && /^https?:\/\/[^\s]+$/i.test(v) ? v : ''; }
  function link(u,t) { return url(u) ? '<a href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">'+esc(t || '去看看 ›')+'</a>' : ''; }
  function yuan(v) { return num(v) ? '¥'+String(Math.round(v*100)/100) : '暂无'; }
  function integer(v) { return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function count(v) { return !num(v) ? '暂无' : v>=1e8 ? (v/1e8).toFixed(1)+'亿' : v>=1e4 ? (v/1e4).toFixed(1)+'万' : integer(v); }
  function pct(v) { return Math.round(v)+'%'; }
  function title(p) { return typeof p.t === 'string' && p.t ? p.t : '暂无商品名'; }
  function path(p) { return typeof p.th === 'string' && /^thumbs\/[a-zA-Z0-9_-]+\.webp$/.test(p.th) ? p.th : ''; }
  function initials(p) { var t=title(p), words=t.split(/\s+/);return /^[a-z]/i.test(t)&&words.length>1 ? words[0].charAt(0)+words[1].charAt(0) : t.slice(0,2); }
  function photo(p) { return path(p) ? '<img class="photo" src="./'+esc(path(p))+'" alt="'+esc(title(p))+'" loading="lazy">' : '<div class="photo placeholder" aria-label="'+esc(title(p))+'">'+esc(initials(p))+'</div>'; }
  function cost(p) { var c=obj(p.cost);return num(c.p) ? c.p : num(p.sp) ? p.sp : null; }
  function basis(p) { var b=str(obj(p.cost).b);return /速卖通|ali/i.test(b) ? '速卖通' : '1688'; }
  // Sell price: real 闲鱼/得物 price when it is comparable (cost >= 10% of it, guards unit/set mismatch); else cost x multiplier.
  function marketPrice(p) { var x=obj(p.xy),d=obj(p.dw);return num(x.med)&&x.med>0 ? [x.med,'闲鱼'] : num(d.ask)&&d.ask>0 ? [d.ask,'得物'] : null; }
  function sellPrice(p) { var c=cost(p),m=marketPrice(p);if(c===null)return null;return m&&c>=m[0]*0.1 ? [m[0],'按'+m[1]+'卖价'] : [c*settings.mult,'按进价×'+settings.mult]; }
  function profit(p) { var c=cost(p),s=sellPrice(p);return c===null||!s ? null : s[0]-c-settings.ship*settings.kg; }
  function earning(p) { var n=profit(p);return n===null ? '' : '<p class="earning'+(n<0?' warning':'')+'">'+(n<0 ? '按现在的价格可能不赚钱（估算）' : '一件大约赚 ¥'+Math.round(n)+'（估算，'+sellPrice(p)[1]+'）')+'</p>'; }
  function verdict(p) { var s=num(p.sc)?p.sc:0,d=obj(p.dw),x=obj(p.xy);return s>=RULES.hot ? ['hot','🔥 正在爆'] : s>=RULES.buy || s>=RULES.emerging&&(num(d.prem)&&d.prem>=RULES.premium||num(x.wd)&&x.wd>=RULES.dailyWant) ? ['buy','✅ 值得进货'] : ['wait','👀 再观望']; }
  function reason(p) { var parts=obj(p.pt), words={discuss:'多个平台在热议',search:'最近搜索的人变多了',sales:'已经有人在买',resale:'二手市场有人关注',newrel:'刚上市新品'},best='',score=0;Object.keys(words).forEach(function (k) { if(num(parts[k])&&parts[k]>score){best=words[k];score=parts[k];} });return best; }
  function sold(a) { return num(a.n) ? a.n.toLocaleString()+(typeof a.s==='string'&&a.s.indexOf('+')>=0?'+':'') : typeof a.s==='string' ? a.s.replace(/sold/gi,'').trim() : ''; }
  function facts(p) { var out=[],c=cost(p),x=obj(p.xy),d=obj(p.dw),a=obj(p.ali),pm=obj(p.pm);
    if(c!==null)out.push('进价约 '+yuan(c)+'（'+basis(p)+'）'+(/未核实/.test(str(obj(p.cost).b))?'·未核实':''));
    if(num(x.med))out.push('闲鱼卖 '+yuan(x.med)+(num(x.want)?'，'+integer(x.want)+' 人想要':''));
    if(num(d.prem))out.push('得物比发售价'+(d.prem>=0?'高 ':'低 ')+pct(Math.abs(d.prem)*100));
    if(sold(a))out.push('速卖通已卖 '+sold(a)+' 件');
    if(url(pm.u))out.push('泡泡玛特官网新品'+(num(pm.p)?' · $'+pm.p:''));
    if(arr(p.pl).length)out.push('上了 '+arr(p.pl).length+' 个热榜');
    return out.slice(0,3).map(function (t) { return '<li>'+esc(t)+'</li>'; }).join('');
  }
  function detail(p) {
    var groups=[[],[],[],[]], seenU=Object.create(null),seenT=Object.create(null),d=obj(p.dw),x=obj(p.xy),s=obj(p.s88),a=obj(p.ali),pm=obj(p.pm),c=cost(p);
    function line(g,t,u) { if(!t||seenT[t]||url(u)&&seenU[u])return;seenT[t]=true;if(url(u))seenU[u]=true;groups[g].push('<p>'+esc(t)+' '+link(u)+'</p>'); }
    var countries={TH:'泰国',VN:'越南',KH:'柬埔寨',US:'美国'},gt=obj(p.gt);
    Object.keys(countries).forEach(function (k) { if(num(gt[k])){var badge=arr(p.b).map(obj).filter(function (b) { return typeof b.label==='string'&&(b.label.indexOf(k)>=0||b.label.indexOf(countries[k])>=0); })[0]||{};line(3,countries[k]+'搜索量 '+(gt[k]>=0?'+':'')+pct(gt[k])+(/量太小/.test(str(badge.label))?'（搜索人数还不多）':''),badge.u);} });
    if(num(p.x))line(0,'海外社交平台讨论 '+(p.x>=0?'+':'')+pct(p.x), (arr(p.b).map(obj).filter(function (b) {return /讨论/.test(str(b.type)+' '+str(b.label));})[0]||{}).u);
    if(arr(p.pl).length)line(0,'上榜平台：'+arr(p.pl).filter(function (v) {return typeof v==='string';}).map(plain).join('、'));
    arr(p.m).slice(0,3).map(obj).forEach(function (m) {line(0,plain(str(m.pl))+'：'+str(m.t)+(num(m.h)?' · 热度 '+count(m.h):''),m.u);});
    if(sold(a))line(2,'速卖通已卖 '+sold(a)+' 件',a.u);
    if(num(a.pc)||num(a.p))line(1,'速卖通进价 '+(num(a.pc)?yuan(a.pc):'$'+a.p),a.u);
    if(num(s.p)||num(s.pa))line(1,'1688 进价 '+yuan(num(s.p)?s.p:s.pa)+(num(s.rep)?'，回头客 '+pct(s.rep):'')+tier(s.tiers),s.u);
    if(num(p.sp))line(1,'1688 进价 '+yuan(p.sp),p.su);
    arr(s.rows).slice(0,3).map(obj).forEach(function (r) {line(1,'1688：'+str(r.t)+' · '+yuan(r.p)+tier(r.tiers)+(num(r.rep)?'，回头客 '+pct(r.rep):''),r.u);});
    if(s.flag||arr(s.rows).some(function (r) {return obj(r).flag;})||/未核实/.test(str(obj(p.cost).b)))line(1,'这个货源可能不是正品授权，进货前请核实');
    if(url(p.s1688))line(1,'去1688找同款货源',p.s1688);
    if(num(x.med)||num(x.want))line(2,'闲鱼 '+yuan(x.med)+(num(x.want)?'，'+integer(x.want)+' 人想要':'')+(num(x.wd)?'，今天新增 '+integer(x.wd)+' 人想要':''));
    arr(x.rows).slice(0,3).map(obj).forEach(function (r) {line(2,'闲鱼：'+str(r.t)+' · '+yuan(r.p)+(num(r.w)?'，'+integer(r.w)+' 人想要':''),r.u);});
    if(num(x.min))line(2,'闲鱼最低挂价 '+yuan(x.min)+(num(x.off)?'，参考发售价 '+yuan(x.off):''));
    if(num(d.sold))line(2,'得物已卖 '+count(d.sold)+' 件');
    if(Object.keys(d).length)line(2,'得物最低 '+yuan(d.ask)+'，发售价 '+yuan(d.off)+(num(d.prem)?'（'+(d.prem>=0?'高 ':'低 ')+pct(Math.abs(d.prem)*100)+'）':''));
    arr(d.rows).slice(0,3).map(obj).forEach(function (r) {line(2,'得物：'+str(r.t)+' · '+yuan(r.ask)+'，发售价 '+yuan(r.off)+(r.mm?' · 整盒价，不能直接比':'')+(typeof r.d==='string'?' · 发售 '+r.d:'')+(num(r.sold)?' · 已卖 '+count(r.sold)+' 件':''),r.u);});
    if(url(pm.u))line(0,'泡泡玛特官网新品'+(typeof pm.t==='string'?'：'+pm.t:'')+(num(pm.p)?' · $'+pm.p:'')+(typeof pm.d==='string'?'，发售 '+pm.d:''),pm.u);
    if(c!==null)line(2,'一件大约赚：卖价 '+yuan(sellPrice(p)[0])+'（'+sellPrice(p)[1]+'）− 进价 '+yuan(c)+' − 运费 '+yuan(settings.ship*settings.kg)+' = '+yuan(profit(p))+'（估算）');
    return ['为什么火','去哪进货','能卖多少钱','海外情况'].map(function (h,i) {return '<section><h3>'+h+'</h3>'+(groups[i].join('')||'<p>暂无</p>')+'</section>';}).join('');
  }
  function tier(v) { var out=arr(v).filter(function (r) {return Array.isArray(r)&&r.length>1;}).map(function (r) {return str(r[0])+' '+yuan(r[1]);});return out.length?' · '+out.join(' / '):''; }
  function plain(t) { var names={'AliExpress':'速卖通','Google Trends TH':'泰国搜索','Google Trends VN':'越南搜索','Google Trends KH':'柬埔寨搜索','Amazon US 手机配件':'美国亚马逊热卖'};return names[t]||t; }
  function card(p,i) { var v=verdict(p),sc=num(p.sc)?Math.round(p.sc):null,n=sc===null?0:Math.max(0,Math.min(5,Math.ceil(sc/20))),bar='',j;
    for(j=0;j<5;j++)bar+='<i class="'+(j<n?'on':'')+'"></i>';
    return '<article class="card" data-item="'+i+'">'+(active==='prices'?'':photo(p))+'<div class="body"><h2>'+esc(title(p))+'</h2><p class="verdict"><span class="pill '+v[0]+'">'+v[1]+'</span> <span>'+esc(reason(p))+'</span></p><div class="heat">热度 '+(sc===null?'暂无':sc)+' <span class="bar" aria-hidden="true">'+bar+'</span></div><ul class="facts">'+facts(p)+'</ul>'+earning(p)+'<button class="more-toggle" data-more aria-expanded="false">看详情 ▾</button><div class="more" hidden>'+detail(p)+'</div></div></article>';
  }
  function comparison(p,i) {
    var c=cost(p),x=obj(p.xy),d=obj(p.dw),a=obj(p.ali),s=obj(p.s88),cells=[];
    function cell(label,value) { cells.push('<div><dt>'+label+'</dt><dd>'+esc(value)+'</dd></div>'); }
    if(c!==null)cell('进价约',yuan(c)+'（'+basis(p)+'）'+(/未核实/.test(str(obj(p.cost).b))?' · 未核实':''));
    if(num(x.med))cell('闲鱼卖',yuan(x.med));
    if(num(d.ask))cell('得物最低',yuan(d.ask));
    return '<article class="panel comparison" data-item="'+i+'"><div class="compare-head">'+photo(p)+'<h2>'+esc(title(p))+'</h2></div><dl class="mini-table">'+cells.join('')+(c!==null?'<div class="profit-cell"><dt>一件大约赚（估算）</dt><dd>'+earning(p)+'</dd></div>':'')+'</dl>'+link(url(obj(p.cost).u)||(basis(p)==='速卖通'?url(a.u):(url(s.u)||url(p.su)||url(p.s1688))),'去进货 ›')+'</article>';
  }
  function settingsPanel() { return '<section class="panel settings"><h2>利润怎么算（可以改）</h2><p>一件大约赚 = 卖价 − 进价 − 运费。有闲鱼/得物卖价就用它，没有就按「进价 × 倍数」估。下面三个数是假设值，改了会马上重算。</p>'+[['ship','运费（每公斤多少钱）'],['kg','每件重量（公斤）'],['mult','卖价是进价的几倍']].map(function (x) {return '<label>'+x[1]+'<input type="number" min="0" step="any" data-setting="'+x[0]+'" value="'+settings[x[0]]+'"></label>';}).join('')+'<button id="reset">恢复默认</button></section>'; }
  var tabs=[['trends','热门商品','按热度从高到低排，最火的在最上面。点「看详情」能看到数据来源。'],['prices','进货比价','把进价和闲鱼、得物卖价放在一起，看看一件大约赚多少。'],['signals','网上在聊','小红书、抖音、微博等平台上正在热议的相关内容，点开看原帖。'],['khm','海外行情','泰国、越南、柬埔寨的搜索趋势和美国亚马逊热卖，看海外能不能卖。']];
  function reviewCard() { var r=obj(data.review),bs=arr(r.bullets).filter(function (b) {return typeof b==='string'&&b.trim().length>0&&b.length<=80;}).slice(0,5),date=typeof r.date==='string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(r.date) : null;
    if(!bs.length)return '';
    if(date){var parsed=new Date(Number(date[1]),Number(date[2])-1,Number(date[3]));if(parsed.getFullYear()!==Number(date[1])||parsed.getMonth()+1!==Number(date[2])||parsed.getDate()!==Number(date[3]))date=null;}
    return '<section class="review-card"><h2>今日选品点评 '+(date?'<small>'+Number(date[2])+'月'+Number(date[3])+'日</small>':'')+'</h2><ul>'+bs.map(function (b) {return '<li>'+esc(b)+'</li>';}).join('')+'</ul><p>'+esc(typeof r.note==='string'?r.note:'AI 根据今天数据写的，仅供参考')+'</p></section>';
  }
  function renderContent() { var rows=arr(data.trends).filter(function (p) {return p&&typeof p==='object'&&!Array.isArray(p);}),html='';
    rows.sort(function (a,b) {return (path(b)?1:0)-(path(a)?1:0)||(num(b.sc)?b.sc:0)-(num(a.sc)?a.sc:0);});
    if(active==='trends')html=reviewCard();
    if(active==='prices'){html=settingsPanel();rows=rows.filter(function (p) {return cost(p)!==null||num(obj(p.dw).ask)||num(obj(p.xy).med);});}
    if(active==='signals')html=arr(data.signals).map(obj).map(function (p) {return '<article class="panel signal"><span class="pill">'+esc(plain(str(p.pl)))+'</span><p>'+esc(p.t)+'</p>'+(num(p.h)?'<p>热度 '+esc(count(p.h))+'</p>':'')+link(p.u,'看原帖 ›')+'</article>';}).join('');
    else if(active==='khm'){
      html=rows.filter(function (p) {return num(p.khm)&&p.khm>0;}).map(function (p) {return '<article class="panel compact">'+photo(p)+'<div><h2>'+esc(title(p))+'</h2><p>柬埔寨适合度 '+new Array(Math.max(1,Math.min(5,Math.round(p.khm)))+1).join('★')+'</p></div></article>';}).join('');
      [['amazon_us','美国亚马逊热卖'],['google_th','泰国谷歌热搜'],['google_vn','越南谷歌热搜'],['google_kh','柬埔寨谷歌热搜']].forEach(function (x) {html+='<section class="panel"><h2>'+x[1]+'</h2>'+(arr(obj(data.overseas)[x[0]]).map(obj).map(function (r) {return '<p>'+esc(r.t)+(num(r.h)?' · 热度 '+esc(count(r.h)):'')+' '+link(r.u)+'</p>';}).join('')||'<p>暂无</p>')+'</section>';});
    }else {displayedRows=rows;html+=rows.map(active==='prices'?comparison:card).join('');}
    el('list').innerHTML=html||'<p class="panel">暂无数据，稍后刷新看看。</p>';
  }
  function render() { el('tabs').innerHTML=tabs.map(function (t) {return '<button data-tab="'+t[0]+'" aria-pressed="'+(active===t[0])+'" class="'+(active===t[0]?'active':'')+'">'+t[1]+'</button>';}).join('');var tab=tabs.filter(function (t) {return t[0]===active;})[0];el('content').innerHTML='<p class="explain">'+tab[2]+'</p><div id="list"></div>';renderContent();
    var ap=obj(data.apify);el('footer').innerHTML='<details class="panel"><summary>这些数据从哪来？</summary><p>热度参考网上讨论、搜索变化、成交和二手市场。价格来自公开商品页；进货前请核实授权、质量和实际报价。</p><p>有照片的商品先展示，再按热度排列。照片不代表货源已获正品授权。</p></details><p>更新时间：'+esc(data.generated_at_label || data.generated_at)+'</p><p>Apify 本月用量 '+(num(ap.mtd_usd)?'$'+ap.mtd_usd.toFixed(4):'暂无')+' / $4.50 上限</p>';
  }
  Object.keys(defaults).forEach(function (k) {var n=Number(settings[k]);settings[k]=settings[k]!==null&&settings[k]!==''&&isFinite(n)&&n>=0?n:defaults[k];});
  document.addEventListener('click',function (e) {var n=e.target;while(n&&n!==document){if(n.tagName==='A')return;if(n.hasAttribute&&n.hasAttribute('data-tab')){active=n.getAttribute('data-tab');render();return;}if(n.hasAttribute&&n.hasAttribute('data-more')){var open=n.getAttribute('aria-expanded')!=='true';n.setAttribute('aria-expanded',String(open));n.textContent=open?'收起详情 ▴':'看详情 ▾';n.nextElementSibling.hidden=!open;return;}if(n.id==='refresh'){load();return;}if(n.id==='reset'){settings={ship:15,kg:0.3,mult:2.5};save('baopin_h5_settings',JSON.stringify(settings));renderContent();return;}n=n.parentNode;} });
  document.addEventListener('input',function (e) {var k=e.target.getAttribute('data-setting'),v=Number(e.target.value);if(!Object.prototype.hasOwnProperty.call(defaults,k))return;if(e.target.value!==''&&isFinite(v)&&v>=0){settings[k]=v;save('baopin_h5_settings',JSON.stringify(settings));var cards=el('list').querySelectorAll('[data-item]');Array.prototype.forEach.call(cards,function (node) {var id=Number(node.getAttribute('data-item')),p=displayedRows[id];if(!p)return;var old=node.querySelector('.earning');if(old)old.outerHTML=earning(p);var more=node.querySelector('.more');if(more)more.innerHTML=detail(p);});} });
  document.addEventListener('error',function (e) {if(e.target.tagName==='IMG'){var tile=document.createElement('div');tile.className='photo placeholder';tile.textContent=(e.target.alt||'').slice(0,2);e.target.parentNode.replaceChild(tile,e.target);}},true);
  function load() {el('notice').textContent='正在刷新…';el('refresh').disabled=true;var xhr=new XMLHttpRequest();xhr.open('GET','./data.json?t='+Date.now(),true);xhr.timeout=15000;function fail(){el('refresh').disabled=false;var cached=parse(read('baopin_h5_data'));if(cached&&typeof cached==='object'&&!Array.isArray(cached)){data=cached;render();el('notice').textContent='网络暂时不通，显示上次的数据。';}else el('notice').textContent='加载失败，请点击刷新重试。';}xhr.onload=function () {var d=parse(xhr.responseText);if(xhr.status>=200&&xhr.status<300&&d&&typeof d==='object'&&!Array.isArray(d)){data=d;save('baopin_h5_data',JSON.stringify(d));render();el('notice').textContent='';el('refresh').disabled=false;}else fail();};xhr.onerror=fail;xhr.ontimeout=fail;xhr.send();}
  load();
}());
