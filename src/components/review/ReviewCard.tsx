'use client';

import React from 'react';
import { Review, Course, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SkeletonReviewCard, SkeletonList } from '@/components/ui/Skeleton';
import { formatDate, formatRelativeTime, truncateText } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import Link from 'next/link';

interface ReviewWithDetails extends Review {
  course?: Course;
  author?: {
    id: string;
    nickname: string;
  };
}

interface ReviewCardProps {
  review: ReviewWithDetails;
  showActions?: boolean;
  showFullContent?: boolean;
  compact?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  className?: string;
  // When true, hide content and show blurred overlay CTA
  blurred?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  showActions = false,
  showFullContent = false,
  compact = false,
  onEdit,
  onDelete,
  className = '',
  blurred = false,
}) => {
  const { user, canModerate, canCreateReviews } = usePermissions();
  
  const isOwner = user?.id === review.userId;
  const canEdit = isOwner || canModerate;
  const canDeleteReview = isOwner || canModerate;

  // Defensive date parsing to avoid runtime errors during render
  const createdAt = review.createdAt instanceof Date ? review.createdAt : new Date(review.createdAt as any);
  const updatedAt = review.updatedAt instanceof Date ? review.updatedAt : new Date(review.updatedAt as any);
  const studyPeriod = review.studyPeriod instanceof Date || !review.studyPeriod
    ? (review.studyPeriod as Date | undefined)
    : new Date(review.studyPeriod as any);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success" size="sm">승인됨</Badge>;
      case 'PENDING':
        return <Badge variant="warning" size="sm">검수중</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" size="sm">거부됨</Badge>;
      default:
        return <Badge variant="secondary" size="sm">{status}</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center" aria-label={`평점 ${rating}점`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= rating;
          return (
            <span
              key={star}
              className={active ? 'text-yellow-400' : 'text-gray-300'}
              aria-hidden="true"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.976a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.382 2.458a1 1 0 00-.364 1.118l1.286 3.976c.3.922-.755 1.688-1.538 1.118l-3.382-2.458a1 1 0 00-1.176 0L5.241 18.073c-.783.57-1.838-.197-1.538-1.118l1.286-3.976a1 1 0 00-.364-1.118L1.243 9.403c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.976z" />
              </svg>
            </span>
          );
        })}
        <span className="ml-2 text-sm text-gray-600">({rating}점)</span>
      </div>
    );
  };

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {review.course && (
              <div className="mb-2">
                <CardTitle className="text-lg leading-tight">
                  {review.course.title}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" size="sm">
                    {review.course.platform}
                  </Badge>
                  {review.course.category && (
                    <Badge variant="secondary" size="sm">
                      {review.course.category}
                    </Badge>
                  )}
                  {review.course.instructor && (
                    <span className="text-sm text-gray-600">
                      {review.course.instructor}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {renderStars(review.rating)}
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            {getStatusBadge(review.status)}
            {(isOwner || canModerate) && review.status !== 'APPROVED' && (
              <span className="text-xs text-gray-500">
                {review.status === 'PENDING' ? '검수 대기중' : '검수 거부'}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Review Content */}
        <div className={`space-y-3 mb-4 ${compact ? 'space-y-2' : ''}`}>
          {blurred ? (
            <div className="relative">
              {/* Placeholder content blocks to simulate blurred text without exposing content */}
              <div className="space-y-2 select-none" aria-hidden>
                <div className="h-4 bg-gray-200 rounded w-11/12" />
                <div className="h-4 bg-gray-200 rounded w-10/12" />
                <div className="h-4 bg-gray-200 rounded w-9/12" />
                <div className="h-4 bg-gray-200 rounded w-8/12" />
              </div>
              {/* Frosted overlay with CTA */}
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded">
                <div className="text-center px-4 py-3">
                  <p className="text-gray-800 font-medium">나머지 리뷰는 제한된 접근입니다</p>
                  <p className="text-gray-600 text-sm mb-3">리뷰를 작성하면 전체 열람이 가능해요</p>
                  <div className="flex items-center justify-center gap-2">
                    {canCreateReviews ? (
                      <Link href="/write/review">
                        <Button size="sm">리뷰 작성하기</Button>
                      </Link>
                    ) : (
                      <Link href="/login">
                        <Button size="sm">로그인하기</Button>
                      </Link>
                    )}
                    {/* Premium CTA removed per request */}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-700 leading-relaxed">
                {showFullContent 
                  ? review.content 
                  : truncateText(review.content, compact ? 100 : 150)
                }
              </p>
              {!showFullContent && review.content.length > (compact ? 100 : 150) && (
                <Link href={`/reviews/${review.id}`}>
                  <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto">
                    더 보기 →
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Additional Details (only show if full content or approved, and not compact) */}
          {!compact && !blurred && (showFullContent || review.status === 'APPROVED') && (
            <>
              {review.positivePoints && (
                <div>
                  <h4 className="text-sm font-medium text-green-700 mb-1">👍 좋았던 점</h4>
                  <p className="text-sm text-gray-600">{review.positivePoints}</p>
                </div>
              )}

              {review.negativePoints && (
                <div>
                  <h4 className="text-sm font-medium text-red-700 mb-1">👎 아쉬웠던 점</h4>
                  <p className="text-sm text-gray-600">{review.negativePoints}</p>
                </div>
              )}

              {review.changes && (
                <div>
                  <h4 className="text-sm font-medium text-blue-700 mb-1">💡 수강 후 변화</h4>
                  <p className="text-sm text-gray-600">{review.changes}</p>
                </div>
              )}

              {review.recommendedFor && (
                <div>
                  <h4 className="text-sm font-medium text-purple-700 mb-1">🎯 추천 대상</h4>
                  <p className="text-sm text-gray-600">{review.recommendedFor}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Meta Information */}
        <div className="mt-auto pt-3 border-t border-gray-200">
          <div className={`flex items-center justify-between text-sm text-gray-500 ${compact ? 'text-xs' : ''}`}>
            <div className="flex items-center space-x-2">
              {review.author && (
                <span className="font-medium">{review.author.nickname}</span>
              )}
              {!compact && studyPeriod && (
                <>
                  <span>•</span>
                  <span>수강: {formatDate(studyPeriod)}</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span>{formatRelativeTime(createdAt)}</span>
              {!compact && updatedAt && createdAt && updatedAt.getTime() !== createdAt.getTime() && (
                <>
                  <span>•</span>
                  <span className="text-xs">수정됨</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && !blurred && (canEdit || canDeleteReview) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-end space-x-2">
              {canEdit && onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(review)}
                >
                  수정
                </Button>
              )}
              {canDeleteReview && onDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDelete(review)}
                >
                  삭제
                </Button>
              )}
              {!showFullContent && (
                <Link href={`/reviews/${review.id}`}>
                  <Button variant="ghost" size="sm">
                    상세보기
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface ReviewListProps {
  reviews: ReviewWithDetails[];
  loading?: boolean;
  showActions?: boolean;
  showFullContent?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  emptyMessage?: string;
  className?: string;
  // If set, items with index >= this value render as blurred placeholders
  blurAfterIndex?: number;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  loading = false,
  showActions = false,
  showFullContent = false,
  onEdit,
  onDelete,
  emptyMessage = '리뷰가 없습니다.',
  className = '',
  blurAfterIndex,
}) => {
  if (loading) {
    return (
      <SkeletonList 
        count={3} 
        itemComponent={SkeletonReviewCard}
        className={className}
      />
    );
  }

  if (reviews.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-500">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-lg font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {reviews.map((review, idx) => (
        <ReviewCard
          key={review.id}
          review={review}
          showActions={showActions}
          showFullContent={showFullContent}
          onEdit={onEdit}
          onDelete={onDelete}
          blurred={typeof blurAfterIndex === 'number' ? idx >= blurAfterIndex : false}
        />
      ))}
    </div>
  );
};
