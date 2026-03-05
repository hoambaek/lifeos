# 루틴 (Routine) 기능 문서

## 개요
신경과학 기반 일일 최적 루틴 체크리스트 시스템. 6단계로 구성된 하루 루틴을 체크하며 관리.

## 파일 구조
- **프론트엔드**: `src/app/routine/page.tsx` (클라이언트 컴포넌트)
- **API**: `src/app/api/routine/route.ts` (GET/POST)
- **네비게이션**: `src/components/BottomNav.tsx` → `/routine` 경로, `CheckSquare` 아이콘

## DB 스키마
테이블: `RoutineLog` (API route 내 `ensureTable()`로 동적 생성, Prisma schema에 미등록)

```sql
CREATE TABLE "RoutineLog" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "date" TEXT NOT NULL UNIQUE,
  "completedItems" TEXT NOT NULL DEFAULT '[]',  -- JSON 배열 (완료된 item key 목록)
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

## API
- `GET /api/routine?date=yyyy-MM-dd` → `{ date, completedItems: string[] }`
- `POST /api/routine` body: `{ date, completedItems }` → UPSERT (ON CONFLICT 사용)

## 루틴 6단계 (ROUTINE_PHASES)

### 1단계: 기상 직후 90분 (07:00-09:00) - 인지력 극대화
| key | time | title | desc |
|-----|------|-------|------|
| wake_sunlight | 07:00-07:10 | 햇빛 노출 | 창문 열고 10분 햇빛 쬐기. 몸이 아침이라는 걸 인식하게 해줌 |
| mct_coffee | 07:10-07:30 | MCT 커피 | 설탕/우유 없이. 뇌에 바로 쓸 수 있는 에너지 공급 |
| deep_work | 07:30-09:00 | 딥워크 | 하루 중 집중력 최고 시간. 폰 비행기모드, 핵심 과제 1개만 |

### 2단계: 신체 활성화 + 오전 업무 (09:00-12:00)
| key | time | title | desc |
|-----|------|-------|------|
| strength | 09:10-09:40 | 근력운동 | 운동하면 뇌가 새로운 걸 더 잘 배움. 30분 집중 |
| squat_morning | 09:40 | 스쿼트 1세트 | 맨몸 스쿼트 15회. 혈액순환 올려서 머리 맑게 |
| strategic_rest | 09:40-10:00 | 전략적 멍때리기 | 아무것도 안 보고 멍때리기. 뇌가 알아서 아이디어를 정리해줌 |
| reactive_work | 10:00-12:00 | 반응적 업무 | 이메일, 메신저, 미팅 처리. 집중력 떨어지는 시간에 딱 맞음 |

### 3단계: 영양 + 도파민 리셋 (12:00-13:30)
| key | time | title | desc |
|-----|------|-------|------|
| protein_meal | 12:00-13:00 | 고단백 식사 | 달걀, 닭, 생선 위주. 오후 의욕의 원료가 됨 |
| squat_lunch | 13:00 | 스쿼트 2세트 | 맨몸 스쿼트 15회. 밥 먹고 졸리는 거 방지 |
| nsdr | 13:00-13:20 | NSDR | 눈 감고 10-20분 쉬기. 의욕과 집중력이 크게 회복됨 |
| lunch_mct | 13:20-13:30 | MCT 커피 | 오후 에너지 떨어지는 거 방지. 뇌 연료 재충전 |

### 4단계: 기술 숙달 + 정리 (14:00-18:00)
| key | time | title | desc |
|-----|------|-------|------|
| skill_work | 14:00-17:00 | 반복 업무 / 기술 습득 | 오후는 반복 연습에 좋은 시간. 기술 연마와 실무에 집중 |
| squat_afternoon | 17:00 | 스쿼트 3세트 | 맨몸 스쿼트 15회. 오후 졸음 타파 + 하루 스쿼트 완료 |
| brain_log | 17:00-18:00 | 뇌 설정 로그 | 오늘 잘한 것 1줄 + 내일 핵심 과제 1개 적기. 적어두면 내일 바로 시작 가능 |

### 5단계: 유산소 + 회복 (20:00-21:00)
| key | time | title | desc |
|-----|------|-------|------|
| jogging | 20:00-20:40 | 조깅 | 가볍게 뛰기. 하루 스트레스가 풀리고 기분이 좋아짐 |

### 6단계: 시스템 종료 (21:00-23:00)
| key | time | title | desc |
|-----|------|-------|------|
| digital_detox | 21:00 | 디지털 디톡스 | 화면 끄기. 잠 잘 오게 몸이 준비하는 시간 |
| reading | 21:30-22:30 | 독서 | 종이책 or e-ink. 마음이 편해지면서 자연스럽게 잠이 옴 |
| sleep | 23:00 | 숙면 | 자는 동안 뇌가 청소됨. 7-8시간 확보 |

**총 16개 항목** (ALL_KEYS)

## 프론트엔드 동작
- 날짜 네비게이션: 이전/다음 날 이동 (미래 날짜 불가)
- 체크 토글: 클릭 시 완료/미완료 전환, 500ms debounce 후 서버 저장
- 진행도 바: completedCount/totalCount 표시
- 전체 완료 시: 축하 오버레이 + 컨페티 애니메이션 (4초)
- 로딩 중 토글 비활성화

## 게이미피케이션 연동
- `UserProfile.perfectRoutineDays`: 퍼펙트 루틴 달성 일수 추적
- `perfect_routine_day`: 30 XP 보상 (모든 퀘스트 + 운동 완료 시)
- 업적 연동:
  - `mind_fortress_7`: 7일 연속 루틴 완수 → '사고의 성벽'
  - `mind_fortress_30`: 30일 연속 루틴 완수 → '철의 요새'
- 인지 방패 시스템: 루틴 수행이 cognitiveShieldLevel에 영향
- 레벨 15 칭호: '루틴 수호자'

## 디자인 특징
- editorial 스타일 (font-serif, editorial-label, editorial-rule)
- stone 컬러 팔레트 + 다크모드 지원
- emerald 색상으로 완료 상태 표시
- fade-in-up 애니메이션, 단계별 delay
