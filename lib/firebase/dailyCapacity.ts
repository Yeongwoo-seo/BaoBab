import { getDb } from '@/lib/firebase'
import { collection, doc, getDoc, setDoc, getDocs, query, where, writeBatch, Timestamp } from 'firebase/firestore'
import { DailyCapacity } from '@/types'
import { getNextWeekDates, formatDate } from '@/lib/utils'

/**
 * 오늘 날짜 기준으로 다음 주 데이터가 없으면 자동 생성
 */
export async function ensureNextWeekCapacity(): Promise<void> {
  try {
    // Firebase 설정 확인
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      return
    }

    const db = getDb()
    const weekDates = getNextWeekDates()
    const dateStrings = weekDates.map(formatDate)
    
    const batch = writeBatch(db)
    let needsUpdate = false

    for (const dateStr of dateStrings) {
      const capacityRef = doc(db, 'daily_capacity', dateStr)
      const capacitySnap = await getDoc(capacityRef)

      if (!capacitySnap.exists()) {
        // 데이터가 없으면 기본값으로 생성
        batch.set(capacityRef, {
          date: dateStr,
          max_capa: 30,
          current_order_count: 0,
          is_closed: false,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        })
        needsUpdate = true
      }
    }

    if (needsUpdate) {
      await batch.commit()
    }
  } catch (error) {
    console.error('Error ensuring next week capacity:', error)
    // 에러 발생 시 조용히 실패 (기본값 사용)
  }
}

/**
 * 특정 날짜의 재고 정보 가져오기
 */
export async function getCapacity(date: string): Promise<DailyCapacity | null> {
  if (!db) {
    return null
  }

  try {
    const capacityRef = doc(db, 'daily_capacity', date)
    const capacitySnap = await getDoc(capacityRef)

    if (!capacitySnap.exists()) {
      return null
    }

    const data = capacitySnap.data()
    return {
      id: capacitySnap.id,
      date: data.date,
      max_capa: data.max_capa,
      current_order_count: data.current_order_count,
      is_closed: data.is_closed,
      created_at: data.created_at?.toDate().toISOString() || '',
      updated_at: data.updated_at?.toDate().toISOString() || '',
    }
  } catch (error) {
    console.error('Error getting capacity:', error)
    return null
  }
}

/**
 * 여러 날짜의 재고 정보 가져오기
 */
export async function getCapacities(dates: string[]): Promise<DailyCapacity[]> {
  try {
    // Firebase 설정 확인
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      return dates.map((dateStr) => ({
        id: '',
        date: dateStr,
        max_capa: 30,
        current_order_count: 0,
        is_closed: false,
        created_at: '',
        updated_at: '',
      }))
    }

    const capacities: DailyCapacity[] = []
    
    for (const dateStr of dates) {
      const capacity = await getCapacity(dateStr)
      if (capacity) {
        capacities.push(capacity)
      } else {
        // 데이터가 없으면 기본값 반환
        capacities.push({
          id: '',
          date: dateStr,
          max_capa: 30,
          current_order_count: 0,
          is_closed: false,
          created_at: '',
          updated_at: '',
        })
      }
    }

    return capacities
  } catch (error) {
    console.error('Error getting capacities:', error)
    // 에러 발생 시 기본값 반환
    return dates.map((dateStr) => ({
      id: '',
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
 * 재고 업데이트
 */
export async function updateCapacity(
  date: string,
  updates: Partial<Pick<DailyCapacity, 'max_capa' | 'is_closed'>>
): Promise<void> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error('Firebase is not configured')
  }

  try {
    const db = getDb()
    const capacityRef = doc(db, 'daily_capacity', date)
    const capacitySnap = await getDoc(capacityRef)

    const updateData: any = {
      updated_at: Timestamp.now(),
      ...updates,
    }

    if (capacitySnap.exists()) {
      await setDoc(capacityRef, updateData, { merge: true })
    } else {
      await setDoc(capacityRef, {
        date,
        max_capa: updates.max_capa || 30,
        current_order_count: 0,
        is_closed: updates.is_closed || false,
        created_at: Timestamp.now(),
        ...updateData,
      })
    }
  } catch (error) {
    console.error('Error updating capacity:', error)
    throw error
  }
}

/**
 * 주문 수 증가 (트랜잭션)
 */
export async function incrementOrderCount(dates: string[]): Promise<void> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error('Firebase is not configured')
  }

  try {
    const db = getDb()
    const batch = writeBatch(db)

    for (const dateStr of dates) {
      const capacityRef = doc(db, 'daily_capacity', dateStr)
      const capacitySnap = await getDoc(capacityRef)

      if (capacitySnap.exists()) {
        const data = capacitySnap.data()
        const newCount = (data.current_order_count || 0) + 1
        
        batch.update(capacityRef, {
          current_order_count: newCount,
          updated_at: Timestamp.now(),
        })
      } else {
        // 데이터가 없으면 생성
        batch.set(capacityRef, {
          date: dateStr,
          max_capa: 30,
          current_order_count: 1,
          is_closed: false,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        })
      }
    }

    await batch.commit()
  } catch (error) {
    console.error('Error incrementing order count:', error)
    throw error
  }
}
