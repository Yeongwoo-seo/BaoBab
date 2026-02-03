import { NextRequest, NextResponse } from 'next/server'
import { updateCustomerBlacklist } from '@/lib/firebase/customers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { is_blacklisted } = body

    const customer = await updateCustomerBlacklist(params.id, is_blacklisted)
    return NextResponse.json(customer)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
