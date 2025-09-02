# 내일 퍼블리싱 체크리스트

- [ ] 환경 변수 정리/적용 (Vercel/서버)
  - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`(개행 이스케이프 확인)
  - 소셜 로그인 리다이렉트 도메인(카카오/네이버/구글) 프로덕션 도메인 등록
- [ ] Admin SDK 동작 확인 (프로덕션)
  - 관리자 API 토큰 검증 정상 동작 (`/api/admin/*` 401/403/200 확인)
  - dev 전용 우회 로직(prod 비활성) 점검: `src/lib/auth/verifyServer.ts`
- [ ] Firestore/Storage 보안 규칙 재검토
  - 리뷰 이미지: 업로드 권한(작성자만), 읽기는 토큰/서명 URL만 공개
  - Rules/배포: `firebase deploy --only firestore:rules,storage:rules`
- [ ] 인덱스/성능 최적화
  - 관리자 목록 쿼리 인덱스 필요 시 생성(status+createdAt 등)
  - 통계 API 전수 스캔 여부 확인, 필요한 경우 집계/캐시 도입
- [ ] 이미지 업로드/표시 확인
  - 업로드 토큰 URL/서명 URL 동작 확인(`src/app/api/upload/route.ts`)
  - 리뷰검수 썸네일/라이트박스 표시(만료 시 재요청 전략) 확인
- [ ] 로그/헬스체크/모니터링
  - `/api/health` 프로덕션 상태 확인(환경 변수/DB/메모리)
  - 에러 로깅(Sentry 등) 연결 여부 결정 및 적용
- [ ] SEO/도메인 설정
  - `next-sitemap`의 도메인 설정, `robots.txt`/메타 태그 점검
  - 404/에러 페이지/리다이렉트(`next.config.js`) 확인
- [ ] 빌드/테스트/배포 준비
  - `npm run type-check && npm run lint && npm test`
  - `npm run build` 성공 확인(배포 크기/경고 점검)
  - 스테이징 배포 후 종단 테스트(E2E 기본 플로우)
- [ ] QA 시나리오(핵심 플로우)
  - 리뷰 작성(다중 이미지) → 관리자 승인/거부 → 공개/비공개 표시
  - 로드맵 작성/검수, 사용자 역할 변경(승격/차단)
  - 비로그인/일반/프리미엄/관리자 권한별 접근 동작
- [ ] 롤백/운영 계획
  - 배포 태그/릴리즈 노트 생성, 롤백 절차 정리
  - 운영 알림(장애 대응 연락/로그 위치) 문서화

> 진행 중 이슈/메모
- [ ] 관리자 통계 쿼리 최적화 방안(집계/캐시) 논의
- [ ] 라이트박스 고도화(줌/좌우 이동/키보드 네비게이션) 여부 결정
