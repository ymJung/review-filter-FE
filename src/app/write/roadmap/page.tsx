'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout, Container } from '@/components/layout';
import { RoadmapForm } from '@/components/roadmap/RoadmapForm';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/components/auth/AuthProvider';
import { RoadmapService } from '@/lib/services/roadmapService';
import { RoadmapFormData } from '@/types';
import Link from 'next/link';

export default function WriteRoadmapPage() {
  const router = useRouter();
  const { user, firebaseUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: RoadmapFormData) => {
    if (!user || !firebaseUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const token = await firebaseUser.getIdToken();
      const newRoadmap = await RoadmapService.createRoadmap(formData, token);

      // Show success message and redirect
      alert('로드맵이 성공적으로 등록되었습니다. 검수 후 공개됩니다.');
      router.push(`/roadmaps/${newRoadmap.id}`);
    } catch (error: any) {
      console.error('Error creating roadmap:', error);
      setError(error.message || '로드맵 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm('작성 중인 내용이 사라집니다. 정말 취소하시겠습니까?')) {
      router.push('/roadmaps');
    }
  };

  // Check if user is logged in
  if (!user) {
    return (
      <Layout>
        <Container className="py-8">
          <Alert variant="warning" title="로그인이 필요합니다">
            <p className="mb-4">로드맵을 작성하려면 로그인이 필요합니다.</p>
            <Link href="/login">
              <Button>로그인하기</Button>
            </Link>
          </Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container className="py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/roadmaps">
              <Button variant="ghost" size="sm">
                ← 로드맵 목록으로
              </Button>
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">로드맵 작성</h1>
          <p className="text-gray-600">
            다른 학습자들에게 도움이 되는 학습 경로를 공유해보세요.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          <RoadmapForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitting={submitting}
          />
        </div>
      </Container>
    </Layout>
  );
}