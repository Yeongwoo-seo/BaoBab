import { NextResponse } from 'next/server'
import { getWeeklySummary } from '@/lib/firebase/admin'

export async function GET() {
  try {
    const summary = await getWeeklySummary()
    return NextResponse.json(summary)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
