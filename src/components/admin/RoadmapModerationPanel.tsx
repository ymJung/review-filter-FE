'use client';

<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Roadmap, RoadmapStatus } from '@/types';
=======
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Roadmap } from '@/types';
>>>>>>> origin/main
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import { formatRelativeTime, truncateText } from '@/lib/utils';

interface RoadmapWithDetails extends Roadmap {
  author?: {
    id: string;
    nickname: string;
  };
  course?: {
    id: string;
    title: string;
    platform: string;
  };
  nextCourse?: {
    id: string;
    title: string;
    platform: string;
  };
}

export function RoadmapModerationPanel() {
  const { firebaseUser } = useAuth();
  const hasFetchedData = useRef(false);
  const [roadmaps, setRoadmaps] = useState<RoadmapWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'PENDING' | 'REJECTED' | 'ALL'>('PENDING');
  const { firebaseUser } = useAuth();

  useEffect(() => {
<<<<<<< HEAD
    if (!firebaseUser) return;
    fetchRoadmaps();
  }, [filter, firebaseUser]);
=======
    // Reset the flag when filter changes
    hasFetchedData.current = false;
  }, [filter]);
>>>>>>> origin/main

  useEffect(() => {
    // Reset the flag when user changes
    hasFetchedData.current = false;
  }, [firebaseUser]);

  useEffect(() => {
    // Fetch data when user is available and we haven't fetched yet
    if (firebaseUser && !hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchRoadmaps();
    }
  }, [firebaseUser, filter]);

  const fetchRoadmaps = async () => {
    try {
      // Wait for firebaseUser to be available
      if (!firebaseUser) {
        console.log('No firebaseUser available');
        hasFetchedData.current = false; // Reset flag if no user
        return;
      }

      console.log('Firebase user available, getting token...');
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filter !== 'ALL') {
        params.set('status', filter);
      }
      params.set('limit', '50');

<<<<<<< HEAD
      let headers: HeadersInit = {};
      try {
        const token = await firebaseUser?.getIdToken();
        if (token) headers = { Authorization: `Bearer ${token}` };
      } catch {}

      const response = await fetch(`/api/admin/roadmaps?${params.toString()}`, { headers, cache: 'no-store' });
=======
      // Get auth token
      const token = await firebaseUser.getIdToken();
      console.log('Token retrieved:', token ? 'Available' : 'Not available');

      const response = await fetch(`/api/admin/roadmaps?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('API response status:', response.status);
>>>>>>> origin/main
      if (!response.ok) {
        throw new Error('로드맵 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      if (data.success) {
        setRoadmaps(data.data || []);
      } else {
        throw new Error(data.error?.message || '로드맵 목록을 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Error fetching roadmaps:', error);
      setError(error.message);
      hasFetchedData.current = false; // Reset flag on error so we can retry
    } finally {
      setLoading(false);
    }
  };

  const handleRoadmapAction = async (roadmapId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      if (!firebaseUser) {
        throw new Error('인증이 필요합니다.');
      }

      setProcessingId(roadmapId);

<<<<<<< HEAD
      let headers: HeadersInit = { 'Content-Type': 'application/json' };
      try {
        const token = await firebaseUser?.getIdToken();
        if (token) headers = { ...headers, Authorization: `Bearer ${token}` };
      } catch {}

      const response = await fetch(`/api/admin/roadmaps/${roadmapId}`, {
        method: 'PATCH',
        headers,
=======
      // Get auth token
      const token = await firebaseUser.getIdToken();

      const response = await fetch(`/api/admin/roadmaps/${roadmapId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
>>>>>>> origin/main
        body: JSON.stringify({
          action,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error('로드맵 처리에 실패했습니다.');
      }

      const data = await response.json();
      if (data.success) {
        const newStatus: RoadmapStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
        setRoadmaps(prev => {
          const updated = prev.map(r => r.id === roadmapId ? { ...r, status: newStatus } : r);
          if (filter !== 'ALL') {
            return updated.filter(r => r.status === filter);
          }
          return updated;
        });
        fetchRoadmaps();
      } else {
        throw new Error(data.error?.message || '로드맵 처리에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Error processing roadmap:', error);
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

  if (loading) {
    return <Loading text="로드맵 목록을 불러오는 중..." />;
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
              { key: 'PENDING' as const, label: '검수 대기', count: roadmaps.filter(r => r.status === 'PENDING').length },
              { key: 'REJECTED' as const, label: '거부됨', count: roadmaps.filter(r => r.status === 'REJECTED').length },
              { key: 'ALL' as const, label: '전체', count: roadmaps.length },
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

      {/* Roadmaps List */}
      {roadmaps.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-500">
              <div className="text-4xl mb-4">🗺️</div>
              <p className="text-lg font-medium mb-2">검수할 로드맵이 없습니다</p>
              <p className="text-sm">모든 로드맵이 처리되었습니다.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {roadmaps.map((roadmap) => {
            const createdAt = roadmap.createdAt instanceof Date ? roadmap.createdAt : new Date(roadmap.createdAt as any);
            return (
            <Card key={roadmap.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight mb-2">
                      {roadmap.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {roadmap.author && (
                        <Badge variant="outline" size="sm">
                          작성자: {roadmap.author.nickname}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-1">
                    {getStatusBadge(roadmap.status)}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">설명</h4>
                    <p className="text-gray-700 leading-relaxed">
                      {truncateText(roadmap.description, 200)}
                    </p>
                  </div>

                  {/* Course Path */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">학습 경로</h4>
                    <div className="flex items-center space-x-4">
                      {roadmap.course && (
                        <div className="flex-1 p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm font-medium text-blue-900">
                            {roadmap.course.title}
                          </div>
                          <div className="text-xs text-blue-600">
                            {roadmap.course.platform}
                          </div>
                        </div>
                      )}
                      
                      {roadmap.nextCourse && (
                        <>
                          <div className="text-gray-400">→</div>
                          <div className="flex-1 p-3 bg-green-50 rounded-lg">
                            <div className="text-sm font-medium text-green-900">
                              {roadmap.nextCourse.title}
                            </div>
                            <div className="text-xs text-green-600">
                              {roadmap.nextCourse.platform}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Meta Information */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        {roadmap.author && (
                          <span className="font-medium">{roadmap.author.nickname}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>{formatRelativeTime(createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {roadmap.status === 'PENDING' && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRoadmapAction(roadmap.id, 'reject')}
                          disabled={processingId === roadmap.id}
                        >
                          {processingId === roadmap.id ? '처리 중...' : '거부'}
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleRoadmapAction(roadmap.id, 'approve')}
                          disabled={processingId === roadmap.id}
                        >
                          {processingId === roadmap.id ? '처리 중...' : '승인'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      )}
    </div>
  );
}
