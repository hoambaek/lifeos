# 오늘의 운동 체크리스트 전면 개편 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** LifeOS를 모바일 특화 단일 페이지 "오늘의 운동 체크리스트" 앱으로 전면 개편. 각 운동 항목에 동작 일러스트 SVG를 포함하고, 개별 운동 완료를 체크하면 DB에 저장.

**Architecture:** 기존 `page.tsx`의 운동 섹션을 확장하여 개별 운동 체크리스트 UI로 변경. 운동 데이터(`WORKOUT_DETAILS`)는 이미지 매핑 추가. `DailyLog`의 기존 `workoutDone` 필드 + 새 `completedExercises` JSON 필드로 개별 완료 추적. BottomNav 제거, 불필요 페이지/컴포넌트 정리.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS, shadcn/ui, Prisma + Turso (libSQL), Inline SVG Components

---

## 현재 운동 데이터 (변경 없음)

```
WORKOUT_ROUTINE (요일별):
  월: 가슴/삼두 | 화: 등/이두 | 수: 하체 | 목: 어깨/복근 | 금: 가슴/삼두 | 토: 등/이두 | 일: 휴식

WORKOUT_DETAILS (부위별 5개 운동, 총 20개):
  가슴/삼두: 덤벨 플로어프레스, 덤벨 플라이, TRX 푸쉬업, 덤벨 오버헤드 트라이셉스, TRX 트라이셉스 익스텐션
  등/이두:   덤벨 원암 로우, TRX 로우, 덤벨 풀오버, 덤벨 바이셉스 컬, 덤벨 해머컬
  하체:     덤벨 고블릿 스쿼트, 덤벨 런지, 덤벨 루마니안 데드리프트, TRX 피스톨 스쿼트, 덤벨 카프레이즈
  어깨/복근: 덤벨 숄더프레스, 덤벨 래터럴레이즈, 덤벨 프론트레이즈, TRX 파이크, TRX 폴아웃
```

## 파일 구조 변경 요약

```
유지:
  src/app/layout.tsx          (수정: BottomNav 제거)
  src/app/globals.css         (수정: 불필요 스타일 정리)
  src/app/api/log/route.ts    (수정: completedExercises 필드 추가)
  src/stores/useAppStore.ts   (수정: WorkoutExercise에 illustrationId 추가)
  src/components/ui/*         (그대로 유지)
  src/components/ThemeProvider.tsx
  src/components/ThemeToggle.tsx
  src/lib/db.ts

신규 생성:
  src/components/ExerciseIllustrations.tsx  (20개 운동 SVG 컴포넌트)
  src/components/ExerciseCard.tsx           (개별 운동 체크카드)
  src/components/WorkoutHeader.tsx          (헤더 + 프로그레스)
  src/components/CompletionCelebration.tsx  (전체 완료 축하)

완전 교체:
  src/app/page.tsx            (전면 재작성)

삭제:
  src/app/routine/            (루틴 페이지 전체)
  src/app/guide/              (가이드 페이지)
  src/app/log/                (기록 페이지)
  src/app/stats/              (통계 페이지)
  src/app/diet/               (식단 페이지)
  src/app/api/routine/        (루틴 API 전체)
  src/app/api/diet/           (식단 API)
  src/app/api/config/         (설정 API)
  src/app/api/gamification/   (게이미피케이션 API 전체)
  src/components/BottomNav.tsx
  src/components/DietStatusCard.tsx
  src/components/gamification/ (전체 디렉토리)
  src/stores/useGamificationStore.ts
  src/lib/gamification/
  docs/routine.md
```

---

## Task 1: 운동 일러스트 SVG 컴포넌트 제작

**Files:**
- Create: `src/components/ExerciseIllustrations.tsx`

20개 운동 동작의 미니멀 라인 SVG 일러스트를 React 컴포넌트로 제작.
동작 패턴별로 그룹화하여 효율적으로 구현.

**Step 1: SVG 컴포넌트 파일 생성**

각 운동별 SVG 컴포넌트. 스타일 규칙:
- viewBox: `0 0 120 120`
- stroke: `currentColor` (다크모드 자동 대응)
- strokeWidth: 2, strokeLinecap: round, strokeLinejoin: round
- fill: none (라인 드로잉 스타일)
- 사람 포즈 + 장비(덤벨/TRX) 간략 표현

```tsx
// src/components/ExerciseIllustrations.tsx
'use client'

import { SVGProps } from 'react'

type IllustrationProps = SVGProps<SVGSVGElement> & { className?: string }

const defaultProps: IllustrationProps = {
  viewBox: '0 0 120 120',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

// ── 가슴/삼두 ──

export function FloorPress({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      {/* 누운 자세 + 덤벨 프레스 */}
      {/* 바닥 */}
      <line x1="15" y1="95" x2="105" y2="95" strokeOpacity="0.3" />
      {/* 몸통 (누운 상태) */}
      <circle cx="30" cy="78" r="8" /> {/* 머리 */}
      <line x1="38" y1="78" x2="75" y2="78" /> {/* 몸통 */}
      <line x1="75" y1="78" x2="85" y2="95" /> {/* 허벅지 */}
      <line x1="85" y1="95" x2="85" y2="78" /> {/* 정강이 (무릎 세운 상태) */}
      {/* 팔 (덤벨 들어올리는 중) */}
      <line x1="50" y1="78" x2="50" y2="55" /> {/* 상완 */}
      <line x1="50" y1="55" x2="50" y2="40" /> {/* 전완 */}
      {/* 덤벨 */}
      <rect x="43" y="35" width="14" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function DumbbellFly({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <line x1="15" y1="95" x2="105" y2="95" strokeOpacity="0.3" />
      <circle cx="30" cy="78" r="8" />
      <line x1="38" y1="78" x2="75" y2="78" />
      <line x1="75" y1="78" x2="85" y2="95" />
      <line x1="85" y1="95" x2="85" y2="78" />
      {/* 양팔 벌린 상태 */}
      <line x1="50" y1="78" x2="35" y2="55" />
      <line x1="50" y1="78" x2="65" y2="55" />
      <rect x="28" y="50" width="14" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
      <rect x="58" y="50" width="14" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function TRXPushUp({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      {/* TRX 앵커포인트 */}
      <circle cx="60" cy="10" r="3" fill="currentColor" fillOpacity="0.3" />
      <line x1="50" y1="10" x2="50" y2="50" strokeDasharray="4 3" strokeOpacity="0.4" />
      <line x1="70" y1="10" x2="70" y2="50" strokeDasharray="4 3" strokeOpacity="0.4" />
      {/* 푸쉬업 자세 (기울어진 상태) */}
      <circle cx="40" cy="55" r="7" />
      <line x1="47" y1="58" x2="85" y2="75" /> {/* 몸통 */}
      <line x1="85" y1="75" x2="90" y2="95" /> {/* 다리 */}
      {/* 팔 (TRX 핸들 잡은 상태) */}
      <line x1="42" y1="62" x2="50" y2="50" />
      <line x1="45" y1="60" x2="70" y2="50" />
    </svg>
  )
}

export function OverheadTriceps({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      {/* 서 있는 자세 */}
      <circle cx="60" cy="22" r="8" />
      <line x1="60" y1="30" x2="60" y2="65" /> {/* 몸통 */}
      <line x1="60" y1="65" x2="50" y2="95" /> {/* 왼다리 */}
      <line x1="60" y1="65" x2="70" y2="95" /> {/* 오른다리 */}
      {/* 팔 (머리 뒤로 덤벨) */}
      <line x1="60" y1="38" x2="55" y2="25" /> {/* 상완 위로 */}
      <line x1="55" y1="25" x2="50" y2="38" /> {/* 전완 뒤로 접힘 */}
      <rect x="44" y="35" width="12" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function TRXTricepsExtension({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="10" r="3" fill="currentColor" fillOpacity="0.3" />
      <line x1="55" y1="10" x2="55" y2="45" strokeDasharray="4 3" strokeOpacity="0.4" />
      <line x1="65" y1="10" x2="65" y2="45" strokeDasharray="4 3" strokeOpacity="0.4" />
      {/* 기울어진 자세에서 팔 펴기 */}
      <circle cx="50" cy="50" r="7" />
      <line x1="57" y1="53" x2="80" y2="70" />
      <line x1="80" y1="70" x2="85" y2="95" />
      <line x1="52" y1="57" x2="55" y2="45" />
      <line x1="55" y1="53" x2="65" y2="45" />
    </svg>
  )
}

// ── 등/이두 ──

export function OneArmRow({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      {/* 벤치에 한 손 짚고 로우 */}
      <rect x="15" y="65" width="40" height="5" rx="2" strokeOpacity="0.3" /> {/* 벤치 */}
      <circle cx="55" cy="45" r="7" />
      <line x1="55" y1="52" x2="45" y2="68" /> {/* 몸통 기울임 */}
      <line x1="45" y1="68" x2="35" y2="95" /> {/* 다리 */}
      <line x1="45" y1="68" x2="55" y2="95" /> {/* 다리 */}
      {/* 왼손 벤치 짚기 */}
      <line x1="50" y1="55" x2="35" y2="65" />
      {/* 오른손 덤벨 당기기 */}
      <line x1="52" y1="58" x2="65" y2="65" />
      <line x1="65" y1="65" x2="68" y2="55" />
      <rect x="63" y="50" width="10" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function TRXRow({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="10" r="3" fill="currentColor" fillOpacity="0.3" />
      <line x1="50" y1="10" x2="50" y2="48" strokeDasharray="4 3" strokeOpacity="0.4" />
      <line x1="70" y1="10" x2="70" y2="48" strokeDasharray="4 3" strokeOpacity="0.4" />
      {/* 뒤로 기울어진 자세에서 당기기 */}
      <circle cx="55" cy="55" r="7" />
      <line x1="55" y1="62" x2="40" y2="85" /> {/* 몸통 기울임 */}
      <line x1="40" y1="85" x2="35" y2="95" />
      <line x1="52" y1="60" x2="50" y2="48" />
      <line x1="58" y1="60" x2="70" y2="48" />
    </svg>
  )
}

export function DumbbellPullover({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <line x1="15" y1="95" x2="105" y2="95" strokeOpacity="0.3" />
      <rect x="30" y="70" width="35" height="5" rx="2" strokeOpacity="0.3" />
      <circle cx="35" cy="62" r="7" />
      <line x1="42" y1="65" x2="65" y2="72" />
      <line x1="65" y1="72" x2="75" y2="95" />
      {/* 팔 머리 뒤로 뻗은 상태 */}
      <line x1="38" y1="58" x2="25" y2="48" />
      <line x1="25" y1="48" x2="18" y2="42" />
      <rect x="12" y="38" width="12" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function BicepsCurl({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="22" r="8" />
      <line x1="60" y1="30" x2="60" y2="65" />
      <line x1="60" y1="65" x2="50" y2="95" />
      <line x1="60" y1="65" x2="70" y2="95" />
      {/* 오른팔 컬 (접힌 상태) */}
      <line x1="60" y1="40" x2="72" y2="52" />
      <line x1="72" y1="52" x2="68" y2="38" />
      <rect x="63" y="32" width="10" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
      {/* 왼팔 내린 상태 */}
      <line x1="60" y1="40" x2="48" y2="58" />
      <rect x="42" y="56" width="10" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function HammerCurl({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="22" r="8" />
      <line x1="60" y1="30" x2="60" y2="65" />
      <line x1="60" y1="65" x2="50" y2="95" />
      <line x1="60" y1="65" x2="70" y2="95" />
      {/* 해머컬 (덤벨 세로 방향) */}
      <line x1="60" y1="40" x2="72" y2="50" />
      <line x1="72" y1="50" x2="70" y2="38" />
      <rect x="67" y="32" width="6" height="12" rx="2" fill="currentColor" fillOpacity="0.15" />
      <line x1="60" y1="40" x2="48" y2="58" />
      <rect x="45" y="56" width="6" height="12" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

// ── 하체 ──

export function GobletSquat({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="22" r="8" />
      <line x1="60" y1="30" x2="60" y2="55" />
      {/* 스쿼트 자세 (앉은 상태) */}
      <line x1="60" y1="55" x2="45" y2="72" /> {/* 허벅지 */}
      <line x1="45" y1="72" x2="45" y2="95" /> {/* 정강이 */}
      <line x1="60" y1="55" x2="75" y2="72" />
      <line x1="75" y1="72" x2="75" y2="95" />
      {/* 가슴 앞 덤벨 */}
      <line x1="60" y1="38" x2="55" y2="42" />
      <line x1="60" y1="38" x2="65" y2="42" />
      <rect x="52" y="42" width="16" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function DumbbellLunge({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="50" cy="22" r="8" />
      <line x1="50" y1="30" x2="50" y2="58" />
      {/* 런지 자세 */}
      <line x1="50" y1="58" x2="35" y2="78" /> {/* 앞 허벅지 */}
      <line x1="35" y1="78" x2="35" y2="95" /> {/* 앞 정강이 */}
      <line x1="50" y1="58" x2="72" y2="72" /> {/* 뒤 허벅지 */}
      <line x1="72" y1="72" x2="85" y2="90" /> {/* 뒤 정강이 */}
      {/* 양손 덤벨 */}
      <line x1="50" y1="38" x2="38" y2="58" />
      <rect x="33" y="56" width="10" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
      <line x1="50" y1="38" x2="62" y2="58" />
      <rect x="57" y="56" width="10" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function RomanianDeadlift({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      {/* 힌지 자세 (상체 앞으로 기울임) */}
      <circle cx="40" cy="30" r="8" />
      <line x1="45" y1="35" x2="70" y2="50" /> {/* 몸통 기울임 */}
      <line x1="70" y1="50" x2="65" y2="80" /> {/* 왼다리 살짝 굽힘 */}
      <line x1="65" y1="80" x2="65" y2="95" />
      <line x1="70" y1="50" x2="78" y2="80" />
      <line x1="78" y1="80" x2="78" y2="95" />
      {/* 덤벨 아래로 내린 상태 */}
      <line x1="48" y1="38" x2="38" y2="55" />
      <rect x="32" y="53" width="12" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
      <line x1="42" y1="36" x2="52" y2="55" />
      <rect x="46" y="53" width="12" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function TRXPistolSquat({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="10" r="3" fill="currentColor" fillOpacity="0.3" />
      <line x1="55" y1="10" x2="50" y2="38" strokeDasharray="4 3" strokeOpacity="0.4" />
      <line x1="65" y1="10" x2="65" y2="38" strokeDasharray="4 3" strokeOpacity="0.4" />
      <circle cx="55" cy="42" r="7" />
      <line x1="55" y1="49" x2="55" y2="65" />
      {/* 한 다리 스쿼트 */}
      <line x1="55" y1="65" x2="45" y2="82" />
      <line x1="45" y1="82" x2="48" y2="95" />
      {/* 앞으로 뻗은 다리 */}
      <line x1="55" y1="65" x2="80" y2="72" />
      {/* TRX 잡은 팔 */}
      <line x1="52" y1="52" x2="50" y2="38" />
      <line x1="58" y1="52" x2="65" y2="38" />
    </svg>
  )
}

export function CalfRaise({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="15" r="8" />
      <line x1="60" y1="23" x2="60" y2="58" />
      {/* 까치발 자세 */}
      <line x1="60" y1="58" x2="55" y2="82" />
      <line x1="55" y1="82" x2="55" y2="88" />
      <line x1="55" y1="88" x2="50" y2="88" /> {/* 발끝으로 서기 */}
      <line x1="60" y1="58" x2="65" y2="82" />
      <line x1="65" y1="82" x2="65" y2="88" />
      <line x1="65" y1="88" x2="70" y2="88" />
      {/* 바닥 (스텝) */}
      <rect x="40" y="90" width="40" height="5" rx="2" strokeOpacity="0.3" />
      {/* 양손 덤벨 */}
      <line x1="60" y1="35" x2="45" y2="50" />
      <rect x="40" y="48" width="10" height="5" rx="2" fill="currentColor" fillOpacity="0.15" />
      <line x1="60" y1="35" x2="75" y2="50" />
      <rect x="70" y="48" width="10" height="5" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

// ── 어깨/복근 ──

export function ShoulderPress({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="30" r="8" />
      <line x1="60" y1="38" x2="60" y2="70" />
      <line x1="60" y1="70" x2="50" y2="95" />
      <line x1="60" y1="70" x2="70" y2="95" />
      {/* 양팔 위로 프레스 */}
      <line x1="60" y1="45" x2="45" y2="30" />
      <line x1="45" y1="30" x2="40" y2="15" />
      <rect x="34" y="10" width="12" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
      <line x1="60" y1="45" x2="75" y2="30" />
      <line x1="75" y1="30" x2="80" y2="15" />
      <rect x="74" y="10" width="12" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function LateralRaise({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="22" r="8" />
      <line x1="60" y1="30" x2="60" y2="65" />
      <line x1="60" y1="65" x2="50" y2="95" />
      <line x1="60" y1="65" x2="70" y2="95" />
      {/* 양팔 옆으로 들어올림 (T자) */}
      <line x1="60" y1="40" x2="30" y2="40" />
      <rect x="22" y="37" width="10" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
      <line x1="60" y1="40" x2="90" y2="40" />
      <rect x="88" y="37" width="10" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function FrontRaise({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="22" r="8" />
      <line x1="60" y1="30" x2="60" y2="65" />
      <line x1="60" y1="65" x2="50" y2="95" />
      <line x1="60" y1="65" x2="70" y2="95" />
      {/* 양팔 앞으로 들어올림 */}
      <line x1="60" y1="40" x2="45" y2="25" />
      <rect x="39" y="20" width="12" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
      <line x1="60" y1="40" x2="52" y2="58" />
      <rect x="46" y="56" width="12" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function TRXPike({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      {/* 바닥 */}
      <line x1="10" y1="95" x2="110" y2="95" strokeOpacity="0.3" />
      {/* TRX에 발 걸고 파이크 */}
      <circle cx="35" cy="45" r="7" />
      {/* 몸통 (V자 형태) */}
      <line x1="35" y1="52" x2="55" y2="35" /> {/* 상체 아래로 */}
      <line x1="55" y1="35" x2="85" y2="55" /> {/* 하체 위로 */}
      {/* 팔 (바닥 짚기) */}
      <line x1="32" y1="52" x2="28" y2="75" />
      <line x1="38" y1="52" x2="42" y2="75" />
      {/* TRX 스트랩 */}
      <line x1="85" y1="55" x2="95" y2="20" strokeDasharray="4 3" strokeOpacity="0.4" />
      <circle cx="95" cy="15" r="3" fill="currentColor" fillOpacity="0.3" />
    </svg>
  )
}

export function TRXFallout({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="10" r="3" fill="currentColor" fillOpacity="0.3" />
      <line x1="50" y1="10" x2="35" y2="48" strokeDasharray="4 3" strokeOpacity="0.4" />
      <line x1="70" y1="10" x2="55" y2="48" strokeDasharray="4 3" strokeOpacity="0.4" />
      {/* 서서 팔 앞으로 뻗기 */}
      <circle cx="60" cy="55" r="7" />
      <line x1="60" y1="62" x2="60" y2="82" />
      <line x1="60" y1="82" x2="55" y2="95" />
      <line x1="60" y1="82" x2="65" y2="95" />
      {/* 팔 앞으로 뻗은 상태 */}
      <line x1="57" y1="60" x2="35" y2="48" />
      <line x1="63" y1="60" x2="55" y2="48" />
    </svg>
  )
}

// ── 매핑 테이블 ──

export const ILLUSTRATION_MAP: Record<string, React.FC<IllustrationProps>> = {
  '덤벨 플로어프레스': FloorPress,
  '덤벨 플라이': DumbbellFly,
  'TRX 푸쉬업': TRXPushUp,
  '덤벨 오버헤드 트라이셉스': OverheadTriceps,
  'TRX 트라이셉스 익스텐션': TRXTricepsExtension,
  '덤벨 원암 로우': OneArmRow,
  'TRX 로우': TRXRow,
  '덤벨 풀오버': DumbbellPullover,
  '덤벨 바이셉스 컬': BicepsCurl,
  '덤벨 해머컬': HammerCurl,
  '덤벨 고블릿 스쿼트': GobletSquat,
  '덤벨 런지': DumbbellLunge,
  '덤벨 루마니안 데드리프트': RomanianDeadlift,
  'TRX 피스톨 스쿼트': TRXPistolSquat,
  '덤벨 카프레이즈': CalfRaise,
  '덤벨 숄더프레스': ShoulderPress,
  '덤벨 래터럴레이즈': LateralRaise,
  '덤벨 프론트레이즈': FrontRaise,
  'TRX 파이크': TRXPike,
  'TRX 폴아웃': TRXFallout,
}
```

**Step 2: 빌드 확인**

Run: `npx next build --no-lint 2>&1 | head -20` (또는 `npx tsc --noEmit`)
Expected: 컴파일 에러 없음

**Step 3: Commit**

```bash
git add src/components/ExerciseIllustrations.tsx
git commit -m "feat: 20개 운동 동작 SVG 일러스트 컴포넌트 추가"
```

---

## Task 2: ExerciseCard 컴포넌트 제작

**Files:**
- Create: `src/components/ExerciseCard.tsx`

개별 운동 항목을 표시하는 체크카드 컴포넌트.

**Step 1: ExerciseCard 구현**

```tsx
// src/components/ExerciseCard.tsx
'use client'

import { WorkoutExercise } from '@/stores/useAppStore'
import { ILLUSTRATION_MAP } from './ExerciseIllustrations'
import { Check } from 'lucide-react'

interface ExerciseCardProps {
  exercise: WorkoutExercise
  index: number
  completed: boolean
  onToggle: () => void
}

export function ExerciseCard({ exercise, index, completed, onToggle }: ExerciseCardProps) {
  const Illustration = ILLUSTRATION_MAP[exercise.name]

  return (
    <button
      onClick={onToggle}
      className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-300 active:scale-[0.98] ${
        completed
          ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20'
          : 'border-border bg-card hover:border-stone-300 dark:hover:border-stone-600'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* 일러스트 */}
        <div className={`flex-shrink-0 w-20 h-20 rounded-xl flex items-center justify-center transition-colors ${
          completed
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500'
        }`}>
          {Illustration ? (
            <Illustration className="w-16 h-16" />
          ) : (
            <span className="text-2xl font-bold">{index + 1}</span>
          )}
        </div>

        {/* 운동 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
              exercise.equipment === '덤벨'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : exercise.equipment === 'TRX'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                  : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
            }`}>
              {exercise.equipment === '덤벨' ? 'D' : exercise.equipment === 'TRX' ? 'T' : 'B'}
            </span>
            <h3 className={`font-semibold text-sm truncate ${
              completed ? 'text-emerald-700 dark:text-emerald-300 line-through' : 'text-stone-900 dark:text-stone-100'
            }`}>
              {exercise.name}
            </h3>
          </div>
          <p className="text-xs font-mono text-stone-500 dark:text-stone-400">
            {exercise.sets}세트 × {exercise.reps}
          </p>
        </div>

        {/* 체크 표시 */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
          completed
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-stone-300 dark:border-stone-600'
        }`}>
          {completed && <Check className="w-4 h-4" strokeWidth={3} />}
        </div>
      </div>
    </button>
  )
}
```

**Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 3: Commit**

```bash
git add src/components/ExerciseCard.tsx
git commit -m "feat: ExerciseCard 체크리스트 카드 컴포넌트 추가"
```

---

## Task 3: WorkoutHeader + CompletionCelebration 컴포넌트

**Files:**
- Create: `src/components/WorkoutHeader.tsx`
- Create: `src/components/CompletionCelebration.tsx`

**Step 1: WorkoutHeader 구현**

```tsx
// src/components/WorkoutHeader.tsx
'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Dumbbell, Trophy, Moon } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

interface WorkoutHeaderProps {
  workoutPart: string
  completedCount: number
  totalCount: number
  isRestDay: boolean
}

export function WorkoutHeader({ workoutPart, completedCount, totalCount, isRestDay }: WorkoutHeaderProps) {
  const allDone = completedCount === totalCount && totalCount > 0
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <header className="px-6 pt-safe-top">
      <div className="pt-6 pb-4">
        {/* 날짜 + 테마 토글 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium tracking-widest uppercase text-stone-400 dark:text-stone-500">
            {format(new Date(), 'M월 d일 EEEE', { locale: ko })}
          </p>
          <ThemeToggle />
        </div>

        {/* 타이틀 */}
        <div className="flex items-center gap-3 mb-5">
          {isRestDay ? (
            <Moon className="w-7 h-7 text-indigo-400" />
          ) : allDone ? (
            <Trophy className="w-7 h-7 text-amber-500" />
          ) : (
            <Dumbbell className="w-7 h-7 text-stone-400" />
          )}
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {isRestDay ? '휴식일' : '오늘의 운동'}
            </h1>
            {!isRestDay && (
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                {workoutPart} · {completedCount}/{totalCount} 완료
              </p>
            )}
          </div>
        </div>

        {/* 프로그레스 바 */}
        {!isRestDay && (
          <div className="h-2 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                allDone ? 'bg-emerald-500' : 'bg-stone-900 dark:bg-stone-100'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </header>
  )
}
```

**Step 2: CompletionCelebration 구현**

```tsx
// src/components/CompletionCelebration.tsx
'use client'

import { Trophy } from 'lucide-react'

interface CompletionCelebrationProps {
  visible: boolean
}

export function CompletionCelebration({ visible }: CompletionCelebrationProps) {
  if (!visible) return null

  return (
    <div className="mx-6 mt-4 p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-emerald-50 dark:from-amber-950/30 dark:to-emerald-950/30 border border-amber-200/50 dark:border-amber-800/30 text-center animate-fade-in-up">
      <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-3" />
      <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
        오늘 운동 완료!
      </h3>
      <p className="text-sm text-stone-500 dark:text-stone-400">
        모든 운동을 마쳤습니다. 내일도 화이팅!
      </p>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/WorkoutHeader.tsx src/components/CompletionCelebration.tsx
git commit -m "feat: WorkoutHeader 헤더 및 CompletionCelebration 축하 컴포넌트 추가"
```

---

## Task 4: DailyLog에 completedExercises 필드 추가 (DB 마이그레이션)

**Files:**
- Modify: `prisma/schema.prisma` (DailyLog 모델에 필드 추가)
- Modify: `src/app/api/log/route.ts` (completedExercises 처리)

**Step 1: Prisma 스키마 수정**

`prisma/schema.prisma`의 DailyLog 모델에 추가:

```prisma
model DailyLog {
  // ... 기존 필드 유지
  completedExercises String?  // JSON 배열: "[0, 2, 4]" (완료한 운동 인덱스)
}
```

**Step 2: SQL 마이그레이션 실행**

CLAUDE.md에 따라 `prisma db push` 불가 → SQL 직접 실행.

```bash
# Turso CLI 또는 API로 실행:
# ALTER TABLE DailyLog ADD COLUMN completedExercises TEXT;
```

이를 위한 마이그레이션 API 엔드포인트를 사용하거나,
`src/app/api/log/route.ts`의 GET/POST에서 해당 컬럼이 없으면 무시하도록 안전하게 처리.

실제로는 Prisma `$executeRawUnsafe`로 ALTER TABLE 실행:

```typescript
// 한 번만 실행하면 되는 마이그레이션
await prisma.$executeRawUnsafe(`
  ALTER TABLE DailyLog ADD COLUMN completedExercises TEXT
`)
```

**Step 3: API route 수정 — completedExercises 읽기/쓰기**

`src/app/api/log/route.ts`의 POST 핸들러에서:

```typescript
// body에서 추가 필드 읽기
const { ..., completedExercises } = body

// 기존 기록 업데이트 시:
data: {
  // ... 기존 필드
  completedExercises: completedExercises !== undefined
    ? JSON.stringify(completedExercises)
    : existingLog.completedExercises,
}

// 새 기록 생성 시:
data: {
  // ... 기존 필드
  completedExercises: completedExercises ? JSON.stringify(completedExercises) : null,
}
```

GET 응답에서 completedExercises를 파싱하여 반환:

```typescript
// GET 응답 시 JSON 파싱
const parsed = log ? {
  ...log,
  completedExercises: log.completedExercises ? JSON.parse(log.completedExercises) : [],
} : null
```

**Step 4: Commit**

```bash
git add prisma/schema.prisma src/app/api/log/route.ts
git commit -m "feat: DailyLog에 completedExercises 필드 추가 및 API 수정"
```

---

## Task 5: 메인 페이지 전면 재작성

**Files:**
- Rewrite: `src/app/page.tsx` (완전히 새로 작성)

**Step 1: page.tsx 재작성**

```tsx
// src/app/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { WORKOUT_ROUTINE, WORKOUT_DETAILS, WorkoutExercise } from '@/stores/useAppStore'
import { WorkoutHeader } from '@/components/WorkoutHeader'
import { ExerciseCard } from '@/components/ExerciseCard'
import { CompletionCelebration } from '@/components/CompletionCelebration'

export default function WorkoutPage() {
  const [completedExercises, setCompletedExercises] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const todayWorkout = WORKOUT_ROUTINE[new Date().getDay()]
  const isRestDay = todayWorkout === '휴식'
  const exercises: WorkoutExercise[] = isRestDay ? [] : (WORKOUT_DETAILS[todayWorkout] || [])

  // 오늘 기록 불러오기
  useEffect(() => {
    const loadTodayLog = async () => {
      try {
        const res = await fetch('/api/log')
        const data = await res.json()
        if (data?.completedExercises) {
          setCompletedExercises(
            Array.isArray(data.completedExercises)
              ? data.completedExercises
              : JSON.parse(data.completedExercises)
          )
        }
      } catch (e) {
        console.error('Failed to load log:', e)
      } finally {
        setIsLoading(false)
      }
    }
    loadTodayLog()
  }, [])

  // 운동 토글 핸들러
  const handleToggle = useCallback(async (index: number) => {
    setCompletedExercises(prev => {
      const next = prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]

      // 저장 (비동기)
      const allDone = next.length === exercises.length
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedExercises: next,
          workoutDone: allDone,
          workoutPart: allDone ? todayWorkout : undefined,
        }),
      }).catch(e => console.error('Failed to save:', e))

      return next
    })
  }, [exercises.length, todayWorkout])

  const allDone = completedExercises.length === exercises.length && exercises.length > 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 dark:border-stone-600 dark:border-t-stone-100 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-safe-bottom">
      <WorkoutHeader
        workoutPart={todayWorkout}
        completedCount={completedExercises.length}
        totalCount={exercises.length}
        isRestDay={isRestDay}
      />

      {isRestDay ? (
        <div className="px-6 pt-12 text-center">
          <p className="text-6xl mb-4">😴</p>
          <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            오늘은 쉬는 날
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            충분한 휴식도 운동의 일부입니다.
          </p>
        </div>
      ) : (
        <>
          {/* 운동 체크리스트 */}
          <div className="px-4 pt-4 space-y-3">
            {exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.name}
                exercise={exercise}
                index={index}
                completed={completedExercises.includes(index)}
                onToggle={() => handleToggle(index)}
              />
            ))}
          </div>

          {/* 전체 완료 축하 */}
          <CompletionCelebration visible={allDone} />
        </>
      )}

      {/* 장비 범례 */}
      {!isRestDay && (
        <div className="flex items-center justify-center gap-4 mt-6 mb-8">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[11px] text-stone-400">덤벨</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-[11px] text-stone-400">TRX</span>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: 개발 서버에서 확인**

Run: `npm run dev` → http://localhost:3000 접속
Expected: 오늘 요일에 맞는 운동 체크리스트가 표시됨 (토요일 = 등/이두)

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: 메인 페이지를 운동 체크리스트로 전면 재작성"
```

---

## Task 6: Layout 수정 — BottomNav 제거

**Files:**
- Modify: `src/app/layout.tsx` (BottomNav import 및 렌더링 제거)

**Step 1: layout.tsx 수정**

변경사항:
1. `import { BottomNav } from "@/components/BottomNav"` 라인 삭제
2. `<BottomNav />` 렌더링 삭제
3. metadata 타이틀 변경: "오늘의 운동"

```tsx
// 수정 후 layout.tsx 의 주요 변경부분:

export const metadata: Metadata = {
  title: "오늘의 운동",
  description: "매일 운동 체크리스트",
  // ... manifest, icons 유지
};

// body에서 BottomNav 제거:
<main className="main-content">
  {children}
</main>
// <BottomNav /> ← 이 줄 삭제
```

**Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "refactor: BottomNav 제거 및 메타데이터 변경"
```

---

## Task 7: 불필요한 파일/디렉토리 삭제

**Files:**
- Delete: `src/app/routine/` (디렉토리 전체)
- Delete: `src/app/guide/` (디렉토리 전체)
- Delete: `src/app/log/` (디렉토리 전체)
- Delete: `src/app/stats/` (디렉토리 전체)
- Delete: `src/app/diet/` (디렉토리 전체)
- Delete: `src/app/api/routine/` (디렉토리 전체)
- Delete: `src/app/api/diet/` (디렉토리 전체)
- Delete: `src/app/api/config/` (디렉토리 전체)
- Delete: `src/app/api/gamification/` (디렉토리 전체)
- Delete: `src/components/BottomNav.tsx`
- Delete: `src/components/DietStatusCard.tsx`
- Delete: `src/components/gamification/` (디렉토리 전체)
- Delete: `src/stores/useGamificationStore.ts` (있을 경우)
- Delete: `src/lib/gamification/` (있을 경우)
- Delete: `docs/routine.md`

**Step 1: 삭제 실행**

```bash
# 페이지 삭제
rm -rf src/app/routine src/app/guide src/app/log src/app/stats src/app/diet

# API 삭제
rm -rf src/app/api/routine src/app/api/diet src/app/api/config src/app/api/gamification

# 컴포넌트 삭제
rm src/components/BottomNav.tsx src/components/DietStatusCard.tsx
rm -rf src/components/gamification

# 스토어/라이브러리 삭제
rm -f src/stores/useGamificationStore.ts
rm -rf src/lib/gamification

# 문서 삭제
rm -f docs/routine.md
```

**Step 2: 빌드 확인**

Run: `npx next build 2>&1 | tail -20`
Expected: 빌드 성공. 삭제된 파일 참조로 인한 에러가 있다면 Task 8에서 처리.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: 불필요한 페이지, API, 컴포넌트 일괄 삭제"
```

---

## Task 8: 빌드 에러 수정 및 useAppStore 정리

**Files:**
- Modify: `src/stores/useAppStore.ts` (불필요한 export 정리, 사용하지 않는 타입/데이터 정리 가능)

**Step 1: 빌드 에러 확인 및 수정**

Run: `npx next build 2>&1 | grep -i error`

가능한 에러들:
- `useGamificationStore` import 참조 → page.tsx에서 이미 제거됨
- `PROTEIN_FOODS`, `PHASES` 등 미사용 export → 남겨두되 page.tsx에서 import 하지 않으면 됨
- `DietStatusCard` import 참조 → 이미 삭제됨
- gamification 컴포넌트 import → 이미 삭제됨

**Step 2: useAppStore 미사용 코드 정리 (선택적)**

`useAppStore.ts`에서 page.tsx가 더 이상 사용하지 않는 항목들:
- `PROTEIN_FOODS` — 삭제 가능
- `PHASES` — 삭제 가능
- `UserConfig` 타입 — API에서 쓸 수 있으므로 유지
- `DailyLog` 타입에 `completedExercises?: number[]` 추가

```typescript
export interface DailyLog {
  id?: number
  date: Date
  weight?: number
  proteinAmount: number
  waterDone: boolean
  cleanDiet: boolean
  workoutDone: boolean
  workoutPart?: string
  completedExercises?: number[]  // 추가
  memo?: string
}
```

**Step 3: 빌드 재확인**

Run: `npx next build`
Expected: 빌드 성공

**Step 4: Commit**

```bash
git add -A
git commit -m "fix: 빌드 에러 수정 및 useAppStore 정리"
```

---

## Task 9: 모바일 최적화 마감

**Files:**
- Modify: `src/app/globals.css` (safe-area 관련 스타일 정리, 불필요 스타일 제거)
- Modify: `src/app/layout.tsx` (viewport 확인)

**Step 1: globals.css에서 bottom-nav 관련 스타일 제거**

기존에 `.bottom-nav`, `.safe-bottom`, `.main-content` 등의 BottomNav 관련 스타일이 있으면 제거하거나 수정.

```css
/* .main-content에서 padding-bottom 제거 (BottomNav 없으므로) */
.main-content {
  padding-bottom: 0;
  /* 기존 padding-bottom: env(safe-area-inset-bottom) + nav 높이 제거 */
}
```

**Step 2: safe-area 확인**

`layout.tsx`의 viewport 설정 확인 (이미 설정되어 있음):

```typescript
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f8fafc",
};
```

**Step 3: 개발 서버에서 최종 확인**

Run: `npm run dev`
- http://localhost:3000 접속
- 모바일 시뮬레이터 (Chrome DevTools → Toggle Device) 로 확인
- 체크리스트 터치/클릭 동작 확인
- 전체 완료 시 축하 메시지 확인
- 휴식일 (일요일) UI 확인

**Step 4: Commit**

```bash
git add -A
git commit -m "style: 모바일 최적화 및 불필요 스타일 정리"
```

---

## 실행 순서 요약

```
Task 1: ExerciseIllustrations.tsx (20개 SVG) ─────── 독립
Task 2: ExerciseCard.tsx ──────────────────────────── Task 1 의존
Task 3: WorkoutHeader.tsx + CompletionCelebration ─── 독립
Task 4: DB 마이그레이션 (completedExercises) ────────── 독립
Task 5: page.tsx 전면 재작성 ──────────────────────── Task 1,2,3,4 의존
Task 6: layout.tsx BottomNav 제거 ─────────────────── Task 5 이후
Task 7: 불필요 파일 삭제 ─────────────────────────── Task 6 이후
Task 8: 빌드 에러 수정 ──────────────────────────── Task 7 이후
Task 9: 모바일 최적화 마감 ───────────────────────── Task 8 이후
```

**병렬 가능:** Task 1, 3, 4는 동시 진행 가능
**순차 필수:** Task 5 → 6 → 7 → 8 → 9
