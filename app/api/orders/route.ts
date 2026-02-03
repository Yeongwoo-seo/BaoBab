import { NextRequest, NextResponse } from 'next/server'
import { createOrder, getOrders } from '@/lib/firebase/orders'
import { OrderFormData } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: OrderFormData = await request.json()
    console.log('Creating order with data:', { ...body, contact: body.contact?.replace(/\D/g, '') })
    const order = await createOrder(body)
    console.log('Order created successfully:', order.id)
    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error('Error creating order:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json({ 
      error: error.message || '주문 처리 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contact = searchParams.get('contact')

    const filters = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      location: searchParams.get('location') || undefined,
      contact: contact || undefined,
    }
    
    const orders = await getOrders(filters)
    return NextResponse.json(orders)
  } catch (error: any) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ 
      error: error.message || '주문 내역을 불러오는 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
