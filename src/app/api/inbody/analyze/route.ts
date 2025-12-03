import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File

    if (!image) {
      return NextResponse.json({ error: '이미지가 필요합니다' }, { status: 400 })
    }

    // 이미지를 base64로 변환
    const bytes = await image.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = image.type || 'image/jpeg'

    // Gemini Vision 모델 사용
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `이 이미지는 인바디(InBody) 체성분 분석 결과지입니다.
이미지에서 다음 수치들을 정확하게 추출해주세요.
숫자만 추출하고, 단위는 제외해주세요.
찾을 수 없는 항목은 null로 표시해주세요.

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):

{
  "weight": 체중(kg),
  "skeletalMuscle": 골격근량(kg),
  "bodyFatMass": 체지방량(kg),
  "bodyFatPercent": 체지방률(%),
  "bmi": BMI,
  "visceralFat": 내장지방레벨,
  "inbodyScore": 인바디점수,
  "bmr": 기초대사량(kcal),
  "bodyWater": 체수분(L),
  "protein": 단백질(kg),
  "minerals": 무기질(kg)
}

예시 응답:
{
  "weight": 101.1,
  "skeletalMuscle": 39.8,
  "bodyFatMass": 31.3,
  "bodyFatPercent": 31.0,
  "bmi": 30.2,
  "visceralFat": 13,
  "inbodyScore": 68,
  "bmr": 1877,
  "bodyWater": 51.1,
  "protein": 13.9,
  "minerals": 4.83
}`

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType,
        },
      },
      prompt,
    ])

    const response = await result.response
    const text = response.text()

    // JSON 파싱 시도
    try {
      // JSON 블록 추출 (마크다운 코드블록 처리)
      let jsonStr = text
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim()
      } else {
        // JSON 객체 직접 찾기
        const objectMatch = text.match(/\{[\s\S]*\}/)
        if (objectMatch) {
          jsonStr = objectMatch[0]
        }
      }

      const parsedData = JSON.parse(jsonStr)

      return NextResponse.json({
        success: true,
        data: parsedData,
      })
    } catch (parseError) {
      console.error('JSON 파싱 실패:', text)
      return NextResponse.json({
        success: false,
        error: 'AI 응답 파싱 실패',
        rawResponse: text,
      }, { status: 422 })
    }
  } catch (error) {
    console.error('인바디 분석 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }, { status: 500 })
  }
}
