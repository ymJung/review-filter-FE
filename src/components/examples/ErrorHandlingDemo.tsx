'use client';

import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Input,
  Alert,
  LoadingSpinner,
  SkeletonCard,
  SkeletonList,
  useToastActions,
  ErrorBoundary
} from '@/components/ui';
import { 
  useAsyncOperation, 
  useFormSubmission, 
  useDataFetching,
  useMultipleAsyncOperations 
} from '@/hooks/useAsyncOperation';
import { ValidationError, AppError } from '@/types';

// Component that demonstrates error boundary
const ErrorProneComponent: React.FC<{ shouldError: boolean }> = ({ shouldError }) => {
  if (shouldError) {
    throw new Error('This is a test error for the error boundary!');
  }
  
  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded">
      <p className="text-green-800">This component is working fine! ✅</p>
    </div>
  );
};

// Main demo component
export const ErrorHandlingDemo: React.FC = () => {
  const [shouldError, setShouldError] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  
  const { success, error, warning, info } = useToastActions();
  
  // Different types of async operations
  const dataFetch = useDataFetching({
    onSuccess: (data) => console.log('Data fetched:', data),
  });
  
  const formSubmit = useFormSubmission({
    successMessage: '폼이 성공적으로 제출되었습니다!',
    onError: (err) => console.error('Form submission failed:', err),
  });
  
  const multiOps = useMultipleAsyncOperations();

  // Simulate different types of operations
  const simulateNetworkError = async () => {
    throw new AppError('네트워크 연결을 확인해주세요.', 'NETWORK_ERROR', 0);
  };

  const simulateValidationError = async () => {
    throw new ValidationError('입력 데이터가 유효하지 않습니다.', 'INVALID_INPUT');
  };

  const simulateSuccess = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { message: '성공적으로 처리되었습니다!' };
  };

  const simulateFormSubmission = async () => {
    if (!formData.name.trim()) {
      throw new ValidationError('이름을 입력해주세요.', 'NAME_REQUIRED');
    }
    if (!formData.email.trim()) {
      throw new ValidationError('이메일을 입력해주세요.', 'EMAIL_REQUIRED');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { id: 1, ...formData };
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          에러 처리 및 사용자 경험 개선 데모
        </h1>
        <p className="text-gray-600">
          새로운 에러 처리, 토스트 알림, 로딩 상태, 스켈레톤 UI를 테스트해보세요.
        </p>
      </div>

      {/* Toast Demo */}
      <Card>
        <CardHeader>
          <CardTitle>토스트 알림 시스템</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button onClick={() => success('성공 메시지입니다!')} variant="success">
              성공 토스트
            </Button>
            <Button onClick={() => error('에러 메시지입니다!')} variant="danger">
              에러 토스트
            </Button>
            <Button onClick={() => warning('경고 메시지입니다!')} variant="outline">
              경고 토스트
            </Button>
            <Button onClick={() => info('정보 메시지입니다!')} variant="ghost">
              정보 토스트
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Boundary Demo */}
      <Card>
        <CardHeader>
          <CardTitle>에러 바운더리 데모</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setShouldError(!shouldError)}
                variant={shouldError ? "danger" : "primary"}
              >
                {shouldError ? '에러 해제' : '에러 발생'}
              </Button>
              <span className="text-sm text-gray-600">
                에러 바운더리가 에러를 잡아서 처리합니다
              </span>
            </div>
            
            <ErrorBoundary
              fallback={
                <Alert variant="danger" title="컴포넌트 에러">
                  이 컴포넌트에서 에러가 발생했지만 전체 앱은 계속 작동합니다.
                </Alert>
              }
            >
              <ErrorProneComponent shouldError={shouldError} />
            </ErrorBoundary>
          </div>
        </CardContent>
      </Card>

      {/* Async Operations Demo */}
      <Card>
        <CardHeader>
          <CardTitle>비동기 작업 및 에러 처리</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                onClick={() => dataFetch.execute(simulateSuccess)}
                disabled={dataFetch.loading}
              >
                {dataFetch.loading && <LoadingSpinner size="sm" className="mr-2" />}
                성공 시뮬레이션
              </Button>
              
              <Button 
                onClick={() => dataFetch.execute(simulateNetworkError)}
                disabled={dataFetch.loading}
                variant="outline"
              >
                {dataFetch.loading && <LoadingSpinner size="sm" className="mr-2" />}
                네트워크 에러
              </Button>
              
              <Button 
                onClick={() => dataFetch.execute(simulateValidationError)}
                disabled={dataFetch.loading}
                variant="ghost"
              >
                {dataFetch.loading && <LoadingSpinner size="sm" className="mr-2" />}
                검증 에러
              </Button>
            </div>
            
            {dataFetch.error && (
              <Alert variant="danger" title="에러 발생">
                {dataFetch.error}
              </Alert>
            )}
            
            {dataFetch.data && (
              <Alert variant="success" title="성공">
                {JSON.stringify(dataFetch.data, null, 2)}
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Submission Demo */}
      <Card>
        <CardHeader>
          <CardTitle>폼 제출 데모</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="이메일을 입력하세요"
                />
              </div>
            </div>
            
            <Button 
              onClick={() => formSubmit.execute(simulateFormSubmission)}
              disabled={formSubmit.loading}
            >
              {formSubmit.loading && <LoadingSpinner size="sm" className="mr-2" />}
              폼 제출
            </Button>
            
            {formSubmit.error && (
              <Alert variant="danger" title="폼 제출 실패">
                {formSubmit.error}
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Multiple Operations Demo */}
      <Card>
        <CardHeader>
          <CardTitle>다중 비동기 작업</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                onClick={() => multiOps.executeOperation('op1', simulateSuccess)}
                disabled={multiOps.getOperationState('op1').loading}
              >
                {multiOps.getOperationState('op1').loading && <LoadingSpinner size="sm" className="mr-2" />}
                작업 1
              </Button>
              
              <Button 
                onClick={() => multiOps.executeOperation('op2', simulateNetworkError)}
                disabled={multiOps.getOperationState('op2').loading}
              >
                {multiOps.getOperationState('op2').loading && <LoadingSpinner size="sm" className="mr-2" />}
                작업 2 (에러)
              </Button>
              
              <Button 
                onClick={() => multiOps.executeOperation('op3', simulateSuccess)}
                disabled={multiOps.getOperationState('op3').loading}
              >
                {multiOps.getOperationState('op3').loading && <LoadingSpinner size="sm" className="mr-2" />}
                작업 3
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>진행 중인 작업: {multiOps.isAnyLoading ? '있음' : '없음'}</p>
              <p>에러가 있는 작업: {multiOps.hasAnyError ? '있음' : '없음'}</p>
            </div>
            
            {['op1', 'op2', 'op3'].map(key => {
              const state = multiOps.getOperationState(key);
              if (!state.data && !state.error) return null;
              
              return (
                <Alert 
                  key={key}
                  variant={state.error ? 'danger' : 'success'}
                  title={`작업 ${key}`}
                >
                  {state.error || JSON.stringify(state.data)}
                </Alert>
              );
            })}
            
            <Button 
              onClick={multiOps.resetAllOperations}
              variant="outline"
              size="sm"
            >
              모든 작업 초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton Loading Demo */}
      <Card>
        <CardHeader>
          <CardTitle>스켈레톤 로딩 UI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">일반 스켈레톤</h4>
                <SkeletonCard />
              </div>
              <div>
                <h4 className="font-medium mb-3">스켈레톤 리스트</h4>
                <SkeletonList count={2} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};