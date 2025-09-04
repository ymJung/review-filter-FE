'use client';

import { useState } from 'react';
import { Layout, Container } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { ReviewModerationPanel } from '@/components/admin/ReviewModerationPanel';
import { RoadmapModerationPanel } from '@/components/admin/RoadmapModerationPanel';
import { UserManagementPanel } from '@/components/admin/UserManagementPanel';
import { PerformanceDashboard } from '@/components/admin/PerformanceDashboard';

type AdminTab = 'dashboard' | 'reviews' | 'roadmaps' | 'users' | 'performance';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const tabs = [
    { id: 'dashboard' as AdminTab, label: '대시보드', icon: '📊' },
    { id: 'reviews' as AdminTab, label: '리뷰 검수', icon: '📝' },
    { id: 'roadmaps' as AdminTab, label: '로드맵 검수', icon: '🗺️' },
    { id: 'users' as AdminTab, label: '사용자 관리', icon: '👥' },
    { id: 'performance' as AdminTab, label: '성능 모니터링', icon: '⚡' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'reviews':
        return <ReviewModerationPanel />;
      case 'roadmaps':
        return <RoadmapModerationPanel />;
      case 'users':
        return <UserManagementPanel />;
      case 'performance':
        return <PerformanceDashboard />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <Layout className="bg-gray-50 text-gray-900">
        <Container>
          <div className="py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 페이지</h1>
              <p className="text-gray-700">플랫폼 관리 및 콘텐츠 검수를 수행할 수 있습니다.</p>
            </div>

            {/* Tab Navigation */}
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="flex border-b border-gray-200">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 bg-blue-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tab Content */}
            <div className="min-h-[600px]">
              {renderTabContent()}
            </div>
          </div>
        </Container>
      </Layout>
    </ProtectedRoute>
  );
}
