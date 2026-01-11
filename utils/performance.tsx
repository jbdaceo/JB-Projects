
import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getPronunciation, decodeBase64Audio, decodeAudioData } from '../services/gemini';

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

// Global Text-to-Speech Handler for Cards
export const speakText = async (text: string, onStart?: () => void, onEnd?: () => void) => {
  onStart?.();
  try {
    const base64 = await getPronunciation(text);
    if (base64) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const buffer = await decodeAudioData(decodeBase64Audio(base64), ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
      source.onended = () => onEnd?.();
    } else {
      onEnd?.();
    }
  } catch (e) {
    onEnd?.();
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
    if (src.startsWith('data:')) return undefined;
    if (src.includes('raw.githubusercontent.com') || src.endsWith('.svg') || src.includes('dicebear')) {
        return undefined;
    }
    const sizes = [400, 800, 1200];
    return sizes.map(size => {
        const separator = src.includes('?') ? '&' : '?';
        const fmtParam = src.includes('auto=format') ? '' : '&auto=format';
        return `${src}${separator}w=${size}&q=80${fmtParam} ${size}w`;
    }).join(', ');
  }, [src]);

  if (hasError) {
    return <div className={`w-full h-full bg-slate-900 flex items-center justify-center ${className} rounded-[inherit]`}>
      <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest italic">Sync Failed</span>
    </div>;
  }

  return (
    <motion.div
      className={`relative overflow-hidden ${aspectRatio === 'square' ? 'aspect-square' : ''} ${className} gpu-layer`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
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
          className={`w-full h-full object-cover transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
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
      hidden: { opacity: 0, y: 30 },
      visible: { 
        opacity: 1, y: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
      }
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.94 },
      visible: { 
        opacity: 1, scale: 1,
        transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as const }
      }
    },
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
      }
    },
    listItem: {
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } }
    }
  }), []);
};

export default OptimizedImage;
