'use client'

import { useGamificationStore } from '@/stores/useGamificationStore'
import { ChallengeCard } from './ChallengeCard'
import { Target } from 'lucide-react'

export function ChallengeList() {
  const { activeChallenges, userChallenges } = useGamificationStore()

  if (activeChallenges.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 text-center">
        <Target className="w-8 h-8 text-stone-400 dark:text-stone-600 mx-auto mb-2" />
        <p className="text-sm text-stone-500 dark:text-stone-400">현재 활성화된 챌린지가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
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
