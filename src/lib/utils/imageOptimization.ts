// Enhanced image optimization utilities
export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  progressive?: boolean;
}

export interface OptimizedImage {
  file: File;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  dimensions: {
    width: number;
    height: number;
  };
}

// Advanced image compression with multiple formats support
export const optimizeImage = async (
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImage> => {
  const {
    maxWidth = 1200,
    maxHeight = 800,
    quality = 0.85,
    format = 'webp',
    progressive = true
  } = options;

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate optimal dimensions
      const { width: newWidth, height: newHeight } = calculateOptimalDimensions(
        img.width,
        img.height,
        maxWidth,
        maxHeight
      );

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw and compress image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convert to optimized format
      const mimeType = getMimeType(format);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to optimize image'));
            return;
          }

          const optimizedFile = new File([blob], getOptimizedFileName(file.name, format), {
            type: mimeType,
            lastModified: Date.now(),
          });

          const result: OptimizedImage = {
            file: optimizedFile,
            originalSize: file.size,
            optimizedSize: optimizedFile.size,
            compressionRatio: Math.round((1 - optimizedFile.size / file.size) * 100),
            dimensions: {
              width: newWidth,
              height: newHeight,
            },
          };

          resolve(result);
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

// Calculate optimal dimensions while maintaining aspect ratio
const calculateOptimalDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  // Scale down if too large
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
};

// Get MIME type for format
const getMimeType = (format: string): string => {
  const mimeTypes: Record<string, string> = {
    webp: 'image/webp',
    jpeg: 'image/jpeg',
    png: 'image/png',
  };
  return mimeTypes[format] || 'image/jpeg';
};

// Generate optimized file name
const getOptimizedFileName = (originalName: string, format: string): string => {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  return `${nameWithoutExt}_optimized.${format}`;
};

// Batch image optimization
export const optimizeImages = async (
  files: File[],
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImage[]> => {
  const promises = files.map(file => optimizeImage(file, options));
  return Promise.all(promises);
};

// Progressive image loading utility
export const createProgressiveImageLoader = () => {
  const loadedImages = new Set<string>();
  const imageCache = new Map<string, HTMLImageElement>();

  return {
    preloadImage: (src: string): Promise<HTMLImageElement> => {
      if (imageCache.has(src)) {
        return Promise.resolve(imageCache.get(src)!);
      }

      return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => {
          imageCache.set(src, img);
          loadedImages.add(src);
          resolve(img);
        };
        img.onerror = reject;
        img.src = src;
      });
    },

    preloadImages: function(srcs: string[]): Promise<HTMLImageElement[]> {
      return Promise.all(srcs.map(src => this.preloadImage(src)));
    },

    isImageLoaded: (src: string): boolean => {
      return loadedImages.has(src);
    },

    clearCache: (): void => {
      imageCache.clear();
      loadedImages.clear();
    },
  };
};

// Image format detection and recommendation
export const getOptimalImageFormat = (file: File): 'webp' | 'jpeg' | 'png' => {
  // Check browser support for WebP
  const supportsWebP = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  })();

  if (supportsWebP) {
    return 'webp';
  }

  // Fallback based on original format
  if (file.type.includes('png')) {
    return 'png';
  }

  return 'jpeg';
};

// Image validation with enhanced checks
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const minSize = 1024; // 1KB

  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: '지원하지 않는 이미지 형식입니다. JPEG, PNG, GIF, WebP, HEIC 형식만 지원됩니다.',
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: '이미지 크기가 너무 큽니다. 10MB 이하의 이미지를 업로드해주세요.',
    };
  }

  if (file.size < minSize) {
    return {
      isValid: false,
      error: '이미지 크기가 너무 작습니다.',
    };
  }

  return { isValid: true };
};

// Generate responsive image sizes
export const generateResponsiveImageSizes = (
  originalWidth: number,
  originalHeight: number
): Array<{ width: number; height: number; suffix: string }> => {
  const aspectRatio = originalWidth / originalHeight;
  
  const sizes = [
    { width: 320, suffix: 'sm' },
    { width: 640, suffix: 'md' },
    { width: 1024, suffix: 'lg' },
    { width: 1920, suffix: 'xl' },
  ];

  return sizes
    .filter(size => size.width <= originalWidth)
    .map(size => ({
      width: size.width,
      height: Math.round(size.width / aspectRatio),
      suffix: size.suffix,
    }));
};

// Image lazy loading intersection observer
export const createImageLazyLoader = (options: IntersectionObserverInit = {}) => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        
        if (src) {
          img.src = src;
          img.classList.remove('lazy');
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      }
    });
  }, defaultOptions);

  return {
    observe: (img: HTMLImageElement) => {
      img.classList.add('lazy');
      imageObserver.observe(img);
    },
    
    unobserve: (img: HTMLImageElement) => {
      imageObserver.unobserve(img);
    },
    
    disconnect: () => {
      imageObserver.disconnect();
    },
  };
};