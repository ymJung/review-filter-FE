'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout, Container } from '@/components/layout';
import { ReviewCard } from '@/components/review/ReviewCard';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { LoadingPage } from '@/components/ui/Loading';
import { useAuth } from '@/components/auth/AuthProvider';
import { getReview } from '@/lib/services/reviewService';
import { Review, Course } from '@/types';
import Link from 'next/link';

interface ReviewWithDetails extends Review {
  course?: Course;
  author?: {
    id: string;
    nickname: string;
  };
}

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, firebaseUser } = useAuth();
  
  const [review, setReview] = useState<ReviewWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reviewId = params.id as string;

  useEffect(() => {
    const fetchReview = async () => {
      if (!reviewId) return;

      setLoading(true);
      setError(null);

      try {
        // Get auth token if available
        let token = '';
        if (firebaseUser) {
          token = await firebaseUser.getIdToken();
        }

        const response = await fetch(`/api/reviews/${reviewId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('리뷰를 찾을 수 없습니다.');
          } else {
            throw new Error('리뷰를 불러오는데 실패했습니다.');
          }
          return;
        }

        const result = await response.json();
        if (result.success) {
          setReview(result.data);
        } else {
          setError(result.error?.message || '리뷰를 불러오는데 실패했습니다.');
        }
      } catch (err: any) {
        setError(err.message || '리뷰를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [reviewId, firebaseUser]);

  const handleEdit = () => {
    router.push(`/reviews/${reviewId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('정말로 이 리뷰를 삭제하시겠습니까?')) {
      return;
    }

    try {
      if (!firebaseUser) {
        alert('로그인이 필요합니다.');
        return;
      }

      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('리뷰가 삭제되었습니다.');
        router.push('/reviews');
      } else {
        const errorData = await response.json();
        alert(errorData.error?.message || '삭제에 실패했습니다.');
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return <LoadingPage text="리뷰 로딩 중..." />;
  }

  if (error) {
    return (
      <Layout>
        <Container className="py-8">
          <Alert variant="danger" title="오류가 발생했습니다">
            <p className="mb-4">{error}</p>
            <Link href="/reviews">
              <Button>리뷰 목록으로 돌아가기</Button>
            </Link>
          </Alert>
        </Container>
      </Layout>
    );
  }

  if (!review) {
    return (
      <Layout>
        <Container className="py-8">
          <Alert variant="warning" title="리뷰를 찾을 수 없습니다">
            <p className="mb-4">요청하신 리뷰가 존재하지 않거나 삭제되었습니다.</p>
            <Link href="/reviews">
              <Button>리뷰 목록으로 돌아가기</Button>
            </Link>
          </Alert>
        </Container>
      </Layout>
    );
  }

  const isOwner = user?.id === review.userId;
  const canViewFullContent = review.status === 'APPROVED' || isOwner || user?.role === 'ADMIN';

  return (
    <Layout>
      <Container className="py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/reviews">
            <Button variant="ghost" size="sm">
              ← 리뷰 목록으로 돌아가기
            </Button>
          </Link>
        </div>

        {/* Access Warning for Non-Approved Reviews */}
        {review.status !== 'APPROVED' && !isOwner && user?.role !== 'ADMIN' && (
          <div className="mb-6">
            <Alert variant="warning" title="제한된 접근">
              이 리뷰는 아직 검수 중이거나 승인되지 않아 일부 내용만 표시됩니다.
            </Alert>
          </div>
        )}

        {/* Review Detail */}
        <div className="max-w-4xl mx-auto">
          <ReviewCard
            review={review}
            showActions={isOwner || user?.role === 'ADMIN'}
            showFullContent={canViewFullContent}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Related Actions */}
        <div className="mt-8 text-center">
          <div className="space-x-4">
            {review.course && (
              <Link href={`/courses/${review.course.id}/reviews`}>
                <Button variant="outline">
                  이 강의의 다른 리뷰 보기
                </Button>
              </Link>
            )}
            
            {user && (
              <Link href="/write/review">
                <Button>
                  내 리뷰 작성하기
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Comments Section (placeholder for future implementation) */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold mb-4">댓글</h3>
            <div className="text-center py-8 text-gray-500">
              <p>댓글 기능은 곧 추가될 예정입니다.</p>
            </div>
          </div>
        </div>
      </Container>
    </Layout>
  );
}