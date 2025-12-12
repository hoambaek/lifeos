import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfWeek, endOfWeek, addDays, startOfMonth, endOfMonth } from 'date-fns'

// 주간 챌린지 템플릿
const WEEKLY_CHALLENGE_TEMPLATES = [
  {
    key: 'weekly_workout_5',
    nameKo: '이번 주 5회 운동',
    descriptionKo: '일주일 동안 5번 운동을 완료하세요',
    category: 'workout',
    targetValue: 5,
    xpReward: 150,
  },
  {
    key: 'weekly_workout_7',
    nameKo: '완벽한 운동 주간',
    descriptionKo: '일주일 동안 매일 운동을 완료하세요',
    category: 'workout',
    targetValue: 7,
    xpReward: 300,
  },
  {
    key: 'weekly_perfect_3',
    nameKo: '완벽한 3일',
    descriptionKo: '3일 동안 모든 퀘스트를 완료하세요',
    category: 'mixed',
    targetValue: 3,
    xpReward: 200,
  },
  {
    key: 'weekly_water_5',
    nameKo: '물 마시기 마스터',
    descriptionKo: '일주일 동안 5번 물 3L를 달성하세요',
    category: 'quest',
    targetValue: 5,
    xpReward: 100,
  },
  {
    key: 'weekly_protein_5',
    nameKo: '단백질 챔피언',
    descriptionKo: '일주일 동안 5번 단백질 150g을 달성하세요',
    category: 'quest',
    targetValue: 5,
    xpReward: 120,
  },
  {
    key: 'weekly_leg_2',
    nameKo: '하체 집중 주간',
    descriptionKo: '이번 주 하체 운동을 2회 이상 완료하세요',
    category: 'workout',
    targetValue: 2,
    xpReward: 100,
  },
  {
    key: 'weekly_back_2',
    nameKo: '등 강화 주간',
    descriptionKo: '이번 주 등 운동을 2회 이상 완료하세요',
    category: 'workout',
    targetValue: 2,
    xpReward: 100,
  },
  {
    key: 'weekly_chest_2',
    nameKo: '가슴 강화 주간',
    descriptionKo: '이번 주 가슴 운동을 2회 이상 완료하세요',
    category: 'workout',
    targetValue: 2,
    xpReward: 100,
  },
  {
    key: 'weekly_clean_diet_5',
    nameKo: '클린 이터',
    descriptionKo: '일주일 동안 5번 클린다이어트를 유지하세요',
    category: 'quest',
    targetValue: 5,
    xpReward: 100,
  },
]

// 월간 챌린지 템플릿
const MONTHLY_CHALLENGE_TEMPLATES = [
  {
    key: 'monthly_workout_20',
    nameKo: '이번 달 20회 운동',
    descriptionKo: '한 달 동안 20번 운동을 완료하세요',
    category: 'workout',
    targetValue: 20,
    xpReward: 500,
  },
  {
    key: 'monthly_perfect_10',
    nameKo: '완벽한 10일',
    descriptionKo: '한 달 동안 10일 모든 퀘스트를 완료하세요',
    category: 'mixed',
    targetValue: 10,
    xpReward: 600,
  },
  {
    key: 'monthly_streak_14',
    nameKo: '2주 연속 운동',
    descriptionKo: '14일 연속으로 운동하세요',
    category: 'streak',
    targetValue: 14,
    xpReward: 400,
  },
]

// 랜덤 선택 헬퍼
function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// POST: 새 주간/월간 챌린지 생성
export async function POST(request: Request) {
  try {
    const { type = 'weekly', forceNew = false } = await request.json()

    const now = new Date()
    let startDate: Date
    let endDate: Date
    let templates: typeof WEEKLY_CHALLENGE_TEMPLATES
    let challengeCount: number

    if (type === 'weekly') {
      startDate = startOfWeek(now, { weekStartsOn: 1 }) // 월요일 시작
      endDate = endOfWeek(now, { weekStartsOn: 1 })
      templates = WEEKLY_CHALLENGE_TEMPLATES
      challengeCount = 3 // 주간 챌린지 3개
    } else {
      startDate = startOfMonth(now)
      endDate = endOfMonth(now)
      templates = MONTHLY_CHALLENGE_TEMPLATES
      challengeCount = 2 // 월간 챌린지 2개
    }

    // 이미 이번 주/월 챌린지가 있는지 확인
    const existingChallenges = await prisma.challenge.findMany({
      where: {
        type,
        isActive: true,
        startDate: { gte: startDate },
        endDate: { lte: addDays(endDate, 1) },
      },
    })

    if (existingChallenges.length > 0 && !forceNew) {
      return NextResponse.json({
        message: `이미 활성화된 ${type === 'weekly' ? '주간' : '월간'} 챌린지가 있습니다`,
        challenges: existingChallenges,
      })
    }

    // 기존 챌린지 비활성화 (forceNew인 경우)
    if (forceNew && existingChallenges.length > 0) {
      await prisma.challenge.updateMany({
        where: {
          id: { in: existingChallenges.map((c) => c.id) },
        },
        data: { isActive: false },
      })
    }

    // 랜덤하게 챌린지 선택
    const selectedTemplates = pickRandom(templates, challengeCount)

    // 챌린지 생성
    const createdChallenges = []
    for (const template of selectedTemplates) {
      const uniqueKey = `${template.key}_${startDate.toISOString().split('T')[0]}`

      const challenge = await prisma.challenge.create({
        data: {
          key: uniqueKey,
          nameKo: template.nameKo,
          descriptionKo: template.descriptionKo,
          type,
          category: template.category,
          targetValue: template.targetValue,
          xpReward: template.xpReward,
          startDate,
          endDate,
          isActive: true,
        },
      })

      // 사용자 챌린지 진행 상황 자동 생성
      await prisma.userChallenge.create({
        data: {
          challengeId: challenge.id,
          currentValue: 0,
          completed: false,
          claimed: false,
        },
      })

      createdChallenges.push(challenge)
    }

    return NextResponse.json({
      success: true,
      message: `${type === 'weekly' ? '주간' : '월간'} 챌린지 ${challengeCount}개 생성 완료`,
      challenges: createdChallenges,
    })
  } catch (error) {
    console.error('Challenge creation error:', error)
    return NextResponse.json({ error: 'Failed to create challenges' }, { status: 500 })
  }
}

// GET: 활성화된 챌린지 조회
export async function GET() {
  try {
    const now = new Date()

    // 활성화된 챌린지 조회
    const challenges = await prisma.challenge.findMany({
      where: {
        isActive: true,
        endDate: { gte: now },
      },
      include: {
        userChallenges: true,
      },
      orderBy: { endDate: 'asc' },
    })

    // 챌린지가 없으면 자동 생성
    if (challenges.length === 0) {
      // 주간 챌린지 생성 시도
      const weekStart = startOfWeek(now, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

      const selectedWeekly = pickRandom(WEEKLY_CHALLENGE_TEMPLATES, 3)

      for (const template of selectedWeekly) {
        const uniqueKey = `${template.key}_${weekStart.toISOString().split('T')[0]}`

        const challenge = await prisma.challenge.create({
          data: {
            key: uniqueKey,
            nameKo: template.nameKo,
            descriptionKo: template.descriptionKo,
            type: 'weekly',
            category: template.category,
            targetValue: template.targetValue,
            xpReward: template.xpReward,
            startDate: weekStart,
            endDate: weekEnd,
            isActive: true,
          },
        })

        await prisma.userChallenge.create({
          data: {
            challengeId: challenge.id,
            currentValue: 0,
            completed: false,
            claimed: false,
          },
        })
      }

      // 다시 조회
      const newChallenges = await prisma.challenge.findMany({
        where: {
          isActive: true,
          endDate: { gte: now },
        },
        include: {
          userChallenges: true,
        },
        orderBy: { endDate: 'asc' },
      })

      return NextResponse.json({
        challenges: newChallenges,
        autoCreated: true,
      })
    }

    return NextResponse.json({ challenges })
  } catch (error) {
    console.error('Challenge GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
  }
}

// PUT: 챌린지 진행 상황 업데이트
export async function PUT(request: Request) {
  try {
    const { challengeId, increment = 1 } = await request.json()

    // 사용자 챌린지 조회
    const userChallenge = await prisma.userChallenge.findFirst({
      where: { challengeId },
      include: { challenge: true },
    })

    if (!userChallenge) {
      return NextResponse.json({ error: 'User challenge not found' }, { status: 404 })
    }

    if (userChallenge.completed) {
      return NextResponse.json({
        message: 'Challenge already completed',
        userChallenge,
      })
    }

    const newValue = userChallenge.currentValue + increment
    const isCompleted = newValue >= userChallenge.challenge.targetValue

    const updated = await prisma.userChallenge.update({
      where: { id: userChallenge.id },
      data: {
        currentValue: newValue,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      include: { challenge: true },
    })

    return NextResponse.json({
      success: true,
      userChallenge: updated,
      justCompleted: isCompleted && !userChallenge.completed,
    })
  } catch (error) {
    console.error('Challenge PUT error:', error)
    return NextResponse.json({ error: 'Failed to update challenge' }, { status: 500 })
  }
}
