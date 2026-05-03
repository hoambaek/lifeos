import { differenceInCalendarDays } from 'date-fns'

export type DietPhase =
  | { kind: 'booster'; week: 1 | 2 | 3 | 4; dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7; code: string; label: string }
  | { kind: 'maintenance'; code: 'maintenance'; label: string }
  | { kind: 'luxury_exception'; code: 'luxury_exception'; label: string }

export function computePhase(args: {
  date: Date
  boosterStartDate: Date | null
  luxuryStart: Date | null
  luxuryEnd: Date | null
}): DietPhase {
  const { date, boosterStartDate, luxuryStart, luxuryEnd } = args

  if (luxuryStart && luxuryEnd && date >= luxuryStart && date <= luxuryEnd) {
    return { kind: 'luxury_exception', code: 'luxury_exception', label: '럭셔리 분기 (트래킹 일시정지)' }
  }

  if (boosterStartDate) {
    const dayIndex = differenceInCalendarDays(date, boosterStartDate)
    if (dayIndex >= 0 && dayIndex < 28) {
      const week = (Math.floor(dayIndex / 7) + 1) as 1 | 2 | 3 | 4
      const dayOfWeek = ((dayIndex % 7) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7
      const code = `booster_w${week}d${dayOfWeek}`
      const label = `부스터 ${week}주차 ${dayOfWeek}일차`
      return { kind: 'booster', week, dayOfWeek, code, label }
    }
  }

  return { kind: 'maintenance', code: 'maintenance', label: '유지기' }
}

export function phaseGuidance(phase: DietPhase): string {
  if (phase.kind === 'luxury_exception') {
    return '럭셔리 분기 — 자유 (분기 1회 예외 기간). 다음 분기 부스터 진입 일정은 미리 잡아둘 것.'
  }
  if (phase.kind === 'maintenance') {
    return [
      '유지기 식단 룰:',
      '- 매일 14:10 간헐적 단식 (식사창 12-20시 권장)',
      '- 주 1-2회 24h 단식 (예: 화·금 저녁→다음날 저녁)',
      '- 단백질 체중 1kg당 1.2-1.5g',
      '- 물 2L 이상, 수면 6h 이상 (자정-4시 포함)',
      '- 정제 탄수화물·당류 최소화, 자연식 채소·해조류 충분히',
    ].join('\n')
  }
  // booster
  const w = phase.week
  if (w === 1 && phase.dayOfWeek <= 3) {
    return '부스터 W1 D1-3 (장 휴식기): 단백질 쉐이크 4회/일 + 녹황색 채소·두부만 허용. 14h 이상 단식.'
  }
  if (w === 1) {
    return '부스터 W1 D4-7: 단백질 쉐이크 3회 + 점심 잡곡밥 반공기. 14h 단식.'
  }
  if (w === 2) {
    return '부스터 W2: 단백질 쉐이크 2회 + 일반식 2끼. 주 1회 24h 단식. 블랙커피 1잔 허용.'
  }
  if (w === 3) {
    return '부스터 W3: 자연당(바나나·고구마·베리) 추가 허용. 주 2회 24h 단식 (연속 금지).'
  }
  return '부스터 W4: 모든 과일 1개/일 허용. 주 3회 24h 단식 (단식일 사이 일반식 필수).'
}
