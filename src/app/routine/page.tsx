'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Brain, Lightbulb, X } from 'lucide-react'

// ─── 루틴 데이터 ───────────────────────────────────────────────────────────────

const ROUTINE_PHASES = [
  {
    phase: '1단계',
    title: '기상 직후 90분',
    subtitle: '인지력 극대화',
    emoji: '🌅',
    timeRange: '07:30–09:00',
    items: [
      {
        key: 'wake_sunlight',
        time: '07:30–07:40',
        title: '햇빛 노출',
        desc: '창문 열고 10분 햇빛 쬐기. 몸이 아침이라는 걸 인식하게 해줌',
      },
      {
        key: 'mct_coffee',
        time: '07:40–08:00',
        title: 'MCT 커피',
        desc: '설탕/우유 없이. 뇌에 바로 쓸 수 있는 에너지 공급',
      },
      {
        key: 'deep_work',
        time: '08:00–09:00',
        title: '딥워크',
        desc: '하루 중 집중력 최고 시간. 폰 비행기모드, 핵심 과제 1개만',
      },
    ],
  },
  {
    phase: '2단계',
    title: '신체 활성화 + 오전 업무',
    emoji: '💪',
    timeRange: '09:00–12:00',
    items: [
      {
        key: 'strength',
        time: '09:10–09:40',
        title: '근력운동',
        desc: '운동하면 뇌가 새로운 걸 더 잘 배움. 30분 집중',
      },
      {
        key: 'squat_morning',
        time: '09:40',
        title: '스쿼트 1세트',
        desc: '맨몸 스쿼트 15회. 혈액순환 올려서 머리 맑게',
      },
      {
        key: 'strategic_rest',
        time: '09:40–10:00',
        title: '전략적 멍때리기',
        desc: '아무것도 안 보고 멍때리기. 뇌가 알아서 아이디어를 정리해줌',
      },
      {
        key: 'reactive_work',
        time: '10:00–12:00',
        title: '반응적 업무',
        desc: '이메일, 메신저, 미팅 처리. 집중력 떨어지는 시간에 딱 맞음',
      },
    ],
  },
  {
    phase: '3단계',
    title: '영양 + 도파민 리셋',
    emoji: '🍱',
    timeRange: '12:00–13:30',
    items: [
      {
        key: 'protein_meal',
        time: '12:00–13:00',
        title: '고단백 식사',
        desc: '달걀, 닭, 생선 위주. 오후 의욕의 원료가 됨',
      },
      {
        key: 'squat_lunch',
        time: '13:00',
        title: '스쿼트 2세트',
        desc: '맨몸 스쿼트 15회. 밥 먹고 졸리는 거 방지',
      },
      {
        key: 'nsdr',
        time: '13:00–13:20',
        title: 'NSDR',
        desc: '눈 감고 10-20분 쉬기. 의욕과 집중력이 크게 회복됨',
      },
      {
        key: 'lunch_mct',
        time: '13:20–13:30',
        title: 'MCT 커피',
        desc: '오후 에너지 떨어지는 거 방지. 뇌 연료 재충전',
      },
    ],
  },
  {
    phase: '4단계',
    title: '기술 숙달 + 정리',
    emoji: '🛠️',
    timeRange: '14:00–18:00',
    items: [
      {
        key: 'skill_work',
        time: '14:00–17:00',
        title: '반복 업무 / 기술 습득',
        desc: '오후는 반복 연습에 좋은 시간. 기술 연마와 실무에 집중',
      },
      {
        key: 'squat_afternoon',
        time: '17:00',
        title: '스쿼트 3세트',
        desc: '맨몸 스쿼트 15회. 오후 졸음 타파 + 하루 스쿼트 완료',
      },
      {
        key: 'brain_log',
        time: '17:00–18:00',
        title: '뇌 설정 로그',
        desc: '오늘 잘한 것 1줄 + 내일 핵심 과제 1개 적기. 적어두면 내일 바로 시작 가능',
      },
    ],
  },
  {
    phase: '5단계',
    title: '유산소 + 회복',
    emoji: '🏃',
    timeRange: '20:00–21:00',
    items: [
      {
        key: 'jogging',
        time: '20:00–20:40',
        title: '조깅',
        desc: '가볍게 뛰기. 하루 스트레스가 풀리고 기분이 좋아짐',
      },
    ],
  },
  {
    phase: '6단계',
    title: '시스템 종료',
    emoji: '🌙',
    timeRange: '21:00–23:00',
    items: [
      {
        key: 'digital_detox',
        time: '21:00',
        title: '디지털 디톡스',
        desc: '화면 끄기. 잠 잘 오게 몸이 준비하는 시간',
      },
      {
        key: 'reading',
        time: '21:30–22:30',
        title: '독서',
        desc: '종이책 or e-ink. 마음이 편해지면서 자연스럽게 잠이 옴',
      },
      {
        key: 'sleep',
        time: '23:00',
        title: '숙면',
        desc: '자는 동안 뇌가 청소됨. 7-8시간 확보',
      },
    ],
  },
]

const ALL_KEYS = ROUTINE_PHASES.flatMap((p) => p.items.map((i) => i.key))

const RECOMMEND_KEYS = new Set(['deep_work', 'reactive_work', 'skill_work', 'brain_log'])

type RecommendItem = { team: string; text: string }
type RecommendSection = { label: string; items: RecommendItem[] }

// ─── 컴포넌트 ──────────────────────────────────────────────────────────────────

export default function RoutinePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())
  const [allCompleted, setAllCompleted] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [recommendOpen, setRecommendOpen] = useState<string | null>(null)
  const [recommendData, setRecommendData] = useState<RecommendSection[]>([])
  const [recommendLoading, setRecommendLoading] = useState(false)

  const dateStr = format(currentDate, 'yyyy-MM-dd')

  // ── 데이터 로드 ──────────────────────────────────────────────────────────────
  const loadRoutineData = useCallback(async (date: Date) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/routine?date=${format(date, 'yyyy-MM-dd')}`)
      const data = await res.json()
      if (data?.completedItems && Array.isArray(data.completedItems)) {
        setCompletedItems(new Set(data.completedItems))
      } else {
        setCompletedItems(new Set())
      }
    } catch {
      setCompletedItems(new Set())
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRoutineData(currentDate)
  }, [currentDate, loadRoutineData])

  // ── 전체 완료 감지 ────────────────────────────────────────────────────────────
  useEffect(() => {
    const total = ALL_KEYS.length
    const done = completedItems.size
    if (done === total && total > 0 && !allCompleted) {
      setAllCompleted(true)
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 4000)
    } else if (done < total) {
      setAllCompleted(false)
    }
  }, [completedItems, allCompleted])

  // ── 저장 ─────────────────────────────────────────────────────────────────────
  const saveToServer = useCallback(async (date: string, items: string[]) => {
    try {
      await fetch('/api/routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, completedItems: items }),
      })
    } catch {
      // silent
    }
  }, [])

  // ── 토글 ─────────────────────────────────────────────────────────────────────
  const toggleItem = useCallback(
    (key: string) => {
      setCompletedItems((prev) => {
        const next = new Set(prev)
        if (next.has(key)) {
          next.delete(key)
        } else {
          next.add(key)
        }

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = setTimeout(() => {
          saveToServer(dateStr, Array.from(next))
        }, 500)

        return next
      })
    },
    [dateStr, saveToServer]
  )

  // ── 추천 로드 ──────────────────────────────────────────────────────────────────
  const loadRecommend = useCallback(async (type: string) => {
    if (recommendOpen === type) {
      setRecommendOpen(null)
      return
    }
    setRecommendOpen(type)
    setRecommendLoading(true)
    try {
      const res = await fetch(`/api/routine/recommend?type=${type}`)
      const data = await res.json()
      setRecommendData(data.recommendations || [])
    } catch {
      setRecommendData([])
    } finally {
      setRecommendLoading(false)
    }
  }, [recommendOpen])

  // ── 날짜 이동 ─────────────────────────────────────────────────────────────────
  const goToPrevDay = () => setCurrentDate((prev) => subDays(prev, 1))
  const goToNextDay = () => {
    const next = addDays(currentDate, 1)
    if (next <= new Date()) setCurrentDate(next)
  }

  const canGoNext = addDays(currentDate, 1) <= new Date()
  const todayCheck = isToday(currentDate)
  const completedCount = completedItems.size
  const totalCount = ALL_KEYS.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // ── 섹션 헤더 (메인 페이지와 동일 스타일) ─────────────────────────────────────
  const SectionHeader = ({ title, label, timeRange }: { title: string; label?: string; timeRange?: string }) => (
    <div className="flex items-stretch gap-3 mb-5">
      <div className="w-1 rounded-full bg-stone-900 dark:bg-stone-100 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          {label && <p className="editorial-label mb-0.5">{label}</p>}
          {timeRange && (
            <span className="font-mono text-[10px] font-semibold tracking-wider text-stone-400 dark:text-stone-500">
              {timeRange}
            </span>
          )}
        </div>
        <h2 className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          {title}
        </h2>
      </div>
    </div>
  )

  // ── 렌더 ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-24">

      {/* ── 전체 완료 축하 오버레이 ──────────────────────────────────────────── */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="text-center animate-fade-in-up bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl mx-6">
            <div className="text-5xl mb-3">🎉</div>
            <p className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
              오늘의 루틴 완료!
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              신경과학 기반 최적 루틴을 완주했습니다
            </p>
            <div className="mt-4 flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-emerald-500"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
          {/* 컨페티 파티클 */}
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className="confetti-particle"
              style={{
                left: `${(i / 24) * 100}%`,
                animationDelay: `${(i % 6) * 0.15}s`,
                animationDuration: `${2.5 + (i % 4) * 0.5}s`,
                backgroundColor: ['#92400E', '#B45309', '#D97706', '#059669', '#0D9488', '#7C3AED'][i % 6],
                borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0',
                width: `${7 + (i % 4) * 2}px`,
                height: `${7 + (i % 4) * 2}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── 헤더 ─────────────────────────────────────────────────────────────── */}
      <header className="px-6 pt-7 pb-0 opacity-0 animate-fade-in-up">
        <p className="editorial-label mb-2">Daily System</p>
        <h1 className="font-serif text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 mb-6">
          루틴
        </h1>

        {/* 날짜 내비게이션 */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={goToPrevDay}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors touch-scale"
          >
            <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </button>

          <div className="text-center">
            <p className="editorial-label mb-0.5">
              {todayCheck ? '오늘' : '과거'}
            </p>
            <p className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">
              {format(currentDate, 'M월 d일', { locale: ko })}
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
              {format(currentDate, 'EEEE', { locale: ko })}
            </p>
          </div>

          <button
            onClick={goToNextDay}
            disabled={!canGoNext}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors touch-scale ${
              canGoNext
                ? 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700'
                : 'opacity-25 cursor-not-allowed bg-stone-50 dark:bg-stone-900'
            }`}
          >
            <ChevronRight className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </button>
        </div>

        {/* 진행도 바 */}
        <div className="mb-1.5 flex items-center justify-between">
          <span className="editorial-label">진행도</span>
          <span className="editorial-number text-sm text-stone-700 dark:text-stone-300">
            {isLoading ? '–' : `${completedCount}/${totalCount}`}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden mb-6">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              allCompleted
                ? 'bg-emerald-500 dark:bg-emerald-400'
                : 'bg-stone-700 dark:bg-stone-300'
            }`}
            style={{ width: isLoading ? '0%' : `${progressPercent}%` }}
          />
        </div>

        <hr className="editorial-rule" />
      </header>

      {/* ── 루틴 단계별 섹션 ──────────────────────────────────────────────────── */}
      <div className="px-6">
        {ROUTINE_PHASES.map((phase, phaseIdx) => (
          <section
            key={phase.phase}
            className="py-8 opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${0.08 + phaseIdx * 0.07}s` }}
          >
            <SectionHeader title={`${phase.emoji} ${phase.title}`} label={phase.phase} timeRange={phase.timeRange} />

            <div className="space-y-3">
              {phase.items.map((item) => {
                const done = completedItems.has(item.key)
                const hasRecommend = RECOMMEND_KEYS.has(item.key)

                return (
                  <div key={item.key}>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleItem(item.key)}
                        disabled={isLoading}
                        className={`flex-1 text-left p-4 rounded-2xl border transition-colors ${
                          done
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40'
                            : 'bg-card border-border hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex-shrink-0">
                            {done ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-stone-300 dark:text-stone-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-0.5">
                              <span
                                className={`font-mono text-[10px] font-semibold tracking-wider uppercase ${
                                  done
                                    ? 'text-emerald-500 dark:text-emerald-500'
                                    : 'text-stone-400 dark:text-stone-500'
                                }`}
                              >
                                {item.time}
                              </span>
                            </div>
                            <p
                              className={`font-semibold text-sm leading-snug transition-all duration-300 ${
                                done
                                  ? 'text-stone-400 dark:text-stone-500 line-through decoration-stone-300 dark:decoration-stone-600'
                                  : 'text-stone-900 dark:text-stone-100'
                              }`}
                            >
                              {item.title}
                            </p>
                            <p
                              className={`text-xs mt-0.5 leading-relaxed transition-all duration-300 ${
                                done
                                  ? 'text-stone-300 dark:text-stone-600'
                                  : 'text-stone-500 dark:text-stone-400'
                              }`}
                            >
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      </button>

                      {hasRecommend && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            loadRecommend(item.key)
                          }}
                          className={`flex-shrink-0 w-10 flex items-center justify-center rounded-2xl border transition-colors ${
                            recommendOpen === item.key
                              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                              : 'bg-card border-border hover:border-stone-300 dark:hover:border-stone-600'
                          }`}
                        >
                          {recommendOpen === item.key ? (
                            <X className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <Lightbulb className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                          )}
                        </button>
                      )}
                    </div>

                    {recommendOpen === item.key && (
                      <div className="mt-2 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
                        {recommendLoading ? (
                          <p className="text-xs text-stone-400 dark:text-stone-500">불러오는 중...</p>
                        ) : recommendData.length === 0 ? (
                          <p className="text-xs text-stone-400 dark:text-stone-500">추천 항목이 없습니다</p>
                        ) : (
                          <div className="space-y-3">
                            {recommendData.map((section, sIdx) => (
                              <div key={sIdx}>
                                <p className="font-mono text-[10px] font-semibold tracking-wider text-amber-600 dark:text-amber-400 uppercase mb-1.5">
                                  {section.label}
                                </p>
                                <div className="space-y-1">
                                  {section.items.map((rec, rIdx) => (
                                    <div key={rIdx} className="flex items-start gap-2">
                                      <span className="text-[10px] font-medium text-amber-500 dark:text-amber-500 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                                        {rec.team}
                                      </span>
                                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                                        {rec.text}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {phaseIdx < ROUTINE_PHASES.length - 1 && (
              <hr className="editorial-rule mt-8" />
            )}
          </section>
        ))}
      </div>

      {/* ── 하단 명언 ─────────────────────────────────────────────────────────── */}
      <div className="px-6 py-8 text-center opacity-0 animate-fade-in-up animation-delay-500">
        <Brain className="w-4 h-4 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
        <p className="font-serif text-sm text-stone-400 dark:text-stone-600 italic leading-relaxed max-w-xs mx-auto">
          &ldquo;성공은 지능이 아니라 시스템의 결과입니다.&rdquo;
        </p>
      </div>
    </div>
  )
}
