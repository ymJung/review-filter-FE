'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Container } from '@/components/layout';
import { ReviewList } from '@/components/review/ReviewCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { ContentRestriction, AdPlaceholder } from '@/components/auth/ContentRestriction';
import { RoleGuard, AuthenticatedOnly } from '@/components/auth/RoleGuard';
import { usePermissions } from '@/hooks/usePermissions';
import { getReviews } from '@/lib/services/reviewService';
import { filterReviewsForUser } from '@/lib/services/accessControlService';
import { Review, Course, PaginatedResponse } from '@/types';
import { PLATFORMS, CATEGORIES } from '@/lib/constants';
import Link from 'next/link';

interface ReviewWithDetails extends Review {
  course?: Course;
  author?: {
    id: string;
    nickname: string;
  };
}

export default function ReviewsPage() {
  const {
    user,
    canViewAllReviews,
    maxReviewsVisible,
    shouldShowAds,
    shouldShowUpgradePrompts,
    upgradeMessage,
    canCreateReviews,
  } = usePermissions();

  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    platform: '',
    category: '',
    rating: '',
    search: '',
  });

  const fetchReviews = async (page: number = 1, resetList: boolean = true) => {
    setLoading(true);
    setError(null);

    try {
      // Mock data for demonstration - in real implementation, this would come from API
      const mockReviews: ReviewWithDetails[] = [
        {
          id: '1',
          courseId: 'course-1',
          userId: 'user-1',
          content: '정말 좋은 강의였습니다. React의 기초부터 고급 개념까지 체계적으로 잘 설명되어 있어서 초보자도 쉽게 따라할 수 있었습니다.',
          rating: 5,
          status: 'APPROVED',
          positivePoints: '체계적인 설명과 실습 프로젝트',
          negativePoints: '조금 더 심화 내용이 있었으면',
          changes: '실제 프로젝트에 React를 적용할 수 있게 되었습니다',
          recommendedFor: 'React 입문자',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
          course: {
            id: 'course-1',
            title: 'React 완벽 가이드',
            platform: '인프런',
            instructor: '김개발',
            category: '프로그래밍',
            viewCount: 1250,
            createdAt: new Date('2024-01-01'),
          },
          author: {
            id: 'user-1',
            nickname: '멋진개발자123',
          },
        },
        {
          id: '2',
          courseId: 'course-2',
          userId: 'user-2',
          content: 'JavaScript의 핵심 개념들을 잘 정리해주는 강의입니다. ES6+ 문법부터 비동기 처리까지 폭넓게 다루고 있어서 도움이 많이 되었습니다.',
          rating: 4,
          status: 'APPROVED',
          positivePoints: '핵심 개념 정리가 잘 되어 있음',
          negativePoints: '예제가 조금 더 다양했으면',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10'),
          course: {
            id: 'course-2',
            title: 'JavaScript 마스터클래스',
            platform: '유데미',
            instructor: '박자바',
            category: '프로그래밍',
            viewCount: 890,
            createdAt: new Date('2023-12-15'),
          },
          author: {
            id: 'user-2',
            nickname: '똑똑한고양이456',
          },
        },
        {
          id: '3',
          courseId: 'course-3',
          userId: 'user-3',
          content: '백엔드 개발의 전반적인 내용을 다루는 강의입니다. Express.js부터 데이터베이스 연동, 인증 시스템까지 실무에서 필요한 모든 것을 배울 수 있었습니다.',
          rating: 5,
          status: 'APPROVED',
          positivePoints: '실무 중심의 내용',
          negativePoints: '초보자에게는 조금 어려울 수 있음',
          changes: '실제 백엔드 API를 개발할 수 있게 되었습니다',
          recommendedFor: '백엔드 개발 입문자',
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-05'),
          course: {
            id: 'course-3',
            title: 'Node.js 백엔드 개발',
            platform: '패스트캠퍼스',
            instructor: '이노드',
            category: '프로그래밍',
            viewCount: 2100,
            createdAt: new Date('2023-11-20'),
          },
          author: {
            id: 'user-3',
            nickname: '열정적인개발자789',
          },
        },
      ];

      // Apply user-based filtering
      let filteredReviews = mockReviews;

      // Apply additional filters
      if (filters.platform) {
        filteredReviews = filteredReviews.filter(review => 
          review.course?.platform === filters.platform
        );
      }
      
      if (filters.category) {
        filteredReviews = filteredReviews.filter(review => 
          review.course?.category === filters.category
        );
      }
      
      if (filters.rating) {
        filteredReviews = filteredReviews.filter(review => 
          review.rating >= parseInt(filters.rating)
        );
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredReviews = filteredReviews.filter(review => 
          review.course?.title.toLowerCase().includes(searchLower) ||
          review.content.toLowerCase().includes(searchLower)
        );
      }

      // Apply access control limits
      if (!canViewAllReviews && maxReviewsVisible !== Infinity) {
        filteredReviews = filteredReviews.slice(0, maxReviewsVisible);
      }

      setReviews(filteredReviews);
      setCurrentPage(1);
      setTotalPages(1);
      setHasMore(false);

    } catch (err: any) {
      setError(err.message || '리뷰를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(1, true);
  }, [user, canViewAllReviews, maxReviewsVisible]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchReviews(1, true);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchReviews(currentPage + 1, false);
    }
  };

  const hasMoreReviews = !canViewAllReviews && maxReviewsVisible !== Infinity;

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.platform}
              onChange={(e) => handleFilterChange('platform', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 플랫폼</option>
              {PLATFORMS.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
            
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 카테고리</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 평점</option>
              <option value="5">⭐⭐⭐⭐⭐ (5점)</option>
              <option value="4">⭐⭐⭐⭐ (4점 이상)</option>
              <option value="3">⭐⭐⭐ (3점 이상)</option>
            </select>

            <Input
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="강의명이나 내용으로 검색..."
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          </div>
        )}

        {/* Reviews List */}
        <ReviewList
          reviews={reviews}
          loading={loading}
          emptyMessage="조건에 맞는 리뷰가 없습니다."
        />

        {/* Load More Button */}
        {hasMore && !loading && (
          <div className="mt-8 text-center">
            <Button onClick={handleLoadMore}>
              더 많은 리뷰 보기
            </Button>
          </div>
        )}

        {/* Ad placeholder */}
        {shouldShowAds && reviews.length > 2 && (
          <div className="mt-8">
            <AdPlaceholder />
          </div>
        )}

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


      </Container>
    </Layout>
  );
}