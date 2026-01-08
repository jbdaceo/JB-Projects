
import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

// --- HAPTIC FEEDBACK ENGINE ---
export const triggerHaptic = (pattern: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    switch (pattern) {
      case 'light': navigator.vibrate(5); break; // Subtle click
      case 'medium': navigator.vibrate(10); break; // Standard tap
      case 'heavy': navigator.vibrate(20); break; // Strong interaction
      case 'success': navigator.vibrate([10, 30, 10]); break; // Da-da-da
      case 'error': navigator.vibrate([30, 50, 30]); break; // Buzz-buzz
    }
  }
};

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
    // Check if source is a URL or base64 to avoid errors
    if (src.startsWith('data:')) return undefined;
    
    // SKIP optimization for GitHub raw content or SVGs or already processed URLs
    if (src.includes('raw.githubusercontent.com') || src.endsWith('.svg') || src.includes('dicebear')) {
        return undefined;
    }
    
    // Add auto=format for WebP/AVIF support on Unsplash and other CDNs
    const sizes = [400, 800, 1200];
    return sizes.map(size => {
        const separator = src.includes('?') ? '&' : '?';
        // Add auto=format if not already present
        const fmtParam = src.includes('auto=format') ? '' : '&auto=format';
        return `${src}${separator}w=${size}&q=80${fmtParam} ${size}w`;
    }).join(', ');
  }, [src]);

  if (hasError) {
    return <div className={`w-full h-full bg-slate-800 flex items-center justify-center ${className}`}>
      <span className="text-slate-400 text-sm">Failed to load</span>
    </div>;
  }

  return (
    <motion.div
      className={`relative overflow-hidden ${aspectRatio === 'square' ? 'aspect-square' : ''} ${className} gpu-layer`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
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
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, y: 0,
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

export default OptimizedImage;
