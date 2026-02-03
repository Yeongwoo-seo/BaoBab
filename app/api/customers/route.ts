import { NextResponse } from 'next/server'
import { getCustomers } from '@/lib/firebase/customers'

export async function GET() {
  try {
    const customers = await getCustomers()
    return NextResponse.json(customers)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
