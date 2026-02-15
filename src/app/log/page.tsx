'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { useAppStore, PROTEIN_FOODS } from '@/stores/useAppStore'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Scale, Check, X } from 'lucide-react'

// 스켈레톤 컴포넌트
const SkeletonBox = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-stone-200 dark:bg-stone-800 rounded-lg ${className}`} />
)

interface DailyLogData {
  id: number
  date: string
  weight?: number
  proteinAmount: number
  waterDone: boolean
  cleanDiet: boolean
  workoutDone: boolean
  workoutPart?: string
}

export default function LogPage() {
  const { todayLog, updateTodayLog, setTodayLog } = useAppStore()
  const [weight, setWeight] = useState('')
  const [monthLogs, setMonthLogs] = useState<DailyLogData[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // 오늘 로그와 월별 로그 병렬 로드
        const start = format(startOfMonth(selectedDate), 'yyyy-MM-dd')
        const end = format(endOfMonth(selectedDate), 'yyyy-MM-dd')

        const [todayRes, monthRes] = await Promise.all([
          fetch('/api/log'),
          fetch(`/api/log?start=${start}&end=${end}`),
        ])

        const todayData = await todayRes.json()
        const monthData = await monthRes.json()

        if (todayData) {
          setTodayLog(todayData)
          if (todayData.weight) {
            setWeight(todayData.weight.toString())
          }
        }
        setMonthLogs(monthData || [])
      } finally {
        setIsLoading(false)
      }
    }
    loadInitialData()
  }, [setTodayLog])

  // 월 변경 시 월별 로그 로드
  useEffect(() => {
    if (isLoading) return // 초기 로딩 중에는 스킵

    const loadMonthLogs = async () => {
      const start = format(startOfMonth(selectedDate), 'yyyy-MM-dd')
      const end = format(endOfMonth(selectedDate), 'yyyy-MM-dd')
      const res = await fetch(`/api/log?start=${start}&end=${end}`)
      const data = await res.json()
      setMonthLogs(data || [])
    }
    loadMonthLogs()
  }, [selectedDate, isLoading])

  // 체중 저장
  const handleSaveWeight = async () => {
    const weightValue = parseFloat(weight)
    if (isNaN(weightValue)) return

    updateTodayLog({ weight: weightValue })
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...todayLog, weight: weightValue }),
    })
  }

  // 단백질 추가
  const addProtein = async (amount: number) => {
    const newAmount = (todayLog?.proteinAmount || 0) + amount
    updateTodayLog({ proteinAmount: newAmount })
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...todayLog, proteinAmount: newAmount }),
    })
  }

  // 날짜별 성공 여부 확인
  const getDayStatus = (date: Date) => {
    const log = monthLogs.find((l) => isSameDay(new Date(l.date), date))
    if (!log) return null

    const quests = [log.waterDone, log.cleanDiet, log.workoutDone, log.proteinAmount >= 150]
    const completed = quests.filter(Boolean).length
    return completed >= 3 ? 'success' : completed >= 1 ? 'partial' : 'fail'
  }

  // 스켈레톤 로딩 UI
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {/* 체중 기록 스켈레톤 */}
        <Card>
          <CardHeader className="pb-2">
            <SkeletonBox className="h-6 w-28" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <SkeletonBox className="h-10 flex-1" />
              <SkeletonBox className="h-10 w-16" />
            </div>
          </CardContent>
        </Card>

        {/* 단백질 계산기 스켈레톤 */}
        <Card>
          <CardHeader className="pb-2">
            <SkeletonBox className="h-6 w-28" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <SkeletonBox key={i} className="h-16" />
              ))}
            </div>
            <SkeletonBox className="h-24 w-full" />
          </CardContent>
        </Card>

        {/* 캘린더 스켈레톤 */}
        <Card>
          <CardHeader className="pb-2">
            <SkeletonBox className="h-6 w-28" />
          </CardHeader>
          <CardContent>
            <SkeletonBox className="h-72 w-full" />
            <div className="flex justify-center gap-4 mt-4">
              <SkeletonBox className="h-4 w-20" />
              <SkeletonBox className="h-4 w-20" />
              <SkeletonBox className="h-4 w-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 space-y-8 pb-32">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-stone-800 dark:text-stone-200">
          기록
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">체중과 단백질 섭취를 추적합니다</p>
        <hr className="editorial-rule mt-4" />
      </div>

      {/* 체중 기록 */}
      <Card className="border-stone-200 dark:border-stone-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-serif flex items-center gap-2 text-stone-800 dark:text-stone-200">
            <Scale className="w-4 h-4 text-stone-500" />
            오늘의 체중
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.1"
              placeholder="공복 체중 입력"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="text-lg"
            />
            <Button onClick={handleSaveWeight}>저장</Button>
          </div>
          {todayLog?.weight && (
            <p className="text-sm text-muted-foreground mt-2">
              오늘 기록: {todayLog.weight}kg
            </p>
          )}
        </CardContent>
      </Card>

      {/* 단백질 계산기 */}
      <Card className="border-stone-200 dark:border-stone-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-serif text-stone-800 dark:text-stone-200">단백질 계산기</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {PROTEIN_FOODS.map((food) => (
              <Button
                key={food.name}
                variant="outline"
                className="h-16 flex flex-col p-1"
                onClick={() => addProtein(food.protein)}
              >
                <span className="text-xl">{food.emoji}</span>
                <span className="text-[10px]">+{food.protein}g</span>
              </Button>
            ))}
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">오늘 섭취량</p>
            <p className="text-3xl font-bold">{todayLog?.proteinAmount || 0}g</p>
            <p className="text-sm text-muted-foreground">/ 150g 목표</p>
          </div>
        </CardContent>
      </Card>

      {/* 캘린더 뷰 */}
      <Card className="border-stone-200 dark:border-stone-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-serif text-stone-800 dark:text-stone-200">이번 달 기록</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={ko}
            className="rounded-md border w-full"
            modifiers={{
              success: (date) => getDayStatus(date) === 'success',
              partial: (date) => getDayStatus(date) === 'partial',
              fail: (date) => getDayStatus(date) === 'fail',
            }}
          />
          <div className="flex justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <span>3개 이상 달성</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-yellow-500" />
              <span>1-2개 달성</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-red-500" />
              <span>미달성</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
