import { create } from 'zustand'
import { calculateLevelFromXP, getLevelProgress, getXPToNextLevel } from '@/lib/gamification/config'

// ============================================
// 타입 정의
// ============================================

export interface UserGamification {
  id: number
  totalXP: number
  currentLevel: number
  streakFreezes: number
  streakFreezesUsed: number
}

export interface Achievement {
  id: number
  key: string
  nameKo: string
  descriptionKo: string
  iconEmoji: string
  category: string
  tier: string
  xpReward: number
  requirement: number
  freezeReward: number
}

export interface UserAchievement {
  id: number
  achievementId: number
  achievement: Achievement
  unlockedAt: Date
  notified: boolean
}

export interface Challenge {
  id: number
  key: string
  nameKo: string
  descriptionKo: string
  type: string
  category: string
  targetValue: number
  xpReward: number
  startDate: Date
  endDate: Date
  isActive: boolean
}

export interface UserChallenge {
  id: number
  challengeId: number
  challenge: Challenge
  currentValue: number
  completed: boolean
  completedAt?: Date
  claimed: boolean
}

// 대기 중인 애니메이션
export interface PendingAnimation {
  id: string
  type: 'xp_gain' | 'level_up' | 'badge_unlock' | 'streak_milestone' | 'challenge_complete'
  data: {
    amount?: number
    source?: string
    newLevel?: number
    achievement?: Achievement
    milestone?: number
    challenge?: Challenge
  }
  position?: { x: number; y: number }
}

// ============================================
// 스토어 상태
// ============================================

interface GamificationState {
  // 사용자 게이미피케이션 데이터
  userGamification: UserGamification | null
  setUserGamification: (data: UserGamification | null) => void

  // 업적
  achievements: Achievement[]
  userAchievements: UserAchievement[]
  setAchievements: (data: Achievement[]) => void
  setUserAchievements: (data: UserAchievement[]) => void
  addUserAchievement: (achievement: UserAchievement) => void

  // 챌린지
  activeChallenges: Challenge[]
  userChallenges: UserChallenge[]
  setActiveChallenges: (data: Challenge[]) => void
  setUserChallenges: (data: UserChallenge[]) => void
  updateUserChallenge: (challengeId: number, updates: Partial<UserChallenge>) => void

  // XP 관련 계산
  getLevelProgress: () => number
  getXPToNextLevel: () => number

  // 애니메이션 큐
  pendingAnimations: PendingAnimation[]
  addAnimation: (animation: Omit<PendingAnimation, 'id'>) => void
  removeAnimation: (id: string) => void
  popAnimation: () => PendingAnimation | null
  clearAnimations: () => void

  // XP 추가 액션
  addXP: (amount: number, source: string, position?: { x: number; y: number }) => void

  // 스트릭 프리즈
  useStreakFreeze: () => boolean
  addStreakFreeze: (amount: number) => void

  // 로딩 상태
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // 초기화
  reset: () => void
}

// ============================================
// 스토어 생성
// ============================================

export const useGamificationStore = create<GamificationState>((set, get) => ({
  // 사용자 게이미피케이션 데이터
  userGamification: null,
  setUserGamification: (data) => set({ userGamification: data }),

  // 업적
  achievements: [],
  userAchievements: [],
  setAchievements: (data) => set({ achievements: data }),
  setUserAchievements: (data) => set({ userAchievements: data }),
  addUserAchievement: (achievement) =>
    set((state) => ({
      userAchievements: [...state.userAchievements, achievement],
    })),

  // 챌린지
  activeChallenges: [],
  userChallenges: [],
  setActiveChallenges: (data) => set({ activeChallenges: data }),
  setUserChallenges: (data) => set({ userChallenges: data }),
  updateUserChallenge: (challengeId, updates) =>
    set((state) => ({
      userChallenges: state.userChallenges.map((uc) =>
        uc.challengeId === challengeId ? { ...uc, ...updates } : uc
      ),
    })),

  // XP 관련 계산
  getLevelProgress: () => {
    const { userGamification } = get()
    if (!userGamification) return 0
    return getLevelProgress(userGamification.totalXP)
  },
  getXPToNextLevel: () => {
    const { userGamification } = get()
    if (!userGamification) return 100
    return getXPToNextLevel(userGamification.totalXP)
  },

  // 애니메이션 큐
  pendingAnimations: [],
  addAnimation: (animation) =>
    set((state) => ({
      pendingAnimations: [
        ...state.pendingAnimations,
        { ...animation, id: `${Date.now()}-${Math.random()}` },
      ],
    })),
  removeAnimation: (id) =>
    set((state) => ({
      pendingAnimations: state.pendingAnimations.filter((a) => a.id !== id),
    })),
  popAnimation: () => {
    const { pendingAnimations } = get()
    if (pendingAnimations.length === 0) return null
    const [first, ...rest] = pendingAnimations
    set({ pendingAnimations: rest })
    return first
  },
  clearAnimations: () => set({ pendingAnimations: [] }),

  // XP 추가 액션 (로컬 상태만 업데이트, API 호출은 별도)
  addXP: (amount, source, position) => {
    const { userGamification, addAnimation } = get()
    if (!userGamification) return

    const newTotalXP = userGamification.totalXP + amount
    const oldLevel = userGamification.currentLevel
    const newLevel = calculateLevelFromXP(newTotalXP)

    // XP 획득 애니메이션 추가
    addAnimation({
      type: 'xp_gain',
      data: { amount },
      position,
    })

    // 레벨업 체크
    if (newLevel > oldLevel) {
      addAnimation({
        type: 'level_up',
        data: { newLevel },
      })
    }

    // 상태 업데이트
    set({
      userGamification: {
        ...userGamification,
        totalXP: newTotalXP,
        currentLevel: newLevel,
      },
    })
  },

  // 스트릭 프리즈
  useStreakFreeze: () => {
    const { userGamification } = get()
    if (!userGamification || userGamification.streakFreezes <= 0) return false

    set({
      userGamification: {
        ...userGamification,
        streakFreezes: userGamification.streakFreezes - 1,
        streakFreezesUsed: userGamification.streakFreezesUsed + 1,
      },
    })
    return true
  },
  addStreakFreeze: (amount) => {
    const { userGamification } = get()
    if (!userGamification) return

    set({
      userGamification: {
        ...userGamification,
        streakFreezes: userGamification.streakFreezes + amount,
      },
    })
  },

  // 로딩 상태
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // 초기화
  reset: () =>
    set({
      userGamification: null,
      achievements: [],
      userAchievements: [],
      activeChallenges: [],
      userChallenges: [],
      pendingAnimations: [],
      isLoading: false,
    }),
}))

// ============================================
// 셀렉터 헬퍼
// ============================================

// 달성하지 않은 업적 목록
export const getLockedAchievements = (state: GamificationState) => {
  const unlockedKeys = new Set(state.userAchievements.map((ua) => ua.achievement.key))
  return state.achievements.filter((a) => !unlockedKeys.has(a.key))
}

// 카테고리별 업적
export const getAchievementsByCategory = (state: GamificationState, category: string) => {
  return state.achievements.filter((a) => a.category === category)
}

// 진행 중인 챌린지
export const getActiveUserChallenges = (state: GamificationState) => {
  return state.userChallenges.filter((uc) => !uc.completed)
}

// 완료했지만 보상 미수령 챌린지
export const getClaimableChallenges = (state: GamificationState) => {
  return state.userChallenges.filter((uc) => uc.completed && !uc.claimed)
}
