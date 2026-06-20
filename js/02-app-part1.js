(function(){
  function s5Esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function s5Icon(name){
    name=String(name||'');
    if(/라멘|국수|면|우동|소바|쌀국수|짬뽕|짜장/.test(name)) return '🍜';
    if(/밥|덮밥|볶음밥|비빔밥|카레|리조또|포케/.test(name)) return '🍚';
    if(/치킨|닭|삼계|아도보/.test(name)) return '🍗';
    if(/스테이크|불고기|갈비|고기|삼겹|제육|돼지|소고기|비프/.test(name)) return '🥩';
    if(/연어|생선|고등어|새우|해물|오징어|낙지|조개|탕/.test(name)) return '🐟';
    if(/샐러드|채소|두부|나물|브로콜리|아보카도/.test(name)) return '🥗';
    if(/피자|파스타|그라탕|라자냐/.test(name)) return '🍝';
    if(/샌드위치|토스트|버거|타코|부리또|케밥/.test(name)) return '🥪';
    return '🍽️';
  }
  function s5Nut(name){
    try{
      if(typeof calcNutrition==='function'){
        const n=calcNutrition(name,1);
        if(n) return n;
      }
    }catch(e){}
    return {cal:0,carb:0,pro:0,fat:0};
  }
  function s5Styles(){
    const base=['한식','일식','중식','양식','태국','베트남','말레이시아','인도','멕시코','지중해'];
    try{
      if(window.FLOW_STYLE_MENU_MAP){
        return Object.keys(FLOW_STYLE_MENU_MAP).filter(Boolean).slice(0,14);
      }
    }catch(e){}
    return base;
  }
  function s5FlowShell(kind, title, sub, icon, heroText, body){
    return `<div class="s5c-page">
      <div class="s5c-head">
        <div>
          <div class="s5c-kicker">WEEKLY MEAL</div>
          <div class="s5c-title">${title}</div>
          <div class="s5c-sub">${sub}</div>
        </div>
        <button class="back" onclick="go('home')">←</button>
      </div>
      <div class="s5c-hero">
        <div class="s5c-hero-row">
          <div><b>${heroText}</b><span>${kind==='a'?'냉장고 재료를 먼저 쓰고 부족한 재료만 장보기로 넘겨요.':kind==='b'?'국가/스타일을 고르면 메뉴 후보를 자동 추천해요.':'먹고 싶은 메뉴를 직접 담아 식단으로 만들어요.'}</span></div>
          <div class="s5c-hero-icon">${icon}</div>
        </div>
      </div>
      ${body}
    </div>`;
  }

  function s5A(){
    const fridge=(window.S&&Array.isArray(S.fridge))?S.fridge:[];
    const exp=fridge.filter(x=>{
      try{
        if(!x.addedAt||!x.expireDays)return false;
        const d=new Date(x.addedAt); d.setDate(d.getDate()+Number(x.expireDays));
        return Math.ceil((d-new Date())/86400000)<=3;
      }catch(e){return false;}
    }).length;
    const body=`<div class="s5c-stat-grid">
      <div class="s5c-stat"><span>보유재료</span><b>${fridge.length}</b></div>
      <div class="s5c-stat"><span>곧 만료</span><b style="color:${exp?'#E53935':'#079E68'}">${exp}</b></div>
      <div class="s5c-stat"><span>추천방식</span><b>AI</b></div>
    </div>
    <div class="s5c-section-title"><b>냉장고 기반 추천</b><span>재료 우선 사용</span></div>
    <div class="s5c-flow-grid">
      <button class="s5c-flow-card" onclick="go(S&&S.fridge&&S.fridge.length?'a-flow':'fridge')">
        <div class="s5c-flow-icon" style="background:#E8FFF4">🥬</div>
        <div class="s5c-flow-main"><b>${fridge.length?'보유 재료로 식단 만들기':'냉장고 재료 먼저 추가하기'}</b><span>${fridge.length?'냉장고 재료 '+fridge.length+'개를 기준으로 메뉴를 추천해요.':'재료를 추가하면 더 정확한 식단을 만들 수 있어요.'}</span></div>
        <div class="s5c-flow-arrow">›</div>
      </button>
      <button class="s5c-flow-card" onclick="go('fridge')">
        <div class="s5c-flow-icon" style="background:#F3F0FF">❄️</div>
        <div class="s5c-flow-main"><b>냉장고 관리</b><span>보유 재료, 유통기한, 수량을 먼저 정리해요.</span></div>
        <div class="s5c-flow-arrow">›</div>
      </button>
    </div>`;
    return s5FlowShell('a','냉장고 기반 추천','있는 재료를 먼저 쓰는 식단 생성','❄️','재료 낭비를 줄이는 식단',body);
  }

  function s5B(){
    const styles=s5Styles();
    if(!S.bcStyles) S.bcStyles=[];
    const chips=styles.map(st=>`<button class="s5c-chip ${S.bcStyles.includes(st)?'active':''}" onclick="S.bcStyles=S.bcStyles||[]; if(S.bcStyles.includes('${s5Esc(st)}')) S.bcStyles=S.bcStyles.filter(x=>x!=='${s5Esc(st)}'); else S.bcStyles.push('${s5Esc(st)}'); render();">${s5Esc(st)}</button>`).join('');
    const body=`<div class="s5c-section-title"><b>먹고 싶은 스타일</b><span>복수 선택 가능</span></div>
    <div class="s5c-chip-row">${chips}</div>
    <button class="s5c-primary" onclick="S.bcMode='b'; if(!S.bcStyles||!S.bcStyles.length) S.bcStyles=['한식']; go('b-suggest')">🤔 메뉴 추천받기</button>
    <div class="s5c-section-title"><b>추천 방식</b><span>상황별 선택</span></div>
    <div class="s5c-flow-grid">
      <button class="s5c-flow-card" onclick="S.bcMode='b';go('b-suggest')">
        <div class="s5c-flow-icon" style="background:#FFF3E8">🎲</div>
        <div class="s5c-flow-main"><b>랜덤 추천</b><span>고른 스타일 안에서 오늘 먹을 메뉴를 추천해요.</span></div><div class="s5c-flow-arrow">›</div>
      </button>
      <button class="s5c-flow-card" onclick="go('bc-entry')">
        <div class="s5c-flow-icon" style="background:#F3F0FF">✍️</div>
        <div class="s5c-flow-main"><b>직접 입력으로 이동</b><span>이미 먹고 싶은 메뉴가 있으면 직접 담아요.</span></div><div class="s5c-flow-arrow">›</div>
      </button>
    </div>`;
    return s5FlowShell('b','뭘 먹을지 모르겠어요','스타일만 고르면 메뉴 후보를 추천해요','🤔','오늘 메뉴 고민 끝내기',body);
  }

  function s5C(){
    const menus=(S.bcMenus||[]).filter(Boolean);
    const list=menus.length?menus.slice(0,12).map((m,i)=>{
      const n=s5Nut(m);
      return `<div class="s5c-menu-card">
        <div class="s5c-menu-icon">${s5Icon(m)}</div>
        <div class="s5c-menu-main"><b>${s5Esc(m)}</b><span>${n.cal?Math.round(n.cal)+' kcal · ':''}선택한 메뉴</span></div>
        <button onclick="S.bcMenus.splice(${i},1);render()" style="border:0;background:#FFF0F0;color:#E53935;border-radius:999px;width:28px;height:28px;font-weight:900">×</button>
      </div>`;
    }).join(''):`<div style="text-align:center;color:#7C8698;background:#fff;border-radius:24px;padding:28px 14px;border:1px solid rgba(17,24,39,.06);box-shadow:0 10px 24px rgba(15,23,42,.055)">아직 담은 메뉴가 없어요.<br><span style="font-size:12px;color:#A8B0BD">메뉴를 검색하거나 직접 입력해 식단을 만들 수 있어요.</span></div>`;
    const body=`<div class="s5c-section-title"><b>선택한 메뉴</b><span>${menus.length}개</span></div>
    ${list}
    <div style="height:8px"></div>
    <button class="s5c-primary" onclick="S.bcMode='c';go('bc-entry')">＋ 메뉴 추가하기</button>
    <div style="height:8px"></div>
    <button class="s5c-secondary" onclick="S.bcMode='c'; if((S.bcMenus||[]).length){genBCCart()}else{go('bc-entry')}">🛒 장보기로 진행</button>`;
    return s5FlowShell('c','직접 식단 만들기','먹고 싶은 메뉴를 직접 담아 식단으로 만들어요','✍️','내가 고르는 맞춤 식단',body);
  }

  // Override likely entry renderers if they exist.
  const candidatesA=['rAFlow','rAEntry','rFridgeFlow','rAStart'];
  const candidatesB=['rBFlow','rBEntry','rStyleFlow','rBStart'];
  const candidatesC=['rCFlow','rCEntry','rCustomFlow','rCStart'];

  candidatesA.forEach(k=>{ if(typeof window[k]==='function') window[k]=s5A; });
  candidatesB.forEach(k=>{ if(typeof window[k]==='function') window[k]=s5B; });
  candidatesC.forEach(k=>{ if(typeof window[k]==='function') window[k]=s5C; });

  // Patch router-level render by screen/page name.
  const oldRender=window.render;
  if(typeof oldRender==='function'){
    window.render=function(){
      const page=(S&&(S.page||S.screen||S.view))||'';
      if(page==='a-flow'||page==='a-entry'||page==='fridge-flow'){
        document.getElementById('app').innerHTML = s5A() + (typeof rTab==='function'?rTab():'');
        return;
      }
      if(page==='b-flow'||page==='b-entry'||page==='style-flow'){
        document.getElementById('app').innerHTML = s5B() + (typeof rTab==='function'?rTab():'');
        return;
      }
      if(page==='c-flow'||page==='c-entry'||page==='custom-flow'){
        document.getElementById('app').innerHTML = s5C() + (typeof rTab==='function'?rTab():'');
        return;
      }
      return oldRender.apply(this,arguments);
    };
  }

  window.sprint5CFlowA=s5A;
  window.sprint5CFlowB=s5B;
  window.sprint5CFlowC=s5C;
})();

function _safeShelfLife(name){
  if(typeof getShelfLife==='function') return getShelfLife(name);
  return {days:7, storage:'냉장'};
}

// ── 칼로리 목표 저장 ──
function saveCalGoal(){
  localStorage.setItem('wm_cal_goal', String(S.calorieGoal));
}

// ── 식단 일기 저장 ──
function saveMealDiary(){
  localStorage.setItem('wm_meal_diary', JSON.stringify(S.mealDiary));
}
function saveTodayMeals(){
  localStorage.setItem('wm_today_meals', JSON.stringify(S.todayMeals));
}

// ── 오늘 날짜 키 ──

// ── 식단 일기에 메뉴 추가 ──
function addToDiary(menuName, sourceDateKey){
  const key = sourceDateKey || todayKey();
  if(!S.mealDiary[key]) S.mealDiary[key]=[];
  const nut=calcNutrition(menuName,1);
  S.mealDiary[key].push({
    name:menuName,
    time:new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}),
    cal:nut?nut.cal:0,
    pro:nut?nut.pro:0,
    fat:nut?nut.fat:0,
    carb:nut?nut.carb:0,
  });
  saveMealDiary();
  alert(menuName+" 식단 일기에 추가됐어요!");
}

// ── 식단 일기 화면 ──
function rDiaryTab(){
  const key=todayKey();
  if(!S.mealDiary || typeof S.mealDiary!=='object') S.mealDiary={};
  const today=S.mealDiary[key]||[];
  const todayCal=today.reduce((s,m)=>s+(Number(m.cal)||0),0);
  const todayPro=today.reduce((s,m)=>s+(Number(m.pro)||0),0);
  const todayCarb=today.reduce((s,m)=>s+(Number(m.carb)||0),0);
  const todayFat=today.reduce((s,m)=>s+(Number(m.fat)||0),0);
  const goalCal=S.calorieGoal||2000;
  const pct=Math.min(100,Math.round(todayCal/goalCal*100));
  const remain=Math.max(0,goalCal-todayCal);

  const days=[];
  for(let i=6;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    const k=`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    const meals=S.mealDiary[k]||[];
    const cal=meals.reduce((s,m)=>s+(Number(m.cal)||0),0);
    days.push({date:d.getDate(),day:["일","월","화","수","목","금","토"][d.getDay()],key:k,meals,cal});
  }

  const plannedToday = (S.mealCalendar&&S.mealCalendar[key]) ? S.mealCalendar[key] : [];
  const plannedHTML = plannedToday.length ? plannedToday.map((m,i)=>{
    const name = m.name || m.menu || m.title || '';
    const type = m.type || m.meal || '';
    const nut = name ? calcNutrition(name,1) : null;
    const already = today.some(x=>x.name===name);
    return `<div class="diary-plan-row">
      <div class="diary-meal-dot">${type==='아침'?'☀️':type==='저녁'?'🌙':'🍽️'}</div>
      <div class="diary-plan-main">
        <div class="diary-plan-name">${name||'메뉴 없음'}</div>
        <div class="diary-plan-sub">${type||'식사'} · ${nut?nut.cal+' kcal':'영양정보 없음'}</div>
      </div>
      <button class="diary-mini-btn ${already?'done':''}" ${already?'disabled':''} onclick="${already?'':'addToDiary(\''+String(name).replace(/'/g,"\\'")+'\',\''+key+'\');render()'}">${already?'기록됨':'기록'}</button>
    </div>`;
  }).join('') : `<div class="diary-empty-small">오늘 예정된 식단이 아직 없어요.</div>`;

  return`<div class="diary-v2">
    <div class="diary-head">
      <div>
        <div class="diary-kicker">FOOD DIARY</div>
        <div class="title" style="margin:0">식단 일기</div>
        <div class="diary-date">${new Date().toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'})}</div>
      </div>
      <button class="diary-head-btn" onclick="showDiaryAdd()">+ 기록</button>
    </div>

    <div class="diary-hero">
      <div class="diary-hero-top">
        <div>
          <div class="diary-label">오늘 섭취</div>
          <div class="diary-cal"><b>${todayCal}</b><span>/ ${goalCal} kcal</span></div>
        </div>
        <div class="diary-ring" style="--p:${pct}">
          <span>${pct}%</span>
        </div>
      </div>
      <div class="diary-progress"><i style="width:${pct}%"></i></div>
      <div class="diary-hero-foot">
        ${todayCal>goalCal?`목표보다 <b>${todayCal-goalCal} kcal</b> 초과했어요.`:`오늘 <b>${remain} kcal</b> 더 섭취 가능해요.`}
      </div>
    </div>

    <div class="diary-macro-grid">
      <div class="diary-macro-card">
        <span>탄수화물</span><b>${Math.round(todayCarb)}g</b>
      </div>
      <div class="diary-macro-card">
        <span>단백질</span><b>${Math.round(todayPro)}g</b>
      </div>
      <div class="diary-macro-card">
        <span>지방</span><b>${Math.round(todayFat)}g</b>
      </div>
    </div>

    <div class="diary-card">
      <div class="diary-card-title">
        <div>
          <b>오늘 예정 식단</b>
          <span>예정된 식단만 기록할 수 있어요</span>
        </div>
      </div>
      <div class="diary-plan-list">${plannedHTML}</div>
    </div>

    <div class="diary-card">
      <div class="diary-card-title">
        <div>
          <b>오늘 기록</b>
          <span>${today.length}개 메뉴</span>
        </div>
        <button onclick="showDiaryAdd()">+ 추가</button>
      </div>
      ${today.length===0?`<div class="diary-empty">아직 기록된 식단이 없어요.<br><span>오늘 먹은 메뉴를 기록하면 칼로리와 탄단지가 자동 집계돼요.</span></div>`:
        `<div class="diary-eaten-list">${today.map((m,i)=>`<div class="diary-eaten-row">
          <div class="diary-eaten-icon">🍽️</div>
          <div class="diary-eaten-main">
            <div>${m.name}</div>
            <span>${m.time||''} · 탄 ${Math.round(m.carb||0)}g · 단 ${Math.round(m.pro||0)}g · 지 ${Math.round(m.fat||0)}g</span>
          </div>
          <b>${Math.round(m.cal||0)} kcal</b>
          <button onclick="S.mealDiary['${key}'].splice(${i},1);saveMealDiary();render()">×</button>
        </div>`).join('')}</div>`}
    </div>

    <div class="diary-card">
      <div class="diary-card-title">
        <div><b>주간 현황</b><span>최근 7일 칼로리 기록</span></div>
      </div>
      <div class="diary-week-grid">
        ${days.map(d=>`<div class="diary-day">
          <span>${d.day}</span>
          <b>${d.date}</b>
          <i style="height:${Math.min(100,Math.max(8,Math.round(d.cal/goalCal*100)))}%;background:${d.cal===0?'#E5E7EB':d.cal>goalCal?'#EF4444':'var(--wm-primary)'}"></i>
          <em>${d.cal===0?'-':Math.round(d.cal/100)*100}</em>
        </div>`).join('')}
      </div>
    </div>

    ${rNutritionReport(days)}
  </div>`;
}

// ── 영양 주간 리포트 ──
function rNutritionReport(days){
  const totals=days.reduce((acc,d)=>{
    (d.meals||[]).forEach(m=>{acc.cal+=Number(m.cal)||0;acc.pro+=Number(m.pro)||0;acc.fat+=Number(m.fat)||0;acc.carb+=Number(m.carb)||0;});
    return acc;
  },{cal:0,pro:0,fat:0,carb:0});
  const activeDays=days.filter(d=>d.cal>0).length||1;
  const avg={
    cal:Math.round(totals.cal/activeDays),
    pro:Math.round(totals.pro/activeDays),
    fat:Math.round(totals.fat/activeDays),
    carb:Math.round(totals.carb/activeDays),
  };
  const totalMacro=(avg.pro*4)+(avg.fat*9)+(avg.carb*4)||1;
  const carbPct=Math.round(avg.carb*4/totalMacro*100);
  const proPct=Math.round(avg.pro*4/totalMacro*100);
  const fatPct=Math.max(0,100-carbPct-proPct);
  const goalCal=S.calorieGoal||2000;

  return`<div class="diary-card diary-report">
    <div class="diary-card-title">
      <div><b>영양 주간 리포트</b><span>기록한 날 기준 평균</span></div>
    </div>

    <div class="diary-report-main">
      <div>
        <span>평균 칼로리</span>
        <b>${avg.cal}</b>
        <em>kcal / 목표 ${goalCal}</em>
      </div>
      <div>
        <span>평균 단백질</span>
        <b>${avg.pro}g</b>
        <em>하루 평균</em>
      </div>
    </div>

    <div class="diary-ratio-title">탄 · 단 · 지 비율</div>
    <div class="diary-ratio">
      <i style="width:${carbPct}%"></i>
      <i style="width:${proPct}%"></i>
      <i style="width:${fatPct}%"></i>
    </div>
    <div class="diary-ratio-legend">
      <span>탄수 ${carbPct}%</span>
      <span>단백질 ${proPct}%</span>
      <span>지방 ${fatPct}%</span>
    </div>

    ${avg.cal===0?`<div class="diary-empty-small">아직 기록이 부족해요. 식단을 기록하면 리포트가 채워져요.</div>`:''}
  </div>`;
}

// ── 식단 일기 추가 팝업 ──
function showDiaryAdd(){
  const overlay=document.createElement("div");
  overlay.className="diary-sheet-bg";
  const sheet=document.createElement("div");
  sheet.className="diary-sheet";

  const title=document.createElement("div");
  title.className="diary-sheet-title";
  title.innerHTML="<b>식단 기록 추가</b><span>오늘 먹은 메뉴를 검색해서 추가하세요</span>";

  const input=document.createElement("input");
  input.placeholder="메뉴 검색...";
  input.className="diary-sheet-input";

  const list=document.createElement("div");
  list.className="diary-sheet-list";

  function buildList(q){
    list.innerHTML="";
    const lq=String(q||'').toLowerCase();
    const keys=Object.keys(MENU_DB).filter(k=>!q||String(k).toLowerCase().includes(lq)).slice(0,28);
    if(!keys.length){
      list.innerHTML='<div class="diary-empty-small">검색 결과가 없어요.</div>';
      return;
    }
    keys.forEach(name=>{
      const nut=calcNutrition(name,1);
      const btn=document.createElement("button");
      btn.className="diary-search-row";
      btn.innerHTML=`<div><b>${name}</b><span>${nut?`탄 ${Math.round(nut.carb||0)}g · 단 ${Math.round(nut.pro||0)}g · 지 ${Math.round(nut.fat||0)}g`:''}</span></div><em>${nut?nut.cal+' kcal':''}</em>`;
      btn.onclick=()=>{addToDiary(name);overlay.remove();render();};
      list.appendChild(btn);
    });
  }

  input.oninput=()=>buildList(input.value);
  buildList("");

  const closeBtn=document.createElement("button");
  closeBtn.className="diary-sheet-close";
  closeBtn.textContent="닫기";
  closeBtn.onclick=()=>overlay.remove();

  sheet.appendChild(title);
  sheet.appendChild(input);
  sheet.appendChild(list);
  sheet.appendChild(closeBtn);
  overlay.appendChild(sheet);
  overlay.onclick=e=>{if(e.target===overlay)overlay.remove();};
  document.body.appendChild(overlay);
  setTimeout(()=>input.focus(),80);
}

function showWarn(msgs){
  if(!msgs||!msgs.length){go("home");return;}
  const overlay=document.createElement("div");
  overlay.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px";
  const box=document.createElement("div");
  box.style.cssText="background:#fff;border-radius:20px;padding:24px;max-width:360px;width:100%";
  const title=document.createElement("div");
  title.style.cssText="font-weight:800;font-size:17px;margin-bottom:12px";
  title.textContent="재료 부족 안내";
  box.appendChild(title);
  msgs.forEach(function(m){
    const d=document.createElement("div");
    d.style.cssText="font-size:13px;color:#555;padding:6px 0;border-bottom:1px solid #f0f0f0";
    d.textContent=m;
    box.appendChild(d);
  });
  const btn=document.createElement("button");
  btn.style.cssText="width:100%;padding:12px;background:var(--primary);color:#fff;border:none;border-radius:12px;font-weight:700;font-size:14px;margin-top:14px;cursor:pointer";
  btn.textContent="확인하고 식단 보기";
  btn.onclick=function(){overlay.remove();go("home");};
  box.appendChild(btn);
  overlay.appendChild(box);
  overlay.onclick=function(e){if(e.target===overlay){overlay.remove();go("home");}};
  document.body.appendChild(overlay);
}

function openStyleDrop(){
  const existing=document.getElementById('style-modal');
  if(existing){existing.remove();return;}

  const ALL_STYLES=[
    {group:"국내/기본", items:[{id:"한식",e:"🍚"},{id:"일식",e:"🍱"},{id:"중식",e:"🥢"},{id:"헬시",e:"🥗"},{id:"브런치",e:"🍳"}]},
    {group:"동남아시아", items:[{id:"🇹🇭 태국",e:"🇹🇭"},{id:"🇻🇳 베트남",e:"🇻🇳"},{id:"🇮🇩 인도네시아",e:"🇮🇩"},{id:"🇲🇾 말레이시아",e:"🇲🇾"},{id:"🇸🇬 싱가포르",e:"🇸🇬"},{id:"🇵🇭 필리핀",e:"🇵🇭"},{id:"🇹🇼 대만",e:"🇹🇼"}]},
    {group:"남아시아/중동", items:[{id:"🇮🇳 인도",e:"🇮🇳"},{id:"🌙 중동",e:"🌙"},{id:"🇹🇷 터키",e:"🇹🇷"}]},
    {group:"유럽", items:[{id:"🇬🇷 그리스",e:"🇬🇷"},{id:"🇪🇸 스페인",e:"🇪🇸"},{id:"🇫🇷 프랑스",e:"🇫🇷"},{id:"🇮🇹 이탈리아",e:"🇮🇹"},{id:"🇩🇪 독일",e:"🇩🇪"},{id:"🇵🇹 포르투갈",e:"🇵🇹"},{id:"🇷🇺 러시아",e:"🇷🇺"},{id:"🇵🇱 폴란드",e:"🇵🇱"},{id:"🇸🇪 스웨덴",e:"🇸🇪"},{id:"🇨🇿 체코",e:"🇨🇿"}]},
    {group:"아메리카", items:[{id:"🇲🇽 멕시코",e:"🇲🇽"},{id:"🇺🇸 미국",e:"🇺🇸"},{id:"🇦🇷 아르헨티나",e:"🇦🇷"},{id:"🇧🇷 브라질",e:"🇧🇷"},{id:"🇵🇪 페루",e:"🇵🇪"},{id:"🇨🇴 콜롬비아",e:"🇨🇴"},{id:"🇯🇲 자메이카",e:"🇯🇲"}]},
    {group:"아프리카", items:[{id:"🇲🇦 모로코",e:"🇲🇦"},{id:"🇪🇹 에티오피아",e:"🇪🇹"},{id:"🇳🇬 나이지리아",e:"🇳🇬"},{id:"🇹🇳 튀니지",e:"🇹🇳"}]}
  ];

  // DOM으로 직접 생성 - 백틱/따옴표 충돌 없음
  function buildList(q){
    const lq=q.toLowerCase();
    const listEl=document.getElementById('style-modal-list');
    if(!listEl)return;
    listEl.innerHTML='';
    let found=false;
    ALL_STYLES.forEach(grp=>{
      const items=grp.items.filter(s=>!q||s.id.toLowerCase().includes(lq));
      if(!items.length)return;
      found=true;
      const hdr=document.createElement('div');
      hdr.style.cssText='padding:8px 16px 4px;font-size:11px;font-weight:700;color:#aaa;letter-spacing:1px';
      hdr.textContent=grp.group;
      listEl.appendChild(hdr);
      items.forEach(s=>{
        const sel=S.bcStyles.includes(s.id);
        const btn=document.createElement('button');
        btn.style.cssText='width:100%;padding:13px 16px;border:none;background:'+(sel?'#FFF8EE':'#fff')+';display:flex;align-items:center;gap:12px;text-align:left;border-bottom:1px solid #f5f5f5;cursor:pointer';
        // 이름 span
        const nameEl = document.createElement('span');
        const nameTxt = s.id.includes(' ') ? s.id.split(' ').slice(1).join(' ') : s.id;
        nameEl.style.cssText = 'font-weight:600;font-size:15px;flex:1;color:'+(sel?'var(--primary)':'var(--text)');
        nameEl.textContent = nameTxt;

        btn.appendChild(nameEl);

        if(sel){
          const chk = document.createElement('span');
          chk.style.cssText = 'color:var(--primary);font-size:18px;font-weight:900';
          chk.textContent = '✓';
          btn.appendChild(chk);
        }

        btn.addEventListener('click',function(){
          // 재클릭 시 선택 해제(undo), 미선택 시 선택
          if(S.bcStyles.includes(s.id)) removeStyle(s.id, true);
          else pushStyle(s.id, true);
          const q2=document.getElementById('style-search-modal')?.value||'';
          buildList(q2);
        });
        listEl.appendChild(btn);
      });
    });
    if(!found){
      const empty=document.createElement('div');
      empty.style.cssText='padding:24px;text-align:center;color:#aaa;font-size:14px';
      empty.textContent='검색 결과가 없어요';
      listEl.appendChild(empty);
    }
  }

  // 모달 생성
  const overlay=document.createElement('div');
  overlay.id='style-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(26,26,46,0.5);z-index:9999;display:flex;align-items:flex-end;justify-content:center';

  const sheet=document.createElement('div');
  sheet.style.cssText='background:#fff;border-radius:24px 24px 0 0;width:100%;max-width:480px;max-height:80vh;display:flex;flex-direction:column;overflow:hidden';

  // 헤더
  const hdr=document.createElement('div');
  hdr.style.cssText='padding:16px 16px 10px;border-bottom:1px solid #f0f0f0;flex-shrink:0';
  const titleRow=document.createElement('div');
  titleRow.style.cssText='display:flex;align-items:center;justify-content:space-between;margin-bottom:10px';
  const title=document.createElement('div');
  title.style.cssText='font-weight:800;font-size:16px';
  title.textContent='음식 스타일 선택';
  const closeBtn=document.createElement('button');
  closeBtn.style.cssText='background:#f0f0f0;border:none;border-radius:10px;padding:6px 14px;font-size:13px;color:#666;font-weight:600;cursor:pointer';
  closeBtn.textContent='완료';
  closeBtn.onclick=()=>overlay.remove();
  titleRow.appendChild(title);
  titleRow.appendChild(closeBtn);

  const search=document.createElement('input');
  search.id='style-search-modal';
  search.placeholder='국가/스타일 검색...';
  search.style.cssText='width:100%;padding:10px 14px;border:1.5px solid #e0e0e0;border-radius:12px;font-size:14px;outline:none;box-sizing:border-box';
  search.oninput=function(){buildList(this.value);};

  hdr.appendChild(titleRow);
  hdr.appendChild(search);

  // 리스트 컨테이너
  const listEl=document.createElement('div');
  listEl.id='style-modal-list';
  listEl.style.cssText='overflow-y:auto;flex:1;padding-bottom:24px';

  sheet.appendChild(hdr);
  sheet.appendChild(listEl);
  overlay.appendChild(sheet);
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  document.body.appendChild(overlay);

  buildList('');
  setTimeout(()=>search.focus(),100);
}

function flagImg(emoji){
  if(!emoji) return '';
  try {
    // 유니코드 코드포인트로 twemoji SVG URL 직접 생성
    const codepoints = [...emoji].map(c => c.codePointAt(0).toString(16)).join('-');
    const url = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/' + codepoints + '.svg';
    return '<img src="' + url + '" style="width:20px;height:20px;vertical-align:middle;display:inline-block" onerror="this.style.display=\'none\';this.insertAdjacentHTML(\'afterend\',\'<span>'+emoji+'</span>\')">';
  } catch(e) {
    return '<span style="font-size:16px">'+emoji+'</span>';
  }
}

function pushStyle(id, skipRender){
  if(!S.bcStyles.includes(id)) S.bcStyles.push(id);
  if(!skipRender) render();
}

function removeStyle(id, skipRender){
  S.bcStyles = S.bcStyles.filter(x=>x!==id);
  if(!skipRender) render();
}

function setMeal(dayIdx, mealIdx, backScreen){
  const plan = S.mealPlan;
  if(!plan||!plan.weeklyMeal) return;
  const day = plan.weeklyMeal[dayIdx];
  if(!day||!day.meals) return;
  S.currentMeal = day.meals[mealIdx];
  S.recipeBack = backScreen||'a-meal';
  go('recipe');
}
function setMealFromMonthly(dateKey, mealIdx){
  if(!S.monthlyPlan||!S.monthlyPlan[dateKey]) return;
  S.currentMeal = S.monthlyPlan[dateKey][mealIdx];
  S.recipeBack = 'tab-meal';
  go('recipe');
}

// ── 브랜드 DB ──
const BRAND_DB={
  김치:[{name:"종갓집",product:"포기김치 3kg",icon:"🥬",color:"#c62828",url:"https://coupa.ng/jongga_kimchi",until:"2025-12-31"},{name:"비비고",product:"썰은김치 500g",icon:"🥬",color:"#d32f2f",url:"https://smartstore.naver.com/bibigo",until:"2025-11-30"}],
  깍두기:[{name:"종갓집",product:"깍두기 500g",icon:"🥕",color:"#c62828",url:"https://coupa.ng/jongga_kimchi",until:"2025-12-31"},{name:"풀무원",product:"깍두기 400g",icon:"🥕",color:"#2e7d32",url:"https://smartstore.naver.com/pulmuone",until:"2025-12-31"}],
  나물:[{name:"풀무원",product:"시금치나물 200g",icon:"🥬",color:"#2e7d32",url:"https://smartstore.naver.com/pulmuone",until:"2025-12-31"},{name:"동원",product:"모둠나물 3종",icon:"🌿",color:"#1565c0",url:"https://smartstore.naver.com/dongwon",until:"2025-12-31"}],
  시금치나물:[{name:"풀무원",product:"시금치나물 200g",icon:"🥬",color:"#2e7d32",url:"https://smartstore.naver.com/pulmuone",until:"2025-12-31"}],
  콩나물무침:[{name:"풀무원",product:"콩나물무침 200g",icon:"🌿",color:"#2e7d32",url:"https://smartstore.naver.com/pulmuone",until:"2025-12-31"}],
  계란말이:[{name:"CJ",product:"햇반 계란말이 2입",icon:"🥚",color:"#1976d2",url:"https://smartstore.naver.com/cj",until:"2025-12-31"}],
  계란후라이:[{name:"CJ",product:"햇반 반찬 계란",icon:"🥚",color:"#1976d2",url:"https://smartstore.naver.com/cj",until:"2025-12-31"}],
  감자볶음:[{name:"오뚜기",product:"감자볶음 200g",icon:"🥔",color:"#f57c00",url:"https://smartstore.naver.com/ottogi",until:"2025-12-31"}],
  장조림:[{name:"CJ",product:"소고기 장조림 200g",icon:"🥩",color:"#1976d2",url:"https://smartstore.naver.com/cj",until:"2025-12-31"},{name:"동원",product:"장조림 180g",icon:"🥩",color:"#1565c0",url:"https://smartstore.naver.com/dongwon",until:"2025-12-31"}],
  조림:[{name:"CJ",product:"두부조림 200g",icon:"🟫",color:"#1976d2",url:"https://smartstore.naver.com/cj",until:"2025-12-31"},{name:"오뚜기",product:"생선조림 200g",icon:"🐟",color:"#f57c00",url:"https://smartstore.naver.com/ottogi",until:"2025-12-31"}],
  멸치볶음:[{name:"동원",product:"멸치볶음 100g",icon:"🐟",color:"#1565c0",url:"https://smartstore.naver.com/dongwon",until:"2025-12-31"},{name:"CJ",product:"마른반찬 멸치",icon:"🐟",color:"#1976d2",url:"https://smartstore.naver.com/cj",until:"2025-12-31"}],
  어묵볶음:[{name:"삼진어묵",product:"어묵볶음 200g",icon:"🟡",color:"#e65100",url:"https://smartstore.naver.com/samjin",until:"2025-12-31"},{name:"고래사",product:"어묵 모둠",icon:"🟡",color:"#0288d1",url:"https://smartstore.naver.com/koraesa",until:"2025-12-31"}],
  단무지:[{name:"피코크",product:"단무지 350g",icon:"🟡",color:"#6a1b9a",url:"https://emart.ssg.com",until:"2025-12-31"},{name:"오뚜기",product:"단무지 300g",icon:"🟡",color:"#f57c00",url:"https://smartstore.naver.com/ottogi",until:"2025-12-31"}],
  오이무침:[{name:"풀무원",product:"오이무침 200g",icon:"🥒",color:"#2e7d32",url:"https://smartstore.naver.com/pulmuone",until:"2025-12-31"}],
  깻잎:[{name:"풀무원",product:"깻잎무침 150g",icon:"🌿",color:"#2e7d32",url:"https://smartstore.naver.com/pulmuone",until:"2025-12-31"}],
  상추:[{name:"풀무원",product:"신선 상추 150g",icon:"🥬",color:"#2e7d32",url:"https://smartstore.naver.com/pulmuone",until:"2025-12-31"}],
  샐러드:[{name:"풀무원",product:"샐러드 믹스 150g",icon:"🥗",color:"#2e7d32",url:"https://smartstore.naver.com/pulmuone",until:"2025-12-31"},{name:"피코크",product:"시저샐러드 키트",icon:"🥗",color:"#6a1b9a",url:"https://emart.ssg.com",until:"2025-12-31"}],
  고추장:[{name:"순창",product:"태양초 고추장 500g",icon:"🌶️",color:"#b71c1c",url:"https://smartstore.naver.com/sunchang",until:"2025-12-31"},{name:"청정원",product:"순창 고추장",icon:"🌶️",color:"#558b2f",url:"https://smartstore.naver.com/daesang",until:"2025-12-31"}],
  된장:[{name:"청정원",product:"명품 된장 500g",icon:"🥣",color:"#795548",url:"https://smartstore.naver.com/daesang",until:"2025-12-31"},{name:"샘표",product:"된장 450g",icon:"🥣",color:"#4e342e",url:"https://smartstore.naver.com/sempio",until:"2025-12-31"}],
  쌈장:[{name:"CJ",product:"쌈장 170g",icon:"🥣",color:"#1976d2",url:"https://smartstore.naver.com/cj",until:"2025-12-31"},{name:"청정원",product:"강된장 쌈장",icon:"🥣",color:"#558b2f",url:"https://smartstore.naver.com/daesang",until:"2025-12-31"}],
  참기름:[{name:"오뚜기",product:"참기름 320ml",icon:"🫙",color:"#f57c00",url:"https://smartstore.naver.com/ottogi",until:"2025-12-31"},{name:"청정원",product:"들기름 320ml",icon:"🫙",color:"#558b2f",url:"https://smartstore.naver.com/daesang",until:"2025-12-31"}],
  간장:[{name:"샘표",product:"501 진간장 930ml",icon:"🍶",color:"#4e342e",url:"https://smartstore.naver.com/sempio",until:"2025-12-31"},{name:"CJ",product:"백설 국간장",icon:"🍶",color:"#1976d2",url:"https://smartstore.naver.com/cj",until:"2025-12-31"}],
  무나물:[{name:"풀무원",product:"무나물 200g",icon:"🥬",color:"#2e7d32",url:"https://smartstore.naver.com/pulmuone",until:"2025-12-31"}],
  도라지무침:[{name:"풀무원",product:"도라지무침 150g",icon:"🥬",color:"#2e7d32",url:"https://smartstore.naver.com/pulmuone",until:"2025-12-31"}],
  고사리나물:[{name:"풀무원",product:"고사리나물 200g",icon:"🌿",color:"#2e7d32",url:"https://smartstore.naver.com/pulmuone",until:"2025-12-31"}],
  연근조림:[{name:"CJ",product:"연근조림 200g",icon:"🥬",color:"#1976d2",url:"https://smartstore.naver.com/cj",until:"2025-12-31"}],
  알감자조림:[{name:"오뚜기",product:"알감자조림 200g",icon:"🥔",color:"#f57c00",url:"https://smartstore.naver.com/ottogi",until:"2025-12-31"}],
  두부조림:[{name:"풀무원",product:"두부조림 200g",icon:"🟫",color:"#2e7d32",url:"https://smartstore.naver.com/pulmuone",until:"2025-12-31"},{name:"CJ",product:"두부조림 200g",icon:"🟫",color:"#1976d2",url:"https://smartstore.naver.com/cj",until:"2025-12-31"}],
  피클:[{name:"오뚜기",product:"오이피클 320g",icon:"🥒",color:"#f57c00",url:"https://smartstore.naver.com/ottogi",until:"2025-12-31"},{name:"피코크",product:"모둠피클 380g",icon:"🥒",color:"#6a1b9a",url:"https://emart.ssg.com",until:"2025-12-31"}],
  교자:[{name:"비비고",product:"왕교자 385g",icon:"🥟",color:"#d32f2f",url:"https://smartstore.naver.com/bibigo",until:"2025-12-31"},{name:"CJ",product:"육즙만두 350g",icon:"🥟",color:"#1976d2",url:"https://smartstore.naver.com/cj",until:"2025-12-31"}],
  만두:[{name:"비비고",product:"왕교자 385g",icon:"🥟",color:"#d32f2f",url:"https://smartstore.naver.com/bibigo",until:"2025-12-31"},{name:"동원",product:"떡만두국 500g",icon:"🥟",color:"#1565c0",url:"https://smartstore.naver.com/dongwon",until:"2025-12-31"}],
  순대:[{name:"하림",product:"순대 500g",icon:"🌭",color:"#ff6f00",url:"https://smartstore.naver.com/harim",until:"2025-12-31"}],
  튀김:[{name:"오뚜기",product:"냉동튀김 모둠 500g",icon:"🍤",color:"#f57c00",url:"https://smartstore.naver.com/ottogi",until:"2025-12-31"},{name:"CJ",product:"고소한 튀김 400g",icon:"🍤",color:"#1976d2",url:"https://smartstore.naver.com/cj",until:"2025-12-31"}],
  기타:[{name:"CJ",product:"햇반 210g x3",icon:"🍚",color:"#1976d2",url:"https://smartstore.naver.com/cj",until:"2025-12-31"},{name:"동원",product:"참치캔 3입",icon:"🐟",color:"#0288d1",url:"https://smartstore.naver.com/dongwon",until:"2025-11-30"}],
};

// ── 반찬 매핑 ──

// ── 조리시간 매핑 ──

// ── 사이드/반찬 레시피 DB ──
const SIDES_RECIPE = {
  // ─── 한식 반찬 ───
  "김치": {
    desc:"발효 배추김치",
    ingredients:["배추 1포기","굵은소금 1컵","고춧가루 1컵","마늘 1통","생강 1큰술","새우젓 3큰술","액젓 4큰술","설탕 1큰술","쪽파 1단"],
    steps:["배추를 4등분해 소금에 절여 6시간 둔다","절인 배추를 씻어 물기를 짠다","양념재료를 모두 섞어 김치소를 만든다","배추에 김치소를 켜켜이 버무린다","용기에 담아 실온 하루 후 냉장 보관"],
    cookTime:30, tip:"소금절임 시간이 맛의 핵심이에요"
  },
  "계란말이": {
    desc:"부드러운 일식풍 계란말이",
    ingredients:["계란 3개","당근 1/4개","파 약간","소금 약간","설탕 1/2작은술","식용유 적당량"],
    steps:["계란에 소금, 설탕, 다진 채소를 넣고 잘 풀어준다","달군 팬에 기름을 두르고 계란물을 붓는다","반쯤 익으면 한쪽으로 말아가며 돌돌 만다","식으면 먹기 좋은 크기로 썬다"],
    cookTime:10, tip:"약불에서 천천히 말아야 예쁘게 나와요"
  },
  "시금치나물": {
    desc:"참기름향 시금치나물",
    ingredients:["시금치 300g","참기름 1큰술","간장 1큰술","다진마늘 1작은술","소금 약간","참깨 약간"],
    steps:["시금치를 끓는 물에 30초 데친다","찬물에 헹궈 물기를 꼭 짠다","간장, 참기름, 마늘, 소금으로 무친다","참깨를 뿌려 완성"],
    cookTime:10, tip:"데치는 시간이 너무 길면 색이 변해요"
  },
  "콩나물무침": {
    desc:"아삭한 콩나물무침",
    ingredients:["콩나물 300g","참기름 1큰술","간장 1큰술","고춧가루 1작은술","다진마늘 1작은술","소금 약간","대파 약간"],
    steps:["콩나물을 끓는 물에 3~4분 삶는다","찬물에 헹궈 물기를 뺀다","양념재료와 함께 골고루 무친다"],
    cookTime:10, tip:"뚜껑 열고 삶아야 비린내가 안 나요"
  },
  "멸치볶음": {
    desc:"달콤짭조름 멸치볶음",
    ingredients:["잔멸치 200g","간장 1큰술","설탕 1큰술","물엿 1큰술","다진마늘 1작은술","참기름 1큰술","참깨 약간","식용유 1큰술"],
    steps:["마른 팬에 멸치를 볶아 비린내를 날린다","식용유를 두르고 마늘을 볶는다","간장, 설탕, 물엿을 넣고 볶는다","참기름과 참깨를 뿌려 마무리"],
    cookTime:10, tip:"마지막에 참기름 넣으면 윤기가 나요"
  },
  "감자볶음": {
    desc:"담백한 감자채볶음",
    ingredients:["감자 3개","소금 약간","참기름 1큰술","식용유 1큰술","대파 약간"],
    steps:["감자를 채썰어 찬물에 담가 전분을 뺀다","팬에 기름을 두르고 감자채를 볶는다","소금으로 간하고 참기름으로 마무리"],
    cookTime:15, tip:"찬물에 담가야 부서지지 않아요"
  },
  "두부조림": {
    desc:"짭조름한 두부조림",
    ingredients:["두부 1모","간장 3큰술","고춧가루 1큰술","설탕 1큰술","다진마늘 1큰술","대파 약간","참기름 1큰술","식용유 2큰술"],
    steps:["두부를 도톰하게 썰어 기름에 앞뒤로 굽는다","간장, 설탕, 고춧가루, 마늘, 물을 섞어 양념을 만든다","구운 두부 위에 양념을 넣고 조린다","대파와 참기름으로 마무리"],
    cookTime:15, tip:"두부는 충분히 구워야 양념이 잘 배어요"
  },
  "오이무침": {
    desc:"새콤달콤 오이무침",
    ingredients:["오이 2개","소금 1큰술","고춧가루 1큰술","식초 1큰술","설탕 1작은술","다진마늘 1작은술","참기름 1큰술","참깨 약간"],
    steps:["오이를 반달 모양으로 썰어 소금에 절인다","15분 후 물기를 꼭 짠다","양념재료와 함께 무친다","참깨를 뿌려 완성"],
    cookTime:10, tip:"물기를 잘 짜야 물이 생기지 않아요"
  },
  "무나물": {
    desc:"달콤한 무나물",
    ingredients:["무 400g","들기름 1큰술","간장 1큰술","다진마늘 1작은술","소금 약간","대파 약간"],
    steps:["무를 채썰어 들기름에 볶는다","간장, 마늘을 넣고 계속 볶는다","소금으로 간하고 대파를 넣어 마무리"],
    cookTime:15, tip:"들기름에 볶으면 풍미가 살아나요"
  },
  "계란찜": {
    desc:"부드러운 뚝배기 계란찜",
    ingredients:["계란 3개","멸치육수 200ml","소금 약간","참기름 1작은술","대파 약간"],
    steps:["계란을 잘 풀어준다","멸치육수와 소금을 넣고 섞는다","뚝배기에 부어 약불에서 10분 익힌다","대파와 참기름으로 마무리"],
    cookTime:10, tip:"약불에서 천천히 익혀야 부드러워요"
  },
  "깍두기": {
    desc:"아삭한 깍두기",
    ingredients:["무 1개","굵은소금 2큰술","고춧가루 3큰술","다진마늘 1큰술","새우젓 1큰술","설탕 1큰술","쪽파 약간"],
    steps:["무를 깍두기 모양으로 썰어 소금에 30분 절인다","물기를 빼고 고춧가루로 버무린다","마늘, 새우젓, 설탕을 넣고 무친다","쪽파를 넣어 완성"],
    cookTime:20, tip:"소금 절임 후 물기를 잘 빼야 해요"
  },
  "겉절이": {
    desc:"신선한 상추 겉절이",
    ingredients:["상추 200g","고춧가루 1큰술","간장 1큰술","식초 1큰술","참기름 1큰술","설탕 1작은술","깨 약간"],
    steps:["상추를 씻어 먹기 좋게 뜯는다","양념재료를 모두 섞는다","먹기 직전에 버무린다"],
    cookTime:5, tip:"먹기 직전에 버무려야 싱싱해요"
  },
  // ─── 일식 사이드 ───
  "미소국": {
    desc:"일본식 된장국",
    ingredients:["미소된장 2큰술","두부 1/4모","미역 약간","대파 약간","다시마육수 500ml"],
    steps:["다시마육수를 끓인다","두부와 미역을 넣는다","불을 끄고 미소된장을 풀어 넣는다","대파를 넣어 완성"],
    cookTime:10, tip:"된장은 끓이지 않아야 향이 살아요"
  },
  "단무지": {
    desc:"노란 단무지",
    ingredients:["무 1개","식초 100ml","설탕 3큰술","소금 1큰술","강황가루 1작은술"],
    steps:["무를 길게 채썰거나 통으로 썬다","절임액 재료를 모두 섞는다","무에 절임액을 붓고 하루 절인다"],
    cookTime:10, tip:"강황가루가 노란색을 내요"
  },
  "오이절임": {
    desc:"일식풍 오이절임",
    ingredients:["오이 2개","소금 1큰술","식초 2큰술","설탕 1큰술","생강 약간"],
    steps:["오이를 얇게 썰어 소금에 절인다","물기를 꼭 짠다","식초, 설탕, 생강으로 무친다"],
    cookTime:10, tip:"생강이 일식 풍미를 내줘요"
  },
  "교자": {
    desc:"바삭한 군만두",
    ingredients:["교자피 20장","돼지고기 150g","배추 200g","부추 50g","간장 1큰술","참기름 1큰술","소금 약간","식용유 적당량"],
    steps:["속재료를 모두 섞어 소를 만든다","교자피에 소를 넣고 빚는다","팬에 기름 두르고 교자를 굽는다","물을 넣고 뚜껑 덮어 5분 쪄낸다"],
    cookTime:25, tip:"물을 넣고 찌면 속까지 잘 익어요"
  },
  "절임채소": {
    desc:"일식풍 모둠 절임채소",
    ingredients:["오이 1개","당근 1/2개","무 100g","식초 100ml","설탕 3큰술","소금 1큰술"],
    steps:["채소를 먹기 좋은 크기로 썬다","절임액을 끓여 식힌다","채소에 절임액을 붓고 1시간 이상 절인다"],
    cookTime:10, tip:"냉장고에 1주일 보관 가능해요"
  },
  // ─── 중식 사이드 ───
  "달걀수프": {
    desc:"중식 에그드롭 수프",
    ingredients:["계란 2개","닭육수 500ml","전분 1큰술","소금 약간","파 약간","참기름 1작은술"],
    steps:["닭육수를 끓인다","전분물을 넣어 살짝 걸쭉하게 한다","계란을 풀어 실처럼 넣는다","소금, 참기름, 파로 마무리"],
    cookTime:10, tip:"계란은 천천히 저으면서 넣어야 실처럼 돼요"
  },
  "중화피클": {
    desc:"중식풍 채소피클",
    ingredients:["오이 1개","당근 1/2개","식초 2큰술","설탕 1큰술","소금 약간","고추 약간","참기름 약간"],
    steps:["채소를 어슷썰기한다","소금에 살짝 절인다","식초, 설탕, 고추로 무친다","참기름으로 마무리"],
    cookTime:10, tip:"냉장고에서 차갑게 먹으면 더 맛있어요"
  },
  "양파절임": {
    desc:"중식 양파절임",
    ingredients:["양파 2개","식초 3큰술","설탕 2큰술","소금 1큰술","고추 약간"],
    steps:["양파를 채썰어 소금에 10분 절인다","물기를 빼고 식초, 설탕으로 무친다","냉장고에 30분 재워 먹는다"],
    cookTime:10, tip:"짜장면, 짬뽕에 곁들이면 딱이에요"
  },
  "시저샐러드": {
    desc:"클래식 시저샐러드",
    ingredients:["로메인 200g","파마산 치즈 30g","크루통 50g","시저드레싱 3큰술","레몬즙 약간","후추 약간"],
    steps:["로메인을 씻어 먹기 좋게 뜯는다","시저드레싱과 버무린다","파마산 치즈를 갈아 올린다","크루통을 얹어 완성"],
    cookTime:5, tip:"드레싱은 먹기 직전에 버무려야 해요"
  },
  "그린샐러드": {
    desc:"신선한 믹스그린 샐러드",
    ingredients:["믹스그린 150g","방울토마토 10개","오이 1/2개","올리브오일 2큰술","발사믹 1큰술","소금 약간","후추 약간"],
    steps:["채소를 씻어 준비한다","드레싱 재료를 섞는다","먹기 직전에 드레싱을 뿌린다"],
    cookTime:5, tip:"발사믹 드레싱이 이 샐러드와 잘 어울려요"
  },
  "마늘빵": {
    desc:"바삭한 갈릭 버터빵",
    ingredients:["바게트 1/2개","버터 50g","다진마늘 1큰술","파슬리 약간","소금 약간"],
    steps:["버터를 실온에 두어 부드럽게 한다","마늘, 파슬리, 소금을 섞어 마늘버터를 만든다","빵에 마늘버터를 바른다","180도 오븐에서 10분 굽는다"],
    cookTime:15, tip:"에어프라이어로도 쉽게 만들 수 있어요"
  },
  "루꼴라샐러드": {
    desc:"이탈리안 루꼴라 샐러드",
    ingredients:["루꼴라 100g","파마산 치즈 20g","레몬즙 1큰술","올리브오일 2큰술","소금 약간","후추 약간"],
    steps:["루꼴라를 씻어 물기를 뺀다","올리브오일과 레몬즙으로 드레싱을 만든다","루꼴라에 드레싱을 뿌린다","파마산 치즈를 갈아 올린다"],
    cookTime:5, tip:"파마산을 듬뿍 올려야 이탈리아 풍미가 나요"
  },
  "감자퓨레": {
    desc:"크리미한 매쉬드 포테이토",
    ingredients:["감자 4개","버터 50g","우유 100ml","소금 약간","후추 약간","파슬리 약간"],
    steps:["감자를 삶아 뜨거울 때 으깬다","버터를 넣고 섞는다","우유를 조금씩 넣으며 크림처럼 만든다","소금, 후추로 간한다"],
    cookTime:25, tip:"뜨거울 때 버터를 넣어야 잘 녹아요"
  },
  "콜슬로": {
    desc:"크리미 코울슬로",
    ingredients:["양배추 1/4통","당근 1/2개","마요네즈 3큰술","식초 1큰술","설탕 1큰술","소금 약간","후추 약간"],
    steps:["양배추와 당근을 채썬다","소금에 10분 절여 물기를 짠다","마요네즈, 식초, 설탕으로 드레싱을 만든다","채소와 드레싱을 버무린다"],
    cookTime:10, tip:"냉장고에 1시간 두면 맛이 들어요"
  },
  "브루스케타": {
    desc:"이탈리안 브루스케타",
    ingredients:["바게트 1/2개","토마토 2개","바질 약간","올리브오일 2큰술","마늘 1쪽","소금 약간"],
    steps:["바게트를 슬라이스해 오븐에 굽는다","토마토를 다져 올리브오일, 소금과 섞는다","구운 빵에 마늘을 문지른다","토마토 토핑을 올리고 바질로 장식"],
    cookTime:10, tip:"토마토는 씨를 제거해야 질척이지 않아요"
  },
  // ─── 동남아 사이드 ───
  "과카몰레": {
    desc:"멕시칸 아보카도 딥",
    ingredients:["아보카도 2개","라임즙 2큰술","양파 1/4개","고수 약간","소금 약간","할라피뇨 약간"],
    steps:["아보카도를 으깨 라임즙을 넣는다","다진 양파, 고수, 할라피뇨를 넣는다","소금으로 간한다"],
    cookTime:5, tip:"라임즙이 색변화를 막아줘요"
  },
  "살사소스": {
    desc:"신선한 토마토 살사",
    ingredients:["토마토 3개","양파 1/4개","고수 약간","라임즙 1큰술","소금 약간","할라피뇨 1개"],
    steps:["모든 재료를 잘게 다진다","라임즙과 소금으로 간한다","30분 냉장 숙성 후 제공"],
    cookTime:10, tip:"냉장 숙성하면 맛이 더 진해져요"
  },
  "후무스": {
    desc:"중동식 병아리콩 딥",
    ingredients:["병아리콩 400g","타히니 3큰술","레몬즙 3큰술","마늘 2쪽","올리브오일 3큰술","소금 약간","파프리카파우더 약간"],
    steps:["병아리콩을 삶거나 캔을 사용한다","모든 재료를 블렌더에 넣고 간다","올리브오일을 뿌리고 파프리카로 장식"],
    cookTime:10, tip:"병아리콩 삶은 물을 넣으면 더 부드러워요"
  },
  "타불레": {
    desc:"레바논 허브 샐러드",
    ingredients:["파슬리 100g","토마토 2개","오이 1개","불구르 50g","레몬즙 3큰술","올리브오일 3큰술","소금 약간","민트 약간"],
    steps:["불구르를 뜨거운 물에 20분 불린다","파슬리, 토마토, 오이를 잘게 다진다","모든 재료를 섞고 레몬즙과 오일로 드레싱"],
    cookTime:15, tip:"파슬리를 잘게 다질수록 정통 맛이 나요"
  },
};

// 사이드 레시피 조회

function showSideRecipe(sideName){
  const recipe=getSideRecipe(sideName);
  if(!recipe){
    alert(`${sideName}의 레시피 정보가 없어요`);
    return;
  }
  const el=document.createElement("div");
  el.id="side-recipe-popup";
  el.style.cssText="position:fixed;inset:0;background:rgba(26,26,46,0.7);z-index:1000;display:flex;align-items:flex-end;justify-content:center";
  el.innerHTML=`<div style="background:#fff;border-radius:24px 24px 0 0;padding:24px 20px 44px;width:100%;max-width:480px;max-height:80vh;overflow-y:auto">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div>
        <div style="font-weight:800;font-size:18px">${sideName}</div>
        <div style="font-size:12px;color:#aaa">${recipe.desc||""} · ⏱ ${recipe.cookTime||10}분</div>
      </div>
      <button onclick="document.getElementById('side-recipe-popup').remove()" style="background:#f5f5f5;border:none;border-radius:10px;padding:8px 12px;font-size:14px">✕</button>
    </div>

    <div style="background:#f8f8f8;border-radius:14px;padding:12px 14px;margin-bottom:12px">
      <div style="font-size:11px;font-weight:700;color:#888;margin-bottom:8px;letter-spacing:1px">🥬 재료</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${recipe.ingredients.map(i=>`<span style="background:#fff;border:1px solid #e0e0e0;border-radius:20px;padding:4px 10px;font-size:12px">${i}</span>`).join("")}
      </div>
    </div>

    <div style="margin-bottom:12px">
      <div style="font-size:11px;font-weight:700;color:#888;margin-bottom:8px;letter-spacing:1px">👨‍🍳 만드는 법</div>
      ${recipe.steps.map((s,i)=>`<div style="display:flex;gap:10px;margin-bottom:8px;align-items:flex-start">
        <div style="width:22px;height:22px;background:var(--primary);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${i+1}</div>
        <div style="font-size:13px;color:var(--text);line-height:1.5">${s}</div>
      </div>`).join("")}
    </div>

    ${recipe.tip?`<div style="background:var(--primary-pale);border-radius:12px;padding:10px 14px">
      <div style="font-size:12px;color:var(--primary)">💡 ${recipe.tip}</div>
    </div>`:""}
  </div>`;
  el.onclick=function(e){if(e.target===el)el.remove();};
  document.body.appendChild(el);
}

function getSideRecipe(sideName){
  // 정확한 매칭
  if(SIDES_RECIPE[sideName]) return SIDES_RECIPE[sideName];
  // 부분 매칭
  for(const[k,v] of Object.entries(SIDES_RECIPE)){
    if(sideName.includes(k)||k.includes(sideName)) return v;
  }
  return null;
}

function getCookTime(menuName){
  const rules=[
    // 60분+ - 오래 걸리는 요리 (먼저 체크)
    {keywords:["갈비찜","갈비탕","설렁탕","곰탕","삼계탕","백숙","사골","보쌈","수육","족발","동파","홍소","꼬리찜","소꼬리"], time:60},
    // 35분 - 솥밥
    {keywords:["솥밥"], time:35},
    // 30분 - 조림/찜/스튜
    {keywords:["조림","찜","라멘","카레","스튜","수프","피자","스테이크","추어탕","감자탕"], time:30},
    // 25분 - 구이/전/튀김/파스타
    {keywords:["구이","전","튀김","강정","가라아게","데리야끼","파스타","리조또","짜장","짬뽕","탕수"], time:25},
    // 20분 - 볶음/찌개
    {keywords:["볶음","찌개","된장","순두부","청국장","전골","수제비","칼국수","덮밥","규동","오야코","가츠동","잡채"], time:20},
    // 15분 - 빠른 밥/면
    {keywords:["볶음밥","라면","국수","우동","소바","야키소바","볶음면","냉면","비빔면","비빔밥","죽"], time:15},
    // 10분 - 간단 요리
    {keywords:["계란말이","오믈렛","토스트","샌드위치","냉국","무침","겉절이","냉채","샐러드"], time:10},
    // 5분 - 즉석
    {keywords:["계란후라이","스크램블","온천계란","냉두부","연두부무침","참기름계란밥","버터간장밥","명란버터밥","참치마요밥","계란찜"], time:5},
  ];
  for(const rule of rules){
    if(rule.keywords.some(kw=>menuName.includes(kw))) return rule.time;
  }
  return 20; // 기본값
}

// ── 쿠팡 파트너스 설정 ──
const COUPANG_PARTNER_ID = "YOUR_PARTNER_ID"; // 실제 파트너스 ID로 교체
const COUPANG_SUB_ID = "weeklymeal";

function getCoupangUrl(keyword){
  // 쿠팡 파트너스 검색 링크
  const encoded = encodeURIComponent(keyword);
  return `https://coupa.ng/search?q=${encoded}&partner=${COUPANG_PARTNER_ID}&subId=${COUPANG_SUB_ID}`;
}

function getMarketKurlyUrl(keyword){
  return `https://www.kurly.com/search?sword=${encodeURIComponent(keyword)}`;
}

function getShoppingUrl(keyword, prefer="coupang"){
  if(prefer==="kurly") return getMarketKurlyUrl(keyword);
  return getCoupangUrl(keyword);
}

// 재료별 추천 구매처 & 검색어
const INGREDIENT_SHOP = {
  // 육류
  "돼지삼겹살": {query:"돼지 삼겹살 500g", shop:"coupang"},
  "돼지목살": {query:"돼지 목살 500g", shop:"coupang"},
  "돼지앞다리살": {query:"돼지 앞다리살 500g", shop:"coupang"},
  "돼지등심": {query:"돼지 등심 500g", shop:"coupang"},
  "돼지갈비": {query:"돼지 갈비 1kg", shop:"coupang"},
  "소고기불고기용": {query:"소고기 불고기용 500g", shop:"coupang"},
  "소고기양지": {query:"소고기 양지 500g", shop:"coupang"},
  "소안심": {query:"소 안심 스테이크", shop:"coupang"},
  "소갈비": {query:"소 갈비찜용 1kg", shop:"coupang"},
  "닭가슴살": {query:"닭가슴살 1kg", shop:"coupang"},
  "닭다리살": {query:"닭다리살 1kg", shop:"coupang"},
  "토종닭": {query:"토종닭 한마리", shop:"coupang"},
  // 해산물
  "새우": {query:"냉동 새우 500g", shop:"kurly"},
  "연어": {query:"생 연어 필렛", shop:"kurly"},
  "고등어": {query:"고등어 손질", shop:"coupang"},
  "오징어": {query:"오징어 손질", shop:"coupang"},
  "굴": {query:"생굴 500g", shop:"kurly"},
  "홍합": {query:"홍합 1kg", shop:"coupang"},
  "바지락": {query:"바지락 1kg", shop:"coupang"},
  // 채소
  "당근": {query:"당근 1kg", shop:"coupang"},
  "감자": {query:"감자 1kg", shop:"coupang"},
  "양파": {query:"양파 1.5kg", shop:"coupang"},
  "대파": {query:"대파 1단", shop:"coupang"},
  "마늘": {query:"깐마늘 1kg", shop:"coupang"},
  "브로콜리": {query:"브로콜리 1개", shop:"kurly"},
  "아보카도": {query:"아보카도 4개", shop:"kurly"},
  // 유제품
  "버터": {query:"버터 무염 200g", shop:"coupang"},
  "생크림": {query:"생크림 500ml", shop:"coupang"},
  "치즈": {query:"슬라이스 치즈 20장", shop:"coupang"},
  "모짜렐라": {query:"모짜렐라 치즈 200g", shop:"kurly"},
  // 양념
  "올리브오일": {query:"올리브오일 500ml", shop:"coupang"},
  "사프란": {query:"사프란 스페인산", shop:"coupang"},
  "코코넛밀크": {query:"코코넛밀크 400ml", shop:"coupang"},
};

function getIngredientShopUrl(ingName){
  // 정확한 매칭
  if(INGREDIENT_SHOP[ingName]){
    const s=INGREDIENT_SHOP[ingName];
    return {url:getShoppingUrl(s.query,s.shop), query:s.query};
  }
  // 부분 매칭
  for(const[k,v]of Object.entries(INGREDIENT_SHOP)){
    if(ingName.includes(k)||k.includes(ingName)){
      return {url:getShoppingUrl(v.query,v.shop), query:v.query};
    }
  }
  // 기본: 쿠팡 검색
  return {url:getCoupangUrl(ingName), query:ingName};
}

// ── 영양 DB (100g당 기준) ──
const NUTRITION_DB = {
  // 육류
  "돼지삼겹살":  {cal:331, pro:17, fat:29, carb:0},
  "돼지목살":    {cal:263, pro:17, fat:22, carb:0},
  "돼지앞다리살":{cal:183, pro:20, fat:11, carb:0},
  "돼지등심":    {cal:155, pro:22, fat:7,  carb:0},
  "돼지갈비":    {cal:280, pro:18, fat:23, carb:0},
  "돼지안심":    {cal:143, pro:22, fat:6,  carb:0},
  "돼지다짐육":  {cal:218, pro:18, fat:16, carb:0},
  "소고기불고기용":{cal:200, pro:20, fat:13, carb:0},
  "소고기양지":  {cal:218, pro:18, fat:16, carb:0},
  "소안심":      {cal:140, pro:22, fat:5,  carb:0},
  "소등심":      {cal:247, pro:18, fat:19, carb:0},
  "소갈비":      {cal:280, pro:16, fat:24, carb:0},
  "소고기다짐육":{cal:215, pro:19, fat:15, carb:0},
  "닭가슴살":    {cal:109, pro:23, fat:1,  carb:0},
  "닭다리살":    {cal:175, pro:18, fat:11, carb:0},
  "닭다리":      {cal:160, pro:17, fat:10, carb:0},
  "토종닭":      {cal:158, pro:18, fat:9,  carb:0},
  "오리":        {cal:201, pro:19, fat:13, carb:0},
  "양고기":      {cal:234, pro:17, fat:18, carb:0},
  "베이컨":      {cal:541, pro:13, fat:54, carb:0},
  "햄":          {cal:145, pro:13, fat:10, carb:1},
  "소시지":      {cal:301, pro:11, fat:27, carb:3},
  "스팸":        {cal:271, pro:12, fat:24, carb:3},
  // 해산물
  "연어":        {cal:208, pro:20, fat:13, carb:0},
  "참치":        {cal:144, pro:23, fat:5,  carb:0},
  "고등어":      {cal:202, pro:18, fat:14, carb:0},
  "갈치":        {cal:133, pro:18, fat:6,  carb:0},
  "대구":        {cal:82,  pro:18, fat:1,  carb:0},
  "명태":        {cal:82,  pro:18, fat:1,  carb:0},
  "낙지":        {cal:73,  pro:15, fat:1,  carb:1},
  "굴":          {cal:69,  pro:8,  fat:2,  carb:4},
  "꽃게":        {cal:72,  pro:14, fat:1,  carb:1},
  // 두부/계란/유제품
  "순두부":      {cal:36,  pro:4,  fat:2,  carb:1},
  "계란":        {cal:155, pro:13, fat:11, carb:1, unit:"개", perUnit:50},
  "달걀":        {cal:155, pro:13, fat:11, carb:1, unit:"개", perUnit:50},
  "치즈":        {cal:350, pro:25, fat:27, carb:2},
  // 채소
  "단호박":      {cal:49,  pro:2,  fat:0,  carb:12},
  // 면/밥/빵
  "우동면":      {cal:105, pro:3,  fat:0,  carb:22},
  "소면":        {cal:127, pro:4,  fat:1,  carb:26},
  // 양념 (소량 사용이라 칼로리 낮게)

  // 헬시 재료
  "곤약쌀":      {cal:10,  pro:0,  fat:0,  carb:3},
  "곤약면":      {cal:10,  pro:0,  fat:0,  carb:3},
  "곤약떡":      {cal:10,  pro:0,  fat:0,  carb:3},
  "두부면":      {cal:30,  pro:4,  fat:1,  carb:1},
  "통밀파스타":  {cal:124, pro:5,  fat:1,  carb:24},
  "현미쌀":      {cal:111, pro:3,  fat:1,  carb:23},
  "귀리":        {cal:389, pro:17, fat:7,  carb:66},
  "그릭요거트":  {cal:59,  pro:10, fat:0,  carb:4},
  "아몬드밀크":  {cal:15,  pro:1,  fat:1,  carb:1},
  "알룰로스":    {cal:4,   pro:0,  fat:0,  carb:1},
  "에리스리톨":  {cal:0,   pro:0,  fat:0,  carb:1},
  "저당마요네즈":{cal:150, pro:1,  fat:16, carb:2},
  "저당간장":    {cal:40,  pro:4,  fat:0,  carb:6},
  "저당고추장":  {cal:120, pro:5,  fat:2,  carb:22},
  "저당굴소스":  {cal:45,  pro:3,  fat:0,  carb:8},
  "히말라야소금":{cal:0,   pro:0,  fat:0,  carb:0},
  "아보카도오일":{cal:884, pro:0,  fat:100,carb:0},
  "치아씨드":    {cal:486, pro:17, fat:31, carb:42},
  "계란흰자":    {cal:52,  pro:11, fat:0,  carb:1},
  "그래놀라저당":{cal:380, pro:9,  fat:16, carb:52},

  // 면류 추가
  "스파게티":    {cal:158, pro:6,  fat:1,  carb:31},
  "파스타":      {cal:158, pro:6,  fat:1,  carb:31},
  "넓은쌀국수":  {cal:109, pro:2,  fat:0,  carb:25},
  "노란쌀국수":  {cal:109, pro:2,  fat:0,  carb:25},
  "탈리아텔레":  {cal:158, pro:6,  fat:1,  carb:31},
  "링귀네":      {cal:158, pro:6,  fat:1,  carb:31},
  "계란면":      {cal:138, pro:5,  fat:2,  carb:26},
  "아르보리오쌀":{cal:130, pro:3,  fat:0,  carb:28},
  "흑미":        {cal:110, pro:3,  fat:1,  carb:23},
  "식빵":        {cal:260, pro:8,  fat:3,  carb:48},
  "파이도우":    {cal:350, pro:5,  fat:20, carb:38},
  "옥수수가루":  {cal:356, pro:9,  fat:4,  carb:73},
  "수수가루":    {cal:340, pro:9,  fat:3,  carb:72},
  // 소스/양념류
  "춘장":        {cal:220, pro:8,  fat:5,  carb:35},
  "케첩":        {cal:100, pro:1,  fat:0,  carb:24},
  "마요네즈":    {cal:680, pro:1,  fat:75, carb:2},
  "토마토소스":  {cal:35,  pro:2,  fat:0,  carb:7},
  "버터":        {cal:717, pro:1,  fat:81, carb:0},
  "생크림":      {cal:340, pro:2,  fat:36, carb:3},
  "우유":        {cal:61,  pro:3,  fat:3,  carb:5},
  "두유":        {cal:54,  pro:4,  fat:2,  carb:5},
  "팜슈거":      {cal:360, pro:0,  fat:0,  carb:93},
  "화자오":      {cal:250, pro:7,  fat:9,  carb:40},
  "레몬즙":      {cal:22,  pro:0,  fat:0,  carb:7},
  "라임즙":      {cal:25,  pro:0,  fat:0,  carb:8},
  "와인":        {cal:83,  pro:0,  fat:0,  carb:3},
  "레드와인":    {cal:83,  pro:0,  fat:0,  carb:3},
  "맛술":        {cal:180, pro:0,  fat:0,  carb:25},
  // 유제품/단백질
  "페코리노치즈":{cal:419, pro:32, fat:32, carb:0},
  "그뤼에르치즈":{cal:413, pro:30, fat:32, carb:0},
  "연유":        {cal:321, pro:8,  fat:9,  carb:54},
  "요거트":      {cal:61,  pro:3,  fat:3,  carb:5},
  "게살":        {cal:84,  pro:18, fat:1,  carb:0},
  "랍스터":      {cal:89,  pro:19, fat:1,  carb:0},
  "전복":        {cal:105, pro:17, fat:1,  carb:7},
  "홍합":        {cal:86,  pro:12, fat:2,  carb:4},
  "조개":        {cal:74,  fat:1,  pro:13, carb:3},
  "바지락":      {cal:74,  pro:13, fat:1,  carb:3},
  "문어":        {cal:82,  pro:15, fat:1,  carb:2},
  "멸치":        {cal:195, pro:42, fat:3,  carb:0},
  "안초비":      {cal:210, pro:29, fat:10, carb:0},
  "팟":          {cal:50,  pro:3,  fat:0,  carb:9},
  // 칼로리 계산 안전 항목: 물/육수류는 부분매칭(물→물엿, 육수→멸치 등) 방지용 exact key
  "육수":        {cal:5,   pro:0,  fat:0,  carb:0},
  "다시마육수":  {cal:5,   pro:0,  fat:0,  carb:0},
  "사골육수":    {cal:30,  pro:2,  fat:1,  carb:0},
  "채수":        {cal:5,   pro:0,  fat:0,  carb:1},
  "비프스톡":    {cal:15,  pro:1,  fat:0,  carb:1},
  "월계수잎":    {cal:0,   pro:0,  fat:0,  carb:0},
  "타마린드페이스트":{cal:239, pro:3, fat:1, carb:60},
  "갈랑갈":      {cal:71,  pro:1,  fat:0,  carb:15},
  // 채소류
  "배추":        {cal:17,  pro:1,  fat:0,  carb:4},
  "고추":        {cal:40,  pro:2,  fat:0,  carb:9},
  "샬롯":        {cal:72,  pro:2,  fat:0,  carb:17},
  "파파야":      {cal:43,  pro:1,  fat:0,  carb:11},
  "양송이버섯":  {cal:22,  pro:3,  fat:0,  carb:3},
  "포르치니버섯":{cal:22,  pro:3,  fat:0,  carb:3},
  "루꼴라":      {cal:25,  pro:3,  fat:1,  carb:4},
  // 견과류/기타
  "피칸":        {cal:691, pro:9,  fat:72, carb:14},
  "율무":        {cal:360, pro:13, fat:2,  carb:72},
  "에다마메":    {cal:122, pro:11, fat:5,  carb:10},
  "연두부":      {cal:55,  pro:5,  fat:3,  carb:2},
  "템페":        {cal:193, pro:19, fat:11, carb:9},
  
  "달걀노른자":  {cal:322, pro:16, fat:27, carb:4},

  // ── 추가: 육류 보완 ──
  "닭고기":      {cal:158, pro:18, fat:9,  carb:0},
  "닭":          {cal:158, pro:18, fat:9,  carb:0},
  "삼겹살":      {cal:331, pro:17, fat:29, carb:0},
  "생선":        {cal:100, pro:18, fat:3,  carb:0},
  "닭발":        {cal:215, pro:20, fat:14, carb:0},
  "닭안심":      {cal:109, pro:23, fat:1,  carb:0},
  "곱창":        {cal:162, pro:15, fat:11, carb:0},
  "장어":        {cal:236, pro:18, fat:18, carb:0},
  "가자미":      {cal:80,  pro:17, fat:1,  carb:0},
  "참치캔":      {cal:128, pro:26, fat:3,  carb:0},
  "염장대구":    {cal:82,  pro:18, fat:1,  carb:0},
  "청어":        {cal:217, pro:20, fat:14, carb:0},
  "메기":        {cal:95,  pro:16, fat:3,  carb:0},
  "가리비":      {cal:88,  pro:17, fat:1,  carb:3},
  // ── 채소 보완 ──
  "무":          {cal:18,  pro:1,  fat:0,  carb:4},
  "무청":        {cal:22,  pro:2,  fat:0,  carb:4},
  "옥수수":      {cal:86,  pro:3,  fat:1,  carb:19},
  "양상추":      {cal:15,  pro:1,  fat:0,  carb:3},
  "셀러리":      {cal:16,  pro:1,  fat:0,  carb:3},
  "청경채":      {cal:13,  pro:2,  fat:0,  carb:2},
  "아스파라거스": {cal:20, pro:2,  fat:0,  carb:4},
  "브로콜리":    {cal:34,  pro:3,  fat:0,  carb:7},
  "콜리플라워":  {cal:25,  pro:2,  fat:0,  carb:5},
  "부추":        {cal:27,  pro:2,  fat:0,  carb:4},
  "청양고추":    {cal:27,  pro:1,  fat:0,  carb:6},
  "봄동":        {cal:16,  pro:2,  fat:0,  carb:3},
  "달래":        {cal:40,  pro:3,  fat:1,  carb:6},
  "냉이":        {cal:36,  pro:4,  fat:1,  carb:5},
  "쑥갓":        {cal:22,  pro:2,  fat:0,  carb:4},
  "완두콩":      {cal:81,  pro:5,  fat:0,  carb:14},
  "파인애플":    {cal:50,  pro:1,  fat:0,  carb:13},
  "망고":        {cal:60,  pro:1,  fat:0,  carb:15},
  "아보카도":    {cal:160, pro:2,  fat:15, carb:9},
  "바나나":      {cal:89,  pro:1,  fat:0,  carb:23},
  "딸기":        {cal:32,  pro:1,  fat:0,  carb:8},
  "블루베리":    {cal:57,  pro:1,  fat:0,  carb:14},
  "사과":        {cal:52,  pro:0,  fat:0,  carb:14},
  "레몬":        {cal:29,  pro:1,  fat:0,  carb:9},
  "라임":        {cal:30,  pro:1,  fat:0,  carb:11},
  "오렌지":      {cal:47,  pro:1,  fat:0,  carb:12},
  "코코넛밀크":  {cal:230, pro:2,  fat:24, carb:6},
  "타마린드":    {cal:239, pro:3,  fat:1,  carb:63},
  "플랜테인":    {cal:122, pro:1,  fat:0,  carb:32},
  // ── 해조류/건어물 ──
  "미역":        {cal:15,  pro:2,  fat:0,  carb:3},
  "김":          {cal:35,  pro:6,  fat:1,  carb:4},
  "다시마":      {cal:43,  pro:2,  fat:0,  carb:9},
  "다시":        {cal:5,   pro:0,  fat:0,  carb:1},
  "매생이":      {cal:11,  pro:2,  fat:0,  carb:1},
  "파래":        {cal:18,  pro:3,  fat:0,  carb:2},
  "해파리":      {cal:11,  pro:2,  fat:0,  carb:0},
  // ── 양념/소스 보완 ──
  "소금":        {cal:0,   pro:0,  fat:0,  carb:0},
  "후추":        {cal:3,   pro:0,  fat:0,  carb:1},
  "깨":          {cal:573, pro:18, fat:50, carb:23},
  "고춧가루":    {cal:282, pro:14, fat:9,  carb:50},
  "커민":        {cal:375, pro:18, fat:22, carb:44},
  "강황":        {cal:312, pro:10, fat:3,  carb:68},
  "고수":        {cal:23,  pro:2,  fat:1,  carb:4},
  "파프리카파우더":{cal:282,pro:14, fat:13, carb:54},
  "오레가노":    {cal:265, pro:11, fat:4,  carb:69},
  "타임":        {cal:101, pro:6,  fat:2,  carb:24},
  "로즈마리":    {cal:131, pro:3,  fat:5,  carb:21},
  "계피":        {cal:247, pro:4,  fat:1,  carb:81},
  "팔각":        {cal:337, pro:18, fat:16, carb:50},
  "딜":          {cal:43,  pro:4,  fat:1,  carb:7},
  "민트잎":      {cal:70,  pro:4,  fat:1,  carb:15},
  "가람마살라":  {cal:379, pro:14, fat:15, carb:51},
  "카레가루":    {cal:379, pro:14, fat:15, carb:51},
  "라스엘하누트":{cal:340, pro:12, fat:14, carb:48},
  "올스파이스":  {cal:263, pro:6,  fat:9,  carb:72},
  "자타르":      {cal:280, pro:10, fat:12, carb:40},
  "하리사":      {cal:170, pro:5,  fat:10, carb:18},
  "와사비":      {cal:109, pro:5,  fat:1,  carb:24},
  "머스터드":    {cal:66,  pro:4,  fat:4,  carb:6},
  "물엿":        {cal:320, pro:0,  fat:0,  carb:80},
  "꿀":          {cal:304, pro:0,  fat:0,  carb:82},
  "이스트":      {cal:105, pro:14, fat:2,  carb:18},
  "육두구":      {cal:525, pro:6,  fat:36, carb:49},
  "오향파우더":  {cal:340, pro:12, fat:10, carb:55},
  "수마크":      {cal:239, pro:5,  fat:1,  carb:72},
  "카다멈":      {cal:311, pro:11, fat:7,  carb:68},
  "국간장":      {cal:35,  pro:4,  fat:0,  carb:5},
  "미소된장":    {cal:200, pro:12, fat:6,  carb:27},
  "아히페이스트":{cal:250, pro:5,  fat:15, carb:25},
  "고추기름":    {cal:884, pro:0,  fat:100,carb:0},
  "케찹마니스":  {cal:260, pro:3,  fat:0,  carb:64},
  "피시소스":    {cal:35,  pro:5,  fat:0,  carb:4},
  "굴소스":      {cal:51,  pro:1,  fat:0,  carb:11},
  "삼발소스":    {cal:95,  pro:2,  fat:6,  carb:10},
  "타히니":      {cal:595, pro:17, fat:54, carb:21},
  "마라소스":    {cal:150, pro:3,  fat:12, carb:8},
  "들깨가루":    {cal:500, pro:16, fat:39, carb:33},
  "쌈장":        {cal:180, pro:10, fat:6,  carb:23},
  "살사소스":    {cal:36,  pro:1,  fat:0,  carb:8},
  // ── 유제품/기타 보완 ──
  "페타치즈":    {cal:264, pro:14, fat:21, carb:4},
  "리코타치즈":  {cal:174, pro:11, fat:13, carb:3},
  "크림치즈":    {cal:342, pro:6,  fat:34, carb:4},
  "마스카르포네": {cal:400,pro:5,  fat:42, carb:3},
  "모짜렐라":    {cal:280, pro:18, fat:22, carb:2},
  "파마산치즈":  {cal:431, pro:38, fat:29, carb:4},
  "사워크림":    {cal:193, pro:3,  fat:19, carb:4},
  "잣":          {cal:673, pro:14, fat:68, carb:13},
  "아몬드":      {cal:579, pro:21, fat:50, carb:22},
  "호두":        {cal:654, pro:15, fat:65, carb:14},
  "캐슈넛":      {cal:553, pro:18, fat:44, carb:30},
  "땅콩":        {cal:567, pro:26, fat:49, carb:16},
  "건포도":      {cal:299, pro:3,  fat:0,  carb:79},
  "그래놀라":    {cal:440, pro:10, fat:16, carb:68},
  "쿠스쿠스":    {cal:376, pro:13, fat:1,  carb:78},
  "카사바가루":  {cal:330, pro:1,  fat:1,  carb:80},
  "타피오카가루":{cal:358, pro:0,  fat:0,  carb:89},
  "빵":          {cal:265, pro:9,  fat:3,  carb:49},
  "베이글":      {cal:270, pro:10, fat:2,  carb:53},
  "바게트":      {cal:280, pro:9,  fat:2,  carb:57},
  "또띠아":      {cal:218, pro:6,  fat:5,  carb:38},
  "라이스페이퍼": {cal:87, pro:2,  fat:0,  carb:20},
  "완탕피":      {cal:280, pro:9,  fat:2,  carb:55},
  "만두피":      {cal:280, pro:9,  fat:2,  carb:55},
  "피타빵":      {cal:275, pro:9,  fat:1,  carb:56},
  "앤초비":      {cal:131, pro:20, fat:5,  carb:0},
  "케이퍼":      {cal:23,  pro:2,  fat:1,  carb:5},
  "올리브":      {cal:115, pro:1,  fat:11, carb:6},
  "김치":        {cal:19,  pro:2,  fat:0,  carb:3},
  "새우페이스트":{cal:80,  pro:10, fat:1,  carb:8},
  "팜슈가":      {cal:390, pro:0,  fat:0,  carb:98},
  "팜오일":      {cal:884, pro:0,  fat:100,carb:0},
  "발사믹":      {cal:88,  pro:0,  fat:0,  carb:17},
  "카피르라임잎":{cal:10,  pro:0,  fat:0,  carb:2},
  "레몬그라스":  {cal:99,  pro:2,  fat:1,  carb:25},
  "불구르":      {cal:342, pro:12, fat:1,  carb:76},
  "보리":        {cal:354, pro:12, fat:2,  carb:73},
  "병아리콩":    {cal:364, pro:19, fat:6,  carb:61},
  "렌틸콩":      {cal:352, pro:24, fat:1,  carb:63},
  "녹두":        {cal:347, pro:24, fat:1,  carb:63},
  "흰강낭콩":    {cal:333, pro:21, fat:1,  carb:61},
  "강낭콩":      {cal:333, pro:21, fat:1,  carb:61},
  "팥":          {cal:339, pro:20, fat:1,  carb:63},
  "쌀":          {cal:359, pro:7,  fat:1,  carb:79},
  "중면":        {cal:137, pro:5,  fat:1,  carb:28},
  "우동":        {cal:130, pro:4,  fat:0,  carb:27},
  "라면":        {cal:460, pro:10, fat:19, carb:63},
  "리가토니":    {cal:357, pro:12, fat:2,  carb:71},
  "펜네":        {cal:357, pro:12, fat:2,  carb:71},
  "마카로니":    {cal:357, pro:12, fat:2,  carb:71},
  "냉면":        {cal:345, pro:7,  fat:1,  carb:76},
  "당면":        {cal:349, pro:0,  fat:0,  carb:87},
  "쌀국수":      {cal:109, pro:2,  fat:0,  carb:25},
  "메밀면":      {cal:337, pro:13, fat:3,  carb:71},
  "오징어채":    {cal:312, pro:66, fat:3,  carb:4},
  "진미채":      {cal:312, pro:66, fat:3,  carb:4},
  "어묵":        {cal:95,  pro:8,  fat:3,  carb:10},
  "BBQ소스":     {cal:172, pro:2,  fat:1,  carb:43},
  "화이트와인":  {cal:82,  pro:0,  fat:0,  carb:3},
  "사프란":      {cal:310, pro:11, fat:6,  carb:65},
  "크림드 레귐": {cal:50,  pro:1,  fat:3,  carb:5},

  // ── 추가 2차: 기타 누락 재료 ──
  "사우어크라우트": {cal:19,  pro:1,  fat:0,  carb:4},
  "고수분말":    {cal:298, pro:12, fat:17, carb:55},
  "초리소":      {cal:455, pro:24, fat:38, carb:3},
  "고사리":      {cal:34,  pro:5,  fat:0,  carb:6},
  "참깨":        {cal:573, pro:18, fat:50, carb:23},
  "로메인":      {cal:17,  pro:1,  fat:0,  carb:3},
  "파니르":      {cal:265, pro:18, fat:20, carb:3},
  "황태":        {cal:325, pro:77, fat:3,  carb:0},
  "북어":        {cal:325, pro:77, fat:3,  carb:0},
  "민트":        {cal:70,  pro:4,  fat:1,  carb:15},
  "허브":        {cal:50,  pro:3,  fat:1,  carb:8},
  "떡":          {cal:220, pro:4,  fat:1,  carb:48},
  "액젓":        {cal:35,  pro:5,  fat:0,  carb:4},
  "레드커리페이스트":{cal:150,pro:5,  fat:10, carb:12},
  "그린커리페이스트":{cal:150,pro:5,  fat:10, carb:12},
  "피클":        {cal:11,  pro:0,  fat:0,  carb:3},
  "겨자":        {cal:66,  pro:4,  fat:4,  carb:6},
  "죽순":        {cal:27,  pro:3,  fat:0,  carb:5},
  "오리고기":    {cal:201, pro:19, fat:13, carb:0},
  "미나리":      {cal:20,  pro:2,  fat:0,  carb:3},
  "오크라":      {cal:33,  pro:2,  fat:0,  carb:7},
  "우거지":      {cal:22,  pro:2,  fat:0,  carb:4},
  "칼국수면":    {cal:137, pro:5,  fat:1,  carb:28},
  "목이버섯":    {cal:25,  pro:2,  fat:0,  carb:5},
  "건고추":      {cal:282, pro:14, fat:9,  carb:50},
  "도라지":      {cal:70,  pro:3,  fat:0,  carb:16},
  "땅콩버터":    {cal:588, pro:25, fat:50, carb:20},
  "새우젓":      {cal:85,  pro:12, fat:2,  carb:4},
  "배":          {cal:57,  pro:0,  fat:0,  carb:15},
  "호박씨":      {cal:559, pro:30, fat:49, carb:11},
  "돼지등뼈":    {cal:280, pro:18, fat:23, carb:0},
  "곤약":        {cal:10,  pro:0,  fat:0,  carb:3},
  "쌀가루":      {cal:366, pro:6,  fat:1,  carb:80},
  "밀":          {cal:340, pro:13, fat:2,  carb:72},
  "고구마줄기":  {cal:30,  pro:2,  fat:0,  carb:6},
  "연근":        {cal:74,  pro:3,  fat:0,  carb:17},
  "우엉":        {cal:72,  pro:2,  fat:0,  carb:17},
  "쑥":          {cal:36,  pro:4,  fat:1,  carb:5},
  "고구마":      {cal:86,  pro:2,  fat:0,  carb:20},
  "미더덕":      {cal:52,  pro:6,  fat:1,  carb:5},
  "찹쌀":        {cal:360, pro:7,  fat:1,  carb:80},
  "현미":        {cal:350, pro:7,  fat:3,  carb:73},
  "밀가루":      {cal:364, pro:10, fat:1,  carb:76},
  "전분":        {cal:342, pro:0,  fat:0,  carb:84},
  "빵가루":      {cal:395, pro:13, fat:5,  carb:75},
  "지짐가루":    {cal:340, pro:10, fat:1,  carb:73},
  "깍두기":      {cal:30,  pro:1,  fat:0,  carb:6},
  "김치국물":    {cal:10,  pro:1,  fat:0,  carb:2},
  "스리라차":    {cal:93,  pro:1,  fat:1,  carb:22},
  "홀스래디시":  {cal:48,  pro:2,  fat:0,  carb:11},
  "방울토마토":  {cal:18,  pro:1,  fat:0,  carb:4},
  "콩":          {cal:347, pro:34, fat:18, carb:30},
  "비트":        {cal:43,  pro:2,  fat:0,  carb:10},
  "얌":          {cal:118, pro:2,  fat:0,  carb:28},
  "카사바":      {cal:160, pro:1,  fat:0,  carb:38},
  "오트밀":      {cal:389, pro:17, fat:7,  carb:66},
  "리크":        {cal:61,  pro:2,  fat:0,  carb:14},
  "루콜라":      {cal:25,  pro:3,  fat:1,  carb:4},
  "아루굴라":    {cal:25,  pro:3,  fat:1,  carb:4},
  "엔다이브":    {cal:17,  pro:1,  fat:0,  carb:3},
  "타피오카":    {cal:358, pro:0,  fat:0,  carb:89},
  "피망":        {cal:20,  pro:1,  fat:0,  carb:5},
  "새우미":      {cal:85,  pro:18, fat:1,  carb:1},
  "돼지창자":    {cal:162, pro:15, fat:11, carb:0},
  "홍어":        {cal:80,  pro:17, fat:1,  carb:0},
  "미역줄기":    {cal:15,  pro:2,  fat:0,  carb:3},
  "솔비":        {cal:320, pro:1,  fat:0,  carb:81},
  "아몬드슬라이스":{cal:579,pro:21, fat:50, carb:22},
  "건자두":      {cal:240, pro:2,  fat:0,  carb:64},
  "아티초크":    {cal:47,  pro:3,  fat:0,  carb:11},
  "케일":        {cal:49,  pro:4,  fat:1,  carb:9},
  "파슬리":      {cal:36,  pro:3,  fat:1,  carb:6},
  "바질":        {cal:23,  pro:3,  fat:1,  carb:3},
  "세이지":      {cal:315, pro:11, fat:13, carb:61},
  "타라곤":      {cal:295, pro:23, fat:7,  carb:50},
  "라벤더":      {cal:49,  pro:2,  fat:1,  carb:10},
  "물":          {cal:0,   pro:0,  fat:0,  carb:0},
  "얼음":        {cal:0,   pro:0,  fat:0,  carb:0},
  "올리브오일":  {cal:884, pro:0,  fat:100,carb:0},
  "코코넛오일":  {cal:892, pro:0,  fat:100,carb:0},
  "참기름":      {cal:884, pro:0,  fat:100,carb:0},

  // ── 추가 3차: 남은 재료 ──
  "인삼":        {cal:60,  pro:2,  fat:0,  carb:14},
  "유부":        {cal:386, pro:18, fat:35, carb:2},
  "우스터소스":  {cal:78,  pro:1,  fat:0,  carb:19},
  "폰즈소스":    {cal:20,  pro:2,  fat:0,  carb:3},
  "명란":        {cal:143, pro:25, fat:4,  carb:2},
  "가쓰오부시":  {cal:350, pro:77, fat:3,  carb:0},
  "공심채":      {cal:19,  pro:2,  fat:0,  carb:3},
  "포도잎":      {cal:93,  pro:5,  fat:2,  carb:17},
  "마른새우":    {cal:306, pro:62, fat:4,  carb:0},
  "꽁치":        {cal:204, pro:18, fat:14, carb:0},
  "도토리묵":    {cal:56,  pro:1,  fat:0,  carb:13},
  "열무":        {cal:18,  pro:2,  fat:0,  carb:3},
  "실파":        {cal:27,  pro:2,  fat:0,  carb:4},
  "유자":        {cal:38,  pro:1,  fat:0,  carb:10},
  "시래기":      {cal:22,  pro:2,  fat:0,  carb:4},
  "블랙빈":      {cal:341, pro:22, fat:1,  carb:63},
  "하몽":        {cal:145, pro:30, fat:3,  carb:0},
  "무말랭이":    {cal:285, pro:10, fat:1,  carb:67},
  "바닐라":      {cal:288, pro:0,  fat:0,  carb:13},
  "청국장":      {cal:173, pro:16, fat:8,  carb:12},
  "파슬리줄기":  {cal:36,  pro:3,  fat:1,  carb:6},
  "홍차":        {cal:2,   pro:0,  fat:0,  carb:1},
  "정향":        {cal:274, pro:6,  fat:13, carb:66},
  "체다치즈":    {cal:402, pro:25, fat:33, carb:2},
  "카망베르":    {cal:300, pro:20, fat:24, carb:1},
  "고르곤졸라":  {cal:353, pro:21, fat:29, carb:2},
  "흑임자":      {cal:573, pro:18, fat:50, carb:23},
  "오징어먹물":  {cal:25,  pro:4,  fat:1,  carb:1},
  "코냑":        {cal:241, pro:0,  fat:0,  carb:0},
  "럼":          {cal:231, pro:0,  fat:0,  carb:0},
  "발효버터":    {cal:717, pro:1,  fat:81, carb:1},
  "석류":        {cal:83,  pro:2,  fat:1,  carb:19},
  "연어알":      {cal:250, pro:30, fat:14, carb:1},
  "성게알":      {cal:172, pro:16, fat:9,  carb:9},
  "대게":        {cal:84,  pro:17, fat:1,  carb:0},
  "킹크랩":      {cal:84,  pro:19, fat:1,  carb:0},
  "피조개":      {cal:55,  pro:9,  fat:1,  carb:3},
  "꼬막":        {cal:55,  pro:9,  fat:1,  carb:3},
  "새우살":      {cal:85,  pro:18, fat:1,  carb:1},
  "관자":        {cal:88,  pro:17, fat:1,  carb:3},
  "문어다리":    {cal:82,  pro:15, fat:1,  carb:2},
  "황태채":      {cal:325, pro:77, fat:3,  carb:0},
  "조기":        {cal:90,  pro:18, fat:2,  carb:0},
  "홍합살":      {cal:86,  pro:12, fat:2,  carb:4},
  "오리훈제":    {cal:250, pro:19, fat:18, carb:1},
  "닭볶음탕":    {cal:158, pro:18, fat:9,  carb:0},
  "닭날개":      {cal:203, pro:19, fat:14, carb:0},
  "고수잎":      {cal:23,  pro:2,  fat:1,  carb:4},
  "라임잎":      {cal:10,  pro:0,  fat:0,  carb:2},
  "생강":        {cal:80,  pro:2,  fat:1,  carb:18},
  "마늘":        {cal:149, pro:6,  fat:1,  carb:33},
  "양파":        {cal:40,  pro:1,  fat:0,  carb:9},
  "대파":        {cal:27,  pro:2,  fat:0,  carb:5},
  "쪽파":        {cal:27,  pro:2,  fat:0,  carb:5},
  "토마토":      {cal:18,  pro:1,  fat:0,  carb:4},
  "감자":        {cal:77,  pro:2,  fat:0,  carb:17},
  "당근":        {cal:41,  pro:1,  fat:0,  carb:10},
  "양배추":      {cal:25,  pro:1,  fat:0,  carb:6},
  "시금치":      {cal:23,  pro:3,  fat:0,  carb:4},
  "버섯":        {cal:22,  pro:3,  fat:0,  carb:3},
  "표고버섯":    {cal:34,  pro:2,  fat:0,  carb:7},
  "팽이버섯":    {cal:37,  pro:3,  fat:0,  carb:7},
  "느타리버섯":  {cal:33,  pro:3,  fat:0,  carb:6},
  "숙주":        {cal:30,  pro:3,  fat:0,  carb:6},
  "콩나물":      {cal:30,  pro:3,  fat:0,  carb:6},
  "오이":        {cal:16,  pro:1,  fat:0,  carb:4},
  "상추":        {cal:14,  pro:1,  fat:0,  carb:2},
  "깻잎":        {cal:37,  pro:4,  fat:1,  carb:6},
  "애호박":      {cal:18,  pro:1,  fat:0,  carb:4},
  "가지":        {cal:25,  pro:1,  fat:0,  carb:6},
  "돼지고기":    {cal:218, pro:18, fat:16, carb:0},
  "소고기":      {cal:212, pro:20, fat:14, carb:0},
  "간장":        {cal:60,  pro:6,  fat:0,  carb:8},
  "설탕":        {cal:387, pro:0,  fat:0,  carb:100},
  "식초":        {cal:20,  pro:0,  fat:0,  carb:1},
  "된장":        {cal:186, pro:12, fat:5,  carb:25},
  "고추장":      {cal:211, pro:7,  fat:4,  carb:40},
  "두반장":      {cal:86,  pro:5,  fat:3,  carb:11},
  "미림":        {cal:257, pro:0,  fat:0,  carb:43},
  "청주":        {cal:159, pro:0,  fat:0,  carb:5},
  "치킨스톡":    {cal:8,   pro:0,  fat:0,  carb:1},
  "멸치육수":    {cal:5,   pro:1,  fat:0,  carb:0},
  "판단잎":      {cal:30,  pro:1,  fat:0,  carb:7},
  "들기름":      {cal:884, pro:0,  fat:100,carb:0},
  "식용유":      {cal:884, pro:0,  fat:100,carb:0},
  "파프리카":    {cal:31,  pro:1,  fat:0,  carb:6},
  "새우":        {cal:85,  pro:18, fat:1,  carb:1},
  "오징어":      {cal:88,  pro:18, fat:1,  carb:2},
  "두부":        {cal:76,  pro:8,  fat:4,  carb:2},
  

  // ── unit/perUnit 복원 (개수 단위 재료) ──
  "감자":         {cal:77,  pro:2,  fat:0,  carb:17, unit:"개", perUnit:150},
  "고구마":       {cal:86,  pro:2,  fat:0,  carb:20, unit:"개", perUnit:150},
  "당근":         {cal:41,  pro:1,  fat:0,  carb:10, unit:"개", perUnit:100},
  "양파":         {cal:40,  pro:1,  fat:0,  carb:9,  unit:"개", perUnit:150},
  "토마토":       {cal:18,  pro:1,  fat:0,  carb:4,  unit:"개", perUnit:150},
  "감자(개)":     {cal:77,  pro:2,  fat:0,  carb:17, unit:"개", perUnit:150},

  // ── 누락 고기 부위 ──
  "소꼬리":       {cal:255, pro:20, fat:19, carb:0},
  "항정살":       {cal:331, pro:17, fat:29, carb:0},
  "대패삼겹":     {cal:331, pro:17, fat:29, carb:0},
  "돼지앞발":     {cal:183, pro:20, fat:11, carb:0},
  "뼈없는닭":     {cal:165, pro:25, fat:7,  carb:0},
  "닭봉":         {cal:175, pro:18, fat:11, carb:0},
  "닭뼈":         {cal:100, pro:15, fat:5,  carb:0},
  "닭목살":       {cal:175, pro:18, fat:11, carb:0},
  "돼지뒷다리":   {cal:183, pro:20, fat:11, carb:0},
  "소갈비":       {cal:280, pro:16, fat:24, carb:0},
  "소꼬리":       {cal:255, pro:20, fat:19, carb:0},
  "소등심":       {cal:247, pro:18, fat:19, carb:0},
  "소사태":       {cal:135, pro:21, fat:5,  carb:0},
  "소양지":       {cal:218, pro:18, fat:16, carb:0},
  "LA갈비":       {cal:280, pro:16, fat:24, carb:0},
  "차돌박이":     {cal:247, pro:18, fat:19, carb:0},
  "육회용소고기": {cal:140, pro:22, fat:5,  carb:0},
  "오겹살":       {cal:331, pro:17, fat:29, carb:0},
  "목삼겹":       {cal:263, pro:17, fat:22, carb:0},
  "제육용돼지":   {cal:183, pro:20, fat:11, carb:0},
  "돼지방삼겹":   {cal:331, pro:17, fat:29, carb:0},
  "소혀":         {cal:224, pro:17, fat:17, carb:0},
  "양고기갈비":   {cal:234, pro:17, fat:18, carb:0},
  "염소고기":     {cal:143, pro:27, fat:3,  carb:0},
  "오리가슴살":   {cal:140, pro:23, fat:5,  carb:0},
  "훈제오리":     {cal:250, pro:19, fat:18, carb:0},
  "통닭":         {cal:158, pro:18, fat:9,  carb:0},
  "닭정육":       {cal:158, pro:18, fat:9,  carb:0},
  // ── 누락 해산물 ──
  "쭈꾸미":       {cal:73,  pro:15, fat:1,  carb:1},
  "대구살":       {cal:82,  pro:18, fat:1,  carb:0},
  "황돔":         {cal:85,  pro:18, fat:1,  carb:0},
  "조기살":       {cal:90,  pro:18, fat:2,  carb:0},
  "바닷가재":     {cal:89,  pro:19, fat:1,  carb:1},
  "코다리":       {cal:82,  pro:18, fat:1,  carb:0},
  "웅어":         {cal:88,  pro:18, fat:1,  carb:0},
  "생대구":       {cal:82,  pro:18, fat:1,  carb:0},
  // ── STD_ING 의존 문제 해결: 대량 사용 재료 ──
  "돼지등뼈":     {cal:260, pro:17, fat:21, carb:0},
  "사골":         {cal:58,  pro:4,  fat:4,  carb:0},
  "꼬리":         {cal:255, pro:20, fat:19, carb:0},
  "갈비":         {cal:280, pro:16, fat:24, carb:0},
  "돼지갈비":     {cal:280, pro:18, fat:23, carb:0},
  "소갈비살":     {cal:280, pro:16, fat:24, carb:0},
  "돼지갈비살":   {cal:280, pro:18, fat:23, carb:0},
  "순대":         {cal:158, pro:7,  fat:8,  carb:18},
  "혈소":         {cal:85,  pro:12, fat:3,  carb:4},
  // ── 국물/스톡 ──
  "닭육수":       {cal:8,   pro:1,  fat:0,  carb:1},
  "소고기육수":   {cal:8,   pro:1,  fat:0,  carb:1},
  "치킨브로스":   {cal:8,   pro:1,  fat:0,  carb:1},
  "비프브로스":   {cal:8,   pro:1,  fat:0,  carb:1},
  "육수":         {cal:8,   pro:1,  fat:0,  carb:1},
  "물":           {cal:0,   pro:0,  fat:0,  carb:0},
  "다시마물":     {cal:5,   pro:0,  fat:0,  carb:1},
  "멸치다시":     {cal:5,   pro:1,  fat:0,  carb:0},
  // ── 기타 누락 ──
  "대마늘":       {cal:149, pro:6,  fat:1,  carb:33},
  "참나물":       {cal:27,  pro:3,  fat:0,  carb:4},
  "취나물":       {cal:31,  pro:3,  fat:0,  carb:5},
  "곤드레":       {cal:34,  pro:3,  fat:0,  carb:6},
  "수리취":       {cal:34,  pro:3,  fat:0,  carb:6},
  "머위":         {cal:14,  pro:1,  fat:0,  carb:2},
  "고구마줄기":   {cal:30,  pro:2,  fat:0,  carb:6},
  "두릅":         {cal:40,  pro:4,  fat:0,  carb:7},
  "참취":         {cal:27,  pro:3,  fat:0,  carb:4},
  "비름":         {cal:26,  pro:3,  fat:0,  carb:4},
  "씀바귀":       {cal:25,  pro:2,  fat:0,  carb:4},
  "냉이":         {cal:36,  pro:4,  fat:1,  carb:5},
  "봄동":         {cal:16,  pro:2,  fat:0,  carb:3},
  "얼갈이배추":   {cal:16,  pro:2,  fat:0,  carb:3},
  "열무":         {cal:18,  pro:2,  fat:0,  carb:3},
  "쑥":           {cal:36,  pro:4,  fat:1,  carb:5},
  "파드득":       {cal:22,  pro:2,  fat:0,  carb:4},
  "도토리묵":     {cal:56,  pro:1,  fat:0,  carb:13},
  "메밀묵":       {cal:55,  pro:2,  fat:0,  carb:12},
  "청포묵":       {cal:44,  pro:1,  fat:0,  carb:11},
  "인절미":       {cal:220, pro:4,  fat:1,  carb:48},
  "가래떡":       {cal:220, pro:4,  fat:1,  carb:48},
  "송편":         {cal:200, pro:3,  fat:1,  carb:44},
  "유자청":       {cal:100, pro:0,  fat:0,  carb:25},
  "매실청":       {cal:95,  pro:0,  fat:0,  carb:24},
  "막걸리":       {cal:59,  pro:2,  fat:0,  carb:9},
  "소주":         {cal:167, pro:0,  fat:0,  carb:0},
  "맥주":         {cal:43,  pro:0,  fat:0,  carb:4},
  "와인":         {cal:85,  pro:0,  fat:0,  carb:3},
  "청주":         {cal:159, pro:0,  fat:0,  carb:5},
  "미원":         {cal:0,   pro:0,  fat:0,  carb:0},
  "다시다":       {cal:5,   pro:0,  fat:0,  carb:1},
  "치킨파우더":   {cal:5,   pro:0,  fat:0,  carb:1},
  "버터밀크":     {cal:40,  pro:3,  fat:1,  carb:5},
  "요거트드레싱": {cal:80,  pro:3,  fat:5,  carb:7},
  "크림소스":     {cal:190, pro:3,  fat:19, carb:5},
  "바베큐소스":   {cal:172, pro:2,  fat:1,  carb:43},
  "데리야키소스": {cal:90,  pro:3,  fat:1,  carb:18},
  "굴소스":       {cal:51,  pro:1,  fat:0,  carb:11},
  "치폴레":       {cal:120, pro:3,  fat:6,  carb:15},
  "아도보소스":   {cal:80,  pro:2,  fat:4,  carb:10},
  "레드와인":     {cal:85,  pro:0,  fat:0,  carb:3},
  "사케":         {cal:134, pro:0,  fat:0,  carb:5},
  "미소":         {cal:200, pro:12, fat:6,  carb:27},
  "된장국물":     {cal:30,  pro:2,  fat:1,  carb:4},
  "고추기름":     {cal:884, pro:0,  fat:100,carb:0},
  "라드":         {cal:902, pro:0,  fat:100,carb:0},

  // ── 유럽 요리 재료 ──
  "레드와인":      {cal:85,  pro:0,  fat:0,  carb:3},
  "화이트와인":    {cal:82,  pro:0,  fat:0,  carb:3},
  "비프스톡":      {cal:8,   pro:1,  fat:0,  carb:1},
  "크레임프레쉬":  {cal:292, pro:3,  fat:30, carb:4},
  "허브부케":      {cal:5,   pro:0,  fat:0,  carb:1},
  "파프리카":      {cal:20,  pro:1,  fat:0,  carb:5},
  "송아지고기":    {cal:172, pro:26, fat:7,  carb:0},
  "햄호크":        {cal:280, pro:18, fat:23, carb:0},
  "판체타":        {cal:541, pro:13, fat:54, carb:0},
  "프로슈토":      {cal:145, pro:30, fat:3,  carb:0},
  "소시송":        {cal:301, pro:11, fat:27, carb:3},
  "살라미":        {cal:456, pro:22, fat:41, carb:2},
  "그뤼에르치즈":  {cal:413, pro:29, fat:32, carb:1},
  "에멘탈치즈":    {cal:380, pro:29, fat:29, carb:2},
  "브리치즈":      {cal:334, pro:21, fat:28, carb:1},
  "고르곤졸라":    {cal:353, pro:21, fat:29, carb:2},
  "디종머스터드":  {cal:66,  pro:4,  fat:4,  carb:6},
  "우스터소스":    {cal:78,  pro:1,  fat:0,  carb:19},
  "앤초비페이스트":{cal:131, pro:20, fat:5,  carb:0},
  "토마토페이스트":{cal:82,  pro:4,  fat:0,  carb:19},
  "그린올리브":    {cal:145, pro:1,  fat:15, carb:4},
  "블랙올리브":    {cal:115, pro:1,  fat:11, carb:6},
  "케이퍼":        {cal:23,  pro:2,  fat:1,  carb:5},
  "허브드프로방스":{cal:150, pro:5,  fat:5,  carb:25},
  "타라곤":        {cal:295, pro:23, fat:7,  carb:50},
  "처빌":          {cal:237, pro:26, fat:4,  carb:35},
  "에스트라곤":    {cal:295, pro:23, fat:7,  carb:50},
  "펜넬":          {cal:31,  pro:1,  fat:0,  carb:7},
  "파스닙":        {cal:75,  pro:1,  fat:0,  carb:18},
  "순무":          {cal:28,  pro:1,  fat:0,  carb:6},
  "스왓 리크":     {cal:61,  pro:2,  fat:0,  carb:14},
  "비트":          {cal:43,  pro:2,  fat:0,  carb:10},
  "흑후추":        {cal:251, pro:10, fat:3,  carb:64},
  "월계수잎":      {cal:313, pro:8,  fat:8,  carb:75},

  "오리기름":     {cal:882, pro:0,  fat:100,carb:0},
  "돼지족발":     {cal:214, pro:17, fat:16, carb:0},
  "백후추":       {cal:296, pro:10, fat:3,  carb:64},
  "케찹":         {cal:100, pro:2,  fat:0,  carb:26},
  "초콜릿":       {cal:546, pro:5,  fat:31, carb:60},
  "카카오파우더": {cal:228, pro:20, fat:14, carb:55},
  "오리기름":     {cal:882, pro:0,  fat:100,carb:0},
  "생선소스":     {cal:35,  pro:5,  fat:0,  carb:4},
  "스리라차소스": {cal:93,  pro:1,  fat:1,  carb:22},
  "핫소스":       {cal:32,  pro:1,  fat:0,  carb:7},

  "동치미":       {cal:10,  pro:0,  fat:0,  carb:2},
  "소고기육수":   {cal:8,   pro:1,  fat:0,  carb:1},
  "파래":         {cal:18,  pro:3,  fat:0,  carb:2},

  // ── 식포일러 재료 ──
  "망고처트니":   {cal:230, pro:1,  fat:0,  carb:57},
  "고형카레":     {cal:463, pro:9,  fat:28, carb:48},
  "통삼겹":       {cal:331, pro:17, fat:29, carb:0},
  "참치회":       {cal:144, pro:23, fat:5,  carb:0},
  "참치살":       {cal:144, pro:23, fat:5,  carb:0},
  "참치포":       {cal:180, pro:26, fat:8,  carb:0},
  "오이소박이":   {cal:17,  pro:1,  fat:0,  carb:3},
  "돼지기름":     {cal:902, pro:0,  fat:100,carb:0},
  "닭다리살":     {cal:175, pro:19, fat:10, carb:0},
  "닭봉":         {cal:203, pro:19, fat:14, carb:0},
  "가쓰오부시육수":{cal:5,  pro:1,  fat:0,  carb:0},
  "미소":         {cal:200, pro:12, fat:6,  carb:27},
  "유자청":       {cal:100, pro:0,  fat:0,  carb:25},
  "유부":         {cal:386, pro:18, fat:35, carb:2},
  // ── 추가 재료 (미매핑 해소) ──
  "베이크드빈":     {cal:94,  pro:5,  fat:0,  carb:17},
  "베이킹파우더":   {cal:53,  pro:0,  fat:0,  carb:28},
  "바스마티쌀":     {cal:350, pro:7,  fat:1,  carb:78},
  "깔라만시":       {cal:22,  pro:1,  fat:0,  carb:7},
  "차슈":           {cal:250, pro:18, fat:18, carb:3},
  "칠리파우더":     {cal:282, pro:14, fat:15, carb:50},
  "커피":           {cal:2,   pro:0,  fat:0,  carb:0},
  "흰살생선":       {cal:96,  pro:20, fat:1,  carb:0},
  "그린빈":         {cal:31,  pro:2,  fat:0,  carb:7},
  "호이신소스":     {cal:220, pro:4,  fat:1,  carb:49},
  "할라피뇨":       {cal:29,  pro:1,  fat:0,  carb:7},
  "일본식마요네즈": {cal:670, pro:2,  fat:73, carb:4},
  "대추":           {cal:282, pro:4,  fat:1,  carb:67},
  "카야잼":         {cal:320, pro:3,  fat:8,  carb:58},
  "김칫국물":       {cal:15,  pro:1,  fat:0,  carb:3},
  "라자냐면":       {cal:357, pro:12, fat:2,  carb:71},
  "줄콩":           {cal:31,  pro:2,  fat:0,  carb:7},
  "메이플시럽":     {cal:260, pro:0,  fat:0,  carb:67},
  "미트볼":         {cal:250, pro:14, fat:18, carb:8},
  "멘마":           {cal:25,  pro:2,  fat:0,  carb:5},
  "머스터드씨드":   {cal:508, pro:26, fat:36, carb:28},
  "면":             {cal:357, pro:12, fat:2,  carb:71},
  "넛맥":           {cal:525, pro:6,  fat:36, carb:49},
  "오코노미야키소스":{cal:100, pro:2,  fat:0,  carb:23},
  "단무지":         {cal:21,  pro:1,  fat:0,  carb:5},
  "동태":           {cal:82,  pro:18, fat:1,  carb:0},
  "슈가파우더":     {cal:387, pro:0,  fat:0,  carb:100},
  "메추리알":       {cal:158, pro:13, fat:11, carb:1},
  "라멘":           {cal:357, pro:12, fat:2,  carb:71},
  "라멘타레":       {cal:120, pro:8,  fat:2,  carb:18},
  "삼발소스":       {cal:140, pro:3,  fat:8,  carb:16},
  "케캡마니스":     {cal:259, pro:5,  fat:0,  carb:62},
  "피타빵":         {cal:275, pro:9,  fat:1,  carb:56},
  "불구르":         {cal:342, pro:12, fat:1,  carb:76},
  "야키소바소스":   {cal:95,  pro:3,  fat:0,  carb:21},
  "오코노미야키반죽":{cal:200, pro:5,  fat:3,  carb:38},
  "텐카스":         {cal:560, pro:6,  fat:38, carb:48},
  "미림":           {cal:228, pro:0,  fat:0,  carb:43},
  "청주":           {cal:134, pro:0,  fat:0,  carb:5},
  "튀김유(흡수)":   {cal:884, pro:0,  fat:100,carb:0},
  "스프링롤피":     {cal:320, pro:7,  fat:1,  carb:70},
};

// 단위 → gram 변환
// 메뉴 영양 계산
// 표시/식단일기용 칼로리는 항상 "1인분 기준"으로 계산한다.
// people은 장보기 수량 계산용 개념이므로 칼로리 표시에는 사용하지 않는다.
function calcNutrition(menuName, people){
  people = Math.max(1, people||1);

  // ① MENU_SCHEMA_V2 재료 계산식 (메인 로직)
  var schema = (typeof MENU_SCHEMA_V2 !== 'undefined') ? MENU_SCHEMA_V2[menuName] : null;
  if(schema && schema.ingredientAmounts && Object.keys(schema.ingredientAmounts).length > 0){
    var totCal=0, totCarb=0, totFat=0, totPro=0;
    var servings = Math.max(1, schema.servings || schema.recipeServings || 1);

    // 옵션1 표준 1인분 기준
    var STD_SERVINGS = {
      '밥·덮밥': 1, '면': 1, '국·찌개': 3, '구이': 2, '볶음': 2, '튀김': 2
    };

    Object.entries(schema.ingredientAmounts).forEach(function(entry){
      var ingId = entry[0];
      var amtStr = entry[1];

      // g 변환
      var grams = 0;
      var num = parseFloat(String(amtStr).replace(/[^0-9.]/g,''));
      if(isNaN(num)) return;
      if(/ml/.test(amtStr)) grams = num;        // ml ≈ g
      else if(/kg/.test(amtStr)) grams = num*1000;
      else if(/g/.test(amtStr)) grams = num;
      else if(/큰술/.test(amtStr)) grams = num*12;
      else if(/작은술/.test(amtStr)) grams = num*4;
      else if(/컵/.test(amtStr)) grams = num*200;
      else if(/개/.test(amtStr)) grams = num*50;
      else if(/장/.test(amtStr)) grams = num*3;
      else grams = num;

      // 식용유·튀김기름은 흡수율 18% 적용
      var absRate = (/cooking_oil|olive_oil|oil/.test(ingId)) ? 0.18 : 1.0;
      grams = grams * absRate;

      // INGREDIENT_DB_V2로 한글명 변환 → NUTRITION_DB 조회
      var ingName = (typeof INGREDIENT_DB_V2 !== 'undefined' && INGREDIENT_DB_V2[ingId])
        ? INGREDIENT_DB_V2[ingId].name : ingId;
      var nut = (typeof NUTRITION_DB !== 'undefined') ? NUTRITION_DB[ingName] : null;
      if(!nut) return;

      var ratio = grams / 100;
      totCal  += nut.cal  * ratio;
      totCarb += (nut.carb||0) * ratio;
      totFat  += (nut.fat||0)  * ratio;
      totPro  += (nut.pro||0)  * ratio;
    });

    // 1인분 환산
    var perCal  = totCal  / servings * people;
    var perCarb = totCarb / servings * people;
    var perFat  = totFat  / servings * people;
    var perPro  = totPro  / servings * people;

    // ±15% 범위
    var lo = Math.round(perCal * 0.95);
    var hi = Math.round(perCal * 1.05);

    return {
      cal:   Math.round(perCal),
      calLo: lo,
      calHi: hi,
      calRange: lo + '~' + hi + 'kcal',
      carb: Math.round(perCarb),
      fat:  Math.round(perFat),
      pro:  Math.round(perPro),
    };
  }

  // ② fallback: MENU_NUT 조회
  var nut2 = getMenuNut(menuName);
  if(nut2){
    var lo2 = Math.round(nut2.cal * 0.95);
    var hi2 = Math.round(nut2.cal * 1.05);
    return {
      cal:   Math.round(nut2.cal  * people),
      calLo: lo2,
      calHi: hi2,
      calRange: lo2 + '~' + hi2 + 'kcal',
      carb: Math.round(nut2.carb * people),
      fat:  Math.round(nut2.fat  * people),
      pro:  Math.round(nut2.pro  * people),
    };
  }
  return null;
}

// ── 제철 재료 DB (월별) ──
const SEASONAL_DB = {
  1:  ["굴","과메기","한치","방어","대구","홍합","꼬막","배추","무","시금치","우엉","연근","도라지","귤","한라봉"],
  2:  ["굴","꼬막","홍합","꽃게","시금치","봄동","냉이","달래","쑥","딸기","한라봉","귤"],
  3:  ["도다리","주꾸미","바지락","냉이","달래","쑥","봄동","두릅","참나물","딸기","한라봉"],
  4:  ["주꾸미","도다리","멍게","미더덕","바지락","두릅","취나물","참나물","냉이","달래","딸기","아스파라거스"],
  5:  ["멍게","미더덕","도다리","전복","참나물","두릅","취나물","아스파라거스","완두콩","딸기","참외"],
  6:  ["전복","민어","농어","오징어","갈치","참외","복숭아","자두","토마토","옥수수","감자","마늘"],
  7:  ["민어","오징어","갈치","낙지","전복","복숭아","참외","수박","옥수수","토마토","가지","애호박","감자"],
  8:  ["오징어","갈치","낙지","전복","장어","수박","복숭아","포도","옥수수","가지","고추","토마토","감자"],
  9:  ["꽃게","전어","고등어","낙지","대하","새우","포도","배","사과","고구마","버섯","고추","가지"],
  10: ["꽃게","대하","전어","고등어","갈치","굴","배","사과","감","고구마","버섯","브로콜리","연근"],
  11: ["굴","꼬막","대구","방어","고등어","배추","무","시금치","브로콜리","감","사과","유자"],
  12: ["굴","과메기","방어","대구","홍합","꼬막","배추","무","시금치","귤","한라봉","유자"],
};

// 현재 달의 제철 재료 반환
function getSeasonalIngs(){
  const month = new Date().getMonth()+1;
  return SEASONAL_DB[month]||[];
}

// 메뉴의 제철 점수 계산 (제철 재료 몇 개 포함하는지)
function getSeasonalScore(menuName){
  const db=MENU_DB[menuName];
  if(!db)return 0;
  const seasonal=getSeasonalIngs();
  return db.ingredients.filter(i=>seasonal.some(s=>i.name.includes(s)||s.includes(i.name))).length;
}

function scaleAmt(amount, people){
  if(people===1||!amount)return amount;
  const num=parseFloat(amount);
  if(!num||isNaN(num))return amount;
  const unit=amount.replace(/[0-9./]/g,'').trim();
  const scaled=Math.round(num*people*10)/10;
  return scaled+unit;
}

function getSides(name, type){
  if(type==="아침") return [];
  const map={
    // ── 한식 찌개 (메인 → 국+나물 사이드) ──
    "된장찌개":["계란말이","시금치나물","멸치볶음"],
    "두부된장찌개":["계란말이","콩나물무침","김치"],
    "버섯된장찌개":["두부조림","시금치나물","김치"],
    "조개된장찌개":["계란말이","무나물","깍두기"],
    "김치찌개":["계란말이","감자볶음","시금치나물"],
    "돼지고기김치찌개":["두부조림","콩나물무침","깍두기"],
    "참치김치찌개":["계란말이","오이무침","깍두기"],
    "묵은지김치찌개":["계란찜","시금치나물","멸치볶음"],
    "순두부찌개":["멸치볶음","오이무침","김치"],
    "해물순두부찌개":["계란말이","시금치나물","깍두기"],
    "부대찌개":["단무지","오이무침","김치"],
    "청국장찌개":["깍두기","시금치나물","멸치볶음"],
    "동태찌개":["무나물","김치","계란말이"],
    // ── 한식 국 → 사이드로 활용 ──
    "미역국":["멸치볶음","두부조림","오이무침"],
    "콩나물국":["멸치볶음","계란말이","김치"],
    "된장국":["멸치볶음","시금치나물","감자볶음"],
    "북어국":["오이무침","멸치볶음","김치"],
    "황태국":["오이무침","두부조림","김치"],
    "소고기뭇국":["시금치나물","멸치볶음","깍두기"],
    "아욱국":["멸치볶음","오이무침","김치"],
    "시금치국":["계란말이","두부조림","김치"],
    "냉이국":["멸치볶음","오이무침","깍두기"],
    // ── 한식 메인 (국류 사이드로) ──
    "제육볶음":["된장국","김치","콩나물무침"],
    "고추장제육볶음":["미역국","김치","시금치나물"],
    "간장제육볶음":["된장국","오이무침","콩나물무침"],
    "불고기":["미역국","김치","시금치나물"],
    "간장불고기":["된장국","깍두기","무나물"],
    "버섯불고기":["콩나물국","오이무침","김치"],
    "갈비찜":["콩나물국","깍두기","시금치나물"],
    "소갈비찜":["된장국","김치","나물"],
    "닭볶음탕":["된장국","오이무침","깍두기"],
    "감자닭볶음탕":["미역국","깍두기","시금치나물"],
    "닭갈비":["된장국","깍두기","오이무침"],
    "춘천식닭갈비":["콩나물국","깍두기","오이무침"],
    "삼겹살":["된장찌개","상추","쌈장"],
    "마늘삼겹살구이":["된장찌개","깻잎","상추"],
    "소금삼겹살구이":["된장찌개","상추","마늘"],
    "오징어볶음":["미역국","김치","콩나물무침"],
    "고추장오징어볶음":["콩나물국","김치","두부조림"],
    "낙지볶음":["된장국","김치","오이무침"],
    "보쌈":["새우젓","쌈장","깍두기"],
    "수육":["새우젓","쌈장","겉절이"],
    "잡채":["미역국","김치","나물"],
    "고등어조림":["된장국","시금치나물","김치"],
    "갈치조림":["된장국","콩나물무침","깍두기"],
    "비빔밥":["된장국","깍두기","나물"],
    "김치볶음밥":["계란후라이","오이무침","단무지"],
    "볶음밥":["계란국","오이무침","단무지"],
    "냉면":["편육","깍두기","겨자"],
    "떡볶이":["순대","어묵국","튀김"],
    "두부김치":["콩나물국","멸치볶음","오이무침"],
    "삼계탕":["깍두기","나물","겉절이"],
    "갈비탕":["깍두기","나물","깻잎절임"],
    "설렁탕":["깍두기","나물","김치"],
    "육개장":["깍두기","나물","계란말이"],
    "감자탕":["깍두기","겉절이","나물"],
    // ── 일식 사이드 ──
    "오야코동":["미소국","단무지","오이절임"],
    "규동":["미소국","단무지","오이절임"],
    "가츠동":["미소국","단무지","절임채소"],
    "우나동":["미소국","절임채소","시금치나물"],
    "텐동":["미소국","단무지","오이절임"],
    "라멘":["교자","멘마","나루토"],
    "쇼유라멘":["교자","반숙계란","멘마"],
    "된장라멘":["교자","옥수수","버터"],
    "돈코츠라멘":["교자","홍생강","멘마"],
    "도쿄라멘":["교자","반숙계란","해초"],
    "우동":["튀김","오니기리","절임채소"],
    "소바":["튀김","와사비","절임채소"],
    "야키소바":["절임채소","미소국","단무지"],
    "가라아게":["마요네즈","레몬","절임채소"],
    "닭가슴살데리야끼":["미소국","절임채소","시금치무침"],
    "연어데리야끼":["미소국","절임채소","오이절임"],
    "일식샤부샤부":["폰즈소스","참깨소스","오니기리"],
    "돈카츠":["된장국","양배추채","단무지"],
    "미소국":["오니기리","절임채소","나물"],
    // ── 중식 사이드 ──
    "짜장면":["단무지","오이무침","양파절임"],
    "짬뽕":["단무지","오이무침","양파절임"],
    "마파두부":["흰쌀밥","오이무침","단무지"],
    "탕수육":["짜장소스","오이무침","단무지"],
    "깐소새우":["흰쌀밥","단무지","오이무침"],
    "볶음밥중식":["달걀수프","단무지","오이무침"],
    "마라탕":["흰쌀밥","오이절임","단무지"],
    "광동식볶음면":["달걀수프","중화피클","오이무침"],
    "딤섬":["우롱차","XO소스","간장"],
    "사천마라새우":["흰쌀밥","오이무침","단무지"],
    "파스타":["시저샐러드","마늘빵","미네스트로네"],
    "카르보나라":["시저샐러드","마늘빵","미네스트로네"],
    "알리오올리오":["루꼴라샐러드","브루스케타","미네스트로네"],
    "봉골레화이트파스타":["루꼴라샐러드","마늘빵","올리브오일빵"],
    "토마토새우파스타":["시저샐러드","마늘빵","수프"],
    "크림새우파스타":["그린샐러드","마늘빵","수프"],
    "마늘올리브파스타":["루꼴라샐러드","브루스케타","수프"],
    "리조또":["그린샐러드","브루스케타","수프"],
    "버섯리조또":["루꼴라샐러드","마늘빵","파마산"],
    "새우리조또":["그린샐러드","브루스케타","수프"],
    "스테이크":["시저샐러드","감자퓨레","머스룸소스"],
    "소등심구이":["그린샐러드","감자퓨레","로즈마리"],
    "레몬허브치킨":["그린샐러드","감자구이","마늘빵"],
    "발사믹치킨":["루꼴라샐러드","감자구이","수프"],
    "피자":["그린샐러드","마늘빵","수프"],
    "마르게리타피자":["루꼴라샐러드","마늘빵","올리브"],
    "햄버거":["감자튀김","콜슬로","피클"],
    "클럽샌드위치":["감자칩","피클","코울슬로"],
    "피시앤칩스":["콜슬로","타르타르소스","레몬"],
    // ── 동남아 사이드 ──
    "팟타이":["똠얌수프","스프링롤","라임"],
    "그린커리":["흰쌀밥","파파덤","망고샐러드"],
    "레드커리":["흰쌀밥","파파덤","오이절임"],
    "나시고렝":["에그프라이","크루폭","오이절임"],
    "미고렝":["사테","크루폭","절임채소"],
    "인도네시아사테":["오이절임","밥","땅콩소스"],
    "말레이시아락사":["삶은계란","두부","숙주"],
    "쌀국수":["숙주","라임","허브"],
    "팟씨유":["오이절임","스프링롤","라임"],
    // ── 인도 사이드 ──
    "버터치킨":["난","라씨","처트니"],
    "탄두리치킨":["난","민트처트니","양파절임"],
    "비리야니":["라이타","처트니","파파덤"],
    "달커리":["난","처트니","라이타"],
    // ── 중동/기타 사이드 ──
    "케밥":["피타빵","타불레","후무스"],
    "팔라펠":["피타빵","후무스","타불레"],
    "쿠스쿠스":["처트니","올리브","피타빵"],
    "타진":["쿠스쿠스","올리브","피타빵"],
    // ── 스페인 사이드 ──
    "파에야":["빵","올리브","샐러드"],
    "해물파에야":["빵","올리브","레몬"],
    "감바스알아히요":["바게트","올리브","샐러드"],
    "가스파초":["크루통","올리브","빵"],
    // ── 멕시코 사이드 ──
    "타코":["과카몰레","살사","사워크림"],
    "카르니타스타코":["과카몰레","살사","할라피뇨"],
    "부리토":["과카몰레","살사","사워크림"],
    "엔칠라다":["과카몰레","사워크림","샐러드"],
    "퀘사디야":["과카몰레","살사","사워크림"],
  };

  // 키워드 기반 fallback
  const keywords=[
    // 한식
    {k:"찌개",  s:["콩나물국","김치","나물"]},
    {k:"탕",    s:["깍두기","나물","겉절이"]},
    {k:"국",    s:["멸치볶음","오이무침","김치"]},
    {k:"구이",  s:["된장국","김치","나물"]},
    {k:"볶음",  s:["된장국","김치","오이무침"]},
    {k:"조림",  s:["된장국","시금치나물","김치"]},
    {k:"찜",    s:["된장국","깍두기","나물"]},
    {k:"전",    s:["막걸리","오이무침","김치"]},
    {k:"죽",    s:["김치","깍두기","나물"]},
    {k:"비빔밥",s:["된장국","깍두기","나물"]},
    // 일식
    {k:"동",    s:["미소국","단무지","오이절임"]},
    {k:"라멘",  s:["교자","멘마","절임채소"]},
    {k:"우동",  s:["튀김","오니기리","절임채소"]},
    {k:"소바",  s:["튀김","절임채소","와사비"]},
    {k:"데리야끼",s:["미소국","절임채소","샐러드"]},
    {k:"카츠",  s:["미소국","양배추채","단무지"]},
    // 중식
    {k:"짜장",  s:["단무지","오이무침","양파절임"]},
    {k:"짬뽕",  s:["단무지","오이무침","양파절임"]},
    {k:"볶음밥",s:["달걀수프","단무지","오이무침"]},
    {k:"마파",  s:["흰쌀밥","오이무침","단무지"]},
    {k:"파스타",s:["시저샐러드","마늘빵","수프"]},
    {k:"리조또",s:["그린샐러드","마늘빵","수프"]},
    {k:"스테이크",s:["시저샐러드","감자퓨레","수프"]},
    {k:"피자",  s:["그린샐러드","마늘빵","올리브"]},
    {k:"수프",  s:["마늘빵","샐러드","크루통"]},
    {k:"샐러드",s:["수프","빵","올리브"]},
    {k:"카레",  s:["난","오이피클","처트니"]},
    // 동남아
    {k:"커리",  s:["흰쌀밥","난","처트니"]},
    {k:"볶음면",s:["오이절임","스프링롤","라임"]},
    {k:"타코",  s:["과카몰레","살사","사워크림"]},
    {k:"부리토",s:["과카몰레","살사","사워크림"]},
  ];

  if(map[name]) return map[name];
  for(const{k,s}of keywords) if(name.includes(k)) return s;
  return["김치","나물"];
}

function getBrands(side){
  // 직접 매핑
  if(BRAND_DB[side]) return BRAND_DB[side].filter(b=>new Date(b.until)>=new Date());
  // 키워드 매핑
  const keys=Object.keys(BRAND_DB);
  for(const k of keys) if(side.includes(k)||k.includes(side)) return(BRAND_DB[k]||[]).filter(b=>new Date(b.until)>=new Date());
  return(BRAND_DB.기타||[]).filter(b=>new Date(b.until)>=new Date());
}

// ── 정제 MENU_DB: 메뉴 ↔ 재료 로컬 지식베이스 ──
const MENU_DB = (()=>{
  const STD_ING = {
  "쌀": [
    "200g",
    "🌾",
    "면·밥"
  ],
  "현미": [
    "200g",
    "🌾",
    "면·밥"
  ],
  "찹쌀": [
    "80g",
    "🌾",
    "면·밥"
  ],
  "오트밀": [
    "60g",
    "🌾",
    "면·밥"
  ],
  "라면": [
    "1개",
    "🍜",
    "면·밥"
  ],
  "중면": [
    "200g",
    "🍜",
    "면·밥"
  ],
  "소면": [
    "200g",
    "🍜",
    "면·밥"
  ],
  "우동": [
    "200g",
    "🍜",
    "면·밥"
  ],
  "스파게티": [
    "200g",
    "🍝",
    "면·밥"
  ],
  "쌀국수": [
    "200g",
    "🍜",
    "면·밥"
  ],
  "당면": [
    "100g",
    "🍜",
    "면·밥"
  ],
  "냉면": [
    "200g",
    "🍜",
    "면·밥"
  ],
  "메밀면": [
    "200g",
    "🍜",
    "면·밥"
  ],
  "칼국수면": [
    "200g",
    "🍜",
    "면·밥"
  ],
  "떡": [
    "200g",
    "⚪",
    "면·밥"
  ],
  "식빵": [
    "2장",
    "🍞",
    "면·밥"
  ],
  "바게트": [
    "1/2개",
    "🥖",
    "면·밥"
  ],
  "또띠아": [
    "2장",
    "🫓",
    "면·밥"
  ],
  "밀가루": [
    "100g",
    "🌾",
    "면·밥"
  ],
  "쌀가루": [
    "100g",
    "🌾",
    "면·밥"
  ],
  "라자냐면": [
    "4장",
    "🍝",
    "면·밥"
  ],
  "만두피": [
    "20장",
    "🥟",
    "면·밥"
  ],
  "라이스페이퍼": [
    "10장",
    "⚪",
    "면·밥"
  ],
  "꽃빵": [
    "4개",
    "🥟",
    "면·밥"
  ],
  "누룽지": [
    "100g",
    "🌾",
    "면·밥"
  ],
  "나초칩": [
    "120g",
    "🌽",
    "면·밥"
  ],
  "소고기": [
    "200g",
    "🥩",
    "단백질"
  ],
  "소안심": [
    "220g",
    "🥩",
    "단백질"
  ],
  "립아이": [
    "280g",
    "🥩",
    "단백질"
  ],
  "채끝살": [
    "240g",
    "🥩",
    "단백질"
  ],
  "티본": [
    "350g",
    "🥩",
    "단백질"
  ],
  "포터하우스": [
    "400g",
    "🥩",
    "단백질"
  ],
  "토마호크": [
    "450g",
    "🥩",
    "단백질"
  ],
  "살치살": [
    "260g",
    "🥩",
    "단백질"
  ],
  "부채살": [
    "240g",
    "🥩",
    "단백질"
  ],
  "소고기목심": [
    "200g",
    "🥩",
    "단백질"
  ],
  "소고기앞다리살": [
    "200g",
    "🥩",
    "단백질"
  ],
  "소고기홍두깨살": [
    "200g",
    "🥩",
    "단백질"
  ],
  "소고기채끝살": [
    "200g",
    "🥩",
    "단백질"
  ],
  "소갈비": [
    "600g",
    "🥩",
    "단백질"
  ],
  "돼지고기": [
    "250g",
    "🥩",
    "단백질"
  ],
  "돼지삼겹살": [
    "220g",
    "🥩",
    "단백질"
  ],
  "돼지목살": [
    "220g",
    "🥩",
    "단백질"
  ],
  "돼지앞다리살": [
    "220g",
    "🥩",
    "단백질"
  ],
  "돼지등심": [
    "200g",
    "🥩",
    "단백질"
  ],
  "돼지안심": [
    "200g",
    "🥩",
    "단백질"
  ],
  "돼지다짐육": [
    "200g",
    "🥩",
    "단백질"
  ],
  "돼지갈비": [
    "600g",
    "🥩",
    "단백질"
  ],
  "돼지등뼈": [
    "700g",
    "🥩",
    "단백질"
  ],
  "닭고기": [
    "300g",
    "🍗",
    "단백질"
  ],
  "닭다리살": [
    "300g",
    "🍗",
    "단백질"
  ],
  "닭날개": [
    "300g",
    "🥩",
    "단백질"
  ],
  "닭가슴살": [
    "200g",
    "🍗",
    "단백질"
  ],
  "연어": [
    "200g",
    "🐟",
    "단백질"
  ],
  "고등어": [
    "1마리",
    "🐟",
    "단백질"
  ],
  "갈치": [
    "1마리",
    "🐟",
    "단백질"
  ],
  "삼치": [
    "1마리",
    "🐟",
    "단백질"
  ],
  "동태": [
    "1마리",
    "🐟",
    "단백질"
  ],
  "새우": [
    "150g",
    "🦐",
    "단백질"
  ],
  "오징어": [
    "1마리",
    "🦑",
    "단백질"
  ],
  "낙지": [
    "1마리",
    "🐙",
    "단백질"
  ],
  "주꾸미": [
    "200g",
    "🐙",
    "단백질"
  ],
  "꽃게": [
    "2마리",
    "🦀",
    "단백질"
  ],
  "문어": [
    "120g",
    "🐙",
    "단백질"
  ],
  "바지락": [
    "200g",
    "🦪",
    "단백질"
  ],
  "해삼": [
    "80g",
    "🦪",
    "단백질"
  ],
  "햄": [
    "100g",
    "🥩",
    "단백질"
  ],
  "소시지": [
    "100g",
    "🌭",
    "단백질"
  ],
  "돈카츠": [
    "1장",
    "🥩",
    "단백질"
  ],
  "참치캔": [
    "1캔",
    "🐟",
    "단백질"
  ],
  "두부": [
    "1/2모",
    "🟫",
    "단백질"
  ],
  "순두부": [
    "1팩",
    "🟫",
    "단백질"
  ],
  "유부": [
    "4장",
    "🟡",
    "단백질"
  ],
  "계란": [
    "2개",
    "🥚",
    "단백질"
  ],
  "치즈": [
    "50g",
    "🧀",
    "단백질"
  ],
  "모짜렐라": [
    "80g",
    "🧀",
    "단백질"
  ],
  "파마산치즈": [
    "20g",
    "🧀",
    "단백질"
  ],
  "페타치즈": [
    "50g",
    "🧀",
    "단백질"
  ],
  "파니르": [
    "150g",
    "🧀",
    "단백질"
  ],
  "요거트": [
    "150g",
    "🥛",
    "단백질"
  ],
  "우유": [
    "200ml",
    "🥛",
    "단백질"
  ],
  "생크림": [
    "100ml",
    "🥛",
    "단백질"
  ],
  "렌틸콩": [
    "100g",
    "🫘",
    "단백질"
  ],
  "강낭콩": [
    "100g",
    "🫘",
    "단백질"
  ],
  "멸치": [
    "50g",
    "🐟",
    "단백질"
  ],
  "어묵": [
    "150g",
    "🟡",
    "단백질"
  ],
  "김치": [
    "200g",
    "🥬",
    "채소"
  ],
  "무": [
    "200g",
    "🥬",
    "채소"
  ],
  "배추": [
    "1/4포기",
    "🥬",
    "채소"
  ],
  "양배추": [
    "1/4통",
    "🥬",
    "채소"
  ],
  "양상추": [
    "1/2통",
    "🥬",
    "채소"
  ],
  "로메인": [
    "150g",
    "🥬",
    "채소"
  ],
  "상추": [
    "1봉지",
    "🥬",
    "채소"
  ],
  "시금치": [
    "150g",
    "🥬",
    "채소"
  ],
  "콩나물": [
    "200g",
    "🥬",
    "채소"
  ],
  "숙주": [
    "200g",
    "🥬",
    "채소"
  ],
  "청경채": [
    "150g",
    "🥬",
    "채소"
  ],
  "우거지": [
    "200g",
    "🥬",
    "채소"
  ],
  "고사리": [
    "100g",
    "🌿",
    "채소"
  ],
  "오이": [
    "1개",
    "🥒",
    "채소"
  ],
  "애호박": [
    "1/2개",
    "🥒",
    "채소"
  ],
  "가지": [
    "1개",
    "🍆",
    "채소"
  ],
  "단호박": [
    "1/4개",
    "🎃",
    "채소"
  ],
  "감자": [
    "2개",
    "🥔",
    "채소"
  ],
  "고구마": [
    "1개",
    "🍠",
    "채소"
  ],
  "당근": [
    "1개",
    "🥕",
    "채소"
  ],
  "양파": [
    "1개",
    "🧅",
    "채소"
  ],
  "대파": [
    "1대",
    "🌿",
    "채소"
  ],
  "쪽파": [
    "1줌",
    "🌿",
    "채소"
  ],
  "부추": [
    "1줌",
    "🌿",
    "채소"
  ],
  "마늘": [
    "5쪽",
    "🧄",
    "채소"
  ],
  "생강": [
    "1쪽",
    "🟡",
    "채소"
  ],
  "토마토": [
    "2개",
    "🍅",
    "채소"
  ],
  "방울토마토": [
    "10개",
    "🍅",
    "채소"
  ],
  "피망": [
    "1개",
    "🫑",
    "채소"
  ],
  "파프리카": [
    "1개",
    "🫑",
    "채소"
  ],
  "브로콜리": [
    "1/2개",
    "🥦",
    "채소"
  ],
  "콜리플라워": [
    "1/2개",
    "🥦",
    "채소"
  ],
  "버섯": [
    "1팩",
    "🍄",
    "채소"
  ],
  "표고버섯": [
    "4개",
    "🍄",
    "채소"
  ],
  "목이버섯": [
    "30g",
    "🍄",
    "채소"
  ],
  "아보카도": [
    "1개",
    "🥑",
    "채소"
  ],
  "파파야": [
    "200g",
    "🥭",
    "채소"
  ],
  "고수": [
    "약간",
    "🌿",
    "채소"
  ],
  "바질": [
    "약간",
    "🌿",
    "채소"
  ],
  "파슬리": [
    "약간",
    "🌿",
    "채소"
  ],
  "레몬": [
    "1/2개",
    "🍋",
    "채소"
  ],
  "라임": [
    "1개",
    "🍋",
    "채소"
  ],
  "오렌지": [
    "1개",
    "🍊",
    "채소"
  ],
  "바나나": [
    "1개",
    "🍌",
    "채소"
  ],
  "블루베리": [
    "50g",
    "🫐",
    "채소"
  ],
  "단무지": [
    "4줄",
    "🟡",
    "채소"
  ],
  "김": [
    "2장",
    "🟢",
    "기타"
  ],
  "미역": [
    "20g",
    "🟢",
    "채소"
  ],
  "북어": [
    "50g",
    "🐟",
    "단백질"
  ],
  "간장": [
    "2큰술",
    "🍶",
    "양념"
  ],
  "국간장": [
    "1큰술",
    "🍶",
    "양념"
  ],
  "된장": [
    "2큰술",
    "🥣",
    "양념"
  ],
  "청국장": [
    "2큰술",
    "🥣",
    "양념"
  ],
  "미소된장": [
    "2큰술",
    "🥣",
    "양념"
  ],
  "고추장": [
    "2큰술",
    "🌶️",
    "양념"
  ],
  "고춧가루": [
    "1큰술",
    "🌶️",
    "양념"
  ],
  "두반장": [
    "1큰술",
    "🌶️",
    "양념"
  ],
  "춘장": [
    "2큰술",
    "🟫",
    "양념"
  ],
  "마라소스": [
    "2큰술",
    "🌶️",
    "양념"
  ],
  "그린커리페이스트": [
    "2큰술",
    "🟢",
    "양념"
  ],
  "레드커리페이스트": [
    "2큰술",
    "🔴",
    "양념"
  ],
  "카레가루": [
    "30g",
    "🟡",
    "양념"
  ],
  "강황": [
    "1작은술",
    "🟡",
    "양념"
  ],
  "피시소스": [
    "1큰술",
    "🍶",
    "양념"
  ],
  "굴소스": [
    "1큰술",
    "🍶",
    "양념"
  ],
  "우스터소스": [
    "1큰술",
    "🍶",
    "양념"
  ],
  "케찹마니스": [
    "1큰술",
    "🍶",
    "양념"
  ],
  "토마토소스": [
    "1컵",
    "🍅",
    "양념"
  ],
  "케첩": [
    "2큰술",
    "🍅",
    "양념"
  ],
  "마요네즈": [
    "2큰술",
    "🧴",
    "양념"
  ],
  "와사비": [
    "약간",
    "🟢",
    "양념"
  ],
  "겨자": [
    "약간",
    "🟡",
    "양념"
  ],
  "식초": [
    "1큰술",
    "🍶",
    "양념"
  ],
  "미림": [
    "1큰술",
    "🍶",
    "양념"
  ],
  "설탕": [
    "1큰술",
    "🧂",
    "양념"
  ],
  "물엿": [
    "1큰술",
    "🍯",
    "양념"
  ],
  "꿀": [
    "1큰술",
    "🍯",
    "양념"
  ],
  "소금": [
    "약간",
    "🧂",
    "양념"
  ],
  "후추": [
    "약간",
    "🧂",
    "양념"
  ],
  "참기름": [
    "1큰술",
    "🫙",
    "양념"
  ],
  "올리브오일": [
    "2큰술",
    "🫒",
    "양념"
  ],
  "식용유": [
    "2큰술",
    "🫙",
    "양념"
  ],
  "버터": [
    "1큰술",
    "🧈",
    "양념"
  ],
  "멸치육수": [
    "500ml",
    "🍶",
    "양념"
  ],
  "사골육수": [
    "500ml",
    "🍶",
    "양념"
  ],
  "폰즈소스": [
    "2큰술",
    "🍶",
    "양념"
  ],
  "전분": [
    "3큰술",
    "🌾",
    "양념"
  ],
  "튀김가루": [
    "100g",
    "🌾",
    "면·밥"
  ],
  "빵가루": [
    "100g",
    "🌾",
    "면·밥"
  ],
  "땅콩": [
    "30g",
    "🥜",
    "기타"
  ],
  "아몬드": [
    "30g",
    "🥜",
    "기타"
  ],
  "깨": [
    "1큰술",
    "⚪",
    "양념"
  ],
  "코코넛밀크": [
    "200ml",
    "🥥",
    "양념"
  ],
  "레몬그라스": [
    "1대",
    "🌿",
    "양념"
  ],
  "타마린드": [
    "1큰술",
    "🍶",
    "양념"
  ],
  "월계수잎": [
    "1장",
    "🌿",
    "양념"
  ],
  "올리브": [
    "30g",
    "🫒",
    "기타"
  ],
  "할라피뇨": [
    "1개",
    "🌶️",
    "채소"
  ],
  "삼겹살": [
    "250g",
    "🥩",
    "단백질"
  ],
  "오리고기": [
    "200g",
    "🦆",
    "단백질"
  ],
  "양고기": [
    "250g",
    "🥩",
    "단백질"
  ],
  "황태": [
    "50g",
    "🐟",
    "단백질"
  ],
  "홍합": [
    "200g",
    "🦪",
    "단백질"
  ],
  "가리비": [
    "6개",
    "🦪",
    "단백질"
  ],
  "베이컨": [
    "100g",
    "🥓",
    "단백질"
  ],
  "깻잎": [
    "10장",
    "🌿",
    "채소"
  ],
  "묵은지": [
    "200g",
    "🥬",
    "채소"
  ],
  "대추": [
    "10개",
    "🔴",
    "기타"
  ],
  "밤": [
    "5개",
    "🌰",
    "기타"
  ],
  "여주": [
    "1개",
    "🥒",
    "채소"
  ],
  "공심채": [
    "200g",
    "🌿",
    "채소"
  ],
  "셀러리": [
    "2대",
    "🌿",
    "채소"
  ],
  "비트": [
    "1개",
    "🔴",
    "채소"
  ],
  "포도잎": [
    "20장",
    "🌿",
    "채소"
  ],
  "근대": [
    "150g",
    "🌿",
    "채소"
  ],
  "루꼴라": [
    "50g",
    "🌿",
    "채소"
  ],
  "바스마티쌀": [
    "200g",
    "🌾",
    "면·밥"
  ],
  "나안": [
    "2장",
    "🫓",
    "면·밥"
  ],
  "쿠스쿠스": [
    "150g",
    "🌾",
    "면·밥"
  ],
  "계란면": [
    "200g",
    "🍜",
    "면·밥"
  ],
  "판단면": [
    "200g",
    "🍜",
    "면·밥"
  ],
  "들기름": [
    "1큰술",
    "🫙",
    "양념"
  ],
  "가람마살라": [
    "1작은술",
    "🟡",
    "양념"
  ],
  "커민": [
    "1작은술",
    "🟡",
    "양념"
  ],
  "파프리카파우더": [
    "1작은술",
    "🔴",
    "양념"
  ],
  "칠리파우더": [
    "1작은술",
    "🔴",
    "양념"
  ],
  "고수분말": [
    "1작은술",
    "🟡",
    "양념"
  ],
  "삼발소스": [
    "1큰술",
    "🌶️",
    "양념"
  ],
  "코코넛오일": [
    "1큰술",
    "🫙",
    "양념"
  ],
  "새우페이스트": [
    "1작은술",
    "🦐",
    "양념"
  ],
  "팜슈가": [
    "1큰술",
    "🟡",
    "양념"
  ],
  "마사만커리페이스트": [
    "2큰술",
    "🟡",
    "양념"
  ],
  "타히니": [
    "2큰술",
    "🟡",
    "양념"
  ],
  "이탈리안허브": [
    "약간",
    "🌿",
    "양념"
  ],
  "사워크림": [
    "3큰술",
    "🥛",
    "단백질"
  ],
  "크림치즈": [
    "50g",
    "🧀",
    "단백질"
  ],
  "가쓰오부시": [
    "10g",
    "🐟",
    "기타"
  ],
  "건고추": [
    "3개",
    "🌶️",
    "채소"
  ],
  "계피": [
    "5g",
    "🟡",
    "양념"
  ],
  "고추": [
    "2개",
    "🌶️",
    "채소"
  ],
  "곤약": [
    "100g",
    "⚪",
    "채소"
  ],
  "다시": [
    "200ml",
    "🍶",
    "양념"
  ],
  "대구": [
    "200g",
    "🐟",
    "단백질"
  ],
  "딜": [
    "약간",
    "🌿",
    "채소"
  ],
  "레드와인": [
    "100ml",
    "🍷",
    "양념"
  ],
  "명란": [
    "30g",
    "🟡",
    "단백질"
  ],
  "병아리콩": [
    "100g",
    "🫘",
    "단백질"
  ],
  "쌈장": [
    "2큰술",
    "🥣",
    "양념"
  ],
  "액젓": [
    "1큰술",
    "🍶",
    "양념"
  ],
  "양장피": [
    "100g",
    "⚪",
    "면·밥"
  ],
  "오레가노": [
    "약간",
    "🌿",
    "양념"
  ],
  "옥수수": [
    "1개",
    "🌽",
    "채소"
  ],
  "완두콩": [
    "50g",
    "🟢",
    "채소"
  ],
  "완탕피": [
    "20장",
    "⚪",
    "면·밥"
  ],
  "인삼": [
    "1뿌리",
    "🌿",
    "기타"
  ],
  "죽순": [
    "100g",
    "🟡",
    "채소"
  ],
  "치킨스톡": [
    "1개",
    "🍲",
    "양념"
  ],
  "파인애플": [
    "200g",
    "🍍",
    "채소"
  ],
  "판단잎": [
    "2장",
    "🌿",
    "기타"
  ],
  "팔각": [
    "4g",
    "🟡",
    "양념"
  ],
  "호이신소스": [
    "2큰술",
    "🟫",
    "양념"
  ],
  "코다리": [
    "200g",
    "🐟",
    "단백질"
  ],
  "전복": [
    "2마리",
    "🦪",
    "단백질"
  ],
  "오크라": [
    "100g",
    "🟢",
    "채소"
  ],
  "아욱": [
    "100g",
    "🌿",
    "채소"
  ],
  "도라지": [
    "100g",
    "🌿",
    "채소"
  ],
  "취나물": [
    "100g",
    "🌿",
    "채소"
  ],
  "느타리버섯": [
    "1팩",
    "🍄",
    "채소"
  ],
  "적양파": [
    "1개",
    "🧅",
    "채소"
  ],
  "그린망고": [
    "200g",
    "🥭",
    "채소"
  ],
  "카피르라임잎": [
    "3장",
    "🌿",
    "채소"
  ],
  "보리": [
    "100g",
    "🌾",
    "면·밥"
  ],
  "옥수수가루": [
    "150g",
    "🌾",
    "면·밥"
  ],
  "고추기름": [
    "1큰술",
    "🌶️",
    "양념"
  ],
  "사프란": [
    "약간",
    "🟡",
    "양념"
  ],
  "비프스톡": [
    "200ml",
    "🍲",
    "양념"
  ],
  "오향파우더": [
    "1작은술",
    "🟡",
    "양념"
  ],
  "살사소스": [
    "2큰술",
    "🍅",
    "양념"
  ],
  "청양고추": [
    "2개",
    "🌶️",
    "채소"
  ],
  "콩": [
    "50g",
    "🫘",
    "단백질"
  ],
  "캐슈넛": [
    "50g",
    "🥜",
    "기타"
  ],
  "잣": [
    "20g",
    "🌿",
    "기타"
  ],
  "마른새우": [
    "20g",
    "🦐",
    "기타"
  ],
  "물": [
    "300ml",
    "💧",
    "기타"
  ],
  "화이트와인": [
    "100ml",
    "🍷",
    "양념"
  ],
  "마늘종": [
    "한줌",
    "🌿",
    "채소"
  ],
  "참나물": [
    "100g",
    "🌿",
    "채소"
  ],
  "골뱅이": [
    "1캔",
    "🥫",
    "단백질"
  ],
  "미꾸라지": [
    "300g",
    "🐟",
    "단백질"
  ],
  "들깨가루": [
    "2큰술",
    "🟡",
    "양념"
  ],
  "대패삼겹살": [
    "300g",
    "🥩",
    "단백질"
  ],
  "게살": [
    "100g",
    "🦀",
    "단백질"
  ],
  "해파리": [
    "100g",
    "⚪",
    "단백질"
  ],
  "불구르": [
    "150g",
    "🌾",
    "면·밥"
  ],
  "초리소": [
    "100g",
    "🌭",
    "단백질"
  ],
  "땅콩버터": [
    "3큰술",
    "🥜",
    "양념"
  ],
  "피타빵": [
    "2장",
    "🫓",
    "면·밥"
  ],
  "크림": [
    "100ml",
    "🥛",
    "단백질"
  ],
  "캐이퍼": [
    "1큰술",
    "🌿",
    "양념"
  ],
  "앤초비": [
    "30g",
    "🐟",
    "단백질"
  ],
  "빵": [
    "1덩어리",
    "🍞",
    "면·밥"
  ],
  "렌즈콩": [
    "100g",
    "🫘",
    "단백질"
  ],
  "흰강낭콩": [
    "100g",
    "🫘",
    "단백질"
  ],
  "선드라이토마토": [
    "30g",
    "🍅",
    "채소"
  ],
  "로즈마리": [
    "약간",
    "🌿",
    "양념"
  ],
  "타임": [
    "약간",
    "🌿",
    "양념"
  ],
  "생선": [
    "200g",
    "🐟",
    "단백질"
  ],
  "표고버섯가루": [
    "1큰술",
    "🍄",
    "양념"
  ],
  "달걀": [
    "2개",
    "🥚",
    "단백질"
  ],
  "소나무잣": [
    "20g",
    "🌲",
    "견과"
  ],
  "이스트": [
    "5g",
    "🫙",
    "기타"
  ],
  "케이퍼": [
    "20g",
    "🫙",
    "채소"
  ],
  "커리파우더": [
    "10g",
    "🌿",
    "양념"
  ],
  "소꼬리": [
    "700g",
    "🥩",
    "단백질"
  ],
  "꽁치": [
    "2마리",
    "🐟",
    "단백질"
  ],
  "아귀": [
    "300g",
    "🐟",
    "단백질"
  ],
  "순대": [
    "200g",
    "🌭",
    "단백질"
  ],
  "목살": [
    "250g",
    "🥩",
    "단백질"
  ],
  "도토리묵": [
    "300g",
    "⚪",
    "단백질"
  ],
  "냉이": [
    "100g",
    "🌿",
    "채소"
  ],
  "쑥": [
    "100g",
    "🌿",
    "채소"
  ],
  "연근": [
    "200g",
    "🌿",
    "채소"
  ],
  "우엉": [
    "150g",
    "🌿",
    "채소"
  ],
  "더덕": [
    "150g",
    "🌿",
    "채소"
  ],
  "미나리": [
    "100g",
    "🌿",
    "채소"
  ],
  "미역줄기": [
    "100g",
    "🟢",
    "채소"
  ],
  "열무": [
    "200g",
    "🌿",
    "채소"
  ],
  "녹두": [
    "150g",
    "🫘",
    "단백질"
  ],
  "팥": [
    "150g",
    "🫘",
    "단백질"
  ],
  "새우젓": [
    "1큰술",
    "🦐",
    "양념"
  ],
  "만두": [
    "10개",
    "🥟",
    "단백질"
  ],
  "쌀식초": [
    "2큰술",
    "🍶",
    "양념"
  ],
  "된장국물": [
    "200ml",
    "🍲",
    "양념"
  ],
  "맛술": [
    "2큰술",
    "🍶",
    "양념"
  ],
  "육수": [
    "300ml",
    "🫙",
    "소스"
  ],
  "망고": [
    "150g",
    "🥭",
    "기타"
  ],
  "세이지": [
    "5g",
    "🌿",
    "양념"
  ],
  "포도": [
    "100g",
    "🍇",
    "기타"
  ],
  "커리가루": [
    "10g",
    "🌿",
    "양념"
  ],
  "장어": [
    "1마리",
    "🐟",
    "단백질"
  ],
  "곱창": [
    "200g",
    "🥩",
    "단백질"
  ],
  "비지": [
    "200g",
    "🟡",
    "단백질"
  ],
  "총각무": [
    "200g",
    "🌿",
    "채소"
  ],
  "황기": [
    "1개",
    "🌿",
    "기타"
  ],
  "팽이버섯": [
    "1팩",
    "🍄",
    "채소"
  ],
  "초콜릿": [
    "30g",
    "🍫",
    "기타"
  ],
  "할루미치즈": [
    "150g",
    "🧀",
    "단백질"
  ],
  "리가토니": [
    "200g",
    "🍝",
    "면·밥"
  ],
  "아히페이스트": [
    "2큰술",
    "🌶️",
    "양념"
  ],
  "라스엘하누트": [
    "1작은술",
    "🟡",
    "양념"
  ],
  "살구": [
    "3개",
    "🍑",
    "채소"
  ],
  "춘권피": [
    "10장",
    "⚪",
    "면·밥"
  ],
  "맛장": [
    "1큰술",
    "🍶",
    "양념"
  ],
  "배": [
    "100g",
    "🍐",
    "기타"
  ],
  "민트": [
    "10g",
    "🌿",
    "채소"
  ],
  "실파": [
    "30g",
    "🌿",
    "채소"
  ],
  "다시마": [
    "10g",
    "🌿",
    "해산물"
  ],
  "굴": [
    "1팩",
    "🦪",
    "단백질"
  ],
  "두릅": [
    "100g",
    "🌿",
    "채소"
  ],
  "흑임자": [
    "2큰술",
    "⚫",
    "양념"
  ],
  "가자미": [
    "1마리",
    "🐟",
    "단백질"
  ],
  "서리태": [
    "100g",
    "🫘",
    "단백질"
  ],
  "오징어채": [
    "50g",
    "🦑",
    "단백질"
  ],
  "족발": [
    "500g",
    "🥩",
    "단백질"
  ],
  "타라곤": [
    "약간",
    "🌿",
    "양념"
  ],
  "아스파라거스": [
    "6줄기",
    "🌿",
    "채소"
  ],
  "유자": [
    "1개",
    "🍋",
    "채소"
  ],
  "건포도": [
    "30g",
    "🍇",
    "기타"
  ],
  "볼로냐소시지": [
    "100g",
    "🌭",
    "단백질"
  ],
  "백강낭콩": [
    "100g",
    "🫘",
    "단백질"
  ],
  "수막": [
    "5g",
    "🌿",
    "양념"
  ],
  "얼음": [
    "100g",
    "🧊",
    "기타"
  ],
  "허브": [
    "10g",
    "🌿",
    "양념"
  ],
  "참깨": [
    "10g",
    "🌿",
    "양념"
  ],
  "고구마줄기": [
    "100g",
    "🌿",
    "채소"
  ],
  "진미채": [
    "50g",
    "🦑",
    "단백질"
  ],
  "시래기": [
    "100g",
    "🌿",
    "채소"
  ],
  "율무": [
    "100g",
    "🌾",
    "면·밥"
  ],
  "꼴뚜기": [
    "200g",
    "🦑",
    "단백질"
  ],
  "도미": [
    "1마리",
    "🐟",
    "단백질"
  ],
  "카다멈": [
    "1작은술",
    "🟡",
    "양념"
  ],
  "사우어크라우트": [
    "100g",
    "🥬",
    "채소"
  ],
  "사과": [
    "1개",
    "🍎",
    "채소"
  ],
  "핫소스": [
    "2큰술",
    "🌶️",
    "양념"
  ],
  "BBQ소스": [
    "3큰술",
    "🍅",
    "양념"
  ],
  "마카로니": [
    "200g",
    "🍝",
    "면·밥"
  ],
  "오이면": [
    "200g",
    "🍜",
    "면·밥"
  ],
  "적양배추": [
    "100g",
    "🥬",
    "채소"
  ],
  "육두구": [
    "3g",
    "🌿",
    "양념"
  ],
  "항정살": [
    "250g",
    "🥩",
    "단백질"
  ],
  "전어": [
    "3마리",
    "🐟",
    "단백질"
  ],
  "오돌뼈": [
    "300g",
    "🥩",
    "단백질"
  ],
  "차돌박이": [
    "200g",
    "🥩",
    "단백질"
  ],
  "파래": [
    "15g",
    "🌿",
    "채소"
  ],
  "병어": [
    "1마리",
    "🐟",
    "단백질"
  ],
  "낫토": [
    "1팩",
    "🟡",
    "단백질"
  ],
  "수마크": [
    "1작은술",
    "🔴",
    "양념"
  ],
  "블랙빈": [
    "100g",
    "🫘",
    "단백질"
  ],
  "잠두콩": [
    "100g",
    "🫘",
    "단백질"
  ],
  "봄동": [
    "150g",
    "🥬",
    "채소"
  ],
  "베이킹파우더": [
    "5g",
    "🫙",
    "기타"
  ],
  "호두": [
    "30g",
    "🥜",
    "견과"
  ],
  "머스터드": [
    "15g",
    "🫙",
    "소스"
  ],
  "크래커": [
    "30g",
    "🍪",
    "기타"
  ],
  "조기": [
    "2마리",
    "🐟",
    "단백질"
  ],
  "쑥갓": [
    "100g",
    "🌿",
    "채소"
  ],
  "곤드레": [
    "100g",
    "🌿",
    "채소"
  ],
  "풋마늘": [
    "한줌",
    "🌿",
    "채소"
  ],
  "새송이버섯": [
    "2개",
    "🍄",
    "채소"
  ],
  "케일": [
    "150g",
    "🥬",
    "채소"
  ],
  "피클": [
    "50g",
    "🥒",
    "채소"
  ],
  "살라미": [
    "80g",
    "🌭",
    "단백질"
  ],
  "메밀": [
    "150g",
    "🌾",
    "면·밥"
  ],
  "맥주": [
    "200ml",
    "🍺",
    "양념"
  ],
  "브라운슈가": [
    "2큰술",
    "🟡",
    "양념"
  ],
  "찹쌀가루": [
    "100g",
    "🌾",
    "면·밥"
  ],
  "하몽": [
    "80g",
    "🥩",
    "육류"
  ],
  "달래": [
    "50g",
    "🌿",
    "채소"
  ],
  "광어": [
    "1마리",
    "🐟",
    "단백질"
  ],
  "무말랭이": [
    "50g",
    "🟡",
    "채소"
  ],
  "생선알": [
    "100g",
    "🟡",
    "단백질"
  ],
  "파파르델레": [
    "200g",
    "🍝",
    "면·밥"
  ],
  "베이글": [
    "2개",
    "🥯",
    "면·밥"
  ],
  "카사바가루": [
    "150g",
    "🌾",
    "면·밥"
  ],
  "병아리콩가루": [
    "2큰술",
    "🟡",
    "양념"
  ],
  "코코넛": [
    "50g",
    "🥥",
    "기타"
  ],
  "명태": [
    "1마리",
    "🐟",
    "단백질"
  ],
  "방어": [
    "200g",
    "🐟",
    "단백질"
  ],
  "프로슈토": [
    "80g",
    "🌭",
    "단백질"
  ],
  "리코타치즈": [
    "150g",
    "🧀",
    "단백질"
  ],
  "코티지치즈": [
    "150g",
    "🧀",
    "단백질"
  ],
  "땅콩가루": [
    "20g",
    "🥜",
    "견과"
  ],
  "토란": [
    "200g",
    "🟡",
    "채소"
  ],
  "매생이": [
    "50g",
    "🟢",
    "채소"
  ],
  "꽈리고추": [
    "100g",
    "🌶️",
    "채소"
  ],
  "하리사": [
    "2큰술",
    "🌶️",
    "양념"
  ],
  "자타르": [
    "1큰술",
    "🌿",
    "양념"
  ],
  "올스파이스": [
    "1작은술",
    "🟡",
    "양념"
  ],
  "호박씨": [
    "30g",
    "🟢",
    "기타"
  ],
  "그래놀라": [
    "50g",
    "🌾",
    "기타"
  ],
  "오이지": [
    "100g",
    "🥒",
    "채소"
  ],
  "오징어먹물": [
    "10g",
    "⚫",
    "양념"
  ],
  "염장대구": [
    "200g",
    "🐟",
    "단백질"
  ],
  "딸기": [
    "100g",
    "🍓",
    "기타"
  ],
  "민트잎": [
    "약간",
    "🌿",
    "채소"
  ],
  "버밀리언": [
    "5g",
    "🌿",
    "기타"
  ],
  "렌넷": [
    "5ml",
    "🫙",
    "기타"
  ],
  "바닐라": [
    "5g",
    "🌿",
    "양념"
  ],
  "팜오일": [
    "15ml",
    "🫙",
    "기름"
  ],
  "짜사이": [
    "30g",
    "🌿",
    "채소"
  ],
  "닭육수": [
    "300ml",
    "🍗",
    "소스"
  ],
  "돼지족발": [
    "300g",
    "🥩",
    "육류"
  ],
  "샐러리": [
    "80g",
    "🌿",
    "채소"
  ],
  "조개": [
    "200g",
    "🐚",
    "해산물"
  ],
  "씨앗": [
    "10g",
    "🌿",
    "기타"
  ],
  "홍어": [
    "200g",
    "🐟",
    "해산물"
  ],
  "바나나꽃": [
    "100g",
    "🌸",
    "채소"
  ],
  "머스타드": [
    "15g",
    "🫙",
    "소스"
  ],
  "소스": [
    "30ml",
    "🫙",
    "소스"
  ],
  "연두부": [
    "200g",
    "🫙",
    "단백질"
  ],
  "청어": [
    "200g",
    "🐟",
    "해산물"
  ],
  "펜네": [
    "200g",
    "🍝",
    "면·밥"
  ],
  "소고기육수": [
    "500ml",
    "🍲",
    "기타"
  ],
  "발사믹": [
    "20ml",
    "🍷",
    "양념"
  ],
  "파스타": [
    "200g",
    "🍝",
    "면·밥"
  ],
  "닭발": [
    "200g",
    "🍗",
    "육류"
  ],
  "갓": [
    "50g",
    "🥬",
    "채소"
  ],
  "송아지고기": [
    "200g",
    "🥩",
    "육류"
  ],
  "연어알": [
    "30g",
    "🐟",
    "해산물"
  ],
  "소간": [
    "150g",
    "🥩",
    "육류"
  ],
  "참외": [
    "200g",
    "🍈",
    "기타"
  ],
  "살사베르데": [
    "50ml",
    "🌶",
    "소스"
  ],
  "기름": [
    "15ml",
    "🫙",
    "기름"
  ],
  "석류": [
    "100g",
    "🍎",
    "기타"
  ],
  "산초가루": [
    "3g",
    "🌿",
    "양념"
  ],
  "돼지창자": [
    "200g",
    "🥩",
    "육류"
  ],
  "베샤멜소스": [
    "100ml",
    "🫙",
    "소스"
  ],
  "깍두기": [
    "100g",
    "🥗",
    "채소"
  ],
  "박하잎": [
    "10g",
    "🌿",
    "채소"
  ],
  "얌": [
    "150g",
    "🥔",
    "채소"
  ],
  "플랜테인": [
    "150g",
    "🍌",
    "채소"
  ],
  "호박": [
    "150g",
    "🎃",
    "채소"
  ],
  "타피오카가루": [
    "50g",
    "🌾",
    "기타"
  ],
  "정향": [
    "3g",
    "🌿",
    "양념"
  ],
  "홀스래디시": [
    "20g",
    "🌿",
    "양념"
  ],
  "홍차": [
    "200ml",
    "🍵",
    "기타"
  ],
  "미더덕": [
    "100g",
    "🐚",
    "해산물"
  ],
  "템페": [
    "150g",
    "🫘",
    "단백질"
  ],
  "소혀": [
    "200g",
    "🥩",
    "육류"
  ],
  "케찹": [
    "30ml",
    "🫙",
    "소스"
  ],
  "아마란스": [
    "80g",
    "🌾",
    "면·밥"
  ],
  "달콤한 팥앙금": [
    "50g",
    "🫘",
    "기타"
  ],
  "무즙": [
    "50ml",
    "🌿",
    "채소"
  ],
  "치포틀레": [
    "20g",
    "🌶",
    "양념"
  ],
  "딸기잼": [
    "30g",
    "🫙",
    "기타"
  ],
  "닭껍질": [
    "100g",
    "🍗",
    "육류"
  ],
  "견과류": [
    "30g",
    "🥜",
    "견과"
  ],
  "채소": [
    "100g",
    "🥦",
    "채소"
  ],
  "마스카르포네": [
    "100g",
    "🧀",
    "유제품"
  ],
  "메기": [
    "200g",
    "🐟",
    "해산물"
  ],
  "사케": [
    "30ml",
    "🍶",
    "양념"
  ],
  "오리기름": [
    "15ml",
    "🫙",
    "기름"
  ],
  "흑후추": [
    "3g",
    "🌿",
    "양념"
  ],
  "판체타": [
    "80g",
    "🥩",
    "육류"
  ],
  "오리훈제": [
    "150g",
    "🦆",
    "육류"
  ],
  "백후추": [
    "약간",
    "🌿",
    "양념"
  ],
  "카카오파우더": [
    "2큰술",
    "🍫",
    "기타"
  ],
  "디종머스터드": [
    "1큰술",
    "🫙",
    "양념"
  ],
  "허브드프로방스": [
    "1작은술",
    "🌿",
    "양념"
  ],
  "토마토페이스트": [
    "2큰술",
    "🍅",
    "양념"
  ],
  "크레임프레쉬": [
    "3큰술",
    "🥛",
    "단백질"
  ],
  "그뤼에르치즈": [
    "50g",
    "🧀",
    "단백질"
  ],
  "에멘탈치즈": [
    "50g",
    "🧀",
    "단백질"
  ],
  "앤초비페이스트": [
    "1큰술",
    "🫙",
    "양념"
  ],
  "동치미": [
    "300ml",
    "🥣",
    "양념"
  ],
  "망고처트니": [
    "2큰술",
    "🥭",
    "양념"
  ],
  "고형카레": [
    "40g",
    "🍛",
    "양념"
  ],
  "통삼겹": [
    "300g",
    "🥩",
    "단백질"
  ],
  "참치회": [
    "200g",
    "🐟",
    "단백질"
  ],
  "참치살": [
    "200g",
    "🐟",
    "단백질"
  ],
  "참치포": [
    "100g",
    "🐟",
    "단백질"
  ],
  "돼지기름": [
    "1큰술",
    "🫙",
    "양념"
  ],
  "닭봉": [
    "300g",
    "🍗",
    "단백질"
  ],
  "가쓰오부시육수": [
    "300ml",
    "🍵",
    "기타"
  ],
  "유자청": [
    "2큰술",
    "🍋",
    "양념"
  ],
  "청주": [
    "30ml",
    "🍶",
    "양념"
  ],
  "가다랑어포": [
    "10g",
    "🐟",
    "해산물"
  ],
  "갈란갈": [
    "10g",
    "🌿",
    "채소"
  ],
  "강황잎": [
    "5g",
    "🌿",
    "채소"
  ],
  "건새우": [
    "20g",
    "🦐",
    "해산물"
  ],
  "검정콩": [
    "100g",
    "🫘",
    "단백질"
  ],
  "고수씨": [
    "5g",
    "🌿",
    "양념"
  ],
  "고추파우더": [
    "5g",
    "🌶",
    "양념"
  ],
  "과카몰레": [
    "50g",
    "🥑",
    "소스"
  ],
  "국멸치": [
    "30g",
    "🐟",
    "해산물"
  ],
  "그릭요거트": [
    "150g",
    "🥛",
    "유제품"
  ],
  "그린올리브": [
    "50g",
    "🫒",
    "채소"
  ],
  "그린파파야": [
    "200g",
    "🍈",
    "채소"
  ],
  "껍질콩": [
    "100g",
    "🫘",
    "채소"
  ],
  "나루토": [
    "30g",
    "🍥",
    "가공식품"
  ],
  "넛맥": [
    "2g",
    "🌿",
    "양념"
  ],
  "노란페퍼": [
    "30g",
    "🌶",
    "채소"
  ],
  "달콤한간장": [
    "30ml",
    "🫙",
    "소스"
  ],
  "달팽이": [
    "100g",
    "🐌",
    "해산물"
  ],
  "닭허벅지살": [
    "200g",
    "🍗",
    "육류"
  ],
  "대추야자": [
    "50g",
    "🌴",
    "기타"
  ],
  "돼지 삼겹살": [
    "200g",
    "🥩",
    "육류"
  ],
  "돼지 스페어립": [
    "300g",
    "🥩",
    "육류"
  ],
  "돼지고기 다짐육": [
    "150g",
    "🥩",
    "육류"
  ],
  "돼지고기 목살": [
    "200g",
    "🥩",
    "육류"
  ],
  "돼지고기 소시지 다짐육": [
    "150g",
    "🥩",
    "육류"
  ],
  "돼지고기 앞다리살": [
    "200g",
    "🥩",
    "육류"
  ],
  "돼지껍질": [
    "200g",
    "🥩",
    "육류"
  ],
  "디종머스타드": [
    "15g",
    "🫙",
    "소스"
  ],
  "딥소스": [
    "30ml",
    "🫙",
    "소스"
  ],
  "또르티야": [
    "2장",
    "🫓",
    "면·밥"
  ],
  "라드": [
    "20g",
    "🫙",
    "기름"
  ],
  "라멘": [
    "100g",
    "🍜",
    "면·밥"
  ],
  "래디시": [
    "50g",
    "🌿",
    "채소"
  ],
  "레드와인식초": [
    "30ml",
    "🍷",
    "양념"
  ],
  "렌틸가루": [
    "100g",
    "🫘",
    "기타"
  ],
  "로메인상추": [
    "100g",
    "🥬",
    "채소"
  ],
  "로코토페퍼": [
    "30g",
    "🌶",
    "채소"
  ],
  "리마빈": [
    "100g",
    "🫘",
    "단백질"
  ],
  "마늘버터": [
    "30g",
    "🧄",
    "소스"
  ],
  "마늘파우더": [
    "5g",
    "🧄",
    "양념"
  ],
  "머스타드씨": [
    "5g",
    "🌿",
    "양념"
  ],
  "멸치액젓": [
    "15ml",
    "🫙",
    "양념"
  ],
  "모짜렐라치즈": [
    "100g",
    "🧀",
    "유제품"
  ],
  "미소": [
    "30g",
    "🫙",
    "양념"
  ],
  "밀": [
    "100g",
    "🌾",
    "면·밥"
  ],
  "발사믹식초": [
    "30ml",
    "🍷",
    "양념"
  ],
  "버섯수프": [
    "200ml",
    "🍄",
    "기타"
  ],
  "버터밀크": [
    "200ml",
    "🥛",
    "유제품"
  ],
  "베이킹소다": [
    "3g",
    "🫙",
    "기타"
  ],
  "부라타치즈": [
    "125g",
    "🧀",
    "유제품"
  ],
  "붉은양파": [
    "100g",
    "🧅",
    "채소"
  ],
  "브라운슈거": [
    "30g",
    "🍬",
    "양념"
  ],
  "블랙아이드피": [
    "100g",
    "🫘",
    "단백질"
  ],
  "살사 로하": [
    "50ml",
    "🫙",
    "소스"
  ],
  "삼발": [
    "20g",
    "🌶",
    "소스"
  ],
  "새우튀김": [
    "100g",
    "🍤",
    "해산물"
  ],
  "샬롯": [
    "30g",
    "🧅",
    "채소"
  ],
  "석류시럽": [
    "30ml",
    "🫙",
    "소스"
  ],
  "석류씨": [
    "30g",
    "🍎",
    "기타"
  ],
  "세몰리나": [
    "100g",
    "🌾",
    "면·밥"
  ],
  "셀러리씨": [
    "5g",
    "🌿",
    "양념"
  ],
  "소고기 갈비": [
    "300g",
    "🥩",
    "육류"
  ],
  "소고기 다짐육": [
    "150g",
    "🥩",
    "육류"
  ],
  "소고기 우둔살": [
    "200g",
    "🥩",
    "육류"
  ],
  "소고기다짐육": [
    "150g",
    "🥩",
    "육류"
  ],
  "순무": [
    "150g",
    "🌿",
    "채소"
  ],
  "스위트칠리소스": [
    "30ml",
    "🫙",
    "소스"
  ],
  "썬드라이토마토": [
    "30g",
    "🍅",
    "채소"
  ],
  "아마리요페퍼": [
    "30g",
    "🌶",
    "채소"
  ],
  "아티초크": [
    "100g",
    "🌿",
    "채소"
  ],
  "안두이 소시지": [
    "100g",
    "🌭",
    "육류"
  ],
  "야채튀김": [
    "100g",
    "🥦",
    "채소"
  ],
  "양고기 다짐육": [
    "150g",
    "🥩",
    "육류"
  ],
  "양고기 등심": [
    "200g",
    "🥩",
    "육류"
  ],
  "양귀비씨": [
    "5g",
    "🌿",
    "기타"
  ],
  "양파링": [
    "50g",
    "🧅",
    "채소"
  ],
  "양파파우더": [
    "5g",
    "🧅",
    "양념"
  ],
  "어린잎채소": [
    "50g",
    "🥬",
    "채소"
  ],
  "에그누들": [
    "200g",
    "🍜",
    "면·밥"
  ],
  "연잎": [
    "2장",
    "🌿",
    "기타"
  ],
  "오징어 다리": [
    "100g",
    "🦑",
    "해산물"
  ],
  "오징어 몸통": [
    "200g",
    "🦑",
    "해산물"
  ],
  "오향분": [
    "5g",
    "🌿",
    "양념"
  ],
  "우동면": [
    "200g",
    "🍜",
    "면·밥"
  ],
  "장미수": [
    "10ml",
    "🌹",
    "기타"
  ],
  "중국소시지": [
    "50g",
    "🌭",
    "육류"
  ],
  "쫄면": [
    "200g",
    "🍜",
    "면·밥"
  ],
  "쯔유": [
    "50ml",
    "🫙",
    "소스"
  ],
  "차슈": [
    "100g",
    "🥩",
    "육류"
  ],
  "참마": [
    "150g",
    "🌿",
    "채소"
  ],
  "참치 등살 (아카미)": [
    "150g",
    "🐟",
    "해산물"
  ],
  "참치 뱃살 (오토로)": [
    "100g",
    "🐟",
    "해산물"
  ],
  "참치 중뱃살 (중토로)": [
    "120g",
    "🐟",
    "해산물"
  ],
  "찹쌀풀": [
    "30g",
    "🌾",
    "양념"
  ],
  "체다치즈": [
    "50g",
    "🧀",
    "유제품"
  ],
  "체리토마토": [
    "100g",
    "🍅",
    "채소"
  ],
  "초초클로옥수수": [
    "100g",
    "🌽",
    "채소"
  ],
  "치커리": [
    "80g",
    "🥬",
    "채소"
  ],
  "치킨": [
    "200g",
    "🍗",
    "육류"
  ],
  "칠리소스": [
    "30ml",
    "🌶",
    "소스"
  ],
  "카사바": [
    "200g",
    "🥔",
    "채소"
  ],
  "카야잼": [
    "50g",
    "🫙",
    "기타"
  ],
  "카옌느페퍼": [
    "3g",
    "🌶",
    "양념"
  ],
  "커큐민": [
    "3g",
    "🌿",
    "양념"
  ],
  "케이준시즈닝": [
    "10g",
    "🌿",
    "양념"
  ],
  "케팔로티리치즈": [
    "100g",
    "🧀",
    "유제품"
  ],
  "케피르": [
    "200ml",
    "🥛",
    "유제품"
  ],
  "코코넛잎": [
    "2장",
    "🌿",
    "기타"
  ],
  "코티하치즈": [
    "50g",
    "🧀",
    "유제품"
  ],
  "퀘소프레스코": [
    "50g",
    "🧀",
    "유제품"
  ],
  "퀴노아": [
    "80g",
    "🌾",
    "면·밥"
  ],
  "크레마": [
    "30ml",
    "🥛",
    "유제품"
  ],
  "크루통": [
    "30g",
    "🍞",
    "기타"
  ],
  "토마티요": [
    "150g",
    "🍅",
    "채소"
  ],
  "통밀가루": [
    "100g",
    "🌾",
    "면·밥"
  ],
  "통후추": [
    "5g",
    "🌿",
    "양념"
  ],
  "파": [
    "30g",
    "🌿",
    "채소"
  ],
  "피스타치오": [
    "30g",
    "🥜",
    "견과"
  ],
  "핀토콩": [
    "100g",
    "🫘",
    "단백질"
  ],
  "필로도우": [
    "100g",
    "🫓",
    "기타"
  ],
  "호박잎": [
    "50g",
    "🌿",
    "채소"
  ],
  "홍피망": [
    "100g",
    "🫑",
    "채소"
  ],
  "화자오": [
    "5g",
    "🌿",
    "양념"
  ],
  "훈제연어": [
    "120g",
    "🐟",
    "해산물"
  ],
  "흑돼지 삼겹살": [
    "200g",
    "🥩",
    "육류"
  ]
};
  window.ingObj = function ingObj(name){
    const m=STD_ING[name] || ["적당량", (typeof getIcon==='function'?getIcon(name):'🥬'), "기타"];
    return {name, amount:m[0], icon:m[1], category:m[2]};
  }
  

// ══════════════════════════════════════
// MENU_NUT 비활성화
// 메뉴 단위 고정 칼로리/영양값은 사용하지 않는다.
// 모든 영양 계산은 MENU_DB 또는 MENU_SCHEMA_V2의 재료 중량과 NUTRITION_DB 합산으로만 수행한다.
// ══════════════════════════════════════
const MENU_NUT = Object.freeze({});
window.MENU_NUT_DISABLED = true;

// ── 신규 메뉴 영양 데이터 (실측 기반 1인분) ──
const MENU_NUT_EXTRA = {"된장찌개": {"cal": 130, "pro": 9.0, "carb": 9.0, "fat": 6.0}, "김치찌개": {"cal": 210, "pro": 18.0, "carb": 8.0, "fat": 12.0}, "참치김치찌개": {"cal": 170, "pro": 15.0, "carb": 8.0, "fat": 9.0}, "순두부찌개": {"cal": 160, "pro": 12.0, "carb": 6.0, "fat": 10.0}, "해물순두부찌개": {"cal": 160, "pro": 14.0, "carb": 8.0, "fat": 8.0}, "부대찌개": {"cal": 340, "pro": 20.0, "carb": 12.0, "fat": 24.0}, "청국장찌개": {"cal": 180, "pro": 14.0, "carb": 14.0, "fat": 8.0}, "감자탕": {"cal": 510, "pro": 45.0, "carb": 22.0, "fat": 27.0}, "동태찌개": {"cal": 160, "pro": 20.0, "carb": 8.0, "fat": 5.0}, "꽃게탕": {"cal": 210, "pro": 24.0, "carb": 12.0, "fat": 7.0}, "미역국": {"cal": 65, "pro": 4.0, "carb": 3.0, "fat": 4.5}, "소고기뭇국": {"cal": 110, "pro": 12.0, "carb": 4.0, "fat": 5.0}, "콩나물국": {"cal": 40, "pro": 3.0, "carb": 4.0, "fat": 2.0}, "북어국": {"cal": 90, "pro": 12.0, "carb": 2.0, "fat": 3.8}, "육개장": {"cal": 240, "pro": 19.0, "carb": 14.0, "fat": 12.0}, "갈비탕": {"cal": 420, "pro": 35.0, "carb": 10.0, "fat": 26.0}, "삼계탕": {"cal": 680, "pro": 65.0, "carb": 15.0, "fat": 38.0}, "제육볶음": {"cal": 310, "pro": 22.0, "carb": 10.0, "fat": 20.0}, "간장제육볶음": {"cal": 380, "pro": 28.0, "carb": 12.0, "fat": 24.0}, "소불고기": {"cal": 290, "pro": 24.0, "carb": 14.0, "fat": 15.0}, "돼지불고기": {"cal": 320, "pro": 24.0, "carb": 12.0, "fat": 19.0}, "닭갈비": {"cal": 390, "pro": 32.0, "carb": 16.0, "fat": 22.0}, "닭볶음탕": {"cal": 370, "pro": 34.0, "carb": 16.0, "fat": 19.0}, "찜닭": {"cal": 380, "pro": 32.0, "carb": 24.0, "fat": 17.0}, "갈비찜": {"cal": 450, "pro": 32.0, "carb": 15.0, "fat": 28.0}, "돼지갈비찜": {"cal": 430, "pro": 28.0, "carb": 14.0, "fat": 29.0}, "보쌈": {"cal": 520, "pro": 28.0, "carb": 2.0, "fat": 45.0}, "수육": {"cal": 420, "carb": 0, "pro": 27, "fat": 34}, "오징어볶음": {"cal": 190, "pro": 20.0, "carb": 11.0, "fat": 7.0}, "낙지볶음": {"cal": 190, "pro": 20.0, "carb": 14.0, "fat": 6.0}, "주꾸미볶음": {"cal": 220, "pro": 22.0, "carb": 14.0, "fat": 8.0}, "고등어구이": {"cal": 290, "pro": 27.0, "carb": 0.2, "fat": 20.0}, "고등어조림": {"cal": 310, "pro": 28.0, "carb": 10.0, "fat": 17.0}, "갈치조림": {"cal": 310, "pro": 32.0, "carb": 14.0, "fat": 13.0}, "삼치구이": {"cal": 260, "pro": 29.0, "carb": 0.2, "fat": 15.0}, "비빔밥": {"cal": 530, "pro": 17.0, "carb": 84.0, "fat": 14.0}, "김치볶음밥": {"cal": 430, "pro": 12.0, "carb": 72.0, "fat": 11.0}, "새우볶음밥": {"cal": 430, "pro": 16.0, "carb": 66.0, "fat": 11.0}, "오므라이스": {"cal": 580, "pro": 15.0, "carb": 78.0, "fat": 23.0}, "카레라이스": {"cal": 620, "pro": 16.0, "carb": 102.0, "fat": 16.0}, "콩나물밥": {"cal": 380, "pro": 9.0, "carb": 76.0, "fat": 4.0}, "김밥": {"cal": 420, "pro": 12.0, "carb": 72.0, "fat": 9.0}, "떡국": {"cal": 430, "pro": 16.0, "carb": 78.0, "fat": 6.0}, "떡볶이": {"cal": 360, "pro": 7.0, "carb": 70.0, "fat": 5.0}, "라볶이": {"cal": 450, "pro": 10.0, "carb": 85.0, "fat": 7.0}, "잡채": {"cal": 140, "pro": 2.0, "carb": 22.0, "fat": 5.0}, "잔치국수": {"cal": 380, "pro": 12.0, "carb": 74.0, "fat": 4.0}, "비빔국수": {"cal": 490, "pro": 11.0, "carb": 84.0, "fat": 11.0}, "칼국수": {"cal": 410, "pro": 12.0, "carb": 82.0, "fat": 4.0}, "수제비": {"cal": 410, "pro": 11.0, "carb": 82.0, "fat": 4.0}, "김치전": {"cal": 240, "pro": 5.0, "carb": 32.0, "fat": 10.0}, "해물파전": {"cal": 380, "pro": 12.0, "carb": 44.0, "fat": 16.0}, "감자전": {"cal": 230, "pro": 3.0, "carb": 34.0, "fat": 9.0}, "계란말이": {"cal": 210, "pro": 14.0, "carb": 3.0, "fat": 16.0}, "계란찜": {"cal": 90, "pro": 8.0, "carb": 2.0, "fat": 6.0}, "두부조림": {"cal": 150, "pro": 11.0, "carb": 7.0, "fat": 8.0}, "장조림": {"cal": 75, "pro": 12.0, "carb": 2.0, "fat": 2.0}, "멸치볶음": {"cal": 70, "pro": 5.0, "carb": 4.0, "fat": 3.5}, "어묵볶음": {"cal": 120, "pro": 6.0, "carb": 10.0, "fat": 6.0}, "시금치나물": {"cal": 35, "pro": 2.0, "carb": 3.0, "fat": 1.8}, "콩나물무침": {"cal": 30, "pro": 2.0, "carb": 3.0, "fat": 1.0}, "오이무침": {"cal": 35, "pro": 1.0, "carb": 5.0, "fat": 1.2}, "무생채": {"cal": 25, "pro": 0.5, "carb": 4.0, "fat": 0.2}, "오이소박이": {"cal": 30, "pro": 1.2, "carb": 5.0, "fat": 0.3}, "규동": {"cal": 560, "pro": 24.0, "carb": 78.0, "fat": 17.0}, "오야코동": {"cal": 560, "pro": 25.0, "carb": 74.0, "fat": 19.0}, "가츠동": {"cal": 808, "pro": 36.0, "carb": 106.0, "fat": 25.0}, "텐동": {"cal": 750, "pro": 18.0, "carb": 98.0, "fat": 32.0}, "카레우동": {"cal": 490, "pro": 14.0, "carb": 78.0, "fat": 13.0}, "유부우동": {"cal": 430, "pro": 14.0, "carb": 72.0, "fat": 9.0}, "야키소바": {"cal": 480, "pro": 12.0, "carb": 68.0, "fat": 18.0}, "쇼유라멘": {"cal": 430, "pro": 16.0, "carb": 70.0, "fat": 9.0}, "미소라멘": {"cal": 520, "pro": 18.0, "carb": 75.0, "fat": 16.0}, "돈코츠라멘": {"cal": 620, "pro": 26.0, "carb": 76.0, "fat": 24.0}, "돈카츠": {"cal": 410, "pro": 24.0, "carb": 18.0, "fat": 28.0}, "치킨카츠": {"cal": 380, "pro": 24.0, "carb": 18.0, "fat": 24.0}, "가라아게": {"cal": 400, "pro": 32.0, "carb": 10.0, "fat": 26.0}, "데리야키치킨": {"cal": 310, "pro": 28.0, "carb": 12.0, "fat": 16.0}, "연어데리야키": {"cal": 320, "pro": 28.0, "carb": 10.0, "fat": 18.0}, "사바미소니": {"cal": 320, "pro": 24.0, "carb": 8.0, "fat": 21.0}, "오코노미야키": {"cal": 360, "pro": 14.0, "carb": 34.0, "fat": 19.0}, "타코야키": {"cal": 260, "pro": 7.0, "carb": 34.0, "fat": 11.0}, "니쿠자가": {"cal": 260, "pro": 14.0, "carb": 24.0, "fat": 12.0}, "스키야키": {"cal": 380, "pro": 24.0, "carb": 18.0, "fat": 22.0}, "샤브샤브": {"cal": 340, "pro": 32.0, "carb": 12.0, "fat": 16.0}, "미소국": {"cal": 40, "pro": 3.0, "carb": 4.0, "fat": 1.0}, "차완무시": {"cal": 90, "pro": 8.0, "carb": 3.0, "fat": 5.0}, "이나리초밥": {"cal": 320, "pro": 9.0, "carb": 54.0, "fat": 7.0}, "연어초밥": {"cal": 480, "pro": 22.0, "carb": 68.0, "fat": 13.0}, "참치마요오니기리": {"cal": 210, "pro": 5.0, "carb": 36.0, "fat": 5.0}, "명란오니기리": {"cal": 260, "pro": 7.0, "carb": 48.0, "fat": 4.0}, "일본식계란말이": {"cal": 150, "pro": 10.0, "carb": 8.0, "fat": 9.0}, "자루소바": {"cal": 340, "pro": 12.0, "carb": 68.0, "fat": 2.0}, "나베야키우동": {"cal": 460, "pro": 16.0, "carb": 82.0, "fat": 7.0}, "일본식 카레라이스": {"cal": 620, "pro": 16.0, "carb": 102.0, "fat": 16.0}, "마파두부": {"cal": 240, "pro": 14.0, "carb": 10.0, "fat": 16.0}, "짜장면": {"cal": 680, "pro": 18.0, "carb": 110.0, "fat": 19.0}, "짬뽕": {"cal": 560, "pro": 23.0, "carb": 84.0, "fat": 15.0}, "계란볶음밥": {"cal": 410, "pro": 12.0, "carb": 66.0, "fat": 10.0}, "탕수육": {"cal": 460, "pro": 16.0, "carb": 44.0, "fat": 24.0}, "깐풍기": {"cal": 440, "pro": 22.0, "carb": 26.0, "fat": 28.0}, "유린기": {"cal": 410, "pro": 20.0, "carb": 28.0, "fat": 24.0}, "깐쇼새우": {"cal": 340, "pro": 16.0, "carb": 28.0, "fat": 18.0}, "칠리새우": {"cal": 320, "pro": 16.0, "carb": 26.0, "fat": 16.0}, "고추잡채": {"cal": 230, "pro": 15.0, "carb": 12.0, "fat": 14.0}, "꽃빵고추잡채": {"cal": 360, "pro": 18.0, "carb": 45.0, "fat": 12.0}, "양장피": {"cal": 290, "pro": 16.0, "carb": 24.0, "fat": 15.0}, "팔보채": {"cal": 240, "pro": 22.0, "carb": 14.0, "fat": 12.0}, "마라탕": {"cal": 420, "pro": 22.0, "carb": 25.0, "fat": 26.0}, "마라샹궈": {"cal": 480, "pro": 24.0, "carb": 18.0, "fat": 36.0}, "동파육": {"cal": 510, "pro": 22.0, "carb": 8.0, "fat": 44.0}, "훠궈": {"cal": 520, "pro": 32.0, "carb": 18.0, "fat": 36.0}, "군만두": {"cal": 250, "pro": 9.0, "carb": 25.0, "fat": 13.0}, "물만두": {"cal": 210, "pro": 9.0, "carb": 22.0, "fat": 9.0}, "완탕면": {"cal": 420, "pro": 18.0, "carb": 62.0, "fat": 11.0}, "탄탄면": {"cal": 620, "pro": 21.0, "carb": 78.0, "fat": 25.0}, "꿔바로우": {"cal": 480, "pro": 16.0, "carb": 42.0, "fat": 28.0}, "토마토계란볶음": {"cal": 210, "pro": 9.0, "carb": 8.0, "fat": 16.0}, "청경채굴소스볶음": {"cal": 75, "pro": 2.0, "carb": 6.0, "fat": 5.0}, "가지볶음": {"cal": 58, "pro": 2.0, "carb": 10.0, "fat": 2.0}, "해물누룽지탕": {"cal": 310, "pro": 19.0, "carb": 38.0, "fat": 9.0}, "어향가지": {"cal": 180, "pro": 3.0, "carb": 14.0, "fat": 13.0}, "팟타이": {"cal": 560, "pro": 21.0, "carb": 72.0, "fat": 21.0}, "팟씨유": {"cal": 520, "pro": 19.0, "carb": 64.0, "fat": 21.0}, "카오팟": {"cal": 580, "pro": 18.0, "carb": 78.0, "fat": 22.0}, "카오만가이": {"cal": 590, "pro": 28.0, "carb": 72.0, "fat": 21.0}, "똠얌꿍": {"cal": 180, "pro": 18.0, "carb": 10.0, "fat": 8.0}, "그린커리": {"cal": 360, "pro": 20.0, "carb": 14.0, "fat": 25.0}, "레드커리": {"cal": 380, "pro": 18.0, "carb": 15.0, "fat": 26.0}, "쏨땀": {"cal": 110, "pro": 3.0, "carb": 16.0, "fat": 4.0}, "카오소이": {"cal": 540, "pro": 22.0, "carb": 58.0, "fat": 25.0}, "쌀국수": {"cal": 390, "pro": 14.0, "carb": 75.0, "fat": 3.5}, "반미": {"cal": 430, "pro": 16.0, "carb": 54.0, "fat": 16.0}, "분짜": {"cal": 520, "pro": 24.0, "carb": 72.0, "fat": 15.0}, "고이꾸온": {"cal": 190, "pro": 12.0, "carb": 26.0, "fat": 4.0}, "짜조": {"cal": 270, "pro": 9.0, "carb": 24.0, "fat": 15.0}, "반쎄오": {"cal": 390, "pro": 14.0, "carb": 44.0, "fat": 17.0}, "분보후에": {"cal": 480, "pro": 24.0, "carb": 68.0, "fat": 12.0}, "껌승": {"cal": 620, "carb": 82, "pro": 31, "fat": 18}, "나시고랭": {"cal": 460, "pro": 15.0, "carb": 68.0, "fat": 14.0}, "미고랭": {"cal": 480, "pro": 11.0, "carb": 72.0, "fat": 16.0}, "비프 렌당": {"cal": 430, "pro": 28.0, "carb": 10.0, "fat": 30.0}, "사테아얌": {"cal": 280, "pro": 24.0, "carb": 8.0, "fat": 16.0}, "가도가도": {"cal": 315, "pro": 12.0, "carb": 28.0, "fat": 16.0}, "락사": {"cal": 520, "pro": 22.0, "carb": 68.0, "fat": 18.0}, "나시르막": {"cal": 580, "pro": 16.0, "carb": 75.0, "fat": 24.0}, "차퀘이테오": {"cal": 580, "pro": 18.0, "carb": 72.0, "fat": 24.0}, "치킨커리말레이": {"cal": 390, "pro": 28.0, "carb": 15.0, "fat": 24.0}, "하이난 치킨라이스": {"cal": 610, "pro": 32.0, "carb": 74.0, "fat": 19.0}, "칠리크랩": {"cal": 420, "pro": 32.0, "carb": 28.0, "fat": 20.0}, "바쿠테": {"cal": 390, "pro": 34.0, "carb": 6.0, "fat": 26.0}, "싱가포르락사": {"cal": 540, "pro": 22.0, "carb": 68.0, "fat": 20.0}, "치킨아도보": {"cal": 360, "pro": 32.0, "carb": 6.0, "fat": 24.0}, "포크아도보": {"cal": 390, "pro": 31.0, "carb": 7.0, "fat": 26.0}, "시니강": {"cal": 210, "pro": 20.0, "carb": 12.0, "fat": 8.0}, "판싯": {"cal": 420, "pro": 16.0, "carb": 58.0, "fat": 14.0}, "알리오올리오": {"cal": 460, "pro": 9.0, "carb": 62.0, "fat": 20.0}, "봉골레파스타": {"cal": 470, "pro": 16.0, "carb": 66.0, "fat": 15.0}, "토마토파스타": {"cal": 420, "pro": 12.0, "carb": 68.0, "fat": 11.0}, "카르보나라": {"cal": 650, "pro": 22.0, "carb": 64.0, "fat": 34.0}, "볼로네제파스타": {"cal": 540, "pro": 22.0, "carb": 70.0, "fat": 19.0}, "라자냐": {"cal": 480, "pro": 26.0, "carb": 36.0, "fat": 25.0}, "마르게리타피자": {"cal": 430, "pro": 16.0, "carb": 48.0, "fat": 19.0}, "리조또": {"cal": 410, "pro": 11.0, "carb": 62.0, "fat": 13.0}, "치킨스테이크": {"cal": 320, "pro": 34.0, "carb": 2.0, "fat": 20.0}, "안심스테이크": {"cal": 290, "carb": 0, "pro": 32, "fat": 17}, "립아이스테이크": {"cal": 540, "carb": 0, "pro": 44, "fat": 40}, "채끝스테이크": {"cal": 340, "carb": 0, "pro": 33, "fat": 22}, "티본스테이크": {"cal": 640, "carb": 0, "pro": 58, "fat": 46}, "포터하우스스테이크": {"cal": 740, "carb": 0, "pro": 66, "fat": 52}, "토마호크스테이크": {"cal": 780, "carb": 0, "pro": 68, "fat": 56}, "살치살스테이크": {"cal": 390, "carb": 0, "pro": 29, "fat": 30}, "부채살스테이크": {"cal": 280, "carb": 0, "pro": 31, "fat": 16}, "함박스테이크": {"cal": 410, "pro": 24.0, "carb": 14.0, "fat": 28.0}, "비프스튜": {"cal": 310, "pro": 24.0, "carb": 14.0, "fat": 17.0}, "클램차우더": {"cal": 240, "pro": 9.0, "carb": 22.0, "fat": 13.0}, "시저샐러드": {"cal": 210, "pro": 6.0, "carb": 8.0, "fat": 17.0}, "코울슬로": {"cal": 120, "pro": 1.0, "carb": 14.0, "fat": 7.0}, "감자그라탕": {"cal": 340, "pro": 10.0, "carb": 32.0, "fat": 19.0}, "프렌치토스트": {"cal": 340, "pro": 10.0, "carb": 42.0, "fat": 14.0}, "클럽샌드위치": {"cal": 480, "pro": 24.0, "carb": 38.0, "fat": 26.0}, "오믈렛": {"cal": 190, "pro": 12.0, "carb": 2.0, "fat": 15.0}, "토마토수프": {"cal": 120, "pro": 3.0, "carb": 16.0, "fat": 5.0}, "비프타코": {"cal": 380, "pro": 20.0, "carb": 32.0, "fat": 19.0}, "치킨타코": {"cal": 340, "pro": 18.0, "carb": 28.0, "fat": 16.0}, "치킨부리토": {"cal": 620, "pro": 32.0, "carb": 68.0, "fat": 24.0}, "퀘사디야": {"cal": 540, "pro": 24.0, "carb": 42.0, "fat": 31.0}, "칠리콘카르네": {"cal": 360, "pro": 22.0, "carb": 24.0, "fat": 20.0}, "나초": {"cal": 250, "pro": 4.0, "carb": 32.0, "fat": 12.0}, "과카몰레": {"cal": 160, "carb": 9, "pro": 2, "fat": 15}, "치킨티카마살라": {"cal": 420, "pro": 28.0, "carb": 14.0, "fat": 28.0}, "버터치킨": {"cal": 390, "pro": 24.0, "carb": 12.0, "fat": 27.0}, "팔락파니르": {"cal": 260, "pro": 12.0, "carb": 11.0, "fat": 20.0}, "달커리": {"cal": 190, "pro": 9.0, "carb": 24.0, "fat": 6.0}, "알루고비": {"cal": 180, "pro": 4.0, "carb": 22.0, "fat": 9.0}, "비리야니": {"cal": 510, "pro": 22.0, "carb": 72.0, "fat": 15.0}, "치킨케밥": {"cal": 420, "pro": 26.0, "carb": 32.0, "fat": 21.0}, "메네멘": {"cal": 210, "pro": 12.0, "carb": 8.0, "fat": 14.0}, "렌틸수프": {"cal": 160, "pro": 9.0, "carb": 24.0, "fat": 3.0}, "그릭샐러드": {"cal": 160, "pro": 5.0, "carb": 9.0, "fat": 13.0}, "무사카": {"cal": 380, "pro": 20.0, "carb": 22.0, "fat": 24.0}, "수블라키": {"cal": 260, "pro": 26.0, "carb": 4.0, "fat": 15.0}, "닭가슴살샐러드": {"cal": 185, "pro": 24.0, "carb": 8.0, "fat": 6.0}, "연어포케": {"cal": 430, "pro": 24.0, "carb": 52.0, "fat": 14.0}, "두부포케": {"cal": 390, "pro": 15.0, "carb": 54.0, "fat": 12.0}, "그릭요거트볼": {"cal": 210, "pro": 12.0, "carb": 18.0, "fat": 10.0}, "오트밀": {"cal": 150, "pro": 5.0, "carb": 27.0, "fat": 3.0}, "현미채소덮밥": {"cal": 410, "pro": 9.0, "carb": 78.0, "fat": 6.0}, "두부스테이크": {"cal": 180, "pro": 12.0, "carb": 10.0, "fat": 10.0}, "렌틸콩샐러드": {"cal": 180, "pro": 8.0, "carb": 22.0, "fat": 6.0}, "계란아보카도토스트": {"cal": 360, "pro": 12.0, "carb": 28.0, "fat": 22.0}, "닭가슴살카레": {"cal": 340, "pro": 25.0, "carb": 42.0, "fat": 8.0}, "등갈비찜": {"cal": 410, "pro": 30.0, "carb": 12.0, "fat": 26.0}, "황태국": {"cal": 80, "pro": 12.0, "carb": 2.0, "fat": 3.0}, "콩나물해장국": {"cal": 310, "pro": 12.0, "carb": 58.0, "fat": 3.0}, "닭개장": {"cal": 260, "pro": 28.0, "carb": 10.0, "fat": 12.0}, "설렁탕": {"cal": 240, "pro": 28.0, "carb": 4.0, "fat": 12.0}, "돌솥비빔밥": {"cal": 560, "pro": 18.0, "carb": 85.0, "fat": 16.0}, "쌈밥": {"cal": 360, "pro": 11.0, "carb": 62.0, "fat": 7.0}, "유부초밥": {"cal": 320, "pro": 9.0, "carb": 54.0, "fat": 7.0}, "닭곰탕": {"cal": 190, "pro": 28.0, "carb": 4.0, "fat": 7.0}, "소고기미역국": {"cal": 130, "pro": 14.0, "carb": 3.0, "fat": 7.0}, "두루치기": {"cal": 350, "pro": 24.0, "carb": 11.0, "fat": 23.0}, "고추장불고기": {"cal": 360, "pro": 26.0, "carb": 14.0, "fat": 22.0}, "묵은지삼겹살": {"cal": 540, "pro": 22.0, "carb": 6.0, "fat": 48.0}, "우거지갈비찜": {"cal": 340, "pro": 24.0, "carb": 12.0, "fat": 22.0}, "약밥": {"cal": 310, "pro": 4.0, "carb": 68.0, "fat": 2.5}, "북어무침": {"cal": 85, "pro": 11.0, "carb": 8.0, "fat": 1.0}, "들깨순두부찌개": {"cal": 180, "pro": 12.0, "carb": 8.0, "fat": 11.0}, "오리주물럭": {"cal": 380, "pro": 24.0, "carb": 10.0, "fat": 27.0}, "교자": {"cal": 220, "pro": 9.0, "carb": 24.0, "fat": 10.0}, "사케동": {"cal": 520, "pro": 28.0, "carb": 68.0, "fat": 12.0}, "아게다시두부": {"cal": 180, "pro": 9.0, "carb": 12.0, "fat": 10.0}, "오덴": {"cal": 210, "carb": 14, "pro": 13, "fat": 9}, "유도후": {"cal": 110, "pro": 11.0, "carb": 4.0, "fat": 6.0}, "샤오롱바오": {"cal": 290, "pro": 13.0, "carb": 32.0, "fat": 12.0}, "회과육": {"cal": 480, "carb": 11, "pro": 22, "fat": 39}, "우육면": {"cal": 540, "pro": 28.0, "carb": 75.0, "fat": 14.0}, "오향장육": {"cal": 280, "pro": 26.0, "carb": 4.0, "fat": 18.0}, "라조기": {"cal": 420, "pro": 22.0, "carb": 24.0, "fat": 26.0}, "새우완탕면": {"cal": 410, "pro": 20.0, "carb": 68.0, "fat": 8.0}, "베이징덕": {"cal": 410, "pro": 26.0, "carb": 2.0, "fat": 34.0}, "에그베네딕트": {"cal": 440, "pro": 18.0, "carb": 24.0, "fat": 31.0}, "피시앤칩스": {"cal": 580, "pro": 24.0, "carb": 48.0, "fat": 32.0}, "비프부르기뇽": {"cal": 380, "pro": 28.0, "carb": 12.0, "fat": 24.0}, "키쉬로렌": {"cal": 420, "carb": 24, "pro": 12, "fat": 31}, "크림파스타": {"cal": 620, "pro": 18.0, "carb": 68.0, "fat": 32.0}, "똠카가이": {"cal": 290, "pro": 20.0, "carb": 12.0, "fat": 18.0}, "얌운센": {"cal": 240, "pro": 12.0, "carb": 34.0, "fat": 6.0}, "팟팍붕파이댕": {"cal": 90, "pro": 3.0, "carb": 6.0, "fat": 6.0}, "카오니아오": {"cal": 350, "pro": 6.0, "carb": 76.0, "fat": 1.0}, "퍼가": {"cal": 380, "pro": 24.0, "carb": 64.0, "fat": 3.0}, "분팃느엉": {"cal": 490, "pro": 22.0, "carb": 68.0, "fat": 14.0}, "껌가": {"cal": 510, "pro": 28.0, "carb": 70.0, "fat": 13.0}, "넴느엉꾸온": {"cal": 240, "pro": 16.0, "carb": 28.0, "fat": 7.0}, "카인까우아": {"cal": 410, "carb": 14, "pro": 28, "fat": 27}, "반꾸온": {"cal": 280, "pro": 10.0, "carb": 42.0, "fat": 8.0}, "미꽝": {"cal": 420, "pro": 18.0, "carb": 65.0, "fat": 10.0}, "엔칠라다": {"cal": 460, "pro": 22.0, "carb": 44.0, "fat": 21.0}, "카르네아사다": {"cal": 340, "pro": 32.0, "carb": 2.0, "fat": 23.0}, "피시타코": {"cal": 360, "pro": 18.0, "carb": 32.0, "fat": 16.0}, "토르티야수프": {"cal": 210, "pro": 11.0, "carb": 22.0, "fat": 9.0}, "멕시칸라이스": {"cal": 420, "pro": 9.0, "carb": 72.0, "fat": 10.0}, "차나마살라": {"cal": 240, "pro": 9.0, "carb": 32.0, "fat": 8.0}, "탄두리치킨": {"cal": 290, "pro": 34.0, "carb": 4.0, "fat": 15.0}, "치킨코르마": {"cal": 430, "pro": 26.0, "carb": 16.0, "fat": 29.0}, "빈달루": {"cal": 360, "pro": 22.0, "carb": 14.0, "fat": 24.0}, "파니르티카": {"cal": 290, "pro": 16.0, "carb": 8.0, "fat": 22.0}, "아루나달": {"cal": 190, "pro": 9.0, "carb": 24.0, "fat": 6.0}, "도사": {"cal": 290, "pro": 6.0, "carb": 48.0, "fat": 8.0}, "사모사": {"cal": 280, "pro": 5.0, "carb": 34.0, "fat": 14.0}, "소토아얌": {"cal": 260, "pro": 22.0, "carb": 12.0, "fat": 13.0}, "나시우둑": {"cal": 440, "pro": 9.0, "carb": 68.0, "fat": 14.0}, "아얌바카르": {"cal": 310, "pro": 26.0, "carb": 6.0, "fat": 20.0}, "오포르아얌": {"cal": 320, "pro": 22.0, "carb": 12.0, "fat": 21.0}, "삼발텀페": {"cal": 290, "carb": 16, "pro": 15, "fat": 19}, "아삼락사": {"cal": 420, "carb": 62, "pro": 18, "fat": 10}, "로티차나이": {"cal": 310, "pro": 6.0, "carb": 36.0, "fat": 15.0}, "이칸바카르": {"cal": 210, "pro": 26.0, "carb": 4.0, "fat": 10.0}, "미고랭말레이": {"cal": 490, "pro": 13.0, "carb": 70.0, "fat": 17.0}, "오탁오탁": {"cal": 160, "carb": 6, "pro": 14, "fat": 9}, "마삭메라": {"cal": 390, "pro": 26.0, "carb": 14.0, "fat": 25.0}, "호켄미": {"cal": 490, "carb": 64, "pro": 19, "fat": 17}, "싱가포르사테": {"cal": 290, "pro": 24.0, "carb": 8.0, "fat": 17.0}, "프론미": {"cal": 420, "pro": 24.0, "carb": 64.0, "fat": 8.0}, "카야토스트": {"cal": 360, "pro": 7.0, "carb": 48.0, "fat": 16.0}, "캐롯케이크": {"cal": 410, "pro": 4.0, "carb": 52.0, "fat": 21.0}, "레촌카왈리": {"cal": 510, "pro": 20.0, "carb": 1.0, "fat": 48.0}, "칼데레타": {"cal": 420, "pro": 28.0, "carb": 14.0, "fat": 28.0}, "판싯칸톤": {"cal": 440, "pro": 16.0, "carb": 62.0, "fat": 15.0}, "불라로": {"cal": 380, "pro": 36.0, "carb": 8.0, "fat": 22.0}, "암팔라야볶음": {"cal": 140, "pro": 8.0, "carb": 8.0, "fat": 9.0}, "고등어케밥": {"cal": 380, "pro": 24.0, "carb": 32.0, "fat": 17.0}, "아다나케밥": {"cal": 360, "pro": 26.0, "carb": 6.0, "fat": 26.0}, "이스켄데르케밥": {"cal": 580, "pro": 31.0, "carb": 43.0, "fat": 32.0}, "쾨프테": {"cal": 320, "pro": 21.0, "carb": 4.0, "fat": 25.0}, "이맘바이으르디": {"cal": 180, "carb": 16, "pro": 3, "fat": 12}, "터키식필라프": {"cal": 380, "pro": 7.0, "carb": 54.0, "fat": 15.0}, "만트": {"cal": 290, "pro": 12.0, "carb": 36.0, "fat": 10.0}, "기로스": {"cal": 390, "pro": 28.0, "carb": 6.0, "fat": 28.0}, "스파나코피타": {"cal": 340, "pro": 8.0, "carb": 28.0, "fat": 21.0}, "돌마데스": {"cal": 180, "pro": 6.0, "carb": 18.0, "fat": 9.0}, "파스티치오": {"cal": 540, "pro": 26.0, "carb": 46.0, "fat": 28.0}, "클레프티코": {"cal": 540, "pro": 34.0, "carb": 8.0, "fat": 42.0}, "차지키": {"cal": 90, "pro": 5.0, "carb": 5.0, "fat": 6.0}, "연어아보카도볼": {"cal": 490, "pro": 24.0, "carb": 48.0, "fat": 22.0}, "퀴노아채소볼": {"cal": 240, "pro": 7.0, "carb": 34.0, "fat": 9.0}, "두부채소볶음": {"cal": 140, "pro": 10.0, "carb": 8.0, "fat": 8.0}, "닭가슴살채소볶음": {"cal": 210, "pro": 26.0, "carb": 10.0, "fat": 7.0}, "아욱국": {"cal": 65, "pro": 3.0, "carb": 7.0, "fat": 2.5}, "갈치구이": {"cal": 220, "pro": 28.0, "carb": 0.5, "fat": 11.0}, "코다리조림": {"cal": 220, "pro": 26.0, "carb": 12.0, "fat": 6.0}, "동태전": {"cal": 210, "pro": 16.0, "carb": 7.0, "fat": 13.0}, "감자볶음": {"cal": 130, "pro": 2.0, "carb": 16.0, "fat": 6.0}, "도라지무침": {"cal": 65, "pro": 1.5, "carb": 12.0, "fat": 1.0}, "취나물무침": {"cal": 35, "carb": 4, "pro": 1, "fat": 2}, "느타리버섯볶음": {"cal": 60, "pro": 2.0, "carb": 5.0, "fat": 3.8}, "고사리나물": {"cal": 45, "pro": 2.0, "carb": 4.0, "fat": 2.5}, "전복죽": {"cal": 270, "pro": 8.0, "carb": 51.0, "fat": 4.0}, "닭죽": {"cal": 280, "pro": 15.0, "carb": 44.0, "fat": 5.0}, "건새우미역무침": {"cal": 55, "pro": 4.0, "carb": 5.0, "fat": 2.0}, "잡곡밥": {"cal": 310, "pro": 7.0, "carb": 66.0, "fat": 2.0}, "영양솥밥": {"cal": 420, "pro": 10.0, "carb": 82.0, "fat": 5.0}, "된장삼겹살": {"cal": 480, "pro": 22.0, "carb": 4.0, "fat": 42.0}, "간장새우장": {"cal": 145, "pro": 22.0, "carb": 8.0, "fat": 3.0}, "야키토리": {"cal": 210, "pro": 22.0, "carb": 4.0, "fat": 12.0}, "수프카레": {"cal": 290, "pro": 18.0, "carb": 16.0, "fat": 16.0}, "에비마요": {"cal": 380, "pro": 14.0, "carb": 22.0, "fat": 26.0}, "쯔케멘": {"cal": 610, "carb": 88, "pro": 24, "fat": 18}, "히레카츠": {"cal": 390, "pro": 27.0, "carb": 16.0, "fat": 23.0}, "멘치카츠": {"cal": 390, "pro": 16.0, "carb": 22.0, "fat": 26.0}, "코로케": {"cal": 310, "pro": 5.0, "carb": 32.0, "fat": 18.0}, "마제소바": {"cal": 580, "pro": 21.0, "carb": 82.0, "fat": 18.0}, "차슈": {"cal": 270, "pro": 16.0, "carb": 5.0, "fat": 21.0}, "홍샤오러우": {"cal": 540, "pro": 18.0, "carb": 12.0, "fat": 48.0}, "어향육사": {"cal": 290, "pro": 18.0, "carb": 12.0, "fat": 19.0}, "마늘새우볶음": {"cal": 230, "pro": 18.0, "carb": 6.0, "fat": 15.0}, "소고기브로콜리볶음": {"cal": 280, "pro": 24.0, "carb": 11.0, "fat": 15.0}, "닭고기캐슈넛볶음": {"cal": 380, "pro": 24.0, "carb": 16.0, "fat": 24.0}, "중식오이냉채": {"cal": 65, "pro": 2.0, "carb": 7.0, "fat": 3.0}, "뇨키": {"cal": 320, "pro": 7.0, "carb": 52.0, "fat": 10.0}, "미트볼파스타": {"cal": 580, "pro": 24.0, "carb": 75.0, "fat": 20.0}, "페스토파스타": {"cal": 520, "pro": 11.0, "carb": 58.0, "fat": 28.0}, "치킨카치아토라": {"cal": 310, "pro": 28.0, "carb": 14.0, "fat": 15.0}, "로제파스타": {"cal": 540, "pro": 15.0, "carb": 70.0, "fat": 22.0}, "꾸어이티어우": {"cal": 390, "carb": 72, "pro": 14, "fat": 5}, "팟프리킹": {"cal": 360, "pro": 24.0, "carb": 11.0, "fat": 24.0}, "얌마무앙": {"cal": 130, "pro": 2.0, "carb": 22.0, "fat": 4.0}, "카오팟크라파오": {"cal": 620, "carb": 75, "pro": 24, "fat": 25}, "보룩락": {"cal": 380, "pro": 28.0, "carb": 14.0, "fat": 22.0}, "껌찌엔": {"cal": 440, "pro": 14.0, "carb": 68.0, "fat": 12.0}, "껌땀": {"cal": 590, "pro": 32.0, "carb": 75.0, "fat": 18.0}, "미싸오": {"cal": 460, "pro": 14.0, "carb": 65.0, "fat": 16.0}, "새우마살라": {"cal": 280, "pro": 18.0, "carb": 14.0, "fat": 16.0}, "말라이코프타": {"cal": 320, "pro": 8.0, "carb": 24.0, "fat": 21.0}, "라이타": {"cal": 80, "pro": 4.0, "carb": 6.0, "fat": 4.0}, "버섯솥밥": {"cal": 390, "pro": 9.0, "carb": 74.0, "fat": 6.0}, "두부미역국": {"cal": 75, "pro": 6.0, "carb": 4.0, "fat": 4.0}, "병아리콩샐러드": {"cal": 190, "pro": 8.0, "carb": 22.0, "fat": 8.0}, "참치채소샐러드": {"cal": 140, "pro": 18.0, "carb": 8.0, "fat": 4.0}, "포졸레": {"cal": 290, "pro": 22.0, "carb": 21.0, "fat": 13.0}, "타말레": {"cal": 280, "pro": 9.0, "carb": 28.0, "fat": 15.0}, "토스타다": {"cal": 340, "pro": 16.0, "carb": 28.0, "fat": 18.0}, "칠레레예노": {"cal": 380, "pro": 14.0, "carb": 18.0, "fat": 28.0}, "나시짬빌": {"cal": 640, "carb": 84, "pro": 28, "fat": 21}, "이칸고랭": {"cal": 280, "pro": 24.0, "carb": 8.0, "fat": 17.0}, "삼발우당": {"cal": 260, "pro": 22.0, "carb": 12.0, "fat": 13.0}, "캅카이": {"cal": 240, "pro": 14.0, "carb": 18.0, "fat": 14.0}, "보렉": {"cal": 340, "pro": 10.0, "carb": 38.0, "fat": 16.0}, "쉬쉬타북": {"cal": 310, "carb": 4, "pro": 31, "fat": 18}, "논야커리": {"cal": 420, "carb": 15, "pro": 26, "fat": 28}, "이칸마살라": {"cal": 260, "pro": 22.0, "carb": 14.0, "fat": 13.0}, "삼발켄팅": {"cal": 210, "pro": 4.0, "carb": 24.0, "fat": 11.0}, "케랍아얌": {"cal": 260, "pro": 24.0, "carb": 8.0, "fat": 15.0}, "피나클렛": {"cal": 160, "carb": 14, "pro": 8, "fat": 8}, "에스카베체": {"cal": 240, "pro": 18.0, "carb": 10.0, "fat": 14.0}, "비나고나안": {"cal": 460, "carb": 6, "pro": 28, "fat": 37}, "킬라윈": {"cal": 180, "pro": 22.0, "carb": 6.0, "fat": 8.0}, "블랙페퍼크랩": {"cal": 320, "pro": 26.0, "carb": 18.0, "fat": 16.0}, "미폭국수": {"cal": 480, "carb": 68, "pro": 16, "fat": 15}, "나시빠당": {"cal": 620, "pro": 26.0, "carb": 72.0, "fat": 25.0}, "티로피타": {"cal": 360, "pro": 9.0, "carb": 24.0, "fat": 26.0}, "스티파도": {"cal": 360, "pro": 24.0, "carb": 14.0, "fat": 21.0}, "브리암": {"cal": 150, "pro": 3.0, "carb": 16.0, "fat": 8.0}, "스코르달리아": {"cal": 180, "pro": 2.0, "carb": 18.0, "fat": 11.0}, "파에야": {"cal": 520, "pro": 24.0, "carb": 74.0, "fat": 14.0}, "가스파초": {"cal": 80, "pro": 1.5, "carb": 9.0, "fat": 3.5}, "또르티야에스파뇰라": {"cal": 320, "carb": 24, "pro": 11, "fat": 20}, "파타타스브라바스": {"cal": 280, "pro": 4.0, "carb": 36.0, "fat": 14.0}, "알봉디가스": {"cal": 310, "carb": 12, "pro": 19, "fat": 20}, "부야베스": {"cal": 260, "pro": 28.0, "carb": 14.0, "fat": 10.0}, "크로크무슈": {"cal": 430, "pro": 18.0, "carb": 34.0, "fat": 25.0}, "코코뱅": {"cal": 380, "pro": 32.0, "carb": 12.0, "fat": 16.0}, "프렌치어니언수프": {"cal": 190, "pro": 8.0, "carb": 18.0, "fat": 9.0}, "라따뚜이": {"cal": 130, "pro": 3.0, "carb": 14.0, "fat": 7.0}, "계란국": {"cal": 65, "pro": 5.0, "carb": 3.0, "fat": 4.0}, "배추된장국": {"cal": 55, "pro": 3.5, "carb": 7.0, "fat": 1.5}, "마늘종볶음": {"cal": 50, "pro": 1.0, "carb": 6.0, "fat": 2.5}, "참나물무침": {"cal": 35, "pro": 1.0, "carb": 4.0, "fat": 2.0}, "삼치조림": {"cal": 290, "pro": 30.0, "carb": 10.0, "fat": 13.0}, "골뱅이무침": {"cal": 190, "pro": 21.0, "carb": 18.0, "fat": 4.0}, "닭한마리": {"cal": 340, "pro": 38.0, "carb": 12.0, "fat": 15.0}, "추어탕": {"cal": 210, "pro": 18.0, "carb": 12.0, "fat": 10.0}, "들깨미역국": {"cal": 95, "pro": 4.0, "carb": 5.0, "fat": 7.0}, "대패삼겹살구이": {"cal": 490, "pro": 22.0, "carb": 1.0, "fat": 45.0}, "두부부침": {"cal": 140, "pro": 10.0, "carb": 3.0, "fat": 10.0}, "황태구이": {"cal": 180, "pro": 24.0, "carb": 8.0, "fat": 5.0}, "간장게장": {"cal": 320, "pro": 33.0, "carb": 8.0, "fat": 7.0}, "전복미역국": {"cal": 90, "pro": 10.0, "carb": 5.0, "fat": 4.0}, "된장비빔밥": {"cal": 460, "pro": 15.0, "carb": 76.0, "fat": 10.0}, "돈지루": {"cal": 180, "pro": 12.0, "carb": 8.0, "fat": 11.0}, "에비후라이": {"cal": 280, "pro": 13.0, "carb": 18.0, "fat": 17.0}, "야키우동": {"cal": 440, "pro": 11.0, "carb": 72.0, "fat": 12.0}, "치킨난반": {"cal": 520, "pro": 26.0, "carb": 24.0, "fat": 36.0}, "이시카리나베": {"cal": 290, "pro": 28.0, "carb": 11.0, "fat": 15.0}, "카키아게": {"cal": 280, "pro": 3.0, "carb": 22.0, "fat": 20.0}, "사케미소즈케": {"cal": 260, "pro": 26.0, "carb": 4.0, "fat": 15.0}, "부타킴치": {"cal": 320, "pro": 21.0, "carb": 8.0, "fat": 22.0}, "마파가지": {"cal": 190, "pro": 4.0, "carb": 14.0, "fat": 14.0}, "차오멘": {"cal": 510, "pro": 14.0, "carb": 68.0, "fat": 20.0}, "바오즈": {"cal": 340, "pro": 12.0, "carb": 48.0, "fat": 11.0}, "쿵파오치킨": {"cal": 380, "pro": 24.0, "carb": 16.0, "fat": 24.0}, "슈마이": {"cal": 210, "pro": 10.0, "carb": 22.0, "fat": 9.0}, "게살볶음밥": {"cal": 440, "pro": 17.0, "carb": 68.0, "fat": 11.0}, "해파리냉채": {"cal": 110, "pro": 6.0, "carb": 12.0, "fat": 4.0}, "뇨키토마토": {"cal": 380, "pro": 9.0, "carb": 56.0, "fat": 13.0}, "아마트리치아나": {"cal": 460, "pro": 14.0, "carb": 66.0, "fat": 15.0}, "니수아즈 샐러드": {"cal": 290, "carb": 11, "pro": 18, "fat": 19}, "그릴드연어": {"cal": 250, "pro": 30.0, "carb": 0.1, "fat": 14.0}, "크림브로콜리수프": {"cal": 210, "pro": 5.0, "carb": 16.0, "fat": 15.0}, "카이지아우무쌉": {"cal": 340, "pro": 16.0, "carb": 6.0, "fat": 28.0}, "파낭커리": {"cal": 420, "pro": 26.0, "carb": 15.0, "fat": 29.0}, "얌느아": {"cal": 190, "pro": 20.0, "carb": 10.0, "fat": 8.0}, "차까": {"cal": 310, "carb": 8, "pro": 26, "fat": 19}, "넴루이": {"cal": 290, "pro": 20.0, "carb": 8.0, "fat": 20.0}, "보비아": {"cal": 210, "pro": 8.0, "carb": 26.0, "fat": 8.0}, "커리치킨반미": {"cal": 490, "pro": 21.0, "carb": 58.0, "fat": 19.0}, "사히파니르": {"cal": 360, "carb": 14, "pro": 12, "fat": 29}, "알루파라타": {"cal": 290, "pro": 5.0, "carb": 42.0, "fat": 11.0}, "케이마마터": {"cal": 340, "carb": 16, "pro": 22, "fat": 21}, "두부스크램블에그": {"cal": 145, "pro": 11.0, "carb": 3.0, "fat": 10.0}, "메밀소바샐러드": {"cal": 290, "pro": 9.0, "carb": 54.0, "fat": 4.0}, "아보카도연어토스트": {"cal": 390, "pro": 16.0, "carb": 26.0, "fat": 25.0}, "치미창가": {"cal": 580, "pro": 26.0, "carb": 54.0, "fat": 28.0}, "소파데리마": {"cal": 210, "pro": 14.0, "carb": 16.0, "fat": 9.0}, "엠파나다": {"cal": 380, "pro": 12.0, "carb": 36.0, "fat": 21.0}, "멕시코콩스튜": {"cal": 220, "pro": 11.0, "carb": 34.0, "fat": 4.0}, "아얌페냑": {"cal": 430, "carb": 8, "pro": 32, "fat": 30}, "템페고랭": {"cal": 310, "pro": 16.0, "carb": 14.0, "fat": 22.0}, "롱통": {"cal": 340, "pro": 10.0, "carb": 48.0, "fat": 12.0}, "이칸아삼": {"cal": 190, "pro": 22.0, "carb": 9.0, "fat": 7.0}, "아얌고랭베렘팍": {"cal": 390, "carb": 6, "pro": 29, "fat": 27}, "달채소카레": {"cal": 210, "pro": 8.0, "carb": 26.0, "fat": 8.0}, "카레카레": {"cal": 440, "pro": 28.0, "carb": 14.0, "fat": 31.0}, "니라가": {"cal": 240, "carb": 8, "pro": 28, "fat": 10}, "토실로그": {"cal": 580, "carb": 52, "pro": 28, "fat": 26}, "카르니야르크": {"cal": 240, "pro": 14.0, "carb": 12.0, "fat": 16.0}, "귀벡": {"cal": 290, "pro": 26.0, "carb": 12.0, "fat": 15.0}, "자작크": {"cal": 90, "carb": 5, "pro": 5, "fat": 6}, "스팀보트": {"cal": 290, "pro": 26.0, "carb": 12.0, "fat": 14.0}, "싱가포르죽": {"cal": 220, "pro": 10.0, "carb": 38.0, "fat": 3.0}, "피시헤드커리": {"cal": 380, "pro": 32.0, "carb": 18.0, "fat": 20.0}, "아브고레모노": {"cal": 190, "carb": 14, "pro": 13, "fat": 9}, "스파나코리조": {"cal": 280, "pro": 6.0, "carb": 44.0, "fat": 8.0}, "파소울라다": {"cal": 260, "pro": 11.0, "carb": 34.0, "fat": 9.0}, "감바스알아히요": {"cal": 410, "pro": 18.0, "carb": 6.0, "fat": 36.0}, "살모레호": {"cal": 190, "pro": 4.0, "carb": 18.0, "fat": 11.0}, "코시도": {"cal": 430, "pro": 26.0, "carb": 28.0, "fat": 24.0}, "피미엔토파드론": {"cal": 120, "carb": 8, "pro": 2, "fat": 9}, "하몬크로케타": {"cal": 320, "pro": 8.0, "carb": 26.0, "fat": 20.0}, "풀포갈레가": {"cal": 220, "carb": 6, "pro": 22, "fat": 12}, "파파아루가다": {"cal": 130, "carb": 26, "pro": 3, "fat": 2}, "카술레": {"cal": 480, "pro": 28.0, "carb": 32.0, "fat": 26.0}, "솔뮈니에르": {"cal": 280, "carb": 8, "pro": 22, "fat": 18}, "크레프": {"cal": 190, "pro": 5.0, "carb": 26.0, "fat": 7.0}, "버섯벨루테": {"cal": 160, "pro": 4.0, "carb": 14.0, "fat": 10.0}, "프로방살토마토": {"cal": 110, "carb": 12, "pro": 2, "fat": 6}, "크림소스연어": {"cal": 420, "pro": 31.0, "carb": 6.0, "fat": 30.0}, "리볼리타": {"cal": 210, "pro": 8.0, "carb": 28.0, "fat": 7.0}, "아쿠아파차": {"cal": 220, "pro": 24.0, "carb": 6.0, "fat": 11.0}, "포카치아": {"cal": 250, "pro": 7.0, "carb": 44.0, "fat": 5.0}, "카포나타": {"cal": 140, "pro": 2.0, "carb": 14.0, "fat": 9.0}, "오소부코": {"cal": 390, "pro": 32.0, "carb": 12.0, "fat": 24.0}, "팔라펠": {"cal": 330, "pro": 11.0, "carb": 32.0, "fat": 18.0}, "샤와르마": {"cal": 490, "pro": 28.0, "carb": 42.0, "fat": 22.0}, "타불레": {"cal": 160, "pro": 4.0, "carb": 21.0, "fat": 7.0}, "키베": {"cal": 340, "pro": 18.0, "carb": 22.0, "fat": 20.0}, "만사프": {"cal": 640, "pro": 34.0, "carb": 78.0, "fat": 22.0}, "홍합탕": {"cal": 90, "pro": 12.0, "carb": 6.0, "fat": 2.0}, "바지락탕": {"cal": 70, "pro": 10.0, "carb": 3.0, "fat": 1.5}, "꼬리곰탕": {"cal": 320, "pro": 34.0, "carb": 4.0, "fat": 19.0}, "우거지해장국": {"cal": 190, "pro": 13.0, "carb": 18.0, "fat": 7.0}, "냉이된장국": {"cal": 60, "pro": 4.0, "carb": 6.0, "fat": 2.0}, "쑥된장국": {"cal": 60, "pro": 4.0, "carb": 7.0, "fat": 1.5}, "무조림": {"cal": 60, "pro": 1.0, "carb": 9.0, "fat": 2.2}, "연근조림": {"cal": 75, "pro": 2.0, "carb": 16.0, "fat": 0.5}, "우엉조림": {"cal": 55, "pro": 1.0, "carb": 11.0, "fat": 1.0}, "더덕구이": {"cal": 110, "pro": 2.0, "carb": 18.0, "fat": 3.5}, "꽁치조림": {"cal": 280, "pro": 22.0, "carb": 10.0, "fat": 16.0}, "꽁치김치찌개": {"cal": 290, "pro": 24.0, "carb": 9.0, "fat": 17.0}, "소고기죽": {"cal": 240, "pro": 12.0, "carb": 38.0, "fat": 4.5}, "소고기덮밥": {"cal": 560, "pro": 24.0, "carb": 76.0, "fat": 17.0}, "계란덮밥": {"cal": 430, "pro": 14.0, "carb": 68.0, "fat": 11.0}, "낙지덮밥": {"cal": 490, "pro": 22.0, "carb": 82.0, "fat": 8.0}, "참치마요덮밥": {"cal": 620, "pro": 16.0, "carb": 85.0, "fat": 24.0}, "오삼불고기": {"cal": 340, "pro": 24.0, "carb": 11.0, "fat": 22.0}, "두부김치": {"cal": 220, "pro": 16.0, "carb": 10.0, "fat": 13.0}, "돼지고기깻잎볶음": {"cal": 340, "pro": 25.0, "carb": 10.0, "fat": 22.0}, "소고기볶음": {"cal": 320, "pro": 26.0, "carb": 10.0, "fat": 19.0}, "호박전": {"cal": 120, "pro": 3.0, "carb": 14.0, "fat": 6.0}, "버섯전": {"cal": 170, "pro": 4.0, "carb": 16.0, "fat": 10.0}, "육전": {"cal": 260, "pro": 21.0, "carb": 6.0, "fat": 17.0}, "빈대떡": {"cal": 290, "pro": 10.0, "carb": 30.0, "fat": 14.0}, "무나물": {"cal": 35, "pro": 0.8, "carb": 4.0, "fat": 1.8}, "호박나물": {"cal": 30, "pro": 1.0, "carb": 4.0, "fat": 1.0}, "숙주나물": {"cal": 30, "pro": 1.5, "carb": 3.0, "fat": 1.2}, "미역줄기볶음": {"cal": 45, "pro": 1.2, "carb": 4.0, "fat": 2.8}, "깻잎무침": {"cal": 25, "pro": 1.5, "carb": 3.0, "fat": 0.8}, "삼겹살구이": {"cal": 490, "carb": 0, "pro": 26, "fat": 43}, "목살구이": {"cal": 360, "carb": 0, "pro": 28, "fat": 27}, "막국수": {"cal": 460, "pro": 12.0, "carb": 85.0, "fat": 6.0}, "콩나물국밥": {"cal": 320, "pro": 11.0, "carb": 62.0, "fat": 3.0}, "도토리묵무침": {"cal": 120, "pro": 2.0, "carb": 14.0, "fat": 6.0}, "감자수제비": {"cal": 440, "pro": 12.0, "carb": 88.0, "fat": 4.0}, "해물잡채": {"cal": 230, "pro": 7.0, "carb": 32.0, "fat": 8.0}, "아귀찜": {"cal": 210, "pro": 26.0, "carb": 12.0, "fat": 5.0}, "팥죽": {"cal": 320, "pro": 9.0, "carb": 66.0, "fat": 2.0}, "순대국밥": {"cal": 480, "pro": 26.0, "carb": 52.0, "fat": 18.0}, "타마고산도": {"cal": 390, "pro": 11.0, "carb": 38.0, "fat": 22.0}, "규나베": {"cal": 390, "pro": 28.0, "carb": 14.0, "fat": 25.0}, "에비텐동": {"cal": 620, "pro": 18.0, "carb": 82.0, "fat": 24.0}, "가이센동": {"cal": 600, "pro": 41.0, "carb": 62.0, "fat": 20.0}, "미소버터라멘": {"cal": 590, "pro": 19.0, "carb": 76.0, "fat": 23.0}, "부타네기야키": {"cal": 320, "pro": 22.0, "carb": 6.0, "fat": 23.0}, "아지후라이": {"cal": 290, "pro": 18.0, "carb": 16.0, "fat": 18.0}, "부추계란볶음": {"cal": 165, "pro": 10.0, "carb": 4.0, "fat": 12.0}, "피단두부무침": {"cal": 180, "pro": 14.0, "carb": 8.0, "fat": 10.0}, "마라라면": {"cal": 540, "pro": 11.0, "carb": 78.0, "fat": 20.0}, "광동식볶음밥": {"cal": 430, "pro": 13.0, "carb": 68.0, "fat": 12.0}, "파기름파스타": {"cal": 440, "pro": 9.0, "carb": 64.0, "fat": 16.0}, "중식만두전골": {"cal": 380, "pro": 19.0, "carb": 34.0, "fat": 19.0}, "아보카도크림파스타": {"cal": 560, "pro": 12.0, "carb": 68.0, "fat": 28.0}, "훈제연어파스타": {"cal": 560, "pro": 24.0, "carb": 66.0, "fat": 21.0}, "치킨팟파이": {"cal": 540, "pro": 19.0, "carb": 41.0, "fat": 34.0}, "폴렌타": {"cal": 150, "pro": 4.0, "carb": 28.0, "fat": 2.0}, "치킨시저랩": {"cal": 530, "pro": 26.0, "carb": 36.0, "fat": 31.0}, "카오니아우마무앙": {"cal": 480, "carb": 88, "pro": 5, "fat": 12}, "얌탈레": {"cal": 220, "pro": 16.0, "carb": 18.0, "fat": 9.0}, "칸톰카이": {"cal": 290, "carb": 11, "pro": 16, "fat": 21}, "팟팟카나": {"cal": 95, "carb": 7, "pro": 4, "fat": 6}, "고이가": {"cal": 180, "pro": 22.0, "carb": 8.0, "fat": 7.0}, "쌀국수볶음": {"cal": 490, "pro": 15.0, "carb": 74.0, "fat": 14.0}, "반팃느엉": {"cal": 490, "pro": 22.0, "carb": 68.0, "fat": 14.0}, "생선국수": {"cal": 380, "pro": 22.0, "carb": 64.0, "fat": 4.0}, "고아피시커리": {"cal": 290, "carb": 11, "pro": 21, "fat": 17}, "팬니르도피아자": {"cal": 340, "carb": 12, "pro": 14, "fat": 26}, "암리차리컬차": {"cal": 380, "carb": 56, "pro": 8, "fat": 14}, "케랄라새우커리": {"cal": 320, "pro": 22.0, "carb": 12.0, "fat": 21.0}, "두부스테이크테리야키": {"cal": 215, "pro": 13.0, "carb": 16.0, "fat": 11.0}, "현미채소볶음밥": {"cal": 460, "pro": 9.0, "carb": 74.0, "fat": 12.0}, "닭가슴살채소볶음밥": {"cal": 410, "pro": 24.0, "carb": 65.0, "fat": 6.0}, "칠레아도보": {"cal": 390, "pro": 31.0, "carb": 7.0, "fat": 26.0}, "소파데피데오": {"cal": 240, "pro": 8.0, "carb": 34.0, "fat": 8.0}, "멕시코식타말": {"cal": 280, "carb": 28, "pro": 9, "fat": 15}, "아얌세리": {"cal": 330, "pro": 24.0, "carb": 8.0, "fat": 22.0}, "페센베크": {"cal": 440, "pro": 26.0, "carb": 24.0, "fat": 28.0}, "사유르아삼": {"cal": 120, "carb": 18, "pro": 3, "fat": 4}, "아삼프라이드치킨": {"cal": 360, "carb": 11, "pro": 28, "fat": 22}, "나시머냑": {"cal": 360, "carb": 68, "pro": 6, "fat": 7}, "이칸페프리": {"cal": 170, "pro": 24.0, "carb": 3.0, "fat": 7.0}, "이나살": {"cal": 360, "pro": 32.0, "carb": 3.0, "fat": 24.0}, "크리스피파타": {"cal": 820, "pro": 64.0, "carb": 2.0, "fat": 62.0}, "판싯바하이": {"cal": 410, "carb": 56, "pro": 15, "fat": 13}, "메르지메크수프": {"cal": 180, "carb": 24, "pro": 10, "fat": 5}, "카부르가": {"cal": 580, "carb": 0, "pro": 38, "fat": 48}, "타쉬쾨프테": {"cal": 360, "pro": 22.0, "carb": 12.0, "fat": 24.0}, "비가탄면": {"cal": 560, "pro": 18.0, "carb": 75.0, "fat": 21.0}, "찐호키엔미": {"cal": 520, "carb": 72, "pro": 18, "fat": 18}, "체가이볶음면": {"cal": 460, "pro": 11.0, "carb": 72.0, "fat": 14.0}, "아고우렐라이오": {"cal": 220, "carb": 4, "pro": 1, "fat": 24}, "프라이드피타": {"cal": 220, "pro": 4.0, "carb": 32.0, "fat": 8.0}, "소파카스텔야나": {"cal": 160, "carb": 14, "pro": 6, "fat": 9}, "아호블랑코": {"cal": 240, "pro": 4.0, "carb": 14.0, "fat": 19.0}, "니스스타일피자": {"cal": 390, "pro": 14.0, "carb": 40.0, "fat": 19.0}, "쿠르제트수프": {"cal": 130, "pro": 3.0, "carb": 11.0, "fat": 9.0}, "살팀보카": {"cal": 360, "pro": 28.0, "carb": 4.0, "fat": 25.0}, "시칠리아파스타": {"cal": 480, "pro": 12.0, "carb": 68.0, "fat": 16.0}, "마클루베": {"cal": 540, "pro": 24.0, "carb": 75.0, "fat": 16.0}, "머제타이스": {"cal": 340, "carb": 12, "pro": 22, "fat": 22}, "장어구이": {"cal": 320, "pro": 27.0, "carb": 11.0, "fat": 19.0}, "돼지국밥": {"cal": 450, "pro": 28.0, "carb": 45.0, "fat": 18.0}, "쟁반국수": {"cal": 490, "pro": 15.0, "carb": 88.0, "fat": 9.0}, "어묵국": {"cal": 90, "pro": 7.0, "carb": 8.0, "fat": 3.5}, "떡갈비": {"cal": 320, "pro": 22.0, "carb": 14.0, "fat": 20.0}, "곱창볶음": {"cal": 430, "pro": 20.0, "carb": 12.0, "fat": 34.0}, "순대볶음": {"cal": 390, "pro": 14.0, "carb": 42.0, "fat": 18.0}, "열무비빔밥": {"cal": 490, "pro": 12.0, "carb": 84.0, "fat": 11.0}, "오이냉국": {"cal": 30, "pro": 1.0, "carb": 6.0, "fat": 0.2}, "미역냉국": {"cal": 35, "pro": 1.0, "carb": 6.0, "fat": 0.5}, "불고기전골": {"cal": 290, "pro": 24.0, "carb": 16.0, "fat": 14.0}, "해물전골": {"cal": 260, "pro": 28.0, "carb": 14.0, "fat": 10.0}, "들깨칼국수": {"cal": 480, "pro": 13.0, "carb": 78.0, "fat": 12.0}, "비지찌개": {"cal": 210, "pro": 14.0, "carb": 10.0, "fat": 12.0}, "산채비빔밥": {"cal": 480, "pro": 14.0, "carb": 82.0, "fat": 9.0}, "육회비빔밥": {"cal": 580, "pro": 27.0, "carb": 82.0, "fat": 16.0}, "떡만두국": {"cal": 490, "pro": 19.0, "carb": 82.0, "fat": 10.0}, "황기닭백숙": {"cal": 340, "pro": 38.0, "carb": 4.0, "fat": 18.0}, "소갈비구이": {"cal": 460, "pro": 26.0, "carb": 6.0, "fat": 36.0}, "팽이버섯전골": {"cal": 160, "pro": 8.0, "carb": 14.0, "fat": 8.0}, "냉이무침": {"cal": 40, "pro": 2.0, "carb": 4.0, "fat": 1.8}, "열무국수": {"cal": 390, "pro": 10.0, "carb": 78.0, "fat": 4.0}, "카니돈부리": {"cal": 530, "pro": 22.0, "carb": 84.0, "fat": 12.0}, "야키오니기리": {"cal": 280, "pro": 6.0, "carb": 56.0, "fat": 3.0}, "모야시라멘": {"cal": 440, "pro": 14.0, "carb": 72.0, "fat": 10.0}, "오야코우동": {"cal": 480, "pro": 22.0, "carb": 76.0, "fat": 10.0}, "다코라이스": {"cal": 510, "pro": 22.0, "carb": 70.0, "fat": 15.0}, "부타네기폰즈": {"cal": 290, "pro": 22.0, "carb": 5.0, "fat": 20.0}, "완탕탕": {"cal": 180, "pro": 12.0, "carb": 14.0, "fat": 8.0}, "광동볶음면": {"cal": 480, "pro": 14.0, "carb": 72.0, "fat": 15.0}, "야채춘권": {"cal": 240, "carb": 32, "pro": 4, "fat": 10}, "팽이버섯볶음": {"cal": 65, "pro": 2.0, "carb": 5.0, "fat": 4.0}, "닭육수면": {"cal": 430, "pro": 20.0, "carb": 75.0, "fat": 5.0}, "버섯크림리조또": {"cal": 450, "pro": 11.0, "carb": 58.0, "fat": 19.0}, "베이컨에그스크램블": {"cal": 280, "pro": 16.0, "carb": 2.0, "fat": 23.0}, "풀드포크": {"cal": 320, "pro": 24.0, "carb": 14.0, "fat": 18.0}, "치킨콥샐러드": {"cal": 380, "pro": 28.0, "carb": 10.0, "fat": 26.0}, "연어스테이크": {"cal": 310, "pro": 36.0, "carb": 0.2, "fat": 18.0}, "카오무댕": {"cal": 560, "pro": 26.0, "carb": 74.0, "fat": 18.0}, "라르브무": {"cal": 260, "carb": 6, "pro": 24, "fat": 15}, "팟나": {"cal": 460, "pro": 18.0, "carb": 58.0, "fat": 17.0}, "카오닌무삥": {"cal": 520, "carb": 42, "pro": 26, "fat": 28}, "보코": {"cal": 390, "pro": 28.0, "carb": 16.0, "fat": 24.0}, "퍼싸오": {"cal": 510, "pro": 18.0, "carb": 68.0, "fat": 19.0}, "껌스엉": {"cal": 570, "pro": 30.0, "carb": 72.0, "fat": 18.0}, "반보팻짠": {"cal": 290, "carb": 8, "pro": 24, "fat": 18}, "치킨발티": {"cal": 390, "pro": 31.0, "carb": 12.0, "fat": 24.0}, "팔라크아루": {"cal": 190, "carb": 18, "pro": 4, "fat": 12}, "치킨두피아자": {"cal": 380, "pro": 28.0, "carb": 14.0, "fat": 24.0}, "달타르카": {"cal": 220, "pro": 10.0, "carb": 25.0, "fat": 9.0}, "단호박수프": {"cal": 160, "pro": 3.0, "carb": 26.0, "fat": 5.0}, "닭가슴살요거트볼": {"cal": 240, "pro": 20.0, "carb": 22.0, "fat": 7.0}, "비트샐러드": {"cal": 110, "pro": 2.0, "carb": 12.0, "fat": 6.0}, "채소달걀국": {"cal": 70, "pro": 6.0, "carb": 3.0, "fat": 4.0}, "치킨몰레": {"cal": 420, "pro": 32.0, "carb": 18.0, "fat": 25.0}, "세비체": {"cal": 140, "pro": 19.0, "carb": 7.0, "fat": 3.0}, "카마로네스알라디아블라": {"cal": 280, "carb": 10, "pro": 24, "fat": 16}, "굴라이 이칸": {"cal": 320, "pro": 24.0, "carb": 10.0, "fat": 20.0}, "레막캄빙": {"cal": 440, "carb": 12, "pro": 29, "fat": 30}, "아삼이칸": {"cal": 190, "carb": 9, "pro": 22, "fat": 7}, "로미에": {"cal": 390, "pro": 16.0, "carb": 65.0, "fat": 7.0}, "아얌마삭르막": {"cal": 410, "pro": 24.0, "carb": 10.0, "fat": 30.0}, "기나탕마노크": {"cal": 260, "pro": 28.0, "carb": 10.0, "fat": 12.0}, "아도봉캉콩": {"cal": 120, "pro": 3.0, "carb": 8.0, "fat": 8.0}, "피시볼국": {"cal": 210, "pro": 16.0, "carb": 18.0, "fat": 8.0}, "타부크수유": {"cal": 310, "carb": 11, "pro": 24, "fat": 19}, "이즈미르쾨프테": {"cal": 340, "pro": 22.0, "carb": 18.0, "fat": 20.0}, "무이판": {"cal": 460, "pro": 14.0, "carb": 70.0, "fat": 13.0}, "할루미구이": {"cal": 320, "pro": 21.0, "carb": 2.0, "fat": 26.0}, "아르니굽기": {"cal": 540, "carb": 2, "pro": 36, "fat": 43}, "호르타": {"cal": 90, "pro": 2.0, "carb": 6.0, "fat": 7.0}, "사르수엘라": {"cal": 290, "pro": 26.0, "carb": 15.0, "fat": 14.0}, "초리소와인조림": {"cal": 320, "pro": 18.0, "carb": 6.0, "fat": 25.0}, "시피오네스앙코아": {"cal": 180, "carb": 6, "pro": 18, "fat": 9}, "파르망티에": {"cal": 410, "pro": 22.0, "carb": 32.0, "fat": 21.0}, "뵈프엔다우브": {"cal": 360, "pro": 28.0, "carb": 12.0, "fat": 22.0}, "아만딘송어": {"cal": 340, "carb": 7, "pro": 28, "fat": 22}, "아라비아타파스타": {"cal": 440, "pro": 12.0, "carb": 68.0, "fat": 12.0}, "버터세이지뇨키": {"cal": 380, "pro": 6.0, "carb": 48.0, "fat": 18.0}, "리가토니알라보드카": {"cal": 510, "pro": 14.0, "carb": 68.0, "fat": 19.0}, "폴포살라다": {"cal": 180, "pro": 16.0, "carb": 12.0, "fat": 8.0}, "치킨샤와르마랩": {"cal": 490, "pro": 28.0, "carb": 44.0, "fat": 22.0}, "카프타그릴": {"cal": 380, "pro": 26.0, "carb": 4.0, "fat": 30.0}, "마크부스": {"cal": 520, "pro": 26.0, "carb": 72.0, "fat": 14.0}, "레바논타울룩": {"cal": 310, "carb": 4, "pro": 31, "fat": 18}, "로모살타도": {"cal": 410, "pro": 26.0, "carb": 34.0, "fat": 16.0}, "아히데갈리나": {"cal": 420, "carb": 22, "pro": 28, "fat": 25}, "차우파": {"cal": 640, "pro": 18.0, "carb": 88.0, "fat": 24.0}, "치킨타진": {"cal": 340, "pro": 27.0, "carb": 18.0, "fat": 18.0}, "쿠스쿠스로얄": {"cal": 560, "pro": 32.0, "carb": 54.0, "fat": 24.0}, "하리라": {"cal": 240, "pro": 12.0, "carb": 32.0, "fat": 6.0}, "부타카쿠니": {"cal": 460, "pro": 22.0, "carb": 10.0, "fat": 38.0}, "오징어먹물 파스타": {"cal": 490, "pro": 16.0, "carb": 68.0, "fat": 16.0}, "광동식탕수육": {"cal": 460, "pro": 18.0, "carb": 38.0, "fat": 26.0}, "아이리시스튜": {"cal": 320, "pro": 24.0, "carb": 18.0, "fat": 17.0}, "비프웰링턴": {"cal": 490, "pro": 26.0, "carb": 22.0, "fat": 33.0}, "마싸만 커리": {"cal": 420, "pro": 20.0, "carb": 18.0, "fat": 30.0}, "달마카니": {"cal": 280, "pro": 10.0, "carb": 28.0, "fat": 14.0}, "램 코르마": {"cal": 460, "pro": 28.0, "carb": 14.0, "fat": 32.0}, "탄두리연어": {"cal": 270, "pro": 28.0, "carb": 3.0, "fat": 16.0}, "연어아보카도포케": {"cal": 530, "pro": 25.0, "carb": 54.0, "fat": 24.0}, "두부버섯솥밥": {"cal": 410, "pro": 14.0, "carb": 72.0, "fat": 7.0}, "오타오타": {"cal": 160, "pro": 14.0, "carb": 6.0, "fat": 9.0}, "기로스 피타": {"cal": 580, "pro": 34.0, "carb": 48.0, "fat": 28.0}, "코프타 케밥": {"cal": 390, "pro": 24.0, "carb": 5.0, "fat": 31.0}, "바스틸라": {"cal": 420, "pro": 18.0, "carb": 45.0, "fat": 18.0}, "케프타 타진": {"cal": 390, "pro": 24.0, "carb": 12.0, "fat": 28.0}, "솔얀카": {"cal": 240, "carb": 11, "pro": 16, "fat": 14}, "칼데이라다": {"cal": 310, "pro": 26.0, "carb": 16.0, "fat": 15.0}, "코지두 아 포르투게사": {"cal": 490, "carb": 24, "pro": 34, "fat": 29}, "무케카": {"cal": 320, "carb": 14, "pro": 24, "fat": 19}, "슬로피 조": {"cal": 390, "pro": 21.0, "carb": 32.0, "fat": 17.0}, "잠발라야": {"cal": 460, "pro": 22.0, "carb": 56.0, "fat": 16.0}, "클래식 세비체": {"cal": 130, "carb": 6, "pro": 21, "fat": 2}, "멘보샤": {"cal": 340, "pro": 8.0, "carb": 20.0, "fat": 25.0}, "들기름막국수": {"cal": 460, "pro": 11.0, "carb": 75.0, "fat": 13.0}, "평양냉면": {"cal": 380, "pro": 14.0, "carb": 78.0, "fat": 2.0}, "비빔냉면": {"cal": 480, "pro": 12.0, "carb": 88.0, "fat": 8.0}, "물냉면": {"cal": 380, "pro": 11.0, "carb": 82.0, "fat": 2.0}, "함흥냉면": {"cal": 430, "pro": 11.0, "carb": 91.0, "fat": 3.0}, "콩나물냉국수": {"cal": 360, "pro": 9.0, "carb": 72.0, "fat": 3.0}, "닭비빔막국수": {"cal": 540, "pro": 24.0, "carb": 84.0, "fat": 12.0}, "간장닭날개튀김": {"cal": 540, "pro": 32.0, "carb": 18.0, "fat": 38.0}, "참치회비빔밥": {"cal": 530, "pro": 26.0, "carb": 82.0, "fat": 11.0}, "간장비빔소면": {"cal": 520, "pro": 13.0, "carb": 95.0, "fat": 10.0}, "칡냉면": {"cal": 460, "pro": 11.0, "carb": 94.0, "fat": 4.0}, "회냉면": {"cal": 470, "pro": 18.0, "carb": 92.0, "fat": 4.0}, "시오라멘": {"cal": 410, "pro": 15.0, "carb": 72.0, "fat": 7.0}, "토리파이탄": {"cal": 580, "pro": 28.0, "carb": 68.0, "fat": 22.0}, "페이조아다": {"cal": 620, "pro": 35, "carb": 58, "fat": 24}, "피캉냐 그릴": {"cal": 480, "pro": 42, "carb": 2, "fat": 32}, "코시냐": {"cal": 390, "pro": 22, "carb": 38, "fat": 16}, "모케카 데 카마라웅": {"cal": 310, "pro": 28, "carb": 12, "fat": 18}, "파웅 지 케이조": {"cal": 280, "pro": 10, "carb": 32, "fat": 13}, "보르시": {"cal": 320, "pro": 22, "carb": 28, "fat": 12}, "펠메니": {"cal": 450, "pro": 28, "carb": 42, "fat": 18}, "올리비에 샐러드": {"cal": 350, "pro": 14, "carb": 30, "fat": 20}, "블리니": {"cal": 290, "pro": 9, "carb": 38, "fat": 12}, "샤슐릭": {"cal": 420, "pro": 38, "carb": 6, "fat": 26}, "루로우판": {"cal": 560, "pro": 28, "carb": 52, "fat": 26}, "지파이": {"cal": 480, "pro": 32, "carb": 36, "fat": 22}, "굴전": {"cal": 280, "pro": 16, "carb": 24, "fat": 14}, "단자이면": {"cal": 430, "pro": 26, "carb": 52, "fat": 12}, "스모크 오리덮밥": {"cal": 510, "pro": 30, "carb": 54, "fat": 18}, "바칼라우 아 브라스": {"cal": 420, "pro": 36, "carb": 28, "fat": 18}, "카르네 데 포르코 아 알렌테자나": {"cal": 490, "pro": 38, "carb": 22, "fat": 24}, "아로스 드 프랑고": {"cal": 510, "pro": 36, "carb": 46, "fat": 16}, "카타플라나": {"cal": 290, "pro": 32, "carb": 10, "fat": 14}, "소파 데 알호": {"cal": 260, "pro": 10, "carb": 30, "fat": 12}, "클래식 버거": {"cal": 580, "pro": 34, "carb": 38, "fat": 32}, "BBQ 풀드포크 샌드위치": {"cal": 520, "pro": 30, "carb": 44, "fat": 22}, "맥앤치즈": {"cal": 490, "pro": 18, "carb": 52, "fat": 24}, "클램베이크": {"cal": 380, "pro": 24, "carb": 36, "fat": 14}, "버팔로 치킨윙": {"cal": 520, "pro": 36, "carb": 12, "fat": 36}, "메르게즈": {"cal": 460, "pro": 30, "carb": 28, "fat": 26}, "셰르물라 생선구이": {"cal": 280, "pro": 36, "carb": 4, "fat": 14}, "타진 므로지아": {"cal": 550, "pro": 32, "carb": 38, "fat": 28}, "자알루크": {"cal": 180, "pro": 4, "carb": 18, "fat": 12}, "브리왓": {"cal": 420, "pro": 20, "carb": 42, "fat": 20}, "카이센나베": {"cal": 310, "pro": 34, "carb": 12, "fat": 10}, "오니기리": {"cal": 270, "pro": 5.0, "carb": 56.0, "fat": 2.0}, "규타쿠": {"cal": 530, "pro": 32, "carb": 50, "fat": 20}, "이카메시": {"cal": 380, "pro": 26, "carb": 48, "fat": 6}, "야키니쿠": {"cal": 580, "pro": 38, "carb": 42, "fat": 26}, "딤섬": {"cal": 160, "pro": 8.0, "carb": 18.0, "fat": 6.0}, "마파당면": {"cal": 420, "pro": 20, "carb": 52, "fat": 14}, "홍콩식볶음국수": {"cal": 460, "pro": 26, "carb": 54, "fat": 14}, "깐쇼두부": {"cal": 260, "pro": 14, "carb": 24, "fat": 12}, "사천식마라소고기볶음": {"cal": 480, "pro": 34, "carb": 16, "fat": 30}, "지리산 흑돼지 카레": {"cal": 580, "pro": 28, "carb": 48, "fat": 30}, "간장양념닭튀김": {"cal": 490, "carb": 32, "pro": 36, "fat": 22}, "생참치회": {"cal": 290, "carb": 2, "pro": 44, "fat": 12}, "참치 카르파초": {"cal": 250, "carb": 4, "pro": 38, "fat": 10}, "멸치국수": {"cal": 310, "carb": 54, "pro": 12, "fat": 5}, "궁보지딩": {"cal": 383, "carb": 17, "pro": 32, "fat": 20}, "마라오이": {"cal": 85, "carb": 9, "pro": 2, "fat": 5}, "오징어튀김": {"cal": 380, "carb": 30, "pro": 20, "fat": 18}, "쫄면": {"cal": 395, "carb": 72, "pro": 12, "fat": 7}, "간짜장": {"cal": 625, "carb": 76, "pro": 26, "fat": 24}, "유니짜장": {"cal": 600, "carb": 78, "pro": 25, "fat": 22}, "사천짜장": {"cal": 650, "carb": 78, "pro": 25, "fat": 26}, "쟁반짜장": {"cal": 680, "carb": 82, "pro": 30, "fat": 22}, "백짬뽕": {"cal": 485, "carb": 62, "pro": 28, "fat": 14}, "차돌짬뽕": {"cal": 545, "carb": 62, "pro": 28, "fat": 22}, "부라타치즈샐러드": {"cal": 296, "pro": 17, "carb": 11, "fat": 19}, "카프레제 샐러드": {"cal": 210, "pro": 12, "carb": 8, "fat": 15}, "아보카도 새우 샐러드": {"cal": 280, "pro": 18, "carb": 12, "fat": 18}, "훈제연어 샐러드": {"cal": 320, "pro": 22, "carb": 6, "fat": 22}, "퀴노아 샐러드": {"cal": 320, "pro": 10, "carb": 44, "fat": 10}, "라흐마준": {"cal": 270, "pro": 12, "carb": 38, "fat": 8}, "피데": {"cal": 480, "pro": 22, "carb": 58, "fat": 18}, "쉬쉬케밥": {"cal": 380, "pro": 36, "carb": 8, "fat": 22}, "오이피클": {"cal": 55, "pro": 1, "carb": 13, "fat": 0}, "당근피클": {"cal": 50, "pro": 1, "carb": 12, "fat": 0}, "양파피클": {"cal": 45, "pro": 1, "carb": 11, "fat": 0}, "깍두기": {"cal": 38, "pro": 1, "carb": 8, "fat": 0}, "백김치": {"cal": 20, "pro": 1, "carb": 4, "fat": 0}, "열무김치": {"cal": 32, "pro": 2, "carb": 5, "fat": 0}, "마늘장아찌": {"cal": 64, "pro": 3, "carb": 13, "fat": 0}, "깻잎장아찌": {"cal": 40, "pro": 1, "carb": 6, "fat": 1}, "무장아찌": {"cal": 65, "pro": 1, "carb": 14, "fat": 1}, "미앙캄": {"cal": 180, "pro": 6, "carb": 22, "fat": 8}, "타오후툿": {"cal": 220, "pro": 12, "carb": 18, "fat": 12}, "팟프릭킹": {"cal": 260, "pro": 20, "carb": 10, "fat": 16}, "브루스케타": {"cal": 180, "pro": 4, "carb": 24, "fat": 8}, "데블드에그": {"cal": 140, "pro": 8, "carb": 1, "fat": 12}, "시저드레싱 샐러드": {"cal": 310, "pro": 10, "carb": 16, "fat": 24}, "포테이토 웨지": {"cal": 280, "pro": 5, "carb": 42, "fat": 10}, "오히타시": {"cal": 60, "pro": 4, "carb": 6, "fat": 2}, "츠케모노": {"cal": 35, "pro": 1, "carb": 8, "fat": 0}, "냉두부": {"cal": 90, "pro": 8, "carb": 3, "fat": 5}, "마제고항": {"cal": 260, "pro": 6, "carb": 48, "fat": 4}, "고마아에": {"cal": 80, "pro": 4, "carb": 8, "fat": 4}, "비시스와즈": {"cal": 160, "pro": 3, "carb": 18, "fat": 9}, "히야야코": {"cal": 85, "pro": 8, "carb": 3, "fat": 5}, "얌팍붕": {"cal": 80, "pro": 6, "carb": 8, "fat": 3}, "사가나키": {"cal": 290, "pro": 14, "carb": 8, "fat": 22}, "멜리찬살라타": {"cal": 120, "pro": 2, "carb": 12, "fat": 8}, "파솔라다": {"cal": 180, "pro": 9, "carb": 28, "fat": 5}, "파타타스 브라바스": {"cal": 271, "pro": 3, "carb": 26, "fat": 18}, "판콘토마테": {"cal": 190, "pro": 4, "carb": 28, "fat": 8}, "감바스 알 아히요": {"cal": 220, "pro": 20, "carb": 2, "fat": 14}, "크로케타스": {"cal": 280, "pro": 10, "carb": 24, "fat": 16}, "엔살라다 올리비에르": {"cal": 230, "pro": 8, "carb": 22, "fat": 13}, "초리소 타파스": {"cal": 260, "pro": 12, "carb": 8, "fat": 20}, "바칼라오 프리토": {"cal": 240, "pro": 24, "carb": 12, "fat": 10}, "엘로테": {"cal": 230, "pro": 6, "carb": 28, "fat": 12}, "프리홀레스 레프리토스": {"cal": 200, "pro": 10, "carb": 28, "fat": 7}, "살사 베르데": {"cal": 40, "pro": 1, "carb": 8, "fat": 1}, "피코 데 가요": {"cal": 35, "pro": 1, "carb": 7, "fat": 0}, "칠라킬레스": {"cal": 320, "pro": 14, "carb": 36, "fat": 14}, "퀘사딜라": {"cal": 290, "pro": 12, "carb": 28, "fat": 16}, "나초스": {"cal": 380, "pro": 10, "carb": 42, "fat": 20}, "멕시코식 라이스": {"cal": 200, "pro": 4, "carb": 40, "fat": 4}, "비낭냐": {"cal": 60, "pro": 1, "carb": 8, "fat": 3}, "파로파": {"cal": 220, "pro": 4, "carb": 36, "fat": 8}, "아카라제": {"cal": 260, "pro": 12, "carb": 28, "fat": 12}, "브라질식 쌀": {"cal": 190, "pro": 4, "carb": 40, "fat": 3}, "코우브 미나스": {"cal": 80, "pro": 4, "carb": 6, "fat": 5}, "투투 아 미네이라": {"cal": 210, "pro": 10, "carb": 30, "fat": 6}, "만디오카 프리타": {"cal": 260, "pro": 2, "carb": 44, "fat": 10}, "밀류 베르제": {"cal": 180, "pro": 4, "carb": 28, "fat": 7}, "비네그레트": {"cal": 120, "pro": 3, "carb": 20, "fat": 4}, "셀료트카": {"cal": 280, "pro": 12, "carb": 18, "fat": 18}, "쿠탸": {"cal": 260, "pro": 6, "carb": 48, "fat": 6}, "베레메쟈니": {"cal": 45, "pro": 3, "carb": 6, "fat": 1}, "샤시그라": {"cal": 200, "pro": 5, "carb": 28, "fat": 8}, "그레치카": {"cal": 180, "pro": 6, "carb": 34, "fat": 4}, "오크로쉬카": {"cal": 130, "pro": 8, "carb": 12, "fat": 6}, "쿠쿠르자 필라프": {"cal": 280, "pro": 5, "carb": 52, "fat": 8}, "모로코 당근 샐러드": {"cal": 100, "pro": 2, "carb": 16, "fat": 4}, "비스타리야": {"cal": 320, "pro": 16, "carb": 28, "fat": 18}, "모로코식 렌틸조림": {"cal": 170, "pro": 10, "carb": 26, "fat": 4}, "라노그": {"cal": 280, "pro": 22, "carb": 20, "fat": 12}, "재리그": {"cal": 90, "pro": 0, "carb": 1, "fat": 10}, "모로코 비트샐러드": {"cal": 110, "pro": 2, "carb": 18, "fat": 4}, "타불레 모로코": {"cal": 130, "pro": 4, "carb": 20, "fat": 5}, "피타 브레드": {"cal": 165, "pro": 6, "carb": 33, "fat": 2}, "기로스 쏘스": {"cal": 80, "pro": 5, "carb": 4, "fat": 4}, "그리스식 구운채소": {"cal": 120, "pro": 3, "carb": 14, "fat": 7}, "모로코식 찐빵": {"cal": 200, "pro": 5, "carb": 36, "fat": 6}, "케라부 망고": {"cal": 120, "pro": 3, "carb": 22, "fat": 4}, "아차르": {"cal": 80, "pro": 2, "carb": 14, "fat": 3}, "삼발 벨라찬": {"cal": 60, "pro": 2, "carb": 8, "fat": 2}, "케툽팟": {"cal": 180, "pro": 4, "carb": 40, "fat": 0}, "이칸빌리스": {"cal": 140, "pro": 14, "carb": 4, "fat": 8}, "나시울람": {"cal": 210, "pro": 5, "carb": 42, "fat": 3}, "파파담": {"cal": 50, "pro": 2, "carb": 8, "fat": 2}, "꿍부부": {"cal": 90, "pro": 5, "carb": 10, "fat": 4}, "루막": {"cal": 200, "pro": 18, "carb": 8, "fat": 12}, "차파티": {"cal": 120, "pro": 4, "carb": 22, "fat": 2}, "달 타르카": {"cal": 180, "pro": 10, "carb": 26, "fat": 5}, "망고 처트니": {"cal": 80, "pro": 0, "carb": 20, "fat": 0}, "알루 고비": {"cal": 150, "pro": 4, "carb": 24, "fat": 5}, "파니르 티카": {"cal": 220, "pro": 14, "carb": 8, "fat": 15}, "나안": {"cal": 260, "pro": 8, "carb": 44, "fat": 6}, "바지": {"cal": 200, "pro": 6, "carb": 24, "fat": 10}, "쿠쿰베르 라이타": {"cal": 70, "pro": 4, "carb": 8, "fat": 2}, "뮤젝리": {"cal": 180, "pro": 8, "carb": 14, "fat": 11}, "파틀리잔 살라타스": {"cal": 100, "pro": 3, "carb": 12, "fat": 5}, "필라키": {"cal": 160, "pro": 8, "carb": 24, "fat": 5}, "카이막": {"cal": 180, "pro": 3, "carb": 4, "fat": 18}, "아욕살라타": {"cal": 80, "pro": 5, "carb": 6, "fat": 4}, "빌릭베레크": {"cal": 250, "pro": 9, "carb": 22, "fat": 15}, "에즈메": {"cal": 60, "pro": 2, "carb": 10, "fat": 3}, "수막 샐러드": {"cal": 50, "pro": 1, "carb": 10, "fat": 2}, "터키식 쌀필라프": {"cal": 220, "pro": 4, "carb": 44, "fat": 4}, "크루디테": {"cal": 60, "pro": 2, "carb": 12, "fat": 1}, "그라탱 도피누아": {"cal": 320, "pro": 8, "carb": 28, "fat": 20}, "프렌치 어니언 수프": {"cal": 280, "pro": 10, "carb": 28, "fat": 14}, "비프 부르기뇽": {"cal": 280, "pro": 22, "carb": 8, "fat": 14}, "피살라디에르": {"cal": 260, "pro": 6, "carb": 32, "fat": 12}, "타르타르 소스": {"cal": 120, "pro": 1, "carb": 4, "fat": 12}, "리옹식 샐러드": {"cal": 240, "pro": 12, "carb": 10, "fat": 18}, "에스카르고": {"cal": 160, "pro": 14, "carb": 2, "fat": 10}, "크레페 살레": {"cal": 220, "pro": 10, "carb": 24, "fat": 10}, "크루푹": {"cal": 100, "pro": 3, "carb": 14, "fat": 4}, "삼발 마타": {"cal": 70, "pro": 1, "carb": 8, "fat": 4}, "우랍": {"cal": 120, "pro": 4, "carb": 10, "fat": 7}, "페르케델": {"cal": 160, "pro": 4, "carb": 20, "fat": 8}, "롤라크": {"cal": 160, "pro": 6, "carb": 12, "fat": 10}, "삼발 오엘렉": {"cal": 30, "pro": 1, "carb": 6, "fat": 0}, "케루풍": {"cal": 110, "pro": 4, "carb": 14, "fat": 5}, "발리식 미고랭": {"cal": 200, "pro": 8, "carb": 28, "fat": 7}, "훔무스": {"cal": 170, "pro": 8, "carb": 18, "fat": 8}, "중동식 타불레": {"cal": 130, "pro": 4, "carb": 20, "fat": 5}, "바바가누쉬": {"cal": 130, "pro": 4, "carb": 14, "fat": 7}, "피타 브레드 중동": {"cal": 165, "pro": 6, "carb": 33, "fat": 2}, "무타발": {"cal": 110, "pro": 4, "carb": 10, "fat": 6}, "만퀴쉬": {"cal": 210, "pro": 5, "carb": 32, "fat": 8}, "라이탄 비타히나": {"cal": 90, "pro": 6, "carb": 4, "fat": 6}, "무하마라": {"cal": 160, "pro": 4, "carb": 14, "fat": 10}, "판싯 칸톤": {"cal": 280, "pro": 14, "carb": 38, "fat": 8}, "루미야": {"cal": 220, "pro": 12, "carb": 20, "fat": 10}, "씨나강": {"cal": 240, "pro": 6, "carb": 44, "fat": 5}, "팡깃": {"cal": 80, "pro": 2, "carb": 18, "fat": 1}, "치키레모스": {"cal": 300, "pro": 18, "carb": 0, "fat": 24}, "푸또": {"cal": 180, "pro": 4, "carb": 32, "fat": 5}, "팟식": {"cal": 120, "pro": 18, "carb": 2, "fat": 4}, "깡꽁 아도보": {"cal": 70, "pro": 3, "carb": 6, "fat": 4}, "아초에": {"cal": 60, "pro": 1, "carb": 14, "fat": 0}, "차 쿼이 테오": {"cal": 200, "pro": 8, "carb": 28, "fat": 8}, "시오 박호": {"cal": 280, "pro": 18, "carb": 2, "fat": 22}, "로작": {"cal": 160, "pro": 5, "carb": 26, "fat": 5}, "포피아": {"cal": 180, "pro": 8, "carb": 24, "fat": 6}, "카야 토스트": {"cal": 220, "pro": 5, "carb": 30, "fat": 10}, "미 고랭": {"cal": 340, "pro": 14, "carb": 48, "fat": 10}, "차 시우 바오": {"cal": 260, "pro": 10, "carb": 38, "fat": 8}, "참새꽃빵": {"cal": 320, "pro": 14, "carb": 48, "fat": 10}, "생강소스": {"cal": 40, "pro": 1, "carb": 6, "fat": 2}, "파파 아 라 후안카이나": {"cal": 280, "pro": 8, "carb": 32, "fat": 14}, "피카 디 팔타": {"cal": 260, "pro": 14, "carb": 6, "fat": 20}, "솔테라": {"cal": 180, "pro": 8, "carb": 22, "fat": 8}, "칸차": {"cal": 160, "pro": 4, "carb": 28, "fat": 5}, "피카 마라니야": {"cal": 120, "pro": 3, "carb": 6, "fat": 10}, "페루식 쌀": {"cal": 190, "pro": 4, "carb": 40, "fat": 3}, "야우사": {"cal": 240, "pro": 10, "carb": 28, "fat": 12}, "엔살라다 데 팔타": {"cal": 150, "pro": 2, "carb": 10, "fat": 12}, "치파 볶음밥": {"cal": 280, "pro": 12, "carb": 44, "fat": 8}, "코울슬로 크리미": {"cal": 150, "pro": 2, "carb": 12, "fat": 11}, "포테이토 샐러드": {"cal": 260, "pro": 6, "carb": 28, "fat": 14}, "옥수수 빵": {"cal": 220, "pro": 5, "carb": 32, "fat": 9}, "그린빈 캐서롤": {"cal": 180, "pro": 5, "carb": 18, "fat": 10}, "갈릭 브레드": {"cal": 200, "pro": 5, "carb": 26, "fat": 9}, "맥앤치즈 사이드": {"cal": 300, "pro": 10, "carb": 36, "fat": 14}, "과카몰레 딥": {"cal": 150, "pro": 2, "carb": 10, "fat": 12}, "베이크드 빈스": {"cal": 200, "pro": 8, "carb": 34, "fat": 5}, "프렌치 온리언 딥": {"cal": 130, "pro": 2, "carb": 8, "fat": 10}, "안티파스토 미스토": {"cal": 280, "pro": 14, "carb": 6, "fat": 22}, "인살라타 카프레제": {"cal": 200, "pro": 12, "carb": 6, "fat": 14}, "브루스케타 이탈리아나": {"cal": 170, "pro": 4, "carb": 24, "fat": 7}, "인살라타 루콜라": {"cal": 120, "pro": 5, "carb": 4, "fat": 10}, "수프리미": {"cal": 260, "pro": 9, "carb": 32, "fat": 11}, "올리브 아스콜라나": {"cal": 220, "pro": 8, "carb": 16, "fat": 14}, "베르두레 그리글리아테": {"cal": 100, "pro": 3, "carb": 12, "fat": 5}, "아차르 망고": {"cal": 60, "pro": 1, "carb": 10, "fat": 3}, "뇨키 파리지앵": {"cal": 240, "pro": 9, "carb": 24, "fat": 13}, "나시 쿠닝": {"cal": 220, "pro": 4, "carb": 44, "fat": 4}, "마무울": {"cal": 180, "pro": 3, "carb": 26, "fat": 8}, "피아디나": {"cal": 190, "pro": 5, "carb": 32, "fat": 6}, "인살라타 판자넬라": {"cal": 180, "pro": 4, "carb": 26, "fat": 8}, "가케우동": {"cal": 360, "pro": 10, "carb": 72, "fat": 4}, "붓카케우동": {"cal": 468, "pro": 14, "carb": 82, "fat": 8}, "모리소바": {"cal": 340, "pro": 14, "carb": 72, "fat": 1}, "카케소바": {"cal": 350, "pro": 14, "carb": 68, "fat": 2}, "토로로소바": {"cal": 380, "pro": 15, "carb": 76, "fat": 2}, "텐자루소바": {"cal": 520, "pro": 20, "carb": 80, "fat": 14}, "오로시소바": {"cal": 320, "pro": 14, "carb": 66, "fat": 1}, "검보": {"cal": 350, "pro": 22, "carb": 20, "fat": 14}, "BBQ 폭립": {"cal": 500, "pro": 30, "carb": 20, "fat": 35}, "사우던 프라이드 치킨": {"cal": 490, "pro": 34, "carb": 28, "fat": 26}, "케이준 새우": {"cal": 280, "pro": 28, "carb": 4, "fat": 16}, "비스킷 앤 그레이비": {"cal": 630, "pro": 23, "carb": 52, "fat": 29}, "호핑 존": {"cal": 320, "pro": 14, "carb": 48, "fat": 8}, "넴짜이": {"cal": 280, "pro": 10, "carb": 36, "fat": 10}};
(function(){
  var _origCalc = window.calcNutrition;
  window.calcNutrition = function(menuName, servings) {
    if (MENU_NUT_EXTRA[menuName]) {
      var n = MENU_NUT_EXTRA[menuName];
      var s = servings || 1;
      return { cal: Math.round(n.cal*s), pro: Math.round(n.pro*s), carb: Math.round(n.carb*s), fat: Math.round(n.fat*s), verified: true, source: '실측영양데이터' };
    }
    if (typeof _origCalc === 'function') return _origCalc(menuName, servings);
    return { cal:0, pro:0, carb:0, fat:0, verified:false };
  };
})();

// ── side dish 식단 추천 제외 패치 ──
(function(){
  var _origKeys = Object.keys;
  function isSideMenu(name) {
    var m = window.CLEAN_MENUS && window.CLEAN_MENUS.find(function(x){ return x.name === name; });
    return m && m.type === 'side';
  }
  // flowBuildMenu, _flowResolveMenuList, totalMeals 등에서 사용하는
  // MENU_DB 키 필터링: side dish 제외
  if (window.MENU_DB) {
    var _origMenuDBKeys = Object.keys(window.MENU_DB);
    Object.defineProperty(window, 'MENU_DB_MAIN_KEYS', {
      get: function() {
        return Object.keys(window.MENU_DB).filter(function(k){ return !isSideMenu(k); });
      }
    });
  }
  // ensureScheduleReady / flowCreatePlan 에서 랜덤 메뉴 뽑을 때 side 제외
  var _origFlowCreatePlan = window.flowCreatePlan;
  if (typeof _origFlowCreatePlan === 'function') {
    window.flowCreatePlan = function(menus, tip) {
      if (menus && menus.length) {
        menus = menus.filter(function(n){ return !isSideMenu(n); });
      }
      return _origFlowCreatePlan(menus, tip);
    };
  }
  // MENU_DB 랜덤 슬라이스에서 side 제외
  var _origFlowCreateCalendar = window.flowCreateCalendar;
  if (typeof _origFlowCreateCalendar === 'function') {
    window.flowCreateCalendar = function(menus) {
      if (menus && menus.length) {
        menus = menus.filter(function(n){ return !isSideMenu(n); });
      }
      return _origFlowCreateCalendar(menus);
    };
  }
  // bcSuggested pool에서도 side 제외
  var _origBcSuggested = window.genBCSuggested;
  if (typeof _origBcSuggested === 'function') {
    window.genBCSuggested = function() {
      var result = _origBcSuggested.apply(this, arguments);
      if (window.S && window.S.bcSuggested) {
        window.S.bcSuggested = window.S.bcSuggested.filter(function(m){ return !isSideMenu(m.name); });
      }
      return result;
    };
  }
  })();

function getMenuNut(name){
  if (typeof calcNutrition === 'function') return calcNutrition(name, 1);
  return {cal:0, carb:0, fat:0, pro:0, verified:false, source:'메뉴별 검증 영양DB 전용'};
}

// ══════════════════════════════════════════════
// SHELF_LIFE_DB  재료별 소비기한 + 보관방법
// storage: "냉장" | "냉동" | "상온"
// days: 보관법 기준 소비기한(일)
// ══════════════════════════════════════════════
const SHELF_LIFE_DB = {
  // ── 육류 ──
  "소고기":       {days:3,  storage:"냉장", frozen:90},
  "돼지고기":     {days:3,  storage:"냉장", frozen:90},
  "닭고기":       {days:2,  storage:"냉장", frozen:90},
  "삼겹살":       {days:3,  storage:"냉장", frozen:90},
  "목살":         {days:3,  storage:"냉장", frozen:90},
  "항정살":       {days:3,  storage:"냉장", frozen:90},
  "통삼겹":       {days:3,  storage:"냉장", frozen:90},
  "닭가슴살":     {days:2,  storage:"냉장", frozen:90},
  "닭다리":       {days:2,  storage:"냉장", frozen:90},
  "닭날개":       {days:2,  storage:"냉장", frozen:90},
  "돼지갈비":     {days:3,  storage:"냉장", frozen:90},
  "소갈비":       {days:3,  storage:"냉장", frozen:90},
  "오리고기":     {days:2,  storage:"냉장", frozen:60},
  "양고기":       {days:3,  storage:"냉장", frozen:90},
  "소고기다짐육": {days:1,  storage:"냉장", frozen:30},
  "돼지다짐육":   {days:1,  storage:"냉장", frozen:30},
  "베이컨":       {days:7,  storage:"냉장", frozen:30},
  "소시지":       {days:7,  storage:"냉장", frozen:60},
  "햄":           {days:7,  storage:"냉장", frozen:60},
  "순대":         {days:2,  storage:"냉장", frozen:30},

  // ── 해산물 ──
  "생선":         {days:2,  storage:"냉장", frozen:60},
  "새우":         {days:2,  storage:"냉장", frozen:60},
  "오징어":       {days:2,  storage:"냉장", frozen:60},
  "낙지":         {days:1,  storage:"냉장", frozen:30},
  "문어":         {days:2,  storage:"냉장", frozen:60},
  "조개":         {days:1,  storage:"냉장", frozen:30},
  "바지락":       {days:1,  storage:"냉장", frozen:30},
  "홍합":         {days:1,  storage:"냉장", frozen:30},
  "굴":           {days:3,  storage:"냉장", frozen:30},
  "연어":         {days:2,  storage:"냉장", frozen:60},
  "고등어":       {days:2,  storage:"냉장", frozen:60},
  "갈치":         {days:2,  storage:"냉장", frozen:60},
  "조기":         {days:2,  storage:"냉장", frozen:60},
  "참치캔":       {days:730,storage:"상온", opened:3},
  "게살":         {days:2,  storage:"냉장", frozen:30},

  // ── 유제품 ──
  "우유":         {days:7,  storage:"냉장"},
  "계란":         {days:30, storage:"냉장"},
  "버터":         {days:30, storage:"냉장", opened:14},
  "생크림":       {days:7,  storage:"냉장", opened:3},
  "치즈":         {days:14, storage:"냉장"},
  "요거트":       {days:14, storage:"냉장"},
  "크림치즈":     {days:14, storage:"냉장", opened:7},
  "두부":         {days:3,  storage:"냉장", opened:1},
  "두유":         {days:7,  storage:"냉장", opened:3},

  // ── 채소 (냉장 기준) ──
  "대파":         {days:7,  storage:"냉장"},
  "쪽파":         {days:5,  storage:"냉장"},
  "양파":         {days:30, storage:"상온"},
  "마늘":         {days:30, storage:"상온", peeled:7},
  "생강":         {days:21, storage:"냉장"},
  "당근":         {days:14, storage:"냉장"},
  "무":           {days:10, storage:"냉장"},
  "양배추":       {days:14, storage:"냉장"},
  "배추":         {days:14, storage:"냉장"},
  "상추":         {days:5,  storage:"냉장"},
  "깻잎":         {days:5,  storage:"냉장"},
  "시금치":       {days:3,  storage:"냉장"},
  "파프리카":     {days:7,  storage:"냉장"},
  "피망":         {days:7,  storage:"냉장"},
  "오이":         {days:5,  storage:"냉장"},
  "애호박":       {days:5,  storage:"냉장"},
  "가지":         {days:5,  storage:"냉장"},
  "토마토":       {days:5,  storage:"냉장"},
  "방울토마토":   {days:5,  storage:"냉장"},
  "버섯":         {days:5,  storage:"냉장"},
  "표고버섯":     {days:5,  storage:"냉장"},
  "팽이버섯":     {days:5,  storage:"냉장"},
  "느타리버섯":   {days:5,  storage:"냉장"},
  "브로콜리":     {days:5,  storage:"냉장"},
  "콜리플라워":   {days:5,  storage:"냉장"},
  "감자":         {days:30, storage:"상온"},
  "고구마":       {days:21, storage:"상온"},
  "청경채":       {days:4,  storage:"냉장"},
  "숙주":         {days:2,  storage:"냉장"},
  "콩나물":       {days:3,  storage:"냉장"},
  "부추":         {days:3,  storage:"냉장"},
  "미나리":       {days:3,  storage:"냉장"},

  // ── 과일 ──
  "사과":         {days:30, storage:"냉장"},
  "배":           {days:14, storage:"냉장"},
  "바나나":       {days:5,  storage:"상온"},
  "딸기":         {days:3,  storage:"냉장"},
  "귤":           {days:14, storage:"냉장"},
  "레몬":         {days:14, storage:"냉장"},
  "라임":         {days:14, storage:"냉장"},
  "망고":         {days:5,  storage:"냉장"},
  "아보카도":     {days:3,  storage:"냉장"},
  "포도":         {days:7,  storage:"냉장"},
  "복숭아":       {days:3,  storage:"냉장"},
  "수박":         {days:3,  storage:"냉장", whole:7},

  // ── 곡물/건식품 (상온) ──
  "쌀":           {days:365,storage:"상온"},
  "현미":         {days:180,storage:"상온"},
  "밀가루":       {days:180,storage:"상온"},
  "전분":         {days:365,storage:"상온"},
  "설탕":         {days:730,storage:"상온"},
  "소금":         {days:1825,storage:"상온"},
  "스파게티":     {days:730,storage:"상온"},
  "중면":         {days:365,storage:"상온"},
  "당면":         {days:365,storage:"상온"},
  "냉면":         {days:180,storage:"상온"},
  "소면":         {days:365,storage:"상온"},
  "메밀면":       {days:365,storage:"상온"},
  "쌀국수":       {days:730,storage:"상온"},
  "빵":           {days:3,  storage:"상온"},
  "식빵":         {days:5,  storage:"상온"},
  "또띠아":       {days:7,  storage:"냉장"},
  "오트밀":       {days:365,storage:"상온"},
  "쿠스쿠스":     {days:730,storage:"상온"},

  // ── 조미료/소스 (개봉 후) ──
  "간장":         {days:180,storage:"상온", opened:90},
  "국간장":       {days:180,storage:"상온", opened:90},
  "된장":         {days:90, storage:"냉장"},
  "고추장":       {days:90, storage:"냉장"},
  "쌈장":         {days:60, storage:"냉장"},
  "참기름":       {days:180,storage:"상온"},
  "들기름":       {days:60, storage:"냉장"},
  "식용유":       {days:365,storage:"상온"},
  "올리브오일":   {days:365,storage:"상온", opened:60},
  "식초":         {days:730,storage:"상온"},
  "고춧가루":     {days:90, storage:"냉장"},
  "후추":         {days:365,storage:"상온"},
  "소금":         {days:1825,storage:"상온"},
  "설탕":         {days:730,storage:"상온"},
  "꿀":           {days:730,storage:"상온"},
  "마요네즈":     {days:90, storage:"냉장"},
  "케첩":         {days:90, storage:"냉장"},
  "머스터드":     {days:90, storage:"냉장"},
  "굴소스":       {days:90, storage:"냉장"},
  "피시소스":     {days:180,storage:"상온"},
  "미림":         {days:180,storage:"상온", opened:60},
  "청주":         {days:180,storage:"상온"},
  "고형카레":     {days:365,storage:"상온", opened:30},
  "카레가루":     {days:365,storage:"상온", opened:30},
  "와사비":       {days:90, storage:"냉장"},
  "망고처트니":   {days:180,storage:"냉장", opened:30},
  "하리사":       {days:90, storage:"냉장"},
  "두반장":       {days:90, storage:"냉장"},

  // ── 냉동식품 ──
  "만두":         {days:90, storage:"냉동"},
  "냉동새우":     {days:90, storage:"냉동"},
  "냉동만두":     {days:90, storage:"냉동"},
  "아이스크림":   {days:30, storage:"냉동"},
};

// 재료명으로 소비기한 자동 조회
function getShelfLife(name) {
  // 직접 매칭
  if(SHELF_LIFE_DB[name]) return SHELF_LIFE_DB[name];
  // 부분 매칭 (예: "닭가슴살볶음" → "닭가슴살")
  for(const key of Object.keys(SHELF_LIFE_DB)) {
    if(name.includes(key)) return SHELF_LIFE_DB[key];
  }
  // 기본값: 냉장 7일
  return {days:7, storage:"냉장"};
}

const CLEAN_MENUS = window.CLEAN_MENUS = [{"style":"한식","name":"된장찌개","ingredients":["두부","애호박","양파","대파","된장","멸치육수"],"cookTime":20,"tags":["헬시"],"nameEn":"Doenjang Stew (Fermented Soybean Paste Stew)","nutrition":{"cal":130,"pro":9.0,"carb":9.0,"fat":6.0},"type":"main"},{"style":"한식","name":"김치찌개","ingredients":["김치","돼지고기","두부","대파","고춧가루","간장"],"cookTime":25,"tags":[],"nameEn":"Kimchi Stew","nutrition":{"cal":210,"pro":18.0,"carb":8.0,"fat":12.0},"type":"main"},{"style":"한식","name":"참치김치찌개","ingredients":["김치","참치캔","두부","대파","고춧가루"],"cookTime":20,"tags":[],"nameEn":"Tuna and Kimchi Stew","nutrition":{"cal":170,"pro":15.0,"carb":8.0,"fat":9.0},"type":"main"},{"style":"한식","name":"순두부찌개","ingredients":["순두부","계란","대파","양파","고춧가루","간장"],"cookTime":20,"tags":["헬시"],"nameEn":"Sundubu Jjigae (Soft Tofu Stew)","nutrition":{"cal":160,"pro":12.0,"carb":6.0,"fat":10.0},"type":"main"},{"style":"한식","name":"해물순두부찌개","ingredients":["순두부","새우","오징어","계란","대파","고춧가루"],"cookTime":25,"tags":[],"nameEn":"Seafood Soft Tofu Stew","nutrition":{"cal":160,"pro":14.0,"carb":8.0,"fat":8.0},"type":"main"},{"style":"한식","name":"부대찌개","ingredients":["김치","햄","소시지","두부","라면","대파","고추장"],"cookTime":30,"tags":[],"nameEn":"Budae Jjigae (Army Stew)","nutrition":{"cal":340,"pro":20.0,"carb":12.0,"fat":24.0},"type":"main"},{"style":"한식","name":"청국장찌개","ingredients":["청국장","두부","김치","양파","애호박","대파"],"cookTime":25,"tags":["헬시"],"nameEn":"Cheonggukjang Jjigae (Fermented Soybean Stew)","nutrition":{"cal":180,"pro":14.0,"carb":14.0,"fat":8.0},"type":"main"},{"style":"한식","name":"감자탕","ingredients":["돼지등뼈","감자","우거지","대파","된장","고춧가루"],"cookTime":60,"tags":[],"nameEn":"Pork Bone and Potato Soup","nutrition":{"cal":510,"pro":45.0,"carb":22.0,"fat":27.0},"type":"main"},{"style":"한식","name":"동태찌개","ingredients":["동태","무","두부","대파","고춧가루","마늘"],"cookTime":30,"tags":[],"nameEn":"Pollock Stew","nutrition":{"cal":160,"pro":20.0,"carb":8.0,"fat":5.0},"type":"main"},{"style":"한식","name":"꽃게탕","ingredients":["꽃게","무","애호박","양파","대파","고춧가루"],"cookTime":30,"tags":[],"nameEn":"Blue Crab Soup","nutrition":{"cal":210,"pro":24.0,"carb":12.0,"fat":7.0},"type":"main"},{"style":"한식","name":"미역국","ingredients":["미역","소고기","마늘","간장","참기름"],"cookTime":25,"tags":["헬시"],"nameEn":"Seaweed Soup","nutrition":{"cal":65,"pro":4.0,"carb":3.0,"fat":4.5},"type":"main"},{"style":"한식","name":"소고기뭇국","ingredients":["소고기","무","대파","마늘","간장"],"cookTime":30,"tags":[],"nameEn":"Beef and Radish Soup","nutrition":{"cal":110,"pro":12.0,"carb":4.0,"fat":5.0},"type":"main"},{"style":"한식","name":"콩나물국","ingredients":["콩나물","대파","마늘","국간장"],"cookTime":15,"tags":[],"nameEn":"Bean Sprout Soup","nutrition":{"cal":40,"pro":3.0,"carb":4.0,"fat":2.0},"type":"main"},{"style":"한식","name":"북어국","ingredients":["북어","무","계란","대파","마늘"],"cookTime":20,"tags":[],"nameEn":"Dried Pollack Soup","nutrition":{"cal":90,"pro":12.0,"carb":2.0,"fat":3.8},"type":"main"},{"style":"한식","name":"육개장","ingredients":["소고기","고사리","숙주","대파","고춧가루","마늘"],"cookTime":45,"tags":[],"nameEn":"Yukgaejang (Spicy Beef Soup)","nutrition":{"cal":240,"pro":19.0,"carb":14.0,"fat":12.0},"type":"main"},{"style":"한식","name":"갈비탕","ingredients":["소갈비","무","대파","마늘","당면"],"cookTime":60,"tags":[],"nameEn":"Short Rib Soup","nutrition":{"cal":420,"pro":35.0,"carb":10.0,"fat":26.0},"type":"main"},{"style":"한식","name":"삼계탕","ingredients":["닭고기","찹쌀","마늘","대추","인삼"],"cookTime":60,"tags":["헬시"],"nameEn":"Samgyetang (Ginseng Chicken Soup)","nutrition":{"cal":680,"pro":65.0,"carb":15.0,"fat":38.0},"type":"main"},{"style":"한식","name":"제육볶음","ingredients":["돼지고기","양파","대파","고추장","고춧가루","간장"],"cookTime":25,"tags":[],"nameEn":"Jeyuk Bokkeum (Spicy Pork Stir-fry)","nutrition":{"cal":310,"pro":22.0,"carb":10.0,"fat":20.0},"type":"main"},{"style":"한식","name":"간장제육볶음","ingredients":["돼지고기","양파","대파","간장","설탕","마늘"],"cookTime":25,"tags":[],"nameEn":"Soy Sauce Spicy Pork Stir-fry","nutrition":{"cal":380,"pro":28.0,"carb":12.0,"fat":24.0},"type":"main"},{"style":"한식","name":"소불고기","ingredients":["소고기","양파","대파","간장","설탕","참기름"],"cookTime":25,"tags":[],"nameEn":"Beef Bulgogi","nutrition":{"cal":290,"pro":24.0,"carb":14.0,"fat":15.0},"type":"main"},{"style":"한식","name":"돼지불고기","ingredients":["돼지고기","양파","대파","간장","설탕","마늘"],"cookTime":25,"tags":[],"nameEn":"Pork Bulgogi","nutrition":{"cal":320,"pro":24.0,"carb":12.0,"fat":19.0},"type":"main"},{"style":"한식","name":"닭갈비","ingredients":["닭고기","양배추","고구마","대파","고추장","떡"],"cookTime":30,"tags":[],"nameEn":"Dakgalbi (Spicy Stir-fried Chicken)","nutrition":{"cal":390,"pro":32.0,"carb":16.0,"fat":22.0},"type":"main"},{"style":"한식","name":"닭볶음탕","ingredients":["닭고기","감자","당근","양파","고추장","간장"],"cookTime":40,"tags":[],"nameEn":"Braised Spicy Chicken","nutrition":{"cal":370,"pro":34.0,"carb":16.0,"fat":19.0},"type":"main"},{"style":"한식","name":"찜닭","ingredients":["닭고기","감자","당근","양파","당면","간장"],"cookTime":40,"tags":[],"nameEn":"Jjimdak (Braised Chicken)","nutrition":{"cal":380,"pro":32.0,"carb":24.0,"fat":17.0},"type":"main"},{"style":"한식","name":"갈비찜","ingredients":["소갈비","무","당근","대파","간장","설탕"],"cookTime":60,"tags":[],"nameEn":"Braised Short Ribs","nutrition":{"cal":450,"pro":32.0,"carb":15.0,"fat":28.0},"type":"main"},{"style":"한식","name":"돼지갈비찜","ingredients":["돼지갈비","무","당근","대파","간장","설탕"],"cookTime":60,"tags":[],"nameEn":"Braised Pork Ribs","nutrition":{"cal":430,"pro":28.0,"carb":14.0,"fat":29.0},"type":"main"},{"style":"한식","name":"보쌈","ingredients":["돼지고기","마늘","대파","된장","배추","쌈장"],"cookTime":60,"tags":[],"nameEn":"Bossam (Steamed Pork Wraps)","nutrition":{"cal":520,"pro":28.0,"carb":2.0,"fat":45.0},"type":"main"},{"style":"한식","name":"수육","ingredients":["돼지고기","마늘","대파","된장","양파"],"cookTime":60,"tags":[],"nameEn":"Suyuk (Boiled Pork Slices)","nutrition":{"cal":420,"carb":0,"pro":27,"fat":34},"type":"main"},{"style":"한식","name":"오징어볶음","ingredients":["오징어","양파","당근","대파","고추장","고춧가루"],"cookTime":25,"tags":[],"nameEn":"Stir-fried Spicy Squid","nutrition":{"cal":190,"pro":20.0,"carb":11.0,"fat":7.0},"type":"main"},{"style":"한식","name":"낙지볶음","ingredients":["낙지","양파","당근","대파","고추장","고춧가루"],"cookTime":25,"tags":[],"nameEn":"Stir-fried Spicy Octopus","nutrition":{"cal":190,"pro":20.0,"carb":14.0,"fat":6.0},"type":"main"},{"style":"한식","name":"주꾸미볶음","ingredients":["주꾸미","양파","대파","고추장","고춧가루","마늘"],"cookTime":25,"tags":[],"nameEn":"Stir-fried Baby Octopus","nutrition":{"cal":220,"pro":22.0,"carb":14.0,"fat":8.0},"type":"main"},{"style":"한식","name":"고등어구이","ingredients":["고등어","소금","식용유","레몬"],"cookTime":20,"tags":["헬시"],"nameEn":"Grilled Mackerel","nutrition":{"cal":290,"pro":27.0,"carb":0.2,"fat":20.0},"type":"main"},{"style":"한식","name":"고등어조림","ingredients":["고등어","무","대파","간장","고춧가루","마늘"],"cookTime":30,"tags":[],"nameEn":"Braised Mackerel","nutrition":{"cal":310,"pro":28.0,"carb":10.0,"fat":17.0},"type":"main"},{"style":"한식","name":"갈치조림","ingredients":["갈치","무","양파","대파","간장","고춧가루"],"cookTime":30,"tags":[],"nameEn":"Braised Hairtail Fish","nutrition":{"cal":310,"pro":32.0,"carb":14.0,"fat":13.0},"type":"main"},{"style":"한식","name":"삼치구이","ingredients":["삼치","소금","식용유","레몬"],"cookTime":20,"tags":[],"nameEn":"Grilled Spanish Mackerel","nutrition":{"cal":260,"pro":29.0,"carb":0.2,"fat":15.0},"type":"main"},{"style":"한식","name":"비빔밥","ingredients":["쌀","시금치","콩나물","당근","계란","고추장","참기름"],"cookTime":25,"tags":["헬시"],"nameEn":"Bibimbap","nutrition":{"cal":530,"pro":17.0,"carb":84.0,"fat":14.0},"type":"main"},{"style":"한식","name":"김치볶음밥","ingredients":["쌀","김치","계란","대파","참기름"],"cookTime":15,"tags":[],"nameEn":"Kimchi Fried Rice","nutrition":{"cal":430,"pro":12.0,"carb":72.0,"fat":11.0},"type":"main"},{"style":"한식","name":"새우볶음밥","ingredients":["쌀","새우","계란","대파","당근","간장"],"cookTime":20,"tags":[],"nameEn":"Shrimp Fried Rice","nutrition":{"cal":430,"pro":16.0,"carb":66.0,"fat":11.0},"type":"main"},{"style":"한식","name":"오므라이스","ingredients":["쌀","계란","양파","당근","케첩","버터"],"cookTime":25,"tags":[],"nameEn":"Omurice (Omelette Rice)","nutrition":{"cal":580,"pro":15.0,"carb":78.0,"fat":23.0},"type":"main"},{"style":"한식","name":"카레라이스","ingredients":["쌀","카레가루","감자","당근","양파","돼지고기"],"cookTime":30,"tags":[],"nameEn":"Curry Rice","nutrition":{"cal":620,"pro":16.0,"carb":102.0,"fat":16.0},"type":"main"},{"style":"한식","name":"콩나물밥","ingredients":["쌀","콩나물","소고기","대파","간장","참기름"],"cookTime":30,"tags":[],"nameEn":"Bean Sprout Rice","nutrition":{"cal":380,"pro":9.0,"carb":76.0,"fat":4.0},"type":"main"},{"style":"한식","name":"김밥","ingredients":["쌀","김","계란","단무지","당근","시금치","햄"],"cookTime":40,"tags":[],"nameEn":"Gimbap","nutrition":{"cal":420,"pro":12.0,"carb":72.0,"fat":9.0},"type":"main"},{"style":"한식","name":"떡국","ingredients":["떡","소고기","계란","대파","마늘"],"cookTime":25,"tags":[],"nameEn":"Tteokguk (Rice Cake Soup)","nutrition":{"cal":430,"pro":16.0,"carb":78.0,"fat":6.0},"type":"main"},{"style":"한식","name":"떡볶이","ingredients":["떡","어묵","대파","고추장","고춧가루","설탕"],"cookTime":20,"tags":[],"nameEn":"Tteokbokki (Spicy Rice Cakes)","nutrition":{"cal":360,"pro":7.0,"carb":70.0,"fat":5.0},"type":"main"},{"style":"한식","name":"라볶이","ingredients":["라면","떡","어묵","대파","고추장","설탕"],"cookTime":20,"tags":[],"nameEn":"Rabokki (Ramen and Tteokbokki)","nutrition":{"cal":450,"pro":10.0,"carb":85.0,"fat":7.0},"type":"main"},{"style":"한식","name":"잡채","ingredients":["당면","돼지고기","시금치","당근","양파","간장","참기름"],"cookTime":35,"tags":["헬시"],"nameEn":"Japchae (Glass Noodles with Vegetables)","nutrition":{"cal":140,"pro":2.0,"carb":22.0,"fat":5.0},"type":"main"},{"style":"한식","name":"잔치국수","ingredients":["소면","계란","애호박","당근","멸치육수","간장"],"cookTime":25,"tags":[],"nameEn":"Janchi Guksu (Festive Noodle Soup)","nutrition":{"cal":380,"pro":12.0,"carb":74.0,"fat":4.0},"type":"main"},{"style":"한식","name":"비빔국수","ingredients":["소면","오이","계란","고추장","식초","설탕"],"cookTime":20,"tags":[],"nameEn":"Bibim Guksu (Spicy Mixed Noodles)","nutrition":{"cal":490,"pro":11.0,"carb":84.0,"fat":11.0},"type":"main"},{"style":"한식","name":"칼국수","ingredients":["칼국수면","애호박","감자","대파","멸치육수"],"cookTime":30,"tags":[],"nameEn":"Kalguksu (Knife-cut Noodle Soup)","nutrition":{"cal":410,"pro":12.0,"carb":82.0,"fat":4.0},"type":"main"},{"style":"한식","name":"수제비","ingredients":["밀가루","감자","애호박","대파","멸치육수"],"cookTime":35,"tags":[],"nameEn":"Sujebi (Hand-torn Noodle Soup)","nutrition":{"cal":410,"pro":11.0,"carb":82.0,"fat":4.0},"type":"main"},{"style":"한식","name":"김치전","ingredients":["김치","밀가루","계란","대파","식용유"],"cookTime":20,"tags":[],"nameEn":"Kimchi Pancake","nutrition":{"cal":240,"pro":5.0,"carb":32.0,"fat":10.0},"type":"main"},{"style":"한식","name":"해물파전","ingredients":["쪽파","오징어","새우","밀가루","계란","식용유"],"cookTime":25,"tags":[],"nameEn":"Seafood Scallion Pancake","nutrition":{"cal":380,"pro":12.0,"carb":44.0,"fat":16.0},"type":"main"},{"style":"한식","name":"감자전","ingredients":["감자","소금","식용유"],"cookTime":20,"tags":[],"nameEn":"Potato Pancake","nutrition":{"cal":230,"pro":3.0,"carb":34.0,"fat":9.0},"type":"side"},{"style":"한식","name":"계란말이","ingredients":["계란","당근","대파","소금","식용유"],"cookTime":10,"tags":[],"nameEn":"Rolled Egg Omelette","nutrition":{"cal":210,"pro":14.0,"carb":3.0,"fat":16.0},"type":"side"},{"style":"한식","name":"계란찜","ingredients":["계란","대파","소금","참기름"],"cookTime":10,"tags":[],"nameEn":"Steamed Egg","nutrition":{"cal":90,"pro":8.0,"carb":2.0,"fat":6.0},"type":"side"},{"style":"한식","name":"두부조림","ingredients":["두부","대파","간장","고춧가루","마늘"],"cookTime":15,"tags":["헬시"],"nameEn":"Braised Tofu","nutrition":{"cal":150,"pro":11.0,"carb":7.0,"fat":8.0},"type":"side"},{"style":"한식","name":"장조림","ingredients":["소고기","계란","간장","마늘","설탕"],"cookTime":45,"tags":[],"nameEn":"Soy-braised Beef","nutrition":{"cal":75,"pro":12.0,"carb":2.0,"fat":2.0},"type":"side"},{"style":"한식","name":"멸치볶음","ingredients":["멸치","간장","물엿","마늘","참기름"],"cookTime":10,"tags":[],"nameEn":"Stir-fried Dried Anchovies","nutrition":{"cal":70,"pro":5.0,"carb":4.0,"fat":3.5},"type":"side"},{"style":"한식","name":"어묵볶음","ingredients":["어묵","양파","당근","간장","마늘"],"cookTime":15,"tags":[],"nameEn":"Stir-fried Fish Cakes","nutrition":{"cal":120,"pro":6.0,"carb":10.0,"fat":6.0},"type":"side"},{"style":"한식","name":"시금치나물","ingredients":["시금치","간장","마늘","참기름","깨"],"cookTime":10,"tags":[],"nameEn":"Seasoned Spinach","nutrition":{"cal":35,"pro":2.0,"carb":3.0,"fat":1.8},"type":"side"},{"style":"한식","name":"콩나물무침","ingredients":["콩나물","대파","마늘","참기름","고춧가루"],"cookTime":10,"tags":[],"nameEn":"Seasoned Bean Sprouts","nutrition":{"cal":30,"pro":2.0,"carb":3.0,"fat":1.0},"type":"side"},{"style":"한식","name":"오이무침","ingredients":["오이","고춧가루","식초","설탕","마늘"],"cookTime":10,"tags":[],"nameEn":"Seasoned Cucumber","nutrition":{"cal":35,"pro":1.0,"carb":5.0,"fat":1.2},"type":"side"},{"style":"한식","name":"무생채","ingredients":["무","고춧가루","식초","설탕","마늘"],"cookTime":15,"tags":[],"nameEn":"Spicy Radish Salad","nutrition":{"cal":25,"pro":0.5,"carb":4.0,"fat":0.2},"type":"side"},{"style":"한식","name":"오이소박이","ingredients":["오이","부추","고춧가루","마늘","액젓"],"cookTime":30,"tags":[],"nameEn":"Cucumber Kimchi","nutrition":{"cal":30,"pro":1.2,"carb":5.0,"fat":0.3},"type":"side"},{"style":"일식","name":"규동","ingredients":["쌀","소고기","양파","간장","미림","설탕"],"cookTime":20,"tags":[],"nameEn":"Gyudon (Beef Rice Bowl)","nutrition":{"cal":560,"pro":24.0,"carb":78.0,"fat":17.0},"type":"main"},{"style":"일식","name":"오야코동","ingredients":["쌀","닭고기","계란","양파","간장","미림"],"cookTime":20,"tags":[],"nameEn":"Oyakodon (Chicken and Egg Rice Bowl)","nutrition":{"cal":560,"pro":25.0,"carb":74.0,"fat":19.0},"type":"main"},{"style":"일식","name":"가츠동","ingredients":["쌀","돈카츠","계란","양파","간장","미림"],"cookTime":25,"tags":[],"nameEn":"Katsudon","nutrition":{"cal":808,"pro":36.0,"carb":106.0,"fat":25.0},"type":"main"},{"style":"일식","name":"텐동","ingredients":["쌀","새우","가지","단호박","튀김가루","간장"],"cookTime":30,"tags":[],"nameEn":"Tendon (Tempura Rice Bowl)","nutrition":{"cal":750,"pro":18.0,"carb":98.0,"fat":32.0},"type":"main"},{"style":"일식","name":"카레우동","ingredients":["우동","카레가루","양파","당근","돼지고기"],"cookTime":25,"tags":[],"nameEn":"Curry Udon","nutrition":{"cal":490,"pro":14.0,"carb":78.0,"fat":13.0},"type":"main"},{"style":"일식","name":"유부우동","ingredients":["우동","유부","대파","간장","멸치육수"],"cookTime":15,"tags":[],"nameEn":"Kitsune Udon (Tofu Pouch Udon)","nutrition":{"cal":430,"pro":14.0,"carb":72.0,"fat":9.0},"type":"main"},{"style":"일식","name":"야키소바","ingredients":["중면","돼지고기","양배추","당근","우스터소스"],"cookTime":20,"tags":[],"nameEn":"Yakisoba","nutrition":{"cal":480,"pro":12.0,"carb":68.0,"fat":18.0},"type":"main"},{"style":"일식","name":"쇼유라멘","ingredients":["라면","계란","대파","돼지고기","간장"],"cookTime":30,"tags":[],"nameEn":"Shoyu Ramen","nutrition":{"cal":430,"pro":16.0,"carb":70.0,"fat":9.0},"type":"main"},{"style":"일식","name":"미소라멘","ingredients":["라면","미소된장","숙주","계란","대파","돼지고기"],"cookTime":30,"tags":[],"nameEn":"Miso Ramen","nutrition":{"cal":520,"pro":18.0,"carb":75.0,"fat":16.0},"type":"main"},{"style":"일식","name":"돈코츠라멘","ingredients":["라면","돼지고기","계란","숙주","대파","사골육수"],"cookTime":35,"tags":[],"nameEn":"Tonkotsu Ramen","nutrition":{"cal":620,"pro":26.0,"carb":76.0,"fat":24.0},"type":"main"},{"style":"일식","name":"돈카츠","ingredients":["돼지고기","계란","밀가루","빵가루","양배추"],"cookTime":30,"tags":[],"nameEn":"Tonkatsu (Pork Cutlet)","nutrition":{"cal":410,"pro":24.0,"carb":18.0,"fat":28.0},"type":"main"},{"style":"일식","name":"치킨카츠","ingredients":["닭고기","계란","밀가루","빵가루","양배추"],"cookTime":30,"tags":[],"nameEn":"Chicken Katsu","nutrition":{"cal":380,"pro":24.0,"carb":18.0,"fat":24.0},"type":"main"},{"style":"일식","name":"가라아게","ingredients":["닭고기","간장","마늘","생강","전분"],"cookTime":25,"tags":[],"nameEn":"Karaage","nutrition":{"cal":400,"pro":32.0,"carb":10.0,"fat":26.0},"type":"main"},{"style":"일식","name":"데리야키치킨","ingredients":["닭고기","간장","미림","설탕","마늘"],"cookTime":25,"tags":[],"nameEn":"Teriyaki Chicken","nutrition":{"cal":310,"pro":28.0,"carb":12.0,"fat":16.0},"type":"main"},{"style":"일식","name":"연어데리야키","ingredients":["연어","간장","미림","설탕","생강"],"cookTime":20,"tags":[],"nameEn":"Salmon Teriyaki","nutrition":{"cal":320,"pro":28.0,"carb":10.0,"fat":18.0},"type":"main"},{"style":"일식","name":"사바미소니","ingredients":["고등어","미소된장","생강","미림","설탕"],"cookTime":25,"tags":[],"nameEn":"Saba Misoni (Mackerel Simmered in Miso)","nutrition":{"cal":320,"pro":24.0,"carb":8.0,"fat":21.0},"type":"main"},{"style":"일식","name":"오코노미야키","ingredients":["양배추","돼지고기","계란","밀가루","마요네즈"],"cookTime":25,"tags":[],"nameEn":"Okonomiyaki (Japanese Savory Pancake)","nutrition":{"cal":360,"pro":14.0,"carb":34.0,"fat":19.0},"type":"main"},{"style":"일식","name":"타코야키","ingredients":["문어","밀가루","계란","대파","마요네즈"],"cookTime":30,"tags":[],"nameEn":"Takoyaki (Octopus Balls)","nutrition":{"cal":260,"pro":7.0,"carb":34.0,"fat":11.0},"type":"main"},{"style":"일식","name":"니쿠자가","ingredients":["소고기","감자","당근","양파","간장","미림"],"cookTime":35,"tags":[],"nameEn":"Nikujaga (Meat and Potato Stew)","nutrition":{"cal":260,"pro":14.0,"carb":24.0,"fat":12.0},"type":"main"},{"style":"일식","name":"스키야키","ingredients":["소고기","두부","대파","버섯","간장","설탕"],"cookTime":35,"tags":[],"nameEn":"Sukiyaki","nutrition":{"cal":380,"pro":24.0,"carb":18.0,"fat":22.0},"type":"main"},{"style":"일식","name":"샤브샤브","ingredients":["소고기","배추","버섯","두부","대파","폰즈소스"],"cookTime":30,"tags":[],"nameEn":"Shabu-Shabu","nutrition":{"cal":340,"pro":32.0,"carb":12.0,"fat":16.0},"type":"main"},{"style":"일식","name":"미소국","ingredients":["미소된장","두부","미역","대파"],"cookTime":10,"tags":[],"nameEn":"Miso Soup","nutrition":{"cal":40,"pro":3.0,"carb":4.0,"fat":1.0},"type":"main"},{"style":"일식","name":"차완무시","ingredients":["계란","새우","표고버섯","닭고기","간장"],"cookTime":25,"tags":[],"nameEn":"Chawanmushi (Japanese Steamed Egg Custard)","nutrition":{"cal":90,"pro":8.0,"carb":3.0,"fat":5.0},"type":"side"},{"style":"일식","name":"이나리초밥","ingredients":["쌀","유부","식초","설탕","깨"],"cookTime":25,"tags":[],"nameEn":"Inari Sushi","nutrition":{"cal":320,"pro":9.0,"carb":54.0,"fat":7.0},"type":"main"},{"style":"일식","name":"연어초밥","ingredients":["쌀","연어","식초","와사비"],"cookTime":30,"tags":[],"nameEn":"Salmon Sushi","nutrition":{"cal":480,"pro":22.0,"carb":68.0,"fat":13.0},"type":"main"},{"style":"일식","name":"참치마요오니기리","ingredients":["쌀","참치캔","마요네즈","김"],"cookTime":15,"tags":[],"nameEn":"Tuna Mayo Onigiri","nutrition":{"cal":210,"pro":5.0,"carb":36.0,"fat":5.0},"type":"main"},{"style":"일식","name":"명란오니기리","ingredients":["쌀","명란","김","참기름"],"cookTime":15,"tags":[],"nameEn":"Mentaiko Onigiri","nutrition":{"cal":260,"pro":7.0,"carb":48.0,"fat":4.0},"type":"main"},{"style":"일식","name":"일본식계란말이","ingredients":["계란","간장","설탕","식용유"],"cookTime":15,"tags":[],"nameEn":"Japanese Rolled Egg (Tamagoyaki)","nutrition":{"cal":150,"pro":10.0,"carb":8.0,"fat":9.0},"type":"side"},{"style":"일식","name":"자루소바","ingredients":["메밀면","대파","무","간장"],"cookTime":15,"tags":[],"nameEn":"Zaru Soba (Cold Soba Noodles)","nutrition":{"cal":340,"pro":12.0,"carb":68.0,"fat":2.0},"type":"main"},{"style":"일식","name":"나베야키우동","ingredients":["우동","새우","계란","버섯","대파"],"cookTime":30,"tags":[],"nameEn":"Nabeyaki Udon","nutrition":{"cal":460,"pro":16.0,"carb":82.0,"fat":7.0},"type":"main"},{"style":"일식","name":"일본식 카레라이스","ingredients":["쌀","카레가루","감자","당근","양파","소고기"],"cookTime":30,"tags":[],"nameEn":"Japanese Curry Rice","nutrition":{"cal":620,"pro":16.0,"carb":102.0,"fat":16.0},"type":"main"},{"style":"중식","name":"마파두부","ingredients":["두부","돼지고기","대파","두반장","간장","전분"],"cookTime":20,"tags":[],"nameEn":"Mapo Tofu","nutrition":{"cal":240,"pro":14.0,"carb":10.0,"fat":16.0},"type":"main"},{"style":"중식","name":"짜장면","ingredients":["중면","돼지고기","양파","양배추","춘장"],"cookTime":30,"tags":[],"nameEn":"Jjajangmyeon (Black Bean Noodles)","nutrition":{"cal":680,"pro":18.0,"carb":110.0,"fat":19.0},"type":"main"},{"style":"중식","name":"짬뽕","ingredients":["중면","오징어","새우","양배추","양파","고춧가루"],"cookTime":30,"tags":[],"nameEn":"Jjamppong (Spicy Seafood Noodle Soup)","nutrition":{"cal":560,"pro":23.0,"carb":84.0,"fat":15.0},"type":"main"},{"style":"중식","name":"계란볶음밥","ingredients":["쌀","계란","대파","간장","식용유"],"cookTime":15,"tags":[],"nameEn":"Egg Fried Rice","nutrition":{"cal":410,"pro":12.0,"carb":66.0,"fat":10.0},"type":"main"},{"style":"중식","name":"탕수육","ingredients":["돼지고기","전분","계란","식초","설탕","간장"],"cookTime":35,"tags":[],"nameEn":"Tangsuyuk (Sweet and Sour Pork)","nutrition":{"cal":460,"pro":16.0,"carb":44.0,"fat":24.0},"type":"main"},{"style":"중식","name":"깐풍기","ingredients":["닭고기","전분","대파","마늘","간장","식초"],"cookTime":30,"tags":[],"nameEn":"Gan Pung Chicken","nutrition":{"cal":440,"pro":22.0,"carb":26.0,"fat":28.0},"type":"main"},{"style":"중식","name":"유린기","ingredients":["닭고기","양상추","대파","간장","식초","설탕"],"cookTime":30,"tags":[],"nameEn":"Yuringi (Chinese-style Fried Chicken)","nutrition":{"cal":410,"pro":20.0,"carb":28.0,"fat":24.0},"type":"main"},{"style":"중식","name":"깐쇼새우","ingredients":["새우","전분","케첩","두반장","마늘"],"cookTime":30,"tags":[],"nameEn":"Gan Shao Shrimp","nutrition":{"cal":340,"pro":16.0,"carb":28.0,"fat":18.0},"type":"main"},{"style":"중식","name":"칠리새우","ingredients":["새우","전분","케첩","마늘","고추"],"cookTime":30,"tags":[],"nameEn":"Chili Shrimp","nutrition":{"cal":320,"pro":16.0,"carb":26.0,"fat":16.0},"type":"main"},{"style":"중식","name":"고추잡채","ingredients":["돼지고기","피망","양파","죽순","굴소스"],"cookTime":25,"tags":[],"nameEn":"Pepper Japchae","nutrition":{"cal":230,"pro":15.0,"carb":12.0,"fat":14.0},"type":"main"},{"style":"중식","name":"꽃빵고추잡채","ingredients":["돼지고기","피망","양파","꽃빵","굴소스"],"cookTime":30,"tags":[],"nameEn":"Flower Bun with Pepper Japchae","nutrition":{"cal":360,"pro":18.0,"carb":45.0,"fat":12.0},"type":"main"},{"style":"중식","name":"양장피","ingredients":["양장피","새우","오징어","오이","당근","겨자"],"cookTime":35,"tags":[],"nameEn":"Yangjangpi (Jellyfish and Vegetable Salad)","nutrition":{"cal":290,"pro":16.0,"carb":24.0,"fat":15.0},"type":"main"},{"style":"중식","name":"팔보채","ingredients":["새우","오징어","해삼","청경채","버섯","굴소스"],"cookTime":30,"tags":[],"nameEn":"Palbochae (Eight Treasure Stir-fry)","nutrition":{"cal":240,"pro":22.0,"carb":14.0,"fat":12.0},"type":"main"},{"style":"중식","name":"마라탕","ingredients":["소고기","청경채","숙주","버섯","두부","마라소스"],"cookTime":30,"tags":[],"nameEn":"Mala Tang (Spicy Hot Pot)","nutrition":{"cal":420,"pro":22.0,"carb":25.0,"fat":26.0},"type":"main"},{"style":"중식","name":"마라샹궈","ingredients":["소고기","새우","청경채","숙주","버섯","마라소스"],"cookTime":35,"tags":[],"nameEn":"Mala Xiangguo (Mala Dry Pot)","nutrition":{"cal":480,"pro":24.0,"carb":18.0,"fat":36.0},"type":"main"},{"style":"중식","name":"동파육","ingredients":["돼지고기","대파","생강","간장","설탕"],"cookTime":60,"tags":[],"nameEn":"Dongpo Pork (Braised Pork Belly)","nutrition":{"cal":510,"pro":22.0,"carb":8.0,"fat":44.0},"type":"main"},{"style":"중식","name":"훠궈","ingredients":["소고기","배추","청경채","버섯","두부","마라소스"],"cookTime":35,"tags":[],"nameEn":"Huoguo (Hot Pot)","nutrition":{"cal":520,"pro":32.0,"carb":18.0,"fat":36.0},"type":"main"},{"style":"중식","name":"군만두","ingredients":["만두피","돼지고기","부추","배추","간장"],"cookTime":30,"tags":[],"nameEn":"Pan-fried Dumplings","nutrition":{"cal":250,"pro":9.0,"carb":25.0,"fat":13.0},"type":"main"},{"style":"중식","name":"물만두","ingredients":["만두피","돼지고기","부추","배추"],"cookTime":25,"tags":[],"nameEn":"Boiled Dumplings","nutrition":{"cal":210,"pro":9.0,"carb":22.0,"fat":9.0},"type":"main"},{"style":"중식","name":"완탕면","ingredients":["중면","만두피","돼지고기","새우","청경채"],"cookTime":30,"tags":[],"nameEn":"Wonton Noodles","nutrition":{"cal":420,"pro":18.0,"carb":62.0,"fat":11.0},"type":"main"},{"style":"중식","name":"탄탄면","ingredients":["중면","돼지고기","땅콩","두반장","청경채"],"cookTime":25,"tags":[],"nameEn":"Dan Dan Noodles","nutrition":{"cal":620,"pro":21.0,"carb":78.0,"fat":25.0},"type":"main"},{"style":"중식","name":"꿔바로우","ingredients":["돼지고기","전분","식초","설탕","간장"],"cookTime":35,"tags":[],"nameEn":"Guo Bao Rou (Sweet and Sour Pork)","nutrition":{"cal":480,"pro":16.0,"carb":42.0,"fat":28.0},"type":"main"},{"style":"중식","name":"토마토계란볶음","ingredients":["토마토","계란","대파","소금"],"cookTime":15,"tags":[],"nameEn":"Tomato and Egg Stir-fry","nutrition":{"cal":210,"pro":9.0,"carb":8.0,"fat":16.0},"type":"side"},{"style":"중식","name":"청경채굴소스볶음","ingredients":["청경채","마늘","굴소스","식용유"],"cookTime":10,"tags":[],"nameEn":"Bok Choy with Oyster Sauce","nutrition":{"cal":75,"pro":2.0,"carb":6.0,"fat":5.0},"type":"side"},{"style":"중식","name":"가지볶음","ingredients":["가지","돼지고기","두반장","마늘","간장"],"cookTime":20,"tags":[],"nameEn":"Stir-fried Eggplant","nutrition":{"cal":58,"pro":2.0,"carb":10.0,"fat":2.0},"type":"side"},{"style":"중식","name":"해물누룽지탕","ingredients":["누룽지","새우","오징어","청경채","버섯"],"cookTime":30,"tags":[],"nameEn":"Seafood Scorched Rice Soup","nutrition":{"cal":310,"pro":19.0,"carb":38.0,"fat":9.0},"type":"main"},{"style":"중식","name":"어향가지","ingredients":["가지","돼지고기","두반장","식초","설탕"],"cookTime":25,"tags":[],"nameEn":"Yuxiang Eggplant","nutrition":{"cal":180,"pro":3.0,"carb":14.0,"fat":13.0},"type":"main"},{"style":"🇹🇭 태국","name":"팟타이","ingredients":["쌀국수","새우","계란","숙주","부추","피시소스","땅콩"],"cookTime":25,"tags":[],"nameEn":"Pad Thai","nutrition":{"cal":560,"pro":21.0,"carb":72.0,"fat":21.0},"type":"main"},{"style":"🇹🇭 태국","name":"팟씨유","ingredients":["쌀국수","소고기","계란","청경채","간장"],"cookTime":25,"tags":[],"nameEn":"Pad See Ew","nutrition":{"cal":520,"pro":19.0,"carb":64.0,"fat":21.0},"type":"main"},{"style":"🇹🇭 태국","name":"카오팟","ingredients":["쌀","새우","계란","양파","피시소스"],"cookTime":20,"tags":["헬시"],"nameEn":"Khao Pad (Thai Fried Rice)","nutrition":{"cal":580,"pro":18.0,"carb":78.0,"fat":22.0},"type":"main"},{"style":"🇹🇭 태국","name":"카오만가이","ingredients":["쌀","닭고기","오이","생강","마늘"],"cookTime":40,"tags":[],"nameEn":"Khao Man Gai (Thai Chicken Rice)","nutrition":{"cal":590,"pro":28.0,"carb":72.0,"fat":21.0},"type":"main"},{"style":"🇹🇭 태국","name":"똠얌꿍","ingredients":["새우","버섯","토마토","레몬그라스","라임","피시소스"],"cookTime":25,"tags":[],"nameEn":"Tom Yum Kung","nutrition":{"cal":180,"pro":18.0,"carb":10.0,"fat":8.0},"type":"main"},{"style":"🇹🇭 태국","name":"그린커리","ingredients":["닭고기","코코넛밀크","가지","피망","그린커리페이스트"],"cookTime":30,"tags":[],"nameEn":"Green Curry","nutrition":{"cal":360,"pro":20.0,"carb":14.0,"fat":25.0},"type":"main"},{"style":"🇹🇭 태국","name":"레드커리","ingredients":["소고기","코코넛밀크","가지","피망","레드커리페이스트"],"cookTime":30,"tags":[],"nameEn":"Red Curry","nutrition":{"cal":380,"pro":18.0,"carb":15.0,"fat":26.0},"type":"main"},{"style":"🇹🇭 태국","name":"쏨땀","ingredients":["파파야","토마토","라임","피시소스","땅콩"],"cookTime":15,"tags":["헬시"],"nameEn":"Som Tam (Green Papaya Salad)","nutrition":{"cal":110,"pro":3.0,"carb":16.0,"fat":4.0},"type":"side"},{"style":"🇹🇭 태국","name":"카오소이","ingredients":["중면","닭고기","코코넛밀크","카레가루","양파"],"cookTime":35,"tags":[],"nameEn":"Khao Soi","nutrition":{"cal":540,"pro":22.0,"carb":58.0,"fat":25.0},"type":"main"},{"style":"🇻🇳 베트남","name":"쌀국수","ingredients":["쌀국수","소고기","숙주","양파","고수","피시소스"],"cookTime":30,"tags":["헬시"],"nameEn":"Pho (Vietnamese Rice Noodle Soup)","nutrition":{"cal":390,"pro":14.0,"carb":75.0,"fat":3.5},"type":"main"},{"style":"🇻🇳 베트남","name":"반미","ingredients":["바게트","돼지고기","당근","무","오이","고수"],"cookTime":20,"tags":["헬시"],"nameEn":"Banh Mi","nutrition":{"cal":430,"pro":16.0,"carb":54.0,"fat":16.0},"type":"main"},{"style":"🇻🇳 베트남","name":"분짜","ingredients":["쌀국수","돼지고기","상추","당근","피시소스"],"cookTime":30,"tags":[],"nameEn":"Bun Cha (Vietnamese Grilled Pork Noodles)","nutrition":{"cal":520,"pro":24.0,"carb":72.0,"fat":15.0},"type":"main"},{"style":"🇻🇳 베트남","name":"고이꾸온","ingredients":["라이스페이퍼","새우","돼지고기","쌀국수","상추","오이"],"cookTime":25,"tags":["헬시"],"nameEn":"Goi Cuon (Fresh Spring Rolls)","nutrition":{"cal":190,"pro":12.0,"carb":26.0,"fat":4.0},"type":"main"},{"style":"🇻🇳 베트남","name":"짜조","ingredients":["라이스페이퍼","돼지고기","당근","당면","목이버섯"],"cookTime":30,"tags":[],"nameEn":"Cha Gio (Vietnamese Fried Spring Rolls)","nutrition":{"cal":270,"pro":9.0,"carb":24.0,"fat":15.0},"type":"main"},{"style":"🇻🇳 베트남","name":"반쎄오","ingredients":["쌀가루","돼지고기","새우","숙주","코코넛밀크"],"cookTime":30,"tags":[],"nameEn":"Banh Xeo (Vietnamese Sizzling Crepe)","nutrition":{"cal":390,"pro":14.0,"carb":44.0,"fat":17.0},"type":"main"},{"style":"🇻🇳 베트남","name":"분보후에","ingredients":["쌀국수","소고기","레몬그라스","고춧가루","숙주"],"cookTime":40,"tags":[],"nameEn":"Bun Bo Hue (Spicy Beef Noodle Soup)","nutrition":{"cal":480,"pro":24.0,"carb":68.0,"fat":12.0},"type":"main"},{"style":"🇻🇳 베트남","name":"껌승","ingredients":["쌀","돼지고기","오이","당근","피시소스"],"cookTime":30,"tags":[],"nameEn":"Com Suon","nutrition":{"cal":620,"carb":82,"pro":31,"fat":18},"type":"main"},{"style":"🇮🇩 인도네시아","name":"나시고랭","ingredients":["쌀","계란","새우","양파","케찹마니스"],"cookTime":20,"tags":[],"nameEn":"Nasi Goreng","nutrition":{"cal":460,"pro":15.0,"carb":68.0,"fat":14.0},"type":"main"},{"style":"🇮🇩 인도네시아","name":"미고랭","ingredients":["중면","계란","닭고기","양배추","케찹마니스"],"cookTime":20,"tags":[],"nameEn":"Mi Goreng","nutrition":{"cal":480,"pro":11.0,"carb":72.0,"fat":16.0},"type":"main"},{"style":"🇮🇩 인도네시아","name":"비프 렌당","ingredients":["소고기","코코넛밀크","양파","마늘","생강"],"cookTime":60,"tags":[],"nameEn":"Beef Rendang","nutrition":{"cal":430,"pro":28.0,"carb":10.0,"fat":30.0},"type":"main"},{"style":"🇮🇩 인도네시아","name":"사테아얌","ingredients":["닭고기","땅콩","간장","마늘","설탕"],"cookTime":30,"tags":[],"nameEn":"Satay Ayam (Chicken Satay)","nutrition":{"cal":280,"pro":24.0,"carb":8.0,"fat":16.0},"type":"main"},{"style":"🇮🇩 인도네시아","name":"가도가도","ingredients":["양배추","감자","계란","두부","땅콩"],"cookTime":25,"tags":[],"nameEn":"Gado-Gado","nutrition":{"cal":315,"pro":12.0,"carb":28.0,"fat":16.0},"type":"main"},{"style":"🇲🇾 말레이시아","name":"락사","ingredients":["쌀국수","새우","코코넛밀크","숙주","라임"],"cookTime":35,"tags":[],"nameEn":"Laksa","nutrition":{"cal":520,"pro":22.0,"carb":68.0,"fat":18.0},"type":"main"},{"style":"🇲🇾 말레이시아","name":"나시르막","ingredients":["쌀","코코넛밀크","계란","멸치","오이"],"cookTime":35,"tags":[],"nameEn":"Nasi Lemak","nutrition":{"cal":580,"pro":16.0,"carb":75.0,"fat":24.0},"type":"main"},{"style":"🇲🇾 말레이시아","name":"차퀘이테오","ingredients":["쌀국수","새우","계란","숙주","부추"],"cookTime":25,"tags":[],"nameEn":"Char Kway Teow","nutrition":{"cal":580,"pro":18.0,"carb":72.0,"fat":24.0},"type":"main"},{"style":"🇲🇾 말레이시아","name":"치킨커리말레이","ingredients":["닭고기","감자","코코넛밀크","카레가루","양파"],"cookTime":35,"tags":[],"nameEn":"Malaysian Chicken Curry","nutrition":{"cal":390,"pro":28.0,"carb":15.0,"fat":24.0},"type":"main"},{"style":"🇸🇬 싱가포르","name":"하이난 치킨라이스","ingredients":["쌀","닭고기","오이","생강","마늘"],"cookTime":45,"tags":[],"nameEn":"Hainanese Chicken Rice","nutrition":{"cal":610,"pro":32.0,"carb":74.0,"fat":19.0},"type":"main"},{"style":"🇸🇬 싱가포르","name":"칠리크랩","ingredients":["꽃게","토마토소스","계란","마늘","고추"],"cookTime":40,"tags":[],"nameEn":"Chilli Crab","nutrition":{"cal":420,"pro":32.0,"carb":28.0,"fat":20.0},"type":"main"},{"style":"🇸🇬 싱가포르","name":"바쿠테","ingredients":["돼지갈비","마늘","후추","간장"],"cookTime":60,"tags":[],"nameEn":"Bak Kut Teh (Pork Rib Soup)","nutrition":{"cal":390,"pro":34.0,"carb":6.0,"fat":26.0},"type":"main"},{"style":"🇸🇬 싱가포르","name":"싱가포르락사","ingredients":["쌀국수","새우","코코넛밀크","숙주","어묵"],"cookTime":35,"tags":[],"nameEn":"Singapore Laksa","nutrition":{"cal":540,"pro":22.0,"carb":68.0,"fat":20.0},"type":"main"},{"style":"🇵🇭 필리핀","name":"치킨아도보","ingredients":["닭고기","간장","식초","마늘","월계수잎"],"cookTime":35,"tags":[],"nameEn":"Chicken Adobo","nutrition":{"cal":360,"pro":32.0,"carb":6.0,"fat":24.0},"type":"main"},{"style":"🇵🇭 필리핀","name":"포크아도보","ingredients":["돼지고기","간장","식초","마늘","월계수잎"],"cookTime":40,"tags":[],"nameEn":"Pork Adobo","nutrition":{"cal":390,"pro":31.0,"carb":7.0,"fat":26.0},"type":"main"},{"style":"🇵🇭 필리핀","name":"시니강","ingredients":["돼지고기","토마토","무","청경채","타마린드"],"cookTime":40,"tags":[],"nameEn":"Sinigang (Filipino Sour Soup)","nutrition":{"cal":210,"pro":20.0,"carb":12.0,"fat":8.0},"type":"main"},{"style":"🇵🇭 필리핀","name":"판싯","ingredients":["쌀국수","닭고기","양배추","당근","간장"],"cookTime":25,"tags":[],"nameEn":"Pancit (Filipino Noodles)","nutrition":{"cal":420,"pro":16.0,"carb":58.0,"fat":14.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"알리오올리오","ingredients":["스파게티","마늘","올리브오일","고추","파슬리"],"cookTime":20,"tags":[],"nameEn":"Aglio e Olio","nutrition":{"cal":460,"pro":9.0,"carb":62.0,"fat":20.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"봉골레파스타","ingredients":["스파게티","바지락","마늘","올리브오일","파슬리"],"cookTime":25,"tags":[],"nameEn":"Vongole Pasta (Clam Pasta)","nutrition":{"cal":470,"pro":16.0,"carb":66.0,"fat":15.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"토마토파스타","ingredients":["스파게티","토마토소스","양파","마늘","파마산치즈"],"cookTime":25,"tags":[],"nameEn":"Tomato Pasta","nutrition":{"cal":420,"pro":12.0,"carb":68.0,"fat":11.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"카르보나라","ingredients":["스파게티","베이컨","계란","파마산치즈","후추"],"cookTime":25,"tags":[],"nameEn":"Carbonara","nutrition":{"cal":650,"pro":22.0,"carb":64.0,"fat":34.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"볼로네제파스타","ingredients":["스파게티","소고기","토마토소스","양파","당근"],"cookTime":35,"tags":[],"nameEn":"Bolognese Pasta","nutrition":{"cal":540,"pro":22.0,"carb":70.0,"fat":19.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"라자냐","ingredients":["라자냐면","소고기","토마토소스","치즈","양파"],"cookTime":50,"tags":[],"nameEn":"Lasagna","nutrition":{"cal":480,"pro":26.0,"carb":36.0,"fat":25.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"마르게리타피자","ingredients":["밀가루","토마토소스","모짜렐라","바질","올리브오일"],"cookTime":45,"tags":[],"nameEn":"Margherita Pizza","nutrition":{"cal":430,"pro":16.0,"carb":48.0,"fat":19.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"리조또","ingredients":["쌀","버섯","양파","버터","파마산치즈"],"cookTime":30,"tags":[],"nameEn":"Risotto","nutrition":{"cal":410,"pro":11.0,"carb":62.0,"fat":13.0},"type":"main"},{"style":"🇺🇸 미국","name":"치킨스테이크","ingredients":["닭다리살","마늘","버터","브로콜리","소금"],"cookTime":25,"tags":[],"nameEn":"Chicken Steak","nutrition":{"cal":320,"pro":34.0,"carb":2.0,"fat":20.0},"type":"main"},{"style":"🇺🇸 미국","name":"안심스테이크","ingredients":["소안심","마늘","버터","아스파라거스","소금","후추"],"cookTime":25,"tags":[],"nameEn":"Tenderloin Steak","nutrition":{"cal":290,"carb":0,"pro":32,"fat":17},"type":"main"},{"style":"🇺🇸 미국","name":"립아이스테이크","ingredients":["립아이","마늘","버터","로즈마리","감자","소금","후추"],"cookTime":25,"tags":[],"nameEn":"Ribeye Steak","nutrition":{"cal":540,"carb":0,"pro":44,"fat":40},"type":"main"},{"style":"🇺🇸 미국","name":"채끝스테이크","ingredients":["채끝살","마늘","버터","아스파라거스","소금","후추"],"cookTime":25,"tags":[],"nameEn":"Sirloin Steak","nutrition":{"cal":340,"carb":0,"pro":33,"fat":22},"type":"main"},{"style":"🇺🇸 미국","name":"티본스테이크","ingredients":["티본","마늘","버터","로즈마리","감자","소금","후추"],"cookTime":30,"tags":[],"nameEn":"T-bone Steak","nutrition":{"cal":640,"carb":0,"pro":58,"fat":46},"type":"main"},{"style":"🇺🇸 미국","name":"포터하우스스테이크","ingredients":["포터하우스","마늘","버터","로즈마리","감자","소금","후추"],"cookTime":30,"tags":[],"nameEn":"Porterhouse Steak","nutrition":{"cal":740,"carb":0,"pro":66,"fat":52},"type":"main"},{"style":"🇺🇸 미국","name":"토마호크스테이크","ingredients":["토마호크","마늘","버터","로즈마리","감자","소금","후추"],"cookTime":35,"tags":[],"nameEn":"Tomahawk Steak","nutrition":{"cal":780,"carb":0,"pro":68,"fat":56},"type":"main"},{"style":"🇺🇸 미국","name":"살치살스테이크","ingredients":["살치살","마늘","버터","아스파라거스","소금","후추"],"cookTime":25,"tags":[],"nameEn":"Skirt Steak","nutrition":{"cal":390,"carb":0,"pro":29,"fat":30},"type":"main"},{"style":"🇺🇸 미국","name":"부채살스테이크","ingredients":["부채살","마늘","버터","브로콜리","소금","후추"],"cookTime":25,"tags":[],"nameEn":"Flat Iron Steak","nutrition":{"cal":280,"carb":0,"pro":31,"fat":16},"type":"main"},{"style":"🇺🇸 미국","name":"함박스테이크","ingredients":["소고기다짐육","돼지다짐육","양파","계란","빵가루"],"cookTime":35,"tags":[],"nameEn":"Hambak Steak (Japanese-style Hamburger Steak)","nutrition":{"cal":410,"pro":24.0,"carb":14.0,"fat":28.0},"type":"main"},{"style":"🇺🇸 미국","name":"비프스튜","ingredients":["소고기","감자","당근","양파","토마토소스"],"cookTime":60,"tags":[],"nameEn":"Beef Stew","nutrition":{"cal":310,"pro":24.0,"carb":14.0,"fat":17.0},"type":"main"},{"style":"🇺🇸 미국","name":"클램차우더","ingredients":["바지락","감자","양파","우유","버터"],"cookTime":35,"tags":["헬시"],"nameEn":"Clam Chowder","nutrition":{"cal":240,"pro":9.0,"carb":22.0,"fat":13.0},"type":"main"},{"style":"🇺🇸 미국","name":"시저샐러드","ingredients":["로메인","닭고기","파마산치즈","마요네즈","레몬"],"cookTime":15,"tags":[],"nameEn":"Caesar Salad","nutrition":{"cal":210,"pro":6.0,"carb":8.0,"fat":17.0},"type":"main"},{"style":"🇺🇸 미국","name":"코울슬로","ingredients":["양배추","당근","마요네즈","식초","설탕"],"cookTime":10,"tags":[],"nameEn":"Coleslaw","nutrition":{"cal":120,"pro":1.0,"carb":14.0,"fat":7.0},"type":"side"},{"style":"🇫🇷 프랑스","name":"감자그라탕","ingredients":["감자","우유","치즈","버터","양파"],"cookTime":40,"tags":[],"nameEn":"Potato Gratin","nutrition":{"cal":340,"pro":10.0,"carb":32.0,"fat":19.0},"type":"main"},{"style":"🇫🇷 프랑스","name":"프렌치토스트","ingredients":["식빵","계란","우유","버터","설탕"],"cookTime":15,"tags":["브런치"],"nameEn":"French Toast","nutrition":{"cal":340,"pro":10.0,"carb":42.0,"fat":14.0},"type":"main"},{"style":"🇬🇧 영국","name":"클럽샌드위치","ingredients":["식빵","닭고기","베이컨","상추","토마토","마요네즈"],"cookTime":20,"tags":[],"nameEn":"Club Sandwich","nutrition":{"cal":480,"pro":24.0,"carb":38.0,"fat":26.0},"type":"main"},{"style":"🇺🇸 미국","name":"오믈렛","ingredients":["계란","양파","피망","치즈","버터"],"cookTime":15,"tags":["브런치"],"nameEn":"Omelette","nutrition":{"cal":190,"pro":12.0,"carb":2.0,"fat":15.0},"type":"main"},{"style":"🇫🇷 프랑스","name":"토마토수프","ingredients":["토마토","양파","마늘","생크림","버터"],"cookTime":25,"tags":[],"nameEn":"Tomato Soup","nutrition":{"cal":120,"pro":3.0,"carb":16.0,"fat":5.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"비프타코","ingredients":["또띠아","소고기","양파","토마토","양상추","치즈"],"cookTime":25,"tags":[],"nameEn":"Beef Taco","nutrition":{"cal":380,"pro":20.0,"carb":32.0,"fat":19.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"치킨타코","ingredients":["또띠아","닭고기","양파","토마토","양상추","치즈"],"cookTime":25,"tags":[],"nameEn":"Chicken Taco","nutrition":{"cal":340,"pro":18.0,"carb":28.0,"fat":16.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"치킨부리토","ingredients":["또띠아","닭고기","쌀","강낭콩","치즈"],"cookTime":30,"tags":[],"nameEn":"Chicken Burrito","nutrition":{"cal":620,"pro":32.0,"carb":68.0,"fat":24.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"퀘사디야","ingredients":["또띠아","치즈","닭고기","양파","피망"],"cookTime":20,"tags":[],"nameEn":"Quesadilla","nutrition":{"cal":540,"pro":24.0,"carb":42.0,"fat":31.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"나초","ingredients":["나초칩","치즈","토마토","아보카도","할라피뇨"],"cookTime":15,"tags":[],"nameEn":"Nachos","nutrition":{"cal":250,"pro":4.0,"carb":32.0,"fat":12.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"과카몰레","ingredients":["아보카도","라임","양파","토마토","고수"],"cookTime":10,"tags":[],"nameEn":"Guacamole","nutrition":{"cal":160,"carb":9,"pro":2,"fat":15},"type":"side"},{"style":"🇮🇳 인도","name":"치킨티카마살라","ingredients":["닭고기","요거트","토마토소스","생크림","카레가루"],"cookTime":40,"tags":[],"nameEn":"Chicken Tikka Masala","nutrition":{"cal":420,"pro":28.0,"carb":14.0,"fat":28.0},"type":"main"},{"style":"🇮🇳 인도","name":"버터치킨","ingredients":["닭고기","버터","토마토소스","생크림","카레가루"],"cookTime":40,"tags":[],"nameEn":"Butter Chicken","nutrition":{"cal":390,"pro":24.0,"carb":12.0,"fat":27.0},"type":"main"},{"style":"🇮🇳 인도","name":"팔락파니르","ingredients":["시금치","파니르","양파","마늘","생강"],"cookTime":30,"tags":[],"nameEn":"Palak Paneer","nutrition":{"cal":260,"pro":12.0,"carb":11.0,"fat":20.0},"type":"main"},{"style":"🇮🇳 인도","name":"달커리","ingredients":["렌틸콩","양파","토마토","마늘","카레가루"],"cookTime":35,"tags":[],"nameEn":"Dal Curry","nutrition":{"cal":190,"pro":9.0,"carb":24.0,"fat":6.0},"type":"main"},{"style":"🇮🇳 인도","name":"비리야니","ingredients":["쌀","닭고기","양파","요거트","카레가루"],"cookTime":45,"tags":[],"nameEn":"Biryani","nutrition":{"cal":510,"pro":22.0,"carb":72.0,"fat":15.0},"type":"main"},{"style":"🇹🇷 터키","name":"치킨케밥","ingredients":["닭고기","또띠아","양파","토마토","요거트"],"cookTime":30,"tags":[],"nameEn":"Chicken Kebab","nutrition":{"cal":420,"pro":26.0,"carb":32.0,"fat":21.0},"type":"main"},{"style":"🇹🇷 터키","name":"메네멘","ingredients":["계란","토마토","피망","양파","올리브오일"],"cookTime":20,"tags":["브런치"],"nameEn":"Menemen (Turkish Egg and Tomato)","nutrition":{"cal":210,"pro":12.0,"carb":8.0,"fat":14.0},"type":"main"},{"style":"🇹🇷 터키","name":"렌틸수프","ingredients":["렌틸콩","양파","당근","토마토","올리브오일"],"cookTime":35,"tags":["헬시"],"nameEn":"Lentil Soup","nutrition":{"cal":160,"pro":9.0,"carb":24.0,"fat":3.0},"type":"main"},{"style":"🇬🇷 그리스","name":"그릭샐러드","ingredients":["토마토","오이","양파","올리브","페타치즈"],"cookTime":10,"tags":["헬시"],"nameEn":"Greek Salad","nutrition":{"cal":160,"pro":5.0,"carb":9.0,"fat":13.0},"type":"side"},{"style":"🇬🇷 그리스","name":"무사카","ingredients":["가지","소고기","토마토소스","감자","치즈"],"cookTime":50,"tags":[],"nameEn":"Moussaka","nutrition":{"cal":380,"pro":20.0,"carb":22.0,"fat":24.0},"type":"main"},{"style":"🇬🇷 그리스","name":"수블라키","ingredients":["돼지고기","또띠아","토마토","양파","요거트"],"cookTime":30,"tags":[],"nameEn":"Souvlaki","nutrition":{"cal":260,"pro":26.0,"carb":4.0,"fat":15.0},"type":"main"},{"style":"한식","name":"닭가슴살샐러드","ingredients":["닭가슴살","상추","방울토마토","오이","올리브오일"],"cookTime":20,"tags":["헬시"],"nameEn":"Chicken Breast Salad","nutrition":{"cal":185,"pro":24.0,"carb":8.0,"fat":6.0},"type":"main"},{"style":"🇺🇸 미국","name":"연어포케","ingredients":["쌀","연어","아보카도","오이","김"],"cookTime":20,"tags":["헬시"],"nameEn":"Salmon Poke Bowl","nutrition":{"cal":430,"pro":24.0,"carb":52.0,"fat":14.0},"type":"main"},{"style":"🇺🇸 미국","name":"두부포케","ingredients":["쌀","두부","아보카도","오이","김"],"cookTime":20,"tags":["헬시"],"nameEn":"Tofu Poke Bowl","nutrition":{"cal":390,"pro":15.0,"carb":54.0,"fat":12.0},"type":"main"},{"style":"🇬🇷 그리스","name":"그릭요거트볼","ingredients":["요거트","바나나","블루베리","아몬드","꿀"],"cookTime":5,"tags":["헬시"],"nameEn":"Greek Yogurt Bowl","nutrition":{"cal":210,"pro":12.0,"carb":18.0,"fat":10.0},"type":"main"},{"style":"🇬🇧 영국","name":"오트밀","ingredients":["오트밀","우유","바나나","아몬드","꿀"],"cookTime":10,"tags":["헬시"],"nameEn":"Oatmeal","nutrition":{"cal":150,"pro":5.0,"carb":27.0,"fat":3.0},"type":"main"},{"style":"한식","name":"현미채소덮밥","ingredients":["현미","두부","브로콜리","당근","간장"],"cookTime":25,"tags":["헬시"],"nameEn":"Brown Rice Vegetable Bowl","nutrition":{"cal":410,"pro":9.0,"carb":78.0,"fat":6.0},"type":"main"},{"style":"🇺🇸 미국","name":"두부스테이크","ingredients":["두부","양파","버섯","간장","전분"],"cookTime":25,"tags":["헬시"],"nameEn":"Tofu Steak","nutrition":{"cal":180,"pro":12.0,"carb":10.0,"fat":10.0},"type":"main"},{"style":"🇮🇳 인도","name":"렌틸콩샐러드","ingredients":["렌틸콩","토마토","오이","양파","올리브오일"],"cookTime":20,"tags":["헬시"],"nameEn":"Lentil Salad","nutrition":{"cal":180,"pro":8.0,"carb":22.0,"fat":6.0},"type":"main"},{"style":"🇺🇸 미국","name":"계란아보카도토스트","ingredients":["식빵","계란","아보카도","토마토"],"cookTime":15,"tags":["헬시","브런치"],"nameEn":"Egg Avocado Toast","nutrition":{"cal":360,"pro":12.0,"carb":28.0,"fat":22.0},"type":"main"},{"style":"한식","name":"닭가슴살카레","ingredients":["닭가슴살","카레가루","감자","당근","양파"],"cookTime":30,"tags":["헬시"],"nameEn":"Chicken Breast Curry","nutrition":{"cal":340,"pro":25.0,"carb":42.0,"fat":8.0},"type":"main"},{"style":"한식","name":"등갈비찜","ingredients":["돼지등뼈","감자","당근","양파","대파","간장","고추장","설탕","생강"],"cookTime":60,"tags":[],"nameEn":"Braised Pork Back Ribs","nutrition":{"cal":410,"pro":30.0,"carb":12.0,"fat":26.0},"type":"main"},{"style":"한식","name":"황태국","ingredients":["황태","계란","두부","대파","된장","참기름","마늘"],"cookTime":20,"tags":[],"nameEn":"Dried Pollack Soup","nutrition":{"cal":80,"pro":12.0,"carb":2.0,"fat":3.0},"type":"main"},{"style":"한식","name":"콩나물해장국","ingredients":["콩나물","대파","고춧가루","국간장","마늘"],"cookTime":20,"tags":[],"nameEn":"Bean Sprout Hangover Soup","nutrition":{"cal":310,"pro":12.0,"carb":58.0,"fat":3.0},"type":"main"},{"style":"한식","name":"닭개장","ingredients":["닭고기","고사리","대파","고춧가루","국간장","참기름","마늘"],"cookTime":40,"tags":[],"nameEn":"Spicy Chicken Soup","nutrition":{"cal":260,"pro":28.0,"carb":10.0,"fat":12.0},"type":"main"},{"style":"한식","name":"설렁탕","ingredients":["소고기","대파","소금","마늘"],"cookTime":90,"tags":[],"nameEn":"Seolleongtang (Ox Bone Soup)","nutrition":{"cal":240,"pro":28.0,"carb":4.0,"fat":12.0},"type":"main"},{"style":"한식","name":"돌솥비빔밥","ingredients":["쌀","계란","시금치","당근","고사리","콩나물","고추장","참기름","참기름"],"cookTime":30,"tags":[],"nameEn":"Stone Pot Bibimbap","nutrition":{"cal":560,"pro":18.0,"carb":85.0,"fat":16.0},"type":"main"},{"style":"한식","name":"쌈밥","ingredients":["쌀","상추","깻잎","쌈장","마늘","삼겹살"],"cookTime":20,"tags":[],"nameEn":"Ssambap (Wrap Rice)","nutrition":{"cal":360,"pro":11.0,"carb":62.0,"fat":7.0},"type":"main"},{"style":"한식","name":"유부초밥","ingredients":["쌀","유부","식초","설탕","깨"],"cookTime":30,"tags":[],"nameEn":"Inari Sushi","nutrition":{"cal":320,"pro":9.0,"carb":54.0,"fat":7.0},"type":"main"},{"style":"한식","name":"닭곰탕","ingredients":["닭고기","당면","대파","마늘","소금","후추"],"cookTime":60,"tags":[],"nameEn":"Chicken Broth Soup","nutrition":{"cal":190,"pro":28.0,"carb":4.0,"fat":7.0},"type":"main"},{"style":"한식","name":"소고기미역국","ingredients":["소고기","미역","국간장","참기름","마늘"],"cookTime":30,"tags":[],"nameEn":"Beef Seaweed Soup","nutrition":{"cal":130,"pro":14.0,"carb":3.0,"fat":7.0},"type":"main"},{"style":"한식","name":"두루치기","ingredients":["돼지고기","김치","양파","대파","고추장","고춧가루","마늘"],"cookTime":25,"tags":[],"nameEn":"Duruchigi (Stir-fried Pork)","nutrition":{"cal":350,"pro":24.0,"carb":11.0,"fat":23.0},"type":"main"},{"style":"한식","name":"고추장불고기","ingredients":["소고기","양파","대파","고추장","간장","설탕","참기름"],"cookTime":20,"tags":[],"nameEn":"Gochujang Bulgogi","nutrition":{"cal":360,"pro":26.0,"carb":14.0,"fat":22.0},"type":"main"},{"style":"한식","name":"묵은지삼겹살","ingredients":["삼겹살","묵은지","대파","마늘","참기름"],"cookTime":25,"tags":[],"nameEn":"Aged Kimchi Pork Belly","nutrition":{"cal":540,"pro":22.0,"carb":6.0,"fat":48.0},"type":"main"},{"style":"한식","name":"우거지갈비찜","ingredients":["소갈비","우거지","된장","고춧가루","마늘","대파"],"cookTime":70,"tags":[],"nameEn":"Braised Ribs with Dried Cabbage","nutrition":{"cal":340,"pro":24.0,"carb":12.0,"fat":22.0},"type":"main"},{"style":"한식","name":"약밥","ingredients":["찹쌀","대추","밤","간장","꿀","설탕","참기름"],"cookTime":60,"tags":[],"nameEn":"Yakbap (Sweet Rice)","nutrition":{"cal":310,"pro":4.0,"carb":68.0,"fat":2.5},"type":"main"},{"style":"한식","name":"북어무침","ingredients":["북어","고춧가루","간장","마늘","참기름","깨","설탕"],"cookTime":15,"tags":[],"nameEn":"Seasoned Dried Pollack","nutrition":{"cal":85,"pro":11.0,"carb":8.0,"fat":1.0},"type":"side"},{"style":"한식","name":"들깨순두부찌개","ingredients":["순두부","새우","대파","들기름","국간장","고춧가루"],"cookTime":20,"tags":[],"nameEn":"Perilla Seed Soft Tofu Stew","nutrition":{"cal":180,"pro":12.0,"carb":8.0,"fat":11.0},"type":"main"},{"style":"한식","name":"오리주물럭","ingredients":["오리고기","양파","대파","깻잎","고추장","고춧가루","마늘"],"cookTime":30,"tags":[],"nameEn":"Spicy Duck Stir-fry","nutrition":{"cal":380,"pro":24.0,"carb":10.0,"fat":27.0},"type":"main"},{"style":"일식","name":"교자","ingredients":["돼지고기","양배추","부추","마늘","생강","간장","참기름"],"cookTime":30,"tags":[],"nameEn":"Gyoza","nutrition":{"cal":220,"pro":9.0,"carb":24.0,"fat":10.0},"type":"main"},{"style":"일식","name":"사케동","ingredients":["쌀","연어","아보카도","간장","마요네즈","와사비","깨"],"cookTime":20,"tags":[],"nameEn":"Sake Don (Salmon Rice Bowl)","nutrition":{"cal":520,"pro":28.0,"carb":68.0,"fat":12.0},"type":"main"},{"style":"일식","name":"아게다시두부","ingredients":["두부","전분","간장","미림","다시","대파","생강"],"cookTime":20,"tags":[],"nameEn":"Agedashi Tofu","nutrition":{"cal":180,"pro":9.0,"carb":12.0,"fat":10.0},"type":"side"},{"style":"일식","name":"오덴","ingredients":["어묵","무","계란","두부","곤약","간장","미림","다시"],"cookTime":60,"tags":[],"nameEn":"Oden","nutrition":{"cal":210,"carb":14,"pro":13,"fat":9},"type":"main"},{"style":"일식","name":"유도후","ingredients":["두부","다시","간장","미림","대파","가쓰오부시","생강"],"cookTime":20,"tags":[],"nameEn":"Yudofu (Simmered Tofu)","nutrition":{"cal":110,"pro":11.0,"carb":4.0,"fat":6.0},"type":"side"},{"style":"중식","name":"샤오롱바오","ingredients":["돼지고기","만두피","생강","간장","참기름","설탕"],"cookTime":40,"tags":[],"nameEn":"Xiaolongbao (Soup Dumplings)","nutrition":{"cal":290,"pro":13.0,"carb":32.0,"fat":12.0},"type":"main"},{"style":"중식","name":"회과육","ingredients":["돼지고기","양배추","파프리카","두반장","간장","설탕","대파","마늘"],"cookTime":25,"tags":[],"nameEn":"Twice-cooked Pork","nutrition":{"cal":480,"carb":11,"pro":22,"fat":39},"type":"main"},{"style":"중식","name":"우육면","ingredients":["소고기","중면","두반장","토마토","간장","생강","팔각"],"cookTime":90,"tags":[],"nameEn":"Beef Noodle Soup","nutrition":{"cal":540,"pro":28.0,"carb":75.0,"fat":14.0},"type":"main"},{"style":"중식","name":"오향장육","ingredients":["돼지고기","간장","설탕","팔각","계피","마늘","생강"],"cookTime":60,"tags":[],"nameEn":"Five-spice Braised Pork","nutrition":{"cal":280,"pro":26.0,"carb":4.0,"fat":18.0},"type":"main"},{"style":"중식","name":"라조기","ingredients":["닭고기","건고추","파프리카","마늘","간장","식초","설탕","대파"],"cookTime":25,"tags":[],"nameEn":"Laziji (Sichuan Spicy Chicken)","nutrition":{"cal":420,"pro":22.0,"carb":24.0,"fat":26.0},"type":"main"},{"style":"중식","name":"새우완탕면","ingredients":["새우","완탕피","중면","대파","생강","간장","참기름"],"cookTime":30,"tags":[],"nameEn":"Shrimp Wonton Noodles","nutrition":{"cal":410,"pro":20.0,"carb":68.0,"fat":8.0},"type":"main"},{"style":"중식","name":"베이징덕","ingredients":["닭고기","꽃빵","오이","대파","호이신소스","간장","꿀"],"cookTime":90,"tags":[],"nameEn":"Peking Duck","nutrition":{"cal":410,"pro":26.0,"carb":2.0,"fat":34.0},"type":"main"},{"style":"🇺🇸 미국","name":"에그베네딕트","ingredients":["계란","베이컨","식빵","버터","레몬","마요네즈","후추"],"cookTime":20,"tags":["브런치"],"nameEn":"Eggs Benedict","nutrition":{"cal":440,"pro":18.0,"carb":24.0,"fat":31.0},"type":"main"},{"style":"🇬🇧 영국","name":"피시앤칩스","ingredients":["대구","감자","밀가루","계란","빵가루","소금","후추","식용유"],"cookTime":35,"tags":[],"nameEn":"Fish and Chips","nutrition":{"cal":580,"pro":24.0,"carb":48.0,"fat":32.0},"type":"main"},{"style":"🇫🇷 프랑스","name":"키쉬로렌","ingredients":["계란","생크림","베이컨","치즈","양파","밀가루","버터","소금"],"cookTime":50,"tags":[],"nameEn":"Quiche Lorraine","nutrition":{"cal":420,"carb":24,"pro":12,"fat":31},"type":"main"},{"style":"🇮🇹 이탈리아","name":"크림파스타","ingredients":["스파게티","닭가슴살","생크림","버터","파마산치즈","마늘","양파","후추"],"cookTime":25,"tags":[],"nameEn":"Cream Pasta","nutrition":{"cal":620,"pro":18.0,"carb":68.0,"fat":32.0},"type":"main"},{"style":"🇹🇭 태국","name":"똠카가이","ingredients":["닭고기","코코넛밀크","레몬그라스","생강","라임","피시소스","고수","버섯"],"cookTime":25,"tags":[],"nameEn":"Tom Kha Gai","nutrition":{"cal":290,"pro":20.0,"carb":12.0,"fat":18.0},"type":"main"},{"style":"🇹🇭 태국","name":"얌운센","ingredients":["당면","새우","돼지고기","양파","라임","피시소스","고수","고춧가루","레몬"],"cookTime":20,"tags":[],"nameEn":"Yam Woon Sen (Glass Noodle Salad)","nutrition":{"cal":240,"pro":12.0,"carb":34.0,"fat":6.0},"type":"main"},{"style":"🇹🇭 태국","name":"팟팍붕파이댕","ingredients":["공심채","마늘","굴소스","두반장","피시소스","식용유","고춧가루"],"cookTime":15,"tags":[],"nameEn":"Pad Pak Bung Fai Daeng (Stir-fried Morning Glory)","nutrition":{"cal":90,"pro":3.0,"carb":6.0,"fat":6.0},"type":"main"},{"style":"🇹🇭 태국","name":"카오니아오","ingredients":["찹쌀","코코넛밀크","설탕","소금","깨"],"cookTime":30,"tags":[],"nameEn":"Khao Niao (Sticky Rice)","nutrition":{"cal":350,"pro":6.0,"carb":76.0,"fat":1.0},"type":"side"},{"style":"🇻🇳 베트남","name":"퍼가","ingredients":["닭고기","쌀국수","양파","생강","피시소스","고수","라임","레몬그라스"],"cookTime":60,"tags":[],"nameEn":"Pho Ga (Vietnamese Chicken Noodle Soup)","nutrition":{"cal":380,"pro":24.0,"carb":64.0,"fat":3.0},"type":"main"},{"style":"🇻🇳 베트남","name":"분팃느엉","ingredients":["돼지고기","쌀국수","상추","고수","당근","피시소스","설탕","라임","마늘"],"cookTime":30,"tags":[],"nameEn":"Bun Thit Nuong (Grilled Pork Noodle Bowl)","nutrition":{"cal":490,"pro":22.0,"carb":68.0,"fat":14.0},"type":"main"},{"style":"🇻🇳 베트남","name":"껌가","ingredients":["닭고기","쌀","생강","피시소스","마늘","설탕","참기름"],"cookTime":40,"tags":[],"nameEn":"Cơm gà","nutrition":{"cal":510,"pro":28.0,"carb":70.0,"fat":13.0},"type":"main"},{"style":"🇻🇳 베트남","name":"넴느엉꾸온","ingredients":["돼지고기","라이스페이퍼","상추","고수","당근","오이","땅콩","피시소스"],"cookTime":35,"tags":[],"nameEn":"Nem Nuong Cuon","nutrition":{"cal":240,"pro":16.0,"carb":28.0,"fat":7.0},"type":"main"},{"style":"🇻🇳 베트남","name":"카인까우아","ingredients":["새우","토마토","파인애플","숙주","고수","피시소스","설탕","라임"],"cookTime":25,"tags":[],"nameEn":"Canh Cai Chua","nutrition":{"cal":410,"carb":14,"pro":28,"fat":27},"type":"main"},{"style":"🇻🇳 베트남","name":"반꾸온","ingredients":["라이스페이퍼","돼지고기","목이버섯","당면","숙주","피시소스","마늘"],"cookTime":40,"tags":[],"nameEn":"Banh Cuon (Vietnamese Steamed Rice Rolls)","nutrition":{"cal":280,"pro":10.0,"carb":42.0,"fat":8.0},"type":"main"},{"style":"🇻🇳 베트남","name":"미꽝","ingredients":["쌀국수","새우","돼지고기","강황","땅콩","상추","고수","피시소스"],"cookTime":40,"tags":[],"nameEn":"Mi Quang (Vietnamese Turmeric Noodles)","nutrition":{"cal":420,"pro":18.0,"carb":65.0,"fat":10.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"엔칠라다","ingredients":["또띠아","닭고기","토마토소스","치즈","양파","고춧가루","마늘","사워크림"],"cookTime":35,"tags":[],"nameEn":"Enchilada","nutrition":{"cal":460,"pro":22.0,"carb":44.0,"fat":21.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"카르네아사다","ingredients":["소고기","라임","마늘","고춧가루","커민","간장","올리브오일"],"cookTime":25,"tags":[],"nameEn":"Carne Asada","nutrition":{"cal":340,"pro":32.0,"carb":2.0,"fat":23.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"피시타코","ingredients":["대구","또띠아","양배추","토마토","라임","마요네즈","고춧가루"],"cookTime":25,"tags":[],"nameEn":"Fish Taco","nutrition":{"cal":360,"pro":18.0,"carb":32.0,"fat":16.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"토르티야수프","ingredients":["또띠아","닭고기","토마토","양파","마늘","고춧가루","치즈","아보카도"],"cookTime":30,"tags":[],"nameEn":"Tortilla Soup","nutrition":{"cal":210,"pro":11.0,"carb":22.0,"fat":9.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"멕시칸라이스","ingredients":["쌀","토마토","양파","마늘","치킨스톡","고춧가루","커민"],"cookTime":30,"tags":[],"nameEn":"Mexican Rice","nutrition":{"cal":420,"pro":9.0,"carb":72.0,"fat":10.0},"type":"main"},{"style":"🇮🇳 인도","name":"차나마살라","ingredients":["병아리콩","토마토","양파","마늘","생강","가람마살라","커민","고수분말","강황"],"cookTime":35,"tags":[],"nameEn":"Chana Masala","nutrition":{"cal":240,"pro":9.0,"carb":32.0,"fat":8.0},"type":"main"},{"style":"🇮🇳 인도","name":"탄두리치킨","ingredients":["닭고기","요거트","마늘","생강","가람마살라","파프리카파우더","강황","레몬","소금"],"cookTime":40,"tags":[],"nameEn":"Tandoori Chicken","nutrition":{"cal":290,"pro":34.0,"carb":4.0,"fat":15.0},"type":"main"},{"style":"🇮🇳 인도","name":"치킨코르마","ingredients":["닭고기","양파","요거트","생크림","아몬드","마늘","생강","가람마살라","버터"],"cookTime":40,"tags":[],"nameEn":"Chicken Korma","nutrition":{"cal":430,"pro":26.0,"carb":16.0,"fat":29.0},"type":"main"},{"style":"🇮🇳 인도","name":"빈달루","ingredients":["돼지고기","식초","마늘","생강","고춧가루","커민","강황","계피","겨자"],"cookTime":50,"tags":[],"nameEn":"Vindaloo","nutrition":{"cal":360,"pro":22.0,"carb":14.0,"fat":24.0},"type":"main"},{"style":"🇮🇳 인도","name":"아루나달","ingredients":["감자","렌틸콩","양파","토마토","마늘","생강","커민","강황","고수분말"],"cookTime":35,"tags":[],"nameEn":"Aruna Dal","nutrition":{"cal":190,"pro":9.0,"carb":24.0,"fat":6.0},"type":"main"},{"style":"🇮🇳 인도","name":"도사","ingredients":["쌀가루","렌틸콩","감자","양파","강황","커민","마늘","소금","식용유"],"cookTime":40,"tags":[],"nameEn":"Dosa","nutrition":{"cal":290,"pro":6.0,"carb":48.0,"fat":8.0},"type":"main"},{"style":"🇮🇳 인도","name":"사모사","ingredients":["밀가루","감자","완두콩","양파","마늘","커민","강황","고수분말","식용유"],"cookTime":45,"tags":[],"nameEn":"Samosa","nutrition":{"cal":280,"pro":5.0,"carb":34.0,"fat":14.0},"type":"main"},{"style":"🇮🇩 인도네시아","name":"소토아얌","ingredients":["닭고기","쌀국수","강황","레몬그라스","마늘","생강","숙주","고수","라임"],"cookTime":45,"tags":[],"nameEn":"Soto Ayam (Indonesian Chicken Soup)","nutrition":{"cal":260,"pro":22.0,"carb":12.0,"fat":13.0},"type":"main"},{"style":"🇮🇩 인도네시아","name":"나시우둑","ingredients":["쌀","코코넛밀크","레몬그라스","마늘","소금","월계수잎","계란"],"cookTime":30,"tags":[],"nameEn":"Nasi Uduk","nutrition":{"cal":440,"pro":9.0,"carb":68.0,"fat":14.0},"type":"main"},{"style":"🇮🇩 인도네시아","name":"아얌바카르","ingredients":["닭고기","케찹마니스","마늘","생강","강황","고춧가루","라임"],"cookTime":40,"tags":[],"nameEn":"Ayam Bakar (Grilled Chicken)","nutrition":{"cal":310,"pro":26.0,"carb":6.0,"fat":20.0},"type":"main"},{"style":"🇮🇩 인도네시아","name":"오포르아얌","ingredients":["닭고기","코코넛밀크","레몬그라스","마늘","생강","강황","커민","소금"],"cookTime":40,"tags":[],"nameEn":"Opor Ayam (Chicken in Coconut Milk)","nutrition":{"cal":320,"pro":22.0,"carb":12.0,"fat":21.0},"type":"main"},{"style":"🇮🇩 인도네시아","name":"삼발텀페","ingredients":["두부","삼발소스","마늘","새우페이스트","팜슈가","라임","소금","식용유"],"cookTime":20,"tags":[],"nameEn":"Sambal Tempeh","nutrition":{"cal":290,"carb":16,"pro":15,"fat":19},"type":"main"},{"style":"🇲🇾 말레이시아","name":"아삼락사","ingredients":["쌀국수","고등어","타마린드","파인애플","양파","파프리카파우더","새우페이스트","라임"],"cookTime":50,"tags":[],"nameEn":"Asam Laksa","nutrition":{"cal":420,"carb":62,"pro":18,"fat":10},"type":"main"},{"style":"🇲🇾 말레이시아","name":"로티차나이","ingredients":["밀가루","버터","계란","소금","설탕","식용유","카레가루"],"cookTime":30,"tags":[],"nameEn":"Roti Canai","nutrition":{"cal":310,"pro":6.0,"carb":36.0,"fat":15.0},"type":"main"},{"style":"🇲🇾 말레이시아","name":"이칸바카르","ingredients":["고등어","삼발소스","마늘","생강","라임","새우페이스트","소금"],"cookTime":30,"tags":[],"nameEn":"Ikan Bakar (Grilled Fish)","nutrition":{"cal":210,"pro":26.0,"carb":4.0,"fat":10.0},"type":"main"},{"style":"🇲🇾 말레이시아","name":"미고랭말레이","ingredients":["중면","새우","계란","양배추","간장","케찹마니스","삼발소스","마늘"],"cookTime":20,"tags":[],"nameEn":"Mee Goreng Mamak","nutrition":{"cal":490,"pro":13.0,"carb":70.0,"fat":17.0},"type":"main"},{"style":"🇲🇾 말레이시아","name":"오탁오탁","ingredients":["고등어","코코넛밀크","새우페이스트","레몬그라스","강황","고춧가루","소금"],"cookTime":35,"tags":[],"nameEn":"Otak-otak","nutrition":{"cal":160,"carb":6,"pro":14,"fat":9},"type":"main"},{"style":"🇲🇾 말레이시아","name":"마삭메라","ingredients":["닭고기","토마토","양파","마늘","생강","삼발소스","토마토소스","소금"],"cookTime":35,"tags":[],"nameEn":"Masak Merah (Red Cooked Chicken)","nutrition":{"cal":390,"pro":26.0,"carb":14.0,"fat":25.0},"type":"main"},{"style":"🇸🇬 싱가포르","name":"호켄미","ingredients":["중면","새우","오징어","숙주","계란","간장","굴소스","마늘"],"cookTime":25,"tags":[],"nameEn":"Hokkien Mee","nutrition":{"cal":490,"carb":64,"pro":19,"fat":17},"type":"main"},{"style":"🇸🇬 싱가포르","name":"싱가포르사테","ingredients":["닭고기","땅콩","코코넛밀크","레몬그라스","강황","커민","간장","꿀"],"cookTime":35,"tags":[],"nameEn":"Singapore Satay","nutrition":{"cal":290,"pro":24.0,"carb":8.0,"fat":17.0},"type":"main"},{"style":"🇸🇬 싱가포르","name":"프론미","ingredients":["새우","중면","숙주","계란","마늘","삼발소스","간장","소금"],"cookTime":30,"tags":[],"nameEn":"Prawn Mee (Shrimp Noodle Soup)","nutrition":{"cal":420,"pro":24.0,"carb":64.0,"fat":8.0},"type":"main"},{"style":"🇸🇬 싱가포르","name":"카야토스트","ingredients":["식빵","코코넛밀크","계란","설탕","버터","소금","판단잎"],"cookTime":20,"tags":["브런치"],"nameEn":"Kaya Toast","nutrition":{"cal":360,"pro":7.0,"carb":48.0,"fat":16.0},"type":"main"},{"style":"🇸🇬 싱가포르","name":"캐롯케이크","ingredients":["무","쌀가루","계란","간장","굴소스","숙주","마늘","식용유"],"cookTime":30,"tags":[],"nameEn":"Carrot Cake","nutrition":{"cal":410,"pro":4.0,"carb":52.0,"fat":21.0},"type":"main"},{"style":"🇵🇭 필리핀","name":"레촌카왈리","ingredients":["삼겹살","마늘","식초","소금","후추","월계수잎","식용유"],"cookTime":60,"tags":[],"nameEn":"Lechon Kawali (Filipino Crispy Pork)","nutrition":{"cal":510,"pro":20.0,"carb":1.0,"fat":48.0},"type":"main"},{"style":"🇵🇭 필리핀","name":"칼데레타","ingredients":["소고기","감자","당근","토마토소스","양파","마늘","피망","치즈"],"cookTime":60,"tags":[],"nameEn":"Caldereta (Filipino Beef Stew)","nutrition":{"cal":420,"pro":28.0,"carb":14.0,"fat":28.0},"type":"main"},{"style":"🇵🇭 필리핀","name":"불라로","ingredients":["소고기","양배추","옥수수","감자","양파","소금","후추","생강"],"cookTime":90,"tags":[],"nameEn":"Bulalo (Filipino Bone Marrow Soup)","nutrition":{"cal":380,"pro":36.0,"carb":8.0,"fat":22.0},"type":"main"},{"style":"🇵🇭 필리핀","name":"암팔라야볶음","ingredients":["여주","계란","두부","마늘","양파","새우","피시소스","소금"],"cookTime":20,"tags":[],"nameEn":"Ampalaya Stir-fry (Bitter Melon)","nutrition":{"cal":140,"pro":8.0,"carb":8.0,"fat":9.0},"type":"main"},{"style":"🇹🇷 터키","name":"고등어케밥","ingredients":["고등어","식빵","양파","상추","레몬","올리브오일","소금","후추"],"cookTime":20,"tags":[],"nameEn":"Mackerel Kebab","nutrition":{"cal":380,"pro":24.0,"carb":32.0,"fat":17.0},"type":"main"},{"style":"🇹🇷 터키","name":"아다나케밥","ingredients":["양고기","양파","마늘","고춧가루","커민","파슬리","소금","후추"],"cookTime":30,"tags":[],"nameEn":"Adana Kebab","nutrition":{"cal":360,"pro":26.0,"carb":6.0,"fat":26.0},"type":"main"},{"style":"🇹🇷 터키","name":"이스켄데르케밥","ingredients":["양고기","식빵","토마토소스","버터","요거트","파프리카파우더","소금"],"cookTime":35,"tags":[],"nameEn":"İskender Kebab","nutrition":{"cal":580,"pro":31.0,"carb":43.0,"fat":32.0},"type":"main"},{"style":"🇹🇷 터키","name":"쾨프테","ingredients":["소고기","양파","마늘","빵가루","파슬리","커민","소금","후추","계란"],"cookTime":25,"tags":[],"nameEn":"Köfte","nutrition":{"cal":320,"pro":21.0,"carb":4.0,"fat":25.0},"type":"main"},{"style":"🇹🇷 터키","name":"이맘바이으르디","ingredients":["가지","토마토","양파","마늘","올리브오일","파슬리","설탕","소금"],"cookTime":40,"tags":[],"nameEn":"Imam Bayildi","nutrition":{"cal":180,"carb":16,"pro":3,"fat":12},"type":"main"},{"style":"🇹🇷 터키","name":"터키식필라프","ingredients":["쌀","버터","양파","닭고기","커민","소금","후추","다시"],"cookTime":30,"tags":[],"nameEn":"Turkish Pilaf","nutrition":{"cal":380,"pro":7.0,"carb":54.0,"fat":15.0},"type":"main"},{"style":"🇹🇷 터키","name":"만트","ingredients":["만두피","소고기","양파","마늘","요거트","버터","토마토소스","파프리카파우더"],"cookTime":50,"tags":[],"nameEn":"Manti (Central Asian Dumplings)","nutrition":{"cal":290,"pro":12.0,"carb":36.0,"fat":10.0},"type":"main"},{"style":"🇬🇷 그리스","name":"기로스","ingredients":["돼지고기","또띠아","양파","토마토","상추","요거트","마늘","레몬","올리브오일"],"cookTime":30,"tags":[],"nameEn":"Gyros","nutrition":{"cal":390,"pro":28.0,"carb":6.0,"fat":28.0},"type":"main"},{"style":"🇬🇷 그리스","name":"스파나코피타","ingredients":["밀가루","시금치","페타치즈","계란","버터","양파","마늘","소금"],"cookTime":50,"tags":[],"nameEn":"Spanakopita (Greek Spinach Pie)","nutrition":{"cal":340,"pro":8.0,"carb":28.0,"fat":21.0},"type":"main"},{"style":"🇬🇷 그리스","name":"돌마데스","ingredients":["포도잎","쌀","소고기","양파","레몬","올리브오일","파슬리","소금"],"cookTime":60,"tags":[],"nameEn":"Dolmades","nutrition":{"cal":180,"pro":6.0,"carb":18.0,"fat":9.0},"type":"main"},{"style":"🇬🇷 그리스","name":"파스티치오","ingredients":["스파게티","소고기","양파","토마토소스","우유","버터","파마산치즈","계란"],"cookTime":60,"tags":[],"nameEn":"Pastitsio (Greek Baked Pasta)","nutrition":{"cal":540,"pro":26.0,"carb":46.0,"fat":28.0},"type":"main"},{"style":"🇬🇷 그리스","name":"클레프티코","ingredients":["양고기","감자","토마토","양파","마늘","올리브오일","오레가노","레몬"],"cookTime":120,"tags":[],"nameEn":"Kleftiko (Greek Slow-roasted Lamb)","nutrition":{"cal":540,"pro":34.0,"carb":8.0,"fat":42.0},"type":"main"},{"style":"🇬🇷 그리스","name":"차지키","ingredients":["요거트","오이","마늘","올리브오일","레몬","소금","딜"],"cookTime":10,"tags":[],"nameEn":"Tzatziki","nutrition":{"cal":90,"pro":5.0,"carb":5.0,"fat":6.0},"type":"side"},{"style":"🇺🇸 미국","name":"연어아보카도볼","ingredients":["쌀","연어","아보카도","오이","방울토마토","간장","참기름","깨","마요네즈"],"cookTime":15,"tags":["헬시"],"nameEn":"Salmon Avocado Bowl","nutrition":{"cal":490,"pro":24.0,"carb":48.0,"fat":22.0},"type":"main"},{"style":"🇺🇸 미국","name":"퀴노아채소볼","ingredients":["쌀","병아리콩","시금치","당근","토마토","올리브오일","레몬","소금"],"cookTime":25,"tags":["헬시"],"nameEn":"Quinoa Vegetable Bowl","nutrition":{"cal":240,"pro":7.0,"carb":34.0,"fat":9.0},"type":"main"},{"style":"한식","name":"두부채소볶음","ingredients":["두부","브로콜리","파프리카","당근","마늘","간장","참기름","식용유"],"cookTime":20,"tags":["헬시"],"nameEn":"Tofu and Vegetable Stir-fry","nutrition":{"cal":140,"pro":10.0,"carb":8.0,"fat":8.0},"type":"main"},{"style":"한식","name":"닭가슴살채소볶음","ingredients":["닭가슴살","브로콜리","파프리카","양파","마늘","간장","올리브오일","후추"],"cookTime":20,"tags":["헬시"],"nameEn":"Chicken Breast and Vegetable Stir-fry","nutrition":{"cal":210,"pro":26.0,"carb":10.0,"fat":7.0},"type":"main"},{"style":"한식","name":"아욱국","ingredients":["아욱","된장","멸치육수","마늘","소금"],"cookTime":20,"tags":[],"nameEn":"Mallow Soup","nutrition":{"cal":65,"pro":3.0,"carb":7.0,"fat":2.5},"type":"main"},{"style":"한식","name":"갈치구이","ingredients":["갈치","소금","식용유","레몬"],"cookTime":15,"tags":["헬시"],"nameEn":"Grilled Hairtail Fish","nutrition":{"cal":220,"pro":28.0,"carb":0.5,"fat":11.0},"type":"main"},{"style":"한식","name":"코다리조림","ingredients":["코다리","무","간장","고춧가루","마늘","대파","설탕","물엿"],"cookTime":35,"tags":[],"nameEn":"Braised Semi-dried Pollock","nutrition":{"cal":220,"pro":26.0,"carb":12.0,"fat":6.0},"type":"main"},{"style":"한식","name":"동태전","ingredients":["동태","밀가루","계란","소금","식용유","대파"],"cookTime":25,"tags":[],"nameEn":"Pollock Pancake","nutrition":{"cal":210,"pro":16.0,"carb":7.0,"fat":13.0},"type":"main"},{"style":"한식","name":"감자볶음","ingredients":["감자","간장","설탕","참기름","대파","깨","식용유"],"cookTime":20,"tags":[],"nameEn":"Stir-fried Potatoes","nutrition":{"cal":130,"pro":2.0,"carb":16.0,"fat":6.0},"type":"side"},{"style":"한식","name":"도라지무침","ingredients":["도라지","고추장","식초","설탕","마늘","깨","참기름"],"cookTime":15,"tags":[],"nameEn":"Seasoned Bellflower Root","nutrition":{"cal":65,"pro":1.5,"carb":12.0,"fat":1.0},"type":"side"},{"style":"한식","name":"취나물무침","ingredients":["취나물","간장","된장","마늘","참기름","깨"],"cookTime":15,"tags":[],"nameEn":"Seasoned Chwinamul","nutrition":{"cal":35,"carb":4,"pro":1,"fat":2},"type":"side"},{"style":"한식","name":"느타리버섯볶음","ingredients":["느타리버섯","간장","마늘","대파","참기름","식용유"],"cookTime":15,"tags":[],"nameEn":"Stir-fried Oyster Mushrooms","nutrition":{"cal":60,"pro":2.0,"carb":5.0,"fat":3.8},"type":"side"},{"style":"한식","name":"고사리나물","ingredients":["고사리","간장","마늘","참기름","깨","식용유"],"cookTime":20,"tags":[],"nameEn":"Seasoned Bracken Fern","nutrition":{"cal":45,"pro":2.0,"carb":4.0,"fat":2.5},"type":"side"},{"style":"한식","name":"전복죽","ingredients":["전복","쌀","참기름","국간장","소금","깨"],"cookTime":40,"tags":[],"nameEn":"Abalone Porridge","nutrition":{"cal":270,"pro":8.0,"carb":51.0,"fat":4.0},"type":"main"},{"style":"한식","name":"닭죽","ingredients":["닭고기","쌀","마늘","대파","소금","참기름","후추"],"cookTime":50,"tags":[],"nameEn":"Chicken Porridge","nutrition":{"cal":280,"pro":15.0,"carb":44.0,"fat":5.0},"type":"main"},{"style":"한식","name":"건새우미역무침","ingredients":["미역","마른새우","식초","간장","설탕","마늘","깨"],"cookTime":15,"tags":[],"nameEn":"Dried Shrimp and Seaweed Salad","nutrition":{"cal":55,"pro":4.0,"carb":5.0,"fat":2.0},"type":"side"},{"style":"한식","name":"잡곡밥","ingredients":["쌀","현미","보리","콩","물"],"cookTime":40,"tags":[],"nameEn":"Multigrain Rice","nutrition":{"cal":310,"pro":7.0,"carb":66.0,"fat":2.0},"type":"main"},{"style":"한식","name":"영양솥밥","ingredients":["쌀","소고기","표고버섯","당근","간장","참기름","마늘"],"cookTime":40,"tags":[],"nameEn":"Nutritious Pot Rice","nutrition":{"cal":420,"pro":10.0,"carb":82.0,"fat":5.0},"type":"main"},{"style":"한식","name":"된장삼겹살","ingredients":["삼겹살","된장","마늘","양파","깻잎","쌈장","상추"],"cookTime":20,"tags":[],"nameEn":"Doenjang Pork Belly","nutrition":{"cal":480,"pro":22.0,"carb":4.0,"fat":42.0},"type":"main"},{"style":"한식","name":"간장새우장","ingredients":["새우","간장","마늘","생강","대파","설탕","청양고추","식초"],"cookTime":20,"tags":[],"nameEn":"Soy Sauce Marinated Shrimp","nutrition":{"cal":145,"pro":22.0,"carb":8.0,"fat":3.0},"type":"side"},{"style":"일식","name":"야키토리","ingredients":["닭고기","간장","미림","설탕","대파","생강"],"cookTime":25,"tags":[],"nameEn":"Yakitori","nutrition":{"cal":210,"pro":22.0,"carb":4.0,"fat":12.0},"type":"main"},{"style":"일식","name":"수프카레","ingredients":["닭고기","감자","당근","양파","코코넛밀크","카레가루","쌀","버터"],"cookTime":45,"tags":[],"nameEn":"Soup Curry","nutrition":{"cal":290,"pro":18.0,"carb":16.0,"fat":16.0},"type":"main"},{"style":"일식","name":"에비마요","ingredients":["새우","마요네즈","레몬","전분","설탕","식용유","소금"],"cookTime":20,"tags":[],"nameEn":"Ebi Mayo (Shrimp Mayonnaise)","nutrition":{"cal":380,"pro":14.0,"carb":22.0,"fat":26.0},"type":"main"},{"style":"일식","name":"쯔케멘","ingredients":["중면","돼지고기","간장","미림","된장","대파","생강","계란"],"cookTime":40,"tags":[],"nameEn":"Tsukemen","nutrition":{"cal":610,"carb":88,"pro":24,"fat":18},"type":"main"},{"style":"일식","name":"히레카츠","ingredients":["돼지고기","밀가루","계란","빵가루","식용유","소금","후추"],"cookTime":25,"tags":[],"nameEn":"Hire Katsu (Pork Fillet Cutlet)","nutrition":{"cal":390,"pro":27.0,"carb":16.0,"fat":23.0},"type":"main"},{"style":"일식","name":"멘치카츠","ingredients":["소고기","양파","밀가루","계란","빵가루","소금","후추","식용유"],"cookTime":25,"tags":[],"nameEn":"Menchi Katsu (Ground Meat Cutlet)","nutrition":{"cal":390,"pro":16.0,"carb":22.0,"fat":26.0},"type":"main"},{"style":"일식","name":"코로케","ingredients":["감자","소고기","양파","밀가루","계란","빵가루","식용유","소금"],"cookTime":35,"tags":[],"nameEn":"Korokke (Croquette)","nutrition":{"cal":310,"pro":5.0,"carb":32.0,"fat":18.0},"type":"main"},{"style":"일식","name":"마제소바","ingredients":["중면","돼지고기","간장","굴소스","마늘","계란","대파","고추기름"],"cookTime":25,"tags":[],"nameEn":"Mazesoba (Mixed Noodles)","nutrition":{"cal":580,"pro":21.0,"carb":82.0,"fat":18.0},"type":"main"},{"style":"중식","name":"차슈","ingredients":["돼지고기","간장","꿀","굴소스","미림","설탕","마늘","오향파우더"],"cookTime":50,"tags":[],"nameEn":"Chashu (Braised Pork)","nutrition":{"cal":270,"pro":16.0,"carb":5.0,"fat":21.0},"type":"main"},{"style":"중식","name":"홍샤오러우","ingredients":["삼겹살","간장","설탕","미림","생강","마늘","팔각","물엿"],"cookTime":70,"tags":[],"nameEn":"Red-braised Pork","nutrition":{"cal":540,"pro":18.0,"carb":12.0,"fat":48.0},"type":"main"},{"style":"중식","name":"어향육사","ingredients":["돼지고기","파프리카","목이버섯","죽순","간장","식초","설탕","두반장","마늘","생강"],"cookTime":25,"tags":[],"nameEn":"Yuxiang Shredded Pork","nutrition":{"cal":290,"pro":18.0,"carb":12.0,"fat":19.0},"type":"main"},{"style":"중식","name":"마늘새우볶음","ingredients":["새우","마늘","버터","간장","소금","후추","대파","식용유"],"cookTime":15,"tags":[],"nameEn":"Garlic Shrimp Stir-fry","nutrition":{"cal":230,"pro":18.0,"carb":6.0,"fat":15.0},"type":"main"},{"style":"중식","name":"소고기브로콜리볶음","ingredients":["소고기","브로콜리","굴소스","간장","마늘","전분","식용유"],"cookTime":20,"tags":[],"nameEn":"Beef and Broccoli Stir-fry","nutrition":{"cal":280,"pro":24.0,"carb":11.0,"fat":15.0},"type":"main"},{"style":"중식","name":"닭고기캐슈넛볶음","ingredients":["닭고기","캐슈넛","피망","파프리카","마늘","간장","굴소스","식용유"],"cookTime":20,"tags":[],"nameEn":"Chicken and Cashew Nut Stir-fry","nutrition":{"cal":380,"pro":24.0,"carb":16.0,"fat":24.0},"type":"main"},{"style":"중식","name":"중식오이냉채","ingredients":["오이","마늘","식초","설탕","간장","고추기름","깨"],"cookTime":10,"tags":[],"nameEn":"Chinese-style Cold Cucumber","nutrition":{"cal":65,"pro":2.0,"carb":7.0,"fat":3.0},"type":"side"},{"style":"🇮🇹 이탈리아","name":"뇨키","ingredients":["감자","밀가루","계란","소금","버터","파마산치즈","토마토소스"],"cookTime":40,"tags":[],"nameEn":"Gnocchi","nutrition":{"cal":320,"pro":7.0,"carb":52.0,"fat":10.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"미트볼파스타","ingredients":["소고기","스파게티","토마토소스","양파","마늘","파슬리","파마산치즈","계란"],"cookTime":35,"tags":[],"nameEn":"Meatball Pasta","nutrition":{"cal":580,"pro":24.0,"carb":75.0,"fat":20.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"페스토파스타","ingredients":["스파게티","바질","파마산치즈","올리브오일","마늘","잣","소금"],"cookTime":20,"tags":[],"nameEn":"Pesto Pasta","nutrition":{"cal":520,"pro":11.0,"carb":58.0,"fat":28.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"치킨카치아토라","ingredients":["닭고기","토마토","양파","파프리카","올리브","마늘","화이트와인","올리브오일"],"cookTime":45,"tags":[],"nameEn":"Chicken Cacciatore","nutrition":{"cal":310,"pro":28.0,"carb":14.0,"fat":15.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"로제파스타","ingredients":["스파게티","소시지","생크림","토마토소스","양파","마늘","파마산치즈"],"cookTime":25,"tags":[],"nameEn":"Rose Pasta (Creamy Tomato Pasta)","nutrition":{"cal":540,"pro":15.0,"carb":70.0,"fat":22.0},"type":"main"},{"style":"🇹🇭 태국","name":"꾸어이티어우","ingredients":["쌀국수","소고기","숙주","대파","피시소스","라임","고춧가루","마늘"],"cookTime":25,"tags":[],"nameEn":"Kuaitiao","nutrition":{"cal":390,"carb":72,"pro":14,"fat":5},"type":"main"},{"style":"🇹🇭 태국","name":"팟프리킹","ingredients":["닭고기","레드커리페이스트","피시소스","설탕","카피르라임잎","식용유","파프리카"],"cookTime":20,"tags":[],"nameEn":"Pad Prik King (Dry Red Curry Stir-fry)","nutrition":{"cal":360,"pro":24.0,"carb":11.0,"fat":24.0},"type":"main"},{"style":"🇹🇭 태국","name":"얌마무앙","ingredients":["그린망고","새우","마른새우","땅콩","설탕","피시소스","라임","고춧가루"],"cookTime":15,"tags":[],"nameEn":"Yam Mamuang (Mango Salad)","nutrition":{"cal":130,"pro":2.0,"carb":22.0,"fat":4.0},"type":"side"},{"style":"🇹🇭 태국","name":"카오팟크라파오","ingredients":["쌀","소고기","바질","마늘","굴소스","피시소스","계란","고춧가루"],"cookTime":15,"tags":[],"nameEn":"Khao Phat Khrapao","nutrition":{"cal":620,"carb":75,"pro":24,"fat":25},"type":"main"},{"style":"🇻🇳 베트남","name":"보룩락","ingredients":["소고기","양파","마늘","버터","간장","굴소스","후추","레몬","상추"],"cookTime":20,"tags":[],"nameEn":"Bò Lúc Lắc (Vietnamese Shaking Beef)","nutrition":{"cal":380,"pro":28.0,"carb":14.0,"fat":22.0},"type":"main"},{"style":"🇻🇳 베트남","name":"껌찌엔","ingredients":["쌀","계란","마늘","대파","간장","피시소스","식용유"],"cookTime":20,"tags":[],"nameEn":"Cơm Chiên","nutrition":{"cal":440,"pro":14.0,"carb":68.0,"fat":12.0},"type":"main"},{"style":"🇻🇳 베트남","name":"껌땀","ingredients":["쌀","돼지고기","계란","피시소스","마늘","설탕","라임"],"cookTime":30,"tags":[],"nameEn":"Cơm tấm","nutrition":{"cal":590,"pro":32.0,"carb":75.0,"fat":18.0},"type":"main"},{"style":"🇻🇳 베트남","name":"미싸오","ingredients":["중면","새우","오징어","숙주","피시소스","굴소스","마늘","식용유"],"cookTime":20,"tags":[],"nameEn":"Mee Sao (Crispy Noodles)","nutrition":{"cal":460,"pro":14.0,"carb":65.0,"fat":16.0},"type":"main"},{"style":"🇮🇳 인도","name":"새우마살라","ingredients":["새우","양파","토마토","마늘","생강","가람마살라","커민","고춧가루","코코넛밀크"],"cookTime":30,"tags":[],"nameEn":"Prawn Masala","nutrition":{"cal":280,"pro":18.0,"carb":14.0,"fat":16.0},"type":"main"},{"style":"🇮🇳 인도","name":"말라이코프타","ingredients":["감자","파니르","양파","토마토","생크림","가람마살라","커민","고수분말","버터"],"cookTime":45,"tags":[],"nameEn":"Malai Kofta","nutrition":{"cal":320,"pro":8.0,"carb":24.0,"fat":21.0},"type":"main"},{"style":"🇮🇳 인도","name":"라이타","ingredients":["요거트","오이","토마토","마늘","커민","소금","고수"],"cookTime":10,"tags":["헬시"],"nameEn":"Raita","nutrition":{"cal":80,"pro":4.0,"carb":6.0,"fat":4.0},"type":"side"},{"style":"한식","name":"버섯솥밥","ingredients":["쌀","느타리버섯","표고버섯","간장","마늘","참기름","계란"],"cookTime":35,"tags":["헬시"],"nameEn":"Mushroom Pot Rice","nutrition":{"cal":390,"pro":9.0,"carb":74.0,"fat":6.0},"type":"main"},{"style":"한식","name":"두부미역국","ingredients":["두부","미역","국간장","참기름","마늘","소금"],"cookTime":20,"tags":["헬시"],"nameEn":"Tofu and Seaweed Soup","nutrition":{"cal":75,"pro":6.0,"carb":4.0,"fat":4.0},"type":"main"},{"style":"🇮🇳 인도","name":"병아리콩샐러드","ingredients":["병아리콩","오이","토마토","적양파","올리브오일","레몬","파슬리","소금"],"cookTime":15,"tags":["헬시"],"nameEn":"Chickpea Salad","nutrition":{"cal":190,"pro":8.0,"carb":22.0,"fat":8.0},"type":"main"},{"style":"🇺🇸 미국","name":"참치채소샐러드","ingredients":["참치캔","오이","양파","마요네즈","레몬","상추","방울토마토","소금"],"cookTime":10,"tags":["헬시"],"nameEn":"Tuna and Vegetable Salad","nutrition":{"cal":140,"pro":18.0,"carb":8.0,"fat":4.0},"type":"side"},{"style":"🇲🇽 멕시코","name":"포졸레","ingredients":["돼지고기","옥수수","양파","마늘","오레가노","고춧가루","칠리파우더","라임","소금"],"cookTime":60,"tags":[],"nameEn":"Pozole","nutrition":{"cal":290,"pro":22.0,"carb":21.0,"fat":13.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"타말레","ingredients":["옥수수가루","돼지고기","고춧가루","커민","버터","마늘","소금"],"cookTime":60,"tags":[],"nameEn":"Tamale","nutrition":{"cal":280,"pro":9.0,"carb":28.0,"fat":15.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"토스타다","ingredients":["또띠아","닭고기","아보카도","토마토","상추","치즈","사워크림","살사소스"],"cookTime":20,"tags":[],"nameEn":"Tostada","nutrition":{"cal":340,"pro":16.0,"carb":28.0,"fat":18.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"칠레레예노","ingredients":["파프리카","소고기","치즈","계란","밀가루","토마토소스","소금","식용유"],"cookTime":45,"tags":[],"nameEn":"Chile Relleno","nutrition":{"cal":380,"pro":14.0,"carb":18.0,"fat":28.0},"type":"main"},{"style":"🇮🇩 인도네시아","name":"나시짬빌","ingredients":["쌀","닭고기","두부","숙주","삼발소스","코코넛밀크","라임","계란"],"cookTime":35,"tags":[],"nameEn":"Nasi Campur","nutrition":{"cal":640,"carb":84,"pro":28,"fat":21},"type":"main"},{"style":"🇮🇩 인도네시아","name":"이칸고랭","ingredients":["고등어","마늘","강황","식용유","소금","라임"],"cookTime":20,"tags":[],"nameEn":"Ikan Goreng (Fried Fish)","nutrition":{"cal":280,"pro":24.0,"carb":8.0,"fat":17.0},"type":"main"},{"style":"🇮🇩 인도네시아","name":"삼발우당","ingredients":["새우","삼발소스","마늘","새우페이스트","양파","팜슈가","라임","식용유"],"cookTime":20,"tags":[],"nameEn":"Sambal Udang","nutrition":{"cal":260,"pro":22.0,"carb":12.0,"fat":13.0},"type":"main"},{"style":"🇮🇩 인도네시아","name":"캅카이","ingredients":["양배추","당근","브로콜리","버섯","간장","굴소스","마늘","식용유"],"cookTime":15,"tags":[],"nameEn":"Khap Kai","nutrition":{"cal":240,"pro":14.0,"carb":18.0,"fat":14.0},"type":"main"},{"style":"🇹🇷 터키","name":"보렉","ingredients":["밀가루","시금치","페타치즈","계란","버터","소금","요거트"],"cookTime":50,"tags":[],"nameEn":"Börek (Turkish Pastry)","nutrition":{"cal":340,"pro":10.0,"carb":38.0,"fat":16.0},"type":"main"},{"style":"🇹🇷 터키","name":"쉬쉬타북","ingredients":["닭고기","요거트","마늘","레몬","파프리카파우더","커민","소금","올리브오일"],"cookTime":30,"tags":[],"nameEn":"Shish Taouk","nutrition":{"cal":310,"carb":4,"pro":31,"fat":18},"type":"main"},{"style":"🇲🇾 말레이시아","name":"논야커리","ingredients":["닭고기","코코넛밀크","레몬그라스","강황","마늘","생강","팜슈가","피시소스"],"cookTime":40,"tags":[],"nameEn":"Nyonya Curry","nutrition":{"cal":420,"carb":15,"pro":26,"fat":28},"type":"main"},{"style":"🇲🇾 말레이시아","name":"이칸마살라","ingredients":["고등어","양파","마늘","생강","토마토","강황","고춧가루","코코넛밀크"],"cookTime":30,"tags":[],"nameEn":"Ikan Masala (Fish Masala)","nutrition":{"cal":260,"pro":22.0,"carb":14.0,"fat":13.0},"type":"main"},{"style":"🇲🇾 말레이시아","name":"삼발켄팅","ingredients":["공심채","삼발소스","마늘","새우페이스트","양파","식용유"],"cookTime":15,"tags":[],"nameEn":"Sambal Kentang (Potato Sambal)","nutrition":{"cal":210,"pro":4.0,"carb":24.0,"fat":11.0},"type":"main"},{"style":"🇲🇾 말레이시아","name":"케랍아얌","ingredients":["닭가슴살","코코넛밀크","레몬그라스","강황","마늘","생강","고춧가루","라임"],"cookTime":30,"tags":[],"nameEn":"Kerabu Ayam (Malaysian Chicken Salad)","nutrition":{"cal":260,"pro":24.0,"carb":8.0,"fat":15.0},"type":"main"},{"style":"🇵🇭 필리핀","name":"피나클렛","ingredients":["가지","고구마","양배추","피시소스","마늘","새우페이스트","토마토","생강"],"cookTime":30,"tags":[],"nameEn":"Pinakbet","nutrition":{"cal":160,"carb":14,"pro":8,"fat":8},"type":"main"},{"style":"🇵🇭 필리핀","name":"에스카베체","ingredients":["갈치","식초","설탕","피망","당근","마늘","생강","소금"],"cookTime":30,"tags":[],"nameEn":"Escabeche (Pickled Fish)","nutrition":{"cal":240,"pro":18.0,"carb":10.0,"fat":14.0},"type":"main"},{"style":"🇵🇭 필리핀","name":"비나고나안","ingredients":["돼지고기","새우페이스트","마늘","양파","토마토","라임","설탕","식용유"],"cookTime":30,"tags":[],"nameEn":"Binagoongan","nutrition":{"cal":460,"carb":6,"pro":28,"fat":37},"type":"main"},{"style":"🇵🇭 필리핀","name":"킬라윈","ingredients":["새우","식초","양파","마늘","생강","라임","소금","고추"],"cookTime":15,"tags":[],"nameEn":"Kinilaw (Filipino Ceviche)","nutrition":{"cal":180,"pro":22.0,"carb":6.0,"fat":8.0},"type":"main"},{"style":"🇸🇬 싱가포르","name":"블랙페퍼크랩","ingredients":["꽃게","후추","버터","간장","마늘","굴소스","대파","식용유"],"cookTime":30,"tags":[],"nameEn":"Black Pepper Crab","nutrition":{"cal":320,"pro":26.0,"carb":18.0,"fat":16.0},"type":"main"},{"style":"🇸🇬 싱가포르","name":"미폭국수","ingredients":["중면","돼지고기","숙주","두부","간장","참기름","마늘","식용유"],"cookTime":20,"tags":[],"nameEn":"Mee Pok","nutrition":{"cal":480,"carb":68,"pro":16,"fat":15},"type":"main"},{"style":"🇸🇬 싱가포르","name":"나시빠당","ingredients":["쌀","닭고기","삼발소스","코코넛밀크","강황","레몬그라스","마늘"],"cookTime":40,"tags":[],"nameEn":"Nasi Padang","nutrition":{"cal":620,"pro":26.0,"carb":72.0,"fat":25.0},"type":"main"},{"style":"🇬🇷 그리스","name":"티로피타","ingredients":["밀가루","페타치즈","계란","버터","소금","시금치"],"cookTime":50,"tags":[],"nameEn":"Tiropita (Greek Cheese Pie)","nutrition":{"cal":360,"pro":9.0,"carb":24.0,"fat":26.0},"type":"main"},{"style":"🇬🇷 그리스","name":"스티파도","ingredients":["소고기","양파","토마토","레드와인","계피","월계수잎","올리브오일","마늘"],"cookTime":90,"tags":[],"nameEn":"Stifado (Greek Beef Stew)","nutrition":{"cal":360,"pro":24.0,"carb":14.0,"fat":21.0},"type":"main"},{"style":"🇬🇷 그리스","name":"브리암","ingredients":["감자","가지","토마토","파프리카","양파","올리브오일","마늘","오레가노"],"cookTime":50,"tags":[],"nameEn":"Briam (Greek Roasted Vegetables)","nutrition":{"cal":150,"pro":3.0,"carb":16.0,"fat":8.0},"type":"main"},{"style":"🇬🇷 그리스","name":"스코르달리아","ingredients":["감자","마늘","올리브오일","레몬","소금","식초"],"cookTime":20,"tags":[],"nameEn":"Skordalia (Greek Garlic Sauce)","nutrition":{"cal":180,"pro":2.0,"carb":18.0,"fat":11.0},"type":"main"},{"style":"🇪🇸 스페인","name":"파에야","ingredients":["쌀","새우","오징어","홍합","파프리카","양파","마늘","올리브오일","강황","토마토"],"cookTime":40,"tags":[],"nameEn":"Paella","nutrition":{"cal":520,"pro":24.0,"carb":74.0,"fat":14.0},"type":"main"},{"style":"🇪🇸 스페인","name":"가스파초","ingredients":["토마토","오이","파프리카","양파","마늘","올리브오일","식초","소금","후추"],"cookTime":15,"tags":["헬시"],"nameEn":"Gazpacho","nutrition":{"cal":80,"pro":1.5,"carb":9.0,"fat":3.5},"type":"main"},{"style":"🇪🇸 스페인","name":"또르티야에스파뇰라","ingredients":["계란","감자","양파","올리브오일","소금","후추"],"cookTime":30,"tags":[],"nameEn":"Tortilla Española","nutrition":{"cal":320,"carb":24,"pro":11,"fat":20},"type":"main"},{"style":"🇪🇸 스페인","name":"알봉디가스","ingredients":["소고기","양파","마늘","계란","빵가루","토마토소스","파슬리","소금","후추"],"cookTime":35,"tags":[],"nameEn":"Albóndigas","nutrition":{"cal":310,"carb":12,"pro":19,"fat":20},"type":"main"},{"style":"🇫🇷 프랑스","name":"부야베스","ingredients":["대구","새우","홍합","토마토","양파","마늘","올리브오일","사프란","소금","후추"],"cookTime":45,"tags":[],"nameEn":"Bouillabaisse","nutrition":{"cal":260,"pro":28.0,"carb":14.0,"fat":10.0},"type":"main"},{"style":"🇫🇷 프랑스","name":"크로크무슈","ingredients":["식빵","햄","치즈","버터","생크림","밀가루","소금","후추"],"cookTime":20,"tags":["브런치"],"nameEn":"Croque Monsieur","nutrition":{"cal":430,"pro":18.0,"carb":34.0,"fat":25.0},"type":"main"},{"style":"🇫🇷 프랑스","name":"코코뱅","ingredients":["닭고기","레드와인","양파","당근","버섯","마늘","버터","베이컨"],"cookTime":70,"tags":[],"nameEn":"Coq au Vin","nutrition":{"cal":380,"pro":32.0,"carb":12.0,"fat":16.0},"type":"main"},{"style":"🇫🇷 프랑스","name":"라따뚜이","ingredients":["가지","애호박","토마토","파프리카","양파","마늘","올리브오일","바질","오레가노"],"cookTime":50,"tags":[],"nameEn":"Ratatouille","nutrition":{"cal":130,"pro":3.0,"carb":14.0,"fat":7.0},"type":"main"},{"style":"한식","name":"계란국","ingredients":["계란","대파","국간장","참기름","소금"],"cookTime":10,"tags":[],"nameEn":"Egg Soup","nutrition":{"cal":65,"pro":5.0,"carb":3.0,"fat":4.0},"type":"main"},{"style":"한식","name":"배추된장국","ingredients":["배추","된장","두부","멸치육수","대파","마늘"],"cookTime":20,"tags":[],"nameEn":"Napa Cabbage Doenjang Soup","nutrition":{"cal":55,"pro":3.5,"carb":7.0,"fat":1.5},"type":"main"},{"style":"한식","name":"마늘종볶음","ingredients":["마늘종","고추장","간장","설탕","참기름","깨","식용유"],"cookTime":15,"tags":[],"nameEn":"Stir-fried Garlic Scapes","nutrition":{"cal":50,"pro":1.0,"carb":6.0,"fat":2.5},"type":"side"},{"style":"한식","name":"참나물무침","ingredients":["참나물","간장","참기름","마늘","깨","식초"],"cookTime":10,"tags":[],"nameEn":"Seasoned Chammnamul (Wild Parsley)","nutrition":{"cal":35,"pro":1.0,"carb":4.0,"fat":2.0},"type":"side"},{"style":"한식","name":"삼치조림","ingredients":["삼치","무","간장","고춧가루","마늘","대파","설탕","물엿"],"cookTime":30,"tags":[],"nameEn":"Braised Spanish Mackerel","nutrition":{"cal":290,"pro":30.0,"carb":10.0,"fat":13.0},"type":"main"},{"style":"한식","name":"골뱅이무침","ingredients":["골뱅이","오이","양파","당근","고춧가루","식초","설탕","참기름","깨"],"cookTime":15,"tags":[],"nameEn":"Spicy Whelk Salad","nutrition":{"cal":190,"pro":21.0,"carb":18.0,"fat":4.0},"type":"side"},{"style":"한식","name":"닭한마리","ingredients":["닭고기","감자","당면","대파","마늘","소금","국간장","청양고추"],"cookTime":50,"tags":[],"nameEn":"Whole Chicken Hot Pot","nutrition":{"cal":340,"pro":38.0,"carb":12.0,"fat":15.0},"type":"main"},{"style":"한식","name":"추어탕","ingredients":["미꾸라지","된장","고춧가루","대파","마늘","들기름","들깨가루"],"cookTime":60,"tags":[],"nameEn":"Chueo Tang (Loach Soup)","nutrition":{"cal":210,"pro":18.0,"carb":12.0,"fat":10.0},"type":"main"},{"style":"한식","name":"들깨미역국","ingredients":["미역","들기름","들깨가루","국간장","마늘","물"],"cookTime":20,"tags":[],"nameEn":"Perilla Seed and Seaweed Soup","nutrition":{"cal":95,"pro":4.0,"carb":5.0,"fat":7.0},"type":"main"},{"style":"한식","name":"대패삼겹살구이","ingredients":["대패삼겹살","쌈장","마늘","상추","깻잎","양파"],"cookTime":15,"tags":[],"nameEn":"Thinly Sliced Grilled Pork Belly","nutrition":{"cal":490,"pro":22.0,"carb":1.0,"fat":45.0},"type":"main"},{"style":"한식","name":"두부부침","ingredients":["두부","계란","밀가루","간장","대파","식용유","소금"],"cookTime":20,"tags":[],"nameEn":"Pan-fried Tofu","nutrition":{"cal":140,"pro":10.0,"carb":3.0,"fat":10.0},"type":"main"},{"style":"한식","name":"황태구이","ingredients":["황태","간장","고추장","마늘","참기름","꿀","설탕"],"cookTime":20,"tags":[],"nameEn":"Grilled Dried Pollack","nutrition":{"cal":180,"pro":24.0,"carb":8.0,"fat":5.0},"type":"main"},{"style":"한식","name":"간장게장","ingredients":["꽃게","간장","마늘","생강","설탕","청양고추","대파","식초"],"cookTime":30,"tags":[],"nameEn":"Soy Sauce Marinated Crab","nutrition":{"cal":320,"pro":33.0,"carb":8.0,"fat":7.0},"type":"main"},{"style":"한식","name":"전복미역국","ingredients":["전복","미역","참기름","국간장","마늘","소금"],"cookTime":30,"tags":[],"nameEn":"Abalone and Seaweed Soup","nutrition":{"cal":90,"pro":10.0,"carb":5.0,"fat":4.0},"type":"main"},{"style":"한식","name":"된장비빔밥","ingredients":["쌀","된장","계란","시금치","버섯","당근","참기름","마늘"],"cookTime":30,"tags":[],"nameEn":"Doenjang Bibimbap","nutrition":{"cal":460,"pro":15.0,"carb":76.0,"fat":10.0},"type":"main"},{"style":"일식","name":"돈지루","ingredients":["돼지고기","감자","당근","무","미소된장","대파","참기름","다시"],"cookTime":25,"tags":[],"nameEn":"Tonjiru (Pork Miso Soup)","nutrition":{"cal":180,"pro":12.0,"carb":8.0,"fat":11.0},"type":"main"},{"style":"일식","name":"에비후라이","ingredients":["새우","밀가루","계란","빵가루","식용유","소금","후추"],"cookTime":20,"tags":[],"nameEn":"Ebi Furai (Fried Shrimp)","nutrition":{"cal":280,"pro":13.0,"carb":18.0,"fat":17.0},"type":"main"},{"style":"일식","name":"야키우동","ingredients":["우동","돼지고기","양배추","숙주","간장","굴소스","참기름","식용유"],"cookTime":20,"tags":[],"nameEn":"Yaki Udon (Stir-fried Udon)","nutrition":{"cal":440,"pro":11.0,"carb":72.0,"fat":12.0},"type":"main"},{"style":"일식","name":"치킨난반","ingredients":["닭고기","계란","밀가루","식용유","식초","간장","설탕","마요네즈"],"cookTime":30,"tags":[],"nameEn":"Chicken Nanban","nutrition":{"cal":520,"pro":26.0,"carb":24.0,"fat":36.0},"type":"main"},{"style":"일식","name":"이시카리나베","ingredients":["연어","두부","양배추","버섯","콩나물","미소된장","버터","다시"],"cookTime":35,"tags":[],"nameEn":"Ishikari Nabe (Salmon Hot Pot)","nutrition":{"cal":290,"pro":28.0,"carb":11.0,"fat":15.0},"type":"main"},{"style":"일식","name":"카키아게","ingredients":["새우","양파","당근","밀가루","계란","식용유","간장","미림","다시"],"cookTime":25,"tags":[],"nameEn":"Kakiage (Mixed Tempura)","nutrition":{"cal":280,"pro":3.0,"carb":22.0,"fat":20.0},"type":"main"},{"style":"일식","name":"사케미소즈케","ingredients":["연어","미소된장","미림","설탕","간장","생강"],"cookTime":25,"tags":[],"nameEn":"Sake Miso Zuke (Miso-marinated Salmon)","nutrition":{"cal":260,"pro":26.0,"carb":4.0,"fat":15.0},"type":"main"},{"style":"일식","name":"부타킴치","ingredients":["돼지고기","김치","양파","대파","참기름","간장","설탕","식용유"],"cookTime":20,"tags":[],"nameEn":"Buta Kimchi (Pork and Kimchi Stir-fry)","nutrition":{"cal":320,"pro":21.0,"carb":8.0,"fat":22.0},"type":"main"},{"style":"중식","name":"마파가지","ingredients":["가지","돼지고기","두반장","마늘","생강","간장","참기름","전분"],"cookTime":20,"tags":[],"nameEn":"Mapo Eggplant","nutrition":{"cal":190,"pro":4.0,"carb":14.0,"fat":14.0},"type":"main"},{"style":"중식","name":"차오멘","ingredients":["중면","닭고기","양배추","숙주","간장","굴소스","참기름","식용유"],"cookTime":20,"tags":[],"nameEn":"Chow Mein","nutrition":{"cal":510,"pro":14.0,"carb":68.0,"fat":20.0},"type":"main"},{"style":"중식","name":"바오즈","ingredients":["밀가루","돼지고기","양배추","간장","생강","마늘","참기름","설탕"],"cookTime":50,"tags":[],"nameEn":"Baozi (Steamed Buns)","nutrition":{"cal":340,"pro":12.0,"carb":48.0,"fat":11.0},"type":"main"},{"style":"중식","name":"쿵파오치킨","ingredients":["닭고기","땅콩","건고추","간장","식초","설탕","마늘","생강","전분","고추기름"],"cookTime":20,"tags":[],"nameEn":"Kung Pao Chicken","nutrition":{"cal":380,"pro":24.0,"carb":16.0,"fat":24.0},"type":"main"},{"style":"중식","name":"슈마이","ingredients":["완탕피","돼지고기","새우","생강","간장","참기름","설탕"],"cookTime":25,"tags":[],"nameEn":"Shumai","nutrition":{"cal":210,"pro":10.0,"carb":22.0,"fat":9.0},"type":"main"},{"style":"중식","name":"게살볶음밥","ingredients":["쌀","게살","계란","대파","간장","참기름","소금","식용유"],"cookTime":15,"tags":[],"nameEn":"Crab Meat Fried Rice","nutrition":{"cal":440,"pro":17.0,"carb":68.0,"fat":11.0},"type":"main"},{"style":"중식","name":"해파리냉채","ingredients":["해파리","오이","마늘","식초","참기름","설탕","간장","고추기름"],"cookTime":15,"tags":[],"nameEn":"Cold Jellyfish Salad","nutrition":{"cal":110,"pro":6.0,"carb":12.0,"fat":4.0},"type":"side"},{"style":"🇮🇹 이탈리아","name":"뇨키토마토","ingredients":["감자","밀가루","계란","토마토소스","바질","파마산치즈","올리브오일","소금"],"cookTime":40,"tags":[],"nameEn":"Gnocchi with Tomato Sauce","nutrition":{"cal":380,"pro":9.0,"carb":56.0,"fat":13.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"아마트리치아나","ingredients":["스파게티","베이컨","토마토소스","양파","마늘","파마산치즈","올리브오일"],"cookTime":25,"tags":[],"nameEn":"Amatriciana","nutrition":{"cal":460,"pro":14.0,"carb":66.0,"fat":15.0},"type":"main"},{"style":"🇫🇷 프랑스","name":"니수아즈 샐러드","ingredients":["참치캔","계란","감자","방울토마토","올리브","앤초비","양상추","올리브오일","레몬"],"cookTime":25,"tags":[],"nameEn":"Salade Niçoise","nutrition":{"cal":290,"carb":11,"pro":18,"fat":19},"type":"side"},{"style":"🇳🇴 노르웨이","name":"그릴드연어","ingredients":["연어","버터","레몬","마늘","파슬리","소금","후추","올리브오일"],"cookTime":20,"tags":[],"nameEn":"Grilled Salmon","nutrition":{"cal":250,"pro":30.0,"carb":0.1,"fat":14.0},"type":"main"},{"style":"🇫🇷 프랑스","name":"크림브로콜리수프","ingredients":["브로콜리","양파","마늘","버터","생크림","치킨스톡","소금","후추"],"cookTime":30,"tags":[],"nameEn":"Cream of Broccoli Soup","nutrition":{"cal":210,"pro":5.0,"carb":16.0,"fat":15.0},"type":"main"},{"style":"🇹🇭 태국","name":"카이지아우무쌉","ingredients":["계란","돼지고기","마늘","피시소스","굴소스","설탕","식용유","고수"],"cookTime":15,"tags":[],"nameEn":"Khai Jiao Mu Sap (Thai Minced Pork Omelette)","nutrition":{"cal":340,"pro":16.0,"carb":6.0,"fat":28.0},"type":"main"},{"style":"🇹🇭 태국","name":"파낭커리","ingredients":["닭고기","코코넛밀크","레드커리페이스트","카피르라임잎","피시소스","설탕","바질"],"cookTime":25,"tags":[],"nameEn":"Panang Curry","nutrition":{"cal":420,"pro":26.0,"carb":15.0,"fat":29.0},"type":"main"},{"style":"🇹🇭 태국","name":"얌느아","ingredients":["소고기","양파","토마토","고수","라임","피시소스","설탕","고춧가루","마늘"],"cookTime":20,"tags":[],"nameEn":"Yam Nua (Thai Beef Salad)","nutrition":{"cal":190,"pro":20.0,"carb":10.0,"fat":8.0},"type":"main"},{"style":"🇻🇳 베트남","name":"차까","ingredients":["생선","딜","레몬그라스","마늘","강황","피시소스","쌀국수","땅콩","고수"],"cookTime":30,"tags":[],"nameEn":"Cha Ca","nutrition":{"cal":310,"carb":8,"pro":26,"fat":19},"type":"main"},{"style":"🇻🇳 베트남","name":"넴루이","ingredients":["돼지고기","레몬그라스","마늘","피시소스","설탕","라이스페이퍼","상추","고수","땅콩"],"cookTime":30,"tags":[],"nameEn":"Nem Lui (Vietnamese Lemongrass Pork Skewers)","nutrition":{"cal":290,"pro":20.0,"carb":8.0,"fat":20.0},"type":"main"},{"style":"🇻🇳 베트남","name":"보비아","ingredients":["라이스페이퍼","달걀","당근","숙주","오이","피시소스","라임","마늘"],"cookTime":20,"tags":[],"nameEn":"Bo Bia (Vietnamese Rice Paper Rolls)","nutrition":{"cal":210,"pro":8.0,"carb":26.0,"fat":8.0},"type":"main"},{"style":"🇻🇳 베트남","name":"커리치킨반미","ingredients":["바게트","닭고기","카레가루","코코넛밀크","당근","오이","고수","마요네즈","피시소스"],"cookTime":30,"tags":[],"nameEn":"Curry Chicken Banh Mi","nutrition":{"cal":490,"pro":21.0,"carb":58.0,"fat":19.0},"type":"main"},{"style":"🇮🇳 인도","name":"사히파니르","ingredients":["파니르","양파","캐슈넛","생크림","토마토","마늘","생강","가람마살라","버터"],"cookTime":40,"tags":[],"nameEn":"Shahi Paneer","nutrition":{"cal":360,"carb":14,"pro":12,"fat":29},"type":"main"},{"style":"🇮🇳 인도","name":"알루파라타","ingredients":["밀가루","감자","양파","마늘","커민","고춧가루","버터","소금"],"cookTime":35,"tags":[],"nameEn":"Aloo Paratha","nutrition":{"cal":290,"pro":5.0,"carb":42.0,"fat":11.0},"type":"main"},{"style":"🇮🇳 인도","name":"케이마마터","ingredients":["양고기","완두콩","양파","토마토","마늘","생강","가람마살라","커민","강황"],"cookTime":40,"tags":[],"nameEn":"Keema Matar","nutrition":{"cal":340,"carb":16,"pro":22,"fat":21},"type":"main"},{"style":"🇺🇸 미국","name":"두부스크램블에그","ingredients":["두부","계란","시금치","마늘","올리브오일","소금","후추","파프리카파우더"],"cookTime":15,"tags":["헬시","브런치"],"nameEn":"Tofu Scrambled Eggs","nutrition":{"cal":145,"pro":11.0,"carb":3.0,"fat":10.0},"type":"side"},{"style":"일식","name":"메밀소바샐러드","ingredients":["메밀면","오이","당근","참기름","간장","식초","깨","소금"],"cookTime":15,"tags":["헬시"],"nameEn":"Soba Noodle Salad","nutrition":{"cal":290,"pro":9.0,"carb":54.0,"fat":4.0},"type":"main"},{"style":"🇺🇸 미국","name":"아보카도연어토스트","ingredients":["식빵","연어","아보카도","레몬","소금","후추","올리브오일"],"cookTime":10,"tags":["헬시","브런치"],"nameEn":"Avocado Salmon Toast","nutrition":{"cal":390,"pro":16.0,"carb":26.0,"fat":25.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"치미창가","ingredients":["또띠아","닭고기","치즈","토마토소스","양파","마늘","고춧가루","사워크림","식용유"],"cookTime":25,"tags":[],"nameEn":"Chimichanga","nutrition":{"cal":580,"pro":26.0,"carb":54.0,"fat":28.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"소파데리마","ingredients":["닭고기","양파","마늘","토마토","라임","고춧가루","고수","소금","쌀"],"cookTime":35,"tags":[],"nameEn":"Sopa de Lima (Mexican Lime Soup)","nutrition":{"cal":210,"pro":14.0,"carb":16.0,"fat":9.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"엠파나다","ingredients":["밀가루","소고기","양파","마늘","토마토","올리브","계란","올리브오일","소금"],"cookTime":40,"tags":[],"nameEn":"Empanada","nutrition":{"cal":380,"pro":12.0,"carb":36.0,"fat":21.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"멕시코콩스튜","ingredients":["강낭콩","돼지고기","양파","마늘","토마토","고춧가루","커민","오레가노","소금"],"cookTime":60,"tags":[],"nameEn":"Mexican Bean Stew","nutrition":{"cal":220,"pro":11.0,"carb":34.0,"fat":4.0},"type":"main"},{"style":"🇮🇩 인도네시아","name":"아얌페냑","ingredients":["닭고기","삼발소스","마늘","생강","강황","식용유","라임","소금"],"cookTime":30,"tags":[],"nameEn":"Ayam Penyet","nutrition":{"cal":430,"carb":8,"pro":32,"fat":30},"type":"main"},{"style":"🇮🇩 인도네시아","name":"템페고랭","ingredients":["두부","마늘","삼발소스","케찹마니스","식용유","소금","라임"],"cookTime":15,"tags":[],"nameEn":"Tempe Goreng (Fried Tempeh)","nutrition":{"cal":310,"pro":16.0,"carb":14.0,"fat":22.0},"type":"main"},{"style":"🇮🇩 인도네시아","name":"롱통","ingredients":["쌀","코코넛밀크","레몬그라스","월계수잎","소금","닭고기","마늘"],"cookTime":60,"tags":[],"nameEn":"Lontong","nutrition":{"cal":340,"pro":10.0,"carb":48.0,"fat":12.0},"type":"main"},{"style":"🇲🇾 말레이시아","name":"이칸아삼","ingredients":["고등어","타마린드","양파","마늘","강황","피시소스","팜슈가","고춧가루"],"cookTime":30,"tags":[],"nameEn":"Ikan Asam (Tamarind Fish)","nutrition":{"cal":190,"pro":22.0,"carb":9.0,"fat":7.0},"type":"main"},{"style":"🇲🇾 말레이시아","name":"아얌고랭베렘팍","ingredients":["닭고기","마늘","생강","강황","커민","고수분말","식용유","소금"],"cookTime":35,"tags":[],"nameEn":"Ayam Goreng Berempah","nutrition":{"cal":390,"carb":6,"pro":29,"fat":27},"type":"main"},{"style":"🇲🇾 말레이시아","name":"달채소카레","ingredients":["렌틸콩","양배추","당근","코코넛밀크","카레가루","마늘","양파","소금"],"cookTime":30,"tags":[],"nameEn":"Lentil Vegetable Curry","nutrition":{"cal":210,"pro":8.0,"carb":26.0,"fat":8.0},"type":"main"},{"style":"🇵🇭 필리핀","name":"카레카레","ingredients":["소고기","땅콩버터","가지","양배추","양파","새우페이스트","마늘","강황","쌀"],"cookTime":60,"tags":[],"nameEn":"Kare-Kare (Filipino Peanut Stew)","nutrition":{"cal":440,"pro":28.0,"carb":14.0,"fat":31.0},"type":"main"},{"style":"🇵🇭 필리핀","name":"니라가","ingredients":["소고기","감자","양배추","양파","대파","피시소스","소금","후추"],"cookTime":60,"tags":[],"nameEn":"Nilagang Baka","nutrition":{"cal":240,"carb":8,"pro":28,"fat":10},"type":"main"},{"style":"🇵🇭 필리핀","name":"토실로그","ingredients":["삼겹살","쌀","계란","마늘","식초","소금","후추"],"cookTime":25,"tags":[],"nameEn":"Tocilog","nutrition":{"cal":580,"carb":52,"pro":28,"fat":26},"type":"main"},{"style":"🇹🇷 터키","name":"카르니야르크","ingredients":["가지","소고기","양파","토마토","마늘","올리브오일","파슬리","소금","후추"],"cookTime":50,"tags":[],"nameEn":"Karnıyarık (Stuffed Eggplant)","nutrition":{"cal":240,"pro":14.0,"carb":12.0,"fat":16.0},"type":"main"},{"style":"🇹🇷 터키","name":"귀벡","ingredients":["양고기","감자","토마토","파프리카","양파","마늘","올리브오일","타임","소금"],"cookTime":60,"tags":[],"nameEn":"Güveç (Turkish Casserole)","nutrition":{"cal":290,"pro":26.0,"carb":12.0,"fat":15.0},"type":"main"},{"style":"🇹🇷 터키","name":"자작크","ingredients":["요거트","오이","마늘","올리브오일","소금","딜","레몬"],"cookTime":10,"tags":[],"nameEn":"Tzatziki","nutrition":{"cal":90,"carb":5,"pro":5,"fat":6},"type":"side"},{"style":"🇸🇬 싱가포르","name":"스팀보트","ingredients":["꽃게","새우","어묵","두부","숙주","배추","버섯","된장","소금"],"cookTime":30,"tags":[],"nameEn":"Steamboat (Hot Pot)","nutrition":{"cal":290,"pro":26.0,"carb":12.0,"fat":14.0},"type":"main"},{"style":"🇸🇬 싱가포르","name":"치킨콘지","ingredients":["쌀","닭고기","생강","간장","소금","참기름","대파","후추"],"cookTime":40,"tags":[],"nameEn":"Chicken Congee","nutrition":{"cal":220,"pro":10.0,"carb":38.0,"fat":3.0},"type":"main"},{"style":"🇸🇬 싱가포르","name":"피시헤드커리","ingredients":["생선","토마토","가지","양파","마늘","커리파우더","코코넛밀크","피시소스"],"cookTime":35,"tags":[],"nameEn":"Fish Head Curry","nutrition":{"cal":380,"pro":32.0,"carb":18.0,"fat":20.0},"type":"main"},{"style":"🇬🇷 그리스","name":"아브고레모노","ingredients":["닭고기","쌀","계란","레몬","소금","후추","치킨스톡"],"cookTime":30,"tags":[],"nameEn":"Avgolemono","nutrition":{"cal":190,"carb":14,"pro":13,"fat":9},"type":"main"},{"style":"🇬🇷 그리스","name":"스파나코리조","ingredients":["시금치","쌀","양파","올리브오일","레몬","딜","소금","마늘"],"cookTime":30,"tags":[],"nameEn":"Spanakorizo (Greek Spinach Rice)","nutrition":{"cal":280,"pro":6.0,"carb":44.0,"fat":8.0},"type":"main"},{"style":"🇬🇷 그리스","name":"파소울라다","ingredients":["흰강낭콩","토마토","양파","마늘","셀러리","올리브오일","오레가노","소금"],"cookTime":60,"tags":[],"nameEn":"Fasolada (Greek Bean Soup)","nutrition":{"cal":260,"pro":11.0,"carb":34.0,"fat":9.0},"type":"main"},{"style":"🇪🇸 스페인","name":"살모레호","ingredients":["토마토","바게트","마늘","올리브오일","식초","소금","계란"],"cookTime":15,"tags":[],"nameEn":"Salmorejo","nutrition":{"cal":190,"pro":4.0,"carb":18.0,"fat":11.0},"type":"main"},{"style":"🇪🇸 스페인","name":"코시도","ingredients":["소고기","돼지고기","병아리콩","당근","감자","양배추","양파","소금","후추"],"cookTime":90,"tags":[],"nameEn":"Cocido (Spanish Chickpea Stew)","nutrition":{"cal":430,"pro":26.0,"carb":28.0,"fat":24.0},"type":"main"},{"style":"🇪🇸 스페인","name":"피미엔토파드론","ingredients":["파프리카","올리브오일","소금","마늘"],"cookTime":10,"tags":[],"nameEn":"Pimientos de Padrón","nutrition":{"cal":120,"carb":8,"pro":2,"fat":9},"type":"side"},{"style":"🇪🇸 스페인","name":"하몬크로케타","ingredients":["햄","밀가루","우유","버터","계란","빵가루","식용유","소금"],"cookTime":35,"tags":[],"nameEn":"Jamón Croqueta (Ham Croquette)","nutrition":{"cal":320,"pro":8.0,"carb":26.0,"fat":20.0},"type":"main"},{"style":"🇪🇸 스페인","name":"풀포갈레가","ingredients":["문어","감자","파프리카파우더","올리브오일","소금","마늘"],"cookTime":60,"tags":[],"nameEn":"Pulpo a la Gallega","nutrition":{"cal":220,"carb":6,"pro":22,"fat":12},"type":"main"},{"style":"🇪🇸 스페인","name":"파파아루가다","ingredients":["감자","소금","올리브오일","토마토","마늘","고춧가루","식초"],"cookTime":30,"tags":[],"nameEn":"Papas Arrugadas","nutrition":{"cal":130,"carb":26,"pro":3,"fat":2},"type":"side"},{"style":"🇫🇷 프랑스","name":"카술레","ingredients":["흰강낭콩","초리소","돼지고기","베이컨","양파","마늘","토마토소스","로즈마리","타임"],"cookTime":90,"tags":[],"nameEn":"Cassoulet","nutrition":{"cal":480,"pro":28.0,"carb":32.0,"fat":26.0},"type":"main"},{"style":"🇫🇷 프랑스","name":"솔뮈니에르","ingredients":["생선","버터","레몬","파슬리","밀가루","소금","후추"],"cookTime":20,"tags":[],"nameEn":"Sole Meunière","nutrition":{"cal":280,"carb":8,"pro":22,"fat":18},"type":"main"},{"style":"🇫🇷 프랑스","name":"크레프","ingredients":["밀가루","계란","우유","버터","소금","설탕"],"cookTime":20,"tags":[],"nameEn":"Crêpe","nutrition":{"cal":190,"pro":5.0,"carb":26.0,"fat":7.0},"type":"main"},{"style":"🇫🇷 프랑스","name":"버섯벨루테","ingredients":["버섯","양파","마늘","생크림","버터","치킨스톡","소금","후추","파슬리"],"cookTime":30,"tags":[],"nameEn":"Mushroom Velouté","nutrition":{"cal":160,"pro":4.0,"carb":14.0,"fat":10.0},"type":"main"},{"style":"🇫🇷 프랑스","name":"프로방살토마토","ingredients":["토마토","마늘","올리브오일","바질","파슬리","빵가루","소금","후추"],"cookTime":25,"tags":[],"nameEn":"Tomatoes Provençale","nutrition":{"cal":110,"carb":12,"pro":2,"fat":6},"type":"side"},{"style":"🇫🇷 프랑스","name":"크림소스연어","ingredients":["연어","생크림","버터","마늘","레몬","파슬리","소금","후추","화이트와인"],"cookTime":25,"tags":[],"nameEn":"Salmon in Cream Sauce","nutrition":{"cal":420,"pro":31.0,"carb":6.0,"fat":30.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"리볼리타","ingredients":["흰강낭콩","양배추","당근","셀러리","양파","토마토","마늘","올리브오일","로즈마리","빵"],"cookTime":50,"tags":[],"nameEn":"Ribollita","nutrition":{"cal":210,"pro":8.0,"carb":28.0,"fat":7.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"아쿠아파차","ingredients":["생선","토마토","마늘","올리브","케이퍼","올리브오일","화이트와인","파슬리"],"cookTime":25,"tags":[],"nameEn":"Acqua Pazza (Italian Poached Fish)","nutrition":{"cal":220,"pro":24.0,"carb":6.0,"fat":11.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"포카치아","ingredients":["밀가루","올리브오일","소금","로즈마리","이스트","설탕","물"],"cookTime":50,"tags":[],"nameEn":"Focaccia","nutrition":{"cal":250,"pro":7.0,"carb":44.0,"fat":5.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"카포나타","ingredients":["가지","토마토","양파","올리브","케이퍼","식초","설탕","올리브오일","소금"],"cookTime":35,"tags":[],"nameEn":"Caponata","nutrition":{"cal":140,"pro":2.0,"carb":14.0,"fat":9.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"오소부코","ingredients":["소고기","양파","당근","셀러리","토마토","화이트와인","버터","마늘","로즈마리"],"cookTime":90,"tags":[],"nameEn":"Osso Buco","nutrition":{"cal":390,"pro":32.0,"carb":12.0,"fat":24.0},"type":"main"},{"style":"🌙 중동","name":"팔라펠","ingredients":["병아리콩","양파","마늘","파슬리","고수분말","커민","밀가루","소금","식용유"],"cookTime":30,"tags":[],"nameEn":"Falafel","nutrition":{"cal":330,"pro":11.0,"carb":32.0,"fat":18.0},"type":"main"},{"style":"🌙 중동","name":"샤와르마","ingredients":["닭고기","양파","토마토","마늘","커민","강황","파프리카파우더","올리브오일","피타빵"],"cookTime":35,"tags":[],"nameEn":"Shawarma","nutrition":{"cal":490,"pro":28.0,"carb":42.0,"fat":22.0},"type":"main"},{"style":"🌙 중동","name":"타불레","ingredients":["불구르","토마토","오이","파슬리","양파","레몬","올리브오일","소금"],"cookTime":20,"tags":["헬시"],"nameEn":"Tabbouleh","nutrition":{"cal":160,"pro":4.0,"carb":21.0,"fat":7.0},"type":"main"},{"style":"🌙 중동","name":"키베","ingredients":["양고기","불구르","양파","소나무잣","커민","계피","올리브오일","소금","후추"],"cookTime":45,"tags":[],"nameEn":"Kibbeh","nutrition":{"cal":340,"pro":18.0,"carb":22.0,"fat":20.0},"type":"main"},{"style":"🌙 중동","name":"만사프","ingredients":["양고기","쌀","요거트","버터","아몬드","잣","소금","강황","커민"],"cookTime":90,"tags":[],"nameEn":"Mansaf (Jordanian Lamb and Rice)","nutrition":{"cal":640,"pro":34.0,"carb":78.0,"fat":22.0},"type":"main"},{"style":"한식","name":"홍합탕","ingredients":["홍합","대파","마늘","청양고추","소금","물"],"cookTime":20,"tags":[],"nameEn":"Mussel Soup","nutrition":{"cal":90,"pro":12.0,"carb":6.0,"fat":2.0},"type":"main"},{"style":"한식","name":"바지락탕","ingredients":["바지락","대파","마늘","소금","물","청양고추"],"cookTime":15,"tags":[],"nameEn":"Clam Soup","nutrition":{"cal":70,"pro":10.0,"carb":3.0,"fat":1.5},"type":"main"},{"style":"한식","name":"꼬리곰탕","ingredients":["소꼬리","대파","마늘","소금","후추","물"],"cookTime":120,"tags":[],"nameEn":"Oxtail Soup","nutrition":{"cal":320,"pro":34.0,"carb":4.0,"fat":19.0},"type":"main"},{"style":"한식","name":"우거지해장국","ingredients":["우거지","돼지고기","된장","고춧가루","대파","마늘","소금"],"cookTime":40,"tags":[],"nameEn":"Dried Cabbage Hangover Soup","nutrition":{"cal":190,"pro":13.0,"carb":18.0,"fat":7.0},"type":"main"},{"style":"한식","name":"냉이된장국","ingredients":["냉이","된장","멸치육수","두부","마늘","대파"],"cookTime":20,"tags":[],"nameEn":"Shepherd's Purse Doenjang Soup","nutrition":{"cal":60,"pro":4.0,"carb":6.0,"fat":2.0},"type":"main"},{"style":"한식","name":"쑥된장국","ingredients":["쑥","된장","멸치육수","두부","마늘","소금"],"cookTime":20,"tags":[],"nameEn":"Mugwort Doenjang Soup","nutrition":{"cal":60,"pro":4.0,"carb":7.0,"fat":1.5},"type":"main"},{"style":"한식","name":"무조림","ingredients":["무","간장","설탕","마늘","대파","참기름","고춧가루","물엿"],"cookTime":25,"tags":[],"nameEn":"Braised Radish","nutrition":{"cal":60,"pro":1.0,"carb":9.0,"fat":2.2},"type":"side"},{"style":"한식","name":"연근조림","ingredients":["연근","간장","설탕","물엿","깨","참기름","식용유"],"cookTime":25,"tags":[],"nameEn":"Braised Lotus Root","nutrition":{"cal":75,"pro":2.0,"carb":16.0,"fat":0.5},"type":"side"},{"style":"한식","name":"우엉조림","ingredients":["우엉","간장","설탕","미림","참기름","깨","식용유"],"cookTime":25,"tags":[],"nameEn":"Braised Burdock Root","nutrition":{"cal":55,"pro":1.0,"carb":11.0,"fat":1.0},"type":"side"},{"style":"한식","name":"더덕구이","ingredients":["더덕","고추장","간장","꿀","마늘","참기름","설탕"],"cookTime":20,"tags":[],"nameEn":"Grilled Deodeok Root","nutrition":{"cal":110,"pro":2.0,"carb":18.0,"fat":3.5},"type":"main"},{"style":"한식","name":"꽁치조림","ingredients":["꽁치","무","간장","고춧가루","마늘","대파","설탕","생강"],"cookTime":30,"tags":[],"nameEn":"Braised Saury","nutrition":{"cal":280,"pro":22.0,"carb":10.0,"fat":16.0},"type":"main"},{"style":"한식","name":"꽁치김치찌개","ingredients":["꽁치","김치","두부","대파","고춧가루","간장","마늘"],"cookTime":25,"tags":[],"nameEn":"Saury and Kimchi Stew","nutrition":{"cal":290,"pro":24.0,"carb":9.0,"fat":17.0},"type":"main"},{"style":"한식","name":"소고기죽","ingredients":["소고기","쌀","참기름","국간장","마늘","소금"],"cookTime":45,"tags":[],"nameEn":"Beef Porridge","nutrition":{"cal":240,"pro":12.0,"carb":38.0,"fat":4.5},"type":"main"},{"style":"한식","name":"소고기덮밥","ingredients":["소고기","쌀","양파","간장","설탕","참기름","계란","대파"],"cookTime":20,"tags":[],"nameEn":"Beef Rice Bowl","nutrition":{"cal":560,"pro":24.0,"carb":76.0,"fat":17.0},"type":"main"},{"style":"한식","name":"계란덮밥","ingredients":["계란","쌀","간장","참기름","대파","소금","설탕"],"cookTime":15,"tags":[],"nameEn":"Egg Rice Bowl","nutrition":{"cal":430,"pro":14.0,"carb":68.0,"fat":11.0},"type":"main"},{"style":"한식","name":"낙지덮밥","ingredients":["낙지","쌀","고추장","간장","마늘","대파","참기름","설탕"],"cookTime":20,"tags":[],"nameEn":"Spicy Octopus Rice Bowl","nutrition":{"cal":490,"pro":22.0,"carb":82.0,"fat":8.0},"type":"main"},{"style":"한식","name":"참치마요덮밥","ingredients":["참치캔","쌀","마요네즈","간장","깨","대파","고춧가루"],"cookTime":10,"tags":[],"nameEn":"Tuna Mayo Rice Bowl","nutrition":{"cal":620,"pro":16.0,"carb":85.0,"fat":24.0},"type":"main"},{"style":"한식","name":"오삼불고기","ingredients":["오징어","삼겹살","양파","대파","고추장","고춧가루","마늘","설탕","참기름"],"cookTime":25,"tags":[],"nameEn":"Spicy Pork and Squid Stir-fry","nutrition":{"cal":340,"pro":24.0,"carb":11.0,"fat":22.0},"type":"main"},{"style":"한식","name":"두부김치","ingredients":["두부","김치","돼지고기","참기름","식용유","소금"],"cookTime":15,"tags":[],"nameEn":"Tofu with Kimchi","nutrition":{"cal":220,"pro":16.0,"carb":10.0,"fat":13.0},"type":"side"},{"style":"한식","name":"돼지고기깻잎볶음","ingredients":["돼지고기","깻잎","마늘","간장","설탕","참기름","식용유"],"cookTime":15,"tags":[],"nameEn":"Stir-fried Pork with Perilla Leaves","nutrition":{"cal":340,"pro":25.0,"carb":10.0,"fat":22.0},"type":"side"},{"style":"한식","name":"소고기볶음","ingredients":["소고기","양파","파프리카","간장","마늘","참기름","설탕","식용유"],"cookTime":15,"tags":[],"nameEn":"Stir-fried Beef","nutrition":{"cal":320,"pro":26.0,"carb":10.0,"fat":19.0},"type":"side"},{"style":"한식","name":"호박전","ingredients":["애호박","계란","밀가루","소금","식용유"],"cookTime":15,"tags":[],"nameEn":"Zucchini Pancake","nutrition":{"cal":120,"pro":3.0,"carb":14.0,"fat":6.0},"type":"side"},{"style":"한식","name":"버섯전","ingredients":["버섯","계란","밀가루","소금","식용유","부추"],"cookTime":20,"tags":[],"nameEn":"Mushroom Pancake","nutrition":{"cal":170,"pro":4.0,"carb":16.0,"fat":10.0},"type":"side"},{"style":"한식","name":"육전","ingredients":["소고기","계란","밀가루","소금","식용유","후추"],"cookTime":20,"tags":[],"nameEn":"Yukjeon (Pan-fried Beef)","nutrition":{"cal":260,"pro":21.0,"carb":6.0,"fat":17.0},"type":"side"},{"style":"한식","name":"빈대떡","ingredients":["녹두","돼지고기","숙주","김치","계란","식용유","소금"],"cookTime":30,"tags":[],"nameEn":"Bindaetteok (Mung Bean Pancake)","nutrition":{"cal":290,"pro":10.0,"carb":30.0,"fat":14.0},"type":"main"},{"style":"한식","name":"무나물","ingredients":["무","마늘","간장","참기름","깨","식용유","소금"],"cookTime":15,"tags":[],"nameEn":"Seasoned Radish","nutrition":{"cal":35,"pro":0.8,"carb":4.0,"fat":1.8},"type":"side"},{"style":"한식","name":"호박나물","ingredients":["애호박","마늘","간장","참기름","깨","식용유"],"cookTime":15,"tags":[],"nameEn":"Seasoned Zucchini","nutrition":{"cal":30,"pro":1.0,"carb":4.0,"fat":1.0},"type":"side"},{"style":"한식","name":"숙주나물","ingredients":["숙주","마늘","참기름","소금","깨"],"cookTime":10,"tags":[],"nameEn":"Seasoned Bean Sprouts","nutrition":{"cal":30,"pro":1.5,"carb":3.0,"fat":1.2},"type":"side"},{"style":"한식","name":"미역줄기볶음","ingredients":["미역줄기","마늘","간장","참기름","식용유","깨"],"cookTime":15,"tags":[],"nameEn":"Stir-fried Seaweed Stems","nutrition":{"cal":45,"pro":1.2,"carb":4.0,"fat":2.8},"type":"side"},{"style":"한식","name":"깻잎무침","ingredients":["깻잎","간장","마늘","고춧가루","참기름","깨","설탕","식초"],"cookTime":10,"tags":[],"nameEn":"Seasoned Perilla Leaves","nutrition":{"cal":25,"pro":1.5,"carb":3.0,"fat":0.8},"type":"side"},{"style":"한식","name":"삼겹살구이","ingredients":["삼겹살","마늘","상추","쌈장","깻잎","양파"],"cookTime":20,"tags":[],"nameEn":"Grilled Pork Belly (Samgyeopsal)","nutrition":{"cal":490,"carb":0,"pro":26,"fat":43},"type":"main"},{"style":"한식","name":"목살구이","ingredients":["목살","마늘","간장","참기름","상추","쌈장","양파"],"cookTime":20,"tags":[],"nameEn":"Grilled Pork Neck","nutrition":{"cal":360,"carb":0,"pro":28,"fat":27},"type":"main"},{"style":"한식","name":"막국수","ingredients":["메밀면","오이","당근","계란","식초","설탕","간장","참기름","깨"],"cookTime":20,"tags":[],"nameEn":"Makguksu (Buckwheat Noodles)","nutrition":{"cal":460,"pro":12.0,"carb":85.0,"fat":6.0},"type":"main"},{"style":"한식","name":"콩나물국밥","ingredients":["콩나물","쌀","계란","소금","대파","국간장","새우젓"],"cookTime":25,"tags":["헬시"],"nameEn":"Bean Sprout Rice Soup","nutrition":{"cal":320,"pro":11.0,"carb":62.0,"fat":3.0},"type":"main"},{"style":"한식","name":"도토리묵무침","ingredients":["도토리묵","오이","당근","간장","참기름","마늘","고춧가루","깨","식초"],"cookTime":15,"tags":[],"nameEn":"Seasoned Acorn Jelly","nutrition":{"cal":120,"pro":2.0,"carb":14.0,"fat":6.0},"type":"side"},{"style":"한식","name":"감자수제비","ingredients":["감자","밀가루","애호박","된장","멸치육수","대파","마늘"],"cookTime":35,"tags":[],"nameEn":"Potato Sujebi (Hand-torn Noodle Soup)","nutrition":{"cal":440,"pro":12.0,"carb":88.0,"fat":4.0},"type":"main"},{"style":"한식","name":"해물잡채","ingredients":["당면","새우","오징어","양파","시금치","당근","간장","참기름","설탕","식용유"],"cookTime":30,"tags":[],"nameEn":"Seafood Japchae","nutrition":{"cal":230,"pro":7.0,"carb":32.0,"fat":8.0},"type":"main"},{"style":"한식","name":"아귀찜","ingredients":["아귀","콩나물","미나리","고춧가루","마늘","간장","생강","대파"],"cookTime":35,"tags":[],"nameEn":"Braised Monkfish","nutrition":{"cal":210,"pro":26.0,"carb":12.0,"fat":5.0},"type":"main"},{"style":"한식","name":"팥죽","ingredients":["팥","찹쌀","설탕","소금","물"],"cookTime":60,"tags":[],"nameEn":"Patjuk (Red Bean Porridge)","nutrition":{"cal":320,"pro":9.0,"carb":66.0,"fat":2.0},"type":"main"},{"style":"한식","name":"순대국밥","ingredients":["순대","콩나물","대파","국간장","새우젓","소금","후추"],"cookTime":25,"tags":[],"nameEn":"Sundae Gukbap (Blood Sausage Rice Soup)","nutrition":{"cal":480,"pro":26.0,"carb":52.0,"fat":18.0},"type":"main"},{"style":"일식","name":"타마고산도","ingredients":["계란","식빵","마요네즈","겨자","설탕","소금","버터"],"cookTime":15,"tags":["브런치"],"nameEn":"Tamago Sando (Egg Sandwich)","nutrition":{"cal":390,"pro":11.0,"carb":38.0,"fat":22.0},"type":"main"},{"style":"일식","name":"규나베","ingredients":["소고기","두부","배추","버섯","대파","미소된장","미림","다시","버터"],"cookTime":30,"tags":[],"nameEn":"Gyunabe (Beef Hot Pot)","nutrition":{"cal":390,"pro":28.0,"carb":14.0,"fat":25.0},"type":"main"},{"style":"일식","name":"에비텐동","ingredients":["새우","쌀","밀가루","계란","전분","간장","미림","다시","식용유"],"cookTime":30,"tags":[],"nameEn":"Ebi Tendon (Shrimp Tempura Rice Bowl)","nutrition":{"cal":620,"pro":18.0,"carb":82.0,"fat":24.0},"type":"main"},{"style":"일식","name":"가이센동","ingredients":["쌀","새우","오징어","가리비","연어","간장","미림","참기름","와사비"],"cookTime":25,"tags":[],"nameEn":"Kaisen don","nutrition":{"cal":600,"pro":41.0,"carb":62.0,"fat":20.0},"type":"main"},{"style":"일식","name":"미소버터라멘","ingredients":["라면","돼지고기","버터","미소된장","마늘","대파","숙주","계란"],"cookTime":25,"tags":[],"nameEn":"Miso Butter Ramen","nutrition":{"cal":590,"pro":19.0,"carb":76.0,"fat":23.0},"type":"main"},{"style":"일식","name":"부타네기야키","ingredients":["돼지고기","대파","간장","미림","설탕","생강","식용유"],"cookTime":20,"tags":[],"nameEn":"Buta Negi Yaki (Pork and Green Onion Grill)","nutrition":{"cal":320,"pro":22.0,"carb":6.0,"fat":23.0},"type":"main"},{"style":"일식","name":"아지후라이","ingredients":["고등어","밀가루","계란","빵가루","식용유","소금","후추","레몬"],"cookTime":20,"tags":[],"nameEn":"Aji Furai (Fried Horse Mackerel)","nutrition":{"cal":290,"pro":18.0,"carb":16.0,"fat":18.0},"type":"main"},{"style":"중식","name":"부추계란볶음","ingredients":["부추","계란","마늘","소금","식용유","참기름"],"cookTime":10,"tags":[],"nameEn":"Chive and Egg Stir-fry","nutrition":{"cal":165,"pro":10.0,"carb":4.0,"fat":12.0},"type":"side"},{"style":"중식","name":"피단두부무침","ingredients":["두부","계란","간장","참기름","마늘","고추기름","대파","설탕"],"cookTime":10,"tags":[],"nameEn":"Century Egg and Tofu","nutrition":{"cal":180,"pro":14.0,"carb":8.0,"fat":10.0},"type":"side"},{"style":"중식","name":"마라라면","ingredients":["라면","돼지고기","두반장","마늘","생강","마라소스","숙주","대파"],"cookTime":20,"tags":[],"nameEn":"Mala Ramen","nutrition":{"cal":540,"pro":11.0,"carb":78.0,"fat":20.0},"type":"main"},{"style":"중식","name":"광동식볶음밥","ingredients":["쌀","계란","새우","대파","간장","굴소스","참기름","식용유","소금"],"cookTime":15,"tags":[],"nameEn":"Cantonese Fried Rice","nutrition":{"cal":430,"pro":13.0,"carb":68.0,"fat":12.0},"type":"main"},{"style":"중식","name":"파기름파스타","ingredients":["중면","대파","간장","굴소스","참기름","식용유","설탕","마늘"],"cookTime":15,"tags":[],"nameEn":"Scallion Oil Pasta","nutrition":{"cal":440,"pro":9.0,"carb":64.0,"fat":16.0},"type":"main"},{"style":"중식","name":"중식만두전골","ingredients":["만두","배추","당면","두부","대파","간장","참기름","육수","고춧가루"],"cookTime":25,"tags":[],"nameEn":"Chinese-style Dumpling Hot Pot","nutrition":{"cal":380,"pro":19.0,"carb":34.0,"fat":19.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"아보카도크림파스타","ingredients":["스파게티","아보카도","생크림","마늘","레몬","파마산치즈","올리브오일","소금"],"cookTime":20,"tags":[],"nameEn":"Avocado Cream Pasta","nutrition":{"cal":560,"pro":12.0,"carb":68.0,"fat":28.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"훈제연어파스타","ingredients":["스파게티","연어","생크림","케이퍼","양파","마늘","레몬","파마산치즈"],"cookTime":20,"tags":[],"nameEn":"Smoked Salmon Pasta","nutrition":{"cal":560,"pro":24.0,"carb":66.0,"fat":21.0},"type":"main"},{"style":"🇬🇧 영국","name":"치킨팟파이","ingredients":["닭고기","당근","감자","양파","버터","밀가루","우유","생크림","소금","후추"],"cookTime":50,"tags":[],"nameEn":"Chicken Pot Pie","nutrition":{"cal":540,"pro":19.0,"carb":41.0,"fat":34.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"폴렌타","ingredients":["옥수수가루","버터","파마산치즈","우유","소금","후추"],"cookTime":30,"tags":[],"nameEn":"Polenta","nutrition":{"cal":150,"pro":4.0,"carb":28.0,"fat":2.0},"type":"main"},{"style":"🇺🇸 미국","name":"치킨시저랩","ingredients":["또띠아","닭가슴살","로메인","파마산치즈","마요네즈","레몬","마늘","앤초비"],"cookTime":20,"tags":[],"nameEn":"Chicken Caesar Wrap","nutrition":{"cal":530,"pro":26.0,"carb":36.0,"fat":31.0},"type":"main"},{"style":"🇹🇭 태국","name":"카오니아우마무앙","ingredients":["찹쌀","코코넛밀크","설탕","소금","망고"],"cookTime":35,"tags":[],"nameEn":"Khao Niao Mamuang","nutrition":{"cal":480,"carb":88,"pro":5,"fat":12},"type":"side"},{"style":"🇹🇭 태국","name":"얌탈레","ingredients":["새우","오징어","홍합","레몬그라스","라임","피시소스","고춧가루","마늘","고수"],"cookTime":20,"tags":[],"nameEn":"Yam Talay (Thai Seafood Salad)","nutrition":{"cal":220,"pro":16.0,"carb":18.0,"fat":9.0},"type":"main"},{"style":"🇹🇭 태국","name":"칸톰카이","ingredients":["쌀","닭고기","생강","피시소스","소금","대파","마늘","후추"],"cookTime":35,"tags":[],"nameEn":"Kai Tom","nutrition":{"cal":290,"carb":11,"pro":16,"fat":21},"type":"main"},{"style":"🇹🇭 태국","name":"팟팟카나","ingredients":["브로콜리","새우","마늘","굴소스","간장","설탕","식용유","고춧가루"],"cookTime":10,"tags":[],"nameEn":"Phat Khana","nutrition":{"cal":95,"carb":7,"pro":4,"fat":6},"type":"side"},{"style":"🇻🇳 베트남","name":"고이가","ingredients":["닭가슴살","양배추","당근","양파","고수","땅콩","피시소스","라임","설탕","고춧가루"],"cookTime":25,"tags":[],"nameEn":"Goi Ga (Vietnamese Chicken Salad)","nutrition":{"cal":180,"pro":22.0,"carb":8.0,"fat":7.0},"type":"main"},{"style":"🇻🇳 베트남","name":"쌀국수볶음","ingredients":["쌀국수","소고기","숙주","대파","굴소스","피시소스","마늘","식용유"],"cookTime":20,"tags":[],"nameEn":"Stir-fried Rice Noodles","nutrition":{"cal":490,"pro":15.0,"carb":74.0,"fat":14.0},"type":"main"},{"style":"🇻🇳 베트남","name":"반팃느엉","ingredients":["바게트","돼지고기","당근","오이","고수","마요네즈","피시소스","마늘","라임"],"cookTime":25,"tags":[],"nameEn":"Banh Thit Nuong (Vietnamese Grilled Pork Sandwich)","nutrition":{"cal":490,"pro":22.0,"carb":68.0,"fat":14.0},"type":"main"},{"style":"🇻🇳 베트남","name":"생선국수","ingredients":["쌀국수","생선","레몬그라스","생강","피시소스","라임","고수","숙주"],"cookTime":40,"tags":[],"nameEn":"Fish Noodle Soup","nutrition":{"cal":380,"pro":22.0,"carb":64.0,"fat":4.0},"type":"main"},{"style":"🇮🇳 인도","name":"고아피시커리","ingredients":["생선","코코넛밀크","타마린드","마늘","생강","강황","고춧가루","커민","소금"],"cookTime":30,"tags":[],"nameEn":"Goan Fish Curry","nutrition":{"cal":290,"carb":11,"pro":21,"fat":17},"type":"main"},{"style":"🇮🇳 인도","name":"팬니르도피아자","ingredients":["파니르","양파","마늘","생강","토마토","가람마살라","커민","강황","버터"],"cookTime":35,"tags":[],"nameEn":"Paneer Do Pyaza","nutrition":{"cal":340,"carb":12,"pro":14,"fat":26},"type":"main"},{"style":"🇮🇳 인도","name":"암리차리컬차","ingredients":["병아리콩","양파","마늘","강황","고수분말","커민","가람마살라","버터","소금"],"cookTime":30,"tags":[],"nameEn":"Amritsari Kulcha","nutrition":{"cal":380,"carb":56,"pro":8,"fat":14},"type":"main"},{"style":"🇮🇳 인도","name":"케랄라새우커리","ingredients":["새우","코코넛밀크","양파","토마토","마늘","생강","강황","고춧가루","커리가루"],"cookTime":25,"tags":[],"nameEn":"Kerala Prawn Curry","nutrition":{"cal":320,"pro":22.0,"carb":12.0,"fat":21.0},"type":"main"},{"style":"일식","name":"두부스테이크테리야키","ingredients":["두부","간장","미림","설탕","생강","마늘","참기름","식용유","깨"],"cookTime":20,"tags":["헬시"],"nameEn":"Tofu Steak Teriyaki","nutrition":{"cal":215,"pro":13.0,"carb":16.0,"fat":11.0},"type":"main"},{"style":"한식","name":"현미채소볶음밥","ingredients":["현미","계란","당근","양파","브로콜리","간장","참기름","마늘","식용유"],"cookTime":20,"tags":["헬시"],"nameEn":"Brown Rice Vegetable Fried Rice","nutrition":{"cal":460,"pro":9.0,"carb":74.0,"fat":12.0},"type":"main"},{"style":"한식","name":"닭가슴살채소볶음밥","ingredients":["쌀","닭가슴살","브로콜리","당근","양파","간장","굴소스","마늘","식용유"],"cookTime":20,"tags":["헬시"],"nameEn":"Chicken Breast Vegetable Fried Rice","nutrition":{"cal":410,"pro":24.0,"carb":65.0,"fat":6.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"칠레아도보","ingredients":["닭고기","고춧가루","커민","오레가노","식초","마늘","소금","올리브오일"],"cookTime":40,"tags":[],"nameEn":"Chile Adobo","nutrition":{"cal":390,"pro":31.0,"carb":7.0,"fat":26.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"소파데피데오","ingredients":["소면","토마토","양파","마늘","치킨스톡","고춧가루","소금","식용유"],"cookTime":25,"tags":[],"nameEn":"Sopa de Fideo (Mexican Noodle Soup)","nutrition":{"cal":240,"pro":8.0,"carb":34.0,"fat":8.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"멕시코식타말","ingredients":["옥수수가루","닭고기","고춧가루","커민","버터","마늘","소금","치킨스톡"],"cookTime":60,"tags":[],"nameEn":"Mexican Tamales","nutrition":{"cal":280,"carb":28,"pro":9,"fat":15},"type":"main"},{"style":"🇮🇩 인도네시아","name":"아얌세리","ingredients":["닭고기","코코넛밀크","레몬그라스","강황","마늘","생강","팜슈가","소금"],"cookTime":40,"tags":[],"nameEn":"Ayam Seri","nutrition":{"cal":330,"pro":24.0,"carb":8.0,"fat":22.0},"type":"main"},{"style":"🇮🇩 인도네시아","name":"페센베크","ingredients":["소고기","두반장","마늘","강황","커민","고수분말","식용유","소금","케찹마니스"],"cookTime":35,"tags":[],"nameEn":"Fesenjān (Persian Walnut and Pomegranate Stew)","nutrition":{"cal":440,"pro":26.0,"carb":24.0,"fat":28.0},"type":"main"},{"style":"🇮🇩 인도네시아","name":"사유르아삼","ingredients":["당근","양배추","강낭콩","옥수수","타마린드","마늘","생강","소금","설탕"],"cookTime":25,"tags":[],"nameEn":"Sayur Asem","nutrition":{"cal":120,"carb":18,"pro":3,"fat":4},"type":"main"},{"style":"🇲🇾 말레이시아","name":"아삼프라이드치킨","ingredients":["닭고기","타마린드","강황","고춧가루","마늘","소금","설탕","식용유"],"cookTime":35,"tags":[],"nameEn":"Asam Fried Chicken","nutrition":{"cal":360,"carb":11,"pro":28,"fat":22},"type":"main"},{"style":"🇲🇾 말레이시아","name":"나시머냑","ingredients":["쌀","버터","마늘","양파","계피","팔각","카레가루","소금"],"cookTime":30,"tags":[],"nameEn":"Nasi Minyak","nutrition":{"cal":360,"carb":68,"pro":6,"fat":7},"type":"main"},{"style":"🇲🇾 말레이시아","name":"이칸페프리","ingredients":["고등어","고춧가루","마늘","생강","강황","소금","라임","식용유"],"cookTime":20,"tags":[],"nameEn":"Ikan Peperi (Peppered Fish)","nutrition":{"cal":170,"pro":24.0,"carb":3.0,"fat":7.0},"type":"main"},{"style":"🇵🇭 필리핀","name":"이나살","ingredients":["닭고기","식초","마늘","레몬","강황","생강","소금","식용유"],"cookTime":35,"tags":[],"nameEn":"Inasal (Filipino Grilled Chicken)","nutrition":{"cal":360,"pro":32.0,"carb":3.0,"fat":24.0},"type":"main"},{"style":"🇵🇭 필리핀","name":"크리스피파타","ingredients":["삼겹살","소금","식초","마늘","월계수잎","후추","식용유"],"cookTime":90,"tags":[],"nameEn":"Crispy Pata (Filipino Crispy Pork Knuckle)","nutrition":{"cal":820,"pro":64.0,"carb":2.0,"fat":62.0},"type":"main"},{"style":"🇵🇭 필리핀","name":"판싯바하이","ingredients":["소면","닭고기","당근","양배추","간장","굴소스","마늘","양파"],"cookTime":25,"tags":[],"nameEn":"Pancit Bahay","nutrition":{"cal":410,"carb":56,"pro":15,"fat":13},"type":"main"},{"style":"🇹🇷 터키","name":"메르지메크수프","ingredients":["렌틸콩","양파","마늘","커민","강황","버터","소금","레몬","파프리카파우더"],"cookTime":35,"tags":[],"nameEn":"Mercimek Çorbası","nutrition":{"cal":180,"carb":24,"pro":10,"fat":5},"type":"main"},{"style":"🇹🇷 터키","name":"카부르가","ingredients":["소갈비","양파","토마토","파프리카","마늘","타임","올리브오일","소금"],"cookTime":90,"tags":[],"nameEn":"Kaburga","nutrition":{"cal":580,"carb":0,"pro":38,"fat":48},"type":"main"},{"style":"🇹🇷 터키","name":"타쉬쾨프테","ingredients":["소고기","양파","마늘","토마토소스","커민","파프리카파우더","계란","빵가루","소금"],"cookTime":35,"tags":[],"nameEn":"Taş Köfte","nutrition":{"cal":360,"pro":22.0,"carb":12.0,"fat":24.0},"type":"main"},{"style":"🇸🇬 싱가포르","name":"비가탄면","ingredients":["중면","새우","오징어","숙주","계란","간장","굴소스","마늘","식용유"],"cookTime":20,"tags":[],"nameEn":"Binatog (Filipino Corn Snack)","nutrition":{"cal":560,"pro":18.0,"carb":75.0,"fat":21.0},"type":"main"},{"style":"🇸🇬 싱가포르","name":"찐호키엔미","ingredients":["중면","새우","돼지고기","숙주","계란","간장","굴소스","마늘","다시"],"cookTime":25,"tags":[],"nameEn":"Steam Hokkien Mee","nutrition":{"cal":520,"carb":72,"pro":18,"fat":18},"type":"main"},{"style":"🇸🇬 싱가포르","name":"체가이볶음면","ingredients":["중면","닭고기","양배추","당근","굴소스","간장","참기름","마늘","식용유"],"cookTime":20,"tags":[],"nameEn":"Che Kai Stir-fried Noodles","nutrition":{"cal":460,"pro":11.0,"carb":72.0,"fat":14.0},"type":"main"},{"style":"🇬🇷 그리스","name":"아고우렐라이오","ingredients":["올리브오일","마늘","레몬","오레가노","소금","후추","토마토"],"cookTime":10,"tags":[],"nameEn":"Agourelaio","nutrition":{"cal":220,"carb":4,"pro":1,"fat":24},"type":"side"},{"style":"🇬🇷 그리스","name":"프라이드피타","ingredients":["피타빵","올리브오일","마늘","오레가노","소금","레몬"],"cookTime":10,"tags":[],"nameEn":"Fried Pita","nutrition":{"cal":220,"pro":4.0,"carb":32.0,"fat":8.0},"type":"main"},{"style":"🇪🇸 스페인","name":"소파카스텔야나","ingredients":["빵","마늘","올리브오일","계란","소금","파프리카파우더","파슬리"],"cookTime":20,"tags":[],"nameEn":"Sopa Castellana","nutrition":{"cal":160,"carb":14,"pro":6,"fat":9},"type":"main"},{"style":"🇪🇸 스페인","name":"아호블랑코","ingredients":["바게트","아몬드","마늘","올리브오일","식초","소금","포도"],"cookTime":15,"tags":[],"nameEn":"Ajo Blanco (Spanish White Gazpacho)","nutrition":{"cal":240,"pro":4.0,"carb":14.0,"fat":19.0},"type":"main"},{"style":"🇫🇷 프랑스","name":"니스스타일피자","ingredients":["밀가루","양파","앤초비","올리브","토마토","올리브오일","소금","이스트"],"cookTime":40,"tags":[],"nameEn":"Nice-style Pizza (Pissaladière)","nutrition":{"cal":390,"pro":14.0,"carb":40.0,"fat":19.0},"type":"main"},{"style":"🇫🇷 프랑스","name":"쿠르제트수프","ingredients":["애호박","양파","마늘","생크림","치킨스톡","버터","소금","후추","바질"],"cookTime":25,"tags":[],"nameEn":"Courgette Soup (Zucchini Soup)","nutrition":{"cal":130,"pro":3.0,"carb":11.0,"fat":9.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"살팀보카","ingredients":["돼지고기","버터","화이트와인","마늘","세이지","소금","후추","올리브오일"],"cookTime":20,"tags":[],"nameEn":"Saltimbocca","nutrition":{"cal":360,"pro":28.0,"carb":4.0,"fat":25.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"시칠리아파스타","ingredients":["스파게티","선드라이토마토","케이퍼","앤초비","마늘","올리브오일","소금","파슬리"],"cookTime":25,"tags":[],"nameEn":"Sicilian Pasta","nutrition":{"cal":480,"pro":12.0,"carb":68.0,"fat":16.0},"type":"main"},{"style":"🌙 중동","name":"마클루베","ingredients":["쌀","닭고기","가지","토마토","양파","마늘","커민","강황","계피","버터"],"cookTime":60,"tags":[],"nameEn":"Maqluba (Upside-down Rice)","nutrition":{"cal":540,"pro":24.0,"carb":75.0,"fat":16.0},"type":"main"},{"style":"🌙 중동","name":"머제타이스","ingredients":["렌틸콩","쌀","양파","올리브오일","커민","소금","후추"],"cookTime":35,"tags":[],"nameEn":"Mezethes","nutrition":{"cal":340,"carb":12,"pro":22,"fat":22},"type":"side"},{"style":"한식","name":"장어구이","ingredients":["장어","간장","마늘","생강","미림","설탕","참기름"],"cookTime":30,"tags":[],"nameEn":"Grilled Eel","nutrition":{"cal":320,"pro":27.0,"carb":11.0,"fat":19.0},"type":"main"},{"style":"한식","name":"돼지국밥","ingredients":["돼지고기","쌀","대파","소금","후추","새우젓","마늘"],"cookTime":60,"tags":[],"nameEn":"Pork Rice Soup","nutrition":{"cal":450,"pro":28.0,"carb":45.0,"fat":18.0},"type":"main"},{"style":"한식","name":"쟁반국수","ingredients":["소면","오이","당근","계란","고추장","식초","설탕","참기름","깨"],"cookTime":20,"tags":[],"nameEn":"Tray Noodles","nutrition":{"cal":490,"pro":15.0,"carb":88.0,"fat":9.0},"type":"main"},{"style":"한식","name":"어묵국","ingredients":["어묵","대파","간장","소금","다시마","청양고추"],"cookTime":15,"tags":[],"nameEn":"Fish Cake Soup","nutrition":{"cal":90,"pro":7.0,"carb":8.0,"fat":3.5},"type":"main"},{"style":"한식","name":"떡갈비","ingredients":["소고기","돼지고기","양파","간장","설탕","참기름","마늘","밀가루"],"cookTime":25,"tags":[],"nameEn":"Tteokgalbi (Grilled Meat Patties)","nutrition":{"cal":320,"pro":22.0,"carb":14.0,"fat":20.0},"type":"main"},{"style":"한식","name":"곱창볶음","ingredients":["곱창","양파","대파","고추장","고춧가루","마늘","설탕","참기름","식용유"],"cookTime":25,"tags":[],"nameEn":"Stir-fried Beef Intestines","nutrition":{"cal":430,"pro":20.0,"carb":12.0,"fat":34.0},"type":"main"},{"style":"한식","name":"순대볶음","ingredients":["순대","김치","양파","대파","고추장","고춧가루","참기름","식용유"],"cookTime":20,"tags":[],"nameEn":"Stir-fried Sundae","nutrition":{"cal":390,"pro":14.0,"carb":42.0,"fat":18.0},"type":"main"},{"style":"한식","name":"열무비빔밥","ingredients":["쌀","열무","고추장","참기름","마늘","계란","오이"],"cookTime":20,"tags":[],"nameEn":"Young Radish Bibimbap","nutrition":{"cal":490,"pro":12.0,"carb":84.0,"fat":11.0},"type":"main"},{"style":"한식","name":"오이냉국","ingredients":["오이","식초","설탕","소금","마늘","실파","고춧가루","깨"],"cookTime":10,"tags":[],"nameEn":"Cold Cucumber Soup","nutrition":{"cal":30,"pro":1.0,"carb":6.0,"fat":0.2},"type":"main"},{"style":"한식","name":"미역냉국","ingredients":["미역","오이","식초","설탕","소금","마늘","깨"],"cookTime":10,"tags":[],"nameEn":"Cold Seaweed Soup","nutrition":{"cal":35,"pro":1.0,"carb":6.0,"fat":0.5},"type":"main"},{"style":"한식","name":"불고기전골","ingredients":["소고기","두부","버섯","양파","당면","대파","간장","설탕","참기름","육수"],"cookTime":30,"tags":[],"nameEn":"Bulgogi Hot Pot","nutrition":{"cal":290,"pro":24.0,"carb":16.0,"fat":14.0},"type":"main"},{"style":"한식","name":"해물전골","ingredients":["새우","오징어","홍합","두부","배추","대파","고추장","멸치육수","마늘"],"cookTime":30,"tags":[],"nameEn":"Seafood Hot Pot","nutrition":{"cal":260,"pro":28.0,"carb":14.0,"fat":10.0},"type":"main"},{"style":"한식","name":"들깨칼국수","ingredients":["칼국수면","들깨가루","멸치육수","애호박","대파","감자","마늘"],"cookTime":25,"tags":[],"nameEn":"Perilla Seed Knife-cut Noodle Soup","nutrition":{"cal":480,"pro":13.0,"carb":78.0,"fat":12.0},"type":"main"},{"style":"한식","name":"비지찌개","ingredients":["비지","돼지고기","김치","된장","대파","마늘","소금"],"cookTime":25,"tags":[],"nameEn":"Biji Jjigae (Soybean Pulp Stew)","nutrition":{"cal":210,"pro":14.0,"carb":10.0,"fat":12.0},"type":"main"},{"style":"한식","name":"산채비빔밥","ingredients":["쌀","취나물","고사리","도라지","시금치","계란","고추장","참기름"],"cookTime":30,"tags":[],"nameEn":"Wild Greens Bibimbap","nutrition":{"cal":480,"pro":14.0,"carb":82.0,"fat":9.0},"type":"main"},{"style":"한식","name":"육회비빔밥","ingredients":["쌀","소고기","계란","배","마늘","간장","참기름","깨","설탕"],"cookTime":20,"tags":[],"nameEn":"Yukhoe Bibimbap (Raw Beef Bibimbap)","nutrition":{"cal":580,"pro":27.0,"carb":82.0,"fat":16.0},"type":"main"},{"style":"한식","name":"떡만두국","ingredients":["떡","만두","소고기","계란","대파","간장","소금","참기름"],"cookTime":25,"tags":[],"nameEn":"Rice Cake and Dumpling Soup","nutrition":{"cal":490,"pro":19.0,"carb":82.0,"fat":10.0},"type":"main"},{"style":"한식","name":"황기닭백숙","ingredients":["닭고기","황기","인삼","마늘","대파","소금","찹쌀"],"cookTime":90,"tags":[],"nameEn":"Astragalus Chicken Soup","nutrition":{"cal":340,"pro":38.0,"carb":4.0,"fat":18.0},"type":"main"},{"style":"한식","name":"소갈비구이","ingredients":["소갈비","간장","설탕","마늘","참기름","배","생강","미림"],"cookTime":30,"tags":[],"nameEn":"Grilled Beef Short Ribs","nutrition":{"cal":460,"pro":26.0,"carb":6.0,"fat":36.0},"type":"main"},{"style":"한식","name":"팽이버섯전골","ingredients":["팽이버섯","두부","돼지고기","배추","대파","된장","고추장","멸치육수"],"cookTime":25,"tags":[],"nameEn":"Enoki Mushroom Hot Pot","nutrition":{"cal":160,"pro":8.0,"carb":14.0,"fat":8.0},"type":"main"},{"style":"한식","name":"냉이무침","ingredients":["냉이","된장","마늘","참기름","깨","소금"],"cookTime":10,"tags":[],"nameEn":"Seasoned Shepherd's Purse","nutrition":{"cal":40,"pro":2.0,"carb":4.0,"fat":1.8},"type":"side"},{"style":"한식","name":"열무국수","ingredients":["소면","열무","고추장","식초","설탕","마늘","참기름","계란","오이"],"cookTime":15,"tags":[],"nameEn":"Young Radish Noodles","nutrition":{"cal":390,"pro":10.0,"carb":78.0,"fat":4.0},"type":"main"},{"style":"일식","name":"카니돈부리","ingredients":["쌀","게살","계란","간장","미림","다시","대파","생강"],"cookTime":20,"tags":[],"nameEn":"Kani Donburi (Crab Rice Bowl)","nutrition":{"cal":530,"pro":22.0,"carb":84.0,"fat":12.0},"type":"main"},{"style":"일식","name":"야키오니기리","ingredients":["쌀","간장","참기름","소금","버터","깨"],"cookTime":20,"tags":[],"nameEn":"Yaki Onigiri (Grilled Rice Ball)","nutrition":{"cal":280,"pro":6.0,"carb":56.0,"fat":3.0},"type":"main"},{"style":"일식","name":"모야시라멘","ingredients":["라면","콩나물","계란","마늘","간장","참기름","대파","소금"],"cookTime":15,"tags":[],"nameEn":"Moyashi Ramen (Bean Sprout Ramen)","nutrition":{"cal":440,"pro":14.0,"carb":72.0,"fat":10.0},"type":"main"},{"style":"일식","name":"오야코우동","ingredients":["우동","닭고기","계란","간장","미림","대파","다시","설탕"],"cookTime":20,"tags":[],"nameEn":"Oyako Udon","nutrition":{"cal":480,"pro":22.0,"carb":76.0,"fat":10.0},"type":"main"},{"style":"일식","name":"다코라이스","ingredients":["쌀","소고기","양상추","토마토","치즈","살사소스","마늘","고춧가루","양파"],"cookTime":20,"tags":[],"nameEn":"Taco Rice","nutrition":{"cal":510,"pro":22.0,"carb":70.0,"fat":15.0},"type":"main"},{"style":"일식","name":"부타네기폰즈","ingredients":["돼지고기","대파","폰즈소스","참기름","간장","레몬","식용유"],"cookTime":15,"tags":[],"nameEn":"Buta Negi Ponzu","nutrition":{"cal":290,"pro":22.0,"carb":5.0,"fat":20.0},"type":"main"},{"style":"중식","name":"완탕탕","ingredients":["완탕피","돼지고기","새우","생강","간장","참기름","치킨스톡","대파"],"cookTime":25,"tags":[],"nameEn":"Wonton Soup","nutrition":{"cal":180,"pro":12.0,"carb":14.0,"fat":8.0},"type":"main"},{"style":"중식","name":"광동볶음면","ingredients":["쌀국수","소고기","숙주","간장","굴소스","마늘","식용유","대파"],"cookTime":20,"tags":[],"nameEn":"Cantonese Stir-fried Noodles","nutrition":{"cal":480,"pro":14.0,"carb":72.0,"fat":15.0},"type":"main"},{"style":"중식","name":"야채춘권","ingredients":["춘권피","당면","당근","양배추","버섯","간장","참기름","식용유"],"cookTime":30,"tags":[],"nameEn":"Vegetable Spring Rolls","nutrition":{"cal":240,"carb":32,"pro":4,"fat":10},"type":"side"},{"style":"중식","name":"팽이버섯볶음","ingredients":["팽이버섯","마늘","간장","굴소스","참기름","고추기름","대파"],"cookTime":10,"tags":[],"nameEn":"Stir-fried Enoki Mushrooms","nutrition":{"cal":65,"pro":2.0,"carb":5.0,"fat":4.0},"type":"side"},{"style":"중식","name":"닭육수면","ingredients":["중면","닭고기","대파","생강","간장","소금","참기름","마늘"],"cookTime":30,"tags":[],"nameEn":"Chicken Broth Noodles","nutrition":{"cal":430,"pro":20.0,"carb":75.0,"fat":5.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"버섯크림리조또","ingredients":["쌀","버섯","생크림","파마산치즈","양파","마늘","버터","화이트와인","소금"],"cookTime":35,"tags":[],"nameEn":"Mushroom Cream Risotto","nutrition":{"cal":450,"pro":11.0,"carb":58.0,"fat":19.0},"type":"main"},{"style":"🇺🇸 미국","name":"베이컨에그스크램블","ingredients":["계란","베이컨","버터","생크림","소금","후추","치즈"],"cookTime":10,"tags":["브런치"],"nameEn":"Bacon and Egg Scramble","nutrition":{"cal":280,"pro":16.0,"carb":2.0,"fat":23.0},"type":"main"},{"style":"🇬🇧 영국","name":"풀드포크","ingredients":["돼지고기","양파","마늘","토마토소스","설탕","식초","우스터소스","후추"],"cookTime":90,"tags":[],"nameEn":"Pulled Pork","nutrition":{"cal":320,"pro":24.0,"carb":14.0,"fat":18.0},"type":"main"},{"style":"🇺🇸 미국","name":"치킨콥샐러드","ingredients":["닭가슴살","양상추","베이컨","계란","방울토마토","아보카도","올리브오일","레몬"],"cookTime":20,"tags":[],"nameEn":"Chicken Cobb Salad","nutrition":{"cal":380,"pro":28.0,"carb":10.0,"fat":26.0},"type":"main"},{"style":"🇺🇸 미국","name":"연어스테이크","ingredients":["연어","버터","레몬","마늘","타임","소금","후추","올리브오일"],"cookTime":15,"tags":["헬시"],"nameEn":"Salmon Steak","nutrition":{"cal":310,"pro":36.0,"carb":0.2,"fat":18.0},"type":"main"},{"style":"🇹🇭 태국","name":"카오무댕","ingredients":["쌀","돼지고기","간장","꿀","오향파우더","마늘","식용유","오이"],"cookTime":40,"tags":[],"nameEn":"Khao Mu Daeng (Red Pork Rice)","nutrition":{"cal":560,"pro":26.0,"carb":74.0,"fat":18.0},"type":"main"},{"style":"🇹🇭 태국","name":"라르브무","ingredients":["돼지고기","쌀","라임","피시소스","고춧가루","고수","민트","양파","마늘"],"cookTime":20,"tags":[],"nameEn":"Larb Moo","nutrition":{"cal":260,"carb":6,"pro":24,"fat":15},"type":"main"},{"style":"🇹🇭 태국","name":"팟나","ingredients":["중면","닭고기","브로콜리","굴소스","간장","전분","마늘","식용유","다시"],"cookTime":20,"tags":[],"nameEn":"Pad Na (Thai Sauce Noodles)","nutrition":{"cal":460,"pro":18.0,"carb":58.0,"fat":17.0},"type":"main"},{"style":"🇹🇭 태국","name":"카오닌무삥","ingredients":["찹쌀","돼지고기","레몬그라스","마늘","피시소스","설탕","강황"],"cookTime":40,"tags":[],"nameEn":"Khao Niao Moo Ping","nutrition":{"cal":520,"carb":42,"pro":26,"fat":28},"type":"main"},{"style":"🇻🇳 베트남","name":"보코","ingredients":["소고기","당근","레몬그라스","마늘","생강","토마토소스","팔각","고수"],"cookTime":60,"tags":[],"nameEn":"Boko","nutrition":{"cal":390,"pro":28.0,"carb":16.0,"fat":24.0},"type":"main"},{"style":"🇻🇳 베트남","name":"퍼싸오","ingredients":["쌀국수","소고기","숙주","양파","간장","굴소스","마늘","식용유"],"cookTime":20,"tags":[],"nameEn":"Pho Xao (Stir-fried Pho Noodles)","nutrition":{"cal":510,"pro":18.0,"carb":68.0,"fat":19.0},"type":"main"},{"style":"🇻🇳 베트남","name":"껌스엉","ingredients":["쌀","돼지갈비","피시소스","마늘","설탕","레몬그라스","계란"],"cookTime":40,"tags":[],"nameEn":"Cơm sườn","nutrition":{"cal":570,"pro":30.0,"carb":72.0,"fat":18.0},"type":"main"},{"style":"🇻🇳 베트남","name":"반보팻짠","ingredients":["쌀가루","계란","피시소스","대파","마늘","식용유","설탕"],"cookTime":20,"tags":[],"nameEn":"Banh Bo Phat Chan","nutrition":{"cal":290,"carb":8,"pro":24,"fat":18},"type":"main"},{"style":"🇮🇳 인도","name":"치킨발티","ingredients":["닭고기","양파","토마토","마늘","생강","가람마살라","고춧가루","버터","고수"],"cookTime":35,"tags":[],"nameEn":"Chicken Balti","nutrition":{"cal":390,"pro":31.0,"carb":12.0,"fat":24.0},"type":"main"},{"style":"🇮🇳 인도","name":"팔라크아루","ingredients":["시금치","감자","마늘","생강","커민","강황","고수분말","식용유","소금"],"cookTime":30,"tags":[],"nameEn":"Palak Aloo","nutrition":{"cal":190,"carb":18,"pro":4,"fat":12},"type":"main"},{"style":"🇮🇳 인도","name":"치킨두피아자","ingredients":["닭고기","양파","마늘","생강","가람마살라","강황","고춧가루","요거트","버터"],"cookTime":40,"tags":[],"nameEn":"Chicken Do Pyaza","nutrition":{"cal":380,"pro":28.0,"carb":14.0,"fat":24.0},"type":"main"},{"style":"일식","name":"단호박수프","ingredients":["단호박","양파","버터","생크림","치킨스톡","소금","후추","마늘"],"cookTime":30,"tags":["헬시"],"nameEn":"Butternut Squash Soup","nutrition":{"cal":160,"pro":3.0,"carb":26.0,"fat":5.0},"type":"main"},{"style":"🇺🇸 미국","name":"닭가슴살요거트볼","ingredients":["닭가슴살","요거트","오이","방울토마토","올리브오일","레몬","소금","민트"],"cookTime":20,"tags":["헬시"],"nameEn":"Chicken Breast Yogurt Bowl","nutrition":{"cal":240,"pro":20.0,"carb":22.0,"fat":7.0},"type":"main"},{"style":"🇷🇺 러시아","name":"비트샐러드","ingredients":["비트","아보카도","페타치즈","루꼴라","올리브오일","레몬","소금","후추"],"cookTime":15,"tags":["헬시"],"nameEn":"Beet Salad","nutrition":{"cal":110,"pro":2.0,"carb":12.0,"fat":6.0},"type":"side"},{"style":"한식","name":"채소달걀국","ingredients":["계란","브로콜리","당근","양파","치킨스톡","소금","후추","마늘"],"cookTime":15,"tags":["헬시"],"nameEn":"Vegetable and Egg Soup","nutrition":{"cal":70,"pro":6.0,"carb":3.0,"fat":4.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"치킨몰레","ingredients":["닭고기","초콜릿","고춧가루","토마토","양파","마늘","커민","고수","소금"],"cookTime":50,"tags":[],"nameEn":"Chicken Mole","nutrition":{"cal":420,"pro":32.0,"carb":18.0,"fat":25.0},"type":"main"},{"style":"🇲🇽 멕시코","name":"세비체","ingredients":["새우","오이","토마토","양파","라임","고수","소금","고춧가루","아보카도"],"cookTime":20,"tags":[],"nameEn":"Classic Ceviche","nutrition":{"cal":140,"pro":19.0,"carb":7.0,"fat":3.0},"type":"side"},{"style":"🇲🇽 멕시코","name":"카마로네스알라디아블라","ingredients":["새우","고춧가루","마늘","토마토","버터","소금","레몬","대파"],"cookTime":20,"tags":[],"nameEn":"Camarones a la Diabla","nutrition":{"cal":280,"carb":10,"pro":24,"fat":16},"type":"main"},{"style":"🇮🇩 인도네시아","name":"굴라이 이칸","ingredients":["생선","코코넛밀크","강황","레몬그라스","마늘","생강","팜슈가","소금"],"cookTime":30,"tags":[],"nameEn":"Gulai Ikan (Fish Curry)","nutrition":{"cal":320,"pro":24.0,"carb":10.0,"fat":20.0},"type":"main"},{"style":"🇮🇩 인도네시아","name":"레막캄빙","ingredients":["양고기","코코넛밀크","레몬그라스","마늘","강황","생강","소금","팜슈가"],"cookTime":50,"tags":[],"nameEn":"Lemak Kambing","nutrition":{"cal":440,"carb":12,"pro":29,"fat":30},"type":"main"},{"style":"🇮🇩 인도네시아","name":"아삼이칸","ingredients":["생선","타마린드","마늘","양파","강황","라임","고춧가루","소금"],"cookTime":25,"tags":[],"nameEn":"Asam Ikan","nutrition":{"cal":190,"carb":9,"pro":22,"fat":7},"type":"main"},{"style":"🇲🇾 말레이시아","name":"로미에","ingredients":["중면","새우","계란","양배추","굴소스","간장","마늘","전분","식용유","육수"],"cookTime":20,"tags":[],"nameEn":"Lomi (Filipino Noodle Soup)","nutrition":{"cal":390,"pro":16.0,"carb":65.0,"fat":7.0},"type":"main"},{"style":"🇲🇾 말레이시아","name":"아얌마삭르막","ingredients":["닭고기","코코넛밀크","레몬그라스","마늘","생강","강황","피시소스","팜슈가"],"cookTime":35,"tags":[],"nameEn":"Ayam Masak Lemak (Chicken in Coconut Milk)","nutrition":{"cal":410,"pro":24.0,"carb":10.0,"fat":30.0},"type":"main"},{"style":"🇵🇭 필리핀","name":"기나탕마노크","ingredients":["닭고기","코코넛밀크","마늘","생강","피시소스","양파","소금","후추"],"cookTime":35,"tags":[],"nameEn":"Nilagang Manok (Filipino Chicken Soup)","nutrition":{"cal":260,"pro":28.0,"carb":10.0,"fat":12.0},"type":"main"},{"style":"🇵🇭 필리핀","name":"아도봉캉콩","ingredients":["공심채","마늘","식초","간장","설탕","소금","식용유"],"cookTime":15,"tags":[],"nameEn":"Adobong Kangkong (Filipino Water Spinach)","nutrition":{"cal":120,"pro":3.0,"carb":8.0,"fat":8.0},"type":"side"},{"style":"🇵🇭 필리핀","name":"피시볼국","ingredients":["어묵","두부","숙주","피시소스","마늘","양파","소금","후추"],"cookTime":20,"tags":[],"nameEn":"Fish Ball Soup","nutrition":{"cal":210,"pro":16.0,"carb":18.0,"fat":8.0},"type":"main"},{"style":"🇹🇷 터키","name":"타부크수유","ingredients":["닭고기","중면","양파","당근","소금","후추","타임","마늘","버터"],"cookTime":40,"tags":[],"nameEn":"Tavuk Suyu Çorbası","nutrition":{"cal":310,"carb":11,"pro":24,"fat":19},"type":"main"},{"style":"🇹🇷 터키","name":"이즈미르쾨프테","ingredients":["소고기","양파","마늘","토마토소스","커민","파프리카파우더","계란","빵가루"],"cookTime":35,"tags":[],"nameEn":"İzmir Köfte","nutrition":{"cal":340,"pro":22.0,"carb":18.0,"fat":20.0},"type":"main"},{"style":"🇸🇬 싱가포르","name":"무이판","ingredients":["쌀","소고기","양배추","버섯","간장","굴소스","전분","마늘","육수"],"cookTime":20,"tags":[],"nameEn":"Mui Fan (Cantonese Sauce Rice)","nutrition":{"cal":460,"pro":14.0,"carb":70.0,"fat":13.0},"type":"main"},{"style":"🇬🇷 그리스","name":"할루미구이","ingredients":["할루미치즈","올리브오일","레몬","오레가노","방울토마토","소금"],"cookTime":10,"tags":[],"nameEn":"Grilled Halloumi","nutrition":{"cal":320,"pro":21.0,"carb":2.0,"fat":26.0},"type":"main"},{"style":"🇬🇷 그리스","name":"아르니굽기","ingredients":["양고기","마늘","로즈마리","올리브오일","레몬","소금","후추","타임"],"cookTime":60,"tags":[],"nameEn":"Arni Sto Fourno","nutrition":{"cal":540,"carb":2,"pro":36,"fat":43},"type":"main"},{"style":"🇬🇷 그리스","name":"호르타","ingredients":["시금치","올리브오일","레몬","소금","마늘"],"cookTime":15,"tags":[],"nameEn":"Horta (Greek Boiled Greens)","nutrition":{"cal":90,"pro":2.0,"carb":6.0,"fat":7.0},"type":"side"},{"style":"🇪🇸 스페인","name":"사르수엘라","ingredients":["새우","오징어","홍합","토마토","양파","마늘","올리브오일","화이트와인","파슬리"],"cookTime":35,"tags":[],"nameEn":"Zarzuela (Spanish Seafood Stew)","nutrition":{"cal":290,"pro":26.0,"carb":15.0,"fat":14.0},"type":"main"},{"style":"🇪🇸 스페인","name":"초리소와인조림","ingredients":["초리소","레드와인","마늘","양파","파슬리","올리브오일","소금"],"cookTime":25,"tags":[],"nameEn":"Chorizo Wine Braise","nutrition":{"cal":320,"pro":18.0,"carb":6.0,"fat":25.0},"type":"side"},{"style":"🇪🇸 스페인","name":"시피오네스앙코아","ingredients":["앤초비","마늘","올리브오일","식초","파슬리","소금","바게트"],"cookTime":10,"tags":[],"nameEn":"Chipirones en su Tinta","nutrition":{"cal":180,"carb":6,"pro":18,"fat":9},"type":"main"},{"style":"🇫🇷 프랑스","name":"파르망티에","ingredients":["소고기","감자","버터","양파","마늘","소금","후추","치즈"],"cookTime":50,"tags":[],"nameEn":"Parmentier (French Shepherd's Pie)","nutrition":{"cal":410,"pro":22.0,"carb":32.0,"fat":21.0},"type":"main"},{"style":"🇫🇷 프랑스","name":"뵈프엔다우브","ingredients":["소고기","레드와인","당근","양파","마늘","오렌지","타임","월계수잎"],"cookTime":120,"tags":[],"nameEn":"Boeuf en Daube (French Beef Stew)","nutrition":{"cal":360,"pro":28.0,"carb":12.0,"fat":22.0},"type":"main"},{"style":"🇫🇷 프랑스","name":"아만딘송어","ingredients":["생선","아몬드","버터","레몬","파슬리","소금","후추","밀가루"],"cookTime":20,"tags":[],"nameEn":"Trout Amandine","nutrition":{"cal":340,"carb":7,"pro":28,"fat":22},"type":"main"},{"style":"🇮🇹 이탈리아","name":"아라비아타파스타","ingredients":["스파게티","토마토소스","고춧가루","마늘","올리브오일","파슬리","소금"],"cookTime":20,"tags":[],"nameEn":"Arrabbiata Pasta","nutrition":{"cal":440,"pro":12.0,"carb":68.0,"fat":12.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"버터세이지뇨키","ingredients":["감자","밀가루","버터","세이지","파마산치즈","소금","후추"],"cookTime":40,"tags":[],"nameEn":"Butter Sage Gnocchi","nutrition":{"cal":380,"pro":6.0,"carb":48.0,"fat":18.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"리가토니알라보드카","ingredients":["리가토니","생크림","토마토소스","베이컨","마늘","올리브오일","파마산치즈"],"cookTime":25,"tags":[],"nameEn":"Rigatoni alla Vodka","nutrition":{"cal":510,"pro":14.0,"carb":68.0,"fat":19.0},"type":"main"},{"style":"🇮🇹 이탈리아","name":"폴포살라다","ingredients":["문어","셀러리","올리브","레몬","올리브오일","파슬리","소금","후추"],"cookTime":40,"tags":[],"nameEn":"Polpo Salada (Octopus Salad)","nutrition":{"cal":180,"pro":16.0,"carb":12.0,"fat":8.0},"type":"main"},{"style":"🌙 중동","name":"치킨샤와르마랩","ingredients":["닭고기","피타빵","요거트","마늘","강황","커민","양상추","토마토","레몬"],"cookTime":30,"tags":[],"nameEn":"Chicken Shawarma Wrap","nutrition":{"cal":490,"pro":28.0,"carb":44.0,"fat":22.0},"type":"main"},{"style":"🌙 중동","name":"카프타그릴","ingredients":["소고기","양파","파슬리","커민","계피","소금","후추","식용유"],"cookTime":20,"tags":[],"nameEn":"Kafta Grill (Lebanese Meatball Skewer)","nutrition":{"cal":380,"pro":26.0,"carb":4.0,"fat":30.0},"type":"main"},{"style":"🌙 중동","name":"마크부스","ingredients":["쌀","닭고기","양파","토마토","가람마살라","사프란","버터","소금"],"cookTime":60,"tags":[],"nameEn":"Machboos (Spiced Meat and Rice)","nutrition":{"cal":520,"pro":26.0,"carb":72.0,"fat":14.0},"type":"main"},{"style":"🌙 중동","name":"레바논타울룩","ingredients":["닭고기","요거트","마늘","레몬","올리브오일","커민","강황","소금"],"cookTime":25,"tags":[],"nameEn":"Lebanese Taouk","nutrition":{"cal":310,"carb":4,"pro":31,"fat":18},"type":"main"},{"style":"🇵🇪 페루","name":"로모살타도","ingredients":["소고기","감자","양파","토마토","간장","식초","고수","마늘","고추","식용유"],"cookTime":25,"tags":[],"nameEn":"Lomo Saltado","nutrition":{"cal":410,"pro":26.0,"carb":34.0,"fat":16.0},"type":"main"},{"style":"🇵🇪 페루","name":"아히데갈리나","ingredients":["닭고기","빵","생크림","강황","마늘","양파","아히페이스트","계란","소금"],"cookTime":40,"tags":[],"nameEn":"Ají de Gallina","nutrition":{"cal":420,"carb":22,"pro":28,"fat":25},"type":"main"},{"style":"🇵🇪 페루","name":"차우파","ingredients":["쌀","계란","닭고기","간장","참기름","생강","대파","당근","식용유"],"cookTime":20,"tags":[],"nameEn":"Chaufa (Peruvian Fried Rice)","nutrition":{"cal":640,"pro":18.0,"carb":88.0,"fat":24.0},"type":"main"},{"style":"🇲🇦 모로코","name":"치킨타진","ingredients":["닭고기","올리브","레몬","생강","강황","커민","계피","마늘","양파","소금"],"cookTime":60,"tags":[],"nameEn":"Chicken Tagine","nutrition":{"cal":340,"pro":27.0,"carb":18.0,"fat":18.0},"type":"main"},{"style":"🇲🇦 모로코","name":"쿠스쿠스로얄","ingredients":["쿠스쿠스","양고기","병아리콩","당근","단호박","커민","강황","버터","소금"],"cookTime":60,"tags":[],"nameEn":"Couscous Royal","nutrition":{"cal":560,"pro":32.0,"carb":54.0,"fat":24.0},"type":"main"},{"style":"🇲🇦 모로코","name":"하리라","ingredients":["렌틸콩","병아리콩","토마토","고수","강황","커민","레몬","쌀","소금"],"cookTime":45,"tags":["헬시"],"nameEn":"Harira (Moroccan Lamb Soup)","nutrition":{"cal":240,"pro":12.0,"carb":32.0,"fat":6.0},"type":"main"},{"style":"일식","name":"부타카쿠니","ingredients":["돼지고기","간장","미림","설탕","사케","생강","계란","대파"],"cookTime":120,"tags":[],"nameEn":"Buta Kakuni (Braised Pork Belly)","nutrition":{"cal":460,"pro":22.0,"carb":10.0,"fat":38.0},"type":"main"},{"style":"일식","name":"오징어먹물 파스타","ingredients":["스파게티","오징어","오징어먹물","마늘","올리브오일","소금","파슬리","화이트와인"],"cookTime":25,"tags":[],"nameEn":"Squid Ink Pasta","nutrition":{"cal":490,"pro":16.0,"carb":68.0,"fat":16.0},"type":"main"},{"style":"중식","name":"광동식탕수육","ingredients":["돼지고기","전분","식용유","파프리카","양파","식초","설탕","케찹","마늘"],"cookTime":30,"tags":[],"nameEn":"Cantonese Sweet and Sour Pork","nutrition":{"cal":460,"pro":18.0,"carb":38.0,"fat":26.0},"type":"main"},{"style":"🇮🇪 아일랜드","name":"아이리시스튜","ingredients":["양고기","감자","당근","양파","타임","소금","파슬리","마늘","버터"],"cookTime":90,"tags":[],"nameEn":"Irish Stew","nutrition":{"cal":320,"pro":24.0,"carb":18.0,"fat":17.0},"type":"main"},{"style":"🇫🇷 프랑스","name":"비프웰링턴","ingredients":["소고기","밀가루","버터","버섯","계란","소금","머스터드","파슬리"],"cookTime":60,"tags":[],"nameEn":"Beef Wellington","nutrition":{"cal":490,"pro":26.0,"carb":22.0,"fat":33.0},"type":"main"},{"style":"🇹🇭 태국","name":"마싸만 커리","ingredients":["닭고기","코코넛밀크","감자","양파","카레가루","땅콩","계피","소금","팜슈가"],"cookTime":45,"tags":[],"nameEn":"Massaman Curry","nutrition":{"cal":420,"pro":20.0,"carb":18.0,"fat":30.0},"type":"main"},{"style":"🇮🇳 인도","name":"달마카니","ingredients":["강낭콩","버터","마늘","생강","토마토","생크림","가람마살라","소금","커민"],"cookTime":60,"tags":["헬시"],"nameEn":"Makhani Dal","nutrition":{"cal":280,"pro":10.0,"carb":28.0,"fat":14.0},"type":"main"},{"style":"🇮🇳 인도","name":"램 코르마","ingredients":["양고기","요거트","캐슈넛","양파","마늘","생강","가람마살라","소금","생크림","강황"],"cookTime":60,"tags":[],"nameEn":"Lamb Korma","nutrition":{"cal":460,"pro":28.0,"carb":14.0,"fat":32.0},"type":"main"},{"style":"🇮🇳 인도","name":"탄두리연어","ingredients":["연어","요거트","마늘","생강","커민","가람마살라","강황","소금","레몬"],"cookTime":25,"tags":["헬시"],"nameEn":"Tandoori Salmon","nutrition":{"cal":270,"pro":28.0,"carb":3.0,"fat":16.0},"type":"main"},{"style":"🇺🇸 미국","name":"연어아보카도포케","ingredients":["쌀","연어","아보카도","오이","간장","참기름","깨","와사비","소금"],"cookTime":10,"tags":["헬시"],"nameEn":"Salmon Avocado Poke Bowl","nutrition":{"cal":530,"pro":25.0,"carb":54.0,"fat":24.0},"type":"main"},{"style":"한식","name":"두부버섯솥밥","ingredients":["쌀","두부","버섯","당근","간장","참기름","마늘","소금","대파"],"cookTime":30,"tags":["헬시"],"nameEn":"Tofu and Mushroom Pot Rice","nutrition":{"cal":410,"pro":14.0,"carb":72.0,"fat":7.0},"type":"main"},{"style":"🇸🇬 싱가포르","name":"오타오타","ingredients":["생선","코코넛밀크","레몬그라스","강황","마늘","고춧가루","소금","계란"],"cookTime":25,"tags":[],"nameEn":"Otak-Otak (Grilled Fish Cake)","nutrition":{"cal":160,"pro":14.0,"carb":6.0,"fat":9.0},"type":"side"},{"style":"🇬🇷 그리스","name":"기로스 피타","ingredients":["돼지고기","피타빵","토마토","양파","요거트","마늘","소금","오레가노","파슬리"],"cookTime":20,"tags":[],"nameEn":"Gyros Pita","nutrition":{"cal":580,"pro":34.0,"carb":48.0,"fat":28.0},"type":"main"},{"style":"🌙 중동","name":"코프타 케밥","ingredients":["소고기","양파","파슬리","커민","소금","올리브오일","파프리카파우더","계피"],"cookTime":20,"tags":[],"nameEn":"Kofta Kebab","nutrition":{"cal":390,"pro":24.0,"carb":5.0,"fat":31.0},"type":"main"},{"style":"🇲🇦 모로코","name":"바스틸라","ingredients":["닭고기","밀가루","계란","아몬드","계피","설탕","소금","버터","파슬리"],"cookTime":60,"tags":[],"nameEn":"Bastilla (Moroccan Pigeon Pie)","nutrition":{"cal":420,"pro":18.0,"carb":45.0,"fat":18.0},"type":"main"},{"style":"🇲🇦 모로코","name":"케프타 타진","ingredients":["소고기","토마토","계란","양파","마늘","커민","파슬리","소금","올리브오일"],"cookTime":35,"tags":[],"nameEn":"Kefta Tagine","nutrition":{"cal":390,"pro":24.0,"carb":12.0,"fat":28.0},"type":"main"},{"style":"🇷🇺 러시아","name":"솔얀카","ingredients":["소고기","소시지","올리브","케이퍼","양파","피클","토마토소스","소금","사워크림","레몬"],"cookTime":50,"tags":[],"nameEn":"Solyanka","nutrition":{"cal":240,"carb":11,"pro":16,"fat":14},"type":"main"},{"style":"🇵🇹 포르투갈","name":"칼데이라다","ingredients":["생선","감자","토마토","양파","마늘","올리브오일","소금","파슬리","화이트와인"],"cookTime":40,"tags":[],"nameEn":"Caldeirada (Portuguese Fish Stew)","nutrition":{"cal":310,"pro":26.0,"carb":16.0,"fat":15.0},"type":"main"},{"style":"🇵🇹 포르투갈","name":"코지두 아 포르투게사","ingredients":["돼지고기","소고기","소시지","병아리콩","감자","당근","소금","파슬리","양배추"],"cookTime":120,"tags":[],"nameEn":"Cozido à Portuguesa","nutrition":{"cal":490,"carb":24,"pro":34,"fat":29},"type":"main"},{"style":"🇧🇷 브라질","name":"무케카","ingredients":["생선","코코넛밀크","토마토","양파","마늘","고수","올리브오일","라임","소금"],"cookTime":30,"tags":[],"nameEn":"Moqueca","nutrition":{"cal":320,"carb":14,"pro":24,"fat":19},"type":"main"},{"style":"🇺🇸 미국","name":"슬로피 조","ingredients":["소고기","토마토소스","양파","마늘","식빵","머스터드","설탕","소금","파슬리"],"cookTime":25,"tags":[],"nameEn":"Sloppy Joe","nutrition":{"cal":390,"pro":21.0,"carb":32.0,"fat":17.0},"type":"main"},{"style":"🇺🇸 미국","name":"잠발라야","ingredients":["쌀","닭고기","소시지","새우","토마토","양파","마늘","파프리카파우더","소금","오레가노"],"cookTime":40,"tags":[],"nameEn":"Jambalaya","nutrition":{"cal":460,"pro":22.0,"carb":56.0,"fat":16.0},"type":"main"},{"style":"🇵🇪 페루","name":"클래식 세비체","ingredients":["생선","라임","양파","고수","고춧가루","소금","옥수수","마늘"],"cookTime":15,"tags":["헬시"],"nameEn":"Classic Ceviche","nutrition":{"cal":130,"carb":6,"pro":21,"fat":2},"type":"side"},{"style":"🇹🇼 대만","name":"멘보샤","ingredients":["식빵","새우","마늘","소금","계란","식용유","파슬리","후추"],"cookTime":20,"tags":[],"nameEn":"Menbosha (Shrimp Toast)","nutrition":{"cal":340,"pro":8.0,"carb":20.0,"fat":25.0},"type":"main"},{"style":"한식","name":"들기름막국수","ingredients":["메밀면","들기름","간장","참깨","김","소금","오이","파래"],"cookTime":10,"tags":["헬시"],"nameEn":"Perilla Oil Makguksu","nutrition":{"cal":460,"pro":11.0,"carb":75.0,"fat":13.0},"type":"main"},{"style":"한식","name":"평양냉면","ingredients":["냉면","동치미","소고기","계란","오이","무","식초","겨자","소금"],"cookTime":30,"tags":["헬시"],"nameEn":"Pyongyang Naengmyeon (Cold Noodles)","nutrition":{"cal":380,"pro":14.0,"carb":78.0,"fat":2.0},"type":"main"},{"style":"한식","name":"비빔냉면","ingredients":["냉면","고추장","오이","계란","식초","설탕","참기름","깨","마늘"],"cookTime":15,"tags":[],"nameEn":"Bibim Naengmyeon (Spicy Cold Noodles)","nutrition":{"cal":480,"pro":12.0,"carb":88.0,"fat":8.0},"type":"main"},{"style":"한식","name":"물냉면","ingredients":["냉면","소고기육수","오이","무","계란","식초","겨자","소금","얼음"],"cookTime":25,"tags":["헬시"],"nameEn":"Mul Naengmyeon (Cold Noodles in Broth)","nutrition":{"cal":380,"pro":11.0,"carb":82.0,"fat":2.0},"type":"main"},{"style":"한식","name":"함흥냉면","ingredients":["냉면","오징어","명태","고추장","식초","설탕","마늘","참기름","깨"],"cookTime":20,"tags":[],"nameEn":"Hamheung Naengmyeon (Cold Noodles)","nutrition":{"cal":430,"pro":11.0,"carb":91.0,"fat":3.0},"type":"main"},{"style":"한식","name":"콩나물냉국수","ingredients":["소면","콩나물","오이","식초","간장","마늘","참기름","깨","얼음"],"cookTime":15,"tags":[],"nameEn":"Cold Bean Sprout Noodles","nutrition":{"cal":360,"pro":9.0,"carb":72.0,"fat":3.0},"type":"main"},{"style":"한식","name":"닭비빔막국수","ingredients":["메밀면","닭고기","고추장","오이","당근","식초","설탕","마늘","참기름"],"cookTime":20,"tags":[],"nameEn":"Chicken Bibim Makguksu","nutrition":{"cal":540,"pro":24.0,"carb":84.0,"fat":12.0},"type":"main"},{"style":"한식","name":"간장닭날개튀김","ingredients":["닭날개","간장","마늘","설탕","미림","청주","생강","전분","식용유","깨","소금","후추"],"cookTime":30,"tags":[],"nameEn":"Soy Sauce Fried Chicken Wings","nutrition":{"cal":540,"pro":32.0,"carb":18.0,"fat":38.0},"type":"main"},{"style":"한식","name":"참치회비빔밥","ingredients":["쌀","참치회","고추장","참기름","깨","오이","당근","계란","소금"],"cookTime":15,"tags":["헬시"],"nameEn":"Fresh Tuna Bibimbap","nutrition":{"cal":530,"pro":26.0,"carb":82.0,"fat":11.0},"type":"main"},{"style":"한식","name":"간장비빔소면","ingredients":["소면","간장","참기름","설탕","식초","깨","오이","대파","마늘","소금"],"cookTime":15,"tags":[],"nameEn":"Soy Sauce Bibim Somyeon","nutrition":{"cal":520,"pro":13.0,"carb":95.0,"fat":10.0},"type":"main"},{"style":"한식","name":"칡냉면","ingredients":["냉면","소고기육수","오이","무","계란","식초","겨자","소금","얼음"],"cookTime":25,"tags":["헬시"],"nameEn":"Arrowroot Cold Noodles","nutrition":{"cal":460,"pro":11.0,"carb":94.0,"fat":4.0},"type":"main"},{"style":"한식","name":"회냉면","ingredients":["냉면","홍어","오이","무","고추장","식초","설탕","마늘","참기름","깨"],"cookTime":20,"tags":[],"nameEn":"Raw Fish Cold Noodles","nutrition":{"cal":470,"pro":18.0,"carb":92.0,"fat":4.0},"type":"main"},{"style":"일식","name":"시오라멘","ingredients":["라멘","소금","계란","차슈","대파","다시마","닭육수","죽순","김","생강"],"cookTime":30,"tags":["대표메뉴"],"nameEn":"Shio Ramen (Salt Ramen)","nutrition":{"cal":410,"pro":15.0,"carb":72.0,"fat":7.0},"type":"main"},{"style":"일식","name":"토리파이탄","ingredients":["라멘","닭육수","닭고기","계란","대파","마늘","생강","차슈","죽순","김"],"cookTime":35,"tags":["대표메뉴"],"nameEn":"Tori Paitan (Chicken Broth Ramen)","nutrition":{"cal":580,"pro":28.0,"carb":68.0,"fat":22.0},"type":"main"},{"style":"🇧🇷 브라질","name":"페이조아다","ingredients":["강낭콩","돼지고기","소시지","베이컨","양파","마늘","월계수잎","소금","후추","쌀"],"cookTime":90,"tags":[],"nutrition":{"cal":620,"pro":35,"carb":58,"fat":24},"nameEn":"Feijoada","type":"main"},{"style":"🇧🇷 브라질","name":"피캉냐 그릴","ingredients":["소고기","소금","마늘","올리브오일","파슬리","후추","레몬"],"cookTime":25,"tags":[],"nutrition":{"cal":480,"pro":42,"carb":2,"fat":32},"nameEn":"Grilled Picanha","type":"main"},{"style":"🇧🇷 브라질","name":"코시냐","ingredients":["닭고기","밀가루","버터","우유","계란","치즈","양파","마늘","소금","식용유"],"cookTime":45,"tags":[],"nutrition":{"cal":390,"pro":22,"carb":38,"fat":16},"nameEn":"Coxinha","type":"side"},{"style":"🇧🇷 브라질","name":"모케카 데 카마라웅","ingredients":["새우","코코넛밀크","토마토","양파","마늘","고수","올리브오일","라임","소금","고춧가루"],"cookTime":30,"tags":["헬시"],"nutrition":{"cal":310,"pro":28,"carb":12,"fat":18},"nameEn":"Moqueca de Camarão","type":"main"},{"style":"🇧🇷 브라질","name":"파웅 지 케이조","ingredients":["쌀가루","계란","치즈","우유","버터","소금"],"cookTime":25,"tags":[],"nutrition":{"cal":280,"pro":10,"carb":32,"fat":13},"nameEn":"Pão de Queijo","type":"side"},{"style":"🇷🇺 러시아","name":"보르시","ingredients":["소고기","비트","양배추","감자","당근","양파","토마토소스","마늘","사워크림","소금","후추","식초"],"cookTime":60,"tags":[],"nutrition":{"cal":320,"pro":22,"carb":28,"fat":12},"nameEn":"Borscht","type":"main"},{"style":"🇷🇺 러시아","name":"펠메니","ingredients":["만두피","돼지고기","소고기","양파","마늘","소금","후추","버터","사워크림"],"cookTime":40,"tags":[],"nutrition":{"cal":450,"pro":28,"carb":42,"fat":18},"nameEn":"Pelmeni","type":"main"},{"style":"🇷🇺 러시아","name":"올리비에 샐러드","ingredients":["감자","계란","당근","오이","햄","완두콩","마요네즈","소금","후추"],"cookTime":30,"tags":[],"nutrition":{"cal":350,"pro":14,"carb":30,"fat":20},"nameEn":"Olivier Salad","type":"side"},{"style":"🇷🇺 러시아","name":"블리니","ingredients":["밀가루","계란","우유","버터","설탕","소금","사워크림"],"cookTime":20,"tags":[],"nutrition":{"cal":290,"pro":9,"carb":38,"fat":12},"nameEn":"Blini","type":"side"},{"style":"🇷🇺 러시아","name":"샤슐릭","ingredients":["소고기","양파","레몬","식초","마늘","소금","후추","올리브오일"],"cookTime":35,"tags":[],"nutrition":{"cal":420,"pro":38,"carb":6,"fat":26},"nameEn":"Shashlik","type":"main"},{"style":"🇹🇼 대만","name":"루로우판","ingredients":["돼지고기","계란","간장","설탕","미림","마늘","생강","팔각","쌀","대파"],"cookTime":60,"tags":[],"nutrition":{"cal":560,"pro":28,"carb":52,"fat":26},"nameEn":"Lu Rou Fan","type":"main"},{"style":"🇹🇼 대만","name":"지파이","ingredients":["닭고기","밀가루","전분","계란","마늘","소금","후추","식용유","고춧가루","바질"],"cookTime":25,"tags":[],"nutrition":{"cal":480,"pro":32,"carb":36,"fat":22},"nameEn":"Ji Pai (Taiwanese Fried Chicken)","type":"main"},{"style":"🇹🇼 대만","name":"굴전","ingredients":["굴","계란","쌀가루","대파","소금","식용유","고추장","마요네즈"],"cookTime":15,"tags":[],"nutrition":{"cal":280,"pro":16,"carb":24,"fat":14},"nameEn":"Taiwanese Oyster Omelette","type":"main"},{"style":"🇹🇼 대만","name":"단자이면","ingredients":["소면","새우","돼지고기","숙주","계란","간장","참기름","마늘","소금","대파"],"cookTime":20,"tags":[],"nutrition":{"cal":430,"pro":26,"carb":52,"fat":12},"nameEn":"Danzai Noodles","type":"main"},{"style":"🇹🇼 대만","name":"스모크 오리덮밥","ingredients":["쌀","오리고기","간장","미림","설탕","마늘","생강","대파","참기름","깨"],"cookTime":30,"tags":[],"nutrition":{"cal":510,"pro":30,"carb":54,"fat":18},"nameEn":"Smoked Duck Rice Bowl","type":"main"},{"style":"🇵🇹 포르투갈","name":"바칼라우 아 브라스","ingredients":["염장대구","감자","계란","양파","마늘","올리브오일","파슬리","올리브","소금","후추"],"cookTime":35,"tags":[],"nutrition":{"cal":420,"pro":36,"carb":28,"fat":18},"nameEn":"Bacalhau à Brás","type":"main"},{"style":"🇵🇹 포르투갈","name":"카르네 데 포르코 아 알렌테자나","ingredients":["돼지고기","바지락","감자","토마토","마늘","고수","올리브오일","화이트와인","소금","후추"],"cookTime":45,"tags":[],"nutrition":{"cal":490,"pro":38,"carb":22,"fat":24},"nameEn":"Carne de Porco à Alentejana","type":"main"},{"style":"🇵🇹 포르투갈","name":"아로스 드 프랑고","ingredients":["닭고기","쌀","토마토","양파","마늘","올리브오일","파슬리","소금","후추","화이트와인"],"cookTime":50,"tags":[],"nutrition":{"cal":510,"pro":36,"carb":46,"fat":16},"nameEn":"Arroz de Frango","type":"main"},{"style":"🇵🇹 포르투갈","name":"카타플라나","ingredients":["새우","홍합","바지락","토마토","양파","마늘","올리브오일","파슬리","소금","화이트와인"],"cookTime":30,"tags":["헬시"],"nutrition":{"cal":290,"pro":32,"carb":10,"fat":14},"nameEn":"Cataplana","type":"main"},{"style":"🇵🇹 포르투갈","name":"소파 데 알호","ingredients":["빵","마늘","계란","올리브오일","파슬리","소금","후추","물"],"cookTime":20,"tags":[],"nutrition":{"cal":260,"pro":10,"carb":30,"fat":12},"nameEn":"Sopa de Alho","type":"main"},{"style":"🇺🇸 미국","name":"클래식 버거","ingredients":["소고기","식빵","양상추","토마토","치즈","양파","마요네즈","케첩","소금","후추"],"cookTime":20,"tags":[],"nutrition":{"cal":580,"pro":34,"carb":38,"fat":32},"nameEn":"Classic Burger","type":"main"},{"style":"🇺🇸 미국","name":"BBQ 풀드포크 샌드위치","ingredients":["돼지고기","식빵","양배추","당근","마요네즈","BBQ소스","식초","설탕","소금","후추"],"cookTime":90,"tags":[],"nutrition":{"cal":520,"pro":30,"carb":44,"fat":22},"nameEn":"BBQ Pulled Pork Sandwich","type":"main"},{"style":"🇺🇸 미국","name":"맥앤치즈","ingredients":["마카로니","치즈","버터","우유","밀가루","소금","후추","파프리카파우더"],"cookTime":25,"tags":[],"nutrition":{"cal":490,"pro":18,"carb":52,"fat":24},"nameEn":"Mac and Cheese","type":"main"},{"style":"🇺🇸 미국","name":"클램베이크","ingredients":["바지락","감자","옥수수","소시지","버터","마늘","파슬리","소금","레몬","후추"],"cookTime":40,"tags":[],"nutrition":{"cal":380,"pro":24,"carb":36,"fat":14},"nameEn":"Clam Bake","type":"main"},{"style":"🇺🇸 미국","name":"버팔로 치킨윙","ingredients":["닭날개","핫소스","버터","마늘","소금","후추","밀가루","식용유","셀러리","사워크림"],"cookTime":35,"tags":[],"nutrition":{"cal":520,"pro":36,"carb":12,"fat":36},"nameEn":"Buffalo Chicken Wings","type":"side"},{"style":"🇲🇦 모로코","name":"메르게즈","ingredients":["양고기","마늘","고춧가루","커민","파프리카파우더","소금","올리브오일","하리사","피타빵"],"cookTime":25,"tags":[],"nutrition":{"cal":460,"pro":30,"carb":28,"fat":26},"nameEn":"Merguez","type":"main"},{"style":"🇲🇦 모로코","name":"셰르물라 생선구이","ingredients":["생선","마늘","고수","커민","파프리카파우더","레몬","올리브오일","소금","고춧가루"],"cookTime":30,"tags":["헬시"],"nutrition":{"cal":280,"pro":36,"carb":4,"fat":14},"nameEn":"Chermoula Grilled Fish","type":"main"},{"style":"🇲🇦 모로코","name":"타진 므로지아","ingredients":["양고기","건포도","아몬드","꿀","계피","생강","강황","버터","양파","소금"],"cookTime":75,"tags":[],"nutrition":{"cal":550,"pro":32,"carb":38,"fat":28},"nameEn":"Tagine Mrouzia","type":"main"},{"style":"🇲🇦 모로코","name":"자알루크","ingredients":["가지","토마토","마늘","올리브오일","커민","파프리카파우더","고수","소금","레몬"],"cookTime":30,"tags":["헬시"],"nutrition":{"cal":180,"pro":4,"carb":18,"fat":12},"nameEn":"Zaalouk","type":"side"},{"style":"🇲🇦 모로코","name":"브리왓","ingredients":["밀가루","닭고기","계란","아몬드","계피","설탕","버터","꿀","소금"],"cookTime":50,"tags":[],"nutrition":{"cal":420,"pro":20,"carb":42,"fat":20},"nameEn":"Briwat","type":"side"},{"style":"일식","name":"카이센나베","nameEn":"Kaisennabe (Seafood Hot Pot)","type":"main","ingredients":["새우","가리비","홍합","두부","배추","팽이버섯","대파","다시","간장","미림","소금"],"cookTime":30,"tags":[],"nutrition":{"cal":310,"pro":34,"carb":12,"fat":10}},{"style":"일식","name":"오니기리","nameEn":"Onigiri (Rice Ball)","type":"main","ingredients":["쌀","김","소금","참치캔","마요네즈","참기름"],"cookTime":15,"tags":[],"nutrition":{"cal":270,"pro":5.0,"carb":56.0,"fat":2.0}},{"style":"일식","name":"규타쿠","nameEn":"Gyutaku (Beef Shabu Rice Bowl)","type":"main","ingredients":["소고기","쌀","간장","미림","설탕","대파","생강","참기름","계란","깨"],"cookTime":20,"tags":[],"nutrition":{"cal":530,"pro":32,"carb":50,"fat":20}},{"style":"일식","name":"이카메시","nameEn":"Ikameshi (Squid Stuffed with Rice)","type":"main","ingredients":["오징어","찹쌀","간장","미림","설탕","다시","생강","대파"],"cookTime":45,"tags":[],"nutrition":{"cal":380,"pro":26,"carb":48,"fat":6}},{"style":"일식","name":"야키니쿠","nameEn":"Yakiniku (Japanese BBQ)","type":"main","ingredients":["소고기","간장","미림","설탕","마늘","참기름","깨","배추","대파","쌀"],"cookTime":25,"tags":[],"nutrition":{"cal":580,"pro":38,"carb":42,"fat":26}},{"style":"중식","name":"마파당면","nameEn":"Mapo Glass Noodles","type":"main","ingredients":["당면","돼지고기","두반장","마늘","생강","간장","전분","대파","고추기름","참기름"],"cookTime":20,"tags":[],"nutrition":{"cal":420,"pro":20,"carb":52,"fat":14}},{"style":"중식","name":"홍콩식볶음국수","nameEn":"Hong Kong Style Fried Noodles","type":"main","ingredients":["계란면","소고기","숙주","청경채","간장","굴소스","참기름","마늘","생강","식용유"],"cookTime":20,"tags":[],"nutrition":{"cal":460,"pro":26,"carb":54,"fat":14}},{"style":"중식","name":"깐쇼두부","nameEn":"Ganjao Tofu","type":"main","ingredients":["두부","전분","케첩","두반장","마늘","대파","설탕","식초","식용유","소금"],"cookTime":20,"tags":["헬시"],"nutrition":{"cal":260,"pro":14,"carb":24,"fat":12}},{"style":"중식","name":"사천식마라소고기볶음","nameEn":"Sichuan Spicy Beef Stir-fry","type":"main","ingredients":["소고기","두반장","마라소스","마늘","생강","대파","피망","전분","간장","고추기름","식용유"],"cookTime":25,"tags":[],"nutrition":{"cal":480,"pro":34,"carb":16,"fat":30}},{"style":"한식","name":"지리산 흑돼지 카레","nameEn":"Jirisan Black Pork Curry","type":"main","ingredients":["흑돼지 삼겹살","양파","당근","사과","바나나","셀러리","마늘","고형카레","망고처트니","후추","소금"],"cookTime":40,"tags":["대표메뉴"],"nutrition":{"cal":580,"pro":28,"carb":48,"fat":30}},{"style":"한식","name":"간장양념닭튀김","nameEn":"Soy Glazed Fried Chicken","type":"main","ingredients":["닭다리살","전분","밀가루","계란","간장","마늘","생강","설탕","미림","청주","식용유","깨","소금","후추"],"cookTime":35,"tags":["대표메뉴"],"nutrition":{"cal":490,"carb":32,"pro":36,"fat":22}},{"style":"일식","name":"생참치회","nameEn":"Fresh Bluefin Tuna Sashimi","type":"main","ingredients":["참치 뱃살 (오토로)","참치 등살 (아카미)","참치 중뱃살 (중토로)","간장","와사비","생강","레몬","김"],"cookTime":15,"tags":["대표메뉴","헬시"],"nutrition":{"cal":290,"carb":2,"pro":44,"fat":12}},{"style":"🇮🇹 이탈리아","name":"참치 카르파초","nameEn":"Tuna Carpaccio","type":"main","ingredients":["참치 등살 (아카미)","올리브오일","레몬","케이퍼","파슬리","루꼴라","소금","후추","파마산치즈"],"cookTime":15,"tags":["대표메뉴","헬시"],"nutrition":{"cal":250,"carb":4,"pro":38,"fat":10}},{"style":"한식","name":"멸치국수","nameEn":"Anchovy Noodle Soup","type":"main","ingredients":["소면","국멸치","다시마","애호박","계란","대파","마늘","국간장","소금","식용유"],"cookTime":20,"tags":[],"nutrition":{"cal":310,"carb":54,"pro":12,"fat":5}},{"style":"중식","name":"궁보지딩","nameEn":"Kung Pao Chicken","type":"main","ingredients":["닭가슴살","땅콩","건고추","대파","마늘","생강","간장","식초","설탕","전분","고추기름","참기름","식용유","소금"],"cookTime":20,"tags":[],"nutrition":{"cal":383,"carb":17,"pro":32,"fat":20}},{"style":"중식","name":"마라오이","nameEn":"Mala Cucumber","type":"side","ingredients":["오이","마라소스","마늘","건고추","식초","설탕","간장","참기름","소금","화자오"],"cookTime":10,"tags":["헬시"],"nutrition":{"cal":85,"carb":9,"pro":2,"fat":5}},{"style":"한식","name":"오징어튀김","nameEn":"Fried Squid","type":"main","ingredients":["오징어 몸통","오징어 다리","튀김가루","전분","계란","소금","후추","식용유"],"cookTime":20,"tags":[],"nutrition":{"cal":380,"carb":30,"pro":20,"fat":18}},{"style":"한식","name":"쫄면","nameEn":"Jjolmyeon (Chewy Noodles)","type":"main","ingredients":["쫄면","고추장","식초","설탕","마늘","참기름","깨","오이","당근","콩나물","계란"],"cookTime":15,"tags":[],"nutrition":{"cal":395,"carb":72,"pro":12,"fat":7}},{"style":"중식","name":"간짜장","nameEn":"Dry Black Bean Noodles","type":"main","ingredients":["중면","돼지고기 앞다리살","춘장","양파","호박","감자","마늘","생강","전분","식용유","굴소스"],"cookTime":20,"tags":[],"nutrition":{"cal":625,"carb":76,"pro":26,"fat":24}},{"style":"중식","name":"유니짜장","nameEn":"Yuni Jjajang (Minced Pork Black Bean Noodles)","type":"main","ingredients":["중면","돼지고기 다짐육","춘장","양파","마늘","생강","굴소스","전분","설탕","식용유","참기름"],"cookTime":20,"tags":[],"nutrition":{"cal":600,"carb":78,"pro":25,"fat":22}},{"style":"중식","name":"사천짜장","nameEn":"Sichuan Spicy Black Bean Noodles","type":"main","ingredients":["중면","돼지고기 앞다리살","춘장","두반장","양파","마늘","생강","고추기름","전분","식용유","고춧가루"],"cookTime":25,"tags":[],"nutrition":{"cal":650,"carb":78,"pro":25,"fat":26}},{"style":"중식","name":"쟁반짜장","nameEn":"Jjaengban Jjajang (Shared Plate Black Bean Noodles)","type":"main","ingredients":["중면","돼지고기 앞다리살","오징어 몸통","새우","춘장","양파","호박","당근","마늘","전분","식용유","굴소스"],"cookTime":25,"tags":[],"nutrition":{"cal":680,"carb":82,"pro":30,"fat":22}},{"style":"중식","name":"백짬뽕","nameEn":"White Seafood Noodle Soup","type":"main","ingredients":["중면","오징어 몸통","새우","홍합","돼지고기 목살","배추","양파","대파","마늘","생강","소금","식용유","참기름"],"cookTime":25,"tags":[],"nutrition":{"cal":485,"carb":62,"pro":28,"fat":14}},{"style":"중식","name":"차돌짬뽕","nameEn":"Brisket Spicy Noodle Soup","type":"main","ingredients":["중면","차돌박이","오징어 몸통","홍합","배추","양파","대파","마늘","생강","고춧가루","고추기름","식용유","소금"],"cookTime":25,"tags":[],"nutrition":{"cal":545,"carb":62,"pro":28,"fat":22}},{"style":"🇮🇹 이탈리아","name":"부라타치즈샐러드","nameEn":"Burrata Cheese Salad","type":"main","tags":["헬시"],"ingredients":["부라타치즈","방울토마토","루꼴라","어린잎채소","올리브오일","발사믹식초","소금","후추"],"cookTime":10,"nutrition":{"cal":296,"pro":17,"carb":11,"fat":19}},{"style":"🇮🇹 이탈리아","name":"카프레제 샐러드","nameEn":"Caprese Salad","type":"side","tags":["헬시"],"ingredients":["모짜렐라치즈","토마토","바질","올리브오일","발사믹식초","소금","후추"],"cookTime":10,"nutrition":{"cal":210,"pro":12,"carb":8,"fat":15}},{"style":"🇵🇪 페루","name":"아보카도 새우 샐러드","nameEn":"Avocado Shrimp Salad","type":"main","tags":["헬시"],"ingredients":["새우","아보카도","양상추","방울토마토","오이","레몬","올리브오일","소금","후추"],"cookTime":15,"nutrition":{"cal":280,"pro":18,"carb":12,"fat":18}},{"style":"🇳🇴 노르웨이","name":"훈제연어 샐러드","nameEn":"Smoked Salmon Salad","type":"main","tags":["헬시"],"ingredients":["훈제연어","어린잎채소","아보카도","케이퍼","적양파","레몬","올리브오일","크림치즈","소금","후추"],"cookTime":10,"nutrition":{"cal":320,"pro":22,"carb":6,"fat":22}},{"style":"🇵🇪 페루","name":"퀴노아 샐러드","nameEn":"Quinoa Salad","type":"main","tags":["헬시"],"ingredients":["퀴노아","방울토마토","오이","양파","파프리카","레몬","올리브오일","파슬리","소금","후추"],"cookTime":20,"nutrition":{"cal":320,"pro":10,"carb":44,"fat":10}},{"style":"🇹🇷 터키","name":"라흐마준","nameEn":"Lahmacun (Turkish Pizza)","type":"main","tags":[],"ingredients":["양고기 다짐육","밀가루","토마토","양파","파프리카","파슬리","마늘","커민","파프리카파우더","올리브오일","소금","레몬"],"cookTime":30,"nutrition":{"cal":270,"pro":12,"carb":38,"fat":8}},{"style":"🇹🇷 터키","name":"피데","nameEn":"Pide (Turkish Flatbread with Meat)","type":"main","tags":[],"ingredients":["밀가루","양고기 다짐육","토마토","피망","양파","마늘","계란","치즈","버터","소금","이스트"],"cookTime":40,"nutrition":{"cal":480,"pro":22,"carb":58,"fat":18}},{"style":"🇹🇷 터키","name":"쉬쉬케밥","nameEn":"Shish Kebab","type":"main","tags":[],"ingredients":["양고기 등심","양파","토마토","피망","마늘","올리브오일","커민","파프리카파우더","소금","후추","레몬"],"cookTime":25,"nutrition":{"cal":380,"pro":36,"carb":8,"fat":22}},{"style":"한식","name":"오이피클","nameEn":"Cucumber Pickle","type":"side","tags":["헬시"],"ingredients":["오이","식초","설탕","소금","마늘","월계수잎","통후추"],"cookTime":15,"nutrition":{"cal":55,"pro":1,"carb":13,"fat":0}},{"style":"한식","name":"당근피클","nameEn":"Carrot Pickle","type":"side","tags":["헬시"],"ingredients":["당근","식초","설탕","소금","마늘","월계수잎","통후추"],"cookTime":15,"nutrition":{"cal":50,"pro":1,"carb":12,"fat":0}},{"style":"한식","name":"양파피클","nameEn":"Onion Pickle","type":"side","tags":["헬시"],"ingredients":["양파","식초","설탕","소금","통후추","월계수잎"],"cookTime":10,"nutrition":{"cal":45,"pro":1,"carb":11,"fat":0}},{"style":"한식","name":"깍두기","nameEn":"Kkakdugi (Cubed Radish Kimchi)","type":"side","tags":["헬시"],"ingredients":["무","고춧가루","멸치액젓","새우젓","마늘","생강","쪽파","소금","설탕"],"cookTime":30,"nutrition":{"cal":38,"pro":1,"carb":8,"fat":0}},{"style":"한식","name":"백김치","nameEn":"Baek Kimchi (White Kimchi)","type":"side","tags":["헬시"],"ingredients":["배추","무","마늘","생강","쪽파","소금","배","잣"],"cookTime":40,"nutrition":{"cal":20,"pro":1,"carb":4,"fat":0}},{"style":"한식","name":"열무김치","nameEn":"Yeolmu Kimchi (Young Radish Kimchi)","type":"side","tags":["헬시"],"ingredients":["열무","고춧가루","멸치액젓","마늘","생강","쪽파","소금","찹쌀풀"],"cookTime":30,"nutrition":{"cal":32,"pro":2,"carb":5,"fat":0}},{"style":"한식","name":"마늘장아찌","nameEn":"Garlic Jangajji (Pickled Garlic)","type":"side","tags":[],"ingredients":["마늘","간장","식초","설탕","소금"],"cookTime":20,"nutrition":{"cal":64,"pro":3,"carb":13,"fat":0}},{"style":"한식","name":"깻잎장아찌","nameEn":"Perilla Leaf Jangajji","type":"side","tags":[],"ingredients":["깻잎","간장","식초","설탕","마늘","고춧가루","참기름","깨"],"cookTime":15,"nutrition":{"cal":40,"pro":1,"carb":6,"fat":1}},{"style":"한식","name":"무장아찌","nameEn":"Radish Jangajji (Pickled Radish)","type":"side","tags":["헬시"],"ingredients":["무","간장","식초","설탕","소금","마늘","고추"],"cookTime":20,"nutrition":{"cal":65,"pro":1,"carb":14,"fat":1}},{"style":"🇹🇭 태국","name":"미앙캄","nameEn":"Miang Kham (Thai Leaf Wrap Bites)","type":"main","tags":[],"ingredients":["호박잎","새우","코코넛","라임","생강","샬롯","고추","피시소스","설탕","땅콩"],"cookTime":20,"nutrition":{"cal":180,"pro":6,"carb":22,"fat":8}},{"style":"🇹🇭 태국","name":"타오후툿","nameEn":"Tao Hu Thot (Thai Fried Tofu)","type":"side","tags":["헬시"],"ingredients":["두부","전분","식용유","오이","고수","땅콩","스위트칠리소스","라임"],"cookTime":15,"nutrition":{"cal":220,"pro":12,"carb":18,"fat":12}},{"style":"🇹🇭 태국","name":"팟프릭킹","nameEn":"Phat Phrik Khing (Thai Dry Curry Stir-fry)","type":"main","tags":[],"ingredients":["돼지고기 앞다리살","껍질콩","레드커리페이스트","피시소스","설탕","카피르라임잎","식용유"],"cookTime":15,"nutrition":{"cal":260,"pro":20,"carb":10,"fat":16}},{"style":"🇮🇹 이탈리아","name":"브루스케타","nameEn":"Bruschetta","type":"side","tags":[],"ingredients":["바게트","토마토","마늘","바질","올리브오일","소금","후추","발사믹식초"],"cookTime":10,"nutrition":{"cal":180,"pro":4,"carb":24,"fat":8}},{"style":"🇺🇸 미국","name":"데블드에그","nameEn":"Deviled Eggs","type":"side","tags":["브런치"],"ingredients":["계란","마요네즈","디종머스타드","식초","소금","파프리카파우더","파슬리"],"cookTime":20,"nutrition":{"cal":140,"pro":8,"carb":1,"fat":12}},{"style":"🇺🇸 미국","name":"시저드레싱 샐러드","nameEn":"Caesar Salad","type":"side","tags":[],"ingredients":["로메인상추","파마산치즈","크루통","베이컨","마요네즈","마늘","레몬","우스터소스","앤초비","소금","후추"],"cookTime":15,"nutrition":{"cal":310,"pro":10,"carb":16,"fat":24}},{"style":"🇺🇸 미국","name":"포테이토 웨지","nameEn":"Potato Wedges","type":"side","tags":[],"ingredients":["감자","올리브오일","마늘파우더","파프리카파우더","소금","후추","파슬리","로즈마리"],"cookTime":35,"nutrition":{"cal":280,"pro":5,"carb":42,"fat":10}},{"style":"일식","name":"오히타시","nameEn":"Ohitashi (Japanese Boiled Greens)","type":"side","tags":["헬시"],"ingredients":["시금치","간장","미림","다시","참기름","깨"],"cookTime":10,"nutrition":{"cal":60,"pro":4,"carb":6,"fat":2}},{"style":"일식","name":"츠케모노","nameEn":"Tsukemono (Japanese Pickled Vegetables)","type":"side","tags":["헬시"],"ingredients":["오이","당근","무","소금","쌀식초","설탕","다시마","생강"],"cookTime":15,"nutrition":{"cal":35,"pro":1,"carb":8,"fat":0}},{"style":"일식","name":"냉두부","nameEn":"Hiyayakko (Cold Tofu)","type":"side","tags":["헬시"],"ingredients":["연두부","간장","미림","가다랑어포","대파","생강","깨","참기름"],"cookTime":5,"nutrition":{"cal":90,"pro":8,"carb":3,"fat":5}},{"style":"일식","name":"마제고항","nameEn":"Maze Gohan (Japanese Mixed Rice)","type":"side","tags":[],"ingredients":["쌀","우엉","당근","표고버섯","유부","간장","미림","청주","설탕","다시","참기름"],"cookTime":40,"nutrition":{"cal":260,"pro":6,"carb":48,"fat":4}},{"style":"일식","name":"고마아에","nameEn":"Goma-ae (Sesame Dressed Vegetables)","type":"side","tags":["헬시"],"ingredients":["시금치","참깨","간장","설탕","미림","다시"],"cookTime":10,"nutrition":{"cal":80,"pro":4,"carb":8,"fat":4}},{"style":"🇫🇷 프랑스","name":"비시스와즈","nameEn":"Vichyssoise (Cold Leek and Potato Soup)","type":"main","tags":["헬시"],"ingredients":["감자","대파","버터","생크림","치킨스톡","소금","후추","파슬리"],"cookTime":30,"nutrition":{"cal":160,"pro":3,"carb":18,"fat":9}},{"style":"일식","name":"히야야코","nameEn":"Hiyayakko (Cold Silken Tofu)","type":"side","tags":["헬시"],"ingredients":["연두부","간장","미림","가다랑어포","대파","생강","깨","참기름","미소"],"cookTime":5,"nutrition":{"cal":85,"pro":8,"carb":3,"fat":5}},{"style":"🇹🇭 태국","name":"얌팍붕","nameEn":"Yam Pak Bung (Thai Morning Glory Salad)","type":"side","tags":["헬시"],"ingredients":["공심채","마늘","고추","라임","피시소스","설탕","새우","고수"],"cookTime":10,"nutrition":{"cal":80,"pro":6,"carb":8,"fat":3}},{"style":"🇬🇷 그리스","name":"사가나키","nameEn":"Saganaki (Greek Fried Cheese)","type":"main","tags":[],"ingredients":["케팔로티리치즈","밀가루","올리브오일","레몬","후추","오레가노"],"cookTime":10,"nutrition":{"cal":290,"pro":14,"carb":8,"fat":22}},{"style":"🇬🇷 그리스","name":"멜리찬살라타","nameEn":"Melitzanosalata (Greek Eggplant Dip)","type":"side","tags":["헬시"],"ingredients":["가지","마늘","올리브오일","레몬","파슬리","소금","후추"],"cookTime":30,"nutrition":{"cal":120,"pro":2,"carb":12,"fat":8}},{"style":"🇬🇷 그리스","name":"파솔라다","nameEn":"Fasolada (Greek Bean Soup)","type":"main","tags":["헬시"],"ingredients":["흰강낭콩","토마토","당근","셀러리","양파","마늘","올리브오일","오레가노","소금","후추"],"cookTime":60,"nutrition":{"cal":180,"pro":9,"carb":28,"fat":5}},{"style":"🇪🇸 스페인","name":"파타타스 브라바스","nameEn":"Patatas Bravas","type":"side","tags":[],"ingredients":["감자","토마토","마늘","파프리카파우더","올리브오일","카옌느페퍼","소금","마요네즈"],"cookTime":30,"nutrition":{"cal":271,"pro":3,"carb":26,"fat":18}},{"style":"🇪🇸 스페인","name":"판콘토마테","nameEn":"Pan con Tomate (Bread with Tomato)","type":"side","tags":[],"ingredients":["바게트","토마토","마늘","올리브오일","소금"],"cookTime":5,"nutrition":{"cal":190,"pro":4,"carb":28,"fat":8}},{"style":"🇪🇸 스페인","name":"감바스 알 아히요","nameEn":"Gambas al Ajillo (Garlic Shrimp)","type":"side","tags":["헬시"],"ingredients":["새우","마늘","올리브오일","고추","파슬리","소금","레몬"],"cookTime":10,"nutrition":{"cal":220,"pro":20,"carb":2,"fat":14}},{"style":"🇪🇸 스페인","name":"크로케타스","nameEn":"Croquetas (Spanish Croquettes)","type":"side","tags":[],"ingredients":["햄","밀가루","버터","우유","계란","빵가루","식용유","소금","후추","넛맥"],"cookTime":40,"nutrition":{"cal":280,"pro":10,"carb":24,"fat":16}},{"style":"🇪🇸 스페인","name":"엔살라다 올리비에르","nameEn":"Ensalada Rusa (Spanish Potato Salad)","type":"side","tags":[],"ingredients":["감자","당근","완두콩","계란","참치캔","마요네즈","소금","후추","레몬"],"cookTime":25,"nutrition":{"cal":230,"pro":8,"carb":22,"fat":13}},{"style":"🇪🇸 스페인","name":"초리소 타파스","nameEn":"Chorizo Tapas","type":"side","tags":[],"ingredients":["초리소","마늘","올리브오일","화이트와인","파슬리","빵"],"cookTime":10,"nutrition":{"cal":260,"pro":12,"carb":8,"fat":20}},{"style":"🇪🇸 스페인","name":"바칼라오 프리토","nameEn":"Bacalao Frito (Fried Salt Cod)","type":"side","tags":[],"ingredients":["염장대구","밀가루","계란","마늘","파슬리","올리브오일","레몬","소금"],"cookTime":25,"nutrition":{"cal":240,"pro":24,"carb":12,"fat":10}},{"style":"🇲🇽 멕시코","name":"엘로테","nameEn":"Elote (Mexican Street Corn)","type":"side","tags":[],"ingredients":["옥수수","마요네즈","코티하치즈","라임","칠리파우더","고수","소금"],"cookTime":15,"nutrition":{"cal":230,"pro":6,"carb":28,"fat":12}},{"style":"🇲🇽 멕시코","name":"프리홀레스 레프리토스","nameEn":"Frijoles Refritos (Refried Beans)","type":"side","tags":["헬시"],"ingredients":["핀토콩","라드","양파","마늘","소금","커민","고추"],"cookTime":30,"nutrition":{"cal":200,"pro":10,"carb":28,"fat":7}},{"style":"🇲🇽 멕시코","name":"살사 베르데","nameEn":"Salsa Verde","type":"side","tags":["헬시"],"ingredients":["토마티요","할라피뇨","양파","마늘","고수","라임","소금"],"cookTime":15,"nutrition":{"cal":40,"pro":1,"carb":8,"fat":1}},{"style":"🇲🇽 멕시코","name":"피코 데 가요","nameEn":"Pico de Gallo","type":"side","tags":["헬시"],"ingredients":["토마토","양파","할라피뇨","고수","라임","소금"],"cookTime":10,"nutrition":{"cal":35,"pro":1,"carb":7,"fat":0}},{"style":"🇲🇽 멕시코","name":"칠라킬레스","nameEn":"Chilaquiles","type":"main","tags":[],"ingredients":["또르티야","살사 로하","치킨","양파","크레마","코티하치즈","고수","계란","소금"],"cookTime":20,"nutrition":{"cal":320,"pro":14,"carb":36,"fat":14}},{"style":"🇲🇽 멕시코","name":"퀘사딜라","nameEn":"Quesadilla","type":"main","tags":[],"ingredients":["또르티야","체다치즈","모짜렐라치즈","피망","양파","소금","식용유"],"cookTime":10,"nutrition":{"cal":290,"pro":12,"carb":28,"fat":16}},{"style":"🇲🇽 멕시코","name":"나초스","nameEn":"Nachos","type":"main","tags":[],"ingredients":["나초칩","체다치즈","살사소스","할라피뇨","사워크림","과카몰레","고수"],"cookTime":10,"nutrition":{"cal":380,"pro":10,"carb":42,"fat":20}},{"style":"🇲🇽 멕시코","name":"멕시코식 라이스","nameEn":"Mexican Rice (Arroz Rojo)","type":"main","tags":[],"ingredients":["쌀","토마토","양파","마늘","치킨스톡","커민","소금","올리브오일"],"cookTime":25,"nutrition":{"cal":200,"pro":4,"carb":40,"fat":4}},{"style":"🇧🇷 브라질","name":"비낭냐","nameEn":"Vinagrete (Brazilian Vinaigrette Salsa)","type":"side","tags":["헬시"],"ingredients":["토마토","양파","피망","파슬리","식초","올리브오일","소금","후추"],"cookTime":10,"nutrition":{"cal":60,"pro":1,"carb":8,"fat":3}},{"style":"🇧🇷 브라질","name":"파로파","nameEn":"Farofa (Toasted Cassava Flour)","type":"side","tags":[],"ingredients":["카사바가루","버터","베이컨","양파","마늘","파슬리","소금"],"cookTime":15,"nutrition":{"cal":220,"pro":4,"carb":36,"fat":8}},{"style":"🇧🇷 브라질","name":"아카라제","nameEn":"Acarajé (Black-eyed Pea Fritters)","type":"side","tags":[],"ingredients":["강낭콩","새우","양파","마늘","카옌느페퍼","팜오일","소금"],"cookTime":30,"nutrition":{"cal":260,"pro":12,"carb":28,"fat":12}},{"style":"🇧🇷 브라질","name":"브라질식 쌀","nameEn":"Brazilian White Rice","type":"side","tags":[],"ingredients":["쌀","마늘","양파","올리브오일","소금","물"],"cookTime":20,"nutrition":{"cal":190,"pro":4,"carb":40,"fat":3}},{"style":"🇧🇷 브라질","name":"코우브 미나스","nameEn":"Couve Mineira (Sautéed Collard Greens)","type":"side","tags":["헬시"],"ingredients":["케일","마늘","올리브오일","소금","베이컨"],"cookTime":10,"nutrition":{"cal":80,"pro":4,"carb":6,"fat":5}},{"style":"🇧🇷 브라질","name":"투투 아 미네이라","nameEn":"Tutu à Mineira (Bean Purée)","type":"side","tags":["헬시"],"ingredients":["검정콩","카사바가루","베이컨","마늘","양파","소금","월계수잎"],"cookTime":30,"nutrition":{"cal":210,"pro":10,"carb":30,"fat":6}},{"style":"🇧🇷 브라질","name":"만디오카 프리타","nameEn":"Mandioca Frita (Fried Cassava)","type":"side","tags":[],"ingredients":["카사바","식용유","소금","파슬리","마늘"],"cookTime":20,"nutrition":{"cal":260,"pro":2,"carb":44,"fat":10}},{"style":"🇧🇷 브라질","name":"밀류 베르제","nameEn":"Milho Verde (Brazilian Creamed Corn)","type":"side","tags":[],"ingredients":["옥수수","버터","우유","소금","파슬리","치즈"],"cookTime":15,"nutrition":{"cal":180,"pro":4,"carb":28,"fat":7}},{"style":"🇷🇺 러시아","name":"비네그레트","nameEn":"Vinegret (Russian Beet Salad)","type":"side","tags":["헬시"],"ingredients":["비트","감자","당근","오이","양파","완두콩","식용유","식초","소금"],"cookTime":30,"nutrition":{"cal":120,"pro":3,"carb":20,"fat":4}},{"style":"🇷🇺 러시아","name":"셀료트카","nameEn":"Selyodka pod Shuboy (Herring Under Fur Coat)","type":"side","tags":[],"ingredients":["청어","감자","당근","비트","계란","마요네즈","양파","소금","후추"],"cookTime":40,"nutrition":{"cal":280,"pro":12,"carb":18,"fat":18}},{"style":"🇷🇺 러시아","name":"쿠탸","nameEn":"Kutya (Russian Wheat Berry Dish)","type":"side","tags":[],"ingredients":["밀","꿀","건포도","호두","양귀비씨","물"],"cookTime":60,"nutrition":{"cal":260,"pro":6,"carb":48,"fat":6}},{"style":"🇷🇺 러시아","name":"베레메쟈니","nameEn":"Beremezhaны (Russian Pickled Mushrooms)","type":"side","tags":["헬시"],"ingredients":["버섯","식초","마늘","딜","소금","통후추","월계수잎"],"cookTime":20,"nutrition":{"cal":45,"pro":3,"carb":6,"fat":1}},{"style":"🇷🇺 러시아","name":"샤시그라","nameEn":"Draniki (Potato Pancakes)","type":"side","tags":[],"ingredients":["감자","계란","밀가루","양파","소금","식용유","사워크림"],"cookTime":25,"nutrition":{"cal":200,"pro":5,"carb":28,"fat":8}},{"style":"🇷🇺 러시아","name":"그레치카","nameEn":"Grechka (Buckwheat Porridge)","type":"main","tags":["헬시"],"ingredients":["메밀","버터","소금","물","양파","버섯"],"cookTime":20,"nutrition":{"cal":180,"pro":6,"carb":34,"fat":4}},{"style":"🇷🇺 러시아","name":"오크로쉬카","nameEn":"Okroshka (Cold Russian Soup)","type":"main","tags":["헬시"],"ingredients":["오이","감자","계란","햄","무","대파","딜","케피르","소금","겨자"],"cookTime":20,"nutrition":{"cal":130,"pro":8,"carb":12,"fat":6}},{"style":"🇷🇺 러시아","name":"쿠쿠르자 필라프","nameEn":"Plov (Russian Pilaf)","type":"main","tags":[],"ingredients":["쌀","당근","양파","마늘","식용유","소금","커민","월계수잎"],"cookTime":40,"nutrition":{"cal":280,"pro":5,"carb":52,"fat":8}},{"style":"🇲🇦 모로코","name":"모로코 당근 샐러드","nameEn":"Moroccan Carrot Salad","type":"side","tags":["헬시"],"ingredients":["당근","커민","파프리카파우더","레몬","올리브오일","고수","마늘","소금","꿀"],"cookTime":15,"nutrition":{"cal":100,"pro":2,"carb":16,"fat":4}},{"style":"🇲🇦 모로코","name":"비스타리야","nameEn":"Bastilla (Moroccan Pastry)","type":"main","tags":[],"ingredients":["필로도우","닭고기","계란","아몬드","계피","설탕","버터","사프란","소금"],"cookTime":60,"nutrition":{"cal":320,"pro":16,"carb":28,"fat":18}},{"style":"🇲🇦 모로코","name":"모로코식 렌틸조림","nameEn":"Moroccan Lentil Stew","type":"main","tags":["헬시"],"ingredients":["렌틸콩","토마토","양파","마늘","커민","강황","파프리카파우더","올리브오일","소금"],"cookTime":30,"nutrition":{"cal":170,"pro":10,"carb":26,"fat":4}},{"style":"🇲🇦 모로코","name":"라노그","nameEn":"Rfissa (Moroccan Chicken and Lentil Dish)","type":"main","tags":[],"ingredients":["닭다리살","렌틸콩","양파","마늘","생강","강황","사프란","버터","소금","고수"],"cookTime":60,"nutrition":{"cal":280,"pro":22,"carb":20,"fat":12}},{"style":"🇲🇦 모로코","name":"재리그","nameEn":"Zarig (Moroccan Spiced Butter)","type":"side","tags":[],"ingredients":["버터","커민","파프리카파우더","고수씨","소금","마늘"],"cookTime":10,"nutrition":{"cal":90,"pro":0,"carb":1,"fat":10}},{"style":"🇲🇦 모로코","name":"모로코 비트샐러드","nameEn":"Moroccan Beet Salad","type":"side","tags":["헬시"],"ingredients":["비트","오렌지","민트","커민","올리브오일","레몬","소금","꿀"],"cookTime":30,"nutrition":{"cal":110,"pro":2,"carb":18,"fat":4}},{"style":"🇲🇦 모로코","name":"타불레 모로코","nameEn":"Moroccan Tabbouleh","type":"side","tags":["헬시"],"ingredients":["불구르","파슬리","민트","토마토","오이","레몬","올리브오일","소금","커민"],"cookTime":15,"nutrition":{"cal":130,"pro":4,"carb":20,"fat":5}},{"style":"🇬🇷 그리스","name":"피타 브레드","nameEn":"Pita Bread","type":"side","tags":[],"ingredients":["밀가루","이스트","올리브오일","소금","물"],"cookTime":30,"nutrition":{"cal":165,"pro":6,"carb":33,"fat":2}},{"style":"🇬🇷 그리스","name":"기로스 쏘스","nameEn":"Gyros Sauce","type":"side","tags":["헬시"],"ingredients":["그릭요거트","오이","마늘","딜","올리브오일","레몬","소금"],"cookTime":10,"nutrition":{"cal":80,"pro":5,"carb":4,"fat":4}},{"style":"🇬🇷 그리스","name":"그리스식 구운채소","nameEn":"Greek Roasted Vegetables","type":"side","tags":["헬시"],"ingredients":["가지","애호박","피망","양파","토마토","올리브오일","오레가노","마늘","소금","후추"],"cookTime":35,"nutrition":{"cal":120,"pro":3,"carb":14,"fat":7}},{"style":"🇲🇦 모로코","name":"모로코식 찐빵","nameEn":"Msemen (Moroccan Flatbread)","type":"side","tags":[],"ingredients":["밀가루","세몰리나","이스트","버터","소금","물"],"cookTime":30,"nutrition":{"cal":200,"pro":5,"carb":36,"fat":6}},{"style":"🇲🇾 말레이시아","name":"케라부 망고","nameEn":"Kerabu Mango (Malaysian Mango Salad)","type":"side","tags":["헬시"],"ingredients":["그린망고","붉은양파","고수","민트","땅콩","삼발","라임","피시소스","설탕"],"cookTime":10,"nutrition":{"cal":120,"pro":3,"carb":22,"fat":4}},{"style":"🇲🇾 말레이시아","name":"아차르","nameEn":"Acar (Malaysian Pickle)","type":"side","tags":["헬시"],"ingredients":["오이","당근","양배추","땅콩","식초","설탕","강황","소금","참기름"],"cookTime":20,"nutrition":{"cal":80,"pro":2,"carb":14,"fat":3}},{"style":"🇲🇾 말레이시아","name":"삼발 벨라찬","nameEn":"Sambal Belacan","type":"side","tags":[],"ingredients":["고추","새우페이스트","라임","설탕","소금","샬롯"],"cookTime":10,"nutrition":{"cal":60,"pro":2,"carb":8,"fat":2}},{"style":"🇲🇾 말레이시아","name":"케툽팟","nameEn":"Ketupat (Malaysian Compressed Rice)","type":"side","tags":[],"ingredients":["쌀","코코넛잎","소금","물"],"cookTime":60,"nutrition":{"cal":180,"pro":4,"carb":40,"fat":0}},{"style":"🇲🇾 말레이시아","name":"이칸빌리스","nameEn":"Ikan Bilis (Fried Anchovies)","type":"side","tags":[],"ingredients":["멸치","식용유","소금","설탕","고추"],"cookTime":10,"nutrition":{"cal":140,"pro":14,"carb":4,"fat":8}},{"style":"🇲🇾 말레이시아","name":"나시울람","nameEn":"Nasi Ulam (Herb Rice Salad)","type":"side","tags":["헬시"],"ingredients":["쌀","레몬그라스","강황잎","고수","민트","건새우","코코넛","샬롯","소금"],"cookTime":30,"nutrition":{"cal":210,"pro":5,"carb":42,"fat":3}},{"style":"🇲🇾 말레이시아","name":"파파담","nameEn":"Papadam","type":"side","tags":[],"ingredients":["렌틸가루","커민","소금","식용유","후추"],"cookTime":5,"nutrition":{"cal":50,"pro":2,"carb":8,"fat":2}},{"style":"🇲🇾 말레이시아","name":"꿍부부","nameEn":"Kerabu Taugeh (Bean Sprout Salad)","type":"side","tags":["헬시"],"ingredients":["숙주","건새우","코코넛","레몬그라스","라임","피시소스","고추","샬롯"],"cookTime":10,"nutrition":{"cal":90,"pro":5,"carb":10,"fat":4}},{"style":"🇲🇾 말레이시아","name":"루막","nameEn":"Serunding (Dry Meat Floss)","type":"side","tags":[],"ingredients":["소고기 우둔살","코코넛","레몬그라스","강황","고추","갈란갈","소금","설탕"],"cookTime":60,"nutrition":{"cal":200,"pro":18,"carb":8,"fat":12}},{"style":"🇮🇳 인도","name":"차파티","nameEn":"Chapati (Indian Flatbread)","type":"side","tags":[],"ingredients":["통밀가루","물","소금","버터"],"cookTime":20,"nutrition":{"cal":120,"pro":4,"carb":22,"fat":2}},{"style":"🇮🇳 인도","name":"달 타르카","nameEn":"Dal Tadka (Tempered Lentils)","type":"main","tags":["헬시"],"ingredients":["렌틸콩","양파","토마토","마늘","생강","커민","강황","고수","버터","소금"],"cookTime":30,"nutrition":{"cal":180,"pro":10,"carb":26,"fat":5}},{"style":"🇮🇳 인도","name":"망고 처트니","nameEn":"Mango Chutney","type":"side","tags":[],"ingredients":["망고","식초","설탕","생강","마늘","고추","커민","소금"],"cookTime":20,"nutrition":{"cal":80,"pro":0,"carb":20,"fat":0}},{"style":"🇮🇳 인도","name":"알루 고비","nameEn":"Aloo Gobi (Potato Cauliflower)","type":"main","tags":["헬시"],"ingredients":["감자","콜리플라워","양파","토마토","마늘","생강","강황","커민","고수","소금"],"cookTime":25,"nutrition":{"cal":150,"pro":4,"carb":24,"fat":5}},{"style":"🇮🇳 인도","name":"파니르 티카","nameEn":"Paneer Tikka","type":"main","tags":[],"ingredients":["파니르","요거트","고수","강황","고추파우더","커민","마늘","생강","레몬","소금"],"cookTime":30,"nutrition":{"cal":220,"pro":14,"carb":8,"fat":15}},{"style":"🇮🇳 인도","name":"나안","nameEn":"Naan Bread","type":"side","tags":[],"ingredients":["밀가루","요거트","이스트","버터","마늘","소금","우유"],"cookTime":30,"nutrition":{"cal":260,"pro":8,"carb":44,"fat":6}},{"style":"🇮🇳 인도","name":"바지","nameEn":"Bhaji (Onion Fritters)","type":"side","tags":[],"ingredients":["양파","병아리콩가루","고수","고추","커민","강황","소금","식용유"],"cookTime":15,"nutrition":{"cal":200,"pro":6,"carb":24,"fat":10}},{"style":"🇮🇳 인도","name":"쿠쿰베르 라이타","nameEn":"Cucumber Raita","type":"side","tags":["헬시"],"ingredients":["요거트","오이","커민","고수","민트","소금","설탕"],"cookTime":5,"nutrition":{"cal":70,"pro":4,"carb":8,"fat":2}},{"style":"🇹🇷 터키","name":"뮤젝리","nameEn":"Mücver (Turkish Zucchini Fritters)","type":"side","tags":[],"ingredients":["애호박","계란","페타치즈","딜","밀가루","소금","후추","식용유"],"cookTime":20,"nutrition":{"cal":180,"pro":8,"carb":14,"fat":11}},{"style":"🇹🇷 터키","name":"파틀리잔 살라타스","nameEn":"Patlıcan Salatası (Eggplant Salad)","type":"side","tags":["헬시"],"ingredients":["가지","요거트","마늘","올리브오일","레몬","파슬리","소금"],"cookTime":25,"nutrition":{"cal":100,"pro":3,"carb":12,"fat":5}},{"style":"🇹🇷 터키","name":"필라키","nameEn":"Pilaki (Turkish White Bean Salad)","type":"side","tags":["헬시"],"ingredients":["흰강낭콩","양파","당근","토마토","올리브오일","마늘","레몬","파슬리","소금"],"cookTime":30,"nutrition":{"cal":160,"pro":8,"carb":24,"fat":5}},{"style":"🇹🇷 터키","name":"카이막","nameEn":"Kaymak (Turkish Clotted Cream)","type":"side","tags":[],"ingredients":["생크림","우유"],"cookTime":60,"nutrition":{"cal":180,"pro":3,"carb":4,"fat":18}},{"style":"🇹🇷 터키","name":"아욕살라타","nameEn":"Cacık (Turkish Yogurt Dip)","type":"side","tags":["헬시"],"ingredients":["요거트","오이","마늘","딜","올리브오일","소금","민트"],"cookTime":10,"nutrition":{"cal":80,"pro":5,"carb":6,"fat":4}},{"style":"🇹🇷 터키","name":"빌릭베레크","nameEn":"Börek (Turkish Pastry)","type":"main","tags":[],"ingredients":["필로도우","페타치즈","시금치","계란","버터","소금"],"cookTime":40,"nutrition":{"cal":250,"pro":9,"carb":22,"fat":15}},{"style":"🇹🇷 터키","name":"에즈메","nameEn":"Ezme (Turkish Spicy Tomato Dip)","type":"side","tags":["헬시"],"ingredients":["토마토","양파","피망","고추","파슬리","올리브오일","레몬","커민","소금"],"cookTime":10,"nutrition":{"cal":60,"pro":2,"carb":10,"fat":3}},{"style":"🇹🇷 터키","name":"수막 샐러드","nameEn":"Sumac Onion Salad","type":"side","tags":["헬시"],"ingredients":["양파","수막","파슬리","레몬","올리브오일","소금"],"cookTime":5,"nutrition":{"cal":50,"pro":1,"carb":10,"fat":2}},{"style":"🇹🇷 터키","name":"터키식 쌀필라프","nameEn":"Turkish Rice Pilaf","type":"main","tags":[],"ingredients":["쌀","버터","치킨스톡","소금","후추","파슬리"],"cookTime":25,"nutrition":{"cal":220,"pro":4,"carb":44,"fat":4}},{"style":"🇫🇷 프랑스","name":"크루디테","nameEn":"Crudités (French Raw Vegetables)","type":"side","tags":["헬시"],"ingredients":["당근","셀러리","오이","래디시","피망","딥소스","소금"],"cookTime":10,"nutrition":{"cal":60,"pro":2,"carb":12,"fat":1}},{"style":"🇫🇷 프랑스","name":"그라탱 도피누아","nameEn":"Gratin Dauphinois (Potato Gratin)","type":"side","tags":[],"ingredients":["감자","생크림","마늘","그뤼에르치즈","버터","소금","후추","넛맥"],"cookTime":60,"nutrition":{"cal":320,"pro":8,"carb":28,"fat":20}},{"style":"🇫🇷 프랑스","name":"프렌치 어니언 수프","nameEn":"French Onion Soup","type":"main","tags":[],"ingredients":["양파","버터","소고기육수","화이트와인","바게트","그뤼에르치즈","타임","소금","후추"],"cookTime":50,"nutrition":{"cal":280,"pro":10,"carb":28,"fat":14}},{"style":"🇫🇷 프랑스","name":"비프 부르기뇽","nameEn":"Boeuf Bourguignon (Side Serving)","type":"main","tags":[],"ingredients":["소고기 갈비","레드와인","버섯","당근","양파","베이컨","마늘","타임","소금","후추"],"cookTime":120,"nutrition":{"cal":280,"pro":22,"carb":8,"fat":14}},{"style":"🇫🇷 프랑스","name":"피살라디에르","nameEn":"Pissaladière (French Onion Tart)","type":"side","tags":[],"ingredients":["밀가루","양파","올리브","앤초비","올리브오일","타임","소금","이스트"],"cookTime":60,"nutrition":{"cal":260,"pro":6,"carb":32,"fat":12}},{"style":"🇫🇷 프랑스","name":"타르타르 소스","nameEn":"Sauce Tartare","type":"side","tags":[],"ingredients":["마요네즈","피클","케이퍼","파슬리","디종머스타드","레몬","소금","후추"],"cookTime":5,"nutrition":{"cal":120,"pro":1,"carb":4,"fat":12}},{"style":"🇫🇷 프랑스","name":"리옹식 샐러드","nameEn":"Salade Lyonnaise","type":"side","tags":[],"ingredients":["치커리","베이컨","계란","식빵","디종머스타드","식초","올리브오일","소금","후추"],"cookTime":20,"nutrition":{"cal":240,"pro":12,"carb":10,"fat":18}},{"style":"🇫🇷 프랑스","name":"에스카르고","nameEn":"Escargot (Snails with Garlic Butter)","type":"main","tags":[],"ingredients":["달팽이","마늘버터","파슬리","화이트와인","소금","후추","버터","레몬"],"cookTime":20,"nutrition":{"cal":160,"pro":14,"carb":2,"fat":10}},{"style":"🇫🇷 프랑스","name":"크레페 살레","nameEn":"Savoury Crêpes","type":"main","tags":[],"ingredients":["밀가루","계란","우유","버터","소금","햄","치즈"],"cookTime":20,"nutrition":{"cal":220,"pro":10,"carb":24,"fat":10}},{"style":"🇮🇩 인도네시아","name":"크루푹","nameEn":"Krupuk (Indonesian Crackers)","type":"side","tags":[],"ingredients":["새우","전분","소금","식용유","설탕"],"cookTime":5,"nutrition":{"cal":100,"pro":3,"carb":14,"fat":4}},{"style":"🇮🇩 인도네시아","name":"삼발 마타","nameEn":"Sambal Matah (Balinese Raw Sambal)","type":"side","tags":["헬시"],"ingredients":["레몬그라스","샬롯","고추","라임","피시소스","코코넛오일","소금"],"cookTime":10,"nutrition":{"cal":70,"pro":1,"carb":8,"fat":4}},{"style":"🇮🇩 인도네시아","name":"우랍","nameEn":"Urap (Indonesian Seasoned Vegetables)","type":"side","tags":["헬시"],"ingredients":["시금치","숙주","코코넛","레몬그라스","갈란갈","강황","고추","라임","소금"],"cookTime":20,"nutrition":{"cal":120,"pro":4,"carb":10,"fat":7}},{"style":"🇮🇩 인도네시아","name":"페르케델","nameEn":"Perkedel (Indonesian Potato Patty)","type":"side","tags":[],"ingredients":["감자","계란","대파","셀러리","육두구","소금","후추","식용유"],"cookTime":20,"nutrition":{"cal":160,"pro":4,"carb":20,"fat":8}},{"style":"🇮🇩 인도네시아","name":"롤라크","nameEn":"Lodeh (Indonesian Vegetable Curry)","type":"main","tags":["헬시"],"ingredients":["가지","두부","템페","콜리플라워","코코넛밀크","레몬그라스","갈란갈","강황","소금"],"cookTime":25,"nutrition":{"cal":160,"pro":6,"carb":12,"fat":10}},{"style":"🇮🇩 인도네시아","name":"삼발 오엘렉","nameEn":"Sambal Oelek","type":"side","tags":[],"ingredients":["고추","마늘","식초","소금","설탕"],"cookTime":10,"nutrition":{"cal":30,"pro":1,"carb":6,"fat":0}},{"style":"🇮🇩 인도네시아","name":"케루풍","nameEn":"Kerupuk Udang (Prawn Crackers)","type":"side","tags":[],"ingredients":["새우","전분","마늘","소금","식용유"],"cookTime":5,"nutrition":{"cal":110,"pro":4,"carb":14,"fat":5}},{"style":"🇮🇩 인도네시아","name":"발리식 미고랭","nameEn":"Bali-style Mi Goreng Side","type":"side","tags":[],"ingredients":["에그누들","달걀","새우","케찹마니스","삼발","마늘","샬롯","식용유","소금"],"cookTime":15,"nutrition":{"cal":200,"pro":8,"carb":28,"fat":7}},{"style":"🌙 중동","name":"훔무스","nameEn":"Hummus","type":"side","tags":["헬시"],"ingredients":["병아리콩","타히니","마늘","레몬","올리브오일","소금","커민","파프리카파우더"],"cookTime":15,"nutrition":{"cal":170,"pro":8,"carb":18,"fat":8}},{"style":"🌙 중동","name":"중동식 타불레","nameEn":"Middle Eastern Tabbouleh","type":"side","tags":["헬시"],"ingredients":["불구르","파슬리","민트","토마토","오이","레몬","올리브오일","소금"],"cookTime":15,"nutrition":{"cal":130,"pro":4,"carb":20,"fat":5}},{"style":"🌙 중동","name":"바바가누쉬","nameEn":"Baba Ghanoush","type":"side","tags":["헬시"],"ingredients":["가지","타히니","마늘","레몬","올리브오일","소금","파슬리","파프리카파우더"],"cookTime":30,"nutrition":{"cal":130,"pro":4,"carb":14,"fat":7}},{"style":"🌙 중동","name":"피타 브레드 중동","nameEn":"Middle Eastern Pita Bread","type":"side","tags":[],"ingredients":["밀가루","이스트","올리브오일","소금","설탕","물"],"cookTime":30,"nutrition":{"cal":165,"pro":6,"carb":33,"fat":2}},{"style":"🌙 중동","name":"무타발","nameEn":"Mutabal (Smoky Eggplant Dip)","type":"side","tags":["헬시"],"ingredients":["가지","요거트","타히니","마늘","레몬","올리브오일","소금","석류씨"],"cookTime":30,"nutrition":{"cal":110,"pro":4,"carb":10,"fat":6}},{"style":"🌙 중동","name":"만퀴쉬","nameEn":"Manakish (Za'atar Flatbread)","type":"side","tags":[],"ingredients":["밀가루","이스트","자타르","올리브오일","소금","물"],"cookTime":25,"nutrition":{"cal":210,"pro":5,"carb":32,"fat":8}},{"style":"🌙 중동","name":"라이탄 비타히나","nameEn":"Labneh (Strained Yogurt Dip)","type":"side","tags":["헬시"],"ingredients":["요거트","올리브오일","자타르","소금","오레가노"],"cookTime":5,"nutrition":{"cal":90,"pro":6,"carb":4,"fat":6}},{"style":"🌙 중동","name":"무하마라","nameEn":"Muhammara (Red Pepper Walnut Dip)","type":"side","tags":["헬시"],"ingredients":["홍피망","호두","빵가루","석류시럽","커민","올리브오일","레몬","소금","고추"],"cookTime":20,"nutrition":{"cal":160,"pro":4,"carb":14,"fat":10}},{"style":"🇵🇭 필리핀","name":"판싯 칸톤","nameEn":"Pancit Canton (Filipino Stir-fry Noodles)","type":"main","tags":[],"ingredients":["에그누들","닭고기","새우","당근","양배추","피시소스","간장","마늘","소금"],"cookTime":20,"nutrition":{"cal":280,"pro":14,"carb":38,"fat":8}},{"style":"🇵🇭 필리핀","name":"루미야","nameEn":"Lumpiang Shanghai (Filipino Spring Rolls)","type":"side","tags":[],"ingredients":["돼지고기 다짐육","당근","양파","마늘","춘권피","계란","소금","후추","식용유"],"cookTime":25,"nutrition":{"cal":220,"pro":12,"carb":20,"fat":10}},{"style":"🇵🇭 필리핀","name":"씨나강","nameEn":"Sinangag (Filipino Garlic Fried Rice)","type":"main","tags":[],"ingredients":["쌀","마늘","계란","식용유","소금","파"],"cookTime":10,"nutrition":{"cal":240,"pro":6,"carb":44,"fat":5}},{"style":"🇵🇭 필리핀","name":"팡깃","nameEn":"Ensaladang Mangga (Green Mango Salad)","type":"side","tags":["헬시"],"ingredients":["그린망고","토마토","양파","새우페이스트","소금","라임"],"cookTime":10,"nutrition":{"cal":80,"pro":2,"carb":18,"fat":1}},{"style":"🇵🇭 필리핀","name":"치키레모스","nameEn":"Chicharon (Pork Crackling)","type":"side","tags":[],"ingredients":["돼지껍질","소금","식용유","식초","마늘"],"cookTime":60,"nutrition":{"cal":300,"pro":18,"carb":0,"fat":24}},{"style":"🇵🇭 필리핀","name":"푸또","nameEn":"Puto (Filipino Steamed Rice Cake)","type":"side","tags":[],"ingredients":["쌀가루","설탕","우유","계란","베이킹파우더","버터","소금","치즈"],"cookTime":30,"nutrition":{"cal":180,"pro":4,"carb":32,"fat":5}},{"style":"🇵🇭 필리핀","name":"팟식","nameEn":"Paksiw na Isda (Fish in Vinegar)","type":"main","tags":["헬시"],"ingredients":["생선","식초","마늘","생강","소금","후추","월계수잎","피시소스"],"cookTime":20,"nutrition":{"cal":120,"pro":18,"carb":2,"fat":4}},{"style":"🇵🇭 필리핀","name":"깡꽁 아도보","nameEn":"Kangkong Adobo (Water Spinach)","type":"side","tags":["헬시"],"ingredients":["공심채","마늘","식초","간장","소금","후추","식용유"],"cookTime":10,"nutrition":{"cal":70,"pro":3,"carb":6,"fat":4}},{"style":"🇵🇭 필리핀","name":"아초에","nameEn":"Achara (Filipino Papaya Pickle)","type":"side","tags":["헬시"],"ingredients":["그린파파야","당근","피망","식초","설탕","소금","마늘","생강"],"cookTime":20,"nutrition":{"cal":60,"pro":1,"carb":14,"fat":0}},{"style":"🇸🇬 싱가포르","name":"차 쿼이 테오","nameEn":"Char Kway Teow Side","type":"main","tags":[],"ingredients":["쌀국수","숙주","새우","계란","간장","새우페이스트","파","식용유"],"cookTime":10,"nutrition":{"cal":200,"pro":8,"carb":28,"fat":8}},{"style":"🇸🇬 싱가포르","name":"시오 박호","nameEn":"Sio Bak Hoh (Crispy Roast Pork)","type":"side","tags":[],"ingredients":["돼지 삼겹살","오향분","소금","식초","소금","후추"],"cookTime":90,"nutrition":{"cal":280,"pro":18,"carb":2,"fat":22}},{"style":"🇸🇬 싱가포르","name":"로작","nameEn":"Rojak (Singaporean Fruit Salad)","type":"side","tags":["헬시"],"ingredients":["파인애플","파파야","오이","두부","숙주","새우페이스트","타마린드","설탕","땅콩","소금"],"cookTime":15,"nutrition":{"cal":160,"pro":5,"carb":26,"fat":5}},{"style":"🇸🇬 싱가포르","name":"포피아","nameEn":"Popiah (Singapore Spring Roll)","type":"side","tags":[],"ingredients":["춘권피","순무","당근","새우","두부","계란","달콤한간장","땅콩","고수","마늘"],"cookTime":30,"nutrition":{"cal":180,"pro":8,"carb":24,"fat":6}},{"style":"🇸🇬 싱가포르","name":"미 고랭","nameEn":"Mee Goreng (Singaporean Fried Noodles)","type":"main","tags":[],"ingredients":["에그누들","두부","새우","숙주","토마토소스","칠리소스","계란","마늘","소금"],"cookTime":15,"nutrition":{"cal":340,"pro":14,"carb":48,"fat":10}},{"style":"🇸🇬 싱가포르","name":"차 시우 바오","nameEn":"Char Siu Bao (BBQ Pork Bun)","type":"side","tags":[],"ingredients":["돼지고기 목살","밀가루","설탕","이스트","굴소스","간장","참기름","베이킹파우더"],"cookTime":60,"nutrition":{"cal":260,"pro":10,"carb":38,"fat":8}},{"style":"🇸🇬 싱가포르","name":"참새꽃빵","nameEn":"Lo Mai Gai (Glutinous Rice in Lotus Leaf)","type":"side","tags":[],"ingredients":["찹쌀","닭고기","표고버섯","중국소시지","간장","굴소스","참기름","연잎"],"cookTime":60,"nutrition":{"cal":320,"pro":14,"carb":48,"fat":10}},{"style":"🇸🇬 싱가포르","name":"생강소스","nameEn":"Ginger Sauce (for Chicken Rice)","type":"side","tags":["헬시"],"ingredients":["생강","마늘","라임","참기름","소금","설탕"],"cookTime":5,"nutrition":{"cal":40,"pro":1,"carb":6,"fat":2}},{"style":"🇵🇪 페루","name":"파파 아 라 후안카이나","nameEn":"Papa a la Huancaína (Peruvian Potatoes)","type":"side","tags":[],"ingredients":["감자","아마리요페퍼","페타치즈","크래커","우유","올리브오일","소금","계란","올리브"],"cookTime":25,"nutrition":{"cal":280,"pro":8,"carb":32,"fat":14}},{"style":"🇵🇪 페루","name":"피카 디 팔타","nameEn":"Palta Rellena (Stuffed Avocado)","type":"side","tags":["헬시"],"ingredients":["아보카도","닭고기","마요네즈","셀러리","레몬","소금","후추","토마토"],"cookTime":20,"nutrition":{"cal":260,"pro":14,"carb":6,"fat":20}},{"style":"🇵🇪 페루","name":"솔테라","nameEn":"Solterito (Peruvian Bean Salad)","type":"side","tags":["헬시"],"ingredients":["리마빈","옥수수","퀘소프레스코","토마토","올리브","고추","식초","올리브오일","소금"],"cookTime":15,"nutrition":{"cal":180,"pro":8,"carb":22,"fat":8}},{"style":"🇵🇪 페루","name":"칸차","nameEn":"Cancha (Peruvian Toasted Corn)","type":"side","tags":[],"ingredients":["초초클로옥수수","식용유","소금"],"cookTime":10,"nutrition":{"cal":160,"pro":4,"carb":28,"fat":5}},{"style":"🇵🇪 페루","name":"피카 마라니야","nameEn":"Crema de Rocoto (Peruvian Pepper Cream)","type":"side","tags":[],"ingredients":["로코토페퍼","마요네즈","퀘소프레스코","우유","소금","마늘"],"cookTime":15,"nutrition":{"cal":120,"pro":3,"carb":6,"fat":10}},{"style":"🇵🇪 페루","name":"페루식 쌀","nameEn":"Arroz Peruano (Peruvian Rice)","type":"side","tags":[],"ingredients":["쌀","마늘","식용유","소금","물","레몬"],"cookTime":20,"nutrition":{"cal":190,"pro":4,"carb":40,"fat":3}},{"style":"🇵🇪 페루","name":"야우사","nameEn":"Causa Rellena (Peruvian Potato Terrine)","type":"side","tags":[],"ingredients":["감자","노란페퍼","라임","올리브오일","참치캔","마요네즈","아보카도","소금"],"cookTime":30,"nutrition":{"cal":240,"pro":10,"carb":28,"fat":12}},{"style":"🇵🇪 페루","name":"엔살라다 데 팔타","nameEn":"Ensalada de Palta (Avocado Salad)","type":"side","tags":["헬시"],"ingredients":["아보카도","토마토","양파","고수","라임","소금","올리브오일"],"cookTime":10,"nutrition":{"cal":150,"pro":2,"carb":10,"fat":12}},{"style":"🇵🇪 페루","name":"치파 볶음밥","nameEn":"Arroz Chaufa (Peruvian-Chinese Fried Rice)","type":"main","tags":[],"ingredients":["쌀","계란","대파","생강","간장","참기름","닭고기","식용유","소금"],"cookTime":15,"nutrition":{"cal":280,"pro":12,"carb":44,"fat":8}},{"style":"🇺🇸 미국","name":"코울슬로 크리미","nameEn":"Creamy Coleslaw","type":"side","tags":[],"ingredients":["양배추","당근","마요네즈","식초","설탕","소금","후추","셀러리씨"],"cookTime":10,"nutrition":{"cal":150,"pro":2,"carb":12,"fat":11}},{"style":"🇺🇸 미국","name":"포테이토 샐러드","nameEn":"American Potato Salad","type":"side","tags":[],"ingredients":["감자","계란","마요네즈","셀러리","피클","머스타드","양파","소금","후추","파슬리"],"cookTime":30,"nutrition":{"cal":260,"pro":6,"carb":28,"fat":14}},{"style":"🇺🇸 미국","name":"옥수수 빵","nameEn":"Cornbread","type":"side","tags":[],"ingredients":["옥수수가루","밀가루","계란","버터밀크","버터","설탕","소금","베이킹파우더"],"cookTime":30,"nutrition":{"cal":220,"pro":5,"carb":32,"fat":9}},{"style":"🇺🇸 미국","name":"그린빈 캐서롤","nameEn":"Green Bean Casserole","type":"side","tags":[],"ingredients":["껍질콩","버섯수프","우유","양파링","치즈","소금","후추"],"cookTime":40,"nutrition":{"cal":180,"pro":5,"carb":18,"fat":10}},{"style":"🇺🇸 미국","name":"갈릭 브레드","nameEn":"Garlic Bread","type":"side","tags":[],"ingredients":["바게트","마늘버터","파슬리","파마산치즈","소금"],"cookTime":15,"nutrition":{"cal":200,"pro":5,"carb":26,"fat":9}},{"style":"🇺🇸 미국","name":"맥앤치즈 사이드","nameEn":"Mac and Cheese Side","type":"side","tags":[],"ingredients":["마카로니","체다치즈","버터","우유","밀가루","소금","후추"],"cookTime":25,"nutrition":{"cal":300,"pro":10,"carb":36,"fat":14}},{"style":"🇺🇸 미국","name":"과카몰레 딥","nameEn":"Guacamole Dip","type":"side","tags":["헬시"],"ingredients":["아보카도","토마토","양파","라임","고수","소금","할라피뇨"],"cookTime":10,"nutrition":{"cal":150,"pro":2,"carb":10,"fat":12}},{"style":"🇺🇸 미국","name":"베이크드 빈스","nameEn":"Baked Beans","type":"side","tags":[],"ingredients":["흰강낭콩","베이컨","케첩","브라운슈거","머스타드","양파","소금","후추"],"cookTime":60,"nutrition":{"cal":200,"pro":8,"carb":34,"fat":5}},{"style":"🇺🇸 미국","name":"프렌치 온리언 딥","nameEn":"French Onion Dip","type":"side","tags":[],"ingredients":["양파","사워크림","마요네즈","마늘","소금","후추","파슬리"],"cookTime":20,"nutrition":{"cal":130,"pro":2,"carb":8,"fat":10}},{"style":"🇮🇹 이탈리아","name":"안티파스토 미스토","nameEn":"Antipasto Misto (Italian Appetiser Platter)","type":"side","tags":[],"ingredients":["프로슈토","살라미","올리브","아티초크","썬드라이토마토","모짜렐라","바질","올리브오일"],"cookTime":10,"nutrition":{"cal":280,"pro":14,"carb":6,"fat":22}},{"style":"🇮🇹 이탈리아","name":"인살라타 카프레제","nameEn":"Insalata Caprese","type":"side","tags":["헬시"],"ingredients":["모짜렐라","토마토","바질","올리브오일","소금","후추","발사믹"],"cookTime":5,"nutrition":{"cal":200,"pro":12,"carb":6,"fat":14}},{"style":"🇮🇹 이탈리아","name":"브루스케타 이탈리아나","nameEn":"Bruschetta Italiana","type":"side","tags":[],"ingredients":["바게트","토마토","바질","마늘","올리브오일","소금","후추","발사믹"],"cookTime":10,"nutrition":{"cal":170,"pro":4,"carb":24,"fat":7}},{"style":"🇮🇹 이탈리아","name":"인살라타 루콜라","nameEn":"Rucola Salad (Arugula Salad)","type":"side","tags":["헬시"],"ingredients":["루꼴라","파마산치즈","레몬","올리브오일","소금","후추","체리토마토"],"cookTime":5,"nutrition":{"cal":120,"pro":5,"carb":4,"fat":10}},{"style":"🇮🇹 이탈리아","name":"수프리미","nameEn":"Supplì (Roman Fried Rice Balls)","type":"side","tags":[],"ingredients":["쌀","토마토소스","모짜렐라","계란","빵가루","식용유","파마산치즈","소금"],"cookTime":40,"nutrition":{"cal":260,"pro":9,"carb":32,"fat":11}},{"style":"🇮🇹 이탈리아","name":"올리브 아스콜라나","nameEn":"Olive all'Ascolana (Stuffed Fried Olives)","type":"side","tags":[],"ingredients":["그린올리브","소고기 다짐육","파마산치즈","계란","빵가루","식용유","소금","레몬"],"cookTime":30,"nutrition":{"cal":220,"pro":8,"carb":16,"fat":14}},{"style":"🇮🇹 이탈리아","name":"베르두레 그리글리아테","nameEn":"Verdure Grigliate (Grilled Vegetables)","type":"side","tags":["헬시"],"ingredients":["가지","애호박","피망","아스파라거스","올리브오일","마늘","소금","후추","바질"],"cookTime":20,"nutrition":{"cal":100,"pro":3,"carb":12,"fat":5}},{"style":"🇮🇳 인도","name":"아차르 망고","nameEn":"Achar Mango (Indian Mango Pickle)","type":"side","tags":[],"ingredients":["그린망고","머스타드씨","커큐민","커민","소금","칠리파우더","식용유"],"cookTime":15,"nutrition":{"cal":60,"pro":1,"carb":10,"fat":3}},{"style":"🇫🇷 프랑스","name":"뇨키 파리지앵","nameEn":"Gnocchi Parisienne","type":"main","tags":[],"ingredients":["밀가루","버터","계란","그뤼에르치즈","우유","소금","후추","넛맥"],"cookTime":30,"nutrition":{"cal":240,"pro":9,"carb":24,"fat":13}},{"style":"🇮🇩 인도네시아","name":"나시 쿠닝","nameEn":"Nasi Kuning (Yellow Turmeric Rice)","type":"main","tags":[],"ingredients":["쌀","코코넛밀크","강황","레몬그라스","갈란갈","월계수잎","소금"],"cookTime":30,"nutrition":{"cal":220,"pro":4,"carb":44,"fat":4}},{"style":"🌙 중동","name":"마무울","nameEn":"Ma'amoul (Middle Eastern Stuffed Cookies)","type":"side","tags":[],"ingredients":["세몰리나","버터","설탕","대추야자","피스타치오","장미수","소금"],"cookTime":45,"nutrition":{"cal":180,"pro":3,"carb":26,"fat":8}},{"style":"🇮🇹 이탈리아","name":"피아디나","nameEn":"Piadina (Italian Flatbread)","type":"side","tags":[],"ingredients":["밀가루","라드","소금","베이킹소다","물"],"cookTime":20,"nutrition":{"cal":190,"pro":5,"carb":32,"fat":6}},{"style":"🇮🇹 이탈리아","name":"인살라타 판자넬라","nameEn":"Panzanella (Tuscan Bread Salad)","type":"side","tags":["헬시"],"ingredients":["바게트","토마토","오이","적양파","바질","올리브오일","레드와인식초","소금","후추"],"cookTime":15,"nutrition":{"cal":180,"pro":4,"carb":26,"fat":8}},{"style":"일식","name":"가케우동","nameEn":"Kake Udon (Basic Udon in Broth)","type":"main","tags":[],"ingredients":["우동면","다시","간장","미림","소금","대파","가다랑어포","나루토"],"cookTime":15,"nutrition":{"cal":360,"pro":10,"carb":72,"fat":4}},{"style":"일식","name":"붓카케우동","nameEn":"Bukkake Udon (Cold Udon with Sauce)","type":"main","tags":[],"ingredients":["우동면","간장","미림","다시","무","대파","생강","가다랑어포","참기름","깨"],"cookTime":15,"nutrition":{"cal":468,"pro":14,"carb":82,"fat":8}},{"style":"일식","name":"모리소바","nameEn":"Mori Soba (Plain Cold Soba)","type":"main","tags":["헬시"],"ingredients":["메밀면","쯔유","간장","미림","다시","가다랑어포","대파","와사비"],"cookTime":15,"nutrition":{"cal":340,"pro":14,"carb":72,"fat":1}},{"style":"일식","name":"카케소바","nameEn":"Kake Soba (Hot Soba in Broth)","type":"main","tags":[],"ingredients":["메밀면","다시","간장","미림","소금","대파","가다랑어포","나루토"],"cookTime":15,"nutrition":{"cal":350,"pro":14,"carb":68,"fat":2}},{"style":"일식","name":"토로로소바","nameEn":"Tororo Soba (Soba with Grated Yam)","type":"main","tags":["헬시"],"ingredients":["메밀면","참마","쯔유","다시","간장","미림","대파","가다랑어포","김","와사비"],"cookTime":15,"nutrition":{"cal":380,"pro":15,"carb":76,"fat":2}},{"style":"일식","name":"텐자루소바","nameEn":"Tenzaru Soba (Cold Soba with Tempura)","type":"main","tags":[],"ingredients":["메밀면","새우튀김","야채튀김","쯔유","다시","간장","미림","대파","무","와사비","김"],"cookTime":25,"nutrition":{"cal":520,"pro":20,"carb":80,"fat":14}},{"style":"일식","name":"오로시소바","nameEn":"Oroshi Soba (Soba with Grated Daikon)","type":"main","tags":["헬시"],"ingredients":["메밀면","무","쯔유","다시","간장","미림","가다랑어포","대파","김","와사비"],"cookTime":15,"nutrition":{"cal":320,"pro":14,"carb":66,"fat":1}},{"style":"🇺🇸 미국","name":"검보","nameEn":"Gumbo","type":"main","tags":[],"ingredients":["닭다리살","안두이 소시지","새우","오크라","양파","셀러리","피망","마늘","토마토","밀가루","식용유","카옌느페퍼","타임","월계수잎","소금","쌀"],"cookTime":60,"nutrition":{"cal":350,"pro":22,"carb":20,"fat":14}},{"style":"🇺🇸 미국","name":"BBQ 폭립","nameEn":"BBQ Pork Ribs","type":"main","tags":[],"ingredients":["돼지 스페어립","BBQ소스","브라운슈거","파프리카파우더","마늘파우더","양파파우더","커민","소금","후추","카옌느페퍼"],"cookTime":180,"nutrition":{"cal":500,"pro":30,"carb":20,"fat":35}},{"style":"🇺🇸 미국","name":"사우던 프라이드 치킨","nameEn":"Southern Fried Chicken","type":"main","tags":[],"ingredients":["닭다리살","닭허벅지살","버터밀크","밀가루","파프리카파우더","마늘파우더","카옌느페퍼","소금","후추","식용유"],"cookTime":40,"nutrition":{"cal":490,"pro":34,"carb":28,"fat":26}},{"style":"🇺🇸 미국","name":"케이준 새우","nameEn":"Cajun Shrimp","type":"main","tags":["헬시"],"ingredients":["새우","버터","마늘","케이준시즈닝","파프리카파우더","카옌느페퍼","레몬","파슬리","소금","후추"],"cookTime":15,"nutrition":{"cal":280,"pro":28,"carb":4,"fat":16}},{"style":"🇺🇸 미국","name":"비스킷 앤 그레이비","nameEn":"Biscuits & Gravy","type":"main","tags":[],"ingredients":["밀가루","버터","버터밀크","베이킹파우더","소금","돼지고기 소시지 다짐육","우유","후추"],"cookTime":30,"nutrition":{"cal":630,"pro":23,"carb":52,"fat":29}},{"style":"🇺🇸 미국","name":"호핑 존","nameEn":"Hoppin' John","type":"main","tags":["헬시"],"ingredients":["블랙아이드피","쌀","베이컨","양파","셀러리","마늘","타임","월계수잎","소금","후추","치킨스톡"],"cookTime":45,"nutrition":{"cal":320,"pro":14,"carb":48,"fat":8}},{"style":"🇻🇳 베트남","name":"넴짜이","nameEn":"Nem Chay (Vietnamese Vegetarian Grilled Spring Rolls)","type":"main","tags":["헬시"],"ingredients":["라이스페이퍼","목이버섯","두부","당면","당근","숙주","대파","피시소스","소금","후추","식용유"],"cookTime":30,"nutrition":{"cal":280,"pro":10,"carb":36,"fat":10}},{"style":"🇬🇧 영국","name":"선데이 로스트","nameEn":"Sunday Roast","type":"main","cookTime":120,"tags":[],"ingredients":["소고기","감자","당근","양파","요크셔푸딩","그레이비소스","완두콩","로즈마리","소금","후추"],"nutrition":{"cal":680,"pro":42,"carb":48,"fat":28}},{"style":"🇬🇧 영국","name":"뱅어스 앤 매시","nameEn":"Bangers and Mash","type":"main","cookTime":35,"tags":[],"ingredients":["소시지","감자","양파","버터","우유","그레이비소스","소금","후추","머스타드"],"nutrition":{"cal":580,"pro":24,"carb":48,"fat":30}},{"style":"🇬🇧 영국","name":"스테이크 앤 키드니 파이","nameEn":"Steak and Kidney Pie","type":"main","cookTime":90,"tags":[],"ingredients":["소고기","콩팥","양파","버섯","밀가루","버터","비프스톡","우스터소스","소금","후추"],"nutrition":{"cal":620,"pro":38,"carb":42,"fat":28}},{"style":"🇬🇧 영국","name":"콘월 패스티","nameEn":"Cornish Pasty","type":"main","cookTime":60,"tags":[],"ingredients":["밀가루","소고기","감자","순무","양파","버터","소금","후추"],"nutrition":{"cal":480,"pro":22,"carb":52,"fat":20}},{"style":"🇬🇧 영국","name":"스코치 에그","nameEn":"Scotch Egg","type":"side","cookTime":30,"tags":["브런치"],"ingredients":["계란","소시지","밀가루","빵가루","식용유","머스타드","소금","후추"],"nutrition":{"cal":380,"pro":18,"carb":20,"fat":26}},{"style":"🇮🇪 아일랜드","name":"아이리시 브렉퍼스트","nameEn":"Irish Breakfast","type":"main","cookTime":30,"tags":[],"ingredients":["베이컨","소시지","계란","블랙푸딩","토마토","버섯","식빵","버터","소금","후추"],"nutrition":{"cal":720,"pro":36,"carb":38,"fat":42}},{"style":"🇮🇪 아일랜드","name":"콜캐넌","nameEn":"Colcannon","type":"side","cookTime":30,"tags":[],"ingredients":["감자","양배추","버터","우유","대파","소금","후추"],"nutrition":{"cal":280,"pro":6,"carb":40,"fat":12}},{"style":"🇮🇪 아일랜드","name":"더블린 코들","nameEn":"Dublin Coddle","type":"main","cookTime":90,"tags":[],"ingredients":["소시지","베이컨","감자","양파","파슬리","치킨스톡","소금","후추"],"nutrition":{"cal":520,"pro":28,"carb":36,"fat":26}},{"style":"🇮🇪 아일랜드","name":"소다 브레드","nameEn":"Soda Bread","type":"side","cookTime":45,"tags":[],"ingredients":["밀가루","베이킹소다","버터밀크","소금","버터"],"nutrition":{"cal":220,"pro":6,"carb":38,"fat":5}},{"style":"🇮🇪 아일랜드","name":"비프 앤 기네스 스튜","nameEn":"Beef and Guinness Stew","type":"main","cookTime":120,"tags":[],"ingredients":["소고기","기네스맥주","감자","당근","양파","마늘","토마토소스","타임","월계수잎","소금","후추"],"nutrition":{"cal":480,"pro":34,"carb":28,"fat":18}},{"style":"🇪🇸 스페인","name":"보케로네스 엔 비나그레","nameEn":"Boquerones en Vinagre","type":"side","cookTime":20,"tags":["헬시"],"ingredients":["멸치","식초","마늘","파슬리","올리브오일","소금"],"nutrition":{"cal":180,"pro":18,"carb":2,"fat":11}},{"style":"🇪🇸 스페인","name":"찰루피냐스","nameEn":"Chalupinas","type":"side","cookTime":20,"tags":[],"ingredients":["또르티야","돼지고기","살사소스","치즈","양파","고수","소금"],"nutrition":{"cal":280,"pro":14,"carb":28,"fat":13}},{"style":"🇪🇸 스페인","name":"핀초스 모루노스","nameEn":"Pinchos Morunos","type":"main","cookTime":25,"tags":["헬시"],"ingredients":["돼지고기","커민","파프리카파우더","마늘","올리브오일","레몬","소금","후추","오레가노"],"nutrition":{"cal":290,"pro":28,"carb":4,"fat":18}},{"style":"🇪🇸 스페인","name":"에스파라고스 알라 플란차","nameEn":"Espárragos a la Plancha","type":"side","cookTime":15,"tags":["헬시"],"ingredients":["아스파라거스","올리브오일","마늘","레몬","소금","후추"],"nutrition":{"cal":80,"pro":4,"carb":6,"fat":5}},{"style":"🇪🇸 스페인","name":"체리소 에이다르고","nameEn":"Chorizo al Sidra","type":"side","cookTime":20,"tags":[],"ingredients":["초리소","사이다","양파","마늘","파슬리","올리브오일"],"nutrition":{"cal":340,"pro":16,"carb":8,"fat":26}},{"style":"🇪🇸 스페인","name":"코치니요 아사도","nameEn":"Cochinillo Asado","type":"main","cookTime":180,"tags":[],"ingredients":["새끼돼지","마늘","로즈마리","올리브오일","소금","후추","화이트와인","레몬"],"nutrition":{"cal":560,"pro":42,"carb":2,"fat":42}},{"style":"🇪🇸 스페인","name":"파에야 네그라","nameEn":"Paella Negra","type":"main","cookTime":45,"tags":[],"ingredients":["쌀","오징어","오징어먹물","새우","양파","마늘","토마토","올리브오일","강황","소금","파슬리"],"nutrition":{"cal":480,"pro":26,"carb":62,"fat":12}},{"style":"🇪🇸 스페인","name":"메히요네스 알 바포르","nameEn":"Mejillones al Vapor","type":"side","cookTime":15,"tags":["헬시"],"ingredients":["홍합","화이트와인","마늘","파슬리","레몬","올리브오일","소금"],"nutrition":{"cal":160,"pro":18,"carb":6,"fat":6}},{"style":"🇪🇸 스페인","name":"랑고스티노스 알라 플란차","nameEn":"Langostinos a la Plancha","type":"main","cookTime":15,"tags":["헬시"],"ingredients":["새우","마늘","올리브오일","레몬","파슬리","소금","후추"],"nutrition":{"cal":200,"pro":28,"carb":2,"fat":9}},{"style":"🇪🇸 스페인","name":"칼데레타 데 마리스코스","nameEn":"Caldereta de Mariscos","type":"main","cookTime":40,"tags":[],"ingredients":["새우","오징어","홍합","감자","토마토","양파","마늘","올리브오일","파프리카파우더","사프란","소금"],"nutrition":{"cal":320,"pro":28,"carb":22,"fat":12}},{"style":"🇪🇸 스페인","name":"토르티야 핑거","nameEn":"Tortilla Fingers","type":"side","cookTime":25,"tags":[],"ingredients":["계란","감자","양파","올리브오일","소금","후추"],"nutrition":{"cal":220,"pro":9,"carb":18,"fat":13}},{"style":"🇪🇸 스페인","name":"베렌헤나스 콘 미엘","nameEn":"Berenjenas con Miel","type":"side","cookTime":20,"tags":[],"ingredients":["가지","꿀","밀가루","식용유","소금","파슬리"],"nutrition":{"cal":260,"pro":3,"carb":36,"fat":12}},{"style":"🇪🇸 스페인","name":"감바스 필필","nameEn":"Gambas Pil Pil","type":"side","cookTime":15,"tags":["헬시"],"ingredients":["새우","마늘","올리브오일","고추","파슬리","소금","레몬"],"nutrition":{"cal":220,"pro":20,"carb":2,"fat":14}},{"style":"🇪🇸 스페인","name":"푸에로스 알라 비나그레타","nameEn":"Puerros a la Vinagreta","type":"side","cookTime":25,"tags":["헬시"],"ingredients":["대파","식초","올리브오일","머스타드","계란","파슬리","소금","후추"],"nutrition":{"cal":130,"pro":3,"carb":10,"fat":9}},{"style":"🇪🇸 스페인","name":"알본디가스 엔 살사","nameEn":"Albóndigas en Salsa","type":"main","cookTime":40,"tags":[],"ingredients":["소고기","양파","마늘","계란","빵가루","토마토소스","파슬리","커민","소금","후추","올리브오일"],"nutrition":{"cal":360,"pro":24,"carb":18,"fat":22}},{"style":"🇵🇹 포르투갈","name":"프란세지냐","nameEn":"Francesinha","type":"main","cookTime":40,"tags":[],"ingredients":["식빵","햄","소시지","소고기","치즈","토마토소스","맥주","소금","후추","버터"],"nutrition":{"cal":680,"pro":38,"carb":42,"fat":36}},{"style":"🇵🇹 포르투갈","name":"파스텔 드 나타","nameEn":"Pastel de Nata","type":"side","cookTime":35,"tags":[],"ingredients":["밀가루","버터","계란","우유","설탕","계피","소금","바닐라"],"nutrition":{"cal":280,"pro":5,"carb":34,"fat":14}},{"style":"🇵🇹 포르투갈","name":"아메이조아스 아 불량","nameEn":"Ameijoas à Bulhão Pato","type":"side","cookTime":15,"tags":["헬시"],"ingredients":["바지락","마늘","고수","올리브오일","화이트와인","레몬","소금"],"nutrition":{"cal":180,"pro":20,"carb":4,"fat":8}},{"style":"🇵🇹 포르투갈","name":"폴보 아 라가레이루","nameEn":"Polvo à Lagareiro","type":"main","cookTime":60,"tags":["헬시"],"ingredients":["문어","감자","마늘","올리브오일","파슬리","소금","후추","레몬"],"nutrition":{"cal":320,"pro":30,"carb":22,"fat":12}},{"style":"🇵🇹 포르투갈","name":"아로스 드 마리스코","nameEn":"Arroz de Marisco","type":"main","cookTime":45,"tags":[],"ingredients":["쌀","새우","홍합","바지락","토마토","양파","마늘","올리브오일","고수","소금","화이트와인"],"nutrition":{"cal":480,"pro":28,"carb":58,"fat":12}},{"style":"🇵🇹 포르투갈","name":"피리피리 치킨","nameEn":"Piri Piri Chicken","type":"main","cookTime":50,"tags":["헬시"],"ingredients":["닭고기","고추","마늘","레몬","올리브오일","파프리카파우더","오레가노","소금","식초"],"nutrition":{"cal":340,"pro":34,"carb":4,"fat":20}},{"style":"🇵🇹 포르투갈","name":"카르네 아수아다","nameEn":"Carne Assada","type":"main","cookTime":90,"tags":[],"ingredients":["소고기","마늘","화이트와인","올리브오일","월계수잎","로즈마리","소금","후추","당근","양파"],"nutrition":{"cal":420,"pro":38,"carb":8,"fat":24}},{"style":"🇵🇹 포르투갈","name":"미가스","nameEn":"Migas","type":"side","cookTime":20,"tags":[],"ingredients":["빵","마늘","올리브오일","소금","파슬리","계란","소시지"],"nutrition":{"cal":320,"pro":10,"carb":38,"fat":14}},{"style":"🇵🇹 포르투갈","name":"사라파텔","nameEn":"Sarapatel","type":"main","cookTime":60,"tags":[],"ingredients":["돼지고기","내장","식초","마늘","양파","생강","계피","정향","고추","소금"],"nutrition":{"cal":380,"pro":28,"carb":8,"fat":26}},{"style":"🇵🇹 포르투갈","name":"소파 아 알렌테자나","nameEn":"Sopa à Alentejana","type":"main","cookTime":25,"tags":["헬시"],"ingredients":["빵","계란","마늘","고수","올리브오일","소금","물","파프리카파우더"],"nutrition":{"cal":240,"pro":10,"carb":28,"fat":11}},{"style":"🇵🇹 포르투갈","name":"바칼라우 그릴","nameEn":"Bacalhau Grelhado","type":"main","cookTime":30,"tags":["헬시"],"ingredients":["염장대구","감자","마늘","올리브오일","파슬리","계란","소금","후추","레몬"],"nutrition":{"cal":340,"pro":36,"carb":20,"fat":12}},{"style":"🇵🇹 포르투갈","name":"아세오르다스 피나파스","nameEn":"Açordas de Pinhão","type":"main","cookTime":30,"tags":["헬시"],"ingredients":["빵","마늘","고수","올리브오일","계란","잣","소금","물","파프리카파우더"],"nutrition":{"cal":280,"pro":10,"carb":32,"fat":14}},{"style":"🇹🇼 대만","name":"츄안","nameEn":"Chuan (Taiwanese BBQ Skewers)","type":"main","cookTime":25,"tags":[],"ingredients":["돼지고기","파프리카파우더","커민","소금","후추","마늘","식용유","고수"],"nutrition":{"cal":320,"pro":22,"carb":6,"fat":22}},{"style":"🇹🇼 대만","name":"쏘세지 바오","nameEn":"Sausage Bao","type":"main","cookTime":20,"tags":[],"ingredients":["찐빵","대만소시지","고수","마늘","피클","설탕","간장"],"nutrition":{"cal":340,"pro":14,"carb":44,"fat":12}},{"style":"🇹🇼 대만","name":"훠궈탕","nameEn":"Taiwanese Hot Pot Soup","type":"main","cookTime":35,"tags":[],"ingredients":["소고기","배추","두부","버섯","당면","대파","마라소스","참기름","소금","육수"],"nutrition":{"cal":380,"pro":28,"carb":22,"fat":18}},{"style":"🇹🇼 대만","name":"총총빙","nameEn":"Cong Cong Bing (Green Onion Pancake)","type":"side","cookTime":20,"tags":[],"ingredients":["밀가루","대파","참기름","소금","식용유","물"],"nutrition":{"cal":280,"pro":6,"carb":38,"fat":12}},{"style":"🇹🇼 대만","name":"어완","nameEn":"Oh A Jian (Oyster Omelette)","type":"main","cookTime":20,"tags":[],"ingredients":["굴","계란","쌀가루","대파","고추장소스","식용유","소금","고구마전분"],"nutrition":{"cal":260,"pro":14,"carb":28,"fat":10}},{"style":"🇹🇼 대만","name":"홍소우","nameEn":"Hong Shao Rou (Red-braised Pork)","type":"main","cookTime":90,"tags":[],"ingredients":["삼겹살","간장","설탕","미림","팔각","생강","마늘","계란","쌀"],"nutrition":{"cal":560,"pro":26,"carb":42,"fat":32}},{"style":"🇹🇼 대만","name":"타로볼 탕","nameEn":"Taro Ball Soup","type":"side","cookTime":30,"tags":[],"ingredients":["타로","고구마","전분","설탕","코코넛밀크","팥","흑당"],"nutrition":{"cal":320,"pro":4,"carb":66,"fat":6}},{"style":"🇹🇼 대만","name":"돼지피 케이크","nameEn":"Pig Blood Cake","type":"side","cookTime":30,"tags":[],"ingredients":["돼지피","찹쌀","땅콩가루","고수","간장","소금"],"nutrition":{"cal":260,"pro":12,"carb":36,"fat":8}},{"style":"🇹🇼 대만","name":"펑리수","nameEn":"Pineapple Cake","type":"side","cookTime":40,"tags":[],"ingredients":["밀가루","버터","계란","설탕","파인애플잼","소금","바닐라"],"nutrition":{"cal":320,"pro":4,"carb":44,"fat":14}},{"style":"🇹🇼 대만","name":"스쿠아","nameEn":"Scallion Squid","type":"side","cookTime":15,"tags":[],"ingredients":["오징어","대파","마늘","간장","식용유","소금","고추"],"nutrition":{"cal":180,"pro":18,"carb":6,"fat":8}},{"style":"🇭🇰 홍콩 - 차찬텡","name":"홍콩식 에그타르트","nameEn":"Hong Kong Egg Tart","type":"side","cookTime":35,"tags":["브런치"],"ingredients":["밀가루","버터","계란","설탕","우유","바닐라","소금"],"nutrition":{"cal":280,"pro":6,"carb":34,"fat":14}},{"style":"🇭🇰 홍콩 - 차찬텡","name":"홍콩식 프렌치토스트","nameEn":"Hong Kong French Toast","type":"main","cookTime":15,"tags":["브런치"],"ingredients":["식빵","계란","버터","꿀","땅콩버터","연유","식용유"],"nutrition":{"cal":480,"pro":12,"carb":52,"fat":26}},{"style":"🇭🇰 홍콩 - 차찬텡","name":"콘비프 볶음밥","nameEn":"Corned Beef Fried Rice","type":"main","cookTime":15,"tags":[],"ingredients":["쌀","콘비프","계란","대파","간장","식용유","소금","후추"],"nutrition":{"cal":440,"pro":18,"carb":58,"fat":16}},{"style":"🇭🇰 홍콩 - 차찬텡","name":"보로 바오","nameEn":"Pineapple Bun","type":"side","cookTime":45,"tags":["브런치"],"ingredients":["밀가루","버터","설탕","계란","우유","이스트","소금","바닐라"],"nutrition":{"cal":320,"pro":7,"carb":48,"fat":12}},{"style":"🇭🇰 홍콩 - 차찬텡","name":"마카로니 수프","nameEn":"Macaroni Soup","type":"main","cookTime":20,"tags":[],"ingredients":["마카로니","햄","계란","치킨스톡","소금","후추","대파","버터"],"nutrition":{"cal":360,"pro":16,"carb":48,"fat":12}},{"style":"🇭🇰 홍콩 - 차찬텡","name":"라면 볶음","nameEn":"Stir-fried Instant Noodles","type":"main","cookTime":15,"tags":[],"ingredients":["라면","계란","양파","대파","간장","굴소스","식용유","소금"],"nutrition":{"cal":420,"pro":14,"carb":58,"fat":16}},{"style":"🇭🇰 홍콩 - 차찬텡","name":"커리 어묵","nameEn":"Curry Fish Balls","type":"side","cookTime":20,"tags":[],"ingredients":["어묵","카레가루","코코넛밀크","양파","마늘","소금","설탕","식용유"],"nutrition":{"cal":220,"pro":10,"carb":22,"fat":10}},{"style":"🇭🇰 홍콩 - 광둥","name":"바이쩐지 (광둥식 찜닭)","nameEn":"Bai Zhan Ji (Cantonese Steamed Chicken)","type":"main","cookTime":40,"tags":["헬시"],"ingredients":["닭고기","생강","대파","간장","참기름","소금","설탕","마늘"],"nutrition":{"cal":320,"pro":36,"carb":4,"fat":16}},{"style":"🇭🇰 홍콩 - 광둥","name":"하오요우 시란화 (굴소스 브로콜리)","nameEn":"Hao You Xi Lan Hua (Broccoli with Oyster Sauce)","type":"side","cookTime":10,"tags":["헬시"],"ingredients":["브로콜리","굴소스","마늘","참기름","소금","전분","식용유"],"nutrition":{"cal":90,"pro":4,"carb":8,"fat":4}},{"style":"🇭🇰 홍콩 - 광둥","name":"차슈 (광둥식 바베큐포크)","nameEn":"Cha Siu (Cantonese BBQ Pork)","type":"main","cookTime":50,"tags":[],"ingredients":["돼지고기","간장","꿀","굴소스","미림","설탕","마늘","오향파우더","식용유"],"nutrition":{"cal":380,"pro":28,"carb":22,"fat":18}},{"style":"🇭🇰 홍콩 - 광둥","name":"칭쩡위 (광둥식 생선찜)","nameEn":"Qing Zheng Yu (Cantonese Steamed Fish)","type":"main","cookTime":20,"tags":["헬시"],"ingredients":["생선","생강","대파","간장","참기름","식용유","소금","고수"],"nutrition":{"cal":220,"pro":30,"carb":4,"fat":10}},{"style":"🇭🇰 홍콩 - 광둥","name":"훈툰탕 (광둥식 완탕수프)","nameEn":"Wonton Tang (Cantonese Wonton Soup)","type":"main","cookTime":25,"tags":[],"ingredients":["완탕피","새우","돼지고기","생강","대파","간장","참기름","치킨스톡","소금"],"nutrition":{"cal":280,"pro":16,"carb":28,"fat":10}},{"style":"🇭🇰 홍콩 - 광둥","name":"소금후추 새우 (광둥식)","nameEn":"Salt and Pepper Shrimp","type":"main","cookTime":20,"tags":[],"ingredients":["새우","소금","후추","마늘","대파","고추","전분","식용유"],"nutrition":{"cal":240,"pro":22,"carb":8,"fat":14}},{"style":"🇭🇰 홍콩 - 광둥","name":"구라오육 (광둥식 탕수육)","nameEn":"Gu Lao Rou (Cantonese Sweet and Sour Pork)","type":"main","cookTime":35,"tags":[],"ingredients":["돼지고기","파프리카","파인애플","양파","전분","식초","설탕","케첩","식용유","소금"],"nutrition":{"cal":420,"pro":20,"carb":44,"fat":18}},{"style":"🇭🇰 홍콩 - 광둥","name":"차오더우야 (콩나물볶음)","nameEn":"Chao Dou Ya (Stir-fried Bean Sprouts)","type":"side","cookTime":10,"tags":["헬시"],"ingredients":["콩나물","마늘","대파","소금","참기름","식용유","고추"],"nutrition":{"cal":70,"pro":3,"carb":6,"fat":4}},{"style":"🇭🇰 홍콩 - 광둥","name":"사오야 (광둥식 로스트덕)","nameEn":"Siu Ngap (Cantonese Roast Duck)","type":"main","cookTime":90,"tags":[],"ingredients":["오리고기","간장","꿀","오향파우더","마늘","생강","설탕","식초","소금"],"nutrition":{"cal":480,"pro":34,"carb":14,"fat":32}},{"style":"🇭🇰 홍콩 - 광둥","name":"XO소스 볶음밥 (광둥식)","nameEn":"XO Sauce Fried Rice","type":"main","cookTime":15,"tags":[],"ingredients":["쌀","XO소스","계란","새우","대파","간장","식용유","소금"],"nutrition":{"cal":460,"pro":16,"carb":62,"fat":16}},{"style":"🇭🇰 홍콩 - 광둥","name":"쩡펀 새우 (광둥식)","nameEn":"Zheng Fen Xia (Steamed Rice Noodle Roll with Shrimp)","type":"side","cookTime":20,"tags":[],"ingredients":["쌀가루","새우","굴소스","참기름","간장","설탕","전분","소금"],"nutrition":{"cal":220,"pro":12,"carb":32,"fat":6}},{"style":"🇭🇰 홍콩 - 광둥","name":"새우 완탕 (광둥식)","nameEn":"Shrimp Wonton","type":"side","cookTime":20,"tags":[],"ingredients":["완탕피","새우","돼지고기","생강","간장","참기름","설탕","소금","전분"],"nutrition":{"cal":180,"pro":10,"carb":20,"fat":6}},{"style":"🇭🇰 홍콩 - 광둥","name":"어육 완자탕 (광둥식)","nameEn":"Fish Ball Soup","type":"main","cookTime":20,"tags":["헬시"],"ingredients":["어묵","대파","생강","치킨스톡","소금","참기름","고수","후추"],"nutrition":{"cal":180,"pro":14,"carb":16,"fat":6}},{"style":"🇭🇰 홍콩 - 딤섬","name":"하가우(딤섬)","nameEn":"Ha Gao (Shrimp Dumpling)","type":"side","cookTime":25,"tags":[],"ingredients":["전분","쌀가루","새우","죽순","생강","소금","참기름","설탕"],"nutrition":{"cal":160,"pro":8,"carb":20,"fat":5}},{"style":"🇭🇰 홍콩 - 딤섬","name":"슈마이(딤섬)","nameEn":"Siu Mai (Pork and Shrimp Dumpling)","type":"side","cookTime":20,"tags":[],"ingredients":["완탕피","돼지고기","새우","죽순","생강","간장","참기름","설탕","전분"],"nutrition":{"cal":180,"pro":10,"carb":16,"fat":8}},{"style":"🇭🇰 홍콩 - 딤섬","name":"치킨발(딤섬)","nameEn":"Chicken Feet Dim Sum","type":"side","cookTime":60,"tags":[],"ingredients":["닭발","굴소스","두반장","마늘","생강","설탕","간장","전분","식용유"],"nutrition":{"cal":220,"pro":16,"carb":10,"fat":14}},{"style":"🇭🇰 홍콩 - 딤섬","name":"로바이고(딤섬)","nameEn":"Lo Bak Go (Turnip Cake)","type":"side","cookTime":40,"tags":[],"ingredients":["무","쌀가루","소시지","새우","간장","참기름","소금","식용유"],"nutrition":{"cal":200,"pro":6,"carb":30,"fat":8}},{"style":"🇭🇰 홍콩 - 딤섬","name":"창펀(딤섬)","nameEn":"Cheung Fun (Rice Noodle Roll)","type":"side","cookTime":20,"tags":[],"ingredients":["쌀가루","전분","새우","소고기","간장","굴소스","참기름","설탕"],"nutrition":{"cal":200,"pro":8,"carb":32,"fat":5}},{"style":"🇭🇰 홍콩 - 딤섬","name":"참깨볼(딤섬)","nameEn":"Jin Deui (Sesame Ball)","type":"side","cookTime":25,"tags":[],"ingredients":["찹쌀가루","팥앙금","참깨","설탕","식용유","물"],"nutrition":{"cal":240,"pro":4,"carb":38,"fat":9}},{"style":"🇭🇰 홍콩 - 딤섬","name":"바비큐번(딤섬)","nameEn":"Char Siu Bao (BBQ Pork Bun)","type":"side","cookTime":45,"tags":[],"ingredients":["밀가루","돼지고기","굴소스","간장","꿀","설탕","이스트","베이킹파우더","참기름"],"nutrition":{"cal":280,"pro":10,"carb":40,"fat":9}},{"style":"🇭🇰 홍콩 - 딤섬","name":"에그 커스터드번(딤섬)","nameEn":"Nai Wong Bao (Custard Bun)","type":"side","cookTime":40,"tags":[],"ingredients":["밀가루","계란","버터","설탕","우유","이스트","바닐라","소금"],"nutrition":{"cal":260,"pro":7,"carb":38,"fat":10}},{"style":"🇭🇰 홍콩 - 딤섬","name":"탄탄만두(딤섬)","nameEn":"Dan Dan Dumpling","type":"side","cookTime":25,"tags":[],"ingredients":["완탕피","돼지고기","참깨페이스트","두반장","간장","식초","마늘","대파","고추기름"],"nutrition":{"cal":220,"pro":10,"carb":22,"fat":11}},{"style":"🇭🇰 홍콩 - 딤섬","name":"망고푸딩(딤섬)","nameEn":"Mango Pudding","type":"side","cookTime":20,"tags":[],"ingredients":["망고","우유","생크림","설탕","젤라틴","바닐라"],"nutrition":{"cal":200,"pro":3,"carb":30,"fat":8}},{"style":"한식","name":"꼬막무침","nameEn":"Seasoned Cockles","type":"side","cookTime":20,"tags":["헬시"],"ingredients":["꼬막","고춧가루","간장","마늘","참기름","설탕","식초","대파","깨"],"nutrition":{"cal":120,"pro":12,"carb":8,"fat":4}},{"style":"한식","name":"꼬막 비빔밥","nameEn":"Cockle Bibimbap","type":"main","cookTime":25,"tags":["헬시"],"ingredients":["쌀","꼬막","시금치","콩나물","당근","계란","고추장","참기름","마늘","깨"],"nutrition":{"cal":520,"pro":22,"carb":78,"fat":12}},{"style":"한식","name":"매생이국","nameEn":"Maesaengi Seaweed Soup","type":"main","cookTime":15,"tags":["헬시"],"ingredients":["매생이","굴","마늘","소금","참기름","물","국간장"],"nutrition":{"cal":60,"pro":6,"carb":4,"fat":2}},{"style":"한식","name":"굴미역국","nameEn":"Oyster and Seaweed Soup","type":"main","cookTime":20,"tags":["헬시"],"ingredients":["굴","미역","참기름","국간장","마늘","소금","물"],"nutrition":{"cal":80,"pro":8,"carb":4,"fat":3}},{"style":"한식","name":"야채죽","nameEn":"Vegetable Porridge","type":"main","cookTime":35,"tags":["헬시"],"ingredients":["쌀","당근","양파","브로콜리","버섯","소금","참기름","국간장","마늘"],"nutrition":{"cal":220,"pro":5,"carb":44,"fat":3}},{"style":"한식","name":"단호박죽","nameEn":"Sweet Pumpkin Porridge","type":"main","cookTime":40,"tags":["헬시"],"ingredients":["단호박","쌀","우유","설탕","소금","물","찹쌀"],"nutrition":{"cal":260,"pro":5,"carb":56,"fat":2}},{"style":"한식","name":"오리탕","nameEn":"Duck Soup","type":"main","cookTime":60,"tags":[],"ingredients":["오리고기","들깨가루","우거지","된장","고춧가루","마늘","대파","생강","소금"],"nutrition":{"cal":380,"pro":28,"carb":10,"fat":26}},{"style":"일식","name":"타마고동","nameEn":"Tamago Don (Egg Rice Bowl)","type":"main","cookTime":15,"tags":["브런치"],"ingredients":["쌀","계란","양파","간장","미림","설탕","다시","대파"],"nutrition":{"cal":480,"pro":16,"carb":74,"fat":14}},{"style":"일식","name":"오무라이스","nameEn":"Omurice","type":"main","cookTime":25,"tags":[],"ingredients":["쌀","계란","닭고기","양파","케첩","버터","소금","후추","대파"],"nutrition":{"cal":560,"pro":18,"carb":72,"fat":22}},{"style":"일식","name":"온센 타마고","nameEn":"Onsen Tamago (Hot Spring Egg)","type":"side","cookTime":30,"tags":["헬시"],"ingredients":["계란","간장","미림","다시","대파","가다랑어포"],"nutrition":{"cal":90,"pro":7,"carb":3,"fat":6}},{"style":"일식","name":"낫또","nameEn":"Natto (Fermented Soybeans)","type":"side","cookTime":5,"tags":["헬시"],"ingredients":["낫또","간장","겨자","대파","계란","쌀"],"nutrition":{"cal":190,"pro":16,"carb":14,"fat":8}},{"style":"일식","name":"낫또 아보카도 덮밥","nameEn":"Natto Avocado Rice Bowl","type":"main","cookTime":10,"tags":["헬시"],"ingredients":["쌀","낫또","아보카도","간장","참기름","김","깨","대파","겨자"],"nutrition":{"cal":480,"pro":16,"carb":62,"fat":18}},{"style":"🇫🇷 프랑스","name":"콩피 드 카나르","nameEn":"Confit de Canard","type":"main","cookTime":180,"tags":[],"ingredients":["오리다리","마늘","타임","로즈마리","소금","후추","오리지방","월계수잎"],"nutrition":{"cal":580,"pro":36,"carb":2,"fat":46}},{"style":"🇫🇷 프랑스","name":"프렌치 오믈렛","nameEn":"French Omelette","type":"main","cookTime":10,"tags":["브런치"],"ingredients":["계란","버터","소금","후추","파슬리","치즈"],"nutrition":{"cal":240,"pro":14,"carb":2,"fat":19}},{"style":"🇺🇸 미국","name":"케이준 보일링 씨푸드","nameEn":"Cajun Boiling Seafood","type":"main","cookTime":40,"tags":[],"ingredients":["새우","홍합","꽃게","옥수수","감자","소시지","버터","마늘","케이준시즈닝","레몬","파슬리"],"nutrition":{"cal":520,"pro":36,"carb":32,"fat":24}},{"style":"중식","name":"청경채 두부볶음","nameEn":"Bok Choy and Tofu Stir-fry","type":"main","cookTime":15,"tags":["헬시"],"ingredients":["청경채","두부","마늘","굴소스","간장","참기름","전분","식용유","소금"],"nutrition":{"cal":130,"pro":10,"carb":8,"fat":7}},{"style":"한식","name":"홍합 두부탕","nameEn":"Mussel and Tofu Soup","type":"main","cookTime":20,"tags":["헬시"],"ingredients":["홍합","두부","대파","마늘","소금","고춧가루","물","참기름","청양고추"],"nutrition":{"cal":140,"pro":14,"carb":6,"fat":6}},{"style":"중식","name":"버섯 채소볶음","nameEn":"Mushroom and Vegetable Stir-fry","type":"main","cookTime":15,"tags":["헬시"],"ingredients":["버섯","청경채","당근","마늘","굴소스","간장","참기름","식용유","소금"],"nutrition":{"cal":110,"pro":4,"carb":10,"fat":6}},{"style":"🇹🇭 태국","name":"카우팟 사파롯","nameEn":"Khao Phat Sapparot (Pineapple Fried Rice)","type":"main","cookTime":20,"tags":["헬시"],"ingredients":["쌀","파인애플","새우","계란","대파","간장","피시소스","커민","식용유","소금"],"nutrition":{"cal":420,"pro":14,"carb":68,"fat":10}},{"style":"🇸🇬 싱가포르","name":"유탸오없는 피시수프","nameEn":"Fish Soup (without Youtiao)","type":"main","cookTime":25,"tags":["헬시"],"ingredients":["생선","두부","토마토","생강","대파","소금","참기름","후추","물"],"nutrition":{"cal":180,"pro":22,"carb":6,"fat":6}},{"style":"중식","name":"에그화이트 볶음","nameEn":"Egg White Stir-fry","type":"main","cookTime":10,"tags":["헬시"],"ingredients":["계란흰자","새우","완두콩","마늘","소금","식용유","참기름","전분"],"nutrition":{"cal":130,"pro":14,"carb":4,"fat":6}},{"style":"🇸🇬 싱가포르","name":"스팀드 치킨라이스","nameEn":"Steamed Chicken Rice","type":"main","cookTime":45,"tags":["헬시"],"ingredients":["닭가슴살","쌀","생강","마늘","소금","간장","참기름","오이","대파"],"nutrition":{"cal":420,"pro":32,"carb":54,"fat":8}},{"style":"🇲🇽 멕시코","name":"베지 타코","nameEn":"Veggie Taco","type":"main","cookTime":20,"tags":["헬시"],"ingredients":["또르티야","콩","아보카도","토마토","양상추","고수","라임","소금","커민"],"nutrition":{"cal":280,"pro":8,"carb":38,"fat":10}},{"style":"🇲🇽 멕시코","name":"칠리콘 카르네","nameEn":"Chili con Carne","type":"main","cookTime":45,"tags":["헬시"],"ingredients":["소고기","강낭콩","토마토소스","양파","마늘","고추","커민","파프리카파우더","소금","올리브오일"],"nutrition":{"cal":320,"pro":26,"carb":22,"fat":14}},{"style":"🇮🇩 인도네시아","name":"페스도","nameEn":"Pecel (Indonesian Peanut Vegetable Salad)","type":"main","cookTime":20,"tags":["헬시"],"ingredients":["숙주","시금치","두부","땅콩","라임","마늘","고추","설탕","소금","새우페이스트"],"nutrition":{"cal":220,"pro":10,"carb":18,"fat":12}},{"style":"🇮🇩 인도네시아","name":"멩추스라다","nameEn":"Mentah Salad (Indonesian Raw Salad)","type":"side","cookTime":15,"tags":["헬시"],"ingredients":["오이","당근","숙주","토마토","고추","라임","피시소스","설탕","소금","땅콩"],"nutrition":{"cal":100,"pro":4,"carb":14,"fat":4}},{"style":"🇪🇸 스페인","name":"포하","nameEn":"Porra (Spanish Cold Tomato Soup)","type":"main","cookTime":15,"tags":["헬시"],"ingredients":["토마토","파프리카","마늘","올리브오일","빵","식초","소금","물","계란"],"nutrition":{"cal":160,"pro":4,"carb":18,"fat":8}},{"style":"🇭🇰 홍콩 - 광둥","name":"해물 두부탕 (광둥식)","nameEn":"Seafood and Tofu Soup","type":"main","cookTime":20,"tags":["헬시"],"ingredients":["새우","두부","버섯","청경채","생강","소금","참기름","전분","치킨스톡"],"nutrition":{"cal":160,"pro":14,"carb":8,"fat":7}},{"style":"🇭🇰 홍콩 - 광둥","name":"증채 (광둥식 찐채소)","nameEn":"Zheng Cai (Steamed Vegetables)","type":"side","cookTime":15,"tags":["헬시"],"ingredients":["청경채","브로콜리","당근","굴소스","마늘","참기름","소금","식용유"],"nutrition":{"cal":80,"pro":3,"carb":8,"fat":4}},{"style":"🇭🇰 홍콩 - 광둥","name":"어육죽 (광둥식)","nameEn":"Fish Congee","type":"main","cookTime":40,"tags":["헬시"],"ingredients":["쌀","생선","생강","대파","소금","참기름","후추","물","고수"],"nutrition":{"cal":240,"pro":16,"carb":38,"fat":4}},{"style":"🇬🇧 영국","name":"연어 채소구이","nameEn":"Salmon and Vegetable Roast","type":"main","cookTime":30,"tags":["헬시"],"ingredients":["연어","아스파라거스","방울토마토","레몬","올리브오일","마늘","소금","후추","타임"],"nutrition":{"cal":320,"pro":34,"carb":8,"fat":16}},{"style":"🇬🇧 영국","name":"워터크레스 수프","nameEn":"Watercress Soup","type":"main","cookTime":25,"tags":["헬시"],"ingredients":["워터크레스","감자","양파","마늘","치킨스톡","버터","소금","후추","생크림"],"nutrition":{"cal":160,"pro":4,"carb":18,"fat":8}},{"style":"🇬🇧 영국","name":"콜슬로","nameEn":"Coleslaw","type":"side","cookTime":10,"tags":["헬시"],"ingredients":["양배추","당근","마요네즈","식초","설탕","소금","후추","파슬리"],"nutrition":{"cal":130,"pro":1,"carb":14,"fat":8}},{"style":"🇹🇼 대만","name":"루로우 팟채","nameEn":"Lu Rou Pot Vegetables","type":"side","cookTime":25,"tags":["헬시"],"ingredients":["청경채","두부","버섯","간장","설탕","마늘","참기름","소금","식용유"],"nutrition":{"cal":120,"pro":6,"carb":10,"fat":6}}];
  const db={};
  CLEAN_MENUS.forEach(m=>{
    // 메뉴 유형별 인분 자동 결정
    const n=m.name;
    // 대용량 솥요리 (4인분): 뼈있는 탕/찜, 전골
    const bigPot=/(감자탕|갈비탕|설렁탕|곰탕$|해장국$|순대국밥|삼계탕$|전골$|곰국|도가니탕|꼬리탕|뼈|뼈대)/.test(n);
    // 소찬 반찬류 (4인분): 나물, 무침, 장아찌, 절임 (단 메인요리 아닌 것)
    const sideDish=/(나물$|무침$|장아찌$|절임$|피클$|겉절이$|깍두기$|김치$)/.test(n);
    // 곡물 다수 메뉴(잡곡밥류) = 4인분
    const multiGrain=/(잡곡밥|오곡밥|혼합곡|나물밥|비빔밥$|수프카레|카레라이스|카레밥)/.test(n);
    const sv=bigPot?4:sideDish?4:multiGrain?3:2;
    const iStyles=[m.style||'기타'];
    if((m.tags||[]).includes('헬시')&&!iStyles.includes('헬시')) iStyles.push('헬시');
    db[m.name]={
      style:m.style,
      styles:iStyles,
      cookTime:m.cookTime,
      tags:m.tags||[],
      verified:true,
      servings:sv,
      recipeServings:sv,
      sourceHint:"Naver/Google recipe searchable",
      ingredients:m.ingredients.map(ingObj)
    };
  });
  return db;
})();

// ── 재료 정밀화 규칙 ──
const INGREDIENT_REFINE = {
  // 돼지고기 부위 매핑
  "돼지고기": [
    {keywords:["삼겹","오겹","수육","보쌈","라멘","차슈","동파","홍소","항정","목삼겹"], name:"돼지삼겹살"},
    {keywords:["제육","두루치기","불백","짜글","주물럭"], name:"돼지앞다리살"},
    {keywords:["돈카츠","가스","히레","포크커틀릿"], name:"돼지등심"},
    {keywords:["만두","교자","완자","미트볼","떡갈비","다짐"], name:"돼지다짐육"},
    {keywords:["갈비찜","갈비탕","폭립","립","갈비구이"], name:"돼지갈비"},
    {keywords:["장조림"], name:"돼지안심"},
    {keywords:["목살구이","목살볶음"], name:"돼지목살"},
    {keywords:["카레","스튜","찌개","순두부","청국장","된장찌개","국","탕","전골","볶음","덮밥"], name:"돼지목살"},
    {keywords:["구이"], name:"돼지삼겹살"},
  ],
  // 소고기 부위 매핑
  "소고기": [
    {keywords:["불고기","불백"], name:"소고기불고기용"},
    {keywords:["설렁탕","곰탕","국밥","육개장","갈비탕","해장국","뼈국"], name:"소고기양지"},
    {keywords:["갈비찜","갈비탕","갈비구이"], name:"소갈비"},
    {keywords:["안심스테이크","안심구이"], name:"소안심"},
    {keywords:["립아이스테이크","립아이"], name:"립아이"},
    {keywords:["채끝스테이크","채끝"], name:"채끝살"},
    {keywords:["티본스테이크","티본"], name:"티본"},
    {keywords:["포터하우스스테이크","포터하우스"], name:"포터하우스"},
    {keywords:["토마호크스테이크","토마호크"], name:"토마호크"},
    {keywords:["살치살스테이크","살치"], name:"살치살"},
    {keywords:["부채살스테이크","부채"], name:"부채살"},
    {keywords:["스테이크"], name:"채끝살"},
    {keywords:["장조림"], name:"소고기홍두깨살"},
    {keywords:["만두","완자","미트볼","떡갈비","함버그","다짐"], name:"소고기다짐육"},
    {keywords:["찌개","전골","된장찌개","순두부","청국장","부대찌개"], name:"소고기앞다리살"},
    {keywords:["비빔밥","덮밥","규동"], name:"소고기채끝살"},
    {keywords:["볶음밥","볶음","카레","스튜"], name:"소고기목심"},
    {keywords:["구이","주물럭"], name:"소고기채끝살"},
  ],
  // 닭고기 부위 매핑
  "닭": [
    {keywords:["가슴살","샐러드","스팀","다이어트","데리야끼"], name:"닭가슴살"},
    {keywords:["볶음탕","찜","백숙","삼계탕","한마리"], name:"토종닭"},
    {keywords:["강정","튀김","가라아게","까라아게","치킨"], name:"닭다리살"},
    {keywords:["갈비","닭갈비","구이"], name:"닭다리살"},
    {keywords:["카레","스튜","덮밥"], name:"닭다리"},
    {keywords:["날개","윙"], name:"닭날개"},
  ],
  "닭고기": [
    {keywords:["가슴","샐러드","스팀","다이어트","데리야끼"], name:"닭가슴살"},
    {keywords:["볶음탕","찜","백숙","삼계"], name:"토종닭"},
    {keywords:["강정","튀김","가라아게","치킨"], name:"닭다리살"},
    {keywords:["갈비","닭갈비","구이"], name:"닭다리살"},
    {keywords:["카레","스튜","덮밥","볶음"], name:"닭다리"},
    {keywords:["날개","윙"], name:"닭날개"},
  ],
  // 생선 매핑
  "생선": [
    {keywords:["조림","간장조림"], name:"갈치"},
    {keywords:["구이","소금구이"], name:"고등어"},
    {keywords:["탕","매운탕","지리"], name:"대구"},
    {keywords:["튀김","피시앤칩스"], name:"대구살"},
    {keywords:["찜"], name:"병어"},
  ],
  "흰살생선": [
    {keywords:["구이"], name:"대구"},
    {keywords:["탕","찌개"], name:"대구"},
    {keywords:["튀김"], name:"명태"},
    {keywords:["찜"], name:"병어"},
    {keywords:["무침","회"], name:"광어"},
  ],
  // 참기름/들기름
  "참기름": [
    {keywords:["시래기","우거지","고구마줄기","곤드레","취나물","고사리","들깨","시금치나물","근대"], name:"들기름"},
    {keywords:["나물","무침","비빔","겉절이","볶음"], name:"참기름"},
  ],
  // 해산물 정밀화
  "해산물": [
    {keywords:["찌개","전골","순두부"], name:"바지락+새우"},
    {keywords:["볶음","구이"], name:"새우+오징어"},
    {keywords:["파스타","리조또"], name:"새우"},
  ],
};

// ── MENU_DB 추가 항목 ──

// 메뉴명 기반으로 재료명 정밀화
function refineIngredient(ingName, menuName){
  try{
    // 정확한 키로 먼저 찾기
    let rules = INGREDIENT_REFINE[ingName];
    // 없으면 부분 매칭
    if(!rules){
      for(const key of Object.keys(INGREDIENT_REFINE)){
        if(ingName.includes(key)||key.includes(ingName)){
          rules=INGREDIENT_REFINE[key];
          break;
        }
      }
    }
    // rules가 배열인지 반드시 체크
    if(!rules||!Array.isArray(rules)) return ingName;
    for(const rule of rules){
      if(!rule||!Array.isArray(rule.keywords)) continue;
      if(rule.keywords.some(kw=>menuName.includes(kw))){
        return rule.name||ingName;
      }
    }
    return ingName;
  }catch(e){
    return ingName; // 오류 시 원래 이름 그대로
  }
}

function getIngredientsFromDB(menus, people){
  const merged={};
  let allFound=true;
  const fridgeNames=S.fridge.map(f=>f.name);
  for(const menu of menus){
    const db=MENU_DB[menu];
    if(!db){allFound=false;continue;}
    for(const ing of db.ingredients){
      // 메뉴명 기반으로 재료명 정밀화
      const refinedName = refineIngredient(ing.name, menu);
      const rawAmount = ing.amount || '적당량';
      const qty=parseFloat(rawAmount)||0;
      const unit=rawAmount.replace(/[0-9.]/g,'').trim()||'';
      const key = refinedName;
      // 냉장고에 있는지 체크
      const inFridge=fridgeNames.some(f=>f.includes(refinedName)||refinedName.includes(f));
      if(merged[key]){
        const ex=parseFloat(merged[key].amount)||0;
        if(ex&&qty) merged[key].amount=Math.round((ex+qty)*people*10)/10+unit;
        // qty 없어도 재료는 유지 (적당량)
      } else {
        // qty=0이면 "적당량"으로 표시하되 반드시 장바구니에 포함
        const displayAmount = qty ? Math.round(qty*people*10)/10+unit : '적당량';
        merged[key]={...ing, name:refinedName, amount:displayAmount, inFridge};
      }
    }
  }
  return{list:Object.values(merged),allFound};
}

// ── 캐시 ──

// ===== SAFE LOCAL STORAGE / START FIX v13 =====
function wmSafeGet(key, fallback){
  try{
    const v=localStorage.getItem(key);
    return (v===null || v===undefined || v==='undefined') ? fallback : v;
  }catch(e){ return fallback; }
}
function wmSafeJSON(key, fallback){
  try{
    const raw=wmSafeGet(key, null);
    if(raw===null || raw==='' || raw==='undefined') return fallback;
    return JSON.parse(raw);
  }catch(e){
    try{ localStorage.removeItem(key); }catch(_e){}
    return fallback;
  }
}
function wmSafeInt(key, fallback){
  const n=parseInt(wmSafeGet(key, String(fallback)),10);
  return Number.isFinite(n)?n:fallback;
}

const MEAL_CACHE=wmSafeJSON("wm_meal_cache",{});
function getCacheKey(ings,styles,people){return ings.map(i=>i.name).sort().join(",")+"|"+styles.join(",")+"|"+people;}
function saveCache(key,r){MEAL_CACHE[key]={r,ts:Date.now()};const keys=Object.keys(MEAL_CACHE);if(keys.length>5)delete MEAL_CACHE[keys.sort((a,b)=>MEAL_CACHE[a].ts-MEAL_CACHE[b].ts)[0]];localStorage.setItem("wm_meal_cache",JSON.stringify(MEAL_CACHE));}
function getCache(key){const c=MEAL_CACHE[key];if(!c)return null;if(Date.now()-c.ts>7*864e5)return null;return c.r;}

// ── 상수 ──
const DAYS=["월","화","수","목","금","토","일"];
const DEFAULT_SCHEDULE={월:["점심","저녁"],화:["아침","점심","저녁"],수:["아침","점심","저녁"],목:["아침","점심","저녁"],금:["점심","저녁"],토:["아침","저녁"],일:["아침","저녁"]};

// ── 상태 ──
const S={
  screen:"splash", people:2,
  activeFlow:wmSafeGet("wm_flow",null), // "a" | "b" | "c" | null
  showMonthly:false,
  calSelectedDay:undefined,
  calSelectedDate:undefined,
  monthlyPlan:null,
  fridge:wmSafeJSON("wm_fridge",[]),
  schedule:wmSafeJSON("wm_schedule",JSON.parse(JSON.stringify(DEFAULT_SCHEDULE))),
  mealPlan:wmSafeJSON("wm_meal",null),
  mealCalendar:wmSafeJSON("wm_cal",null), // {날짜키: [{type,name,cookTime,sides}]}
  calViewDate:null, // 달력 선택된 날짜
  mealStartDate:wmSafeGet("wm_meal_start",null),
  mealDiary:wmSafeJSON("wm_meal_diary",{}),
  cart:[], fridgeAdded:false, cartDone:!!wmSafeGet("wm_cart_done",null),
  bcMode:"", bcStyles:[], bcMenus:[], bcSuggested:[],
  currentDay:0, currentMeal:null, recipeBack:"home",
  weekUsage:wmSafeInt("wm_week_"+wk(),0),
};

function setFlow(flow){
  S.activeFlow=flow;
  if(flow)localStorage.setItem("wm_flow",flow);
  else localStorage.removeItem("wm_flow");
    localStorage.removeItem("wm_cart_done");
    S.cartDone=false;
}
function resetFlow(){
  setFlow(null);
  S.bcMenus=[];S.bcStyles=[];S.bcSuggested=[];S.cart=[];S.fridgeAdded=false;
  go("home");
}

// 플로우 완료 처리 - 식단 생성 후 activeFlow 유지 (완료 상태)
function completeFlow(){
  // 플로우는 유지하되 식단이 완성됐음을 표시
  go("home");
}

function wk(){const n=new Date();return n.getFullYear()+"_"+Math.floor((n-new Date(n.getFullYear(),0,0))/604800000);}
function saveFridge(){localStorage.setItem("wm_fridge",JSON.stringify(S.fridge));}
function saveSched(){localStorage.setItem("wm_schedule",JSON.stringify(S.schedule));}
function saveMeal(){localStorage.setItem("wm_meal",JSON.stringify(S.mealPlan));localStorage.setItem("wm_meal_start",S.mealStartDate||"");}
function addUsage(){S.weekUsage++;localStorage.setItem("wm_week_"+wk(),S.weekUsage);}
function checkUsage(){return true;} // 횟수제한 해제
function totalDays(){ return 7*(S.planDuration||1); }
function planDurationLabel(){
  const d=S.planDuration||1;
  return d===1?"1주일":d===2?"2주일":"한달";
}
function dateKey(date){
  return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
}
function todayKey(){return dateKey(new Date());}
function isPastDate(key){return key<todayKey();}
function isTodayDate(key){return key===todayKey();}
function getMealStartDate(){
  const d=new Date();d.setDate(d.getDate()+1);return dateKey(d);
}

function getThisMonday(){const d=new Date();const dd=d.getDay();d.setDate(d.getDate()-dd+(dd===0?-6:1));return d.toISOString().slice(0,10);}
function getDday(addedAt,expireDays){const e=new Date(addedAt);e.setDate(e.getDate()+(expireDays||14));return Math.ceil((e-new Date())/86400000);}
function ddayBadge(d){const bg=d<=0?"#9e9e9e":d<=3?"#f44336":d<=7?"#ff9800":"#4caf50";return`<span class="dday" style="background:${bg}">${d<=0?"만료":"D-"+d}</span>`;}
function storageBadge(storage){
  const cfg={
    "냉장":{bg:"#e3f2fd",color:"#1565c0",icon:"❄️"},
    "냉동":{bg:"#e8eaf6",color:"#283593",icon:"🧊"},
    "상온":{bg:"#fff8e1",color:"#e65100",icon:"🌡️"}
  };
  const s=cfg[storage]||cfg["냉장"];
  return `<span style="background:${s.bg};color:${s.color};border-radius:8px;padding:2px 7px;font-size:11px;font-weight:700">${s.icon}${storage||"냉장"}</span>`;
}
function fiClass(d){return d<=0?"fi":d<=3?"fi urgent":d<=7?"fi warning":"fi";}
function getIcon(n){
  const m={
    // 육류/단백질
    소고기:"🥩",돼지고기:"🥩",삼겹살:"🥩",목살:"🥩",앞다리:"🥩",등심:"🥩",안심:"🥩",갈비:"🥩",
    양지:"🥩",채끝:"🥩",홍두깨:"🥩",다짐육:"🥩",불고기:"🥩",양고기:"🥩",오리:"🦆",
    닭:"🍗",토종닭:"🍗",
    // 해산물
    새우:"🦐",오징어:"🦑",낙지:"🐙",문어:"🐙",꽃게:"🦀",게:"🦀",랍스터:"🦞",
    연어:"🐟",참치:"🐟",고등어:"🐟",갈치:"🐟",대구:"🐟",명태:"🐟",황태:"🐟",
    북어:"🐟",임연수:"🐟",꽁치:"🐟",삼치:"🐟",병어:"🐟",도미:"🐟",광어:"🐟",
    굴:"🦪",홍합:"🦪",바지락:"🦪",조개:"🦪",꼬막:"🦪",가리비:"🦪",전복:"🐚",
    멸치:"🐟",어묵:"🟡",
    // 두부/계란
    두부:"🟫",순두부:"🟫",연두부:"🟫",계란:"🥚",달걀:"🥚",메추리알:"🥚",
    // 채소
    당근:"🥕",감자:"🥔",고구마:"🍠",양파:"🧅",대파:"🌿",쪽파:"🌿",파:"🌿",
    마늘:"🧄",생강:"🟡",배추:"🥬",시금치:"🥬",상추:"🥬",깻잎:"🌿",부추:"🌿",
    콩나물:"🥬",숙주:"🥬",열무:"🥬",미나리:"🌿",냉이:"🌿",쑥:"🌿",달래:"🌿",
    아욱:"🌿",근대:"🌿",머위:"🌿",취나물:"🌿",고사리:"🌿",시래기:"🥬",우거지:"🥬",
    애호박:"🥒",오이:"🥒",주키니:"🥒",가지:"🍆",토마토:"🍅",방울토마토:"🍅",
    피망:"🫑",파프리카:"🫑",브로콜리:"🥦",양배추:"🥬",청경채:"🥬",케일:"🥬",
    무:"🥬",단무지:"🟡",연근:"🥬",우엉:"🌿",도라지:"🥬",더덕:"🌿",
    버섯:"🍄",표고버섯:"🍄",느타리버섯:"🍄",팽이버섯:"🍄",새송이버섯:"🍄",
    단호박:"🎃",호박:"🎃",옥수수:"🌽",아보카도:"🥑",레몬:"🍋",라임:"🍋",
    사과:"🍎",배:"🍐",바나나:"🍌",딸기:"🍓",블루베리:"🫐",포도:"🍇",
    // 면/밥
    쌀:"🌾",현미:"🌾",찹쌀:"🌾",보리:"🌾",퀴노아:"🌾",오트밀:"🌾",
    라면:"🍜",국수:"🍜",소면:"🍜",우동:"🍜",스파게티:"🍝",파스타:"🍝",
    당면:"🍜",면:"🍜",칼국수면:"🍜",메밀면:"🍜",쌀국수:"🍜",
    식빵:"🍞",바게트:"🥖",베이글:"🥯",또띠아:"🫓",
    // 유제품
    우유:"🥛",생크림:"🥛",두유:"🥛",요거트:"🥛",버터:"🧈",치즈:"🧀",
    모짜렐라:"🧀",파마산:"🧀",크림치즈:"🧀",리코타:"🧀",
    // 양념/소스
    간장:"🍶",된장:"🥣",고추장:"🌶️",청국장:"🥣",쌈장:"🥣",
    참기름:"🫙",들기름:"🫙",올리브오일:"🫒",식용유:"🫙",버터:"🧈",
    소금:"🧂",후추:"🧂",설탕:"🧂",물엿:"🍯",꿀:"🍯",
    고춧가루:"🌶️",청양고추:"🌶️",고추:"🌶️",겨자:"🟡",와사비:"🟢",
    식초:"🍶",청주:"🍶",미림:"🍶",맛술:"🍶",술:"🍶",
    카레:"🟡",강황:"🟡",사프란:"🟡",
    케첩:"🍅",마요네즈:"🧴",머스타드:"🟡",
    굴소스:"🍶",피시소스:"🍶",두반장:"🌶️",춘장:"🟫",
    다시마:"🟢",멸치육수:"🍶",닭육수:"🍶",사골육수:"🍶",
    // 기타
    김:"🟢",미역:"🟢",다시마:"🟢",파래:"🟢",톳:"🟢",
    베이컨:"🥓",햄:"🥩",소시지:"🌭",스팸:"🥫",
    전분:"🌾",밀가루:"🌾",빵가루:"🌾",튀김가루:"🌾",
    물:"💧",육수:"🍶",
  };
  for(const[k,v]of Object.entries(m))if(n.includes(k))return v;
  return"🥬";
}

// ── 라우터 ──
function go(s){S.screen=s;render();}

function render(){
  if(document.getElementById('style-modal')) return;
  const s=S.screen;
  const noTab=["splash","onboard"].includes(s);
  let html='<div class="screen">';
  if(s==="splash") html+=rSplash();
  else if(s==="onboard") html+=rOnboard();
  else if(s==="home") html+=rHome();
  else if(s==="schedule") html+=rSchedule();
  else if(s==="a-fridge") html+=rAFridge();
  else if(s==="a-style") html+=rAStyle();
  else if(s==="a-meal") html+=rMeal("a-meal","#F1F8E9");
  else if(s==="bc-entry") html+=rBCEntry();
  else if(s==="b-suggest") html+=rBSuggest();
  else if(s==="bc-cart") html+=rBCCart();
  else if(s==="bc-meal") html+=rMeal("bc-meal","#FCE4EC");
  else if(s==="recipe") html+=rRecipe();
  else if(s==="tab-fridge") html+=rFridgeTab();
  else if(s==="tab-meal") html+=rMealTab();
  else if(s==="tab-diary") html+=rDiaryTab();
  else if(s==="tab-cart") html+=rCartTab();
  html+='</div>';
  if(!noTab){
    const tabs=[{k:"home",i:"🏠",l:"홈"},{k:"tab-fridge",i:"❄️",l:"냉장고"},{k:"tab-meal",i:"📅",l:"식단표"},{k:"tab-diary",i:"📔",l:"식단일기"},{k:"tab-cart",i:"🛒",l:"장보기"}];
    html+=`<div class="tab-bar">${tabs.map(t=>`<button class="tab-btn" onclick="go('${t.k}')"><div style="width:28px;height:28px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;background:${S.screen===t.k?"var(--primary-pale)":"transparent"}">${t.i}</div><span style="font-size:10px;color:${S.screen===t.k?"var(--primary)":"var(--text-sub)"};font-weight:${S.screen===t.k?700:500}">${t.l}</span>${t.k==="tab-cart"&&S.cart.length>0?'<span style="position:absolute;top:8px;right:10px;width:7px;height:7px;background:var(--accent);border-radius:50%"></span>':""}</button>`).join("")}</div>`;
  }
  document.getElementById("app").innerHTML=html;
}

// ── 스플래시 ──
function rSplash(){
  setTimeout(()=>{
    if(!localStorage.getItem("wm_schedule_set")) go("onboard");
    else go("home");
  }, 3200);
  return`<div style="position:fixed;inset:0;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;gap:4px">
    <!-- 타이틀 -->
    <div style="text-align:center;animation:fadeUp 0.7s ease both">
      <div style="font-size:36px;font-weight:900;color:#4B3FD8;letter-spacing:-2px;line-height:1">WEEKLY MEAL</div>
    </div>
    <!-- 슬로건 -->
    <div style="text-align:center;margin-bottom:4px;animation:fadeUp 0.7s ease 0.15s both">
      <div style="font-size:16px;color:#8B95A1;font-weight:500;letter-spacing:-0.3px">한 주의 식사를 더 스마트하게</div>
    </div>
    <!-- 프라이팬 GIF -->
    <div style="animation:fadeUp 0.7s ease 0.3s both">
      <img src="data:image/gif;base64,R0lGODlhIANYAvf/AFtbWzAwMF1dXeoAAF5eXjExMYODg7y8vHJycr01Ntvb2zY2No2NjZKSkmRkZKk5Ozk5OdTU1Jubm9ujoejo6Ofn5+IEA2UjJODg4IQfHudNTkdHR1xcXP/V1qurqzMzM0pKSv/Gxz4+Pu0AAN0EBVZWVskVFVolJcoKCv+2t2BgYNIXGE9PT9DQ0MnJydQkJf6lplczNMXFxf6Zmu3s7G1tbaCgoH9ub1FRUX8tMLESE1hYWHd3d7e3t83NzbCwsKtER6WlpbRAQWlpaV1dXdw1Na2trchwcero6btEQ0BAQM8JC/+Gh3gjJskmJmw6PX5+fr5hY/x4edRBQrwoKdlXWMHBweV3eMc1Nurq6i0tLfRlZv/29uyGh+kBALU9POsBAK5UVOl/f8hGRtUHBuTk5N1mZuCWl5YXGLtVVvAAAJQ9P+oAAWgxMeA8PIkZGtIIB+oBAlAnKDIvMNE6O2AwM9aDhdQHCP/h4uzp6tYLDKETFM9YWKeNj7wPEN+lqdIeHtEND86ZmecCAvSWl31UVdKztS4xMWxRU/6foP/AwbSLi9oHB+9dXplFRuoCAOcDBNfKy/+Tk8BBQY9mZlhBQv+Mjf/6/O4BAjAwLtViY9kuL4U6Ov/Q0eRFRcSPknZhY91wccgtLuTT1MkdHtdQUYoqK/+xseufn9zAwfefoJVWV8YNDa8gIP5/gPdsbaN6e6dlZkkxM+oAA4AjJaeVlNxcXexVVugDAOTKy98EBf6rrOUDAv/a25aWlv+7vEIrLEtDQzguL59TVNIqK//LzPG/wdjY2IIpKewCBTs7O9kGBvtyc/GOj1dXV6Ojo5FycysxMFxaW+VtbXp6estOT7m5uTExM+bj5Kenp1VPTriztIeHh/De4KioqM/Pz+ynqcM8PusAAKhYWuzo54RqbNIyMzAvMnwdHuzn6UJEREJCQkRERNPT09jT00xMTLupqpmNjvKzs4RQT8KentASE+jh4XEgIL4cHLKgoW9rbFkqLbOzs1NTU9ZJSv///yH5BAQEAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAIANYAgAI/gAvCRxIsKDBgwgTKlzIsKHDhxAjSpxIsaLFixgzatzIsaPHjyBDihxJsqTJkyhTqlzJsqXLlzBjypxJs6bNmzhz6tzJs6fPn0CDCh1KtKjRo0iTKl3KtKnTp1CjSp1KtarVq1izat3KtavXr2DDih1LtqzZs2jTql3Ltq3bt3Djyp1Lt67du3jz6t3Lt6/fv4ADCx5MuLDhw4gTK17MuLHjx5AjS55MubLly5gza97MubPnz6BDix5NurTp06hTq17NurXr17Bjy55Nu7bt27hz697Nu7fv38CDCx9OvLjx48iTK1/OvLnz59CjS59Ovbr169iza9/Ovbv37+DD/osfT768+fPo06tfz769+/fw48ufT7++/fv48+vfz7+///8ABijggAQWaOCBCCao4IIMNujggxBGKOGEFFZo4YUYZqjhhhx26OGHIIYo4ogklmjiiSimqOKKLLbo4oswxijjjDTWaOONOOao44489ujjj0AGKeSQRBZp5JFIJqnkkkw26eSTUEYp5ZRUVmnllVhmqeWWXHbp5ZdghinmmGSWaeaZaKap5ppstunmm3DGKeecdNZp55145qnnnnz26eefgAYq6KCEFmrooYgmquiijDbq6KOQRirppJRWaumlmGaq6aacdurpp6CGKuqopJZq6qmopqrqqqy26uqr/rDGKuustNZq66245qrrrrz26uuvwAYr7LDEFmvsscgmq+yyzDbr7LPQRivttNRWa+212Gar7bbcduvtt+CGK+645JZr7rnopqvuuuy26+678MYr77z01mvvvfjmq+++/Pbr778AByzwwAQXbPDBCCes8MIMN+zwwxBHLPHEFFds8cUYZ6zxxhx37PHHIIcs8sgkl2zyySinrPLKLLfs8sswxyzzzDTXbPPNOOes88489+zzz0AHLfTQRBdt9NFIJ6300kw37fTTUEct9dRUV2311VhnrfXWXHft9ddghy322GSXbfbZaKet9tpst+3223DHLffcdNdt99145633/t589+3334AHLvjghBdu+OGIJ6744ow37vjjkEcu+eSUV2755ZhnrvnmnHfu+eeghy766KSXbvrpqKeu+uqst+7667DHLvvstNdu++24q8kFDRRQUAYGwCsQwfDEF2/88AooADwGFVBAAxdc5M4TDUgo0I4LVvBjgwTU8FCDMyX0884HBQRg/vnopy9CP+yrwAMPDEjgwQEutINBFtGfXMEPHvTv//8ADKAAB0jAAhrwgAhMoAIXuMAD0OASXMDAMfL3ERpgoAVWMIIEDOAAZ2yAfAEoXwjTR8ISllCE5yuAEvpRA2484wATJBkXDLCAAqDQhDjMoQ53yMMe+vCH/kAMovlsuAEPXMIF1BgCPyhoEd+1wAX8yEYDDIAAArwDAja8IQ5tKMT03bAAH9jAECRQhpFxgRpa7KIa18jGNrpxh+vIBg0aUMMhPNAhFAAe9nrwDAlwg4o1IIAHRcDFN/4wjSM0HwQQQIGRKQABhoykJCdJyRTaEAISoEEWoGBDHPjgGKCMgAx60IMoNqABDKBGDWrgABUQoB8sAIESlPGBRFYykmA0AMlkYMtb+vKXwPSiDdnxQApAIYQLeAcLlhlLdjhzlsqAQC0LGUJEBpONw/TByCJwzW56k5JZ3IBAKnDM8mnRmiNE5zeFyMUFcMORLFDnOudJzxPasAYC/kHCMYdoS0TKs55BzCIARlaGGlQToAhNqCUL0ACBGFOh88xiCe4IMhr4IosQzWhEbegCh+5To9fMYj/KKLIDiKCXIE3pLYeZv4eqFJgCJZkChkDNl9oUlwWAwkBcetNK2vAD+BwZDSRQw54a9Y0L0KZHa8rPHYrwnyktHwRsUDIXOAOqR82qCQtQA4oa04YiGEL4WLAOIGJVozZ8BwZKRgMGLECrcAXiAg5AkK8WoATHWJ7wfNADD2yQGjt4Rw3PalMbSuBkLSAAYeNq1PIZIAt15WQBdkBRgkCPBpjVpAJk4I0GIMAZRY0rV5lIsmywA6OMTa0ld9AOgwRBBIus/mxEaBCBHnCPCBtQAmwXQD7UOnWxOcziByAggnUQ4QekJVkWEDBYlKr2qOVTgjdkewkKPKMBa+VIO6xgA24MwRks2MA6pAncgBaAuOwAQT8cwI0fxHBlLeAACJ/L2PMagKQroYECrOGBVLKSA7DMrRKw2MOnKlIJSlBmPwjggBZKgB8uqIDM+LGB8tIXoQsYQmtnwoUKKMAFB+DHM2wwRQMYgBoIWKWKV7xKBFDDxAbwhQ2eYQ36YYC6M/PAW5t6YZUKdwcyCAoNykDkIhv5dxVIrs+40AAsMrXHCjVnWntguSw0+clQjnIBNtADJUMOCXS0cJZ9ed4DeDlyNDDt/phB+o4WcI4LPShBb9dMTxsuoAYK+JwPhkBgOnvTnOvgBn49hwEDgMDPf16AM4KA4zf/gABzRvRKlUANF5y5cy1gwDvELGkdFoAAQRh06WjQAwSclNOdHuIwufEN1kXQAyqYb6q7eF4EHACyrovg8XbN6177+tfADrawhd2OdgxPwtJLtrKXzexmO/vZ0I62tKdN7Wpb+9rYzra2t83tbnv72+AOt7jHTe5ym/vc6E63utfN7na7+93wjre8503vetv73vjOt773ze9++/vfAA+4wAdO8IIb/OAIT7jCF87wn0Hv4ZfNrMQnTvGKW/ziGM+4xjfO8YtDr3QPf17H/kdO8pKb/OQb/3joII7ylrv85TDP7O4g/rmZyzzmOM+5zim+O8zOvHMR9/nOh070nM/80pILes+LzvSmoxzpkAu5yJ1O9ap3HOqOk7rVt871iqscc1rvuti5/vXLhX3saKc61rO+9LS7vehrZ/vb567zo3fu5nTPu8vjHvWz6/3vGKc56PwO+MJL/OEgD7rhF1/2hjv+8ZCPvOQnT/nKW/7ymM+85jfP+c57/vOgD73oR0/60pv+9KhPvepXz/rWu/71sI+97GdP+9rb/va4z73ud8/73vv+98APvvCHT/ziG//4yE++8pfP/OY7//nQj770p0/96lv/+tjPvva3i8/97nv/++APv/jHT/7ym//86E+/+tfP/va7//3wj7/850//+tv//vjPv/73z//++///ABiAAjiABFiABniACJiACriADNiADviAEBiBEjiBFFiBFniBGJiBGriBHNiBHviBIBiCIjiCJFiCJniCKJiCKriCLNiCLviCMBiDMjiDNFiDNniDOCiCAQEAIfkEBQQA/wAsNgEuAQEBcAAACP4A/wkcSLCgwYMIEypcyLChw4cQI0qc2JCLRRplMPhwYaUHvx/eJPhqQJIBA24oDRiAAoUaNSgGSDaQYOSHlW8KstCgwYWiz59AgwodSnTixQrHZBwwYqOBAWoOHAB4B2LDug8FsgbYyrXr1gILRIhlBwIEixI7HNQwIKFHuzI0isqdW9CiXS478+rVm6VvXwoUKgiuUKZwRgyIE2NQwLixgmOQI0iW3K5yuxYtvmn2wflYTy5ZKvQkancnhm9WftjghgAAC3YLCgSQPdvr1oe2ZWddAGEdiH41GriIW5CGX8CADR9W7Bhy5MmWM3/j7KK6dRnYZVjZzv2A9wPWwv73GO+R38cf6NEbGejNW5D3QWzItyGhvsiRMk2aRJlS5UqWLlHDw4A8IGBgDQgiOMQQUUWlAgEEEMEBADs4U0IJ/fSDAw4s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" style="width:240px;height:240px;object-fit:contain" alt="loading">
    </div>
    <!-- 로딩바 -->
    <div style="margin-top:8px;animation:fadeUp 0.7s ease 0.45s both">
      <div style="width:120px;height:4px;background:#F0EEFF;border-radius:4px;overflow:hidden">
        <div style="height:100%;background:#4B3FD8;border-radius:4px;animation:loadBar 3s ease forwards"></div>
      </div>
    </div>
  </div>
  `;
}

function rOnboard(){
  const mealMeta={
    "아침":{sub:"가볍게 시작",color:"#FF9F1C",bg:"#FFF7E8"},
    "점심":{sub:"든든한 한 끼",color:"var(--primary)",bg:"var(--primary-pale)"},
    "저녁":{sub:"하루 마무리",color:"#425466",bg:"#EEF2FF"},
  };
  const total=totalMeals();
  return`<div style="padding:48px 20px 12px;background:linear-gradient(180deg,#fff,#F7F7FB);position:sticky;top:0;z-index:20">
    <div class="title" style="margin-bottom:4px">식사 스케줄 설정</div>
    <div style="font-size:14px;color:var(--text-sub);line-height:1.45">요일별로 식단을 생성할 끼니를 선택해주세요.</div>
  </div>
  <div class="px" style="padding-bottom:150px">
    <div style="background:#fff;border:1px solid var(--border);border-radius:20px;padding:14px;margin:10px 0 14px;box-shadow:var(--shadow)">
      <div style="font-size:11px;font-weight:700;color:var(--text-sub);letter-spacing:1px;margin-bottom:10px">👥 몇 인 가족이에요?</div>
      <div style="display:flex;gap:8px">
        ${[1,2,3,4].map(n=>`<button onclick="S.people=${n};render()" style="flex:1;padding:12px 0;border-radius:14px;border:2px solid ${S.people===n?'var(--primary)':'var(--border)'};background:${S.people===n?'var(--primary-pale)':'#fff'};color:${S.people===n?'var(--primary)':'var(--text)'};font-weight:900;font-size:15px">${n}인</button>`).join("")}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0 14px">
      ${["아침","점심","저녁"].map(m=>{
        const cnt=DAYS.filter(d=>(S.schedule[d]||[]).includes(m)).length;
        return `<div style="background:#fff;border:1px solid var(--border);border-radius:16px;padding:12px;text-align:center;box-shadow:var(--shadow)">
          ${rMealSlotIcon(m,true)}
          <div style="font-size:12px;font-weight:800;margin-top:7px">${m}</div>
          <div style="font-size:11px;color:#8B95A1;margin-top:2px">${cnt}일 선택</div>
        </div>`;
      }).join("")}
    </div>

    ${DAYS.map(day=>`<div style="background:#fff;border:1px solid var(--border);border-radius:20px;padding:14px;margin-bottom:10px;box-shadow:var(--shadow)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div style="font-weight:900;font-size:16px">${day}요일</div>
        <div style="font-size:12px;color:var(--text-sub);font-weight:700">${(S.schedule[day]||[]).length}끼</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${["아침","점심","저녁"].map(m=>{
          const on=(S.schedule[day]||[]).includes(m);
          const meta=mealMeta[m];
          return `<button type="button" onclick="toggleSlot('${day}','${m}')" style="min-height:86px;padding:10px 6px;border-radius:17px;border:2px solid ${on?meta.color:'var(--border)'};background:${on?meta.bg:'#F7F8FA'};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font-family:inherit;transition:all .14s ease;box-shadow:${on?'0 5px 14px rgba(75,63,216,.12)':'none'};opacity:${on?1:.72}">
            ${rMealSlotIcon(m,on)}
            <span style="font-size:14px;font-weight:900;color:${on?meta.color:'#9AA3AF'}">${m}</span>
            <span style="font-size:10px;font-weight:700;color:${on?meta.color:'#B0B7C3'}">${on?'선택됨':meta.sub}</span>
          </button>`;
        }).join("")}
      </div>
    </div>`).join("")}

    <div style="background:#E8F5E9;border-radius:18px;padding:16px;margin-top:10px;text-align:center;border:1px solid #C8E6C9">
      <div style="font-size:13px;color:#2e7d32;font-weight:900">총 ${total}끼 설정됨</div>
      <div style="font-size:11px;color:#66A06A;margin-top:4px">선택한 끼니 기준으로 식단이 생성돼요</div>
    </div>

    <div style="background:#fff;border:1px solid var(--border);border-radius:20px;padding:14px;margin-top:14px;box-shadow:var(--shadow)">
      <div style="font-size:11px;font-weight:700;color:var(--text-sub);letter-spacing:1px;margin-bottom:10px">📅 식단 기간</div>
      <div style="display:flex;gap:8px">
        ${[
          {v:1,label:"1주일",sub:"7일",icon:"📅"},
          {v:2,label:"2주일",sub:"14일",icon:"📆"},
          {v:4,label:"한달",sub:"30일",icon:"🗓️"},
        ].map(p=>`<button onclick="S.planDuration=${p.v};render()" style="flex:1;padding:12px 8px;border-radius:14px;border:2px solid ${S.planDuration===p.v?'var(--primary)':'var(--border)'};background:${S.planDuration===p.v?'var(--primary-pale)':'#fff'};text-align:center;cursor:pointer">
          <div style="font-size:20px;margin-bottom:4px">${p.icon}</div>
          <div style="font-weight:800;font-size:14px;color:${S.planDuration===p.v?'var(--primary)':'var(--text)'}">${p.label}</div>
          <div style="font-size:11px;color:#aaa">${p.sub}</div>
        </button>`).join("")}
      </div>
    </div>
  </div>
  <div class="bottom-bar">
    <button onclick="completeOnboard()" ${total===0?'disabled':''} class="btn-p" style="background:${total>0?'var(--primary)':'#e0e0e0'}!important;box-shadow:${total>0?'0 8px 24px rgba(75,63,216,0.3)':'none'}!important">
      ${total>0?`${total}끼로 시작하기 →`:"끼니를 선택해주세요"}
    </button>
  </div>`;
}

function completeOnboard(){
  if(Object.values(S.schedule).reduce((a,b)=>a+b.length,0)===0)return;
  saveSched();
  localStorage.setItem("wm_schedule_set","1");
  localStorage.setItem("wm_plan_duration",String(S.planDuration||1));
  go("home");
}

function rHome(){
  const hour=new Date().getHours();
  const greet=hour<12?"좋은 아침이에요":hour<18?"오늘도 맛있게 챙겨볼까요?":"오늘 식단을 마무리해볼까요?";
  const urgent=S.fridge.filter(i=>getDday(i.addedAt,i.expireDays)<=3&&getDday(i.addedAt,i.expireDays)>0).length;
  const expired=S.fridge.filter(i=>getDday(i.addedAt,i.expireDays)<=0).length;
  const planDays=S.planDuration||1;
  const dayMealCount=Object.values(S.schedule||{}).reduce((a,b)=>a+(Array.isArray(b)?b.length:0),0);
  const plannedMeals=Math.max(0, dayMealCount*planDays);
  const todayName=DAYS[(new Date().getDay()+6)%7];
  const todaySlots=(S.schedule&&Array.isArray(S.schedule[todayName]))?S.schedule[todayName]:[];
  const todayCount=todaySlots.length;
  const cartCount=(S.cart||[]).filter(i=>!i.checked).length;
  const fridgeCount=(S.fridge||[]).length;

  // 진행중인 플로우가 있으면 기존 플로우 화면 유지
  if(S.activeFlow==="a") return rHomeA();
  if(S.activeFlow==="b") return rHomeB();
  if(S.activeFlow==="c") return rHomeC();

  // 이번 주 식단이 완성된 경우 기존 완료 홈 유지
  if(S.mealPlan){
    return rHomeDone();
  }

  return`
  <div style="min-height:100%;padding:54px 20px 120px;background:linear-gradient(180deg,#F4F0FF 0%,#FAF9FF 42%,#F7F7FB 100%)">

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <div>
        <div style="font-size:13px;color:#7C6FC9;font-weight:700;margin-bottom:5px">${greet}</div>
        <div style="font-size:28px;line-height:1.12;font-weight:900;letter-spacing:-1.1px;color:#171421">이번 주 식단</div>
      </div>
      <button onclick="go('schedule')" style="width:42px;height:42px;border:none;border-radius:16px;background:#fff;box-shadow:0 10px 26px rgba(87,70,180,.10);font-size:18px">⚙️</button>
    </div>

    <div style="position:relative;overflow:hidden;border-radius:30px;padding:22px;background:linear-gradient(145deg,#7C5CFF 0%,#9D7BFF 55%,#BBA5FF 100%);box-shadow:0 24px 48px rgba(124,92,255,.22);color:#fff;margin-bottom:18px">
      <div style="position:absolute;right:-28px;top:-24px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.16)"></div>
      <div style="position:absolute;right:42px;bottom:-46px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.11)"></div>
      <div style="position:relative;z-index:1">
        <div style="font-size:12px;font-weight:700;opacity:.82;margin-bottom:8px">WEEKLY MEAL PLAN</div>
        <div style="display:flex;align-items:flex-end;gap:8px;margin-bottom:4px">
          <div style="font-size:42px;font-weight:900;letter-spacing:-1.8px;line-height:1">${plannedMeals||0}</div>
          <div style="font-size:15px;font-weight:800;margin-bottom:6px;opacity:.92">끼 예정</div>
        </div>
        <div style="font-size:13px;opacity:.82;margin-bottom:14px">${planDays===4?'한 달':planDays===2?'2주':'1주'} 기준 · ${S.people||1}인분 장보기까지 한 번에</div>
        <div style="height:50px;border-radius:18px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;letter-spacing:-.2px">아래에서 시작 방식을 선택하세요</div>
      </div>
    </div>

    ${(urgent>0||expired>0)?`<button onclick="go('tab-fridge')" style="width:100%;border:none;border-radius:22px;background:#FFF3F5;padding:14px 16px;margin-bottom:16px;display:flex;align-items:center;gap:12px;text-align:left;box-shadow:0 10px 24px rgba(255,90,122,.08)">
      <div style="width:42px;height:42px;border-radius:15px;background:#FF5A7A;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px">!</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:900;color:#B4233B">냉장고 확인이 필요해요</div>
        <div style="font-size:12px;color:#8B5A66;margin-top:2px">${expired>0?`만료 ${expired}개`:''}${expired>0&&urgent>0?' · ':''}${urgent>0?`3일 이내 ${urgent}개`:''}</div>
      </div>
      <div style="font-size:20px;color:#D98A9A">›</div>
    </button>`:''}

    <div style="font-size:12px;font-weight:900;color:#7E7694;letter-spacing:.5px;margin:2px 2px 10px">식단 시작하기</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px">
      <button onclick="setFlow('a');go('home')" style="border:none;border-radius:24px;background:#fff;padding:14px 10px;text-align:left;min-height:136px;box-shadow:0 14px 32px rgba(32,25,84,.07)">
        <div style="width:40px;height:40px;border-radius:16px;background:#EEF9F4;display:flex;align-items:center;justify-content:center;font-size:21px;margin-bottom:12px">🥕</div>
        <div style="font-size:14px;font-weight:900;color:#171421;line-height:1.22;letter-spacing:-.5px">냉장고<br>활용</div>
        <div style="font-size:10px;color:#9A95AA;margin-top:7px;line-height:1.35">${fridgeCount?`${fridgeCount}가지 재료`:'있는 재료로'}</div>
      </button>
      <button onclick="setFlow('b');go('home')" style="border:none;border-radius:24px;background:#fff;padding:14px 10px;text-align:left;min-height:136px;box-shadow:0 14px 32px rgba(32,25,84,.07)">
        <div style="width:40px;height:40px;border-radius:16px;background:#F3F0FF;display:flex;align-items:center;justify-content:center;font-size:21px;margin-bottom:12px">✨</div>
        <div style="font-size:14px;font-weight:900;color:#171421;line-height:1.22;letter-spacing:-.5px">추천<br>받기</div>
        <div style="font-size:10px;color:#9A95AA;margin-top:7px;line-height:1.35">뭐 먹을지<br>모를 때</div>
      </button>
      <button onclick="setFlow('c');go('home')" style="border:none;border-radius:24px;background:#fff;padding:14px 10px;text-align:left;min-height:136px;box-shadow:0 14px 32px rgba(32,25,84,.07)">
        <div style="width:40px;height:40px;border-radius:16px;background:#FFF2E9;display:flex;align-items:center;justify-content:center;font-size:21px;margin-bottom:12px">🍽️</div>
        <div style="font-size:14px;font-weight:900;color:#171421;line-height:1.22;letter-spacing:-.5px">직접<br>선택</div>
        <div style="font-size:10px;color:#9A95AA;margin-top:7px;line-height:1.35">먹고 싶은<br>메뉴로</div>
      </button>
    </div>

    <div style="font-size:12px;font-weight:900;color:#7E7694;letter-spacing:.5px;margin:2px 2px 10px">오늘 요약</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px">
      <div style="background:#fff;border-radius:22px;padding:14px 10px;text-align:center;box-shadow:0 12px 28px rgba(32,25,84,.06)">
        <div style="font-size:20px;font-weight:900;color:#6D50F6">${todayCount}</div>
        <div style="font-size:10px;color:#9A95AA;font-weight:700;margin-top:3px">오늘 끼니</div>
      </div>
      <div style="background:#fff;border-radius:22px;padding:14px 10px;text-align:center;box-shadow:0 12px 28px rgba(32,25,84,.06)">
        <div style="font-size:20px;font-weight:900;color:#6D50F6">${cartCount}</div>
        <div style="font-size:10px;color:#9A95AA;font-weight:700;margin-top:3px">장보기</div>
      </div>
      <div style="background:#fff;border-radius:22px;padding:14px 10px;text-align:center;box-shadow:0 12px 28px rgba(32,25,84,.06)">
        <div style="font-size:20px;font-weight:900;color:#6D50F6">${S.people||1}</div>
        <div style="font-size:10px;color:#9A95AA;font-weight:700;margin-top:3px">인분</div>
      </div>
    </div>

    <div style="background:rgba(255,255,255,.76);border:1px solid rgba(124,92,255,.08);border-radius:24px;padding:16px;box-shadow:0 12px 28px rgba(32,25,84,.05)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div style="font-size:13px;font-weight:900;color:#171421">기본 설정</div>
        <button onclick="go('schedule')" style="border:none;background:#F1EDFF;color:#6D50F6;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:900">수정</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        ${[1,2,3,4].map(n=>`<button onclick="S.people=${n};render()" style="flex:1;border:none;border-radius:14px;padding:10px 0;background:${S.people===n?'#6D50F6':'#F4F2FA'};color:${S.people===n?'#fff':'#8A849A'};font-size:13px;font-weight:900">${n}인</button>`).join('')}
      </div>
      <div style="display:flex;gap:4px">
        ${["월","화","수","목","금","토","일"].map(d=>{
          const slots=S.schedule[d]||[];
          return`<div style="flex:1;text-align:center;padding:8px 0;border-radius:12px;background:${slots.length?'#F3F0FF':'#F7F7FA'}">
            <div style="font-size:10px;font-weight:900;color:${slots.length?'#6D50F6':'#C0BBCB'}">${d}</div>
            <div style="font-size:9px;color:#A19BAC;margin-top:2px">${slots.length?slots.length+'끼':'-'}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

  </div>`;
}

// 식단 완성 후 홈
function rHomeDone(){
  const urgent=S.fridge.filter(i=>getDday(i.addedAt,i.expireDays)<=3&&getDday(i.addedAt,i.expireDays)>0).length;
  const expired=S.fridge.filter(i=>getDday(i.addedAt,i.expireDays)<=0).length;
  return`
  <div style="padding:80px 20px 14px;background:linear-gradient(160deg,#E8F5E9,#fff)">
    <div style="font-size:13px;color:var(--text-sub);margin-bottom:4px">이번 주 식단 완성 ✅</div>
    <div class="title" style="font-size:24px;margin-bottom:12px">잘 먹고 계신가요? 🍽️</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <span class="badge" style="background:#E8F5E9;color:#2e7d32">❄️ 냉장고 ${S.fridge.length}가지</span>
      
    </div>
  </div>
  <div style="padding:8px 20px 24px">
    ${urgent>0||expired>0?`<div style="background:#FFF0F0;border:1.5px solid #FFD0D0;border-radius:16px;padding:14px;margin-bottom:14px;display:flex;align-items:center;gap:12px" onclick="go('tab-fridge')">
      <div style="width:40px;height:40px;background:#FF6B6B;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">⚠️</div>
      <div style="flex:1">${expired>0?`<div style="font-size:13px;font-weight:700;color:var(--accent)">만료된 재료 ${expired}개</div>`:""} ${urgent>0?`<div style="font-size:13px;font-weight:600;color:var(--primary)">3일 이내 만료 ${urgent}개</div>`:""}</div>
      <span style="color:#ddd">›</span>
    </div>`:""}

    <button onclick="go('tab-meal')" style="width:100%;border-radius:20px;padding:18px 20px;display:flex;align-items:center;gap:16px;text-align:left;margin-bottom:10px;border:2px solid #A5D6A7;background:linear-gradient(135deg,#E8F5E9,#F0FFF6);box-shadow:var(--shadow)">
      <div style="width:52px;height:52px;background:linear-gradient(135deg,#2ECC71,#27AE60);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">📅</div>
      <div style="flex:1">
        <div style="font-weight:800;font-size:16px;color:var(--text)">이번 주 식단 보기</div>
        <div style="font-size:12px;color:var(--text-sub);margin-top:3px">${S.mealStartDate||""} 시작</div>
      </div>
      <span style="font-size:20px;color:#2ECC71">›</span>
    </button>

    ${S.cart.length>0?`<button onclick="go('bc-cart')" style="width:100%;border-radius:20px;padding:18px 20px;display:flex;align-items:center;gap:16px;text-align:left;margin-bottom:10px;border:2px solid #FFE0B2;background:linear-gradient(135deg,#FFF8EE,#FFF3E0);box-shadow:var(--shadow)">
      <div style="width:52px;height:52px;background:linear-gradient(135deg,var(--primary),#E67E22);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">🛒</div>
      <div style="flex:1">
        <div style="font-weight:800;font-size:16px;color:var(--text)">장보기 목록 확인</div>
        <div style="font-size:12px;color:var(--text-sub);margin-top:3px">${S.cart.filter(i=>!i.checked).length}개 남음</div>
      </div>
      <span style="font-size:20px;color:var(--primary)">›</span>
    </button>`:""}

    <div style="background:#f8f8f8;border-radius:16px;padding:16px;margin-top:8px">
      <div style="font-size:13px;color:#888;margin-bottom:12px;font-weight:600">다음 주 식단 준비</div>
      <button onclick="confirmNewPlan()" style="width:100%;padding:14px;background:var(--primary);color:#fff;border:none;border-radius:14px;font-weight:700;font-size:14px">🔄 새 식단 짜기</button>
    </div>

    <div style="display:flex;gap:8px;margin-top:10px">
      <button onclick="go('schedule')" style="flex:1;background:var(--card);border:none;border-radius:14px;padding:12px;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:var(--shadow)">
        <span>⚙️</span><span style="font-size:12px;color:var(--text-sub);font-weight:600">스케줄</span>
      </button>
      <button onclick="S.people=S.people%4+1;render()" style="flex:1;background:var(--card);border:none;border-radius:14px;padding:12px;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:var(--shadow)">
        <span>👥</span><span style="font-size:12px;color:var(--text-sub);font-weight:600">${S.people}인</span>
      </button>

    </div>
  </div>`;
}

function confirmNewPlan(){
  const el=document.createElement("div");
  el.id="confirm-popup";
  el.style.cssText="position:fixed;inset:0;background:rgba(26,26,46,0.7);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px";
  el.innerHTML=`<div style="background:#fff;border-radius:24px;padding:28px 24px;width:100%;max-width:360px;text-align:center">
    <div style="font-size:40px;margin-bottom:12px">🔄</div>
    <div style="font-weight:800;font-size:18px;margin-bottom:8px">새 식단을 짤까요?</div>
    <div style="font-size:13px;color:#888;margin-bottom:20px;line-height:1.6">현재 식단과 장보기 목록이<br>초기화돼요</div>
    <div style="display:flex;gap:8px">
      <button onclick="document.getElementById('confirm-popup').remove()" style="flex:1;padding:13px;background:#f0f0f0;color:#666;border:none;border-radius:12px;font-weight:700">취소</button>
      <button onclick="document.getElementById('confirm-popup').remove();startNewPlan()" style="flex:1;padding:13px;background:var(--primary);color:#fff;border:none;border-radius:12px;font-weight:700">새로 짜기</button>
    </div>
  </div>`;
  document.body.appendChild(el);
}

function startNewPlan(){
  S.mealPlan=null;
  S.mealCalendar=null;
  S.mealStartDate=null;
  S.cart=[];
  S.bcMenus=[];
  S.bcStyles=[];
  S.bcSuggested=[];
  S.fridgeAdded=false;
  S.cartDone=false;
  S.activeFlow=null;
  S._showFlow=false;
  localStorage.removeItem("wm_cart_done");
  localStorage.removeItem("wm_meal");
  localStorage.removeItem("wm_meal_start");
  localStorage.removeItem("wm_cal");
  localStorage.removeItem("wm_flow");
  render();
}

// A플로우 홈
function rHomeA(){
  return`
  <div style="padding:0 20px 0;background:linear-gradient(160deg,#E8F5E9,#fff);position:fixed;top:0;left:0;right:0;max-width:480px;margin:0 auto;z-index:100;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:36px;height:36px;background:linear-gradient(135deg,#2ECC71,#3498DB);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px">❄️</div>
        <div>
          <div style="font-weight:800;font-size:17px">냉장고 재료로 짜기</div>
          <div style="font-size:11px;color:#aaa">A 플로우</div>
        </div>
      </div>
    </div>
  </div>
  <div style="padding:120px 20px 24px">
    <!-- 단계 표시 -->
    ${rFlowSteps(["냉장고 확인","스타일 선택","식단 생성","장보기"], S.mealPlan?3:S.bcStyles.length?1:0)}
    <div style="display:flex;flex-direction:column;gap:12px;margin-top:0">
      <!-- 1단계: 냉장고 -->
      <button onclick="S.bcStyles.length>0?null:go('a-fridge')" style="width:100%;padding:16px 18px;border-radius:16px;border:2px solid ${S.fridge.length>0?"#2ECC71":"var(--border)"};background:${S.fridge.length>0?"#F0FFF6":"var(--card)"};display:flex;align-items:center;gap:14px;text-align:left;box-shadow:var(--shadow)">
        <span style="font-size:24px">${S.fridge.length>0?"✅":"❄️"}</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px">냉장고 재료 확인</div>
          <div style="font-size:12px;color:var(--text-sub)">${S.fridge.length>0?`${S.fridge.length}가지 재료 입력됨`:"재료를 추가해주세요"}</div>
        </div>
        <span style="color:#aaa">›</span>
      </button>
      <!-- 2단계: 스타일 -->
      <button onclick="S.mealPlan?null:go('a-style')" style="width:100%;padding:16px 18px;border-radius:16px;border:2px solid ${S.bcStyles.length>0?"var(--primary)":"var(--border)"};background:${S.bcStyles.length>0?"var(--primary-pale)":"var(--card)"};display:flex;align-items:center;gap:14px;text-align:left;box-shadow:var(--shadow);opacity:${S.mealPlan?0.65:S.fridge.length>0?1:0.4};cursor:${S.mealPlan?"default":S.fridge.length>0?"pointer":"default"}">
        <span style="font-size:24px">${S.bcStyles.length>0?"✅":"🍽️"}</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px">식사 스타일 선택</div>
          <div style="font-size:12px;color:var(--text-sub)">${S.bcStyles.length>0?S.bcStyles.join(", "):"한식/일식/중식/국가별"}</div>
        </div>
        <span style="color:#aaa">›</span>
      </button>
      <!-- 3단계: 식단 생성 -->
      <button onclick="${S.fridge.length>0&&S.bcStyles.length>0?"genAMeal()":"alert('냉장고 재료와 스타일을 먼저 선택해주세요')"}" style="width:100%;padding:16px 18px;border-radius:16px;border:2px solid ${S.mealPlan?"#2ECC71":"var(--border)"};background:${S.fridge.length>0&&S.bcStyles.length>0?"var(--primary)":"#f5f5f5"};display:flex;align-items:center;gap:14px;text-align:left;box-shadow:var(--shadow)">
        <span style="font-size:24px">${S.mealPlan?"✅":"✨"}</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px;color:${S.fridge.length>0&&S.bcStyles.length>0?"#fff":"#aaa"}">AI 식단 생성</div>
          <div style="font-size:12px;color:${S.fridge.length>0&&S.bcStyles.length>0?"rgba(255,255,255,0.8)":"#bbb"}">${S.mealPlan?"식단이 생성됐어요":"재료와 스타일 선택 후 생성"}</div>
        </div>
        <span style="color:${S.fridge.length>0&&S.bcStyles.length>0?"rgba(255,255,255,0.7)":"#ccc"}">›</span>
      </button>
      ${S.mealPlan?`<button onclick="go('a-meal')" style="width:100%;padding:14px 18px;border-radius:16px;border:2px solid #2ECC71;background:#E8F5E9;display:flex;align-items:center;gap:14px;text-align:left">
        <span style="font-size:22px">📅</span>
        <div style="flex:1"><div style="font-weight:700;font-size:14px;color:#2e7d32">식단 보기</div></div>
        <span style="color:#2ECC71">›</span>
      </button>`:""}
    </div>
  </div>`;
}

// B플로우 홈
function rHomeB(){
  return`
  <div style="padding:0 20px 0;background:linear-gradient(160deg,#FFF8EE,#fff);position:fixed;top:0;left:0;right:0;max-width:480px;margin:0 auto;z-index:100;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0;padding:12px 0 12px">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:36px;height:36px;background:linear-gradient(135deg,var(--primary),#FF6B6B);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px">🤔</div>
        <div>
          <div style="font-weight:800;font-size:17px">뭘 먹을지 모르겠어요</div>
          <div style="font-size:11px;color:#aaa">B 플로우</div>
        </div>
      </div>
    </div>
  </div>
  <div style="padding:120px 20px 24px">
    ${rFlowSteps(["스타일 선택","메뉴 추천","장보기","식단 완성"], S.mealPlan?3:S.cart.length?2:S.bcSuggested.length?1:0)}
    <div style="display:flex;flex-direction:column;gap:12px;margin-top:0">
      <button onclick="S.bcSuggested&&S.bcSuggested.length>0?null:(S.bcMode='b',go('bc-entry'))" style="width:100%;padding:16px 18px;border-radius:16px;border:2px solid ${S.bcStyles.length>0?"var(--primary)":"var(--border)"};background:${S.bcStyles.length>0?"#FFF8EE":"var(--card)"};display:flex;align-items:center;gap:14px;text-align:left;box-shadow:var(--shadow);opacity:${S.bcSuggested&&S.bcSuggested.length>0?0.65:1};cursor:${S.bcSuggested&&S.bcSuggested.length>0?'default':'pointer'}">
        <span style="font-size:24px">${S.bcStyles.length>0?"✅":"🍽️"}</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px">스타일 선택 & 메뉴 추천</div>
          <div style="font-size:12px;color:var(--text-sub)">${S.bcStyles.length>0?S.bcStyles.join(", ")+" 선택됨":"한식/일식/중식/국가별 선택"}</div>
        </div>
        <span style="color:#aaa">›</span>
      </button>
      ${S.bcSuggested.length>0?`<button onclick="S.cart&&S.cart.length>0?null:go('b-suggest')" style="width:100%;padding:16px 18px;border-radius:16px;border:2px solid var(--primary);background:#FFF8EE;display:flex;align-items:center;gap:14px;text-align:left;box-shadow:var(--shadow)">
        <span style="font-size:24px">${S.cart.length>0?"✅":"🛒"}</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px">메뉴 선택 & 장보기</div>
          <div style="font-size:12px;color:var(--text-sub)">${S.cart.length>0?`장보기 ${S.cart.length}개 항목`:"메뉴를 골라주세요"}</div>
        </div>
        <span style="color:#aaa">›</span>
      </button>`:""}
      ${S.cart.length>0?`<button onclick="go('bc-cart')" style="width:100%;padding:16px 18px;border-radius:16px;border:2px solid #2ECC71;background:#E8F5E9;display:flex;align-items:center;gap:14px;text-align:left;box-shadow:var(--shadow)">
        <span style="font-size:22px">🛒</span>
        <div style="flex:1"><div style="font-weight:700;font-size:14px">장보기 목록 확인</div></div>
        <span style="color:#aaa">›</span>
      </button>`:""}
      ${S.mealPlan?`<button onclick="go('bc-meal')" style="width:100%;padding:14px 18px;border-radius:16px;border:2px solid #2ECC71;background:#E8F5E9;display:flex;align-items:center;gap:14px;text-align:left">
        <span style="font-size:22px">📅</span>
        <div style="flex:1"><div style="font-weight:700;font-size:14px;color:#2e7d32">식단 보기</div></div>
        <span style="color:#2ECC71">›</span>
      </button>`:""}
    </div>
  </div>`;
}

// C플로우 홈
function rHomeC(){
  return`
  <div style="padding:0 20px 0;background:linear-gradient(160deg,#FCE4EC,#fff);position:fixed;top:0;left:0;right:0;max-width:480px;margin:0 auto;z-index:100;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:36px;height:36px;background:linear-gradient(135deg,var(--accent),var(--primary));border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px">🍖</div>
        <div>
          <div style="font-weight:800;font-size:17px">먹고 싶은 메뉴가 있어요</div>
          <div style="font-size:11px;color:#aaa">C 플로우</div>
        </div>
      </div>
    </div>
  </div>
  <div style="padding:120px 20px 24px">
    ${rFlowSteps(["메뉴 입력","재료 분석","장보기","식단 완성"], S.mealPlan?3:S.cart.length?2:S.bcMenus.length?1:0)}
    <div style="display:flex;flex-direction:column;gap:12px;margin-top:0">
      <button onclick="S.cart&&S.cart.length>0?null:(S.bcMode='c',go('bc-entry'))" style="width:100%;padding:16px 18px;border-radius:16px;border:2px solid ${S.bcMenus.length>0?"var(--accent)":"var(--border)"};background:${S.bcMenus.length>0?"#FFF0F5":"var(--card)"};display:flex;align-items:center;gap:14px;text-align:left;box-shadow:var(--shadow)">
        <span style="font-size:24px">${S.bcMenus.length>0?"✅":"🍖"}</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px">메뉴 입력</div>
          <div style="font-size:12px;color:var(--text-sub)">${S.bcMenus.length>0?S.bcMenus.slice(0,3).join(", ")+(S.bcMenus.length>3?" 외 "+(S.bcMenus.length-3)+"개":""):"먹고 싶은 메뉴를 입력해주세요"}</div>
        </div>
        <span style="color:#aaa">›</span>
      </button>
      ${S.bcMenus.length>0?`<button onclick="genBCCart()" style="width:100%;padding:16px 18px;border-radius:16px;border:2px solid ${S.cart.length>0?"#2ECC71":"var(--accent)"};background:${S.cart.length>0?"#E8F5E9":"var(--accent)"};display:flex;align-items:center;gap:14px;text-align:left;box-shadow:var(--shadow)">
        <span style="font-size:24px">${S.cart.length>0?"✅":"🔍"}</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px;color:${S.cart.length>0?"#2e7d32":"#fff"}">재료 분석 & 장보기 생성</div>
          <div style="font-size:12px;color:${S.cart.length>0?"var(--text-sub)":"rgba(255,255,255,0.8)"}">${S.cart.length>0?`${S.cart.length}개 재료 분석됨`:"탭해서 재료 분석"}</div>
        </div>
        <span style="color:${S.cart.length>0?"#2ECC71":"rgba(255,255,255,0.7)"}">›</span>
      </button>`:""}
      ${S.cart.length>0?`<button onclick="S.mealPlan?null:go('bc-cart')" style="width:100%;padding:16px 18px;border-radius:16px;border:2px solid #2ECC71;background:#E8F5E9;display:flex;align-items:center;gap:14px;text-align:left;box-shadow:var(--shadow)">
        <span style="font-size:22px">🛒</span>
        <div style="flex:1"><div style="font-weight:700;font-size:14px">장보기 목록 확인</div></div>
        <span style="color:#aaa">›</span>
      </button>`:""}
      ${S.mealPlan?`<button onclick="go('bc-meal')" style="width:100%;padding:14px 18px;border-radius:16px;border:2px solid #2ECC71;background:#E8F5E9;display:flex;align-items:center;gap:14px;text-align:left">
        <span style="font-size:22px">📅</span>
        <div style="flex:1"><div style="font-weight:700;font-size:14px;color:#2e7d32">식단 보기</div></div>
        <span style="color:#2ECC71">›</span>
      </button>`:""}
    </div>
  </div>`;
}

// 플로우 단계 표시
function rFlowSteps(steps, current){
  const n=steps.length;
  return`<div style="background:var(--card);border-radius:16px;padding:20px 20px 14px;margin-bottom:16px;box-shadow:var(--shadow)">
    <div style="position:relative;display:flex;justify-content:space-between;align-items:flex-start">
      <!-- 연결선 (원들 중심을 잇는 선) -->
      <div style="position:absolute;top:15px;left:calc(100%/${n*2});right:calc(100%/${n*2});height:2px;display:flex;z-index:0">
        ${steps.slice(0,-1).map((_,i)=>`<div style="flex:1;height:2px;background:${i<current?"var(--primary)":"#e8e8e8"}"></div>`).join("")}
      </div>
      <!-- 원+텍스트 -->
      ${steps.map((s,i)=>`<div style="display:flex;flex-direction:column;align-items:center;width:${Math.floor(100/n)}%;z-index:1">
        <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;
          background:${i<current?"var(--primary)":i===current?"var(--primary)":"#f0f0f0"};
          color:${i<current?"#fff":i===current?"#fff":"#bbb"};
          box-shadow:${i<=current?"0 2px 8px rgba(0,0,0,0.2)":"none"}">
          ${i<current?"✓":i===current?"●":String(i+1)}
        </div>
        <div style="font-size:9px;font-weight:700;margin-top:6px;text-align:center;
          color:${i<current?"var(--primary)":i===current?"var(--primary)":"#ccc"}">${s}</div>
      </div>`).join("")}
    </div>
  </div>`;
}

// ── 식사 스케줄 ──
function rMealSlotIcon(meal,on){
  const color = meal==="아침" ? "#FF9F1C" : meal==="점심" ? "#4B3FD8" : "#425466";
  const bg = on ? color : "#C8CED8";
  if(meal==="아침"){
    return `<span style="width:30px;height:30px;border-radius:12px;background:${on?'#FFF4DE':'#F1F3F7'};display:inline-flex;align-items:center;justify-content:center;position:relative;flex-shrink:0">
      <span style="width:15px;height:15px;border-radius:50%;background:${bg};box-shadow:${on?'0 0 0 4px rgba(255,159,28,.16)':'none'}"></span>
    </span>`;
  }
  if(meal==="점심"){
    return `<span style="width:30px;height:30px;border-radius:12px;background:${on?'#F0EEFF':'#F1F3F7'};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">
      <span style="width:18px;height:18px;border:2px solid ${bg};border-radius:50%;position:relative;display:inline-block">
        <span style="position:absolute;left:7px;top:-6px;width:2px;height:5px;background:${bg};border-radius:2px"></span>
        <span style="position:absolute;left:7px;bottom:-6px;width:2px;height:5px;background:${bg};border-radius:2px"></span>
        <span style="position:absolute;left:-6px;top:7px;width:5px;height:2px;background:${bg};border-radius:2px"></span>
        <span style="position:absolute;right:-6px;top:7px;width:5px;height:2px;background:${bg};border-radius:2px"></span>
      </span>
    </span>`;
  }
  return `<span style="width:30px;height:30px;border-radius:12px;background:${on?'#EEF2FF':'#F1F3F7'};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">
    <span style="width:17px;height:17px;border-radius:50%;background:${bg};position:relative;display:inline-block">
      <span style="position:absolute;right:-4px;top:-2px;width:17px;height:17px;border-radius:50%;background:${on?'#EEF2FF':'#F1F3F7'}"></span>
    </span>
  </span>`;
}

// ── 식사 스케줄 ──
function rSchedule(){
  const mealMeta={
    "아침":{sub:"가볍게 시작",color:"#FF9F1C",bg:"#FFF7E8"},
    "점심":{sub:"든든한 한 끼",color:"var(--primary)",bg:"var(--primary-pale)"},
    "저녁":{sub:"하루 마무리",color:"#425466",bg:"#EEF2FF"},
  };
  return`<div style="padding:48px 20px 12px;background:linear-gradient(180deg,#fff,#F7F7FB);position:sticky;top:0;z-index:20">
    <button class="back" onclick="go('home')" style="margin-bottom:14px">←</button>
    <div class="title" style="margin-bottom:4px">식사 스케줄 설정</div>
    <div style="font-size:14px;color:var(--text-sub);line-height:1.45">요일별로 식단을 생성할 끼니를 선택해주세요.</div>
  </div>
  <div class="px" style="padding-bottom:120px">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0 14px">
      ${["아침","점심","저녁"].map(m=>{
        const cnt=DAYS.filter(d=>(S.schedule[d]||[]).includes(m)).length;
        return `<div style="background:#fff;border:1px solid var(--border);border-radius:16px;padding:12px;text-align:center;box-shadow:var(--shadow)">
          ${rMealSlotIcon(m,true)}
          <div style="font-size:12px;font-weight:800;margin-top:7px">${m}</div>
          <div style="font-size:11px;color:#8B95A1;margin-top:2px">${cnt}일 선택</div>
        </div>`;
      }).join("")}
    </div>
    ${DAYS.map(day=>`<div style="background:#fff;border:1px solid var(--border);border-radius:20px;padding:14px;margin-bottom:10px;box-shadow:var(--shadow)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div style="font-weight:900;font-size:16px">${day}요일</div>
        <div style="font-size:12px;color:var(--text-sub);font-weight:700">${(S.schedule[day]||[]).length}끼</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${["아침","점심","저녁"].map(m=>{
          const on=(S.schedule[day]||[]).includes(m);
          const meta=mealMeta[m];
          return `<button type="button" onclick="toggleSlot('${day}','${m}')" style="min-height:86px;padding:10px 6px;border-radius:17px;border:2px solid ${on?meta.color:'var(--border)'};background:${on?meta.bg:'#F7F8FA'};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font-family:inherit;transition:all .14s ease;box-shadow:${on?'0 5px 14px rgba(75,63,216,.12)':'none'};opacity:${on?1:.72}">
            ${rMealSlotIcon(m,on)}
            <span style="font-size:14px;font-weight:900;color:${on?meta.color:'#9AA3AF'}">${m}</span>
            <span style="font-size:10px;font-weight:700;color:${on?meta.color:'#B0B7C3'}">${on?'선택됨':meta.sub}</span>
          </button>`;
        }).join("")}
      </div>
    </div>`).join("")}
    <div style="background:#E8F5E9;border-radius:18px;padding:16px;margin-top:10px;text-align:center;border:1px solid #C8E6C9">
      <div style="font-size:13px;color:#2e7d32;font-weight:900">총 ${totalMeals()}끼 설정됨</div>
      <div style="font-size:11px;color:#66A06A;margin-top:4px">선택한 끼니 기준으로 식단이 생성돼요</div>
    </div>
  </div>
  <div class="bottom-bar"><button class="btn-p" onclick="saveSched();go('home')">설정 완료 →</button></div>`;
}
function toggleSlot(day,meal){
  if(!S.schedule[day])S.schedule[day]=[];
  const i=S.schedule[day].indexOf(meal);
  if(i>=0) S.schedule[day].splice(i,1);
  else S.schedule[day].push(meal);
  S.schedule[day].sort((a,b)=>["아침","점심","저녁"].indexOf(a)-["아침","점심","저녁"].indexOf(b));
  saveSched();
  render();
}

// ── A: 냉장고 화면 ──
function rAFridge(){
  const sorted=[...S.fridge].sort((a,b)=>getDday(a.addedAt,a.expireDays)-getDday(b.addedAt,b.expireDays));
  return`<div class="pad"><button class="back" onclick="go('home')">←</button><div class="title">❄️ 냉장고 확인</div></div>
  <div class="px" style="padding-top:8px;padding-bottom:130px">
    ${sorted.length===0?`<div style="text-align:center;color:#ccc;padding:32px">냉장고가 비어있어요</div>`:""}
    ${sorted.map((ing,i)=>{const d=getDday(ing.addedAt,ing.expireDays);return`<div class="${fiClass(d)}"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:22px">${ing.icon}</span><div><div style="font-weight:600;font-size:14px">${ing.name} ${storageBadge(ing.storage||getShelfLife(ing.name).storage)}</div><div style="font-size:12px;color:#aaa">${ing.qty}${ing.unit} · ${d<=0?"만료":d+"일"}</div></div></div><div style="display:flex;align-items:center;gap:6px">${ddayBadge(d)}<button onclick="editFI(${i})" style="background:none;border:none;color:#aaa;font-size:13px">✏️</button><button onclick="S.fridge.splice(${i},1);saveFridge();render()" style="background:none;border:none;color:#ddd;font-size:18px">×</button></div></div>`;}).join("")}
    <button onclick="openAddFI()" style="width:100%;padding:12px;background:#f8f8f8;border:1.5px dashed #ddd;border-radius:12px;color:#aaa;font-size:14px;margin-top:8px">+ 재료 직접 추가</button>
  </div>
  <div class="bottom-bar"><button class="btn-p" onclick="go('a-style')">🍽️ 이 재료로 식단 짜기</button></div>
`;
}
let _fiIdx=-1;
function openAddFI(){_fiIdx=-1;document.getElementById("fi-modal-title").textContent="재료 추가";document.getElementById("fi-name").value="";document.getElementById("fi-qty").value="";document.getElementById("fi-exp").value="14";document.getElementById("fi-modal").style.display="flex";}
function editFI(i){_fiIdx=i;const f=S.fridge[i];document.getElementById("fi-modal-title").textContent="재료 수정";document.getElementById("fi-name").value=f.name;document.getElementById("fi-qty").value=f.qty;document.getElementById("fi-unit").value=f.unit||"g";document.getElementById("fi-exp").value=f.expireDays||(getShelfLife(f.name||"").days)||7;document.getElementById("fi-modal").style.display="flex";}
function confirmFI(){const n=document.getElementById("fi-name").value.trim();const q=document.getElementById("fi-qty").value;const u=document.getElementById("fi-unit").value;const e=parseInt(document.getElementById("fi-exp").value)||14;if(!n)return;const item={name:n,qty:q||"적당량",unit:q?u:"",icon:getIcon(n),addedAt:new Date().toISOString().slice(0,10),expireDays:e};if(_fiIdx>=0)S.fridge[_fiIdx]=item;else S.fridge.push(item);saveFridge();document.getElementById("fi-modal").style.display="none";render();}

// ── A: 스타일 선택 ──
function rAStyle(){
  var sel=S.bcStyles||[];

  // 선택된 태그 뱃지 - B플로우와 동일 방식
  var styles=[{id:'한식',e:'🍚'},{id:'일식',e:'🍱'},{id:'중식',e:'🥢'},{id:'헬시',e:'🥗'},
    {id:'🇹🇭 태국',e:'🇹🇭'},{id:'🇻🇳 베트남',e:'🇻🇳'},{id:'🇮🇩 인도네시아',e:'🇮🇩'},{id:'🇲🇾 말레이시아',e:'🇲🇾'},
    {id:'🇸🇬 싱가포르',e:'🇸🇬'},{id:'🇵🇭 필리핀',e:'🇵🇭'},{id:'🇮🇳 인도',e:'🇮🇳'},{id:'🌙 중동',e:'🌙'},
    {id:'🇹🇷 터키',e:'🇹🇷'},{id:'🇬🇷 그리스',e:'🇬🇷'},{id:'🇪🇸 스페인',e:'🇪🇸'},{id:'🇫🇷 프랑스',e:'🇫🇷'},
    {id:'🇮🇹 이탈리아',e:'🇮🇹'},{id:'🇩🇪 독일',e:'🇩🇪'},{id:'🇵🇹 포르투갈',e:'🇵🇹'},{id:'🇲🇽 멕시코',e:'🇲🇽'},
    {id:'🇺🇸 미국',e:'🇺🇸'},{id:'🇧🇷 브라질',e:'🇧🇷'}
  ];

  var tagsHtml='';
  if(sel.length===0){
    tagsHtml='<span style="color:#aaa;font-size:14px">선택된 스타일 없음</span>';
  } else {
    tagsHtml=sel.map(function(s,i){
      var st=styles.find(function(x){return x.id===s;})||{e:''};
      var emoji=st.e||'';
      var name=s.includes(' ')?s.replace(/^\S+\s+/,'').trim():s;
      var flagUrl=emoji?'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/'+[...emoji].map(function(c){return c.codePointAt(0).toString(16);}).join('-')+'.svg':'';
      return '<span onclick="toggleStyle(\'' +s+ '\')" style="display:inline-flex;align-items:center;gap:4px;background:var(--primary);color:#fff;border-radius:20px;padding:5px 10px;font-size:13px;font-weight:700">'
        +(flagUrl?'<img src="'+flagUrl+'" width="16" height="16" style="vertical-align:middle" onerror="this.style.display=\'none\'">':'')
        +'<span>'+name+'</span>'
        +'<span style="margin-left:2px">✕</span>'
        +'</span>';
    }).join('');
  }

  // 버튼 라벨
  var btnLabel='스타일을 선택해주세요';
  if(sel.length>0){
    btnLabel=sel.map(function(s){return s.includes(' ')?s.replace(/^\S+\s+/,'').trim():s;}).join(' + ')+' 식단 짜기';
  }

  var clearBtn=sel.length>0?'<button onclick="S.bcStyles=[];render()" style="background:none;border:none;color:#999;font-size:13px;padding:4px 0;margin-bottom:8px;cursor:pointer">전체 해제</button>':'';

  return '<div class="pad">'
    +'<button class="back" onclick="go(\'a-fridge\')">←</button>'
    +'<div class="title">🍽️ 어떤 스타일로?</div>'
    +'<div class="sub" style="margin-bottom:12px">여러 개 선택 가능해요</div>'
    +'</div>'
    +'<div class="px" style="padding-bottom:140px">'
    +'<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;min-height:36px">'+tagsHtml+'</div>'
    +'<div style="margin-bottom:8px">'
    +'<label style="font-size:13px;color:#888;font-weight:600;margin-bottom:6px;display:block">국가/스타일 선택</label>'
    +'<button onclick="openStyleDrop()" style="width:100%;padding:14px 16px;border-radius:14px;border:2px solid var(--border);background:#fff;text-align:left;font-size:14px;color:var(--text-sub);cursor:pointer;display:flex;justify-content:space-between;align-items:center"><span>스타일 추가하기</span><span>＋</span></button>'
    +'</div>'
    +clearBtn
    +'</div>'
    +'<div class="bottom-bar">'
    +'<button class="btn-p" '+(sel.length===0?'disabled':'')+' onclick="genAMeal()">✨ '+btnLabel+'</button>'
    +'</div>';
}
function handleStyleDropdown(sel){
  var val=sel.value;
  if(!val)return;
  if(S.bcStyles.indexOf(val)<0) S.bcStyles.push(val);
  sel.value='';
  render();
}
function toggleStyle(s){
  var i=S.bcStyles.indexOf(s);
  if(i>=0) S.bcStyles.splice(i,1);
  else S.bcStyles.push(s);
  render();
}

// ── A: 식단 생성 ──
function genAMeal(){
  if(typeof flowBuildMenu==='function'){
    if(!S.bcStyles.length){alert('스타일을 먼저 선택해주세요');return;}
    if(!S.fridge.length){showInsufficientModal(0);return;}
    const menus=flowBuildMenu('fridge',S.bcStyles,[]);
    const best=menus.filter(n=>flowScoreMenuByFridge(n)>0);
    const selected=(best.length?best:menus).slice(0,totalMeals());
    flowCreatePlan(selected,`❄️ 냉장고 재료 우선으로 ${selected.length}개 메뉴를 배치했어요.`);
    flowBuildCart(selected);
    go('a-meal');
    return;
  }
}

// 재료 부족 안내 모달
function closePopup(){const e=document.getElementById("insuf-popup");if(e)e.remove();}

function showInsufficientModal(count){
  const el=document.createElement("div");
  el.id="insuf-popup";
  el.style.cssText="position:fixed;inset:0;background:rgba(26,26,46,0.7);z-index:999;display:flex;align-items:flex-end;justify-content:center";
  el.innerHTML=`<div style="background:#fff;border-radius:24px 24px 0 0;padding:28px 20px 44px;width:100%;max-width:480px">
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:48px">❄️</div>
      <div style="font-weight:800;font-size:18px;margin-top:8px">냉장고 재료가 부족해요</div>
      <div style="font-size:13px;color:#888;margin-top:6px">현재 <strong>${count}가지</strong> 재료가 있어요<br>식단을 짜려면 최소 <strong>5가지 이상</strong> 필요해요</div>
    </div>
    <div style="background:#f8f8f8;border-radius:14px;padding:14px;margin-bottom:16px;font-size:13px;color:#666;line-height:1.8">
      💡 <strong>이렇게 해보세요</strong><br>
      • ❄️ 냉장고에 재료를 더 추가하기<br>
      • 🤔 B플로우: 스타일 선택 후 메뉴 추천받기<br>
      • 🍖 C플로우: 먹고 싶은 메뉴 직접 입력하기
    </div>
    <div style="display:flex;gap:8px">
      <button onclick="closePopup();go('a-fridge')" style="flex:1;padding:14px;background:var(--primary);color:#fff;border:none;border-radius:14px;font-weight:700;font-size:14px">재료 추가하기</button>
      <button onclick="closePopup();resetFlow()" style="flex:1;padding:14px;background:#f0f0f0;color:#666;border:none;border-radius:14px;font-weight:700;font-size:14px">다른 방법으로</button>
    </div>
  </div>`;
  document.body.appendChild(el);
}

// 만들 수 있는 메뉴 부족 안내 모달
function showInsufficientMenuModal(count, fridgeNames){
  const el=document.createElement("div");
  el.id="insuf-popup";
  el.style.cssText="position:fixed;inset:0;background:rgba(26,26,46,0.7);z-index:999;display:flex;align-items:flex-end;justify-content:center";
  el.innerHTML=`<div style="background:#fff;border-radius:24px 24px 0 0;padding:28px 20px 44px;width:100%;max-width:480px">
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:48px">🤔</div>
      <div style="font-weight:800;font-size:18px;margin-top:8px">재료로 만들 수 있는 메뉴가 부족해요</div>
      <div style="font-size:13px;color:#888;margin-top:6px">현재 재료로 만들 수 있는 메뉴가 <strong>${count}개</strong>뿐이에요<br>재료를 더 추가하거나 스타일을 바꿔보세요</div>
    </div>
    <div style="background:#FFF8EE;border-radius:14px;padding:14px;margin-bottom:16px;font-size:13px;color:#666;line-height:1.8">
      🛒 <strong>장을 봐서 채워볼까요?</strong><br>
      B/C 플로우로 가면 필요한 재료를 한번에 장볼 수 있어요
    </div>
    <div style="display:flex;gap:8px">
      <button onclick="closePopup();go('a-style')" style="flex:1;padding:14px;background:var(--primary);color:#fff;border:none;border-radius:14px;font-weight:700;font-size:14px">스타일 다시 선택</button>
      <button onclick="closePopup();resetFlow()" style="flex:1;padding:14px;background:#f0f0f0;color:#666;border:none;border-radius:14px;font-weight:700;font-size:14px">다른 방법으로</button>
    </div>
  </div>`;
  document.body.appendChild(el);
}

function bcStyleDisplayName(style){
  const raw=String(style||'').trim();
  if(!raw) return '';
  return raw.includes(' ') ? raw.replace(/^\S+\s+/,'').trim() : raw;
}

// ── BC: 진입 ──
function startBC(mode){S.bcMode=mode;S.bcMenus=[];S.bcStyles=[];S.bcSuggested=[];go("bc-entry");}
function rBCEntry(){
  if(typeof normalizeBCStylesV8==="function") normalizeBCStylesV8();
  const isB=S.bcMode==="b";
  const max=totalMeals();
  const POPULAR=["삼겹살구이","된장찌개","김치찌개","비빔밥","제육볶음","불고기","카레라이스","짜장면","파스타","스테이크","라멘","볶음밥","닭볶음탕","갈비찜","오야코동"];
  const styles=[{id:"한식",e:"🍚"},{id:"일식",e:"🍱"},{id:"중식",e:"🥢"},{id:"🇹🇭 태국",e:"🇹🇭"},{id:"🇻🇳 베트남",e:"🇻🇳"},{id:"🇮🇩 인도네시아",e:"🇮🇩"},{id:"🇲🇾 말레이시아",e:"🇲🇾"},{id:"🇸🇬 싱가포르",e:"🇸🇬"},{id:"🇵🇭 필리핀",e:"🇵🇭"},{id:"🇮🇳 인도",e:"🇮🇳"},{id:"🇲🇽 멕시코",e:"🇲🇽"},{id:"🇹🇷 터키",e:"🇹🇷"}];
  return`<div style="padding:0 20px 12px;background:linear-gradient(160deg,${isB?"#FFF8EE":"#FCE4EC"},#fff);position:fixed;top:0;left:0;right:0;max-width:480px;margin:0 auto;z-index:100;box-shadow:0 2px 12px rgba(0,0,0,0.06))">
    <button class="back" onclick="go('home')">←</button>
    <div class="title">${isB?"🤔 뭐 드실 건가요?":"🍖 먹고 싶은 메뉴"}</div>
    <div class="sub">${isB?"스타일을 고르면 메뉴를 추천해드려요":`최대 ${max}개 선택`}</div>
  </div>
  <div class="px" style="padding-top:8px;padding-bottom:130px">
    <div class="card" style="margin-bottom:14px"><div class="sec">👥 인원수</div><div style="display:flex;gap:8px;margin-top:8px">${[1,2,3,4].map(n=>`<button onclick="S.people=${n};render()" style="flex:1;padding:11px;border-radius:10px;border:2px solid ${S.people===n?"var(--primary)":"var(--border)"};background:${S.people===n?"var(--primary-pale)":"#fff"};font-weight:700;font-size:15px;color:${S.people===n?"var(--primary)":"var(--text)"}">${n}인</button>`).join("")}</div></div>
    ${isB?`
    <div class="sec" style="margin-bottom:10px">음식 스타일 선택</div>
    ${S.bcStyles.length>0?`<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
      ${S.bcStyles.map((s,i)=>{
        const name=bcStyleDisplayName(s);
        return`<span style="background:var(--primary);color:#fff;border-radius:20px;padding:5px 12px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:5px">
          <span>${name}</span>
          <button type="button" onclick="event.preventDefault();event.stopPropagation();S.bcStyles.splice(${i},1);render();return false;" style="background:rgba(255,255,255,0.25);border:none;color:#fff;font-size:11px;cursor:pointer;padding:2px 5px;border-radius:8px;line-height:1;font-weight:900;pointer-events:auto">✕</button>
        </span>`;}).join("")}
    </div>`:""}
    <button onclick="openStyleDrop()" style="width:100%;padding:14px 16px;border-radius:14px;border:2px dashed var(--primary);background:#FFF8EE;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:700;color:var(--primary)">
      ＋ 스타일 추가하기
    </button>`:`
    <div class="sec">메뉴 입력 (${S.bcMenus.length}/${max})</div>
    <div style="position:relative">
    <div style="display:flex;gap:8px;margin-bottom:4px">
      <input id="c-inp" class="inp" placeholder="예: 삼겹살, 된장찌개..." style="flex:1" onkeydown="if(event.key==='Enter'){addCMenu();}" oninput="showAutoComplete(this.value)" autocomplete="off">
      <button onclick="addCMenu()" style="background:var(--accent);color:#fff;border:none;border-radius:12px;padding:11px 16px;font-weight:700">추가</button>
    </div>
    <div id="ac-drop" style="display:none;position:absolute;top:100%;left:0;right:44px;background:#fff;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.12);z-index:100;overflow:hidden;max-height:240px;overflow-y:auto"></div>
  </div>
    ${S.bcMenus.length>0?`<div style="display:flex;flex-wrap:wrap;margin-bottom:12px">${S.bcMenus.map((m,i)=>`<span style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:20px;font-size:13px;border:1.5px solid #f48fb1;background:#fce4ec;color:var(--accent);font-weight:700;margin:3px">${m}<button onclick="S.bcMenus.splice(${i},1);render()" style="background:none;border:none;color:#f48fb1;font-size:15px;padding:0">×</button></span>`).join("")}</div>`:""}
    <div class="sec">인기 메뉴</div>
    <div style="display:flex;flex-wrap:wrap">${POPULAR.map(m=>{const sel=S.bcMenus.includes(m);return`<button onclick="toggleCMenu('${m}')" style="display:inline-flex;align-items:center;padding:6px 12px;border-radius:20px;font-size:13px;border:1.5px solid ${sel?"#f48fb1":"var(--border)"};background:${sel?"#fce4ec":"#fff"};color:${sel?"var(--accent)":"var(--text-sub)"};font-weight:${sel?700:400};margin:3px">${sel?"✓ ":""}${m}</button>`;}).join("")}</div>`}
  </div>
  <div class="bottom-bar">
    ${isB?`<button class="btn-o" ${S.bcStyles.length===0?"disabled":""} onclick="genBSuggest()">🍽️ ${S.bcStyles.length>0?S.bcStyles.map(s=>bcStyleDisplayName(s)).join(" + ")+' 메뉴 추천':'스타일을 선택해주세요'}</button>`:`
    <div style="display:flex;flex-direction:column;gap:8px">
      ${S.bcMenus.length>0&&S.bcMenus.length<max?`<div style="text-align:center;font-size:12px;color:#aaa">나머지 ${max-S.bcMenus.length}개는 AI가 자동으로 채워드려요</div>`:""}
      <button class="btn-p" ${S.bcMenus.length===0?"disabled":""} onclick="genBCCart()">🛒 재료 분석하기</button>
    </div>`}
  </div>`;
}

function showAutoComplete(val){
  const drop=document.getElementById("ac-drop");
  if(!drop)return;
  const q=val.trim();
  if(q.length<1){drop.style.display="none";return;}

  // DB에서 부분일치 검색 - 입력값이 포함된 메뉴 찾기
  const keys=Object.keys(MENU_DB);
  const allMatches=keys.filter(k=>k.includes(q));
  // 정확히 시작하는 것 먼저, 그 다음 포함하는 것
  const results=[
    ...allMatches.filter(k=>k.startsWith(q)),
    ...allMatches.filter(k=>!k.startsWith(q))
  ].slice(0,20);

  // 없으면 초성/키워드로 넓게 검색
  const extra = results.length < 4
    ? keys.filter(k=>!results.includes(k) && (
        k.replace(/찌개|볶음|구이|조림|나물|무침|전골|탕|국/g,"").includes(q) ||
        q.replace(/찌개|볶음|구이|조림|나물|무침|전골|탕|국/g,"").length>0 && k.includes(q.replace(/찌개|볶음|구이|조림|나물|무침|전골|탕|국/g,""))
      )).slice(0, 8-results.length)
    : [];

  const all=[...results,...extra];
  if(!all.length){drop.style.display="none";return;}

  drop.innerHTML=all.map(name=>{
    const db=MENU_DB[name];
    const cat=db?.ingredients.find(i=>i.category==="단백질")?.name||"";
    const highlighted=name.replace(new RegExp(q,"g"),`<span style="color:var(--primary);font-weight:800">${q}</span>`);
    return`<div onclick="selectAC('${name}')" style="padding:12px 14px;border-bottom:1px solid var(--border);cursor:pointer;display:flex;align-items:center;gap:10px;active:background:#f5f5f5">
      <div style="flex:1">
        <div style="font-size:14px;font-weight:600">${highlighted}</div>
        ${cat?`<div style="font-size:11px;color:#aaa">주재료: ${cat}</div>`:""}
      </div>
      <span style="font-size:11px;color:var(--primary);font-weight:700">선택</span>
    </div>`;
  }).join("");
  drop.style.display="block";
}

function selectAC(name){
  const inp=document.getElementById("c-inp");
  if(inp)inp.value=name;
  const drop=document.getElementById("ac-drop");
  if(drop)drop.style.display="none";
  addCMenu();
}

// 외부 클릭시 드롭다운 닫기
document.addEventListener("click",function(e){
  const drop=document.getElementById("ac-drop");
  if(drop&&!drop.contains(e.target)&&e.target.id!=="c-inp") drop.style.display="none";
});

// ── MENU_DB 추가 항목 2 ──

function addCMenu(){const i=document.getElementById("c-inp");const v=i.value.trim();if(v&&!S.bcMenus.includes(v)&&S.bcMenus.length<totalMeals())S.bcMenus.push(v);i.value="";render();}
function toggleCMenu(m){const i=S.bcMenus.indexOf(m);if(i>=0)S.bcMenus.splice(i,1);else if(S.bcMenus.length<totalMeals())S.bcMenus.push(m);render();}

// ── B: AI 메뉴 추천 ──
function genBSuggest(){
  const max=totalMeals();
  const typeOrder=["아침","점심","저녁"];
  let pool=(S.bcStyles&&S.bcStyles.length?S.bcStyles:["한식"]).flatMap(s=>FLOW_STYLE_MENU_MAP[s]||[]);
  pool=[...new Set(pool)].filter(name=>MENU_DB[name]);
  if(!pool.length) pool=Object.keys(MENU_DB);
  const menus=pool.sort((a,b)=>{
    const sa=getSeasonalScore(a), sb=getSeasonalScore(b);
    if(sa!==sb) return sb-sa;
    return Math.random()-0.5;
  }).slice(0,Math.min(max+5,pool.length)).map((name,i)=>({
    name,
    selected:false,
    type:typeOrder[i%3],
    ingredients:(MENU_DB[name]?.ingredients||[]).slice(0,3).map(x=>x.name),
    sharedWith:[]
  }));
  S.bcSuggested=menus;
  go("b-suggest");
}

// ── 앱 시작 ──
document.addEventListener("click", function(e){
  const drop = document.getElementById("style-drop");
  if(drop && !drop.contains(e.target) && !e.target.closest('button[onclick*="style-drop"]')){
    drop.style.display = "none";
  }
  const acDrop = document.getElementById("ac-drop");
  if(acDrop && !acDrop.contains(e.target) && e.target.id !== "c-inp"){
    acDrop.style.display = "none";
  }
});

const FLOW_STYLE_MENU_MAP={"한식": ["된장찌개", "김치찌개", "참치김치찌개", "순두부찌개", "해물순두부찌개", "부대찌개", "청국장찌개", "감자탕", "동태찌개", "꽃게탕", "미역국", "소고기뭇국", "콩나물국", "북어국", "육개장", "갈비탕", "삼계탕", "제육볶음", "간장제육볶음", "소불고기", "돼지불고기", "닭갈비", "닭볶음탕", "찜닭", "갈비찜", "돼지갈비찜", "보쌈", "수육", "오징어볶음", "낙지볶음", "주꾸미볶음", "고등어구이", "고등어조림", "갈치조림", "삼치구이", "비빔밥", "김치볶음밥", "새우볶음밥", "오므라이스", "카레라이스", "콩나물밥", "김밥", "떡국", "떡볶이", "라볶이", "잡채", "잔치국수", "비빔국수", "칼국수", "수제비", "냉면", "김치전", "해물파전", "감자전", "계란말이", "계란찜", "두부조림", "장조림", "멸치볶음", "어묵볶음", "시금치나물", "콩나물무침", "오이무침", "무생채", "깍두기", "오이소박이", "닭가슴살샐러드", "현미채소덮밥", "닭가슴살카레", "등갈비찜", "황태국", "콩나물해장국", "닭개장", "설렁탕", "돌솥비빔밥", "쌈밥", "유부초밥", "닭곰탕", "소고기미역국", "두루치기", "고추장불고기", "묵은지삼겹살", "우거지갈비찜", "약밥", "북어무침", "들깨순두부찌개", "오리주물럭", "두부채소볶음", "닭가슴살채소볶음", "아욱국", "갈치구이", "간고등어구이", "코다리조림", "동태전", "감자볶음", "도라지무침", "취나물무침", "가지볶음", "느타리버섯볶음", "고사리나물", "전복죽", "닭죽", "건새우미역무침", "잡곡밥", "영양솥밥", "된장삼겹살", "간장새우장", "버섯솥밥", "두부미역국", "계란국", "배추된장국", "마늘종볶음", "참나물무침", "삼치조림", "골뱅이무침", "닭한마리", "추어탕", "들깨미역국", "대패삼겹살구이", "두부부침", "황태구이", "간장게장", "전복미역국", "된장비빔밥", "홍합탕", "바지락탕", "꼬리곰탕", "우거지해장국", "냉이된장국", "쑥된장국", "무조림", "연근조림", "우엉조림", "더덕구이", "꽁치조림", "꽁치김치찌개", "소고기죽", "소고기덮밥", "계란덮밥", "낙지덮밥", "참치마요덮밥", "오삼불고기", "두부김치", "돼지고기깻잎볶음", "소고기볶음", "호박전", "버섯전", "육전", "빈대떡", "무나물", "호박나물", "숙주나물", "미역줄기볶음", "깻잎무침", "삼겹살구이", "목살구이", "막국수", "콩나물국밥", "도토리묵무침", "감자수제비", "해물잡채", "아귀찜", "팥죽", "순대국밥", "현미채소볶음밥", "닭가슴살채소볶음밥", "장어구이", "돼지국밥", "쟁반국수", "어묵국", "떡갈비", "곱창볶음", "순대볶음", "열무비빔밥", "오이냉국", "미역냉국", "물김치", "총각김치", "불고기전골", "해물전골", "들깨칼국수", "비지찌개", "산채비빔밥", "육회비빔밥", "떡만두국", "파김치", "황기닭백숙", "소갈비구이", "팽이버섯전골", "냉이무침", "열무국수", "채소달걀국", "닭가슴살채소볶음", "두부버섯솥밥", "들기름막국수", "평양냉면", "비빔냉면", "물냉면", "함흥냉면", "콩나물냉국수", "닭비빔막국수", "간장닭날개튀김", "참치회비빔밥", "간장비빔소면"], "헬시": ["된장찌개", "순두부찌개", "청국장찌개", "미역국", "삼계탕", "고등어구이", "비빔밥", "잡채", "물냉면", "두부조림", "카오팟", "쌀국수", "반미", "고이꾸온", "클램차우더", "렌틸수프", "그릭샐러드", "닭가슴살샐러드", "연어포케", "두부포케", "그릭요거트볼", "오트밀", "현미채소덮밥", "두부스테이크", "렌틸콩샐러드", "계란아보카도토스트", "닭가슴살카레", "연어아보카도볼", "퀴노아채소볼", "두부채소볶음", "닭가슴살채소볶음", "갈치구이", "라이타", "버섯솥밥", "두부미역국", "병아리콩샐러드", "참치채소샐러드", "가스파초", "두부스크램블에그", "채소커리", "메밀소바샐러드", "아보카도연어토스트", "타불레", "콩나물국밥", "두부스테이크테리야키", "현미채소볶음밥", "닭가슴살채소볶음밥", "연어스테이크", "단호박수프", "닭가슴살요거트볼", "비트샐러드", "채소달걀국", "하리라", "달마카니", "탄두리연어", "연어아보카도포케", "닭가슴살채소볶음", "두부버섯솥밥", "클래식 세비체", "들기름막국수", "평양냉면", "물냉면", "참치회비빔밥"], "일식": ["규동", "오야코동", "가츠동", "텐동", "카레우동", "유부우동", "야키소바", "쇼유라멘", "미소라멘", "돈코츠라멘", "돈카츠", "치킨카츠", "가라아게", "데리야키치킨", "연어데리야키", "사바미소니", "오코노미야키", "타코야키", "니쿠자가", "스키야키", "샤브샤브", "미소국", "차완무시", "이나리초밥", "연어초밥", "참치마요오니기리", "명란오니기리", "일본식계란말이", "히야시츄카", "자루소바", "나베야키우동", "일본식 카레라이스", "교자", "사케동", "치라시즈시", "아게다시두부", "오덴", "유도후", "야키토리", "수프카레", "에비마요", "쯔케멘", "히레카츠", "멘치카츠", "코로케", "마제소바", "돈지루", "에비후라이", "야키우동", "치킨난반", "이시카리나베", "카키아게", "사케미소즈케", "부타킴치", "메밀소바샐러드", "타마고산도", "규나베", "에비텐동", "가이센동", "미소버터라멘", "부타네기야키", "아지후라이", "두부스테이크테리야키", "카니돈부리", "야키오니기리", "모야시라멘", "오야코우동", "다코라이스", "부타네기폰즈", "스키야키", "부타카쿠니", "오징어먹물 파스타"], "중식": ["마파두부", "짜장면", "짬뽕", "계란볶음밥", "새우볶음밥", "탕수육", "깐풍기", "유린기", "깐쇼새우", "칠리새우", "고추잡채", "꽃빵고추잡채", "양장피", "팔보채", "마라탕", "마라샹궈", "동파육", "훠궈", "군만두", "물만두", "완탕면", "탄탄면", "꿔바로우", "토마토계란볶음", "청경채굴소스볶음", "가지볶음", "해물누룽지탕", "어향가지", "샤오롱바오", "회과육", "우육면", "오향장육", "라조기", "새우완탕면", "베이징덕", "차슈", "홍샤오러우", "어향육사", "마늘새우볶음", "소고기브로콜리볶음", "닭고기캐슈넛볶음", "중식오이냉채", "마파가지", "차오멘", "바오즈", "쿵파오치킨", "슈마이", "게살볶음밥", "해파리냉채", "부추계란볶음", "피단두부무침", "마라라면", "광동식볶음밥", "파기름파스타", "중식만두전골", "총유병", "완탕탕", "광동볶음면", "야채춘권", "팽이버섯볶음", "닭육수면", "광동식탕수육"], "🇹🇭 태국": ["팟타이", "팟씨유", "팟카파오 무쌉", "카오팟", "카오만가이", "똠얌꿍", "그린커리", "레드커리", "쏨땀", "카오소이", "마사만커리", "똠카가이", "얌운센", "팟팍붕파이댕", "카오니아오", "꾸어이티어우", "팟프리킹", "얌마무앙", "카오팟크라파오", "카이지아우무쌉", "뿌팟퐁가리", "파낭커리", "얌느아", "카오니아우마무앙", "얌탈레", "칸톰카이", "팟팟카나", "카오무댕", "라르브무", "팟나", "카오닌무삥", "마싸만 커리"], "🇻🇳 베트남": ["쌀국수", "반미", "분짜", "고이꾸온", "짜조", "반쎄오", "분보후에", "껌승", "퍼가", "분팃느엉", "껌가", "넴느엉꾸온", "카인까우아", "반꾸온", "미꽝", "보룩락", "껌찌엔", "껌땀", "미싸오", "차까", "넴루이", "보비아", "커리치킨반미", "고이가", "쌀국수볶음", "반팃느엉", "생선국수", "보코", "퍼싸오", "껌스엉", "반보팻짠"], "🇮🇩 인도네시아": ["나시고랭", "미고랭", "비프 렌당", "사테아얌", "가도가도", "소토아얌", "바쿠소", "나시우둑", "아얌바카르", "오포르아얌", "삼발텀페", "나시짬빌", "이칸고랭", "삼발우당", "캅카이", "시오미", "아얌페냑", "템페고랭", "롱통", "아얌세리", "페센베크", "사유르아삼", "굴라이 이칸", "레막캄빙", "아삼이칸", "비프 렌당"], "🇲🇾 말레이시아": ["락사", "나시르막", "차퀘이테오", "치킨커리말레이", "아삼락사", "로티차나이", "이칸바카르", "미고랭말레이", "오탁오탁", "마삭메라", "논야커리", "이칸마살라", "삼발켄팅", "케랍아얌", "이칸아삼", "아얌고랭베렘팍", "달채소카레", "아삼프라이드치킨", "나시머냑", "이칸페프리", "나시고랭", "로미에", "아얌마삭르막"], "🇸🇬 싱가포르": ["하이난 치킨라이스", "칠리크랩", "바쿠테", "싱가포르락사", "호켄미", "싱가포르사테", "프론미", "카야토스트", "캐롯케이크", "블랙페퍼크랩", "미폭국수", "나시빠당", "오타오타싱가포르", "스팀보트", "싱가포르죽", "피시헤드커리", "비가탄면", "찐호키엔미", "체가이볶음면", "완탕미싱가포르", "무이판", "오타오타", "하이난 치킨라이스"], "🇵🇭 필리핀": ["치킨아도보", "포크아도보", "시니강", "판싯", "레촌카왈리", "칼데레타", "판싯칸톤", "씨씩", "불라로", "암팔라야볶음", "피나클렛", "에스카베체", "비나고나안", "킬라윈", "카레카레", "니라가", "토실로그", "이나살", "크리스피파타", "판싯바하이", "기나탕마노크", "아도봉캉콩", "피시볼국"], "🇲🇽 멕시코": ["비프타코", "치킨타코", "치킨부리토", "퀘사디야", "칠리콘카르네", "나초", "과카몰레", "엔칠라다", "카르네아사다", "피시타코", "토르티야수프", "멕시칸라이스", "포졸레", "타말레", "토스타다", "칠레레예노", "치미창가", "소파데리마", "엠파나다", "멕시코콩스튜", "칠레아도보", "소파데피데오", "멕시코식타말", "치킨몰레", "세비체", "카마로네스알라디아블라", "카르네 아사다 타코"], "🇮🇳 인도": ["치킨티카마살라", "버터치킨", "팔락파니르", "달커리", "알루고비", "비리야니", "차나마살라", "탄두리치킨", "치킨코르마", "빈달루", "파니르티카", "아루나달", "도사", "사모사", "새우마살라", "로건조시", "말라이코프타", "라이타", "사히파니르", "알루파라타", "케이마마터", "마카니달", "고아피시커리", "팬니르도피아자", "암리차리컬차", "케랄라새우커리", "치킨발티", "팔라크아루", "치킨두피아자", "달타르카", "달마카니", "램 코르마", "탄두리연어"], "🇹🇷 터키": ["케밥", "치킨케밥", "메네멘", "렌틸수프", "고등어케밥", "아다나케밥", "이스켄데르케밥", "쾨프테", "이맘바이으르디", "터키식필라프", "만트", "보렉", "쉬쉬타북", "훔무스", "카르니야르크", "귀벡", "자작크", "메르지메크수프", "카부르가", "타쉬쾨프테", "타부크수유", "이즈미르쾨프테"], "🇬🇷 그리스": ["그릭샐러드", "무사카", "수블라키", "기로스", "스파나코피타", "돌마데스", "파스티치오", "클레프티코", "차지키", "티로피타", "스티파도", "브리암", "스코르달리아", "아브고레모노", "스파나코리조", "파소울라다", "아고우렐라이오", "프라이드피타", "할루미구이", "아르니굽기", "호르타", "기로스 피타"], "🇪🇸 스페인": ["파에야", "가스파초", "또르티야에스파뇰라", "파타타스브라바스", "알봉디가스", "감바스알아히요", "살모레호", "코시도", "피미엔토파드론", "하몬크로케타", "풀포갈레가", "파파아루가다", "소파카스텔야나", "아호블랑코", "사르수엘라", "초리소와인조림", "시피오네스앙코아"], "🇫🇷 프랑스": ["부야베스", "크로크무슈", "코코뱅", "프렌치어니언수프", "라따뚜이", "니수아즈 샐러드", "카술레", "솔뮈니에르", "크레프", "버섯벨루테", "프로방살토마토", "크림소스연어", "니스스타일피자", "쿠르제트수프", "파르망티에", "뵈프엔다우브", "아만딘송어"], "🇮🇹 이탈리아": ["리볼리타", "아쿠아파차", "포카치아", "카포나타", "오소부코", "살팀보카", "시칠리아파스타", "아라비아타파스타", "버터세이지뇨키", "리가토니알라보드카", "폴포살라다"], "🌙 중동": ["팔라펠", "샤와르마", "타불레", "키베", "만사프", "마클루베", "머제타이스", "치킨샤와르마랩", "카프타그릴", "마크부스", "레바논타울룩", "코프타 케밥"], "🇵🇪 페루": ["로모살타도", "아히데갈리나", "차우파", "클래식 세비체"], "🇲🇦 모로코": ["치킨타진", "쿠스쿠스로얄", "하리라", "바스틸라", "케프타 타진"], "🇷🇺 러시아": ["솔얀카"], "🇵🇹 포르투갈": ["칼데이라다", "코지두 아 포르투게사"], "🇧🇷 브라질": ["무케카"], "🇺🇸 미국": ["슬로피 조", "잠발라야"], "🇹🇼 대만": ["멘보샤"],"브런치":["프렌치토스트", "오믈렛", "메네멘", "계란아보카도토스트", "에그베네딕트", "카야토스트", "크로크무슈", "두부스크램블에그", "아보카도연어토스트", "타마고산도", "베이컨에그스크램블", "데블드에그", "스코치 에그", "홍콩식 에그타르트", "홍콩식 프렌치토스트", "보로 바오", "타마고동", "프렌치 오믈렛"]};

function flowFridgeNames(){return (S.fridge||[]).map(f=>String(f.name||'').trim()).filter(Boolean);}
function flowHasIng(ingName,fridgeNames=flowFridgeNames()){
  const n=String(ingName||'').trim();
  if(!n)return false;
  return fridgeNames.some(f=>f===n||f.includes(n)||n.includes(f));
}
function flowMenuDBName(name){return resolveMenu(name)||name;}
function flowMenuPool(styles){
  let pool=[];
  (styles&&styles.length?styles:["한식"]).forEach(s=>{pool=pool.concat(FLOW_STYLE_MENU_MAP[s]||[]);});
  if(!pool.length)pool=Object.keys(MENU_DB);
  return [...new Set(pool.map(flowMenuDBName).filter(n=>MENU_DB[n]))];
}
function flowScoreMenuByFridge(name){
  const db=MENU_DB[name]; if(!db)return -999;
  const fridgeNames=flowFridgeNames();
  const core=db.ingredients.filter(i=>["단백질","채소","면·밥"].includes(i.category||""));
  const have=db.ingredients.filter(i=>flowHasIng(refineIngredient(i.name,name),fridgeNames)).length;
  const coreHave=core.filter(i=>flowHasIng(refineIngredient(i.name,name),fridgeNames)).length;
  const expiryBoost=(S.fridge||[]).reduce((sum,f)=>{
    const d=getDday(f.addedAt,f.expireDays);
    const hit=db.ingredients.some(i=>flowHasIng(refineIngredient(i.name,name),[f.name]));
    return sum+(hit&&d<=3?3:0);
  },0);
  return have*3+coreHave*5+expiryBoost+getSeasonalScore(name)*2-Math.random();
}
function flowBuildMenu(type,styles,baseMenus){
  const max=totalMeals();
  let pool=[];
  if(type==='fridge') pool=flowMenuPool(styles).sort((a,b)=>flowScoreMenuByFridge(b)-flowScoreMenuByFridge(a));
  if(type==='style') pool=flowMenuPool(styles).sort(()=>Math.random()-0.5);
  if(type==='wishlist'){
    const resolved=[...new Set((baseMenus||[]).map(flowMenuDBName).filter(n=>MENU_DB[n]))];
    pool=[...resolved,...findSimilarMenus(resolved,resolved),...Object.keys(MENU_DB).sort(()=>Math.random()-0.5)];
  }
  pool=[...new Set(pool.filter(n=>MENU_DB[n]))];
  if(!pool.length)pool=Object.keys(MENU_DB).sort(()=>Math.random()-0.5);
  return pool.slice(0,Math.max(max,1));
}
function flowMealObj(type,name){
  const db=MENU_DB[name];
  return {type,name,mainIngredients:db?(db.ingredients||[]).slice(0,3).map(i=>refineIngredient(i.name,name)):[],cookTime:getCookTime(name),nutrition:{protein:"중간",carb:"중간",veggie:"있음"},sides:getSides(name,type)};
}
function flowCreatePlan(menus,tip){
  const weeklyMeal=[];let idx=0;
  for(const day of DAYS){
    const meals=(S.schedule[day]||[]).map(type=>flowMealObj(type,menus[idx++%menus.length]));
    weeklyMeal.push({day,meals});
  }
  S.mealPlan={weeklyMeal,tip};
  S.mealStartDate=getThisMonday();
  flowCreateCalendar(menus);
  saveMeal();
}
function flowCreateCalendar(menus){
  const cal={};let idx=0;
  const start=new Date(); start.setDate(start.getDate()+1);
  const days=totalDays();
  for(let i=0;i<days;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const key=dateKey(d); const day=DAYS[(d.getDay()+6)%7];
    cal[key]=(S.schedule[day]||[]).map(type=>flowMealObj(type,menus[idx++%menus.length]));
  }
  S.mealCalendar=cal;
  localStorage.setItem('wm_cal',JSON.stringify(S.mealCalendar));
}
function flowBuildCart(menus){
  const {list}=getIngredientsFromDB(menus,S.people);
  S.cart=list.map(i=>({...i,checked:!!i.inFridge,replaceName:"",replaceQty:""}));
  S.cartDone=false;S.fridgeAdded=false;
  localStorage.removeItem("wm_cart_done");
}
function saveMeal(){
  localStorage.setItem("wm_meal",JSON.stringify(S.mealPlan));
  localStorage.setItem("wm_meal_start",S.mealStartDate||"");
  localStorage.setItem("wm_cal",JSON.stringify(S.mealCalendar||{}));
}

function genAMeal(){
  if(!checkUsage())return;
  if(!S.bcStyles.length){alert('스타일을 먼저 선택해주세요');return;}
  if(!S.fridge.length){showInsufficientModal(0);return;}
  const menus=flowBuildMenu('fridge',S.bcStyles,[]);
  if(!menus.length){showInsufficientMenuModal(0,flowFridgeNames());return;}
  const best=menus.filter(n=>flowScoreMenuByFridge(n)>0);
  const selected=(best.length?best:menus).slice(0,totalMeals());
  flowCreatePlan(selected,`❄️ 냉장고 재료 우선으로 ${selected.length}개 메뉴를 배치했어요. 부족 재료는 장보기 탭에 자동 정리됩니다.`);
  flowBuildCart(selected);
  addUsage();
  go('a-meal');
}

function genBSuggest(){
  if(!S.bcStyles.length){alert('스타일을 선택해주세요');return;}
  const max=totalMeals();
  const pool=flowBuildMenu('style',S.bcStyles,[]).slice(0,Math.min(max+8,40));
  const typeOrder=["아침","점심","저녁"];
  S.bcSuggested=pool.map((name,i)=>({name,selected:i<Math.min(max,pool.length),type:typeOrder[i%3],ingredients:(MENU_DB[name]?.ingredients||[]).slice(0,3).map(x=>x.name),sharedWith:[]}));
  go('b-suggest');
}

function genBCCart(){
  try{
    const type=S.bcMode==='b'?'style':'wishlist';
    const seed=S.bcMode==='b'?(S.bcSuggested||[]).filter(m=>m.selected).map(m=>m.name):S.bcMenus;
    if(!seed.length){alert('메뉴를 먼저 선택해주세요');return;}
    const menus=flowBuildMenu(type,S.bcStyles,seed).slice(0,totalMeals());
    S.bcMenus=menus;
    flowBuildCart(menus);
    go('bc-cart');
  }catch(e){console.error(e);alert('재료 분석 중 오류: '+e.message);}
}

try{
  S.screen="splash";
  render();
}catch(e){
  console.error("WeeklyMeal start failed",e);
  document.getElementById("app").innerHTML='<div style="padding:28px;font-family:Pretendard,Arial,sans-serif"><h2>앱 시작 오류</h2><p>저장된 앱 데이터가 깨져 시작하지 못했습니다.</p><button onclick="localStorage.clear();location.reload()" style="padding:14px 18px;border:0;border-radius:12px;background:#4B3FD8;color:white;font-weight:800">저장데이터 초기화 후 재시작</button></div>';
}

// ── BC: 장보기 목록 생성 ──
const CATEGORY_MAP={"김치찌개": ["김치찌개", "참치김치찌개"], "된장찌개": ["된장찌개", "청국장찌개"], "순두부찌개": ["순두부찌개", "해물순두부찌개"], "제육볶음": ["제육볶음", "간장제육볶음"], "불고기": ["소불고기", "돼지불고기"], "갈비찜": ["갈비찜", "돼지갈비찜"], "파스타": ["알리오올리오", "봉골레파스타", "토마토파스타", "카르보나라", "볼로네제파스타"], "라멘": ["쇼유라멘", "미소라멘", "돈코츠라멘"], "우동": ["유부우동", "카레우동", "나베야키우동"], "볶음밥": ["김치볶음밥", "새우볶음밥", "계란볶음밥"], "샐러드": ["닭가슴살샐러드", "시저샐러드", "그릭샐러드"], "타코": ["비프타코", "치킨타코"], "카레": ["카레라이스", "카레라이스일식", "닭가슴살카레", "버터치킨", "치킨티카마살라"]};

function resolveMenu(menuName){
  if(MENU_DB[menuName]) return menuName;
  if(CATEGORY_MAP[menuName]){
    const subs=CATEGORY_MAP[menuName].filter(m=>MENU_DB[m]);
    if(subs.length) return subs[Math.floor(Math.random()*subs.length)];
  }
  const keys=Object.keys(MENU_DB);
  const partial=keys.filter(k=>k.includes(menuName)||menuName.includes(k));
  if(partial.length) return partial[Math.floor(Math.random()*partial.length)];
  return null;
}

function findSimilarMenus(menuNames, exclude=[]){
  const allIngs=new Set();
  for(const name of (Array.isArray(menuNames)?menuNames:[menuNames])){
    const db=MENU_DB[name];
    if(db) db.ingredients.forEach(i=>allIngs.add(i.name));
  }
  if(!allIngs.size) return[];
  const scores={};
  for(const[k,v]of Object.entries(MENU_DB)){
    if(exclude.includes(k)) continue;
    const overlap=v.ingredients.filter(i=>allIngs.has(i.name)).length;
    if(overlap>0) scores[k]=overlap;
  }
  return Object.entries(scores).sort((a,b)=>b[1]-a[1]).slice(0,30).map(x=>x[0]);
}

function genBCCart(){
  try{
    const max=totalMeals();
    const resolved=S.bcMenus.map(m=>resolveMenu(m)).filter(Boolean);
    const unique=[...new Set(resolved)];
    let pool=[...unique];
    if(pool.length>0&&pool.length<max){
      const similar=findSimilarMenus(pool,pool);
      pool=[...pool,...similar.slice(0,max-pool.length)];
    }
    if(pool.length<max){
      const extra=Object.keys(MENU_DB).filter(k=>!pool.includes(k)).sort(()=>Math.random()-0.5).slice(0,max-pool.length);
      pool=[...pool,...extra];
    }
    S.bcMenus=pool;
    const {list}=getIngredientsFromDB(S.bcMenus,S.people);
    S.cart=list.map(i=>({...i,checked:i.inFridge||false,replaceName:"",replaceQty:""}));
    S.fridgeAdded=false;
    go("bc-cart");
  }catch(e){
    console.error("genBCCart 오류:",e);
    alert("재료 분석 중 오류: "+e.message);
  }
}

function rBCCart(){
  const cats=["채소","단백질","양념","면·밥","기타"];
  const catIcon={채소:"🥬",단백질:"🥩",양념:"🧄","면·밥":"🍚",기타:"🛒"};
  const done=S.cart.filter(i=>i.checked).length;
  const fridgeCount=S.cart.filter(i=>i.inFridge).length;
  const needBuy=S.cart.length-fridgeCount;
  let cartHTML="";
  for(const cat of cats){
    const items=S.cart.filter(i=>(i.category||"기타")===cat);
    if(!items.length)continue;
    cartHTML+=`<div style="margin-bottom:14px"><div class="sec">${catIcon[cat]} ${cat}</div>`;
    for(const item of items){
      const idx=S.cart.indexOf(item);
      const hf=item.inFridge;
      const shopInfo=!hf?getIngredientShopUrl(item.replaceName||item.name):null;
      cartHTML+=`<div class="shop-item" style="background:${hf?"#F0FFF6":"#fff"};border:1.5px solid ${hf?"#A5D6A7":"transparent"}">
        <div class="chk ${item.checked?"done":""}" onclick="S.cart[${idx}].checked=!S.cart[${idx}].checked;render()">${item.checked?"✓":""}</div>
        <span style="font-size:20px">${item.icon||getIcon(item.name)}</span>
        <div style="flex:1" onclick="S.cart[${idx}].checked=!S.cart[${idx}].checked;render()">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="font-weight:600;font-size:14px;text-decoration:${item.checked?"line-through":"none"};color:${item.checked?"#bbb":"var(--text)"}">${item.replaceName||item.name}</span>
            ${hf?"<span style='font-size:10px;background:#2ECC71;color:#fff;border-radius:6px;padding:1px 6px;font-weight:700'>냉장고✓</span>":""}
          </div>
          <div style="font-size:11px;color:#aaa">${item.replaceQty||item.amount}${item.usedIn?" · "+item.usedIn:""}</div>
        </div>
        ${!hf&&!item.checked&&shopInfo?`<a href="${shopInfo.url}" target="_blank" onclick="event.stopPropagation()" style="display:flex;flex-direction:column;align-items:center;background:#E2173C;color:#fff;border-radius:10px;padding:6px 8px;text-decoration:none;flex-shrink:0;gap:1px">
          <span style="font-size:14px">🛒</span>
          <span style="font-size:9px;font-weight:700">쿠팡</span>
        </a>`:""}
        <button onclick="openEditCart(${idx})" style="background:none;border:none;color:#aaa;font-size:13px;flex-shrink:0">✏️</button>
      </div>`;
    }
    cartHTML+="</div>";
  }
  return`<div style="padding:80px 20px 14px;background:linear-gradient(160deg,#FCE4EC,#fff)">
    <button class="back" onclick="go(S.bcMode==='b'?'b-suggest':'bc-entry')">←</button>
    <div class="title">🛒 ${S.people}인분 장보기</div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <div style="flex:1;background:#E8F5E9;border-radius:10px;padding:8px;text-align:center">
        <div style="font-size:11px;font-weight:700;color:#2e7d32">냉장고✓</div>
        <div style="font-size:16px;font-weight:900;color:#2ECC71">${fridgeCount}개</div>
      </div>
      <div style="flex:1;background:#FFF8EE;border-radius:10px;padding:8px;text-align:center">
        <div style="font-size:11px;font-weight:700;color:#e65100">사야할것</div>
        <div style="font-size:16px;font-weight:900;color:var(--primary)">${needBuy}개</div>
      </div>
      <div style="flex:1;background:#f8f8f8;border-radius:10px;padding:8px;text-align:center">
        <div style="font-size:11px;font-weight:700;color:#888">완료</div>
        <div style="font-size:16px;font-weight:900;color:var(--primary)">${done}개</div>
      </div>
    </div>
    <div style="display:flex;gap:6px;margin-top:10px">
      <button onclick="S.cart.forEach((_,i)=>S.cart[i].checked=true);render()" style="flex:1;padding:8px;background:var(--primary-pale);border:none;border-radius:10px;font-size:12px;font-weight:700;color:var(--primary)">✓ 전체선택</button>
      <button onclick="S.cart.forEach((_,i)=>S.cart[i].checked=false);render()" style="flex:1;padding:8px;background:#f5f5f5;border:none;border-radius:10px;font-size:12px;font-weight:700;color:#888">✕ 전체해제</button>
      <button onclick="S.cart=S.cart.filter(i=>!i.checked||i.inFridge);render()" style="flex:1;padding:8px;background:#FFF0F0;border:none;border-radius:10px;font-size:12px;font-weight:700;color:#e53935">🗑 선택삭제</button>
    </div>
  </div>
  <div class="px" style="padding-top:8px;padding-bottom:130px">${cartHTML}</div>
  <div class="bottom-bar">
    ${S.cartDone
      ?`<div style="text-align:center">
          <div style="font-size:13px;color:var(--green);font-weight:700;margin-bottom:8px">✅ 냉장고에 담겼어요!</div>
          <button onclick="go('home')" class="btn-p">🏠 홈으로 돌아가기</button>
        </div>`
      :`<button class="btn-g" ${done===0?"disabled":""} onclick="addToFridge()">❄️ 구매완료 - 냉장고에 넣기 (${done}개)</button>`
    }
  </div>
  <div id="cart-modal" style="display:none" class="modal-bg"><div class="modal-card">
    <div style="font-weight:800;font-size:17px;margin-bottom:16px" id="cart-modal-name"></div>
    <div class="sec" style="margin-bottom:4px">대체 재료명</div>
    <input id="cart-rep-name" class="inp" style="width:100%;margin-bottom:10px" placeholder="그대로면 비워두세요">
    <div class="sec" style="margin-bottom:4px">수량 수정</div>
    <input id="cart-rep-qty" class="inp" style="width:100%;margin-bottom:16px" placeholder="예: 500g">
    <button class="btn-p" onclick="confirmEditCart()">수정 완료</button>
    <button onclick="document.getElementById('cart-modal').style.display='none'" style="width:100%;padding:12px;background:none;border:none;color:#aaa;font-size:14px;margin-top:6px">취소</button>
  </div></div>`;
}

let _cartEditIdx=-1;
function openEditCart(idx){
  _cartEditIdx=idx;
  const item=S.cart[idx];
  document.getElementById('cart-modal-name').textContent=item.name;
  document.getElementById('cart-rep-name').value=item.replaceName||"";
  document.getElementById('cart-rep-qty').value=item.replaceQty||"";
  document.getElementById('cart-modal').style.display='flex';
}
function confirmEditCart(){
  if(_cartEditIdx<0)return;
  S.cart[_cartEditIdx].replaceName=document.getElementById('cart-rep-name').value;
  S.cart[_cartEditIdx].replaceQty=document.getElementById('cart-rep-qty').value;
  document.getElementById('cart-modal').style.display='none';
  render();
}

function rMeal(backScreen,gradColor){
  const plan=S.mealPlan;if(!plan)return"";
  const day=plan.weeklyMeal?.[S.currentDay];
  if(!day)return"";
  const tIcon={"아침":"🌅","점심":"☀️","저녁":"🌙"};
  return`<div style="padding:80px 20px 14px;background:linear-gradient(160deg,${gradColor||"var(--primary-pale)"},#fff)">
    <button class="back" onclick="go('home')">←</button>
    <div class="title">🍽️ 이번 주 식단</div>
    ${plan.tip?`<div style="background:rgba(255,255,255,0.8);border-radius:10px;padding:10px 13px;font-size:12px;color:#555;margin-top:10px">💡 ${plan.tip}</div>`:""}
  </div>
  <div class="day-tabs">
    ${(plan.weeklyMeal||[]).map((w,i)=>{
      const meals=w.meals||[];
      return`<button class="day-tab ${S.currentDay===i?"active":""}" onclick="S.currentDay=${i};render()">
        <span style="font-size:12px;font-weight:800">${w.day}</span>
        <span style="font-size:10px;color:#aaa">${meals.length}끼</span>
      </button>`;
    }).join("")}
  </div>
  <div class="px" style="padding-bottom:100px">
    ${day.meals&&day.meals.length?day.meals.map((m,mi)=>{
      const nut=calcNutrition(m.name,1);
      const sides=m.sides||[];
      const dayIdx=S.currentDay;
      return`<div style="background:var(--card);border-radius:18px;padding:16px;margin-bottom:14px;box-shadow:var(--shadow)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div style="width:42px;height:42px;background:var(--primary-pale);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px">${tIcon[m.type]||"🍽️"}</div>
          <div style="flex:1">
            <div style="font-size:11px;color:#aaa">${m.type}</div>
            <div style="font-weight:800;font-size:16px">${m.name}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
          <span class="badge">⏱ ${m.cookTime||getCookTime(m.name)}분</span>
          ${nut?`<span class="badge" style="background:#FFF3E0;color:#E65100">🔥 ${nut.calRange||nut.cal+"kcal"}</span>`:""}
          ${nut?`<span class="badge" style="background:#E3F2FD;color:#1976D2">단백질 ${nut.pro}g</span>`:""}
        </div>
        ${sides.length?`<div style="font-size:11px;color:#888;margin-bottom:8px">🍱 추천 반찬: ${sides.map(s=>`<button onclick="showSideRecipe('${s}')" style="background:#f5f5f5;border:none;border-radius:12px;padding:3px 8px;font-size:11px;margin:2px;cursor:pointer">${s}</button>`).join("")}</div>`:""}
        <button onclick="setMeal(${dayIdx},${mi})" style="width:100%;padding:10px;background:var(--primary);color:#fff;border:none;border-radius:12px;font-weight:700;font-size:13px;cursor:pointer">레시피 보기 →</button>
      </div>`;
    }).join(""):`<div style="text-align:center;padding:40px 0;color:#aaa">이 날은 식사 계획이 없어요</div>`}
  </div>`;
}

function rRecipe(){
  const m=S.currentMeal;if(!m)return"";
  const tIcon={"아침":"🌅","점심":"☀️","저녁":"🌙"};
  const nut=calcNutrition(m.name,1);
  const fridgeNames=S.fridge.map(f=>f.name);
  return`<div style="padding:80px 20px 14px;background:linear-gradient(160deg,#E8F5E9,#fff)">
    <button class="back" onclick="go(S.recipeBack||'a-meal')">←</button>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span>${tIcon[m.type]||""}</span><span style="font-size:12px;color:#aaa;font-weight:700">${m.type||""}</span></div>
    <div class="title">${m.name}</div>
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
      <span class="badge" style="background:#E8F5E9;color:#2e7d32">⏱ ${m.cookTime||getCookTime(m.name)}분</span>
      <span class="badge" style="background:#E3F2FD;color:#1565C0">👥 ${S.people}인분</span>
      ${nut?`<span class="badge" style="background:#FFF3E0;color:#E65100">🔥 ${nut.calRange||nut.cal+"kcal"}</span>`:""}
    </div>
    ${nut?`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px">
      <div style="background:#E3F2FD;border-radius:12px;padding:10px;text-align:center"><div style="font-size:10px;color:#1565C0;font-weight:700">단백질</div><div style="font-size:16px;font-weight:900;color:#1976D2">${nut.pro}g</div></div>
      <div style="background:#FFF3E0;border-radius:12px;padding:10px;text-align:center"><div style="font-size:10px;color:#E65100;font-weight:700">지방</div><div style="font-size:16px;font-weight:900;color:#F57C00">${nut.fat}g</div></div>
      <div style="background:#F3E5F5;border-radius:12px;padding:10px;text-align:center"><div style="font-size:10px;color:#4B3FD8;font-weight:700">탄수화물</div><div style="font-size:16px;font-weight:900;color:#4B3FD8">${nut.carb}g</div></div>
    </div>`:""}
  </div>
  <div style="margin:0 20px 8px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
    <a href="https://www.10000recipe.com/recipe/list.html?q=${encodeURIComponent(m.name)}" target="_blank" style="padding:10px;background:#FF6B35;color:#fff;border-radius:12px;text-align:center;text-decoration:none;font-weight:700;font-size:12px">🍳 만개레시피</a>
    <a href="https://search.naver.com/search.naver?where=recipe&query=${encodeURIComponent(m.name+" 만들기")}" target="_blank" style="padding:10px;background:#03C75A;color:#fff;border-radius:12px;text-align:center;text-decoration:none;font-weight:700;font-size:12px">🔍 네이버</a>
    <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(m.name+" 레시피")}" target="_blank" style="padding:10px;background:#FF0000;color:#fff;border-radius:12px;text-align:center;text-decoration:none;font-weight:700;font-size:12px">▶ 유튜브</a>
  </div>
  <div style="margin:0 20px 8px">
    <button onclick="addToDiary('${m.name}')" style="width:100%;padding:11px;background:var(--primary-pale);border:none;border-radius:12px;font-weight:700;font-size:13px;color:var(--primary);cursor:pointer">📔 식단 일기에 추가</button>
  </div>
  <div style="margin:0 20px 100px">
    <div class="sec">🧾 재료 목록</div>
    <div style="background:var(--card);border-radius:16px;padding:14px;box-shadow:var(--shadow)">
      ${(()=>{
        const db=MENU_DB[m.name];
        const ings=db?db.ingredients:[];
        if(!ings.length)return"<div style='color:#ccc;text-align:center;padding:12px'>재료 정보가 없어요</div>";
        const cats=["단백질","채소","면·밥","양념","기타"];
        const catIcon={"단백질":"🥩","채소":"🥬","면·밥":"🍚","양념":"🧄","기타":"🛒"};
        let html="";
        for(const cat of cats){
          const items=ings.filter(i=>(i.category||"기타")===cat);
          if(!items.length)continue;
          html+=`<div style="margin-bottom:10px"><div style="font-size:10px;color:#aaa;font-weight:700;letter-spacing:1px;margin-bottom:6px">${catIcon[cat]} ${cat}</div>`;
          for(const ing of items){
            const refined=refineIngredient(ing.name,m.name);
            const inF=fridgeNames.some(f=>f===ing.name||f===refined||f.includes(ing.name)||ing.name.includes(f));
            const amt=ing.amount?scaleAmt(ing.amount,S.people):"";
            const shopUrl=!inF?getIngredientShopUrl(refined):null;
            html+=`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
              <div style="display:flex;align-items:center;gap:8px;flex:1">
                <span style="font-size:18px">${ing.icon||getIcon(ing.name)}</span>
                <div>
                  <div style="font-size:14px;font-weight:600;color:${inF?"#2e7d32":"var(--text)"}">
                    ${refined!==ing.name?refined:ing.name}
                    ${inF?"<span style='font-size:10px;background:#2ECC71;color:#fff;border-radius:6px;padding:1px 6px;margin-left:4px;font-weight:700'>냉장고✓</span>":""}
                  </div>
                  <div style="font-size:12px;color:var(--text-sub)">${amt}</div>
                </div>
              </div>
              ${!inF&&shopUrl?`<a href="${shopUrl.url}" target="_blank" style="display:flex;flex-direction:column;align-items:center;background:#E2173C;color:#fff;border-radius:10px;padding:6px 10px;text-decoration:none;flex-shrink:0">
                <span style="font-size:13px">🛒</span><span style="font-size:9px;font-weight:700">쿠팡</span>
              </a>`:`<span style="font-size:13px;color:#2ECC71;font-weight:700">${inF?"있음✓":""}</span>`}
            </div>`;
          }
          html+="</div>";
        }
        return html;
      })()}
    </div>
    ${(m.sides||[]).length?`<div class="sec" style="margin-top:16px">🍱 추천 반찬 <span style="font-size:11px;color:var(--primary)">(탭하면 레시피)</span></div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${(m.sides||[]).map(s=>{const sr=getSideRecipe(s);return`<button onclick="showSideRecipe('${s}')" style="background:${sr?"var(--primary-pale)":"#f5f5f5"};border:1px solid ${sr?"var(--primary)":"#ddd"};border-radius:20px;padding:5px 10px;font-size:12px;font-weight:600;color:${sr?"var(--primary)":"#666"}">${s}${sr?" 📖":""}</button>`;}).join("")}
    </div>`:""}
  </div>`;
}

function goMakeMeal(){
  // 이미 식단 있으면 확인 모달
  const hasCal = S.mealCalendar && Object.keys(S.mealCalendar).length > 0;
  if(hasCal){
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(26,26,46,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
    const box = document.createElement('div');
    box.style.cssText = 'background:#fff;border-radius:20px;padding:24px;max-width:340px;width:100%';
    box.innerHTML = `
      <div style="font-size:32px;text-align:center;margin-bottom:12px">🗓️</div>
      <div style="font-weight:800;font-size:17px;text-align:center;margin-bottom:8px">이미 식단이 있어요</div>
      <div style="font-size:13px;color:#aaa;text-align:center;margin-bottom:20px;line-height:1.5">다시 짜면 기존 식단이 사라져요.<br>계속 진행할까요?</div>
      <button id="confirm-remake" style="width:100%;padding:14px;background:var(--primary);border:none;border-radius:14px;font-weight:700;font-size:15px;color:#fff;cursor:pointer;margin-bottom:10px">새로 짜기</button>
      <button id="cancel-remake" style="width:100%;padding:12px;background:#f5f5f5;border:none;border-radius:14px;font-weight:700;font-size:14px;color:#aaa;cursor:pointer">취소</button>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    document.getElementById('confirm-remake').onclick = () => { overlay.remove(); _doMakeMeal(); };
    document.getElementById('cancel-remake').onclick = () => overlay.remove();
    overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
    return;
  }
  _doMakeMeal();
}
function _doMakeMeal(){
  const fridgeNames=S.fridge.map(f=>f.name);
  const pool=S.bcMenus&&S.bcMenus.length>0 ? S.bcMenus : Object.keys(MENU_DB).sort(()=>Math.random()-0.5).slice(0,totalMeals());

  // 내일부터 시작
  const startDate=new Date();
  startDate.setDate(startDate.getDate()+1);

  const totalWeeks=S.planDuration||1;
  const totalDaysCount=7*totalWeeks;
  const dayNames=["일","월","화","수","목","금","토"];

  // 날짜별 메뉴 배정
  const mealCalendar={};
  const weeklyMeal=[]; // 기존 호환용
  let menuIdx=0;

  for(let i=0;i<totalDaysCount;i++){
    const d=new Date(startDate);
    d.setDate(startDate.getDate()+i);
    const key=dateKey(d);
    const dayName=["일","월","화","수","목","금","토"][d.getDay()];
    const slots=S.schedule[dayName]||[];
    if(!slots.length){ weeklyMeal.push({day:dayName,date:key,meals:[]}); continue; }

    const meals=slots.map(type=>{
      const name=pool[menuIdx%pool.length];
      menuIdx++;
      const db=MENU_DB[name];
      return{
        type, name,
        cookTime:getCookTime(name),
        sides:getSides(name,type),
        mainIngredients:db?db.ingredients.slice(0,3).map(i=>i.name):[],
      };
    });

    mealCalendar[key]=meals;
    weeklyMeal.push({day:dayName, date:key, meals});
  }

  S.mealCalendar=mealCalendar;
  S.mealPlan={weeklyMeal, tip:`${pool.length}개 메뉴로 ${totalWeeks>1?totalWeeks+'주':''} 식단을 구성했어요`};
  S.mealStartDate=dateKey(startDate);
  S.calSelectedDay=undefined;
  S.calViewDate=null;
  saveMeal();
  addUsage();
  setFlow(S.activeFlow);

  // 냉장고 부족 재료 알림
  const missing=[];
  pool.slice(0,7).forEach(name=>{
    const db=MENU_DB[name];
    if(!db) return;
    db.ingredients.filter(i=>i.category==="단백질"&&!fridgeNames.some(f=>f.includes(i.name)||i.name.includes(f)))
      .forEach(i=>missing.push(`"${name}" - ${i.name}`));
  });
  if(missing.length>0) showWarn([...new Set(missing)].slice(0,5));
  else go("home");
}
// 캘린더에서 메뉴 선택 → 레시피
function setCalMeal(dateKey, mealIdx){
  const cal=S.mealCalendar||{};
  const meals=cal[dateKey]||[];
  if(!meals[mealIdx]) return;
  S.currentMeal=meals[mealIdx];
  S.recipeBack='tab-meal';
  go('recipe');
}

// 초기화 2단계 모달
function confirmResetMeal(){
  const overlay=document.createElement("div");
  overlay.style.cssText="position:fixed;inset:0;background:rgba(26,26,46,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px";
  const box=document.createElement("div");
  box.style.cssText="background:#fff;border-radius:20px;padding:24px;max-width:360px;width:100%";

  const title=document.createElement("div");
  title.style.cssText="font-weight:800;font-size:17px;margin-bottom:6px";
  title.textContent="🔄 식단 초기화";

  const sub=document.createElement("div");
  sub.style.cssText="font-size:13px;color:#aaa;margin-bottom:16px";
  sub.textContent="냉장고 재료는 어떤 경우에도 유지돼요";

  // 1단계: 식단만 초기화
  const btn1=document.createElement("button");
  btn1.style.cssText="width:100%;padding:14px;background:#FFF3E0;border:none;border-radius:14px;font-weight:700;font-size:14px;color:#E65100;cursor:pointer;margin-bottom:10px;text-align:left;display:flex;flex-direction:column;gap:4px";
  btn1.innerHTML='<span>🗓️ 식단만 초기화</span><span style="font-size:11px;font-weight:400;color:#aaa">식단 캘린더 삭제 · 냉장고/스케줄 유지</span>';
  btn1.onclick=()=>{
    S.mealCalendar={};
    S.mealPlan=null;
    S.mealStartDate=null;
    S.calViewDate=null;
    localStorage.removeItem("wm_cal");
    localStorage.removeItem("wm_meal");
    localStorage.removeItem("wm_cart_done");
    S.cart=[];S.cartDone=false;
    overlay.remove();
    render();
  };

  // 2단계: 완전 초기화
  const btn2=document.createElement("button");
  btn2.style.cssText="width:100%;padding:14px;background:#FFEBEE;border:none;border-radius:14px;font-weight:700;font-size:14px;color:#e53935;cursor:pointer;margin-bottom:10px;text-align:left;display:flex;flex-direction:column;gap:4px";
  btn2.innerHTML='<span>⚠️ 완전 초기화</span><span style="font-size:11px;font-weight:400;color:#aaa">식단+스케줄+기간 초기화 · 온보딩 재시작</span>';
  btn2.onclick=()=>{
    S.mealCalendar={};
    S.mealPlan=null;
    S.mealStartDate=null;
    S.calViewDate=null;
    S.planDuration=1;
    S.activeFlow=null;
    localStorage.removeItem("wm_cal");
    localStorage.removeItem("wm_meal");
    localStorage.removeItem("wm_schedule_set");
    localStorage.removeItem("wm_plan_duration");
    localStorage.removeItem("wm_flow");
    overlay.remove();
    go("onboard");
  };

  const cancelBtn=document.createElement("button");
  cancelBtn.style.cssText="width:100%;padding:12px;background:#f5f5f5;border:none;border-radius:12px;font-weight:700;font-size:14px;color:#aaa;cursor:pointer";
  cancelBtn.textContent="취소";
  cancelBtn.onclick=()=>overlay.remove();

  box.appendChild(title);
  box.appendChild(sub);
  box.appendChild(btn1);
  box.appendChild(btn2);
  box.appendChild(cancelBtn);
  overlay.appendChild(box);
  overlay.onclick=e=>{if(e.target===overlay)overlay.remove();};
  document.body.appendChild(overlay);
}

function rBSuggest(){
  const menus=S.bcSuggested||[];
  const sel=menus.filter(m=>m.selected).length;
  const max=totalMeals();
  const tIcon={"아침":"🌅","점심":"☀️","저녁":"🌙"};
  return`<div style="padding:52px 20px 12px;background:linear-gradient(160deg,#FFF8EE,#fff)">
    <button class="back" onclick="go('bc-entry')">←</button>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
      <div>
        <div class="title" style="margin:0">🍽️ 메뉴 추천</div>
        <div style="font-size:12px;color:#aaa;margin-top:2px">${sel}개 선택 / 최대 ${max}개</div>
      </div>
      ${sel>0?`<div style="background:var(--primary);color:#fff;border-radius:20px;padding:4px 14px;font-size:13px;font-weight:700">${sel}개</div>`:''}
    </div>
  </div>
  <div style="padding:8px 16px 140px;display:flex;flex-direction:column;gap:8px">
    ${menus.length===0?'<div style="text-align:center;padding:40px;color:#aaa">추천 메뉴가 없어요</div>':
    menus.map((m,i)=>{
      const nut=calcNutrition(m.name,1);
      const isS=getSeasonalScore(m.name)>0;
      const sel=m.selected;
      return`<div onclick="(function(){const cur=S.bcSuggested[${i}].selected;const selCount=S.bcSuggested.filter(m=>m.selected).length;if(!cur&&selCount>=${max})return;S.bcSuggested[${i}].selected=!cur;render();})()"
        style="background:${sel?'#FFF8EE':'#fff'};border:1.5px solid ${sel?'var(--primary)':'#f0f0f0'};
        border-radius:16px;padding:14px 16px;cursor:pointer;
        box-shadow:${sel?'0 2px 12px rgba(255,152,0,0.15)':'0 1px 4px rgba(0,0,0,0.05)'};
        display:flex;align-items:center;gap:12px">
        <div style="width:22px;height:22px;border-radius:6px;flex-shrink:0;
          background:${sel?'var(--primary)':'#f5f5f5'};
          border:2px solid ${sel?'var(--primary)':'#e0e0e0'};
          display:flex;align-items:center;justify-content:center">
          ${sel?'<span style="color:#fff;font-size:13px;font-weight:900">✓</span>':''}
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
            <span style="font-weight:700;font-size:15px;color:${sel?'var(--primary)':'var(--text)'}">${m.name}</span>
            ${isS?'<span style="font-size:9px;background:#2ECC71;color:#fff;border-radius:6px;padding:1px 5px;font-weight:700">제철</span>':''}
          </div>
          <div style="font-size:11px;color:#aaa;display:flex;gap:8px">
            <span>${tIcon[m.type]||''} ${m.type}</span>
            <span>⏱ ${getCookTime(m.name)}분</span>
            ${nut?`<span style="color:#E65100">🔥 ${nut.calRange||nut.cal+"kcal"}</span>`:''}
          </div>
          ${m.ingredients&&m.ingredients.length?`<div style="font-size:11px;color:#bbb;margin-top:3px">${m.ingredients.slice(0,3).join(' · ')}</div>`:''}
        </div>
      </div>`;
    }).join('')}
  </div>
  <div class="bottom-bar">
    <div style="font-size:12px;color:#aaa;text-align:center;margin-bottom:8px">
      ${sel===0?'메뉴를 선택해주세요':sel<max?`${max-sel}개 더 선택 가능해요`:`${sel}개 선택 완료! 🎉`}
    </div>
    <button class="btn-o" ${sel===0?'disabled':''} onclick="S.bcMenus=S.bcSuggested.filter(m=>m.selected).map(m=>m.name);genBCCart()">
      🛒 재료 분석하기 (${sel}개)
    </button>
  </div>`;
}

function rMealTab(){
  const cal=S.mealCalendar||{};
  const tIcon={"아침":"☀️","점심":"🍽️","저녁":"🌙"};
  const tTone={
    "아침":["#FFF4DA","#F2A900"],
    "점심":["#F1ECFF","var(--primary)"],
    "저녁":["#EEF2F7","#475569"]
  };
  const now=new Date();
  const today=dateKey(now);
  let changed=false;

  Object.keys(cal).forEach(key=>{
    if(isPastDate(key)){
      cal[key].forEach(meal=>{
        const db=MENU_DB[meal.name];
        if(!db) return;
        db.ingredients.forEach(ing=>{
          const idx=S.fridge.findIndex(f=>f.name===ing.name||f.name.includes(ing.name)||ing.name.includes(f.name));
          if(idx!==-1) S.fridge.splice(idx,1);
        });
      });
      delete cal[key];
      changed=true;
    }
  });
  if(changed){S.mealCalendar=cal;saveMeal();saveFridge();}

  const fmtKcal=v=>Number(v||0).toLocaleString('ko-KR');
  const mealNut=m=>calcNutrition(m.name,1)||{cal:0,carb:0,pro:0,fat:0};
  const macroLine=n=>`탄 ${Math.round(n.carb||0)}g · 단 ${Math.round(n.pro||0)}g · 지 ${Math.round(n.fat||0)}g`;
  const mealCard=(m,idx,key)=>{
    const n=mealNut(m);
    const tone=tTone[m.type]||["#F1ECFF","var(--primary)"];
    const cook=(typeof getCookTime==='function'?getCookTime(m.name):'');
    return `<div onclick="setCalMeal('${key}',${idx})" style="position:relative;overflow:hidden;background:#fff;border:1px solid rgba(17,24,39,.07);border-radius:24px;padding:16px 16px 15px;box-shadow:0 14px 34px rgba(31,41,55,.07);cursor:pointer">
      <div style="position:absolute;right:-28px;top:-34px;width:92px;height:92px;border-radius:50%;background:${tone[0]};opacity:.9"></div>
      <div style="position:relative;z-index:1;display:flex;align-items:flex-start;gap:12px">
        <div style="width:44px;height:44px;border-radius:17px;background:${tone[0]};display:flex;align-items:center;justify-content:center;font-size:21px;flex-shrink:0">${tIcon[m.type]||'🍽️'}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px">
            <span style="font-size:11px;font-weight:800;color:${tone[1]};background:${tone[0]};border-radius:999px;padding:3px 9px">${m.type||'식사'}</span>
            ${cook?`<span style="font-size:11px;font-weight:500;color:#98A2B3">⏱ ${cook}분</span>`:''}
          </div>
          <div style="font-size:17px;font-weight:900;letter-spacing:-.6px;color:#111827;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.name}</div>
          <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-top:12px;gap:10px">
            <div>
              <div style="font-size:25px;font-weight:900;letter-spacing:-1px;color:#111827;line-height:1">${fmtKcal(n.cal)} <span style="font-size:12px;font-weight:700;color:#98A2B3">kcal</span></div>
              <div style="font-size:11px;color:#98A2B3;margin-top:5px;font-weight:400">${macroLine(n)}</div>
            </div>
            <div style="width:28px;height:28px;border-radius:11px;background:#F6F4FF;color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;flex-shrink:0">›</div>
          </div>
        </div>
      </div>
    </div>`;
  };

  if(S.calViewDate){
    const meals=cal[S.calViewDate]||[];
    const parts=S.calViewDate.split("-");
    const d=new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2]));
    const dayName=["일","월","화","수","목","금","토"][d.getDay()];
    const dayCal=meals.reduce((s,m)=>s+(mealNut(m).cal||0),0);
    const dayMacro=meals.reduce((a,m)=>{const n=mealNut(m);a.carb+=(n.carb||0);a.pro+=(n.pro||0);a.fat+=(n.fat||0);return a;},{carb:0,pro:0,fat:0});

    if(!meals.length) return`<div style="min-height:100%;padding:52px 20px 120px;background:linear-gradient(180deg,#F5F1FF 0%,#FBFAFF 44%,#F7F7FB 100%)">
      <button onclick="S.calViewDate=null;render()" style="width:40px;height:40px;border:none;border-radius:15px;background:#fff;box-shadow:0 10px 24px rgba(31,41,55,.08);font-size:20px;color:var(--primary);margin-bottom:14px">←</button>
      <div style="font-size:26px;font-weight:900;letter-spacing:-1px">${d.getMonth()+1}/${d.getDate()} (${dayName})</div>
      <div style="margin-top:34px;text-align:center;padding:34px 20px;background:#fff;border-radius:26px;border:1px solid rgba(17,24,39,.06);box-shadow:0 14px 34px rgba(31,41,55,.06)">
        <div style="font-size:40px;margin-bottom:8px">📅</div>
        <div style="font-weight:800;color:#111827">아직 빈칸이에요</div>
      </div>
    </div>`;

    return`<div style="min-height:100%;padding:52px 20px 120px;background:linear-gradient(180deg,#F5F1FF 0%,#FBFAFF 44%,#F7F7FB 100%)">
      <button onclick="S.calViewDate=null;render()" style="width:40px;height:40px;border:none;border-radius:15px;background:#fff;box-shadow:0 10px 24px rgba(31,41,55,.08);font-size:20px;color:var(--primary);margin-bottom:14px">←</button>

      <div style="border-radius:30px;padding:20px;background:linear-gradient(145deg,#7C5CFF,#A486FF);color:#fff;box-shadow:0 24px 48px rgba(124,92,255,.22);margin-bottom:16px;position:relative;overflow:hidden">
        <div style="position:absolute;right:-30px;top:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.14)"></div>
        <div style="position:relative;z-index:1">
          <div style="font-size:12px;font-weight:700;opacity:.82;margin-bottom:6px">${d.getMonth()+1}월 ${d.getDate()}일 ${dayName}요일</div>
          <div style="font-size:32px;font-weight:900;letter-spacing:-1.3px;line-height:1">${fmtKcal(dayCal)} kcal</div>
          <div style="font-size:12px;opacity:.84;margin-top:7px">${meals.length}끼 · ${macroLine(dayMacro)}</div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px">
        ${meals.map((m,mi)=>mealCard(m,mi,S.calViewDate)).join("")}
      </div>
    </div>`;
  }

  const hasAny=Object.keys(cal).length>0;
  const viewMonth=S.calViewMonth!=null?S.calViewMonth:now.getMonth();
  const viewYear=S.calViewYear!=null?S.calViewYear:now.getFullYear();
  const firstDay=new Date(viewYear,viewMonth,1).getDay();
  const daysInMonth=new Date(viewYear,viewMonth+1,0).getDate();
  const startOffset=firstDay===0?6:firstDay-1;
  const monthNames=["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  const monthMeals=Object.keys(cal).filter(k=>{
    const [y,m]=k.split("-").map(Number);
    return y===viewYear && m===viewMonth+1;
  }).reduce((s,k)=>s+(cal[k]||[]).length,0);
  const monthCal=Object.keys(cal).filter(k=>{
    const [y,m]=k.split("-").map(Number);
    return y===viewYear && m===viewMonth+1;
  }).reduce((s,k)=>s+(cal[k]||[]).reduce((a,m)=>a+(mealNut(m).cal||0),0),0);

  return`<div style="min-height:100%;padding:52px 20px 120px;background:linear-gradient(180deg,#F5F1FF 0%,#FBFAFF 44%,#F7F7FB 100%)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div>
        <div style="font-size:13px;color:#7C6FC9;font-weight:800;margin-bottom:5px">MEAL PLAN</div>
        <div style="font-size:28px;font-weight:900;letter-spacing:-1.1px;color:#111827;line-height:1.1">식단 캘린더</div>
      </div>
      ${hasAny?`<button onclick="confirmResetMeal()" style="background:#FFF0F0;border:none;border-radius:14px;padding:9px 12px;font-size:11px;font-weight:800;color:#e53935">초기화</button>`:''}
    </div>

    <div style="display:grid;grid-template-columns:1.1fr .9fr;gap:10px;margin-bottom:16px">
      <div style="background:#fff;border:1px solid rgba(17,24,39,.07);border-radius:24px;padding:16px;box-shadow:0 12px 30px rgba(31,41,55,.06)">
        <div style="font-size:11px;color:#98A2B3;font-weight:700;margin-bottom:5px">이번 달 예정</div>
        <div style="font-size:30px;font-weight:900;letter-spacing:-1px;color:#111827;line-height:1">${monthMeals}<span style="font-size:13px;color:#98A2B3;font-weight:700"> 끼</span></div>
      </div>
      <div style="background:#fff;border:1px solid rgba(17,24,39,.07);border-radius:24px;padding:16px;box-shadow:0 12px 30px rgba(31,41,55,.06)">
        <div style="font-size:11px;color:#98A2B3;font-weight:700;margin-bottom:5px">예상 섭취</div>
        <div style="font-size:22px;font-weight:900;letter-spacing:-.7px;color:var(--primary);line-height:1">${fmtKcal(monthCal)}<span style="font-size:11px;color:#98A2B3;font-weight:700"> kcal</span></div>
      </div>
    </div>

    <div style="background:#fff;border:1px solid rgba(17,24,39,.07);border-radius:30px;padding:16px;box-shadow:0 16px 38px rgba(31,41,55,.07)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <button onclick="if(S.calViewMonth==null)S.calViewMonth=new Date().getMonth();S.calViewMonth--;if(S.calViewMonth<0){S.calViewMonth=11;if(S.calViewYear==null)S.calViewYear=new Date().getFullYear();S.calViewYear--;}render()" style="width:36px;height:36px;border:none;border-radius:14px;background:#F6F4FF;color:var(--primary);font-size:22px">‹</button>
        <div style="font-size:17px;font-weight:900;color:#111827">${viewYear}년 ${monthNames[viewMonth]}</div>
        <button onclick="if(S.calViewMonth==null)S.calViewMonth=new Date().getMonth();S.calViewMonth++;if(S.calViewMonth>11){S.calViewMonth=0;if(S.calViewYear==null)S.calViewYear=new Date().getFullYear();S.calViewYear++;}render()" style="width:36px;height:36px;border:none;border-radius:14px;background:#F6F4FF;color:var(--primary);font-size:22px">›</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-bottom:7px">
        ${["월","화","수","목","금","토","일"].map(d=>`<div style="text-align:center;font-size:11px;font-weight:800;color:${d==='토'||d==='일'?'#EF8B8B':'#98A2B3'}">${d}</div>`).join("")}
      </div>

      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px">
        ${Array(startOffset).fill('<div></div>').join("")}
        ${Array.from({length:daysInMonth},(_,i)=>{
          const day=i+1;
          const key=`${viewYear}-${viewMonth+1}-${day}`;
          const dayMeals=cal[key];
          const isToday=key===today;
          const isPast=key<today;
          const hasMeals=dayMeals&&dayMeals.length>0;
          const dayCal=hasMeals?dayMeals.reduce((s,m)=>s+(mealNut(m).cal||0),0):0;
          return`<div onclick="${hasMeals?`S.calViewDate='${key}';render()`:''}"
            style="border-radius:16px;padding:7px 2px;text-align:center;min-height:62px;cursor:${hasMeals?'pointer':'default'};background:${isToday?'linear-gradient(145deg,#7C5CFF,#9D7BFF)':hasMeals?'#F8F7FF':'transparent'};border:1px solid ${isToday?'transparent':hasMeals?'#E6E1FF':'transparent'};opacity:${isPast&&!isToday?0.48:1};position:relative">
            <div style="font-size:12px;font-weight:900;color:${isToday?'#fff':hasMeals?'#111827':'#CCD1DA'}">${day}</div>
            ${hasMeals?`<div style="display:flex;justify-content:center;gap:2px;margin-top:7px">
              ${dayMeals.slice(0,4).map(m=>`<div style="width:5px;height:5px;border-radius:50%;background:${isToday?'rgba(255,255,255,.85)':(tTone[m.type]||['','var(--primary)'])[1]}"></div>`).join("")}
            </div>
            ${dayCal>0?`<div style="font-size:8px;color:${isToday?'rgba(255,255,255,.82)':'#7C6FC9'};margin-top:4px;font-weight:800">${Math.round(dayCal/100)*100}</div>`:''}`:
            `<div style="font-size:9px;color:#E5E7EB;margin-top:10px">-</div>`}
          </div>`;
        }).join("")}
      </div>
    </div>

    ${!hasAny?`<div style="text-align:center;padding:30px 20px;background:#fff;border:1px solid rgba(17,24,39,.07);border-radius:28px;margin-top:16px;box-shadow:0 14px 34px rgba(31,41,55,.06)">
      <div style="font-size:42px;margin-bottom:10px">📅</div>
      <div style="font-weight:900;font-size:17px;color:#111827">아직 빈칸이에요</div>
      <div style="font-size:13px;color:#98A2B3;margin-top:6px;margin-bottom:16px">홈에서 식단을 짜면 달력에 채워져요</div>
      <button onclick="go('home')" class="btn-p">식단 짜러 가기</button>
    </div>`:''}
  </div>`;
}

function rWeeklyCalendar(weekDays,seasonal,tIcon){
  const days=weekDays||[];
  return`<div style="padding:0 20px 100px">
    ${days.map((w,i)=>{
      if(!w.meals||!w.meals.length) return`<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#f8f8f8;border-radius:12px;margin-bottom:6px">
        <div style="font-weight:700;color:#ccc">${w.day||""}요일</div>
        <div style="font-size:12px;color:#ddd">아직 빈칸이에요</div>
      </div>`;
      const dayCal=w.meals.reduce((s,m)=>{const n=calcNutrition(m.name,1);return s+(n?n.cal:0);},0);
      return`<div onclick="S.calSelectedDay=${i};render()" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--card);border-radius:12px;cursor:pointer;box-shadow:var(--shadow);margin-bottom:6px">
        <div style="font-weight:800">${w.day||""}요일</div>
        <div style="display:flex;align-items:center;gap:8px">
          ${dayCal>0?`<span style="font-size:11px;color:#E65100">🔥${dayCal}kcal</span>`:''}
          <span style="font-size:13px;color:#aaa">${w.meals.map(m=>tIcon[m.type]||'').join("")}</span>
          <span style="color:#ddd">›</span>
        </div>
      </div>`;
    }).join("")}
  </div>`;
}

function rMonthlyCalendar(plan,seasonal,tIcon){
  return rMealTab();
}

function genMonthlyMeal(){
  const now=new Date();
  const year=now.getFullYear();
  const month=now.getMonth();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const pool=Object.keys(MENU_DB).sort(()=>Math.random()-0.5);
  const monthPlan={};
  let pi=0;
  for(let d=1;d<=daysInMonth;d++){
    const key=`${year}-${month+1}-${d}`;
    const dow=new Date(year,month,d).getDay();
    const slots=dow===0||dow===6?["아침","점심","저녁"]:["점심","저녁"];
    monthPlan[key]=slots.map(type=>({type,name:pool[pi++%pool.length],cookTime:20}));
  }
  S.monthlyPlan=monthPlan;
  S.mealCalendar={...S.mealCalendar,...monthPlan};
  S.showMonthly=true;
  saveMeal();
  render();
}

function rFridgeTab(){
  const fridge=S.fridge||[];
  const now=Date.now();
  function getDdayVal(item){
    if(!item.addedAt||!item.expireDays) return null;
    const base=new Date(item.addedAt);
    base.setDate(base.getDate()+Number(item.expireDays));
    return Math.ceil((base-new Date())/(24*60*60*1000));
  }
  function getDdayStyle(d){
    if(d<=0) return{color:"#e53935",bg:"#FFEBEE",label:"만료"};
    if(d<=2) return{color:"#e53935",bg:"#FFEBEE",label:"D-"+d};
    if(d<=5) return{color:"#FF9800",bg:"#FFF3E0",label:"D-"+d};
    return{color:"#2e7d32",bg:"#E8F5E9",label:"D-"+d};
  }
  const sorted=[...fridge].sort((a,b)=>(getDdayVal(a)??999)-(getDdayVal(b)??999));
  const expiringSoon=sorted.filter(i=>{const d=getDdayVal(i);return d!==null&&d<=3;});
  return`<div style="padding:52px 20px 12px">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div class="title" style="margin:0">❄️ 냉장고</div>
      <div style="display:flex;align-items:center;gap:10px">
        <button onclick="S.fridge=[];saveFridge();render()" style="background:none;border:none;color:#ccc;font-size:12px">전체삭제</button>
      </div>
    </div>
    <div style="font-size:12px;color:#aaa;margin-top:4px">${fridge.length}개 보관중</div>
    ${expiringSoon.length?`<div style="background:#FFEBEE;border-radius:12px;padding:10px 14px;margin-top:10px;font-size:12px;color:#e53935;font-weight:700">⚠️ 곧 만료: ${expiringSoon.map(i=>i.name).join(", ")}</div>`:""}
  </div>
  <div style="padding:0 20px 100px">
    ${fridge.length===0?`<div style="text-align:center;padding:40px;color:#aaa">
      <div style="font-size:48px;margin-bottom:12px">❄️</div>
      <div style="font-weight:700">냉장고가 비었어요!</div>
      <div style="font-size:13px;margin-top:6px">장보기 완료 후 자동으로 채워지거나<br>직접 추가할 수 있어요</div>
      <button onclick="openAddFI()" style="margin-top:14px;padding:10px 24px;background:var(--primary);color:#fff;border:none;border-radius:20px;font-size:14px;font-weight:700;cursor:pointer">＋ 재료 직접 추가</button>
    </div>`:sorted.map((item,i)=>{
      const d=getDdayVal(item);
      const ds=d!==null?getDdayStyle(d):null;
      const fi=S.fridge.indexOf(item);
      return`<div style="background:var(--card);border-radius:14px;padding:13px 16px;margin-bottom:8px;display:flex;align-items:center;gap:12px;box-shadow:var(--shadow);border:1.5px solid ${ds&&d<=3?ds.color+'44':'transparent'}">
        <span style="font-size:24px">${item.icon||getIcon(item.name)}</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px">${item.name}</div>
          <div style="font-size:11px;color:#aaa">${item.amount||""} ${item.storage?"· "+item.storage:""}</div>
        </div>
        ${ds?`<span style="background:${ds.bg};color:${ds.color};border-radius:8px;padding:3px 8px;font-size:11px;font-weight:700">${ds.label}</span>`:""}
        <button onclick="S.fridge.splice(${fi},1);saveFridge();render()" style="background:none;border:none;color:#ddd;font-size:18px">✕</button>
      </div>`;
    }).join("")}
  </div>`;
}

function rCartTab(){
  const cart=S.cart||[];
  if(!cart.length) return`<div style="padding:52px 20px;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">🛒</div>
    <div style="font-weight:700;font-size:17px">아직 빈칸이에요</div>
    <div style="font-size:13px;color:#aaa;margin-top:6px">식단을 짜고 재료 분석을 하면 채워져요</div>
    <button onclick="go('home')" class="btn-p" style="margin-top:20px">홈으로</button>
  </div>`;
  const cats=["채소","단백질","양념","면·밥","기타"];
  const catIcon={채소:"🥬",단백질:"🥩",양념:"🧄","면·밥":"🍚",기타:"🛒"};
  const done=cart.filter(i=>i.checked).length;
  const fridgeCount=cart.filter(i=>i.inFridge).length;
  const needBuy=cart.length-fridgeCount;
  let html=`<div style="padding:52px 20px 12px">
    <div class="title" style="margin:0">🛒 장보기 목록</div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <div style="flex:1;background:#E8F5E9;border-radius:10px;padding:8px;text-align:center">
        <div style="font-size:11px;font-weight:700;color:#2e7d32">냉장고✓</div>
        <div style="font-size:16px;font-weight:900;color:#2ECC71">${fridgeCount}</div>
      </div>
      <div style="flex:1;background:#FFF8EE;border-radius:10px;padding:8px;text-align:center">
        <div style="font-size:11px;font-weight:700;color:#e65100">사야할것</div>
        <div style="font-size:16px;font-weight:900;color:var(--primary)">${needBuy}</div>
      </div>
      <div style="flex:1;background:#f8f8f8;border-radius:10px;padding:8px;text-align:center">
        <div style="font-size:11px;font-weight:700;color:#888">완료</div>
        <div style="font-size:16px;font-weight:900;color:var(--primary)">${done}</div>
      </div>
    </div>
    <div style="display:flex;gap:6px;margin-top:10px">
      <button onclick="S.cart.forEach((_,i)=>S.cart[i].checked=true);render()" style="flex:1;padding:8px;background:var(--primary-pale);border:none;border-radius:10px;font-size:12px;font-weight:700;color:var(--primary)">✓ 전체선택</button>
      <button onclick="S.cart.forEach((_,i)=>S.cart[i].checked=false);render()" style="flex:1;padding:8px;background:#f5f5f5;border:none;border-radius:10px;font-size:12px;font-weight:700;color:#888">✕ 전체해제</button>
      <button onclick="S.cart=S.cart.filter(i=>!i.checked||i.inFridge);render()" style="flex:1;padding:8px;background:#FFF0F0;border:none;border-radius:10px;font-size:12px;font-weight:700;color:#e53935">🗑 선택삭제</button>
    </div>
  </div>
  <div style="padding:0 20px 120px">`;
  for(const cat of cats){
    const items=cart.filter(i=>(i.category||"기타")===cat);
    if(!items.length) continue;
    html+=`<div style="margin-bottom:14px"><div class="sec">${catIcon[cat]} ${cat}</div>`;
    items.forEach(item=>{
      const idx=cart.indexOf(item);
      const hf=item.inFridge;
      const shopInfo=!hf?getIngredientShopUrl(item.replaceName||item.name):null;
      html+=`<div class="shop-item" style="background:${hf?'#F0FFF6':'#fff'};border:1.5px solid ${hf?'#A5D6A7':'transparent'}">
        <div class="chk ${item.checked?'done':''}" onclick="S.cart[${idx}].checked=!S.cart[${idx}].checked;render()">${item.checked?'✓':''}</div>
        <span style="font-size:20px">${item.icon||getIcon(item.name)}</span>
        <div style="flex:1" onclick="S.cart[${idx}].checked=!S.cart[${idx}].checked;render()">
          <div style="font-weight:600;font-size:14px;text-decoration:${item.checked?'line-through':'none'};color:${item.checked?'#bbb':'var(--text)'}">
            ${item.replaceName||item.name}
            ${hf?"<span style='font-size:10px;background:#2ECC71;color:#fff;border-radius:6px;padding:1px 6px;margin-left:4px;font-weight:700'>냉장고✓</span>":""}
          </div>
          <div style="font-size:11px;color:#aaa">${item.replaceQty||item.amount||""}</div>
        </div>
        ${!hf&&!item.checked&&shopInfo?`<a href="${shopInfo.url}" target="_blank" onclick="event.stopPropagation()" style="display:flex;flex-direction:column;align-items:center;background:#E2173C;color:#fff;border-radius:10px;padding:6px 8px;text-decoration:none;flex-shrink:0">
          <span style="font-size:14px">🛒</span><span style="font-size:9px;font-weight:700">쿠팡</span>
        </a>`:""}
        <button onclick="openEditCart(${idx})" style="background:none;border:none;color:#aaa;font-size:13px">✏️</button>
      </div>`;
    });
    html+="</div>";
  }
  html+=`</div>
  <div class="bottom-bar">
    ${S.cartDone
      ?`<div style="text-align:center">
          <div style="font-size:13px;color:var(--green);font-weight:700;margin-bottom:8px">✅ 냉장고에 담겼어요!</div>
          <button onclick="go('home')" class="btn-p">🏠 홈으로 돌아가기</button>
        </div>`
      :`<button class="btn-g" ${done===0?"disabled":""} onclick="addToFridge()">❄️ 구매완료 - 냉장고에 넣기 (${done}개)</button>`
    }
  </div>`;
  return html;
}

function _safeTotalMeals(){
  const n = typeof totalMeals === 'function' ? totalMeals() : 0;
  return n > 0 ? n : 7;
}
function _flowResolveMenuList(type, styles, seed){
  const max = _safeTotalMeals();
  let menus = [];

  if(type === 'style'){
    menus = flowBuildMenu('style', styles && styles.length ? styles : ['한식'], []);
  }else if(type === 'wishlist'){
    const resolved = [...new Set((seed||[]).map(m => flowMenuDBName(m)).filter(n => MENU_DB[n]))];
    menus = [...resolved];
    if(menus.length < max){
      menus = [...menus, ...findSimilarMenus(menus, menus)];
    }
    if(menus.length < max){
      const extra = Object.keys(MENU_DB).filter(k => !menus.includes(k)).sort(()=>Math.random()-0.5);
      menus = [...menus, ...extra];
    }
  }else{
    menus = flowBuildMenu('fridge', styles && styles.length ? styles : ['한식'], []);
  }

  menus = [...new Set(menus.filter(n => MENU_DB[n]))];
  if(!menus.length) menus = Object.keys(MENU_DB).sort(()=>Math.random()-0.5);
  while(menus.length < max) menus = menus.concat(menus);
  return menus.slice(0, max);
}

function genBSuggest(){
  if(!S.bcStyles || !S.bcStyles.length){alert('스타일을 선택해주세요');return;}
  const max = _safeTotalMeals();
  // 스타일별 전체 풀을 셔플해서 다양성 확보
  const fullPool = flowMenuPool(S.bcStyles).sort(()=>Math.random()-0.5);
  const pool = fullPool.slice(0, Math.max(max + 8, 20));
  const typeOrder = ['아침','점심','저녁'];
  S.bcMode = 'b';
  S.bcSuggested = pool.map((name,i)=>({
    name,
    selected: false,
    type: typeOrder[i % 3],
    ingredients: (MENU_DB[name]?.ingredients||[]).slice(0,3).map(x=>x.name),
    sharedWith: []
  }));
  go('b-suggest');
}

function genBCCart(){
  try{
    const max = _safeTotalMeals();
    const isB = S.bcMode === 'b';
    const seed = isB
      ? (S.bcSuggested||[]).filter(m=>m.selected).map(m=>m.name)
      : (S.bcMenus||[]);

    if(!seed.length){alert(isB ? '추천 메뉴를 먼저 선택해주세요' : '메뉴를 먼저 입력해주세요');return;}

    const type = isB ? 'style' : 'wishlist';
    const menus = _flowResolveMenuList(type, S.bcStyles, seed).slice(0, max);
    S.bcMenus = menus;

    const result = getIngredientsFromDB(menus, S.people || 1);
    const list = result && result.list ? result.list : [];
    S.cart = list.map(i => ({
      ...i,
      checked: !!i.inFridge,
      replaceName: '',
      replaceQty: ''
    }));
    S.fridgeAdded = false;
    S.cartDone = false;
    localStorage.removeItem('wm_cart_done');
    go('bc-cart');
  }catch(e){
    console.error('genBCCart final 오류:', e);
    alert('재료 분석 중 오류: ' + (e.message || e));
  }
}

function makeBCMealNow(){
  if(!S.bcMenus || !S.bcMenus.length){alert('먼저 장보기 재료 분석을 해주세요');return;}
  flowCreatePlan(S.bcMenus, `🍽️ 선택한 메뉴 기준으로 ${planDurationLabel()} 식단을 생성했어요.`);
  addUsage();
  go('bc-meal');
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
function addToFridge(){
  try{
    ensureScheduleReady();
    const checked=(S.cart||[]).filter(i=>i.checked);
    const bought=checked.filter(i=>!i.inFridge);
    for(const item of bought){
      const amountText=item.replaceQty||item.amount||item.qty||'적당량';
      const num=parseFloat(String(amountText).replace(/,/g,''));
      const unit=String(amountText).replace(/[0-9.,\s]/g,'').trim();
      S.fridge.push({
        name:item.replaceName||item.name,
        qty:Number.isFinite(num)?num:'', unit, amount:amountText,
        icon:item.icon||getIcon(item.name), addedAt:new Date().toISOString().slice(0,10), expireDays:(_safeShelfLife(item.replaceName||item.name||'').days||7), storage:(_safeShelfLife(item.replaceName||item.name||'').storage||'냉장')
      });
    }
    saveFridge();
    S.cart=(S.cart||[]).map(i=>({...i,checked:true,inFridge:true}));
    S.fridgeAdded=true; S.cartDone=true; localStorage.setItem('wm_cart_done','1');
    render();
  }catch(e){ console.error('addToFridge patched 오류:',e); alert('냉장고 반영/식단 생성 중 오류: '+(e.message||e)); }
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

Object.assign(NUTRITION_DB,{
  "립아이":{cal:291,pro:24,fat:21,carb:0},
  "채끝살":{cal:214,pro:22,fat:14,carb:0},
  "티본":{cal:247,pro:22,fat:17,carb:0},
  "포터하우스":{cal:247,pro:22,fat:17,carb:0},
  "토마호크":{cal:291,pro:24,fat:21,carb:0},
  "살치살":{cal:296,pro:20,fat:24,carb:0},
  "부채살":{cal:192,pro:21,fat:12,carb:0},
  "소고기목심":{cal:214,pro:19,fat:15,carb:0},
  "소고기앞다리살":{cal:190,pro:20,fat:12,carb:0},
  "소고기홍두깨살":{cal:158,pro:22,fat:7,carb:0},
  "소고기채끝살":{cal:214,pro:22,fat:14,carb:0},
  "닭날개":{cal:203,pro:19,fat:14,carb:0}
});

Object.assign(NUTRITION_DB,{
  "건고추":{cal:324,pro:12,fat:6,carb:70},
  "살사소스":{cal:36,pro:1,fat:0,carb:7},
  "사워크림":{cal:193,pro:2,fat:20,carb:4},
  "캐슈넛":{cal:553,pro:18,fat:44,carb:30}
});

Object.assign(NUTRITION_DB,{
  "꽁치":{cal:182,pro:20,fat:11,carb:0},
  "우렁":{cal:76,pro:15,fat:1,carb:2},
  "라이스크래커":{cal:380,pro:7,fat:2,carb:82},
  "두유":{cal:54,pro:3,fat:2,carb:6},
  "토마토페이스트":{cal:82,pro:4,fat:0,carb:19},
  "피타빵":{cal:275,pro:9,fat:1,carb:56},
  "피클소스":{cal:80,pro:0,fat:0,carb:18},
  "죽순":{cal:27,pro:2.6,fat:0.3,carb:5},
  "셀러리":{cal:16,pro:1,fat:0,carb:3}
});
