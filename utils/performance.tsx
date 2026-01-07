
import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

// Optimized Image Component
interface OptimizedImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  width?: number;
  height?: number;
  aspectRatio?: 'square' | 'video' | 'auto';
  onLoad?: () => void;
  className?: string;
}

export const OptimizedImage = React.memo(({ 
  src, alt, priority = false, width, height, aspectRatio = 'auto', onLoad, className = ''
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(priority);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const imageSrcSet = useMemo(() => {
    if (!src) return '';
    const sizes = [400, 800, 1200];
    // Check if source is a URL or base64 to avoid errors
    if (src.startsWith('data:')) return undefined;
    return sizes.map(size => `${src}${src.includes('?') ? '&' : '?'}w=${size}&q=80 ${size}w`).join(', ');
  }, [src]);

  if (hasError) {
    return <div className={`w-full h-full bg-slate-800 flex items-center justify-center ${className}`}>
      <span className="text-slate-400 text-sm">Failed to load</span>
    </div>;
  }

  return (
    <motion.div
      className={`relative overflow-hidden ${aspectRatio === 'square' ? 'aspect-square' : ''} ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ willChange: 'opacity' }}
    >
      <picture>
        {imageSrcSet && <source srcSet={imageSrcSet} type="image/jpeg" />}
        <img 
          src={src} 
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "auto" : "async"}
          onLoad={handleLoad}
          onError={() => setHasError(true)}
          width={width}
          height={height}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </picture>
    </motion.div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// Animation Variants Hook
export const useAnimationVariants = () => {
  return useMemo(() => ({
    slideUp: {
      hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
      visible: { 
        opacity: 1, y: 0, filter: "blur(0px)",
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }
      }
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { 
        opacity: 1, scale: 1,
        transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as const }
      }
    },
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.1 }
      }
    },
    listItem: {
      hidden: { opacity: 0, x: -10 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.25 } }
    },
    success: {
      scale: [1, 1.15, 0.95, 1],
      rotate: [0, 5, -5, 0],
      transition: { duration: 0.6, ease: "easeOut" }
    }
  }), []);
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Request cache
export const createRequestCache = <T,>(
  fetchFn: (key: string) => Promise<T>,
  cacheTimeMs: number = 5 * 60 * 1000
) => {
  const cache = new Map<string, { value: T; timestamp: number }>();
  return async (key: string): Promise<T> => {
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && now - cached.timestamp < cacheTimeMs) return cached.value;
    const value = await fetchFn(key);
    cache.set(key, { value, timestamp: now });
    return value;
  };
};

export default OptimizedImage;
