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
  // 운동 (사고력 투자)
  workout_complete: 100,

  // 퀘스트 (신경 기반 구축)
  quest_water: 20,
  quest_protein: 30,
  quest_clean_diet: 20,
  all_quests_complete: 50,    // 4개 퀘스트 모두 완료 보너스

  // 스트릭 (사고력 방패 강화)
  streak_daily_bonus: 10,     // 일일 스트릭 보너스 (최대 70)
  streak_daily_max: 70,       // 일일 스트릭 보너스 최대치

  // 특별 보너스
  early_bird_bonus: 25,       // 오전 8시 전 운동 (아침 명료함)
  night_owl_bonus: 15,        // 오후 10시 후 운동

  // 인지 성능 보너스 (피터 틸 철학)
  cognitive_shield_maintained: 15,  // 방패 60% 이상 유지 일일 보너스
  perfect_routine_day: 30,          // 모든 퀘스트 + 운동 완료
  pressure_recovery: 50,            // 스트릭 위기에서 회복
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

// 레벨별 타이틀 (피터 틸 철학 - 사고력 보호 관점)
export const LEVEL_TITLES: Record<number, string> = {
  1: '사고 입문자',
  5: '규율 수련생',
  10: '신경 기초 건설자',
  15: '루틴 수호자',
  20: '사고력 방어자',
  25: '명석함의 기사',
  30: '규율의 전사',
  40: '신경 아키텍트',
  50: '사고 마스터',
  60: '정신 요새 건축가',
  75: '인지 레전드',
  90: '사고의 신화',
  100: '불멸의 명석함',
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

// ============================================
// 피터 틸 철학 기반 인지 성능 시스템
// "건강이 무너지면 '사고의 깊이'도 즉시 무너진다"
// ============================================

// 피터 틸 명언 (대시보드 로테이션용)
export const THIEL_QUOTES = [
  "건강이 무너지면 '사고의 깊이'도 즉시 무너진다",
  "운동은 생각의 날카로움을 보존하는 '방패'다",
  "루틴을 절대 깨지 마라 - 규율은 타협할 수 없다",
  "운동은 복잡한 문제를 다룰 신경적 기반이다",
  "움직임이 생각을 정리하고 방향을 명확하게 한다",
  "운동은 신체 능력이 아닌 '사고의 질'을 보존하는 것이다",
];

// 인지 방패 상태별 메시지
export const COGNITIVE_SHIELD_MESSAGES = {
  critical: {
    status: '위험',
    message: '사고력 보호막이 약해지고 있습니다',
    action: '오늘 루틴으로 회복하세요',
    color: 'red',
  },
  vulnerable: {
    status: '주의',
    message: '보호막을 강화하세요',
    action: '깊은 생각을 위한 기반을 다지는 중입니다',
    color: 'orange',
  },
  protected: {
    status: '안정',
    message: '사고력이 안정적으로 보호받는 중',
    action: '유지하세요',
    color: 'blue',
  },
  fortified: {
    status: '철벽',
    message: '복잡한 문제도 명석하게 처리할 준비 완료',
    action: '완벽한 상태입니다',
    color: 'gold',
  },
};

// 스트릭별 인지 메시지
export const STREAK_COGNITIVE_MESSAGES: Record<number, string> = {
  3: '3일 연속! 신경 연결이 강화되기 시작합니다',
  7: '7일 연속! 사고력 보호막이 형성되었습니다',
  14: '2주 연속! 깊은 사고를 위한 기반이 굳건해집니다',
  21: '3주 연속! 규율이 습관으로 자리잡았습니다',
  30: '30일 연속! 압박 속에서도 생각이 정리됩니다',
  60: '60일 연속! 복잡한 문제도 명석하게 분석합니다',
  100: '100일 연속! 당신의 사고력은 철벽 방어 상태입니다',
};

// 인지 메시지 가져오기 (가장 가까운 마일스톤)
export const getStreakCognitiveMessage = (streak: number): string | null => {
  const milestones = Object.keys(STREAK_COGNITIVE_MESSAGES)
    .map(Number)
    .sort((a, b) => b - a);

  for (const milestone of milestones) {
    if (streak >= milestone) {
      return STREAK_COGNITIVE_MESSAGES[milestone];
    }
  }
  return null;
};

// 랜덤 피터 틸 명언 가져오기
export const getRandomThielQuote = (): string => {
  return THIEL_QUOTES[Math.floor(Math.random() * THIEL_QUOTES.length)];
};

// 퀘스트별 인지 프레이밍
export const QUEST_COGNITIVE_LABELS = {
  water: {
    title: '수분 공급',
    subtitle: '뇌 최적화 수분 공급',
    cognitiveEffect: '인지 기능 최적화',
  },
  protein: {
    title: '단백질',
    subtitle: '신경 회복의 재료',
    cognitiveEffect: '신경 전달 물질 합성',
  },
  cleanDiet: {
    title: '클린 다이어트',
    subtitle: '맑은 아침 사고를 위한 준비',
    cognitiveEffect: '수면 품질 향상',
  },
  workout: {
    title: '운동',
    subtitle: '사고력 보호막 강화',
    cognitiveEffect: '신경 가소성 활성화',
  },
};
