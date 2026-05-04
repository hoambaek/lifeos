// 스위치온 다이어트 공식 프로그램 가이드
// 출처: by, keeae_ 스위치온 다이어트 프로그램 PDF (1주~4주이후 유지기)
// 데이터는 시작일 기준 N일차 (요일 무관) — 7일 사이클로 반복

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner'
export type SlotType = 'shake' | 'meal' | 'fasting' | 'free'

export interface MealSlot {
  type: SlotType
  label: string
  hint?: string
}

export interface DailyGuide {
  breakfast: MealSlot
  lunch: MealSlot
  snack: MealSlot
  dinner: MealSlot
  isFullFastDay: boolean // 종일 단식
}

const SHAKE: MealSlot = { type: 'shake', label: '단백질 쉐이크' }
const FAST: MealSlot = { type: 'fasting', label: '단식' }
const RICE_HALF: MealSlot = { type: 'meal', label: '현미식 식사', hint: '1/2공기' }
const NO_CARB: MealSlot = { type: 'meal', label: '탄수화물 없는 식사', hint: '양껏' }
const FREE: MealSlot = { type: 'free', label: '금기식품 허용', hint: '주말 휴식' }

// 1주차 (장 해독·생체리듬 → 렙틴 저항성 개선)
const WEEK_1: DailyGuide[] = [
  { breakfast: SHAKE, lunch: SHAKE, snack: SHAKE, dinner: SHAKE, isFullFastDay: false }, // 1일
  { breakfast: SHAKE, lunch: SHAKE, snack: SHAKE, dinner: SHAKE, isFullFastDay: false }, // 2일
  { breakfast: SHAKE, lunch: SHAKE, snack: SHAKE, dinner: SHAKE, isFullFastDay: false }, // 3일
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: SHAKE, isFullFastDay: false }, // 4일
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: SHAKE, isFullFastDay: false }, // 5일
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: SHAKE, isFullFastDay: false }, // 6일
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: SHAKE, isFullFastDay: false }, // 7일
]

// 2주차 (인슐린 저항성 개선, 단식 1회 — 2일차)
const WEEK_2: DailyGuide[] = [
  { breakfast: SHAKE, lunch: RICE_HALF, snack: FAST, dinner: FAST, isFullFastDay: false }, // 1일
  { breakfast: FAST, lunch: FAST, snack: FAST, dinner: FAST, isFullFastDay: true }, // 2일 (24h 단식)
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: NO_CARB, isFullFastDay: false }, // 3일
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: NO_CARB, isFullFastDay: false }, // 4일
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: NO_CARB, isFullFastDay: false }, // 5일
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: NO_CARB, isFullFastDay: false }, // 6일
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: NO_CARB, isFullFastDay: false }, // 7일
]

// 3주차 (체지방 감량 극대화, 단식 2회 — 2·6일차)
const WEEK_3: DailyGuide[] = [
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: FAST, isFullFastDay: false }, // 1일
  { breakfast: FAST, lunch: FAST, snack: FAST, dinner: FAST, isFullFastDay: true }, // 2일 (24h 단식)
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: NO_CARB, isFullFastDay: false }, // 3일
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: NO_CARB, isFullFastDay: false }, // 4일
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: FAST, isFullFastDay: false }, // 5일
  { breakfast: FAST, lunch: FAST, snack: FAST, dinner: FAST, isFullFastDay: true }, // 6일 (24h 단식)
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: NO_CARB, isFullFastDay: false }, // 7일
]

// 4주차 (체지방 감량 극대화, 단식 3회 — 2·4·6일차)
const WEEK_4: DailyGuide[] = [
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: FAST, isFullFastDay: false }, // 1일
  { breakfast: FAST, lunch: FAST, snack: FAST, dinner: FAST, isFullFastDay: true }, // 2일 (24h 단식)
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: FAST, isFullFastDay: false }, // 3일
  { breakfast: FAST, lunch: FAST, snack: FAST, dinner: FAST, isFullFastDay: true }, // 4일 (24h 단식)
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: FAST, isFullFastDay: false }, // 5일
  { breakfast: FAST, lunch: FAST, snack: FAST, dinner: FAST, isFullFastDay: true }, // 6일 (24h 단식)
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: NO_CARB, isFullFastDay: false }, // 7일
]

// 유지기 (회복기 — 기초대사량 회복, 단식 2회 — 2·5일차, 7일차 휴식)
const MAINTENANCE: DailyGuide[] = [
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: FAST, isFullFastDay: false }, // 1일
  { breakfast: FAST, lunch: FAST, snack: FAST, dinner: FAST, isFullFastDay: true }, // 2일 (24h 단식)
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: RICE_HALF, isFullFastDay: false }, // 3일
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: FAST, isFullFastDay: false }, // 4일
  { breakfast: FAST, lunch: FAST, snack: FAST, dinner: FAST, isFullFastDay: true }, // 5일 (24h 단식)
  { breakfast: SHAKE, lunch: RICE_HALF, snack: SHAKE, dinner: RICE_HALF, isFullFastDay: false }, // 6일
  { breakfast: SHAKE, lunch: FREE, snack: SHAKE, dinner: FREE, isFullFastDay: false }, // 7일 (휴식일)
]

const WEEK_PLANS: Record<number, DailyGuide[]> = {
  1: WEEK_1,
  2: WEEK_2,
  3: WEEK_3,
  4: WEEK_4,
  5: MAINTENANCE,
}

export interface WeekMeta {
  week: number
  title: string
  goal: string
  summary: string // 2-3줄 요약 — 끼니 패턴·단식·핵심 룰
  fastingDays: number[] // dayInWeek (1~7), 종일 단식
  notes: string[]
}

export const WEEK_META: Record<number, WeekMeta> = {
  1: {
    week: 1,
    title: '1주차',
    goal: '장 해독·생체리듬 + 렙틴 저항성 개선',
    summary: '4끼 단백질 쉐이크로 장을 쉬게 하고 지방 대사 스위치를 켭니다. 1-3일은 쉐이크만, 4-7일은 점심 한 끼만 현미식 1/2공기로 풀어줍니다. 공복 12시간 (저녁 8시 이후 금식) + 단백질 몸무게 × 1~1.2g 필수.',
    fastingDays: [],
    notes: [
      '1-3일차: 4끼 모두 단백질 쉐이크 (탄수화물 50g/일 미만)',
      '4-7일차: 점심 1끼만 현미식 1/2공기 + 단백질·채소',
      '공복 12시간 이상 (저녁 8시 ~ 다음날 아침 8시까지 금식)',
      '단백질 섭취량: 본인 몸무게 × 1~1.2g',
      '카페인 금지 (블랙커피는 2주차부터 1잔 허용)',
    ],
  },
  2: {
    week: 2,
    title: '2주차',
    goal: '인슐린 저항성 개선',
    summary: '주 1회 24시간 단식 도입 (2일차 종일). 저녁은 탄수화물 없는 식사 양껏 (단백질·채소 위주). 블랙커피 오전 1잔, 견과류 한 줌 간식 허용. 단식 후엔 단백질·야채 양껏 회복식.',
    fastingDays: [2],
    notes: [
      '주 1회 24시간 단식 (2일차)',
      '저녁은 탄수화물 없는 식사 양껏 (단백질·채소 위주)',
      '오후 간식으로 견과류 1줌 가능',
      '블랙커피 오전 중 1잔 허용',
      '24시간 단식 후 단백질·야채류 양껏 먹기',
    ],
  },
  3: {
    week: 3,
    title: '3주차',
    goal: '체지방 감량 극대화',
    summary: '주 2회 24시간 단식 (2·6일차) — 절대 연속 X. 단호박·토마토·흰쌀밥 소량·바나나/고구마(고강도 운동일) 허용. 단식 후 고단백 식사로 근손실 방지. 효과 정체 시 2주차 반복.',
    fastingDays: [2, 6],
    notes: [
      '주 2회 24시간 단식 (2일차, 6일차) — 연속 단식 X',
      '단식 후 반드시 고단백 식사로 근손실 방지',
      '소량의 자연 당분 허용 (단호박, 토마토, 흰쌀밥 소량)',
      '바나나·고구마는 고강도 운동 한 날에만',
      '⚠️ 2주차와 비교해 근육량 회복 안 되고 지방량 안 줄면 2주차 반복',
    ],
  },
  4: {
    week: 4,
    title: '4주차',
    goal: '체지방 감량 극대화',
    summary: '주 3회 24시간 단식 (2·4·6일차) — 격일 단식 패턴. 단식 사이 회복 식사 철저히 (단백질·야채 양껏). 정체기 오면 무리 X — 유지식으로 회복 후 재시작.',
    fastingDays: [2, 4, 6],
    notes: [
      '주 3회 24시간 단식 (2·4·6일차) — 연속 단식 X',
      '단식일 사이 회복 식사 철저히 (단백질·야채 양껏)',
      '⚠️ 정체기 오면 무리하지 말고 유지식으로 갔다가 회복 후 재시작',
    ],
  },
  5: {
    week: 5,
    title: '유지기',
    goal: '회복기 — 기초대사량 회복',
    summary: '주 1~2회 단식 (2·5일차) 유지로 감량 체중 보존. 7일차 점심·저녁은 다이어트 휴식일 (금기식품 허용). 과일 1~2개/일 추가 허용. 수면 6시간+, 공복 12시간, 저녁은 취침 3시간 전 종료.',
    fastingDays: [2, 5],
    notes: [
      '주 1~2일 간헐적 단식으로 감량 체중 유지 (2·5일차)',
      '7일차 점심·저녁은 금기식품 허용 (다이어트 휴식일)',
      '과일 섭취 허용 (하루 1~2개)',
      '수면 6시간 이상, 공복 12시간 유지',
      '저녁식사는 취침 3시간 전에 끝내기',
      '30분에 한 번씩 일어나 몸 움직이기',
      '매끼 단백질 충분히 섭취',
    ],
  },
}

// 허용 식품 — 주차별 누적 (이전 주차 식품도 모두 허용)
const ALLOWED_W1A = [
  '플레인요거트(무가당)', '그릭요거트', '두부', '연두부',
  '양배추', '무', '당근', '오이', '브로콜리',
  '코코넛오일', '올리브오일', '냉압착 들기름',
  '양파', '마늘', '고춧가루', '식초', '후추', '강황', '허브',
  '녹차', '허브티',
]
const ALLOWED_W1B = [
  '생선', '회', '굴', '조개', '새우', '게', '오징어', '낙지', '문어',
  '닭고기(껍질X)', '수육', '달걀',
  '미역', '다시마', '톳', '버섯류',
  '와사비', '저염간장',
]
const ALLOWED_W2 = [
  '아보카도', '잡곡밥', '현미밥', '퀴노아',
  '콩류', '견과류 1줌', '블랙커피(오전 1잔)',
]
const ALLOWED_W3 = [
  '단호박', '토마토', '방울토마토',
  '소고기(지방적은부위)', '돼지고기(지방적은부위)',
  '흰쌀밥(소량)', '바나나(운동일)', '고구마(운동일)',
]
const ALLOWED_MAINT = [
  '과일 1~2개/일',
]

export function allowedFoodsByWeek(week: number, dayInWeek: number): string[] {
  if (week === 1 && dayInWeek <= 3) return ALLOWED_W1A
  if (week === 1) return [...ALLOWED_W1A, ...ALLOWED_W1B]
  if (week === 2) return [...ALLOWED_W1A, ...ALLOWED_W1B, ...ALLOWED_W2]
  if (week === 3 || week === 4) return [...ALLOWED_W1A, ...ALLOWED_W1B, ...ALLOWED_W2, ...ALLOWED_W3]
  // 유지기
  return [...ALLOWED_W1A, ...ALLOWED_W1B, ...ALLOWED_W2, ...ALLOWED_W3, ...ALLOWED_MAINT]
}

// 금지 식품 (모든 주차 공통)
export const FORBIDDEN_FOODS: { category: string; items: string[] }[] = [
  { category: '술', items: ['모든 주류 (한 모금도 X)'] },
  { category: '설탕류', items: ['정백당', '액상과당'] },
  { category: '단 음료·간식', items: ['청량음료', '커피믹스', '과자', '사탕', '도넛', '아이스크림', '주스', '당분 첨가 우유·두유'] },
  { category: '트랜스지방', items: ['라면', '냉동피자', '전자렌지 팝콘', '튀김 요리'] },
  { category: '밀가루', items: ['빵', '케이크', '국수', '파스타', '라면', '자장면', '우동'] },
  { category: '카페인', items: ['커피·카페인 음료 (2주차부터 블랙커피 1잔만)'] },
  { category: '포화지방', items: ['삼겹살', '갈비', '곱창'] },
  { category: '짠 음식', items: ['소금', '양념장', '젓갈류', '찌개·국 국물'] },
]

// 주차/일차 계산 (시작일 기준 N일차)
export function computeWeekAndDay(
  startDate: Date,
  target: Date,
): { week: number; dayInWeek: number; totalDay: number } {
  const dayMs = 24 * 60 * 60 * 1000
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const t = new Date(target)
  t.setHours(0, 0, 0, 0)
  const diff = Math.floor((t.getTime() - start.getTime()) / dayMs)
  const totalDay = diff + 1
  const dayInWeek = ((diff % 7) + 7) % 7 + 1 // 1~7
  const week = Math.min(Math.floor(diff / 7) + 1, 5) // 5주차+ = 유지기
  return { week, dayInWeek, totalDay }
}

export function getDailyGuide(week: number, dayInWeek: number): DailyGuide | null {
  const plan = WEEK_PLANS[Math.min(week, 5)]
  if (!plan) return null
  return plan[dayInWeek - 1] ?? null
}
