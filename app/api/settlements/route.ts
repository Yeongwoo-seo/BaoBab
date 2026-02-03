import { NextRequest, NextResponse } from 'next/server'
import { settleAllOrdersByDate } from '@/lib/firebase/settlements'
import { getOrders } from '@/lib/firebase/orders'

/**
 * GET: 날짜별 정산 통계 조회
 * Query params:
 * - date: 특정 날짜의 정산 통계
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 })
    }

    // 해당 날짜의 주문 조회
    const orders = await getOrders({
      startDate: date,
      endDate: date,
    })

    // settlements 배열에 해당 날짜가 있는 주문만 필터링
    const ordersForDate = orders.filter((order) =>
      order.settlements?.some((s) => s.date === date)
    )

    // 통계 계산
    const totalOrders = ordersForDate.length
    const settledOrders = ordersForDate.filter((order) =>
      order.settlements?.some((s) => s.date === date && s.is_settled)
    ).length
    const unsettledOrders = totalOrders - settledOrders

    const locationBreakdown = {
      'Kings Park': ordersForDate.filter((o) => o.location === 'Kings Park').length,
      'Eastern Creek': ordersForDate.filter((o) => o.location === 'Eastern Creek').length,
    }

    return NextResponse.json({
      date,
      total_orders: totalOrders,
      settled_orders: settledOrders,
      unsettled_orders: unsettledOrders,
      location_breakdown: locationBreakdown,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH: 특정 날짜의 모든 주문 정산 처리
 * Body: { date: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { date } = body

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 })
    }

    await settleAllOrdersByDate(date)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
