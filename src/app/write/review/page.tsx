'use client';

import { Layout, Container } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ReviewForm } from '@/components/review/ReviewForm';
import { useAuth } from '@/components/auth/AuthProvider';

export default function WriteReviewPage() {
  const { canCreateContent } = useAuth();

  return (
    <Layout>
      <ProtectedRoute requireAuth={true}>
        <Container className="py-8">
          {canCreateContent ? (
            <ReviewForm />
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <div className="text-4xl mb-4">🔒</div>
                <p className="text-lg font-medium">리뷰 작성 권한이 없습니다</p>
                <p className="text-sm">로그인 후 리뷰를 작성할 수 있습니다.</p>
              </div>
            </div>
          )}
        </Container>
      </ProtectedRoute>
    </Layout>
  );
}