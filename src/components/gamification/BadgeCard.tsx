'use client'

import { TIER_COLORS } from '@/lib/gamification/config'
import type { Achievement } from '@/stores/useGamificationStore'
import { Lock } from 'lucide-react'

interface BadgeCardProps {
  achievement: Achievement
  unlocked: boolean
  unlockedAt?: Date
  compact?: boolean
}

export function BadgeCard({ achievement, unlocked, unlockedAt, compact = false }: BadgeCardProps) {
  const tierColor = TIER_COLORS[achievement.tier as keyof typeof TIER_COLORS] || TIER_COLORS.bronze

  if (compact) {
    return (
      <div
        className={`relative w-14 h-14 rounded-xl flex items-center justify-center ${
          unlocked
            ? `${tierColor.bg} border ${tierColor.border} shadow-lg ${tierColor.glow}`
            : 'bg-zinc-900 border border-zinc-800 opacity-40'
        }`}
      >
        {unlocked ? (
          <span className="text-2xl">{achievement.iconEmoji}</span>
        ) : (
          <Lock className="w-5 h-5 text-zinc-600" />
        )}
      </div>
    )
  }

  return (
    <div
      className={`badge-card relative p-4 rounded-xl transition-all ${
        unlocked
          ? `${tierColor.bg} border ${tierColor.border} shadow-lg ${tierColor.glow}`
          : 'bg-zinc-900/50 border border-zinc-800 opacity-60'
      }`}
    >
      {/* 뱃지 아이콘 */}
      <div className="flex items-start gap-3">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            unlocked ? 'bg-black/20' : 'bg-zinc-800'
          }`}
        >
          {unlocked ? (
            <span className="text-3xl">{achievement.iconEmoji}</span>
          ) : (
            <Lock className="w-6 h-6 text-zinc-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={`font-bold truncate ${unlocked ? tierColor.text : 'text-zinc-500'}`}>
            {achievement.nameKo}
          </h4>
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
            {achievement.descriptionKo}
          </p>
        </div>
      </div>

      {/* XP 보상 */}
      {unlocked && (
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-lime-400 font-bold">+{achievement.xpReward} XP</span>
          {unlockedAt && (
            <span className="text-zinc-600">
              {new Date(unlockedAt).toLocaleDateString('ko-KR')}
            </span>
          )}
        </div>
      )}

      {/* 티어 뱃지 */}
      <div
        className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
          unlocked ? tierColor.bg : 'bg-zinc-800'
        } ${unlocked ? tierColor.text : 'text-zinc-600'}`}
      >
        {achievement.tier}
      </div>
    </div>
  )
}
