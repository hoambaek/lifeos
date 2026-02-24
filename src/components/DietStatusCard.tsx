'use client'

import { useEffect, useState } from 'react'
import { Utensils, Coffee, Sun, Moon, CheckCircle2, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface DietLog {
  breakfastMenu: string | null
  lunchMenu: string | null
  dinnerMenu: string | null
  breakfastDone: boolean
  lunchDone: boolean
  dinnerDone: boolean
}

export function DietStatusCard() {
  const [log, setLog] = useState<DietLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/diet?type=today')
        if (res.ok) {
          const data = await res.json()
          setLog(data.log)
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl h-32 bg-stone-100 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700" />
    )
  }

  const meals = [
    { key: 'breakfast', label: '아침', icon: Coffee, menu: log?.breakfastMenu },
    { key: 'lunch', label: '점심', icon: Sun, menu: log?.lunchMenu },
    { key: 'dinner', label: '저녁', icon: Moon, menu: log?.dinnerMenu },
  ]

  const completedCount = meals.filter(m => m.menu && m.menu.trim()).length

  return (
    <Link href="/diet" className="block">
      <div className="relative overflow-hidden rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 transition-all group">
        <div className="relative z-10 p-5">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-stone-900 dark:bg-stone-100 flex items-center justify-center">
                <Utensils className="w-5 h-5 text-stone-50 dark:text-stone-900" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-stone-800 dark:text-stone-200">
                  식단 기록
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {completedCount === 0 ? '오늘의 식사를 기록해보세요' : `${completedCount}/3 기록 완료`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 group-hover:translate-x-1 transition-all" />
          </div>

          {/* 끼니별 상태 */}
          <div className="space-y-2">
            {meals.map((meal) => {
              const hasMenu = meal.menu && meal.menu.trim()
              return (
                <div
                  key={meal.key}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                    hasMenu
                      ? 'bg-stone-100 dark:bg-stone-800'
                      : 'bg-stone-50 dark:bg-stone-900/30'
                  }`}
                >
                  <meal.icon className={`w-4 h-4 ${
                    hasMenu ? 'text-stone-700 dark:text-stone-300' : 'text-stone-400'
                  }`} />
                  <span className={`text-sm flex-1 ${
                    hasMenu ? 'text-stone-700 dark:text-stone-300' : 'text-stone-400'
                  }`}>
                    {hasMenu ? meal.menu : `${meal.label} 미기록`}
                  </span>
                  {hasMenu && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Link>
  )
}
