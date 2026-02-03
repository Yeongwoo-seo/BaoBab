import { NextRequest, NextResponse } from 'next/server'
import { settleOrderDate, deleteOrder } from '@/lib/firebase/orders'

export async function PATCH(
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteOrder(params.id)
    return NextResponse.json({ message: '주문이 삭제되었습니다.' })
  } catch (error: any) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: error.message || '주문 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
