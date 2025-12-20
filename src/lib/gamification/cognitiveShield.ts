// ============================================
// 인지 방패 (Cognitive Shield) 시스템
// 피터 틸 철학: "운동은 사고의 깊이를 지키는 방패다"
// ============================================

import { COGNITIVE_SHIELD_MESSAGES } from './config';

export type ShieldStatus = 'critical' | 'vulnerable' | 'protected' | 'fortified';

export interface CognitiveShieldData {
  level: number;           // 0-100
  status: ShieldStatus;
  statusMessage: typeof COGNITIVE_SHIELD_MESSAGES[ShieldStatus];
}

/**
 * 인지 방패 레벨 계산
 * - 스트릭 보너스: 최대 40점 (스트릭 * 2, 최대 20일 기준)
 * - 일관성 보너스: 최대 30점 (총 운동 횟수 / 10, 최대 300회 기준)
 * - 퍼펙트 데이 보너스: 최대 30점 (모든 퀘스트+운동 완료 일수)
 */
export const calculateShieldLevel = (
  currentStreak: number,
  totalWorkouts: number,
  perfectDays: number = 0
): number => {
  // 스트릭 보너스 (최대 40점)
  const streakBonus = Math.min(currentStreak * 2, 40);

  // 일관성 보너스 (최대 30점)
  const consistencyBonus = Math.min(totalWorkouts / 10, 30);

  // 퍼펙트 데이 보너스 (최대 30점)
  const perfectBonus = Math.min(perfectDays, 30);

  // 총합 (최대 100)
  const total = streakBonus + consistencyBonus + perfectBonus;

  return Math.min(Math.max(Math.round(total), 0), 100);
};

/**
 * 방패 상태 결정
 * - critical (0-30%): 위험 - 사고력 보호막이 약해지고 있습니다
 * - vulnerable (31-60%): 주의 - 보호막을 강화하세요
 * - protected (61-85%): 안정 - 사고력이 안정적으로 보호받는 중
 * - fortified (86-100%): 철벽 - 복잡한 문제도 명석하게 처리할 준비 완료
 */
export const getShieldStatus = (level: number): ShieldStatus => {
  if (level <= 30) return 'critical';
  if (level <= 60) return 'vulnerable';
  if (level <= 85) return 'protected';
  return 'fortified';
};

/**
 * 완전한 인지 방패 데이터 계산
 */
export const getCognitiveShieldData = (
  currentStreak: number,
  totalWorkouts: number,
  perfectDays: number = 0
): CognitiveShieldData => {
  const level = calculateShieldLevel(currentStreak, totalWorkouts, perfectDays);
  const status = getShieldStatus(level);
  const statusMessage = COGNITIVE_SHIELD_MESSAGES[status];

  return {
    level,
    status,
    statusMessage,
  };
};

/**
 * 방패 상태별 색상 클래스
 */
export const getShieldColorClasses = (status: ShieldStatus) => {
  switch (status) {
    case 'critical':
      return {
        bg: 'bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-red-950/40 dark:via-rose-950/30 dark:to-pink-950/30',
        border: 'border-red-200/60 dark:border-red-800/50',
        text: 'text-red-500 dark:text-red-400',
        progress: 'bg-red-500',
        glow: 'shadow-red-500/30',
      };
    case 'vulnerable':
      return {
        bg: 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/40 dark:via-amber-950/30 dark:to-yellow-950/30',
        border: 'border-orange-200/60 dark:border-orange-800/50',
        text: 'text-orange-500 dark:text-orange-400',
        progress: 'bg-orange-500',
        glow: 'shadow-orange-500/30',
      };
    case 'protected':
      return {
        bg: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-violet-950/30',
        border: 'border-blue-200/60 dark:border-blue-800/50',
        text: 'text-blue-500 dark:text-blue-400',
        progress: 'bg-blue-500',
        glow: 'shadow-blue-500/30',
      };
    case 'fortified':
      return {
        bg: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/30',
        border: 'border-amber-200/60 dark:border-amber-800/50',
        text: 'text-amber-500 dark:text-amber-400',
        progress: 'bg-gradient-to-r from-amber-500 to-yellow-400',
        glow: 'shadow-amber-500/40',
      };
  }
};

/**
 * 방패 아이콘 이모지
 */
export const getShieldEmoji = (status: ShieldStatus): string => {
  switch (status) {
    case 'critical':
      return '🔴';
    case 'vulnerable':
      return '🟠';
    case 'protected':
      return '🔵';
    case 'fortified':
      return '🛡️';
  }
};
