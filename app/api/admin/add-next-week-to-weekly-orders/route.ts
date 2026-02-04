import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { collection, getDocs, doc, updateDoc, writeBatch, Timestamp, query, where } from 'firebase/firestore'
import { getWeeklyRecurringDates } from '@/lib/utils'

/**
 * 기존 정기 주문(is_weekly_order: true)에 다음 주 날짜를 추가하는 API
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

    let updatedCount = 0
    const ordersToUpdate: Array<{ id: string; settlements: any[] }> = []

    ordersSnapshot.forEach((orderDoc) => {
      const orderData = orderDoc.data()
      const settlements = orderData.settlements || []
      
      if (settlements.length === 0) {
        return // settlements가 없으면 스킵
      }

      // 현재 settlements의 날짜들 추출
      const currentDates = settlements.map((s: any) => s.date).filter((date: string) => date && typeof date === 'string')
      
      if (currentDates.length === 0) {
        return
      }

      // 다음 주 날짜 추가 (getWeeklyRecurringDates 사용)
      const allDates = getWeeklyRecurringDates(currentDates, 1)
      
      // 이미 있는 날짜는 제외하고 새로운 날짜만 추가
      const existingDates = new Set(currentDates)
      const newDates = allDates.filter(date => !existingDates.has(date))
      
      if (newDates.length === 0) {
        return // 새로운 날짜가 없으면 스킵
      }

      // 새로운 settlements 생성 (기존 settlements + 새로운 날짜들)
      const updatedSettlements = [...settlements]
      
      newDates.forEach((dateStr) => {
        // 이미 존재하지 않는 날짜만 추가
        if (!settlements.some((s: any) => s.date === dateStr)) {
          updatedSettlements.push({
            date: dateStr,
            is_settled: false,
          })
        }
      })

      // 날짜순으로 정렬
      updatedSettlements.sort((a: any, b: any) => {
        return a.date.localeCompare(b.date)
      })

      ordersToUpdate.push({
        id: orderDoc.id,
        settlements: updatedSettlements,
      })
      
      updatedCount++
      console.log(`주문 ${orderDoc.id}: ${currentDates.length}개 날짜 -> ${updatedSettlements.length}개 날짜 (${newDates.length}개 추가)`)
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

        const currentDates = settlements.map((s: any) => s.date).filter((date: string) => date && typeof date === 'string')
        if (currentDates.length === 0) {
          return order
        }

        const allDates = getWeeklyRecurringDates(currentDates, 1)
        const existingDates = new Set(currentDates)
        const newDates = allDates.filter(date => !existingDates.has(date))
        
        if (newDates.length === 0) {
          return order
        }

        const updatedSettlements = [...settlements]
        newDates.forEach((dateStr) => {
          if (!settlements.some((s: any) => s.date === dateStr)) {
            updatedSettlements.push({
              date: dateStr,
              is_settled: false,
            })
          }
        })

        updatedSettlements.sort((a: any, b: any) => {
          return a.date.localeCompare(b.date)
        })

        hasChanges = true
        customerUpdatedCount++
        
        return {
          ...order,
          settlements: updatedSettlements,
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
      message: '기존 정기 주문에 다음 주 날짜 추가 완료',
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
