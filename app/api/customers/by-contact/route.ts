import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Customer, CustomerOrder } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contact = searchParams.get('contact')

    if (!contact) {
      return NextResponse.json({ error: '연락처가 필요합니다.' }, { status: 400 })
    }

    const db = getDb()
    const customerRef = collection(db, 'customer')
    const customerQuery = query(customerRef, where('contact', '==', contact))
    const customerSnapshot = await getDocs(customerQuery)

    if (customerSnapshot.empty) {
      return NextResponse.json(null)
    }

    const customerDoc = customerSnapshot.docs[0]
    const data = customerDoc.data()

    const customer: Customer = {
      id: customerDoc.id,
      name: data.customer_name || data.name || '',
      contact: String(data.contact || ''),
      location: data.location || null,
      total_orders: data.orders?.length || 0,
      is_blacklisted: data.is_blacklisted || false,
      is_weekly_order: data.is_weekly_order || false,
      orders: (data.orders || []).map((order: any) => ({
        order_id: order.order_id,
        settlements: order.settlements || [],
        is_weekly_order: order.is_weekly_order || false,
        created_at: order.created_at?.toDate?.().toISOString() || order.created_at || '',
      })),
      created_at: data.created_at?.toDate().toISOString() || '',
      updated_at: data.updated_at?.toDate().toISOString() || '',
    }

    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: error.message || '고객 정보를 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
