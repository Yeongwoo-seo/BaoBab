import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { doc, getDoc, updateDoc, Timestamp, getDocs, query, where, collection } from 'firebase/firestore'
import { getDayOfWeek } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { date, cancelAllWeekly } = body

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 })
    }

    const db = getDb()
    const orderRef = doc(db, 'orders', params.id)
    const orderDoc = await getDoc(orderRef)

    if (!orderDoc.exists()) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })
    }

    const orderData = orderDoc.data()
    let settlements = orderData.settlements || []

    if (cancelAllWeekly && orderData.is_weekly_order) {
      // 해당 요일의 모든 날짜 취소
      const targetDay = getDayOfWeek(new Date(date))
      settlements = settlements.filter((s: any) => {
        const settlementDay = getDayOfWeek(new Date(s.date))
        return settlementDay !== targetDay
      })
    } else {
      // 해당 날짜만 취소
      settlements = settlements.filter((s: any) => s.date !== date)
    }

    // 주문 업데이트
    await updateDoc(orderRef, {
      settlements: settlements,
      updated_at: Timestamp.now(),
    })

    // customer 문서의 orders 배열도 업데이트
    if (orderData.customer_id) {
      const customerRef = doc(db, 'customer', orderData.customer_id)
      const customerDoc = await getDoc(customerRef)
      
      if (customerDoc.exists()) {
        const customerData = customerDoc.data()
        const customerOrders = customerData.orders || []
        
        const updatedCustomerOrders = customerOrders.map((co: any) => {
          if (co.order_id === params.id) {
            let updatedSettlements = co.settlements || []
            
            if (cancelAllWeekly && co.is_weekly_order) {
              const targetDay = getDayOfWeek(new Date(date))
              updatedSettlements = updatedSettlements.filter((s: any) => {
                const settlementDay = getDayOfWeek(new Date(s.date))
                return settlementDay !== targetDay
              })
            } else {
              updatedSettlements = updatedSettlements.filter((s: any) => s.date !== date)
            }
            
            return {
              ...co,
              settlements: updatedSettlements,
            }
          }
          return co
        })
        
        await updateDoc(customerRef, {
          orders: updatedCustomerOrders,
          updated_at: Timestamp.now(),
        })
      }
    }

    return NextResponse.json({ 
      message: cancelAllWeekly ? '해당 요일의 모든 주문이 취소되었습니다.' : '해당 날짜의 주문이 취소되었습니다.',
      settlements 
    })
  } catch (error: any) {
    console.error('Error canceling date:', error)
    return NextResponse.json({ 
      error: error.message || '날짜 취소 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
