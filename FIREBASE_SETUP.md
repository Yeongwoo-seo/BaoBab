# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `bao-bab-lunchbox`)
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

## 2. Firestore Database 생성

1. Firebase Console에서 "Firestore Database" 메뉴 클릭
2. "데이터베이스 만들기" 클릭
3. 보안 규칙 선택:
   - **테스트 모드**: 개발 중에는 테스트 모드로 시작 (30일 후 자동 만료)
   - **프로덕션 모드**: 보안 규칙을 설정하여 시작 (권장)
4. 위치 선택: `asia-northeast3` (서울) 또는 `australia-southeast1` (시드니) 권장
5. "사용 설정" 클릭

## 3. 웹 앱 추가 및 설정 정보 복사

1. Firebase Console에서 프로젝트 설정(톱니바퀴 아이콘) 클릭
2. "내 앱" 섹션에서 웹 아이콘(</>) 클릭
3. 앱 닉네임 입력 (예: `Bao Bab Web`)
4. "앱 등록" 클릭
5. Firebase SDK 설정 정보 복사:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

## 4. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza... (위에서 복사한 apiKey)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

**중요**: 
- `.env.local` 파일은 Git에 커밋하지 마세요 (이미 .gitignore에 포함됨)
- 실제 값으로 변경해야 합니다
- 프로젝트를 재시작해야 환경 변수가 적용됩니다

## 5. Firestore 보안 규칙 설정

Firebase Console > Firestore Database > 규칙 탭에서 다음 규칙을 설정하세요:

### 개발 단계용 규칙 (테스트용)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 새로운 재료 컬렉션 (자동 업로드용)
    match /ingredients/{ingredientId} {
      allow read, write: if true;
    }
    
    // 레시피 컬렉션
    match /recipes/{recipeId} {
      allow read, write: if true;
    }
    
    // 재고 컬렉션
    match /inventory/{itemId} {
      allow read, write: if true;
    }
    
    // 일일 메뉴 컬렉션
    match /dailyMenus/{menuId} {
      allow read, write: if true;
    }
    
    // 비즈니스 메트릭스
    match /businessMetrics/{document=**} {
      allow read, write: if true;
    }
    
    // 재료 가격 (기존)
    match /ingredientPrices/{document=**} {
      allow read, write: if true;
    }
    
    // 팀 설정
    match /teams/{teamId} {
      allow read, write: if true;
    }
    
    // 추가 컬렉션들 (미래 확장용)
    match /suppliers/{supplierId} {
      allow read, write: if true;
    }
    
    match /products/{productId} {
      allow read, write: if true;
    }
    
    // Bao Bab 프로젝트 컬렉션들
    // 공지사항: 모든 사용자가 읽기 가능
    match /notices/{noticeId} {
      allow read: if true;
      allow write: if false; // Firebase Console에서만 작성
    }
    
    // 재고 정보: 모든 사용자가 읽기 가능, 쓰기도 허용 (개발 단계)
    match /daily_capacity/{date} {
      allow read: if true;
      allow write: if true; // 개발 단계: 나중에 인증 추가
    }
    
    // 주문: 모든 사용자가 생성/읽기/수정 가능 (개발 단계)
    match /orders/{orderId} {
      allow create: if true;
      allow read: if true; // 개발 단계: 나중에 본인 연락처로만 제한
      allow update: if true; // 개발 단계: 나중에 관리자만으로 제한
    }
    
    // 고객 정보: 개발 단계에서는 모두 접근 가능
    match /customers/{customerId} {
      allow read: if true; // 개발 단계: 나중에 본인 연락처로만 제한
      allow write: if true; // 개발 단계: 나중에 관리자만으로 제한
    }
  }
}
```

### 프로덕션용 규칙 (운영 환경)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 공지사항: 모든 사용자가 읽기 가능
    match /notices/{noticeId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // 재고 정보: 모든 사용자가 읽기 가능, 관리자만 쓰기 가능
    match /daily_capacity/{date} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // 주문: 모든 사용자가 생성 가능, 본인 연락처로만 조회 가능
    match /orders/{orderId} {
      allow create: if true;
      allow read: if request.auth != null && 
                     (request.auth.token.admin == true || 
                      resource.data.contact == request.query.contact);
      allow update: if request.auth != null && request.auth.token.admin == true;
    }
    
    // 고객 정보: 관리자만 접근 가능
    match /customer/{customerId} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

**중요**: 
- 개발 단계에서는 위의 개발용 규칙을 사용하세요 (모든 접근 허용)
- 프로덕션 환경에서는 Firebase Authentication을 설정하고 프로덕션용 규칙을 사용하세요
- `firestore.rules` 파일이 프로젝트 루트에 생성되어 있으니 참고하세요

## 6. 컬렉션 구조

다음 컬렉션들이 자동으로 생성됩니다:

### daily_capacity (요일별 재고)
```javascript
{
  date: "2026-02-10", // YYYY-MM-DD 형식
  max_capa: 30,
  current_order_count: 5,
  is_closed: false,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

### orders (주문)
```javascript
{
  customer_name: "홍길동",
  contact: "0412345678",
  location: "Kings Park" | "Eastern Creek",
  payment_status: "pending" | "completed",
  payment_method: "cash" | "bank_transfer" (선택사항),
  allergies: "견과류 알러지" (선택사항),
  customer_id: "customer_doc_id",
  settlements: [ // 날짜별 정산 정보 배열 (필수)
    {
      date: "2026-02-10",
      is_settled: true, // 정산 여부
      settlement_date: "2026-02-15" // 정산 처리 날짜
    },
    {
      date: "2026-02-11",
      is_settled: false,
      settlement_date: null
    }
  ],
  created_at: Timestamp,
  updated_at: Timestamp
}
```

### customer (고객)
```javascript
{
  customer_id: "customer_doc_id", // 문서 ID와 동일
  customer_name: "홍길동",
  contact: "0412345678", // string 타입
  location: "Kings Park" | "Eastern Creek",
  allergies: "", // string 타입 (선택사항)
  created_at: Timestamp,
  updated_at: Timestamp
}
```

### notices (공지사항)
```javascript
{
  title: "공지사항 제목",
  content: "공지사항 내용",
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```


## 7. 테스트

환경 변수 설정 후 개발 서버를 재시작하세요:

```bash
npm run dev
```

브라우저 콘솔에서 "Firebase is not configured" 오류가 사라지고, 주문 페이지에서 재고 정보가 정상적으로 표시되면 설정이 완료된 것입니다.

## 8. 문제 해결

### "Firebase is not configured" 오류
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 정확한지 확인 (NEXT_PUBLIC_ 접두사 필수)
- 개발 서버를 재시작했는지 확인

### Firestore 권한 오류
- 보안 규칙이 올바르게 설정되었는지 확인
- 테스트 모드에서는 모든 읽기/쓰기가 허용되지만, 프로덕션 모드에서는 규칙을 설정해야 합니다

### 데이터가 표시되지 않음
- Firebase Console에서 컬렉션이 생성되었는지 확인
- 네트워크 탭에서 API 요청이 성공했는지 확인

## 9. 프로덕션 배포 (Vercel)

1. GitHub에 프로젝트 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 import
3. Settings > Environment Variables에서 다음 변수 설정:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
4. 배포 완료
