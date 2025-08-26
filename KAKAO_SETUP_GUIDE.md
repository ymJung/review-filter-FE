# 카카오 로그인 설정 가이드

## 문제 해결

현재 발생하는 오류는 카카오 SDK가 웹 브라우저에서 카카오톡 앱을 실행하려고 시도할 때 발생합니다.

### 1. 카카오 개발자 콘솔 설정

1. [카카오 개발자 콘솔](https://developers.kakao.com/)에 접속
2. 애플리케이션 선택 (앱 키: `d58ca7823365418f4469fffb4fea3a10`)
3. **플랫폼 설정** → **Web** 탭으로 이동

#### 필수 설정 항목:

**사이트 도메인 등록:**
```
http://localhost:3000
https://localhost:3000
https://yh-review-filter.vercel.app
https://yh-review-filter.firebaseapp.com
```

**Redirect URI 설정:**
```
http://localhost:3000/auth/kakao/callback
https://yh-review-filter.vercel.app/auth/kakao/callback
https://yh-review-filter.firebaseapp.com/auth/kakao/callback
```

### 2. 카카오 로그인 설정

**제품 설정** → **카카오 로그인** 탭에서:

1. **카카오 로그인 활성화** 체크
2. **OpenID Connect 활성화** 체크 (선택사항)
3. **Redirect URI 등록**:
   - `http://localhost:3000/auth/kakao/callback`
   - `https://yh-review-filter.vercel.app/auth/kakao/callback`
   - `https://yh-review-filter.firebaseapp.com/auth/kakao/callback`

### 3. 동의항목 설정

**제품 설정** → **카카오 로그인** → **동의항목**에서:

- **닉네임**: 필수 동의
- **카카오계정(이메일)**: 선택 동의 또는 필수 동의
- **프로필 사진**: 선택 동의

### 4. 코드 수정 사항

다음 수정사항이 적용되었습니다:

1. **웹 전용 로그인 설정**: `throughTalk: false`로 카카오톡 앱 실행 방지
2. **SDK 초기화 개선**: 에러 처리 및 로깅 강화
3. **도메인 검증**: 허용된 도메인에서만 로그인 가능
4. **타임아웃 설정**: 30초 후 자동 취소
5. **디버그 컴포넌트**: 개발 환경에서 상태 확인 가능

### 5. 테스트 방법

1. 개발 서버 실행: `npm run dev`
2. `http://localhost:3000/login` 접속
3. 우측 하단 디버그 패널에서 상태 확인:
   - 도메인 유효: ✅
   - SDK 로드: ✅
   - SDK 초기화: ✅
   - 클라이언트 ID: ✅

### 6. 문제 해결

**SDK 로드 실패 시:**
- 네트워크 연결 확인
- 브라우저 콘솔에서 스크립트 로드 오류 확인

**도메인 오류 시:**
- 카카오 개발자 콘솔에서 사이트 도메인 등록 확인
- 현재 도메인이 등록된 도메인과 일치하는지 확인

**로그인 팝업이 열리지 않는 경우:**
- 브라우저 팝업 차단 설정 확인
- 다른 브라우저에서 테스트

### 7. 배포 시 주의사항

1. **환경 변수 설정**: Vercel/Firebase에서 `NEXT_PUBLIC_KAKAO_CLIENT_ID` 설정
2. **도메인 등록**: 배포 도메인을 카카오 개발자 콘솔에 등록
3. **HTTPS 사용**: 프로덕션에서는 반드시 HTTPS 사용

### 8. 디버그 컴포넌트 제거

배포 전에 디버그 컴포넌트를 제거하거나 개발 환경에서만 표시되도록 설정:

```typescript
{process.env.NODE_ENV === 'development' && <KakaoDebug />}
```