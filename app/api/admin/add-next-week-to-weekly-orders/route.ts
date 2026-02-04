import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { collection, getDocs, doc, updateDoc, writeBatch, Timestamp, query, where } from 'firebase/firestore'
import { formatDate, getDayOfWeek } from '@/lib/utils'

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
    
    // 다음 주 월요일 계산 (시작 날짜)
    const dayOfWeek = today.getDay()
    const daysUntilMonday = (8 - dayOfWeek) % 7 || 7
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + daysUntilMonday)
    nextMonday.setHours(0, 0, 0, 0)
    
    // 다다음 주 금요일 계산 (끝 날짜) - 다음 주 월요일 + 11일 = 다다음 주 금요일
    const weekAfterNextFriday = new Date(nextMonday)
    weekAfterNextFriday.setDate(nextMonday.getDate() + 11)
    weekAfterNextFriday.setHours(0, 0, 0, 0)

    let updatedCount = 0
    const ordersToUpdate: Array<{ id: string; settlements: any[] }> = []

    ordersSnapshot.forEach((orderDoc) => {
      const orderData = orderDoc.data()
      const settlements = orderData.settlements || []
      
      if (settlements.length === 0) {
        return // settlements가 없으면 스킵
      }

      // 기존 날짜들에서 요일 추출 (다음 주 날짜 기준)
      const existingDates = new Set<string>()
      const dayOfWeekMap = new Map<'월' | '화' | '수' | '목' | '금', Set<string>>()
      
      settlements.forEach((settlement: any) => {
        const dateStr = settlement.date
        if (!dateStr || typeof dateStr !== 'string') {
          return
        }

        const [year, month, day] = dateStr.split('-').map(Number)
        const settlementDate = new Date(year, month - 1, day)
        settlementDate.setHours(0, 0, 0, 0)

        // 다음 주 월요일부터 다다음 주 금요일까지의 날짜만 고려 (이번 주 제외)
        if (settlementDate >= nextMonday && settlementDate <= weekAfterNextFriday) {
          existingDates.add(dateStr)
          const dayOfWeek = getDayOfWeek(settlementDate)
          if (!dayOfWeekMap.has(dayOfWeek)) {
            dayOfWeekMap.set(dayOfWeek, new Set())
          }
          dayOfWeekMap.get(dayOfWeek)!.add(dateStr)
        }
      })

      // 각 요일별로 이번 주, 다음 주, 다다음주 날짜 생성
      const allDates = new Set<string>()
      
      dayOfWeekMap.forEach((dates, dayOfWeek) => {
        // 다음 주 날짜 하나를 기준으로 사용 (기존에 있는 날짜 중 하나)
        const referenceDateStr = Array.from(dates)[0]
        if (!referenceDateStr) return

        const [year, month, day] = referenceDateStr.split('-').map(Number)
        const referenceDate = new Date(year, month - 1, day)
        referenceDate.setHours(0, 0, 0, 0)

        // 다음 주 월요일과의 차이 계산
          const daysFromNextMonday = Math.floor((referenceDate.getTime() - nextMonday.getTime()) / (1000 * 60 * 60 * 24))
          
          // 다음 주, 다다음주 같은 요일 생성 (이번 주 제외)
          for (let weekOffset = 0; weekOffset <= 1; weekOffset++) {
            const targetDate = new Date(nextMonday)
            targetDate.setDate(nextMonday.getDate() + daysFromNextMonday + (weekOffset * 7))
            targetDate.setHours(0, 0, 0, 0)
            
            // 범위 내에 있는지 확인
            if (targetDate >= nextMonday && targetDate <= weekAfterNextFriday) {
              const formattedDate = formatDate(targetDate)
              allDates.add(formattedDate)
            }
          }
      })

      // 기존 날짜도 포함
      existingDates.forEach(date => allDates.add(date))

      // settlements 배열 생성
      const updatedSettlements: any[] = []
      Array.from(allDates).sort().forEach((dateStr) => {
        // 기존 settlement 정보 유지 (is_settled 등)
        const existingSettlement = settlements.find((s: any) => s.date === dateStr)
        if (existingSettlement) {
          updatedSettlements.push(existingSettlement)
        } else {
          updatedSettlements.push({
            date: dateStr,
            is_settled: false,
          })
        }
      })

      // 변경사항이 있는지 확인
      const hasChanges = updatedSettlements.length !== settlements.length || 
        !updatedSettlements.every((s, i) => settlements[i]?.date === s.date)

      if (!hasChanges) {
        return // 변경사항 없음
      }

      ordersToUpdate.push({
        id: orderDoc.id,
        settlements: updatedSettlements,
      })
      
      updatedCount++
      console.log(`주문 ${orderDoc.id}: ${settlements.length}개 날짜 -> ${updatedSettlements.length}개 날짜`)
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

        // 기존 날짜들에서 요일 추출
        const existingDates = new Set<string>()
        const dayOfWeekMap = new Map<'월' | '화' | '수' | '목' | '금', Set<string>>()
        
        settlements.forEach((settlement: any) => {
          const dateStr = settlement.date
          if (!dateStr || typeof dateStr !== 'string') {
            return
          }

          const [year, month, day] = dateStr.split('-').map(Number)
          const settlementDate = new Date(year, month - 1, day)
          settlementDate.setHours(0, 0, 0, 0)

          // 다음 주 월요일부터 다다음 주 금요일까지의 날짜만 고려 (이번 주 제외)
          if (settlementDate >= nextMonday && settlementDate <= weekAfterNextFriday) {
            existingDates.add(dateStr)
            const dayOfWeek = getDayOfWeek(settlementDate)
            if (!dayOfWeekMap.has(dayOfWeek)) {
              dayOfWeekMap.set(dayOfWeek, new Set())
            }
            dayOfWeekMap.get(dayOfWeek)!.add(dateStr)
          }
        })

        // 각 요일별로 이번 주, 다음 주, 다다음주 날짜 생성
        const allDates = new Set<string>()
        
        dayOfWeekMap.forEach((dates, dayOfWeek) => {
          const referenceDateStr = Array.from(dates)[0]
          if (!referenceDateStr) return

          const [year, month, day] = referenceDateStr.split('-').map(Number)
          const referenceDate = new Date(year, month - 1, day)
          referenceDate.setHours(0, 0, 0, 0)

          const daysFromNextMonday = Math.floor((referenceDate.getTime() - nextMonday.getTime()) / (1000 * 60 * 60 * 24))
          
          // 다음 주, 다다음주 같은 요일 생성 (이번 주 제외)
          for (let weekOffset = 0; weekOffset <= 1; weekOffset++) {
            const targetDate = new Date(nextMonday)
            targetDate.setDate(nextMonday.getDate() + daysFromNextMonday + (weekOffset * 7))
            targetDate.setHours(0, 0, 0, 0)
            
            if (targetDate >= nextMonday && targetDate <= weekAfterNextFriday) {
              const formattedDate = formatDate(targetDate)
              allDates.add(formattedDate)
            }
          }
        })

        existingDates.forEach(date => allDates.add(date))

        const updatedSettlements: any[] = []
        Array.from(allDates).sort().forEach((dateStr) => {
          const existingSettlement = settlements.find((s: any) => s.date === dateStr)
          if (existingSettlement) {
            updatedSettlements.push(existingSettlement)
          } else {
            updatedSettlements.push({
              date: dateStr,
              is_settled: false,
            })
          }
        })

        const hasOrderChanges = updatedSettlements.length !== settlements.length || 
          !updatedSettlements.every((s, i) => settlements[i]?.date === s.date)

        if (!hasOrderChanges) {
          return order
        }

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
      message: '기존 정기 주문을 다음 주 + 다다음 주 날짜만 남기고 나머지 삭제 완료',
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
