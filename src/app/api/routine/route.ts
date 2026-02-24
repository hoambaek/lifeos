import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

async function ensureTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "RoutineLog" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "date" TEXT NOT NULL,
        "completedItems" TEXT NOT NULL DEFAULT '[]',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "RoutineLog_date_key" ON "RoutineLog"("date")
    `)
  } catch {
    // Table or index may already exist
  }
}

export async function GET(request: Request) {
  await ensureTable()
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  if (!date) {
    return NextResponse.json({ error: 'Date required' }, { status: 400 })
  }

  try {
    const records = await prisma.$queryRawUnsafe<
      Array<{ id: number; date: string; completedItems: string; createdAt: string; updatedAt: string }>
    >(`SELECT * FROM "RoutineLog" WHERE "date" = ?`, date)

    if (!records || records.length === 0) {
      return NextResponse.json({ date, completedItems: [] })
    }

    const record = records[0]
    return NextResponse.json({
      ...record,
      completedItems: JSON.parse(record.completedItems),
    })
  } catch (error) {
    console.error('Failed to fetch routine log:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  await ensureTable()

  try {
    const body = await request.json()
    const { date, completedItems } = body

    if (!date) {
      return NextResponse.json({ error: 'Date required' }, { status: 400 })
    }

    const completedJson = JSON.stringify(completedItems || [])
    const now = new Date().toISOString()

    await prisma.$executeRawUnsafe(
      `INSERT INTO "RoutineLog" ("date", "completedItems", "createdAt", "updatedAt")
       VALUES (?, ?, ?, ?)
       ON CONFLICT("date") DO UPDATE SET
         "completedItems" = excluded."completedItems",
         "updatedAt" = excluded."updatedAt"`,
      date,
      completedJson,
      now,
      now
    )

    return NextResponse.json({ date, completedItems })
  } catch (error) {
    console.error('Failed to save routine log:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
