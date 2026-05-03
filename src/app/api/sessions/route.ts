import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/sessions?type=diet|business
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  if (type !== 'diet' && type !== 'business') {
    return NextResponse.json({ error: 'type must be diet or business' }, { status: 400 })
  }

  const sessions = await prisma.chatSession.findMany({
    where: { type },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 1, // first message preview
      },
      _count: { select: { messages: true } },
    },
  })

  return NextResponse.json(
    sessions.map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title ?? (s.messages[0]?.content?.slice(0, 40) ?? '새 대화'),
      messageCount: s._count.messages,
      updatedAt: s.updatedAt,
    })),
  )
}

// POST /api/sessions  { type: "diet"|"business", title?: string }
export async function POST(request: Request) {
  const body = await request.json()
  const { type, title } = body
  if (type !== 'diet' && type !== 'business') {
    return NextResponse.json({ error: 'type must be diet or business' }, { status: 400 })
  }
  const session = await prisma.chatSession.create({
    data: { type, title: title ?? null },
  })
  return NextResponse.json(session)
}
