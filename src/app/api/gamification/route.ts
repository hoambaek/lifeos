import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ACHIEVEMENTS } from '@/lib/gamification/achievements'
import { startOfWeek, endOfWeek } from 'date-fns'

// 주간 챌린지 템플릿
const WEEKLY_CHALLENGE_TEMPLATES = [
  { key: 'weekly_workout_5', nameKo: '이번 주 5회 운동', descriptionKo: '일주일 동안 5번 운동을 완료하세요', category: 'workout', targetValue: 5, xpReward: 150 },
  { key: 'weekly_workout_7', nameKo: '완벽한 운동 주간', descriptionKo: '일주일 동안 매일 운동을 완료하세요', category: 'workout', targetValue: 7, xpReward: 300 },
  { key: 'weekly_perfect_3', nameKo: '완벽한 3일', descriptionKo: '3일 동안 모든 퀘스트를 완료하세요', category: 'mixed', targetValue: 3, xpReward: 200 },
  { key: 'weekly_water_5', nameKo: '물 마시기 마스터', descriptionKo: '일주일 동안 5번 물 3L를 달성하세요', category: 'quest', targetValue: 5, xpReward: 100 },
  { key: 'weekly_protein_5', nameKo: '단백질 챔피언', descriptionKo: '일주일 동안 5번 단백질 150g을 달성하세요', category: 'quest', targetValue: 5, xpReward: 120 },
  { key: 'weekly_leg_2', nameKo: '하체 집중 주간', descriptionKo: '이번 주 하체 운동을 2회 이상 완료하세요', category: 'workout', targetValue: 2, xpReward: 100 },
  { key: 'weekly_back_2', nameKo: '등 강화 주간', descriptionKo: '이번 주 등 운동을 2회 이상 완료하세요', category: 'workout', targetValue: 2, xpReward: 100 },
  { key: 'weekly_chest_2', nameKo: '가슴 강화 주간', descriptionKo: '이번 주 가슴 운동을 2회 이상 완료하세요', category: 'workout', targetValue: 2, xpReward: 100 },
  { key: 'weekly_clean_diet_5', nameKo: '클린 이터', descriptionKo: '일주일 동안 5번 클린다이어트를 유지하세요', category: 'quest', targetValue: 5, xpReward: 100 },
]

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
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

    // 챌린지가 없으면 자동 생성
    if (activeChallenges.length === 0) {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
      const selectedWeekly = pickRandom(WEEKLY_CHALLENGE_TEMPLATES, 3)

      for (const template of selectedWeekly) {
        const uniqueKey = `${template.key}_${weekStart.toISOString().split('T')[0]}`

        const challenge = await prisma.challenge.create({
          data: {
            key: uniqueKey,
            nameKo: template.nameKo,
            descriptionKo: template.descriptionKo,
            type: 'weekly',
            category: template.category,
            targetValue: template.targetValue,
            xpReward: template.xpReward,
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
      }

      // 다시 조회
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
