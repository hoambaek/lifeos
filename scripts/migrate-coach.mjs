// Drop old diet tables (DietConfig/DietPlan/DietLog/DietRule) and rebuild
// with freedom-plan-based DietProfile + DietLog + ChatSession + ChatMessage.
// Run: node scripts/migrate-coach.mjs

import { createClient } from '@libsql/client'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env (TURSO_DATABASE_URL / TURSO_AUTH_TOKEN)
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
  `DROP TABLE IF EXISTS DietRule`,
  `DROP TABLE IF EXISTS DietPlan`,
  `DROP TABLE IF EXISTS DietConfig`,
  `DROP TABLE IF EXISTS DietLog`,
  `DROP TABLE IF EXISTS ChatMessage`,
  `DROP TABLE IF EXISTS ChatSession`,
  `DROP TABLE IF EXISTS DietProfile`,

  `CREATE TABLE DietProfile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    boosterStartDate DATETIME,
    luxuryStart DATETIME,
    luxuryEnd DATETIME,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL
  )`,

  `CREATE TABLE DietLog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATETIME NOT NULL,
    phase TEXT NOT NULL,
    fastingStart TEXT,
    fastingEnd TEXT,
    fasting24 INTEGER NOT NULL DEFAULT 0,
    proteinG INTEGER NOT NULL DEFAULT 0,
    waterMl INTEGER NOT NULL DEFAULT 0,
    sleepHours REAL,
    hotelMeeting INTEGER NOT NULL DEFAULT 0,
    wineTasting INTEGER NOT NULL DEFAULT 0,
    travel INTEGER NOT NULL DEFAULT 0,
    businessDinner INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX idx_dietlog_date ON DietLog(date)`,

  `CREATE TABLE ChatSession (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL
  )`,

  `CREATE TABLE ChatMessage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sessionId) REFERENCES ChatSession(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX idx_chatmessage_session ON ChatMessage(sessionId)`,
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
