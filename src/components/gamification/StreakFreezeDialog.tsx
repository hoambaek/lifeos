'use client'

import { useState } from 'react'
import { useGamificationStore } from '@/stores/useGamificationStore'
import { Snowflake, Flame, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface StreakFreezeDialogProps {
  open: boolean
  onClose: () => void
  currentStreak: number
  freezesAvailable: number
}

export function StreakFreezeDialog({
  open,
  onClose,
  currentStreak,
  freezesAvailable,
}: StreakFreezeDialogProps) {
  const { useStreakFreeze } = useGamificationStore()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleUseFreeze = async () => {
    if (freezesAvailable <= 0 || isLoading) return

    setIsLoading(true)

    try {
      // API 호출
      const response = await fetch('/api/gamification/streak-freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStreak }),
      })

      if (response.ok) {
        useStreakFreeze()
        setSuccess(true)
        setTimeout(() => {
          onClose()
          setSuccess(false)
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to use streak freeze:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-cyan-400">
            <Snowflake className="w-5 h-5" />
            스트릭 프리즈
          </DialogTitle>
          <DialogDescription>
            프리즈를 사용하면 하루를 놓쳐도 스트릭이 유지됩니다.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto bg-cyan-500/20 rounded-full flex items-center justify-center mb-4">
              <Snowflake className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-cyan-400 mb-2">프리즈 적용 완료!</h3>
            <p className="text-zinc-400">
              {currentStreak}일 스트릭이 안전하게 보호되었습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 현재 상태 */}
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="text-zinc-300">현재 스트릭</span>
                </div>
                <span className="text-xl font-bold text-orange-400">{currentStreak}일</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Snowflake className="w-5 h-5 text-cyan-400" />
                  <span className="text-zinc-300">보유 프리즈</span>
                </div>
                <span className="text-xl font-bold text-cyan-400">{freezesAvailable}개</span>
              </div>
            </div>

            {/* 경고 메시지 */}
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-500/90">
                프리즈는 하루에 하나만 사용할 수 있으며, 사용 후에는 취소할 수 없습니다.
              </p>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUseFreeze}
                disabled={freezesAvailable <= 0 || isLoading}
                className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Snowflake className="w-4 h-4" />
                    프리즈 사용
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
