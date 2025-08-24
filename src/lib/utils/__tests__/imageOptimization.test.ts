import {
  optimizeImage,
  optimizeImages,
  createProgressiveImageLoader,
  getOptimalImageFormat,
  validateImageFile,
  generateResponsiveImageSizes,
  createImageLazyLoader,
} from '../imageOptimization';

// Mock HTML5 Canvas and Image
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn(() => ({
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    drawImage: jest.fn(),
  })),
  toBlob: jest.fn(),
  toDataURL: jest.fn(() => 'data:image/webp;base64,test'),
};

const mockImage = {
  width: 1920,
  height: 1080,
  onload: null as any,
  onerror: null as any,
  src: '',
};

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: jest.fn((tagName) => {
    if (tagName === 'canvas') return mockCanvas;
    return {};
  }),
});

Object.defineProperty(window, 'Image', {
  value: jest.fn(() => mockImage),
});

Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'blob:test-url'),
    revokeObjectURL: jest.fn(),
  },
});

describe('imageOptimization utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('optimizeImage', () => {
    it('should optimize image with default options', async () => {
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock successful canvas operations
      mockCanvas.toBlob.mockImplementation((callback) => {
        const blob = new Blob(['optimized'], { type: 'image/webp' });
        callback(blob);
      });

      // Trigger image load
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const result = await optimizeImage(testFile);

      expect(result.file).toBeInstanceOf(File);
      expect(result.originalSize).toBe(testFile.size);
      expect(result.optimizedSize).toBeGreaterThan(0);
      expect(result.compressionRatio).toBeGreaterThanOrEqual(0);
      expect(result.dimensions).toEqual({ width: 1200, height: 675 }); // Scaled down from 1920x1080
    });

    it('should handle custom optimization options', async () => {
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      mockCanvas.toBlob.mockImplementation((callback) => {
        const blob = new Blob(['optimized'], { type: 'image/jpeg' });
        callback(blob);
      });

      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const options = {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.7,
        format: 'jpeg' as const,
      };

      const result = await optimizeImage(testFile, options);

      expect(result.dimensions.width).toBeLessThanOrEqual(800);
      expect(result.dimensions.height).toBeLessThanOrEqual(600);
    });

    it('should handle image load errors', async () => {
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      setTimeout(() => {
        if (mockImage.onerror) mockImage.onerror();
      }, 0);

      await expect(optimizeImage(testFile)).rejects.toThrow('Failed to load image');
    });

    it('should handle canvas blob creation failure', async () => {
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(null);
      });

      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      await expect(optimizeImage(testFile)).rejects.toThrow('Failed to optimize image');
    });

    it('should handle missing canvas context', async () => {
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      mockCanvas.getContext.mockReturnValue(null as any);

      await expect(optimizeImage(testFile)).rejects.toThrow('Canvas context not available');
    });
  });

  describe('optimizeImages', () => {
    it('should optimize multiple images', async () => {
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];

      mockCanvas.toBlob.mockImplementation((callback) => {
        const blob = new Blob(['optimized'], { type: 'image/webp' });
        callback(blob);
      });

      // Mock image loads for all files
      let loadCount = 0;
      const originalImage = window.Image;
      (window as any).Image = jest.fn(() => {
        const img = { ...mockImage };
        setTimeout(() => {
          if (img.onload) {
            loadCount++;
            img.onload();
          }
        }, 0);
        return img;
      });

      const results = await optimizeImages(files);

      expect(results).toHaveLength(2);
      expect(results[0].file).toBeInstanceOf(File);
      expect(results[1].file).toBeInstanceOf(File);

      // Restore
      (window as any).Image = originalImage;
    });
  });

  describe('createProgressiveImageLoader', () => {
    it('should preload and cache images', async () => {
      const loader = createProgressiveImageLoader();
      
      // Mock successful image load
      const originalImage = window.Image;
      (window as any).Image = jest.fn(() => {
        const img = { ...mockImage };
        setTimeout(() => {
          if (img.onload) img.onload();
        }, 0);
        return img;
      });

      const result = await loader.preloadImage('test.jpg');
      
      expect(result).toBeDefined();
      expect(loader.isImageLoaded('test.jpg')).toBe(true);

      // Restore
      (window as any).Image = originalImage;
    });

    it('should handle image load errors', async () => {
      const loader = createProgressiveImageLoader();
      
      const originalImage = window.Image;
      (window as any).Image = jest.fn(() => {
        const img = { ...mockImage };
        setTimeout(() => {
          if (img.onerror) img.onerror();
        }, 0);
        return img;
      });

      await expect(loader.preloadImage('invalid.jpg')).rejects.toBeDefined();

      // Restore
      (window as any).Image = originalImage;
    });

    it('should return cached images', async () => {
      const loader = createProgressiveImageLoader();
      
      const originalImage = window.Image;
      const mockImageConstructor = jest.fn(() => {
        const img = { ...mockImage };
        setTimeout(() => {
          if (img.onload) img.onload();
        }, 0);
        return img;
      });
      (window as any).Image = mockImageConstructor;

      // First load
      await loader.preloadImage('test.jpg');
      
      // Second load should use cache
      await loader.preloadImage('test.jpg');
      
      expect(mockImageConstructor).toHaveBeenCalledTimes(1);

      // Restore
      (window as any).Image = originalImage;
    });

    it('should preload multiple images', async () => {
      const loader = createProgressiveImageLoader();
      
      const originalImage = window.Image;
      (window as any).Image = jest.fn(() => {
        const img = { ...mockImage };
        setTimeout(() => {
          if (img.onload) img.onload();
        }, 0);
        return img;
      });

      const results = await loader.preloadImages(['test1.jpg', 'test2.jpg']);
      
      expect(results).toHaveLength(2);

      // Restore
      (window as any).Image = originalImage;
    });

    it('should clear cache', async () => {
      const loader = createProgressiveImageLoader();
      
      const originalImage = window.Image;
      (window as any).Image = jest.fn(() => {
        const img = { ...mockImage };
        setTimeout(() => {
          if (img.onload) img.onload();
        }, 0);
        return img;
      });

      await loader.preloadImage('test.jpg');
      expect(loader.isImageLoaded('test.jpg')).toBe(true);
      
      loader.clearCache();
      expect(loader.isImageLoaded('test.jpg')).toBe(false);

      // Restore
      (window as any).Image = originalImage;
    });
  });

  describe('getOptimalImageFormat', () => {
    it('should return webp when supported', () => {
      mockCanvas.toDataURL.mockReturnValue('data:image/webp;base64,test');
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const format = getOptimalImageFormat(file);
      
      expect(format).toBe('webp');
    });

    it('should return png for png files when webp not supported', () => {
      mockCanvas.toDataURL.mockReturnValue('data:image/png;base64,test');
      
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const format = getOptimalImageFormat(file);
      
      expect(format).toBe('png');
    });

    it('should return jpeg as fallback', () => {
      mockCanvas.toDataURL.mockReturnValue('data:image/png;base64,test');
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const format = getOptimalImageFormat(file);
      
      expect(format).toBe('jpeg');
    });
  });

  describe('validateImageFile', () => {
    it('should validate correct image files', () => {
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB
      
      const result = validateImageFile(validFile);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid file types', () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      const result = validateImageFile(invalidFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('지원하지 않는 이미지 형식입니다');
    });

    it('should reject files that are too large', () => {
      const largeFile = new File(['test'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 }); // 11MB
      
      const result = validateImageFile(largeFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('이미지 크기가 너무 큽니다');
    });

    it('should reject files that are too small', () => {
      const smallFile = new File(['test'], 'small.jpg', { type: 'image/jpeg' });
      Object.defineProperty(smallFile, 'size', { value: 500 }); // 500 bytes
      
      const result = validateImageFile(smallFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('이미지 크기가 너무 작습니다');
    });
  });

  describe('generateResponsiveImageSizes', () => {
    it('should generate responsive sizes for large images', () => {
      const sizes = generateResponsiveImageSizes(1920, 1080);
      
      expect(sizes).toHaveLength(4);
      expect(sizes[0]).toEqual({ width: 320, height: 180, suffix: 'sm' });
      expect(sizes[1]).toEqual({ width: 640, height: 360, suffix: 'md' });
      expect(sizes[2]).toEqual({ width: 1024, height: 576, suffix: 'lg' });
      expect(sizes[3]).toEqual({ width: 1920, height: 1080, suffix: 'xl' });
    });

    it('should filter out sizes larger than original', () => {
      const sizes = generateResponsiveImageSizes(800, 600);
      
      expect(sizes).toHaveLength(2); // Only sm and md should be included
      expect(sizes[0].width).toBe(320);
      expect(sizes[1].width).toBe(640);
    });

    it('should maintain aspect ratio', () => {
      const sizes = generateResponsiveImageSizes(1600, 900); // 16:9 aspect ratio
      
      sizes.forEach(size => {
        const aspectRatio = size.width / size.height;
        expect(aspectRatio).toBeCloseTo(16/9, 2);
      });
    });
  });

  describe('createImageLazyLoader', () => {
    let mockObserver: any;
    let mockObserve: jest.Mock;
    let mockUnobserve: jest.Mock;
    let mockDisconnect: jest.Mock;

    beforeEach(() => {
      mockObserve = jest.fn();
      mockUnobserve = jest.fn();
      mockDisconnect = jest.fn();

      mockObserver = {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
      };

      (global as any).IntersectionObserver = jest.fn(() => mockObserver);
    });

    it('should create lazy loader with default options', () => {
      const loader = createImageLazyLoader();
      
      expect(IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        {
          root: null,
          rootMargin: '50px',
          threshold: 0.1,
        }
      );
    });

    it('should create lazy loader with custom options', () => {
      const customOptions = {
        rootMargin: '100px',
        threshold: 0.5,
      };
      
      const loader = createImageLazyLoader(customOptions);
      
      expect(IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        {
          root: null,
          rootMargin: '100px',
          threshold: 0.5,
        }
      );
    });

    it('should observe images', () => {
      const loader = createImageLazyLoader();
      const mockImg = document.createElement('img') as HTMLImageElement;
      
      loader.observe(mockImg);
      
      expect(mockImg.classList.contains('lazy')).toBe(true);
      expect(mockObserve).toHaveBeenCalledWith(mockImg);
    });

    it('should unobserve images', () => {
      const loader = createImageLazyLoader();
      const mockImg = document.createElement('img') as HTMLImageElement;
      
      loader.unobserve(mockImg);
      
      expect(mockUnobserve).toHaveBeenCalledWith(mockImg);
    });

    it('should disconnect observer', () => {
      const loader = createImageLazyLoader();
      
      loader.disconnect();
      
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should handle intersection events', () => {
      let intersectionCallback: any;
      
      (global as any).IntersectionObserver = jest.fn((callback) => {
        intersectionCallback = callback;
        return mockObserver;
      });

      const loader = createImageLazyLoader();
      
      // Mock image element
      const mockImg = {
        dataset: { src: 'test.jpg' },
        classList: {
          remove: jest.fn(),
          add: jest.fn(),
        },
        src: '',
      } as any;

      // Mock intersection entry
      const mockEntry = {
        isIntersecting: true,
        target: mockImg,
      };

      // Trigger intersection
      intersectionCallback([mockEntry]);

      expect(mockImg.src).toBe('test.jpg');
      expect(mockImg.classList.remove).toHaveBeenCalledWith('lazy');
      expect(mockImg.classList.add).toHaveBeenCalledWith('loaded');
      expect(mockUnobserve).toHaveBeenCalledWith(mockImg);
    });
  });
});