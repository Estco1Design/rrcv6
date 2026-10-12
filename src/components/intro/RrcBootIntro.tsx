'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { IntroBackground } from '@/components/intro/IntroBackground';
import {useLanguage} from '@/i18n';
import {DialogFocus} from '@/components/ui/DialogFocus';
import { markPrivateSession } from '@/lib/private-session';

/**
 * RRC INTRO (входной экран)
 *
 * 0.00–0.30s  — полностью чёрный экран
 * 0.30–3.00s  — RICHRUSSIANCOMMUNITY собирается по буквам:
 *               reveal через clip-path (маска снизу вверх), каждая буква
 *               поднимается на ~8px, лёгкий stagger. Это НЕ typewriter.
 * 3.00–3.30s  — пауза
 * 3.30–3.70s  — появляются две кнопки: ВОЙТИ / PRIVATE ACCESS
 *               (максимум до появления кнопок — 5 секунд)
 *
 * Intro НЕ закрывается автоматически — ждёт действия пользователя.
 *
 * ВОЙТИ          — закрытие за 300–450ms + sessionStorage rr_intro_seen
 * PRIVATE ACCESS — не закрывает intro; вместо кнопок появляется форма
 *                  {ru ? 'КОД ДОСТУПА' : 'ACCESS CODE'} / [ ENTER CODE ] / ENTER / BACK.
 *                  {ru ? 'НАЗАД' : 'BACK'} и Escape возвращают две кнопки без reload.
 *                  ENTER → POST /api/private-access/verify (проверка кода
 *                  на сервере, коды в env RRC_PRIVATE_CODES); успех →
 *                  cookie rrc_private_access + переход на /private
 *                  (отдельный private welcome — НЕ обычная главная);
 *                  ошибка → деликатная подпись INVALID CODE, код не
 *                  светится в UI.
 *
 * Фон: IntroBackground — архитектурные направляющие с медленным drift,
 * слабый центральный breathing glow, едва заметная vignette и grain.
 * Всё CSS/SVG (без canvas/WebGL), transform-only анимации.
 *
 * Стиль: минимализм — тонкие border, square corners, uppercase, tracking,
 * very subtle shimmer + border glow на кнопках. Без glitch / neon / RGB /
 * 3D / spinner / %.
 *
 * prefers-reduced-motion: буквы появляются сразу, фон статичен, shimmer off.
 */

const INTRO_SEEN_KEY = 'rrc_intro_seen';
// Путь private welcome — отдельный экран после успешного ACCESS CODE.
// На /private* интро не показывается (там свой, приватный UX).
const PRIVATE_WELCOME_PATH = '/private';

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

type Mode = 'buttons' | 'form';
type Phase = 'init' | 'visible' | 'closing' | 'done';
type VerifyState = 'idle' | 'checking' | 'invalid' | 'unavailable' | 'limited';

export function RrcBootIntro() {
  const {language} = useLanguage(); const ru = language === 'ru';
  const [phase, setPhase] = useState<Phase>('init');
  const [mode, setMode] = useState<Mode>('buttons');
  const [code, setCode] = useState('');
  const [verify, setVerify] = useState<VerifyState>('idle');
  const [reduced, setReduced] = useState(false);
  const closingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
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

  // Escape: в форме — назад к кнопкам; на экране кнопок ничего не закрываем
  // (intro ждёт действия пользователя, авто-закрытия нет).
  useEffect(() => {
    if (phase !== 'visible') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mode === 'form') {
        e.preventDefault();
        setMode('buttons');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, mode]);

  // Фокус в поле при открытии формы + сброс состояния проверки
  useEffect(() => {
    if (mode === 'form') {
      setVerify('idle');
      const id = window.setTimeout(() => inputRef.current?.focus(), 60);
      return () => window.clearTimeout(id);
    }
  }, [mode]);

  // Проверка кода — на сервере (POST /api/private-access/verify).
  // Клиент не знает и не хранит список допустимых кодов.
  const submitCode = useCallback(async () => {
    const value = code.trim();
    if (!value || verify === 'checking') return;
    setVerify('checking');
    try {
      const res = await fetch('/api/private-access/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: value }),
      });
      if (res.ok) {
        // Доступ подтверждён (server установил httpOnly-cookie).
        // НЕ открываем обычную главную: уходим на отдельный private welcome.
        setCode('');
        markPrivateSession();
        try {
          sessionStorage.setItem(INTRO_SEEN_KEY, 'true');
        } catch {
          /* storage может быть недоступен — не блокируем переход */
        }
        closingRef.current = true;
        setPhase('closing');
        window.setTimeout(() => {
          setPhase('done');
          router.push(PRIVATE_WELCOME_PATH);
        }, 420);
      } else {
        setVerify(res.status === 503 ? 'unavailable' : res.status === 429 ? 'limited' : 'invalid');
      }
    } catch {
      // Сеть недоступна — деликатно просим повторить, без паники
      setVerify('invalid');
    }
  }, [code, verify, router]);

  // Scroll lock, пока intro виден
  useEffect(() => {
    const html = document.documentElement;
    if (phase === 'visible' || phase === 'closing') {
      html.style.setProperty('overflow', 'hidden');
    } else {
      html.style.removeProperty('overflow');
    }
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
        <AnimatePresence mode="wait">
          {mode === 'buttons' ? (
            <motion.div
              key="buttons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
              transition={{
                delay: reduced ? 0 : T_BUTTONS_START,
                duration: reduced ? 0.2 : 0.4,
                ease: 'easeOut',
              }}
              className="flex w-full max-w-[420px] flex-col items-stretch gap-3 sm:flex-row sm:justify-center sm:gap-4"
            >
              <IntroButton onClick={closeIntro} label={ru ? "ВОЙТИ" : "ENTER"} />
              <IntroButton
                onClick={() => setMode('form')}
                label="PRIVATE ACCESS"
                variant="ghost"
              />
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onSubmit={(e) => {
                // Проверка кода — на сервере; отправка не перезагружает страницу
                e.preventDefault();
                void submitCode();
              }}
              className="flex w-full max-w-[320px] flex-col items-stretch gap-3"
            >
              <label
                htmlFor="rrc-access-code"
                className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/60"
              >
                {ru ? 'КОД ДОСТУПА' : 'ACCESS CODE'}
              </label>

              <input
                id="rrc-access-code"
                ref={inputRef}
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (verify === 'invalid') setVerify('idle');
                }}
                placeholder={ru ? '[ ВВЕДИТЕ КОД ]' : '[ ENTER CODE ]'} maxLength={100}
                aria-invalid={verify === 'invalid' || undefined}
                className="w-full border border-white/30 bg-transparent px-4 py-3 font-mono text-base uppercase tracking-[0.2em] text-white placeholder:text-white/25 focus:border-white/70 focus:outline-none"
                /* text-base = 16px → без iOS zoom на фокусе */
              />

              {/* Деликатный статус: без раскрытия причин и без света на коде */}
              <div
                aria-live="polite"
                className="min-h-[16px] font-mono text-[10px] uppercase tracking-[0.25em]"
              >
                {verify === 'checking' && (
                  <span className="text-white/40">CHECKING…</span>
                )}
                {['invalid', 'unavailable', 'limited'].includes(verify) && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-white/55"
                  >
                    {verify === 'unavailable' ? (ru ? 'PRIVATE-ДОСТУП ПОКА ЗАКРЫТ' : 'PRIVATE ACCESS IS CLOSED') : verify === 'limited' ? (ru ? 'ПОВТОРИТЕ ЧЕРЕЗ МИНУТУ' : 'TRY AGAIN IN ONE MINUTE') : (ru ? 'НЕВЕРНЫЙ КОД — ПОВТОРИТЕ' : 'INVALID CODE — TRY AGAIN')}
                  </motion.span>
                )}
              </div>

              <div className="mt-1 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={verify === 'checking'}
                  className="rrc-intro-btn flex-1 px-6 py-3 font-mono text-xs uppercase tracking-[0.25em] disabled:opacity-60"
                >
                  {verify === 'checking' ? (ru ? 'ПРОВЕРКА' : 'CHECKING') : (ru ? 'ВОЙТИ' : 'ENTER')}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('buttons')}
                  className="rrc-intro-btn rrc-intro-btn--ghost flex-1 px-6 py-3 font-mono text-xs uppercase tracking-[0.25em]"
                >
                  {ru ? 'НАЗАД' : 'BACK'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
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
