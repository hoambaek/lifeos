import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const profile = await prisma.dietProfile.findFirst({ orderBy: { id: 'desc' } })
  return NextResponse.json(profile)
}

// POST { boosterStartDate?: string|null, luxuryStart?: string|null, luxuryEnd?: string|null }
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = {
      boosterStartDate: body.boosterStartDate ? new Date(body.boosterStartDate) : null,
      luxuryStart: body.luxuryStart ? new Date(body.luxuryStart) : null,
      luxuryEnd: body.luxuryEnd ? new Date(body.luxuryEnd) : null,
    }

    const existing = await prisma.dietProfile.findFirst({ orderBy: { id: 'desc' } })
    const saved = existing
      ? await prisma.dietProfile.update({ where: { id: existing.id }, data })
      : await prisma.dietProfile.create({ data })

    return NextResponse.json(saved)
  } catch (e) {
    console.error('POST /api/diet/profile failed:', e)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}
