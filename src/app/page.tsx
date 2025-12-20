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

  // 물 섭취량 로드 (localStorage에서)
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const savedWaterData = localStorage.getItem('waterCount')
    if (savedWaterData) {
      const { date, count } = JSON.parse(savedWaterData)
      if (date === today) {
        setWaterCount(count)
      } else {
        // 새 날짜면 초기화
        localStorage.setItem('waterCount', JSON.stringify({ date: today, count: 0 }))
      }
    }
  }, [])

  // todayLog가 로드되면 waterDone 상태와 동기화
  useEffect(() => {
    if (todayLog?.waterDone) {
      // 이미 완료 상태면 6으로 설정
      const today = format(new Date(), 'yyyy-MM-dd')
      const savedWaterData = localStorage.getItem('waterCount')
      if (savedWaterData) {
        const { date, count } = JSON.parse(savedWaterData)
        if (date === today && count >= 6) return // 이미 동기화됨
      }
      setWaterCount(6)
      localStorage.setItem('waterCount', JSON.stringify({ date: today, count: 6 }))
    }
  }, [todayLog?.waterDone])

  // 피터 틸 명언 설정 (하루에 한 번만 변경)
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
      const configRes = await fetch('/api/config')
      const configData = await configRes.json()
      if (configData) {
        setConfig(configData)
      } else {
        setIsSetupOpen(true)
      }

      const logRes = await fetch('/api/log')
      const logData = await logRes.json()
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

      // 최신 인바디 점수 로드
      try {
        const inbodyRes = await fetch('/api/inbody?latest=true')
        const inbodyData = await inbodyRes.json()
        if (inbodyData?.inbodyScore) {
          setLatestInbody(inbodyData)
        }
      } catch (e) {
        console.log('No inbody data')
      }

      // 스트릭 계산 및 인지 방패 데이터
      try {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 180) // 최근 180일 (전체 기간)
        const streakRes = await fetch(
          `/api/log?start=${format(start, 'yyyy-MM-dd')}&end=${format(end, 'yyyy-MM-dd')}`
        )
        const logs = await streakRes.json()
        if (logs && Array.isArray(logs)) {
          const streakData = calculateStreak(logs)
          setStreak(streakData)

          // 인지 방패용 데이터 계산
          const workoutCount = logs.filter((log: { workoutDone: boolean }) => log.workoutDone).length
          setTotalWorkouts(workoutCount)

          // 퍼펙트 데이 계산 (모든 퀘스트 + 운동 완료)
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
        console.log('No streak data')
      }

      // 게이미피케이션 데이터 로드
      try {
        const gamificationRes = await fetch('/api/gamification')
        const gamificationData = await gamificationRes.json()
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
      } catch (e) {
        console.log('No gamification data')
      }
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
    // 날짜별로 정렬 (최신순)
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // 완료된 날짜 체크 (모든 퀘스트 완료)
    const isComplete = (log: typeof sortedLogs[0]) =>
      log.waterDone && log.proteinAmount >= 150 && log.cleanDiet && log.workoutDone

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    const today = format(new Date(), 'yyyy-MM-dd')
    let todayComplete = false

    // 오늘 완료 여부 체크
    const todayLog = sortedLogs.find(log => log.date === today)
    if (todayLog && isComplete(todayLog)) {
      todayComplete = true
    }

    // 연속 스트릭 계산
    let expectedDate = new Date()

    for (const log of sortedLogs) {
      const logDate = format(new Date(log.date), 'yyyy-MM-dd')
      const expectedDateStr = format(expectedDate, 'yyyy-MM-dd')

      if (logDate === expectedDateStr) {
        if (isComplete(log)) {
          tempStreak++
          longestStreak = Math.max(longestStreak, tempStreak)
        } else {
          // 오늘이 아니면 스트릭 끊김
          if (logDate !== today) {
            if (currentStreak === 0) currentStreak = tempStreak
            tempStreak = 0
          }
        }
        expectedDate.setDate(expectedDate.getDate() - 1)
      } else {
        // 날짜가 건너뛰어졌으면 스트릭 끊김
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
    if (waterCount >= 6) return // 이미 완료

    const newCount = waterCount + 1
    setWaterCount(newCount)

    const today = format(new Date(), 'yyyy-MM-dd')
    localStorage.setItem('waterCount', JSON.stringify({ date: today, count: newCount }))

    // 6번째 클릭 시 waterDone: true로 저장
    if (newCount >= 6) {
      await handleUpdateLog({ waterDone: true })
    }
  }

const handleWorkoutToggle = async () => {
    const newState = !todayLog?.workoutDone
    if (newState) {
      // 운동 완료 - 로그 먼저 업데이트 (챌린지 진행 포함)
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

        // 챌린지 진행도 업데이트
        // 운동 부위에 따른 챌린지 매칭
        const workoutPart = todayWorkout?.toLowerCase() || ''
        const challengeUpdates: Promise<Response>[] = []

        // 활성 챌린지 조회 후 해당하는 챌린지 업데이트
        const challengeRes = await fetch('/api/gamification')
        const challengeData = await challengeRes.json()

        if (challengeData.userChallenges && Array.isArray(challengeData.userChallenges)) {
          for (const uc of challengeData.userChallenges) {
            const challenge = uc.challenge
            if (!challenge || uc.completed) continue

            let shouldUpdate = false

            // 운동 부위별 챌린지 매칭
            if (challenge.key.includes('chest') && (workoutPart.includes('가슴') || workoutPart.includes('chest'))) {
              shouldUpdate = true
            } else if (challenge.key.includes('leg') && (workoutPart.includes('하체') || workoutPart.includes('leg'))) {
              shouldUpdate = true
            } else if (challenge.key.includes('back') && (workoutPart.includes('등') || workoutPart.includes('back'))) {
              shouldUpdate = true
            } else if (challenge.key.includes('workout_5') || challenge.key.includes('workout_7')) {
              // 일반 운동 횟수 챌린지
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

        // 모든 챌린지 업데이트 실행
        if (challengeUpdates.length > 0) {
          await Promise.all(challengeUpdates)
        }

        // 챌린지 데이터 새로고침
        const gamificationRes = await fetch('/api/gamification')
        const gamificationData = await gamificationRes.json()
        if (gamificationData.activeChallenges) {
          setActiveChallenges(gamificationData.activeChallenges)
        }
        if (gamificationData.userChallenges) {
          setUserChallenges(gamificationData.userChallenges)
        }

        // 스트릭, 운동횟수, 퍼펙트데이 새로고침 (Cognitive Shield 업데이트용)
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
    // 물 섭취량도 초기화
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

  // 퀘스트 완료 개수
  const questsCompleted = [
    waterCount >= 6,
    (todayLog?.proteinAmount || 0) >= proteinGoal,
    todayLog?.workoutDone,
  ].filter(Boolean).length

  if (!config) {
    return (
      <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
        <DialogContent className="max-w-sm mx-auto glass-card border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold gradient-text">시작 설정</DialogTitle>
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
              시작하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* XP 획득 애니메이션 */}
      <XPGainAnimation />

      {/* 레벨업 모달 */}
      <LevelUpModal />

      {/* 뱃지 언락 모달 */}
      <BadgeUnlockModal />

      {/* ═══════════════════════════════════════════════
          HERO SECTION - 헤더 & 핵심 통계
      ═══════════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        {/* 배경 그라데이션 효과 */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 via-purple-500/5 to-fuchsia-500/8 dark:from-violet-500/15 dark:via-purple-500/10 dark:to-fuchsia-500/15" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-amber-400/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-400/10 to-transparent rounded-full blur-2xl" />

        <div className="relative px-5 pt-6 pb-5">
          {/* 헤더 - 날짜 & 설정 */}
          <div className="flex items-center justify-between mb-4 opacity-0 animate-fade-in-up">
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

          {/* D+DAY 대형 디스플레이 */}
          <div className="flex items-end justify-between mb-5 opacity-0 animate-fade-in-up animation-delay-50">
            <div>
              <span className="text-5xl font-black tracking-tighter gradient-text">D+{daysPassed}</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-24 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">180일</span>
              </div>
            </div>

            {/* 인바디 점수 뱃지 */}
            {latestInbody && (
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-semibold">INBODY</span>
                <span className="text-3xl font-black text-amber-500 dark:text-amber-400">{latestInbody.inbodyScore}</span>
              </div>
            )}
          </div>

          {/* XP 바 */}
          <div className="opacity-0 animate-fade-in-up animation-delay-75">
            <XPBar compact={false} />
          </div>

          {/* 스트릭 + 퀘스트 미니 카드 (2열) */}
          <div className="grid grid-cols-2 gap-3 mt-4 opacity-0 animate-fade-in-up animation-delay-100">
            {/* 스트릭 미니 */}
            <div className={`p-4 rounded-2xl backdrop-blur-sm transition-all ${
              streak.todayComplete
                ? 'bg-gradient-to-br from-orange-200/80 to-amber-100/60 dark:from-orange-950/60 dark:to-amber-950/40 border border-orange-300/60 dark:border-orange-700/40 shadow-lg shadow-orange-200/40 dark:shadow-orange-900/30'
                : 'bg-white/70 dark:bg-zinc-900/70 border border-slate-200/60 dark:border-zinc-700/60 shadow-sm'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <Flame className={`w-4 h-4 ${streak.todayComplete ? 'text-orange-500' : 'text-slate-400 dark:text-zinc-500'}`} />
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500">STREAK</span>
              </div>
              <p className={`text-3xl font-black ${streak.todayComplete ? 'text-orange-600 dark:text-orange-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                {streak.currentStreak}<span className="text-sm font-semibold text-slate-400 dark:text-zinc-500 ml-0.5">일</span>
              </p>
            </div>

            {/* 퀘스트 미니 */}
            <div className={`p-4 rounded-2xl backdrop-blur-sm transition-all ${
              questsCompleted >= 3
                ? 'bg-gradient-to-br from-emerald-200/80 to-green-100/60 dark:from-emerald-950/60 dark:to-green-950/40 border border-emerald-300/60 dark:border-emerald-700/40 shadow-lg shadow-emerald-200/40 dark:shadow-emerald-900/30'
                : 'bg-white/70 dark:bg-zinc-900/70 border border-slate-200/60 dark:border-zinc-700/60 shadow-sm'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <Target className={`w-4 h-4 ${questsCompleted >= 3 ? 'text-emerald-500' : 'text-slate-400 dark:text-zinc-500'}`} />
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500">QUEST</span>
              </div>
              <p className={`text-3xl font-black ${questsCompleted >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                {questsCompleted}<span className="text-sm font-semibold text-slate-400 dark:text-zinc-500 ml-0.5">/3</span>
              </p>
            </div>
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

      {/* 메인 콘텐츠 영역 */}
      <div className="px-5 pb-8 space-y-4">

        {/* ═══════════════════════════════════════════════
            오늘의 운동 - 메인 CTA (가장 중요한 액션)
        ═══════════════════════════════════════════════ */}
        <div className="opacity-0 animate-fade-in-up animation-delay-150">
          <div className={`relative overflow-hidden rounded-3xl p-5 transition-all duration-500 ${
            todayLog?.workoutDone
              ? 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-xl shadow-violet-500/30'
              : 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 shadow-xl shadow-slate-500/20 dark:shadow-black/30'
          }`}>
            {/* 배경 패턴 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-32 h-32 border-4 border-white rounded-full" />
              <div className="absolute bottom-4 left-4 w-20 h-20 border-2 border-white rounded-full" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">
                    {format(new Date(), 'EEEE', { locale: ko })} 운동
                  </p>
                  <h2 className="text-white text-3xl font-black">{todayWorkout}</h2>
                </div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  todayLog?.workoutDone ? 'bg-white/20' : 'bg-white/10'
                }`}>
                  {todayLog?.workoutDone ? (
                    <Trophy className="w-7 h-7 text-amber-300" />
                  ) : (
                    <Dumbbell className="w-7 h-7 text-white/70" />
                  )}
                </div>
              </div>

              {todayWorkout === '휴식' ? (
                <p className="text-white/70 text-sm">오늘은 휴식일입니다. 충분히 쉬세요!</p>
              ) : (
                <Button
                  size="lg"
                  className={`w-full h-14 text-lg font-bold rounded-2xl transition-all ${
                    celebration ? 'celebrate' : ''
                  } ${
                    todayLog?.workoutDone
                      ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
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
        </div>

        {/* ═══════════════════════════════════════════════
            물 + 단백질 - 2열 컴팩트 레이아웃
        ═══════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3 opacity-0 animate-fade-in-up animation-delay-200">
          {/* 물 카드 */}
          <div className={`p-4 rounded-2xl transition-all ${
            waterCount >= 6
              ? 'bg-gradient-to-br from-cyan-200/90 to-blue-100/70 dark:from-cyan-900/50 dark:to-blue-900/40 border border-cyan-300/60 dark:border-cyan-700/50 shadow-lg shadow-cyan-200/40 dark:shadow-cyan-900/30'
              : 'bg-white/80 dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-700/60 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Droplets className={`w-5 h-5 ${waterCount >= 6 ? 'text-cyan-500' : 'text-slate-400'}`} />
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500">WATER</span>
            </div>
            <p className={`text-2xl font-black mb-2 ${waterCount >= 6 ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-700 dark:text-zinc-300'}`}>
              {waterCount * 500}<span className="text-xs font-semibold text-slate-400 ml-0.5">ml</span>
            </p>
            {/* 미니 진행 바 */}
            <div className="grid grid-cols-6 gap-1 mb-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
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
                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-600 dark:text-cyan-400'
              }`}
            >
              {waterCount >= 6 ? '✓ 완료' : '+500ml'}
            </Button>
          </div>

          {/* 단백질 카드 */}
          <div className={`p-4 rounded-2xl transition-all ${
            proteinProgress >= 100
              ? 'bg-gradient-to-br from-rose-200/90 to-orange-100/70 dark:from-rose-900/50 dark:to-orange-900/40 border border-rose-300/60 dark:border-rose-700/50 shadow-lg shadow-rose-200/40 dark:shadow-rose-900/30'
              : 'bg-white/80 dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-700/60 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Utensils className={`w-5 h-5 ${proteinProgress >= 100 ? 'text-rose-500' : 'text-slate-400'}`} />
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500">PROTEIN</span>
            </div>
            <p className={`text-2xl font-black mb-2 ${proteinProgress >= 100 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-zinc-300'}`}>
              {todayLog?.proteinAmount || 0}<span className="text-xs font-semibold text-slate-400 ml-0.5">g</span>
            </p>
            {/* 프로그레스 바 */}
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden mb-2">
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
                      : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {proteinProgress >= 100 ? '✓ 완료' : '+ 추가'}
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

        {/* ═══════════════════════════════════════════════
            피터 틸 명언 - 영감 섹션
        ═══════════════════════════════════════════════ */}
        {thielQuote && (
          <div className="opacity-0 animate-fade-in-up animation-delay-225">
            <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-violet-100/80 via-purple-50/60 to-fuchsia-50/40 dark:from-violet-950/50 dark:via-purple-950/40 dark:to-fuchsia-950/30 border border-violet-200/50 dark:border-violet-800/30">
              <Quote className="absolute top-3 right-3 w-8 h-8 text-violet-300/50 dark:text-violet-700/50" />
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-violet-500 dark:text-violet-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-violet-700 dark:text-violet-300 font-medium leading-relaxed">
                    &ldquo;{thielQuote}&rdquo;
                  </p>
                  <p className="text-xs text-violet-500/70 dark:text-violet-400/60 mt-1 font-semibold">— 피터 틸</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            인지 방패 + 다이어트 상태
        ═══════════════════════════════════════════════ */}
        <div className="space-y-3 opacity-0 animate-fade-in-up animation-delay-250">
          <CognitiveShield
            currentStreak={streak.currentStreak}
            totalWorkouts={totalWorkouts}
            perfectDays={perfectDays}
          />
          <DietStatusCard />
        </div>

        {/* ═══════════════════════════════════════════════
            진행 상황 요약 카드
        ═══════════════════════════════════════════════ */}
        <div className="opacity-0 animate-fade-in-up animation-delay-275">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-100/80 via-orange-50/60 to-yellow-50/40 dark:from-amber-950/50 dark:via-orange-950/40 dark:to-yellow-950/30 border border-amber-200/50 dark:border-amber-800/30 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider">현재 단계</p>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{currentPhase.name}</p>
              </div>
              <Activity className="w-6 h-6 text-amber-500" />
            </div>

            {/* 진행률 바 */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-600/70 dark:text-amber-400/70 font-medium">전체 진행</span>
                  <span className="font-bold text-amber-700 dark:text-amber-300">{progressPercent.toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-amber-200/50 dark:bg-amber-900/30 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-600/70 dark:text-amber-400/70 font-medium">체중 목표</span>
                  <span className="font-bold text-amber-700 dark:text-amber-300">{weightLost.toFixed(1)}/{totalWeightToLose.toFixed(1)}kg</span>
                </div>
                <div className="h-2 rounded-full bg-amber-200/50 dark:bg-amber-900/30 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${weightProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            챌린지 섹션
        ═══════════════════════════════════════════════ */}
        <div className="opacity-0 animate-fade-in-up animation-delay-300">
          <ChallengeList />
        </div>

        {/* 하단 여백 & 초기화 버튼 */}
        <div className="flex justify-center pt-4 opacity-0 animate-fade-in-up animation-delay-350">
          <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
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
    </div>
  )
}
