import { getDb } from '@/lib/firebase'
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore'
import { Order, OrderFormData, OrderSettlement } from '@/types'

/**
 * 주문 생성
 */
export async function createOrder(data: OrderFormData): Promise<Order> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.error('Firebase configuration missing:', {
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    })
    throw new Error('Firebase is not configured. Please check environment variables.')
  }

  try {
    const db = getDb()
    console.log('Firebase connected, creating order...')

    // 재고 확인: orders 컬렉션에서 날짜별 주문 건수 확인
    const { getCapacities } = await import('./dailyCapacity')
    const capacities = await getCapacities(data.orderDates)
    
    // 재고 부족 확인 (정기 주문의 경우 일부 날짜만 재고 부족해도 경고만 표시)
    const unavailableDates: string[] = []
    for (const capacity of capacities) {
      if (capacity.current_order_count >= capacity.max_capa) {
        if (data.is_weekly_order) {
          // 정기 주문의 경우 재고 부족한 날짜는 제외하고 계속 진행
          unavailableDates.push(capacity.date)
        } else {
          // 일반 주문의 경우 재고 부족하면 에러
          throw new Error(`${capacity.date} 날짜는 재고가 부족합니다. (${capacity.current_order_count}/${capacity.max_capa})`)
        }
      }
    }
    
    // 정기 주문에서 재고 부족한 날짜 제외
    if (data.is_weekly_order && unavailableDates.length > 0) {
      data.orderDates = data.orderDates.filter(date => !unavailableDates.includes(date))
      if (data.orderDates.length === 0) {
        throw new Error('선택하신 요일들이 모두 재고가 부족합니다.')
      }
    }

    // 고객 정보 확인 또는 생성
  const customerRef = collection(db, 'customer')
  const customerQuery = query(customerRef, where('contact', '==', data.contact))
  const customerSnapshot = await getDocs(customerQuery)

  let customerId: string

  if (!customerSnapshot.empty) {
    const customerDoc = customerSnapshot.docs[0]
    customerId = customerDoc.id
    const customerData = customerDoc.data()
    
    await updateDoc(doc(db, 'customer', customerId), {
      customer_name: data.name,
      contact: String(data.contact), // string 타입으로 명시적 변환
      location: data.location,
      allergies: data.allergies || '',
      is_weekly_order: data.is_weekly_order || false,
      updated_at: Timestamp.now(),
    })
  } else {
    const newCustomerRef = await addDoc(customerRef, {
      customer_name: data.name,
      contact: String(data.contact), // string 타입으로 명시적 변환
      location: data.location,
      allergies: data.allergies || '',
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    })
    customerId = newCustomerRef.id
    // customer_id를 문서 ID로 업데이트
    await updateDoc(doc(db, 'customer', customerId), {
      customer_id: customerId,
    })
  }

  // 4. 주문 생성
  const ordersRef = collection(db, 'orders')
  
  // 각 주문 날짜별로 정산 정보 초기화 (settlements 배열이 order_dates 역할도 함)
  const settlements: OrderSettlement[] = data.orderDates.map((date) => ({
    date,
    is_settled: false,
  }))

  const orderData: any = {
    customer_name: data.name,
    contact: data.contact,
    location: data.location,
    customer_id: customerId,
    payment_method: data.payment_method,
    allergies: data.allergies || '',
    settlements: settlements,
    is_weekly_order: data.is_weekly_order || false,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  }

  if (data.payment_method) {
    orderData.payment_method = data.payment_method
  }

  if (data.allergies) {
    orderData.allergies = data.allergies
  }

    const orderRef = await addDoc(ordersRef, orderData)
    console.log('Order document created:', orderRef.id)

    return {
      id: orderRef.id,
      customer_name: data.name,
      contact: data.contact,
      location: data.location,
      payment_method: data.payment_method,
      allergies: data.allergies,
      settlements: settlements,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  } catch (error: any) {
    console.error('Error in createOrder:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    })
    throw error
  }
}

/**
 * 주문 목록 조회
 */
export async function getOrders(filters?: {
  startDate?: string
  endDate?: string
  location?: string
  contact?: string
}): Promise<Order[]> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.warn('Firebase is not configured')
    return []
  }

  try {
    const db = getDb()
    const ordersRef = collection(db, 'orders')
    let q: any

    if (filters?.contact) {
      // 연락처로 필터링할 때는 orderBy 없이 먼저 조회 후 정렬
      q = query(ordersRef, where('contact', '==', filters.contact))
    } else {
      // 기본 쿼리: created_at로 정렬
      q = query(ordersRef, orderBy('created_at', 'desc'))
      
      if (filters?.location) {
        // location 필터는 클라이언트 사이드에서 처리 (복합 인덱스 필요 방지)
        // q = query(q, where('location', '==', filters.location))
      }
    }

    const snapshot = await getDocs(q)
    const orders: Order[] = []

    snapshot.forEach((doc) => {
      try {
        const data = doc.data() as any
        
        // 필수 필드 검증
        if (!data.customer_name || !data.contact || !data.location) {
          console.warn(`Order ${doc.id} is missing required fields, skipping`)
          return
        }
        
        // settlements 배열이 없으면 order_dates 기반으로 생성 (기존 데이터 호환성)
        let settlements: OrderSettlement[] = []
        if (data.settlements && Array.isArray(data.settlements)) {
          settlements = data.settlements.map((s: any) => ({
            date: s.date || '',
            is_settled: s.is_settled || false,
          })).filter((s: OrderSettlement) => s.date) // 빈 날짜 제거
        } else if (data.order_dates && Array.isArray(data.order_dates)) {
          // 기존 데이터: order_dates 기반으로 settlements 생성
          settlements = data.order_dates.map((date: string) => ({
            date,
            is_settled: data.is_settled || false,
          }))
        }
        
        // created_at 처리
        let createdAt = ''
        if (data.created_at) {
          if (data.created_at.toDate) {
            createdAt = data.created_at.toDate().toISOString()
          } else if (typeof data.created_at === 'string') {
            createdAt = data.created_at
          } else {
            createdAt = new Date().toISOString()
          }
        } else {
          createdAt = new Date().toISOString()
        }
        
        // updated_at 처리
        let updatedAt = ''
        if (data.updated_at) {
          if (data.updated_at.toDate) {
            updatedAt = data.updated_at.toDate().toISOString()
          } else if (typeof data.updated_at === 'string') {
            updatedAt = data.updated_at
          } else {
            updatedAt = createdAt
          }
        } else {
          updatedAt = createdAt
        }
        
        orders.push({
          id: doc.id,
          customer_name: data.customer_name || '',
          contact: String(data.contact || ''), // string 타입으로 명시적 변환
          location: data.location,
          payment_method: data.payment_method,
          allergies: data.allergies || '',
          settlements: settlements,
          is_weekly_order: data.is_weekly_order || false,
          created_at: createdAt,
          updated_at: updatedAt,
        })
      } catch (err) {
        console.error(`Error processing order ${doc.id}:`, err)
        // 개별 주문 처리 오류는 건너뛰고 계속 진행
      }
    })

    // 날짜 필터링 (클라이언트 사이드)
    let filteredOrders = orders
    if (filters?.startDate || filters?.endDate) {
      filteredOrders = orders.filter((order) => {
        const orderDate = new Date(order.created_at)
        if (filters.startDate && orderDate < new Date(filters.startDate)) return false
        if (filters.endDate && orderDate > new Date(filters.endDate)) return false
        return true
      })
    }

    // location 필터링 (클라이언트 사이드)
    if (filters?.location) {
      filteredOrders = filteredOrders.filter((order) => order.location === filters.location)
    }

    // 연락처로 필터링한 경우 날짜순 정렬
    if (filters?.contact) {
      filteredOrders.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }

    return filteredOrders
  } catch (error) {
    console.error('Error in getOrders:', error)
    throw error
  }
}

/**
 * 주문의 특정 날짜 정산 처리
 */
export async function settleOrderDate(
  orderId: string,
  date: string
): Promise<Order> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error('Firebase is not configured')
  }

  const db = getDb()
  const orderRef = doc(db, 'orders', orderId)
  const orderDoc = await getDoc(orderRef)

  if (!orderDoc.exists()) {
    throw new Error('Order not found')
  }

  const data = orderDoc.data()
  let settlements: OrderSettlement[] = data.settlements || []

  // settlements 배열에서 해당 날짜 찾아서 업데이트
  const settlementIndex = settlements.findIndex((s: OrderSettlement) => s.date === date)
  
  if (settlementIndex >= 0) {
    settlements[settlementIndex] = {
      date,
      is_settled: true,
    }
  } else {
    // 해당 날짜가 없으면 추가
    settlements.push({
      date,
      is_settled: true,
    })
  }

  await updateDoc(orderRef, {
    settlements: settlements,
    updated_at: Timestamp.now(),
  })

  return {
    id: orderId,
    customer_name: data.customer_name || '',
    contact: String(data.contact || ''), // string 타입으로 명시적 변환
    location: data.location,
    payment_method: data.payment_method,
    allergies: data.allergies || '',
    settlements: settlements,
    created_at: data.created_at?.toDate().toISOString() || '',
    updated_at: new Date().toISOString(),
  }
}

/**
 * 주문 삭제
 */
export async function deleteOrder(orderId: string): Promise<void> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error('Firebase is not configured. Please check environment variables.')
  }

  try {
    const db = getDb()
    const orderRef = doc(db, 'orders', orderId)
    
    // 주문 존재 확인
    const orderSnap = await getDoc(orderRef)
    if (!orderSnap.exists()) {
      throw new Error('주문을 찾을 수 없습니다.')
    }

    // 주문 삭제
    await deleteDoc(orderRef)
    console.log('Order deleted:', orderId)
  } catch (error: any) {
    console.error('Error deleting order:', error)
    throw error
  }
}
