# Weekly Meal - GitHub split version

단일 `index.html`을 GitHub/AI 수정이 쉬운 구조로 분리했습니다.

## 구조

- `index.html` : HTML 뼈대, CSS/JS 연결
- `css/styles.css` : 기존 `<style>` 전체
- `js/01-pre-ui-patches.js` : 초기 UI 패치
- `js/02-app-part1.js`
- `js/03-app-part2.js`
- `js/04-app-part3.js` : 기존 메인 앱 로직/DB를 900KB 이하 단위로 분리
- `js/05~09-patch-*.js` : 기존 후반 패치 스크립트

## 수정 기준

- 디자인/CSS 수정: `css/styles.css`
- 메뉴/재료/영양/앱 로직 수정: `js/02-app-part1.js` ~ `js/04-app-part3.js`
- 최근 추가 패치/자동완성/삭제목록 등: `js/05~09-patch-*.js`

주의: `index.html` 안의 `<script src="...">` 순서는 바꾸면 안 됩니다.
