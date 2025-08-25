'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Loading } from '@/components/ui/Loading';
import { SummaryService } from '@/lib/services/summaryService';
import { ReviewSummary as ReviewSummaryType } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ReviewSummaryProps {
  initialSummary?: ReviewSummaryType;
  category?: string;
  platform?: string;
  className?: string;
  autoLoad?: boolean; // 자동으로 최근 요약을 로드할지 여부
}

export function ReviewSummary({ 
  initialSummary, 
  category, 
  platform, 
  className = '',
  autoLoad = false
}: ReviewSummaryProps) {
  const [summary, setSummary] = useState<ReviewSummaryType | null>(initialSummary || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 컴포넌트 마운트 시 최근 요약 자동 로드
  useEffect(() => {
    if (autoLoad && !initialSummary) {
      loadRecentSummary();
    }
  }, [autoLoad, initialSummary]);

  const loadRecentSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const recentSummary = await SummaryService.getRecentSummary();
      setSummary(recentSummary);
    } catch (error: any) {
      console.error('Error loading recent summary:', error);
      // 권한 부족이나 요약이 없는 경우는 에러로 처리하지 않음
      if (error.message?.includes('permissions') || 
          error.message?.includes('요약이 없습니다') ||
          error.message?.includes('not found')) {
        // 조용히 처리 - 요약이 없는 상태로 유지
        setSummary(null);
      } else {
        setError(error.message || '요약을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const newSummary = await SummaryService.generateSummary({
        category,
        platform,
        limit: 15, // Use more reviews for better summary
      });
      
      setSummary(newSummary);
    } catch (error: any) {
      console.error('Error generating summary:', error);
      setError(error.message || '요약 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: ko 
    });
  };

  const isExpired = summary ? SummaryService.isSummaryExpired(summary) : false;

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">🤖 AI 리뷰 요약</h3>
          <Badge variant="outline">생성 중...</Badge>
        </div>
        <Loading />
        <p className="text-sm text-gray-500 mt-4 text-center">
          AI가 리뷰들을 분석하여 요약을 생성하고 있습니다...
        </p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">🤖 AI 리뷰 요약</h3>
          <Button variant="outline" size="sm" onClick={generateSummary}>
            다시 시도
          </Button>
        </div>
        <Alert variant="danger">
          {error}
        </Alert>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">🤖 AI 리뷰 요약</h3>
          <Button variant="outline" size="sm" onClick={generateSummary}>
            요약 생성
          </Button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">🤖</div>
          <p className="text-lg font-medium mb-2">AI 리뷰 요약이 없습니다</p>
          <p className="text-sm mb-4">
            최근 리뷰들을 분석하여 인사이트를 제공해드립니다.
          </p>
          <Button onClick={generateSummary}>
            AI 요약 생성하기
          </Button>
        </div>
      </Card>
    );
  }

  const formattedSummary = SummaryService.formatSummaryForDisplay(summary);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🤖 AI 리뷰 요약</h3>
        <div className="flex items-center gap-2">
          {isExpired && (
            <Badge variant="warning">만료됨</Badge>
          )}
          <Badge variant="outline">
            {formattedSummary.metadata.reviewCount}개 리뷰 분석
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateSummary}
            disabled={loading}
          >
            새로 생성
          </Button>
        </div>
      </div>

      <div className="prose max-w-none">
        <div className="whitespace-pre-line text-gray-700 leading-relaxed">
          {formattedSummary.content}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            생성일: {formatDate(formattedSummary.metadata.createdAt)}
          </span>
          <span>
            {isExpired ? '만료됨' : `만료: ${formatDate(formattedSummary.metadata.expiresAt)}`}
          </span>
        </div>
      </div>

      {isExpired && (
        <Alert variant="warning" className="mt-4">
          이 요약은 만료되었습니다. 최신 리뷰를 반영하려면 새로 생성해주세요.
        </Alert>
      )}
    </Card>
  );
}