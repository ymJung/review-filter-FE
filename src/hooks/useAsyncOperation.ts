'use client';

import { useState, useCallback } from 'react';
import { useToastActions } from '@/components/ui';
import { processError, logError, getErrorMessage } from '@/lib/utils/errorHandler';

interface UseAsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorContext?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useAsyncOperation = <T = any>(
  options: UseAsyncOperationOptions = {}
) => {
  const {
    onSuccess,
    onError,
    successMessage,
    errorContext,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { success, error: showErrorToastMessage } = useToastActions();

  const execute = useCallback(
    async (operation: () => Promise<T>): Promise<T | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await operation();
        
        setState({
          data: result,
          loading: false,
          error: null,
        });

        // Show success toast if enabled and message provided
        if (showSuccessToast && successMessage) {
          success(successMessage);
        }

        // Call success callback
        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        const errorMessage = getErrorMessage(err, errorContext);
        
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });

        // Log error for debugging
        logError(err, errorContext);

        // Show error toast if enabled
        if (showErrorToast) {
          showErrorToastMessage(errorMessage);
        }

        // Call error callback
        if (onError) {
          onError(err);
        }

        return null;
      }
    },
    [onSuccess, onError, successMessage, errorContext, showSuccessToast, showErrorToast, success, showErrorToastMessage]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};

// Specialized hook for form submissions
export const useFormSubmission = <T = any>(
  options: UseAsyncOperationOptions = {}
) => {
  return useAsyncOperation<T>({
    successMessage: '성공적으로 저장되었습니다.',
    errorContext: 'form_submission',
    ...options,
  });
};

// Specialized hook for data fetching
export const useDataFetching = <T = any>(
  options: UseAsyncOperationOptions = {}
) => {
  return useAsyncOperation<T>({
    errorContext: 'data_fetching',
    showSuccessToast: false, // Usually don't show success toast for fetching
    ...options,
  });
};

// Specialized hook for file uploads
export const useFileUpload = (
  options: UseAsyncOperationOptions = {}
) => {
  return useAsyncOperation<string>({
    successMessage: '파일이 성공적으로 업로드되었습니다.',
    errorContext: 'file_upload',
    ...options,
  });
};

// Hook for handling multiple async operations
export const useMultipleAsyncOperations = () => {
  const [operations, setOperations] = useState<Record<string, AsyncOperationState<any>>>({});

  const executeOperation = useCallback(
    async <T>(
      key: string,
      operation: () => Promise<T>,
      options: UseAsyncOperationOptions = {}
    ): Promise<T | null> => {
      setOperations(prev => ({
        ...prev,
        [key]: { data: null, loading: true, error: null }
      }));

      try {
        const result = await operation();
        
        setOperations(prev => ({
          ...prev,
          [key]: { data: result, loading: false, error: null }
        }));

        return result;
      } catch (err) {
        const errorMessage = getErrorMessage(err, options.errorContext);
        
        setOperations(prev => ({
          ...prev,
          [key]: { data: null, loading: false, error: errorMessage }
        }));

        logError(err, options.errorContext);
        return null;
      }
    },
    []
  );

  const getOperationState = useCallback(
    (key: string): AsyncOperationState<any> => {
      return operations[key] || { data: null, loading: false, error: null };
    },
    [operations]
  );

  const resetOperation = useCallback((key: string) => {
    setOperations(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const resetAllOperations = useCallback(() => {
    setOperations({});
  }, []);

  return {
    executeOperation,
    getOperationState,
    resetOperation,
    resetAllOperations,
    isAnyLoading: Object.values(operations).some(op => op.loading),
    hasAnyError: Object.values(operations).some(op => op.error),
  };
};