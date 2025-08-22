'use client';

import { useState, useEffect } from 'react';
import { Review } from '@/types';
import { ReviewCard } from './ReviewCard';
import { getReviews } from '@/lib/services/reviewService';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';

interface RecentReviewsSectionProps {
  limit?: number;
  className?: string;
}

export function RecentReviewsSection({ 
  limit = 6, 
  className = '' 
}: RecentReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getReviews({
          limit,
          status: 'APPROVED',
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });
        
        setReviews(data?.data || []);
      } catch (error: any) {
        console.error('Error fetching recent reviews:', error);
        setError('최근 리뷰를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentReviews();
  }, [limit]);

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-64"></div>
          </div>
        ))}
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

  if (reviews.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-500">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-lg font-medium mb-2">아직 리뷰가 없습니다</p>
          <p className="text-sm">첫 번째 리뷰를 작성해보세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {reviews.map((review) => (
        <ReviewCard 
          key={review.id} 
          review={review}
          showActions={false}
          compact={true}
        />
      ))}
    </div>
  );
}