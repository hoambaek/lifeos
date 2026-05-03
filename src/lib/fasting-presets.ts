export type FastingPreset = '14h' | '18h' | '24h'

export const FASTING_PRESETS: { id: FastingPreset; hours: number; label: string; sub: string }[] = [
  { id: '14h', hours: 14, label: '14시간 단식', sub: '식사창 10시간 · 매일 권장' },
  { id: '18h', hours: 18, label: '18시간 단식', sub: '저녁 6시 → 다음날 정오' },
  { id: '24h', hours: 24, label: '24시간 단식', sub: '주 1-2회 · 한 끼 건너뛰기' },
]

export function presetById(id: string) {
  return FASTING_PRESETS.find((p) => p.id === id)
}
