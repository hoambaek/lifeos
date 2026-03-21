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
  completedExercises?: number[]
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

// 운동 루틴 (요일별)
export const WORKOUT_ROUTINE: Record<number, string> = {
  0: '전신/코어',      // 일요일
  1: '가슴/삼두 A',    // 월요일
  2: '등/이두',        // 화요일
  3: '하체/코어',      // 수요일
  4: '어깨/코어',      // 목요일
  5: '가슴/삼두 B',    // 금요일
  6: '등/하체',        // 토요일
}

// 부위별 운동 세부 동작 (덤벨 + TRX 홈짐)
export interface WorkoutExercise {
  name: string
  sets: number
  reps: string
  equipment: '덤벨' | 'TRX' | '맨몸'
  image: string
  desc: string
}

export const WORKOUT_DETAILS: Record<string, WorkoutExercise[]> = {
  '가슴/삼두 A': [
    { name: 'Bench Press', sets: 4, reps: '10-12회', equipment: '덤벨', image: '/dumbbell/Bench Press.png', desc: '등을 대고 누워 덤벨을 가슴 위로 밀어 올린다' },
    { name: 'Incline Bench Press', sets: 3, reps: '10-12회', equipment: '덤벨', image: '/dumbbell/Incline Bench Press.png', desc: '상체를 30-45도 세우고 덤벨을 위로 밀어 올린다' },
    { name: 'Chest Fly', sets: 3, reps: '12회', equipment: '덤벨', image: '/dumbbell/Chest Fly.png', desc: '누워서 팔을 양옆으로 벌렸다 가슴 위에서 모은다' },
    { name: 'Reverse Fly', sets: 3, reps: '12회', equipment: '덤벨', image: '/dumbbell/Reverse Fly.png', desc: '상체를 숙이고 팔을 양옆으로 들어올린다' },
    { name: 'Tricep Extension', sets: 3, reps: '12회', equipment: '덤벨', image: '/dumbbell/Tricep Extension.png', desc: '머리 뒤로 덤벨을 내렸다가 팔을 펴 올린다' },
    { name: 'Tricep Kickback', sets: 3, reps: '12회', equipment: '덤벨', image: '/dumbbell/Tricep Kickback.png', desc: '상체를 숙이고 팔꿈치를 고정한 채 뒤로 편다' },
  ],
  '가슴/삼두 B': [
    { name: 'TRX Chest Fly', sets: 3, reps: '10-12회', equipment: 'TRX', image: '/TRX/Chest Fly.png', desc: 'TRX를 잡고 앞으로 기울여 팔을 벌렸다 모은다' },
    { name: 'Floor T Raise', sets: 3, reps: '10회', equipment: '덤벨', image: '/dumbbell/Floor T Raise.png', desc: '엎드려 누워 팔을 T자로 들어올린다' },
    { name: 'Renegade Row', sets: 3, reps: '좌우 8회', equipment: '덤벨', image: '/dumbbell/Renegade Row.png', desc: '플랭크 자세에서 한 팔씩 덤벨을 당긴다' },
    { name: 'TRX Tricep Press', sets: 3, reps: '10-12회', equipment: 'TRX', image: '/TRX/Tricep Press.png', desc: 'TRX를 잡고 기울여 팔꿈치만 접었다 편다' },
    { name: 'Bow Extension', sets: 3, reps: '12회', equipment: '덤벨', image: '/dumbbell/Bow Extension.png', desc: '엎드려 덤벨을 들고 등을 활처럼 젖힌다' },
    { name: 'TRX Plank', sets: 3, reps: '30초', equipment: 'TRX', image: '/TRX/Plank.png', desc: '발을 TRX에 걸고 플랭크 자세를 유지한다' },
  ],
  '등/이두': [
    { name: 'Single Arm Row', sets: 4, reps: '10-12회', equipment: '덤벨', image: '/dumbbell/single Arm Row.png', desc: '한 손을 짚고 반대팔로 덤벨을 옆구리로 당긴다' },
    { name: 'Incline Row', sets: 3, reps: '12회', equipment: '덤벨', image: '/dumbbell/Incline Row.png', desc: '벤치에 엎드려 양팔로 덤벨을 당긴다' },
    { name: 'Dumbbell Pullover', sets: 3, reps: '12회', equipment: '덤벨', image: '/dumbbell/Dumbbell Pullover.png', desc: '누워서 덤벨을 머리 뒤로 내렸다 가슴 위로 올린다' },
    { name: 'TRX Row', sets: 3, reps: '12-15회', equipment: 'TRX', image: '/TRX/Row.png', desc: 'TRX를 잡고 뒤로 기대어 가슴까지 당긴다' },
    { name: 'Hammer Curl', sets: 3, reps: '12회', equipment: '덤벨', image: '/dumbbell/Hammer Curl.png', desc: '덤벨을 세로로 잡고 팔꿈치를 접어 올린다' },
    { name: 'Grip Curl', sets: 3, reps: '12회', equipment: '덤벨', image: '/dumbbell/Grip Curl.png', desc: '손바닥이 위를 향하게 잡고 팔꿈치를 접어 올린다' },
  ],
  '하체/코어': [
    { name: 'Goblet Squat', sets: 4, reps: '12회', equipment: '덤벨', image: '/dumbbell/Goblet Squat.png', desc: '덤벨을 가슴 앞에 안고 깊이 앉았다 일어선다' },
    { name: 'Romanian Deadlift', sets: 3, reps: '12회', equipment: '덤벨', image: '/dumbbell/Romanian Deadlift.png', desc: '무릎을 살짝 굽히고 엉덩이를 뒤로 빼며 숙인다' },
    { name: 'Reverse Lunge', sets: 3, reps: '좌우 10회', equipment: '덤벨', image: '/dumbbell/Reverse Lunge.png', desc: '한 발을 뒤로 빼며 무릎이 바닥에 닿기 직전까지 내린다' },
    { name: 'Calf Raise', sets: 3, reps: '15-20회', equipment: '덤벨', image: '/dumbbell/Calf Raise.png', desc: '덤벨을 들고 까치발로 올라갔다 천천히 내린다' },
    { name: 'Russian Twist', sets: 3, reps: '좌우 12회', equipment: '덤벨', image: '/dumbbell/Russian Twist.png', desc: '상체를 뒤로 기울이고 덤벨을 좌우로 돌린다' },
    { name: 'V-Up', sets: 3, reps: '12회', equipment: '덤벨', image: '/dumbbell/V-up.png', desc: '누워서 상체와 다리를 동시에 들어 V자를 만든다' },
  ],
  '어깨/코어': [
    { name: 'Shoulder Press', sets: 4, reps: '10-12회', equipment: '덤벨', image: '/dumbbell/Shoulder Press.png', desc: '덤벨을 귀 옆에서 머리 위로 밀어 올린다' },
    { name: 'Side Raise', sets: 3, reps: '12-15회', equipment: '덤벨', image: '/dumbbell/Side Raise.png', desc: '팔을 양옆으로 어깨 높이까지 들어올린다' },
    { name: 'Alternating Front Raise', sets: 3, reps: '좌우 10회', equipment: '덤벨', image: '/dumbbell/Alternationg Front Raise.png', desc: '팔을 앞으로 번갈아 어깨 높이까지 올린다' },
    { name: 'TRX Face Pull', sets: 3, reps: '12-15회', equipment: 'TRX', image: '/TRX/Face Pull.png', desc: 'TRX를 잡고 뒤로 기대어 얼굴 쪽으로 당긴다' },
    { name: 'TRX Y-Fly', sets: 3, reps: '10-12회', equipment: 'TRX', image: '/TRX/Y-Fly.png', desc: 'TRX를 잡고 팔을 Y자로 벌리며 일어선다' },
    { name: 'Woodchop', sets: 3, reps: '좌우 10회', equipment: '덤벨', image: '/dumbbell/Woodchop.png', desc: '대각선으로 덤벨을 위에서 아래로 내려친다' },
  ],
  '등/하체': [
    { name: 'Seesaw Row', sets: 3, reps: '10회', equipment: '덤벨', image: '/dumbbell/Seesaw Row.png', desc: '양손 덤벨을 번갈아 시소처럼 당긴다' },
    { name: 'TRX Inverted Row', sets: 3, reps: '10-12회', equipment: 'TRX', image: '/TRX/Inverted Row.png', desc: 'TRX 아래에 누워 가슴까지 몸을 끌어올린다' },
    { name: 'TRX Power Pull', sets: 3, reps: '좌우 8회', equipment: 'TRX', image: '/TRX/Power Pull.png', desc: '한 손으로 TRX를 잡고 몸을 회전하며 당긴다' },
    { name: 'Sumo Squat', sets: 3, reps: '12회', equipment: '덤벨', image: '/dumbbell/Sumo Squat.png', desc: '발을 넓게 벌리고 발끝을 바깥으로 향해 앉는다' },
    { name: 'Side Lunge', sets: 3, reps: '좌우 10회', equipment: '덤벨', image: '/dumbbell/Side Lunge.png', desc: '옆으로 크게 한 발 내딛으며 앉았다 돌아온다' },
    { name: 'Glute Bridge', sets: 3, reps: '15회', equipment: '덤벨', image: '/dumbbell/Glute Bridge.png', desc: '누워서 덤벨을 골반에 올리고 엉덩이를 들어올린다' },
  ],
  '전신/코어': [
    { name: 'Thruster', sets: 3, reps: '10회', equipment: '덤벨', image: '/dumbbell/Thruster.png', desc: '스쿼트 후 일어서며 덤벨을 머리 위로 밀어 올린다' },
    { name: 'TRX Squat', sets: 3, reps: '15회', equipment: 'TRX', image: '/TRX/Squat.png', desc: 'TRX를 잡고 균형을 유지하며 깊이 앉았다 일어선다' },
    { name: 'Step-Up', sets: 3, reps: '좌우 10회', equipment: '덤벨', image: '/dumbbell/Step-Up.png', desc: '덤벨을 들고 박스 위로 한 발씩 올라갔다 내려온다' },
    { name: 'TRX Pike', sets: 3, reps: '10-12회', equipment: 'TRX', image: '/TRX/Pike.png', desc: '발을 TRX에 걸고 엉덩이를 높이 들어 V자를 만든다' },
    { name: 'TRX Body Saw', sets: 3, reps: '10회', equipment: 'TRX', image: '/TRX/Body Saw.png', desc: '플랭크 상태에서 몸을 앞뒤로 톱질하듯 움직인다' },
    { name: 'Side Bend', sets: 3, reps: '좌우 12회', equipment: '덤벨', image: '/dumbbell/Side Bend.png', desc: '한 손에 덤벨을 들고 옆으로 기울였다 돌아온다' },
  ],
}

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
