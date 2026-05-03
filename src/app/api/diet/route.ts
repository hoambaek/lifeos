import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'
import { computePhase } from '@/lib/diet-phase'

// GET /api/diet?date=yyyy-MM-dd  -> { log, profile, phase, recent }
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const target = dateParam ? new Date(dateParam) : new Date()
    const dayStart = startOfDay(target)
    const dayEnd = endOfDay(target)

    const profile = await prisma.dietProfile.findFirst({ orderBy: { id: 'desc' } })

    const log = await prisma.dietLog.findFirst({
      where: { date: { gte: dayStart, lte: dayEnd } },
    })

    const phase = computePhase({
      date: target,
      boosterStartDate: profile?.boosterStartDate ?? null,
      luxuryStart: profile?.luxuryStart ?? null,
      luxuryEnd: profile?.luxuryEnd ?? null,
    })

    const recentSince = startOfDay(subDays(target, 7))
    const recent = await prisma.dietLog.findMany({
      where: { date: { gte: recentSince, lt: dayStart } },
      orderBy: { date: 'desc' },
      take: 7,
    })

    return NextResponse.json({
      log,
      profile,
      phase,
      recent: recent.map((r) => ({
        date: format(r.date, 'yyyy-MM-dd'),
        phase: r.phase,
        proteinG: r.proteinG,
        waterMl: r.waterMl,
        fasting24: r.fasting24,
      })),
    })
  } catch (e) {
    console.error('GET /api/diet failed:', e)
    return NextResponse.json({ error: 'Failed to fetch diet log' }, { status: 500 })
  }
}

// POST /api/diet  -> upsert log
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      date,
      phase,
      fastingStart,
      fastingEnd,
      fasting24,
      proteinG,
      waterMl,
      sleepHours,
      hotelMeeting,
      wineTasting,
      travel,
      businessDinner,
      notes,
    } = body

    const target = date ? new Date(date) : new Date()
    const dayStart = startOfDay(target)
    const dayEnd = endOfDay(target)

    const existing = await prisma.dietLog.findFirst({
      where: { date: { gte: dayStart, lte: dayEnd } },
    })

    const data = {
      phase: phase ?? 'maintenance',
      fastingStart: fastingStart ?? null,
      fastingEnd: fastingEnd ?? null,
      fasting24: !!fasting24,
      proteinG: proteinG ?? 0,
      waterMl: waterMl ?? 0,
      sleepHours: sleepHours ?? null,
      hotelMeeting: !!hotelMeeting,
      wineTasting: !!wineTasting,
      travel: !!travel,
      businessDinner: !!businessDinner,
      notes: notes ?? null,
    }

    const saved = existing
      ? await prisma.dietLog.update({ where: { id: existing.id }, data })
      : await prisma.dietLog.create({ data: { date: dayStart, ...data } })

    return NextResponse.json(saved)
  } catch (e) {
    console.error('POST /api/diet failed:', e)
    return NextResponse.json({ error: 'Failed to save diet log' }, { status: 500 })
  }
}
