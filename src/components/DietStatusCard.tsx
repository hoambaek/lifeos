'use client'

import { useEffect, useState } from 'react'
import { Flame, Utensils, Timer, Wine, Wheat, Candy, CheckCircle2, XCircle, ChevronRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

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

  if (isLoading) {
    return (
      <div className="diet-card-skeleton animate-pulse rounded-xl h-48 bg-stone-100 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700" />
    )
  }

  if (!dietData?.config) {
    return (
      <Link href="/diet" className="block">
        <div className="relative overflow-hidden rounded-xl p-5 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 transition-all group">
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-stone-900 dark:bg-stone-100 flex items-center justify-center">
              <Flame className="w-6 h-6 text-stone-50 dark:text-stone-900" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif font-semibold text-lg text-stone-800 dark:text-stone-200">스위치온 다이어트</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">4주 프로그램을 시작해보세요</p>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 group-hover:translate-x-1 transition-all" />
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

  // 금기사항 상태
  const rules = [
    { key: 'noAlcohol', label: '금주', icon: Wine, done: dietData.log?.noAlcohol !== false },
    { key: 'noFlour', label: '밀가루', icon: Wheat, done: dietData.log?.noFlour !== false },
    { key: 'noSugar', label: '설탕', icon: Candy, done: dietData.log?.noSugar !== false },
  ]

  return (
    <Link href="/diet" className="block">
      <div className="relative overflow-hidden rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 transition-all group">
        {/* 메인 콘텐츠 */}
        <div className="relative z-10 p-5">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-stone-900 dark:bg-stone-100 flex items-center justify-center">
                {isFastingDay ? (
                  <Timer className="w-5 h-5 text-stone-50 dark:text-stone-900" />
                ) : (
                  <Utensils className="w-5 h-5 text-stone-50 dark:text-stone-900" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-semibold text-stone-800 dark:text-stone-200">
                    {isFastingDay ? '단식일' : '식단 관리'}
                  </h3>
                  <span className="editorial-label">
                    {dietData.week}주차
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  D+{dietData.dayNumber} · {WEEK_PHASE_NAMES[dietData.week] || '진행중'}
                </p>
              </div>
            </div>

            {/* 오늘 진행률 */}
            <div className="text-right">
              <span className="text-2xl font-mono font-bold text-stone-800 dark:text-stone-200">{todayProgress}%</span>
            </div>
          </div>

          {/* 금기사항 체크 */}
          <div className="flex items-center gap-2 mb-4">
            {rules.map((rule) => (
              <div
                key={rule.key}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  rule.done
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                }`}
              >
                <rule.icon className="w-3.5 h-3.5" />
                <span>{rule.label}</span>
                {rule.done ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
              </div>
            ))}
          </div>

          {/* 주간 진행률 바 */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-stone-500 dark:text-stone-400">이번 주 진행률</span>
              <span className="font-mono font-semibold text-stone-700 dark:text-stone-300">{weekProgress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-stone-700 dark:bg-stone-300 transition-all duration-700"
                style={{ width: `${weekProgress}%` }}
              />
            </div>
          </div>

          {/* 동기부여 메시지 */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-stone-100 dark:bg-stone-800/50 border-t border-stone-200 dark:border-stone-700">
            <span className="text-base">{motivationalMessage.emoji}</span>
            <p className="text-sm text-stone-600 dark:text-stone-400 flex-1">
              {motivationalMessage.message}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
