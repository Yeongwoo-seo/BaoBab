# GitHub 저장소 생성 및 푸시 가이드

## 1. GitHub에서 새 저장소 생성

1. [GitHub](https://github.com)에 로그인
2. 우측 상단 "+" 버튼 클릭 → "New repository" 선택
3. 저장소 설정:
   - **Repository name**: `baobab` (또는 원하는 이름)
   - **Description**: "Bao Bab order management system"
   - **Visibility**: Public 또는 Private 선택
   - **⚠️ 중요**: "Initialize this repository with a README" 체크하지 않기
   - "Create repository" 클릭

## 2. 로컬 저장소와 연결

GitHub에서 저장소를 생성한 후, 아래 명령어를 실행하세요:

```bash
cd "c:\Users\kjaso\OneDrive\Desktop\Projects\4. Bao Bab"
git remote add origin https://github.com/YOUR_USERNAME/baobab.git
git branch -M main
git push -u origin main
```

**주의**: `YOUR_USERNAME`을 본인의 GitHub 사용자명으로 변경하세요.

## 3. 인증 방법

### 방법 1: Personal Access Token (추천)

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" 클릭
3. 권한 선택:
   - `repo` (전체 체크)
4. 토큰 생성 후 복사
5. 푸시할 때 비밀번호 대신 토큰 입력

### 방법 2: GitHub CLI

```bash
gh auth login
```

### 방법 3: SSH 키 사용

```bash
# SSH 키 생성 (이미 있다면 생략)
ssh-keygen -t ed25519 -C "your_email@example.com"

# 공개 키를 GitHub에 추가
# GitHub → Settings → SSH and GPG keys → New SSH key
# ~/.ssh/id_ed25519.pub 내용 복사하여 추가

# 원격 저장소를 SSH로 변경
git remote set-url origin git@github.com:YOUR_USERNAME/baobab.git
```

## 4. 푸시 완료 확인

푸시가 성공하면 GitHub 저장소 페이지에서 모든 파일이 보여야 합니다.

## 5. 다음 단계

저장소가 생성되면:
- Vercel에서 GitHub 저장소 연결하여 자동 배포 설정
- 협업자 초대 (필요시)
- Issues, Projects 등 활용
