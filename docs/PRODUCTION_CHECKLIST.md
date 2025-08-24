# 프로덕션 배포 체크리스트

## 배포 전 확인사항

### 1. 환경 변수 설정 ✅
- [ ] Firebase 설정 변수 모두 설정됨
- [ ] OpenAI API 키 설정됨
- [ ] 소셜 로그인 클라이언트 ID 설정됨
- [ ] CRON_SECRET 설정됨 (보안)
- [ ] SITE_URL 설정됨
- [ ] NODE_ENV=production 설정됨

### 2. Firebase 설정 ✅
- [ ] Firestore 규칙 배포됨
- [ ] Storage 규칙 배포됨
- [ ] 인덱스 설정 완료됨
- [ ] 서비스 계정 키 생성됨
- [ ] Authentication 소셜 로그인 설정됨

### 3. 코드 품질 ✅
- [ ] 모든 테스트 통과
- [ ] TypeScript 컴파일 오류 없음
- [ ] ESLint 오류 없음
- [ ] 빌드 성공 확인

### 4. 보안 설정 ✅
- [ ] 보안 헤더 설정됨
- [ ] CORS 설정 확인됨
- [ ] API 엔드포인트 보안 검증됨
- [ ] 민감한 정보 환경 변수로 분리됨

### 5. 성능 최적화 ✅
- [ ] 이미지 최적화 설정됨
- [ ] 코드 스플리팅 적용됨
- [ ] 캐싱 전략 구현됨
- [ ] 번들 크기 최적화됨

## 배포 단계

### 1단계: 로컬 테스트
```bash
# 의존성 설치
npm ci

# 타입 체크
npm run type-check

# 린팅
npm run lint

# 단위 테스트
npm run test:unit

# 통합 테스트
npm run test:integration

# 빌드 테스트
npm run build
```

### 2단계: Firebase 배포
```bash
# Firebase 로그인
firebase login

# 프로젝트 설정
firebase use production

# 규칙 배포
npm run firebase:deploy:rules

# 인덱스 배포
npm run firebase:deploy:indexes

# 함수 배포 (선택사항)
npm run firebase:deploy:functions
```

### 3단계: Vercel 배포
```bash
# Vercel CLI 설치 (필요시)
npm i -g vercel

# 로그인
vercel login

# 프로덕션 배포
npm run deploy:production
```

### 4단계: 배포 후 검증

#### 기능 테스트
- [ ] 홈페이지 로딩 확인
- [ ] 소셜 로그인 동작 확인
- [ ] 리뷰 작성/조회 확인
- [ ] 로드맵 작성/조회 확인
- [ ] 관리자 기능 확인
- [ ] 이미지 업로드 확인

#### 성능 테스트
- [ ] 페이지 로딩 속도 < 3초
- [ ] Core Web Vitals 확인
- [ ] 모바일 반응형 확인
- [ ] 이미지 최적화 확인

#### 보안 테스트
- [ ] HTTPS 연결 확인
- [ ] 보안 헤더 확인
- [ ] API 엔드포인트 보안 확인
- [ ] 권한 기반 접근 제어 확인

#### 모니터링 설정
- [ ] 헬스 체크 엔드포인트 동작 확인
- [ ] 로그 수집 확인
- [ ] 에러 추적 설정 확인
- [ ] 성능 모니터링 확인

## 모니터링 및 알림

### 1. 헬스 체크
- URL: `https://your-domain.com/api/health`
- 주기: 5분마다
- 알림: 3회 연속 실패 시

### 2. 로그 모니터링
- 에러 로그 실시간 모니터링
- 성능 메트릭 수집
- 사용자 행동 분석

### 3. 알림 설정
- Slack/Discord 웹훅 설정
- 이메일 알림 설정
- SMS 알림 (중요한 오류만)

## 롤백 계획

### Vercel 롤백
1. Vercel Dashboard → Deployments
2. 이전 배포 선택
3. "Promote to Production" 클릭

### Firebase 롤백
1. 이전 규칙 파일로 복원
2. `firebase deploy --only firestore:rules,storage:rules`
3. 필요시 데이터 복원

### 데이터베이스 롤백
1. Firestore 백업에서 복원
2. 중요 컬렉션 우선 복원
3. 사용자 데이터 무결성 확인

## 장애 대응

### 1. 서비스 장애
1. 헬스 체크 확인
2. 로그 분석
3. 롤백 여부 결정
4. 사용자 공지

### 2. 데이터베이스 장애
1. Firebase 상태 확인
2. 백업 데이터 확인
3. 복구 계획 실행
4. 데이터 무결성 검증

### 3. 외부 서비스 장애
1. OpenAI API 상태 확인
2. 소셜 로그인 서비스 확인
3. 대체 서비스 활성화
4. 사용자 안내

## 정기 유지보수

### 주간 작업
- [ ] 로그 분석 및 정리
- [ ] 성능 메트릭 검토
- [ ] 보안 업데이트 확인
- [ ] 백업 상태 확인

### 월간 작업
- [ ] 의존성 업데이트
- [ ] 보안 감사
- [ ] 성능 최적화 검토
- [ ] 사용자 피드백 분석

### 분기별 작업
- [ ] 전체 시스템 점검
- [ ] 재해 복구 테스트
- [ ] 용량 계획 검토
- [ ] 비용 최적화

## 연락처

### 긴급 상황
- 개발팀 리더: [연락처]
- 시스템 관리자: [연락처]
- Firebase 지원: [Firebase 콘솔]

### 외부 서비스 지원
- Vercel 지원: https://vercel.com/support
- Firebase 지원: https://firebase.google.com/support
- OpenAI 지원: https://help.openai.com

---

**중요:** 이 체크리스트는 배포 시마다 반드시 확인하고, 완료된 항목에 체크 표시를 해주세요.