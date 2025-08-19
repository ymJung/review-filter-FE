'use client';

import { Layout, Container } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ContentRestriction } from '@/components/auth/ContentRestriction';
import { RoleGuard, AuthenticatedOnly } from '@/components/auth/RoleGuard';
import { usePermissions } from '@/hooks/usePermissions';
import Link from 'next/link';

// Mock data for demonstration
const mockRoadmaps = [
  {
    id: '1',
    title: '프론트엔드 개발자 로드맵',
    description: 'HTML/CSS부터 React까지, 프론트엔드 개발자가 되기 위한 완벽한 학습 경로입니다.',
    currentCourse: 'HTML/CSS 기초',
    nextCourse: 'JavaScript 기초',
    author: '멋진개발자123',
    createdAt: '2024-01-15',
    status: 'APPROVED' as const,
  },
  {
    id: '2',
    title: '백엔드 개발자 로드맵',
    description: 'Node.js와 Express를 활용한 백엔드 개발 학습 경로입니다.',
    currentCourse: 'JavaScript 기초',
    nextCourse: 'Node.js 입문',
    author: '똑똑한고양이456',
    createdAt: '2024-01-10',
    status: 'APPROVED' as const,
  },
  {
    id: '3',
    title: '풀스택 개발자 로드맵',
    description: '프론트엔드부터 백엔드까지, 풀스택 개발자를 위한 종합 학습 경로입니다.',
    currentCourse: 'React 기초',
    nextCourse: 'Node.js + Express',
    author: '열정적인개발자789',
    createdAt: '2024-01-05',
    status: 'APPROVED' as const,
  },
];

export default function RoadmapsPage() {
  const {
    canViewAllRoadmaps,
    maxRoadmapsVisible,
    shouldShowUpgradePrompts,
    upgradeMessage,
    canCreateRoadmaps,
  } = usePermissions();

  const displayedRoadmaps = canViewAllRoadmaps 
    ? mockRoadmaps 
    : mockRoadmaps.slice(0, maxRoadmapsVisible);

  const hasMoreRoadmaps = mockRoadmaps.length > displayedRoadmaps.length;

  return (
    <Layout>
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
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">모든 분야</option>
              <option value="frontend">프론트엔드</option>
              <option value="backend">백엔드</option>
              <option value="fullstack">풀스택</option>
              <option value="mobile">모바일</option>
            </select>
            
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">난이도</option>
              <option value="beginner">초급</option>
              <option value="intermediate">중급</option>
              <option value="advanced">고급</option>
            </select>

            <input
              type="text"
              placeholder="로드맵 검색..."
              className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Roadmaps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedRoadmaps.map((roadmap) => (
            <Card key={roadmap.id} className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">{roadmap.title}</CardTitle>
                <div className="text-sm text-gray-500">
                  by {roadmap.author} • {roadmap.createdAt}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {roadmap.description}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">현재</Badge>
                    <span className="text-sm font-medium">{roadmap.currentCourse}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="success">다음</Badge>
                    <span className="text-sm font-medium">{roadmap.nextCourse}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link href={`/roadmaps/${roadmap.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      로드맵 자세히 보기
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Access Restriction Message */}
        {hasMoreRoadmaps && !canViewAllRoadmaps && (
          <div className="mt-8">
            <ContentRestriction type="roadmap" />
          </div>
        )}

        {/* Upgrade Prompt */}
        {shouldShowUpgradePrompts && upgradeMessage && (
          <div className="mt-8">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6 text-center">
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
                  <Button variant="outline">프리미엄 업그레이드</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {displayedRoadmaps.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <div className="text-4xl mb-4">🗺️</div>
              <p className="text-lg font-medium">아직 로드맵이 없습니다</p>
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