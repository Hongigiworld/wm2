
/* WM PATCH v5: C Flow autocomplete verified-calorie-only
   - 자동완성 목록은 검증 영양DB/최종 calcNutrition에서 0kcal이 아닌 메뉴만 표시
   - main/side/type/category 메타값은 계속 내부 분류용으로만 유지하고 UI에는 노출하지 않음
   - 이전 ac-drop 자동완성 출력은 숨기고 body fixed overlay만 사용
*/
(function(){
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function qesc(s){return String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,' ');}
  function norm(s){return String(s||'').toLowerCase().replace(/\s+/g,'').trim();}
  function arr(v){return Array.isArray(v)?v:[];}
  function nameOf(v){
    if(!v) return '';
    if(typeof v==='string') return v;
    return v.name||v.menu||v.title||v.krName||v.koName||'';
  }
  function addName(out,name){
    name=String(name||'').trim();
    if(name && name.length>=2 && out.indexOf(name)<0) out.push(name);
  }
  function nutritionText(name){
    var nut=null, cal=0, range='';
    try{
      if(window.WM_MENU_NUTRITION_DB && window.WM_MENU_NUTRITION_DB[name]){
        nut=window.WM_MENU_NUTRITION_DB[name];
        cal=Number(nut.kcal||nut.cal||0);
        if(cal>0) return Math.round(cal)+'kcal';
      }
    }catch(e){}
    try{
      nut=(typeof window.calcNutrition==='function')?window.calcNutrition(name,1):null;
      if(nut){
        cal=Number(nut.cal||nut.kcal||0);
        range=String(nut.calRange||'');
        if(range && !/^0\s*~\s*0/i.test(range) && !/undefined|null|nan/i.test(range)) return range;
        if(cal>0) return Math.round(cal)+'kcal';
      }
    }catch(e){}
    return '';
  }
  function buildVerifiedIndex(){
    var out=[];
    try{Object.keys(window.WM_MENU_NUTRITION_DB||{}).forEach(function(n){addName(out,n);});}catch(e){}
    try{Object.keys(window.MENU_DB||{}).forEach(function(n){if(nutritionText(n)) addName(out,n);});}catch(e){}
    try{Object.keys(window.MENU_SCHEMA_V2||{}).forEach(function(n){if(nutritionText(n)) addName(out,n);});}catch(e){}
    try{arr(window.CLEAN_MENUS).forEach(function(x){var n=nameOf(x); if(nutritionText(n)) addName(out,n);});}catch(e){}
    try{arr(window.MENUS).forEach(function(x){var n=nameOf(x); if(nutritionText(n)) addName(out,n);});}catch(e){}
    try{arr(window.ALL_MENUS).forEach(function(x){var n=nameOf(x); if(nutritionText(n)) addName(out,n);});}catch(e){}
    return out.sort(function(a,b){return a.localeCompare(b,'ko');});
  }
  function overlay(){
    var el=document.getElementById('wm-c-fixed-ac');
    if(!el){el=document.createElement('div');el.id='wm-c-fixed-ac';document.body.appendChild(el);}
    return el;
  }
  function hide(){
    var el=document.getElementById('wm-c-fixed-ac'); if(el){el.style.display='none';el.innerHTML='';}
    var old=document.getElementById('ac-drop'); if(old){old.style.display='none';old.innerHTML='';}
  }
  function position(el,input){
    var r=input.getBoundingClientRect();
    el.style.left=Math.max(12,r.left)+'px';
    el.style.top=(r.bottom+8)+'px';
    el.style.width=Math.min(r.width, window.innerWidth-24)+'px';
    el.style.maxHeight=Math.max(160, Math.min(320, window.innerHeight-r.bottom-24))+'px';
  }
  function matches(q){
    var nq=norm(q); if(!nq) return [];
    var idx=buildVerifiedIndex();
    var starts=[], contains=[];
    idx.forEach(function(n){
      var nn=norm(n);
      if(nn.indexOf(nq)===0) starts.push(n);
      else if(nn.indexOf(nq)>=0) contains.push(n);
    });
    return starts.concat(contains).slice(0,30);
  }
  function show(value){
    var input=document.getElementById('c-inp');
    if(!input) return;
    var q=String(value==null?input.value:value).trim();
    var el=overlay();
    position(el,input);
    var old=document.getElementById('ac-drop'); if(old){old.style.display='none';old.innerHTML='';}
    if(!q){hide();return;}
    var rows=matches(q), selected=arr(window.S&&window.S.bcMenus);
    if(!rows.length){
      el.innerHTML='<div class="wm-c-fixed-empty">검증 칼로리가 등록된 메뉴가 없어요. 메뉴 영양DB 보강이 필요해요.</div>';
      el.style.display='block';
      return;
    }
    el.innerHTML='<div class="wm-c-fixed-head">메뉴 자동완성 · 검증 칼로리만 표시</div>'+rows.map(function(n){
      var kcal=nutritionText(n);
      var picked=selected.indexOf(n)>=0;
      return '<button type="button" class="wm-c-fixed-row '+(picked?'picked':'')+'" onclick="window.wmCFlowPickFixed(\''+qesc(n)+'\')"><div><b>'+esc(n)+'</b><span>'+esc(kcal)+'</span></div><em>'+(picked?'선택됨':'추가')+'</em></button>';
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
    if(input.__wmVerifiedAuto) return;
    input.__wmVerifiedAuto=true;
    ['input','keyup','compositionend','change','focus'].forEach(function(ev){
      input.addEventListener(ev,function(){ if(input.value.trim()) show(input.value); else hide(); },true);
    });
  }
  window.wmCFlowPickFixed=pick;
  window.wmPickCMenu=pick;
  window.showAutoComplete=show;
  document.addEventListener('input',function(e){if(e.target&&e.target.id==='c-inp') show(e.target.value);},true);
  document.addEventListener('keyup',function(e){if(e.target&&e.target.id==='c-inp') show(e.target.value);},true);
  document.addEventListener('compositionend',function(e){if(e.target&&e.target.id==='c-inp') show(e.target.value);},true);
  document.addEventListener('click',function(e){
    if(e.target&&e.target.closest&&e.target.closest('#wm-c-fixed-ac')) return;
    if(e.target&&e.target.id==='c-inp'){bind(); if(e.target.value.trim()) show(e.target.value); return;}
    hide();
  },true);
  var _render=window.render;
  if(typeof _render==='function'&&!_render.__wmVerifiedAuto){window.render=function(){var r=_render.apply(this,arguments); setTimeout(bind,0); setTimeout(bind,120); return r;}; window.render.__wmVerifiedAuto=true;}
  var _go=window.go;
  if(typeof _go==='function'&&!_go.__wmVerifiedAuto){window.go=function(){var r=_go.apply(this,arguments); setTimeout(bind,0); setTimeout(bind,120); return r;}; window.go.__wmVerifiedAuto=true;}
  try{new MutationObserver(function(){setTimeout(bind,0);}).observe(document.body,{childList:true,subtree:true});}catch(e){}
  var css=document.getElementById('wm-c-verified-ac-style');
  if(!css){
    css=document.createElement('style');css.id='wm-c-verified-ac-style';css.textContent=`
      #ac-drop{display:none!important;}
      #wm-c-fixed-ac{display:none;position:fixed!important;background:#fff!important;border:1px solid rgba(109,93,246,.18)!important;border-radius:20px!important;box-shadow:0 20px 54px rgba(15,23,42,.22)!important;z-index:2147483647!important;overflow-y:auto!important;overscroll-behavior:contain!important;}
      .wm-c-fixed-head{padding:10px 14px 8px;font-size:11px;font-weight:900;color:#7C8698;letter-spacing:.8px;border-bottom:1px solid rgba(17,24,39,.055);background:#FAFAFF;position:sticky;top:0;z-index:1;}
      .wm-c-fixed-row{width:100%!important;height:auto!important;border:0!important;border-bottom:1px solid rgba(17,24,39,.055)!important;background:#fff!important;padding:12px 14px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;text-align:left!important;box-shadow:none!important;border-radius:0!important;color:#111827!important;font-family:inherit!important;}
      .wm-c-fixed-row:last-child{border-bottom:0!important;}
      .wm-c-fixed-row b{display:block;font-size:14px;color:#111827;font-weight:900;letter-spacing:-.25px;}
      .wm-c-fixed-row span{display:block;margin-top:4px;font-size:11px;color:#7C8698;font-weight:750;}
      .wm-c-fixed-row em{font-style:normal;font-size:11px;font-weight:900;color:#6D5DF6;background:#F3F0FF;border-radius:999px;padding:6px 9px;white-space:nowrap;}
      .wm-c-fixed-row.picked{background:#FFF5FA!important;}
      .wm-c-fixed-row.picked em{color:#D81B60;background:#FFE4F0;}
      .wm-c-fixed-empty{padding:16px 14px;font-size:12px;color:#7C8698;background:#FAFAFF;line-height:1.45;}
    `;document.head.appendChild(css);
  }
  setTimeout(bind,0); setTimeout(bind,200); setTimeout(bind,800);
  window.WM_C_FLOW_VERIFIED_AUTOCOMPLETE_V5={applied:true,mode:'verified_positive_calorie_only'};
})();
