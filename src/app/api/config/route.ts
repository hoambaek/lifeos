import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET: 사용자 설정 조회
export async function GET() {
  try {
    const config = await prisma.userConfig.findFirst()
    return NextResponse.json(config)
  } catch (error) {
    console.error('Failed to fetch config:', error)
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
  }
}

// POST: 사용자 설정 생성/수정
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { startWeight, goalWeight, startDate } = body

    // 기존 설정이 있으면 업데이트, 없으면 생성
    const existingConfig = await prisma.userConfig.findFirst()

    if (existingConfig) {
      const updated = await prisma.userConfig.update({
        where: { id: existingConfig.id },
        data: { startWeight, goalWeight, startDate: new Date(startDate) },
      })
      return NextResponse.json(updated)
    }

    const config = await prisma.userConfig.create({
      data: {
        startWeight,
        goalWeight,
        startDate: new Date(startDate),
      },
    })
    return NextResponse.json(config)
  } catch (error) {
    console.error('Failed to save config:', error)
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 })
  }
}
