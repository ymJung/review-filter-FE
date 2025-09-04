'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Layout, Container } from '@/components/layout';
import { RoadmapForm } from '@/components/roadmap/RoadmapForm';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Loading } from '@/components/ui/Loading';
import { useAuth } from '@/components/auth/AuthProvider';
import { RoadmapService } from '@/lib/services/roadmapService';
import { RoadmapFormData } from '@/types';
import Link from 'next/link';

function WriteRoadmapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, firebaseUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<RoadmapFormData | null>(null);

  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

  // Load roadmap data for editing
  useEffect(() => {
    const loadRoadmapForEdit = async () => {
      if (!isEditMode || !editId || !user) return;

      try {
        setLoading(true);
        setError(null);

        const token = await firebaseUser!.getIdToken();
        const roadmap = await RoadmapService.getRoadmap(editId, token);

        // Check if user has permission to edit
        if (roadmap.userId !== user.id && user.role !== 'ADMIN') {
          setError('이 로드맵을 수정할 권한이 없습니다.');
          return;
        }

        // Set initial data for form
        setInitialData({
          title: roadmap.title,
          description: roadmap.description,
          courseTitle: roadmap.courseTitle,
          coursePlatform: roadmap.coursePlatform,
          nextCourses: roadmap.nextCourses || [],
        });
      } catch (error: any) {
        console.error('Error loading roadmap for edit:', error);
        setError(error.message || '로드맵을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadRoadmapForEdit();
  }, [isEditMode, editId, user, firebaseUser]);

  const handleSubmit = async (formData: RoadmapFormData) => {
    if (!user || !firebaseUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const token = await firebaseUser.getIdToken();

      if (isEditMode && editId) {
        // Update existing roadmap
        await RoadmapService.updateRoadmap(editId, formData, token);
        alert('로드맵이 성공적으로 수정되었습니다. 검수 후 공개됩니다.');
        router.push(`/roadmaps/${editId}`);
      } else {
        // Create new roadmap
        const newRoadmap = await RoadmapService.createRoadmap(formData, token);
        alert('로드맵이 성공적으로 등록되었습니다. 검수 후 공개됩니다.');
        router.push(`/roadmaps/${newRoadmap.id}`);
      }
    } catch (error: any) {
      console.error('Error saving roadmap:', error);
      setError(error.message || (isEditMode ? '로드맵 수정에 실패했습니다.' : '로드맵 등록에 실패했습니다.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    const message = isEditMode 
      ? '수정 중인 내용이 사라집니다. 정말 취소하시겠습니까?'
      : '작성 중인 내용이 사라집니다. 정말 취소하시겠습니까?';
    
    if (confirm(message)) {
      if (isEditMode && editId) {
        router.push(`/roadmaps/${editId}`);
      } else {
        router.push('/roadmaps');
      }
    }
  };

  // Check if user is logged in
  if (!user) {
    return (
      <Layout className="bg-gray-50 text-gray-900">
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

  // Show loading while fetching roadmap data for edit
  if (isEditMode && loading) {
    return (
      <Layout className="bg-gray-50 text-gray-900">
        <Container className="py-8">
          <Loading />
        </Container>
      </Layout>
    );
  }

  return (
    <Layout className="bg-gray-50 text-gray-900">
      <Container className="py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href={isEditMode && editId ? `/roadmaps/${editId}` : '/roadmaps'}>
              <Button variant="ghost" size="sm">
                ← {isEditMode ? '로드맵 상세로' : '로드맵 목록으로'}
              </Button>
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditMode ? '로드맵 수정' : '로드맵 작성'}
          </h1>
          <p className="text-gray-600">
            {isEditMode 
              ? '로드맵 정보를 수정해보세요.'
              : '다른 학습자들에게 도움이 되는 학습 경로를 공유해보세요.'
            }
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
            initialData={initialData || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitting={submitting}
          />
        </div>
      </Container>
    </Layout>
  );
}

export default function WriteRoadmapPage() {
  return (
    <Suspense fallback={
      <Layout className="bg-gray-50 text-gray-900">
        <Container className="py-8">
          <Loading />
        </Container>
      </Layout>
    }>
      <WriteRoadmapContent />
    </Suspense>
  );
}
