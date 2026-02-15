'use client'

import { Shield, Brain, Zap, TrendingUp } from 'lucide-react'
import {
  getCognitiveShieldData,
  getShieldColorClasses,
  getShieldEmoji,
  type ShieldStatus,
} from '@/lib/gamification/cognitiveShield'

interface CognitiveShieldProps {
  currentStreak: number
  totalWorkouts: number
  perfectDays?: number
  compact?: boolean
}

export function CognitiveShield({
  currentStreak,
  totalWorkouts,
  perfectDays = 0,
  compact = false,
}: CognitiveShieldProps) {
  const shieldData = getCognitiveShieldData(currentStreak, totalWorkouts, perfectDays)
  const colorClasses = getShieldColorClasses(shieldData.status)
  const emoji = getShieldEmoji(shieldData.status)

  // 컴팩트 버전
  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colorClasses.bg} border ${colorClasses.border}`}>
        <Shield className={`w-4 h-4 ${colorClasses.text}`} />
        <span className={`text-sm font-semibold ${colorClasses.text}`}>{shieldData.level}%</span>
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl p-4 ${colorClasses.bg} border ${colorClasses.border} shadow-sm ${
        shieldData.status === 'fortified' ? 'shield-fortified shadow-lg shadow-amber-200/30 dark:shadow-amber-900/20' : 'shadow-stone-100/50 dark:shadow-none'
      }`}
    >
      {/* 배경 효과 */}
      {shieldData.status === 'fortified' && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-500/10 animate-pulse" />
      )}

      <div className="relative z-10">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses.bg}`}>
              <Shield className={`w-6 h-6 ${colorClasses.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">COGNITIVE SHIELD</span>
                <span className="text-lg">{emoji}</span>
              </div>
              <span className={`text-xs ${colorClasses.text}`}>
                {shieldData.statusMessage.status}
              </span>
            </div>
          </div>

          {/* 퍼센트 표시 */}
          <div className="text-right">
            <span className={`text-2xl font-black ${colorClasses.text}`}>
              {shieldData.level}
            </span>
            <span className="text-sm text-stone-500 dark:text-stone-500">%</span>
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div className="relative h-3 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden mb-3">
          <div
            className={`absolute inset-y-0 left-0 ${colorClasses.progress} rounded-full transition-all duration-500`}
            style={{ width: `${shieldData.level}%` }}
          />
          {/* 마일스톤 마커 */}
          <div className="absolute inset-0 flex justify-between px-1">
            <div className="w-px bg-stone-300 dark:bg-stone-700" style={{ marginLeft: '30%' }} />
            <div className="w-px bg-stone-300 dark:bg-stone-700" style={{ marginLeft: '60%' }} />
            <div className="w-px bg-stone-300 dark:bg-stone-700" style={{ marginLeft: '85%' }} />
          </div>
        </div>

        {/* 상태 메시지 */}
        <div className="flex items-center gap-2">
          <Brain className={`w-4 h-4 ${colorClasses.text} flex-shrink-0`} />
          <p className="text-xs text-stone-600 dark:text-stone-400">
            {shieldData.statusMessage.message}
          </p>
        </div>

        {/* 구성 요소 표시 */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-orange-400" />
            <span className="text-xs text-stone-500 dark:text-stone-500">
              스트릭 <span className="text-stone-700 dark:text-stone-300">{currentStreak}일</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-xs text-stone-500 dark:text-stone-500">
              운동 <span className="text-stone-700 dark:text-stone-300">{totalWorkouts}회</span>
            </span>
          </div>
          {perfectDays > 0 && (
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-violet-400" />
              <span className="text-xs text-stone-500 dark:text-stone-500">
                퍼펙트 <span className="text-stone-700 dark:text-stone-300">{perfectDays}일</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
