// 스위치온 다이어트로 롤백:
// - 신규 식이 트래킹 테이블 (DietProfile, FastingSession, MealEntry, 새 DietLog) 제거
// - 옛 스위치온 테이블 (DietConfig, DietPlan, DietLog, DietRule) 복원
// - ChatSession/ChatMessage는 Coach가 사용하므로 보존
// 실행: node scripts/migrate-rollback-switchon.mjs

import { createClient } from '@libsql/client'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnv(file) {
  try {
    const text = readFileSync(resolve(__dirname, '..', file), 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/)
      if (!m) continue
      const [, k, vRaw] = m
      const v = vRaw.replace(/^["']|["']$/g, '')
      if (!process.env[k]) process.env[k] = v
    }
  } catch {}
}
loadEnv('.env')
loadEnv('.env.local')

if (!process.env.TURSO_DATABASE_URL) {
  console.error('TURSO_DATABASE_URL not set')
  process.exit(1)
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const stmts = [
  // 신규 다이어트 테이블 삭제
  `DROP TABLE IF EXISTS DietProfile`,
  `DROP TABLE IF EXISTS FastingSession`,
  `DROP TABLE IF EXISTS MealEntry`,
  `DROP TABLE IF EXISTS DietLog`,
  // 혹시 남아있을 옛 테이블도 정리 후 재생성
  `DROP TABLE IF EXISTS DietConfig`,
  `DROP TABLE IF EXISTS DietPlan`,
  `DROP TABLE IF EXISTS DietRule`,

  `CREATE TABLE DietConfig (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    startDate DATETIME NOT NULL,
    currentWeek INTEGER NOT NULL DEFAULT 1,
    currentPhase TEXT NOT NULL DEFAULT 'fat_burning',
    isActive INTEGER NOT NULL DEFAULT 1,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL
  )`,

  `CREATE TABLE DietPlan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dayNumber INTEGER NOT NULL,
    week INTEGER NOT NULL,
    dayOfWeek INTEGER NOT NULL,
    breakfast TEXT NOT NULL,
    breakfastTime TEXT NOT NULL DEFAULT '08:00-09:00',
    lunch TEXT NOT NULL,
    lunchTime TEXT NOT NULL DEFAULT '13:00-14:00',
    snack TEXT,
    snackTime TEXT DEFAULT '15:30-16:30',
    dinner TEXT NOT NULL,
    dinnerTime TEXT NOT NULL DEFAULT '18:00-19:00',
    isFastingDay INTEGER NOT NULL DEFAULT 0,
    weekNotes TEXT,
    allowedFoods TEXT,
    forbiddenFoods TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX idx_dietplan_week_dayofweek ON DietPlan(week, dayOfWeek)`,

  `CREATE TABLE DietLog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATETIME NOT NULL,
    dayNumber INTEGER NOT NULL,
    week INTEGER NOT NULL,
    breakfastMenu TEXT,
    lunchMenu TEXT,
    dinnerMenu TEXT,
    breakfastDone INTEGER NOT NULL DEFAULT 0,
    lunchDone INTEGER NOT NULL DEFAULT 0,
    snackDone INTEGER NOT NULL DEFAULT 0,
    dinnerDone INTEGER NOT NULL DEFAULT 0,
    fastingComplete INTEGER NOT NULL DEFAULT 0,
    sleepHours REAL,
    waterCups INTEGER NOT NULL DEFAULT 0,
    exerciseDone INTEGER NOT NULL DEFAULT 0,
    noAlcohol INTEGER NOT NULL DEFAULT 1,
    noFlour INTEGER NOT NULL DEFAULT 1,
    noSugar INTEGER NOT NULL DEFAULT 1,
    memo TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX idx_dietlog_date ON DietLog(date)`,

  `CREATE TABLE DietRule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ruleNumber INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT,
    isActive INTEGER NOT NULL DEFAULT 1,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX idx_dietrule_number ON DietRule(ruleNumber)`,
]

for (const sql of stmts) {
  await client.execute(sql)
  console.log('OK:', sql.replace(/\s+/g, ' ').slice(0, 80))
}

const tables = await client.execute(
  `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
)
console.log('\nTables now:')
for (const r of tables.rows) console.log(' -', r.name)
