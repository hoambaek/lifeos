'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { addDays, subDays, format, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Utensils,
  ChevronLeft,
  ChevronRight,
  Clock,
  Beef,
  Droplets,
  BedDouble,
  Sparkles,
  Settings2,
  Plus,
  X,
  ImagePlus,
  Trash2,
  Loader2,
  Play,
  Sprout,
  Wheat,
  Activity,
  Flame,
  Trophy,
  Heart,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { DietPhase } from '@/lib/diet-phase'
import { FASTING_PRESETS, presetById, type FastingPreset } from '@/lib/fasting-presets'

interface ActiveFasting {
  id: number
  preset: string
  targetHours: number
  startedAt: string
  endedAt: string | null
  completed: boolean
}

interface MealEntry {
  id: number
  date: string
  time: string | null
  menu: string
  imagePath: string | null
  notes: string | null
}

interface DietLog {
  id?: number
  date?: string
  phase: string
  fastingStart: string | null
  fastingEnd: string | null
  fasting24: boolean
  proteinG: number
  waterMl: number
  sleepHours: number | null
  hotelMeeting: boolean
  wineTasting: boolean
  travel: boolean
  businessDinner: boolean
  notes: string | null
}

interface DietProfile {
  id: number
  boosterStartDate: string | null
  luxuryStart: string | null
  luxuryEnd: string | null
}

const EMPTY_LOG: DietLog = {
  phase: 'maintenance',
  fastingStart: '12:00',
  fastingEnd: '20:00',
  fasting24: false,
  proteinG: 0,
  waterMl: 0,
  sleepHours: null,
  hotelMeeting: false,
  wineTasting: false,
  travel: false,
  businessDinner: false,
  notes: null,
}

export default function DietPage() {
  const [date, setDate] = useState(new Date())
  const [log, setLog] = useState<DietLog>(EMPTY_LOG)
  const [profile, setProfile] = useState<DietProfile | null>(null)
  const [phase, setPhase] = useState<DietPhase | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [meals, setMeals] = useState<MealEntry[]>([])
  const saveTimer = useRef<NodeJS.Timeout | null>(null)

  const today = isToday(date)

  const loadMeals = useCallback(async (d: Date) => {
    const res = await fetch(`/api/diet/meals?date=${format(d, 'yyyy-MM-dd')}`)
    const data: MealEntry[] = await res.json()
    setMeals(data)
  }, [])

  const loadDay = useCallback(async (d: Date) => {
    const res = await fetch(`/api/diet?date=${format(d, 'yyyy-MM-dd')}`)
    const data = await res.json()
    setProfile(data.profile)
    setPhase(data.phase)
    if (data.log) {
      setLog({
        ...EMPTY_LOG,
        ...data.log,
        notes: data.log.notes ?? null,
      })
    } else {
      setLog({ ...EMPTY_LOG, phase: data.phase?.code ?? 'maintenance' })
    }
  }, [])

  useEffect(() => {
    loadDay(date)
    loadMeals(date)
  }, [date, loadDay, loadMeals])

  const addMeal = useCallback(async (meal: { time: string | null; menu: string; imagePath: string | null; notes: string | null }) => {
    await fetch('/api/diet/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: format(date, 'yyyy-MM-dd'), ...meal }),
    })
    await loadMeals(date)
  }, [date, loadMeals])

  const deleteMeal = useCallback(async (id: number) => {
    await fetch(`/api/diet/meals?id=${id}`, { method: 'DELETE' })
    await loadMeals(date)
  }, [date, loadMeals])

  const persist = useCallback(async (next: DietLog) => {
    await fetch('/api/diet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: format(date, 'yyyy-MM-dd'),
        ...next,
        phase: phase?.code ?? next.phase,
      }),
    })
  }, [date, phase])

  // 자동 저장 (디바운스)
  const update = useCallback((patch: Partial<DietLog>) => {
    setLog((prev) => {
      const next = { ...prev, ...patch }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        persist(next).catch((e) => console.error(e))
      }, 500)
      return next
    })
  }, [persist])

  const saveProfile = useCallback(async (patch: Partial<DietProfile>) => {
    const next = {
      boosterStartDate: profile?.boosterStartDate ?? null,
      luxuryStart: profile?.luxuryStart ?? null,
      luxuryEnd: profile?.luxuryEnd ?? null,
      ...patch,
    }
    await fetch('/api/diet/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    })
    await loadDay(date)
  }, [profile, date, loadDay])

  // 진척도 (단백질 100g, 물 2000ml 기준)
  const proteinPct = Math.min(100, Math.round((log.proteinG / 100) * 100))
  const waterPct = Math.min(100, Math.round((log.waterMl / 2000) * 100))

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6">
        <div className="pt-12 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDate((d) => subDays(d, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setDate(new Date())}
                className={`text-xs font-medium tracking-widest uppercase transition-colors ${
                  today ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400 dark:text-stone-500 active:text-emerald-500'
                }`}
              >
                {format(date, 'M월 d일 EEEE', { locale: ko })}
                {today && <span className="ml-1.5 text-emerald-500">today</span>}
              </button>
              <button
                onClick={() => setDate((d) => addDays(d, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-3 mb-2">
            <Utensils className="w-7 h-7 text-stone-400" />
            <div className="flex-1">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                {today ? '오늘의 식이' : format(date, 'M월 d일') + ' 식이'}
              </h1>
              {phase && (
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                  {phase.label}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label="설정"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 space-y-3">
        {/* 설정 패널 */}
        {showSettings && (
          <SettingsPanel profile={profile} onSave={saveProfile} />
        )}

        {/* Phase 가이드 */}
        {phase && <PhaseCard phase={phase} />}

        {/* 간헐적 단식 (프리셋 + 프로그레스) */}
        <FastingCard />

        {/* 식사 로그 */}
        <MealsCard meals={meals} onAdd={addMeal} onDelete={deleteMeal} />

        {/* 핵심 지표 */}
        <Card>
          <div className="space-y-4">
            <NumberWithProgress
              icon={<Beef className="w-4 h-4 text-rose-500" />}
              label="단백질"
              value={log.proteinG}
              unit="g"
              step={10}
              max={200}
              percent={proteinPct}
              hint="목표: 체중 1kg × 1.2-1.5g"
              onChange={(v) => update({ proteinG: v })}
            />
            <NumberWithProgress
              icon={<Droplets className="w-4 h-4 text-sky-500" />}
              label="물"
              value={log.waterMl}
              unit="ml"
              step={250}
              max={4000}
              percent={waterPct}
              hint="목표: 2000ml+"
              onChange={(v) => update({ waterMl: v })}
            />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BedDouble className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  수면
                </span>
                <span className="text-xs text-stone-400">목표 6h+ (자정-4시 포함)</span>
              </div>
              <input
                type="number"
                step="0.5"
                min="0"
                max="14"
                value={log.sleepHours ?? ''}
                onChange={(e) => update({ sleepHours: e.target.value === '' ? null : parseFloat(e.target.value) })}
                placeholder="시간"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>
        </Card>

        {/* 맥락 룰 */}
        <Card>
          <div className="mb-3">
            <span className="text-xs font-semibold tracking-widest uppercase text-stone-600 dark:text-stone-400">
              오늘 맥락
            </span>
            <p className="text-xs text-stone-400 mt-1">
              해당하는 맥락에 따라 §5.2 룰을 적용
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ContextChip label="🏨 호텔/B2B 미팅" active={log.hotelMeeting} onChange={(v) => update({ hotelMeeting: v })} />
            <ContextChip label="🍷 와인 시음" active={log.wineTasting} onChange={(v) => update({ wineTasting: v })} />
            <ContextChip label="✈️ 출장" active={log.travel} onChange={(v) => update({ travel: v })} />
            <ContextChip label="🥢 회식" active={log.businessDinner} onChange={(v) => update({ businessDinner: v })} />
          </div>
        </Card>

        {/* 메모 */}
        <Card>
          <span className="text-xs font-semibold tracking-widest uppercase text-stone-600 dark:text-stone-400 block mb-2">
            메모
          </span>
          <textarea
            value={log.notes ?? ''}
            onChange={(e) => update({ notes: e.target.value || null })}
            placeholder="오늘의 특이사항, 컨디션, 식사 메모…"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </Card>
      </div>
    </div>
  )
}

function phaseGuidanceShort(phase: DietPhase): string {
  if (phase.kind === 'luxury_exception') return '럭셔리 분기 — 자유. 다음 부스터 일정만 미리 잡아둘 것.'
  if (phase.kind === 'maintenance') return '14:10 단식 매일 + 주 1-2회 24h 단식. 단백질 1.2-1.5g/kg, 물 2L+, 수면 6h+.'
  const w = phase.week
  if (w === 1 && phase.dayOfWeek <= 3) return '장 휴식기: 단백질 쉐이크 4회/일 + 녹황색 채소·두부.'
  if (w === 1) return '쉐이크 3회 + 점심 잡곡밥 반공기. 14h 단식.'
  if (w === 2) return '쉐이크 2회 + 일반식 2끼. 주 1회 24h 단식.'
  if (w === 3) return '자연당(바나나·고구마·베리) 추가. 주 2회 24h 단식 (연속 금지).'
  return '과일 1개/일 허용. 주 3회 24h 단식 (사이엔 일반식 필수).'
}

type PhaseStage = {
  key: string
  label: string
  hint: string
  Icon: typeof Sparkles
}

const BOOSTER_STAGES: PhaseStage[] = [
  { key: 'b1a', label: 'W1 D1-3', hint: '장 휴식', Icon: Sprout },
  { key: 'b1b', label: 'W1 D4-7', hint: '저탄수', Icon: Wheat },
  { key: 'b2', label: 'W2', hint: '인슐린', Icon: Activity },
  { key: 'b3', label: 'W3', hint: '대사유연', Icon: Flame },
  { key: 'b4', label: 'W4', hint: '체지방 가속', Icon: Trophy },
]

const MODE_STAGES: PhaseStage[] = [
  { key: 'm', label: '유지기', hint: '14:10 매일', Icon: Heart },
  { key: 'lux', label: '럭셔리 분기', hint: '예외 자유', Icon: Sparkles },
]

const BOOSTER_ORDER = ['b1a', 'b1b', 'b2', 'b3', 'b4']

function getCurrentPhaseKey(phase: DietPhase): string {
  if (phase.kind === 'maintenance') return 'm'
  if (phase.kind === 'luxury_exception') return 'lux'
  if (phase.week === 1 && phase.dayOfWeek <= 3) return 'b1a'
  if (phase.week === 1) return 'b1b'
  return `b${phase.week}`
}

function PhaseCard({ phase }: { phase: DietPhase }) {
  const currentKey = getCurrentPhaseKey(phase)
  const isBooster = phase.kind === 'booster'

  // 현재가 부스터인 경우, 그 이전 부스터 단계는 "지나간"으로 표시
  const passed = new Set<string>()
  if (isBooster) {
    const idx = BOOSTER_ORDER.indexOf(currentKey)
    for (let i = 0; i < idx; i++) passed.add(BOOSTER_ORDER[i])
  }

  const renderChip = (stage: PhaseStage) => {
    const isCurrent = stage.key === currentKey
    const isPassed = passed.has(stage.key)
    const cls = isCurrent
      ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
      : isPassed
        ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
        : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40 text-stone-400 dark:text-stone-500'
    const Icon = stage.Icon
    return (
      <div
        key={stage.key}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-colors ${cls}`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{stage.label}</span>
        <span className={`text-[10px] ${isCurrent ? 'text-white/80' : 'opacity-70'}`}>· {stage.hint}</span>
      </div>
    )
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-emerald-500" />
        <span className="text-xs font-semibold tracking-widest uppercase text-stone-600 dark:text-stone-400">
          현재 Phase
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-1.5">부스터 4주</p>
          <div className="flex flex-wrap gap-1.5">{BOOSTER_STAGES.map(renderChip)}</div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-1.5">모드</p>
          <div className="flex flex-wrap gap-1.5">{MODE_STAGES.map(renderChip)}</div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-stone-50 dark:bg-stone-900/50 px-3 py-2.5 border border-stone-100 dark:border-stone-800">
        <p className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
          {phase.label}
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          {phaseGuidanceShort(phase)}
        </p>
      </div>
    </Card>
  )
}

function FastingCard() {
  const [active, setActive] = useState<ActiveFasting | null>(null)
  const [loading, setLoading] = useState(false)
  const [, setTick] = useState(0)

  const load = useCallback(async () => {
    const res = await fetch('/api/diet/fasting')
    const data = await res.json()
    setActive(data.active)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // 활성 단식 진행률 갱신 (30초마다 re-render 트리거)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(id)
  }, [active])

  const start = async (preset: FastingPreset) => {
    setLoading(true)
    try {
      await fetch('/api/diet/fasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', preset }),
      })
      await load()
    } finally {
      setLoading(false)
    }
  }

  const stop = async () => {
    if (!confirm('단식 종료할까요?')) return
    setLoading(true)
    try {
      await fetch('/api/diet/fasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      })
      await load()
    } finally {
      setLoading(false)
    }
  }

  if (!active) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-stone-500" />
          <span className="text-xs font-semibold tracking-widest uppercase text-stone-600 dark:text-stone-400">
            간헐적 단식
          </span>
        </div>
        <p className="text-sm text-stone-400 text-center mb-3 py-2">
          시작할 단식을 선택하세요
        </p>
        <div className="space-y-2">
          {FASTING_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => start(p.id)}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-[0.99] transition-all text-left disabled:opacity-50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{p.label}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{p.sub}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center shrink-0">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 ml-0.5" />}
              </div>
            </button>
          ))}
        </div>
      </Card>
    )
  }

  const startedAt = new Date(active.startedAt)
  const now = new Date()
  const elapsedMs = now.getTime() - startedAt.getTime()
  const elapsedH = elapsedMs / 3_600_000
  const targetMs = active.targetHours * 3_600_000
  const pct = Math.min(100, (elapsedMs / targetMs) * 100)
  const remainingMs = Math.max(0, targetMs - elapsedMs)
  const isDone = elapsedH >= active.targetHours
  const presetLabel = presetById(active.preset)?.label ?? active.preset

  const fmt = (ms: number) => {
    const totalMin = Math.floor(ms / 60000)
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return `${h}시간 ${m}분`
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Clock className={`w-4 h-4 ${isDone ? 'text-emerald-500' : 'text-stone-500'}`} />
        <span className="text-xs font-semibold tracking-widest uppercase text-stone-600 dark:text-stone-400 flex-1">
          {isDone ? '단식 목표 달성' : '단식 진행 중'}
        </span>
        {isDone && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold tracking-wider uppercase">
            완료
          </span>
        )}
      </div>

      <p className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">{presetLabel}</p>
      <p className="text-xs text-stone-500 mt-0.5">
        시작: {format(startedAt, 'M월 d일 HH:mm', { locale: ko })}
      </p>

      <div className="mt-3 mb-2 flex justify-between items-baseline">
        <span className="text-base font-mono tabular-nums font-semibold text-stone-900 dark:text-stone-100">
          {fmt(elapsedMs)}
        </span>
        <span className="text-xs text-stone-400 font-mono">
          / {active.targetHours}시간 · {Math.round(pct)}%
        </span>
      </div>
      <div className="h-2.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isDone ? 'bg-emerald-500' : 'bg-stone-900 dark:bg-stone-100'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-stone-400 mt-2 text-center">
        {isDone ? '목표 달성! 단식을 종료해주세요.' : `남은 시간 ${fmt(remainingMs)}`}
      </p>

      <button
        onClick={stop}
        disabled={loading}
        className={`w-full mt-3 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 ${
          isDone
            ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
            : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
        }`}
      >
        {loading ? '처리 중…' : isDone ? '단식 완료 기록' : '단식 종료'}
      </button>
    </Card>
  )
}

function MealsCard({
  meals,
  onAdd,
  onDelete,
}: {
  meals: MealEntry[]
  onAdd: (meal: { time: string | null; menu: string; imagePath: string | null; notes: string | null }) => Promise<void>
  onDelete: (id: number) => Promise<void>
}) {
  const [adding, setAdding] = useState(false)
  const [time, setTime] = useState('')
  const [menu, setMenu] = useState('')
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setTime('')
    setMenu('')
    setImagePath(null)
    setAdding(false)
  }

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || '업로드 실패')
        return
      }
      const data = await res.json()
      setImagePath(data.path)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const submit = async () => {
    if (!menu.trim()) return
    await onAdd({
      time: time || null,
      menu: menu.trim(),
      imagePath,
      notes: null,
    })
    reset()
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Utensils className="w-4 h-4 text-amber-500" />
        <span className="text-xs font-semibold tracking-widest uppercase text-stone-600 dark:text-stone-400 flex-1">
          오늘 먹은 것
        </span>
        {!adding && (
          <button
            onClick={() => {
              setAdding(true)
              setTime(format(new Date(), 'HH:mm'))
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            추가
          </button>
        )}
      </div>

      {meals.length === 0 && !adding && (
        <p className="text-sm text-stone-400 text-center py-4">
          먹은 걸 기록하면 코치가 더 정확하게 판단해요
        </p>
      )}

      <div className="space-y-2">
        {meals.map((m) => (
          <div
            key={m.id}
            className="flex gap-3 p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30"
          >
            {m.imagePath && (
              <Image
                src={m.imagePath}
                alt={m.menu}
                width={56}
                height={56}
                className="w-14 h-14 rounded-lg object-cover shrink-0"
                unoptimized
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                {m.time && (
                  <span className="font-mono text-xs text-stone-500 dark:text-stone-400">{m.time}</span>
                )}
              </div>
              <p className="text-sm text-stone-900 dark:text-stone-100 mt-0.5 leading-snug">{m.menu}</p>
            </div>
            <button
              onClick={() => onDelete(m.id)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0 self-start"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {adding && (
        <div className="mt-3 p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 space-y-2">
          <div className="flex gap-2">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-base font-mono tabular-nums w-[7.5rem] min-h-[44px] appearance-none"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) upload(f)
              }}
            />
            {imagePath ? (
              <div className="relative">
                <Image src={imagePath} alt="첨부" width={36} height={36} className="w-9 h-9 rounded-lg object-cover" unoptimized />
                <button
                  onClick={() => setImagePath(null)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-200 dark:border-stone-700 text-stone-400 hover:text-stone-700"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              </button>
            )}
            <input
              value={menu}
              onChange={(e) => setMenu(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
              autoFocus
              placeholder="예: 생선구이, 채소"
              className="flex-1 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={reset}
              className="px-3 py-1.5 rounded-lg text-sm text-stone-500"
            >
              취소
            </button>
            <button
              onClick={submit}
              disabled={!menu.trim()}
              className="px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-medium disabled:opacity-30"
            >
              저장
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/50 p-4">
      {children}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-full mt-3 flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${
        checked
          ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
          : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400'
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
          checked ? 'bg-emerald-500 text-white' : 'border-2 border-stone-300 dark:border-stone-600'
        }`}
      >
        {checked ? '✓' : ''}
      </span>
    </button>
  )
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1">{label}</label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-base font-mono tabular-nums min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 appearance-none"
      />
    </div>
  )
}

function NumberWithProgress({
  icon, label, value, unit, step, max, percent, hint, onChange,
}: {
  icon: React.ReactNode; label: string; value: number; unit: string; step: number; max: number; percent: number; hint: string;
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{label}</span>
        <span className="text-xs text-stone-400">{hint}</span>
        <span className="ml-auto text-sm font-mono text-stone-900 dark:text-stone-100">
          {value.toLocaleString()}{unit}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - step))}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 dark:border-stone-700 text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800"
        >−</button>
        <div className="flex-1 h-2 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 dark:border-stone-700 text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800"
        >+</button>
      </div>
    </div>
  )
}

function ContextChip({ label, active, onChange }: { label: string; active: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!active)}
      className={`px-3 py-2.5 rounded-lg border text-sm transition-colors ${
        active
          ? 'border-stone-900 dark:border-stone-100 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
          : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400'
      }`}
    >
      {label}
    </button>
  )
}

function SettingsPanel({
  profile,
  onSave,
}: {
  profile: DietProfile | null
  onSave: (patch: Partial<DietProfile>) => Promise<void>
}) {
  const [boosterDate, setBoosterDate] = useState(profile?.boosterStartDate?.slice(0, 10) ?? '')
  const [luxuryS, setLuxuryS] = useState(profile?.luxuryStart?.slice(0, 10) ?? '')
  const [luxuryE, setLuxuryE] = useState(profile?.luxuryEnd?.slice(0, 10) ?? '')

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Settings2 className="w-4 h-4 text-stone-500" />
        <span className="text-xs font-semibold tracking-widest uppercase text-stone-600 dark:text-stone-400">
          설정
        </span>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1">
            부스터 시작일 (28일 자동 진행, 비우면 유지기)
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={boosterDate}
              onChange={(e) => setBoosterDate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
            />
            <button
              onClick={() => onSave({ boosterStartDate: boosterDate || null })}
              className="px-4 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-medium"
            >저장</button>
          </div>
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1">
            럭셔리 분기 (트래킹 일시정지 기간)
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={luxuryS}
              onChange={(e) => setLuxuryS(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
            />
            <input
              type="date"
              value={luxuryE}
              onChange={(e) => setLuxuryE(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
            />
            <button
              onClick={() => onSave({ luxuryStart: luxuryS || null, luxuryEnd: luxuryE || null })}
              className="px-4 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-medium"
            >저장</button>
          </div>
        </div>
      </div>
    </Card>
  )
}
