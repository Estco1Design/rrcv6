"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";

type TiltCtx = {
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  active: boolean;
} | null;

const Ctx = createContext<TiltCtx>(null);

/**
 * Доступ к tilt-значениям для слоёв глубины внутри TiltEffect.
 * Возвращает null, если компонент используется без TiltEffect
 * (вне карточек эффект просто не применяется — без ошибок).
 */
export function useTilt(): TiltCtx | null {
  return useContext(Ctx);
}

interface TiltEffectProps {
  children: ReactNode;
  className?: string;
  maxRotation?: number;
  disabled?: boolean;
}

/**
 * Subtle pointer-based tilt: карточка ощущается как физический объект
 * с небольшой глубиной, но остаётся editorial-минималистичной.
 *
 * - только mouse pointer (touch устройства получают обычную карточку);
 * - device orientation не используется, permission requests нет;
 * - prefers-reduced-motion => полный off;
 * - pointer events + motion values: без setState на каждый mousemove,
 *   без отдельного rAF-цикла на карточку;
 * - анимируются только GPU-friendly transform/opacity.
 */
export function TiltEffect({
  children,
  className = "",
  maxRotation = 3, // subtle: ~2-4deg max
  disabled = false,
}: TiltEffectProps) {
  const ref = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = useReducedMotion();
  const tiltDisabled = disabled || !!prefersReducedMotion;

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Плавное затухание, мягкий возврат в 0, без резкого spring/bounce
  const springConfig = { stiffness: 220, damping: 30, mass: 0.6 };
  const rotateX = useSpring(y, springConfig);
  const rotateY = useSpring(x, springConfig);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (tiltDisabled || !ref.current) return;
    if (e.pointerType !== "mouse") return; // touch/stylus — без tilt

    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5;

    x.set(px * 2 * maxRotation);
    y.set(-py * 2 * maxRotation);
  };

  const handlePointerLeave = () => {
    if (tiltDisabled) return;
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ perspective: 1200 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Ctx.Provider value={{ rotateX, rotateY, active: !tiltDisabled }}>
        <motion.div
          style={
            tiltDisabled
              ? undefined
              : { rotateX, rotateY, transformStyle: "preserve-3d" }
          }
        >
          {children}
        </motion.div>
      </Ctx.Provider>
    </motion.div>
  );
}
