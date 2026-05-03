import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/sessions/[id] -> session + messages
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const sessionId = parseInt(id, 10)
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(session)
}

// DELETE /api/sessions/[id]
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const sessionId = parseInt(id, 10)
  await prisma.chatSession.delete({ where: { id: sessionId } })
  return NextResponse.json({ ok: true })
}
