(function(){
  /* ===== REVIEW FIXES v1 =====
     1) 반미 계열: 일반 바게트 → 쌀바게트 90g 기준
     2) 연포탕/낙지연포탕/쟁반국수/너비아니 1인분 포션 재보정
     3) 장바구니 병합 안정화: ingredientAmounts 단위를 g 기준으로 정규화하고 getIngredientsFromDB를 id+g 합산 방식으로 교체
  */
  const VERSION='review-fixes-banhmi-units-v1';
  function DB(name){try{return (typeof window[name] !== 'undefined' && window[name]) || eval(name);}catch(e){return window[name]||null;}}
  const schema=DB('MENU_SCHEMA_V2')||{};
  const menuDB=DB('MENU_DB')||{};
  const ingDB=DB('INGREDIENT_DB_V2')||{};
  const nutDB=DB('NUTRITION_DB')||{};

  function ensureArr(v){ return Array.isArray(v)?v:[]; }
  function uniq(arr){ return [...new Set((arr||[]).filter(Boolean))]; }
  function mergeTags(row,tags){ row.tags=uniq([...(row.tags||[]),...(tags||[])]); return row; }
  function ingredientName(id){ return ingDB[id]?.name || id; }
  function ingredientCategory(id){
    const c=ingDB[id]?.category||'기타';
    if(c==='veg') return '채소'; if(c==='protein') return '단백질'; if(c==='grain') return '면·밥'; if(c==='dairy') return '유제품'; if(['sauce','spice','oil'].includes(c)) return '양념';
    return c==='기타'?'기타':c;
  }
  function iconOf(id){ return ingDB[id]?.icon || (typeof getIcon==='function'?getIcon(ingredientName(id)):'🛒'); }

  // 쌀바게트 등록: 베트남 반미 전용 기준 재료
  if(ingDB && !ingDB.rice_baguette){
    ingDB.rice_baguette={id:'rice_baguette',name:'쌀바게트',category:'grain',aliases:['쌀바게트','반미빵','베트남바게트','banh mi bread'],icon:'🥖',defaultAmount:'90g'};
  }
  if(nutDB && !nutDB['쌀바게트']){
    nutDB['쌀바게트']={cal:255,carb:51,fat:2.5,pro:7};
  }

  function nval(v){
    const s=String(v||'').replace(/,/g,'').trim();
    const f=s.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
    if(f) return Number(f[1])/Math.max(1,Number(f[2]));
    const m=s.match(/\d+(?:\.\d+)?/); return m?Number(m[0]):0;
  }
  const perUnit={
    garlic:5, ginger:5, egg:50, tortilla:40, bread:30, rice_paper:8, mandu_skin:12,
    tofu:300, soft_tofu:350, fried_tofu:20, tuna:100, crab:150, squid:220, octopus:150,
    cucumber:120, zucchini:300, onion:150, carrot:100, potato:150, sweet_potato:150, tomato:150,
    bell_pepper:120, green_onion:20, chive:100, napa:800, cabbage:600, lettuce:150,
    ramen:110, ramen_noodle:130, udon:200, somyeon:100, rice_noodle:120, soba:180,
    lasagna:25, cheese:20, sausage:80, ham:100, chicken:250, chicken_breast:180,
    pork:200, beef:180, salmon:180, mackerel:250, hairtail:250, pollack:250
  };
  function amountToG(amount,id){
    const s=String(amount||'').trim().toLowerCase();
    let num=nval(s); if(!num) return null;
    let g=num;
    if(/kg/.test(s)) g=num*1000;
    else if(/g\b|그램/.test(s)) g=num;
    else if(/ml|㎖/.test(s)) g=num;
    else if(/\bl\b|리터/.test(s)) g=num*1000;
    else if(/큰술|tbsp|tbs/.test(s)) g=num*12;
    else if(/작은술|tsp/.test(s)) g=num*4;
    else if(/컵|cup/.test(s)) g=num*200;
    else if(/공기/.test(s)) g=num*210;
    else if(/모|팩|캔|마리|개|장|쪽|알|줄기|포기|봉|스틱|줌/.test(s)) g=num*(perUnit[id]||50);
    else g=num;
    return Math.max(0, Math.round(g));
  }
  function fmtG(g){ return Math.round(Number(g)||0)+'g'; }
  function normalizedAmounts(obj){
    const out={};
    Object.keys(obj||{}).forEach(id=>{
      const g=amountToG(obj[id], id);
      out[id]=g?fmtG(g):obj[id];
    });
    return out;
  }
  function upsertMenu(name,row){
    schema[name]=row;
    // MENU_DB도 화면/장바구니용으로 즉시 동기화
    if(menuDB){
      const ingredients=(row.ingredients||[]).map(id=>({id,name:ingredientName(id),amount:row.ingredientAmounts?.[id]||ingDB[id]?.defaultAmount||'100g',icon:iconOf(id),category:ingredientCategory(id)}));
      menuDB[name]=Object.assign(menuDB[name]||{}, {name, style:(row.styles||[])[0]||row.style||'', styles:row.styles||[row.style].filter(Boolean), tags:row.tags||[], cookTime:row.cookTime||20, ingredientIds:row.ingredients||[], ingredients, baseId:row.baseId, baseName:row.baseName, servings:row.servings||1, recipeServings:row.recipeServings||1});
    }
  }
  function patchRow(name, spec){
    const prev=schema[name]||menuDB[name]||{};
    const row=Object.assign({}, prev, spec, {name});
    row.styles=spec.styles || prev.styles || (prev.style?[prev.style]:[]);
    row.tags=uniq([...(prev.tags||[]),...(spec.tags||[])]);
    row.ingredients=spec.ingredients || prev.ingredients || [];
    row.ingredientAmounts=normalizedAmounts(spec.ingredientAmounts || prev.ingredientAmounts || {});
    row.servings=spec.servings || 1;
    row.recipeServings=spec.recipeServings || row.servings;
    upsertMenu(name,row);
    return row;
  }

  // 1) 반미 계열 추출 및 쌀바게트 90g 기준 보정
  const banhMiNames=uniq([...Object.keys(schema),...Object.keys(menuDB)].filter(n=>/반미/i.test(n)));
  if(!banhMiNames.includes('반미')) banhMiNames.push('반미');
  banhMiNames.forEach(name=>{
    const isChicken=/치킨|닭|chicken/i.test(name);
    const protein=isChicken?'chicken':'pork';
    patchRow(name,{
      styles:['🇻🇳 베트남'], baseId:'vietnamese', baseName:'베트남식', isVariation:true, cookTime:20,
      tags:['대표메뉴','반미Audit','쌀바게트90g','포션정상화'], servings:1, recipeServings:1,
      ingredients:['rice_baguette',protein,'cucumber','carrot','cilantro','pickled_radish','mayo','jalapeno','fish_sauce','garlic','lime','sugar'].concat(isChicken?['curry_powder']:[]),
      ingredientAmounts:Object.assign({rice_baguette:'90g'}, isChicken?{chicken:'80g'}:{pork:'70g'}, {cucumber:'40g',carrot:'30g',cilantro:'5g',pickled_radish:'25g',mayo:'8g',jalapeno:'8g',fish_sauce:'5g',garlic:'3g',lime:'10g',sugar:'3g'}, isChicken?{curry_powder:'5g'}:{})
    });
  });

  // 2) 지적 메뉴 포션 재보정
  patchRow('낙지연포탕',{
    styles:['한식'], baseId:'jjigae_tang', baseName:'찌개/탕', cookTime:25, tags:['국물','포션Audit','1인분보정'], servings:1, recipeServings:1,
    ingredients:['octopus','radish','green_onion','garlic','soup_soy_sauce','sesame_oil','water','salt','cheongyang_pepper'],
    ingredientAmounts:{octopus:'120g',radish:'60g',green_onion:'15g',garlic:'5g',soup_soy_sauce:'8g',sesame_oil:'3g',water:'450g',salt:'1g',cheongyang_pepper:'5g'}
  });
  patchRow('연포탕',{
    styles:['한식'], baseId:'jjigae_tang', baseName:'찌개/탕', cookTime:25, tags:['국물','포션Audit','1인분보정'], servings:1, recipeServings:1,
    ingredients:['octopus','radish','green_onion','garlic','soup_soy_sauce','water','salt','cheongyang_pepper'],
    ingredientAmounts:{octopus:'120g',radish:'60g',green_onion:'15g',garlic:'5g',soup_soy_sauce:'8g',water:'450g',salt:'1g',cheongyang_pepper:'5g'}
  });
  patchRow('쟁반국수',{
    styles:['한식'], baseId:'guksu_naengmyeon', baseName:'국수/냉면', cookTime:20, tags:['면','포션Audit','1인분보정'], servings:1, recipeServings:1,
    ingredients:['somyeon','cucumber','cabbage','carrot','egg','gochujang','vinegar','sugar','sesame_oil','sesame','garlic'],
    ingredientAmounts:{somyeon:'100g',cucumber:'40g',cabbage:'50g',carrot:'25g',egg:'50g',gochujang:'22g',vinegar:'15g',sugar:'8g',sesame_oil:'5g',sesame:'3g',garlic:'4g'}
  });
  patchRow('너비아니',{
    styles:['한식'], baseId:'bulgogi_jeyuk', baseName:'불고기/제육', cookTime:25, tags:['구이','포션Audit','1인분보정'], servings:1, recipeServings:1,
    ingredients:['beef','soy_sauce','sugar','garlic','green_onion','sesame_oil','sesame','pear'],
    ingredientAmounts:{beef:'130g',soy_sauce:'12g',sugar:'5g',garlic:'5g',green_onion:'10g',sesame_oil:'5g',sesame:'2g',pear:'25g'}
  });

  // 3) 전체 MENU_SCHEMA_V2 ingredientAmounts 단위 정규화(g 기준)
  Object.keys(schema).forEach(name=>{
    const row=schema[name];
    if(!row || !row.ingredientAmounts) return;
    row.ingredientAmounts=normalizedAmounts(row.ingredientAmounts);
    if(menuDB[name]){
      const m=menuDB[name];
      m.ingredientIds=row.ingredients||m.ingredientIds||[];
      m.ingredients=(row.ingredients||m.ingredientIds||[]).map(id=>({id,name:ingredientName(id),amount:row.ingredientAmounts[id]||ingDB[id]?.defaultAmount||'100g',icon:iconOf(id),category:ingredientCategory(id)}));
    }
  });

  // 4) 장바구니 생성 로직: 같은 id 재료는 g 합산해서 1줄로 표시
  window.getIngredientsFromDB = function(menus, people){
    const merged={};
    const s=(typeof S==='object'&&S)?S:{fridge:[]};
    const fridgeNames=(s.fridge||[]).map(f=>(f.name||'').trim());
    const fridgeIds=(typeof fridgeIngredientIdsV2==='function')?fridgeIngredientIdsV2():[];
    let allFound=true;
    const ppl=Math.max(1,Number(people||1));
    (menus||[]).forEach(menu=>{
      const name=(typeof flowMenuDBName==='function'?flowMenuDBName(menu):menu);
      const row=schema[name]||menuDB[name];
      if(!row){ allFound=false; return; }
      const ids=row.ingredientAmounts ? Object.keys(row.ingredientAmounts) : (row.ingredientIds||[]);
      ids.forEach(id=>{
        const ingName=ingredientName(id);
        if(!ingName) return;
        const amount=row.ingredientAmounts?.[id] || (row.ingredients||[]).find(x=>x.id===id)?.amount || ingDB[id]?.defaultAmount || '100g';
        const g=(amountToG(amount,id)||0)*ppl;
        const key=id||ingName;
        const inFridge=fridgeIds.includes(id)||fridgeNames.some(f=>f.includes(ingName)||ingName.includes(f));
        if(!merged[key]) merged[key]={name:ingName,id:key,_grams:0,amount:'0g',icon:iconOf(id),category:ingredientCategory(id),inFridge,usedIn:name};
        merged[key]._grams += g;
        merged[key].amount=fmtG(merged[key]._grams);
        merged[key].inFridge=merged[key].inFridge||inFridge;
        if(!String(merged[key].usedIn||'').includes(name)) merged[key].usedIn=(merged[key].usedIn?merged[key].usedIn+', ':'')+name;
      });
    });
    return {list:Object.values(merged).map(x=>{delete x._grams; return x;}), allFound};
  };

  window.WM_REVIEW_FIX_AUDIT={version:VERSION,banhMiMenus:banhMiNames,banhMiCount:banhMiNames.length,unitNormalized:true,patchedMenus:['연포탕','낙지연포탕','쟁반국수','너비아니',...banhMiNames]};
  })();

(function(){
  /* 낙지연포탕 120kcal 보정
     원인: 기존 1인분 패치가 낙지를 120g으로 낮게 잡았고, 대파/마늘 등 일부 한글 영양키가 누락될 수 있어
     주재료가 거의 낙지 120g + 참기름 소량만 계산되는 상태였다.
     수정: 낙지 250g 기준 1인분으로 재정의하고, 관련 재료 영양키를 보강한다. */
  try{
    var schema=(typeof MENU_SCHEMA_V2!=='undefined')?MENU_SCHEMA_V2:(window.MENU_SCHEMA_V2||{});
    var menuDB=(typeof MENU_DB!=='undefined')?MENU_DB:(window.MENU_DB||{});
    var ingDB=(typeof INGREDIENT_DB_V2!=='undefined')?INGREDIENT_DB_V2:(window.INGREDIENT_DB_V2||{});
    if(typeof NUTRITION_DB!=='undefined'){
      Object.assign(NUTRITION_DB,{
        '낙지':{cal:73,pro:15,fat:1,carb:1},
        '무':{cal:18,pro:1,fat:0,carb:4},
        '대파':{cal:32,pro:1.8,fat:0.2,carb:7},
        '마늘':{cal:149,pro:6.4,fat:0.5,carb:33},
        '국간장':{cal:35,pro:4,fat:0,carb:5},
        '참기름':{cal:884,pro:0,fat:100,carb:0},
        '청양고추':{cal:27,pro:1,fat:0,carb:6},
        '물':{cal:0,pro:0,fat:0,carb:0},
        '소금':{cal:0,pro:0,fat:0,carb:0}
      });
    }
    if(ingDB){
      Object.assign(ingDB,{
        octopus:Object.assign({id:'octopus',name:'낙지',category:'protein',aliases:['낙지','산낙지'],icon:'🐙',defaultAmount:'250g'}, ingDB.octopus||{}),
        green_onion:Object.assign({id:'green_onion',name:'대파',category:'veg',aliases:['대파','파'],icon:'🧅',defaultAmount:'20g'}, ingDB.green_onion||{}),
        garlic:Object.assign({id:'garlic',name:'마늘',category:'sauce',aliases:['마늘','다진마늘'],icon:'🧄',defaultAmount:'6g'}, ingDB.garlic||{}),
        radish:Object.assign({id:'radish',name:'무',category:'veg',aliases:['무','무우'],icon:'🥬',defaultAmount:'80g'}, ingDB.radish||{})
      });
    }
    function uniq(a){return Array.from(new Set((a||[]).filter(Boolean)));}
    function ingName(id){return (ingDB&&ingDB[id]&&ingDB[id].name)||id;}
    function iconOf(id){return (ingDB&&ingDB[id]&&ingDB[id].icon)||'🛒';}
    function catOf(id){var c=(ingDB&&ingDB[id]&&ingDB[id].category)||'기타'; return {veg:'채소',protein:'단백질',sauce:'양념',grain:'면·밥',dairy:'기타'}[c]||'기타';}
    function upsert(name, spec){
      var prev=(schema&&schema[name])||(menuDB&&menuDB[name])||{};
      var row=Object.assign({},prev,spec,{name:name});
      row.tags=uniq([...(prev.tags||[]),...(spec.tags||[])]);
      row.servings=1; row.recipeServings=1;
      if(schema) schema[name]=row;
      if(menuDB){
        menuDB[name]=Object.assign(menuDB[name]||{}, row, {
          style:(row.styles||[])[0]||'한식',
          ingredientIds:row.ingredients||[],
          ingredients:(row.ingredients||[]).map(function(id){return {id:id,name:ingName(id),amount:(row.ingredientAmounts||{})[id]||'100g',icon:iconOf(id),category:catOf(id)};})
        });
      }
    }
    var common={
      styles:['한식'], baseId:'jjigae_tang', baseName:'찌개/탕', cookTime:25,
      tags:['국물','낙지연포탕보정','주재료보강','1인분포션'],
      ingredients:['octopus','radish','green_onion','garlic','soup_soy_sauce','sesame_oil','water','salt','cheongyang_pepper'],
      ingredientAmounts:{octopus:'250g',radish:'80g',green_onion:'20g',garlic:'6g',soup_soy_sauce:'8g',sesame_oil:'5g',water:'450g',salt:'1g',cheongyang_pepper:'5g'}
    };
    upsert('낙지연포탕', common);
    upsert('연포탕', Object.assign({}, common, {tags:['국물','연포탕보정','주재료보강','1인분포션']}));
    window.WM_NAKJI_YEONPO_FIX={version:'nakji-yeonpo-calorie-fix-v2',octopusAmount:'250g',expectedKcalRange:'250~300kcal'};
    }catch(e){}
})();

(function(){
  /* 상업용 출시 기준 영양/장보기 신뢰도 패치
     핵심 원칙: 메뉴 kcal은 메뉴별 1인분 포션 + 재료별 100g 영양 DB 합산으로만 산출한다.
     - 제철 노출 제거
     - 재료 단위 g/ml 정규화
     - 장바구니 동일 재료 g/ml 합산
     - 내부 Audit 리포트 함수 제공 */
  try{
    function DB(name){
      try{ if(name==='MENU_SCHEMA_V2' && typeof MENU_SCHEMA_V2!=='undefined') return MENU_SCHEMA_V2; }catch(e){}
      try{ if(name==='MENU_DB' && typeof MENU_DB!=='undefined') return MENU_DB; }catch(e){}
      try{ if(name==='INGREDIENT_DB_V2' && typeof INGREDIENT_DB_V2!=='undefined') return INGREDIENT_DB_V2; }catch(e){}
      try{ if(name==='NUTRITION_DB' && typeof NUTRITION_DB!=='undefined') return NUTRITION_DB; }catch(e){}
      return window[name]||{};
    }
    var schema=DB('MENU_SCHEMA_V2'), menuDB=DB('MENU_DB'), ingDB=DB('INGREDIENT_DB_V2'), nutDB=DB('NUTRITION_DB');

    // 1) 제철 표시는 상업용 MVP에서 제거: 추천 점수/배지/문구 모두 무효화
    window.getSeasonalIngs=function(){return [];};
    window.getSeasonalScore=function(){return 0;};
    window.seasonBadge=function(){return '';};
    window.WM_SEASONAL_DISABLED=true;

    // 2) 재료별 단위 환산표. 같은 재료는 같은 id + g/ml 기준으로 통합한다.
    var UNIT_G={
      garlic:{'쪽':5,'개':5,'알':5}, egg:{'개':50,'알':50}, onion:{'개':150}, green_onion:{'대':25,'개':25},
      scallion:{'대':20}, leek:{'대':80}, cheongyang_pepper:{'개':10}, red_pepper:{'개':12}, chili:{'개':10},
      ginger:{'쪽':5,'개':5}, cucumber:{'개':150}, carrot:{'개':120}, potato:{'개':150}, sweet_potato:{'개':180},
      tomato:{'개':150}, lemon:{'개':100}, lime:{'개':60}, apple:{'개':250}, banana:{'개':120}, avocado:{'개':150},
      tofu:{'모':300,'팩':300}, soft_tofu:{'팩':350}, kimchi:{'포기':1200}, napa:{'포기':1200}, cabbage:{'통':900},
      squid:{'마리':250}, mackerel:{'마리':250}, hairtail:{'마리':250}, pollack:{'마리':300}, crab:{'마리':200}, octopus:{'마리':250},
      bread:{'장':35}, baguette:{'개':90}, rice_baguette:{'개':90}, tortilla:{'장':45}, rice_paper:{'장':10}, mandu_skin:{'장':8},
      ramen:{'개':130,'봉':130}, ramen_noodle:{'개':130}, udon:{'개':200}, soba:{'인분':100}, somen:{'인분':100}, noodle:{'인분':100},
      tuna:{'캔':150}, natto:{'팩':50}, yogurt:{'컵':150}, milk:{'컵':200}, cream:{'컵':200}
    };
    var GENERIC_G={'큰술':12,'작은술':4,'스푼':12,'T':12,'t':4,'컵':200,'장':10,'개':50,'쪽':5,'알':50,'대':25,'마리':200,'팩':150,'캔':150,'모':300,'봉':130,'인분':100};
    var ML_IDS=/water|broth|stock|milk|cream|soy_sauce|soup_soy_sauce|fish_sauce|vinegar|mirin|cheongju|wine|sake|lime|lemon|sauce/i;
    var ZERO_IDS=/water|broth|stock|salt|pepper/i;

    function parseAmount(ingId, raw){
      var s=String(raw==null?'':raw).trim();
      if(!s) return {value:0,unit:'g',display:'0g',raw:s};
      var n=parseFloat(s.replace(/,/g,'').match(/[0-9]+(?:\.[0-9]+)?/)?.[0]||'0');
      if(!n) return {value:0,unit:'g',display:s,raw:s};
      if(/kg/i.test(s)) return {value:n*1000,unit:'g',display:Math.round(n*1000)+'g',raw:s};
      if(/ml|㎖/i.test(s)) return {value:n,unit:'ml',display:Math.round(n)+'ml',raw:s};
      if(/g|그램/i.test(s)) return {value:n,unit:'g',display:round1(n)+'g',raw:s};
      var unitMatch=s.match(/(큰술|작은술|스푼|쪽|개|알|대|마리|장|컵|팩|캔|모|봉|인분|T|t)/);
      var unit=unitMatch?unitMatch[1]:'';
      var table=UNIT_G[ingId]||{};
      var gram=table[unit]||GENERIC_G[unit]||1;
      var metricUnit=ML_IDS.test(ingId)?'ml':'g';
      var val=n*gram;
      return {value:val,unit:metricUnit,display:round1(val)+(metricUnit==='ml'?'ml':'g'),raw:s,sourceUnit:unit};
    }
    function round1(x){return Math.round(x*10)/10;}
    function catOf(id){var c=(ingDB&&ingDB[id]&&ingDB[id].category)||'기타'; return {veg:'채소',protein:'단백질',grain:'면·밥',sauce:'양념',dairy:'기타',fruit:'채소'}[c]||'기타';}
    function nameOf(id){return (ingDB&&ingDB[id]&&ingDB[id].name)||id;}
    function iconOf(id){return (ingDB&&ingDB[id]&&ingDB[id].icon)||'🛒';}

    // 3) 전체 메뉴 포션을 g/ml 문자열로 정규화하고 MENU_DB 표시용 재료도 동기화
    function normalizeAllMenuAmounts(){
      Object.keys(schema||{}).forEach(function(menuName){
        var row=schema[menuName]; if(!row||!row.ingredientAmounts) return;
        Object.keys(row.ingredientAmounts).forEach(function(id){
          var p=parseAmount(id,row.ingredientAmounts[id]);
          if(p.value>0) row.ingredientAmounts[id]=p.display;
        });
        if(menuDB&&menuDB[menuName]){
          menuDB[menuName].ingredientIds=row.ingredients||menuDB[menuName].ingredientIds||[];
          menuDB[menuName].ingredients=(row.ingredients||[]).map(function(id){
            return {id:id,name:nameOf(id),amount:(row.ingredientAmounts||{})[id]||'0g',icon:iconOf(id),category:catOf(id)};
          });
        }
      });
    }

    // 4) calcNutrition 보강: MENU_SCHEMA_V2의 g/ml 포션과 NUTRITION_DB 100g 값을 기준으로 계산
    var prevCalc=window.calcNutrition;
    window.calcNutrition=function(menuName, people){
      people=Math.max(1,people||1);
      var row=(schema&&schema[menuName])||null;
      if(!row||!row.ingredientAmounts) return prevCalc?prevCalc(menuName,people):{cal:0,pro:0,fat:0,carb:0,calRange:'0~0kcal'};
      var servings=Math.max(1,row.recipeServings||row.servings||1);
      var totals={cal:0,pro:0,fat:0,carb:0};
      Object.keys(row.ingredientAmounts).forEach(function(id){
        var p=parseAmount(id,row.ingredientAmounts[id]);
        var grams=p.value;
        if(/cooking_oil|olive_oil|sesame_oil|oil/i.test(id)) grams*=0.18; // 조리유 흡수율
        var ingName=nameOf(id);
        var nut=nutDB[ingName]||nutDB[id];
        if(!nut) return;
        var r=grams/100;
        totals.cal+=(nut.cal||0)*r; totals.pro+=(nut.pro||0)*r; totals.fat+=(nut.fat||0)*r; totals.carb+=(nut.carb||0)*r;
      });
      var scale=people/servings;
      var cal=Math.round(totals.cal*scale);
      return {cal:cal,calLo:Math.round(cal*.95),calHi:Math.round(cal*1.05),calRange:Math.round(cal*.95)+'~'+Math.round(cal*1.05)+'kcal',pro:Math.round(totals.pro*scale),fat:Math.round(totals.fat*scale),carb:Math.round(totals.carb*scale)};
    };
    window.getMenuNut=function(name){return window.calcNutrition(name,1);};

    // 5) 장바구니 생성 보강: 같은 id 재료는 g/ml로 합산. 마늘 50g + 마늘 5쪽 같은 중복 방지.
    var prevGetIngredients=window.getIngredientsFromDB;
    window.getIngredientsFromDB=function(menus, people){
      people=Math.max(1,people||1);
      var merged={}, allFound=true;
      var fridgeNames=(window.S&&S.fridge?S.fridge:[]).map(function(f){return (f.name||'').trim();});
      var fridgeIds=(typeof fridgeIngredientIdsV2==='function')?fridgeIngredientIdsV2():[];
      (menus||[]).forEach(function(menu){
        var name=(typeof flowMenuDBName==='function'?flowMenuDBName(menu):menu);
        var row=(schema&&schema[name])||null;
        var ids=row?(row.ingredients||Object.keys(row.ingredientAmounts||{})):((menuDB[name]&&menuDB[name].ingredientIds)||[]);
        if(!ids.length){allFound=false; return;}
        var servings=Math.max(1,(row&&(row.recipeServings||row.servings))||1);
        var scale=people/servings;
        ids.forEach(function(id){
          var raw=(row&&row.ingredientAmounts&&row.ingredientAmounts[id])||(menuDB[name]&&menuDB[name].ingredients||[]).find(function(x){return x.id===id;})?.amount||'0g';
          var p=parseAmount(id,raw); var val=p.value*scale; var unit=p.unit;
          var key=id;
          var ingName=nameOf(id); if(!ingName) return;
          var inFridge=fridgeIds.includes(id)||fridgeNames.some(function(f){return f&&((f.includes(ingName))||(ingName.includes(f)));});
          if(!merged[key]) merged[key]={id:id,name:ingName,amountValue:0,amountUnit:unit,icon:iconOf(id),category:catOf(id),inFridge:inFridge,usedIn:name};
          merged[key].amountValue+=val;
          merged[key].inFridge=merged[key].inFridge||inFridge;
          if(!String(merged[key].usedIn||'').includes(name)) merged[key].usedIn+=(merged[key].usedIn?', ':'')+name;
        });
      });
      var list=Object.values(merged).map(function(x){
        x.amount=round1(x.amountValue)+(x.amountUnit==='ml'?'ml':'g');
        return x;
      });
      return {list:list,allFound:allFound};
    };

    // 6) 내부 품질 Audit 함수. 콘솔에서 WM_AUDIT_REPORT() 호출하면 이상값/누락값 확인 가능.
    window.WM_AUDIT_REPORT=function(){
      var report={totalMenus:0,nonMetricAmounts:[],missingNutrition:[],suspiciousCalories:[],missingAmounts:[]};
      Object.keys(schema||{}).forEach(function(menuName){
        var row=schema[menuName]; if(!row) return; report.totalMenus++;
        (row.ingredients||Object.keys(row.ingredientAmounts||{})).forEach(function(id){
          var raw=row.ingredientAmounts&&row.ingredientAmounts[id];
          if(!raw) report.missingAmounts.push({menu:menuName,id:id});
          if(raw&&!/(g|ml)$/i.test(String(raw))) report.nonMetricAmounts.push({menu:menuName,id:id,amount:raw});
          var nm=nameOf(id); if(!nutDB[nm]&&!ZERO_IDS.test(id)) report.missingNutrition.push({menu:menuName,id:id,name:nm});
        });
        var n=window.calcNutrition(menuName,1);
        var base=row.baseName||'';
        var low=/라멘|면|국수|덮밥|볶음밥|파스타|리조또|포케|스테이크|튀김|커리/.test(menuName+base) ? 250 : 80;
        var high=/라멘|츠케멘|튀김|덮밥|커리|파스타|리조또/.test(menuName+base) ? 1200 : 950;
        if(n.cal<low || n.cal>high) report.suspiciousCalories.push({menu:menuName,kcal:n.cal,baseName:base});
      });
      report.nonMetricAmounts=report.nonMetricAmounts.slice(0,200);
      report.missingNutrition=report.missingNutrition.slice(0,200);
      report.suspiciousCalories=report.suspiciousCalories.slice(0,200);
      return report;
    };

    normalizeAllMenuAmounts();
    window.WM_COMMERCIAL_NUTRITION_FOUNDATION={version:'v1',principle:'menu kcal = ingredient nutrition per 100g × explicit 1-serving portions',seasonalRemoved:true,metricUnits:true,cartAggregation:'by ingredient id with g/ml sum'};
    }catch(e){}
})();

(function(){
  try{
    var schema=(typeof MENU_SCHEMA_V2!=='undefined')?MENU_SCHEMA_V2:(window.MENU_SCHEMA_V2||{});
    var nut=(typeof NUTRITION_DB!=='undefined')?NUTRITION_DB:(window.NUTRITION_DB||{});
    var ingDB=(typeof INGREDIENT_DB_V2!=='undefined')?INGREDIENT_DB_V2:(window.INGREDIENT_DB_V2||{});
    if(!schema || !nut) return;
    function addNut(k,v){ nut[k]=Object.assign({pro:0,fat:0,carb:0},v); }
    Object.assign(nut,{
      '밥':{cal:150,pro:3,fat:0.3,carb:33},
      '쌀밥':{cal:150,pro:3,fat:0.3,carb:33},
      '라멘면':{cal:285,pro:9,fat:2,carb:57},
      '중화면':{cal:210,pro:7,fat:1,carb:43},
      '야키소바면':{cal:198,pro:6,fat:1,carb:41},
      '소바면':{cal:150,pro:5,fat:1,carb:30},
      '우동면':{cal:135,pro:4,fat:1,carb:28},
      '돈카츠':{cal:295,pro:18,fat:16,carb:20},
      '코로케':{cal:220,pro:5,fat:10,carb:28},
      '고로케':{cal:220,pro:5,fat:10,carb:28},
      '새우튀김':{cal:260,pro:13,fat:14,carb:20},
      '누룽지':{cal:393,pro:7,fat:1,carb:88},
      '꽃빵':{cal:240,pro:7,fat:2,carb:48},
      '춘권피':{cal:310,pro:8,fat:4,carb:62},
      '식용유흡수':{cal:884,pro:0,fat:100,carb:0},
      '소스':{cal:80,pro:1,fat:1,carb:16},
      '라멘육수':{cal:25,pro:2,fat:1,carb:1},
      '닭백탕육수':{cal:45,pro:4,fat:2,carb:1},
      '차슈':{cal:250,pro:18,fat:18,carb:2},
      '멘마':{cal:20,pro:1,fat:0,carb:4},
      '김가루':{cal:35,pro:6,fat:1,carb:4},
      '가쓰오육수':{cal:8,pro:1,fat:0,carb:1},
      '오차즈케육수':{cal:5,pro:0,fat:0,carb:1},
      '하이라이스소스':{cal:105,pro:2,fat:4,carb:15},
      '탄탄면소스':{cal:260,pro:8,fat:20,carb:12},
      '참깨소스':{cal:520,pro:15,fat:45,carb:15},
      '야키소바소스':{cal:95,pro:3,fat:0,carb:21},
      '케첩':{cal:100,pro:1,fat:0,carb:24},
      '토마토케첩':{cal:100,pro:1,fat:0,carb:24},
      '비엔나소시지':{cal:300,pro:12,fat:25,carb:5},
      '피망':{cal:20,pro:1,fat:0,carb:5},
      '숙주':{cal:30,pro:3,fat:0,carb:6},
      '양배추':{cal:25,pro:1,fat:0,carb:6},
      '양파':{cal:40,pro:1,fat:0,carb:9},
      '당근':{cal:41,pro:1,fat:0,carb:10},
      '대파':{cal:32,pro:2,fat:0,carb:7},
      '마늘':{cal:149,pro:6,fat:1,carb:33},
      '간장':{cal:53,pro:8,fat:0,carb:5},
      '미림':{cal:230,pro:0,fat:0,carb:45},
      '설탕':{cal:387,pro:0,fat:0,carb:100},
      '소금':{cal:0,pro:0,fat:0,carb:0},
      '후추':{cal:250,pro:10,fat:3,carb:64},
      '감자':{cal:77,pro:2,fat:0,carb:17},
      '돼지고기':{cal:242,pro:20,fat:17,carb:0},
      '돼지고기등심':{cal:155,pro:22,fat:7,carb:0},
      '닭다리살':{cal:175,pro:18,fat:11,carb:0},
      '닭고기':{cal:158,pro:18,fat:9,carb:0},
      '새우':{cal:85,pro:18,fat:1,carb:1},
      '오징어':{cal:88,pro:18,fat:1,carb:2},
      '조개':{cal:74,pro:13,fat:1,carb:3},
      '연어':{cal:208,pro:20,fat:13,carb:0},
      '참치':{cal:144,pro:23,fat:5,carb:0},
      '흰살생선':{cal:90,pro:18,fat:2,carb:0},
      '계란':{cal:155,pro:13,fat:11,carb:1},
      '숙주나물':{cal:30,pro:3,fat:0,carb:6},
      '표고버섯':{cal:34,pro:2,fat:0,carb:7},
      '죽순':{cal:27,pro:3,fat:0,carb:5},
      '청경채':{cal:13,pro:2,fat:0,carb:2},
      '전분':{cal:381,pro:0,fat:0,carb:91},
      '튀김가루':{cal:360,pro:8,fat:2,carb:76},
      '빵가루':{cal:395,pro:13,fat:5,carb:75},
      '식빵':{cal:260,pro:8,fat:3,carb:48},
      '밀가루':{cal:364,pro:10,fat:1,carb:76},
      '마요네즈':{cal:680,pro:1,fat:75,carb:2},
      '우스터소스':{cal:78,pro:1,fat:0,carb:19},
      '가쓰오부시':{cal:350,pro:75,fat:5,carb:0},
      '김':{cal:35,pro:6,fat:1,carb:4}
    });
    function row(name, styles, ingredients, amounts, tags){
      schema[name]={name:name,styles:styles||['일식'],ingredients:ingredients,cookTime:25,tags:['상업용포션Audit','실제칼로리보정'].concat(tags||[]),servings:1,recipeServings:1,ingredientAmounts:amounts};
      if(window.MENU_DB && window.MENU_DB[name]){
        window.MENU_DB[name].styles=styles||window.MENU_DB[name].styles||[window.MENU_DB[name].style||'일식'];
        window.MENU_DB[name].ingredientIds=ingredients;
        window.MENU_DB[name].ingredientAmounts=amounts;
        window.MENU_DB[name].tags=[...(window.MENU_DB[name].tags||[]),'상업용포션Audit'];
      }
    }
    // 저평가 메뉴 상향: 누락된 핵심 재료/튀김 흡수유/면·빵·누룽지를 명시
    row('고추잡채',['중식'],['돼지고기등심','피망','양파','죽순','표고버섯','간장','굴소스','전분','식용유흡수','꽃빵'],{돼지고기등심:'110g',피망:'80g',양파:'50g',죽순:'40g',표고버섯:'30g',간장:'12g',굴소스:'15g',전분:'8g',식용유흡수:'12g',꽃빵:'80g'},['중식']);
    row('해물누룽지탕',['중식'],['누룽지','새우','오징어','조개','청경채','표고버섯','죽순','전분','식용유흡수','소스'],{누룽지:'80g',새우:'70g',오징어:'60g',조개:'50g',청경채:'60g',표고버섯:'30g',죽순:'30g',전분:'12g',식용유흡수:'8g',소스:'40g'},['중식']);
    row('크림새우',['중식'],['새우','튀김가루','전분','식용유흡수','마요네즈','생크림','설탕'],{새우:'150g',튀김가루:'55g',전분:'15g',식용유흡수:'18g',마요네즈:'35g',생크림:'20g',설탕:'8g'},['중식','튀김']);
    row('멘보샤',['중식'],['식빵','새우','전분','계란','식용유흡수','마요네즈'],{식빵:'80g',새우:'120g',전분:'20g',계란:'25g',식용유흡수:'20g',마요네즈:'15g'},['중식','튀김']);
    row('오향장육',['중식'],['돼지고기','간장','설탕','마늘','대파','소스'],{돼지고기:'180g',간장:'20g',설탕:'8g',마늘:'8g',대파:'20g',소스:'30g'},['중식']);
    row('총유병',['중식'],['밀가루','대파','식용유흡수','참기름','소금'],{밀가루:'70g',대파:'25g',식용유흡수:'12g',참기름:'4g',소금:'1g'},['중식']);
    row('나베',['일식'],['닭고기','두부','배추','버섯','대파','가쓰오육수','간장','미림'],{닭고기:'100g',두부:'100g',배추:'120g',버섯:'70g',대파:'30g',가쓰오육수:'450ml',간장:'15g',미림:'10g'},['일식']);
    row('가라아게',['일식'],['닭다리살','전분','튀김가루','식용유흡수','간장','마늘','생강'],{닭다리살:'160g',전분:'25g',튀김가루:'20g',식용유흡수:'18g',간장:'15g',마늘:'5g',생강:'3g'},['일식','튀김']);
    row('데리야키치킨',['일식'],['닭다리살','간장','미림','설탕','마늘','식용유흡수','밥'],{닭다리살:'160g',간장:'20g',미림:'15g',설탕:'8g',마늘:'5g',식용유흡수:'6g',밥:'120g'},['일식']);
    row('나폴리탄',['일식'],['스파게티','비엔나소시지','양파','피망','케첩','버터','식용유흡수','파마산치즈'],{스파게티:'230g',비엔나소시지:'70g',양파:'60g',피망:'40g',케첩:'55g',버터:'10g',식용유흡수:'5g',파마산치즈:'8g'},['일식']);
    // 고평가 메뉴 하향: 밥/면을 조리 후 1인분 기준으로 조정, 2~3인분 재료 제거
    row('코로케',['일식'],['감자','돼지고기','양파','밀가루','계란','빵가루','식용유흡수'],{감자:'100g',돼지고기:'25g',양파:'20g',밀가루:'10g',계란:'10g',빵가루:'18g',식용유흡수:'8g'},['일식']);
    row('고로케',['일식'],['감자','돼지고기','양파','밀가루','계란','빵가루','식용유흡수'],{감자:'100g',돼지고기:'25g',양파:'20g',밀가루:'10g',계란:'10g',빵가루:'18g',식용유흡수:'8g'},['일식']);
    row('야키소바',['일식'],['야키소바면','돼지고기','양배추','당근','양파','야키소바소스','식용유흡수'],{야키소바면:'170g',돼지고기:'60g',양배추:'80g',당근:'25g',양파:'40g',야키소바소스:'35g',식용유흡수:'8g'},['일식']);
    row('츠케멘',['일식'],['라멘면','차슈','계란','멘마','대파','라멘육수','간장','식용유흡수'],{라멘면:'220g',차슈:'60g',계란:'50g',멘마:'30g',대파:'15g',라멘육수:'250ml',간장:'15g',식용유흡수:'8g'},['일식','라멘']);
    row('가츠동',['일식'],['밥','돈카츠','계란','양파','간장','미림','설탕'],{밥:'190g',돈카츠:'120g',계란:'50g',양파:'60g',간장:'18g',미림:'15g',설탕:'6g'},['일식','덮밥']);
    row('오야코동',['일식'],['밥','닭다리살','계란','양파','간장','미림','설탕'],{밥:'180g',닭다리살:'110g',계란:'60g',양파:'70g',간장:'18g',미림:'15g',설탕:'5g'},['일식','덮밥']);
    row('쇼유라멘',['일식'],['라멘면','차슈','계란','멘마','대파','라멘육수','간장'],{라멘면:'140g',차슈:'45g',계란:'50g',멘마:'25g',대파:'15g',라멘육수:'350ml',간장:'18g'},['일식','라멘']);
    row('오차즈케',['일식'],['밥','연어','김','가쓰오부시','오차즈케육수','간장'],{밥:'160g',연어:'35g',김:'3g',가쓰오부시:'3g',오차즈케육수:'250ml',간장:'8g'},['일식']);
    row('카케소바',['일식'],['소바면','가쓰오육수','간장','미림','대파','김'],{소바면:'220g',가쓰오육수:'350ml',간장:'15g',미림:'10g',대파:'15g',김:'2g'},['일식','소바']);
    row('카케소',['일식'],['소바면','가쓰오육수','간장','미림','대파','김'],{소바면:'220g',가쓰오육수:'350ml',간장:'15g',미림:'10g',대파:'15g',김:'2g'},['일식','소바']);
    row('야키오니기리',['일식'],['밥','간장','미림','김','식용유흡수'],{밥:'140g',간장:'10g',미림:'5g',김:'2g',식용유흡수:'2g'},['일식']);
    row('에비텐',['일식'],['새우','튀김가루','계란','식용유흡수','간장'],{새우:'90g',튀김가루:'35g',계란:'15g',식용유흡수:'12g',간장:'8g'},['일식','튀김']);
    row('부타동',['일식'],['밥','돼지고기','양파','간장','미림','설탕','식용유흡수'],{밥:'190g',돼지고기:'130g',양파:'60g',간장:'18g',미림:'15g',설탕:'6g',식용유흡수:'4g'},['일식','덮밥']);
    row('탄탄면',['일식'],['라멘면','돼지고기','탄탄면소스','숙주','대파','라멘육수','식용유흡수'],{라멘면:'140g',돼지고기:'80g',탄탄면소스:'45g',숙주:'50g',대파:'20g',라멘육수:'300ml',식용유흡수:'5g'},['일식','라멘']);
    row('하이라이스',['일식'],['밥','소고기불고기용','양파','당근','하이라이스소스','식용유흡수'],{밥:'200g',소고기불고기용:'90g',양파:'80g',당근:'40g',하이라이스소스:'120g',식용유흡수:'5g'},['일식','덮밥']);
    row('가이센동',['일식'],['밥','연어','참치','새우','오징어','김','간장','와사비'],{밥:'180g',연어:'50g',참치:'50g',새우:'40g',오징어:'35g',김:'2g',간장:'10g',와사비:'2g'},['일식','덮밥']);
    row('오니기리',['일식'],['밥','김','참치','마요네즈'],{밥:'115g',김:'2g',참치:'20g',마요네즈:'4g'},['일식']);
    row('토리파이탄',['일식'],['라멘면','닭다리살','계란','멘마','대파','닭백탕육수','식용유흡수'],{라멘면:'140g',닭다리살:'90g',계란:'50g',멘마:'25g',대파:'15g',닭백탕육수:'350ml',식용유흡수:'6g'},['일식','라멘']);
    // 제철 표시/문구는 상업 출시 UX에서 제외
    window.getSeasonalIngredients=function(){return [];};
    window.getSeasonalMenus=function(){return [];};
    window.renderSeasonalBadge=function(){return '';};
    window.WM_CALORIE_REAUDIT_ACTUAL_V2={applied:true,menus:Object.keys(schema).filter(function(n){return /고추잡채|해물누룽지탕|크림새우|멘보샤|오향장육|총유병|나베|가라아게|데리야키치킨|나폴리탄|코로케|고로케|야키소바|츠케멘|가츠동|오야코동|쇼유라멘|오차즈케|카케소바|카케소|야키오니기리|에비텐|부타동|탄탄면|하이라이스|가이센동|오니기리|토리파이탄/.test(n);}),note:'실제 MENU_SCHEMA_V2 포션을 교체하여 calcNutrition 결과가 바뀌도록 적용'};
    }catch(e){ }
})();

(function(){
  try{
    if(!window.MENU_DB) return;
    const beforeCount = Object.keys(MENU_DB).length;
    const DUP_ALIAS = {
      // 사용자가 지정한 삭제/통합 목록
      '홍샤오러우':'홍소육',
      '훔무스':'후무스',
      '팟카파오 무쌉':'팟끄라파오무쌉',
      '팟카파오무쌉':'팟끄라파오무쌉',
      '탄탄면':'탄탄면',
      '퀘사디야':'퀘사디야',
      '케사디야':'퀘사디야',
      '카르네 아사다 타코':'카르네아사다',
      '차퀘이테오싱가포르':'차퀘이테오',
      '차퀘이티아오':'차퀘이테오',
      '완탕미싱가포르':'완탕면',
      '오탁오탁':'오타오타',
      '오타오타싱가포르':'오타오타',
      '소고기무국':'소고기뭇국',
      '뿌팟퐁가리':'__DELETE__뿌팟퐁커리',
      '껌승':'껌스엉',

      // 전체 중복 메뉴 표기 정리
      '__DELETE__로건조쉬':'로간조쉬',
      '__DELETE__로건조시':'로간조쉬',
      '마사만커리':'마싸만 커리',
      '달마카니':'달마크니',
      '라르브무':'라브무',
      '라프무':'라브무',
      '록락':'보룩락',
      '로티자나이':'로티차나이',
      '고로케':'코로케',
      '카르보나라':'까르보나라',
      '감바스알아히요':'감바스',
      '쏨땀':'쏨땀',
      '푸팟퐁커리':'__DELETE__뿌팟퐁커리',
      '__DELETE__치라시즈시':'치라시스시',
      '__DELETE__히야시츄카':'히야시추카',
      '__DELETE__코브샐러드':'콥샐러드',
      '쯔케멘':'츠케멘',
      '파에야':'빠에야',
      '__DELETE__포졸레':'포솔레',
      '호켄미':'호키엔미',
      '찐호키엔미':'호키엔미',
      '미고랭말레이':'미고랭',
      '하이난 치킨라이스':'하이난치킨라이스',
      '비프 렌당':'비프렌당',
      '일본식 카레라이스':'일본식카레라이스',
      '오징어먹물 파스타':'오징어먹물파스타',
      '클래식 세비체':'세비체',
      '기로스 피타':'기로스',
      '카케소':'카케소바',
      '탄탄면':'탄탄면'
    };
    const EXACT_DELETE = new Set(['케밥']);

    function norm(s){return String(s||'').replace(/[\s_\-·()]/g,'').toLowerCase();}
    const normAlias={};
    Object.keys(DUP_ALIAS).forEach(k=>{ normAlias[norm(k)] = DUP_ALIAS[k]; });

    function mergeArray(a,b){ return [...new Set([...(a||[]),...(b||[])].filter(Boolean))]; }
    function mergeIngredients(a,b){
      const result=[]; const seen=new Set();
      [...(a||[]),...(b||[])].forEach(x=>{
        const key=(x&&typeof x==='object') ? (x.id||x.name||JSON.stringify(x)) : String(x);
        if(seen.has(key)) return;
        seen.add(key); result.push(x);
      });
      return result;
    }
    function mergeMenu(oldName, newName){
      if(!oldName || !newName || oldName===newName) return false;
      const oldMenu = MENU_DB[oldName];
      if(!oldMenu) return false;
      if(!MENU_DB[newName]){
        MENU_DB[newName] = Object.assign({}, oldMenu, {id:newName, name:newName});
      }else{
        const a=MENU_DB[newName], b=oldMenu;
        a.ingredients = mergeIngredients(a.ingredients, b.ingredients).slice(0,14);
        a.ingredientIds = mergeArray(a.ingredientIds, b.ingredientIds);
        a.styles = mergeArray(a.styles || [a.style], b.styles || [b.style]);
        a.tags = mergeArray(a.tags, b.tags);
        a.style = a.style || b.style || (a.styles&&a.styles[0]);
        a.cookTime = a.cookTime || b.cookTime;
        a.mealRole = a.mealRole || b.mealRole;
        a.category = a.category || b.category;
      }
      delete MENU_DB[oldName];

      if(window.MENU_SCHEMA_V2 && MENU_SCHEMA_V2[oldName]){
        if(!MENU_SCHEMA_V2[newName]) MENU_SCHEMA_V2[newName]=Object.assign({}, MENU_SCHEMA_V2[oldName], {name:newName});
        else{
          const a=MENU_SCHEMA_V2[newName], b=MENU_SCHEMA_V2[oldName];
          a.ingredients = mergeArray(a.ingredients, b.ingredients);
          a.styles = mergeArray(a.styles, b.styles);
          a.tags = mergeArray(a.tags, b.tags);
          a.ingredientAmounts = Object.assign({}, b.ingredientAmounts||{}, a.ingredientAmounts||{});
        }
        delete MENU_SCHEMA_V2[oldName];
      }
      if(window.WM_NUT_V5 && WM_NUT_V5[oldName]){
        if(!WM_NUT_V5[newName]) WM_NUT_V5[newName]=WM_NUT_V5[oldName];
        delete WM_NUT_V5[oldName];
      }
      return true;
    }

    // 1) 명시 삭제
    EXACT_DELETE.forEach(n=>{ if(MENU_DB[n]) delete MENU_DB[n]; if(window.MENU_SCHEMA_V2) delete MENU_SCHEMA_V2[n]; if(window.WM_NUT_V5) delete WM_NUT_V5[n]; });

    // 2) 명시 중복 병합
    Object.keys(DUP_ALIAS).forEach(oldName=>mergeMenu(oldName, DUP_ALIAS[oldName]));

    // 3) 공백/기호만 다른 완전 중복 자동 병합
    const canonicalByNorm={};
    Object.keys(MENU_DB).forEach(name=>{
      const n=norm(name);
      if(!canonicalByNorm[n]) canonicalByNorm[n]=name;
      else mergeMenu(name, canonicalByNorm[n]);
    });

    // 4) 메뉴 그룹/스타일 맵 내 삭제명 참조 정리
    function mapMenuName(x){
      if(!x) return x;
      const raw=String(x);
      const ali=DUP_ALIAS[raw] || normAlias[norm(raw)];
      return ali || raw;
    }
    if(window.MENU_GROUP_DB_V3){
      Object.values(MENU_GROUP_DB_V3).forEach(g=>{
        if(Array.isArray(g.variations)) g.variations=[...new Set(g.variations.map(mapMenuName).filter(n=>MENU_DB[n]))];
      });
    }
    if(window.FLOW_STYLE_MENU_MAP){
      Object.keys(FLOW_STYLE_MENU_MAP).forEach(k=>{
        if(Array.isArray(FLOW_STYLE_MENU_MAP[k])) FLOW_STYLE_MENU_MAP[k]=[...new Set(FLOW_STYLE_MENU_MAP[k].map(mapMenuName).filter(n=>MENU_DB[n]))];
      });
    }

    // 5) 예전 이름으로 들어온 입력/저장값은 canonical으로 해석
    const oldResolve = window.resolveMenu;
    window.resolveMenu = function(name){
      const raw=String(name||'').trim();
      if(!raw) return null;
      const ali = DUP_ALIAS[raw] || normAlias[norm(raw)];
      if(ali && MENU_DB[ali]) return ali;
      if(MENU_DB[raw]) return raw;
      return (typeof oldResolve==='function') ? oldResolve(raw) : null;
    };
    window.flowMenuDBName = function(name){ return window.resolveMenu(name) || name; };

    window.WM_DUPLICATE_MENU_CLEANUP_V6={
      applied:true,
      before:beforeCount,
      after:Object.keys(MENU_DB).length,
      removed:beforeCount-Object.keys(MENU_DB).length,
      aliases:Object.keys(DUP_ALIAS).length,
      deleted:[...EXACT_DELETE]
    };
    }catch(e){ }
})();

(function(){
  try{
    const NAME_MAP = {"가이팟메드마무앙":"까이 팟 맷 마무앙","간고등어구이":"고등어구이","감바스알아히요":"감바스 알 아히요","고아피시커리":"고안 피시 커리","과카몰레":"과카몰리","굴라이 이칸":"굴라이이칸","기로스 피타":"기로스피타","꾸어이티어우":"꾸아이티아오","나시머냑":"나시 미냑","나시짬빌":"나시 참푸르","넴느엉꾸온":"넴느엉 꾸온","넴루이":"넴 루이","논야커리":"뇨냐 커리","니라가":"닐라가","니수아즈 샐러드":"니스와즈 샐러드","니스스타일피자":"니스 스타일 피자","달마카니":"달 마카니","달마크니":"달 마카니","달채소카레":"달 채소 카레","달커리":"달 커리","달타르카":"달 타르카","또르티야에스파뇰라":"토르티야 에스파뇰라","라르브무":"라브 무","라브가이":"라브 가이","라프무":"라브 무","레막캄빙":"르막 캄빙","레바논타울룩":"치킨 타욱","로간조쉬":"로간 조쉬","로모살타도":"로모 살타도","로티자나이":"로티 차나이","로티차나이":"로티 차나이","록락":"보 룩락","리가토니알라보드카":"리가토니 알라 보드카","립아이스테이크":"립아이 스테이크","마삭메라":"마삭 메라","마카니달":"달 마카니","말라이코프타":"말라이 코프타","망고스티키라이스":"망고 스티키 라이스","머제타이스":"무자다라","메르지메크수프":"메르지메크 초르바","멕시코식타말":"타말레","멕시코콩스튜":"멕시코 콩 스튜","명란오니기리":"명란 오니기리","무케카":"모케카","미고랭말레이":"미고랭 말레이","미고렝마막":"미고렝 마막","미네스트로네":"미네스트로네 수프","미폭국수":"미폭","바바가누쉬":"바바 가누쉬","바쿠소":"박소","반보팻짠":"반 보 팟 찬","반팃느엉":"반 팃 느엉","버섯벨루테":"버섯 벨루테","버터세이지뇨키":"버터 세이지 뇨키","병아리콩샐러드":"병아리콩 샐러드","보룩락":"보 룩락","비가탄면":"비가 탄면","비나고나안":"비나고옹안","비프 렌당":"비프렌당","__DELETE__뿌팟퐁커리":"뿌팟퐁 커리","사유르로데":"사유르 로데","사유르아삼":"사유르 아셈","사케미소즈케":"사케 미소즈케","사테아얌":"사테 아얌","사히파니르":"샤히 파니르","살치살스테이크":"살치살 스테이크","삼발우당":"삼발 우당","삼발켄팅":"삼발 켄팅","삼발텀페":"삼발 템페","샨누들":"샨 누들","소토아얌":"소토 아얌","소파데리마":"소파 데 리마","소파데피데오":"소파 데 피데오","소파카스텔야나":"소파 카스텔라나","솔뮈니에르":"솔 뫼니에르","솔얀카":"솔랸카","쉬쉬타북":"쉬쉬 타욱","스페인식오믈렛":"스페인식 오믈렛","슬로피 조":"슬로피조","시오미":"시오라멘","시피오네스앙코아":"치피로네스 엔 수 틴타","쏨땀":"쏨땀","씨씩":"시식","아게다시두부":"아게다시 두부","아고우렐라이오":"앙구렐라이오","아다나케밥":"아다나 케밥","아도봉캉콩":"아도봉 캉콩","아라비아타파스타":"아라비아타 파스타","아루나달":"아루나 달","아르니굽기":"아르니 구브치","아만딘송어":"송어 아망딘","아보카도연어토스트":"아보카도 연어 토스트","아보카도크림파스타":"아보카도 크림 파스타","아브고레모노":"아브골레모노","아삼락사":"아쌈 락사","아삼이칸":"이칸 아삼","아삼프라이드치킨":"아쌈 프라이드 치킨","아얌고랭베렘팍":"아얌 고렝 베렘파","아얌고렝":"아얌 고렝","아얌리카리카":"아얌 리카리카","아얌마삭르막":"아얌 마삭 르막","아얌마삭메라":"아얌 마삭 메라","아얌바카르":"아얌 바카르","아얌페냑":"아얌 페녓","아지후라이":"아지 후라이","아호블랑코":"아호 블랑코","아히데갈리나":"아히 데 가이나","알루고비":"알루 고비","알루파라타":"알루 파라타","알봉디가스":"알본디가스","암리차리컬차":"암리차리 쿨차","암팔라야볶음":"암팔라야 볶음","야채볶음밥":"채소볶음밥","야채죽":"채소죽","야채춘권":"채소춘권","야키오니기리":"야키 오니기리","야키토리덮밥":"야키토리 덮밥","얌마무앙":"얌 마무앙","양저우볶음밥":"양저우 볶음밥","에비후라이":"에비 후라이","오덴":"오뎅","오징어먹물 파스타":"오징어먹물파스타","이맘바이으르디":"이맘 바일드","일본식 카레라이스":"일본식카레라이스","자작크":"자지키","쯔케멘":"츠케멘","찐호키엔미":"호키엔미","차까":"짜까","차이토우콰이":"차이 타우 궤","총유병":"총유빙","카마로네스알라디아블라":"카마로네스 아 라 디아블라","카부르가":"카불리 팔라우","카오니아우마무앙":"카오니아오 마무앙","카오닌무삥":"카오니아오 무삥","카오팟크라파오":"카오팟 끄라파오","카이지아우무쌉":"카이 지아우 무쌉","카인까우아":"깐 까 우아","카케소바":"가케소바","카프타그릴":"카프타 그릴","칸톰카이":"똠 카 카이","케랍아얌":"케랍 아얌","케이마마터":"키마 마타르","코지두 아 포르투게사":"코지두 아 포르투게자","쿠스쿠스로얄":"쿠스쿠스 로얄","크리스피파타":"크리스피 파타","클래식 세비체":"세비체","키쉬로렌":"키슈 로렌","타부크수유":"타북 수유","타쉬쾨프테":"타쉬 쾨프테","터키식필라프":"터키식 필라프","텐푸라우동":"텐푸라 우동","토르탕탈롱":"토르탕 탈롱","토실로그":"토시로그","파낭커리":"파낭 커리","파니르티카":"파니르 티카","파타타스브라바스":"파타타스 브라바스","파파아루가다":"파파스 아루가다스","판싯바하이":"판싯 비혼","팔라크아루":"팔락 알루","팔락파니르":"팔락 파니르","팟끄라파오무쌉":"팟 끄라파오 무쌉","팟팍붕파이댕":"팟 팍붕 파이댕","팟팟카나":"팟 카나","팬니르도피아자":"파니르 도 피아자","포솔레":"포졸레","푸팟퐁커리":"뿌팟퐁 커리","풀포갈레가":"풀포 아 라 가예가","프라이드피타":"프라이드 피타","프렌치어니언수프":"프렌치 어니언 수프","프로방살토마토":"토마토 프로방살","프론미":"프론 미","피나클렛":"피나크벳","피미엔토파드론":"피미엔토 데 파드론","피시볼국":"피시볼 국","피시앤칩스":"피시 앤 칩스","하몬크로케타":"하몬 크로케타","하이난 치킨라이스":"하이난치킨라이스","호켄미":"호키엔미","홍소육":"홍샤오러우","회과육":"후이궈러우","BLT샌드위치":"BLT 샌드위치"};
    const EN_OLD = {"가도가도":"Gado-Gado","가라아게":"Karaage","가스파초":"Gazpacho","가이센동":"Kaisendon","가이팟메드마무앙":"Gai Pad Med Mamuang (Cashew Chicken)","가지나물":"Sautéed Eggplant","가지볶음":"Stir-fried Eggplant","가츠동":"Katsudon","가츠산도":"Katsu Sando","가케우동":"Kake Udon","간고등어구이":"Grilled Salted Mackerel","간장게장":"Soy Sauce Marinated Crab","간장닭날개튀김":"Soy Sauce Fried Chicken Wings","간장비빔소면":"Soy Sauce Bibim Somyeon","간장새우장":"Soy Sauce Marinated Shrimp","간장제육볶음":"Soy Sauce Spicy Pork Stir-fry","간장치킨":"Soy Sauce Chicken","갈비찜":"Braised Short Ribs","갈비탕":"Short Rib Soup","갈치구이":"Grilled Hairtail Fish","갈치조림":"Braised Hairtail Fish","감바스":"Gambas","감바스알아히요":"Gambas al Ajillo","감자국":"Potato Soup","감자그라탕":"Potato Gratin","감자볶음":"Stir-fried Potatoes","감자샐러드":"Potato Salad","감자수제비":"Potato Sujebi (Hand-torn Noodle Soup)","감자전":"Potato Pancake","감자조림":"Braised Potatoes","감자탕":"Pork Bone and Potato Soup","감자튀김":"French Fries","건새우미역무침":"Dried Shrimp and Seaweed Salad","게살볶음밥":"Crab Meat Fried Rice","계란국":"Egg Soup","계란덮밥":"Egg Rice Bowl","계란말이":"Rolled Egg Omelette","계란밥":"Egg Rice","계란볶음밥":"Egg Fried Rice","계란아보카도토스트":"Egg Avocado Toast","계란찜":"Steamed Egg","고등어구이":"Grilled Mackerel","고등어미소조림":"Miso-braised Mackerel","고등어조림":"Braised Mackerel","고등어케밥":"Mackerel Kebab","고로케":"Korokke (Croquette)","고르곤졸라피자":"Gorgonzola Pizza","고사리나물":"Seasoned Bracken Fern","고아피시커리":"Goan Fish Curry","고이가":"Goi Ga (Vietnamese Chicken Salad)","고이꾸온":"Goi Cuon (Fresh Spring Rolls)","고추잡채":"Pepper Japchae","고추장불고기":"Gochujang Bulgogi","고추장삼겹살":"Gochujang Pork Belly","고추장찌개":"Gochujang Stew","골뱅이무침":"Spicy Whelk Salad","곱창볶음":"Stir-fried Beef Intestines","과카몰레":"Guacamole","광동볶음면":"Cantonese Stir-fried Noodles","광동식볶음밥":"Cantonese Fried Rice","광동식탕수육":"Cantonese Sweet and Sour Pork","교자":"Gyoza","군만두":"Pan-fried Dumplings","굴라이 이칸":"Gulai Ikan (Fish Curry)","궁중떡볶이":"Royal Tteokbokki","귀벡":"Güveç (Turkish Casserole)","규나베":"Gyunabe (Beef Hot Pot)","규동":"Gyudon (Beef Rice Bowl)","규카츠":"Gyukatsu (Beef Cutlet)","그라탕":"Gratin","그릭샐러드":"Greek Salad","그릭요거트볼":"Greek Yogurt Bowl","그린커리":"Green Curry","그릴드연어":"Grilled Salmon","기나탕마노크":"Nilagang Manok (Filipino Chicken Soup)","기로스":"Gyros","기로스 피타":"Gyros Pita","김밥":"Gimbap","김치말이국수":"Kimchi Wrapped Noodles","김치볶음밥":"Kimchi Fried Rice","김치수제비":"Kimchi Hand-torn Noodle Soup","김치전":"Kimchi Pancake","김치찌개":"Kimchi Stew","김치찜":"Braised Kimchi","김치찜닭":"Kimchi Braised Chicken","김치콩나물국":"Kimchi Bean Sprout Soup","까르보나라":"Carbonara","깍두기볶음밥":"Kkakdugi Fried Rice","깐쇼새우":"Gan Shao Shrimp","깐풍기":"Gan Pung Chicken","깐풍새우":"Gan Pung Shrimp","깻잎무침":"Seasoned Perilla Leaves","깻잎장아찌":"Pickled Perilla Leaves","껌가":"Cơm gà","껌땀":"Cơm tấm","껌스엉":"Cơm sườn","껌찌엔":"Cơm Chiên","꼬리곰탕":"Oxtail Soup","꽁치김치찌개":"Saury and Kimchi Stew","꽁치조림":"Braised Saury","꽃게탕":"Blue Crab Soup","꽃빵고추잡채":"Flower Bun with Pepper Japchae","꾸어이티어우":"Kuay Teow (Thai Noodle Soup)","꿔바로우":"Guo Bao Rou (Sweet and Sour Pork)","나베":"Nabe (Japanese Hot Pot)","나베야키우동":"Nabeyaki Udon","나시고랭":"Nasi Goreng","나시르막":"Nasi Lemak","나시머냑":"Nasi Minyak (Fragrant Butter Rice)","나시빠당":"Nasi Padang","나시우둑":"Nasi Uduk","나시짬빌":"Nasi Jambal","나초":"Nachos","나폴리탄":"Napolitan (Ketchup Spaghetti)","낙지덮밥":"Spicy Octopus Rice Bowl","낙지볶음":"Stir-fried Spicy Octopus","낙지연포탕":"Octopus Hot Pot","난자완스":"Nanjing Meatballs","냉이된장국":"Shepherd's Purse Doenjang Soup","냉이무침":"Seasoned Shepherd's Purse","너비아니":"Neobiani (Marinated Beef)","넴느엉꾸온":"Nem Nuong Cuon","넴루이":"Nem Lui (Vietnamese Lemongrass Pork Skewers)","녹두전":"Mung Bean Pancake","논야커리":"Nonya Curry","뇨키":"Gnocchi","뇨키토마토":"Gnocchi with Tomato Sauce","느타리버섯볶음":"Stir-fried Oyster Mushrooms","니라가":"Nilaga (Filipino Boiled Beef)","니수아즈 샐러드":"Niçoise Salad","니스스타일피자":"Nice-style Pizza (Pissaladière)","니쿠우동":"Niku Udon (Beef Udon)","니쿠자가":"Nikujaga (Meat and Potato Stew)","다코라이스":"Taco Rice","단호박수프":"Butternut Squash Soup","달마카니":"Dal Makhani","달마크니":"Dal Makhni","달채소카레":"Lentil Vegetable Curry","달커리":"Dal Curry","달타르카":"Dal Tadka","닭가슴살랩":"Chicken Breast Wrap","닭가슴살샐러드":"Chicken Breast Salad","닭가슴살요거트볼":"Chicken Breast Yogurt Bowl","닭가슴살채소볶음":"Chicken Breast and Vegetable Stir-fry","닭가슴살채소볶음밥":"Chicken Breast Vegetable Fried Rice","닭가슴살카레":"Chicken Breast Curry","닭가슴살현미볼":"Chicken Breast Brown Rice Bowl","닭갈비":"Dakgalbi (Spicy Stir-fried Chicken)","닭강정":"Sweet Crispy Fried Chicken","닭개장":"Spicy Chicken Soup","닭고기구이":"Grilled Chicken","닭고기캐슈넛볶음":"Chicken and Cashew Nut Stir-fry","닭곰탕":"Chicken Broth Soup","닭볶음":"Stir-fried Chicken","닭볶음탕":"Braised Spicy Chicken","닭비빔막국수":"Chicken Bibim Makguksu","닭육수면":"Chicken Broth Noodles","닭죽":"Chicken Porridge","닭한마리":"Whole Chicken Hot Pot","대패삼겹살구이":"Thinly Sliced Grilled Pork Belly","더덕구이":"Grilled Deodeok Root","데리야키치킨":"Teriyaki Chicken","도라지무침":"Seasoned Bellflower Root","도사":"Dosa","도토리묵무침":"Seasoned Acorn Jelly","돈지루":"Tonjiru (Pork Miso Soup)","돈카츠":"Tonkatsu (Pork Cutlet)","돈코츠라멘":"Tonkotsu Ramen","돌마데스":"Dolmades","돌솥비빔밥":"Stone Pot Bibimbap","동그랑땡":"Pan-fried Meat and Tofu Patties","동태전":"Pollock Pancake","동태찌개":"Pollock Stew","동파육":"Dongpo Pork (Braised Pork Belly)","돼지갈비찜":"Braised Pork Ribs","돼지고기김치찌개":"Pork and Kimchi Stew","돼지고기깻잎볶음":"Stir-fried Pork with Perilla Leaves","돼지국밥":"Pork Rice Soup","돼지불고기":"Pork Bulgogi","된장비빔밥":"Doenjang Bibimbap","된장삼겹살":"Doenjang Pork Belly","된장찌개":"Doenjang Stew (Fermented Soybean Paste Stew)","두루치기":"Duruchigi (Stir-fried Pork)","두부김치":"Tofu with Kimchi","두부미역국":"Tofu and Seaweed Soup","두부버섯솥밥":"Tofu and Mushroom Pot Rice","두부부침":"Pan-fried Tofu","두부샐러드":"Tofu Salad","두부스크램블에그":"Tofu Scrambled Eggs","두부스테이크":"Tofu Steak","두부스테이크테리야키":"Tofu Steak Teriyaki","두부조림":"Braised Tofu","두부채소볶음":"Tofu and Vegetable Stir-fry","두부포케":"Tofu Poke Bowl","두부현미볼":"Tofu Brown Rice Bowl","들기름막국수":"Perilla Oil Makguksu","들깨미역국":"Perilla Seed and Seaweed Soup","들깨순두부찌개":"Perilla Seed Soft Tofu Stew","들깨칼국수":"Perilla Seed Knife-cut Noodle Soup","등갈비김치찜":"Braised Back Ribs with Kimchi","등갈비찜":"Braised Pork Back Ribs","딤섬":"Dim Sum","떡갈비":"Tteokgalbi (Grilled Meat Patties)","떡국":"Tteokguk (Rice Cake Soup)","떡만두국":"Rice Cake and Dumpling Soup","떡볶이":"Tteokbokki (Spicy Rice Cakes)","또르티야에스파뇰라":"Tortilla Española (Spanish Omelette)","똠얌꿍":"Tom Yum Kung","똠카가이":"Tom Kha Gai","뚝배기불고기":"Ttukbaegi Bulgogi (Hot Pot Bulgogi)","라따뚜이":"Ratatouille","라르브무":"Larb Moo (Thai Spicy Pork Salad)","라볶이":"Rabokki (Ramen and Tteokbokki)","라브가이":"Larb Gai (Thai Spicy Chicken Salad)","라이타":"Raita","라자냐":"Lasagna","라조기":"Laziji (Sichuan Spicy Chicken)","라지마":"Rajma (Red Kidney Bean Curry)","라페토":"Laphet Thoke (Fermented Tea Leaf Salad)","라프무":"Larb Moo","라흐마준":"Lahmacun (Turkish Pizza)","락사":"Laksa","램 코르마":"Lamb Korma","레드커리":"Red Curry","레막캄빙":"Lemak Kambing (Goat Coconut Curry)","레바논타울룩":"Lebanese Tawook","레촌카왈리":"Lechon Kawali (Filipino Crispy Pork)","렌당":"Rendang","렌틸수프":"Lentil Soup","렌틸콩샐러드":"Lentil Salad","로간조쉬":"Rogan Josh","로모살타도":"Lomo Saltado","로미에":"Lomi (Filipino Noodle Soup)","로스트치킨":"Roast Chicken","로제파스타":"Rose Pasta (Creamy Tomato Pasta)","로티자나이":"Roti Janai","로티차나이":"Roti Canai","록락":"Lok Lak (Cambodian Beef)","롱가니사볶음밥":"Longganisa Fried Rice","롱통":"Lontong","룸피아":"Lumpia (Filipino Spring Rolls)","리가토니알라보드카":"Rigatoni alla Vodka","리볼리타":"Ribollita","리조또":"Risotto","립아이스테이크":"Ribeye Steak","마늘새우볶음":"Garlic Shrimp Stir-fry","마늘종볶음":"Stir-fried Garlic Scapes","마라두부":"Mala Tofu","마라라면":"Mala Ramen","마라샹궈":"Mala Xiangguo (Mala Dry Pot)","마라탕":"Mala Tang (Spicy Hot Pot)","마르게리타피자":"Margherita Pizza","마삭메라":"Masak Merah (Red Cooked Chicken)","마싸만 커리":"Massaman Curry","마제소바":"Mazesoba (Mixed Noodles)","마카니달":"Makhani Dal","마카로니샐러드":"Macaroni Salad","마크부스":"Machboos (Spiced Meat and Rice)","마클루베":"Maqluba (Upside-down Rice)","마파가지":"Mapo Eggplant","마파두부":"Mapo Tofu","마파두부덮밥":"Mapo Tofu Rice Bowl","막국수":"Makguksu (Buckwheat Noodles)","만사프":"Mansaf (Jordanian Lamb and Rice)","만트":"Manti (Central Asian Dumplings)","말라이코프타":"Malai Kofta","망고스티키라이스":"Mango Sticky Rice","매시드포테이토":"Mashed Potatoes","매운탕":"Spicy Fish Stew","머제타이스":"Mezedes (Greek Appetizers)","메네멘":"Menemen (Turkish Egg and Tomato)","메르지메크수프":"Mercimek Çorbası (Turkish Lentil Soup)","메밀소바샐러드":"Soba Noodle Salad","메추리알장조림":"Braised Quail Eggs","멕시칸라이스":"Mexican Rice","멕시코식타말":"Tamales","멕시코콩스튜":"Mexican Bean Stew","멘보샤":"Menbosha (Shrimp Toast)","멘치카츠":"Menchi Katsu (Ground Meat Cutlet)","멸치볶음":"Stir-fried Dried Anchovies","명란오니기리":"Mentaiko Onigiri","모야시라멘":"Moyashi Ramen (Bean Sprout Ramen)","모힝가":"Mohinga (Myanmar Fish Noodle Soup)","목살구이":"Grilled Pork Neck","무나물":"Seasoned Radish","무사카":"Moussaka","무생채":"Spicy Radish Salad","무이판":"Mui Fan (Cantonese Sauce Rice)","무자다라":"Mujaddara (Lentil and Rice)","무조림":"Braised Radish","무채국":"Shredded Radish Soup","무케카":"Moqueca (Brazilian Fish Stew)","묵사발":"Muk Sabal (Jelly in Broth)","묵은지등갈비찜":"Braised Back Ribs with Aged Kimchi","묵은지삼겹살":"Aged Kimchi Pork Belly","물냉면":"Mul Naengmyeon (Cold Noodles in Broth)","물만두":"Boiled Dumplings","미고랭":"Mi Goreng","미고랭말레이":"Mee Goreng Mamak","미고렝마막":"Mee Goreng Mamak","미꽝":"Mi Quang (Vietnamese Turmeric Noodles)","미네스트로네":"Minestrone","미소국":"Miso Soup","미소라멘":"Miso Ramen","미소버터라멘":"Miso Butter Ramen","미소시루":"Miso Shiru","미시암":"Mee Siam","미싸오":"Mee Sao (Crispy Noodles)","미역국":"Seaweed Soup","미역냉국":"Cold Seaweed Soup","미역줄기볶음":"Stir-fried Seaweed Stems","미트볼":"Meatballs","미트볼스파게티":"Meatball Spaghetti","미트볼파스타":"Meatball Pasta","미폭국수":"Mi Pok Noodles (Singapore Dry Noodles)","바바가누쉬":"Baba Ganoush","바스틸라":"Bastilla (Moroccan Pigeon Pie)","바오즈":"Baozi (Steamed Buns)","바지락칼국수":"Clam Knife-cut Noodle Soup","바지락탕":"Clam Soup","바질페스토파스타":"Basil Pesto Pasta","바쿠소":"Bak Kut So (Vegetarian Bak Kut Teh)","바쿠테":"Bak Kut Teh (Pork Rib Soup)","박소":"Bak So","반꾸온":"Banh Cuon (Vietnamese Steamed Rice Rolls)","반미":"Banh Mi","반보팻짠":"Banh Bo Phong Chien (Vietnamese Honeycomb Cake)","반쎄오":"Banh Xeo (Vietnamese Sizzling Crepe)","반팃느엉":"Banh Thit Nuong (Vietnamese Grilled Pork Sandwich)","배추된장국":"Napa Cabbage Doenjang Soup","배추전":"Napa Cabbage Pancake","버섯굴소스볶음":"Mushroom and Oyster Sauce Stir-fry","버섯리조또":"Mushroom Risotto","버섯벨루테":"Mushroom Velouté","버섯볶음":"Stir-fried Mushrooms","버섯솥밥":"Mushroom Pot Rice","버섯전":"Mushroom Pancake","버섯크림리조또":"Mushroom Cream Risotto","버터세이지뇨키":"Butter Sage Gnocchi","버터치킨":"Butter Chicken","버터치킨커리":"Butter Chicken Curry","베이징덕":"Peking Duck","베이컨에그스크램블":"Bacon and Egg Scramble","병아리콩샐러드":"Chickpea Salad","보렉":"Börek (Turkish Pastry)","보룩락":"Bò Lúc Lắc (Vietnamese Shaking Beef)","보비아":"Bo Bia (Vietnamese Rice Paper Rolls)","보쌈":"Bossam (Steamed Pork Wraps)","보코":"Boko","볶음짬뽕":"Stir-fried Jjamppong","볼로네제파스타":"Bolognese Pasta","봉골레파스타":"Vongole Pasta (Clam Pasta)","뵈프엔다우브":"Boeuf en Daube (French Beef Stew)","부대찌개":"Budae Jjigae (Army Stew)","부리또":"Burrito","부야베스":"Bouillabaisse","부채살스테이크":"Flat Iron Steak","부추계란볶음":"Chive and Egg Stir-fry","부추김치":"Chive Kimchi","부추전":"Chive Pancake","부타네기야키":"Buta Negi Yaki (Pork and Green Onion Grill)","부타네기폰즈":"Buta Negi Ponzu","부타동":"Butadon (Pork Rice Bowl)","부타카쿠니":"Buta Kakuni (Braised Pork Belly)","부타킴치":"Buta Kimchi (Pork and Kimchi Stir-fry)","북어국":"Dried Pollack Soup","북어무침":"Seasoned Dried Pollack","북어해장국":"Dried Pollack Hangover Soup","분보후에":"Bun Bo Hue (Spicy Beef Noodle Soup)","분짜":"Bun Cha (Vietnamese Grilled Pork Noodles)","분팃느엉":"Bun Thit Nuong (Grilled Pork Noodle Bowl)","불고기덮밥":"Bulgogi Rice Bowl","불고기전골":"Bulgogi Hot Pot","불라로":"Bulalo (Filipino Bone Marrow Soup)","브로콜리두부무침":"Broccoli and Tofu Salad","브로콜리치즈수프":"Broccoli Cheese Soup","브루스케타":"Bruschetta","브리암":"Briam (Greek Roasted Vegetables)","블랙페퍼크랩":"Black Pepper Crab","비가탄면":"Binatog (Filipino Corn Snack)","비나고나안":"Binagooonaan (Filipino Pork in Shrimp Paste)","비리야니":"Biryani","비빔국수":"Bibim Guksu (Spicy Mixed Noodles)","비빔냉면":"Bibim Naengmyeon (Spicy Cold Noodles)","비빔밥":"Bibimbap","비지찌개":"Biji Jjigae (Soybean Pulp Stew)","비콜익스프레스":"Bicol Express","비트샐러드":"Beet Salad","비프 렌당":"Beef Rendang","비프부르기뇽":"Boeuf Bourguignon","비프스튜":"Beef Stew","비프웰링턴":"Beef Wellington","비프타코":"Beef Taco","빈달루":"Vindaloo","빈대떡":"Bindaetteok (Mung Bean Pancake)","빠에야":"Paella","__DELETE__뿌팟퐁커리":"Poo Pad Pong Curry","사르수엘라":"Zarzuela (Spanish Seafood Stew)","사모사":"Samosa","사바미소니":"Saba Misoni (Mackerel Simmered in Miso)","사유르로데":"Sayur Lodeh (Vegetable Coconut Milk Soup)","사유르아삼":"Sayur Asam (Tamarind Vegetable Soup)","사케동":"Sake Don (Salmon Rice Bowl)","사케미소즈케":"Sake Miso Zuke (Miso-marinated Salmon)","사테아얌":"Satay Ayam (Chicken Satay)","사히파니르":"Saag Paneer","산채비빔밥":"Wild Greens Bibimbap","살모레호":"Salmorejo","살사소스":"Salsa Sauce","살치살스테이크":"Skirt Steak","살팀보카":"Saltimbocca","삼겹살구이":"Grilled Pork Belly (Samgyeopsal)","삼겹살김치찜":"Braised Pork Belly with Kimchi","삼계탕":"Samgyetang (Ginseng Chicken Soup)","삼발새우":"Sambal Shrimp","삼발우당":"Sambal Udang","삼발켄팅":"Sambal Kentang (Potato Sambal)","삼발텀페":"Sambal Tempeh","삼선볶음밥":"Three Delicacies Fried Rice","삼치구이":"Grilled Spanish Mackerel","삼치조림":"Braised Spanish Mackerel","새우마살라":"Prawn Masala","새우볶음밥":"Shrimp Fried Rice","새우완탕":"Shrimp Wonton","새우완탕면":"Shrimp Wonton Noodles","샌드위치":"Sandwich","생선국수":"Fish Noodle Soup","샤브샤브":"Shabu-Shabu","샤오롱바오":"Xiaolongbao (Soup Dumplings)","샤와르마":"Shawarma","샥슈카":"Shakshuka","샨누들":"Shan Noodles (Myanmar)","설렁탕":"Seolleongtang (Ox Bone Soup)","세비체":"Ceviche","소갈비구이":"Grilled Beef Short Ribs","소고기덮밥":"Beef Rice Bowl","소고기뭇국":"Beef and Radish Soup","소고기미역국":"Beef Seaweed Soup","소고기볶음":"Stir-fried Beef","소고기브로콜리볶음":"Beef and Broccoli Stir-fry","소고기장조림":"Soy-braised Beef","소고기죽":"Beef Porridge","소불고기":"Beef Bulgogi","소토아얌":"Soto Ayam (Indonesian Chicken Soup)","소파데리마":"Sopa de Lima (Mexican Lime Soup)","소파데피데오":"Sopa de Fideo (Mexican Noodle Soup)","소파카스텔야나":"Sopa Castellana (Spanish Garlic Soup)","솔뮈니에르":"Sole Meunière","솔얀카":"Solyanka (Russian Sour Soup)","쏨땀":"Som Tam (Green Papaya Salad)","쇼유라멘":"Shoyu Ramen","수블라키":"Souvlaki","수육":"Suyuk (Boiled Pork Slices)","수제비":"Sujebi (Hand-torn Noodle Soup)","수프카레":"Soup Curry","숙주나물":"Seasoned Bean Sprouts","순대국밥":"Sundae Gukbap (Blood Sausage Rice Soup)","순대볶음":"Stir-fried Sundae","순댓국":"Sundaeguk (Blood Sausage Soup)","순두부찌개":"Sundubu Jjigae (Soft Tofu Stew)","쉬쉬타북":"Shish Taouk (Lebanese Chicken Skewers)","슈마이":"Shumai","스코르달리아":"Skordalia (Greek Garlic Sauce)","스크램블에그":"Scrambled Eggs","스키야키":"Sukiyaki","스테이크":"Steak","스티파도":"Stifado (Greek Beef Stew)","스팀보트":"Steamboat (Hot Pot)","스파나코리조":"Spanakorizo (Greek Spinach Rice)","스파나코피타":"Spanakopita (Greek Spinach Pie)","스팸마요덮밥":"Spam Mayo Rice Bowl","스페인식오믈렛":"Spanish Omelette","슬로피 조":"Sloppy Joe","시금치나물":"Seasoned Spinach","시금치된장국":"Spinach Doenjang Soup","시니강":"Sinigang (Filipino Sour Soup)","시래기국":"Dried Radish Greens Soup","시오라멘":"Shio Ramen (Salt Ramen)","시오미":"Shiomi (Salt-flavored)","시저랩":"Caesar Wrap","시저샐러드":"Caesar Salad","시칠리아파스타":"Sicilian Pasta","시피오네스앙코아":"Chipirones en su Tinta (Squid in Ink)","싱가포르락사":"Singapore Laksa","싱가포르사테":"Singapore Satay","싱가포르죽":"Singapore Porridge","쌀국수":"Pho (Vietnamese Rice Noodle Soup)","쌀국수볶음":"Stir-fried Rice Noodles","쌈밥":"Ssambap (Wrap Rice)","쏨땀":"Som Tam (Green Papaya Salad)","쑥된장국":"Mugwort Doenjang Soup","씨씩":"Sic Sic (Uighur Lamb Dish)","아게다시두부":"Agedashi Tofu","아고우렐라이오":"Agourélado (Greek Olive Oil Dish)","아귀찜":"Braised Monkfish","아다나케밥":"Adana Kebab","아도봉캉콩":"Adobong Kangkong (Filipino Water Spinach)","아라비아타파스타":"Arrabbiata Pasta","아루나달":"Aruna Dal","아르니굽기":"Arni Psito (Greek Roast Lamb)","아마트리치아나":"Amatriciana","아만딘송어":"Trout Almondine","아목트레이":"Amok Trei (Cambodian Fish Curry)","아보카도샐러드":"Avocado Salad","아보카도연어토스트":"Avocado Salmon Toast","아보카도크림파스타":"Avocado Cream Pasta","아보카도토스트":"Avocado Toast","아브고레모노":"Avgolemono (Greek Egg-Lemon Soup)","아삼락사":"Asam Laksa","아삼이칸":"Asam Ikan (Tamarind Fish)","아삼프라이드치킨":"Asam Fried Chicken","아얌고랭베렘팍":"Ayam Goreng Berempah (Spiced Fried Chicken)","아얌고렝":"Ayam Goreng (Malaysian Fried Chicken)","아얌리카리카":"Ayam Rica-Rica (Spicy Chicken)","아얌마삭르막":"Ayam Masak Lemak (Chicken in Coconut Milk)","아얌마삭메라":"Ayam Masak Merah (Red Cooked Chicken)","아얌바카르":"Ayam Bakar (Grilled Chicken)","아얌세리":"Ayam Seri","아얌페냑":"Ayam Penyet (Smashed Fried Chicken)","아욱국":"Mallow Soup","아이리시스튜":"Irish Stew","아지후라이":"Aji Furai (Fried Horse Mackerel)","아쿠아파차":"Acqua Pazza (Italian Poached Fish)","아프리타다":"Afritada (Filipino Chicken Stew)","아호블랑코":"Ajo Blanco (Spanish White Gazpacho)","아히데갈리나":"Aji de Gallina (Peruvian Creamy Chicken)","안심스테이크":"Tenderloin Steak","알루고비":"Aloo Gobi (Potato and Cauliflower)","알루파라타":"Aloo Paratha","알리오올리오":"Aglio e Olio","알봉디가스":"Albondigas (Spanish Meatballs)","알탕":"Spicy Pollock Roe Soup","암리차리컬차":"Amritsari Kulcha","암팔라야볶음":"Ampalaya Stir-fry (Bitter Melon)","애호박볶음":"Stir-fried Zucchini","야채볶음밥":"Vegetable Fried Rice","야채죽":"Vegetable Porridge","야채춘권":"Vegetable Spring Rolls","야키소바":"Yakisoba","야키오니기리":"Yaki Onigiri (Grilled Rice Ball)","야키우동":"Yaki Udon (Stir-fried Udon)","야키토리":"Yakitori","야키토리덮밥":"Yakitori Rice Bowl","약밥":"Yakbap (Sweet Rice)","얌느아":"Yam Nua (Thai Beef Salad)","얌마무앙":"Yam Mamuang (Mango Salad)","얌운센":"Yam Woon Sen (Glass Noodle Salad)","얌탈레":"Yam Talay (Thai Seafood Salad)","양념치킨":"Yangnyeom Chicken (Korean Spicy Fried Chicken)","양배추쌈":"Cabbage Wrap","양배추참치덮밥":"Cabbage and Tuna Rice Bowl","양송이수프":"Cream of Mushroom Soup","양장피":"Yangjangpi (Jellyfish and Vegetable Salad)","양저우볶음밥":"Yangzhou Fried Rice","양파수프":"Onion Soup","어묵국":"Fish Cake Soup","어묵볶음":"Stir-fried Fish Cakes","어묵탕":"Fish Cake Hot Pot","어향가지":"Yuxiang Eggplant","어향육사":"Yuxiang Shredded Pork","에그베네딕트":"Eggs Benedict","에그샌드위치":"Egg Sandwich","에그토스트":"Egg Toast","에비마요":"Ebi Mayo (Shrimp Mayonnaise)","에비텐동":"Ebi Tendon (Shrimp Tempura Rice Bowl)","에비후라이":"Ebi Furai (Fried Shrimp)","에스카베체":"Escabeche (Pickled Fish)","엔칠라다":"Enchilada","엠파나다":"Empanada","연근조림":"Braised Lotus Root","연어구이":"Grilled Salmon","연어데리야키":"Salmon Teriyaki","연어샐러드":"Salmon Salad","연어스테이크":"Salmon Steak","연어아보카도볼":"Salmon Avocado Bowl","연어아보카도포케":"Salmon Avocado Poke Bowl","연어초밥":"Salmon Sushi","연어포케":"Salmon Poke Bowl","연포탕":"Yeonpo Tang (Soft Octopus Soup)","열무국수":"Young Radish Noodles","열무냉면":"Young Radish Cold Noodles","열무비빔밥":"Young Radish Bibimbap","영양솥밥":"Nutritious Pot Rice","오니기리":"Onigiri (Rice Ball)","오덴":"Oden","오리주물럭":"Spicy Duck Stir-fry","오므라이스":"Omurice (Omelette Rice)","오믈렛":"Omelette","오버나이트오트밀":"Overnight Oatmeal","오삼불고기":"Spicy Pork and Squid Stir-fry","오소부코":"Osso Buco","오야코동":"Oyakodon (Chicken and Egg Rice Bowl)","오야코우동":"Oyako Udon","오이냉국":"Cold Cucumber Soup","오이무침":"Seasoned Cucumber","오이소박이":"Cucumber Kimchi","오이지무침":"Seasoned Pickled Cucumber","오징어덮밥":"Squid Rice Bowl","오징어먹물 파스타":"Squid Ink Pasta","오징어무국":"Squid and Radish Soup","오징어볶음":"Stir-fried Spicy Squid","오징어채볶음":"Stir-fried Dried Squid Strips","오차즈케":"Ochazuke (Tea Rice)","오코노미야키":"Okonomiyaki (Japanese Savory Pancake)","오타오타":"Otak-Otak (Grilled Fish Cake)","오트밀":"Oatmeal","오포르아얌":"Opor Ayam (Chicken in Coconut Milk)","오향장육":"Five-spice Braised Pork","와플":"Waffle","완탕면":"Wonton Noodles","완탕탕":"Wonton Soup","우거지갈비찜":"Braised Ribs with Dried Cabbage","우거지해장국":"Dried Cabbage Hangover Soup","우렁된장찌개":"Freshwater Snail Doenjang Stew","우엉조림":"Braised Burdock Root","우육면":"Beef Noodle Soup","월남쌈":"Vietnamese Spring Rolls","유도후":"Yudofu (Simmered Tofu)","유린기":"Yuringi (Chinese-style Fried Chicken)","유부우동":"Kitsune Udon (Tofu Pouch Udon)","유부초밥":"Inari Sushi","유산슬":"Yusanseul (Seafood and Vegetable Stir-fry)","육개장":"Yukgaejang (Spicy Beef Soup)","육전":"Yukjeon (Pan-fried Beef)","육회비빔밥":"Yukhoe Bibimbap (Raw Beef Bibimbap)","이나리초밥":"Inari Sushi","이나살":"Inasal (Filipino Grilled Chicken)","이맘바이으르디":"İmam Bayıldı (Stuffed Eggplant)","이스켄데르케밥":"İskender Kebab","이시카리나베":"Ishikari Nabe (Salmon Hot Pot)","이즈미르쾨프테":"İzmir Köfte","이칸고랭":"Ikan Goreng (Fried Fish)","이칸마살라":"Ikan Masala (Fish Masala)","이칸바카르":"Ikan Bakar (Grilled Fish)","이칸아삼":"Ikan Asam (Tamarind Fish)","이칸페프리":"Ikan Peperi (Peppered Fish)","일본식 카레라이스":"Japanese Curry Rice","일본식계란말이":"Japanese Rolled Egg (Tamagoyaki)","자루소바":"Zaru Soba (Cold Soba Noodles)","자작크":"Zazak","잔치국수":"Janchi Guksu (Festive Noodle Soup)","잠발라야":"Jambalaya","잡곡밥":"Multigrain Rice","잡채":"Japchae (Glass Noodles with Vegetables)","잡채밥":"Japchae Rice Bowl","잡채볶음밥":"Japchae Fried Rice","장어구이":"Grilled Eel","장조림":"Soy-braised Beef","장조림버터비빔밥":"Soy-braised Beef Butter Bibimbap","장칼국수":"Doenjang Knife-cut Noodle Soup","장터국수":"Market-style Noodle Soup","쟁반국수":"Tray Noodles","전복미역국":"Abalone and Seaweed Soup","전복죽":"Abalone Porridge","제육볶음":"Jeyuk Bokkeum (Spicy Pork Stir-fry)","조개탕":"Clam Soup","조기구이":"Grilled Yellow Corvina","족발냉채":"Cold Pig's Trotters","주꾸미볶음":"Stir-fried Baby Octopus","주먹밥":"Jumeokbap (Rice Ball)","중식만두전골":"Chinese-style Dumpling Hot Pot","중식오이냉채":"Chinese-style Cold Cucumber","지삼선":"Di San Xian (Potato","진미채무침":"Seasoned Dried Squid Strips","짜장면":"Jjajangmyeon (Black Bean Noodles)","짜장밥":"Jjajang Rice","짜조":"Cha Gio (Vietnamese Fried Spring Rolls)","짬뽕":"Jjamppong (Spicy Seafood Noodle Soup)","쫄면":"Jjolmyeon (Chewy Spicy Noodles)","쭈꾸미볶음밥":"Spicy Baby Octopus Fried Rice","쭈꾸미삼겹살":"Baby Octopus and Pork Belly","쯔케멘":"Tsukemen (Dipping Ramen)","찐호키엔미":"Zha Hokkien Mee","찜닭":"Jjimdak (Braised Chicken)","차까":"Chaaka","차나마살라":"Chana Masala","차돌된장찌개":"Beef Brisket Doenjang Stew","차돌박이숙주볶음":"Beef Brisket and Bean Sprout Stir-fry","차슈":"Chashu (Braised Pork)","차오멘":"Chow Mein","차완무시":"Chawanmushi (Japanese Steamed Egg Custard)","차우파":"Chaufa (Peruvian Fried Rice)","차이토우콰이":"Chai Tow Kway (Radish Cake)","차조":"Chamjo (Millet and Porridge)","차지키":"Tzatziki","차퀘이테오":"Char Kway Teow","참나물무침":"Seasoned Chammnamul (Wild Parsley)","참치김밥":"Tuna Gimbap","참치김치볶음밥":"Tuna and Kimchi Fried Rice","참치김치찌개":"Tuna and Kimchi Stew","참치마요덮밥":"Tuna Mayo Rice Bowl","참치마요오니기리":"Tuna Mayo Onigiri","참치채소샐러드":"Tuna and Vegetable Salad","참치포케":"Tuna Poke Bowl","참치회비빔밥":"Fresh Tuna Bibimbap","찹스테이크":"Chop Steak","채끝스테이크":"Sirloin Steak","채소달걀국":"Vegetable and Egg Soup","채소커리":"Vegetable Curry","청경채굴소스볶음":"Bok Choy with Oyster Sauce","청경채두부볶음":"Bok Choy and Tofu Stir-fry","청경채볶음":"Stir-fried Bok Choy","청국장찌개":"Cheonggukjang Jjigae (Fermented Soybean Stew)","체가이볶음면":"Che Kai Stir-fried Noodles","초리소와인조림":"Chorizo Wine Braise","총유병":"Cong You Bing (Scallion Pancake)","추어탕":"Chueo Tang (Loach Soup)","충무김밥":"Chungmu Gimbap","취나물":"Seasoned Chwi Namul","취나물무침":"Seasoned Chwi Namul","츠케멘":"Tsukemen (Dipping Ramen)","__DELETE__치라시즈시":"Chirashi Sushi","치미창가":"Chimichanga","치즈닭갈비":"Cheese Dakgalbi","치즈버거":"Cheeseburger","치킨그라탕":"Chicken Gratin","치킨난반":"Chicken Nanban","치킨누들수프":"Chicken Noodle Soup","치킨두피아자":"Chicken Do Pyaza","치킨몰레":"Chicken Mole","치킨발티":"Chicken Balti","치킨버거":"Chicken Burger","치킨부리토":"Chicken Burrito","치킨빈달루":"Chicken Vindaloo","치킨샐러드":"Chicken Salad","치킨샤와르마랩":"Chicken Shawarma Wrap","치킨수프":"Chicken Soup","치킨스테이크":"Chicken Steak","치킨스튜":"Chicken Stew","치킨시저랩":"Chicken Caesar Wrap","치킨아도보":"Chicken Adobo","치킨이나살":"Chicken Inasal","치킨카츠":"Chicken Katsu","치킨카치아토라":"Chicken Cacciatore","치킨커리말레이":"Malaysian Chicken Curry","치킨케밥":"Chicken Kebab","치킨코르마":"Chicken Korma","치킨콥샐러드":"Chicken Cobb Salad","치킨타진":"Chicken Tagine","치킨타코":"Chicken Taco","치킨티카마살라":"Chicken Tikka Masala","치킨파히타":"Chicken Fajita","치킨팟파이":"Chicken Pot Pie","칠레레예노":"Chile Relleno","칠레아도보":"Chile Adobo","칠레콘카르네":"Chili con Carne","칠리새우":"Chili Shrimp","칠리콘카르네":"Chili con Carne","칠리크랩":"Chilli Crab","칡냉면":"Arrowroot Cold Noodles","카니돈부리":"Kani Donburi (Crab Rice Bowl)","카레라이스":"Curry Rice","카레우동":"Curry Udon","카레카레":"Kare-Kare (Filipino Peanut Stew)","카르네아사다":"Carne Asada","카르니야르크":"Karnıyarık (Stuffed Eggplant)","카르보나라":"Carbonara","카마로네스알라디아블라":"Camarones a la Diabla","카부르가":"Kaburga (Turkish Lamb Ribs)","카술레":"Cassoulet","카야토스트":"Kaya Toast","카오니아오":"Khao Niao (Sticky Rice)","카오니아우마무앙":"Khao Niao Mamuang (Mango Sticky Rice)","카오닌무삥":"Khao Niao Mu Ping (Grilled Pork with Sticky Rice)","카오만가이":"Khao Man Gai (Thai Chicken Rice)","카오무댕":"Khao Mu Daeng (Red Pork Rice)","카오소이":"Khao Soi","카오카무":"Khao Kha Mu (Thai Braised Pork Leg Rice)","카오팟":"Khao Pad (Thai Fried Rice)","카오팟꿍":"Khao Pad Kung (Shrimp Fried Rice)","카오팟크라파오":"Khao Pad Krapao","카이지아우무쌉":"Khai Jiao Mu Sap (Thai Minced Pork Omelette)","카인까우아":"Canh Chua (Vietnamese Sour Soup)","카케소바":"Kake Soba","카키아게":"Kakiage (Mixed Tempura)","카포나타":"Caponata","카프레제샐러드":"Caprese Salad","카프타그릴":"Kafta Grill (Lebanese Meatball Skewer)","칸톰카이":"Khanom Khai (Thai Steamed Egg)","칼국수":"Kalguksu (Knife-cut Noodle Soup)","칼데레타":"Caldereta (Filipino Beef Stew)","칼데이라다":"Caldeirada (Portuguese Fish Stew)","캅카이":"Khap Kai","캐롯케이크":"Carrot Cake","커리치킨반미":"Curry Chicken Banh Mi","케랄라새우커리":"Kerala Prawn Curry","케랍아얌":"Kerabu Ayam (Malaysian Chicken Salad)","케이마마터":"Keema Matar (Minced Meat and Peas)","케프타 타진":"Kefta Tagine","코다리조림":"Braised Semi-dried Pollock","코로케":"Korokke (Croquette)","코시도":"Cocido (Spanish Chickpea Stew)","코울슬로":"Coleslaw","코지두 아 포르투게사":"Cozido à Portuguesa","코코뱅":"Coq au Vin","코프타 케밥":"Kofta Kebab","코프테":"Köfte (Turkish Meatballs)","콘치즈":"Corn Cheese","콥샐러드":"Cobb Salad","콩국수":"Kong Guksu (Cold Soy Milk Noodles)","콩나물국":"Bean Sprout Soup","콩나물국밥":"Bean Sprout Rice Soup","콩나물냉국수":"Cold Bean Sprout Noodles","콩나물무침":"Seasoned Bean Sprouts","콩나물밥":"Bean Sprout Rice","콩나물해장국":"Bean Sprout Hangover Soup","콩비지찌개":"Soybean Pulp Stew","쾨프테":"Köfte","쿠르제트수프":"Courgette Soup (Zucchini Soup)","쿠스쿠스":"Couscous","쿠스쿠스로얄":"Couscous Royal","쿵파오치킨":"Kung Pao Chicken","퀘사디야":"Quesadilla","퀴노아채소볼":"Quinoa Vegetable Bowl","크레프":"Crêpe","크로크무슈":"Croque Monsieur","크리스피파타":"Crispy Pata (Filipino Crispy Pork Knuckle)","크림브로콜리수프":"Cream of Broccoli Soup","크림새우":"Creamy Shrimp","크림소스연어":"Salmon in Cream Sauce","크림수프":"Cream Soup","크림파스타":"Cream Pasta","크메르레드커리":"Khmer Red Curry","클래식 세비체":"Classic Ceviche","클램차우더":"Clam Chowder","클럽샌드위치":"Club Sandwich","클레프티코":"Kleftiko (Greek Slow-roasted Lamb)","키마커리":"Keema Curry","키베":"Kibbeh","키쉬로렌":"Quiche Lorraine","키츠네우동":"Kitsune Udon (Fox Udon)","킬라윈":"Kinilaw (Filipino Ceviche)","타마고산도":"Tamago Sando (Egg Sandwich)","타말레":"Tamale","타부크수유":"Tabbouleh","타불레":"Tabbouleh","타쉬쾨프테":"Taş Köfte","타코":"Taco","타코야키":"Takoyaki (Octopus Balls)","탄두리연어":"Tandoori Salmon","탄두리치킨":"Tandoori Chicken","탄탄면":"Dan Dan Noodles","탕수육":"Tangsuyuk (Sweet and Sour Pork)","터키식필라프":"Turkish Pilaf","텐동":"Tendon (Tempura Rice Bowl)","텐푸라우동":"Tempura Udon","템페고랭":"Tempe Goreng (Fried Tempeh)","토르탕탈롱":"Tortang Talong (Filipino Eggplant Omelette)","토르티야수프":"Tortilla Soup","토리파이탄":"Tori Paitan (Chicken Broth Ramen)","토마토계란볶음":"Tomato and Egg Stir-fry","토마토달걀볶음":"Tomato and Egg Stir-fry","토마토달걀수프":"Tomato and Egg Soup","토마토브루스케타":"Tomato Bruschetta","토마토수프":"Tomato Soup","토마토파스타":"Tomato Pasta","토마호크스테이크":"Tomahawk Steak","토스타다":"Tostada","토실로그":"Tosilog (Filipino Tocino","튜나샌드위치":"Tuna Sandwich","티놀라":"Tinola (Filipino Chicken Soup)","티로피타":"Tiropita (Greek Cheese Pie)","티본스테이크":"T-bone Steak","파기름파스타":"Scallion Oil Pasta","파낭커리":"Panang Curry","파니르티카":"Paneer Tikka","파르망티에":"Parmentier (French Shepherd's Pie)","파소울라다":"Fasolada (Greek Bean Soup)","파스티치오":"Pastitsio (Greek Baked Pasta)","파에야":"Paella","파인애플볶음밥":"Pineapple Fried Rice","파전":"Pajeon (Scallion Pancake)","파코라":"Pakora","파타타스브라바스":"Patatas Bravas","파투쉬":"Fattoush","파파아루가다":"Papa a la Huancaína (Peruvian Potato)","판싯":"Pancit (Filipino Noodles)","판싯바하이":"Pancit Bihay","판싯칸톤":"Pancit Canton","팔라크아루":"Palak Aloo (Spinach and Potato)","팔라펠":"Falafel","팔락파니르":"Palak Paneer","팔보채":"Palbochae (Eight Treasure Stir-fry)","팟끄라파오무쌉":"Pad Krapao Mu Sap (Thai Basil Minced Pork)","팟나":"Pad Na (Thai Sauce Noodles)","팟씨유":"Pad See Ew","팟타이":"Pad Thai","팟팍붕파이댕":"Pad Pak Bung Fai Daeng (Stir-fried Morning Glory)","팟팟카나":"Pad Pak Khana (Stir-fried Chinese Broccoli)","팟프리킹":"Pad Prik King (Dry Red Curry Stir-fry)","팥죽":"Patjuk (Red Bean Porridge)","팬니르도피아자":"Paneer Do Pyaza","팬케이크":"Pancake","팽이버섯볶음":"Stir-fried Enoki Mushrooms","팽이버섯전골":"Enoki Mushroom Hot Pot","퍼가":"Pho Ga (Vietnamese Chicken Noodle Soup)","퍼싸오":"Pho Xao (Stir-fried Pho Noodles)","페센베크":"Fesenjān (Persian Walnut and Pomegranate Stew)","페스토파스타":"Pesto Pasta","페퍼로니피자":"Pepperoni Pizza","평양냉면":"Pyongyang Naengmyeon (Cold Noodles)","포솔레":"Pozole","__DELETE__포졸레":"Pozole","포카치아":"Focaccia","포케":"Poke Bowl","포크시시그":"Pork Sisig","포크아도보":"Pork Adobo","포터하우스스테이크":"Porterhouse Steak","폴렌타":"Polenta","폴포살라다":"Polpo Salada (Octopus Salad)","푸팟퐁커리":"Poo Pad Pong Curry","풀드포크":"Pulled Pork","풀포갈레가":"Pulpo a la Gallega (Galician Octopus)","프라이드피타":"Fried Pita","프렌치어니언수프":"French Onion Soup","프렌치토스트":"French Toast","프로방살토마토":"Provençal Tomatoes","프론미":"Prawn Mee (Shrimp Noodle Soup)","프리타타":"Frittata","피나클렛":"Pinakbet (Filipino Vegetable Stew)","피단두부무침":"Century Egg and Tofu","피데":"Pide (Turkish Flatbread Pizza)","피미엔토파드론":"Pimientos de Padrón","피시볼국":"Fish Ball Soup","피시앤칩스":"Fish and Chips","피시타코":"Fish Taco","피시헤드커리":"Fish Head Curry","하리라":"Harira (Moroccan Lamb Soup)","하몬크로케타":"Jamón Croqueta (Ham Croquette)","하이난 치킨라이스":"Hainanese Chicken Rice","하이라이스":"Hayashi Rice","할루미구이":"Grilled Halloumi","함박스테이크":"Hambak Steak (Japanese-style Hamburger Steak)","함흥냉면":"Hamheung Naengmyeon (Cold Noodles)","해물누룽지탕":"Seafood Scorched Rice Soup","해물순두부찌개":"Seafood Soft Tofu Stew","해물잡채":"Seafood Japchae","해물전골":"Seafood Hot Pot","해물파전":"Seafood Scallion Pancake","해산물리조또":"Seafood Risotto","해산물파스타":"Seafood Pasta","해파리냉채":"Cold Jellyfish Salad","햄버거":"Hamburger","현미채소덮밥":"Brown Rice Vegetable Bowl","현미채소볶음밥":"Brown Rice Vegetable Fried Rice","호르타":"Horta (Greek Boiled Greens)","호박나물":"Seasoned Zucchini","호박전":"Zucchini Pancake","호박죽":"Pumpkin Porridge","호켄미":"Hokkien Mee","호키엔미":"Hokkien Mee","홍소육":"Red-braised Pork","홍합탕":"Mussel Soup","황기닭백숙":"Astragalus Chicken Soup","황태구이":"Grilled Dried Pollack","황태국":"Dried Pollack Soup","황태해장국":"Dried Pollack Hangover Soup","회과육":"Twice-cooked Pork (Huiguorou)","회냉면":"Raw Fish Cold Noodles","후무스":"Hummus","훈제연어파스타":"Smoked Salmon Pasta","훈제오리볶음":"Stir-fried Smoked Duck","훈제오리샐러드":"Smoked Duck Salad","훠궈":"Huoguo (Hot Pot)","히레카츠":"Hire Katsu (Pork Fillet Cutlet)","히야시추카":"Hiyashi Chuka (Cold Chinese Noodles)","BLT샌드위치":"BLT Sandwich"};
    const EN_NEW = {"가도가도":"Gado-Gado","가라아게":"Karaage","가스파초":"Gazpacho","가이센동":"Kaisendon","까이 팟 맷 마무앙":"Gai Pad Med Mamuang (Cashew Chicken)","가지나물":"Sautéed Eggplant","가지볶음":"Stir-fried Eggplant","가츠동":"Katsudon","가츠산도":"Katsu Sando","가케우동":"Kake Udon","고등어구이":"Grilled Mackerel","간장게장":"Soy Sauce Marinated Crab","간장닭날개튀김":"Soy Sauce Fried Chicken Wings","간장비빔소면":"Soy Sauce Bibim Somyeon","간장새우장":"Soy Sauce Marinated Shrimp","간장제육볶음":"Soy Sauce Spicy Pork Stir-fry","간장치킨":"Soy Sauce Chicken","갈비찜":"Braised Short Ribs","갈비탕":"Short Rib Soup","갈치구이":"Grilled Hairtail Fish","갈치조림":"Braised Hairtail Fish","감바스":"Gambas","감바스 알 아히요":"Gambas al Ajillo","감자국":"Potato Soup","감자그라탕":"Potato Gratin","감자볶음":"Stir-fried Potatoes","감자샐러드":"Potato Salad","감자수제비":"Potato Sujebi (Hand-torn Noodle Soup)","감자전":"Potato Pancake","감자조림":"Braised Potatoes","감자탕":"Pork Bone and Potato Soup","감자튀김":"French Fries","건새우미역무침":"Dried Shrimp and Seaweed Salad","게살볶음밥":"Crab Meat Fried Rice","계란국":"Egg Soup","계란덮밥":"Egg Rice Bowl","계란말이":"Rolled Egg Omelette","계란밥":"Egg Rice","계란볶음밥":"Egg Fried Rice","계란아보카도토스트":"Egg Avocado Toast","계란찜":"Steamed Egg","고등어미소조림":"Miso-braised Mackerel","고등어조림":"Braised Mackerel","고등어케밥":"Mackerel Kebab","고로케":"Korokke (Croquette)","고르곤졸라피자":"Gorgonzola Pizza","고사리나물":"Seasoned Bracken Fern","고안 피시 커리":"Goan Fish Curry","고이가":"Goi Ga (Vietnamese Chicken Salad)","고이꾸온":"Goi Cuon (Fresh Spring Rolls)","고추잡채":"Pepper Japchae","고추장불고기":"Gochujang Bulgogi","고추장삼겹살":"Gochujang Pork Belly","고추장찌개":"Gochujang Stew","골뱅이무침":"Spicy Whelk Salad","곱창볶음":"Stir-fried Beef Intestines","과카몰리":"Guacamole","광동볶음면":"Cantonese Stir-fried Noodles","광동식볶음밥":"Cantonese Fried Rice","광동식탕수육":"Cantonese Sweet and Sour Pork","교자":"Gyoza","군만두":"Pan-fried Dumplings","굴라이이칸":"Gulai Ikan (Fish Curry)","궁중떡볶이":"Royal Tteokbokki","귀벡":"Güveç (Turkish Casserole)","규나베":"Gyunabe (Beef Hot Pot)","규동":"Gyudon (Beef Rice Bowl)","규카츠":"Gyukatsu (Beef Cutlet)","그라탕":"Gratin","그릭샐러드":"Greek Salad","그릭요거트볼":"Greek Yogurt Bowl","그린커리":"Green Curry","그릴드연어":"Grilled Salmon","기나탕마노크":"Nilagang Manok (Filipino Chicken Soup)","기로스":"Gyros","기로스피타":"Gyros Pita","김밥":"Gimbap","김치말이국수":"Kimchi Wrapped Noodles","김치볶음밥":"Kimchi Fried Rice","김치수제비":"Kimchi Hand-torn Noodle Soup","김치전":"Kimchi Pancake","김치찌개":"Kimchi Stew","김치찜":"Braised Kimchi","김치찜닭":"Kimchi Braised Chicken","김치콩나물국":"Kimchi Bean Sprout Soup","까르보나라":"Carbonara","깍두기볶음밥":"Kkakdugi Fried Rice","깐쇼새우":"Gan Shao Shrimp","깐풍기":"Gan Pung Chicken","깐풍새우":"Gan Pung Shrimp","깻잎무침":"Seasoned Perilla Leaves","깻잎장아찌":"Pickled Perilla Leaves","껌가":"Cơm gà","껌땀":"Cơm tấm","껌스엉":"Cơm sườn","껌찌엔":"Cơm Chiên","꼬리곰탕":"Oxtail Soup","꽁치김치찌개":"Saury and Kimchi Stew","꽁치조림":"Braised Saury","꽃게탕":"Blue Crab Soup","꽃빵고추잡채":"Flower Bun with Pepper Japchae","꾸아이티아오":"Kuay Teow (Thai Noodle Soup)","꿔바로우":"Guo Bao Rou (Sweet and Sour Pork)","나베":"Nabe (Japanese Hot Pot)","나베야키우동":"Nabeyaki Udon","나시고랭":"Nasi Goreng","나시르막":"Nasi Lemak","나시 미냑":"Nasi Minyak (Fragrant Butter Rice)","나시빠당":"Nasi Padang","나시우둑":"Nasi Uduk","나시 참푸르":"Nasi Jambal","나초":"Nachos","나폴리탄":"Napolitan (Ketchup Spaghetti)","낙지덮밥":"Spicy Octopus Rice Bowl","낙지볶음":"Stir-fried Spicy Octopus","낙지연포탕":"Octopus Hot Pot","난자완스":"Nanjing Meatballs","냉이된장국":"Shepherd's Purse Doenjang Soup","냉이무침":"Seasoned Shepherd's Purse","너비아니":"Neobiani (Marinated Beef)","넴느엉 꾸온":"Nem Nuong Cuon","넴 루이":"Nem Lui (Vietnamese Lemongrass Pork Skewers)","녹두전":"Mung Bean Pancake","뇨냐 커리":"Nonya Curry","뇨키":"Gnocchi","뇨키토마토":"Gnocchi with Tomato Sauce","느타리버섯볶음":"Stir-fried Oyster Mushrooms","닐라가":"Nilaga (Filipino Boiled Beef)","니스와즈 샐러드":"Niçoise Salad","니스 스타일 피자":"Nice-style Pizza (Pissaladière)","니쿠우동":"Niku Udon (Beef Udon)","니쿠자가":"Nikujaga (Meat and Potato Stew)","다코라이스":"Taco Rice","단호박수프":"Butternut Squash Soup","달 마카니":"Makhani Dal","달 채소 카레":"Lentil Vegetable Curry","달 커리":"Dal Curry","달 타르카":"Dal Tadka","닭가슴살랩":"Chicken Breast Wrap","닭가슴살샐러드":"Chicken Breast Salad","닭가슴살요거트볼":"Chicken Breast Yogurt Bowl","닭가슴살채소볶음":"Chicken Breast and Vegetable Stir-fry","닭가슴살채소볶음밥":"Chicken Breast Vegetable Fried Rice","닭가슴살카레":"Chicken Breast Curry","닭가슴살현미볼":"Chicken Breast Brown Rice Bowl","닭갈비":"Dakgalbi (Spicy Stir-fried Chicken)","닭강정":"Sweet Crispy Fried Chicken","닭개장":"Spicy Chicken Soup","닭고기구이":"Grilled Chicken","닭고기캐슈넛볶음":"Chicken and Cashew Nut Stir-fry","닭곰탕":"Chicken Broth Soup","닭볶음":"Stir-fried Chicken","닭볶음탕":"Braised Spicy Chicken","닭비빔막국수":"Chicken Bibim Makguksu","닭육수면":"Chicken Broth Noodles","닭죽":"Chicken Porridge","닭한마리":"Whole Chicken Hot Pot","대패삼겹살구이":"Thinly Sliced Grilled Pork Belly","더덕구이":"Grilled Deodeok Root","데리야키치킨":"Teriyaki Chicken","도라지무침":"Seasoned Bellflower Root","도사":"Dosa","도토리묵무침":"Seasoned Acorn Jelly","돈지루":"Tonjiru (Pork Miso Soup)","돈카츠":"Tonkatsu (Pork Cutlet)","돈코츠라멘":"Tonkotsu Ramen","돌마데스":"Dolmades","돌솥비빔밥":"Stone Pot Bibimbap","동그랑땡":"Pan-fried Meat and Tofu Patties","동태전":"Pollock Pancake","동태찌개":"Pollock Stew","동파육":"Dongpo Pork (Braised Pork Belly)","돼지갈비찜":"Braised Pork Ribs","돼지고기김치찌개":"Pork and Kimchi Stew","돼지고기깻잎볶음":"Stir-fried Pork with Perilla Leaves","돼지국밥":"Pork Rice Soup","돼지불고기":"Pork Bulgogi","된장비빔밥":"Doenjang Bibimbap","된장삼겹살":"Doenjang Pork Belly","된장찌개":"Doenjang Stew (Fermented Soybean Paste Stew)","두루치기":"Duruchigi (Stir-fried Pork)","두부김치":"Tofu with Kimchi","두부미역국":"Tofu and Seaweed Soup","두부버섯솥밥":"Tofu and Mushroom Pot Rice","두부부침":"Pan-fried Tofu","두부샐러드":"Tofu Salad","두부스크램블에그":"Tofu Scrambled Eggs","두부스테이크":"Tofu Steak","두부스테이크테리야키":"Tofu Steak Teriyaki","두부조림":"Braised Tofu","두부채소볶음":"Tofu and Vegetable Stir-fry","두부포케":"Tofu Poke Bowl","두부현미볼":"Tofu Brown Rice Bowl","들기름막국수":"Perilla Oil Makguksu","들깨미역국":"Perilla Seed and Seaweed Soup","들깨순두부찌개":"Perilla Seed Soft Tofu Stew","들깨칼국수":"Perilla Seed Knife-cut Noodle Soup","등갈비김치찜":"Braised Back Ribs with Kimchi","등갈비찜":"Braised Pork Back Ribs","딤섬":"Dim Sum","떡갈비":"Tteokgalbi (Grilled Meat Patties)","떡국":"Tteokguk (Rice Cake Soup)","떡만두국":"Rice Cake and Dumpling Soup","떡볶이":"Tteokbokki (Spicy Rice Cakes)","토르티야 에스파뇰라":"Tortilla Española (Spanish Omelette)","똠얌꿍":"Tom Yum Kung","똠카가이":"Tom Kha Gai","뚝배기불고기":"Ttukbaegi Bulgogi (Hot Pot Bulgogi)","라따뚜이":"Ratatouille","라브 무":"Larb Moo","라볶이":"Rabokki (Ramen and Tteokbokki)","라브 가이":"Larb Gai (Thai Spicy Chicken Salad)","라이타":"Raita","라자냐":"Lasagna","라조기":"Laziji (Sichuan Spicy Chicken)","라지마":"Rajma (Red Kidney Bean Curry)","라페토":"Laphet Thoke (Fermented Tea Leaf Salad)","라흐마준":"Lahmacun (Turkish Pizza)","락사":"Laksa","램 코르마":"Lamb Korma","레드커리":"Red Curry","르막 캄빙":"Lemak Kambing (Goat Coconut Curry)","치킨 타욱":"Lebanese Tawook","레촌카왈리":"Lechon Kawali (Filipino Crispy Pork)","렌당":"Rendang","렌틸수프":"Lentil Soup","렌틸콩샐러드":"Lentil Salad","로간 조쉬":"Rogan Josh","로모 살타도":"Lomo Saltado","로미에":"Lomi (Filipino Noodle Soup)","로스트치킨":"Roast Chicken","로제파스타":"Rose Pasta (Creamy Tomato Pasta)","로티 차나이":"Roti Canai","보 룩락":"Bò Lúc Lắc (Vietnamese Shaking Beef)","롱가니사볶음밥":"Longganisa Fried Rice","롱통":"Lontong","룸피아":"Lumpia (Filipino Spring Rolls)","리가토니 알라 보드카":"Rigatoni alla Vodka","리볼리타":"Ribollita","리조또":"Risotto","립아이 스테이크":"Ribeye Steak","마늘새우볶음":"Garlic Shrimp Stir-fry","마늘종볶음":"Stir-fried Garlic Scapes","마라두부":"Mala Tofu","마라라면":"Mala Ramen","마라샹궈":"Mala Xiangguo (Mala Dry Pot)","마라탕":"Mala Tang (Spicy Hot Pot)","마르게리타피자":"Margherita Pizza","마삭 메라":"Masak Merah (Red Cooked Chicken)","마싸만 커리":"Massaman Curry","마제소바":"Mazesoba (Mixed Noodles)","마카로니샐러드":"Macaroni Salad","마크부스":"Machboos (Spiced Meat and Rice)","마클루베":"Maqluba (Upside-down Rice)","마파가지":"Mapo Eggplant","마파두부":"Mapo Tofu","마파두부덮밥":"Mapo Tofu Rice Bowl","막국수":"Makguksu (Buckwheat Noodles)","만사프":"Mansaf (Jordanian Lamb and Rice)","만트":"Manti (Central Asian Dumplings)","말라이 코프타":"Malai Kofta","망고 스티키 라이스":"Mango Sticky Rice","매시드포테이토":"Mashed Potatoes","매운탕":"Spicy Fish Stew","무자다라":"Mujaddara (Lentil and Rice)","메네멘":"Menemen (Turkish Egg and Tomato)","메르지메크 초르바":"Mercimek Çorbası (Turkish Lentil Soup)","메밀소바샐러드":"Soba Noodle Salad","메추리알장조림":"Braised Quail Eggs","멕시칸라이스":"Mexican Rice","타말레":"Tamale","멕시코 콩 스튜":"Mexican Bean Stew","멘보샤":"Menbosha (Shrimp Toast)","멘치카츠":"Menchi Katsu (Ground Meat Cutlet)","멸치볶음":"Stir-fried Dried Anchovies","명란 오니기리":"Mentaiko Onigiri","모야시라멘":"Moyashi Ramen (Bean Sprout Ramen)","모힝가":"Mohinga (Myanmar Fish Noodle Soup)","목살구이":"Grilled Pork Neck","무나물":"Seasoned Radish","무사카":"Moussaka","무생채":"Spicy Radish Salad","무이판":"Mui Fan (Cantonese Sauce Rice)","무조림":"Braised Radish","무채국":"Shredded Radish Soup","모케카":"Moqueca (Brazilian Fish Stew)","묵사발":"Muk Sabal (Jelly in Broth)","묵은지등갈비찜":"Braised Back Ribs with Aged Kimchi","묵은지삼겹살":"Aged Kimchi Pork Belly","물냉면":"Mul Naengmyeon (Cold Noodles in Broth)","물만두":"Boiled Dumplings","미고랭":"Mi Goreng","미고랭 말레이":"Mee Goreng Mamak","미고렝 마막":"Mee Goreng Mamak","미꽝":"Mi Quang (Vietnamese Turmeric Noodles)","미네스트로네 수프":"Minestrone","미소국":"Miso Soup","미소라멘":"Miso Ramen","미소버터라멘":"Miso Butter Ramen","미소시루":"Miso Shiru","미시암":"Mee Siam","미싸오":"Mee Sao (Crispy Noodles)","미역국":"Seaweed Soup","미역냉국":"Cold Seaweed Soup","미역줄기볶음":"Stir-fried Seaweed Stems","미트볼":"Meatballs","미트볼스파게티":"Meatball Spaghetti","미트볼파스타":"Meatball Pasta","미폭":"Mi Pok Noodles (Singapore Dry Noodles)","바바 가누쉬":"Baba Ganoush","바스틸라":"Bastilla (Moroccan Pigeon Pie)","바오즈":"Baozi (Steamed Buns)","바지락칼국수":"Clam Knife-cut Noodle Soup","바지락탕":"Clam Soup","바질페스토파스타":"Basil Pesto Pasta","박소":"Bak So","바쿠테":"Bak Kut Teh (Pork Rib Soup)","반꾸온":"Banh Cuon (Vietnamese Steamed Rice Rolls)","반미":"Banh Mi","반 보 팟 찬":"Banh Bo Phong Chien (Vietnamese Honeycomb Cake)","반쎄오":"Banh Xeo (Vietnamese Sizzling Crepe)","반 팃 느엉":"Banh Thit Nuong (Vietnamese Grilled Pork Sandwich)","배추된장국":"Napa Cabbage Doenjang Soup","배추전":"Napa Cabbage Pancake","버섯굴소스볶음":"Mushroom and Oyster Sauce Stir-fry","버섯리조또":"Mushroom Risotto","버섯 벨루테":"Mushroom Velouté","버섯볶음":"Stir-fried Mushrooms","버섯솥밥":"Mushroom Pot Rice","버섯전":"Mushroom Pancake","버섯크림리조또":"Mushroom Cream Risotto","버터 세이지 뇨키":"Butter Sage Gnocchi","버터치킨":"Butter Chicken","버터치킨커리":"Butter Chicken Curry","베이징덕":"Peking Duck","베이컨에그스크램블":"Bacon and Egg Scramble","병아리콩 샐러드":"Chickpea Salad","보렉":"Börek (Turkish Pastry)","보비아":"Bo Bia (Vietnamese Rice Paper Rolls)","보쌈":"Bossam (Steamed Pork Wraps)","보코":"Boko","볶음짬뽕":"Stir-fried Jjamppong","볼로네제파스타":"Bolognese Pasta","봉골레파스타":"Vongole Pasta (Clam Pasta)","뵈프엔다우브":"Boeuf en Daube (French Beef Stew)","부대찌개":"Budae Jjigae (Army Stew)","부리또":"Burrito","부야베스":"Bouillabaisse","부채살스테이크":"Flat Iron Steak","부추계란볶음":"Chive and Egg Stir-fry","부추김치":"Chive Kimchi","부추전":"Chive Pancake","부타네기야키":"Buta Negi Yaki (Pork and Green Onion Grill)","부타네기폰즈":"Buta Negi Ponzu","부타동":"Butadon (Pork Rice Bowl)","부타카쿠니":"Buta Kakuni (Braised Pork Belly)","부타킴치":"Buta Kimchi (Pork and Kimchi Stir-fry)","북어국":"Dried Pollack Soup","북어무침":"Seasoned Dried Pollack","북어해장국":"Dried Pollack Hangover Soup","분보후에":"Bun Bo Hue (Spicy Beef Noodle Soup)","분짜":"Bun Cha (Vietnamese Grilled Pork Noodles)","분팃느엉":"Bun Thit Nuong (Grilled Pork Noodle Bowl)","불고기덮밥":"Bulgogi Rice Bowl","불고기전골":"Bulgogi Hot Pot","불라로":"Bulalo (Filipino Bone Marrow Soup)","브로콜리두부무침":"Broccoli and Tofu Salad","브로콜리치즈수프":"Broccoli Cheese Soup","브루스케타":"Bruschetta","브리암":"Briam (Greek Roasted Vegetables)","블랙페퍼크랩":"Black Pepper Crab","비가 탄면":"Binatog (Filipino Corn Snack)","비나고옹안":"Binagooonaan (Filipino Pork in Shrimp Paste)","비리야니":"Biryani","비빔국수":"Bibim Guksu (Spicy Mixed Noodles)","비빔냉면":"Bibim Naengmyeon (Spicy Cold Noodles)","비빔밥":"Bibimbap","비지찌개":"Biji Jjigae (Soybean Pulp Stew)","비콜익스프레스":"Bicol Express","비트샐러드":"Beet Salad","비프렌당":"Beef Rendang","비프부르기뇽":"Boeuf Bourguignon","비프스튜":"Beef Stew","비프웰링턴":"Beef Wellington","비프타코":"Beef Taco","빈달루":"Vindaloo","빈대떡":"Bindaetteok (Mung Bean Pancake)","빠에야":"Paella","뿌팟퐁 커리":"Poo Pad Pong Curry","사르수엘라":"Zarzuela (Spanish Seafood Stew)","사모사":"Samosa","사바미소니":"Saba Misoni (Mackerel Simmered in Miso)","사유르 로데":"Sayur Lodeh (Vegetable Coconut Milk Soup)","사유르 아셈":"Sayur Asam (Tamarind Vegetable Soup)","사케동":"Sake Don (Salmon Rice Bowl)","사케 미소즈케":"Sake Miso Zuke (Miso-marinated Salmon)","사테 아얌":"Satay Ayam (Chicken Satay)","샤히 파니르":"Saag Paneer","산채비빔밥":"Wild Greens Bibimbap","살모레호":"Salmorejo","살사소스":"Salsa Sauce","살치살 스테이크":"Skirt Steak","살팀보카":"Saltimbocca","삼겹살구이":"Grilled Pork Belly (Samgyeopsal)","삼겹살김치찜":"Braised Pork Belly with Kimchi","삼계탕":"Samgyetang (Ginseng Chicken Soup)","삼발새우":"Sambal Shrimp","삼발 우당":"Sambal Udang","삼발 켄팅":"Sambal Kentang (Potato Sambal)","삼발 템페":"Sambal Tempeh","삼선볶음밥":"Three Delicacies Fried Rice","삼치구이":"Grilled Spanish Mackerel","삼치조림":"Braised Spanish Mackerel","새우마살라":"Prawn Masala","새우볶음밥":"Shrimp Fried Rice","새우완탕":"Shrimp Wonton","새우완탕면":"Shrimp Wonton Noodles","샌드위치":"Sandwich","생선국수":"Fish Noodle Soup","샤브샤브":"Shabu-Shabu","샤오롱바오":"Xiaolongbao (Soup Dumplings)","샤와르마":"Shawarma","샥슈카":"Shakshuka","샨 누들":"Shan Noodles (Myanmar)","설렁탕":"Seolleongtang (Ox Bone Soup)","세비체":"Classic Ceviche","소갈비구이":"Grilled Beef Short Ribs","소고기덮밥":"Beef Rice Bowl","소고기뭇국":"Beef and Radish Soup","소고기미역국":"Beef Seaweed Soup","소고기볶음":"Stir-fried Beef","소고기브로콜리볶음":"Beef and Broccoli Stir-fry","소고기장조림":"Soy-braised Beef","소고기죽":"Beef Porridge","소불고기":"Beef Bulgogi","소토 아얌":"Soto Ayam (Indonesian Chicken Soup)","소파 데 리마":"Sopa de Lima (Mexican Lime Soup)","소파 데 피데오":"Sopa de Fideo (Mexican Noodle Soup)","소파 카스텔라나":"Sopa Castellana (Spanish Garlic Soup)","솔 뫼니에르":"Sole Meunière","솔랸카":"Solyanka (Russian Sour Soup)","쏨땀":"Som Tam (Green Papaya Salad)","쇼유라멘":"Shoyu Ramen","수블라키":"Souvlaki","수육":"Suyuk (Boiled Pork Slices)","수제비":"Sujebi (Hand-torn Noodle Soup)","수프카레":"Soup Curry","숙주나물":"Seasoned Bean Sprouts","순대국밥":"Sundae Gukbap (Blood Sausage Rice Soup)","순대볶음":"Stir-fried Sundae","순댓국":"Sundaeguk (Blood Sausage Soup)","순두부찌개":"Sundubu Jjigae (Soft Tofu Stew)","쉬쉬 타욱":"Shish Taouk (Lebanese Chicken Skewers)","슈마이":"Shumai","스코르달리아":"Skordalia (Greek Garlic Sauce)","스크램블에그":"Scrambled Eggs","스키야키":"Sukiyaki","스테이크":"Steak","스티파도":"Stifado (Greek Beef Stew)","스팀보트":"Steamboat (Hot Pot)","스파나코리조":"Spanakorizo (Greek Spinach Rice)","스파나코피타":"Spanakopita (Greek Spinach Pie)","스팸마요덮밥":"Spam Mayo Rice Bowl","스페인식 오믈렛":"Spanish Omelette","슬로피조":"Sloppy Joe","시금치나물":"Seasoned Spinach","시금치된장국":"Spinach Doenjang Soup","시니강":"Sinigang (Filipino Sour Soup)","시래기국":"Dried Radish Greens Soup","시오라멘":"Shiomi (Salt-flavored)","시저랩":"Caesar Wrap","시저샐러드":"Caesar Salad","시칠리아파스타":"Sicilian Pasta","치피로네스 엔 수 틴타":"Chipirones en su Tinta (Squid in Ink)","싱가포르락사":"Singapore Laksa","싱가포르사테":"Singapore Satay","싱가포르죽":"Singapore Porridge","쌀국수":"Pho (Vietnamese Rice Noodle Soup)","쌀국수볶음":"Stir-fried Rice Noodles","쌈밥":"Ssambap (Wrap Rice)","쑥된장국":"Mugwort Doenjang Soup","시식":"Sic Sic (Uighur Lamb Dish)","아게다시 두부":"Agedashi Tofu","앙구렐라이오":"Agourélado (Greek Olive Oil Dish)","아귀찜":"Braised Monkfish","아다나 케밥":"Adana Kebab","아도봉 캉콩":"Adobong Kangkong (Filipino Water Spinach)","아라비아타 파스타":"Arrabbiata Pasta","아루나 달":"Aruna Dal","아르니 구브치":"Arni Psito (Greek Roast Lamb)","아마트리치아나":"Amatriciana","송어 아망딘":"Trout Almondine","아목트레이":"Amok Trei (Cambodian Fish Curry)","아보카도샐러드":"Avocado Salad","아보카도 연어 토스트":"Avocado Salmon Toast","아보카도 크림 파스타":"Avocado Cream Pasta","아보카도토스트":"Avocado Toast","아브골레모노":"Avgolemono (Greek Egg-Lemon Soup)","아쌈 락사":"Asam Laksa","이칸 아삼":"Asam Ikan (Tamarind Fish)","아쌈 프라이드 치킨":"Asam Fried Chicken","아얌 고렝 베렘파":"Ayam Goreng Berempah (Spiced Fried Chicken)","아얌 고렝":"Ayam Goreng (Malaysian Fried Chicken)","아얌 리카리카":"Ayam Rica-Rica (Spicy Chicken)","아얌 마삭 르막":"Ayam Masak Lemak (Chicken in Coconut Milk)","아얌 마삭 메라":"Ayam Masak Merah (Red Cooked Chicken)","아얌 바카르":"Ayam Bakar (Grilled Chicken)","아얌세리":"Ayam Seri","아얌 페녓":"Ayam Penyet (Smashed Fried Chicken)","아욱국":"Mallow Soup","아이리시스튜":"Irish Stew","아지 후라이":"Aji Furai (Fried Horse Mackerel)","아쿠아파차":"Acqua Pazza (Italian Poached Fish)","아프리타다":"Afritada (Filipino Chicken Stew)","아호 블랑코":"Ajo Blanco (Spanish White Gazpacho)","아히 데 가이나":"Aji de Gallina (Peruvian Creamy Chicken)","안심스테이크":"Tenderloin Steak","알루 고비":"Aloo Gobi (Potato and Cauliflower)","알루 파라타":"Aloo Paratha","알리오올리오":"Aglio e Olio","알본디가스":"Albondigas (Spanish Meatballs)","알탕":"Spicy Pollock Roe Soup","암리차리 쿨차":"Amritsari Kulcha","암팔라야 볶음":"Ampalaya Stir-fry (Bitter Melon)","애호박볶음":"Stir-fried Zucchini","채소볶음밥":"Vegetable Fried Rice","채소죽":"Vegetable Porridge","채소춘권":"Vegetable Spring Rolls","야키소바":"Yakisoba","야키 오니기리":"Yaki Onigiri (Grilled Rice Ball)","야키우동":"Yaki Udon (Stir-fried Udon)","야키토리":"Yakitori","야키토리 덮밥":"Yakitori Rice Bowl","약밥":"Yakbap (Sweet Rice)","얌느아":"Yam Nua (Thai Beef Salad)","얌 마무앙":"Yam Mamuang (Mango Salad)","얌운센":"Yam Woon Sen (Glass Noodle Salad)","얌탈레":"Yam Talay (Thai Seafood Salad)","양념치킨":"Yangnyeom Chicken (Korean Spicy Fried Chicken)","양배추쌈":"Cabbage Wrap","양배추참치덮밥":"Cabbage and Tuna Rice Bowl","양송이수프":"Cream of Mushroom Soup","양장피":"Yangjangpi (Jellyfish and Vegetable Salad)","양저우 볶음밥":"Yangzhou Fried Rice","양파수프":"Onion Soup","어묵국":"Fish Cake Soup","어묵볶음":"Stir-fried Fish Cakes","어묵탕":"Fish Cake Hot Pot","어향가지":"Yuxiang Eggplant","어향육사":"Yuxiang Shredded Pork","에그베네딕트":"Eggs Benedict","에그샌드위치":"Egg Sandwich","에그토스트":"Egg Toast","에비마요":"Ebi Mayo (Shrimp Mayonnaise)","에비텐동":"Ebi Tendon (Shrimp Tempura Rice Bowl)","에비 후라이":"Ebi Furai (Fried Shrimp)","에스카베체":"Escabeche (Pickled Fish)","엔칠라다":"Enchilada","엠파나다":"Empanada","연근조림":"Braised Lotus Root","연어구이":"Grilled Salmon","연어데리야키":"Salmon Teriyaki","연어샐러드":"Salmon Salad","연어스테이크":"Salmon Steak","연어아보카도볼":"Salmon Avocado Bowl","연어아보카도포케":"Salmon Avocado Poke Bowl","연어초밥":"Salmon Sushi","연어포케":"Salmon Poke Bowl","연포탕":"Yeonpo Tang (Soft Octopus Soup)","열무국수":"Young Radish Noodles","열무냉면":"Young Radish Cold Noodles","열무비빔밥":"Young Radish Bibimbap","영양솥밥":"Nutritious Pot Rice","오니기리":"Onigiri (Rice Ball)","오뎅":"Oden","오리주물럭":"Spicy Duck Stir-fry","오므라이스":"Omurice (Omelette Rice)","오믈렛":"Omelette","오버나이트오트밀":"Overnight Oatmeal","오삼불고기":"Spicy Pork and Squid Stir-fry","오소부코":"Osso Buco","오야코동":"Oyakodon (Chicken and Egg Rice Bowl)","오야코우동":"Oyako Udon","오이냉국":"Cold Cucumber Soup","오이무침":"Seasoned Cucumber","오이소박이":"Cucumber Kimchi","오이지무침":"Seasoned Pickled Cucumber","오징어덮밥":"Squid Rice Bowl","오징어먹물파스타":"Squid Ink Pasta","오징어무국":"Squid and Radish Soup","오징어볶음":"Stir-fried Spicy Squid","오징어채볶음":"Stir-fried Dried Squid Strips","오차즈케":"Ochazuke (Tea Rice)","오코노미야키":"Okonomiyaki (Japanese Savory Pancake)","오타오타":"Otak-Otak (Grilled Fish Cake)","오트밀":"Oatmeal","오포르아얌":"Opor Ayam (Chicken in Coconut Milk)","오향장육":"Five-spice Braised Pork","와플":"Waffle","완탕면":"Wonton Noodles","완탕탕":"Wonton Soup","우거지갈비찜":"Braised Ribs with Dried Cabbage","우거지해장국":"Dried Cabbage Hangover Soup","우렁된장찌개":"Freshwater Snail Doenjang Stew","우엉조림":"Braised Burdock Root","우육면":"Beef Noodle Soup","월남쌈":"Vietnamese Spring Rolls","유도후":"Yudofu (Simmered Tofu)","유린기":"Yuringi (Chinese-style Fried Chicken)","유부우동":"Kitsune Udon (Tofu Pouch Udon)","유부초밥":"Inari Sushi","유산슬":"Yusanseul (Seafood and Vegetable Stir-fry)","육개장":"Yukgaejang (Spicy Beef Soup)","육전":"Yukjeon (Pan-fried Beef)","육회비빔밥":"Yukhoe Bibimbap (Raw Beef Bibimbap)","이나리초밥":"Inari Sushi","이나살":"Inasal (Filipino Grilled Chicken)","이맘 바일드":"İmam Bayıldı (Stuffed Eggplant)","이스켄데르케밥":"İskender Kebab","이시카리나베":"Ishikari Nabe (Salmon Hot Pot)","이즈미르쾨프테":"İzmir Köfte","이칸고랭":"Ikan Goreng (Fried Fish)","이칸마살라":"Ikan Masala (Fish Masala)","이칸바카르":"Ikan Bakar (Grilled Fish)","이칸아삼":"Ikan Asam (Tamarind Fish)","이칸페프리":"Ikan Peperi (Peppered Fish)","일본식카레라이스":"Japanese Curry Rice","일본식계란말이":"Japanese Rolled Egg (Tamagoyaki)","자루소바":"Zaru Soba (Cold Soba Noodles)","자지키":"Zazak","잔치국수":"Janchi Guksu (Festive Noodle Soup)","잠발라야":"Jambalaya","잡곡밥":"Multigrain Rice","잡채":"Japchae (Glass Noodles with Vegetables)","잡채밥":"Japchae Rice Bowl","잡채볶음밥":"Japchae Fried Rice","장어구이":"Grilled Eel","장조림":"Soy-braised Beef","장조림버터비빔밥":"Soy-braised Beef Butter Bibimbap","장칼국수":"Doenjang Knife-cut Noodle Soup","장터국수":"Market-style Noodle Soup","쟁반국수":"Tray Noodles","전복미역국":"Abalone and Seaweed Soup","전복죽":"Abalone Porridge","제육볶음":"Jeyuk Bokkeum (Spicy Pork Stir-fry)","조개탕":"Clam Soup","조기구이":"Grilled Yellow Corvina","족발냉채":"Cold Pig's Trotters","주꾸미볶음":"Stir-fried Baby Octopus","주먹밥":"Jumeokbap (Rice Ball)","중식만두전골":"Chinese-style Dumpling Hot Pot","중식오이냉채":"Chinese-style Cold Cucumber","지삼선":"Di San Xian (Potato","진미채무침":"Seasoned Dried Squid Strips","짜장면":"Jjajangmyeon (Black Bean Noodles)","짜장밥":"Jjajang Rice","짜조":"Cha Gio (Vietnamese Fried Spring Rolls)","짬뽕":"Jjamppong (Spicy Seafood Noodle Soup)","쫄면":"Jjolmyeon (Chewy Spicy Noodles)","쭈꾸미볶음밥":"Spicy Baby Octopus Fried Rice","쭈꾸미삼겹살":"Baby Octopus and Pork Belly","츠케멘":"Tsukemen (Dipping Ramen)","호키엔미":"Hokkien Mee","찜닭":"Jjimdak (Braised Chicken)","짜까":"Chaaka","차나마살라":"Chana Masala","차돌된장찌개":"Beef Brisket Doenjang Stew","차돌박이숙주볶음":"Beef Brisket and Bean Sprout Stir-fry","차슈":"Chashu (Braised Pork)","차오멘":"Chow Mein","차완무시":"Chawanmushi (Japanese Steamed Egg Custard)","차우파":"Chaufa (Peruvian Fried Rice)","차이 타우 궤":"Chai Tow Kway (Radish Cake)","차조":"Chamjo (Millet and Porridge)","차지키":"Tzatziki","차퀘이테오":"Char Kway Teow","참나물무침":"Seasoned Chammnamul (Wild Parsley)","참치김밥":"Tuna Gimbap","참치김치볶음밥":"Tuna and Kimchi Fried Rice","참치김치찌개":"Tuna and Kimchi Stew","참치마요덮밥":"Tuna Mayo Rice Bowl","참치마요오니기리":"Tuna Mayo Onigiri","참치채소샐러드":"Tuna and Vegetable Salad","참치포케":"Tuna Poke Bowl","참치회비빔밥":"Fresh Tuna Bibimbap","찹스테이크":"Chop Steak","채끝스테이크":"Sirloin Steak","채소달걀국":"Vegetable and Egg Soup","채소커리":"Vegetable Curry","청경채굴소스볶음":"Bok Choy with Oyster Sauce","청경채두부볶음":"Bok Choy and Tofu Stir-fry","청경채볶음":"Stir-fried Bok Choy","청국장찌개":"Cheonggukjang Jjigae (Fermented Soybean Stew)","체가이볶음면":"Che Kai Stir-fried Noodles","초리소와인조림":"Chorizo Wine Braise","총유빙":"Cong You Bing (Scallion Pancake)","추어탕":"Chueo Tang (Loach Soup)","충무김밥":"Chungmu Gimbap","취나물":"Seasoned Chwi Namul","취나물무침":"Seasoned Chwi Namul","__DELETE__치라시즈시":"Chirashi Sushi","치미창가":"Chimichanga","치즈닭갈비":"Cheese Dakgalbi","치즈버거":"Cheeseburger","치킨그라탕":"Chicken Gratin","치킨난반":"Chicken Nanban","치킨누들수프":"Chicken Noodle Soup","치킨두피아자":"Chicken Do Pyaza","치킨몰레":"Chicken Mole","치킨발티":"Chicken Balti","치킨버거":"Chicken Burger","치킨부리토":"Chicken Burrito","치킨빈달루":"Chicken Vindaloo","치킨샐러드":"Chicken Salad","치킨샤와르마랩":"Chicken Shawarma Wrap","치킨수프":"Chicken Soup","치킨스테이크":"Chicken Steak","치킨스튜":"Chicken Stew","치킨시저랩":"Chicken Caesar Wrap","치킨아도보":"Chicken Adobo","치킨이나살":"Chicken Inasal","치킨카츠":"Chicken Katsu","치킨카치아토라":"Chicken Cacciatore","치킨커리말레이":"Malaysian Chicken Curry","치킨케밥":"Chicken Kebab","치킨코르마":"Chicken Korma","치킨콥샐러드":"Chicken Cobb Salad","치킨타진":"Chicken Tagine","치킨타코":"Chicken Taco","치킨티카마살라":"Chicken Tikka Masala","치킨파히타":"Chicken Fajita","치킨팟파이":"Chicken Pot Pie","칠레레예노":"Chile Relleno","칠레아도보":"Chile Adobo","칠레콘카르네":"Chili con Carne","칠리새우":"Chili Shrimp","칠리콘카르네":"Chili con Carne","칠리크랩":"Chilli Crab","칡냉면":"Arrowroot Cold Noodles","카니돈부리":"Kani Donburi (Crab Rice Bowl)","카레라이스":"Curry Rice","카레우동":"Curry Udon","카레카레":"Kare-Kare (Filipino Peanut Stew)","카르네아사다":"Carne Asada","카르니야르크":"Karnıyarık (Stuffed Eggplant)","카르보나라":"Carbonara","카마로네스 아 라 디아블라":"Camarones a la Diabla","카불리 팔라우":"Kaburga (Turkish Lamb Ribs)","카술레":"Cassoulet","카야토스트":"Kaya Toast","카오니아오":"Khao Niao (Sticky Rice)","카오니아오 마무앙":"Khao Niao Mamuang (Mango Sticky Rice)","카오니아오 무삥":"Khao Niao Mu Ping (Grilled Pork with Sticky Rice)","카오만가이":"Khao Man Gai (Thai Chicken Rice)","카오무댕":"Khao Mu Daeng (Red Pork Rice)","카오소이":"Khao Soi","카오카무":"Khao Kha Mu (Thai Braised Pork Leg Rice)","카오팟":"Khao Pad (Thai Fried Rice)","카오팟꿍":"Khao Pad Kung (Shrimp Fried Rice)","카오팟 끄라파오":"Khao Pad Krapao","카이 지아우 무쌉":"Khai Jiao Mu Sap (Thai Minced Pork Omelette)","깐 까 우아":"Canh Chua (Vietnamese Sour Soup)","가케소바":"Kake Soba","카키아게":"Kakiage (Mixed Tempura)","카포나타":"Caponata","카프레제샐러드":"Caprese Salad","카프타 그릴":"Kafta Grill (Lebanese Meatball Skewer)","똠 카 카이":"Khanom Khai (Thai Steamed Egg)","칼국수":"Kalguksu (Knife-cut Noodle Soup)","칼데레타":"Caldereta (Filipino Beef Stew)","칼데이라다":"Caldeirada (Portuguese Fish Stew)","캅카이":"Khap Kai","캐롯케이크":"Carrot Cake","커리치킨반미":"Curry Chicken Banh Mi","케랄라새우커리":"Kerala Prawn Curry","케랍 아얌":"Kerabu Ayam (Malaysian Chicken Salad)","키마 마타르":"Keema Matar (Minced Meat and Peas)","케프타 타진":"Kefta Tagine","코다리조림":"Braised Semi-dried Pollock","코로케":"Korokke (Croquette)","코시도":"Cocido (Spanish Chickpea Stew)","코울슬로":"Coleslaw","코지두 아 포르투게자":"Cozido à Portuguesa","코코뱅":"Coq au Vin","코프타 케밥":"Kofta Kebab","코프테":"Köfte (Turkish Meatballs)","콘치즈":"Corn Cheese","콥샐러드":"Cobb Salad","콩국수":"Kong Guksu (Cold Soy Milk Noodles)","콩나물국":"Bean Sprout Soup","콩나물국밥":"Bean Sprout Rice Soup","콩나물냉국수":"Cold Bean Sprout Noodles","콩나물무침":"Seasoned Bean Sprouts","콩나물밥":"Bean Sprout Rice","콩나물해장국":"Bean Sprout Hangover Soup","콩비지찌개":"Soybean Pulp Stew","쾨프테":"Köfte","쿠르제트수프":"Courgette Soup (Zucchini Soup)","쿠스쿠스":"Couscous","쿠스쿠스 로얄":"Couscous Royal","쿵파오치킨":"Kung Pao Chicken","퀘사디야":"Quesadilla","퀴노아채소볼":"Quinoa Vegetable Bowl","크레프":"Crêpe","크로크무슈":"Croque Monsieur","크리스피 파타":"Crispy Pata (Filipino Crispy Pork Knuckle)","크림브로콜리수프":"Cream of Broccoli Soup","크림새우":"Creamy Shrimp","크림소스연어":"Salmon in Cream Sauce","크림수프":"Cream Soup","크림파스타":"Cream Pasta","크메르레드커리":"Khmer Red Curry","클램차우더":"Clam Chowder","클럽샌드위치":"Club Sandwich","클레프티코":"Kleftiko (Greek Slow-roasted Lamb)","키마커리":"Keema Curry","키베":"Kibbeh","키슈 로렌":"Quiche Lorraine","키츠네우동":"Kitsune Udon (Fox Udon)","킬라윈":"Kinilaw (Filipino Ceviche)","타마고산도":"Tamago Sando (Egg Sandwich)","타북 수유":"Tabbouleh","타불레":"Tabbouleh","타쉬 쾨프테":"Taş Köfte","타코":"Taco","타코야키":"Takoyaki (Octopus Balls)","탄두리연어":"Tandoori Salmon","탄두리치킨":"Tandoori Chicken","탄탄면":"Dan Dan Noodles","탕수육":"Tangsuyuk (Sweet and Sour Pork)","터키식 필라프":"Turkish Pilaf","텐동":"Tendon (Tempura Rice Bowl)","텐푸라 우동":"Tempura Udon","템페고랭":"Tempe Goreng (Fried Tempeh)","토르탕 탈롱":"Tortang Talong (Filipino Eggplant Omelette)","토르티야수프":"Tortilla Soup","토리파이탄":"Tori Paitan (Chicken Broth Ramen)","토마토계란볶음":"Tomato and Egg Stir-fry","토마토달걀볶음":"Tomato and Egg Stir-fry","토마토달걀수프":"Tomato and Egg Soup","토마토브루스케타":"Tomato Bruschetta","토마토수프":"Tomato Soup","토마토파스타":"Tomato Pasta","토마호크스테이크":"Tomahawk Steak","토스타다":"Tostada","토시로그":"Tosilog (Filipino Tocino","튜나샌드위치":"Tuna Sandwich","티놀라":"Tinola (Filipino Chicken Soup)","티로피타":"Tiropita (Greek Cheese Pie)","티본스테이크":"T-bone Steak","파기름파스타":"Scallion Oil Pasta","파낭 커리":"Panang Curry","파니르 티카":"Paneer Tikka","파르망티에":"Parmentier (French Shepherd's Pie)","파소울라다":"Fasolada (Greek Bean Soup)","파스티치오":"Pastitsio (Greek Baked Pasta)","파에야":"Paella","파인애플볶음밥":"Pineapple Fried Rice","파전":"Pajeon (Scallion Pancake)","파코라":"Pakora","파타타스 브라바스":"Patatas Bravas","파투쉬":"Fattoush","파파스 아루가다스":"Papa a la Huancaína (Peruvian Potato)","판싯":"Pancit (Filipino Noodles)","판싯 비혼":"Pancit Bihay","판싯칸톤":"Pancit Canton","팔락 알루":"Palak Aloo (Spinach and Potato)","팔라펠":"Falafel","팔락 파니르":"Palak Paneer","팔보채":"Palbochae (Eight Treasure Stir-fry)","팟 끄라파오 무쌉":"Pad Krapao Mu Sap (Thai Basil Minced Pork)","팟나":"Pad Na (Thai Sauce Noodles)","팟씨유":"Pad See Ew","팟타이":"Pad Thai","팟 팍붕 파이댕":"Pad Pak Bung Fai Daeng (Stir-fried Morning Glory)","팟 카나":"Pad Pak Khana (Stir-fried Chinese Broccoli)","팟프리킹":"Pad Prik King (Dry Red Curry Stir-fry)","팥죽":"Patjuk (Red Bean Porridge)","파니르 도 피아자":"Paneer Do Pyaza","팬케이크":"Pancake","팽이버섯볶음":"Stir-fried Enoki Mushrooms","팽이버섯전골":"Enoki Mushroom Hot Pot","퍼가":"Pho Ga (Vietnamese Chicken Noodle Soup)","퍼싸오":"Pho Xao (Stir-fried Pho Noodles)","페센베크":"Fesenjān (Persian Walnut and Pomegranate Stew)","페스토파스타":"Pesto Pasta","페퍼로니피자":"Pepperoni Pizza","평양냉면":"Pyongyang Naengmyeon (Cold Noodles)","__DELETE__포졸레":"Pozole","포카치아":"Focaccia","포케":"Poke Bowl","포크시시그":"Pork Sisig","포크아도보":"Pork Adobo","포터하우스스테이크":"Porterhouse Steak","폴렌타":"Polenta","폴포살라다":"Polpo Salada (Octopus Salad)","풀드포크":"Pulled Pork","풀포 아 라 가예가":"Pulpo a la Gallega (Galician Octopus)","프라이드 피타":"Fried Pita","프렌치 어니언 수프":"French Onion Soup","프렌치토스트":"French Toast","토마토 프로방살":"Provençal Tomatoes","프론 미":"Prawn Mee (Shrimp Noodle Soup)","프리타타":"Frittata","피나크벳":"Pinakbet (Filipino Vegetable Stew)","피단두부무침":"Century Egg and Tofu","피데":"Pide (Turkish Flatbread Pizza)","피미엔토 데 파드론":"Pimientos de Padrón","피시볼 국":"Fish Ball Soup","피시 앤 칩스":"Fish and Chips","피시타코":"Fish Taco","피시헤드커리":"Fish Head Curry","하리라":"Harira (Moroccan Lamb Soup)","하몬 크로케타":"Jamón Croqueta (Ham Croquette)","하이난치킨라이스":"Hainanese Chicken Rice","하이라이스":"Hayashi Rice","할루미구이":"Grilled Halloumi","함박스테이크":"Hambak Steak (Japanese-style Hamburger Steak)","함흥냉면":"Hamheung Naengmyeon (Cold Noodles)","해물누룽지탕":"Seafood Scorched Rice Soup","해물순두부찌개":"Seafood Soft Tofu Stew","해물잡채":"Seafood Japchae","해물전골":"Seafood Hot Pot","해물파전":"Seafood Scallion Pancake","해산물리조또":"Seafood Risotto","해산물파스타":"Seafood Pasta","해파리냉채":"Cold Jellyfish Salad","햄버거":"Hamburger","현미채소덮밥":"Brown Rice Vegetable Bowl","현미채소볶음밥":"Brown Rice Vegetable Fried Rice","호르타":"Horta (Greek Boiled Greens)","호박나물":"Seasoned Zucchini","호박전":"Zucchini Pancake","호박죽":"Pumpkin Porridge","홍샤오러우":"Red-braised Pork","홍합탕":"Mussel Soup","황기닭백숙":"Astragalus Chicken Soup","황태구이":"Grilled Dried Pollack","황태국":"Dried Pollack Soup","황태해장국":"Dried Pollack Hangover Soup","후이궈러우":"Twice-cooked Pork (Huiguorou)","회냉면":"Raw Fish Cold Noodles","후무스":"Hummus","훈제연어파스타":"Smoked Salmon Pasta","훈제오리볶음":"Stir-fried Smoked Duck","훈제오리샐러드":"Smoked Duck Salad","훠궈":"Huoguo (Hot Pot)","히레카츠":"Hire Katsu (Pork Fillet Cutlet)","히야시추카":"Hiyashi Chuka (Cold Chinese Noodles)","BLT 샌드위치":"BLT Sandwich"};
    const DELETE_NAMES = new Set(["홍샤오러우","훔무스","팟카파오 무쌉","팟카파오무쌉","탄탄면","퀘사디야","케사디야","카르네 아사다 타코","케밥","차퀘이테오싱가포르","차퀘이티아오","완탕미싱가포르","오탁오탁","오타오타싱가포르","소고기무국","뿌팟퐁가리","껌승"]);
    const before = (typeof MENU_DB==='object') ? Object.keys(MENU_DB).length : 0;
    function uniq(arr){ return [...new Set((arr||[]).filter(Boolean))]; }
    function mergeObj(target, src, newName){
      if(!target || !src) return target || src;
      const out = target;
      out.name = newName || out.name || src.name;
      out.displayName = out.name;
      out.enName = out.enName || src.enName;
      out.styles = uniq([...(out.styles||[]), ...(src.styles||[]), src.style, out.style]);
      if(!out.style && src.style) out.style = src.style;
      out.ingredients = uniq([...(out.ingredients||[]), ...(src.ingredients||[])]);
      out.tags = uniq([...(out.tags||[]), ...(src.tags||[])]);
      out.ingredientAmounts = Object.assign({}, src.ingredientAmounts||{}, out.ingredientAmounts||{});
      out.cookTime = out.cookTime || src.cookTime;
      out.servings = out.servings || src.servings;
      out.recipeServings = out.recipeServings || src.recipeServings;
      out.baseId = out.baseId || src.baseId;
      out.baseName = out.baseName || src.baseName;
      return out;
    }
    function applyMeta(obj, key){
      if(!obj) return;
      const en = EN_NEW[key] || EN_OLD[key];
      obj.name = key;
      obj.displayName = key;
      if(en) obj.enName = en;
    }
    function renameInDict(dict, oldName, newName){
      if(!dict || !dict[oldName]) return false;
      const src = dict[oldName];
      const en = EN_OLD[oldName] || EN_NEW[newName];
      src.name = newName;
      src.displayName = newName;
      if(en) src.enName = en;
      if(dict[newName] && dict[newName] !== src){
        dict[newName] = mergeObj(dict[newName], src, newName);
      }else{
        dict[newName] = src;
      }
      delete dict[oldName];
      return true;
    }
    function deleteFromDict(dict, name){
      if(dict && Object.prototype.hasOwnProperty.call(dict,name)) delete dict[name];
    }
    function mapName(name){
      if(!name) return name;
      const raw = String(name).trim();
      if(DELETE_NAMES.has(raw)) return null;
      return NAME_MAP[raw] || raw;
    }
    // 1) Explicit delete first
    DELETE_NAMES.forEach(function(n){
      deleteFromDict(typeof MENU_DB!=='undefined' ? MENU_DB : null, n);
      deleteFromDict(typeof MENU_SCHEMA_V2!=='undefined' ? MENU_SCHEMA_V2 : null, n);
      deleteFromDict(typeof WM_NUT_V5!=='undefined' ? WM_NUT_V5 : null, n);
      deleteFromDict(typeof MENU_NUT!=='undefined' ? MENU_NUT : null, n);
    });
    // 2) Rename keys in all menu/nutrition dictionaries
    Object.keys(NAME_MAP).forEach(function(oldName){
      const newName = NAME_MAP[oldName];
      if(!newName || oldName===newName || DELETE_NAMES.has(oldName) || DELETE_NAMES.has(newName)) return;
      renameInDict(typeof MENU_DB!=='undefined' ? MENU_DB : null, oldName, newName);
      renameInDict(typeof MENU_SCHEMA_V2!=='undefined' ? MENU_SCHEMA_V2 : null, oldName, newName);
      renameInDict(typeof WM_NUT_V5!=='undefined' ? WM_NUT_V5 : null, oldName, newName);
      renameInDict(typeof MENU_NUT!=='undefined' ? MENU_NUT : null, oldName, newName);
    });
    // 3) Attach enName metadata to current canonical names
    if(typeof MENU_DB==='object') Object.keys(MENU_DB).forEach(function(k){ applyMeta(MENU_DB[k], k); });
    if(typeof MENU_SCHEMA_V2==='object') Object.keys(MENU_SCHEMA_V2).forEach(function(k){ applyMeta(MENU_SCHEMA_V2[k], k); });
    // 4) CLEAN_MENUS array cleanup/metadata
    if(typeof CLEAN_MENUS!=='undefined' && Array.isArray(CLEAN_MENUS)){
      for(let i=CLEAN_MENUS.length-1;i>=0;i--){
        const m=CLEAN_MENUS[i];
        const newName=mapName(m && m.name);
        if(!newName){ CLEAN_MENUS.splice(i,1); continue; }
        m.name=newName; m.displayName=newName;
        const en=EN_NEW[newName] || EN_OLD[newName];
        if(en) m.enName=en;
      }
    }
    // 5) Update style/group maps and any visible menu list arrays
    function remapArray(arr){ return uniq((arr||[]).map(mapName).filter(function(n){ return n && (typeof MENU_DB==='undefined' || MENU_DB[n]); })); }
    if(typeof FLOW_STYLE_MENU_MAP==='object') Object.keys(FLOW_STYLE_MENU_MAP).forEach(function(k){ if(Array.isArray(FLOW_STYLE_MENU_MAP[k])) FLOW_STYLE_MENU_MAP[k]=remapArray(FLOW_STYLE_MENU_MAP[k]); });
    if(typeof MENU_GROUP_DB_V3==='object') Object.values(MENU_GROUP_DB_V3).forEach(function(g){ if(Array.isArray(g.variations)) g.variations=remapArray(g.variations); });
    // 6) Alias resolver: old typed/saved names resolve to canonical renamed menu.
    const oldResolveMenu = window.resolveMenu;
    window.resolveMenu = function(name){
      const raw = String(name||'').trim();
      if(!raw) return null;
      if(DELETE_NAMES.has(raw)) return null;
      const mapped = NAME_MAP[raw] || raw;
      if(typeof MENU_DB!=='undefined' && MENU_DB[mapped]) return mapped;
      if(typeof oldResolveMenu==='function') return oldResolveMenu(raw);
      return null;
    };
    window.flowMenuDBName = function(name){ return window.resolveMenu(name) || name; };
    window.getMenuDisplayName = function(name){ const n=window.resolveMenu(name)||name; return n; };
    window.getMenuEnglishName = function(name){
      const n=window.resolveMenu(name)||name;
      const obj=(typeof MENU_DB!=='undefined' && MENU_DB[n]) || (typeof MENU_SCHEMA_V2!=='undefined' && MENU_SCHEMA_V2[n]);
      return (obj&&obj.enName) || EN_NEW[n] || EN_OLD[n] || '';
    };
    window.WM_MENU_NAME_I18N_PATCH_V1={
      applied:true,
      before:before,
      after:(typeof MENU_DB==='object') ? Object.keys(MENU_DB).length : 0,
      renameCount:Object.keys(NAME_MAP).length,
      enNameCount:Object.keys(EN_NEW).length,
      deleted:[...DELETE_NAMES]
    };
    }catch(e){ }
})();

(function(){
  try{
    const OLD_NAMES = ['감바스','감바스알아히요'];
    const CANON = '감바스 알 아히요';
    const EN = 'Gambas al Ajillo';
    function uniq(arr){ return [...new Set((arr||[]).filter(Boolean))]; }
    function mergeObj(target, src){
      if(!src) return target;
      if(!target) target = {};
      target.name = CANON;
      target.displayName = CANON;
      target.enName = EN;
      target.style = target.style || src.style;
      target.styles = uniq([...(target.styles||[]), ...(src.styles||[]), target.style, src.style]);
      target.ingredients = uniq([...(target.ingredients||[]), ...(src.ingredients||[])]);
      target.tags = uniq([...(target.tags||[]), ...(src.tags||[])]);
      target.ingredientAmounts = Object.assign({}, src.ingredientAmounts||{}, target.ingredientAmounts||{});
      target.cookTime = target.cookTime || src.cookTime;
      target.servings = target.servings || src.servings;
      target.recipeServings = target.recipeServings || src.recipeServings;
      target.baseId = target.baseId || src.baseId;
      target.baseName = target.baseName || src.baseName || CANON;
      return target;
    }
    function normalizeDict(dict){
      if(!dict) return;
      let canon = dict[CANON] || null;
      OLD_NAMES.forEach(function(n){
        if(dict[n]){
          canon = mergeObj(canon || {}, dict[n]);
          delete dict[n];
        }
      });
      if(canon){
        canon.name = CANON;
        canon.displayName = CANON;
        canon.enName = EN;
        dict[CANON] = canon;
      }
    }
    normalizeDict(typeof MENU_DB!=='undefined' ? MENU_DB : null);
    normalizeDict(typeof MENU_SCHEMA_V2!=='undefined' ? MENU_SCHEMA_V2 : null);
    normalizeDict(typeof WM_NUT_V5!=='undefined' ? WM_NUT_V5 : null);
    normalizeDict(typeof MENU_NUT!=='undefined' ? MENU_NUT : null);

    if(typeof CLEAN_MENUS!=='undefined' && Array.isArray(CLEAN_MENUS)){
      let canon = null;
      for(let i=CLEAN_MENUS.length-1;i>=0;i--){
        const m=CLEAN_MENUS[i];
        if(!m || !OLD_NAMES.includes(m.name)) continue;
        if(!canon) canon = Object.assign({}, m, {name:CANON, displayName:CANON, enName:EN});
        CLEAN_MENUS.splice(i,1);
      }
      const exists = CLEAN_MENUS.some(m=>m && m.name===CANON);
      if(canon && !exists) CLEAN_MENUS.push(canon);
      CLEAN_MENUS.forEach(function(m){ if(m && m.name===CANON){ m.displayName=CANON; m.enName=EN; }});
    }

    function remapName(n){ return OLD_NAMES.includes(n) ? CANON : n; }
    function remapArray(arr){ return uniq((arr||[]).map(remapName).filter(function(n){ return !OLD_NAMES.includes(n); })); }
    if(typeof FLOW_STYLE_MENU_MAP==='object') Object.keys(FLOW_STYLE_MENU_MAP).forEach(function(k){ if(Array.isArray(FLOW_STYLE_MENU_MAP[k])) FLOW_STYLE_MENU_MAP[k]=remapArray(FLOW_STYLE_MENU_MAP[k]); });
    if(typeof MENU_GROUP_DB_V3==='object') Object.values(MENU_GROUP_DB_V3).forEach(function(g){ if(Array.isArray(g.variations)) g.variations=remapArray(g.variations); });
    if(typeof SIDE_MAP==='object'){
      OLD_NAMES.forEach(function(n){ if(SIDE_MAP[n] && !SIDE_MAP[CANON]) SIDE_MAP[CANON]=SIDE_MAP[n]; delete SIDE_MAP[n]; });
    }

    const prevResolve = window.resolveMenu;
    window.resolveMenu = function(name){
      const raw = String(name||'').trim();
      if(OLD_NAMES.includes(raw)) return CANON;
      if(typeof MENU_DB!=='undefined' && MENU_DB[raw]) return raw;
      return (typeof prevResolve==='function') ? prevResolve(raw) : null;
    };
    window.flowMenuDBName = function(name){ return window.resolveMenu(name) || name; };
    const prevEn = window.getMenuEnglishName;
    window.getMenuEnglishName = function(name){
      const resolved = window.resolveMenu(name) || name;
      if(resolved===CANON) return EN;
      return (typeof prevEn==='function') ? prevEn(name) : '';
    };
    window.WM_GAMBAS_DUPLICATE_CLEANUP_V1={applied:true, removed:'감바스', kept:CANON, enName:EN};
    }catch(e){ }
})();

(function(){
  function safeRun(fn){ try{ fn(); }catch(e){ } }
  function mergeMenuRecord(target, src, newName){
    if(!src) return target;
    if(!target) target = {};
    Object.keys(src).forEach(function(k){
      if(target[k] === undefined || target[k] === null || target[k] === '') target[k] = src[k];
    });
    target.name = newName;
    target.displayName = newName;
    if(Array.isArray(target.tags)) target.tags = Array.from(new Set(target.tags));
    if(Array.isArray(target.styles)) target.styles = Array.from(new Set(target.styles));
    return target;
  }
  function renameKey(obj, oldName, newName){
    if(!obj || typeof obj !== 'object' || oldName === newName) return;
    if(Object.prototype.hasOwnProperty.call(obj, oldName)){
      if(Object.prototype.hasOwnProperty.call(obj, newName)) obj[newName] = mergeMenuRecord(obj[newName], obj[oldName], newName);
      else obj[newName] = obj[oldName];
      if(obj[newName] && typeof obj[newName] === 'object'){
        obj[newName].name = newName;
        obj[newName].displayName = newName;
      }
      delete obj[oldName];
    }
  }
  function deleteKey(obj, name){
    if(obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, name)) delete obj[name];
  }
  function mutateMenuArray(arr){
    if(!Array.isArray(arr)) return;
    for(let i=arr.length-1;i>=0;i--){
      const m=arr[i];
      if(!m) continue;
      const n=(typeof m==='string')?m:m.name;
      if(n==='시오미') { arr.splice(i,1); continue; }
      if(n==='쏨땀' || n==='쏨땀'){
        if(typeof m==='string') arr[i]='쏨땀';
        else { m.name='쏨땀'; m.displayName='쏨땀'; m.enName=m.enName||'Som Tam (Green Papaya Salad)'; }
      }
    }
    // remove duplicate 쏨땀 entries while preserving first object
    const seen=new Set();
    for(let i=arr.length-1;i>=0;i--){
      const n=(typeof arr[i]==='string')?arr[i]:arr[i]?.name;
      if(n==='쏨땀'){
        if(seen.has('쏨땀')) arr.splice(i,1);
        else seen.add('쏨땀');
      }
    }
  }
  function cleanup(){
    safeRun(function(){ if(typeof MENU_DB!=='undefined'){ renameKey(MENU_DB,'쏨땀','쏨땀'); deleteKey(MENU_DB,'시오미'); if(MENU_DB['쏨땀']){ MENU_DB['쏨땀'].name='쏨땀'; MENU_DB['쏨땀'].displayName='쏨땀'; MENU_DB['쏨땀'].enName=MENU_DB['쏨땀'].enName||'Som Tam (Green Papaya Salad)'; } } });
    safeRun(function(){ if(typeof MENU_SCHEMA_V2!=='undefined'){ renameKey(MENU_SCHEMA_V2,'쏨땀','쏨땀'); deleteKey(MENU_SCHEMA_V2,'시오미'); } });
    safeRun(function(){ if(typeof MENU_GROUP_DB_V3!=='undefined'){ renameKey(MENU_GROUP_DB_V3,'쏨땀','쏨땀'); deleteKey(MENU_GROUP_DB_V3,'시오미'); } });
    safeRun(function(){ if(typeof NUT_V5!=='undefined'){ renameKey(NUT_V5,'쏨땀','쏨땀'); deleteKey(NUT_V5,'시오미'); } });
    safeRun(function(){ if(typeof EN!=='undefined'){ renameKey(EN,'쏨땀','쏨땀'); deleteKey(EN,'시오미'); EN['쏨땀']=EN['쏨땀']||'Som Tam (Green Papaya Salad)'; } });
    safeRun(function(){ if(typeof EN_NEW!=='undefined'){ renameKey(EN_NEW,'쏨땀','쏨땀'); deleteKey(EN_NEW,'시오미'); EN_NEW['쏨땀']=EN_NEW['쏨땀']||'Som Tam (Green Papaya Salad)'; } });
    safeRun(function(){ if(typeof CLEAN_MENUS!=='undefined') mutateMenuArray(CLEAN_MENUS); });
    safeRun(function(){ if(typeof ADD_MENUS!=='undefined') mutateMenuArray(ADD_MENUS); });
    safeRun(function(){ if(typeof FLOW_STYLE_MENU_MAP!=='undefined') Object.keys(FLOW_STYLE_MENU_MAP).forEach(k=>mutateMenuArray(FLOW_STYLE_MENU_MAP[k])); });
    safeRun(function(){ if(typeof MENU_KEYWORD_SIDES!=='undefined') deleteKey(MENU_KEYWORD_SIDES,'시오미'); });
    safeRun(function(){
      if(typeof ALIAS_V5!=='undefined'){
        ALIAS_V5['쏨땀']='쏨땀'; ALIAS_V5['쏨땀']='쏨땀'; ALIAS_V5['시오미']='시오라멘';
      }
      if(typeof DUP_ALIAS!=='undefined'){
        DUP_ALIAS['쏨땀']='쏨땀'; DUP_ALIAS['쏨땀']='쏨땀'; DUP_ALIAS['시오미']='시오라멘';
      }
    });
    window.WM_MENU_CLEANUP_SIOMI_SOMTAM = true;
  }
  cleanup();
  document.addEventListener('DOMContentLoaded', cleanup);
  setTimeout(cleanup, 0);
})();

(function(){
  const WM_MENU_NUTRITION_DB = Object.freeze({"가도가도":{"kcal":315,"carb":28,"pro":12,"fat":16,"portionG":236,"enName":"Gado-Gado"},"가라아게":{"kcal":400,"carb":10,"pro":32,"fat":26,"portionG":150,"enName":"Karaage"},"가스파초":{"kcal":80,"carb":9,"pro":1.5,"fat":3.5,"portionG":240,"enName":"Gazpacho"},"가이센동":{"kcal":600,"carb":62,"pro":41,"fat":20,"portionG":400,"enName":"Kaisen don"},"까이 팟 맷 마무앙":{"kcal":794,"carb":28,"pro":21,"fat":20,"portionG":420,"enName":"Gai Pad Med Mamuang (Cashew Chicken)"},"가지나물":{"kcal":51,"carb":7,"pro":2,"fat":2,"portionG":50,"enName":"Sautéed Eggplant"},"가지볶음":{"kcal":58,"carb":10,"pro":2,"fat":2,"portionG":50,"enName":"Stir-fried Eggplant"},"가츠동":{"kcal":808,"carb":106,"pro":36,"fat":25,"portionG":450,"enName":"Katsudon"},"가츠산도":{"kcal":443,"carb":44,"pro":25,"fat":17,"portionG":150,"enName":"Katsu Sando"},"가케우동":{"kcal":359,"carb":65,"pro":18,"fat":3,"portionG":400,"enName":"Kake Udon"},"고등어구이":{"kcal":290,"carb":0.2,"pro":27,"fat":20,"portionG":150,"enName":"Grilled Mackerel"},"간장게장":{"kcal":320,"carb":8,"pro":33,"fat":7,"portionG":250,"enName":"Soy Sauce Marinated Crab"},"간장닭날개튀김":{"kcal":540,"carb":18,"pro":32,"fat":38,"portionG":200,"enName":"Soy Sauce Fried Chicken Wings"},"간장비빔소면":{"kcal":520,"carb":95,"pro":13,"fat":10,"portionG":400,"enName":"Soy Sauce Bibim Somyeon"},"간장새우장":{"kcal":145,"carb":8,"pro":22,"fat":3,"portionG":150,"enName":"Soy Sauce Marinated Shrimp"},"간장제육볶음":{"kcal":380,"carb":12,"pro":28,"fat":24,"portionG":200,"enName":"Soy Sauce Spicy Pork Stir-fry"},"간장치킨":{"kcal":680,"carb":25,"pro":42,"fat":46,"portionG":250,"enName":"Soy Sauce Chicken"},"갈비찜":{"kcal":450,"carb":15,"pro":32,"fat":28,"portionG":250,"enName":"Braised Short Ribs"},"갈비탕":{"kcal":420,"carb":10,"pro":35,"fat":26,"portionG":600,"enName":"Short Rib Soup"},"갈치구이":{"kcal":220,"carb":0.5,"pro":28,"fat":11,"portionG":150,"enName":"Grilled Hairtail Fish"},"갈치조림":{"kcal":310,"carb":14,"pro":32,"fat":13,"portionG":300,"enName":"Braised Hairtail Fish"},"감바스 알 아히요":{"kcal":410,"carb":6,"pro":18,"fat":36,"portionG":200,"enName":"Gambas al Ajillo"},"감자국":{"kcal":110,"carb":18,"pro":4,"fat":2,"portionG":400,"enName":"Potato Soup"},"감자그라탕":{"kcal":340,"carb":32,"pro":10,"fat":19,"portionG":250,"enName":"Potato Gratin"},"감자볶음":{"kcal":130,"carb":16,"pro":2,"fat":6,"portionG":120,"enName":"Stir-fried Potatoes"},"감자샐러드":{"kcal":190,"carb":22,"pro":3,"fat":10,"portionG":150,"enName":"Potato Salad"},"감자수제비":{"kcal":440,"carb":88,"pro":12,"fat":4,"portionG":500,"enName":"Potato Sujebi (Hand-torn Noodle Soup)"},"감자전":{"kcal":230,"carb":34,"pro":3,"fat":9,"portionG":150,"enName":"Potato Pancake"},"감자조림":{"kcal":95,"carb":18,"pro":2,"fat":1.5,"portionG":100,"enName":"Braised Potatoes"},"감자탕":{"kcal":510,"carb":22,"pro":45,"fat":27,"portionG":800,"enName":"Pork Bone and Potato Soup"},"감자튀김":{"kcal":310,"carb":38,"pro":4,"fat":15,"portionG":100,"enName":"French Fries"},"건새우미역무침":{"kcal":55,"carb":5,"pro":4,"fat":2,"portionG":50,"enName":"Dried Shrimp and Seaweed Salad"},"게살볶음밥":{"kcal":440,"carb":68,"pro":17,"fat":11,"portionG":300,"enName":"Crab Meat Fried Rice"},"계란국":{"kcal":65,"carb":3,"pro":5,"fat":4,"portionG":300,"enName":"Egg Soup"},"계란덮밥":{"kcal":430,"carb":68,"pro":14,"fat":11,"portionG":350,"enName":"Egg Rice Bowl"},"계란말이":{"kcal":210,"carb":3,"pro":14,"fat":16,"portionG":120,"enName":"Rolled Egg Omelette"},"계란밥":{"kcal":385,"carb":65,"pro":11,"fat":9,"portionG":260,"enName":"Egg Rice"},"계란볶음밥":{"kcal":410,"carb":66,"pro":12,"fat":10,"portionG":300,"enName":"Egg Fried Rice"},"계란아보카도토스트":{"kcal":360,"carb":28,"pro":12,"fat":22,"portionG":180,"enName":"Egg Avocado Toast"},"계란찜":{"kcal":90,"carb":2,"pro":8,"fat":6,"portionG":150,"enName":"Steamed Egg"},"고등어미소조림":{"kcal":320,"carb":8,"pro":26,"fat":20,"portionG":200,"enName":"Miso-braised Mackerel"},"고등어조림":{"kcal":310,"carb":10,"pro":28,"fat":17,"portionG":250,"enName":"Braised Mackerel"},"고등어케밥":{"kcal":380,"carb":32,"pro":24,"fat":17,"portionG":200,"enName":"Mackerel Kebab"},"고로케":{"kcal":260,"carb":28,"pro":4,"fat":15,"portionG":120,"enName":"Korokke (Croquette)"},"고르곤졸라피자":{"kcal":420,"carb":42,"pro":16,"fat":21,"portionG":150,"enName":"Gorgonzola Pizza"},"고사리나물":{"kcal":45,"carb":4,"pro":2,"fat":2.5,"portionG":60,"enName":"Seasoned Bracken Fern"},"고안 피시 커리":{"kcal":340,"carb":12,"pro":24,"fat":22,"portionG":300,"enName":"Goan Fish Curry"},"고이가":{"kcal":180,"carb":8,"pro":22,"fat":7,"portionG":200,"enName":"Goi Ga (Vietnamese Chicken Salad)"},"고이꾸온":{"kcal":190,"carb":26,"pro":12,"fat":4,"portionG":160,"enName":"Goi Cuon (Fresh Spring Rolls)"},"고추잡채":{"kcal":230,"carb":12,"pro":15,"fat":14,"portionG":200,"enName":"Pepper Japchae"},"고추장불고기":{"kcal":360,"carb":14,"pro":26,"fat":22,"portionG":200,"enName":"Gochujang Bulgogi"},"고추장삼겹살":{"kcal":580,"carb":10,"pro":24,"fat":51,"portionG":200,"enName":"Gochujang Pork Belly"},"고추장찌개":{"kcal":220,"carb":14,"pro":14,"fat":12,"portionG":400,"enName":"Gochujang Stew"},"골뱅이무침":{"kcal":190,"carb":18,"pro":21,"fat":4,"portionG":250,"enName":"Spicy Whelk Salad"},"곱창볶음":{"kcal":430,"carb":12,"pro":20,"fat":34,"portionG":200,"enName":"Stir-fried Beef Intestines"},"과카몰리":{"kcal":160,"carb":9,"pro":2,"fat":15,"portionG":100,"enName":"Guacamole"},"광동볶음면":{"kcal":480,"carb":72,"pro":14,"fat":15,"portionG":350,"enName":"Cantonese Stir-fried Noodles"},"광동식볶음밥":{"kcal":430,"carb":68,"pro":13,"fat":12,"portionG":300,"enName":"Cantonese Fried Rice"},"광동식탕수육":{"kcal":460,"carb":38,"pro":18,"fat":26,"portionG":200,"enName":"Cantonese Sweet and Sour Pork"},"교자":{"kcal":220,"carb":24,"pro":9,"fat":10,"portionG":120,"enName":"Gyoza"},"군만두":{"kcal":250,"carb":25,"pro":9,"fat":13,"portionG":120,"enName":"Pan-fried Dumplings"},"굴라이이칸":{"kcal":320,"carb":10,"pro":24,"fat":20,"portionG":300,"enName":"Gulai Ikan (Fish Curry)"},"궁중떡볶이":{"kcal":380,"carb":65,"pro":11,"fat":8,"portionG":250,"enName":"Royal Tteokbokki"},"귀벡":{"kcal":290,"carb":12,"pro":26,"fat":15,"portionG":350,"enName":"Güveç (Turkish Casserole)"},"규나베":{"kcal":390,"carb":14,"pro":28,"fat":25,"portionG":400,"enName":"Gyunabe (Beef Hot Pot)"},"규동":{"kcal":560,"carb":78,"pro":24,"fat":17,"portionG":400,"enName":"Gyudon (Beef Rice Bowl)"},"규카츠":{"kcal":380,"carb":18,"pro":26,"fat":23,"portionG":150,"enName":"Gyukatsu (Beef Cutlet)"},"그라탕":{"kcal":350,"carb":30,"pro":12,"fat":20,"portionG":250,"enName":"Gratin"},"그릭샐러드":{"kcal":160,"carb":9,"pro":5,"fat":13,"portionG":200,"enName":"Greek Salad"},"그릭요거트볼":{"kcal":210,"carb":18,"pro":12,"fat":10,"portionG":180,"enName":"Greek Yogurt Bowl"},"그린커리":{"kcal":360,"carb":14,"pro":20,"fat":25,"portionG":300,"enName":"Green Curry"},"그릴드연어":{"kcal":250,"carb":0.1,"pro":30,"fat":14,"portionG":150,"enName":"Grilled Salmon"},"기나탕마노크":{"kcal":260,"carb":10,"pro":28,"fat":12,"portionG":400,"enName":"Nilagang Manok (Filipino Chicken Soup)"},"기로스":{"kcal":390,"carb":6,"pro":28,"fat":28,"portionG":200,"enName":"Gyros"},"기로스피타":{"kcal":580,"carb":48,"pro":34,"fat":28,"portionG":300,"enName":"Gyros Pita"},"김밥":{"kcal":420,"carb":72,"pro":12,"fat":9,"portionG":300,"enName":"Gimbap"},"김치말이국수":{"kcal":410,"carb":82,"pro":11,"fat":4,"portionG":500,"enName":"Kimchi Wrapped Noodles"},"김치볶음밥":{"kcal":430,"carb":72,"pro":12,"fat":11,"portionG":300,"enName":"Kimchi Fried Rice"},"김치수제비":{"kcal":420,"carb":85,"pro":11,"fat":4,"portionG":500,"enName":"Kimchi Hand-torn Noodle Soup"},"김치전":{"kcal":240,"carb":32,"pro":5,"fat":10,"portionG":150,"enName":"Kimchi Pancake"},"김치찌개":{"kcal":210,"carb":8,"pro":18,"fat":12,"portionG":400,"enName":"Kimchi Stew"},"김치찜":{"kcal":250,"carb":12,"pro":19,"fat":14,"portionG":300,"enName":"Braised Kimchi"},"김치찜닭":{"kcal":380,"carb":18,"pro":32,"fat":20,"portionG":400,"enName":"Kimchi Braised Chicken"},"김치콩나물국":{"kcal":55,"carb":6,"pro":4,"fat":2,"portionG":350,"enName":"Kimchi Bean Sprout Soup"},"까르보나라":{"kcal":590,"carb":65,"pro":22,"fat":27,"portionG":350,"enName":"Carbonara"},"깍두기볶음밥":{"kcal":420,"carb":74,"pro":10,"fat":10,"portionG":300,"enName":"Kkakdugi Fried Rice"},"깐쇼새우":{"kcal":340,"carb":28,"pro":16,"fat":18,"portionG":200,"enName":"Gan Shao Shrimp"},"깐풍기":{"kcal":440,"carb":26,"pro":22,"fat":28,"portionG":200,"enName":"Gan Pung Chicken"},"깐풍새우":{"kcal":350,"carb":26,"pro":15,"fat":21,"portionG":200,"enName":"Gan Pung Shrimp"},"깻잎무침":{"kcal":25,"carb":3,"pro":1.5,"fat":0.8,"portionG":30,"enName":"Seasoned Perilla Leaves"},"깻잎장아찌":{"kcal":30,"carb":5,"pro":1,"fat":0.5,"portionG":30,"enName":"Pickled Perilla Leaves"},"껌가":{"kcal":510,"carb":70,"pro":28,"fat":13,"portionG":350,"enName":"Cơm gà"},"껌땀":{"kcal":590,"carb":75,"pro":32,"fat":18,"portionG":400,"enName":"Cơm tấm"},"껌스엉":{"kcal":570,"carb":72,"pro":30,"fat":18,"portionG":380,"enName":"Cơm sườn"},"껌찌엔":{"kcal":440,"carb":68,"pro":14,"fat":12,"portionG":300,"enName":"Cơm Chiên"},"꼬리곰탕":{"kcal":320,"carb":4,"pro":34,"fat":19,"portionG":500,"enName":"Oxtail Soup"},"꽁치김치찌개":{"kcal":290,"carb":9,"pro":24,"fat":17,"portionG":400,"enName":"Saury and Kimchi Stew"},"꽁치조림":{"kcal":280,"carb":10,"pro":22,"fat":16,"portionG":250,"enName":"Braised Saury"},"꽃게탕":{"kcal":210,"carb":12,"pro":24,"fat":7,"portionG":500,"enName":"Blue Crab Soup"},"꽃빵고추잡채":{"kcal":360,"carb":45,"pro":18,"fat":12,"portionG":250,"enName":"Flower Bun with Pepper Japchae"},"꾸아이티아오":{"kcal":420,"carb":78,"pro":16,"fat":5,"portionG":500,"enName":"Kuay Teow (Thai Noodle Soup)"},"꿔바로우":{"kcal":480,"carb":42,"pro":16,"fat":28,"portionG":200,"enName":"Guo Bao Rou (Sweet and Sour Pork)"},"나베":{"kcal":310,"carb":10,"pro":28,"fat":17,"portionG":400,"enName":"Nabe (Japanese Hot Pot)"},"나베야키우동":{"kcal":460,"carb":82,"pro":16,"fat":7,"portionG":500,"enName":"Nabeyaki Udon"},"나시고랭":{"kcal":460,"carb":68,"pro":15,"fat":14,"portionG":300,"enName":"Nasi Goreng"},"나시르막":{"kcal":580,"carb":75,"pro":16,"fat":24,"portionG":350,"enName":"Nasi Lemak"},"나시 미냑":{"kcal":490,"carb":70,"pro":10,"fat":19,"portionG":300,"enName":"Nasi Minyak (Fragrant Butter Rice)"},"나시빠당":{"kcal":620,"carb":72,"pro":26,"fat":25,"portionG":400,"enName":"Nasi Padang"},"나시우둑":{"kcal":440,"carb":68,"pro":9,"fat":14,"portionG":300,"enName":"Nasi Uduk"},"나시 참푸르":{"kcal":530,"carb":70,"pro":24,"fat":17,"portionG":350,"enName":"Nasi Jambal"},"나초":{"kcal":250,"carb":32,"pro":4,"fat":12,"portionG":50,"enName":"Nachos"},"나폴리탄":{"kcal":520,"carb":75,"pro":14,"fat":18,"portionG":350,"enName":"Napolitan (Ketchup Spaghetti)"},"낙지덮밥":{"kcal":490,"carb":82,"pro":22,"fat":8,"portionG":400,"enName":"Spicy Octopus Rice Bowl"},"낙지볶음":{"kcal":190,"carb":14,"pro":20,"fat":6,"portionG":200,"enName":"Stir-fried Spicy Octopus"},"낙지연포탕":{"kcal":130,"carb":8,"pro":18,"fat":3,"portionG":500,"enName":"Octopus Hot Pot"},"난자완스":{"kcal":340,"carb":14,"pro":22,"fat":22,"portionG":200,"enName":"Nanjing Meatballs"},"냉이된장국":{"kcal":60,"carb":6,"pro":4,"fat":2,"portionG":300,"enName":"Shepherd's Purse Doenjang Soup"},"냉이무침":{"kcal":40,"carb":4,"pro":2,"fat":1.8,"portionG":50,"enName":"Seasoned Shepherd's Purse"},"너비아니":{"kcal":320,"carb":10,"pro":24,"fat":20,"portionG":150,"enName":"Neobiani (Marinated Beef)"},"넴느엉 꾸온":{"kcal":240,"carb":28,"pro":16,"fat":7,"portionG":180,"enName":"Nem Nuong Cuon"},"넴 루이":{"kcal":290,"carb":8,"pro":20,"fat":20,"portionG":150,"enName":"Nem Lui (Vietnamese Lemongrass Pork Skewers)"},"녹두전":{"kcal":280,"carb":32,"pro":10,"fat":12,"portionG":150,"enName":"Mung Bean Pancake"},"뇨냐 커리":{"kcal":390,"carb":16,"pro":22,"fat":27,"portionG":300,"enName":"Nonya Curry"},"뇨키":{"kcal":320,"carb":52,"pro":7,"fat":10,"portionG":200,"enName":"Gnocchi"},"뇨키토마토":{"kcal":380,"carb":56,"pro":9,"fat":13,"portionG":300,"enName":"Gnocchi with Tomato Sauce"},"느타리버섯볶음":{"kcal":60,"carb":5,"pro":2,"fat":3.8,"portionG":80,"enName":"Stir-fried Oyster Mushrooms"},"닐라가":{"kcal":280,"carb":12,"pro":26,"fat":14,"portionG":400,"enName":"Nilaga (Filipino Boiled Beef)"},"니스와즈 샐러드":{"kcal":220,"carb":10,"pro":14,"fat":14,"portionG":250,"enName":"Niçoise Salad"},"니스 스타일 피자":{"kcal":390,"carb":40,"pro":14,"fat":19,"portionG":150,"enName":"Nice-style Pizza (Pissaladière)"},"니쿠우동":{"kcal":490,"carb":80,"pro":22,"fat":9,"portionG":500,"enName":"Niku Udon (Beef Udon)"},"니쿠자가":{"kcal":260,"carb":24,"pro":14,"fat":12,"portionG":250,"enName":"Nikujaga (Meat and Potato Stew)"},"다코라이스":{"kcal":510,"carb":70,"pro":22,"fat":15,"portionG":350,"enName":"Taco Rice"},"단호박수프":{"kcal":160,"carb":26,"pro":3,"fat":5,"portionG":250,"enName":"Butternut Squash Soup"},"달 마카니":{"kcal":280,"carb":28,"pro":10,"fat":14,"portionG":250,"enName":"Makhani Dal"},"달 채소 카레":{"kcal":210,"carb":26,"pro":8,"fat":8,"portionG":250,"enName":"Lentil Vegetable Curry"},"달 커리":{"kcal":190,"carb":24,"pro":9,"fat":6,"portionG":250,"enName":"Dal Curry"},"달 타르카":{"kcal":220,"carb":25,"pro":10,"fat":9,"portionG":250,"enName":"Dal Tadka"},"닭가슴살랩":{"kcal":320,"carb":26,"pro":26,"fat":12,"portionG":200,"enName":"Chicken Breast Wrap"},"닭가슴살샐러드":{"kcal":185,"carb":8,"pro":24,"fat":6,"portionG":250,"enName":"Chicken Breast Salad"},"닭가슴살요거트볼":{"kcal":240,"carb":22,"pro":20,"fat":7,"portionG":250,"enName":"Chicken Breast Yogurt Bowl"},"닭가슴살채소볶음":{"kcal":210,"carb":10,"pro":26,"fat":7,"portionG":200,"enName":"Chicken Breast and Vegetable Stir-fry"},"닭가슴살채소볶음밥":{"kcal":410,"carb":65,"pro":24,"fat":6,"portionG":300,"enName":"Chicken Breast Vegetable Fried Rice"},"닭가슴살카레":{"kcal":340,"carb":42,"pro":25,"fat":8,"portionG":300,"enName":"Chicken Breast Curry"},"닭가슴살현미볼":{"kcal":290,"carb":38,"pro":22,"fat":5,"portionG":200,"enName":"Chicken Breast Brown Rice Bowl"},"닭갈비":{"kcal":390,"carb":16,"pro":32,"fat":22,"portionG":250,"enName":"Dakgalbi (Spicy Stir-fried Chicken)"},"닭강정":{"kcal":540,"carb":45,"pro":24,"fat":30,"portionG":200,"enName":"Sweet Crispy Fried Chicken"},"닭개장":{"kcal":260,"carb":10,"pro":28,"fat":12,"portionG":500,"enName":"Spicy Chicken Soup"},"닭고기구이":{"kcal":240,"carb":1,"pro":28,"fat":14,"portionG":150,"enName":"Grilled Chicken"},"닭고기캐슈넛볶음":{"kcal":380,"carb":16,"pro":24,"fat":24,"portionG":200,"enName":"Chicken and Cashew Nut Stir-fry"},"닭곰탕":{"kcal":190,"carb":4,"pro":28,"fat":7,"portionG":500,"enName":"Chicken Broth Soup"},"닭볶음":{"kcal":280,"carb":10,"pro":26,"fat":15,"portionG":200,"enName":"Stir-fried Chicken"},"닭볶음탕":{"kcal":370,"carb":16,"pro":34,"fat":19,"portionG":350,"enName":"Braised Spicy Chicken"},"닭비빔막국수":{"kcal":540,"carb":84,"pro":24,"fat":12,"portionG":450,"enName":"Chicken Bibim Makguksu"},"닭육수면":{"kcal":430,"carb":75,"pro":20,"fat":5,"portionG":500,"enName":"Chicken Broth Noodles"},"닭죽":{"kcal":280,"carb":44,"pro":15,"fat":5,"portionG":350,"enName":"Chicken Porridge"},"닭한마리":{"kcal":340,"carb":12,"pro":38,"fat":15,"portionG":500,"enName":"Whole Chicken Hot Pot"},"대패삼겹살구이":{"kcal":490,"carb":1,"pro":22,"fat":45,"portionG":150,"enName":"Thinly Sliced Grilled Pork Belly"},"더덕구이":{"kcal":110,"carb":18,"pro":2,"fat":3.5,"portionG":100,"enName":"Grilled Deodeok Root"},"데리야키치킨":{"kcal":310,"carb":12,"pro":28,"fat":16,"portionG":180,"enName":"Teriyaki Chicken"},"도라지무침":{"kcal":65,"carb":12,"pro":1.5,"fat":1,"portionG":80,"enName":"Seasoned Bellflower Root"},"도사":{"kcal":290,"carb":48,"pro":6,"fat":8,"portionG":150,"enName":"Dosa"},"도토리묵무침":{"kcal":120,"carb":14,"pro":2,"fat":6,"portionG":200,"enName":"Seasoned Acorn Jelly"},"돈지루":{"kcal":180,"carb":8,"pro":12,"fat":11,"portionG":300,"enName":"Tonjiru (Pork Miso Soup)"},"돈카츠":{"kcal":410,"carb":18,"pro":24,"fat":28,"portionG":150,"enName":"Tonkatsu (Pork Cutlet)"},"돈코츠라멘":{"kcal":620,"carb":76,"pro":26,"fat":24,"portionG":600,"enName":"Tonkotsu Ramen"},"돌마데스":{"kcal":180,"carb":18,"pro":6,"fat":9,"portionG":150,"enName":"Dolmades"},"돌솥비빔밥":{"kcal":560,"carb":85,"pro":18,"fat":16,"portionG":450,"enName":"Stone Pot Bibimbap"},"동그랑땡":{"kcal":230,"carb":8,"pro":14,"fat":16,"portionG":120,"enName":"Pan-fried Meat and Tofu Patties"},"동태전":{"kcal":210,"carb":7,"pro":16,"fat":13,"portionG":120,"enName":"Pollock Pancake"},"동태찌개":{"kcal":160,"carb":8,"pro":20,"fat":5,"portionG":400,"enName":"Pollock Stew"},"동파육":{"kcal":510,"carb":8,"pro":22,"fat":44,"portionG":200,"enName":"Dongpo Pork (Braised Pork Belly)"},"돼지갈비찜":{"kcal":430,"carb":14,"pro":28,"fat":29,"portionG":250,"enName":"Braised Pork Ribs"},"돼지고기김치찌개":{"kcal":240,"carb":7,"pro":18,"fat":15,"portionG":400,"enName":"Pork and Kimchi Stew"},"돼지고기깻잎볶음":{"kcal":340,"carb":10,"pro":25,"fat":22,"portionG":200,"enName":"Stir-fried Pork with Perilla Leaves"},"돼지국밥":{"kcal":450,"carb":45,"pro":28,"fat":18,"portionG":600,"enName":"Pork Rice Soup"},"돼지불고기":{"kcal":320,"carb":12,"pro":24,"fat":19,"portionG":200,"enName":"Pork Bulgogi"},"된장비빔밥":{"kcal":460,"carb":76,"pro":15,"fat":10,"portionG":400,"enName":"Doenjang Bibimbap"},"된장삼겹살":{"kcal":480,"carb":4,"pro":22,"fat":42,"portionG":150,"enName":"Doenjang Pork Belly"},"된장찌개":{"kcal":130,"carb":9,"pro":9,"fat":6,"portionG":300,"enName":"Doenjang Stew (Fermented Soybean Paste Stew)"},"두루치기":{"kcal":350,"carb":11,"pro":24,"fat":23,"portionG":200,"enName":"Duruchigi (Stir-fried Pork)"},"두부김치":{"kcal":220,"carb":10,"pro":16,"fat":13,"portionG":250,"enName":"Tofu with Kimchi"},"두부미역국":{"kcal":75,"carb":4,"pro":6,"fat":4,"portionG":300,"enName":"Tofu and Seaweed Soup"},"두부버섯솥밥":{"kcal":410,"carb":72,"pro":14,"fat":7,"portionG":350,"enName":"Tofu and Mushroom Pot Rice"},"두부부침":{"kcal":140,"carb":3,"pro":10,"fat":10,"portionG":120,"enName":"Pan-fried Tofu"},"두부샐러드":{"kcal":130,"carb":8,"pro":9,"fat":7,"portionG":200,"enName":"Tofu Salad"},"두부스크램블에그":{"kcal":145,"carb":3,"pro":11,"fat":10,"portionG":150,"enName":"Tofu Scrambled Eggs"},"두부스테이크":{"kcal":180,"carb":10,"pro":12,"fat":10,"portionG":150,"enName":"Tofu Steak"},"두부스테이크테리야키":{"kcal":215,"carb":16,"pro":13,"fat":11,"portionG":180,"enName":"Tofu Steak Teriyaki"},"두부조림":{"kcal":150,"carb":7,"pro":11,"fat":8,"portionG":150,"enName":"Braised Tofu"},"두부채소볶음":{"kcal":140,"carb":8,"pro":10,"fat":8,"portionG":200,"enName":"Tofu and Vegetable Stir-fry"},"두부포케":{"kcal":390,"carb":54,"pro":15,"fat":12,"portionG":350,"enName":"Tofu Poke Bowl"},"두부현미볼":{"kcal":280,"carb":42,"pro":12,"fat":7,"portionG":200,"enName":"Tofu Brown Rice Bowl"},"들기름막국수":{"kcal":460,"carb":75,"pro":11,"fat":13,"portionG":350,"enName":"Perilla Oil Makguksu"},"들깨미역국":{"kcal":95,"carb":5,"pro":4,"fat":7,"portionG":300,"enName":"Perilla Seed and Seaweed Soup"},"들깨순두부찌개":{"kcal":180,"carb":8,"pro":12,"fat":11,"portionG":350,"enName":"Perilla Seed Soft Tofu Stew"},"들깨칼국수":{"kcal":480,"carb":78,"pro":13,"fat":12,"portionG":500,"enName":"Perilla Seed Knife-cut Noodle Soup"},"등갈비김치찜":{"kcal":420,"carb":11,"pro":32,"fat":27,"portionG":350,"enName":"Braised Back Ribs with Kimchi"},"등갈비찜":{"kcal":410,"carb":12,"pro":30,"fat":26,"portionG":300,"enName":"Braised Pork Back Ribs"},"딤섬":{"kcal":160,"carb":18,"pro":8,"fat":6,"portionG":90,"enName":"Dim Sum"},"떡갈비":{"kcal":320,"carb":14,"pro":22,"fat":20,"portionG":150,"enName":"Tteokgalbi (Grilled Meat Patties)"},"떡국":{"kcal":430,"carb":78,"pro":16,"fat":6,"portionG":500,"enName":"Tteokguk (Rice Cake Soup)"},"떡만두국":{"kcal":490,"carb":82,"pro":19,"fat":10,"portionG":550,"enName":"Rice Cake and Dumpling Soup"},"떡볶이":{"kcal":360,"carb":70,"pro":7,"fat":5,"portionG":250,"enName":"Tteokbokki (Spicy Rice Cakes)"},"토르티야 에스파뇰라":{"kcal":280,"carb":16,"pro":12,"fat":18,"portionG":200,"enName":"Tortilla Española (Spanish Omelette)"},"똠얌꿍":{"kcal":180,"carb":10,"pro":18,"fat":8,"portionG":400,"enName":"Tom Yum Kung"},"똠카가이":{"kcal":290,"carb":12,"pro":20,"fat":18,"portionG":400,"enName":"Tom Kha Gai"},"뚝배기불고기":{"kcal":390,"carb":22,"pro":28,"fat":21,"portionG":450,"enName":"Ttukbaegi Bulgogi (Hot Pot Bulgogi)"},"라따뚜이":{"kcal":130,"carb":14,"pro":3,"fat":7,"portionG":200,"enName":"Ratatouille"},"라브 무":{"kcal":240,"carb":6,"pro":22,"fat":14,"portionG":150,"enName":"Larb Moo"},"라볶이":{"kcal":450,"carb":85,"pro":10,"fat":7,"portionG":300,"enName":"Rabokki (Ramen and Tteokbokki)"},"라브 가이":{"kcal":210,"carb":5,"pro":24,"fat":10,"portionG":150,"enName":"Larb Gai (Thai Spicy Chicken Salad)"},"라이타":{"kcal":80,"carb":6,"pro":4,"fat":4,"portionG":120,"enName":"Raita"},"라자냐":{"kcal":480,"carb":36,"pro":26,"fat":25,"portionG":300,"enName":"Lasagna"},"라조기":{"kcal":420,"carb":24,"pro":22,"fat":26,"portionG":200,"enName":"Laziji (Sichuan Spicy Chicken)"},"라지마":{"kcal":230,"carb":32,"pro":11,"fat":6,"portionG":250,"enName":"Rajma (Red Kidney Bean Curry)"},"라페토":{"kcal":190,"carb":8,"pro":16,"fat":11,"portionG":150,"enName":"Laphet Thoke (Fermented Tea Leaf Salad)"},"라흐마준":{"kcal":380,"carb":42,"pro":18,"fat":15,"portionG":200,"enName":"Lahmacun (Turkish Pizza)"},"락사":{"kcal":520,"carb":68,"pro":22,"fat":18,"portionG":500,"enName":"Laksa"},"램 코르마":{"kcal":460,"carb":14,"pro":28,"fat":32,"portionG":300,"enName":"Lamb Korma"},"레드커리":{"kcal":380,"carb":15,"pro":18,"fat":26,"portionG":300,"enName":"Red Curry"},"르막 캄빙":{"kcal":490,"carb":12,"pro":26,"fat":37,"portionG":300,"enName":"Lemak Kambing (Goat Coconut Curry)"},"치킨 타욱":{"kcal":290,"carb":6,"pro":28,"fat":12,"portionG":180,"enName":"Lebanese Tawook"},"레촌카왈리":{"kcal":510,"carb":1,"pro":20,"fat":48,"portionG":150,"enName":"Lechon Kawali (Filipino Crispy Pork)"},"렌당":{"kcal":430,"carb":10,"pro":28,"fat":30,"portionG":250,"enName":"Rendang"},"렌틸수프":{"kcal":160,"carb":24,"pro":9,"fat":3,"portionG":250,"enName":"Lentil Soup"},"렌틸콩샐러드":{"kcal":180,"carb":22,"pro":8,"fat":6,"portionG":200,"enName":"Lentil Salad"},"로간 조쉬":{"kcal":420,"carb":12,"pro":28,"fat":28,"portionG":300,"enName":"Rogan Josh"},"로모 살타도":{"kcal":410,"carb":34,"pro":26,"fat":16,"portionG":300,"enName":"Lomo Saltado"},"로미에":{"kcal":390,"carb":65,"pro":16,"fat":7,"portionG":450,"enName":"Lomi (Filipino Noodle Soup)"},"로스트치킨":{"kcal":320,"carb":0,"pro":34,"fat":16,"portionG":200,"enName":"Roast Chicken"},"로제파스타":{"kcal":540,"carb":70,"pro":15,"fat":22,"portionG":350,"enName":"Rose Pasta (Creamy Tomato Pasta)"},"로티 차나이":{"kcal":310,"carb":36,"pro":6,"fat":15,"portionG":150,"enName":"Roti Canai"},"보 룩락":{"kcal":380,"carb":14,"pro":28,"fat":22,"portionG":250,"enName":"Bò Lúc Lắc (Vietnamese Shaking Beef)"},"롱가니사볶음밥":{"kcal":480,"carb":66,"pro":15,"fat":17,"portionG":300,"enName":"Longganisa Fried Rice"},"롱통":{"kcal":340,"carb":48,"pro":10,"fat":12,"portionG":350,"enName":"Lontong"},"룸피아":{"kcal":240,"carb":22,"pro":10,"fat":12,"portionG":120,"enName":"Lumpia (Filipino Spring Rolls)"},"리가토니 알라 보드카":{"kcal":510,"carb":68,"pro":14,"fat":19,"portionG":350,"enName":"Rigatoni alla Vodka"},"리볼리타":{"kcal":210,"carb":28,"pro":8,"fat":7,"portionG":350,"enName":"Ribollita"},"리조또":{"kcal":410,"carb":62,"pro":11,"fat":13,"portionG":300,"enName":"Risotto"},"립아이 스테이크":{"kcal":460,"carb":0,"pro":38,"fat":34,"portionG":200,"enName":"Ribeye Steak"},"마늘새우볶음":{"kcal":230,"carb":6,"pro":18,"fat":15,"portionG":150,"enName":"Garlic Shrimp Stir-fry"},"마늘종볶음":{"kcal":50,"carb":6,"pro":1,"fat":2.5,"portionG":60,"enName":"Stir-fried Garlic Scapes"},"마라두부":{"kcal":280,"carb":12,"pro":14,"fat":20,"portionG":250,"enName":"Mala Tofu"},"마라라면":{"kcal":540,"carb":78,"pro":11,"fat":20,"portionG":500,"enName":"Mala Ramen"},"마라샹궈":{"kcal":480,"carb":18,"pro":24,"fat":36,"portionG":300,"enName":"Mala Xiangguo (Mala Dry Pot)"},"마라탕":{"kcal":420,"carb":25,"pro":22,"fat":26,"portionG":500,"enName":"Mala Tang (Spicy Hot Pot)"},"마르게리타피자":{"kcal":430,"carb":48,"pro":16,"fat":19,"portionG":180,"enName":"Margherita Pizza"},"마삭 메라":{"kcal":390,"carb":14,"pro":26,"fat":25,"portionG":250,"enName":"Masak Merah (Red Cooked Chicken)"},"마싸만 커리":{"kcal":420,"carb":18,"pro":20,"fat":30,"portionG":300,"enName":"Massaman Curry"},"마제소바":{"kcal":580,"carb":82,"pro":21,"fat":18,"portionG":400,"enName":"Mazesoba (Mixed Noodles)"},"마카로니샐러드":{"kcal":220,"carb":18,"pro":3,"fat":15,"portionG":100,"enName":"Macaroni Salad"},"마크부스":{"kcal":520,"carb":72,"pro":26,"fat":14,"portionG":350,"enName":"Machboos (Spiced Meat and Rice)"},"마클루베":{"kcal":540,"carb":75,"pro":24,"fat":16,"portionG":350,"enName":"Maqluba (Upside-down Rice)"},"마파가지":{"kcal":190,"carb":14,"pro":4,"fat":14,"portionG":200,"enName":"Mapo Eggplant"},"마파두부":{"kcal":240,"carb":10,"pro":14,"fat":16,"portionG":250,"enName":"Mapo Tofu"},"마파두부덮밥":{"kcal":490,"carb":75,"pro":19,"fat":18,"portionG":400,"enName":"Mapo Tofu Rice Bowl"},"막국수":{"kcal":460,"carb":85,"pro":12,"fat":6,"portionG":450,"enName":"Makguksu (Buckwheat Noodles)"},"만사프":{"kcal":640,"carb":78,"pro":34,"fat":22,"portionG":400,"enName":"Mansaf (Jordanian Lamb and Rice)"},"만트":{"kcal":290,"carb":36,"pro":12,"fat":10,"portionG":150,"enName":"Manti (Central Asian Dumplings)"},"말라이 코프타":{"kcal":320,"carb":24,"pro":8,"fat":21,"portionG":250,"enName":"Malai Kofta"},"망고 스티키 라이스":{"kcal":360,"carb":72,"pro":4,"fat":6,"portionG":200,"enName":"Mango Sticky Rice"},"매시드포테이토":{"kcal":160,"carb":18,"pro":2,"fat":9,"portionG":150,"enName":"Mashed Potatoes"},"매운탕":{"kcal":210,"carb":10,"pro":26,"fat":7,"portionG":500,"enName":"Spicy Fish Stew"},"무자다라":{"kcal":380,"carb":68,"pro":11,"fat":7,"portionG":300,"enName":"Mujaddara (Lentil and Rice)"},"메네멘":{"kcal":210,"carb":8,"pro":12,"fat":14,"portionG":200,"enName":"Menemen (Turkish Egg and Tomato)"},"메르지메크 초르바":{"kcal":140,"carb":20,"pro":8,"fat":3,"portionG":250,"enName":"Mercimek Çorbası (Turkish Lentil Soup)"},"메밀소바샐러드":{"kcal":290,"carb":54,"pro":9,"fat":4,"portionG":300,"enName":"Soba Noodle Salad"},"메추리알장조림":{"kcal":95,"carb":5,"pro":9,"fat":4.5,"portionG":80,"enName":"Braised Quail Eggs"},"멕시칸라이스":{"kcal":420,"carb":72,"pro":9,"fat":10,"portionG":300,"enName":"Mexican Rice"},"타말레":{"kcal":280,"carb":28,"pro":9,"fat":15,"portionG":180,"enName":"Tamale"},"멕시코 콩 스튜":{"kcal":220,"carb":34,"pro":11,"fat":4,"portionG":300,"enName":"Mexican Bean Stew"},"멘보샤":{"kcal":340,"carb":20,"pro":8,"fat":25,"portionG":100,"enName":"Menbosha (Shrimp Toast)"},"멘치카츠":{"kcal":390,"carb":22,"pro":16,"fat":26,"portionG":150,"enName":"Menchi Katsu (Ground Meat Cutlet)"},"멸치볶음":{"kcal":70,"carb":4,"pro":5,"fat":3.5,"portionG":30,"enName":"Stir-fried Dried Anchovies"},"명란 오니기리":{"kcal":260,"carb":48,"pro":7,"fat":4,"portionG":150,"enName":"Mentaiko Onigiri"},"모야시라멘":{"kcal":440,"carb":72,"pro":14,"fat":10,"portionG":500,"enName":"Moyashi Ramen (Bean Sprout Ramen)"},"모힝가":{"kcal":360,"carb":58,"pro":18,"fat":6,"portionG":450,"enName":"Mohinga (Myanmar Fish Noodle Soup)"},"목살구이":{"kcal":290,"carb":0,"pro":28,"fat":19,"portionG":150,"enName":"Grilled Pork Neck"},"무나물":{"kcal":35,"carb":4,"pro":0.8,"fat":1.8,"portionG":60,"enName":"Seasoned Radish"},"무사카":{"kcal":380,"carb":22,"pro":20,"fat":24,"portionG":300,"enName":"Moussaka"},"무생채":{"kcal":25,"carb":4,"pro":0.5,"fat":0.2,"portionG":60,"enName":"Spicy Radish Salad"},"무이판":{"kcal":460,"carb":70,"pro":14,"fat":13,"portionG":300,"enName":"Mui Fan (Cantonese Sauce Rice)"},"무조림":{"kcal":60,"carb":9,"pro":1,"fat":2.2,"portionG":100,"enName":"Braised Radish"},"무채국":{"kcal":450,"carb":4,"pro":3,"fat":2,"portionG":300,"enName":"Shredded Radish Soup"},"모케카":{"kcal":360,"carb":12,"pro":24,"fat":24,"portionG":350,"enName":"Moqueca (Brazilian Fish Stew)"},"묵사발":{"kcal":140,"carb":24,"pro":4,"fat":3,"portionG":400,"enName":"Muk Sabal (Jelly in Broth)"},"묵은지등갈비찜":{"kcal":440,"carb":12,"pro":32,"fat":29,"portionG":350,"enName":"Braised Back Ribs with Aged Kimchi"},"묵은지삼겹살":{"kcal":540,"carb":6,"pro":22,"fat":48,"portionG":250,"enName":"Aged Kimchi Pork Belly"},"물냉면":{"kcal":380,"carb":82,"pro":11,"fat":2,"portionG":550,"enName":"Mul Naengmyeon (Cold Noodles in Broth)"},"물만두":{"kcal":210,"carb":22,"pro":9,"fat":9,"portionG":120,"enName":"Boiled Dumplings"},"미고랭":{"kcal":480,"carb":72,"pro":11,"fat":16,"portionG":300,"enName":"Mi Goreng"},"미고랭 말레이":{"kcal":490,"carb":70,"pro":13,"fat":17,"portionG":300,"enName":"Mee Goreng Mamak"},"미고렝 마막":{"kcal":510,"carb":68,"pro":15,"fat":20,"portionG":300,"enName":"Mee Goreng Mamak"},"미꽝":{"kcal":420,"carb":65,"pro":18,"fat":10,"portionG":450,"enName":"Mi Quang (Vietnamese Turmeric Noodles)"},"미네스트로네 수프":{"kcal":120,"carb":18,"pro":4,"fat":3.5,"portionG":250,"enName":"Minestrone"},"미소국":{"kcal":40,"carb":4,"pro":3,"fat":1,"portionG":200,"enName":"Miso Soup"},"미소라멘":{"kcal":520,"carb":75,"pro":18,"fat":16,"portionG":500,"enName":"Miso Ramen"},"미소버터라멘":{"kcal":590,"carb":76,"pro":19,"fat":23,"portionG":520,"enName":"Miso Butter Ramen"},"미소시루":{"kcal":40,"carb":4,"pro":3,"fat":1,"portionG":200,"enName":"Miso Shiru"},"미시암":{"kcal":430,"carb":68,"pro":15,"fat":11,"portionG":350,"enName":"Mee Siam"},"미싸오":{"kcal":460,"carb":65,"pro":14,"fat":16,"portionG":300,"enName":"Mee Sao (Crispy Noodles)"},"미역국":{"kcal":65,"carb":3,"pro":4,"fat":4.5,"portionG":300,"enName":"Seaweed Soup"},"미역냉국":{"kcal":35,"carb":6,"pro":1,"fat":0.5,"portionG":300,"enName":"Cold Seaweed Soup"},"미역줄기볶음":{"kcal":45,"carb":4,"pro":1.2,"fat":2.8,"portionG":60,"enName":"Stir-fried Seaweed Stems"},"미트볼":{"kcal":290,"carb":10,"pro":18,"fat":20,"portionG":150,"enName":"Meatballs"},"미트볼스파게티":{"kcal":580,"carb":75,"pro":24,"fat":20,"portionG":400,"enName":"Meatball Spaghetti"},"미트볼파스타":{"kcal":580,"carb":75,"pro":24,"fat":20,"portionG":400,"enName":"Meatball Pasta"},"미폭":{"kcal":410,"carb":62,"pro":16,"fat":11,"portionG":450,"enName":"Mi Pok Noodles (Singapore Dry Noodles)"},"바바 가누쉬":{"kcal":140,"carb":8,"pro":2,"fat":11,"portionG":100,"enName":"Baba Ganoush"},"바스틸라":{"kcal":420,"carb":45,"pro":18,"fat":18,"portionG":200,"enName":"Bastilla (Moroccan Pigeon Pie)"},"바오즈":{"kcal":340,"carb":48,"pro":12,"fat":11,"portionG":160,"enName":"Baozi (Steamed Buns)"},"바지락칼국수":{"kcal":460,"carb":82,"pro":15,"fat":4,"portionG":500,"enName":"Clam Knife-cut Noodle Soup"},"바지락탕":{"kcal":70,"carb":3,"pro":10,"fat":1.5,"portionG":400,"enName":"Clam Soup"},"바질페스토파스타":{"kcal":490,"carb":65,"pro":11,"fat":21,"portionG":320,"enName":"Basil Pesto Pasta"},"바쿠테":{"kcal":390,"carb":6,"pro":34,"fat":26,"portionG":450,"enName":"Bak Kut Teh (Pork Rib Soup)"},"박소":{"kcal":360,"carb":42,"pro":18,"fat":13,"portionG":400,"enName":"Bak So"},"반꾸온":{"kcal":280,"carb":42,"pro":10,"fat":8,"portionG":200,"enName":"Banh Cuon (Vietnamese Steamed Rice Rolls)"},"반미":{"kcal":430,"carb":54,"pro":16,"fat":16,"portionG":200,"enName":"Banh Mi"},"반 보 팟 찬":{"kcal":420,"carb":65,"pro":22,"fat":8,"portionG":350,"enName":"Banh Bo Phong Chien (Vietnamese Honeycomb Cake)"},"반쎄오":{"kcal":390,"carb":44,"pro":14,"fat":17,"portionG":250,"enName":"Banh Xeo (Vietnamese Sizzling Crepe)"},"반 팃 느엉":{"kcal":490,"carb":68,"pro":22,"fat":14,"portionG":380,"enName":"Banh Thit Nuong (Vietnamese Grilled Pork Sandwich)"},"배추된장국":{"kcal":55,"carb":7,"pro":3.5,"fat":1.5,"portionG":300,"enName":"Napa Cabbage Doenjang Soup"},"배추전":{"kcal":190,"carb":24,"pro":3,"fat":9,"portionG":150,"enName":"Napa Cabbage Pancake"},"버섯굴소스볶음":{"kcal":85,"carb":8,"pro":3,"fat":4.5,"portionG":120,"enName":"Mushroom and Oyster Sauce Stir-fry"},"버섯리조또":{"kcal":390,"carb":58,"pro":10,"fat":13,"portionG":300,"enName":"Mushroom Risotto"},"버섯 벨루테":{"kcal":160,"carb":14,"pro":4,"fat":10,"portionG":250,"enName":"Mushroom Velouté"},"버섯볶음":{"kcal":55,"carb":4,"pro":2,"fat":3.5,"portionG":80,"enName":"Stir-fried Mushrooms"},"버섯솥밥":{"kcal":390,"carb":74,"pro":9,"fat":6,"portionG":350,"enName":"Mushroom Pot Rice"},"버섯전":{"kcal":170,"carb":16,"pro":4,"fat":10,"portionG":120,"enName":"Mushroom Pancake"},"버섯크림리조또":{"kcal":450,"carb":58,"pro":11,"fat":19,"portionG":320,"enName":"Mushroom Cream Risotto"},"버터 세이지 뇨키":{"kcal":380,"carb":48,"pro":6,"fat":18,"portionG":220,"enName":"Butter Sage Gnocchi"},"버터치킨":{"kcal":390,"carb":12,"pro":24,"fat":27,"portionG":250,"enName":"Butter Chicken"},"버터치킨커리":{"kcal":390,"carb":12,"pro":24,"fat":27,"portionG":250,"enName":"Butter Chicken Curry"},"베이징덕":{"kcal":410,"carb":2,"pro":26,"fat":34,"portionG":150,"enName":"Peking Duck"},"베이컨에그스크램블":{"kcal":280,"carb":2,"pro":16,"fat":23,"portionG":150,"enName":"Bacon and Egg Scramble"},"병아리콩 샐러드":{"kcal":190,"carb":22,"pro":8,"fat":8,"portionG":200,"enName":"Chickpea Salad"},"보렉":{"kcal":340,"carb":38,"pro":10,"fat":16,"portionG":150,"enName":"Börek (Turkish Pastry)"},"보비아":{"kcal":210,"carb":26,"pro":8,"fat":8,"portionG":150,"enName":"Bo Bia (Vietnamese Rice Paper Rolls)"},"보쌈":{"kcal":520,"carb":2,"pro":28,"fat":45,"portionG":250,"enName":"Bossam (Steamed Pork Wraps)"},"보코":{"kcal":390,"carb":16,"pro":28,"fat":24,"portionG":350,"enName":"Boko"},"볶음짬뽕":{"kcal":580,"carb":84,"pro":24,"fat":16,"portionG":450,"enName":"Stir-fried Jjamppong"},"볼로네제파스타":{"kcal":540,"carb":70,"pro":22,"fat":19,"portionG":380,"enName":"Bolognese Pasta"},"봉골레파스타":{"kcal":470,"carb":66,"pro":16,"fat":15,"portionG":350,"enName":"Vongole Pasta (Clam Pasta)"},"뵈프엔다우브":{"kcal":360,"carb":12,"pro":28,"fat":22,"portionG":300,"enName":"Boeuf en Daube (French Beef Stew)"},"부대찌개":{"kcal":340,"carb":12,"pro":20,"fat":24,"portionG":450,"enName":"Budae Jjigae (Army Stew)"},"부리또":{"kcal":540,"carb":58,"pro":24,"fat":23,"portionG":300,"enName":"Burrito"},"부야베스":{"kcal":260,"carb":14,"pro":28,"fat":10,"portionG":450,"enName":"Bouillabaisse"},"부채살스테이크":{"kcal":390,"carb":0,"pro":38,"fat":26,"portionG":200,"enName":"Flat Iron Steak"},"부추계란볶음":{"kcal":165,"carb":4,"pro":10,"fat":12,"portionG":150,"enName":"Chive and Egg Stir-fry"},"부추김치":{"kcal":25,"carb":4,"pro":1,"fat":0.2,"portionG":50,"enName":"Chive Kimchi"},"부추전":{"kcal":220,"carb":32,"pro":4,"fat":8.5,"portionG":150,"enName":"Chive Pancake"},"부타네기야키":{"kcal":320,"carb":6,"pro":22,"fat":23,"portionG":180,"enName":"Buta Negi Yaki (Pork and Green Onion Grill)"},"부타네기폰즈":{"kcal":290,"carb":5,"pro":22,"fat":20,"portionG":180,"enName":"Buta Negi Ponzu"},"부타동":{"kcal":580,"carb":76,"pro":24,"fat":20,"portionG":400,"enName":"Butadon (Pork Rice Bowl)"},"부타카쿠니":{"kcal":460,"carb":10,"pro":22,"fat":38,"portionG":200,"enName":"Buta Kakuni (Braised Pork Belly)"},"부타킴치":{"kcal":320,"carb":8,"pro":21,"fat":22,"portionG":200,"enName":"Buta Kimchi (Pork and Kimchi Stir-fry)"},"북어국":{"kcal":90,"carb":2,"pro":12,"fat":3.8,"portionG":300,"enName":"Dried Pollack Soup"},"북어무침":{"kcal":85,"carb":8,"pro":11,"fat":1,"portionG":60,"enName":"Seasoned Dried Pollack"},"북어해장국":{"kcal":110,"carb":3,"pro":14,"fat":4.2,"portionG":350,"enName":"Dried Pollack Hangover Soup"},"분보후에":{"kcal":480,"carb":68,"pro":24,"fat":12,"portionG":500,"enName":"Bun Bo Hue (Spicy Beef Noodle Soup)"},"분짜":{"kcal":520,"carb":72,"pro":24,"fat":15,"portionG":400,"enName":"Bun Cha (Vietnamese Grilled Pork Noodles)"},"분팃느엉":{"kcal":490,"carb":68,"pro":22,"fat":14,"portionG":380,"enName":"Bun Thit Nuong (Grilled Pork Noodle Bowl)"},"불고기덮밥":{"kcal":540,"carb":78,"pro":25,"fat":14,"portionG":400,"enName":"Bulgogi Rice Bowl"},"불고기전골":{"kcal":290,"carb":16,"pro":24,"fat":14,"portionG":350,"enName":"Bulgogi Hot Pot"},"불라로":{"kcal":380,"carb":8,"pro":36,"fat":22,"portionG":500,"enName":"Bulalo (Filipino Bone Marrow Soup)"},"브로콜리두부무침":{"kcal":85,"carb":5,"pro":6,"fat":4.5,"portionG":100,"enName":"Broccoli and Tofu Salad"},"브로콜리치즈수프":{"kcal":190,"carb":14,"pro":6,"fat":12,"portionG":250,"enName":"Broccoli Cheese Soup"},"브루스케타":{"kcal":210,"carb":24,"pro":5,"fat":10,"portionG":120,"enName":"Bruschetta"},"브리암":{"kcal":150,"carb":16,"pro":3,"fat":8,"portionG":250,"enName":"Briam (Greek Roasted Vegetables)"},"블랙페퍼크랩":{"kcal":320,"carb":18,"pro":26,"fat":16,"portionG":300,"enName":"Black Pepper Crab"},"비가 탄면":{"kcal":560,"carb":75,"pro":18,"fat":21,"portionG":450,"enName":"Binatog (Filipino Corn Snack)"},"비나고옹안":{"kcal":340,"carb":14,"pro":24,"fat":21,"portionG":300,"enName":"Binagooonaan (Filipino Pork in Shrimp Paste)"},"비리야니":{"kcal":510,"carb":72,"pro":22,"fat":15,"portionG":350,"enName":"Biryani"},"비빔국수":{"kcal":490,"carb":84,"pro":11,"fat":11,"portionG":400,"enName":"Bibim Guksu (Spicy Mixed Noodles)"},"비빔냉면":{"kcal":480,"carb":88,"pro":12,"fat":8,"portionG":500,"enName":"Bibim Naengmyeon (Spicy Cold Noodles)"},"비빔밥":{"kcal":530,"carb":84,"pro":17,"fat":14,"portionG":450,"enName":"Bibimbap"},"비지찌개":{"kcal":210,"carb":10,"pro":14,"fat":12,"portionG":350,"enName":"Biji Jjigae (Soybean Pulp Stew)"},"비콜익스프레스":{"kcal":420,"carb":8,"pro":20,"fat":35,"portionG":250,"enName":"Bicol Express"},"비트샐러드":{"kcal":110,"carb":12,"pro":2,"fat":6,"portionG":180,"enName":"Beet Salad"},"비프렌당":{"kcal":430,"carb":10,"pro":28,"fat":30,"portionG":250,"enName":"Beef Rendang"},"비프부르기뇽":{"kcal":380,"carb":12,"pro":28,"fat":24,"portionG":300,"enName":"Boeuf Bourguignon"},"비프스튜":{"kcal":310,"carb":14,"pro":24,"fat":17,"portionG":300,"enName":"Beef Stew"},"비프웰링턴":{"kcal":490,"carb":22,"pro":26,"fat":33,"portionG":200,"enName":"Beef Wellington"},"비프타코":{"kcal":380,"carb":32,"pro":20,"fat":19,"portionG":200,"enName":"Beef Taco"},"빈달루":{"kcal":360,"carb":14,"pro":22,"fat":24,"portionG":250,"enName":"Vindaloo"},"빈대떡":{"kcal":290,"carb":30,"pro":10,"fat":14,"portionG":150,"enName":"Bindaetteok (Mung Bean Pancake)"},"빠에야":{"kcal":520,"carb":70,"pro":24,"fat":16,"portionG":350,"enName":"Paella"},"뿌팟퐁 커리":{"kcal":430,"carb":22,"pro":18,"fat":30,"portionG":300,"enName":"Poo Pad Pong Curry"},"사르수엘라":{"kcal":290,"carb":15,"pro":26,"fat":14,"portionG":450,"enName":"Zarzuela (Spanish Seafood Stew)"},"사모사":{"kcal":280,"carb":34,"pro":5,"fat":14,"portionG":120,"enName":"Samosa"},"사바미소니":{"kcal":320,"carb":8,"pro":24,"fat":21,"portionG":200,"enName":"Saba Misoni (Mackerel Simmered in Miso)"},"사유르 로데":{"kcal":240,"carb":16,"pro":5,"fat":17,"portionG":300,"enName":"Sayur Lodeh (Vegetable Coconut Milk Soup)"},"사유르 아셈":{"kcal":130,"carb":18,"pro":4,"fat":4.5,"portionG":350,"enName":"Sayur Asam (Tamarind Vegetable Soup)"},"사케동":{"kcal":520,"carb":68,"pro":28,"fat":12,"portionG":350,"enName":"Sake Don (Salmon Rice Bowl)"},"사케 미소즈케":{"kcal":260,"carb":4,"pro":26,"fat":15,"portionG":150,"enName":"Sake Miso Zuke (Miso-marinated Salmon)"},"사테 아얌":{"kcal":280,"carb":8,"pro":24,"fat":16,"portionG":150,"enName":"Satay Ayam (Chicken Satay)"},"샤히 파니르":{"kcal":340,"carb":14,"pro":12,"fat":26,"portionG":250,"enName":"Saag Paneer"},"산채비빔밥":{"kcal":480,"carb":82,"pro":14,"fat":9,"portionG":450,"enName":"Wild Greens Bibimbap"},"살모레호":{"kcal":190,"carb":18,"pro":4,"fat":11,"portionG":250,"enName":"Salmorejo"},"살사소스":{"kcal":40,"carb":8,"pro":1,"fat":0.2,"portionG":100,"enName":"Salsa Sauce"},"살치살 스테이크":{"kcal":440,"carb":0,"pro":34,"fat":32,"portionG":200,"enName":"Skirt Steak"},"살팀보카":{"kcal":360,"carb":4,"pro":28,"fat":25,"portionG":180,"enName":"Saltimbocca"},"삼겹살구이":{"kcal":470,"carb":0,"pro":22,"fat":42,"portionG":150,"enName":"Grilled Pork Belly (Samgyeopsal)"},"삼겹살김치찜":{"kcal":490,"carb":11,"pro":24,"fat":38,"portionG":350,"enName":"Braised Pork Belly with Kimchi"},"삼계탕":{"kcal":680,"carb":15,"pro":65,"fat":38,"portionG":800,"enName":"Samgyetang (Ginseng Chicken Soup)"},"삼발새우":{"kcal":260,"carb":12,"pro":22,"fat":13,"portionG":200,"enName":"Sambal Shrimp"},"삼발 우당":{"kcal":260,"carb":12,"pro":22,"fat":13,"portionG":200,"enName":"Sambal Udang"},"삼발 켄팅":{"kcal":210,"carb":24,"pro":4,"fat":11,"portionG":180,"enName":"Sambal Kentang (Potato Sambal)"},"삼발 템페":{"kcal":290,"carb":18,"pro":14,"fat":18,"portionG":150,"enName":"Sambal Tempeh"},"삼선볶음밥":{"kcal":460,"carb":68,"pro":18,"fat":12,"portionG":300,"enName":"Three Delicacies Fried Rice"},"삼치구이":{"kcal":260,"carb":0.2,"pro":29,"fat":15,"portionG":150,"enName":"Grilled Spanish Mackerel"},"삼치조림":{"kcal":290,"carb":10,"pro":30,"fat":13,"portionG":250,"enName":"Braised Spanish Mackerel"},"새우마살라":{"kcal":280,"carb":14,"pro":18,"fat":16,"portionG":250,"enName":"Prawn Masala"},"새우볶음밥":{"kcal":430,"carb":66,"pro":16,"fat":11,"portionG":300,"enName":"Shrimp Fried Rice"},"새우완탕":{"kcal":180,"carb":16,"pro":14,"fat":6,"portionG":350,"enName":"Shrimp Wonton"},"새우완탕면":{"kcal":410,"carb":68,"pro":20,"fat":8,"portionG":500,"enName":"Shrimp Wonton Noodles"},"샌드위치":{"kcal":360,"carb":34,"pro":14,"fat":18,"portionG":180,"enName":"Sandwich"},"생선국수":{"kcal":380,"carb":64,"pro":22,"fat":4,"portionG":500,"enName":"Fish Noodle Soup"},"샤브샤브":{"kcal":340,"carb":12,"pro":32,"fat":16,"portionG":400,"enName":"Shabu-Shabu"},"샤오롱바오":{"kcal":290,"carb":32,"pro":13,"fat":12,"portionG":150,"enName":"Xiaolongbao (Soup Dumplings)"},"샤와르마":{"kcal":490,"carb":42,"pro":28,"fat":22,"portionG":250,"enName":"Shawarma"},"샥슈카":{"kcal":230,"carb":14,"pro":11,"fat":14,"portionG":250,"enName":"Shakshuka"},"샨 누들":{"kcal":420,"carb":62,"pro":18,"fat":10,"portionG":400,"enName":"Shan Noodles (Myanmar)"},"설렁탕":{"kcal":240,"carb":4,"pro":28,"fat":12,"portionG":550,"enName":"Seolleongtang (Ox Bone Soup)"},"세비체":{"kcal":140,"carb":7,"pro":19,"fat":3,"portionG":200,"enName":"Classic Ceviche"},"소갈비구이":{"kcal":460,"carb":6,"pro":26,"fat":36,"portionG":200,"enName":"Grilled Beef Short Ribs"},"소고기덮밥":{"kcal":560,"carb":76,"pro":24,"fat":17,"portionG":400,"enName":"Beef Rice Bowl"},"소고기뭇국":{"kcal":110,"carb":4,"pro":12,"fat":5,"portionG":300,"enName":"Beef and Radish Soup"},"소고기미역국":{"kcal":130,"carb":3,"pro":14,"fat":7,"portionG":300,"enName":"Beef Seaweed Soup"},"소고기볶음":{"kcal":320,"carb":10,"pro":26,"fat":19,"portionG":200,"enName":"Stir-fried Beef"},"소고기브로콜리볶음":{"kcal":280,"carb":11,"pro":24,"fat":15,"portionG":220,"enName":"Beef and Broccoli Stir-fry"},"소고기장조림":{"kcal":110,"carb":4,"pro":14,"fat":4,"portionG":80,"enName":"Soy-braised Beef"},"소고기죽":{"kcal":240,"carb":38,"pro":12,"fat":4.5,"portionG":350,"enName":"Beef Porridge"},"소불고기":{"kcal":290,"carb":14,"pro":24,"fat":15,"portionG":200,"enName":"Beef Bulgogi"},"소토 아얌":{"kcal":260,"carb":12,"pro":22,"fat":13,"portionG":400,"enName":"Soto Ayam (Indonesian Chicken Soup)"},"소파 데 리마":{"kcal":210,"carb":16,"pro":14,"fat":9,"portionG":350,"enName":"Sopa de Lima (Mexican Lime Soup)"},"소파 데 피데오":{"kcal":240,"carb":34,"pro":8,"fat":8,"portionG":350,"enName":"Sopa de Fideo (Mexican Noodle Soup)"},"소파 카스텔라나":{"kcal":260,"carb":24,"pro":10,"fat":14,"portionG":300,"enName":"Sopa Castellana (Spanish Garlic Soup)"},"솔 뫼니에르":{"kcal":270,"carb":12,"pro":22,"fat":14,"portionG":180,"enName":"Sole Meunière"},"솔랸카":{"kcal":280,"carb":10,"pro":18,"fat":18,"portionG":400,"enName":"Solyanka (Russian Sour Soup)"},"쏨땀":{"kcal":110,"carb":16,"pro":3,"fat":4,"portionG":200,"enName":"Som Tam (Green Papaya Salad)"},"쇼유라멘":{"kcal":430,"carb":70,"pro":16,"fat":9,"portionG":500,"enName":"Shoyu Ramen"},"수블라키":{"kcal":260,"carb":4,"pro":26,"fat":15,"portionG":160,"enName":"Souvlaki"},"수육":{"kcal":340,"carb":0,"pro":26,"fat":25,"portionG":150,"enName":"Suyuk (Boiled Pork Slices)"},"수제비":{"kcal":410,"carb":82,"pro":11,"fat":4,"portionG":500,"enName":"Sujebi (Hand-torn Noodle Soup)"},"수프카레":{"kcal":290,"carb":16,"pro":18,"fat":16,"portionG":350,"enName":"Soup Curry"},"숙주나물":{"kcal":30,"carb":3,"pro":1.5,"fat":1.2,"portionG":60,"enName":"Seasoned Bean Sprouts"},"순대국밥":{"kcal":480,"carb":52,"pro":26,"fat":18,"portionG":600,"enName":"Sundae Gukbap (Blood Sausage Rice Soup)"},"순대볶음":{"kcal":390,"carb":42,"pro":14,"fat":18,"portionG":250,"enName":"Stir-fried Sundae"},"순댓국":{"kcal":340,"carb":8,"pro":24,"fat":23,"portionG":500,"enName":"Sundaeguk (Blood Sausage Soup)"},"순두부찌개":{"kcal":160,"carb":6,"pro":12,"fat":10,"portionG":350,"enName":"Sundubu Jjigae (Soft Tofu Stew)"},"쉬쉬 타욱":{"kcal":240,"carb":4,"pro":26,"fat":13,"portionG":160,"enName":"Shish Taouk (Lebanese Chicken Skewers)"},"슈마이":{"kcal":210,"carb":22,"pro":10,"fat":9,"portionG":125,"enName":"Shumai"},"스코르달리아":{"kcal":180,"carb":18,"pro":2,"fat":11,"portionG":100,"enName":"Skordalia (Greek Garlic Sauce)"},"스크램블에그":{"kcal":180,"carb":1.5,"pro":12,"fat":14,"portionG":120,"enName":"Scrambled Eggs"},"스키야키":{"kcal":380,"carb":18,"pro":24,"fat":22,"portionG":350,"enName":"Sukiyaki"},"스테이크":{"kcal":420,"carb":0,"pro":32,"fat":31,"portionG":200,"enName":"Steak"},"스티파도":{"kcal":360,"carb":14,"pro":24,"fat":21,"portionG":300,"enName":"Stifado (Greek Beef Stew)"},"스팀보트":{"kcal":290,"carb":12,"pro":26,"fat":14,"portionG":400,"enName":"Steamboat (Hot Pot)"},"스파나코리조":{"kcal":280,"carb":44,"pro":6,"fat":8,"portionG":300,"enName":"Spanakorizo (Greek Spinach Rice)"},"스파나코피타":{"kcal":340,"carb":28,"pro":8,"fat":21,"portionG":150,"enName":"Spanakopita (Greek Spinach Pie)"},"스팸마요덮밥":{"kcal":540,"carb":70,"pro":15,"fat":21,"portionG":350,"enName":"Spam Mayo Rice Bowl"},"스페인식 오믈렛":{"kcal":280,"carb":16,"pro":12,"fat":18,"portionG":200,"enName":"Spanish Omelette"},"슬로피조":{"kcal":390,"carb":32,"pro":21,"fat":17,"portionG":250,"enName":"Sloppy Joe"},"시금치나물":{"kcal":35,"carb":3,"pro":2,"fat":1.8,"portionG":60,"enName":"Seasoned Spinach"},"시금치된장국":{"kcal":55,"carb":6,"pro":3.5,"fat":1.5,"portionG":300,"enName":"Spinach Doenjang Soup"},"시니강":{"kcal":210,"carb":12,"pro":20,"fat":8,"portionG":400,"enName":"Sinigang (Filipino Sour Soup)"},"시래기국":{"kcal":65,"carb":7,"pro":3,"fat":2.5,"portionG":300,"enName":"Dried Radish Greens Soup"},"시오라멘":{"kcal":410,"carb":72,"pro":15,"fat":7,"portionG":500,"enName":"Shio Ramen (Salt Ramen)"},"시저랩":{"kcal":420,"carb":28,"pro":18,"fat":25,"portionG":200,"enName":"Caesar Wrap"},"시저샐러드":{"kcal":210,"carb":8,"pro":6,"fat":17,"portionG":180,"enName":"Caesar Salad"},"시칠리아파스타":{"kcal":480,"carb":68,"pro":12,"fat":16,"portionG":350,"enName":"Sicilian Pasta"},"치피로네스 엔 수 틴타":{"kcal":240,"carb":10,"pro":22,"fat":12,"portionG":250,"enName":"Chipirones en su Tinta (Squid in Ink)"},"싱가포르락사":{"kcal":540,"carb":68,"pro":22,"fat":20,"portionG":500,"enName":"Singapore Laksa"},"싱가포르사테":{"kcal":290,"carb":8,"pro":24,"fat":17,"portionG":150,"enName":"Singapore Satay"},"싱가포르죽":{"kcal":220,"carb":38,"pro":10,"fat":3,"portionG":350,"enName":"Singapore Porridge"},"쌀국수":{"kcal":390,"carb":75,"pro":14,"fat":3.5,"portionG":500,"enName":"Pho (Vietnamese Rice Noodle Soup)"},"쌀국수볶음":{"kcal":490,"carb":74,"pro":15,"fat":14,"portionG":350,"enName":"Stir-fried Rice Noodles"},"쌈밥":{"kcal":360,"carb":62,"pro":11,"fat":7,"portionG":300,"enName":"Ssambap (Wrap Rice)"},"솜땀":{"kcal":110,"carb":16,"pro":3,"fat":4,"portionG":200,"enName":"Som Tam (Green Papaya Salad)"},"쑥된장국":{"kcal":60,"carb":7,"pro":4,"fat":1.5,"portionG":300,"enName":"Mugwort Doenjang Soup"},"시식":{"kcal":410,"carb":4,"pro":22,"fat":34,"portionG":150,"enName":"Sic Sic (Uighur Lamb Dish)"},"아게다시 두부":{"kcal":180,"carb":12,"pro":9,"fat":10,"portionG":150,"enName":"Agedashi Tofu"},"앙구렐라이오":{"kcal":290,"carb":6,"pro":24,"fat":18,"portionG":200,"enName":"Agourélado (Greek Olive Oil Dish)"},"아귀찜":{"kcal":210,"carb":12,"pro":26,"fat":5,"portionG":300,"enName":"Braised Monkfish"},"아다나 케밥":{"kcal":360,"carb":6,"pro":26,"fat":26,"portionG":180,"enName":"Adana Kebab"},"아도봉 캉콩":{"kcal":120,"carb":8,"pro":3,"fat":8,"portionG":180,"enName":"Adobong Kangkong (Filipino Water Spinach)"},"아라비아타 파스타":{"kcal":440,"carb":68,"pro":12,"fat":12,"portionG":350,"enName":"Arrabbiata Pasta"},"아루나 달":{"kcal":190,"carb":24,"pro":9,"fat":6,"portionG":250,"enName":"Aruna Dal"},"아르니 구브치":{"kcal":410,"carb":10,"pro":28,"fat":28,"portionG":250,"enName":"Arni Psito (Greek Roast Lamb)"},"아마트리치아나":{"kcal":460,"carb":66,"pro":14,"fat":15,"portionG":350,"enName":"Amatriciana"},"송어 아망딘":{"kcal":310,"carb":8,"pro":24,"fat":19,"portionG":180,"enName":"Trout Almondine"},"아목트레이":{"kcal":280,"carb":10,"pro":22,"fat":16,"portionG":250,"enName":"Amok Trei (Cambodian Fish Curry)"},"아보카도샐러드":{"kcal":140,"carb":8,"pro":2,"fat":12,"portionG":180,"enName":"Avocado Salad"},"아보카도 연어 토스트":{"kcal":390,"carb":26,"pro":16,"fat":25,"portionG":200,"enName":"Avocado Salmon Toast"},"아보카도 크림 파스타":{"kcal":560,"carb":68,"pro":12,"fat":28,"portionG":350,"enName":"Avocado Cream Pasta"},"아보카도토스트":{"kcal":290,"carb":26,"pro":6,"fat":18,"portionG":150,"enName":"Avocado Toast"},"아브골레모노":{"kcal":210,"carb":18,"pro":14,"fat":9,"portionG":350,"enName":"Avgolemono (Greek Egg-Lemon Soup)"},"아쌈 락사":{"kcal":430,"carb":64,"pro":18,"fat":12,"portionG":500,"enName":"Asam Laksa"},"이칸 아삼":{"kcal":260,"carb":8,"pro":22,"fat":16,"portionG":250,"enName":"Asam Ikan (Tamarind Fish)"},"아쌈 프라이드 치킨":{"kcal":510,"carb":16,"pro":26,"fat":38,"portionG":200,"enName":"Asam Fried Chicken"},"아얌 고렝 베렘파":{"kcal":420,"carb":8,"pro":24,"fat":32,"portionG":180,"enName":"Ayam Goreng Berempah (Spiced Fried Chicken)"},"아얌 고렝":{"kcal":390,"carb":6,"pro":26,"fat":30,"portionG":180,"enName":"Ayam Goreng (Malaysian Fried Chicken)"},"아얌 리카리카":{"kcal":340,"carb":8,"pro":25,"fat":23,"portionG":200,"enName":"Ayam Rica-Rica (Spicy Chicken)"},"아얌 마삭 르막":{"kcal":410,"carb":10,"pro":24,"fat":30,"portionG":250,"enName":"Ayam Masak Lemak (Chicken in Coconut Milk)"},"아얌 마삭 메라":{"kcal":380,"carb":12,"pro":24,"fat":26,"portionG":250,"enName":"Ayam Masak Merah (Red Cooked Chicken)"},"아얌 바카르":{"kcal":310,"carb":6,"pro":26,"fat":20,"portionG":180,"enName":"Ayam Bakar (Grilled Chicken)"},"아얌세리":{"kcal":330,"carb":8,"pro":24,"fat":22,"portionG":200,"enName":"Ayam Seri"},"아얌 페녓":{"kcal":430,"carb":8,"pro":25,"fat":33,"portionG":200,"enName":"Ayam Penyet (Smashed Fried Chicken)"},"아욱국":{"kcal":65,"carb":7,"pro":3,"fat":2.5,"portionG":300,"enName":"Mallow Soup"},"아이리시스튜":{"kcal":320,"carb":18,"pro":24,"fat":17,"portionG":350,"enName":"Irish Stew"},"아지 후라이":{"kcal":290,"carb":16,"pro":18,"fat":18,"portionG":120,"enName":"Aji Furai (Fried Horse Mackerel)"},"아쿠아파차":{"kcal":220,"carb":6,"pro":24,"fat":11,"portionG":350,"enName":"Acqua Pazza (Italian Poached Fish)"},"아프리타다":{"kcal":290,"carb":12,"pro":22,"fat":17,"portionG":300,"enName":"Afritada (Filipino Chicken Stew)"},"아호 블랑코":{"kcal":240,"carb":14,"pro":4,"fat":19,"portionG":200,"enName":"Ajo Blanco (Spanish White Gazpacho)"},"아히 데 가이나":{"kcal":410,"carb":28,"pro":24,"fat":23,"portionG":300,"enName":"Aji de Gallina (Peruvian Creamy Chicken)"},"안심스테이크":{"kcal":340,"carb":0,"pro":40,"fat":20,"portionG":200,"enName":"Tenderloin Steak"},"알루 고비":{"kcal":180,"carb":22,"pro":4,"fat":9,"portionG":250,"enName":"Aloo Gobi (Potato and Cauliflower)"},"알루 파라타":{"kcal":290,"carb":42,"pro":5,"fat":11,"portionG":150,"enName":"Aloo Paratha"},"알리오올리오":{"kcal":460,"carb":62,"pro":9,"fat":20,"portionG":300,"enName":"Aglio e Olio"},"알본디가스":{"kcal":280,"carb":12,"pro":18,"fat":18,"portionG":200,"enName":"Albondigas (Spanish Meatballs)"},"알탕":{"kcal":230,"carb":6,"pro":28,"fat":10,"portionG":400,"enName":"Spicy Pollock Roe Soup"},"암리차리 쿨차":{"kcal":320,"carb":48,"pro":7,"fat":11,"portionG":150,"enName":"Amritsari Kulcha"},"암팔라야 볶음":{"kcal":140,"carb":8,"pro":8,"fat":9,"portionG":180,"enName":"Ampalaya Stir-fry (Bitter Melon)"},"애호박볶음":{"kcal":50,"carb":5,"pro":1.2,"fat":3,"portionG":80,"enName":"Stir-fried Zucchini"},"채소볶음밥":{"kcal":410,"carb":68,"pro":9,"fat":11,"portionG":300,"enName":"Vegetable Fried Rice"},"채소죽":{"kcal":180,"carb":36,"pro":4,"fat":2,"portionG":350,"enName":"Vegetable Porridge"},"채소춘권":{"kcal":220,"carb":24,"pro":4,"fat":12,"portionG":100,"enName":"Vegetable Spring Rolls"},"야키소바":{"kcal":480,"carb":68,"pro":12,"fat":18,"portionG":320,"enName":"Yakisoba"},"야키 오니기리":{"kcal":280,"carb":56,"pro":6,"fat":3,"portionG":160,"enName":"Yaki Onigiri (Grilled Rice Ball)"},"야키우동":{"kcal":440,"carb":72,"pro":11,"fat":12,"portionG":350,"enName":"Yaki Udon (Stir-fried Udon)"},"야키토리":{"kcal":210,"carb":4,"pro":22,"fat":12,"portionG":120,"enName":"Yakitori"},"야키토리 덮밥":{"kcal":540,"carb":74,"pro":25,"fat":16,"portionG":400,"enName":"Yakitori Rice Bowl"},"약밥":{"kcal":310,"carb":68,"pro":4,"fat":2.5,"portionG":100,"enName":"Yakbap (Sweet Rice)"},"얌느아":{"kcal":190,"carb":10,"pro":20,"fat":8,"portionG":200,"enName":"Yam Nua (Thai Beef Salad)"},"얌 마무앙":{"kcal":130,"carb":22,"pro":2,"fat":4,"portionG":180,"enName":"Yam Mamuang (Mango Salad)"},"얌운센":{"kcal":240,"carb":34,"pro":12,"fat":6,"portionG":250,"enName":"Yam Woon Sen (Glass Noodle Salad)"},"얌탈레":{"kcal":220,"carb":18,"pro":16,"fat":9,"portionG":250,"enName":"Yam Talay (Thai Seafood Salad)"},"양념치킨":{"kcal":690,"carb":38,"pro":36,"fat":44,"portionG":250,"enName":"Yangnyeom Chicken (Korean Spicy Fried Chicken)"},"양배추쌈":{"kcal":45,"carb":9,"pro":2,"fat":0.3,"portionG":150,"enName":"Cabbage Wrap"},"양배추참치덮밥":{"kcal":420,"carb":68,"pro":18,"fat":8,"portionG":350,"enName":"Cabbage and Tuna Rice Bowl"},"양송이수프":{"kcal":150,"carb":14,"pro":4,"fat":9,"portionG":250,"enName":"Cream of Mushroom Soup"},"양장피":{"kcal":290,"carb":24,"pro":16,"fat":15,"portionG":300,"enName":"Yangjangpi (Jellyfish and Vegetable Salad)"},"양저우 볶음밥":{"kcal":460,"carb":66,"pro":15,"fat":15,"portionG":300,"enName":"Yangzhou Fried Rice"},"양파수프":{"kcal":140,"carb":16,"pro":4,"fat":7,"portionG":250,"enName":"Onion Soup"},"어묵국":{"kcal":90,"carb":8,"pro":7,"fat":3.5,"portionG":300,"enName":"Fish Cake Soup"},"어묵볶음":{"kcal":120,"carb":10,"pro":6,"fat":6,"portionG":80,"enName":"Stir-fried Fish Cakes"},"어묵탕":{"kcal":180,"carb":14,"pro":12,"fat":8,"portionG":400,"enName":"Fish Cake Hot Pot"},"어향가지":{"kcal":180,"carb":14,"pro":3,"fat":13,"portionG":200,"enName":"Yuxiang Eggplant"},"어향육사":{"kcal":290,"carb":12,"pro":18,"fat":19,"portionG":200,"enName":"Yuxiang Shredded Pork"},"에그베네딕트":{"kcal":440,"carb":24,"pro":18,"fat":31,"portionG":200,"enName":"Eggs Benedict"},"에그샌드위치":{"kcal":390,"carb":32,"pro":13,"fat":23,"portionG":180,"enName":"Egg Sandwich"},"에그토스트":{"kcal":320,"carb":28,"pro":10,"fat":18,"portionG":150,"enName":"Egg Toast"},"에비마요":{"kcal":380,"carb":22,"pro":14,"fat":26,"portionG":180,"enName":"Ebi Mayo (Shrimp Mayonnaise)"},"에비텐동":{"kcal":620,"carb":82,"pro":18,"fat":24,"portionG":400,"enName":"Ebi Tendon (Shrimp Tempura Rice Bowl)"},"에비 후라이":{"kcal":280,"carb":18,"pro":13,"fat":17,"portionG":100,"enName":"Ebi Furai (Fried Shrimp)"},"에스카베체":{"kcal":240,"carb":10,"pro":18,"fat":14,"portionG":200,"enName":"Escabeche (Pickled Fish)"},"엔칠라다":{"kcal":460,"carb":44,"pro":22,"fat":21,"portionG":300,"enName":"Enchilada"},"엠파나다":{"kcal":380,"carb":36,"pro":12,"fat":21,"portionG":150,"enName":"Empanada"},"연근조림":{"kcal":75,"carb":16,"pro":2,"fat":0.5,"portionG":80,"enName":"Braised Lotus Root"},"연어구이":{"kcal":250,"carb":0.1,"pro":30,"fat":14,"portionG":150,"enName":"Grilled Salmon"},"연어데리야키":{"kcal":320,"carb":10,"pro":28,"fat":18,"portionG":180,"enName":"Salmon Teriyaki"},"연어샐러드":{"kcal":190,"carb":8,"pro":18,"fat":10,"portionG":220,"enName":"Salmon Salad"},"연어스테이크":{"kcal":310,"carb":0.2,"pro":36,"fat":18,"portionG":200,"enName":"Salmon Steak"},"연어아보카도볼":{"kcal":490,"carb":48,"pro":24,"fat":22,"portionG":350,"enName":"Salmon Avocado Bowl"},"연어아보카도포케":{"kcal":530,"carb":54,"pro":25,"fat":24,"portionG":380,"enName":"Salmon Avocado Poke Bowl"},"연어초밥":{"kcal":480,"carb":68,"pro":22,"fat":13,"portionG":300,"enName":"Salmon Sushi"},"연어포케":{"kcal":430,"carb":52,"pro":24,"fat":14,"portionG":350,"enName":"Salmon Poke Bowl"},"연포탕":{"kcal":120,"carb":6,"pro":18,"fat":2.5,"portionG":450,"enName":"Yeonpo Tang (Soft Octopus Soup)"},"열무국수":{"kcal":390,"carb":78,"pro":10,"fat":4,"portionG":450,"enName":"Young Radish Noodles"},"열무냉면":{"kcal":410,"carb":82,"pro":11,"fat":4,"portionG":500,"enName":"Young Radish Cold Noodles"},"열무비빔밥":{"kcal":490,"carb":84,"pro":12,"fat":11,"portionG":450,"enName":"Young Radish Bibimbap"},"영양솥밥":{"kcal":420,"carb":82,"pro":10,"fat":5,"portionG":350,"enName":"Nutritious Pot Rice"},"오니기리":{"kcal":270,"carb":56,"pro":5,"fat":2,"portionG":160,"enName":"Onigiri (Rice Ball)"},"오뎅":{"kcal":140,"carb":12,"pro":10,"fat":5.5,"portionG":200,"enName":"Oden"},"오리주물럭":{"kcal":380,"carb":10,"pro":24,"fat":27,"portionG":200,"enName":"Spicy Duck Stir-fry"},"오므라이스":{"kcal":580,"carb":78,"pro":15,"fat":23,"portionG":400,"enName":"Omurice (Omelette Rice)"},"오믈렛":{"kcal":190,"carb":2,"pro":12,"fat":15,"portionG":150,"enName":"Omelette"},"오버나이트오트밀":{"kcal":260,"carb":42,"pro":9,"fat":6,"portionG":250,"enName":"Overnight Oatmeal"},"오삼불고기":{"kcal":340,"carb":11,"pro":24,"fat":22,"portionG":200,"enName":"Spicy Pork and Squid Stir-fry"},"오소부코":{"kcal":390,"carb":12,"pro":32,"fat":24,"portionG":300,"enName":"Osso Buco"},"오야코동":{"kcal":560,"carb":74,"pro":25,"fat":19,"portionG":400,"enName":"Oyakodon (Chicken and Egg Rice Bowl)"},"오야코우동":{"kcal":480,"carb":76,"pro":22,"fat":10,"portionG":500,"enName":"Oyako Udon"},"오이냉국":{"kcal":30,"carb":6,"pro":1,"fat":0.2,"portionG":300,"enName":"Cold Cucumber Soup"},"오이무침":{"kcal":35,"carb":5,"pro":1,"fat":1.2,"portionG":80,"enName":"Seasoned Cucumber"},"오이소박이":{"kcal":30,"carb":5,"pro":1.2,"fat":0.3,"portionG":80,"enName":"Cucumber Kimchi"},"오이지무침":{"kcal":25,"carb":4,"pro":0.8,"fat":0.6,"portionG":50,"enName":"Seasoned Pickled Cucumber"},"오징어덮밥":{"kcal":510,"carb":82,"pro":22,"fat":10,"portionG":400,"enName":"Squid Rice Bowl"},"오징어먹물파스타":{"kcal":490,"carb":68,"pro":16,"fat":16,"portionG":350,"enName":"Squid Ink Pasta"},"오징어무국":{"kcal":110,"carb":6,"pro":14,"fat":3,"portionG":350,"enName":"Squid and Radish Soup"},"오징어볶음":{"kcal":190,"carb":11,"pro":20,"fat":7,"portionG":200,"enName":"Stir-fried Spicy Squid"},"오징어채볶음":{"kcal":145,"carb":16,"pro":12,"fat":3.5,"portionG":50,"enName":"Stir-fried Dried Squid Strips"},"오차즈케":{"kcal":290,"carb":54,"pro":9,"fat":4,"portionG":350,"enName":"Ochazuke (Tea Rice)"},"오코노미야키":{"kcal":360,"carb":34,"pro":14,"fat":19,"portionG":250,"enName":"Okonomiyaki (Japanese Savory Pancake)"},"오타오타":{"kcal":160,"carb":6,"pro":14,"fat":9,"portionG":100,"enName":"Otak-Otak (Grilled Fish Cake)"},"오트밀":{"kcal":150,"carb":27,"pro":5,"fat":3,"portionG":250,"enName":"Oatmeal"},"오포르아얌":{"kcal":320,"carb":12,"pro":22,"fat":21,"portionG":250,"enName":"Opor Ayam (Chicken in Coconut Milk)"},"오향장육":{"kcal":280,"carb":4,"pro":26,"fat":18,"portionG":150,"enName":"Five-spice Braised Pork"},"와플":{"kcal":230,"carb":31,"pro":5,"fat":10,"portionG":80,"enName":"Waffle"},"완탕면":{"kcal":420,"carb":62,"pro":18,"fat":11,"portionG":500,"enName":"Wonton Noodles"},"완탕탕":{"kcal":180,"carb":14,"pro":12,"fat":8,"portionG":350,"enName":"Wonton Soup"},"우거지갈비찜":{"kcal":340,"carb":12,"pro":24,"fat":22,"portionG":250,"enName":"Braised Ribs with Dried Cabbage"},"우거지해장국":{"kcal":190,"carb":18,"pro":13,"fat":7,"portionG":500,"enName":"Dried Cabbage Hangover Soup"},"우렁된장찌개":{"kcal":140,"carb":13,"pro":11,"fat":5,"portionG":250,"enName":"Freshwater Snail Doenjang Stew"},"우엉조림":{"kcal":55,"carb":11,"pro":1,"fat":1,"portionG":40,"enName":"Braised Burdock Root"},"우육면":{"kcal":540,"carb":75,"pro":28,"fat":14,"portionG":550,"enName":"Beef Noodle Soup"},"월남쌈":{"kcal":280,"carb":42,"pro":14,"fat":6,"portionG":250,"enName":"Vietnamese Spring Rolls"},"유도후":{"kcal":110,"carb":4,"pro":11,"fat":6,"portionG":200,"enName":"Yudofu (Simmered Tofu)"},"유린기":{"kcal":410,"carb":28,"pro":20,"fat":24,"portionG":200,"enName":"Yuringi (Chinese-style Fried Chicken)"},"유부우동":{"kcal":430,"carb":72,"pro":14,"fat":9,"portionG":500,"enName":"Kitsune Udon (Tofu Pouch Udon)"},"유부초밥":{"kcal":320,"carb":54,"pro":9,"fat":7,"portionG":160,"enName":"Inari Sushi"},"유산슬":{"kcal":210,"carb":12,"pro":18,"fat":10,"portionG":200,"enName":"Yusanseul (Seafood and Vegetable Stir-fry)"},"육개장":{"kcal":240,"carb":14,"pro":19,"fat":12,"portionG":500,"enName":"Yukgaejang (Spicy Beef Soup)"},"육전":{"kcal":260,"carb":6,"pro":21,"fat":17,"portionG":120,"enName":"Yukjeon (Pan-fried Beef)"},"육회비빔밥":{"kcal":580,"carb":82,"pro":27,"fat":16,"portionG":450,"enName":"Yukhoe Bibimbap (Raw Beef Bibimbap)"},"이나리초밥":{"kcal":320,"carb":54,"pro":9,"fat":7,"portionG":160,"enName":"Inari Sushi"},"이나살":{"kcal":360,"carb":3,"pro":32,"fat":24,"portionG":180,"enName":"Inasal (Filipino Grilled Chicken)"},"이맘 바일드":{"kcal":180,"carb":16,"pro":3,"fat":12,"portionG":200,"enName":"İmam Bayıldı (Stuffed Eggplant)"},"이스켄데르케밥":{"kcal":580,"carb":43,"pro":31,"fat":32,"portionG":350,"enName":"İskender Kebab"},"이시카리나베":{"kcal":290,"carb":11,"pro":28,"fat":15,"portionG":400,"enName":"Ishikari Nabe (Salmon Hot Pot)"},"이즈미르쾨프테":{"kcal":340,"carb":18,"pro":22,"fat":20,"portionG":250,"enName":"İzmir Köfte"},"이칸고랭":{"kcal":280,"carb":8,"pro":24,"fat":17,"portionG":150,"enName":"Ikan Goreng (Fried Fish)"},"이칸마살라":{"kcal":260,"carb":14,"pro":22,"fat":13,"portionG":250,"enName":"Ikan Masala (Fish Masala)"},"이칸바카르":{"kcal":210,"carb":4,"pro":26,"fat":10,"portionG":150,"enName":"Ikan Bakar (Grilled Fish)"},"이칸아삼":{"kcal":190,"carb":9,"pro":22,"fat":7,"portionG":300,"enName":"Ikan Asam (Tamarind Fish)"},"이칸페프리":{"kcal":170,"carb":3,"pro":24,"fat":7,"portionG":150,"enName":"Ikan Peperi (Peppered Fish)"},"일본식카레라이스":{"kcal":620,"carb":102,"pro":16,"fat":16,"portionG":500,"enName":"Japanese Curry Rice"},"일본식계란말이":{"kcal":150,"carb":8,"pro":10,"fat":9,"portionG":100,"enName":"Japanese Rolled Egg (Tamagoyaki)"},"자루소바":{"kcal":340,"carb":68,"pro":12,"fat":2,"portionG":300,"enName":"Zaru Soba (Cold Soba Noodles)"},"자지키":{"kcal":90,"carb":5,"pro":5,"fat":6,"portionG":100,"enName":"Zazak"},"잔치국수":{"kcal":380,"carb":74,"pro":12,"fat":4,"portionG":500,"enName":"Janchi Guksu (Festive Noodle Soup)"},"잠발라야":{"kcal":460,"carb":56,"pro":22,"fat":16,"portionG":350,"enName":"Jambalaya"},"잡곡밥":{"kcal":310,"carb":66,"pro":7,"fat":2,"portionG":210,"enName":"Multigrain Rice"},"잡채":{"kcal":140,"carb":22,"pro":2,"fat":5,"portionG":90,"enName":"Japchae (Glass Noodles with Vegetables)"},"잡채밥":{"kcal":680,"carb":105,"pro":12,"fat":24,"portionG":450,"enName":"Japchae Rice Bowl"},"잡채볶음밥":{"kcal":730,"carb":102,"pro":14,"fat":30,"portionG":450,"enName":"Japchae Fried Rice"},"장어구이":{"kcal":320,"carb":11,"pro":27,"fat":19,"portionG":150,"enName":"Grilled Eel"},"장조림":{"kcal":75,"carb":2,"pro":12,"fat":2,"portionG":50,"enName":"Soy-braised Beef"},"장조림버터비빔밥":{"kcal":610,"carb":82,"pro":18,"fat":23,"portionG":400,"enName":"Soy-braised Beef Butter Bibimbap"},"장칼국수":{"kcal":440,"carb":84,"pro":14,"fat":5,"portionG":550,"enName":"Doenjang Knife-cut Noodle Soup"},"장터국수":{"kcal":370,"carb":72,"pro":11,"fat":4,"portionG":500,"enName":"Market-style Noodle Soup"},"쟁반국수":{"kcal":490,"carb":88,"pro":15,"fat":9,"portionG":400,"enName":"Tray Noodles"},"전복미역국":{"kcal":90,"carb":5,"pro":10,"fat":4,"portionG":350,"enName":"Abalone and Seaweed Soup"},"전복죽":{"kcal":270,"carb":51,"pro":8,"fat":4,"portionG":400,"enName":"Abalone Porridge"},"제육볶음":{"kcal":310,"carb":10,"pro":22,"fat":20,"portionG":150,"enName":"Jeyuk Bokkeum (Spicy Pork Stir-fry)"},"조개탕":{"kcal":60,"carb":4,"pro":8,"fat":1,"portionG":350,"enName":"Clam Soup"},"조기구이":{"kcal":140,"carb":0,"pro":19,"fat":7,"portionG":100,"enName":"Grilled Yellow Corvina"},"족발냉채":{"kcal":360,"carb":14,"pro":28,"fat":21,"portionG":250,"enName":"Cold Pig's Trotters"},"주꾸미볶음":{"kcal":220,"carb":14,"pro":22,"fat":8,"portionG":200,"enName":"Stir-fried Baby Octopus"},"주먹밥":{"kcal":360,"carb":62,"pro":9,"fat":8,"portionG":200,"enName":"Jumeokbap (Rice Ball)"},"중식만두전골":{"kcal":380,"carb":34,"pro":19,"fat":19,"portionG":450,"enName":"Chinese-style Dumpling Hot Pot"},"중식오이냉채":{"kcal":65,"carb":7,"pro":2,"fat":3,"portionG":120,"enName":"Chinese-style Cold Cucumber"},"지삼선":{"kcal":240,"carb":22,"pro":4,"fat":15,"portionG":200,"enName":"Di San Xian (Potato"},"진미채무침":{"kcal":120,"carb":15,"pro":11,"fat":2,"portionG":40,"enName":"Seasoned Dried Squid Strips"},"짜장면":{"kcal":680,"carb":110,"pro":18,"fat":19,"portionG":600,"enName":"Jjajangmyeon (Black Bean Noodles)"},"짜장밥":{"kcal":720,"carb":115,"pro":16,"fat":21,"portionG":500,"enName":"Jjajang Rice"},"짜조":{"kcal":270,"carb":24,"pro":9,"fat":15,"portionG":120,"enName":"Cha Gio (Vietnamese Fried Spring Rolls)"},"짬뽕":{"kcal":560,"carb":84,"pro":23,"fat":15,"portionG":650,"enName":"Jjamppong (Spicy Seafood Noodle Soup)"},"쫄면":{"kcal":520,"carb":102,"pro":13,"fat":7,"portionG":450,"enName":"Jjolmyeon (Chewy Spicy Noodles)"},"쭈꾸미볶음밥":{"kcal":630,"carb":96,"pro":20,"fat":18,"portionG":450,"enName":"Spicy Baby Octopus Fried Rice"},"쭈꾸미삼겹살":{"kcal":440,"carb":12,"pro":26,"fat":32,"portionG":250,"enName":"Baby Octopus and Pork Belly"},"츠케멘":{"kcal":610,"carb":88,"pro":24,"fat":18,"portionG":500,"enName":"Tsukemen (Dipping Ramen)"},"호키엔미":{"kcal":490,"carb":64,"pro":19,"fat":17,"portionG":350,"enName":"Hokkien Mee"},"찜닭":{"kcal":380,"carb":24,"pro":32,"fat":17,"portionG":300,"enName":"Jjimdak (Braised Chicken)"},"짜까":{"kcal":310,"carb":8,"pro":26,"fat":19,"portionG":200,"enName":"Chaaka"},"차나마살라":{"kcal":240,"carb":32,"pro":9,"fat":8,"portionG":250,"enName":"Chana Masala"},"차돌된장찌개":{"kcal":210,"carb":9,"pro":14,"fat":13,"portionG":250,"enName":"Beef Brisket Doenjang Stew"},"차돌박이숙주볶음":{"kcal":320,"carb":7,"pro":18,"fat":25,"portionG":200,"enName":"Beef Brisket and Bean Sprout Stir-fry"},"차슈":{"kcal":270,"carb":5,"pro":16,"fat":21,"portionG":100,"enName":"Chashu (Braised Pork)"},"차오멘":{"kcal":510,"carb":68,"pro":14,"fat":20,"portionG":350,"enName":"Chow Mein"},"차완무시":{"kcal":90,"carb":3,"pro":8,"fat":5,"portionG":120,"enName":"Chawanmushi (Japanese Steamed Egg Custard)"},"차우파":{"kcal":640,"carb":88,"pro":18,"fat":24,"portionG":400,"enName":"Chaufa (Peruvian Fried Rice)"},"차이 타우 궤":{"kcal":390,"carb":48,"pro":10,"fat":18,"portionG":250,"enName":"Chai Tow Kway (Radish Cake)"},"차조":{"kcal":270,"carb":24,"pro":9,"fat":15,"portionG":120,"enName":"Chamjo (Millet and Porridge)"},"차지키":{"kcal":90,"carb":5,"pro":5,"fat":6,"portionG":100,"enName":"Tzatziki"},"차퀘이테오":{"kcal":580,"carb":72,"pro":18,"fat":24,"portionG":350,"enName":"Char Kway Teow"},"참나물무침":{"kcal":35,"carb":4,"pro":1,"fat":2,"portionG":50,"enName":"Seasoned Chammnamul (Wild Parsley)"},"참치김밥":{"kcal":480,"carb":68,"pro":17,"fat":15,"portionG":300,"enName":"Tuna Gimbap"},"참치김치볶음밥":{"kcal":660,"carb":94,"pro":19,"fat":23,"portionG":450,"enName":"Tuna and Kimchi Fried Rice"},"참치김치찌개":{"kcal":170,"carb":8,"pro":15,"fat":9,"portionG":300,"enName":"Tuna and Kimchi Stew"},"참치마요덮밥":{"kcal":620,"carb":85,"pro":16,"fat":24,"portionG":400,"enName":"Tuna Mayo Rice Bowl"},"참치마요오니기리":{"kcal":210,"carb":36,"pro":5,"fat":5,"portionG":110,"enName":"Tuna Mayo Onigiri"},"참치채소샐러드":{"kcal":140,"carb":8,"pro":18,"fat":4,"portionG":200,"enName":"Tuna and Vegetable Salad"},"참치포케":{"kcal":490,"carb":62,"pro":24,"fat":16,"portionG":400,"enName":"Tuna Poke Bowl"},"참치회비빔밥":{"kcal":530,"carb":82,"pro":26,"fat":11,"portionG":450,"enName":"Fresh Tuna Bibimbap"},"찹스테이크":{"kcal":310,"carb":12,"pro":24,"fat":18,"portionG":200,"enName":"Chop Steak"},"채끝스테이크":{"kcal":340,"carb":0,"pro":33,"fat":22,"portionG":150,"enName":"Sirloin Steak"},"채소달걀국":{"kcal":70,"carb":3,"pro":6,"fat":4,"portionG":300,"enName":"Vegetable and Egg Soup"},"채소커리":{"kcal":180,"carb":26,"pro":5,"fat":6,"portionG":250,"enName":"Vegetable Curry"},"청경채굴소스볶음":{"kcal":75,"carb":6,"pro":2,"fat":5,"portionG":120,"enName":"Bok Choy with Oyster Sauce"},"청경채두부볶음":{"kcal":130,"carb":8,"pro":9,"fat":7,"portionG":180,"enName":"Bok Choy and Tofu Stir-fry"},"청경채볶음":{"kcal":50,"carb":4,"pro":1,"fat":3,"portionG":100,"enName":"Stir-fried Bok Choy"},"청국장찌개":{"kcal":180,"carb":14,"pro":14,"fat":8,"portionG":250,"enName":"Cheonggukjang Jjigae (Fermented Soybean Stew)"},"체가이볶음면":{"kcal":460,"carb":72,"pro":11,"fat":14,"portionG":350,"enName":"Che Kai Stir-fried Noodles"},"초리소와인조림":{"kcal":320,"carb":6,"pro":18,"fat":25,"portionG":150,"enName":"Chorizo Wine Braise"},"총유빙":{"kcal":340,"carb":42,"pro":6,"fat":16,"portionG":120,"enName":"Cong You Bing (Scallion Pancake)"},"추어탕":{"kcal":210,"carb":12,"pro":18,"fat":10,"portionG":500,"enName":"Chueo Tang (Loach Soup)"},"충무김밥":{"kcal":410,"carb":78,"pro":11,"fat":6,"portionG":250,"enName":"Chungmu Gimbap"},"취나물":{"kcal":35,"carb":4,"pro":1,"fat":2,"portionG":50,"enName":"Seasoned Chwi Namul"},"치라시스시":{"kcal":540,"carb":92,"pro":21,"fat":9,"portionG":400,"enName":"Chirashi Sushi"},"치미창가":{"kcal":580,"carb":54,"pro":26,"fat":28,"portionG":300,"enName":"Chimichanga"},"치즈닭갈비":{"kcal":460,"carb":16,"pro":36,"fat":28,"portionG":300,"enName":"Cheese Dakgalbi"},"치즈버거":{"kcal":480,"carb":38,"pro":24,"fat":26,"portionG":200,"enName":"Cheeseburger"},"치킨그라탕":{"kcal":490,"carb":32,"pro":28,"fat":27,"portionG":350,"enName":"Chicken Gratin"},"치킨난반":{"kcal":520,"carb":24,"pro":26,"fat":36,"portionG":250,"enName":"Chicken Nanban"},"치킨누들수프":{"kcal":180,"carb":15,"pro":16,"fat":6,"portionG":400,"enName":"Chicken Noodle Soup"},"치킨두피아자":{"kcal":380,"carb":14,"pro":28,"fat":24,"portionG":300,"enName":"Chicken Do Pyaza"},"치킨몰레":{"kcal":420,"carb":18,"pro":32,"fat":25,"portionG":300,"enName":"Chicken Mole"},"치킨발티":{"kcal":390,"carb":12,"pro":31,"fat":24,"portionG":300,"enName":"Chicken Balti"},"치킨버거":{"kcal":510,"carb":46,"pro":22,"fat":27,"portionG":220,"enName":"Chicken Burger"},"치킨부리토":{"kcal":620,"carb":68,"pro":32,"fat":24,"portionG":350,"enName":"Chicken Burrito"},"치킨빈달루":{"kcal":410,"carb":11,"pro":32,"fat":26,"portionG":300,"enName":"Chicken Vindaloo"},"치킨샐러드":{"kcal":280,"carb":12,"pro":22,"fat":16,"portionG":250,"enName":"Chicken Salad"},"치킨샤와르마랩":{"kcal":490,"carb":44,"pro":28,"fat":22,"portionG":280,"enName":"Chicken Shawarma Wrap"},"치킨수프":{"kcal":160,"carb":12,"pro":15,"fat":6,"portionG":400,"enName":"Chicken Soup"},"치킨스테이크":{"kcal":320,"carb":2,"pro":34,"fat":20,"portionG":200,"enName":"Chicken Steak"},"치킨스튜":{"kcal":290,"carb":16,"pro":24,"fat":14,"portionG":350,"enName":"Chicken Stew"},"치킨시저랩":{"kcal":530,"carb":36,"pro":26,"fat":31,"portionG":250,"enName":"Chicken Caesar Wrap"},"치킨아도보":{"kcal":360,"carb":6,"pro":32,"fat":24,"portionG":250,"enName":"Chicken Adobo"},"치킨이나살":{"kcal":360,"carb":3,"pro":32,"fat":24,"portionG":180,"enName":"Chicken Inasal"},"치킨카츠":{"kcal":380,"carb":18,"pro":24,"fat":24,"portionG":150,"enName":"Chicken Katsu"},"치킨카치아토라":{"kcal":310,"carb":14,"pro":28,"fat":15,"portionG":350,"enName":"Chicken Cacciatore"},"치킨커리말레이":{"kcal":390,"carb":15,"pro":28,"fat":24,"portionG":300,"enName":"Malaysian Chicken Curry"},"치킨케밥":{"kcal":420,"carb":32,"pro":26,"fat":21,"portionG":250,"enName":"Chicken Kebab"},"치킨코르마":{"kcal":430,"carb":16,"pro":26,"fat":29,"portionG":300,"enName":"Chicken Korma"},"치킨콥샐러드":{"kcal":380,"carb":10,"pro":28,"fat":26,"portionG":300,"enName":"Chicken Cobb Salad"},"치킨타진":{"kcal":340,"carb":18,"pro":27,"fat":18,"portionG":350,"enName":"Chicken Tagine"},"치킨타코":{"kcal":340,"carb":28,"pro":18,"fat":16,"portionG":180,"enName":"Chicken Taco"},"치킨티카마살라":{"kcal":420,"carb":14,"pro":28,"fat":28,"portionG":300,"enName":"Chicken Tikka Masala"},"치킨파히타":{"kcal":390,"carb":24,"pro":26,"fat":21,"portionG":250,"enName":"Chicken Fajita"},"치킨팟파이":{"kcal":540,"carb":41,"pro":19,"fat":34,"portionG":300,"enName":"Chicken Pot Pie"},"칠레레예노":{"kcal":380,"carb":18,"pro":14,"fat":28,"portionG":250,"enName":"Chile Relleno"},"칠레아도보":{"kcal":390,"carb":7,"pro":31,"fat":26,"portionG":250,"enName":"Chile Adobo"},"칠레콘카르네":{"kcal":360,"carb":24,"pro":22,"fat":20,"portionG":300,"enName":"Chili con Carne"},"칠리새우":{"kcal":320,"carb":26,"pro":16,"fat":16,"portionG":200,"enName":"Chili Shrimp"},"칠리콘카르네":{"kcal":360,"carb":24,"pro":22,"fat":20,"portionG":300,"enName":"Chili con Carne"},"칠리크랩":{"kcal":420,"carb":28,"pro":32,"fat":20,"portionG":400,"enName":"Chilli Crab"},"칡냉면":{"kcal":460,"carb":94,"pro":11,"fat":4,"portionG":550,"enName":"Arrowroot Cold Noodles"},"카니돈부리":{"kcal":530,"carb":84,"pro":22,"fat":12,"portionG":400,"enName":"Kani Donburi (Crab Rice Bowl)"},"카레라이스":{"kcal":620,"carb":102,"pro":16,"fat":16,"portionG":500,"enName":"Curry Rice"},"카레우동":{"kcal":490,"carb":78,"pro":14,"fat":13,"portionG":500,"enName":"Curry Udon"},"카레카레":{"kcal":440,"carb":14,"pro":28,"fat":31,"portionG":350,"enName":"Kare-Kare (Filipino Peanut Stew)"},"카르네아사다":{"kcal":340,"carb":2,"pro":32,"fat":23,"portionG":200,"enName":"Carne Asada"},"카르니야르크":{"kcal":240,"carb":12,"pro":14,"fat":16,"portionG":250,"enName":"Karnıyarık (Stuffed Eggplant)"},"카르보나라":{"kcal":650,"carb":64,"pro":22,"fat":34,"portionG":350,"enName":"Carbonara"},"카마로네스 아 라 디아블라":{"kcal":280,"carb":10,"pro":24,"fat":16,"portionG":250,"enName":"Camarones a la Diabla"},"카불리 팔라우":{"kcal":590,"carb":84,"pro":21,"fat":19,"portionG":400,"enName":"Kaburga (Turkish Lamb Ribs)"},"카술레":{"kcal":480,"carb":32,"pro":28,"fat":26,"portionG":350,"enName":"Cassoulet"},"카야토스트":{"kcal":360,"carb":48,"pro":7,"fat":16,"portionG":120,"enName":"Kaya Toast"},"카오니아오":{"kcal":350,"carb":76,"pro":6,"fat":1,"portionG":150,"enName":"Khao Niao (Sticky Rice)"},"카오니아오 마무앙":{"kcal":480,"carb":88,"pro":5,"fat":12,"portionG":250,"enName":"Khao Niao Mamuang (Mango Sticky Rice)"},"카오니아오 무삥":{"kcal":520,"carb":42,"pro":26,"fat":28,"portionG":250,"enName":"Khao Niao Mu Ping (Grilled Pork with Sticky Rice)"},"카오만가이":{"kcal":590,"carb":72,"pro":28,"fat":21,"portionG":450,"enName":"Khao Man Gai (Thai Chicken Rice)"},"카오무댕":{"kcal":560,"carb":74,"pro":26,"fat":18,"portionG":400,"enName":"Khao Mu Daeng (Red Pork Rice)"},"카오소이":{"kcal":540,"carb":58,"pro":22,"fat":25,"portionG":450,"enName":"Khao Soi"},"카오카무":{"kcal":610,"carb":72,"pro":27,"fat":24,"portionG":450,"enName":"Khao Kha Mu (Thai Braised Pork Leg Rice)"},"카오팟":{"kcal":580,"carb":78,"pro":18,"fat":22,"portionG":400,"enName":"Khao Pad (Thai Fried Rice)"},"카오팟꿍":{"kcal":560,"carb":76,"pro":19,"fat":20,"portionG":400,"enName":"Khao Pad Kung (Shrimp Fried Rice)"},"카오팟 끄라파오":{"kcal":620,"carb":75,"pro":24,"fat":25,"portionG":400,"enName":"Khao Pad Krapao"},"카이 지아우 무쌉":{"kcal":340,"carb":6,"pro":16,"fat":28,"portionG":180,"enName":"Khai Jiao Mu Sap (Thai Minced Pork Omelette)"},"깐 까 우아":{"kcal":410,"carb":14,"pro":28,"fat":27,"portionG":300,"enName":"Canh Chua (Vietnamese Sour Soup)"},"가케소바":{"kcal":320,"carb":64,"pro":11,"fat":2,"portionG":400,"enName":"Kake Soba"},"카키아게":{"kcal":280,"carb":22,"pro":3,"fat":20,"portionG":100,"enName":"Kakiage (Mixed Tempura)"},"카포나타":{"kcal":140,"carb":14,"pro":2,"fat":9,"portionG":150,"enName":"Caponata"},"카프레제샐러드":{"kcal":260,"carb":6,"pro":12,"fat":21,"portionG":200,"enName":"Caprese Salad"},"카프타 그릴":{"kcal":380,"carb":4,"pro":26,"fat":30,"portionG":200,"enName":"Kafta Grill (Lebanese Meatball Skewer)"},"똠 카 카이":{"kcal":290,"carb":11,"pro":16,"fat":21,"portionG":350,"enName":"Khanom Khai (Thai Steamed Egg)"},"칼국수":{"kcal":410,"carb":82,"pro":12,"fat":4,"portionG":500,"enName":"Kalguksu (Knife-cut Noodle Soup)"},"칼데레타":{"kcal":420,"carb":14,"pro":28,"fat":28,"portionG":300,"enName":"Caldereta (Filipino Beef Stew)"},"칼데이라다":{"kcal":310,"carb":16,"pro":26,"fat":15,"portionG":400,"enName":"Caldeirada (Portuguese Fish Stew)"},"캅카이":{"kcal":240,"carb":18,"pro":14,"fat":14,"portionG":300,"enName":"Khap Kai"},"캐롯케이크":{"kcal":410,"carb":52,"pro":4,"fat":21,"portionG":120,"enName":"Carrot Cake"},"커리치킨반미":{"kcal":490,"carb":58,"pro":21,"fat":19,"portionG":250,"enName":"Curry Chicken Banh Mi"},"케랄라새우커리":{"kcal":320,"carb":12,"pro":22,"fat":21,"portionG":300,"enName":"Kerala Prawn Curry"},"케랍 아얌":{"kcal":260,"carb":8,"pro":24,"fat":15,"portionG":200,"enName":"Kerabu Ayam (Malaysian Chicken Salad)"},"키마 마타르":{"kcal":340,"carb":16,"pro":22,"fat":21,"portionG":250,"enName":"Keema Matar (Minced Meat and Peas)"},"케프타 타진":{"kcal":390,"carb":12,"pro":24,"fat":28,"portionG":300,"enName":"Kefta Tagine"},"코다리조림":{"kcal":220,"carb":12,"pro":26,"fat":6,"portionG":200,"enName":"Braised Semi-dried Pollock"},"코로케":{"kcal":310,"carb":32,"pro":5,"fat":18,"portionG":120,"enName":"Korokke (Croquette)"},"코시도":{"kcal":430,"carb":28,"pro":26,"fat":24,"portionG":400,"enName":"Cocido (Spanish Chickpea Stew)"},"코울슬로":{"kcal":120,"carb":14,"pro":1,"fat":7,"portionG":100,"enName":"Coleslaw"},"코지두 아 포르투게자":{"kcal":490,"carb":24,"pro":34,"fat":29,"portionG":450,"enName":"Cozido à Portuguesa"},"코코뱅":{"kcal":380,"carb":12,"pro":32,"fat":16,"portionG":350,"enName":"Coq au Vin"},"코프타 케밥":{"kcal":390,"carb":5,"pro":24,"fat":31,"portionG":200,"enName":"Kofta Kebab"},"코프테":{"kcal":320,"carb":4,"pro":21,"fat":25,"portionG":150,"enName":"Köfte (Turkish Meatballs)"},"콘치즈":{"kcal":340,"carb":24,"pro":6,"fat":24,"portionG":150,"enName":"Corn Cheese"},"콥샐러드":{"kcal":360,"carb":9,"pro":22,"fat":26,"portionG":300,"enName":"Cobb Salad"},"콩국수":{"kcal":510,"carb":74,"pro":22,"fat":14,"portionG":550,"enName":"Kong Guksu (Cold Soy Milk Noodles)"},"콩나물국":{"kcal":40,"carb":4,"pro":3,"fat":2,"portionG":300,"enName":"Bean Sprout Soup"},"콩나물국밥":{"kcal":320,"carb":62,"pro":11,"fat":3,"portionG":500,"enName":"Bean Sprout Rice Soup"},"콩나물냉국수":{"kcal":360,"carb":72,"pro":9,"fat":3,"portionG":500,"enName":"Cold Bean Sprout Noodles"},"콩나물무침":{"kcal":30,"carb":3,"pro":2,"fat":1,"portionG":50,"enName":"Seasoned Bean Sprouts"},"콩나물밥":{"kcal":380,"carb":76,"pro":9,"fat":4,"portionG":400,"enName":"Bean Sprout Rice"},"콩나물해장국":{"kcal":310,"carb":58,"pro":12,"fat":3,"portionG":500,"enName":"Bean Sprout Hangover Soup"},"콩비지찌개":{"kcal":190,"carb":10,"pro":14,"fat":11,"portionG":300,"enName":"Soybean Pulp Stew"},"쾨프테":{"kcal":320,"carb":4,"pro":21,"fat":25,"portionG":150,"enName":"Köfte"},"쿠르제트수프":{"kcal":130,"carb":11,"pro":3,"fat":9,"portionG":350,"enName":"Courgette Soup (Zucchini Soup)"},"쿠스쿠스":{"kcal":170,"carb":36,"pro":6,"fat":0,"portionG":150,"enName":"Couscous"},"쿠스쿠스 로얄":{"kcal":560,"carb":54,"pro":32,"fat":24,"portionG":450,"enName":"Couscous Royal"},"쿵파오치킨":{"kcal":380,"carb":16,"pro":24,"fat":24,"portionG":250,"enName":"Kung Pao Chicken"},"퀘사디야":{"kcal":540,"carb":42,"pro":24,"fat":31,"portionG":250,"enName":"Quesadilla"},"퀴노아채소볼":{"kcal":240,"carb":34,"pro":7,"fat":9,"portionG":200,"enName":"Quinoa Vegetable Bowl"},"크레프":{"kcal":190,"carb":26,"pro":5,"fat":7,"portionG":100,"enName":"Crêpe"},"크로크무슈":{"kcal":430,"carb":34,"pro":18,"fat":25,"portionG":180,"enName":"Croque Monsieur"},"크리스피 파타":{"kcal":820,"carb":2,"pro":64,"fat":62,"portionG":350,"enName":"Crispy Pata (Filipino Crispy Pork Knuckle)"},"크림브로콜리수프":{"kcal":210,"carb":16,"pro":5,"fat":15,"portionG":300,"enName":"Cream of Broccoli Soup"},"크림새우":{"kcal":410,"carb":34,"pro":14,"fat":24,"portionG":200,"enName":"Creamy Shrimp"},"크림소스연어":{"kcal":420,"carb":6,"pro":31,"fat":30,"portionG":250,"enName":"Salmon in Cream Sauce"},"크림수프":{"kcal":180,"carb":18,"pro":4,"fat":11,"portionG":300,"enName":"Cream Soup"},"크림파스타":{"kcal":620,"carb":68,"pro":18,"fat":32,"portionG":350,"enName":"Cream Pasta"},"크메르레드커리":{"kcal":390,"carb":16,"pro":24,"fat":26,"portionG":350,"enName":"Khmer Red Curry"},"클램차우더":{"kcal":240,"carb":22,"pro":9,"fat":13,"portionG":300,"enName":"Clam Chowder"},"클럽샌드위치":{"kcal":480,"carb":38,"pro":24,"fat":26,"portionG":250,"enName":"Club Sandwich"},"클레프티코":{"kcal":540,"carb":8,"pro":34,"fat":42,"portionG":350,"enName":"Kleftiko (Greek Slow-roasted Lamb)"},"키마커리":{"kcal":360,"carb":14,"pro":21,"fat":24,"portionG":250,"enName":"Keema Curry"},"키베":{"kcal":340,"carb":22,"pro":18,"fat":20,"portionG":150,"enName":"Kibbeh"},"키슈 로렌":{"kcal":420,"carb":24,"pro":12,"fat":31,"portionG":150,"enName":"Quiche Lorraine"},"키츠네우동":{"kcal":410,"carb":68,"pro":13,"fat":9,"portionG":500,"enName":"Kitsune Udon (Fox Udon)"},"킬라윈":{"kcal":180,"carb":6,"pro":22,"fat":8,"portionG":200,"enName":"Kinilaw (Filipino Ceviche)"},"타마고산도":{"kcal":390,"carb":38,"pro":11,"fat":22,"portionG":180,"enName":"Tamago Sando (Egg Sandwich)"},"타북 수유":{"kcal":310,"carb":11,"pro":24,"fat":19,"portionG":250,"enName":"Tabbouleh"},"타불레":{"kcal":160,"carb":21,"pro":4,"fat":7,"portionG":150,"enName":"Tabbouleh"},"타쉬 쾨프테":{"kcal":360,"carb":12,"pro":22,"fat":24,"portionG":250,"enName":"Taş Köfte"},"타코":{"kcal":290,"carb":24,"pro":15,"fat":15,"portionG":150,"enName":"Taco"},"타코야키":{"kcal":260,"carb":34,"pro":7,"fat":11,"portionG":150,"enName":"Takoyaki (Octopus Balls)"},"탄두리연어":{"kcal":270,"carb":3,"pro":28,"fat":16,"portionG":180,"enName":"Tandoori Salmon"},"탄두리치킨":{"kcal":290,"carb":4,"pro":34,"fat":15,"portionG":200,"enName":"Tandoori Chicken"},"탄탄면":{"kcal":620,"carb":78,"pro":21,"fat":25,"portionG":550,"enName":"Dan Dan Noodles"},"탕수육":{"kcal":460,"carb":44,"pro":16,"fat":24,"portionG":200,"enName":"Tangsuyuk (Sweet and Sour Pork)"},"터키식 필라프":{"kcal":380,"carb":54,"pro":7,"fat":15,"portionG":250,"enName":"Turkish Pilaf"},"텐동":{"kcal":750,"carb":98,"pro":18,"fat":32,"portionG":450,"enName":"Tendon (Tempura Rice Bowl)"},"텐푸라 우동":{"kcal":490,"carb":78,"pro":15,"fat":13,"portionG":550,"enName":"Tempura Udon"},"템페고랭":{"kcal":310,"carb":14,"pro":16,"fat":22,"portionG":150,"enName":"Tempe Goreng (Fried Tempeh)"},"토르탕 탈롱":{"kcal":240,"carb":8,"pro":11,"fat":18,"portionG":200,"enName":"Tortang Talong (Filipino Eggplant Omelette)"},"토르티야수프":{"kcal":210,"carb":22,"pro":11,"fat":9,"portionG":350,"enName":"Tortilla Soup"},"토리파이탄":{"kcal":580,"carb":68,"pro":28,"fat":22,"portionG":550,"enName":"Tori Paitan (Chicken Broth Ramen)"},"토마토계란볶음":{"kcal":210,"carb":8,"pro":9,"fat":16,"portionG":200,"enName":"Tomato and Egg Stir-fry"},"토마토달걀볶음":{"kcal":210,"carb":8,"pro":9,"fat":16,"portionG":200,"enName":"Tomato and Egg Stir-fry"},"토마토달걀수프":{"kcal":110,"carb":7,"pro":5,"fat":7,"portionG":350,"enName":"Tomato and Egg Soup"},"토마토브루스케타":{"kcal":180,"carb":24,"pro":4,"fat":8,"portionG":120,"enName":"Tomato Bruschetta"},"토마토수프":{"kcal":120,"carb":16,"pro":3,"fat":5,"portionG":300,"enName":"Tomato Soup"},"토마토파스타":{"kcal":420,"carb":68,"pro":12,"fat":11,"portionG":350,"enName":"Tomato Pasta"},"토마호크스테이크":{"kcal":780,"carb":0,"pro":68,"fat":56,"portionG":350,"enName":"Tomahawk Steak"},"토스타다":{"kcal":340,"carb":28,"pro":16,"fat":18,"portionG":200,"enName":"Tostada"},"토시로그":{"kcal":580,"carb":52,"pro":28,"fat":26,"portionG":350,"enName":"Tosilog (Filipino Tocino"},"튜나샌드위치":{"kcal":390,"carb":34,"pro":19,"fat":19,"portionG":200,"enName":"Tuna Sandwich"},"티놀라":{"kcal":210,"carb":8,"pro":24,"fat":9,"portionG":400,"enName":"Tinola (Filipino Chicken Soup)"},"티로피타":{"kcal":360,"carb":24,"pro":9,"fat":26,"portionG":120,"enName":"Tiropita (Greek Cheese Pie)"},"티본스테이크":{"kcal":640,"carb":0,"pro":58,"fat":46,"portionG":300,"enName":"T-bone Steak"},"파기름파스타":{"kcal":440,"carb":64,"pro":9,"fat":16,"portionG":300,"enName":"Scallion Oil Pasta"},"파낭 커리":{"kcal":420,"carb":15,"pro":26,"fat":29,"portionG":300,"enName":"Panang Curry"},"파니르 티카":{"kcal":290,"carb":8,"pro":16,"fat":22,"portionG":200,"enName":"Paneer Tikka"},"파르망티에":{"kcal":410,"carb":32,"pro":22,"fat":21,"portionG":300,"enName":"Parmentier (French Shepherd's Pie)"},"파소울라다":{"kcal":260,"carb":34,"pro":11,"fat":9,"portionG":350,"enName":"Fasolada (Greek Bean Soup)"},"파스티치오":{"kcal":540,"carb":46,"pro":26,"fat":28,"portionG":350,"enName":"Pastitsio (Greek Baked Pasta)"},"파에야":{"kcal":520,"carb":74,"pro":24,"fat":14,"portionG":400,"enName":"Paella"},"파인애플볶음밥":{"kcal":590,"carb":88,"pro":14,"fat":20,"portionG":400,"enName":"Pineapple Fried Rice"},"파전":{"kcal":290,"carb":34,"pro":7,"fat":14,"portionG":150,"enName":"Pajeon (Scallion Pancake)"},"파코라":{"kcal":260,"carb":24,"pro":6,"fat":15,"portionG":120,"enName":"Pakora"},"파타타스 브라바스":{"kcal":280,"carb":36,"pro":4,"fat":14,"portionG":200,"enName":"Patatas Bravas"},"파투쉬":{"kcal":140,"carb":16,"pro":3,"fat":7,"portionG":180,"enName":"Fattoush"},"파파스 아루가다스":{"kcal":130,"carb":26,"pro":3,"fat":2,"portionG":150,"enName":"Papa a la Huancaína (Peruvian Potato)"},"판싯":{"kcal":420,"carb":58,"pro":16,"fat":14,"portionG":300,"enName":"Pancit (Filipino Noodles)"},"판싯 비혼":{"kcal":390,"carb":56,"pro":15,"fat":12,"portionG":300,"enName":"Pancit Bihay"},"판싯칸톤":{"kcal":440,"carb":62,"pro":16,"fat":15,"portionG":300,"enName":"Pancit Canton"},"팔락 알루":{"kcal":190,"carb":18,"pro":4,"fat":12,"portionG":250,"enName":"Palak Aloo (Spinach and Potato)"},"팔라펠":{"kcal":330,"carb":32,"pro":11,"fat":18,"portionG":150,"enName":"Falafel"},"팔락 파니르":{"kcal":260,"carb":11,"pro":12,"fat":20,"portionG":250,"enName":"Palak Paneer"},"팔보채":{"kcal":240,"carb":14,"pro":22,"fat":12,"portionG":250,"enName":"Palbochae (Eight Treasure Stir-fry)"},"팟 끄라파오 무쌉":{"kcal":340,"carb":8,"pro":22,"fat":24,"portionG":200,"enName":"Pad Krapao Mu Sap (Thai Basil Minced Pork)"},"팟나":{"kcal":460,"carb":58,"pro":18,"fat":17,"portionG":350,"enName":"Pad Na (Thai Sauce Noodles)"},"팟씨유":{"kcal":520,"carb":64,"pro":19,"fat":21,"portionG":350,"enName":"Pad See Ew"},"팟타이":{"kcal":560,"carb":72,"pro":21,"fat":21,"portionG":350,"enName":"Pad Thai"},"팟 팍붕 파이댕":{"kcal":90,"carb":6,"pro":3,"fat":6,"portionG":150,"enName":"Pad Pak Bung Fai Daeng (Stir-fried Morning Glory)"},"팟 카나":{"kcal":95,"carb":7,"pro":4,"fat":6,"portionG":150,"enName":"Pad Pak Khana (Stir-fried Chinese Broccoli)"},"팟프리킹":{"kcal":360,"carb":11,"pro":24,"fat":24,"portionG":250,"enName":"Pad Prik King (Dry Red Curry Stir-fry)"},"팥죽":{"kcal":320,"carb":66,"pro":9,"fat":2,"portionG":350,"enName":"Patjuk (Red Bean Porridge)"},"파니르 도 피아자":{"kcal":340,"carb":12,"pro":14,"fat":26,"portionG":250,"enName":"Paneer Do Pyaza"},"팬케이크":{"kcal":330,"carb":52,"pro":7,"fat":10,"portionG":150,"enName":"Pancake"},"팽이버섯볶음":{"kcal":65,"carb":5,"pro":2,"fat":4,"portionG":100,"enName":"Stir-fried Enoki Mushrooms"},"팽이버섯전골":{"kcal":160,"carb":14,"pro":8,"fat":8,"portionG":400,"enName":"Enoki Mushroom Hot Pot"},"퍼가":{"kcal":380,"carb":64,"pro":24,"fat":3,"portionG":550,"enName":"Pho Ga (Vietnamese Chicken Noodle Soup)"},"퍼싸오":{"kcal":510,"carb":68,"pro":18,"fat":19,"portionG":350,"enName":"Pho Xao (Stir-fried Pho Noodles)"},"페센베크":{"kcal":440,"carb":24,"pro":26,"fat":28,"portionG":300,"enName":"Fesenjān (Persian Walnut and Pomegranate Stew)"},"페스토파스타":{"kcal":520,"carb":58,"pro":11,"fat":28,"portionG":320,"enName":"Pesto Pasta"},"페퍼로니피자":{"kcal":540,"carb":52,"pro":22,"fat":27,"portionG":200,"enName":"Pepperoni Pizza"},"평양냉면":{"kcal":380,"carb":78,"pro":14,"fat":2,"portionG":600,"enName":"Pyongyang Naengmyeon (Cold Noodles)"},"포졸레":{"kcal":290,"carb":21,"pro":22,"fat":13,"portionG":400,"enName":"Pozole"},"포카치아":{"kcal":250,"carb":44,"pro":7,"fat":5,"portionG":100,"enName":"Focaccia"},"포케":{"kcal":490,"carb":62,"pro":24,"fat":16,"portionG":400,"enName":"Poke Bowl"},"포크시시그":{"kcal":420,"carb":4,"pro":28,"fat":32,"portionG":200,"enName":"Pork Sisig"},"포크아도보":{"kcal":390,"carb":7,"pro":31,"fat":26,"portionG":250,"enName":"Pork Adobo"},"포터하우스스테이크":{"kcal":740,"carb":0,"pro":66,"fat":52,"portionG":350,"enName":"Porterhouse Steak"},"폴렌타":{"kcal":150,"carb":28,"pro":4,"fat":2,"portionG":200,"enName":"Polenta"},"폴포살라다":{"kcal":180,"carb":12,"pro":16,"fat":8,"portionG":200,"enName":"Polpo Salada (Octopus Salad)"},"푸팟퐁커리":{"kcal":440,"carb":22,"pro":19,"fat":31,"portionG":300,"enName":"Poo Pad Pong Curry"},"풀드포크":{"kcal":320,"carb":14,"pro":24,"fat":18,"portionG":150,"enName":"Pulled Pork"},"풀포 아 라 가예가":{"kcal":220,"carb":6,"pro":22,"fat":12,"portionG":200,"enName":"Pulpo a la Gallega (Galician Octopus)"},"프라이드 피타":{"kcal":220,"carb":32,"pro":4,"fat":8,"portionG":80,"enName":"Fried Pita"},"프렌치 어니언 수프":{"kcal":190,"carb":18,"pro":8,"fat":9,"portionG":300,"enName":"French Onion Soup"},"프렌치토스트":{"kcal":340,"carb":42,"pro":10,"fat":14,"portionG":150,"enName":"French Toast"},"토마토 프로방살":{"kcal":110,"carb":12,"pro":2,"fat":6,"portionG":150,"enName":"Provençal Tomatoes"},"프론 미":{"kcal":420,"carb":64,"pro":24,"fat":8,"portionG":500,"enName":"Prawn Mee (Shrimp Noodle Soup)"},"프리타타":{"kcal":240,"carb":6,"pro":16,"fat":17,"portionG":180,"enName":"Frittata"},"피나크벳":{"kcal":160,"carb":14,"pro":8,"fat":8,"portionG":250,"enName":"Pinakbet (Filipino Vegetable Stew)"},"피단두부무침":{"kcal":180,"carb":8,"pro":14,"fat":10,"portionG":200,"enName":"Century Egg and Tofu"},"피데":{"kcal":540,"carb":62,"pro":21,"fat":22,"portionG":250,"enName":"Pide (Turkish Flatbread Pizza)"},"피미엔토 데 파드론":{"kcal":120,"carb":8,"pro":2,"fat":9,"portionG":100,"enName":"Pimientos de Padrón"},"피시볼 국":{"kcal":210,"carb":18,"pro":16,"fat":8,"portionG":400,"enName":"Fish Ball Soup"},"피시 앤 칩스":{"kcal":580,"carb":48,"pro":24,"fat":32,"portionG":300,"enName":"Fish and Chips"},"피시타코":{"kcal":360,"carb":32,"pro":18,"fat":16,"portionG":200,"enName":"Fish Taco"},"피시헤드커리":{"kcal":380,"carb":18,"pro":32,"fat":20,"portionG":400,"enName":"Fish Head Curry"},"하리라":{"kcal":240,"carb":32,"pro":12,"fat":6,"portionG":350,"enName":"Harira (Moroccan Lamb Soup)"},"하몬 크로케타":{"kcal":320,"carb":26,"pro":8,"fat":20,"portionG":120,"enName":"Jamón Croqueta (Ham Croquette)"},"하이난치킨라이스":{"kcal":610,"carb":74,"pro":32,"fat":19,"portionG":450,"enName":"Hainanese Chicken Rice"},"하이라이스":{"kcal":580,"carb":94,"pro":14,"fat":16,"portionG":450,"enName":"Hayashi Rice"},"할루미구이":{"kcal":320,"carb":2,"pro":21,"fat":26,"portionG":100,"enName":"Grilled Halloumi"},"함박스테이크":{"kcal":410,"carb":14,"pro":24,"fat":28,"portionG":200,"enName":"Hambak Steak (Japanese-style Hamburger Steak)"},"함흥냉면":{"kcal":430,"carb":91,"pro":11,"fat":3,"portionG":550,"enName":"Hamheung Naengmyeon (Cold Noodles)"},"해물누룽지탕":{"kcal":310,"carb":38,"pro":19,"fat":9,"portionG":400,"enName":"Seafood Scorched Rice Soup"},"해물순두부찌개":{"kcal":160,"carb":8,"pro":14,"fat":8,"portionG":300,"enName":"Seafood Soft Tofu Stew"},"해물잡채":{"kcal":230,"carb":32,"pro":7,"fat":8,"portionG":150,"enName":"Seafood Japchae"},"해물전골":{"kcal":260,"carb":14,"pro":28,"fat":10,"portionG":450,"enName":"Seafood Hot Pot"},"해물파전":{"kcal":380,"carb":44,"pro":12,"fat":16,"portionG":200,"enName":"Seafood Scallion Pancake"},"해산물리조또":{"kcal":520,"carb":72,"pro":22,"fat":14,"portionG":400,"enName":"Seafood Risotto"},"해산물파스타":{"kcal":480,"carb":68,"pro":21,"fat":12,"portionG":350,"enName":"Seafood Pasta"},"해파리냉채":{"kcal":110,"carb":12,"pro":6,"fat":4,"portionG":150,"enName":"Cold Jellyfish Salad"},"햄버거":{"kcal":480,"carb":38,"pro":24,"fat":26,"portionG":200,"enName":"Hamburger"},"현미채소덮밥":{"kcal":410,"carb":78,"pro":9,"fat":6,"portionG":400,"enName":"Brown Rice Vegetable Bowl"},"현미채소볶음밥":{"kcal":460,"carb":74,"pro":9,"fat":12,"portionG":350,"enName":"Brown Rice Vegetable Fried Rice"},"호르타":{"kcal":90,"carb":6,"pro":2,"fat":7,"portionG":150,"enName":"Horta (Greek Boiled Greens)"},"호박나물":{"kcal":30,"carb":4,"pro":1,"fat":1,"portionG":50,"enName":"Seasoned Zucchini"},"호박전":{"kcal":120,"carb":14,"pro":3,"fat":6,"portionG":100,"enName":"Zucchini Pancake"},"호박죽":{"kcal":210,"carb":48,"pro":3,"fat":1,"portionG":300,"enName":"Pumpkin Porridge"},"홍샤오러우":{"kcal":540,"carb":12,"pro":18,"fat":48,"portionG":200,"enName":"Red-braised Pork"},"홍합탕":{"kcal":90,"carb":6,"pro":12,"fat":2,"portionG":400,"enName":"Mussel Soup"},"황기닭백숙":{"kcal":340,"carb":4,"pro":38,"fat":18,"portionG":450,"enName":"Astragalus Chicken Soup"},"황태구이":{"kcal":180,"carb":8,"pro":24,"fat":5,"portionG":120,"enName":"Grilled Dried Pollack"},"황태국":{"kcal":80,"carb":2,"pro":12,"fat":3,"portionG":300,"enName":"Dried Pollack Soup"},"황태해장국":{"kcal":90,"carb":3,"pro":13,"fat":3,"portionG":350,"enName":"Dried Pollack Hangover Soup"},"후이궈러우":{"kcal":480,"carb":11,"pro":22,"fat":39,"portionG":250,"enName":"Twice-cooked Pork (Huiguorou)"},"회냉면":{"kcal":470,"carb":92,"pro":18,"fat":4,"portionG":550,"enName":"Raw Fish Cold Noodles"},"후무스":{"kcal":170,"carb":14,"pro":5,"fat":10,"portionG":100,"enName":"Hummus"},"훈제연어파스타":{"kcal":560,"carb":66,"pro":24,"fat":21,"portionG":350,"enName":"Smoked Salmon Pasta"},"훈제오리볶음":{"kcal":390,"carb":4,"pro":21,"fat":33,"portionG":150,"enName":"Stir-fried Smoked Duck"},"훈제오리샐러드":{"kcal":280,"carb":11,"pro":15,"fat":19,"portionG":250,"enName":"Smoked Duck Salad"},"훠궈":{"kcal":520,"carb":18,"pro":32,"fat":36,"portionG":450,"enName":"Huoguo (Hot Pot)"},"히레카츠":{"kcal":390,"carb":16,"pro":27,"fat":23,"portionG":150,"enName":"Hire Katsu (Pork Fillet Cutlet)"},"히야시추카":{"kcal":460,"carb":76,"pro":14,"fat":10,"portionG":450,"enName":"Hiyashi Chuka (Cold Chinese Noodles)"},"BLT 샌드위치":{"kcal":450,"carb":36,"pro":16,"fat":26,"portionG":220,"enName":"BLT Sandwich"}});
  window.WM_MENU_NUTRITION_DB = WM_MENU_NUTRITION_DB;
  function _wmRound(x){ return Math.round((Number(x)||0)); }
  function _wmResolveMenuName(name){
    if(!name) return null;
    const raw = String(name).trim();
    if(WM_MENU_NUTRITION_DB[raw]) return raw;
    try{
      if(typeof NAME_MAP === 'object' && NAME_MAP[raw] && WM_MENU_NUTRITION_DB[NAME_MAP[raw]]) return NAME_MAP[raw];
    }catch(e){}
    try{
      if(typeof flowMenuDBName === 'function'){
        const mapped = flowMenuDBName(raw);
        if(mapped && WM_MENU_NUTRITION_DB[mapped]) return mapped;
      }
    }catch(e){}
    const compact = raw.replace(/\s+/g,'');
    if(WM_MENU_NUTRITION_DB[compact]) return compact;
    const found = Object.keys(WM_MENU_NUTRITION_DB).find(k => k.replace(/\s+/g,'') === compact);
    return found || null;
  }
  const __wmOldCalcNutrition = (typeof window.calcNutrition === 'function') ? window.calcNutrition : null;
  const __wmOldGetMenuNut = (typeof window.getMenuNut === 'function') ? window.getMenuNut : null;

  function _wmNutritionFromDB(menuName, people){
    const key = _wmResolveMenuName(menuName);
    if(!key) return null;
    const n = WM_MENU_NUTRITION_DB[key];
    const p = Math.max(1, Number(people)||1);
    const cal = _wmRound(n.kcal * p);
    const lo = _wmRound(cal * 0.95);
    const hi = _wmRound(cal * 1.05);
    return {
      cal: cal,
      calLo: lo,
      calHi: hi,
      calRange: lo + '~' + hi + 'kcal',
      carb: _wmRound((n.carb||0) * p),
      pro: _wmRound((n.pro||0) * p),
      fat: _wmRound((n.fat||0) * p),
      portionG: n.portionG || null,
      enName: n.enName || '',
      verified: true,
      source: '메뉴별 검증 영양DB',
      menuName: key
    };
  }

  window.getMenuNut = getMenuNut = function(name){
    const dbNut = _wmNutritionFromDB(name, 1);
    if(dbNut) return dbNut;
    if(__wmOldGetMenuNut) return __wmOldGetMenuNut(name);
    return {cal:0, carb:0, fat:0, pro:0, verified:false, source:'미등록'};
  };

  window.calcNutrition = calcNutrition = function(menuName, people){
    const dbNut = _wmNutritionFromDB(menuName, people || 1);
    if(dbNut) return dbNut;
    if(__wmOldCalcNutrition) return __wmOldCalcNutrition(menuName, people || 1);
    return null;
  };

  // MENU_DB / MENU_SCHEMA_V2에 영문명과 검증 영양값 메타데이터를 덧붙임
  function _wmAttachMeta(dict){
    if(!dict || typeof dict !== 'object') return;
    Object.keys(dict).forEach(function(k){
      const key = _wmResolveMenuName(k);
      if(!key) return;
      const n = WM_MENU_NUTRITION_DB[key];
      const obj = dict[k];
      if(obj && typeof obj === 'object'){
        obj.kcal = n.kcal;
        obj.carb = n.carb;
        obj.pro = n.pro;
        obj.fat = n.fat;
        obj.portionG = n.portionG || obj.portionG;
        obj.nutritionSource = '메뉴별 검증 영양DB';
        obj.nutritionVerified = true;
        if(n.enName) obj.enName = n.enName;
      }
    });
  }
  _wmAttachMeta(typeof MENU_DB !== 'undefined' ? MENU_DB : null);
  _wmAttachMeta(typeof MENU_SCHEMA_V2 !== 'undefined' ? MENU_SCHEMA_V2 : null);

  window.WM_NUTRITION_DB_MODE = 'menu_first_verified_db';
  window.WM_NUTRITION_DB_COUNT = Object.keys(WM_MENU_NUTRITION_DB).length;
})();

(function(){
  // 메뉴 카드/추천/식단표의 kcal 표시는 항상 1인분 기준으로 고정한다.
  // S.people은 장보기 수량 계산에만 사용한다.
  window.WM_NUTRITION_DISPLAY_MODE = 'one_serving_menu_kcal';
  if (typeof window.kcalText === 'function') {
    window.kcalText = kcalText = function(name){
      try{
        var nut = (typeof calcNutrition === 'function') ? calcNutrition(name, 1) : null;
        if(!nut) return '';
        return nut.calRange || ((nut.cal || nut.kcal || 0) + 'kcal');
      }catch(e){ return ''; }
    };
  }
})();

(function(){
  function _wmPadDateKey(key){
    if(!key) return '';
    var p=String(key).split('-').map(function(x){return parseInt(x,10);});
    if(p.length<3 || p.some(function(n){return isNaN(n);})){ return String(key); }
    return p[0]+'-'+String(p[1]).padStart(2,'0')+'-'+String(p[2]).padStart(2,'0');
  }
  function _wmTodayKey(){
    if(typeof todayKey==='function') return todayKey();
    var d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
  }
  function _wmDateAdd(key,days){
    if(!key) return '';
    var p=String(key).split('-').map(function(x){return parseInt(x,10);});
    if(p.length<3 || p.some(function(n){return isNaN(n);})){ return ''; }
    var d=new Date(p[0],p[1]-1,p[2]);
    d.setDate(d.getDate()+days);
    return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
  }
  function _wmIsFuture(key){
    if(!key) return false;
    return _wmPadDateKey(key) > _wmPadDateKey(_wmTodayKey());
  }
  function _wmDiaryPopup(msg){
    try{
      var overlay=document.createElement('div');
      overlay.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px)';
      var box=document.createElement('div');
      box.style.cssText='background:#fff;border-radius:22px;padding:24px;max-width:320px;width:100%;text-align:center;box-shadow:0 24px 70px rgba(15,23,42,.22)';
      box.innerHTML='<div style="font-size:34px;margin-bottom:10px">⏳</div><div style="font-weight:900;font-size:17px;margin-bottom:8px;color:#111827">'+msg+'</div><div style="font-size:12px;color:#8B95A1;line-height:1.5;margin-bottom:18px">해당 날짜가 된 후 식단 일기에 추가할 수 있어요.</div><button style="width:100%;padding:13px;border:0;border-radius:14px;background:var(--primary);color:#fff;font-weight:800;font-size:14px;cursor:pointer">확인</button>';
      box.querySelector('button').onclick=function(){overlay.remove();};
      overlay.onclick=function(e){if(e.target===overlay) overlay.remove();};
      overlay.appendChild(box); document.body.appendChild(overlay);
    }catch(e){ alert(msg); }
  }
  function _wmMealDateFromWeekly(dayIdx){
    var start=S && S.mealStartDate ? S.mealStartDate : null;
    if(!start) return '';
    return _wmDateAdd(start, dayIdx||0);
  }

  var _oldSetCalMeal = window.setCalMeal;
  window.setCalMeal = setCalMeal = function(dateKeyArg, mealIdx){
    if(typeof _oldSetCalMeal==='function'){
      _oldSetCalMeal.apply(this, arguments);
      if(S && S.currentMeal){
        S.currentMealDate = dateKeyArg;
        S.currentMeal._dateKey = dateKeyArg;
      }
    }
  };

  var _oldSetMealFromMonthly = window.setMealFromMonthly;
  window.setMealFromMonthly = setMealFromMonthly = function(dateKeyArg, mealIdx){
    if(typeof _oldSetMealFromMonthly==='function'){
      _oldSetMealFromMonthly.apply(this, arguments);
      if(S && S.currentMeal){
        S.currentMealDate = dateKeyArg;
        S.currentMeal._dateKey = dateKeyArg;
      }
    }
  };

  var _oldSetMeal = window.setMeal;
  window.setMeal = setMeal = function(dayIdx, mealIdx, backScreen){
    if(typeof _oldSetMeal==='function'){
      _oldSetMeal.apply(this, arguments);
      if(S && S.currentMeal){
        var k=_wmMealDateFromWeekly(dayIdx);
        if(k){ S.currentMealDate=k; S.currentMeal._dateKey=k; }
      }
    }
  };

  window.addToDiary = addToDiary = function(menuName, dateKeyOverride){
    var targetKey = dateKeyOverride || null;
    if(!targetKey && S && S.screen==='recipe'){
      targetKey = (S.currentMeal && S.currentMeal._dateKey) || S.currentMealDate || null;
    }
    if(!targetKey) targetKey = _wmTodayKey();

    if(_wmIsFuture(targetKey)){
      _wmDiaryPopup('아직 일정이 오지 않았어요');
      return false;
    }

    if(!S.mealDiary) S.mealDiary={};
    if(!S.mealDiary[targetKey]) S.mealDiary[targetKey]=[];
    var nut=(typeof calcNutrition==='function') ? calcNutrition(menuName,1) : null;
    S.mealDiary[targetKey].push({
      name:menuName,
      dateKey:targetKey,
      time:new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}),
      cal:nut?(nut.cal||nut.kcal||0):0,
      pro:nut?(nut.pro||0):0,
      fat:nut?(nut.fat||0):0,
      carb:nut?(nut.carb||0):0
    });
    if(typeof saveMealDiary==='function') saveMealDiary();
    alert(menuName+' 식단 일기에 추가됐어요!');
    return true;
  };

  window.WM_DIARY_DATE_GUARD_MODE='meal_date_linked_no_future_add';
})();

(function(){
  function hasAny(s, arr){ s=String(s||''); return arr.some(function(w){return s.indexOf(w)>=0;}); }
  function clone(o){ try{return JSON.parse(JSON.stringify(o));}catch(e){return o;} }
  function catMap(cat){ return {protein:'단백질',dairy:'단백질',grain:'면·밥',veg:'채소',vegetable:'채소',seafood:'단백질',sauce:'양념',spice:'양념',condiment:'양념',nut:'기타',other:'기타'}[cat]||'기타'; }
  function addIng(id,name,amount,aliases,icon){
    if(typeof INGREDIENT_DB_V2==='object' && !INGREDIENT_DB_V2[id]){
      INGREDIENT_DB_V2[id]={id:id,name:name,category:'protein',aliases:aliases||[name],icon:icon||'🥩',defaultAmount:amount||'200g'};
    }
    if(typeof NUTRITION_DB==='object' && !NUTRITION_DB[name]){
      // kcal/pro/fat/carb per 100g-ish; 영양 표시 로직은 메뉴별 영양DB 우선이라 장보기/보조용으로만 사용
      var n={cal:200,pro:20,fat:12,carb:0};
      if(/닭/.test(name)) n={cal:165,pro:22,fat:8,carb:0};
      if(/가슴/.test(name)) n={cal:120,pro:24,fat:2,carb:0};
      if(/양지|불고기|홍두깨|다짐/.test(name)) n={cal:190,pro:20,fat:11,carb:0};
      if(/삼겹|목살|앞다리/.test(name)) n={cal:250,pro:17,fat:20,carb:0};
      NUTRITION_DB[name]=n;
    }
  }
  addIng('pork_shoulder','돼지앞다리살','220g',['돼지앞다리살','앞다리살','돼지불고기용'],'🥩');
  addIng('pork_neck','돼지목살','220g',['돼지목살','목살'],'🥩');
  addIng('pork_loin','돼지등심','200g',['돼지등심','등심','돈카츠용등심'],'🥩');
  addIng('pork_tenderloin','돼지안심','200g',['돼지안심','안심'],'🥩');
  addIng('ground_pork','돼지다짐육','200g',['돼지다짐육','다진돼지고기','돼지고기다짐육'],'🥩');
  addIng('beef_slices','소고기불고기용','200g',['소고기불고기용','불고기용소고기','얇은소고기'],'🥩');
  addIng('beef_brisket','소고기양지','220g',['소고기양지','양지','국거리용소고기'],'🥩');
  addIng('ground_beef','소고기다짐육','200g',['소고기다짐육','다진소고기'],'🥩');
  addIng('beef_round','소고기홍두깨살','200g',['소고기홍두깨살','홍두깨살','장조림용소고기'],'🥩');
  addIng('chicken_thigh','닭다리살','220g',['닭다리살','닭정육','순살닭다리살'],'🍗');
  addIng('whole_chicken','생닭','900g',['생닭','백숙용닭','삼계탕용닭'],'🍗');
  addIng('ground_chicken','닭다짐육','200g',['닭다짐육','다진닭고기'],'🍗');

  function choosePork(menu){
    if(hasAny(menu,['삼겹','묵은지삼겹','고추장삼겹'])) return 'pork_belly';
    if(hasAny(menu,['보쌈','수육','동파육','부타카쿠니','홍소육','오향장육','레촌카왈리','크리스피파타','포크아도보','포크시시그','바쿠테'])) return 'pork_belly';
    if(hasAny(menu,['돈카츠','돈까스','히레카츠','가츠','카츠산도','탕수육','꿔바로우'])) return 'pork_loin';
    if(hasAny(menu,['만두','완탕','딤섬','슈마이','멘치','난자완스','마파','라브','라르브','라프','라프무'])) return 'ground_pork';
    if(hasAny(menu,['갈비','등갈비'])) return 'pork_rib';
    if(hasAny(menu,['목살'])) return 'pork_neck';
    if(hasAny(menu,['제육','불고기','두루치기','김치찌개','찌개','잡채','볶음','야키소바','오코노미야키','고추잡채','꽃빵','카레','우동','라멘','반미','분짜','분팃느엉','짜조','룸피아','판싯','포솔레'])) return 'pork_shoulder';
    return 'pork_shoulder';
  }
  function chooseBeef(menu){
    if(hasAny(menu,['갈비','갈비탕','갈비찜','소갈비'])) return 'beef_rib';
    if(hasAny(menu,['장조림'])) return 'beef_round';
    if(hasAny(menu,['미역국','무국','뭇국','육개장','설렁탕','곰탕','국','탕','우육면','분보후에','쌀국수'])) return 'beef_brisket';
    if(hasAny(menu,['볼로네제','라자냐','미트볼','함박','타코','칠리','칠레콘카르네','부리또','케밥','코프타','코프테','쾨프테','키마','무사카','피데','라흐마준','만트','만두'])) return 'ground_beef';
    if(hasAny(menu,['불고기','규동','덮밥','볶음','비빔밥','잡채','샤브샤브','스키야키','니쿠자가','하이라이스','카레','차돌','마라탕','마라샹궈','훠궈','록락','로모','스테이크'])) return 'beef_slices';
    return 'beef_slices';
  }
  function chooseChicken(menu){
    if(hasAny(menu,['삼계탕','백숙','닭한마리','닭곰탕'])) return 'whole_chicken';
    if(hasAny(menu,['닭가슴살','치킨샐러드','시저랩','요거트볼','현미볼','닭가슴살랩','닭가슴살카레','닭가슴살채소'])) return 'chicken_breast';
    if(hasAny(menu,['날개','윙','봉'])) return 'chicken_wing';
    if(hasAny(menu,['완탕','만두','미트볼'])) return 'ground_chicken';
    if(hasAny(menu,['치킨카츠','가라아게','치킨난반','데리야키','닭갈비','닭볶음','닭볶음탕','찜닭','아도보','이나살','티카','탄두리','샤와르마','카레','커리','코르마','빈달루','파히타','타코','부리토','엔칠라다','팟파이','스튜','수프','나베','꼬치','구이'])) return 'chicken_thigh';
    return 'chicken_thigh';
  }
  function specificId(oldId, menu){
    var id=String(oldId||'');
    if(id==='pork') return choosePork(menu);
    if(id==='beef') return chooseBeef(menu);
    if(id==='chicken') return chooseChicken(menu);
    return id;
  }
  function specificName(oldName, menu){
    var n=String(oldName||'');
    if(n==='돼지고기') return ingredientNameOf ? ingredientNameOf(choosePork(menu)) : '돼지앞다리살';
    if(n==='소고기') return ingredientNameOf ? ingredientNameOf(chooseBeef(menu)) : '소고기불고기용';
    if(n==='닭고기') return ingredientNameOf ? ingredientNameOf(chooseChicken(menu)) : '닭다리살';
    return n;
  }
  function patchMenuDbEntry(menuName, db){
    if(!db || !Array.isArray(db.ingredients)) return;
    db.ingredients=db.ingredients.map(function(x){
      if(typeof x==='string') return specificName(x,menuName);
      var y=Object.assign({}, x);
      if(y.id) y.id=specificId(y.id,menuName);
      y.name=specificName(y.name || (y.id && typeof ingredientNameOf==='function'?ingredientNameOf(y.id):''), menuName);
      if(y.id && typeof ingredientObjOf==='function'){
        var obj=ingredientObjOf(y.id); y.name=obj.name; y.icon=y.icon||obj.icon; y.category=y.category||obj.category;
      }
      return y;
    });
    if(Array.isArray(db.ingredientIds)) db.ingredientIds=db.ingredientIds.map(function(id){return specificId(id,menuName);});
  }
  function patchSchemaEntry(menuName,row){
    if(!row || !Array.isArray(row.ingredients)) return;
    var oldAmounts=row.ingredientAmounts||{};
    var newAmounts={};
    row.ingredients=row.ingredients.map(function(id){
      var nid=specificId(id,menuName);
      if(oldAmounts[id]!==undefined && newAmounts[nid]===undefined) newAmounts[nid]=oldAmounts[id];
      return nid;
    });
    Object.keys(oldAmounts).forEach(function(k){ if(newAmounts[k]===undefined && !['pork','beef','chicken'].includes(k)) newAmounts[k]=oldAmounts[k]; });
    row.ingredientAmounts=newAmounts;
  }
  function patchCleanMenuRow(row){
    if(!row || !Array.isArray(row.ingredients)) return;
    row.ingredients=row.ingredients.map(function(x){return specificName(x,row.name||'');});
  }
  try{ if(typeof CLEAN_MENUS!=='undefined' && Array.isArray(CLEAN_MENUS)) CLEAN_MENUS.forEach(patchCleanMenuRow); }catch(e){}
  try{ if(typeof MENU_SCHEMA_V2==='object') Object.keys(MENU_SCHEMA_V2).forEach(function(n){patchSchemaEntry(n,MENU_SCHEMA_V2[n]);}); }catch(e){}
  try{ if(typeof MENU_DB==='object') Object.keys(MENU_DB).forEach(function(n){patchMenuDbEntry(n,MENU_DB[n]);}); }catch(e){}

  window.refineIngredient = function(name, menu){ return specificName(name, menu); };
  window.WM_MEAT_INGREDIENT_AUDIT = {
    version:'v1',
    genericNamesRemovedFromRuntimeMenuDB:['돼지고기','소고기','닭고기'],
    replacements:['돼지앞다리살','돼지목살','돼지등심','돼지안심','돼지다짐육','삼겹살','소고기불고기용','소고기양지','소고기다짐육','소고기홍두깨살','닭다리살','닭가슴살','생닭','닭다짐육']
  };
  try{ if(typeof render==='function') setTimeout(render,0); }catch(e){}
})();

/* ===== COUNTRY SIDE MENU + NUTRITION PATCH v1 =====
   목적:
   - 외국 메뉴에 한식 반찬이 추천되는 fallback 차단
   - 국가/스타일별 사이드 메뉴 2개씩 고정 추천
   - 사이드 메뉴도 1인분 kcal/탄수화물/단백질/지방 DB로 계산
*/
(function(){
  const SIDE_POOL = {
    korean:['김치','계란말이'],
    japanese:['미소시루','오이절임'],
    chinese:['중식오이냉채','청경채볶음'],
    western:['그린샐러드','크림수프'],
    italian:['카프레제샐러드','브루스케타'],
    american:['코울슬로','피클'],
    french:['프렌치 어니언 수프','바게트'],
    spanish:['파타타스 브라바스','피미엔토 데 파드론'],
    greek:['차지키','호르타'],
    thai:['쏨땀','얌운센'],
    vietnamese:['고이꾸온','도추아'],
    indonesian:['가도가도','삼발'],
    malaysian:['아차르','삼발 우당'],
    singapore:['차이 타우 궤','오타오타'],
    filipino:['아차라','엔살라당 탈롱'],
    taiwanese:['피단두부무침','대만식 오이무침'],
    indian:['라이타','파코라'],
    middleeast:['후무스','타불레'],
    turkish:['차지키','보렉'],
    mexican:['과카몰리','살사소스'],
    brazilian:['비나그레치','파로파'],
    argentinian:['치미추리','엠파나다'],
    peruvian:['살사 크리올라','카우사'],
    moroccan:['자알룩','모로칸 당근 샐러드'],
    ethiopian:['인제라','렌틸샐러드'],
    global:['그린샐러드','피클']
  };

  const SIDE_NUTRITION = {
    '김치':{kcal:25,carb:4,pro:1.5,fat:0.5,portionG:50,enName:'Kimchi'},
    '계란말이':{kcal:210,carb:3,pro:14,fat:16,portionG:120,enName:'Rolled Egg Omelette'},
    '미소시루':{kcal:45,carb:5,pro:3,fat:1.5,portionG:200,enName:'Miso Soup'},
    '오이절임':{kcal:25,carb:5,pro:1,fat:0.2,portionG:60,enName:'Pickled Cucumber'},
    '중식오이냉채':{kcal:60,carb:7,pro:2,fat:3,portionG:100,enName:'Chinese Cucumber Salad'},
    '청경채볶음':{kcal:80,carb:7,pro:3,fat:5,portionG:120,enName:'Stir-fried Bok Choy'},
    '그린샐러드':{kcal:80,carb:8,pro:2, fat:5,portionG:120,enName:'Green Salad'},
    '크림수프':{kcal:180,carb:16,pro:5,fat:11,portionG:200,enName:'Cream Soup'},
    '카프레제샐러드':{kcal:180,carb:5,pro:10,fat:13,portionG:150,enName:'Caprese Salad'},
    '브루스케타':{kcal:160,carb:22,pro:5,fat:6,portionG:100,enName:'Bruschetta'},
    '코울슬로':{kcal:150,carb:12,pro:2,fat:11,portionG:120,enName:'Coleslaw'},
    '피클':{kcal:18,carb:4,pro:0.5,fat:0.1,portionG:50,enName:'Pickles'},
    '프렌치 어니언 수프':{kcal:190,carb:18,pro:8,fat:9,portionG:300,enName:'French Onion Soup'},
    '바게트':{kcal:190,carb:38,pro:6,fat:1.5,portionG:70,enName:'Baguette'},
    '파타타스 브라바스':{kcal:280,carb:36,pro:4,fat:14,portionG:200,enName:'Patatas Bravas'},
    '피미엔토 데 파드론':{kcal:120,carb:8,pro:2,fat:9,portionG:100,enName:'Pimientos de Padrón'},
    '차지키':{kcal:70,carb:5,pro:4,fat:4,portionG:80,enName:'Tzatziki'},
    '호르타':{kcal:90,carb:6,pro:2,fat:7,portionG:150,enName:'Horta'},
    '쏨땀':{kcal:120,carb:24,pro:4,fat:2,portionG:180,enName:'Som Tam'},
    '얌운센':{kcal:220,carb:32,pro:12,fat:5,portionG:200,enName:'Yam Woon Sen'},
    '고이꾸온':{kcal:190,carb:26,pro:12,fat:4,portionG:160,enName:'Goi Cuon'},
    '도추아':{kcal:35,carb:8,pro:1,fat:0.1,portionG:70,enName:'Do Chua'},
    '가도가도':{kcal:315,carb:28,pro:12,fat:16,portionG:236,enName:'Gado-Gado'},
    '삼발':{kcal:45,carb:6,pro:1,fat:2,portionG:30,enName:'Sambal'},
    '아차르':{kcal:50,carb:10,pro:1,fat:1,portionG:80,enName:'Acar'},
    '삼발 우당':{kcal:220,carb:9,pro:20,fat:12,portionG:150,enName:'Sambal Udang'},
    '차이 타우 궤':{kcal:240,carb:32,pro:7,fat:9,portionG:180,enName:'Chai Tow Kway'},
    '오타오타':{kcal:160,carb:10,pro:13,fat:8,portionG:120,enName:'Otak-Otak'},
    '아차라':{kcal:40,carb:9,pro:1,fat:0.2,portionG:80,enName:'Atchara'},
    '엔살라당 탈롱':{kcal:95,carb:8,pro:3,fat:6,portionG:120,enName:'Ensaladang Talong'},
    '피단두부무침':{kcal:180,carb:8,pro:14,fat:10,portionG:200,enName:'Century Egg and Tofu'},
    '대만식 오이무침':{kcal:55,carb:6,pro:1.5,fat:3,portionG:100,enName:'Taiwanese Cucumber Salad'},
    '라이타':{kcal:90,carb:8,pro:5,fat:4,portionG:120,enName:'Raita'},
    '파코라':{kcal:260,carb:24,pro:6,fat:15,portionG:120,enName:'Pakora'},
    '후무스':{kcal:170,carb:14,pro:5,fat:10,portionG:100,enName:'Hummus'},
    '타불레':{kcal:140,carb:22,pro:4,fat:5,portionG:150,enName:'Tabbouleh'},
    '보렉':{kcal:280,carb:28,pro:8,fat:15,portionG:120,enName:'Börek'},
    '과카몰리':{kcal:160,carb:9,pro:2,fat:15,portionG:100,enName:'Guacamole'},
    '살사소스':{kcal:35,carb:7,pro:1, fat:0.3,portionG:80,enName:'Salsa'},
    '비나그레치':{kcal:60,carb:8,pro:1, fat:3,portionG:100,enName:'Vinagrete'},
    '파로파':{kcal:180,carb:30,pro:2, fat:6,portionG:80,enName:'Farofa'},
    '치미추리':{kcal:90,carb:2,pro:1, fat:9,portionG:30,enName:'Chimichurri'},
    '엠파나다':{kcal:260,carb:28,pro:9, fat:13,portionG:120,enName:'Empanada'},
    '살사 크리올라':{kcal:45,carb:7,pro:1, fat:2,portionG:80,enName:'Salsa Criolla'},
    '카우사':{kcal:240,carb:28,pro:8, fat:10,portionG:180,enName:'Causa'},
    '자알룩':{kcal:110,carb:10,pro:2, fat:7,portionG:120,enName:'Zaalouk'},
    '모로칸 당근 샐러드':{kcal:95,carb:14,pro:2, fat:4,portionG:120,enName:'Moroccan Carrot Salad'},
    '인제라':{kcal:160,carb:32,pro:5, fat:1,portionG:100,enName:'Injera'},
    '렌틸샐러드':{kcal:210,carb:28,pro:12, fat:6,portionG:180,enName:'Lentil Salad'}
  };

  const STYLE_TO_CUISINE = [
    {keys:['한식','한국','korean'], cuisine:'korean'},
    {keys:['일식','일본','japanese','japan'], cuisine:'japanese'},
    {keys:['중식','중국','chinese','china'], cuisine:'chinese'},
    
    {keys:['이탈리아','italian','italy'], cuisine:'italian'},
    {keys:['미국','american','usa'], cuisine:'american'},
    {keys:['프랑스','french','france'], cuisine:'french'},
    {keys:['스페인','spanish','spain'], cuisine:'spanish'},
    {keys:['그리스','greek','greece'], cuisine:'greek'},
    {keys:['태국','타이','thai','thailand'], cuisine:'thai'},
    {keys:['베트남','vietnam','vietnamese'], cuisine:'vietnamese'},
    {keys:['인도네시아','indonesia','indonesian'], cuisine:'indonesian'},
    {keys:['말레이시아','malaysia','malaysian'], cuisine:'malaysian'},
    {keys:['싱가포르','singapore'], cuisine:'singapore'},
    {keys:['필리핀','philippines','filipino'], cuisine:'filipino'},
    {keys:['대만','taiwan','taiwanese'], cuisine:'taiwanese'},
    {keys:['인도','indian','india'], cuisine:'indian'},
    {keys:['중동','middle','arab'], cuisine:'middleeast'},
    {keys:['터키','turkish','turkey'], cuisine:'turkish'},
    {keys:['멕시코','mexican','mexico'], cuisine:'mexican'},
    {keys:['브라질','brazil','brazilian'], cuisine:'brazilian'},
    {keys:['아르헨티나','argentina','argentinian'], cuisine:'argentinian'},
    {keys:['페루','peru','peruvian'], cuisine:'peruvian'},
    {keys:['모로코','morocco','moroccan'], cuisine:'moroccan'},
    {keys:['에티오피아','ethiopia','ethiopian'], cuisine:'ethiopian'}
  ];
  const KEYWORD_TO_CUISINE = [
    {re:/(찌개|탕|국|국밥|비빔밥|제육|불고기|갈비찜|닭볶음탕|삼겹살|보쌈|수육|잡채|냉면|떡볶이|감자탕|설렁탕|육개장|삼계탕|김밥)/, cuisine:'korean'},
    {re:/(라멘|우동|소바|가츠|카츠|돈카츠|오야코동|규동|텐동|스시|초밥|데리야키|가라아게|샤브샤브|나베|오코노미야키)/, cuisine:'japanese'},
    {re:/(짜장|짬뽕|마파|탕수육|깐풍|라조기|마라|딤섬|광동|사천|중식|우육면|완탕|멘보샤)/, cuisine:'chinese'},
    {re:/(파스타|리조또|스테이크|피자|샌드위치|버거|수프|스튜|그라탕|뇨키)/, cuisine:'western'},
    {re:/(알리오|봉골레|카르보나라|마르게리타|라자냐|브루스케타|미네스트로네|포카치아|카프레제)/, cuisine:'italian'},
    {re:/(파에야|감바스|가스파초|타파스|오믈렛|파타타스)/, cuisine:'spanish'},
    {re:/(그릭|기로스|무사카|수블라키|차지키|호르타)/, cuisine:'greek'},
    {re:/(팟타이|팟씨유|똠얌|똠카|그린커리|레드커리|카오|쏨땀|라브|태국|타이)/, cuisine:'thai'},
    {re:/(쌀국수|반미|분짜|분보|고이꾸온|껌|베트남)/, cuisine:'vietnamese'},
    {re:/(나시고랭|미고랭|사테|렌당|가도가도|인도네시아)/, cuisine:'indonesian'},
    {re:/(락사|나시르막|바쿠테|말레이시아)/, cuisine:'malaysian'},
    {re:/(하이난|칠리크랩|싱가포르|오타오타|차이 타우)/, cuisine:'singapore'},
    {re:/(아도보|시니강|판싯|이나살|필리핀)/, cuisine:'filipino'},
    {re:/(우육면|피단|대만)/, cuisine:'taiwanese'},
    {re:/(커리|카레|탄두리|버터치킨|비리야니|달 |마살라|팔락|파니르|인도)/, cuisine:'indian'},
    {re:/(케밥|팔라펠|후무스|쿠스쿠스|타진|샥슈카|중동)/, cuisine:'middleeast'},
    {re:/(보렉|쾨프테|이스켄데르|터키)/, cuisine:'turkish'},
    {re:/(타코|부리토|엔칠라다|퀘사디야|나초|멕시코)/, cuisine:'mexican'},
    {re:/(브라질|무케카|코시냐)/, cuisine:'brazilian'},
    {re:/(아사도|엠파나다|아르헨티나)/, cuisine:'argentinian'},
    {re:/(세비체|로모|페루)/, cuisine:'peruvian'},
    {re:/(모로코|타진|자알룩)/, cuisine:'moroccan'},
    {re:/(에티오피아|인제라)/, cuisine:'ethiopian'}
  ];
  const KOREAN_SIDE_RE = /(김치|깍두기|나물|시금치나물|콩나물무침|무나물|겉절이|멸치볶음|오이소박이|장아찌)/;
  function cleanStyleText(v){ return String(v||'').replace(/[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}]/gu,'').replace(/[^0-9A-Za-z가-힣]/g,' ').trim().toLowerCase(); }
  function unique(arr){ return [...new Set((arr||[]).filter(Boolean))]; }
  function getEntry(name){ return (typeof MENU_DB !== 'undefined' && MENU_DB) ? MENU_DB[name] : null; }
  function detectCuisine(name){
    const e=getEntry(name)||{};
    const texts=unique([e.style, e.baseName, ...(Array.isArray(e.styles)?e.styles:[]), ...(Array.isArray(e.tags)?e.tags:[])]).map(cleanStyleText);
    for(const s of texts){ for(const row of STYLE_TO_CUISINE){ if(row.keys.some(k=>s.includes(cleanStyleText(k)))) return row.cuisine; } }
    const n=String(name||'');
    for(const row of KEYWORD_TO_CUISINE){ if(row.re.test(n)) return row.cuisine; }
    return 'global';
  }
  function sideNamesFor(name,type){
    if(type==='아침') return [];
    const cuisine=detectCuisine(name);
    let sides=(SIDE_POOL[cuisine]||SIDE_POOL.global).slice(0,2);
    if(cuisine!=='korean' && cuisine!=='global') sides=sides.filter(s=>!KOREAN_SIDE_RE.test(s));
    return sides;
  }

  // MENU_DB에 사이드 메뉴 최소 엔트리 추가: 추천/검색/레시피 클릭 시 side로 인식
  try{
    if(typeof MENU_DB !== 'undefined'){
      Object.entries(SIDE_NUTRITION).forEach(([name,nut])=>{
        if(!MENU_DB[name]){
          MENU_DB[name]={name,styles:['사이드'],tags:['side','반찬','메인추천제외'],mealRole:'side',menuType:'side',category:'사이드',cookTime:10,ingredients:[],ingredientIds:[],ingredientAmounts:{},enName:nut.enName};
        }else{
          MENU_DB[name].mealRole = MENU_DB[name].mealRole || 'side';
          MENU_DB[name].menuType = MENU_DB[name].menuType || 'side';
          MENU_DB[name].category = MENU_DB[name].category || '사이드';
          MENU_DB[name].tags = [...new Set([...(MENU_DB[name].tags||[]),'side','반찬','메인추천제외'])];
          MENU_DB[name].enName = MENU_DB[name].enName || nut.enName;
        }
      });
    }
  }catch(e){ }

  // 레시피 팝업이 비지 않도록 최소 레시피 추가
  try{
    if(typeof SIDES_RECIPE !== 'undefined'){
      Object.entries(SIDE_NUTRITION).forEach(([name,nut])=>{
        if(!SIDES_RECIPE[name]){
          SIDES_RECIPE[name]={
            desc:(nut.enName||name)+' 사이드 메뉴',
            ingredients:['주재료 1인분','소금 약간','향신료 또는 소스 약간'],
            steps:['재료를 손질한다','소스 또는 양념을 더해 가볍게 조리하거나 버무린다','메인 메뉴와 함께 곁들인다'],
            cookTime:10,
            tip:'국가별 메인 요리와 어울리도록 추천되는 사이드예요.'
          };
        }
      });
    }
  }catch(e){ }

  const prevCalc = typeof window.calcNutrition === 'function' ? window.calcNutrition : (typeof calcNutrition === 'function' ? calcNutrition : null);
  window.calcNutrition = calcNutrition = function(name, servings){
    const key=String(name||'').trim();
    const nut=SIDE_NUTRITION[key];
    if(nut){
      const mult=Math.max(1, Number(servings)||1);
      return {
        cal:Math.round(nut.kcal*mult),
        kcal:Math.round(nut.kcal*mult),
        carb:Math.round(nut.carb*mult*10)/10,
        pro:Math.round(nut.pro*mult*10)/10,
        protein:Math.round(nut.pro*mult*10)/10,
        fat:Math.round(nut.fat*mult*10)/10,
        portionG:nut.portionG,
        enName:nut.enName,
        source:'country-side-nutrition-db'
      };
    }
    return prevCalc ? prevCalc(name, servings) : {cal:0,kcal:0,carb:0,pro:0,protein:0,fat:0};
  };

  window.getCountrySideCuisine = detectCuisine;
  window.getCountrySides = function(name,type){ return sideNamesFor(name,type); };
  window.getSmartSides = function(name,type){ return sideNamesFor(name,type); };
  window.getSides = getSides = function(name,type){ return sideNamesFor(name,type); };
  window.refreshMealSidesByCuisine = function(){
    const patchMeal = function(meal){ if(meal && meal.name) meal.sides = sideNamesFor(meal.name, meal.type); };
    try{
      if(window.S && S.mealPlan && Array.isArray(S.mealPlan.weeklyMeal)){
        S.mealPlan.weeklyMeal.forEach(d=>(d.meals||[]).forEach(patchMeal));
        if(typeof saveMeal==='function') saveMeal();
      }
      if(window.S && S.mealCalendar){
        Object.values(S.mealCalendar).forEach(list=>(list||[]).forEach(patchMeal));
        localStorage.setItem('wm_cal', JSON.stringify(S.mealCalendar));
      }
      return true;
    }catch(e){ return false; }
  };
  try{ window.refreshMealSidesByCuisine(); }catch(e){}
  window.WM_COUNTRY_SIDE_PATCH_V1={applied:true,cuisineCount:Object.keys(SIDE_POOL).length,sideNutritionCount:Object.keys(SIDE_NUTRITION).length,mode:'2 sides per cuisine; foreign Korean-side fallback blocked'};
  })();

(function(){
  function money(n){ return '₩'+Math.max(0,Math.round(n||0)).toLocaleString('ko-KR'); }
  function _numFromAmount(amount){
    const s=String(amount||'');
    const m=s.replace(/,/g,'').match(/([0-9]+(?:\.[0-9]+)?)/);
    return m?parseFloat(m[1]):1;
  }
  function estimateIngredientCost(item){
    const name=String((item&&item.replaceName)||item.name||'');
    const amt=String((item&&item.replaceQty)||item.amount||'');
    if(item&&item.inFridge) return 0;
    const n=_numFromAmount(amt);
    let base=1200;
    if(/소고기|한우|차돌|갈비|등심|안심|채끝|부채살|살치살|립아이|티본|토마호크/i.test(name)) base=8500;
    else if(/돼지|삼겹|목살|앞다리|등갈비|돈카츠|차슈|베이컨/i.test(name)) base=5200;
    else if(/닭|치킨|닭가슴|닭다리|날개|계란|달걀/i.test(name)) base=3600;
    else if(/연어|새우|오징어|낙지|고등어|갈치|조개|홍합|해물|생선|참치|가리비|전복/i.test(name)) base=6000;
    else if(/쌀|밥|면|우동|라멘|파스타|소바|국수|빵|또르티야|떡/i.test(name)) base=2200;
    else if(/간장|고추장|된장|식초|소스|오일|기름|버터|치즈|향신료|커리|마요|설탕|소금/i.test(name)) base=1800;
    else if(/상추|배추|양파|대파|마늘|당근|오이|토마토|버섯|양배추|감자|고구마|브로콜리|채소|야채/i.test(name)) base=1400;
    if(/g|그램/i.test(amt)) return base*Math.max(.35, Math.min(3.5,n/300));
    if(/ml|리터/i.test(amt)) return base*Math.max(.25, Math.min(2.5,n/250));
    if(/개|쪽|장|컵|큰술|작은술/i.test(amt)) return base*Math.max(.25, Math.min(3,n/3));
    return base;
  }
  function categoryCost(items){return (items||[]).reduce((s,i)=>s+estimateIngredientCost(i),0);}
  function shop3ItemCard(item, idx){
    const hf=!!item.inFridge;
    const checked=!!item.checked;
    const shopInfo=!hf?getIngredientShopUrl(item.replaceName||item.name):null;
    const used=item.usedIn?('사용 메뉴 · '+item.usedIn):'식단 메뉴에 사용';
    return `<div class="shop3-card ${hf?'owned':''} ${checked?'checked':''}">
      <div class="shop3-check ${checked?'done':''}" onclick="S.cart[${idx}].checked=!S.cart[${idx}].checked;render()">${checked?'✓':''}</div>
      <div class="shop3-icon" onclick="S.cart[${idx}].checked=!S.cart[${idx}].checked;render()">${item.icon||getIcon(item.name)}</div>
      <div class="shop3-info" onclick="S.cart[${idx}].checked=!S.cart[${idx}].checked;render()">
        <div class="shop3-name">${item.replaceName||item.name}${hf?'<span class="shop3-badge">❄️ 보유</span>':''}</div>
        <div class="shop3-amount">${item.replaceQty||item.amount||''}${!hf?' · 예상 '+money(estimateIngredientCost(item)):''}</div>
        <div class="shop3-used">${used}</div>
      </div>
      ${!hf&&!checked&&shopInfo?`<a class="shop3-buy" href="${shopInfo.url}" target="_blank" onclick="event.stopPropagation()">쿠팡</a>`:''}
      <button class="shop3-edit" onclick="openEditCart(${idx})">✎</button>
    </div>`;
  }
  function renderShoppingSprint3A(kind){
    const cart=S.cart||[];
    const isBC=kind==='bc';
    if(!cart.length){
      return `<div class="shop3-empty"><div style="font-size:48px;margin-bottom:12px">🛒</div><div style="font-weight:900;font-size:18px;color:#171B2A">장보기 목록이 비어있어요</div><div style="font-size:13px;margin-top:7px">식단을 만들면 필요한 재료가 자동으로 정리돼요</div><button onclick="go('home')" class="btn-p" style="margin-top:20px">홈으로</button></div>`;
    }
    const cats=['단백질','채소','면·밥','양념','기타'];
    const catIcon={채소:'🥬',단백질:'🥩',양념:'🧄','면·밥':'🍚',기타:'🛒'};
    const done=cart.filter(i=>i.checked).length;
    const fridgeCount=cart.filter(i=>i.inFridge).length;
    const needBuy=cart.length-fridgeCount;
    const buyDone=cart.filter(i=>i.checked&&!i.inFridge).length;
    const progress=needBuy?Math.round(buyDone/needBuy*100):100;
    const totalCost=categoryCost(cart);
    let body='';
    cats.forEach(cat=>{
      let items=cart.filter(i=>(i.category||'기타')===cat);
      if(!items.length) return;
      items=items.slice().sort((a,b)=>(a.inFridge?1:0)-(b.inFridge?1:0));
      const cost=categoryCost(items);
      body+=`<div class="shop3-cat"><div class="shop3-cat-head"><div class="shop3-cat-title"><span>${catIcon[cat]}</span><span>${cat}</span><span style="color:#9AA3B2;font-size:12px">${items.length}</span></div><div class="shop3-cat-sub">예상 ${money(cost)}</div></div>`;
      items.forEach(item=>body+=shop3ItemCard(item, cart.indexOf(item)));
      body+='</div>';
    });
    const back=isBC?`<button class="back" onclick="go(S.bcMode==='b'?'b-suggest':'bc-entry')" style="margin:20px 18px 10px">←</button>`:'';
    const toolbar=`<div class="shop3-toolbar"><button onclick="S.cart.forEach((_,i)=>S.cart[i].checked=true);render()" style="background:var(--primary-pale);color:var(--primary)">✓ 전체선택</button><button onclick="S.cart.forEach((_,i)=>S.cart[i].checked=false);render()" style="background:#fff;color:#8A94A6">전체해제</button>${!isBC?`<button onclick="S.cart=S.cart.filter(i=>!i.checked||i.inFridge);render()" style="background:#FFF0F0;color:#e53935">선택삭제</button>`:`<button onclick="makeBCMealNow()" style="background:#E9FFF2;color:#059669">식단생성</button>`}</div>`;
    const bottom=isBC
      ? `<div class="bottom-bar"><div class="shop3-bottom-two"><button class="btn-g" onclick="${done>0?'addToFridge()':'makeBCMealNow()'}">${done>0?'❄️ 냉장고 반영':'🍽️ 바로 생성'}</button><button class="btn-p" onclick="makeBCMealNow()">식단 생성</button></div></div>`
      : `<div class="bottom-bar">${S.cartDone?`<button onclick="go('home')" class="btn-p">🏠 홈으로 돌아가기</button>`:`<button class="btn-g" ${done===0?'disabled':''} onclick="addToFridge()">❄️ 구매완료 - 냉장고에 넣기 (${done}개)</button>`}</div>`;
    return `${back}<div class="shop3-hero"><div class="shop3-hero-title">${isBC?(S.people||1)+'인분 장보기':'이번 주 장보기'}</div><div class="shop3-hero-main">구매 필요 ${needBuy}개</div><div class="shop3-hero-cost">냉장고 보유 ${fridgeCount}개</div><div class="shop3-progress"><span style="width:${progress}%"></span></div><div style="font-size:11px;margin-top:7px;opacity:.84">${buyDone}/${needBuy} 구매완료 · ${progress}%</div></div><div class="shop3-metrics"><div class="shop3-metric"><div class="label">전체</div><div class="num">${cart.length}</div></div><div class="shop3-metric"><div class="label">구매필요</div><div class="num">${needBuy}</div></div></div>${toolbar}<div class="shop3-wrap">${body}</div>${bottom}<div id="cart-modal" style="display:none" class="modal-bg"><div class="modal-card"><div style="font-weight:800;font-size:17px;margin-bottom:16px" id="cart-modal-name"></div><div class="sec" style="margin-bottom:4px">대체 재료명</div><input id="cart-rep-name" class="inp" style="width:100%;margin-bottom:10px" placeholder="그대로면 비워두세요"><div class="sec" style="margin-bottom:4px">수량 수정</div><input id="cart-rep-qty" class="inp" style="width:100%;margin-bottom:16px" placeholder="예: 500g"><button class="btn-p" onclick="confirmEditCart()">수정 완료</button><button onclick="document.getElementById('cart-modal').style.display='none'" style="width:100%;padding:12px;background:none;border:none;color:#aaa;font-size:14px;margin-top:6px">취소</button></div></div>`;
  }
  window.rBCCart=function(){return renderShoppingSprint3A('bc');};
  window.rCartTab=function(){return renderShoppingSprint3A('tab');};
})();

(function(){
  function money(n){return '₩'+Math.max(0,Math.round(n||0)).toLocaleString('ko-KR');}
  function numFromAmount(amount){const m=String(amount||'').replace(/,/g,'').match(/([0-9]+(?:\.[0-9]+)?)/);return m?parseFloat(m[1]):1;}
  function estimateIngredientCost(item){
    const name=String((item&&item.replaceName)||item.name||''); const amt=String((item&&item.replaceQty)||item.amount||'');
    if(item&&item.inFridge) return 0; const n=numFromAmount(amt); let base=1200;
    if(/소고기|한우|차돌|갈비|등심|안심|채끝|부채살|살치살|립아이|티본|토마호크/i.test(name)) base=8500;
    else if(/돼지|삼겹|목살|앞다리|등갈비|돈카츠|차슈|베이컨/i.test(name)) base=5200;
    else if(/닭|치킨|닭가슴|닭다리|날개|계란|달걀/i.test(name)) base=3600;
    else if(/연어|새우|오징어|낙지|고등어|갈치|조개|홍합|해물|생선|참치|가리비|전복/i.test(name)) base=6000;
    else if(/쌀|밥|면|우동|라멘|파스타|소바|국수|빵|또르티야|떡/i.test(name)) base=2200;
    else if(/간장|고추장|된장|식초|소스|오일|기름|버터|치즈|향신료|커리|마요|설탕|소금/i.test(name)) base=1800;
    else if(/상추|배추|양파|대파|마늘|당근|오이|토마토|버섯|양배추|감자|고구마|브로콜리|채소|야채/i.test(name)) base=1400;
    if(/g|그램/i.test(amt)) return base*Math.max(.35,Math.min(3.5,n/300));
    if(/ml|리터/i.test(amt)) return base*Math.max(.25,Math.min(2.5,n/250));
    if(/개|쪽|장|컵|큰술|작은술/i.test(amt)) return base*Math.max(.25,Math.min(3,n/3));
    return base;
  }
  function categoryCost(items){return (items||[]).reduce((s,i)=>s+estimateIngredientCost(i),0);}
  function toggleCart(idx){S.cart[idx].checked=!S.cart[idx].checked;render();}
  window.shop3BToggle=toggleCart;
  window.shop3BMarkNeedBuyDone=function(){(S.cart||[]).forEach((i,idx)=>{if(!i.inFridge)S.cart[idx].checked=true;});render();};
  window.shop3BUncheckNeedBuy=function(){(S.cart||[]).forEach((i,idx)=>{if(!i.inFridge)S.cart[idx].checked=false;});render();};
  function itemCard(item,idx){
    const hf=!!item.inFridge, checked=!!item.checked, bought=checked&&!hf;
    const shopInfo=!hf?getIngredientShopUrl(item.replaceName||item.name):null;
    const used=item.usedIn?('사용 메뉴 · '+item.usedIn):'식단 메뉴에 사용';
    return `<div class="shop3-card ${hf?'owned':''} ${bought?'done-buy':''}">
      <div class="shop3-check ${checked?'done':''}" onclick="shop3BToggle(${idx})">${checked?'✓':''}</div>
      <div class="shop3-icon" onclick="shop3BToggle(${idx})">${item.icon||getIcon(item.name)}</div>
      <div class="shop3-info" onclick="shop3BToggle(${idx})">
        <div class="shop3-name">${item.replaceName||item.name}${hf?'<span class="shop3-badge">❄️ 보유</span>':bought?'<span class="shop3-badge" style="background:#F2F4F7;color:#667085">구매완료</span>':''}</div>
        <div class="shop3-amount">${item.replaceQty||item.amount||''}</div>
        <div class="shop3-used">${used}</div>
      </div>
      ${!hf&&!checked&&shopInfo?`<a class="shop3-buy" href="${shopInfo.url}" target="_blank" onclick="event.stopPropagation()">쿠팡</a>`:''}
      <button class="shop3-edit" onclick="openEditCart(${idx})">✎</button>
    </div>`;
  }
  function renderShoppingSprint3B(kind){
    const cart=S.cart||[]; const isBC=kind==='bc';
    if(!cart.length){return `<div class="shop3-empty"><div style="font-size:48px;margin-bottom:12px">🛒</div><div style="font-weight:900;font-size:18px;color:#171B2A">장보기 목록이 비어있어요</div><div style="font-size:13px;margin-top:7px">식단을 만들면 필요한 재료가 자동으로 정리돼요</div><button onclick="go('home')" class="btn-p" style="margin-top:20px">홈으로</button></div>`;}
    const cats=['단백질','채소','면·밥','양념','기타']; const catIcon={채소:'🥬',단백질:'🥩',양념:'🧄','면·밥':'🍚',기타:'🛒'};
    const total=cart.length, fridgeCount=cart.filter(i=>i.inFridge).length, needBuy=cart.filter(i=>!i.inFridge).length;
    const buyDone=cart.filter(i=>i.checked&&!i.inFridge).length, remain=Math.max(0,needBuy-buyDone);
    const progress=needBuy?Math.round(buyDone/needBuy*100):100, totalCost=categoryCost(cart);
    let body='';
    cats.forEach(cat=>{
      const raw=cart.filter(i=>(i.category||'기타')===cat); if(!raw.length)return;
      const active=raw.filter(i=>!i.inFridge).sort((a,b)=>(a.checked?1:0)-(b.checked?1:0));
      const owned=raw.filter(i=>i.inFridge);
      const activeDone=active.filter(i=>i.checked).length;
      body+=`<div class="shop3-cat"><div class="shop3-cat-head"><div class="shop3-cat-title"><span>${catIcon[cat]}</span><span>${cat}</span><span style="color:#9AA3B2;font-size:12px">${activeDone}/${active.length}</span></div></div>`;
      active.forEach(item=>body+=itemCard(item,cart.indexOf(item)));
      if(owned.length){body+=`<div class="shop3b-cat-owned"><div class="shop3b-owned-title"><span>❄️ 냉장고 보유</span><span>${owned.length}개</span></div>`; owned.forEach(item=>body+=itemCard(item,cart.indexOf(item))); body+='</div>';}
      body+='</div>';
    });
    const back=isBC?`<button class="back" onclick="go(S.bcMode==='b'?'b-suggest':'bc-entry')" style="margin:20px 18px 10px">←</button>`:'';
    const toolbar=`<div class="shop3-toolbar"><button onclick="shop3BMarkNeedBuyDone()" style="background:var(--primary-pale);color:var(--primary)">✓ 전체 담기</button><button onclick="shop3BUncheckNeedBuy()" style="background:#fff;color:#8A94A6;border:1px solid #E8E8F0">전체 해제</button></div>`;
    const complete=progress>=100?`<div class="shop3b-complete"><strong>장보기 체크 완료</strong><span>구매한 재료를 냉장고에 반영하거나 바로 식단을 생성하세요.</span></div>`:'';
    const fridgeReady=buyDone>0;
    const mealReady=S.fridgeAdded===true;
    const stepHint=!fridgeReady
      ?'① 재료를 체크하고 냉장고에 반영하세요'
      :!mealReady
        ?'② 냉장고 반영 완료! 이제 식단을 생성하세요 →'
        :'✓ 준비 완료!';
    const bottom=`<div class="bottom-bar">
      <div style="padding:0 4px 8px">
        <div style="display:flex;gap:0;flex:1;background:#F0F0F8;border-radius:12px;padding:6px 10px;align-items:center;margin-bottom:10px">
          <span style="font-size:11px;font-weight:800;color:${fridgeReady?'#10B981':'#6D5DF6'}">① 담기</span>
          <span style="font-size:10px;color:#D1D5DB;margin:0 5px">›</span>
          <span style="font-size:11px;font-weight:800;color:${fridgeReady&&!mealReady?'#6D5DF6':mealReady?'#10B981':'#9CA3AF'}">② 냉장고 반영</span>
          <span style="font-size:10px;color:#D1D5DB;margin:0 5px">›</span>
          <span style="font-size:11px;font-weight:800;color:${mealReady?'#6D5DF6':'#9CA3AF'}">③ 식단 생성</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px">
          <button class="btn-g" onclick="addToFridge()"
            style="background:${!fridgeReady?'linear-gradient(135deg,#9CA3AF,#6B7280)!important':''};opacity:${mealReady?'.55':'1'}"
            ${!fridgeReady?'disabled':''}>
            ❄️ 냉장고 반영
          </button>
          <button class="btn-p" onclick="makeBCMealNow()"
            style="background:${!mealReady?'linear-gradient(135deg,#9CA3AF,#6B7280)!important':''}"
            ${!mealReady?'disabled':''}>
            🍽️ 식단 생성
          </button>
        </div>
        <div style="text-align:center;font-size:11px;color:${mealReady?'#6D5DF6':fridgeReady?'#10B981':'#9CA3AF'};font-weight:700;margin-top:8px">${stepHint}</div>
      </div>
    </div>`;
    return `${back}<div class="shop3-hero"><div class="shop3b-hero-row"><div><div class="shop3-hero-title">${isBC?(S.people||1)+'인분 장보기':'이번 주 장보기'}</div><div class="shop3-hero-main">${remain>0?'남은 구매 '+remain+'개':'구매 체크 완료'}</div></div><div class="shop3b-ring" style="--p:${progress}%"><span>${progress}%</span></div></div><div class="shop3b-status"><span class="shop3b-pill">전체 ${total}</span><span class="shop3b-pill">구매 ${buyDone}/${needBuy}</span><span class="shop3b-pill">보유 ${fridgeCount}</span></div><div class="shop3-progress"><span style="width:${progress}%"></span></div></div><div class="shop3-metrics"><div class="shop3-metric"><div class="label">남은구매</div><div class="num">${remain}</div></div><div class="shop3-metric"><div class="label">완료율</div><div class="num">${progress}%</div></div></div>${toolbar}${complete}<div class="shop3-wrap">${body}</div>${bottom}<div id="cart-modal" style="display:none" class="modal-bg"><div class="modal-card"><div style="font-weight:800;font-size:17px;margin-bottom:16px" id="cart-modal-name"></div><div class="sec" style="margin-bottom:4px">대체 재료명</div><input id="cart-rep-name" class="inp" style="width:100%;margin-bottom:10px" placeholder="그대로면 비워두세요"><div class="sec" style="margin-bottom:4px">수량 수정</div><input id="cart-rep-qty" class="inp" style="width:100%;margin-bottom:16px" placeholder="예: 500g"><button class="btn-p" onclick="confirmEditCart()">수정 완료</button><button onclick="document.getElementById('cart-modal').style.display='none'" style="width:100%;padding:12px;background:none;border:none;color:#aaa;font-size:14px;margin-top:6px">취소</button></div></div>`;
  }
  window.rBCCart=function(){return renderShoppingSprint3B('bc');};
  window.rCartTab=function(){return renderShoppingSprint3B('tab');};
})();

// ── CLEAN_MENUS → MENU_SCHEMA_V2 등록 ──
(function(){
  if(typeof CLEAN_MENUS !== 'undefined' && typeof MENU_SCHEMA_V2 === 'object') {
    CLEAN_MENUS.forEach(function(m){ if(!MENU_SCHEMA_V2[m.name]) MENU_SCHEMA_V2[m.name] = m; });
  }
  if(typeof buildMenuDBV2 === 'function') buildMenuDBV2();
})();

(function(){
  function safeArr(v){ return Array.isArray(v) ? v : []; }
  function flowDisplayName(style){ try{return typeof bcStyleDisplayName==='function'?bcStyleDisplayName(style):String(style||'').replace(/^\S+\s+/,'').trim();}catch(e){return String(style||'');} }
  function flowStepPercent(done,total){ return Math.max(0,Math.min(100,Math.round((done/Math.max(total,1))*100))); }
  function flowHeader(o){
    var tone=o.tone||'';
    var p=flowStepPercent(o.done||0,o.total||3);
    return '<div class="wm-flow-top">'
      +'<div><div class="wm-flow-kicker">'+(o.kicker||'MEAL FLOW')+'</div><div class="wm-flow-title">'+(o.title||'식단 생성')+'</div><div class="wm-flow-sub">'+(o.sub||'')+'</div></div>'
      +'<button class="wm-flow-reset" onclick="'+(o.back||'go(\'home\')')+'">'+(o.backText||'← 홈')+'</button></div>'
      +'<div class="wm-flow-hero '+tone+'"><div class="wm-flow-hero-row"><div class="wm-flow-hero-main"><b>'+(o.heroTitle||'식단 만들기')+'</b><span>'+(o.heroSub||'')+'</span></div><div class="wm-flow-hero-icon">'+(o.icon||'🍳')+'</div></div><div class="wm-flow-progress"><i style="width:'+p+'%"></i></div><div class="wm-flow-progress-label">진행률 '+p+'% · '+(o.status||'입력 중')+'</div></div>';
  }
  function stat(label,value){ return '<div class="wm-flow-stat"><span>'+label+'</span><b>'+value+'</b></div>'; }
  function section(icon,title,sub,pill,body,extraClass){ return '<div class="wm-flow-section '+(extraClass||'')+'"><div class="wm-flow-section-head"><div class="wm-flow-section-title"><div class="wm-flow-section-icon">'+icon+'</div><div><b>'+title+'</b><span>'+sub+'</span></div></div>'+pill+'</div><div class="wm-flow-body">'+body+'</div></div>'; }
  function pill(txt,cls){ return '<span class="wm-flow-pill '+(cls||'')+'">'+txt+'</span>'; }
  function chip(txt,cls,onclick){ return '<button type="button" '+(onclick?'onclick="'+onclick+'"':'')+' class="wm-flow-chip '+(cls||'')+'">'+txt+'</button>'; }
  function fridgeSummaryRows(){
    var items=[...safeArr(S.fridge)].sort(function(a,b){return getDday(a.addedAt,a.expireDays)-getDday(b.addedAt,b.expireDays);}).slice(0,5);
    if(!items.length) return '<div class="wm-flow-empty">냉장고가 비어있어요<br><span style="font-size:11.5px;color:#A8B0BD">재료를 추가하면 바로 식단을 만들 수 있어요</span></div>';
    return items.map(function(ing,idx){ var d=getDday(ing.addedAt,ing.expireDays); return '<div class="wm-flow-row"><div class="wm-flow-row-icon">'+(ing.icon||getIcon(ing.name))+'</div><div class="wm-flow-row-main"><b>'+ing.name+'</b><span>'+((ing.qty||'')+(ing.unit||''))+' · '+(d<=0?'만료':d+'일 남음')+'</span></div>'+ddayBadge(d)+'</div>'; }).join('')
      +(safeArr(S.fridge).length>5?'<div style="font-size:11px;color:#8B95A1;text-align:center;margin-top:4px">외 '+(safeArr(S.fridge).length-5)+'개 재료</div>':'');
  }
  function styleChips(selected){
    var sel=safeArr(selected);
    if(!sel.length) return '<div class="wm-flow-empty">선택된 스타일이 없어요<br><span style="font-size:11.5px;color:#A8B0BD">한식, 일식, 국가별 스타일을 선택해주세요</span></div>';
    return '<div class="wm-flow-chip-wrap">'+sel.map(function(s,i){ return chip(flowDisplayName(s)+' ✕','active','S.bcStyles.splice('+i+',1);render()'); }).join('')+'</div>';
  }
  window.rHomeA = rHomeA = function(){
    var fridgeDone=safeArr(S.fridge).length>0;
    var styleDone=safeArr(S.bcStyles).length>0;
    var mealDone=!!S.mealPlan;
    var done=(fridgeDone?1:0)+(styleDone?1:0)+(mealDone?1:0);
    var urgent=safeArr(S.fridge).filter(function(i){var d=getDday(i.addedAt,i.expireDays); return d<=3&&d>0;}).length;
    return '<div class="wm-flow-page">'
      +flowHeader({kicker:'A FLOW',title:'냉장고 재료로 짜기',sub:'보유 재료를 확인하고 취향만 더해 식단을 생성해요.',tone:'green',done:done,total:3,heroTitle:safeArr(S.fridge).length+'가지 재료 사용 가능',heroSub:(styleDone?'선택 스타일: '+safeArr(S.bcStyles).map(flowDisplayName).join(', '):'냉장고 확인 → 스타일 선택 → 식단 생성'),icon:'❄️',status:mealDone?'식단 생성 완료':styleDone?'생성 준비 완료':fridgeDone?'스타일 선택 필요':'재료 확인 필요',back:'S.mealPlan?confirmNewPlan():resetFlow()',backText:'초기화'})
      +'<div class="wm-flow-grid">'+stat('냉장고',safeArr(S.fridge).length+'개')+stat('임박',urgent+'개')+stat('인원',S.people+'인')+'</div>'
      +section('❄️','냉장고 확인',fridgeDone?safeArr(S.fridge).length+'가지 재료 입력됨':'재료를 먼저 추가해주세요',pill(fridgeDone?'완료':'필요',fridgeDone?'done':'wait'),fridgeSummaryRows()+'<button class="wm-flow-mini-btn subtle" style="width:100%;margin-top:10px" onclick="go(\'a-fridge\')">냉장고 재료 관리</button>')
      +section('🍽️','식사 스타일 선택',styleDone?safeArr(S.bcStyles).map(flowDisplayName).join(' · '):'한식/일식/중식/국가별 선택',pill(styleDone?'완료':'대기',styleDone?'done':'wait'),styleChips(S.bcStyles)+'<button class="wm-flow-mini-btn subtle" style="width:100%;margin-top:10px" onclick="go(\'a-style\')" '+(!fridgeDone?'disabled style="opacity:.45;width:100%;margin-top:10px"':'')+'>스타일 선택하기</button>')
      +section('✨','AI 식단 생성',mealDone?'식단 생성이 완료됐어요':'재료와 스타일을 기반으로 식단을 만들어요',pill(mealDone?'완료':(fridgeDone&&styleDone?'준비됨':'대기'),mealDone?'done':(fridgeDone&&styleDone?'':'wait')),'<div class="wm-flow-row"><div class="wm-flow-row-icon">📅</div><div class="wm-flow-row-main"><b>'+(mealDone?'식단표에서 확인 가능':'생성 준비 상태')+'</b><span>'+(fridgeDone&&styleDone?'선택 정보를 바탕으로 생성할 수 있어요':'냉장고와 스타일을 먼저 완료해주세요')+'</span></div>'+(mealDone?'<button class="wm-flow-mini-btn green" onclick="go(\'a-meal\')">보기</button>':'')+'</div>')
      +'</div><div class="wm-flow-cta"><button class="btn-p" '+(!(fridgeDone&&styleDone)?'disabled':'')+' onclick="'+(mealDone?'go(\'a-meal\')':'genAMeal()')+'">'+(mealDone?'📅 생성된 식단 보기':'✨ AI 식단 생성')+'</button></div>';
  };
  window.rAFridge = rAFridge = function(){
    var sorted=[...safeArr(S.fridge)].sort(function(a,b){return getDday(a.addedAt,a.expireDays)-getDday(b.addedAt,b.expireDays);});
    var urgent=sorted.filter(function(i){var d=getDday(i.addedAt,i.expireDays);return d<=3&&d>0;}).length;
    var rows=sorted.length?sorted.map(function(ing,i){var d=getDday(ing.addedAt,ing.expireDays);return '<div class="wm-flow-row"><div class="wm-flow-row-icon">'+(ing.icon||getIcon(ing.name))+'</div><div class="wm-flow-row-main"><b>'+ing.name+' '+storageBadge(ing.storage||getShelfLife(ing.name).storage)+'</b><span>'+((ing.qty||'')+(ing.unit||''))+' · '+(d<=0?'만료':d+'일 남음')+'</span></div>'+ddayBadge(d)+'<button class="wm-flow-mini-btn subtle" onclick="editFI('+i+')">수정</button><button class="wm-flow-mini-btn wm-flow-danger" onclick="S.fridge.splice('+i+',1);saveFridge();render()">삭제</button></div>';}).join(''):'<div class="wm-flow-empty">냉장고가 비어있어요<br><span style="font-size:11.5px;color:#A8B0BD">재료를 직접 추가해주세요</span></div>';
    return '<div class="wm-flow-page">'+flowHeader({kicker:'A FLOW · INPUT',title:'냉장고 재료 확인',sub:'현재 보유 재료를 확인하고 부족한 재료를 추가하세요.',tone:'green',done:1,total:3,heroTitle:sorted.length+'가지 재료',heroSub:'유통기한이 가까운 재료를 우선 반영해 식단을 만들어요.',icon:'🥬',status:'재료 확인',back:'go(\'home\')',backText:'← 홈'})+'<div class="wm-flow-grid">'+stat('전체',sorted.length+'개')+stat('임박',urgent+'개')+stat('인원',S.people+'인')+'</div>'+section('🥬','보유 재료 목록','식단에 활용할 재료입니다',pill(sorted.length?'확인됨':'비어있음',sorted.length?'done':'wait'),rows+'<button class="wm-flow-mini-btn subtle" style="width:100%;margin-top:10px" onclick="openAddFI()">+ 재료 직접 추가</button>')+'</div><div class="wm-flow-cta"><button class="btn-p" onclick="go(\'a-style\')" '+(!sorted.length?'disabled':'')+'>다음 · 식사 스타일 선택</button></div>';
  };
  window.rAStyle = rAStyle = function(){
    if(typeof normalizeBCStylesV8==='function') normalizeBCStylesV8();
    var sel=safeArr(S.bcStyles);
    var styles=[{id:'한식',e:'🍚'},{id:'일식',e:'🍱'},{id:'중식',e:'🥢'},{id:'헬시',e:'🥗'},{id:'🇹🇭 태국',e:'🇹🇭'},{id:'🇻🇳 베트남',e:'🇻🇳'},{id:'🇮🇩 인도네시아',e:'🇮🇩'},{id:'🇲🇾 말레이시아',e:'🇲🇾'},{id:'🇸🇬 싱가포르',e:'🇸🇬'},{id:'🇵🇭 필리핀',e:'🇵🇭'},{id:'🇮🇳 인도',e:'🇮🇳'},{id:'🌙 중동',e:'🌙'},{id:'🇹🇷 터키',e:'🇹🇷'},{id:'🇬🇷 그리스',e:'🇬🇷'},{id:'🇪🇸 스페인',e:'🇪🇸'},{id:'🇫🇷 프랑스',e:'🇫🇷'},{id:'🇮🇹 이탈리아',e:'🇮🇹'},{id:'🇩🇪 독일',e:'🇩🇪'},{id:'🇵🇹 포르투갈',e:'🇵🇹'},{id:'🇲🇽 멕시코',e:'🇲🇽'},{id:'🇺🇸 미국',e:'🇺🇸'},{id:'🇧🇷 브라질',e:'🇧🇷'}];
    var grid='<div class="wm-flow-chip-wrap">'+styles.map(function(st){var on=sel.indexOf(st.id)>=0; return chip(st.e+' '+flowDisplayName(st.id)+(on?' ✓':''),on?'active':'','toggleStyle(\''+st.id+'\')');}).join('')+'</div>';
    return '<div class="wm-flow-page">'+flowHeader({kicker:'A FLOW · TASTE',title:'식사 스타일 선택',sub:'냉장고 재료를 어떤 분위기의 식단으로 만들지 선택하세요.',tone:'green',done:2,total:3,heroTitle:sel.length?sel.map(flowDisplayName).join(' + '):'스타일을 골라주세요',heroSub:'복수 선택 가능 · 선택한 스타일 안에서 메뉴를 구성해요.',icon:'🍽️',status:sel.length?'스타일 선택 완료':'스타일 선택 필요',back:'go(\'home\')',backText:'← 홈'})+'<div class="wm-flow-grid">'+stat('재료',safeArr(S.fridge).length+'개')+stat('스타일',sel.length+'개')+stat('식단',totalMeals()+'끼')+'</div>'+section('✅','선택된 스타일',sel.length?sel.map(flowDisplayName).join(' · '):'아직 선택되지 않았어요',pill(sel.length?'선택됨':'필요',sel.length?'done':'wait'),styleChips(sel))+section('🌍','스타일 추가','한식/일식/중식/국가별 선택',pill('선택 가능'),grid)+'</div><div class="wm-flow-cta"><button class="btn-p" '+(!sel.length?'disabled':'')+' onclick="genAMeal()">✨ AI 식단 생성</button></div>';
  };
  window.rBCEntry = rBCEntry = function(){
    if(typeof normalizeBCStylesV8==='function') normalizeBCStylesV8();
    var isB=S.bcMode==='b'; var max=totalMeals();
    var POPULAR=['삼겹살구이','된장찌개','김치찌개','비빔밥','제육볶음','불고기','카레라이스','짜장면','파스타','스테이크','라멘','볶음밥','닭볶음탕','갈비찜','오야코동'];
    var styles=[{id:'한식',e:'🍚'},{id:'일식',e:'🍱'},{id:'중식',e:'🥢'},{id:'🇹🇭 태국',e:'🇹🇭'},{id:'🇻🇳 베트남',e:'🇻🇳'},{id:'🇮🇩 인도네시아',e:'🇮🇩'},{id:'🇲🇾 말레이시아',e:'🇲🇾'},{id:'🇸🇬 싱가포르',e:'🇸🇬'},{id:'🇵🇭 필리핀',e:'🇵🇭'},{id:'🇮🇳 인도',e:'🇮🇳'},{id:'🇲🇽 멕시코',e:'🇲🇽'},{id:'🇹🇷 터키',e:'🇹🇷'}];
    var done=isB?(safeArr(S.bcStyles).length?1:0):(safeArr(S.bcMenus).length?1:0);
    var title=isB?'스타일로 메뉴 추천':'먹고 싶은 메뉴로 짜기';
    var tone=isB?'orange':'pink';
    var body=isB?('<div class="wm-flow-chip-wrap">'+styles.map(function(st){var on=safeArr(S.bcStyles).indexOf(st.id)>=0;return chip(st.e+' '+flowDisplayName(st.id)+(on?' ✓':''),on?'active':'','toggleBCStyle(\''+st.id+'\')');}).join('')+'</div>'):
      ('<div style="position:relative"><div style="display:flex;gap:8px;margin-bottom:10px"><input id="c-inp" class="inp" placeholder="예: 삼겹살, 된장찌개..." style="flex:1" onkeydown="if(event.key===\'Enter\'){addCMenu();}" oninput="showAutoComplete(this.value)" autocomplete="off"><button onclick="addCMenu()" class="wm-flow-mini-btn" style="border-radius:15px;padding:0 16px">추가</button></div><div id="ac-drop" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border-radius:18px;box-shadow:0 14px 38px rgba(15,23,42,.16);z-index:100;overflow:hidden;max-height:240px;overflow-y:auto"></div></div>'+
      (safeArr(S.bcMenus).length?'<div class="wm-flow-chip-wrap" style="margin-top:8px">'+safeArr(S.bcMenus).map(function(m,i){return chip(m+' ✕','pink','S.bcMenus.splice('+i+',1);render()');}).join('')+'</div>':'<div class="wm-flow-empty">메뉴를 입력하거나 인기 메뉴에서 선택해주세요</div>')+
      '<div class="wm-flow-chip-wrap" style="margin-top:10px">'+POPULAR.map(function(m){var on=safeArr(S.bcMenus).includes(m);return chip((on?'✓ ':'')+m,on?'pink':'','toggleCMenu(\''+m+'\')');}).join('')+'</div>');
    return '<div class="wm-flow-page">'+flowHeader({kicker:isB?'B FLOW · STYLE':'C FLOW · MENU',title:title,sub:isB?'스타일을 선택하면 추천 메뉴를 구성해요.':'먹고 싶은 메뉴를 입력하면 장보기까지 이어져요.',tone:tone,done:done,total:3,heroTitle:isB?(safeArr(S.bcStyles).length?safeArr(S.bcStyles).map(flowDisplayName).join(' + '):'스타일 선택'):(safeArr(S.bcMenus).length+'개 메뉴 선택'),heroSub:isB?'추천 → 장보기 → 식단 생성':'메뉴 입력 → 재료 분석 → 식단 생성',icon:isB?'🤔':'🍖',status:done?'입력 완료':'입력 필요',back:'go(\'home\')',backText:'← 홈'})+'<div class="wm-flow-grid">'+stat('인원',S.people+'인')+stat(isB?'스타일':'메뉴',isB?safeArr(S.bcStyles).length+'개':safeArr(S.bcMenus).length+'개')+stat('식단',max+'끼')+'</div>'+section('👥','인원수','식재료 수량 계산 기준',pill(S.people+'인','done'),'<div class="wm-flow-chip-wrap">'+[1,2,3,4].map(function(n){return chip(n+'인',S.people===n?'active':'','S.people='+n+';render()');}).join('')+'</div>')+section(isB?'🌍':'🍽️',isB?'음식 스타일 선택':'메뉴 입력',isB?'복수 선택 가능':'최대 '+max+'개 선택',pill(done?'입력됨':'필요',done?'done':'wait'),body)+'</div><div class="wm-flow-cta">'+(isB?'<button class="btn-o" '+(!safeArr(S.bcStyles).length?'disabled':'')+' onclick="genBSuggest()">🍽️ 메뉴 추천 받기</button>':'<button class="btn-p" '+(!safeArr(S.bcMenus).length?'disabled':'')+' onclick="genBCCart()">🛒 재료 분석하기</button>')+'</div>';
  };
  window.rBSuggest = rBSuggest = function(){
    var menus=safeArr(S.bcSuggested); var sel=menus.filter(function(m){return m.selected;}).length; var max=totalMeals();
    var list=menus.length?menus.map(function(m,i){var nut=calcNutrition(m.name,1);var seasonal=getSeasonalScore(m.name)>0;var on=!!m.selected;return '<div class="wm-flow-menu-card '+(on?'active':'')+'" onclick="(function(){var cur=S.bcSuggested['+i+'].selected;var cnt=S.bcSuggested.filter(function(m){return m.selected}).length;if(!cur&&cnt>='+max+')return;S.bcSuggested['+i+'].selected=!cur;render();})()"><div class="wm-flow-check '+(on?'active':'')+'">'+(on?'✓':'')+'</div><div class="wm-flow-row-icon">'+(m.type==='아침'?'🌅':m.type==='저녁'?'🌙':'☀️')+'</div><div class="wm-flow-row-main"><b>'+m.name+(seasonal?' <span style="font-size:9px;background:#10B981;color:#fff;border-radius:6px;padding:1px 5px;font-weight:900">제철</span>':'')+'</b><span>'+m.type+' · '+getCookTime(m.name)+'분'+(nut?' · '+(nut.calRange||nut.cal+'kcal'):'')+'</span>'+(m.ingredients&&m.ingredients.length?'<span>'+m.ingredients.slice(0,3).join(' · ')+'</span>':'')+'</div></div>';}).join(''):'<div class="wm-flow-empty">추천 메뉴가 없어요</div>';
    return '<div class="wm-flow-page">'+flowHeader({kicker:'B FLOW · RECOMMEND',title:'추천 메뉴 선택',sub:'마음에 드는 메뉴를 골라 장보기 목록을 만들어요.',tone:'orange',done:sel,total:max,heroTitle:sel+'개 선택됨',heroSub:'최대 '+max+'개까지 선택 가능해요.',icon:'🍽️',status:sel?'메뉴 선택 중':'메뉴 선택 필요',back:'go(\'bc-entry\')',backText:'← 이전'})+'<div class="wm-flow-grid">'+stat('추천',menus.length+'개')+stat('선택',sel+'개')+stat('최대',max+'개')+'</div>'+section('🍽️','추천 메뉴','선택한 메뉴 기준으로 장보기 목록을 만들어요',pill(sel?'선택됨':'필요',sel?'done':'wait'),'<div class="wm-flow-list">'+list+'</div>')+'</div><div class="wm-flow-cta"><div style="font-size:12px;color:#8B95A1;text-align:center;margin-bottom:8px;font-weight:750">'+(sel===0?'메뉴를 선택해주세요':(sel<max?(max-sel)+'개 더 선택 가능':'선택 완료'))+'</div><button class="btn-o" '+(!sel?'disabled':'')+' onclick="S.bcMenus=S.bcSuggested.filter(function(m){return m.selected}).map(function(m){return m.name});genBCCart()">🛒 재료 분석하기 ('+sel+'개)</button></div>';
  };
  window.WM_SPRINT6A_FLOW_WORKSPACE_UNIFICATION={applied:true,scope:'A/B/C flow screens',mode:'wizard-like step UI replaced with tab-consistent workspace UI'};
})();

(function(){
  function arr(v){return Array.isArray(v)?v:[];}
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function normStyle(v){try{return typeof normalizeStyleChoiceV9==='function'?normalizeStyleChoiceV9(v):(typeof normalizeStyleChoiceV8==='function'?normalizeStyleChoiceV8(v):String(v||''));}catch(e){return String(v||'');}}
  function displayStyle(v){
    var s=normStyle(v);
    if(typeof bcStyleDisplayName==='function'){try{return bcStyleDisplayName(s);}catch(e){}}
    return String(s||'').replace(/^\p{Regional_Indicator}\p{Regional_Indicator}\s*/u,'').replace(/^🌙\s*/,'').trim();
  }
  function selectedStyles(){ if(typeof normalizeBCStylesV8==='function') normalizeBCStylesV8(); return arr(S.bcStyles).map(normStyle).filter(Boolean); }
  function selectedStyleText(){var sel=selectedStyles();return sel.length?sel.map(displayStyle).join(' · '):'아직 선택되지 않았어요';}
  function head(kicker,title,sub){return '<div class="wm-flow-simple-head"><div><div class="wm-flow-simple-kicker">'+kicker+'</div><div class="wm-flow-simple-title">'+title+'</div><div class="wm-flow-simple-sub">'+sub+'</div></div><button class="wm-flow-simple-back" onclick="go(\'home\')">← 홈</button></div>';}
  function pill(txt,cls){return '<span class="wm-flow-simple-pill '+(cls||'')+'">'+txt+'</span>';}
  function card(icon,title,sub,p,body){return '<div class="wm-flow-simple-card"><div class="wm-flow-simple-card-head"><div class="wm-flow-simple-card-title"><div class="wm-flow-simple-icon">'+icon+'</div><div><b>'+title+'</b><span>'+sub+'</span></div></div>'+p+'</div><div class="wm-flow-simple-body">'+body+'</div></div>';}
  function chip(txt,cls,onclick){return '<button type="button" class="wm-flow-chip '+(cls||'')+'" '+(onclick?'onclick="'+onclick+'"':'')+'>'+txt+'</button>';}
  function styleChip(id){var n=normStyle(id);var on=selectedStyles().indexOf(n)>=0;return chip((on?'✓ ':'')+esc(displayStyle(n)),on?'active':'','toggleStyle(\''+esc(n).replace(/'/g,"\\'")+'\')');}
  function selectedStyleChips(){var sel=selectedStyles();return sel.length?'<div class="wm-flow-chip-wrap">'+sel.map(function(s,i){return chip(esc(displayStyle(s))+' ✕','active','removeStyle(\''+esc(s).replace(/'/g,"\\'")+'\')');}).join('')+'</div>':'<div class="wm-flow-empty">스타일을 선택하면 추천 메뉴 풀이 바뀝니다.</div>';}

  window.toggleBCStyle=function(id){ if(typeof toggleStyle==='function') return toggleStyle(id); id=normStyle(id); if(!S.bcStyles)S.bcStyles=[]; var i=S.bcStyles.indexOf(id); if(i>=0)S.bcStyles.splice(i,1); else S.bcStyles.push(id); render(); };

  var QUICK_STYLES=['한식','일식','중식','헬시','브런치','🇹🇭 태국','🇻🇳 베트남','🇮🇩 인도네시아','🇲🇾 말레이시아','🇸🇬 싱가포르','🇵🇭 필리핀','🇰🇭 캄보디아','🇲🇲 미얀마','🇹🇼 대만','🇮🇳 인도','🌙 중동','🇹🇷 터키','🇬🇷 그리스','🇪🇸 스페인','🇫🇷 프랑스','🇮🇹 이탈리아','🇩🇪 독일','🇵🇹 포르투갈','🇷🇺 러시아','🇵🇱 폴란드','🇸🇪 스웨덴','🇨🇿 체코','🇲🇽 멕시코','🇺🇸 미국','🇦🇷 아르헨티나','🇧🇷 브라질','🇵🇪 페루','🇨🇴 콜롬비아','🇯🇲 자메이카','🇲🇦 모로코','🇪🇹 에티오피아','🇳🇬 나이지리아','🇹🇳 튀니지'];
  function stylePickerBody(){
    return '<button class="wm-flow-style-open" onclick="openStyleDrop()"><span>🌍 국가/스타일 드롭다운으로 선택</span><span>›</span></button>'+
      selectedStyleChips()+
      '<div style="height:10px"></div><div style="font-size:11px;color:#98A2B3;font-weight:850;letter-spacing:1px;margin:4px 0 8px">빠른 선택</div><div class="wm-flow-chip-wrap">'+QUICK_STYLES.map(styleChip).join('')+'</div>';
  }

  window.rAStyle=function(){
    var sel=selectedStyles();
    return '<div class="wm-flow-simple-page">'+head('A FLOW · STYLE','식사 스타일 선택','냉장고 재료를 어떤 음식 스타일로 만들지 선택하세요.')+
      card('🌍','스타일 선택',selectedStyleText(),pill(sel.length?sel.length+'개 선택':'필요',sel.length?'done':'wait'),stylePickerBody())+
      '</div><div class="wm-flow-cta"><button class="btn-p" '+(!sel.length?'disabled':'')+' onclick="genAMeal()">✨ AI 식단 생성</button></div>';
  };

  window.rBCEntry=function(){
    if(typeof normalizeBCStylesV8==='function') normalizeBCStylesV8();
    var isB=S.bcMode==='b';
    var max=(typeof totalMeals==='function'?totalMeals():14);
    if(isB){
      var sel=selectedStyles();
      return '<div class="wm-flow-simple-page">'+head('B FLOW · STYLE','음식 스타일로 추천받기','국가/스타일을 먼저 고르면 메뉴 추천으로 이어져요.')+
        card('🌍','국가/스타일 선택',selectedStyleText(),pill(sel.length?sel.length+'개 선택':'필요',sel.length?'done':'wait'),stylePickerBody())+
        card('👥','인원수','식재료 수량 계산 기준',pill((S.people||1)+'인','done'),'<div class="wm-flow-chip-wrap">'+[1,2,3,4].map(function(n){return chip(n+'인',(S.people||1)===n?'active':'','S.people='+n+';render()');}).join('')+'</div>')+
        '</div><div class="wm-flow-cta"><button class="btn-o" '+(!sel.length?'disabled':'')+' onclick="genBSuggest()">🍽️ 메뉴 추천 받기</button></div>';
    }
    var menus=arr(S.bcMenus); var popular=['삼겹살구이','차돌된장찌개','김치찌개','비빔밥','제육볶음','불고기','카레라이스','짜장면','파스타','스테이크','라멘','볶음밥','닭볶음탕','갈비찜','오야코동'];
    var input='<div class="wm-flow-direct-input"><input id="c-inp" class="inp" placeholder="예: 차돌된장찌개" onkeydown="if(event.key===\'Enter\'){addCMenu();}" oninput="showAutoComplete(this.value)" autocomplete="off"><button onclick="addCMenu()" class="wm-flow-add-btn">추가</button><div id="ac-drop" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border-radius:18px;box-shadow:0 14px 38px rgba(15,23,42,.16);z-index:100;overflow:hidden;max-height:240px;overflow-y:auto"></div></div>'+
      (menus.length?'<div class="wm-flow-chip-wrap">'+menus.map(function(m,i){return chip(esc(m)+' ✕','pink','S.bcMenus.splice('+i+',1);render()');}).join('')+'</div>':'<div class="wm-flow-empty">메뉴를 바로 입력하세요. 단계 안내 화면 없이 바로 재료 분석으로 이어집니다.</div>')+
      '<div style="height:10px"></div><div style="font-size:11px;color:#98A2B3;font-weight:850;letter-spacing:1px;margin:4px 0 8px">인기 메뉴</div><div class="wm-flow-chip-wrap">'+popular.map(function(m){var on=menus.indexOf(m)>=0;return chip((on?'✓ ':'')+m,on?'pink':'','toggleCMenu(\''+m+'\')');}).join('')+'</div>';
    return '<div class="wm-flow-simple-page">'+head('C FLOW · MENU','먹고 싶은 메뉴가 있어요','메뉴를 입력하면 바로 재료 분석과 장보기 목록으로 이어져요.')+
      card('🍽️','메뉴 입력','최대 '+max+'개 선택',pill(menus.length?menus.length+'개 입력':'필요',menus.length?'done':'wait'),input)+
      card('👥','인원수','장보기 수량 계산 기준',pill((S.people||1)+'인','done'),'<div class="wm-flow-chip-wrap">'+[1,2,3,4].map(function(n){return chip(n+'인',(S.people||1)===n?'active':'','S.people='+n+';render()');}).join('')+'</div>')+
      '</div><div class="wm-flow-cta"><button class="btn-p" '+(!menus.length?'disabled':'')+' onclick="genBCCart()">🛒 재료 분석 & 장보기 생성</button></div>';
  };

  window.WM_SPRINT6B_FLOW_INPUT_RESTORE={applied:true,fixes:['B flow style selection restored','full country/style dropdown restored','C flow step-start screen removed']};
})();

(function(){
  function arr(v){return Array.isArray(v)?v:[];}
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function normStyle(v){try{return typeof normalizeStyleChoiceV9==='function'?normalizeStyleChoiceV9(v):(typeof normalizeStyleChoiceV8==='function'?normalizeStyleChoiceV8(v):String(v||''));}catch(e){return String(v||'');}}
  function displayStyle(v){
    var s=normStyle(v);
    if(typeof bcStyleDisplayName==='function'){try{return bcStyleDisplayName(s);}catch(e){}}
    return String(s||'').replace(/^\p{Regional_Indicator}\p{Regional_Indicator}\s*/u,'').replace(/^🌙\s*/,'').trim();
  }
  function selectedStyles(){
    if(typeof normalizeBCStylesV8==='function') normalizeBCStylesV8();
    return arr(S.bcStyles).map(normStyle).filter(Boolean);
  }
  function selectedStyleText(){var sel=selectedStyles();return sel.length?sel.map(displayStyle).join(' · '):'아직 선택되지 않았어요';}
  function head(kicker,title,sub){return '<div class="wm-flow-simple-head"><div><div class="wm-flow-simple-kicker">'+kicker+'</div><div class="wm-flow-simple-title">'+title+'</div><div class="wm-flow-simple-sub">'+sub+'</div></div><button class="wm-flow-simple-back" onclick="go(\'home\')">← 홈</button></div>';}
  function pill(txt,cls){return '<span class="wm-flow-simple-pill '+(cls||'')+'">'+txt+'</span>';}
  function card(icon,title,sub,p,body){return '<div class="wm-flow-simple-card"><div class="wm-flow-simple-card-head"><div class="wm-flow-simple-card-title"><div class="wm-flow-simple-icon">'+icon+'</div><div><b>'+title+'</b><span>'+sub+'</span></div></div>'+p+'</div><div class="wm-flow-simple-body">'+body+'</div></div>';}
  function chip(txt,cls,onclick){return '<button type="button" class="wm-flow-chip '+(cls||'')+'" '+(onclick?'onclick="'+onclick+'"':'')+'>'+txt+'</button>';}
  function selectedStyleChips(){
    var sel=selectedStyles();
    if(!sel.length) return '<div class="wm-flow-empty">드롭다운에서 국가/스타일을 선택해주세요.</div>';
    return '<div class="wm-flow-selected-wrap"><div class="wm-flow-selected-label">선택된 스타일</div>'+sel.map(function(s){return chip(esc(displayStyle(s))+' ✕','active','removeStyle(\''+esc(s).replace(/'/g,"\\'")+'\')');}).join('')+'</div>';
  }
  function stylePickerBody(){
    return '<button class="wm-flow-style-open only" onclick="openStyleDrop()"><span>🌍 국가/스타일 드롭다운으로 선택</span><span>›</span></button>'+selectedStyleChips();
  }
  function selectedMenuChips(){
    var menus=arr(S.bcMenus);
    if(!menus.length) return '<div class="wm-flow-no-popular-note">먹고 싶은 메뉴를 입력한 뒤 추가를 눌러주세요. 선택된 메뉴는 여기에 가로 칩으로 남습니다.</div>';
    return '<div class="wm-flow-selected-wrap"><div class="wm-flow-selected-label">선택된 메뉴</div>'+menus.map(function(m,i){return chip(esc(m)+' ✕','pink','S.bcMenus.splice('+i+',1);render()');}).join('')+'</div>';
  }

  window.addCMenu=function(){
    var i=document.getElementById('c-inp'); if(!i) return;
    var v=String(i.value||'').trim();
    if(v && !arr(S.bcMenus).includes(v) && arr(S.bcMenus).length < (typeof totalMeals==='function'?totalMeals():14)){
      if(!Array.isArray(S.bcMenus)) S.bcMenus=[];
      S.bcMenus.push(v);
    }
    i.value='';
    var ac=document.getElementById('ac-drop'); if(ac){ac.style.display='none';ac.innerHTML='';}
    render();
  };
  window.toggleCMenu=function(m){
    if(!Array.isArray(S.bcMenus)) S.bcMenus=[];
    var i=S.bcMenus.indexOf(m);
    if(i>=0) S.bcMenus.splice(i,1); else if(S.bcMenus.length < (typeof totalMeals==='function'?totalMeals():14)) S.bcMenus.push(m);
    var ac=document.getElementById('ac-drop'); if(ac){ac.style.display='none';ac.innerHTML='';}
    render();
  };
  window.showAutoComplete=function(){var ac=document.getElementById('ac-drop'); if(ac){ac.style.display='none';ac.innerHTML='';}};

  window.rBCEntry=function(){
    if(typeof normalizeBCStylesV8==='function') normalizeBCStylesV8();
    var isB=S.bcMode==='b';
    var max=(typeof totalMeals==='function'?totalMeals():14);
    if(isB){
      var sel=selectedStyles();
      return '<div class="wm-flow-simple-page">'+head('B FLOW · STYLE','음식 스타일로 추천받기','드롭다운에서 국가/스타일을 선택하면 메뉴 추천으로 이어져요.')+
        card('🌍','국가/스타일 선택',selectedStyleText(),pill(sel.length?sel.length+'개 선택':'필요',sel.length?'done':'wait'),stylePickerBody())+
        card('👥','인원수','식재료 수량 계산 기준',pill((S.people||1)+'인','done'),'<div class="wm-flow-chip-wrap">'+[1,2,3,4].map(function(n){return chip(n+'인',(S.people||1)===n?'active':'','S.people='+n+';render()');}).join('')+'</div>')+
        '</div><div class="wm-flow-cta"><button class="btn-o" '+(!sel.length?'disabled':'')+' onclick="genBSuggest()">🍽️ 메뉴 추천 받기</button></div>';
    }
    var menus=arr(S.bcMenus);
    var input='<div class="wm-flow-direct-input"><input id="c-inp" class="inp" placeholder="예: 차돌된장찌개" onkeydown="if(event.key===\'Enter\'){addCMenu();}" autocomplete="off"><button onclick="addCMenu()" class="wm-flow-add-btn">추가</button><div id="ac-drop" style="display:none"></div></div>'+selectedMenuChips();
    return '<div class="wm-flow-simple-page">'+head('C FLOW · MENU','먹고 싶은 메뉴가 있어요','메뉴를 입력하면 바로 재료 분석과 장보기 목록으로 이어져요.')+
      card('🍽️','메뉴 입력','최대 '+max+'개 선택',pill(menus.length?menus.length+'개 입력':'필요',menus.length?'done':'wait'),input)+
      card('👥','인원수','장보기 수량 계산 기준',pill((S.people||1)+'인','done'),'<div class="wm-flow-chip-wrap">'+[1,2,3,4].map(function(n){return chip(n+'인',(S.people||1)===n?'active':'','S.people='+n+';render()');}).join('')+'</div>')+
      '</div><div class="wm-flow-cta"><button class="btn-p" '+(!menus.length?'disabled':'')+' onclick="genBCCart()">🛒 재료 분석 & 장보기 생성</button></div>';
  };
  window.WM_SPRINT6C_BC_INPUT_CLEANUP={applied:true,base:'Sprint6B',changes:['B quick chips removed; dropdown only','B selected styles remain as chips','C popular menu chips removed','C selected menus remain as horizontal chips','B/C entry stays direct without deleting legacy route screens']};
})();

(function(){
  function arr(v){return Array.isArray(v)?v:[];}
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function normStyle(v){
    try{
      return typeof normalizeStyleChoiceV9==='function'
        ? normalizeStyleChoiceV9(v)
        : (typeof normalizeStyleChoiceV8==='function'?normalizeStyleChoiceV8(v):String(v||''));
    }catch(e){return String(v||'');}
  }
  function displayStyle(v){
    var s=normStyle(v);
    if(typeof bcStyleDisplayName==='function'){try{return bcStyleDisplayName(s);}catch(e){}}
    return String(s||'').replace(/^\p{Regional_Indicator}\p{Regional_Indicator}\s*/u,'').replace(/^🌙\s*/,'').trim();
  }
  function selectedStyles(){
    if(typeof normalizeBCStylesV8==='function') normalizeBCStylesV8();
    return arr(S.bcStyles).map(normStyle).filter(Boolean);
  }
  function selectedStyleText(){
    var sel=selectedStyles();
    return sel.length?sel.map(displayStyle).join(' · '):'아직 선택되지 않았어요';
  }
  function head(kicker,title,sub){
    return '<div class="wm-flow-simple-head"><div><div class="wm-flow-simple-kicker">'+kicker+'</div><div class="wm-flow-simple-title">'+title+'</div><div class="wm-flow-simple-sub">'+sub+'</div></div><button class="wm-flow-simple-back" onclick="setFlow(null);go(\'home\')">← 홈</button></div>';
  }
  function pill(txt,cls){return '<span class="wm-flow-simple-pill '+(cls||'')+'">'+txt+'</span>';}
  function card(icon,title,sub,p,body){
    return '<div class="wm-flow-simple-card"><div class="wm-flow-simple-card-head"><div class="wm-flow-simple-card-title"><div class="wm-flow-simple-icon">'+icon+'</div><div><b>'+title+'</b><span>'+sub+'</span></div></div>'+p+'</div><div class="wm-flow-simple-body">'+body+'</div></div>';
  }
  function chip(txt,cls,onclick){
    return '<button type="button" class="wm-flow-chip '+(cls||'')+'" '+(onclick?'onclick="'+onclick+'"':'')+'>'+txt+'</button>';
  }
  function selectedStyleChips(){
    var sel=selectedStyles();
    if(!sel.length) return '<div class="wm-flow-empty">드롭다운에서 국가/스타일을 선택해주세요.</div>';
    return '<div class="wm-flow-selected-wrap"><div class="wm-flow-selected-label">선택된 스타일</div>'+sel.map(function(s){
      return chip(esc(displayStyle(s))+' ✕','active','removeStyle(\''+esc(s).replace(/'/g,"\\'")+'\')');
    }).join('')+'</div>';
  }
  function stylePickerBody(){
    return '<button class="wm-flow-style-open only" onclick="openStyleDrop()"><span>🌍 국가/스타일 드롭다운으로 선택</span><span>›</span></button>'+selectedStyleChips();
  }
  function peopleCard(label){
    return card('👥','인원수',label||'식재료 수량 계산 기준',pill((S.people||1)+'인','done'),'<div class="wm-flow-chip-wrap">'+[1,2,3,4].map(function(n){
      return chip(n+'인',(S.people||1)===n?'active':'','S.people='+n+';render()');
    }).join('')+'</div>');
  }
  function selectedMenuChips(){
    var menus=arr(S.bcMenus);
    if(!menus.length) return '<div class="wm-flow-no-popular-note">먹고 싶은 메뉴를 입력한 뒤 추가를 눌러주세요. 선택된 메뉴는 여기에 가로 칩으로 남습니다.</div>';
    return '<div class="wm-flow-selected-wrap"><div class="wm-flow-selected-label">선택된 메뉴</div>'+menus.map(function(m,i){
      return chip(esc(m)+' ✕','pink','S.bcMenus.splice('+i+',1);render()');
    }).join('')+'</div>';
  }
  window.addCMenu=function(){
    var i=document.getElementById('c-inp'); if(!i) return;
    var v=String(i.value||'').trim();
    if(v && !arr(S.bcMenus).includes(v) && arr(S.bcMenus).length < (typeof totalMeals==='function'?totalMeals():14)){
      if(!Array.isArray(S.bcMenus)) S.bcMenus=[];
      S.bcMenus.push(v);
    }
    i.value='';
    var ac=document.getElementById('ac-drop'); if(ac){ac.style.display='none';ac.innerHTML='';}
    render();
  };
  window.showAutoComplete=function(){
    var ac=document.getElementById('ac-drop'); if(ac){ac.style.display='none';ac.innerHTML='';}
  };

  window.rBCEntry=function(){
    if(typeof normalizeBCStylesV8==='function') normalizeBCStylesV8();
    var isB=S.bcMode==='b';
    var max=(typeof totalMeals==='function'?totalMeals():14);
    if(isB){
      var sel=selectedStyles();
      return '<div class="wm-flow-simple-page">'+
        head('B FLOW · STYLE','음식 스타일로 추천받기','드롭다운에서 국가/스타일을 선택하면 메뉴 추천으로 이어져요.')+
        card('🌍','국가/스타일 선택',selectedStyleText(),pill(sel.length?sel.length+'개 선택':'필요',sel.length?'done':'wait'),stylePickerBody())+
        peopleCard('식재료 수량 계산 기준')+
        '</div><div class="wm-flow-cta"><button class="btn-o" '+(!sel.length?'disabled':'')+' onclick="genBSuggest()">🍽️ 메뉴 추천 받기</button></div>';
    }
    var menus=arr(S.bcMenus);
    var input='<div class="wm-flow-direct-input"><input id="c-inp" class="inp" placeholder="예: 차돌된장찌개" onkeydown="if(event.key===\'Enter\'){addCMenu();}" autocomplete="off"><button onclick="addCMenu()" class="wm-flow-add-btn">추가</button><div id="ac-drop" style="display:none"></div></div>'+selectedMenuChips();
    return '<div class="wm-flow-simple-page">'+
      head('C FLOW · MENU','먹고 싶은 메뉴가 있어요','메뉴를 입력하면 바로 재료 분석과 장보기 목록으로 이어져요.')+
      card('🍽️','메뉴 입력','최대 '+max+'개 선택',pill(menus.length?menus.length+'개 입력':'필요',menus.length?'done':'wait'),input)+
      peopleCard('장보기 수량 계산 기준')+
      '</div><div class="wm-flow-cta"><button class="btn-p" '+(!menus.length?'disabled':'')+' onclick="genBCCart()">🛒 재료 분석 & 장보기 생성</button></div>';
  };

  window.rHomeB=function(){
    S.bcMode='b';
    return rBCEntry();
  };
  window.rHomeC=function(){
    S.bcMode='c';
    return rBCEntry();
  };
  window.rHomeA=function(){
    var fr=arr(S.fridge);
    var sel=selectedStyles();
    var frBody='<button class="wm-flow-card-action" onclick="go(\'a-fridge\')"><span>🥕 냉장고 재료 확인/수정</span><span>›</span></button>';
    if(fr.length){
      frBody+='<div class="wm-flow-selected-wrap"><div class="wm-flow-selected-label">입력된 재료</div>'+fr.slice(0,12).map(function(it){
        var name=esc(it.name||it.ingredient||it.title||'재료');
        return '<span class="wm-flow-mini-chip green">'+(typeof getIcon==='function'?getIcon(name):'🥬')+' '+name+'</span>';
      }).join('')+(fr.length>12?'<span class="wm-flow-mini-chip">+'+(fr.length-12)+'개</span>':'')+'</div>';
    }else{
      frBody+='<div class="wm-flow-empty">냉장고 재료를 먼저 입력해주세요.</div>';
    }
    return '<div class="wm-flow-simple-page">'+
      head('A FLOW · FRIDGE','냉장고 재료로 식단 만들기','입력된 재료와 음식 스타일을 바탕으로 식단을 만들어요.')+
      card('🥕','냉장고 재료',fr.length?fr.length+'가지 재료 입력됨':'재료 입력 필요',pill(fr.length?fr.length+'개':'필요',fr.length?'done':'wait'),frBody)+
      card('🌍','국가/스타일 선택',selectedStyleText(),pill(sel.length?sel.length+'개 선택':'필요',sel.length?'done':'wait'),stylePickerBody())+
      peopleCard('식재료 수량 계산 기준')+
      '</div><div class="wm-flow-cta"><button class="btn-p" '+(!fr.length||!sel.length?'disabled':'')+' onclick="genAMeal()">✨ AI 식단 생성</button></div>';
  };

  window.WM_SPRINT6D_ABC_FLOW_ENTRY_UNIFICATION={applied:true,scope:'A/B/C activeFlow entry screens',changes:['A/B/C home flow entry now uses the same direct input workspace','legacy 1-2-3-4 step cards bypassed','B/C retain dropdown/menu input behavior','home back clears activeFlow']};
})();

(function(){
  function a(v){return Array.isArray(v)?v:[];}
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function scheduleCount(){try{return Object.values(S.schedule||{}).reduce(function(n,x){return n+(Array.isArray(x)?x.length:0)},0)}catch(e){return 0}}
  function plannedCount(){return Math.max(0,scheduleCount()*(S.planDuration||1));}
  function openCart(){go(a(S.cart).length?'bc-cart':'tab-cart')}
  window.wm7DebugState=function(){
    var issues=[];
    try{
      if(!S || typeof S!=='object') return ['S missing'];
      ['fridge','cart','bcStyles','bcMenus','bcSuggested'].forEach(function(k){if(!Array.isArray(S[k])){S[k]=[];issues.push(k+' repaired to []');}});
      if(!S.schedule || typeof S.schedule!=='object'){S.schedule={};issues.push('schedule repaired');}
      if(typeof ensureScheduleReady==='function') ensureScheduleReady();
      S.cart=S.cart.filter(function(i){return i && (i.name||i.replaceName||i.ingredient||i.title);}).map(function(i){
        if(!i.name && (i.replaceName||i.ingredient||i.title)) i.name=i.replaceName||i.ingredient||i.title;
        if(i.checked==null) i.checked=false;
        if(!i.category) i.category='기타';
        return i;
      });
      S.fridge=S.fridge.filter(function(i){return i && (i.name||i.ingredient||i.title);}).map(function(i){if(!i.name)i.name=i.ingredient||i.title; return i;});
      if(S.activeFlow && !['a','b','c'].includes(S.activeFlow)){S.activeFlow=null;localStorage.removeItem('wm_flow');issues.push('activeFlow cleared');}
    }catch(e){issues.push('debug error: '+(e.message||e));}
    if(issues.length) return issues;
  };
  var oldRender=window.render;
  if(typeof oldRender==='function' && !oldRender.__wm7){
    var wrapped=function(){try{wm7DebugState();}catch(e){} return oldRender.apply(this,arguments);};
    wrapped.__wm7=true; window.render=wrapped;
  }
  window.startMealFlow=function(flow){
    wm7DebugState();
    setFlow(flow);
    if(flow==='a'){S.bcMode='a'; if(!Array.isArray(S.bcStyles))S.bcStyles=[]; go('home'); return;}
    if(flow==='b'){S.bcMode='b'; if(!Array.isArray(S.bcStyles))S.bcStyles=[]; if(!Array.isArray(S.bcSuggested))S.bcSuggested=[]; go('bc-entry'); return;}
    if(flow==='c'){S.bcMode='c'; if(!Array.isArray(S.bcMenus))S.bcMenus=[]; go('bc-entry'); return;}
  };
  var oldStartBC=window.startBC;
  window.startBC=function(mode){ startMealFlow(mode==='c'?'c':'b'); };
  window.wm7FlowCards=function(){
    var a_dim=S.activeFlow&&S.activeFlow!=='a'?' wm7-choice-dim':'';
    var b_dim=S.activeFlow&&S.activeFlow!=='b'?' wm7-choice-dim':'';
    var c_dim=S.activeFlow&&S.activeFlow!=='c'?' wm7-choice-dim':'';
    return '<div class="wm7-accordion wm7-flow-choice" style="margin:4px 0 4px">'+
      '<button class="wm7-choice'+a_dim+'" onclick="startMealFlow(\'a\')"><i>🥕</i><b>냉장고<br>활용</b><span>저장된 재료로 먼저 계산</span></button>'+
      '<button class="wm7-choice'+b_dim+'" onclick="startMealFlow(\'b\')"><i>✨</i><b>추천<br>받기</b><span>스타일 기반 메뉴 추천</span></button>'+
      '<button class="wm7-choice'+c_dim+'" onclick="startMealFlow(\'c\')"><i>🍽️</i><b>직접<br>선택</b><span>먹고 싶은 메뉴 입력</span></button>'+
    '</div>';
  };
  window.wm7Step=function(num,title,sub,state,action,tag){
    return '<button class="wm7-step '+(state||'')+'" onclick="'+(action||'')+'"><div class="wm7-num">'+(state==='done'?'✓':num)+'</div><div class="wm7-main"><b>'+title+'</b><span>'+sub+'</span></div><div class="wm7-tag '+(state==='done'?'done':state==='live'?'live':state==='warn'?'warn':'')+'">'+tag+'</div></button>';
  };
  window.wm7CurrentStage=function(){
    if(!localStorage.getItem('wm_schedule_set') || scheduleCount()===0) return 1;
    if(!S.activeFlow && !S.mealPlan && !a(S.cart).length) return 2;
    if(a(S.cart).length && !S.cartDone && !S.mealPlan) return 3;
    if(a(S.cart).length && S.cartDone && !S.mealPlan) return 4;
    if(S.mealPlan) return 6;
    return 2;
  };
  window.wm7FlowLine=function(){
    var st=wm7CurrentStage();
    var cartLeft=a(S.cart).filter(function(i){return !i.checked}).length;
    var fridgeCount=a(S.fridge).length;
    return '<div class="wm7-flowline">'+
      wm7Step(1,'식사 스케줄 설정',plannedCount()+'끼 예정 · '+(S.people||1)+'인분 기준',st>1?'done':st===1?'live':'off',"go('schedule')",st>1?'완료':'설정')+
      wm7Step(2,'식단 플로우 설정','A 냉장고 · B 추천 · C 직접 선택',st>2?'done':st===2?'live':'off',"S._showFlow=!S._showFlow;render()",S.activeFlow?String(S.activeFlow).toUpperCase():'선택')+
      (S._showFlow?wm7FlowCards():'')+
      wm7Step(3,'장바구니','이번 식단에 필요한 임시 재료 목록',st>3?'done':st===3?'live':'off','openCart()',a(S.cart).length?cartLeft+'개':'준비')+
      wm7Step(4,'냉장고','구매/보유 재료가 저장되는 영구 공간',st>4?'done':st===4?'live':'off',"go('tab-fridge')",fridgeCount+'개')+
      wm7Step(5,'식단 생성','스케줄 + 플로우 + 장바구니 + 냉장고 반영',S.mealPlan?'done':st===5?'live':'off',S.mealPlan?"go('tab-meal')":"openCart()",S.mealPlan?'완료':'생성')+
      wm7Step(6,'식단 → 일기','생성된 식단을 실제 섭취 기록으로 남김',S.mealPlan?'live':'off',"go('tab-diary')",S.mealPlan?'기록':'로그')+
    '</div>';
  };
  window.rHome=function(){
    wm7DebugState();
    if(S.activeFlow==='a') return rHomeA();
    if(S.activeFlow==='b') return rHomeB();
    if(S.activeFlow==='c') return rHomeC();
    var hasMeal=!!S.mealPlan;
    var cart=a(S.cart), fridge=a(S.fridge);
    var cartLeft=cart.filter(function(i){return !i.checked}).length;
    return '<div class="wm7-page">'+
      '<div><div class="wm7-kicker">WEEKLY MEAL</div><div class="wm7-title">스마트하게 건강하게</div><div class="wm7-sub"></div></div>'+
      '<div class="wm7-hero"><b>'+ (hasMeal?'이번 주 식단 준비 완료':'다음 식단 준비 상태') +'</b><strong>'+(hasMeal?'완료':plannedCount()+'끼')+'</strong><span>냉장고 '+fridge.length+'개 · 장바구니 '+cart.length+'개 · '+(S.people||1)+'인분</span></div>'+
      wm7FlowLine()+
      (hasMeal?'<div class="wm7-duo"><button class="wm7-primary" onclick="go(\'tab-meal\')">📅 이번 주 식단 보기</button><button class="wm7-secondary" onclick="go(\'tab-diary\')">📔 식단 일기</button></div><div style="height:10px"></div><button class="wm7-secondary" onclick="confirmNewPlan()">🔄 새 식단 다시 짜기</button>':'')+
      (cart.length?'<div class="wm7-section-title">3. 장바구니 RAM</div><div class="wm7-card"><div class="wm7-row"><div><b>현재 장바구니</b><br><span>'+cartLeft+'개 남음 · 냉장고 반영 전 임시 목록</span></div><button class="wm7-secondary" style="width:auto;padding:0 16px" onclick="openCart()">열기</button></div></div>':'')+
    '</div>';
  };
  window.rHomeDone=function(){return rHome();};

  var oldGenA=window.genAMeal;
  window.genAMeal=function(){
    try{
      wm7DebugState();
      if(!a(S.bcStyles).length){alert('스타일을 먼저 선택해주세요');return;}
      if(!a(S.fridge).length){ if(typeof showInsufficientModal==='function') showInsufficientModal(0); else alert('냉장고 재료를 먼저 추가해주세요'); return; }
      var menus=[];
      if(typeof flowBuildMenu==='function'){
        menus=flowBuildMenu('fridge',S.bcStyles,[]);
        var best=menus.filter(function(n){try{return flowScoreMenuByFridge(n)>0}catch(e){return false}});
        menus=(best.length?best:menus).filter(function(n){return MENU_DB&&MENU_DB[n]}).slice(0,typeof totalMeals==='function'?totalMeals():14);
      }
      if(!menus.length){alert('냉장고/스타일로 만들 메뉴를 찾지 못했어요. 스타일을 바꾸거나 재료를 추가해주세요.');return;}
      S.bcMenus=menus;
      S.bcMode='a';
      if(typeof flowBuildCart==='function') flowBuildCart(menus);
      if(!a(S.cart).length && typeof getIngredientsFromDB==='function'){
        var result=getIngredientsFromDB(menus,S.people||1);
        S.cart=(result.list||[]).map(function(i){return Object.assign({},i,{checked:!!i.inFridge,replaceName:'',replaceQty:''});});
      }
      S.cartDone=false;S.fridgeAdded=false;localStorage.removeItem('wm_cart_done');
      go('bc-cart');
    }catch(e){console.error('genAMeal Sprint7A 오류:',e);alert('장바구니 생성 중 오류: '+(e.message||e));}
  };
  var oldMake=window.makeBCMealNow;
  window.makeBCMealNow=function(){
    try{
      wm7DebugState();
      var menus=a(S.bcMenus).length?S.bcMenus:(typeof _bcSelectedMenus==='function'?_bcSelectedMenus():[]);
      menus=[...new Set(menus)].filter(function(n){return MENU_DB&&MENU_DB[n]});
      if(!menus.length){alert('식단을 만들 메뉴가 없습니다. 먼저 플로우에서 메뉴를 선택해주세요.');return;}
      S.bcMenus=menus;
      if(typeof flowCreatePlan==='function' && flowCreatePlan(menus,'🧭 스케줄·장바구니·냉장고 흐름에 맞춰 식단을 생성했어요.')){
        if(typeof addUsage==='function') addUsage();
        go('bc-meal');
      }
    }catch(e){console.error('makeBCMealNow Sprint7A 오류:',e);alert('식단 생성 중 오류: '+(e.message||e));}
  };
  window.WM_SPRINT7A_FLOW_LOGIC_REORDER={applied:true,base:'Sprint6D ABC flow entry',changes:['Home dashboard reordered by schedule→flow→cart→fridge→meal→diary','Cart treated as RAM and fridge as persistent storage','A flow now creates cart first, then meal is generated from cart','Debug guard repairs broken arrays/schedule/cart items before render','Meal generation validates menu DB before creating plan']};
})();
