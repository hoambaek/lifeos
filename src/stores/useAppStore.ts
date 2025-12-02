import { create } from 'zustand'

export interface UserConfig {
  id?: number
  startWeight: number
  goalWeight: number
  startDate: Date
}

export interface DailyLog {
  id?: number
  date: Date
  weight?: number
  proteinAmount: number
  waterDone: boolean
  cleanDiet: boolean
  workoutDone: boolean
  workoutPart?: string
  memo?: string
}

interface AppState {
  // User Config
  config: UserConfig | null
  setConfig: (config: UserConfig) => void

  // Today's Log
  todayLog: DailyLog | null
  setTodayLog: (log: DailyLog) => void
  updateTodayLog: (updates: Partial<DailyLog>) => void

  // UI State
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

// 단백질 식품 데이터
export const PROTEIN_FOODS = [
  { name: '닭가슴살', emoji: '🐔', protein: 23 },
  { name: '계란', emoji: '🥚', protein: 6 },
  { name: '뒷다리살', emoji: '🐷', protein: 22 },
  { name: '프로틴', emoji: '🥤', protein: 25 },
] as const

// 운동 루틴 (요일별)
export const WORKOUT_ROUTINE: Record<number, string> = {
  0: '휴식',           // 일요일
  1: '가슴/삼두',      // 월요일
  2: '등/이두',        // 화요일
  3: '하체',           // 수요일
  4: '어깨/복근',      // 목요일
  5: '가슴/삼두',      // 금요일
  6: '등/이두',        // 토요일
}

// 단계 정보
export const PHASES = [
  { week: [1, 4], name: '1단계', description: '적응 구간' },
  { week: [5, 12], name: '2단계', description: '가속화 구간' },
  { week: [13, 20], name: '3단계', description: '중심 구간' },
  { week: [21, 26], name: '4단계', description: '마무리 구간' },
]

export const useAppStore = create<AppState>((set) => ({
  // User Config
  config: null,
  setConfig: (config) => set({ config }),

  // Today's Log
  todayLog: null,
  setTodayLog: (log) => set({ todayLog: log }),
  updateTodayLog: (updates) =>
    set((state) => ({
      todayLog: state.todayLog ? { ...state.todayLog, ...updates } : null,
    })),

  // UI State
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}))
