'use client'

import React, { SVGProps } from 'react'

type IllustrationProps = SVGProps<SVGSVGElement> & { className?: string }

const defaultProps: IllustrationProps = {
  viewBox: '0 0 120 120',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

// ── 가슴/삼두 (Chest/Triceps) ──

export function FloorPress({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      {/* 바닥 */}
      <line x1="15" y1="95" x2="105" y2="95" strokeOpacity="0.3" />
      {/* 머리 */}
      <circle cx="30" cy="78" r="8" />
      {/* 몸통 (누운 상태) */}
      <line x1="38" y1="78" x2="75" y2="78" />
      {/* 허벅지 */}
      <line x1="75" y1="78" x2="85" y2="95" />
      {/* 정강이 (무릎 세운 상태) */}
      <line x1="85" y1="95" x2="85" y2="78" />
      {/* 상완 */}
      <line x1="50" y1="78" x2="50" y2="55" />
      {/* 전완 */}
      <line x1="50" y1="55" x2="50" y2="40" />
      {/* 덤벨 */}
      <rect x="43" y="35" width="14" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function DumbbellFly({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <line x1="15" y1="95" x2="105" y2="95" strokeOpacity="0.3" />
      <circle cx="30" cy="78" r="8" />
      <line x1="38" y1="78" x2="75" y2="78" />
      <line x1="75" y1="78" x2="85" y2="95" />
      <line x1="85" y1="95" x2="85" y2="78" />
      {/* 양팔 벌린 상태 */}
      <line x1="50" y1="78" x2="35" y2="55" />
      <line x1="50" y1="78" x2="65" y2="55" />
      <rect x="28" y="50" width="14" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
      <rect x="58" y="50" width="14" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function TRXPushUp({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      {/* TRX 앵커포인트 */}
      <circle cx="60" cy="10" r="3" fill="currentColor" fillOpacity="0.3" />
      <line x1="50" y1="10" x2="50" y2="50" strokeDasharray="4 3" strokeOpacity="0.4" />
      <line x1="70" y1="10" x2="70" y2="50" strokeDasharray="4 3" strokeOpacity="0.4" />
      {/* 푸쉬업 자세 (기울어진 상태) */}
      <circle cx="40" cy="55" r="7" />
      <line x1="47" y1="58" x2="85" y2="75" />
      <line x1="85" y1="75" x2="90" y2="95" />
      {/* 팔 (TRX 핸들 잡은 상태) */}
      <line x1="42" y1="62" x2="50" y2="50" />
      <line x1="45" y1="60" x2="70" y2="50" />
    </svg>
  )
}

export function OverheadTriceps({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      {/* 서 있는 자세 */}
      <circle cx="60" cy="22" r="8" />
      <line x1="60" y1="30" x2="60" y2="65" />
      <line x1="60" y1="65" x2="50" y2="95" />
      <line x1="60" y1="65" x2="70" y2="95" />
      {/* 팔 (머리 뒤로 덤벨) */}
      <line x1="60" y1="38" x2="55" y2="25" />
      <line x1="55" y1="25" x2="50" y2="38" />
      <rect x="44" y="35" width="12" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function TRXTricepsExtension({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="10" r="3" fill="currentColor" fillOpacity="0.3" />
      <line x1="55" y1="10" x2="55" y2="45" strokeDasharray="4 3" strokeOpacity="0.4" />
      <line x1="65" y1="10" x2="65" y2="45" strokeDasharray="4 3" strokeOpacity="0.4" />
      {/* 기울어진 자세에서 팔 펴기 */}
      <circle cx="50" cy="50" r="7" />
      <line x1="57" y1="53" x2="80" y2="70" />
      <line x1="80" y1="70" x2="85" y2="95" />
      <line x1="52" y1="57" x2="55" y2="45" />
      <line x1="55" y1="53" x2="65" y2="45" />
    </svg>
  )
}

// ── 등/이두 (Back/Biceps) ──

export function OneArmRow({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      {/* 벤치 */}
      <rect x="15" y="65" width="40" height="5" rx="2" strokeOpacity="0.3" />
      <circle cx="55" cy="45" r="7" />
      <line x1="55" y1="52" x2="45" y2="68" />
      <line x1="45" y1="68" x2="35" y2="95" />
      <line x1="45" y1="68" x2="55" y2="95" />
      {/* 왼손 벤치 짚기 */}
      <line x1="50" y1="55" x2="35" y2="65" />
      {/* 오른손 덤벨 당기기 */}
      <line x1="52" y1="58" x2="65" y2="65" />
      <line x1="65" y1="65" x2="68" y2="55" />
      <rect x="63" y="50" width="10" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function TRXRow({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="10" r="3" fill="currentColor" fillOpacity="0.3" />
      <line x1="50" y1="10" x2="50" y2="48" strokeDasharray="4 3" strokeOpacity="0.4" />
      <line x1="70" y1="10" x2="70" y2="48" strokeDasharray="4 3" strokeOpacity="0.4" />
      {/* 뒤로 기울어진 자세에서 당기기 */}
      <circle cx="55" cy="55" r="7" />
      <line x1="55" y1="62" x2="40" y2="85" />
      <line x1="40" y1="85" x2="35" y2="95" />
      <line x1="52" y1="60" x2="50" y2="48" />
      <line x1="58" y1="60" x2="70" y2="48" />
    </svg>
  )
}

export function DumbbellPullover({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <line x1="15" y1="95" x2="105" y2="95" strokeOpacity="0.3" />
      {/* 벤치 */}
      <rect x="30" y="70" width="35" height="5" rx="2" strokeOpacity="0.3" />
      <circle cx="35" cy="62" r="7" />
      <line x1="42" y1="65" x2="65" y2="72" />
      <line x1="65" y1="72" x2="75" y2="95" />
      {/* 팔 머리 뒤로 뻗은 상태 */}
      <line x1="38" y1="58" x2="25" y2="48" />
      <line x1="25" y1="48" x2="18" y2="42" />
      <rect x="12" y="38" width="12" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function BicepsCurl({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="22" r="8" />
      <line x1="60" y1="30" x2="60" y2="65" />
      <line x1="60" y1="65" x2="50" y2="95" />
      <line x1="60" y1="65" x2="70" y2="95" />
      {/* 오른팔 컬 (접힌 상태) */}
      <line x1="60" y1="40" x2="72" y2="52" />
      <line x1="72" y1="52" x2="68" y2="38" />
      <rect x="63" y="32" width="10" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
      {/* 왼팔 내린 상태 */}
      <line x1="60" y1="40" x2="48" y2="58" />
      <rect x="42" y="56" width="10" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function HammerCurl({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="22" r="8" />
      <line x1="60" y1="30" x2="60" y2="65" />
      <line x1="60" y1="65" x2="50" y2="95" />
      <line x1="60" y1="65" x2="70" y2="95" />
      {/* 해머컬 (덤벨 세로 방향) */}
      <line x1="60" y1="40" x2="72" y2="50" />
      <line x1="72" y1="50" x2="70" y2="38" />
      <rect x="67" y="32" width="6" height="12" rx="2" fill="currentColor" fillOpacity="0.15" />
      <line x1="60" y1="40" x2="48" y2="58" />
      <rect x="45" y="56" width="6" height="12" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

// ── 하체 (Legs) ──

export function GobletSquat({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="22" r="8" />
      <line x1="60" y1="30" x2="60" y2="55" />
      {/* 스쿼트 자세 (앉은 상태) */}
      <line x1="60" y1="55" x2="45" y2="72" />
      <line x1="45" y1="72" x2="45" y2="95" />
      <line x1="60" y1="55" x2="75" y2="72" />
      <line x1="75" y1="72" x2="75" y2="95" />
      {/* 가슴 앞 덤벨 */}
      <line x1="60" y1="38" x2="55" y2="42" />
      <line x1="60" y1="38" x2="65" y2="42" />
      <rect x="52" y="42" width="16" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function DumbbellLunge({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="50" cy="22" r="8" />
      <line x1="50" y1="30" x2="50" y2="58" />
      {/* 런지 자세 */}
      <line x1="50" y1="58" x2="35" y2="78" />
      <line x1="35" y1="78" x2="35" y2="95" />
      <line x1="50" y1="58" x2="72" y2="72" />
      <line x1="72" y1="72" x2="85" y2="90" />
      {/* 양손 덤벨 */}
      <line x1="50" y1="38" x2="38" y2="58" />
      <rect x="33" y="56" width="10" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
      <line x1="50" y1="38" x2="62" y2="58" />
      <rect x="57" y="56" width="10" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function RomanianDeadlift({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      {/* 힌지 자세 (상체 앞으로 기울임) */}
      <circle cx="40" cy="30" r="8" />
      <line x1="45" y1="35" x2="70" y2="50" />
      <line x1="70" y1="50" x2="65" y2="80" />
      <line x1="65" y1="80" x2="65" y2="95" />
      <line x1="70" y1="50" x2="78" y2="80" />
      <line x1="78" y1="80" x2="78" y2="95" />
      {/* 덤벨 아래로 내린 상태 */}
      <line x1="48" y1="38" x2="38" y2="55" />
      <rect x="32" y="53" width="12" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
      <line x1="42" y1="36" x2="52" y2="55" />
      <rect x="46" y="53" width="12" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function TRXPistolSquat({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="10" r="3" fill="currentColor" fillOpacity="0.3" />
      <line x1="55" y1="10" x2="50" y2="38" strokeDasharray="4 3" strokeOpacity="0.4" />
      <line x1="65" y1="10" x2="65" y2="38" strokeDasharray="4 3" strokeOpacity="0.4" />
      <circle cx="55" cy="42" r="7" />
      <line x1="55" y1="49" x2="55" y2="65" />
      {/* 한 다리 스쿼트 */}
      <line x1="55" y1="65" x2="45" y2="82" />
      <line x1="45" y1="82" x2="48" y2="95" />
      {/* 앞으로 뻗은 다리 */}
      <line x1="55" y1="65" x2="80" y2="72" />
      {/* TRX 잡은 팔 */}
      <line x1="52" y1="52" x2="50" y2="38" />
      <line x1="58" y1="52" x2="65" y2="38" />
    </svg>
  )
}

export function CalfRaise({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="15" r="8" />
      <line x1="60" y1="23" x2="60" y2="58" />
      {/* 까치발 자세 */}
      <line x1="60" y1="58" x2="55" y2="82" />
      <line x1="55" y1="82" x2="55" y2="88" />
      <line x1="55" y1="88" x2="50" y2="88" />
      <line x1="60" y1="58" x2="65" y2="82" />
      <line x1="65" y1="82" x2="65" y2="88" />
      <line x1="65" y1="88" x2="70" y2="88" />
      {/* 스텝 */}
      <rect x="40" y="90" width="40" height="5" rx="2" strokeOpacity="0.3" />
      {/* 양손 덤벨 */}
      <line x1="60" y1="35" x2="45" y2="50" />
      <rect x="40" y="48" width="10" height="5" rx="2" fill="currentColor" fillOpacity="0.15" />
      <line x1="60" y1="35" x2="75" y2="50" />
      <rect x="70" y="48" width="10" height="5" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

// ── 어깨/복근 (Shoulders/Abs) ──

export function ShoulderPress({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="30" r="8" />
      <line x1="60" y1="38" x2="60" y2="70" />
      <line x1="60" y1="70" x2="50" y2="95" />
      <line x1="60" y1="70" x2="70" y2="95" />
      {/* 양팔 위로 프레스 */}
      <line x1="60" y1="45" x2="45" y2="30" />
      <line x1="45" y1="30" x2="40" y2="15" />
      <rect x="34" y="10" width="12" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
      <line x1="60" y1="45" x2="75" y2="30" />
      <line x1="75" y1="30" x2="80" y2="15" />
      <rect x="74" y="10" width="12" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function LateralRaise({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="22" r="8" />
      <line x1="60" y1="30" x2="60" y2="65" />
      <line x1="60" y1="65" x2="50" y2="95" />
      <line x1="60" y1="65" x2="70" y2="95" />
      {/* 양팔 옆으로 들어올림 (T자) */}
      <line x1="60" y1="40" x2="30" y2="40" />
      <rect x="22" y="37" width="10" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
      <line x1="60" y1="40" x2="90" y2="40" />
      <rect x="88" y="37" width="10" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function FrontRaise({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="22" r="8" />
      <line x1="60" y1="30" x2="60" y2="65" />
      <line x1="60" y1="65" x2="50" y2="95" />
      <line x1="60" y1="65" x2="70" y2="95" />
      {/* 한 팔 앞으로 들어올림 */}
      <line x1="60" y1="40" x2="45" y2="25" />
      <rect x="39" y="20" width="12" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
      {/* 다른 팔 내린 상태 */}
      <line x1="60" y1="40" x2="52" y2="58" />
      <rect x="46" y="56" width="12" height="6" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function TRXPike({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      {/* 바닥 */}
      <line x1="10" y1="95" x2="110" y2="95" strokeOpacity="0.3" />
      {/* TRX에 발 걸고 파이크 */}
      <circle cx="35" cy="45" r="7" />
      {/* 몸통 (V자 형태) */}
      <line x1="35" y1="52" x2="55" y2="35" />
      <line x1="55" y1="35" x2="85" y2="55" />
      {/* 팔 (바닥 짚기) */}
      <line x1="32" y1="52" x2="28" y2="75" />
      <line x1="38" y1="52" x2="42" y2="75" />
      {/* TRX 스트랩 */}
      <line x1="85" y1="55" x2="95" y2="20" strokeDasharray="4 3" strokeOpacity="0.4" />
      <circle cx="95" cy="15" r="3" fill="currentColor" fillOpacity="0.3" />
    </svg>
  )
}

export function TRXFallout({ className, ...props }: IllustrationProps) {
  return (
    <svg {...defaultProps} className={className} {...props}>
      <circle cx="60" cy="10" r="3" fill="currentColor" fillOpacity="0.3" />
      <line x1="50" y1="10" x2="35" y2="48" strokeDasharray="4 3" strokeOpacity="0.4" />
      <line x1="70" y1="10" x2="55" y2="48" strokeDasharray="4 3" strokeOpacity="0.4" />
      {/* 서서 팔 앞으로 뻗기 */}
      <circle cx="60" cy="55" r="7" />
      <line x1="60" y1="62" x2="60" y2="82" />
      <line x1="60" y1="82" x2="55" y2="95" />
      <line x1="60" y1="82" x2="65" y2="95" />
      {/* 팔 앞으로 뻗은 상태 */}
      <line x1="57" y1="60" x2="35" y2="48" />
      <line x1="63" y1="60" x2="55" y2="48" />
    </svg>
  )
}

// ── 매핑 테이블 ──

export const ILLUSTRATION_MAP: Record<string, React.FC<IllustrationProps>> = {
  '덤벨 플로어프레스': FloorPress,
  '덤벨 플라이': DumbbellFly,
  'TRX 푸쉬업': TRXPushUp,
  '덤벨 오버헤드 트라이셉스': OverheadTriceps,
  'TRX 트라이셉스 익스텐션': TRXTricepsExtension,
  '덤벨 원암 로우': OneArmRow,
  'TRX 로우': TRXRow,
  '덤벨 풀오버': DumbbellPullover,
  '덤벨 바이셉스 컬': BicepsCurl,
  '덤벨 해머컬': HammerCurl,
  '덤벨 고블릿 스쿼트': GobletSquat,
  '덤벨 런지': DumbbellLunge,
  '덤벨 루마니안 데드리프트': RomanianDeadlift,
  'TRX 피스톨 스쿼트': TRXPistolSquat,
  '덤벨 카프레이즈': CalfRaise,
  '덤벨 숄더프레스': ShoulderPress,
  '덤벨 래터럴레이즈': LateralRaise,
  '덤벨 프론트레이즈': FrontRaise,
  'TRX 파이크': TRXPike,
  'TRX 폴아웃': TRXFallout,
}
