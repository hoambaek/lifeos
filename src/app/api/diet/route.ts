import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfDay, endOfDay, differenceInDays, addDays } from 'date-fns'

// 식단 챌린지 진행 상황 업데이트 헬퍼
async function updateDietChallenge() {
  try {
    const now = new Date()
    const activeChallenges = await prisma.challenge.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: { userChallenges: true },
    })

    for (const challenge of activeChallenges) {
      const userChallenge = challenge.userChallenges[0]
      if (!userChallenge || userChallenge.completed) continue

      const key = challenge.key.toLowerCase()
      if (key.includes('diet_log') || (challenge.category === 'diet')) {
        const newValue = userChallenge.currentValue + 1
        const isCompleted = newValue >= challenge.targetValue

        await prisma.userChallenge.update({
          where: { id: userChallenge.id },
          data: {
            currentValue: newValue,
            completed: isCompleted,
            completedAt: isCompleted ? new Date() : null,
          },
        })
      }
    }
  } catch (error) {
    console.error('Failed to update diet challenge:', error)
  }
}

// GET: 식단 정보 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // config, plan, log, rules
    const dateParam = searchParams.get('date')

    // 식단 설정 조회
    if (type === 'config') {
      const config = await prisma.dietConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(config)
    }

    // 규칙 조회
    if (type === 'rules') {
      const rules = await prisma.dietRule.findMany({
        where: { isActive: true },
        orderBy: { ruleNumber: 'asc' },
      })
      return NextResponse.json(rules)
    }

    // 오늘의 식단 계획 조회
    if (type === 'today' || !type) {
      const config = await prisma.dietConfig.findFirst({
        where: { isActive: true },
      })

      if (!config) {
        return NextResponse.json({ error: 'Diet not started' }, { status: 404 })
      }

      const today = new Date()
      const dayNumber = differenceInDays(today, new Date(config.startDate)) + 1
      const week = Math.min(Math.ceil(dayNumber / 7), 5) // 최대 5주 (유지기)
      const dayOfWeek = today.getDay() // 0=일, 1=월 ...

      // 4주 이후면 유지기 패턴 사용
      const planWeek = week > 4 ? 5 : week

      const plan = await prisma.dietPlan.findFirst({
        where: {
          week: planWeek,
          dayOfWeek: dayOfWeek,
        },
      })

      // 오늘의 식단 로그
      const log = await prisma.dietLog.findFirst({
        where: {
          date: {
            gte: startOfDay(today),
            lte: endOfDay(today),
          },
        },
      })

      return NextResponse.json({
        config,
        plan,
        log,
        dayNumber,
        week,
        dayOfWeek,
      })
    }

    // 특정 날짜 식단 조회
    if (type === 'date' && dateParam) {
      const targetDate = new Date(dateParam)
      const config = await prisma.dietConfig.findFirst({
        where: { isActive: true },
      })

      if (!config) {
        return NextResponse.json({ error: 'Diet not started' }, { status: 404 })
      }

      const dayNumber = differenceInDays(targetDate, new Date(config.startDate)) + 1
      const week = Math.min(Math.ceil(dayNumber / 7), 5)
      const dayOfWeek = targetDate.getDay()

      const planWeek = week > 4 ? 5 : week

      const plan = await prisma.dietPlan.findFirst({
        where: {
          week: planWeek,
          dayOfWeek: dayOfWeek,
        },
      })

      const log = await prisma.dietLog.findFirst({
        where: {
          date: {
            gte: startOfDay(targetDate),
            lte: endOfDay(targetDate),
          },
        },
      })

      return NextResponse.json({
        config,
        plan,
        log,
        dayNumber,
        week,
        dayOfWeek,
      })
    }

    // 주간 식단 계획 조회
    if (type === 'week') {
      const weekParam = searchParams.get('week')
      const week = weekParam ? parseInt(weekParam) : 1

      const plans = await prisma.dietPlan.findMany({
        where: { week },
        orderBy: { dayOfWeek: 'asc' },
      })

      return NextResponse.json(plans)
    }

    // 자주 먹는 메뉴 상위 5개 조회
    if (type === 'frequent-meals') {
      const mealType = searchParams.get('meal') as 'breakfast' | 'lunch' | 'dinner'
      if (!mealType || !['breakfast', 'lunch', 'dinner'].includes(mealType)) {
        return NextResponse.json({ error: 'Invalid meal type' }, { status: 400 })
      }

      const fieldMap = {
        breakfast: 'breakfastMenu',
        lunch: 'lunchMenu',
        dinner: 'dinnerMenu',
      }
      const field = fieldMap[mealType]

      // Raw query로 빈도순 상위 5개 조회
      const results = await prisma.$queryRawUnsafe(
        `SELECT ${field} as menu, COUNT(*) as cnt FROM DietLog WHERE ${field} IS NOT NULL AND ${field} != '' GROUP BY ${field} ORDER BY cnt DESC LIMIT 5`
      ) as Array<{ menu: string; cnt: number }>

      return NextResponse.json(results.map(r => r.menu))
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Failed to fetch diet:', error)
    return NextResponse.json({ error: 'Failed to fetch diet' }, { status: 500 })
  }
}

// POST: 식단 설정 또는 로그 생성/수정
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, ...data } = body

    // 다이어트 시작
    if (type === 'start') {
      const startDate = data.startDate ? new Date(data.startDate) : new Date()

      // 기존 활성 설정 비활성화
      await prisma.dietConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })

      // 새 설정 생성
      const config = await prisma.dietConfig.create({
        data: {
          startDate: startOfDay(startDate),
          currentWeek: 1,
          currentPhase: 'fat_burning',
          isActive: true,
        },
      })

      return NextResponse.json(config)
    }

    // 식단 로그 업데이트
    if (type === 'log') {
      const targetDate = data.date ? new Date(data.date) : new Date()
      const dayStart = startOfDay(targetDate)
      const dayEnd = endOfDay(targetDate)

      const config = await prisma.dietConfig.findFirst({
        where: { isActive: true },
      })

      const dayNumber = config
        ? differenceInDays(targetDate, new Date(config.startDate)) + 1
        : 1
      const week = config
        ? Math.min(Math.ceil(dayNumber / 7), 5)
        : 1

      const existingLog = await prisma.dietLog.findFirst({
        where: {
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      })

      if (existingLog) {
        const updated = await prisma.dietLog.update({
          where: { id: existingLog.id },
          data: {
            breakfastMenu: data.breakfastMenu !== undefined ? data.breakfastMenu : existingLog.breakfastMenu,
            lunchMenu: data.lunchMenu !== undefined ? data.lunchMenu : existingLog.lunchMenu,
            dinnerMenu: data.dinnerMenu !== undefined ? data.dinnerMenu : existingLog.dinnerMenu,
            breakfastDone: data.breakfastDone ?? existingLog.breakfastDone,
            lunchDone: data.lunchDone ?? existingLog.lunchDone,
            snackDone: data.snackDone ?? existingLog.snackDone,
            dinnerDone: data.dinnerDone ?? existingLog.dinnerDone,
            fastingComplete: data.fastingComplete ?? existingLog.fastingComplete,
            sleepHours: data.sleepHours ?? existingLog.sleepHours,
            waterCups: data.waterCups ?? existingLog.waterCups,
            exerciseDone: data.exerciseDone ?? existingLog.exerciseDone,
            noAlcohol: data.noAlcohol ?? existingLog.noAlcohol,
            noFlour: data.noFlour ?? existingLog.noFlour,
            noSugar: data.noSugar ?? existingLog.noSugar,
            memo: data.memo ?? existingLog.memo,
          },
        })

        // 세 끼 모두 기록 시 챌린지 업데이트
        const bm = updated.breakfastMenu as string | null
        const lm = updated.lunchMenu as string | null
        const dm = updated.dinnerMenu as string | null
        const allMealsLogged = bm?.trim() && lm?.trim() && dm?.trim()
        const wasPreviouslyComplete = existingLog.breakfastMenu?.trim() && existingLog.lunchMenu?.trim() && existingLog.dinnerMenu?.trim()

        if (allMealsLogged && !wasPreviouslyComplete) {
          await updateDietChallenge()
        }

        return NextResponse.json(updated)
      }

      const log = await prisma.dietLog.create({
        data: {
          date: dayStart,
          dayNumber,
          week,
          breakfastMenu: data.breakfastMenu ?? null,
          lunchMenu: data.lunchMenu ?? null,
          dinnerMenu: data.dinnerMenu ?? null,
          breakfastDone: data.breakfastDone ?? false,
          lunchDone: data.lunchDone ?? false,
          snackDone: data.snackDone ?? false,
          dinnerDone: data.dinnerDone ?? false,
          fastingComplete: data.fastingComplete ?? false,
          sleepHours: data.sleepHours,
          waterCups: data.waterCups ?? 0,
          exerciseDone: data.exerciseDone ?? false,
          noAlcohol: data.noAlcohol ?? true,
          noFlour: data.noFlour ?? true,
          noSugar: data.noSugar ?? true,
          memo: data.memo,
        },
      })

      // 세 끼 모두 기록 시 챌린지 업데이트
      if (log.breakfastMenu?.trim() && log.lunchMenu?.trim() && log.dinnerMenu?.trim()) {
        await updateDietChallenge()
      }

      return NextResponse.json(log)
    }

    // 다이어트 리셋 (활성 설정 비활성화 + 로그 삭제)
    if (type === 'reset') {
      await prisma.dietConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })
      await prisma.dietLog.deleteMany()
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Failed to save diet:', error)
    return NextResponse.json({ error: 'Failed to save diet' }, { status: 500 })
  }
}
