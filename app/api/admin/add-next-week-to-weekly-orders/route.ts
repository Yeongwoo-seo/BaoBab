import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { collection, getDocs, doc, updateDoc, writeBatch, Timestamp, query, where } from 'firebase/firestore'

/**
 * 기존 정기 주문(is_weekly_order: true)의 날짜를 이번 주 + 다음 주만 남기고 나머지 삭제하는 API
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      return NextResponse.json({ error: 'Firebase is not configured' }, { status: 500 })
    }

    const db = getDb()
    
    // orders 컬렉션에서 is_weekly_order가 true인 주문들 조회
    const ordersRef = collection(db, 'orders')
    const ordersQuery = query(ordersRef, where('is_weekly_order', '==', true))
    const ordersSnapshot = await getDocs(ordersQuery)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 다음 주 월요일 계산
    const dayOfWeek = today.getDay()
    const daysUntilMonday = (8 - dayOfWeek) % 7 || 7
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + daysUntilMonday)
    nextMonday.setHours(0, 0, 0, 0)
    
    // 다다음 주 금요일 계산 (다음 주 월요일 + 11일 = 다다음 주 금요일)
    const weekAfterNextFriday = new Date(nextMonday)
    weekAfterNextFriday.setDate(nextMonday.getDate() + 11) // 월요일 + 11일 = 다다음 주 금요일
    weekAfterNextFriday.setHours(0, 0, 0, 0)
    
    // 이번 주 월요일 계산 (다음 주 월요일 - 7일)
    const thisMonday = new Date(nextMonday)
    thisMonday.setDate(nextMonday.getDate() - 7)
    thisMonday.setHours(0, 0, 0, 0)

    let updatedCount = 0
    const ordersToUpdate: Array<{ id: string; settlements: any[] }> = []

    ordersSnapshot.forEach((orderDoc) => {
      const orderData = orderDoc.data()
      const settlements = orderData.settlements || []
      
      if (settlements.length === 0) {
        return // settlements가 없으면 스킵
      }

      // 이번 주와 다음 주 범위 내의 날짜만 필터링
      const validSettlements = settlements.filter((settlement: any) => {
        const dateStr = settlement.date
        if (!dateStr || typeof dateStr !== 'string') {
          return false
        }

        const [year, month, day] = dateStr.split('-').map(Number)
        const settlementDate = new Date(year, month - 1, day)
        settlementDate.setHours(0, 0, 0, 0)

        // 이번 주 월요일부터 다다음 주 금요일까지의 날짜만 유지
        return settlementDate >= thisMonday && settlementDate <= weekAfterNextFriday
      })

      // 변경사항이 있는지 확인
      if (validSettlements.length === settlements.length) {
        // 모든 날짜가 유효 범위 내에 있으면 스킵
        return
      }

      // 날짜순으로 정렬
      validSettlements.sort((a: any, b: any) => {
        return a.date.localeCompare(b.date)
      })

      ordersToUpdate.push({
        id: orderDoc.id,
        settlements: validSettlements,
      })
      
      updatedCount++
      console.log(`주문 ${orderDoc.id}: ${settlements.length}개 날짜 -> ${validSettlements.length}개 날짜 (${settlements.length - validSettlements.length}개 삭제)`)
    })

    // 배치로 업데이트 (500개씩)
    for (let i = 0; i < ordersToUpdate.length; i += 500) {
      const batch = writeBatch(db)
      const batchOrders = ordersToUpdate.slice(i, i + 500)
      
      batchOrders.forEach((order) => {
        const orderRef = doc(db, 'orders', order.id)
        batch.update(orderRef, {
          settlements: order.settlements,
          updated_at: Timestamp.now(),
        })
      })
      
      await batch.commit()
    }

    // customer 컬렉션도 업데이트
    const customerRef = collection(db, 'customer')
    const customerSnapshot = await getDocs(customerRef)
    let customerUpdatedCount = 0
    const customersToUpdate: Array<{ id: string; orders: any[] }> = []

    customerSnapshot.forEach((customerDoc) => {
      const customerData = customerDoc.data()
      const orders = customerData.orders || []
      let hasChanges = false
      
      const updatedOrders = orders.map((order: any) => {
        if (!order.is_weekly_order) {
          return order // 정기 주문이 아니면 그대로 반환
        }

        const settlements = order.settlements || []
        if (settlements.length === 0) {
          return order
        }

        // 이번 주와 다음 주 범위 내의 날짜만 필터링
        const validSettlements = settlements.filter((settlement: any) => {
          const dateStr = settlement.date
          if (!dateStr || typeof dateStr !== 'string') {
            return false
          }

          const [year, month, day] = dateStr.split('-').map(Number)
          const settlementDate = new Date(year, month - 1, day)
          settlementDate.setHours(0, 0, 0, 0)

          // 이번 주 월요일부터 다다음 주 금요일까지의 날짜만 유지
          return settlementDate >= thisMonday && settlementDate <= weekAfterNextFriday
        })

        // 변경사항이 있는지 확인
        if (validSettlements.length === settlements.length) {
          return order // 변경사항 없음
        }

        // 날짜순으로 정렬
        validSettlements.sort((a: any, b: any) => {
          return a.date.localeCompare(b.date)
        })

        hasChanges = true
        customerUpdatedCount++
        
        return {
          ...order,
          settlements: validSettlements,
        }
      })

      if (hasChanges) {
        customersToUpdate.push({
          id: customerDoc.id,
          orders: updatedOrders,
        })
      }
    })

    // 배치로 업데이트 (500개씩)
    for (let i = 0; i < customersToUpdate.length; i += 500) {
      const customerBatch = writeBatch(db)
      const batchCustomers = customersToUpdate.slice(i, i + 500)
      
      batchCustomers.forEach((customer) => {
        const customerDocRef = doc(db, 'customer', customer.id)
        customerBatch.update(customerDocRef, {
          orders: customer.orders,
          updated_at: Timestamp.now(),
        })
      })
      
      await customerBatch.commit()
    }

    return NextResponse.json({
      message: '기존 정기 주문을 이번 주 + 다음 주 + 다다음 주 날짜만 남기고 나머지 삭제 완료',
      ordersUpdated: updatedCount,
      customerOrdersUpdated: customerUpdatedCount,
      totalUpdated: updatedCount + customerUpdatedCount,
    })
  } catch (error: any) {
    console.error('Error adding next week dates to weekly orders:', error)
    return NextResponse.json(
      { error: error.message || '날짜 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
