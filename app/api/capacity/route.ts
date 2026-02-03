import { NextRequest, NextResponse } from 'next/server'
import { getCapacities, updateCapacity } from '@/lib/firebase/dailyCapacity'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dates = searchParams.get('dates')?.split(',') || []

    if (dates.length === 0) {
      return NextResponse.json({ error: '날짜가 필요합니다.' }, { status: 400 })
    }

    // Firebase 설정 확인
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      // Firebase 설정이 없으면 기본값 반환
      const defaultCapacities = dates.map((date) => ({
        id: '',
        date,
        max_capa: 30,
        current_order_count: 0,
        is_closed: false,
        created_at: '',
        updated_at: '',
      }))
      return NextResponse.json(defaultCapacities)
    }

    // orders 컬렉션에서 직접 계산
    const capacities = await getCapacities(dates)
    return NextResponse.json(capacities)
  } catch (error: any) {
    console.error('Error in GET /api/capacity:', error)
    // 에러 발생 시 기본값 반환
    const dates = new URL(request.url).searchParams.get('dates')?.split(',') || []
    const defaultCapacities = dates.map((date) => ({
      id: '',
      date,
      max_capa: 30,
      current_order_count: 0,
      is_closed: false,
      created_at: '',
      updated_at: '',
    }))
    return NextResponse.json(defaultCapacities)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, max_capa, is_closed } = body

    if (!date) {
      return NextResponse.json({ error: '날짜가 필요합니다.' }, { status: 400 })
    }

    const updates: any = {}
    if (max_capa !== undefined) updates.max_capa = max_capa
    if (is_closed !== undefined) updates.is_closed = is_closed

    await updateCapacity(date, updates)

    const { getCapacity } = await import('@/lib/firebase/dailyCapacity')
    const result = await getCapacity(date)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
