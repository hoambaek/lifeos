// ============================================
// XP & 레벨 시스템 설정
// ============================================

export const LEVEL_CONFIG = {
  baseXP: 100,           // 레벨 2에 필요한 XP
  multiplier: 1.2,       // 레벨당 필요 XP 증가율 (20%)
  maxLevel: 100,
};

// XP 보상 테이블
export const XP_REWARDS = {
  // 운동
  workout_complete: 100,

  // 퀘스트
  quest_water: 20,
  quest_protein: 30,
  quest_clean_diet: 20,
  all_quests_complete: 50,    // 4개 퀘스트 모두 완료 보너스

  // 스트릭
  streak_daily_bonus: 10,     // 일일 스트릭 보너스 (최대 70)
  streak_daily_max: 70,       // 일일 스트릭 보너스 최대치

  // 특별 보너스
  early_bird_bonus: 25,       // 오전 8시 전 운동
  night_owl_bonus: 15,        // 오후 10시 후 운동
};

// 스트릭 마일스톤 보상
export const STREAK_MILESTONES = {
  7: { xp: 200, freezes: 1 },
  14: { xp: 350, freezes: 0 },
  30: { xp: 500, freezes: 2 },
  60: { xp: 800, freezes: 1 },
  100: { xp: 1500, freezes: 3 },
};

// 레벨 계산 함수
export const calculateLevelFromXP = (totalXP: number): number => {
  let level = 1;
  let xpRequired = LEVEL_CONFIG.baseXP;
  let accumulatedXP = 0;

  while (accumulatedXP + xpRequired <= totalXP && level < LEVEL_CONFIG.maxLevel) {
    accumulatedXP += xpRequired;
    level++;
    xpRequired = Math.floor(xpRequired * LEVEL_CONFIG.multiplier);
  }

  return level;
};

// 특정 레벨까지 필요한 총 XP
export const getXPForLevel = (level: number): number => {
  let xp = 0;
  let required = LEVEL_CONFIG.baseXP;

  for (let i = 1; i < level; i++) {
    xp += required;
    required = Math.floor(required * LEVEL_CONFIG.multiplier);
  }

  return xp;
};

// 현재 레벨 내 진행률 (0-100)
export const getLevelProgress = (totalXP: number): number => {
  const currentLevel = calculateLevelFromXP(totalXP);
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);

  if (currentLevel >= LEVEL_CONFIG.maxLevel) return 100;

  const progressXP = totalXP - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;

  return Math.floor((progressXP / requiredXP) * 100);
};

// 다음 레벨까지 필요한 XP
export const getXPToNextLevel = (totalXP: number): number => {
  const currentLevel = calculateLevelFromXP(totalXP);
  const nextLevelXP = getXPForLevel(currentLevel + 1);

  return nextLevelXP - totalXP;
};

// 레벨별 타이틀
export const LEVEL_TITLES: Record<number, string> = {
  1: '초보자',
  5: '입문자',
  10: '루키',
  15: '견습생',
  20: '수련생',
  25: '중급자',
  30: '숙련자',
  40: '전문가',
  50: '마스터',
  60: '그랜드마스터',
  75: '레전드',
  90: '신화',
  100: '전설의 철인',
};

export const getLevelTitle = (level: number): string => {
  const thresholds = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a);
  for (const threshold of thresholds) {
    if (level >= threshold) {
      return LEVEL_TITLES[threshold];
    }
  }
  return '초보자';
};

// 티어별 색상
export const TIER_COLORS = {
  bronze: {
    bg: 'bg-amber-900/20',
    border: 'border-amber-700',
    text: 'text-amber-600',
    glow: 'shadow-amber-500/30',
  },
  silver: {
    bg: 'bg-gray-400/20',
    border: 'border-gray-400',
    text: 'text-gray-300',
    glow: 'shadow-gray-400/30',
  },
  gold: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/40',
  },
  platinum: {
    bg: 'bg-cyan-400/20',
    border: 'border-cyan-400',
    text: 'text-cyan-300',
    glow: 'shadow-cyan-400/50',
  },
};
