'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format, addDays, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Coffee, Sun, Moon, ChevronLeft, ChevronRight,
  CheckCircle2, Plus, X
} from 'lucide-react'

interface DietLog {
  id: number
  date: string
  dayNumber: number
  week: number
  breakfastMenu: string | null
  lunchMenu: string | null
  dinnerMenu: string | null
  breakfastDone: boolean
  lunchDone: boolean
  dinnerDone: boolean
  noAlcohol: boolean
  noFlour: boolean
  noSugar: boolean
}

type MealType = 'breakfast' | 'lunch' | 'dinner'

const MEAL_CONFIG = {
  breakfast: {
    label: '아침',
    icon: Coffee,
    color: 'amber',
    bgDone: 'bg-amber-500/10',
    textDone: 'text-amber-600 dark:text-amber-400',
    iconDone: 'text-amber-500',
  },
  lunch: {
    label: '점심',
    icon: Sun,
    color: 'orange',
    bgDone: 'bg-orange-500/10',
    textDone: 'text-orange-600 dark:text-orange-400',
    iconDone: 'text-orange-500',
  },
  dinner: {
    label: '저녁',
    icon: Moon,
    color: 'purple',
    bgDone: 'bg-purple-500/10',
    textDone: 'text-purple-600 dark:text-purple-400',
    iconDone: 'text-purple-500',
  },
} as const

export default function DietPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [log, setLog] = useState<DietLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 각 끼니별 입력 값
  const [breakfastInput, setBreakfastInput] = useState('')
  const [lunchInput, setLunchInput] = useState('')
  const [dinnerInput, setDinnerInput] = useState('')

  // 자주 먹는 메뉴 (상위 5개)
  const [frequentMeals, setFrequentMeals] = useState<Record<MealType, string[]>>({
    breakfast: [],
    lunch: [],
    dinner: [],
  })

  const inputMap: Record<MealType, [string, (v: string) => void]> = {
    breakfast: [breakfastInput, setBreakfastInput],
    lunch: [lunchInput, setLunchInput],
    dinner: [dinnerInput, setDinnerInput],
  }

  const menuFieldMap: Record<MealType, 'breakfastMenu' | 'lunchMenu' | 'dinnerMenu'> = {
    breakfast: 'breakfastMenu',
    lunch: 'lunchMenu',
    dinner: 'dinnerMenu',
  }

  // 데이터 로드
  const loadData = useCallback(async (date: Date) => {
    setIsLoading(true)
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const res = await fetch(`/api/diet?type=date&date=${dateStr}`)

      if (res.ok) {
        const data = await res.json()
        const dietLog = data.log
        setLog(dietLog)

        // 기존 메뉴 값을 입력란에 설정
        setBreakfastInput(dietLog?.breakfastMenu || '')
        setLunchInput(dietLog?.lunchMenu || '')
        setDinnerInput(dietLog?.dinnerMenu || '')
      } else {
        setLog(null)
        setBreakfastInput('')
        setLunchInput('')
        setDinnerInput('')
      }
    } catch {
      setLog(null)
      setBreakfastInput('')
      setLunchInput('')
      setDinnerInput('')
    }
    setIsLoading(false)
  }, [])

  // 자주 먹는 메뉴 로드
  const loadFrequentMeals = useCallback(async () => {
    const meals: Record<MealType, string[]> = { breakfast: [], lunch: [], dinner: [] }
    const types: MealType[] = ['breakfast', 'lunch', 'dinner']

    await Promise.all(
      types.map(async (type) => {
        try {
          const res = await fetch(`/api/diet?type=frequent-meals&meal=${type}`)
          if (res.ok) {
            meals[type] = await res.json()
          }
        } catch { /* ignore */ }
      })
    )

    setFrequentMeals(meals)
  }, [])

  useEffect(() => {
    loadData(selectedDate)
  }, [selectedDate, loadData])

  useEffect(() => {
    loadFrequentMeals()
  }, [loadFrequentMeals])

  // 메뉴 저장
  const saveMeal = async (mealType: MealType, menu: string) => {
    const trimmed = menu.trim()
    if (!trimmed) return

    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const menuField = menuFieldMap[mealType]
    const doneField = `${mealType}Done`

    try {
      const res = await fetch('/api/diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'log',
          date: dateStr,
          [menuField]: trimmed,
          [doneField]: true,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setLog(updated)
        // 자주 먹는 메뉴 갱신
        loadFrequentMeals()
      }
    } catch (error) {
      console.error('Failed to save meal:', error)
    }
  }

  // 메뉴 삭제 (빈 값으로 저장)
  const clearMeal = async (mealType: MealType) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const menuField = menuFieldMap[mealType]
    const doneField = `${mealType}Done`
    const [, setInput] = inputMap[mealType]

    try {
      const res = await fetch('/api/diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'log',
          date: dateStr,
          [menuField]: '',
          [doneField]: false,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setLog(updated)
        setInput('')
      }
    } catch (error) {
      console.error('Failed to clear meal:', error)
    }
  }

  // 날짜 이동
  const goToDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') setSelectedDate(new Date())
    else if (direction === 'prev') setSelectedDate(subDays(selectedDate, 1))
    else setSelectedDate(addDays(selectedDate, 1))
  }

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  // 완료된 끼니 수
  const completedCount = [log?.breakfastMenu, log?.lunchMenu, log?.dinnerMenu].filter(m => m && m.trim()).length

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

  return (
    <div className="px-6 py-8 space-y-5 pb-24">
      {/* 헤더 */}
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-stone-800 dark:text-stone-200">
          식단 기록
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
          오늘 먹은 음식을 기록하세요
        </p>
      </div>

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

      {/* 진행 상태 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              completedCount === 3 ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-stone-700 dark:bg-stone-300'
            }`}
            style={{ width: `${(completedCount / 3) * 100}%` }}
          />
        </div>
        <span className="text-sm font-mono font-semibold text-stone-600 dark:text-stone-400">
          {completedCount}/3
        </span>
      </div>

      {/* 식사 입력 카드들 */}
      {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((mealType) => {
        const config = MEAL_CONFIG[mealType]
        const Icon = config.icon
        const savedMenu = log?.[menuFieldMap[mealType]]
        const hasSaved = savedMenu && savedMenu.trim()
        const [inputVal, setInput] = inputMap[mealType]
        const frequent = frequentMeals[mealType]

        return (
          <Card key={mealType} className="border-stone-200 dark:border-stone-800">
            <CardContent className="p-4">
              {/* 라벨 */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  hasSaved ? config.bgDone : 'bg-stone-100 dark:bg-stone-800'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    hasSaved ? config.iconDone : 'text-stone-400'
                  }`} />
                </div>
                <span className={`font-semibold text-sm ${
                  hasSaved ? config.textDone : 'text-stone-700 dark:text-stone-300'
                }`}>
                  {config.label}
                </span>
                {hasSaved && (
                  <CheckCircle2 className={`w-4 h-4 ml-auto ${config.iconDone}`} />
                )}
              </div>

              {/* 자주 먹는 메뉴 태그 */}
              {frequent.length > 0 && !hasSaved && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {frequent.map((menu, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(menu)
                        saveMeal(mealType, menu)
                      }}
                      className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors border border-stone-200 dark:border-stone-700"
                    >
                      {menu}
                    </button>
                  ))}
                </div>
              )}

              {/* 저장된 메뉴 표시 or 입력 폼 */}
              {hasSaved ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50">
                  <span className="text-sm text-stone-700 dark:text-stone-300">{savedMenu}</span>
                  <button
                    onClick={() => clearMeal(mealType)}
                    className="p-1 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                  >
                    <X className="w-4 h-4 text-stone-400" />
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    saveMeal(mealType, inputVal)
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={inputVal}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`${config.label} 메뉴를 입력하세요`}
                    className="flex-1 h-10 bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 text-sm"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!inputVal.trim()}
                    className="h-10 w-10 bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 disabled:opacity-30"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
