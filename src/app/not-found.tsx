'use client';
import {useLanguage} from '@/i18n';
import Link from 'next/link';

export default function NotFoundPage() {
 const {language} = useLanguage(); const ru = language === 'ru';
  return (
    <div className="min-h-screen bg-rrc-black flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-t-micro text-rrc-wine tracking-[0.25em] mb-4">
          ERROR 404
        </p>
        <h1 className="font-display text-3xl md:text-5xl font-medium uppercase tracking-wide text-rrc-white mb-6">
          {ru ? 'СТРАНИЦА НЕ НАЙДЕНА' : 'PAGE NOT FOUND'}
        </h1>
        <p className="text-rrc-off mb-8 max-w-md mx-auto">
          {ru ? 'Запрошенная страница не существует или была перемещена.' : 'The page does not exist or has moved.'}
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center px-6 py-3 text-[11px] font-mono tracking-widest uppercase border border-rrc-line text-rrc-white hover:border-rrc-wine hover:text-rrc-wine transition-colors"
          >
            {ru ? 'КАТАЛОГ' : 'COLLECTION'}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 text-[11px] font-mono tracking-widest uppercase bg-rrc-wine text-rrc-white hover:bg-rrc-bordeaux transition-colors"
          >
            {ru ? 'НА ГЛАВНУЮ' : 'HOME'}
          </Link>
        </div>
      </div>
    </div>
  );
}
