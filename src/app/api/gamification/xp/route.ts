import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateLevelFromXP } from '@/lib/gamification/config'

// POST: XP 추가
export async function POST(request: Request) {
  try {
    const { amount, source, sourceId, description } = await request.json()

    if (typeof amount !== 'number' || amount === 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // XP 트랜잭션 기록
    await prisma.xPTransaction.create({
      data: {
        amount,
        source: source || 'unknown',
        sourceId: sourceId?.toString(),
        description,
      },
    })

    // 사용자 게이미피케이션 프로필 조회/생성
    let gamification = await prisma.userGamification.findFirst()

    if (!gamification) {
      gamification = await prisma.userGamification.create({
        data: {
          totalXP: 0,
          currentLevel: 1,
          streakFreezes: 0,
          streakFreezesUsed: 0,
        },
      })
    }

    const oldLevel = gamification.currentLevel
    const newTotalXP = gamification.totalXP + amount
    const newLevel = calculateLevelFromXP(newTotalXP)

    // XP 및 레벨 업데이트
    const updated = await prisma.userGamification.update({
      where: { id: gamification.id },
      data: {
        totalXP: newTotalXP,
        currentLevel: newLevel,
      },
    })

    return NextResponse.json({
      success: true,
      totalXP: updated.totalXP,
      currentLevel: updated.currentLevel,
      xpGained: amount,
      levelUp: newLevel > oldLevel,
      newLevel: newLevel > oldLevel ? newLevel : undefined,
    })
  } catch (error) {
    console.error('XP POST error:', error)
    return NextResponse.json({ error: 'Failed to add XP' }, { status: 500 })
  }
}

// GET: XP 히스토리 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const transactions = await prisma.xPTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('XP GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch XP history' },
      { status: 500 }
    )
  }
}
