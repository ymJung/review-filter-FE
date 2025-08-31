'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Review, Course, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import { formatDate, formatRelativeTime, truncateText } from '@/lib/utils';

interface ReviewWithDetails extends Review {
  course?: Course;
  author?: {
    id: string;
    nickname: string;
  };
}

export function ReviewModerationPanel() {
  const { firebaseUser } = useAuth();
  const hasFetchedData = useRef(false);
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'PENDING' | 'REJECTED' | 'ALL'>('PENDING');

  useEffect(() => {
    // Reset the flag when user changes or filter changes
    hasFetchedData.current = false;
  }, [firebaseUser, filter]);

  useEffect(() => {
    // Fetch data when user is available and we haven't fetched yet
    if (firebaseUser && !hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchReviews();
    }
  }, [firebaseUser, filter]);

  const fetchReviews = async () => {
    try {
      // Wait for firebaseUser to be available
      if (!firebaseUser) {
        hasFetchedData.current = false; // Reset flag if no user
        return;
      }

      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filter !== 'ALL') {
        params.set('status', filter);
      }
      params.set('limit', '50');

      // Get auth token
      const token = await firebaseUser.getIdToken();

      const response = await fetch(`/api/admin/reviews?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('리뷰 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      if (data.success) {
        setReviews(data.data || []);
      } else {
        throw new Error(data.error?.message || '리뷰 목록을 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      setError(error.message);
      hasFetchedData.current = false; // Reset flag on error so we can retry
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (reviewId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      if (!firebaseUser) {
        throw new Error('인증이 필요합니다.');
      }

      setProcessingId(reviewId);

      // Get auth token
      const token = await firebaseUser.getIdToken();

      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error('리뷰 처리에 실패했습니다.');
      }

      const data = await response.json();
      if (data.success) {
        // 목록에서 해당 리뷰 업데이트
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, status: action === 'approve' ? 'APPROVED' : 'REJECTED' }
            : review
        ));
      } else {
        throw new Error(data.error?.message || '리뷰 처리에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Error processing review:', error);
      alert(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">승인됨</Badge>;
      case 'PENDING':
        return <Badge variant="warning">검수 대기</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">거부됨</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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

  if (loading) {
    return <Loading text="리뷰 목록을 불러오는 중..." />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            {[
              { key: 'PENDING' as const, label: '검수 대기', count: reviews.filter(r => r.status === 'PENDING').length },
              { key: 'REJECTED' as const, label: '거부됨', count: reviews.filter(r => r.status === 'REJECTED').length },
              { key: 'ALL' as const, label: '전체', count: reviews.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-lg font-medium mb-2">검수할 리뷰가 없습니다</p>
              <p className="text-sm">모든 리뷰가 처리되었습니다.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
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
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Review Content */}
                  <div>
                    <p className="text-gray-700 leading-relaxed">
                      {truncateText(review.content, 300)}
                    </p>
                  </div>

                  {/* Additional Details */}
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

                  {/* Meta Information */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        {review.author && (
                          <span className="font-medium">{review.author.nickname}</span>
                        )}
                        {review.studyPeriod && (
                          <>
                            <span>•</span>
                            <span>수강: {formatDate(review.studyPeriod)}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>{formatRelativeTime(review.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {review.status === 'PENDING' && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleReviewAction(review.id, 'reject')}
                          disabled={processingId === review.id}
                        >
                          {processingId === review.id ? '처리 중...' : '거부'}
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleReviewAction(review.id, 'approve')}
                          disabled={processingId === review.id}
                        >
                          {processingId === review.id ? '처리 중...' : '승인'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}