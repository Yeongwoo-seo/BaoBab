import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      return NextResponse.json(null)
    }

    const db = getDb()
    const noticesRef = collection(db, 'notices')
    const q = query(
      noticesRef,
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(1)
    )
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return NextResponse.json(null)
    }

    const doc = snapshot.docs[0]
    const data = doc.data()
    
    return NextResponse.json({
      id: doc.id,
      title: data.title,
      content: data.content,
      createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      isActive: data.isActive,
    })
  } catch (error: any) {
    console.error('Error fetching notice:', error)
    return NextResponse.json(null)
  }
}
