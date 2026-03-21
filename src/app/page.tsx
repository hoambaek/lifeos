'use client'

import { useEffect, useState, useCallback } from 'react'
import { addDays, subDays, format, isToday } from 'date-fns'
import { WORKOUT_ROUTINE, WORKOUT_DETAILS, WorkoutExercise } from '@/stores/useAppStore'
import { WorkoutHeader } from '@/components/WorkoutHeader'
import { ExerciseCard } from '@/components/ExerciseCard'
import { CompletionCelebration } from '@/components/CompletionCelebration'

export default function WorkoutPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [completedSets, setCompletedSets] = useState<number[]>([])
  const [isLoadingSets, setIsLoadingSets] = useState(true)

  const todayWorkout = WORKOUT_ROUTINE[selectedDate.getDay()]
  const isRestDay = todayWorkout === '휴식'
  const exercises: WorkoutExercise[] = isRestDay ? [] : (WORKOUT_DETAILS[todayWorkout] || [])
  const isTodaySelected = isToday(selectedDate)

  // 날짜별 완료 상태만 비동기 로드 (UI는 즉시 표시)
  const loadLog = useCallback(async (date: Date) => {
    setIsLoadingSets(true)
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const res = await fetch(`/api/log?date=${dateStr}`)
      const data = await res.json()
      if (data?.completedExercises) {
        const saved = Array.isArray(data.completedExercises)
          ? data.completedExercises
          : JSON.parse(data.completedExercises)
        setCompletedSets(saved)
      } else {
        const workout = WORKOUT_ROUTINE[date.getDay()]
        const exs = workout === '휴식' ? [] : (WORKOUT_DETAILS[workout] || [])
        setCompletedSets(new Array(exs.length).fill(0))
      }
    } catch {
      setCompletedSets(new Array(exercises.length).fill(0))
    } finally {
      setIsLoadingSets(false)
    }
  }, [])

  useEffect(() => {
    // 초기값을 0으로 즉시 세팅 (로딩 중에도 UI 표시)
    setCompletedSets(new Array(exercises.length).fill(0))
    loadLog(selectedDate)
  }, [selectedDate, loadLog, exercises.length])

  // 날짜 이동
  const goToPrevDay = () => setSelectedDate(prev => subDays(prev, 1))
  const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1))
  const goToToday = () => setSelectedDate(new Date())

  // 세트 완료 핸들러
  const handleSetComplete = useCallback((index: number) => {
    if (!isTodaySelected) return

    setCompletedSets(prev => {
      const next = [...prev]
      while (next.length <= index) next.push(0)

      const maxSets = exercises[index]?.sets || 3
      if (next[index] >= maxSets) {
        next[index] = 0
      } else {
        next[index] = next[index] + 1
      }

      const allDone = exercises.every((ex, i) => (next[i] || 0) >= ex.sets)

      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedExercises: next,
          workoutDone: allDone,
          workoutPart: todayWorkout,
        }),
      }).catch(e => console.error('Failed to save:', e))

      return next
    })
  }, [exercises, todayWorkout, isTodaySelected])

  const doneCount = exercises.filter((ex, i) => (completedSets[i] || 0) >= ex.sets).length
  const allDone = doneCount === exercises.length && exercises.length > 0

  return (
    <div className="min-h-screen bg-background pb-8">
      <WorkoutHeader
        date={selectedDate}
        workoutPart={todayWorkout}
        completedCount={doneCount}
        totalCount={exercises.length}
        isRestDay={isRestDay}
        onPrevDay={goToPrevDay}
        onNextDay={goToNextDay}
        onToday={goToToday}
      />

      {isRestDay ? (
        <div className="px-6 pt-12 text-center">
          <p className="text-6xl mb-4">😴</p>
          <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            오늘은 쉬는 날
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            충분한 휴식도 운동의 일부입니다.
          </p>
        </div>
      ) : (
        <>
          {!isTodaySelected && (
            <div className="mx-4 mb-3 px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800/50 text-center">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                다른 날의 운동 목록입니다 (체크는 오늘만 가능)
              </p>
            </div>
          )}

          {/* 운동 체크리스트 — 즉시 표시 */}
          <div className="px-4 pt-4 space-y-3">
            {exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.name}
                exercise={exercise}
                index={index}
                completedSets={completedSets[index] || 0}
                onSetComplete={() => handleSetComplete(index)}
              />
            ))}
          </div>

          <CompletionCelebration visible={allDone} />
        </>
      )}

      {!isRestDay && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[11px] text-stone-400">덤벨</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-[11px] text-stone-400">TRX</span>
          </div>
        </div>
      )}
    </div>
  )
}
