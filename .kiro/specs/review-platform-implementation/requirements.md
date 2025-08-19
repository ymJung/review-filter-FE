# Requirements Document

## Introduction

강의 후기를 모으는 플랫폼으로, 사용자들이 강의 리뷰를 작성하고 공유할 수 있는 웹 애플리케이션입니다. 소셜 로그인을 통한 회원가입, 권한별 차등 콘텐츠 제공, 리뷰 검수 시스템, 학습 로드맵 기능을 포함합니다. Next.js 14와 Firebase를 기반으로 구축되며, OpenAI API를 활용한 리뷰 요약 기능을 제공합니다.

## Requirements

### Requirement 1: 사용자 인증 및 회원가입

**User Story:** 사용자로서 소셜 로그인을 통해 간편하게 회원가입하고 로그인할 수 있어야 하며, 자동으로 생성된 닉네임을 받고 싶습니다.

#### Acceptance Criteria

1. WHEN 사용자가 카카오 로그인 버튼을 클릭 THEN 시스템은 카카오 OAuth 인증 페이지로 리다이렉트 SHALL 수행
2. WHEN 사용자가 네이버 로그인 버튼을 클릭 THEN 시스템은 네이버 OAuth 인증 페이지로 리다이렉트 SHALL 수행
3. WHEN 소셜 로그인이 성공 THEN 시스템은 형용사+명사 형태의 랜덤 닉네임을 자동 생성 SHALL 수행
4. WHEN 신규 사용자가 로그인 THEN 시스템은 사용자 정보(platform, uuid, nickname)를 Firebase에 저장 SHALL 수행
5. WHEN 기존 사용자가 로그인 THEN 시스템은 기존 사용자 정보를 조회하여 로그인 처리 SHALL 수행

### Requirement 2: 메인 페이지 및 네비게이션

**User Story:** 사용자로서 메인 페이지에서 인기 카테고리와 최근 리뷰 요약을 확인하고, 사이트 전체를 쉽게 탐색할 수 있어야 합니다.

#### Acceptance Criteria

1. WHEN 사용자가 메인 페이지에 접속 THEN 시스템은 최근 100개 리뷰의 카테고리 통계를 기반으로 인기 카테고리를 표시 SHALL 수행
2. WHEN 사용자가 메인 페이지에 접속 THEN 시스템은 OpenAI API를 통해 생성된 최근 리뷰 요약을 표시 SHALL 수행
3. WHEN 사용자가 메인 페이지에 접속 THEN 시스템은 상단에 메뉴 네비게이션(리뷰, 로드맵, 글쓰기, 마이페이지)을 표시 SHALL 수행
4. WHEN 사용자가 메인 페이지에 접속 THEN 시스템은 하단에 푸터(회사소개, 약관, 개인정보처리방침)를 표시 SHALL 수행

### Requirement 3: 권한별 콘텐츠 접근 제어

**User Story:** 사용자로서 내 권한 등급에 따라 적절한 수준의 콘텐츠에 접근할 수 있어야 하며, 더 많은 콘텐츠를 보기 위한 방법을 알 수 있어야 합니다.

#### Acceptance Criteria

1. WHEN 미로그인 사용자가 리뷰를 조회 THEN 시스템은 최상위 1개 리뷰만 표시 SHALL 수행
2. WHEN 로그인했지만 미인증 사용자가 리뷰를 조회 THEN 시스템은 최상위 1개 리뷰만 표시 SHALL 수행
3. WHEN 인증된 사용자(1개 이상 리뷰 작성)가 리뷰를 조회 THEN 시스템은 모든 리뷰를 표시 SHALL 수행
4. WHEN 프리미엄 사용자가 리뷰를 조회 THEN 시스템은 모든 리뷰를 광고 없이 표시 SHALL 수행
5. WHEN 블록된 사용자가 리뷰를 조회 THEN 시스템은 아무 콘텐츠도 표시하지 않음 SHALL 수행

### Requirement 4: 리뷰 작성 및 관리

**User Story:** 사용자로서 수강한 강의에 대한 상세한 리뷰를 작성하고, 결제 인증을 통해 신뢰성을 보장하며, 내가 작성한 리뷰의 상태를 확인할 수 있어야 합니다.

#### Acceptance Criteria

1. WHEN 사용자가 리뷰 작성 페이지에 접속 THEN 시스템은 강의 정보 입력 폼(플랫폼, 강의명, 강사, 카테고리)을 표시 SHALL 수행
2. WHEN 사용자가 리뷰를 작성 THEN 시스템은 리뷰 내용, 점수, 수강시기, 좋았던점, 아쉬웠던점, 수강후 변화, 추천대상 입력을 요구 SHALL 수행
3. WHEN 사용자가 리뷰를 작성 THEN 시스템은 결제 인증 이미지 업로드(JPEG, JPG, PNG, GIF, HEIC, 최대 5MB)를 필수로 요구 SHALL 수행
4. WHEN 이미지가 업로드 THEN 시스템은 이미지를 압축하고 로컬스토리지에 저장 SHALL 수행
5. WHEN 리뷰가 제출 THEN 시스템은 리뷰 상태를 '검수대기'로 설정 SHALL 수행
6. WHEN 사용자가 첫 번째 리뷰를 작성 완료 THEN 시스템은 사용자 권한을 'AUTH_LOGIN'으로 업데이트 SHALL 수행

### Requirement 5: 리뷰 조회 및 상호작용

**User Story:** 사용자로서 다른 사용자들의 리뷰를 상세히 읽고, 댓글을 통해 소통할 수 있어야 합니다.

#### Acceptance Criteria

1. WHEN 사용자가 리뷰 목록 페이지에 접속 THEN 시스템은 권한에 따라 적절한 리뷰 목록을 표시 SHALL 수행
2. WHEN 사용자가 특정 리뷰를 클릭 THEN 시스템은 리뷰 상세 페이지로 이동 SHALL 수행
3. WHEN 사용자가 리뷰 상세 페이지에 접속 THEN 시스템은 리뷰 전체 내용과 댓글 섹션을 표시 SHALL 수행
4. WHEN 로그인한 사용자가 댓글을 작성 THEN 시스템은 댓글을 저장하고 '검수대기' 상태로 설정 SHALL 수행
5. WHEN 댓글이 승인 THEN 시스템은 댓글을 공개 상태로 변경하여 표시 SHALL 수행

### Requirement 6: 학습 로드맵 기능

**User Story:** 사용자로서 강의 간의 연관성을 파악하고 학습 경로를 계획할 수 있도록 로드맵을 조회하고 작성할 수 있어야 합니다.

#### Acceptance Criteria

1. WHEN 사용자가 로드맵 목록 페이지에 접속 THEN 시스템은 공개된 로드맵 목록을 표시 SHALL 수행
2. WHEN 사용자가 로드맵 작성 페이지에 접속 THEN 시스템은 현재 강의와 다음 강의 정보 입력 폼을 표시 SHALL 수행
3. WHEN 사용자가 로드맵을 작성 THEN 시스템은 로드맵 소개, 강의 연결 정보를 저장 SHALL 수행
4. WHEN 로드맵이 제출 THEN 시스템은 로드맵 상태를 '검수대기'로 설정 SHALL 수행
5. WHEN 사용자가 특정 로드맵을 클릭 THEN 시스템은 로드맵 상세 정보와 연결된 강의들을 표시 SHALL 수행

### Requirement 7: 마이페이지 및 사용자 관리

**User Story:** 사용자로서 내가 작성한 콘텐츠를 관리하고, 현재 권한 상태를 확인할 수 있어야 합니다.

#### Acceptance Criteria

1. WHEN 사용자가 마이페이지에 접속 THEN 시스템은 현재 닉네임과 권한 등급을 표시 SHALL 수행
2. WHEN 사용자가 마이페이지에 접속 THEN 시스템은 작성한 리뷰 개수와 목록 링크를 표시 SHALL 수행
3. WHEN 사용자가 마이페이지에 접속 THEN 시스템은 작성한 로드맵 개수와 목록 링크를 표시 SHALL 수행
4. WHEN 사용자가 내 리뷰 목록을 클릭 THEN 시스템은 작성한 리뷰들과 각각의 검수 상태를 표시 SHALL 수행
5. WHEN 사용자가 내 로드맵 목록을 클릭 THEN 시스템은 작성한 로드맵들과 각각의 검수 상태를 표시 SHALL 수행

### Requirement 8: 관리자 기능

**User Story:** 관리자로서 사용자가 작성한 콘텐츠를 검수하고, 부적절한 사용자나 콘텐츠를 관리할 수 있어야 합니다.

#### Acceptance Criteria

1. WHEN 관리자가 관리자 페이지에 접속 THEN 시스템은 검수 대기 중인 리뷰 목록을 표시 SHALL 수행
2. WHEN 관리자가 리뷰를 승인 THEN 시스템은 리뷰 상태를 '공개'로 변경하고 검수 완료 후 인증 이미지를 삭제 SHALL 수행
3. WHEN 관리자가 리뷰를 거부 THEN 시스템은 리뷰 상태를 '비공개'로 변경 SHALL 수행
4. WHEN 관리자가 사용자를 블록 THEN 시스템은 사용자 권한을 'BLOCKED_LOGIN'으로 변경 SHALL 수행
5. WHEN 관리자가 로드맵을 검수 THEN 시스템은 로드맵 상태를 '공개' 또는 '비공개'로 설정 SHALL 수행

### Requirement 9: AI 기반 리뷰 요약

**User Story:** 사용자로서 최근 리뷰들의 핵심 내용을 빠르게 파악할 수 있도록 AI가 생성한 요약을 확인할 수 있어야 합니다.

#### Acceptance Criteria

1. WHEN 새로운 리뷰가 공개 상태로 변경 THEN 시스템은 OpenAI API를 호출하여 리뷰 요약을 생성 SHALL 수행
2. WHEN 리뷰 요약이 생성 THEN 시스템은 요약을 캐시하여 저장 SHALL 수행
3. WHEN 사용자가 메인 페이지에 접속 THEN 시스템은 캐시된 최신 리뷰 요약들을 표시 SHALL 수행
4. IF 요약 생성에 실패 THEN 시스템은 기본 텍스트 요약을 표시 SHALL 수행

### Requirement 10: 데이터 관리 및 성능

**User Story:** 시스템 사용자로서 빠르고 안정적인 서비스를 이용할 수 있어야 하며, 데이터가 안전하게 보관되어야 합니다.

#### Acceptance Criteria

1. WHEN 사용자가 페이지를 로드 THEN 시스템은 3초 이내에 콘텐츠를 표시 SHALL 수행
2. WHEN 이미지가 업로드 THEN 시스템은 5MB 이하로 압축하여 저장 SHALL 수행
3. WHEN 데이터베이스 쿼리가 실행 THEN 시스템은 적절한 인덱싱을 통해 빠른 응답을 제공 SHALL 수행
4. WHEN 사용자 데이터가 저장 THEN 시스템은 Firebase 보안 규칙을 통해 데이터를 보호 SHALL 수행
5. WHEN 시스템 오류가 발생 THEN 시스템은 적절한 에러 메시지와 함께 복구 방안을 제시 SHALL 수행