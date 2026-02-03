import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { collection, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore'

/**
 * daily_capacity 컬렉션의 모든 문서 삭제 (초기화)
 * 주의: 이제 daily_capacity는 사용하지 않으므로 정리용
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      return NextResponse.json({ error: 'Firebase is not configured' }, { status: 500 })
    }

    const db = getDb()
    const capacityRef = collection(db, 'daily_capacity')
    const snapshot = await getDocs(capacityRef)

    if (snapshot.empty) {
      return NextResponse.json({ 
        message: 'daily_capacity 컬렉션이 이미 비어있습니다.',
        deletedCount: 0 
      })
    }

    // 배치로 삭제 (최대 500개씩)
    let deletedCount = 0
    const docs = snapshot.docs
    const batchSize = 500

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = writeBatch(db)
      const batchDocs = docs.slice(i, i + batchSize)
      
      batchDocs.forEach((docSnapshot) => {
        batch.delete(doc(db, 'daily_capacity', docSnapshot.id))
        deletedCount++
      })

      await batch.commit()
    }

    return NextResponse.json({ 
      message: `daily_capacity 컬렉션에서 ${deletedCount}개의 문서를 삭제했습니다.`,
      deletedCount 
    })
  } catch (error: any) {
    console.error('Error resetting capacity:', error)
    return NextResponse.json({ 
      error: error.message || '초기화 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
