# 📝 코딩 표준 및 스타일 가이드

## 🎯 목적
이 문서는 프로젝트의 코드 일관성을 유지하고, 팀원 간의 협업을 원활하게 하기 위한 코딩 표준을 정의합니다.

## 📁 파일 및 폴더 구조

### 폴더 구조
```
src/
├── app/                    # Next.js App Router 페이지
│   ├── (auth)/            # 라우트 그룹
│   ├── api/               # API 라우트
│   └── globals.css        # 전역 스타일
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   ├── auth/             # 인증 관련 컴포넌트
│   ├── review/           # 리뷰 관련 컴포넌트
│   └── layout/           # 레이아웃 컴포넌트
├── lib/                  # 유틸리티 및 설정
│   ├── auth/            # 인증 로직
│   ├── firebase/        # Firebase 설정
│   ├── services/        # 비즈니스 로직
│   └── utils/           # 유틸리티 함수
├── hooks/               # 커스텀 React 훅
├── types/               # TypeScript 타입 정의
└── __tests__/           # 테스트 파일
```

### 네이밍 규칙
- **컴포넌트**: `PascalCase` (예: `ReviewCard.tsx`)
- **페이지**: `page.tsx` (폴더는 kebab-case)
- **API 라우트**: `route.ts`
- **훅**: `use` 접두사 + `camelCase` (예: `useAuth.ts`)
- **유틸리티**: `camelCase` (예: `formatDate.ts`)
- **상수**: `UPPER_SNAKE_CASE` (예: `API_ENDPOINTS`)

## 🔧 TypeScript 규칙

### 타입 정의
```typescript
// ✅ 좋은 예
interface User {
  id: string;
  email: string;
  nickname: string;
  role: UserRole;
  createdAt: Date;
}

type UserRole = 'GUEST_LOGIN' | 'AUTH_LOGIN' | 'PREMIUM_LOGIN' | 'ADMIN_LOGIN' | 'BLOCKED_LOGIN';

// ❌ 나쁜 예
interface User {
  id: any;
  email: string;
  nickname?: string; // 필수 필드를 optional로 만들지 말 것
}
```

### 함수 타입 정의
```typescript
// ✅ 좋은 예
async function createReview(data: CreateReviewData): Promise<Review> {
  // 구현
}

// Props 타입 정의
interface ReviewCardProps {
  review: Review;
  onEdit?: (id: string) => void;
  className?: string;
}
```

## ⚛️ React 컴포넌트 규칙

### 컴포넌트 구조
```typescript
// ✅ 표준 컴포넌트 구조
import { useState, useEffect } from 'react';
import { Review } from '@/types';

interface ReviewCardProps {
  review: Review;
  onEdit?: (id: string) => void;
}

export default function ReviewCard({ review, onEdit }: ReviewCardProps) {
  // 1. 상태 관리
  const [isLoading, setIsLoading] = useState(false);
  
  // 2. 커스텀 훅
  const { user } = useAuth();
  
  // 3. 이벤트 핸들러
  const handleEdit = () => {
    if (onEdit) {
      onEdit(review.id);
    }
  };
  
  // 4. 사이드 이펙트
  useEffect(() => {
    // 필요한 경우에만 사용
  }, []);
  
  // 5. 조건부 렌더링
  if (isLoading) {
    return <ReviewCardSkeleton />;
  }
  
  // 6. JSX 반환
  return (
    <div className="review-card">
      {/* 컴포넌트 내용 */}
    </div>
  );
}
```

### 훅 사용 규칙
```typescript
// ✅ 커스텀 훅 예시
export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reviewService.getReviews();
      setReviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { reviews, loading, error, fetchReviews };
}
```

## 🌐 API 라우트 규칙

### API 라우트 구조
```typescript
// ✅ 표준 API 라우트 구조
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { reviewService } from '@/lib/services/reviewService';

export async function GET(request: NextRequest) {
  try {
    // 1. 권한 검증
    const user = await auth.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }
    
    // 2. 요청 파라미터 처리
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    
    // 3. 비즈니스 로직 실행
    const reviews = await reviewService.getReviews({ page, userId: user.id });
    
    // 4. 응답 반환
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('리뷰 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
```

## 🎨 스타일링 규칙

### Tailwind CSS 사용법
```typescript
// ✅ 좋은 예 - 의미있는 클래스 조합
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border">
  <h3 className="text-lg font-semibold text-gray-900">제목</h3>
  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
    버튼
  </button>
</div>

// ❌ 나쁜 예 - 너무 긴 클래스 문자열
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
```

### 조건부 스타일링
```typescript
// ✅ clsx 사용
import clsx from 'clsx';

<button 
  className={clsx(
    'px-4 py-2 rounded-md transition-colors',
    {
      'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
      'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
      'opacity-50 cursor-not-allowed': disabled,
    }
  )}
>
```

## 🔒 에러 처리 및 보안

### 에러 처리
```typescript
// ✅ 적절한 에러 처리
try {
  const result = await apiCall();
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    throw new Error('입력 데이터가 올바르지 않습니다');
  }
  
  console.error('API 호출 실패:', error);
  throw new Error('서버 오류가 발생했습니다');
}
```

### 입력 검증
```typescript
// ✅ Zod를 사용한 스키마 검증
import { z } from 'zod';

const CreateReviewSchema = z.object({
  courseTitle: z.string().min(1, '강의명을 입력해주세요'),
  rating: z.number().min(1).max(5),
  content: z.string().min(10, '리뷰는 최소 10자 이상 작성해주세요'),
});

export function validateReviewData(data: unknown) {
  return CreateReviewSchema.parse(data);
}
```

## 📝 주석 및 문서화

### 주석 작성법
```typescript
/**
 * 리뷰 데이터를 생성하고 데이터베이스에 저장합니다.
 * 
 * @param data - 생성할 리뷰 데이터
 * @param userId - 리뷰 작성자 ID
 * @returns 생성된 리뷰 객체
 * @throws {ValidationError} 입력 데이터가 유효하지 않은 경우
 * @throws {AuthError} 사용자 권한이 없는 경우
 */
export async function createReview(data: CreateReviewData, userId: string): Promise<Review> {
  // 구현
}

// 복잡한 로직에 대한 설명 주석
// 사용자 권한에 따라 표시할 리뷰 개수를 제한합니다
// GUEST_LOGIN, UNAUTH_LOGIN: 1개만 표시
// AUTH_LOGIN 이상: 모든 리뷰 표시
const visibleReviews = user.role === 'GUEST_LOGIN' || user.role === 'UNAUTH_LOGIN' 
  ? reviews.slice(0, 1) 
  : reviews;
```

## 🧪 테스트 작성 규칙

### 단위 테스트
```typescript
// ✅ 테스트 예시
describe('formatDate', () => {
  it('날짜를 올바른 형식으로 포맷팅한다', () => {
    const date = new Date('2024-01-15');
    const result = formatDate(date);
    expect(result).toBe('2024년 1월 15일');
  });
  
  it('잘못된 날짜에 대해 에러를 던진다', () => {
    expect(() => formatDate(null as any)).toThrow();
  });
});
```

## 📋 체크리스트

### 코드 작성 전
- [ ] 관련 타입이 정의되어 있는가?
- [ ] 비슷한 기능이 이미 구현되어 있는가?
- [ ] 재사용 가능한 컴포넌트로 만들 수 있는가?

### 코드 작성 후
- [ ] TypeScript 에러가 없는가?
- [ ] 에러 처리가 적절히 되어 있는가?
- [ ] 로딩 상태가 처리되어 있는가?
- [ ] 접근성이 고려되어 있는가?
- [ ] 테스트 코드가 작성되어 있는가?
- [ ] 빌드가 성공하는가?

---

이 가이드를 따라 일관성 있는 코드를 작성하여 유지보수성을 높이고 팀 협업을 원활하게 합시다! 🚀