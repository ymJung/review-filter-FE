'use client';

import React, { useState, useEffect } from 'react';
import { CategoryStats } from '@/types';
import { getCategoryStats } from '@/lib/services/courseService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';

interface CategoryStatsProps {
  source?: 'reviews' | 'courses';
  limit?: number;
  title?: string;
  showPercentage?: boolean;
  className?: string;
}

export const CategoryStatsComponent: React.FC<CategoryStatsProps> = ({
  source = 'reviews',
  limit = 10,
  title = '인기 카테고리',
  showPercentage = true,
  className = '',
}) => {
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await getCategoryStats({ source, limit });
        setStats(data || []);
      } catch (err) {
        setError('카테고리 통계를 불러오는데 실패했습니다.');
        console.error('Error fetching category stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [source, limit]);

  const getProgressBarColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-gray-500',
    ];
    return colors[index % colors.length];
  };

  const getBadgeVariant = (index: number) => {
    if (index === 0) return 'default';
    if (index === 1) return 'success';
    if (index === 2) return 'warning';
    return 'secondary';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Loading size="sm" text="통계 로딩 중..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">
            <div className="text-sm">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stats.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">
            <div className="text-sm">통계 데이터가 없습니다.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="outline" size="sm">
            {source === 'reviews' ? '리뷰 기준' : '강의 기준'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.map((stat, index) => (
            <div key={stat.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={getBadgeVariant(index) as any}
                    size="sm"
                  >
                    #{index + 1}
                  </Badge>
                  <span className="font-medium text-gray-900">
                    {stat.category}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{stat.count}개</span>
                  {showPercentage && (
                    <span className="text-gray-400">({stat.percentage}%)</span>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(index)}`}
                  style={{ width: `${stat.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 text-center">
            총 {stats.reduce((sum, stat) => sum + stat.count, 0)}개의{' '}
            {source === 'reviews' ? '리뷰' : '강의'}가 {stats.length}개 카테고리에 분포
          </div>
        </div>
      </CardContent>
    </Card>
  );
};