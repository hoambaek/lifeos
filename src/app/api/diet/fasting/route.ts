import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { FASTING_PRESETS, presetById, type FastingPreset } from '@/lib/fasting-presets'

// GET /api/diet/fasting -> { active: { ... } | null, recent: [...] }
export async function GET() {
  const active = await prisma.fastingSession.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: 'desc' },
  })
  const recent = await prisma.fastingSession.findMany({
    where: { endedAt: { not: null } },
    orderBy: { startedAt: 'desc' },
    take: 5,
  })
  return NextResponse.json({ active, recent, presets: FASTING_PRESETS })
}

// POST /api/diet/fasting/start  body: { preset: "14h"|"18h"|"24h" }
// (we use a single route with action in body for simplicity)
export async function POST(request: Request) {
  const body = await request.json()
  const action: 'start' | 'stop' = body.action
  if (action === 'start') {
    const preset = body.preset as FastingPreset
    const def = presetById(preset)
    if (!def) return NextResponse.json({ error: 'invalid preset' }, { status: 400 })

    // Auto-end any active session before starting new one
    await prisma.fastingSession.updateMany({
      where: { endedAt: null },
      data: { endedAt: new Date() },
    })

    const session = await prisma.fastingSession.create({
      data: {
        preset: def.id,
        targetHours: def.hours,
        startedAt: new Date(),
      },
    })
    return NextResponse.json(session)
  }

  if (action === 'stop') {
    const active = await prisma.fastingSession.findFirst({
      where: { endedAt: null },
      orderBy: { startedAt: 'desc' },
    })
    if (!active) return NextResponse.json({ error: 'no active session' }, { status: 404 })
    const now = new Date()
    const elapsedH = (now.getTime() - active.startedAt.getTime()) / (1000 * 60 * 60)
    const updated = await prisma.fastingSession.update({
      where: { id: active.id },
      data: { endedAt: now, completed: elapsedH >= active.targetHours },
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
