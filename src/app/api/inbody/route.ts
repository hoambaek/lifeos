import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// GET: 인바디 기록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const latest = searchParams.get('latest')

    // 특정 ID 조회
    if (id) {
      const record = await prisma.inBodyRecord.findUnique({
        where: { id: parseInt(id) },
      })
      return NextResponse.json(record)
    }

    // 최신 기록 조회
    if (latest === 'true') {
      const record = await prisma.inBodyRecord.findFirst({
        orderBy: { date: 'desc' },
      })
      return NextResponse.json(record)
    }

    // 전체 기록 조회 (최신순)
    const records = await prisma.inBodyRecord.findMany({
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('Failed to fetch inbody records:', error)
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
  }
}

// POST: 인바디 기록 생성
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null
    const dataString = formData.get('data') as string | null

    if (!dataString) {
      return NextResponse.json({ error: 'Data is required' }, { status: 400 })
    }

    const data = JSON.parse(dataString)
    let imagePath = data.imagePath || ''

    // 파일 업로드 처리
    if (file) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // 파일명 생성 (timestamp + 원본 파일명)
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name}`
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'inbody')
      const uploadPath = path.join(uploadDir, fileName)

      // 업로드 디렉토리가 없으면 생성
      await mkdir(uploadDir, { recursive: true })

      await writeFile(uploadPath, buffer)
      imagePath = `/uploads/inbody/${fileName}`
    }

    // DB에 기록 저장
    const record = await prisma.inBodyRecord.create({
      data: {
        date: data.date ? new Date(data.date) : new Date(),
        imagePath,
        weight: data.weight,
        skeletalMuscle: data.skeletalMuscle,
        bodyFatMass: data.bodyFatMass,
        bodyFatPercent: data.bodyFatPercent,
        bmi: data.bmi,
        visceralFat: data.visceralFat,
        inbodyScore: data.inbodyScore,
        bmr: data.bmr,
        bodyWater: data.bodyWater,
        protein: data.protein,
        minerals: data.minerals,
        segmentalMuscle: data.segmentalMuscle ? JSON.stringify(data.segmentalMuscle) : null,
        segmentalFat: data.segmentalFat ? JSON.stringify(data.segmentalFat) : null,
        aiAnalysis: data.aiAnalysis ? JSON.stringify(data.aiAnalysis) : null,
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Failed to create inbody record:', error)
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
  }
}
