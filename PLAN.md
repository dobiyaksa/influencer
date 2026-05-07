# 공동구매 캘린더 & AI 스터디 & 매출 대시보드 플랫폼

## 목표
약사 인플루언서를 위한 공동구매 운영 플랫폼. 친한스토어 REST API 연동 캘린더 이미지 생성 및 매출 대시보드, 이벤트 당첨자 관리, AI 그룹 스터디 운영까지 Cloudflare Pages에 정적 배포한다.

---

## 1. 사전 준비

### 1-1. 친한스토어 어드민 계정
- 캘린더 + 대시보드 공통 사용
- ID/PW + 슬랙 2FA 인증
- JWT 토큰: localStorage `dashboard_bearer_token` 키로 페이지 간 공유

### 1-2. 스프레드시트 설정 (스터디 신청 / 이벤트 폼)
- 스프레드시트 ID: `1AIYdoyZ3gv1XhaXZweMWdeWwK99qDkSra2mHRVDXrZY`
- Google Apps Script로 폼 데이터 저장 (POST 수신 → 시트 기록)

### 1-3. 공구 상태 코드
| 코드 | 분류 | 의미 |
|------|------|------|
| T0 | 진행예정 | 검토중 |
| T2 | 진행예정 | 준비중 |
| T4 | 진행예정 | 확정 |
| T6 | 진행예정 | 진행중 (주문 미발생) |
| T8 | 진행예정 | 진행완료 (주문 미발생) |
| **Y0** | **진행중** | 정산대기 (주문 발생, 매출 데이터 있음) |
| **Y8** | **완료** | 정산완료 |
| C0 | 기타 | 취소 |
| C4 | 기타 | 보류 |

### 1-4. 친한스토어 어드민 API
- Base URL: `https://api.store.friendly-pharmacist.com`
- Swagger: `dev-api.store.friendly-pharmacist.com/swagger-ui/index.html`
- 인증: Bearer JWT 토큰

### 1-5. Cloudflare Pages 설정
- Wrangler CLI: `npm i -g wrangler`
- 프로젝트명: `influencer`
- 프로덕션 URL: https://influencer-p68.pages.dev

---

## 2. 프로젝트 구조

```
influencer/
├── index.html                 ← 공동구매 캘린더 (메인 앱)
├── event.html                 ← 이벤트 당첨자 배송지 입력 폼
├── event-admin.html           ← 이벤트 당첨자 관리자 대시보드
├── study.html                 ← AI 스터디 신청 폼
├── study-admin.html           ← 스터디 관리자 대시보드
├── study-curriculum.html      ← 스터디 커리큘럼 안내 페이지
├── study-skills-practice.html ← Claude Code 스킬 실습 가이드
├── dashboard.html             ← 공구 매출 대시보드 (REST API 직접 호출)
├── functions/
│   └── api/[[path]].js        ← Cloudflare Pages CORS 프록시
├── .claude/
│   └── commands/              ← Claude Code 커스텀 스킬 (8개)
├── CLAUDE.md                  ← Claude Code 프로젝트 설정
├── PLAN.md                    ← 이 파일
└── README.md                  ← 프로젝트 소개
```

**핵심 원칙**
- 프레임워크/빌드 도구 없이 순수 HTML + CSS + JavaScript 단일 파일 구성
- Cloudflare Pages 정적 호스팅 + Pages Functions (CORS 프록시)
- API 키/토큰은 사용자가 UI에서 직접 입력, localStorage에 저장

---

## 3. 페이지별 구현 명세

### 3-1. index.html (공동구매 캘린더)

**데이터 소스**: 친한스토어 어드민 REST API (대시보드와 인증 토큰 공유)

**인증**: Bearer JWT (ID/PW + 2FA), `dashboard_bearer_token` localStorage 키 공유

**상태 코드 필터**: T4(확정), T6(진행중), T8(진행완료), Y0(정산대기)만 표시

**외부 의존성 (CDN)**
- Google Fonts: Noto Sans KR, Jua, Gamja Flower, Bagel Fat One, Gaegu, Cormorant Garamond
- html2canvas v1.4.1

**디자인 스펙**
- 캘린더: 1080px × 1350px (인스타그램 4:5)
- 테마 색상: CSS 변수 `--accent` (RGB), `--accent-hex` (HEX)
- html2canvas scale: 2 → 2160×2700 고화질 PNG

**인터랙션**
- contenteditable로 제품명/설명/배지/타이틀 인라인 편집
- 편집 내용 localStorage(`edit_store`)에 자동 저장

**localStorage**: `dashboard_bearer_token` (공유), `theme_color`, `theme_font`, `selected_month`, `edit_store`, `admin_pw`, `admin_logged`

### 3-2. event.html (이벤트 당첨자 배송지 폼)

**데이터 소스**: Google Apps Script (POST, `mode: 'no-cors'`)

**외부 의존성 (CDN)**
- Google Fonts: Pretendard
- Daum Postcode API (카카오 주소 검색)

**폼 필드**: 제품명, 인스타그램, 수령인, 배송주소(다음 우편번호), 전화번호, 주문번호

**테마**: 골드 계열 (`--brand-primary: #E5A100`)

### 3-3. event-admin.html (이벤트 관리자 대시보드)

**데이터 소스**: Google Apps Script (GET 조회, POST 삭제)

**외부 의존성 (CDN)**
- Google Fonts: Pretendard
- SheetJS XLSX v0.18.5

**인증**: Apps Script 패스워드 → localStorage(`SESSION_KEY`)

**기능**: 제출 목록 테이블, 검색/정렬, 엑셀/CSV 내보내기, 개별 삭제

**테마**: 오렌지 계열 (`--brand-primary: #FF6B35`)

### 3-4. dashboard.html (공구 매출 대시보드)

**데이터 소스**: 친한스토어 어드민 REST API (직접 호출)

**외부 의존성 (CDN)**
- Google Fonts: Inter, JetBrains Mono
- SheetJS XLSX v0.18.5
- Chart.js v4.4.1

**인증 — 4단계 흐름 (ID/PW + 2FA)**
1. `POST /api/admin/v2/authentications/login` → ID/PW 로그인
2. master 계정이면 `POST /api/admin/v2/authentications/2fa/send` → 슬랙 인증번호 발송
3. `PUT /api/admin/v2/authentications/2fa/verify` → 인증번호 검증 (`authCode` 필드)
4. JWT 토큰 획득 → localStorage(`dashboard_bearer_token`)에 저장

**대체 인증**: Bearer 토큰 직접 입력 모드 (토글 가능)

**API 엔드포인트**
- `GET /api/commerce-be/v1/sellers` — 셀러 목록
- `GET /api/admin/v1/group-purchases/plans?limit=&offset=` — 공구 플랜 목록 (페이지네이션)
- `GET /api/admin/v1/group-purchases/plans/{id}` — 공구 상세 (매출 리포트 포함)

**공구 상세 응답 구조**
- `group_purchase_plan` — 기본 정보 (제목, 기간, 브랜드, 상태코드)
- `influencer` — 인플루언서 정보
- `seller` — 셀러 정보
- `group_purchase_products` — 상품 목록 (이미지 포함)
- `group_purchase_product_opt_sets` → `group_purchase_product_opts` — 옵션별 가격/할인/커미션
- `group_purchase_plan_report_sale` — 매출 리포트 (null일 수 있음: 주문 미발생 시)
  - `order_count_total`, `box_count_total`, `normal_order_amount_total`
  - `group_purchase_plan_report_sale_day` → 일별 매출
  - `group_purchase_plan_report_sale_option` → 옵션별 매출

**UI 구성**
- 통계 카드 4개 (총 공구, 진행중, 셀러 수, 상품 수)
- Chart.js 바 차트 (셀러별 상품 수, 상태별 분포)
- 정렬/검색/필터 테이블 (상태 필터: 전체/진행중/완료/진행예정/취소)
- 상세 모달 (클릭 시): 인플루언서·셀러 정보, 상품 이미지, 옵션 가격표, 일별·옵션별 매출
- 다크모드 지원 (시스템 설정 연동)

**내보내기**: 엑셀(.xlsx), CSV

**localStorage**: `dashboard_bearer_token`

### 3-5. study.html (스터디 신청 폼)

**데이터 소스**: Google Apps Script (POST, `mode: 'no-cors'`)

**외부 의존성**: Google Fonts (Jua, Noto Sans KR)

**폼 기능**: 체크박스(최대 N개 선택 제한), 라디오, 스케일 선택, "기타" 자유입력, 진행률 표시

**localStorage**: `study_script_url`, `study_submissions`

### 3-6. study-admin.html (스터디 관리자 대시보드)

**데이터 소스**: Google Apps Script (GET 조회, POST 삭제)

**인증**: Apps Script 패스워드 → localStorage(`SESSION_KEY`)

**기능**: 신청자 목록 테이블 (전체/승인/거절 탭), Apps Script URL 설정

**localStorage**: `SESSION_KEY`, `study_script_url`

### 3-7. study-curriculum.html (커리큘럼 안내)

**정적 페이지** (API 호출 없음)

**내용**
- Week 1: 환경 세팅 + 프로젝트 실행/배포
- Week 2: AI 이미지 생성 & 콘텐츠 제작
- Week 3: API 연동 & CORS 프록시 & 데이터 시각화
- Week 4: 최종 발표 & 네트워킹

**연동**: Week 1, Week 3 과제 영역에서 실습 가이드(`study-skills-practice`)로 링크

**CTA**: 하단 "스터디 지원하기" → study.html 연결

### 3-8. study-skills-practice.html (스킬 실습 가이드)

**정적 페이지** (API 호출 없음)

**구성**
- Section 0: 사전 준비 — Mac/Windows 탭 환경 세팅 (7 Step)
- Section 1: 스킬 개요 — 7개 스킬 명령어 소개
- Section 2: 실습 1 — /공구캘린더 (테마 변경, 제품 추가, 자유 수정)
- Section 3: 실습 2 — /공구대시보드 (API 인증, CORS, Swagger, 커스터마이징)
- Section 4: 실습 3 — /당첨자폼 (제품 정보 변경, 필드 추가, 관리자 확인)
- Section 5: 실습 4 — /deploy (배포)
- 도전 과제: 7개 (A~G, 난이도 쉬움/보통/어려움 표시)

**기능**: 각 실습에 소요 시간 표시, "배우는 것" 학습 목표, 환경 세팅 체크리스트, 맨 위로 버튼

---

## 4. CORS 프록시 (Cloudflare Pages Functions)

### 4-1. 파일: `functions/api/[[path]].js`

**목적**: 배포 환경에서 브라우저 → 친한스토어 API 호출 시 CORS 차단 우회

**동작**
```
브라우저 (influencer-p68.pages.dev)
  → /api/admin/v2/... (같은 도메인, CORS 없음)
  → Cloudflare Pages Function (서버)
    → api.store.friendly-pharmacist.com (서버↔서버, CORS 없음)
  ← 응답 전달 (Access-Control-Allow-Origin: 화이트리스트 Origin 추가)
```

**환경 분기**
- 로컬(`localhost`): `API_BASE = 'https://api.store.friendly-pharmacist.com'` → 직접 호출
- 배포(`pages.dev`): `API_BASE = ''` → `/api/...` 상대경로로 프록시 경유

**구현**: OPTIONS preflight 204 응답, GET/POST/PUT/DELETE 전달, `host`/`origin`/`referer` 헤더 제거

---

## 5. Claude Code 스킬

| 명령어 | 대상 파일 | 설명 |
|--------|-----------|------|
| `/공구캘린더` | index.html | 캘린더 생성/수정 |
| `/당첨자폼` | event.html, event-admin.html | 이벤트 당첨자 폼 생성/수정 |
| `/커리큘럼` | study-curriculum.html | 커리큘럼 페이지 생성/수정 |
| `/공구대시보드` | dashboard.html | 매출 대시보드 수정 |
| `/프록시` | functions/api/[[path]].js | CORS 프록시 생성/수정 |
| `/deploy` | — | Cloudflare Pages 배포 |
| `/add-product` | index.html | 캘린더 제품 매핑 추가 |
| `/setup` | — | 프로젝트 설정 상태 점검 |

---

## 6. 배포

```bash
CLOUDFLARE_API_TOKEN=<토큰> wrangler pages deploy . --project-name=influencer --commit-dirty=true
```

- 빌드 없음 (정적 HTML + Cloudflare Pages Functions)
- 프로덕션 URL: https://influencer-p68.pages.dev
- Pages Functions: `functions/` 디렉토리 자동 인식

---

## 7. 운영 플로우

### 공동구매 캘린더
1. influencer-p68.pages.dev 접속 → 로그인 (또는 대시보드 토큰 자동 공유)
2. 친한스토어 API에서 공구 데이터 실시간 로드 (T4/T6/T8/Y0 필터)
3. 인라인 편집 → "이미지 저장" → PNG 다운로드 → 인스타그램 업로드

### 매출 대시보드
1. influencer-p68.pages.dev/dashboard 접속
2. ID/PW 로그인 (master는 슬랙 2FA 추가)
3. 통계/차트/테이블 확인, 공구 클릭 시 상세 매출 조회
4. 필요 시 엑셀/CSV 내보내기

### 이벤트 당첨자 관리
1. influencer-p68.pages.dev/event → 당첨자가 배송지 입력
2. influencer-p68.pages.dev/event-admin → 관리자가 제출 데이터 확인/내보내기

### AI 스터디
1. study-curriculum → 커리큘럼 확인
2. study → 신청
3. study-admin → 관리자 신청자 관리
4. study-skills-practice → 실습 가이드 (수업 자료)

---

## 8. 주의사항

- html2canvas: 외부 이미지 CORS → canvas/fetch/corsproxy.io 3단계 변환 대응
- html2canvas: `createPattern` 0크기 에러 → `CanvasRenderingContext2D.prototype.createPattern` monkey-patch
- `contenteditable` 요소에 반드시 `spellcheck="false"` 포함
- html2canvas 호환성: pseudo-element 사용 금지 → 실제 DOM 요소 사용
- CORS 프록시: Origin 화이트리스트 적용 (influencer-p68.pages.dev, localhost)
- Bearer 토큰은 localStorage에 저장 — 민감 정보이므로 공용 PC 사용 주의
- 캘린더와 대시보드가 동일한 `dashboard_bearer_token` 키를 공유하여 한 번 로그인으로 양쪽 사용 가능
- 매출 데이터(`group_purchase_plan_report_sale`)는 주문 미발생 시 null 반환 → 방어 코드 필요
- 캘린더 API에 판매링크(salesLink) 필드 없음 → 빈 문자열 처리, 편집으로 수동 입력 가능
