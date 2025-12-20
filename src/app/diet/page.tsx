'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { format, addDays, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Utensils, Coffee, Sun, Moon, Zap, ChevronLeft, ChevronRight,
  Calendar, AlertCircle, CheckCircle2, XCircle, Flame, Timer,
  Droplets, Ban, Wine, Wheat, Candy, Play, Info, BookOpen, Settings, RotateCcw
} from 'lucide-react'

interface DietConfig {
  id: number
  startDate: string
  currentWeek: number
  currentPhase: string
  isActive: boolean
}

interface DietPlan {
  id: number
  dayNumber: number
  week: number
  dayOfWeek: number
  breakfast: string
  breakfastTime: string
  lunch: string
  lunchTime: string
  snack: string | null
  snackTime: string | null
  dinner: string
  dinnerTime: string
  isFastingDay: boolean
  weekNotes: string | null
}

interface DietLog {
  id: number
  date: string
  dayNumber: number
  week: number
  breakfastDone: boolean
  lunchDone: boolean
  snackDone: boolean
  dinnerDone: boolean
  fastingComplete: boolean
  sleepHours: number | null
  waterCups: number
  exerciseDone: boolean
  noAlcohol: boolean
  noFlour: boolean
  noSugar: boolean
}

interface DietRule {
  id: number
  ruleNumber: number
  title: string
  description: string
  icon: string | null
}

interface TodayData {
  config: DietConfig
  plan: DietPlan
  log: DietLog | null
  dayNumber: number
  week: number
  dayOfWeek: number
}

const PHASE_NAMES: Record<string, string> = {
  fat_burning: '🔥 지방 연소 모드',
  accelerate: '⚡ 체중 감량 가속화',
  maintain: '✨ 체중 유지 & 최적화',
}

const WEEK_THEMES: Record<number, { color: string; gradient: string; name: string }> = {
  1: { color: 'text-orange-400', gradient: 'from-orange-500/20 to-red-500/10', name: '지방 연소 전환' },
  2: { color: 'text-amber-400', gradient: 'from-amber-500/20 to-orange-500/10', name: '간헐적 단식 시작' },
  3: { color: 'text-yellow-400', gradient: 'from-yellow-500/20 to-amber-500/10', name: '단식 강화' },
  4: { color: 'text-lime-400', gradient: 'from-lime-500/20 to-green-500/10', name: '최종 단계' },
  5: { color: 'text-emerald-400', gradient: 'from-emerald-500/20 to-teal-500/10', name: '유지기' },
}

export default function DietPage() {
  const [todayData, setTodayData] = useState<TodayData | null>(null)
  const [rules, setRules] = useState<DietRule[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [isRulesDialogOpen, setIsRulesDialogOpen] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [newStartDate, setNewStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [weekNotes, setWeekNotes] = useState<{
    tips: string[]
    allowed: string[]
    forbidden?: string[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 데이터 로드
  const loadData = async (date: Date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const res = await fetch(`/api/diet?type=date&date=${dateStr}`)

      if (res.status === 404) {
        setTodayData(null)
        setIsLoading(false)
        return
      }

      const data = await res.json()
      if (data.error) {
        setTodayData(null)
      } else {
        setTodayData(data)
        if (data.plan?.weekNotes) {
          try {
            setWeekNotes(JSON.parse(data.plan.weekNotes))
          } catch {
            setWeekNotes(null)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load diet data:', error)
      setTodayData(null)
    }
    setIsLoading(false)
  }

  // 규칙 로드
  const loadRules = async () => {
    try {
      const res = await fetch('/api/diet?type=rules')
      const data = await res.json()
      if (Array.isArray(data)) {
        setRules(data)
      }
    } catch (error) {
      console.error('Failed to load rules:', error)
    }
  }

  useEffect(() => {
    loadData(selectedDate)
    loadRules()
  }, [selectedDate])

  // 다이어트 시작
  const handleStartDiet = async () => {
    try {
      // 먼저 시드 데이터 생성
      await fetch('/api/diet/seed', { method: 'POST' })

      // 다이어트 시작
      const res = await fetch('/api/diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'start', startDate }),
      })

      if (res.ok) {
        setIsStartDialogOpen(false)
        loadData(selectedDate)
      }
    } catch (error) {
      console.error('Failed to start diet:', error)
    }
  }

  // 다이어트 재설정 (시작일 변경)
  const handleResetDiet = async () => {
    try {
      // 다이어트 시작일 재설정
      const res = await fetch('/api/diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'start', startDate: newStartDate }),
      })

      if (res.ok) {
        setIsResetDialogOpen(false)
        loadData(selectedDate)
      }
    } catch (error) {
      console.error('Failed to reset diet:', error)
    }
  }

  // 식사 체크 토글
  const handleMealToggle = async (meal: 'breakfast' | 'lunch' | 'snack' | 'dinner', value: boolean) => {
    try {
      await fetch('/api/diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'log',
          date: format(selectedDate, 'yyyy-MM-dd'),
          [`${meal}Done`]: value,
        }),
      })
      loadData(selectedDate)
    } catch (error) {
      console.error('Failed to update meal:', error)
    }
  }

  // 단식 완료 토글
  const handleFastingToggle = async (value: boolean) => {
    try {
      await fetch('/api/diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'log',
          date: format(selectedDate, 'yyyy-MM-dd'),
          fastingComplete: value,
        }),
      })
      loadData(selectedDate)
    } catch (error) {
      console.error('Failed to update fasting:', error)
    }
  }

  // 규칙 체크 토글
  const handleRuleToggle = async (rule: 'noAlcohol' | 'noFlour' | 'noSugar', value: boolean) => {
    try {
      await fetch('/api/diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'log',
          date: format(selectedDate, 'yyyy-MM-dd'),
          [rule]: value,
        }),
      })
      loadData(selectedDate)
    } catch (error) {
      console.error('Failed to update rule:', error)
    }
  }

  // 날짜 이동
  const goToDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setSelectedDate(new Date())
    } else if (direction === 'prev') {
      setSelectedDate(subDays(selectedDate, 1))
    } else {
      setSelectedDate(addDays(selectedDate, 1))
    }
  }

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  const weekTheme = todayData ? WEEK_THEMES[Math.min(todayData.week, 5)] : WEEK_THEMES[1]

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    )
  }

  // 다이어트 시작 전
  if (!todayData) {
    return (
      <div className="p-4 space-y-6">
        <div className="pt-2 pb-4">
          <h1 className="text-2xl font-bold">
            <span className="gradient-text">스위치온 다이어트</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            신진대사 스위치를 켜서 지방을 태우는 4주 프로그램
          </p>
        </div>

        <Card className="border-0 bg-gradient-to-br from-orange-500/20 to-red-500/10">
          <CardContent className="p-6 text-center">
            <Flame className="w-16 h-16 mx-auto mb-4 text-orange-400" />
            <h2 className="text-xl font-bold mb-2">준비되셨나요?</h2>
            <p className="text-muted-foreground text-sm mb-6">
              4주간의 체계적인 식단 관리로<br />
              건강한 체중 감량을 시작하세요
            </p>
            <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                  <Play className="w-5 h-5 mr-2" />
                  다이어트 시작하기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm glass-card border-0">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold gradient-text">시작일 설정</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">다이어트 시작일</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1 bg-secondary/50 border-0 h-12"
                    />
                  </div>
                  <Button onClick={handleStartDiet} className="w-full h-12 text-lg font-semibold bg-primary">
                    시작하기
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* 프로그램 소개 */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Info className="w-4 h-4" />
            프로그램 안내
          </h3>

          <Card className="border-0 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-400 font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium">1주차: 지방 연소 모드 전환</p>
                  <p className="text-sm text-muted-foreground">탄수화물을 줄이고 단백질 쉐이크 중심 식단</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-400 font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium">2주차: 간헐적 단식 시작</p>
                  <p className="text-sm text-muted-foreground">주 1회 24시간 단식 도입</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-yellow-400 font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium">3주차: 단식 강화</p>
                  <p className="text-sm text-muted-foreground">주 2회 24시간 단식 (연속 단식 X)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-lime-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lime-400 font-bold">4</span>
                </div>
                <div>
                  <p className="font-medium">4주차: 최종 단계</p>
                  <p className="text-sm text-muted-foreground">주 3회 24시간 단식으로 극대화</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 완료율 계산
  const calculateProgress = () => {
    if (!todayData.log) return 0
    const log = todayData.log
    const plan = todayData.plan

    if (plan.isFastingDay) {
      return log.fastingComplete ? 100 : 0
    }

    let total = 0
    let done = 0

    if (plan.breakfast !== '-') { total++; if (log.breakfastDone) done++; }
    if (plan.lunch !== '-') { total++; if (log.lunchDone) done++; }
    if (plan.snack && plan.snack !== '-') { total++; if (log.snackDone) done++; }
    if (plan.dinner !== '-') { total++; if (log.dinnerDone) done++; }

    return total > 0 ? Math.round((done / total) * 100) : 0
  }

  const progress = calculateProgress()

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* 헤더 */}
      <div className="pt-2 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              <span className={weekTheme.color}>D+{todayData.dayNumber}</span>
              <span className="text-muted-foreground text-sm font-normal ml-2">
                {todayData.week}주차
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {weekTheme.name}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {/* 시작일 재설정 버튼 */}
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-orange-500">
                  <Settings className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm glass-card border-0">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-orange-500" />
                    식단 시작일 재설정
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      현재 시작일: <span className="font-semibold">{todayData.config.startDate ? format(new Date(todayData.config.startDate), 'yyyy년 M월 d일') : '-'}</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">새 시작일</label>
                    <Input
                      type="date"
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="mt-1 bg-secondary/50 border-0 h-12"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    시작일을 변경하면 D+일수가 새로 계산됩니다.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsResetDialogOpen(false)}
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleResetDiet}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      변경하기
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* 규칙 보기 버튼 */}
            <Dialog open={isRulesDialogOpen} onOpenChange={setIsRulesDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <BookOpen className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm glass-card border-0 max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">📋 식단 규칙</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                      <span className="text-xl">{rule.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{rule.title}</p>
                        <p className="text-xs text-muted-foreground">{rule.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* 날짜 선택 */}
      <Card className="border-0 bg-card/50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => goToDate('prev')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <p className="font-semibold">
                {format(selectedDate, 'M월 d일 EEEE', { locale: ko })}
              </p>
              {!isToday && (
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs text-primary p-0 h-auto"
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

      {/* 진행률 카드 */}
      <Card className={`border-0 bg-gradient-to-br ${weekTheme.gradient}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {todayData.plan.isFastingDay ? (
                <Timer className={`w-5 h-5 ${weekTheme.color}`} />
              ) : (
                <Utensils className={`w-5 h-5 ${weekTheme.color}`} />
              )}
              <span className="font-semibold">
                {todayData.plan.isFastingDay ? '24시간 단식일' : '오늘의 식단'}
              </span>
            </div>
            <span className={`text-2xl font-bold ${weekTheme.color}`}>{progress}%</span>
          </div>
          <div className="relative h-2 rounded-full bg-black/20 overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                progress === 100 ? 'bg-green-500' : 'bg-white/80'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 단식일 UI */}
      {todayData.plan.isFastingDay ? (
        <Card className="border-0 bg-card/50">
          <CardContent className="p-6 text-center">
            <Timer className="w-16 h-16 mx-auto mb-4 text-amber-400" />
            <h3 className="text-xl font-bold mb-2">24시간 단식</h3>
            <p className="text-muted-foreground text-sm mb-6">
              오늘은 단식일입니다. 저녁 식사만 허용됩니다.
            </p>
            <Button
              size="lg"
              className={`w-full h-14 text-lg font-semibold ${
                todayData.log?.fastingComplete
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
              onClick={() => handleFastingToggle(!todayData.log?.fastingComplete)}
            >
              {todayData.log?.fastingComplete ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  단식 완료!
                </>
              ) : (
                <>
                  <Timer className="w-5 h-5 mr-2" />
                  단식 완료하기
                </>
              )}
            </Button>

            {todayData.plan.dinner !== '-' && (
              <div className="mt-6 p-4 rounded-xl bg-secondary/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-purple-400" />
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">{todayData.plan.dinnerTime}</p>
                      <p className="font-medium">{todayData.plan.dinner}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMealToggle('dinner', !todayData.log?.dinnerDone)}
                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                      todayData.log?.dinnerDone
                        ? 'bg-gradient-to-r from-purple-400 to-violet-500 shadow-lg shadow-purple-500/30'
                        : 'bg-slate-300 dark:bg-zinc-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${
                      todayData.log?.dinnerDone ? 'left-7' : 'left-1'
                    }`}>
                      {todayData.log?.dinnerDone ? (
                        <CheckCircle2 className="w-4 h-4 text-purple-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* 일반 식단 UI */
        <div className="space-y-2">
          {/* 아침 */}
          {todayData.plan.breakfast !== '-' && (
            <Card className="border-0 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      todayData.log?.breakfastDone ? 'bg-amber-500/20' : 'bg-secondary'
                    }`}>
                      <Coffee className={`w-5 h-5 ${
                        todayData.log?.breakfastDone ? 'text-amber-400' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{todayData.plan.breakfastTime}</p>
                      <p className="font-medium">{todayData.plan.breakfast}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMealToggle('breakfast', !todayData.log?.breakfastDone)}
                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                      todayData.log?.breakfastDone
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30'
                        : 'bg-slate-300 dark:bg-zinc-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${
                      todayData.log?.breakfastDone ? 'left-7' : 'left-1'
                    }`}>
                      {todayData.log?.breakfastDone ? (
                        <CheckCircle2 className="w-4 h-4 text-amber-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 점심 */}
          {todayData.plan.lunch !== '-' && (
            <Card className="border-0 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      todayData.log?.lunchDone ? 'bg-orange-500/20' : 'bg-secondary'
                    }`}>
                      <Sun className={`w-5 h-5 ${
                        todayData.log?.lunchDone ? 'text-orange-400' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{todayData.plan.lunchTime}</p>
                      <p className="font-medium">{todayData.plan.lunch}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMealToggle('lunch', !todayData.log?.lunchDone)}
                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                      todayData.log?.lunchDone
                        ? 'bg-gradient-to-r from-orange-400 to-red-500 shadow-lg shadow-orange-500/30'
                        : 'bg-slate-300 dark:bg-zinc-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${
                      todayData.log?.lunchDone ? 'left-7' : 'left-1'
                    }`}>
                      {todayData.log?.lunchDone ? (
                        <CheckCircle2 className="w-4 h-4 text-orange-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 간식 */}
          {todayData.plan.snack && todayData.plan.snack !== '-' && (
            <Card className="border-0 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      todayData.log?.snackDone ? 'bg-lime-500/20' : 'bg-secondary'
                    }`}>
                      <Zap className={`w-5 h-5 ${
                        todayData.log?.snackDone ? 'text-lime-400' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{todayData.plan.snackTime}</p>
                      <p className="font-medium">{todayData.plan.snack}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMealToggle('snack', !todayData.log?.snackDone)}
                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                      todayData.log?.snackDone
                        ? 'bg-gradient-to-r from-lime-400 to-green-500 shadow-lg shadow-lime-500/30'
                        : 'bg-slate-300 dark:bg-zinc-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${
                      todayData.log?.snackDone ? 'left-7' : 'left-1'
                    }`}>
                      {todayData.log?.snackDone ? (
                        <CheckCircle2 className="w-4 h-4 text-lime-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 저녁 */}
          {todayData.plan.dinner !== '-' && (
            <Card className="border-0 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      todayData.log?.dinnerDone ? 'bg-purple-500/20' : 'bg-secondary'
                    }`}>
                      <Moon className={`w-5 h-5 ${
                        todayData.log?.dinnerDone ? 'text-purple-400' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{todayData.plan.dinnerTime}</p>
                      <p className="font-medium">{todayData.plan.dinner}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMealToggle('dinner', !todayData.log?.dinnerDone)}
                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                      todayData.log?.dinnerDone
                        ? 'bg-gradient-to-r from-purple-400 to-violet-500 shadow-lg shadow-purple-500/30'
                        : 'bg-slate-300 dark:bg-zinc-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${
                      todayData.log?.dinnerDone ? 'left-7' : 'left-1'
                    }`}>
                      {todayData.log?.dinnerDone ? (
                        <CheckCircle2 className="w-4 h-4 text-purple-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 금기 사항 체크 */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Ban className="w-4 h-4" />
          오늘의 금기 체크
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <Card className={`border-0 ${todayData.log?.noAlcohol !== false ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <CardContent className="p-3 text-center">
              <button
                onClick={() => handleRuleToggle('noAlcohol', !(todayData.log?.noAlcohol !== false))}
                className="w-full"
              >
                <Wine className={`w-6 h-6 mx-auto mb-1 ${
                  todayData.log?.noAlcohol !== false ? 'text-green-400' : 'text-red-400'
                }`} />
                <p className="text-xs font-medium">금주</p>
                {todayData.log?.noAlcohol !== false ? (
                  <CheckCircle2 className="w-4 h-4 mx-auto mt-1 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 mx-auto mt-1 text-red-400" />
                )}
              </button>
            </CardContent>
          </Card>

          <Card className={`border-0 ${todayData.log?.noFlour !== false ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <CardContent className="p-3 text-center">
              <button
                onClick={() => handleRuleToggle('noFlour', !(todayData.log?.noFlour !== false))}
                className="w-full"
              >
                <Wheat className={`w-6 h-6 mx-auto mb-1 ${
                  todayData.log?.noFlour !== false ? 'text-green-400' : 'text-red-400'
                }`} />
                <p className="text-xs font-medium">밀가루 금지</p>
                {todayData.log?.noFlour !== false ? (
                  <CheckCircle2 className="w-4 h-4 mx-auto mt-1 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 mx-auto mt-1 text-red-400" />
                )}
              </button>
            </CardContent>
          </Card>

          <Card className={`border-0 ${todayData.log?.noSugar !== false ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <CardContent className="p-3 text-center">
              <button
                onClick={() => handleRuleToggle('noSugar', !(todayData.log?.noSugar !== false))}
                className="w-full"
              >
                <Candy className={`w-6 h-6 mx-auto mb-1 ${
                  todayData.log?.noSugar !== false ? 'text-green-400' : 'text-red-400'
                }`} />
                <p className="text-xs font-medium">설탕 금지</p>
                {todayData.log?.noSugar !== false ? (
                  <CheckCircle2 className="w-4 h-4 mx-auto mt-1 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 mx-auto mt-1 text-red-400" />
                )}
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 주차별 허용 식품 */}
      {weekNotes && (
        <Card className="border-0 bg-card/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              {todayData.week}주차 허용 식품
            </h3>
            <div className="flex flex-wrap gap-2">
              {weekNotes.allowed?.map((food, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs"
                >
                  {food}
                </span>
              ))}
            </div>
            {weekNotes.forbidden && weekNotes.forbidden.length > 0 && (
              <>
                <h4 className="text-sm font-semibold mt-4 mb-2 text-red-400">금지 식품</h4>
                <div className="flex flex-wrap gap-2">
                  {weekNotes.forbidden.map((food, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs"
                    >
                      {food}
                    </span>
                  ))}
                </div>
              </>
            )}
            {weekNotes.tips && weekNotes.tips.length > 0 && (
              <>
                <h4 className="text-sm font-semibold mt-4 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  팁
                </h4>
                <ul className="space-y-1">
                  {weekNotes.tips.map((tip, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">• {tip}</li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
