'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  mode?: 'default' | 'catalog-to-product' | 'home-to-collection' | 'section';
  imageSrc?: string;
  isActive?: boolean;
}

export function PageTransition({ 
  children, 
  mode = 'default',
  imageSrc,
  isActive = true
}: PageTransitionProps) {
  // Переход с бордовой плоскостью для обычных разделов
  if (mode === 'section') {
    return (
      <>
        <AnimatePresence>
          {isActive && (
            <motion.div
              className="fixed inset-0 z-50 bg-rrc-wine pointer-events-none"
              initial={{ scaleX: 0, transformOrigin: 'left' }}
              animate={{ scaleX: 1, transformOrigin: 'right' }}
              exit={{ scaleX: 0, transformOrigin: 'right' }}
              transition={{ duration: 0.6, ease: [0.83, 0, 0.17, 1] }}
            />
          )}
        </AnimatePresence>
        {children}
      </>
    );
  }

  // Переход каталог → товар с выдвижением изображения
  if (mode === 'catalog-to-product' && imageSrc) {
    return (
      <>
        <AnimatePresence>
          {isActive && (
            <motion.div
              className="fixed inset-0 z-50 overflow-hidden bg-rrc-black pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Фоновое размытие */}
              <motion.div
                className="absolute inset-0 backdrop-blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              />
              
              {/* Выдвигающееся изображение */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.img
                  src={imageSrc}
                  alt=""
                  className="max-h-[80vh] max-w-[90vw] object-contain"
                  initial={{ filter: 'blur(10px)' }}
                  animate={{ filter: 'blur(0px)' }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {children}
      </>
    );
  }

  // Переход главная → коллекция с раскрытием изображения
  if (mode === 'home-to-collection' && imageSrc) {
    return (
      <>
        <AnimatePresence>
          {isActive && (
            <motion.div
              className="fixed inset-0 z-50 overflow-hidden bg-rrc-coal pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
            >
              {/* Изображение с перспективой */}
              <motion.div
                className="absolute inset-0"
                style={{ perspective: '1000px' }}
              >
                <motion.div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${imageSrc})` }}
                  initial={{ 
                    rotateX: '10deg',
                    scale: 0.5,
                    opacity: 0,
                    y: '20%'
                  }}
                  animate={{ 
                    rotateX: '0deg',
                    scale: 1,
                    opacity: 1,
                    y: '0%'
                  }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                />
              </motion.div>
              
              {/* Затемнение */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-rrc-black/60 via-transparent to-rrc-black/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {children}
      </>
    );
  }

  // Стандартный fade переход
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
