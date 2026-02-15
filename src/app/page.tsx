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
    <div className={`animate-pulse bg-slate-200 dark:bg-zinc-800 rounded-lg ${className}`} />
  )

  const SkeletonCard = ({ className }: { className?: string }) => (
    <div className={`animate-pulse rounded-2xl bg-slate-200/80 dark:bg-zinc-800/80 ${className}`} />
  )

  // 섹션 라벨 컴포넌트
  const SectionLabel = ({ icon: Icon, label, accentColor }: { icon: React.ElementType, label: string, accentColor: string }) => (
    <div className="flex items-center gap-2.5 mb-4">
      <div className={`w-1 h-5 rounded-full ${accentColor}`} />
      <Icon className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-500">
        {label}
      </span>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      {/* Animations */}
      <XPGainAnimation />
      <LevelUpModal />
      <BadgeUnlockModal />

      {/* ═══════════════════════════════════════════════
          COMPACT HEADER
      ═══════════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-zinc-900 dark:to-zinc-950" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-400/8 to-transparent rounded-full blur-3xl dark:from-violet-500/10" />

        <div className="relative px-5 pt-6 pb-4">
          {/* 날짜 & 설정 */}
          <div className="flex items-center justify-between mb-3 opacity-0 animate-fade-in-up">
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-500">
              {format(new Date(), 'M월 d일 EEEE', { locale: ko })}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/60 dark:hover:bg-zinc-800/60"
                onClick={openSettings}
              >
                <Settings className="w-4 h-4" />
              </Button>
              <ThemeToggle />
            </div>
          </div>

          {/* D+DAY + 핵심 통계 */}
          <div className="flex items-end justify-between mb-4 opacity-0 animate-fade-in-up animation-delay-50">
            <div>
              {isConfigLoading ? (
                <SkeletonBox className="h-10 w-28" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tighter gradient-text">D+{daysPassed}</span>
                  <span className="text-xs font-mono font-semibold text-slate-400 dark:text-zinc-500">/ {totalDays}</span>
                </div>
              )}
            </div>

            {/* 스트릭 + 퀘스트 미니 */}
            <div className="flex items-center gap-3">
              {isStreakLoading ? (
                <SkeletonBox className="h-8 w-16" />
              ) : (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                  streak.todayComplete
                    ? 'bg-orange-100 dark:bg-orange-950/50'
                    : 'bg-slate-100 dark:bg-zinc-900'
                }`}>
                  <Flame className={`w-3.5 h-3.5 ${streak.todayComplete ? 'text-orange-500' : 'text-slate-400'}`} />
                  <span className={`text-sm font-black font-mono ${streak.todayComplete ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-zinc-400'}`}>
                    {streak.currentStreak}
                  </span>
                </div>
              )}
              {!isConfigLoading && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                  questsCompleted >= 3
                    ? 'bg-emerald-100 dark:bg-emerald-950/50'
                    : 'bg-slate-100 dark:bg-zinc-900'
                }`}>
                  <Target className={`w-3.5 h-3.5 ${questsCompleted >= 3 ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <span className={`text-sm font-black font-mono ${questsCompleted >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-zinc-400'}`}>
                    {questsCompleted}/3
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* XP 바 */}
          <div className="opacity-0 animate-fade-in-up animation-delay-75">
            {isGamificationLoading ? (
              <SkeletonBox className="h-16 w-full rounded-xl" />
            ) : (
              <XPBar compact={false} />
            )}
          </div>
        </div>
      </div>

      {/* 설정 다이얼로그 */}
      <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
        <DialogContent className="max-w-sm mx-auto glass-card border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold gradient-text">설정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">시작 체중 (kg)</label>
              <Input
                type="number"
                step="0.1"
                value={setupData.startWeight}
                onChange={(e) => setSetupData({ ...setupData, startWeight: parseFloat(e.target.value) })}
                className="mt-1 bg-secondary/50 border-0 h-12 text-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">목표 체중 (kg)</label>
              <Input
                type="number"
                step="0.1"
                value={setupData.goalWeight}
                onChange={(e) => setSetupData({ ...setupData, goalWeight: parseFloat(e.target.value) })}
                className="mt-1 bg-secondary/50 border-0 h-12 text-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">시작일</label>
              <Input
                type="date"
                value={setupData.startDate}
                onChange={(e) => setSetupData({ ...setupData, startDate: e.target.value })}
                className="mt-1 bg-secondary/50 border-0 h-12"
              />
            </div>
            <Button onClick={handleSaveSetup} className="w-full h-12 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              저장하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════
          SECTION 1: 운동
      ═══════════════════════════════════════════════ */}
      <div className="px-5 pt-6 pb-2 opacity-0 animate-fade-in-up animation-delay-100">
        <SectionLabel icon={Dumbbell} label="오늘의 운동" accentColor="bg-violet-500" />

        {/* 운동 메인 카드 */}
        <div className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-500 ${
          todayLog?.workoutDone
            ? 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-xl shadow-violet-500/25'
            : 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 shadow-lg'
        }`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-28 h-28 border-4 border-white rounded-full" />
            <div className="absolute bottom-4 left-4 w-16 h-16 border-2 border-white rounded-full" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
                  {format(new Date(), 'EEEE', { locale: ko })}
                </p>
                <h2 className="text-white text-3xl font-black tracking-tight">{todayWorkout}</h2>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                todayLog?.workoutDone ? 'bg-white/20' : 'bg-white/10'
              }`}>
                {todayLog?.workoutDone ? (
                  <Trophy className="w-6 h-6 text-amber-300" />
                ) : (
                  <Dumbbell className="w-6 h-6 text-white/60" />
                )}
              </div>
            </div>

            {todayWorkout === '휴식' ? (
              <p className="text-white/60 text-sm">오늘은 휴식일입니다. 충분히 쉬세요!</p>
            ) : (
              <Button
                size="lg"
                className={`w-full h-13 text-base font-bold rounded-xl transition-all ${
                  celebration ? 'celebrate' : ''
                } ${
                  todayLog?.workoutDone
                    ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
                    : 'bg-white hover:bg-white/90 text-slate-900'
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

        {/* 물 + 단백질 2열 */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          {/* 물 카드 */}
          <div className={`p-4 rounded-2xl transition-all border ${
            waterCount >= 6
              ? 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200/80 dark:border-cyan-800/50'
              : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800'
          }`}>
            <div className="flex items-center gap-1.5 mb-2">
              <Droplets className={`w-4 h-4 ${waterCount >= 6 ? 'text-cyan-500' : 'text-slate-400'}`} />
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-400 dark:text-zinc-500">Water</span>
            </div>
            <p className={`text-2xl font-black font-mono mb-2 ${waterCount >= 6 ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-700 dark:text-zinc-300'}`}>
              {waterCount * 500}<span className="text-[10px] font-semibold text-slate-400 ml-0.5">ml</span>
            </p>
            <div className="grid grid-cols-6 gap-1 mb-2.5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i < waterCount ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-zinc-700'
                  }`}
                />
              ))}
            </div>
            <Button
              onClick={handleWaterClick}
              disabled={waterCount >= 6}
              size="sm"
              className={`w-full h-8 text-xs font-bold rounded-lg ${
                waterCount >= 6
                  ? 'bg-cyan-500 text-white cursor-default'
                  : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-600 dark:text-cyan-400'
              }`}
            >
              {waterCount >= 6 ? '완료' : '+500ml'}
            </Button>
          </div>

          {/* 단백질 카드 */}
          <div className={`p-4 rounded-2xl transition-all border ${
            proteinProgress >= 100
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-800/50'
              : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800'
          }`}>
            <div className="flex items-center gap-1.5 mb-2">
              <Utensils className={`w-4 h-4 ${proteinProgress >= 100 ? 'text-rose-500' : 'text-slate-400'}`} />
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-400 dark:text-zinc-500">Protein</span>
            </div>
            <p className={`text-2xl font-black font-mono mb-2 ${proteinProgress >= 100 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-zinc-300'}`}>
              {todayLog?.proteinAmount || 0}<span className="text-[10px] font-semibold text-slate-400 ml-0.5">g</span>
            </p>
            <div className="h-1 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden mb-2.5">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full transition-all"
                style={{ width: `${proteinProgress}%` }}
              />
            </div>
            <Dialog open={proteinDialogOpen} onOpenChange={setProteinDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className={`w-full h-8 text-xs font-bold rounded-lg ${
                    proteinProgress >= 100
                      ? 'bg-rose-500 text-white cursor-default'
                      : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {proteinProgress >= 100 ? '완료' : '+ 추가'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xs glass-card border-0">
                <DialogHeader>
                  <DialogTitle className="text-lg">단백질 추가</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 pt-4">
                  {PROTEIN_FOODS.map((food) => (
                    <Button
                      key={food.name}
                      variant="outline"
                      className="h-24 flex flex-col bg-secondary/50 border-0 hover:bg-secondary touch-scale"
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
      </div>

      {/* 섹션 디바이더 */}
      <div className="mx-5 my-4 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-zinc-800 to-transparent" />

      {/* ═══════════════════════════════════════════════
          SECTION 2: 식단 관리
      ═══════════════════════════════════════════════ */}
      <div className="px-5 pb-2 opacity-0 animate-fade-in-up animation-delay-200">
        <SectionLabel icon={Utensils} label="식단 관리" accentColor="bg-orange-500" />
        <DietStatusCard />
      </div>

      {/* 섹션 디바이더 */}
      <div className="mx-5 my-4 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-zinc-800 to-transparent" />

      {/* ═══════════════════════════════════════════════
          SECTION 3: COGNITIVE SHIELD
      ═══════════════════════════════════════════════ */}
      <div className="px-5 pb-2 opacity-0 animate-fade-in-up animation-delay-250">
        <SectionLabel icon={Brain} label="Cognitive Shield" accentColor="bg-amber-500" />

        <CognitiveShield
          currentStreak={streak.currentStreak}
          totalWorkouts={totalWorkouts}
          perfectDays={perfectDays}
        />

        {/* 명언 카드 */}
        {thielQuote && (
          <div className="mt-3 relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/40 dark:border-amber-800/30">
            <Quote className="absolute top-3 right-3 w-7 h-7 text-amber-300/40 dark:text-amber-700/40" />
            <div className="flex items-start gap-3">
              <div className="w-1 h-10 rounded-full bg-amber-400/60 dark:bg-amber-600/50 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 dark:text-amber-200/80 font-medium leading-relaxed italic">
                  &ldquo;{thielQuote}&rdquo;
                </p>
                <p className="text-[10px] text-amber-600/60 dark:text-amber-400/50 mt-1.5 font-bold uppercase tracking-wider">Peter Thiel</p>
              </div>
            </div>
          </div>
        )}

        {/* 진행 상황 요약 */}
        <div className="mt-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.15em]">현재 단계</p>
              <p className="text-base font-bold text-slate-700 dark:text-zinc-300">{currentPhase.name}</p>
            </div>
            <Activity className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 dark:text-zinc-500 font-medium">전체 진행</span>
                <span className="font-bold font-mono text-slate-600 dark:text-zinc-400">{progressPercent.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 dark:text-zinc-500 font-medium">체중 목표</span>
                <span className="font-bold font-mono text-slate-600 dark:text-zinc-400">{weightLost.toFixed(1)}/{totalWeightToLose.toFixed(1)}kg</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${weightProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 섹션 디바이더 */}
      <div className="mx-5 my-4 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-zinc-800 to-transparent" />

      {/* ═══════════════════════════════════════════════
          SECTION 4: 챌린지
      ═══════════════════════════════════════════════ */}
      <div className="px-5 pb-2 opacity-0 animate-fade-in-up animation-delay-300">
        <SectionLabel icon={Target} label="이번 주 챌린지" accentColor="bg-emerald-500" />

        {isGamificationLoading ? (
          <div className="space-y-3">
            <SkeletonCard className="h-20 w-full" />
            <SkeletonCard className="h-20 w-full" />
          </div>
        ) : (
          <ChallengeList />
        )}
      </div>

      {/* 하단 리셋 버튼 */}
      <div className="flex justify-center py-6 opacity-0 animate-fade-in-up animation-delay-350">
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs text-slate-400 hover:text-slate-600 dark:text-zinc-600 dark:hover:text-zinc-400"
            >
              <RotateCcw className="w-3 h-3 mr-1.5" />
              오늘 기록 초기화
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xs glass-card border-0">
            <DialogHeader>
              <DialogTitle className="text-lg">오늘 기록 초기화</DialogTitle>
            </DialogHeader>
            <div className="pt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                오늘의 모든 기록이 초기화됩니다. 계속하시겠습니까?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setResetDialogOpen(false)}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleReset}
                >
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
