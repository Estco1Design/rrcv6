'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BrandIntroProps {
  onComplete: () => void;
}

export function BrandIntro({ onComplete }: BrandIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [shouldSkip, setShouldSkip] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  
  // Частицы распределены по ВСЕМУ экрану с объёмом
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    delay: number;
    depth: number;
    initialX: number;
    initialY: number;
    phase: 'floating' | 'gathering' | 'forming';
  }>>([]);

  // Тайминги для новой последовательности
  const INITIAL_PAUSE = 500;      // 0.5s капли существуют по экрану
  const GATHER_START = 500;       // Начинают притягиваться
  const GATHER_DURATION = 1800;   // 1.8s движение к центру
  const HOLD_DURATION = 600;      // 0.6s готовая надпись
  const EXIT_DURATION = 800;      // 0.8s выход
  const TOTAL_DURATION = INITIAL_PAUSE + GATHER_DURATION + HOLD_DURATION + EXIT_DURATION;
  
  const PARTICLE_COUNT = 2400;    // Больше частиц для покрытия всего экрана
  const REDUCED_MOTION = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Генерация точек внутри текста для финальной формы
  const generateTextPoints = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const text = 'RICHRUSSIANCOMMUNITY';
    const fontSize = Math.min(width / 14, 84);
    
    ctx.font = `800 ${fontSize}px Unbounded, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.clearRect(0, 0, width, height);
    ctx.fillText(text, width / 2, height / 2);
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const points: Array<{ x: number; y: number }> = [];
    const step = 3;
    
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
        if (imageData.data[index + 3] > 128) {
          points.push({ x, y });
        }
      }
    }
    
    return points;
  }, []);

  // Инициализация частиц - ТЕПЕРЬ ПО ВСЕМУ ЭКРАНУ С ОБЪЁМОМ
  const initParticles = useCallback((width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const textPoints = generateTextPoints(ctx, width, height);
    const particles = [];
    
    // 9 зон распределения частиц по ВСЕМУ экрану + дополнительные
    const zones = [
      // Верхний ряд - широко распределены
      { x: width * 0.08, y: height * 0.08 },   // Левый верхний угол
      { x: width * 0.3, y: height * 0.06 },    // Верх-лево
      { x: width * 0.5, y: height * 0.05 },    // Верхний центр
      { x: width * 0.7, y: height * 0.06 },    // Верх-право
      { x: width * 0.92, y: height * 0.08 },   // Правый верхний угол
      
      // Средний ряд - максимально широко
      { x: width * 0.05, y: height * 0.3 },    // Левая сторона верх
      { x: width * 0.06, y: height * 0.5 },    // Левый центр
      { x: width * 0.05, y: height * 0.7 },    // Левая сторона низ
      { x: width * 0.3, y: height * 0.4 },     // Центр-лево верх
      { x: width * 0.5, y: height * 0.5 },     // Центр
      { x: width * 0.7, y: height * 0.4 },     // Центр-право верх
      { x: width * 0.95, y: height * 0.3 },    // Правая сторона верх
      { x: width * 0.94, y: height * 0.5 },    // Правый центр
      { x: width * 0.95, y: height * 0.7 },    // Правая сторона низ
      
      // Нижний ряд - широко распределены
      { x: width * 0.08, y: height * 0.92 },   // Левый нижний угол
      { x: width * 0.3, y: height * 0.88 },    // Низ-лево
      { x: width * 0.5, y: height * 0.94 },    // Нижний центр
      { x: width * 0.7, y: height * 0.88 },    // Низ-право
      { x: width * 0.92, y: height * 0.92 },   // Правый нижний угол
    ];

    // Распределяем частицы по всем зонам
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Выбираем случайную зону
      const zoneIndex = i % zones.length;
      const zone = zones[zoneIndex];
      
      // Распределяем частицы вокруг зоны с ОЧЕНЬ большим разбросом
      const angle = Math.random() * Math.PI * 2;
      // Большой радиус распределения для покрытия всего экрана
      const maxRadius = Math.min(width, height) * (0.35 + Math.random() * 0.2);
      const radius = Math.random() * maxRadius;
      
      const startX = zone.x + Math.cos(angle) * radius;
      const startY = zone.y + Math.sin(angle) * radius * 0.7;
      
      // Убедимся, что частицы в пределах экрана
      const clampedX = Math.max(15, Math.min(width - 15, startX));
      const clampedY = Math.max(15, Math.min(height - 15, startY));

      // Выбираем случайную целевую точку из текста
      const targetPoint = textPoints[Math.floor(Math.random() * textPoints.length)];
      
      // Разные задержки для создания волнового эффекта
      const delayGroup = i % 8;
      const delay = delayGroup * 80 + Math.random() * 100;
      
      // Разная глубина для перспективы (от 0.3 до 1.5)
      const depth = 0.3 + Math.random() * 1.2;
      
      // Разный размер частиц в зависимости от глубины
      const baseRadius = (Math.random() * 2.5 + 0.8) * depth;
      
      // Цвета крови - глубокие красные оттенки
      const colorVariants = [
        '#8B1A3E',  // Глубокий красный
        '#6B0F2E',  // Тёмно-красный
        '#4A0A1F',  // Бордовый
        '#A52048',  // Яркий кровавый
        '#7A1438',  // Насыщенный красный
      ];
      const color = colorVariants[Math.floor(Math.random() * colorVariants.length)];

      particles.push({
        x: clampedX,
        y: clampedY,
        initialX: clampedX,
        initialY: clampedY,
        targetX: targetPoint?.x || width / 2,
        targetY: targetPoint?.y || height / 2,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: baseRadius,
        color,
        delay,
        depth,
        phase: 'floating' as const,
      });
    }
    
    particlesRef.current = particles;
  }, [generateTextPoints]);

  // Анимационный цикл
  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = timestamp - startTimeRef.current;
    
    const gatherProgress = Math.min(Math.max((elapsed - GATHER_START) / GATHER_DURATION, 0), 1);
    const totalProgress = Math.min(elapsed / TOTAL_DURATION, 1);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Очистка с абсолютно черным фоном
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Обновление и отрисовка частиц
    particlesRef.current.forEach((particle, index) => {
      // Определяем фазу частицы
      const timeSinceGatherStart = elapsed - GATHER_START - particle.delay;
      
      if (timeSinceGatherStart < 0) {
        particle.phase = 'floating';
      } else if (timeSinceGatherStart < GATHER_DURATION * 0.7) {
        particle.phase = 'gathering';
      } else {
        particle.phase = 'forming';
      }

      let t: number;
      
      if (particle.phase === 'floating') {
        // Лёгкое плавающее движение
        const floatSpeed = 0.0005 * particle.depth;
        particle.x += Math.sin(elapsed * floatSpeed + index) * 0.2;
        particle.y += Math.cos(elapsed * floatSpeed + index * 0.7) * 0.2;
        t = 0;
      } else {
        // Движение к цели
        const localProgress = Math.min(timeSinceGatherStart / (GATHER_DURATION * 0.7), 1);
        
        // Easing функция с РЕЗКИМ ускорением к концу
        const easeInQuint = Math.pow(localProgress, 5);
        const easeOutQuint = 1 - Math.pow(1 - localProgress, 5);
        const combinedEase = easeInQuint * 0.2 + easeOutQuint * 0.8;
        t = combinedEase;

        // Позиция с интерполяцией и турбулентностью
        const progressFactor = 0.08 * (1 + Math.pow(1 - t, 2) * 8); // Сильное ускорение в конце
        
        // Добавляем искривление траектории для динамики
        const curveAngle = Math.sin(elapsed * 0.003 + index * 0.2) * (1 - t) * 0.8;
        const curveX = Math.cos(curveAngle) * (1 - t) * 40 * particle.depth;
        const curveY = Math.sin(curveAngle) * (1 - t) * 40 * particle.depth;
        
        particle.x += (particle.targetX - particle.x + curveX) * progressFactor;
        particle.y += (particle.targetY - particle.y + curveY) * progressFactor;
      }

      // Отрисовка частицы с эффектом ОБЪЁМНОЙ капли крови
      ctx.beginPath();
      const currentRadius = particle.radius * (0.5 + t * 0.8);
      ctx.arc(particle.x, particle.y, currentRadius, 0, Math.PI * 2);
      
      // Радиальный градиент для 3D эффекта капли крови
      const gradient = ctx.createRadialGradient(
        particle.x - currentRadius * 0.35,
        particle.y - currentRadius * 0.35,
        0,
        particle.x,
        particle.y,
        currentRadius
      );
      gradient.addColorStop(0, '#FF6B8A');      // Яркий блик (почти белый)
      gradient.addColorStop(0.15, '#E84A6F');   // Светлая область
      gradient.addColorStop(0.35, particle.color); // Основной цвет
      gradient.addColorStop(0.65, '#5A0D2A');   // Тень
      gradient.addColorStop(0.85, '#2A0412');   // Край
      gradient.addColorStop(1, '#0A0103');      // Внешний край
      
      ctx.fillStyle = gradient;
      ctx.fill();

      // Дополнительный яркий блик для влажного эффекта крови
      if (t > 0.2) {
        ctx.beginPath();
        const highlightSize = currentRadius * 0.25;
        ctx.arc(
          particle.x - currentRadius * 0.35,
          particle.y - currentRadius * 0.35,
          highlightSize,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 220, 230, ${0.6 * (1 - t) * 0.8})`;
        ctx.fill();
      }
      
      // Вторичный блик снизу для объёма
      if (t > 0.4) {
        ctx.beginPath();
        ctx.arc(
          particle.x + currentRadius * 0.2,
          particle.y + currentRadius * 0.35,
          currentRadius * 0.12,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 180, 190, ${0.35 * (1 - t) * 0.6})`;
        ctx.fill();
      }
      
      // Третичный блик сбоку
      if (t > 0.5 && particle.depth > 0.8) {
        ctx.beginPath();
        ctx.arc(
          particle.x - currentRadius * 0.15,
          particle.y + currentRadius * 0.1,
          currentRadius * 0.08,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 200, 210, ${0.25 * (1 - t) * 0.5})`;
        ctx.fill();
      }
    });

    // Рисуем финальный текст при завершении движения
    const holdStart = GATHER_START + GATHER_DURATION;
    const holdEnd = holdStart + HOLD_DURATION;
    
    if (elapsed >= holdStart) {
      const holdProgress = Math.min((elapsed - holdStart) / HOLD_DURATION, 1);
      const alpha = Math.min(holdProgress * 2.5, 1);
      const fontSize = Math.min(width / 14, 84);
      
      // Свечение вокруг текста
      ctx.shadowColor = 'rgba(180, 40, 80, 0.8)';
      ctx.shadowBlur = 35 * (1 - holdProgress * 0.5);
      
      ctx.font = `800 ${fontSize}px Unbounded, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Основной текст с градиентом
      const textGradient = ctx.createLinearGradient(
        width / 2 - width / 3,
        height / 2,
        width / 2 + width / 3,
        height / 2
      );
      textGradient.addColorStop(0, '#EBE9E7');
      textGradient.addColorStop(0.5, '#FFFFFF');
      textGradient.addColorStop(1, '#EBE9E7');
      
      ctx.fillStyle = `rgba(235, 233, 231, ${alpha})`;
      ctx.fillText('RICHRUSSIANCOMMUNITY', width / 2, height / 2);
      ctx.shadowBlur = 0;
      
      // Мерцание на тексте
      if (holdProgress > 0.3) {
        const shimmerAlpha = Math.sin(elapsed * 0.004) * 0.12 + 0.12;
        ctx.fillStyle = `rgba(255, 255, 255, ${shimmerAlpha * (1 - holdProgress)})`;
        ctx.fillText('RICHRUSSIANCOMMUNITY', width / 2, height / 2);
      }
      
      // Лёгкий красный glow эффект
      if (holdProgress < 0.8) {
        ctx.shadowColor = 'rgba(155, 44, 74, 0.5)';
        ctx.shadowBlur = 20;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
        ctx.fillText('RICHRUSSIANCOMMUNITY', width / 2, height / 2);
        ctx.shadowBlur = 0;
      }
    }

    // Завершение анимации или продолжение
    if (totalProgress < 1 && !shouldSkip && !isComplete) {
      animationRef.current = requestAnimationFrame(animate);
    } else if (!isComplete) {
      setIsComplete(true);
      setTimeout(() => {
        onComplete();
      }, 100);
    }
  }, [onComplete, shouldSkip, isComplete, TOTAL_DURATION, GATHER_START, GATHER_DURATION, HOLD_DURATION]);

  // Обработка пропуска
  const handleSkip = useCallback(() => {
    setShouldSkip(true);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setTimeout(() => onComplete(), 200);
  }, [onComplete]);

  // Обработка клавиши Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  // Инициализация
  useEffect(() => {
    if (REDUCED_MOTION) {
      setTimeout(() => onComplete(), 500);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Установка размеров
    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    // Ждём загрузки шрифта
    document.fonts.ready.then(() => {
      initParticles(canvas.width, canvas.height);
      setIsReady(true);
      startTimeRef.current = undefined;
      animationRef.current = requestAnimationFrame(animate);
    });

    const handleResize = () => {
      setSize();
      initParticles(canvas.width, canvas.height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [initParticles, animate, REDUCED_MOTION, onComplete]);

  // Проверка sessionStorage для повторного посещения
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenIntro = sessionStorage.getItem('rrc_intro_seen');
      if (hasSeenIntro && process.env.NODE_ENV !== 'development') {
        setTimeout(() => onComplete(), 100);
        return;
      }
    }
  }, [onComplete]);

  // Сохраняем факт просмотра после завершения
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('rrc_intro_seen', 'true');
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {!shouldSkip && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: EXIT_DURATION / 1000, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Canvas для анимации */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ touchAction: 'none' }}
          />

          {/* Кнопка пропуска */}
          <motion.button
            onClick={handleSkip}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 text-t-ui tracking-widest text-rrc-off hover:text-rrc-white border border-rrc-line hover:border-rrc-wine transition-colors z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            aria-label="Skip intro"
          >
            SKIP
          </motion.button>

          {/* Индикатор прогресса (тонкая линия внизу) */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-rrc-wine"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: (GATHER_START + GATHER_DURATION) / 1000, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
