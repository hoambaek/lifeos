import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfWeek, endOfWeek, addDays, format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns'

// 루틴 전체 항목 수 (routine page의 ALL_KEYS 길이)
const ROUTINE_TOTAL_ITEMS = 11

// 주간 챌린지: 1개 고정
const WEEKLY_CHALLENGE = {
  key: 'weekly_balanced_life',
  nameKo: '균형 잡힌 한 주',
  descriptionKo: '식단·루틴·운동·기록 평균 40% 이상인 날 5일 달성',
  category: 'balanced',
  targetValue: 5,
  xpReward: 200,
}

// 하루의 4개 영역 달성률 계산
async function calculateDayScore(dateStr: string): Promise<{
  diet: number
  routine: number
  workout: number
  log: number
  average: number
}> {
  const targetDate = new Date(dateStr)
  const dayStart = startOfDay(targetDate)
  const dayEnd = endOfDay(targetDate)

  // 1. 식단: 세 끼 중 기록된 비율
  const dietLog = await prisma.dietLog.findFirst({
    where: { date: { gte: dayStart, lte: dayEnd } },
  })
  let dietScore = 0
  if (dietLog) {
    const meals = [dietLog.breakfastMenu, dietLog.lunchMenu, dietLog.dinnerMenu]
    const filled = meals.filter((m) => m && (m as string).trim()).length
    dietScore = (filled / 3) * 100
  }

  // 2. 루틴: 완료 항목 / 전체 항목
  const routineRecords = await prisma.$queryRawUnsafe<
    Array<{ completedItems: string }>
  >(`SELECT "completedItems" FROM "RoutineLog" WHERE "date" = ?`, dateStr)
  let routineScore = 0
  if (routineRecords && routineRecords.length > 0) {
    const items = JSON.parse(routineRecords[0].completedItems) as string[]
    routineScore = (items.length / ROUTINE_TOTAL_ITEMS) * 100
  }

  // 3. 운동: 운동 완료 여부 (0 or 100)
  const dailyLog = await prisma.dailyLog.findFirst({
    where: { date: { gte: dayStart, lte: dayEnd } },
  })
  const workoutScore = dailyLog?.workoutDone ? 100 : 0

  // 4. 기록: 체중 or 메모 등 기록 여부 (dailyLog 존재 시 100)
  const logScore = dailyLog ? 100 : 0

  const average = (dietScore + routineScore + workoutScore + logScore) / 4

  return { diet: dietScore, routine: routineScore, workout: workoutScore, log: logScore, average }
}

// POST: 새 주간 챌린지 생성
export async function POST(request: Request) {
  try {
    const { forceNew = false } = await request.json()

    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

    // 이미 이번 주 챌린지가 있는지 확인
    const existingChallenges = await prisma.challenge.findMany({
      where: {
        type: 'weekly',
        isActive: true,
        startDate: { gte: weekStart },
        endDate: { lte: addDays(weekEnd, 1) },
      },
    })

    if (existingChallenges.length > 0 && !forceNew) {
      return NextResponse.json({
        message: '이미 활성화된 주간 챌린지가 있습니다',
        challenges: existingChallenges,
      })
    }

    // 기존 챌린지 비활성화
    if (forceNew && existingChallenges.length > 0) {
      await prisma.challenge.updateMany({
        where: { id: { in: existingChallenges.map((c) => c.id) } },
        data: { isActive: false },
      })
    }

    const uniqueKey = `${WEEKLY_CHALLENGE.key}_${format(weekStart, 'yyyy-MM-dd')}`

    const challenge = await prisma.challenge.create({
      data: {
        key: uniqueKey,
        nameKo: WEEKLY_CHALLENGE.nameKo,
        descriptionKo: WEEKLY_CHALLENGE.descriptionKo,
        type: 'weekly',
        category: WEEKLY_CHALLENGE.category,
        targetValue: WEEKLY_CHALLENGE.targetValue,
        xpReward: WEEKLY_CHALLENGE.xpReward,
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

    return NextResponse.json({
      success: true,
      message: '주간 챌린지 생성 완료',
      challenges: [challenge],
    })
  } catch (error) {
    console.error('Challenge creation error:', error)
    return NextResponse.json({ error: 'Failed to create challenges' }, { status: 500 })
  }
}

// GET: 활성화된 챌린지 조회 (실시간 진행 상황 계산)
export async function GET() {
  try {
    const now = new Date()

    let challenges = await prisma.challenge.findMany({
      where: {
        isActive: true,
        endDate: { gte: now },
      },
      include: { userChallenges: true },
      orderBy: { endDate: 'asc' },
    })

    // 챌린지가 없으면 자동 생성
    if (challenges.length === 0) {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
      const uniqueKey = `${WEEKLY_CHALLENGE.key}_${format(weekStart, 'yyyy-MM-dd')}`

      const challenge = await prisma.challenge.create({
        data: {
          key: uniqueKey,
          nameKo: WEEKLY_CHALLENGE.nameKo,
          descriptionKo: WEEKLY_CHALLENGE.descriptionKo,
          type: 'weekly',
          category: WEEKLY_CHALLENGE.category,
          targetValue: WEEKLY_CHALLENGE.targetValue,
          xpReward: WEEKLY_CHALLENGE.xpReward,
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

      challenges = await prisma.challenge.findMany({
        where: { isActive: true, endDate: { gte: now } },
        include: { userChallenges: true },
        orderBy: { endDate: 'asc' },
      })
    }

    // 실시간으로 진행 상황 계산 (balanced 챌린지)
    for (const challenge of challenges) {
      if (challenge.category !== 'balanced') continue
      const userChallenge = challenge.userChallenges[0]
      if (!userChallenge) continue

      const weekStart = new Date(challenge.startDate)
      const today = now < new Date(challenge.endDate) ? now : new Date(challenge.endDate)
      const days = eachDayOfInterval({ start: weekStart, end: today })

      let qualifiedDays = 0
      for (const day of days) {
        const dateStr = format(day, 'yyyy-MM-dd')
        const score = await calculateDayScore(dateStr)
        if (score.average >= 40) {
          qualifiedDays++
        }
      }

      const isCompleted = qualifiedDays >= challenge.targetValue

      if (userChallenge.currentValue !== qualifiedDays || userChallenge.completed !== isCompleted) {
        await prisma.userChallenge.update({
          where: { id: userChallenge.id },
          data: {
            currentValue: qualifiedDays,
            completed: isCompleted,
            completedAt: isCompleted && !userChallenge.completed ? new Date() : userChallenge.completedAt,
          },
        })
      }
    }

    // 업데이트된 데이터 다시 조회
    const updatedChallenges = await prisma.challenge.findMany({
      where: { isActive: true, endDate: { gte: now } },
      include: { userChallenges: true },
      orderBy: { endDate: 'asc' },
    })

    return NextResponse.json({ challenges: updatedChallenges })
  } catch (error) {
    console.error('Challenge GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
  }
}

// PUT: 챌린지 보상 수령 등
export async function PUT(request: Request) {
  try {
    const { challengeId, increment = 1 } = await request.json()

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
