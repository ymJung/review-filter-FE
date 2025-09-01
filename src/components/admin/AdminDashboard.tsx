'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';

interface AdminStats {
  totalUsers: number;
  totalReviews: number;
  totalRoadmaps: number;
  pendingReviews: number;
  pendingRoadmaps: number;
  blockedUsers: number;
  recentActivity: {
    newUsers: number;
    newReviews: number;
    newRoadmaps: number;
  };
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { firebaseUser } = useAuth();

  useEffect(() => {
    // Wait for Firebase user to be ready to include ID token
    if (!firebaseUser) return;
    fetchAdminStats();
  }, [firebaseUser]);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      setError(null);

      let headers: HeadersInit = {};
      try {
        const token = await firebaseUser?.getIdToken();
        if (token) {
          headers = { ...headers, Authorization: `Bearer ${token}` };
        }
      } catch {}

      const response = await fetch('/api/admin/stats', { headers });
      if (!response.ok) {
        throw new Error('통계를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.error?.message || '통계를 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Loading text="관리자 통계를 불러오는 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">통계 데이터가 없습니다.</p>
      </div>
    );
  }

  const statCards = [
    {
      title: '전체 사용자',
      value: stats.totalUsers,
      icon: '👥',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: '전체 리뷰',
      value: stats.totalReviews,
      icon: '📝',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: '전체 로드맵',
      value: stats.totalRoadmaps,
      icon: '🗺️',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: '검수 대기',
      value: stats.pendingReviews + stats.pendingRoadmaps,
      icon: '⏳',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <span className="text-xl">{stat.icon}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>⏳</span>
              <span>검수 대기 항목</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">리뷰 검수 대기</span>
                <Badge variant={stats.pendingReviews > 0 ? 'warning' : 'success'}>
                  {stats.pendingReviews}개
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">로드맵 검수 대기</span>
                <Badge variant={stats.pendingRoadmaps > 0 ? 'warning' : 'success'}>
                  {stats.pendingRoadmaps}개
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">블록된 사용자</span>
                <Badge variant={stats.blockedUsers > 0 ? 'danger' : 'success'}>
                  {stats.blockedUsers}명
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📈</span>
              <span>최근 활동 (7일)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">신규 사용자</span>
                <span className="font-semibold text-blue-600">
                  +{stats.recentActivity.newUsers}명
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">신규 리뷰</span>
                <span className="font-semibold text-green-600">
                  +{stats.recentActivity.newReviews}개
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">신규 로드맵</span>
                <span className="font-semibold text-purple-600">
                  +{stats.recentActivity.newRoadmaps}개
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>⚡</span>
            <span>빠른 작업</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl mb-2">📝</div>
              <h3 className="font-medium text-gray-900 mb-1">리뷰 검수</h3>
              <p className="text-sm text-gray-600 mb-3">
                {stats.pendingReviews}개 대기 중
              </p>
              <Badge variant={stats.pendingReviews > 0 ? 'warning' : 'success'}>
                {stats.pendingReviews > 0 ? '검수 필요' : '완료'}
              </Badge>
            </div>

            <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl mb-2">🗺️</div>
              <h3 className="font-medium text-gray-900 mb-1">로드맵 검수</h3>
              <p className="text-sm text-gray-600 mb-3">
                {stats.pendingRoadmaps}개 대기 중
              </p>
              <Badge variant={stats.pendingRoadmaps > 0 ? 'warning' : 'success'}>
                {stats.pendingRoadmaps > 0 ? '검수 필요' : '완료'}
              </Badge>
            </div>

            <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl mb-2">👥</div>
              <h3 className="font-medium text-gray-900 mb-1">사용자 관리</h3>
              <p className="text-sm text-gray-600 mb-3">
                {stats.blockedUsers}명 블록됨
              </p>
              <Badge variant={stats.blockedUsers > 0 ? 'danger' : 'success'}>
                {stats.blockedUsers > 0 ? '관리 필요' : '정상'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
