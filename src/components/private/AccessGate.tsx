'use client';
import Link from 'next/link';
import {useLanguage} from '@/i18n';
export function AccessGate(){
 const {language}=useLanguage();const ru=language==='ru';
 return <div className="mx-auto max-w-[1200px] px-5 md:px-10 pt-32 pb-20">
  <Link href="/" className="text-xs text-rrc-off hover:text-rrc-white">{ru?'Вернуться на сайт':'Back to the site'}</Link>
  <div className="grid md:grid-cols-[1.2fr_1fr] gap-12 md:gap-20 mt-12 md:mt-20 items-start">
   <div><p className="text-xs text-[#c9a5ac] mb-6">RRC / {ru?'Для участников':'For members'}</p><h1 className="font-display text-[clamp(32px,5vw,66px)] leading-[1.15] font-light">{ru?'Закрытый уровень':'Closed level'}</h1><p className="mt-8 max-w-lg text-sm text-rrc-silver leading-relaxed">{ru?'Ближе к команде. Точнее к вашей форме. Пространство для персональной работы с посадкой и будущих закрытых релизов.':'Closer to the team. Closer to your fit. A space for personal fit guidance and future private releases.'}</p><p className="mt-5 text-xs max-w-lg text-rrc-off leading-relaxed">{ru?'Сейчас доступны паспорт посадки и связь с поддержкой. Закрытые дропы и ранний доступ откроются после анонса команды.':'Your fit passport and support are available now. Private drops and early access will open after an announcement from the team.'}</p></div>
   <section className="border border-rrc-line p-6 md:p-8"><h2 className="font-display text-xl">{ru?'Один аккаунт. Ваш доступ.':'One account. Your access.'}</h2><p className="mt-5 text-sm text-rrc-off leading-relaxed">{ru?'Закрытый уровень открыт всем зарегистрированным участникам RRC. Войдите в личный кабинет или создайте аккаунт — код приглашения не нужен.':'The closed level is open to every registered RRC member. Sign in to your account or create one — no invitation code is needed.'}</p><Link href="/account" className="mt-8 flex min-h-12 items-center justify-center bg-rrc-white text-rrc-black px-5 py-4 text-xs hover:bg-rrc-silver">{ru?'Войти или создать аккаунт':'Sign in or create an account'}</Link><p className="text-[11px] text-rrc-off mt-6 leading-relaxed">{ru?'После входа откройте закрытый уровень из кабинета. Ваши мерки видны команде только с вашего разрешения.':'After signing in, open the closed level from your account. The team sees your measurements only with your permission.'}</p></section>
  </div>
 </div>;
}
