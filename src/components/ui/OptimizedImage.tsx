'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { createImageLazyLoader } from '@/lib/utils/imageOptimization';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  aspectRatio?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  showLoadingSpinner?: boolean;
  enableLazyLoading?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc,
  aspectRatio,
  objectFit = 'cover',
  showLoadingSpinner = true,
  enableLazyLoading = true,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLDivElement>(null);
  const lazyLoaderRef = useRef<ReturnType<typeof createImageLazyLoader> | null>(null);

  // Initialize lazy loader
  useEffect(() => {
    if (enableLazyLoading && !priority) {
      lazyLoaderRef.current = createImageLazyLoader({
        rootMargin: '50px',
        threshold: 0.1,
      });
    }

    return () => {
      if (lazyLoaderRef.current) {
        lazyLoaderRef.current.disconnect();
      }
    };
  }, [enableLazyLoading, priority]);

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setIsLoading(false);
    
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      setHasError(true);
    }
    
    onError?.();
  };

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || (
    fill 
      ? '100vw'
      : width 
        ? `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, ${width}px`
        : '100vw'
  );

  // Calculate dimensions based on aspect ratio
  const calculatedDimensions = React.useMemo(() => {
    if (fill) return { width: undefined, height: undefined };
    
    if (aspectRatio && width && !height) {
      return { width, height: Math.round(width / aspectRatio) };
    }
    
    if (aspectRatio && height && !width) {
      return { width: Math.round(height * aspectRatio), height };
    }
    
    return { width, height };
  }, [width, height, aspectRatio, fill]);

  // Generate blur placeholder
  const generateBlurDataURL = (w: number = 10, h: number = 10): string => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, w, h);
    }
    
    return canvas.toDataURL();
  };

  const defaultBlurDataURL = blurDataURL || generateBlurDataURL();

  // Error fallback component
  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          fill ? 'absolute inset-0' : '',
          className
        )}
        style={{
          width: fill ? undefined : calculatedDimensions.width,
          height: fill ? undefined : calculatedDimensions.height,
        }}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-8 w-8 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs">이미지를 불러올 수 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden',
        fill ? 'absolute inset-0' : '',
        className
      )}
      style={{
        width: fill ? undefined : calculatedDimensions.width,
        height: fill ? undefined : calculatedDimensions.height,
      }}
    >
      {/* Loading spinner */}
      {isLoading && showLoadingSpinner && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-gray-100',
            'animate-pulse'
          )}
        >
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600" />
        </div>
      )}

      {/* Optimized Next.js Image */}
      <Image
        src={currentSrc}
        alt={alt}
        width={calculatedDimensions.width}
        height={calculatedDimensions.height}
        fill={fill}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={placeholder === 'blur' ? defaultBlurDataURL : undefined}
        sizes={responsiveSizes}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          objectFit && !fill ? `object-${objectFit}` : ''
        )}
        style={{
          objectFit: fill ? objectFit : undefined,
        }}
        {...props}
      />
    </div>
  );
};

// Specialized components for common use cases
export const AvatarImage: React.FC<Omit<OptimizedImageProps, 'aspectRatio' | 'objectFit'>> = (props) => (
  <OptimizedImage
    {...props}
    aspectRatio={1}
    objectFit="cover"
    className={cn('rounded-full', props.className)}
  />
);

export const CardImage: React.FC<Omit<OptimizedImageProps, 'aspectRatio' | 'objectFit'>> = (props) => (
  <OptimizedImage
    {...props}
    aspectRatio={16 / 9}
    objectFit="cover"
    className={cn('rounded-lg', props.className)}
  />
);

export const HeroImage: React.FC<Omit<OptimizedImageProps, 'priority' | 'loading'>> = (props) => (
  <OptimizedImage
    {...props}
    priority={true}
    loading="eager"
    quality={90}
  />
);

// Progressive image loader component
export const ProgressiveImage: React.FC<OptimizedImageProps & {
  lowQualitySrc?: string;
}> = ({ lowQualitySrc, ...props }) => {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc || props.src);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  useEffect(() => {
    if (lowQualitySrc && lowQualitySrc !== props.src) {
      // Preload high quality image
      const img = new window.Image();
      img.onload = () => {
        setCurrentSrc(props.src);
        setIsHighQualityLoaded(true);
      };
      img.src = props.src;
    }
  }, [props.src, lowQualitySrc]);

  return (
    <OptimizedImage
      {...props}
      src={currentSrc}
      className={cn(
        'transition-all duration-500',
        !isHighQualityLoaded && lowQualitySrc ? 'filter blur-sm scale-105' : '',
        props.className
      )}
    />
  );
};

// Image gallery component with lazy loading
export interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  className?: string;
  itemClassName?: string;
  columns?: number;
  gap?: number;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  className,
  itemClassName,
  columns = 3,
  gap = 4,
}) => {
  return (
    <div
      className={cn(
        'grid',
        `grid-cols-1 md:grid-cols-${Math.min(columns, 3)} lg:grid-cols-${columns}`,
        `gap-${gap}`,
        className
      )}
    >
      {images.map((image, index) => (
        <div key={index} className={cn('relative', itemClassName)}>
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            className="w-full h-auto"
            priority={index < 3} // Prioritize first 3 images
            enableLazyLoading={index >= 3}
          />
        </div>
      ))}
    </div>
  );
};