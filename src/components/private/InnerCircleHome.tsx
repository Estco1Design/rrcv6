'use client';
import Link from 'next/link';
import {useLanguage} from '@/i18n';
import {privateSections,privatePrivileges} from '@/config/private-content';
export function InnerCircleHome(){
 const {language}=useLanguage(),ru=language==='ru';
 return <section className="max-w-5xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
  <h1 className="font-display font-light text-2xl sm:text-4xl tracking-[.04em]">PRIVATE ACCESS</h1>
  <p className="mt-6 max-w-lg text-xs sm:text-sm leading-relaxed text-white/45">{ru?'Закрытая сторона RRC. Процесс, люди и вещи, которые не обязаны попадать в открытую ленту.':'The private side of RRC. Process, people and pieces beyond the public feed.'}</p>
  <nav aria-label={ru?'Разделы PRIVATE ACCESS':'PRIVATE ACCESS sections'} className="mt-14 sm:mt-20">{privateSections.map(s=><Link key={s.slug} href={`/private/${s.slug}`} className="group flex min-h-20 items-center justify-between gap-5 border-t border-white/10 py-5 last:border-b"><span className="font-display font-light text-base sm:text-xl">{ru?s.ru:s.en}</span><span aria-hidden="true" className="text-xs text-white/30 transition-transform group-hover:translate-x-1">↗</span></Link>)}</nav>
  <section className="mt-20 sm:mt-28"><h2 className="font-display font-light text-xl">{ru?'Больше, чем доступ.':'Beyond access.'}</h2><p className="mt-5 max-w-lg text-xs leading-relaxed text-white/40">{ru?'Развиваем закрытое комьюнити бренда. Часть возможностей уже доступна в диалоге с командой; подарки, события и специальные выпуски будем объявлять здесь.':'We are building the brand’s private community. Personal guidance is available through the team; gifts, events and special releases will be announced here.'}</p><div className="mt-10 grid sm:grid-cols-2 gap-x-14 gap-y-9">{privatePrivileges.map(p=><article key={p.id}><h3 className="text-sm text-white/80">{ru?p.ru:p.en}</h3><p className="mt-3 text-xs leading-relaxed text-white/40">{ru?p.descriptionRu:p.descriptionEn}</p></article>)}</div></section>
 </section>;
}
