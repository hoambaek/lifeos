'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { format, addDays, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  ChevronLeft, ChevronRight,
  Flame, Play, Loader2, RotateCcw, Check,
} from 'lucide-react'
import {
  WEEK_META,
  computeWeekAndDay, getDailyGuide,
  type MealSlot,
} from '@/lib/diet-guide'

interface DietConfig {
  id: number
  startDate: string
  currentWeek: number
  currentPhase: string
  isActive: boolean
}

interface DietLog {
  id: number
  breakfastDone: boolean
  lunchDone: boolean
  snackDone: boolean
  dinnerDone: boolean
}

type MealKey = 'breakfast' | 'lunch' | 'snack' | 'dinner'

export default function DietPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [config, setConfig] = useState<DietConfig | null>(null)
  const [log, setLog] = useState<DietLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [startDateInput, setStartDateInput] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isStarting, setIsStarting] = useState(false)

  // 데이터 로드
  const loadData = useCallback(async (date: Date) => {
    setIsLoading(true)
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const res = await fetch(`/api/diet?type=date&date=${dateStr}`)
      if (res.ok) {
        const data = await res.json()
        setConfig(data.config ?? null)
        setLog(data.log ?? null)
      } else {
        setConfig(null)
        setLog(null)
      }
    } catch {
      setConfig(null)
      setLog(null)
    }
    setIsLoading(false)
  }, [])

  // 끼니 체크 토글 (Optimistic Update)
  const toggleMeal = async (mealKey: MealKey) => {
    const doneField = `${mealKey}Done` as 'breakfastDone' | 'lunchDone' | 'snackDone' | 'dinnerDone'
    const current = log?.[doneField] ?? false
    const next = !current

    // 낙관적 업데이트
    setLog((prev) => {
      const base = prev ?? { id: 0, breakfastDone: false, lunchDone: false, snackDone: false, dinnerDone: false }
      return { ...base, [doneField]: next }
    })

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const res = await fetch('/api/diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'log', date: dateStr, [doneField]: next }),
      })
      if (res.ok) {
        const updated = await res.json()
        setLog(updated)
      } else {
        // 롤백
        setLog((prev) => prev ? { ...prev, [doneField]: current } : prev)
      }
    } catch (error) {
      console.error('Failed to toggle meal:', error)
      setLog((prev) => prev ? { ...prev, [doneField]: current } : prev)
    }
  }

  // 다이어트 리셋
  const handleResetDiet = async () => {
    const ok = window.confirm('다이어트를 리셋합니다.\n시작일·진행 주차·식단 체크 기록이 모두 삭제되고 시작 화면으로 돌아갑니다.\n계속할까요?')
    if (!ok) return
    try {
      const res = await fetch('/api/diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'reset' }),
      })
      if (res.ok) {
        await loadData(selectedDate)
      }
    } catch (error) {
      console.error('Failed to reset diet:', error)
    }
  }

  // 다이어트 시작
  const handleStartDiet = async () => {
    setIsStarting(true)
    try {
      // 1) 4주차 + 유지기 식단 + 규칙 시드
      await fetch('/api/diet/seed', { method: 'POST' })
      // 2) DietConfig 생성 (시작일)
      const res = await fetch('/api/diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'start', startDate: startDateInput }),
      })
      if (res.ok) {
        setIsStartDialogOpen(false)
        await loadData(selectedDate)
      }
    } catch (error) {
      console.error('Failed to start diet:', error)
    } finally {
      setIsStarting(false)
    }
  }

  useEffect(() => {
    loadData(selectedDate)
  }, [selectedDate, loadData])

  // 날짜 이동
  const goToDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') setSelectedDate(new Date())
    else if (direction === 'prev') setSelectedDate(subDays(selectedDate, 1))
    else setSelectedDate(addDays(selectedDate, 1))
  }

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  // 오늘의 가이드 (시작일 기준 N주차 D일차)
  const guideContext = config
    ? computeWeekAndDay(new Date(config.startDate), selectedDate)
    : null
  const dailyGuide = guideContext
    ? getDailyGuide(guideContext.week, guideContext.dayInWeek)
    : null
  const weekMeta = guideContext ? WEEK_META[Math.min(guideContext.week, 5)] : null

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 pb-24">
        <div className="pt-2 pb-2">
          <div className="animate-pulse bg-stone-200 dark:bg-stone-800 rounded-lg h-7 w-24 mb-1" />
          <div className="animate-pulse bg-stone-200 dark:bg-stone-800 rounded-lg h-4 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-stone-200 dark:bg-stone-800 rounded-xl h-32" />
        ))}
      </div>
    )
  }

  // 다이어트 시작 전 — 시작 화면
  if (!config) {
    return (
      <div className="px-6 py-8 space-y-6 pb-24">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-stone-800 dark:text-stone-200">
            스위치온 다이어트
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            신진대사 스위치를 켜는 4주 프로그램 + 유지기
          </p>
        </div>

        <hr className="editorial-rule" />

        <Card className="border-stone-200 dark:border-stone-800">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-orange-500/10 flex items-center justify-center">
              <Flame className="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold">준비되셨나요?</h2>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                4주 식단 플랜이 자동으로 세팅됩니다
              </p>
            </div>
            <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="w-full h-12 text-base font-semibold">
                  <Play className="w-4 h-4 mr-2" />
                  다이어트 시작하기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">시작일 설정</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-sm font-medium text-stone-600 dark:text-stone-400">
                      다이어트 시작일
                    </label>
                    <Input
                      type="date"
                      value={startDateInput}
                      onChange={(e) => setStartDateInput(e.target.value)}
                      className="mt-1 h-12 text-base"
                    />
                  </div>
                  <Button
                    onClick={handleStartDiet}
                    disabled={isStarting}
                    className="w-full h-12 text-base font-semibold"
                  >
                    {isStarting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 식단 시드 중…</>
                    ) : (
                      '시작하기'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <div className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
          <p><span className="font-semibold text-stone-800 dark:text-stone-200">1주차</span> · 지방 연소 모드 — 단백질 쉐이크 중심</p>
          <p><span className="font-semibold text-stone-800 dark:text-stone-200">2주차</span> · 간헐적 단식 시작 (주 1회 24시간)</p>
          <p><span className="font-semibold text-stone-800 dark:text-stone-200">3주차</span> · 단식 강화 (주 2회 24시간)</p>
          <p><span className="font-semibold text-stone-800 dark:text-stone-200">4주차</span> · 단식 정착 (주 3회 24시간)</p>
          <p><span className="font-semibold text-stone-800 dark:text-stone-200">5주차+</span> · 유지기 (16:8 + 선택적 24h)</p>
        </div>
      </div>
    )
  }

  const mealRows: { key: MealKey; label: string; slot: MealSlot }[] = dailyGuide
    ? [
        { key: 'breakfast', label: '아침', slot: dailyGuide.breakfast },
        { key: 'lunch', label: '점심', slot: dailyGuide.lunch },
        { key: 'snack', label: '간식', slot: dailyGuide.snack },
        { key: 'dinner', label: '저녁', slot: dailyGuide.dinner },
      ]
    : []
  const doneMap: Record<MealKey, boolean> = {
    breakfast: log?.breakfastDone ?? false,
    lunch: log?.lunchDone ?? false,
    snack: log?.snackDone ?? false,
    dinner: log?.dinnerDone ?? false,
  }
  const completedCount = mealRows.filter(r => doneMap[r.key]).length

  return (
    <div className="px-6 py-8 space-y-5 pb-24">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-stone-800 dark:text-stone-200">
            스위치온 다이어트
          </h1>
          {guideContext && weekMeta && (
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                {weekMeta.title}
              </span>
              <span className="mx-1.5 text-stone-300 dark:text-stone-600">·</span>
              <span>{weekMeta.goal}</span>
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetDiet}
          className="text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 -mt-1 flex-shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          재설정
        </Button>
      </div>

      {/* 주차 요약 */}
      {weekMeta && (
        <div className="rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 p-4">
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
            {weekMeta.summary}
          </p>
        </div>
      )}

      <hr className="editorial-rule" />

      {/* 날짜 선택 */}
      <Card className="border-stone-200 dark:border-stone-800">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => goToDate('prev')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <p className="font-semibold">
                {format(selectedDate, 'M월 d일 EEEE', { locale: ko })}
              </p>
              {guideContext && (
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-mono">
                  {guideContext.dayInWeek}일차 · D{guideContext.totalDay}
                  {dailyGuide && !dailyGuide.isFullFastDay && (
                    <span className="ml-1.5 text-stone-400 dark:text-stone-500">
                      · {completedCount}/4
                    </span>
                  )}
                </p>
              )}
              {!isToday && (
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs text-primary p-0 h-auto mt-0.5"
                  onClick={() => goToDate('today')}
                >
                  오늘로 이동
                </Button>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => goToDate('next')}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 끼니 가이드 + 체크 */}
      {dailyGuide && (
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
          {mealRows.map((row, i) => {
            const isFasting = row.slot.type === 'fasting'
            const isFree = row.slot.type === 'free'
            const done = doneMap[row.key]
            const checkable = !isFasting // 단식은 체크 안 함
            return (
              <button
                key={row.key}
                onClick={() => checkable && toggleMeal(row.key)}
                disabled={!checkable}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                  i > 0 ? 'border-t border-stone-100 dark:border-stone-800/60' : ''
                } ${
                  isFasting
                    ? 'bg-amber-50/40 dark:bg-amber-950/10'
                    : isFree
                    ? 'bg-violet-50/40 dark:bg-violet-950/10'
                    : done
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                    : 'hover:bg-stone-50 dark:hover:bg-stone-900/30 active:bg-stone-100 dark:active:bg-stone-800/40'
                } ${!checkable ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {/* 체크박스 */}
                {checkable ? (
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      done
                        ? 'bg-emerald-600 dark:bg-emerald-500 border-emerald-600 dark:border-emerald-500'
                        : 'border-stone-300 dark:border-stone-700'
                    }`}
                  >
                    {done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>
                ) : (
                  <div className="w-5 h-5 flex-shrink-0" />
                )}
                {/* 라벨 */}
                <span className="w-10 text-sm font-semibold text-stone-500 dark:text-stone-400 flex-shrink-0">
                  {row.label}
                </span>
                {/* 메뉴 */}
                <span
                  className={`flex-1 text-base ${
                    isFasting
                      ? 'text-amber-700 dark:text-amber-400 font-semibold'
                      : isFree
                      ? 'text-violet-700 dark:text-violet-400 font-semibold'
                      : done
                      ? 'text-stone-500 dark:text-stone-500 line-through'
                      : 'text-stone-800 dark:text-stone-200'
                  }`}
                >
                  {row.slot.label}
                  {row.slot.hint && (
                    <span className="ml-1.5 text-xs text-stone-500 dark:text-stone-400 font-normal">
                      ({row.slot.hint})
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
