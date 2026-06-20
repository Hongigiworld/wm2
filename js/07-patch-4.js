
/* WM PATCH v2: C Flow autocomplete hard restore
   - go()/render()/DOM changes까지 감시해서 c-inp가 나중에 생겨도 자동완성 바인딩
   - 기존 ac-drop이 display:none으로만 남아있는 케이스 복구
*/
(function(){
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function jsesc(s){return String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,' ');}
  function norm(s){return String(s||'').toLowerCase().replace(/\s+/g,'').trim();}
  function arr(v){return Array.isArray(v)?v:[];}
  function getName(v){
    if(!v) return '';
    if(typeof v==='string') return v;
    return v.name||v.menu||v.title||v.krName||v.koName||'';
  }
  function addName(out,name){
    name=String(name||'').trim();
    if(name.length<2) return;
    if(!out.includes(name)) out.push(name);
  }
  function menuIndex(){
    var out=[];
    try{Object.keys(window.MENU_DB||{}).forEach(function(k){addName(out,k);});}catch(e){}
    try{Object.keys(window.MENU_SCHEMA_V2||{}).forEach(function(k){addName(out,k);});}catch(e){}
    try{Object.keys(window.WM_MENU_NUTRITION_DB||{}).forEach(function(k){addName(out,k);});}catch(e){}
    try{arr(window.CLEAN_MENUS).forEach(function(x){addName(out,getName(x));});}catch(e){}
    try{arr(window.MENUS).forEach(function(x){addName(out,getName(x));});}catch(e){}
    try{arr(window.ALL_MENUS).forEach(function(x){addName(out,getName(x));});}catch(e){}
    return out.sort(function(a,b){return a.localeCompare(b,'ko');});
  }
  function metaFor(name){
    var m={};
    try{ if(window.MENU_DB&&window.MENU_DB[name]&&typeof window.MENU_DB[name]==='object') Object.assign(m,window.MENU_DB[name]); }catch(e){}
    try{ if(window.MENU_SCHEMA_V2&&window.MENU_SCHEMA_V2[name]&&typeof window.MENU_SCHEMA_V2[name]==='object') Object.assign(m,window.MENU_SCHEMA_V2[name]); }catch(e){}
    try{ var c=arr(window.CLEAN_MENUS).find(function(x){return getName(x)===name;}); if(c) Object.assign(m,c); }catch(e){}
    try{ if(window.WM_MENU_NUTRITION_DB&&window.WM_MENU_NUTRITION_DB[name]) Object.assign(m,window.WM_MENU_NUTRITION_DB[name]); }catch(e){}
    return m;
  }
  function ensureDrop(){
    var input=document.getElementById('c-inp');
    if(!input) return null;
    var wrap=input.closest('.wm-flow-direct-input')||input.parentElement;
    if(wrap) wrap.style.position='relative';
    var ac=document.getElementById('ac-drop');
    if(!ac){
      ac=document.createElement('div');
      ac.id='ac-drop';
      if(wrap) wrap.appendChild(ac);
      else input.insertAdjacentElement('afterend',ac);
    }
    ac.className='wm-c-ac-drop';
    return ac;
  }
  function hide(){
    var ac=document.getElementById('ac-drop');
    if(ac){ac.style.display='none';ac.innerHTML='';}
  }
  function show(q){
    var input=document.getElementById('c-inp');
    var ac=ensureDrop();
    if(!input||!ac) return;
    q=String(q==null?input.value:q).trim();
    var nq=norm(q);
    if(!nq){hide();return;}
    var selected=arr(window.S&&window.S.bcMenus);
    var rows=menuIndex().filter(function(n){
      var nn=norm(n);
      return nn.indexOf(nq)>=0 || nq.indexOf(nn)>=0;
    }).slice(0,24);
    if(!rows.length){
      ac.innerHTML='<div class="wm-c-ac-empty">검색 결과가 없어요. 직접 추가할 수 있어요.</div>';
      ac.style.display='block';
      return;
    }
    ac.innerHTML='<div class="wm-c-ac-head">메뉴 검색 결과</div>'+rows.map(function(n){
      var m=metaFor(n), tag=m.type||m.style||m.country||m.category||'';
      var kcal='';
      try{var nut=(typeof window.calcNutrition==='function')?window.calcNutrition(n,1):null;kcal=nut?(nut.calRange||((nut.cal||nut.kcal||0)+'kcal')):'';}catch(e){}
      var picked=selected.includes(n);
      return '<button type="button" class="wm-c-ac-row '+(picked?'picked':'')+'" data-wm-c-menu="'+esc(n)+'" onclick="window.wmPickCMenu(\''+jsesc(n)+'\')">'+
             '<div><b>'+esc(n)+'</b><span>'+(tag?esc(tag)+' · ':'')+(kcal?esc(kcal):'메뉴 DB')+'</span></div><em>'+(picked?'선택됨':'추가')+'</em></button>';
    }).join('');
    ac.style.display='block';
  }
  function pick(name){
    if(!window.S) window.S={};
    if(!Array.isArray(S.bcMenus)) S.bcMenus=[];
    var max=14;
    try{ if(typeof window.totalMeals==='function') max=window.totalMeals(); }catch(e){}
    name=String(name||'').trim();
    if(name&&!S.bcMenus.includes(name)&&S.bcMenus.length<max) S.bcMenus.push(name);
    var input=document.getElementById('c-inp');
    if(input) input.value='';
    hide();
    if(typeof window.render==='function') window.render();
  }
  function bind(){
    var input=document.getElementById('c-inp');
    if(!input) return;
    ensureDrop();
    input.setAttribute('autocomplete','off');
    input.setAttribute('oninput','window.showAutoComplete(this.value)');
    if(input.__wmCAutoV2) return;
    input.__wmCAutoV2=true;
    input.addEventListener('input',function(){show(input.value);});
    input.addEventListener('keyup',function(){show(input.value);});
    input.addEventListener('focus',function(){ if(input.value.trim()) show(input.value); });
    input.addEventListener('keydown',function(ev){
      if(ev.key==='Escape') hide();
    });
  }
  window.wmPickCMenu=pick;
  window.showAutoComplete=show;

  function laterBind(){setTimeout(bind,0);setTimeout(bind,80);setTimeout(bind,250);}
  var oldRender=window.render;
  if(typeof oldRender==='function'&&!oldRender.__wmCAutoV2){
    window.render=function(){var r=oldRender.apply(this,arguments);laterBind();return r;};
    window.render.__wmCAutoV2=true;
  }
  var oldGo=window.go;
  if(typeof oldGo==='function'&&!oldGo.__wmCAutoV2){
    window.go=function(){var r=oldGo.apply(this,arguments);laterBind();return r;};
    window.go.__wmCAutoV2=true;
  }
  document.addEventListener('input',function(ev){if(ev.target&&ev.target.id==='c-inp') show(ev.target.value);},true);
  document.addEventListener('focusin',function(ev){if(ev.target&&ev.target.id==='c-inp') bind();});
  document.addEventListener('click',function(ev){
    var btn=ev.target.closest&&ev.target.closest('[data-wm-c-menu]');
    if(btn){ev.preventDefault();pick(btn.getAttribute('data-wm-c-menu'));return;}
    var input=document.getElementById('c-inp'), ac=document.getElementById('ac-drop');
    if(input&&ac&&!input.contains(ev.target)&&!ac.contains(ev.target)) hide();
  },true);
  try{new MutationObserver(laterBind).observe(document.body,{childList:true,subtree:true});}catch(e){}
  laterBind();

  if(!document.getElementById('wm-c-ac-v2-style')){
    var css=document.createElement('style');css.id='wm-c-ac-v2-style';css.textContent=`
      .wm-flow-direct-input{position:relative!important;overflow:visible!important;}
      #ac-drop.wm-c-ac-drop,.wm-c-ac-drop{display:none;position:absolute!important;top:calc(100% + 8px)!important;left:0!important;right:0!important;background:#fff!important;border:1px solid rgba(109,93,246,.18)!important;border-radius:20px!important;box-shadow:0 18px 46px rgba(15,23,42,.16)!important;z-index:99999!important;max-height:292px!important;overflow-y:auto!important;}
      .wm-c-ac-head{padding:10px 14px 8px;font-size:11px;font-weight:900;color:#7C8698;letter-spacing:.8px;border-bottom:1px solid rgba(17,24,39,.055);background:#FAFAFF;}
      .wm-c-ac-row{width:100%!important;height:auto!important;border:0!important;border-bottom:1px solid rgba(17,24,39,.055)!important;background:#fff!important;padding:12px 14px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;text-align:left!important;box-shadow:none!important;border-radius:0!important;color:#111827!important;}
      .wm-c-ac-row:last-child{border-bottom:0!important;}
      .wm-c-ac-row b{display:block;font-size:14px;color:#111827;font-weight:900;letter-spacing:-.25px;}
      .wm-c-ac-row span{display:block;margin-top:4px;font-size:11px;color:#7C8698;font-weight:650;}
      .wm-c-ac-row em{font-style:normal;font-size:11px;font-weight:900;color:#6D5DF6;background:#F3F0FF;border-radius:999px;padding:6px 9px;white-space:nowrap;}
      .wm-c-ac-row.picked{background:#FFF5FA!important;}
      .wm-c-ac-row.picked em{color:#D81B60;background:#FFE4F0;}
      .wm-c-ac-empty{padding:16px 14px;font-size:12px;color:#7C8698;background:#FAFAFF;}
    `;document.head.appendChild(css);
  }
  window.WM_C_FLOW_AUTOCOMPLETE_RESTORE_V2={applied:true,binds:['render','go','mutation','delegated-input']};
})();
