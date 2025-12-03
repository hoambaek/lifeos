'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore, PHASES } from '@/stores/useAppStore'
import { differenceInDays, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  ArrowRightLeft,
  Lightbulb,
  Sparkles,
  Target,
  Dumbbell,
  Utensils,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Heart,
} from 'lucide-react'

interface InBodyRecord {
  id: number
  date: string
  weight: number
  skeletalMuscle: number
  bodyFatMass: number
  bodyFatPercent: number
  bmi: number
  visceralFat: number
  inbodyScore: number
  bmr: number
}

interface PersonalizedGuide {
  category: string
  icon: React.ReactNode
  title: string
  description: string
  tips: string[]
  priority: 'high' | 'medium' | 'low'
}

// 단백질 대체 식품 환산표
const PROTEIN_EQUIVALENTS = {
  '닭가슴살 100g': [
    { food: '계란 4개 (노른자 2개)', amount: '약 240g' },
    { food: '돼지 뒷다리살', amount: '100g' },
    { food: '프로틴 쉐이크', amount: '1스쿱' },
    { food: '두부', amount: '300g' },
    { food: '그릭요거트', amount: '250g' },
  ],
  '계란 1개': [
    { food: '닭가슴살', amount: '25g' },
    { food: '돼지 뒷다리살', amount: '30g' },
    { food: '두부', amount: '75g' },
    { food: '우유', amount: '200ml' },
  ],
  '프로틴 1스쿱': [
    { food: '닭가슴살', amount: '110g' },
    { food: '계란', amount: '4개' },
    { food: '그릭요거트', amount: '250g' },
    { food: '연어', amount: '120g' },
  ],
}

// 단계별 가이드
const PHASE_GUIDES = [
  {
    phase: '1단계 - 적응 구간 (1-4주)',
    tips: [
      '급격한 칼로리 제한 금지, 점진적으로 줄이기',
      '물 섭취량을 서서히 3L까지 늘리기',
      '운동 강도보다 습관 형성에 집중',
      '단백질 섭취 타이밍 익히기 (운동 전후)',
    ],
  },
  {
    phase: '2단계 - 가속화 구간 (5-12주)',
    tips: [
      '유산소 운동 추가 (주 3회 30분)',
      '탄수화물 사이클링 시작',
      '치팅밀 주 1회 허용',
      '근력 운동 볼륨 증가',
    ],
  },
  {
    phase: '3단계 - 중심 구간 (13-20주)',
    tips: [
      '가장 힘든 구간, 멘탈 관리 중요',
      '정체기 대비 리피드 데이 활용',
      'HIIT 훈련 도입',
      '수면 질 관리 (7시간 이상)',
    ],
  },
  {
    phase: '4단계 - 마무리 구간 (21-26주)',
    tips: [
      '최종 스퍼트, 디테일 다듬기',
      '수분 섭취량 조절',
      '사진 기록으로 변화 확인',
      '유지 칼로리 계산 및 전환 준비',
    ],
  },
]

export default function GuidePage() {
  const { config } = useAppStore()
  const [selectedEquivalent, setSelectedEquivalent] = useState<string>('닭가슴살 100g')
  const [latestInbody, setLatestInbody] = useState<InBodyRecord | null>(null)
  const [prevInbody, setPrevInbody] = useState<InBodyRecord | null>(null)

  // 현재 단계 계산
  const daysPassed = config?.startDate
    ? differenceInDays(new Date(), new Date(config.startDate)) + 1
    : 0
  const currentWeek = Math.ceil(daysPassed / 7)
  const currentPhaseIndex = PHASES.findIndex(
    (p) => currentWeek >= p.week[0] && currentWeek <= p.week[1]
  )

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

      // 인바디 데이터 로드
      try {
        const inbodyRes = await fetch('/api/inbody')
        const inbodyData = await inbodyRes.json()
        if (inbodyData && inbodyData.length > 0) {
          setLatestInbody(inbodyData[0])
          if (inbodyData.length > 1) {
            setPrevInbody(inbodyData[1])
          }
        }
      } catch (e) {
        console.log('인바디 데이터 없음')
      }
    }
    loadData()
  }, [config])

  // 인바디 기반 맞춤 가이드 생성
  const generatePersonalizedGuides = (): PersonalizedGuide[] => {
    if (!latestInbody) return []

    const guides: PersonalizedGuide[] = []
    const { bodyFatPercent, skeletalMuscle, visceralFat, bmi, inbodyScore, bmr } = latestInbody

    // 체지방률 기반 가이드
    if (bodyFatPercent > 25) {
      guides.push({
        category: '체지방 관리',
        icon: <TrendingDown className="w-5 h-5 text-red-500" />,
        title: '체지방 감량 집중 필요',
        description: `현재 체지방률 ${bodyFatPercent}%로 목표치(20% 이하)까지 감량이 필요합니다.`,
        tips: [
          '유산소 운동 주 4-5회, 30-45분 실시',
          '공복 유산소 운동 추천 (아침 기상 후)',
          '저녁 탄수화물 섭취 줄이기',
          '식이섬유가 풍부한 채소 섭취 늘리기',
        ],
        priority: 'high',
      })
    } else if (bodyFatPercent > 20) {
      guides.push({
        category: '체지방 관리',
        icon: <Target className="w-5 h-5 text-yellow-500" />,
        title: '체지방 마무리 단계',
        description: `체지방률 ${bodyFatPercent}%! 목표까지 조금만 더 화이팅!`,
        tips: [
          'HIIT 운동으로 효율적인 지방 연소',
          '단백질 섭취량 유지하며 총 칼로리 조절',
          '충분한 수면으로 호르몬 균형 유지',
        ],
        priority: 'medium',
      })
    }

    // 골격근량 기반 가이드
    if (skeletalMuscle < 35) {
      guides.push({
        category: '근육 증가',
        icon: <Dumbbell className="w-5 h-5 text-blue-500" />,
        title: '근육량 증가 필요',
        description: `골격근량 ${skeletalMuscle}kg으로 기초대사량 향상을 위해 근육 증가가 필요합니다.`,
        tips: [
          '복합 운동 위주로 훈련 (스쿼트, 데드리프트, 벤치프레스)',
          '점진적 과부하 원칙 적용',
          '단백질 체중 1kg당 1.6-2g 섭취',
          '운동 후 30분 내 단백질 섭취',
        ],
        priority: 'high',
      })
    } else if (skeletalMuscle >= 35 && skeletalMuscle < 40) {
      guides.push({
        category: '근육 유지',
        icon: <Zap className="w-5 h-5 text-green-500" />,
        title: '근육량 유지 & 강화',
        description: `골격근량 ${skeletalMuscle}kg 양호! 컷팅 중 근손실 방지에 집중하세요.`,
        tips: [
          '고중량 저반복 훈련으로 근력 유지',
          '단백질 섭취 절대 줄이지 않기',
          'BCAA 또는 EAA 보충제 고려',
        ],
        priority: 'medium',
      })
    }

    // 내장지방 기반 가이드
    if (visceralFat >= 10) {
      guides.push({
        category: '건강 관리',
        icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
        title: '내장지방 주의 필요',
        description: `내장지방 레벨 ${visceralFat}! 건강을 위해 적극적인 관리가 필요합니다.`,
        tips: [
          '정제 탄수화물(흰쌀, 흰빵) 섭취 줄이기',
          '알코올 섭취 자제',
          '스트레스 관리 (코르티솔 조절)',
          '규칙적인 유산소 운동 필수',
          '충분한 수면 (7-8시간)',
        ],
        priority: 'high',
      })
    }

    // BMI 기반 가이드
    if (bmi >= 25) {
      guides.push({
        category: '체중 관리',
        icon: <Activity className="w-5 h-5 text-purple-500" />,
        title: 'BMI 정상화 목표',
        description: `BMI ${bmi.toFixed(1)}로 과체중 구간입니다. 체중 감량과 함께 근육량 유지가 중요합니다.`,
        tips: [
          '주간 체중 감량 목표: 0.5-1kg',
          '급격한 다이어트 금지 (근손실 방지)',
          '매일 체중 측정으로 추이 확인',
        ],
        priority: 'medium',
      })
    }

    // 기초대사량 기반 가이드
    guides.push({
      category: '식단 관리',
      icon: <Utensils className="w-5 h-5 text-emerald-500" />,
      title: '기초대사량 기반 식단',
      description: `기초대사량 ${bmr}kcal 기준으로 식단을 구성하세요.`,
      tips: [
        `일일 섭취 칼로리 권장: ${Math.round(bmr * 1.3)}-${Math.round(bmr * 1.5)}kcal (활동량 고려)`,
        `단백질: ${Math.round(latestInbody.weight * 1.6)}-${Math.round(latestInbody.weight * 2)}g`,
        `탄수화물: 운동일에 집중 배치`,
        `지방: 전체 칼로리의 20-30%`,
      ],
      priority: 'medium',
    })

    // 인바디 점수 기반 가이드
    if (inbodyScore < 70) {
      guides.push({
        category: '종합 개선',
        icon: <Heart className="w-5 h-5 text-pink-500" />,
        title: '체성분 균형 개선',
        description: `인바디 점수 ${inbodyScore}점. 근육 증가와 체지방 감소를 동시에 진행하세요.`,
        tips: [
          '주 4-5회 웨이트 트레이닝 + 주 2-3회 유산소',
          '단백질 우선 섭취 후 탄수화물 조절',
          '충분한 수면과 휴식으로 회복 최적화',
        ],
        priority: 'high',
      })
    } else if (inbodyScore >= 80) {
      guides.push({
        category: '유지 관리',
        icon: <TrendingUp className="w-5 h-5 text-green-500" />,
        title: '우수한 체성분 유지',
        description: `인바디 점수 ${inbodyScore}점! 현재 상태를 잘 유지하고 계세요.`,
        tips: [
          '현재 루틴 유지하며 점진적 발전',
          '주기적인 인바디 측정으로 모니터링',
          '과훈련 주의, 적절한 휴식 확보',
        ],
        priority: 'low',
      })
    }

    // 우선순위로 정렬
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return guides.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }

  const personalizedGuides = generatePersonalizedGuides()

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* 인바디 기반 맞춤 가이드 */}
      {latestInbody && personalizedGuides.length > 0 && (
        <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                맞춤 가이드
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {format(new Date(latestInbody.date), 'M/d', { locale: ko })} 인바디 기준
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 현재 상태 요약 */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-background/50 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">체중</p>
                <p className="text-sm font-bold">{latestInbody.weight}kg</p>
              </div>
              <div className="bg-background/50 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">골격근</p>
                <p className="text-sm font-bold">{latestInbody.skeletalMuscle}kg</p>
              </div>
              <div className="bg-background/50 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">체지방률</p>
                <p className="text-sm font-bold">{latestInbody.bodyFatPercent}%</p>
              </div>
              <div className="bg-background/50 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">점수</p>
                <p className="text-sm font-bold text-purple-500">{latestInbody.inbodyScore}</p>
              </div>
            </div>

            {/* 개인화된 가이드 카드들 */}
            {personalizedGuides.map((guide, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg bg-background/80 border ${
                  guide.priority === 'high'
                    ? 'border-red-500/30'
                    : guide.priority === 'medium'
                    ? 'border-yellow-500/30'
                    : 'border-green-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{guide.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">{guide.category}</span>
                      {guide.priority === 'high' && (
                        <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded">
                          중요
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{guide.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{guide.description}</p>
                    <ul className="space-y-1">
                      {guide.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 인바디 데이터 없을 때 안내 */}
      {!latestInbody && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Sparkles className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">인바디 기반 맞춤 가이드</p>
            <p className="text-sm text-muted-foreground mt-1">
              인바디 측정 결과를 등록하면 개인화된 조언을 받을 수 있습니다
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <a href="/inbody">인바디 등록하기</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 대체 식품 환산기 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            대체 식품 환산기
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.keys(PROTEIN_EQUIVALENTS).map((key) => (
              <Button
                key={key}
                variant={selectedEquivalent === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedEquivalent(key)}
              >
                {key}
              </Button>
            ))}
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="font-medium mb-3 text-center">
              {selectedEquivalent} = 약 23g 단백질
            </p>
            <div className="space-y-2">
              {PROTEIN_EQUIVALENTS[selectedEquivalent as keyof typeof PROTEIN_EQUIVALENTS].map(
                (item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b last:border-0"
                  >
                    <span>{item.food}</span>
                    <span className="text-muted-foreground">{item.amount}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 단계별 전략 가이드 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            단계별 전략 가이드
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {PHASE_GUIDES.map((guide, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                index === currentPhaseIndex
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">{guide.phase}</h3>
                {index === currentPhaseIndex && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                    현재
                  </span>
                )}
              </div>
              <ul className="space-y-1.5">
                {guide.tips.map((tip, tipIndex) => (
                  <li key={tipIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
