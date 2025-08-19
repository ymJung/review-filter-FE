import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  className = '', 
  text 
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
          sizes[size]
        )}
      />
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
        sizes[size],
        className
      )}
    />
  );
};

interface LoadingPageProps {
  text?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ 
  text = '로딩 중...' 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loading size="lg" text={text} />
    </div>
  );
};

interface LoadingOverlayProps {
  show: boolean;
  text?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  show, 
  text = '처리 중...', 
  className = '' 
}) => {
  if (!show) return null;

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50',
      className
    )}>
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <Loading size="lg" text={text} />
      </div>
    </div>
  );
};