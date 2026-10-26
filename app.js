(function () {
  'use strict';
  var data = {}, active = read('baopin_h5_tab') || 'trends', registry = [], current = null, oldFocus = null;
  var defaults = {ship:15, kg:0.3, mult:2.5}, settings = obj(parse(read('baopin_h5_settings'))), timer;
  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function scalar(v) { return typeof v === 'string' || typeof v === 'number' && isFinite(v) || typeof v === 'boolean'; }
  function str(v) { return scalar(v) && v !== '' ? String(v) : '—'; }
  function esc(v) { return str(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function num(v) { return typeof v === 'number' && isFinite(v); }
  function setting(v) { return (typeof v === 'string' && v.trim() !== '' || num(v)) && isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : null; }
  function read(k) { try { return localStorage.getItem(k); } catch(e) { return null; } }
  function save(k,v) { try { localStorage.setItem(k,v); } catch(e) {} }
  function parse(v) { try { return JSON.parse(v); } catch(e) { return null; } }
  function el(id) { return document.getElementById(id); }
  function url(v) { return typeof v === 'string' && /^https?:\/\/[^\s]+$/i.test(v) ? v : ''; }
  function link(u,t,cls) { return url(u) ? '<a class="'+(cls || 'link')+'" href="'+esc(url(u))+'" target="_blank" rel="noopener">'+esc(t)+'</a>' : '<span class="'+(cls || '')+'">'+esc(t)+'</span>'; }
  function money(v,unit) { return num(v) ? (unit || '¥')+v.toFixed(2) : '—'; }
  function heat(v) { return !num(v) ? '—' : v>=1e8 ? (v/1e8).toFixed(1)+'亿' : v>=1e4 ? (v/1e4).toFixed(1)+'万' : String(v); }
  function percent(v) { return num(v) ? v.toFixed(1)+'%' : '—'; }
  function title(p) { return p.t || p.title || '暂无标题'; }
  function platforms(p) { return Array.isArray(p.pl) ? p.pl.filter(scalar).join('、') || '—' : str(p.pl || p.platform); }
  function thumb(p,big) { var path = typeof p.th === 'string' ? p.th : typeof p.thumb === 'string' ? p.thumb : ''; var cls=big?'thumb hero':'thumb';
    if (!path || !/^[a-zA-Z0-9_./%-]+$/.test(path) || path.indexOf('..')!==-1 || path.charAt(0)==='/') return '<div class="'+cls+' placeholder">暂无图片</div>';
    return '<img class="'+cls+'" src="./'+esc(path)+'" alt="'+esc(title(p))+'" loading="lazy">'; }
  function badges(p) { var colors={'搜索热度':'blue','讨论热度':'orange','真实成交':'green','二手溢价':'purple','官方新品':'pink','货源':'gray'}; return '<div class="badges">'+arr(p.b).map(function(v){v=obj(v);return link(v.u,v.label || v.type || v.value,'badge '+(colors[v.type] || 'gray'));}).join('')+'</div>'; }
  function grid(p) { var a=obj(p.ali),pm=obj(p.pm),cost=num(p.sp)?p.sp:num(a.pc)?a.pc:null;
    var mult=setting(settings.mult),ship=setting(settings.ship),kg=setting(settings.kg),sell=cost!==null&&mult!==null?cost*mult:null,freight=ship!==null&&kg!==null?ship*kg:null;
    var profit=sell!==null&&cost!==null&&freight!==null?sell-cost-freight:null,rate=profit!==null&&sell>0?profit/sell:null;
    function cell(k,v,cls){return '<div>'+esc(k)+'<strong class="'+(cls || '')+'">'+esc(v)+'</strong></div>';}
    return '<div class="grid">'+(genericPrice(p)!=='—'?cell('商品标价',genericPrice(p)):'')+cell('1688价',num(p.sp)?money(p.sp):'未匹配')+cell('AliExpress价',money(a.pc)+' ('+money(a.p,'$')+')')+cell('泡泡玛特官方价',money(pm.p,'$'))+cell('成本（'+(num(p.sp)?'1688价':num(a.pc)?'AliExpress价':'暂无')+'）',money(cost))+cell('金边售价（估算）',money(sell))+cell('运费（估算）',money(freight))+cell('毛利（估算）',money(profit),num(profit)?profit>=0?'positive':'negative':'')+cell('毛利率（估算）',rate===null?'—':percent(rate*100),num(profit)?profit>=0?'positive':'negative':'')+'</div>'; }
  function safely(rows,fn) { return arr(rows).map(function(p){try{return fn(obj(p));}catch(e){return '<div class="card muted">暂无可展示数据</div>';}}).join(''); }
  function card(p,mode) { var id=registry.push(p)-1,m=obj(arr(p.m)[0]); return '<article class="card" data-item="'+id+'" tabindex="0" role="button" aria-label="查看'+esc(title(p))+'详情"><div class="row">'+thumb(p,false)+'<div class="body"><div class="title">'+esc(title(p))+'</div><div class="muted">'+esc(p.c || p.cat)+' · '+esc(platforms(p))+'</div></div><div class="score">'+(num(p.sc)?esc(p.sc):'—')+'<small>/100</small></div></div>'+badges(p)+(mode==='products'?'<p>价格 '+esc(genericPrice(p))+'</p>':'')+(Object.keys(m).length?'<p class="small">'+esc(m.pl)+' #'+esc(m.rk)+' '+esc(m.t)+'</p>':'')+(mode==='khm'?'<p class="badge green">柬埔寨适合度 '+esc(p.khm)+'/5</p>':'')+(mode==='prices'||mode==='khm'?grid(p):'')+'</article>'; }
  function genericPrice(p) { var keys=['price','price_cny','price_usd','p','pc'];for(var i=0;i<keys.length;i++){if(num(p[keys[i]]))return money(p[keys[i]],keys[i]==='price_usd'?'$':'¥');}return '—'; }
  function hasPrice(p) { p=obj(p);return num(p.sp)||num(obj(p.ali).p)||num(obj(p.ali).pc)||num(obj(p.pm).p)||genericPrice(p)!=='—'; }
  function notes() { var n=obj(data.source_notes);return '<details class="panel"><summary>信号说明</summary>'+Object.keys(n).map(function(k){return '<p><strong>'+esc(k)+'</strong>：'+esc(n[k])+'</p>';}).join('')+'</details>'; }
  function overseas() { var o=obj(data.overseas), names={google_kh:'柬埔寨',google_th:'泰国',google_vn:'越南',amazon_us:'美国亚马逊'},keys=Object.keys(o).filter(function(k){return arr(o[k]).length;});return keys.length?'<details class="panel"><summary>海外热搜参考</summary>'+keys.map(function(k){return '<h3>'+esc(names[k] || k)+'</h3>'+safely(o[k],function(p){return '<div class="source">'+link(p.u,p.t || p.title)+'<p class="muted">价格 '+esc(num(p.p)?p.p:'—')+' · 热度 '+esc(heat(p.h))+'</p></div>';});}).join('')+'</details>':''; }
  function render() { registry=[]; var trends=arr(data.trends), products=arr(data.products).length?arr(data.products):arr(data.hot),tabs=[];
    if(trends.length)tabs.push(['trends','潮流趋势']);if(products.length)tabs.push(['products','爆品榜']);tabs.push(['prices','进货价对比'],['signals','带货信号'],['khm','适合柬埔寨']);
    if(!tabs.some(function(t){return t[0]===active;}))active=tabs[0][0];
    el('tabs').innerHTML=tabs.map(function(t){return '<button data-tab="'+t[0]+'" class="'+(active===t[0]?'active':'')+'" aria-pressed="'+(active===t[0])+'">'+t[1]+'</button>';}).join('');
    var html='', rows=[];if(active==='trends'){html=notes();rows=trends;}if(active==='products')rows=products;if(active==='prices')rows=trends.concat(products).filter(hasPrice);
    if(active==='khm')rows=trends.filter(function(p){return num(obj(p).khm)&&p.khm>0;}).slice().sort(function(a,b){return b.khm-a.khm || (num(b.sc)?b.sc:0)-(num(a.sc)?a.sc:0);});
    if(active==='signals'){html=safely(data.signals,function(p){return '<article class="card">'+link(p.u,p.t || p.title)+'<p>'+esc(p.pl)+' · '+esc(p.cr)+'</p><p class="muted">热度 '+esc(heat(p.h))+'</p><div class="badges">'+(p.tm?'<span class="badge green">匹配：'+esc(p.tm)+'</span>':'')+(p.tag?'<span class="badge">'+esc(p.tag)+'</span>':'')+'</div></article>';});}
    else html+=safely(rows,function(p){return card(p,active);});
    if(!(active==='signals'?arr(data.signals).length:rows.length))html+='<p class="empty">'+(active==='prices'?'暂无价格数据':'暂无数据，稍后刷新看看')+'</p>';
    if(active==='khm')html+=overseas();el('content').innerHTML=html;
    el('footer').innerHTML='<details class="panel"><summary>数据源状态</summary>'+safely(data.sources,function(s){return '<div class="source">'+[s.name,s.type,s.status,s.count].map(esc).join(' · ')+(s.reason?'<p>'+esc(s.reason)+'</p>':'')+'</div>';})+'</details><p>数据来自公开来源，未编造；利润为示例参数估算</p>'+(Object.keys(obj(data.fx)).length?'<p>汇率 1 USD = '+esc(obj(data.fx).usd_cny)+' CNY</p>':'');
    if(current)detail(current);
  }
  function mainLink(p) { var candidates=[p.u,p.url,p.su,obj(p.ali).u,obj(p.pm).u,p.s1688];for(var i=0;i<candidates.length;i++)if(url(candidates[i]))return url(candidates[i]);return ''; }
  function detail(p) { var a=obj(p.ali),pm=obj(p.pm),pt=obj(p.pt),labels={discuss:'讨论热度 /40',search:'搜索热度 /20',sales:'累计成交 /15',resale:'二手溢价 /10',source:'货源 /10',khm:'柬埔寨 /5',newrel:'新品'},known='t title c cat sc pt b pl m gt x ali pm sp su s1688 khm u url price price_cny price_usd p pc platform thumb'.split(' '),extras=Object.keys(p).filter(function(k){return k!=='th'&&k!=='id'&&k.charAt(0)!=='_'&&k!=='internal'&&known.indexOf(k)<0&&scalar(p[k]);});
    var parts=Object.keys(labels).concat(Object.keys(pt).filter(function(k){return !labels[k];}));
    el('detail').innerHTML=thumb(p,true)+'<h2>'+esc(title(p))+'</h2><p>'+esc(p.c || p.cat)+' · 综合评分 '+esc(num(p.sc)?p.sc:null)+'/100</p><p class="muted">来源平台：'+esc(platforms(p))+'</p>'+ (mainLink(p)?link(mainLink(p),'打开来源')+' <button id="copy">复制链接</button><span id="copy-status" role="status"></span>':'')+badges(p)+'<h3>评分明细</h3><div class="grid">'+parts.map(function(k){return '<div>'+esc(labels[k] || k)+'<strong>'+esc(num(pt[k])?pt[k]:(k==='resale'?'暂无可用来源':null))+'</strong></div>';}).join('')+'</div><h3>平台提及</h3>'+(safely(p.m,function(m){return '<div class="mention">'+esc(m.pl)+' #'+esc(m.rk)+' '+link(m.u,m.t)+'<p class="muted">热度 '+esc(heat(m.h))+'</p></div>';}) || '<p>暂无</p>')+'<h3>Google Trends 增长</h3>'+ (Object.keys(obj(p.gt)).map(function(k){return '<p>'+esc(k)+'：'+esc(percent(p.gt[k]))+'</p>';}).join('') || '<p>暂无</p>')+'<p>X 增长：'+esc(percent(p.x))+'</p><h3>AliExpress</h3><p>'+esc(money(a.pc))+' / '+esc(money(a.p,'$'))+' · '+esc(a.s)+'</p>'+link(a.u,'商品链接')+'<h3>泡泡玛特官方</h3><p>'+esc(pm.t)+' · '+esc(money(pm.p,'$'))+'</p><p>发售：'+esc(pm.d)+'</p>'+link(pm.u,'官方链接')+'<h3>1688 货源</h3><p>'+esc(money(p.sp))+'</p>'+link(p.su,'1688 链接')+' '+link(p.s1688,'1688 搜索')+'<h3>利润估算（当前示例参数）</h3>'+grid(p)+(extras.length?'<h3>其他字段</h3><ul class="detail-list">'+extras.map(function(k){return '<li>'+esc(k)+'：'+esc(p[k])+'</li>';}).join('')+'</ul>':'');
  }
  function open(p) { current=p;oldFocus=document.activeElement;detail(p);el('overlay').hidden=false;document.body.classList.add('detailopen');history.pushState({baopinDetail:true},'');el('close').focus(); }
  function hide() { current=null;el('overlay').hidden=true;document.body.classList.remove('detailopen');if(oldFocus&&document.contains(oldFocus))oldFocus.focus(); }
  function updated() { if(typeof data.generated_at_label==='string'&&data.generated_at_label)return data.generated_at_label;var d=typeof data.generated_at==='string'?new Date(data.generated_at):null;if(!d||isNaN(d.getTime()))return '—';return new Date(d.getTime()+8*3600000).toISOString().slice(0,16).replace('T',' ')+' (UTC+8)'; }
  function accept(d) { data=obj(d);el('updated').textContent=updated();render(); }
  function load() { el('refresh').disabled=true;el('notice').textContent='正在刷新…';var xhr=new XMLHttpRequest();xhr.open('GET','./data.json?t='+Date.now(),true);xhr.timeout=15000;
    function fail(){el('refresh').disabled=false;var cached=parse(read('baopin_h5_data'));if(cached&&typeof cached==='object'&&!Array.isArray(cached)){accept(cached);el('notice').textContent='网络失败，显示缓存';}else{el('notice').textContent='网络失败，暂无缓存';el('content').innerHTML='<div class="empty">加载失败，请检查网络后重试。<p><button id="retry">重试</button></p></div>';}}
    xhr.onload=function(){if(xhr.status>=200&&xhr.status<300){var d=parse(xhr.responseText);if(d&&typeof d==='object'&&!Array.isArray(d)){save('baopin_h5_data',JSON.stringify(d));accept(d);el('notice').textContent='';el('refresh').disabled=false;return;}}fail();};xhr.onerror=fail;xhr.ontimeout=fail;xhr.send(); }
  Object.keys(defaults).forEach(function(k){if(!Object.prototype.hasOwnProperty.call(settings,k))settings[k]=defaults[k];document.querySelector('[data-setting="'+k+'"]').value=scalar(settings[k])?settings[k]:'';});
  document.addEventListener('input',function(e){var k=e.target.getAttribute('data-setting');if(!k)return;settings[k]=e.target.value;save('baopin_h5_settings',JSON.stringify(settings));clearTimeout(timer);timer=setTimeout(render,200);});
  document.addEventListener('error',function(e){if(e.target.tagName==='IMG'){var d=document.createElement('div');d.className=e.target.className+' placeholder';d.textContent='暂无图片';e.target.parentNode.replaceChild(d,e.target);}},true);
  document.addEventListener('click',function(e){var n=e.target;if(n.id==='refresh'||n.id==='retry')load();if(n.id==='reset'){settings={ship:15,kg:0.3,mult:2.5};Object.keys(defaults).forEach(function(k){document.querySelector('[data-setting="'+k+'"]').value=settings[k];});save('baopin_h5_settings',JSON.stringify(settings));render();}if(n.id==='close'||n.id==='overlay'){if(current)history.back();}if(n.id==='copy')copy(mainLink(current));
    while(n&&n!==document){if(n.tagName==='A')return;if(n.getAttribute&&n.getAttribute('data-tab')){active=n.getAttribute('data-tab');save('baopin_h5_tab',active);render();return;}if(n.getAttribute&&n.hasAttribute('data-item')){open(registry[Number(n.getAttribute('data-item'))]);return;}n=n.parentNode;}
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&current)history.back();if((e.key==='Enter'||e.key===' ')&&e.target.hasAttribute('data-item')){e.preventDefault();open(registry[Number(e.target.getAttribute('data-item'))]);}if(e.key==='Tab'&&current){var f=el('overlay').querySelectorAll('button,a[href],input'),first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  window.addEventListener('popstate',hide);
  function copy(u) { function status(t){if(el('copy-status'))el('copy-status').textContent=t;}function fallback(){var t=document.createElement('textarea');t.value=u;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();t.setSelectionRange(0,u.length);var ok=false;try{ok=document.execCommand('copy');}catch(e){}document.body.removeChild(t);status(ok?' 已复制':' 复制失败，请长按来源链接复制');}if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(u).then(function(){status(' 已复制');},fallback);else fallback(); }
  load();
}());
