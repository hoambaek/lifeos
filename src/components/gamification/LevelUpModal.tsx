'use client'

import { useEffect, useState } from 'react'
import { useGamificationStore } from '@/stores/useGamificationStore'
import { getLevelTitle } from '@/lib/gamification/config'
import { Zap, Star } from 'lucide-react'
import { ConfettiEffect } from './ConfettiEffect'

export function LevelUpModal() {
  const { pendingAnimations, popAnimation } = useGamificationStore()
  const [showModal, setShowModal] = useState(false)
  const [levelData, setLevelData] = useState<{ newLevel: number } | null>(null)

  useEffect(() => {
    const levelUpAnimation = pendingAnimations.find((a) => a.type === 'level_up')

    if (levelUpAnimation && levelUpAnimation.data.newLevel) {
      setLevelData({ newLevel: levelUpAnimation.data.newLevel })
      setShowModal(true)
      popAnimation()
    }
  }, [pendingAnimations, popAnimation])

  const handleClose = () => {
    setShowModal(false)
    setLevelData(null)
  }

  if (!showModal || !levelData) return null

  const title = getLevelTitle(levelData.newLevel)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 컨페티 효과 */}
      <ConfettiEffect />

      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 모달 콘텐츠 */}
      <div className="relative level-up-container p-8 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-700 text-center">
        {/* 스파클 장식 */}
        <div className="absolute -top-3 -left-3">
          <Star className="w-6 h-6 text-yellow-400 sparkle" />
        </div>
        <div className="absolute -top-3 -right-3">
          <Star className="w-6 h-6 text-yellow-400 sparkle" style={{ animationDelay: '0.2s' }} />
        </div>
        <div className="absolute -bottom-3 -left-3">
          <Star className="w-6 h-6 text-lime-400 sparkle" style={{ animationDelay: '0.4s' }} />
        </div>
        <div className="absolute -bottom-3 -right-3">
          <Star className="w-6 h-6 text-lime-400 sparkle" style={{ animationDelay: '0.6s' }} />
        </div>

        {/* 레벨업 텍스트 */}
        <div className="mb-4">
          <span className="text-lime-400 text-sm font-bold tracking-widest">LEVEL UP!</span>
        </div>

        {/* 레벨 숫자 */}
        <div className="level-number flex items-center justify-center gap-3 mb-4">
          <Zap className="w-10 h-10 text-yellow-400" />
          <span className="text-7xl font-black text-white">
            {levelData.newLevel}
          </span>
        </div>

        {/* 타이틀 */}
        <div className="text-xl text-zinc-300 mb-6">{title}</div>

        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="px-8 py-3 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-lg transition-all hover:scale-105"
        >
          계속하기
        </button>
      </div>
    </div>
  )
}
