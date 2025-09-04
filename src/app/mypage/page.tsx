'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserProfile } from '@/components/user/UserProfile';
import { StatsDashboard } from '@/components/mypage/StatsDashboard';
import { MyReviews } from '@/components/mypage/MyReviews';
import { MyRoadmaps } from '@/components/mypage/MyRoadmaps';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { Layout, Container } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { MypageService, UserStats } from '@/lib/services/mypageService';
import Link from 'next/link';

export default function MyPage() {
  const { user, firebaseUser, isAuthenticated, loading } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'roadmaps'>('overview');

  useEffect(() => {
    const fetchStats = async () => {
      if (!firebaseUser) return;

      try {
        setStatsLoading(true);
        const token = await firebaseUser.getIdToken();
        const userStats = await MypageService.getMyStats(token);
        setStats(userStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [firebaseUser]);

  if (loading) {
    return (
      <Layout className="bg-gray-50 text-gray-900">
        <Container className="py-8">
          <div className="flex items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        </Container>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout className="bg-gray-50 text-gray-900">
        <Container className="py-8">
          <Alert variant="warning" title="로그인이 필요합니다">
            <p className="mb-4">마이페이지에 접근하려면 로그인해주세요.</p>
            <Link href="/login">
              <Button>로그인하기</Button>
            </Link>
          </Alert>
        </Container>
      </Layout>
    );
  }

  const tabs = [
    { id: 'overview', label: '개요', icon: '📊' },
    { id: 'reviews', label: '내 리뷰', icon: '📝' },
    { id: 'roadmaps', label: '내 로드맵', icon: '🗺️' },
  ] as const;

  return (
    <Layout className="bg-gray-50 text-gray-900">
      <Container className="py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">마이페이지</h1>
            <p className="text-gray-600 mt-1">
              안녕하세요, {user?.nickname || '사용자'}님! 👋
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Stats Dashboard */}
        {stats && (
          <div className="mb-8">
            <StatsDashboard stats={stats} loading={statsLoading} />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* User Profile */}
              <div className="lg:col-span-2">
                <UserProfile />
              </div>
              
              {/* Quick Actions */}
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 작업</h3>
                  <div className="space-y-3">
                    <Link href="/write/review">
                      <Button className="w-full">
                        📝 리뷰 작성하기
                      </Button>
                    </Link>
                    <Link href="/write/roadmap">
                      <Button className="w-full" variant="outline">
                        🗺️ 로드맵 작성하기
                      </Button>
                    </Link>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">둘러보기</h3>
                  <div className="space-y-2">
                    <Link href="/reviews" className="block text-blue-600 hover:text-blue-800 transition-colors">
                      리뷰 둘러보기 →
                    </Link>
                    <Link href="/roadmaps" className="block text-blue-600 hover:text-blue-800 transition-colors">
                      로드맵 둘러보기 →
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && <MyReviews />}
          {activeTab === 'roadmaps' && <MyRoadmaps />}
        </div>
      </Container>
    </Layout>
  );
}
