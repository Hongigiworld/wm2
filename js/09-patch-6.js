/* WM PATCH v6: C Flow autocomplete optimized final
   - 기존 06/07/08 자동완성 패치는 비활성화하고 이 파일 하나만 사용
   - 검색 인덱스 최초 1회 생성 + 150ms debounce
   - 2글자 이상 입력 시만 검색
   - 결과 최대 8개만 렌더링
   - 0kcal/미등록 메뉴 제외
   - main/side/type/category는 내부 분류용으로만 유지, UI 노출 없음
*/
(function(){
  if(window.WM_C_FLOW_AUTOCOMPLETE_V6 && window.WM_C_FLOW_AUTOCOMPLETE_V6.applied) return;

  var INDEX = null;
  var timer = null;
  var lastQuery = '';
  var lastInput = null;

  function esc(s){
    return String(s||'').replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function norm(s){
    return String(s||'').toLowerCase().replace(/[\s·,._\-()\[\]{}]/g,'').trim();
  }
  function arr(v){ return Array.isArray(v) ? v : []; }
  function nameOf(v){
    if(!v) return '';
    if(typeof v === 'string') return v;
    return v.name || v.menu || v.title || v.krName || v.koName || '';
  }
  function addRaw(out, name){
    name = String(name || '').trim();
    if(name.length >= 2 && !out[name]) out[name] = true;
  }
  function nutOf(name){
    var db = window.WM_MENU_NUTRITION_DB || {};
    var raw = String(name || '').trim();
    var key = raw;

    if(db[key] && Number(db[key].kcal || db[key].cal || 0) > 0) return db[key];

    try{
      if(window.NAME_MAP && window.NAME_MAP[raw] && db[window.NAME_MAP[raw]]) {
        key = window.NAME_MAP[raw];
        if(Number(db[key].kcal || db[key].cal || 0) > 0) return db[key];
      }
    }catch(e){}

    try{
      if(typeof window.flowMenuDBName === 'function'){
        key = window.flowMenuDBName(raw);
        if(key && db[key] && Number(db[key].kcal || db[key].cal || 0) > 0) return db[key];
      }
    }catch(e){}

    var compact = norm(raw);
    var keys = Object.keys(db);
    for(var i=0;i<keys.length;i++){
      if(norm(keys[i]) === compact && Number(db[keys[i]].kcal || db[keys[i]].cal || 0) > 0){
        return db[keys[i]];
      }
    }
    return null;
  }
  function kcalLabel(name){
    var n = nutOf(name);
    if(!n) return '';
    var cal = Number(n.kcal || n.cal || 0);
    if(!cal || cal <= 0) return '';
    return Math.round(cal) + 'kcal';
  }
  function buildIndex(){
    if(INDEX) return INDEX;

    var raw = {};
    try{ Object.keys(window.WM_MENU_NUTRITION_DB || {}).forEach(function(n){ addRaw(raw,n); }); }catch(e){}
    try{ Object.keys(window.MENU_DB || {}).forEach(function(n){ addRaw(raw,n); }); }catch(e){}
    try{ Object.keys(window.MENU_SCHEMA_V2 || {}).forEach(function(n){ addRaw(raw,n); }); }catch(e){}
    try{ arr(window.CLEAN_MENUS).forEach(function(x){ addRaw(raw, nameOf(x)); }); }catch(e){}
    try{ arr(window.MENUS).forEach(function(x){ addRaw(raw, nameOf(x)); }); }catch(e){}
    try{ arr(window.ALL_MENUS).forEach(function(x){ addRaw(raw, nameOf(x)); }); }catch(e){}

    INDEX = Object.keys(raw).map(function(name){
      var kcal = kcalLabel(name);
      if(!kcal) return null;
      return { name:name, key:norm(name), kcal:kcal };
    }).filter(Boolean).sort(function(a,b){ return a.name.localeCompare(b.name,'ko'); });

    console.info('[WM autocomplete v6] verified index size:', INDEX.length);
    return INDEX;
  }
  function overlay(){
    var el = document.getElementById('wm-c-fixed-ac');
    if(!el){
      el = document.createElement('div');
      el.id = 'wm-c-fixed-ac';
      document.body.appendChild(el);
    }
    return el;
  }
  function hide(){
    var el = document.getElementById('wm-c-fixed-ac');
    if(el){ el.style.display='none'; el.innerHTML=''; }
    var old = document.getElementById('ac-drop');
    if(old){ old.style.display='none'; old.innerHTML=''; }
  }
  function position(el, input){
    var r = input.getBoundingClientRect();
    el.style.left = Math.max(12, r.left) + 'px';
    el.style.top = (r.bottom + 8) + 'px';
    el.style.width = Math.min(r.width, window.innerWidth - 24) + 'px';
    el.style.maxHeight = Math.max(160, Math.min(300, window.innerHeight - r.bottom - 24)) + 'px';
  }
  function match(q){
    var nq = norm(q);
    if(nq.length < 2) return [];

    var starts = [], contains = [];
    buildIndex().forEach(function(x){
      if(x.key.indexOf(nq) === 0) starts.push(x);
      else if(x.key.indexOf(nq) >= 0) contains.push(x);
    });
    return starts.concat(contains).slice(0, 8);
  }
  function pick(name){
    if(!window.S) window.S = {};
    if(!Array.isArray(S.bcMenus)) S.bcMenus = [];

    var max = 14;
    try{ if(typeof window.totalMeals === 'function') max = window.totalMeals(); }catch(e){}

    name = String(name || '').trim();
    if(name && S.bcMenus.indexOf(name) < 0 && S.bcMenus.length < max) S.bcMenus.push(name);

    var input = document.getElementById('c-inp');
    if(input) input.value = '';
    hide();

    if(typeof window.render === 'function') window.render();
  }
  function renderNow(value){
    var input = document.getElementById('c-inp');
    if(!input) return;

    var q = String(value == null ? input.value : value).trim();
    var old = document.getElementById('ac-drop');
    if(old){ old.style.display='none'; old.innerHTML=''; }

    if(norm(q).length < 2){ hide(); return; }

    lastQuery = q;
    lastInput = input;

    var rows = match(q);
    var el = overlay();
    position(el, input);

    if(!rows.length){
      el.innerHTML = '<div class="wm-c-fixed-empty">검증 칼로리가 등록된 메뉴가 없어요.</div>';
      el.style.display = 'block';
      return;
    }

    var selected = arr(window.S && window.S.bcMenus);
    el.innerHTML =
      '<div class="wm-c-fixed-head">메뉴 자동완성 · 검증 칼로리만 표시</div>' +
      rows.map(function(x){
        var picked = selected.indexOf(x.name) >= 0;
        return '<button type="button" class="wm-c-fixed-row '+(picked?'picked':'')+'" data-menu="'+esc(x.name)+'">' +
          '<div><b>'+esc(x.name)+'</b><span>'+esc(x.kcal)+'</span></div>' +
          '<em>'+(picked?'선택됨':'추가')+'</em>' +
        '</button>';
      }).join('');

    el.style.display = 'block';
  }
  function scheduleShow(value){
    clearTimeout(timer);
    timer = setTimeout(function(){ renderNow(value); }, 150);
  }
  function bind(){
    var input = document.getElementById('c-inp');
    if(!input) return;

    input.setAttribute('autocomplete','off');
    input.removeAttribute('oninput');

    if(input.__wmAutoV6) return;
    input.__wmAutoV6 = true;

    input.addEventListener('input', function(){ scheduleShow(input.value); });
    input.addEventListener('compositionend', function(){ scheduleShow(input.value); });
    input.addEventListener('focus', function(){ scheduleShow(input.value); });
  }

  window.wmCFlowPickFixed = pick;
  window.wmPickCMenu = pick;
  window.showAutoComplete = function(v){ scheduleShow(v); };

  document.addEventListener('click', function(e){
    var btn = e.target && e.target.closest && e.target.closest('#wm-c-fixed-ac .wm-c-fixed-row');
    if(btn){
      e.preventDefault();
      pick(btn.getAttribute('data-menu'));
      return;
    }
    if(e.target && e.target.id === 'c-inp'){
      bind();
      scheduleShow(e.target.value);
      return;
    }
    if(!(e.target && e.target.closest && e.target.closest('#wm-c-fixed-ac'))) hide();
  }, true);

  var oldGo = window.go;
  if(typeof oldGo === 'function' && !oldGo.__wmAutoV6){
    window.go = function(){
      var r = oldGo.apply(this, arguments);
      setTimeout(bind, 80);
      return r;
    };
    window.go.__wmAutoV6 = true;
  }

  var oldRender = window.render;
  if(typeof oldRender === 'function' && !oldRender.__wmAutoV6){
    window.render = function(){
      var r = oldRender.apply(this, arguments);
      setTimeout(bind, 80);
      return r;
    };
    window.render.__wmAutoV6 = true;
  }

  var css = document.getElementById('wm-c-verified-ac-style-v6');
  if(!css){
    css = document.createElement('style');
    css.id = 'wm-c-verified-ac-style-v6';
    css.textContent = `
      #ac-drop{display:none!important;}
      #wm-c-fixed-ac{
        display:none;position:fixed!important;background:#fff!important;
        border:1px solid rgba(109,93,246,.18)!important;border-radius:20px!important;
        box-shadow:0 20px 54px rgba(15,23,42,.22)!important;
        z-index:2147483647!important;overflow-y:auto!important;overscroll-behavior:contain!important;
      }
      .wm-c-fixed-head{
        padding:10px 14px 8px;font-size:11px;font-weight:900;color:#7C8698;
        letter-spacing:.8px;border-bottom:1px solid rgba(17,24,39,.055);
        background:#FAFAFF;position:sticky;top:0;z-index:1;
      }
      .wm-c-fixed-row{
        width:100%!important;height:auto!important;border:0!important;
        border-bottom:1px solid rgba(17,24,39,.055)!important;background:#fff!important;
        padding:12px 14px!important;display:flex!important;align-items:center!important;
        justify-content:space-between!important;gap:12px!important;text-align:left!important;
        box-shadow:none!important;border-radius:0!important;color:#111827!important;font-family:inherit!important;
      }
      .wm-c-fixed-row:last-child{border-bottom:0!important;}
      .wm-c-fixed-row b{display:block;font-size:14px;color:#111827;font-weight:900;letter-spacing:-.25px;}
      .wm-c-fixed-row span{display:block;margin-top:4px;font-size:11px;color:#FF7A00;font-weight:850;}
      .wm-c-fixed-row em{font-style:normal;font-size:11px;font-weight:900;color:#6D5DF6;background:#F3F0FF;border-radius:999px;padding:6px 9px;white-space:nowrap;}
      .wm-c-fixed-row.picked{background:#FFF5FA!important;}
      .wm-c-fixed-row.picked em{color:#D81B60;background:#FFE4F0;}
      .wm-c-fixed-empty{padding:16px 14px;font-size:12px;color:#7C8698;background:#FAFAFF;line-height:1.45;}
    `;
    document.head.appendChild(css);
  }

  setTimeout(bind, 0);
  setTimeout(bind, 300);
  setTimeout(bind, 1000);

  window.WM_C_FLOW_AUTOCOMPLETE_V6 = {applied:true, mode:'single_optimized_verified_index'};
})();
