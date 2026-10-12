'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MinimalPreloaderProps {
  onComplete: () => void;
}

export function MinimalPreloader({ onComplete }: MinimalPreloaderProps) {
  const [shouldSkip, setShouldSkip] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const DURATION = 1000; // 1 second total
  const EXIT_DURATION = 800;
  
  const REDUCED_MOTION = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Handle skip
  const handleSkip = useCallback(() => {
    setShouldSkip(true);
    setTimeout(() => onComplete(), 200);
  }, [onComplete]);

  // Keyboard escape to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  // Check sessionStorage for repeat visits
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenIntro = sessionStorage.getItem('rrc_intro_seen');
      if (hasSeenIntro && process.env.NODE_ENV !== 'development') {
        setTimeout(() => onComplete(), 100);
        return;
      }
    }
    
    // Auto complete after duration
    if (!REDUCED_MOTION) {
      const timer = setTimeout(() => {
        setIsComplete(true);
        setTimeout(() => onComplete(), EXIT_DURATION);
      }, DURATION);
      
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => onComplete(), 500);
    }
  }, [onComplete, REDUCED_MOTION]);

  // Save fact that intro was seen
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('rrc_intro_seen', 'true');
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {!shouldSkip && !isComplete && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: EXIT_DURATION / 1000, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Content */}
          <div className="flex flex-col items-center justify-center gap-4">
            {/* Brand text - small, thin, with letter-spacing */}
            <motion.div
              initial={{ opacity: 0, filter: 'blur(8px)', letterSpacing: '0.5em' }}
              animate={{ 
                opacity: 1, 
                filter: 'blur(0px)',
                letterSpacing: '0.25em'
              }}
              transition={{ 
                duration: 0.8, 
                ease: [0.22, 1, 0.36, 1],
                delay: 0.1
              }}
              className="text-center"
            >
              <h1 className="font-mono text-xs md:text-sm font-light tracking-[0.25em] text-rrc-white uppercase">
                RICHRUSSIANCOMMUNITY
              </h1>
            </motion.div>

            {/* Progress line - thin horizontal */}
            <motion.div
              className="w-[120px] md:w-[160px] h-[1px] bg-rrc-line overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.div
                className="h-full bg-rrc-white/60"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ 
                  duration: DURATION / 1000, 
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.2
                }}
              />
            </motion.div>
          </div>

          {/* Skip button - minimal */}
          <motion.button
            onClick={handleSkip}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 px-4 py-2 text-[9px] tracking-widest text-rrc-off hover:text-rrc-white transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            aria-label="Skip intro"
          >
            SKIP
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
