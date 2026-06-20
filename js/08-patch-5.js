
/* WM PATCH v3: C Flow autocomplete fixed overlay restore
   기존 #ac-drop/부모 overflow/CSS 충돌을 완전히 우회하고 body fixed overlay로 표시 */
(function(){
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function qesc(s){return String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,' ');}
  function norm(s){return String(s||'').toLowerCase().replace(/[\s·,._\-()\[\]{}]/g,'').trim();}
  function arr(v){return Array.isArray(v)?v:[];}
  function nameOf(v){return typeof v==='string'?v:(v&&(v.name||v.menu||v.title||v.krName||v.koName))||'';}
  function add(out,n){n=String(n||'').trim(); if(n.length>1 && out.indexOf(n)<0) out.push(n);}
  function buildIndex(){
    var out=[];
    try{Object.keys(window.MENU_DB||{}).forEach(function(k){add(out,k);});}catch(e){}
    try{Object.keys(window.MENU_SCHEMA_V2||{}).forEach(function(k){add(out,k);});}catch(e){}
    try{Object.keys(window.WM_MENU_NUTRITION_DB||{}).forEach(function(k){add(out,k);});}catch(e){}
    try{arr(window.CLEAN_MENUS).forEach(function(x){add(out,nameOf(x));});}catch(e){}
    try{arr(window.MENUS).forEach(function(x){add(out,nameOf(x));});}catch(e){}
    try{arr(window.ALL_MENUS).forEach(function(x){add(out,nameOf(x));});}catch(e){}
    return out.sort(function(a,b){return a.localeCompare(b,'ko');});
  }
  function meta(n){
    var m={};
    try{ if(window.MENU_DB&&window.MENU_DB[n]&&typeof window.MENU_DB[n]==='object') Object.assign(m,window.MENU_DB[n]); }catch(e){}
    try{ if(window.MENU_SCHEMA_V2&&window.MENU_SCHEMA_V2[n]&&typeof window.MENU_SCHEMA_V2[n]==='object') Object.assign(m,window.MENU_SCHEMA_V2[n]); }catch(e){}
    try{ if(window.WM_MENU_NUTRITION_DB&&window.WM_MENU_NUTRITION_DB[n]) Object.assign(m,window.WM_MENU_NUTRITION_DB[n]); }catch(e){}
    try{ var c=arr(window.CLEAN_MENUS).find(function(x){return nameOf(x)===n;}); if(c) Object.assign(m,c); }catch(e){}
    return m;
  }
  function overlay(){
    var el=document.getElementById('wm-c-fixed-ac');
    if(!el){el=document.createElement('div');el.id='wm-c-fixed-ac';document.body.appendChild(el);} return el;
  }
  function hide(){var el=document.getElementById('wm-c-fixed-ac'); if(el){el.style.display='none';el.innerHTML='';}}
  function position(el,input){
    var r=input.getBoundingClientRect();
    el.style.left=Math.max(12,r.left)+'px';
    el.style.top=(r.bottom+8)+'px';
    el.style.width=Math.min(r.width, window.innerWidth-24)+'px';
    el.style.maxHeight=Math.max(160, Math.min(320, window.innerHeight-r.bottom-24))+'px';
  }
  function matches(q){
    var nq=norm(q); if(!nq) return [];
    var idx=buildIndex();
    var starts=[], contains=[];
    idx.forEach(function(n){var nn=norm(n); if(nn.indexOf(nq)===0) starts.push(n); else if(nn.indexOf(nq)>=0) contains.push(n);});
    return starts.concat(contains).slice(0,30);
  }
  function show(value){
    var input=document.getElementById('c-inp');
    if(!input) return;
    var q=String(value==null?input.value:value).trim();
    var el=overlay();
    position(el,input);
    if(!q){hide();return;}
    var rows=matches(q), selected=arr(window.S&&window.S.bcMenus);
    if(!rows.length){
      el.innerHTML='<div class="wm-c-fixed-empty">검색 결과가 없어요. 추가 버튼으로 직접 입력할 수 있어요.</div>';
      el.style.display='block';return;
    }
    el.innerHTML='<div class="wm-c-fixed-head">메뉴 자동완성</div>'+rows.map(function(n){
      var m=meta(n); // m.type/category(main/side)는 내부 필터용 메타데이터. UI에는 노출하지 않는다.
      var kcal='';
      try{
        var nut=(typeof window.calcNutrition==='function')?window.calcNutrition(n,1):null;
        if(nut){
          var cal=Number(nut.cal||nut.kcal||0);
          var range=String(nut.calRange||'');
          if(range && !/^0\s*~\s*0/.test(range)) kcal=range;
          else if(cal>0) kcal=Math.round(cal)+'kcal';
        }
      }catch(e){}
      var picked=selected.indexOf(n)>=0;
      return '<button type="button" class="wm-c-fixed-row '+(picked?'picked':'')+'" onclick="window.wmCFlowPickFixed(\''+qesc(n)+'\')"><div><b>'+esc(n)+'</b><span>'+(kcal?esc(kcal):'칼로리 미등록')+'</span></div><em>'+(picked?'선택됨':'추가')+'</em></button>';
    }).join('');
    el.style.display='block';
  }
  function pick(n){
    if(!window.S) window.S={};
    if(!Array.isArray(S.bcMenus)) S.bcMenus=[];
    var max=14; try{if(typeof window.totalMeals==='function') max=window.totalMeals();}catch(e){}
    n=String(n||'').trim();
    if(n && S.bcMenus.indexOf(n)<0 && S.bcMenus.length<max) S.bcMenus.push(n);
    var input=document.getElementById('c-inp'); if(input) input.value='';
    hide();
    if(typeof window.render==='function') window.render();
  }
  function bind(){
    var input=document.getElementById('c-inp'); if(!input) return;
    input.setAttribute('autocomplete','off');
    input.setAttribute('oninput','window.showAutoComplete(this.value)');
    if(input.__wmCFixedAuto) return;
    input.__wmCFixedAuto=true;
    ['input','keyup','compositionend','change'].forEach(function(ev){input.addEventListener(ev,function(){show(input.value);});});
    input.addEventListener('focus',function(){if(input.value.trim()) show(input.value);});
    input.addEventListener('blur',function(){setTimeout(function(){var a=document.activeElement; if(!a || !a.closest || !a.closest('#wm-c-fixed-ac')) hide();},180);});
  }
  window.wmCFlowPickFixed=pick;
  window.wmPickCMenu=pick;
  window.showAutoComplete=show;
  document.addEventListener('input',function(e){if(e.target&&e.target.id==='c-inp') show(e.target.value);},true);
  document.addEventListener('keyup',function(e){if(e.target&&e.target.id==='c-inp') show(e.target.value);},true);
  document.addEventListener('compositionend',function(e){if(e.target&&e.target.id==='c-inp') show(e.target.value);},true);
  document.addEventListener('click',function(e){
    if(e.target&&e.target.closest&&e.target.closest('#wm-c-fixed-ac')) return;
    if(e.target&&e.target.id==='c-inp') {bind(); if(e.target.value.trim()) show(e.target.value); return;}
    hide();
  },true);
  var _render=window.render;
  if(typeof _render==='function'&&!_render.__wmCFixedAuto){window.render=function(){var r=_render.apply(this,arguments); setTimeout(bind,0); setTimeout(bind,120); return r;}; window.render.__wmCFixedAuto=true;}
  var _go=window.go;
  if(typeof _go==='function'&&!_go.__wmCFixedAuto){window.go=function(){var r=_go.apply(this,arguments); setTimeout(bind,0); setTimeout(bind,120); return r;}; window.go.__wmCFixedAuto=true;}
  try{new MutationObserver(function(){setTimeout(bind,0);}).observe(document.body,{childList:true,subtree:true});}catch(e){}
  if(!document.getElementById('wm-c-fixed-ac-style')){
    var css=document.createElement('style');css.id='wm-c-fixed-ac-style';css.textContent=`
      #wm-c-fixed-ac{display:none;position:fixed!important;background:#fff!important;border:1px solid rgba(109,93,246,.18)!important;border-radius:20px!important;box-shadow:0 20px 54px rgba(15,23,42,.22)!important;z-index:2147483647!important;overflow-y:auto!important;overscroll-behavior:contain!important;}
      .wm-c-fixed-head{padding:10px 14px 8px;font-size:11px;font-weight:900;color:#7C8698;letter-spacing:.8px;border-bottom:1px solid rgba(17,24,39,.055);background:#FAFAFF;position:sticky;top:0;z-index:1;}
      .wm-c-fixed-row{width:100%!important;height:auto!important;border:0!important;border-bottom:1px solid rgba(17,24,39,.055)!important;background:#fff!important;padding:12px 14px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;text-align:left!important;box-shadow:none!important;border-radius:0!important;color:#111827!important;font-family:inherit!important;}
      .wm-c-fixed-row:last-child{border-bottom:0!important;}
      .wm-c-fixed-row b{display:block;font-size:14px;color:#111827;font-weight:900;letter-spacing:-.25px;}
      .wm-c-fixed-row span{display:block;margin-top:4px;font-size:11px;color:#7C8698;font-weight:650;}
      .wm-c-fixed-row em{font-style:normal;font-size:11px;font-weight:900;color:#6D5DF6;background:#F3F0FF;border-radius:999px;padding:6px 9px;white-space:nowrap;}
      .wm-c-fixed-row.picked{background:#FFF5FA!important;}
      .wm-c-fixed-row.picked em{color:#D81B60;background:#FFE4F0;}
      .wm-c-fixed-empty{padding:16px 14px;font-size:12px;color:#7C8698;background:#FAFAFF;}
    `;document.head.appendChild(css);
  }
  setTimeout(bind,0); setTimeout(bind,200); setTimeout(bind,800);
  window.WM_C_FLOW_FIXED_AUTOCOMPLETE_V3={applied:true,mode:'body-fixed-overlay'};
})();
