'use client'

import { useEffect, useState } from 'react'
import { useGamificationStore } from '@/stores/useGamificationStore'
import { TIER_COLORS } from '@/lib/gamification/config'
import type { Achievement } from '@/stores/useGamificationStore'
import { Star, Snowflake } from 'lucide-react'

export function BadgeUnlockModal() {
  const { pendingAnimations, popAnimation } = useGamificationStore()
  const [showModal, setShowModal] = useState(false)
  const [achievement, setAchievement] = useState<Achievement | null>(null)

  useEffect(() => {
    const badgeAnimation = pendingAnimations.find((a) => a.type === 'badge_unlock')

    if (badgeAnimation && badgeAnimation.data.achievement) {
      setAchievement(badgeAnimation.data.achievement)
      setShowModal(true)
      popAnimation()
    }
  }, [pendingAnimations, popAnimation])

  const handleClose = () => {
    setShowModal(false)
    setAchievement(null)
  }

  if (!showModal || !achievement) return null

  const tierColor = TIER_COLORS[achievement.tier as keyof typeof TIER_COLORS] || TIER_COLORS.bronze

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 모달 콘텐츠 */}
      <div className="relative p-8 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-700 text-center max-w-sm mx-4">
        {/* 스파클 효과 */}
        <div className="absolute -top-4 left-1/4 sparkle">
          <Star className="w-5 h-5 text-yellow-400" />
        </div>
        <div className="absolute -top-2 right-1/4 sparkle" style={{ animationDelay: '0.2s' }}>
          <Star className="w-4 h-4 text-lime-400" />
        </div>
        <div className="absolute top-1/4 -left-3 sparkle" style={{ animationDelay: '0.4s' }}>
          <Star className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="absolute top-1/4 -right-3 sparkle" style={{ animationDelay: '0.6s' }}>
          <Star className="w-5 h-5 text-yellow-400" />
        </div>

        {/* 업적 달성 텍스트 */}
        <div className="mb-4">
          <span className={`text-sm font-bold tracking-widest ${tierColor.text}`}>
            업적 달성!
          </span>
        </div>

        {/* 뱃지 아이콘 */}
        <div
          className={`badge-unlock mx-auto w-24 h-24 rounded-2xl flex items-center justify-center ${tierColor.bg} border-2 ${tierColor.border} shadow-2xl ${tierColor.glow}`}
        >
          <span className="text-5xl">{achievement.iconEmoji}</span>
        </div>

        {/* 뱃지 이름 */}
        <h3 className={`text-2xl font-bold mt-4 ${tierColor.text}`}>
          {achievement.nameKo}
        </h3>

        {/* 설명 */}
        <p className="text-zinc-400 mt-2">{achievement.descriptionKo}</p>

        {/* 보상 */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="px-3 py-1.5 bg-lime-500/20 rounded-lg">
            <span className="text-lime-400 font-bold">+{achievement.xpReward} XP</span>
          </div>
          {achievement.freezeReward > 0 && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 rounded-lg">
              <Snowflake className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 font-bold">+{achievement.freezeReward}</span>
            </div>
          )}
        </div>

        {/* 티어 */}
        <div className={`mt-4 text-xs ${tierColor.text} uppercase font-bold tracking-wider`}>
          {achievement.tier} Achievement
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className={`mt-6 px-8 py-3 ${tierColor.bg} border ${tierColor.border} ${tierColor.text} font-bold rounded-lg transition-all hover:scale-105`}
        >
          확인
        </button>
      </div>
    </div>
  )
}
