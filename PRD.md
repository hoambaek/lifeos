# 📱 PRD: 6-Month Muscle Reset (6개월 근육질 리셋)

## 1. 프로젝트 개요 (Overview)
* **프로젝트명:** 6-Month Muscle Reset
* **목표:** 인바디 기반 6개월 장기 컷팅 플랜의 진행 상황을 추적하고, 매일의 식단(단백질)과 운동 루틴을 체크하여 동기를 부여함.
* **타겟 디바이스:** 모바일 웹 (Mobile First) - 추후 PWA(Progressive Web App)로 홈 화면 추가 가능하도록 구성.
* **개발 방식:** **Mobile First Development** - 모바일 화면(375px~)을 기준으로 먼저 개발 후 태블릿/데스크톱 대응
* **핵심 가치:** "복잡한 입력 최소화, 직관적인 진행률 확인"

---

## 2. 기술 스택 (Tech Stack)
* **Framework:** Next.js 15 (App Router 방식 사용)
* **Language:** TypeScript
* **Styling:** Tailwind CSS 3.x
* **UI Components:** Shadcn/ui (Radix UI 기반 - 개발 속도 최적화)
* **Frontend Design:** `frontend-design` 스킬 활용 (고품질 UI/UX 구현)
* **Database (Local):** SQLite (`dev.db` 파일 기반)
* **ORM:** Prisma (스키마 관리 및 마이그레이션 용이)
* **State Management:** Zustand (가벼고 직관적)
* **Charts:** Recharts (체중 변화 그래프 시각화)
* **Image Analysis:** AI 기반 인바디 이미지 분석 (OCR + LLM)
* **Deployment:** Vercel (DB 영속성이 중요할 경우 Supabase/Turso 연동, 로컬 전용이면 `npm run dev` 사용)

---

## 3. 주요 기능 (Core Features)

### A. 대시보드 (Dashboard - Home)
* **상태 요약 카드:**
    * 현재 단계 표시 (예: "2단계 - 가속화 구간")
    * D-Day 카운터 (전체 180일 중 진행일수)
    * 체중 목표 달성률 (Progress Bar)
    * **최근 인바디 점수** 표시 (68/100점 등)
* **오늘의 퀘스트 (Daily Quest):**
    * [ ] 물 3L 마시기 (Toggle)
    * [ ] 단백질 150g 채우기 (Progress Bar + 입력 모달 연동)
    * [ ] 야식 금지 / 클린식 (Toggle)
* **오늘의 운동 (Today's Workout):**
    * 요일별 자동 루틴 노출 (예: 월요일 -> 가슴/삼두)
    * "운동 완료 인증" 버튼 (클릭 시 DB 저장 및 축하 효과)

### B. 데일리 로그 (Log)
* **체중 기록:**
    * 매일 아침 공복 체중 입력 (소수점 첫째 자리까지).
* **식단(단백질) 계산기:**
    * 복잡한 칼로리 입력 제외. "단백질 덩어리" 단위로 탭하여 추가.
    * 🐔 닭가슴살 (+23g), 🥚 계란 (+6g), 🐷 뒷다리살 (+22g), 🥤 프로틴 (+25g)
* **캘린더 뷰:**
    * 지난 날짜의 성공/실패 여부를 O/X 또는 색상으로 표시.

### C. 인바디 분석 (InBody) - **NEW**
* **주간 인바디 스캔 업로드:**
    * 1주일에 1회 인바디 측정 결과 이미지 업로드
    * 지원 형식: PNG, JPG, HEIC
    * 참고 이미지: `public/inbody/inbody.png`
* **AI 이미지 분석:**
    * 업로드된 인바디 이미지에서 주요 데이터 자동 추출:
        * 체중 (Weight)
        * 골격근량 (Skeletal Muscle Mass)
        * 체지방량 (Body Fat Mass)
        * 체지방률 (Body Fat Percentage)
        * BMI
        * 인바디 점수 (InBody Score)
        * 내장지방 레벨 (Visceral Fat Level)
        * 기초대사량 (BMR)
        * 부위별 근육/지방 분석
* **AI 코칭 & 조언:**
    * 이전 측정치 대비 변화 분석
    * 현재 단계에 맞는 맞춤 조언 제공
    * 부족한 부위 운동 추천
    * 식단 조절 가이드
    * 목표 달성을 위한 예상 일정
* **인바디 히스토리:**
    * 측정 기록 타임라인 뷰
    * 주요 수치 변화 그래프 (골격근량, 체지방량 등)
    * 인바디 점수 추이

### D. 가이드 & 도구 (Guide)
* **대체 식품 환산기:**
    * "닭가슴살 1덩이"를 선택하면 -> "계란 4개(노른자2)", "돼지 뒷다리 100g" 등으로 변환값 표시.
* **단계별 전략 가이드:**
    * 현재 주차(Week)에 맞는 식단/운동 팁 텍스트 노출.
* **인바디 기반 맞춤 가이드:**
    * 최근 인바디 분석 결과를 반영한 개인화된 조언

### E. 통계 (Stats)
* **체중 변화 그래프:** 주간/월간 체중 변화 추이 (Line Chart).
* **습관 달성률:** 지난주 퀘스트 성공률 표시.
* **인바디 지표 변화:** 골격근량, 체지방량, 체지방률 변화 추이 그래프

---

## 4. 데이터베이스 스키마 (Prisma Schema)

`schema.prisma` 파일 예시입니다.

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

// 사용자 목표 설정 (앱 초기 세팅값)
model UserConfig {
  id          Int      @id @default(autoincrement())
  startWeight Float    // 시작 체중 (101.1kg)
  goalWeight  Float    // 목표 체중 (85.0kg)
  startDate   DateTime @default(now()) // 프로젝트 시작일
}

// 일일 기록 (Log)
model DailyLog {
  id          Int      @id @default(autoincrement())
  date        DateTime @unique @default(now()) // 날짜 (YYYY-MM-DD)
  weight      Float?   // 당일 체중

  // 퀘스트 달성 여부
  proteinAmount Int     @default(0)     // 섭취한 단백질 총량(g)
  waterDone     Boolean @default(false) // 물 3L 달성 여부
  cleanDiet     Boolean @default(false) // 야식 금지 달성 여부

  // 운동 기록
  workoutDone   Boolean @default(false) // 운동 완료 여부
  workoutPart   String? // 그날의 운동 부위 (예: 등/이두)
  memo          String? // 간단 메모
}

// 인바디 측정 기록 (주간)
model InBodyRecord {
  id              Int      @id @default(autoincrement())
  date            DateTime @default(now()) // 측정 날짜
  imagePath       String   // 업로드된 이미지 경로

  // 기본 체성분
  weight          Float    // 체중 (kg)
  skeletalMuscle  Float    // 골격근량 (kg)
  bodyFatMass     Float    // 체지방량 (kg)
  bodyFatPercent  Float    // 체지방률 (%)

  // 비만 지표
  bmi             Float    // BMI
  visceralFat     Int      // 내장지방 레벨

  // 인바디 점수 및 기타
  inbodyScore     Int      // 인바디 점수 (0-100)
  bmr             Int      // 기초대사량 (kcal)

  // 체수분, 단백질, 무기질
  bodyWater       Float?   // 체수분 (L)
  protein         Float?   // 단백질 (kg)
  minerals        Float?   // 무기질 (kg)

  // 부위별 근육 분석 (JSON 문자열로 저장)
  segmentalMuscle String?  // {"leftArm": "표준", "rightArm": "표준", ...}
  segmentalFat    String?  // {"leftArm": "표준이상", ...}

  // AI 분석 결과
  aiAnalysis      String?  // AI가 생성한 분석 및 조언 (JSON)

  createdAt       DateTime @default(now())
}
```

---

## 5. 인바디 이미지 분석 데이터 구조

인바디 측정 결과지 (`public/inbody/inbody.png` 참고)에서 추출할 데이터:

### 체성분분석 (Body Composition Analysis)
| 항목 | 필드명 | 예시값 |
|------|--------|--------|
| 체수분 | bodyWater | 51.1 L |
| 단백질 | protein | 13.9 kg |
| 무기질 | minerals | 4.83 kg |
| 체지방량 | bodyFatMass | 31.3 kg |
| 체중 | weight | 101.1 kg |

### 골격근·지방분석 (Muscle-Fat Analysis)
| 항목 | 필드명 | 예시값 |
|------|--------|--------|
| 골격근량 | skeletalMuscle | 39.8 kg |
| 체지방량 | bodyFatMass | 31.3 kg |

### 비만분석 (Obesity Analysis)
| 항목 | 필드명 | 예시값 |
|------|--------|--------|
| BMI | bmi | 30.2 |
| 체지방률 | bodyFatPercent | 31.0% |

### 기타 지표
| 항목 | 필드명 | 예시값 |
|------|--------|--------|
| 인바디점수 | inbodyScore | 68 |
| 내장지방레벨 | visceralFat | 13 |
| 기초대사량 | bmr | 1877 kcal |
| 복부지방률 | waistHipRatio | 1.00 |

---

## 6. AI 코칭 로직

### 분석 항목
1. **변화 추적**: 이전 측정치 대비 증감 분석
2. **목표 대비 진행률**: 목표 체중/체지방률까지 남은 양
3. **부위별 균형**: 부위별 근육/지방 분포 불균형 체크
4. **건강 위험도**: 내장지방, BMI 기준 경고

### 조언 생성 예시
```json
{
  "summary": "골격근량 0.2kg 증가, 체지방량 1.5kg 감소! 좋은 진행입니다.",
  "highlights": [
    "✅ 골격근량이 39.6kg → 39.8kg으로 증가",
    "✅ 체지방률 32% → 31%로 감소",
    "⚠️ 내장지방 레벨 13으로 여전히 높음"
  ],
  "recommendations": [
    "유산소 운동 시간을 주 3회 → 4회로 증가 권장",
    "하체 근육이 상대적으로 약함 - 스쿼트, 런지 볼륨 증가",
    "내장지방 감소를 위해 공복 유산소 추천"
  ],
  "nextGoal": "다음 주 목표: 체중 100kg 이하, 체지방률 30% 달성"
}
```

---

## 7. UI/UX 디자인 가이드

**`frontend-design` 스킬을 활용하여 다음 원칙 적용:**

### Mobile First Development 원칙
* **기준 해상도**: 375px (iPhone SE) 기준으로 먼저 개발
* **반응형 브레이크포인트**:
    * `sm`: 640px (대형 모바일)
    * `md`: 768px (태블릿)
    * `lg`: 1024px (데스크톱)
* **터치 친화적 UI**:
    * 최소 터치 영역: 44x44px
    * 버튼/토글 간격: 최소 8px
    * 스와이프 제스처 지원
* **모바일 최적화**:
    * 하단 네비게이션 (엄지 손가락 접근성)
    * Safe Area 대응 (노치, 홈 인디케이터)
    * 가로 스크롤 금지, 세로 스크롤 중심
    * 입력 시 키보드 대응 (viewport 조정)

### 디자인 원칙
* **Dark Mode 지원**: 체중계/인바디 측정 시 보통 아침이므로 눈 피로도 감소
* **게이미피케이션**: 퀘스트 완료 시 축하 애니메이션, 연속 달성 스트릭
* **데이터 시각화**: 차트와 프로그레스 바를 통한 직관적 진행률 표시
* **미니멀 입력**: 탭 한 번으로 단백질 추가, 토글로 퀘스트 완료
* **인바디 카드**: 주요 지표를 카드 형태로 한눈에 확인

### 컴포넌트 가이드
* **카드**: 둥근 모서리(radius-lg), 그림자 최소화, 패딩 16px
* **버튼**: 높이 44px 이상, 풀 와이드 우선
* **폰트**: 본문 16px, 제목 20-24px, 서브텍스트 14px
* **색상**: 고대비, 접근성(WCAG AA) 준수
