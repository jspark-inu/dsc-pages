# dsc-pages — DS INU 허브 (https://dsinu.com)

인천대학교 데이터과학과의 AI-native 서비스들을 한곳에서 보는 허브. 운영: HAI Lab(https://www.haiinu.com).
`public/` 폴더가 Cloudflare Worker `dsinu`(wrangler.jsonc)로 배포되어 dsinu.com으로 서비스된다.
Cloudflare Workers Builds가 이 저장소의 main 브랜치에 연결되어 있어, **main에 푸시하면 1~2분 안에 자동 배포된다.** 별도 배포 명령은 실행하지 않는다.
수동 배포가 꼭 필요할 때만 `npx wrangler deploy`.
이 저장소는 허브와 가벼운 페이지(행사·공지·프로젝트 홍보)만 담는다. 인력사무소 같은 독립 서비스는 각자 저장소에서 만들고 서브도메인(jobs.dsinu.com 등)으로 붙인다.

## 서비스 목록 (`public/apps.json`)
- 허브 첫 화면의 "서비스" 타일은 apps.json에서 그린다
- 필드: id, name, summary, url, status(`live` | `soon` | `hidden`)
- 새 서비스를 붙이거나 내릴 때는 이 파일만 수정한다

## 서비스 통합 계약 (새 서비스를 만들 때 지킬 것)
- 주소: `<id>.dsinu.com` 서브도메인
- 로그인: 학과 공통 계정만 사용 (서비스별 자체 회원가입 금지). 공통 계정 서버가 정해지기 전에는 로그인 기능을 만들지 말고 사용자에게 확인
- 마일리지: 학과 공통 장부에만 기록 (서비스 내부에 별도 포인트 체계 금지)
- 등록: apps.json에 추가
- 하단에 허브(https://dsinu.com) 링크 유지

## 구조
- `public/index.html` — 허브 첫 화면. `apps.json`(서비스)과 `pages.json`(진행 중 페이지)을 읽어 자동으로 그린다. 직접 수정할 일 거의 없음
- `public/pages.json` — 페이지 목록(단일 기준). 페이지를 만들거나 내리면 반드시 같이 수정
- `public/<slug>/index.html` — 페이지 하나 = 폴더 하나 = HTML 파일 하나
- `templates/basic.html` — 새 페이지 뼈대(메타태그, 파비콘, 목록 링크)
- `apps-script/` — 구글폼 응답 수를 JSON으로 주는 Apps Script 코드(배포는 구글 쪽에서 수동)
- `src/worker.js` — `/api/*`만 처리. `POST /api/hit`(허브에서 서비스를 연 횟수, 같은 사람·서비스는 하루 1회), `GET /api/popular?days=7|30|365|all`. 저장소는 SQLite Durable Object `Hits`(배포 시 자동 생성). IP 원문은 저장하지 않음

## 서비스 데이터 구조 (apps.json) — 50개 이상 대비

| 필드 | 필수 | 설명 |
|---|---|---|
| id | ✓ | 영문 소문자·하이픈. 서브도메인·경로에 그대로 사용 |
| name | ✓ | 서비스 이름 |
| summary | ✓ | 무엇을 하는지 한 문장 (기능 사실만) |
| category | ✓ | 학습 / 학과생활 / 정보 / 도구 / 연구 중 하나 |
| url | ✓ | 실제 주소 |
| host | ✓ | subdomain / path / external |
| status | ✓ | live / soon / hidden |
| created | ✓ | 등록일 YYYY-MM-DD (정렬 기준) |
| makers |  | 표시 이름 배열. 본인 동의 확인된 경우만 |
| cover |  | 스크린샷 경로 (/covers/<id>.webp, 1600×900 권장). 없으면 자동 차트 표지 |
| tags |  | 자유 태그 |
| facts |  | 포스터에 표로 넣을 사실 `[["항목","값"], ...]` (예: 인력사무소 마일리지 등급) |
| factsTitle |  | facts 표 제목 (예: 마일리지) |
| poster |  | 포스터 모양 고정: ev ft hd gi vt sp st br sc gr cv 중 하나. 없으면 id로 자동 |
| color |  | 포스터 색 고정: blue yellow green orange beige black pink white ink 중 하나. 없으면 id로 자동 |

화면 반영(시안 07-1 "덧붙이는 벽", 2026-10 적용, GSAP 3.15): 검은 헤더(분류·검색·pages.json의 feature 버튼) → 어두운 벽(#262626)에 서비스·소식이 등록일 순으로 찢긴 포스터로 붙음 → 전체 서비스 목록 → 소식 목록 → 많이 찾는 서비스(3개 이상 기록될 때, 이번 주/이번 달/올해/전체).
- 벽 자리는 22개(1440 폭 기준 좌표, index.html의 FRAMES). 최신이 맨 위, 23번째부터는 같은 자리 아래로 겹친다. 한 자리에 2장 이상이면 3.5초마다 아래 포스터가 다시 덧붙는다
- 포스터 모양·색은 항목 id로 고정(poster·color로 직접 지정 가능). 행사(type event 또는 date 있음)는 파란 행사 포스터, 1·2번째 큰 자리는 큰 제목 포스터
- 900px 미만은 포스터가 한 줄(폰)·여러 줄(태블릿)로 흐르고 스크롤하면 하나씩 붙는다. 동작 줄이기 설정이면 애니메이션 없음
더미 테스트: `https://dsinu.com/?demo=3` (N개, 최대 60). 기본 주소에는 절대 나오지 않는다.

## 서비스 이식 방식

| 방식 | 대상 | 장점 | 단점 |
|---|---|---|---|
| path (`dsinu.com/s/<id>/`) | HTML 한 파일로 끝나는 정적 서비스 | 가장 간단, 허브와 같은 배포 | 허브 저장소가 커짐, 학생 단독 배포 불가 |
| subdomain (`<id>.dsinu.com`) | 서버·DB·로그인 있는 서비스 | 독립 배포, 장애 격리 | Cloudflare에서 도메인 연결 1회 필요 |
| external | 이미 다른 곳에 배포된 서비스 | 즉시 등록 | 링크가 죽을 수 있음 → cover 스크린샷 필수 |

등록 절차: 학생이 등록 요청(이름·주소·한 줄 설명·스크린샷·제작자 공개 동의) → 교수 확인 → apps.json 추가 후 푸시.
external로 등록된 서비스는 한 학기 안에 path 또는 subdomain으로 이전하는 것을 원칙으로 한다.

## 배포 전 검사 (필수)
푸시 전에 두 검사를 모두 통과해야 한다. 실패하면 고치고 다시 돌린다.
- `python3 tools/qa.py public 8801` — 모바일 가로 스크롤, 벽 포스터 표시(편집형 레이아웃이면 워드마크 폭), h1 개수, 이미지 alt, 키보드 포커스, 콘솔 오류
- `python3 tools/copy_audit.py public 8802` — 소개·설명·설득 문구 탐지
- 레이아웃 수치 기준은 `tools/layout_spec.json` (시안 07-1). 간격·글자 크기를 바꿀 때 이 값에서 벗어나지 않는다
- 필요: `pip install playwright && playwright install chromium`

## 페이지 만들기 ("~ 페이지 만들어줘")
1. slug 결정: 영문 소문자·숫자·하이픈, 연도 포함 (예: `contest-2026`, `award-2026-capstone`). 기존 slug와 겹치면 안 됨
2. `templates/basic.html`을 `public/<slug>/index.html`로 복사하고 {{TITLE}} {{SUMMARY}} {{EMOJI}} 채운 뒤 내용 작성
3. `public/pages.json`에 항목 추가
   - type: `event`(행사·공모전) | `notice`(공지) | `showcase`(학생 프로젝트·수상 홍보)
   - created: 오늘 날짜, expires: 행사면 행사 다음 날, 없으면 생략
   - date: 행사일 YYYY-MM-DD (허브 포스터의 D-day 기준). 행사가 아니면 생략
   - facts·poster·color: apps.json과 같은 선택 필드
4. 로컬 확인(`npx wrangler dev` 또는 public 폴더 정적 서버) 후 커밋·푸시 → 자동 배포. 2분 뒤 실제 주소가 열리는지 확인하고 알려주기: `https://dsinu.com/<slug>/`

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
- 모든 페이지 하단에 허브(/)와 운영 HAI Lab 링크 유지 (템플릿에 포함됨)

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
