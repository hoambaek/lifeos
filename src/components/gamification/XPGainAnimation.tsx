'use client'

import { useEffect, useState } from 'react'
import { useGamificationStore } from '@/stores/useGamificationStore'

export function XPGainAnimation() {
  const { pendingAnimations, popAnimation } = useGamificationStore()
  const [activeAnimations, setActiveAnimations] = useState<
    Array<{ id: string; amount: number; x: number; y: number }>
  >([])

  useEffect(() => {
    // XP 획득 애니메이션만 처리
    const xpAnimations = pendingAnimations.filter((a) => a.type === 'xp_gain')

    xpAnimations.forEach((animation) => {
      if (animation.data.amount) {
        const newAnimation = {
          id: animation.id,
          amount: animation.data.amount,
          x: animation.position?.x || window.innerWidth / 2,
          y: animation.position?.y || window.innerHeight / 2,
        }

        setActiveAnimations((prev) => [...prev, newAnimation])
        popAnimation()

        // 애니메이션 종료 후 제거
        setTimeout(() => {
          setActiveAnimations((prev) => prev.filter((a) => a.id !== animation.id))
        }, 1500)
      }
    })
  }, [pendingAnimations, popAnimation])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {activeAnimations.map((animation) => (
        <div
          key={animation.id}
          className="xp-gain absolute"
          style={{
            left: animation.x,
            top: animation.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          +{animation.amount} XP
        </div>
      ))}
    </div>
  )
}
