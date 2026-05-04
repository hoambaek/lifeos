import { FREEDOM_PLAN } from './freedom-plan'
import {
  WEEK_META, FORBIDDEN_FOODS,
  allowedFoodsByWeek, getDailyGuide,
} from './diet-guide'

export type CoachType = 'diet' | 'business'

export interface DietContext {
  todayLog: {
    dayNumber: number
    week: number
    breakfastDone: boolean
    lunchDone: boolean
    snackDone: boolean
    dinnerDone: boolean
    fastingComplete: boolean
    sleepHours?: number | null
    waterCups: number
    exerciseDone: boolean
    noAlcohol: boolean
    noFlour: boolean
    noSugar: boolean
    memo?: string | null
  } | null
  recentLogs: Array<{
    date: string // yyyy-MM-dd
    week: number
    dayNumber: number
    breakfastDone: boolean
    lunchDone: boolean
    dinnerDone: boolean
    fastingComplete: boolean
    waterCups: number
  }>
  config: {
    startDate: string // yyyy-MM-dd
    currentWeek: number
    currentPhase: string
  } | null
  // 시작일 + 오늘 기준으로 미리 계산해서 넘김 (없으면 시작 전)
  guide: {
    week: number // 1~5 (5 = 유지기)
    dayInWeek: number // 1~7
    totalDay: number
  } | null
}

// 스위치온 5주 프로그램 전체 요약 (코치가 모든 주차 질문에 답할 수 있도록)
function switchonProgramOverview(): string {
  const lines = [
    '## 스위치온 다이어트 프로그램 (4주 + 유지기, by 박용우)',
    '',
    '핵심 원리: 단백질 쉐이크로 장을 쉬게 → 지방 대사 스위치 ON → 인슐린 저항성 개선 → 체지방 감량 → 기초대사량 회복',
    '',
  ]
  for (const w of [1, 2, 3, 4, 5]) {
    const meta = WEEK_META[w]
    if (!meta) continue
    lines.push(`### ${meta.title} — ${meta.goal}`)
    lines.push(meta.summary)
    if (meta.notes.length) {
      for (const n of meta.notes) lines.push(`- ${n}`)
    }
    // 7일 식단 패턴 한 줄 요약
    const days: string[] = []
    for (let d = 1; d <= 7; d++) {
      const dg = getDailyGuide(w, d)
      if (!dg) continue
      if (dg.isFullFastDay) {
        days.push(`D${d}: 종일단식`)
      } else {
        const slots = [
          `아${slotShort(dg.breakfast.type)}`,
          `점${slotShort(dg.lunch.type, dg.lunch.label)}`,
          `간${slotShort(dg.snack.type)}`,
          `저${slotShort(dg.dinner.type, dg.dinner.label)}`,
        ]
        days.push(`D${d}: ${slots.join('/')}`)
      }
    }
    lines.push(`식단: ${days.join(' | ')}`)
    lines.push('')
  }
  return lines.join('\n')
}

function slotShort(type: string, label?: string): string {
  if (type === 'shake') return '쉐'
  if (type === 'fasting') return '단'
  if (type === 'free') return '자'
  // meal — label 기반
  if (label?.includes('현미')) return '현½'
  if (label?.includes('탄수화물 없는')) return '탄X'
  return '식'
}

function forbiddenBlock(): string {
  return FORBIDDEN_FOODS.map((c) => `- ${c.category}: ${c.items.join(', ')}`).join('\n')
}

export function buildDietSystemPrompt(ctx: DietContext): string {
  const { todayLog, recentLogs, config, guide } = ctx

  const configBlock = config
    ? `다이어트 시작일: ${config.startDate} / 현재 주차: ${config.currentWeek}주차`
    : '다이어트 설정: 아직 시작하지 않음 (사용자가 /diet에서 시작 버튼을 눌러야 함)'

  // 오늘의 식단 가이드 (가이드 데이터 기반 권장)
  let todayGuideBlock = ''
  let allowedBlock = ''
  if (guide) {
    const dg = getDailyGuide(guide.week, guide.dayInWeek)
    const meta = WEEK_META[Math.min(guide.week, 5)]
    if (dg && meta) {
      todayGuideBlock = [
        `오늘 권장 식단 (${meta.title} ${guide.dayInWeek}일차 / 시작 ${guide.totalDay}일차):`,
        dg.isFullFastDay
          ? `- 종일 24시간 단식일 — 물·차·블랙커피만 / 단식 후 단백질·야채 양껏 회복식`
          : [
              `- 아침: ${dg.breakfast.label}${dg.breakfast.hint ? ` (${dg.breakfast.hint})` : ''}`,
              `- 점심: ${dg.lunch.label}${dg.lunch.hint ? ` (${dg.lunch.hint})` : ''}`,
              `- 간식: ${dg.snack.label}${dg.snack.hint ? ` (${dg.snack.hint})` : ''}`,
              `- 저녁: ${dg.dinner.label}${dg.dinner.hint ? ` (${dg.dinner.hint})` : ''}`,
            ].join('\n'),
      ].join('\n')
      const allowed = allowedFoodsByWeek(guide.week, guide.dayInWeek)
      allowedBlock = `오늘까지 누적 허용 식품 (${allowed.length}개):\n${allowed.join(', ')}`
    }
  }

  const todayBlock = todayLog
    ? [
        `오늘 실제 진행 (${todayLog.week}주차 D${todayLog.dayNumber}):`,
        `- 끼니 체크: 아침 ${todayLog.breakfastDone ? '✅' : '⬜'} / 점심 ${todayLog.lunchDone ? '✅' : '⬜'} / 간식 ${todayLog.snackDone ? '✅' : '⬜'} / 저녁 ${todayLog.dinnerDone ? '✅' : '⬜'}`,
        `- 단식 완료: ${todayLog.fastingComplete ? 'O' : 'X'} / 운동: ${todayLog.exerciseDone ? 'O' : 'X'}`,
        `- 수면: ${todayLog.sleepHours ?? '-'}h / 물: ${todayLog.waterCups}컵`,
        `- 규칙: 금주 ${todayLog.noAlcohol ? 'O' : 'X'} / 금밀가루 ${todayLog.noFlour ? 'O' : 'X'} / 금설탕 ${todayLog.noSugar ? 'O' : 'X'}`,
        todayLog.memo ? `- 메모: ${todayLog.memo}` : '',
      ].filter(Boolean).join('\n')
    : '오늘 진행: 아직 체크 없음'

  const recentBlock = recentLogs.length
    ? '최근 7일 진행 요약:\n' +
      recentLogs.map((l) => {
        const meals = [l.breakfastDone && '아침', l.lunchDone && '점심', l.dinnerDone && '저녁'].filter(Boolean).join('·') || '없음'
        return `- ${l.date} [W${l.week}D${l.dayNumber}] 끼니: ${meals}, 물 ${l.waterCups}컵${l.fastingComplete ? ', 단식완료' : ''}`
      }).join('\n')
    : '최근 7일 로그: 없음'

  return `당신은 호암님의 스위치온 다이어트 식단 코치입니다.
호암님은 박용우 박사의 스위치온 다이어트 (4주 + 유지기) 프로그램을 진행 중이며, 두 종류 질문을 던집니다.
1) "지금 이걸 먹어도 돼?" 같은 즉석 판단
2) "3주차에는 어떻게 먹어야 해?", "단식 후 회복식은?" 같은 프로그램 자체에 대한 질문

판단 기준 우선순위:
(1) 스위치온 프로그램 표 (아래 전체 5주차 가이드)
(2) 현재 주차/일차 + 오늘 권장 식단 + 누적 허용/금지 식품
(3) 오늘 진행 상태 + 최근 7일 패턴
(4) freedom-plan 문서 (호암님 개인 컨텍스트: 사업·럭셔리 분기 룰 등)

${switchonProgramOverview()}

---
## 공통 금지 식품 (1주차 ~ 유지기 전체)
${forbiddenBlock()}

---
## 호암님 개인 컨텍스트 (freedom-plan)
${FREEDOM_PLAN}

---
## 현재 상태
${configBlock}

${todayGuideBlock || ''}

${allowedBlock || ''}

${todayBlock}

${recentBlock}

---
응답 가이드:

[A] 즉석 판단 질문 ("이거 먹어도 돼?", "지금 단식 깨도 돼?" 등):
판단: ✅ OK / ⚠️ 조건부 / ❌ 패스
이유: (현재 주차 룰 + 오늘 권장 + 진행 상황 근거 1-3줄)
대안: (조건부/패스일 때만 1-2줄. OK면 생략)

[B] 프로그램 설명 질문 ("3주차 어떻게 해?", "단식 후 뭐 먹어?" 등):
- 위 5주 프로그램 가이드 그대로 인용해서 답
- 핵심 패턴 → 예시 메뉴 → 주의점 순서로 간결하게
- 호암님이 현재 N주차이면 "현재 N주차 기준으로는…" 한 줄로 본인 상황 연결

규칙:
- 한국어로 간결하게. 마케팅 용어 금지.
- 사업 방향 질문이 들어오면 "사업 코치 탭에서 물어보세요"라고만 답하고 끝.
- 오늘 이미 체크된 끼니를 고려해서 체인 판단.
- 단식일이면 단식 깨면 안 되는지 명시. 단식 깨도 OK인 경우와 안 되는 경우 분명히.
- 누적 허용 식품 외 음식은 일단 보수적으로 ⚠️ 또는 ❌. 럭셔리 분기 예외만 ✅.
- 사용자가 과거 결정을 언급하면 대화 히스토리를 활용해 일관되게 답.`
}

export interface BusinessContext {
  // 향후 확장: 마지막 분기 점검 결과, ARR 등
}

export function buildBusinessSystemPrompt(_ctx: BusinessContext = {}): string {
  return `당신은 호암님의 사업 방향 코치입니다. 호암님이 "이 미팅 가야 돼?", "이 그랜트 지원할까?" 같은 방향성 판단을 묻습니다.
판단 기준은 아래 freedom-plan §5 의사결정 칼 (3개 질문 중 사업 관련 1·2번)입니다.

${FREEDOM_PLAN}

---
출력 형식 (반드시 이 구조):
Q1 PrivéTag 시리즈 A 앞당기는가?  Yes / No / 부분
Q2 뮤즈드마레 LVMH 합류 앞당기는가?  Yes / No / 부분
판단: ✅ 진행 / ⚠️ 조건부 / ❌ 거절·위임
이유: (어느 마일스톤·KPI에 어떻게 기여하는지 §1·§2 참조, 2-4줄)
대안 액션: (거절 시 누구에게 위임할지, 조건부면 어떤 조건으로)

규칙:
- 한국어로 간결하게. 마케팅 용어·근거 없는 수치 금지.
- 트레이드오프와 리스크는 솔직히.
- 식단 질문이 들어오면 "식단 코치 탭에서 물어보세요"라고만 답하고 끝.
- 시간 배분 룰(PrivéTag 60-65%, 뮤즈드마레 25-30%, 기타 10-15%)을 항상 의식할 것.
- 사용자가 과거 결정을 언급하면 대화 히스토리를 활용해 일관되게 답. 같은 일을 다른 결로 답하지 말 것.`
}

export function buildSystemPrompt(type: CoachType, ctx?: DietContext): string {
  if (type === 'diet') {
    if (!ctx) throw new Error('Diet coach requires DietContext')
    return buildDietSystemPrompt(ctx)
  }
  return buildBusinessSystemPrompt()
}
