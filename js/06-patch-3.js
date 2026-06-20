
/* WM PATCH: C Flow menu autocomplete restore
   - 영양 계산은 메뉴별 WM_MENU_NUTRITION_DB 유지
   - C Flow 입력창은 MENU_DB / CLEAN_MENUS / WM_MENU_NUTRITION_DB 인덱스를 검색해서 자동완성 드롭다운 표시
*/
(function(){
  if(window.WM_C_FLOW_AUTOCOMPLETE_RESTORE && window.WM_C_FLOW_AUTOCOMPLETE_RESTORE.applied) return;

  function arr(v){ return Array.isArray(v) ? v : []; }
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function norm(s){ return String(s||'').toLowerCase().replace(/\s+/g,'').trim(); }
  function menuNameOf(x){
    if(!x) return '';
    if(typeof x === 'string') return x;
    return x.name || x.menu || x.title || x.krName || x.koName || '';
  }
  function menuMeta(name){
    var n = String(name||'');
    var meta = null;
    try{ if(window.MENU_DB && window.MENU_DB[n] && typeof window.MENU_DB[n] === 'object') meta = window.MENU_DB[n]; }catch(e){}
    try{ if(!meta && window.MENU_SCHEMA_V2 && window.MENU_SCHEMA_V2[n] && typeof window.MENU_SCHEMA_V2[n] === 'object') meta = window.MENU_SCHEMA_V2[n]; }catch(e){}
    try{
      if(window.CLEAN_MENUS){
        var cm = window.CLEAN_MENUS.find(function(x){ return menuNameOf(x) === n; });
        if(cm) meta = Object.assign({}, meta||{}, cm);
      }
    }catch(e){}
    try{ if(window.WM_MENU_NUTRITION_DB && window.WM_MENU_NUTRITION_DB[n]) meta = Object.assign({}, meta||{}, window.WM_MENU_NUTRITION_DB[n]); }catch(e){}
    return meta || {};
  }
  function buildMenuIndex(){
    var out = [];
    function add(v){
      var name = String(menuNameOf(v)||'').trim();
      if(!name || name.length < 2) return;
      if(!out.includes(name)) out.push(name);
    }
    try{ Object.keys(window.MENU_DB||{}).forEach(add); }catch(e){}
    try{ Object.keys(window.MENU_SCHEMA_V2||{}).forEach(add); }catch(e){}
    try{ Object.keys(window.WM_MENU_NUTRITION_DB||{}).forEach(add); }catch(e){}
    try{ arr(window.CLEAN_MENUS).forEach(add); }catch(e){}
    try{ arr(window.MENUS).forEach(add); }catch(e){}
    try{ arr(window.ALL_MENUS).forEach(add); }catch(e){}
    return out.sort(function(a,b){ return a.localeCompare(b,'ko'); });
  }
  function selectedMenus(){ return arr(window.S && window.S.bcMenus); }
  function pickMenu(name){
    if(!window.S) return;
    if(!Array.isArray(S.bcMenus)) S.bcMenus=[];
    var max = (typeof totalMeals === 'function' ? totalMeals() : 14);
    name = String(name||'').trim();
    if(name && !S.bcMenus.includes(name) && S.bcMenus.length < max) S.bcMenus.push(name);
    var input = document.getElementById('c-inp');
    if(input) input.value='';
    hideDrop();
    if(typeof render === 'function') render();
  }
  function hideDrop(){
    var ac=document.getElementById('ac-drop');
    if(ac){ ac.style.display='none'; ac.innerHTML=''; }
  }
  function renderDrop(q){
    var input=document.getElementById('c-inp');
    var ac=document.getElementById('ac-drop');
    if(!input || !ac) return;
    q = String(q==null ? input.value : q).trim();
    var nq = norm(q);
    if(!nq){ hideDrop(); return; }
    var selected = selectedMenus();
    var names = buildMenuIndex();
    var rows = names.filter(function(n){ return norm(n).indexOf(nq) >= 0; }).slice(0,20);
    if(!rows.length){
      ac.innerHTML = '<div class="wm-c-ac-empty">검색 결과가 없어요. 직접 추가할 수 있어요.</div>';
      ac.style.display='block';
      return;
    }
    ac.innerHTML = '<div class="wm-c-ac-head">메뉴 검색 결과</div>' + rows.map(function(n){
      var m = menuMeta(n);
      var kcal = '';
      try{
        var nut = typeof calcNutrition === 'function' ? calcNutrition(n,1) : null;
        kcal = nut ? (nut.calRange || ((nut.cal||nut.kcal||0)+'kcal')) : '';
      }catch(e){}
      var tag = m.type || m.style || m.country || m.category || '';
      var picked = selected.includes(n);
      return '<button type="button" class="wm-c-ac-row '+(picked?'picked':'')+'" onclick="wmPickCMenu(\''+esc(n)+'\')">'+
        '<div><b>'+esc(n)+'</b><span>'+(tag?esc(tag)+' · ':'')+(kcal?esc(kcal):'메뉴 DB')+'</span></div>'+
        '<em>'+(picked?'선택됨':'추가')+'</em></button>';
    }).join('');
    ac.style.display='block';
  }

  window.wmPickCMenu = pickMenu;
  window.showAutoComplete = renderDrop;

  function bindInput(){
    var input=document.getElementById('c-inp');
    var ac=document.getElementById('ac-drop');
    if(!input || !ac || input.__wmAutoBound) return;
    input.__wmAutoBound = true;
    input.setAttribute('oninput','showAutoComplete(this.value)');
    input.addEventListener('input',function(){ renderDrop(input.value); });
    input.addEventListener('focus',function(){ if(input.value.trim()) renderDrop(input.value); });
    document.addEventListener('click',function(ev){
      var wrap = input.closest('.wm-flow-direct-input');
      if(wrap && !wrap.contains(ev.target)) hideDrop();
    }, true);
    var wrap=input.closest('.wm-flow-direct-input');
    if(wrap){ wrap.style.position='relative'; }
    ac.className='wm-c-ac-drop';
  }

  var oldRender = window.render;
  if(typeof oldRender === 'function' && !oldRender.__wmCAutoRestore){
    var wrapped = function(){
      var r = oldRender.apply(this, arguments);
      setTimeout(bindInput, 0);
      return r;
    };
    wrapped.__wmCAutoRestore = true;
    window.render = wrapped;
  }
  setTimeout(bindInput, 0);

  var css=document.createElement('style');
  css.textContent = `
    .wm-flow-direct-input{position:relative!important;}
    .wm-c-ac-drop,#ac-drop.wm-c-ac-drop{
      display:none;position:absolute!important;top:calc(100% + 8px)!important;left:0!important;right:0!important;
      background:#fff!important;border:1px solid rgba(109,93,246,.16)!important;border-radius:20px!important;
      box-shadow:0 18px 46px rgba(15,23,42,.16)!important;z-index:9999!important;overflow:hidden!important;
      max-height:292px!important;overflow-y:auto!important;
    }
    .wm-c-ac-head{padding:10px 14px 8px;font-size:11px;font-weight:900;color:#7C8698;letter-spacing:.8px;border-bottom:1px solid rgba(17,24,39,.055);background:#FAFAFF;}
    .wm-c-ac-row{width:100%;border:0;border-bottom:1px solid rgba(17,24,39,.055);background:#fff;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;}
    .wm-c-ac-row:last-child{border-bottom:0;}
    .wm-c-ac-row b{display:block;font-size:14px;color:#111827;font-weight:900;letter-spacing:-.25px;}
    .wm-c-ac-row span{display:block;margin-top:4px;font-size:11px;color:#7C8698;font-weight:650;}
    .wm-c-ac-row em{font-style:normal;font-size:11px;font-weight:900;color:#6D5DF6;background:#F3F0FF;border-radius:999px;padding:6px 9px;white-space:nowrap;}
    .wm-c-ac-row.picked{background:#FFF5FA;}
    .wm-c-ac-row.picked em{color:#D81B60;background:#FFE4F0;}
    .wm-c-ac-empty{padding:16px 14px;font-size:12px;color:#7C8698;background:#FAFAFF;}
  `;
  document.head.appendChild(css);

  window.WM_C_FLOW_AUTOCOMPLETE_RESTORE = {applied:true,source:'MENU_DB/CLEAN_MENUS/WM_MENU_NUTRITION_DB',nutrition:'menu_db_only'};
})();
