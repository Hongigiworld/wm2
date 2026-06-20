
(function(){
  /* ===== WM NUTRITION FINAL LOCK: menu verified DB only =====
     칼로리/탄단지 계산은 WM_MENU_NUTRITION_DB만 사용한다.
     MENU_DB/MENU_SCHEMA_V2/NUTRITION_DB 재료 합산 fallback은 사용하지 않는다.
     MENU_DB의 재료 구조는 장바구니/냉장고/재료표시 전용이다.
  */
  function _wmRound(x){ return Math.round(Number(x) || 0); }
  function _wmNormName(v){ return String(v || '').trim().replace(/\s+/g, ''); }
  function _wmResolveMenuNutritionKey(name){
    var raw = String(name || '').trim();
    var db = window.WM_MENU_NUTRITION_DB || {};
    if(!raw || !db) return null;
    if(db[raw]) return raw;
    try{
      if(window.NAME_MAP && window.NAME_MAP[raw] && db[window.NAME_MAP[raw]]) return window.NAME_MAP[raw];
    }catch(e){}
    try{
      if(typeof window.flowMenuDBName === 'function'){
        var mapped = window.flowMenuDBName(raw);
        if(mapped && db[mapped]) return mapped;
      }
    }catch(e){}
    var compact = _wmNormName(raw);
    if(db[compact]) return compact;
    var keys = Object.keys(db);
    for(var i=0;i<keys.length;i++){
      if(_wmNormName(keys[i]) === compact) return keys[i];
    }
    return null;
  }
  function _wmMenuNutritionOnly(menuName, people){
    var db = window.WM_MENU_NUTRITION_DB || {};
    var key = _wmResolveMenuNutritionKey(menuName);
    if(!key || !db[key]){
      return {
        cal:0, kcal:0, carb:0, pro:0, fat:0,
        calLo:0, calHi:0, calRange:'0kcal',
        portionG:null, enName:'', verified:false,
        source:'메뉴별 검증 영양DB 미등록',
        menuName:String(menuName || '')
      };
    }
    var n = db[key];
    var p = Math.max(1, Number(people) || 1);
    var cal = _wmRound((n.kcal || n.cal || 0) * p);
    return {
      cal:cal,
      kcal:cal,
      calLo:_wmRound(cal * 0.95),
      calHi:_wmRound(cal * 1.05),
      calRange:_wmRound(cal * 0.95) + '~' + _wmRound(cal * 1.05) + 'kcal',
      carb:_wmRound((n.carb || 0) * p),
      pro:_wmRound((n.pro || 0) * p),
      fat:_wmRound((n.fat || 0) * p),
      portionG:n.portionG || null,
      enName:n.enName || '',
      verified:true,
      source:'메뉴별 검증 영양DB',
      menuName:key
    };
  }
  window.WM_NUTRITION_DB_MODE = 'menu_verified_db_only';
  window.WM_INGREDIENT_NUTRITION_DISABLED = true;
  window.WM_MENU_NUTRITION_ONLY = true;
  window.getMenuNut = window.getMenuNut = function(name){ return _wmMenuNutritionOnly(name, 1); };
  window.calcNutrition = window.calcNutrition = function(menuName, people){ return _wmMenuNutritionOnly(menuName, people || 1); };
  window.kcalText = window.kcalText = function(name){
    var nut = _wmMenuNutritionOnly(name, 1);
    return nut && nut.cal ? (nut.calRange || (nut.cal + 'kcal')) : '';
  };
  console.info('[WM nutrition final lock] menu verified DB only; ingredient-sum nutrition disabled.');
})();
