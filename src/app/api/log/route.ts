import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfDay, endOfDay } from 'date-fns'

// GET: 일일 기록 조회 (date 쿼리 파라미터로 특정 날짜 조회)
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
    return NextResponse.json(log)
  } catch (error) {
    console.error('Failed to fetch log:', error)
    return NextResponse.json({ error: 'Failed to fetch log' }, { status: 500 })
  }
}

// POST: 일일 기록 생성/수정
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, weight, proteinAmount, waterDone, cleanDiet, workoutDone, workoutPart, memo } = body

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

    if (existingLog) {
      // 기존 기록 업데이트
      const updated = await prisma.dailyLog.update({
        where: { id: existingLog.id },
        data: {
          weight: weight ?? existingLog.weight,
          proteinAmount: proteinAmount ?? existingLog.proteinAmount,
          waterDone: waterDone ?? existingLog.waterDone,
          cleanDiet: cleanDiet ?? existingLog.cleanDiet,
          workoutDone: workoutDone ?? existingLog.workoutDone,
          workoutPart: workoutPart ?? existingLog.workoutPart,
          memo: memo ?? existingLog.memo,
        },
      })
      return NextResponse.json(updated)
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
    return NextResponse.json(log)
  } catch (error) {
    console.error('Failed to save log:', error)
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 })
  }
}
