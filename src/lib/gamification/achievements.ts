// ============================================
// 업적/뱃지 정의
// ============================================

export interface AchievementDef {
  key: string;
  nameKo: string;
  descriptionKo: string;
  iconEmoji: string;
  category: 'workout' | 'streak' | 'quest' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  xpReward: number;
  requirement: number;
  freezeReward?: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ============================================
  // 운동 마일스톤
  // ============================================
  {
    key: 'first_workout',
    nameKo: '첫 걸음',
    descriptionKo: '첫 운동을 완료했습니다!',
    iconEmoji: '🎯',
    category: 'workout',
    tier: 'bronze',
    xpReward: 50,
    requirement: 1,
  },
  {
    key: 'workout_10',
    nameKo: '워밍업 완료',
    descriptionKo: '10회 운동 완료',
    iconEmoji: '💪',
    category: 'workout',
    tier: 'bronze',
    xpReward: 100,
    requirement: 10,
  },
  {
    key: 'workout_25',
    nameKo: '습관 형성',
    descriptionKo: '25회 운동 완료',
    iconEmoji: '🔄',
    category: 'workout',
    tier: 'silver',
    xpReward: 200,
    requirement: 25,
  },
  {
    key: 'workout_50',
    nameKo: '운동 마니아',
    descriptionKo: '50회 운동 완료',
    iconEmoji: '🏋️',
    category: 'workout',
    tier: 'silver',
    xpReward: 300,
    requirement: 50,
  },
  {
    key: 'workout_100',
    nameKo: '센추리온',
    descriptionKo: '100회 운동 완료',
    iconEmoji: '💯',
    category: 'workout',
    tier: 'gold',
    xpReward: 500,
    requirement: 100,
  },
  {
    key: 'workout_200',
    nameKo: '철인',
    descriptionKo: '200회 운동 완료',
    iconEmoji: '🦾',
    category: 'workout',
    tier: 'gold',
    xpReward: 800,
    requirement: 200,
  },
  {
    key: 'workout_365',
    nameKo: '1년의 노력',
    descriptionKo: '365회 운동 완료',
    iconEmoji: '🏆',
    category: 'workout',
    tier: 'platinum',
    xpReward: 2000,
    requirement: 365,
  },

  // ============================================
  // 부위별 마스터
  // ============================================
  {
    key: 'chest_master',
    nameKo: '가슴 마스터',
    descriptionKo: '가슴 운동 20회 완료',
    iconEmoji: '💪',
    category: 'workout',
    tier: 'silver',
    xpReward: 200,
    requirement: 20,
  },
  {
    key: 'back_master',
    nameKo: '등 마스터',
    descriptionKo: '등 운동 20회 완료',
    iconEmoji: '🦴',
    category: 'workout',
    tier: 'silver',
    xpReward: 200,
    requirement: 20,
  },
  {
    key: 'leg_legend',
    nameKo: '하체 레전드',
    descriptionKo: '하체 운동 20회 완료',
    iconEmoji: '🦵',
    category: 'workout',
    tier: 'silver',
    xpReward: 200,
    requirement: 20,
  },
  {
    key: 'shoulder_master',
    nameKo: '어깨 마스터',
    descriptionKo: '어깨 운동 20회 완료',
    iconEmoji: '🎯',
    category: 'workout',
    tier: 'silver',
    xpReward: 200,
    requirement: 20,
  },

  // ============================================
  // 스트릭 업적
  // ============================================
  {
    key: 'streak_3',
    nameKo: '시작이 반',
    descriptionKo: '3일 연속 달성',
    iconEmoji: '🌱',
    category: 'streak',
    tier: 'bronze',
    xpReward: 50,
    requirement: 3,
  },
  {
    key: 'streak_7',
    nameKo: '일주일 불꽃',
    descriptionKo: '7일 연속 달성',
    iconEmoji: '🔥',
    category: 'streak',
    tier: 'bronze',
    xpReward: 200,
    requirement: 7,
    freezeReward: 1,
  },
  {
    key: 'streak_14',
    nameKo: '2주 챔피언',
    descriptionKo: '14일 연속 달성',
    iconEmoji: '⚡',
    category: 'streak',
    tier: 'silver',
    xpReward: 350,
    requirement: 14,
  },
  {
    key: 'streak_30',
    nameKo: '한 달의 기적',
    descriptionKo: '30일 연속 달성',
    iconEmoji: '🌟',
    category: 'streak',
    tier: 'gold',
    xpReward: 500,
    requirement: 30,
    freezeReward: 2,
  },
  {
    key: 'streak_60',
    nameKo: '두 달의 전설',
    descriptionKo: '60일 연속 달성',
    iconEmoji: '✨',
    category: 'streak',
    tier: 'gold',
    xpReward: 800,
    requirement: 60,
    freezeReward: 1,
  },
  {
    key: 'streak_100',
    nameKo: '백일의 맹세',
    descriptionKo: '100일 연속 달성',
    iconEmoji: '👑',
    category: 'streak',
    tier: 'platinum',
    xpReward: 1500,
    requirement: 100,
    freezeReward: 3,
  },

  // ============================================
  // 퀘스트 업적
  // ============================================
  {
    key: 'perfect_day',
    nameKo: '완벽한 하루',
    descriptionKo: '모든 퀘스트를 처음으로 완료',
    iconEmoji: '⭐',
    category: 'quest',
    tier: 'bronze',
    xpReward: 100,
    requirement: 1,
  },
  {
    key: 'perfect_week',
    nameKo: '완벽한 한 주',
    descriptionKo: '7일 연속 모든 퀘스트 완료',
    iconEmoji: '🌈',
    category: 'quest',
    tier: 'silver',
    xpReward: 300,
    requirement: 7,
  },
  {
    key: 'hydration_10',
    nameKo: '수분 보충',
    descriptionKo: '물 3L 달성 10회',
    iconEmoji: '💧',
    category: 'quest',
    tier: 'bronze',
    xpReward: 100,
    requirement: 10,
  },
  {
    key: 'hydration_30',
    nameKo: '수분 마스터',
    descriptionKo: '물 3L 달성 30회',
    iconEmoji: '🌊',
    category: 'quest',
    tier: 'silver',
    xpReward: 250,
    requirement: 30,
  },
  {
    key: 'protein_10',
    nameKo: '단백질 러버',
    descriptionKo: '단백질 목표 달성 10회',
    iconEmoji: '🥩',
    category: 'quest',
    tier: 'bronze',
    xpReward: 100,
    requirement: 10,
  },
  {
    key: 'protein_30',
    nameKo: '단백질 왕',
    descriptionKo: '단백질 목표 달성 30회',
    iconEmoji: '🍖',
    category: 'quest',
    tier: 'silver',
    xpReward: 250,
    requirement: 30,
  },
  {
    key: 'clean_10',
    nameKo: '의지의 시작',
    descriptionKo: '야식 금지 달성 10회',
    iconEmoji: '🌙',
    category: 'quest',
    tier: 'bronze',
    xpReward: 100,
    requirement: 10,
  },
  {
    key: 'clean_30',
    nameKo: '클린 이터',
    descriptionKo: '야식 금지 달성 30회',
    iconEmoji: '✨',
    category: 'quest',
    tier: 'silver',
    xpReward: 250,
    requirement: 30,
  },

  // ============================================
  // 특별 업적
  // ============================================
  {
    key: 'early_bird',
    nameKo: '얼리버드',
    descriptionKo: '오전 8시 전 운동 완료',
    iconEmoji: '🌅',
    category: 'special',
    tier: 'bronze',
    xpReward: 75,
    requirement: 1,
  },
  {
    key: 'early_bird_10',
    nameKo: '아침형 인간',
    descriptionKo: '오전 8시 전 운동 10회 완료',
    iconEmoji: '☀️',
    category: 'special',
    tier: 'silver',
    xpReward: 200,
    requirement: 10,
  },
  {
    key: 'night_owl',
    nameKo: '밤의 전사',
    descriptionKo: '오후 10시 후 운동 완료',
    iconEmoji: '🦉',
    category: 'special',
    tier: 'bronze',
    xpReward: 50,
    requirement: 1,
  },
  {
    key: 'comeback_kid',
    nameKo: '컴백 키드',
    descriptionKo: '프리즈 사용 후 3일 연속 달성',
    iconEmoji: '🔄',
    category: 'special',
    tier: 'silver',
    xpReward: 150,
    requirement: 3,
  },
  {
    key: 'level_10',
    nameKo: '루키 탈출',
    descriptionKo: '레벨 10 달성',
    iconEmoji: '🎖️',
    category: 'special',
    tier: 'bronze',
    xpReward: 100,
    requirement: 10,
  },
  {
    key: 'level_25',
    nameKo: '중급자',
    descriptionKo: '레벨 25 달성',
    iconEmoji: '🏅',
    category: 'special',
    tier: 'silver',
    xpReward: 250,
    requirement: 25,
  },
  {
    key: 'level_50',
    nameKo: '전문가',
    descriptionKo: '레벨 50 달성',
    iconEmoji: '🥇',
    category: 'special',
    tier: 'gold',
    xpReward: 500,
    requirement: 50,
  },
];

// 카테고리별 필터 헬퍼
export const getAchievementsByCategory = (category: AchievementDef['category']) => {
  return ACHIEVEMENTS.filter(a => a.category === category);
};

// 키로 업적 찾기
export const getAchievementByKey = (key: string) => {
  return ACHIEVEMENTS.find(a => a.key === key);
};
