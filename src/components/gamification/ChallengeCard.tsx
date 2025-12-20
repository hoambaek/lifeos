'use client'

import { useState } from 'react'
import { useGamificationStore } from '@/stores/useGamificationStore'
import type { Challenge, UserChallenge } from '@/stores/useGamificationStore'
import { Target, Clock, Gift, CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface ChallengeCardProps {
  challenge: Challenge
  userChallenge?: UserChallenge
}

export function ChallengeCard({ challenge, userChallenge }: ChallengeCardProps) {
  const { addXP, addAnimation } = useGamificationStore()
  const [isClaiming, setIsClaiming] = useState(false)

  const currentValue = userChallenge?.currentValue || 0
  const progress = Math.min((currentValue / challenge.targetValue) * 100, 100)
  const isCompleted = userChallenge?.completed || false
  const isClaimed = userChallenge?.claimed || false

  // 남은 시간 계산
  const endDate = new Date(challenge.endDate)
  const now = new Date()
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  const handleClaim = async () => {
    if (!isCompleted || isClaimed || isClaiming) return

    setIsClaiming(true)

    try {
      // XP 지급 API 호출
      await fetch('/api/gamification/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: challenge.xpReward,
          source: 'challenge',
          sourceId: challenge.id,
          description: `챌린지 완료: ${challenge.nameKo}`,
        }),
      })

      // 로컬 상태 업데이트
      addXP(challenge.xpReward, 'challenge')
      addAnimation({
        type: 'challenge_complete',
        data: { challenge },
      })
    } catch (error) {
      console.error('Failed to claim challenge:', error)
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <div
      className={`challenge-card relative p-4 rounded-xl transition-all ${
        isCompleted
          ? 'bg-lime-500/10 border border-lime-500/30'
          : 'bg-slate-100 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800'
      }`}
    >
      {/* 완료 버스트 효과 */}
      {isCompleted && !isClaimed && (
        <div className="challenge-burst" />
      )}

      <div className="relative z-10">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isCompleted ? 'bg-lime-500/20' : 'bg-slate-200 dark:bg-zinc-800'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-lime-500 dark:text-lime-400" />
              ) : (
                <Target className="w-5 h-5 text-slate-500 dark:text-zinc-500" />
              )}
            </div>
            <div>
              <h4 className={`font-bold ${isCompleted ? 'text-lime-600 dark:text-lime-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                {challenge.nameKo}
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-500">{challenge.descriptionKo}</p>
            </div>
          </div>

          {/* 타입 뱃지 */}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              challenge.type === 'weekly'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-purple-500/20 text-purple-400'
            }`}
          >
            {challenge.type === 'weekly' ? '주간' : '월간'}
          </span>
        </div>

        {/* 진행바 */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 dark:text-zinc-400">
              {currentValue} / {challenge.targetValue}
            </span>
            <span className="text-slate-500 dark:text-zinc-500">{Math.round(progress)}%</span>
          </div>
          <Progress
            value={progress}
            className={`h-2 ${isCompleted ? 'bg-lime-500/20' : 'bg-slate-200 dark:bg-zinc-800'}`}
          />
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            {/* 남은 시간 */}
            <div className="flex items-center gap-1 text-slate-500 dark:text-zinc-500">
              <Clock className="w-3 h-3" />
              <span>{daysRemaining}일 남음</span>
            </div>

            {/* 보상 */}
            <div className="flex items-center gap-1 text-green-600 dark:text-lime-400">
              <Gift className="w-3 h-3" />
              <span>+{challenge.xpReward} XP</span>
            </div>
          </div>

          {/* 보상 수령 버튼 */}
          {isCompleted && !isClaimed && (
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="px-3 py-1.5 bg-lime-500 hover:bg-lime-400 text-black text-xs font-bold rounded-lg transition-all flex items-center gap-1"
            >
              {isClaiming ? (
                <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Gift className="w-3 h-3" />
                  수령
                </>
              )}
            </button>
          )}

          {isClaimed && (
            <span className="text-xs text-slate-500 dark:text-zinc-500">수령 완료</span>
          )}
        </div>
      </div>
    </div>
  )
}
