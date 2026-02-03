# Vercel 환경 변수 설정 가이드

## Firebase 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수들을 설정해야 합니다.

### 설정 방법

1. **Vercel 대시보드 접속**: https://vercel.com
2. 프로젝트 선택 → **Settings** → **Environment Variables**
3. 다음 환경 변수들을 추가:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 환경 변수 값 찾기

1. [Firebase Console](https://console.firebase.google.com) 접속
2. 프로젝트 선택
3. 프로젝트 설정(⚙️ 아이콘) → 일반 탭
4. "내 앱" 섹션에서 웹 앱 선택
5. "Firebase SDK 추가" 또는 "구성" 섹션에서 값 확인

### 중요 사항

- **모든 환경에 적용**: Production, Preview, Development 모두 선택
- **재배포 필요**: 환경 변수 추가 후 자동으로 재배포되거나, 수동으로 재배포 필요
- **변수명 확인**: `NEXT_PUBLIC_` 접두사가 있어야 클라이언트에서 접근 가능

### 확인 방법

환경 변수 설정 후:
1. Vercel에서 재배포 완료 대기
2. 브라우저 콘솔에서 "Firebase is not configured" 오류가 사라졌는지 확인
3. 주문 페이지에서 재고 정보가 정상적으로 표시되는지 확인
