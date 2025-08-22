'use client';

import React from 'react';
import { Review, Course, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  showActions = false,
  showFullContent = false,
  compact = false,
  onEdit,
  onDelete,
  className = '',
}) => {
  const { user, canModerate } = usePermissions();
  
  const isOwner = user?.id === review.userId;
  const canEdit = isOwner || canModerate;
  const canDeleteReview = isOwner || canModerate;

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
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ⭐
          </span>
        ))}
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

          {/* Additional Details (only show if full content or approved, and not compact) */}
          {!compact && (showFullContent || review.status === 'APPROVED') && (
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
              {!compact && review.studyPeriod && (
                <>
                  <span>•</span>
                  <span>수강: {formatDate(review.studyPeriod)}</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span>{formatRelativeTime(review.createdAt)}</span>
              {!compact && review.updatedAt.getTime() !== review.createdAt.getTime() && (
                <>
                  <span>•</span>
                  <span className="text-xs">수정됨</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (canEdit || canDeleteReview) && (
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
}) => {
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="flex space-x-2">
                    <div className="h-5 w-16 bg-gray-200 rounded"></div>
                    <div className="h-5 w-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="h-5 w-16 bg-gray-200 rounded"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          showActions={showActions}
          showFullContent={showFullContent}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};