'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore, PHASES } from '@/stores/useAppStore'
import { differenceInDays } from 'date-fns'
import { ArrowRightLeft, Lightbulb } from 'lucide-react'

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

  // 현재 단계 계산
  const daysPassed = config?.startDate
    ? differenceInDays(new Date(), new Date(config.startDate)) + 1
    : 0
  const currentWeek = Math.ceil(daysPassed / 7)
  const currentPhaseIndex = PHASES.findIndex(
    (p) => currentWeek >= p.week[0] && currentWeek <= p.week[1]
  )

  useEffect(() => {
    const loadConfig = async () => {
      const res = await fetch('/api/config')
      const data = await res.json()
      if (data) {
        useAppStore.getState().setConfig(data)
      }
    }
    if (!config) loadConfig()
  }, [config])

  return (
    <div className="p-4 space-y-4">
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
