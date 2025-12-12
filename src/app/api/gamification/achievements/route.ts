import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateLevelFromXP } from '@/lib/gamification/config'

// POST: 업적 달성 체크 및 언락
export async function POST(request: Request) {
  try {
    const { achievementKey, force } = await request.json()

    // 업적 찾기
    const achievement = await prisma.achievement.findUnique({
      where: { key: achievementKey },
    })

    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 })
    }

    // 이미 달성했는지 확인
    const existing = await prisma.userAchievement.findFirst({
      where: { achievementId: achievement.id },
    })

    if (existing && !force) {
      return NextResponse.json({
        success: false,
        alreadyUnlocked: true,
        userAchievement: existing,
      })
    }

    // 업적 달성 기록
    const userAchievement = await prisma.userAchievement.create({
      data: {
        achievementId: achievement.id,
        notified: false,
      },
      include: { achievement: true },
    })

    // XP 보상 지급
    if (achievement.xpReward > 0) {
      await prisma.xPTransaction.create({
        data: {
          amount: achievement.xpReward,
          source: 'achievement',
          sourceId: achievement.id.toString(),
          description: `업적 달성: ${achievement.nameKo}`,
        },
      })

      // 사용자 XP 업데이트
      const gamification = await prisma.userGamification.findFirst()
      if (gamification) {
        const newTotalXP = gamification.totalXP + achievement.xpReward
        const newLevel = calculateLevelFromXP(newTotalXP)

        await prisma.userGamification.update({
          where: { id: gamification.id },
          data: {
            totalXP: newTotalXP,
            currentLevel: newLevel,
          },
        })
      }
    }

    // 프리즈 토큰 보상 지급
    if (achievement.freezeReward > 0) {
      const gamification = await prisma.userGamification.findFirst()
      if (gamification) {
        await prisma.userGamification.update({
          where: { id: gamification.id },
          data: {
            streakFreezes: {
              increment: achievement.freezeReward,
            },
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      userAchievement,
      xpReward: achievement.xpReward,
      freezeReward: achievement.freezeReward,
    })
  } catch (error) {
    console.error('Achievement POST error:', error)
    return NextResponse.json(
      { error: 'Failed to unlock achievement' },
      { status: 500 }
    )
  }
}

// PUT: 업적 알림 확인 처리
export async function PUT(request: Request) {
  try {
    const { userAchievementId } = await request.json()

    const updated = await prisma.userAchievement.update({
      where: { id: userAchievementId },
      data: { notified: true },
      include: { achievement: true },
    })

    return NextResponse.json({ success: true, userAchievement: updated })
  } catch (error) {
    console.error('Achievement PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update achievement' },
      { status: 500 }
    )
  }
}

// GET: 업적 체크 (통계 기반)
export async function GET() {
  try {
    // 운동 통계 계산
    const workoutStats = await prisma.dailyLog.aggregate({
      where: { workoutDone: true },
      _count: true,
    })

    // 부위별 운동 횟수
    const workoutByPart = await prisma.dailyLog.groupBy({
      by: ['workoutPart'],
      where: { workoutDone: true, workoutPart: { not: null } },
      _count: true,
    })

    // 퀘스트 통계
    const waterCount = await prisma.dailyLog.count({
      where: { waterDone: true },
    })
    const proteinCount = await prisma.dailyLog.count({
      where: { proteinAmount: { gte: 150 } },
    })
    const cleanDietCount = await prisma.dailyLog.count({
      where: { cleanDiet: true },
    })

    // 모든 퀘스트 완료 일수
    const perfectDays = await prisma.dailyLog.count({
      where: {
        waterDone: true,
        proteinAmount: { gte: 150 },
        cleanDiet: true,
        workoutDone: true,
      },
    })

    // 얼리버드 (8시 전 운동) 횟수
    const earlyBirdCount = await prisma.dailyLog.count({
      where: {
        workoutDone: true,
        workoutTime: { not: null },
      },
    })

    return NextResponse.json({
      stats: {
        totalWorkouts: workoutStats._count,
        workoutByPart: workoutByPart.reduce(
          (acc, item) => {
            if (item.workoutPart) {
              acc[item.workoutPart] = item._count
            }
            return acc
          },
          {} as Record<string, number>
        ),
        waterCount,
        proteinCount,
        cleanDietCount,
        perfectDays,
        earlyBirdCount,
      },
    })
  } catch (error) {
    console.error('Achievement stats GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievement stats' },
      { status: 500 }
    )
  }
}
