import {
  cn,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  truncateText,
  sanitizeText,
  generateSlug,
  formatNumber,
  formatRating,
  calculatePercentage,
  isValidEmail,
  isValidUrl,
  isValidImageFile,
  removeDuplicates,
  groupBy,
  sortBy,
  generateRandomId,
  generateRandomNickname,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  debounce,
  throttle,
  handleError,
  isFirebaseError,
  compressImage,
} from '../index';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: jest.fn(() => 'blob:mock-url'),
});

describe('utility functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cn', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'hidden');
      expect(result).toBe('base conditional');
    });

    it('should handle Tailwind conflicts', () => {
      const result = cn('p-4', 'p-2'); // p-2 should override p-4
      expect(result).toBe('p-2');
    });
  });

  describe('date formatting', () => {
    const testDate = new Date('2023-12-25T10:30:00Z');

    describe('formatDate', () => {
      it('should format date in Korean locale', () => {
        const result = formatDate(testDate, 'ko-KR');
        expect(result).toContain('2023');
        expect(result).toContain('12');
        expect(result).toContain('25');
      });

      it('should format date in English locale', () => {
        const result = formatDate(testDate, 'en-US');
        expect(result).toContain('2023');
        expect(result).toContain('December');
        expect(result).toContain('25');
      });
    });

    describe('formatDateTime', () => {
      it('should format date and time', () => {
        const result = formatDateTime(testDate, 'ko-KR');
        expect(result).toContain('2023');
        expect(result).toContain('12');
        expect(result).toContain('25');
      });
    });

    describe('formatRelativeTime', () => {
      it('should return "방금 전" for recent times', () => {
        const now = new Date();
        const recent = new Date(now.getTime() - 30 * 1000); // 30 seconds ago
        expect(formatRelativeTime(recent)).toBe('방금 전');
      });

      it('should return minutes for times within an hour', () => {
        const now = new Date();
        const minutesAgo = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
        expect(formatRelativeTime(minutesAgo)).toBe('30분 전');
      });

      it('should return hours for times within a day', () => {
        const now = new Date();
        const hoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago
        expect(formatRelativeTime(hoursAgo)).toBe('5시간 전');
      });

      it('should return days for times within a week', () => {
        const now = new Date();
        const daysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
        expect(formatRelativeTime(daysAgo)).toBe('3일 전');
      });

      it('should return formatted date for older times', () => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
        const result = formatRelativeTime(weekAgo);
        expect(result).not.toContain('일 전');
      });
    });
  });

  describe('text utilities', () => {
    describe('truncateText', () => {
      it('should truncate long text', () => {
        const longText = 'This is a very long text that should be truncated';
        const result = truncateText(longText, 20);
        expect(result).toBe('This is a very long ...');
      });

      it('should not truncate short text', () => {
        const shortText = 'Short text';
        const result = truncateText(shortText, 20);
        expect(result).toBe('Short text');
      });

      it('should handle exact length', () => {
        const text = 'Exactly twenty chars';
        const result = truncateText(text, 20);
        expect(result).toBe('Exactly twenty chars');
      });
    });

    describe('sanitizeText', () => {
      it('should remove HTML tags', () => {
        const result = sanitizeText('<script>alert("xss")</script>Hello');
        expect(result).toBe('scriptalert("xss")/scriptHello');
      });

      it('should trim whitespace', () => {
        const result = sanitizeText('  Hello World  ');
        expect(result).toBe('Hello World');
      });
    });

    describe('generateSlug', () => {
      it('should generate slug from text', () => {
        const result = generateSlug('Hello World Test');
        expect(result).toBe('hello-world-test');
      });

      it('should handle Korean text', () => {
        const result = generateSlug('안녕하세요 세계');
        expect(result).toBe('안녕하세요-세계');
      });

      it('should remove special characters', () => {
        const result = generateSlug('Hello@#$%World!!!');
        expect(result).toBe('hello-world');
      });

      it('should handle multiple dashes', () => {
        const result = generateSlug('Hello   World   Test');
        expect(result).toBe('hello-world-test');
      });
    });
  });

  describe('number utilities', () => {
    describe('formatNumber', () => {
      it('should format numbers with Korean locale', () => {
        const result = formatNumber(1234567, 'ko-KR');
        expect(result).toBe('1,234,567');
      });

      it('should format numbers with US locale', () => {
        const result = formatNumber(1234567, 'en-US');
        expect(result).toBe('1,234,567');
      });
    });

    describe('formatRating', () => {
      it('should format rating to one decimal place', () => {
        expect(formatRating(4.567)).toBe('4.6');
        expect(formatRating(3)).toBe('3.0');
        expect(formatRating(4.1)).toBe('4.1');
      });
    });

    describe('calculatePercentage', () => {
      it('should calculate percentage correctly', () => {
        expect(calculatePercentage(25, 100)).toBe(25);
        expect(calculatePercentage(1, 3)).toBe(33);
        expect(calculatePercentage(2, 3)).toBe(67);
      });

      it('should handle zero total', () => {
        expect(calculatePercentage(10, 0)).toBe(0);
      });

      it('should handle zero value', () => {
        expect(calculatePercentage(0, 100)).toBe(0);
      });
    });
  });

  describe('validation utilities', () => {
    describe('isValidEmail', () => {
      it('should validate correct emails', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('user.name@domain.co.kr')).toBe(true);
        expect(isValidEmail('test+tag@example.org')).toBe(true);
      });

      it('should reject invalid emails', () => {
        expect(isValidEmail('invalid-email')).toBe(false);
        expect(isValidEmail('test@')).toBe(false);
        expect(isValidEmail('@example.com')).toBe(false);
        expect(isValidEmail('test..test@example.com')).toBe(false);
      });
    });

    describe('isValidUrl', () => {
      it('should validate correct URLs', () => {
        expect(isValidUrl('https://example.com')).toBe(true);
        expect(isValidUrl('http://localhost:3000')).toBe(true);
        expect(isValidUrl('ftp://files.example.com')).toBe(true);
      });

      it('should reject invalid URLs', () => {
        expect(isValidUrl('not-a-url')).toBe(false);
        expect(isValidUrl('http://')).toBe(false);
        expect(isValidUrl('')).toBe(false);
      });
    });

    describe('isValidImageFile', () => {
      it('should validate correct image files', () => {
        const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB
        expect(isValidImageFile(validFile)).toBe(true);
      });

      it('should reject invalid file types', () => {
        const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
        expect(isValidImageFile(invalidFile)).toBe(false);
      });

      it('should reject files that are too large', () => {
        const largeFile = new File(['test'], 'large.jpg', { type: 'image/jpeg' });
        Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 }); // 6MB
        expect(isValidImageFile(largeFile)).toBe(false);
      });
    });
  });

  describe('array utilities', () => {
    describe('removeDuplicates', () => {
      it('should remove duplicates from primitive array', () => {
        const result = removeDuplicates([1, 2, 2, 3, 3, 4]);
        expect(result).toEqual([1, 2, 3, 4]);
      });

      it('should remove duplicates by key', () => {
        const items = [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
          { id: 1, name: 'C' },
        ];
        const result = removeDuplicates(items, 'id');
        expect(result).toEqual([
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ]);
      });
    });

    describe('groupBy', () => {
      it('should group items by key', () => {
        const items = [
          { category: 'A', value: 1 },
          { category: 'B', value: 2 },
          { category: 'A', value: 3 },
        ];
        const result = groupBy(items, 'category');
        expect(result).toEqual({
          A: [
            { category: 'A', value: 1 },
            { category: 'A', value: 3 },
          ],
          B: [{ category: 'B', value: 2 }],
        });
      });
    });

    describe('sortBy', () => {
      it('should sort items by key ascending', () => {
        const items = [
          { name: 'C', value: 3 },
          { name: 'A', value: 1 },
          { name: 'B', value: 2 },
        ];
        const result = sortBy(items, 'name', 'asc');
        expect(result[0].name).toBe('A');
        expect(result[1].name).toBe('B');
        expect(result[2].name).toBe('C');
      });

      it('should sort items by key descending', () => {
        const items = [
          { name: 'A', value: 1 },
          { name: 'C', value: 3 },
          { name: 'B', value: 2 },
        ];
        const result = sortBy(items, 'value', 'desc');
        expect(result[0].value).toBe(3);
        expect(result[1].value).toBe(2);
        expect(result[2].value).toBe(1);
      });
    });
  });

  describe('random utilities', () => {
    describe('generateRandomId', () => {
      it('should generate unique IDs', () => {
        const id1 = generateRandomId();
        const id2 = generateRandomId();
        expect(id1).not.toBe(id2);
        expect(typeof id1).toBe('string');
        expect(id1.length).toBeGreaterThan(0);
      });
    });

    describe('generateRandomNickname', () => {
      it('should generate random nicknames', () => {
        const nickname1 = generateRandomNickname();
        const nickname2 = generateRandomNickname();
        expect(nickname1).not.toBe(nickname2);
        expect(typeof nickname1).toBe('string');
        expect(nickname1.length).toBeGreaterThan(0);
      });

      it('should contain Korean characters and numbers', () => {
        const nickname = generateRandomNickname();
        expect(nickname).toMatch(/[\u3131-\u3163\uac00-\ud7a3]/); // Korean characters
        expect(nickname).toMatch(/\d/); // Numbers
      });
    });
  });

  describe('storage utilities', () => {
    describe('getStorageItem', () => {
      it('should get item from localStorage', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ test: 'value' }));
        const result = getStorageItem('test-key', { default: 'value' });
        expect(result).toEqual({ test: 'value' });
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
      });

      it('should return default value when item not found', () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        const result = getStorageItem('missing-key', { default: 'value' });
        expect(result).toEqual({ default: 'value' });
      });

      it('should return default value on parse error', () => {
        mockLocalStorage.getItem.mockReturnValue('invalid json');
        const result = getStorageItem('invalid-key', { default: 'value' });
        expect(result).toEqual({ default: 'value' });
      });
    });

    describe('setStorageItem', () => {
      it('should set item in localStorage', () => {
        setStorageItem('test-key', { test: 'value' });
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'test-key',
          JSON.stringify({ test: 'value' })
        );
      });

      it('should handle storage errors gracefully', () => {
        mockLocalStorage.setItem.mockImplementation(() => {
          throw new Error('Storage full');
        });
        
        // Should not throw
        expect(() => setStorageItem('test-key', 'value')).not.toThrow();
      });
    });

    describe('removeStorageItem', () => {
      it('should remove item from localStorage', () => {
        removeStorageItem('test-key');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
      });

      it('should handle removal errors gracefully', () => {
        mockLocalStorage.removeItem.mockImplementation(() => {
          throw new Error('Storage error');
        });
        
        // Should not throw
        expect(() => removeStorageItem('test-key')).not.toThrow();
      });
    });
  });

  describe('function utilities', () => {
    describe('debounce', () => {
      jest.useFakeTimers();

      it('should debounce function calls', () => {
        const mockFn = jest.fn();
        const debouncedFn = debounce(mockFn, 100);

        debouncedFn('arg1');
        debouncedFn('arg2');
        debouncedFn('arg3');

        expect(mockFn).not.toHaveBeenCalled();

        jest.advanceTimersByTime(100);

        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('arg3');
      });

      afterEach(() => {
        jest.clearAllTimers();
      });
    });

    describe('throttle', () => {
      jest.useFakeTimers();

      it('should throttle function calls', () => {
        const mockFn = jest.fn();
        const throttledFn = throttle(mockFn, 100);

        throttledFn('arg1');
        throttledFn('arg2');
        throttledFn('arg3');

        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('arg1');

        jest.advanceTimersByTime(100);

        throttledFn('arg4');
        expect(mockFn).toHaveBeenCalledTimes(2);
        expect(mockFn).toHaveBeenCalledWith('arg4');
      });

      afterEach(() => {
        jest.clearAllTimers();
      });
    });
  });

  describe('error handling utilities', () => {
    describe('handleError', () => {
      it('should handle Error objects', () => {
        const error = new Error('Test error');
        const result = handleError(error);
        expect(result).toBe('Test error');
      });

      it('should handle string errors', () => {
        const result = handleError('String error');
        expect(result).toBe('String error');
      });

      it('should handle unknown errors', () => {
        const result = handleError({ unknown: 'error' });
        expect(result).toBe('알 수 없는 오류가 발생했습니다.');
      });
    });

    describe('isFirebaseError', () => {
      it('should identify Firebase errors', () => {
        const firebaseError = { code: 'auth/user-not-found' };
        expect(isFirebaseError(firebaseError)).toBe(true);
      });

      it('should reject non-Firebase errors', () => {
        const regularError = new Error('Regular error');
        expect(isFirebaseError(regularError)).toBe(false);
      });
    });
  });

  describe('image utilities', () => {
    describe('compressImage', () => {
      // Mock canvas and image for testing
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => ({
          drawImage: jest.fn(),
        })),
        toBlob: jest.fn(),
      };

      const mockImage = {
        width: 1920,
        height: 1080,
        onload: null as any,
        src: '',
      };

      beforeEach(() => {
        document.createElement = jest.fn((tagName) => {
          if (tagName === 'canvas') return mockCanvas as any;
          return {};
        });

        (window as any).Image = jest.fn(() => mockImage);
      });

      it('should compress image', async () => {
        const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        
        mockCanvas.toBlob.mockImplementation((callback) => {
          const blob = new Blob(['compressed'], { type: 'image/jpeg' });
          callback(blob);
        });

        // Mock image properties
        mockImage.width = 1000;
        mockImage.height = 800;

        // Start the compression and trigger image load immediately
        const compressionPromise = compressImage(testFile, 800, 0.8);
        
        // Trigger image load synchronously
        if (mockImage.onload) {
          mockImage.onload();
        }

        const result = await compressionPromise;

        expect(result).toBeInstanceOf(File);
        expect(result.type).toBe('image/jpeg');
      }, 10000);
    });
  });
});