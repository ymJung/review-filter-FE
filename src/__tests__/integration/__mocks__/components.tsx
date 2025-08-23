/**
 * Mock components for integration tests
 */

import React from 'react'

// Mock AuthProvider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div data-testid="auth-provider">{children}</div>
}

// Mock SocialLoginButton
export const SocialLoginButton: React.FC<{ provider: string }> = ({ provider }) => {
  return (
    <button data-testid={`${provider}-login`}>
      {provider === 'kakao' ? '카카오로 시작하기' : '네이버로 시작하기'}
    </button>
  )
}

// Mock ProtectedRoute
export const ProtectedRoute: React.FC<{
  allowedRoles: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}> = ({ children, fallback }) => {
  // Mock logic - in real implementation this would check user role
  const hasAccess = true // Mock access
  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Mock ContentRestriction
export const ContentRestriction: React.FC<{
  userRole: string
  children: React.ReactNode
}> = ({ userRole, children }) => {
  if (userRole === 'BLOCKED_LOGIN') {
    return <div>접근이 제한되었습니다</div>
  }
  if (userRole === 'NOT_ACCESS' || userRole === 'LOGIN_NOT_AUTH') {
    return (
      <div>
        {children}
        <div>더 많은 리뷰를 보려면 로그인하세요</div>
        <div>리뷰를 작성하면 모든 콘텐츠를 볼 수 있습니다</div>
      </div>
    )
  }
  return <>{children}</>
}

// Mock RoleGuard
export const RoleGuard: React.FC<{
  allowedRoles: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}> = ({ children, fallback }) => {
  // Mock logic
  const hasAccess = true
  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Mock ReviewForm
export const ReviewForm: React.FC = () => {
  return (
    <form data-testid="review-form">
      <label htmlFor="platform">플랫폼</label>
      <select id="platform" name="platform">
        <option value="인프런">인프런</option>
      </select>
      
      <label htmlFor="title">강의명</label>
      <input id="title" name="title" type="text" />
      
      <label htmlFor="instructor">강사</label>
      <input id="instructor" name="instructor" type="text" />
      
      <label htmlFor="category">카테고리</label>
      <select id="category" name="category">
        <option value="프로그래밍">프로그래밍</option>
      </select>
      
      <label htmlFor="content">리뷰 내용</label>
      <textarea id="content" name="content" />
      
      <label htmlFor="rating">평점</label>
      <select id="rating" name="rating">
        <option value="5">5</option>
      </select>
      
      <label htmlFor="studyPeriod">수강시기</label>
      <input id="studyPeriod" name="studyPeriod" type="month" />
      
      <label htmlFor="positivePoints">좋았던 점</label>
      <textarea id="positivePoints" name="positivePoints" />
      
      <label htmlFor="negativePoints">아쉬웠던 점</label>
      <textarea id="negativePoints" name="negativePoints" />
      
      <label htmlFor="changes">수강 후 변화</label>
      <textarea id="changes" name="changes" />
      
      <label htmlFor="recommendedFor">추천 대상</label>
      <textarea id="recommendedFor" name="recommendedFor" />
      
      <label htmlFor="paymentImage">결제 인증 이미지</label>
      <input id="paymentImage" name="paymentImage" type="file" />
      
      <button type="submit">리뷰 작성</button>
      <div>필수 항목을 입력해주세요</div>
      <div>리뷰 작성에 실패했습니다</div>
    </form>
  )
}

// Mock ReviewCard
export const ReviewCard: React.FC<{
  review: any
  userRole: string
  showFullContent: boolean
}> = ({ review, userRole, showFullContent }) => {
  if (userRole === 'BLOCKED_LOGIN') {
    return <div>접근이 제한되었습니다</div>
  }
  
  return (
    <div data-testid={`review-card-${review.id}`}>
      <h3>{review.title}</h3>
      <p>{showFullContent ? review.content : review.content.substring(0, 50) + '...'}</p>
      {showFullContent && review.positivePoints && <p>{review.positivePoints}</p>}
      {showFullContent && review.negativePoints && <p>{review.negativePoints}</p>}
      {!showFullContent && <div>더 많은 리뷰를 보려면</div>}
    </div>
  )
}

// Mock CommentSection
export const CommentSection: React.FC<{ reviewId: string }> = ({ reviewId }) => {
  return (
    <div data-testid="comment-section">
      <div>저도 같은 강의 들었는데 정말 좋았어요!</div>
      <input placeholder="댓글을 입력하세요" />
      <button>댓글 작성</button>
      <div>댓글 작성에 실패했습니다</div>
    </div>
  )
}

// Mock Admin Components
export const AdminDashboard: React.FC = () => {
  return <div>관리자 대시보드</div>
}

export const ReviewModerationPanel: React.FC = () => {
  return (
    <div>
      <h2>리뷰 검수</h2>
      <div>정말 좋은 강의였습니다.</div>
      <button>승인</button>
    </div>
  )
}

export const UserManagementPanel: React.FC = () => {
  return (
    <div>
      <h2>사용자 관리</h2>
      <div>테스트AUTH_LOGIN</div>
      <button>차단</button>
    </div>
  )
}