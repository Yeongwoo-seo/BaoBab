# Bao Bab - 도시락 주문 및 재고 관리 시스템

호주 시드니 기반 도시락 브랜드 'Bao Bab'의 온라인 주문 접수 자동화 및 재고 관리 시스템입니다.

## 기술 스택

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS (Pretendard 폰트)
- **Database**: Firebase Firestore
- **Charts**: Recharts
- **Date Handling**: date-fns

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com)에서 새 프로젝트 생성
2. Firestore Database 생성 (테스트 모드 또는 프로덕션 모드)
3. 프로젝트 설정에서 웹 앱 추가
4. Firebase 설정 정보 복사

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Firebase Console의 프로젝트 설정 > 일반에서 웹 앱 설정 정보를 확인할 수 있습니다.

### 4. Firestore 컬렉션 구조

다음 컬렉션들이 자동으로 생성됩니다:

- **daily_capacity**: 요일별 재고 정보 (오늘 날짜 기준으로 다음 주 데이터 자동 생성)
- **orders**: 주문 정보 (정산 여부 포함)
- **customers**: 고객 정보
- **notices**: 공지사항 (isActive: true인 항목만 표시)
- **settlements**: 날짜별 정산 정보 (새로 추가)

자세한 설정 방법은 [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)를 참고하세요.

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
├── app/
│   ├── order/              # 주문 페이지
│   ├── my-orders/          # 주문 조회 페이지
│   ├── admin/              # 관리자 페이지
│   │   ├── page.tsx        # 대시보드
│   │   ├── orders/         # 주문 관리
│   │   ├── capacity/       # 재고 설정
│   │   └── customers/      # 고객 관리
│   └── api/                # API 라우트
├── components/             # 재사용 가능한 컴포넌트
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── OrderForm.tsx
│   └── Notice.tsx          # 공지사항 컴포넌트
├── lib/
│   ├── firebase.ts         # Firebase 클라이언트
│   ├── firebase/           # Firebase 관련 함수
│   │   ├── dailyCapacity.ts
│   │   ├── orders.ts
│   │   ├── customers.ts
│   │   └── admin.ts
│   └── utils.ts            # 유틸리티 함수
└── types/                  # TypeScript 타입 정의
```

## 주요 기능

### 고객 기능
- ✅ 주문 접수 시스템 (이름, 연락처, 수령 장소, 요일 선택)
- ✅ 실시간 재고 확인 (5초마다 자동 갱신)
- ✅ 호주 전화번호 포맷 자동 적용 (04XX XXX XXX)
- ✅ 주문 완료 후 성공 페이지
- ✅ 연락처로 주문 내역 조회
- ✅ 공지사항 표시 (주문 페이지 상단)

### 관리자 기능
- ✅ 대시보드 (주간 요약, 예상 매출, 요일별 그래프)
- ✅ 주문 관리 (필터링, 검색, 결제 상태 변경)
- ✅ 재고 설정 (요일별 Capa 설정, 강제 마감)
- ✅ 고객 관리 (CRM, 주문 이력, 블랙리스트)

### 기술적 특징
- ✅ 동시성 제어 (Firestore 트랜잭션 기반 재고 차감)
- ✅ 실시간 재고 업데이트
- ✅ 오늘 날짜 기준으로 다음 주 데이터 자동 생성
- ✅ 반응형 디자인 (Mobile First)
- ✅ 미니멀리즘 UI/UX (토스 스타일)

## Firebase 설정

### Firestore 보안 규칙 (예시)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 공지사항은 모든 사용자가 읽을 수 있음
    match /notices/{noticeId} {
      allow read: if true;
      allow write: if request.auth != null; // 관리자만 작성 가능
    }
    
    // 재고 정보는 모든 사용자가 읽을 수 있음
    match /daily_capacity/{date} {
      allow read: if true;
      allow write: if request.auth != null; // 관리자만 수정 가능
    }
    
    // 주문은 모든 사용자가 생성 가능, 관리자만 읽기/수정 가능
    match /orders/{orderId} {
      allow create: if true;
      allow read, update: if request.auth != null;
    }
    
    // 고객 정보는 관리자만 접근 가능
    match /customers/{customerId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 배포

### Vercel 배포

1. GitHub에 프로젝트 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 import
3. 환경 변수 설정 (Firebase 설정 정보)
4. 배포 완료

### 환경 변수 (프로덕션)

Vercel 대시보드에서 다음 환경 변수를 설정하세요:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## 정산 기능

날짜별 정산 정보를 관리할 수 있는 기능이 추가되었습니다.

### 정산 API 엔드포인트

- `GET /api/settlements?date=YYYY-MM-DD`: 특정 날짜의 정산 정보 조회
- `GET /api/settlements?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`: 기간별 정산 정보 조회
- `POST /api/settlements`: 정산 정보 생성 또는 업데이트
  ```json
  {
    "date": "2026-02-10",
    "notes": "정산 메모 (선택사항)"
  }
  ```
- `PATCH /api/settlements`: 정산 완료 처리
  ```json
  {
    "date": "2026-02-10"
  }
  ```

### 정산 정보 구조

```typescript
{
  id: string
  date: string // 정산 날짜 (YYYY-MM-DD)
  total_orders: number // 총 주문 수
  total_revenue: number // 총 매출액
  completed_payments: number // 입금 완료 주문 수
  pending_payments: number // 입금 대기 주문 수
  location_breakdown: {
    'Kings Park': number
    'Eastern Creek': number
  }
  status: 'pending' | 'completed' // 정산 상태
  notes?: string // 정산 메모
  created_at: string
  updated_at: string
}
```

### 사용 예시

```typescript
import { createOrUpdateSettlement, getSettlement, completeSettlement } from '@/lib/firebase/settlements'

// 정산 정보 생성/업데이트
const settlement = await createOrUpdateSettlement('2026-02-10', '정산 메모')

// 정산 정보 조회
const settlement = await getSettlement('2026-02-10')

// 정산 완료 처리 (해당 날짜의 주문들도 자동으로 정산 완료로 표시)
await completeSettlement('2026-02-10')
```

## 향후 확장 계획

- [ ] 관리자 대시보드에 정산 정보 표시
- [ ] 정산 리포트 생성 및 다운로드
- [ ] 결제 모듈 연동 (PG사)
- [ ] 카카오톡 알림톡 API 연동
- [ ] 모바일 앱 개발 (React Native)
- [ ] 메뉴 관리 기능
- [ ] 리뷰 시스템
