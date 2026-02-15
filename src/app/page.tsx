'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAppStore, PROTEIN_FOODS, WORKOUT_ROUTINE, PHASES, DailyLog } from '@/stores/useAppStore'
import { useGamificationStore } from '@/stores/useGamificationStore'
import { differenceInDays, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Droplets, Utensils, Dumbbell, Trophy, Flame, Target, Activity, Zap, RotateCcw, Settings, Brain, Quote } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { DietStatusCard } from '@/components/DietStatusCard'
import {
  XPBar,
  XPGainAnimation,
  LevelUpModal,
  BadgeUnlockModal,
  StreakCard,
  ChallengeList,
  CognitiveShield,
} from '@/components/gamification'
import { THIEL_QUOTES, QUEST_COGNITIVE_LABELS } from '@/lib/gamification/config'

interface StreakData {
  currentStreak: number
  longestStreak: number
  todayComplete: boolean
}

export default function Dashboard() {
  const { config, todayLog, setConfig, setTodayLog, updateTodayLog } = useAppStore()
  const {
    userGamification,
    setUserGamification,
    setAchievements,
    setUserAchievements,
    setActiveChallenges,
    setUserChallenges,
    addXP,
    addAnimation,
  } = useGamificationStore()
  const [isSetupOpen, setIsSetupOpen] = useState(false)
  const [setupData, setSetupData] = useState({
    startWeight: 101.1,
    goalWeight: 85.0,
    startDate: format(new Date(), 'yyyy-MM-dd'),
  })
  const [proteinDialogOpen, setProteinDialogOpen] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [celebration, setCelebration] = useState(false)
  const [latestInbody, setLatestInbody] = useState<{ inbodyScore: number } | null>(null)
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, longestStreak: 0, todayComplete: false })
  const [totalWorkouts, setTotalWorkouts] = useState(0)
  const [perfectDays, setPerfectDays] = useState(0)
  const [thielQuote, setThielQuote] = useState('')
  const [waterCount, setWaterCount] = useState(0)

  // 로딩 상태 (개별 섹션별)
  const [isConfigLoading, setIsConfigLoading] = useState(true)
  const [isInbodyLoading, setIsInbodyLoading] = useState(true)
  const [isStreakLoading, setIsStreakLoading] = useState(true)
  const [isGamificationLoading, setIsGamificationLoading] = useState(true)

  // 물 섭취량 로드 (localStorage에서)
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const savedWaterData = localStorage.getItem('waterCount')
    if (savedWaterData) {
      const { date, count } = JSON.parse(savedWaterData)
      if (date === today) {
        setWaterCount(count)
      } else {
        localStorage.setItem('waterCount', JSON.stringify({ date: today, count: 0 }))
      }
    }
  }, [])

  // todayLog가 로드되면 waterDone 상태와 동기화
  useEffect(() => {
    if (todayLog?.waterDone) {
      const today = format(new Date(), 'yyyy-MM-dd')
      const savedWaterData = localStorage.getItem('waterCount')
      if (savedWaterData) {
        const { date, count } = JSON.parse(savedWaterData)
        if (date === today && count >= 6) return
      }
      setWaterCount(6)
      localStorage.setItem('waterCount', JSON.stringify({ date: today, count: 6 }))
    }
  }, [todayLog?.waterDone])

  // 피터 틸 명언 설정
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const savedQuoteData = localStorage.getItem('thielQuote')
    if (savedQuoteData) {
      const { date, quote } = JSON.parse(savedQuoteData)
      if (date === today) {
        setThielQuote(quote)
        return
      }
    }
    const newQuote = THIEL_QUOTES[Math.floor(Math.random() * THIEL_QUOTES.length)]
    setThielQuote(newQuote)
    localStorage.setItem('thielQuote', JSON.stringify({ date: today, quote: newQuote }))
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      const configPromise = fetch('/api/config').then(res => res.json())
      const logPromise = fetch('/api/log').then(res => res.json())

      const [configData, logData] = await Promise.all([configPromise, logPromise])

      if (configData) {
        setConfig(configData)
      } else {
        setIsSetupOpen(true)
      }
      setIsConfigLoading(false)

      if (logData) {
        setTodayLog(logData)
      } else {
        setTodayLog({
          date: new Date(),
          proteinAmount: 0,
          waterDone: false,
          cleanDiet: false,
          workoutDone: false,
        })
      }

      fetch('/api/inbody?latest=true')
        .then(res => res.json())
        .then(inbodyData => {
          if (inbodyData?.inbodyScore) {
            setLatestInbody(inbodyData)
          }
        })
        .catch(() => console.log('No inbody data'))
        .finally(() => setIsInbodyLoading(false))

      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 180)
      fetch(`/api/log?start=${format(start, 'yyyy-MM-dd')}&end=${format(end, 'yyyy-MM-dd')}`)
        .then(res => res.json())
        .then(logs => {
          if (logs && Array.isArray(logs)) {
            const streakData = calculateStreak(logs)
            setStreak(streakData)

            const workoutCount = logs.filter((log: { workoutDone: boolean }) => log.workoutDone).length
            setTotalWorkouts(workoutCount)

            const perfectCount = logs.filter((log: {
              waterDone: boolean
              proteinAmount: number
              cleanDiet: boolean
              workoutDone: boolean
            }) =>
              log.waterDone && log.proteinAmount >= 150 && log.cleanDiet && log.workoutDone
            ).length
            setPerfectDays(perfectCount)
          }
        })
        .catch(() => console.log('No streak data'))
        .finally(() => setIsStreakLoading(false))

      fetch('/api/gamification')
        .then(res => res.json())
        .then(gamificationData => {
          if (gamificationData) {
            if (gamificationData.userGamification) {
              setUserGamification(gamificationData.userGamification)
            }
            if (gamificationData.achievements) {
              setAchievements(gamificationData.achievements)
            }
            if (gamificationData.userAchievements) {
              setUserAchievements(gamificationData.userAchievements)
            }
            if (gamificationData.activeChallenges) {
              setActiveChallenges(gamificationData.activeChallenges)
            }
            if (gamificationData.userChallenges) {
              setUserChallenges(gamificationData.userChallenges)
            }
          }
        })
        .catch(() => console.log('No gamification data'))
        .finally(() => setIsGamificationLoading(false))
    }
    loadData()
  }, [setConfig, setTodayLog, setUserGamification, setAchievements, setUserAchievements, setActiveChallenges, setUserChallenges])

  // 스트릭 계산 함수
  const calculateStreak = (logs: Array<{
    date: string
    waterDone: boolean
    proteinAmount: number
    cleanDiet: boolean
    workoutDone: boolean
  }>): StreakData => {
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    const isComplete = (log: typeof sortedLogs[0]) =>
      log.waterDone && log.proteinAmount >= 150 && log.cleanDiet && log.workoutDone

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    const today = format(new Date(), 'yyyy-MM-dd')
    let todayComplete = false

    const todayLog = sortedLogs.find(log => log.date === today)
    if (todayLog && isComplete(todayLog)) {
      todayComplete = true
    }

    let expectedDate = new Date()

    for (const log of sortedLogs) {
      const logDate = format(new Date(log.date), 'yyyy-MM-dd')
      const expectedDateStr = format(expectedDate, 'yyyy-MM-dd')

      if (logDate === expectedDateStr) {
        if (isComplete(log)) {
          tempStreak++
          longestStreak = Math.max(longestStreak, tempStreak)
        } else {
          if (logDate !== today) {
            if (currentStreak === 0) currentStreak = tempStreak
            tempStreak = 0
          }
        }
        expectedDate.setDate(expectedDate.getDate() - 1)
      } else {
        if (currentStreak === 0) currentStreak = tempStreak
        tempStreak = 0
        break
      }
    }

    if (currentStreak === 0) currentStreak = tempStreak

    return { currentStreak, longestStreak, todayComplete }
  }

  const handleSaveSetup = async () => {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setupData),
    })
    const data = await res.json()
    setConfig(data)
    setIsSetupOpen(false)
  }

  const handleUpdateLog = async (updates: Partial<DailyLog>) => {
    updateTodayLog(updates)
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...todayLog, ...updates }),
    })
  }

  const addProtein = (amount: number) => {
    const newAmount = (todayLog?.proteinAmount || 0) + amount
    handleUpdateLog({ proteinAmount: newAmount })
  }

  const handleWaterClick = async () => {
    if (waterCount >= 6) return

    const newCount = waterCount + 1
    setWaterCount(newCount)

    const today = format(new Date(), 'yyyy-MM-dd')
    localStorage.setItem('waterCount', JSON.stringify({ date: today, count: newCount }))

    if (newCount >= 6) {
      await handleUpdateLog({ waterDone: true })
    }
  }

  const handleWorkoutToggle = async () => {
    const newState = !todayLog?.workoutDone
    if (newState) {
      await handleUpdateLog({ workoutDone: true, workoutPart: todayWorkout })
      setCelebration(true)
      setTimeout(() => setCelebration(false), 1000)

      const oldLevel = userGamification?.currentLevel || 1
      try {
        const xpRes = await fetch('/api/gamification/xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: 100,
            source: 'workout',
            description: `${todayWorkout} 운동 완료`,
          }),
        })
        const xpData = await xpRes.json()

        addXP(100, 'workout')

        if (xpData.newLevel && xpData.newLevel > oldLevel) {
          addAnimation({
            type: 'level_up',
            data: { newLevel: xpData.newLevel },
          })
        }

        const achievementRes = await fetch('/api/gamification/achievements/check', {
          method: 'POST',
        })
        const achievementData = await achievementRes.json()
        if (achievementData.newlyUnlocked && achievementData.newlyUnlocked.length > 0) {
          const firstUnlocked = achievementData.newlyUnlocked[0]
          addAnimation({
            type: 'badge_unlock',
            data: { achievement: firstUnlocked },
          })
        }

        const workoutPart = todayWorkout?.toLowerCase() || ''
        const challengeUpdates: Promise<Response>[] = []

        const challengeRes = await fetch('/api/gamification')
        const challengeData = await challengeRes.json()

        if (challengeData.userChallenges && Array.isArray(challengeData.userChallenges)) {
          for (const uc of challengeData.userChallenges) {
            const challenge = uc.challenge
            if (!challenge || uc.completed) continue

            let shouldUpdate = false

            if (challenge.key.includes('chest') && (workoutPart.includes('가슴') || workoutPart.includes('chest'))) {
              shouldUpdate = true
            } else if (challenge.key.includes('leg') && (workoutPart.includes('하체') || workoutPart.includes('leg'))) {
              shouldUpdate = true
            } else if (challenge.key.includes('back') && (workoutPart.includes('등') || workoutPart.includes('back'))) {
              shouldUpdate = true
            } else if (challenge.key.includes('workout_5') || challenge.key.includes('workout_7')) {
              shouldUpdate = true
            }

            if (shouldUpdate) {
              challengeUpdates.push(
                fetch('/api/gamification/challenges', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ challengeId: challenge.id, increment: 1 }),
                })
              )
            }
          }
        }

        if (challengeUpdates.length > 0) {
          await Promise.all(challengeUpdates)
        }

        const gamificationRes = await fetch('/api/gamification')
        const gamificationData = await gamificationRes.json()
        if (gamificationData.activeChallenges) {
          setActiveChallenges(gamificationData.activeChallenges)
        }
        if (gamificationData.userChallenges) {
          setUserChallenges(gamificationData.userChallenges)
        }

        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 180)
        const streakRes = await fetch(
          `/api/log?start=${format(start, 'yyyy-MM-dd')}&end=${format(end, 'yyyy-MM-dd')}`
        )
        const logs = await streakRes.json()
        if (logs && Array.isArray(logs)) {
          const streakData = calculateStreak(logs)
          setStreak(streakData)

          const workoutCount = logs.filter((log: { workoutDone: boolean }) => log.workoutDone).length
          setTotalWorkouts(workoutCount)

          const perfectCount = logs.filter((log: {
            waterDone: boolean
            proteinAmount: number
            cleanDiet: boolean
            workoutDone: boolean
          }) =>
            log.waterDone && log.proteinAmount >= 150 && log.cleanDiet && log.workoutDone
          ).length
          setPerfectDays(perfectCount)
        }
      } catch (e) {
        console.error('Failed to update gamification:', e)
      }
    } else {
      handleUpdateLog({ workoutDone: false, workoutPart: undefined })
    }
  }

  const handleReset = async () => {
    const resetData = {
      proteinAmount: 0,
      waterDone: false,
      cleanDiet: false,
      workoutDone: false,
      workoutPart: undefined,
    }
    updateTodayLog(resetData)
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...todayLog, ...resetData }),
    })
    setWaterCount(0)
    const today = format(new Date(), 'yyyy-MM-dd')
    localStorage.setItem('waterCount', JSON.stringify({ date: today, count: 0 }))
    setResetDialogOpen(false)
  }

  const openSettings = () => {
    if (config) {
      setSetupData({
        startWeight: config.startWeight,
        goalWeight: config.goalWeight,
        startDate: format(new Date(config.startDate), 'yyyy-MM-dd'),
      })
    }
    setIsSetupOpen(true)
  }

  // 계산값들
  const daysPassed = config?.startDate
    ? differenceInDays(new Date(), new Date(config.startDate)) + 1
    : 0
  const totalDays = 180
  const progressPercent = Math.min((daysPassed / totalDays) * 100, 100)

  const currentWeek = Math.ceil(daysPassed / 7)
  const currentPhase = PHASES.find(
    (p) => currentWeek >= p.week[0] && currentWeek <= p.week[1]
  ) || PHASES[0]

  const weightLost = config ? config.startWeight - (todayLog?.weight || config.startWeight) : 0
  const totalWeightToLose = config ? config.startWeight - config.goalWeight : 16.1
  const weightProgress = Math.min((weightLost / totalWeightToLose) * 100, 100)

  const todayWorkout = WORKOUT_ROUTINE[new Date().getDay()]
  const proteinGoal = 150
  const proteinProgress = Math.min(((todayLog?.proteinAmount || 0) / proteinGoal) * 100, 100)

  const questsCompleted = [
    waterCount >= 6,
    (todayLog?.proteinAmount || 0) >= proteinGoal,
    todayLog?.workoutDone,
  ].filter(Boolean).length

  // 스켈레톤 컴포넌트
  const SkeletonBox = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-stone-200 dark:bg-stone-800 rounded-lg ${className}`} />
  )

  const SkeletonCard = ({ className }: { className?: string }) => (
    <div className={`animate-pulse rounded-2xl bg-stone-200/80 dark:bg-stone-800/80 ${className}`} />
  )

  // 매거진 섹션 헤더 — 좌측 accent bar + 대문자 레이블
  const SectionHeader = ({ title, label }: { title: string; label?: string }) => (
    <div className="flex items-stretch gap-3 mb-6">
      <div className="w-1 rounded-full bg-stone-900 dark:bg-stone-100 flex-shrink-0" />
      <div>
        {label && <p className="editorial-label mb-0.5">{label}</p>}
        <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          {title}
        </h2>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <XPGainAnimation />
      <LevelUpModal />
      <BadgeUnlockModal />

      {/* ═══ EDITORIAL HEADER ═══ */}
      <header className="px-6 pt-7 pb-5 opacity-0 animate-fade-in-up">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="editorial-label mb-2">
              {format(new Date(), 'M월 d일 EEEE', { locale: ko })}
            </p>
            {isConfigLoading ? (
              <SkeletonBox className="h-12 w-32" />
            ) : (
              <h1 className="font-serif text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                D+{daysPassed}
                <span className="text-lg font-mono font-medium text-stone-400 dark:text-stone-600 ml-2">/{totalDays}</span>
              </h1>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              onClick={openSettings}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* 스트릭 + 퀘스트 */}
        <div className="flex items-center gap-4 mb-5 opacity-0 animate-fade-in-up animation-delay-50">
          {isStreakLoading ? (
            <SkeletonBox className="h-6 w-20" />
          ) : (
            <div className="flex items-center gap-1.5">
              <Flame className={`w-4 h-4 ${streak.todayComplete ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400'}`} />
              <span className="editorial-number text-sm text-stone-700 dark:text-stone-300">
                {streak.currentStreak}일 연속
              </span>
            </div>
          )}
          {!isConfigLoading && (
            <div className="flex items-center gap-1.5">
              <Target className={`w-4 h-4 ${questsCompleted >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`} />
              <span className="editorial-number text-sm text-stone-700 dark:text-stone-300">
                {questsCompleted}/3 퀘스트
              </span>
            </div>
          )}
        </div>

        {/* XP 바 */}
        <div className="opacity-0 animate-fade-in-up animation-delay-75">
          {isGamificationLoading ? (
            <SkeletonBox className="h-14 w-full" />
          ) : (
            <XPBar compact={false} />
          )}
        </div>
      </header>

      {/* 설정 다이얼로그 */}
      <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">설정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="editorial-label">시작 체중 (kg)</label>
              <Input
                type="number"
                step="0.1"
                value={setupData.startWeight}
                onChange={(e) => setSetupData({ ...setupData, startWeight: parseFloat(e.target.value) })}
                className="mt-1.5 h-12 text-lg"
              />
            </div>
            <div>
              <label className="editorial-label">목표 체중 (kg)</label>
              <Input
                type="number"
                step="0.1"
                value={setupData.goalWeight}
                onChange={(e) => setSetupData({ ...setupData, goalWeight: parseFloat(e.target.value) })}
                className="mt-1.5 h-12 text-lg"
              />
            </div>
            <div>
              <label className="editorial-label">시작일</label>
              <Input
                type="date"
                value={setupData.startDate}
                onChange={(e) => setSetupData({ ...setupData, startDate: e.target.value })}
                className="mt-1.5 h-12"
              />
            </div>
            <Button onClick={handleSaveSetup} className="w-full h-12 text-base font-semibold">
              저장하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ SECTION 1: 운동 ═══ */}
      <section className="px-6 pt-8 pb-10 bg-stone-50/80 dark:bg-stone-900/30 opacity-0 animate-fade-in-up animation-delay-100">
        <SectionHeader title="오늘의 운동" label="Section 01" />

        {/* 운동 메인 카드 */}
        <div className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-500 ${
          todayLog?.workoutDone
            ? 'bg-stone-900 dark:bg-stone-100'
            : 'bg-stone-800 dark:bg-stone-200'
        }`}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className={`editorial-label mb-1.5 ${todayLog?.workoutDone ? 'text-stone-400 dark:text-stone-500' : 'text-stone-400 dark:text-stone-500'}`}>
                  {format(new Date(), 'EEEE', { locale: ko })}
                </p>
                <h3 className={`font-serif text-3xl font-bold tracking-tight ${
                  todayLog?.workoutDone ? 'text-white dark:text-stone-900' : 'text-white dark:text-stone-900'
                }`}>{todayWorkout}</h3>
              </div>
              {todayLog?.workoutDone ? (
                <Trophy className="w-7 h-7 text-amber-400 dark:text-amber-600" />
              ) : (
                <Dumbbell className="w-7 h-7 text-stone-500" />
              )}
            </div>

            {todayWorkout === '휴식' ? (
              <p className="text-stone-400 dark:text-stone-500 text-sm">오늘은 휴식일입니다.</p>
            ) : (
              <Button
                size="lg"
                className={`w-full h-13 text-base font-semibold rounded-xl transition-all ${
                  celebration ? 'celebrate' : ''
                } ${
                  todayLog?.workoutDone
                    ? 'bg-white/15 hover:bg-white/25 text-white dark:bg-stone-900/20 dark:text-stone-900 border border-white/15 dark:border-stone-900/15'
                    : 'bg-white hover:bg-stone-100 text-stone-900 dark:bg-stone-900 dark:hover:bg-stone-800 dark:text-stone-100'
                }`}
                onClick={handleWorkoutToggle}
              >
                {todayLog?.workoutDone ? (
                  <>
                    <Trophy className="w-5 h-5 mr-2 text-amber-400" />
                    완료! +100 XP
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    운동 완료하기
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* 물 + 단백질 */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* 물 */}
          <div className={`p-4 rounded-xl border transition-all ${
            waterCount >= 6
              ? 'bg-teal-50/60 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-800/40'
              : 'bg-card border-border'
          }`}>
            <p className="editorial-label mb-1.5">Water</p>
            <p className={`editorial-number text-2xl mb-2.5 ${waterCount >= 6 ? 'text-teal-700 dark:text-teal-400' : 'text-stone-800 dark:text-stone-200'}`}>
              {waterCount * 500}<span className="text-xs font-medium text-stone-400 ml-0.5">ml</span>
            </p>
            <div className="grid grid-cols-6 gap-1 mb-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i < waterCount ? 'bg-teal-500 dark:bg-teal-400' : 'bg-stone-200 dark:bg-stone-700'
                  }`}
                />
              ))}
            </div>
            <Button
              onClick={handleWaterClick}
              disabled={waterCount >= 6}
              size="sm"
              variant="outline"
              className={`w-full h-8 text-xs font-semibold ${
                waterCount >= 6
                  ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-600'
                  : 'border-stone-300 dark:border-stone-600'
              }`}
            >
              {waterCount >= 6 ? '완료' : '+500ml'}
            </Button>
          </div>

          {/* 단백질 */}
          <div className={`p-4 rounded-xl border transition-all ${
            proteinProgress >= 100
              ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40'
              : 'bg-card border-border'
          }`}>
            <p className="editorial-label mb-1.5">Protein</p>
            <p className={`editorial-number text-2xl mb-2.5 ${proteinProgress >= 100 ? 'text-amber-700 dark:text-amber-400' : 'text-stone-800 dark:text-stone-200'}`}>
              {todayLog?.proteinAmount || 0}<span className="text-xs font-medium text-stone-400 ml-0.5">g</span>
            </p>
            <div className="h-1 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden mb-3">
              <div
                className="h-full bg-amber-600 dark:bg-amber-500 rounded-full transition-all"
                style={{ width: `${proteinProgress}%` }}
              />
            </div>
            <Dialog open={proteinDialogOpen} onOpenChange={setProteinDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className={`w-full h-8 text-xs font-semibold ${
                    proteinProgress >= 100
                      ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-600'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                >
                  {proteinProgress >= 100 ? '완료' : '+ 추가'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xs">
                <DialogHeader>
                  <DialogTitle className="font-serif text-lg">단백질 추가</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 pt-4">
                  {PROTEIN_FOODS.map((food) => (
                    <Button
                      key={food.name}
                      variant="outline"
                      className="h-24 flex flex-col hover:bg-secondary touch-scale"
                      onClick={() => addProtein(food.protein)}
                    >
                      <span className="text-3xl mb-1">{food.emoji}</span>
                      <span className="text-xs font-medium">{food.name}</span>
                      <span className="text-xs text-primary font-mono">+{food.protein}g</span>
                    </Button>
                  ))}
                </div>
                <div className="text-center pt-2">
                  <p className="text-3xl font-bold gradient-text">{todayLog?.proteinAmount || 0}g</p>
                  <p className="text-sm text-muted-foreground">/ {proteinGoal}g 목표</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2: 식단 관리 ═══ */}
      <section className="px-6 pt-8 pb-10 opacity-0 animate-fade-in-up animation-delay-200">
        <SectionHeader title="식단 관리" label="Section 02" />
        <DietStatusCard />
      </section>

      {/* ═══ SECTION 3: COGNITIVE SHIELD ═══ */}
      <section className="px-6 pt-8 pb-10 bg-stone-50/80 dark:bg-stone-900/30 opacity-0 animate-fade-in-up animation-delay-250">
        <SectionHeader title="Cognitive Shield" label="Section 03" />

        <CognitiveShield
          currentStreak={streak.currentStreak}
          totalWorkouts={totalWorkouts}
          perfectDays={perfectDays}
        />

        {/* 명언 */}
        {thielQuote && (
          <div className="mt-5 py-4 border-t border-b border-stone-200/60 dark:border-stone-800/60">
            <Quote className="w-5 h-5 text-stone-300 dark:text-stone-700 mb-2" />
            <p className="font-serif text-base text-stone-700 dark:text-stone-300 leading-relaxed italic">
              &ldquo;{thielQuote}&rdquo;
            </p>
            <p className="editorial-label mt-2">Peter Thiel</p>
          </div>
        )}

        {/* 진행 상황 */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="editorial-label">현재 단계</p>
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">{currentPhase.name}</p>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-stone-500 dark:text-stone-500 font-medium">전체 진행</span>
              <span className="editorial-number text-stone-700 dark:text-stone-300">{progressPercent.toFixed(0)}%</span>
            </div>
            <div className="h-1 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-stone-700 dark:bg-stone-300 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-stone-500 dark:text-stone-500 font-medium">체중 목표</span>
              <span className="editorial-number text-stone-700 dark:text-stone-300">{weightLost.toFixed(1)}/{totalWeightToLose.toFixed(1)}kg</span>
            </div>
            <div className="h-1 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full transition-all"
                style={{ width: `${weightProgress}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 4: 챌린지 ═══ */}
      <section className="px-6 pt-8 pb-10 opacity-0 animate-fade-in-up animation-delay-300">
        <SectionHeader title="이번 주 챌린지" label="Section 04" />

        {isGamificationLoading ? (
          <div className="space-y-3">
            <SkeletonCard className="h-20 w-full" />
            <SkeletonCard className="h-20 w-full" />
          </div>
        ) : (
          <ChallengeList />
        )}
      </section>

      {/* 하단 리셋 */}
      <div className="flex justify-center py-5 pb-8 opacity-0 animate-fade-in-up animation-delay-350">
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs text-stone-400 hover:text-stone-600 dark:text-stone-600 dark:hover:text-stone-400"
            >
              <RotateCcw className="w-3 h-3 mr-1.5" />
              오늘 기록 초기화
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle className="font-serif text-lg">오늘 기록 초기화</DialogTitle>
            </DialogHeader>
            <div className="pt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                오늘의 모든 기록이 초기화됩니다. 계속하시겠습니까?
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setResetDialogOpen(false)}>
                  취소
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleReset}>
                  초기화
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
