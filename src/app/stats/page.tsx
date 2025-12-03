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
  Legend,
} from 'recharts'
import { format, subDays, subWeeks, startOfWeek, endOfWeek } from 'date-fns'
import { ko } from 'date-fns/locale'
import { TrendingDown, Target, Flame, Activity, Zap, Droplets } from 'lucide-react'

interface DailyLogData {
  id: number
  date: string
  weight?: number
  proteinAmount: number
  waterDone: boolean
  cleanDiet: boolean
  workoutDone: boolean
}

interface InBodyRecord {
  id: number
  date: string
  weight: number
  skeletalMuscle: number
  bodyFatMass: number
  bodyFatPercent: number
  inbodyScore: number
}

type TimeRange = 'week' | 'month' | 'all'

export default function StatsPage() {
  const { config } = useAppStore()
  const [logs, setLogs] = useState<DailyLogData[]>([])
  const [inbodyRecords, setInbodyRecords] = useState<InBodyRecord[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const [weeklyStats, setWeeklyStats] = useState({
    water: 0,
    cleanDiet: 0,
    workout: 0,
    protein: 0,
  })

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
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

      const [logRes, inbodyRes] = await Promise.all([
        fetch(`/api/log?start=${format(start, 'yyyy-MM-dd')}&end=${format(end, 'yyyy-MM-dd')}`),
        fetch('/api/inbody'),
      ])
      const data = await logRes.json()
      const inbodyData = await inbodyRes.json()
      setLogs(data || [])
      setInbodyRecords(inbodyData || [])

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

  // 인바디 차트 데이터 준비
  const inbodyChartData = inbodyRecords
    .slice()
    .reverse()
    .map((record) => ({
      date: format(new Date(record.date), 'M/d'),
      muscle: record.skeletalMuscle,
      fat: record.bodyFatMass,
      fatPercent: record.bodyFatPercent,
      score: record.inbodyScore,
    }))

  // 인바디 변화 계산
  const firstInbody = inbodyRecords[inbodyRecords.length - 1]
  const lastInbody = inbodyRecords[0]
  const muscleChange = lastInbody && firstInbody ? lastInbody.skeletalMuscle - firstInbody.skeletalMuscle : 0
  const fatChange = lastInbody && firstInbody ? lastInbody.bodyFatMass - firstInbody.bodyFatMass : 0
  const fatPercentChange = lastInbody && firstInbody ? lastInbody.bodyFatPercent - firstInbody.bodyFatPercent : 0

  return (
    <div className="p-4 space-y-4">
      {/* 체중 변화 그래프 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
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
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: '#2563eb' }}
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

      {/* 인바디 지표 변화 그래프 */}
      {inbodyChartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              인바디 지표 변화
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inbodyChartData.length > 1 ? (
              <>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={inbodyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="date" fontSize={12} stroke="#888" />
                      <YAxis fontSize={12} stroke="#888" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a1e',
                          border: '1px solid #333',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="muscle"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ fill: '#22c55e' }}
                        name="골격근량 (kg)"
                      />
                      <Line
                        type="monotone"
                        dataKey="fat"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: '#ef4444' }}
                        name="체지방량 (kg)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 변화 요약 카드 */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                      <Zap className="w-3 h-3" />
                      골격근량
                    </div>
                    <p className={`text-lg font-bold ${muscleChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {muscleChange >= 0 ? '+' : ''}{muscleChange.toFixed(1)}kg
                    </p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                      <Droplets className="w-3 h-3" />
                      체지방량
                    </div>
                    <p className={`text-lg font-bold ${fatChange <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {fatChange >= 0 ? '+' : ''}{fatChange.toFixed(1)}kg
                    </p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                      <Target className="w-3 h-3" />
                      체지방률
                    </div>
                    <p className={`text-lg font-bold ${fatPercentChange <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {fatPercentChange >= 0 ? '+' : ''}{fatPercentChange.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  인바디 기록이 2개 이상 있어야 변화 추이를 확인할 수 있습니다
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  현재 기록: {inbodyChartData.length}개
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 인바디 점수 추이 */}
      {inbodyChartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              인바디 점수 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={inbodyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" fontSize={12} stroke="#888" />
                  <YAxis domain={[0, 100]} fontSize={12} stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1e',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}점`, '인바디 점수']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                    name="인바디 점수"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {lastInbody && firstInbody && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">점수 변화</p>
                <p className={`text-2xl font-bold ${lastInbody.inbodyScore >= firstInbody.inbodyScore ? 'text-green-500' : 'text-red-500'}`}>
                  {lastInbody.inbodyScore >= firstInbody.inbodyScore ? '+' : ''}
                  {lastInbody.inbodyScore - firstInbody.inbodyScore}점
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {firstInbody.inbodyScore}점 → {lastInbody.inbodyScore}점
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 이번 주 습관 달성률 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="w-5 h-5" />
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
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
