import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfDay, endOfDay, format } from 'date-fns'

// GET /api/diet/meals?date=yyyy-MM-dd
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date')
  const target = dateParam ? new Date(dateParam) : new Date()
  const meals = await prisma.mealEntry.findMany({
    where: { date: { gte: startOfDay(target), lte: endOfDay(target) } },
    orderBy: [{ time: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json(
    meals.map((m) => ({
      id: m.id,
      date: format(m.date, 'yyyy-MM-dd'),
      time: m.time,
      menu: m.menu,
      imagePath: m.imagePath,
      notes: m.notes,
    })),
  )
}

// POST /api/diet/meals  { date, time?, menu, imagePath?, notes? }
export async function POST(request: Request) {
  const body = await request.json()
  const { date, time, menu, imagePath, notes } = body
  if (!menu || typeof menu !== 'string' || !menu.trim()) {
    return NextResponse.json({ error: 'menu required' }, { status: 400 })
  }
  const target = date ? new Date(date) : new Date()
  const created = await prisma.mealEntry.create({
    data: {
      date: startOfDay(target),
      time: time ?? null,
      menu: menu.trim(),
      imagePath: imagePath ?? null,
      notes: notes ?? null,
    },
  })
  return NextResponse.json(created)
}

// DELETE /api/diet/meals?id=123
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const idStr = searchParams.get('id')
  if (!idStr) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const id = parseInt(idStr, 10)
  await prisma.mealEntry.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
