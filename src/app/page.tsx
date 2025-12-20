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
    <div className="p-4 space-y-4">
      {/* XP 획득 애니메이션 */}
      <XPGainAnimation />

      {/* 레벨업 모달 */}
      <LevelUpModal />

      {/* 뱃지 언락 모달 */}
      <BadgeUnlockModal />

      {/* 헤더 - 인사말 & D-Day */}
      <div className="pt-2 pb-4 opacity-0 animate-fade-in-up">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-sm">
              {format(new Date(), 'M월 d일 EEEE', { locale: ko })}
            </p>
            <h1 className="text-2xl font-bold mt-1">
              <span className="gradient-text">D+{daysPassed}</span>
              <span className="text-muted-foreground text-lg font-normal ml-2">/ 180일</span>
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 text-muted-foreground hover:text-foreground"
              onClick={openSettings}
            >
              <Settings className="w-5 h-5" />
            </Button>
            <ThemeToggle />
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

      {/* 피터 틸 명언 (인지 성능 철학) */}
      {thielQuote && (
        <div className="opacity-0 animate-fade-in-up animation-delay-50">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
            <Brain className="w-5 h-5 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-violet-700 dark:text-violet-300 font-medium leading-relaxed">
                &ldquo;{thielQuote}&rdquo;
              </p>
              <p className="text-xs text-violet-600/70 dark:text-violet-400/60 mt-1">— 피터 틸</p>
            </div>
          </div>
        </div>
      )}

      {/* XP 바 */}
      <div className="opacity-0 animate-fade-in-up animation-delay-100">
        <XPBar compact={false} />
      </div>

      {/* 인지 방패 (피터 틸 철학) */}
      <div className="opacity-0 animate-fade-in-up animation-delay-150">
        <CognitiveShield
          currentStreak={streak.currentStreak}
          totalWorkouts={totalWorkouts}
          perfectDays={perfectDays}
        />
      </div>

      {/* 스위치온 다이어트 상태 카드 */}
      <div className="opacity-0 animate-fade-in-up animation-delay-175">
        <DietStatusCard />
      </div>

      {/* 연속 달성 스트릭 (강화된 버전) */}
      <div className="opacity-0 animate-fade-in-up animation-delay-100">
        <StreakCard
          currentStreak={streak.currentStreak}
          longestStreak={streak.longestStreak}
          isTodayComplete={streak.todayComplete}
        />
      </div>

      {/* 메인 스코어 카드 */}
      <Card className="overflow-hidden border border-amber-200/50 dark:border-amber-900/30 bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50/30 dark:from-[#1a1a1e] dark:via-amber-950/20 dark:to-[#141416] opacity-0 animate-fade-in-up animation-delay-100 shadow-sm shadow-amber-100/50 dark:shadow-none">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">{currentPhase.name}</p>
              <p className="text-lg font-semibold">{currentPhase.description}</p>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-semibold">{questsCompleted}/3</span>
            </div>
          </div>

          {/* 진행률 */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">전체 진행률</span>
                <span className="font-mono font-semibold">{progressPercent.toFixed(0)}%</span>
              </div>
              <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">체중 목표</span>
                <span className="font-mono">
                  <span className="text-primary font-semibold">{weightLost.toFixed(1)}</span>
                  <span className="text-muted-foreground">/{totalWeightToLose.toFixed(1)}kg</span>
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-[#22c55e] rounded-full transition-all duration-500"
                  style={{ width: `${weightProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* 인바디 점수 뱃지 */}
          {latestInbody && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                <span className="text-sm text-muted-foreground">인바디 점수</span>
              </div>
              <span className="text-2xl font-bold gradient-text">{latestInbody.inbodyScore}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 오늘의 퀘스트 */}
      <div className="opacity-0 animate-fade-in-up animation-delay-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Target className="w-4 h-4" />
            오늘의 퀘스트
          </h2>
          <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                새로 시작
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
        <div className="space-y-2">
          {/* 물 3L */}
          <Card className={`touch-scale transition-all duration-500 ${
            waterCount >= 6
              ? 'border border-cyan-300/50 dark:border-cyan-700/50 bg-gradient-to-br from-cyan-100 via-blue-50 to-sky-100 dark:from-cyan-950/40 dark:via-blue-950/30 dark:to-sky-950/40 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-200/30 dark:shadow-cyan-900/20'
              : 'border border-sky-200/60 dark:border-sky-900/30 bg-gradient-to-br from-sky-50 via-cyan-50/50 to-blue-50/30 dark:from-sky-950/30 dark:via-cyan-950/20 dark:to-blue-950/30 shadow-sm shadow-sky-100/50 dark:shadow-none'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    waterCount >= 6 ? 'bg-cyan-500/30' : 'bg-secondary'
                  }`}>
                    <Droplets className={`w-5 h-5 transition-all ${
                      waterCount >= 6 ? 'text-cyan-500' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <p className={`font-medium transition-all ${waterCount >= 6 ? 'text-cyan-600 dark:text-cyan-400' : ''}`}>
                      물 3L 마시기
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {waterCount >= 6 ? '오늘의 목표 달성! 💧' : `${waterCount * 500}ml / 3,000ml`}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleWaterClick}
                  disabled={waterCount >= 6}
                  size="sm"
                  className={`h-9 px-4 font-semibold transition-all ${
                    waterCount >= 6
                      ? 'bg-cyan-500 text-white cursor-default'
                      : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-600 dark:text-cyan-400'
                  }`}
                >
                  {waterCount >= 6 ? '💧 완료!' : '💧 +500ml'}
                </Button>
              </div>
              {/* 6칸 진행 표시 */}
              <div className="grid grid-cols-6 gap-1.5">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className={`h-3 rounded-full transition-all duration-300 ${
                      index < waterCount
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-sm shadow-cyan-400/30'
                        : 'bg-slate-200 dark:bg-zinc-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                {waterCount >= 6 ? '🎉 완벽해요!' : `${6 - waterCount}번 더 마시면 완료`}
              </p>
            </CardContent>
          </Card>

          {/* 단백질 */}
          <Card className={`touch-scale transition-all duration-500 ${
            proteinProgress >= 100
              ? 'border border-rose-300/50 dark:border-rose-700/50 bg-gradient-to-br from-rose-100 via-red-50 to-orange-50 dark:from-rose-950/40 dark:via-red-950/30 dark:to-orange-950/30 shadow-lg shadow-rose-200/30 dark:shadow-rose-900/20'
              : 'border border-rose-200/60 dark:border-rose-900/30 bg-gradient-to-br from-rose-50/80 via-red-50/50 to-orange-50/30 dark:from-rose-950/30 dark:via-red-950/20 dark:to-orange-950/20 shadow-sm shadow-rose-100/50 dark:shadow-none'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${proteinProgress >= 100 ? 'bg-[#ff6b6b]/20' : 'bg-secondary'}`}>
                    <Utensils className={`w-5 h-5 ${proteinProgress >= 100 ? 'text-[#ff6b6b]' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium">단백질 {proteinGoal}g</p>
                    <p className="text-xs text-muted-foreground">{QUEST_COGNITIVE_LABELS.protein.subtitle}</p>
                  </div>
                </div>
                <Dialog open={proteinDialogOpen} onOpenChange={setProteinDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="font-mono text-sm h-8 px-3 bg-secondary/50">
                      {todayLog?.proteinAmount || 0}g
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
              <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#ff6b6b] to-[#ff8f8f] rounded-full transition-all duration-300"
                  style={{ width: `${proteinProgress}%` }}
                />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* 오늘의 운동 */}
      <div className="opacity-0 animate-fade-in-up animation-delay-300">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Dumbbell className="w-4 h-4" />
          오늘의 운동
        </h2>
        <Card className={`overflow-hidden transition-all duration-500 ${
          todayLog?.workoutDone
            ? 'border border-violet-300/50 dark:border-violet-700/50 bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-50 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-fuchsia-950/30 shadow-lg shadow-violet-200/30 dark:shadow-violet-900/20'
            : 'border border-violet-200/60 dark:border-violet-900/30 bg-gradient-to-br from-violet-50/80 via-purple-50/50 to-indigo-50/30 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-indigo-950/20 shadow-sm shadow-violet-100/50 dark:shadow-none'
        }`}>
          <CardContent className="p-5">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                {format(new Date(), 'EEEE', { locale: ko })}
              </p>
              <p className={`text-3xl font-bold mb-4 ${todayLog?.workoutDone ? 'gradient-text' : ''}`}>
                {todayWorkout}
              </p>
              {todayWorkout === '휴식' ? (
                <p className="text-muted-foreground text-sm">오늘은 휴식일입니다. 충분히 쉬세요!</p>
              ) : (
                <Button
                  size="lg"
                  className={`w-full h-14 text-lg font-semibold ${
                    celebration ? 'celebrate' : ''
                  } ${
                    todayLog?.workoutDone
                      ? 'workout-btn-completed text-white'
                      : 'workout-btn text-primary-foreground'
                  }`}
                  onClick={handleWorkoutToggle}
                >
                  {todayLog?.workoutDone ? (
                    <>
                      <Trophy className="w-5 h-5 mr-2" />
                      운동 완료!
                    </>
                  ) : (
                    <>
                      <Dumbbell className="w-5 h-5 mr-2" />
                      운동 완료하기
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 이번 주 챌린지 */}
      <div className="opacity-0 animate-fade-in-up animation-delay-400">
        <ChallengeList />
      </div>
    </div>
  )
}
