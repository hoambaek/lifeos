import { prisma } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { buildDietSystemPrompt, buildBusinessSystemPrompt } from '@/lib/coach-prompts'
import { computeWeekAndDay } from '@/lib/diet-guide'

export const runtime = 'nodejs'
export const maxDuration = 60

type ImageBlock = {
  type: 'image'
  source: { type: 'base64'; media_type: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'; data: string }
}
type TextBlock = { type: 'text'; text: string }
type ContentBlock = TextBlock | ImageBlock

const MIME_BY_EXT: Record<string, ImageBlock['source']['media_type']> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
}

async function pathToImageBlock(publicPath: string): Promise<ImageBlock | null> {
  // publicPath e.g. "/uploads/abc.png"
  const safe = publicPath.replace(/^\/+/, '')
  if (!safe.startsWith('uploads/')) return null
  const ext = safe.split('.').pop()?.toLowerCase() ?? ''
  const mime = MIME_BY_EXT[ext]
  if (!mime) return null
  try {
    const buf = await readFile(join(process.cwd(), 'public', safe))
    return {
      type: 'image',
      source: { type: 'base64', media_type: mime, data: buf.toString('base64') },
    }
  } catch (e) {
    console.error('Failed to read image:', publicPath, e)
    return null
  }
}

async function buildContent(text: string, imagePaths: string[] | null | undefined): Promise<string | ContentBlock[]> {
  if (!imagePaths || imagePaths.length === 0) return text
  const imageBlocks: ImageBlock[] = []
  for (const p of imagePaths) {
    const block = await pathToImageBlock(p)
    if (block) imageBlocks.push(block)
  }
  if (imageBlocks.length === 0) return text
  return [...imageBlocks, { type: 'text', text: text || '이 이미지를 분석해주세요.' }]
}

// POST /api/coach  { sessionId: number, content: string, imagePaths?: string[] }
export async function POST(request: Request) {
  const body = await request.json()
  const { sessionId, content, imagePaths } = body as {
    sessionId: number
    content: string
    imagePaths?: string[]
  }
  if (!sessionId || (!content && !imagePaths?.length)) {
    return new Response(JSON.stringify({ error: 'sessionId and content (or imagePaths) required' }), { status: 400 })
  }

  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
  if (!session) return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404 })

  // Save user message (with imagePaths JSON if any)
  await prisma.chatMessage.create({
    data: {
      sessionId,
      role: 'user',
      content: content ?? '',
      imagePaths: imagePaths?.length ? JSON.stringify(imagePaths) : null,
    },
  })

  // Build system prompt
  let systemPrompt: string
  if (session.type === 'diet') {
    const today = new Date()
    const config = await prisma.dietConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    const todayLog = await prisma.dietLog.findFirst({
      where: { date: { gte: startOfDay(today), lte: endOfDay(today) } },
    })
    const recentLogs = await prisma.dietLog.findMany({
      where: { date: { gte: startOfDay(subDays(today, 7)), lt: startOfDay(today) } },
      orderBy: { date: 'desc' },
    })
    const guide = config
      ? computeWeekAndDay(new Date(config.startDate), today)
      : null
    systemPrompt = buildDietSystemPrompt({
      config: config
        ? {
            startDate: format(config.startDate, 'yyyy-MM-dd'),
            currentWeek: config.currentWeek,
            currentPhase: config.currentPhase,
          }
        : null,
      guide,
      todayLog: todayLog
        ? {
            dayNumber: todayLog.dayNumber,
            week: todayLog.week,
            breakfastDone: todayLog.breakfastDone,
            lunchDone: todayLog.lunchDone,
            snackDone: todayLog.snackDone,
            dinnerDone: todayLog.dinnerDone,
            fastingComplete: todayLog.fastingComplete,
            sleepHours: todayLog.sleepHours,
            waterCups: todayLog.waterCups,
            exerciseDone: todayLog.exerciseDone,
            noAlcohol: todayLog.noAlcohol,
            noFlour: todayLog.noFlour,
            noSugar: todayLog.noSugar,
            memo: todayLog.memo,
          }
        : null,
      recentLogs: recentLogs.map((l) => ({
        date: format(l.date, 'yyyy-MM-dd'),
        week: l.week,
        dayNumber: l.dayNumber,
        breakfastDone: l.breakfastDone,
        lunchDone: l.lunchDone,
        dinnerDone: l.dinnerDone,
        fastingComplete: l.fastingComplete,
        waterCups: l.waterCups,
      })),
    })
  } else {
    systemPrompt = buildBusinessSystemPrompt()
  }

  // Build Claude messages: history (with images if recorded) + new user content
  const apiMessages: { role: 'user' | 'assistant'; content: string | ContentBlock[] }[] = []
  for (const m of session.messages) {
    let imgs: string[] | null = null
    const raw = (m as { imagePaths?: string | null }).imagePaths
    if (raw) {
      try { imgs = JSON.parse(raw) } catch { imgs = null }
    }
    apiMessages.push({
      role: m.role as 'user' | 'assistant',
      content: await buildContent(m.content, imgs),
    })
  }
  apiMessages.push({
    role: 'user',
    content: await buildContent(content ?? '', imagePaths),
  })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const encoder = new TextEncoder()
  let assistantText = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const apiStream = client.messages.stream({
          model: 'claude-opus-4-5',
          max_tokens: 1024,
          system: systemPrompt,
          messages: apiMessages,
        })

        for await (const event of apiStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            assistantText += event.delta.text
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }

        await prisma.chatMessage.create({
          data: { sessionId, role: 'assistant', content: assistantText },
        })
        const updateData: { updatedAt: Date; title?: string } = { updatedAt: new Date() }
        if (!session.title && session.messages.length === 0) {
          updateData.title = (content || '[이미지 분석]').slice(0, 40)
        }
        await prisma.chatSession.update({ where: { id: sessionId }, data: updateData })

        controller.close()
      } catch (e) {
        console.error('Coach stream error:', e)
        const msg = e instanceof Error ? e.message : 'Unknown error'
        controller.enqueue(encoder.encode(`\n\n[ERROR] ${msg}`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  })
}
