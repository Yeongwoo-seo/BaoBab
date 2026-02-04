import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { collection, getDocs, doc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore'

/**
 * 일요일로 잘못 저장된 날짜를 금요일로 수정하는 API
 * 일요일(0)에서 2일을 빼면 금요일(5)이 됩니다
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      return NextResponse.json({ error: 'Firebase is not configured' }, { status: 500 })
    }

    const db = getDb()
    const ordersRef = collection(db, 'orders')
    const ordersSnapshot = await getDocs(ordersRef)

    let fixedCount = 0
    const ordersToUpdate: Array<{ id: string; settlements: any[] }> = []

    ordersSnapshot.forEach((orderDoc) => {
      const orderData = orderDoc.data()
      const settlements = orderData.settlements || []
      let hasChanges = false
      const updatedSettlements = settlements.map((settlement: any) => {
        const dateStr = settlement.date
        if (!dateStr || typeof dateStr !== 'string') {
          return settlement
        }

        // 날짜 문자열 파싱 (YYYY-MM-DD)
        const [year, month, day] = dateStr.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        date.setHours(0, 0, 0, 0) // 시간을 0으로 설정
        const dayOfWeek = date.getDay() // 0 = 일요일, 5 = 금요일

        // 일요일(0)인 경우 금요일(5)로 변경 (2일 전)
        if (dayOfWeek === 0) {
          const fridayDate = new Date(date)
          fridayDate.setDate(date.getDate() - 2) // 2일 전 = 금요일
          
          const fixedYear = fridayDate.getFullYear()
          const fixedMonth = String(fridayDate.getMonth() + 1).padStart(2, '0')
          const fixedDay = String(fridayDate.getDate()).padStart(2, '0')
          const fixedDateStr = `${fixedYear}-${fixedMonth}-${fixedDay}`
          
          console.log(`일요일 수정: ${dateStr} (일) -> ${fixedDateStr} (금)`)
          hasChanges = true
          fixedCount++
          
          return {
            ...settlement,
            date: fixedDateStr,
          }
        }

        return settlement
      })

      if (hasChanges) {
        ordersToUpdate.push({
          id: orderDoc.id,
          settlements: updatedSettlements,
        })
      }
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
    let customerFixedCount = 0
    const customersToUpdate: Array<{ id: string; orders: any[] }> = []

    customerSnapshot.forEach((customerDoc) => {
      const customerData = customerDoc.data()
      const orders = customerData.orders || []
      let hasChanges = false
      
      const updatedOrders = orders.map((order: any) => {
        const settlements = order.settlements || []
        let orderHasChanges = false
        
        const updatedSettlements = settlements.map((settlement: any) => {
          const dateStr = settlement.date
          if (!dateStr || typeof dateStr !== 'string') {
            return settlement
          }

          const [year, month, day] = dateStr.split('-').map(Number)
          const date = new Date(year, month - 1, day)
          date.setHours(0, 0, 0, 0) // 시간을 0으로 설정
          const dayOfWeek = date.getDay()

          if (dayOfWeek === 0) {
            const fridayDate = new Date(date)
            fridayDate.setDate(date.getDate() - 2)
            
            const fixedYear = fridayDate.getFullYear()
            const fixedMonth = String(fridayDate.getMonth() + 1).padStart(2, '0')
            const fixedDay = String(fridayDate.getDate()).padStart(2, '0')
            const fixedDateStr = `${fixedYear}-${fixedMonth}-${fixedDay}`
            
            console.log(`Customer 일요일 수정: ${dateStr} (일) -> ${fixedDateStr} (금)`)
            orderHasChanges = true
            customerFixedCount++
            
            return {
              ...settlement,
              date: fixedDateStr,
            }
          }

          return settlement
        })

        if (orderHasChanges) {
          hasChanges = true
          return {
            ...order,
            settlements: updatedSettlements,
          }
        }

        return order
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
      message: '일요일 날짜를 금요일로 수정 완료',
      ordersFixed: fixedCount,
      customersFixed: customerFixedCount,
      totalFixed: fixedCount + customerFixedCount,
    })
  } catch (error: any) {
    console.error('Error fixing Sunday dates:', error)
    return NextResponse.json(
      { error: error.message || '날짜 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
