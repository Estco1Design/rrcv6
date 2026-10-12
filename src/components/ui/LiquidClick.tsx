'use client';

import { useRef, useEffect, useCallback } from 'react';

interface LiquidClickProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function LiquidClick({ children, className = '', onClick }: LiquidClickProps) {
  const containerRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const ripplesRef = useRef<Array<{
    x: number;
    y: number;
    radius: number;
    alpha: number;
    color: string;
    wave: number;
  }>>([]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ripplesRef.current = ripplesRef.current.filter((ripple) => {
      ripple.radius += 2;
      ripple.alpha -= 0.02;
      ripple.wave += 0.3;

      if (ripple.alpha <= 0) return false;

      const waveOffset = Math.sin(ripple.wave) * 3;
      
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius + waveOffset, 0, Math.PI * 2);
      ctx.strokeStyle = ripple.color.replace(/[\d.]+\)$/g, `${ripple.alpha})`);
      ctx.lineWidth = 2;
      ctx.stroke();

      // Мягкий пузырь в центре
      if (ripple.radius < 20) {
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80, 20, 30, ${ripple.alpha * 0.3})`;
        ctx.fill();
      }

      return true;
    });

    if (ripplesRef.current.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      animationRef.current = null;
    }
  }, []);

  const createRipple = useCallback((x: number, y: number) => {
    const colors = [
      'rgba(45, 45, 45, 0.6)',    // графит
      'rgba(80, 20, 30, 0.5)',    // бордовый
      'rgba(100, 150, 160, 0.3)', // холодный блик
    ];
    
    ripplesRef.current.push({
      x,
      y,
      radius: 0,
      alpha: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      wave: 0,
    });

    if (!animationRef.current) {
      animate();
    }
  }, [animate]);


  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      createRipple(x, y);
    }
    onClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        createRipple(rect.width / 2, rect.height / 2);
      }
      onClick?.();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => {window.removeEventListener('resize', resizeCanvas);if (animationRef.current) cancelAnimationFrame(animationRef.current);};
  }, []);

  // Проверка на reduced motion
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <button
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
      style={{
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          mixBlendMode: 'overlay',
        }}
      />
      <span className={prefersReducedMotion ? 'transition-colors duration-300' : ''}>
        {children}
      </span>
    </button>
  );
}
