import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfDay, endOfDay } from 'date-fns'
import { XP_REWARDS, calculateLevelFromXP } from '@/lib/gamification/config'

// 챌린지 진행 상황 업데이트 헬퍼
async function updateChallengeProgress(
  category: string,
  workoutPart?: string | null
) {
  const now = new Date()

  // 활성화된 챌린지 조회
  const activeChallenges = await prisma.challenge.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: {
      userChallenges: {
        where: { completed: false },
      },
    },
  })

  for (const challenge of activeChallenges) {
    const userChallenge = challenge.userChallenges[0]
    if (!userChallenge) continue

    let shouldIncrement = false
    const key = challenge.key.toLowerCase()

    // 카테고리별 증가 조건
    if (category === 'workout') {
      // 부위별 챌린지 체크
      if (key.includes('leg') && workoutPart === '하체') {
        shouldIncrement = true
      } else if (key.includes('back') && workoutPart === '등') {
        shouldIncrement = true
      } else if (key.includes('chest') && workoutPart === '가슴') {
        shouldIncrement = true
      } else if (
        key.includes('workout') &&
        !key.includes('leg') &&
        !key.includes('back') &&
        !key.includes('chest')
      ) {
        // 일반 운동 챌린지 (weekly_workout_5, weekly_workout_7 등)
        shouldIncrement = true
      }
    } else if (category === 'quest') {
      // 퀘스트 관련 챌린지
      if (key.includes('water') || key.includes('protein') || key.includes('clean')) {
        shouldIncrement = true
      }
    } else if (category === 'mixed') {
      // mixed 챌린지 (완벽한 3일 등)
      if (key.includes('perfect') || challenge.category === 'mixed') {
        shouldIncrement = true
      }
    }

    if (shouldIncrement) {
      const newValue = userChallenge.currentValue + 1
      const isCompleted = newValue >= challenge.targetValue

      await prisma.userChallenge.update({
        where: { id: userChallenge.id },
        data: {
          currentValue: newValue,
          completed: isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
      })
    }
  }
}

// XP 지급 헬퍼 함수
async function awardXP(amount: number, source: string, description: string) {
  if (amount <= 0) return null

  // XP 트랜잭션 기록
  await prisma.xPTransaction.create({
    data: {
      amount,
      source,
      description,
    },
  })

  // 사용자 게이미피케이션 프로필 업데이트
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

  const newTotalXP = gamification.totalXP + amount
  const newLevel = calculateLevelFromXP(newTotalXP)

  await prisma.userGamification.update({
    where: { id: gamification.id },
    data: {
      totalXP: newTotalXP,
      currentLevel: newLevel,
    },
  })

  return { amount, newTotalXP, newLevel }
}

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
      // XP 지급 추적
      const xpGained: { source: string; amount: number; description: string }[] = []

      // 물 3L 완료 체크 (false → true)
      if (waterDone === true && !existingLog.waterDone) {
        xpGained.push({
          source: 'quest',
          amount: XP_REWARDS.quest_water,
          description: '물 3L 완료',
        })
      }

      // 단백질 목표 달성 체크 (150g 미만 → 150g 이상)
      const newProtein = proteinAmount ?? existingLog.proteinAmount
      if (newProtein >= 150 && existingLog.proteinAmount < 150) {
        xpGained.push({
          source: 'quest',
          amount: XP_REWARDS.quest_protein,
          description: '단백질 150g 달성',
        })
      }

      // 클린다이어트 완료 체크 (false → true)
      if (cleanDiet === true && !existingLog.cleanDiet) {
        xpGained.push({
          source: 'quest',
          amount: XP_REWARDS.quest_clean_diet,
          description: '클린다이어트 완료',
        })
      }

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

      // 모든 퀘스트 완료 보너스 체크
      const allQuestsComplete =
        (waterDone ?? updated.waterDone) &&
        ((proteinAmount ?? updated.proteinAmount) >= 150) &&
        (cleanDiet ?? updated.cleanDiet) &&
        (workoutDone ?? updated.workoutDone)

      const wasAllComplete =
        existingLog.waterDone &&
        existingLog.proteinAmount >= 150 &&
        existingLog.cleanDiet &&
        existingLog.workoutDone

      if (allQuestsComplete && !wasAllComplete) {
        xpGained.push({
          source: 'bonus',
          amount: XP_REWARDS.all_quests_complete,
          description: '모든 퀘스트 완료 보너스',
        })
      }

      // XP 지급 실행
      let totalXPGained = 0
      for (const xp of xpGained) {
        await awardXP(xp.amount, xp.source, xp.description)
        totalXPGained += xp.amount
      }

      // 챌린지 진행 상황 업데이트
      if (workoutDone === true && !existingLog.workoutDone) {
        await updateChallengeProgress('workout', workoutPart ?? existingLog.workoutPart)
      }
      if (waterDone === true && !existingLog.waterDone) {
        await updateChallengeProgress('quest')
      }
      if (cleanDiet === true && !existingLog.cleanDiet) {
        await updateChallengeProgress('quest')
      }
      if (newProtein >= 150 && existingLog.proteinAmount < 150) {
        await updateChallengeProgress('quest')
      }
      // 모든 퀘스트 완료 시 mixed 챌린지 업데이트
      if (allQuestsComplete && !wasAllComplete) {
        await updateChallengeProgress('mixed')
      }

      return NextResponse.json({
        ...updated,
        xpGained: totalXPGained > 0 ? xpGained : undefined,
        totalXPGained: totalXPGained > 0 ? totalXPGained : undefined,
      })
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

    // 새 기록에서도 완료된 퀘스트에 대해 XP 지급
    const xpGained: { source: string; amount: number; description: string }[] = []

    if (waterDone) {
      xpGained.push({
        source: 'quest',
        amount: XP_REWARDS.quest_water,
        description: '물 3L 완료',
      })
    }

    if (proteinAmount && proteinAmount >= 150) {
      xpGained.push({
        source: 'quest',
        amount: XP_REWARDS.quest_protein,
        description: '단백질 150g 달성',
      })
    }

    if (cleanDiet) {
      xpGained.push({
        source: 'quest',
        amount: XP_REWARDS.quest_clean_diet,
        description: '클린다이어트 완료',
      })
    }

    // 모든 퀘스트 완료 보너스
    if (waterDone && (proteinAmount ?? 0) >= 150 && cleanDiet && workoutDone) {
      xpGained.push({
        source: 'bonus',
        amount: XP_REWARDS.all_quests_complete,
        description: '모든 퀘스트 완료 보너스',
      })
    }

    // XP 지급 실행
    let totalXPGained = 0
    for (const xp of xpGained) {
      await awardXP(xp.amount, xp.source, xp.description)
      totalXPGained += xp.amount
    }

    // 챌린지 진행 상황 업데이트 (새 기록)
    if (workoutDone) {
      await updateChallengeProgress('workout', workoutPart)
    }
    if (waterDone) {
      await updateChallengeProgress('quest')
    }
    if (cleanDiet) {
      await updateChallengeProgress('quest')
    }
    if (proteinAmount && proteinAmount >= 150) {
      await updateChallengeProgress('quest')
    }
    // 모든 퀘스트 완료 시 mixed 챌린지 업데이트
    if (waterDone && (proteinAmount ?? 0) >= 150 && cleanDiet && workoutDone) {
      await updateChallengeProgress('mixed')
    }

    return NextResponse.json({
      ...log,
      xpGained: totalXPGained > 0 ? xpGained : undefined,
      totalXPGained: totalXPGained > 0 ? totalXPGained : undefined,
    })
  } catch (error) {
    console.error('Failed to save log:', error)
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 })
  }
}
