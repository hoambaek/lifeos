'use client'

import { Trophy } from 'lucide-react'

interface CompletionCelebrationProps {
  visible: boolean
}

export function CompletionCelebration({ visible }: CompletionCelebrationProps) {
  if (!visible) return null

  return (
    <div className="mx-4 mt-4 p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-emerald-50 dark:from-amber-950/30 dark:to-emerald-950/30 border border-amber-200/50 dark:border-amber-800/30 text-center animate-fade-in-up">
      <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-3" />
      <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
        오늘 운동 완료!
      </h3>
      <p className="text-sm text-stone-500 dark:text-stone-400">
        모든 운동을 마쳤습니다. 내일도 화이팅!
      </p>
    </div>
  )
}
