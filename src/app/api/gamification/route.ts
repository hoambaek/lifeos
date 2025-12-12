import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ACHIEVEMENTS } from '@/lib/gamification/achievements'

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
    const activeChallenges = await prisma.challenge.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    })

    // 사용자 챌린지 진행 상황
    const userChallenges = await prisma.userChallenge.findMany({
      include: { challenge: true },
    })

    return NextResponse.json({
      gamification,
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
