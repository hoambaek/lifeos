import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 스위치온 다이어트 4주 식단 데이터
const WEEK_1_NOTES = JSON.stringify({
  tips: [
    '금단증상(두통, 무력감) 나타날 시 4일차로 바로 넘어가기',
    '첫날부터 운동 병행하면 효과 업',
  ],
  allowed: ['채소', '두부', '요거트'],
  allowedAfterDay4: ['채소', '두부', '플레인요거트', '해조류', '버섯', '달걀', '생선', '닭/돼지/소 살코기'],
})

const WEEK_2_NOTES = JSON.stringify({
  tips: ['24시간 간헐적 단식 주 1회'],
  forbidden: ['설탕', '밀가루', '과일'],
  allowed: ['채소', '두부', '플레인요거트', '해조류', '버섯', '달걀', '생선', '닭/돼지/소 살코기', '콩류', '견과류 한줌'],
})

const WEEK_3_NOTES = JSON.stringify({
  tips: ['24시간 간헐적 단식 주 2회', '연속 단식 X'],
  forbidden: ['설탕', '밀가루', '과일'],
  allowed: [
    '채소', '두부', '플레인요거트', '해조류', '버섯', '달걀', '생선',
    '닭/돼지/소 살코기', '콩류', '견과류', '단호박', '토마토', '베리류 과일',
    '바나나 하루 1개', '고구마 하루 1개', '방울토마토', '저지방 소고기',
  ],
})

const WEEK_4_NOTES = JSON.stringify({
  tips: ['24시간 간헐적 단식 주 3회', '연속 단식 X'],
  forbidden: ['설탕', '밀가루', '과일'],
  allowed: [
    '채소', '두부', '플레인요거트', '해조류', '버섯', '달걀', '생선',
    '닭/돼지/소 살코기', '콩류', '견과류', '단호박', '토마토', '베리류 과일',
    '바나나 하루 1개', '고구마 하루 1개', '방울토마토', '저지방 소고기',
  ],
})

const MAINTENANCE_NOTES = JSON.stringify({
  tips: [
    '16:8 간헐적 단식 유지',
    '주 1-2회 24시간 단식 선택적',
    '탄수화물 점진적 증가 가능',
  ],
  forbidden: ['과도한 설탕', '정제 밀가루'],
  allowed: [
    '모든 채소', '두부', '요거트', '해조류', '버섯', '달걀', '생선',
    '닭/돼지/소 살코기', '콩류', '견과류', '과일 적정량', '현미/통곡물',
  ],
})

// 1주차 식단 (월~일)
const WEEK_1_PLANS = [
  // 월(1), 화(2), 수(3) - 쉐이크 only
  { dayOfWeek: 1, breakfast: '단백질 쉐이크', lunch: '단백질 쉐이크', snack: '단백질 쉐이크', dinner: '단백질 쉐이크', isFastingDay: false },
  { dayOfWeek: 2, breakfast: '단백질 쉐이크', lunch: '단백질 쉐이크', snack: '단백질 쉐이크', dinner: '단백질 쉐이크', isFastingDay: false },
  { dayOfWeek: 3, breakfast: '단백질 쉐이크', lunch: '단백질 쉐이크', snack: '단백질 쉐이크', dinner: '단백질 쉐이크', isFastingDay: false },
  // 목(4)~일(0) - 점심만 밥+채소+단백질
  { dayOfWeek: 4, breakfast: '단백질 쉐이크', lunch: '밥+채소+단백질', snack: '단백질 쉐이크', dinner: '단백질 쉐이크', isFastingDay: false },
  { dayOfWeek: 5, breakfast: '단백질 쉐이크', lunch: '밥+채소+단백질', snack: '단백질 쉐이크', dinner: '단백질 쉐이크', isFastingDay: false },
  { dayOfWeek: 6, breakfast: '단백질 쉐이크', lunch: '밥+채소+단백질', snack: '단백질 쉐이크', dinner: '단백질 쉐이크', isFastingDay: false },
  { dayOfWeek: 0, breakfast: '단백질 쉐이크', lunch: '밥+채소+단백질', snack: '단백질 쉐이크', dinner: '단백질 쉐이크', isFastingDay: false },
]

// 2주차 식단 (단식 1회 - 목요일)
const WEEK_2_PLANS = [
  { dayOfWeek: 1, breakfast: '단백질 쉐이크', lunch: '밥+채소+단백질', snack: '단백질 쉐이크', dinner: '채소+단백질', isFastingDay: false },
  { dayOfWeek: 2, breakfast: '단백질 쉐이크', lunch: '밥+채소+단백질', snack: '단백질 쉐이크', dinner: '채소+단백질', isFastingDay: false },
  { dayOfWeek: 3, breakfast: '단백질 쉐이크', lunch: '밥+채소+단백질', snack: '단백질 쉐이크', dinner: '-', isFastingDay: false },
  { dayOfWeek: 4, breakfast: '-', lunch: '-', snack: '-', dinner: '채소+단백질', isFastingDay: true }, // 단식일
  { dayOfWeek: 5, breakfast: '단백질 쉐이크', lunch: '밥+채소+단백질', snack: '단백질 쉐이크', dinner: '채소+단백질', isFastingDay: false },
  { dayOfWeek: 6, breakfast: '단백질 쉐이크', lunch: '밥+채소+단백질', snack: '단백질 쉐이크', dinner: '채소+단백질', isFastingDay: false },
  { dayOfWeek: 0, breakfast: '단백질 쉐이크', lunch: '밥+채소+단백질', snack: '단백질 쉐이크', dinner: '채소+단백질', isFastingDay: false },
]

// 3주차 식단 (단식 2회 - 화, 목)
const WEEK_3_PLANS = [
  { dayOfWeek: 1, breakfast: '단백질 쉐이크', lunch: '밥+채소+단백질', snack: '단백질 쉐이크', dinner: '-', isFastingDay: false },
  { dayOfWeek: 2, breakfast: '-', lunch: '-', snack: '-', dinner: '채소+단백질', isFastingDay: true }, // 단식일
  { dayOfWeek: 3, breakfast: '단백질 쉐이크', lunch: '밥+채소+단백질', snack: '단백질 쉐이크', dinner: '-', isFastingDay: false },
  { dayOfWeek: 4, breakfast: '-', lunch: '-', snack: '-', dinner: '채소+단백질', isFastingDay: true }, // 단식일
  { dayOfWeek: 5, breakfast: '단백질 쉐이크', lunch: '밥+채소+단백질', snack: '단백질 쉐이크', dinner: '채소+단백질', isFastingDay: false },
  { dayOfWeek: 6, breakfast: '단백질 쉐이크', lunch: '밥+채소+단백질', snack: '단백질 쉐이크', dinner: '채소+단백질', isFastingDay: false },
  { dayOfWeek: 0, breakfast: '단백질 쉐이크', lunch: '밥+채소+단백질', snack: '단백질 쉐이크', dinner: '채소+단백질', isFastingDay: false },
]

// 4주차 식단 (단식 3회 - 화, 목, 토)
const WEEK_4_PLANS = [
  { dayOfWeek: 1, breakfast: '단백질 쉐이크', lunch: '일반식', snack: '단백질 쉐이크', dinner: '-', isFastingDay: false },
  { dayOfWeek: 2, breakfast: '-', lunch: '-', snack: '-', dinner: '밥+채소+단백질', isFastingDay: true }, // 단식일
  { dayOfWeek: 3, breakfast: '단백질 쉐이크', lunch: '일반식', snack: '단백질 쉐이크', dinner: '-', isFastingDay: false },
  { dayOfWeek: 4, breakfast: '-', lunch: '-', snack: '-', dinner: '밥+채소+단백질', isFastingDay: true }, // 단식일
  { dayOfWeek: 5, breakfast: '단백질 쉐이크', lunch: '일반식', snack: '단백질 쉐이크', dinner: '-', isFastingDay: false },
  { dayOfWeek: 6, breakfast: '-', lunch: '-', snack: '-', dinner: '밥+채소+단백질', isFastingDay: true }, // 단식일
  { dayOfWeek: 0, breakfast: '단백질 쉐이크', lunch: '일반식', snack: '단백질 쉐이크', dinner: '밥+채소+단백질', isFastingDay: false },
]

// 유지기 식단 (5주차+) - 16:8 간헐적 단식 + 주 1회 24시간 단식
const MAINTENANCE_PLANS = [
  { dayOfWeek: 1, breakfast: '단백질 쉐이크', lunch: '일반식 (건강한 탄수화물)', snack: '견과류/과일', dinner: '채소+단백질', isFastingDay: false },
  { dayOfWeek: 2, breakfast: '단백질 쉐이크', lunch: '일반식 (건강한 탄수화물)', snack: '견과류/과일', dinner: '채소+단백질', isFastingDay: false },
  { dayOfWeek: 3, breakfast: '-', lunch: '-', snack: '-', dinner: '채소+단백질', isFastingDay: true }, // 선택적 단식일
  { dayOfWeek: 4, breakfast: '단백질 쉐이크', lunch: '일반식 (건강한 탄수화물)', snack: '견과류/과일', dinner: '채소+단백질', isFastingDay: false },
  { dayOfWeek: 5, breakfast: '단백질 쉐이크', lunch: '일반식 (건강한 탄수화물)', snack: '견과류/과일', dinner: '채소+단백질', isFastingDay: false },
  { dayOfWeek: 6, breakfast: '단백질 쉐이크', lunch: '자유식', snack: '견과류/과일', dinner: '자유식', isFastingDay: false },
  { dayOfWeek: 0, breakfast: '단백질 쉐이크', lunch: '자유식', snack: '견과류/과일', dinner: '자유식', isFastingDay: false },
]

// 규칙 데이터
const DIET_RULES = [
  { ruleNumber: 1, title: '아침식사 타이밍', description: '아침식사는 전날 저녁식사를 마친 시간으로부터 14시간 후에 섭취한다.', icon: '⏰' },
  { ruleNumber: 2, title: '저녁식사 마감', description: '저녁식사는 취침 2-4시간 전에 끝낸다.', icon: '🌙' },
  { ruleNumber: 3, title: '수면시간', description: '수면시간은 하루 7-8시간 유지한다.', icon: '😴' },
  { ruleNumber: 4, title: '필수 수면 시간대', description: '자정부터 새벽 4시는 반드시 수면시간에 포함되어야 한다.', icon: '🛏️' },
  { ruleNumber: 5, title: '규칙적인 운동', description: '규칙적인 운동을 시행 (주4회이상/고강도 인터벌운동 15-30분)', icon: '🏃' },
  { ruleNumber: 6, title: '활동적인 생활', description: '오래 앉아있는 것을 피하고 1시간마다 일어나서 가볍게 몸을 움직인다.', icon: '🚶' },
  { ruleNumber: 7, title: '수분 섭취', description: '물은 하루 8컵 이상 충분히 마신다.', icon: '💧' },
  { ruleNumber: 8, title: '금기음식', description: '술, 밀가루, 당류 섭취를 금한다.', icon: '🚫' },
  { ruleNumber: 9, title: '카페인 제한', description: '1주차 카페인 음료 X, 2주차부터 오전 아메리카노 섭취 가능', icon: '☕' },
  { ruleNumber: 10, title: '영양제 섭취', description: '영양제 섭취 (유산균, 비타민 등)', icon: '💊' },
]

// POST: 식단 데이터 시딩
export async function POST() {
  try {
    // 기존 데이터 삭제
    await prisma.dietPlan.deleteMany()
    await prisma.dietRule.deleteMany()

    // 1주차 식단 추가
    for (const plan of WEEK_1_PLANS) {
      await prisma.dietPlan.create({
        data: {
          dayNumber: plan.dayOfWeek === 0 ? 7 : plan.dayOfWeek,
          week: 1,
          dayOfWeek: plan.dayOfWeek,
          breakfast: plan.breakfast,
          lunch: plan.lunch,
          snack: plan.snack,
          dinner: plan.dinner,
          isFastingDay: plan.isFastingDay,
          weekNotes: WEEK_1_NOTES,
        },
      })
    }

    // 2주차 식단 추가
    for (const plan of WEEK_2_PLANS) {
      await prisma.dietPlan.create({
        data: {
          dayNumber: 7 + (plan.dayOfWeek === 0 ? 7 : plan.dayOfWeek),
          week: 2,
          dayOfWeek: plan.dayOfWeek,
          breakfast: plan.breakfast,
          lunch: plan.lunch,
          snack: plan.snack,
          dinner: plan.dinner,
          isFastingDay: plan.isFastingDay,
          weekNotes: WEEK_2_NOTES,
        },
      })
    }

    // 3주차 식단 추가
    for (const plan of WEEK_3_PLANS) {
      await prisma.dietPlan.create({
        data: {
          dayNumber: 14 + (plan.dayOfWeek === 0 ? 7 : plan.dayOfWeek),
          week: 3,
          dayOfWeek: plan.dayOfWeek,
          breakfast: plan.breakfast,
          lunch: plan.lunch,
          snack: plan.snack,
          dinner: plan.dinner,
          isFastingDay: plan.isFastingDay,
          weekNotes: WEEK_3_NOTES,
        },
      })
    }

    // 4주차 식단 추가
    for (const plan of WEEK_4_PLANS) {
      await prisma.dietPlan.create({
        data: {
          dayNumber: 21 + (plan.dayOfWeek === 0 ? 7 : plan.dayOfWeek),
          week: 4,
          dayOfWeek: plan.dayOfWeek,
          breakfast: plan.breakfast,
          lunch: plan.lunch,
          snack: plan.snack,
          dinner: plan.dinner,
          isFastingDay: plan.isFastingDay,
          weekNotes: WEEK_4_NOTES,
        },
      })
    }

    // 유지기 식단 추가 (5주차)
    for (const plan of MAINTENANCE_PLANS) {
      await prisma.dietPlan.create({
        data: {
          dayNumber: 28 + (plan.dayOfWeek === 0 ? 7 : plan.dayOfWeek),
          week: 5,
          dayOfWeek: plan.dayOfWeek,
          breakfast: plan.breakfast,
          lunch: plan.lunch,
          snack: plan.snack,
          dinner: plan.dinner,
          isFastingDay: plan.isFastingDay,
          weekNotes: MAINTENANCE_NOTES,
        },
      })
    }

    // 규칙 추가
    for (const rule of DIET_RULES) {
      await prisma.dietRule.create({
        data: rule,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Diet data seeded successfully',
      counts: {
        week1: WEEK_1_PLANS.length,
        week2: WEEK_2_PLANS.length,
        week3: WEEK_3_PLANS.length,
        week4: WEEK_4_PLANS.length,
        maintenance: MAINTENANCE_PLANS.length,
        rules: DIET_RULES.length,
      },
    })
  } catch (error) {
    console.error('Failed to seed diet data:', error)
    return NextResponse.json({ error: 'Failed to seed diet data' }, { status: 500 })
  }
}
