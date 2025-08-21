'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface UserStats {
  reviewCount: number;
  roadmapCount: number;
  commentCount: number;
  totalViews: number;
  approvedReviews: number;
  pendingReviews: number;
  approvedRoadmaps: number;
  pendingRoadmaps: number;
}

interface StatsDashboardProps {
  stats: UserStats;
  loading?: boolean;
  className?: string;
}

export function StatsDashboard({ stats, loading = false, className = '' }: StatsDashboardProps) {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: '작성한 리뷰',
      value: stats.reviewCount,
      subtext: `승인 ${stats.approvedReviews} · 대기 ${stats.pendingReviews}`,
      color: 'blue',
      icon: '📝'
    },
    {
      title: '작성한 로드맵',
      value: stats.roadmapCount,
      subtext: `승인 ${stats.approvedRoadmaps} · 대기 ${stats.pendingRoadmaps}`,
      color: 'green',
      icon: '🗺️'
    },
    {
      title: '작성한 댓글',
      value: stats.commentCount,
      subtext: '총 댓글 수',
      color: 'purple',
      icon: '💬'
    },
    {
      title: '총 조회수',
      value: stats.totalViews,
      subtext: '승인된 콘텐츠 조회수',
      color: 'orange',
      icon: '👀'
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {statCards.map((stat, index) => (
        <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{stat.icon}</span>
            <Badge variant="outline" className="text-xs">
              {stat.color}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{stat.subtext}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}