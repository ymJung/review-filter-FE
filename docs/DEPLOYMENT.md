# 배포 가이드

## 개요

이 문서는 Review Platform의 프로덕션 배포 과정을 설명합니다.

## 사전 준비사항

### 1. 필수 계정 및 서비스
- [Vercel](https://vercel.com) 계정
- [Firebase](https://firebase.google.com) 프로젝트
- [OpenAI](https://openai.com) API 키
- 도메인 (선택사항)

### 2. 로컬 개발 환경
- Node.js 18 이상
- npm 또는 yarn
- Firebase CLI
- Vercel CLI

## 배포 단계

### 1단계: Firebase 프로젝트 설정

1. Firebase Console에서 새 프로젝트 생성
2. Authentication 활성화 및 소셜 로그인 설정
3. Firestore Database 생성
4. Storage 설정
5. 서비스 계정 키 생성

```bash
# Firebase CLI 로그인
firebase login

# 프로젝트 초기화 (이미 완료됨)
firebase init

# Firebase 프로젝트 설정
firebase use --add
```

### 2단계: 환경 변수 설정

#### Vercel 환경 변수 설정
Vercel Dashboard에서 다음 환경 변수를 설정하세요:

**Firebase 설정:**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

**소셜 로그인:**
- `NEXT_PUBLIC_KAKAO_CLIENT_ID`
- `NEXT_PUBLIC_NAVER_CLIENT_ID`

**OpenAI:**
- `OPENAI_API_KEY`

**기타:**
- `NODE_ENV=production`

### 3단계: Vercel 배포

#### 자동 배포 (권장)
1. GitHub 저장소를 Vercel에 연결
2. 환경 변수 설정
3. 자동 배포 활성화

#### 수동 배포
```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 배포
vercel --prod
```

### 4단계: Firebase 규칙 및 인덱스 배포

```bash
# Firestore 규칙 배포
firebase deploy --only firestore:rules

# Storage 규칙 배포
firebase deploy --only storage:rules

# 인덱스 배포
firebase deploy --only firestore:indexes

# 모든 Firebase 설정 배포
firebase deploy
```

### 5단계: 도메인 설정 (선택사항)

#### Vercel에서 커스텀 도메인 설정
1. Vercel Dashboard → Project → Settings → Domains
2. 도메인 추가
3. DNS 설정 (A 레코드 또는 CNAME)
4. SSL 인증서 자동 발급 확인

#### DNS 설정 예시
```
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 6단계: 모니터링 설정

#### Vercel Analytics
```javascript
// next.config.js에 추가
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
}
```

#### Sentry 설정 (선택사항)
```bash
npm install @sentry/nextjs
```

## 배포 스크립트 사용

프로젝트에 포함된 배포 스크립트를 사용할 수 있습니다:

```bash
# 전체 배포 (테스트 포함)
./scripts/deploy.sh

# 테스트 스킵
SKIP_TESTS=true ./scripts/deploy.sh

# Firebase 배포 스킵
SKIP_FIREBASE=true ./scripts/deploy.sh
```

## 배포 후 확인사항

### 1. 기능 테스트
- [ ] 소셜 로그인 동작 확인
- [ ] 리뷰 작성 및 조회 확인
- [ ] 이미지 업로드 확인
- [ ] 관리자 기능 확인
- [ ] 권한별 접근 제어 확인

### 2. 성능 테스트
- [ ] 페이지 로딩 속도 (< 3초)
- [ ] Core Web Vitals 확인
- [ ] 이미지 최적화 확인

### 3. 보안 테스트
- [ ] HTTPS 연결 확인
- [ ] 보안 헤더 확인
- [ ] Firebase 규칙 테스트

## 트러블슈팅

### 일반적인 문제들

#### 1. 환경 변수 오류
```
Error: Firebase configuration is missing
```
**해결방법:** Vercel Dashboard에서 환경 변수가 올바르게 설정되었는지 확인

#### 2. Firebase 권한 오류
```
Error: Missing or insufficient permissions
```
**해결방법:** Firebase 규칙과 서비스 계정 권한 확인

#### 3. 빌드 오류
```
Error: Module not found
```
**해결방법:** 의존성 설치 및 타입 정의 확인

### 로그 확인 방법

#### Vercel 로그
```bash
vercel logs [deployment-url]
```

#### Firebase 로그
```bash
firebase functions:log
```

## 롤백 절차

### Vercel 롤백
1. Vercel Dashboard → Deployments
2. 이전 배포 선택
3. "Promote to Production" 클릭

### Firebase 롤백
```bash
# 이전 규칙으로 롤백 (수동)
firebase deploy --only firestore:rules
```

## 모니터링 및 알림

### 권장 모니터링 도구
- Vercel Analytics (기본 제공)
- Google Analytics (선택사항)
- Sentry (에러 추적)
- Uptime Robot (가동시간 모니터링)

### 알림 설정
- Vercel 배포 알림
- Firebase 사용량 알림
- 에러 발생 시 Slack/이메일 알림

## 보안 고려사항

### 1. 환경 변수 보안
- 민감한 정보는 Vercel 환경 변수로만 관리
- `.env` 파일을 Git에 커밋하지 않음
- 정기적인 API 키 로테이션

### 2. Firebase 보안
- 최소 권한 원칙 적용
- 정기적인 보안 규칙 검토
- 사용자 입력 검증 강화

### 3. 네트워크 보안
- HTTPS 강제 사용
- 적절한 CORS 설정
- 보안 헤더 설정

## 성능 최적화

### 1. 이미지 최적화
- Next.js Image 컴포넌트 사용
- WebP/AVIF 형식 지원
- 적절한 캐싱 설정

### 2. 코드 최적화
- 번들 크기 최소화
- 코드 스플리팅 활용
- 트리 쉐이킹 적용

### 3. 데이터베이스 최적화
- 적절한 인덱스 설정
- 쿼리 최적화
- 캐싱 전략 구현

## 지속적인 개선

### 1. 정기적인 업데이트
- 의존성 업데이트
- 보안 패치 적용
- 성능 모니터링

### 2. 백업 및 복구
- 정기적인 데이터 백업
- 복구 절차 테스트
- 재해 복구 계획 수립

## 연락처 및 지원

배포 관련 문제가 발생하면 다음을 확인하세요:
1. 이 문서의 트러블슈팅 섹션
2. 프로젝트 README.md
3. 각 서비스의 공식 문서

---

**참고:** 이 가이드는 프로덕션 환경 배포를 위한 것입니다. 개발 환경 설정은 README.md를 참조하세요.