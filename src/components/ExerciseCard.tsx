'use client'

import Image from 'next/image'
import { WorkoutExercise } from '@/stores/useAppStore'
import { Check } from 'lucide-react'

interface ExerciseCardProps {
  exercise: WorkoutExercise
  index: number
  completedSets: number
  onSetComplete: () => void
}

export function ExerciseCard({ exercise, index, completedSets, onSetComplete }: ExerciseCardProps) {
  const allDone = completedSets >= exercise.sets

  return (
    <button
      onClick={onSetComplete}
      className={`w-full text-left rounded-2xl border-2 overflow-hidden transition-all duration-300 active:scale-[0.98] ${
        allDone
          ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20'
          : completedSets > 0
            ? 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10'
            : 'border-border bg-card hover:border-stone-300 dark:hover:border-stone-600'
      }`}
    >
      <div className="flex items-center">
        {/* 이미지 — 카드 왼쪽, 세로 가운데 */}
        <div className="flex-shrink-0 w-[112px] flex items-center justify-center">
          <Image
            src={exercise.image}
            alt={exercise.name}
            width={112}
            height={0}
            className={`w-full h-auto ${allDone ? 'opacity-40' : ''}`}
            sizes="112px"
          />
        </div>

        {/* 운동 정보 */}
        <div className="flex-1 min-w-0 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
              exercise.equipment === '덤벨'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : exercise.equipment === 'TRX'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                  : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
            }`}>
              {exercise.equipment === '덤벨' ? 'D' : exercise.equipment === 'TRX' ? 'T' : 'B'}
            </span>
            <h3 className={`font-semibold text-sm truncate ${
              allDone ? 'text-emerald-700 dark:text-emerald-300 line-through' : 'text-stone-900 dark:text-stone-100'
            }`}>
              {exercise.name}
            </h3>
          </div>
          <p className="text-xs font-mono text-stone-500 dark:text-stone-400">
            {exercise.reps}
          </p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 mb-2 line-clamp-2 leading-relaxed">
            {exercise.desc}
          </p>

          {/* Set indicators */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: exercise.sets }).map((_, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all text-[10px] font-bold ${
                  i < completedSets
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-stone-300 dark:border-stone-600 text-stone-400 dark:text-stone-500'
                }`}
              >
                {i < completedSets ? <Check className="w-3 h-3" strokeWidth={3} /> : i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}
