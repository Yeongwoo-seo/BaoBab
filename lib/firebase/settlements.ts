import { getDb } from '@/lib/firebase'
import { Timestamp, writeBatch, doc } from 'firebase/firestore'
import { Order, OrderSettlement } from '@/types'
import { getOrders } from './orders'

/**
 * 특정 날짜의 모든 주문 정산 처리
 */
export async function settleAllOrdersByDate(date: string): Promise<void> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error('Firebase is not configured')
  }

  const db = getDb()
  const batch = writeBatch(db)

  // 해당 날짜의 주문 조회
  const orders = await getOrders({
    startDate: date,
    endDate: date,
  })

  // settlements 배열에 해당 날짜가 있는 주문만 필터링
  const ordersToSettle = orders.filter((order) =>
    order.settlements?.some((s) => s.date === date && !s.is_settled)
  )

  ordersToSettle.forEach((order) => {
    const orderRef = doc(db, 'orders', order.id)
    
    // settlements 배열 업데이트
    const settlements: OrderSettlement[] = order.settlements.map((s) =>
      s.date === date ? { date: s.date, is_settled: true } : s
    )

    batch.update(orderRef, {
      settlements: settlements,
      updated_at: Timestamp.now(),
    })
  })

  await batch.commit()
}
