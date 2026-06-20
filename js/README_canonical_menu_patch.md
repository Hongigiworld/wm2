# WM Canonical Menu Patch v7

변경 요약:
- 메뉴 원본을 `MENU_SCHEMA_V2`로 고정했습니다.
- `MENU_DB`, `FLOW_STYLE_MENU_MAP`, `CLEAN_MENUS`, `MENUS`, `ALL_MENUS`는 런타임에서 `MENU_SCHEMA_V2` 기준으로 정리됩니다.
- `WM_MENU_NUTRITION_DB`에 남아 있는 삭제 메뉴는 자동완성/식단생성/칼로리 계산에서 차단됩니다.
- 자동완성 인덱스는 `WM_MENU_NUTRITION_DB`가 아니라 `MENU_SCHEMA_V2 → MENU_DB` 기준으로만 생성됩니다.

사용법:
1. 메뉴 삭제/추가/재료수정: `03-app-part2.js`의 `MENU_SCHEMA_V2` 수정
2. 칼로리 수정: `04-app-part3.js`의 `WM_MENU_NUTRITION_DB` 수정
3. 임시 삭제 차단: `09-patch-6.js` 상단 `window.WM_DELETED_MENUS` 배열에 메뉴명 추가

업로드:
- ZIP 안의 01~09 JS를 GitHub `js/` 폴더에 그대로 덮어쓰기.
