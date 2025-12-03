'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Upload,
  Camera,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Droplets,
  Target,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  ImageIcon,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface InBodyRecord {
  id: number
  date: string
  imagePath: string
  weight: number
  skeletalMuscle: number
  bodyFatMass: number
  bodyFatPercent: number
  bmi: number
  visceralFat: number
  inbodyScore: number
  bmr: number
  bodyWater?: number
  protein?: number
  minerals?: number
  segmentalMuscle?: string
  segmentalFat?: string
  aiAnalysis?: string
}

interface AIAnalysis {
  summary: string
  highlights: string[]
  recommendations: string[]
  nextGoal: string
}

export default function InBodyPage() {
  const [records, setRecords] = useState<InBodyRecord[]>([])
  const [latestRecord, setLatestRecord] = useState<InBodyRecord | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string>('')
  const [analyzeError, setAnalyzeError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 수동 입력 폼 상태
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: '',
    skeletalMuscle: '',
    bodyFatMass: '',
    bodyFatPercent: '',
    bmi: '',
    visceralFat: '',
    inbodyScore: '',
    bmr: '',
    bodyWater: '',
    protein: '',
    minerals: '',
  })

  // 데이터 로드
  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      const [allRes, latestRes] = await Promise.all([
        fetch('/api/inbody'),
        fetch('/api/inbody?latest=true'),
      ])
      const allData = await allRes.json()
      const latestData = await latestRes.json()

      setRecords(allData || [])
      setLatestRecord(latestData)
    } catch (error) {
      console.error('Failed to load records:', error)
    }
  }

  // 파일 선택 핸들러 - AI 자동 분석
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFileName(file.name)
    setAnalyzeError('')
    setIsAnalyzing(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('image', file)

      const res = await fetch('/api/inbody/analyze', {
        method: 'POST',
        body: formDataToSend,
      })

      const result = await res.json()

      if (result.success && result.data) {
        // AI 분석 결과로 폼 자동 채우기
        const data = result.data
        setFormData({
          ...formData,
          weight: data.weight?.toString() || '',
          skeletalMuscle: data.skeletalMuscle?.toString() || '',
          bodyFatMass: data.bodyFatMass?.toString() || '',
          bodyFatPercent: data.bodyFatPercent?.toString() || '',
          bmi: data.bmi?.toString() || '',
          visceralFat: data.visceralFat?.toString() || '',
          inbodyScore: data.inbodyScore?.toString() || '',
          bmr: data.bmr?.toString() || '',
          bodyWater: data.bodyWater?.toString() || '',
          protein: data.protein?.toString() || '',
          minerals: data.minerals?.toString() || '',
        })
      } else {
        setAnalyzeError(result.error || 'AI 분석에 실패했습니다. 수동으로 입력해주세요.')
      }
    } catch (error) {
      console.error('AI 분석 오류:', error)
      setAnalyzeError('AI 분석 중 오류가 발생했습니다. 수동으로 입력해주세요.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 폼 제출
  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const formDataToSend = new FormData()

      // 파일 추가
      const file = fileInputRef.current?.files?.[0]
      if (file) {
        formDataToSend.append('image', file)
      }

      // 데이터 추가
      const data = {
        date: formData.date,
        weight: parseFloat(formData.weight),
        skeletalMuscle: parseFloat(formData.skeletalMuscle),
        bodyFatMass: parseFloat(formData.bodyFatMass),
        bodyFatPercent: parseFloat(formData.bodyFatPercent),
        bmi: parseFloat(formData.bmi),
        visceralFat: parseInt(formData.visceralFat),
        inbodyScore: parseInt(formData.inbodyScore),
        bmr: parseInt(formData.bmr),
        bodyWater: formData.bodyWater ? parseFloat(formData.bodyWater) : null,
        protein: formData.protein ? parseFloat(formData.protein) : null,
        minerals: formData.minerals ? parseFloat(formData.minerals) : null,
        aiAnalysis: generateAIAnalysis(),
      }
      formDataToSend.append('data', JSON.stringify(data))

      const res = await fetch('/api/inbody', {
        method: 'POST',
        body: formDataToSend,
      })

      if (res.ok) {
        setIsUploadOpen(false)
        loadRecords()
        // 폼 초기화
        setFormData({
          date: format(new Date(), 'yyyy-MM-dd'),
          weight: '',
          skeletalMuscle: '',
          bodyFatMass: '',
          bodyFatPercent: '',
          bmi: '',
          visceralFat: '',
          inbodyScore: '',
          bmr: '',
          bodyWater: '',
          protein: '',
          minerals: '',
        })
        setSelectedFileName('')
        setAnalyzeError('')
      }
    } catch (error) {
      console.error('Failed to submit:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // AI 분석 생성 (이전 기록과 비교)
  const generateAIAnalysis = (): AIAnalysis => {
    const prev = latestRecord
    const curr = {
      weight: parseFloat(formData.weight),
      skeletalMuscle: parseFloat(formData.skeletalMuscle),
      bodyFatMass: parseFloat(formData.bodyFatMass),
      bodyFatPercent: parseFloat(formData.bodyFatPercent),
      visceralFat: parseInt(formData.visceralFat),
      inbodyScore: parseInt(formData.inbodyScore),
    }

    const highlights: string[] = []
    const recommendations: string[] = []

    if (prev) {
      // 체중 변화
      const weightDiff = curr.weight - prev.weight
      if (weightDiff < 0) {
        highlights.push(`체중 ${Math.abs(weightDiff).toFixed(1)}kg 감소`)
      } else if (weightDiff > 0) {
        highlights.push(`체중 ${weightDiff.toFixed(1)}kg 증가`)
      }

      // 골격근량 변화
      const muscleDiff = curr.skeletalMuscle - prev.skeletalMuscle
      if (muscleDiff > 0) {
        highlights.push(`골격근량 ${muscleDiff.toFixed(1)}kg 증가`)
      } else if (muscleDiff < 0) {
        highlights.push(`골격근량 ${Math.abs(muscleDiff).toFixed(1)}kg 감소 - 단백질 섭취 점검 필요`)
      }

      // 체지방률 변화
      const fatDiff = curr.bodyFatPercent - prev.bodyFatPercent
      if (fatDiff < 0) {
        highlights.push(`체지방률 ${Math.abs(fatDiff).toFixed(1)}% 감소`)
      } else if (fatDiff > 0) {
        highlights.push(`체지방률 ${fatDiff.toFixed(1)}% 증가 - 식단 점검 필요`)
      }
    }

    // 내장지방 경고
    if (curr.visceralFat >= 10) {
      highlights.push(`내장지방 레벨 ${curr.visceralFat} - 주의 필요`)
      recommendations.push('유산소 운동 시간 증가 권장')
      recommendations.push('정제 탄수화물 섭취 줄이기')
    }

    // 인바디 점수 기반 조언
    if (curr.inbodyScore < 70) {
      recommendations.push('근력 운동 볼륨 증가 권장')
    }
    if (curr.bodyFatPercent > 25) {
      recommendations.push('유산소 운동 주 4회 이상 권장')
    }

    return {
      summary: prev
        ? `이전 측정 대비 체중 ${(curr.weight - prev.weight).toFixed(1)}kg, 체지방률 ${(curr.bodyFatPercent - prev.bodyFatPercent).toFixed(1)}% 변화`
        : '첫 번째 측정 기록입니다. 앞으로의 변화를 추적합니다.',
      highlights: highlights.length > 0 ? highlights : ['측정 완료'],
      recommendations:
        recommendations.length > 0
          ? recommendations
          : ['현재 루틴을 유지하세요', '꾸준한 운동과 식단 관리를 지속하세요'],
      nextGoal: `다음 목표: 체중 ${(curr.weight - 1).toFixed(1)}kg, 체지방률 ${(curr.bodyFatPercent - 1).toFixed(1)}%`,
    }
  }

  // AI 분석 파싱
  const parseAIAnalysis = (analysisStr: string | undefined): AIAnalysis | null => {
    if (!analysisStr) return null
    try {
      return JSON.parse(analysisStr)
    } catch {
      return null
    }
  }

  // 차트 데이터 준비
  const chartData = records
    .slice()
    .reverse()
    .map((r) => ({
      date: format(new Date(r.date), 'M/d'),
      weight: r.weight,
      muscle: r.skeletalMuscle,
      fat: r.bodyFatMass,
      score: r.inbodyScore,
    }))

  const aiAnalysis = latestRecord ? parseAIAnalysis(latestRecord.aiAnalysis) : null

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">인바디 분석</h1>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Upload className="w-4 h-4 mr-1" />
              측정 기록
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>인바디 측정 결과 입력</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* AI 이미지 분석 */}
              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">AI 자동 분석</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  인바디 결과 사진을 업로드하면 AI가 자동으로 수치를 추출합니다
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant={selectedFileName ? 'secondary' : 'outline'}
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      AI 분석 중...
                    </>
                  ) : selectedFileName ? (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {selectedFileName}
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      인바디 사진 선택
                    </>
                  )}
                </Button>
                {analyzeError && (
                  <p className="text-xs text-destructive mt-2">{analyzeError}</p>
                )}
                {selectedFileName && !isAnalyzing && !analyzeError && (
                  <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    AI 분석 완료! 아래 수치를 확인하세요
                  </p>
                )}
              </div>

              {/* 측정일 */}
              <div>
                <label className="text-sm font-medium">측정일</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              {/* 기본 수치 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">체중 (kg)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="101.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">골격근량 (kg)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="39.8"
                    value={formData.skeletalMuscle}
                    onChange={(e) => setFormData({ ...formData, skeletalMuscle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">체지방량 (kg)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="31.3"
                    value={formData.bodyFatMass}
                    onChange={(e) => setFormData({ ...formData, bodyFatMass: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">체지방률 (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="31.0"
                    value={formData.bodyFatPercent}
                    onChange={(e) => setFormData({ ...formData, bodyFatPercent: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">BMI</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="30.2"
                    value={formData.bmi}
                    onChange={(e) => setFormData({ ...formData, bmi: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">내장지방</label>
                  <Input
                    type="number"
                    placeholder="13"
                    value={formData.visceralFat}
                    onChange={(e) => setFormData({ ...formData, visceralFat: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">인바디 점수</label>
                  <Input
                    type="number"
                    placeholder="68"
                    value={formData.inbodyScore}
                    onChange={(e) => setFormData({ ...formData, inbodyScore: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">기초대사량</label>
                  <Input
                    type="number"
                    placeholder="1877"
                    value={formData.bmr}
                    onChange={(e) => setFormData({ ...formData, bmr: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full" disabled={isLoading}>
                {isLoading ? '저장 중...' : '저장하기'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 최신 인바디 점수 */}
      {latestRecord && (
        <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm opacity-80">인바디 점수</p>
              <p className="text-5xl font-bold my-2">{latestRecord.inbodyScore}</p>
              <p className="text-sm opacity-80">/ 100점</p>
              <p className="text-xs mt-2 opacity-70">
                {format(new Date(latestRecord.date), 'yyyy년 M월 d일', { locale: ko })} 측정
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 주요 지표 */}
      {latestRecord && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Activity className="w-4 h-4" />
                체중
              </div>
              <p className="text-2xl font-bold mt-1">{latestRecord.weight}kg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Zap className="w-4 h-4" />
                골격근량
              </div>
              <p className="text-2xl font-bold mt-1">{latestRecord.skeletalMuscle}kg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Droplets className="w-4 h-4" />
                체지방량
              </div>
              <p className="text-2xl font-bold mt-1">{latestRecord.bodyFatMass}kg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Target className="w-4 h-4" />
                체지방률
              </div>
              <p className="text-2xl font-bold mt-1">{latestRecord.bodyFatPercent}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI 분석 결과 */}
      {aiAnalysis && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">AI 코칭</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{aiAnalysis.summary}</p>

            {/* 하이라이트 */}
            <div className="space-y-2">
              {aiAnalysis.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {h.includes('증가') || h.includes('감소') ? (
                    h.includes('골격근') && h.includes('증가') ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                    ) : h.includes('체지방') && h.includes('감소') ? (
                      <TrendingDown className="w-4 h-4 text-green-500 mt-0.5" />
                    ) : h.includes('주의') ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5" />
                    )
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5" />
                  )}
                  <span>{h}</span>
                </div>
              ))}
            </div>

            {/* 추천 */}
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm font-medium mb-2">추천 사항</p>
              <ul className="space-y-1">
                {aiAnalysis.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    • {r}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-sm font-medium text-primary">{aiAnalysis.nextGoal}</p>
          </CardContent>
        </Card>
      )}

      {/* 변화 추이 그래프 */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">변화 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="체중"
                  />
                  <Line
                    type="monotone"
                    dataKey="muscle"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="골격근"
                  />
                  <Line
                    type="monotone"
                    dataKey="fat"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="체지방"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-blue-500" /> 체중
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-green-500" /> 골격근
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-red-500" /> 체지방
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 측정 기록 목록 */}
      {records.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">측정 기록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {records.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {format(new Date(record.date), 'yyyy.MM.dd', { locale: ko })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {record.weight}kg / 체지방률 {record.bodyFatPercent}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{record.inbodyScore}점</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 데이터 없을 때 */}
      {!latestRecord && (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">아직 인바디 측정 기록이 없습니다</p>
            <p className="text-sm text-muted-foreground mt-1">
              첫 번째 측정 결과를 등록해주세요
            </p>
            <Button className="mt-4" onClick={() => setIsUploadOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              측정 기록 추가
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
