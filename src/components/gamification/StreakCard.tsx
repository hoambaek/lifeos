'use client'

import { useState } from 'react'
import { useGamificationStore } from '@/stores/useGamificationStore'
import { Flame, Snowflake, Zap, Trophy } from 'lucide-react'
import { StreakFreezeDialog } from './StreakFreezeDialog'

interface StreakCardProps {
  currentStreak: number
  longestStreak: number
  isTodayComplete: boolean
  isStreakAtRisk?: boolean
}

export function StreakCard({
  currentStreak,
  longestStreak,
  isTodayComplete,
  isStreakAtRisk = false,
}: StreakCardProps) {
  const { userGamification } = useGamificationStore()
  const [showFreezeDialog, setShowFreezeDialog] = useState(false)

  const streakFreezes = userGamification?.streakFreezes || 0
  const isHighStreak = currentStreak >= 7

  // 불꽃 강도 결정 (스트릭 길이에 따라)
  const fireIntensity =
    currentStreak >= 100 ? 'fire-intense' :
    currentStreak >= 30 ? 'fire-strong' :
    currentStreak >= 7 ? 'fire-medium' : 'fire-low'

  return (
    <>
      <div
        className={`streak-card relative overflow-hidden rounded-xl p-4 ${
          isTodayComplete
            ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30'
            : 'bg-zinc-900/50 border border-zinc-800'
        }`}
      >
        {/* 불꽃 배경 효과 */}
        {isTodayComplete && currentStreak > 0 && (
          <div className={`fire-background ${fireIntensity}`} />
        )}

        <div className="relative z-10">
          {/* 상단: 스트릭 숫자 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isTodayComplete ? 'bg-orange-500/30' : 'bg-zinc-800'
                }`}
              >
                <Flame
                  className={`w-7 h-7 ${
                    isTodayComplete ? 'text-orange-400 fire-effect' : 'text-zinc-500'
                  }`}
                />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-3xl font-black ${
                      isTodayComplete ? 'text-orange-400' : 'text-zinc-400'
                    }`}
                  >
                    {currentStreak}
                  </span>
                  <span className="text-sm text-zinc-500">일 연속</span>
                </div>
                {isHighStreak && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400">불꽃 상태!</span>
                  </div>
                )}
              </div>
            </div>

            {/* 프리즈 토큰 */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 rounded-lg">
                <Snowflake className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-cyan-400">x{streakFreezes}</span>
              </div>
            </div>
          </div>

          {/* 최장 스트릭 */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
            <Trophy className="w-3 h-3" />
            <span>최장 기록: {longestStreak}일</span>
          </div>

          {/* 스트릭 위험 알림 + 프리즈 버튼 */}
          {isStreakAtRisk && streakFreezes > 0 && (
            <button
              onClick={() => setShowFreezeDialog(true)}
              className="w-full py-2 px-4 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <Snowflake className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-cyan-400">프리즈로 스트릭 지키기</span>
            </button>
          )}

          {/* 오늘 미완료 경고 */}
          {!isTodayComplete && !isStreakAtRisk && currentStreak > 0 && (
            <div className="text-xs text-orange-400/80 text-center">
              오늘 퀘스트를 완료해서 스트릭을 이어가세요!
            </div>
          )}
        </div>
      </div>

      {/* 프리즈 다이얼로그 */}
      <StreakFreezeDialog
        open={showFreezeDialog}
        onClose={() => setShowFreezeDialog(false)}
        currentStreak={currentStreak}
        freezesAvailable={streakFreezes}
      />
    </>
  )
}
