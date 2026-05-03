# LifeOS

호암님의 개인 라이프 OS — 운동·식이·사업 의사결정을 한 모바일 PWA에서.

## 구성

| 탭 | 역할 |
|---|---|
| 🏋️ **운동** | 요일별 자동 루틴 + 체크리스트 + 인바디 트래킹 |
| 💬 **Coach** | AI 챗봇 (식이/사업 두 모드, 사진 첨부, 대화 영구 저장) |
| 🍽️ **식이** | 스위치온 다이어트 Phase 자동 계산 + 간헐적 단식 + 식사 로그 + 맥락 룰 |

## Coach가 판단의 근거로 쓰는 것

- `src/lib/freedom-plan.ts` — 호암님의 자유 자금 확보 플랜 (PrivéTag·뮤즈드마레·스위치온 다이어트)
- 오늘 Phase + 활성 단식 + 오늘 식사 로그 + 최근 7일 요약 (식이 모드)
- §5 의사결정 칼 3가지 질문 — 사업 라인 우선순위 (사업 모드)

## 기술 스택

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 + shadcn/ui
- Turso (libSQL/SQLite) + Prisma + PrismaLibSql adapter
- Anthropic Claude (`claude-opus-4-5`, streaming + Vision)
- next-themes · PWA · Vercel deploy

## 개발

```bash
# 1. 의존성
npm install

# 2. 환경변수 (.env / .env.local)
TURSO_DATABASE_URL=...
TURSO_AUTH_TOKEN=...
ANTHROPIC_API_KEY=...

# 3. dev 서버 (포트 4600)
npm run dev
```

## DB 마이그레이션

`prisma db push` 사용 불가. SQL을 libSQL client로 직접 적용:

```bash
# schema.prisma 수정 후
node scripts/migrate-*.mjs   # ALTER / CREATE
npx prisma generate          # 타입 갱신
```

기존 마이그레이션 스크립트:
- `migrate-coach.mjs` — DietProfile/DietLog/ChatSession/ChatMessage
- `migrate-add-images.mjs` — ChatMessage.imagePaths
- `migrate-add-meals.mjs` — MealEntry
- `migrate-add-fasting.mjs` — FastingSession

## 배포

```bash
git push   # main → Vercel 자동 배포
```

Vercel Project Settings → Environment Variables에 `ANTHROPIC_API_KEY` 등록 필수.

## 추가 문서

- `CLAUDE.md` — 프로젝트 작업 가이드 (다음 세션의 Claude용)
- `PRD.md` — 기능별 상세 요구사항
