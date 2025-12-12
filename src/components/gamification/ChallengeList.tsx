'use client'

import { useGamificationStore } from '@/stores/useGamificationStore'
import { ChallengeCard } from './ChallengeCard'
import { Target } from 'lucide-react'

export function ChallengeList() {
  const { activeChallenges, userChallenges } = useGamificationStore()

  if (activeChallenges.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center">
        <Target className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">현재 활성화된 챌린지가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-5 h-5 text-lime-400" />
        <h3 className="font-bold text-zinc-300">이번 주 챌린지</h3>
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
