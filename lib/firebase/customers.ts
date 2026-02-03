import { getDb } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore'
import { Customer } from '@/types'

/**
 * 고객 목록 조회
 */
export async function getCustomers(): Promise<Customer[]> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return []
  }

  const db = getDb()
  const customerRef = collection(db, 'customer')
  const q = query(customerRef, orderBy('created_at', 'desc'))
  const snapshot = await getDocs(q)

  const customers: Customer[] = []
  snapshot.forEach((doc) => {
    const data = doc.data()
    customers.push({
      id: doc.id,
      name: data.customer_name || data.name || '',
      contact: String(data.contact || ''), // string 타입으로 명시적 변환
      location: data.location || null,
      total_orders: 0, // orders 컬렉션에서 계산
      is_blacklisted: false, // 필요시 추가
      created_at: data.created_at?.toDate().toISOString() || '',
      updated_at: data.updated_at?.toDate().toISOString() || '',
    })
  })

  return customers
}

/**
 * 고객 블랙리스트 상태 변경
 */
export async function updateCustomerBlacklist(
  customerId: string,
  isBlacklisted: boolean
): Promise<Customer> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error('Firebase is not configured')
  }

  const db = getDb()
  const customerRef = doc(db, 'customer', customerId)
  await updateDoc(customerRef, {
    updated_at: Timestamp.now(),
  })

  const customerDoc = await getDoc(customerRef)
  const data = customerDoc.data()!

  return {
    id: customerId,
    name: data.customer_name || data.name || '',
    contact: String(data.contact || ''), // string 타입으로 명시적 변환
    location: data.location || null,
    total_orders: 0,
    is_blacklisted: isBlacklisted,
    created_at: data.created_at?.toDate().toISOString() || '',
    updated_at: new Date().toISOString(),
  }
}
