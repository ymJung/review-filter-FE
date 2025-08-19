'use client';

import { Layout, Container } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ContentRestriction, AdPlaceholder } from '@/components/auth/ContentRestriction';
import { RoleGuard, AuthenticatedOnly } from '@/components/auth/RoleGuard';
import { usePermissions } from '@/hooks/usePermissions';
import Link from 'next/link';

// Mock data for demonstration
const mockReviews = [
  {
    id: '1',
    courseTitle: 'React 완벽 가이드',
    coursePlatform: '인프런',
    rating: 5,
    content: '정말 좋은 강의였습니다. React의 기초부터 고급 개념까지 체계적으로 잘 설명되어 있어서 초보자도 쉽게 따라할 수 있었습니다. 특히 실습 프로젝트가 많아서 실제로 코딩하면서 배울 수 있어서 좋았습니다.',
    author: '멋진개발자123',
    createdAt: '2024-01-15',
    status: 'APPROVED' as const,
  },
  {
    id: '2',
    courseTitle: 'JavaScript 마스터클래스',
    coursePlatform: '유데미',
    rating: 4,
    content: 'JavaScript의 핵심 개념들을 잘 정리해주는 강의입니다. ES6+ 문법부터 비동기 처리까지 폭넓게 다루고 있어서 도움이 많이 되었습니다.',
    author: '똑똑한고양이456',
    createdAt: '2024-01-10',
    status: 'APPROVED' as const,
  },
  {
    id: '3',
    courseTitle: 'Node.js 백엔드 개발',
    coursePlatform: '패스트캠퍼스',
    rating: 5,
    content: '백엔드 개발의 전반적인 내용을 다루는 강의입니다. Express.js부터 데이터베이스 연동, 인증 시스템까지 실무에서 필요한 모든 것을 배울 수 있었습니다.',
    author: '열정적인개발자789',
    createdAt: '2024-01-05',
    status: 'APPROVED' as const,
  },
];

export default function ReviewsPage() {
  const {
    canViewAllReviews,
    maxReviewsVisible,
    shouldShowAds,
    shouldShowUpgradePrompts,
    upgradeMessage,
    canCreateReviews,
  } = usePermissions();

  const displayedReviews = canViewAllReviews 
    ? mockReviews 
    : mockReviews.slice(0, maxReviewsVisible);

  const hasMoreReviews = mockReviews.length > displayedReviews.length;

  return (
    <Layout>
      <Container className="py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">강의 리뷰</h1>
            <p className="text-gray-600">다양한 온라인 강의에 대한 솔직한 후기를 확인해보세요.</p>
          </div>
          
          <RoleGuard allowedRoles={['LOGIN_NOT_AUTH', 'AUTH_LOGIN', 'AUTH_PREMIUM', 'ADMIN']}>
            <Link href="/write/review">
              <Button>리뷰 작성하기</Button>
            </Link>
          </RoleGuard>
        </div>

        {/* Filters and Search */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">모든 플랫폼</option>
              <option value="inflearn">인프런</option>
              <option value="udemy">유데미</option>
              <option value="fastcampus">패스트캠퍼스</option>
            </select>
            
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">모든 평점</option>
              <option value="5">⭐⭐⭐⭐⭐</option>
              <option value="4">⭐⭐⭐⭐</option>
              <option value="3">⭐⭐⭐</option>
            </select>

            <input
              type="text"
              placeholder="강의명으로 검색..."
              className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {displayedReviews.map((review, index) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{review.courseTitle}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">{review.coursePlatform}</Badge>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>{review.author}</div>
                    <div>{review.createdAt}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{review.content}</p>
                
                {/* Show "Read More" for limited access users */}
                {!canViewAllReviews && index === 0 && (
                  <div className="mt-4">
                    <Link href={`/reviews/${review.id}`}>
                      <Button variant="outline" size="sm">
                        전체 리뷰 보기
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Ad placeholder */}
          {shouldShowAds && displayedReviews.length > 2 && (
            <AdPlaceholder />
          )}
        </div>

        {/* Access Restriction Message */}
        {hasMoreReviews && !canViewAllReviews && (
          <div className="mt-8">
            <ContentRestriction type="review" />
          </div>
        )}

        {/* Upgrade Prompt */}
        {shouldShowUpgradePrompts && upgradeMessage && (
          <div className="mt-8">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <svg className="w-12 h-12 text-blue-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">더 많은 리뷰를 확인하세요</h3>
                <p className="text-gray-600 mb-4">{upgradeMessage}</p>
                <div className="flex justify-center space-x-4">
                  {canCreateReviews ? (
                    <Link href="/write/review">
                      <Button>리뷰 작성하기</Button>
                    </Link>
                  ) : (
                    <Link href="/login">
                      <Button>로그인하기</Button>
                    </Link>
                  )}
                  <Button variant="outline">프리미엄 업그레이드</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {displayedReviews.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-lg font-medium">아직 리뷰가 없습니다</p>
              <p className="text-sm">첫 번째 리뷰를 작성해보세요!</p>
            </div>
            <AuthenticatedOnly>
              <div className="mt-6">
                <Link href="/write/review">
                  <Button>리뷰 작성하기</Button>
                </Link>
              </div>
            </AuthenticatedOnly>
          </div>
        )}
      </Container>
    </Layout>
  );
}