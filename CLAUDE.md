# dsc-pages — 학과 학생 대상 페이지 저장소

데이터과학과 학생에게 공지하는 이벤트·공지·성과 홍보 페이지를 만들고 내리는 저장소.
`public/` 폴더가 Cloudflare Worker `dsinu`(dsinu.com)의 정적 자산으로 배포된다.
main 브랜치에 푸시하면 Workers Builds가 `npx wrangler deploy`를 실행해 1~2분 안에 공개된다. zip 수동 업로드 금지.
배포 설정은 `wrangler.jsonc`. `routes`를 넣지 말 것(대시보드의 dsinu.com 커스텀 도메인이 덮어써짐).

## 구조
- `public/index.html` — 첫 화면(Dieline식 매거진: 마스트헤드 · 분류 내비 · 리드 · 그리드 · 서비스 디렉터리). `pages.json`·`apps.json`을 읽어 자동으로 그린다. 직접 수정할 일 거의 없음
- `public/pages.json` — 페이지 목록(단일 기준). 페이지를 만들거나 내리면 반드시 같이 수정
  - 선택 필드: `tags`(문자열 배열, 카드 위 분류 옆에 표시), `cover`(`"/<slug>/cover.jpg"` 등 사진 경로. 없으면 slug 기준 데이터 차트 표지가 자동 생성)
- `public/apps.json` — 학과 서비스 디렉터리. `status`: `live`(운영 중) | `soon`(준비 중, 클릭 불가) | `hidden`
- `public/<slug>/index.html` — 페이지 하나 = 폴더 하나 = HTML 파일 하나
- `templates/basic.html` — 새 페이지 뼈대(메타태그, 파비콘, 목록 링크)
- `apps-script/` — 구글폼 응답 수를 JSON으로 주는 Apps Script 코드(배포는 구글 쪽에서 수동)

## 페이지 만들기 ("~ 페이지 만들어줘")
1. slug 결정: 영문 소문자·숫자·하이픈, 연도 포함 (예: `contest-2026`, `award-2026-capstone`). 기존 slug와 겹치면 안 됨
2. `templates/basic.html`을 `public/<slug>/index.html`로 복사하고 {{TITLE}} {{SUMMARY}} {{EMOJI}} 채운 뒤 내용 작성
3. `public/pages.json`에 항목 추가
   - type: `event`(행사·공모전) | `notice`(공지) | `showcase`(학생 성과 홍보)
   - created: 오늘 날짜, expires: 행사면 행사 다음 날, 없으면 생략
4. 로컬 확인 후 커밋·푸시, 공개 주소 알려주기: `https://<도메인>/<slug>/`

## 페이지 내리기 ("~ 내려줘")
- 기본: `pages.json`에서 `"hidden": true` 추가 → 목록에서만 사라지고 링크는 살아 있음
- "완전히 삭제"라고 할 때만 폴더 삭제 + pages.json 항목 삭제
- expires가 지난 페이지는 목록에서 자동으로 빠지므로 따로 할 일 없음

## 디자인 원칙
- 한 파일 완결: CSS·JS 인라인. 외부는 Google Fonts, cdnjs, jsdelivr만
- PC(행사장 화면)와 모바일(학생 폰) 둘 다 확인. 가로 스크롤 금지
- 문구는 사실만. 설득·감성 멘트("지금 신청하면 ~!", "놓치지 마세요") 넣지 않음
- 페이지마다 디자인은 새로 잡되, 템플릿 느낌(파스텔 카드 나열, 그라데이션 장식) 피하기
- 학교 공식 로고·교표 사용 금지. 학과명 텍스트는 사용 가능

## 실시간 숫자가 필요한 페이지 (신청 수, 투표 수 등)
- 입력은 구글폼, 숫자는 `apps-script/Code.gs`를 응답 시트에 붙여 웹앱 배포 → `<웹앱URL>?format=json`을 fetch
- 응답 내용(이름·학번)은 절대 페이지로 보내지 않는다. 숫자만
- 설정값(상금·마감일)은 응답 시트의 '설정' 탭에서 바꾼다(재배포 불필요)
- 예시: `public/contest-2026/index.html`

## 학생 개인정보
- 성과 홍보 페이지에 학생 실명·사진은 본인 동의를 받았다고 사용자가 확인한 경우에만 넣는다. 확인 안 됐으면 먼저 물어볼 것
- 학번·연락처는 어떤 페이지에도 넣지 않는다

## 커밋 규칙
- 메시지: `add: <slug>`, `update: <slug>`, `hide: <slug>`, `remove: <slug>`
