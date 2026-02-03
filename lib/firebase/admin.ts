import { getDb } from '@/lib/firebase'
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'
import { WeeklySummary } from '@/types'
import { startOfWeek, endOfWeek, format, parseISO } from 'date-fns'
import { getOrders } from './orders'

/**
 * 관리자 대시보드 요약 데이터
 */
export async function getWeeklySummary(): Promise<WeeklySummary> {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  // 이번 주 주문 조회
  const orders = await getOrders({
    startDate: weekStart.toISOString(),
    endDate: weekEnd.toISOString(),
  })

  // 요일별 집계
  const ordersByDay: Record<string, number> = {
    월: 0,
    화: 0,
    수: 0,
    목: 0,
    금: 0,
  }

  orders.forEach((order) => {
    order.settlements?.forEach((settlement) => {
      const date = parseISO(settlement.date)
      const dayIndex = date.getDay()
      const dayMap: Record<number, string> = {
        1: '월',
        2: '화',
        3: '수',
        4: '목',
        5: '금',
      }
      const day = dayMap[dayIndex]
      if (day) {
        ordersByDay[day] = (ordersByDay[day] || 0) + 1
      }
    })
  })

  // 금일 배송 수량
  const today = format(now, 'yyyy-MM-dd')
  const todayOrders = orders.filter((order) =>
    order.settlements?.some((settlement) => settlement.date === today)
  )

  const todayDelivery = {
    total: todayOrders.length,
    kingsPark: todayOrders.filter((o) => o.location === 'Kings Park').length,
    easternCreek: todayOrders.filter((o) => o.location === 'Eastern Creek').length,
  }

  const summary: WeeklySummary = {
    totalOrders: orders.length,
    expectedRevenue: orders.length,
    ordersByDay: Object.entries(ordersByDay).map(([day, count]) => ({ day, count })),
    todayDelivery,
  }

  return summary
}
