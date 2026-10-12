'use client';

import { useState, useEffect } from 'react';
import { MinimalPreloader } from '@/components/intro/MinimalPreloader';

export function IntroWrapper({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(true);
  const [introComplete, setIntroComplete] = useState(false);

  // Проверяем, нужно ли показывать вступление
  // В development показываем всегда для тестирования
  // В production - только один раз за сессию
  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('rrc_intro_seen');
    const isDev = process.env.NODE_ENV === 'development';
    
    if (hasSeenIntro && !isDev) {
      setShowIntro(false);
    }
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem('rrc_intro_seen', 'true');
    setIntroComplete(true);
    setTimeout(() => {
      setShowIntro(false);
    }, 800);
  };

  if (!showIntro || introComplete) {
    return <>{children}</>;
  }

  return (
    <>
      <MinimalPreloader onComplete={handleIntroComplete} />
      {/* Скрываем основной контент во время вступления */}
      <div style={{ opacity: 0, pointerEvents: 'none' }}>
        {children}
      </div>
    </>
  );
}
