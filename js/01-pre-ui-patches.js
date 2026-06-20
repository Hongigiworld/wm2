
function ensureScheduleReady(){
  if(!S.schedule || typeof S.schedule !== 'object') S.schedule = {};
  let count = 0;
  DAYS.forEach(d=>{
    if(!Array.isArray(S.schedule[d])) S.schedule[d]=[];
    count += S.schedule[d].length;
  });
  if(count===0){
    DAYS.forEach(d=>{ S.schedule[d]=['점심','저녁']; });
    saveSched();
    localStorage.setItem('wm_schedule_set','1');
  }
}
function totalMeals(){
  ensureScheduleReady();
  const daily=Object.values(S.schedule).reduce((a,b)=>a+(Array.isArray(b)?b.length:0),0);
  return Math.max(1,daily)*(S.planDuration||1);
}
function flowCreatePlan(menus,tip){
  ensureScheduleReady();
  menus=[...new Set((menus||[]).map(m=>flowMenuDBName(m)).filter(n=>MENU_DB[n]))];
  if(!menus.length){ menus=Object.keys(MENU_DB).sort(()=>Math.random()-0.5).slice(0,totalMeals()); }
  if(!menus.length){ alert('식단을 만들 메뉴가 없습니다. 메뉴를 다시 선택해주세요.'); return false; }
  const weeklyMeal=[]; let idx=0;
  for(const day of DAYS){
    const slots=(S.schedule[day]&&S.schedule[day].length)?S.schedule[day]:['점심','저녁'];
    const meals=slots.map(type=>flowMealObj(type,menus[idx++%menus.length]));
    weeklyMeal.push({day,meals});
  }
  S.mealPlan={weeklyMeal,tip:tip||''};
  S.mealStartDate=getThisMonday();
  flowCreateCalendar(menus);
  saveMeal();
  localStorage.setItem('wm_cal',JSON.stringify(S.mealCalendar||{}));
  return true;
}
function flowCreateCalendar(menus){
  ensureScheduleReady();
  menus=[...new Set((menus||[]).map(m=>flowMenuDBName(m)).filter(n=>MENU_DB[n]))];
  const cal={}; let idx=0;
  const start=new Date(); start.setDate(start.getDate()+1);
  const days=totalDays();
  for(let i=0;i<days;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const key=dateKey(d); const day=DAYS[(d.getDay()+6)%7];
    const slots=(S.schedule[day]&&S.schedule[day].length)?S.schedule[day]:['점심','저녁'];
    cal[key]=slots.map(type=>flowMealObj(type,menus[idx++%menus.length]));
  }
  S.mealCalendar=cal;
  localStorage.setItem('wm_cal',JSON.stringify(cal));
}
function _bcSelectedMenus(){
  const isB=S.bcMode==='b';
  const seed=isB?(S.bcSuggested||[]).filter(m=>m.selected).map(m=>m.name):(S.bcMenus||[]);
  const type=isB?'style':'wishlist';
  let menus=_flowResolveMenuList(type,S.bcStyles,seed);
  if(!menus.length) menus=flowBuildMenu('style',S.bcStyles&&S.bcStyles.length?S.bcStyles:['한식'],[]);
  return menus.slice(0,totalMeals());
}
function genBCCart(){
  try{
    ensureScheduleReady();
    const isB=S.bcMode==='b';
    const seed=isB?(S.bcSuggested||[]).filter(m=>m.selected).map(m=>m.name):(S.bcMenus||[]);
    if(!seed.length){ alert(isB?'추천 메뉴를 먼저 선택해주세요':'메뉴를 먼저 입력해주세요'); return; }
    const menus=_bcSelectedMenus();
    if(!menus.length){ alert('메뉴DB에서 매칭되는 메뉴가 없습니다. 다른 메뉴로 다시 입력해주세요.'); return; }
    S.bcMenus=menus;
    const result=getIngredientsFromDB(menus,S.people||1);
    S.cart=(result.list||[]).map(i=>({...i,checked:!!i.inFridge,replaceName:'',replaceQty:''}));
    S.fridgeAdded=false; S.cartDone=false;
    localStorage.removeItem('wm_cart_done');
    go('bc-cart');
  }catch(e){ console.error('genBCCart patched 오류:',e); alert('재료 분석 중 오류: '+(e.message||e)); }
}

function makeBCMealNow(){
  try{
    ensureScheduleReady();
    let menus=(S.bcMenus&&S.bcMenus.length)?S.bcMenus:_bcSelectedMenus();
    S.bcMenus=menus;
    if(!menus.length){ alert('먼저 메뉴 선택 또는 재료 분석을 해주세요.'); return; }
    if(flowCreatePlan(menus,`🍽️ 선택한 메뉴 기준으로 ${planDurationLabel()} 식단을 생성했어요.`)){
      addUsage(); go('bc-meal');
    }
  }catch(e){ console.error('makeBCMealNow patched 오류:',e); alert('식단 생성 중 오류: '+(e.message||e)); }
}
function rBCCart(){
  const cats=['채소','단백질','양념','면·밥','기타'];
  const catIcon={채소:'🥬',단백질:'🥩',양념:'🧄','면·밥':'🍚',기타:'🛒'};
  const done=(S.cart||[]).filter(i=>i.checked).length;
  const fridgeCount=(S.cart||[]).filter(i=>i.inFridge).length;
  const needBuy=(S.cart||[]).length-fridgeCount;
  let cartHTML='';
  for(const cat of cats){
    const items=(S.cart||[]).filter(i=>(i.category||'기타')===cat);
    if(!items.length) continue;
    cartHTML+=`<div style="margin-bottom:14px"><div class="sec">${catIcon[cat]} ${cat}</div>`;
    for(const item of items){
      const idx=S.cart.indexOf(item); const hf=item.inFridge; const shopInfo=!hf?getIngredientShopUrl(item.replaceName||item.name):null;
      cartHTML+=`<div class="shop-item" style="background:${hf?'#F0FFF6':'#fff'};border:1.5px solid ${hf?'#A5D6A7':'transparent'}">
        <div class="chk ${item.checked?'done':''}" onclick="S.cart[${idx}].checked=!S.cart[${idx}].checked;render()">${item.checked?'✓':''}</div>
        <span style="font-size:20px">${item.icon||getIcon(item.name)}</span>
        <div style="flex:1" onclick="S.cart[${idx}].checked=!S.cart[${idx}].checked;render()">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span style="font-weight:600;font-size:14px;text-decoration:${item.checked?'line-through':'none'};color:${item.checked?'#bbb':'var(--text)'}">${item.replaceName||item.name}</span>${hf?"<span style='font-size:10px;background:#2ECC71;color:#fff;border-radius:6px;padding:1px 6px;font-weight:700'>냉장고✓</span>":''}</div>
          <div style="font-size:11px;color:#aaa">${item.replaceQty||item.amount}${item.usedIn?' · '+item.usedIn:''}</div>
        </div>
        ${!hf&&!item.checked&&shopInfo?`<a href="${shopInfo.url}" target="_blank" onclick="event.stopPropagation()" style="display:flex;flex-direction:column;align-items:center;background:#E2173C;color:#fff;border-radius:10px;padding:6px 8px;text-decoration:none;flex-shrink:0;gap:1px"><span style="font-size:14px">🛒</span><span style="font-size:9px;font-weight:700">쿠팡</span></a>`:''}
        <button onclick="openEditCart(${idx})" style="background:none;border:none;color:#aaa;font-size:13px;flex-shrink:0">✏️</button>
      </div>`;
    }
    cartHTML+='</div>';
  }
  return`<div style="padding:80px 20px 14px;background:linear-gradient(160deg,#FCE4EC,#fff)">
    <button class="back" onclick="go(S.bcMode==='b'?'b-suggest':'bc-entry')">←</button>
    <div class="title">🛒 ${S.people}인분 장보기</div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <div style="flex:1;background:#E8F5E9;border-radius:10px;padding:8px;text-align:center"><div style="font-size:11px;font-weight:700;color:#2e7d32">냉장고✓</div><div style="font-size:16px;font-weight:900;color:#2ECC71">${fridgeCount}개</div></div>
      <div style="flex:1;background:#FFF8EE;border-radius:10px;padding:8px;text-align:center"><div style="font-size:11px;font-weight:700;color:#e65100">사야할것</div><div style="font-size:16px;font-weight:900;color:var(--primary)">${needBuy}개</div></div>
      <div style="flex:1;background:#f8f8f8;border-radius:10px;padding:8px;text-align:center"><div style="font-size:11px;font-weight:700;color:#888">완료</div><div style="font-size:16px;font-weight:900;color:var(--primary)">${done}개</div></div>
    </div>
    <div style="display:flex;gap:6px;margin-top:10px">
      <button onclick="S.cart.forEach((_,i)=>S.cart[i].checked=true);render()" style="flex:1;padding:8px;background:var(--primary-pale);border:none;border-radius:10px;font-size:12px;font-weight:700;color:var(--primary)">✓ 전체선택</button>
      <button onclick="S.cart.forEach((_,i)=>S.cart[i].checked=false);render()" style="flex:1;padding:8px;background:#f5f5f5;border:none;border-radius:10px;font-size:12px;font-weight:700;color:#888">✕ 전체해제</button>
      <button onclick="makeBCMealNow()" style="flex:1;padding:8px;background:#E8F5E9;border:none;border-radius:10px;font-size:12px;font-weight:800;color:#2e7d32">식단생성</button>
    </div>
  </div>
  <div class="px" style="padding-top:8px;padding-bottom:150px">${cartHTML||'<div style="text-align:center;color:#aaa;padding:40px 0">장보기 목록이 비어있어요</div>'}</div>
  <div class="bottom-bar">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px">
      <button class="btn-g" onclick="addToFridge()" ${done===0?'disabled':''} style="${done===0?'opacity:.45':''}">❄️ 냉장고 반영</button>
      <button class="btn-p" onclick="makeBCMealNow()">🍽️ 식단 생성</button>
    </div>
  </div>
  <div id="cart-modal" style="display:none" class="modal-bg"><div class="modal-card">
    <div style="font-weight:800;font-size:17px;margin-bottom:16px" id="cart-modal-name"></div>
    <div class="sec" style="margin-bottom:4px">대체 재료명</div><input id="cart-rep-name" class="inp" style="width:100%;margin-bottom:10px" placeholder="그대로면 비워두세요">
    <div class="sec" style="margin-bottom:4px">수량 수정</div><input id="cart-rep-qty" class="inp" style="width:100%;margin-bottom:16px" placeholder="예: 500g">
    <button class="btn-p" onclick="confirmEditCart()">수정 완료</button><button onclick="document.getElementById('cart-modal').style.display='none'" style="width:100%;padding:12px;background:none;border:none;color:#aaa;font-size:14px;margin-top:6px">취소</button>
  </div></div>`;
}
function rMealSlotIcon(meal,on){
  const cfg={아침:['#FFB020','#FFE7B8'],점심:['#4B3FD8','#E9E7FF'],저녁:['#425466','#E8EDF5']}[meal]||['#4B3FD8','#E9E7FF'];
  return `<span style="width:30px;height:30px;border-radius:12px;background:${on?cfg[0]:cfg[1]};display:inline-flex;align-items:center;justify-content:center;position:relative;box-shadow:${on?'0 5px 12px rgba(0,0,0,.12)':'none'}">
    <span style="width:14px;height:14px;border-radius:50%;background:${on?'#fff':cfg[0]};display:block"></span>
    <span style="position:absolute;right:5px;bottom:5px;width:7px;height:7px;border-radius:50%;background:${on?cfg[1]:'#fff'}"></span>
  </span>`;
}

(function(){
  function enhance(){
    document.querySelectorAll('.tab-btn').forEach(function(btn){
      var txt=btn.textContent||'';
      if(txt.includes('홈')||txt.includes('식단')||txt.includes('냉장고')||txt.includes('일기')){
        btn.style.fontWeight='800';
      }
    });
    document.querySelectorAll('div[style*="box-shadow:var(--shadow)"]').forEach(function(card){
      card.style.boxShadow='var(--shadow)';
      card.style.border='1px solid rgba(255,255,255,.72)';
      card.style.backdropFilter='blur(18px)';
    });
    document.querySelectorAll('button').forEach(function(btn){
      if(!btn.dataset.uiPolished){
        btn.dataset.uiPolished='1';
        btn.addEventListener('mousedown',function(){btn.style.filter='brightness(.98)';});
        btn.addEventListener('mouseup',function(){btn.style.filter='';});
        btn.addEventListener('mouseleave',function(){btn.style.filter='';});
      }
    });
  }
  var oldRender=window.render;
  if(typeof oldRender==='function'){
    window.render=function(){var r=oldRender.apply(this,arguments); setTimeout(enhance,0); return r;};
  }
  document.addEventListener('DOMContentLoaded',function(){setTimeout(enhance,60);});
})();

(function(){
  function unifySprint4A(){
    try{
      document.querySelectorAll('.screen > div:first-child').forEach(function(el){
        var st=el.getAttribute('style')||'';
        if(st.includes('padding:80px') || st.includes('padding:52px')){
          el.style.paddingLeft='18px';
          el.style.paddingRight='18px';
        }
      });
      document.querySelectorAll('.shop-item').forEach(function(item){
        if(!item.dataset.sprint4a){
          item.dataset.sprint4a='1';
          item.style.transition='transform .14s ease, box-shadow .14s ease, opacity .14s ease';
        }
      });
      document.querySelectorAll('button').forEach(function(btn){
        if(!btn.dataset.sprint4aBtn){
          btn.dataset.sprint4aBtn='1';
          btn.style.transition='transform .14s ease, filter .14s ease, box-shadow .14s ease';
          btn.addEventListener('pointerdown',function(){btn.style.transform='scale(.985)';});
          btn.addEventListener('pointerup',function(){btn.style.transform='';});
          btn.addEventListener('pointercancel',function(){btn.style.transform='';});
          btn.addEventListener('mouseleave',function(){btn.style.transform='';});
        }
      });
    }catch(e){}
  }
  var oldRender=window.render;
  if(typeof oldRender==='function'){
    window.render=function(){var r=oldRender.apply(this,arguments); setTimeout(unifySprint4A,0); return r;};
  }
  document.addEventListener('DOMContentLoaded',function(){setTimeout(unifySprint4A,80);});
})();

(function(){
  function polishFridge(){
    try{
      document.querySelectorAll('[data-fridge-item], .fridge-item').forEach(function(el){
        el.style.transition='transform .14s ease, box-shadow .14s ease';
      });
    }catch(e){}
  }
  var oldRender=window.render;
  if(typeof oldRender==='function'){
    window.render=function(){var r=oldRender.apply(this,arguments); setTimeout(polishFridge,0); return r;};
  }
  document.addEventListener('DOMContentLoaded',function(){setTimeout(polishFridge,80);});
})();

(function(){
 function sprint4Enhance(){
   try{
     document.querySelectorAll('.shop-item').forEach(el=>{
       el.style.transition='all .15s ease';
     });

     document.querySelectorAll('button').forEach(btn=>{
       if(btn.dataset.s4done) return;
       btn.dataset.s4done='1';
       btn.style.transition='all .15s ease';
     });

     document.querySelectorAll('[class*="meal"]').forEach(card=>{
       if(card.className && String(card.className).includes('card')){
         card.classList.add('meal-plan-card');
       }
     });
   }catch(e){}
 }
 document.addEventListener('DOMContentLoaded',()=>setTimeout(sprint4Enhance,100));
 const oldRender=window.render;
 if(typeof oldRender==='function'){
   window.render=function(){
      const r=oldRender.apply(this,arguments);
      setTimeout(sprint4Enhance,0);
      return r;
   }
 }
})();

(function(){
  const oldMealTab = window.rMealTab;
  if(typeof oldMealTab === 'function'){
    window.rMealTab = function(){
      let html = oldMealTab.apply(this, arguments);
      html = html.replaceAll('<div onclick="setCalMeal(', '<div class="s4c-real-meal-card" onclick="setCalMeal(');
      html = html.replaceAll('style="border-radius:16px;padding:7px 2px;text-align:center;min-height:62px;', 'class="s4c-calendar-day" style="border-radius:16px;padding:7px 2px;text-align:center;min-height:62px;');
      return html;
    };
  }

  window.rFridgeTab = function(){
    const fridge = S.fridge || [];

    function getDdayVal(item){
      if(!item.addedAt || !item.expireDays) return null;
      const base = new Date(item.addedAt);
      base.setDate(base.getDate() + Number(item.expireDays));
      return Math.ceil((base - new Date()) / (24*60*60*1000));
    }

    function ddayStyle(d){
      if(d === null) return {label:'보관중', bg:'#EEF2F7', color:'#64748B'};
      if(d <= 0) return {label:'만료', bg:'#FFEBEE', color:'#E53935'};
      if(d <= 2) return {label:'D-'+d, bg:'#FFEBEE', color:'#E53935'};
      if(d <= 5) return {label:'D-'+d, bg:'#FFF3E0', color:'#FF8A00'};
      return {label:'D-'+d, bg:'#E8F5E9', color:'#079E68'};
    }

    function catOf(item){
      const n = String(item.name || '');
      const cat = item.category || item.type || '';
      if(cat) return cat;
      if(/닭|소고기|돼지|계란|달걀|두부|새우|연어|참치|고등어|오징어|낙지|조개|생선|햄|베이컨/.test(n)) return '단백질';
      if(/밥|쌀|면|우동|소바|파스타|빵|또르티야|감자|고구마|떡/.test(n)) return '탄수화물';
      if(/간장|고추장|된장|소금|설탕|식초|기름|오일|마늘|생강|후추|소스|카레|분말|향신료/.test(n)) return '양념';
      if(/상추|양파|대파|파|배추|양배추|버섯|당근|오이|토마토|고추|브로콜리|가지|애호박|시금치|숙주|콩나물|무|깻잎/.test(n)) return '채소';
      return '기타';
    }

    const sorted = [...fridge].sort((a,b)=>(getDdayVal(a) ?? 999) - (getDdayVal(b) ?? 999));
    const soon = sorted.filter(i => { const d=getDdayVal(i); return d !== null && d <= 3; }).length;
    const cats = [
      ['단백질','🥩'],
      ['채소','🥬'],
      ['탄수화물','🍚'],
      ['양념','🧂'],
      ['기타','📦']
    ];

    if(!fridge.length){
      return `<div class="s4d-fridge-page">
        <div class="s4d-fridge-top">
          <div>
            <div style="font-size:10px;font-weight:850;letter-spacing:1.4px;color:#10B981;margin-bottom:6px">FRIDGE</div>
            <div class="title" style="margin:0">냉장고</div>
          </div>
        </div>

        <div class="s4d-fridge-empty">
          <div style="font-size:48px;margin-bottom:12px">❄️</div>
          <div style="font-weight:900;color:#111827;font-size:17px">냉장고가 비었어요</div>
          <div style="font-size:13px;line-height:1.55;margin-top:7px">장보기 완료 후 자동으로 채워지거나<br>직접 재료를 추가할 수 있어요.</div>
          <button onclick="openAddFI()" style="margin-top:16px;border:0;border-radius:18px;padding:12px 20px;background:linear-gradient(135deg,#10B981,#079E68);color:#fff;font-weight:850">＋ 재료 직접 추가</button>
        </div>
      </div>`;
    }

    let html = `<div class="s4d-fridge-page">
      <div class="s4d-fridge-top">
        <div>
          <div style="font-size:10px;font-weight:850;letter-spacing:1.4px;color:#10B981;margin-bottom:6px">FRIDGE</div>
          <div class="title" style="margin:0">냉장고</div>
          <div style="font-size:12px;color:#7C8698;margin-top:5px">보유 재료를 기준으로 식단을 추천해요</div>
        </div>
      </div>

      <div class="s4d-fridge-hero">
        <div style="position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:12px;font-weight:750;opacity:.78;margin-bottom:5px">보관중인 재료</div>
            <div style="font-size:38px;font-weight:900;line-height:1;letter-spacing:-1.2px">${fridge.length}<span style="font-size:14px;font-weight:750;opacity:.8"> 개</span></div>
            <div style="font-size:12px;opacity:.8;margin-top:7px">곧 만료 ${soon}개 · 카테고리별 정리</div>
          </div>
          <div style="width:68px;height:68px;border-radius:24px;background:rgba(255,255,255,.18);display:grid;place-items:center;font-size:32px">❄️</div>
        </div>
      </div>

      <div class="s4d-fridge-stats">
        <div class="s4d-fridge-stat"><span>전체</span><b>${fridge.length}</b></div>
        <div class="s4d-fridge-stat"><span>곧 만료</span><b style="color:${soon?'#E53935':'#079E68'}">${soon}</b></div>
        <div class="s4d-fridge-stat"><span>카테고리</span><b>${cats.filter(c=>sorted.some(i=>catOf(i)===c[0])).length}</b></div>
      </div>

      <div class="s4d-fridge-actions">
        <button onclick="openAddFI()" style="background:#fff;color:#111827">＋ 재료 추가</button>
        <button onclick="S.fridge=[];saveFridge();render()" style="background:#FFF0F0;color:#E53935">전체삭제</button>
      </div>`;

    cats.forEach(([cat,icon])=>{
      const items = sorted.filter(i=>catOf(i)===cat);
      if(!items.length) return;
      html += `<div class="s4d-fridge-cat">
        <div class="s4d-fridge-cat-head">
          <div class="s4d-fridge-cat-title">
            <i>${icon}</i>
            <div><b>${cat}</b><span>${items.length}개 보유중</span></div>
          </div>
          <div style="color:#A8B0BD;font-weight:900">›</div>
        </div>
        <div class="s4d-fridge-list">`;

      items.forEach(item=>{
        const d = getDdayVal(item);
        const ds = ddayStyle(d);
        const fi = S.fridge.indexOf(item);
        html += `<div class="s4d-fridge-item">
          <div class="s4d-fridge-icon">${item.icon || (typeof getIcon==='function'?getIcon(item.name):'🥣')}</div>
          <div class="s4d-fridge-main">
            <b>${item.name}</b>
            <span>${item.amount || '수량 미입력'}${item.storage ? ' · '+item.storage : ''}</span>
          </div>
          <span class="s4d-fridge-dday" style="background:${ds.bg};color:${ds.color}">${ds.label}</span>
          <button class="s4d-fridge-del" onclick="S.fridge.splice(${fi},1);saveFridge();render()">×</button>
        </div>`;
      });

      html += `</div></div>`;
    });

    html += `</div>
      <div class="s4d-fridge-bottom">
        <button onclick="go('a-flow')">🥬 냉장고 재료로 식단 추천</button>
      </div>`;
    return html;
  };
})();

(function(){
 function applySprint5B(){
   return; // disabled
   try{
     document.querySelectorAll('.tab-btn').forEach(btn=>{
       if(btn.dataset.s5done) return;
       btn.dataset.s5done='1';

       const txt=(btn.textContent||'').trim();
       let icon='•';
       if(txt.includes('홈')) icon='🏠';
       else if(txt.includes('식단')) icon='🍽️';
       else if(txt.includes('장보기')) icon='🛒';
       else if(txt.includes('냉장')) icon='❄️';
       else if(txt.includes('일기')) icon='📈';

       const label=txt.replace(/[🏠🍽️🛒❄️📈]/g,'').trim()||txt;

       if(txt.includes('식단')) btn.classList.add('meal-main');

       btn.innerHTML =
       (txt.includes('식단')
         ? '<div class="s5-icon-wrap"><span class="s5-icon">'+icon+'</span></div>'
         : '<span class="s5-icon">'+icon+'</span>')
       + '<span class="s5-label">'+label+'</span>';
     });
   }catch(e){}
 }

 document.addEventListener('DOMContentLoaded',()=>setTimeout(applySprint5B,200));

 const oldRender=window.render;
 if(typeof oldRender==='function'){
   window.render=function(){
     const r=oldRender.apply(this,arguments);
     setTimeout(applySprint5B,50);
     return r;
   }
 }
})();

(function(){
  function normalizeTabs(){
    try{
      document.querySelectorAll('.tab-btn').forEach(btn=>{
        const label = btn.querySelector('.s5-label');
        if(label){
          label.style.fontSize='10.5px';
          label.style.fontWeight='800';
          label.style.lineHeight='1.05';
          label.style.letterSpacing='-.15px';
        }
      });
    }catch(e){}
  }

  function strengthenFridgeButtons(){
    try{
      document.querySelectorAll('button').forEach(btn=>{
        const on = btn.getAttribute('onclick') || '';
        const txt = btn.textContent || '';
        if(on.includes('S.fridge=[]') || txt.includes('전체삭제')){
          btn.style.background = '#FFE8E8';
          btn.style.color = '#E53935';
          btn.style.border = '1px solid rgba(229,57,53,.18)';
          btn.style.opacity = '1';
          btn.innerHTML = '🗑️ 전체삭제';
        }
      });
    }catch(e){}
  }

  function run(){
    normalizeTabs();
    strengthenFridgeButtons();
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(run,120));
  const oldRender=window.render;
  if(typeof oldRender==='function'){
    window.render=function(){
      const r=oldRender.apply(this,arguments);
      setTimeout(run,50);
      return r;
    }
  }
})();

(function(){
 function upgradeFlowCards(){
   try{
    document.querySelectorAll('button,div').forEach(el=>{
      const txt=(el.textContent||'').trim();
      if(el.dataset.flowdone) return;

      if(txt==='A Flow' || txt.includes('냉장고 기반')){
        el.dataset.flowdone=1;
        el.classList.add('s5c-flow-card');
      }
    });
   }catch(e){}
 }
 document.addEventListener('DOMContentLoaded',()=>setTimeout(upgradeFlowCards,200));
 const oldRender=window.render;
 if(typeof oldRender==='function'){
   window.render=function(){
    const r=oldRender.apply(this,arguments);
    setTimeout(upgradeFlowCards,100);
    return r;
   }
 }
})();

