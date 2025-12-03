'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAppStore, PROTEIN_FOODS, WORKOUT_ROUTINE, PHASES, DailyLog } from '@/stores/useAppStore'
import { differenceInDays, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Droplets, Utensils, Moon, Dumbbell, Trophy, Flame, Target, Activity, Zap } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

interface StreakData {
  currentStreak: number
  longestStreak: number
  todayComplete: boolean
}

export default function Dashboard() {
  const { config, todayLog, setConfig, setTodayLog, updateTodayLog } = useAppStore()
  const [isSetupOpen, setIsSetupOpen] = useState(false)
  const [setupData, setSetupData] = useState({
    startWeight: 101.1,
    goalWeight: 85.0,
    startDate: format(new Date(), 'yyyy-MM-dd'),
  })
  const [proteinDialogOpen, setProteinDialogOpen] = useState(false)
  const [celebration, setCelebration] = useState(false)
  const [latestInbody, setLatestInbody] = useState<{ inbodyScore: number } | null>(null)
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, longestStreak: 0, todayComplete: false })

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

      // 스트릭 계산
      try {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 60) // 최근 60일
        const streakRes = await fetch(
          `/api/log?start=${format(start, 'yyyy-MM-dd')}&end=${format(end, 'yyyy-MM-dd')}`
        )
        const logs = await streakRes.json()
        if (logs && Array.isArray(logs)) {
          const streakData = calculateStreak(logs)
          setStreak(streakData)
        }
      } catch (e) {
        console.log('No streak data')
      }
    }
    loadData()
  }, [setConfig, setTodayLog])

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

  const handleWorkoutComplete = () => {
    handleUpdateLog({ workoutDone: true, workoutPart: todayWorkout })
    setCelebration(true)
    setTimeout(() => setCelebration(false), 1000)
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
    todayLog?.waterDone,
    (todayLog?.proteinAmount || 0) >= proteinGoal,
    todayLog?.cleanDiet,
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
          <ThemeToggle />
        </div>
      </div>

      {/* 연속 달성 스트릭 */}
      {streak.currentStreak > 0 || streak.longestStreak > 0 ? (
        <Card className={`overflow-hidden border-0 opacity-0 animate-fade-in-up animation-delay-100 ${
          streak.todayComplete
            ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30'
            : 'bg-gradient-to-r from-slate-800/50 to-slate-900/50'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  streak.todayComplete
                    ? 'bg-gradient-to-br from-orange-500 to-red-500'
                    : 'bg-slate-700'
                }`}>
                  <Flame className={`w-6 h-6 ${streak.todayComplete ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${
                      streak.todayComplete ? 'text-orange-500' : 'text-slate-400'
                    }`}>
                      {streak.currentStreak}
                    </span>
                    <span className="text-sm text-muted-foreground">일 연속</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {streak.todayComplete
                      ? '오늘도 완료! 내일도 화이팅!'
                      : '오늘 퀘스트를 완료하면 스트릭이 이어집니다'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Trophy className="w-3 h-3 text-yellow-500" />
                  <span>최장 {streak.longestStreak}일</span>
                </div>
                {streak.currentStreak >= 7 && (
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(Math.min(streak.currentStreak, 7))].map((_, i) => (
                      <Zap key={i} className="w-3 h-3 text-yellow-500" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* 메인 스코어 카드 */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#1a1a1e] to-[#141416] opacity-0 animate-fade-in-up animation-delay-100">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">{currentPhase.name}</p>
              <p className="text-lg font-semibold">{currentPhase.description}</p>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-semibold">{questsCompleted}/4</span>
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
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
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
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" />
          오늘의 퀘스트
        </h2>
        <div className="space-y-2">
          {/* 물 3L */}
          <Card className="border-0 bg-card/50 touch-scale">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${todayLog?.waterDone ? 'bg-[#00d4ff]/20' : 'bg-secondary'}`}>
                    <Droplets className={`w-5 h-5 ${todayLog?.waterDone ? 'text-[#00d4ff]' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium">물 3L 마시기</p>
                    <p className="text-xs text-muted-foreground">하루 수분 섭취</p>
                  </div>
                </div>
                <Toggle
                  pressed={todayLog?.waterDone}
                  onPressedChange={(pressed) => handleUpdateLog({ waterDone: pressed })}
                  className={`w-14 h-8 rounded-full ${todayLog?.waterDone ? 'bg-[#00d4ff] data-[state=on]:bg-[#00d4ff]' : 'bg-secondary'}`}
                >
                  <span className="sr-only">물 완료</span>
                </Toggle>
              </div>
            </CardContent>
          </Card>

          {/* 단백질 */}
          <Card className="border-0 bg-card/50 touch-scale">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${proteinProgress >= 100 ? 'bg-[#ff6b6b]/20' : 'bg-secondary'}`}>
                    <Utensils className={`w-5 h-5 ${proteinProgress >= 100 ? 'text-[#ff6b6b]' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium">단백질 {proteinGoal}g</p>
                    <p className="text-xs text-muted-foreground">근육 성장의 핵심</p>
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

          {/* 야식 금지 */}
          <Card className="border-0 bg-card/50 touch-scale">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${todayLog?.cleanDiet ? 'bg-[#a855f7]/20' : 'bg-secondary'}`}>
                    <Moon className={`w-5 h-5 ${todayLog?.cleanDiet ? 'text-[#a855f7]' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium">클린 다이어트</p>
                    <p className="text-xs text-muted-foreground">야식 금지 & 건강한 식단</p>
                  </div>
                </div>
                <Toggle
                  pressed={todayLog?.cleanDiet}
                  onPressedChange={(pressed) => handleUpdateLog({ cleanDiet: pressed })}
                  className={`w-14 h-8 rounded-full ${todayLog?.cleanDiet ? 'bg-[#a855f7] data-[state=on]:bg-[#a855f7]' : 'bg-secondary'}`}
                >
                  <span className="sr-only">클린식 완료</span>
                </Toggle>
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
        <Card className={`border-0 overflow-hidden ${todayLog?.workoutDone ? 'bg-gradient-to-br from-primary/20 to-accent/10' : 'bg-card/50'}`}>
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
                  className={`w-full h-14 text-lg font-semibold transition-all duration-300 ${
                    celebration ? 'celebrate' : ''
                  } ${
                    todayLog?.workoutDone
                      ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                  disabled={todayLog?.workoutDone}
                  onClick={handleWorkoutComplete}
                >
                  {todayLog?.workoutDone ? (
                    <>
                      <Trophy className="w-5 h-5 mr-2" />
                      운동 완료!
                    </>
                  ) : (
                    '운동 완료하기'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
