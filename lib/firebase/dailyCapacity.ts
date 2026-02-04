import { getDb } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { DailyCapacity } from '@/types'

/**
 * orders 컬렉션에서 특정 날짜의 주문 건수 계산
 */
async function getOrderCountForDate(date: string): Promise<number> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return 0
  }

  try {
    const db = getDb()
    const ordersRef = collection(db, 'orders')
    
    // settlements 배열에 해당 날짜가 포함된 주문 찾기
    const ordersSnapshot = await getDocs(ordersRef)
    let count = 0
    
    ordersSnapshot.forEach((doc) => {
      const data = doc.data()
      const settlements = data.settlements || []
      
      // settlements 배열에서 해당 날짜 찾기
      const hasDate = settlements.some((settlement: any) => settlement.date === date)
      if (hasDate) {
        count++
      }
    })
    
    return count
  } catch (error) {
    console.error('Error counting orders for date:', error)
    return 0
  }
}

/**
 * 특정 날짜의 재고 정보 가져오기
 * orders 컬렉션에서 직접 계산 (30 - 주문 건수)
 */
export async function getCapacity(date: string): Promise<DailyCapacity | null> {
  try {
    const orderCount = await getOrderCountForDate(date)
    const maxCapa = 30
    const remaining = maxCapa - orderCount
    
    return {
      id: date,
      date: date,
      max_capa: maxCapa,
      current_order_count: orderCount,
      is_closed: false, // is_closed는 별도 관리 필요 시 추가
      created_at: '',
      updated_at: '',
    }
  } catch (error) {
    console.error('Error getting capacity:', error)
    return null
  }
}

/**
 * 여러 날짜의 재고 정보 가져오기
 * orders 컬렉션에서 직접 계산
 */
export async function getCapacities(dates: string[]): Promise<DailyCapacity[]> {
  try {
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      return dates.map((dateStr) => ({
        id: dateStr,
        date: dateStr,
        max_capa: 30,
        current_order_count: 0,
        is_closed: false,
        created_at: '',
        updated_at: '',
      }))
    }

    const db = getDb()
    const ordersRef = collection(db, 'orders')
    
    // 모든 주문 가져오기 (한 번만 조회)
    const ordersSnapshot = await getDocs(ordersRef)
    
    // 날짜별 주문 건수 계산
    const orderCounts: Record<string, number> = {}
    dates.forEach(date => {
      orderCounts[date] = 0
    })
    
    ordersSnapshot.forEach((doc) => {
      const data = doc.data()
      const settlements = data.settlements || []
      
      // settlements 배열의 각 날짜에 대해 카운트 증가
      settlements.forEach((settlement: any) => {
        const date = settlement?.date
        if (date && orderCounts.hasOwnProperty(date)) {
          orderCounts[date]++
        }
      })
    })
    
    console.log('재고 계산:', {
      totalOrders: ordersSnapshot.size,
      orderCounts,
    })
    
    // DailyCapacity 배열 생성
    return dates.map((dateStr) => ({
      id: dateStr,
      date: dateStr,
      max_capa: 30,
      current_order_count: orderCounts[dateStr] || 0,
      is_closed: false,
      created_at: '',
      updated_at: '',
    }))
  } catch (error) {
    console.error('Error getting capacities:', error)
    // 에러 발생 시 기본값 반환
    return dates.map((dateStr) => ({
      id: dateStr,
      date: dateStr,
      max_capa: 30,
      current_order_count: 0,
      is_closed: false,
      created_at: '',
      updated_at: '',
    }))
  }
}

/**
 * 재고 업데이트 (is_closed만 관리, max_capa는 고정값 30)
 * 주의: daily_capacity 컬렉션을 사용하지 않으므로 별도 저장소 필요 시 구현
 */
export async function updateCapacity(
  date: string,
  updates: Partial<Pick<DailyCapacity, 'max_capa' | 'is_closed'>>
): Promise<void> {
  // daily_capacity 컬렉션을 사용하지 않으므로 업데이트 불가
  // is_closed 기능이 필요하면 별도 컬렉션(예: daily_settings)에 저장 필요
  console.warn('updateCapacity called but daily_capacity collection is not used. Updates ignored.')
}

/**
 * 주문 수 증가 함수 제거됨
 * orders 컬렉션에 주문이 추가되면 자동으로 계산됨
 */
