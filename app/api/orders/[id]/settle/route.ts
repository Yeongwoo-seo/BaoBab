import { NextRequest, NextResponse } from 'next/server'
import { settleOrderDate } from '@/lib/firebase/orders'

/**
 * 특정 주문의 특정 날짜 정산 처리
 * POST /api/orders/[id]/settle
 * Body: { date: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { date } = body

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 })
    }

    const order = await settleOrderDate(params.id, date)
    return NextResponse.json(order)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
