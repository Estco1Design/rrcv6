'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { IntroBackground } from '@/components/intro/IntroBackground';
import {useLanguage} from '@/i18n';
import {DialogFocus} from '@/components/ui/DialogFocus';

/** Brand introduction with public and registered-member entry points. */
const INTRO_SEEN_KEY = 'rrc_intro_seen';

// Тайминги (секунды)
const T_BLACK = 0.3;          // чёрный экран до старта букв
const T_LETTERS_START = 0.3;  // старт побуквенного reveal
const T_LETTERS_END = 3.0;    // всё слово собрано (последняя буква доходит к ~2.95s)
const T_BUTTONS_START = 3.3;  // небольшие пауза 3.0–3.3, затем кнопки (0.4s fade → 3.7s)
const LETTER_WORD = 'RICHRUSSIANCOMMUNITY';
const LETTERS = LETTER_WORD.split('');
const LETTER_DUR = 0.5;
// stagger подобран так, чтобы сборка слова заняла окно 0.3–3.0s
const STAGGER = (T_LETTERS_END - T_LETTERS_START - LETTER_DUR) / (LETTERS.length - 1);

type Phase = 'init' | 'visible' | 'closing' | 'done';

export function RrcBootIntro() {
  const {language} = useLanguage(); const ru = language === 'ru';
  const [phase, setPhase] = useState<Phase>('init');
  const [reduced, setReduced] = useState(false);
  const closingRef = useRef(false);
  const router = useRouter();

  // Первый mount (client-only): sessionStorage читаем только на клиенте —
  // hydration mismatch невозможен (SSR и первый client render: phase 'init').
  useEffect(() => {
    // На путях private-зоны интро не показываем (приватный UX отдельный)
    if (window.location.pathname !== '/') {
      setPhase('done');
      return;
    }
    let seen = false;
    try {
      seen = sessionStorage.getItem(INTRO_SEEN_KEY) === 'true';
    } catch {
      seen = false;
    }
    if (seen) {
      setPhase('done');
      return;
    }
    // reduced motion: без анимаций движения, буквы/кнопки появляются сразу
    setReduced(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
    setPhase('visible');
  }, []);

  // Закрытие по ВОЙТИ: fade 300–450ms, затем unmount
  const closeIntro = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, 'true');
      window.dispatchEvent(new Event('rrc:enter'));
    } catch {
      /* storage может быть недоступен — не блокируем сайт */
    }
    setPhase('closing');
    window.setTimeout(() => setPhase('done'), 420);
  }, []);

  // Scroll lock, пока intro виден
  useEffect(() => {
    const html = document.documentElement;
    if (phase === 'visible' || phase === 'closing') {
      html.style.setProperty('overflow', 'hidden');
    } else {
      html.style.removeProperty('overflow');
    }
    return()=>{html.style.removeProperty('overflow');};
  }, [phase]);

  if (phase === 'init' || phase === 'done') return null;

  // Буквы: stagger так, чтобы последняя буква завершилась ровно к T_LETTERS_END
  const letterTransition = (i: number) =>
    reduced
      ? { duration: 0.2, delay: T_BLACK + i * 0.015 }
      : {
          delay: T_LETTERS_START + i * STAGGER,
          duration: LETTER_DUR,
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        };

  return (
    <div
      data-rrc-boot-intro=""
      role="dialog" aria-modal="true" aria-label="RICHRUSSIANCOMMUNITY"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-black select-none"
    >
      {/* Усиленный, но сдержанный фон: направляющие, breathing glow, grain */}
      <DialogFocus/>
      <IntroBackground />

      {/* Доступное имя бренда; буквы декоративны */}
      <span className="sr-only">{LETTER_WORD}</span>

      {/* ---------- RICHRUSSIANCOMMUNITY: побуквенный reveal ---------- */}
      <div
        aria-hidden="true"
        className="relative z-10 w-full px-4 text-center"
      >
        <div className="mx-auto flex max-w-[94vw] items-end justify-center overflow-x-hidden">
          {LETTERS.map((ch, i) => (
            <motion.span
              key={`${ch}-${i}`}
              className="inline-block shrink-0 font-display font-medium uppercase leading-[1.1] text-white"
              style={{
                willChange: 'transform, opacity',
                // 20 букв × (5.6vw + 0.06em tracking) ≈ 117vw → clamp по ширине
                // вьюпорта: на 390px/430px слово гарантированно в экране
                fontSize: 'min(5.6vw, calc((100vw - 2rem) / 21.2), 30px)',
                letterSpacing: '0.06em',
              }}
              initial={
                reduced
                  ? { opacity: 0 }
                  : { y: 8, opacity: 0 }
              }
              animate={
                reduced
                  ? { opacity: 1 }
                  : { y: 0, opacity: 1 }
              }
              transition={letterTransition(i)}
            >
              {ch}
            </motion.span>
          ))}
        </div>
      </div>

      {/* ---------- Кнопки / форма (data-rrc-intro-actions — якорь для тестов) ---------- */}
      <div data-rrc-intro-actions="" className="relative z-10 mt-12 flex min-h-[140px] w-full items-start justify-center px-4 sm:mt-14">
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:reduced?0:T_BUTTONS_START,duration:reduced?0:.4}} className="flex w-full max-w-[460px] flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <IntroButton onClick={closeIntro} label={ru?'ВОЙТИ':'ENTER'}/>
          <IntroButton onClick={()=>{closeIntro();router.push('/access')}} label={ru?'ЗАКРЫТЫЙ УРОВЕНЬ':'CLOSED LEVEL'} variant="ghost"/>
        </motion.div>
      </div>

      {/* Затухание всего overlay при закрытии (ВОЙТИ) — 420ms */}
      {phase === 'closing' && (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.42, ease: 'easeIn' }}
        />
      )}
    </div>
  );
}

/**
 * Минималистичная кнопка intro: прозрачный фон, тонкий белый border,
 * square corners, uppercase, tracking (стили — в globals.css, .rrc-intro-btn).
 * Усиление без смены стиля:
 *  - very subtle shimmer: редкая диагональная полоска света (CSS keyframes)
 *  - hover: инверсия + тонкий border glow (без неона, дорого и сдержанно)
 *  - focus-visible получает тот же glow → клавиатурная навигация читаема
 */
function IntroButton({
  label,
  onClick,
  variant = 'primary',
}: {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'ghost';
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.25 }}
      className={`rrc-intro-btn w-full px-8 py-3.5 text-center font-mono text-xs uppercase tracking-[0.25em] sm:w-auto${
        variant === 'ghost' ? ' rrc-intro-btn--ghost' : ''
      }`}
    >
      <span className="relative z-[2]">{label}</span>
    </motion.button>
  );
}
