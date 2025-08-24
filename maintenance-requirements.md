# 유지보수용 요구사항 및 파일 매핑 문서

## 소개

강의 후기를 모으는 플랫폼으로, 사용자들이 강의 리뷰를 작성하고 공유할 수 있는 웹 애플리케이션입니다. 소셜 로그인을 통한 회원가입, 권한별 차등 콘텐츠 제공, 리뷰 검수 시스템, 학습 로드맵 기능을 포함합니다. Next.js 14와 Firebase를 기반으로 구축되며, OpenAI API를 활용한 리뷰 요약 기능을 제공합니다.

이 문서는 각 요구사항별로 관련된 파일들을 매핑하여 유지보수 시 참고할 수 있도록 작성되었습니다.

## 요구사항별 파일 매핑

### Requirement 1: 사용자 인증 및 회원가입
**구현 Task:** Task 3, 4

**관련 파일:**
- `src/lib/firebase/auth.ts` - Firebase 인증 설정
- `src/contexts/AuthContext.tsx` - 인증 상태 관리
- `src/components/auth/` - 로그인/로그아웃 컴포넌트
- `src/lib/services/userService.ts` - 사용자 관리 서비스
- `src/app/api/auth/` - 인증 관련 API 라우트

**User Story:** 사용자로서 소셜 로그인을 통해 간편하게 회원가입하고 로그인할 수 있어야 하며, 자동으로 생성된 닉네임을 받고 싶습니다.

#### Acceptance Criteria
1. WHEN 사용자가 카카오 로그인 버튼을 클릭 THEN 시스템은 카카오 OAuth 인증 페이지로 리다이렉트 SHALL 수행
2. WHEN 사용자가 네이버 로그인 버튼을 클릭 THEN 시스템은 네이버 OAuth 인증 페이지로 리다이렉트 SHALL 수행
3. WHEN 소셜 로그인이 성공 THEN 시스템은 형용사+명사 형태의 랜덤 닉네임을 자동 생성 SHALL 수행
4. WHEN 신규 사용자가 로그인 THEN 시스템은 사용자 정보(platform, uuid, nickname)를 Firebase에 저장 SHALL 수행
5. WHEN 기존 사용자가 로그인 THEN 시스템은 기존 사용자 정보를 조회하여 로그인 처리 SHALL 수행

### Requirement 2: 메인 페이지 및 네비게이션
**구현 Task:** Task 5, 14

**관련 파일:**
- `src/app/page.tsx` - 메인 페이지
- `src/components/layout/Header.tsx` - 네비게이션 바
- `src/components/layout/Footer.tsx` - 푸터
- `src/components/home/` - 메인 페이지 컴포넌트들
- `src/app/api/stats/` - 통계 API

**User Story:** 사용자로서 메인 페이지에서 인기 카테고리와 최근 리뷰 요약을 확인하고, 사이트 전체를 쉽게 탐색할 수 있어야 합니다.

#### Acceptance Criteria
1. WHEN 사용자가 메인 페이지에 접속 THEN 시스템은 최근 100개 리뷰의 카테고리 통계를 기반으로 인기 카테고리를 표시 SHALL 수행
2. WHEN 사용자가 메인 페이지에 접속 THEN 시스템은 OpenAI API를 통해 생성된 최근 리뷰 요약을 표시 SHALL 수행
3. WHEN 사용자가 메인 페이지에 접속 THEN 시스템은 상단에 메뉴 네비게이션(리뷰, 로드맵, 글쓰기, 마이페이지)을 표시 SHALL 수행
4. WHEN 사용자가 메인 페이지에 접속 THEN 시스템은 하단에 푸터(회사소개, 약관, 개인정보처리방침)를 표시 SHALL 수행

### Requirement 3: 권한별 콘텐츠 접근 제어
**구현 Task:** Task 6

**관련 파일:**
- `src/lib/auth/permissions.ts` - 권한 관리 로직
- `src/components/auth/ProtectedRoute.tsx` - 보호된 라우트 컴포넌트
- `src/hooks/useAuth.ts` - 인증 상태 훅
- `src/lib/services/userService.ts` - 사용자 권한 서비스

**User Story:** 사용자로서 내 권한 등급에 따라 적절한 수준의 콘텐츠에 접근할 수 있어야 하며, 더 많은 콘텐츠를 보기 위한 방법을 알 수 있어야 합니다.

#### Acceptance Criteria
1. WHEN 미로그인 사용자가 리뷰를 조회 THEN 시스템은 최상위 1개 리뷰만 표시 SHALL 수행
2. WHEN 로그인했지만 미인증 사용자가 리뷰를 조회 THEN 시스템은 최상위 1개 리뷰만 표시 SHALL 수행
3. WHEN 인증된 사용자(1개 이상 리뷰 작성)가 리뷰를 조회 THEN 시스템은 모든 리뷰를 표시 SHALL 수행
4. WHEN 프리미엄 사용자가 리뷰를 조회 THEN 시스템은 모든 리뷰를 광고 없이 표시 SHALL 수행
5. WHEN 블록된 사용자가 리뷰를 조회 THEN 시스템은 아무 콘텐츠도 표시하지 않음 SHALL 수행

### Requirement 4: 리뷰 작성 및 관리
**구현 Task:** Task 8

**관련 파일:**
- `src/app/write/review/page.tsx` - 리뷰 작성 페이지
- `src/components/review/ReviewForm.tsx` - 리뷰 작성 폼
- `src/app/api/reviews/route.ts` - 리뷰 API
- `src/lib/services/reviewService.ts` - 리뷰 서비스
- `src/lib/utils/imageOptimization.ts` - 이미지 최적화
- `src/lib/utils/validation.ts` - 데이터 검증

**User Story:** 사용자로서 수강한 강의에 대한 상세한 리뷰를 작성하고, 결제 인증을 통해 신뢰성을 보장하며, 내가 작성한 리뷰의 상태를 확인할 수 있어야 합니다.

#### Acceptance Criteria
1. WHEN 사용자가 리뷰 작성 페이지에 접속 THEN 시스템은 강의 정보 입력 폼(플랫폼, 강의명, 강사, 카테고리)을 표시 SHALL 수행
2. WHEN 사용자가 리뷰를 작성 THEN 시스템은 리뷰 내용, 점수, 수강시기, 좋았던점, 아쉬웠던점, 수강후 변화, 추천대상 입력을 요구 SHALL 수행
3. WHEN 사용자가 리뷰를 작성 THEN 시스템은 결제 인증 이미지 업로드(JPEG, JPG, PNG, GIF, HEIC, 최대 5MB)를 필수로 요구 SHALL 수행
4. WHEN 이미지가 업로드 THEN 시스템은 이미지를 압축하고 로컬스토리지에 저장 SHALL 수행
5. WHEN 리뷰가 제출 THEN 시스템은 리뷰 상태를 '검수대기'로 설정 SHALL 수행
6. WHEN 사용자가 첫 번째 리뷰를 작성 완료 THEN 시스템은 사용자 권한을 'AUTH_LOGIN'으로 업데이트 SHALL 수행

### Requirement 5: 리뷰 조회 및 상호작용
**구현 Task:** Task 9, 10

**관련 파일:**
- `src/app/reviews/page.tsx` - 리뷰 목록 페이지
- `src/app/reviews/[id]/page.tsx` - 리뷰 상세 페이지
- `src/components/review/ReviewCard.tsx` - 리뷰 카드 컴포넌트
- `src/components/review/ReviewList.tsx` - 리뷰 목록 컴포넌트
- `src/components/comment/CommentSection.tsx` - 댓글 섹션
- `src/app/api/comments/route.ts` - 댓글 API

**User Story:** 사용자로서 다른 사용자들의 리뷰를 상세히 읽고, 댓글을 통해 소통할 수 있어야 합니다.

#### Acceptance Criteria
1. WHEN 사용자가 리뷰 목록 페이지에 접속 THEN 시스템은 권한에 따라 적절한 리뷰 목록을 표시 SHALL 수행
2. WHEN 사용자가 특정 리뷰를 클릭 THEN 시스템은 리뷰 상세 페이지로 이동 SHALL 수행
3. WHEN 사용자가 리뷰 상세 페이지에 접속 THEN 시스템은 리뷰 전체 내용과 댓글 섹션을 표시 SHALL 수행
4. WHEN 로그인한 사용자가 댓글을 작성 THEN 시스템은 댓글을 저장하고 '검수대기' 상태로 설정 SHALL 수행
5. WHEN 댓글이 승인 THEN 시스템은 댓글을 공개 상태로 변경하여 표시 SHALL 수행

### Requirement 6: 학습 로드맵 기능
**구현 Task:** Task 11, 11.1-11.5

**관련 파일:**
- `src/app/roadmaps/page.tsx` - 로드맵 목록 페이지
- `src/app/roadmaps/[id]/page.tsx` - 로드맵 상세 페이지
- `src/app/write/roadmap/page.tsx` - 로드맵 작성 페이지
- `src/components/roadmap/RoadmapForm.tsx` - 로드맵 작성 폼
- `src/components/roadmap/RoadmapCard.tsx` - 로드맵 카드 컴포넌트
- `src/app/api/roadmaps/route.ts` - 로드맵 API
- `src/app/api/roadmaps/[id]/route.ts` - 로드맵 개별 API
- `src/lib/services/roadmapService.ts` - 로드맵 서비스

**User Story:** 사용자로서 강의 간의 연관성을 파악하고 학습 경로를 계획할 수 있도록 로드맵을 조회하고 작성할 수 있어야 합니다.

#### Acceptance Criteria
1. WHEN 사용자가 로드맵 목록 페이지에 접속 THEN 시스템은 공개된 로드맵 목록을 표시 SHALL 수행
2. WHEN 사용자가 로드맵 작성 페이지에 접속 THEN 시스템은 현재 강의와 다음 강의 정보 입력 폼을 표시 SHALL 수행
3. WHEN 사용자가 로드맵을 작성 THEN 시스템은 로드맵 소개, 강의 연결 정보를 저장 SHALL 수행
4. WHEN 로드맵이 제출 THEN 시스템은 로드맵 상태를 '검수대기'로 설정 SHALL 수행
5. WHEN 사용자가 특정 로드맵을 클릭 THEN 시스템은 로드맵 상세 정보와 연결된 강의들을 표시 SHALL 수행

### Requirement 7: 마이페이지 및 사용자 관리
**구현 Task:** Task 12

**관련 파일:**
- `src/app/mypage/page.tsx` - 마이페이지
- `src/components/mypage/UserProfile.tsx` - 사용자 프로필 컴포넌트
- `src/components/mypage/UserStats.tsx` - 사용자 통계 컴포넌트
- `src/app/api/users/[id]/stats/route.ts` - 사용자 통계 API

**User Story:** 사용자로서 내가 작성한 콘텐츠를 관리하고, 현재 권한 상태를 확인할 수 있어야 합니다.

#### Acceptance Criteria
1. WHEN 사용자가 마이페이지에 접속 THEN 시스템은 현재 닉네임과 권한 등급을 표시 SHALL 수행
2. WHEN 사용자가 마이페이지에 접속 THEN 시스템은 작성한 리뷰 개수와 목록 링크를 표시 SHALL 수행
3. WHEN 사용자가 마이페이지에 접속 THEN 시스템은 작성한 로드맵 개수와 목록 링크를 표시 SHALL 수행
4. WHEN 사용자가 내 리뷰 목록을 클릭 THEN 시스템은 작성한 리뷰들과 각각의 검수 상태를 표시 SHALL 수행
5. WHEN 사용자가 내 로드맵 목록을 클릭 THEN 시스템은 작성한 로드맵들과 각각의 검수 상태를 표시 SHALL 수행

### Requirement 8: 관리자 기능
**구현 Task:** Task 15

**관련 파일:**
- `src/app/admin/page.tsx` - 관리자 대시보드
- `src/components/admin/AdminDashboard.tsx` - 관리자 대시보드 컴포넌트
- `src/components/admin/ReviewModeration.tsx` - 리뷰 검수 컴포넌트
- `src/components/admin/UserManagement.tsx` - 사용자 관리 컴포넌트
- `src/components/admin/MonitoringDashboard.tsx` - 모니터링 대시보드
- `src/app/api/admin/` - 관리자 API 라우트들

**User Story:** 관리자로서 사용자가 작성한 콘텐츠를 검수하고, 부적절한 사용자나 콘텐츠를 관리할 수 있어야 합니다.

#### Acceptance Criteria
1. WHEN 관리자가 관리자 페이지에 접속 THEN 시스템은 검수 대기 중인 리뷰 목록을 표시 SHALL 수행
2. WHEN 관리자가 리뷰를 승인 THEN 시스템은 리뷰 상태를 '공개'로 변경하고 검수 완료 후 인증 이미지를 삭제 SHALL 수행
3. WHEN 관리자가 리뷰를 거부 THEN 시스템은 리뷰 상태를 '비공개'로 변경 SHALL 수행
4. WHEN 관리자가 사용자를 블록 THEN 시스템은 사용자 권한을 'BLOCKED_LOGIN'으로 변경 SHALL 수행
5. WHEN 관리자가 로드맵을 검수 THEN 시스템은 로드맵 상태를 '공개' 또는 '비공개'로 설정 SHALL 수행

### Requirement 9: AI 기반 리뷰 요약
**구현 Task:** Task 13

**관련 파일:**
- `src/lib/openai/client.ts` - OpenAI 클라이언트
- `src/app/api/summaries/route.ts` - 요약 API
- `src/lib/services/summaryService.ts` - 요약 서비스
- `src/components/home/ReviewSummary.tsx` - 리뷰 요약 컴포넌트
- `src/app/api/cron/generate-daily-summaries/route.ts` - 일일 요약 생성 크론잡

**User Story:** 사용자로서 최근 리뷰들의 핵심 내용을 빠르게 파악할 수 있도록 AI가 생성한 요약을 확인할 수 있어야 합니다.

#### Acceptance Criteria
1. WHEN 새로운 리뷰가 공개 상태로 변경 THEN 시스템은 OpenAI API를 호출하여 리뷰 요약을 생성 SHALL 수행
2. WHEN 리뷰 요약이 생성 THEN 시스템은 요약을 캐시하여 저장 SHALL 수행
3. WHEN 사용자가 메인 페이지에 접속 THEN 시스템은 캐시된 최신 리뷰 요약들을 표시 SHALL 수행
4. IF 요약 생성에 실패 THEN 시스템은 기본 텍스트 요약을 표시 SHALL 수행

### Requirement 10: 데이터 관리 및 성능
**구현 Task:** Task 16, 17, 18

**관련 파일:**
- `firestore.rules` - Firestore 보안 규칙
- `storage.rules` - Storage 보안 규칙
- `firestore.indexes.json` - Firestore 인덱스
- `src/lib/utils/errorHandler.ts` - 에러 처리 유틸리티
- `src/lib/utils/performance.ts` - 성능 최적화 유틸리티
- `src/lib/utils/cache.ts` - 캐싱 유틸리티
- `src/components/ui/ErrorBoundary.tsx` - 에러 바운더리
- `src/components/ui/Loading.tsx` - 로딩 컴포넌트
- `src/components/ui/Skeleton.tsx` - 스켈레톤 UI
- `src/lib/monitoring/` - 모니터링 관련 파일들

**User Story:** 시스템 사용자로서 빠르고 안정적인 서비스를 이용할 수 있어야 하며, 데이터가 안전하게 보관되어야 합니다.

#### Acceptance Criteria
1. WHEN 사용자가 페이지를 로드 THEN 시스템은 3초 이내에 콘텐츠를 표시 SHALL 수행
2. WHEN 이미지가 업로드 THEN 시스템은 5MB 이하로 압축하여 저장 SHALL 수행
3. WHEN 데이터베이스 쿼리가 실행 THEN 시스템은 적절한 인덱싱을 통해 빠른 응답을 제공 SHALL 수행
4. WHEN 사용자 데이터가 저장 THEN 시스템은 Firebase 보안 규칙을 통해 데이터를 보호 SHALL 수행
5. WHEN 시스템 오류가 발생 THEN 시스템은 적절한 에러 메시지와 함께 복구 방안을 제시 SHALL 수행

## 테스트 관련 파일

### 단위 테스트 (Task 19)
- `src/lib/utils/__tests__/` - 유틸리티 함수 테스트
- `src/components/ui/__tests__/` - UI 컴포넌트 테스트
- `src/lib/services/__tests__/` - 서비스 레이어 테스트
- `src/app/api/**/__tests__/` - API 라우트 테스트

### 통합 테스트 (Task 20)
- `src/__tests__/integration/` - 통합 테스트 파일들
- `jest.integration.config.js` - 통합 테스트 설정
- `jest.integration.setup.js` - 통합 테스트 셋업
- `jest.integration.teardown.js` - 통합 테스트 정리

### E2E 테스트 (Task 21)
- `e2e/` - E2E 테스트 파일들
- `e2e/helpers/` - E2E 테스트 헬퍼 함수들
- `playwright.config.ts` - Playwright 설정

## 배포 및 설정 파일

### 배포 설정 (Task 22)
- `vercel.json` - Vercel 배포 설정
- `firebase.json` - Firebase 프로젝트 설정
- `.firebaserc` - Firebase 환경 설정
- `functions/` - Firebase Functions
- `next.config.js` - Next.js 설정

### 환경 설정
- `.env.example` - 환경 변수 예시
- `.env.local.example` - 로컬 환경 변수 예시
- `.env.production` - 프로덕션 환경 변수
- `.env.test` - 테스트 환경 변수

## 유지보수 가이드

### 새로운 기능 추가 시
1. 해당 요구사항과 관련된 파일들을 확인
2. 기존 패턴을 따라 새로운 컴포넌트/서비스 구현
3. 관련 테스트 코드 작성
4. 보안 규칙 및 권한 검증 로직 업데이트

### 버그 수정 시
1. 해당 기능의 요구사항 확인
2. 관련 파일들에서 문제 원인 파악
3. 테스트 코드로 버그 재현
4. 수정 후 모든 관련 테스트 통과 확인

### 성능 최적화 시
1. `src/lib/monitoring/` 파일들로 성능 지표 확인
2. `src/lib/utils/performance.ts`의 최적화 로직 활용
3. 캐싱 전략 검토 및 개선
4. 이미지 최적화 및 코드 스플리팅 적용

이 문서를 통해 각 기능별로 어떤 파일들을 수정해야 하는지 빠르게 파악할 수 있습니다.# 유지보수용 요구사항 및 구현 파일 매핑 문서

## Introduction

강의 후기를 모으는 플랫폼으로, 사용자들이 강의 리뷰를 작성하고 공유할 수 있는 웹 애플리케이션입니다. 소셜 로그인을 통한 회원가입, 권한별 차등 콘텐츠 제공, 리뷰 검수 시스템, 학습 로드맵 기능을 포함합니다. Next.js 14와 Firebase를 기반으로 구축되며, OpenAI API를 활용한 리뷰 요약 기능을 제공합니다.

**이 문서는 각 요구사항별로 구현된 파일들을 매핑하여 유지보수 시 참고할 수 있도록 작성되었습니다.**

## Requirements

### Requirement 1: 사용자 인증 및 회원가입

**User Story:** 사용자로서 소셜 로그인을 통해 간편하게 회원가입하고 로그인할 수 있어야 하며, 자동으로 생성된 닉네임을 받고 싶습니다.

#### Acceptance Criteria

1. WHEN 사용자가 카카오 로그인 버튼을 클릭 THEN 시스템은 카카오 OAuth 인증 페이지로 리다이렉트 SHALL 수행
2. WHEN 사용자가 네이버 로그인 버튼을 클릭 THEN 시스템은 네이버 OAuth 인증 페이지로 리다이렉트 SHALL 수행
3. WHEN 소셜 로그인이 성공 THEN 시스템은 형용사+명사 형태의 랜덤 닉네임을 자동 생성 SHALL 수행
4. WHEN 신규 사용자가 로그인 THEN 시스템은 사용자 정보(platform, uuid, nickname)를 Firebase에 저장 SHALL 수행
5. WHEN 기존 사용자가 로그인 THEN 시스템은 기존 사용자 정보를 조회하여 로그인 처리 SHALL 수행

#### 구현 파일들 (Task 3, 4)
- **인증 설정**: `src/lib/auth/config.ts`, `src/lib/firebase/config.ts`
- **소셜 로그인**: `src/lib/auth/social.ts`, `src/components/auth/SocialLoginButton.tsx`
- **인증 상태 관리**: `src/components/auth/AuthProvider.tsx`
- **사용자 관리**: `src/lib/auth/user.ts`, `src/lib/services/userService.ts`
- **로그인 페이지**: `src/app/login/page.tsx`
- **로그아웃**: `src/components/auth/LogoutButton.tsx`
- **API 엔드포인트**: `src/app/api/auth/create-token/route.ts`, `src/app/api/users/route.ts`

### Requirement 2: 메인 페이지 및 네비게이션

**User Story:** 사용자로서 메인 페이지에서 인기 카테고리와 최근 리뷰 요약을 확인하고, 사이트 전체를 쉽게 탐색할 수 있어야 합니다.

#### Acceptance Criteria

1. WHEN 사용자가 메인 페이지에 접속 THEN 시스템은 최근 100개 리뷰의 카테고리 통계를 기반으로 인기 카테고리를 표시 SHALL 수행
2. WHEN 사용자가 메인 페이지에 접속 THEN 시스템은 OpenAI API를 통해 생성된 최근 리뷰 요약을 표시 SHALL 수행
3. WHEN 사용자가 메인 페이지에 접속 THEN 시스템은 상단에 메뉴 네비게이션(리뷰, 로드맵, 글쓰기, 마이페이지)을 표시 SHALL 수행
4. WHEN 사용자가 메인 페이지에 접속 THEN 시스템은 하단에 푸터(회사소개, 약관, 개인정보처리방침)를 표시 SHALL 수행

#### 구현 파일들 (Task 5, 7, 14)
- **메인 페이지**: `src/app/page.tsx`
- **레이아웃**: `src/app/layout.tsx`
- **네비게이션**: `src/components/layout/Header.tsx`, `src/components/layout/Navigation.tsx`
- **푸터**: `src/components/layout/Footer.tsx`
- **카테고리 통계**: `src/components/course/CategoryStats.tsx`, `src/app/api/categories/stats/route.ts`
- **최근 리뷰**: `src/components/review/RecentReviewsSection.tsx`

### Requirement 3: 권한별 콘텐츠 접근 제어

**User Story:** 사용자로서 내 권한 등급에 따라 적절한 수준의 콘텐츠에 접근할 수 있어야 하며, 더 많은 콘텐츠를 보기 위한 방법을 알 수 있어야 합니다.

#### Acceptance Criteria

1. WHEN 미로그인 사용자가 리뷰를 조회 THEN 시스템은 최상위 1개 리뷰만 표시 SHALL 수행
2. WHEN 로그인했지만 미인증 사용자가 리뷰를 조회 THEN 시스템은 최상위 1개 리뷰만 표시 SHALL 수행
3. WHEN 인증된 사용자(1개 이상 리뷰 작성)가 리뷰를 조회 THEN 시스템은 모든 리뷰를 표시 SHALL 수행
4. WHEN 프리미엄 사용자가 리뷰를 조회 THEN 시스템은 모든 리뷰를 광고 없이 표시 SHALL 수행
5. WHEN 블록된 사용자가 리뷰를 조회 THEN 시스템은 아무 콘텐츠도 표시하지 않음 SHALL 수행

#### 구현 파일들 (Task 6)
- **권한 관리**: `src/lib/services/accessControlService.ts`
- **보호된 라우트**: `src/components/auth/ProtectedRoute.tsx`
- **역할 가드**: `src/components/auth/RoleGuard.tsx`
- **콘텐츠 제한**: `src/components/auth/ContentRestriction.tsx`
- **권한 훅**: `src/hooks/usePermissions.ts`

### Requirement 4: 리뷰 작성 및 관리

**User Story:** 사용자로서 수강한 강의에 대한 상세한 리뷰를 작성하고, 결제 인증을 통해 신뢰성을 보장하며, 내가 작성한 리뷰의 상태를 확인할 수 있어야 합니다.

#### Acceptance Criteria

1. WHEN 사용자가 리뷰 작성 페이지에 접속 THEN 시스템은 강의 정보 입력 폼(플랫폼, 강의명, 강사, 카테고리)을 표시 SHALL 수행
2. WHEN 사용자가 리뷰를 작성 THEN 시스템은 리뷰 내용, 점수, 수강시기, 좋았던점, 아쉬웠던점, 수강후 변화, 추천대상 입력을 요구 SHALL 수행
3. WHEN 사용자가 리뷰를 작성 THEN 시스템은 결제 인증 이미지 업로드(JPEG, JPG, PNG, GIF, HEIC, 최대 5MB)를 필수로 요구 SHALL 수행
4. WHEN 이미지가 업로드 THEN 시스템은 이미지를 압축하고 로컬스토리지에 저장 SHALL 수행
5. WHEN 리뷰가 제출 THEN 시스템은 리뷰 상태를 '검수대기'로 설정 SHALL 수행
6. WHEN 사용자가 첫 번째 리뷰를 작성 완료 THEN 시스템은 사용자 권한을 'AUTH_LOGIN'으로 업데이트 SHALL 수행

#### 구현 파일들 (Task 8)
- **리뷰 작성 페이지**: `src/app/write/review/page.tsx`
- **리뷰 폼**: `src/components/review/ReviewForm.tsx`
- **리뷰 서비스**: `src/lib/services/reviewService.ts`
- **이미지 최적화**: `src/lib/utils/imageOptimization.ts`
- **파일 업로드**: `src/app/api/upload/route.ts`
- **리뷰 API**: `src/app/api/reviews/route.ts`

### Requirement 5: 리뷰 조회 및 상호작용

**User Story:** 사용자로서 다른 사용자들의 리뷰를 상세히 읽고, 댓글을 통해 소통할 수 있어야 합니다.

#### Acceptance Criteria

1. WHEN 사용자가 리뷰 목록 페이지에 접속 THEN 시스템은 권한에 따라 적절한 리뷰 목록을 표시 SHALL 수행
2. WHEN 사용자가 특정 리뷰를 클릭 THEN 시스템은 리뷰 상세 페이지로 이동 SHALL 수행
3. WHEN 사용자가 리뷰 상세 페이지에 접속 THEN 시스템은 리뷰 전체 내용과 댓글 섹션을 표시 SHALL 수행
4. WHEN 로그인한 사용자가 댓글을 작성 THEN 시스템은 댓글을 저장하고 '검수대기' 상태로 설정 SHALL 수행
5. WHEN 댓글이 승인 THEN 시스템은 댓글을 공개 상태로 변경하여 표시 SHALL 수행

#### 구현 파일들 (Task 9, 10)
- **리뷰 목록 페이지**: `src/app/reviews/page.tsx`
- **리뷰 상세 페이지**: `src/app/reviews/[id]/page.tsx`
- **리뷰 카드**: `src/components/review/ReviewCard.tsx`
- **댓글 시스템**: `src/components/comment/CommentSection.tsx`, `src/components/comment/CommentForm.tsx`, `src/components/comment/CommentList.tsx`
- **댓글 서비스**: `src/lib/services/commentService.ts`
- **댓글 API**: `src/app/api/comments/route.ts`, `src/app/api/comments/[id]/route.ts`

### Requirement 6: 학습 로드맵 기능

**User Story:** 사용자로서 강의 간의 연관성을 파악하고 학습 경로를 계획할 수 있도록 로드맵을 조회하고 작성할 수 있어야 합니다.

#### Acceptance Criteria

1. WHEN 사용자가 로드맵 목록 페이지에 접속 THEN 시스템은 공개된 로드맵 목록을 표시 SHALL 수행
2. WHEN 사용자가 로드맵 작성 페이지에 접속 THEN 시스템은 현재 강의와 다음 강의 정보 입력 폼을 표시 SHALL 수행
3. WHEN 사용자가 로드맵을 작성 THEN 시스템은 로드맵 소개, 강의 연결 정보를 저장 SHALL 수행
4. WHEN 로드맵이 제출 THEN 시스템은 로드맵 상태를 '검수대기'로 설정 SHALL 수행
5. WHEN 사용자가 특정 로드맵을 클릭 THEN 시스템은 로드맵 상세 정보와 연결된 강의들을 표시 SHALL 수행

#### 구현 파일들 (Task 11, 11.1-11.5)
- **로드맵 목록 페이지**: `src/app/roadmaps/page.tsx`
- **로드맵 상세 페이지**: `src/app/roadmaps/[id]/page.tsx`
- **로드맵 작성 페이지**: `src/app/write/roadmap/page.tsx`
- **로드맵 폼**: `src/components/roadmap/RoadmapForm.tsx`
- **로드맵 카드**: `src/components/roadmap/RoadmapCard.tsx`
- **로드맵 서비스**: `src/lib/services/roadmapService.ts`
- **로드맵 API**: `src/app/api/roadmaps/route.ts`, `src/app/api/roadmaps/[id]/route.ts`

### Requirement 7: 마이페이지 및 사용자 관리

**User Story:** 사용자로서 내가 작성한 콘텐츠를 관리하고, 현재 권한 상태를 확인할 수 있어야 합니다.

#### Acceptance Criteria

1. WHEN 사용자가 마이페이지에 접속 THEN 시스템은 현재 닉네임과 권한 등급을 표시 SHALL 수행
2. WHEN 사용자가 마이페이지에 접속 THEN 시스템은 작성한 리뷰 개수와 목록 링크를 표시 SHALL 수행
3. WHEN 사용자가 마이페이지에 접속 THEN 시스템은 작성한 로드맵 개수와 목록 링크를 표시 SHALL 수행
4. WHEN 사용자가 내 리뷰 목록을 클릭 THEN 시스템은 작성한 리뷰들과 각각의 검수 상태를 표시 SHALL 수행
5. WHEN 사용자가 내 로드맵 목록을 클릭 THEN 시스템은 작성한 로드맵들과 각각의 검수 상태를 표시 SHALL 수행

#### 구현 파일들 (Task 12)
- **마이페이지**: `src/app/mypage/page.tsx`
- **내 리뷰**: `src/components/mypage/MyReviews.tsx`
- **내 로드맵**: `src/components/mypage/MyRoadmaps.tsx`
- **통계 대시보드**: `src/components/mypage/StatsDashboard.tsx`
- **마이페이지 서비스**: `src/lib/services/mypageService.ts`

### Requirement 8: 관리자 기능

**User Story:** 관리자로서 사용자가 작성한 콘텐츠를 검수하고, 부적절한 사용자나 콘텐츠를 관리할 수 있어야 합니다.

#### Acceptance Criteria

1. WHEN 관리자가 관리자 페이지에 접속 THEN 시스템은 검수 대기 중인 리뷰 목록을 표시 SHALL 수행
2. WHEN 관리자가 리뷰를 승인 THEN 시스템은 리뷰 상태를 '공개'로 변경하고 검수 완료 후 인증 이미지를 삭제 SHALL 수행
3. WHEN 관리자가 리뷰를 거부 THEN 시스템은 리뷰 상태를 '비공개'로 변경 SHALL 수행
4. WHEN 관리자가 사용자를 블록 THEN 시스템은 사용자 권한을 'BLOCKED_LOGIN'으로 변경 SHALL 수행
5. WHEN 관리자가 로드맵을 검수 THEN 시스템은 로드맵 상태를 '공개' 또는 '비공개'로 설정 SHALL 수행

#### 구현 파일들 (Task 15)
- **관리자 페이지**: `src/app/admin/page.tsx`
- **관리자 대시보드**: `src/components/admin/AdminDashboard.tsx`
- **리뷰 검수 패널**: `src/components/admin/ReviewModerationPanel.tsx`
- **로드맵 검수 패널**: `src/components/admin/RoadmapModerationPanel.tsx`
- **사용자 관리 패널**: `src/components/admin/UserManagementPanel.tsx`
- **모니터링 대시보드**: `src/components/admin/MonitoringDashboard.tsx`
- **성능 대시보드**: `src/components/admin/PerformanceDashboard.tsx`
- **관리자 API**: `src/app/api/admin/reviews/route.ts`, `src/app/api/admin/roadmaps/route.ts`, `src/app/api/admin/users/route.ts`, `src/app/api/admin/stats/route.ts`

### Requirement 9: AI 기반 리뷰 요약

**User Story:** 사용자로서 최근 리뷰들의 핵심 내용을 빠르게 파악할 수 있도록 AI가 생성한 요약을 확인할 수 있어야 합니다.

#### Acceptance Criteria

1. WHEN 새로운 리뷰가 공개 상태로 변경 THEN 시스템은 OpenAI API를 호출하여 리뷰 요약을 생성 SHALL 수행
2. WHEN 리뷰 요약이 생성 THEN 시스템은 요약을 캐시하여 저장 SHALL 수행
3. WHEN 사용자가 메인 페이지에 접속 THEN 시스템은 캐시된 최신 리뷰 요약들을 표시 SHALL 수행
4. IF 요약 생성에 실패 THEN 시스템은 기본 텍스트 요약을 표시 SHALL 수행

#### 구현 파일들 (Task 13)
- **OpenAI 클라이언트**: `src/lib/openai/client.ts`
- **요약 서비스**: `src/lib/services/summaryService.ts`
- **요약 컴포넌트**: `src/components/summary/ReviewSummary.tsx`
- **요약 API**: `src/app/api/summaries/route.ts`
- **크론 작업**: `src/app/api/cron/generate-daily-summaries/route.ts`, `src/app/api/cron/cleanup-expired-summaries/route.ts`

### Requirement 10: 데이터 관리 및 성능

**User Story:** 시스템 사용자로서 빠르고 안정적인 서비스를 이용할 수 있어야 하며, 데이터가 안전하게 보관되어야 합니다.

#### Acceptance Criteria

1. WHEN 사용자가 페이지를 로드 THEN 시스템은 3초 이내에 콘텐츠를 표시 SHALL 수행
2. WHEN 이미지가 업로드 THEN 시스템은 5MB 이하로 압축하여 저장 SHALL 수행
3. WHEN 데이터베이스 쿼리가 실행 THEN 시스템은 적절한 인덱싱을 통해 빠른 응답을 제공 SHALL 수행
4. WHEN 사용자 데이터가 저장 THEN 시스템은 Firebase 보안 규칙을 통해 데이터를 보호 SHALL 수행
5. WHEN 시스템 오류가 발생 THEN 시스템은 적절한 에러 메시지와 함께 복구 방안을 제시 SHALL 수행

#### 구현 파일들 (Task 16, 17, 18)
- **Firebase 설정**: `src/lib/firebase/config.ts`, `src/lib/firebase/collections.ts`, `src/lib/firebase/converters.ts`
- **보안 규칙**: `firestore.rules`, `storage.rules`, `src/lib/firebase/security.ts`
- **성능 최적화**: `src/lib/utils/performance.ts`, `src/lib/utils/cache.ts`, `src/lib/utils/queryOptimization.ts`, `src/lib/utils/codeSplitting.ts`
- **에러 처리**: `src/lib/utils/errorHandler.ts`, `src/lib/utils/apiErrorHandler.ts`, `src/components/ui/ErrorBoundary.tsx`
- **UI 컴포넌트**: `src/components/ui/Loading.tsx`, `src/components/ui/Skeleton.tsx`, `src/components/ui/Toast.tsx`
- **모니터링**: `src/lib/monitoring/performance.ts`, `src/lib/monitoring/analytics.ts`, `src/lib/monitoring/logger.ts`
- **헬스체크**: `src/app/api/health/route.ts`, `src/lib/monitoring/healthCheck.ts`
- **보안 감사**: `src/lib/security/securityAudit.ts`

## 테스트 파일들

### 단위 테스트 (Task 19)
- **유틸리티 테스트**: `src/lib/utils/__tests__/`
- **컴포넌트 테스트**: `src/components/ui/__tests__/`
- **서비스 테스트**: `src/lib/services/__tests__/`
- **API 테스트**: `src/app/api/reviews/__tests__/`

### 통합 테스트 (Task 20)
- **통합 테스트**: `src/__tests__/integration/`
- **임시 통합 테스트**: `temp_integration_tests/`

### E2E 테스트 (Task 21)
- **E2E 테스트**: `e2e/`
- **테스트 헬퍼**: `e2e/helpers/`

## 배포 및 설정 파일들 (Task 22)

### 설정 파일들
- **Next.js 설정**: `next.config.js`, `next-sitemap.config.js`
- **TypeScript 설정**: `tsconfig.json`
- **테스트 설정**: `jest.config.js`, `jest.setup.js`, `playwright.config.ts`
- **Firebase 설정**: `firebase.json`, `.firebaserc`, `firestore.indexes.json`
- **Vercel 설정**: `vercel.json`
- **환경 변수**: `.env.example`, `.env.local.example`

### 문서 파일들
- **배포 가이드**: `docs/DEPLOYMENT.md`, `TESTING_DEPLOYMENT_GUIDE.md`
- **개발 규칙**: `DEVELOPMENT_RULES.md`
- **보안 문서**: `SECURITY.md`
- **버그 수정 요약**: `BUG_FIXES_SUMMARY.md`, `ERROR_HANDLER_FIXES_SUMMARY.md`

## 유지보수 가이드

### 기능별 파일 위치
1. **인증 관련**: `src/lib/auth/`, `src/components/auth/`
2. **리뷰 관련**: `src/components/review/`, `src/app/reviews/`, `src/app/write/review/`
3. **로드맵 관련**: `src/components/roadmap/`, `src/app/roadmaps/`, `src/app/write/roadmap/`
4. **관리자 관련**: `src/components/admin/`, `src/app/admin/`
5. **API 엔드포인트**: `src/app/api/`
6. **공통 서비스**: `src/lib/services/`
7. **유틸리티**: `src/lib/utils/`
8. **UI 컴포넌트**: `src/components/ui/`

### 변경 시 주의사항
- Firebase 보안 규칙 변경 시 `firestore.rules`, `storage.rules` 업데이트 필요
- 새로운 API 엔드포인트 추가 시 권한 검증 로직 포함 필요
- 데이터 모델 변경 시 `src/types/index.ts`와 Firebase 컨버터 업데이트 필요
- 성능에 영향을 주는 변경 시 캐싱 전략 재검토 필요