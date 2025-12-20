'use client'

import { useEffect, useState } from 'react'
import { Flame, Utensils, Timer, Wine, Wheat, Candy, CheckCircle2, XCircle, ChevronRight, Sparkles, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface DietData {
  config: {
    startDate: string
    currentWeek: number
    currentPhase: string
  } | null
  plan: {
    isFastingDay: boolean
    breakfast: string
    lunch: string
    dinner: string
    snack: string | null
  } | null
  log: {
    breakfastDone: boolean
    lunchDone: boolean
    snackDone: boolean
    dinnerDone: boolean
    fastingComplete: boolean
    noAlcohol: boolean
    noFlour: boolean
    noSugar: boolean
  } | null
  dayNumber: number
  week: number
}

interface WeeklyLog {
  date: string
  breakfastDone: boolean
  lunchDone: boolean
  dinnerDone: boolean
  fastingComplete: boolean
  noAlcohol: boolean
  noFlour: boolean
  noSugar: boolean
}

const MOTIVATIONAL_MESSAGES = [
  { threshold: 100, message: "완벽해요! 오늘도 승리했습니다 🔥", emoji: "🏆" },
  { threshold: 80, message: "거의 다 왔어요! 조금만 더!", emoji: "💪" },
  { threshold: 60, message: "좋은 페이스예요, 계속 가세요!", emoji: "⚡" },
  { threshold: 40, message: "시작이 반이에요! 화이팅!", emoji: "🌱" },
  { threshold: 0, message: "오늘부터 다시 시작해요!", emoji: "✨" },
]

const WEEK_PHASE_NAMES: Record<number, string> = {
  1: '지방 연소 전환',
  2: '간헐적 단식',
  3: '단식 강화',
  4: '최종 단계',
  5: '유지기',
}

export function DietStatusCard() {
  const [dietData, setDietData] = useState<DietData | null>(null)
  const [weeklyLogs, setWeeklyLogs] = useState<WeeklyLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [localRules, setLocalRules] = useState({
    noAlcohol: true,
    noFlour: true,
    noSugar: true,
  })

  useEffect(() => {
    const loadDietData = async () => {
      try {
        // 오늘의 식단 데이터
        const res = await fetch('/api/diet?type=today')
        if (res.ok) {
          const data = await res.json()
          setDietData(data)
        }

        // 이번 주 로그 (최근 7일)
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 6)

        const weekRes = await fetch(`/api/diet?type=week-logs&start=${start.toISOString()}&end=${end.toISOString()}`)
        if (weekRes.ok) {
          const logs = await weekRes.json()
          if (Array.isArray(logs)) {
            setWeeklyLogs(logs)
          }
        }
      } catch (error) {
        console.log('Diet data not available')
      } finally {
        setIsLoading(false)
      }
    }

    loadDietData()
  }, [])

  // dietData에서 localRules 동기화
  useEffect(() => {
    if (dietData?.log) {
      setLocalRules({
        noAlcohol: dietData.log.noAlcohol !== false,
        noFlour: dietData.log.noFlour !== false,
        noSugar: dietData.log.noSugar !== false,
      })
    }
  }, [dietData?.log])

  // 토글 핸들러
  const handleToggle = async (key: 'noAlcohol' | 'noFlour' | 'noSugar', e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const newValue = !localRules[key]
    setLocalRules(prev => ({ ...prev, [key]: newValue }))

    try {
      await fetch('/api/diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'update-log',
          [key]: newValue,
        }),
      })
    } catch (error) {
      console.error('Failed to update:', error)
      // 실패 시 롤백
      setLocalRules(prev => ({ ...prev, [key]: !newValue }))
    }
  }

  // 재설정 핸들러
  const handleReset = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const resetState = {
      noAlcohol: true,
      noFlour: true,
      noSugar: true,
    }
    setLocalRules(resetState)

    try {
      await fetch('/api/diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reset-log',
        }),
      })
      setResetDialogOpen(false)
    } catch (error) {
      console.error('Failed to reset:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="diet-card-skeleton animate-pulse rounded-2xl h-48 bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20" />
    )
  }

  if (!dietData?.config) {
    return (
      <Link href="/diet" className="block">
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-amber-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-all group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/20 to-transparent rounded-bl-full" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">스위치온 다이어트</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">4주 프로그램을 시작해보세요</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </Link>
    )
  }

  // 오늘의 진행률 계산
  const calculateTodayProgress = () => {
    if (!dietData.log) return 0
    const log = dietData.log
    const plan = dietData.plan

    if (plan?.isFastingDay) {
      let score = 0
      if (log.fastingComplete) score += 50
      if (log.noAlcohol) score += 17
      if (log.noFlour) score += 17
      if (log.noSugar) score += 16
      return score
    }

    let total = 0
    let done = 0

    // 식사 체크
    if (plan?.breakfast !== '-') { total++; if (log.breakfastDone) done++; }
    if (plan?.lunch !== '-') { total++; if (log.lunchDone) done++; }
    if (plan?.snack && plan.snack !== '-') { total++; if (log.snackDone) done++; }
    if (plan?.dinner !== '-') { total++; if (log.dinnerDone) done++; }

    // 금기사항 체크 (각 17점)
    const mealScore = total > 0 ? (done / total) * 50 : 50
    const ruleScore =
      (log.noAlcohol !== false ? 17 : 0) +
      (log.noFlour !== false ? 17 : 0) +
      (log.noSugar !== false ? 16 : 0)

    return Math.round(mealScore + ruleScore)
  }

  // 이번 주 완료율 계산
  const calculateWeekProgress = () => {
    if (weeklyLogs.length === 0) return 0
    let totalScore = 0

    weeklyLogs.forEach(log => {
      let dayScore = 0
      if (log.breakfastDone || log.lunchDone || log.dinnerDone || log.fastingComplete) {
        dayScore += 50
      }
      if (log.noAlcohol) dayScore += 17
      if (log.noFlour) dayScore += 17
      if (log.noSugar) dayScore += 16
      totalScore += dayScore
    })

    return Math.round(totalScore / (weeklyLogs.length * 100) * 100)
  }

  const todayProgress = calculateTodayProgress()
  const weekProgress = calculateWeekProgress()

  const getMessage = () => {
    const msg = MOTIVATIONAL_MESSAGES.find(m => todayProgress >= m.threshold)
    return msg || MOTIVATIONAL_MESSAGES[MOTIVATIONAL_MESSAGES.length - 1]
  }

  const motivationalMessage = getMessage()
  const isFastingDay = dietData.plan?.isFastingDay

  // 금기사항 상태 (localRules 사용)
  const rules = [
    { key: 'noAlcohol' as const, label: '금주', icon: Wine, done: localRules.noAlcohol },
    { key: 'noFlour' as const, label: '밀가루', icon: Wheat, done: localRules.noFlour },
    { key: 'noSugar' as const, label: '설탕', icon: Candy, done: localRules.noSugar },
  ]

  return (
    <Link href="/diet" className="block">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/40 dark:via-amber-950/30 dark:to-yellow-950/20 border border-orange-200/50 dark:border-orange-800/30 hover:border-orange-400/50 dark:hover:border-orange-600/50 transition-all group">
        {/* 배경 장식 */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-bl from-orange-400/20 to-transparent rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-red-400/15 to-transparent rounded-full blur-xl" />

        {/* 메인 콘텐츠 */}
        <div className="relative z-10 p-5">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                isFastingDay
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30'
                  : 'bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-500/30'
              }`}>
                {isFastingDay ? (
                  <Timer className="w-6 h-6 text-white" />
                ) : (
                  <Utensils className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 dark:text-white">
                    {isFastingDay ? '단식일' : '식단 관리'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-600 dark:text-orange-400">
                    {dietData.week}주차
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  D+{dietData.dayNumber} · {WEEK_PHASE_NAMES[dietData.week] || '진행중'}
                </p>
              </div>
            </div>

            {/* 오늘 진행률 링 */}
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-orange-200 dark:text-orange-900/50"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${todayProgress * 1.508} 150.8`}
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{todayProgress}%</span>
              </div>
            </div>
          </div>

          {/* 금기사항 토글 버튼 */}
          <div className="flex items-center gap-2 mb-4">
            {rules.map((rule) => (
              <button
                key={rule.key}
                onClick={(e) => handleToggle(rule.key, e)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  rule.done
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30 scale-100'
                    : 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30 scale-95 opacity-80'
                }`}
              >
                <rule.icon className="w-4 h-4" />
                <span>{rule.label}</span>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  rule.done
                    ? 'bg-white/30'
                    : 'bg-white/20'
                }`}>
                  {rule.done ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                </div>
                {/* ON/OFF 표시 */}
                <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[8px] font-black ${
                  rule.done
                    ? 'bg-emerald-300 text-emerald-800'
                    : 'bg-red-300 text-red-800'
                }`}>
                  {rule.done ? 'OK' : 'X'}
                </span>
              </button>
            ))}
          </div>

          {/* 주간 진행률 바 */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-500 dark:text-slate-400">이번 주 진행률</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">{weekProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-orange-100 dark:bg-orange-900/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-700"
                style={{ width: `${weekProgress}%` }}
              />
            </div>
          </div>

          {/* 동기부여 메시지 + 재설정 버튼 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-orange-100/80 to-amber-100/80 dark:from-orange-900/20 dark:to-amber-900/20 flex-1">
              <span className="text-xl">{motivationalMessage.emoji}</span>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1">
                {motivationalMessage.message}
              </p>
              <Sparkles className="w-4 h-4 text-orange-500 dark:text-orange-400 opacity-60" />
            </div>

            {/* 재설정 버튼 */}
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <DialogTrigger asChild>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setResetDialogOpen(true)
                  }}
                  className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-xs" onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                  <DialogTitle className="text-lg">식단 기록 초기화</DialogTitle>
                </DialogHeader>
                <div className="pt-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    오늘의 식단 기록이 모두 초기화됩니다. 계속하시겠습니까?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setResetDialogOpen(false)
                      }}
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

        {/* 호버 효과 */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-red-500/0 group-hover:from-orange-500/5 group-hover:to-red-500/5 transition-all duration-300" />
      </div>
    </Link>
  )
}
