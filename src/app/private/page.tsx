'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {useLanguage} from '@/i18n';

/**
 * PRIVATE WELCOME — отдельный экран после успешного ACCESS CODE.
 *
 * Визуально отличается от обычного сайта: чистый чёрный фон, тонкие
 * архитектурные направляющие (статичная SVG-сетка), много воздуха,
 * никаких изображений товаров и никакого cyberpunk/neon.
 *
 * Текст: ACCESS GRANTED / «Ты внутри.» / описание / YOUR ACCESS IS ACTIVE
 * Кнопка: ENTER PRIVATE AREA →  → /private/home
 *
 * Анимации — мягкие fade/rise (0.6–0.9s), reduced motion → мгновенно.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

function rise(delay: number, reduced: boolean) {
  return {
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: reduced
      ? { duration: 0.01, delay }
      : { duration: 0.8, delay, ease: EASE },
  };
}

export default function PrivateWelcomePage() {
 const {language} = useLanguage(); const ru = language === 'ru';
  // 'use client': SSR и первый клиентский рендер должны совпадать,
  // поэтому reduced motion читаем в effect (как в RrcBootIntro),
  // а не синхронно в render.
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  return (
    <section
      data-rrc-private-welcome=""
      className="relative flex min-h-[calc(100vh-56px)] flex-col items-center justify-center overflow-hidden bg-black px-6 py-20 text-center sm:min-h-[calc(100vh-64px)]"
    >
      {/* Тонкие архитектурные направляющие — статичная сетка-«план» */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <g stroke="#ffffff" strokeWidth="0.05" opacity="0.14">
          <line x1="12" y1="0" x2="12" y2="100" />
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="88" y1="0" x2="88" y2="100" />
          <line x1="0" y1="18" x2="100" y2="18" />
          <line x1="0" y1="82" x2="100" y2="82" />
        </g>
        <g stroke="#ffffff" strokeWidth="0.05" opacity="0.08" fill="none">
          <rect x="12" y="18" width="76" height="64" />
          <line x1="12" y1="18" x2="0" y2="6" />
          <line x1="88" y1="18" x2="100" y2="6" />
        </g>
      </svg>

      {/* Мягкий центральный свет — глубина, не glow-эффект */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 46%, rgba(225,232,242,0.06), transparent 70%)',
        }}
      />

      <div className="relative z-10 flex w-full max-w-[560px] flex-col items-center">
        {/* ACCESS GRANTED */}
        <motion.p
          {...rise(0.05, reduced)}
          className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50 sm:text-[11px]"
        >
          ACCESS&nbsp;GRANTED
        </motion.p>

        {/* Тонкая линия-разделитель */}
        <motion.span
          aria-hidden="true"
          {...rise(0.18, reduced)}
          className="mt-8 block h-px w-16 bg-white/25"
        />

        {/* Ты внутри. */}
        <motion.h1
          {...rise(0.28, reduced)}
          className="mt-10 font-display text-3xl font-light leading-tight text-white sm:text-4xl"
        >
          {ru ? 'Ты внутри.' : 'You are inside.'}
        </motion.h1>

        {/* Описание */}
        <motion.div
          {...rise(0.42, reduced)}
          className="mt-8 space-y-5 font-mono text-[12px] uppercase leading-relaxed tracking-[0.14em] text-white/60 sm:text-[13px]"
        >
          <p>
            {ru ? 'Этот код открывает закрытый уровень RRC.' : 'This code opens the private level of RRC.'}
            <br />
            {ru ? 'Ранний доступ к коллекциям.' : 'Early access to collections.'}&nbsp;Private drops.
            <br />
            Pre-order releases.&nbsp;Rewards.
          </p>
          <p className="text-white/45">
            {ru ? 'Некоторые вещи появляются здесь раньше.' : 'Some pieces appear here earlier.'}
            <br />
            {ru ? 'Некоторые не появляются в открытом доступе вообще.' : 'Some never appear in the public catalogue.'}
          </p>
        </motion.div>

        {/* YOUR ACCESS IS ACTIVE */}
        <motion.p
          {...rise(0.58, reduced)}
          className="mt-12 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40"
        >
          <span
            aria-hidden="true"
            className="inline-block h-[5px] w-[5px] rounded-full bg-white/70"
          />
          YOUR&nbsp;ACCESS&nbsp;IS&nbsp;ACTIVE
        </motion.p>

        {/* CTA */}
        <motion.div {...rise(0.72, reduced)} className="mt-12 w-full sm:w-auto">
          <Link
            href="/private/home"
            className="rrc-intro-btn inline-block w-full px-10 py-4 text-center font-mono text-xs uppercase tracking-[0.25em] sm:w-auto"
          >
            <span className="relative z-[2]">{ru ? 'ВОЙТИ В PRIVATE' : 'ENTER PRIVATE AREA'}&nbsp;&rarr;</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
