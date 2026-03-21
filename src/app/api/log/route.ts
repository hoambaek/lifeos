import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfDay, endOfDay } from 'date-fns'

// GET: 일일 기록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const rangeStart = searchParams.get('start')
    const rangeEnd = searchParams.get('end')

    // 범위 조회
    if (rangeStart && rangeEnd) {
      const logs = await prisma.dailyLog.findMany({
        where: {
          date: {
            gte: startOfDay(new Date(rangeStart)),
            lte: endOfDay(new Date(rangeEnd)),
          },
        },
        orderBy: { date: 'asc' },
      })
      return NextResponse.json(logs)
    }

    // 특정 날짜 조회
    const targetDate = dateParam ? new Date(dateParam) : new Date()
    const log = await prisma.dailyLog.findFirst({
      where: {
        date: {
          gte: startOfDay(targetDate),
          lte: endOfDay(targetDate),
        },
      },
    })

    if (!log) return NextResponse.json(null)

    // completedExercises JSON 파싱
    const result = {
      ...log,
      completedExercises: (log as Record<string, unknown>).completedExercises
        ? JSON.parse((log as Record<string, unknown>).completedExercises as string)
        : [],
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch log:', error)
    return NextResponse.json({ error: 'Failed to fetch log' }, { status: 500 })
  }
}

// POST: 일일 기록 생성/수정
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, weight, proteinAmount, waterDone, cleanDiet, workoutDone, workoutPart, memo, completedExercises } = body

    const targetDate = date ? new Date(date) : new Date()
    const dayStart = startOfDay(targetDate)
    const dayEnd = endOfDay(targetDate)

    // 해당 날짜의 기존 기록 확인
    const existingLog = await prisma.dailyLog.findFirst({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    })

    const completedExercisesStr = completedExercises !== undefined
      ? JSON.stringify(completedExercises)
      : null

    if (existingLog) {
      const existingRaw = existingLog as Record<string, unknown>

      const updated = await prisma.$executeRawUnsafe(
        `UPDATE DailyLog SET
          weight = ?,
          proteinAmount = ?,
          waterDone = ?,
          cleanDiet = ?,
          workoutDone = ?,
          workoutPart = ?,
          memo = ?,
          completedExercises = ?
        WHERE id = ?`,
        weight ?? existingLog.weight,
        proteinAmount ?? existingLog.proteinAmount,
        waterDone ?? existingLog.waterDone ? 1 : 0,
        cleanDiet ?? existingLog.cleanDiet ? 1 : 0,
        workoutDone ?? existingLog.workoutDone ? 1 : 0,
        workoutPart ?? existingLog.workoutPart,
        memo ?? existingLog.memo,
        completedExercisesStr ?? (existingRaw.completedExercises as string | null),
        existingLog.id,
      )

      return NextResponse.json({ ...existingLog, completedExercises: completedExercises ?? [] })
    }

    // 새 기록 생성
    const log = await prisma.dailyLog.create({
      data: {
        date: dayStart,
        weight,
        proteinAmount: proteinAmount ?? 0,
        waterDone: waterDone ?? false,
        cleanDiet: cleanDiet ?? false,
        workoutDone: workoutDone ?? false,
        workoutPart,
        memo,
      },
    })

    // completedExercises는 raw SQL로 업데이트 (Prisma 타입에 아직 없을 수 있으므로)
    if (completedExercisesStr) {
      await prisma.$executeRawUnsafe(
        `UPDATE DailyLog SET completedExercises = ? WHERE id = ?`,
        completedExercisesStr,
        log.id,
      )
    }

    return NextResponse.json({ ...log, completedExercises: completedExercises ?? [] })
  } catch (error) {
    console.error('Failed to save log:', error)
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 })
  }
}
