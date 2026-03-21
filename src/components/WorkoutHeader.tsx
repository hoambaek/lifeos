'use client'

import { format, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Dumbbell, Trophy, Moon, ChevronLeft, ChevronRight } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

interface WorkoutHeaderProps {
  date: Date
  workoutPart: string
  completedCount: number
  totalCount: number
  isRestDay: boolean
  onPrevDay: () => void
  onNextDay: () => void
  onToday: () => void
}

export function WorkoutHeader({ date, workoutPart, completedCount, totalCount, isRestDay, onPrevDay, onNextDay, onToday }: WorkoutHeaderProps) {
  const allDone = completedCount === totalCount && totalCount > 0
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  const today = isToday(date)

  return (
    <header className="px-6">
      <div className="pt-12 pb-4">
        {/* 날짜 네비게이션 + 테마 토글 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevDay}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={onToday}
              className={`text-xs font-medium tracking-widest uppercase transition-colors ${
                today ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400 dark:text-stone-500 active:text-emerald-500'
              }`}
            >
              {format(date, 'M월 d일 EEEE', { locale: ko })}
              {today && <span className="ml-1.5 text-emerald-500">today</span>}
            </button>
            <button
              onClick={onNextDay}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <ThemeToggle />
        </div>

        {/* 타이틀 */}
        <div className="flex items-center gap-3 mb-5">
          {isRestDay ? (
            <Moon className="w-7 h-7 text-indigo-400" />
          ) : allDone ? (
            <Trophy className="w-7 h-7 text-amber-500" />
          ) : (
            <Dumbbell className="w-7 h-7 text-stone-400" />
          )}
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {isRestDay ? '휴식일' : today ? '오늘의 운동' : format(date, 'EEEE', { locale: ko }) + ' 운동'}
            </h1>
            {!isRestDay && (
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                {workoutPart} · {completedCount}/{totalCount} 완료
              </p>
            )}
          </div>
        </div>

        {/* 프로그레스 바 */}
        {!isRestDay && (
          <div className="h-2 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                allDone ? 'bg-emerald-500' : 'bg-stone-900 dark:bg-stone-100'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </header>
  )
}
