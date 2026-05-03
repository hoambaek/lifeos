// Add FastingSession table for interval fasting presets.
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
loadEnv('.env'); loadEnv('.env.local')

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const exists = await client.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='FastingSession'`)
if (exists.rows.length > 0) {
  console.log('FastingSession already exists, skipping.')
} else {
  await client.execute(`CREATE TABLE FastingSession (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    preset TEXT NOT NULL,
    targetHours REAL NOT NULL,
    startedAt DATETIME NOT NULL,
    endedAt DATETIME,
    completed INTEGER NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)
  await client.execute(`CREATE INDEX idx_fastingsession_startedAt ON FastingSession(startedAt)`)
  console.log('OK: created FastingSession')
}
