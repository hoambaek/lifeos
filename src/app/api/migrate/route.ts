import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE DailyLog ADD COLUMN completedExercises TEXT
    `)
    return NextResponse.json({ success: true, message: 'Migration completed' })
  } catch (error: any) {
    if (error.message?.includes('duplicate column')) {
      return NextResponse.json({ success: true, message: 'Column already exists' })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
