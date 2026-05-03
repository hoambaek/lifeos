import { FREEDOM_PLAN } from './freedom-plan'
import { computePhase, phaseGuidance, type DietPhase } from './diet-phase'

export type CoachType = 'diet' | 'business'

export interface DietContext {
  todayLog: {
    phase: string
    fastingStart?: string | null
    fastingEnd?: string | null
    fasting24: boolean
    proteinG: number
    waterMl: number
    sleepHours?: number | null
    hotelMeeting: boolean
    wineTasting: boolean
    travel: boolean
    businessDinner: boolean
    notes?: string | null
  } | null
  recentLogs: Array<{
    date: string // yyyy-MM-dd
    phase: string
    proteinG: number
    waterMl: number
    fasting24: boolean
  }>
  todayMeals: Array<{
    time?: string | null
    menu: string
    notes?: string | null
  }>
  activeFasting: {
    preset: string
    targetHours: number
    elapsedHours: number
    pct: number
  } | null
  phase: DietPhase
}

export function buildDietSystemPrompt(ctx: DietContext): string {
  const { phase, todayLog, recentLogs, todayMeals, activeFasting } = ctx
  const guidance = phaseGuidance(phase)
  const fastingBlock = activeFasting
    ? `현재 단식 진행 중: ${activeFasting.preset} (목표 ${activeFasting.targetHours}h, 경과 ${activeFasting.elapsedHours.toFixed(1)}h, ${activeFasting.pct.toFixed(0)}%)`
    : '현재 단식: 진행 중 아님'
  const todayBlock = todayLog
    ? [
        `오늘 식이 로그:`,
        `- Phase: ${todayLog.phase}`,
        `- 단식창: ${todayLog.fastingStart ?? '-'} ~ ${todayLog.fastingEnd ?? '-'} / 24h 단식: ${todayLog.fasting24 ? 'O' : 'X'}`,
        `- 단백질: ${todayLog.proteinG}g / 물: ${todayLog.waterMl}ml / 수면: ${todayLog.sleepHours ?? '-'}h`,
        `- 맥락: ${[
          todayLog.hotelMeeting && '호텔미팅',
          todayLog.wineTasting && '와인시음',
          todayLog.travel && '출장',
          todayLog.businessDinner && '회식',
        ].filter(Boolean).join(', ') || '없음'}`,
        todayLog.notes ? `- 메모: ${todayLog.notes}` : '',
      ].filter(Boolean).join('\n')
    : '오늘 식이 로그: 아직 입력 없음'

  const recentBlock = recentLogs.length
    ? '최근 7일 요약:\n' +
      recentLogs.map((l) => `- ${l.date} [${l.phase}] 단백질 ${l.proteinG}g, 물 ${l.waterMl}ml${l.fasting24 ? ', 24h단식' : ''}`).join('\n')
    : '최근 7일 로그: 없음'

  const mealsBlock = todayMeals.length
    ? '오늘 먹은 것:\n' +
      todayMeals.map((m) => `- ${m.time ?? '시간미상'} | ${m.menu}${m.notes ? ` (${m.notes})` : ''}`).join('\n')
    : '오늘 먹은 것: 아직 입력 없음'

  return `당신은 호암님의 식이 코치입니다. 호암님이 "지금 이걸 먹어도 돼?" 같은 즉석 판단을 묻습니다.
판단 기준은 아래 freedom-plan 문서, 현재 Phase, 오늘 로그, 최근 7일 로그입니다.

${FREEDOM_PLAN}

---
현재 Phase: ${phase.label} (${phase.code})
${guidance}

${fastingBlock}

${todayBlock}

${mealsBlock}

${recentBlock}

---
출력 형식 (반드시 이 구조):
판단: ✅ OK / ⚠️ 조건부 / ❌ 패스
이유: (현재 Phase + 맥락 룰 + 오늘 로그 근거를 1-3줄로)
대안: (조건부/패스일 때만, 1-2줄. OK면 생략)

규칙:
- 한국어로 간결하게. 마케팅 용어 금지.
- 사업 방향 질문이 들어오면 "사업 코치 탭에서 물어보세요"라고만 답하고 끝.
- 트래킹 일시정지(럭셔리 분기) 중이면 항상 ✅ OK + "럭셔리 분기 중" 명시.
- 오늘 이미 먹은 것을 고려해서 체인 판단 (예: 점심에 단백질 충분히 먹었으면 저녁은 가볍게).
- 단식 진행 중이면 단식 깨면 안 되는지 명시 (예: "지금 14시간차인데 2시간만 더 버티면 목표"). 단식 깨도 OK인 경우와 안 되는 경우를 분명히.
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
- 식이 질문이 들어오면 "식이 코치 탭에서 물어보세요"라고만 답하고 끝.
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

export { computePhase, phaseGuidance }
