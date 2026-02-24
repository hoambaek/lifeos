'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/stores/useAppStore'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { TrendingDown, Target, Flame } from 'lucide-react'

// 스켈레톤 컴포넌트
const SkeletonBox = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-stone-200 dark:bg-stone-800 rounded-lg ${className}`} />
)

const SkeletonCard = ({ className }: { className?: string }) => (
  <Card className={className}>
    <CardHeader className="pb-2">
      <SkeletonBox className="h-6 w-32" />
    </CardHeader>
    <CardContent>
      <SkeletonBox className="h-48 w-full" />
    </CardContent>
  </Card>
)

interface DailyLogData {
  id: number
  date: string
  weight?: number
  proteinAmount: number
  waterDone: boolean
  cleanDiet: boolean
  workoutDone: boolean
}

type TimeRange = 'week' | 'month' | 'all'

export default function StatsPage() {
  const { config } = useAppStore()
  const [logs, setLogs] = useState<DailyLogData[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const [weeklyStats, setWeeklyStats] = useState({
    water: 0,
    cleanDiet: 0,
    workout: 0,
    protein: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // 설정 로드
        if (!config) {
          const configRes = await fetch('/api/config')
          const configData = await configRes.json()
          if (configData) {
            useAppStore.getState().setConfig(configData)
          }
        }

        // 기간에 따른 로그 조회
        let start: Date
        const end = new Date()

        switch (timeRange) {
          case 'week':
            start = subDays(end, 7)
            break
          case 'month':
            start = subDays(end, 30)
            break
          case 'all':
            start = config?.startDate ? new Date(config.startDate) : subDays(end, 180)
            break
        }

        const logRes = await fetch(`/api/log?start=${format(start, 'yyyy-MM-dd')}&end=${format(end, 'yyyy-MM-dd')}`)
        const data = await logRes.json()
        setLogs(data || [])

        // 이번 주 통계 계산
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
        const weekLogs = (data || []).filter((log: DailyLogData) => {
          const logDate = new Date(log.date)
          return logDate >= weekStart && logDate <= weekEnd
        })

        const totalDays = weekLogs.length || 1
        setWeeklyStats({
          water: Math.round((weekLogs.filter((l: DailyLogData) => l.waterDone).length / totalDays) * 100),
          cleanDiet: Math.round((weekLogs.filter((l: DailyLogData) => l.cleanDiet).length / totalDays) * 100),
          workout: Math.round((weekLogs.filter((l: DailyLogData) => l.workoutDone).length / totalDays) * 100),
          protein: Math.round(
            (weekLogs.filter((l: DailyLogData) => l.proteinAmount >= 150).length / totalDays) * 100
          ),
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [config, timeRange])

  // 차트 데이터 준비
  const chartData = logs
    .filter((log) => log.weight)
    .map((log) => ({
      date: format(new Date(log.date), 'M/d'),
      weight: log.weight,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // 체중 변화 계산
  const firstWeight = chartData[0]?.weight || config?.startWeight || 0
  const lastWeight = chartData[chartData.length - 1]?.weight || firstWeight
  const weightChange = firstWeight - lastWeight

  // 스켈레톤 로딩 UI
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {/* 체중 변화 그래프 스켈레톤 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <SkeletonBox className="h-6 w-24" />
              <div className="flex gap-1">
                <SkeletonBox className="h-8 w-12" />
                <SkeletonBox className="h-8 w-12" />
                <SkeletonBox className="h-8 w-12" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SkeletonBox className="h-48 w-full mb-4" />
            <div className="flex flex-col items-center gap-2">
              <SkeletonBox className="h-4 w-20" />
              <SkeletonBox className="h-8 w-24" />
            </div>
          </CardContent>
        </Card>

        {/* 이번 주 습관 달성률 스켈레톤 */}
        <Card>
          <CardHeader className="pb-2">
            <SkeletonBox className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <SkeletonBox className="h-4 w-20" />
                  <SkeletonBox className="h-4 w-10" />
                </div>
                <SkeletonBox className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 목표 달성 현황 스켈레톤 */}
        <Card>
          <CardHeader className="pb-2">
            <SkeletonBox className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center gap-4 mb-4">
              <div className="flex flex-col items-center gap-1">
                <SkeletonBox className="h-4 w-10" />
                <SkeletonBox className="h-6 w-16" />
              </div>
              <SkeletonBox className="h-6 w-6" />
              <div className="flex flex-col items-center gap-1">
                <SkeletonBox className="h-4 w-10" />
                <SkeletonBox className="h-6 w-16" />
              </div>
              <SkeletonBox className="h-6 w-6" />
              <div className="flex flex-col items-center gap-1">
                <SkeletonBox className="h-4 w-10" />
                <SkeletonBox className="h-6 w-16" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <SkeletonBox className="h-10 w-20" />
              <SkeletonBox className="h-4 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 space-y-8 pb-24">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-stone-800 dark:text-stone-200">
          통계
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">체중과 습관 달성률을 분석합니다</p>
        <hr className="editorial-rule mt-4" />
      </div>

      {/* 체중 변화 그래프 */}
      <Card className="border-stone-200 dark:border-stone-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-serif flex items-center gap-2 text-stone-800 dark:text-stone-200">
              <TrendingDown className="w-4 h-4 text-stone-500" />
              체중 변화
            </CardTitle>
            <div className="flex gap-1">
              {(['week', 'month', 'all'] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range === 'week' ? '1주' : range === 'month' ? '1달' : '전체'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis
                      domain={['dataMin - 1', 'dataMax + 1']}
                      fontSize={12}
                      tickFormatter={(value) => `${value}kg`}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value}kg`, '체중']}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#92400E"
                      strokeWidth={2}
                      dot={{ fill: '#92400E' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  해당 기간 변화
                </p>
                <p className={`text-2xl font-bold ${weightChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {weightChange > 0 ? '-' : '+'}{Math.abs(weightChange).toFixed(1)}kg
                </p>
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              체중 기록이 없습니다
            </div>
          )}
        </CardContent>
      </Card>

      {/* 이번 주 습관 달성률 */}
      <Card className="border-stone-200 dark:border-stone-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-serif flex items-center gap-2 text-stone-800 dark:text-stone-200">
            <Flame className="w-4 h-4 text-stone-500" />
            이번 주 습관 달성률
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>💧 물 3L</span>
              <span>{weeklyStats.water}%</span>
            </div>
            <Progress value={weeklyStats.water} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>🍗 단백질 150g</span>
              <span>{weeklyStats.protein}%</span>
            </div>
            <Progress value={weeklyStats.protein} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>🌙 야식 금지</span>
              <span>{weeklyStats.cleanDiet}%</span>
            </div>
            <Progress value={weeklyStats.cleanDiet} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>🏋️ 운동</span>
              <span>{weeklyStats.workout}%</span>
            </div>
            <Progress value={weeklyStats.workout} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* 목표 달성 현황 */}
      {config && (
        <Card className="border-stone-200 dark:border-stone-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-serif flex items-center gap-2 text-stone-800 dark:text-stone-200">
              <Target className="w-4 h-4 text-stone-500" />
              목표 달성 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="flex justify-center items-center gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">시작</p>
                  <p className="text-xl font-bold">{config.startWeight}kg</p>
                </div>
                <div className="text-2xl">→</div>
                <div>
                  <p className="text-sm text-muted-foreground">현재</p>
                  <p className="text-xl font-bold text-primary">
                    {lastWeight || config.startWeight}kg
                  </p>
                </div>
                <div className="text-2xl">→</div>
                <div>
                  <p className="text-sm text-muted-foreground">목표</p>
                  <p className="text-xl font-bold text-green-500">{config.goalWeight}kg</p>
                </div>
              </div>
              <div className="text-3xl font-bold">
                {((config.startWeight - (lastWeight || config.startWeight)) /
                  (config.startWeight - config.goalWeight) *
                  100
                ).toFixed(0)}%
              </div>
              <p className="text-sm text-muted-foreground">목표 달성률</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
