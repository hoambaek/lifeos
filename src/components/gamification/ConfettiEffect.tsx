'use client'

import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  size: number
}

const COLORS = ['#c8ff00', '#00d4ff', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff']

export function ConfettiEffect({ count = 50 }: { count?: number }) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const newParticles: Particle[] = []

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 1,
        duration: 2 + Math.random() * 2,
        size: 6 + Math.random() * 6,
      })
    }

    setParticles(newParticles)

    // 애니메이션 종료 후 정리
    const timer = setTimeout(() => {
      setParticles([])
    }, 4000)

    return () => clearTimeout(timer)
  }, [count])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[101]">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="confetti-particle"
          style={{
            left: `${particle.x}%`,
            backgroundColor: particle.color,
            width: particle.size,
            height: particle.size,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}
