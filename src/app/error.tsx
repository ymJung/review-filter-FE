'use client';

import { useEffect } from 'react';
import { Button, Alert } from '@/components/ui';
import { logError } from '@/lib/utils/errorHandler';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error for debugging
    logError(error, 'global_error_page', {
      digest: error.digest,
      pathname: window.location.pathname,
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <Alert variant="danger" title="오류가 발생했습니다">
          <div className="space-y-4">
            <p>
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium">
                  개발자 정보 (개발 환경에서만 표시)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto">
                  <div className="mb-2">
                    <strong>Error:</strong> {error.message}
                  </div>
                  {error.digest && (
                    <div className="mb-2">
                      <strong>Digest:</strong> {error.digest}
                    </div>
                  )}
                  {error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={reset}
                variant="outline"
                size="sm"
              >
                다시 시도
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                size="sm"
              >
                홈으로 이동
              </Button>
            </div>
          </div>
        </Alert>
      </div>
    </div>
  );
}