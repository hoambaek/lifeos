'use client'

import { useGamificationStore } from '@/stores/useGamificationStore'
import { ChallengeCard } from './ChallengeCard'
import { Target } from 'lucide-react'

export function ChallengeList() {
  const { activeChallenges, userChallenges } = useGamificationStore()

  if (activeChallenges.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-zinc-900/50 dark:via-zinc-900/40 dark:to-zinc-900/30 border border-slate-200/80 dark:border-zinc-800 shadow-sm shadow-slate-100/50 dark:shadow-none text-center">
        <Target className="w-8 h-8 text-slate-400 dark:text-zinc-600 mx-auto mb-2" />
        <p className="text-sm text-slate-500 dark:text-zinc-500">현재 활성화된 챌린지가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-5 h-5 text-green-600 dark:text-lime-400" />
        <h3 className="font-bold text-slate-700 dark:text-zinc-300">이번 주 챌린지</h3>
      </div>

      {activeChallenges.map((challenge) => {
        const userChallenge = userChallenges.find(
          (uc) => uc.challengeId === challenge.id
        )

        return (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            userChallenge={userChallenge}
          />
        )
      })}
    </div>
  )
}
