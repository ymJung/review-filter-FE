# E2E Tests

이 디렉토리는 리뷰 플랫폼 애플리케이션의 End-to-End (E2E) 테스트를 포함합니다.

## 테스트 구조

### 인증 플로우 테스트 (`auth.spec.ts`)
- **사용자 회원가입 및 로그인**: 소셜 로그인 버튼 클릭, 인증 상태 변화 확인
- **세션 관리**: 페이지 새로고침 시 인증 상태 유지 확인
- **로그아웃 프로세스**: 로그아웃 후 비인증 상태로 전환 확인
- **역할별 콘텐츠 접근**: 사용자 역할에 따른 콘텐츠 표시 확인

### 리뷰 작성 플로우 테스트 (`review-flow.spec.ts`)
- **리뷰 작성 전체 플로우**: 폼 작성부터 제출까지 완전한 워크플로우
- **폼 검증**: 필수 필드 검증 및 에러 메시지 표시
- **이미지 업로드**: 결제 인증 이미지 업로드 및 검증
- **리뷰 상태 관리**: 작성 후 검수 대기 상태 확인
- **사용자 권한 업그레이드**: 첫 리뷰 작성 후 권한 변경 확인

### 관리자 검수 플로우 테스트 (`admin-moderation.spec.ts`)
- **관리자 대시보드 접근**: 관리자 권한 확인 및 대시보드 접근
- **리뷰 검수**: 대기 중인 리뷰 승인/거부 프로세스
- **사용자 관리**: 사용자 차단, 권한 변경 기능
- **통계 표시**: 시스템 통계 정보 표시 확인
- **벌크 작업**: 다중 선택 및 일괄 처리 기능

### 권한별 사용자 경험 테스트 (`user-permissions.spec.ts`)
- **비회원 (NOT_ACCESS)**: 제한된 콘텐츠 접근 및 로그인 유도
- **신규 회원 (LOGIN_NOT_AUTH)**: 리뷰 작성 유도 메시지 표시
- **인증 회원 (AUTH_LOGIN)**: 전체 콘텐츠 접근 가능
- **프리미엄 회원 (AUTH_PREMIUM)**: 광고 없는 경험 제공
- **차단 회원 (BLOCKED_LOGIN)**: 모든 기능 접근 차단
- **관리자 (ADMIN)**: 관리 기능 접근 가능

## 테스트 실행

### 기본 실행
```bash
# 모든 E2E 테스트 실행
npm run test:e2e

# 특정 브라우저에서 실행
npm run test:e2e -- --project=chromium

# 헤드리스 모드 해제 (브라우저 창 표시)
npm run test:e2e:headed
```

### 디버깅
```bash
# UI 모드로 실행 (테스트 선택 및 디버깅 가능)
npm run test:e2e:ui

# 디버그 모드로 실행
npm run test:e2e:debug

# 특정 테스트 파일만 실행
npx playwright test auth.spec.ts
```

### 테스트 결과 확인
```bash
# HTML 리포트 생성 및 열기
npx playwright show-report
```

## 테스트 환경 설정

### 개발 서버
- E2E 테스트는 `http://localhost:3000`에서 실행되는 개발 서버를 사용합니다
- `playwright.config.ts`의 `webServer` 설정으로 자동으로 개발 서버를 시작합니다

### 브라우저 지원
- **Chromium**: 기본 테스트 브라우저
- **Firefox**: 크로스 브라우저 호환성 확인
- **WebKit**: Safari 호환성 확인
- **Mobile**: 모바일 Chrome 및 Safari 테스트

### 테스트 데이터
- **Mock 인증**: localStorage를 사용한 모의 인증 시스템
- **API 모킹**: 네트워크 요청 인터셉트 및 모의 응답
- **테스트 픽스처**: `e2e/fixtures/` 디렉토리의 테스트 파일들

## 헬퍼 함수

### 인증 헬퍼 (`helpers/auth-helpers.ts`)
```typescript
// 특정 역할로 로그인
await loginAs(page, 'AUTH_LOGIN', '테스트사용자')

// 로그아웃
await logout(page)

// 현재 사용자 역할 확인
const role = await getCurrentUserRole(page)
```

### 폼 헬퍼 (`helpers/form-helpers.ts`)
```typescript
// 리뷰 폼 작성
await fillReviewForm(page, {
  title: '테스트 강의',
  content: '테스트 리뷰 내용',
  rating: '5'
})

// 폼 제출
await submitForm(page, '리뷰 작성')
```

### API 헬퍼 (`helpers/api-helpers.ts`)
```typescript
// API 응답 모킹
await mockReviewsAPI(page, sampleMockData.reviews)

// API 에러 모킹
await mockAPIError(page, '**/api/reviews', 500)
```

## 테스트 커버리지

### 기능 커버리지
- ✅ 사용자 인증 및 권한 관리
- ✅ 리뷰 작성 및 검수 프로세스
- ✅ 관리자 기능 및 사용자 관리
- ✅ 권한별 콘텐츠 접근 제어
- ✅ 에러 처리 및 사용자 경험

### 사용자 시나리오
- ✅ 신규 사용자 온보딩
- ✅ 리뷰 작성부터 공개까지
- ✅ 관리자 검수 워크플로우
- ✅ 권한 업그레이드 프로세스
- ✅ 차단 사용자 처리

### 브라우저 호환성
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari/WebKit
- ✅ 모바일 브라우저

## 주의사항

### Firebase 연동
- E2E 테스트는 실제 Firebase 서비스와 연동되어 실행됩니다
- 테스트 중 Firebase 권한 에러가 발생할 수 있으며, 이는 정상적인 동작입니다
- 프로덕션 환경에서는 Firebase 에뮬레이터 사용을 권장합니다

### 테스트 데이터
- 테스트는 모의 데이터를 사용하여 실제 데이터베이스에 영향을 주지 않습니다
- localStorage를 통한 모의 인증으로 실제 소셜 로그인 없이 테스트 가능합니다

### 성능 고려사항
- E2E 테스트는 실제 브라우저를 사용하므로 실행 시간이 길 수 있습니다
- CI/CD 환경에서는 병렬 실행을 제한하여 안정성을 확보합니다

## 문제 해결

### 일반적인 문제
1. **테스트 타임아웃**: `playwright.config.ts`에서 타임아웃 설정 조정
2. **요소를 찾을 수 없음**: 선택자 확인 및 대기 조건 추가
3. **네트워크 에러**: API 모킹 설정 확인

### 디버깅 팁
1. `--headed` 옵션으로 브라우저 창을 보면서 테스트
2. `page.pause()`로 특정 지점에서 테스트 일시정지
3. 스크린샷 및 비디오 녹화 기능 활용

이 E2E 테스트 suite는 애플리케이션의 전체적인 사용자 경험을 검증하고, 실제 사용자 관점에서의 기능 동작을 보장합니다.