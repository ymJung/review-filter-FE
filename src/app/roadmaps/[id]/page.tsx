'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { RoadmapService } from '@/lib/services/roadmapService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';

interface RoadmapDetail {
  id: string;
  title: string;
  description: string;
  courseTitle: string;
  coursePlatform: string;
  nextCourseTitle?: string;
  nextCoursePlatform?: string;
  category?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  viewCount: number;
  createdAt: string;
  userId: string;
  author?: {
    id: string;
    nickname: string;
  };
}

export default function RoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, firebaseUser } = useAuth();
  const [roadmap, setRoadmap] = useState<RoadmapDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const roadmapId = params.id as string;

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = firebaseUser ? await firebaseUser.getIdToken() : undefined;
        const data = await RoadmapService.getRoadmap(roadmapId, token);
        setRoadmap(data);
      } catch (err) {
        console.error('Error fetching roadmap:', err);
        setError(err instanceof Error ? err.message : '로드맵을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (roadmapId) {
      fetchRoadmap();
    }
  }, [roadmapId, user, firebaseUser]);

  const handleGoBack = () => {
    router.push('/roadmaps');
  };

  const handleEdit = () => {
    router.push(`/write/roadmap?edit=${roadmapId}`);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !firebaseUser || !roadmap) return;

    try {
      setDeleting(true);
      const token = await firebaseUser.getIdToken();
      await RoadmapService.deleteRoadmap(roadmapId, token);
      
      alert('로드맵이 성공적으로 삭제되었습니다.');
      router.push('/roadmaps');
    } catch (error: any) {
      console.error('Error deleting roadmap:', error);
      alert(error.message || '로드맵 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'danger';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '승인됨';
      case 'PENDING':
        return '검수 중';
      case 'REJECTED':
        return '거부됨';
      default:
        return '알 수 없음';
    }
  };

  // Check if current user can edit this roadmap
  const canEdit = user && roadmap && (
    user.id === roadmap.userId || user.role === 'ADMIN'
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="danger">{error}</Alert>
        <div className="mt-4">
          <Button onClick={handleGoBack} variant="outline">
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="danger">로드맵을 찾을 수 없습니다.</Alert>
        <div className="mt-4">
          <Button onClick={handleGoBack} variant="outline">
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 뒤로가기 버튼 */}
      <div className="mb-6">
        <Button onClick={handleGoBack} variant="outline">
          ← 목록으로 돌아가기
        </Button>
      </div>

      {/* 로드맵 상세 정보 */}
      <Card className="p-6">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{roadmap.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(roadmap.status)}>
                {getStatusText(roadmap.status)}
              </Badge>
              {canEdit && (
                <div className="flex gap-2">
                  <Button onClick={handleEdit} size="sm">
                    수정
                  </Button>
                  <Button 
                    onClick={handleDeleteClick} 
                    size="sm" 
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                    disabled={deleting}
                  >
                    삭제
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* 메타 정보 */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {roadmap.author && (
              <span>작성자: {roadmap.author.nickname}</span>
            )}
            <span>조회수: {roadmap.viewCount?.toLocaleString() || 0}</span>
            <span>
              작성일: {new Date(roadmap.createdAt).toLocaleDateString('ko-KR')}
            </span>
            {roadmap.category && (
              <span>카테고리: {roadmap.category}</span>
            )}
          </div>
        </div>

        {/* 설명 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">로드맵 설명</h2>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {roadmap.description}
          </p>
        </div>

        {/* 강의 정보 */}
        <div className="space-y-6">
          {/* 현재 강의 */}
          <div>
            <h2 className="text-lg font-semibold mb-3">현재 강의</h2>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="font-medium text-blue-900">{roadmap.courseTitle}</div>
              <div className="text-blue-700 text-sm mt-1">
                플랫폼: {roadmap.coursePlatform}
              </div>
            </div>
          </div>

          {/* 다음 강의 */}
          {roadmap.nextCourseTitle && (
            <div>
              <h2 className="text-lg font-semibold mb-3">다음 추천 강의</h2>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="font-medium text-green-900">{roadmap.nextCourseTitle}</div>
                {roadmap.nextCoursePlatform && (
                  <div className="text-green-700 text-sm mt-1">
                    플랫폼: {roadmap.nextCoursePlatform}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              로드맵 삭제 확인
            </h3>
            <p className="text-gray-600 mb-6">
              정말로 이 로드맵을 삭제하시겠습니까?<br />
              <span className="font-medium">&quot;{roadmap?.title}&quot;</span><br />
              <span className="text-sm text-red-600">이 작업은 되돌릴 수 없습니다.</span>
            </p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={handleDeleteCancel}
                variant="outline"
                disabled={deleting}
              >
                취소
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50"
                disabled={deleting}
              >
                {deleting ? '삭제 중...' : '삭제'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
