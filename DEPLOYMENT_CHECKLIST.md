# 🚀 배포 전 최종 체크리스트

## ✅ 완료된 항목들

### 빌드 및 코드 품질
- [x] TypeScript 컴파일 성공
- [x] Next.js 빌드 성공
- [x] 필수 패키지 설치 완료 (web-vitals, @testing-library/jest-dom)
- [x] 주요 TypeScript 오류 수정 완료

### 설정 파일들
- [x] `vercel.json` 환경변수 설정 완료
- [x] `firebase.json` 설정 완료
- [x] `firestore.indexes.json` 인덱스 정의 완료
- [x] 프로덕션용 Firestore 규칙 생성 (`firestore.rules.prod`)

## ⚠️ 배포 전 필수 작업

### 1. Firebase 설정
```bash
# 프로덕션용 규칙 적용
cp firestore.rules.prod firestore.rules
firebase deploy --only firestore:rules

# 인덱스 배포
firebase deploy --only firestore:indexes

# Storage 규칙 배포
firebase deploy --only storage:rules
```

### 2. Vercel 환경변수 설정
Vercel Dashboard에서 다음 환경변수들이 설정되어 있는지 확인:

**필수 환경변수:**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_KAKAO_CLIENT_ID`
- `NEXT_PUBLIC_NAVER_CLIENT_ID`
- `NODE_ENV=production`

### 3. Firebase 인덱스 생성
빌드 로그에서 나온 인덱스 링크들을 클릭하여 필요한 인덱스들을 생성:

1. Roadmaps 인덱스: `status`, `updatedAt`, `__name__`
2. 기타 필요한 복합 인덱스들

### 4. 최종 테스트
```bash
# 로컬에서 프로덕션 빌드 테스트
npm run build
npm run start

# 기본 기능 테스트
# - 홈페이지 로딩
# - 로그인 기능
# - 리뷰/로드맵 조회
```

## 🚀 배포 실행

### 자동 배포 (권장)
```bash
# 전체 배포 스크립트 실행
./scripts/deploy.sh
```

### 수동 배포
```bash
# 1. Firebase 배포
firebase deploy --only firestore:rules,storage:rules,firestore:indexes

# 2. Vercel 배포
vercel --prod
```

## 📊 배포 후 확인사항

### 1. 기능 테스트
- [ ] 홈페이지 로딩 확인
- [ ] 소셜 로그인 동작 확인
- [ ] 리뷰 작성/조회 확인
- [ ] 로드맵 작성/조회 확인
- [ ] 관리자 기능 확인
- [ ] 이미지 업로드 확인

### 2. 성능 확인
- [ ] 페이지 로딩 속도 < 3초
- [ ] Core Web Vitals 확인
- [ ] 모바일 반응형 확인

### 3. 모니터링 확인
- [ ] 헬스체크 엔드포인트: `/api/health`
- [ ] Firebase 연결 확인: `/api/health/firebase`
- [ ] OpenAI 연결 확인: `/api/health/openai`

## 🔧 알려진 이슈들

### 경고 사항 (기능에 영향 없음)
- React Hook dependency 경고들
- 일부 이미지 최적화 권장사항

### 빌드 시 정상적인 에러들
- Dynamic server usage 에러들 (API 라우트 정적 생성 실패)
- Firebase 권한 에러 (빌드 시 연결 실패)

이러한 에러들은 빌드 과정에서 정상적으로 발생하는 것이며, 실제 배포된 환경에서는 정상 동작합니다.

## 📞 문제 발생 시

1. 빌드 실패: `npm run build` 재실행
2. Firebase 연결 실패: 환경변수 및 규칙 확인
3. Vercel 배포 실패: 환경변수 설정 확인
4. 기능 동작 실패: 브라우저 콘솔 로그 확인

---

**중요**: 프로덕션 배포 전에 반드시 프로덕션용 Firestore 규칙을 적용해야 합니다!