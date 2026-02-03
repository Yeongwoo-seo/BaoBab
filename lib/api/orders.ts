import { supabase } from '@/lib/supabase'
import { OrderFormData, Order } from '@/types'

export async function createOrder(data: OrderFormData): Promise<Order> {
  // 1. 동시성 제어를 위한 트랜잭션 처리
  // 먼저 선택된 날짜들의 재고를 확인하고 잠금
  const { data: capacities, error: capacityError } = await supabase
    .from('daily_capacity')
    .select('*')
    .in('date', data.orderDates)
    .order('date')

  if (capacityError) {
    throw new Error('재고 정보를 불러오는 중 오류가 발생했습니다.')
  }

  // 재고 확인
  for (const capacity of capacities || []) {
    if (capacity.is_closed) {
      throw new Error(`${capacity.date}는 마감되었습니다.`)
    }
    if (capacity.current_order_count >= capacity.max_capa) {
      throw new Error(`${capacity.date}는 재고가 부족합니다.`)
    }
  }

  // 2. 고객 정보 확인 또는 생성
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id, total_orders')
    .eq('contact', data.contact)
    .single()

  let customerId: string

  if (existingCustomer) {
    customerId = existingCustomer.id
    // 고객 정보 업데이트 (주문 수 증가)
    await supabase
      .from('customers')
      .update({
        name: data.name,
        location: data.location,
        total_orders: (existingCustomer.total_orders || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId)
  } else {
    // 새 고객 생성
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: data.name,
        contact: data.contact,
        location: data.location,
        total_orders: 1,
      })
      .select()
      .single()

    if (customerError) {
      throw new Error('고객 정보 저장 중 오류가 발생했습니다.')
    }
    customerId = newCustomer.id
  }

  // 3. 주문 생성 (트리거가 자동으로 current_order_count 업데이트)
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: data.name,
      contact: data.contact,
      location: data.location,
      order_dates: data.orderDates,
      payment_status: 'pending',
    })
    .select()
    .single()

  if (orderError) {
    throw new Error('주문 생성 중 오류가 발생했습니다.')
  }

  // 4. 주문-고객 관계 생성
  await supabase.from('order_customer').insert({
    order_id: order.id,
    customer_id: customerId,
  })

  return order
}

export async function getOrders(filters?: {
  startDate?: string
  endDate?: string
  location?: string
  paymentStatus?: string
}): Promise<Order[]> {
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false })

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate)
  }
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate)
  }
  if (filters?.location) {
    query = query.eq('location', filters.location)
  }
  if (filters?.paymentStatus) {
    query = query.eq('payment_status', filters.paymentStatus)
  }

  const { data, error } = await query

  if (error) {
    throw new Error('주문 목록을 불러오는 중 오류가 발생했습니다.')
  }

  return data || []
}

export async function updateOrderStatus(orderId: string, paymentStatus: 'pending' | 'completed'): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ payment_status: paymentStatus })
    .eq('id', orderId)
    .select()
    .single()

  if (error) {
    throw new Error('주문 상태 업데이트 중 오류가 발생했습니다.')
  }

  return data
}
