import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ACHIEVEMENTS } from '@/lib/gamification/achievements'
import { calculateLevelFromXP } from '@/lib/gamification/config'

interface Stats {
  totalWorkouts: number
  workoutByPart: Record<string, number>
  currentStreak: number
  longestStreak: number
  waterCount: number
  proteinCount: number
  cleanDietCount: number
  perfectDays: number
  earlyBirdCount: number
  nightOwlCount: number
  currentLevel: number
  streakAfterFreeze: number // 프리즈 사용 후 스트릭
}

// 통계 계산
async function calculateStats(): Promise<Stats> {
  // 운동 통계
  const workoutStats = await prisma.dailyLog.aggregate({
    where: { workoutDone: true },
    _count: true,
  })

  // 부위별 운동 횟수
  const workoutByPartRaw = await prisma.dailyLog.groupBy({
    by: ['workoutPart'],
    where: { workoutDone: true, workoutPart: { not: null } },
    _count: true,
  })

  const workoutByPart: Record<string, number> = {}
  for (const item of workoutByPartRaw) {
    if (item.workoutPart) {
      workoutByPart[item.workoutPart] = item._count
    }
  }

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

  // 얼리버드 & 나이트올 (시간대별 운동)
  // workoutTime이 시간 문자열이라고 가정
  const allWorkoutTimes = await prisma.dailyLog.findMany({
    where: {
      workoutDone: true,
      workoutTime: { not: null },
    },
    select: { workoutTime: true },
  })

  let earlyBirdCount = 0
  let nightOwlCount = 0
  for (const log of allWorkoutTimes) {
    if (log.workoutTime) {
      const hour = new Date(log.workoutTime).getHours()
      if (hour < 8) earlyBirdCount++
      if (hour >= 22) nightOwlCount++
    }
  }

  // 스트릭 계산
  const logs = await prisma.dailyLog.findMany({
    where: { workoutDone: true },
    orderBy: { date: 'desc' },
    select: { date: true, streakFrozen: true },
  })

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  let streakAfterFreeze = 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 현재 스트릭 계산
  let checkDate = new Date(today)
  let lastFreezeIndex = -1

  for (let i = 0; i < logs.length; i++) {
    const logDate = new Date(logs[i].date)
    logDate.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((checkDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0 || diffDays === 1) {
      tempStreak++
      if (logs[i].streakFrozen) {
        lastFreezeIndex = i
      }
      checkDate = logDate
    } else {
      break
    }
  }
  currentStreak = tempStreak

  // 프리즈 사용 후 스트릭 계산
  if (lastFreezeIndex >= 0) {
    streakAfterFreeze = lastFreezeIndex
  }

  // 최장 스트릭 (간단한 계산)
  longestStreak = currentStreak // TODO: 더 정확한 계산 필요

  // 레벨
  const gamification = await prisma.userGamification.findFirst()
  const currentLevel = gamification ? calculateLevelFromXP(gamification.totalXP) : 1

  return {
    totalWorkouts: workoutStats._count,
    workoutByPart,
    currentStreak,
    longestStreak,
    waterCount,
    proteinCount,
    cleanDietCount,
    perfectDays,
    earlyBirdCount,
    nightOwlCount,
    currentLevel,
    streakAfterFreeze,
  }
}

// 업적 체크 로직
function checkAchievement(
  achievementKey: string,
  stats: Stats
): boolean {
  const achievement = ACHIEVEMENTS.find((a) => a.key === achievementKey)
  if (!achievement) return false

  switch (achievementKey) {
    // 운동 마일스톤
    case 'first_workout':
      return stats.totalWorkouts >= 1
    case 'workout_10':
      return stats.totalWorkouts >= 10
    case 'workout_25':
      return stats.totalWorkouts >= 25
    case 'workout_50':
      return stats.totalWorkouts >= 50
    case 'workout_100':
      return stats.totalWorkouts >= 100
    case 'workout_200':
      return stats.totalWorkouts >= 200
    case 'workout_365':
      return stats.totalWorkouts >= 365

    // 부위별 마스터
    case 'chest_master':
      return (stats.workoutByPart['가슴'] || 0) >= 20
    case 'back_master':
      return (stats.workoutByPart['등'] || 0) >= 20
    case 'leg_legend':
      return (stats.workoutByPart['하체'] || 0) >= 20
    case 'shoulder_master':
      return (stats.workoutByPart['어깨'] || 0) >= 20

    // 스트릭
    case 'streak_3':
      return stats.currentStreak >= 3 || stats.longestStreak >= 3
    case 'streak_7':
      return stats.currentStreak >= 7 || stats.longestStreak >= 7
    case 'streak_14':
      return stats.currentStreak >= 14 || stats.longestStreak >= 14
    case 'streak_30':
      return stats.currentStreak >= 30 || stats.longestStreak >= 30
    case 'streak_60':
      return stats.currentStreak >= 60 || stats.longestStreak >= 60
    case 'streak_100':
      return stats.currentStreak >= 100 || stats.longestStreak >= 100

    // 퀘스트
    case 'perfect_day':
      return stats.perfectDays >= 1
    case 'perfect_week':
      return stats.perfectDays >= 7 // 연속이 아닌 총 횟수로 체크
    case 'hydration_10':
      return stats.waterCount >= 10
    case 'hydration_30':
      return stats.waterCount >= 30
    case 'protein_10':
      return stats.proteinCount >= 10
    case 'protein_30':
      return stats.proteinCount >= 30
    case 'clean_10':
      return stats.cleanDietCount >= 10
    case 'clean_30':
      return stats.cleanDietCount >= 30

    // 특별
    case 'early_bird':
      return stats.earlyBirdCount >= 1
    case 'early_bird_10':
      return stats.earlyBirdCount >= 10
    case 'night_owl':
      return stats.nightOwlCount >= 1
    case 'comeback_kid':
      return stats.streakAfterFreeze >= 3
    case 'level_10':
      return stats.currentLevel >= 10
    case 'level_25':
      return stats.currentLevel >= 25
    case 'level_50':
      return stats.currentLevel >= 50

    default:
      return false
  }
}

// POST: 모든 업적 체크 및 언락
export async function POST() {
  try {
    // 통계 계산
    const stats = await calculateStats()

    // 이미 달성한 업적 조회
    const unlockedAchievements = await prisma.userAchievement.findMany({
      include: { achievement: true },
    })
    const unlockedKeys = new Set(unlockedAchievements.map((ua) => ua.achievement.key))

    // 새로 언락할 업적 찾기
    const newlyUnlocked: Array<{ key: string; nameKo: string; xpReward: number; freezeReward: number }> = []

    for (const achievement of ACHIEVEMENTS) {
      // 이미 언락한 업적은 스킵
      if (unlockedKeys.has(achievement.key)) continue

      // 업적 조건 체크
      if (checkAchievement(achievement.key, stats)) {
        // DB에서 업적 찾기
        let dbAchievement = await prisma.achievement.findUnique({
          where: { key: achievement.key },
        })

        // 업적이 DB에 없으면 생성
        if (!dbAchievement) {
          dbAchievement = await prisma.achievement.create({
            data: {
              key: achievement.key,
              nameKo: achievement.nameKo,
              descriptionKo: achievement.descriptionKo,
              iconEmoji: achievement.iconEmoji,
              category: achievement.category,
              tier: achievement.tier,
              xpReward: achievement.xpReward,
              requirement: achievement.requirement,
              freezeReward: achievement.freezeReward || 0,
            },
          })
        }

        // 업적 달성 기록
        await prisma.userAchievement.create({
          data: {
            achievementId: dbAchievement.id,
            notified: false,
          },
        })

        // XP 보상 지급
        if (achievement.xpReward > 0) {
          await prisma.xPTransaction.create({
            data: {
              amount: achievement.xpReward,
              source: 'achievement',
              sourceId: dbAchievement.id.toString(),
              description: `업적 달성: ${achievement.nameKo}`,
            },
          })

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
        if (achievement.freezeReward && achievement.freezeReward > 0) {
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

        newlyUnlocked.push({
          key: achievement.key,
          nameKo: achievement.nameKo,
          xpReward: achievement.xpReward,
          freezeReward: achievement.freezeReward || 0,
        })
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      newlyUnlocked,
      totalUnlocked: unlockedKeys.size + newlyUnlocked.length,
    })
  } catch (error) {
    console.error('Achievement check error:', error)
    return NextResponse.json({ error: 'Failed to check achievements' }, { status: 500 })
  }
}

// GET: 현재 통계와 진행 상황 조회
export async function GET() {
  try {
    const stats = await calculateStats()

    // 업적별 진행 상황 계산
    const progress: Record<string, { current: number; required: number; completed: boolean }> = {}

    // 이미 달성한 업적 조회
    const unlockedAchievements = await prisma.userAchievement.findMany({
      include: { achievement: true },
    })
    const unlockedKeys = new Set(unlockedAchievements.map((ua) => ua.achievement.key))

    for (const achievement of ACHIEVEMENTS) {
      let current = 0

      switch (achievement.key) {
        case 'first_workout':
        case 'workout_10':
        case 'workout_25':
        case 'workout_50':
        case 'workout_100':
        case 'workout_200':
        case 'workout_365':
          current = stats.totalWorkouts
          break
        case 'chest_master':
          current = stats.workoutByPart['가슴'] || 0
          break
        case 'back_master':
          current = stats.workoutByPart['등'] || 0
          break
        case 'leg_legend':
          current = stats.workoutByPart['하체'] || 0
          break
        case 'shoulder_master':
          current = stats.workoutByPart['어깨'] || 0
          break
        case 'streak_3':
        case 'streak_7':
        case 'streak_14':
        case 'streak_30':
        case 'streak_60':
        case 'streak_100':
          current = Math.max(stats.currentStreak, stats.longestStreak)
          break
        case 'perfect_day':
        case 'perfect_week':
          current = stats.perfectDays
          break
        case 'hydration_10':
        case 'hydration_30':
          current = stats.waterCount
          break
        case 'protein_10':
        case 'protein_30':
          current = stats.proteinCount
          break
        case 'clean_10':
        case 'clean_30':
          current = stats.cleanDietCount
          break
        case 'early_bird':
        case 'early_bird_10':
          current = stats.earlyBirdCount
          break
        case 'night_owl':
          current = stats.nightOwlCount
          break
        case 'comeback_kid':
          current = stats.streakAfterFreeze
          break
        case 'level_10':
        case 'level_25':
        case 'level_50':
          current = stats.currentLevel
          break
      }

      progress[achievement.key] = {
        current,
        required: achievement.requirement,
        completed: unlockedKeys.has(achievement.key),
      }
    }

    return NextResponse.json({
      stats,
      progress,
      unlockedCount: unlockedKeys.size,
      totalAchievements: ACHIEVEMENTS.length,
    })
  } catch (error) {
    console.error('Achievement progress GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch achievement progress' }, { status: 500 })
  }
}
