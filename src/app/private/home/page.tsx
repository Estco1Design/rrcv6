import type { Metadata } from 'next';
import Link from 'next/link';

/**
 * PRIVATE HOME — отдельная приватная главная RRC.
 *
 * Пока только структура (без выдуманных товаров):
 *   RRC PRIVATE + разделы EARLY ACCESS / PRIVATE DROP / PRE-ORDER /
 *   REWARDS / ARCHIVE — нумерованный «план» с тонкими линиями.
 *
 * Намеренно НЕ похоже на публичную /: нет hero-изображений, нет карточек,
 * нет грида товаров; композиция — архитектурный список-план, много воздуха.
 * Разделы — якоря структуры: ссылки ведут на себя (страницы разделов
 * появятся позже), чтобы не выдумывать контент.
 */

export const metadata: Metadata = {
  title: 'RRC PRIVATE — Home',
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { num: '01', key: 'EARLY ACCESS' },
  { num: '02', key: 'PRIVATE DROP' },
  { num: '03', key: 'PRE-ORDER' },
  { num: '04', key: 'REWARDS' },
  { num: '05', key: 'ARCHIVE' },
] as const;

export default function PrivateHomePage() {
  return (
    <section
      data-rrc-private-home=""
      className="relative mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-[1100px] flex-col justify-center px-5 py-16 sm:min-h-[calc(100vh-64px)] sm:px-10 sm:py-24"
    >
      {/* Тонкая вертикальная ось композиции */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-5 top-0 h-full w-px bg-white/[0.06] sm:left-10"
      />

      {/* Заголовок зоны */}
      <header className="mb-14 sm:mb-20">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/40">
          RICHRUSSIANCOMMUNITY&nbsp;/&nbsp;CLOSED&nbsp;LEVEL
        </p>
        <h1 className="mt-5 font-display text-4xl font-light uppercase leading-none tracking-tight text-white sm:text-6xl">
          RRC&nbsp;PRIVATE
        </h1>
        <span aria-hidden="true" className="mt-8 block h-px w-24 bg-white/20" />
      </header>

      {/* Структура private-зоны — план разделов */}
      <nav aria-label="Private sections">
        <ul className="flex flex-col">
          {SECTIONS.map((s, i) => (
            <li key={s.key}>
              <div
                aria-disabled="true"
                className={`group flex items-baseline gap-5 border-b border-white/10 py-6 transition-colors duration-500 hover:bg-white/[0.02] sm:gap-10 sm:py-8 ${
                  i === 0 ? 'border-t' : ''
                }`}
              >
                <span className="w-8 shrink-0 font-mono text-[10px] tracking-[0.2em] text-white/35 sm:w-12">
                  {s.num}
                </span>
                <span className="font-display text-lg font-light uppercase tracking-[0.12em] text-white/85 transition-opacity duration-500 group-hover:opacity-100 sm:text-2xl">
                  {s.key}
                </span>
                <span
                  aria-hidden="true"
                  className="ml-auto self-center font-mono text-xs text-white/25 transition-all duration-500 group-hover:translate-x-1 group-hover:text-white/60"
                >
                  &rarr;
                </span>
              </div>
            </li>
          ))}
        </ul>
      </nav>

      {/* Деликатная подпись: разделы наполняются позже */}
      <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.3em] text-white/30 sm:mt-16">
        SECTIONS&nbsp;OPEN&nbsp;SOON&nbsp;—&nbsp;STAY&nbsp;INSIDE
      </p>
    </section>
  );
}
