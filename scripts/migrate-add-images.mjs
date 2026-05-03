// Add imagePaths column to ChatMessage (JSON-encoded array of /uploads/... paths).
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

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const cols = await client.execute(`PRAGMA table_info(ChatMessage)`)
const has = cols.rows.some((r) => r.name === 'imagePaths')
if (has) {
  console.log('imagePaths column already exists, skipping.')
} else {
  await client.execute(`ALTER TABLE ChatMessage ADD COLUMN imagePaths TEXT`)
  console.log('OK: added imagePaths column')
}
