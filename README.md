# review-filter FE (FrontEnd)
* 강의 후기를 모으는 플랫폼을 개발한다.
* 로그인 사용자에게는 특정 액션 후 리뷰를 다 볼수 있는 혜택을 제공한다. 
* 인증된 사용자에게는 리뷰, 광고없는 모드를 제공한다.




## 기능
* 회원가입
    * 소셜 로그인(구글/카카오/네이버)
    * 랜덤 닉네임 자동 생성 (형용사+명사)
    * 약관 : 최소 개인정보만 수집
* 리뷰 공개 정책:
    * 일반가입 
        - 승인전 : 검수대기
        - 승인후 : 공개 (비회원은 요약만, 회원/작성자는 전체 열람 가능)
* 열람 제한 등급 관리
    * 기본
        - 일부 무료 미리보기 제공 (최초 1개만)
    * 전체 열람: 
        - 본인 리뷰 1개 이상 등록 
        - 프리미엄 결제(결제 연동 TBD, 광고 비노출 적용)
* 검수 기준: → 블라인드 처리
    * 욕설/비방
    * 광고성
    * 허위 결제 인증 

## 데이터 구조
실제 구현은 Firebase Firestore 컬렉션 기반입니다. 아래 표는 개념 설계이며, 구현 상 컬렉션은 다음과 같습니다: `users`, `courses`, `reviews`, `reviewImages`, `comments`, `roadmaps`, `reviewSummaries`.
* 강의테이블

|id|강의플랫폼|강의명|강사|카테고리|조회수| 
|---|---|---|---|---|---|
|number|text|text|text|text|number|
|pk|optional||optional|optional|0|
* 유저테이블

|id|social|uuid|닉네임|권한|
|---|---|---|---|---|
|number|text|text|text|text|
|pk|uk|uk|||

* 유저강의리뷰테이블

|id|리뷰id|유저id|리뷰내용|점수|공개상태|작성일시|수강시기|좋았던점|아쉬웠던점|수강후 변화,적용사례|추천대상|
|---|---|---|---|---|---|---|---|---|---|---|---|
|number|number|number|text|double|text|datetime|datetime|text|text|text|text|
|pk|fk|fk|||||optional|optional|optional|optional|optional|


* 유저강의리뷰인증파일테이블

|id|유저강의리뷰id|저장소url|
|---|---|---|
|number|number|text|
|pk|fk||

* 댓글테이블

|id|리뷰id|내용|공개상태|
|---|---|---|---|
|number|number|text|text|
|pk|fk|||

* 로드맵테이블

|id|로드맵소개|작성자id|강의id|next강의id|공개상태|로드맵소개|
|---|---|---|---|---|---|---|
|number|text|number|number|number|text|text|
|pk||fk|fk|optional||optional|

* 공개상태 (구현 코드 기준)

|코드|설명|
|---|---|
|PENDING|검수 대기|
|APPROVED|공개|
|REJECTED|거부(소프트 삭제 포함)|


* 권한타입

|권한명|코드|설명|분류|
|---|---|---|---|
|관리자|ADMIN|관리자|
|미로그인|NOT_ACCESS|로그인하지 않은 사용자|
|로그인+미인증|LOGIN_NOT_AUTH|로그인은 했지만 특별한액션없음|
|로그인+인증|AUTH_LOGIN|필수 액션을 한 상태 (1개이상 리뷰작성)|
|로그인+프리미엄|AUTH_PREMIUM|과금을 한 사용자|
|로그인+블록됨|BLOCKED_LOGIN|로그인, 블락됨-운영자에게 블락됨|


## 페이지 구성

|페이지|URL|기능|비고|
|---|---|---|---|
|메인|/|메인페이지||
|로그인|/login|소셜 로그인(구글/카카오/네이버)||
|네이버 콜백|/auth/naver/callback|네이버 OAuth 콜백 처리(팝업 메시지)|내부용|
|강의리뷰 목록|/reviews|리뷰 목록 페이지|
|강의리뷰 상세|/reviews/[id]|리뷰 상세 페이지|
|학습 로드맵 목록|/roadmaps|로드맵 목록 페이지|
|학습 로드맵 상세|/roadmaps/[id]|로드맵 상세 페이지|
|리뷰 작성|/write/review|리뷰 작성|
|로드맵 작성|/write/roadmap|로드맵 작성(수정은 `?edit=[id]`)|
|마이페이지|/mypage|내 활동 관리|
|관리자|/admin|검수/사용자/통계 관리|ADMIN 전용|

### 페이지별 상세 기능
* 메인 화면구성
    - 메인노출 
        * 인기 카테고리 - 최근 100개 이내 작성된 리뷰의 카테고리를 count 하여 인기카테고리를 판별한다.
        * 최근 리뷰 요약 - 최근 작성된 리뷰를 요약하여 보여준다. LLM API 를 호출하여 캐시된 요약을 조회한다.
    - 상단 : 메뉴 네비게이션 
    - 푸터 : 회사소개 / 약관 / 개인정보처리방침 등 
* 로그인
    - 소셜 인증 로그인(구글/카카오/네이버)
    - 네이버: 팝업 + `/auth/naver/callback` 경유, 서버 프록시(`/api/auth/naver/profile`)로 프로필 조회(CORS 회피)
    - 최소한의 정보를 저장 (platform / uuid / nickname)
* 강의리뷰
    - 권한별로 차등 노출함
    * NOT_ACCESS | LOGIN_NOT_AUTH
        - 승인된 리뷰 1개 미리보기 노출(전체 본문은 제한) 
    * AUTH_LOGIN | AUTH_PREMIUM
        - 리뷰 전체 노출
    * BLOCKED_LOGIN
        - 아무것도 보이지 않음
    
    * 리뷰 작성
        * 강의 플랫폼 에서 수강 완료를 인증한 강의를 리뷰함
            1. 강의 정보 입력
            2. 리뷰 내용 작성
            3. 결제 인증 이미지 업로드 필수 
                - 저장소: Firebase Storage 업로드(서버 API `/api/upload` 사용)
                - 형식: 이미지(JPEG, JPG, PNG, GIF, HEIC), 최대 5MB
                - 서버에서 토큰 URL 발급 및 Firestore에 메타데이터 저장
    * 리뷰 상세 조회
        - 리뷰 상세 조회
        * 댓글 달기

* 학습 로드맵
    * 조회
        - 유저/관리자가 작성한 학습 로드맵
        - 제한 등급일 경우 목록에서 최대 3개 미리보기 노출
    * 로드맵 작성
        * 강의 하나를 들으면 다음 어떤걸 들으면 좋을지 로드맵을 작성
            1. 강의 정보 입력 , 다음 강의 정보를 입력

* 마이페이지
    * 내가 작성한 리뷰 갯수
        - 선택 시 리뷰 목록
            * 리뷰 검수 상태 표시
    * 내가 작성한 로드맵 갯수
        - 선택 시 로드맵 목록
    * 프로필 영역:
        * 내 닉네임
        * 현재 등급

* 어드민 관리
    * 유저 블락 관리하기
    * 리뷰글 블락 관리하기
    * 로드맵 블락 관리하기


### API 설계
> 기본 구조는 json 메시지 포맷의  API 통신으로 이루어진다.

* 메인
    * GET /
    * response (미로그인)
        * 가려진 강의 목록
        * 인기카테고리
        * 최근 리뷰요약
    * response (로그인)
        * 전체 강의 목록
        * 인기카테고리
        * 최근 리뷰요약

* 로그인
    * POST /api/auth/create-token

* 강의리뷰
    * GET /reviews
        * 리뷰 목록
    * GET /reviews/{review-id}
        * 리뷰 상세
    * POST /reviews
        * 리뷰 작성

* 학습 로드맵
    * GET /roadmaps
        * 로드맵 목록
    * GET /roadmaps/{roadmap-id}
        * 로드맵 상세 조회
    * POST /roadmaps
        * 로드맵 작성
* 관리자모드
    * GET /admin/reviews
        * 리뷰 목록 조회
    * POST /admin/reviews/{review-id}
        * 리뷰 관리
    * GET /admin/roadmaps
        * 로드맵 목록 조회
    * POST /admin/roadmaps/{roadmap-id}
        * 로드맵 관리
    * GET /admin/users
        * 유저 목록 조회
    * POST /admin/users/{user-id}
        * 유저 관리
    * GET /admin/stats
        * 관리자 대시보드 통계 조회

* 사용자
    * GET /users/me/stats, /users/me/reviews, /users/me/roadmaps
        * 마이페이지용 개인 통계 및 나의 콘텐츠 조회

* 카테고리/요약/업로드/헬스체크 등
    * GET /categories/stats - 인기 카테고리 집계
    * POST /summaries/generate - 리뷰 요약 생성(OpenAI)
    * POST /upload - 인증 이미지 업로드(Firebase Storage)
    * GET /health, /health/openai, /health/firebase - 시스템/서드파티 헬스 체크
    * GET /monitoring/health - 모니터링 엔드포인트
    * GET /cron/* - 요약 만료 정리/데일리 요약(서버 라우트)

## 외부 서비스 연동
* Firebase: 인증, 데이터베이스, 스토리지
* Google/Kakao/Naver Developers: 소셜 로그인
* OpenAI: 리뷰 요약 생성

## 개발 환경 설정

### 빠른 시작
```bash
# 개발 환경 자동 설정
npm run setup:dev

# Firebase 에뮬레이터 시작 (별도 터미널)
npm run emulators:start

# 개발 서버 실행
npm run dev
```

### 수동 설정
```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 실제 값 입력

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

### 테스트
```bash
# 단위 테스트
npm run test:unit

# 통합 테스트
npm run test:integration

# E2E 테스트
npm run test:e2e

# 모든 테스트
npm test
```

## 🚀 배포

### 배포 전 준비사항

#### 1. 환경 변수 설정
다음 환경 변수들이 Vercel Dashboard에 설정되어 있어야 합니다:

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

**기타:**
- `OPENAI_API_KEY`
- `NODE_ENV=production`

#### 2. Firebase 설정
```bash
# Firebase 프로젝트 설정
firebase use production

# 프로덕션용 보안 규칙 적용
cp firestore.rules.prod firestore.rules

# Firebase 규칙 및 인덱스 배포
firebase deploy --only firestore:rules,storage:rules,firestore:indexes
```

### 자동 배포 (권장)
```bash
# 전체 배포 스크립트 실행
./scripts/deploy.sh
```

이 스크립트는 다음 작업을 자동으로 수행합니다:
- 환경 변수 검증
- 테스트 실행
- 애플리케이션 빌드
- Firebase 규칙 및 인덱스 배포
- Vercel 프로덕션 배포

### 수동 배포
```bash
# 1. 빌드 테스트
npm run build

# 2. Firebase 배포
firebase deploy --only firestore:rules,storage:rules,firestore:indexes

# 3. Vercel 배포
vercel --prod
```

### 배포 후 확인사항
- [ ] 홈페이지 로딩 확인
- [ ] 소셜 로그인 동작 확인
- [ ] 리뷰/로드맵 작성 및 조회 확인
- [ ] 관리자 기능 확인
- [ ] 헬스체크 엔드포인트 확인: `/api/health`

### 모니터링
배포된 애플리케이션은 다음 엔드포인트를 통해 상태를 모니터링할 수 있습니다:
- **전체 상태**: `/api/health`
- **Firebase 연결**: `/api/health/firebase`
- **OpenAI 연결**: `/api/health/openai`

### 문제 해결
배포 관련 문제가 발생하면 다음 문서들을 참조하세요:
- [배포 체크리스트](./DEPLOYMENT_CHECKLIST.md) - 단계별 배포 가이드
- [배포 가이드](./docs/DEPLOYMENT.md) - 상세 배포 문서
- [테스트 및 배포 가이드](./TESTING_DEPLOYMENT_GUIDE.md) - 테스트 방법

## 아키텍쳐
### 기술 스택
* **Frontend**: TypeScript, Next.js 14 (App Router)
* **Database**: Firebase Firestore
* **Storage**: Firebase Storage (이미지 업로드/토큰 URL)
* **Authentication**: 소셜 로그인 (Google/Kakao/Naver)
* **AI/ML**: OpenAI API (리뷰 요약)
* **Hosting**: Vercel (또는 Firebase Hosting)





### 시스템 아키텍처 다이어그램
- [시스템 아키텍처](./mermaid.architecture.md)
- [사용자 플로우](./mermaid.flow.md)

## 개발 진행 상황

이 프로젝트는 체계적인 개발을 위해 Spec 기반 개발 방법론을 사용합니다.

### 📋 개발 문서
- [요구사항 문서](./.kiro/specs/review-platform-implementation/requirements.md) - 기능별 상세 요구사항 및 승인 기준
- [설계 문서](./.kiro/specs/review-platform-implementation/design.md) - 시스템 아키텍처 및 컴포넌트 설계
- [구현 작업 목록](./.kiro/specs/review-platform-implementation/tasks.md) - 23개 단계별 구현 체크리스트

### 🚀 구현 단계
구현은 다음 순서로 진행됩니다:

1. **기반 설정** (1-2단계): 프로젝트 초기 설정 및 타입 정의
2. **인증 시스템** (3-4단계): Firebase 인증 및 사용자 관리
3. **기본 UI** (5-6단계): 레이아웃 및 권한 제어
4. **핵심 기능** (7-12단계): 리뷰, 댓글, 로드맵 기능
5. **고급 기능** (13-15단계): AI 요약, 관리자 기능
6. **품질 보장** (16-21단계): 보안, 성능, 테스트
7. **배포 및 운영** (22-23단계): 배포 설정 및 최종 검증

### 📊 현재 진행률
- [x] 기반 설정 (2/2) ✅
- [x] 인증 시스템 (2/2) ✅
- [x] 기본 UI (2/2) ✅
- [x] 핵심 기능 (6/6) ✅
- [x] 고급 기능 (3/3) ✅
- [x] 품질 보장 (6/6) ✅
- [x] 배포 및 운영 (2/2) ✅

**전체 진행률: 23/23 (100%) 🎉**

### 🎯 배포 준비 완료
프로젝트가 프로덕션 배포 준비를 완료했습니다:
- ✅ 빌드 오류 수정 완료
- ✅ TypeScript 타입 안정성 확보
- ✅ 프로덕션용 보안 규칙 준비
- ✅ 자동 배포 스크립트 구성
- ✅ 모니터링 및 헬스체크 시스템 구축

각 작업을 완료할 때마다 위 체크리스트를 업데이트하여 진행 상황을 추적할 수 있습니다.
