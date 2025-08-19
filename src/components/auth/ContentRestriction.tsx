'use client';

import React from 'react';
import { useAuth } from './AuthProvider';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { getUpgradeMessage, getUserAccessLevel, ContentAccessLevel } from '@/lib/services/accessControlService';
import Link from 'next/link';

interface ContentRestrictionProps {
  type: 'review' | 'roadmap' | 'comment';
  showUpgrade?: boolean;
  className?: string;
}

export const ContentRestriction: React.FC<ContentRestrictionProps> = ({
  type,
  showUpgrade = true,
  className = '',
}) => {
  const { user, isAuthenticated } = useAuth();
  const accessLevel = getUserAccessLevel(user?.role);
  const upgradeMessage = getUpgradeMessage(user?.role);

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'review':
        return '리뷰';
      case 'roadmap':
        return '로드맵';
      case 'comment':
        return '댓글';
      default:
        return '콘텐츠';
    }
  };

  const getRestrictionMessage = () => {
    if (!isAuthenticated) {
      return {
        title: '로그인이 필요합니다',
        message: `모든 ${getTypeDisplayName(type)}를 보려면 로그인해주세요.`,
        action: '로그인하기',
        actionHref: '/login',
        variant: 'warning' as const,
      };
    }

    if (accessLevel === ContentAccessLevel.LIMITED) {
      return {
        title: '제한된 접근',
        message: `모든 ${getTypeDisplayName(type)}를 보려면 리뷰를 작성해주세요.`,
        action: '리뷰 작성하기',
        actionHref: '/write/review',
        variant: 'default' as const,
      };
    }

    if (accessLevel === ContentAccessLevel.NONE) {
      return {
        title: '접근 제한',
        message: '현재 계정으로는 이 콘텐츠에 접근할 수 없습니다.',
        action: '문의하기',
        actionHref: '/contact',
        variant: 'danger' as const,
      };
    }

    return null;
  };

  const restriction = getRestrictionMessage();

  if (!restriction) {
    return null;
  }

  return (
    <div className={className}>
      <Alert variant={restriction.variant} title={restriction.title}>
        <p className="mb-4">{restriction.message}</p>
        {showUpgrade && upgradeMessage && (
          <p className="mb-4 text-sm opacity-75">{upgradeMessage}</p>
        )}
        <Link href={restriction.actionHref}>
          <Button size="sm">{restriction.action}</Button>
        </Link>
      </Alert>
    </div>
  );
};

interface ContentPreviewProps {
  content: string;
  maxLength?: number;
  showRestriction?: boolean;
  className?: string;
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  maxLength = 200,
  showRestriction = true,
  className = '',
}) => {
  const { user } = useAuth();
  const accessLevel = getUserAccessLevel(user?.role);
  
  const shouldShowPreview = accessLevel === ContentAccessLevel.LIMITED || accessLevel === ContentAccessLevel.NONE;
  
  if (!shouldShowPreview) {
    return <div className={className}>{content}</div>;
  }

  const previewContent = content.length > maxLength 
    ? content.substring(0, maxLength) + '...' 
    : content;

  return (
    <div className={className}>
      <div className="relative">
        <div className="text-gray-700">{previewContent}</div>
        {content.length > maxLength && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>
      {showRestriction && content.length > maxLength && (
        <div className="mt-4">
          <ContentRestriction type="review" />
        </div>
      )}
    </div>
  );
};

interface UpgradePromptProps {
  feature: string;
  className?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  className = '',
}) => {
  const { user } = useAuth();
  const accessLevel = getUserAccessLevel(user?.role);

  if (accessLevel === ContentAccessLevel.PREMIUM) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="p-4 text-center">
        <div className="mb-2">
          <svg className="w-8 h-8 text-yellow-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">프리미엄 기능</h3>
        <p className="text-sm text-gray-600 mb-3">
          {feature}은(는) 프리미엄 회원만 이용할 수 있습니다.
        </p>
        <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600">
          프리미엄 업그레이드
        </Button>
      </CardContent>
    </Card>
  );
};

interface AdPlaceholderProps {
  className?: string;
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({
  className = '',
}) => {
  const { user } = useAuth();
  const accessLevel = getUserAccessLevel(user?.role);

  // Don't show ads for premium users
  if (accessLevel === ContentAccessLevel.PREMIUM) {
    return null;
  }

  return (
    <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
      <div className="text-gray-500">
        <div className="text-sm font-medium mb-2">광고</div>
        <div className="text-xs">프리미엄으로 업그레이드하여 광고를 제거하세요</div>
      </div>
    </div>
  );
};