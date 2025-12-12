import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST: 스트릭 프리즈 사용
export async function POST(request: Request) {
  try {
    const { currentStreak } = await request.json()

    // 사용자 게이미피케이션 프로필 조회
    const gamification = await prisma.userGamification.findFirst()

    if (!gamification) {
      return NextResponse.json(
        { error: 'Gamification profile not found' },
        { status: 404 }
      )
    }

    if (gamification.streakFreezes <= 0) {
      return NextResponse.json(
        { error: 'No streak freezes available', freezesRemaining: 0 },
        { status: 400 }
      )
    }

    // 프리즈 사용 기록
    await prisma.streakFreezeLog.create({
      data: {
        savedStreak: currentStreak || 0,
      },
    })

    // 프리즈 토큰 차감
    const updated = await prisma.userGamification.update({
      where: { id: gamification.id },
      data: {
        streakFreezes: { decrement: 1 },
        streakFreezesUsed: { increment: 1 },
      },
    })

    // 오늘 날짜의 DailyLog에 streakFrozen 표시
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.dailyLog.updateMany({
      where: {
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      data: {
        streakFrozen: true,
      },
    })

    return NextResponse.json({
      success: true,
      freezesRemaining: updated.streakFreezes,
      totalUsed: updated.streakFreezesUsed,
    })
  } catch (error) {
    console.error('Streak freeze POST error:', error)
    return NextResponse.json(
      { error: 'Failed to use streak freeze' },
      { status: 500 }
    )
  }
}

// GET: 프리즈 사용 히스토리
export async function GET() {
  try {
    const gamification = await prisma.userGamification.findFirst()

    const freezeHistory = await prisma.streakFreezeLog.findMany({
      orderBy: { usedAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      available: gamification?.streakFreezes || 0,
      totalUsed: gamification?.streakFreezesUsed || 0,
      history: freezeHistory,
    })
  } catch (error) {
    console.error('Streak freeze GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch streak freeze data' },
      { status: 500 }
    )
  }
}
