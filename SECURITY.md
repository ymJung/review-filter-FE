# Firebase Security Rules Documentation

이 문서는 Review Filter 플랫폼의 Firebase Security Rules에 대한 상세한 설명을 제공합니다.

## 개요

Firebase Security Rules는 Firestore 데이터베이스와 Cloud Storage에 대한 접근을 제어하는 보안 계층입니다. 이 규칙들은 클라이언트 측에서 직접 실행되어 데이터의 무결성과 보안을 보장합니다.

## 사용자 권한 시스템

### 권한 레벨

1. **NOT_ACCESS**: 미로그인 사용자
2. **LOGIN_NOT_AUTH**: 로그인했지만 인증되지 않은 사용자
3. **AUTH_LOGIN**: 리뷰 작성 등으로 인증된 사용자
4. **AUTH_PREMIUM**: 프리미엄 사용자
5. **BLOCKED_LOGIN**: 차단된 사용자
6. **ADMIN**: 관리자

### 권한별 접근 제어

| 기능 | NOT_ACCESS | LOGIN_NOT_AUTH | AUTH_LOGIN | AUTH_PREMIUM | BLOCKED_LOGIN | ADMIN |
|------|------------|----------------|------------|--------------|---------------|-------|
| 승인된 리뷰 읽기 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| 모든 리뷰 읽기 | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| 리뷰 작성 | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| 로드맵 작성 | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| 댓글 작성 | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| 파일 업로드 | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| 관리자 기능 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

## Firestore Security Rules

### 헬퍼 함수

```javascript
// 인증 확인
function isAuthenticated() {
  return request.auth != null;
}

// 사용자 권한 조회
function getUserRole() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
}

// 관리자 권한 확인
function isAdmin() {
  return isAuthenticated() && getUserRole() == 'ADMIN';
}

// 소유자 확인
function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}

// 콘텐츠 생성 권한 확인
function canCreateContent() {
  return isAuthenticated() && getUserRole() in ['AUTH_LOGIN', 'AUTH_PREMIUM', 'ADMIN'];
}

// 차단되지 않은 사용자 확인
function isNotBlocked() {
  return !isAuthenticated() || getUserRole() != 'BLOCKED_LOGIN';
}
```

### 컬렉션별 규칙

#### Users 컬렉션

```javascript
match /users/{userId} {
  // 읽기: 본인 데이터 또는 관리자
  allow read: if isOwner(userId) || isAdmin();
  
  // 생성: 회원가입 시 본인 프로필만
  allow create: if isOwner(userId) && 
    request.resource.data.keys().hasAll(['socialProvider', 'socialId', 'nickname', 'role', 'createdAt', 'updatedAt']) &&
    request.resource.data.role in ['LOGIN_NOT_AUTH', 'AUTH_LOGIN'];
  
  // 수정: 본인 닉네임만 또는 관리자
  allow update: if (isOwner(userId) && 
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['nickname', 'updatedAt'])) ||
    isAdmin();
  
  // 삭제: 관리자만
  allow delete: if isAdmin();
}
```

#### Reviews 컬렉션

```javascript
match /reviews/{reviewId} {
  // 읽기: 승인된 리뷰는 공개, 본인 리뷰, 관리자
  allow read: if (resource.data.status == 'APPROVED' && isNotBlocked()) ||
    isOwner(resource.data.userId) ||
    isAdmin();
  
  // 생성: 인증된 사용자, 본인 ID로만
  allow create: if isAuthenticated() && isNotBlocked() &&
    request.resource.data.userId == request.auth.uid &&
    request.resource.data.status == 'PENDING';
  
  // 수정: 본인의 대기 중인 리뷰 또는 관리자
  allow update: if (isOwner(resource.data.userId) && 
    resource.data.status == 'PENDING') ||
    isAdmin();
  
  // 삭제: 본인 리뷰 또는 관리자
  allow delete: if isOwner(resource.data.userId) || isAdmin();
}
```

#### Roadmaps 컬렉션

```javascript
match /roadmaps/{roadmapId} {
  // 읽기: 승인된 로드맵은 공개, 본인 로드맵, 관리자
  allow read: if (resource.data.status == 'APPROVED' && isNotBlocked()) ||
    isOwner(resource.data.userId) ||
    isAdmin();
  
  // 생성: 인증된 사용자
  allow create: if isAuthenticated() && isNotBlocked() &&
    request.resource.data.userId == request.auth.uid &&
    request.resource.data.status == 'PENDING';
  
  // 수정: 본인의 대기 중인 로드맵, 조회수 증가, 관리자
  allow update: if (isOwner(resource.data.userId) && 
    resource.data.status == 'PENDING') ||
    isAdmin() ||
    // 승인된 로드맵의 조회수 증가 허용
    (resource.data.status == 'APPROVED' && 
     request.resource.data.diff(resource.data).affectedKeys().hasOnly(['viewCount']));
}
```

#### Comments 컬렉션

```javascript
match /comments/{commentId} {
  // 읽기: 승인된 댓글은 공개, 본인 댓글, 관리자
  allow read: if (resource.data.status == 'APPROVED' && isNotBlocked()) ||
    isOwner(resource.data.userId) ||
    isAdmin();
  
  // 생성: 인증된 사용자, 존재하는 리뷰에만
  allow create: if isAuthenticated() && isNotBlocked() &&
    request.resource.data.userId == request.auth.uid &&
    exists(/databases/$(database)/documents/reviews/$(request.resource.data.reviewId));
}
```

## Storage Security Rules

### 파일 업로드 제한

- **파일 형식**: JPEG, JPG, PNG, GIF, HEIC만 허용
- **파일 크기**: 최대 5MB
- **경로 제한**: 사용자별 폴더 구조

### 경로별 규칙

#### 리뷰 인증 이미지

```javascript
match /review-images/{userId}/{reviewId}/{imageId} {
  // 읽기: 리뷰 소유자 또는 관리자
  allow read: if isAuthenticated() && 
    (request.auth.uid == userId || isAdmin());
  
  // 생성: 본인 폴더에만, 유효한 이미지 파일
  allow create: if isAuthenticated() && 
    request.auth.uid == userId && 
    isValidImageFile();
  
  // 삭제: 소유자 또는 관리자
  allow delete: if isAuthenticated() && 
    (request.auth.uid == userId || isAdmin());
}
```

#### 임시 업로드

```javascript
match /temp/{userId}/{allPaths=**} {
  // 생성: 본인 임시 폴더에만
  allow create: if isAuthenticated() && 
    request.auth.uid == userId && 
    isValidImageFile();
  
  // 읽기/삭제: 소유자 또는 관리자
  allow read, delete: if isAuthenticated() && 
    (request.auth.uid == userId || isAdmin());
}
```

## 보안 모범 사례

### 1. 클라이언트 측 검증

Security Rules와 일치하는 클라이언트 측 검증을 구현하여 사용자 경험을 개선합니다.

```typescript
import { SecurityValidator } from '@/lib/firebase/security';

// 리뷰 읽기 권한 확인
if (SecurityValidator.canReadReview(review, currentUser)) {
  // 리뷰 표시
}

// 파일 업로드 검증
const validation = SecurityValidator.validateFileUpload(file);
if (!validation.valid) {
  alert(validation.error);
  return;
}
```

### 2. 에러 처리

Security Rules 위반 시 적절한 에러 메시지를 표시합니다.

```typescript
try {
  await addDoc(collection(db, 'reviews'), reviewData);
} catch (error) {
  if (error.code === 'permission-denied') {
    alert('리뷰 작성 권한이 없습니다.');
  }
}
```

### 3. 데이터 검증

클라이언트와 서버 양쪽에서 데이터 검증을 수행합니다.

```typescript
// 클라이언트 측 검증
const isValid = validateReviewData(reviewData);
if (!isValid) return;

// Security Rules에서도 동일한 검증 수행
```

## 테스트

### Security Rules 테스트 실행

```bash
# Firebase 에뮬레이터 시작
npm run firebase:emulators

# Security Rules 테스트 실행
npm run test:rules
```

### 테스트 케이스

1. **인증 테스트**: 로그인/비로그인 사용자 권한 확인
2. **권한 테스트**: 각 권한 레벨별 접근 제어 확인
3. **소유권 테스트**: 본인 데이터만 수정 가능한지 확인
4. **관리자 테스트**: 관리자 권한으로 모든 데이터 접근 가능한지 확인

## 배포

### Security Rules 배포

```bash
# Rules만 배포
npm run firebase:deploy:rules

# 인덱스만 배포
npm run firebase:deploy:indexes

# 전체 배포
npm run firebase:deploy
```

### 배포 전 체크리스트

- [ ] 모든 테스트 통과
- [ ] 프로덕션 환경에서 테스트
- [ ] 백업 계획 수립
- [ ] 롤백 계획 준비

## 모니터링

### Security Rules 위반 모니터링

Firebase Console에서 Security Rules 위반 로그를 모니터링하고, 의심스러운 활동을 감지합니다.

### 성능 모니터링

복잡한 Security Rules는 성능에 영향을 줄 수 있으므로, 쿼리 성능을 정기적으로 모니터링합니다.

## 문제 해결

### 일반적인 문제

1. **permission-denied 에러**: 권한 부족 또는 잘못된 데이터 구조
2. **성능 저하**: 복잡한 규칙이나 많은 `get()` 호출
3. **인덱스 누락**: 복합 쿼리에 필요한 인덱스 미생성

### 디버깅 팁

1. Firebase Console의 Rules Playground 사용
2. 에뮬레이터에서 상세 로그 확인
3. 단계별로 규칙 테스트

이 Security Rules는 플랫폼의 데이터 보안과 사용자 권한 관리를 위한 핵심 구성 요소입니다. 정기적인 검토와 업데이트를 통해 보안을 유지하시기 바랍니다.