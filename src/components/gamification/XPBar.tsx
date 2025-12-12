'use client'

import { useGamificationStore } from '@/stores/useGamificationStore'
import { getLevelTitle } from '@/lib/gamification/config'
import { Zap } from 'lucide-react'

interface XPBarProps {
  compact?: boolean
}

export function XPBar({ compact = false }: XPBarProps) {
  const { userGamification, getLevelProgress, getXPToNextLevel } = useGamificationStore()

  if (!userGamification) return null

  const progress = getLevelProgress()
  const xpToNext = getXPToNextLevel()
  const title = getLevelTitle(userGamification.currentLevel)

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="level-badge">
          <span className="text-xs font-bold">Lv.{userGamification.currentLevel}</span>
        </div>
        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full xp-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-zinc-500">{userGamification.totalXP} XP</span>
      </div>
    )
  }

  return (
    <div className="xp-bar-container p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="level-badge-large">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="font-bold text-lg">Lv.{userGamification.currentLevel}</span>
          </div>
          <span className="text-sm text-zinc-400">{title}</span>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-lime-400">{userGamification.totalXP.toLocaleString()}</span>
          <span className="text-sm text-zinc-500 ml-1">XP</span>
        </div>
      </div>

      <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 xp-bar-fill rounded-full"
          style={{ width: `${progress}%` }}
        />
        {progress > 0 && <div className="absolute inset-0 xp-bar-shimmer" />}
      </div>

      <div className="flex justify-between mt-1.5 text-xs text-zinc-500">
        <span>{progress}%</span>
        <span>다음 레벨까지 {xpToNext.toLocaleString()} XP</span>
      </div>
    </div>
  )
}
