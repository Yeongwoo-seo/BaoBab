import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAuth, Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp | undefined
let _db: Firestore | undefined
let _auth: Auth | undefined

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }
  }
  return app
}

function getFirestoreDb(): Firestore {
  if (!_db) {
    try {
      const firebaseApp = getFirebaseApp()
      // 서버/클라이언트 모두 getFirestore 사용
      _db = getFirestore(firebaseApp)
    } catch (error) {
      console.error('Error initializing Firestore:', error)
      throw error
    }
  }
  return _db
}

function getFirebaseAuth(): Auth | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }
  if (!_auth) {
    const firebaseApp = getFirebaseApp()
    _auth = getAuth(firebaseApp)
  }
  return _auth
}

// Firebase가 초기화되지 않았을 때를 대비해 lazy initialization
export function getDb(): Firestore {
  if (!_db) {
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      throw new Error('Firebase is not configured. Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID')
    }
    _db = getFirestoreDb()
  }
  return _db
}

// 기존 코드와의 호환성을 위해 db와 auth도 export
// 주의: 직접 사용하지 말고 getDb()와 getFirebaseAuth() 함수를 사용하세요
export const db = undefined as Firestore | undefined
export const auth = undefined as Auth | undefined
export default undefined as FirebaseApp | undefined
