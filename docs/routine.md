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
| wake_sunlight | 07:00-07:10 | 햇빛 노출 | 망막 → 시교차상핵 자극 → 코르티솔 피크 앞당김. 창문 열고 10분 |
| mct_coffee | 07:10-07:30 | MCT 커피 | 탄수화물 없이 케톤 공급 → 전두엽 연료. 설탕/우유 없이 |
| deep_work | 07:30-09:00 | 딥워크 | 코르티솔+노르에피네프린 피크 타임. 폰 비행기모드, 핵심 과제 1개만 |

### 2단계: 신체 활성화 + 오전 업무 (09:00-12:00)
| key | time | title | desc |
|-----|------|-------|------|
| strength | 09:10-09:40 | 근력운동 | BDNF 분비 → 학습능력 강화. 30분 집중 |
| squat_morning | 09:40 | 스쿼트 1세트 | 맨몸 스쿼트 15회. 하체 혈류 증가 → 뇌 산소 공급 |
| strategic_rest | 09:40-10:00 | 전략적 멍때리기 | 정보 입력 완전 차단. DMN(디폴트 모드 네트워크) 활성화 → 창의적 연결 |
| reactive_work | 10:00-12:00 | 반응적 업무 | 이메일, 메신저, 미팅. 코르티솔 하강기에 적합 |

### 3단계: 영양 + 도파민 리셋 (12:00-13:30)
| key | time | title | desc |
|-----|------|-------|------|
| protein_meal | 12:00-13:00 | 고단백 식사 | 티로신(달걀, 닭, 생선) → 도파민 원료 보충 |
| squat_lunch | 13:00 | 스쿼트 2세트 | 맨몸 스쿼트 15회. 식후 혈당 스파이크 억제 |
| nsdr | 13:00-13:20 | NSDR | 눈 감고 10-20분. 도파민 베이스라인 65% 회복 (Huberman 연구) |
| lunch_mct | 13:20-13:30 | MCT 커피 | 오후 에너지 드롭 방지. 케톤 재공급 |

### 4단계: 기술 숙달 + 정리 (14:00-18:00)
| key | time | title | desc |
|-----|------|-------|------|
| skill_work | 14:00-17:00 | 반복 업무 / 기술 습득 | 아세틸콜린 우세 시간대. 반복 학습과 기술 연마에 최적 |
| squat_afternoon | 17:00 | 스쿼트 3세트 | 맨몸 스쿼트 15회. 오후 졸음 타파 + 하루 스쿼트 완료 |
| brain_log | 17:00-18:00 | 뇌 설정 로그 | 오늘 성공 패턴 1줄 + 내일 딥워크 과제 1개 기록. 자이가르닉 효과 활용 |

### 5단계: 유산소 + 회복 (20:00-21:00)
| key | time | title | desc |
|-----|------|-------|------|
| jogging | 20:00-20:40 | 조깅 | 저강도 유산소 → 엔도르핀 + 엔도카나비노이드 분비. 스트레스 호르몬 소거 |

### 6단계: 시스템 종료 (21:00-23:00)
| key | time | title | desc |
|-----|------|-------|------|
| digital_detox | 21:00 | 디지털 디톡스 | 블루라이트 차단 → 멜라토닌 분비 시작. 화면 끄기 |
| reading | 21:30-22:30 | 독서 | 종이책 or e-ink. 부교감신경 활성화 → 수면 전환 유도 |
| sleep | 23:00 | 숙면 | 글림프 시스템 가동 → 뇌 노폐물(베타아밀로이드) 제거. 7-8시간 확보 |

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
