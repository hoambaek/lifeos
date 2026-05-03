# LifeOS Project Instructions

호암님의 개인 라이프 OS — 운동 / Coach (식이·사업) / 식이 트래킹 통합 모바일 PWA.

## Stack
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 (CSS-first config in `globals.css`) + shadcn/ui
- **DB**: Turso (libSQL/SQLite) + Prisma ORM (PrismaLibSql adapter)
- **AI**: Anthropic Claude SDK (`claude-opus-4-5`, streaming + Vision)
- **State**: Zustand (운동 페이지) / 컴포넌트 state (나머지)
- **Theme**: next-themes (light/dark)

## DB 작업 워크플로
- `prisma db push` 사용 불가 (libSQL 어댑터 한계)
- 새 모델·필드는 다음 순서로 적용:
  1. `prisma/schema.prisma` 수정
  2. `scripts/migrate-*.mjs` 작성 — libsql client로 직접 ALTER/CREATE
  3. `node scripts/migrate-*.mjs` 실행
  4. `npx prisma generate`
  5. dev 서버 재시작 (Prisma client 캐시)
- 환경변수: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (`.env`)
- Anthropic: `ANTHROPIC_API_KEY` (`.env.local`)

## 핵심 라우트
- `/` — 운동 (요일별 자동 루틴, 체크리스트)
- `/diet` — 식이 트래킹 (Phase, 단식, 식사 로그, 단백질·물·수면, 맥락 룰)
- `/coach` — AI Coach (식이/사업 두 모드, 영구 대화, Vision)
- `/api/coach` — Claude streaming
- `/api/diet`, `/api/diet/profile`, `/api/diet/meals`, `/api/diet/fasting`
- `/api/sessions`, `/api/sessions/[id]`, `/api/upload`

## 핵심 모델 (스위치온 다이어트 + freedom-plan 기반)
- `DailyLog` — 운동·기존 게이미피케이션
- `DietProfile` — 부스터 시작일, 럭셔리 분기 기간 (단일 행)
- `DietLog` — 날짜별 단백질·물·수면·맥락 4종(호텔/와인/출장/회식)
- `MealEntry` — 식사 로그 (시간·메뉴·사진)
- `FastingSession` — 활성 단식 (14h/18h/24h 프리셋, endedAt null = 진행 중)
- `ChatSession` + `ChatMessage` — Coach 대화 (type: diet|business, 이미지 포함)

## Phase 계산 (`src/lib/diet-phase.ts`)
- `not_started` (boosterStartDate null) → "아직 시작 전"
- `booster` (시작 후 0-27일) → W1 D1-3 / W1 D4-7 / W2 / W3 / W4
- `maintenance` (28일 경과) → "유지기"
- `luxury_exception` (luxury 기간 중) → 트래킹 일시정지

## Coach 동작 (`src/lib/coach-prompts.ts`)
- 식이 모드: freedom-plan + 오늘 Phase + 활성 단식 + 오늘 식사 + 최근 7일 자동 주입. 출력 형식 고정 (판단/이유/대안)
- 사업 모드: freedom-plan §5 의사결정 칼 (Q1/Q2/판단/이유/대안 액션)
- Vision: `imagePaths`를 base64로 변환해 content blocks 구성

## 핵심 행동 규칙
- 작업 분해는 TaskCreate, 각 단계 완료 즉시 TaskUpdate
- 모바일 우선 (375px 기준)
- iOS Safari time/number input은 16px 미만이면 자동 zoom — `text-base` 필수
- 변경 후 `npx tsc --noEmit`로 타입 검증, Playwright MCP로 브라우저 확인 후 커밋

## Docs
- Turso: https://docs.turso.tech/introduction
- Anthropic SDK: https://docs.anthropic.com/
- freedom-plan 원본: `src/lib/freedom-plan.ts` (Coach system prompt에 자동 포함)
