'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLanguage } from '@/i18n';
import { markPublicExit } from '@/lib/private-session';

/**
 * Приватный header — отдельный от публичного.
 * Минимализм: тонкая нижняя линия, uppercase tracking, никаких карточек.
 *
 * RRC PRIVATE   — идентичность зоны
 * MEMBER ACCESS — статус (декоративный индикатор)
 * EXIT          — возврат на обычный сайт (публичный путь)
 */
export function PrivateHeader() {
  const router = useRouter();
  const { language } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  return (
    <header
      data-rrc-private-header=""
      className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-sm"
    >
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:h-16 sm:px-8">
        {/* Идентичность private-зоны */}
        <Link
          href="/private/home"
          className="font-mono text-[11px] uppercase tracking-[0.3em] text-white transition-opacity duration-300 hover:opacity-70"
        >
          RRC&nbsp;PRIVATE
        </Link>

        {/* Правая часть: статус + выход */}
        <div className="flex items-center gap-5 sm:gap-8">
          <span
            aria-hidden="true"
            className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/45 sm:flex"
          >
            <span className="inline-block h-[5px] w-[5px] rounded-full bg-white/70" />
            MEMBER&nbsp;ACCESS
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true); setError(false);
              try {
                const response = await fetch('/api/private-access/logout', {method: 'POST'});
                if (!response.ok) throw new Error('Logout failed');
                markPublicExit(); router.push('/'); router.refresh();
              } catch { setError(true); } finally { setBusy(false); }
            }}
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/60 transition-colors duration-300 hover:text-white focus-visible:text-white"
          >
            {busy ? "…" : language === "ru" ? "ВЫЙТИ" : "EXIT"}
          </button>
          {error && <span role="alert" className="text-xs text-white/60">{language === 'ru' ? 'Не удалось выйти. Повторите.' : 'Could not sign out. Try again.'}</span>}
        </div>
      </div>
    </header>
  );
}
