# 배포 및 도메인 연결 가이드

## 1. Vercel을 이용한 배포 (추천)

Vercel은 Next.js 제작사에서 만든 플랫폼으로, 가장 간단하게 배포할 수 있습니다.

### 1-1. Vercel 계정 생성 및 프로젝트 연결

1. [Vercel](https://vercel.com)에 가입 (GitHub 계정으로 로그인 권장)
2. "Add New Project" 클릭
3. GitHub 저장소 연결 또는 프로젝트 업로드
4. 프로젝트 설정:
   - **Framework Preset**: Next.js (자동 감지)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (자동)
   - **Output Directory**: `.next` (자동)

### 1-2. 환경 변수 설정

Vercel 대시보드에서:
1. 프로젝트 선택 → Settings → Environment Variables
2. 다음 환경 변수 추가:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   NEXT_PUBLIC_FIREBASE_PROJECT_ID
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   NEXT_PUBLIC_FIREBASE_APP_ID
   ```
3. 각 환경(Production, Preview, Development)에 적용

### 1-3. 배포

1. "Deploy" 버튼 클릭
2. 배포 완료 후 `https://your-project.vercel.app` 형태의 URL 제공

## 2. 도메인 연결

### 2-1. 도메인 구매

도메인 구매 사이트:
- [Namecheap](https://www.namecheap.com)
- [GoDaddy](https://www.godaddy.com)
- [Google Domains](https://domains.google)
- [가비아](https://www.gabia.com) (한국)
- [후이즈](https://whois.co.kr) (한국)

### 2-2. Vercel에 도메인 추가

1. Vercel 대시보드 → 프로젝트 선택 → Settings → Domains
2. "Add Domain" 클릭
3. 구매한 도메인 입력 (예: `baobab.com` 또는 `www.baobab.com`)
4. Vercel이 DNS 설정 방법 안내

### 2-3. DNS 설정

도메인 제공업체의 DNS 설정에서:

**방법 1: CNAME 레코드 (서브도메인용)**
```
Type: CNAME
Name: www (또는 원하는 서브도메인)
Value: cname.vercel-dns.com
TTL: 3600
```

**방법 2: A 레코드 (루트 도메인용)**
```
Type: A
Name: @ (또는 비워둠)
Value: 76.76.21.21
TTL: 3600
```

Vercel 대시보드에서 정확한 DNS 값 확인 가능합니다.

### 2-4. SSL 인증서

- Vercel이 자동으로 Let's Encrypt SSL 인증서 발급
- HTTPS 자동 활성화 (약 24시간 소요)

## 3. Firebase 설정 업데이트

### 3-1. Firebase Console에서 승인된 도메인 추가

1. [Firebase Console](https://console.firebase.google.com) 접속
2. 프로젝트 선택 → Authentication → Settings → 승인된 도메인
3. 새 도메인 추가:
   - `your-domain.com`
   - `www.your-domain.com`
   - `your-project.vercel.app` (Vercel 기본 도메인)

### 3-2. Firestore 보안 규칙 업데이트

`firestore.rules` 파일의 프로덕션 규칙을 사용하도록 설정:

1. Firebase Console → Firestore Database → Rules
2. 프로덕션 규칙으로 업데이트 (필요시)

## 4. 다른 배포 옵션

### 4-1. Netlify

1. [Netlify](https://www.netlify.com) 가입
2. GitHub 저장소 연결
3. 빌드 설정:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. 환경 변수 추가
5. 도메인 연결

### 4-2. 자체 서버 (VPS)

**필요한 것:**
- VPS 서버 (AWS EC2, DigitalOcean, Linode 등)
- Node.js 18+ 설치
- PM2 또는 Docker 사용

**배포 단계:**

```bash
# 서버에 접속
ssh user@your-server-ip

# 프로젝트 클론
git clone https://github.com/your-username/your-repo.git
cd your-repo

# 의존성 설치
npm install

# 환경 변수 설정
nano .env.local
# 환경 변수 입력

# 빌드
npm run build

# PM2로 실행
npm install -g pm2
pm2 start npm --name "baobab" -- start
pm2 save
pm2 startup
```

**Nginx 설정:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**SSL 인증서 (Let's Encrypt):**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 5. 배포 체크리스트

- [ ] 환경 변수 모두 설정
- [ ] Firebase 승인된 도메인 추가
- [ ] Firestore 보안 규칙 확인
- [ ] 빌드 테스트 (`npm run build`)
- [ ] 프로덕션 모드 테스트 (`npm start`)
- [ ] 도메인 DNS 설정 완료
- [ ] SSL 인증서 발급 확인
- [ ] 모든 기능 테스트

## 6. 문제 해결

### 빌드 실패
- 환경 변수 확인
- `npm run build` 로컬에서 테스트
- Vercel 빌드 로그 확인

### 도메인 연결 안 됨
- DNS 전파 대기 (최대 48시간)
- DNS 설정 확인 (nslookup 또는 dig 명령어)
- Vercel 도메인 설정 확인

### Firebase 오류
- 승인된 도메인 목록 확인
- CORS 설정 확인
- Firestore 보안 규칙 확인

## 7. 추천 배포 플랫폼 비교

| 플랫폼 | 장점 | 단점 | 가격 |
|--------|------|------|------|
| **Vercel** | Next.js 최적화, 자동 배포, 무료 플랜 | 서버리스 함수 제한 | 무료~$20/월 |
| **Netlify** | 쉬운 설정, 좋은 무료 플랜 | Next.js 최적화 덜함 | 무료~$19/월 |
| **AWS Amplify** | AWS 통합, 확장성 | 설정 복잡 | 사용량 기반 |
| **자체 서버** | 완전한 제어 | 관리 필요, 서버 비용 | $5~$50/월 |

**추천**: Vercel (가장 간단하고 Next.js에 최적화됨)
