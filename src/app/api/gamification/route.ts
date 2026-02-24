import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ACHIEVEMENTS } from '@/lib/gamification/achievements'
import { startOfWeek, endOfWeek, format } from 'date-fns'

// 주간 챌린지: 1개 고정
const WEEKLY_CHALLENGE = {
  key: 'weekly_balanced_life',
  nameKo: '균형 잡힌 한 주',
  descriptionKo: '식단·루틴·운동·기록 평균 40% 이상인 날 5일 달성',
  category: 'balanced',
  targetValue: 5,
  xpReward: 200,
}

// GET: 게이미피케이션 데이터 조회
export async function GET() {
  try {
    // 사용자 게이미피케이션 프로필 (없으면 생성)
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

    // 업적 목록 (없으면 시딩)
    let achievements = await prisma.achievement.findMany()

    if (achievements.length === 0) {
      // 업적 데이터 시딩
      await prisma.achievement.createMany({
        data: ACHIEVEMENTS.map((a) => ({
          key: a.key,
          nameKo: a.nameKo,
          descriptionKo: a.descriptionKo,
          iconEmoji: a.iconEmoji,
          category: a.category,
          tier: a.tier,
          xpReward: a.xpReward,
          requirement: a.requirement,
          freezeReward: a.freezeReward || 0,
        })),
      })
      achievements = await prisma.achievement.findMany()
    }

    // 사용자가 달성한 업적
    const userAchievements = await prisma.userAchievement.findMany({
      include: { achievement: true },
    })

    // 활성 챌린지
    const now = new Date()
    let activeChallenges = await prisma.challenge.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    })

    // 챌린지가 없으면 자동 생성 (1개)
    if (activeChallenges.length === 0) {
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

      activeChallenges = await prisma.challenge.findMany({
        where: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      })
    }

    // 사용자 챌린지 진행 상황
    const userChallenges = await prisma.userChallenge.findMany({
      include: { challenge: true },
    })

    return NextResponse.json({
      userGamification: gamification,
      achievements,
      userAchievements,
      activeChallenges,
      userChallenges,
    })
  } catch (error) {
    console.error('Gamification GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gamification data' },
      { status: 500 }
    )
  }
}
