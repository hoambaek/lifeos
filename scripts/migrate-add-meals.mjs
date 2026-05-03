// Add MealEntry table.
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

const exists = await client.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='MealEntry'`)
if (exists.rows.length > 0) {
  console.log('MealEntry already exists, skipping.')
} else {
  await client.execute(`CREATE TABLE MealEntry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATETIME NOT NULL,
    time TEXT,
    menu TEXT NOT NULL,
    imagePath TEXT,
    notes TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)
  await client.execute(`CREATE INDEX idx_mealentry_date ON MealEntry(date)`)
  console.log('OK: created MealEntry')
}
