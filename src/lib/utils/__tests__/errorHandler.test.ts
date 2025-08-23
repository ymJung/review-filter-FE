import {
  processError,
  handleApiError,
  retryWithBackoff,
  fetchWithErrorHandling,
  logError,
  getErrorMessage,
} from '../errorHandler';
import {
  AppError,
  AuthError,
  ValidationError,
  NotFoundError,
  PermissionError,
} from '@/types';

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('errorHandler utilities', () => {
  afterEach(() => {
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('processError', () => {
    it('should process AppError correctly', () => {
      const error = new AuthError('Authentication failed', 'AUTH_FAILED');
      const result = processError(error);

      expect(result.category).toBe('authentication');
      expect(result.message).toBe('Authentication failed');
      expect(result.code).toBe('AUTH_FAILED');
      expect(result.statusCode).toBe(401);
      expect(result.isRetryable).toBe(false);
    });

    it('should process ValidationError correctly', () => {
      const error = new ValidationError('Invalid input', 'VALIDATION_FAILED');
      const result = processError(error);

      expect(result.category).toBe('validation');
      expect(result.statusCode).toBe(400);
    });

    it('should process PermissionError correctly', () => {
      const error = new PermissionError('Access denied', 'ACCESS_DENIED');
      const result = processError(error);

      expect(result.category).toBe('authorization');
      expect(result.statusCode).toBe(403);
    });

    it('should process NotFoundError correctly', () => {
      const error = new NotFoundError('Resource not found', 'NOT_FOUND');
      const result = processError(error);

      expect(result.category).toBe('not_found');
      expect(result.statusCode).toBe(404);
    });

    it('should process network errors', () => {
      const error = new Error('fetch failed');
      error.name = 'NetworkError';
      const result = processError(error);

      expect(result.category).toBe('network');
      expect(result.isRetryable).toBe(true);
      expect(result.statusCode).toBe(0);
    });

    it('should process timeout errors', () => {
      const error = new Error('Request timeout');
      error.name = 'TimeoutError';
      const result = processError(error);

      expect(result.category).toBe('network');
      expect(result.isRetryable).toBe(true);
      expect(result.statusCode).toBe(408);
    });

    it('should process generic JavaScript errors', () => {
      const error = new Error('Something went wrong');
      const result = processError(error);

      expect(result.category).toBe('client');
      expect(result.message).toBe('Something went wrong');
      expect(result.statusCode).toBe(400);
      expect(result.isRetryable).toBe(false);
    });

    it('should process unknown errors', () => {
      const result = processError('string error');

      expect(result.category).toBe('unknown');
      expect(result.statusCode).toBe(500);
      expect(result.isRetryable).toBe(false);
      expect(result.userMessage).toBe('예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    });
  });

  describe('handleApiError', () => {
    it('should throw AuthError for 401 status', async () => {
      const mockResponse = {
        status: 401,
        json: jest.fn().mockResolvedValue({
          error: { code: 'UNAUTHORIZED', message: 'Unauthorized access' }
        })
      } as any;

      await expect(handleApiError(mockResponse)).rejects.toThrow(AuthError);
    });

    it('should throw PermissionError for 403 status', async () => {
      const mockResponse = {
        status: 403,
        json: jest.fn().mockResolvedValue({
          error: { code: 'FORBIDDEN', message: 'Access forbidden' }
        })
      } as any;

      await expect(handleApiError(mockResponse)).rejects.toThrow(PermissionError);
    });

    it('should throw NotFoundError for 404 status', async () => {
      const mockResponse = {
        status: 404,
        json: jest.fn().mockResolvedValue({
          error: { code: 'NOT_FOUND', message: 'Resource not found' }
        })
      } as any;

      await expect(handleApiError(mockResponse)).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for 400 status', async () => {
      const mockResponse = {
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: { code: 'BAD_REQUEST', message: 'Invalid request' }
        })
      } as any;

      await expect(handleApiError(mockResponse)).rejects.toThrow(ValidationError);
    });

    it('should throw AppError for 500 status', async () => {
      const mockResponse = {
        status: 500,
        json: jest.fn().mockResolvedValue({
          error: { code: 'INTERNAL_ERROR', message: 'Server error' }
        })
      } as any;

      await expect(handleApiError(mockResponse)).rejects.toThrow(AppError);
    });

    it('should handle non-JSON responses', async () => {
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockRejectedValue(new Error('Not JSON'))
      } as any;

      await expect(handleApiError(mockResponse)).rejects.toThrow(AppError);
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first try', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(operation, 3);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      // Mock the error as retryable
      const shouldRetry = jest.fn().mockReturnValue(true);
      
      const result = await retryWithBackoff(operation, 3, 10, shouldRetry);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new ValidationError('Invalid input'));
      
      await expect(retryWithBackoff(operation, 3)).rejects.toThrow(AppError);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should exhaust retries and throw last error', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));
      const shouldRetry = jest.fn().mockReturnValue(true);

      await expect(retryWithBackoff(operation, 2, 10, shouldRetry)).rejects.toThrow(AppError);
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('fetchWithErrorHandling', () => {
    const mockFetch = jest.fn();
    global.fetch = mockFetch;

    beforeEach(() => {
      mockFetch.mockClear();
    });

    it('should return response for successful requests', async () => {
      const mockResponse = { ok: true, json: jest.fn() };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await fetchWithErrorHandling('/api/test');

      expect(result).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        headers: { 'Content-Type': 'application/json' }
      });
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: { code: 'BAD_REQUEST', message: 'Invalid request' }
        })
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(fetchWithErrorHandling('/api/test')).rejects.toThrow(AppError);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(fetchWithErrorHandling('/api/test')).rejects.toThrow(AppError);
    });

    it('should merge custom headers', async () => {
      const mockResponse = { ok: true };
      mockFetch.mockResolvedValue(mockResponse);

      await fetchWithErrorHandling('/api/test', {
        headers: { 'Authorization': 'Bearer token' }
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token'
        }
      });
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const error = new Error('Test error');
      logError(error, 'test-context', { userId: '123' });

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error logged:',
        expect.objectContaining({
          context: 'test-context',
          error: expect.objectContaining({
            message: 'Test error',
            category: 'client'
          }),
          userId: '123'
        })
      );
    });

    it('should log without context', () => {
      const error = new Error('Test error');
      logError(error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error logged:',
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Test error'
          })
        })
      );
    });
  });

  describe('getErrorMessage', () => {
    it('should return context-specific messages for login', () => {
      const networkError = new Error('Network failed');
      networkError.name = 'NetworkError';

      const message = getErrorMessage(networkError, 'login');
      expect(message).toBe('로그인 중 네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
    });

    it('should return context-specific messages for upload', () => {
      const validationError = new ValidationError('Invalid file type');

      const message = getErrorMessage(validationError, 'upload');
      expect(message).toBe('업로드할 수 없는 파일 형식입니다.');
    });

    it('should return generic message without context', () => {
      const error = new Error('Generic error');

      const message = getErrorMessage(error);
      expect(message).toBe('오류가 발생했습니다. 페이지를 새로고침해주세요.');
    });

    it('should handle auth errors in login context', () => {
      const authError = new AuthError('Login failed');

      const message = getErrorMessage(authError, 'login');
      expect(message).toBe('로그인에 실패했습니다. 다시 시도해주세요.');
    });
  });
});