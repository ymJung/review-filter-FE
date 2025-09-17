'use client';

import { useState, useEffect } from 'react';
import { Layout, Container } from '@/components/layout';
import { RoadmapCard } from '@/components/roadmap/RoadmapCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import { ContentRestriction } from '@/components/auth/ContentRestriction';
import { RoleGuard, AuthenticatedOnly } from '@/components/auth/RoleGuard';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/components/auth/AuthProvider';
import { RoadmapService } from '@/lib/services/roadmapService';
import { Roadmap } from '@/types';
import Link from 'next/link';

export default function RoadmapsPage() {
  const { user } = useAuth();
  const {
    isAuthenticated,
    canViewAllRoadmaps,
    maxRoadmapsVisible,
    shouldShowUpgradePrompts,
    upgradeMessage,
    canCreateRoadmaps,
  } = usePermissions();

  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Fetch roadmaps
  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedRoadmaps = await RoadmapService.getRoadmaps(
        50, // Get more than we need for filtering
        'APPROVED',
        selectedCategory || undefined
      );
      setRoadmaps(fetchedRoadmaps);
    } catch (error) {
      console.error('Error fetching roadmaps:', error);
      setError('로드맵을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, [selectedCategory]);

  // Show full list, but blur items after maxRoadmapsVisible for limited users
  const displayedRoadmaps = roadmaps;
  const hasMoreRoadmaps = !canViewAllRoadmaps && roadmaps.length > maxRoadmapsVisible;

  return (
    <Layout className="bg-gray-50 text-gray-900">
      <Container className="py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">학습 로드맵</h1>
            <p className="text-gray-600">체계적인 학습 경로를 통해 효율적으로 스킬을 향상시켜보세요.</p>
          </div>
          
          <RoleGuard allowedRoles={['LOGIN_NOT_AUTH', 'AUTH_LOGIN', 'AUTH_PREMIUM', 'ADMIN']}>
            <Link href="/write/roadmap">
              <Button>로드맵 작성하기</Button>
            </Link>
          </RoleGuard>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 분야</option>
              <option value="프론트엔드">프론트엔드</option>
              <option value="백엔드">백엔드</option>
              <option value="풀스택">풀스택</option>
              <option value="모바일">모바일</option>
              <option value="데이터사이언스">데이터사이언스</option>
              <option value="DevOps">DevOps</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="danger" className="mb-8">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchRoadmaps}
              className="ml-4"
            >
              다시 시도
            </Button>
          </Alert>
        )}

        {/* Roadmaps Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedRoadmaps.map((roadmap, idx) => (
              <RoadmapCard
                key={roadmap.id}
                roadmap={roadmap}
                blurred={!canViewAllRoadmaps ? idx >= maxRoadmapsVisible : false}
              />
            ))}
          </div>
        )}

        {/* Access Restriction Message */}
        {hasMoreRoadmaps && !canViewAllRoadmaps && (
          <div className="mt-8">
            <ContentRestriction type="roadmap" />
          </div>
        )}

        {/* Upgrade Prompt */}
        {shouldShowUpgradePrompts && upgradeMessage && (
          <div className="mt-8">
            <Card className="bg-green-50 border-green-200 p-6 text-center">
                <div className="mb-4">
                  <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">더 많은 로드맵을 확인하세요</h3>
                <p className="text-gray-600 mb-4">{upgradeMessage}</p>
                <div className="flex justify-center space-x-4">
                  {canCreateRoadmaps ? (
                    <Link href="/write/roadmap">
                      <Button>로드맵 작성하기</Button>
                    </Link>
                  ) : (
                    <Link href="/login">
                      <Button>로그인하기</Button>
                    </Link>
                  )}
                  {isAuthenticated && (
                    <Button variant="outline">프리미엄 업그레이드</Button>
                  )}
                </div>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && displayedRoadmaps.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <div className="text-4xl mb-4">🗺️</div>
              <p className="text-lg font-medium">
                {selectedCategory ? `${selectedCategory} 분야의 로드맵이 없습니다` : '아직 로드맵이 없습니다'}
              </p>
              <p className="text-sm">첫 번째 로드맵을 작성해보세요!</p>
            </div>
            <AuthenticatedOnly>
              <div className="mt-6">
                <Link href="/write/roadmap">
                  <Button>로드맵 작성하기</Button>
                </Link>
              </div>
            </AuthenticatedOnly>
          </div>
        )}
      </Container>
    </Layout>
  );
}
