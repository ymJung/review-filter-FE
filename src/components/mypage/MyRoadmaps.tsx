'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { MypageService } from '@/lib/services/mypageService';
import { Roadmap } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Loading } from '@/components/ui/Loading';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

interface MyRoadmapsProps {
  className?: string;
}

export function MyRoadmaps({ className = '' }: MyRoadmapsProps) {
  const { firebaseUser } = useAuth();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoadmaps = async () => {
      if (!firebaseUser) return;

      try {
        setLoading(true);
        setError(null);
        const token = await firebaseUser.getIdToken();
        const fetchedRoadmaps = await MypageService.getMyRoadmaps(token);
        setRoadmaps(fetchedRoadmaps);
      } catch (error: any) {
        console.error('Error fetching my roadmaps:', error);
        setError('로드맵을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmaps();
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
        <h2 className="text-xl font-semibold text-gray-900">내가 작성한 로드맵</h2>
        <Link href="/write/roadmap">
          <Button size="sm">새 로드맵 작성</Button>
        </Link>
      </div>

      {roadmaps.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <div className="text-4xl mb-4">🗺️</div>
            <p className="text-lg font-medium mb-2">아직 작성한 로드맵이 없습니다</p>
            <p className="text-sm mb-4">첫 번째 로드맵을 작성해보세요!</p>
            <Link href="/write/roadmap">
              <Button>로드맵 작성하기</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {roadmaps.map((roadmap) => (
            <Card key={roadmap.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Link href={`/roadmaps/${roadmap.id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                        {roadmap.title}
                      </h3>
                    </Link>
                    {getStatusBadge(roadmap.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    {roadmap.category && <span>{roadmap.category}</span>}
                    <span>{formatDate(roadmap.createdAt)}</span>
                    {roadmap.status === 'APPROVED' && (
                      <span>조회 {roadmap.viewCount || 0}</span>
                    )}
                  </div>
                  
                  <p className="text-gray-700 line-clamp-2 mb-3">
                    {roadmap.description}
                  </p>

                  {/* Learning Path Preview */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                      {roadmap.courseTitle}
                    </div>
                    {roadmap.nextCourseTitle && (
                      <>
                        <span className="text-gray-400">→</span>
                        <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                          {roadmap.nextCourseTitle}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Link href={`/roadmaps/${roadmap.id}`}>
                  <Button variant="outline" size="sm">
                    자세히 보기
                  </Button>
                </Link>
                {roadmap.status !== 'APPROVED' && (
                  <Link href={`/roadmaps/${roadmap.id}/edit`}>
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