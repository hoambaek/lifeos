import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfDay, endOfDay, differenceInDays, addDays } from 'date-fns'

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

      if (!config) {
        return NextResponse.json({ error: 'Diet not started' }, { status: 404 })
      }

      const dayNumber = differenceInDays(targetDate, new Date(config.startDate)) + 1
      const week = Math.min(Math.ceil(dayNumber / 7), 5)

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
        return NextResponse.json(updated)
      }

      const log = await prisma.dietLog.create({
        data: {
          date: dayStart,
          dayNumber,
          week,
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

      return NextResponse.json(log)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Failed to save diet:', error)
    return NextResponse.json({ error: 'Failed to save diet' }, { status: 500 })
  }
}
