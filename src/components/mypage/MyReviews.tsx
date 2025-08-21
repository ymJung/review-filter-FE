'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { MypageService } from '@/lib/services/mypageService';
import { Review } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Loading } from '@/components/ui/Loading';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

interface MyReviewsProps {
  className?: string;
}

export function MyReviews({ className = '' }: MyReviewsProps) {
  const { firebaseUser } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!firebaseUser) return;

      try {
        setLoading(true);
        setError(null);
        const token = await firebaseUser.getIdToken();
        const fetchedReviews = await MypageService.getMyReviews(token);
        setReviews(fetchedReviews);
      } catch (error: any) {
        console.error('Error fetching my reviews:', error);
        setError('리뷰를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [firebaseUser]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">승인됨</Badge>;
      case 'PENDING':
        return <Badge variant="warning">검수중</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">거부됨</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: ko 
    });
  };

  if (loading) {
    return (
      <div className={className}>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant="danger">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">내가 작성한 리뷰</h2>
        <Link href="/write/review">
          <Button size="sm">새 리뷰 작성</Button>
        </Link>
      </div>

      {reviews.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-lg font-medium mb-2">아직 작성한 리뷰가 없습니다</p>
            <p className="text-sm mb-4">첫 번째 리뷰를 작성해보세요!</p>
            <Link href="/write/review">
              <Button>리뷰 작성하기</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Link href={`/reviews/${review.id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                        리뷰 #{review.id.slice(0, 8)}
                      </h3>
                    </Link>
                    {getStatusBadge(review.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span>⭐ {review.rating}/5</span>
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                  
                  <p className="text-gray-700 line-clamp-2">
                    {review.content}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Link href={`/reviews/${review.id}`}>
                  <Button variant="outline" size="sm">
                    자세히 보기
                  </Button>
                </Link>
                {review.status !== 'APPROVED' && (
                  <Link href={`/reviews/${review.id}/edit`}>
                    <Button variant="outline" size="sm">
                      수정하기
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}