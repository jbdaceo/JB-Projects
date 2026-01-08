
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'right', 
  delay = 0.4,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const timerRef = useRef<number>();

  const updatePosition = () => {
    if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;
        const gap = 12;
        
        switch (position) {
            case 'right':
                top = rect.top + rect.height / 2;
                left = rect.right + gap;
                break;
            case 'left':
                top = rect.top + rect.height / 2;
                left = rect.left - gap;
                break;
            case 'top':
                top = rect.top - gap;
                left = rect.left + rect.width / 2;
                break;
            case 'bottom':
                top = rect.bottom + gap;
                left = rect.left + rect.width / 2;
                break;
        }
        setCoords({ top, left });
    }
  };

  const handleMouseEnter = () => {
    timerRef.current = window.setTimeout(() => {
      updatePosition();
      setIsVisible(true);
    }, delay * 1000);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVisible(false);
  };

  // Clone element to attach event listeners and ref
  // Ensure the child component can accept a ref (framer-motion components do)
  const trigger = React.cloneElement(children as any, {
    ref: triggerRef,
    onMouseEnter: (e: React.MouseEvent) => {
        children.props.onMouseEnter?.(e);
        handleMouseEnter();
    },
    onMouseLeave: (e: React.MouseEvent) => {
        children.props.onMouseLeave?.(e);
        handleMouseLeave();
    }
  });

  return (
    <>
      {trigger}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ 
                opacity: 0, 
                scale: 0.9, 
                x: position === 'right' ? -10 : position === 'left' ? 10 : 0, 
                y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0 
              }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`fixed z-[9999] pointer-events-none ${className}`}
              style={{ 
                  top: coords.top, 
                  left: coords.left,
              }}
            >
                <div 
                    className="bg-slate-900/90 text-white text-xs font-medium px-3 py-2 rounded-lg border border-white/10 shadow-xl backdrop-blur-md whitespace-nowrap relative"
                    style={{ 
                        transform: position === 'left' ? 'translate(-100%, -50%)' : 
                                   position === 'right' ? 'translate(0, -50%)' : 
                                   position === 'top' ? 'translate(-50%, -100%)' : 
                                   'translate(-50%, 0)' 
                    }}
                >
                    {content}
                    {/* CSS Arrow */}
                    <div 
                        className={`absolute w-2 h-2 bg-slate-900/90 border-white/10 ${
                            position === 'right' ? 'border-b border-l -left-1 top-1/2 -translate-y-1/2 rotate-45' :
                            position === 'left' ? 'border-t border-r -right-1 top-1/2 -translate-y-1/2 rotate-45' :
                            position === 'top' ? 'border-b border-r -bottom-1 left-1/2 -translate-x-1/2 rotate-45' :
                            'border-t border-l -top-1 left-1/2 -translate-x-1/2 rotate-45'
                        }`}
                    />
                </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
