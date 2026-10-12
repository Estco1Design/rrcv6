'use client';
import Link from 'next/link';
import {useLanguage} from '@/i18n';
import {telegramUrl} from '@/config/site';
export function ClosedLevelHome(){
 const {language}=useLanguage();const ru=language==='ru';
 return <section className="mx-auto max-w-[1200px] px-5 md:px-10 py-16 md:py-24">
  <p className="text-xs text-[#c9a5ac] mb-6">RRC / {ru?'Пространство участников':'Member space'}</p>
  <h1 className="font-display font-light text-[clamp(32px,5vw,72px)] leading-[1.1]">{ru?'Закрытый уровень':'Closed level'}</h1>
  <p className="max-w-xl mt-8 text-sm leading-relaxed text-rrc-silver">{ru?'Здесь начинается персональная работа с вашей посадкой. Сохраните мерки в кабинете и свяжитесь с командой, когда будете готовы обсудить вещь.':'Start your personal fit conversation here. Save your measurements in your account and contact the team when you are ready to discuss a piece.'}</p>
  <div className="mt-12 grid md:grid-cols-2 gap-6">
   <section className="border border-rrc-line p-6 md:p-8"><h2 className="font-display text-xl">{ru?'Ваша форма':'Your fit'}</h2><p className="mt-4 text-xs leading-relaxed text-rrc-off">{ru?'3D-инструкция, ваши мерки и предпочтения. Команда увидит профиль только с вашего разрешения. Все данные сохраняются в вашем личном кабинете.':'A 3D measuring guide, your measurements and preferences. The team sees your profile only with your permission. All data is saved in your personal account.'}</p><Link href="/account" className="inline-flex min-h-12 items-center mt-7 border border-rrc-line px-5 text-xs hover:bg-rrc-panel">{ru?'Открыть личный кабинет':'Open personal account'}</Link></section>
   <section className="border border-rrc-line p-6 md:p-8"><h2 className="font-display text-xl">{ru?'Диалог с RRC':'Talk to RRC'}</h2><p className="mt-4 text-xs leading-relaxed text-rrc-off">{ru?'Обсудите силуэт, размер и изготовление с поддержкой. Наличие, сроки и полную стоимость подтверждаем до оплаты.':'Discuss silhouette, size and production with support. Availability, timing and the full price are confirmed before payment.'}</p><a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center mt-7 border border-rrc-line px-5 text-xs hover:bg-rrc-panel">{ru?'Написать команде':'Message the team'} ↗</a></section>
  </div>
  <section className="mt-12 border-t border-rrc-line pt-8"><div className="flex flex-wrap justify-between gap-4"><h2 className="font-display text-xl">{ru?'Закрытые релизы':'Private releases'}</h2><span className="text-xs text-rrc-off">{ru?'Пока не открыты':'Not open yet'}</span></div><p className="mt-4 max-w-xl text-xs text-rrc-off leading-relaxed">{ru?'Ранний доступ и закрытые дропы появятся после объявления команды. Сейчас можно посмотреть открытую коллекцию.':'Early access and private drops will appear after the team announces them. Explore the public collection in the meantime.'}</p><Link href="/shop" className="inline-flex min-h-11 items-center mt-5 text-xs underline underline-offset-4">{ru?'Смотреть коллекцию':'Explore the collection'}</Link></section>
 </section>;
}
